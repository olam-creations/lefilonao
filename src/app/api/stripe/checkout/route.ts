import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/require-auth';
import { rateLimit, STANDARD_LIMIT } from '@/lib/rate-limit';
import { createCheckoutSession } from '@/lib/stripe';
import { getSupabase } from '@/lib/supabase';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3050';

export async function POST(req: NextRequest) {
  const limited = await rateLimit(req, STANDARD_LIMIT);
  if (limited) return limited;

  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;
  const { email } = auth.auth;

  try {
    // Reuse existing Stripe customer to avoid duplicates on re-subscription
    const supabase = getSupabase();
    const { data } = await supabase
      .from('user_settings')
      .select('stripe_customer_id, plan, stripe_status')
      .eq('user_email', email)
      .single();

    // Prevent double subscription — already active pro users should manage via portal
    if (data?.plan === 'pro' && (data.stripe_status === 'active' || data.stripe_status === 'trialing')) {
      return NextResponse.json(
        { error: 'Vous avez déjà un abonnement Pro actif. Gérez-le depuis vos paramètres.' },
        { status: 400 },
      );
    }

    const { clientSecret } = await createCheckoutSession({
      email,
      customerId: data?.stripe_customer_id ?? undefined,
      returnUrl: `${APP_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
    });

    return NextResponse.json({ clientSecret });
  } catch (error) {
    console.error('[stripe-checkout]', error instanceof Error ? error.message : error);
    return NextResponse.json({ error: 'Erreur lors du paiement. Réessayez.' }, { status: 500 });
  }
}
