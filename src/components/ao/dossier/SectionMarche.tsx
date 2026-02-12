'use client';

import FeatureGate from '@/components/shared/FeatureGate';
import ResponseTimeline from '@/components/ao/ResponseTimeline';
import BuyerAttributionHistory from './marche/BuyerAttributionHistory';
import CompetitionHHI from './marche/CompetitionHHI';
import VolumeTrends from './marche/VolumeTrends';
import RenewalCandidates from './marche/RenewalCandidates';
import UpcomingFromBuyer from './marche/UpcomingFromBuyer';
import RegulatoryContext from './marche/RegulatoryContext';

interface SectionMarcheProps {
  buyerName: string;
  cpvCode: string | null;
  region: string | null;
  publishedAt: string;
  deadline: string | null;
  buyerHistory: { title: string; amount: string; date: string; winner: string }[];
  competitors: { name: string; wins: number; avgBudget: string }[];
}

export default function SectionMarche({
  buyerName, cpvCode, region, publishedAt, deadline,
}: SectionMarcheProps) {
  return (
    <section id="section-marche" className="space-y-6 scroll-mt-16">
      <h2 className="text-lg font-bold text-slate-900">Contexte marche</h2>

      {/* Always visible: attribution history + timeline */}
      <BuyerAttributionHistory buyerName={buyerName} cpvCode={cpvCode} />

      {deadline && (
        <ResponseTimeline publishedAt={publishedAt} deadline={deadline} />
      )}

      {/* Pro-gated: advanced market analysis */}
      <FeatureGate feature="buyer-intelligence">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {cpvCode && region && (
            <CompetitionHHI cpvCode={cpvCode} region={region} />
          )}

          {cpvCode && (
            <VolumeTrends cpvCode={cpvCode} />
          )}

          {cpvCode && region && (
            <RenewalCandidates cpvCode={cpvCode} region={region} />
          )}

          {cpvCode && (
            <UpcomingFromBuyer cpvCode={cpvCode} />
          )}
        </div>

        <RegulatoryContext />
      </FeatureGate>
    </section>
  );
}
