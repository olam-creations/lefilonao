import { NextRequest } from 'next/server';
import { hasApiKey, hasGeminiKey, getGeminiModel, hasAnthropicKey, getAnthropicClient, hasNvidiaKey, nvidiaStream } from '@/lib/ai-client';
import { measureAiCall } from '@/lib/ai-audit';
import { jsonToToon } from '@/lib/toon';
import { requireAuth } from '@/lib/require-auth';
import { requireFeature } from '@/lib/require-plan';
import { rateLimit, AI_LIMIT } from '@/lib/rate-limit';

import { generateSectionSchema, parseBody, type GenerateSectionInput } from '@/lib/validators';
import { getRelevantContext } from '@/lib/rag';

// Vercel Pro: allow up to 60s for LLM streaming generation
export const maxDuration = 60;

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  const limited = await rateLimit(request, AI_LIMIT);
  if (limited) return new Response(JSON.stringify({ error: 'Trop de requêtes' }), { status: 429 });

  const auth = requireAuth(request);
  if (!auth.ok) return new Response(JSON.stringify({ error: 'Non authentifié' }), { status: 401 });

  const gated = await requireFeature(auth.auth.email, 'generate-section');
  if (gated) return gated;

  try {
    if (!hasApiKey()) {
      return new Response(
        JSON.stringify({ error: 'Aucune cle API configuree (GEMINI_API_KEY ou ANTHROPIC_API_KEY)' }),
        { status: 503, headers: { 'Content-Type': 'application/json' } },
      );
    }

    const raw = await request.json();
    const parsed = parseBody(generateSectionSchema, raw);
    if (!parsed.ok) return parsed.response;
    const { sectionTitle, buyerExpectation, dceContext, companyProfile, options, noticeId } = parsed.data;

    // Use RAG context if document is indexed, otherwise fallback to truncated full text
    let safeDceContext: string;
    let ragStrategy = 'fallback';
    if (noticeId && dceContext) {
      const ragResult = await getRelevantContext({
        noticeId,
        userEmail: auth.auth.email,
        query: `${sectionTitle} ${buyerExpectation}`,
        fullText: dceContext,
        topK: 8,
      });
      safeDceContext = ragResult.context;
      ragStrategy = ragResult.strategy;
    } else {
      safeDceContext = dceContext.slice(0, 15000);
    }

    const toneInstruction = options?.tone === 'formal'
      ? 'Ton tres formel et administratif (ex: "La societe X presente ci-apres les moyens qu\'elle entend mobiliser...").'
      : 'Ton professionnel et direct (ex: "Notre equipe deploie une methodologie eprouvee...").';

    const lengthInstruction = options?.length === 'short'
      ? 'Longueur cible : 150-200 mots. Sois synthetique, va a l\'essentiel.'
      : options?.length === 'detailed'
        ? 'Longueur cible : 400-500 mots. Developpe chaque point avec des exemples concrets.'
        : 'Longueur cible : 250-350 mots. Equilibre entre precision et concision.';

    const profileToon = jsonToToon({
      nom: companyProfile.companyName,
      secteurs: companyProfile.sectors.join(', '),
      ca: { n1: companyProfile.caN1, n2: companyProfile.caN2, n3: companyProfile.caN3 },
      references: (companyProfile.references ?? []).map((r) => ({
        titre: r.title, client: r.client, montant: r.amount, periode: r.period,
      })),
      equipe: (companyProfile.team ?? []).map((t) => ({
        nom: t.name, role: t.role, experience: t.experience, certifications: (t.certifications ?? []).join(' / '),
      })),
    });

    const prompt = `Tu es un expert en redaction de memoires techniques pour les marches publics francais.

Redige la section "${sectionTitle}" d'un memoire technique.

**${ragStrategy === 'rag' ? 'Extraits pertinents du DCE' : 'Contexte du marche (DCE)'}** :
${safeDceContext}

**Attente de l'acheteur pour cette section** :
${buyerExpectation}

**Profil de l'entreprise** (format TOON — donnees tabulaires compactes) :
${profileToon}

**Instructions** :
${toneInstruction}
${lengthInstruction}
- Personnalise avec les donnees reelles de l'entreprise (nom, CA, references, equipe)
- Structure avec des **titres en gras** et des puces pour la lisibilite
- Cite des chiffres concrets : montants de references, annees d'experience, nombre de certifications
- Reponds directement aux attentes de l'acheteur — chaque paragraphe doit adresser un point specifique
- INTERDIT : n'invente aucune donnee, certification ou reference non fournie ci-dessus
- Format : Markdown simple (gras, puces, sous-titres). Pas de tableaux. Pas de code.`;

    const encoder = new TextEncoder();
    const sseHeaders = { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive' };
    const { signal } = request;

    async function streamGemini(ctrl: ReadableStreamDefaultController<Uint8Array>) {
      const model = getGeminiModel();
      const result = await model.generateContentStream(prompt, { signal });
      for await (const chunk of result.stream) {
        if (signal.aborted) break;
        const text = chunk.text();
        if (text) ctrl.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`));
      }
    }

    async function streamAnthropic(ctrl: ReadableStreamDefaultController<Uint8Array>) {
      const client = getAnthropicClient();
      const stream = await client.messages.stream({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 2000,
        messages: [{ role: 'user', content: prompt }],
      }, { signal });
      for await (const event of stream) {
        if (signal.aborted) break;
        if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
          ctrl.enqueue(encoder.encode(`data: ${JSON.stringify({ text: event.delta.text })}\n\n`));
        }
      }
    }

    async function streamNvidia(ctrl: ReadableStreamDefaultController<Uint8Array>) {
      const nvidiaBody = await nvidiaStream(prompt, signal);
      const decoder = new TextDecoder();
      const reader = nvidiaBody.getReader();
      let buffer = '';
      while (true) {
        if (signal.aborted) break;
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';
        for (const line of lines) {
          if (!line.startsWith('data: ') || line === 'data: [DONE]') continue;
          try {
            const parsed = JSON.parse(line.slice(6));
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) ctrl.enqueue(encoder.encode(`data: ${JSON.stringify({ text: content })}\n\n`));
          } catch { /* skip malformed chunk */ }
        }
      }
    }

    // Stream providers one at a time — NO cascade once data flows.
    // If Provider 1 fails BEFORE any chunk, try Provider 2.
    // Once the first chunk is sent, fail fast (no fallback = no garbled output).
    const streamProviders: { name: string; available: () => boolean; stream: (ctrl: ReadableStreamDefaultController<Uint8Array>) => Promise<void> }[] = [
      { name: 'gemini', available: hasGeminiKey, stream: streamGemini },
      { name: 'anthropic', available: hasAnthropicKey, stream: streamAnthropic },
      { name: 'nvidia', available: hasNvidiaKey, stream: streamNvidia },
    ];

    const readable = new ReadableStream({
      async start(controller) {
        const audit = measureAiCall('generate_section', 'cascade', 'streaming');
        let hasStartedStreaming = false;

        // Wrap the controller to track when data first flows
        const trackedController: ReadableStreamDefaultController<Uint8Array> = {
          desiredSize: controller.desiredSize,
          close: () => controller.close(),
          error: (e) => controller.error(e),
          enqueue: (chunk) => {
            hasStartedStreaming = true;
            controller.enqueue(chunk);
          },
        } as ReadableStreamDefaultController<Uint8Array>;

        const errors: { provider: string; error: string }[] = [];
        let succeeded = false;

        for (const provider of streamProviders) {
          if (!provider.available() || signal.aborted) continue;

          hasStartedStreaming = false;
          try {
            await provider.stream(trackedController);
            succeeded = true;
            break;
          } catch (err) {
            const msg = err instanceof Error ? err.message : 'Unknown';
            errors.push({ provider: provider.name, error: msg });

            if (hasStartedStreaming) {
              // Data already sent to client — cannot retry without garbling output
              audit.finish({ success: false, error: `${provider.name} failed mid-stream: ${msg}` });
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: 'Le provider IA a echoue en cours de generation. Veuillez reessayer.' })}\n\n`));
              controller.enqueue(encoder.encode('data: [DONE]\n\n'));
              controller.close();
              return;
            }
            // No data sent yet — safe to try next provider
          }
        }

        if (succeeded) {
          audit.finish({ success: true });
        } else if (!signal.aborted) {
          const msg = errors.map((e) => `${e.provider}: ${e.error}`).join(', ');
          audit.finish({ success: false, error: msg });
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: 'Service IA temporairement indisponible' })}\n\n`));
        }

        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        controller.close();
      },
    });

    return new Response(readable, { headers: sseHeaders });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Une erreur est survenue' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
