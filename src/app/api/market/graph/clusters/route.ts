import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';
import { requireAuth } from '@/lib/require-auth';
import { rateLimit, STANDARD_LIMIT } from '@/lib/rate-limit';

interface GraphNode {
  id: string;
  entity_type: string;
  name: string;
  external_id: string;
}

interface GraphEdge {
  source_id: string;
  target_id: string;
  edge_type: string;
  weight: number;
}

/**
 * BFS to find connected components.
 */
function findClusters(nodes: GraphNode[], edges: GraphEdge[]): GraphNode[][] {
  const adj = new Map<string, Set<string>>();
  const nodeMap = new Map<string, GraphNode>();

  for (const n of nodes) {
    nodeMap.set(n.id, n);
    adj.set(n.id, new Set());
  }

  for (const e of edges) {
    adj.get(e.source_id)?.add(e.target_id);
    adj.get(e.target_id)?.add(e.source_id);
  }

  const visited = new Set<string>();
  const clusters: GraphNode[][] = [];

  for (const n of nodes) {
    if (visited.has(n.id)) continue;
    const cluster: GraphNode[] = [];
    const queue = [n.id];
    visited.add(n.id);

    while (queue.length > 0) {
      const current = queue.shift()!;
      const node = nodeMap.get(current);
      if (node) cluster.push(node);

      for (const neighbor of adj.get(current) ?? []) {
        if (!visited.has(neighbor)) {
          visited.add(neighbor);
          queue.push(neighbor);
        }
      }
    }

    if (cluster.length > 1) clusters.push(cluster);
  }

  return clusters.sort((a, b) => b.length - a.length);
}

export async function GET(req: NextRequest) {
  const limited = await rateLimit(req, STANDARD_LIMIT);
  if (limited) return limited;

  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;

  const params = req.nextUrl.searchParams;
  const entityType = params.get('entityType') ?? 'winner';
  const cpvSector = params.get('cpvSector');

  try {
    const supabase = getSupabase();

    // Load entities of requested type
    let entityQuery = supabase
      .from('kg_entities')
      .select('id, entity_type, name, external_id')
      .eq('entity_type', entityType)
      .limit(200);

    const { data: entities, error: entError } = await entityQuery;
    if (entError || !entities) {
      return NextResponse.json({ error: 'Erreur de chargement' }, { status: 500 });
    }

    const entityIds = entities.map((e) => e.id);
    if (entityIds.length === 0) {
      return NextResponse.json({ clusters: [] });
    }

    // Load edges between these entities
    let edgeQuery = supabase
      .from('kg_edges')
      .select('source_id, target_id, edge_type, weight')
      .in('source_id', entityIds)
      .in('target_id', entityIds)
      .limit(5000);

    if (cpvSector) {
      edgeQuery = edgeQuery.eq('edge_type', 'competes_with');
    }

    const { data: edges, error: edgeError } = await edgeQuery;
    if (edgeError) {
      return NextResponse.json({ error: 'Erreur de chargement' }, { status: 500 });
    }

    const clusters = findClusters(entities, edges ?? []);

    return NextResponse.json({
      clusters: clusters.slice(0, 20).map((c) => ({
        size: c.length,
        entities: c,
      })),
    });
  } catch {
    return NextResponse.json({ error: 'Une erreur est survenue' }, { status: 500 });
  }
}
