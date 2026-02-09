import { useState, useMemo, useCallback, useEffect } from 'react';
import { daysUntil } from '@/lib/ao-utils';

export interface RFP {
  id: string;
  title: string;
  issuer: string;
  deadline: string | null;
  score: number;
  scoreLabel: 'GO' | 'MAYBE' | 'PASS';
  budget: string | null;
  region: string | null;
  source: string;
  url: string;
  publishedAt: string;
}

export type ScoreLabel = 'GO' | 'MAYBE' | 'PASS';
export type DeadlineRange = 'all' | '7' | '15' | '30';
export type SortKey = 'score-desc' | 'score-asc' | 'deadline-asc' | 'deadline-desc' | 'budget-desc' | 'recent';

export interface ActiveFilter {
  key: string;
  label: string;
}

function parseBudget(budgetStr: string | null): number | null {
  if (!budgetStr) return null;
  const cleaned = budgetStr.replace(/[^0-9]/g, '');
  return cleaned ? parseInt(cleaned, 10) : null;
}

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}

export function useDashboardFilters(rfps: RFP[]) {
  const [search, setSearch] = useState('');
  const [scoreLabels, setScoreLabels] = useState<Set<ScoreLabel>>(new Set());
  const [region, setRegion] = useState('');
  const [budgetMin, setBudgetMin] = useState<number | null>(null);
  const [budgetMax, setBudgetMax] = useState<number | null>(null);
  const [deadlineRange, setDeadlineRange] = useState<DeadlineRange>('all');
  const [sort, setSort] = useState<SortKey>('score-desc');

  const debouncedSearch = useDebounce(search, 300);

  const toggleScoreLabel = useCallback((label: ScoreLabel) => {
    setScoreLabels((prev) => {
      const next = new Set(prev);
      if (next.has(label)) {
        next.delete(label);
      } else {
        next.add(label);
      }
      return next;
    });
  }, []);

  const clearFilter = useCallback((key: string) => {
    switch (key) {
      case 'search': setSearch(''); break;
      case 'region': setRegion(''); break;
      case 'budgetMin': setBudgetMin(null); break;
      case 'budgetMax': setBudgetMax(null); break;
      case 'deadline': setDeadlineRange('all'); break;
      default:
        if (key.startsWith('score-')) {
          const label = key.replace('score-', '') as ScoreLabel;
          setScoreLabels((prev) => {
            const next = new Set(prev);
            next.delete(label);
            return next;
          });
        }
    }
  }, []);

  const clearAllFilters = useCallback(() => {
    setSearch('');
    setScoreLabels(new Set());
    setRegion('');
    setBudgetMin(null);
    setBudgetMax(null);
    setDeadlineRange('all');
    setSort('score-desc');
  }, []);

  const filteredRfps = useMemo(() => {
    let result = [...rfps];

    // Search
    if (debouncedSearch.trim()) {
      const q = debouncedSearch.toLowerCase();
      result = result.filter(
        (r) => r.title.toLowerCase().includes(q) ||
               r.issuer.toLowerCase().includes(q) ||
               (r.region && r.region.toLowerCase().includes(q))
      );
    }

    // Score labels
    if (scoreLabels.size > 0) {
      result = result.filter((r) => scoreLabels.has(r.scoreLabel));
    }

    // Region
    if (region) {
      result = result.filter((r) => r.region === region);
    }

    // Budget
    if (budgetMin !== null) {
      result = result.filter((r) => {
        const b = parseBudget(r.budget);
        return b !== null && b >= budgetMin;
      });
    }
    if (budgetMax !== null) {
      result = result.filter((r) => {
        const b = parseBudget(r.budget);
        return b !== null && b <= budgetMax;
      });
    }

    // Deadline range
    if (deadlineRange !== 'all') {
      const maxDays = parseInt(deadlineRange, 10);
      result = result.filter((r) => {
        const days = daysUntil(r.deadline);
        return days !== null && days >= 0 && days <= maxDays;
      });
    }

    // Sort
    result.sort((a, b) => {
      switch (sort) {
        case 'score-desc': return b.score - a.score;
        case 'score-asc': return a.score - b.score;
        case 'deadline-asc': {
          const dA = a.deadline ? new Date(a.deadline).getTime() : Infinity;
          const dB = b.deadline ? new Date(b.deadline).getTime() : Infinity;
          return dA - dB;
        }
        case 'deadline-desc': {
          const dA = a.deadline ? new Date(a.deadline).getTime() : -Infinity;
          const dB = b.deadline ? new Date(b.deadline).getTime() : -Infinity;
          return dB - dA;
        }
        case 'budget-desc': {
          const bA = parseBudget(a.budget) ?? 0;
          const bB = parseBudget(b.budget) ?? 0;
          return bB - bA;
        }
        case 'recent': {
          return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
        }
        default: return 0;
      }
    });

    return result;
  }, [rfps, debouncedSearch, scoreLabels, region, budgetMin, budgetMax, deadlineRange, sort]);

  const activeFilters = useMemo((): ActiveFilter[] => {
    const filters: ActiveFilter[] = [];
    if (debouncedSearch.trim()) {
      filters.push({ key: 'search', label: `"${debouncedSearch}"` });
    }
    for (const label of scoreLabels) {
      filters.push({ key: `score-${label}`, label });
    }
    if (region) {
      filters.push({ key: 'region', label: region });
    }
    if (budgetMin !== null) {
      filters.push({ key: 'budgetMin', label: `Min ${budgetMin.toLocaleString('fr-FR')}` });
    }
    if (budgetMax !== null) {
      filters.push({ key: 'budgetMax', label: `Max ${budgetMax.toLocaleString('fr-FR')}` });
    }
    if (deadlineRange !== 'all') {
      filters.push({ key: 'deadline', label: `< ${deadlineRange}j` });
    }
    return filters;
  }, [debouncedSearch, scoreLabels, region, budgetMin, budgetMax, deadlineRange]);

  const regions = useMemo(() => {
    const set = new Set<string>();
    for (const r of rfps) {
      if (r.region) set.add(r.region);
    }
    return [...set].sort();
  }, [rfps]);

  return {
    search, setSearch,
    scoreLabels, toggleScoreLabel,
    region, setRegion,
    budgetMin, setBudgetMin,
    budgetMax, setBudgetMax,
    deadlineRange, setDeadlineRange,
    sort, setSort,
    filteredRfps,
    resultCount: filteredRfps.length,
    activeFilters,
    clearFilter,
    clearAllFilters,
    regions,
  };
}
