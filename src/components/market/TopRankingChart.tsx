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

export default function TopRankingChart({ title, icon, items, color, unit }: TopRankingChartProps) {
  const maxCount = Math.max(...items.map((item) => item.count), 1);
  const cfg = colorConfig[color];

  return (
    <motion.div variants={fadeUp} className="bg-white rounded-xl border border-slate-200 p-6">
      <div className="flex items-center gap-2 mb-5">
        {icon}
        <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
      </div>
      <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-3">
        {items.slice(0, 8).map((item, i) => {
          const widthPct = (item.count / maxCount) * 100;
          return (
            <motion.div key={item.name} variants={fadeUp} className="flex items-center gap-3">
              <span className={`w-6 h-6 rounded-full ${cfg.badge} flex items-center justify-center text-xs font-bold flex-shrink-0`}>
                {i + 1}
              </span>
              <span className="text-sm text-slate-700 truncate w-36 flex-shrink-0" title={item.name}>
                {item.name || 'Non spécifié'}
              </span>
              <div className="flex-1 h-6 bg-slate-50 rounded-full overflow-hidden relative">
                <motion.div
                  className={`h-full ${cfg.bar} rounded-full`}
                  initial={{ width: 0 }}
                  animate={{ width: `${widthPct}%` }}
                  transition={{ duration: 0.6, delay: i * 0.08, ease: [0.25, 0.1, 0.25, 1] }}
                />
              </div>
              <span className={`text-sm font-mono font-semibold ${cfg.text} flex-shrink-0 w-20 text-right`}>
                {item.count} {unit}
              </span>
            </motion.div>
          );
        })}
      </motion.div>
    </motion.div>
  );
}
