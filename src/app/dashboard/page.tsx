'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Search, Activity, Target } from 'lucide-react';
import Link from 'next/link';
import { isAuthenticated, getTokenPayload, markOnboardingStep } from '@/lib/auth';
import { api } from '@/lib/api';
import { isDevMode, MOCK_RFPS } from '@/lib/dev';
import { getCompanyProfile } from '@/lib/profile-storage';
import { getWorkspaceState } from '@/lib/ao-storage';
import { computePipelineKpi, computeDeadlineKpi, computeProfileKpi, computeResponseRateKpi } from '@/lib/dashboard-kpi';
import { useDashboardFilters, type RFP } from '@/hooks/useDashboardFilters';
import type { WorkspaceState } from '@/lib/ao-utils';
import type { CompanyProfile } from '@/lib/dev';
import FreeBanner from '@/components/FreeBanner';
import OnboardingChecklist from '@/components/OnboardingChecklist';
import TopBar from '@/components/dashboard/TopBar';
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
  const [userName, setUserName] = useState<string | null>(null);

  const filters = useDashboardFilters(rfps);

  const initials = useMemo(() => {
    if (userName) {
      const parts = userName.split(' ').filter(Boolean);
      if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
      return userName.substring(0, 2).toUpperCase();
    }
    const payload = getTokenPayload();
    if (!payload?.email) return '??';
    return payload.email.substring(0, 2).toUpperCase();
  }, [userName]);

  useEffect(() => {
    if (!isAuthenticated()) {
      window.location.href = '/login';
      return;
    }

    const fetchData = async () => {
      try {
        const email = getTokenPayload()?.email;

        const [rfpRes, excaliburRes] = await Promise.allSettled([
          email
            ? fetch(`/api/rfps?email=${encodeURIComponent(email)}`).then((r) => r.ok ? r.json() : null)
            : Promise.resolve(null),
          api.dashboard().then((r) => r.ok ? r.json() : null),
        ]);

        const supabaseRfps: RFP[] = rfpRes.status === 'fulfilled' && rfpRes.value?.rfps ? rfpRes.value.rfps : [];
        const excaliburData = excaliburRes.status === 'fulfilled' ? excaliburRes.value : null;
        const excaliburRfps: RFP[] = excaliburData?.rfps ?? [];

        const seenIds = new Set(supabaseRfps.map((r) => r.id));
        const merged = [...supabaseRfps, ...excaliburRfps.filter((r) => !seenIds.has(r.id))];

        if (merged.length > 0) {
          setRfps(merged);
        } else if (isDevMode()) {
          setRfps(MOCK_RFPS);
        } else {
          setRfps([]);
        }

        setTier(excaliburData?.profile?.tier || 'free');
        setUserName(excaliburData?.profile?.name || null);
        setRfpsThisMonth(merged.length || 0);
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
      <div className="p-6 md:p-8">
        <div className="h-8 w-48 bg-slate-200 rounded-lg mb-8 skeleton" />
        <KpiGridSkeleton />
        <div className="space-y-3 mt-8">
          {[0, 1, 2].map((i) => <SkeletonCard key={i} />)}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] p-6">
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
    <div>
      <TopBar 
        title="Tableau de bord" 
        description="Gérez vos appels d'offres et suivez vos performances." 
        search={filters.search}
        onSearchChange={filters.setSearch}
        userInitials={initials}
      />

      <FreeBanner tier={tier} rfpsThisMonth={rfpsThisMonth} />
      
      <div className="mt-8">
        <OnboardingChecklist key={onboardingKey} />
      </div>

      <div className="mt-8">
        <KpiStatsSection
          pipeline={pipelineKpi}
          deadline={deadlineKpi}
          profile={profileKpi}
          responseRate={responseRateKpi}
        />
      </div>

      <div className="mt-8">
        <DeadlineTimeline rfps={rfps} />
      </div>

      {profile && (
        <div className="mt-8">
          <QuickActionsBar
            rfps={rfps}
            profile={profile}
            profileCompleteness={profileKpi.completenessPercent}
          />
        </div>
      )}

      <div className="mt-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
            <Target className="w-5 h-5 text-indigo-500" />
            Appels d&apos;offres détectés
          </h2>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-medium">{filters.resultCount} résultats</span>
          </div>
        </div>

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

        <div className="mt-4">
          <ActiveFilterChips
            filters={filters.activeFilters}
            onClear={filters.clearFilter}
            onClearAll={filters.clearAllFilters}
          />
        </div>

        <div className="mt-6">
          <AoCardList
            rfps={filters.filteredRfps}
            workspaces={workspaces}
            onExplore={handleExploreRfp}
          />
        </div>

        {rfps.length === 0 && (
          <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200 mt-6">
            <div className="w-16 h-16 bg-gradient-to-br from-indigo-100 to-violet-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Search className="w-7 h-7 text-indigo-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Vos AO arrivent...</h3>
            <p className="text-slate-400 mb-6 max-w-sm mx-auto">
              Nos algorithmes scannent le BOAMP en continu. Vos premiers résultats apparaîtront sous peu.
            </p>
            <Link href="/dashboard/settings" className="btn-secondary text-sm py-2 px-4">
              Affiner mes critères
            </Link>
          </div>
        )}

        {rfps.length > 0 && filters.filteredRfps.length === 0 && (
          <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200 mt-6">
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
