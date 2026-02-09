'use client';

import { CheckCircle2, ClipboardList } from 'lucide-react';

interface ComplianceChecklistProps {
  items: string[];
}

export default function ComplianceChecklist({ items }: ComplianceChecklistProps) {
  if (items.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200">
      <div className="flex items-center gap-2 mb-4">
        <ClipboardList className="w-4 h-4 text-indigo-500" />
        <h3 className="text-sm font-semibold text-slate-900">Checklist conformité</h3>
      </div>
      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item} className="flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
            <span className="text-sm text-slate-600">{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
