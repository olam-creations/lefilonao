'use client';

import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Clock, ChevronDown } from 'lucide-react';
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
  budget: string | null;
}

const COLLAPSED_COUNT = 3;

const LABEL_COLORS: Record<string, { dot: string; bg: string; text: string }> = {
  GO: { dot: 'bg-emerald-500', bg: 'bg-emerald-50', text: 'text-emerald-700' },
  MAYBE: { dot: 'bg-amber-400', bg: 'bg-amber-50', text: 'text-amber-700' },
  PASS: { dot: 'bg-slate-400', bg: 'bg-slate-50', text: 'text-slate-500' },
};

function urgencyColor(days: number): string {
  if (days <= 5) return 'text-red-600 font-bold';
  if (days <= 15) return 'text-amber-600 font-semibold';
  return 'text-slate-500';
}

export default function DeadlineTimeline({ rfps }: DeadlineTimelineProps) {
  const [expanded, setExpanded] = useState(false);

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
          budget: r.budget,
        };
      })
      .filter((d) => d.days >= 0)
      .sort((a, b) => a.days - b.days);
  }, [rfps]);

  if (dots.length === 0) return null;

  const canExpand = dots.length > COLLAPSED_COUNT;
  const visibleDots = expanded ? dots : dots.slice(0, COLLAPSED_COUNT);
  const hiddenCount = dots.length - COLLAPSED_COUNT;

  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      animate="show"
      className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm relative overflow-hidden group hover:border-slate-300 hover:shadow-xl hover:shadow-indigo-500/5 transition-all"
    >
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-400 to-violet-500 opacity-20 group-hover:opacity-100 transition-opacity" />
      
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-indigo-500" />
          <h3 className="text-sm font-semibold text-slate-700">Prochaines deadlines</h3>
          <span className="text-xs text-slate-400">({dots.length})</span>
        </div>
        <div className="flex items-center gap-3 text-[10px]">
          {(['GO', 'MAYBE', 'PASS'] as const).map((label) => (
            <span key={label} className="flex items-center gap-1">
              <span className={`w-2 h-2 rounded-full ${LABEL_COLORS[label].dot}`} />
              <span className="text-slate-400">{label}</span>
            </span>
          ))}
        </div>
      </div>

      {/* Rows */}
      <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-1">
        <AnimatePresence initial={false}>
          {visibleDots.map((dot) => {
            const colors = LABEL_COLORS[dot.scoreLabel];

            return (
              <motion.div
                key={dot.id}
                variants={fadeUp}
                initial="hidden"
                animate="show"
                exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                transition={{ duration: 0.2 }}
                className="flex items-center gap-3"
              >
                {/* J-X */}
                <div className={`w-10 text-right text-xs tabular-nums ${urgencyColor(dot.days)}`}>
                  J-{dot.days}
                </div>

                {/* Dot */}
                <div className={`w-2 h-2 rounded-full ${colors.dot} flex-shrink-0`} />

                {/* Content row */}
                <div className="flex-1 flex items-center gap-2 py-1.5 min-w-0">
                  <span className="text-sm text-slate-800 truncate flex-1 min-w-0">
                    {dot.title}
                  </span>
                  <span className="text-[11px] text-slate-400 whitespace-nowrap hidden sm:block">
                    <Clock className="w-3 h-3 inline mr-0.5" />
                    {formatDate(dot.deadline)}
                  </span>
                  {dot.budget && (
                    <span className="text-[11px] text-slate-400 whitespace-nowrap hidden md:block">
                      {dot.budget}
                    </span>
                  )}
                  <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${colors.bg} ${colors.text} flex-shrink-0`}>
                    {dot.scoreLabel}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </motion.div>

      {/* Expand/collapse */}
      {canExpand && (
        <button
          onClick={() => setExpanded((v) => !v)}
          className="flex items-center gap-1 mx-auto mt-3 text-xs text-indigo-500 hover:text-indigo-700 transition-colors"
        >
          <span>{expanded ? 'Voir moins' : `+${hiddenCount} autre${hiddenCount > 1 ? 's' : ''}`}</span>
          <motion.div animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
            <ChevronDown className="w-3.5 h-3.5" />
          </motion.div>
        </button>
      )}
    </motion.div>
  );
}
