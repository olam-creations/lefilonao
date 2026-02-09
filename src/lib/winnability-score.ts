// Winnability score: 0-100 based on company profile vs opportunity/attribution data

interface CompanyData {
  category?: string;
  region?: string;
  nafCode?: string;
  caDernier?: number;
}

interface OpportunityData {
  region?: string;
  cpvSector?: string;
  estimatedAmount?: number;
  avgOffersReceived?: number;
  buyerLoyaltyPct?: number;
  winnerCategories?: string[];
}

interface ScoreBreakdown {
  total: number;
  sizeMatch: number;
  regionMatch: number;
  sectorMatch: number;
  competition: number;
  recurrence: number;
  amountFit: number;
}

const WEIGHTS = {
  sizeMatch: 25,
  regionMatch: 20,
  sectorMatch: 20,
  competition: 15,
  recurrence: 10,
  amountFit: 10,
} as const;

function scoreSizeMatch(company: CompanyData, opportunity: OpportunityData): number {
  if (!company.category || !opportunity.winnerCategories?.length) return 50;
  const matches = opportunity.winnerCategories.includes(company.category);
  return matches ? 100 : 30;
}

function scoreRegionMatch(company: CompanyData, opportunity: OpportunityData): number {
  if (!company.region || !opportunity.region) return 50;
  return company.region === opportunity.region ? 100 : 40;
}

function scoreSectorMatch(company: CompanyData, opportunity: OpportunityData): number {
  if (!company.nafCode || !opportunity.cpvSector) return 50;
  // NAF prefix match with CPV sector (approximate matching)
  const nafPrefix = company.nafCode.substring(0, 2);
  const NAF_TO_CPV: Record<string, string[]> = {
    '62': ['72', '48'], // IT development → IT services, Software
    '63': ['72', '48'], // IT services → IT services, Software
    '58': ['48'],       // Software publishing
    '70': ['79'],       // Management consulting → Business services
    '71': ['71'],       // Architecture & engineering
    '73': ['79'],       // Advertising → Business services
    '78': ['79'],       // Employment services
    '85': ['80'],       // Education → Training
    '61': ['64'],       // Telecom
  };

  const matchingCpvs = NAF_TO_CPV[nafPrefix] ?? [];
  return matchingCpvs.includes(opportunity.cpvSector) ? 100 : 30;
}

function scoreCompetition(opportunity: OpportunityData): number {
  const offers = opportunity.avgOffersReceived ?? 0;
  if (offers === 0) return 50;
  if (offers <= 3) return 90;
  if (offers <= 5) return 70;
  if (offers <= 10) return 50;
  return 30;
}

function scoreRecurrence(opportunity: OpportunityData): number {
  const loyalty = opportunity.buyerLoyaltyPct ?? 0;
  if (loyalty === 0) return 80; // No loyalty = open market
  if (loyalty >= 60) return 20; // Locked market
  if (loyalty >= 40) return 40;
  return 60;
}

function scoreAmountFit(company: CompanyData, opportunity: OpportunityData): number {
  const ca = company.caDernier ?? 0;
  const amount = opportunity.estimatedAmount ?? 0;
  if (ca === 0 || amount === 0) return 50;

  const ratio = amount / ca;
  if (ratio <= 0.1) return 90;  // Small contract relative to CA
  if (ratio <= 0.3) return 70;  // Comfortable
  if (ratio <= 0.5) return 50;  // Stretching
  return 30;                     // Too large
}

export function calculateWinnabilityScore(
  company: CompanyData,
  opportunity: OpportunityData,
): ScoreBreakdown {
  const sizeMatch = scoreSizeMatch(company, opportunity);
  const regionMatch = scoreRegionMatch(company, opportunity);
  const sectorMatch = scoreSectorMatch(company, opportunity);
  const competition = scoreCompetition(opportunity);
  const recurrence = scoreRecurrence(opportunity);
  const amountFit = scoreAmountFit(company, opportunity);

  const total = Math.round(
    (sizeMatch * WEIGHTS.sizeMatch +
      regionMatch * WEIGHTS.regionMatch +
      sectorMatch * WEIGHTS.sectorMatch +
      competition * WEIGHTS.competition +
      recurrence * WEIGHTS.recurrence +
      amountFit * WEIGHTS.amountFit) / 100,
  );

  return {
    total,
    sizeMatch,
    regionMatch,
    sectorMatch,
    competition,
    recurrence,
    amountFit,
  };
}

export function scoreLabel(total: number): 'GO' | 'MAYBE' | 'PASS' {
  if (total >= 65) return 'GO';
  if (total >= 40) return 'MAYBE';
  return 'PASS';
}
