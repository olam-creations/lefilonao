'use client';

import Link from 'next/link';
import { Lightbulb } from 'lucide-react';
import type { BriefingTip as BriefingTipType } from '@/lib/briefing';

interface Props {
  tip: BriefingTipType;
}

export default function BriefingTip({ tip }: Props) {
  return (
    <div className="flex items-start gap-2 text-xs text-slate-500">
      <Lightbulb className="w-3.5 h-3.5 text-amber-400 mt-0.5 shrink-0" />
      <span>
        {tip.text}
        {tip.actionUrl && tip.actionLabel && (
          <>
            {' '}
            <Link href={tip.actionUrl} className="text-indigo-500 hover:text-indigo-700 font-medium">
              {tip.actionLabel} &rarr;
            </Link>
          </>
        )}
      </span>
    </div>
  );
}
