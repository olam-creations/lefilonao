'use client';

import { useState, useEffect } from 'react';
import { DollarSign, Loader2 } from 'lucide-react';

interface BenchmarkData {
  cpv: string;
  sampleSize: number;
  referenceAmount: number;
  min: number;
  max: number;
  median: number;
  avg: number;
  p20: number;
  p80: number;
  winningRangePct: number;
  buckets: { low: number; high: number; count: number }[];
}

function formatK(amount: number): string {
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `${Math.round(amount / 1_000)}K`;
  return String(amount);
}

interface PriceBenchmarkProps {
  cpv: string;
  region?: string;
  amount?: number;
}

export default function PriceBenchmark({ cpv, region, amount }: PriceBenchmarkProps) {
  const [data, setData] = useState<BenchmarkData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams({ cpv });
    if (region) params.set('region', region);
    if (amount) params.set('amount', String(amount));

    fetch(`/api/intel/price-benchmark?${params}`)
      .then((r) => r.json())
      .then((d) => { if (d.benchmark) setData(d.benchmark); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [cpv, region, amount]);

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-5 flex items-center justify-center h-32">
        <Loader2 className="w-5 h-5 text-indigo-400 animate-spin" />
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const range = data.max - data.min;
  const refPosition = amount && range > 0 ? ((amount - data.min) / range) * 100 : null;
  const p20Pos = range > 0 ? ((data.p20 - data.min) / range) * 100 : 0;
  const p80Pos = range > 0 ? ((data.p80 - data.min) / range) * 100 : 100;

  // Histogram
  const maxBucket = Math.max(...data.buckets.map((b) => b.count));

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <div className="flex items-center gap-2 mb-4">
        <DollarSign className="w-4 h-4 text-indigo-500" />
        <h3 className="text-sm font-bold text-slate-900">Benchmark prix</h3>
        <span className="text-[10px] text-slate-400 ml-auto">{data.sampleSize} contrats similaires</span>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-4 gap-3 mb-4">
        <div>
          <span className="text-[10px] text-slate-400 block">Min</span>
          <span className="text-sm font-bold text-slate-900">{formatK(data.min)}\u20AC</span>
        </div>
        <div>
          <span className="text-[10px] text-slate-400 block">Moyenne</span>
          <span className="text-sm font-bold text-slate-900">{formatK(data.avg)}\u20AC</span>
        </div>
        <div>
          <span className="text-[10px] text-slate-400 block">Mediane</span>
          <span className="text-sm font-bold text-slate-900">{formatK(data.median)}\u20AC</span>
        </div>
        <div>
          <span className="text-[10px] text-slate-400 block">Max</span>
          <span className="text-sm font-bold text-slate-900">{formatK(data.max)}\u20AC</span>
        </div>
      </div>

      {/* Range bar */}
      <div className="relative h-6 bg-slate-100 rounded-full mb-2 overflow-hidden">
        {/* Winning range (P20-P80) */}
        <div
          className="absolute top-0 bottom-0 bg-indigo-100 rounded-full"
          style={{ left: `${p20Pos}%`, width: `${p80Pos - p20Pos}%` }}
        />
        {/* Reference amount marker */}
        {refPosition !== null && (
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-indigo-600"
            style={{ left: `${Math.min(100, Math.max(0, refPosition))}%` }}
          >
            <div className="absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] font-bold text-indigo-600 whitespace-nowrap">
              {formatK(amount!)}\u20AC
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-between text-[10px] text-slate-400 mb-4">
        <span>{formatK(data.min)}\u20AC</span>
        <span className="text-indigo-500 font-medium">
          Zone gagnante: {formatK(data.p20)}-{formatK(data.p80)}\u20AC ({data.winningRangePct}%)
        </span>
        <span>{formatK(data.max)}\u20AC</span>
      </div>

      {/* Histogram */}
      <div className="flex items-end gap-0.5 h-16">
        {data.buckets.map((b, i) => {
          const height = maxBucket > 0 ? (b.count / maxBucket) * 100 : 0;
          const inRange = b.low >= data.p20 && b.high <= data.p80;
          return (
            <div
              key={i}
              className={`flex-1 rounded-t transition-all ${inRange ? 'bg-indigo-400' : 'bg-slate-200'}`}
              style={{ height: `${Math.max(4, height)}%` }}
              title={`${formatK(b.low)}-${formatK(b.high)}\u20AC: ${b.count} contrats`}
            />
          );
        })}
      </div>
    </div>
  );
}
