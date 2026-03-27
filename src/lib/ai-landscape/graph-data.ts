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

// Re-export imported types for single-file consumer imports
export type { AiNode, Edge, Cluster } from './schema';
export type { LayoutPosition, LayoutMeta } from './layout-schema';
