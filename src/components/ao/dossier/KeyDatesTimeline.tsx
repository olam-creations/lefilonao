'use client';

import { computeTimeline, type TimelineMilestone } from '@/lib/ao-utils';

interface KeyDatesTimelineProps {
  publishedAt: string;
  deadline: string;
}

function MilestoneNode({ milestone }: { milestone: TimelineMilestone }) {
  const dotClass = {
    done: 'bg-emerald-500',
    current: 'bg-indigo-500 ring-4 ring-indigo-100',
    upcoming: 'bg-slate-200',
  }[milestone.status];

  const labelClass = {
    done: 'text-slate-500',
    current: 'text-indigo-700 font-semibold',
    upcoming: 'text-slate-400',
  }[milestone.status];

  const dateClass = {
    done: 'text-slate-400',
    current: 'text-indigo-600',
    upcoming: 'text-slate-300',
  }[milestone.status];

  return (
    <div className="flex flex-col items-center gap-1 min-w-0">
      <div className={`w-3 h-3 rounded-full flex-shrink-0 ${dotClass}`} />
      <span className={`text-[10px] leading-tight text-center truncate max-w-[70px] ${labelClass}`}>
        {milestone.label}
      </span>
      <span className={`text-[9px] ${dateClass}`}>{milestone.date}</span>
    </div>
  );
}

export default function KeyDatesTimeline({ publishedAt, deadline }: KeyDatesTimelineProps) {
  const milestones = computeTimeline(publishedAt, deadline);

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4">
      <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">
        Jalons
      </h3>
      <div className="flex items-start justify-between gap-1 relative">
        {/* Connecting line */}
        <div className="absolute top-1.5 left-4 right-4 h-px bg-slate-200" />
        {milestones.map((m) => (
          <MilestoneNode key={m.label} milestone={m} />
        ))}
      </div>
    </div>
  );
}
