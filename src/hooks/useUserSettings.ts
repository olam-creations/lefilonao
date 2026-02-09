'use client';

import { useState, useEffect } from 'react';
import { getTokenPayload } from '@/lib/auth';

export interface UserSettings {
  user_email: string;
  display_name: string;
  default_cpv: string[];
  default_regions: string[];
  default_keywords: string[];
  amount_min: number;
  amount_max: number;
  plan: string;
  created_at: string | null;
}

export function useUserSettings(): { settings: UserSettings | null; loading: boolean } {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const email = getTokenPayload()?.email;
    if (!email) {
      setLoading(false);
      return;
    }

    fetch(`/api/settings?email=${encodeURIComponent(email)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (json?.settings) setSettings(json.settings);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return { settings, loading };
}
