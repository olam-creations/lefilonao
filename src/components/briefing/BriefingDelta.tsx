'use client';

import { TrendingUp, Bell, Award } from 'lucide-react';
import type { BriefingDelta as BriefingDeltaType } from '@/lib/briefing';

interface Props {
  delta: BriefingDeltaType;
  lastVisit: string | null;
}

function timeSince(dateStr: string): string {
  const ms = Date.now() - new Date(dateStr).getTime();
  const hours = Math.floor(ms / 3600000);
  if (hours < 1) return 'moins d\'une heure';
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days} jour${days > 1 ? 's' : ''}`;
}

function formatAmount(amount: number): string {
  if (amount >= 1000000) return `${(amount / 1000000).toFixed(1)}M€`;
  if (amount >= 1000) return `${Math.round(amount / 1000)}K€`;
  return `${amount}€`;
}

export default function BriefingDelta({ delta, lastVisit }: Props) {
  const hasActivity = delta.newAoCount > 0 || delta.newAttributions.length > 0 || delta.watchlistActivity > 0;

  if (!hasActivity) return null;

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">
        Depuis votre dernière visite{lastVisit ? ` (il y a ${timeSince(lastVisit)})` : ''}
      </p>
      <ul className="space-y-1.5">
        {delta.newAoCount > 0 && (
          <li className="flex items-start gap-2 text-sm text-slate-600">
            <TrendingUp className="w-4 h-4 text-indigo-500 mt-0.5 shrink-0" />
            <span>
              <strong className="text-slate-900">{delta.newAoCount}</strong> nouveau{delta.newAoCount > 1 ? 'x' : ''} AO correspond{delta.newAoCount > 1 ? 'ent' : ''} à votre profil
            </span>
          </li>
        )}
        {delta.newAttributions.map((attr, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
            <Award className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
            <span>
              <strong className="text-slate-900">{attr.buyerName}</strong> a attribué &quot;{attr.title.slice(0, 50)}&quot; à {attr.winnerName} ({formatAmount(attr.amount)})
            </span>
          </li>
        ))}
        {delta.watchlistActivity > 0 && delta.newAttributions.length === 0 && (
          <li className="flex items-start gap-2 text-sm text-slate-600">
            <Bell className="w-4 h-4 text-violet-500 mt-0.5 shrink-0" />
            <span>
              <strong className="text-slate-900">{delta.watchlistActivity}</strong> activité{delta.watchlistActivity > 1 ? 's' : ''} de vos acheteurs suivis
            </span>
          </li>
        )}
      </ul>
    </div>
  );
}
