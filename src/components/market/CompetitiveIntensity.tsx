'use client';

import { motion } from 'framer-motion';
import { Gauge, Zap, Users, Info } from 'lucide-react';
import { fadeUp } from '@/lib/motion-variants';
import type { CompetitionData } from './types';
import { formatPercent, hhiLabel, hhiColor } from './utils';

interface CompetitiveIntensityProps {
  data: CompetitionData | null;
}

export function CompetitiveIntensitySkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 animate-pulse">
      <div className="h-5 w-40 bg-slate-50 rounded mb-6" />
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 bg-slate-50 rounded-xl" />
        ))}
      </div>
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-4 bg-slate-50 rounded w-full" />
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
    <motion.div variants={fadeUp} className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm overflow-hidden h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-orange-50 text-orange-500">
            <Gauge className="w-4 h-4" />
          </div>
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-tight">Marché & Concurrence</h2>
        </div>
        <div className="group relative">
          <Info className="w-3.5 h-3.5 text-slate-300 cursor-help" />
          <div className="absolute right-0 bottom-full mb-2 w-48 p-2 bg-slate-900 text-[10px] text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20 shadow-xl">
            L&apos;indice HHI mesure la concentration du marché. Plus il est élevé, moins il y a de concurrence.
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-8">
        <div className="bg-slate-50/50 p-3 rounded-xl border border-slate-100 flex flex-col justify-center">
          <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-1">Offres</p>
          <div className="flex items-baseline gap-1">
            <p className="text-lg font-bold text-slate-900 tabular-nums">{data.avgOffers.toFixed(1)}</p>
            <p className="text-[9px] text-slate-400">/AO</p>
          </div>
        </div>
        <div className="bg-slate-50/50 p-3 rounded-xl border border-slate-100 flex flex-col justify-center">
          <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-1">Concentr.</p>
          <p className="text-lg font-bold text-slate-900 tabular-nums">{data.hhi}</p>
        </div>
        <div className="p-3 rounded-xl border flex flex-col justify-center items-center text-center" style={{ backgroundColor: `${colors.bg.replace('bg-', '')}`, borderColor: 'transparent' }}>
          <p className="text-[8px] font-bold opacity-60 uppercase tracking-widest mb-1">Niveau</p>
          <p className={`text-[10px] font-bold uppercase ${colors.text}`}>{hhiLabel(data.concentration)}</p>
        </div>
      </div>

      {data.topShareholders.length > 0 && (
        <div className="flex-1 min-h-0">
          <div className="flex items-center justify-between mb-4">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Répartition des parts</p>
            <div className="flex items-center gap-1 text-[10px] font-bold text-orange-500 uppercase">
              <Zap className="w-3 h-3" /> Top 10
            </div>
          </div>
          <div className="space-y-3">
            {data.topShareholders.slice(0, 6).map((s, i) => (
              <div key={s.name} className="relative group/line">
                <div className="flex items-center justify-between mb-1 gap-2">
                  <span className="text-[10px] font-bold text-slate-700 truncate flex-1 uppercase tracking-tight">{s.name}</span>
                  <span className="text-[10px] font-mono font-bold text-orange-600 tabular-nums bg-orange-50 px-1.5 py-0.5 rounded border border-orange-100">
                    {formatPercent(s.share)}
                  </span>
                </div>
                <div className="h-1 bg-slate-50 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-orange-400 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${(s.share / maxShare) * 100}%` }}
                    transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: i * 0.05 }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}