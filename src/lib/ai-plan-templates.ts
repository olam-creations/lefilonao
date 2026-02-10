import { createPlan, type AiPlan } from './ai-plan';
import type { TechnicalPlanSection, CompanyProfile } from './dev';

interface BatchGenerateInput {
  sections: TechnicalPlanSection[];
  profile: CompanyProfile;
  dceContext: string;
}

export function createBatchGeneratePlan(input: BatchGenerateInput): AiPlan {
  const { sections, profile, dceContext } = input;

  return createPlan(
    sections.map((section, i) => ({
      id: `gen-${section.id}`,
      type: 'generate_section' as const,
      params: {
        sectionIndex: i,
        sectionId: section.id,
        sectionTitle: section.title,
        buyerExpectation: section.buyerExpectation,
        dceContext,
        companyProfile: {
          companyName: profile.companyName,
          sectors: profile.sectors,
          references: profile.references,
          team: profile.team,
          caN1: profile.caN1,
          caN2: profile.caN2,
          caN3: profile.caN3,
        },
        options: { tone: 'standard', length: 'medium' },
      },
    })),
  );
}

interface FullAnalysisInput {
  file: { buffer: ArrayBuffer };
  profile: CompanyProfile;
  dceContext: string;
  selectionCriteria: { name: string; weight: number }[];
}

export function createFullAnalysisPlan(input: FullAnalysisInput): AiPlan {
  const { profile, dceContext, selectionCriteria } = input;

  return createPlan([
    {
      id: 'analyze',
      type: 'analyze_dce' as const,
      params: {
        file: input.file,
      },
    },
    {
      id: 'generate-all',
      type: 'generate_section' as const,
      params: {
        batchMode: true,
        dceContext,
        companyProfile: {
          companyName: profile.companyName,
          sectors: profile.sectors,
          references: profile.references,
          team: profile.team,
          caN1: profile.caN1,
          caN2: profile.caN2,
          caN3: profile.caN3,
        },
        sections: '{{step[0].result.technicalPlanSections}}',
      },
    },
    {
      id: 'coach',
      type: 'coach_review' as const,
      params: {
        dceContext,
        selectionCriteria,
        profile: {
          companyName: profile.companyName,
          sectors: profile.sectors,
          references: profile.references,
          team: profile.team,
          caN1: profile.caN1,
          caN2: profile.caN2,
          caN3: profile.caN3,
        },
        sections: '{{step[1].result}}',
      },
    },
  ]);
}
