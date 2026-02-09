'use client';

import { motion } from 'framer-motion';
import { Pencil } from 'lucide-react';
import { fadeUp } from '@/lib/motion-variants';
import MemoireSection from './MemoireSection';
import type { TechnicalPlanSection } from '@/lib/dev';

interface MemoireTechniqueBuilderProps {
  sections: TechnicalPlanSection[];
  reviewed: Record<string, boolean>;
  onToggleReviewed: (sectionId: string) => void;
}

function ProgressRing({ current, total }: { current: number; total: number }) {
  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const progress = total > 0 ? current / total : 0;
  const offset = circumference * (1 - progress);

  return (
    <div className="relative w-16 h-16 flex-shrink-0">
      <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
        <circle cx="32" cy="32" r={radius} fill="none" stroke="#f1f5f9" strokeWidth="4" />
        <circle
          cx="32" cy="32" r={radius}
          fill="none"
          stroke="url(#progressGradient)"
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="progress-ring-circle"
        />
        <defs>
          <linearGradient id="progressGradient" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#8b5cf6" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-sm font-bold text-slate-900">{current}/{total}</span>
      </div>
    </div>
  );
}

export default function MemoireTechniqueBuilder({ sections, reviewed, onToggleReviewed }: MemoireTechniqueBuilderProps) {
  const reviewedCount = Object.values(reviewed).filter(Boolean).length;

  return (
    <motion.section
      variants={fadeUp}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true }}
      id="memoire-builder"
    >
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <Pencil className="w-5 h-5 text-indigo-500" />
          <div>
            <h2 className="text-lg font-bold text-slate-900">Mémoire Technique</h2>
            <p className="text-xs text-slate-400">Brouillon IA pour chaque section — personnalisez et copiez</p>
          </div>
        </div>
        <ProgressRing current={reviewedCount} total={sections.length} />
      </div>

      <div className="space-y-3">
        {sections.map((section, i) => (
          <MemoireSection
            key={section.id}
            section={section}
            index={i}
            isReviewed={!!reviewed[section.id]}
            onToggleReviewed={() => onToggleReviewed(section.id)}
          />
        ))}
      </div>
    </motion.section>
  );
}
