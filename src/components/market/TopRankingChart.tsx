'use client';

import { motion } from 'framer-motion';
import { fadeUp, stagger } from '@/lib/motion-variants';
import type { RankedEntity } from './types';

interface TopRankingChartProps {
  title: string;
  icon: React.ReactNode;
  items: RankedEntity[];
  color: 'indigo' | 'emerald';
  unit: string;
  onNameClick?: (name: string) => void;
}

const colorConfig = {
  indigo: {
    bar: 'bg-indigo-500',
    badge: 'bg-indigo-50 text-indigo-600',
    text: 'text-indigo-600',
  },
  emerald: {
    bar: 'bg-emerald-500',
    badge: 'bg-emerald-50 text-emerald-600',
    text: 'text-emerald-600',
  },
};

export default function TopRankingChart({ title, icon, items, color, unit, onNameClick }: TopRankingChartProps) {
  const maxCount = Math.max(...items.map((item) => item.count), 1);
  const cfg = colorConfig[color];

  return (
    <motion.div variants={fadeUp} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm overflow-hidden relative group">
      {/* Subtle background glow on hover */}
      <div className={`absolute -right-10 -top-10 w-40 h-40 bg-${color === 'indigo' ? 'indigo' : 'emerald'}-500/5 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700`} />
      
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2.5">
          <div className={`p-2 rounded-lg bg-${color === 'indigo' ? 'indigo' : 'emerald'}-50 text-${color === 'indigo' ? 'indigo' : 'emerald'}-500`}>
            {icon}
          </div>
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-tight">{title}</h2>
        </div>
        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50 px-2 py-1 rounded-md border border-slate-100">
          Top 8
        </div>
      </div>

      <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-4">
        {items.slice(0, 8).map((item, i) => {
          const widthPct = (item.count / maxCount) * 100;
          return (
            <motion.div key={item.name} variants={fadeUp} className="relative">
              <div className="flex items-center justify-between mb-1.5 gap-2">
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <span className={`text-[10px] font-bold ${cfg.text} opacity-50 flex-shrink-0`}>
                    {(i + 1).toString().padStart(2, '0')}
                  </span>
                  {onNameClick ? (
                    <button
                      type="button"
                      onClick={() => onNameClick(item.name)}
                      className="text-[10px] sm:text-xs font-bold text-slate-700 truncate hover:text-indigo-600 transition-colors uppercase tracking-tight text-left"
                      title={item.name}
                    >
                      {item.name || 'Non spécifié'}
                    </button>
                  ) : (
                    <span className="text-[10px] sm:text-xs font-bold text-slate-700 truncate uppercase tracking-tight" title={item.name}>
                      {item.name || 'Non spécifié'}
                    </span>
                  )}
                </div>
                <span className={`text-[10px] font-mono font-bold ${cfg.text} flex-shrink-0 whitespace-nowrap`}>
                  {item.count} {unit}
                </span>
              </div>
              
              <div className="h-1.5 bg-slate-50 rounded-full overflow-hidden relative">
                <motion.div
                  className={`h-full ${cfg.bar} rounded-full relative z-10`}
                  initial={{ width: 0 }}
                  animate={{ width: `${widthPct}%` }}
                  transition={{ duration: 1, delay: i * 0.05, ease: [0.16, 1, 0.3, 1] }}
                />
                {/* Background shimmer effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:animate-[shimmer_2s_infinite] pointer-events-none" />
              </div>
            </motion.div>
          );
        })}
      </motion.div>
    </motion.div>
  );
}
