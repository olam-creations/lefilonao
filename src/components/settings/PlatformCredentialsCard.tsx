'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { KeyRound, Plus, Trash2, Eye, EyeOff, Shield, Pencil } from 'lucide-react';
import { fadeUp } from '@/lib/motion-variants';

const PLATFORMS = [
  { value: 'place', label: 'PLACE (marches-publics.gouv.fr)' },
  { value: 'maximilien', label: 'Maximilien' },
  { value: 'atexo', label: 'Atexo (e-marchespublics, marches-securises)' },
  { value: 'agysoft', label: 'Agysoft (achatpublic, aws-achat)' },
  { value: 'generic', label: 'Autre plateforme' },
] as const;

interface Credential {
  id: string;
  platform: string;
  platform_url: string | null;
  username: string;
  created_at: string;
  updated_at: string;
}

interface Props {
  email: string;
}

export default function PlatformCredentialsCard({ email }: Props) {
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [editingPlatform, setEditingPlatform] = useState<string | null>(null);

  const [form, setForm] = useState({
    platform: 'place' as string,
    platform_url: '',
    username: '',
    password: '',
  });

  const fetchCredentials = useCallback(async () => {
    if (!email) return;
    try {
      const res = await fetch(`/api/settings/credentials?email=${encodeURIComponent(email)}`);
      const data = await res.json();
      if (data.credentials) setCredentials(data.credentials);
    } catch {
      setError('Erreur de chargement des identifiants');
    } finally {
      setLoading(false);
    }
  }, [email]);

  useEffect(() => {
    fetchCredentials();
  }, [fetchCredentials]);

  const handleSave = useCallback(async () => {
    if (!form.username.trim() || !form.password.trim()) {
      setError('Identifiant et mot de passe requis');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const res = await fetch('/api/settings/credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          platform: form.platform,
          platform_url: form.platform_url || undefined,
          username: form.username.trim(),
          password: form.password,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Erreur de sauvegarde');

      setShowForm(false);
      setEditingPlatform(null);
      setForm({ platform: 'place', platform_url: '', username: '', password: '' });
      setShowPassword(false);
      await fetchCredentials();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de sauvegarde');
    } finally {
      setSaving(false);
    }
  }, [email, form, fetchCredentials]);

  const handleDelete = useCallback(
    async (platform: string) => {
      if (!window.confirm('Supprimer cet identifiant ?')) return;
      setError(null);
      try {
        const res = await fetch(
          `/api/settings/credentials?email=${encodeURIComponent(email)}&platform=${encodeURIComponent(platform)}`,
          { method: 'DELETE' },
        );
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? 'Erreur de suppression');

        setCredentials((prev) => prev.filter((c) => c.platform !== platform));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur de suppression');
      }
    },
    [email],
  );

  const platformLabel = (value: string) =>
    PLATFORMS.find((p) => p.value === value)?.label ?? value;

  if (loading) {
    return (
      <motion.section variants={fadeUp} className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-center gap-2.5 mb-6">
          <KeyRound className="w-5 h-5 text-slate-600" />
          <h2 className="text-lg font-semibold text-slate-900">Identifiants plateformes</h2>
        </div>
        <div className="skeleton h-4 w-3/4 mb-2" />
        <div className="skeleton h-4 w-1/2" />
      </motion.section>
    );
  }

  return (
    <motion.section variants={fadeUp} className="bg-white rounded-xl border border-slate-200 p-6">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2.5">
          <KeyRound className="w-5 h-5 text-slate-600" />
          <h2 className="text-lg font-semibold text-slate-900">Identifiants plateformes</h2>
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            Ajouter
          </button>
        )}
      </div>
      <p className="text-sm text-slate-500 mb-6">Connectez vos comptes pour télécharger les DCE automatiquement</p>

      <div className="flex items-center gap-2 mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
        <Shield className="w-4 h-4 text-emerald-600 flex-shrink-0" />
        <p className="text-xs text-emerald-700">
          Vos identifiants sont chiffrés AES-256-GCM. Nous ne stockons jamais vos mots de passe en
          clair.
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
        </div>
      )}

      {credentials.length > 0 && (
        <div className="space-y-3 mb-4">
          {credentials.map((cred) => (
            <div
              key={cred.id}
              className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200"
            >
              <div>
                <p className="text-sm font-medium text-slate-900">{platformLabel(cred.platform)}</p>
                <p className="text-xs text-slate-500">
                  {cred.username} &middot; Mis à jour le{' '}
                  {new Date(cred.updated_at).toLocaleDateString('fr-FR')}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => {
                    setEditingPlatform(cred.platform);
                    setForm({
                      platform: cred.platform,
                      platform_url: cred.platform_url ?? '',
                      username: cred.username,
                      password: '',
                    });
                    setShowForm(true);
                    setShowPassword(false);
                  }}
                  className="inline-flex items-center gap-1 px-2 py-1 text-sm text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                  aria-label={`Modifier identifiant ${cred.platform}`}
                >
                  <Pencil className="w-3.5 h-3.5" />
                  Modifier
                </button>
                <button
                  onClick={() => handleDelete(cred.platform)}
                  className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  aria-label={`Supprimer identifiant ${cred.platform}`}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {credentials.length === 0 && !showForm && (
        <p className="text-sm text-slate-500 mb-4">
          Ajoutez vos identifiants pour télécharger automatiquement les DCE depuis les profils
          acheteurs sécurisés.
        </p>
      )}

      {showForm && (
        <div className="space-y-3 p-4 bg-slate-50 rounded-lg border border-slate-200">
          {editingPlatform && (
            <p className="text-sm font-medium text-indigo-700">
              Modifier le mot de passe — {platformLabel(editingPlatform)}
            </p>
          )}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Plateforme</label>
            <select
              value={form.platform}
              onChange={(e) => setForm((prev) => ({ ...prev, platform: e.target.value }))}
              disabled={editingPlatform !== null}
              className={`w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none ${editingPlatform !== null ? 'bg-slate-50 cursor-not-allowed' : ''}`}
            >
              {PLATFORMS.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>

          {form.platform === 'generic' && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                URL de la plateforme
              </label>
              <input
                type="url"
                value={form.platform_url}
                onChange={(e) => setForm((prev) => ({ ...prev, platform_url: e.target.value }))}
                placeholder="https://..."
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Identifiant</label>
            <input
              type="text"
              value={form.username}
              onChange={(e) => setForm((prev) => ({ ...prev, username: e.target.value }))}
              placeholder="Votre identifiant ou email"
              autoComplete="username"
              readOnly={editingPlatform !== null}
              className={`w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none ${editingPlatform !== null ? 'bg-slate-50 cursor-not-allowed' : ''}`}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Mot de passe</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={form.password}
                onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
                placeholder="Votre mot de passe"
                autoComplete="current-password"
                className="w-full px-3 py-2 pr-10 border border-slate-200 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600"
                aria-label={showPassword ? 'Masquer' : 'Afficher'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={handleSave}
              disabled={saving}
              className="btn-primary text-sm py-2 px-4 disabled:opacity-50"
            >
              {saving ? 'Sauvegarde...' : editingPlatform ? 'Mettre à jour' : 'Sauvegarder'}
            </button>
            <button
              onClick={() => {
                setShowForm(false);
                setEditingPlatform(null);
                setForm({ platform: 'place', platform_url: '', username: '', password: '' });
                setShowPassword(false);
              }}
              className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Annuler
            </button>
          </div>
        </div>
      )}
    </motion.section>
  );
}
