import { hasApiKey, hasAnthropicKey, getAnthropicClient, hasGeminiKey, getGeminiModel, hasNvidiaKey, nvidiaGenerate, hasOllamaConfig, ollamaGenerate } from '@/lib/ai-client';
import { resilientCascade } from '@/lib/ai-resilience';
import { measureAiCall } from '@/lib/ai-audit';
import { extractHighFidelityText } from '@/lib/pdf-engine';
import type { AoDetail } from '@/lib/dev';

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

  // Utilisation du nouveau moteur haute fidelite
  const parsed = await extractHighFidelityText(buffer);
  const pdfText = parsed.text;

  if (!pdfText.trim()) {
    throw new Error('Le PDF ne contient pas de texte extractible');
  }

  const truncatedText = pdfText.slice(0, MAX_TEXT_LENGTH);
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
            const result = await model.generateContent(prompt, { signal });
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
          execute: () => nvidiaGenerate(prompt, signal),
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
  let aiParsed;
  try {
    aiParsed = JSON.parse(jsonStr);
  } catch {
    throw new Error('Reponse IA mal formatee');
  }

  const scoreCriteria = (aiParsed.scoreCriteria ?? []).map(
    (c: { label: string; score: number; icon: string; description: string }) => ({
      ...c,
      score: Math.max(0, Math.min(20, Number(c.score) || 0)),
    }),
  );

  const selectionCriteria = aiParsed.selectionCriteria ?? [];
  const weightTotal = selectionCriteria.reduce(
    (sum: number, c: { weight: number }) => sum + (Number(c.weight) || 0),
    0,
  );
  const normalizedCriteria = weightTotal > 0 && weightTotal !== 100
    ? selectionCriteria.map((c: { name: string; weight: number }) => ({
        ...c,
        weight: Math.round((Number(c.weight) / weightTotal) * 100),
      }))
    : selectionCriteria;

  const recommendation = aiParsed.recommendation ?? { verdict: 'maybe', headline: 'A etudier', reasons: [] };
  if (!['go', 'maybe', 'pass'].includes(recommendation.verdict)) {
    recommendation.verdict = 'maybe';
  }

  return {
    scoreCriteria,
    selectionCriteria: normalizedCriteria,
    requiredDocuments: (aiParsed.requiredDocumentsDetailed ?? []).map((d: { name: string }) => d.name),
    aiSummary: aiParsed.aiSummary ?? '',
    technicalPlan: (aiParsed.technicalPlanSections ?? []).map((s: { id: string; title: string }) => `${s.id.replace('sec-', '')}. ${s.title}`),
    executiveSummary: aiParsed.executiveSummary ?? '',
    complianceChecklist: aiParsed.complianceChecklist ?? [],
    buyerHistory: aiParsed.buyerHistory ?? [],
    competitors: aiParsed.competitors ?? [],
    recommendation,
    vigilancePoints: aiParsed.vigilancePoints ?? [],
    technicalPlanSections: aiParsed.technicalPlanSections ?? [],
    requiredDocumentsDetailed: aiParsed.requiredDocumentsDetailed ?? [],
  } as AoDetail;
}
