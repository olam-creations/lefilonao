import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';
import { requireAuth } from '@/lib/require-auth';
import { rateLimit, STANDARD_LIMIT } from '@/lib/rate-limit';

export async function GET(req: NextRequest) {
  const limited = await rateLimit(req, STANDARD_LIMIT);
  if (limited) return limited;

  const auth = requireAuth(req);
  if (!auth.ok) return auth.response;

  const cpv = req.nextUrl.searchParams.get('cpv') ?? '72';

  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('decp_attributions')
      .select('is_innovative, social_clause, environmental_clause, notification_date')
      .eq('cpv_sector', cpv)
      .limit(5000);

    if (error) {
      return NextResponse.json({ error: 'Une erreur est survenue' }, { status: 500 });
    }

    const rows = data ?? [];
    const total = rows.length;
    let innovCount = 0;
    let socialCount = 0;
    let envCount = 0;

    const monthMap = new Map<string, { total: number; innov: number; social: number; env: number }>();

    for (const row of rows) {
      const isInnov = row.is_innovative === true;
      const isSocial = row.social_clause === true;
      const isEnv = row.environmental_clause === true;

      if (isInnov) innovCount += 1;
      if (isSocial) socialCount += 1;
      if (isEnv) envCount += 1;

      // Monthly trend
      const date = row.notification_date as string | null;
      if (date) {
        const key = date.substring(0, 7); // YYYY-MM
        const entry = monthMap.get(key) ?? { total: 0, innov: 0, social: 0, env: 0 };
        entry.total += 1;
        if (isInnov) entry.innov += 1;
        if (isSocial) entry.social += 1;
        if (isEnv) entry.env += 1;
        monthMap.set(key, entry);
      }
    }

    const innovationRate = total > 0 ? Math.round((innovCount / total) * 1000) / 10 : 0;
    const socialClauseRate = total > 0 ? Math.round((socialCount / total) * 1000) / 10 : 0;
    const environmentalClauseRate = total > 0 ? Math.round((envCount / total) * 1000) / 10 : 0;

    const MONTH_NAMES = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];

    const trend = [...monthMap.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-12)
      .map(([key, val]) => {
        const monthIdx = Number(key.split('-')[1]) - 1;
        return {
          month: MONTH_NAMES[monthIdx] ?? key,
          innovationPct: val.total > 0 ? Math.round((val.innov / val.total) * 1000) / 10 : 0,
          socialPct: val.total > 0 ? Math.round((val.social / val.total) * 1000) / 10 : 0,
          environmentalPct: val.total > 0 ? Math.round((val.env / val.total) * 1000) / 10 : 0,
        };
      });

    const res = NextResponse.json({
      rse: {
        innovationRate,
        socialClauseRate,
        environmentalClauseRate,
        totalContracts: total,
        trend,
      },
    });
    res.headers.set('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=7200');
    return res;
  } catch (err) {
    return NextResponse.json({ error: 'Une erreur est survenue' }, { status: 500 });
  }
}
