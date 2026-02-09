import type { CompanyProfile } from './dev';
import type { WorkspaceState } from './ao-utils';
import { daysUntil } from './ao-utils';
import type { RFP } from '@/hooks/useDashboardFilters';

export interface PipelineKpi {
  total: number;
  go: number;
  maybe: number;
  pass: number;
}

export interface DeadlineKpi {
  urgentCount: number;
  nextDeadlineDate: string | null;
  nextDeadlineDays: number | null;
}

export interface ProfileKpi {
  completenessPercent: number;
  filledFields: number;
  totalFields: number;
}

export interface ResponseRateKpi {
  decided: number;
  total: number;
  percent: number;
}

export function computePipelineKpi(rfps: RFP[]): PipelineKpi {
  const counts = { go: 0, maybe: 0, pass: 0 };
  for (const r of rfps) {
    if (r.scoreLabel === 'GO') counts.go++;
    else if (r.scoreLabel === 'MAYBE') counts.maybe++;
    else counts.pass++;
  }
  return { total: rfps.length, ...counts };
}

export function computeDeadlineKpi(rfps: RFP[]): DeadlineKpi {
  const withDeadline = rfps
    .filter((r) => r.deadline !== null)
    .map((r) => ({ ...r, days: daysUntil(r.deadline) }))
    .filter((r) => r.days !== null && r.days >= 0)
    .sort((a, b) => (a.days ?? 0) - (b.days ?? 0));

  const urgentCount = withDeadline.filter((r) => r.days !== null && r.days <= 7).length;
  const next = withDeadline[0] ?? null;

  return {
    urgentCount,
    nextDeadlineDate: next?.deadline ?? null,
    nextDeadlineDays: next?.days ?? null,
  };
}

export function computeProfileKpi(profile: CompanyProfile): ProfileKpi {
  const textFields: (keyof CompanyProfile)[] = [
    'companyName', 'siret', 'legalForm', 'address', 'city',
    'postalCode', 'phone', 'email', 'naf', 'tvaIntra',
    'capitalSocial', 'effectifTotal', 'caN1', 'caN2', 'caN3',
  ];

  const filledText = textFields.filter((k) => {
    const v = profile[k];
    return typeof v === 'string' && v.trim().length > 0;
  }).length;

  const validDocs = profile.documents.filter(
    (d) => d.status === 'valid' || d.status === 'expiring'
  ).length;
  const totalDocs = profile.documents.length;

  const hasTeam = profile.team.length > 0 ? 1 : 0;
  const hasRefs = profile.references.length > 0 ? 1 : 0;
  const hasSectors = profile.sectors.length > 0 ? 1 : 0;
  const hasRegions = profile.regions.length > 0 ? 1 : 0;

  const filledFields = filledText + validDocs + hasTeam + hasRefs + hasSectors + hasRegions;
  const totalFields = textFields.length + totalDocs + 4;
  const completenessPercent = totalFields > 0
    ? Math.round((filledFields / totalFields) * 100)
    : 0;

  return { completenessPercent, filledFields, totalFields };
}

export function computeResponseRateKpi(
  rfpIds: string[],
  workspaces: Record<string, WorkspaceState>,
): ResponseRateKpi {
  const total = rfpIds.length;
  const decided = rfpIds.filter((id) => workspaces[id]?.decisionMade === true).length;
  const percent = total > 0 ? Math.round((decided / total) * 100) : 0;

  return { decided, total, percent };
}
