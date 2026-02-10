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
  const type = params.get('type') ?? '';
  const dept = params.get('dept') ?? '';
  const region = params.get('region') ?? '';
  const search = params.get('search') ?? '';
  const limit = Math.min(Number(params.get('limit')) || 20, 100);
  const offset = Number(params.get('offset')) || 0;

  try {
    const supabase = getSupabase();
    let query = supabase
      .from('public_entities')
      .select('id, nom, type_service, adresse, code_postal, commune, departement, region, telephone, email, url, siren, latitude, longitude', { count: 'exact' })
      .order('nom', { ascending: true });

    if (type) {
      query = query.eq('type_service', type);
    }
    if (dept) {
      query = query.eq('departement', dept);
    }
    if (region) {
      query = query.eq('region', region);
    }
    if (search) {
      const safeSearch = sanitizeSearch(search);
      query = query.ilike('nom', `%${safeSearch}%`);
    }

    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      return NextResponse.json({ error: 'Une erreur est survenue' }, { status: 500 });
    }

    const entities = (data ?? []).map((r) => ({
      id: r.id,
      nom: r.nom,
      typeService: r.type_service,
      adresse: r.adresse,
      codePostal: r.code_postal,
      commune: r.commune,
      departement: r.departement,
      region: r.region,
      telephone: r.telephone,
      email: r.email,
      url: r.url,
      siren: r.siren,
      latitude: r.latitude,
      longitude: r.longitude,
    }));

    return NextResponse.json({ entities, total: count ?? 0 });
  } catch {
    return NextResponse.json({ error: 'Une erreur est survenue' }, { status: 500 });
  }
}
