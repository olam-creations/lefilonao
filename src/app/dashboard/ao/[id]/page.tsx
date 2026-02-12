'use client';

import { lazy, Suspense } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ExternalLink } from 'lucide-react';
import TopBar from '@/components/dashboard/TopBar';
import { useAoDossier } from '@/hooks/useAoDossier';
import AoDossierHero from '@/components/ao/dossier/AoDossierHero';
import AoDossierNav from '@/components/ao/dossier/AoDossierNav';
import AoDossierSidebar from '@/components/ao/dossier/AoDossierSidebar';
import SectionSynthese from '@/components/ao/dossier/SectionSynthese';
import DceDocumentHub from '@/components/ao/DceDocumentHub';

// Lazy-load heavier sections
const SectionReponse = lazy(() => import('@/components/ao/dossier/SectionReponse'));
const SectionDce = lazy(() => import('@/components/ao/dossier/SectionDce'));
const SectionIntelMarche = lazy(() => import('@/components/ao/dossier/SectionIntelMarche'));
const SectionLots = lazy(() => import('@/components/ao/dossier/SectionLots'));

function SectionSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="skeleton h-6 w-48 rounded" />
      <div className="skeleton h-48 rounded-2xl" />
    </div>
  );
}

export default function AoDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const {
    rfp, notice, lots, enriched,
    analysis, loading, hasAnalysis,
    daysLeft, progress, workspace, profile,
    amendments,
    handleToggleDoc, handleToggleSection,
    handleAoFileUpload, handleAoFileDelete,
  } = useAoDossier(id);

  if (loading) {
    return (
      <div className="animate-fade-in">
        <TopBar title="Dossier d'investigation" backHref="/dashboard" />
        <div className="max-w-7xl mx-auto px-4 py-10 space-y-4">
          <div className="skeleton w-3/4 h-8 rounded" />
          <div className="skeleton w-1/2 h-5 rounded" />
          <div className="skeleton h-48 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!rfp) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-500 text-lg mb-4">Appel d&apos;offres non trouve</p>
          <Link href="/dashboard" className="btn-primary text-sm py-2 px-4">Retour au dashboard</Link>
        </div>
      </div>
    );
  }

  const typeMarche = notice?.type_marche ? [notice.type_marche] : enriched?.type_marche;

  return (
    <div className="animate-fade-in pb-20 lg:pb-0">
      <TopBar
        title="Dossier d'investigation"
        backHref="/dashboard"
        rightSlot={
          <a href={rfp.url} target="_blank" rel="noopener noreferrer" className="btn-secondary text-sm py-2 px-4 shadow-sm">
            <ExternalLink className="w-3.5 h-3.5" /> Source
          </a>
        }
      />

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Hero */}
        <AoDossierHero
          title={rfp.title}
          issuer={rfp.issuer}
          budget={rfp.budget}
          deadline={rfp.deadline}
          region={rfp.region}
          score={rfp.score}
          scoreLabel={rfp.scoreLabel}
          recommendation={analysis?.recommendation ?? null}
          publishedAt={rfp.publishedAt}
          typeMarche={typeMarche}
          hasAnalysis={hasAnalysis}
        />

        {/* Sticky Nav */}
        <div className="mt-6">
          <AoDossierNav />
        </div>

        {/* Main layout: content + sidebar */}
        <div className="flex gap-6 mt-6">
          {/* Main scrollable content */}
          <div className="flex-1 min-w-0 space-y-10">
            {/* Synthese — always visible */}
            <SectionSynthese
              notice={notice}
              lots={lots}
              enriched={enriched}
              analysis={analysis}
              hasAnalysis={hasAnalysis}
              publishedAt={rfp.publishedAt}
              deadline={rfp.deadline}
            />

            {/* DCE Hub — always visible when DCE URL exists */}
            <section id="section-dce" className="scroll-mt-16">
              <h2 className="text-lg font-bold text-slate-900 mb-4">Documents du DCE</h2>
              <DceDocumentHub noticeId={id} dceUrl={notice?.dce_url} />
              <Suspense fallback={<SectionSkeleton />}>
                <SectionDce noticeId={id} dceUrl={notice?.dce_url} analysis={analysis} />
              </Suspense>
            </section>

            {/* Intelligence marche — unified section */}
            <Suspense fallback={<SectionSkeleton />}>
              <SectionIntelMarche
                buyerName={notice?.buyer_name ?? rfp.issuer}
                buyerSiret={notice?.buyer_siret ?? null}
                cpvCode={notice?.cpv_code ?? null}
                region={rfp.region ?? null}
                amount={notice?.estimated_amount ?? null}
              />
            </Suspense>

            {/* Reponse — only when analysis available */}
            {hasAnalysis && analysis && profile && (
              <Suspense fallback={<SectionSkeleton />}>
                <SectionReponse
                  analysis={analysis}
                  profile={profile}
                  workspace={workspace}
                  rfp={{ title: rfp.title, issuer: rfp.issuer, deadline: rfp.deadline, budget: rfp.budget }}
                  aoId={id}
                  onToggleDoc={handleToggleDoc}
                  onToggleSection={handleToggleSection}
                  onAoFileUpload={handleAoFileUpload}
                  onAoFileDelete={handleAoFileDelete}
                />
              </Suspense>
            )}

            {/* Lots */}
            {lots.length > 0 && (
              <Suspense fallback={<SectionSkeleton />}>
                <SectionLots lots={lots} noticeId={id} />
              </Suspense>
            )}

            {/* Footer */}
            <div className="text-center py-6 border-t border-slate-200">
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

          {/* Sidebar */}
          <AoDossierSidebar
            daysLeft={daysLeft}
            score={rfp.score}
            scoreLabel={rfp.scoreLabel}
            recommendation={analysis?.recommendation ?? null}
            sourceUrl={rfp.url}
            progress={progress}
            hasAnalysis={hasAnalysis}
            amendments={amendments}
          />
        </div>
      </div>
    </div>
  );
}
