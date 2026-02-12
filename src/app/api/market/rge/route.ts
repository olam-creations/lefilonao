import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';
import { requireAuth } from '@/lib/require-auth';
import { rateLimit, STANDARD_LIMIT } from '@/lib/rate-limit';
import { sanitizeSearch } from '@/lib/sanitize-search';

export async function GET(req: NextRequest) {
  const limited = await rateLimit(req, STANDARD_LIMIT);
  if (limited) return limited;

  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;

  const params = req.nextUrl.searchParams;
  const siret = params.get('siret') ?? '';
  const siren = params.get('siren') ?? '';
  const domaine = params.get('domaine') ?? '';
  const dept = params.get('dept') ?? '';
  const search = params.get('search') ?? '';
  const limit = Math.min(Number(params.get('limit')) || 20, 100);
  const offset = Number(params.get('offset')) || 0;

  try {
    const supabase = getSupabase();
    let query = supabase
      .from('rge_certifications')
      .select('id, siret, company_name, code_qualification, nom_qualification, organisme, domaine, date_debut, date_fin, commune, departement, region, url_qualification', { count: 'exact' })
      .gte('date_fin', new Date().toISOString().split('T')[0])
      .order('date_fin', { ascending: true });

    if (siret) {
      if (!/^\d{14}$/.test(siret)) {
        return NextResponse.json({ error: 'SIRET invalide (14 chiffres)' }, { status: 400 });
      }
      query = query.eq('siret', siret);
    }
    if (siren) {
      if (!/^\d{9}$/.test(siren)) {
        return NextResponse.json({ error: 'SIREN invalide (9 chiffres)' }, { status: 400 });
      }
      query = query.like('siret', `${siren}%`);
    }
    if (domaine) {
      const safeDomaine = sanitizeSearch(domaine);
      query = query.ilike('domaine', `%${safeDomaine}%`);
    }
    if (dept) {
      query = query.eq('departement', dept);
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

    const certifications = (data ?? []).map((r) => ({
      id: r.id,
      siret: r.siret,
      companyName: r.company_name,
      codeQualification: r.code_qualification,
      nomQualification: r.nom_qualification,
      organisme: r.organisme,
      domaine: r.domaine,
      dateDebut: r.date_debut,
      dateFin: r.date_fin,
      commune: r.commune,
      departement: r.departement,
      region: r.region,
      urlQualification: r.url_qualification,
    }));

    return NextResponse.json({ certifications, total: count ?? 0 });
  } catch {
    return NextResponse.json({ error: 'Une erreur est survenue' }, { status: 500 });
  }
}
