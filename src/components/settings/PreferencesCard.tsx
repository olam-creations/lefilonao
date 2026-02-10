'use client';

import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Radar, Save, X, Plus } from 'lucide-react';
import { fadeUp } from '@/lib/motion-variants';
import { CPV_SECTORS, REGIONS } from '@/components/market/types';
import type { UserSettings } from '@/hooks/useUserSettings';

interface Props {
  settings: UserSettings;
  onUpdate: (partial: Partial<UserSettings>) => void;
  onSave: () => Promise<void>;
  saving: boolean;
  saved: boolean;
}

export default function PreferencesCard({ settings, onUpdate, onSave, saving, saved }: Props) {
  const [keywordInput, setKeywordInput] = useState('');

  const toggleCpv = useCallback(
    (code: string) => {
      const next = settings.default_cpv.includes(code)
        ? settings.default_cpv.filter((c) => c !== code)
        : [...settings.default_cpv, code];
      onUpdate({ default_cpv: next });
    },
    [settings.default_cpv, onUpdate],
  );

  const toggleRegion = useCallback(
    (region: string) => {
      const next = settings.default_regions.includes(region)
        ? settings.default_regions.filter((r) => r !== region)
        : [...settings.default_regions, region];
      onUpdate({ default_regions: next });
    },
    [settings.default_regions, onUpdate],
  );

  const addKeyword = useCallback(() => {
    const trimmed = keywordInput.trim();
    if (!trimmed) return;

    const newKeywords = trimmed
      .split(',')
      .map((k) => k.trim())
      .filter((k) => k.length > 0 && !settings.default_keywords.includes(k));

    if (newKeywords.length > 0) {
      onUpdate({ default_keywords: [...settings.default_keywords, ...newKeywords] });
    }
    setKeywordInput('');
  }, [keywordInput, settings.default_keywords, onUpdate]);

  const removeKeyword = useCallback(
    (keyword: string) => {
      onUpdate({ default_keywords: settings.default_keywords.filter((k) => k !== keyword) });
    },
    [settings.default_keywords, onUpdate],
  );

  return (
    <motion.section variants={fadeUp} className="bg-white rounded-xl border border-slate-200 p-6">
      <div className="flex items-center gap-2.5 mb-1">
        <Radar className="w-5 h-5 text-slate-600" />
        <h2 className="text-lg font-semibold text-slate-900">Préférences de veille</h2>
      </div>
      <p className="text-sm text-slate-500 mb-6">
        Ces préférences sont utilisées par défaut pour vos alertes
      </p>

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
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Mots-clés par défaut
          </label>
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
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Montant min (EUR)
            </label>
            <input
              type="number"
              min={0}
              value={settings.amount_min || ''}
              onChange={(e) => onUpdate({ amount_min: Number(e.target.value) || 0 })}
              placeholder="0"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-shadow"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Montant max (EUR)
            </label>
            <input
              type="number"
              min={0}
              value={settings.amount_max || ''}
              onChange={(e) => onUpdate({ amount_max: Number(e.target.value) || 0 })}
              placeholder="Illimité"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-shadow"
            />
          </div>
        </div>

        {/* Save button */}
        <div className="flex items-center gap-3 pt-2">
          <button
            onClick={onSave}
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
  );
}
