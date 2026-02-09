'use client';

import { motion } from 'framer-motion';
import { Leaf } from 'lucide-react';
import { fadeUp } from '@/lib/motion-variants';
import type { RseData } from './types';
import { formatPercent } from './utils';

interface RseIndicatorsProps {
  data: RseData | null;
}

export function RseIndicatorsSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 animate-pulse">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-4 h-4 bg-slate-200 rounded" />
        <div className="h-5 w-44 bg-slate-200 rounded" />
      </div>
      <div className="flex justify-around mb-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex flex-col items-center gap-2">
            <div className="w-20 h-20 bg-slate-100 rounded-full" />
            <div className="h-3 w-16 bg-slate-200 rounded" />
          </div>
        ))}
      </div>
      <div className="h-4 w-32 bg-slate-200 rounded mx-auto" />
    </div>
  );
}

function ProgressCircle({ value, color, label }: { value: number; color: string; label: string }) {
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
    <div className="flex flex-col items-center gap-1.5">
      <svg width="80" height="80" viewBox="0 0 80 80">
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
          transition={{ duration: 1, ease: [0.25, 0.1, 0.25, 1] }}
          transform="rotate(-90 40 40)"
        />
        <text x="40" y="40" textAnchor="middle" dominantBaseline="central" className={`text-sm font-bold ${c.text}`} fill="currentColor">
          {value.toFixed(1)}%
        </text>
      </svg>
      <span className="text-[10px] font-medium text-slate-500 text-center leading-tight">{label}</span>
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
  const w = 60;
  const h = 20;

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
    <svg width={w} height={h} className="mt-0.5">
      <path d={d} fill="none" stroke={strokeColor[color] ?? '#8b5cf6'} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export default function RseIndicators({ data }: RseIndicatorsProps) {
  if (!data) return null;

  const indicators = [
    { value: data.innovationRate, color: 'violet', label: 'Innovation' },
    { value: data.socialClauseRate, color: 'blue', label: 'Clause sociale' },
    { value: data.environmentalClauseRate, color: 'emerald', label: 'Clause env.' },
  ];

  return (
    <motion.div variants={fadeUp} className="bg-white rounded-xl border border-slate-200 p-6">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <Leaf className="w-4 h-4 text-emerald-500" />
          <h2 className="text-lg font-semibold text-slate-900">RSE & Innovation</h2>
        </div>
        <span className="text-[10px] text-slate-400">
          {data.totalContracts.toLocaleString('fr-FR')} marchés analysés
        </span>
      </div>

      <div className="flex justify-around mb-4">
        {indicators.map((ind) => (
          <div key={ind.color} className="flex flex-col items-center">
            <ProgressCircle value={ind.value} color={ind.color} label={ind.label} />
            <MiniTrend trend={data.trend} color={ind.color} />
          </div>
        ))}
      </div>

      {data.trend.length >= 3 && (
        <p className="text-[10px] text-slate-400 text-center">
          Tendance sur {data.trend.length} mois
        </p>
      )}
    </motion.div>
  );
}
