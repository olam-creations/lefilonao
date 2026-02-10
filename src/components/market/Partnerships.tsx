'use client';

import { motion } from 'framer-motion';
import { Handshake, Users, Link as LinkIcon } from 'lucide-react';
import { fadeUp } from '@/lib/motion-variants';
import type { PartnershipsData } from './types';

interface PartnershipsProps {
  data: PartnershipsData | null;
}

export function PartnershipsSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 animate-pulse">
      <div className="h-5 w-40 bg-slate-50 rounded mb-6" />
      <div className="grid grid-cols-2 gap-3 mb-6">
        {[1, 2].map((i) => (
          <div key={i} className="h-20 bg-slate-50 rounded-xl" />
        ))}
      </div>
    </div>
  );
}

export default function Partnerships({ data }: PartnershipsProps) {
  if (!data) return null;

  return (
    <motion.div variants={fadeUp} className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm overflow-hidden h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-sky-50 text-sky-500">
            <Handshake className="w-4 h-4" />
          </div>
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-tight">Collaboration</h2>
        </div>
        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50 px-2 py-1 rounded-md border border-slate-100">
          Co-traitance
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-8">
        <div className="bg-gradient-to-br from-slate-50 to-white p-4 rounded-2xl border border-slate-100 flex flex-col items-center text-center">
          <Users className="w-4 h-4 text-slate-300 mb-2" />
          <p className="text-2xl font-bold text-slate-900 tabular-nums">{data.totalGroupements.toLocaleString('fr-FR')}</p>
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Groupements</p>
        </div>
        <div className="bg-gradient-to-br from-sky-50/50 to-white p-4 rounded-2xl border border-sky-100/50 flex flex-col items-center text-center">
          <LinkIcon className="w-4 h-4 text-sky-300 mb-2" />
          <p className="text-2xl font-bold text-sky-600 tabular-nums">{data.soloRate.toFixed(1)}%</p>
          <p className="text-[9px] font-bold text-sky-400 uppercase tracking-widest mt-1">Taux Solo</p>
        </div>
      </div>

      {data.pairs.length > 0 && (
        <div className="flex-1">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Paires de partenaires clés</p>
          <div className="space-y-3">
            {data.pairs.slice(0, 4).map((p, i) => (
              <div key={`${p.partner1}-${p.partner2}`} className="p-3 rounded-xl bg-slate-50/50 border border-slate-100/50 group/pair transition-colors hover:bg-white">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0 flex items-center gap-2">
                    <span className="text-[10px] font-bold text-slate-700 truncate uppercase tracking-tight">{p.partner1}</span>
                    <span className="text-slate-300 font-bold">&</span>
                    <span className="text-[10px] font-bold text-slate-700 truncate uppercase tracking-tight">{p.partner2}</span>
                  </div>
                  <span className="text-[10px] font-mono font-bold text-sky-600 flex-shrink-0">
                    {p.count} marchés
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}