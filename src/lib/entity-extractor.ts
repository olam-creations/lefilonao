import { z } from 'zod';
import { hasGeminiKey, getGeminiModel, hasNvidiaKey, nvidiaGenerate, hasOllamaConfig, ollamaGenerate } from '@/lib/ai-client';
import { resilientCascade } from '@/lib/ai-resilience';
import type { ExtractedEntities } from '@/lib/dev';

const MAX_ENTITY_TEXT = 20_000;

const LotSchema = z.object({
  number: z.string(),
  title: z.string(),
});

const ContactSchema = z.object({
  name: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
});

const ExtractedEntitiesSchema = z.object({
  cpvCodes: z.array(z.string()).default([]),
  siretNumbers: z.array(z.string()).default([]),
  budgetAmounts: z.array(z.string()).default([]),
  deadlines: z.array(z.string()).default([]),
  buyerNames: z.array(z.string()).default([]),
  lots: z.array(LotSchema).default([]),
  contacts: z.array(ContactSchema).default([]),
});

const ENTITY_PROMPT = `Tu es un extracteur d'entites pour les marches publics francais.
Extrais les entites structurees suivantes du texte DCE ci-dessous.
Retourne UNIQUEMENT du JSON valide, sans markdown ni commentaires.

Texte DCE :
---
{TEXT}
---

Format JSON attendu :
{
  "cpvCodes": ["72000000-5"],
  "siretNumbers": ["12345678901234"],
  "budgetAmounts": ["150 000 EUR HT"],
  "deadlines": ["2026-03-15 12:00"],
  "buyerNames": ["Commune de Lyon"],
  "lots": [{"number": "1", "title": "Fourniture logiciel"}],
  "contacts": [{"name": "M. Dupont", "email": "contact@ville.fr", "phone": "01 23 45 67 89"}]
}

Regles :
- cpvCodes : codes CPV (format XX000000-X), tous ceux trouves
- siretNumbers : numeros SIRET (14 chiffres) ou SIREN (9 chiffres)
- budgetAmounts : montants en euros trouves (budget estimatif, valeur du marche)
- deadlines : dates limites (depot, execution, demarrage) au format ISO ou texte
- buyerNames : noms des acheteurs / pouvoirs adjudicateurs
- lots : lots identifies avec numero et titre
- contacts : personnes ou services de contact avec coordonnees
- Si une categorie est absente du texte, retourne un tableau vide []`;

/**
 * Extract structured entities from DCE text using AI cascade.
 * Non-critical: returns undefined on failure instead of throwing.
 */
export async function extractEntities(
  text: string,
  signal?: AbortSignal,
): Promise<ExtractedEntities | undefined> {
  if (!text.trim()) return undefined;

  const truncated = text.slice(0, MAX_ENTITY_TEXT);
  const prompt = ENTITY_PROMPT.replace('{TEXT}', truncated);

  let rawText: string;
  try {
    rawText = await resilientCascade<string>(
      [
        {
          name: 'nvidia',
          available: hasNvidiaKey,
          execute: () => nvidiaGenerate(prompt, signal),
        },
        {
          name: 'gemini',
          available: hasGeminiKey,
          execute: async () => {
            const model = getGeminiModel();
            const result = await model.generateContent(prompt, { signal });
            return result.response.text();
          },
        },
        {
          name: 'ollama',
          available: hasOllamaConfig,
          execute: () => ollamaGenerate(prompt, signal),
        },
      ],
      signal,
    );
  } catch {
    return undefined;
  }

  if (!rawText) return undefined;

  try {
    const jsonStr = rawText.trim().replace(/^```json\n?/, '').replace(/\n?```$/, '');
    const parsed = JSON.parse(jsonStr);
    return ExtractedEntitiesSchema.parse(parsed);
  } catch {
    return undefined;
  }
}
