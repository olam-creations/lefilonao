'use client';

import { useState, useEffect } from 'react';
import { Trophy, Loader2, Check, AlertTriangle } from 'lucide-react';

interface PatternTrait {
  key: string;
  label: string;
  pct: number;
  threshold: number;
}

interface PatternsData {
  cpv: string;
  region: string;
  sampleSize: number;
  totalAwards: number;
  medianAmount: number;
  avgOffersPerContract: number | null;
  traits: PatternTrait[];
}

interface UserMatch {
  certification: boolean;
  local: boolean;
  team: boolean;
  revenue: boolean;
  experience: boolean;
}

function formatK(amount: number): string {
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(1)}M\u20AC`;
  if (amount >= 1_000) return `${Math.round(amount / 1_000)}K\u20AC`;
  return `${amount}\u20AC`;
}

interface WinPatternCardProps {
  cpv?: string;
  region?: string;
  userMatch?: Partial<UserMatch>;
}

export default function WinPatternCard({ cpv = '72', region, userMatch }: WinPatternCardProps) {
  const [data, setData] = useState<PatternsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [reason, setReason] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams({ cpv });
    if (region) params.set('region', region);

    fetch(`/api/intel/win-patterns?${params}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.patterns) setData(d.patterns);
        if (d.reason) setReason(d.reason);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [cpv, region]);

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-5 flex items-center justify-center h-48">
        <Loader2 className="w-5 h-5 text-indigo-400 animate-spin" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <div className="flex items-center gap-2 mb-2">
          <Trophy className="w-4 h-4 text-indigo-500" />
          <h3 className="text-sm font-bold text-slate-900">Profil gagnant</h3>
        </div>
        <p className="text-xs text-slate-400 text-center py-6">{reason || 'Donnees insuffisantes'}</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Trophy className="w-4 h-4 text-indigo-500" />
          <h3 className="text-sm font-bold text-slate-900">Profil gagnant</h3>
        </div>
        <span className="text-[10px] text-slate-400">{data.sampleSize} entreprises analysees</span>
      </div>

      {/* Summary stats */}
      <div className="flex gap-4 mb-4 pb-3 border-b border-slate-100">
        <div>
          <span className="text-[10px] text-slate-400 block">Montant median</span>
          <span className="text-sm font-bold text-slate-900">{formatK(data.medianAmount)}</span>
        </div>
        {data.avgOffersPerContract && (
          <div>
            <span className="text-[10px] text-slate-400 block">Offres/marche</span>
            <span className="text-sm font-bold text-slate-900">{data.avgOffersPerContract}</span>
          </div>
        )}
      </div>

      {/* Traits */}
      <div className="space-y-2.5">
        {data.traits.map((trait) => {
          const matched = userMatch?.[trait.key as keyof UserMatch];
          const isSignificant = trait.pct >= trait.threshold;

          return (
            <div key={trait.key} className="flex items-center gap-2.5">
              {/* User match indicator */}
              <div className="w-5 h-5 flex items-center justify-center flex-shrink-0">
                {matched === true ? (
                  <Check className="w-4 h-4 text-emerald-500" />
                ) : matched === false ? (
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                ) : (
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-200" />
                )}
              </div>

              {/* Bar */}
              <div className="flex-1 min-w-0">
                <div className="flex justify-between mb-0.5">
                  <span className="text-xs text-slate-700">{trait.label}</span>
                  <span className={`text-xs font-bold ${isSignificant ? 'text-indigo-600' : 'text-slate-400'}`}>
                    {trait.pct}%
                  </span>
                </div>
                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${isSignificant ? 'bg-indigo-500' : 'bg-slate-300'}`}
                    style={{ width: `${trait.pct}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-[10px] text-slate-400 mt-3 leading-relaxed">
        Donnees historiques sur 2 ans. Ne constitue pas un conseil.
      </p>
    </div>
  );
}
