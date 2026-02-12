'use client';

import { Target, Heart, FileText } from 'lucide-react';
import { formatAmount } from '@/components/market/utils';
import type { BuyerProfile, RankedEntity } from '@/components/market/types';

interface BuyerIntelCardProps {
  data: BuyerProfile;
}

function SignalBar({ label, score }: { label: string; score: number }) {
  const clampedScore = Math.min(100, Math.max(0, score));
  const color =
    clampedScore >= 60 ? 'bg-emerald-500' : clampedScore >= 30 ? 'bg-amber-400' : 'bg-slate-300';

  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] text-slate-500 w-20 flex-shrink-0 truncate">{label}</span>
      <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${clampedScore}%` }} />
      </div>
      <span className="text-[10px] font-mono text-slate-400 w-8 text-right">{clampedScore}%</span>
    </div>
  );
}

function LoyaltyIndicator({ winners, totalContracts }: { winners: RankedEntity[]; totalContracts: number }) {
  if (winners.length === 0 || totalContracts === 0) return null;

  const topWinnerPct = Math.round((winners[0].count / totalContracts) * 100);
  const level = topWinnerPct >= 50 ? 'Loyal' : topWinnerPct >= 25 ? 'Mixte' : 'Ouvert';
  const levelColor = topWinnerPct >= 50 ? 'text-red-600 bg-red-50' : topWinnerPct >= 25 ? 'text-amber-600 bg-amber-50' : 'text-emerald-600 bg-emerald-50';

  return (
    <div className="flex items-center gap-2">
      <Heart className="w-3.5 h-3.5 text-rose-400" />
      <span className="text-xs text-slate-600">Fidelite:</span>
      <span className={`px-1.5 py-0.5 text-[10px] font-medium rounded ${levelColor}`}>
        {level} ({topWinnerPct}% pour {winners[0].name})
      </span>
    </div>
  );
}

export default function BuyerIntelCard({ data }: BuyerIntelCardProps) {
  const sectors = data.sectors ?? [];
  const topWinners = data.topWinners ?? [];
  const recentContracts = data.recentContracts ?? [];
  const totalContracts = data.totalContracts ?? 0;
  const totalVolume = data.totalVolume ?? 0;

  // Derive simple preference signals from available data
  const sectorDiversity = Math.min(100, sectors.length * 15);
  const volumeScale = totalVolume > 1_000_000 ? 80 : totalVolume > 100_000 ? 50 : 20;
  const contractFrequency = Math.min(100, totalContracts * 5);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-1">
        <Target className="w-3.5 h-3.5 text-indigo-500" />
        <h4 className="text-xs font-semibold text-slate-700">Intelligence acheteur</h4>
      </div>

      <div className="space-y-1.5">
        <SignalBar label="Diversite" score={sectorDiversity} />
        <SignalBar label="Volume" score={volumeScale} />
        <SignalBar label="Frequence" score={contractFrequency} />
      </div>

      <LoyaltyIndicator winners={topWinners} totalContracts={totalContracts} />

      {recentContracts.length > 0 && (
        <div>
          <div className="flex items-center gap-1.5 mb-1.5">
            <FileText className="w-3 h-3 text-slate-400" />
            <span className="text-[10px] text-slate-500 uppercase tracking-wide">Derniere attribution</span>
          </div>
          <div className="bg-slate-50 rounded-lg p-2.5">
            <p className="text-[11px] text-slate-700 line-clamp-1">{recentContracts[0].title}</p>
            <div className="flex justify-between mt-1 text-[10px] text-slate-400">
              <span>{recentContracts[0].winnerName}</span>
              <span className="font-semibold text-emerald-600">{formatAmount(recentContracts[0].amount)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
