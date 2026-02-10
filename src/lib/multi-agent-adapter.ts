import type { ParsedDce, MarketIntelligence, AnalysisResult, WrittenSection, ReviewResult } from '@/lib/agents/types';
import type { AoDetail, CoachResponse } from '@/lib/dev';

interface MultiAgentResults {
  parsed: ParsedDce | null;
  intel: MarketIntelligence | null;
  analysis: AnalysisResult | null;
  sections: Map<string, WrittenSection>;
  review: ReviewResult | null;
}

function formatAmount(n: number): string {
  return n >= 1000
    ? `${Math.round(n / 1000)} 000\u202F\u20AC`
    : `${n}\u202F\u20AC`;
}

export function mapMultiAgentToAoDetail(r: MultiAgentResults): AoDetail {
  const parsed = r.parsed;
  const intel = r.intel;
  const analysis = r.analysis;
  const sectionsList = Array.from(r.sections.values());

  const scoreCriteria = analysis?.scoreCriteria ?? [];
  const recommendation = analysis?.recommendation
    ? {
        verdict: analysis.recommendation.verdict,
        headline: analysis.recommendation.headline,
        reasons: analysis.recommendation.reasons,
      }
    : { verdict: 'maybe' as const, headline: '', reasons: [] };

  const buyerHistory = (intel?.buyerHistory.recentContracts ?? []).map((c) => ({
    title: c.title,
    amount: formatAmount(c.amount),
    date: '',
    winner: c.winner,
  }));

  const competitors = (intel?.competitors ?? []).map((c) => ({
    name: c.name,
    wins: c.wins,
    avgBudget: formatAmount(Math.round(c.marketShare * (intel?.sectorStats.avgAmount ?? 0))),
  }));

  const technicalPlanSections = sectionsList.map((s) => ({
    id: s.sectionId,
    title: s.title,
    aiDraft: s.content,
    buyerExpectation: '',
    wordCount: s.wordCount,
  }));

  const requiredDocumentsDetailed = (parsed?.documents ?? []).map((d) => ({
    name: d.name,
    hint: '',
    isCritical: d.isCritical,
    category: 'ao-specific' as const,
  }));

  return {
    scoreCriteria,
    selectionCriteria: (parsed?.criteria ?? []).map((c) => ({ name: c.name, weight: c.weight })),
    requiredDocuments: (parsed?.documents ?? []).map((d) => d.name),
    aiSummary: analysis?.strategicAdvice ?? '',
    technicalPlan: sectionsList.map((s) => s.title),
    executiveSummary: recommendation.headline
      ? `${recommendation.headline}. ${recommendation.reasons.join('. ')}`
      : '',
    complianceChecklist: (parsed?.documents ?? [])
      .filter((d) => d.isCritical)
      .map((d) => d.name),
    buyerHistory,
    competitors,
    recommendation,
    vigilancePoints: analysis?.vigilancePoints ?? [],
    technicalPlanSections,
    requiredDocumentsDetailed,
  };
}

export function mapReviewToCoachData(review: ReviewResult): CoachResponse {
  return {
    completenessScore: review.completenessScore,
    suggestions: review.suggestions.map((s) => ({
      sectionId: s.sectionId,
      type: s.type,
      message: s.message,
    })),
    overallAdvice: review.overallAdvice,
  };
}
