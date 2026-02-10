import {
  hasGeminiKey, getGeminiModel,
  hasAnthropicKey, getAnthropicClient,
  hasNvidiaKey, nvidiaStream,
} from '@/lib/ai-client';
import { measureAiCall } from '@/lib/ai-audit';
import { jsonToToon } from '@/lib/toon';
import { getRelevantContext } from '@/lib/rag';

// ─── Types ───

export interface MemoireSection {
  id: string;
  title: string;
  buyerExpectation: string;
}

export interface MemoireInput {
  noticeId?: string;
  userEmail: string;
  sections: MemoireSection[];
  companyProfile: {
    companyName: string;
    sectors: string[];
    references: { client: string; title: string; amount: string; period: string }[];
    team: { name: string; role: string; certifications: string[]; experience: number }[];
    caN1: string;
    caN2: string;
    caN3: string;
  };
  dceContext: string;
  options: {
    tone: 'formal' | 'standard';
    length: 'short' | 'medium' | 'detailed';
  };
}

export type MemoireEvent =
  | { type: 'section_start'; sectionId: string; index: number; title: string }
  | { type: 'chunk'; sectionId: string; text: string }
  | { type: 'section_done'; sectionId: string; wordCount: number }
  | { type: 'section_error'; sectionId: string; error: string }
  | { type: 'all_done'; totalSections: number; successCount: number; totalWords: number };

// ─── Helpers ───

function countWords(text: string): number {
  return text.split(/\s+/).filter(Boolean).length;
}

function buildToneInstruction(tone: 'formal' | 'standard'): string {
  return tone === 'formal'
    ? 'Ton tres formel et administratif (ex: "La societe X presente ci-apres les moyens qu\'elle entend mobiliser...").'
    : 'Ton professionnel et direct (ex: "Notre equipe deploie une methodologie eprouvee...").';
}

function buildLengthInstruction(length: 'short' | 'medium' | 'detailed'): string {
  if (length === 'short') return 'Longueur cible : 150-200 mots. Sois synthetique, va a l\'essentiel.';
  if (length === 'detailed') return 'Longueur cible : 400-500 mots. Developpe chaque point avec des exemples concrets.';
  return 'Longueur cible : 250-350 mots. Equilibre entre precision et concision.';
}

function buildPrompt(
  section: MemoireSection,
  profileToon: string,
  dceContext: string,
  ragStrategy: string,
  previousSummaries: { title: string; summary: string }[],
  toneInstruction: string,
  lengthInstruction: string,
): string {
  let previousContext = '';
  if (previousSummaries.length > 0) {
    previousContext = `\n\n**Sections precedentes du memoire (pour coherence de style et contenu)** :\n${
      previousSummaries.map((s) => `- ${s.title} : ${s.summary}`).join('\n')
    }\n`;
  }

  return `Tu es un expert en redaction de memoires techniques pour les marches publics francais.

Redige la section "${section.title}" d'un memoire technique.

**${ragStrategy === 'rag' ? 'Extraits pertinents du DCE' : 'Contexte du marche (DCE)'}** :
${dceContext}

**Attente de l'acheteur pour cette section** :
${section.buyerExpectation}

**Profil de l'entreprise** (format TOON — donnees tabulaires compactes) :
${profileToon}${previousContext}
**Instructions** :
${toneInstruction}
${lengthInstruction}
- Personnalise avec les donnees reelles de l'entreprise (nom, CA, references, equipe)
- Structure avec des **titres en gras** et des puces pour la lisibilite
- Cite des chiffres concrets : montants de references, annees d'experience, nombre de certifications
- Reponds directement aux attentes de l'acheteur — chaque paragraphe doit adresser un point specifique
- INTERDIT : n'invente aucune donnee, certification ou reference non fournie ci-dessus
- Format : Markdown simple (gras, puces, sous-titres). Pas de tableaux. Pas de code.`;
}

// ─── Streaming Provider Cascade ───

async function* streamWithCascade(
  prompt: string,
  signal: AbortSignal,
): AsyncGenerator<string> {
  const providers: Array<{
    name: string;
    available: () => boolean;
    stream: () => AsyncGenerator<string>;
  }> = [
    {
      name: 'gemini',
      available: hasGeminiKey,
      stream: async function* () {
        const model = getGeminiModel();
        const result = await model.generateContentStream(prompt, { signal });
        for await (const chunk of result.stream) {
          if (signal.aborted) return;
          const text = chunk.text();
          if (text) yield text;
        }
      },
    },
    {
      name: 'anthropic',
      available: hasAnthropicKey,
      stream: async function* () {
        const client = getAnthropicClient();
        const stream = await client.messages.stream({
          model: 'claude-sonnet-4-5-20250929',
          max_tokens: 2000,
          messages: [{ role: 'user', content: prompt }],
        }, { signal });
        for await (const event of stream) {
          if (signal.aborted) return;
          if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
            yield event.delta.text;
          }
        }
      },
    },
    {
      name: 'nvidia',
      available: hasNvidiaKey,
      stream: async function* () {
        const body = await nvidiaStream(prompt, signal);
        const decoder = new TextDecoder();
        const reader = body.getReader();
        let buffer = '';
        while (true) {
          if (signal.aborted) return;
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
              if (content) yield content;
            } catch { /* skip malformed chunk */ }
          }
        }
      },
    },
  ];

  let hasYielded = false;

  for (const provider of providers) {
    if (!provider.available() || signal.aborted) continue;

    hasYielded = false;
    try {
      for await (const chunk of provider.stream()) {
        hasYielded = true;
        yield chunk;
      }
      return; // Success — exit cascade
    } catch (err) {
      if (hasYielded) throw err; // Mid-stream failure — can't retry
      // Pre-stream failure — try next provider
    }
  }

  throw new Error('Aucun provider IA disponible');
}

// ─── Main Orchestrator ───

export async function* generateFullMemoire(
  input: MemoireInput,
  signal: AbortSignal,
): AsyncGenerator<MemoireEvent> {
  const previousOutputs: Map<string, { title: string; text: string }> = new Map();
  let totalWords = 0;
  let successCount = 0;

  const profileToon = jsonToToon({
    nom: input.companyProfile.companyName,
    secteurs: input.companyProfile.sectors.join(', '),
    ca: { n1: input.companyProfile.caN1, n2: input.companyProfile.caN2, n3: input.companyProfile.caN3 },
    references: input.companyProfile.references.map((r) => ({
      titre: r.title, client: r.client, montant: r.amount, periode: r.period,
    })),
    equipe: input.companyProfile.team.map((t) => ({
      nom: t.name, role: t.role, experience: t.experience, certifications: (t.certifications ?? []).join(' / '),
    })),
  });

  const toneInstruction = buildToneInstruction(input.options.tone);
  const lengthInstruction = buildLengthInstruction(input.options.length);

  for (let i = 0; i < input.sections.length; i++) {
    if (signal.aborted) break;

    const section = input.sections[i];
    yield { type: 'section_start', sectionId: section.id, index: i, title: section.title };

    try {
      // Get RAG context for this section
      let safeDceContext: string;
      let ragStrategy = 'fallback';
      if (input.noticeId && input.dceContext) {
        const ragResult = await getRelevantContext({
          noticeId: input.noticeId,
          userEmail: input.userEmail,
          query: `${section.title} ${section.buyerExpectation}`,
          fullText: input.dceContext,
          topK: 6,
        });
        safeDceContext = ragResult.context;
        ragStrategy = ragResult.strategy;
      } else {
        safeDceContext = input.dceContext.slice(0, 15000);
      }

      // Build previous section summaries for coherence
      const previousSummaries = Array.from(previousOutputs.entries()).map(
        ([, { title, text }]) => ({ title, summary: text.slice(0, 300) }),
      );

      const prompt = buildPrompt(
        section, profileToon, safeDceContext, ragStrategy,
        previousSummaries, toneInstruction, lengthInstruction,
      );

      const audit = measureAiCall('generate_section', 'cascade', 'streaming');
      let fullText = '';

      for await (const chunk of streamWithCascade(prompt, signal)) {
        fullText += chunk;
        yield { type: 'chunk', sectionId: section.id, text: chunk };
      }

      audit.finish({ success: true });

      const wordCount = countWords(fullText);
      totalWords += wordCount;
      successCount++;
      previousOutputs.set(section.id, { title: section.title, text: fullText });

      yield { type: 'section_done', sectionId: section.id, wordCount };
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erreur inconnue';
      yield { type: 'section_error', sectionId: section.id, error: msg };
    }
  }

  yield { type: 'all_done', totalSections: input.sections.length, successCount, totalWords };
}
