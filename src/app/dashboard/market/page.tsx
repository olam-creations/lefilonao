'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { Landmark, Trophy, AlertCircle } from 'lucide-react';
import { isAuthenticated, markOnboardingStep } from '@/lib/auth';
import { getCompanyProfile } from '@/lib/profile-storage';
import { useUserSettings } from '@/hooks/useUserSettings';
import { stagger } from '@/lib/motion-variants';
import Header from '@/components/Header';
import {
  CPV_SECTORS, DEFAULT_FILTERS,
  type MarketInsight, type Attribution, type VolumeDataPoint,
  type AmountRange, type CompetitorResult, type MarketFilters as Filters,
  type RenewalOpportunity, type RegionalData,
} from '@/components/market/types';
import MarketStatCards from '@/components/market/MarketStatCards';
import TopRankingChart from '@/components/market/TopRankingChart';
import VolumeTrend from '@/components/market/VolumeTrend';
import AmountDistribution from '@/components/market/AmountDistribution';
import MarketFilters from '@/components/market/MarketFilters';
import CompetitorSearch from '@/components/market/CompetitorSearch';
import AttributionsList from '@/components/market/AttributionsList';
import EntitySheet from '@/components/market/EntitySheet';
import RenewalAlerts from '@/components/market/RenewalAlerts';
import MyPositioning from '@/components/market/MyPositioning';
import RegionalHeatmap from '@/components/market/RegionalHeatmap';
import RegionSheet from '@/components/market/RegionSheet';
import { MarketStatsSkeleton, RankingChartSkeleton, ChartSkeleton, AttributionsListSkeleton, PositioningSkeleton } from '@/components/market/MarketSkeletons';
import { RenewalAlertsSkeleton } from '@/components/market/RenewalAlerts';
import { RegionalHeatmapSkeleton } from '@/components/market/RegionalHeatmap';

interface MarketData {
  insights: MarketInsight | null;
  attributions: Attribution[];
  volumeTrend: VolumeDataPoint[];
  amountDistribution: AmountRange[];
  competitors: CompetitorResult[];
  renewals: RenewalOpportunity[];
  regional: RegionalData[];
}

const EMPTY_DATA: MarketData = {
  insights: null,
  attributions: [],
  volumeTrend: [],
  amountDistribution: [],
  competitors: [],
  renewals: [],
  regional: [],
};

interface EntitySheetState {
  open: boolean;
  name: string;
  type: 'buyer' | 'winner';
}

export default function MarketPage() {
  const [selectedSector, setSelectedSector] = useState('72');
  const [data, setData] = useState<MarketData>(EMPTY_DATA);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<Filters>({ ...DEFAULT_FILTERS });
  const [entitySheet, setEntitySheet] = useState<EntitySheetState>({ open: false, name: '', type: 'buyer' });
  const [regionSheet, setRegionSheet] = useState<{ open: boolean; name: string }>({ open: false, name: '' });
  const [profile, setProfile] = useState<{ companyName: string; sectors: string[]; regions: string[]; caN1: string } | null>(null);
  const { settings } = useUserSettings();
  const sectorInitialized = useRef(false);

  useEffect(() => {
    if (!isAuthenticated()) {
      window.location.href = '/login';
      return;
    }
    markOnboardingStep('market');
    const p = getCompanyProfile();
    if (p.sectors?.length > 0 || p.regions?.length > 0) {
      setProfile({ companyName: p.companyName, sectors: p.sectors ?? [], regions: p.regions ?? [], caN1: p.caN1 ?? '' });
    }
  }, []);

  // Initialize sector from user settings (once)
  useEffect(() => {
    if (!settings || sectorInitialized.current) return;
    sectorInitialized.current = true;

    if (selectedSector === '72' && settings.default_cpv.length > 0) {
      setSelectedSector(settings.default_cpv[0]);
    }
  }, [settings, selectedSector]);

  useEffect(() => {
    const safeFetch = async (url: string): Promise<Response | null> => {
      try { return await fetch(url); }
      catch { return null; }
    };

    const fetchData = async () => {
      setLoading(true);
      setError(null);

      const [insightsRes, attrRes, trendRes, compRes, renewalsRes, regionalRes] = await Promise.all([
        safeFetch(`/api/market/insights?cpv=${selectedSector}`),
        safeFetch(`/api/market/attributions?cpv=${selectedSector}&limit=15`),
        safeFetch(`/api/market/trends?cpv=${selectedSector}`),
        safeFetch(`/api/market/competitors?cpv=${selectedSector}`),
        safeFetch(`/api/market/renewals?cpv=${selectedSector}`),
        safeFetch(`/api/market/regional?cpv=${selectedSector}`),
      ]);

      const next: MarketData = { ...EMPTY_DATA };

      if (insightsRes?.ok) {
        const json = await insightsRes.json();
        next.insights = json.market ?? null;
      }
      if (attrRes?.ok) {
        const json = await attrRes.json();
        next.attributions = json.attributions ?? [];
      }
      if (trendRes?.ok) {
        const json = await trendRes.json();
        next.volumeTrend = json.volumeTrend ?? [];
      }
      if (compRes?.ok) {
        const json = await compRes.json();
        next.competitors = json.competitors ?? [];
      }
      if (renewalsRes?.ok) {
        const json = await renewalsRes.json();
        next.renewals = json.renewals ?? [];
      }
      if (regionalRes?.ok) {
        const json = await regionalRes.json();
        next.regional = json.regions ?? [];
      }

      setData(next);

      if (!insightsRes?.ok && !attrRes?.ok) {
        setError('Impossible de récupérer les données de marché. Vérifiez votre connexion.');
      }

      setLoading(false);
    };

    fetchData();
  }, [selectedSector]);

  const handleBuyerClick = useCallback((name: string) => {
    setEntitySheet({ open: true, name, type: 'buyer' });
  }, []);

  const handleWinnerClick = useCallback((name: string) => {
    setEntitySheet({ open: true, name, type: 'winner' });
  }, []);

  const handleCloseSheet = useCallback(() => {
    setEntitySheet((prev) => ({ ...prev, open: false }));
  }, []);

  const handleRegionClick = useCallback((name: string) => {
    setRegionSheet({ open: true, name });
  }, []);

  const handleCloseRegionSheet = useCallback(() => {
    setRegionSheet((prev) => ({ ...prev, open: false }));
  }, []);

  return (
    <div className="min-h-screen bg-slate-50">
      <Header variant="dashboard" activePage="intelligence" />

      <div className="max-w-7xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Intelligence de marché</h1>
          <p className="text-slate-500">Analysez les marchés attribués, identifiez les acheteurs et vos concurrents. <span className="text-slate-400">Données DECP sur 5 ans.</span></p>
        </div>

        <div className="flex flex-wrap gap-2 mb-8">
          {CPV_SECTORS.map((sector) => {
            const isActive = selectedSector === sector.code;
            return (
              <button
                key={sector.code}
                onClick={() => setSelectedSector(sector.code)}
                className={`px-4 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-indigo-50 border-indigo-300 text-indigo-700 shadow-sm shadow-indigo-500/10'
                    : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                }`}
              >
                {sector.name}
              </button>
            );
          })}
        </div>

        {error && (
          <div className="flex items-center gap-3 p-4 mb-6 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        {loading ? (
          <div className="space-y-6">
            <PositioningSkeleton />
            <MarketStatsSkeleton />
            <div className="grid md:grid-cols-2 gap-6">
              <RankingChartSkeleton />
              <RankingChartSkeleton />
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              <ChartSkeleton height="h-72" />
              <ChartSkeleton height="h-40" />
            </div>
            <RegionalHeatmapSkeleton />
            <AttributionsListSkeleton />
            <RenewalAlertsSkeleton />
          </div>
        ) : (
          <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-6">
            <MyPositioning profile={profile} insights={data.insights} regionalData={data.regional} />

            {data.insights && <MarketStatCards insights={data.insights} />}

            {data.insights && (
              <div className="grid md:grid-cols-2 gap-6">
                <TopRankingChart
                  title="Top Acheteurs"
                  icon={<Landmark className="w-4 h-4 text-indigo-500" />}
                  items={data.insights.topBuyers}
                  color="indigo"
                  unit="marchés"
                  onNameClick={handleBuyerClick}
                />
                <TopRankingChart
                  title="Top Gagnants"
                  icon={<Trophy className="w-4 h-4 text-emerald-500" />}
                  items={data.insights.topWinners}
                  color="emerald"
                  unit="victoires"
                  onNameClick={handleWinnerClick}
                />
              </div>
            )}

            <div className="grid md:grid-cols-2 gap-6">
              <VolumeTrend data={data.volumeTrend} />
              <AmountDistribution data={data.amountDistribution} />
            </div>

            <RegionalHeatmap data={data.regional} onRegionClick={handleRegionClick} />

            <CompetitorSearch competitors={data.competitors} onCompetitorClick={handleWinnerClick} />

            <RenewalAlerts
              renewals={data.renewals}
              onBuyerClick={handleBuyerClick}
              onWinnerClick={handleWinnerClick}
            />

            <MarketFilters filters={filters} onChange={setFilters} />
            <AttributionsList
              attributions={data.attributions}
              filters={filters}
              onBuyerClick={handleBuyerClick}
              onWinnerClick={handleWinnerClick}
            />
          </motion.div>
        )}
      </div>

      <EntitySheet
        open={entitySheet.open}
        entityName={entitySheet.name}
        entityType={entitySheet.type}
        cpv={selectedSector}
        onClose={handleCloseSheet}
      />

      <RegionSheet
        open={regionSheet.open}
        regionName={regionSheet.name}
        cpv={selectedSector}
        onClose={handleCloseRegionSheet}
        onBuyerClick={handleBuyerClick}
        onWinnerClick={handleWinnerClick}
      />
    </div>
  );
}
