'use client';

import { motion } from 'framer-motion';
import { Lightbulb, AlertTriangle, CircleAlert, Wand2 } from 'lucide-react';
import type { CoachSuggestion } from '@/lib/dev';

interface InlineSuggestionProps {
  suggestion: CoachSuggestion;
  onApply: () => void;
}

const STYLES = {
  tip: {
    icon: Lightbulb,
    bg: 'bg-indigo-50',
    border: 'border-indigo-200',
    iconColor: 'text-indigo-500',
    accent: 'border-l-indigo-400',
  },
  warning: {
    icon: AlertTriangle,
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    iconColor: 'text-amber-500',
    accent: 'border-l-amber-400',
  },
  missing: {
    icon: CircleAlert,
    bg: 'bg-red-50',
    border: 'border-red-200',
    iconColor: 'text-red-500',
    accent: 'border-l-red-400',
  },
} as const;

export default function InlineSuggestion({ suggestion, onApply }: InlineSuggestionProps) {
  const config = STYLES[suggestion.type];
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`flex items-start gap-3 p-3 rounded-xl ${config.bg} border ${config.border} border-l-4 ${config.accent}`}
    >
      <Icon className={`w-4 h-4 ${config.iconColor} flex-shrink-0 mt-0.5`} />
      <div className="flex-1 min-w-0">
        <p className="text-sm text-slate-700 leading-relaxed">{suggestion.message}</p>
      </div>
      <button
        onClick={onApply}
        className="flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-800 bg-white border border-indigo-200 px-2.5 py-1 rounded-lg hover:bg-indigo-50 transition-all flex-shrink-0"
      >
        <Wand2 className="w-3 h-3" /> Appliquer
      </button>
    </motion.div>
  );
}
