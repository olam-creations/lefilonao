'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { Search, Filter, Clock, ExternalLink, AlertCircle, ChevronLeft, ChevronRight, Zap, Sparkles } from 'lucide-react';
import { isAuthenticated } from '@/lib/auth';
import Header from '@/components/Header';
import { stagger, fadeUp } from '@/lib/motion-variants';
import { CPV_SECTORS, REGIONS } from '@/components/market/types';
import { formatAmount, formatDate } from '@/components/market/utils';
import { useUserSettings } from '@/hooks/useUserSettings';

interface Opportunity {
  id: string;
  title: string;
  buyerName: string;
  buyerSiret: string;
  cpvCode: string;
  cpvSector: string;
  deadline: string | null;
  publicationDate: string | null;
  dceUrl: string;
  region: string;
  nature: string;
  procedureType: string;
  lotsCount: number;
  estimatedAmount: number;
  description: string;
  source: string;
  isNew: boolean;
  isUrgent: boolean;
  daysLeft: number | null;
}

interface Stats {
  totalOpen: number;
  urgentCount: number;
  bySector: { code: string; name: string; count: number }[];
}

export default function OpportunitiesPage() {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [cpv, setCpv] = useState('');
  const [region, setRegion] = useState('');
  const [deadlineDays, setDeadlineDays] = useState(0);
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 20;

  const { settings } = useUserSettings();
  const filtersInitialized = useRef(false);

  useEffect(() => {
    if (!isAuthenticated()) {
      window.location.href = '/login';
    }
  }, []);

  // Initialize filters from user settings (once)
  useEffect(() => {
    if (!settings || filtersInitialized.current) return;
    filtersInitialized.current = true;

    if (!cpv && settings.default_cpv.length > 0) {
      setCpv(settings.default_cpv[0]);
    }
    if (!region && settings.default_regions.length > 0) {
      setRegion(settings.default_regions[0]);
    }
  }, [settings, cpv, region]);

  // Fetch stats once
  useEffect(() => {
    fetch('/api/opportunities/stats')
      .then((r) => r.ok ? r.json() : null)
      .then((json) => { if (json?.stats) setStats(json.stats); })
      .catch(() => {});
  }, []);

  // Fetch opportunities on filter change
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (cpv) params.set('cpv', cpv);
      if (region) params.set('region', region);
      if (deadlineDays > 0) params.set('deadline_days', String(deadlineDays));
      if (search) params.set('search', search);
      params.set('limit', String(PAGE_SIZE));
      params.set('offset', String(page * PAGE_SIZE));

      try {
        const res = await fetch(`/api/opportunities?${params}`);
        if (!res.ok) throw new Error('Erreur serveur');
        const json = await res.json();
        setOpportunities(json.opportunities ?? []);
        setTotal(json.total ?? 0);
      } catch {
        setError('Impossible de charger les opportunités.');
      }

      setLoading(false);
    };

    const timer = setTimeout(fetchData, search ? 300 : 0);
    return () => clearTimeout(timer);
  }, [cpv, region, deadlineDays, search, page]);

  const handleCpvChange = useCallback((code: string) => {
    setCpv((prev) => prev === code ? '' : code);
    setPage(0);
  }, []);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="min-h-screen bg-slate-50">
      <Header variant="dashboard" activePage="opportunities" />

      <div className="max-w-7xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Opportunités</h1>
          <p className="text-slate-500">Avis de marchés ouverts — trouvez vos prochains appels d'offres.</p>
        </div>

        {/* Stats cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <div className="text-sm text-slate-500 mb-1">Marchés ouverts</div>
              <div className="text-2xl font-bold text-slate-900">{stats.totalOpen}</div>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <div className="text-sm text-slate-500 mb-1">Deadline &lt; 7j</div>
              <div className="text-2xl font-bold text-amber-600">{stats.urgentCount}</div>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-4 col-span-2 md:col-span-1">
              <div className="text-sm text-slate-500 mb-1">Top secteur</div>
              <div className="text-lg font-semibold text-slate-900">
                {stats.bySector[0]?.name ?? '—'} ({stats.bySector[0]?.count ?? 0})
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 mb-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(0); }}
                placeholder="Rechercher par titre..."
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 text-sm focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 outline-none"
              />
            </div>
            <select
              value={region}
              onChange={(e) => { setRegion(e.target.value); setPage(0); }}
              className="px-3 py-2.5 rounded-lg border border-slate-200 text-sm bg-white"
            >
              <option value="">Toutes régions</option>
              {REGIONS.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
            <select
              value={deadlineDays}
              onChange={(e) => { setDeadlineDays(Number(e.target.value)); setPage(0); }}
              className="px-3 py-2.5 rounded-lg border border-slate-200 text-sm bg-white"
            >
              <option value={0}>Toutes deadlines</option>
              <option value={7}>7 jours</option>
              <option value={14}>14 jours</option>
              <option value={30}>30 jours</option>
              <option value={60}>60 jours</option>
            </select>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handleCpvChange('')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                !cpv ? 'bg-indigo-50 border-indigo-300 text-indigo-700' : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
              }`}
            >
              Tous secteurs
            </button>
            {CPV_SECTORS.map((s) => (
              <button
                key={s.code}
                onClick={() => handleCpvChange(s.code)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                  cpv === s.code ? 'bg-indigo-50 border-indigo-300 text-indigo-700' : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                }`}
              >
                {s.name}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-3 p-4 mb-6 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        {/* Results */}
        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="bg-white rounded-xl border border-slate-200 p-5 animate-pulse">
                <div className="h-5 bg-slate-200 rounded w-3/4 mb-3" />
                <div className="h-4 bg-slate-100 rounded w-1/2 mb-2" />
                <div className="h-4 bg-slate-100 rounded w-1/3" />
              </div>
            ))}
          </div>
        ) : (
          <>
            <div className="text-sm text-slate-500 mb-4">
              {total} opportunité{total !== 1 ? 's' : ''} trouvée{total !== 1 ? 's' : ''}
            </div>

            <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-4">
              {opportunities.map((opp) => (
                <motion.div
                  key={opp.id}
                  variants={fadeUp}
                  className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        {opp.isNew && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                            <Sparkles className="w-3 h-3" /> Nouveau
                          </span>
                        )}
                        {opp.isUrgent && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
                            <Zap className="w-3 h-3" /> Urgent
                          </span>
                        )}
                        {opp.source && (
                          <span className="text-xs text-slate-400 uppercase">{opp.source}</span>
                        )}
                      </div>

                      <h3 className="text-sm font-semibold text-slate-900 mb-1 line-clamp-2">{opp.title}</h3>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mb-2">
                        <span>{opp.buyerName}</span>
                        {opp.region && <span className="text-slate-300">|</span>}
                        {opp.region && <span>{opp.region}</span>}
                        {opp.nature && <span className="text-slate-300">|</span>}
                        {opp.nature && <span>{opp.nature}</span>}
                        {opp.lotsCount > 1 && (
                          <>
                            <span className="text-slate-300">|</span>
                            <span>{opp.lotsCount} lots</span>
                          </>
                        )}
                      </div>

                      {opp.description && (
                        <p className="text-xs text-slate-400 line-clamp-2 mb-2">{opp.description}</p>
                      )}
                    </div>

                    <div className="flex flex-col items-end gap-2 flex-shrink-0">
                      {opp.estimatedAmount > 0 && (
                        <div className="text-sm font-semibold text-slate-900">
                          {formatAmount(opp.estimatedAmount)}
                        </div>
                      )}

                      {opp.deadline && (
                        <div className="flex items-center gap-1 text-xs text-slate-500">
                          <Clock className="w-3 h-3" />
                          <span>{formatDate(opp.deadline)}</span>
                          {opp.daysLeft !== null && (
                            <span className={`font-medium ${opp.daysLeft <= 7 ? 'text-amber-600' : 'text-slate-600'}`}>
                              ({opp.daysLeft}j)
                            </span>
                          )}
                        </div>
                      )}

                      {opp.dceUrl && (
                        <a
                          href={opp.dceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors"
                        >
                          DCE <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}

              {opportunities.length === 0 && !loading && (
                <div className="text-center py-12 text-slate-400">
                  <Filter className="w-8 h-8 mx-auto mb-3 opacity-50" />
                  <p>Aucune opportunité trouvée avec ces filtres.</p>
                </div>
              )}
            </motion.div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-3 mt-8">
                <button
                  onClick={() => setPage(Math.max(0, page - 1))}
                  disabled={page === 0}
                  className="p-2 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-sm text-slate-500">
                  Page {page + 1} / {totalPages}
                </span>
                <button
                  onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                  disabled={page >= totalPages - 1}
                  className="p-2 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
