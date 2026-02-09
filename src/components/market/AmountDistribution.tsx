'use client';

import { motion } from 'framer-motion';
import { fadeUp } from '@/lib/motion-variants';
import type { AmountRange } from './types';
import { calculatePercentages } from './utils';

export default function AmountDistribution({ data }: { data: AmountRange[] }) {
  const percentages = calculatePercentages(data.map((d) => d.count));
  const total = data.reduce((sum, d) => sum + d.count, 0);

  if (data.length === 0) return null;

  return (
    <motion.div variants={fadeUp} className="bg-white rounded-xl border border-slate-200 p-6">
      <h2 className="text-lg font-semibold text-slate-900 mb-4">Répartition par montant</h2>

      {/* Segmented bar */}
      <div className="flex h-8 rounded-full overflow-hidden mb-4">
        {data.map((range, i) => (
          <motion.div
            key={range.label}
            className={`${range.color} relative`}
            initial={{ width: 0 }}
            animate={{ width: `${percentages[i]}%` }}
            transition={{ duration: 0.6, delay: i * 0.1, ease: [0.25, 0.1, 0.25, 1] }}
          >
            {percentages[i] >= 12 && (
              <span className="absolute inset-0 flex items-center justify-center text-white text-xs font-bold">
                {Math.round(percentages[i])}%
              </span>
            )}
          </motion.div>
        ))}
      </div>

      {/* Legend */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {data.map((range, i) => (
          <div key={range.label} className="flex items-center gap-2">
            <span className={`w-3 h-3 rounded-full ${range.color} flex-shrink-0`} />
            <div>
              <div className="text-xs font-medium text-slate-700">{range.label}</div>
              <div className="text-xs text-slate-400">
                {range.count} ({Math.round(percentages[i])}%)
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="text-xs text-slate-400 mt-3 text-right">
        Total : {total.toLocaleString('fr-FR')} marchés
      </div>
    </motion.div>
  );
}
