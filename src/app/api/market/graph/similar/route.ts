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
  const limit = Math.min(Math.max(Number(params.get('limit')) || 10, 1), 50);

  if (!entityId) {
    return NextResponse.json({ error: 'entityId requis' }, { status: 400 });
  }

  try {
    const supabase = getSupabase();

    // Get neighbors of the source entity
    const { data: sourceNeighbors, error: srcErr } = await supabase.rpc('get_neighbors', {
      p_entity_id: entityId,
      p_max_depth: 1,
      p_edge_types: null,
    });

    if (srcErr || !sourceNeighbors) {
      return NextResponse.json({ error: 'Erreur de recherche' }, { status: 500 });
    }

    const sourceSet = new Set(sourceNeighbors.map((n: { entity_id: string }) => n.entity_id));

    // Get source entity info
    const { data: sourceEntity } = await supabase
      .from('kg_entities')
      .select('id, entity_type, name, external_id')
      .eq('id', entityId)
      .limit(1);

    if (!sourceEntity?.[0]) {
      return NextResponse.json({ error: 'Entite introuvable' }, { status: 404 });
    }

    const entityType = sourceEntity[0].entity_type;

    // Get other entities of the same type
    const { data: candidates } = await supabase
      .from('kg_entities')
      .select('id, entity_type, name, external_id')
      .eq('entity_type', entityType)
      .neq('id', entityId)
      .limit(500);

    if (!candidates || candidates.length === 0) {
      return NextResponse.json({ similar: [] });
    }

    // For each candidate, compute Jaccard similarity on neighbor sets
    const similarities: { entity: typeof candidates[0]; similarity: number }[] = [];

    for (const candidate of candidates) {
      const { data: candNeighbors } = await supabase.rpc('get_neighbors', {
        p_entity_id: candidate.id,
        p_max_depth: 1,
        p_edge_types: null,
      });

      if (!candNeighbors || candNeighbors.length === 0) continue;

      const candSet = new Set(candNeighbors.map((n: { entity_id: string }) => n.entity_id));

      // Jaccard: |intersection| / |union|
      let intersection = 0;
      for (const id of candSet) {
        if (sourceSet.has(id)) intersection++;
      }
      const union = sourceSet.size + candSet.size - intersection;
      const jaccard = union > 0 ? intersection / union : 0;

      if (jaccard > 0) {
        similarities.push({ entity: candidate, similarity: Math.round(jaccard * 100) / 100 });
      }
    }

    similarities.sort((a, b) => b.similarity - a.similarity);

    return NextResponse.json({
      similar: similarities.slice(0, limit).map((s) => ({
        ...s.entity,
        similarity: s.similarity,
      })),
    });
  } catch {
    return NextResponse.json({ error: 'Une erreur est survenue' }, { status: 500 });
  }
}
