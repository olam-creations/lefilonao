'use client';

import { useState, useEffect, useCallback } from 'react';
import { useUser } from '@/components/UserProvider';

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
  notify_frequency: string;
  notify_email: boolean;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  stripe_status: string;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
}

const DEFAULT_SETTINGS: UserSettings = {
  user_email: '',
  display_name: '',
  default_cpv: [],
  default_regions: [],
  default_keywords: [],
  amount_min: 0,
  amount_max: 0,
  plan: 'free',
  created_at: null,
  notify_frequency: 'daily',
  notify_email: true,
  stripe_customer_id: null,
  stripe_subscription_id: null,
  stripe_status: 'none',
  current_period_end: null,
  cancel_at_period_end: false,
};

export interface UseUserSettingsReturn {
  settings: UserSettings;
  email: string;
  loading: boolean;
  saving: boolean;
  saved: boolean;
  error: string | null;
  updateSettings: (partial: Partial<UserSettings>) => void;
  saveSettings: () => Promise<void>;
}

export function useUserSettings(): UseUserSettingsReturn {
  const { email: userEmail } = useUser();
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userEmail) {
      setLoading(false);
      return;
    }

    fetch(`/api/settings?email=${encodeURIComponent(userEmail)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.settings) setSettings(data.settings);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Erreur de chargement'))
      .finally(() => setLoading(false));
  }, [userEmail]);

  const updateSettings = useCallback((partial: Partial<UserSettings>) => {
    setSettings((prev) => ({ ...prev, ...partial }));
  }, []);

  const saveSettings = useCallback(async () => {
    setSaving(true);
    setSaved(false);
    setError(null);

    try {
      const res = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: userEmail,
          display_name: settings.display_name,
          default_cpv: settings.default_cpv,
          default_regions: settings.default_regions,
          default_keywords: settings.default_keywords,
          amount_min: settings.amount_min,
          amount_max: settings.amount_max,
          notify_frequency: settings.notify_frequency,
          notify_email: settings.notify_email,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Erreur de sauvegarde');

      setSettings(data.settings);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de sauvegarde');
    } finally {
      setSaving(false);
    }
  }, [userEmail, settings]);

  return { settings, email: userEmail, loading, saving, saved, error, updateSettings, saveSettings };
}
