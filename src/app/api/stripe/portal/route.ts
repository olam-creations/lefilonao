import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/require-auth';
import { rateLimit, STANDARD_LIMIT } from '@/lib/rate-limit';
import { createPortalSession } from '@/lib/stripe';
import { getSupabase } from '@/lib/supabase';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3050';

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
      .select('stripe_customer_id')
      .eq('user_email', email)
      .single();

    if (!data?.stripe_customer_id) {
      return NextResponse.json({ error: 'Aucun abonnement Stripe trouvé' }, { status: 404 });
    }

    const { url } = await createPortalSession(data.stripe_customer_id, `${APP_URL}/dashboard/settings`);
    return NextResponse.json({ url });
  } catch (error) {
    console.error('[stripe-portal]', error instanceof Error ? error.message : error);
    return NextResponse.json({ error: 'Erreur portail Stripe. Réessayez.' }, { status: 500 });
  }
}
