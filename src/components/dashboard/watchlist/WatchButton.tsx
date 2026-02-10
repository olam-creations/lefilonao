'use client';

import { useState, useEffect, useCallback } from 'react';
import { Bell, BellOff, Loader2 } from 'lucide-react';
import { getTokenPayload } from '@/lib/auth';

interface WatchButtonProps {
  buyerName: string;
  buyerSiret?: string;
  variant?: 'compact' | 'full';
  className?: string;
}

export default function WatchButton({ buyerName, buyerSiret, variant = 'full', className }: WatchButtonProps) {
  const [isWatched, setIsWatched] = useState(false);
  const [watchId, setWatchId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchStatus = useCallback(async () => {
    const email = getTokenPayload()?.email;
    if (!email) {
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`/api/watchlist?email=${encodeURIComponent(email)}`);
      const data = await res.json();
      const existing = data.watchlist?.find((item: { buyer_name: string; id: string }) => item.buyer_name === buyerName);
      if (existing) {
        setIsWatched(true);
        setWatchId(existing.id);
      }
    } catch (err) {
      // silent fail
    } finally {
      setLoading(false);
    }
  }, [buyerName]);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const handleToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const email = getTokenPayload()?.email;
    if (!email) return;

    setActionLoading(true);

    try {
      if (isWatched && watchId) {
        // Remove
        const res = await fetch(`/api/watchlist/${watchId}`, { method: 'DELETE' });
        if (res.ok) {
          setIsWatched(false);
          setWatchId(null);
        }
      } else {
        // Add
        const res = await fetch('/api/watchlist', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_email: email,
            buyer_name: buyerName,
            buyer_siret: buyerSiret,
          }),
        });
        const data = await res.json();
        if (res.ok) {
          setIsWatched(true);
          setWatchId(data.item.id);
        }
      }
    } catch (err) {
      // silent fail
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return <div className={`w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center ${className}`}><Loader2 className="w-3.5 h-3.5 animate-spin text-slate-300" /></div>;
  }

  return (
    <button
      onClick={handleToggle}
      disabled={actionLoading}
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
        isWatched
          ? 'bg-amber-50 text-amber-600 border-amber-100 shadow-sm shadow-amber-100'
          : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
      } ${className}`}
      title={isWatched ? "Ne plus surveiller" : "Surveiller cet acheteur"}
      aria-label={isWatched ? `Ne plus surveiller ${buyerName}` : `Surveiller ${buyerName}`}
    >
      {actionLoading ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
      ) : isWatched ? (
        <Bell className="w-3.5 h-3.5 fill-current" />
      ) : (
        <BellOff className="w-3.5 h-3.5" />
      )}
      {variant === 'full' && (isWatched ? "Abonné" : "Suivre")}
    </button>
  );
}
