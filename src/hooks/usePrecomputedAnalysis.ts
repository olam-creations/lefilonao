'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import type { AoDetail } from '@/lib/dev';

type AnalysisStatus = 'loading' | 'done' | 'processing' | 'unavailable';

interface PrecomputedTeaser {
  verdict: string | null;
  executiveSummary: string | null;
  criteriaCount: number;
}

interface UsePrecomputedAnalysisReturn {
  analysis: AoDetail | null;
  teaser: PrecomputedTeaser | null;
  status: AnalysisStatus;
  isLoading: boolean;
}

const POLL_INTERVAL = 10_000;
const MAX_POLL_DURATION = 5 * 60 * 1000; // 5 min

export function usePrecomputedAnalysis(noticeId: string): UsePrecomputedAnalysisReturn {
  const [analysis, setAnalysis] = useState<AoDetail | null>(null);
  const [teaser, setTeaser] = useState<PrecomputedTeaser | null>(null);
  const [status, setStatus] = useState<AnalysisStatus>('loading');
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startRef = useRef<number>(Date.now());

  const fetchAnalysis = useCallback(async () => {
    try {
      const res = await fetch(`/api/dce-analysis/${encodeURIComponent(noticeId)}`);
      if (!res.ok) {
        setStatus('unavailable');
        return 'stop' as const;
      }

      const json = await res.json();

      if (json.status === 'done' && json.analysis) {
        setAnalysis(json.analysis);
        setTeaser(null);
        setStatus('done');
        return 'stop' as const;
      }

      if (json.status === 'done' && json.teaser) {
        setTeaser(json.teaser);
        setAnalysis(null);
        setStatus('done');
        return 'stop' as const;
      }

      if (json.status === 'processing') {
        setStatus('processing');
        return 'continue' as const;
      }

      setStatus('unavailable');
      return 'stop' as const;
    } catch {
      setStatus('unavailable');
      return 'stop' as const;
    }
  }, [noticeId]);

  useEffect(() => {
    startRef.current = Date.now();
    setStatus('loading');
    setAnalysis(null);
    setTeaser(null);

    let cancelled = false;

    const init = async () => {
      const action = await fetchAnalysis();
      if (cancelled) return;

      if (action === 'continue') {
        // Start polling
        pollRef.current = setInterval(async () => {
          if (Date.now() - startRef.current > MAX_POLL_DURATION) {
            if (pollRef.current) clearInterval(pollRef.current);
            setStatus('unavailable');
            return;
          }
          const result = await fetchAnalysis();
          if (result === 'stop' && pollRef.current) {
            clearInterval(pollRef.current);
          }
        }, POLL_INTERVAL);
      }
    };

    init();

    return () => {
      cancelled = true;
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [noticeId, fetchAnalysis]);

  return {
    analysis,
    teaser,
    status,
    isLoading: status === 'loading',
  };
}
