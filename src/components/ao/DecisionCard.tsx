'use client';

import { motion } from 'framer-motion';
import { ArrowRight, ExternalLink, Sparkles, AlertTriangle, XCircle } from 'lucide-react';
import { fadeUp, stagger } from '@/lib/motion-variants';
import type { Recommendation } from '@/lib/dev';

interface DecisionCardProps {
  score: number;
  scoreLabel: 'GO' | 'MAYBE' | 'PASS';
  recommendation: Recommendation;
  daysLeft: number | null;
  sourceUrl: string;
  onPrepare: () => void;
}

export default function DecisionCard({
  score, scoreLabel, recommendation, daysLeft, sourceUrl, onPrepare,
}: DecisionCardProps) {
  const isUrgent = daysLeft !== null && daysLeft <= 7;

  const verdictConfig = {
    go: {
      bg: 'bg-gradient-to-br from-emerald-50 to-white',
      border: 'border-emerald-200',
      accent: 'from-emerald-400 to-emerald-500',
      icon: <Sparkles className="w-5 h-5 text-emerald-600" />,
      badgeClass: 'badge-go glow-emerald',
    },
    maybe: {
      bg: 'bg-gradient-to-br from-amber-50 to-white',
      border: 'border-amber-200',
      accent: 'from-amber-400 to-amber-500',
      icon: <AlertTriangle className="w-5 h-5 text-amber-600" />,
      badgeClass: 'badge-maybe glow-amber',
    },
    pass: {
      bg: 'bg-gradient-to-br from-red-50 to-white',
      border: 'border-red-200',
      accent: 'from-red-400 to-red-500',
      icon: <XCircle className="w-5 h-5 text-red-500" />,
      badgeClass: 'badge-pass',
    },
  }[recommendation.verdict];

  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      animate="show"
      className={`rounded-2xl p-8 border ${verdictConfig.border} ${verdictConfig.bg} relative overflow-hidden`}
    >
      <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${verdictConfig.accent}`} />

      <div className="flex items-center gap-3 mb-5 flex-wrap">
        <span className={`${verdictConfig.badgeClass} text-lg px-4 py-1.5`}>
          {score}/100 &middot; {scoreLabel}
        </span>
        {isUrgent && daysLeft !== null && (
          <span className="text-sm text-red-600 bg-red-50 border border-red-200 px-3 py-1 rounded-lg font-medium">
            {daysLeft}j restants
          </span>
        )}
      </div>

      <div className="flex items-start gap-3 mb-4">
        {verdictConfig.icon}
        <h2 className="text-2xl font-bold text-slate-900">{recommendation.headline}</h2>
      </div>

      <motion.ul
        variants={stagger}
        initial="hidden"
        animate="show"
        className="space-y-2.5 mb-8 ml-1"
      >
        {recommendation.reasons.map((reason) => (
          <motion.li
            key={reason}
            variants={fadeUp}
            className="flex items-start gap-2.5 text-slate-600"
          >
            <Sparkles className="w-4 h-4 text-indigo-400 flex-shrink-0 mt-0.5" />
            <span className="text-sm leading-relaxed">{reason}</span>
          </motion.li>
        ))}
      </motion.ul>

      <div className="flex flex-wrap gap-3">
        <button onClick={onPrepare} className="btn-primary py-3 px-6 text-base">
          Préparer ma réponse <ArrowRight className="w-4 h-4" />
        </button>
        <a
          href={sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-secondary py-3 px-6 text-base"
        >
          Voir le DCE original <ExternalLink className="w-4 h-4" />
        </a>
      </div>
    </motion.div>
  );
}
