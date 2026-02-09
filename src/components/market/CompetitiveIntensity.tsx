'use client';

import { motion } from 'framer-motion';
import { Gauge } from 'lucide-react';
import { fadeUp } from '@/lib/motion-variants';
import type { CompetitionData } from './types';
import { formatPercent, hhiLabel, hhiColor } from './utils';

interface CompetitiveIntensityProps {
  data: CompetitionData | null;
}

export function CompetitiveIntensitySkeleton() {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 animate-pulse">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-4 h-4 bg-slate-200 rounded" />
        <div className="h-5 w-40 bg-slate-200 rounded" />
      </div>
      <div className="grid grid-cols-3 gap-3 mb-5">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-slate-50 rounded-lg p-3">
            <div className="h-3 w-16 bg-slate-200 rounded mb-2" />
            <div className="h-6 w-12 bg-slate-200 rounded" />
          </div>
        ))}
      </div>
      <div className="space-y-2.5">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-6 bg-slate-100 rounded" />
        ))}
      </div>
    </div>
  );
}

export default function CompetitiveIntensity({ data }: CompetitiveIntensityProps) {
  if (!data) return null;

  const maxShare = data.topShareholders.length > 0 ? data.topShareholders[0].share : 1;
  const colors = hhiColor(data.concentration);

  return (
    <motion.div variants={fadeUp} className="bg-white rounded-xl border border-slate-200 p-6">
      <div className="flex items-center gap-2 mb-4">
        <Gauge className="w-4 h-4 text-orange-500" />
        <h2 className="text-lg font-semibold text-slate-900">Intensité concurrentielle</h2>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="bg-slate-50 rounded-lg p-3">
          <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider mb-1">Offres moy.</p>
          <p className="text-xl font-bold text-slate-900">{data.avgOffers.toFixed(1)}</p>
        </div>
        <div className="bg-slate-50 rounded-lg p-3">
          <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider mb-1">Score HHI</p>
          <p className="text-xl font-bold text-slate-900">{data.hhi.toLocaleString('fr-FR')}</p>
        </div>
        <div className="bg-slate-50 rounded-lg p-3">
          <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider mb-1">Niveau</p>
          <span className={`inline-block px-2 py-0.5 text-[10px] font-semibold rounded-full ${colors.bg} ${colors.text}`}>
            {hhiLabel(data.concentration)}
          </span>
        </div>
      </div>

      {data.topShareholders.length > 0 && (
        <div>
          <p className="text-xs font-medium text-slate-500 mb-3">Parts de marché — Top 10</p>
          <div className="space-y-2">
            {data.topShareholders.map((s, i) => (
              <div key={s.name} className="flex items-center gap-3">
                <span className="text-[10px] font-bold text-slate-400 w-4 text-right">{i + 1}</span>
                <span className="text-xs text-slate-700 w-36 truncate" title={s.name}>{s.name}</span>
                <div className="flex-1 h-4 bg-slate-100 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-orange-400 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${(s.share / maxShare) * 100}%` }}
                    transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1], delay: i * 0.05 }}
                  />
                </div>
                <span className="text-[10px] font-semibold text-slate-600 w-12 text-right">
                  {formatPercent(s.share)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}
