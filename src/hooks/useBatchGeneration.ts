'use client';

import { useState, useCallback, useRef, useEffect } from 'react';

export type SectionStatus = 'pending' | 'streaming' | 'done' | 'error';

export interface BatchSectionState {
  status: SectionStatus;
  text: string;
  wordCount: number;
  error?: string;
}

export type BatchStatus = 'idle' | 'generating' | 'done' | 'error';

interface BatchResult {
  totalSections: number;
  successCount: number;
  totalWords: number;
}

interface GenerateParams {
  noticeId?: string;
  sections: { id: string; title: string; buyerExpectation: string }[];
  companyProfile: {
    companyName: string;
    sectors: string[];
    references: { client: string; title: string; amount: string; period: string }[];
    team: { name: string; role: string; certifications: string[]; experience: number }[];
    caN1: string;
    caN2: string;
    caN3: string;
  };
  dceContext: string;
  options?: {
    tone?: 'formal' | 'standard';
    length?: 'short' | 'medium' | 'detailed';
  };
}

export function useBatchGeneration() {
  const [status, setStatus] = useState<BatchStatus>('idle');
  const [sections, setSections] = useState<Map<string, BatchSectionState>>(new Map());
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [result, setResult] = useState<BatchResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const progress = sections.size > 0
    ? Array.from(sections.values()).filter((s) => s.status === 'done' || s.status === 'error').length / sections.size
    : 0;

  const generate = useCallback(async (params: GenerateParams) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    // Initialize section states
    const initial = new Map<string, BatchSectionState>();
    for (const s of params.sections) {
      initial.set(s.id, { status: 'pending', text: '', wordCount: 0 });
    }
    setSections(initial);
    setStatus('generating');
    setCurrentIndex(-1);
    setResult(null);
    setError(null);

    try {
      const response = await fetch('/api/ai/generate-memoire', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
        signal: controller.signal,
      });

      if (!response.ok) {
        const json = await response.json();
        throw new Error(json.error || `Erreur ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('Stream non disponible');

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const data = line.slice(6).trim();
          if (data === '[DONE]') break;

          try {
            const event = JSON.parse(data);
            handleEvent(event);
          } catch { /* skip malformed */ }
        }
      }

      setStatus((prev) => prev === 'generating' ? 'done' : prev);
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        setStatus('done'); // Partial results preserved
        return;
      }
      const msg = err instanceof Error ? err.message : 'Erreur inconnue';
      setError(msg);
      setStatus('error');
    }
  }, []);

  function handleEvent(event: Record<string, unknown>) {
    const type = event.type as string;
    const sectionId = event.sectionId as string;

    switch (type) {
      case 'section_start':
        setCurrentIndex(event.index as number);
        setSections((prev) => {
          const next = new Map(prev);
          next.set(sectionId, { status: 'streaming', text: '', wordCount: 0 });
          return next;
        });
        break;

      case 'chunk':
        setSections((prev) => {
          const next = new Map(prev);
          const current = next.get(sectionId);
          if (current) {
            next.set(sectionId, {
              ...current,
              text: current.text + (event.text as string),
            });
          }
          return next;
        });
        break;

      case 'section_done':
        setSections((prev) => {
          const next = new Map(prev);
          const current = next.get(sectionId);
          if (current) {
            next.set(sectionId, {
              ...current,
              status: 'done',
              wordCount: event.wordCount as number,
            });
          }
          return next;
        });
        break;

      case 'section_error':
        setSections((prev) => {
          const next = new Map(prev);
          const current = next.get(sectionId);
          if (current) {
            next.set(sectionId, {
              ...current,
              status: 'error',
              error: event.error as string,
            });
          }
          return next;
        });
        break;

      case 'all_done':
        setResult({
          totalSections: event.totalSections as number,
          successCount: event.successCount as number,
          totalWords: event.totalWords as number,
        });
        break;
    }
  }

  const abort = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setStatus('done');
  }, []);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setStatus('idle');
    setSections(new Map());
    setCurrentIndex(-1);
    setResult(null);
    setError(null);
  }, []);

  const getSectionText = useCallback((sectionId: string): string => {
    return sections.get(sectionId)?.text ?? '';
  }, [sections]);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
      abortRef.current = null;
    };
  }, []);

  return {
    status,
    sections,
    currentIndex,
    progress,
    result,
    error,
    generate,
    abort,
    reset,
    getSectionText,
  };
}
