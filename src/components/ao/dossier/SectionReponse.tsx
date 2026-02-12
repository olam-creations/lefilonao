'use client';

import DocumentSplitView from '@/components/ao/DocumentSplitView';
import MemoireTechniqueBuilder from '@/components/ao/MemoireTechniqueBuilder';
import DossierExportCard from '@/components/ao/DossierExportCard';
import type { AoDetail, CompanyProfile } from '@/lib/dev';
import type { WorkspaceState } from '@/lib/ao-utils';
import type { AoUploadedFile } from '@/lib/dev';

interface SectionReponseProps {
  analysis: AoDetail;
  profile: CompanyProfile;
  workspace: WorkspaceState;
  rfp: { title: string; issuer: string; deadline: string | null; budget: string | null };
  aoId: string;
  onToggleDoc: (docName: string) => void;
  onToggleSection: (sectionId: string) => void;
  onAoFileUpload: (documentName: string, file: File) => Promise<void>;
  onAoFileDelete: (fileId: string) => void;
}

export default function SectionReponse({
  analysis, profile, workspace, rfp, aoId,
  onToggleDoc, onToggleSection, onAoFileUpload, onAoFileDelete,
}: SectionReponseProps) {
  return (
    <section id="section-reponse" className="space-y-8 scroll-mt-16">
      <h2 className="text-lg font-bold text-slate-900">Preparer ma reponse</h2>

      <DossierExportCard
        profile={profile}
        rfp={{ title: rfp.title, issuer: rfp.issuer, deadline: rfp.deadline ?? '', budget: rfp.budget ?? '' }}
        sections={analysis.technicalPlanSections}
        workspace={workspace}
        documentsDetailed={analysis.requiredDocumentsDetailed}
      />

      <DocumentSplitView
        documents={analysis.requiredDocumentsDetailed}
        ready={workspace.documentsReady}
        onToggle={onToggleDoc}
        profileDocuments={profile.documents}
        onAoFileUpload={onAoFileUpload}
        aoFiles={workspace.aoFiles ?? []}
        onAoFileDelete={onAoFileDelete}
      />

      <MemoireTechniqueBuilder
        sections={analysis.technicalPlanSections}
        reviewed={workspace.sectionsReviewed}
        onToggleReviewed={onToggleSection}
        profile={profile}
        dceContext={analysis.aiSummary}
        selectionCriteria={analysis.selectionCriteria}
        aoId={aoId}
        prefilledCoachData={null}
      />
    </section>
  );
}
