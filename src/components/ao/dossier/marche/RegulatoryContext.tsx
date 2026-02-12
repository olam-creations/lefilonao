'use client';

import { useState, useEffect } from 'react';
import { Scale, Loader2 } from 'lucide-react';

interface RegulatoryAlert {
  title: string;
  date: string;
  source: string;
  url: string | null;
}

export default function RegulatoryContext() {
  const [alerts, setAlerts] = useState<RegulatoryAlert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/market/regulatory')
      .then((r) => r.ok ? r.json() : null)
      .then((d) => { if (d?.alerts) setAlerts(d.alerts); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-4 justify-center text-sm text-slate-400">
        <Loader2 className="w-4 h-4 animate-spin" />
      </div>
    );
  }

  if (alerts.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <div className="flex items-center gap-2 mb-2">
          <Scale className="w-4 h-4 text-indigo-500" />
          <h3 className="text-sm font-bold text-slate-900">Contexte reglementaire</h3>
        </div>
        <p className="text-xs text-slate-400 text-center py-4">Aucune alerte reglementaire</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <div className="flex items-center gap-2 mb-4">
        <Scale className="w-4 h-4 text-indigo-500" />
        <h3 className="text-sm font-bold text-slate-900">Contexte reglementaire</h3>
      </div>

      <div className="space-y-2">
        {alerts.slice(0, 5).map((a, i) => (
          <div key={i} className="py-2 border-b border-slate-50 last:border-0">
            {a.url ? (
              <a
                href={a.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-indigo-600 hover:text-indigo-700 line-clamp-1"
              >
                {a.title}
              </a>
            ) : (
              <p className="text-xs text-slate-700 line-clamp-1">{a.title}</p>
            )}
            <p className="text-[10px] text-slate-400">{a.source} &middot; {a.date}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
