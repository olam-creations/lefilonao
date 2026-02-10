'use client';

import { Building2, TrendingUp, MapPin, Users } from 'lucide-react';
import ThreatBadge from './ThreatBadge';

interface CompetitorData {
  name: string;
  siret: string;
  totalWins: number;
  totalVolume: number;
  avgContract: number;
  winRate: number | null;
  topBuyers: { name: string; count: number }[];
  sectors: { code: string; count: number }[];
  regions: { name: string; count: number }[];
  commonBuyers: number;
  threatLevel: 'high' | 'medium' | 'low';
}

function formatAmount(amount: number): string {
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(1)}M\u20AC`;
  if (amount >= 1_000) return `${Math.round(amount / 1_000)}K\u20AC`;
  return `${amount}\u20AC`;
}

export default function CompetitorCard({ data }: { data: CompetitorData }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 hover:border-slate-300 hover:shadow-sm transition-all">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
            <Building2 className="w-4.5 h-4.5 text-slate-500" />
          </div>
          <div className="min-w-0">
            <h4 className="text-sm font-bold text-slate-900 truncate">{data.name}</h4>
            {data.siret && (
              <span className="text-[10px] text-slate-400">{data.siret}</span>
            )}
          </div>
        </div>
        <ThreatBadge level={data.threatLevel} />
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-3 gap-3 mb-3">
        <div>
          <span className="text-[10px] text-slate-400 block">Contrats</span>
          <span className="text-sm font-bold text-slate-900">{data.totalWins}</span>
        </div>
        <div>
          <span className="text-[10px] text-slate-400 block">Taux victoire</span>
          <span className="text-sm font-bold text-slate-900">{data.winRate !== null ? `${data.winRate}%` : '-'}</span>
        </div>
        <div>
          <span className="text-[10px] text-slate-400 block">Moyen</span>
          <span className="text-sm font-bold text-slate-900">{formatAmount(data.avgContract)}</span>
        </div>
      </div>

      {/* Top buyers */}
      {data.topBuyers.length > 0 && (
        <div className="mb-3">
          <span className="text-[10px] text-slate-400 block mb-1">Top acheteurs</span>
          <div className="space-y-1">
            {data.topBuyers.slice(0, 3).map((b) => (
              <div key={b.name} className="flex items-center justify-between">
                <span className="text-xs text-slate-600 truncate">{b.name}</span>
                <span className="text-[10px] font-semibold text-slate-900 ml-2 flex-shrink-0">{b.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Overlap indicator */}
      {data.commonBuyers > 0 && (
        <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-amber-50 rounded-lg border border-amber-100">
          <Users className="w-3 h-3 text-amber-500" />
          <span className="text-[10px] font-medium text-amber-700">
            {data.commonBuyers} acheteur{data.commonBuyers > 1 ? 's' : ''} en commun
          </span>
        </div>
      )}
    </div>
  );
}
