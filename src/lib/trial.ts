import { getTokenPayload, getTrialStart } from './auth';

const TRIAL_DAYS = 14;

export interface TrialInfo {
  isTrialing: boolean;
  daysRemaining: number;
  isExpired: boolean;
  isWarning: boolean;
  startDate: string;
}

interface ApiTrialData {
  startDate?: string;
  endDate?: string;
}

export function computeTrialStatus(
  apiData?: ApiTrialData | null,
): TrialInfo | null {
  let startDate: string | null = null;

  // Layer 1: API response
  if (apiData?.startDate) {
    startDate = apiData.startDate;
  }

  // Layer 2: JWT iat
  if (!startDate) {
    const payload = getTokenPayload();
    if (payload?.iat) {
      startDate = new Date(payload.iat * 1000).toISOString();
    }
  }

  // Layer 3: localStorage trial start
  if (!startDate) {
    startDate = getTrialStart();
  }

  // No data available
  if (!startDate) return null;

  const start = new Date(startDate);
  const end = new Date(start.getTime() + TRIAL_DAYS * 24 * 60 * 60 * 1000);
  const now = new Date();
  const msRemaining = end.getTime() - now.getTime();
  const daysRemaining = Math.max(0, Math.ceil(msRemaining / (1000 * 60 * 60 * 24)));
  const isExpired = daysRemaining <= 0;
  const isWarning = !isExpired && daysRemaining <= 5;

  return {
    isTrialing: !isExpired,
    daysRemaining,
    isExpired,
    isWarning,
    startDate,
  };
}
