'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Calendar } from 'lucide-react';
import { fadeUp, stagger } from '@/lib/motion-variants';
import { daysUntil, formatDate } from '@/lib/ao-utils';
import type { RFP } from '@/hooks/useDashboardFilters';

interface DeadlineTimelineProps {
  rfps: RFP[];
}

interface TimelineDot {
  id: string;
  title: string;
  deadline: string;
  days: number;
  scoreLabel: 'GO' | 'MAYBE' | 'PASS';
  isPast: boolean;
}

const DOT_COLORS: Record<string, string> = {
  GO: 'bg-emerald-500',
  MAYBE: 'bg-amber-400',
  PASS: 'bg-slate-400',
};

const DOT_RING_COLORS: Record<string, string> = {
  GO: 'ring-emerald-200',
  MAYBE: 'ring-amber-200',
  PASS: 'ring-slate-200',
};

export default function DeadlineTimeline({ rfps }: DeadlineTimelineProps) {
  const dots = useMemo((): TimelineDot[] => {
    return rfps
      .filter((r) => r.deadline !== null)
      .map((r) => {
        const days = daysUntil(r.deadline) ?? 0;
        return {
          id: r.id,
          title: r.title,
          deadline: r.deadline!,
          days,
          scoreLabel: r.scoreLabel,
          isPast: days < 0,
        };
      })
      .sort((a, b) => a.days - b.days);
  }, [rfps]);

  if (dots.length === 0) return null;

  const showTodayMarker = dots[0].days < 0 && dots[dots.length - 1].days >= 0;

  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      animate="show"
      className="glass rounded-xl p-6 mb-6"
    >
      <div className="flex items-center gap-2 mb-4">
        <Calendar className="w-4 h-4 text-indigo-500" />
        <h3 className="text-sm font-semibold text-slate-700">Timeline des deadlines</h3>
      </div>

      <div className="overflow-x-auto pb-2">
        <motion.div
          variants={stagger}
          initial="hidden"
          animate="show"
          className="flex items-start"
          style={{ minWidth: `${Math.max(dots.length * 100, 400)}px` }}
        >
          {dots.map((dot, i) => {
            const dotColor = DOT_COLORS[dot.scoreLabel];
            const ringColor = DOT_RING_COLORS[dot.scoreLabel];
            const isToday = showTodayMarker && i > 0 && dots[i - 1].days < 0 && dot.days >= 0;

            return (
              <motion.div
                key={dot.id}
                variants={fadeUp}
                className={`flex-1 min-w-[90px] flex flex-col items-center group relative ${
                  dot.isPast ? 'opacity-40' : ''
                }`}
              >
                {/* Today separator */}
                {isToday && (
                  <div className="absolute -left-px top-0 h-full flex flex-col items-center z-10">
                    <span className="text-[10px] font-bold text-indigo-600 whitespace-nowrap">Aujourd&apos;hui</span>
                    <div className="flex-1 w-px border-l border-dashed border-indigo-400" />
                  </div>
                )}

                {/* Dot + line */}
                <div className="flex items-center w-full">
                  {i > 0 && <div className="flex-1 h-px bg-slate-200" />}
                  <div className={`w-3 h-3 rounded-full ${dotColor} ring-2 ${ringColor} flex-shrink-0 group-hover:scale-150 transition-transform`} />
                  {i < dots.length - 1 && <div className="flex-1 h-px bg-slate-200" />}
                </div>

                {/* Label */}
                <div className="mt-2 text-center px-1">
                  <div className="text-[10px] text-slate-500 whitespace-nowrap">
                    {dot.days >= 0 ? `J-${dot.days}` : `J${dot.days}`}
                  </div>
                  <div className="text-[10px] text-slate-500">
                    {formatDate(dot.deadline)}
                  </div>
                  <div className="text-[9px] text-slate-400 max-w-[90px] truncate mx-auto">
                    {dot.title.split(' ').slice(0, 3).join(' ')}
                  </div>
                </div>

                {/* Hover tooltip */}
                <div className="hidden group-hover:block absolute bottom-full mb-2 z-10 bg-slate-900 text-white text-xs rounded-lg px-3 py-2 max-w-[200px] shadow-lg whitespace-normal">
                  <div className="font-medium line-clamp-2 mb-1">{dot.title}</div>
                  <div className="text-slate-300">
                    {dot.days >= 0 ? `J-${dot.days}` : `Expire (J${dot.days})`} &middot; {dot.scoreLabel}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </motion.div>
  );
}
