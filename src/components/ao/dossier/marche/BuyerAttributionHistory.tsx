'use client';

import { useState, useEffect } from 'react';
import { History, Loader2 } from 'lucide-react';
import { formatAmount } from '@/components/market/utils';

interface Attribution {
  title: string;
  winner_name: string;
  amount: number;
  date: string;
  cpv_code: string;
}

interface BuyerAttributionHistoryProps {
  buyerName: string;
  cpvCode: string | null;
}

export default function BuyerAttributionHistory({ buyerName, cpvCode }: BuyerAttributionHistoryProps) {
  const [attributions, setAttributions] = useState<Attribution[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams({ buyer_name: buyerName });
    if (cpvCode) params.set('cpv', cpvCode);

    fetch(`/api/market/attributions?${params}`)
      .then((r) => r.ok ? r.json() : null)
      .then((d) => { if (d?.attributions) setAttributions(d.attributions); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [buyerName, cpvCode]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-4 justify-center text-sm text-slate-400">
        <Loader2 className="w-4 h-4 animate-spin" /> Chargement historique...
      </div>
    );
  }

  if (attributions.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <div className="flex items-center gap-2 mb-2">
          <History className="w-4 h-4 text-indigo-500" />
          <h3 className="text-sm font-bold text-slate-900">Historique attributions</h3>
        </div>
        <p className="text-xs text-slate-400 text-center py-4">
          Aucune attribution trouvee pour cet acheteur
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <div className="flex items-center gap-2 mb-4">
        <History className="w-4 h-4 text-indigo-500" />
        <h3 className="text-sm font-bold text-slate-900">Historique attributions</h3>
        <span className="text-xs text-slate-400">({attributions.length})</span>
      </div>

      <div className="space-y-2 max-h-64 overflow-y-auto">
        {attributions.map((a, i) => (
          <div key={i} className="flex items-start justify-between gap-3 py-2 border-b border-slate-50 last:border-0">
            <div className="flex-1 min-w-0">
              <p className="text-xs text-slate-700 line-clamp-1">{a.title}</p>
              <p className="text-[10px] text-slate-400">{a.winner_name} &middot; {a.date}</p>
            </div>
            <span className="text-xs font-semibold text-emerald-600 whitespace-nowrap">
              {formatAmount(a.amount)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
