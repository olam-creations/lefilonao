import { useState, useCallback } from 'react';
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

  const analyzeDce = useCallback(async (file: File) => {
    setState('uploading');
    setProgress({ step: 'Envoi du fichier...', percent: 5 });
    setError(null);
    setResult(null);

    const formData = new FormData();
    formData.append('file', file);

    const stepsInterval = setInterval(() => {
      setProgress((prev) => {
        const nextStep = ANALYSIS_STEPS.find((s) => s.percent > prev.percent);
        if (nextStep) {
          return nextStep;
        }
        return prev;
      });
    }, 1500);

    try {
      setState('analyzing');
      setProgress(ANALYSIS_STEPS[0]);

      const response = await fetch('/api/ai/analyze-dce', {
        method: 'POST',
        body: formData,
      });

      clearInterval(stepsInterval);

      const json = await response.json();

      if (!response.ok || !json.success) {
        throw new Error(json.error || 'Erreur lors de l\'analyse');
      }

      setProgress({ step: 'Analyse terminee', percent: 100 });
      setResult(json.data);
      setState('done');
    } catch (err) {
      clearInterval(stepsInterval);
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
  }, []);

  return { state, progress, result, error, analyzeDce, reset };
}
