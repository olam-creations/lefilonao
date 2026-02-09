'use client';

import { motion } from 'framer-motion';
import { Lock, Unlock, TrendingUp } from 'lucide-react';
import { fadeUp } from '@/lib/motion-variants';
import type { LoyaltySummary } from './types';
import { formatAmount } from './utils';

interface BuyerLoyaltyProps {
  data: LoyaltySummary | null;
  onBuyerClick?: (name: string) => void;
  onWinnerClick?: (name: string) => void;
}

export function BuyerLoyaltySkeleton() {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 animate-pulse">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-4 h-4 bg-slate-200 rounded" />
        <div className="h-5 w-44 bg-slate-200 rounded" />
      </div>
      <div className="h-6 bg-slate-100 rounded-full mb-5" />
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-10 bg-slate-100 rounded" />
        ))}
      </div>
    </div>
  );
}

function DistributionBar({ distribution }: { distribution: LoyaltySummary['distribution'] }) {
  const total = distribution.loyal + distribution.moderate + distribution.switching;
  if (total === 0) return null;

  const segments = [
    { key: 'loyal', label: 'Fidèles', count: distribution.loyal, pct: (distribution.loyal / total) * 100, color: 'bg-red-400' },
    { key: 'moderate', label: 'Modérés', count: distribution.moderate, pct: (distribution.moderate / total) * 100, color: 'bg-amber-400' },
    { key: 'switching', label: 'Volatils', count: distribution.switching, pct: (distribution.switching / total) * 100, color: 'bg-emerald-400' },
  ];

  return (
    <div className="mb-5">
      <div className="flex h-5 rounded-full overflow-hidden mb-2">
        {segments.map((s) =>
          s.pct > 0 ? (
            <motion.div
              key={s.key}
              className={`${s.color} h-full`}
              initial={{ width: 0 }}
              animate={{ width: `${s.pct}%` }}
              transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
            />
          ) : null,
        )}
      </div>
      <div className="flex justify-between text-[10px] text-slate-500">
        {segments.map((s) => (
          <span key={s.key}>
            <span className={`inline-block w-2 h-2 rounded-full ${s.color} mr-1`} />
            {s.label} ({s.count})
          </span>
        ))}
      </div>
    </div>
  );
}

export default function BuyerLoyalty({ data, onBuyerClick, onWinnerClick }: BuyerLoyaltyProps) {
  if (!data) return null;

  return (
    <motion.div variants={fadeUp} className="bg-white rounded-xl border border-slate-200 p-6">
      <div className="flex items-center gap-2 mb-4">
        <Lock className="w-4 h-4 text-red-500" />
        <h2 className="text-lg font-semibold text-slate-900">Fidélité acheteur-titulaire</h2>
      </div>

      <DistributionBar distribution={data.distribution} />

      {data.lockedPairs.length > 0 && (
        <div className="mb-5">
          <div className="flex items-center gap-1.5 mb-3">
            <Lock className="w-3 h-3 text-red-400" />
            <p className="text-xs font-medium text-slate-500">Paires verrouillées</p>
          </div>
          <div className="space-y-2">
            {data.lockedPairs.slice(0, 10).map((pair) => (
              <div key={`${pair.buyerName}-${pair.winnerName}`} className="flex items-center gap-2 py-1.5 border-b border-slate-50 last:border-0">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1 text-xs">
                    {onBuyerClick ? (
                      <button type="button" onClick={() => onBuyerClick(pair.buyerName)} className="text-slate-700 hover:text-indigo-600 truncate transition-colors" title={pair.buyerName}>
                        {pair.buyerName}
                      </button>
                    ) : (
                      <span className="text-slate-700 truncate" title={pair.buyerName}>{pair.buyerName}</span>
                    )}
                    <span className="text-slate-300 flex-shrink-0">&rarr;</span>
                    {onWinnerClick ? (
                      <button type="button" onClick={() => onWinnerClick(pair.winnerName)} className="text-slate-700 hover:text-emerald-600 truncate transition-colors" title={pair.winnerName}>
                        {pair.winnerName}
                      </button>
                    ) : (
                      <span className="text-slate-700 truncate" title={pair.winnerName}>{pair.winnerName}</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <div className="w-16 h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-red-400 rounded-full" style={{ width: `${pair.loyaltyPct}%` }} />
                  </div>
                  <span className="text-[10px] font-semibold text-red-600 w-8 text-right">{pair.loyaltyPct}%</span>
                  <span className="text-[10px] text-slate-400 font-mono w-14 text-right">{formatAmount(pair.totalVolume)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {data.displacementOpportunities.length > 0 && (
        <div>
          <div className="flex items-center gap-1.5 mb-3">
            <TrendingUp className="w-3 h-3 text-emerald-500" />
            <p className="text-xs font-medium text-slate-500">Opportunités de déplacement</p>
          </div>
          <div className="space-y-2">
            {data.displacementOpportunities.map((pair) => (
              <div key={`opp-${pair.buyerName}-${pair.winnerName}`} className="flex items-center justify-between gap-2 p-2 rounded-lg bg-emerald-50/50 border border-emerald-100">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1 text-xs">
                    {onBuyerClick ? (
                      <button type="button" onClick={() => onBuyerClick(pair.buyerName)} className="text-slate-700 hover:text-indigo-600 truncate transition-colors" title={pair.buyerName}>
                        {pair.buyerName}
                      </button>
                    ) : (
                      <span className="text-slate-700 truncate" title={pair.buyerName}>{pair.buyerName}</span>
                    )}
                    <Unlock className="w-3 h-3 text-emerald-500 flex-shrink-0" />
                    {onWinnerClick ? (
                      <button type="button" onClick={() => onWinnerClick(pair.winnerName)} className="text-slate-700 hover:text-emerald-600 truncate transition-colors" title={pair.winnerName}>
                        {pair.winnerName}
                      </button>
                    ) : (
                      <span className="text-slate-700 truncate" title={pair.winnerName}>{pair.winnerName}</span>
                    )}
                  </div>
                </div>
                <span className="text-xs font-bold text-emerald-600 font-mono flex-shrink-0">{formatAmount(pair.totalVolume)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}
