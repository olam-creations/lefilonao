'use client';

import Link from 'next/link';
import { ArrowRight, Building2, TrendingUp, Clock, MapPin } from 'lucide-react';
import { motion } from 'framer-motion';
import { fadeUp } from '@/lib/motion-variants';
import { formatDate, daysUntil, computeProgress } from '@/lib/ao-utils';
import type { WorkspaceState } from '@/lib/ao-utils';
import type { RFP } from '@/hooks/useDashboardFilters';

import AddToPipelineButton from './pipeline/AddToPipelineButton';
import PremiumTeaser from '@/components/shared/PremiumTeaser';

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
      className={`group relative bg-white rounded-2xl border border-slate-200 border-l-[4px] ${leftBorderColor} transition-all hover:shadow-xl hover:shadow-indigo-500/5 hover:border-slate-300 ${
        isUrgent ? 'ring-1 ring-red-100' : ''
      } overflow-hidden`}
    >
      <Link 
        href={`/dashboard/ao/${rfp.id}`} 
        className="block p-6 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
        onClick={onExplore}
        aria-label={`Voir l'appel d'offres : ${rfp.title}`}
      >
        <div className="flex items-start justify-between gap-6">
          <div className="flex-1 min-w-0">
            {/* Badges row */}
            <div className="flex items-center gap-2.5 mb-4 flex-wrap">
              <PremiumTeaser message="Score IA Pro" blur="blur-[3px]">
                <ScoreBadge score={rfp.score} label={rfp.scoreLabel} />
              </PremiumTeaser>
              <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-100">
                {rfp.source}
              </span>
              <DeadlineCountdownBadge deadline={rfp.deadline} />
            </div>

            {/* Title */}
            <h3
              className="text-lg font-bold text-slate-900 mb-4 leading-tight group-hover:text-indigo-600 transition-colors line-clamp-2"
              title={rfp.title}
            >
              {rfp.title}
            </h3>

            {/* Metadata */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-6 text-sm text-slate-500">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center flex-shrink-0 group-hover:bg-indigo-50 transition-colors">
                  <Building2 className="w-4 h-4 text-slate-400 group-hover:text-indigo-500" />
                </div>
                <span className="truncate font-medium">{rfp.issuer}</span>
              </div>
              
              {rfp.budget && (
                <PremiumTeaser message="Budget estimé" blur="blur-[4px]">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center flex-shrink-0">
                      <TrendingUp className="w-4 h-4 text-emerald-500" />
                    </div>
                    <span className="font-bold text-emerald-700">{rfp.budget}</span>
                  </div>
                </PremiumTeaser>
              )}

              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center flex-shrink-0">
                  <Clock className="w-4 h-4 text-slate-400" />
                </div>
                <span className="font-medium">{formatDate(rfp.deadline)}</span>
              </div>

              {rfp.region && (
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-4 h-4 text-slate-400" />
                  </div>
                  <span className="font-medium">{rfp.region}</span>
                </div>
              )}
            </div>
          </div>

          <div className="hidden md:flex flex-col items-end justify-center h-full self-center">
            <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300">
              <ArrowRight className="w-5 h-5" />
            </div>
          </div>
        </div>
      </Link>

      {/* CRM Actions */}
      <div className="px-6 pb-6 pt-2 flex items-center gap-3">
        <AddToPipelineButton rfp={rfp} />
      </div>

      {/* Progress bar overlay at the bottom */}
      {progress > 0 && (
        <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-slate-100">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            className="h-full bg-gradient-to-r from-indigo-500 to-purple-600"
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
        </div>
      )}
    </motion.div>
  );
}
