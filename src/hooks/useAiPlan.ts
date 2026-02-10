'use client';

import { useState, useRef, useCallback } from 'react';
import { executePlan, type AiPlan, type PlanStep, type StepType } from '@/lib/ai-plan';

type StepHandler = (
  params: Record<string, unknown>,
  signal?: AbortSignal,
) => Promise<unknown>;

interface UseAiPlanReturn {
  plan: AiPlan | null;
  currentStepIndex: number;
  progress: number;
  error: string | null;
  isRunning: boolean;
  execute: (plan: AiPlan, handlers: Record<StepType, StepHandler>) => Promise<AiPlan>;
  abort: () => void;
  reset: () => void;
}

export function useAiPlan(): UseAiPlanReturn {
  const [plan, setPlan] = useState<AiPlan | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(-1);
  const [error, setError] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const progress = plan
    ? plan.steps.filter((s) => s.status === 'done' || s.status === 'failed' || s.status === 'skipped').length / plan.steps.length
    : 0;

  const execute = useCallback(async (inputPlan: AiPlan, handlers: Record<StepType, StepHandler>): Promise<AiPlan> => {
    const controller = new AbortController();
    abortRef.current = controller;
    setPlan(inputPlan);
    setCurrentStepIndex(0);
    setError(null);
    setIsRunning(true);

    const onStepChange = (step: PlanStep, index: number) => {
      setCurrentStepIndex(index);
      setPlan((prev) => {
        if (!prev) return prev;
        const updatedSteps = [...prev.steps];
        updatedSteps[index] = step;
        return { ...prev, steps: updatedSteps };
      });
    };

    try {
      const result = await executePlan(inputPlan, handlers, {
        signal: controller.signal,
        onStepChange,
      });
      setPlan(result);
      if (result.status === 'failed') {
        const failedStep = result.steps.find((s) => s.status === 'failed');
        setError(failedStep?.error ?? 'Execution echouee');
      }
      return result;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erreur inattendue';
      setError(msg);
      throw err;
    } finally {
      setIsRunning(false);
      abortRef.current = null;
    }
  }, []);

  const abort = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setPlan(null);
    setCurrentStepIndex(-1);
    setError(null);
    setIsRunning(false);
  }, []);

  return { plan, currentStepIndex, progress, error, isRunning, execute, abort, reset };
}
