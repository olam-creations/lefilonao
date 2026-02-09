'use client';

import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { computeTimeline, type TimelineMilestone } from '@/lib/ao-utils';
import { fadeUp, stagger } from '@/lib/motion-variants';

interface ResponseTimelineProps {
  publishedAt: string;
  deadline: string;
}

function MilestoneDot({ status }: { status: TimelineMilestone['status'] }) {
  if (status === 'done') {
    return (
      <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center shadow-sm shadow-emerald-500/30">
        <Check className="w-4 h-4 text-white" />
      </div>
    );
  }
  if (status === 'current') {
    return (
      <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center shadow-lg shadow-indigo-500/40 animate-pulse-dot">
        <div className="w-3 h-3 rounded-full bg-white" />
      </div>
    );
  }
  return (
    <div className="w-8 h-8 rounded-full bg-white border-2 border-slate-200 flex items-center justify-center">
      <div className="w-2.5 h-2.5 rounded-full bg-slate-300" />
    </div>
  );
}

export default function ResponseTimeline({ publishedAt, deadline }: ResponseTimelineProps) {
  const milestones = computeTimeline(publishedAt, deadline);

  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true }}
      className="bg-white rounded-2xl p-6 border border-slate-200 overflow-x-auto"
    >
      <h3 className="text-sm font-semibold text-slate-900 mb-6">Calendrier de réponse</h3>
      <motion.div
        variants={stagger}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true }}
        className="flex items-start justify-between min-w-[600px] relative"
      >
        {/* Connecting line */}
        <div className="absolute top-4 left-4 right-4 h-0.5 bg-slate-100" />
        <div
          className="absolute top-4 left-4 h-0.5 bg-gradient-to-r from-emerald-400 to-indigo-400 transition-all duration-700"
          style={{
            width: `${Math.max(0, Math.min(100, milestones.filter((m) => m.status === 'done').length / (milestones.length - 1) * 100))}%`,
          }}
        />

        {milestones.map((m) => (
          <motion.div
            key={m.label}
            variants={fadeUp}
            className="flex flex-col items-center gap-2 relative z-10"
          >
            <MilestoneDot status={m.status} />
            <span className={`text-xs font-medium text-center max-w-[80px] ${
              m.status === 'current' ? 'text-indigo-600' :
              m.status === 'done' ? 'text-emerald-600' : 'text-slate-400'
            }`}>
              {m.label}
            </span>
            <span className="text-[10px] text-slate-400">{m.date}</span>
          </motion.div>
        ))}
      </motion.div>
    </motion.div>
  );
}
