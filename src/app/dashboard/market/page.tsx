'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { Landmark, Trophy, AlertCircle, BarChart3 } from 'lucide-react';
import { markOnboardingStep } from '@/lib/auth';
import { getCompanyProfile } from '@/lib/profile-storage';
import { useUserSettings } from '@/hooks/useUserSettings';
import { stagger } from '@/lib/motion-variants';
import TopBar from '@/components/dashboard/TopBar';
import {
  CPV_SECTORS, DEFAULT_FILTERS,
  type MarketInsight, type Attribution, type VolumeDataPoint,
  type AmountRange, type CompetitorResult, type MarketFilters as Filters,
  type RenewalOpportunity, type RegionalData,
  type CompetitionData, type PartnershipsData, type RseData, type LoyaltySummary,
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
import CompetitiveIntensity, { CompetitiveIntensitySkeleton } from '@/components/market/CompetitiveIntensity';
import Partnerships, { PartnershipsSkeleton } from '@/components/market/Partnerships';
import RseIndicators, { RseIndicatorsSkeleton } from '@/components/market/RseIndicators';
import BuyerLoyalty, { BuyerLoyaltySkeleton } from '@/components/market/BuyerLoyalty';
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
  competition: CompetitionData | null;
  partnerships: PartnershipsData | null;
  rse: RseData | null;
  loyalty: LoyaltySummary | null;
}

const EMPTY_DATA: MarketData = {
  insights: null,
  attributions: [],
  volumeTrend: [],
  amountDistribution: [],
  competitors: [],
  renewals: [],
  regional: [],
  competition: null,
  partnerships: null,
  rse: null,
  loyalty: null,
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

      const [insightsRes, attrRes, trendRes, compRes, renewalsRes, regionalRes, competitionRes, partnershipsRes, rseRes, loyaltyRes] = await Promise.all([
        safeFetch(`/api/market/insights?cpv=${selectedSector}`),
        safeFetch(`/api/market/attributions?cpv=${selectedSector}&limit=15`),
        safeFetch(`/api/market/trends?cpv=${selectedSector}`),
        safeFetch(`/api/market/competitors?cpv=${selectedSector}`),
        safeFetch(`/api/market/renewals?cpv=${selectedSector}`),
        safeFetch(`/api/market/regional?cpv=${selectedSector}`),
        safeFetch(`/api/market/competition?cpv=${selectedSector}`),
        safeFetch(`/api/market/partnerships?cpv=${selectedSector}`),
        safeFetch(`/api/market/rse?cpv=${selectedSector}`),
        safeFetch(`/api/market/recurrence?cpv=${selectedSector}&summary=true`),
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
      if (competitionRes?.ok) {
        const json = await competitionRes.json();
        next.competition = json.competition ?? null;
      }
      if (partnershipsRes?.ok) {
        const json = await partnershipsRes.json();
        next.partnerships = json.partnerships ?? null;
      }
      if (rseRes?.ok) {
        const json = await rseRes.json();
        next.rse = json.rse ?? null;
      }
      if (loyaltyRes?.ok) {
        const json = await loyaltyRes.json();
        next.loyalty = json.loyalty ?? null;
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
    <div className="animate-fade-in">
      <TopBar 
        title="Intelligence de marché" 
        description="Analysez les marchés attribués, identifiez les acheteurs et vos concurrents."
        icon={<BarChart3 className="w-6 h-6 text-indigo-600" />}
      />

      <div className="mt-8">
        <div className="flex flex-wrap gap-2 mb-10 pb-4 border-b border-slate-100">
          {CPV_SECTORS.map((sector) => {
            const isActive = selectedSector === sector.code;
            return (
              <button
                key={sector.code}
                onClick={() => setSelectedSector(sector.code)}
                className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest transition-all border ${
                  isActive
                    ? 'bg-slate-900 border-slate-900 text-white shadow-lg shadow-slate-200 scale-105'
                    : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                {sector.name}
              </button>
            );
          })}
        </div>

        {error && (
          <div className="flex items-center gap-3 p-4 mb-8 rounded-2xl bg-red-50 border border-red-100 text-red-700 text-sm animate-shake">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            {error}
          </div>
        )}

        {loading ? (
          <div className="space-y-8">
            <MarketStatsSkeleton />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <RankingChartSkeleton />
              <RankingChartSkeleton />
              <div className="md:col-span-2 lg:col-span-1">
                <CompetitiveIntensitySkeleton />
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              <ChartSkeleton height="h-72" />
              <ChartSkeleton height="h-72" />
            </div>
          </div>
        ) : (
          <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-10">
            {/* Section 1: Cockpit & Ranking */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              <div className="xl:col-span-2 min-w-0">
                <MarketStatCards insights={data.insights!} />
              </div>
              <div className="xl:col-span-1 min-w-0 h-full">
                <MyPositioning profile={profile} insights={data.insights} regionalData={data.regional} />
              </div>
            </div>

            {/* Section 2: Leaders & Intensity */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              <div className="min-w-0">
                <TopRankingChart
                  title="Top Acheteurs"
                  icon={<Landmark className="w-4 h-4 text-indigo-500" />}
                  items={data.insights?.topBuyers ?? []}
                  color="indigo"
                  unit="marchés"
                  onNameClick={handleBuyerClick}
                />
              </div>
              <div className="min-w-0">
                <TopRankingChart
                  title="Top Gagnants"
                  icon={<Trophy className="w-4 h-4 text-emerald-500" />}
                  items={data.insights?.topWinners ?? []}
                  color="emerald"
                  unit="victoires"
                  onNameClick={handleWinnerClick}
                />
              </div>
              <div className="md:col-span-2 xl:col-span-1 flex flex-col gap-6 min-w-0">
                <CompetitiveIntensity data={data.competition} />
                <Partnerships data={data.partnerships} />
              </div>
            </div>

            {/* Section 3: Trends & Distribution */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <VolumeTrend data={data.volumeTrend} />
              <AmountDistribution data={data.amountDistribution} />
            </div>

            {/* Section 4: Geography & Loyalty */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <RegionalHeatmap data={data.regional} onRegionClick={handleRegionClick} />
              </div>
              <div className="lg:col-span-1 flex flex-col gap-6">
                <BuyerLoyalty data={data.loyalty} onBuyerClick={handleBuyerClick} onWinnerClick={handleWinnerClick} />
                <RseIndicators data={data.rse} />
              </div>
            </div>

            {/* Section 5: Search & Renewals */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <CompetitorSearch competitors={data.competitors} onCompetitorClick={handleWinnerClick} />
              <RenewalAlerts
                renewals={data.renewals}
                onBuyerClick={handleBuyerClick}
                onWinnerClick={handleWinnerClick}
              />
            </div>

            {/* Section 6: Data Table */}
            <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-xl font-bold text-slate-900 tracking-tight">Historique des attributions</h2>
                <MarketFilters filters={filters} onChange={setFilters} />
              </div>
              <AttributionsList
                attributions={data.attributions}
                filters={filters}
                onBuyerClick={handleBuyerClick}
                onWinnerClick={handleWinnerClick}
              />
            </div>
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
