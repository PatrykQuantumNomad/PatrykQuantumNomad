# Technology Stack: AI Landscape Explorer

**Project:** AI Landscape Explorer
**Researched:** 2026-03-26
**Confidence:** HIGH (all versions verified against npm registry; dependency tree verified via `npm ls`)

---

## Executive Summary

The AI Landscape Explorer needs a D3 force-directed graph with runtime simulation, zoom/pan, clickable nodes with a side panel, and ~80 individual SEO pages. The existing codebase already has 90% of what is needed. Only **2 new runtime packages** are required (`d3-force` + `d3-quadtree`), adding **~9KB gzipped** to the client bundle for pages that load the interactive graph.

**Critical correction:** d3-force must run at **runtime** (not build-time) to produce the interactive, explorable force simulation where nodes settle organically and users can drag nodes. Pre-computing positions at build time would produce a dead static diagram, defeating the purpose of a force-directed layout.

---

## New Dependencies to Install

### Runtime Dependencies

| Package | Version | Size (min+gz) | Purpose | Why Needed |
|---------|---------|---------------|---------|------------|
| `d3-force` | ^3.0.0 | ~5.5KB | Force simulation engine | Core physics: `forceSimulation`, `forceLink`, `forceManyBody`, `forceCenter`, `forceCollide`, `forceX`, `forceY`. No alternative exists in the D3 ecosystem for force-directed layouts. |
| `d3-quadtree` | ^3.0.1 | ~3.5KB | Spatial indexing | Required transitive dependency of `d3-force`. Powers efficient `forceManyBody` and `forceCollide` calculations via Barnes-Hut approximation. Installed automatically with `d3-force` but listed explicitly for transparency. |

### Dev Dependencies (Type Definitions)

| Package | Version | Purpose |
|---------|---------|---------|
| `@types/d3-force` | ^3.0.10 | TypeScript definitions for force simulation nodes, links, and force functions |
| `@types/d3-zoom` | ^3.0.8 | TypeScript definitions for zoom behavior, ZoomTransform, ZoomBehavior |
| `@types/d3-drag` | ^3.0.7 | TypeScript definitions for drag behavior |
| `@types/d3-transition` | ^3.0.9 | TypeScript definitions for smooth zoom-to-fit transitions |

### Installation Command

```bash
# Runtime (2 packages)
npm install d3-force@^3.0.0

# Dev (type definitions, 4 packages)
npm install -D @types/d3-force@^3.0.10 @types/d3-zoom@^3.0.8 @types/d3-drag@^3.0.7 @types/d3-transition@^3.0.9
```

Note: `d3-quadtree` is a transitive dependency of `d3-force` and will be installed automatically. No need to install it explicitly.

---

## Already Installed -- Zero Additional Cost

These packages are already in `node_modules/` as direct dependencies or transitive dependencies of `@xyflow/react`. Verified via `npm ls`:

### Direct Dependencies (in package.json)

| Package | Version | Current Usage | AI Landscape Usage |
|---------|---------|---------------|-------------------|
| `d3-selection` | ^3.0.0 | DistributionExplorer.tsx | SVG element selection/manipulation for graph rendering |
| `d3-scale` | ^4.0.2 | EDA SVG generators | `scaleOrdinal` for cluster-to-color mapping |
| `d3-array` | ^3.2.4 | EDA SVG generators | `extent` for computing viewport bounds for zoom-to-fit |
| `d3-shape` | ^3.2.0 | EDA SVG generators | Potentially for cluster boundary hulls (if visual cluster outlines are desired) |

### Transitive Dependencies (via @xyflow/react -> @xyflow/system)

| Package | Installed Version | Installed Via | AI Landscape Usage |
|---------|------------------|---------------|-------------------|
| `d3-zoom` | 3.0.0 | `@xyflow/system` | Pan/zoom behavior on the graph SVG. `zoom()`, `zoomIdentity`, `zoomTransform` |
| `d3-drag` | 3.0.0 | `@xyflow/system` | Interactive node dragging during simulation |
| `d3-transition` | 3.0.1 | `d3-zoom` | Smooth animated zoom-to-fit on node click, smooth pan to selected node |
| `d3-dispatch` | 3.0.1 | `d3-drag`, `d3-zoom` | Event system for simulation tick, drag, and zoom events |
| `d3-timer` | 3.0.1 | `d3-transition` | High-resolution timer for simulation frame updates |
| `d3-interpolate` | 3.0.1 | `d3-transition`, `d3-zoom` | Smooth interpolation during zoom transitions |
| `d3-ease` | 3.0.1 | `d3-transition` | Easing functions for zoom animations |
| `d3-color` | 3.0.1 | `d3-transition` | Color interpolation during transitions |

### Framework Stack (No Changes)

| Technology | Version | Role |
|------------|---------|------|
| Astro 5 | ^5.3.0 | Static pages for `/ai-landscape/` index and `/ai-landscape/[slug]/` routes |
| React 19 | ^19.2.4 | Island component for the interactive force graph (`client:visible`) |
| @astrojs/react | ^4.4.2 | Astro-React integration bridge |
| Nanostores | ^1.1.0 | Selected node state, side panel visibility, cluster filter state |
| @nanostores/react | ^1.0.0 | React hooks for nanostores (`useStore`) |
| Tailwind CSS | ^3.4.19 | Side panel, controls, layout styling |
| Zod (via astro:content) | bundled | Schema validation for AI landscape content collection |
| Satori + Sharp | ^0.19.2 / ^0.34.5 | OG image generation for `/ai-landscape/[slug]/` pages |
| TypeScript | ^5.9.3 | Type safety |
| GSAP | ^3.14.2 | Page entry animations (hero, scroll reveals) -- NOT used for graph internals |

---

## Architecture Decisions

### Decision 1: Runtime Force Simulation (Not Pre-computed)

**Choice:** d3-force runs in the browser, computing positions on every frame tick.

**Why:**
- The force simulation produces an organic, living layout where nodes settle into natural clusters. Users see the layout "breathe" on initial load.
- Dragging a node displaces it from equilibrium, and the simulation re-settles surrounding nodes -- this is the core interactive experience.
- Pre-computing positions at build time would produce a static SVG image. At that point, you might as well just render the DOT file as an SVG with Graphviz -- no interactivity.
- ~80 nodes with ~120 edges is trivial for d3-force. It settles in <500ms on any modern device. Performance is not a concern.

**Implication:** d3-force is a **client-side runtime** dependency, not a build tool. It ships in the interactive graph component's JS bundle.

### Decision 2: SVG Rendering (Not Canvas)

**Choice:** Render nodes and edges as SVG elements inside a React component.

**Why (for ~80 nodes):**
- 80 nodes + ~120 edges + labels = ~300 SVG elements. SVG handles this effortlessly (performance issues start at 1000+ elements).
- Each SVG element is individually clickable, hoverable, focusable, and stylable with CSS.
- CSS transitions work natively on SVG for hover effects (`opacity`, `transform`, `stroke-width`).
- SVG elements can have `aria-label`, `role`, `tabindex` for accessibility -- critical for educational content targeting non-technical users.
- SVG scales perfectly at any zoom level (vector graphics). Canvas would require resolution-aware rendering.
- Existing codebase pattern: `DistributionExplorer.tsx` renders D3 into SVG via React.

**Canvas is wrong for this use case.** Canvas wins at 5000+ nodes. At 80 nodes, it loses accessibility, CSS styling, hit testing convenience, and crisp zoom -- all things this project needs.

### Decision 3: D3 Force (Not React Flow) for Graph Layout

**Choice:** Build a custom React component with D3 force simulation. Do NOT use `@xyflow/react` for this feature.

**Why:**
- React Flow uses `@dagrejs/dagre` for layout, which produces rigid hierarchical DAG positioning. It is designed for flowcharts with connection handles.
- The AI landscape needs organic force-directed clustering where related concepts naturally gravitate together.
- React Flow's node model (handles, edges with source/target handles, edge types) is overhead for a concept map.
- The existing codebase uses React Flow correctly for its purpose (K8s manifests, Docker Compose, GitHub Actions). This is a different visualization paradigm.

### Decision 4: Static JSON Data (Not Runtime DOT Parsing)

**Choice:** Convert `public/images/ai_landscape.dot` to a JSON data file consumed by Astro's content collection. Do NOT add a DOT parser library.

**Why:**
- The DOT file (322 lines) is authored once and changes rarely. It is source data, not user input.
- DOT parser libraries (ts-graphviz ~15KB, dotparser ~8KB) add unnecessary runtime/build-time weight for a one-time conversion.
- JSON format can include fields DOT cannot: slugs, long descriptions, educational content, SEO metadata, related concept links.
- A simple build script (or even manual conversion) transforms the DOT structure into a clean JSON file.
- The JSON file integrates directly with Astro's `file()` content loader and Zod schema validation -- identical to the existing `techniques.json` and `distributions.json` pattern.
- Regex-based DOT parsing (as suggested by other research) is fragile. A one-time manual conversion with human review is more reliable for 80 nodes.

### Decision 5: Nanostores for Cross-Component State

**Choice:** Use nanostores (already installed) for selected node, panel state, and cluster filter.

**Why:**
- Already used in 22+ files across the codebase (stores for GHA validator, K8s analyzer, compose validator, category filters, tab state, etc.).
- Lightweight (~1KB). No new dependency.
- Works across Astro islands -- the graph component and side panel component can be separate React islands sharing state.
- `atom()` for simple values (selectedNodeId, isPanelOpen), `map()` if compound state is needed.

---

## Bundle Size Impact

| Category | Size (min+gz) | Notes |
|----------|---------------|-------|
| **New: d3-force** | ~5.5KB | Force simulation engine (includes d3-dispatch, d3-timer as shared deps) |
| **New: d3-quadtree** | ~3.5KB | Spatial indexing (transitive dep of d3-force) |
| **Total new JS added to project** | **~9KB** | Only modules not already in node_modules |
| Shared with xyflow: d3-zoom | ~3.5KB | Already loaded on pages with React Flow graphs |
| Shared with xyflow: d3-drag | ~1.5KB | Already loaded on pages with React Flow graphs |
| Shared: d3-selection | ~4.5KB | Already a direct dependency |
| Shared: d3-transition | ~4KB | Already loaded via d3-zoom |
| **Total graph component JS** | **~22KB** | When loaded on a fresh page (no xyflow overlap) |

**Context:** The existing EDA D3 micro-bundle is ~17KB for all distribution explorers. Adding ~9KB of new modules for force simulation is proportional and consistent with the project's micro-module strategy.

**Comparison:** The full `d3` package is ~280KB gzipped. We are using ~31KB total (existing + new) for the specific capabilities needed.

---

## D3 API Surface Required

### Imports from New Package (d3-force)

```typescript
import {
  forceSimulation,    // Create the simulation engine
  forceLink,          // Attraction along edges (keeps connected nodes close)
  forceManyBody,      // Repulsion between all nodes (prevents clumping)
  forceCenter,        // Gravity toward viewport center
  forceCollide,       // Prevent node overlap (radius-based)
  forceX,             // Pull nodes toward cluster X centroid
  forceY,             // Pull nodes toward cluster Y centroid
  type Simulation,
  type SimulationNodeDatum,
  type SimulationLinkDatum,
} from 'd3-force';
```

### Imports from Existing Packages (already installed)

```typescript
import { zoom, zoomIdentity, type ZoomBehavior, type ZoomTransform } from 'd3-zoom';
import { drag, type DragBehavior } from 'd3-drag';
import { select } from 'd3-selection';
import { transition } from 'd3-transition';   // side effect import for .transition() method
import { scaleOrdinal } from 'd3-scale';       // cluster color mapping
import { extent } from 'd3-array';             // viewport bounds for zoom-to-fit
```

### Force Configuration Pattern for Nested AI Clusters

The DOT file defines nested clusters: AI > ML > NN > DL > GenAI, plus separate clusters for Agentic AI, Dev Tools, Intelligence Levels. Each node belongs to a cluster, and `forceX`/`forceY` pull nodes toward their cluster centroid:

```typescript
// Cluster centroids (pre-defined or computed from initial positions)
const clusterCentroids: Record<string, { x: number; y: number }> = {
  'AI':        { x: 0,   y: 0   },
  'ML':        { x: 100, y: 0   },
  'NN':        { x: 200, y: 0   },
  'DL':        { x: 300, y: 0   },
  'GenAI':     { x: 400, y: 0   },
  'Agentic':   { x: 200, y: 200 },
  'DevTools':  { x: 400, y: 200 },
  'Levels':    { x: -100, y: 200 },
};

const simulation = forceSimulation(nodes)
  .force('link', forceLink(links).id(d => d.id).distance(60).strength(0.7))
  .force('charge', forceManyBody().strength(-200))
  .force('center', forceCenter(width / 2, height / 2))
  .force('collide', forceCollide().radius(d => nodeRadius(d) + 5))
  .force('clusterX', forceX<GraphNode>().x(d => clusterCentroids[d.cluster]?.x ?? 0).strength(0.15))
  .force('clusterY', forceY<GraphNode>().y(d => clusterCentroids[d.cluster]?.y ?? 0).strength(0.15))
  .on('tick', renderFrame);
```

---

## Content Collection Schema (New)

Following the established pattern from `src/lib/eda/schema.ts`:

```typescript
// src/lib/ai-landscape/schema.ts
import { z } from 'astro/zod';

export const aiConceptSchema = z.object({
  id: z.string(),                          // DOT node ID (e.g., "LLM", "CNN", "AgenticAI")
  slug: z.string(),                        // URL slug (e.g., "large-language-models")
  label: z.string(),                       // Display label (e.g., "Large Language Models (LLM)")
  cluster: z.string(),                     // Parent cluster ID (e.g., "GenAI", "DL", "Agentic")
  shape: z.enum(['ellipse', 'box']).default('box'),  // Node shape from DOT
  description: z.string(),                 // Short description (for side panel summary)
  longDescription: z.string(),             // Extended educational content (for individual page)
  examples: z.array(z.string()).default([]),         // Concrete examples (e.g., "GPT-4o", "Claude")
  relatedConcepts: z.array(z.string()).default([]),  // IDs of related nodes
  tags: z.array(z.string()).default([]),              // SEO tags
  isClusterRoot: z.boolean().default(false),          // True for AI_Node, ML_Node, etc.
});

export const aiEdgeSchema = z.object({
  source: z.string(),                     // Source node ID
  target: z.string(),                     // Target node ID
  label: z.string().optional(),           // Edge label (e.g., "subset of", "enables")
  style: z.enum(['solid', 'dashed', 'dotted']).default('solid'),
});

export type AIConcept = z.infer<typeof aiConceptSchema>;
export type AIEdge = z.infer<typeof aiEdgeSchema>;
```

Registration in `src/content.config.ts`:

```typescript
const aiConcepts = defineCollection({
  loader: file('src/data/ai-landscape/concepts.json'),
  schema: aiConceptSchema,
});

const aiEdges = defineCollection({
  loader: file('src/data/ai-landscape/edges.json'),
  schema: aiEdgeSchema,
});

export const collections = {
  // ...existing collections
  aiConcepts,
  aiEdges,
};
```

---

## Integration Pattern

Follows the established island architecture pattern from `DistributionExplorer.tsx` and `DeploymentTopology.tsx`:

1. **Astro page** (`src/pages/ai-landscape/index.astro`):
   - Renders static SEO content, heading, intro text at build time
   - Passes graph data (nodes + edges) as props to the React island
   - Includes JSON-LD structured data for the collection

2. **React island** (`src/components/ai-landscape/AILandscapeGraph.tsx`):
   - Hydrated with `client:visible` (graph loads when scrolled into view)
   - Uses `useRef<SVGSVGElement>` for D3 to render into
   - Uses `useEffect` to initialize force simulation, zoom, and drag
   - On node click: updates nanostores with selected node ID

3. **Side panel** (can be same React island or separate):
   - Reads selected node from nanostores via `useStore(selectedNode)`
   - Displays concept description, examples, related concepts
   - "Learn more" link to `/ai-landscape/[slug]/`

4. **Individual pages** (`src/pages/ai-landscape/[slug].astro`):
   - Generated via `getStaticPaths()` from content collection
   - Renders full educational content, related concepts, breadcrumbs
   - Includes SEO meta tags, JSON-LD DefinedTerm markup
   - Links back to main map with highlight parameter

---

## What NOT to Add

| Package | Why Avoid |
|---------|-----------|
| `d3` (full) | 280KB gzipped. Only 2 new micro-modules needed (~9KB). |
| `react-force-graph` | Canvas-based, loses SVG accessibility/CSS. 60KB+. Designed for 10K+ nodes. |
| `vis-network` / `vis.js` | 200KB+ full network library. Overkill for 80 educational nodes. |
| `sigma.js` | WebGL renderer for 10K+ nodes. Wrong performance tier. |
| `cytoscape.js` | 170KB graph theory library. We need visualization, not algorithms. |
| `@xyflow/react` (for this) | Dagre layout, not force-directed. Wrong paradigm (see Decision 3). |
| `ts-graphviz` / `dotparser` | Runtime/build-time DOT parsing. Convert to JSON once instead. |
| `d3-hierarchy` | For tree/treemap/sunburst layouts. Not needed for force-directed. |
| `graphology` | Graph algorithms library. No graph algorithms needed for static data visualization. |
| `framer-motion` | React animation library. D3 transitions + CSS transitions handle all graph animation needs. GSAP handles page-level animations. |

---

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| Force layout | d3-force (runtime) | Pre-computed positions at build time | Loses interactive simulation, drag-to-rearrange, organic settling animation |
| Graph rendering | D3 SVG in React | Canvas via d3-force + custom Canvas renderer | Loses CSS styling, accessibility, native click/hover events. Canvas is for 5000+ nodes. |
| Graph component | Custom D3+React | @xyflow/react (React Flow) | React Flow uses dagre DAG layout, not force-directed. Wrong paradigm for concept maps. |
| Graph component | Custom D3+React | react-force-graph (vasturiano) | Canvas/WebGL only, adds 60KB+, loses SVG benefits. Designed for very large graphs. |
| DOT conversion | Manual JSON conversion | ts-graphviz parser | Parser package deprecated (per npm). 322-line DOT file is trivial to convert manually with higher quality (add slugs, descriptions). |
| DOT conversion | Manual JSON conversion | dotparser (anvaka) | Adds build dependency for one-time conversion. Simple regex would work but manual is more reliable for 80 nodes. |
| State management | Nanostores | Zustand, Jotai | Nanostores already used in 22+ files. Adding a second state library creates unnecessary inconsistency. |
| Zoom/pan | d3-zoom | panzoom, react-zoom-pan-pinch | d3-zoom already installed (transitive dep), proven, integrates natively with d3-selection and d3-transition. |
| Animations | d3-transition + CSS | framer-motion | d3-transition handles zoom/pan animations; CSS handles hover states. No need for a third animation library alongside GSAP. |

---

## Confidence Assessment

| Decision | Confidence | Basis |
|----------|-----------|-------|
| d3-force ^3.0.0 is latest | HIGH | Verified against npm registry API (https://registry.npmjs.org/d3-force/latest). Version 3.0.0, stable for 5+ years. |
| d3-quadtree ^3.0.1 is latest | HIGH | Verified against npm registry API. |
| d3-zoom 3.0.0 already installed | HIGH | Verified via `npm ls d3-zoom` -- present as transitive dep of @xyflow/system. |
| d3-drag 3.0.0 already installed | HIGH | Verified via `npm ls d3-drag` -- present as transitive dep of @xyflow/system. |
| SVG over Canvas for 80 nodes | HIGH | Well-documented performance threshold. PMC study confirms SVG is performant for sub-1000 node graphs. |
| D3 force over React Flow | HIGH | Examined existing `DeploymentTopology.tsx` -- React Flow uses dagre for layout. Force-directed is a fundamentally different layout algorithm. |
| Runtime force (not build-time) | HIGH | Force simulation interactivity (drag, settle, organic layout) requires runtime computation. Build-time positions produce static layouts. |
| Static JSON over DOT parser | HIGH | Follows existing codebase pattern (EDA uses JSON files, not runtime parsed formats). DOT file is 322 lines, trivial to convert. |
| Nanostores for state | HIGH | 22+ existing usage sites in the codebase. Established convention. |
| client:visible hydration | HIGH | Used for DistributionExplorer, HookEventVisualizer, DeploymentTopology, and 10+ other interactive components. |
| Bundle size estimates | MEDIUM | Sizes estimated from minified dist files in node_modules and npm package metadata. Actual gzipped sizes may vary by +/-1KB depending on Vite tree-shaking. |

---

## Sources

- [npm registry: d3-force](https://www.npmjs.com/package/d3-force) -- Version 3.0.0 confirmed (fetched 2026-03-26)
- [npm registry: d3-zoom](https://www.npmjs.com/package/d3-zoom) -- Version 3.0.0 confirmed
- [npm registry: d3-drag](https://www.npmjs.com/package/d3-drag) -- Version 3.0.0 confirmed
- [npm registry: d3-quadtree](https://www.npmjs.com/package/d3-quadtree) -- Version 3.0.1 confirmed
- [npm registry: d3-transition](https://www.npmjs.com/package/d3-transition) -- Version 3.0.1 confirmed
- [D3 Force documentation](https://d3js.org/d3-force) -- API reference verified
- [Graph visualization efficiency study (PMC)](https://pmc.ncbi.nlm.nih.gov/articles/PMC12061801/) -- SVG vs Canvas vs WebGL benchmarks
- [D3 Force-Directed Graph in 2025](https://dev.to/nigelsilonero/how-to-implement-a-d3js-force-directed-graph-in-2025-5cl1) -- Implementation guidance
- [React + D3 Force Graphs with TypeScript](https://medium.com/@qdangdo/visualizing-connections-a-guide-to-react-d3-force-graphs-typescript-74b7af728c90) -- React integration pattern
- [Astro Islands Architecture](https://docs.astro.build/en/concepts/islands/) -- client:visible hydration docs
- [Bundlephobia: d3-force](https://bundlephobia.com/package/d3-force) -- Bundle size reference
- [Bundlephobia: d3-zoom](https://bundlephobia.com/package/d3-zoom) -- Bundle size reference
- Codebase analysis: `package.json`, `npm ls d3-zoom d3-drag`, `src/components/eda/DistributionExplorer.tsx`, `src/components/guide/DeploymentTopology.tsx`, `src/stores/categoryFilterStore.ts`, `src/content.config.ts`
