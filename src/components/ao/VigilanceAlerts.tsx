'use client';

import { motion } from 'framer-motion';
import { AlertTriangle, AlertOctagon, Lightbulb } from 'lucide-react';
import { fadeUp, stagger } from '@/lib/motion-variants';
import type { VigilancePoint } from '@/lib/dev';

const CONFIG = {
  risk: {
    border: 'border-l-red-500',
    bg: 'bg-red-50/50',
    icon: <AlertOctagon className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />,
    label: 'text-red-800',
  },
  warning: {
    border: 'border-l-amber-400',
    bg: 'bg-amber-50/50',
    icon: <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />,
    label: 'text-amber-800',
  },
  opportunity: {
    border: 'border-l-emerald-500',
    bg: 'bg-emerald-50/50',
    icon: <Lightbulb className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />,
    label: 'text-emerald-800',
  },
};

interface VigilanceAlertsProps {
  points: VigilancePoint[];
}

export default function VigilanceAlerts({ points }: VigilanceAlertsProps) {
  if (points.length === 0) return null;

  return (
    <motion.div
      variants={stagger}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true }}
      className="space-y-3"
    >
      <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
        <AlertTriangle className="w-4 h-4 text-amber-500" />
        Points de vigilance
      </h3>
      {points.map((point) => {
        const c = CONFIG[point.type];
        return (
          <motion.div
            key={point.title}
            variants={fadeUp}
            className={`rounded-xl p-4 border border-slate-200 border-l-[3px] ${c.border} ${c.bg}`}
          >
            <div className="flex items-start gap-3">
              {c.icon}
              <div>
                <div className={`text-sm font-semibold ${c.label} mb-0.5`}>{point.title}</div>
                <p className="text-sm text-slate-600 leading-relaxed">{point.description}</p>
              </div>
            </div>
          </motion.div>
        );
      })}
    </motion.div>
  );
}
