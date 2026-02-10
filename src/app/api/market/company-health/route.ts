import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';
import { requireAuth } from '@/lib/require-auth';
import { rateLimit, STANDARD_LIMIT } from '@/lib/rate-limit';

export async function GET(req: NextRequest) {
  const limited = rateLimit(req, STANDARD_LIMIT);
  if (limited) return limited;

  const auth = requireAuth(req);
  if (!auth.ok) return auth.response;

  const params = req.nextUrl.searchParams;
  const siret = params.get('siret') ?? '';
  const siren = params.get('siren') ?? '';

  if (!siret && !siren) {
    return NextResponse.json({ error: 'siret ou siren requis' }, { status: 400 });
  }

  if (siren && !/^\d{9}$/.test(siren)) {
    return NextResponse.json({ error: 'SIREN invalide (9 chiffres)' }, { status: 400 });
  }
  if (siret && !/^\d{14}$/.test(siret)) {
    return NextResponse.json({ error: 'SIRET invalide (14 chiffres)' }, { status: 400 });
  }

  const searchSiren = siren || siret.substring(0, 9);

  try {
    const supabase = getSupabase();

    const [alertsResult, companyResult] = await Promise.all([
      supabase
        .from('bodacc_alerts')
        .select('id, siren, company_name, alert_type, alert_severity, publication_date, tribunal, ville, description')
        .eq('siren', searchSiren)
        .order('publication_date', { ascending: false })
        .limit(20),
      supabase
        .from('companies')
        .select('health_status, health_updated_at')
        .eq('siren', searchSiren)
        .limit(1),
    ]);

    if (alertsResult.error || companyResult.error) {
      return NextResponse.json({ error: 'Une erreur est survenue' }, { status: 500 });
    }

    const alerts = (alertsResult.data ?? []).map((a) => ({
      id: a.id,
      companyName: a.company_name,
      alertType: a.alert_type,
      alertSeverity: a.alert_severity,
      publicationDate: a.publication_date,
      tribunal: a.tribunal,
      ville: a.ville,
      description: a.description,
    }));

    const company = companyResult.data?.[0];
    const healthStatus = company?.health_status ?? 'healthy';

    return NextResponse.json({
      alerts,
      healthStatus,
      healthUpdatedAt: company?.health_updated_at ?? null,
    });
  } catch {
    return NextResponse.json({ error: 'Une erreur est survenue' }, { status: 500 });
  }
}
