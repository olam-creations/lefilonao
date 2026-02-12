'use client';

import { useState, useEffect } from 'react';
import { BarChart3, Loader2 } from 'lucide-react';

interface CompetitionData {
  hhi: number;
  topCompetitors: { name: string; share: number }[];
  concentrationLevel: 'low' | 'moderate' | 'high';
}

interface CompetitionHHIProps {
  cpvCode: string;
  region: string;
}

export default function CompetitionHHI({ cpvCode, region }: CompetitionHHIProps) {
  const [data, setData] = useState<CompetitionData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/market/competition?cpv=${encodeURIComponent(cpvCode)}&region=${encodeURIComponent(region)}`)
      .then((r) => r.ok ? r.json() : null)
      .then((d) => { if (d) setData(d); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [cpvCode, region]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-4 justify-center text-sm text-slate-400">
        <Loader2 className="w-4 h-4 animate-spin" />
      </div>
    );
  }

  if (!data) return null;

  const levelConfig = {
    low: { label: 'Faible concentration', color: 'text-emerald-700 bg-emerald-50' },
    moderate: { label: 'Concentration moderee', color: 'text-amber-700 bg-amber-50' },
    high: { label: 'Forte concentration', color: 'text-red-700 bg-red-50' },
  }[data.concentrationLevel];

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <div className="flex items-center gap-2 mb-4">
        <BarChart3 className="w-4 h-4 text-indigo-500" />
        <h3 className="text-sm font-bold text-slate-900">Intensite concurrentielle</h3>
      </div>

      <div className="flex items-center gap-3 mb-4">
        <span className="text-2xl font-bold text-slate-900">{data.hhi}</span>
        <span className="text-xs text-slate-400">HHI</span>
        <span className={`px-2 py-0.5 text-xs font-medium rounded ${levelConfig.color}`}>
          {levelConfig.label}
        </span>
      </div>

      {data.topCompetitors.length > 0 && (
        <div className="space-y-1.5">
          {data.topCompetitors.slice(0, 5).map((c) => (
            <div key={c.name} className="flex items-center gap-2">
              <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-400 rounded-full"
                  style={{ width: `${Math.min(100, c.share)}%` }}
                />
              </div>
              <span className="text-[10px] text-slate-500 w-24 truncate">{c.name}</span>
              <span className="text-[10px] font-mono text-slate-400 w-10 text-right">{c.share}%</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
