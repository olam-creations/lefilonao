'use client';

import { Layers } from 'lucide-react';
import type { BoampLot } from '@/components/ao/AoNoticeDetails';
import LotDetailCard from './LotDetailCard';

interface SectionLotsProps {
  lots: BoampLot[];
  noticeId: string;
}

export default function SectionLots({ lots }: SectionLotsProps) {
  if (lots.length === 0) return null;

  const totalAmount = lots.reduce((sum, l) => sum + (l.estimated_amount ?? 0), 0);

  return (
    <section id="section-lots" className="scroll-mt-16">
      <div className="flex items-center gap-2 mb-4">
        <Layers className="w-5 h-5 text-indigo-500" />
        <h2 className="text-lg font-bold text-slate-900">Lots</h2>
        <span className="text-sm text-slate-400">({lots.length})</span>
        {totalAmount > 0 && (
          <span className="ml-auto text-sm font-semibold text-emerald-600">
            {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(totalAmount)} total
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {lots.map((lot) => (
          <LotDetailCard key={lot.lot_number} lot={lot} />
        ))}
      </div>
    </section>
  );
}
