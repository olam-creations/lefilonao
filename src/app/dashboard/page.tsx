'use client';

import { useState, useEffect, useCallback } from 'react';
import { ArrowRight, Download, TrendingUp, Clock, Building2, LogOut, Activity, Target, BarChart3, Search } from 'lucide-react';
import Link from 'next/link';
import { clearToken, isAuthenticated, markOnboardingStep } from '@/lib/auth';
import { api } from '@/lib/api';
import { computeTrialStatus, type TrialInfo } from '@/lib/trial';
import { isDevMode, MOCK_RFPS } from '@/lib/dev';
import TrialBanner from '@/components/TrialBanner';
import OnboardingChecklist from '@/components/OnboardingChecklist';

interface RFP {
  id: string;
  title: string;
  issuer: string;
  deadline: string | null;
  score: number;
  scoreLabel: 'GO' | 'MAYBE' | 'PASS';
  budget: string | null;
  region: string | null;
  source: string;
  url: string;
  publishedAt: string;
}

function ScoreBadge({ score, label }: { score: number; label: 'GO' | 'MAYBE' | 'PASS' }) {
  const config = {
    GO: 'badge-go glow-emerald',
    MAYBE: 'badge-maybe glow-amber',
    PASS: 'badge-pass',
  }[label];
  return (
    <span className={config}>
      {score}/100 &middot; {label}
    </span>
  );
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return 'Non spécifié';
  return new Date(dateStr).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
}

function daysUntil(dateStr: string | null): number | null {
  if (!dateStr) return null;
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

function sanitizeCsvCell(value: string): string {
  const escaped = value.replace(/"/g, '""');
  if (/^[=+\-@\t\r]/.test(escaped)) return `'${escaped}`;
  return escaped;
}

function StatCard({ label, value, sub, icon, accent }: {
  label: string; value: string | number; sub: string; icon: React.ReactNode; accent?: string;
}) {
  return (
    <div className="bg-white rounded-xl p-6 border border-slate-200 hover:shadow-md transition-all group relative overflow-hidden">
      <div className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r ${
        accent === 'text-emerald-600' ? 'from-emerald-400 to-emerald-500' :
        accent === 'text-indigo-600' ? 'from-indigo-400 to-violet-500' :
        'from-slate-300 to-slate-400'
      }`} />
      <div className="flex items-start justify-between mb-3">
        <span className="text-xs text-slate-400 uppercase tracking-wider font-medium">{label}</span>
        <div className="text-slate-400 group-hover:text-indigo-500 transition-colors">{icon}</div>
      </div>
      <div className={`text-3xl font-bold ${accent || 'text-slate-900'}`}>{value}</div>
      <div className="text-slate-400 text-sm mt-1">{sub}</div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="bg-white rounded-xl p-6 border border-slate-200">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex gap-2 mb-3">
            <div className="skeleton w-20 h-6 rounded-full" />
            <div className="skeleton w-16 h-6 rounded-md" />
          </div>
          <div className="skeleton w-3/4 h-5 mb-3 rounded" />
          <div className="flex gap-4">
            <div className="skeleton w-32 h-4 rounded" />
            <div className="skeleton w-24 h-4 rounded" />
          </div>
        </div>
        <div className="skeleton w-24 h-9 rounded-xl" />
      </div>
    </div>
  );
}

const FILTER_OPTIONS = [
  { key: 'all' as const, label: 'Tous' },
  { key: 'go' as const, label: 'GO uniquement' },
  { key: 'maybe' as const, label: 'GO + À étudier' },
] as const;

export default function DashboardPage() {
  const [rfps, setRfps] = useState<RFP[]>([]);
  const [filter, setFilter] = useState<'all' | 'go' | 'maybe'>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [trial, setTrial] = useState<TrialInfo | null>(null);
  const [onboardingKey, setOnboardingKey] = useState(0);

  useEffect(() => {
    if (!isAuthenticated()) {
      window.location.href = '/login';
      return;
    }

    const fetchData = async () => {
      try {
        const res = await api.dashboard();
        if (!res.ok) throw new Error('API error');
        const data = await res.json();
        setRfps(data.rfps || []);
        setTrial(computeTrialStatus(data.trial));
      } catch {
        // In dev mode, use mock data instead of showing error
        if (isDevMode()) {
          setRfps(MOCK_RFPS);
          setTrial(computeTrialStatus());
        } else {
          setError('Impossible de charger les données. Réessayez plus tard.');
        }
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleLogout = useCallback(() => {
    clearToken();
    window.location.href = '/';
  }, []);

  const handleExploreRfp = useCallback(() => {
    markOnboardingStep('explore');
    setOnboardingKey((k) => k + 1);
  }, []);

  const exportCSV = useCallback(() => {
    const headers = ['Titre', 'Emetteur', 'Score', 'Budget', 'Deadline', 'Region', 'URL'];
    const filtered = rfps.filter((rfp) => {
      if (filter === 'go') return rfp.scoreLabel === 'GO';
      if (filter === 'maybe') return rfp.scoreLabel === 'MAYBE' || rfp.scoreLabel === 'GO';
      return true;
    });
    const rows = filtered.map((r) => [
      sanitizeCsvCell(r.title), sanitizeCsvCell(r.issuer), `${r.score}/100`,
      sanitizeCsvCell(r.budget || ''), r.deadline || '', sanitizeCsvCell(r.region || ''), sanitizeCsvCell(r.url),
    ]);
    const csv = [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `lefilonao-export-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);

    markOnboardingStep('export');
    setOnboardingKey((k) => k + 1);
  }, [rfps, filter]);

  const filteredRfps = rfps.filter((rfp) => {
    if (filter === 'go') return rfp.scoreLabel === 'GO';
    if (filter === 'maybe') return rfp.scoreLabel === 'MAYBE' || rfp.scoreLabel === 'GO';
    return true;
  });

  const stats = {
    total: rfps.length,
    go: rfps.filter((r) => r.scoreLabel === 'GO').length,
    avgScore: rfps.length > 0 ? Math.round(rfps.reduce((acc, r) => acc + r.score, 0) / rfps.length) : 0,
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <header className="glass">
          <div className="max-w-7xl mx-auto px-6 h-16 flex items-center">
            <span className="text-lg font-semibold text-slate-900">
              Le Filon <span className="gradient-text">AO</span>
            </span>
          </div>
        </header>
        <div className="max-w-7xl mx-auto p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            {[0, 1, 2].map((i) => (
              <div key={i} className="bg-white rounded-xl p-6 border border-slate-200">
                <div className="skeleton w-24 h-3 mb-3 rounded" />
                <div className="skeleton w-16 h-8 rounded" />
              </div>
            ))}
          </div>
          <div className="space-y-3">
            {[0, 1, 2].map((i) => <SkeletonCard key={i} />)}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50">
        <div className="text-center">
          <p className="text-red-600 text-lg mb-6">{error}</p>
          <button onClick={() => window.location.reload()} className="btn-primary">
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="glass">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="text-lg font-semibold text-slate-900">
            Le Filon <span className="gradient-text">AO</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard/market"
              className="text-sm text-slate-500 hover:text-slate-900 transition-colors hidden md:block"
            >
              Intelligence
            </Link>
            <button
              onClick={handleLogout}
              className="p-2 rounded-lg hover:bg-slate-100 transition-colors group"
              title="Se déconnecter"
            >
              <LogOut className="w-4 h-4 text-slate-400 group-hover:text-red-500 transition-colors" />
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-6">
        {/* Trial Banner */}
        <TrialBanner trial={trial} />

        {/* Onboarding Checklist */}
        <OnboardingChecklist key={onboardingKey} />

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <StatCard label="Appels d'offres" value={stats.total} sub="cette semaine" icon={<Activity className="w-4 h-4" />} />
          <StatCard label="Opportunités GO" value={stats.go} sub="score >=70" icon={<Target className="w-4 h-4" />} accent="text-emerald-600" />
          <StatCard label="Score moyen" value={stats.avgScore} sub="sur 100" icon={<BarChart3 className="w-4 h-4" />} accent="text-indigo-600" />
        </div>

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div className="flex gap-1 bg-slate-100 p-1 rounded-xl">
            {FILTER_OPTIONS.map((btn) => (
              <button
                key={btn.key}
                onClick={() => setFilter(btn.key)}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                  filter === btn.key
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {btn.key === 'all' ? `${btn.label} (${rfps.length})` : btn.label}
              </button>
            ))}
          </div>
          <button onClick={exportCSV} className="btn-secondary text-sm py-2 px-4">
            <Download className="w-3.5 h-3.5" /> Export CSV
          </button>
        </div>

        {/* RFP List */}
        <div className="space-y-3">
          {filteredRfps.map((rfp) => {
            const daysLeft = daysUntil(rfp.deadline);
            const isUrgent = daysLeft !== null && daysLeft <= 7;

            const leftBorderColor = {
              GO: 'border-l-emerald-500',
              MAYBE: 'border-l-amber-400',
              PASS: 'border-l-slate-300',
            }[rfp.scoreLabel];

            return (
              <div
                key={rfp.id}
                className={`bg-white rounded-xl p-6 border border-slate-200 border-l-[3px] ${leftBorderColor} transition-all hover:shadow-md hover:border-slate-300 ${
                  isUrgent ? 'ring-1 ring-red-100' : ''
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2.5 mb-3 flex-wrap">
                      <ScoreBadge score={rfp.score} label={rfp.scoreLabel} />
                      <span className="font-mono text-xs text-slate-400 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-100">
                        {rfp.source}
                      </span>
                      {isUrgent && daysLeft !== null && (
                        <span className="text-xs text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-md font-medium">
                          {daysLeft}j restants
                        </span>
                      )}
                    </div>
                    <h3 className="text-base font-semibold text-slate-900 mb-3 leading-snug">{rfp.title}</h3>
                    <div className="flex flex-wrap gap-4 text-sm text-slate-500">
                      <div className="flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5" /> {rfp.issuer}
                      </div>
                      {rfp.budget && (
                        <div className="flex items-center gap-1.5">
                          <TrendingUp className="w-3.5 h-3.5" /> {rfp.budget}
                        </div>
                      )}
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" /> {formatDate(rfp.deadline)}
                      </div>
                      {rfp.region && <span className="text-slate-400">{rfp.region}</span>}
                    </div>
                  </div>
                  <Link
                    href={`/dashboard/ao/${rfp.id}`}
                    className="btn-primary text-sm py-2 px-4 flex-shrink-0"
                    onClick={handleExploreRfp}
                  >
                    Voir l&apos;AO <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

        {/* Empty states */}
        {rfps.length === 0 && (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-gradient-to-br from-indigo-100 to-violet-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Search className="w-7 h-7 text-indigo-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Vos AO arrivent...</h3>
            <p className="text-slate-400 mb-6 max-w-sm mx-auto">
              Nos algorithmes scannent le BOAMP en continu. Vos premiers résultats apparaîtront sous peu.
            </p>
            <div className="space-y-3 max-w-lg mx-auto mb-8">
              {[0, 1, 2].map((i) => <SkeletonCard key={i} />)}
            </div>
            <Link href="/subscribe" className="btn-secondary text-sm py-2 px-4">
              Affiner mes critères
            </Link>
          </div>
        )}

        {rfps.length > 0 && filteredRfps.length === 0 && (
          <div className="text-center py-20">
            <p className="text-slate-400 mb-4">Aucun appel d&apos;offres ne correspond à ce filtre.</p>
            <button
              onClick={() => setFilter('all')}
              className="btn-secondary text-sm py-2 px-4"
            >
              Voir tous les AO
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
