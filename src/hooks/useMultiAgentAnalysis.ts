'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import type {
  AgentName,
  ParsedDce,
  MarketIntelligence,
  AnalysisResult,
  WrittenSection,
  ReviewResult,
  MultiAgentEvent,
} from '@/lib/agents/types';

type PipelineState = 'idle' | 'running' | 'done' | 'error';
type AgentStatus = 'pending' | 'running' | 'done' | 'error';

interface AgentState {
  status: AgentStatus;
  durationMs?: number;
  error?: string;
}

const AGENT_ORDER: AgentName[] = ['parser', 'intelligence', 'analyst', 'writer', 'reviewer'];

function initialAgents(): Record<AgentName, AgentState> {
  return {
    parser: { status: 'pending' },
    intelligence: { status: 'pending' },
    analyst: { status: 'pending' },
    writer: { status: 'pending' },
    reviewer: { status: 'pending' },
  };
}

export interface MultiAgentState {
  pipeline: PipelineState;
  agents: Record<AgentName, AgentState>;
  parsedDce: ParsedDce | null;
  intelligence: MarketIntelligence | null;
  analysis: AnalysisResult | null;
  sections: Map<string, WrittenSection>;
  sectionStreams: Map<string, string>;
  review: ReviewResult | null;
  progress: number;
  totalMs: number;
  error: string | null;
}

interface ExecuteParams {
  file: File;
  profile: Record<string, unknown>;
  options?: Record<string, unknown>;
}

export function useMultiAgentAnalysis() {
  const [pipeline, setPipeline] = useState<PipelineState>('idle');
  const [agents, setAgents] = useState<Record<AgentName, AgentState>>(initialAgents);
  const [parsedDce, setParsedDce] = useState<ParsedDce | null>(null);
  const [intelligence, setIntelligence] = useState<MarketIntelligence | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [sections, setSections] = useState<Map<string, WrittenSection>>(new Map());
  const [sectionStreams, setSectionStreams] = useState<Map<string, string>>(new Map());
  const [review, setReview] = useState<ReviewResult | null>(null);
  const [totalMs, setTotalMs] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const abortRef = useRef<AbortController | null>(null);

  const progress = (() => {
    const doneCount = AGENT_ORDER.filter((name) => agents[name].status === 'done').length;
    return Math.round((doneCount / AGENT_ORDER.length) * 100);
  })();

  const processEvent = useCallback((event: MultiAgentEvent) => {
    switch (event.type) {
      case 'agent_start':
        setAgents((prev) => ({
          ...prev,
          [event.agent]: { status: 'running' as const },
        }));
        break;

      case 'agent_done':
        setAgents((prev) => ({
          ...prev,
          [event.agent]: { status: 'done' as const, durationMs: event.durationMs },
        }));
        break;

      case 'agent_error':
        setAgents((prev) => ({
          ...prev,
          [event.agent]: { status: 'error' as const, error: event.error },
        }));
        break;

      case 'parser_result':
        setParsedDce(event.data);
        break;

      case 'intelligence_result':
        setIntelligence(event.data);
        break;

      case 'analysis_result':
        setAnalysis(event.data);
        break;

      case 'section_stream':
        setSectionStreams((prev) => {
          const next = new Map(prev);
          next.set(event.sectionId, (prev.get(event.sectionId) ?? '') + event.text);
          return next;
        });
        break;

      case 'section_done':
        setSections((prev) => {
          const next = new Map(prev);
          next.set(event.section.sectionId, event.section);
          return next;
        });
        break;

      case 'review_result':
        setReview(event.data);
        break;

      case 'pipeline_done':
        setTotalMs(event.totalMs);
        setPipeline('done');
        break;

      case 'pipeline_error':
        setError(event.error);
        setPipeline('error');
        break;
    }
  }, []);

  const execute = useCallback(async (params: ExecuteParams) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    // Reset state
    setPipeline('running');
    setAgents(initialAgents());
    setParsedDce(null);
    setIntelligence(null);
    setAnalysis(null);
    setSections(new Map());
    setSectionStreams(new Map());
    setReview(null);
    setTotalMs(0);
    setError(null);

    const formData = new FormData();
    formData.append('file', params.file);
    formData.append('profile', JSON.stringify(params.profile));
    if (params.options) {
      formData.append('options', JSON.stringify(params.options));
    }

    try {
      const response = await fetch('/api/ai/analyze-full', {
        method: 'POST',
        body: formData,
        credentials: 'include',
        signal: controller.signal,
      });

      if (!response.ok) {
        let msg = `Erreur serveur (${response.status})`;
        try {
          const json = await response.json();
          if (json.error) msg = json.error;
        } catch { /* empty or non-JSON body */ }
        throw new Error(msg);
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
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const data = line.slice(6).trim();
          if (data === '[DONE]') return;

          try {
            const event = JSON.parse(data) as MultiAgentEvent;
            processEvent(event);
          } catch {
            // Skip malformed SSE frames
          }
        }
      }

      // If we reach here without pipeline_done, mark as done
      setPipeline((prev) => (prev === 'running' ? 'done' : prev));
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        setPipeline('idle');
        return;
      }
      const msg = err instanceof Error ? err.message : 'Erreur inconnue';
      setError(msg);
      setPipeline('error');
    }
  }, [processEvent]);

  const abort = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setPipeline('done');
  }, []);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setPipeline('idle');
    setAgents(initialAgents());
    setParsedDce(null);
    setIntelligence(null);
    setAnalysis(null);
    setSections(new Map());
    setSectionStreams(new Map());
    setReview(null);
    setTotalMs(0);
    setError(null);
  }, []);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
      abortRef.current = null;
    };
  }, []);

  return {
    pipeline,
    agents,
    parsedDce,
    intelligence,
    analysis,
    sections,
    sectionStreams,
    review,
    progress,
    totalMs,
    error,
    execute,
    abort,
    reset,
  };
}
