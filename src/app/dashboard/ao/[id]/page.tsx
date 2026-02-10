'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ExternalLink, Search, FileUp } from 'lucide-react';
import { isAuthenticated, getTokenPayload } from '@/lib/auth';
import TopBar from '@/components/dashboard/TopBar';
import { isDevMode, MOCK_RFPS, MOCK_AO_DETAILS, type AoDetail, type CompanyProfile, type AoUploadedFile } from '@/lib/dev';
import { daysUntil, computeProgress } from '@/lib/ao-utils';
import { getWorkspaceState, saveWorkspaceState, getDceAnalysis, saveDceAnalysis } from '@/lib/ao-storage';
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
import DceDropZone from '@/components/ao/DceDropZone';
import { useDceAnalysis } from '@/hooks/useDceAnalysis';

export default function AoDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [rfp, setRfp] = useState<typeof MOCK_RFPS[0] | null>(null);
  const [detail, setDetail] = useState<AoDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [workspace, setWorkspace] = useState<WorkspaceState>({ decisionMade: false, documentsReady: {}, sectionsReviewed: {}, aoFiles: [] });
  const [activeTab, setActiveTab] = useState<AoTab>('essentiel');
  const [profile, setProfile] = useState<CompanyProfile | null>(null);
  const [dceAnalyzed, setDceAnalyzed] = useState(false);

  const dce = useDceAnalysis();
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isAuthenticated()) {
      window.location.href = '/login';
      return;
    }

    const loadData = async () => {
      // Try loading from API first
      try {
        const res = await fetch(`/api/opportunities/${encodeURIComponent(id)}`);
        if (res.ok) {
          const json = await res.json();
          setRfp(json.rfp);
          // Check if DCE was already analyzed (stored locally)
          const savedDce = getDceAnalysis(id);
          if (savedDce) {
            setDetail(savedDce);
            setDceAnalyzed(true);
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
          setDceAnalyzed(true);
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

  useEffect(() => {
    if (dce.state === 'done' && dce.result) {
      setDetail(dce.result);
      setDceAnalyzed(true);
      saveDceAnalysis(id, dce.result);

      // Sync score to user_rfps if imported
      const email = getTokenPayload()?.email;
      if (email && dce.result.scoreCriteria.length > 0) {
        const avgScore = Math.round(
          dce.result.scoreCriteria.reduce((a, c) => a + c.score, 0) / dce.result.scoreCriteria.length
        );
        const normalized = Math.round((avgScore / 20) * 100);
        const scoreLabel = normalized >= 70 ? 'GO' : normalized >= 50 ? 'MAYBE' : 'PASS';

        fetch('/api/rfps', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_email: email, notice_id: id, score: normalized, score_label: scoreLabel, status: 'analyzing' }),
        }).catch(() => {});
      }
    }
  }, [dce.state, dce.result, id]);

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

  const handleOpenFilePicker = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      dce.analyzeDce(file);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [dce.analyzeDce]);

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

  // RFP loaded but no DCE analysis yet — show header + upload prompt
  if (!detail || !profile) {
    return (
      <div className="animate-fade-in">
        <TopBar title="Détail Appel d'offres" backHref="/dashboard" />

        {/* Hidden file input for DCE picker */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf"
          className="hidden"
          onChange={handleFileInputChange}
          aria-label="Choisir un fichier DCE"
        />

        <DceDropZone
          state={dce.state}
          progress={dce.progress}
          error={dce.error}
          fallbackUrl={dce.fallbackUrl}
          onDrop={dce.analyzeDce}
          onReset={dce.reset}
          onOpenFilePicker={handleOpenFilePicker}
        />

        <div className="max-w-7xl mx-auto py-10 space-y-6">
          <AoHeroHeader
            title={rfp.title}
            issuer={rfp.issuer}
            budget={rfp.budget}
            deadline={rfp.deadline}
            region={rfp.region}
            score={rfp.score}
            scoreLabel={rfp.scoreLabel}
            recommendation={null}
            dceAnalyzed={false}
            onAnalyzeDce={handleOpenFilePicker}
          />

          <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center shadow-sm">
            <div className="w-16 h-16 bg-gradient-to-br from-indigo-100 to-violet-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Search className="w-7 h-7 text-indigo-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Analysez le DCE pour débloquer l&apos;analyse IA</h3>
            <p className="text-slate-500 text-sm mb-6 max-w-md mx-auto">
              Déposez le document de consultation (PDF) pour obtenir le scoring, les critères de sélection et le plan technique.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={() => dce.analyzeFromUrl(id)}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold bg-gradient-to-r from-indigo-500 to-violet-500 text-white hover:from-indigo-600 hover:to-violet-600 transition-all shadow-md hover:shadow-lg"
              >
                <Search className="w-4 h-4" />
                Analyser automatiquement
              </button>
              <button
                onClick={handleOpenFilePicker}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-all"
              >
                <FileUp className="w-4 h-4" />
                Charger un PDF
              </button>
            </div>
            <p className="text-slate-400 text-xs mt-3">
              L&apos;analyse automatique récupère le DCE depuis le profil acheteur. Si indisponible, chargez le PDF manuellement.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const daysLeft = daysUntil(rfp.deadline);
  const progress = computeProgress(workspace, detail.requiredDocumentsDetailed.length, detail.technicalPlanSections.length);

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

      {/* Hidden file input for DCE picker */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf"
        className="hidden"
        onChange={handleFileInputChange}
        aria-label="Choisir un fichier DCE"
      />

      {/* DCE Drop Zone Overlay */}
      <DceDropZone
        state={dce.state}
        progress={dce.progress}
        error={dce.error}
        fallbackUrl={dce.fallbackUrl}
        onDrop={dce.analyzeDce}
        onReset={dce.reset}
        onOpenFilePicker={handleOpenFilePicker}
      />

      <div className="max-w-7xl mx-auto py-10">
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
              dceAnalyzed={dceAnalyzed}
              onAnalyzeDce={handleOpenFilePicker}
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
                dceContext={detail.aiSummary}
                selectionCriteria={detail.selectionCriteria}
                aoId={id}
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
