import type { AiNode, Edge, Cluster } from './schema';
import type { LayoutPosition, LayoutMeta } from './layout-schema';

/** Props interface for the InteractiveGraph React component */
export interface GraphProps {
  nodes: AiNode[];
  edges: Edge[];
  positions: LayoutPosition[];
  clusters: Cluster[];
  meta: LayoutMeta;
}

/** Node radius for root-level concepts (parentId === null) */
export const ROOT_NODE_RADIUS = 24;

/** Node radius for child concepts */
export const NODE_RADIUS = 18;

/** Font size for node labels (px) */
export const LABEL_FONT_SIZE = 9;

/** Font family for labels, matching svg-builder.ts */
export const FONT_FAMILY = "'DM Sans', sans-serif";

/**
 * Strip parenthetical suffixes from node display names.
 * e.g. "Reinforcement Learning (RL)" -> "Reinforcement Learning"
 */
export function stripParenthetical(name: string): string {
  return name.replace(/ *\(.*\)/, '');
}

/**
 * Extract the first sentence from a description string (for tooltips).
 * Falls back to a truncated slice if no sentence-ending punctuation is found.
 */
export function firstSentence(text: string): string {
  const match = text.match(/^[^.!?]+[.!?]/);
  return match ? match[0] : text.slice(0, 120) + '...';
}

/** Bounding box for a cluster of nodes in SVG coordinates */
export interface ClusterBounds {
  x0: number; y0: number;
  x1: number; y1: number;
  cx: number; cy: number;
}

/**
 * Compute the bounding box for all nodes in a given cluster.
 * Returns null if no nodes match the cluster ID.
 * Enforces a minimum dimension of 200 SVG units to prevent
 * extreme zoom on single-node clusters (e.g. "nn").
 */
export function getClusterBounds(
  clusterId: string,
  nodes: AiNode[],
  posMap: Map<string, LayoutPosition>,
  padding = 60,
): ClusterBounds | null {
  const positions = nodes
    .filter((n) => n.cluster === clusterId)
    .map((n) => posMap.get(n.id))
    .filter((p): p is LayoutPosition => p !== undefined);

  if (positions.length === 0) return null;

  const xs = positions.map((p) => p.x);
  const ys = positions.map((p) => p.y);
  const x0 = Math.min(...xs) - padding;
  const y0 = Math.min(...ys) - padding;
  const x1 = Math.max(...xs) + padding;
  const y1 = Math.max(...ys) + padding;

  // Enforce minimum dimensions to prevent extreme zoom
  const minDim = 200;
  const cx = (x0 + x1) / 2;
  const cy = (y0 + y1) / 2;
  const finalX0 = Math.min(x0, cx - minDim / 2);
  const finalY0 = Math.min(y0, cy - minDim / 2);
  const finalX1 = Math.max(x1, cx + minDim / 2);
  const finalY1 = Math.max(y1, cy + minDim / 2);

  return { x0: finalX0, y0: finalY0, x1: finalX1, y1: finalY1, cx, cy };
}

// --- Edge type colors (light/dark mode pairs) ---

/** Color palette for the 10 edge relationship types */
export const EDGE_TYPE_COLORS: Record<string, { light: string; dark: string }> = {
  hierarchy:     { light: '#5c6bc0', dark: '#7986cb' },
  includes:      { light: '#26a69a', dark: '#4db6ac' },
  enables:       { light: '#ef6c00', dark: '#ff9800' },
  example:       { light: '#8d6e63', dark: '#a1887f' },
  relates:       { light: '#78909c', dark: '#90a4ae' },
  progression:   { light: '#7b1fa2', dark: '#ab47bc' },
  characterizes: { light: '#00838f', dark: '#00acc1' },
  aspires:       { light: '#c62828', dark: '#ef5350' },
  applies:       { light: '#558b2f', dark: '#8bc34a' },
  standardizes:  { light: '#f9a825', dark: '#ffca28' },
};

/**
 * Generate an SVG arc path between two points.
 * Radius equals the distance between source and target,
 * producing a gentle curve (Mobile Patent Suits pattern).
 */
export function linkArc(sx: number, sy: number, tx: number, ty: number): string {
  const r = Math.hypot(tx - sx, ty - sy);
  return `M${sx},${sy}A${r},${r} 0 0,1 ${tx},${ty}`;
}

/**
 * Compute the visual midpoint of an arc for label placement.
 * The midpoint is the chord midpoint offset perpendicular by the sagitta.
 * For sweep=1 arcs where r=chord length, sagitta ≈ 13.4% of chord length.
 */
export function arcMidpoint(
  sx: number, sy: number, tx: number, ty: number,
): { x: number; y: number } {
  const mx = (sx + tx) / 2;
  const my = (sy + ty) / 2;
  const dist = Math.hypot(tx - sx, ty - sy);
  if (dist === 0) return { x: mx, y: my };
  // Sagitta for arc where r = chord length: r - r*cos(arcsin(0.5)) = r*(1 - √3/2)
  const sagitta = dist * (1 - Math.sqrt(3) / 2);
  // Perpendicular direction (rightward for sweep=1)
  const dx = tx - sx;
  const dy = ty - sy;
  const nx = -dy / dist;
  const ny = dx / dist;
  return { x: mx + nx * sagitta, y: my + ny * sagitta };
}

// Re-export imported types for single-file consumer imports
export type { AiNode, Edge, Cluster } from './schema';
export type { LayoutPosition, LayoutMeta } from './layout-schema';
