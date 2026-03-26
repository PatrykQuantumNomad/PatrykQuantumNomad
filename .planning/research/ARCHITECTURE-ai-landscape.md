# Architecture Patterns: AI Landscape Explorer

**Domain:** Interactive educational knowledge map integrated into Astro 5 portfolio
**Researched:** 2026-03-26
**Confidence:** HIGH (architecture derived from direct codebase analysis of existing patterns)

---

## Executive Summary

The AI Landscape Explorer integrates into the existing Astro 5 portfolio as a new section at `/ai-landscape/`. It follows the established content collection pattern (JSON data + Astro pages via `getStaticPaths`) and the React island pattern (`client:visible` / `client:only="react"`) already proven across EDA distributions, Database Compass, and tool analyzers. The primary new element is a D3 force-directed map component -- which fits naturally alongside the existing D3 micro-module usage in distribution explorers.

The architecture has three layers: (1) a build-time DOT-to-JSON pipeline that parses `ai_landscape.dot` and produces a typed content collection, (2) Astro static page generation for ~80 individual SEO pages, and (3) a React island housing the interactive force graph with side panel. Pre-computing force layout positions at build time is the key architectural decision -- it eliminates simulation jank on load, provides SSG-friendly static SVG fallbacks, and keeps the client bundle to just d3-zoom/d3-drag for interaction.

---

## Recommended Architecture

### High-Level Data Flow

```
ai_landscape.dot (source of truth)
        |
        v
[Build-time DOT parser script]     <-- ts-graphviz or custom regex parser
        |
        v
src/data/ai-landscape/nodes.json   <-- Zod-validated content collection
src/data/ai-landscape/edges.json   <-- Separate edges collection (optional, or embedded)
        |
        v
[Build-time force layout script]   <-- d3-force pre-computes x,y positions
        |
        v
src/data/ai-landscape/layout.json  <-- Pre-computed {nodeId: {x, y}} positions
        |
        +---> [Content collection] ---> getStaticPaths ---> /ai-landscape/[slug]/ pages
        |
        +---> [React island] ---> ForceGraph + SidePanel (client:only="react")
```

### Component Architecture

```
src/
  data/
    ai-landscape/
      nodes.json          <-- Content collection: 83 nodes with educational content
      edges.json          <-- Edge definitions with relationship types
      layout.json         <-- Pre-computed x,y positions from d3-force

  lib/
    ai-landscape/
      schema.ts           <-- Zod schemas for node, edge, layout
      dot-parser.ts       <-- DOT file -> JSON transformer (build script)
      force-layout.ts     <-- d3-force simulation -> layout.json (build script)
      routes.ts           <-- URL helpers: nodeUrl(slug) -> /ai-landscape/[slug]/
      colors.ts           <-- Cluster color map matching DOT bgcolor values

  components/
    ai-landscape/
      LandscapeGraph.tsx       <-- React island: SVG force graph with zoom/pan/click
      LandscapeNodeCircle.tsx  <-- Individual node rendering (circle + label)
      LandscapeEdgeLine.tsx    <-- Edge rendering (lines with optional labels)
      LandscapeSidePanel.tsx   <-- Slide-in detail panel on node click
      LandscapeClusterHull.tsx <-- Convex hull overlay for cluster boundaries
      LandscapeLegend.tsx      <-- Color legend for cluster categories
      LandscapeJsonLd.astro    <-- JSON-LD structured data
      LandscapeBreadcrumb.astro <-- Breadcrumb component
      LandscapePage.astro      <-- Detail page layout (like DistributionPage.astro)

  pages/
    ai-landscape/
      index.astro         <-- Landing page with interactive force graph
      [slug].astro        <-- Individual node detail pages (83 pages)

  stores/
    landscapeStore.ts     <-- Nanostore: selectedNodeId, hoveredNodeId, activeCluster

  layouts/
    (reuse existing Layout.astro -- no new layout needed)
```

---

## Component Boundaries

| Component | Responsibility | Communicates With |
|-----------|---------------|-------------------|
| `dot-parser.ts` | Parses DOT file into structured JSON at build time | Reads `ai_landscape.dot`, writes `nodes.json` + `edges.json` |
| `force-layout.ts` | Runs d3-force simulation headlessly, outputs positions | Reads `nodes.json` + `edges.json`, writes `layout.json` |
| `schema.ts` | Zod validation for all three JSON files | Used by `content.config.ts` |
| `LandscapeGraph.tsx` | Renders SVG force graph, handles zoom/pan/drag | Reads nodes/edges/layout, writes to `landscapeStore` |
| `LandscapeSidePanel.tsx` | Shows node detail on click (summary, connections, link to full page) | Reads from `landscapeStore` |
| `LandscapePage.astro` | Wraps detail page content with breadcrumbs, SEO, related nodes | Used by `[slug].astro` |
| `LandscapeJsonLd.astro` | Schema.org DefinedTerm + BreadcrumbList markup | Used by detail pages |
| `landscapeStore.ts` | Cross-component state: selected node, hover, active cluster | Shared between graph + side panel |

---

## Data Model

### nodes.json Schema

```typescript
// src/lib/ai-landscape/schema.ts
import { z } from 'astro/zod';

export const clusterEnum = z.enum([
  'ai',           // Artificial Intelligence
  'ml',           // Machine Learning
  'nn',           // Neural Networks
  'dl',           // Deep Learning
  'genai',        // Generative AI
  'levels',       // Levels of Intelligence
  'agentic',      // Agentic AI
  'agent-frameworks', // Agent Frameworks
  'devtools',     // AI Developer Tools
  'standalone',   // Standalone nodes (MCP)
]);

export const nodeTypeEnum = z.enum([
  'concept',      // Abstract concept (ellipse nodes in DOT)
  'technique',    // Algorithm or method
  'model',        // Specific model (GPT, Claude, etc.)
  'framework',    // Software framework
  'paradigm',     // Learning paradigm
  'tool',         // Developer tool
]);

export const aiNodeSchema = z.object({
  id: z.string(),                          // DOT node ID: "CNN", "LLM", etc.
  slug: z.string(),                        // URL slug: "cnn", "llm"
  title: z.string(),                       // Display name: "Convolutional Neural Networks"
  shortTitle: z.string(),                  // Abbreviation for graph: "CNN"
  cluster: clusterEnum,                    // Which cluster this belongs to
  nodeType: nodeTypeEnum,                  // Concept vs model vs tool
  dotLabel: z.string(),                    // Original multi-line label from DOT
  // Educational content for detail pages
  description: z.string(),                 // 2-3 sentence explanation
  plainEnglish: z.string(),               // Jargon-free "explain like I'm 12"
  whyItMatters: z.string(),               // Real-world significance
  examples: z.array(z.string()).default([]), // Concrete examples
  connections: z.array(z.string()).default([]), // Related node IDs
  // SEO
  metaDescription: z.string(),
  tags: z.array(z.string()).default([]),
});

export const aiEdgeSchema = z.object({
  source: z.string(),                     // Source node ID
  target: z.string(),                     // Target node ID
  label: z.string().optional(),           // Edge label from DOT
  type: z.enum(['subset', 'enables', 'variant', 'example', 'related', 'uses']),
  style: z.enum(['solid', 'dashed', 'dotted']).default('solid'),
});

export const layoutPositionSchema = z.object({
  id: z.string(),
  x: z.number(),
  y: z.number(),
  cluster: clusterEnum,
});

export type AINode = z.infer<typeof aiNodeSchema>;
export type AIEdge = z.infer<typeof aiEdgeSchema>;
export type LayoutPosition = z.infer<typeof layoutPositionSchema>;
```

### Content Collection Registration

```typescript
// Addition to src/content.config.ts
import { aiNodeSchema } from './lib/ai-landscape/schema';

const aiNodes = defineCollection({
  loader: file('src/data/ai-landscape/nodes.json'),
  schema: aiNodeSchema,
});

// edges and layout are NOT content collections -- they're imported directly
// because they don't map 1:1 to pages

export const collections = {
  // ...existing collections
  aiNodes,
};
```

**Design decision:** Only `nodes.json` is a content collection because each node maps to a page. Edges and layout are plain JSON imports used by the graph component and build scripts.

---

## Detailed Component Designs

### 1. Build-Time DOT Parser (`dot-parser.ts`)

**Approach:** Custom regex-based parser over `ts-graphviz` because:
- The DOT file is well-structured with predictable patterns
- `@ts-graphviz/parser` is deprecated (no longer supported per npm)
- `dotparser` (anvaka) works but adds an unnecessary dependency for a one-time build step
- A 100-line regex parser extracting node IDs, labels, cluster membership, and edge definitions is more maintainable

**Execution:** Run as a `tsx` build script (already a dev dependency):
```bash
npx tsx scripts/parse-ai-landscape.ts
```

This produces `nodes.json` (skeleton with DOT-derived fields) that is then manually enriched with educational content (`description`, `plainEnglish`, `whyItMatters`, `examples`).

**Key insight:** The DOT file is the *structural* source of truth (nodes, clusters, edges). The educational content is *authored separately* in the JSON. The parser seeds the JSON structure; a human writes the content.

### 2. Build-Time Force Layout (`force-layout.ts`)

**Why pre-compute:** D3 force simulation with 83 nodes takes ~100ms to converge (300 ticks). Running this at build time means:
- Zero simulation jank on page load
- Static SVG fallback is trivially generated from known positions
- Client JS only needs zoom/pan/drag -- no simulation overhead
- Layout is deterministic across builds (same seed)

**Implementation:**
```typescript
import { forceSimulation, forceLink, forceManyBody, forceCenter, forceCollide, forceX, forceY } from 'd3-force';

// Group nodes by cluster, apply forceX/forceY to cluster centers
// This creates the nested visual hierarchy matching the DOT layout
const simulation = forceSimulation(nodes)
  .force('link', forceLink(edges).id(d => d.id).distance(80))
  .force('charge', forceManyBody().strength(-200))
  .force('center', forceCenter(width / 2, height / 2))
  .force('collision', forceCollide().radius(30))
  .force('clusterX', forceX(d => clusterCenters[d.cluster].x).strength(0.3))
  .force('clusterY', forceY(d => clusterCenters[d.cluster].y).strength(0.3))
  .stop();

// Run 300 ticks headlessly
for (let i = 0; i < 300; i++) simulation.tick();

// Extract positions
const layout = nodes.map(n => ({ id: n.id, x: n.x, y: n.y, cluster: n.cluster }));
```

**New dependency:** `d3-force` (not currently installed). Small module (~15KB minified). Types: `@types/d3-force`.

**Execution:** Same script pipeline as the DOT parser, or a separate script:
```bash
npx tsx scripts/compute-ai-layout.ts
```

### 3. Interactive Force Graph (`LandscapeGraph.tsx`)

**Rendering approach:** SVG (not Canvas) because:
- 83 nodes is well within SVG performance limits (Canvas shines at 500+)
- SVG allows CSS styling for dark mode (`var(--color-*)` tokens)
- SVG elements are individually clickable without hit-testing math
- Matches existing D3 usage in distribution explorers (SVG-based)
- Accessible: nodes can be `<a>` elements or have `role="link"`

**React island strategy:** `client:only="react"` (not `client:visible`) because the graph is the primary content of the landing page -- it should load immediately, not wait for scroll intersection.

**Interaction model:**
- **Zoom/pan:** d3-zoom (already installed) applied to SVG `<g>` container
- **Node click:** Updates `landscapeStore.selectedNodeId` -> opens side panel
- **Node hover:** Highlights connected edges + dims unrelated nodes
- **Cluster click:** Filters to show only that cluster's nodes
- **Node drag:** Optional, d3-drag (already installed) repositions individual nodes from pre-computed positions

**Key architectural choice -- no live simulation on client:**
The graph renders from pre-computed positions. There is no `forceSimulation` running in the browser. This means `d3-force` is a build-time-only dependency (not in the client bundle). The client only uses:
- `d3-selection` (already installed)
- `d3-zoom` (already installed)
- `d3-drag` (already installed, optional for node repositioning)
- `d3-transition` (already installed, for smooth hover/click animations)

**Bundle size impact:** Near zero additional client-side JS beyond the React component itself. All D3 modules needed are already installed.

### 4. Side Panel (`LandscapeSidePanel.tsx`)

**Pattern:** Slide-in panel from the right (like a sheet/drawer). Triggered by node click. Contains:
- Node title + short description
- "Explain like I'm 12" plain English section
- Why it matters
- Connected nodes (clickable, navigate graph)
- "Learn more" link to `/ai-landscape/[slug]/`

**State management:** Reads `selectedNodeId` from `landscapeStore` (nanostores). Same atom pattern as `categoryFilterStore.ts`.

```typescript
// src/stores/landscapeStore.ts
import { atom } from 'nanostores';

export const selectedNodeId = atom<string | null>(null);
export const hoveredNodeId = atom<string | null>(null);
export const activeCluster = atom<string | null>(null);

export function selectNode(id: string | null) { selectedNodeId.set(id); }
export function hoverNode(id: string | null) { hoveredNodeId.set(id); }
export function filterCluster(cluster: string | null) { activeCluster.set(cluster); }
```

### 5. Detail Pages (`[slug].astro`)

**Pattern:** Exact match to `eda/distributions/[slug].astro`:
- `getStaticPaths()` from `getCollection('aiNodes')`
- Props include node data + related nodes
- Layout wraps in breadcrumbs + JSON-LD
- Static content: no React islands needed on detail pages (pure Astro)

```typescript
export async function getStaticPaths() {
  const nodes = await getCollection('aiNodes');
  const nodeMap = new Map(nodes.map(n => [n.data.id, n.data]));

  return nodes.map(node => ({
    params: { slug: node.data.slug },
    props: {
      node: node.data,
      relatedNodes: node.data.connections
        .filter(id => nodeMap.has(id))
        .map(id => {
          const related = nodeMap.get(id)!;
          return { slug: related.slug, title: related.title };
        }),
    },
  }));
}
```

### 6. Landing Page (`index.astro`)

**Structure:**
1. Hero section with title + intro text
2. Interactive force graph (React island, full width)
3. Side panel (part of the React island)
4. Category/cluster legend
5. Alphabetical node index (static Astro, for SEO)

**Static SVG fallback:** Generated at build time from `layout.json` positions. Displayed before React hydrates. Hidden via CSS `:has()` selector when React mounts (same pattern as distribution pages).

### 7. OG Image Generation

**Pattern:** Follow existing `src/lib/og-image.ts` + `src/lib/eda/og-cache.ts`:
- Generate OG images for each of the 83 detail pages using Satori + Sharp
- Content-hash caching to avoid regeneration
- Template: node title + cluster color + mini-graph showing immediate connections

### 8. JSON-LD Structured Data

Each detail page gets `DefinedTerm` schema.org markup:
```json
{
  "@context": "https://schema.org",
  "@type": "DefinedTerm",
  "name": "Convolutional Neural Networks",
  "description": "...",
  "inDefinedTermSet": {
    "@type": "DefinedTermSet",
    "name": "AI Landscape Explorer"
  }
}
```

The index page gets `CollectionPage` + `BreadcrumbList`.

---

## Integration Points with Existing Architecture

### What Stays the Same (Reuse)

| Existing Pattern | Reused For |
|-----------------|-----------|
| `file()` loader in `content.config.ts` | `aiNodes` collection from `nodes.json` |
| `getStaticPaths()` + `getCollection()` | Generating 83 `/ai-landscape/[slug]/` pages |
| `Layout.astro` base layout | Both index and detail pages |
| Nanostores atom pattern | `landscapeStore.ts` for graph state |
| `client:only="react"` island | Force graph component |
| D3 micro-modules (selection, zoom, drag, transition) | Graph interaction layer |
| Satori + Sharp OG pipeline | OG images for detail pages |
| `BreadcrumbJsonLd.astro` | Breadcrumb structured data |
| Tailwind utility classes | All styling |
| `routes.ts` helper pattern | `nodeUrl(slug)` helper |
| Content-hash OG caching | `src/lib/ai-landscape/og-cache.ts` |

### What Is New

| New Element | Why It Cannot Be Reused |
|------------|------------------------|
| `d3-force` npm module (build-time only) | Not currently installed; needed for force layout computation |
| `@types/d3-force` npm module | Type definitions for d3-force |
| DOT parser script | No existing DOT parsing capability |
| Force layout pre-computation script | New build-time computation pattern |
| Convex hull cluster visualization | New visual element (could use d3-shape's `hull()` if needed, but d3-shape is already installed) |
| Side panel (slide-in drawer) | No existing slide-in panel pattern |
| `landscapeStore.ts` | New nanostore instance (pattern exists, instance is new) |

### What Gets Modified

| Existing File | Modification |
|--------------|-------------|
| `src/content.config.ts` | Add `aiNodes` collection |
| `astro.config.mjs` sitemap serialize | Add `/ai-landscape/` priority/changefreq rules |
| `package.json` | Add `d3-force`, `@types/d3-force` |
| Navigation / header | Add "AI Landscape" link |

---

## Data Flow: End-to-End

### Build Time

```
1. [Manual/Script] Parse ai_landscape.dot -> nodes.json (skeleton) + edges.json
2. [Manual] Author educational content for each node in nodes.json
3. [Build Script] Run d3-force simulation on nodes.json + edges.json -> layout.json
4. [Astro Build] Content collection validates nodes.json via Zod schema
5. [Astro Build] getStaticPaths generates 83 detail pages from aiNodes collection
6. [Astro Build] index.astro generates static SVG fallback from layout.json positions
7. [Astro Build] OG images generated for each detail page via Satori + Sharp
8. [Astro Build] Sitemap includes all /ai-landscape/ URLs
```

### Runtime (Client Browser)

```
1. User visits /ai-landscape/
2. Static SVG fallback renders immediately (no JS required)
3. React island hydrates LandscapeGraph + LandscapeSidePanel
4. Static SVG hidden via CSS :has() selector
5. React renders SVG from pre-computed layout.json positions
6. d3-zoom enables pan/zoom on the SVG container
7. Node click -> landscapeStore.selectedNodeId updates -> side panel slides in
8. Side panel "Learn more" link navigates to /ai-landscape/[slug]/ (full page nav)
9. Node hover -> d3-transition dims unconnected nodes, highlights edges
```

### Detail Page (No Client-Side Complexity)

```
1. User visits /ai-landscape/cnn/ (or clicks from graph)
2. Pure Astro static page renders immediately
3. Content: title, plain English explanation, why it matters, examples
4. Related nodes section with links back to other detail pages
5. "Back to map" link returns to /ai-landscape/ index
6. JSON-LD DefinedTerm markup for SEO
```

---

## Patterns to Follow

### Pattern 1: Build-Time Data Transformation

**What:** Parse and transform data at build time, not runtime. The DOT file is never read by client code.

**When:** Always for this project. The DOT file is the source of truth for structure; the JSON files are the build artifacts.

**Example:** Same as how `distributions.json` is a pre-authored data file consumed by `content.config.ts`. The difference here is that the JSON is *generated* from the DOT file first.

### Pattern 2: Static SVG Fallback + Hydrated Interactive

**What:** Render a non-interactive SVG from known positions at build time. Hide it when the React island mounts.

**When:** On the index page. Detail pages are static-only.

**Example:** Directly follows `DistributionPage.astro` pattern:
```astro
<div class="landscape-fallback" data-landscape-fallback>
  <svg viewBox="...">
    {/* Render nodes at layout.json positions */}
  </svg>
</div>

<LandscapeGraph client:only="react" nodes={nodes} edges={edges} layout={layout} />

<style>
  .landscape-fallback:has(~ div [data-graph-active]) { display: none; }
</style>
```

### Pattern 3: Nanostore for Cross-Component Communication

**What:** Use nanostores atoms to share state between the graph component and the side panel.

**When:** The graph and side panel are separate React components that need shared state.

**Example:** Identical to `categoryFilterStore.ts`:
```typescript
import { atom } from 'nanostores';
export const selectedNodeId = atom<string | null>(null);
```

### Pattern 4: Cluster-Aware Force Layout

**What:** Use `forceX` and `forceY` with cluster-specific target positions to create visual grouping that mirrors the DOT file's nested cluster hierarchy.

**When:** During build-time force layout computation.

**Why:** The DOT file has nested clusters (AI > ML > NN > DL > GenAI). The force layout should preserve this spatial hierarchy. Without cluster forces, nodes spread randomly.

---

## Anti-Patterns to Avoid

### Anti-Pattern 1: Running Force Simulation on Client

**What:** Initializing `d3-force` simulation in the browser and letting it converge on load.

**Why bad:** 300 ticks of simulation causes visual jank. Nodes visibly "settle" which looks unprofessional. Adds d3-force to client bundle unnecessarily. Non-deterministic layout across page loads.

**Instead:** Pre-compute positions at build time. Client code only renders from known coordinates.

### Anti-Pattern 2: Using Canvas Instead of SVG for 83 Nodes

**What:** Rendering the force graph with Canvas/WebGL (e.g., `react-force-graph` library).

**Why bad:** Canvas loses CSS variable theming (dark mode), individual node accessibility, and simple click handling. Overkill for 83 nodes. Canvas shines at 500+ nodes.

**Instead:** SVG with d3-zoom for pan/zoom. Each node is a clickable `<g>` element with proper ARIA attributes.

### Anti-Pattern 3: Making the DOT File a Runtime Dependency

**What:** Parsing the DOT file in the browser or at request time.

**Why bad:** DOT parsing is a build concern. Including a DOT parser in the client bundle adds unnecessary weight. The DOT file format is not optimized for browser consumption.

**Instead:** DOT -> JSON at build time. JSON consumed by both content collections and React components.

### Anti-Pattern 4: Single Monolithic Content Collection Entry

**What:** Putting all 83 nodes plus edges plus layout in one giant JSON object.

**Why bad:** Content collections work best with one entry per page. Makes `getStaticPaths` awkward. Schema validation applies per-entry.

**Instead:** `nodes.json` is an array of 83 objects (one per node, one per page). Edges and layout are separate helper files.

### Anti-Pattern 5: React Flow for the Force Graph

**What:** Using `@xyflow/react` (React Flow) instead of D3 SVG for the force graph.

**Why bad:** React Flow is designed for flowcharts/DAGs with discrete node-edge layouts, not force-directed spatial graphs. It uses dagre for layout which produces grid-like arrangements. The site already uses React Flow for its proper purpose (dependency graphs). Using it for a force-directed visualization would fight against its design. Also, React Flow's ~120KB bundle is unnecessary when D3 modules already installed handle this natively.

**Instead:** D3 SVG rendering inside a React component (same pattern as `DistributionExplorer.tsx`).

---

## Scalability Considerations

| Concern | At 83 nodes (current) | At 200 nodes (future) | At 500+ nodes |
|---------|----------------------|----------------------|---------------|
| SVG rendering | No concern | Fine with virtualization | Switch to Canvas |
| Force layout | <100ms build time | <500ms build time | Use web worker |
| Side panel | Slide-in drawer | Same | Same |
| Detail pages | 83 static pages | 200 static pages (fine) | Consider pagination |
| Bundle size | ~0KB additional (D3 already installed) | Same | Same |
| OG images | 83 images cached | 200 images cached | Increase cache version |

---

## Suggested Build Order

Dependencies flow top-to-bottom. Each phase builds on the previous.

### Phase 1: Data Foundation (no visual output yet)

1. **DOT Parser Script** -- Parse `ai_landscape.dot` into `nodes.json` (skeleton) + `edges.json`
2. **Zod Schema** -- Define and validate the node/edge schemas
3. **Content Collection** -- Register `aiNodes` in `content.config.ts`
4. **Educational Content** -- Author `description`, `plainEnglish`, `whyItMatters` for each node

**Rationale:** Everything downstream depends on the data model being correct. Get the schema right first.

### Phase 2: Static Pages (SEO value, no interactivity)

5. **Detail Page Template** -- `LandscapePage.astro` + `[slug].astro` generating 83 pages
6. **JSON-LD + Breadcrumbs** -- Structured data for each detail page
7. **OG Images** -- Satori + Sharp generation for social sharing
8. **Sitemap Integration** -- Add `/ai-landscape/` rules to `astro.config.mjs`

**Rationale:** SEO pages deliver value immediately. They work without the interactive graph. Ship these first.

### Phase 3: Force Layout + Static Fallback

9. **Force Layout Script** -- `d3-force` pre-computation producing `layout.json`
10. **Static SVG Fallback** -- Build-time SVG rendered from `layout.json` on index page
11. **Landing Page** -- `index.astro` with hero, static graph, alphabetical index

**Rationale:** The landing page works without JS. Crawlers and no-JS users see the full graph as static SVG.

### Phase 4: Interactive Graph (final polish)

12. **LandscapeGraph.tsx** -- React island with SVG rendering from pre-computed positions
13. **Zoom/Pan** -- d3-zoom integration
14. **Node Interaction** -- Click -> side panel, hover -> highlight
15. **LandscapeSidePanel.tsx** -- Drawer component with node summary + "Learn more" link
16. **Nanostore** -- `landscapeStore.ts` connecting graph + panel
17. **Cluster Hulls** -- Visual cluster boundaries
18. **Legend** -- Color key for cluster categories
19. **Navigation** -- Add "AI Landscape" to site header

**Rationale:** Interactivity is the last layer. Every previous phase works without it.

---

## New Dependencies

| Package | Version | Purpose | Bundle Impact |
|---------|---------|---------|---------------|
| `d3-force` | ^3.0.0 | Build-time force layout computation | **0 KB client** (build-only) |
| `@types/d3-force` | ^3.0.10 | TypeScript definitions | Dev dependency only |

No other new dependencies needed. All client-side D3 modules (`d3-selection`, `d3-zoom`, `d3-drag`, `d3-transition`, `d3-shape`) are already installed.

---

## Sources

- [D3 Force Simulation documentation](https://d3js.org/d3-force/simulation) -- Official API reference for force layout
- [Static force-directed graph (Observable)](https://observablehq.com/@d3/static-force-directed-graph) -- Pattern for pre-computing positions
- [ts-graphviz parser (deprecated)](https://www.npmjs.com/package/@ts-graphviz/parser) -- Evaluated and rejected; deprecated package
- [dotparser (npm)](https://www.npmjs.com/package/dotparser) -- Evaluated; unnecessary dependency for structured DOT file
- [Astro Content Collections documentation](https://docs.astro.build/en/guides/content-collections/) -- file() loader pattern
- [react-force-graph](https://github.com/vasturiano/react-force-graph) -- Evaluated and rejected; Canvas-based, overkill for 83 nodes
- Codebase analysis of existing patterns: `DistributionExplorer.tsx`, `CategoryFilter.tsx`, `DeploymentTopology.tsx`, `DependencyGraph.tsx`, `categoryFilterStore.ts`, `content.config.ts`
