'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, ChevronDown, ChevronUp, Calendar, Landmark, Trophy, Search, ArrowUpDown } from 'lucide-react';
import { fadeUp } from '@/lib/motion-variants';
import type { RenewalOpportunity } from './types';
import { formatAmount, formatDate } from './utils';

interface RenewalAlertsProps {
  renewals: RenewalOpportunity[];
  loading?: boolean;
  onBuyerClick?: (name: string) => void;
  onWinnerClick?: (name: string) => void;
}

type SortKey = 'date' | 'amount';
const PAGE_SIZE = 12;

export default function RenewalAlerts({ renewals, loading, onBuyerClick, onWinnerClick }: RenewalAlertsProps) {
  const [expanded, setExpanded] = useState(false);
  const [filterText, setFilterText] = useState('');
  const [sortBy, setSortBy] = useState<SortKey>('date');
  const [page, setPage] = useState(0);

  const filtered = useMemo(() => {
    const q = filterText.toLowerCase().trim();
    if (!q) return renewals;
    return renewals.filter(
      (r) =>
        r.buyerName.toLowerCase().includes(q) ||
        r.winnerName.toLowerCase().includes(q) ||
        r.title.toLowerCase().includes(q),
    );
  }, [renewals, filterText]);

  const sorted = useMemo(() => {
    const items = [...filtered];
    if (sortBy === 'amount') {
      items.sort((a, b) => b.amount - a.amount);
    } else {
      items.sort((a, b) => a.estimatedRenewal.localeCompare(b.estimatedRenewal));
    }
    return items;
  }, [filtered, sortBy]);

  const totalPages = Math.ceil(sorted.length / PAGE_SIZE);
  const visible = expanded ? sorted.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE) : sorted.slice(0, 8);
  const hasMore = sorted.length > 8;

  if (loading) return <RenewalAlertsSkeleton />;
  if (renewals.length === 0) return null;

  return (
    <motion.div variants={fadeUp} className="bg-white rounded-xl border border-amber-200 p-6">
      <div className="flex items-center gap-2 mb-5">
        <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
          <Bell className="w-4 h-4 text-amber-500" />
        </div>
        <h2 className="text-lg font-semibold text-slate-900">Alertes renouvellement</h2>
        <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-amber-100 text-amber-700">
          {sorted.length}
        </span>
      </div>

      <p className="text-xs text-slate-400 mb-4">
        Marchés attribués il y a 3-4 ans susceptibles d&apos;être renouvelés prochainement.
      </p>

      {renewals.length > 8 && (
        <div className="flex items-center gap-2 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              value={filterText}
              onChange={(e) => { setFilterText(e.target.value); setPage(0); }}
              placeholder="Filtrer par acheteur, attributaire..."
              className="w-full pl-8 pr-3 py-2 sm:py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-300"
            />
          </div>
          <button
            type="button"
            onClick={() => setSortBy((prev) => (prev === 'date' ? 'amount' : 'date'))}
            className="flex items-center gap-1 px-2.5 py-2 sm:py-1.5 text-xs text-slate-600 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <ArrowUpDown className="w-3 h-3" />
            {sortBy === 'date' ? 'Date' : 'Montant'}
          </button>
        </div>
      )}

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

      {expanded && totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-4">
          <button
            type="button"
            disabled={page === 0}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            className="px-2.5 py-2 sm:py-1.5 text-xs rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50 transition-colors"
          >
            Prec.
          </button>
          <span className="text-xs text-slate-500">
            {page + 1} / {totalPages}
          </span>
          <button
            type="button"
            disabled={page >= totalPages - 1}
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            className="px-2.5 py-2 sm:py-1.5 text-xs rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50 transition-colors"
          >
            Suiv.
          </button>
        </div>
      )}

      <AnimatePresence>
        {hasMore && (
          <motion.button
            type="button"
            onClick={() => { setExpanded((prev) => !prev); setPage(0); }}
            className="flex items-center gap-1.5 mt-4 px-3 py-2 sm:py-1.5 text-xs font-medium text-amber-700 bg-amber-50 rounded-lg hover:bg-amber-100 transition-colors mx-auto"
          >
            {expanded ? (
              <>Réduire <ChevronUp className="w-3.5 h-3.5" /></>
            ) : (
              <>Voir tout ({sorted.length}) <ChevronDown className="w-3.5 h-3.5" /></>
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
