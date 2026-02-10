'use client';

import Link from 'next/link';
import { Clock, Target, Bell, User, ArrowRight } from 'lucide-react';
import type { BriefingPriority } from '@/lib/briefing';

interface Props {
  priorities: BriefingPriority[];
}

const ICONS: Record<BriefingPriority['type'], typeof Clock> = {
  deadline: Clock,
  'high-score': Target,
  alert: Bell,
  profile: User,
};

const URGENCY_STYLES: Record<BriefingPriority['urgency'], string> = {
  high: 'border-l-red-500 bg-red-50/50',
  medium: 'border-l-amber-500 bg-amber-50/30',
  low: 'border-l-slate-300 bg-white',
};

export default function BriefingPriorities({ priorities }: Props) {
  if (priorities.length === 0) return null;

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">
        Actions prioritaires
      </p>
      <div className="space-y-2">
        {priorities.map((p, i) => {
          const Icon = ICONS[p.type];
          return (
            <Link
              key={i}
              href={p.actionUrl}
              className={`flex items-center gap-3 rounded-lg border-l-[3px] px-3 py-2.5 transition-colors hover:bg-slate-50 ${URGENCY_STYLES[p.urgency]}`}
            >
              <Icon className="w-4 h-4 text-slate-400 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 truncate">{p.title}</p>
                <p className="text-xs text-slate-500">{p.subtitle}</p>
              </div>
              {p.estimatedMinutes && (
                <span className="text-xs text-slate-400 shrink-0">~{p.estimatedMinutes} min</span>
              )}
              <ArrowRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />
            </Link>
          );
        })}
      </div>
    </div>
  );
}
