'use client';

import { motion } from 'framer-motion';
import { Handshake } from 'lucide-react';
import { fadeUp } from '@/lib/motion-variants';
import type { PartnershipsData } from './types';

interface PartnershipsProps {
  data: PartnershipsData | null;
}

export function PartnershipsSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 animate-pulse">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-4 h-4 bg-slate-200 rounded" />
        <div className="h-5 w-40 bg-slate-200 rounded" />
      </div>
      <div className="grid grid-cols-2 gap-3 mb-5">
        {[1, 2].map((i) => (
          <div key={i} className="bg-slate-50 rounded-lg p-3">
            <div className="h-3 w-20 bg-slate-200 rounded mb-2" />
            <div className="h-6 w-12 bg-slate-200 rounded" />
          </div>
        ))}
      </div>
      <div className="space-y-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-5 bg-slate-100 rounded" />
        ))}
      </div>
    </div>
  );
}

export default function Partnerships({ data }: PartnershipsProps) {
  if (!data) return null;

  return (
    <motion.div variants={fadeUp} className="bg-white rounded-xl border border-slate-200 p-6">
      <div className="flex items-center gap-2 mb-4">
        <Handshake className="w-4 h-4 text-sky-500" />
        <h2 className="text-lg font-semibold text-slate-900">Partenariats & co-traitance</h2>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="bg-slate-50 rounded-lg p-3">
          <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider mb-1">Groupements</p>
          <p className="text-xl font-bold text-slate-900">{data.totalGroupements.toLocaleString('fr-FR')}</p>
        </div>
        <div className="bg-slate-50 rounded-lg p-3">
          <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider mb-1">Taux solo</p>
          <p className="text-xl font-bold text-slate-900">{data.soloRate.toFixed(1)}%</p>
        </div>
      </div>

      {data.types.length > 0 && (
        <div className="mb-5">
          <p className="text-xs font-medium text-slate-500 mb-2">Types de groupement</p>
          <div className="flex flex-wrap gap-1.5">
            {data.types.map((t) => (
              <span key={t.type} className="px-2.5 py-1 text-[10px] font-medium rounded-full bg-sky-50 text-sky-700">
                {t.type} <span className="text-sky-400">({t.count})</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {data.pairs.length > 0 && (
        <div>
          <p className="text-xs font-medium text-slate-500 mb-3">Top paires partenaires</p>
          <div className="space-y-2">
            {data.pairs.map((p, i) => (
              <div key={`${p.partner1}-${p.partner2}`} className="flex items-center gap-3 py-1.5 border-b border-slate-50 last:border-0">
                <span className="text-[10px] font-bold text-slate-400 w-4 text-right">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <span className="text-xs text-slate-700 truncate" title={p.partner1}>{p.partner1}</span>
                  <span className="text-[10px] text-slate-400 mx-1.5">+</span>
                  <span className="text-xs text-slate-700 truncate" title={p.partner2}>{p.partner2}</span>
                </div>
                <span className="text-[10px] font-semibold text-sky-600 flex-shrink-0">
                  {p.count} marchés
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}
