import { useState, useCallback, useRef, useEffect } from 'react';

type GenerationState = 'idle' | 'generating' | 'done' | 'error';

interface GenerateParams {
  sectionTitle: string;
  buyerExpectation: string;
  dceContext: string;
  companyProfile: {
    companyName: string;
    sectors: string[];
    references: { client: string; title: string; amount: string; period: string }[];
    team: { name: string; role: string; certifications: string[]; experience: number }[];
    caN1: string;
    caN2: string;
    caN3: string;
  };
  options?: {
    tone?: 'formal' | 'standard';
    length?: 'short' | 'medium' | 'detailed';
  };
}

export function useStreamingGeneration() {
  const [state, setState] = useState<GenerationState>('idle');
  const [streamedText, setStreamedText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const generate = useCallback(async (params: GenerateParams) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    const timeoutId = setTimeout(() => controller.abort(), 5 * 60 * 1000);

    setState('generating');
    setStreamedText('');
    setError(null);

    try {
      const response = await fetch('/api/ai/generate-section', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
        signal: controller.signal,
      });

      if (!response.ok) {
        const json = await response.json();
        throw new Error(json.error || 'Erreur lors de la generation');
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Stream non disponible');
      }

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim();
            if (data === '[DONE]') {
              setState('done');
              return;
            }
            try {
              const parsed = JSON.parse(data);
              if (parsed.error) {
                throw new Error(parsed.error);
              }
              if (parsed.text) {
                setStreamedText((prev) => prev + parsed.text);
              }
            } catch (parseErr) {
              if (parseErr instanceof Error && parseErr.message !== data) {
                throw parseErr;
              }
            }
          }
        }
      }

      setState('done');
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        // Preserve partial text — show as done if we have content
        setState((prev) => prev === 'generating' ? 'done' : 'idle');
        return;
      }
      const message = err instanceof Error ? err.message : 'Erreur inconnue';
      setError(message);
      setState('error');
    } finally {
      clearTimeout(timeoutId);
    }
  }, []);

  const abort = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    // Keep partial text visible — show as done so user can accept/discard
    setState('done');
  }, []);

  const reset = useCallback(() => {
    setState('idle');
    setStreamedText('');
    setError(null);
  }, []);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
      abortRef.current = null;
    };
  }, []);

  return { state, streamedText, error, generate, abort, reset };
}
