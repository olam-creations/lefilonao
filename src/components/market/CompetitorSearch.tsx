'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Trophy, Users } from 'lucide-react';
import { fadeUp, scaleIn } from '@/lib/motion-variants';
import type { CompetitorResult } from './types';
import { formatAmount } from './utils';

interface CompetitorSearchProps {
  competitors: CompetitorResult[];
  onCompetitorClick?: (name: string) => void;
}

export default function CompetitorSearch({ competitors, onCompetitorClick }: CompetitorSearchProps) {
  const [query, setQuery] = useState('');

  if (competitors.length === 0) return null;

  const results = useMemo(() => {
    if (query.length < 2) return [];
    const q = query.toLowerCase();
    return competitors.filter((c) => c.name.toLowerCase().includes(q));
  }, [query, competitors]);

  const showResults = query.length >= 2;

  return (
    <motion.div variants={fadeUp} className="bg-white rounded-xl border border-slate-200 p-6">
      <div className="flex items-center gap-2 mb-4">
        <Users className="w-4 h-4 text-violet-500" />
        <h2 className="text-lg font-semibold text-slate-900">Recherche concurrents</h2>
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Rechercher une entreprise..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-700 focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 outline-none"
        />
      </div>

      <AnimatePresence mode="wait">
        {showResults && results.length === 0 && (
          <motion.div
            key="empty"
            {...scaleIn}
            className="text-center py-8 text-slate-400 text-sm"
          >
            Aucun concurrent trouvé pour &laquo;&nbsp;{query}&nbsp;&raquo;
          </motion.div>
        )}

        {showResults && results.length > 0 && (
          <motion.div
            key="results"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-3"
          >
            {results.map((comp) => (
              <motion.div
                key={comp.name}
                variants={fadeUp}
                initial="hidden"
                animate="show"
                className="p-4 rounded-lg border border-slate-100 hover:border-indigo-200 hover:bg-indigo-50/30 transition-all"
              >
                <div className="flex items-start justify-between gap-4 mb-2">
                  {onCompetitorClick ? (
                    <button type="button" onClick={() => onCompetitorClick(comp.name)} className="text-sm font-semibold text-slate-900 hover:text-indigo-600 hover:underline transition-colors text-left">
                      {comp.name}
                    </button>
                  ) : (
                    <h3 className="text-sm font-semibold text-slate-900">{comp.name}</h3>
                  )}
                  <div className="flex items-center gap-1 text-emerald-600">
                    <Trophy className="w-3.5 h-3.5" />
                    <span className="text-sm font-bold">{comp.wins}</span>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs text-slate-500 mb-2">
                  <span>Volume : <span className="font-semibold text-slate-700">{formatAmount(comp.totalVolume)}</span></span>
                  <span>Budget moyen : <span className="font-semibold text-slate-700">{formatAmount(comp.avgBudget)}</span></span>
                  {comp.winRate != null && (
                    <span>Taux victoire : <span className="font-semibold text-indigo-600">{comp.winRate.toFixed(1)}%</span></span>
                  )}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {comp.sectors.map((s) => (
                    <span key={s} className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-slate-100 text-slate-600">
                      {s}
                    </span>
                  ))}
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {!showResults && (
        <p className="text-xs text-slate-400 text-center py-4">
          Tapez au moins 2 caractères pour rechercher
        </p>
      )}
    </motion.div>
  );
}
