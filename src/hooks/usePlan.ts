'use client';

import { useUser } from '@/components/UserProvider';
import { canAccess, FREE_AO_LIMIT, type FeatureKey, type Plan } from '@/lib/features';

export interface UsePlanReturn {
  plan: Plan;
  isPro: boolean;
  aoLimit: number | null;
  can: (feature: FeatureKey) => boolean;
}

export function usePlan(): UsePlanReturn {
  const { plan } = useUser();

  const hasPro = plan === 'pro' || plan === 'admin';

  return {
    plan,
    isPro: hasPro,
    aoLimit: hasPro ? null : FREE_AO_LIMIT,
    can: (feature: FeatureKey) => canAccess(feature, plan),
  };
}
