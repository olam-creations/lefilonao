'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Sparkles, Check } from 'lucide-react';
import { expandCollapse } from '@/lib/motion-variants';
import CopyButton from './CopyButton';
import type { TechnicalPlanSection } from '@/lib/dev';

interface MemoireSectionProps {
  section: TechnicalPlanSection;
  index: number;
  isReviewed: boolean;
  onToggleReviewed: () => void;
}

export default function MemoireSection({ section, index, isReviewed, onToggleReviewed }: MemoireSectionProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:border-slate-300 transition-colors">
      <button
        onClick={() => setIsOpen((o) => !o)}
        className="w-full flex items-center justify-between p-5 text-left"
      >
        <div className="flex items-center gap-3 min-w-0">
          <span className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500 flex-shrink-0">
            {index + 1}
          </span>
          <span className="text-sm font-semibold text-slate-900 truncate">{section.title}</span>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0 ml-4">
          <span className="text-xs text-slate-400 hidden sm:block">{section.wordCount} mots</span>
          {isReviewed ? (
            <span className="badge-go text-xs px-2 py-0.5">Relu</span>
          ) : (
            <span className="text-xs text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full border border-slate-100">À lire</span>
          )}
          <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
            <ChevronDown className="w-4 h-4 text-slate-400" />
          </motion.div>
        </div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            {...expandCollapse}
          >
            <div className="px-5 pb-5 space-y-4">
              {/* Buyer expectation hint */}
              <div className="bg-gradient-to-r from-indigo-50 to-violet-50 rounded-xl p-4 border border-indigo-100">
                <div className="flex items-start gap-2.5">
                  <Sparkles className="w-4 h-4 text-indigo-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="text-xs font-semibold text-indigo-900 mb-0.5">Ce que l&apos;acheteur attend</div>
                    <p className="text-sm text-indigo-700 leading-relaxed">{section.buyerExpectation}</p>
                  </div>
                </div>
              </div>

              {/* AI Draft */}
              <div className="bg-slate-50 rounded-xl p-5 border border-slate-100">
                <div className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                  {section.aiDraft}
                </div>
              </div>

              <p className="text-xs text-slate-400 italic">
                Adaptez ce texte avec vos références et chiffres propres.
              </p>

              {/* Action row */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <span className="text-xs text-slate-400">{section.wordCount} mots</span>
                <div className="flex items-center gap-2">
                  <CopyButton text={section.aiDraft} />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleReviewed();
                    }}
                    className={`flex items-center gap-1.5 text-xs font-medium py-1.5 px-3 rounded-lg transition-all ${
                      isReviewed
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-white text-slate-500 border border-slate-200 hover:border-indigo-300 hover:text-indigo-600'
                    }`}
                  >
                    {isReviewed && <Check className="w-3.5 h-3.5" />}
                    {isReviewed ? 'Relu' : 'Marquer comme relu'}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
