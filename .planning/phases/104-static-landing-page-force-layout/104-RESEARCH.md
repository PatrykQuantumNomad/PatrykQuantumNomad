# Phase 104: Static Landing Page & Force Layout - Research

**Researched:** 2026-03-26
**Domain:** d3-force headless simulation, build-time SVG generation, Astro static landing page
**Confidence:** HIGH

## Summary

Phase 104 creates the `/ai-landscape/` landing page with a pre-computed static SVG force-directed graph and a category-grouped concept list. The phase has two distinct parts: (1) a build-time Node.js script that runs d3-force headlessly to produce a deterministic `layout.json` with x/y positions for all 51 nodes, and (2) an Astro page that reads `layout.json` + the existing `nodes.json`/`graph.json` to render a static SVG and concept list at build time.

The project has well-established patterns for every component except the d3-force simulation. SVG generation at build time follows the `diagram-base.ts` / `plot-base.ts` pattern (CSS custom properties for dark/light theming, viewBox-based responsive sizing, `role="img"` accessibility). Landing pages follow the beauty-index/db-compass pattern (hero section, content sections, JSON-LD, breadcrumbs). The only new dependency is `d3-force` + `@types/d3-force` -- the simulation itself is pure computation with no DOM requirement, making it ideal for headless Node.js execution.

D3-force simulations are deterministic by default: they use a fixed-seed linear congruential generator and phyllotaxis initial placement. Running `simulation.stop()` followed by `simulation.tick(300)` produces identical results every time with the same input data, satisfying the deterministic layout requirement.

**Primary recommendation:** Add `d3-force` and `@types/d3-force` as dependencies. Create a `scripts/generate-layout.mjs` prebuild script that imports the existing `nodes.json` and `graph.json`, runs 300 ticks of d3-force, and writes `src/data/ai-landscape/layout.json`. Add a prebuild npm script. Build the landing page as `src/pages/ai-landscape/index.astro` following the beauty-index pattern, rendering the SVG inline using CSS variables for dark mode support.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| GRAPH-08 | Static SVG fallback pre-computed at build time for instant first paint before JS hydrates | d3-force `simulation.stop()` + `simulation.tick(300)` produces deterministic layout headlessly. SVG rendered inline in Astro page from `layout.json` -- zero JS needed for first paint. |
| GRAPH-02 | Cluster coloring matches DOT hierarchy (cyan, green, yellow, amber, pink, purple, blue, grey) with dark mode equivalents | `graph.json` already has 9 clusters with `color` (light) and `darkColor` (dark) hex values. SVG uses CSS `var()` references or inline `<style>` with media query for dark mode. |
| GRAPH-07 | Color-coded legend explaining cluster colors, node shapes, and edge styles | Legend is a static Astro component rendered below the SVG. Uses cluster data from `graph.json`. Pattern matches `DimensionLegend.astro` in db-compass. |
| SITE-01 | Landing page at /ai-landscape/ with graph embed and category-grouped concept list | Follows beauty-index `index.astro` pattern: hero + SVG embed + concept list grouped by cluster. `getCollection('aiLandscape')` provides node data. |
</phase_requirements>

## Project Constraints (from CLAUDE.md)

- Repository is patrykgolabek.dev portfolio site (NOT a GitHub README)
- SEO and public visibility are primary goals
- Content tone: professional but approachable, first person, concise, confident
- Keyword-rich content with natural searchable terms
- Astro 5.x with static output (SSG), `trailingSlash: 'always'`
- Tailwind CSS for styling, TypeScript throughout
- D3 micro-module imports only (never umbrella `d3` package)

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| d3-force | 3.0.0 | Force-directed layout simulation (headless) | Only d3 module that computes node positions via physics simulation. Pure computation -- no DOM needed. |
| @types/d3-force | 3.0.10 | TypeScript definitions for d3-force | Provides `SimulationNodeDatum`, `SimulationLinkDatum`, `Simulation` types |
| astro | 5.17.1 | Static site generator, content collections, pages | Already installed, project framework |
| tailwindcss | 3.4.19 | Page styling | Already installed, project standard |

### Supporting (already installed)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| d3-scale | 4.0.2 | Optional: normalize node positions to SVG viewport | If layout coordinates need scaling to fit viewBox |
| satori | 0.19.2 | OG image for landing page (SITE-07 in future) | Landing page OG image -- may defer to later phase |
| sharp | 0.34.5 | SVG to PNG for OG images | Paired with satori |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| d3-force prebuild script | Graphviz neato layout | Graphviz produces excellent layouts but requires a native binary (not installed); d3-force is pure JS and runs in Node.js without external dependencies |
| d3-force prebuild script | Hand-authored x/y coordinates | Would give full control but 51 nodes is too many to position manually; force simulation handles this automatically |
| npm prebuild script | Astro integration hook (`astro:build:start`) | Prebuild script is simpler, already used by the project (`download-actionlint-wasm.mjs`), and runs before any Astro processing |
| Inline SVG in Astro component | External .svg file in /public | Inline SVG supports CSS custom properties for dark mode; external SVG would need a separate dark mode copy or JS manipulation |

**Installation:**
```bash
npm install d3-force @types/d3-force
```

**Version verification:** d3-force 3.0.0 is the latest version (stable, published 2021, ESM-native). @types/d3-force 3.0.10 is the latest (published 2024). Both are stable packages with no expected breaking changes.

## Architecture Patterns

### Recommended Project Structure
```
scripts/
  generate-layout.mjs           # Prebuild: d3-force headless -> layout.json
src/
  data/ai-landscape/
    nodes.json                   # Existing: 51 concept nodes (content collection)
    graph.json                   # Existing: 9 clusters + 66 edges
    layout.json                  # NEW: Generated {positions: [{id, x, y}...], meta: {width, height, ticks}}
  lib/ai-landscape/
    schema.ts                    # Existing: types + getNodeRelationships()
    ancestry.ts                  # Existing: buildAncestryChain()
    routes.ts                    # Existing: conceptUrl(), ogImageUrl()
    layout-schema.ts             # NEW: Zod schema + types for layout.json
    svg-builder.ts               # NEW: Pure function: (nodes, edges, layout, clusters) -> SVG string
  components/ai-landscape/
    AncestryBreadcrumb.astro     # Existing
    DefinedTermJsonLd.astro      # Existing
    RelatedConcepts.astro        # Existing
    GraphLegend.astro            # NEW: Color-coded legend component
    ConceptList.astro            # NEW: Category-grouped concept list
  pages/ai-landscape/
    index.astro                  # NEW: Landing page
    [slug].astro                 # Existing: Concept detail pages
```

### Pattern 1: Prebuild Script for Layout Generation
**What:** A Node.js script in `scripts/` that runs before `astro build`, imports the data files, runs d3-force headlessly, and writes `layout.json`.
**When to use:** Always -- the layout must be pre-computed before Astro processes pages.
**Example:**
```javascript
// scripts/generate-layout.mjs
// Source: d3-force official docs (https://d3js.org/d3-force/simulation)
import { readFileSync, writeFileSync } from 'node:fs';
import { forceSimulation, forceLink, forceManyBody, forceCenter, forceCollide, forceX, forceY } from 'd3-force';

const nodes = JSON.parse(readFileSync('src/data/ai-landscape/nodes.json', 'utf-8'));
const graph = JSON.parse(readFileSync('src/data/ai-landscape/graph.json', 'utf-8'));

// Build cluster centroid targets for spatial grouping
const WIDTH = 1200;
const HEIGHT = 900;
const TICKS = 300;

const clusterCentroids = {
  ai:       { x: WIDTH * 0.35, y: HEIGHT * 0.25 },
  ml:       { x: WIDTH * 0.30, y: HEIGHT * 0.40 },
  nn:       { x: WIDTH * 0.25, y: HEIGHT * 0.55 },
  dl:       { x: WIDTH * 0.30, y: HEIGHT * 0.65 },
  genai:    { x: WIDTH * 0.45, y: HEIGHT * 0.75 },
  levels:   { x: WIDTH * 0.75, y: HEIGHT * 0.20 },
  agentic:  { x: WIDTH * 0.75, y: HEIGHT * 0.55 },
  'agent-frameworks': { x: WIDTH * 0.80, y: HEIGHT * 0.65 },
  devtools: { x: WIDTH * 0.70, y: HEIGHT * 0.85 },
};

// Prepare simulation nodes (d3-force mutates these)
const simNodes = nodes.map(n => ({
  id: n.id,
  cluster: n.cluster,
  x: clusterCentroids[n.cluster]?.x ?? WIDTH / 2,
  y: clusterCentroids[n.cluster]?.y ?? HEIGHT / 2,
}));

// Prepare links (d3-force replaces string IDs with node references)
const simLinks = graph.edges.map(e => ({
  source: e.source,
  target: e.target,
  type: e.type,
}));

const simulation = forceSimulation(simNodes)
  .force('link', forceLink(simLinks).id(d => d.id).distance(60).strength(0.3))
  .force('charge', forceManyBody().strength(-200).distanceMax(300))
  .force('center', forceCenter(WIDTH / 2, HEIGHT / 2))
  .force('collide', forceCollide(25))
  .force('clusterX', forceX(d => clusterCentroids[d.cluster]?.x ?? WIDTH / 2).strength(0.15))
  .force('clusterY', forceY(d => clusterCentroids[d.cluster]?.y ?? HEIGHT / 2).strength(0.15))
  .stop();

// Run simulation to completion
for (let i = 0; i < TICKS; i++) simulation.tick();

// Extract positions
const positions = simNodes.map(n => ({
  id: n.id,
  x: Math.round(n.x * 100) / 100,
  y: Math.round(n.y * 100) / 100,
}));

const layout = {
  meta: { width: WIDTH, height: HEIGHT, ticks: TICKS, generated: new Date().toISOString() },
  positions,
};

writeFileSync('src/data/ai-landscape/layout.json', JSON.stringify(layout, null, 2));
console.log(`Layout generated: ${positions.length} nodes in ${WIDTH}x${HEIGHT}`);
```

### Pattern 2: Dark Mode SVG via CSS Custom Properties
**What:** The SVG uses CSS custom properties (via a `<style>` block inside `<svg>`) or references the page's CSS variables for cluster colors. Dark mode is handled by the existing `html.dark` class toggle.
**When to use:** For all inline SVGs in this project -- matches `diagram-base.ts` and `plot-base.ts` patterns.
**Example:**
```typescript
// src/lib/ai-landscape/svg-builder.ts
// Produces a complete SVG string with dark mode support via CSS variables

export function buildLandscapeSvg(
  nodes: Array<{ id: string; name: string; cluster: string }>,
  edges: Array<{ source: string; target: string; type: string }>,
  positions: Array<{ id: string; x: number; y: number }>,
  clusters: Array<{ id: string; name: string; color: string; darkColor: string }>,
  meta: { width: number; height: number },
): string {
  const posMap = new Map(positions.map(p => [p.id, p]));
  const clusterMap = new Map(clusters.map(c => [c.id, c]));

  // Build CSS classes for cluster colors (light + dark)
  const styleBlock = clusters.map(c => `
    .cluster-${c.id} { fill: ${c.color}; stroke: ${c.darkColor}; }
    html.dark .cluster-${c.id} { fill: ${c.darkColor}; stroke: ${c.color}; }
  `).join('');

  // ... SVG generation using positions from posMap
}
```

### Pattern 3: Landing Page Structure (Following beauty-index pattern)
**What:** `src/pages/ai-landscape/index.astro` follows the established pattern: hero section, main visualization, supporting content sections.
**When to use:** Always -- this is the project's landing page template.
**Example structure:**
```
Hero Section: "AI Landscape Explorer" + 2026 Edition badge + subtitle
  |
SVG Graph Section: Inline static SVG from svg-builder.ts
  |
Legend Section: GraphLegend.astro (cluster colors, node shapes, edge styles)
  |
Concept List Section: ConceptList.astro (category-grouped links to /ai-landscape/[slug]/)
  |
Citation/Links: Methodology link, blog post link
```

### Pattern 4: NPM Prebuild Hook
**What:** Add the layout generation script to npm's `prebuild` lifecycle.
**When to use:** The existing `prebuild` script downloads actionlint WASM. Chain the new script.
**Example:**
```json
{
  "scripts": {
    "prebuild": "node scripts/download-actionlint-wasm.mjs && node scripts/generate-layout.mjs",
    "generate-layout": "node scripts/generate-layout.mjs"
  }
}
```

### Anti-Patterns to Avoid
- **Running d3-force at build time inside an Astro page:** Astro pages run in Vite's transform pipeline which may not handle d3-force's ESM imports cleanly. Run the simulation in a standalone Node.js script before Astro processes anything.
- **Using the umbrella `d3` package:** Project convention is micro-module imports. Use `d3-force` directly.
- **Embedding cluster colors as hex in SVG attributes:** Use CSS classes or custom properties so dark mode works via the existing `html.dark` class toggle. The existing `diagram-base.ts` pattern uses `var(--color-*)` throughout.
- **Making the SVG interactive before Phase 105:** This phase produces a STATIC SVG. No click handlers, no hover states beyond CSS `:hover`. Interactivity comes in Phase 105.
- **Using `<img src="graph.svg">` for the graph:** External SVG files cannot access the page's CSS variables for dark mode. The SVG must be inline in the HTML.
- **Computing layout at `astro build` time inside getStaticPaths:** The layout computation should happen before Astro starts processing, not during page generation. This keeps the build pipeline clean and allows `layout.json` to be version-controlled for deterministic builds.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Force-directed layout | Custom physics engine | `d3-force` (forceSimulation + tick) | 300+ lines of velocity Verlet integration, Barnes-Hut tree for N-body, collision detection -- all handled by d3-force |
| Cluster spatial grouping | Manual coordinate assignment for 51 nodes | `d3-force` forceX/forceY with cluster centroids | Automatic spatial separation while respecting edge constraints |
| Deterministic random | Custom seed-based PRNG | d3-force's built-in fixed-seed LCG | Default behavior -- no configuration needed |
| SVG dark mode | Duplicate SVG or JS color-swap | CSS custom properties in `<style>` inside SVG | Matches existing project pattern (diagram-base.ts, plot-base.ts); works with `html.dark` toggle |
| Landing page structure | Custom layout | Follow beauty-index `index.astro` pattern | Established pattern with hero, content sections, JSON-LD, breadcrumbs |
| Legend component | Custom legend builder | Static Astro component reading graph.json | Matches DimensionLegend.astro pattern from db-compass |

**Key insight:** The only genuinely new technical challenge is the d3-force simulation script. Everything else -- the SVG rendering, the landing page, the legend, the concept list -- follows patterns already proven in this codebase. The simulation script is ~60 lines of straightforward d3-force API calls.

## Common Pitfalls

### Pitfall 1: d3-force Mutates Input Arrays
**What goes wrong:** The original `nodes.json` data gets modified because d3-force adds `x`, `y`, `vx`, `vy`, `index` properties to every node object, and replaces link `source`/`target` strings with object references.
**Why it happens:** d3-force is designed for interactive use where mutation is expected and efficient.
**How to avoid:** Clone the data before passing to the simulation. Create fresh objects: `nodes.map(n => ({ id: n.id, cluster: n.cluster }))` and `edges.map(e => ({ source: e.source, target: e.target }))`.
**Warning signs:** `layout.json` contains full node content (descriptions, examples) instead of just `{id, x, y}`.

### Pitfall 2: Node Positions Outside SVG ViewBox
**What goes wrong:** After simulation, some node positions are negative or exceed the viewBox dimensions, causing nodes to render outside the visible area.
**Why it happens:** d3-force centers around (0,0) by default. The charge force can push nodes far apart. Without bounds constraints, positions can exceed any reasonable viewport.
**How to avoid:** Use `forceCenter(width/2, height/2)` to center the simulation. After simulation completes, clamp positions to `[padding, width - padding]` range. Alternatively, use `forceX` and `forceY` to keep nodes within bounds.
**Warning signs:** SVG shows only a few nodes; others are clipped or invisible.

### Pitfall 3: Cluster Overlap in Force Layout
**What goes wrong:** Nodes from different clusters intermingle spatially, making the visualization confusing and not matching the DOT file's visual hierarchy.
**Why it happens:** The `forceManyBody` repulsion and `forceLink` attraction may overpower cluster positioning forces if `forceX`/`forceY` strength is too low.
**How to avoid:** Use `forceX` and `forceY` with cluster-specific targets and sufficient strength (0.1-0.2). Set initial node positions near their cluster centroids rather than random. Tune `forceManyBody` strength (-150 to -300) to spread nodes within clusters but not across cluster boundaries.
**Warning signs:** Nodes from "genai" cluster appear mixed with "agentic" cluster nodes.

### Pitfall 4: Edge Lines Obscuring Node Labels
**What goes wrong:** The SVG renders edge lines on top of node circles and labels, making the text unreadable.
**Why it happens:** SVG renders elements in document order. If edges are drawn after nodes, they appear on top.
**How to avoid:** Render edges first (as a `<g class="edges">` group), then nodes (as a `<g class="nodes">` group). SVG paints later elements on top of earlier ones.
**Warning signs:** Text is partially hidden behind crossing lines.

### Pitfall 5: Dark Mode Colors Not Switching
**What goes wrong:** Cluster colors remain in light mode when the user toggles to dark mode.
**Why it happens:** If colors are hardcoded as hex in SVG `fill` attributes instead of using CSS classes, the dark mode toggle has no effect.
**How to avoid:** Use CSS classes for cluster fills (`.cluster-ai { fill: #e0f7fa }`) with corresponding `html.dark .cluster-ai { fill: #00696e }` rules. Place the `<style>` block inside the SVG element so it inherits from the parent document's `html.dark` class.
**Warning signs:** Graph stays light-colored when the rest of the page switches to dark mode.

### Pitfall 6: Prebuild Script Fails Silently
**What goes wrong:** The `generate-layout.mjs` script fails (e.g., missing dependency) but the Astro build proceeds without `layout.json`, causing a build error in the landing page.
**Why it happens:** npm `prebuild` scripts run sequentially with `&&`, but if the script is added incorrectly or error handling is missing, failures may not propagate.
**How to avoid:** Use `process.exit(1)` on errors in the script. Verify `layout.json` exists at the start of the Astro page's frontmatter with a clear error message. Chain with `&&` in npm scripts.
**Warning signs:** Astro build errors like "Cannot find module layout.json" or "undefined is not iterable".

### Pitfall 7: SVG Text Too Small on Mobile
**What goes wrong:** Node labels are legible on desktop but unreadable on mobile viewports.
**Why it happens:** The SVG uses viewBox scaling, so a 1200px-wide SVG scaled to 375px (mobile) shrinks all text proportionally.
**How to avoid:** On mobile, the static SVG should be a pan/scroll experience OR skip labels and rely on the concept list below. Wrapping the SVG in a horizontally scrollable container with `overflow-x: auto` is the simplest approach for a static fallback. The concept list provides the accessible alternative.
**Warning signs:** Text appears as tiny illegible dots on phone screens.

## Code Examples

### Build-Time Force Simulation (Headless Node.js)
```javascript
// Source: d3-force official docs (https://d3js.org/d3-force/simulation)
// Pattern: Static Force Layout (https://gist.github.com/mbostock/1667139)
import { forceSimulation, forceLink, forceManyBody, forceCenter, forceCollide, forceX, forceY } from 'd3-force';

// d3-force is deterministic by default:
// - Uses a fixed-seed linear congruential generator
// - NaN initial positions → phyllotaxis arrangement
// - Same input → same output every run

const simulation = forceSimulation(simNodes)
  .force('link', forceLink(simLinks).id(d => d.id).distance(60).strength(0.3))
  .force('charge', forceManyBody().strength(-200).distanceMax(300))
  .force('center', forceCenter(WIDTH / 2, HEIGHT / 2))
  .force('collide', forceCollide(25))
  .force('clusterX', forceX(d => clusterCentroids[d.cluster]?.x).strength(0.15))
  .force('clusterY', forceY(d => clusterCentroids[d.cluster]?.y).strength(0.15))
  .stop();

// Run 300 ticks to reach stable layout
for (let i = 0; i < 300; i++) simulation.tick();

// After ticks, each node in simNodes now has final x, y values
```

### Layout JSON Schema
```typescript
// src/lib/ai-landscape/layout-schema.ts
import { z } from 'astro/zod';

export const layoutPositionSchema = z.object({
  id: z.string(),
  x: z.number(),
  y: z.number(),
});

export const layoutMetaSchema = z.object({
  width: z.number(),
  height: z.number(),
  ticks: z.number(),
  generated: z.string(),
});

export const layoutSchema = z.object({
  meta: layoutMetaSchema,
  positions: z.array(layoutPositionSchema),
});

export type LayoutPosition = z.infer<typeof layoutPositionSchema>;
export type LayoutMeta = z.infer<typeof layoutMetaSchema>;
export type Layout = z.infer<typeof layoutSchema>;
```

### SVG Builder Function (Server-Side String Generation)
```typescript
// src/lib/ai-landscape/svg-builder.ts
// Source: Follows diagram-base.ts pattern from src/lib/guides/svg-diagrams/
import type { AiNode, Edge, Cluster } from './schema';
import type { LayoutPosition, LayoutMeta } from './layout-schema';

const NODE_RADIUS = 18;
const LABEL_FONT_SIZE = 9;
const FONT_FAMILY = "'DM Sans', sans-serif";

export function buildLandscapeSvg(
  nodes: AiNode[],
  edges: Edge[],
  positions: LayoutPosition[],
  clusters: Cluster[],
  meta: LayoutMeta,
): string {
  const posMap = new Map(positions.map(p => [p.id, p]));
  const nodeMap = new Map(nodes.map(n => [n.id, n]));
  const clusterMap = new Map(clusters.map(c => [c.id, c]));
  const PAD = 40;

  // CSS style block for dark mode cluster colors
  const styles = clusters.map(c =>
    `.ai-cluster-${c.id} { fill: ${c.color}; }
     html.dark .ai-cluster-${c.id} { fill: ${c.darkColor}; }`
  ).join('\n');

  const edgeSvg = edges.map(e => {
    const s = posMap.get(e.source);
    const t = posMap.get(e.target);
    if (!s || !t) return '';
    const strokeClass = e.type === 'hierarchy' ? 'stroke-width: 2' : 'stroke-width: 1; opacity: 0.5';
    const dashArray = e.type === 'includes' ? 'stroke-dasharray="4 3"' : '';
    return `<line x1="${s.x}" y1="${s.y}" x2="${t.x}" y2="${t.y}" stroke="var(--color-border)" style="${strokeClass}" ${dashArray}/>`;
  }).join('\n');

  const nodeSvg = nodes.map(n => {
    const pos = posMap.get(n.id);
    if (!pos) return '';
    return `<g>
      <circle cx="${pos.x}" cy="${pos.y}" r="${NODE_RADIUS}" class="ai-cluster-${n.cluster}" stroke-width="1.5"/>
      <text x="${pos.x}" y="${pos.y + NODE_RADIUS + LABEL_FONT_SIZE + 2}" text-anchor="middle" font-size="${LABEL_FONT_SIZE}" fill="var(--color-text-primary)" font-family="${FONT_FAMILY}">${n.name.replace(/ *\(.*\)/, '')}</text>
    </g>`;
  }).join('\n');

  return `<svg viewBox="0 0 ${meta.width} ${meta.height}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="AI Landscape force-directed graph showing 51 concept nodes across 9 clusters" style="width:100%;height:auto;max-width:${meta.width}px">
    <style>${styles}</style>
    <g class="edges">${edgeSvg}</g>
    <g class="nodes">${nodeSvg}</g>
  </svg>`;
}
```

### Landing Page (Following beauty-index pattern)
```astro
---
// src/pages/ai-landscape/index.astro
// Source: Matches src/pages/beauty-index/index.astro pattern
import { getCollection } from 'astro:content';
import graphData from '../../data/ai-landscape/graph.json';
import layoutData from '../../data/ai-landscape/layout.json';
import { buildLandscapeSvg } from '../../lib/ai-landscape/svg-builder';
import { conceptUrl, AI_LANDSCAPE_BASE } from '../../lib/ai-landscape/routes';
import Layout from '../../layouts/Layout.astro';
import BreadcrumbJsonLd from '../../components/BreadcrumbJsonLd.astro';
import GraphLegend from '../../components/ai-landscape/GraphLegend.astro';
import ConceptList from '../../components/ai-landscape/ConceptList.astro';
import type { AiNode } from '../../lib/ai-landscape/schema';

const entries = await getCollection('aiLandscape');
const allNodes = entries.map(e => e.data as AiNode);

const svgString = buildLandscapeSvg(
  allNodes,
  graphData.edges,
  layoutData.positions,
  graphData.clusters,
  layoutData.meta,
);

// Group nodes by cluster for concept list
const nodesByCluster = new Map<string, AiNode[]>();
for (const node of allNodes) {
  const existing = nodesByCluster.get(node.cluster) || [];
  existing.push(node);
  nodesByCluster.set(node.cluster, existing);
}
---

<Layout
  title="AI Landscape Explorer: Visual Guide to Artificial Intelligence (2026 Edition) | Patryk Golabek"
  description="Explore the AI landscape — from machine learning to generative AI, agentic systems, and developer tools. Interactive visual guide with 51 concepts explained."
>
  <BreadcrumbJsonLd crumbs={[
    { name: 'Home', url: 'https://patrykgolabek.dev/' },
    { name: 'AI Landscape', url: 'https://patrykgolabek.dev/ai-landscape/' },
  ]} />

  <!-- Hero -->
  <section class="text-center max-w-4xl mx-auto py-16 pb-12 px-4">
    <span class="inline-block text-xs font-mono text-[var(--color-accent)] border border-[var(--color-accent)]/30 rounded-full px-3 py-1 mb-4">2026 Edition</span>
    <h1 class="text-4xl sm:text-5xl font-heading font-bold">AI Landscape Explorer</h1>
    <p class="text-lg text-[var(--color-text-secondary)] mt-4 max-w-2xl mx-auto">
      A visual guide to 51 key concepts in artificial intelligence, from foundational ML to cutting-edge agentic systems.
    </p>
  </section>

  <!-- Static SVG Graph -->
  <section class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 overflow-x-auto">
    <Fragment set:html={svgString} />
  </section>

  <!-- Legend -->
  <GraphLegend />

  <!-- Category-Grouped Concept List -->
  <ConceptList nodesByCluster={nodesByCluster} clusters={graphData.clusters} />
</Layout>
```

### Category-Grouped Concept List
```astro
---
// src/components/ai-landscape/ConceptList.astro
import { conceptUrl } from '../../lib/ai-landscape/routes';
import type { AiNode, Cluster } from '../../lib/ai-landscape/schema';

interface Props {
  nodesByCluster: Map<string, AiNode[]>;
  clusters: Cluster[];
}

const { nodesByCluster, clusters } = Astro.props;
---

<section class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-16 pb-16">
  <h2 class="text-2xl font-heading font-bold mb-6">Explore by Category</h2>
  <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
    {clusters.map(cluster => {
      const clusterNodes = nodesByCluster.get(cluster.id) || [];
      if (clusterNodes.length === 0) return null;
      return (
        <div>
          <h3 class="text-lg font-heading font-bold mb-2" style={`border-left: 4px solid ${cluster.darkColor}; padding-left: 0.5rem`}>
            {cluster.name}
          </h3>
          <ul class="space-y-1">
            {clusterNodes.map(node => (
              <li>
                <a href={conceptUrl(node.slug)} class="text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-accent)] transition-colors">
                  {node.name}
                </a>
              </li>
            ))}
          </ul>
        </div>
      );
    })}
  </div>
</section>
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Runtime force simulation in browser | Build-time pre-computation to layout.json | Best practice for SSG sites | Zero JS for initial graph render; faster first paint |
| External SVG file | Inline SVG with CSS custom properties | Established project pattern | Dark mode support without JS; theme-reactive |
| Graphviz for static layouts | d3-force headless in Node.js | d3-force v3 (2021) | No native binary dependency; runs in any Node.js environment |
| Full `d3` umbrella import | Micro-module `d3-force` import | D3 v4+ modular architecture | ~10KB instead of ~500KB; project convention |

**Deprecated/outdated:**
- d3-force v1/v2 API: v3 is ESM-native; v2 had CommonJS exports. Use `import { forceSimulation } from 'd3-force'` (not `require`).
- `simulation.on('end', ...)` for static layouts: Not needed when using `simulation.stop()` + manual `tick()` loop.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | vitest 4.0.18 |
| Config file | `vitest.config.ts` (exists, includes `src/**/*.test.ts`) |
| Quick run command | `npx vitest run src/lib/ai-landscape` |
| Full suite command | `npx vitest run` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| GRAPH-08 | layout.json has x/y for all 51 nodes; SVG builder produces valid SVG string | unit | `npx vitest run src/lib/ai-landscape/__tests__/layout.test.ts -x` | Wave 0 |
| GRAPH-02 | SVG string contains cluster color classes for all 9 clusters; dark mode CSS rules present | unit | `npx vitest run src/lib/ai-landscape/__tests__/svg-builder.test.ts -x` | Wave 0 |
| GRAPH-07 | GraphLegend renders entries for all clusters with correct colors | unit/smoke | `npx astro build` (build verification) | N/A |
| SITE-01 | Landing page renders at /ai-landscape/ with SVG and concept list | smoke | `npx astro build` + verify dist output | N/A |

### Sampling Rate
- **Per task commit:** `npx vitest run src/lib/ai-landscape`
- **Per wave merge:** `npx vitest run`
- **Phase gate:** Full suite green + `npx astro build` succeeds + visual spot-check of `/ai-landscape/` page

### Wave 0 Gaps
- [ ] `src/lib/ai-landscape/__tests__/layout.test.ts` -- validates layout.json schema, position count matches node count, all positions within viewBox bounds
- [ ] `src/lib/ai-landscape/__tests__/svg-builder.test.ts` -- validates SVG output contains expected elements, cluster classes, dark mode styles
- [ ] `src/lib/ai-landscape/__tests__/layout-schema.test.ts` -- validates Zod schema for layout.json

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | generate-layout.mjs script | Yes | (Astro build requires it) | -- |
| d3-force | Force simulation | NOT INSTALLED | -- | Must install: `npm install d3-force` |
| @types/d3-force | TypeScript types | NOT INSTALLED | -- | Must install: `npm install @types/d3-force` |
| d3-scale | Optional viewport scaling | Already installed | 4.0.2 | Can use simple linear math instead |

**Missing dependencies with no fallback:**
- `d3-force` -- required for force simulation, no alternative. Must be installed.
- `@types/d3-force` -- required for TypeScript compilation. Must be installed.

**Missing dependencies with fallback:**
- None. d3-force is the only new dependency and it is essential.

## Open Questions

1. **Force parameter tuning**
   - What we know: The simulation needs `forceManyBody`, `forceLink`, `forceCenter`, `forceCollide`, and cluster-positioning `forceX`/`forceY`. Reasonable starting values: charge strength -200, link distance 60, collision radius 25, cluster strength 0.15.
   - What's unclear: Exact parameter values need visual tuning -- cluster spacing, node density, and edge routing all depend on the specific graph structure (51 nodes, 66 edges, 9 clusters with uneven sizes from 1 to 12 nodes).
   - Recommendation: Start with the values in the code examples, run the script, visually inspect the output, and adjust iteratively. The script runs in <1 second so iteration is fast.

2. **SVG node shapes**
   - What we know: The DOT file uses `shape=ellipse` for root cluster nodes (AI, ML, NN, DL, GenAI) and `shape=box` for everything else. The phase description mentions "node shapes" in the legend.
   - What's unclear: Whether to preserve both shapes (ellipses for root nodes, circles for others) or use circles for everything in the force layout.
   - Recommendation: Use circles with larger radius for root/cluster-head nodes (e.g., r=24) and smaller radius for leaf nodes (e.g., r=16). This creates visual hierarchy without the complexity of mixed shapes in SVG positioning.

3. **Edge label rendering in static SVG**
   - What we know: GRAPH-06 requires edge labels, but that is NOT a Phase 104 requirement. GRAPH-07 (legend) is required.
   - What's unclear: Whether the static SVG should show any edge labels or just edge lines.
   - Recommendation: No edge labels in the static SVG -- it would be too cluttered with 66 edges. Show only edge lines with visual differentiation by type (solid for hierarchy, dashed for includes, dotted for relates). Labels come in Phase 105 interactive version.

4. **Mobile responsiveness of the SVG**
   - What we know: The SVG uses viewBox-based scaling, so it shrinks proportionally. At mobile widths (~375px), text will be very small.
   - What's unclear: Whether to provide a simplified mobile view, use horizontal scroll, or rely on the concept list as the mobile-friendly alternative.
   - Recommendation: Wrap the SVG in a container with `overflow-x: auto` for horizontal scroll on mobile. The concept list below provides the accessible, mobile-friendly content. The SVG is primarily a desktop experience in its static form.

5. **layout.json version control**
   - What we know: The file is generated by the prebuild script. It is deterministic (same input -> same output).
   - What's unclear: Whether to commit `layout.json` to git or generate it fresh every build.
   - Recommendation: Commit `layout.json` to git. This makes builds reproducible without d3-force being installed, allows visual diffing of layout changes, and serves as a cache (no need to regenerate if node data hasn't changed). The generate-layout script can check if regeneration is needed by comparing node/edge checksums.

## Sources

### Primary (HIGH confidence)
- [D3-Force Simulation API](https://d3js.org/d3-force/simulation) -- forceSimulation, tick, stop, randomSource (deterministic by default)
- [D3-Force Module Overview](https://d3js.org/d3-force) -- all force types (center, manyBody, collide, link, x, y)
- [D3 forceCenter](https://d3js.org/d3-force/center) -- center force API
- [D3 forceManyBody](https://d3js.org/d3-force/many-body) -- repulsive force API with strength, theta, distanceMin/Max
- [D3 forceLink](https://d3js.org/d3-force/link) -- link force API with id accessor, distance, strength, iterations
- [D3 forceCollide](https://d3js.org/d3-force/collide) -- collision detection API
- [D3 forceX/forceY (Position Forces)](https://d3js.org/d3-force/position) -- position forces for cluster grouping
- [Static Force Layout (Bostock gist)](https://gist.github.com/mbostock/1667139) -- canonical pattern for headless tick loop
- Codebase analysis: `src/lib/guides/svg-diagrams/diagram-base.ts` -- CSS variable palette, SVG viewBox pattern, dark mode support
- Codebase analysis: `src/lib/eda/svg-generators/plot-base.ts` -- SVG generation pattern with CSS variables
- Codebase analysis: `src/pages/beauty-index/index.astro` -- landing page pattern (hero, content sections, JSON-LD)
- Codebase analysis: `src/pages/db-compass/index.astro` -- landing page pattern with legend
- Codebase analysis: `src/data/ai-landscape/graph.json` -- 9 clusters with light/dark colors, 66 edges
- Codebase analysis: `src/data/ai-landscape/nodes.json` -- 51 concept nodes
- Codebase analysis: `src/styles/global.css` -- dark mode via `html.dark` class, CSS custom properties
- Codebase analysis: `package.json` -- existing d3 micro-modules, prebuild script pattern
- Codebase analysis: `scripts/download-actionlint-wasm.mjs` -- existing prebuild script pattern

### Secondary (MEDIUM confidence)
- [d3-force npm page](https://www.npmjs.com/package/d3-force) -- version 3.0.0 confirmed as latest
- [@types/d3-force npm page](https://www.npmjs.com/package/@types/d3-force) -- version 3.0.10 confirmed as latest
- [GitHub d3/d3-force](https://github.com/d3/d3-force) -- ESM module, source code

### Tertiary (LOW confidence)
- Force parameter values (charge strength, link distance, collision radius, cluster strength) -- starting estimates based on typical d3-force usage for graphs of this size. Require visual tuning.
- Cluster centroid coordinates -- approximate layout positions inspired by the DOT file's LR hierarchy. Require adjustment after seeing the initial simulation output.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- d3-force is the only option for force-directed layout in the JS ecosystem; version verified; all other dependencies already installed
- Architecture: HIGH -- landing page pattern directly follows beauty-index/db-compass patterns verified in codebase; SVG generation follows diagram-base.ts pattern; prebuild script follows existing project convention
- Pitfalls: HIGH -- d3-force mutation behavior documented in official docs; dark mode pattern verified from codebase analysis; viewBox scaling behavior is well-understood SVG behavior
- Force parameters: LOW -- starting values are reasonable estimates but need visual tuning for this specific graph

**Research date:** 2026-03-26
**Valid until:** 2026-04-25 (stable -- d3-force 3.0.0 is mature and unchanged since 2021; project patterns are established)
