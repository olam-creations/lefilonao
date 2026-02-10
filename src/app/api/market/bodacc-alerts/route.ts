import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';
import { requireAuth } from '@/lib/require-auth';
import { rateLimit, STANDARD_LIMIT } from '@/lib/rate-limit';
import { sanitizeSearch } from '@/lib/sanitize-search';

export async function GET(req: NextRequest) {
  const limited = await rateLimit(req, STANDARD_LIMIT);
  if (limited) return limited;

  const auth = requireAuth(req);
  if (!auth.ok) return auth.response;

  const params = req.nextUrl.searchParams;
  const search = params.get('search') ?? '';
  const alertType = params.get('alert_type') ?? '';
  const severity = params.get('severity') ?? '';
  const limit = Math.min(Number(params.get('limit')) || 20, 50);
  const offset = Number(params.get('offset')) || 0;

  try {
    const supabase = getSupabase();
    let query = supabase
      .from('bodacc_alerts')
      .select('id, siren, company_name, alert_type, alert_severity, publication_date, tribunal, ville, region, description', { count: 'exact' })
      .order('publication_date', { ascending: false });

    if (alertType) {
      query = query.eq('alert_type', alertType);
    }
    if (severity) {
      query = query.eq('alert_severity', severity);
    }
    if (search) {
      const safeSearch = sanitizeSearch(search);
      query = query.ilike('company_name', `%${safeSearch}%`);
    }

    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      return NextResponse.json({ error: 'Une erreur est survenue' }, { status: 500 });
    }

    const alerts = (data ?? []).map((a) => ({
      id: a.id,
      siren: a.siren,
      companyName: a.company_name,
      alertType: a.alert_type,
      alertSeverity: a.alert_severity,
      publicationDate: a.publication_date,
      tribunal: a.tribunal,
      ville: a.ville,
      region: a.region,
      description: a.description,
    }));

    return NextResponse.json({ alerts, total: count ?? 0 });
  } catch {
    return NextResponse.json({ error: 'Une erreur est survenue' }, { status: 500 });
  }
}
