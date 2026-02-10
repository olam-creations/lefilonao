'use client';

import { useState } from 'react';
import { Brain, Lock } from 'lucide-react';
import ActivityFeed from './ActivityFeed';
import CompetitorGrid from './CompetitorGrid';
import MarketShareChart from './MarketShareChart';
import BuyerPreferenceHeatmap from './BuyerPreferenceHeatmap';
import PriceBenchmark from './PriceBenchmark';
import WinPatternCard from './WinPatternCard';

interface IntelDashboardProps {
  /** User's preferred CPV sector (2-digit code) */
  cpv?: string;
  /** User's preferred region */
  region?: string;
  /** Watched buyer names for the heatmap */
  watchedBuyers?: string[];
  /** Whether the user has Pro access */
  hasPro: boolean;
}

function ProOverlay() {
  return (
    <div className="absolute inset-0 backdrop-blur-sm bg-white/60 rounded-xl flex items-center justify-center z-10">
      <div className="text-center">
        <Lock className="w-6 h-6 text-slate-400 mx-auto mb-2" />
        <p className="text-sm font-semibold text-slate-700">Fonctionnalite Pro</p>
        <p className="text-xs text-slate-400">Passez en Pro pour acceder a l&apos;intelligence concurrentielle</p>
      </div>
    </div>
  );
}

export default function IntelDashboard({ cpv = '72', region, watchedBuyers = [], hasPro }: IntelDashboardProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2.5">
        <Brain className="w-5 h-5 text-indigo-500" />
        <div>
          <h2 className="text-lg font-bold text-slate-900">Intelligence Concurrentielle</h2>
          <p className="text-xs text-slate-400">Donnees publiques DECP — mises a jour quotidiennement</p>
        </div>
      </div>

      {/* Row 1: Activity feed + Competitor tracker */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="relative">
          {!hasPro && <ProOverlay />}
          <ActivityFeed />
        </div>
        <div className="relative">
          {!hasPro && <ProOverlay />}
          <CompetitorGrid />
        </div>
      </div>

      {/* Row 2: Market share + Buyer preferences */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="relative">
          {!hasPro && <ProOverlay />}
          <MarketShareChart cpv={cpv} region={region} />
        </div>
        <div className="relative">
          {!hasPro && <ProOverlay />}
          <BuyerPreferenceHeatmap buyers={watchedBuyers} />
        </div>
      </div>

      {/* Row 3: Price benchmark + Win patterns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="relative">
          {!hasPro && <ProOverlay />}
          <PriceBenchmark cpv={cpv} region={region} />
        </div>
        <div className="relative">
          {!hasPro && <ProOverlay />}
          <WinPatternCard cpv={cpv} region={region} />
        </div>
      </div>
    </div>
  );
}
