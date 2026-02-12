// ─── Market Intelligence Types ───

export interface Attribution {
  id: string;
  rfpTitle: string;
  buyerName: string;
  winnerName: string;
  amount: number;
  notificationDate: string;
  cpvCode: string;
  region: string;
  offersReceived?: number;
}

export interface MarketInsight {
  sector: string;
  totalContracts: number;
  totalValue: number;
  avgValue: number;
  topBuyers: RankedEntity[];
  topWinners: RankedEntity[];
}

export interface RankedEntity {
  name: string;
  count: number;
}

export interface VolumeDataPoint {
  month: string;
  count: number;
  volume: number;
}

export interface AmountRange {
  label: string;
  count: number;
  color: string;
}

export interface CompetitorResult {
  name: string;
  wins: number;
  totalVolume: number;
  avgBudget: number;
  sectors: string[];
  winRate?: number;
}

export interface MarketFilters {
  region: string;
  period: '3' | '6' | '12' | 'all';
  amountMin: number;
  amountMax: number;
}

export const DEFAULT_FILTERS: MarketFilters = {
  region: '',
  period: 'all',
  amountMin: 0,
  amountMax: 0,
};

export const CPV_SECTORS = [
  { code: '72', name: 'Services IT' },
  { code: '48', name: 'Logiciels' },
  { code: '79', name: 'Services entreprises' },
  { code: '71', name: 'Architecture & Ingénierie' },
  { code: '80', name: 'Formation' },
  { code: '64', name: 'Télécoms' },
  { code: '45', name: 'BTP' },
  { code: '50', name: 'Maintenance' },
  { code: '34', name: 'Transport' },
  { code: '33', name: 'Médical' },
  { code: '30', name: 'Machines & Matériel' },
  { code: '22', name: 'Imprimés' },
  { code: '55', name: 'Hôtellerie & Restauration' },
  { code: '90', name: 'Environnement' },
  { code: '77', name: 'Agriculture & Espaces verts' },
  { code: '66', name: 'Finance & Assurance' },
  { code: '60', name: 'Services de transport' },
  { code: '38', name: 'Instruments & Laboratoire' },
  { code: '44', name: 'Matériaux de construction' },
  { code: '39', name: 'Mobilier' },
] as const;

export const REGIONS = [
  'Île-de-France',
  'Auvergne-Rhône-Alpes',
  'Nouvelle-Aquitaine',
  'Occitanie',
  'Hauts-de-France',
  'Provence-Alpes-Côte d\'Azur',
  'Grand Est',
  'Bretagne',
  'Pays de la Loire',
  'Normandie',
  'Bourgogne-Franche-Comté',
  'Centre-Val de Loire',
  'Corse',
] as const;

// ─── Entity Profile Types ───

export interface EntityTrend {
  month: string;
  count: number;
  volume: number;
}

export interface FinancialData {
  caDernier: number | null;
  caN1: number | null;
  caN2: number | null;
  caN3: number | null;
  margeNette: number | null;
  endettement: number | null;
  tresorerie: number | null;
}

export interface BuyerProfile {
  name: string;
  totalContracts: number;
  totalVolume: number;
  avgAmount: number;
  topWinners: RankedEntity[];
  sectors: { code: string; name: string; count: number }[];
  recentContracts: { id: string; title: string; winnerName: string; amount: number; date: string }[];
  trend: EntityTrend[];
  scoreFinancier?: number | null;
  financials?: FinancialData;
  proceduresCollectives?: { type: string; date_debut: string }[];
}

export interface WinnerProfile {
  name: string;
  totalWins: number;
  totalVolume: number;
  avgBudget: number;
  topBuyers: RankedEntity[];
  sectors: { code: string; name: string; count: number }[];
  regions: { name: string; count: number }[];
  recentWins: { id: string; title: string; buyerName: string; amount: number; date: string }[];
  trend: EntityTrend[];
  scoreFinancier?: number | null;
  financials?: FinancialData;
  proceduresCollectives?: { type: string; date_debut: string }[];
}

export interface RenewalOpportunity {
  id: string;
  title: string;
  buyerName: string;
  winnerName: string;
  amount: number;
  notificationDate: string;
  estimatedRenewal: string;
  region: string;
}

export interface RegionalData {
  name: string;
  count: number;
  volume: number;
  avgAmount: number;
}

export interface LocationData {
  name: string;
  count: number;
  volume: number;
}

// ─── Watchlist Types ───

export interface WatchlistEntry {
  id: string;
  buyer_name: string;
  buyer_siret: string | null;
  added_at: string;
}

export interface WatchlistAlert {
  id: string;
  title: string;
  buyer_name: string;
  notification_date: string;
  amount: number;
  cpv_code: string;
}

// ─── Competition & Intelligence Types ───

export interface CompetitionData {
  avgOffers: number;
  hhi: number;
  concentration: 'low' | 'moderate' | 'high';
  topShareholders: { name: string; share: number; wins: number }[];
}

export interface PartnershipsData {
  totalGroupements: number;
  soloRate: number;
  pairs: { partner1: string; partner2: string; count: number }[];
  types: { type: string; count: number }[];
}

export interface RseData {
  innovationRate: number;
  socialClauseRate: number;
  environmentalClauseRate: number;
  totalContracts: number;
  trend: { month: string; innovationPct: number; socialPct: number; environmentalPct: number }[];
}

export interface LoyaltyPair {
  buyerName: string;
  winnerName: string;
  contracts: number;
  totalVolume: number;
  loyaltyPct: number;
  isLocked: boolean;
}

export interface LoyaltySummary {
  lockedPairs: LoyaltyPair[];
  displacementOpportunities: LoyaltyPair[];
  distribution: { loyal: number; moderate: number; switching: number };
}

export interface RegionDetail {
  name: string;
  totalContracts: number;
  totalVolume: number;
  avgAmount: number;
  locations: LocationData[];
  topBuyers: RankedEntity[];
  topWinners: RankedEntity[];
  sectors: { code: string; name: string; count: number }[];
  recentContracts: { id: string; title: string; buyerName: string; winnerName: string; amount: number; date: string; lieuExecution: string }[];
}
