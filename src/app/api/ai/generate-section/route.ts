import { NextRequest } from 'next/server';
import { hasApiKey, hasGeminiKey, getGeminiModel, hasAnthropicKey, getAnthropicClient, hasNvidiaKey, nvidiaStream } from '@/lib/ai-client';

interface GenerateBody {
  sectionTitle: string;
  buyerExpectation: string;
  dceContext: string;
  companyProfile: {
    companyName: string;
    sectors: string[];
    references: { client: string; title: string; amount: string; period: string }[];
    team: { name: string; role: string; certifications: string[]; experience: number }[];
    caN1: string;
    caN2: string;
    caN3: string;
  };
  options?: {
    tone?: 'formal' | 'standard';
    length?: 'short' | 'medium' | 'detailed';
  };
}

export async function POST(request: NextRequest) {
  try {
    if (!hasApiKey()) {
      return new Response(
        JSON.stringify({ error: 'Aucune cle API configuree (GEMINI_API_KEY ou ANTHROPIC_API_KEY)' }),
        { status: 503, headers: { 'Content-Type': 'application/json' } },
      );
    }

    const body: GenerateBody = await request.json();
    const { sectionTitle, buyerExpectation, dceContext, companyProfile, options } = body;

    if (!sectionTitle || !buyerExpectation) {
      return new Response(JSON.stringify({ error: 'Parametres manquants' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const toneInstruction = options?.tone === 'formal'
      ? 'Utilise un ton tres formel, style administratif francais.'
      : 'Utilise un ton professionnel mais accessible.';

    const lengthInstruction = options?.length === 'short'
      ? 'Redige une reponse concise de 150-200 mots.'
      : options?.length === 'detailed'
        ? 'Redige une reponse detaillee de 400-500 mots.'
        : 'Redige une reponse de 250-350 mots.';

    const referencesText = companyProfile.references
      .map((r) => `- ${r.title} pour ${r.client} (${r.amount}, ${r.period})`)
      .join('\n');

    const teamText = companyProfile.team
      .map((t) => `- ${t.name}, ${t.role}, ${t.experience} ans d'experience, certifications: ${t.certifications.join(', ')}`)
      .join('\n');

    const prompt = `Tu es un expert en redaction de memoires techniques pour les marches publics francais.

Redige la section "${sectionTitle}" d'un memoire technique.

**Contexte du marche (DCE)** :
${dceContext}

**Attente de l'acheteur pour cette section** :
${buyerExpectation}

**Profil de l'entreprise** :
- Nom : ${companyProfile.companyName}
- Secteurs : ${companyProfile.sectors.join(', ')}
- CA : ${companyProfile.caN1} (N-1), ${companyProfile.caN2} (N-2), ${companyProfile.caN3} (N-3)
- References :
${referencesText}
- Equipe :
${teamText}

**Instructions** :
${toneInstruction}
${lengthInstruction}
- Personnalise avec les donnees reelles de l'entreprise ci-dessus
- Utilise des puces et du gras pour structurer
- Inclus des chiffres concrets et verifiables
- Adapte le contenu aux attentes specifiques de l'acheteur
- N'invente pas de donnees — utilise uniquement les informations fournies`;

    const encoder = new TextEncoder();

    if (hasGeminiKey()) {
      const model = getGeminiModel();
      const result = await model.generateContentStream(prompt);

      const readable = new ReadableStream({
        async start(controller) {
          try {
            for await (const chunk of result.stream) {
              const text = chunk.text();
              if (text) {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`));
              }
            }
            controller.enqueue(encoder.encode('data: [DONE]\n\n'));
            controller.close();
          } catch (err) {
            const msg = err instanceof Error ? err.message : 'Erreur streaming';
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: msg })}\n\n`));
            controller.close();
          }
        },
      });

      return new Response(readable, {
        headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive' },
      });
    }

    if (hasAnthropicKey()) {
      const client = getAnthropicClient();
      const stream = await client.messages.stream({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 2000,
        messages: [{ role: 'user', content: prompt }],
      });

      const readable = new ReadableStream({
        async start(controller) {
          try {
            for await (const event of stream) {
              if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: event.delta.text })}\n\n`));
              }
            }
            controller.enqueue(encoder.encode('data: [DONE]\n\n'));
            controller.close();
          } catch (err) {
            const msg = err instanceof Error ? err.message : 'Erreur streaming';
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: msg })}\n\n`));
            controller.close();
          }
        },
      });

      return new Response(readable, {
        headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive' },
      });
    }

    if (hasNvidiaKey()) {
      const nvidiaBody = await nvidiaStream(prompt);
      const decoder = new TextDecoder();

      const readable = new ReadableStream({
        async start(controller) {
          try {
            const reader = nvidiaBody.getReader();
            let buffer = '';
            while (true) {
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
                  if (content) {
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: content })}\n\n`));
                  }
                } catch { /* skip malformed chunks */ }
              }
            }
            controller.enqueue(encoder.encode('data: [DONE]\n\n'));
            controller.close();
          } catch (err) {
            const msg = err instanceof Error ? err.message : 'Erreur streaming NVIDIA';
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: msg })}\n\n`));
            controller.close();
          }
        },
      });

      return new Response(readable, {
        headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive' },
      });
    }

    return new Response(
      JSON.stringify({ error: 'Aucun provider IA disponible' }),
      { status: 503, headers: { 'Content-Type': 'application/json' } },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur interne';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
