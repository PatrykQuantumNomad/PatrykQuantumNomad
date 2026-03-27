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

// Re-export imported types for single-file consumer imports
export type { AiNode, Edge, Cluster } from './schema';
export type { LayoutPosition, LayoutMeta } from './layout-schema';
