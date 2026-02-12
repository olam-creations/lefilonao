'use client';

import { useState, useCallback } from 'react';

export interface GraphNode {
  id: string;
  entityType: 'buyer' | 'winner' | 'cpv' | 'region';
  name: string;
  externalId: string;
  depth: number;
}

export interface GraphEdge {
  source: string;
  target: string;
  edgeType: string;
  weight: number;
}

interface NeighborRow {
  entity_id: string;
  entity_type: string;
  entity_name: string;
  external_id: string;
  edge_type: string;
  weight: number;
  depth: number;
}

export function useGraphData() {
  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [edges, setEdges] = useState<GraphEdge[]>([]);
  const [loading, setLoading] = useState(false);
  const [rootId, setRootId] = useState<string | null>(null);

  const expandNode = useCallback(async (entityId: string, depth = 1, edgeTypes?: string[]) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ entityId, depth: String(depth) });
      if (edgeTypes?.length) params.set('edgeTypes', edgeTypes.join(','));

      const res = await fetch(`/api/market/graph/neighbors?${params}`);
      if (!res.ok) return;

      const json = await res.json();
      const rows: NeighborRow[] = json.neighbors ?? [];

      setNodes((prev) => {
        const existing = new Set(prev.map((n) => n.id));
        const newNodes = rows
          .filter((r) => !existing.has(r.entity_id))
          .map((r) => ({
            id: r.entity_id,
            entityType: r.entity_type as GraphNode['entityType'],
            name: r.entity_name,
            externalId: r.external_id,
            depth: r.depth,
          }));
        return [...prev, ...newNodes];
      });

      setEdges((prev) => {
        const existingKeys = new Set(prev.map((e) => `${e.source}-${e.target}-${e.edgeType}`));
        const newEdges = rows
          .map((r) => ({
            source: entityId,
            target: r.entity_id,
            edgeType: r.edge_type,
            weight: r.weight,
          }))
          .filter((e) => !existingKeys.has(`${e.source}-${e.target}-${e.edgeType}`));
        return [...prev, ...newEdges];
      });

      if (!rootId) setRootId(entityId);
    } finally {
      setLoading(false);
    }
  }, [rootId]);

  const reset = useCallback(() => {
    setNodes([]);
    setEdges([]);
    setRootId(null);
  }, []);

  return { nodes, edges, loading, rootId, expandNode, reset };
}
