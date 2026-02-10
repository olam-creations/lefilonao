'use client';

import { Sparkles } from 'lucide-react';

interface ProBadgeProps {
  className?: string;
}

export default function ProBadge({ className = '' }: ProBadgeProps) {
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-gradient-to-r from-indigo-500 to-violet-500 text-white rounded-md ${className}`}>
      <Sparkles className="w-2.5 h-2.5" />
      Pro
    </span>
  );
}
