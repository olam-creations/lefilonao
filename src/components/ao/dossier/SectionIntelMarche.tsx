'use client';

import FeatureGate from '@/components/shared/FeatureGate';
import BuyerDnaCard from './BuyerDnaCard';
import CompetitorRadar from './CompetitorRadar';
import MarketShareChart from '@/components/intel/MarketShareChart';
import PriceBenchmark from '@/components/intel/PriceBenchmark';
import WinPatternCard from '@/components/intel/WinPatternCard';
import BuyerAttributionHistory from './marche/BuyerAttributionHistory';
import CompetitionHHI from './marche/CompetitionHHI';
import VolumeTrends from './marche/VolumeTrends';
import RenewalCandidates from './marche/RenewalCandidates';
import UpcomingFromBuyer from './marche/UpcomingFromBuyer';
import RegulatoryContext from './marche/RegulatoryContext';
import {
  Building2,
  Users,
  DollarSign,
  TrendingUp,
  Scale,
} from 'lucide-react';

interface SectionIntelMarcheProps {
  buyerName: string;
  buyerSiret: string | null;
  cpvCode: string | null;
  region: string | null;
  amount: number | null;
}

function SubsectionHeader({ icon: Icon, title }: { icon: React.ElementType; title: string }) {
  return (
    <div className="flex items-center gap-2 pt-2">
      <Icon className="w-4 h-4 text-indigo-500" />
      <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide">{title}</h3>
      <div className="flex-1 h-px bg-slate-200" />
    </div>
  );
}

export default function SectionIntelMarche({
  buyerName, buyerSiret, cpvCode, region, amount,
}: SectionIntelMarcheProps) {
  return (
    <section id="section-intelligence" className="space-y-8 scroll-mt-16">
      <h2 className="text-lg font-bold text-slate-900">Intelligence marche</h2>

      {/* ── L'Acheteur ── */}
      <div className="space-y-4">
        <SubsectionHeader icon={Building2} title="L'acheteur" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <FeatureGate feature="buyer-intelligence">
            <BuyerDnaCard buyerName={buyerName} buyerSiret={buyerSiret} />
          </FeatureGate>
          <BuyerAttributionHistory buyerName={buyerName} cpvCode={cpvCode} />
        </div>
      </div>

      {/* ── La Concurrence ── */}
      <div className="space-y-4">
        <SubsectionHeader icon={Users} title="La concurrence" />
        <FeatureGate feature="buyer-intelligence">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {cpvCode && region && (
              <CompetitionHHI cpvCode={cpvCode} region={region} />
            )}
            <CompetitorRadar buyerSiret={buyerSiret} />
          </div>
          {cpvCode && region && (
            <MarketShareChart cpv={cpvCode} region={region} />
          )}
        </FeatureGate>
      </div>

      {/* ── Le Prix ── */}
      {cpvCode && (
        <div className="space-y-4">
          <SubsectionHeader icon={DollarSign} title="Benchmark prix" />
          <FeatureGate feature="buyer-intelligence">
            <PriceBenchmark cpv={cpvCode} region={region ?? undefined} amount={amount ?? undefined} />
          </FeatureGate>
        </div>
      )}

      {/* ── Tendances & Perspectives ── */}
      <div className="space-y-4">
        <SubsectionHeader icon={TrendingUp} title="Tendances & perspectives" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {cpvCode && <VolumeTrends cpvCode={cpvCode} />}
          {cpvCode && region && (
            <FeatureGate feature="buyer-intelligence">
              <WinPatternCard cpv={cpvCode} region={region} />
            </FeatureGate>
          )}
          {cpvCode && region && (
            <FeatureGate feature="buyer-intelligence">
              <RenewalCandidates cpvCode={cpvCode} region={region} />
            </FeatureGate>
          )}
          {cpvCode && <UpcomingFromBuyer cpvCode={cpvCode} />}
        </div>
      </div>

      {/* ── Contexte Reglementaire ── */}
      <div className="space-y-4">
        <SubsectionHeader icon={Scale} title="Contexte reglementaire" />
        <RegulatoryContext />
      </div>
    </section>
  );
}
