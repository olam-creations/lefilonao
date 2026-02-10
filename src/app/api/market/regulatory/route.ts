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
  const nature = params.get('nature') ?? '';
  const limit = Math.min(Number(params.get('limit')) || 20, 50);
  const offset = Number(params.get('offset')) || 0;

  try {
    const supabase = getSupabase();
    let query = supabase
      .from('jorf_alerts')
      .select('id, title, nature, publication_date, signatory, nor_code, url, keywords_matched, description', { count: 'exact' })
      .order('publication_date', { ascending: false });

    if (nature) {
      query = query.eq('nature', nature);
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

    const alerts = (data ?? []).map((r) => ({
      id: r.id,
      title: r.title,
      nature: r.nature,
      publicationDate: r.publication_date,
      signatory: r.signatory,
      norCode: r.nor_code,
      url: r.url,
      keywordsMatched: r.keywords_matched,
      description: r.description,
    }));

    return NextResponse.json({ alerts, total: count ?? 0 });
  } catch {
    return NextResponse.json({ error: 'Une erreur est survenue' }, { status: 500 });
  }
}
