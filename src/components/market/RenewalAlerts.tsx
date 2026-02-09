'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, ChevronDown, ChevronUp, Calendar, Landmark, Trophy } from 'lucide-react';
import { fadeUp, expandCollapse } from '@/lib/motion-variants';
import type { RenewalOpportunity } from './types';
import { formatAmount, formatDate } from './utils';

interface RenewalAlertsProps {
  renewals: RenewalOpportunity[];
  loading?: boolean;
  onBuyerClick?: (name: string) => void;
  onWinnerClick?: (name: string) => void;
}

const INITIAL_VISIBLE = 8;

export default function RenewalAlerts({ renewals, loading, onBuyerClick, onWinnerClick }: RenewalAlertsProps) {
  const [expanded, setExpanded] = useState(false);

  if (loading) return <RenewalAlertsSkeleton />;
  if (renewals.length === 0) return null;

  const visible = expanded ? renewals : renewals.slice(0, INITIAL_VISIBLE);
  const hasMore = renewals.length > INITIAL_VISIBLE;

  return (
    <motion.div variants={fadeUp} className="bg-white rounded-xl border border-amber-200 p-6">
      <div className="flex items-center gap-2 mb-5">
        <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
          <Bell className="w-4 h-4 text-amber-500" />
        </div>
        <h2 className="text-lg font-semibold text-slate-900">Alertes renouvellement</h2>
        <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-amber-100 text-amber-700">
          {renewals.length}
        </span>
      </div>

      <p className="text-xs text-slate-400 mb-4">
        Marchés attribués il y a 3-4 ans susceptibles d&apos;être renouvelés prochainement.
      </p>

      <div className="space-y-0">
        {visible.map((r) => (
          <div
            key={r.id}
            className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 sm:gap-4 py-3 border-b border-slate-100 last:border-0"
          >
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-slate-800 mb-1 line-clamp-2">{r.title}</p>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400">
                <button
                  type="button"
                  onClick={() => onBuyerClick?.(r.buyerName)}
                  className="flex items-center gap-1 hover:text-indigo-600 transition-colors"
                >
                  <Landmark className="w-3 h-3" />
                  {r.buyerName}
                </button>
                <span>&middot;</span>
                <button
                  type="button"
                  onClick={() => onWinnerClick?.(r.winnerName)}
                  className="flex items-center gap-1 hover:text-emerald-600 transition-colors"
                >
                  <Trophy className="w-3 h-3" />
                  {r.winnerName}
                </button>
                {r.region && (
                  <>
                    <span>&middot;</span>
                    <span>{r.region}</span>
                  </>
                )}
              </div>
            </div>
            <div className="flex flex-col items-end gap-1 flex-shrink-0">
              <span className="text-sm font-bold text-emerald-600 font-mono">{formatAmount(r.amount)}</span>
              <span className="flex items-center gap-1 text-[10px] text-amber-600">
                <Calendar className="w-3 h-3" />
                Renouvellement ~{formatDate(r.estimatedRenewal)}
              </span>
            </div>
          </div>
        ))}
      </div>

      <AnimatePresence>
        {hasMore && (
          <motion.button
            type="button"
            onClick={() => setExpanded((prev) => !prev)}
            className="flex items-center gap-1.5 mt-4 px-3 py-1.5 text-xs font-medium text-amber-700 bg-amber-50 rounded-lg hover:bg-amber-100 transition-colors mx-auto"
          >
            {expanded ? (
              <>Réduire <ChevronUp className="w-3.5 h-3.5" /></>
            ) : (
              <>Voir tout ({renewals.length}) <ChevronDown className="w-3.5 h-3.5" /></>
            )}
          </motion.button>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function RenewalAlertsSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-amber-200 p-6">
      <div className="flex items-center gap-2 mb-5">
        <div className="skeleton w-8 h-8 rounded-lg" />
        <div className="skeleton w-44 h-5 rounded" />
      </div>
      <div className="space-y-0">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="flex justify-between items-start gap-4 py-3 border-b border-slate-100 last:border-0">
            <div className="flex-1">
              <div className="skeleton w-3/4 h-4 mb-2 rounded" />
              <div className="flex gap-3">
                <div className="skeleton w-28 h-3 rounded" />
                <div className="skeleton w-24 h-3 rounded" />
              </div>
            </div>
            <div className="skeleton w-20 h-5 rounded flex-shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
}

export { RenewalAlertsSkeleton };
