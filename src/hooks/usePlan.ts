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

  return {
    plan,
    isPro: plan === 'pro',
    aoLimit: plan === 'pro' ? null : FREE_AO_LIMIT,
    can: (feature: FeatureKey) => canAccess(feature, plan),
  };
}
