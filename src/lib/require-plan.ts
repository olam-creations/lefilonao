import { NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';
import { canAccess, type FeatureKey, type Plan } from '@/lib/features';

/** Single source of truth: read plan from Supabase. */
export async function getUserPlan(email: string): Promise<Plan> {
  const supabase = getSupabase();
  const { data } = await supabase
    .from('user_settings')
    .select('plan')
    .eq('user_email', email)
    .single();

  const plan = data?.plan;
  if (plan === 'admin') return 'admin';
  if (plan === 'pro') return 'pro';
  return 'free';
}

/** Returns a 403 response if the user cannot access the given feature, or null if allowed. */
export async function requireFeature(email: string, feature: FeatureKey): Promise<NextResponse | null> {
  const plan = await getUserPlan(email);

  if (!canAccess(feature, plan)) {
    return NextResponse.json(
      { error: 'Cette fonctionnalité nécessite un abonnement Pro', feature },
      { status: 403 },
    );
  }

  return null;
}

/** Legacy: returns 403 if not Pro. Prefer requireFeature() for granular gating. */
export async function requirePro(email: string): Promise<NextResponse | null> {
  const plan = await getUserPlan(email);

  if (plan !== 'pro' && plan !== 'admin') {
    return NextResponse.json(
      { error: 'Cette fonctionnalité nécessite un abonnement Pro' },
      { status: 403 },
    );
  }

  return null;
}
