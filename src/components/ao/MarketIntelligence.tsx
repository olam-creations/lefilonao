'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, Landmark, Trophy, ChevronDown } from 'lucide-react';
import { expandCollapse } from '@/lib/motion-variants';
import { formatDate } from '@/lib/ao-utils';

interface MarketIntelligenceProps {
  buyerHistory: { title: string; amount: string; date: string; winner: string }[];
  competitors: { name: string; wins: number; avgBudget: string }[];
  defaultOpen?: boolean;
}

export default function MarketIntelligence({ buyerHistory, competitors, defaultOpen = false }: MarketIntelligenceProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <section>
      <button
        onClick={() => setIsOpen((o) => !o)}
        className="w-full flex items-center justify-between py-3 group"
      >
        <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-indigo-500" />
          Intelligence marché
        </h2>
        <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-colors" />
        </motion.div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div {...expandCollapse}>
            <div className="grid md:grid-cols-2 gap-4 pb-4">
              {/* Buyer History */}
              <div className="bg-white rounded-xl p-5 border border-slate-200">
                <div className="flex items-center gap-2 mb-4">
                  <Landmark className="w-4 h-4 text-indigo-500" />
                  <h3 className="text-sm font-semibold text-slate-900">Historique de l&apos;acheteur</h3>
                </div>
                {buyerHistory.length > 0 ? (
                  <div className="space-y-0">
                    {buyerHistory.map((h, i) => (
                      <div key={i} className="flex justify-between items-start gap-3 py-3 border-b border-slate-100 last:border-0">
                        <div className="min-w-0">
                          <div className="text-sm text-slate-700 font-medium mb-1">{h.title}</div>
                          <div className="text-xs text-slate-400 flex items-center gap-2">
                            <span>{formatDate(h.date)}</span>
                            <span>&middot;</span>
                            <span className="text-emerald-600 font-medium">{h.winner}</span>
                          </div>
                        </div>
                        <span className="text-sm font-bold font-mono text-slate-900 flex-shrink-0">{h.amount}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-400 text-center py-4">Aucun historique disponible</p>
                )}
              </div>

              {/* Competitors */}
              <div className="bg-white rounded-xl p-5 border border-slate-200">
                <div className="flex items-center gap-2 mb-4">
                  <Trophy className="w-4 h-4 text-emerald-500" />
                  <h3 className="text-sm font-semibold text-slate-900">Concurrents potentiels</h3>
                </div>
                {competitors.length > 0 ? (
                  <div className="space-y-3">
                    {competitors.map((c, i) => (
                      <div key={i} className="flex justify-between items-center py-2 border-b border-slate-50 last:border-0">
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-xs font-semibold text-slate-500 flex-shrink-0">
                            {i + 1}
                          </span>
                          <div>
                            <span className="text-sm text-slate-700 font-medium">{c.name}</span>
                            <div className="text-xs text-slate-400">Budget moyen : {c.avgBudget}</div>
                          </div>
                        </div>
                        <span className="text-sm font-mono gradient-text font-semibold flex-shrink-0 ml-4">
                          {c.wins} victoires
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-400 text-center py-4">Aucune donnée disponible</p>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
