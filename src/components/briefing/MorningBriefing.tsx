'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Sun, Moon, CloudSun } from 'lucide-react';
import { useBriefing } from '@/hooks/useBriefing';
import BriefingDelta from './BriefingDelta';
import BriefingPriorities from './BriefingPriorities';
import BriefingWeekStatus from './BriefingWeekStatus';
import BriefingTip from './BriefingTip';
import BriefingCalm from './BriefingCalm';

function TimeIcon() {
  const hour = new Date().getHours();
  if (hour < 12) return <Sun className="w-5 h-5 text-amber-400" />;
  if (hour < 18) return <CloudSun className="w-5 h-5 text-orange-400" />;
  return <Moon className="w-5 h-5 text-indigo-400" />;
}

export default function MorningBriefing() {
  const { briefing, loading, error } = useBriefing();

  if (error) return null;

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-white to-slate-50 rounded-2xl border border-slate-200/80 p-5 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 bg-slate-200 rounded-full skeleton" />
          <div className="h-5 w-48 bg-slate-200 rounded-lg skeleton" />
        </div>
        <div className="mt-4 space-y-2">
          <div className="h-3 w-72 bg-slate-100 rounded skeleton" />
          <div className="h-3 w-56 bg-slate-100 rounded skeleton" />
        </div>
      </div>
    );
  }

  if (!briefing) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -12 }}
        transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
        className="bg-gradient-to-br from-white to-slate-50 rounded-2xl border border-slate-200/80 p-5 mb-6 relative"
      >
        {/* Calm mode */}
        {briefing.isCalm ? (
          <BriefingCalm
            greeting={briefing.greeting}
            weekStatus={briefing.weekStatus}
          />
        ) : (
          <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center gap-2">
              <TimeIcon />
              <h2 className="text-base font-semibold text-slate-900">
                {briefing.greeting}
              </h2>
            </div>

            {/* Delta: what changed */}
            <BriefingDelta
              delta={briefing.delta}
              lastVisit={briefing.lastVisit}
            />

            {/* Priority actions */}
            <BriefingPriorities priorities={briefing.priorities} />

            {/* Week status bar */}
            <div className="pt-2 border-t border-slate-100">
              <BriefingWeekStatus weekStatus={briefing.weekStatus} />
            </div>

            {/* Daily tip */}
            <BriefingTip tip={briefing.tip} />
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
