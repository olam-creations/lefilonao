import type { WorkspaceState } from './ao-utils';
import type { AoDetail, TechnicalPlanSection } from './dev';

const STORAGE_PREFIX = 'lefilonao_workspace_';
const DCE_PREFIX = 'lefilonao_dce_';
const SECTIONS_PREFIX = 'lefilonao_sections_';

function defaultState(): WorkspaceState {
  return {
    decisionMade: false,
    documentsReady: {},
    sectionsReviewed: {},
    aoFiles: [],
  };
}

export function getWorkspaceState(aoId: string): WorkspaceState {
  if (typeof window === 'undefined') return defaultState();
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${aoId}`);
    if (!raw) return defaultState();
    return { ...defaultState(), ...JSON.parse(raw) };
  } catch {
    return defaultState();
  }
}

export function saveWorkspaceState(aoId: string, state: WorkspaceState): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(`${STORAGE_PREFIX}${aoId}`, JSON.stringify(state));
}

export function getDceAnalysis(aoId: string): AoDetail | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(`${DCE_PREFIX}${aoId}`);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function saveDceAnalysis(aoId: string, detail: AoDetail): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(`${DCE_PREFIX}${aoId}`, JSON.stringify(detail));
}

export function getGeneratedSections(aoId: string): Record<string, TechnicalPlanSection> | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(`${SECTIONS_PREFIX}${aoId}`);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function saveGeneratedSections(aoId: string, sections: Record<string, TechnicalPlanSection>): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(`${SECTIONS_PREFIX}${aoId}`, JSON.stringify(sections));
}
