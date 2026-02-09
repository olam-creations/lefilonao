'use client';

import Link from 'next/link';
import { ArrowRight, Building2, TrendingUp, Clock, MapPin } from 'lucide-react';
import { motion } from 'framer-motion';
import { fadeUp } from '@/lib/motion-variants';
import { formatDate, daysUntil, computeProgress } from '@/lib/ao-utils';
import type { WorkspaceState } from '@/lib/ao-utils';
import type { RFP } from '@/hooks/useDashboardFilters';

interface AoCardProps {
  rfp: RFP;
  workspace: WorkspaceState | null;
  totalDocuments: number;
  totalSections: number;
  onExplore?: () => void;
}

function ScoreBadge({ score, label }: { score: number; label: 'GO' | 'MAYBE' | 'PASS' }) {
  const config = {
    GO: 'badge-go glow-emerald',
    MAYBE: 'badge-maybe glow-amber',
    PASS: 'badge-pass',
  }[label];
  return (
    <span className={config}>
      {score}/100 &middot; {label}
    </span>
  );
}

function DeadlineCountdownBadge({ deadline }: { deadline: string | null }) {
  const days = daysUntil(deadline);
  if (days === null) return null;

  if (days < 0) {
    return (
      <span className="text-xs text-slate-400 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md font-medium">
        Expire
      </span>
    );
  }

  let color = 'text-emerald-600 bg-emerald-50 border-emerald-200';
  if (days <= 5) color = 'text-red-600 bg-red-50 border-red-200';
  else if (days <= 15) color = 'text-amber-600 bg-amber-50 border-amber-200';

  return (
    <span className={`text-xs ${color} border px-2 py-0.5 rounded-md font-bold`}>
      J-{days}
    </span>
  );
}

export default function AoCard({ rfp, workspace, totalDocuments, totalSections, onExplore }: AoCardProps) {
  const daysLeft = daysUntil(rfp.deadline);
  const isUrgent = daysLeft !== null && daysLeft >= 0 && daysLeft <= 7;
  const progress = workspace ? computeProgress(workspace, totalDocuments, totalSections) : 0;

  const leftBorderColor = {
    GO: 'border-l-emerald-500',
    MAYBE: 'border-l-amber-400',
    PASS: 'border-l-slate-300',
  }[rfp.scoreLabel];

  return (
    <motion.div
      variants={fadeUp}
      layout
      className={`bg-white rounded-xl border border-slate-200 border-l-[3px] ${leftBorderColor} transition-all hover:shadow-md hover:-translate-y-0.5 hover:border-slate-300 ${
        isUrgent ? 'ring-1 ring-red-100' : ''
      } overflow-hidden`}
    >
      <div className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            {/* Badges row */}
            <div className="flex items-center gap-2.5 mb-3 flex-wrap">
              <ScoreBadge score={rfp.score} label={rfp.scoreLabel} />
              <span className="font-mono text-xs text-slate-400 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-100">
                {rfp.source}
              </span>
              <DeadlineCountdownBadge deadline={rfp.deadline} />
            </div>

            {/* Title */}
            <h3
              className="text-base font-semibold text-slate-900 mb-3 leading-snug line-clamp-2"
              title={rfp.title}
            >
              {rfp.title}
            </h3>

            {/* Metadata */}
            <div className="flex flex-wrap gap-4 text-sm text-slate-500">
              <div className="flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 flex-shrink-0" /> <span className="truncate max-w-[180px]">{rfp.issuer}</span>
              </div>
              {rfp.budget && (
                <div className="flex items-center gap-1.5 font-semibold text-slate-700">
                  <TrendingUp className="w-3.5 h-3.5 flex-shrink-0" /> {rfp.budget}
                </div>
              )}
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 flex-shrink-0" /> {formatDate(rfp.deadline)}
              </div>
              {rfp.region && (
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 flex-shrink-0" /> {rfp.region}
                </div>
              )}
            </div>
          </div>

          <Link
            href={`/dashboard/ao/${rfp.id}`}
            className="btn-primary text-sm py-2 px-4 flex-shrink-0"
            onClick={onExplore}
          >
            Voir l&apos;AO <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Progress bar */}
      {progress > 0 && (
        <div className="progress-bar">
          <div
            className="progress-bar-fill"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </motion.div>
  );
}
