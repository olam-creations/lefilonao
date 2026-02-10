import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';
import { requireAuth } from '@/lib/require-auth';
import { rateLimit, STANDARD_LIMIT } from '@/lib/rate-limit';
import { sanitizeSearch } from '@/lib/sanitize-search';

export async function GET(req: NextRequest) {
  const limited = rateLimit(req, STANDARD_LIMIT);
  if (limited) return limited;

  const auth = requireAuth(req);
  if (!auth.ok) return auth.response;

  const params = req.nextUrl.searchParams;
  const cpv = params.get('cpv') ?? '';
  const region = params.get('region') ?? '';
  const search = params.get('search') ?? '';
  const limit = Math.min(Number(params.get('limit')) || 20, 100);
  const offset = Number(params.get('offset')) || 0;

  try {
    const supabase = getSupabase();
    let query = supabase
      .from('approch_projects')
      .select('code, title, description, status, buyer_siren, buyer_name, cpv_codes, cpv_sector, estimated_amount, duration_months, expected_publication_date, expected_deadline, procedure_type, link, region, departement, considerations_sociales, considerations_environnementales', { count: 'exact' })
      .neq('status', 'Clos')
      .order('expected_publication_date', { ascending: true });

    if (cpv) {
      query = query.eq('cpv_sector', cpv);
    }
    if (region) {
      query = query.eq('region', region);
    }
    if (search) {
      const safeSearch = sanitizeSearch(search);
      query = query.ilike('title', `%${safeSearch}%`);
    }

    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      return NextResponse.json({ error: 'Une erreur est survenue' }, { status: 500 });
    }

    const projects = (data ?? []).map((r) => ({
      code: r.code,
      title: r.title,
      description: r.description,
      status: r.status,
      buyerSiren: r.buyer_siren,
      buyerName: r.buyer_name,
      cpvCodes: r.cpv_codes,
      cpvSector: r.cpv_sector,
      estimatedAmount: r.estimated_amount,
      durationMonths: r.duration_months,
      expectedPublicationDate: r.expected_publication_date,
      expectedDeadline: r.expected_deadline,
      procedureType: r.procedure_type,
      link: r.link,
      region: r.region,
      considerationsSociales: r.considerations_sociales,
      considerationsEnvironnementales: r.considerations_environnementales,
    }));

    const res = NextResponse.json({ projects, total: count ?? 0 });
    res.headers.set('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=7200');
    return res;
  } catch {
    return NextResponse.json({ error: 'Une erreur est survenue' }, { status: 500 });
  }
}
