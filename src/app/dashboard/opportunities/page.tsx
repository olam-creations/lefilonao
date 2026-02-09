'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import {
  Search, Clock, ExternalLink, AlertCircle, ChevronLeft, ChevronRight,
  Zap, Sparkles, Briefcase, TrendingUp, X, ChevronDown, ArrowRight,
  SlidersHorizontal, Bell, Plus, Check, Loader2,
} from 'lucide-react';
import { isAuthenticated, getTokenPayload } from '@/lib/auth';
import Header from '@/components/Header';
import { stagger, fadeUp, expandCollapse } from '@/lib/motion-variants';
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
  newLast48h: number;
  avgAmount: number;
  bySector: { code: string; name: string; count: number }[];
}

type SortOption = 'deadline_asc' | 'date_desc' | 'amount_desc' | 'amount_asc';

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'deadline_asc', label: 'Deadline proche' },
  { value: 'date_desc', label: 'Plus récents' },
  { value: 'amount_desc', label: 'Montant décroissant' },
  { value: 'amount_asc', label: 'Montant croissant' },
];

export default function OpportunitiesPage() {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [cpv, setCpv] = useState('');
  const [region, setRegion] = useState('');
  const [deadlineDays, setDeadlineDays] = useState(0);
  const [sort, setSort] = useState<SortOption>('deadline_asc');
  const [amountMin, setAmountMin] = useState(0);
  const [amountMax, setAmountMax] = useState(0);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 20;

  const [importedIds, setImportedIds] = useState<Set<string>>(new Set());
  const [importingIds, setImportingIds] = useState<Set<string>>(new Set());

  const searchRef = useRef<HTMLInputElement>(null);
  const { settings } = useUserSettings();
  const filtersInitialized = useRef(false);

  useEffect(() => {
    if (!isAuthenticated()) {
      window.location.href = '/login';
    }
  }, []);

  // Load already-imported RFP IDs
  useEffect(() => {
    const email = getTokenPayload()?.email;
    if (!email) return;
    fetch(`/api/rfps?email=${encodeURIComponent(email)}`)
      .then((r) => r.ok ? r.json() : null)
      .then((json) => {
        if (json?.rfps) {
          setImportedIds(new Set(json.rfps.map((r: { id: string }) => r.id)));
        }
      })
      .catch(() => {});
  }, []);

  const handleImport = useCallback(async (noticeId: string) => {
    const email = getTokenPayload()?.email;
    if (!email) return;

    setImportingIds((prev) => new Set([...prev, noticeId]));
    try {
      const res = await fetch('/api/rfps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_email: email, notice_id: noticeId }),
      });
      if (res.ok) {
        setImportedIds((prev) => new Set([...prev, noticeId]));
      }
    } catch {
      // silently fail
    } finally {
      setImportingIds((prev) => {
        const next = new Set(prev);
        next.delete(noticeId);
        return next;
      });
    }
  }, []);

  // Keyboard shortcut: / to focus search
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === '/' && !(e.target instanceof HTMLInputElement) && !(e.target instanceof HTMLTextAreaElement) && !(e.target instanceof HTMLSelectElement)) {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
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
      if (sort !== 'deadline_asc') params.set('sort', sort);
      if (amountMin > 0) params.set('amount_min', String(amountMin));
      if (amountMax > 0) params.set('amount_max', String(amountMax));
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
  }, [cpv, region, deadlineDays, search, sort, amountMin, amountMax, page]);

  const handleCpvChange = useCallback((code: string) => {
    setCpv((prev) => prev === code ? '' : code);
    setPage(0);
  }, []);

  const resetFilters = useCallback(() => {
    setSearch('');
    setCpv('');
    setRegion('');
    setDeadlineDays(0);
    setSort('deadline_asc');
    setAmountMin(0);
    setAmountMax(0);
    setPage(0);
  }, []);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  // Active filters for chips
  const activeFilters: { key: string; label: string; onRemove: () => void }[] = [];
  if (search) {
    activeFilters.push({ key: 'search', label: `Recherche: "${search}"`, onRemove: () => { setSearch(''); setPage(0); } });
  }
  if (cpv) {
    const sectorName = CPV_SECTORS.find((s) => s.code === cpv)?.name ?? cpv;
    activeFilters.push({ key: 'cpv', label: sectorName, onRemove: () => { setCpv(''); setPage(0); } });
  }
  if (region) {
    activeFilters.push({ key: 'region', label: region, onRemove: () => { setRegion(''); setPage(0); } });
  }
  if (deadlineDays > 0) {
    activeFilters.push({ key: 'deadline', label: `Deadline < ${deadlineDays}j`, onRemove: () => { setDeadlineDays(0); setPage(0); } });
  }
  if (sort !== 'deadline_asc') {
    const sortLabel = SORT_OPTIONS.find((o) => o.value === sort)?.label ?? sort;
    activeFilters.push({ key: 'sort', label: `Tri: ${sortLabel}`, onRemove: () => { setSort('deadline_asc'); setPage(0); } });
  }
  if (amountMin > 0) {
    activeFilters.push({ key: 'amountMin', label: `Min: ${formatAmount(amountMin)}`, onRemove: () => { setAmountMin(0); setPage(0); } });
  }
  if (amountMax > 0) {
    activeFilters.push({ key: 'amountMax', label: `Max: ${formatAmount(amountMax)}`, onRemove: () => { setAmountMax(0); setPage(0); } });
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Header variant="dashboard" activePage="opportunities" />

      <div className="max-w-7xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Opportunités</h1>
          <p className="text-slate-500">Avis de marchés ouverts — trouvez vos prochains appels d&apos;offres.</p>
        </div>

        {/* Stats cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
                <Briefcase className="w-4 h-4" />
                Marchés ouverts
              </div>
              <div className="text-2xl font-bold text-slate-900">{stats.totalOpen}</div>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
                <Sparkles className="w-4 h-4" />
                Nouveautés 48h
              </div>
              <div className="text-2xl font-bold text-blue-600">{stats.newLast48h}</div>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
                <Zap className="w-4 h-4" />
                Urgents &lt;7j
              </div>
              <div className="text-2xl font-bold text-amber-600">{stats.urgentCount}</div>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
                <TrendingUp className="w-4 h-4" />
                Montant moyen
              </div>
              <div className="text-2xl font-bold text-slate-900">
                {stats.avgAmount > 0 ? formatAmount(stats.avgAmount) : '—'}
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 mb-6 space-y-4">
          {/* Line 1: Search + Region + Sort + Advanced toggle */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                ref={searchRef}
                type="text"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(0); }}
                placeholder="Rechercher par titre... (appuyez /)"
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
              value={sort}
              onChange={(e) => { setSort(e.target.value as SortOption); setPage(0); }}
              className="px-3 py-2.5 rounded-lg border border-slate-200 text-sm bg-white"
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            <button
              onClick={() => setShowAdvanced((prev) => !prev)}
              className={`inline-flex items-center gap-1.5 px-3 py-2.5 rounded-lg border text-sm font-medium transition-colors ${
                showAdvanced ? 'bg-indigo-50 border-indigo-300 text-indigo-700' : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
              }`}
            >
              <SlidersHorizontal className="w-4 h-4" />
              Filtres
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {/* Line 2: Advanced filters (collapsible) */}
          <AnimatePresence>
            {showAdvanced && (
              <motion.div
                key="advanced"
                initial={expandCollapse.initial}
                animate={expandCollapse.animate}
                exit={expandCollapse.exit}
                className="overflow-hidden"
              >
                <div className="flex items-center gap-3 flex-wrap pt-1">
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-slate-500 font-medium">Montant min</label>
                    <input
                      type="number"
                      value={amountMin || ''}
                      onChange={(e) => { setAmountMin(Number(e.target.value) || 0); setPage(0); }}
                      placeholder="0"
                      className="w-28 px-3 py-2 rounded-lg border border-slate-200 text-sm focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 outline-none"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-slate-500 font-medium">Montant max</label>
                    <input
                      type="number"
                      value={amountMax || ''}
                      onChange={(e) => { setAmountMax(Number(e.target.value) || 0); setPage(0); }}
                      placeholder="∞"
                      className="w-28 px-3 py-2 rounded-lg border border-slate-200 text-sm focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 outline-none"
                    />
                  </div>
                  <select
                    value={deadlineDays}
                    onChange={(e) => { setDeadlineDays(Number(e.target.value)); setPage(0); }}
                    className="px-3 py-2 rounded-lg border border-slate-200 text-sm bg-white"
                  >
                    <option value={0}>Toutes deadlines</option>
                    <option value={7}>7 jours</option>
                    <option value={14}>14 jours</option>
                    <option value={30}>30 jours</option>
                    <option value={60}>60 jours</option>
                  </select>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Line 3: CPV sector pills */}
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

          {/* Active filter chips */}
          {activeFilters.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="text-xs text-slate-400">Filtres actifs:</span>
              {activeFilters.map((f) => (
                <button
                  key={f.key}
                  onClick={f.onRemove}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 transition-colors"
                >
                  {f.label}
                  <X className="w-3 h-3" />
                </button>
              ))}
              {activeFilters.length > 1 && (
                <button
                  onClick={resetFilters}
                  className="text-xs text-slate-400 hover:text-slate-600 underline"
                >
                  Tout effacer
                </button>
              )}
            </div>
          )}
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
              {opportunities.map((opp) => {
                const borderColor = opp.isUrgent
                  ? 'border-l-amber-400'
                  : opp.isNew
                    ? 'border-l-blue-400'
                    : 'border-l-indigo-300';

                return (
                  <motion.div
                    key={opp.id}
                    variants={fadeUp}
                    className={`bg-white rounded-xl border border-slate-200 border-l-[3px] ${borderColor} p-5 hover:shadow-md transition-shadow`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        {/* Badges row */}
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
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
                          {opp.cpvSector && (
                            <span className="text-xs text-slate-500 bg-slate-50 px-2 py-0.5 rounded-full border border-slate-200">
                              {CPV_SECTORS.find((s) => s.code === opp.cpvSector)?.name ?? opp.cpvSector}
                            </span>
                          )}
                          {opp.source && (
                            <span className="text-xs text-slate-400 uppercase">{opp.source}</span>
                          )}
                        </div>

                        {/* Title — clickable link to AO detail */}
                        <Link
                          href={`/dashboard/ao/${opp.id}`}
                          className="text-sm font-semibold text-slate-900 hover:text-indigo-700 transition-colors mb-1 line-clamp-2 block"
                        >
                          {opp.title}
                        </Link>

                        {/* Metadata */}
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 mb-2">
                          <span>{opp.buyerName}</span>
                          {opp.region && <><span className="text-slate-300">·</span><span>{opp.region}</span></>}
                          {opp.nature && <><span className="text-slate-300">·</span><span>{opp.nature}</span></>}
                          {opp.procedureType && <><span className="text-slate-300">·</span><span>{opp.procedureType}</span></>}
                          {opp.lotsCount > 1 && <><span className="text-slate-300">·</span><span>{opp.lotsCount} lots</span></>}
                        </div>

                        {opp.description && (
                          <p className="text-xs text-slate-400 line-clamp-2">{opp.description}</p>
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

                        <div className="flex items-center gap-2 mt-1">
                          {opp.dceUrl && (
                            <a
                              href={opp.dceUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200 transition-colors"
                            >
                              DCE <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                          {importedIds.has(opp.id) ? (
                            <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <Check className="w-3 h-3" /> Importe
                            </span>
                          ) : importingIds.has(opp.id) ? (
                            <button
                              disabled
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-violet-50 text-violet-600 border border-violet-200 cursor-wait"
                            >
                              <Loader2 className="w-3 h-3 animate-spin" /> Import...
                            </button>
                          ) : (
                            <button
                              onClick={() => handleImport(opp.id)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-violet-50 text-violet-700 hover:bg-violet-100 border border-violet-200 transition-colors"
                            >
                              <Plus className="w-3 h-3" /> Importer
                            </button>
                          )}
                          <Link
                            href={`/dashboard/ao/${opp.id}`}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors"
                          >
                            Analyser <ArrowRight className="w-3 h-3" />
                          </Link>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}

              {/* Empty state */}
              {opportunities.length === 0 && !loading && (
                <div className="text-center py-16">
                  <Search className="w-10 h-10 mx-auto mb-4 text-slate-300" />
                  <p className="text-slate-500 font-medium mb-2">Aucune opportunité ne correspond à vos critères</p>
                  <p className="text-sm text-slate-400 mb-6">Essayez d&apos;élargir vos filtres ou créez une alerte pour être notifié.</p>
                  <div className="flex items-center justify-center gap-3">
                    <button
                      onClick={resetFilters}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
                    >
                      <X className="w-4 h-4" />
                      Réinitialiser les filtres
                    </button>
                    <Link
                      href="/dashboard/alerts"
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors"
                    >
                      <Bell className="w-4 h-4" />
                      Créer une alerte
                    </Link>
                  </div>
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
