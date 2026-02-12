import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/require-auth';
import { rateLimit, STANDARD_LIMIT } from '@/lib/rate-limit';
import { getSupabase } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  const limited = await rateLimit(req, STANDARD_LIMIT);
  if (limited) return limited;

  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;
  const { email } = auth.auth;

  const supabase = getSupabase();

  try {
    const { data, error } = await supabase
      .from('user_settings')
      .select('plan, stripe_customer_id, stripe_status, current_period_end, cancel_at_period_end')
      .eq('user_email', email)
      .single();

    if (error || !data) {
      return NextResponse.json({
        plan: 'free',
        stripe_status: 'none',
        has_stripe_customer: false,
        current_period_end: null,
        cancel_at_period_end: false,
      });
    }

    // Don't leak Stripe IDs to client — expose boolean instead
    return NextResponse.json({
      plan: data.plan,
      stripe_status: data.stripe_status,
      has_stripe_customer: !!data.stripe_customer_id,
      current_period_end: data.current_period_end,
      cancel_at_period_end: data.cancel_at_period_end,
    });
  } catch {
    return NextResponse.json({ error: 'Une erreur est survenue' }, { status: 500 });
  }
}
