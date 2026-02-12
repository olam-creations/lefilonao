'use client';

import AoNoticeDetails, { type BoampLot } from '@/components/ao/AoNoticeDetails';
import AiSummaryCard from '@/components/ao/AiSummaryCard';
import SelectionCriteriaWeights from '@/components/ao/SelectionCriteriaWeights';
import VigilanceAlerts from '@/components/ao/VigilanceAlerts';
import ComplianceChecklist from '@/components/ao/ComplianceChecklist';
import ResponseTimeline from '@/components/ao/ResponseTimeline';
import type { BoampNoticeData } from '@/lib/notice-transform';
import type { BoampEnrichedData } from '@/lib/boamp-enrichment';
import type { AoDetail } from '@/lib/dev';

interface SectionSyntheseProps {
  notice: BoampNoticeData | null;
  lots: BoampLot[];
  enriched: BoampEnrichedData | null;
  analysis: AoDetail | null;
  hasAnalysis: boolean;
  publishedAt: string;
  deadline: string | null;
}

export default function SectionSynthese({
  notice, lots, enriched, analysis, hasAnalysis, publishedAt, deadline,
}: SectionSyntheseProps) {
  return (
    <section id="section-synthese" className="space-y-6 scroll-mt-16">
      <h2 className="text-lg font-bold text-slate-900">Synthese</h2>

      {/* Notice details — always visible even without analysis */}
      {notice && <AoNoticeDetails notice={notice} lots={lots} enriched={enriched} />}

      {/* Key dates timeline */}
      {deadline && <ResponseTimeline publishedAt={publishedAt} deadline={deadline} />}

      {/* AI-powered insights — only when analysis is available */}
      {hasAnalysis && analysis && (
        <div className="space-y-6">
          <AiSummaryCard summary={analysis.aiSummary} />
          <SelectionCriteriaWeights criteria={analysis.selectionCriteria} />
          <VigilanceAlerts points={analysis.vigilancePoints} />
          <ComplianceChecklist items={analysis.complianceChecklist} />
        </div>
      )}

      {/* Placeholder when no analysis */}
      {!hasAnalysis && (
        <div className="bg-slate-50 rounded-xl border border-slate-200 p-8 text-center">
          <p className="text-sm text-slate-500">
            L&apos;analyse IA sera disponible apres le traitement du DCE.
          </p>
        </div>
      )}
    </section>
  );
}
