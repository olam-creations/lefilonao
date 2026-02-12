'use client';

import { Building2, TrendingUp, Clock, MapPin } from 'lucide-react';
import { formatDate, daysUntil } from '@/lib/ao-utils';
import type { Recommendation } from '@/lib/dev';
import VerdictBadge from './VerdictBadge';
import KeyDatesTimeline from './KeyDatesTimeline';

interface AoDossierHeroProps {
  title: string;
  issuer: string;
  budget: string | null;
  deadline: string | null;
  region: string | null;
  score: number;
  scoreLabel: 'GO' | 'MAYBE' | 'PASS';
  recommendation: Recommendation | null;
  publishedAt: string;
  typeMarche?: string[] | null;
  hasAnalysis: boolean;
}

const ACCENT_COLORS = {
  go: 'from-emerald-400 to-emerald-500',
  maybe: 'from-amber-400 to-amber-500',
  pass: 'from-red-400 to-red-500',
  neutral: 'from-indigo-400 to-indigo-500',
} as const;

export default function AoDossierHero({
  title, issuer, budget, deadline, region, score, scoreLabel,
  recommendation, publishedAt, typeMarche, hasAnalysis,
}: AoDossierHeroProps) {
  const daysLeft = daysUntil(deadline);
  const verdict = recommendation?.verdict ?? 'neutral';
  const accent = ACCENT_COLORS[verdict];

  return (
    <section id="section-hero" className="space-y-4">
      <div className="bg-white rounded-2xl p-6 border border-slate-200 relative overflow-hidden">
        <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${accent}`} />

        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-slate-900 leading-snug mb-3">{title}</h1>
            <div className="flex flex-wrap gap-4 text-sm text-slate-500">
              <div className="flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5" /> {issuer}
              </div>
              {budget && (
                <div className="flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5" /> {budget}
                </div>
              )}
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" /> {formatDate(deadline)}
              </div>
              {region && (
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5" /> {region}
                </div>
              )}
              {typeMarche?.map((t) => (
                <span key={t} className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-indigo-50 text-indigo-700">
                  {t}
                </span>
              ))}
            </div>
          </div>

          <div className="flex flex-col items-end gap-2 flex-shrink-0">
            {hasAnalysis && (
              <VerdictBadge
                score={score}
                scoreLabel={scoreLabel}
                recommendation={recommendation}
                size="lg"
              />
            )}
            {daysLeft !== null && daysLeft <= 7 && (
              <span className="text-xs text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-md font-medium">
                {daysLeft}j restants
              </span>
            )}
          </div>
        </div>

        {recommendation && (
          <p className="text-sm text-slate-600 font-medium">{recommendation.headline}</p>
        )}
      </div>

      {deadline && publishedAt && (
        <KeyDatesTimeline publishedAt={publishedAt} deadline={deadline} />
      )}
    </section>
  );
}
