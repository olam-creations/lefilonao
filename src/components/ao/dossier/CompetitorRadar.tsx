'use client';

import { Users } from 'lucide-react';
import CompetitorGrid from '@/components/intel/CompetitorGrid';
import ThreatBadge from '@/components/intel/ThreatBadge';

interface CompetitorRadarProps {
  buyerSiret: string | null;
}

export default function CompetitorRadar({ buyerSiret }: CompetitorRadarProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Users className="w-4 h-4 text-indigo-500" />
        <h3 className="text-sm font-bold text-slate-900">Radar concurrents</h3>
      </div>

      <CompetitorGrid />
    </div>
  );
}
