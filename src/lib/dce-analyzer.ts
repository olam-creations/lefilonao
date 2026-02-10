import { z } from 'zod';
import { hasApiKey, hasAnthropicKey, getAnthropicClient, hasGeminiKey, getGeminiModel, hasNvidiaKey, nvidiaGenerate, hasOllamaConfig, ollamaGenerate } from '@/lib/ai-client';
import { resilientCascade } from '@/lib/ai-resilience';
import { measureAiCall } from '@/lib/ai-audit';
import { extractHighFidelityText, extractTablesFromPdf } from '@/lib/pdf-engine';
import { extractEntities } from '@/lib/entity-extractor';
import type { AoDetail } from '@/lib/dev';
import type { ExtractedTable } from '@/lib/pdf-engine';

// Schema de validation strict pour l'IA
const AoDetailSchema = z.object({
  aiSummary: z.string(),
  executiveSummary: z.string(),
  selectionCriteria: z.array(z.object({
    name: z.string(),
    weight: z.number()
  })),
  scoreCriteria: z.array(z.object({
    label: z.string(),
    score: z.number(),
    icon: z.string(),
    description: z.string()
  })),
  vigilancePoints: z.array(z.object({
    type: z.enum(['risk', 'warning', 'opportunity']),
    title: z.string(),
    description: z.string()
  })),
  technicalPlanSections: z.array(z.object({
    id: z.string(),
    title: z.string(),
    buyerExpectation: z.string(),
    aiDraft: z.string(),
    wordCount: z.number()
  })),
  requiredDocumentsDetailed: z.array(z.object({
    name: z.string(),
    hint: z.string(),
    isCritical: z.boolean(),
    category: z.string()
  })),
  complianceChecklist: z.array(z.string()),
  recommendation: z.object({
    verdict: z.enum(['go', 'maybe', 'pass']),
    headline: z.string(),
    reasons: z.array(z.string())
  }),
  buyerHistory: z.array(z.any()).default([]),
  competitors: z.array(z.any()).default([])
});

const DCE_PROMPT = `Tu es un expert en marches publics francais. Analyse ce DCE (Dossier de Consultation des Entreprises) et extrais les informations au format JSON strict.

Texte du DCE (extrait avec preservation de layout) :
---
{TEXT}
---

Reponds UNIQUEMENT avec un JSON valide (pas de markdown, pas de commentaires) suivant cette structure exacte :
{
  "aiSummary": "Resume du marche en 3-4 phrases",
  "executiveSummary": "Resume executif pour la direction en 2 phrases",
  "selectionCriteria": [{"name": "Nom du critere", "weight": 60}],
  "scoreCriteria": [{"label": "Eligibilite", "score": 15, "icon": "Shield", "description": "Explication"}],
  "vigilancePoints": [{"type": "risk|warning|opportunity", "title": "Titre", "description": "Detail"}],
  "technicalPlanSections": [{"id": "sec-1", "title": "Titre section", "buyerExpectation": "Attente acheteur", "aiDraft": "Brouillon IA", "wordCount": 80}],
  "requiredDocumentsDetailed": [{"name": "Nom", "hint": "Conseil", "isCritical": true, "category": "profile|ao-specific"}],
  "complianceChecklist": ["Element 1", "Element 2"],
  "recommendation": {"verdict": "go|maybe|pass", "headline": "Titre", "reasons": ["Raison 1"]},
  "buyerHistory": [],
  "competitors": []
}

Regles strictes :
- Les scores sont des entiers de 0 a 20 (ex: 14, pas 14.5)
- Les poids (weight) sont des entiers positifs et totalisent exactement 100
- Genere exactement 5 scoreCriteria dans cet ordre : Eligibilite, Alignement, Rentabilite, Concurrence, Delais
- Genere 5-7 technicalPlanSections avec des id sequentiels (sec-1, sec-2...) et aiDraft de 50-100 mots
- Les icons possibles : Shield, Target, TrendingUp, Users, Clock (une par scoreCriteria dans cet ordre)
- vigilancePoints : 3-5 elements, types strictement parmi "risk", "warning", "opportunity"
- verdict : strictement "go", "maybe" ou "pass" — base sur les informations du DCE uniquement
- IMPORTANT : retourne du JSON brut, sans backticks, sans commentaires, sans texte avant ou apres`;

const MAX_TEXT_LENGTH = 80000;
const MAX_PDF_SIZE = 25 * 1024 * 1024;

/**
 * Attempt to repair truncated JSON by closing unclosed brackets/braces/strings.
 * Handles common AI output truncation where the response hits token limit.
 */
function repairTruncatedJson(json: string): string {
  let s = json.trim();

  // Remove trailing comma before we close
  s = s.replace(/,\s*$/, '');

  // Track open delimiters
  const stack: string[] = [];
  let inString = false;
  let escaped = false;

  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (escaped) { escaped = false; continue; }
    if (c === '\\' && inString) { escaped = true; continue; }

    if (c === '"' && !inString) { inString = true; continue; }
    if (c === '"' && inString) { inString = false; continue; }
    if (inString) continue;

    if (c === '{' || c === '[') stack.push(c);
    if (c === '}' && stack.length > 0 && stack[stack.length - 1] === '{') stack.pop();
    if (c === ']' && stack.length > 0 && stack[stack.length - 1] === '[') stack.pop();
  }

  // Close unclosed string
  if (inString) s += '"';

  // Remove trailing incomplete key-value (e.g. `"key": "incompl`)
  s = s.replace(/,\s*"[^"]*"?\s*:?\s*"?[^"{}[\]]*$/, '');

  // Close unclosed delimiters in reverse order
  while (stack.length > 0) {
    const open = stack.pop();
    s += open === '{' ? '}' : ']';
  }

  return s;
}

export function validatePdfBuffer(buffer: Buffer): void {
  if (!buffer || buffer.length === 0) {
    throw new Error('Le fichier PDF est vide');
  }
  if (buffer.length > MAX_PDF_SIZE) {
    throw new Error('Le fichier ne doit pas depasser 25 Mo');
  }
}

export async function analyzePdfBuffer(buffer: Buffer, signal?: AbortSignal): Promise<AoDetail> {
  if (!hasApiKey() && !hasOllamaConfig()) {
    throw new Error('Aucun service IA configure (Gemini, NVIDIA ou Ollama)');
  }

  validatePdfBuffer(buffer);

  // Extract text and tables in parallel
  const [parsed, extractedTables] = await Promise.all([
    extractHighFidelityText(buffer),
    extractTablesFromPdf(buffer).catch((): ExtractedTable[] => []),
  ]);
  const pdfText = parsed.text;

  if (!pdfText.trim()) {
    throw new Error('Le PDF ne contient pas de texte extractible');
  }

  // Append table data to text for AI context
  let enrichedText = pdfText;
  if (extractedTables.length > 0) {
    const tableText = extractedTables.map((t, i) =>
      `\n--- TABLEAU ${i + 1} (page ${t.pageNumber}) ---\n${t.headers.join(' | ')}\n${t.rows.map((r) => r.join(' | ')).join('\n')}`
    ).join('\n');
    enrichedText = pdfText + tableText;
  }

  const truncatedText = enrichedText.slice(0, MAX_TEXT_LENGTH);
  const prompt = DCE_PROMPT.replace('{TEXT}', truncatedText);

  const audit = measureAiCall('analyze_dce', 'cascade', 'mixed');

  let rawText: string;
  try {
    rawText = await resilientCascade<string>(
      [
        {
          name: 'gemini',
          available: hasGeminiKey,
          execute: async () => {
            const model = getGeminiModel();
            const result = await model.generateContent({
              contents: [{ role: 'user', parts: [{ text: prompt }] }],
              generationConfig: { maxOutputTokens: 16384 },
            });
            return result.response.text();
          },
        },
        {
          name: 'ollama',
          available: hasOllamaConfig,
          execute: () => ollamaGenerate(prompt, signal),
        },
        {
          name: 'nvidia',
          available: hasNvidiaKey,
          execute: () => nvidiaGenerate(prompt, signal, 16000),
        },
        // Anthropic en attente de fonds
        /*
        {
          name: 'anthropic',
          available: hasAnthropicKey,
          execute: async () => {
            const client = getAnthropicClient();
            const message = await client.messages.create({
              model: 'claude-sonnet-4-5-20250929',
              max_tokens: 8000,
              messages: [{ role: 'user', content: prompt }],
            }, { signal });
            const textBlock = message.content.find((b) => b.type === 'text');
            return textBlock?.type === 'text' ? textBlock.text : '';
          },
        },
        */
      ],
      signal,
    );
    audit.finish({ success: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Tous les providers IA ont echoue';
    audit.finish({ success: false, error: msg });
    rawText = '';
  }

  if (!rawText) {
    throw new Error('Reponse IA vide');
  }

  const jsonStr = rawText.trim().replace(/^```json\n?/, '').replace(/\n?```$/, '');

  let validated;
  try {
    const aiParsed = JSON.parse(jsonStr);
    validated = AoDetailSchema.parse(aiParsed);
  } catch (firstErr) {
    // Attempt JSON repair for truncated responses (unclosed brackets/braces)
    try {
      const repaired = repairTruncatedJson(jsonStr);
      const aiParsed = JSON.parse(repaired);
      validated = AoDetailSchema.parse(aiParsed);
    } catch (err) {
      console.error('Zod/JSON Validation Error (after repair):', err);
      throw new Error('La reponse de l\'IA ne respecte pas le format attendu');
    }
  }

  // Normalisation finale
  const selectionCriteria = validated.selectionCriteria;
  const weightTotal = selectionCriteria.reduce((sum, c) => sum + c.weight, 0);
  const normalizedCriteria = weightTotal > 0 && weightTotal !== 100
    ? selectionCriteria.map(c => ({ ...c, weight: Math.round((c.weight / weightTotal) * 100) }))
    : selectionCriteria;

  // Non-blocking entity extraction (fire-and-forget style, awaited but failure-safe)
  const extractedEntities = await extractEntities(pdfText, signal);

  return {
    ...validated,
    selectionCriteria: normalizedCriteria,
    requiredDocuments: validated.requiredDocumentsDetailed.map(d => d.name),
    technicalPlan: validated.technicalPlanSections.map(s => `${s.id.replace('sec-', '')}. ${s.title}`),
    ...(extractedEntities ? { extractedEntities } : {}),
    ...(extractedTables.length > 0 ? { extractedTables } : {}),
  } as AoDetail;
}
