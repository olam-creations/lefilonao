'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { User, Target, MapPin, TrendingUp, ArrowRight } from 'lucide-react';
import { fadeUp } from '@/lib/motion-variants';
import type { MarketInsight, RegionalData } from './types';
import { formatAmount, formatCompactNumber } from './utils';

interface MyPositioningProps {
  profile: {
    companyName: string;
    sectors: string[];
    regions: string[];
    caN1: string;
  } | null;
  insights: MarketInsight | null;
  regionalData: RegionalData[];
}

export default function MyPositioning({ profile, insights, regionalData }: MyPositioningProps) {
  const analysis = useMemo(() => {
    if (!profile || (!profile.sectors.length && !profile.regions.length)) return null;

    const matchingRegions = regionalData.filter((r) =>
      profile.regions.some((pr) => r.name.toLowerCase().includes(pr.toLowerCase()) || pr.toLowerCase().includes(r.name.toLowerCase())),
    );

    const contractsInRegions = matchingRegions.reduce((s, r) => s + r.count, 0);
    const volumeInRegions = matchingRegions.reduce((s, r) => s + r.volume, 0);

    const totalMarketVolume = insights?.totalValue ?? 0;
    const ca = Number(profile.caN1?.replace(/\s/g, '')) || 0;
    const marketSharePct = totalMarketVolume > 0 && ca > 0
      ? ((ca / totalMarketVolume) * 100).toFixed(2)
      : null;

    return {
      companyName: profile.companyName,
      hasSectors: profile.sectors.length > 0,
      hasRegions: profile.regions.length > 0,
      profileSectors: profile.sectors,
      profileRegions: profile.regions,
      matchingRegions,
      contractsInRegions,
      volumeInRegions,
      totalMarketContracts: insights?.totalContracts ?? 0,
      totalMarketVolume,
      marketSharePct,
    };
  }, [profile, insights, regionalData]);

  if (!analysis) {
    return (
      <motion.div variants={fadeUp} className="bg-gradient-to-r from-slate-50 to-indigo-50 rounded-xl border border-slate-200 p-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
            <User className="w-5 h-5 text-indigo-500" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Mon positionnement</h2>
            <p className="text-xs text-slate-500">Complétez votre profil (secteurs & régions) pour un positionnement personnalisé.</p>
          </div>
          <a
            href="/dashboard/profile"
            className="ml-auto flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors"
          >
            Compléter <ArrowRight className="w-3.5 h-3.5" />
          </a>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div variants={fadeUp} className="bg-gradient-to-r from-indigo-50 via-violet-50 to-purple-50 rounded-2xl border border-indigo-200 p-5 sm:p-6 h-full flex flex-col justify-between shadow-sm">
      <div>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-200">
            <User className="w-5 h-5 text-white" />
          </div>
          <div className="min-w-0">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-tight">Mon positionnement</h2>
            <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest truncate">{analysis.companyName}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-6">
          {analysis.hasRegions && analysis.contractsInRegions > 0 && (
            <div className="bg-white/60 backdrop-blur-sm rounded-xl p-3 border border-indigo-100/50">
              <p className="text-base sm:text-lg font-bold text-indigo-700 tabular-nums">{formatCompactNumber(analysis.contractsInRegions)}</p>
              <p className="text-[9px] text-slate-500 uppercase tracking-wider font-bold leading-tight">Marchés régionaux</p>
            </div>
          )}
          {analysis.hasRegions && analysis.volumeInRegions > 0 && (
            <div className="bg-white/60 backdrop-blur-sm rounded-xl p-3 border border-indigo-100/50">
              <p className="text-base sm:text-lg font-bold text-indigo-700 tabular-nums">{formatAmount(analysis.volumeInRegions)}</p>
              <p className="text-[9px] text-slate-500 uppercase tracking-wider font-bold leading-tight">Volume régional</p>
            </div>
          )}
          <div className="bg-white/60 backdrop-blur-sm rounded-xl p-3 border border-indigo-100/50">
            <p className="text-base sm:text-lg font-bold text-violet-700 tabular-nums">{formatCompactNumber(analysis.totalMarketContracts)}</p>
            <p className="text-[9px] text-slate-500 uppercase tracking-wider font-bold leading-tight">Marchés totaux</p>
          </div>
          {analysis.marketSharePct && (
            <div className="bg-white/60 backdrop-blur-sm rounded-xl p-3 border border-indigo-100/50">
              <p className="text-base sm:text-lg font-bold text-purple-700 tabular-nums">{analysis.marketSharePct}%</p>
              <p className="text-[9px] text-slate-500 uppercase tracking-wider font-bold leading-tight">Part de marché</p>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-3 pt-4 border-t border-indigo-100/50">
        {analysis.hasSectors && (
          <div className="flex items-start gap-2">
            <Target className="w-3.5 h-3.5 text-violet-500 mt-0.5 flex-shrink-0" />
            <div className="min-w-0">
              <div className="flex flex-wrap gap-1">
                {analysis.profileSectors.map((s) => (
                  <span key={s} className="px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded-full bg-violet-100 text-violet-700 border border-violet-200">{s}</span>
                ))}
              </div>
            </div>
          </div>
        )}
        {analysis.hasRegions && (
          <div className="flex items-start gap-2">
            <MapPin className="w-3.5 h-3.5 text-indigo-500 mt-0.5 flex-shrink-0" />
            <div className="min-w-0">
              <div className="flex flex-wrap gap-1">
                {analysis.profileRegions.map((r) => (
                  <span key={r} className="px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded-full bg-indigo-100 text-indigo-700 border border-indigo-200">{r}</span>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
