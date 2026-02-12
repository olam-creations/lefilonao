'use client';

import { useState, useEffect } from 'react';
import { Calendar, Loader2 } from 'lucide-react';

interface UpcomingNotice {
  id: string;
  title: string;
  deadline: string;
  estimated_amount: number | null;
}

interface UpcomingFromBuyerProps {
  cpvCode: string;
}

export default function UpcomingFromBuyer({ cpvCode }: UpcomingFromBuyerProps) {
  const [notices, setNotices] = useState<UpcomingNotice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/market/upcoming?cpv=${encodeURIComponent(cpvCode)}`)
      .then((r) => r.ok ? r.json() : null)
      .then((d) => { if (d?.notices) setNotices(d.notices); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [cpvCode]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-4 justify-center text-sm text-slate-400">
        <Loader2 className="w-4 h-4 animate-spin" />
      </div>
    );
  }

  if (notices.length === 0) return null;

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <div className="flex items-center gap-2 mb-4">
        <Calendar className="w-4 h-4 text-indigo-500" />
        <h3 className="text-sm font-bold text-slate-900">AO a venir (meme CPV)</h3>
        <span className="text-xs text-slate-400">({notices.length})</span>
      </div>

      <div className="space-y-2">
        {notices.slice(0, 5).map((n) => (
          <div key={n.id} className="flex items-start justify-between gap-3 py-2 border-b border-slate-50 last:border-0">
            <div className="flex-1 min-w-0">
              <p className="text-xs text-slate-700 line-clamp-1">{n.title}</p>
              <p className="text-[10px] text-slate-400">Limite: {n.deadline}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
