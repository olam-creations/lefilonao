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
    <motion.div variants={fadeUp} className="bg-gradient-to-r from-indigo-50 via-violet-50 to-purple-50 rounded-xl border border-indigo-200 p-6">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
          <User className="w-4 h-4 text-indigo-600" />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-slate-900">Mon positionnement</h2>
          <p className="text-xs text-slate-500">{analysis.companyName}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        {analysis.hasRegions && analysis.contractsInRegions > 0 && (
          <div className="bg-white/80 rounded-lg p-3 text-center">
            <p className="text-lg font-bold text-indigo-700">{formatCompactNumber(analysis.contractsInRegions)}</p>
            <p className="text-[10px] text-slate-500 uppercase tracking-wide">Marchés dans vos régions</p>
          </div>
        )}
        {analysis.hasRegions && analysis.volumeInRegions > 0 && (
          <div className="bg-white/80 rounded-lg p-3 text-center">
            <p className="text-lg font-bold text-indigo-700">{formatAmount(analysis.volumeInRegions)}</p>
            <p className="text-[10px] text-slate-500 uppercase tracking-wide">Volume régional</p>
          </div>
        )}
        <div className="bg-white/80 rounded-lg p-3 text-center">
          <p className="text-lg font-bold text-violet-700">{formatCompactNumber(analysis.totalMarketContracts)}</p>
          <p className="text-[10px] text-slate-500 uppercase tracking-wide">Marchés totaux</p>
        </div>
        {analysis.marketSharePct && (
          <div className="bg-white/80 rounded-lg p-3 text-center">
            <p className="text-lg font-bold text-purple-700">{analysis.marketSharePct}%</p>
            <p className="text-[10px] text-slate-500 uppercase tracking-wide">Part de marché CA</p>
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-4">
        {analysis.hasSectors && (
          <div className="flex items-start gap-2">
            <Target className="w-3.5 h-3.5 text-violet-500 mt-0.5" />
            <div>
              <p className="text-[10px] text-slate-500 uppercase tracking-wide mb-1">Vos secteurs</p>
              <div className="flex flex-wrap gap-1">
                {analysis.profileSectors.map((s) => (
                  <span key={s} className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-violet-100 text-violet-700">{s}</span>
                ))}
              </div>
            </div>
          </div>
        )}
        {analysis.hasRegions && (
          <div className="flex items-start gap-2">
            <MapPin className="w-3.5 h-3.5 text-indigo-500 mt-0.5" />
            <div>
              <p className="text-[10px] text-slate-500 uppercase tracking-wide mb-1">Vos régions</p>
              <div className="flex flex-wrap gap-1">
                {analysis.profileRegions.map((r) => (
                  <span key={r} className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-indigo-100 text-indigo-700">{r}</span>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
