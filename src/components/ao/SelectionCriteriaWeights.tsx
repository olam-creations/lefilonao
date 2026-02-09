'use client';

import type { SelectionCriteria } from '@/lib/dev';

interface SelectionCriteriaWeightsProps {
  criteria: SelectionCriteria[];
}

const COLORS = [
  'bg-indigo-500',
  'bg-violet-500',
  'bg-purple-400',
  'bg-fuchsia-400',
  'bg-pink-400',
];

export default function SelectionCriteriaWeights({ criteria }: SelectionCriteriaWeightsProps) {
  if (criteria.length === 0) return null;

  const totalWeight = criteria.reduce((sum, c) => sum + c.weight, 0);

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200">
      <h3 className="text-sm font-semibold text-slate-900 mb-4">Critères de sélection</h3>

      {/* Segmented bar */}
      <div className="flex rounded-lg overflow-hidden h-8 mb-4">
        {criteria.map((c, i) => {
          const pct = totalWeight > 0 ? (c.weight / totalWeight) * 100 : 0;
          return (
            <div
              key={c.name}
              className={`${COLORS[i % COLORS.length]} flex items-center justify-center transition-all`}
              style={{ width: `${pct}%` }}
            >
              {pct >= 15 && (
                <span className="text-xs font-semibold text-white truncate px-1">
                  {c.weight}%
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Labels */}
      <div className="flex flex-wrap gap-4">
        {criteria.map((c, i) => (
          <div key={c.name} className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-sm ${COLORS[i % COLORS.length]}`} />
            <span className="text-xs text-slate-600">
              {c.name} <span className="font-semibold text-slate-900">{c.weight}%</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
