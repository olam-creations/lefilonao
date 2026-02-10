'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight, FileText, Target, AlertTriangle, CheckSquare, BarChart3 } from 'lucide-react';
import type { SelectionCriteria, VigilancePoint, ScoreCriteria, Recommendation } from '@/lib/dev';

interface WorkspaceLeftPaneProps {
  aiSummary: string;
  selectionCriteria: SelectionCriteria[];
  vigilancePoints: VigilancePoint[];
  complianceChecklist: string[];
  scoreCriteria: ScoreCriteria[];
  recommendation: Recommendation;
  executiveSummary: string;
  onCriterionClick?: (criterionName: string) => void;
  activeCriterion?: string | null;
}

const CRITERION_COLORS = [
  'bg-indigo-500',
  'bg-violet-500',
  'bg-purple-400',
  'bg-fuchsia-400',
  'bg-pink-400',
];

function CollapsibleSection({
  title,
  icon: Icon,
  defaultOpen = false,
  children,
}: {
  title: string;
  icon: React.ElementType;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-slate-100 last:border-b-0">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2 py-3 px-1 text-left hover:bg-slate-50 rounded-lg transition-colors"
      >
        {open ? <ChevronDown className="w-3.5 h-3.5 text-slate-400" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-400" />}
        <Icon className="w-4 h-4 text-indigo-500" />
        <span className="text-sm font-semibold text-slate-900">{title}</span>
      </button>
      {open && <div className="pb-3 px-1">{children}</div>}
    </div>
  );
}

export default function WorkspaceLeftPane({
  aiSummary,
  selectionCriteria,
  vigilancePoints,
  complianceChecklist,
  scoreCriteria,
  recommendation,
  executiveSummary,
  onCriterionClick,
  activeCriterion,
}: WorkspaceLeftPaneProps) {
  const totalWeight = selectionCriteria.reduce((sum, c) => sum + c.weight, 0);

  return (
    <div className="space-y-1">
      {/* Recommendation badge */}
      <div className={`rounded-xl p-3 mb-3 ${
        recommendation.verdict === 'go' ? 'bg-emerald-50 border border-emerald-200' :
        recommendation.verdict === 'maybe' ? 'bg-amber-50 border border-amber-200' :
        'bg-slate-50 border border-slate-200'
      }`}>
        <div className="flex items-center gap-2 mb-1">
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
            recommendation.verdict === 'go' ? 'bg-emerald-500 text-white' :
            recommendation.verdict === 'maybe' ? 'bg-amber-500 text-white' :
            'bg-slate-500 text-white'
          }`}>
            {recommendation.verdict.toUpperCase()}
          </span>
          <span className="text-sm font-medium text-slate-900">{recommendation.headline}</span>
        </div>
      </div>

      {/* Selection Criteria — interactive */}
      <CollapsibleSection title="Criteres de selection" icon={Target} defaultOpen>
        {/* Segmented bar */}
        <div className="flex rounded-lg overflow-hidden h-6 mb-3">
          {selectionCriteria.map((c, i) => {
            const pct = totalWeight > 0 ? (c.weight / totalWeight) * 100 : 0;
            return (
              <div
                key={c.name}
                className={`${CRITERION_COLORS[i % CRITERION_COLORS.length]} flex items-center justify-center transition-all`}
                style={{ width: `${pct}%` }}
              >
                {pct >= 15 && (
                  <span className="text-[10px] font-semibold text-white truncate px-1">{c.weight}%</span>
                )}
              </div>
            );
          })}
        </div>

        {/* Clickable criterion list */}
        <div className="space-y-1.5">
          {selectionCriteria.map((c, i) => (
            <button
              key={c.name}
              onClick={() => onCriterionClick?.(c.name)}
              className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-left transition-all ${
                activeCriterion === c.name
                  ? 'bg-indigo-50 border border-indigo-200 shadow-sm'
                  : 'hover:bg-slate-50 border border-transparent'
              }`}
            >
              <div className={`w-2.5 h-2.5 rounded-sm flex-shrink-0 ${CRITERION_COLORS[i % CRITERION_COLORS.length]}`} />
              <span className="text-xs text-slate-700 flex-1">{c.name}</span>
              <span className="text-xs font-bold text-slate-900">{c.weight}%</span>
            </button>
          ))}
        </div>
      </CollapsibleSection>

      {/* Score details */}
      {scoreCriteria.length > 0 && (
        <CollapsibleSection title="Score IA" icon={BarChart3}>
          <div className="space-y-2">
            {scoreCriteria.map((c) => {
              const pct = (c.score / 20) * 100;
              const color = c.score >= 15 ? 'bg-emerald-500' : c.score >= 10 ? 'bg-amber-400' : 'bg-red-400';
              return (
                <div key={c.label}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-600">{c.label}</span>
                    <span className="font-semibold text-slate-900">{c.score}/20</span>
                  </div>
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </CollapsibleSection>
      )}

      {/* Vigilance points */}
      {vigilancePoints.length > 0 && (
        <CollapsibleSection title="Points de vigilance" icon={AlertTriangle}>
          <div className="space-y-2">
            {vigilancePoints.map((p) => (
              <div
                key={p.title}
                className={`rounded-lg p-2.5 text-xs border-l-2 ${
                  p.type === 'risk' ? 'border-l-red-500 bg-red-50/50' :
                  p.type === 'warning' ? 'border-l-amber-400 bg-amber-50/50' :
                  'border-l-emerald-500 bg-emerald-50/50'
                }`}
              >
                <div className={`font-semibold mb-0.5 ${
                  p.type === 'risk' ? 'text-red-800' :
                  p.type === 'warning' ? 'text-amber-800' :
                  'text-emerald-800'
                }`}>{p.title}</div>
                <p className="text-slate-600 leading-relaxed">{p.description}</p>
              </div>
            ))}
          </div>
        </CollapsibleSection>
      )}

      {/* Compliance checklist */}
      {complianceChecklist.length > 0 && (
        <CollapsibleSection title="Documents requis" icon={CheckSquare}>
          <ul className="space-y-1.5">
            {complianceChecklist.map((item) => (
              <li key={item} className="flex items-start gap-2 text-xs text-slate-600">
                <CheckSquare className="w-3 h-3 text-slate-400 mt-0.5 flex-shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </CollapsibleSection>
      )}

      {/* Executive summary */}
      {executiveSummary && (
        <CollapsibleSection title="Synthese" icon={FileText}>
          <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">{executiveSummary}</p>
        </CollapsibleSection>
      )}
    </div>
  );
}
