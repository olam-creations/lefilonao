'use client';

import { useState } from 'react';
import { Lightbulb, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { CoachSuggestion } from '@/lib/dev';

interface WorkspaceCoachBarProps {
  suggestions: CoachSuggestion[];
  onApply?: (suggestion: CoachSuggestion) => void;
}

export default function WorkspaceCoachBar({ suggestions, onApply }: WorkspaceCoachBarProps) {
  const [index, setIndex] = useState(0);
  const [dismissed, setDismissed] = useState(false);

  if (dismissed || suggestions.length === 0) return null;

  const current = suggestions[index % suggestions.length];

  return (
    <motion.div
      className="mt-3 flex items-center gap-3 bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-2.5"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Lightbulb className="w-4 h-4 text-indigo-500 flex-shrink-0" />

      <AnimatePresence mode="wait">
        <motion.span
          key={index}
          className="text-xs text-slate-700 flex-1 min-w-0"
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -10 }}
          transition={{ duration: 0.2 }}
        >
          {current.message}
        </motion.span>
      </AnimatePresence>

      <div className="flex items-center gap-1.5 flex-shrink-0">
        {onApply && (
          <button
            onClick={() => onApply(current)}
            className="text-[10px] font-semibold text-indigo-600 bg-white border border-indigo-200 px-2.5 py-1 rounded-lg hover:bg-indigo-50 transition-colors"
          >
            Appliquer
          </button>
        )}

        {suggestions.length > 1 && (
          <>
            <button
              onClick={() => setIndex((prev) => (prev - 1 + suggestions.length) % suggestions.length)}
              className="p-1 rounded hover:bg-indigo-100 transition-colors"
              aria-label="Suggestion precedente"
            >
              <ChevronLeft className="w-3.5 h-3.5 text-indigo-400" />
            </button>
            <span className="text-[10px] text-indigo-400 font-medium">
              {(index % suggestions.length) + 1}/{suggestions.length}
            </span>
            <button
              onClick={() => setIndex((prev) => (prev + 1) % suggestions.length)}
              className="p-1 rounded hover:bg-indigo-100 transition-colors"
              aria-label="Suggestion suivante"
            >
              <ChevronRight className="w-3.5 h-3.5 text-indigo-400" />
            </button>
          </>
        )}

        <button
          onClick={() => setDismissed(true)}
          className="p-1 rounded hover:bg-indigo-100 transition-colors ml-1"
          aria-label="Fermer les suggestions"
        >
          <X className="w-3.5 h-3.5 text-slate-400" />
        </button>
      </div>
    </motion.div>
  );
}
