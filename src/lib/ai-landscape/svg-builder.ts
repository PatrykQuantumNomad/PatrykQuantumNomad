import type { AiNode, Edge, Cluster } from './schema';
import type { LayoutPosition, LayoutMeta } from './layout-schema';
import { EDGE_TYPE_COLORS, linkArc } from './graph-data';

// --- Constants ---

/** Radius for root nodes (parentId === null) */
const ROOT_NODE_RADIUS = 24;

/** Radius for standard child nodes */
const NODE_RADIUS = 18;

/** Font size for node labels */
const LABEL_FONT_SIZE = 9;

/** Font family matching the project's design system */
const FONT_FAMILY = "'DM Sans', sans-serif";

// --- Helpers ---

/** Strip parenthetical suffixes from a node name for cleaner labels */
function stripParenthetical(name: string): string {
  return name.replace(/ *\(.*\)/, '');
}

/** Escape XML special characters */
function escXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// --- Main builder ---

/**
 * Builds a complete SVG string representing the AI Landscape force-directed graph.
 *
 * The SVG uses CSS classes for cluster coloring with html.dark overrides,
 * CSS custom properties for text and edge colors, and correct z-ordering
 * (edges rendered before nodes).
 */
export function buildLandscapeSvg(
  nodes: AiNode[],
  edges: Edge[],
  positions: LayoutPosition[],
  clusters: Cluster[],
  meta: LayoutMeta,
): string {
  const { width, height } = meta;

  // Build lookup maps
  const posMap = new Map(positions.map((p) => [p.id, p]));
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));
  const clusterMap = new Map(clusters.map((c) => [c.id, c]));

  // Determine root node IDs (parentId is null)
  const rootNodeIds = new Set(nodes.filter((n) => n.parentId === null).map((n) => n.id));

  // --- CSS styles ---
  const clusterStyles = clusters
    .map((c) => {
      const id = escXml(c.id);
      return [
        `.ai-cluster-${id} { fill: ${c.color}; stroke: ${c.darkColor}; stroke-width: 1.5; }`,
        `html.dark .ai-cluster-${id} { fill: ${c.darkColor}; stroke: ${c.color}; }`,
      ].join('\n');
    })
    .join('\n');

  const edgeStyles = Object.entries(EDGE_TYPE_COLORS)
    .map(([type, colors]) => [
      `.ai-edge-${type} { stroke: ${colors.light}; fill: none; opacity: 0.45; }`,
      `html.dark .ai-edge-${type} { stroke: ${colors.dark}; }`,
    ].join('\n'))
    .join('\n');

  const baseStyles = [
    edgeStyles,
    `.ai-label { fill: var(--color-text-primary); font-family: ${FONT_FAMILY}; font-size: ${LABEL_FONT_SIZE}px; pointer-events: none; }`,
    ...clusters.map(c => `.ai-abbr-${c.id} { fill: ${c.darkColor}; }\nhtml.dark .ai-abbr-${c.id} { fill: ${c.color}; }`),
    `.ai-node-abbr { font-family: ${FONT_FAMILY}; font-weight: 600; pointer-events: none; }`,
  ].join('\n');

  const styleBlock = `<style>\n${clusterStyles}\n${baseStyles}\n</style>`;

  // --- Marker definition ---
  const markerDef = `<defs><marker id="arrowhead" viewBox="0 -5 10 10" refX="8" refY="0" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,-5L10,0L0,5" fill="context-stroke"/></marker></defs>`;

  // --- Edges ---
  const edgeLines = edges
    .map((e) => {
      const src = posMap.get(e.source);
      const tgt = posMap.get(e.target);
      if (!src || !tgt) return '';

      // Shorten target to node boundary for arrow placement
      const dist = Math.hypot(tgt.x - src.x, tgt.y - src.y);
      if (dist === 0) return '';
      const tgtR = rootNodeIds.has(e.target) ? ROOT_NODE_RADIUS : NODE_RADIUS;
      const dx = (tgt.x - src.x) / dist;
      const dy = (tgt.y - src.y) / dist;
      const stx = tgt.x - dx * tgtR;
      const sty = tgt.y - dy * tgtR;

      const arcD = linkArc(src.x, src.y, stx, sty);

      let strokeWidth = '1.2';
      let extra = '';

      if (e.type === 'hierarchy') {
        strokeWidth = '2';
      } else if (e.type === 'includes') {
        strokeWidth = '1.5';
        extra = ' stroke-dasharray="4 3"';
      }

      return `<path d="${arcD}" class="ai-edge-${escXml(e.type)}" stroke-width="${strokeWidth}"${extra} fill="none" marker-end="url(#arrowhead)"/>`;
    })
    .filter(Boolean)
    .join('\n');

  // --- Nodes ---
  const nodeElements = nodes
    .map((n) => {
      const pos = posMap.get(n.id);
      if (!pos) return '';

      const r = rootNodeIds.has(n.id) ? ROOT_NODE_RADIUS : NODE_RADIUS;
      const cluster = clusterMap.get(n.cluster);
      const clusterClass = cluster ? `ai-cluster-${escXml(cluster.id)}` : '';
      const label = stripParenthetical(n.name);
      const labelY = pos.y + r + LABEL_FONT_SIZE + 2;

      const abbrSize = r <= NODE_RADIUS ? 7 : 9;
      return [
        `<circle cx="${pos.x}" cy="${pos.y}" r="${r}" class="${clusterClass}"/>`,
        `<text x="${pos.x}" y="${pos.y}" text-anchor="middle" dominant-baseline="central" class="ai-node-abbr ai-abbr-${escXml(n.cluster)}" font-size="${abbrSize}">${escXml(n.shortLabel ?? '')}</text>`,
        `<text x="${pos.x}" y="${labelY}" text-anchor="middle" class="ai-label">${escXml(label)}</text>`,
      ].join('\n');
    })
    .filter(Boolean)
    .join('\n');

  // --- Compose SVG ---
  const nodeCount = nodes.length;
  const clusterCount = clusters.length;
  const ariaLabel = `AI Landscape force-directed graph showing ${nodeCount} concepts across ${clusterCount} clusters`;

  return `<svg viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${escXml(ariaLabel)}" style="width:100%;height:auto;max-width:${width}px">
${styleBlock}
${markerDef}
<g class="edges">
${edgeLines}
</g>
<g class="nodes">
${nodeElements}
</g>
</svg>`;
}
