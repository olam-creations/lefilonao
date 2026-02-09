import type { CompanyProfile } from './dev';
import { MOCK_COMPANY_PROFILE } from './dev';

const STORAGE_KEY = 'lefilonao_profile';

export function getCompanyProfile(): CompanyProfile {
  if (typeof window === 'undefined') return MOCK_COMPANY_PROFILE;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return MOCK_COMPANY_PROFILE;
    return { ...MOCK_COMPANY_PROFILE, ...JSON.parse(raw) };
  } catch {
    return MOCK_COMPANY_PROFILE;
  }
}

export function saveCompanyProfile(profile: CompanyProfile): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
}
