'use client';

import { FileText, CalendarClock, AlertTriangle } from 'lucide-react';
import type { BriefingWeekStatus as WeekStatusType } from '@/lib/briefing';

interface Props {
  weekStatus: WeekStatusType;
}

export default function BriefingWeekStatus({ weekStatus }: Props) {
  return (
    <div className="flex items-center gap-4 text-xs text-slate-500">
      <span className="flex items-center gap-1">
        <FileText className="w-3.5 h-3.5" />
        {weekStatus.activeResponses} en cours
      </span>
      <span className="flex items-center gap-1">
        <CalendarClock className="w-3.5 h-3.5" />
        {weekStatus.deadlinesThisWeek} deadline{weekStatus.deadlinesThisWeek !== 1 ? 's' : ''} cette semaine
      </span>
      {weekStatus.missedDeadlines > 0 && (
        <span className="flex items-center gap-1 text-red-500">
          <AlertTriangle className="w-3.5 h-3.5" />
          {weekStatus.missedDeadlines} expirée{weekStatus.missedDeadlines > 1 ? 's' : ''}
        </span>
      )}
    </div>
  );
}
