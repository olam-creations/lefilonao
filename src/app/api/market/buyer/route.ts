import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';
import { requireAuth } from '@/lib/require-auth';
import { rateLimit, STANDARD_LIMIT } from '@/lib/rate-limit';
import { CPV_NAMES } from '@/components/market/utils';

export async function GET(req: NextRequest) {
  const limited = await rateLimit(req, STANDARD_LIMIT);
  if (limited) return limited;

  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;

  const siret = req.nextUrl.searchParams.get('siret');
  const name = req.nextUrl.searchParams.get('name');

  if (!siret && !name) {
    return NextResponse.json({ error: 'siret or name parameter required' }, { status: 400 });
  }

  try {
    const supabase = getSupabase();

    // Fetch attributions for this buyer
    let query = supabase
      .from('decp_attributions')
      .select('id, title, winner_name, winner_siret, amount, notification_date, cpv_code, region, offers_received, duration_months, social_clause, environmental_clause');

    if (siret) {
      query = query.eq('buyer_siret', siret);
    } else if (name) {
      query = query.eq('buyer_name', name);
    }

    const { data, error } = await query.limit(5000);
    if (error) return NextResponse.json({ error: 'Une erreur est survenue' }, { status: 500 });

    const rows = data ?? [];
    if (rows.length === 0) {
      return NextResponse.json({ buyer: null });
    }

    const totalVolume = rows.reduce((s, r) => s + (Number(r.amount) || 0), 0);

    // Fetch company info if siret available
    let companyInfo = null;
    if (siret) {
      const { data: companyData } = await supabase
        .from('companies')
        .select('*')
        .eq('siret', siret)
        .limit(1);
      companyInfo = companyData?.[0] ?? null;
    }

    // Top winners (skip unresolved SIRETs)
    const isSiret = (s: string) => /^\d{9,14}$/.test((s ?? '').trim());
    const winnerMap = new Map<string, { count: number; volume: number }>();
    for (const r of rows) {
      const w = r.winner_name as string;
      if (w && !isSiret(w)) {
        const entry = winnerMap.get(w) ?? { count: 0, volume: 0 };
        entry.count += 1;
        entry.volume += Number(r.amount) || 0;
        winnerMap.set(w, entry);
      }
    }
    const topWinners = [...winnerMap.entries()]
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 8)
      .map(([n, v]) => ({
        name: n,
        count: v.count,
        volume: Math.round(v.volume),
        loyaltyPct: Math.round((v.count / rows.length) * 100),
      }));

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

    // Avg offers received
    const offersRows = rows.filter((r) => r.offers_received && Number(r.offers_received) > 0);
    const avgOffers = offersRows.length > 0
      ? Math.round(offersRows.reduce((s, r) => s + Number(r.offers_received), 0) / offersRows.length)
      : 0;

    // Social/environmental clauses
    const socialCount = rows.filter((r) => r.social_clause).length;
    const envCount = rows.filter((r) => r.environmental_clause).length;

    // Average duration
    const durationRows = rows.filter((r) => r.duration_months && Number(r.duration_months) > 0);
    const avgDuration = durationRows.length > 0
      ? Math.round(durationRows.reduce((s, r) => s + Number(r.duration_months), 0) / durationRows.length)
      : 0;

    // Trend (12 months)
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

    // Recent contracts
    const recentContracts = [...rows]
      .filter((r) => r.notification_date)
      .sort((a, b) => String(b.notification_date).localeCompare(String(a.notification_date)))
      .slice(0, 8)
      .map((r) => ({
        id: r.id as string,
        title: r.title as string,
        winnerName: r.winner_name as string,
        amount: Number(r.amount) || 0,
        date: r.notification_date as string,
      }));

    return NextResponse.json({
      buyer: {
        name: name ?? companyInfo?.name ?? siret,
        siret: siret ?? '',
        company: companyInfo,
        totalContracts: rows.length,
        totalVolume: Math.round(totalVolume),
        avgAmount: rows.length > 0 ? Math.round(totalVolume / rows.length) : 0,
        topWinners,
        sectors,
        regions,
        avgOffers,
        avgDuration,
        socialClausePct: rows.length > 0 ? Math.round((socialCount / rows.length) * 100) : 0,
        environmentalClausePct: rows.length > 0 ? Math.round((envCount / rows.length) * 100) : 0,
        recentContracts,
        trend,
      },
    });
  } catch (err) {
    return NextResponse.json({ error: 'Une erreur est survenue' }, { status: 500 });
  }
}
