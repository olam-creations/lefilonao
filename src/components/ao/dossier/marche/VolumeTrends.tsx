'use client';

import { useState, useEffect } from 'react';
import { TrendingUp, Loader2 } from 'lucide-react';

interface TrendPoint {
  month: string;
  count: number;
  volume: number;
}

interface VolumeTrendsProps {
  cpvCode: string;
}

export default function VolumeTrends({ cpvCode }: VolumeTrendsProps) {
  const [trends, setTrends] = useState<TrendPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/market/trends?cpv=${encodeURIComponent(cpvCode)}`)
      .then((r) => r.ok ? r.json() : null)
      .then((d) => { if (d?.trends) setTrends(d.trends); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [cpvCode]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-4 justify-center text-sm text-slate-400">
        <Loader2 className="w-4 h-4 animate-spin" />
      </div>
    );
  }

  if (trends.length === 0) return null;

  const maxCount = Math.max(...trends.map((t) => t.count), 1);

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="w-4 h-4 text-indigo-500" />
        <h3 className="text-sm font-bold text-slate-900">Volume par mois</h3>
      </div>

      <div className="flex items-end gap-1 h-24">
        {trends.slice(-12).map((t) => (
          <div key={t.month} className="flex-1 flex flex-col items-center gap-1">
            <div
              className="w-full bg-indigo-100 hover:bg-indigo-200 rounded-t transition-colors"
              style={{ height: `${(t.count / maxCount) * 100}%`, minHeight: '2px' }}
              title={`${t.month}: ${t.count} marches`}
            />
            <span className="text-[8px] text-slate-400 -rotate-45 origin-top-left whitespace-nowrap">
              {t.month.slice(-5)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
