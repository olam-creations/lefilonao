'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { MapPin } from 'lucide-react';
import { fadeUp } from '@/lib/motion-variants';
import type { RegionalData } from './types';
import { formatAmount, formatCompactNumber } from './utils';
import { FRANCE_VIEWBOX, REGION_PATHS } from './france-regions';

interface RegionalHeatmapProps {
  data: RegionalData[];
  loading?: boolean;
  onRegionClick?: (name: string) => void;
}

export default function RegionalHeatmap({ data, loading, onRegionClick }: RegionalHeatmapProps) {
  const [hovered, setHovered] = useState<string | null>(null);

  const maxVolume = useMemo(() => Math.max(...data.map((d) => d.volume), 1), [data]);

  const regionLookup = useMemo(() => {
    const map = new Map<string, RegionalData>();
    for (const d of data) map.set(d.name, d);
    return map;
  }, [data]);

  if (loading) return <RegionalHeatmapSkeleton />;
  if (data.length === 0) return null;

  const getColor = (volume: number): string => {
    const intensity = volume / maxVolume;
    if (intensity > 0.75) return 'rgb(67, 56, 202)';
    if (intensity > 0.5) return 'rgb(99, 102, 241)';
    if (intensity > 0.25) return 'rgb(165, 180, 252)';
    return 'rgb(224, 231, 255)';
  };

  const hoveredData = hovered ? regionLookup.get(hovered) : null;

  return (
    <motion.div variants={fadeUp} className="bg-white rounded-xl border border-slate-200 p-6">
      <div className="flex items-center gap-2 mb-5">
        <MapPin className="w-4 h-4 text-indigo-500" />
        <h2 className="text-lg font-semibold text-slate-900">Cartographie régionale</h2>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* SVG Map — real geographic paths */}
        <div className="relative">
          <svg viewBox={FRANCE_VIEWBOX} className="w-full h-auto max-h-96">
            {Object.entries(REGION_PATHS).map(([name, region]) => {
              const rd = regionLookup.get(name);
              const vol = rd?.volume ?? 0;
              const isHovered = hovered === name;

              return (
                <path
                  key={region.id}
                  d={region.d}
                  fill={vol > 0 ? getColor(vol) : '#f1f5f9'}
                  stroke={isHovered ? '#312e81' : '#cbd5e1'}
                  strokeWidth={isHovered ? 2 : 0.5}
                  strokeLinejoin="round"
                  className="cursor-pointer transition-all duration-200"
                  onMouseEnter={() => setHovered(name)}
                  onMouseLeave={() => setHovered(null)}
                  onClick={() => onRegionClick?.(name)}
                />
              );
            })}
          </svg>

          {hoveredData && (
            <div className="absolute top-2 left-2 bg-white/95 backdrop-blur-sm border border-slate-200 rounded-lg px-3 py-2 shadow-lg pointer-events-none">
              <p className="text-xs font-semibold text-slate-900">{hovered}</p>
              <p className="text-[10px] text-slate-500">{hoveredData.count} marchés &middot; {formatAmount(hoveredData.volume)}</p>
            </div>
          )}

          {/* Legend */}
          <div className="flex items-center gap-2 mt-3 justify-center">
            <span className="text-[10px] text-slate-400">Faible</span>
            <div className="flex h-2 rounded-full overflow-hidden">
              <div className="w-8" style={{ background: 'rgb(224, 231, 255)' }} />
              <div className="w-8" style={{ background: 'rgb(165, 180, 252)' }} />
              <div className="w-8" style={{ background: 'rgb(99, 102, 241)' }} />
              <div className="w-8" style={{ background: 'rgb(67, 56, 202)' }} />
            </div>
            <span className="text-[10px] text-slate-400">Fort</span>
          </div>
        </div>

        {/* Ranked list */}
        <div className="space-y-2">
          {data.slice(0, 10).map((region, i) => {
            const pct = (region.volume / maxVolume) * 100;
            return (
              <div
                key={region.name}
                className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 -mx-1 px-1 rounded transition-colors"
                onMouseEnter={() => setHovered(region.name)}
                onMouseLeave={() => setHovered(null)}
                onClick={() => onRegionClick?.(region.name)}
              >
                <span className="text-[10px] font-mono text-slate-400 w-4">{i + 1}</span>
                <span className="text-xs text-slate-700 truncate w-32 flex-shrink-0 hover:text-indigo-600 transition-colors" title={region.name}>
                  {region.name}
                </span>
                <div className="flex-1 h-3 bg-slate-50 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                </div>
                <span className="text-[10px] font-mono text-slate-500 w-16 text-right">{formatCompactNumber(region.count)}</span>
                <span className="text-[10px] font-mono font-semibold text-indigo-600 w-16 text-right">{formatAmount(region.volume)}</span>
              </div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}

function RegionalHeatmapSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      <div className="flex items-center gap-2 mb-5">
        <div className="skeleton w-4 h-4 rounded" />
        <div className="skeleton w-44 h-5 rounded" />
      </div>
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="skeleton h-64 rounded-lg" />
        <div className="space-y-2">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="skeleton w-28 h-3 rounded" />
              <div className="flex-1 skeleton h-3 rounded" />
              <div className="skeleton w-14 h-3 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export { RegionalHeatmapSkeleton };
