export interface TimelineMilestone {
  label: string;
  date: string;
  status: 'done' | 'current' | 'upcoming';
}

export function computeTimeline(publishedAt: string, deadline: string): TimelineMilestone[] {
  const pub = new Date(publishedAt).getTime();
  const end = new Date(deadline).getTime();
  const now = Date.now();
  const total = end - pub;

  const milestones = [
    { label: 'Publication', ratio: 0 },
    { label: 'Analyse DCE', ratio: 0.1 },
    { label: 'Décision Go/No-Go', ratio: 0.2 },
    { label: 'Rédaction', ratio: 0.5 },
    { label: 'Relecture', ratio: 0.85 },
    { label: 'Dépôt', ratio: 1 },
  ];

  const elapsed = (now - pub) / total;

  return milestones.map((m) => {
    const date = new Date(pub + total * m.ratio);
    const dateStr = date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
    const status: TimelineMilestone['status'] =
      elapsed >= m.ratio + 0.1 ? 'done' :
      elapsed >= m.ratio - 0.05 ? 'current' : 'upcoming';
    return { label: m.label, date: dateStr, status };
  });
}

import type { AoUploadedFile } from './dev';

export interface WorkspaceState {
  decisionMade: boolean;
  documentsReady: Record<string, boolean>;
  sectionsReviewed: Record<string, boolean>;
  aoFiles: AoUploadedFile[];
}

export function computeProgress(
  workspace: WorkspaceState,
  totalDocuments: number,
  totalSections: number,
): number {
  const docsReady = Object.values(workspace.documentsReady).filter(Boolean).length;
  const docsScore = totalDocuments > 0 ? 40 * (docsReady / totalDocuments) : 0;
  const sectionsReviewed = Object.values(workspace.sectionsReviewed).filter(Boolean).length;
  const sectionsScore = totalSections > 0 ? 60 * (sectionsReviewed / totalSections) : 0;
  return Math.round(docsScore + sectionsScore);
}

export function formatDate(dateStr: string | null): string {
  if (!dateStr) return 'Non spécifié';
  return new Date(dateStr).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function daysUntil(dateStr: string | null): number | null {
  if (!dateStr) return null;
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}
