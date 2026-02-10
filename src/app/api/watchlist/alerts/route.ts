import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';
import { requireAuth } from '@/lib/require-auth';
import { rateLimit, STANDARD_LIMIT } from '@/lib/rate-limit';

export async function GET(req: NextRequest) {
  const limited = await rateLimit(req, STANDARD_LIMIT);
  if (limited) return limited;

  const auth = requireAuth(req);
  if (!auth.ok) return auth.response;
  const { email } = auth.auth;

  try {
    const supabase = getSupabase();

    // Get watched buyer names
    const { data: watchlist, error: wErr } = await supabase
      .from('user_watchlist')
      .select('buyer_name')
      .eq('user_email', email);

    if (wErr) {
      return NextResponse.json({ error: 'Une erreur est survenue' }, { status: 500 });
    }

    const buyerNames = (watchlist ?? []).map((w) => w.buyer_name);
    if (buyerNames.length === 0) {
      return NextResponse.json({ alerts: [] });
    }

    // Get recent attributions from watched buyers (last 30 days)
    const since = new Date();
    since.setDate(since.getDate() - 30);

    const { data: attributions, error: aErr } = await supabase
      .from('decp_attributions')
      .select('id, title, buyer_name, notification_date, amount, cpv_code')
      .in('buyer_name', buyerNames)
      .gte('notification_date', since.toISOString().split('T')[0])
      .order('notification_date', { ascending: false })
      .limit(50);

    if (aErr) {
      return NextResponse.json({ error: 'Une erreur est survenue' }, { status: 500 });
    }

    const alerts = (attributions ?? []).map((a) => ({
      id: a.id,
      title: a.title,
      buyer_name: a.buyer_name,
      notification_date: a.notification_date,
      amount: Number(a.amount) || 0,
      cpv_code: a.cpv_code,
    }));

    return NextResponse.json({ alerts });
  } catch {
    return NextResponse.json({ error: 'Une erreur est survenue' }, { status: 500 });
  }
}
