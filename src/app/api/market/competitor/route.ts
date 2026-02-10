import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';
import { requireAuth } from '@/lib/require-auth';
import { rateLimit, STANDARD_LIMIT } from '@/lib/rate-limit';
import { CPV_NAMES } from '@/components/market/utils';

export async function GET(req: NextRequest) {
  const limited = await rateLimit(req, STANDARD_LIMIT);
  if (limited) return limited;

  const auth = requireAuth(req);
  if (!auth.ok) return auth.response;

  const siret = req.nextUrl.searchParams.get('siret');
  const name = req.nextUrl.searchParams.get('name');

  if (!siret && !name) {
    return NextResponse.json({ error: 'siret or name parameter required' }, { status: 400 });
  }

  try {
    const supabase = getSupabase();

    // Fetch attributions won by this competitor
    let query = supabase
      .from('decp_attributions')
      .select('id, title, buyer_name, buyer_siret, amount, notification_date, cpv_code, region, offers_received, winner_siret_2, winner_siret_3, winner_name_2, winner_name_3, groupement_type');

    if (siret) {
      query = query.eq('winner_siret', siret);
    } else if (name) {
      query = query.eq('winner_name', name);
    }

    const { data, error } = await query.limit(5000);
    if (error) return NextResponse.json({ error: 'Une erreur est survenue' }, { status: 500 });

    const rows = data ?? [];
    if (rows.length === 0) {
      return NextResponse.json({ competitor: null });
    }

    const totalVolume = rows.reduce((s, r) => s + (Number(r.amount) || 0), 0);

    // Fetch company info
    let companyInfo = null;
    if (siret) {
      const { data: companyData } = await supabase
        .from('companies')
        .select('*')
        .eq('siret', siret)
        .limit(1);
      companyInfo = companyData?.[0] ?? null;
    }

    const isSiret = (s: string) => /^\d{9,14}$/.test((s ?? '').trim());

    // Top buyers
    const buyerMap = new Map<string, { count: number; volume: number }>();
    for (const r of rows) {
      const b = r.buyer_name as string;
      if (b && !isSiret(b)) {
        const entry = buyerMap.get(b) ?? { count: 0, volume: 0 };
        entry.count += 1;
        entry.volume += Number(r.amount) || 0;
        buyerMap.set(b, entry);
      }
    }
    const topBuyers = [...buyerMap.entries()]
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 8)
      .map(([n, v]) => ({ name: n, count: v.count, volume: Math.round(v.volume) }));

    // Sectors
    const sectorMap = new Map<string, number>();
    for (const r of rows) {
      if (r.cpv_code) {
        const code = String(r.cpv_code).substring(0, 2);
        sectorMap.set(code, (sectorMap.get(code) ?? 0) + 1);
      }
    }
    const sectors = [...sectorMap.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([code, count]) => ({ code, name: CPV_NAMES[code] ?? code, count }));

    // Regions
    const regionMap = new Map<string, number>();
    for (const r of rows) {
      if (r.region) regionMap.set(r.region as string, (regionMap.get(r.region as string) ?? 0) + 1);
    }
    const regions = [...regionMap.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([rName, count]) => ({ name: rName, count }));

    // Co-traitants (partners in groupements)
    const partnerMap = new Map<string, number>();
    for (const r of rows) {
      if (r.groupement_type) {
        const p2 = r.winner_name_2 as string;
        const p3 = r.winner_name_3 as string;
        if (p2 && !isSiret(p2)) partnerMap.set(p2, (partnerMap.get(p2) ?? 0) + 1);
        if (p3 && !isSiret(p3)) partnerMap.set(p3, (partnerMap.get(p3) ?? 0) + 1);
      }
    }
    const partners = [...partnerMap.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([partnerName, count]) => ({ name: partnerName, count }));

    // Win rate estimate (when offers_received is available)
    const offersRows = rows.filter((r) => r.offers_received && Number(r.offers_received) > 0);
    const avgOffers = offersRows.length > 0
      ? Math.round(offersRows.reduce((s, r) => s + Number(r.offers_received), 0) / offersRows.length)
      : 0;
    const estimatedWinRate = avgOffers > 0 ? Math.round((1 / avgOffers) * 100) : 0;

    // Trend
    const trendMap = new Map<string, { count: number; volume: number }>();
    for (const r of rows) {
      if (!r.notification_date) continue;
      const month = String(r.notification_date).substring(0, 7);
      const entry = trendMap.get(month) ?? { count: 0, volume: 0 };
      entry.count += 1;
      entry.volume += Number(r.amount) || 0;
      trendMap.set(month, entry);
    }
    const trend = [...trendMap.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-12)
      .map(([month, v]) => ({ month, count: v.count, volume: Math.round(v.volume) }));

    // Recent wins
    const recentWins = [...rows]
      .filter((r) => r.notification_date)
      .sort((a, b) => String(b.notification_date).localeCompare(String(a.notification_date)))
      .slice(0, 8)
      .map((r) => ({
        id: r.id as string,
        title: r.title as string,
        buyerName: r.buyer_name as string,
        amount: Number(r.amount) || 0,
        date: r.notification_date as string,
      }));

    return NextResponse.json({
      competitor: {
        name: name ?? companyInfo?.name ?? siret,
        siret: siret ?? '',
        company: companyInfo,
        totalWins: rows.length,
        totalVolume: Math.round(totalVolume),
        avgBudget: rows.length > 0 ? Math.round(totalVolume / rows.length) : 0,
        topBuyers,
        sectors,
        regions,
        partners,
        avgOffers,
        estimatedWinRate,
        recentWins,
        trend,
      },
    });
  } catch (err) {
    return NextResponse.json({ error: 'Une erreur est survenue' }, { status: 500 });
  }
}
