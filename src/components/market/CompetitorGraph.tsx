'use client';

import { useMemo, useState, useCallback } from 'react';
import { computeLayout, type ForceNode, type ForceEdge } from '@/lib/force-layout';

interface GraphNode {
  id: string;
  label: string;
  type: 'buyer' | 'winner' | 'cpv' | 'region';
}

interface GraphEdgeInput {
  source: string;
  target: string;
  weight: number;
  edgeType: string;
}

interface CompetitorGraphProps {
  nodes: GraphNode[];
  edges: GraphEdgeInput[];
  width?: number;
  height?: number;
  onNodeClick?: (nodeId: string) => void;
}

const TYPE_COLORS: Record<string, { fill: string; stroke: string }> = {
  buyer: { fill: '#818cf8', stroke: '#6366f1' },
  winner: { fill: '#34d399', stroke: '#10b981' },
  cpv: { fill: '#fb923c', stroke: '#f97316' },
  region: { fill: '#c084fc', stroke: '#a855f7' },
};

const TYPE_LABELS: Record<string, string> = {
  buyer: 'Acheteur',
  winner: 'Attributaire',
  cpv: 'Secteur CPV',
  region: 'Region',
};

const MAX_NODES = 50;

export default function CompetitorGraph({ nodes, edges, width = 600, height = 400, onNodeClick }: CompetitorGraphProps) {
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [centeredNode, setCenteredNode] = useState<string | null>(null);

  // Limit nodes for performance
  const limitedNodes = useMemo(() => nodes.slice(0, MAX_NODES), [nodes]);
  const nodeIds = useMemo(() => new Set(limitedNodes.map((n) => n.id)), [limitedNodes]);
  const limitedEdges = useMemo(
    () => edges.filter((e) => nodeIds.has(e.source) && nodeIds.has(e.target)),
    [edges, nodeIds],
  );

  const forceEdges: ForceEdge[] = useMemo(
    () => limitedEdges.map((e) => ({ source: e.source, target: e.target, weight: e.weight })),
    [limitedEdges],
  );

  const layoutNodes = useMemo(
    () => computeLayout(
      limitedNodes.map((n) => ({ id: n.id, label: n.label, type: n.type })),
      forceEdges,
      { width, height },
    ),
    [limitedNodes, forceEdges, width, height],
  );

  const nodePositions = useMemo(() => {
    const map = new Map<string, ForceNode>();
    for (const n of layoutNodes) map.set(n.id, n);
    return map;
  }, [layoutNodes]);

  const handleNodeClick = useCallback((nodeId: string) => {
    setCenteredNode((prev) => (prev === nodeId ? null : nodeId));
    onNodeClick?.(nodeId);
  }, [onNodeClick]);

  // Highlight edges connected to hovered/centered node
  const activeNode = hoveredNode ?? centeredNode;

  if (limitedNodes.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-sm text-slate-400">
        Aucune donnee de graphe disponible
      </div>
    );
  }

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ maxHeight: height }}>
        {/* Edges */}
        {limitedEdges.map((e, i) => {
          const s = nodePositions.get(e.source);
          const t = nodePositions.get(e.target);
          if (!s || !t) return null;
          const isActive = activeNode === e.source || activeNode === e.target;
          return (
            <line
              key={`edge-${i}`}
              x1={s.x}
              y1={s.y}
              x2={t.x}
              y2={t.y}
              stroke={isActive ? '#6366f1' : '#e2e8f0'}
              strokeWidth={isActive ? 2 : 1}
              strokeOpacity={isActive ? 0.8 : 0.4}
            />
          );
        })}

        {/* Nodes */}
        {layoutNodes.map((n) => {
          const colors = TYPE_COLORS[n.type] ?? TYPE_COLORS.winner;
          const isActive = activeNode === n.id;
          const radius = isActive ? 8 : 6;

          return (
            <g
              key={n.id}
              className="cursor-pointer"
              onMouseEnter={() => setHoveredNode(n.id)}
              onMouseLeave={() => setHoveredNode(null)}
              onClick={() => handleNodeClick(n.id)}
            >
              <circle
                cx={n.x}
                cy={n.y}
                r={radius}
                fill={colors.fill}
                stroke={isActive ? '#1e293b' : colors.stroke}
                strokeWidth={isActive ? 2 : 1}
              />
              {isActive && (
                <text
                  x={n.x}
                  y={n.y - 12}
                  textAnchor="middle"
                  className="text-[9px] font-medium fill-slate-700"
                >
                  {n.label.length > 25 ? `${n.label.slice(0, 25)}...` : n.label}
                </text>
              )}
            </g>
          );
        })}
      </svg>

      {/* Legend */}
      <div className="flex items-center gap-3 mt-2 justify-center">
        {Object.entries(TYPE_COLORS).map(([type, colors]) => (
          <div key={type} className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: colors.fill }} />
            <span className="text-[10px] text-slate-500">{TYPE_LABELS[type]}</span>
          </div>
        ))}
      </div>

      {/* Tooltip */}
      {hoveredNode && (() => {
        const node = limitedNodes.find((n) => n.id === hoveredNode);
        const pos = nodePositions.get(hoveredNode);
        if (!node || !pos) return null;
        const connectedEdges = limitedEdges.filter((e) => e.source === hoveredNode || e.target === hoveredNode);
        return (
          <div
            className="absolute bg-white shadow-lg rounded-lg border border-slate-200 px-3 py-2 pointer-events-none z-10"
            style={{ left: `${(pos.x / width) * 100}%`, top: `${(pos.y / height) * 100}%`, transform: 'translate(-50%, -120%)' }}
          >
            <p className="text-xs font-semibold text-slate-700 truncate max-w-[200px]">{node.label}</p>
            <p className="text-[10px] text-slate-400">{TYPE_LABELS[node.type]} · {connectedEdges.length} connexions</p>
          </div>
        );
      })()}
    </div>
  );
}
