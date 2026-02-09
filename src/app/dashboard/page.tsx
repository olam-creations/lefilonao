'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Search } from 'lucide-react';
import Link from 'next/link';
import { isAuthenticated, markOnboardingStep } from '@/lib/auth';
import { api } from '@/lib/api';
import { isDevMode, MOCK_RFPS } from '@/lib/dev';
import { getCompanyProfile } from '@/lib/profile-storage';
import { getWorkspaceState } from '@/lib/ao-storage';
import { computePipelineKpi, computeDeadlineKpi, computeProfileKpi, computeResponseRateKpi } from '@/lib/dashboard-kpi';
import { useDashboardFilters, type RFP } from '@/hooks/useDashboardFilters';
import type { WorkspaceState } from '@/lib/ao-utils';
import type { CompanyProfile } from '@/lib/dev';
import Header from '@/components/Header';
import FreeBanner from '@/components/FreeBanner';
import OnboardingChecklist from '@/components/OnboardingChecklist';
import KpiStatsSection from '@/components/dashboard/KpiStatsSection';
import DeadlineTimeline from '@/components/dashboard/DeadlineTimeline';
import QuickActionsBar from '@/components/dashboard/QuickActionsBar';
import FiltersToolbar from '@/components/dashboard/FiltersToolbar';
import ActiveFilterChips from '@/components/dashboard/ActiveFilterChips';
import AoCardList from '@/components/dashboard/AoCardList';
import { KpiGridSkeleton, SkeletonCard } from '@/components/dashboard/DashboardSkeletons';

function sanitizeCsvCell(value: string): string {
  const needsPrefix = /^[=+\-@\t\r|]/.test(value);
  const escaped = value.replace(/"/g, '""');
  if (needsPrefix) return `'${escaped}`;
  return escaped;
}

export default function DashboardPage() {
  const [rfps, setRfps] = useState<RFP[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tier, setTier] = useState<'free' | 'pro'>('free');
  const [rfpsThisMonth, setRfpsThisMonth] = useState(0);
  const [onboardingKey, setOnboardingKey] = useState(0);
  const [workspaces, setWorkspaces] = useState<Record<string, WorkspaceState>>({});
  const [profile, setProfile] = useState<CompanyProfile | null>(null);

  const filters = useDashboardFilters(rfps);

  useEffect(() => {
    if (!isAuthenticated()) {
      window.location.href = '/login';
      return;
    }

    const fetchData = async () => {
      try {
        const res = await api.dashboard();
        if (!res.ok) throw new Error('API error');
        const data = await res.json();
        setRfps(data.rfps || []);
        setTier(data.profile?.tier || 'free');
        setRfpsThisMonth(data.rfps?.length || 0);
      } catch {
        if (isDevMode()) {
          setRfps(MOCK_RFPS);
        } else {
          setError('Impossible de charger les données. Réessayez plus tard.');
        }
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (rfps.length === 0) return;

    const ws: Record<string, WorkspaceState> = {};
    for (const rfp of rfps) {
      ws[rfp.id] = getWorkspaceState(rfp.id);
    }
    setWorkspaces(ws);
    setProfile(getCompanyProfile());
  }, [rfps]);

  const handleExploreRfp = useCallback(() => {
    markOnboardingStep('explore');
    setOnboardingKey((k) => k + 1);
  }, []);

  const exportCSV = useCallback(() => {
    const headers = ['Titre', 'Emetteur', 'Score', 'Budget', 'Deadline', 'Region', 'URL'];
    const rows = filters.filteredRfps.map((r) => [
      sanitizeCsvCell(r.title), sanitizeCsvCell(r.issuer), `${r.score}/100`,
      sanitizeCsvCell(r.budget || ''), r.deadline || '', sanitizeCsvCell(r.region || ''), sanitizeCsvCell(r.url),
    ]);
    const csv = [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `lefilonao-export-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);

    markOnboardingStep('export');
    setOnboardingKey((k) => k + 1);
  }, [filters.filteredRfps]);

  const pipelineKpi = useMemo(() => computePipelineKpi(rfps), [rfps]);
  const deadlineKpi = useMemo(() => computeDeadlineKpi(rfps), [rfps]);
  const profileKpi = useMemo(
    () => profile ? computeProfileKpi(profile) : { completenessPercent: 0, filledFields: 0, totalFields: 1 },
    [profile],
  );
  const rfpIds = useMemo(() => rfps.map((r) => r.id), [rfps]);
  const responseRateKpi = useMemo(() => computeResponseRateKpi(rfpIds, workspaces), [rfpIds, workspaces]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Header variant="dashboard" activePage="dashboard" />
        <div className="max-w-7xl mx-auto p-6">
          <KpiGridSkeleton />
          <div className="space-y-3">
            {[0, 1, 2].map((i) => <SkeletonCard key={i} />)}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50">
        <div className="text-center">
          <p className="text-red-600 text-lg mb-6">{error}</p>
          <button onClick={() => window.location.reload()} className="btn-primary">
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Header variant="dashboard" activePage="dashboard" />

      <div className="max-w-7xl mx-auto p-6">
        <FreeBanner tier={tier} rfpsThisMonth={rfpsThisMonth} />
        <OnboardingChecklist key={onboardingKey} />

        <KpiStatsSection
          pipeline={pipelineKpi}
          deadline={deadlineKpi}
          profile={profileKpi}
          responseRate={responseRateKpi}
        />

        <DeadlineTimeline rfps={rfps} />

        {profile && (
          <QuickActionsBar
            rfps={rfps}
            profile={profile}
            profileCompleteness={profileKpi.completenessPercent}
          />
        )}

        <FiltersToolbar
          search={filters.search}
          onSearchChange={filters.setSearch}
          scoreLabels={filters.scoreLabels}
          onToggleScore={filters.toggleScoreLabel}
          region={filters.region}
          onRegionChange={filters.setRegion}
          regions={filters.regions}
          deadlineRange={filters.deadlineRange}
          onDeadlineRangeChange={filters.setDeadlineRange}
          sort={filters.sort}
          onSortChange={filters.setSort}
          resultCount={filters.resultCount}
          totalCount={rfps.length}
          onExportCsv={exportCSV}
        />

        <ActiveFilterChips
          filters={filters.activeFilters}
          onClear={filters.clearFilter}
          onClearAll={filters.clearAllFilters}
        />

        <AoCardList
          rfps={filters.filteredRfps}
          workspaces={workspaces}
          onExplore={handleExploreRfp}
        />

        {rfps.length === 0 && (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-gradient-to-br from-indigo-100 to-violet-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Search className="w-7 h-7 text-indigo-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Vos AO arrivent...</h3>
            <p className="text-slate-400 mb-6 max-w-sm mx-auto">
              Nos algorithmes scannent le BOAMP en continu. Vos premiers résultats apparaîtront sous peu.
            </p>
            <div className="space-y-3 max-w-lg mx-auto mb-8">
              {[0, 1, 2].map((i) => <SkeletonCard key={i} />)}
            </div>
            <Link href="/subscribe" className="btn-secondary text-sm py-2 px-4">
              Affiner mes critères
            </Link>
          </div>
        )}

        {rfps.length > 0 && filters.filteredRfps.length === 0 && (
          <div className="text-center py-20">
            <p className="text-slate-400 mb-4">Aucun appel d&apos;offres ne correspond à ces filtres.</p>
            <button
              onClick={filters.clearAllFilters}
              className="btn-secondary text-sm py-2 px-4"
            >
              Voir tous les AO
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
