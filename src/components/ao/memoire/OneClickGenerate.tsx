'use client';

import { motion } from 'framer-motion';
import { Sparkles, Clock } from 'lucide-react';

interface OneClickGenerateProps {
  sectionCount: number;
  onGenerate: () => void;
  onSkip: () => void;
  disabled?: boolean;
}

export default function OneClickGenerate({
  sectionCount, onGenerate, onSkip, disabled,
}: OneClickGenerateProps) {
  const estimatedMinutes = Math.max(1, Math.ceil(sectionCount * 0.4));

  return (
    <motion.div
      className="bg-gradient-to-br from-indigo-50 via-violet-50 to-purple-50 rounded-2xl border border-indigo-100 p-8 text-center"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-500/20">
        <Sparkles className="w-7 h-7 text-white" />
      </div>

      <h3 className="text-lg font-bold text-slate-900 mb-2">
        M&eacute;moire Technique &mdash; {sectionCount} sections
      </h3>
      <p className="text-sm text-slate-500 max-w-md mx-auto mb-6">
        Votre profil sera utilis&eacute; pour personnaliser chaque section
        avec vos r&eacute;f&eacute;rences, moyens et m&eacute;thodologie.
      </p>

      <button
        onClick={onGenerate}
        disabled={disabled}
        className="inline-flex items-center gap-2.5 text-base font-semibold px-8 py-3.5 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 text-white hover:from-indigo-600 hover:to-violet-600 transition-all shadow-lg hover:shadow-xl shadow-indigo-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Sparkles className="w-5 h-5" />
        G&eacute;n&eacute;rer le m&eacute;moire complet
      </button>

      <div className="flex items-center justify-center gap-1.5 mt-4 text-xs text-slate-400">
        <Clock className="w-3.5 h-3.5" />
        <span>Estimation : ~{estimatedMinutes}-{estimatedMinutes + 1} minutes pour {sectionCount} sections</span>
      </div>

      <button
        onClick={onSkip}
        className="text-sm text-slate-400 hover:text-slate-600 mt-4 transition-colors"
      >
        ou g&eacute;n&eacute;rer section par section &rarr;
      </button>
    </motion.div>
  );
}
