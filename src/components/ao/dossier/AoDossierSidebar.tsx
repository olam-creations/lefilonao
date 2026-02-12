'use client';

import { ExternalLink, User, FileText, Bell } from 'lucide-react';
import Link from 'next/link';
import DeadlineCountdown from '../DeadlineCountdown';
import VerdictBadge from './VerdictBadge';
import type { Recommendation } from '@/lib/dev';
import type { Amendment } from '@/hooks/useAoDossier';
import { formatDate } from '@/lib/ao-utils';

interface AoDossierSidebarProps {
  daysLeft: number | null;
  score: number;
  scoreLabel: 'GO' | 'MAYBE' | 'PASS';
  recommendation: Recommendation | null;
  sourceUrl: string;
  progress: number;
  hasAnalysis: boolean;
  amendments: Amendment[];
}

function ProgressRing({ progress }: { progress: number }) {
  const r = 32;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - progress / 100);

  return (
    <div className="flex flex-col items-center gap-2">
      <svg width="80" height="80" viewBox="0 0 80 80">
        <circle cx="40" cy="40" r={r} fill="none" stroke="#e2e8f0" strokeWidth="5" />
        <circle
          cx="40" cy="40" r={r} fill="none"
          stroke="url(#progressGrad)" strokeWidth="5" strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={offset}
          transform="rotate(-90 40 40)"
          className="progress-ring-circle"
        />
        <defs>
          <linearGradient id="progressGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#8b5cf6" />
          </linearGradient>
        </defs>
        <text x="40" y="44" textAnchor="middle" className="text-lg font-bold" fill="#1e293b">
          {progress}%
        </text>
      </svg>
      <span className="text-xs text-slate-400">Preparation</span>
    </div>
  );
}

function AmendmentsFeed({ amendments }: { amendments: Amendment[] }) {
  if (amendments.length === 0) return null;

  return (
    <div className="bg-white rounded-xl p-4 border border-slate-200">
      <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
        <Bell className="w-3.5 h-3.5" />
        Modifications ({amendments.length})
      </h4>
      <div className="space-y-2 max-h-48 overflow-y-auto">
        {amendments.map((a) => (
          <div key={a.id} className="text-xs">
            <div className="flex items-center gap-1.5">
              <span className="inline-flex px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 font-medium text-[10px]">
                {a.amendment_type}
              </span>
              <span className="text-slate-400">{formatDate(a.published_at)}</span>
            </div>
            {a.summary && (
              <p className="text-slate-600 mt-0.5 line-clamp-2">{a.summary}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AoDossierSidebar({
  daysLeft, score, scoreLabel, recommendation, sourceUrl, progress,
  hasAnalysis, amendments,
}: AoDossierSidebarProps) {
  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:block md:w-56 lg:w-64 flex-shrink-0">
        <div className="sticky top-16 space-y-4">
          <DeadlineCountdown daysLeft={daysLeft} />

          {hasAnalysis && (
            <div className="bg-white rounded-xl p-4 border border-slate-200 flex flex-col items-center gap-3">
              <VerdictBadge
                score={score}
                scoreLabel={scoreLabel}
                recommendation={recommendation}
                size="md"
              />
            </div>
          )}

          <div className="bg-white rounded-xl p-4 border border-slate-200 space-y-2">
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Actions rapides</h4>
            <a
              href={sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-slate-600 hover:text-indigo-600 transition-colors py-1.5"
            >
              <ExternalLink className="w-3.5 h-3.5" /> Voir sur le BOAMP
            </a>
            <Link
              href="/dashboard/profile"
              className="flex items-center gap-2 text-sm text-slate-600 hover:text-indigo-600 transition-colors py-1.5"
            >
              <User className="w-3.5 h-3.5" /> Mon profil entreprise
            </Link>
            <Link
              href="/dashboard"
              className="flex items-center gap-2 text-sm text-slate-600 hover:text-indigo-600 transition-colors py-1.5"
            >
              <FileText className="w-3.5 h-3.5" /> Tous les AO
            </Link>
          </div>

          {hasAnalysis && (
            <div className="bg-white rounded-xl p-4 border border-slate-200 flex justify-center">
              <ProgressRing progress={progress} />
            </div>
          )}

          <AmendmentsFeed amendments={amendments} />
        </div>
      </aside>

      {/* Mobile bottom bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-white/90 backdrop-blur-lg border-t border-slate-200 px-4 py-3">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          {hasAnalysis && (
            <VerdictBadge score={score} scoreLabel={scoreLabel} recommendation={recommendation} size="sm" />
          )}
          {daysLeft !== null && (
            <span className={`text-xs font-semibold px-2 py-1 rounded-md ${
              daysLeft > 14 ? 'text-emerald-700 bg-emerald-50' :
              daysLeft > 7 ? 'text-amber-700 bg-amber-50' :
              'text-red-700 bg-red-50'
            }`}>
              J-{daysLeft}
            </span>
          )}
          {hasAnalysis && (
            <span className="text-xs font-mono text-indigo-600 font-semibold">{progress}%</span>
          )}
          <a
            href={sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-slate-500 hover:text-indigo-600 flex items-center gap-1"
          >
            BOAMP <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    </>
  );
}
