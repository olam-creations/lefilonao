'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Pencil, Sparkles, Loader2, AlertTriangle, Check } from 'lucide-react';
import { fadeUp } from '@/lib/motion-variants';
import MemoireSection from './MemoireSection';
import type { TechnicalPlanSection, CompanyProfile, SelectionCriteria } from '@/lib/dev';
import type { CoachSuggestion, CoachResponse } from '@/lib/dev';
import AiCoachPanel from './AiCoachPanel';
import { saveGeneratedSections, getGeneratedSections } from '@/lib/ao-storage';
import { useBatchGeneration } from '@/hooks/useBatchGeneration';
import OneClickGenerate from './memoire/OneClickGenerate';
import BatchProgress from './memoire/BatchProgress';

interface MemoireTechniqueBuilderProps {
  sections: TechnicalPlanSection[];
  reviewed: Record<string, boolean>;
  onToggleReviewed: (sectionId: string) => void;
  profile?: CompanyProfile | null;
  dceContext?: string;
  selectionCriteria?: SelectionCriteria[];
  aoId?: string;
  prefilledCoachData?: CoachResponse | null;
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

export default function MemoireTechniqueBuilder({
  sections, reviewed, onToggleReviewed,
  profile, dceContext, selectionCriteria, aoId, prefilledCoachData,
}: MemoireTechniqueBuilderProps) {
  const reviewedCount = Object.values(reviewed).filter(Boolean).length;
  const batch = useBatchGeneration();
  const [coachData, setCoachData] = useState<CoachResponse | null>(prefilledCoachData ?? null);
  const [coachLoading, setCoachLoading] = useState(false);
  const [coachError, setCoachError] = useState<string | null>(null);
  const [showPerSection, setShowPerSection] = useState(false);

  // Draft overrides from batch generation
  const [localDrafts, setLocalDrafts] = useState<Record<string, string>>({});

  useEffect(() => {
    return () => { batch.abort(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // When batch completes, save results to localStorage
  useEffect(() => {
    if (batch.status === 'done' && batch.result && batch.result.successCount > 0) {
      const drafts: Record<string, string> = {};
      for (const section of sections) {
        const text = batch.getSectionText(section.id);
        if (text) {
          drafts[section.id] = text;
          if (aoId) {
            const existing = getGeneratedSections(aoId) ?? {};
            saveGeneratedSections(aoId, {
              ...existing,
              [section.id]: { ...section, aiDraft: text },
            });
          }
        }
      }
      setLocalDrafts(drafts);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [batch.status, batch.result?.successCount]);

  const handleSectionUpdated = useCallback((sectionId: string, newDraft: string) => {
    if (!aoId) return;
    const existing = getGeneratedSections(aoId) ?? {};
    const section = sections.find((s) => s.id === sectionId);
    if (!section) return;
    saveGeneratedSections(aoId, {
      ...existing,
      [sectionId]: { ...section, aiDraft: newDraft },
    });
  }, [aoId, sections]);

  // Merge batch-generated drafts with original sections
  const effectiveSections = useMemo(() =>
    sections.map((s) => ({
      ...s,
      aiDraft: localDrafts[s.id] || s.aiDraft,
    })),
  [sections, localDrafts]);

  const handleGenerateAll = useCallback(() => {
    if (!profile || batch.status === 'generating') return;

    batch.generate({
      noticeId: aoId,
      sections: sections.map((s) => ({
        id: s.id,
        title: s.title,
        buyerExpectation: s.buyerExpectation,
      })),
      companyProfile: {
        companyName: profile.companyName,
        sectors: profile.sectors,
        references: profile.references,
        team: profile.team,
        caN1: profile.caN1,
        caN2: profile.caN2,
        caN3: profile.caN3,
      },
      dceContext: dceContext || '',
      options: { tone: 'standard', length: 'medium' },
    });
  }, [profile, batch, sections, dceContext, aoId]);

  const handleRefreshCoach = useCallback(async () => {
    if (!profile || coachLoading) return;
    setCoachLoading(true);
    setCoachError(null);

    try {
      const response = await fetch('/api/ai/coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sections: effectiveSections,
          profile: {
            companyName: profile.companyName,
            sectors: profile.sectors,
            references: profile.references,
            team: profile.team,
            caN1: profile.caN1,
            caN2: profile.caN2,
            caN3: profile.caN3,
          },
          dceContext: dceContext || '',
          selectionCriteria: selectionCriteria || [],
        }),
      });

      const json = await response.json();
      if (response.ok && json.success) {
        setCoachData(json.data);
      } else {
        setCoachError(json.error || 'Erreur lors de l\'analyse');
      }
    } catch (err) {
      setCoachError(err instanceof Error ? err.message : 'Erreur de connexion');
    }
    setCoachLoading(false);
  }, [profile, coachLoading, dceContext, selectionCriteria, effectiveSections]);

  const suggestionsBySection = useMemo(() => {
    if (!coachData) return {};
    const map: Record<string, CoachSuggestion[]> = {};
    for (const s of coachData.suggestions) {
      if (s.sectionId) {
        (map[s.sectionId] ??= []).push(s);
      }
    }
    return map;
  }, [coachData]);

  // Detect empty state (no section has a real draft)
  const allEmpty = effectiveSections.every(
    (s) => !s.aiDraft || s.aiDraft.includes('['),
  );

  // Compute total words from batch results
  const batchTotalWords = useMemo(() => {
    let total = 0;
    batch.sections.forEach((s) => { total += s.wordCount; });
    return total;
  }, [batch.sections]);

  return (
    <motion.section
      variants={fadeUp}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true }}
      id="memoire-builder"
    >
      {/* Coach Panel */}
      {profile && (
        <AiCoachPanel
          coachData={coachData}
          loading={coachLoading}
          error={coachError}
          onRefresh={handleRefreshCoach}
        />
      )}

      {/* One-click CTA when all sections are empty */}
      {allEmpty && profile && batch.status === 'idle' && !showPerSection && (
        <div className="mb-6">
          <OneClickGenerate
            sectionCount={sections.length}
            onGenerate={handleGenerateAll}
            onSkip={() => setShowPerSection(true)}
            disabled={batch.status !== 'idle'}
          />
        </div>
      )}

      {/* Batch progress during generation */}
      {batch.status === 'generating' && (
        <div className="mb-6">
          <BatchProgress
            sections={sections.map((s) => ({ id: s.id, title: s.title }))}
            sectionStates={batch.sections}
            currentIndex={batch.currentIndex}
            progress={batch.progress}
            totalWords={batchTotalWords}
            onCancel={batch.abort}
          />
        </div>
      )}

      {/* Batch completion summary */}
      {batch.status === 'done' && batch.result && batch.result.successCount > 0 && (
        <motion.div
          className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center gap-2.5">
            <Check className="w-5 h-5 text-emerald-500" />
            <span className="text-sm font-medium text-emerald-800">
              M&eacute;moire g&eacute;n&eacute;r&eacute; ! {batch.result.successCount}/{batch.result.totalSections} sections,
              ~{batch.result.totalWords.toLocaleString('fr-FR')} mots
            </span>
          </div>
          <button
            onClick={batch.reset}
            className="text-xs text-emerald-600 hover:text-emerald-700 font-medium transition-colors"
          >
            Fermer
          </button>
        </motion.div>
      )}

      {/* Header + sections list (shown unless in one-click empty state) */}
      {(showPerSection || !allEmpty || batch.status !== 'idle') && (
        <>
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <Pencil className="w-5 h-5 text-indigo-500" />
              <div>
                <h2 className="text-lg font-bold text-slate-900">Memoire Technique</h2>
                <p className="text-xs text-slate-400">Brouillon IA pour chaque section &mdash; personnalisez et copiez</p>
                <p className="text-[10px] text-slate-300 mt-0.5">Contenu g&eacute;n&eacute;r&eacute; par IA &mdash; &agrave; v&eacute;rifier avant utilisation</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {profile && batch.status !== 'generating' && (
                <>
                  <button
                    onClick={handleGenerateAll}
                    className="flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 text-white hover:from-indigo-600 hover:to-violet-600 transition-all shadow-md hover:shadow-lg"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    {!allEmpty ? 'Regenerer tout' : 'Generer tout'}
                  </button>
                  {batch.error && (
                    <span className="flex items-center gap-1 text-xs text-amber-600">
                      <AlertTriangle className="w-3 h-3" />
                      Erreur
                    </span>
                  )}
                </>
              )}
              {batch.status === 'generating' && (
                <span className="flex items-center gap-2 text-xs font-medium text-indigo-600">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  {batch.currentIndex + 1}/{sections.length}
                </span>
              )}
              <ProgressRing current={reviewedCount} total={sections.length} />
            </div>
          </div>

          <div className="space-y-3">
            {effectiveSections.map((section, i) => (
              <MemoireSection
                key={`${section.id}-${localDrafts[section.id] ? 'batch' : 'prop'}`}
                section={section}
                index={i}
                isReviewed={!!reviewed[section.id]}
                onToggleReviewed={() => onToggleReviewed(section.id)}
                profile={profile}
                dceContext={dceContext}
                selectionCriteria={selectionCriteria}
                suggestions={suggestionsBySection[section.id]}
                onSectionUpdated={handleSectionUpdated}
              />
            ))}
          </div>
        </>
      )}
    </motion.section>
  );
}
