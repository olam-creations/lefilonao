'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp } from 'lucide-react';
import { fadeUp } from '@/lib/motion-variants';
import type { VolumeDataPoint } from './types';
import { formatCompactNumber, formatAmount, generateSvgPath } from './utils';

type Mode = 'count' | 'volume';

const VIEW_W = 800;
const VIEW_H = 300;
const PAD = { top: 20, right: 20, bottom: 40, left: 60 };

function buildPoints(data: VolumeDataPoint[], mode: Mode): { x: number; y: number }[] {
  const values = data.map((d) => (mode === 'count' ? d.count : d.volume));
  const maxVal = Math.max(...values, 1);
  const chartW = VIEW_W - PAD.left - PAD.right;
  const chartH = VIEW_H - PAD.top - PAD.bottom;

  const divisor = data.length > 1 ? data.length - 1 : 1;
  return data.map((_, i) => ({
    x: PAD.left + (i / divisor) * chartW,
    y: PAD.top + chartH - (values[i] / maxVal) * chartH,
  }));
}

function GridLines({ data, mode }: { data: VolumeDataPoint[]; mode: Mode }) {
  const values = data.map((d) => (mode === 'count' ? d.count : d.volume));
  const maxVal = Math.max(...values, 1);
  const chartH = VIEW_H - PAD.top - PAD.bottom;
  const steps = 4;

  return (
    <>
      {Array.from({ length: steps + 1 }, (_, i) => {
        const y = PAD.top + (i / steps) * chartH;
        const val = maxVal - (i / steps) * maxVal;
        return (
          <g key={i}>
            <line x1={PAD.left} y1={y} x2={VIEW_W - PAD.right} y2={y} stroke="#e2e8f0" strokeWidth={1} />
            <text x={PAD.left - 8} y={y + 4} textAnchor="end" className="text-[10px] fill-slate-400">
              {mode === 'count' ? formatCompactNumber(val) : formatAmount(val)}
            </text>
          </g>
        );
      })}
    </>
  );
}

function XLabels({ data }: { data: VolumeDataPoint[] }) {
  const chartW = VIEW_W - PAD.left - PAD.right;
  return (
    <>
      {data.map((d, i) => (
        <text
          key={d.month}
          x={PAD.left + (i / (data.length > 1 ? data.length - 1 : 1)) * chartW}
          y={VIEW_H - 8}
          textAnchor="middle"
          className="text-[10px] fill-slate-400"
        >
          {d.month}
        </text>
      ))}
    </>
  );
}

export default function VolumeTrend({ data }: { data: VolumeDataPoint[] }) {
  const [mode, setMode] = useState<Mode>('count');

  if (data.length === 0) return null;

  const points = buildPoints(data, mode);
  const linePath = generateSvgPath(points, false);
  const areaPath = generateSvgPath(
    [
      { x: points[0].x, y: VIEW_H - PAD.bottom },
      ...points,
      { x: points[points.length - 1].x, y: VIEW_H - PAD.bottom },
    ],
    true,
  );

  return (
    <motion.div variants={fadeUp} className="bg-white rounded-xl border border-slate-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-indigo-500" />
          <h2 className="text-lg font-semibold text-slate-900">Tendance 12 mois</h2>
        </div>
        <div className="flex bg-slate-100 rounded-lg p-0.5">
          <button
            onClick={() => setMode('count')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
              mode === 'count' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500'
            }`}
          >
            Nombre
          </button>
          <button
            onClick={() => setMode('volume')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
              mode === 'volume' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500'
            }`}
          >
            Volume
          </button>
        </div>
      </div>

      <svg viewBox={`0 0 ${VIEW_W} ${VIEW_H}`} preserveAspectRatio="xMidYMid meet" className="w-full h-auto">
        <defs>
          <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#6366f1" stopOpacity={0.2} />
            <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
          </linearGradient>
        </defs>

        <GridLines data={data} mode={mode} />
        <XLabels data={data} />

        <motion.path
          d={areaPath}
          fill="url(#areaGradient)"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
        />
        <motion.path
          d={linePath}
          fill="none"
          stroke="#6366f1"
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.2, ease: [0.25, 0.1, 0.25, 1] }}
        />

        {points.map((p, i) => (
          <motion.circle
            key={i}
            cx={p.x}
            cy={p.y}
            r={3.5}
            fill="white"
            stroke="#6366f1"
            strokeWidth={2}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.8 + i * 0.05 }}
          />
        ))}
      </svg>
    </motion.div>
  );
}
