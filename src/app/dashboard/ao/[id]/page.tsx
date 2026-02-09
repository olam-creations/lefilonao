'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, Shield, Target, TrendingUp, Users, Clock,
  FileText, CheckSquare, Copy, ExternalLink, Building2,
  Trophy, Landmark, Sparkles, Check, BookOpen, ListChecks,
  ClipboardList,
} from 'lucide-react';
import { isAuthenticated } from '@/lib/auth';
import { isDevMode, MOCK_RFPS, MOCK_AO_DETAILS, type AoDetail } from '@/lib/dev';

const ICON_MAP: Record<string, React.ElementType> = {
  Shield, Target, TrendingUp, Users, Clock,
};

function ScoreBadgeLarge({ score, label }: { score: number; label: string }) {
  const config = {
    GO: 'badge-go glow-emerald',
    MAYBE: 'badge-maybe glow-amber',
    PASS: 'badge-pass',
  }[label] || 'badge-pass';
  return (
    <span className={`${config} text-lg px-4 py-1.5`}>
      {score}/100 &middot; {label}
    </span>
  );
}

function CriteriaBar({ label, score, icon, description }: {
  label: string; score: number; icon: string; description: string;
}) {
  const Icon = ICON_MAP[icon] || Target;
  const pct = (score / 20) * 100;
  const color = score >= 15 ? 'from-emerald-400 to-emerald-500' :
    score >= 10 ? 'from-amber-400 to-amber-500' : 'from-red-400 to-red-500';
  return (
    <div className="bg-white rounded-xl p-5 border border-slate-200 hover:shadow-sm transition-all">
      <div className="flex items-center gap-2.5 mb-3">
        <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center">
          <Icon className="w-4 h-4 text-slate-500" />
        </div>
        <div>
          <div className="text-sm font-semibold text-slate-900">{label}</div>
          <div className="text-xs text-slate-400">{description}</div>
        </div>
        <span className="ml-auto text-lg font-bold text-slate-900">{score}<span className="text-sm text-slate-400">/20</span></span>
      </div>
      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full bg-gradient-to-r ${color} transition-all duration-700`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [text]);
  return (
    <button
      onClick={handleCopy}
      className="p-2 rounded-lg hover:bg-slate-100 transition-colors group"
      title="Copier"
    >
      {copied
        ? <Check className="w-4 h-4 text-emerald-500" />
        : <Copy className="w-4 h-4 text-slate-400 group-hover:text-indigo-500 transition-colors" />}
    </button>
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

export default function AoDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [rfp, setRfp] = useState<typeof MOCK_RFPS[0] | null>(null);
  const [detail, setDetail] = useState<AoDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated()) {
      window.location.href = '/login';
      return;
    }

    // In dev mode, use mock data
    if (isDevMode()) {
      const found = MOCK_RFPS.find((r) => r.id === id);
      setRfp(found || null);
      setDetail(MOCK_AO_DETAILS[id] || null);
    }
    // TODO: API call for production
    setLoading(false);
  }, [id]);

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
          <div className="skeleton w-3/4 h-8 rounded mb-4" />
          <div className="skeleton w-1/2 h-5 rounded mb-8" />
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} className="skeleton h-28 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!rfp || !detail) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-500 text-lg mb-4">Appel d&apos;offres non trouvé</p>
          <Link href="/dashboard" className="btn-primary text-sm py-2 px-4">
            Retour au dashboard
          </Link>
        </div>
      </div>
    );
  }

  const daysLeft = daysUntil(rfp.deadline);
  const isUrgent = daysLeft !== null && daysLeft <= 7;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="glass">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 text-slate-500" />
            </Link>
            <Link href="/" className="text-lg font-semibold text-slate-900">
              Le Filon <span className="gradient-text">AO</span>
            </Link>
          </div>
          <a
            href={rfp.url}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary text-sm py-2 px-4"
          >
            <ExternalLink className="w-3.5 h-3.5" /> Source BOAMP
          </a>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-6">
        {/* Summary Bar */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 mb-8">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-3 flex-wrap">
                <ScoreBadgeLarge score={rfp.score} label={rfp.scoreLabel} />
                <span className="font-mono text-xs text-slate-400 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-100">
                  {rfp.source}
                </span>
                {isUrgent && daysLeft !== null && (
                  <span className="text-xs text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-md font-medium">
                    {daysLeft}j restants
                  </span>
                )}
              </div>
              <h1 className="text-xl font-bold text-slate-900 mb-4 leading-snug">{rfp.title}</h1>
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
          </div>
        </div>

        {/* Section 1 — Score Go/No-Go */}
        <section className="mb-8">
          <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Target className="w-5 h-5 text-indigo-500" />
            Score Go/No-Go — Analyse détaillée
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {detail.scoreCriteria.map((c) => (
              <CriteriaBar key={c.label} {...c} />
            ))}
          </div>
        </section>

        {/* Section 2 — Analyse du DCE */}
        <section className="mb-8">
          <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-500" />
            Analyse du DCE
          </h2>

          {/* AI Summary */}
          <div className="bg-gradient-to-r from-indigo-50 to-violet-50 rounded-xl p-5 border border-indigo-100 mb-4">
            <div className="flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-indigo-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <div className="text-sm font-semibold text-indigo-900 mb-1">Résumé IA</div>
                <p className="text-sm text-indigo-800 leading-relaxed">{detail.aiSummary}</p>
              </div>
              <CopyButton text={detail.aiSummary} />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {/* Selection Criteria */}
            <div className="bg-white rounded-xl p-5 border border-slate-200">
              <h3 className="text-sm font-semibold text-slate-900 mb-4">Critères de sélection</h3>
              <div className="space-y-3">
                {detail.selectionCriteria.map((c) => (
                  <div key={c.name} className="flex items-center justify-between">
                    <span className="text-sm text-slate-700">{c.name}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-indigo-400 to-violet-500"
                          style={{ width: `${c.weight}%` }}
                        />
                      </div>
                      <span className="text-sm font-semibold text-slate-900 w-10 text-right">{c.weight}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Required Documents */}
            <div className="bg-white rounded-xl p-5 border border-slate-200">
              <h3 className="text-sm font-semibold text-slate-900 mb-4">Pièces requises</h3>
              <div className="space-y-2">
                {detail.requiredDocuments.map((doc) => (
                  <div key={doc} className="flex items-center gap-2.5 text-sm">
                    <CheckSquare className="w-3.5 h-3.5 text-slate-300 flex-shrink-0" />
                    <span className="text-slate-600">{doc}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Section 3 — Aide à la réponse */}
        <section className="mb-8">
          <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-indigo-500" />
            Aide à la réponse
          </h2>
          <div className="grid md:grid-cols-3 gap-4">
            {/* Technical Plan */}
            <div className="bg-white rounded-xl p-5 border border-slate-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                  <ListChecks className="w-4 h-4 text-indigo-500" />
                  Plan mémoire technique
                </h3>
                <CopyButton text={detail.technicalPlan.join('\n')} />
              </div>
              <div className="space-y-2">
                {detail.technicalPlan.map((item) => (
                  <div key={item} className="text-sm text-slate-600 py-1 border-b border-slate-50 last:border-0">
                    {item}
                  </div>
                ))}
              </div>
            </div>

            {/* Executive Summary */}
            <div className="bg-white rounded-xl p-5 border border-slate-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-indigo-500" />
                  Résumé exécutif
                </h3>
                <CopyButton text={detail.executiveSummary} />
              </div>
              <p className="text-sm text-slate-600 leading-relaxed italic">
                &ldquo;{detail.executiveSummary}&rdquo;
              </p>
              <p className="text-xs text-slate-400 mt-3">
                Remplacez [Entreprise] par votre raison sociale.
              </p>
            </div>

            {/* Compliance Checklist */}
            <div className="bg-white rounded-xl p-5 border border-slate-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                  <ClipboardList className="w-4 h-4 text-indigo-500" />
                  Checklist conformité
                </h3>
                <CopyButton text={detail.complianceChecklist.join('\n')} />
              </div>
              <div className="space-y-2">
                {detail.complianceChecklist.map((item) => (
                  <label key={item} className="flex items-center gap-2.5 text-sm cursor-pointer group">
                    <input type="checkbox" className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                    <span className="text-slate-600 group-hover:text-slate-900 transition-colors">{item}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Section 4 — Intelligence marché */}
        <section className="mb-8">
          <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-indigo-500" />
            Intelligence marché
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            {/* Buyer History */}
            <div className="bg-white rounded-xl p-5 border border-slate-200">
              <div className="flex items-center gap-2 mb-4">
                <Landmark className="w-4 h-4 text-indigo-500" />
                <h3 className="text-sm font-semibold text-slate-900">
                  Historique de l&apos;acheteur
                </h3>
              </div>
              {detail.buyerHistory.length > 0 ? (
                <div className="space-y-0">
                  {detail.buyerHistory.map((h, i) => (
                    <div key={i} className="flex justify-between items-start gap-3 py-3 border-b border-slate-100 last:border-0">
                      <div className="min-w-0">
                        <div className="text-sm text-slate-700 font-medium mb-1">{h.title}</div>
                        <div className="text-xs text-slate-400 flex items-center gap-2">
                          <span>{formatDate(h.date)}</span>
                          <span>&middot;</span>
                          <span className="text-emerald-600 font-medium">{h.winner}</span>
                        </div>
                      </div>
                      <span className="text-sm font-bold font-mono text-slate-900 flex-shrink-0">{h.amount}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-400 text-center py-4">Aucun historique disponible</p>
              )}
            </div>

            {/* Competitors */}
            <div className="bg-white rounded-xl p-5 border border-slate-200">
              <div className="flex items-center gap-2 mb-4">
                <Trophy className="w-4 h-4 text-emerald-500" />
                <h3 className="text-sm font-semibold text-slate-900">
                  Concurrents potentiels
                </h3>
              </div>
              {detail.competitors.length > 0 ? (
                <div className="space-y-3">
                  {detail.competitors.map((c, i) => (
                    <div key={i} className="flex justify-between items-center py-2 border-b border-slate-50 last:border-0">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-xs font-semibold text-slate-500 flex-shrink-0">
                          {i + 1}
                        </span>
                        <div>
                          <span className="text-sm text-slate-700 font-medium">{c.name}</span>
                          <div className="text-xs text-slate-400">Budget moyen : {c.avgBudget}</div>
                        </div>
                      </div>
                      <span className="text-sm font-mono gradient-text font-semibold flex-shrink-0 ml-4">
                        {c.wins} victoires
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-400 text-center py-4">Aucune donnée disponible</p>
              )}
            </div>
          </div>
        </section>

        {/* Footer Link */}
        <div className="text-center py-8 border-t border-slate-200">
          <a
            href={rfp.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-indigo-600 transition-colors"
          >
            Voir l&apos;annonce originale sur le BOAMP
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
}
