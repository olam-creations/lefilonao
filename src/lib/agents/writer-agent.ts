import { hasGeminiKey, getGeminiModel, hasNvidiaKey, nvidiaGenerate, hasOllamaConfig, ollamaGenerate } from '@/lib/ai-client';
import { resilientCascade } from '@/lib/ai-resilience';
import { jsonToToon } from '@/lib/toon';
import type { ParsedDce, AnalysisResult, CompanyProfileInput, WrittenSection } from './types';

interface WriterInput {
  sectionId: string;
  sectionTitle: string;
  buyerExpectation: string;
  parsed: ParsedDce;
  analysis: AnalysisResult;
  profile: CompanyProfileInput;
  tone: 'formal' | 'standard';
  length: 'short' | 'medium' | 'detailed';
}

function buildWriterPrompt(input: WriterInput): string {
  const { sectionTitle, buyerExpectation, parsed, profile, tone, length } = input;

  const toneInstruction = tone === 'formal'
    ? 'Ton tres formel et administratif.'
    : 'Ton professionnel et direct.';

  const lengthMap = { short: '150-200', medium: '250-350', detailed: '400-500' };
  const lengthInstruction = `Longueur cible : ${lengthMap[length]} mots.`;

  const profileToon = jsonToToon({
    nom: profile.companyName,
    secteurs: profile.sectors.join(', '),
    ca: { n1: profile.caN1, n2: profile.caN2, n3: profile.caN3 },
    references: (profile.references ?? []).map((r) => ({
      titre: r.title, client: r.client, montant: r.amount,
    })),
    equipe: (profile.team ?? []).map((t) => ({
      nom: t.name, role: t.role, certifications: t.certifications.join(' / '),
    })),
  });

  return `Tu es un expert en redaction de memoires techniques pour les marches publics francais.

Redige la section "${sectionTitle}" d'un memoire technique.

**Acheteur** : ${parsed.buyerName}
**Procedure** : ${parsed.procedureType}
**Attente acheteur** : ${buyerExpectation}

**Profil entreprise** (TOON) :
${profileToon}

**Instructions** :
${toneInstruction}
${lengthInstruction}
- Personnalise avec les donnees reelles de l'entreprise
- Structure avec des **titres en gras** et des puces
- Cite des chiffres concrets : montants, annees, certifications
- INTERDIT : n'invente aucune donnee non fournie
- Format : Markdown simple (gras, puces, sous-titres)`;
}

/**
 * Run a single section writer. Returns the complete written section.
 * For streaming support, use runWriterStreaming instead.
 */
export async function runWriter(
  input: WriterInput,
  signal?: AbortSignal,
): Promise<WrittenSection> {
  const prompt = buildWriterPrompt(input);

  const content = await resilientCascade<string>(
    [
      { name: 'gemini', available: hasGeminiKey, execute: async () => {
        const model = getGeminiModel();
        const result = await model.generateContent(prompt, { signal });
        return result.response.text();
      }},
      { name: 'nvidia', available: hasNvidiaKey, execute: () => nvidiaGenerate(prompt, signal) },
      { name: 'ollama', available: hasOllamaConfig, execute: () => ollamaGenerate(prompt, signal) },
    ],
    signal,
  );

  const wordCount = content.split(/\s+/).filter(Boolean).length;

  return {
    sectionId: input.sectionId,
    title: input.sectionTitle,
    content,
    wordCount,
  };
}

/**
 * Run writer with streaming — calls onChunk for each text fragment.
 */
export async function runWriterStreaming(
  input: WriterInput,
  onChunk: (text: string) => void,
  signal?: AbortSignal,
): Promise<WrittenSection> {
  const prompt = buildWriterPrompt(input);
  let fullContent = '';

  if (hasGeminiKey()) {
    try {
      const model = getGeminiModel();
      const result = await model.generateContentStream(prompt, { signal });
      for await (const chunk of result.stream) {
        if (signal?.aborted) break;
        const text = chunk.text();
        if (text) {
          fullContent += text;
          onChunk(text);
        }
      }
    } catch {
      // Fallback to non-streaming
      const section = await runWriter(input, signal);
      onChunk(section.content);
      return section;
    }
  } else {
    const section = await runWriter(input, signal);
    onChunk(section.content);
    return section;
  }

  const wordCount = fullContent.split(/\s+/).filter(Boolean).length;
  return { sectionId: input.sectionId, title: input.sectionTitle, content: fullContent, wordCount };
}
