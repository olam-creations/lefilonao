'use client';

import { motion } from 'framer-motion';
import { Leaf } from 'lucide-react';
import { fadeUp } from '@/lib/motion-variants';
import type { RseData } from './types';

interface RseIndicatorsProps {
  data: RseData | null;
}

export function RseIndicatorsSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 animate-pulse">
      <div className="h-5 w-44 bg-slate-100 rounded mb-6" />
      <div className="grid grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex flex-col items-center gap-2">
            <div className="w-16 h-16 bg-slate-50 rounded-full" />
            <div className="h-2 w-12 bg-slate-50 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}

function ProgressCircle({ value, color, label, trend }: { value: number; color: string; label: string; trend: RseData['trend'] }) {
  const radius = 32;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;

  const colorMap: Record<string, { stroke: string; text: string; bg: string }> = {
    violet: { stroke: 'stroke-violet-500', text: 'text-violet-700', bg: 'text-violet-100' },
    blue: { stroke: 'stroke-blue-500', text: 'text-blue-700', bg: 'text-blue-100' },
    emerald: { stroke: 'stroke-emerald-500', text: 'text-emerald-700', bg: 'text-emerald-100' },
  };
  const c = colorMap[color] ?? colorMap.violet;

  return (
    <div className="flex flex-col items-center gap-2 p-3 bg-slate-50/50 rounded-2xl border border-slate-100/50 transition-all hover:bg-white hover:shadow-lg hover:shadow-indigo-500/5 min-w-0">
      <div className="relative w-14 h-14 sm:w-20 sm:h-20 flex-shrink-0">
        <svg viewBox="0 0 80 80" className="w-full h-full">
          <circle
            cx="40" cy="40" r={radius}
            fill="none" strokeWidth="6"
            className={c.bg}
            stroke="currentColor"
          />
          <motion.circle
            cx="40" cy="40" r={radius}
            fill="none" strokeWidth="6" strokeLinecap="round"
            className={c.stroke}
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
            transform="rotate(-90 40 40)"
          />
          <text x="40" y="40" textAnchor="middle" dominantBaseline="central" className="text-[12px] sm:text-sm font-bold tabular-nums" style={{ fill: 'currentColor' }}>
            {value.toFixed(1)}%
          </text>
        </svg>
      </div>
      <div className="text-center min-w-0 w-full">
        <p className="text-[8px] sm:text-[9px] font-bold text-slate-500 uppercase tracking-widest leading-tight mb-1 truncate">{label}</p>
        <MiniTrend trend={trend} color={color} />
      </div>
    </div>
  );
}

function MiniTrend({ trend, color }: { trend: RseData['trend']; color: string }) {
  if (trend.length < 3) return null;

  const values = trend.map((t) => {
    if (color === 'violet') return t.innovationPct;
    if (color === 'blue') return t.socialPct;
    return t.environmentalPct;
  });
  const max = Math.max(...values, 1);
  const w = 40;
  const h = 12;

  const points = values.map((v, i) => ({
    x: (i / (values.length - 1)) * w,
    y: h - (v / max) * h,
  }));

  const d = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

  const strokeColor: Record<string, string> = {
    violet: '#8b5cf6',
    blue: '#3b82f6',
    emerald: '#10b981',
  };

  return (
    <div className="flex justify-center">
      <svg width={w} height={h}>
        <path d={d} fill="none" stroke={strokeColor[color] ?? '#8b5cf6'} strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    </div>
  );
}

export default function RseIndicators({ data }: RseIndicatorsProps) {
  if (!data) return null;

  const indicators = [
    { value: data.innovationRate, color: 'violet', label: 'Innovation' },
    { value: data.socialClauseRate, color: 'blue', label: 'Social' },
    { value: data.environmentalClauseRate, color: 'emerald', label: 'Écologie' },
  ];

  return (
    <motion.div variants={fadeUp} className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm overflow-hidden h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-emerald-50 text-emerald-500">
            <Leaf className="w-4 h-4" />
          </div>
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-tight">Impact & Innovation</h2>
        </div>
        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50 px-2 py-1 rounded-md border border-slate-100 hidden xs:block">
          {data.totalContracts.toLocaleString('fr-FR')} marchés
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2 sm:gap-4 flex-1 items-center">
        {indicators.map((ind) => (
          <ProgressCircle 
            key={ind.color} 
            value={ind.value} 
            color={ind.color} 
            label={ind.label} 
            trend={data.trend} 
          />
        ))}
      </div>

      {data.trend.length >= 3 && (
        <p className="text-[9px] font-bold text-slate-300 uppercase tracking-[0.2em] text-center mt-6">
          Tendance trimestrielle
        </p>
      )}
    </motion.div>
  );
}