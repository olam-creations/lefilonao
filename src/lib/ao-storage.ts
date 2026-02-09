import type { WorkspaceState } from './ao-utils';

const STORAGE_PREFIX = 'lefilonao_workspace_';

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
