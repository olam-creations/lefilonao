'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Bookmark, Search, Trash2, Building2, ExternalLink, Bell, ArrowRight, Loader2 } from 'lucide-react';
import { getTokenPayload } from '@/lib/auth';
import TopBar from '@/components/dashboard/TopBar';
import { stagger, fadeUp } from '@/lib/motion-variants';
import Link from 'next/link';

interface WatchlistItem {
  id: string;
  buyer_name: string;
  buyer_siret: string | null;
  added_at: string;
}

export default function WatchlistPage() {
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchWatchlist = useCallback(async () => {
    const email = getTokenPayload()?.email;
    if (!email) return;

    try {
      const res = await fetch(`/api/watchlist?email=${encodeURIComponent(email)}`);
      const data = await res.json();
      setWatchlist(data.watchlist || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWatchlist();
  }, [fetchWatchlist]);

  const removeBuyer = async (id: string) => {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/watchlist/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setWatchlist((prev) => prev.filter((item) => item.id !== id));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="animate-fade-in flex flex-col h-full">
      <TopBar 
        title="Watchlist Acheteurs" 
        description="Surveillez vos comptes clés et soyez alerté de leurs publications."
        icon={<Bookmark className="w-6 h-6 text-indigo-600" />}
      />

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-10 h-10 text-indigo-500 animate-spin mb-4" />
          <p className="text-slate-400 font-medium">Chargement de votre watchlist...</p>
        </div>
      ) : watchlist.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200">
          <div className="w-20 h-20 bg-indigo-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <Bell className="w-10 h-10 text-indigo-200" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">Votre watchlist est vide</h3>
          <p className="text-slate-400 max-w-sm mx-auto mb-8">
            Ajoutez des acheteurs depuis l&apos;Intelligence Marché ou le Dashboard pour les surveiller.
          </p>
          <Link
            href="/dashboard/market"
            className="px-6 py-2.5 rounded-xl text-sm font-bold bg-indigo-600 text-white hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 inline-flex items-center gap-2"
          >
            Explorer le marché <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <motion.div variants={stagger} initial="hidden" animate="show" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {watchlist.map((item) => (
            <motion.div
              key={item.id}
              variants={fadeUp}
              className="group bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-xl hover:shadow-indigo-500/5 transition-all relative overflow-hidden"
            >
              <div className="flex items-start justify-between gap-4 mb-6">
                <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center flex-shrink-0 group-hover:bg-indigo-50 transition-colors">
                  <Building2 className="w-6 h-6 text-slate-400 group-hover:text-indigo-500" />
                </div>
                <button
                  onClick={() => removeBuyer(item.id)}
                  disabled={deletingId === item.id}
                  className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                  aria-label="Supprimer de la watchlist"
                >
                  {deletingId === item.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                </button>
              </div>

              <h3 className="font-bold text-slate-900 mb-1 line-clamp-2 min-h-[2.5rem]">
                {item.buyer_name}
              </h3>
              
              {item.buyer_siret && (
                <p className="text-xs font-mono text-slate-400 mb-4">{item.buyer_siret}</p>
              )}

              <div className="flex items-center gap-2 mt-auto pt-4 border-t border-slate-50">
                <Link
                  href={`/dashboard/market?buyer=${encodeURIComponent(item.buyer_name)}`}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 h-10 rounded-xl text-xs font-bold bg-slate-50 text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 transition-all"
                >
                  Voir fiche <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="absolute top-0 left-0 right-0 h-1 bg-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity" />
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}