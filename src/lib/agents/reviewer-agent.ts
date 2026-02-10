import { z } from 'zod';
import { hasGeminiKey, getGeminiModel, hasNvidiaKey, nvidiaGenerate, hasOllamaConfig, ollamaGenerate } from '@/lib/ai-client';
import { resilientCascade } from '@/lib/ai-resilience';
import { jsonToToon } from '@/lib/toon';
import type { ParsedDce, WrittenSection, ReviewResult } from './types';

const ReviewSchema = z.object({
  completenessScore: z.number().min(0).max(100),
  suggestions: z.array(z.object({
    sectionId: z.string().nullable(),
    type: z.enum(['tip', 'warning', 'missing']),
    message: z.string(),
  })).default([]),
  overallAdvice: z.string(),
});

function buildReviewerPrompt(parsed: ParsedDce, sections: WrittenSection[]): string {
  const sectionsToon = jsonToToon(sections.map((s) => ({
    id: s.sectionId,
    titre: s.title,
    mots: s.wordCount,
    extrait: s.content.slice(0, 500),
  })));

  const criteriaToon = jsonToToon(parsed.criteria.map((c) => ({
    critere: c.name,
    poids: `${c.weight}%`,
  })));

  return `Tu es un reviewer expert de memoires techniques pour les marches publics francais.
Evalue la qualite et la completude de ce memoire technique.
Les donnees sont en format TOON (tabulaire compact).

**Criteres de selection** :
${criteriaToon}

**Documents requis** : ${parsed.documents.filter((d) => d.isCritical).map((d) => d.name).join(', ')}

**Sections du memoire** :
${sectionsToon}

Retourne UNIQUEMENT du JSON valide :
{
  "completenessScore": 72,
  "suggestions": [
    {"sectionId": "sec-1", "type": "tip", "message": "Conseil..."},
    {"sectionId": null, "type": "missing", "message": "Element manquant..."}
  ],
  "overallAdvice": "Conseil global en 2-3 phrases"
}

Regles :
- completenessScore 0-100
- types : "tip" (positif), "warning" (attention), "missing" (absent)
- sectionId : id de la section ou null si global
- 5-8 suggestions maximum
- Verifie l'adequation de chaque section avec les poids des criteres`;
}

export async function runReviewer(
  parsed: ParsedDce,
  sections: WrittenSection[],
  signal?: AbortSignal,
): Promise<ReviewResult> {
  const prompt = buildReviewerPrompt(parsed, sections);

  const rawText = await resilientCascade<string>(
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

  const jsonStr = rawText.trim().replace(/^```json\n?/, '').replace(/\n?```$/, '');
  const parsed2 = JSON.parse(jsonStr);
  return ReviewSchema.parse(parsed2);
}
