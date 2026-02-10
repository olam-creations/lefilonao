import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/require-auth';
import { rateLimit, STANDARD_LIMIT } from '@/lib/rate-limit';
import { createCheckoutSession } from '@/lib/stripe';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3050';

export async function POST(req: NextRequest) {
  const limited = await rateLimit(req, STANDARD_LIMIT);
  if (limited) return limited;

  const auth = requireAuth(req);
  if (!auth.ok) return auth.response;
  const { email } = auth.auth;

  try {
    const { clientSecret } = await createCheckoutSession({
      email,
      returnUrl: `${APP_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
    });

    return NextResponse.json({ clientSecret });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur lors du paiement';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
