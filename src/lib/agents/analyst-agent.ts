import { z } from 'zod';
import { hasGeminiKey, getGeminiModel, hasNvidiaKey, nvidiaGenerate, hasOllamaConfig, ollamaGenerate } from '@/lib/ai-client';
import { resilientCascade } from '@/lib/ai-resilience';
import { jsonToToon } from '@/lib/toon';
import type { ParsedDce, MarketIntelligence, AnalysisResult, CompanyProfileInput } from './types';

const AnalysisSchema = z.object({
  recommendation: z.object({
    verdict: z.enum(['go', 'maybe', 'pass']),
    headline: z.string(),
    reasons: z.array(z.string()),
    confidenceScore: z.number().min(0).max(100),
  }),
  scoreCriteria: z.array(z.object({
    label: z.string(),
    score: z.number().min(0).max(20),
    icon: z.string(),
    description: z.string(),
  })),
  vigilancePoints: z.array(z.object({
    type: z.enum(['risk', 'warning', 'opportunity']),
    title: z.string(),
    description: z.string(),
  })),
  strategicAdvice: z.string(),
});

function buildAnalystPrompt(parsed: ParsedDce, intel: MarketIntelligence, profile: CompanyProfileInput): string {
  const dceToon = jsonToToon({
    acheteur: parsed.buyerName,
    procedure: parsed.procedureType,
    budget: parsed.estimatedBudget ?? 'inconnu',
    lots: parsed.lots.length,
    criteres: parsed.criteria.map((c) => ({ nom: c.name, poids: `${c.weight}%` })),
    delais: parsed.deadlines.map((d) => ({ type: d.type, date: d.date })),
  });

  const intelToon = jsonToToon({
    historique_acheteur: {
      contrats: intel.buyerHistory.totalContracts,
      montant_moyen: intel.buyerHistory.avgAmount,
      top_gagnants: intel.buyerHistory.topWinners.slice(0, 3).map((w) => w.name).join(', '),
    },
    secteur: {
      offres_moyennes: intel.sectorStats.avgOffers,
      montant_moyen: intel.sectorStats.avgAmount,
      hhi: intel.hhi,
      concentration: intel.hhi > 2500 ? 'forte' : intel.hhi > 1500 ? 'moderee' : 'faible',
    },
    concurrents: intel.competitors.slice(0, 5).map((c) => ({ nom: c.name, parts: `${c.marketShare}%` })),
  });

  const profileToon = jsonToToon({
    nom: profile.companyName,
    secteurs: profile.sectors.join(', '),
    ca: { n1: profile.caN1 ?? '', n2: profile.caN2 ?? '' },
    references: (profile.references ?? []).length,
    equipe: (profile.team ?? []).length,
  });

  let webSection = '';
  if (intel.webIntel) {
    const webToon = jsonToToon({
      site_acheteur: intel.webIntel.buyerSummary ?? 'non disponible',
      actualites: intel.webIntel.serpNews.slice(0, 3).map((n) => n.title),
    });
    webSection = `\n\n**Intelligence web (temps-reel) :**\n${webToon}`;
  }

  return `Tu es un analyste strategique senior en marches publics francais.
Analyse ce DCE en croisant les donnees du marche et le profil de l'entreprise.
Les donnees structurees sont en format TOON (tabulaire compact).

**DCE parse :**
${dceToon}

**Intelligence marche :**
${intelToon}

**Profil entreprise :**
${profileToon}${webSection}

Retourne UNIQUEMENT du JSON valide :
{
  "recommendation": {"verdict": "go|maybe|pass", "headline": "Titre", "reasons": ["R1"], "confidenceScore": 75},
  "scoreCriteria": [{"label": "Eligibilite", "score": 15, "icon": "Shield", "description": "..."}],
  "vigilancePoints": [{"type": "risk|warning|opportunity", "title": "T", "description": "D"}],
  "strategicAdvice": "Conseil strategique global en 3-5 phrases"
}

Regles :
- 5 scoreCriteria : Eligibilite, Alignement, Rentabilite, Concurrence, Delais (scores 0-20)
- Icons dans l'ordre : Shield, Target, TrendingUp, Users, Clock
- 3-5 vigilancePoints
- confidenceScore 0-100 (base sur la quantite de donnees disponibles)
- strategicAdvice : cite des chiffres concrets (HHI, nombre d'offres, historique acheteur)`;
}

export async function runAnalyst(
  parsed: ParsedDce,
  intel: MarketIntelligence,
  profile: CompanyProfileInput,
  signal?: AbortSignal,
): Promise<AnalysisResult> {
  const prompt = buildAnalystPrompt(parsed, intel, profile);

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
  return AnalysisSchema.parse(parsed2);
}
