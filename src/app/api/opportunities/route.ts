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
  const cpv = params.get('cpv') ?? '';
  const region = params.get('region') ?? '';
  const amountMin = Number(params.get('amount_min')) || 0;
  const amountMax = Number(params.get('amount_max')) || 0;
  const deadlineDays = Number(params.get('deadline_days')) || 0;
  const search = params.get('search') ?? '';
  const sort = params.get('sort') ?? 'deadline_asc';
  const limit = Math.min(Number(params.get('limit')) || 20, 100);
  const offset = Number(params.get('offset')) || 0;

  try {
    const supabase = getSupabase();
    let query = supabase
      .from('boamp_notices')
      .select('id, title, buyer_name, buyer_siret, cpv_code, cpv_sector, deadline, publication_date, dce_url, region, departement, nature, procedure_type, lots_count, estimated_amount, description, source, is_open, dce_analyses(status)', { count: 'exact' })
      .eq('is_open', true);

    const sortMap: Record<string, { column: string; ascending: boolean; nullsFirst?: boolean }> = {
      deadline_asc: { column: 'deadline', ascending: true },
      deadline_desc: { column: 'deadline', ascending: false },
      amount_desc: { column: 'estimated_amount', ascending: false, nullsFirst: false },
      amount_asc: { column: 'estimated_amount', ascending: true },
      date_desc: { column: 'publication_date', ascending: false },
    };
    const sortConfig = sortMap[sort] ?? sortMap.deadline_asc;
    query = query.order(sortConfig.column, {
      ascending: sortConfig.ascending,
      ...(sortConfig.nullsFirst !== undefined ? { nullsFirst: sortConfig.nullsFirst } : {}),
    });

    if (cpv) {
      query = query.eq('cpv_sector', cpv);
    }
    if (region) {
      query = query.eq('region', region);
    }
    if (amountMin > 0) {
      query = query.gte('estimated_amount', amountMin);
    }
    if (amountMax > 0) {
      query = query.lte('estimated_amount', amountMax);
    }
    if (deadlineDays > 0) {
      const maxDate = new Date();
      maxDate.setDate(maxDate.getDate() + deadlineDays);
      query = query.lte('deadline', maxDate.toISOString());
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

    const now = new Date();
    const twoDaysAgo = new Date();
    twoDaysAgo.setHours(twoDaysAgo.getHours() - 48);
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

    const opportunities = (data ?? []).map((r) => {
      const deadline = r.deadline ? new Date(r.deadline) : null;
      const pubDate = r.publication_date ? new Date(r.publication_date) : null;
      const isNew = pubDate ? pubDate > twoDaysAgo : false;
      const isUrgent = deadline ? deadline < sevenDaysFromNow && deadline > now : false;
      const daysLeft = deadline ? Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : null;

      // dce_analyses is a joined object (1:1 FK) — extract status
      const dceAnalysis = (r as Record<string, unknown>).dce_analyses as { status: string } | null;
      const analysisStatus = dceAnalysis?.status ?? null;

      return {
        id: r.id,
        title: r.title,
        buyerName: r.buyer_name,
        buyerSiret: r.buyer_siret,
        cpvCode: r.cpv_code,
        cpvSector: r.cpv_sector,
        deadline: r.deadline,
        publicationDate: r.publication_date,
        dceUrl: r.dce_url,
        region: r.region,
        nature: r.nature,
        procedureType: r.procedure_type,
        lotsCount: r.lots_count,
        estimatedAmount: Number(r.estimated_amount) || 0,
        description: r.description,
        source: r.source,
        isNew,
        isUrgent,
        daysLeft,
        analysisStatus,
      };
    });

    return NextResponse.json({ opportunities, total: count ?? 0 });
  } catch (err) {
    return NextResponse.json({ error: 'Une erreur est survenue' }, { status: 500 });
  }
}
