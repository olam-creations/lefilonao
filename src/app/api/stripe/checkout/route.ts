import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/require-auth';
import { rateLimit, STANDARD_LIMIT } from '@/lib/rate-limit';
import { createCheckoutSession } from '@/lib/stripe';
import { getSupabase } from '@/lib/supabase';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3050';

export async function POST(req: NextRequest) {
  const limited = await rateLimit(req, STANDARD_LIMIT);
  if (limited) return limited;

  const auth = requireAuth(req);
  if (!auth.ok) return auth.response;
  const { email } = auth.auth;

  try {
    // Reuse existing Stripe customer to avoid duplicates on re-subscription
    const supabase = getSupabase();
    const { data } = await supabase
      .from('user_settings')
      .select('stripe_customer_id')
      .eq('user_email', email)
      .single();

    const { clientSecret } = await createCheckoutSession({
      email,
      customerId: data?.stripe_customer_id ?? undefined,
      returnUrl: `${APP_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
    });

    return NextResponse.json({ clientSecret });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur lors du paiement';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
