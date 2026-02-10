'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MapPin, Landmark, Trophy, FileText, Building } from 'lucide-react';
import type { RegionDetail, RankedEntity } from './types';
import { formatAmount, formatDate } from './utils';

interface RegionSheetProps {
  open: boolean;
  regionName: string;
  cpv?: string;
  onClose: () => void;
  onBuyerClick?: (name: string) => void;
  onWinnerClick?: (name: string) => void;
}

export default function RegionSheet({ open, regionName, cpv, onClose, onBuyerClick, onWinnerClick }: RegionSheetProps) {
  const [data, setData] = useState<RegionDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !regionName) return;
    setLoading(true);
    setError(null);
    setData(null);

    const params = new URLSearchParams({ region: regionName });
    if (cpv) params.set('cpv', cpv);

    fetch(`/api/market/region-detail?${params}`)
      .then((res) => {
        if (!res.ok) throw new Error('Erreur de chargement');
        return res.json();
      })
      .then((json) => setData(json.region))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [open, regionName, cpv]);

  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  }, [onClose]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex justify-end"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={handleBackdropClick}
        >
          <div className="absolute inset-0 bg-black/20 backdrop-blur-[2px]" />
          <motion.div
            className="relative w-full max-w-lg bg-white shadow-2xl overflow-y-auto"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          >
            {/* Header */}
            <div className="sticky top-0 z-10 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center">
                  <MapPin className="w-4 h-4 text-indigo-500" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-sm font-semibold text-slate-900 truncate">{regionName}</h2>
                  <span className="text-xs text-indigo-600">Région</span>
                </div>
              </div>
              <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 transition-colors">
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {loading && <SheetSkeleton />}
              {error && <p className="text-sm text-red-500 text-center py-8">{error}</p>}
              {data && <RegionContent data={data} onBuyerClick={onBuyerClick} onWinnerClick={onWinnerClick} />}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function RegionContent({ data, onBuyerClick, onWinnerClick }: { data: RegionDetail; onBuyerClick?: (name: string) => void; onWinnerClick?: (name: string) => void }) {
  const maxLocVol = Math.max(...data.locations.map((d) => d.volume), 1);

  return (
    <>
      {/* KPIs */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-slate-50 rounded-lg p-3 text-center">
          <p className="text-lg font-bold text-slate-900">{data.totalContracts}</p>
          <p className="text-[10px] text-slate-500 uppercase tracking-wide">Marchés</p>
        </div>
        <div className="bg-slate-50 rounded-lg p-3 text-center">
          <p className="text-lg font-bold text-slate-900">{formatAmount(data.totalVolume)}</p>
          <p className="text-[10px] text-slate-500 uppercase tracking-wide">Volume</p>
        </div>
        <div className="bg-slate-50 rounded-lg p-3 text-center">
          <p className="text-lg font-bold text-slate-900">{formatAmount(data.avgAmount)}</p>
          <p className="text-[10px] text-slate-500 uppercase tracking-wide">Moyen</p>
        </div>
      </div>

      {/* Location breakdown */}
      {data.locations.length > 0 && (
        <div>
          <SectionHeader icon={<Building className="w-3.5 h-3.5 text-indigo-500" />} title={`Lieux d'exécution (${data.locations.length})`} />
          <div className="space-y-1.5">
            {data.locations.map((loc) => {
              const pct = (loc.volume / maxLocVol) * 100;
              return (
                <div key={loc.name} className="flex items-center gap-2">
                  <span className="text-xs text-slate-700 truncate w-32 flex-shrink-0" title={loc.name}>{loc.name}</span>
                  <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-[10px] font-mono text-slate-500 w-6 text-right">{loc.count}</span>
                  <span className="text-[10px] font-mono font-semibold text-indigo-600 w-14 text-right">{formatAmount(loc.volume)}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Top buyers */}
      {data.topBuyers.length > 0 && (
        <div>
          <SectionHeader icon={<Landmark className="w-3.5 h-3.5 text-indigo-500" />} title="Top Acheteurs" />
          <ClickableList items={data.topBuyers} onClick={onBuyerClick} />
        </div>
      )}

      {/* Top winners */}
      {data.topWinners.length > 0 && (
        <div>
          <SectionHeader icon={<Trophy className="w-3.5 h-3.5 text-emerald-500" />} title="Top Attributaires" />
          <ClickableList items={data.topWinners} onClick={onWinnerClick} />
        </div>
      )}

      {/* Sectors */}
      {data.sectors.length > 0 && (
        <div>
          <SectionHeader icon={<FileText className="w-3.5 h-3.5 text-violet-500" />} title="Secteurs" />
          <div className="flex flex-wrap gap-1.5">
            {data.sectors.map((s) => (
              <span key={s.code} className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-violet-50 text-violet-600">
                {s.name} ({s.count})
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Recent contracts */}
      {data.recentContracts.length > 0 && (
        <div>
          <SectionHeader icon={<FileText className="w-3.5 h-3.5 text-slate-400" />} title="Derniers marchés" />
          <div className="space-y-2">
            {data.recentContracts.map((c) => (
              <div key={c.id} className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                <p className="text-xs font-medium text-slate-700 mb-1 line-clamp-2">{c.title}</p>
                <div className="flex items-center justify-between text-[10px] text-slate-400">
                  <div className="flex items-center gap-2 min-w-0">
                    {onBuyerClick ? (
                      <button type="button" onClick={() => onBuyerClick(c.buyerName)} className="hover:text-indigo-600 transition-colors truncate max-w-[120px]">{c.buyerName}</button>
                    ) : (
                      <span className="truncate max-w-[120px]">{c.buyerName}</span>
                    )}
                    <span>&rarr;</span>
                    {onWinnerClick ? (
                      <button type="button" onClick={() => onWinnerClick(c.winnerName)} className="hover:text-emerald-600 transition-colors truncate max-w-[120px]">{c.winnerName}</button>
                    ) : (
                      <span className="truncate max-w-[120px]">{c.winnerName}</span>
                    )}
                  </div>
                  <span className="font-semibold text-emerald-600 flex-shrink-0">{formatAmount(c.amount)}</span>
                </div>
                <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-400">
                  <span>{formatDate(c.date)}</span>
                  {c.lieuExecution && (
                    <>
                      <span>&middot;</span>
                      <span className="truncate">{c.lieuExecution}</span>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

function ClickableList({ items, onClick }: { items: RankedEntity[]; onClick?: (name: string) => void }) {
  const maxCount = Math.max(...items.map((i) => i.count), 1);
  return (
    <div className="space-y-2">
      {items.map((item) => (
        <div key={item.name} className="flex items-center gap-2">
          {onClick ? (
            <button type="button" onClick={() => onClick(item.name)} className="text-xs text-slate-700 truncate w-28 flex-shrink-0 text-left hover:text-indigo-600 hover:underline transition-colors" title={item.name}>
              {item.name}
            </button>
          ) : (
            <span className="text-xs text-slate-600 truncate w-28 flex-shrink-0" title={item.name}>{item.name}</span>
          )}
          <div className="flex-1 h-4 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${(item.count / maxCount) * 100}%` }} />
          </div>
          <span className="text-xs font-mono text-slate-500 w-8 text-right">{item.count}</span>
        </div>
      ))}
    </div>
  );
}

function SectionHeader({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      {icon}
      <h3 className="text-sm font-semibold text-slate-700">{title}</h3>
    </div>
  );
}

function SheetSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="grid grid-cols-3 gap-3">
        {[0, 1, 2].map((i) => <div key={i} className="bg-slate-50 rounded-lg p-3 h-16" />)}
      </div>
      <div className="space-y-2">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="skeleton w-5 h-3 rounded" />
            <div className="skeleton w-28 h-3 rounded" />
            <div className="flex-1 skeleton h-3 rounded" />
          </div>
        ))}
      </div>
      <div className="space-y-2">
        {[0, 1, 2].map((i) => <div key={i} className="skeleton h-4 rounded" style={{ width: `${80 - i * 15}%` }} />)}
      </div>
    </div>
  );
}
