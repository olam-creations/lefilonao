import { useState, useCallback, useRef, useEffect } from 'react';
import type { AoDetail } from '@/lib/dev';

type AnalysisState = 'idle' | 'uploading' | 'analyzing' | 'done' | 'error';

interface AnalysisProgress {
  step: string;
  percent: number;
}

const ANALYSIS_STEPS = [
  { step: 'Lecture du document...', percent: 15 },
  { step: 'Extraction des criteres...', percent: 40 },
  { step: 'Analyse des exigences...', percent: 65 },
  { step: 'Generation du scoring...', percent: 85 },
];

export function useDceAnalysis() {
  const [state, setState] = useState<AnalysisState>('idle');
  const [progress, setProgress] = useState<AnalysisProgress>({ step: '', percent: 0 });
  const [result, setResult] = useState<AoDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fallbackUrl, setFallbackUrl] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const analyzeDce = useCallback(async (file: File) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setState('uploading');
    setProgress({ step: 'Envoi du fichier...', percent: 5 });
    setError(null);
    setResult(null);
    setFallbackUrl(null);

    const formData = new FormData();
    formData.append('file', file);

    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setProgress((prev) => {
        const nextStep = ANALYSIS_STEPS.find((s) => s.percent > prev.percent);
        return nextStep ?? prev;
      });
    }, 1500);

    try {
      setState('analyzing');
      setProgress(ANALYSIS_STEPS[0]);

      const response = await fetch('/api/ai/analyze-dce', {
        method: 'POST',
        body: formData,
        signal: controller.signal,
      });

      if (intervalRef.current) clearInterval(intervalRef.current);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let json: any;
      try {
        json = await response.json();
      } catch {
        throw new Error(response.ok ? 'Reponse invalide du serveur' : `Erreur serveur (${response.status})`);
      }

      if (!response.ok || !json.success) {
        throw new Error(json.error || 'Erreur lors de l\'analyse');
      }

      setProgress({ step: 'Analyse terminee', percent: 100 });
      setResult(json.data);
      setState('done');
    } catch (err) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (err instanceof Error && err.name === 'AbortError') {
        setState('idle');
        return;
      }
      const message = err instanceof Error ? err.message : 'Erreur inconnue';
      setError(message);
      setState('error');
    }
  }, []);

  const analyzeFromUrl = useCallback(async (noticeId: string) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setState('uploading');
    setProgress({ step: 'Recuperation du DCE...', percent: 5 });
    setError(null);
    setResult(null);
    setFallbackUrl(null);

    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setProgress((prev) => {
        const nextStep = ANALYSIS_STEPS.find((s) => s.percent > prev.percent);
        return nextStep ?? prev;
      });
    }, 1500);

    try {
      setState('analyzing');
      setProgress(ANALYSIS_STEPS[0]);

      const response = await fetch('/api/ai/fetch-dce', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notice_id: noticeId }),
        signal: controller.signal,
      });

      if (intervalRef.current) clearInterval(intervalRef.current);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let json: any;
      try {
        json = await response.json();
      } catch {
        throw new Error(response.ok ? 'Reponse invalide du serveur' : `Erreur serveur (${response.status})`);
      }

      if (!response.ok || !json.success) {
        if (json.fallback_url) {
          setFallbackUrl(json.fallback_url);
        }
        throw new Error(json.error || 'Erreur lors de la recuperation du DCE');
      }

      setProgress({ step: 'Analyse terminee', percent: 100 });
      setResult(json.data);
      setState('done');
    } catch (err) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (err instanceof Error && err.name === 'AbortError') {
        setState('idle');
        return;
      }
      const message = err instanceof Error ? err.message : 'Erreur inconnue';
      setError(message);
      setState('error');
    }
  }, []);

  const reset = useCallback(() => {
    setState('idle');
    setProgress({ step: '', percent: 0 });
    setResult(null);
    setError(null);
    setFallbackUrl(null);
  }, []);

  return { state, progress, result, error, fallbackUrl, analyzeDce, analyzeFromUrl, reset };
}
