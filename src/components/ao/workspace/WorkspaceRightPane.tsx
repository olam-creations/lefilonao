'use client';

import { forwardRef } from 'react';
import MemoireTechniqueBuilder from '../MemoireTechniqueBuilder';
import type { TechnicalPlanSection, CompanyProfile, SelectionCriteria, CoachResponse } from '@/lib/dev';

interface WorkspaceRightPaneProps {
  sections: TechnicalPlanSection[];
  reviewed: Record<string, boolean>;
  onToggleReviewed: (sectionId: string) => void;
  profile?: CompanyProfile | null;
  dceContext?: string;
  selectionCriteria?: SelectionCriteria[];
  aoId?: string;
  prefilledCoachData?: CoachResponse | null;
  highlightedSectionId?: string | null;
}

const WorkspaceRightPane = forwardRef<HTMLDivElement, WorkspaceRightPaneProps>(
  function WorkspaceRightPane({
    sections,
    reviewed,
    onToggleReviewed,
    profile,
    dceContext,
    selectionCriteria,
    aoId,
    prefilledCoachData,
    highlightedSectionId,
  }, ref) {
    return (
      <div ref={ref}>
        <MemoireTechniqueBuilder
          sections={sections}
          reviewed={reviewed}
          onToggleReviewed={onToggleReviewed}
          profile={profile}
          dceContext={dceContext}
          selectionCriteria={selectionCriteria}
          aoId={aoId}
          prefilledCoachData={prefilledCoachData}
        />

        {/* Hidden anchor elements for section scrolling */}
        {highlightedSectionId && (
          <style>{`
            [data-section-id="${highlightedSectionId}"] {
              animation: workspace-highlight 2s ease-out;
            }
            @keyframes workspace-highlight {
              0%, 20% { box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.4); }
              100% { box-shadow: none; }
            }
          `}</style>
        )}
      </div>
    );
  }
);

export default WorkspaceRightPane;
