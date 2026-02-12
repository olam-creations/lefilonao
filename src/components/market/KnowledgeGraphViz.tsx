'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Network, Search, ZoomIn, ZoomOut, RotateCcw, Loader2 } from 'lucide-react';
import { useGraphData, type GraphNode, type GraphEdge } from '@/hooks/useGraphData';

interface SimNode extends GraphNode {
  x: number;
  y: number;
  vx: number;
  vy: number;
  fx?: number;
  fy?: number;
}

const NODE_COLORS: Record<string, string> = {
  buyer: '#6366f1',
  winner: '#10b981',
  cpv: '#f59e0b',
  region: '#8b5cf6',
};

const NODE_RADIUS: Record<string, number> = {
  buyer: 10,
  winner: 10,
  cpv: 8,
  region: 8,
};

const EDGE_COLORS: Record<string, string> = {
  awarded_to: '#94a3b8',
  competes_with: '#ef4444',
  contracts_in_sector: '#f59e0b',
  buyer_in_sector: '#6366f1',
  operates_in_region: '#8b5cf6',
  buyer_in_region: '#6366f1',
};

const EDGE_TYPE_LABELS: Record<string, string> = {
  awarded_to: 'Attribue a',
  competes_with: 'Concurrence',
  contracts_in_sector: 'Secteur',
  buyer_in_sector: 'Acheteur secteur',
  operates_in_region: 'Region',
  buyer_in_region: 'Acheteur region',
};

const ALL_EDGE_TYPES = Object.keys(EDGE_TYPE_LABELS);

interface KnowledgeGraphVizProps {
  initialEntityId?: string;
  onEntityClick?: (name: string, type: 'buyer' | 'winner') => void;
}

function runSimulation(nodes: SimNode[], edges: GraphEdge[], iterations: number): SimNode[] {
  const result = nodes.map((n) => ({ ...n }));
  const nodeMap = new Map(result.map((n) => [n.id, n]));

  for (let iter = 0; iter < iterations; iter++) {
    const alpha = 1 - iter / iterations;

    // Repulsion (all pairs)
    for (let i = 0; i < result.length; i++) {
      for (let j = i + 1; j < result.length; j++) {
        const a = result[i];
        const b = result[j];
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const dist = Math.max(Math.sqrt(dx * dx + dy * dy), 1);
        const force = (300 * alpha) / (dist * dist);
        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;
        a.vx -= fx;
        a.vy -= fy;
        b.vx += fx;
        b.vy += fy;
      }
    }

    // Attraction (edges)
    for (const edge of edges) {
      const source = nodeMap.get(edge.source);
      const target = nodeMap.get(edge.target);
      if (!source || !target) continue;
      const dx = target.x - source.x;
      const dy = target.y - source.y;
      const dist = Math.max(Math.sqrt(dx * dx + dy * dy), 1);
      const force = (dist - 100) * 0.01 * alpha;
      const fx = (dx / dist) * force;
      const fy = (dy / dist) * force;
      source.vx += fx;
      source.vy += fy;
      target.vx -= fx;
      target.vy -= fy;
    }

    // Center gravity
    for (const node of result) {
      node.vx -= node.x * 0.005 * alpha;
      node.vy -= node.y * 0.005 * alpha;
    }

    // Apply velocity
    for (const node of result) {
      if (node.fx != null) { node.x = node.fx; node.vx = 0; }
      else { node.vx *= 0.6; node.x += node.vx; }
      if (node.fy != null) { node.y = node.fy; node.vy = 0; }
      else { node.vy *= 0.6; node.y += node.vy; }
    }
  }

  return result;
}

export default function KnowledgeGraphViz({ initialEntityId, onEntityClick }: KnowledgeGraphVizProps) {
  const { nodes, edges, loading, expandNode, reset } = useGraphData();
  const [simNodes, setSimNodes] = useState<SimNode[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchEntityId, setSearchEntityId] = useState('');
  const [depth, setDepth] = useState(1);
  const [activeEdgeTypes, setActiveEdgeTypes] = useState<Set<string>>(new Set(ALL_EDGE_TYPES));
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const dragRef = useRef<{ startX: number; startY: number; panX: number; panY: number } | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // Initialize with entity
  useEffect(() => {
    if (initialEntityId) {
      reset();
      expandNode(initialEntityId, depth, [...activeEdgeTypes]);
    }
  }, [initialEntityId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Run simulation when nodes/edges change
  useEffect(() => {
    if (nodes.length === 0) {
      setSimNodes([]);
      return;
    }

    const initial: SimNode[] = nodes.map((n, i) => {
      const existing = simNodes.find((s) => s.id === n.id);
      if (existing) return { ...n, x: existing.x, y: existing.y, vx: 0, vy: 0 };
      const angle = (i / nodes.length) * Math.PI * 2;
      const radius = 150 + n.depth * 80;
      return { ...n, x: Math.cos(angle) * radius, y: Math.sin(angle) * radius, vx: 0, vy: 0 };
    });

    const filteredEdges = edges.filter((e) => activeEdgeTypes.has(e.edgeType));
    const result = runSimulation(initial, filteredEdges, 100);
    setSimNodes(result);
  }, [nodes, edges, activeEdgeTypes]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) return;
    // Search for entity by name via the graph similar endpoint
    try {
      const res = await fetch(`/api/market/graph/similar?q=${encodeURIComponent(searchQuery)}&limit=1`);
      if (!res.ok) return;
      const json = await res.json();
      const matches = json.entities ?? json.similar ?? [];
      if (matches.length > 0) {
        const id = matches[0].id ?? matches[0].entity_id;
        if (id) {
          reset();
          setSearchEntityId(id);
          expandNode(id, depth, [...activeEdgeTypes]);
        }
      }
    } catch {
      // Ignore search errors
    }
  }, [searchQuery, depth, activeEdgeTypes, reset, expandNode]);

  const handleNodeClick = useCallback((node: SimNode) => {
    if (node.entityType === 'buyer' || node.entityType === 'winner') {
      onEntityClick?.(node.name, node.entityType);
    }
    expandNode(node.id, 1, [...activeEdgeTypes]);
  }, [onEntityClick, expandNode, activeEdgeTypes]);

  const toggleEdgeType = useCallback((type: string) => {
    setActiveEdgeTypes((prev) => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.target === svgRef.current || (e.target as Element).tagName === 'rect') {
      setDragging(true);
      dragRef.current = { startX: e.clientX, startY: e.clientY, panX: pan.x, panY: pan.y };
    }
  }, [pan]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragging || !dragRef.current) return;
    setPan({
      x: dragRef.current.panX + (e.clientX - dragRef.current.startX) / zoom,
      y: dragRef.current.panY + (e.clientY - dragRef.current.startY) / zoom,
    });
  }, [dragging, zoom]);

  const handleMouseUp = useCallback(() => {
    setDragging(false);
    dragRef.current = null;
  }, []);

  const filteredEdges = edges.filter((e) => activeEdgeTypes.has(e.edgeType));
  const nodeMap = new Map(simNodes.map((n) => [n.id, n]));

  if (nodes.length === 0 && !loading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Network className="w-5 h-5 text-indigo-500" />
          <h2 className="text-lg font-semibold text-slate-900">Graphe de connaissances</h2>
        </div>
        <div className="flex items-center gap-2 mb-4">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Rechercher un acheteur, attributaire..."
            className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-300"
          />
          <button
            onClick={handleSearch}
            className="px-3 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <Search className="w-4 h-4" />
          </button>
        </div>
        <p className="text-sm text-slate-500 text-center py-12">
          Recherchez une entite pour explorer le graphe de relations.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Network className="w-5 h-5 text-indigo-500" />
          <h2 className="text-lg font-semibold text-slate-900">Graphe de connaissances</h2>
          {loading && <Loader2 className="w-4 h-4 text-indigo-400 animate-spin" />}
        </div>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Rechercher..."
            className="w-48 px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-300"
          />
          <button onClick={handleSearch} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
            <Search className="w-3.5 h-3.5 text-slate-500" />
          </button>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="flex items-center gap-1.5">
          <label className="text-xs text-slate-500">Profondeur:</label>
          <input
            type="range"
            min={1}
            max={3}
            value={depth}
            onChange={(e) => setDepth(Number(e.target.value))}
            className="w-20 h-1 accent-indigo-500"
          />
          <span className="text-xs font-mono text-slate-600">{depth}</span>
        </div>
        <div className="flex flex-wrap gap-1">
          {ALL_EDGE_TYPES.map((type) => (
            <button
              key={type}
              onClick={() => toggleEdgeType(type)}
              className={`px-2 py-0.5 text-[10px] rounded-full border transition-colors ${
                activeEdgeTypes.has(type)
                  ? 'border-slate-400 bg-slate-100 text-slate-700'
                  : 'border-slate-200 bg-white text-slate-400'
              }`}
            >
              {EDGE_TYPE_LABELS[type]}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1 ml-auto">
          <button onClick={() => setZoom((z) => Math.min(3, z * 1.3))} className="p-1 rounded hover:bg-slate-100">
            <ZoomIn className="w-3.5 h-3.5 text-slate-500" />
          </button>
          <button onClick={() => setZoom((z) => Math.max(0.3, z / 1.3))} className="p-1 rounded hover:bg-slate-100">
            <ZoomOut className="w-3.5 h-3.5 text-slate-500" />
          </button>
          <button onClick={() => { reset(); setZoom(1); setPan({ x: 0, y: 0 }); }} className="p-1 rounded hover:bg-slate-100">
            <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 mb-3">
        {Object.entries(NODE_COLORS).map(([type, color]) => (
          <div key={type} className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
            <span className="text-[10px] text-slate-500 capitalize">{type === 'cpv' ? 'Secteur CPV' : type === 'buyer' ? 'Acheteur' : type === 'winner' ? 'Attributaire' : 'Region'}</span>
          </div>
        ))}
      </div>

      {/* SVG Graph */}
      <div className="border border-slate-100 rounded-xl overflow-hidden bg-slate-50" style={{ height: 480 }}>
        <svg
          ref={svgRef}
          width="100%"
          height="100%"
          viewBox="-400 -300 800 600"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          className={dragging ? 'cursor-grabbing' : 'cursor-grab'}
        >
          <g transform={`scale(${zoom}) translate(${pan.x}, ${pan.y})`}>
            {/* Edges */}
            {filteredEdges.map((edge, i) => {
              const source = nodeMap.get(edge.source);
              const target = nodeMap.get(edge.target);
              if (!source || !target) return null;
              const isHighlighted = hoveredNode === edge.source || hoveredNode === edge.target;
              return (
                <line
                  key={`edge-${i}`}
                  x1={source.x}
                  y1={source.y}
                  x2={target.x}
                  y2={target.y}
                  stroke={EDGE_COLORS[edge.edgeType] ?? '#cbd5e1'}
                  strokeWidth={isHighlighted ? 2 : 1}
                  strokeOpacity={isHighlighted ? 0.8 : 0.3}
                />
              );
            })}

            {/* Nodes */}
            {simNodes.map((node) => {
              const r = NODE_RADIUS[node.entityType] ?? 8;
              const color = NODE_COLORS[node.entityType] ?? '#64748b';
              const isHovered = hoveredNode === node.id;

              return (
                <g
                  key={node.id}
                  transform={`translate(${node.x}, ${node.y})`}
                  onClick={() => handleNodeClick(node)}
                  onMouseEnter={() => setHoveredNode(node.id)}
                  onMouseLeave={() => setHoveredNode(null)}
                  className="cursor-pointer"
                >
                  <circle
                    r={isHovered ? r + 3 : r}
                    fill={color}
                    fillOpacity={isHovered ? 1 : 0.85}
                    stroke={isHovered ? '#1e293b' : 'white'}
                    strokeWidth={isHovered ? 2 : 1.5}
                  />
                  <text
                    y={r + 12}
                    textAnchor="middle"
                    className="text-[8px] fill-slate-600 pointer-events-none select-none"
                    fontFamily="system-ui"
                  >
                    {node.name.length > 18 ? `${node.name.slice(0, 16)}...` : node.name}
                  </text>
                </g>
              );
            })}
          </g>
        </svg>
      </div>

      <p className="text-[10px] text-slate-400 mt-2 text-center">
        {simNodes.length} entites, {filteredEdges.length} relations — Cliquez sur un noeud pour explorer
      </p>
    </div>
  );
}
