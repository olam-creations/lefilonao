'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Sparkles, Check, Wand2, Square, RotateCcw, Clock } from 'lucide-react';
import { expandCollapse } from '@/lib/motion-variants';
import CopyButton from './CopyButton';
import type { TechnicalPlanSection, CompanyProfile, SelectionCriteria } from '@/lib/dev';
import { useStreamingGeneration } from '@/hooks/useStreamingGeneration';
import type { CoachSuggestion } from '@/lib/dev';
import InlineSuggestion from './InlineSuggestion';

interface MemoireSectionProps {
  section: TechnicalPlanSection;
  index: number;
  isReviewed: boolean;
  onToggleReviewed: () => void;
  profile?: CompanyProfile | null;
  dceContext?: string;
  selectionCriteria?: SelectionCriteria[];
  suggestions?: CoachSuggestion[];
  onSectionUpdated?: (sectionId: string, newDraft: string) => void;
}

type QuickOption = { label: string; tone: 'formal' | 'standard'; length: 'short' | 'medium' | 'detailed' };

const QUICK_OPTIONS: QuickOption[] = [
  { label: 'Plus court', tone: 'standard', length: 'short' },
  { label: 'Plus detaille', tone: 'standard', length: 'detailed' },
  { label: 'Ton formel', tone: 'formal', length: 'medium' },
];

export default function MemoireSection({
  section, index, isReviewed, onToggleReviewed,
  profile, dceContext, selectionCriteria, suggestions,
  onSectionUpdated,
}: MemoireSectionProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [currentDraft, setCurrentDraft] = useState(section.aiDraft);
  const [previousDraft, setPreviousDraft] = useState<string | null>(null);
  const [regeneratedAt, setRegeneratedAt] = useState<string | null>(null);

  const streaming = useStreamingGeneration();

  const handleGenerate = useCallback((option: QuickOption) => {
    if (!profile) return;
    setShowOptions(false);
    setPreviousDraft(currentDraft);

    streaming.generate({
      sectionTitle: section.title,
      buyerExpectation: section.buyerExpectation,
      dceContext: dceContext || '',
      companyProfile: {
        companyName: profile.companyName,
        sectors: profile.sectors,
        references: profile.references,
        team: profile.team,
        caN1: profile.caN1,
        caN2: profile.caN2,
        caN3: profile.caN3,
      },
      options: { tone: option.tone, length: option.length },
    });
  }, [profile, currentDraft, dceContext, section.title, section.buyerExpectation, streaming]);

  const handleGenerateDefault = useCallback(() => {
    handleGenerate({ label: 'Standard', tone: 'standard', length: 'medium' });
  }, [handleGenerate]);

  const handleAcceptGeneration = useCallback(() => {
    const newDraft = streaming.streamedText;
    setCurrentDraft(newDraft);
    setRegeneratedAt(new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }));
    streaming.reset();
    if (onSectionUpdated) {
      onSectionUpdated(section.id, newDraft);
    }
  }, [streaming, section.id, onSectionUpdated]);

  const handleRevertDraft = useCallback(() => {
    if (previousDraft !== null) {
      setCurrentDraft(previousDraft);
      setPreviousDraft(null);
      setRegeneratedAt(null);
    }
  }, [previousDraft]);

  const displayText = streaming.state === 'generating' ? streaming.streamedText : currentDraft;
  const sectionSuggestions = suggestions?.filter((s) => s.sectionId === section.id) ?? [];

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
          {sectionSuggestions.length > 0 && (
            <span className="w-2 h-2 rounded-full bg-indigo-500 flex-shrink-0" />
          )}
        </div>
        <div className="flex items-center gap-3 flex-shrink-0 ml-4">
          <span className="text-xs text-slate-400 hidden sm:block">{section.wordCount} mots</span>
          {regeneratedAt && (
            <span className="text-xs text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100 hidden sm:flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> IA
            </span>
          )}
          {isReviewed ? (
            <span className="badge-go text-xs px-2 py-0.5">Relu</span>
          ) : (
            <span className="text-xs text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full border border-slate-100">A lire</span>
          )}
          <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
            <ChevronDown className="w-4 h-4 text-slate-400" />
          </motion.div>
        </div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div {...expandCollapse}>
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

              {/* Inline suggestions */}
              {sectionSuggestions.map((suggestion, i) => (
                <InlineSuggestion
                  key={i}
                  suggestion={suggestion}
                  onApply={() => handleGenerateDefault()}
                />
              ))}

              {/* AI Draft / Streaming zone */}
              <div className="bg-slate-50 rounded-xl p-5 border border-slate-100 relative">
                <div className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                  {displayText}
                  {streaming.state === 'generating' && (
                    <span className="inline-block w-0.5 h-4 bg-indigo-500 animate-pulse ml-0.5 align-text-bottom" />
                  )}
                </div>
                {streaming.state === 'generating' && (
                  <div className="mt-3 flex items-center gap-2">
                    <button
                      onClick={streaming.abort}
                      className="flex items-center gap-1.5 text-xs font-medium text-red-600 bg-red-50 border border-red-200 px-3 py-1.5 rounded-lg hover:bg-red-100 transition-colors"
                    >
                      <Square className="w-3 h-3" /> Arreter
                    </button>
                    <span className="text-xs text-slate-400">Generation en cours...</span>
                  </div>
                )}
                {streaming.state === 'done' && streaming.streamedText && (
                  <div className="mt-3 flex items-center gap-2">
                    <button
                      onClick={handleAcceptGeneration}
                      className="flex items-center gap-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg hover:bg-emerald-100 transition-colors"
                    >
                      <Check className="w-3 h-3" /> Accepter
                    </button>
                    <button
                      onClick={streaming.reset}
                      className="flex items-center gap-1.5 text-xs font-medium text-slate-500 bg-white border border-slate-200 px-3 py-1.5 rounded-lg hover:bg-slate-50 transition-colors"
                    >
                      Annuler
                    </button>
                  </div>
                )}
              </div>

              {regeneratedAt && (
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-xs text-indigo-500">
                    <Clock className="w-3 h-3" /> Regenere par IA a {regeneratedAt}
                  </span>
                  {previousDraft !== null && (
                    <button
                      onClick={handleRevertDraft}
                      className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      <RotateCcw className="w-3 h-3" /> Revenir
                    </button>
                  )}
                </div>
              )}

              <p className="text-xs text-slate-400 italic">
                Adaptez ce texte avec vos references et chiffres propres.
              </p>

              {/* Action row */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <span className="text-xs text-slate-400">{section.wordCount} mots</span>
                <div className="flex items-center gap-2">
                  {profile && streaming.state === 'idle' && (
                    <div className="relative">
                      <button
                        onClick={() => setShowOptions((o) => !o)}
                        className="flex items-center gap-1.5 text-xs font-medium py-1.5 px-3 rounded-lg bg-gradient-to-r from-indigo-50 to-violet-50 text-indigo-700 border border-indigo-200 hover:from-indigo-100 hover:to-violet-100 transition-all"
                      >
                        <Wand2 className="w-3.5 h-3.5" /> Regenerer avec IA
                      </button>
                      <AnimatePresence>
                        {showOptions && (
                          <motion.div
                            initial={{ opacity: 0, y: -4, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -4, scale: 0.95 }}
                            transition={{ duration: 0.15 }}
                            className="absolute bottom-full mb-2 right-0 bg-white rounded-xl shadow-lg border border-slate-200 p-2 min-w-[160px] z-10"
                          >
                            {QUICK_OPTIONS.map((opt) => (
                              <button
                                key={opt.label}
                                onClick={() => handleGenerate(opt)}
                                className="w-full text-left text-xs font-medium text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 px-3 py-2 rounded-lg transition-colors"
                              >
                                {opt.label}
                              </button>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )}
                  <CopyButton text={currentDraft} />
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
