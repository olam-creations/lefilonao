'use client';

import { Sparkles, AlertTriangle, XCircle } from 'lucide-react';
import type { Recommendation } from '@/lib/dev';

interface VerdictBadgeProps {
  score: number;
  scoreLabel: 'GO' | 'MAYBE' | 'PASS';
  recommendation: Recommendation | null;
  size?: 'sm' | 'md' | 'lg';
}

const VERDICT_CONFIG = {
  go: { badgeClass: 'badge-go glow-emerald', icon: Sparkles, iconColor: 'text-emerald-600' },
  maybe: { badgeClass: 'badge-maybe glow-amber', icon: AlertTriangle, iconColor: 'text-amber-600' },
  pass: { badgeClass: 'badge-pass', icon: XCircle, iconColor: 'text-red-500' },
} as const;

const SIZE_CLASSES = {
  sm: 'text-xs px-2.5 py-0.5',
  md: 'text-sm px-3 py-1',
  lg: 'text-lg px-4 py-1.5',
} as const;

export default function VerdictBadge({ score, scoreLabel, recommendation, size = 'md' }: VerdictBadgeProps) {
  const verdict = recommendation?.verdict ?? (scoreLabel === 'GO' ? 'go' : scoreLabel === 'PASS' ? 'pass' : 'maybe');
  const config = VERDICT_CONFIG[verdict];
  const Icon = config.icon;

  return (
    <div className="flex items-center gap-2">
      <span className={`${config.badgeClass} ${SIZE_CLASSES[size]}`}>
        {score}/100 &middot; {scoreLabel}
      </span>
      {recommendation && (
        <Icon className={`w-4 h-4 ${config.iconColor}`} />
      )}
    </div>
  );
}
