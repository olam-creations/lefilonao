'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Download, Landmark, Trophy } from 'lucide-react';
import { fadeUp, stagger } from '@/lib/motion-variants';
import type { Attribution, MarketFilters } from './types';
import { formatAmount, sanitizeCsvCell, downloadCsv } from './utils';

interface AttributionsListProps {
  attributions: Attribution[];
  filters: MarketFilters;
  onBuyerClick?: (name: string) => void;
  onWinnerClick?: (name: string) => void;
}

function filterAttributions(items: Attribution[], filters: MarketFilters): Attribution[] {
  return items.filter((attr) => {
    if (filters.region && attr.region !== filters.region) return false;
    if (filters.amountMin > 0 && attr.amount < filters.amountMin * 1000) return false;
    if (filters.amountMax > 0 && attr.amount > filters.amountMax * 1000) return false;

    if (filters.period !== 'all') {
      const months = Number(filters.period);
      const cutoff = new Date();
      cutoff.setMonth(cutoff.getMonth() - months);
      if (new Date(attr.notificationDate) < cutoff) return false;
    }

    return true;
  });
}

function buildCsv(items: Attribution[]): string {
  const headers = ['Titre', 'Acheteur', 'Attributaire', 'Montant', 'Date', 'Région'];
  const rows = items.map((a) => [
    sanitizeCsvCell(a.rfpTitle),
    sanitizeCsvCell(a.buyerName),
    sanitizeCsvCell(a.winnerName),
    String(a.amount),
    a.notificationDate,
    sanitizeCsvCell(a.region),
  ]);
  return [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(';')).join('\n');
}

export default function AttributionsList({ attributions, filters, onBuyerClick, onWinnerClick }: AttributionsListProps) {
  const filtered = useMemo(() => filterAttributions(attributions, filters), [attributions, filters]);

  const handleExport = () => {
    const csv = buildCsv(filtered);
    downloadCsv('attributions-marche.csv', csv);
  };

  return (
    <motion.div variants={fadeUp} className="bg-white rounded-xl border border-slate-200 p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-slate-500" />
          <h2 className="text-lg font-semibold text-slate-900">Dernières attributions</h2>
          <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
            {filtered.length}
          </span>
        </div>
        <button
          onClick={handleExport}
          disabled={filtered.length === 0}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Download className="w-3.5 h-3.5" />
          Exporter CSV
        </button>
      </div>

      <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-0">
        {filtered.map((attr) => (
          <motion.div
            key={attr.id}
            variants={fadeUp}
            className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 sm:gap-4 py-4 border-b border-slate-100 last:border-0 hover:bg-slate-50/50 -mx-2 px-2 rounded transition-colors"
          >
            <div className="min-w-0">
              <h3 className="text-sm font-medium text-slate-900 mb-1.5 leading-snug">
                {attr.rfpTitle.length > 100
                  ? `${attr.rfpTitle.substring(0, 100)}...`
                  : attr.rfpTitle}
              </h3>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400">
                {onBuyerClick ? (
                  <button type="button" onClick={() => onBuyerClick(attr.buyerName)} className="flex items-center gap-1 hover:text-indigo-600 transition-colors">
                    <Landmark className="w-3 h-3" />
                    {attr.buyerName || 'Acheteur non spécifié'}
                  </button>
                ) : (
                  <span className="flex items-center gap-1">
                    <Landmark className="w-3 h-3" />
                    {attr.buyerName || 'Acheteur non spécifié'}
                  </span>
                )}
                <span>&middot;</span>
                {onWinnerClick ? (
                  <button type="button" onClick={() => onWinnerClick(attr.winnerName)} className="flex items-center gap-1 hover:text-emerald-600 transition-colors">
                    <Trophy className="w-3 h-3" />
                    {attr.winnerName}
                  </button>
                ) : (
                  <span className="flex items-center gap-1">
                    <Trophy className="w-3 h-3" />
                    {attr.winnerName}
                  </span>
                )}
                <span>&middot;</span>
                <span>{new Date(attr.notificationDate).toLocaleDateString('fr-FR')}</span>
                {attr.region && (
                  <>
                    <span>&middot;</span>
                    <span>{attr.region}</span>
                  </>
                )}
                {attr.offersReceived != null && attr.offersReceived > 0 && (
                  <>
                    <span>&middot;</span>
                    <span className={`px-1.5 py-0.5 text-[10px] font-semibold rounded-full ${
                      attr.offersReceived >= 5
                        ? 'bg-emerald-50 text-emerald-700'
                        : attr.offersReceived >= 3
                          ? 'bg-amber-50 text-amber-700'
                          : 'bg-red-50 text-red-700'
                    }`}>
                      {attr.offersReceived} offre{attr.offersReceived > 1 ? 's' : ''}
                    </span>
                  </>
                )}
              </div>
            </div>
            <span className="text-sm font-bold text-emerald-600 font-mono flex-shrink-0">
              {formatAmount(attr.amount)}
            </span>
          </motion.div>
        ))}
      </motion.div>

      {filtered.length === 0 && (
        <p className="text-center text-slate-400 py-8 text-sm">
          Aucune attribution ne correspond aux filtres sélectionnés.
        </p>
      )}
    </motion.div>
  );
}
