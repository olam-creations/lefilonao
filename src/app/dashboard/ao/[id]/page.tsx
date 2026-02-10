'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ExternalLink, Search, FileUp } from 'lucide-react';
import { useUser } from '@/components/UserProvider';
import { useUserSettings } from '@/hooks/useUserSettings';
import TopBar from '@/components/dashboard/TopBar';
import { isDevMode, MOCK_RFPS, MOCK_AO_DETAILS, type AoDetail, type CompanyProfile, type AoUploadedFile, type CoachResponse } from '@/lib/dev';
import { daysUntil, computeProgress } from '@/lib/ao-utils';
import { getWorkspaceState, saveWorkspaceState, getDceAnalysis, saveDceAnalysis, saveGeneratedSections } from '@/lib/ao-storage';
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
import WorkspaceLayout from '@/components/ao/workspace/WorkspaceLayout';
import WorkspaceLeftPane from '@/components/ao/workspace/WorkspaceLeftPane';
import WorkspaceRightPane from '@/components/ao/workspace/WorkspaceRightPane';
import WorkspaceCoachBar from '@/components/ao/workspace/WorkspaceCoachBar';
import ProBadge from '@/components/shared/ProBadge';
import UpgradeModal from '@/components/shared/UpgradeModal';
import { usePlan } from '@/hooks/usePlan';
import DceDropZone from '@/components/ao/DceDropZone';
import MultiAgentProgress from '@/components/ao/MultiAgentProgress';
import { useDceAnalysis } from '@/hooks/useDceAnalysis';
import { useMultiAgentAnalysis } from '@/hooks/useMultiAgentAnalysis';
import { usePrecomputedAnalysis } from '@/hooks/usePrecomputedAnalysis';
import { mapMultiAgentToAoDetail, mapReviewToCoachData } from '@/lib/multi-agent-adapter';

export default function AoDetailPage() {
  const { email } = useUser();
  const params = useParams();
  const id = params.id as string;
  const [rfp, setRfp] = useState<typeof MOCK_RFPS[0] | null>(null);
  const [detail, setDetail] = useState<AoDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [workspace, setWorkspace] = useState<WorkspaceState>({ decisionMade: false, documentsReady: {}, sectionsReviewed: {}, aoFiles: [] });
  const [activeTab, setActiveTab] = useState<AoTab>('essentiel');
  const [profile, setProfile] = useState<CompanyProfile | null>(null);
  const [dceAnalyzed, setDceAnalyzed] = useState(false);
  const [activeCriterion, setActiveCriterion] = useState<string | null>(null);
  const [highlightedSectionId, setHighlightedSectionId] = useState<string | null>(null);

  const { settings } = useUserSettings();
  const dce = useDceAnalysis();
  const multiAgent = useMultiAgentAnalysis();
  const { can, isPro } = usePlan();
  const precomputed = usePrecomputedAnalysis(id);
  const [analysisMode, setAnalysisMode] = useState<'quick' | 'complete'>('quick');
  const [prefilledCoachData, setPrefilledCoachData] = useState<CoachResponse | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
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

  // Auto-populate from precomputed server-side analysis (Pro users)
  useEffect(() => {
    if (precomputed.status === 'done' && precomputed.analysis && !dceAnalyzed) {
      setDetail(precomputed.analysis);
      setDceAnalyzed(true);
      saveDceAnalysis(id, precomputed.analysis);
    }
  }, [precomputed.status, precomputed.analysis, dceAnalyzed, id]);

  useEffect(() => {
    if (dce.state === 'done' && dce.result) {
      setDetail(dce.result);
      setDceAnalyzed(true);
      saveDceAnalysis(id, dce.result);

      // Sync score to user_rfps if imported
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
  }, [dce.state, dce.result, id, email]);

  // Multi-agent pipeline completion
  useEffect(() => {
    if (multiAgent.pipeline !== 'done') return;
    if (!multiAgent.analysis) return;

    const mapped = mapMultiAgentToAoDetail({
      parsed: multiAgent.parsedDce,
      intel: multiAgent.intelligence,
      analysis: multiAgent.analysis,
      sections: multiAgent.sections,
      review: multiAgent.review,
    });

    setDetail(mapped);
    setDceAnalyzed(true);
    saveDceAnalysis(id, mapped);

    // Pre-fill coach data from reviewer agent
    if (multiAgent.review) {
      setPrefilledCoachData(mapReviewToCoachData(multiAgent.review));
    }

    // Save generated sections for MemoireTechniqueBuilder
    if (multiAgent.sections.size > 0) {
      const sectionsRecord: Record<string, { id: string; title: string; aiDraft: string; buyerExpectation: string; wordCount: number }> = {};
      multiAgent.sections.forEach((s) => {
        sectionsRecord[s.sectionId] = {
          id: s.sectionId,
          title: s.title,
          aiDraft: s.content,
          buyerExpectation: '',
          wordCount: s.wordCount,
        };
      });
      saveGeneratedSections(id, sectionsRecord);
    }

    // Sync score to user_rfps
    if (email && mapped.scoreCriteria.length > 0) {
      const avgScore = Math.round(
        mapped.scoreCriteria.reduce((a, c) => a + c.score, 0) / mapped.scoreCriteria.length
      );
      const normalized = Math.round((avgScore / 20) * 100);
      const scoreLabel = normalized >= 70 ? 'GO' : normalized >= 50 ? 'MAYBE' : 'PASS';

      fetch('/api/rfps', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_email: email, notice_id: id, score: normalized, score_label: scoreLabel, status: 'analyzing' }),
      }).catch(() => {});
    }
  }, [multiAgent.pipeline, multiAgent.analysis, multiAgent.parsedDce, multiAgent.intelligence, multiAgent.sections, multiAgent.review, id, email]);

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

  // Workspace: criterion → section linking
  const handleCriterionClick = useCallback((criterionName: string) => {
    setActiveCriterion(criterionName);
    // Find matching section by fuzzy keyword match
    if (!detail) return;
    const lower = criterionName.toLowerCase();
    const match = detail.technicalPlanSections.find((s) =>
      s.title.toLowerCase().includes(lower) || lower.includes(s.title.toLowerCase().split(' ')[0])
    );
    if (match) {
      setHighlightedSectionId(match.id);
      // Scroll to section in right pane
      const el = document.querySelector(`[data-section-id="${match.id}"]`);
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // Clear highlight after animation
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

  const handleOpenFilePicker = useCallback(() => {
    if (!can('dce-analysis')) {
      setShowUpgradeModal(true);
      return;
    }
    fileInputRef.current?.click();
  }, [can]);

  const handleFileDrop = useCallback((file: File) => {
    if (!can('dce-analysis')) {
      setShowUpgradeModal(true);
      return;
    }
    if (analysisMode === 'complete' && profile) {
      multiAgent.execute({
        file,
        profile: {
          companyName: profile.companyName,
          siret: profile.siret,
          sectors: profile.sectors,
          caN1: profile.caN1,
          caN2: profile.caN2,
          caN3: profile.caN3,
          references: profile.references,
          team: profile.team,
        },
      });
    } else {
      dce.analyzeDce(file);
    }
  }, [analysisMode, profile, multiAgent, dce, can]);

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      handleFileDrop(file);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [handleFileDrop]);

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
    // Show processing spinner if precomputed analysis is being prepared
    const isServerProcessing = precomputed.status === 'processing';
    // Show teaser for Free users when analysis exists server-side
    const hasTeaser = !isPro && precomputed.status === 'done' && precomputed.teaser;

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
          onDrop={handleFileDrop}
          onReset={dce.reset}
          onOpenFilePicker={handleOpenFilePicker}
          analysisMode={analysisMode}
          onAnalysisModeChange={setAnalysisMode}
          hideProgressStates={analysisMode === 'complete' && multiAgent.pipeline !== 'idle'}
        />

        <MultiAgentProgress
          agents={multiAgent.agents}
          progress={multiAgent.progress}
          sectionStreams={multiAgent.sectionStreams}
          sections={multiAgent.sections}
          review={multiAgent.review}
          totalMs={multiAgent.totalMs}
          error={multiAgent.error}
          pipeline={multiAgent.pipeline}
          onAbort={multiAgent.abort}
          onDismiss={multiAgent.reset}
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

          {/* Server-side processing indicator */}
          {isServerProcessing && (
            <div className="bg-indigo-50 rounded-2xl border border-indigo-100 p-6 text-center">
              <div className="w-10 h-10 border-2 border-indigo-300 border-t-indigo-600 rounded-full animate-spin mx-auto mb-3" />
              <p className="text-indigo-700 text-sm font-medium">Analyse en cours de preparation...</p>
              <p className="text-indigo-400 text-xs mt-1">L&apos;analyse sera disponible dans quelques instants</p>
            </div>
          )}

          {/* Free user teaser */}
          {hasTeaser && precomputed.teaser && (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center shadow-sm relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-white/90 pointer-events-none z-10" />
              <div className="blur-[2px]">
                <p className="text-2xl font-bold mb-2">
                  {precomputed.teaser.verdict === 'go' ? 'GO' : precomputed.teaser.verdict === 'maybe' ? 'MAYBE' : 'PASS'}
                </p>
                <p className="text-slate-500 text-sm">{precomputed.teaser.executiveSummary}</p>
                <p className="text-slate-400 text-xs mt-2">{precomputed.teaser.criteriaCount} criteres de selection identifies</p>
              </div>
              <div className="relative z-20 mt-4">
                <button
                  onClick={() => setShowUpgradeModal(true)}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold bg-gradient-to-r from-indigo-500 to-violet-500 text-white hover:from-indigo-600 hover:to-violet-600 transition-all shadow-md"
                >
                  Debloquer l&apos;analyse complete <ProBadge />
                </button>
              </div>
            </div>
          )}

          {/* Manual analysis prompt (shown when no server processing) */}
          {!isServerProcessing && !hasTeaser && (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center shadow-sm">
              <div className="w-16 h-16 bg-gradient-to-br from-indigo-100 to-violet-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Search className="w-7 h-7 text-indigo-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Analysez le DCE pour débloquer l&apos;analyse IA</h3>
              <p className="text-slate-500 text-sm mb-4 max-w-md mx-auto">
                Déposez le document de consultation (PDF) pour obtenir le scoring, les critères de sélection et le plan technique.
              </p>
              <div className="flex items-center justify-center gap-1 p-1 bg-slate-100 rounded-xl mb-6 w-fit mx-auto">
                <button
                  onClick={() => setAnalysisMode('quick')}
                  className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                    analysisMode === 'quick'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  Rapide
                </button>
                <button
                  onClick={() => setAnalysisMode('complete')}
                  className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
                    analysisMode === 'complete'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  Complet <ProBadge />
                </button>
              </div>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  onClick={() => {
                    if (!can('dce-analysis')) {
                      setShowUpgradeModal(true);
                      return;
                    }
                    dce.analyzeFromUrl(id);
                  }}
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
          )}

          <UpgradeModal
            open={showUpgradeModal}
            onClose={() => setShowUpgradeModal(false)}
            featureLabel="Analyse DCE par IA"
          />
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
        onDrop={handleFileDrop}
        onReset={dce.reset}
        onOpenFilePicker={handleOpenFilePicker}
        analysisMode={analysisMode}
        onAnalysisModeChange={setAnalysisMode}
        hideProgressStates={analysisMode === 'complete' && multiAgent.pipeline !== 'idle'}
      />

      {/* Multi-Agent Progress Overlay */}
      <MultiAgentProgress
        agents={multiAgent.agents}
        progress={multiAgent.progress}
        sectionStreams={multiAgent.sectionStreams}
        sections={multiAgent.sections}
        review={multiAgent.review}
        totalMs={multiAgent.totalMs}
        error={multiAgent.error}
        pipeline={multiAgent.pipeline}
        onAbort={multiAgent.abort}
        onDismiss={multiAgent.reset}
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
                prefilledCoachData={prefilledCoachData}
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
                    prefilledCoachData={prefilledCoachData}
                    highlightedSectionId={highlightedSectionId}
                  />
                }
                coachBar={
                  prefilledCoachData?.suggestions ? (
                    <WorkspaceCoachBar suggestions={prefilledCoachData.suggestions} />
                  ) : undefined
                }
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
