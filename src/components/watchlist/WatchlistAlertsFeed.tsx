'use client';

import { motion } from 'framer-motion';
import { FileText } from 'lucide-react';
import { fadeUp } from '@/lib/motion-variants';
import { formatAmount, formatDate } from '@/components/market/utils';
import type { WatchlistAlert } from '@/components/market/types';

const CPV_SHORT: Record<string, string> = {
  '72': 'IT', '48': 'Logiciels', '79': 'Services', '71': 'Ingénierie',
  '80': 'Formation', '64': 'Télécoms', '50': 'Maintenance', '45': 'BTP',
  '34': 'Transport', '33': 'Médical',
};

interface WatchlistAlertsFeedProps {
  alerts: WatchlistAlert[];
}

export default function WatchlistAlertsFeed({ alerts }: WatchlistAlertsFeedProps) {
  if (alerts.length === 0) {
    return (
      <div className="text-center py-10 text-slate-400">
        <FileText className="w-8 h-8 mx-auto mb-3 opacity-50" />
        <p>Aucun AO récent de vos acheteurs surveillés</p>
        <p className="text-xs mt-1">Les AO des 30 derniers jours apparaîtront ici.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {alerts.map((alert) => {
        const cpvSector = alert.cpv_code?.slice(0, 2) ?? '';
        const cpvLabel = CPV_SHORT[cpvSector];

        return (
          <motion.div
            key={alert.id}
            variants={fadeUp}
            className="p-4 rounded-xl bg-white border border-slate-200 hover:border-slate-300 transition-colors"
          >
            <p className="text-sm font-medium text-slate-900 mb-2 line-clamp-2">{alert.title}</p>
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
              <span className="font-medium text-indigo-600">{alert.buyer_name}</span>
              <span className="text-slate-300">|</span>
              <span>{formatDate(alert.notification_date)}</span>
              {alert.amount > 0 && (
                <>
                  <span className="text-slate-300">|</span>
                  <span className="font-semibold text-emerald-600">{formatAmount(alert.amount)}</span>
                </>
              )}
              {cpvLabel && (
                <span className="px-2 py-0.5 rounded-full bg-violet-50 text-violet-600 text-[10px] font-medium">
                  {cpvLabel}
                </span>
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
