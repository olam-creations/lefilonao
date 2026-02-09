'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { scaleIn } from '@/lib/motion-variants';
import type { ActiveFilter } from '@/hooks/useDashboardFilters';

interface ActiveFilterChipsProps {
  filters: ActiveFilter[];
  onClear: (key: string) => void;
  onClearAll: () => void;
}

export default function ActiveFilterChips({ filters, onClear, onClearAll }: ActiveFilterChipsProps) {
  if (filters.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 mb-4">
      <AnimatePresence mode="popLayout">
        {filters.map((f) => (
          <motion.button
            key={f.key}
            variants={scaleIn}
            initial="hidden"
            animate="show"
            exit="exit"
            layout
            onClick={() => onClear(f.key)}
            className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 transition-colors"
          >
            {f.label}
            <X className="w-3 h-3" />
          </motion.button>
        ))}
        {filters.length > 1 && (
          <motion.button
            key="clear-all"
            variants={scaleIn}
            initial="hidden"
            animate="show"
            exit="exit"
            layout
            onClick={onClearAll}
            className="text-xs text-slate-500 hover:text-slate-700 underline underline-offset-2"
          >
            Tout effacer
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
