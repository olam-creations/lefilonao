'use client';

import { useState, useEffect } from 'react';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import type { Plan } from '@/lib/features';
import { FREE_AO_LIMIT } from '@/lib/features';

interface FreeBannerProps {
  tier: Plan;
}

export default function FreeBanner({ tier }: FreeBannerProps) {
  if (tier !== 'free') return null;

  const [viewsThisMonth, setViewsThisMonth] = useState(0);

  useEffect(() => {
    fetch('/api/ao-views', { credentials: 'include' })
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data?.viewsThisMonth != null) {
          setViewsThisMonth(data.viewsThisMonth);
        }
      })
      .catch(() => {});
  }, []);

  const used = Math.min(viewsThisMonth, FREE_AO_LIMIT);

  return (
    <div className="flex items-center justify-between bg-indigo-50 border border-indigo-200 rounded-xl px-5 py-3 mb-6">
      <span className="text-sm text-indigo-800">
        Plan Gratuit &mdash; <strong>{used}/{FREE_AO_LIMIT}</strong> AO consultés ce mois
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
