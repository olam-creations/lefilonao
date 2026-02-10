'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Landmark, Trophy, TrendingUp, MapPin, FileText } from 'lucide-react';
import type { BuyerProfile, WinnerProfile, RankedEntity, EntityTrend } from './types';
import WatchButton from '@/components/dashboard/watchlist/WatchButton';
import { getToken } from '@/lib/auth';
import { formatAmount, formatDate } from './utils';

interface EntitySheetProps {
  open: boolean;
  entityName: string;
  entityType: 'buyer' | 'winner';
  cpv?: string;
  onClose: () => void;
}

export default function EntitySheet({ open, entityName, entityType, cpv, onClose }: EntitySheetProps) {
  const [buyerData, setBuyerData] = useState<BuyerProfile | null>(null);
  const [winnerData, setWinnerData] = useState<WinnerProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !entityName) return;
    setLoading(true);
    setError(null);
    setBuyerData(null);
    setWinnerData(null);

    const endpoint = entityType === 'buyer' ? 'buyer-profile' : 'winner-profile';
    const params = new URLSearchParams({ name: entityName });
    if (cpv) params.set('cpv', cpv);

    fetch(`/api/market/${endpoint}?${params}`, { headers: { 'Authorization': `Bearer ${getToken()}` } })
      .then((res) => {
        if (!res.ok) throw new Error('Erreur de chargement');
        return res.json();
      })
      .then((json) => {
        if (entityType === 'buyer') setBuyerData(json.buyer);
        else setWinnerData(json.winner);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [open, entityName, entityType, cpv]);

  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  }, [onClose]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  const isBuyer = entityType === 'buyer';
  const label = isBuyer ? 'Acheteur' : 'Attributaire';
  const Icon = isBuyer ? Landmark : Trophy;

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
            <div className="sticky top-0 z-10 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isBuyer ? 'bg-indigo-50' : 'bg-emerald-50'}`}>
                  <Icon className={`w-4 h-4 ${isBuyer ? 'text-indigo-500' : 'text-emerald-500'}`} />
                </div>
                <div className="min-w-0">
                  <h2 className="text-sm font-semibold text-slate-900 truncate">{entityName}</h2>
                  <span className={`text-xs font-medium ${isBuyer ? 'text-indigo-600' : 'text-emerald-600'}`}>{label}</span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {isBuyer && <WatchButton buyerName={entityName} />}
                <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 transition-colors">
                  <X className="w-4 h-4 text-slate-400" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {loading && <SheetSkeleton />}
              {error && <p className="text-sm text-red-500 text-center py-8">{error}</p>}

              {buyerData && <BuyerContent data={buyerData} />}
              {winnerData && <WinnerContent data={winnerData} />}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function KpiRow({ items }: { items: { label: string; value: string }[] }) {
  return (
    <div className="grid grid-cols-3 gap-3">
      {items.map((item) => (
        <div key={item.label} className="bg-slate-50 rounded-lg p-3 text-center">
          <p className="text-lg font-bold text-slate-900">{item.value}</p>
          <p className="text-[10px] text-slate-500 uppercase tracking-wide">{item.label}</p>
        </div>
      ))}
    </div>
  );
}

function MiniBarChart({ items, color }: { items: RankedEntity[]; color: 'indigo' | 'emerald' }) {
  const maxCount = Math.max(...items.map((i) => i.count), 1);
  const barClass = color === 'indigo' ? 'bg-indigo-500' : 'bg-emerald-500';

  return (
    <div className="space-y-2">
      {items.map((item) => (
        <div key={item.name} className="flex items-center gap-2">
          <span className="text-xs text-slate-600 truncate w-28 flex-shrink-0" title={item.name}>{item.name}</span>
          <div className="flex-1 h-4 bg-slate-100 rounded-full overflow-hidden">
            <div className={`h-full ${barClass} rounded-full`} style={{ width: `${(item.count / maxCount) * 100}%` }} />
          </div>
          <span className="text-xs font-mono text-slate-500 w-8 text-right">{item.count}</span>
        </div>
      ))}
    </div>
  );
}

function Sparkline({ data }: { data: EntityTrend[] }) {
  if (data.length < 2) return null;
  const maxVol = Math.max(...data.map((d) => d.volume), 1);
  const w = 280;
  const h = 48;
  const points = data.map((d, i) => ({
    x: (i / (data.length - 1)) * w,
    y: h - (d.volume / maxVol) * (h - 4),
  }));
  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-12">
      <path d={pathD} fill="none" stroke="rgb(99 102 241)" strokeWidth="2" />
    </svg>
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

function BuyerContent({ data }: { data: BuyerProfile }) {
  return (
    <>
      <KpiRow items={[
        { label: 'Marchés', value: String(data.totalContracts) },
        { label: 'Volume', value: formatAmount(data.totalVolume) },
        { label: 'Moyen', value: formatAmount(data.avgAmount) },
      ]} />

      {data.topWinners.length > 0 && (
        <div>
          <SectionHeader icon={<Trophy className="w-3.5 h-3.5 text-emerald-500" />} title="Top Attributaires" />
          <MiniBarChart items={data.topWinners} color="emerald" />
        </div>
      )}

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

      {data.trend.length > 1 && (
        <div>
          <SectionHeader icon={<TrendingUp className="w-3.5 h-3.5 text-indigo-500" />} title="Tendance (12 mois)" />
          <Sparkline data={data.trend} />
        </div>
      )}

      {data.recentContracts.length > 0 && (
        <div>
          <SectionHeader icon={<FileText className="w-3.5 h-3.5 text-slate-400" />} title="Derniers marchés" />
          <div className="space-y-2">
            {data.recentContracts.map((c) => (
              <div key={c.id} className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                <p className="text-xs font-medium text-slate-700 mb-1 line-clamp-2">{c.title}</p>
                <div className="flex items-center justify-between text-[10px] text-slate-400">
                  <span>{c.winnerName}</span>
                  <span className="font-semibold text-emerald-600">{formatAmount(c.amount)}</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5">{formatDate(c.date)}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

function WinnerContent({ data }: { data: WinnerProfile }) {
  return (
    <>
      <KpiRow items={[
        { label: 'Victoires', value: String(data.totalWins) },
        { label: 'Volume', value: formatAmount(data.totalVolume) },
        { label: 'Budget moy.', value: formatAmount(data.avgBudget) },
      ]} />

      {data.topBuyers.length > 0 && (
        <div>
          <SectionHeader icon={<Landmark className="w-3.5 h-3.5 text-indigo-500" />} title="Top Acheteurs" />
          <MiniBarChart items={data.topBuyers} color="indigo" />
        </div>
      )}

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

      {data.regions.length > 0 && (
        <div>
          <SectionHeader icon={<MapPin className="w-3.5 h-3.5 text-amber-500" />} title="Régions" />
          <div className="flex flex-wrap gap-1.5">
            {data.regions.slice(0, 8).map((r) => (
              <span key={r.name} className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-amber-50 text-amber-600">
                {r.name} ({r.count})
              </span>
            ))}
          </div>
        </div>
      )}

      {data.trend.length > 1 && (
        <div>
          <SectionHeader icon={<TrendingUp className="w-3.5 h-3.5 text-indigo-500" />} title="Tendance (12 mois)" />
          <Sparkline data={data.trend} />
        </div>
      )}

      {data.recentWins.length > 0 && (
        <div>
          <SectionHeader icon={<FileText className="w-3.5 h-3.5 text-slate-400" />} title="Dernières victoires" />
          <div className="space-y-2">
            {data.recentWins.map((c) => (
              <div key={c.id} className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                <p className="text-xs font-medium text-slate-700 mb-1 line-clamp-2">{c.title}</p>
                <div className="flex items-center justify-between text-[10px] text-slate-400">
                  <span>{c.buyerName}</span>
                  <span className="font-semibold text-emerald-600">{formatAmount(c.amount)}</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5">{formatDate(c.date)}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

function SheetSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="grid grid-cols-3 gap-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="bg-slate-50 rounded-lg p-3 h-16" />
        ))}
      </div>
      <div className="space-y-2">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="skeleton h-4 rounded" style={{ width: `${80 - i * 15}%` }} />
        ))}
      </div>
      <div className="skeleton h-12 rounded" />
    </div>
  );
}
