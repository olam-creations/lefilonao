'use client';

import { Building2, TrendingUp, Clock, Sparkles, AlertTriangle, XCircle } from 'lucide-react';
import { formatDate, daysUntil } from '@/lib/ao-utils';
import type { Recommendation } from '@/lib/dev';

interface AoHeroHeaderProps {
  title: string;
  issuer: string;
  budget: string | null;
  deadline: string | null;
  region: string | null;
  score: number;
  scoreLabel: 'GO' | 'MAYBE' | 'PASS';
  recommendation: Recommendation | null;
  dceAnalyzed?: boolean;
  typeMarche?: string[] | null;
}

const VERDICT_STYLES = {
  go: { accent: 'from-emerald-400 to-emerald-500', badgeClass: 'badge-go glow-emerald', icon: Sparkles, iconColor: 'text-emerald-600' },
  maybe: { accent: 'from-amber-400 to-amber-500', badgeClass: 'badge-maybe glow-amber', icon: AlertTriangle, iconColor: 'text-amber-600' },
  pass: { accent: 'from-red-400 to-red-500', badgeClass: 'badge-pass', icon: XCircle, iconColor: 'text-red-500' },
  neutral: { accent: 'from-indigo-400 to-indigo-500', badgeClass: 'px-3 py-1 rounded-full text-sm font-medium bg-indigo-50 text-indigo-700 border border-indigo-200', icon: Sparkles, iconColor: 'text-indigo-500' },
} as const;

export default function AoHeroHeader({
  title, issuer, budget, deadline, region, score, scoreLabel, recommendation,
  dceAnalyzed, typeMarche,
}: AoHeroHeaderProps) {
  const daysLeft = daysUntil(deadline);
  const config = recommendation ? VERDICT_STYLES[recommendation.verdict] : VERDICT_STYLES.neutral;
  const Icon = config.icon;

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200 relative overflow-hidden">
      <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${config.accent}`} />

      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-slate-900 leading-snug mb-3">{title}</h1>
          <div className="flex flex-wrap gap-4 text-sm text-slate-500">
            <div className="flex items-center gap-1.5"><Building2 className="w-3.5 h-3.5" /> {issuer}</div>
            {budget && <div className="flex items-center gap-1.5"><TrendingUp className="w-3.5 h-3.5" /> {budget}</div>}
            <div className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> {formatDate(deadline)}</div>
            {region && <span className="text-slate-400">{region}</span>}
            {typeMarche?.map((t) => (
              <span key={t} className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-indigo-50 text-indigo-700">{t}</span>
            ))}
          </div>
        </div>

        <div className="flex flex-col items-end gap-2 flex-shrink-0">
          {dceAnalyzed && (
            <span className={`${config.badgeClass} text-lg px-4 py-1.5`}>
              {score}/100 &middot; {scoreLabel}
            </span>
          )}
          {daysLeft !== null && daysLeft <= 7 && (
            <span className="text-xs text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-md font-medium">
              {daysLeft}j restants
            </span>
          )}
        </div>
      </div>

      {recommendation && (
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <Icon className={`w-4 h-4 ${config.iconColor}`} />
          <span className="font-medium">{recommendation.headline}</span>
        </div>
      )}
    </div>
  );
}
