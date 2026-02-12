'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import {
  Search, Clock, ExternalLink, AlertCircle, ChevronLeft, ChevronRight,
  Zap, Sparkles, Briefcase, TrendingUp, X, ChevronDown, ArrowRight,
  SlidersHorizontal, Bell, Plus, Check, Loader2, Filter, MapPin, Target
} from 'lucide-react';
import { useUser } from '@/components/UserProvider';
import TopBar from '@/components/dashboard/TopBar';
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
  const { email } = useUser();
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

  // Load already-imported RFP IDs
  useEffect(() => {
    if (!email) return;
    fetch(`/api/rfps?email=${encodeURIComponent(email)}`)
      .then((r) => r.ok ? r.json() : null)
      .then((json) => {
        if (json?.rfps) {
          setImportedIds(new Set(json.rfps.map((r: { id: string }) => r.id)));
        }
      })
      .catch(() => {});
  }, [email]);

  const handleImport = useCallback(async (noticeId: string) => {
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
  }, [email]);

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
        setError('Impossible de charger les appels d\'offres.');
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
    <div>
      <TopBar 
        title="Appels d'offres"
        description="Annuaire des marchés publics ouverts — trouvez vos prochains AO." 
        icon={<Target className="w-6 h-6 text-indigo-600" />}
      />

      {/* Stats cards */}
      {stats && (
        <motion.div 
          variants={stagger}
          initial="hidden"
          animate="show"
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
        >
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center gap-2.5 text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">
              <Briefcase className="w-3.5 h-3.5 text-indigo-500" />
              Ouverts
            </div>
            <div className="text-2xl font-bold text-slate-900">{stats.totalOpen}</div>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center gap-2.5 text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">
              <Sparkles className="w-3.5 h-3.5 text-blue-500" />
              Nouveautés 48h
            </div>
            <div className="text-2xl font-bold text-blue-600">{stats.newLast48h}</div>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center gap-2.5 text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              Urgents &lt;7j
            </div>
            <div className="text-2xl font-bold text-amber-600">{stats.urgentCount}</div>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center gap-2.5 text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
              Montant moyen
            </div>
            <div className="text-2xl font-bold text-slate-900">
              {stats.avgAmount > 0 ? formatAmount(stats.avgAmount) : '—'}
            </div>
          </div>
        </motion.div>
      )}

      {/* Filters Toolbar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 mb-8 shadow-sm space-y-5">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[300px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
            <input
              ref={searchRef}
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(0); }}
              placeholder="Rechercher un marché par titre... (appuyez sur /)"
              className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <div className="h-10 w-px bg-slate-100 mx-1 hidden sm:block" />
            
            <select
              value={region}
              onChange={(e) => { setRegion(e.target.value); setPage(0); }}
              className="h-10 px-3 pr-8 rounded-xl border border-slate-200 text-sm bg-white appearance-none cursor-pointer hover:border-slate-300 transition-colors outline-none"
              style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'%2394a3b8\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M19 9l-7 7-7-7\'%3E%3C/path%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.75rem center', backgroundSize: '1rem' }}
            >
              <option value="">Toutes régions</option>
              {REGIONS.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>

            <select
              value={sort}
              onChange={(e) => { setSort(e.target.value as SortOption); setPage(0); }}
              className="h-10 px-3 pr-8 rounded-xl border border-slate-200 text-sm bg-white appearance-none cursor-pointer hover:border-slate-300 transition-colors outline-none"
              style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'%2394a3b8\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M19 9l-7 7-7-7\'%3E%3C/path%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.75rem center', backgroundSize: '1rem' }}
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>

            <button
              onClick={() => setShowAdvanced((prev) => !prev)}
              className={`h-10 inline-flex items-center gap-2 px-4 rounded-xl border text-sm font-semibold transition-all ${
                showAdvanced 
                  ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-200' 
                  : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              <SlidersHorizontal className="w-4 h-4" />
              Filtres
            </button>
          </div>
        </div>

        {/* Advanced filters (collapsible) */}
        <AnimatePresence>
          {showAdvanced && (
            <motion.div
              key="advanced"
              initial={expandCollapse.initial}
              animate={expandCollapse.animate}
              exit={expandCollapse.exit}
              className="overflow-hidden"
            >
              <div className="flex items-center gap-6 flex-wrap pt-2 pb-1 border-t border-slate-50 mt-2">
                <div className="flex items-center gap-3">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Budget</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={amountMin || ''}
                      onChange={(e) => { setAmountMin(Number(e.target.value) || 0); setPage(0); }}
                      placeholder="Min"
                      className="w-24 px-3 py-2 rounded-xl border border-slate-200 text-sm focus:border-indigo-500 outline-none transition-all"
                    />
                    <span className="text-slate-300">—</span>
                    <input
                      type="number"
                      value={amountMax || ''}
                      onChange={(e) => { setAmountMax(Number(e.target.value) || 0); setPage(0); }}
                      placeholder="Max"
                      className="w-24 px-3 py-2 rounded-xl border border-slate-200 text-sm focus:border-indigo-500 outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Échéance</label>
                  <select
                    value={deadlineDays}
                    onChange={(e) => { setDeadlineDays(Number(e.target.value)); setPage(0); }}
                    className="px-3 py-2 rounded-xl border border-slate-200 text-sm bg-white outline-none focus:border-indigo-500 transition-all"
                  >
                    <option value={0}>Toutes les échéances</option>
                    <option value={7}>Moins de 7 jours</option>
                    <option value={14}>Moins de 14 jours</option>
                    <option value={30}>Moins de 30 jours</option>
                    <option value={60}>Moins de 60 jours</option>
                  </select>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* CPV sector pills */}
        <div className="flex flex-wrap gap-2 pt-2">
          <button
            onClick={() => handleCpvChange('')}
            className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all border ${
              !cpv 
                ? 'bg-slate-900 border-slate-900 text-white shadow-md' 
                : 'bg-slate-50 border-slate-100 text-slate-500 hover:bg-slate-100'
            }`}
          >
            Tous secteurs
          </button>
          {CPV_SECTORS.map((s) => (
            <button
              key={s.code}
              onClick={() => handleCpvChange(s.code)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all border ${
                cpv === s.code 
                  ? 'bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-100' 
                  : 'bg-slate-50 border-slate-100 text-slate-500 hover:bg-slate-100'
              }`}
            >
              {s.name}
            </button>
          ))}
        </div>

        {/* Active filter chips */}
        {activeFilters.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-50">
            <div className="flex items-center gap-1.5 mr-2">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Actifs :</span>
            </div>
            {activeFilters.map((f) => (
              <button
                key={f.key}
                onClick={f.onRemove}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100 hover:bg-indigo-100 transition-colors group"
              >
                {f.label}
                <X className="w-3 h-3 text-indigo-300 group-hover:text-indigo-600" />
              </button>
            ))}
            {activeFilters.length > 1 && (
              <button
                onClick={resetFilters}
                className="text-[10px] font-bold text-slate-400 hover:text-red-500 uppercase tracking-widest ml-2 transition-colors"
              >
                Tout effacer
              </button>
            )}
          </div>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-3 p-4 mb-8 rounded-2xl bg-red-50 border border-red-100 text-red-700 text-sm animate-shake">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Results Header */}
      {!loading && (
        <div className="flex items-center justify-between mb-6">
          <div className="text-sm font-semibold text-slate-400 uppercase tracking-widest">
            {total} appel{total !== 1 ? 's' : ''} d&apos;offres trouvé{total !== 1 ? 's' : ''}
          </div>
        </div>
      )}

      {/* Results List */}
      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm overflow-hidden relative">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-5 w-20 bg-slate-100 rounded-full skeleton" />
                <div className="h-5 w-32 bg-slate-100 rounded-full skeleton" />
              </div>
              <div className="h-6 bg-slate-100 rounded-lg w-3/4 mb-4 skeleton" />
              <div className="h-4 bg-slate-50 rounded-lg w-1/2 mb-2 skeleton" />
              <div className="h-4 bg-slate-50 rounded-lg w-1/3 skeleton" />
              <div className="absolute right-6 bottom-6 h-10 w-24 bg-slate-100 rounded-xl skeleton" />
            </div>
          ))}
        </div>
      ) : (
        <>
          <motion.div variants={stagger} initial="hidden" animate="show" className="grid grid-cols-1 gap-4">
            {opportunities.map((opp) => {
              const borderClass = opp.isUrgent
                ? 'border-l-amber-400'
                : opp.isNew
                  ? 'border-l-indigo-500'
                  : 'border-l-slate-300';

              return (
                <motion.div
                  key={opp.id}
                  variants={fadeUp}
                  className={`group bg-white rounded-2xl border border-slate-200 border-l-[4px] ${borderClass} p-6 hover:shadow-xl hover:shadow-indigo-500/5 transition-all relative overflow-hidden`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
                    <div className="flex-1 min-w-0">
                      {/* Badges row */}
                      <div className="flex items-center gap-2.5 mb-4 flex-wrap">
                        {opp.isNew && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-100">
                            <Sparkles className="w-3 h-3" /> Nouveau
                          </span>
                        )}
                        {opp.isUrgent && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-100">
                            <Zap className="w-3 h-3" /> Urgent
                          </span>
                        )}
                        {opp.cpvSector && (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-50 text-slate-500 border border-slate-100">
                            {CPV_SECTORS.find((s) => s.code === opp.cpvSector)?.name ?? opp.cpvSector}
                          </span>
                        )}
                        <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">{opp.source}</span>
                      </div>

                      {/* Title */}
                      <Link
                        href={`/dashboard/ao/${opp.id}`}
                        className="text-lg font-bold text-slate-900 hover:text-indigo-600 transition-colors mb-2 line-clamp-2 block leading-snug"
                      >
                        {opp.title}
                      </Link>

                      {/* Metadata */}
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-slate-500 mb-4 font-medium">
                        <span className="flex items-center gap-1.5"><Briefcase className="w-4 h-4 text-slate-400" /> {opp.buyerName}</span>
                        {opp.region && <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4 text-slate-400" /> {opp.region}</span>}
                        {opp.procedureType && <span className="flex items-center gap-1.5 border-l border-slate-200 pl-4">{opp.procedureType}</span>}
                      </div>

                      {opp.description && (
                        <p className="text-sm text-slate-400 line-clamp-2 leading-relaxed bg-slate-50/50 p-3 rounded-xl border border-slate-100/50">{opp.description}</p>
                      )}
                    </div>

                    <div className="flex flex-col sm:flex-row lg:flex-col items-start sm:items-center lg:items-end gap-4 lg:min-w-[200px]">
                      {opp.estimatedAmount > 0 && (
                        <div className="px-4 py-2 rounded-xl bg-emerald-50 text-emerald-700 font-bold text-lg">
                          {formatAmount(opp.estimatedAmount)}
                        </div>
                      )}

                      {opp.deadline && (
                        <div className="flex items-center gap-2 text-sm font-semibold text-slate-600">
                          <Clock className="w-4 h-4 text-slate-400" />
                          <span>{formatDate(opp.deadline)}</span>
                          {opp.daysLeft !== null && (
                            <span className={`px-2 py-0.5 rounded-lg ${opp.daysLeft <= 7 ? 'bg-red-50 text-red-600' : 'bg-slate-100 text-slate-500'}`}>
                              J-{opp.daysLeft}
                            </span>
                          )}
                        </div>
                      )}

                      <div className="flex items-center gap-2 mt-auto w-full sm:w-auto lg:w-full justify-end">
                        {opp.dceUrl && (
                          <a
                            href={opp.dceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 lg:flex-none inline-flex items-center justify-center gap-2 px-4 h-10 rounded-xl text-sm font-bold bg-white text-slate-600 hover:bg-slate-50 border border-slate-200 transition-all shadow-sm"
                            title="Consulter le DCE"
                          >
                            DCE <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}
                        
                        {importedIds.has(opp.id) ? (
                          <div className="flex-1 lg:flex-none inline-flex items-center justify-center gap-2 px-4 h-10 rounded-xl text-sm font-bold bg-emerald-50 text-emerald-700 border border-emerald-100 shadow-sm shadow-emerald-50">
                            <Check className="w-4 h-4" /> Importé
                          </div>
                        ) : (
                          <button
                            onClick={() => handleImport(opp.id)}
                            disabled={importingIds.has(opp.id)}
                            className="flex-1 lg:flex-none inline-flex items-center justify-center gap-2 px-4 h-10 rounded-xl text-sm font-bold bg-indigo-600 text-white hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 disabled:opacity-50 disabled:cursor-wait"
                          >
                            {importingIds.has(opp.id) ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span className="hidden sm:inline">Import...</span>
                              </>
                            ) : (
                              <>
                                <Plus className="w-4 h-4" />
                                <span>Importer</span>
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}

            {/* Empty state */}
            {opportunities.length === 0 && !loading && (
              <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200 mt-4">
                <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
                  <Search className="w-10 h-10 text-slate-200" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Aucun appel d&apos;offres trouvé</h3>
                <p className="text-slate-400 max-w-sm mx-auto mb-8">
                  Essayez d&apos;élargir vos critères de recherche ou de changer de secteur CPV.
                </p>
                <div className="flex items-center justify-center gap-4">
                  <button
                    onClick={resetFilters}
                    className="px-6 py-2.5 rounded-xl text-sm font-bold bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all"
                  >
                    Réinitialiser
                  </button>
                  <Link
                    href="/dashboard/alerts"
                    className="px-6 py-2.5 rounded-xl text-sm font-bold bg-indigo-600 text-white hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
                  >
                    Créer une alerte
                  </Link>
                </div>
              </div>
            )}
          </motion.div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 mt-12 mb-8">
              <button
                onClick={() => setPage(Math.max(0, page - 1))}
                disabled={page === 0}
                className="w-10 h-10 flex items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:border-slate-300 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              
              <div className="flex items-center gap-2">
                {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
                  let pageNum = i;
                  if (totalPages > 5 && page > 2) {
                    pageNum = page - 2 + i;
                    if (pageNum >= totalPages) pageNum = totalPages - 5 + i;
                  }
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setPage(pageNum)}
                      className={`w-10 h-10 rounded-xl text-sm font-bold transition-all ${
                        page === pageNum 
                          ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' 
                          : 'bg-white border border-slate-200 text-slate-500 hover:border-slate-300'
                      }`}
                    >
                      {pageNum + 1}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                disabled={page >= totalPages - 1}
                className="w-10 h-10 flex items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:border-slate-300 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}