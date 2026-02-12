'use client';

import { useState, useEffect, useCallback } from 'react';
import { usePrecomputedAnalysis } from './usePrecomputedAnalysis';
import { useUserSettings } from './useUserSettings';
import { daysUntil, computeProgress } from '@/lib/ao-utils';
import { getWorkspaceState, saveWorkspaceState, getDceAnalysis } from '@/lib/ao-storage';
import { getCompanyProfile } from '@/lib/profile-storage';
import { uploadFile } from '@/lib/file-storage';
import { isDevMode, MOCK_RFPS, MOCK_AO_DETAILS } from '@/lib/dev';
import type { AoDetail, CompanyProfile, AoUploadedFile } from '@/lib/dev';
import type { WorkspaceState } from '@/lib/ao-utils';
import type { BoampNoticeData } from '@/lib/notice-transform';
import type { BoampEnrichedData } from '@/lib/boamp-enrichment';
import type { BoampLot } from '@/components/ao/AoNoticeDetails';

interface RfpData {
  id: string;
  title: string;
  issuer: string;
  deadline: string | null;
  score: number;
  scoreLabel: 'GO' | 'MAYBE' | 'PASS';
  budget: string | null;
  region: string | null;
  source: string;
  url: string;
  publishedAt: string;
}

export interface Amendment {
  id: string;
  notice_id: string;
  amendment_type: string;
  summary: string | null;
  published_at: string;
  source_url: string | null;
}

export interface UseAoDossierReturn {
  // Core data
  rfp: RfpData | null;
  notice: BoampNoticeData | null;
  lots: BoampLot[];
  enriched: BoampEnrichedData | null;
  // Analysis (from precomputed or localStorage)
  analysis: AoDetail | null;
  analysisStatus: 'loading' | 'done' | 'processing' | 'unavailable';
  // Workspace
  workspace: WorkspaceState;
  profile: CompanyProfile | null;
  // Amendments
  amendments: Amendment[];
  // Computed
  loading: boolean;
  hasAnalysis: boolean;
  daysLeft: number | null;
  progress: number;
  // User settings
  settings: ReturnType<typeof useUserSettings>['settings'];
  // Actions
  updateWorkspace: (updater: (prev: WorkspaceState) => WorkspaceState) => void;
  handleToggleDoc: (docName: string) => void;
  handleToggleSection: (sectionId: string) => void;
  handleAoFileUpload: (documentName: string, file: File) => Promise<void>;
  handleAoFileDelete: (fileId: string) => void;
}

const EMPTY_WORKSPACE: WorkspaceState = {
  decisionMade: false,
  documentsReady: {},
  sectionsReviewed: {},
  aoFiles: [],
};

export function useAoDossier(id: string): UseAoDossierReturn {
  const [rfp, setRfp] = useState<RfpData | null>(null);
  const [notice, setNotice] = useState<BoampNoticeData | null>(null);
  const [lots, setLots] = useState<BoampLot[]>([]);
  const [enriched, setEnriched] = useState<BoampEnrichedData | null>(null);
  const [localAnalysis, setLocalAnalysis] = useState<AoDetail | null>(null);
  const [workspace, setWorkspace] = useState<WorkspaceState>(EMPTY_WORKSPACE);
  const [profile, setProfile] = useState<CompanyProfile | null>(null);
  const [amendments, setAmendments] = useState<Amendment[]>([]);
  const [loading, setLoading] = useState(true);

  const { settings } = useUserSettings();
  const precomputed = usePrecomputedAnalysis(id);

  // Merge analysis: prefer precomputed, fallback to localStorage
  const analysis = precomputed.analysis ?? localAnalysis;
  const analysisStatus = precomputed.status;

  // Fetch core data
  useEffect(() => {
    const loadData = async () => {
      try {
        const res = await fetch(`/api/opportunities/${encodeURIComponent(id)}`);
        if (res.ok) {
          const json = await res.json();
          setRfp(json.rfp);
          if (json.notice) setNotice(json.notice);
          if (json.lots) setLots(json.lots);

          if (json.enriched) {
            setEnriched(json.enriched);
          } else {
            try {
              const boampRes = await fetch(`/api/boamp/${encodeURIComponent(id)}`);
              if (boampRes.ok) {
                const boampJson = await boampRes.json();
                if (boampJson.enriched) setEnriched(boampJson.enriched);
              }
            } catch { /* enrichment is best-effort */ }
          }

          const savedDce = getDceAnalysis(id);
          if (savedDce) setLocalAnalysis(savedDce);

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
          setLocalAnalysis(savedDce);
          setRfp(MOCK_RFPS.find((r) => r.id === id) || null);
        } else {
          setRfp(MOCK_RFPS.find((r) => r.id === id) || null);
          setLocalAnalysis(MOCK_AO_DETAILS[id] || null);
        }
      }

      setWorkspace(getWorkspaceState(id));
      setProfile(getCompanyProfile());
      setLoading(false);
    };

    loadData();
  }, [id]);

  // Fetch amendments (lazy, non-blocking)
  useEffect(() => {
    const loadAmendments = async () => {
      try {
        const res = await fetch(`/api/opportunities/${encodeURIComponent(id)}/amendments`);
        if (res.ok) {
          const json = await res.json();
          setAmendments(json.amendments ?? []);
        }
      } catch { /* non-critical */ }
    };

    if (!loading && rfp) loadAmendments();
  }, [id, loading, rfp]);

  // Workspace actions
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

  // Computed values
  const hasAnalysis = !!(analysis && profile);
  const daysLeft = rfp ? daysUntil(rfp.deadline) : null;
  const progress = hasAnalysis && analysis
    ? computeProgress(workspace, analysis.requiredDocumentsDetailed.length, analysis.technicalPlanSections.length)
    : 0;

  return {
    rfp,
    notice,
    lots,
    enriched,
    analysis,
    analysisStatus,
    workspace,
    profile,
    amendments,
    loading,
    hasAnalysis,
    daysLeft,
    progress,
    settings,
    updateWorkspace,
    handleToggleDoc,
    handleToggleSection,
    handleAoFileUpload,
    handleAoFileDelete,
  };
}
