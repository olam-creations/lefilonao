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
  const siren = params.get('siren') ?? '';
  const region = params.get('region') ?? '';
  const search = params.get('search') ?? '';
  const exercice = Number(params.get('exercice')) || 0;
  const limit = Math.min(Number(params.get('limit')) || 20, 100);
  const offset = Number(params.get('offset')) || 0;

  try {
    const supabase = getSupabase();
    let query = supabase
      .from('subventions')
      .select('id, beneficiaire_nom, beneficiaire_siren, attribuant_nom, attribuant_siren, montant, nature, objet, date_attribution, exercice, region, departement', { count: 'exact' })
      .order('date_attribution', { ascending: false });

    if (siren) {
      if (!/^\d{9}$/.test(siren)) {
        return NextResponse.json({ error: 'SIREN invalide (9 chiffres)' }, { status: 400 });
      }
      query = query.or(`beneficiaire_siren.eq.${siren},attribuant_siren.eq.${siren}`);
    }
    if (region) {
      query = query.eq('region', region);
    }
    if (exercice > 0) {
      query = query.eq('exercice', exercice);
    }
    if (search) {
      const safeSearch = sanitizeSearch(search);
      query = query.or(`beneficiaire_nom.ilike.%${safeSearch}%,objet.ilike.%${safeSearch}%`);
    }

    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      return NextResponse.json({ error: 'Une erreur est survenue' }, { status: 500 });
    }

    const subventions = (data ?? []).map((r) => ({
      id: r.id,
      beneficiaireNom: r.beneficiaire_nom,
      beneficiaireSiren: r.beneficiaire_siren,
      attribuantNom: r.attribuant_nom,
      attribuantSiren: r.attribuant_siren,
      montant: Number(r.montant) || 0,
      nature: r.nature,
      objet: r.objet,
      dateAttribution: r.date_attribution,
      exercice: r.exercice,
      region: r.region,
    }));

    return NextResponse.json({ subventions, total: count ?? 0 });
  } catch {
    return NextResponse.json({ error: 'Une erreur est survenue' }, { status: 500 });
  }
}
