import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';

export async function GET(req: NextRequest) {
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

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

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

    return NextResponse.json({ renewals, totalCount: renewals.length });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
