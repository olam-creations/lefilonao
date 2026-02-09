'use client';

import { Sparkles, AlertTriangle, XCircle } from 'lucide-react';
import type { Recommendation } from '@/lib/dev';

interface RecommendationCardProps {
  recommendation: Recommendation;
}

const VERDICT_CONFIG = {
  go: {
    bg: 'bg-gradient-to-br from-emerald-50 to-white',
    border: 'border-emerald-200',
    accent: 'from-emerald-400 to-emerald-500',
    icon: Sparkles,
    iconColor: 'text-emerald-600',
  },
  maybe: {
    bg: 'bg-gradient-to-br from-amber-50 to-white',
    border: 'border-amber-200',
    accent: 'from-amber-400 to-amber-500',
    icon: AlertTriangle,
    iconColor: 'text-amber-600',
  },
  pass: {
    bg: 'bg-gradient-to-br from-red-50 to-white',
    border: 'border-red-200',
    accent: 'from-red-400 to-red-500',
    icon: XCircle,
    iconColor: 'text-red-500',
  },
} as const;

export default function RecommendationCard({ recommendation }: RecommendationCardProps) {
  const config = VERDICT_CONFIG[recommendation.verdict];
  const Icon = config.icon;

  return (
    <div className={`rounded-2xl p-6 border ${config.border} ${config.bg} relative overflow-hidden`}>
      <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${config.accent}`} />

      <div className="flex items-start gap-3 mb-4">
        <Icon className={`w-5 h-5 ${config.iconColor} flex-shrink-0 mt-0.5`} />
        <h3 className="text-lg font-bold text-slate-900">{recommendation.headline}</h3>
      </div>

      <ul className="space-y-2 ml-1">
        {recommendation.reasons.map((reason) => (
          <li key={reason} className="flex items-start gap-2.5 text-slate-600">
            <Sparkles className="w-4 h-4 text-indigo-400 flex-shrink-0 mt-0.5" />
            <span className="text-sm leading-relaxed">{reason}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
