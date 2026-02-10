'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Shield } from 'lucide-react';
import { markOnboardingStep } from '@/lib/auth';
import TopBar from '@/components/dashboard/TopBar';
import { isDevMode, MOCK_COMPANY_PROFILE, type CompanyProfile, type ProfileDocument, type TeamMember, type ProjectReference } from '@/lib/dev';
import { getCompanyProfile, saveCompanyProfile } from '@/lib/profile-storage';
import { uploadFile, downloadFile, deleteFile, triggerDownload } from '@/lib/file-storage';
import CompanyInfoCard from '@/components/profile/CompanyInfoCard';
import AdminDocumentsCard from '@/components/profile/AdminDocumentsCard';
import TeamReferencesCard from '@/components/profile/TeamReferencesCard';
import SectorsRegionsCard from '@/components/profile/SectorsRegionsCard';
import CachetUploadCard from '@/components/profile/CachetUploadCard';

export default function ProfilePage() {
  const [profile, setProfile] = useState<CompanyProfile>(MOCK_COMPANY_PROFILE);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isDevMode()) {
      setProfile(getCompanyProfile());
    }
    markOnboardingStep('profile');
    setLoading(false);
  }, []);

  const handleSaveProfile = useCallback((updated: CompanyProfile) => {
    setProfile(updated);
    saveCompanyProfile(updated);
  }, []);

  const handleUpload = useCallback(async (docName: string, file: File) => {
    const result = await uploadFile(file, 'profile');
    setProfile((prev) => {
      const updatedDocs: ProfileDocument[] = prev.documents.map((d) =>
        d.name === docName
          ? {
              ...d,
              status: 'valid' as const,
              expiresAt: d.expiresAt ?? new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
              fileId: result.id,
              fileName: result.fileName,
              fileSize: result.fileSize,
              mimeType: result.mimeType,
              uploadedAt: result.uploadedAt,
            }
          : d,
      );
      const next = { ...prev, documents: updatedDocs };
      saveCompanyProfile(next);
      return next;
    });
  }, []);

  const handleDownload = useCallback(async (docName: string) => {
    const doc = profile.documents.find((d) => d.name === docName);
    if (!doc?.fileId || !doc.fileName) return;
    const blob = await downloadFile(doc.fileId);
    if (blob) {
      triggerDownload(blob, doc.fileName);
    }
  }, [profile]);

  const handleDelete = useCallback(async (docName: string) => {
    const doc = profile.documents.find((d) => d.name === docName);
    if (doc?.fileId) {
      await deleteFile(doc.fileId);
    }
    setProfile((prev) => {
      const updatedDocs: ProfileDocument[] = prev.documents.map((d) =>
        d.name === docName
          ? { ...d, status: 'missing' as const, fileId: null, fileName: null, fileSize: null, mimeType: null, uploadedAt: null }
          : d,
      );
      const next = { ...prev, documents: updatedDocs };
      saveCompanyProfile(next);
      return next;
    });
  }, [profile]);

  const handleCvUpload = useCallback(async (memberName: string, file: File) => {
    const result = await uploadFile(file, 'cv');
    setProfile((prev) => {
      const updatedTeam: TeamMember[] = prev.team.map((m) =>
        m.name === memberName
          ? {
              ...m,
              cvFileId: result.id,
              cvFileName: result.fileName,
              cvFileSize: result.fileSize,
              cvMimeType: result.mimeType,
              cvUploadedAt: result.uploadedAt,
            }
          : m,
      );
      const next = { ...prev, team: updatedTeam };
      saveCompanyProfile(next);
      return next;
    });
  }, []);

  const handleCvDownload = useCallback(async (memberName: string) => {
    const member = profile.team.find((m) => m.name === memberName);
    if (!member?.cvFileId || !member.cvFileName) return;
    const blob = await downloadFile(member.cvFileId);
    if (blob) {
      triggerDownload(blob, member.cvFileName);
    }
  }, [profile]);

  const handleCvDelete = useCallback(async (memberName: string) => {
    const member = profile.team.find((m) => m.name === memberName);
    if (member?.cvFileId) {
      await deleteFile(member.cvFileId);
    }
    setProfile((prev) => {
      const updatedTeam: TeamMember[] = prev.team.map((m) =>
        m.name === memberName
          ? { ...m, cvFileId: null, cvFileName: null, cvFileSize: null, cvMimeType: null, cvUploadedAt: null }
          : m,
      );
      const next = { ...prev, team: updatedTeam };
      saveCompanyProfile(next);
      return next;
    });
  }, [profile]);

  const handleSaveTeam = useCallback((team: TeamMember[]) => {
    setProfile((prev) => {
      const next = { ...prev, team };
      saveCompanyProfile(next);
      return next;
    });
  }, []);

  const handleSaveReferences = useCallback((references: ProjectReference[]) => {
    setProfile((prev) => {
      const next = { ...prev, references };
      saveCompanyProfile(next);
      return next;
    });
  }, []);

  const handleSaveSectorsRegions = useCallback((sectors: string[], regions: string[]) => {
    setProfile((prev) => {
      const next = { ...prev, sectors, regions };
      saveCompanyProfile(next);
      return next;
    });
  }, []);

  const handleSaveCachet = useCallback((base64: string | undefined) => {
    setProfile((prev) => {
      const next = { ...prev, cachetBase64: base64 };
      saveCompanyProfile(next);
      return next;
    });
  }, []);

  const validDocs = profile.documents.filter((d) => d.status === 'valid' || d.status === 'expiring').length;
  const totalDocs = profile.documents.length;
  const cvCount = profile.team.filter((m) => m.cvFileId).length;
  const teamTotal = profile.team.length;
  const infoFields = [
    profile.companyName, profile.siret, profile.legalForm,
    profile.address, profile.city, profile.postalCode,
    profile.phone, profile.email, profile.naf, profile.caN1,
  ];
  const filledInfo = infoFields.filter((f) => f && f.trim() !== '').length;
  const hasRefs = profile.references.length > 0;
  const hasSectors = profile.sectors.length > 0;
  const totalChecks = totalDocs + teamTotal + infoFields.length + 2;
  const doneChecks = validDocs + cvCount + filledInfo + (hasRefs ? 1 : 0) + (hasSectors ? 1 : 0);
  const pct = totalChecks > 0 ? Math.round((doneChecks / totalChecks) * 100) : 0;

  if (loading) {
    return (
      <div className="animate-fade-in">
        <TopBar title="Profil Entreprise" description="Coffre-fort de vos documents récurrents" />
        <div className="max-w-7xl mx-auto py-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="skeleton h-64 rounded-2xl" />
            <div className="skeleton h-64 rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <TopBar 
        title="Profil Entreprise" 
        description="Coffre-fort de vos documents récurrents" 
        icon={<Shield className="w-6 h-6 text-indigo-600" />}
      />

      <div className="max-w-7xl mx-auto py-10">
        {/* Summary bar */}
        <div className={`rounded-xl px-4 py-3 mb-8 flex items-center gap-3 ${
          pct === 100 ? 'bg-emerald-50 border border-emerald-200' : 'bg-indigo-50 border border-indigo-200'
        }`}>
          <div className={`text-sm font-medium ${pct === 100 ? 'text-emerald-700' : 'text-indigo-700'}`}>
            Profil complet a {pct}%
          </div>
          <div className="flex-1 h-2 bg-white/60 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                pct === 100 ? 'bg-emerald-500' : 'bg-gradient-to-r from-indigo-400 to-violet-500'
              }`}
              style={{ width: `${pct}%` }}
            />
          </div>
          <span className={`text-sm font-bold ${pct === 100 ? 'text-emerald-600' : 'text-indigo-600'}`}>
            {pct}%
          </span>
        </div>

        {/* 2-column grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <CompanyInfoCard profile={profile} onSave={handleSaveProfile} />
          <AdminDocumentsCard
            documents={profile.documents}
            onUpload={handleUpload}
            onDownload={handleDownload}
            onDelete={handleDelete}
          />
          <TeamReferencesCard
            team={profile.team}
            references={profile.references}
            onSaveTeam={handleSaveTeam}
            onSaveReferences={handleSaveReferences}
            onCvUpload={handleCvUpload}
            onCvDownload={handleCvDownload}
            onCvDelete={handleCvDelete}
          />
          <SectorsRegionsCard
            sectors={profile.sectors}
            regions={profile.regions}
            onSave={handleSaveSectorsRegions}
          />
          <CachetUploadCard
            cachetBase64={profile.cachetBase64}
            onSave={handleSaveCachet}
          />
        </div>
      </div>
    </div>
  );
}
