'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SlidersHorizontal, RotateCcw, ChevronDown } from 'lucide-react';
import { expandCollapse } from '@/lib/motion-variants';
import { REGIONS, DEFAULT_FILTERS, type MarketFilters as Filters } from './types';

interface MarketFiltersProps {
  filters: Filters;
  onChange: (filters: Filters) => void;
}

const PERIODS = [
  { value: '3' as const, label: '3 mois' },
  { value: '6' as const, label: '6 mois' },
  { value: '12' as const, label: '12 mois' },
  { value: 'all' as const, label: 'Tout' },
];

export default function MarketFilters({ filters, onChange }: MarketFiltersProps) {
  const [open, setOpen] = useState(false);

  const hasActiveFilters = filters.region !== '' || filters.period !== 'all' || filters.amountMin > 0 || filters.amountMax > 0;

  const handleReset = () => onChange({ ...DEFAULT_FILTERS });

  return (
    <div className="bg-white rounded-xl border border-slate-200 mb-6">
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="w-full flex items-center justify-between px-6 py-4"
      >
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-slate-500" />
          <span className="text-sm font-semibold text-slate-900">Filtres avancés</span>
          {hasActiveFilters && (
            <span className="w-2 h-2 rounded-full bg-indigo-500" />
          )}
        </div>
        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div {...expandCollapse} className="overflow-hidden">
            <div className="px-6 pb-5 grid gap-4 sm:grid-cols-3 border-t border-slate-100 pt-4">
              {/* Region */}
              <div>
                <label className="text-xs font-medium text-slate-500 mb-1 block">Région</label>
                <select
                  value={filters.region}
                  onChange={(e) => onChange({ ...filters, region: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-700 bg-white focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 outline-none"
                >
                  <option value="">Toutes les régions</option>
                  {REGIONS.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>

              {/* Period */}
              <div>
                <label className="text-xs font-medium text-slate-500 mb-1 block">Période</label>
                <div className="flex bg-slate-100 rounded-lg p-0.5">
                  {PERIODS.map((p) => (
                    <button
                      key={p.value}
                      onClick={() => onChange({ ...filters, period: p.value })}
                      className={`flex-1 px-2 py-1.5 text-xs font-medium rounded-md transition-all ${
                        filters.period === p.value ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Amount range */}
              <div>
                <label className="text-xs font-medium text-slate-500 mb-1 block">Montant (k€)</label>
                <div className="flex gap-2 items-center">
                  <input
                    type="number"
                    placeholder="Min"
                    value={filters.amountMin || ''}
                    onChange={(e) => onChange({ ...filters, amountMin: Number(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-700 focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 outline-none"
                  />
                  <span className="text-slate-300">—</span>
                  <input
                    type="number"
                    placeholder="Max"
                    value={filters.amountMax || ''}
                    onChange={(e) => onChange({ ...filters, amountMax: Number(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-700 focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 outline-none"
                  />
                </div>
              </div>
            </div>

            {hasActiveFilters && (
              <div className="px-6 pb-4">
                <button onClick={handleReset} className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-indigo-600 transition-colors">
                  <RotateCcw className="w-3 h-3" />
                  Réinitialiser les filtres
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
