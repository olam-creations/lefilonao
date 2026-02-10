import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/require-auth';
import { rateLimit, STANDARD_LIMIT } from '@/lib/rate-limit';
import { cancelSubscription } from '@/lib/stripe';
import { getSupabase } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  const limited = await rateLimit(req, STANDARD_LIMIT);
  if (limited) return limited;

  const auth = requireAuth(req);
  if (!auth.ok) return auth.response;
  const { email } = auth.auth;

  const supabase = getSupabase();

  try {
    const { data } = await supabase
      .from('user_settings')
      .select('stripe_subscription_id, stripe_status')
      .eq('user_email', email)
      .single();

    if (!data?.stripe_subscription_id || data.stripe_status !== 'active') {
      return NextResponse.json({ error: 'Aucun abonnement actif' }, { status: 400 });
    }

    await cancelSubscription(data.stripe_subscription_id);

    // Optimistic update — webhook will confirm
    await supabase
      .from('user_settings')
      .update({ cancel_at_period_end: true })
      .eq('user_email', email);

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur lors de l\'annulation';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
