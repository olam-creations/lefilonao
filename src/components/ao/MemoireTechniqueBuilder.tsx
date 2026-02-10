'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Pencil, Sparkles, Loader2, AlertTriangle } from 'lucide-react';
import { fadeUp } from '@/lib/motion-variants';
import MemoireSection from './MemoireSection';
import type { TechnicalPlanSection, CompanyProfile, SelectionCriteria } from '@/lib/dev';
import type { CoachSuggestion, CoachResponse } from '@/lib/dev';
import AiCoachPanel from './AiCoachPanel';
import { saveGeneratedSections, getGeneratedSections } from '@/lib/ao-storage';
import { useAiPlan } from '@/hooks/useAiPlan';
import { createBatchGeneratePlan } from '@/lib/ai-plan-templates';
import type { StepType } from '@/lib/ai-plan';

interface MemoireTechniqueBuilderProps {
  sections: TechnicalPlanSection[];
  reviewed: Record<string, boolean>;
  onToggleReviewed: (sectionId: string) => void;
  profile?: CompanyProfile | null;
  dceContext?: string;
  selectionCriteria?: SelectionCriteria[];
  aoId?: string;
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
  profile, dceContext, selectionCriteria, aoId,
}: MemoireTechniqueBuilderProps) {
  const reviewedCount = Object.values(reviewed).filter(Boolean).length;
  const aiPlan = useAiPlan();
  const [coachData, setCoachData] = useState<CoachResponse | null>(null);
  const [coachLoading, setCoachLoading] = useState(false);
  const [coachError, setCoachError] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      aiPlan.abort();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSectionUpdated = useCallback((sectionId: string, newDraft: string) => {
    if (!aoId) return;
    const existing = getGeneratedSections(aoId) ?? {};
    const section = sections.find((s) => s.id === sectionId);
    if (!section) return;
    const updated = {
      ...existing,
      [sectionId]: { ...section, aiDraft: newDraft },
    };
    saveGeneratedSections(aoId, updated);
  }, [aoId, sections]);

  const handleCancelGenerateAll = useCallback(() => {
    aiPlan.abort();
  }, [aiPlan]);

  const generateSectionHandler = useCallback(async (params: Record<string, unknown>, signal?: AbortSignal): Promise<string> => {
    const response = await fetch('/api/ai/generate-section', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
      signal,
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const reader = response.body?.getReader();
    if (!reader) throw new Error('No response body');

    const decoder = new TextDecoder();
    let fullText = '';
    let buffer = '';

    while (true) {
      if (signal?.aborted) break;
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6).trim();
          if (data === '[DONE]') break;
          try {
            const parsed = JSON.parse(data);
            if (parsed.text) fullText += parsed.text;
          } catch { /* skip malformed chunk */ }
        }
      }
    }

    const sectionId = params.sectionId as string | undefined;
    if (fullText && aoId && sectionId) {
      handleSectionUpdated(sectionId, fullText);
    }

    return fullText;
  }, [aoId, handleSectionUpdated]);

  const planHandlers = useMemo(() => ({
    generate_section: generateSectionHandler,
    analyze_dce: async () => { throw new Error('Not supported in batch mode'); },
    coach_review: async () => { throw new Error('Not supported in batch mode'); },
  } satisfies Record<StepType, (params: Record<string, unknown>, signal?: AbortSignal) => Promise<unknown>>), [generateSectionHandler]);

  const handleGenerateAll = useCallback(async () => {
    if (!profile || aiPlan.isRunning) return;
    const plan = createBatchGeneratePlan({
      sections,
      profile,
      dceContext: dceContext || '',
    });
    await aiPlan.execute(plan, planHandlers);
  }, [profile, aiPlan, sections, dceContext, planHandlers]);

  const handleRefreshCoach = useCallback(async () => {
    if (!profile || coachLoading) return;
    setCoachLoading(true);
    setCoachError(null);

    try {
      const response = await fetch('/api/ai/coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sections,
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
  }, [profile, coachLoading, sections, dceContext, selectionCriteria]);

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
          {profile && (
            <>
              <button
                onClick={handleGenerateAll}
                disabled={aiPlan.isRunning}
                className="flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 text-white hover:from-indigo-600 hover:to-violet-600 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {aiPlan.isRunning ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5" />
                )}
                {aiPlan.isRunning ? `${aiPlan.currentStepIndex + 1}/${sections.length}` : 'Generer tout'}
              </button>
              {aiPlan.isRunning && (
                <button
                  onClick={handleCancelGenerateAll}
                  className="text-xs font-medium px-3 py-2 rounded-xl bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 transition-all"
                >
                  Arreter
                </button>
              )}
              {aiPlan.error && !aiPlan.isRunning && (
                <span className="flex items-center gap-1 text-xs text-amber-600">
                  <AlertTriangle className="w-3 h-3" />
                  {aiPlan.plan?.steps.filter((s) => s.status === 'failed').length} section(s) echouee(s)
                </span>
              )}
            </>
          )}
          <ProgressRing current={reviewedCount} total={sections.length} />
        </div>
      </div>

      <div className="space-y-3">
        {sections.map((section, i) => (
          <MemoireSection
            key={section.id}
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
    </motion.section>
  );
}
