import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';
import { requireAuth } from '@/lib/require-auth';
import { rateLimit, STANDARD_LIMIT } from '@/lib/rate-limit';

export async function GET(req: NextRequest) {
  const limited = await rateLimit(req, STANDARD_LIMIT);
  if (limited) return limited;

  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;

  const params = req.nextUrl.searchParams;
  const entityId = params.get('entityId');
  const depth = Math.min(Math.max(Number(params.get('depth')) || 1, 1), 3);
  const edgeTypesRaw = params.get('edgeTypes');

  if (!entityId) {
    return NextResponse.json({ error: 'entityId requis' }, { status: 400 });
  }

  try {
    const supabase = getSupabase();
    const edgeTypes = edgeTypesRaw ? edgeTypesRaw.split(',') : null;

    const { data, error } = await supabase.rpc('get_neighbors', {
      p_entity_id: entityId,
      p_max_depth: depth,
      p_edge_types: edgeTypes,
    });

    if (error) {
      return NextResponse.json({ error: 'Erreur de recherche' }, { status: 500 });
    }

    return NextResponse.json({ neighbors: data ?? [] });
  } catch {
    return NextResponse.json({ error: 'Une erreur est survenue' }, { status: 500 });
  }
}
