'use client';

import ScoreDetails from './ScoreDetails';
import RecommendationCard from './RecommendationCard';
import type { ScoreCriteria, Recommendation } from '@/lib/dev';

interface TabAnalyseProps {
  criteria: ScoreCriteria[];
  recommendation: Recommendation;
  executiveSummary: string;
}

export default function TabAnalyse({ criteria, recommendation, executiveSummary }: TabAnalyseProps) {
  return (
    <div className="space-y-6">
      <ScoreDetails criteria={criteria} defaultOpen />
      <RecommendationCard recommendation={recommendation} />
      {executiveSummary && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200">
          <h3 className="text-sm font-semibold text-slate-900 mb-3">Synthèse exécutive</h3>
          <p className="text-sm text-slate-600 leading-relaxed">{executiveSummary}</p>
        </div>
      )}
    </div>
  );
}
