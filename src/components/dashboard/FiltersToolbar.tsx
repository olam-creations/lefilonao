'use client';

import { useState, useCallback } from 'react';
import { Search, SlidersHorizontal, Download, ChevronDown } from 'lucide-react';
import type { ScoreLabel, DeadlineRange, SortKey } from '@/hooks/useDashboardFilters';

interface FiltersToolbarProps {
  search: string;
  onSearchChange: (v: string) => void;
  scoreLabels: Set<ScoreLabel>;
  onToggleScore: (label: ScoreLabel) => void;
  region: string;
  onRegionChange: (v: string) => void;
  regions: string[];
  deadlineRange: DeadlineRange;
  onDeadlineRangeChange: (v: DeadlineRange) => void;
  sort: SortKey;
  onSortChange: (v: SortKey) => void;
  resultCount: number;
  totalCount: number;
  onExportCsv: () => void;
}

const SCORE_BUTTONS: { key: ScoreLabel; label: string; cls: string; activeCls: string }[] = [
  { key: 'GO', label: 'GO', cls: 'text-emerald-600 border-emerald-200', activeCls: 'bg-emerald-50 border-emerald-400 ring-1 ring-emerald-200' },
  { key: 'MAYBE', label: 'Maybe', cls: 'text-amber-600 border-amber-200', activeCls: 'bg-amber-50 border-amber-400 ring-1 ring-amber-200' },
  { key: 'PASS', label: 'Pass', cls: 'text-slate-500 border-slate-200', activeCls: 'bg-slate-100 border-slate-400 ring-1 ring-slate-200' },
];

const DEADLINE_OPTIONS: { key: DeadlineRange; label: string }[] = [
  { key: 'all', label: 'Toutes' },
  { key: '7', label: '< 7j' },
  { key: '15', label: '< 15j' },
  { key: '30', label: '< 30j' },
];

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: 'score-desc', label: 'Score (desc)' },
  { key: 'score-asc', label: 'Score (asc)' },
  { key: 'deadline-asc', label: 'Deadline (proche)' },
  { key: 'deadline-desc', label: 'Deadline (loin)' },
  { key: 'budget-desc', label: 'Budget (desc)' },
  { key: 'recent', label: 'Plus recent' },
];

export default function FiltersToolbar({
  search, onSearchChange,
  scoreLabels, onToggleScore,
  region, onRegionChange, regions,
  deadlineRange, onDeadlineRangeChange,
  sort, onSortChange,
  resultCount, totalCount,
  onExportCsv,
}: FiltersToolbarProps) {
  const [showMore, setShowMore] = useState(false);

  const toggleMore = useCallback(() => setShowMore((p) => !p), []);

  return (
    <div className="space-y-3 mb-6">
      {/* Row 1: Search + Score toggles + Export */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 w-full sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Rechercher un AO..."
            aria-label="Rechercher un appel d'offres"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition-all"
          />
        </div>

        {/* Score toggles */}
        <div className="flex gap-1.5">
          {SCORE_BUTTONS.map((btn) => (
            <button
              key={btn.key}
              onClick={() => onToggleScore(btn.key)}
              className={`px-3 py-2 sm:py-1.5 text-xs font-medium rounded-lg border transition-all ${
                scoreLabels.has(btn.key) ? btn.activeCls : `${btn.cls} hover:bg-slate-50`
              }`}
            >
              {btn.label}
            </button>
          ))}
        </div>

        {/* More filters toggle + Export */}
        <div className="flex items-center gap-2 ml-auto">
          <button
            onClick={toggleMore}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-600 rounded-lg border border-slate-200 hover:bg-slate-50 transition-all"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            Plus de filtres
            <ChevronDown className={`w-3 h-3 transition-transform ${showMore ? 'rotate-180' : ''}`} />
          </button>
          <button onClick={onExportCsv} className="btn-secondary text-xs py-2 px-3">
            <Download className="w-3.5 h-3.5" /> CSV
          </button>
        </div>
      </div>

      {/* Row 2: Extended filters (collapsible on mobile) */}
      {showMore && (
        <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-3 animate-fade-up">
          {/* Region select */}
          <select
            value={region}
            onChange={(e) => onRegionChange(e.target.value)}
            aria-label="Filtrer par region"
            className="px-3 py-2.5 sm:py-2 text-sm sm:text-xs rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-200"
          >
            <option value="">Toutes les regions</option>
            {regions.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>

          {/* Deadline range */}
          <div className="flex gap-1 bg-slate-100 p-0.5 rounded-lg">
            {DEADLINE_OPTIONS.map((opt) => (
              <button
                key={opt.key}
                onClick={() => onDeadlineRangeChange(opt.key)}
                className={`px-2.5 py-2 sm:py-1.5 text-xs font-medium rounded-md transition-all ${
                  deadlineRange === opt.key
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Sort */}
          <select
            value={sort}
            onChange={(e) => onSortChange(e.target.value as SortKey)}
            aria-label="Trier les resultats"
            className="px-3 py-2.5 sm:py-2 text-sm sm:text-xs rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-200"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.key} value={opt.key}>{opt.label}</option>
            ))}
          </select>
        </div>
      )}

      {/* Result counter */}
      <div className="text-xs text-slate-400">
        {resultCount === totalCount
          ? `${totalCount} appels d'offres`
          : `${resultCount} sur ${totalCount} appels d'offres`}
      </div>
    </div>
  );
}
