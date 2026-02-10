import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/require-auth';
import { rateLimit, STANDARD_LIMIT } from '@/lib/rate-limit';
import { getSupabase } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  const limited = await rateLimit(req, STANDARD_LIMIT);
  if (limited) return limited;

  const auth = requireAuth(req);
  if (!auth.ok) return auth.response;
  const { email } = auth.auth;

  const supabase = getSupabase();

  try {
    const { data, error } = await supabase
      .from('user_settings')
      .select('plan, stripe_customer_id, stripe_subscription_id, stripe_status, current_period_end, cancel_at_period_end')
      .eq('user_email', email)
      .single();

    if (error || !data) {
      return NextResponse.json({
        plan: 'free',
        stripe_status: 'none',
        stripe_customer_id: null,
        stripe_subscription_id: null,
        current_period_end: null,
        cancel_at_period_end: false,
      });
    }

    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: 'Une erreur est survenue' }, { status: 500 });
  }
}
