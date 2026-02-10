'use client';

import DocumentSplitView from './DocumentSplitView';
import MemoireTechniqueBuilder from './MemoireTechniqueBuilder';
import DossierExportCard from './DossierExportCard';
import type { RequiredDocumentDetailed, TechnicalPlanSection, ProfileDocument, CompanyProfile, AoUploadedFile, SelectionCriteria, CoachResponse } from '@/lib/dev';
import type { WorkspaceState } from '@/lib/ao-utils';

interface TabReponseProps {
  documents: RequiredDocumentDetailed[];
  documentsReady: Record<string, boolean>;
  onToggleDoc: (docName: string) => void;
  profileDocuments: ProfileDocument[];
  sections: TechnicalPlanSection[];
  sectionsReviewed: Record<string, boolean>;
  onToggleSection: (sectionId: string) => void;
  profile: CompanyProfile;
  rfp: { title: string; issuer: string; deadline: string; budget: string };
  workspace: WorkspaceState;
  onAoFileUpload: (documentName: string, file: File) => Promise<void>;
  aoFiles: AoUploadedFile[];
  onAoFileDelete: (fileId: string) => void;
  dceContext?: string;
  selectionCriteria?: SelectionCriteria[];
  aoId?: string;
  prefilledCoachData?: CoachResponse | null;
}

export default function TabReponse({
  documents, documentsReady, onToggleDoc, profileDocuments,
  sections, sectionsReviewed, onToggleSection,
  profile, rfp, workspace,
  onAoFileUpload, aoFiles, onAoFileDelete,
  dceContext, selectionCriteria, aoId,
  prefilledCoachData,
}: TabReponseProps) {
  return (
    <div className="space-y-8">
      <DossierExportCard
        profile={profile}
        rfp={rfp}
        sections={sections}
        workspace={workspace}
        documentsDetailed={documents}
      />
      <DocumentSplitView
        documents={documents}
        ready={documentsReady}
        onToggle={onToggleDoc}
        profileDocuments={profileDocuments}
        onAoFileUpload={onAoFileUpload}
        aoFiles={aoFiles}
        onAoFileDelete={onAoFileDelete}
      />
      <MemoireTechniqueBuilder
        sections={sections}
        reviewed={sectionsReviewed}
        onToggleReviewed={onToggleSection}
        profile={profile}
        dceContext={dceContext}
        selectionCriteria={selectionCriteria}
        aoId={aoId}
        prefilledCoachData={prefilledCoachData}
      />
    </div>
  );
}
