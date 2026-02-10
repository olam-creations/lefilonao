'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Info, ArrowUpRight } from 'lucide-react';
import { fadeUp } from '@/lib/motion-variants';
import type { RegionalData } from './types';
import { formatAmount, formatCompactNumber } from './utils';
import { FRANCE_VIEWBOX, REGION_PATHS } from './france-regions';

interface RegionalHeatmapProps {
  data: RegionalData[];
  loading?: boolean;
  onRegionClick?: (name: string) => void;
}

export function RegionalHeatmapSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 animate-pulse">
      <div className="h-5 w-44 bg-slate-50 rounded mb-8" />
      <div className="grid xl:grid-cols-2 gap-8">
        <div className="h-64 bg-slate-50 rounded-xl" />
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-4 bg-slate-50 rounded w-full" />
          ))}
        </div>
      </div>
    </div>
  );
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
    <motion.div variants={fadeUp} className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-8 shadow-sm overflow-hidden relative">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-indigo-50 text-indigo-500">
            <MapPin className="w-4 h-4" />
          </div>
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-tight">Cartographie régionale</h2>
        </div>
        <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50 px-2 py-1 rounded-md border border-slate-100">
          <Info className="w-3 h-3" /> Analyse géographique
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 lg:gap-12">
        {/* SVG Map Container */}
        <div className="relative group/map min-h-[300px] flex items-center justify-center">
          <svg viewBox={FRANCE_VIEWBOX} className="w-full h-auto max-h-[400px] drop-shadow-xl">
            {Object.entries(REGION_PATHS).map(([name, region]) => {
              const rd = regionLookup.get(name);
              const vol = rd?.volume ?? 0;
              const isHovered = hovered === name;

              return (
                <path
                  key={region.id}
                  d={region.d}
                  fill={vol > 0 ? getColor(vol) : '#f8fafc'}
                  stroke={isHovered ? '#312e81' : '#cbd5e1'}
                  strokeWidth={isHovered ? 2 : 0.5}
                  strokeLinejoin="round"
                  className="cursor-pointer transition-all duration-300 outline-none"
                  onMouseEnter={() => setHovered(name)}
                  onMouseLeave={() => setHovered(null)}
                  onClick={() => onRegionClick?.(name)}
                />
              );
            })}
          </svg>

          {/* Map Overlay Tooltip */}
          <AnimatePresence>
            {hoveredData && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 10 }}
                className="absolute top-0 right-0 bg-slate-900 text-white rounded-xl p-3 shadow-2xl z-10 border border-slate-800 min-w-[140px]"
              >
                <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-400 mb-1">{hovered}</p>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-[9px] text-slate-400 font-medium uppercase">Volume</span>
                  <span className="text-xs font-bold tabular-nums">{formatAmount(hoveredData.volume)}</span>
                </div>
                <div className="flex items-center justify-between gap-4 mt-1">
                  <span className="text-[9px] text-slate-400 font-medium uppercase">Marchés</span>
                  <span className="text-xs font-bold tabular-nums">{hoveredData.count}</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Legend */}
          <div className="absolute bottom-0 left-0 right-0 flex items-center gap-3 justify-center">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Faible</span>
            <div className="flex h-1.5 rounded-full overflow-hidden border border-slate-100">
              <div className="w-6 sm:w-8" style={{ background: 'rgb(224, 231, 255)' }} />
              <div className="w-6 sm:w-8" style={{ background: 'rgb(165, 180, 252)' }} />
              <div className="w-6 sm:w-8" style={{ background: 'rgb(99, 102, 241)' }} />
              <div className="w-6 sm:w-8" style={{ background: 'rgb(67, 56, 202)' }} />
            </div>
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Fort</span>
          </div>
        </div>

        {/* Ranked list */}
        <div className="flex flex-col justify-center">
          <div className="flex items-center justify-between mb-4 px-2">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Classement Régional</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Volume (M€)</p>
          </div>
          <div className="space-y-1.5">
            {data.slice(0, 10).map((region, i) => {
              const pct = (region.volume / maxVolume) * 100;
              const isHovered = hovered === region.name;
              return (
                <div
                  key={region.name}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 cursor-pointer ${
                    isHovered ? 'bg-indigo-50 shadow-sm shadow-indigo-100/50 scale-[1.02]' : 'hover:bg-slate-50'
                  }`}
                  onMouseEnter={() => setHovered(region.name)}
                  onMouseLeave={() => setHovered(null)}
                  onClick={() => onRegionClick?.(region.name)}
                >
                  <span className={`text-[10px] font-bold w-5 flex-shrink-0 ${isHovered ? 'text-indigo-600' : 'text-slate-300'}`}>
                    {(i + 1).toString().padStart(2, '0')}
                  </span>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1.5 gap-2">
                      <span className={`text-[11px] font-bold truncate uppercase tracking-tight ${isHovered ? 'text-indigo-900' : 'text-slate-700'}`}>
                        {region.name}
                      </span>
                      <span className={`text-[11px] font-mono font-bold tabular-nums ${isHovered ? 'text-indigo-600' : 'text-slate-900'}`}>
                        {formatAmount(region.volume).replace('€', '')}
                      </span>
                    </div>
                    <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
                      <motion.div
                        className={`h-full ${isHovered ? 'bg-indigo-600' : 'bg-indigo-400'} rounded-full`}
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                      />
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end min-w-[40px]">
                    <span className="text-[10px] font-bold text-slate-400 tabular-nums">{region.count}</span>
                    <span className="text-[8px] font-bold text-slate-300 uppercase tracking-tighter">AO</span>
                  </div>
                </div>
              );
            })}
          </div>
          
          <button 
            onClick={() => onRegionClick?.('Toutes')}
            className="mt-6 flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-widest hover:bg-slate-50 hover:border-slate-300 transition-all"
          >
            Voir tous les détails régionaux <ArrowUpRight className="w-3 h-3" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}