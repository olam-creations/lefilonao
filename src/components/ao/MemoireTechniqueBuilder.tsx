'use client';

import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Pencil, Sparkles, Loader2 } from 'lucide-react';
import { fadeUp } from '@/lib/motion-variants';
import MemoireSection from './MemoireSection';
import type { TechnicalPlanSection, CompanyProfile, SelectionCriteria } from '@/lib/dev';
import type { CoachSuggestion, CoachResponse } from '@/lib/dev';
import AiCoachPanel from './AiCoachPanel';
import { saveGeneratedSections, getGeneratedSections } from '@/lib/ao-storage';

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
  const [generatingAll, setGeneratingAll] = useState(false);
  const [coachData, setCoachData] = useState<CoachResponse | null>(null);
  const [coachLoading, setCoachLoading] = useState(false);

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

  const handleGenerateAll = useCallback(async () => {
    if (!profile || generatingAll) return;
    setGeneratingAll(true);

    for (const section of sections) {
      try {
        const response = await fetch('/api/ai/generate-section', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
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
            options: { tone: 'standard', length: 'medium' },
          }),
        });

        if (!response.ok) continue;

        const reader = response.body?.getReader();
        if (!reader) continue;

        const decoder = new TextDecoder();
        let fullText = '';
        let buffer = '';

        while (true) {
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
              } catch { /* skip */ }
            }
          }
        }

        if (fullText && aoId) {
          handleSectionUpdated(section.id, fullText);
        }
      } catch { /* continue with next section */ }
    }

    setGeneratingAll(false);
  }, [profile, generatingAll, sections, dceContext, aoId, handleSectionUpdated]);

  const handleRefreshCoach = useCallback(async () => {
    if (!profile || coachLoading) return;
    setCoachLoading(true);

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

      if (response.ok) {
        const json = await response.json();
        if (json.success) {
          setCoachData(json.data);
        }
      }
    } catch { /* silent */ }
    setCoachLoading(false);
  }, [profile, coachLoading, sections, dceContext, selectionCriteria]);

  const getSuggestionsForSection = (sectionId: string): CoachSuggestion[] => {
    if (!coachData) return [];
    return coachData.suggestions.filter((s) => s.sectionId === sectionId);
  };

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
          onRefresh={handleRefreshCoach}
        />
      )}

      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <Pencil className="w-5 h-5 text-indigo-500" />
          <div>
            <h2 className="text-lg font-bold text-slate-900">Memoire Technique</h2>
            <p className="text-xs text-slate-400">Brouillon IA pour chaque section — personnalisez et copiez</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {profile && (
            <button
              onClick={handleGenerateAll}
              disabled={generatingAll}
              className="flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 text-white hover:from-indigo-600 hover:to-violet-600 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {generatingAll ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Sparkles className="w-3.5 h-3.5" />
              )}
              {generatingAll ? 'Generation...' : 'Generer tout'}
            </button>
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
            suggestions={getSuggestionsForSection(section.id)}
            onSectionUpdated={handleSectionUpdated}
          />
        ))}
      </div>
    </motion.section>
  );
}
