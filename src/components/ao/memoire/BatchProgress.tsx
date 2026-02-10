'use client';

import { motion } from 'framer-motion';
import { Sparkles, Check, Loader2, AlertTriangle, Circle, Square } from 'lucide-react';
import type { BatchSectionState, SectionStatus } from '@/hooks/useBatchGeneration';

interface BatchProgressProps {
  sections: { id: string; title: string }[];
  sectionStates: Map<string, BatchSectionState>;
  currentIndex: number;
  progress: number;
  totalWords: number;
  onCancel: () => void;
}

function StatusIcon({ status }: { status: SectionStatus }) {
  switch (status) {
    case 'done':
      return <Check className="w-3.5 h-3.5 text-emerald-500" />;
    case 'streaming':
      return <Loader2 className="w-3.5 h-3.5 text-indigo-500 animate-spin" />;
    case 'error':
      return <AlertTriangle className="w-3.5 h-3.5 text-red-500" />;
    default:
      return <Circle className="w-3.5 h-3.5 text-slate-300" />;
  }
}

function statusLabel(state: BatchSectionState): string {
  switch (state.status) {
    case 'done':
      return `${state.wordCount} mots`;
    case 'streaming': {
      const words = state.text.split(/\s+/).filter(Boolean).length;
      return words > 0 ? `${words} mots...` : 'streaming...';
    }
    case 'error':
      return state.error ?? 'erreur';
    default:
      return 'en attente';
  }
}

export default function BatchProgress({
  sections, sectionStates, currentIndex, progress, totalWords, onCancel,
}: BatchProgressProps) {
  const doneCount = Array.from(sectionStates.values()).filter((s) => s.status === 'done').length;
  const progressPct = Math.round(progress * 100);

  return (
    <motion.div
      className="bg-white rounded-xl border border-slate-200 shadow-sm p-6"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <Sparkles className="w-5 h-5 text-indigo-500" />
          <span className="text-sm font-bold text-slate-900">
            G&eacute;n&eacute;ration en cours... ({doneCount}/{sections.length} sections)
          </span>
        </div>
        {totalWords > 0 && (
          <span className="text-xs text-slate-400">{totalWords.toLocaleString('fr-FR')} mots</span>
        )}
      </div>

      {/* Progress bar */}
      <div className="mb-5">
        <div className="progress-bar">
          <motion.div
            className="progress-bar-fill"
            initial={{ width: 0 }}
            animate={{ width: `${progressPct}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-xs text-slate-400">{progressPct}%</span>
          <span className="text-xs text-slate-400">
            {sections.length - doneCount} restante{sections.length - doneCount > 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Section list */}
      <div className="space-y-2 mb-5">
        {sections.map((section, i) => {
          const state = sectionStates.get(section.id);
          const sectionStatus: SectionStatus = state?.status ?? 'pending';
          const isActive = i === currentIndex;

          return (
            <div
              key={section.id}
              className={`flex items-center justify-between py-2 px-3 rounded-lg transition-colors ${
                isActive
                  ? 'bg-indigo-50 border border-indigo-100'
                  : sectionStatus === 'done'
                    ? 'bg-emerald-50/50'
                    : sectionStatus === 'error'
                      ? 'bg-red-50/50'
                      : ''
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <StatusIcon status={sectionStatus} />
                <span className={`text-sm truncate ${
                  isActive ? 'font-medium text-slate-900' : 'text-slate-600'
                }`}>
                  {i + 1}. {section.title}
                </span>
              </div>
              <span className={`text-xs flex-shrink-0 ml-3 ${
                sectionStatus === 'done' ? 'text-emerald-600'
                  : sectionStatus === 'error' ? 'text-red-500'
                    : sectionStatus === 'streaming' ? 'text-indigo-500'
                      : 'text-slate-400'
              }`}>
                {state ? statusLabel(state) : 'en attente'}
              </span>
            </div>
          );
        })}
      </div>

      {/* Cancel button */}
      <button
        onClick={onCancel}
        className="flex items-center gap-1.5 text-xs font-medium text-red-600 bg-red-50 border border-red-200 px-4 py-2 rounded-lg hover:bg-red-100 transition-colors"
      >
        <Square className="w-3 h-3" /> Annuler la g&eacute;n&eacute;ration
      </button>
    </motion.div>
  );
}
