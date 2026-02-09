'use client';

import { ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface FreeBannerProps {
  tier: 'free' | 'pro';
  rfpsThisMonth: number;
}

export default function FreeBanner({ tier, rfpsThisMonth }: FreeBannerProps) {
  if (tier !== 'free') return null;

  const limit = 5;
  const used = Math.min(rfpsThisMonth, limit);

  return (
    <div className="flex items-center justify-between bg-indigo-50 border border-indigo-200 rounded-xl px-5 py-3 mb-6">
      <span className="text-sm text-indigo-800">
        Plan Gratuit &mdash; <strong>{used}/{limit}</strong> AO utilisés ce mois
      </span>
      <Link
        href="/pricing"
        className="flex items-center gap-1 text-sm font-semibold text-indigo-700 hover:text-indigo-900 transition-colors"
      >
        Passer à Pro <ArrowRight className="w-3.5 h-3.5" />
      </Link>
    </div>
  );
}
