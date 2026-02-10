'use client';

import { useState, useEffect, useCallback } from 'react';
import { FREE_AO_LIMIT } from '@/lib/features';
import { usePlan } from './usePlan';

export interface UseAoViewsReturn {
  viewsThisMonth: number;
  remaining: number | null;
  limit: number | null;
  loading: boolean;
  recordView: (noticeId: string) => Promise<boolean>;
}

export function useAoViews(): UseAoViewsReturn {
  const { isPro } = usePlan();
  const [viewsThisMonth, setViewsThisMonth] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/ao-views', { credentials: 'include' })
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data?.viewsThisMonth != null) {
          setViewsThisMonth(data.viewsThisMonth);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const limit = isPro ? null : FREE_AO_LIMIT;
  const remaining = limit !== null ? Math.max(0, limit - viewsThisMonth) : null;

  const recordView = useCallback(async (noticeId: string): Promise<boolean> => {
    try {
      const res = await fetch('/api/ao-views', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ noticeId }),
        credentials: 'include',
      });

      if (!res.ok) return false;

      const data = await res.json();
      if (data.viewsThisMonth != null) {
        setViewsThisMonth(data.viewsThisMonth);
      }
      return true;
    } catch {
      return false;
    }
  }, []);

  return { viewsThisMonth, remaining, limit, loading, recordView };
}
