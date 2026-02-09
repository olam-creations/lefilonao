'use client';

import { Sparkles } from 'lucide-react';
import CopyButton from '@/components/ao/CopyButton';

interface AiSummaryCardProps {
  summary: string;
}

export default function AiSummaryCard({ summary }: AiSummaryCardProps) {
  return (
    <div className="bg-gradient-to-r from-indigo-50 to-violet-50 rounded-2xl p-6 border border-indigo-100">
      <div className="flex items-start gap-3">
        <Sparkles className="w-5 h-5 text-indigo-500 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <div className="text-sm font-semibold text-indigo-900 mb-1">Résumé IA du DCE</div>
          <p className="text-sm text-indigo-800 leading-relaxed">{summary}</p>
        </div>
        <CopyButton text={summary} />
      </div>
    </div>
  );
}
