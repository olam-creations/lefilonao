'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Radar, FileText, HeartPulse, Building2, Euro, Leaf, Scale,
  ExternalLink, AlertTriangle, AlertCircle, ChevronDown, Search,
  Calendar, MapPin, Clock, ChevronLeft, ChevronRight,
} from 'lucide-react';
import TopBar from '@/components/dashboard/TopBar';
import { stagger, fadeUp } from '@/lib/motion-variants';
import { REGIONS } from '@/components/market/types';

type TabId = 'approch' | 'bodacc' | 'jorf' | 'subventions' | 'rge' | 'entities';

const TABS: { id: TabId; label: string; icon: typeof Radar; color: string }[] = [
  { id: 'approch', label: 'Projets d\'achats', icon: FileText, color: 'indigo' },
  { id: 'bodacc', label: 'Santé entreprises', icon: HeartPulse, color: 'red' },
  { id: 'jorf', label: 'Réglementation', icon: Scale, color: 'purple' },
  { id: 'subventions', label: 'Subventions', icon: Euro, color: 'emerald' },
  { id: 'rge', label: 'Certifications RGE', icon: Leaf, color: 'green' },
  { id: 'entities', label: 'Annuaire public', icon: Building2, color: 'blue' },
];

interface ApprochProject {
  code: number;
  title: string;
  description: string;
  status: string;
  buyerName: string;
  cpvSector: string;
  estimatedAmount: string;
  expectedPublicationDate: string | null;
  procedureType: string;
  region: string;
  link: string;
  considerationsSociales: string;
  considerationsEnvironnementales: string;
}

interface BodaccAlert {
  id: string;
  companyName: string;
  alertType: string;
  alertSeverity: string;
  publicationDate: string;
  tribunal: string;
  description: string;
}

interface JorfAlert {
  id: string;
  title: string;
  nature: string;
  publicationDate: string;
  signatory: string;
  url: string;
  keywordsMatched: string;
}

interface Subvention {
  id: string;
  beneficiaireNom: string;
  attribuantNom: string;
  montant: number;
  objet: string;
  dateAttribution: string | null;
  exercice: number;
  region: string;
}

interface RgeCert {
  id: string;
  siret: string;
  companyName: string;
  nomQualification: string;
  organisme: string;
  domaine: string;
  dateFin: string | null;
  commune: string;
  region: string;
}

interface PublicEntity {
  id: string;
  nom: string;
  typeService: string;
  commune: string;
  departement: string;
  region: string;
  telephone: string;
  email: string;
  url: string;
}

function formatDate(d: string | null): string {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatAmount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)} M€`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)} k€`;
  return `${n} €`;
}

function SeverityBadge({ severity }: { severity: string }) {
  const map: Record<string, { bg: string; text: string; label: string }> = {
    critical: { bg: 'bg-red-50 border-red-100', text: 'text-red-700', label: 'Critique' },
    warning: { bg: 'bg-amber-50 border-amber-100', text: 'text-amber-700', label: 'Attention' },
    info: { bg: 'bg-slate-50 border-slate-100', text: 'text-slate-600', label: 'Info' },
  };
  const s = map[severity] ?? map.info;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${s.bg} ${s.text}`}>
      {severity === 'critical' && <AlertTriangle className="w-3 h-3" />}
      {s.label}
    </span>
  );
}

export default function VeillePage() {
  const [activeTab, setActiveTab] = useState<TabId>('approch');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [region, setRegion] = useState('');
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const PAGE_SIZE = 20;

  // Data states
  const [approch, setApproch] = useState<ApprochProject[]>([]);
  const [bodacc, setBodacc] = useState<BodaccAlert[]>([]);
  const [jorf, setJorf] = useState<JorfAlert[]>([]);
  const [subventions, setSubventions] = useState<Subvention[]>([]);
  const [rge, setRge] = useState<RgeCert[]>([]);
  const [entities, setEntities] = useState<PublicEntity[]>([]);


  const fetchTab = useCallback(async () => {
    setLoading(true);
    setError(null);

    const params = new URLSearchParams({
      limit: String(PAGE_SIZE),
      offset: String(page * PAGE_SIZE),
    });
    if (search) params.set('search', search);
    if (region) params.set('region', region);

    try {
      let url = '';
      switch (activeTab) {
        case 'approch':
          url = `/api/market/upcoming?${params}`;
          break;
        case 'bodacc':
          url = `/api/market/bodacc-alerts?${params}`;
          break;
        case 'jorf':
          url = `/api/market/regulatory?${params}`;
          break;
        case 'subventions':
          url = `/api/market/subventions?${params}`;
          break;
        case 'rge':
          url = `/api/market/rge?${params}`;
          break;
        case 'entities':
          url = `/api/market/public-entities?${params}`;
          break;
      }

      const res = await fetch(url);
      if (!res.ok) throw new Error('Erreur serveur');
      const json = await res.json();

      switch (activeTab) {
        case 'approch':
          setApproch(json.projects ?? []);
          setTotal(json.total ?? 0);
          break;
        case 'bodacc':
          setBodacc(json.alerts ?? []);
          setTotal(json.total ?? 0);
          break;
        case 'jorf':
          setJorf(json.alerts ?? []);
          setTotal(json.total ?? 0);
          break;
        case 'subventions':
          setSubventions(json.subventions ?? []);
          setTotal(json.total ?? 0);
          break;
        case 'rge':
          setRge(json.certifications ?? []);
          setTotal(json.total ?? 0);
          break;
        case 'entities':
          setEntities(json.entities ?? []);
          setTotal(json.total ?? 0);
          break;
      }
    } catch {
      setError('Impossible de charger les données.');
    }

    setLoading(false);
  }, [activeTab, search, region, page]);

  useEffect(() => {
    const timer = setTimeout(fetchTab, search ? 300 : 0);
    return () => clearTimeout(timer);
  }, [fetchTab]);

  const handleTabChange = useCallback((id: TabId) => {
    setActiveTab(id);
    setPage(0);
    setSearch('');
    setRegion('');
  }, []);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="animate-fade-in">
      <TopBar
        title="Veille Stratégique"
        description="Projets d'achats, santé financière, réglementation, subventions, certifications, annuaire."
        icon={<Radar className="w-6 h-6 text-indigo-600" />}
      />

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mt-8 mb-8 pb-4 border-b border-slate-100">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-bold uppercase tracking-widest transition-all border ${
                isActive
                  ? 'bg-slate-900 border-slate-900 text-white shadow-lg shadow-slate-200 scale-105'
                  : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Search & Filters */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 mb-8 shadow-sm">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[250px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(0); }}
              placeholder="Rechercher..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
            />
          </div>
          {activeTab !== 'bodacc' && activeTab !== 'jorf' && (
            <select
              value={region}
              onChange={(e) => { setRegion(e.target.value); setPage(0); }}
              className="h-10 px-3 pr-8 rounded-xl border border-slate-200 text-sm bg-white appearance-none cursor-pointer hover:border-slate-300 transition-colors outline-none"
            >
              <option value="">Toutes régions</option>
              {REGIONS.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-3 p-4 mb-8 rounded-2xl bg-red-50 border border-red-100 text-red-700 text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Results count */}
      {!loading && (
        <div className="text-sm font-semibold text-slate-400 uppercase tracking-widest mb-6">
          {total} résultat{total !== 1 ? 's' : ''}
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <div className="h-5 w-48 bg-slate-100 rounded-lg skeleton mb-3" />
              <div className="h-4 w-96 bg-slate-50 rounded-lg skeleton mb-2" />
              <div className="h-4 w-64 bg-slate-50 rounded-lg skeleton" />
            </div>
          ))}
        </div>
      ) : (
        <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-4">
          {/* APProch — Projets d'achats */}
          {activeTab === 'approch' && approch.map((p) => (
            <motion.div key={p.code} variants={fadeUp} className="bg-white rounded-2xl border border-slate-200 border-l-[4px] border-l-indigo-400 p-6 hover:shadow-lg transition-all">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-3 flex-wrap">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-100">
                      Pré-publication
                    </span>
                    {p.status && (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-50 text-slate-500 border border-slate-100">
                        {p.status}
                      </span>
                    )}
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mb-2 line-clamp-2">{p.title}</h3>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500">
                    {p.buyerName && <span className="flex items-center gap-1"><Building2 className="w-3.5 h-3.5" /> {p.buyerName}</span>}
                    {p.region && <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {p.region}</span>}
                    {p.expectedPublicationDate && (
                      <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> Publication prévue : {formatDate(p.expectedPublicationDate)}</span>
                    )}
                  </div>
                  {p.description && <p className="text-sm text-slate-400 mt-3 line-clamp-2">{p.description}</p>}
                </div>
                <div className="flex flex-col items-end gap-2">
                  {p.estimatedAmount && (
                    <div className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 font-bold text-sm whitespace-nowrap">
                      {p.estimatedAmount}
                    </div>
                  )}
                  {p.link && (
                    <a href={p.link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-semibold">
                      Voir <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
            </motion.div>
          ))}

          {/* BODACC — Santé financière */}
          {activeTab === 'bodacc' && bodacc.map((a) => (
            <motion.div key={a.id} variants={fadeUp} className={`bg-white rounded-2xl border border-slate-200 border-l-[4px] p-6 hover:shadow-lg transition-all ${
              a.alertSeverity === 'critical' ? 'border-l-red-500' : a.alertSeverity === 'warning' ? 'border-l-amber-400' : 'border-l-slate-300'
            }`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-3">
                    <SeverityBadge severity={a.alertSeverity} />
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-50 text-slate-500 border border-slate-100">
                      {a.alertType}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mb-1">{a.companyName}</h3>
                  <p className="text-sm text-slate-400 line-clamp-2">{a.description}</p>
                </div>
                <div className="text-right text-sm text-slate-500">
                  <div className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {formatDate(a.publicationDate)}</div>
                  {a.tribunal && <div className="text-xs text-slate-400 mt-1">{a.tribunal}</div>}
                </div>
              </div>
            </motion.div>
          ))}

          {/* JORF — Réglementation */}
          {activeTab === 'jorf' && jorf.map((a) => (
            <motion.div key={a.id} variants={fadeUp} className="bg-white rounded-2xl border border-slate-200 border-l-[4px] border-l-purple-400 p-6 hover:shadow-lg transition-all">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-3 flex-wrap">
                    {a.nature && (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-purple-50 text-purple-700 border border-purple-100">
                        {a.nature}
                      </span>
                    )}
                    {a.keywordsMatched && (
                      <span className="text-[10px] text-slate-400 font-medium">
                        Mots-clés : {a.keywordsMatched}
                      </span>
                    )}
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mb-2 line-clamp-2">{a.title}</h3>
                  <div className="flex items-center gap-4 text-sm text-slate-500">
                    <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {formatDate(a.publicationDate)}</span>
                    {a.signatory && <span>{a.signatory}</span>}
                  </div>
                </div>
                {a.url && (
                  <a href={a.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-purple-600 hover:text-purple-800 font-semibold whitespace-nowrap">
                    Lire <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </motion.div>
          ))}

          {/* Subventions */}
          {activeTab === 'subventions' && subventions.map((s) => (
            <motion.div key={s.id} variants={fadeUp} className="bg-white rounded-2xl border border-slate-200 border-l-[4px] border-l-emerald-400 p-6 hover:shadow-lg transition-all">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-bold text-slate-900 mb-1">{s.beneficiaireNom}</h3>
                  <p className="text-sm text-slate-500 mb-2 line-clamp-2">{s.objet}</p>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-400">
                    <span>Attribuant : {s.attribuantNom}</span>
                    {s.region && <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {s.region}</span>}
                    {s.dateAttribution && <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {formatDate(s.dateAttribution)}</span>}
                  </div>
                </div>
                <div className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 font-bold text-sm whitespace-nowrap">
                  {s.montant > 0 ? formatAmount(s.montant) : '—'}
                </div>
              </div>
            </motion.div>
          ))}

          {/* RGE Certifications */}
          {activeTab === 'rge' && rge.map((r) => (
            <motion.div key={r.id} variants={fadeUp} className="bg-white rounded-2xl border border-slate-200 border-l-[4px] border-l-green-400 p-6 hover:shadow-lg transition-all">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-green-50 text-green-700 border border-green-100">
                      RGE
                    </span>
                    {r.organisme && (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-50 text-slate-500 border border-slate-100">
                        {r.organisme}
                      </span>
                    )}
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mb-1">{r.companyName}</h3>
                  <p className="text-sm text-slate-500 mb-1">{r.nomQualification}</p>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-400">
                    {r.domaine && <span>{r.domaine}</span>}
                    {r.commune && <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {r.commune}</span>}
                  </div>
                </div>
                {r.dateFin && (
                  <div className="text-right">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Expire</div>
                    <div className="text-sm font-semibold text-slate-600">{formatDate(r.dateFin)}</div>
                  </div>
                )}
              </div>
            </motion.div>
          ))}

          {/* Public Entities */}
          {activeTab === 'entities' && entities.map((e) => (
            <motion.div key={e.id} variants={fadeUp} className="bg-white rounded-2xl border border-slate-200 border-l-[4px] border-l-blue-400 p-6 hover:shadow-lg transition-all">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    {e.typeService && (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-100">
                        {e.typeService}
                      </span>
                    )}
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mb-1">{e.nom}</h3>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-400">
                    {e.commune && <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {e.commune} ({e.departement})</span>}
                    {e.region && <span>{e.region}</span>}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2 text-sm">
                  {e.telephone && <span className="text-slate-500">{e.telephone}</span>}
                  {e.email && <a href={`mailto:${e.email}`} className="text-indigo-600 hover:text-indigo-800 font-medium">{e.email}</a>}
                  {e.url && (
                    <a href={e.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-semibold">
                      Site web <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
            </motion.div>
          ))}

          {/* Empty state */}
          {!loading && total === 0 && (
            <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200">
              <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
                <Search className="w-10 h-10 text-slate-200" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Aucun résultat</h3>
              <p className="text-slate-400 max-w-sm mx-auto">
                Les données seront disponibles après la prochaine synchronisation.
              </p>
            </div>
          )}
        </motion.div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 mt-12 mb-8">
          <button
            onClick={() => setPage(Math.max(0, page - 1))}
            disabled={page === 0}
            className="w-10 h-10 flex items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
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
            className="w-10 h-10 flex items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
}
