'use client';

import Link from 'next/link';
import { CheckCircle2 } from 'lucide-react';
import type { BriefingWeekStatus } from '@/lib/briefing';

interface Props {
  greeting: string;
  weekStatus: BriefingWeekStatus;
}

export default function BriefingCalm({ greeting, weekStatus }: Props) {
  return (
    <div className="text-center py-4">
      <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-3" />
      <p className="text-base font-semibold text-slate-900">{greeting} — Tout est sous contrôle</p>
      <div className="mt-2 space-y-1 text-sm text-slate-500">
        {weekStatus.deadlinesThisWeek === 0 && (
          <p>Aucune deadline cette semaine</p>
        )}
        {weekStatus.activeResponses > 0 && (
          <p>Vos {weekStatus.activeResponses} réponse{weekStatus.activeResponses > 1 ? 's' : ''} en cours avance{weekStatus.activeResponses > 1 ? 'nt' : ''} bien</p>
        )}
        {weekStatus.activeResponses === 0 && (
          <p>Aucune réponse en cours</p>
        )}
      </div>
      <Link
        href="/dashboard/market"
        className="inline-flex items-center gap-1 mt-3 text-xs text-indigo-500 hover:text-indigo-700 font-medium"
      >
        Explorez l&apos;intelligence marché &rarr;
      </Link>
    </div>
  );
}
