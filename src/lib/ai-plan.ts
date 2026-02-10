export type StepType = 'analyze_dce' | 'generate_section' | 'coach_review';

export interface PlanStep {
  id: string;
  type: StepType;
  params: Record<string, unknown>;
  status: 'pending' | 'running' | 'done' | 'failed' | 'skipped';
  result?: unknown;
  error?: string;
  durationMs?: number;
}

export interface AiPlan {
  id: string;
  steps: PlanStep[];
  status: 'pending' | 'running' | 'done' | 'failed';
  createdAt: number;
  completedAt?: number;
}

type StepHandler = (
  params: Record<string, unknown>,
  signal?: AbortSignal,
) => Promise<unknown>;

export interface ExecutePlanOptions {
  signal?: AbortSignal;
  onStepChange?: (step: PlanStep, index: number) => void;
}

function getNestedValue(obj: unknown, path: string): unknown {
  return path.split('.').reduce<unknown>((current, key) => {
    if (current === null || current === undefined) return undefined;
    if (typeof current === 'object') {
      return (current as Record<string, unknown>)[key];
    }
    return undefined;
  }, obj);
}

function resolveVars(value: unknown, plan: AiPlan): unknown {
  if (typeof value === 'string') {
    return value.replace(/\{\{step\[(\d+)\]\.result(?:\.([^}]+))?\}\}/g, (_match, indexStr, path) => {
      const stepIndex = Number(indexStr);
      const step = plan.steps[stepIndex];
      if (!step?.result) return '';
      if (!path) return String(step.result);
      const resolved = getNestedValue(step.result, path);
      return resolved !== undefined ? String(resolved) : '';
    });
  }

  if (Array.isArray(value)) {
    return value.map((item) => resolveVars(item, plan));
  }

  if (value !== null && typeof value === 'object') {
    const resolved: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      resolved[k] = resolveVars(v, plan);
    }
    return resolved;
  }

  return value;
}

export async function executePlan(
  plan: AiPlan,
  handlers: Record<StepType, StepHandler>,
  options: ExecutePlanOptions = {},
): Promise<AiPlan> {
  const { signal, onStepChange } = options;

  const updated: AiPlan = {
    ...plan,
    status: 'running',
    steps: plan.steps.map((s) => ({ ...s })),
  };

  for (let i = 0; i < updated.steps.length; i++) {
    if (signal?.aborted) {
      for (let j = i; j < updated.steps.length; j++) {
        updated.steps[j] = { ...updated.steps[j], status: 'skipped' };
      }
      break;
    }

    const step = updated.steps[i];
    const handler = handlers[step.type];

    if (!handler) {
      updated.steps[i] = { ...step, status: 'skipped', error: `No handler for ${step.type}` };
      onStepChange?.(updated.steps[i], i);
      continue;
    }

    updated.steps[i] = { ...step, status: 'running' };
    onStepChange?.(updated.steps[i], i);

    const start = Date.now();
    try {
      const resolvedParams = resolveVars(step.params, updated) as Record<string, unknown>;
      const result = await handler(resolvedParams, signal);
      updated.steps[i] = {
        ...step,
        status: 'done',
        result,
        durationMs: Date.now() - start,
      };
    } catch (err) {
      updated.steps[i] = {
        ...step,
        status: 'failed',
        error: err instanceof Error ? err.message : 'Unknown error',
        durationMs: Date.now() - start,
      };
    }

    onStepChange?.(updated.steps[i], i);
  }

  const hasFailed = updated.steps.some((s) => s.status === 'failed');
  const allSkipped = updated.steps.every((s) => s.status === 'skipped');

  return {
    ...updated,
    status: allSkipped ? 'failed' : hasFailed ? 'failed' : 'done',
    completedAt: Date.now(),
  };
}

export function createPlan(steps: Omit<PlanStep, 'status' | 'result' | 'error' | 'durationMs'>[]): AiPlan {
  return {
    id: crypto.randomUUID(),
    steps: steps.map((s) => ({
      ...s,
      status: 'pending' as const,
    })),
    status: 'pending',
    createdAt: Date.now(),
  };
}
