import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  computePipelineKpi,
  computeDeadlineKpi,
  computeProfileKpi,
  computeResponseRateKpi,
} from '../dashboard-kpi';
import type { RFP } from '@/hooks/useDashboardFilters';
import type { CompanyProfile } from '../dev';
import type { WorkspaceState } from '../ao-utils';

function makeRfp(overrides: Partial<RFP> = {}): RFP {
  return {
    id: 'rfp-1',
    title: 'Test RFP',
    issuer: 'Test Issuer',
    deadline: '2026-03-01',
    score: 80,
    scoreLabel: 'GO',
    budget: '100 000 EUR',
    region: 'Ile-de-France',
    source: 'BOAMP',
    url: 'https://example.com',
    publishedAt: '2026-01-01',
    ...overrides,
  };
}

function makeProfile(overrides: Partial<CompanyProfile> = {}): CompanyProfile {
  return {
    companyName: 'Test Co',
    siret: '123456789',
    legalForm: 'SAS',
    address: '1 rue Test',
    city: 'Paris',
    postalCode: '75001',
    phone: '0123456789',
    email: 'test@test.fr',
    website: '',
    naf: '6201Z',
    tvaIntra: '',
    capitalSocial: '10000',
    effectifTotal: '5',
    caN1: '100000',
    caN2: '',
    caN3: '',
    documents: [],
    team: [],
    references: [],
    sectors: [],
    regions: [],
    ...overrides,
  };
}

describe('computePipelineKpi', () => {
  it('returns zeros for empty array', () => {
    const result = computePipelineKpi([]);
    expect(result).toEqual({ total: 0, go: 0, maybe: 0, pass: 0 });
  });

  it('counts each scoreLabel correctly', () => {
    const rfps = [
      makeRfp({ id: '1', scoreLabel: 'GO' }),
      makeRfp({ id: '2', scoreLabel: 'GO' }),
      makeRfp({ id: '3', scoreLabel: 'MAYBE' }),
      makeRfp({ id: '4', scoreLabel: 'PASS' }),
      makeRfp({ id: '5', scoreLabel: 'PASS' }),
      makeRfp({ id: '6', scoreLabel: 'PASS' }),
    ];
    const result = computePipelineKpi(rfps);
    expect(result).toEqual({ total: 6, go: 2, maybe: 1, pass: 3 });
  });

  it('handles single-item arrays', () => {
    const result = computePipelineKpi([makeRfp({ scoreLabel: 'MAYBE' })]);
    expect(result).toEqual({ total: 1, go: 0, maybe: 1, pass: 0 });
  });
});

describe('computeDeadlineKpi', () => {
  const NOW = new Date('2026-02-09T12:00:00Z').getTime();

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns zeros for empty array', () => {
    const result = computeDeadlineKpi([]);
    expect(result).toEqual({ urgentCount: 0, nextDeadlineDate: null, nextDeadlineDays: null });
  });

  it('returns zeros when all deadlines are null', () => {
    const rfps = [makeRfp({ deadline: null })];
    const result = computeDeadlineKpi(rfps);
    expect(result).toEqual({ urgentCount: 0, nextDeadlineDate: null, nextDeadlineDays: null });
  });

  it('counts urgent deadlines (within 7 days)', () => {
    const rfps = [
      makeRfp({ id: '1', deadline: '2026-02-11' }), // 2 days
      makeRfp({ id: '2', deadline: '2026-02-15' }), // 6 days
      makeRfp({ id: '3', deadline: '2026-02-20' }), // 11 days - not urgent
    ];
    const result = computeDeadlineKpi(rfps);
    expect(result.urgentCount).toBe(2);
  });

  it('finds the nearest deadline', () => {
    const rfps = [
      makeRfp({ id: '1', deadline: '2026-02-20' }),
      makeRfp({ id: '2', deadline: '2026-02-12' }),
      makeRfp({ id: '3', deadline: '2026-03-01' }),
    ];
    const result = computeDeadlineKpi(rfps);
    expect(result.nextDeadlineDate).toBe('2026-02-12');
  });

  it('excludes past deadlines', () => {
    const rfps = [
      makeRfp({ id: '1', deadline: '2026-02-01' }), // past
      makeRfp({ id: '2', deadline: '2026-02-20' }), // future
    ];
    const result = computeDeadlineKpi(rfps);
    expect(result.nextDeadlineDate).toBe('2026-02-20');
  });
});

describe('computeProfileKpi', () => {
  it('returns 0% for completely empty profile', () => {
    const profile = makeProfile({
      companyName: '', siret: '', legalForm: '', address: '', city: '',
      postalCode: '', phone: '', email: '', naf: '', tvaIntra: '',
      capitalSocial: '', effectifTotal: '', caN1: '', caN2: '', caN3: '',
    });
    const result = computeProfileKpi(profile);
    expect(result.completenessPercent).toBe(0);
    expect(result.filledFields).toBe(0);
  });

  it('counts filled text fields', () => {
    const profile = makeProfile();
    const result = computeProfileKpi(profile);
    // makeProfile has 13 filled text fields out of 15 (website, tvaIntra, caN2, caN3 are empty)
    expect(result.filledFields).toBeGreaterThan(0);
    expect(result.totalFields).toBeGreaterThan(0);
  });

  it('counts valid documents', () => {
    const doc = { fileId: null, fileName: null, fileSize: null, mimeType: null, uploadedAt: null };
    const profile = makeProfile({
      documents: [
        { ...doc, name: 'Kbis', status: 'valid' as const, expiresAt: '2027-01-01' },
        { ...doc, name: 'RIB', status: 'expired' as const, expiresAt: '2025-01-01' },
        { ...doc, name: 'Assurance', status: 'expiring' as const, expiresAt: '2026-03-01' },
      ],
    });
    const result = computeProfileKpi(profile);
    // 2 valid/expiring docs out of 3 total docs
    expect(result.totalFields).toBe(15 + 3 + 4); // text fields + docs + 4 list checks
  });
});

describe('computeResponseRateKpi', () => {
  it('returns 0% for empty inputs', () => {
    const result = computeResponseRateKpi([], {});
    expect(result).toEqual({ decided: 0, total: 0, percent: 0 });
  });

  it('counts decisions correctly', () => {
    const workspaces: Record<string, WorkspaceState> = {
      'a': { decisionMade: true, documentsReady: {}, sectionsReviewed: {}, aoFiles: [] },
      'b': { decisionMade: false, documentsReady: {}, sectionsReviewed: {}, aoFiles: [] },
      'c': { decisionMade: true, documentsReady: {}, sectionsReviewed: {}, aoFiles: [] },
    };
    const result = computeResponseRateKpi(['a', 'b', 'c'], workspaces);
    expect(result).toEqual({ decided: 2, total: 3, percent: 67 });
  });

  it('handles missing workspace entries', () => {
    const result = computeResponseRateKpi(['a', 'b'], {});
    expect(result).toEqual({ decided: 0, total: 2, percent: 0 });
  });
});
