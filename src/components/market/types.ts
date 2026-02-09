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
] as const;
