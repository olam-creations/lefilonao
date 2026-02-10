'use client';

import { useState, useEffect, useCallback } from 'react';
import { Heart } from 'lucide-react';
import { useUser } from '@/components/UserProvider';

interface WatchButtonProps {
  buyerName: string;
  buyerSiret?: string;
  className?: string;
}

export default function WatchButton({ buyerName, buyerSiret, className = '' }: WatchButtonProps) {
  const { email } = useUser();
  const [watched, setWatched] = useState(false);
  const [entryId, setEntryId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!email || !buyerName) return;
    setLoading(true);

    fetch(`/api/watchlist/check?email=${encodeURIComponent(email)}&buyerName=${encodeURIComponent(buyerName)}`)
      .then((res) => res.json())
      .then((json) => {
        setWatched(json.watched);
        setEntryId(json.id ?? null);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [email, buyerName]);

  const handleToggle = useCallback(async () => {
    if (!email || loading) return;

    const wasWatched = watched;
    const prevId = entryId;

    // Optimistic update
    setWatched(!wasWatched);

    try {
      if (wasWatched && prevId) {
        const res = await fetch(`/api/watchlist/${prevId}`, { method: 'DELETE' });
        if (!res.ok) throw new Error('delete failed');
        setEntryId(null);
      } else {
        const res = await fetch('/api/watchlist', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, buyerName, buyerSiret }),
        });
        if (!res.ok) throw new Error('add failed');
        const json = await res.json();
        setEntryId(json.entry.id);
      }
    } catch {
      // Revert on error
      setWatched(wasWatched);
      setEntryId(prevId);
    }
  }, [email, watched, entryId, loading, buyerName, buyerSiret]);

  if (!email) return null;

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className={`p-2 rounded-lg transition-all hover:bg-rose-50 disabled:opacity-50 ${className}`}
      title={watched ? 'Ne plus surveiller' : 'Surveiller cet acheteur'}
      aria-label={watched ? 'Ne plus surveiller' : 'Surveiller cet acheteur'}
    >
      <Heart
        className={`w-4 h-4 transition-colors ${
          watched ? 'fill-rose-500 text-rose-500' : 'text-slate-400'
        }`}
      />
    </button>
  );
}
