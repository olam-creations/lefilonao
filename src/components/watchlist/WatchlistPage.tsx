'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Heart, Trash2, Eye, AlertCircle } from 'lucide-react';
import { useUser } from '@/components/UserProvider';
import TopBar from '@/components/dashboard/TopBar';
import WatchlistAlertsFeed from './WatchlistAlertsFeed';
import { stagger, fadeUp } from '@/lib/motion-variants';
import { formatDate } from '@/components/market/utils';
import type { WatchlistEntry, WatchlistAlert } from '@/components/market/types';

export default function WatchlistPage() {
  const { email } = useUser();
  const [entries, setEntries] = useState<WatchlistEntry[]>([]);
  const [alerts, setAlerts] = useState<WatchlistAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);


  const fetchData = useCallback(async () => {
    if (!email) return;
    setLoading(true);
    setError(null);

    try {
      const [entriesRes, alertsRes] = await Promise.all([
        fetch(`/api/watchlist?email=${encodeURIComponent(email)}`),
        fetch(`/api/watchlist/alerts?email=${encodeURIComponent(email)}`),
      ]);

      if (entriesRes.ok) {
        const json = await entriesRes.json();
        setEntries(json.entries ?? []);
      }
      if (alertsRes.ok) {
        const json = await alertsRes.json();
        setAlerts(json.alerts ?? []);
      }

      if (!entriesRes.ok && !alertsRes.ok) {
        setError('Impossible de charger la watchlist.');
      }
    } catch {
      setError('Erreur de connexion.');
    }

    setLoading(false);
  }, [email]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRemove = useCallback(async (id: string) => {
    setEntries((prev) => prev.filter((e) => e.id !== id));

    try {
      const res = await fetch(`/api/watchlist/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        await fetchData();
      }
    } catch {
      await fetchData();
    }
  }, [fetchData]);

  const watchedBuyerNames = new Set(entries.map((e) => e.buyer_name));
  const activeBuyers = watchedBuyerNames.size;
  const buyersWithActivity = new Set(alerts.map((a) => a.buyer_name));

  return (
    <div className="animate-fade-in">
      <TopBar 
        title="Watchlist" 
        description="Surveillez vos acheteurs cibles et suivez leurs AO récents."
        icon={<Heart className="w-6 h-6 text-rose-500" />}
        rightSlot={!loading && entries.length > 0 && (
          <div className="flex gap-2">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-slate-200 shadow-sm">
              <Eye className="w-4 h-4 text-indigo-500" />
              <span className="text-xs font-bold text-slate-900">{activeBuyers}</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-slate-200 shadow-sm">
              <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />
              <span className="text-xs font-bold text-slate-900">{alerts.length}</span>
            </div>
          </div>
        )}
      />

      <div className="max-w-5xl mx-auto py-10">
        {error && (
          <div className="flex items-center gap-3 p-4 mb-6 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-white rounded-xl border border-slate-200 p-5 animate-pulse">
                <div className="h-5 bg-slate-200 rounded w-1/2 mb-3" />
                <div className="h-4 bg-slate-100 rounded w-1/3" />
              </div>
            ))}
          </div>
        ) : entries.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <Heart className="w-10 h-10 mx-auto mb-4 opacity-50" />
            <p className="text-lg mb-2">Aucun acheteur surveillé</p>
            <p className="text-sm">Explorez le <a href="/dashboard/market" className="text-indigo-600 hover:text-indigo-700 font-medium">marché</a> et cliquez sur le cœur d&apos;un acheteur pour le surveiller.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Watched buyers */}
            <div>
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Acheteurs surveillés</h2>
              <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-3">
                {entries.map((entry) => {
                  const hasActivity = buyersWithActivity.has(entry.buyer_name);
                  return (
                    <motion.div
                      key={entry.id}
                      variants={fadeUp}
                      className="bg-white rounded-xl border border-slate-200 p-4 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <Heart className="w-4 h-4 fill-rose-500 text-rose-500 flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-slate-900 truncate">{entry.buyer_name}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            {entry.buyer_siret && (
                              <span className="text-xs text-slate-400">SIRET {entry.buyer_siret}</span>
                            )}
                            <span className="text-xs text-slate-400">Ajouté {formatDate(entry.added_at)}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <span className={`w-2 h-2 rounded-full ${hasActivity ? 'bg-emerald-500' : 'bg-slate-200'}`} title={hasActivity ? 'AO récents' : 'Aucun AO récent'} />
                        <button
                          onClick={() => handleRemove(entry.id)}
                          className="p-2 rounded-lg hover:bg-red-50 group"
                          title="Retirer de la watchlist"
                        >
                          <Trash2 className="w-4 h-4 text-slate-300 group-hover:text-red-500 transition-colors" />
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>
            </div>

            {/* Alert feed */}
            <div>
              <h2 className="text-lg font-semibold text-slate-900 mb-4">AO récents de vos acheteurs</h2>
              <WatchlistAlertsFeed alerts={alerts} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
