import {
  circuitBreaker,
  retry,
  ExponentialBackoff,
  wrap,
  timeout,
  TimeoutStrategy,
  ConsecutiveBreaker,
  handleAll,
} from 'cockatiel';

export interface ProviderPolicy {
  policy: ReturnType<typeof wrap>;
  name: string;
}

export function createProviderPolicy(name: string): ProviderPolicy {
  const retryPolicy = retry(handleAll, {
    maxAttempts: 2,
    backoff: new ExponentialBackoff({ initialDelay: 500, maxDelay: 5000 }),
  });

  const breakerPolicy = circuitBreaker(handleAll, {
    halfOpenAfter: 60_000,
    breaker: new ConsecutiveBreaker(3),
  });

  const timeoutPolicy = timeout(90_000, TimeoutStrategy.Aggressive);

  return { policy: wrap(timeoutPolicy, retryPolicy, breakerPolicy), name };
}

export const geminiPolicy = createProviderPolicy('gemini');
export const anthropicPolicy = createProviderPolicy('anthropic');
export const nvidiaPolicy = createProviderPolicy('nvidia');
export const ollamaPolicy = createProviderPolicy('ollama');

export interface CascadeProvider<T> {
  name: string;
  available: () => boolean;
  execute: () => Promise<T>;
}

const policyMap: Record<string, ProviderPolicy['policy']> = {
  gemini: geminiPolicy.policy,
  anthropic: anthropicPolicy.policy,
  nvidia: nvidiaPolicy.policy,
  ollama: ollamaPolicy.policy,
};

export async function resilientCascade<T>(
  providers: CascadeProvider<T>[],
  signal?: AbortSignal,
): Promise<T> {
  const errors: { provider: string; error: string }[] = [];

  for (const p of providers) {
    if (!p.available() || signal?.aborted) continue;
    try {
      const policy = policyMap[p.name];
      const result = policy
        ? await policy.execute(() => p.execute()) as T
        : await p.execute();
      return result;
    } catch (err) {
      errors.push({
        provider: p.name,
        error: err instanceof Error ? err.message : 'Unknown',
      });
    }
  }

  if (signal?.aborted) {
    throw new Error('Operation aborted');
  }

  throw new Error(
    `Tous les providers IA ont echoue: ${errors.map((e) => `${e.provider}: ${e.error}`).join(', ')}`,
  );
}
