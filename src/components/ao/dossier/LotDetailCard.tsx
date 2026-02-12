'use client';

import { Package, Hash, Euro } from 'lucide-react';
import type { BoampLot } from '@/components/ao/AoNoticeDetails';

interface LotDetailCardProps {
  lot: BoampLot;
}

function formatEuro(amount: number): string {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(amount);
}

export default function LotDetailCard({ lot }: LotDetailCardProps) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 hover:border-indigo-200 transition-colors">
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center justify-center w-6 h-6 rounded-lg bg-indigo-50 text-indigo-700 text-xs font-bold">
            {lot.lot_number}
          </span>
          <h4 className="text-sm font-semibold text-slate-900 line-clamp-1">
            {lot.title ?? `Lot ${lot.lot_number}`}
          </h4>
        </div>
        {lot.estimated_amount && lot.estimated_amount > 0 && (
          <div className="flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md whitespace-nowrap">
            <Euro className="w-3 h-3" />
            {formatEuro(lot.estimated_amount)}
          </div>
        )}
      </div>

      {lot.cpv_code && (
        <div className="flex items-center gap-1.5 mb-2">
          <Hash className="w-3 h-3 text-slate-400" />
          <span className="text-xs text-slate-500">{lot.cpv_code}</span>
        </div>
      )}

      {lot.description && (
        <p className="text-xs text-slate-600 line-clamp-3">{lot.description}</p>
      )}
    </div>
  );
}
