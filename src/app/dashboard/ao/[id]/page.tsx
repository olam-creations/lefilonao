'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ExternalLink } from 'lucide-react';
import { isAuthenticated } from '@/lib/auth';
import Header from '@/components/Header';
import { isDevMode, MOCK_RFPS, MOCK_AO_DETAILS, type AoDetail, type CompanyProfile, type AoUploadedFile } from '@/lib/dev';
import { daysUntil, computeProgress } from '@/lib/ao-utils';
import { getWorkspaceState, saveWorkspaceState } from '@/lib/ao-storage';
import type { WorkspaceState } from '@/lib/ao-utils';
import { getCompanyProfile } from '@/lib/profile-storage';
import { uploadFile } from '@/lib/file-storage';
import AoHeroHeader from '@/components/ao/AoHeroHeader';
import AoTabBar, { type AoTab } from '@/components/ao/AoTabBar';
import AoSidebar from '@/components/ao/AoSidebar';
import TabEssentiel from '@/components/ao/TabEssentiel';
import TabAnalyse from '@/components/ao/TabAnalyse';
import TabReponse from '@/components/ao/TabReponse';
import TabMarche from '@/components/ao/TabMarche';

export default function AoDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [rfp, setRfp] = useState<typeof MOCK_RFPS[0] | null>(null);
  const [detail, setDetail] = useState<AoDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [workspace, setWorkspace] = useState<WorkspaceState>({ decisionMade: false, documentsReady: {}, sectionsReviewed: {}, aoFiles: [] });
  const [activeTab, setActiveTab] = useState<AoTab>('essentiel');
  const [profile, setProfile] = useState<CompanyProfile | null>(null);

  useEffect(() => {
    if (!isAuthenticated()) {
      window.location.href = '/login';
      return;
    }
    if (isDevMode()) {
      setRfp(MOCK_RFPS.find((r) => r.id === id) || null);
      setDetail(MOCK_AO_DETAILS[id] || null);
    }
    setWorkspace(getWorkspaceState(id));
    setProfile(getCompanyProfile());
    setLoading(false);
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
      <div className="min-h-screen bg-slate-50">
        <Header variant="dashboard" activePage="ao" backHref="/dashboard" />
        <div className="max-w-7xl mx-auto p-6 space-y-4">
          <div className="skeleton w-3/4 h-8 rounded" />
          <div className="skeleton w-1/2 h-5 rounded" />
          <div className="skeleton h-48 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!rfp || !detail || !profile) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-500 text-lg mb-4">Appel d&apos;offres non trouve</p>
          <Link href="/dashboard" className="btn-primary text-sm py-2 px-4">Retour au dashboard</Link>
        </div>
      </div>
    );
  }

  const daysLeft = daysUntil(rfp.deadline);
  const progress = computeProgress(workspace, detail.requiredDocumentsDetailed.length, detail.technicalPlanSections.length);

  return (
    <div className="min-h-screen bg-slate-50 pb-20 lg:pb-0">
      <Header
        variant="dashboard"
        activePage="ao"
        backHref="/dashboard"
        rightSlot={
          <a href={rfp.url} target="_blank" rel="noopener noreferrer" className="btn-secondary text-sm py-2 px-4">
            <ExternalLink className="w-3.5 h-3.5" /> BOAMP
          </a>
        }
      />

      <div className="max-w-7xl mx-auto p-6">
        <div className="flex gap-6">
          {/* Main content */}
          <div className="flex-1 min-w-0 space-y-6">
            {/* Hero Header */}
            <AoHeroHeader
              title={rfp.title}
              issuer={rfp.issuer}
              budget={rfp.budget}
              deadline={rfp.deadline}
              region={rfp.region}
              score={rfp.score}
              scoreLabel={rfp.scoreLabel}
              recommendation={detail.recommendation}
            />

            {/* Tab Bar */}
            <AoTabBar activeTab={activeTab} onTabChange={setActiveTab} />

            {/* Tab Content */}
            {activeTab === 'essentiel' && (
              <TabEssentiel
                aiSummary={detail.aiSummary}
                selectionCriteria={detail.selectionCriteria}
                vigilancePoints={detail.vigilancePoints}
                complianceChecklist={detail.complianceChecklist}
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
          <AoSidebar
            daysLeft={daysLeft}
            score={rfp.score}
            scoreLabel={rfp.scoreLabel}
            sourceUrl={rfp.url}
            progress={progress}
          />
        </div>
      </div>
    </div>
  );
}
