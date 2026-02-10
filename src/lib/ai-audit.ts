export interface AiAuditEntry {
  id: string;
  timestamp: string;
  intent: string;
  provider: string;
  model: string;
  latencyMs: number;
  success: boolean;
  error?: string;
  tokens?: { prompt: number; completion: number };
  aoId?: string;
  sectionId?: string;
}

type AiAuditInput = Omit<AiAuditEntry, 'id' | 'timestamp'>;

const MAX_ENTRIES = 200;
const logs: AiAuditEntry[] = [];

export function logAiCall(entry: AiAuditInput): AiAuditEntry {
  const full: AiAuditEntry = {
    ...entry,
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
  };

  logs.push(full);

  if (logs.length > MAX_ENTRIES) {
    logs.splice(0, logs.length - MAX_ENTRIES);
  }

  if (process.env.NODE_ENV === 'development') {
    const status = full.success ? 'OK' : 'FAIL';
    const detail = full.error ? ` — ${full.error}` : '';
    console.info(
      `[AI-AUDIT] ${status} ${full.intent} via ${full.provider}/${full.model} (${full.latencyMs}ms)${detail}`,
    );
  }

  return full;
}

export function getRecentLogs(limit = 50): AiAuditEntry[] {
  return logs.slice(-limit);
}

export function clearLogs(): void {
  logs.length = 0;
}

export function measureAiCall(
  intent: string,
  provider: string,
  model: string,
  extra?: { aoId?: string; sectionId?: string },
): { finish: (result: { success: boolean; error?: string; tokens?: { prompt: number; completion: number } }) => AiAuditEntry } {
  const start = Date.now();
  return {
    finish(result) {
      return logAiCall({
        intent,
        provider,
        model,
        latencyMs: Date.now() - start,
        success: result.success,
        error: result.error,
        tokens: result.tokens,
        aoId: extra?.aoId,
        sectionId: extra?.sectionId,
      });
    },
  };
}
