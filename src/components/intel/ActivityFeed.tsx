'use client';

import { useState, useEffect } from 'react';
import { Rss, Loader2 } from 'lucide-react';
import ActivityFeedItem from './ActivityFeedItem';

interface FeedItem {
  id: string;
  type: 'award' | 'new_tender' | 'competitor_win';
  buyerName: string;
  title: string;
  amount: number | null;
  date: string;
  winnerName?: string;
  region?: string;
  isWatched: boolean;
}

export default function ActivityFeed() {
  const [items, setItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/intel/feed?limit=15')
      .then((r) => r.json())
      .then((data) => {
        if (data.feed) setItems(data.feed);
        else if (data.error) setError(data.error);
      })
      .catch(() => setError('Erreur de connexion'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <div className="flex items-center gap-2 mb-4">
        <Rss className="w-4 h-4 text-indigo-500" />
        <h3 className="text-sm font-bold text-slate-900">Activite recente</h3>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-5 h-5 text-indigo-400 animate-spin" />
        </div>
      )}

      {error && (
        <p className="text-xs text-red-500 py-4 text-center">{error}</p>
      )}

      {!loading && !error && items.length === 0 && (
        <p className="text-xs text-slate-400 py-4 text-center">Aucune activite recente</p>
      )}

      <div className="space-y-1 max-h-[500px] overflow-y-auto">
        {items.map((item) => (
          <ActivityFeedItem key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
}
