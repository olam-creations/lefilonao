import { z } from 'zod';
import { hasNvidiaKey, nvidiaGenerate, hasGeminiKey, getGeminiModel, hasOllamaConfig, ollamaGenerate } from '@/lib/ai-client';
import { resilientCascade } from '@/lib/ai-resilience';
import type { ParsedDce } from './types';

const ParsedDceSchema = z.object({
  lots: z.array(z.object({
    number: z.string(),
    title: z.string(),
    estimatedAmount: z.number().optional(),
  })).default([]),
  criteria: z.array(z.object({
    name: z.string(),
    weight: z.number(),
  })).default([]),
  documents: z.array(z.object({
    name: z.string(),
    isCritical: z.boolean(),
  })).default([]),
  deadlines: z.array(z.object({
    type: z.string(),
    date: z.string(),
  })).default([]),
  buyerName: z.string().default(''),
  buyerSiret: z.string().optional(),
  cpvCodes: z.array(z.string()).default([]),
  procedureType: z.string().default(''),
  estimatedBudget: z.number().optional(),
  executionDuration: z.string().optional(),
});

const PARSER_PROMPT = `Tu es un extracteur structurel de DCE (Dossier de Consultation des Entreprises) pour les marches publics francais.
Extrais la structure du document suivant. Retourne UNIQUEMENT du JSON valide.

Texte DCE :
---
{TEXT}
---

Format JSON :
{
  "lots": [{"number": "1", "title": "Titre lot", "estimatedAmount": 50000}],
  "criteria": [{"name": "Prix", "weight": 60}],
  "documents": [{"name": "DC1", "isCritical": true}],
  "deadlines": [{"type": "depot", "date": "2026-03-15 12:00"}],
  "buyerName": "Nom acheteur",
  "buyerSiret": "12345678901234",
  "cpvCodes": ["72000000-5"],
  "procedureType": "appel_offres",
  "estimatedBudget": 150000,
  "executionDuration": "24 mois"
}

Regles :
- Poids (weight) : entiers positifs totalisant 100
- Documents critiques : DC1, DC2, memoire technique, attestations
- procedureType : appel_offres, marche_negocie, accord_cadre, dialogue_competitif
- Si une information est absente, omets le champ ou retourne un tableau vide`;

const MAX_PARSER_TEXT = 30000;

export async function runParser(pdfText: string, signal?: AbortSignal): Promise<ParsedDce> {
  const truncated = pdfText.slice(0, MAX_PARSER_TEXT);
  const prompt = PARSER_PROMPT.replace('{TEXT}', truncated);

  const rawText = await resilientCascade<string>(
    [
      { name: 'nvidia', available: hasNvidiaKey, execute: () => nvidiaGenerate(prompt, signal) },
      { name: 'gemini', available: hasGeminiKey, execute: async () => {
        const model = getGeminiModel();
        const result = await model.generateContent(prompt, { signal });
        return result.response.text();
      }},
      { name: 'ollama', available: hasOllamaConfig, execute: () => ollamaGenerate(prompt, signal) },
    ],
    signal,
  );

  const jsonStr = rawText.trim().replace(/^```json\n?/, '').replace(/\n?```$/, '');
  const parsed = JSON.parse(jsonStr);
  return ParsedDceSchema.parse(parsed);
}
