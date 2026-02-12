'use client';

import { useState, useEffect } from 'react';
import { RefreshCw, Loader2 } from 'lucide-react';
import { formatAmount } from '@/components/market/utils';

interface Renewal {
  title: string;
  buyer_name: string;
  amount: number;
  end_date: string;
}

interface RenewalCandidatesProps {
  cpvCode: string;
  region: string;
}

export default function RenewalCandidates({ cpvCode, region }: RenewalCandidatesProps) {
  const [renewals, setRenewals] = useState<Renewal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/intel/renewals?cpv=${encodeURIComponent(cpvCode)}&region=${encodeURIComponent(region)}`)
      .then((r) => r.ok ? r.json() : null)
      .then((d) => { if (d?.renewals) setRenewals(d.renewals); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [cpvCode, region]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-4 justify-center text-sm text-slate-400">
        <Loader2 className="w-4 h-4 animate-spin" />
      </div>
    );
  }

  if (renewals.length === 0) return null;

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <div className="flex items-center gap-2 mb-4">
        <RefreshCw className="w-4 h-4 text-indigo-500" />
        <h3 className="text-sm font-bold text-slate-900">Renouvellements proches</h3>
        <span className="text-xs text-slate-400">({renewals.length})</span>
      </div>

      <div className="space-y-2">
        {renewals.slice(0, 5).map((r, i) => (
          <div key={i} className="flex items-start justify-between gap-3 py-2 border-b border-slate-50 last:border-0">
            <div className="flex-1 min-w-0">
              <p className="text-xs text-slate-700 line-clamp-1">{r.title}</p>
              <p className="text-[10px] text-slate-400">{r.buyer_name} &middot; Fin: {r.end_date}</p>
            </div>
            <span className="text-xs font-semibold text-amber-600 whitespace-nowrap">
              {formatAmount(r.amount)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
