import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';
import { requireAuth } from '@/lib/require-auth';
import { rateLimit, STANDARD_LIMIT } from '@/lib/rate-limit';

export async function GET(req: NextRequest) {
  const limited = rateLimit(req, STANDARD_LIMIT);
  if (limited) return limited;

  const auth = requireAuth(req);
  if (!auth.ok) return auth.response;

  const cpv = req.nextUrl.searchParams.get('cpv') ?? '72';

  try {
    const supabase = getSupabase();

    const now = new Date();
    const threeYearsAgo = new Date(now);
    threeYearsAgo.setFullYear(now.getFullYear() - 4);
    const fourYearsAgo = new Date(now);
    fourYearsAgo.setFullYear(now.getFullYear() - 5);

    const { data, error } = await supabase
      .from('decp_attributions')
      .select('id, title, buyer_name, winner_name, amount, notification_date, region')
      .eq('cpv_sector', cpv)
      .gte('notification_date', fourYearsAgo.toISOString().slice(0, 10))
      .lte('notification_date', threeYearsAgo.toISOString().slice(0, 10))
      .not('buyer_name', 'eq', '')
      .not('winner_name', 'eq', '')
      .order('amount', { ascending: false })
      .limit(50);

    if (error) return NextResponse.json({ error: 'Une erreur est survenue' }, { status: 500 });

    const renewals = (data ?? []).map((r) => {
      const notifDate = r.notification_date as string;
      const renewalDate = new Date(notifDate);
      renewalDate.setFullYear(renewalDate.getFullYear() + 4);

      return {
        id: r.id as string,
        title: r.title as string,
        buyerName: r.buyer_name as string,
        winnerName: r.winner_name as string,
        amount: Number(r.amount) || 0,
        notificationDate: notifDate,
        estimatedRenewal: renewalDate.toISOString().slice(0, 10),
        region: (r.region as string) || '',
      };
    });

    const res = NextResponse.json({ renewals, totalCount: renewals.length });
    res.headers.set('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=7200');
    return res;
  } catch (err) {
    return NextResponse.json({ error: 'Une erreur est survenue' }, { status: 500 });
  }
}
