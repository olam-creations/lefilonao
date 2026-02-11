'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ExternalLink } from 'lucide-react';
import { useUserSettings } from '@/hooks/useUserSettings';
import TopBar from '@/components/dashboard/TopBar';
import { isDevMode, MOCK_RFPS, MOCK_AO_DETAILS, type AoDetail, type CompanyProfile, type AoUploadedFile } from '@/lib/dev';
import { daysUntil, computeProgress } from '@/lib/ao-utils';
import { getWorkspaceState, saveWorkspaceState, getDceAnalysis } from '@/lib/ao-storage';
import type { WorkspaceState } from '@/lib/ao-utils';
import { getCompanyProfile } from '@/lib/profile-storage';
import { uploadFile } from '@/lib/file-storage';
import AoHeroHeader from '@/components/ao/AoHeroHeader';
import AoNoticeDetails from '@/components/ao/AoNoticeDetails';
import type { BoampNoticeData } from '@/lib/notice-transform';
import AoTabBar, { type AoTab } from '@/components/ao/AoTabBar';
import AoSidebar from '@/components/ao/AoSidebar';
import TabEssentiel from '@/components/ao/TabEssentiel';
import TabAnalyse from '@/components/ao/TabAnalyse';
import TabReponse from '@/components/ao/TabReponse';
import TabMarche from '@/components/ao/TabMarche';
import WorkspaceLayout from '@/components/ao/workspace/WorkspaceLayout';
import WorkspaceLeftPane from '@/components/ao/workspace/WorkspaceLeftPane';
import WorkspaceRightPane from '@/components/ao/workspace/WorkspaceRightPane';

export default function AoDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [rfp, setRfp] = useState<typeof MOCK_RFPS[0] | null>(null);
  const [notice, setNotice] = useState<BoampNoticeData | null>(null);
  const [detail, setDetail] = useState<AoDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [workspace, setWorkspace] = useState<WorkspaceState>({ decisionMade: false, documentsReady: {}, sectionsReviewed: {}, aoFiles: [] });
  const [activeTab, setActiveTab] = useState<AoTab>('essentiel');
  const [profile, setProfile] = useState<CompanyProfile | null>(null);
  const [activeCriterion, setActiveCriterion] = useState<string | null>(null);
  const [highlightedSectionId, setHighlightedSectionId] = useState<string | null>(null);

  const { settings } = useUserSettings();

  useEffect(() => {
    const loadData = async () => {
      try {
        const res = await fetch(`/api/opportunities/${encodeURIComponent(id)}`);
        if (res.ok) {
          const json = await res.json();
          setRfp(json.rfp);
          if (json.notice) setNotice(json.notice);
          // Load locally-stored analysis if available
          const savedDce = getDceAnalysis(id);
          if (savedDce) {
            setDetail(savedDce);
          }
          setWorkspace(getWorkspaceState(id));
          setProfile(getCompanyProfile());
          setLoading(false);
          return;
        }
      } catch {
        // Fall through to dev mode
      }

      // Dev mode fallback
      if (isDevMode()) {
        const savedDce = getDceAnalysis(id);
        if (savedDce) {
          setDetail(savedDce);
          setRfp(MOCK_RFPS.find((r) => r.id === id) || null);
        } else {
          setRfp(MOCK_RFPS.find((r) => r.id === id) || null);
          setDetail(MOCK_AO_DETAILS[id] || null);
        }
      }

      setWorkspace(getWorkspaceState(id));
      setProfile(getCompanyProfile());
      setLoading(false);
    };

    loadData();
  }, [id]);

  const updateWorkspace = useCallback((updater: (prev: WorkspaceState) => WorkspaceState) => {
    setWorkspace((prev) => {
      const next = updater(prev);
      saveWorkspaceState(id, next);
      return next;
    });
  }, [id]);

  const handleToggleDoc = useCallback((docName: string) => {
    updateWorkspace((prev) => ({
      ...prev,
      documentsReady: { ...prev.documentsReady, [docName]: !prev.documentsReady[docName] },
    }));
  }, [updateWorkspace]);

  const handleToggleSection = useCallback((sectionId: string) => {
    updateWorkspace((prev) => ({
      ...prev,
      sectionsReviewed: { ...prev.sectionsReviewed, [sectionId]: !prev.sectionsReviewed[sectionId] },
    }));
  }, [updateWorkspace]);

  const handleCriterionClick = useCallback((criterionName: string) => {
    setActiveCriterion(criterionName);
    if (!detail) return;
    const lower = criterionName.toLowerCase();
    const match = detail.technicalPlanSections.find((s) =>
      s.title.toLowerCase().includes(lower) || lower.includes(s.title.toLowerCase().split(' ')[0])
    );
    if (match) {
      setHighlightedSectionId(match.id);
      const el = document.querySelector(`[data-section-id="${match.id}"]`);
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setTimeout(() => setHighlightedSectionId(null), 2500);
    }
  }, [detail]);

  const handleAoFileUpload = useCallback(async (documentName: string, file: File) => {
    const result = await uploadFile(file, 'ao-specific');
    const aoFile: AoUploadedFile = {
      id: result.id,
      documentName,
      fileName: result.fileName,
      fileSize: result.fileSize,
      mimeType: result.mimeType,
      uploadedAt: result.uploadedAt,
    };
    updateWorkspace((prev) => ({
      ...prev,
      aoFiles: [...(prev.aoFiles ?? []), aoFile],
      documentsReady: { ...prev.documentsReady, [documentName]: true },
    }));
  }, [updateWorkspace]);

  const handleAoFileDelete = useCallback((fileId: string) => {
    updateWorkspace((prev) => ({
      ...prev,
      aoFiles: (prev.aoFiles ?? []).filter((f) => f.id !== fileId),
    }));
  }, [updateWorkspace]);

  if (loading) {
    return (
      <div className="animate-fade-in">
        <TopBar title="Analyse AO" backHref="/dashboard" />
        <div className="max-w-7xl mx-auto py-10 space-y-4">
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
          <p className="text-slate-500 text-lg mb-4">Appel d&apos;offres non trouvé</p>
          <Link href="/dashboard" className="btn-primary text-sm py-2 px-4">Retour au dashboard</Link>
        </div>
      </div>
    );
  }

  const hasAnalysis = !!(detail && profile);
  const daysLeft = daysUntil(rfp.deadline);
  const progress = hasAnalysis
    ? computeProgress(workspace, detail.requiredDocumentsDetailed.length, detail.technicalPlanSections.length)
    : 0;

  return (
    <div className="animate-fade-in pb-20 lg:pb-0">
      <TopBar
        title="Détail Appel d'offres"
        backHref="/dashboard"
        rightSlot={
          <a href={rfp.url} target="_blank" rel="noopener noreferrer" className="btn-secondary text-sm py-2 px-4 shadow-sm">
            <ExternalLink className="w-3.5 h-3.5" /> BOAMP
          </a>
        }
      />

      <div className="max-w-7xl mx-auto py-10">
        <div className="flex gap-6">
          {/* Main content */}
          <div className="flex-1 min-w-0 space-y-6">
            <AoHeroHeader
              title={rfp.title}
              issuer={rfp.issuer}
              budget={rfp.budget}
              deadline={rfp.deadline}
              region={rfp.region}
              score={rfp.score}
              scoreLabel={rfp.scoreLabel}
              recommendation={detail?.recommendation ?? null}
            />

            {notice && <AoNoticeDetails notice={notice} />}

            {/* Analysis tabs — shown when locally-stored analysis exists */}
            {hasAnalysis && (
              <>
                <AoTabBar activeTab={activeTab} onTabChange={setActiveTab} />

                {activeTab === 'essentiel' && (
                  <TabEssentiel
                    aiSummary={detail.aiSummary}
                    selectionCriteria={detail.selectionCriteria}
                    vigilancePoints={detail.vigilancePoints}
                    complianceChecklist={detail.complianceChecklist}
                    cpv={settings?.default_cpv?.[0]}
                    region={rfp.region ?? undefined}
                    budget={rfp.budget ? parseInt(rfp.budget.replace(/[^0-9]/g, ''), 10) || undefined : undefined}
                  />
                )}

                {activeTab === 'analyse' && (
                  <TabAnalyse
                    criteria={detail.scoreCriteria}
                    recommendation={detail.recommendation}
                    executiveSummary={detail.executiveSummary}
                  />
                )}

                {activeTab === 'reponse' && (
                  <TabReponse
                    documents={detail.requiredDocumentsDetailed}
                    documentsReady={workspace.documentsReady}
                    onToggleDoc={handleToggleDoc}
                    profileDocuments={profile.documents}
                    sections={detail.technicalPlanSections}
                    sectionsReviewed={workspace.sectionsReviewed}
                    onToggleSection={handleToggleSection}
                    profile={profile}
                    rfp={{ title: rfp.title, issuer: rfp.issuer, deadline: rfp.deadline, budget: rfp.budget }}
                    workspace={workspace}
                    onAoFileUpload={handleAoFileUpload}
                    aoFiles={workspace.aoFiles ?? []}
                    onAoFileDelete={handleAoFileDelete}
                    dceContext={detail.aiSummary}
                    selectionCriteria={detail.selectionCriteria}
                    aoId={id}
                    prefilledCoachData={null}
                  />
                )}

                {activeTab === 'marche' && (
                  <TabMarche
                    buyerHistory={detail.buyerHistory}
                    competitors={detail.competitors}
                    publishedAt={rfp.publishedAt}
                    deadline={rfp.deadline}
                  />
                )}

                {activeTab === 'workspace' && (
                  <WorkspaceLayout
                    leftPane={
                      <WorkspaceLeftPane
                        aiSummary={detail.aiSummary}
                        selectionCriteria={detail.selectionCriteria}
                        vigilancePoints={detail.vigilancePoints}
                        complianceChecklist={detail.complianceChecklist}
                        scoreCriteria={detail.scoreCriteria}
                        recommendation={detail.recommendation}
                        executiveSummary={detail.executiveSummary}
                        onCriterionClick={handleCriterionClick}
                        activeCriterion={activeCriterion}
                      />
                    }
                    rightPane={
                      <WorkspaceRightPane
                        sections={detail.technicalPlanSections}
                        reviewed={workspace.sectionsReviewed}
                        onToggleReviewed={handleToggleSection}
                        profile={profile}
                        dceContext={detail.aiSummary}
                        selectionCriteria={detail.selectionCriteria}
                        aoId={id}
                        prefilledCoachData={null}
                        highlightedSectionId={highlightedSectionId}
                      />
                    }
                  />
                )}
              </>
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

          {/* Sidebar — show when analysis available */}
          {hasAnalysis && (
            <AoSidebar
              daysLeft={daysLeft}
              score={rfp.score}
              scoreLabel={rfp.scoreLabel}
              sourceUrl={rfp.url}
              progress={progress}
            />
          )}
        </div>
      </div>
    </div>
  );
}
