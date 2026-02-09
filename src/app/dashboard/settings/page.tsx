'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Settings, User, Radar, CreditCard, Save, LogOut, X, Plus } from 'lucide-react';
import Header from '@/components/Header';
import { isAuthenticated, getTokenPayload, clearToken } from '@/lib/auth';
import { stagger, fadeUp } from '@/lib/motion-variants';
import { CPV_SECTORS, REGIONS } from '@/components/market/types';

interface UserSettings {
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
};

export default function SettingsPage() {
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [keywordInput, setKeywordInput] = useState('');

  useEffect(() => {
    if (!isAuthenticated()) {
      window.location.href = '/login';
      return;
    }

    const payload = getTokenPayload();
    const userEmail = payload?.email ?? '';
    setEmail(userEmail);

    if (!userEmail) {
      setLoading(false);
      return;
    }

    fetch(`/api/settings?email=${encodeURIComponent(userEmail)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.settings) {
          setSettings(data.settings);
        }
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Erreur de chargement'))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = useCallback(async () => {
    setSaving(true);
    setSaved(false);
    setError(null);

    try {
      const res = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          display_name: settings.display_name,
          default_cpv: settings.default_cpv,
          default_regions: settings.default_regions,
          default_keywords: settings.default_keywords,
          amount_min: settings.amount_min,
          amount_max: settings.amount_max,
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
  }, [email, settings]);

  const handleLogout = useCallback(() => {
    clearToken();
    window.location.href = '/';
  }, []);

  const toggleCpv = useCallback((code: string) => {
    setSettings((prev) => ({
      ...prev,
      default_cpv: prev.default_cpv.includes(code)
        ? prev.default_cpv.filter((c) => c !== code)
        : [...prev.default_cpv, code],
    }));
  }, []);

  const toggleRegion = useCallback((region: string) => {
    setSettings((prev) => ({
      ...prev,
      default_regions: prev.default_regions.includes(region)
        ? prev.default_regions.filter((r) => r !== region)
        : [...prev.default_regions, region],
    }));
  }, []);

  const addKeyword = useCallback(() => {
    const trimmed = keywordInput.trim();
    if (!trimmed) return;

    const newKeywords = trimmed
      .split(',')
      .map((k) => k.trim())
      .filter((k) => k.length > 0);

    setSettings((prev) => ({
      ...prev,
      default_keywords: [
        ...prev.default_keywords,
        ...newKeywords.filter((k) => !prev.default_keywords.includes(k)),
      ],
    }));
    setKeywordInput('');
  }, [keywordInput]);

  const removeKeyword = useCallback((keyword: string) => {
    setSettings((prev) => ({
      ...prev,
      default_keywords: prev.default_keywords.filter((k) => k !== keyword),
    }));
  }, []);

  const planLabel: Record<string, { label: string; color: string }> = {
    free: { label: 'Free', color: 'bg-slate-100 text-slate-700' },
    pro: { label: 'Pro', color: 'bg-indigo-100 text-indigo-700' },
    enterprise: { label: 'Enterprise', color: 'bg-amber-100 text-amber-700' },
  };

  const currentPlan = planLabel[settings.plan] ?? planLabel.free;

  if (loading) {
    return (
      <>
        <Header variant="dashboard" activePage="settings" />
        <main className="max-w-4xl mx-auto px-6 py-10">
          <div className="space-y-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-xl border border-slate-200 p-6">
                <div className="skeleton h-6 w-48 mb-4" />
                <div className="skeleton h-4 w-full mb-2" />
                <div className="skeleton h-4 w-3/4" />
              </div>
            ))}
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Header variant="dashboard" activePage="settings" />

      <main className="max-w-4xl mx-auto px-6 py-10">
        <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-8">
          {/* Page title */}
          <motion.div variants={fadeUp} className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-50 rounded-xl">
              <Settings className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Paramètres</h1>
              <p className="text-sm text-slate-500">Gérez votre compte et vos préférences</p>
            </div>
          </motion.div>

          {error && (
            <motion.div variants={fadeUp} className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm">
              {error}
            </motion.div>
          )}

          {/* Section 1: Mon compte */}
          <motion.section variants={fadeUp} className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex items-center gap-2.5 mb-6">
              <User className="w-5 h-5 text-slate-600" />
              <h2 className="text-lg font-semibold text-slate-900">Mon compte</h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  readOnly
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-500 text-sm cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nom affiché</label>
                <input
                  type="text"
                  value={settings.display_name}
                  onChange={(e) =>
                    setSettings((prev) => ({ ...prev, display_name: e.target.value }))
                  }
                  placeholder="Votre nom ou pseudo"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-shadow"
                />
              </div>

              <div className="pt-2">
                <button
                  onClick={handleLogout}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Se déconnecter
                </button>
              </div>
            </div>
          </motion.section>

          {/* Section 2: Préférences de veille */}
          <motion.section variants={fadeUp} className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex items-center gap-2.5 mb-6">
              <Radar className="w-5 h-5 text-slate-600" />
              <h2 className="text-lg font-semibold text-slate-900">Préférences de veille</h2>
            </div>

            <div className="space-y-6">
              {/* CPV Sectors */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Secteurs CPV</label>
                <div className="flex flex-wrap gap-2">
                  {CPV_SECTORS.map((sector) => {
                    const active = settings.default_cpv.includes(sector.code);
                    return (
                      <button
                        key={sector.code}
                        onClick={() => toggleCpv(sector.code)}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                          active
                            ? 'bg-indigo-100 text-indigo-700 ring-1 ring-indigo-300'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {sector.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Regions */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Régions</label>
                <div className="flex flex-wrap gap-2">
                  {REGIONS.map((region) => {
                    const active = settings.default_regions.includes(region);
                    return (
                      <button
                        key={region}
                        onClick={() => toggleRegion(region)}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                          active
                            ? 'bg-indigo-100 text-indigo-700 ring-1 ring-indigo-300'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {region}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Keywords */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Mots-clés par défaut</label>
                {settings.default_keywords.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {settings.default_keywords.map((kw) => (
                      <span
                        key={kw}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-sm"
                      >
                        {kw}
                        <button
                          onClick={() => removeKeyword(kw)}
                          className="p-0.5 hover:bg-indigo-100 rounded-full transition-colors"
                          aria-label={`Retirer ${kw}`}
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={keywordInput}
                    onChange={(e) => setKeywordInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addKeyword();
                      }
                    }}
                    placeholder="Ajouter des mots-clés (séparés par virgule)"
                    className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-shadow"
                  />
                  <button
                    onClick={addKeyword}
                    className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Ajouter
                  </button>
                </div>
              </div>

              {/* Amount range */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Montant min (EUR)</label>
                  <input
                    type="number"
                    min={0}
                    value={settings.amount_min || ''}
                    onChange={(e) =>
                      setSettings((prev) => ({
                        ...prev,
                        amount_min: Number(e.target.value) || 0,
                      }))
                    }
                    placeholder="0"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-shadow"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Montant max (EUR)</label>
                  <input
                    type="number"
                    min={0}
                    value={settings.amount_max || ''}
                    onChange={(e) =>
                      setSettings((prev) => ({
                        ...prev,
                        amount_max: Number(e.target.value) || 0,
                      }))
                    }
                    placeholder="Illimité"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-shadow"
                  />
                </div>
              </div>

              {/* Save button */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="btn-primary text-sm py-2 px-5 disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  {saving ? 'Sauvegarde...' : 'Sauvegarder'}
                </button>
                {saved && (
                  <span className="text-sm text-emerald-600 font-medium">
                    Préférences sauvegardées
                  </span>
                )}
              </div>
            </div>
          </motion.section>

          {/* Section 3: Abonnement */}
          <motion.section variants={fadeUp} className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex items-center gap-2.5 mb-6">
              <CreditCard className="w-5 h-5 text-slate-600" />
              <h2 className="text-lg font-semibold text-slate-900">Abonnement</h2>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <span className="text-sm text-slate-600">Plan actuel :</span>
                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${currentPlan.color}`}>
                  {currentPlan.label}
                </span>
              </div>

              {settings.created_at && (
                <p className="text-sm text-slate-500">
                  Compte créé le{' '}
                  {new Date(settings.created_at).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </p>
              )}

              {settings.plan === 'free' && (
                <div className="pt-2">
                  <a
                    href="/pricing"
                    className="btn-primary text-sm py-2 px-5 inline-flex items-center gap-2"
                  >
                    Passer à Pro
                  </a>
                </div>
              )}
            </div>
          </motion.section>
        </motion.div>
      </main>
    </>
  );
}
