export interface ForceNode {
  id: string;
  label: string;
  type: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
}

export interface ForceEdge {
  source: string;
  target: string;
  weight: number;
}

export interface LayoutOptions {
  width?: number;
  height?: number;
  iterations?: number;
  repulsionStrength?: number;
  springStrength?: number;
  damping?: number;
}

const DEFAULT_OPTIONS: Required<LayoutOptions> = {
  width: 600,
  height: 400,
  iterations: 100,
  repulsionStrength: 5000,
  springStrength: 0.01,
  damping: 0.9,
};

/**
 * Simple spring-force + repulsion layout.
 * Runs synchronously for small graphs (max ~50 nodes).
 */
export function computeLayout(
  nodes: Omit<ForceNode, 'x' | 'y' | 'vx' | 'vy'>[],
  edges: ForceEdge[],
  options?: LayoutOptions,
): ForceNode[] {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const { width, height, iterations, repulsionStrength, springStrength, damping } = opts;

  // Initialize positions in a circle
  const positioned: ForceNode[] = nodes.map((n, i) => {
    const angle = (2 * Math.PI * i) / nodes.length;
    const radius = Math.min(width, height) * 0.35;
    return {
      ...n,
      x: width / 2 + radius * Math.cos(angle),
      y: height / 2 + radius * Math.sin(angle),
      vx: 0,
      vy: 0,
    };
  });

  const nodeIndex = new Map(positioned.map((n, i) => [n.id, i]));

  for (let iter = 0; iter < iterations; iter++) {
    // Repulsion between all node pairs (Coulomb's law)
    for (let i = 0; i < positioned.length; i++) {
      for (let j = i + 1; j < positioned.length; j++) {
        const dx = positioned[i].x - positioned[j].x;
        const dy = positioned[i].y - positioned[j].y;
        const distSq = Math.max(dx * dx + dy * dy, 1);
        const force = repulsionStrength / distSq;
        const fx = (dx / Math.sqrt(distSq)) * force;
        const fy = (dy / Math.sqrt(distSq)) * force;

        positioned[i] = { ...positioned[i], vx: positioned[i].vx + fx, vy: positioned[i].vy + fy };
        positioned[j] = { ...positioned[j], vx: positioned[j].vx - fx, vy: positioned[j].vy - fy };
      }
    }

    // Spring attraction along edges (Hooke's law)
    for (const edge of edges) {
      const si = nodeIndex.get(edge.source);
      const ti = nodeIndex.get(edge.target);
      if (si === undefined || ti === undefined) continue;

      const dx = positioned[ti].x - positioned[si].x;
      const dy = positioned[ti].y - positioned[si].y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      const force = springStrength * dist;
      const fx = (dx / dist) * force;
      const fy = (dy / dist) * force;

      positioned[si] = { ...positioned[si], vx: positioned[si].vx + fx, vy: positioned[si].vy + fy };
      positioned[ti] = { ...positioned[ti], vx: positioned[ti].vx - fx, vy: positioned[ti].vy - fy };
    }

    // Apply velocity with damping, clamp to bounds
    const padding = 30;
    for (let i = 0; i < positioned.length; i++) {
      const n = positioned[i];
      const newX = Math.max(padding, Math.min(width - padding, n.x + n.vx * damping));
      const newY = Math.max(padding, Math.min(height - padding, n.y + n.vy * damping));
      positioned[i] = { ...n, x: newX, y: newY, vx: n.vx * damping, vy: n.vy * damping };
    }
  }

  return positioned;
}
