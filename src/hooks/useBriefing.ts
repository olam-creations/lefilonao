import { useState, useEffect } from 'react';
import type { BriefingResponse } from '@/lib/briefing';

interface UseBriefingResult {
  briefing: BriefingResponse | null;
  loading: boolean;
  error: string | null;
}

export function useBriefing(): UseBriefingResult {
  const [briefing, setBriefing] = useState<BriefingResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchBriefing() {
      try {
        const res = await fetch('/api/briefing', { credentials: 'include' });
        if (!res.ok) {
          if (!cancelled) setError('Impossible de charger le briefing');
          return;
        }
        const data: BriefingResponse = await res.json();
        if (!cancelled) setBriefing(data);
      } catch {
        if (!cancelled) setError('Erreur réseau');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchBriefing();
    return () => { cancelled = true; };
  }, []);

  return { briefing, loading, error };
}
