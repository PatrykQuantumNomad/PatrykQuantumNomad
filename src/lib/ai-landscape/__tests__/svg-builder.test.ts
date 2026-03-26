import { describe, it, expect, beforeAll } from 'vitest';
import type { AiNode, Edge, Cluster } from '../schema';
import type { LayoutPosition, LayoutMeta } from '../layout-schema';

// Import real data for integration-level assertions
import nodesData from '../../../data/ai-landscape/nodes.json';
import graphData from '../../../data/ai-landscape/graph.json';

// Dynamic import for the module under test (doesn't exist yet in RED phase)
let buildLandscapeSvg: (
  nodes: AiNode[],
  edges: Edge[],
  positions: LayoutPosition[],
  clusters: Cluster[],
  meta: LayoutMeta,
) => string;

let layoutData: { meta: LayoutMeta; positions: LayoutPosition[] };
let svg: string;

const nodes = nodesData as AiNode[];
const edges = graphData.edges as Edge[];
const clusters = graphData.clusters as Cluster[];

beforeAll(async () => {
  // Import layout.json
  const layoutModule = await import('../../../data/ai-landscape/layout.json');
  layoutData = (layoutModule.default ?? layoutModule) as typeof layoutData;

  // Import the svg-builder module
  const svgModule = await import('../svg-builder');
  buildLandscapeSvg = svgModule.buildLandscapeSvg;

  // Generate the SVG using real data
  svg = buildLandscapeSvg(
    nodes,
    edges,
    layoutData.positions,
    clusters,
    layoutData.meta,
  );
});

describe('buildLandscapeSvg', () => {
  it('returns a string starting with "<svg" and ending with "</svg>"', () => {
    expect(svg.trimStart().startsWith('<svg')).toBe(true);
    expect(svg.trimEnd().endsWith('</svg>')).toBe(true);
  });

  it('contains viewBox="0 0 1200 900"', () => {
    expect(svg).toContain('viewBox="0 0 1200 900"');
  });

  it('contains role="img" attribute', () => {
    expect(svg).toContain('role="img"');
  });

  it('contains aria-label attribute', () => {
    expect(svg).toContain('aria-label=');
  });

  it('contains a <style> block with cluster CSS classes for all 9 clusters', () => {
    expect(svg).toContain('<style>');
    const clusterIds = ['ai', 'ml', 'nn', 'dl', 'genai', 'levels', 'agentic', 'agent-frameworks', 'devtools'];
    for (const id of clusterIds) {
      expect(svg, `Missing CSS class for cluster: ${id}`).toContain(`ai-cluster-${id}`);
    }
  });

  it('contains "html.dark" rules for dark mode', () => {
    expect(svg).toContain('html.dark');
  });

  it('contains <g class="edges"> group rendered BEFORE <g class="nodes"> group', () => {
    const edgesIdx = svg.indexOf('<g class="edges"');
    const nodesIdx = svg.indexOf('<g class="nodes"');
    expect(edgesIdx).toBeGreaterThan(-1);
    expect(nodesIdx).toBeGreaterThan(-1);
    expect(edgesIdx).toBeLessThan(nodesIdx);
  });

  it('contains circle elements for each of the 51 nodes', () => {
    const circleCount = (svg.match(/<circle/g) ?? []).length;
    expect(circleCount).toBe(51);
  });

  it('contains line elements for edges', () => {
    const lineCount = (svg.match(/<line/g) ?? []).length;
    expect(lineCount).toBe(66);
  });

  it('contains text labels for node names', () => {
    const textCount = (svg.match(/<text/g) ?? []).length;
    expect(textCount).toBe(51);
  });

  it('uses var(--color-text-primary) for text fill', () => {
    expect(svg).toContain('var(--color-text-primary)');
  });

  it('uses var(--color-border) for edge stroke', () => {
    expect(svg).toContain('var(--color-border)');
  });

  it('assigns correct cluster class to each node circle', () => {
    // Check a few known nodes and their expected cluster classes
    // Machine Learning -> ml cluster
    expect(svg).toContain('ai-cluster-ml');
    // Artificial Intelligence -> ai cluster
    expect(svg).toContain('ai-cluster-ai');
    // Generative AI -> genai cluster
    expect(svg).toContain('ai-cluster-genai');
    // Deep Learning -> dl cluster
    expect(svg).toContain('ai-cluster-dl');
    // Neural Networks -> nn cluster
    expect(svg).toContain('ai-cluster-nn');
  });

  it('strips parenthetical suffixes from node labels', () => {
    // "Artificial Intelligence (AI)" should become "Artificial Intelligence"
    // The SVG should NOT contain "(AI)" in text labels
    // but SHOULD contain "Artificial Intelligence" as label text
    expect(svg).toContain('>Artificial Intelligence<');
    expect(svg).not.toMatch(/>Artificial Intelligence \(AI\)</);
    expect(svg).toContain('>Machine Learning<');
    expect(svg).not.toMatch(/>Machine Learning \(ML\)</);
    expect(svg).toContain('>Natural Language Processing<');
    expect(svg).not.toMatch(/>Natural Language Processing \(NLP\)</);
  });

  it('differentiates edge types with different stroke styles', () => {
    // hierarchy edges should be solid/thick (stroke-width 2)
    expect(svg).toContain('stroke-width="2"');
    // includes edges should be dashed
    expect(svg).toContain('stroke-dasharray="4 3"');
  });

  it('uses larger radius for root nodes (parentId null)', () => {
    // Root nodes have r=24, others have r=18
    expect(svg).toContain('r="24"');
    expect(svg).toContain('r="18"');
  });
});
