export type Plan = 'free' | 'pro' | 'admin';
export type UserRole = 'free' | 'pro' | 'admin';

export type FeatureKey =
  | 'ai-scoring'
  | 'dce-analysis'
  | 'generate-section'
  | 'ai-coach'
  | 'buyer-intelligence'
  | 'csv-export'
  | 'daily-alerts'
  | 'unlimited-ao';

interface FeatureDef {
  readonly minPlan: Plan;
  readonly label: string;
}

export const FEATURES: Record<FeatureKey, FeatureDef> = {
  'ai-scoring':         { minPlan: 'pro', label: 'Score Go/No-Go par IA' },
  'dce-analysis':       { minPlan: 'pro', label: 'Analyse DCE par IA' },
  'generate-section':   { minPlan: 'pro', label: 'Aide à la réponse' },
  'ai-coach':           { minPlan: 'pro', label: 'Coach IA' },
  'buyer-intelligence': { minPlan: 'pro', label: 'Intelligence acheteur' },
  'csv-export':         { minPlan: 'pro', label: 'Export Excel/CSV' },
  'daily-alerts':       { minPlan: 'pro', label: 'Alertes quotidiennes' },
  'unlimited-ao':       { minPlan: 'pro', label: 'AO illimités' },
} as const;

export const FREE_AO_LIMIT = 5;

const PLAN_RANK: Record<Plan, number> = { free: 0, pro: 1, admin: 2 };

export function canAccess(feature: FeatureKey, userPlan: Plan): boolean {
  const def = FEATURES[feature];
  if (!def) return false;
  return PLAN_RANK[userPlan] >= PLAN_RANK[def.minPlan];
}
