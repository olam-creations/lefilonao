'use client';

import { useState, useEffect } from 'react';
import { PieChart, Loader2 } from 'lucide-react';

interface ShareData {
  name: string;
  wins: number;
  volume: number;
  shareByWins: number;
  shareByVolume: number;
}

interface MarketShareResponse {
  cpv: string;
  region: string;
  totalCompanies: number;
  totalWins: number;
  totalVolume: number;
  shares: ShareData[];
  othersWins: number;
  othersVolume: number;
}

const COLORS = [
  '#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899',
  '#f43f5e', '#f97316', '#eab308', '#22c55e', '#06b6d4',
  '#3b82f6', '#6d28d9', '#be185d', '#ea580c', '#65a30d',
];

interface DonutProps {
  segments: { label: string; value: number; color: string }[];
  total: number;
  centerLabel: string;
}

function DonutChart({ segments, total, centerLabel }: DonutProps) {
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  let accumulated = 0;

  return (
    <div className="relative w-40 h-40 mx-auto">
      <svg viewBox="0 0 160 160" className="w-full h-full -rotate-90">
        <circle cx="80" cy="80" r={radius} fill="none" stroke="#f1f5f9" strokeWidth="20" />
        {segments.map((seg, i) => {
          const pct = total > 0 ? seg.value / total : 0;
          const dashLength = pct * circumference;
          const offset = circumference - (accumulated / total) * circumference;
          accumulated += seg.value;
          return (
            <circle
              key={seg.label}
              cx="80" cy="80" r={radius}
              fill="none"
              stroke={seg.color}
              strokeWidth="20"
              strokeDasharray={`${dashLength} ${circumference - dashLength}`}
              strokeDashoffset={offset}
            />
          );
        })}
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xs font-bold text-slate-900">{centerLabel}</span>
      </div>
    </div>
  );
}

interface MarketShareChartProps {
  cpv?: string;
  region?: string;
}

export default function MarketShareChart({ cpv = '72', region }: MarketShareChartProps) {
  const [data, setData] = useState<MarketShareResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<'wins' | 'volume'>('wins');

  useEffect(() => {
    const params = new URLSearchParams({ cpv, period: '12' });
    if (region) params.set('region', region);

    fetch(`/api/intel/market-share?${params}`)
      .then((r) => r.json())
      .then((d) => { if (d.marketShare) setData(d.marketShare); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [cpv, region]);

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-5 flex items-center justify-center h-64">
        <Loader2 className="w-5 h-5 text-indigo-400 animate-spin" />
      </div>
    );
  }

  if (!data || data.shares.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <div className="flex items-center gap-2 mb-2">
          <PieChart className="w-4 h-4 text-indigo-500" />
          <h3 className="text-sm font-bold text-slate-900">Parts de marche</h3>
        </div>
        <p className="text-xs text-slate-400 text-center py-6">Donnees insuffisantes</p>
      </div>
    );
  }

  const isWins = mode === 'wins';
  const segments = data.shares.slice(0, 10).map((s, i) => ({
    label: s.name,
    value: isWins ? s.wins : s.volume,
    color: COLORS[i % COLORS.length],
  }));

  const othersValue = isWins ? data.othersWins : data.othersVolume;
  if (othersValue > 0) {
    segments.push({ label: 'Autres', value: othersValue, color: '#cbd5e1' });
  }

  const total = segments.reduce((sum, s) => sum + s.value, 0);

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <PieChart className="w-4 h-4 text-indigo-500" />
          <h3 className="text-sm font-bold text-slate-900">Parts de marche</h3>
        </div>
        <div className="flex gap-1 p-0.5 bg-slate-100 rounded-lg">
          <button
            onClick={() => setMode('wins')}
            className={`px-2.5 py-1 text-[10px] font-semibold rounded-md transition-all ${isWins ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
          >
            Contrats
          </button>
          <button
            onClick={() => setMode('volume')}
            className={`px-2.5 py-1 text-[10px] font-semibold rounded-md transition-all ${!isWins ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
          >
            Volume
          </button>
        </div>
      </div>

      <DonutChart segments={segments} total={total} centerLabel={`${data.totalCompanies} ent.`} />

      {/* Legend */}
      <div className="mt-4 space-y-1.5 max-h-40 overflow-y-auto">
        {segments.map((s) => (
          <div key={s.label} className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ backgroundColor: s.color }} />
            <span className="text-xs text-slate-600 flex-1 truncate">{s.label}</span>
            <span className="text-xs font-semibold text-slate-900">
              {total > 0 ? Math.round((s.value / total) * 100) : 0}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
