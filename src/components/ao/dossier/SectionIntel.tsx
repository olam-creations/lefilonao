'use client';

import FeatureGate from '@/components/shared/FeatureGate';
import BuyerDnaCard from './BuyerDnaCard';
import CompetitorRadar from './CompetitorRadar';
import MarketShareChart from '@/components/intel/MarketShareChart';
import PriceBenchmark from '@/components/intel/PriceBenchmark';
import WinPatternCard from '@/components/intel/WinPatternCard';

interface SectionIntelProps {
  buyerName: string;
  buyerSiret: string | null;
  cpvCode: string | null;
  region: string | null;
  amount: number | null;
}

export default function SectionIntel({
  buyerName, buyerSiret, cpvCode, region, amount,
}: SectionIntelProps) {
  return (
    <section id="section-intel" className="scroll-mt-16">
      <FeatureGate feature="buyer-intelligence">
        <div className="space-y-6">
          <h2 className="text-lg font-bold text-slate-900">Intelligence</h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Buyer DNA — self-fetching */}
            <BuyerDnaCard buyerName={buyerName} buyerSiret={buyerSiret} />

            {/* Competitor radar — self-fetching */}
            <div className="space-y-6">
              <CompetitorRadar buyerSiret={buyerSiret} />
            </div>
          </div>

          {/* Full-width market insights — self-fetching components */}
          {(cpvCode || region) && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {cpvCode && region && (
                <MarketShareChart cpv={cpvCode} region={region} />
              )}
              {cpvCode && (
                <PriceBenchmark cpv={cpvCode} region={region ?? undefined} amount={amount ?? undefined} />
              )}
              {cpvCode && region && (
                <WinPatternCard cpv={cpvCode} region={region} />
              )}
            </div>
          )}
        </div>
      </FeatureGate>
    </section>
  );
}
