'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Plus, Trash2, ToggleLeft, ToggleRight, Clock, ExternalLink, AlertCircle, X, Eye } from 'lucide-react';
import { isAuthenticated, getTokenPayload } from '@/lib/auth';
import Header from '@/components/Header';
import { stagger, fadeUp } from '@/lib/motion-variants';
import { CPV_SECTORS, REGIONS } from '@/components/market/types';
import { formatAmount, formatDate } from '@/components/market/utils';

interface UserAlert {
  id: string;
  user_email: string;
  label: string;
  cpv_sectors: string[];
  regions: string[];
  keywords: string[];
  amount_min: number;
  amount_max: number;
  notify_email: boolean;
  notify_inapp: boolean;
  active: boolean;
  created_at: string;
}

interface AlertMatch {
  id: string;
  alertId: string;
  alertLabel: string;
  matchedAt: string;
  seen: boolean;
  notice: {
    id: string;
    title: string;
    buyerName: string;
    deadline: string | null;
    dceUrl: string;
    region: string;
    estimatedAmount: number;
    cpvSector: string;
  } | null;
}

const EMPTY_FORM = {
  label: '',
  cpv_sectors: [] as string[],
  regions: [] as string[],
  keywords: '',
  amount_min: 0,
  amount_max: 0,
  notify_email: true,
  notify_inapp: true,
};

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<UserAlert[]>([]);
  const [matches, setMatches] = useState<AlertMatch[]>([]);
  const [unseenCount, setUnseenCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'alerts' | 'matches'>('alerts');

  const email = getTokenPayload()?.email ?? '';

  useEffect(() => {
    if (!isAuthenticated()) {
      window.location.href = '/login';
    }
  }, []);

  const fetchAlerts = useCallback(async () => {
    if (!email) return;
    try {
      const res = await fetch(`/api/alerts?email=${encodeURIComponent(email)}`);
      if (res.ok) {
        const json = await res.json();
        setAlerts(json.alerts ?? []);
      }
    } catch {}
  }, [email]);

  const fetchMatches = useCallback(async () => {
    if (!email) return;
    try {
      const res = await fetch(`/api/alerts/matches?email=${encodeURIComponent(email)}&limit=50`);
      if (res.ok) {
        const json = await res.json();
        setMatches(json.matches ?? []);
        setUnseenCount(json.unseenCount ?? 0);
      }
    } catch {}
  }, [email]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await Promise.all([fetchAlerts(), fetchMatches()]);
      setLoading(false);
    };
    load();
  }, [fetchAlerts, fetchMatches]);

  const handleCreateAlert = async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_email: email,
          label: form.label || 'Nouvelle alerte',
          cpv_sectors: form.cpv_sectors,
          regions: form.regions,
          keywords: form.keywords ? form.keywords.split(',').map((k) => k.trim()).filter(Boolean) : [],
          amount_min: form.amount_min,
          amount_max: form.amount_max,
          notify_email: form.notify_email,
          notify_inapp: form.notify_inapp,
        }),
      });

      if (!res.ok) throw new Error('Erreur lors de la création');

      setForm({ ...EMPTY_FORM });
      setShowForm(false);
      await fetchAlerts();
    } catch {
      setError('Impossible de créer l\'alerte.');
    }
    setSaving(false);
  };

  const handleToggleAlert = async (id: string, active: boolean) => {
    await fetch('/api/alerts', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, active: !active }),
    });
    await fetchAlerts();
  };

  const handleDeleteAlert = async (id: string) => {
    await fetch(`/api/alerts?id=${id}`, { method: 'DELETE' });
    await fetchAlerts();
  };

  const handleMarkSeen = async (matchIds: string[]) => {
    await fetch('/api/alerts/matches', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: matchIds, seen: true }),
    });
    await fetchMatches();
  };

  const toggleCpv = (code: string) => {
    setForm((prev) => ({
      ...prev,
      cpv_sectors: prev.cpv_sectors.includes(code)
        ? prev.cpv_sectors.filter((c) => c !== code)
        : [...prev.cpv_sectors, code],
    }));
  };

  const toggleRegion = (r: string) => {
    setForm((prev) => ({
      ...prev,
      regions: prev.regions.includes(r)
        ? prev.regions.filter((x) => x !== r)
        : [...prev.regions, r],
    }));
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Header variant="dashboard" activePage="alerts" />

      <div className="max-w-5xl mx-auto p-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Alertes</h1>
            <p className="text-slate-500">Recevez une notification quand un marché correspond à vos critères.</p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="btn-primary text-sm py-2.5 px-4"
          >
            <Plus className="w-4 h-4" /> Créer une alerte
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-slate-100 rounded-xl mb-6 w-fit">
          <button
            onClick={() => setActiveTab('alerts')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'alerts' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Mes alertes ({alerts.length})
          </button>
          <button
            onClick={() => setActiveTab('matches')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all relative ${
              activeTab === 'matches' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Résultats
            {unseenCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-indigo-600 text-white text-[10px] font-bold flex items-center justify-center">
                {unseenCount > 9 ? '9+' : unseenCount}
              </span>
            )}
          </button>
        </div>

        {error && (
          <div className="flex items-center gap-3 p-4 mb-6 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        {/* Create Alert Form */}
        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden mb-6"
            >
              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-slate-900">Nouvelle alerte</h2>
                  <button onClick={() => setShowForm(false)} className="p-1 rounded-lg hover:bg-slate-100">
                    <X className="w-4 h-4 text-slate-400" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-slate-700 mb-1 block">Nom de l'alerte</label>
                    <input
                      type="text"
                      value={form.label}
                      onChange={(e) => setForm({ ...form, label: e.target.value })}
                      placeholder="Ex: Marchés IT Île-de-France"
                      className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-slate-700 mb-2 block">Secteurs CPV</label>
                    <div className="flex flex-wrap gap-2">
                      {CPV_SECTORS.map((s) => (
                        <button
                          key={s.code}
                          onClick={() => toggleCpv(s.code)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                            form.cpv_sectors.includes(s.code)
                              ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
                              : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                          }`}
                        >
                          {s.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-slate-700 mb-2 block">Régions</label>
                    <div className="flex flex-wrap gap-2">
                      {REGIONS.map((r) => (
                        <button
                          key={r}
                          onClick={() => toggleRegion(r)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                            form.regions.includes(r)
                              ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
                              : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                          }`}
                        >
                          {r}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-slate-700 mb-1 block">Mots-clés (séparés par virgule)</label>
                    <input
                      type="text"
                      value={form.keywords}
                      onChange={(e) => setForm({ ...form, keywords: e.target.value })}
                      placeholder="Ex: logiciel, développement, web"
                      className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-slate-700 mb-1 block">Montant min (EUR)</label>
                      <input
                        type="number"
                        value={form.amount_min || ''}
                        onChange={(e) => setForm({ ...form, amount_min: Number(e.target.value) || 0 })}
                        placeholder="0"
                        className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-slate-700 mb-1 block">Montant max (EUR)</label>
                      <input
                        type="number"
                        value={form.amount_max || ''}
                        onChange={(e) => setForm({ ...form, amount_max: Number(e.target.value) || 0 })}
                        placeholder="Pas de max"
                        className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.notify_email}
                        onChange={(e) => setForm({ ...form, notify_email: e.target.checked })}
                        className="w-4 h-4 rounded border-slate-300 text-indigo-600"
                      />
                      <span className="text-sm text-slate-700">Notification email</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.notify_inapp}
                        onChange={(e) => setForm({ ...form, notify_inapp: e.target.checked })}
                        className="w-4 h-4 rounded border-slate-300 text-indigo-600"
                      />
                      <span className="text-sm text-slate-700">Notification in-app</span>
                    </label>
                  </div>

                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      onClick={() => setShowForm(false)}
                      className="px-4 py-2 rounded-lg border border-slate-200 text-sm text-slate-600 hover:bg-slate-50"
                    >
                      Annuler
                    </button>
                    <button
                      onClick={handleCreateAlert}
                      disabled={saving}
                      className="btn-primary text-sm py-2 px-4 disabled:opacity-50"
                    >
                      {saving ? 'Création...' : 'Créer l\'alerte'}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-white rounded-xl border border-slate-200 p-5 animate-pulse">
                <div className="h-5 bg-slate-200 rounded w-1/2 mb-3" />
                <div className="h-4 bg-slate-100 rounded w-1/3" />
              </div>
            ))}
          </div>
        ) : activeTab === 'alerts' ? (
          /* Alerts list */
          <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-4">
            {alerts.map((alert) => (
              <motion.div
                key={alert.id}
                variants={fadeUp}
                className="bg-white rounded-xl border border-slate-200 p-5"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Bell className={`w-4 h-4 ${alert.active ? 'text-indigo-500' : 'text-slate-300'}`} />
                      <h3 className="text-sm font-semibold text-slate-900">{alert.label || 'Alerte sans nom'}</h3>
                      {!alert.active && (
                        <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">Inactive</span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs text-slate-500">
                      {alert.cpv_sectors.length > 0 && (
                        <span>CPV: {alert.cpv_sectors.map((c) => CPV_SECTORS.find((s) => s.code === c)?.name ?? c).join(', ')}</span>
                      )}
                      {alert.regions.length > 0 && (
                        <span className="text-slate-300">|</span>
                      )}
                      {alert.regions.length > 0 && (
                        <span>{alert.regions.join(', ')}</span>
                      )}
                      {alert.keywords.length > 0 && (
                        <>
                          <span className="text-slate-300">|</span>
                          <span>Mots-clés: {alert.keywords.join(', ')}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleAlert(alert.id, alert.active)}
                      className="p-2 rounded-lg hover:bg-slate-50"
                      title={alert.active ? 'Désactiver' : 'Activer'}
                    >
                      {alert.active ? (
                        <ToggleRight className="w-5 h-5 text-indigo-500" />
                      ) : (
                        <ToggleLeft className="w-5 h-5 text-slate-300" />
                      )}
                    </button>
                    <button
                      onClick={() => handleDeleteAlert(alert.id)}
                      className="p-2 rounded-lg hover:bg-red-50 group"
                      title="Supprimer"
                    >
                      <Trash2 className="w-4 h-4 text-slate-300 group-hover:text-red-500" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}

            {alerts.length === 0 && (
              <div className="text-center py-12 text-slate-400">
                <Bell className="w-8 h-8 mx-auto mb-3 opacity-50" />
                <p>Aucune alerte configurée.</p>
                <button
                  onClick={() => setShowForm(true)}
                  className="mt-3 text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                >
                  Créer votre première alerte
                </button>
              </div>
            )}
          </motion.div>
        ) : (
          /* Matches list */
          <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-4">
            {unseenCount > 0 && (
              <div className="flex justify-end">
                <button
                  onClick={() => handleMarkSeen(matches.filter((m) => !m.seen).map((m) => m.id))}
                  className="text-xs text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1"
                >
                  <Eye className="w-3 h-3" /> Tout marquer comme lu
                </button>
              </div>
            )}

            {matches.map((match) => (
              <motion.div
                key={match.id}
                variants={fadeUp}
                className={`bg-white rounded-xl border p-5 transition-all ${
                  match.seen ? 'border-slate-200' : 'border-indigo-200 bg-indigo-50/30'
                }`}
              >
                {match.notice ? (
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs text-indigo-600 font-medium">{match.alertLabel}</span>
                        {!match.seen && (
                          <span className="w-2 h-2 rounded-full bg-indigo-500" />
                        )}
                      </div>
                      <h3 className="text-sm font-semibold text-slate-900 mb-1 line-clamp-2">
                        {match.notice.title}
                      </h3>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                        <span>{match.notice.buyerName}</span>
                        {match.notice.region && (
                          <>
                            <span className="text-slate-300">|</span>
                            <span>{match.notice.region}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2 flex-shrink-0">
                      {match.notice.estimatedAmount > 0 && (
                        <span className="text-sm font-semibold text-slate-900">
                          {formatAmount(match.notice.estimatedAmount)}
                        </span>
                      )}
                      {match.notice.deadline && (
                        <span className="flex items-center gap-1 text-xs text-slate-500">
                          <Clock className="w-3 h-3" />
                          {formatDate(match.notice.deadline)}
                        </span>
                      )}
                      {match.notice.dceUrl && (
                        <a
                          href={match.notice.dceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
                        >
                          DCE <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-slate-400">Avis non disponible</div>
                )}
              </motion.div>
            ))}

            {matches.length === 0 && (
              <div className="text-center py-12 text-slate-400">
                <Bell className="w-8 h-8 mx-auto mb-3 opacity-50" />
                <p>Aucun résultat pour le moment.</p>
                <p className="text-xs mt-1">Les résultats apparaissent après le prochain scan BOAMP.</p>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}
