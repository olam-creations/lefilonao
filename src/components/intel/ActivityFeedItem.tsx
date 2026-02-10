'use client';

import { Building2, Trophy, Eye } from 'lucide-react';
import Link from 'next/link';

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

function formatAmount(amount: number | null): string {
  if (!amount) return '';
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(1)}M\u20AC`;
  if (amount >= 1_000) return `${Math.round(amount / 1_000)}K\u20AC`;
  return `${amount}\u20AC`;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const hours = Math.floor(diff / 3_600_000);
  if (hours < 1) return 'maintenant';
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}j`;
  return `${Math.floor(days / 30)}m`;
}

export default function ActivityFeedItem({ item }: { item: FeedItem }) {
  return (
    <div className="flex gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
      <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center flex-shrink-0">
        {item.type === 'award' ? (
          <Trophy className="w-4 h-4 text-indigo-500" />
        ) : (
          <Building2 className="w-4 h-4 text-indigo-500" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-xs font-semibold text-slate-900 truncate">{item.buyerName}</span>
          {item.isWatched && (
            <Eye className="w-3 h-3 text-indigo-400 flex-shrink-0" />
          )}
          <span className="text-[10px] text-slate-400 flex-shrink-0 ml-auto">{timeAgo(item.date)}</span>
        </div>

        <p className="text-xs text-slate-600 truncate mb-1">{item.title}</p>

        <div className="flex items-center gap-2 flex-wrap">
          {item.winnerName && (
            <span className="text-[10px] text-slate-500">
              Attribue a <span className="font-medium text-slate-700">{item.winnerName}</span>
            </span>
          )}
          {item.amount && (
            <span className="text-[10px] font-semibold text-indigo-600">{formatAmount(item.amount)}</span>
          )}
        </div>
      </div>
    </div>
  );
}
