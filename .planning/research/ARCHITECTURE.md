# Architecture Research

**Domain:** Cloud Architecture Patterns visual encyclopedia integrated into existing Astro 5 portfolio site
**Researched:** 2026-03-01
**Confidence:** HIGH (based on direct analysis of all existing content sections, data models, SVG generators, React islands, and page patterns in the codebase)

## Standard Architecture

### System Overview

```
+-------------------------------------------------------------------+
|                        Astro Build Pipeline                        |
+-------------------------------------------------------------------+
|  src/data/cloud-patterns/                                         |
|  +----------------+    +------------------+                       |
|  | patterns.json  |    | categories.json  |                       |
|  +-------+--------+    +--------+---------+                       |
|          |                      |                                 |
+----------+----------------------+---------------------------------+
|                   Content Layer (Zod + Collections)               |
+-------------------------------------------------------------------+
|  src/lib/cloud-patterns/                                          |
|  +----------+  +-------------+  +-------------+  +--------------+|
|  | schema.ts|  |dimensions.ts|  |diagram-gen/ |  |decision-     ||
|  |          |  |             |  |(SVG builders)|  |  engine.ts   ||
|  +----+-----+  +------+------+  +------+------+  +------+-------+|
|       |               |                |                 |        |
+-------+---------------+----------------+-----------------+--------+
|                      Component Layer                              |
+-------------------------------------------------------------------+
|  src/components/cloud-patterns/                                   |
|  +-------------+  +--------------+  +-----------+  +------------+|
|  |PatternRadar |  |Architecture  |  |Decision   |  |PatternCard ||
|  |  Chart.astro|  | Diagram.astro|  |Filter.tsx |  | Grid.astro ||
|  +-------------+  +--------------+  +-----------+  +------------+|
|  +-------------+  +--------------+  +-----------+                 |
|  |PatternPage  |  |Comparison    |  |PatternJson|                 |
|  |  .astro     |  | Table.astro  |  |  Ld.astro |                 |
|  +-------------+  +--------------+  +-----------+                 |
+-------------------------------------------------------------------+
|                       Page Layer                                  |
+-------------------------------------------------------------------+
|  src/pages/cloud-patterns/                                        |
|  +----------+  +------------+  +-----------+                      |
|  |index.astro| |[slug].astro|  |compare/   |                      |
|  |(catalog)  | |(detail)    |  | index.astro|                      |
|  +----------+  +------------+  +-----------+                      |
+-------------------------------------------------------------------+
```

### Component Responsibilities

| Component | Responsibility | Type | New vs Modified |
|-----------|----------------|------|-----------------|
| `patterns.json` | Pattern data: scores, metadata, diagram node/edge definitions | Data file | **NEW** |
| `categories.json` | Pattern categories with descriptions and groupings | Data file | **NEW** |
| `schema.ts` | Zod schemas for pattern, category, diagram data | Lib | **NEW** |
| `dimensions.ts` | Scoring dimension metadata, colors, canonical ordering | Lib | **NEW** |
| `diagram-gen/` | Build-time SVG architecture diagram generators | Lib | **NEW** |
| `decision-engine.ts` | Scoring/filtering logic for pattern recommendations | Lib | **NEW** |
| `routes.ts` | URL helper functions for pattern and compare pages | Lib | **NEW** |
| `PatternRadarChart.astro` | 6-axis radar chart per pattern (reuses `radar-math.ts`) | Component | **NEW** (reuses existing lib) |
| `ArchitectureDiagram.astro` | Build-time SVG architecture diagram with CSS hover states | Component | **NEW** |
| `DecisionFilter.tsx` | React island for interactive category/use-case filtering | Component | **NEW** |
| `PatternCardGrid.astro` | Card grid for catalog page | Component | **NEW** |
| `PatternPage.astro` | Shared detail page wrapper (like `TechniquePage.astro`) | Component | **NEW** |
| `ComparisonTable.astro` | Side-by-side pattern comparison with scores | Component | **NEW** |
| `PatternJsonLd.astro` | JSON-LD structured data for patterns | Component | **NEW** |
| `PatternShareControls.astro` | Social sharing and radar chart download | Component | **NEW** |
| `CategoryBadge.astro` | Category label display component | Component | **NEW** |
| `PatternNav.astro` | Prev/next navigation between patterns | Component | **NEW** |
| `content.config.ts` | Add `cloudPatterns` and `cloudCategories` collections | Config | **MODIFIED** |
| `Header.astro` | Add "Cloud Patterns" nav link | Component | **MODIFIED** |
| `index.astro` (homepage) | Add cloud patterns callout card | Page | **MODIFIED** |
| `og-image.ts` | Add pattern OG image generator function | Lib | **MODIFIED** |
| `llms.txt.ts` / `llms-full.txt.ts` | Add cloud patterns section | Page | **MODIFIED** |

## Recommended Project Structure

```
src/
+-- content.config.ts              # MODIFIED: add 2 cloud pattern collections
+-- data/
|   +-- cloud-patterns/
|       +-- patterns.json          # 10-15 pattern entries with diagram data
|       +-- categories.json        # 4-6 category groupings
+-- lib/
|   +-- cloud-patterns/
|       +-- schema.ts              # Zod schemas: patternSchema, categorySchema
|       +-- dimensions.ts          # 6 scoring dimensions with colors and metadata
|       +-- decision-engine.ts     # Filter/score/rank patterns by requirements
|       +-- routes.ts              # URL helpers: patternUrl(), compareUrl()
|       +-- diagram-gen/
|           +-- diagram-base.ts    # Shared SVG primitives: boxes, arrows, clouds, cylinders
|           +-- layout-engine.ts   # Coordinate normalization for diagram nodes
|           +-- edge-renderer.ts   # Arrow/connection rendering with style variants
|           +-- index.ts           # Barrel export
+-- components/
|   +-- cloud-patterns/
|       +-- PatternRadarChart.astro    # Hexagonal radar (reuses radar-math)
|       +-- ArchitectureDiagram.astro  # Build-time SVG with CSS-driven interactivity
|       +-- PatternCardGrid.astro      # Filterable card grid
|       +-- PatternPage.astro          # Detail page wrapper component
|       +-- ComparisonTable.astro      # Score comparison table
|       +-- DecisionFilter.tsx         # React island: interactive filter
|       +-- PatternJsonLd.astro        # Structured data
|       +-- PatternShareControls.astro # Social share + radar download
|       +-- CategoryBadge.astro        # Category label component
|       +-- PatternNav.astro           # Prev/next navigation
+-- pages/
|   +-- cloud-patterns/
|       +-- index.astro            # Catalog page with hero, filter, card grid
|       +-- [slug].astro           # Pattern detail page via getStaticPaths
|       +-- compare/
|           +-- index.astro        # Comparison tool page
|   +-- open-graph/
|       +-- cloud-patterns.png.ts      # Overview OG image
|       +-- cloud-patterns/
|           +-- [slug].png.ts      # Per-pattern OG image
+-- stores/
    +-- patternFilterStore.ts      # Nanostore for category filtering
```

### Structure Rationale

- **`src/data/cloud-patterns/`:** Follows established JSON-per-section convention (same as `beauty-index/languages.json`, `db-compass/models.json`, `eda/techniques.json`). Two files separate concerns: pattern content and category taxonomy.
- **`src/lib/cloud-patterns/`:** Mirrors `lib/beauty-index/` and `lib/db-compass/` structure: schema + dimensions + math utilities. The `diagram-gen/` sub-directory follows the `lib/eda/svg-generators/` pattern but with architecture-specific primitives (boxes, cylinders, arrows instead of axes, bars, scatter points).
- **`src/components/cloud-patterns/`:** One directory per section is the established convention. Contains both Astro (build-time) and React (client-interactive) components, matching the existing island architecture.
- **`src/pages/cloud-patterns/`:** `index.astro` + `[slug].astro` is the exact pattern used by `beauty-index/`, `db-compass/`, and `eda/techniques/`. The `compare/` sub-route adds a decision-support tool.

## Architectural Patterns

### Pattern 1: JSON Data -> Zod Schema -> Content Collection -> Static Pages

**What:** All pattern data lives in JSON files validated by Zod schemas at build time. Astro content collections load them via `file()` loader, and pages use `getCollection()` + `getStaticPaths()` to generate static HTML.

**When to use:** Every piece of pattern content. This is the foundational data flow for the entire site.

**Trade-offs:** Build-time validation catches schema errors early; zero runtime cost. Adding a new pattern requires a JSON edit + rebuild, not a CMS update. This is intentional for a portfolio site.

**Example:**
```typescript
// src/lib/cloud-patterns/schema.ts
import { z } from 'astro/zod';

export const dimensionScoreSchema = z.number().int().min(1).max(10);

export const diagramNodeSchema = z.object({
  id: z.string(),
  label: z.string(),
  type: z.enum([
    'service', 'database', 'queue', 'cache',
    'gateway', 'client', 'cdn', 'function'
  ]),
  x: z.number().min(0).max(1),   // Normalized position
  y: z.number().min(0).max(1),   // Normalized position
  description: z.string(),       // Tooltip/hover text
});

export const diagramEdgeSchema = z.object({
  from: z.string(),              // Node ID
  to: z.string(),                // Node ID
  label: z.string().optional(),
  style: z.enum(['sync', 'async', 'event', 'data-flow']).default('sync'),
});

export const patternScoresSchema = z.object({
  scalability: dimensionScoreSchema,
  complexity: dimensionScoreSchema,
  reliability: dimensionScoreSchema,
  performance: dimensionScoreSchema,
  operationalCost: dimensionScoreSchema,
  flexibility: dimensionScoreSchema,
});

export const cloudPatternSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  category: z.string(),
  summary: z.string(),
  characterSketch: z.string(),
  scores: patternScoresSchema,
  justifications: z.object({
    scalability: z.string(),
    complexity: z.string(),
    reliability: z.string(),
    performance: z.string(),
    operationalCost: z.string(),
    flexibility: z.string(),
  }),
  diagram: z.object({
    nodes: z.array(diagramNodeSchema),
    edges: z.array(diagramEdgeSchema),
  }),
  strengths: z.array(z.string()).min(2).max(5),
  weaknesses: z.array(z.string()).min(2).max(5),
  bestFor: z.array(z.string()).min(2).max(6),
  avoidWhen: z.array(z.string()).min(1).max(4),
  relatedPatterns: z.array(z.string()).default([]),
  cloudServices: z.object({
    aws: z.array(z.string()).default([]),
    gcp: z.array(z.string()).default([]),
    azure: z.array(z.string()).default([]),
  }).default({ aws: [], gcp: [], azure: [] }),
  tags: z.array(z.string()).default([]),
});

export type CloudPattern = z.infer<typeof cloudPatternSchema>;
export type PatternScores = z.infer<typeof patternScoresSchema>;
export type DiagramNode = z.infer<typeof diagramNodeSchema>;
export type DiagramEdge = z.infer<typeof diagramEdgeSchema>;
```

```typescript
// src/content.config.ts -- additions
import { cloudPatternSchema, cloudCategorySchema } from './lib/cloud-patterns/schema';

const cloudPatterns = defineCollection({
  loader: file('src/data/cloud-patterns/patterns.json'),
  schema: cloudPatternSchema,
});

const cloudCategories = defineCollection({
  loader: file('src/data/cloud-patterns/categories.json'),
  schema: cloudCategorySchema,
});

export const collections = {
  blog, languages, dbModels, edaTechniques, edaDistributions, edaPages,
  cloudPatterns, cloudCategories,  // NEW
};
```

### Pattern 2: Build-Time SVG Architecture Diagrams with CSS-Driven Interactivity

**What:** Architecture diagrams are generated as SVG at build time from the `diagram.nodes` and `diagram.edges` data in each pattern's JSON. Interactivity (hover highlights, click tooltips) is handled entirely via CSS `:hover` pseudo-classes and the `:has()` selector on SVG group elements -- no JavaScript needed for basic hover effects.

**When to use:** Every pattern detail page has a unique architecture diagram. The data-driven approach means no hand-drawn SVGs -- the layout engine positions nodes based on normalized coordinates from the JSON data.

**Trade-offs:**
- PRO: Zero client JS for hover states. Consistent visual language across all patterns. Dark/light theme support via CSS custom properties (matching `plot-base.ts` PALETTE pattern). Build-time means no layout shift, fully crawlable by search engines.
- CON: Complex interactive behaviors (click-to-expand, animated data flow) would require upgrading to a React island. The initial implementation should stick to CSS-only interactivity and add a React island later only if needed.

**Example:**
```typescript
// src/lib/cloud-patterns/diagram-gen/diagram-base.ts
import { PALETTE } from '../../eda/svg-generators/plot-base';

/** Standard viewBox for all architecture diagrams */
export const DIAGRAM_CONFIG = {
  width: 700,
  height: 450,
  padding: 40,
  nodeWidth: 110,
  nodeHeight: 44,
  fontFamily: "'DM Sans', sans-serif",
  fontSize: 11,
} as const;

/** Render a service box (rounded rectangle) */
export function serviceBox(
  id: string, x: number, y: number,
  label: string, desc: string
): string {
  const hw = DIAGRAM_CONFIG.nodeWidth / 2;
  const hh = DIAGRAM_CONFIG.nodeHeight / 2;
  return `<g class="diagram-node" data-node-id="${id}" tabindex="0"
      role="button" aria-label="${label}: ${desc}">
    <rect x="${(x - hw).toFixed(1)}" y="${(y - hh).toFixed(1)}"
      width="${DIAGRAM_CONFIG.nodeWidth}" height="${DIAGRAM_CONFIG.nodeHeight}"
      rx="6" fill="${PALETTE.surface}" stroke="${PALETTE.dataPrimary}"
      stroke-width="1.5" />
    <text x="${x.toFixed(1)}" y="${(y + 4).toFixed(1)}" text-anchor="middle"
      font-size="${DIAGRAM_CONFIG.fontSize}" fill="${PALETTE.text}"
      font-family="${DIAGRAM_CONFIG.fontFamily}">${label}</text>
    <title>${desc}</title>
  </g>`;
}

/** Render a database cylinder */
export function databaseCylinder(
  id: string, x: number, y: number,
  label: string, desc: string
): string {
  const w = 90, h = 44, ry = 8;
  return `<g class="diagram-node" data-node-id="${id}" tabindex="0"
      role="button" aria-label="${label}: ${desc}">
    <ellipse cx="${x}" cy="${(y - h/2 + ry).toFixed(1)}" rx="${w/2}" ry="${ry}"
      fill="${PALETTE.surface}" stroke="${PALETTE.dataSecondary}"
      stroke-width="1.5" />
    <rect x="${(x - w/2).toFixed(1)}" y="${(y - h/2 + ry).toFixed(1)}"
      width="${w}" height="${(h - ry).toFixed(1)}"
      fill="${PALETTE.surface}" stroke="${PALETTE.dataSecondary}"
      stroke-width="1.5" />
    <ellipse cx="${x}" cy="${(y + h/2).toFixed(1)}" rx="${w/2}" ry="${ry}"
      fill="${PALETTE.surface}" stroke="${PALETTE.dataSecondary}"
      stroke-width="1.5" />
    <text x="${x}" y="${(y + 5).toFixed(1)}" text-anchor="middle"
      font-size="${DIAGRAM_CONFIG.fontSize}" fill="${PALETTE.text}"
      font-family="${DIAGRAM_CONFIG.fontFamily}">${label}</text>
    <title>${desc}</title>
  </g>`;
}

// Additional node type renderers: queueParallelogram(), cacheBox(),
// gatewayTrapezoid(), clientIcon(), cdnCloud(), functionBadge()
```

```typescript
// src/lib/cloud-patterns/diagram-gen/layout-engine.ts
import type { DiagramNode, DiagramEdge } from '../schema';
import { DIAGRAM_CONFIG } from './diagram-base';

/** Convert normalized 0-1 positions to pixel coordinates within the viewBox */
export function resolvePositions(
  nodes: DiagramNode[]
): Map<string, { x: number; y: number }> {
  const { width, height, padding } = DIAGRAM_CONFIG;
  const usableW = width - padding * 2;
  const usableH = height - padding * 2;

  const positions = new Map<string, { x: number; y: number }>();
  for (const node of nodes) {
    positions.set(node.id, {
      x: padding + node.x * usableW,
      y: padding + node.y * usableH,
    });
  }
  return positions;
}
```

### Pattern 3: React Islands with Nanostores for Client Interactivity

**What:** Interactive filtering (by category, use case, cloud provider) uses a React island component hydrated with `client:load` or `client:visible`. State is managed via nanostores (the same pattern as `compassFilterStore.ts` and `categoryFilterStore.ts`). The React component manipulates DOM visibility via `data-*` attributes on server-rendered elements.

**When to use:** The catalog page filter bar and the comparison tool picker. NOT for hover effects on diagrams (those use CSS).

**Trade-offs:**
- PRO: Minimal JS payload. Nanostore atom is ~300 bytes. React island only loads for the filter component, not the entire page. Server-rendered cards remain in the DOM for SEO.
- CON: The DOM-manipulation pattern (toggling `display: none`) is slightly unconventional but proven in this codebase across three sections (beauty-index `LanguageFilter.tsx`, db-compass `UseCaseFilter.tsx`, eda `CategoryFilter.tsx`).

**Example:**
```typescript
// src/stores/patternFilterStore.ts
import { atom } from 'nanostores';

/** Currently active category filter. 'all' shows everything. */
export const activePatternCategory = atom<string>('all');

/** Set the active category */
export function setPatternCategory(cat: string) {
  activePatternCategory.set(cat);
}
```

```tsx
// src/components/cloud-patterns/DecisionFilter.tsx
import { useState, useEffect } from 'react';
import { activePatternCategory, setPatternCategory }
  from '../../stores/patternFilterStore';

interface Props {
  categories: { id: string; label: string; count: number }[];
}

export default function DecisionFilter({ categories }: Props) {
  const [active, setActive] = useState<string>('all');

  useEffect(() => {
    const unsub = activePatternCategory.subscribe((val) => setActive(val));
    return unsub;
  }, []);

  useEffect(() => {
    document.querySelectorAll<HTMLElement>('[data-pattern-category]')
      .forEach((el) => {
        el.style.display =
          active === 'all' || el.dataset.patternCategory === active
            ? '' : 'none';
      });
  }, [active]);

  const total = categories.reduce((s, c) => s + c.count, 0);

  return (
    <div className="flex flex-wrap gap-2 mb-8">
      {[{ id: 'all', label: 'All', count: total }, ...categories]
        .map((cat) => (
          <button
            key={cat.id}
            onClick={() => setPatternCategory(cat.id)}
            aria-pressed={active === cat.id}
            className={`px-4 py-1.5 rounded-full text-sm border
              transition-all cursor-pointer ${
              active === cat.id
                ? 'border-[var(--color-accent)] text-[var(--color-accent)] font-medium'
                : 'border-[var(--color-border)] text-[var(--color-text-secondary)]'
            }`}
          >
            {cat.label} ({cat.count})
          </button>
        ))}
    </div>
  );
}
```

### Pattern 4: Radar Chart Reuse via radar-math.ts

**What:** The existing `lib/beauty-index/radar-math.ts` provides pure math functions (`polarToCartesian`, `radarPolygonPoints`, `hexagonRingPoints`) that work with any number of axes. The `PatternRadarChart.astro` component imports these directly and renders a 6-axis hexagonal chart for cloud pattern scores, identical in mechanics to `CompassRadarChart.astro` (8-axis octagonal).

**When to use:** Pattern detail pages and comparison views.

**Trade-offs:** Zero new math code needed. The functions are already proven across 40+ language pages and 12 database model pages. Ships zero client-side JavaScript.

**Example:**
```astro
---
// src/components/cloud-patterns/PatternRadarChart.astro
import { polarToCartesian, radarPolygonPoints, hexagonRingPoints }
  from '../../lib/beauty-index/radar-math';
import { DIMENSIONS, DIMENSION_COLORS } from '../../lib/cloud-patterns/dimensions';
import { type CloudPattern } from '../../lib/cloud-patterns/schema';

interface Props {
  pattern: CloudPattern;
  size?: number;
}

const { pattern, size = 300 } = Astro.props;
const pad = 28;
const vbSize = size + pad * 2;
const cx = vbSize / 2;
const cy = vbSize / 2;
const maxRadius = size * 0.42;

// Extract scores in canonical dimension order
const scores = DIMENSIONS.map((dim) => pattern.scores[dim.key]);
const numAxes = DIMENSIONS.length; // 6
const angleStep = (2 * Math.PI) / numAxes;
const polygonPoints = radarPolygonPoints(cx, cy, maxRadius, scores, 10);
const gridLevels = [2, 4, 6, 8, 10];
const accentColor = '#c44b20';
---

<div class="w-full max-w-[300px]">
  <svg width={size} height={size} viewBox={`0 0 ${vbSize} ${vbSize}`}
    xmlns="http://www.w3.org/2000/svg" role="img"
    aria-label={`Radar chart for ${pattern.name} pattern`}>
    {/* Grid rings, axis lines, data polygon, labels -- same structure
        as CompassRadarChart.astro */}
  </svg>
</div>
```

## Data Flow

### Build-Time Content Flow

```
patterns.json
    |
    v
content.config.ts (Zod validation via cloudPatternSchema)
    |
    v
getCollection('cloudPatterns')
    |
    +---> index.astro (catalog page)
    |       |
    |       +---> PatternCardGrid.astro (cards with data-pattern-category attrs)
    |       +---> DecisionFilter.tsx (client:load -- nanostore filter)
    |
    +---> [slug].astro (detail page via getStaticPaths)
            |
            +---> PatternRadarChart.astro (build-time SVG via radar-math.ts)
            +---> ArchitectureDiagram.astro (build-time SVG from diagram data)
            +---> Score breakdown, strengths/weaknesses, related patterns
            +---> PatternShareControls.astro (share + download)
```

### Diagram Generation Flow

```
pattern.diagram.nodes + pattern.diagram.edges  (from validated JSON)
    |
    v
layout-engine.ts  (normalize 0-1 positions to pixel coords within viewBox)
    |
    v
diagram-base.ts  (render each node by type: serviceBox, databaseCylinder...)
    |
    v
edge-renderer.ts  (draw arrows between nodes with style-based stroke patterns)
    |
    v
ArchitectureDiagram.astro  (assemble into <svg> with CSS hover rules + <style>)
    |
    v
Static HTML with embedded SVG  (zero JS, CSS-only interactivity)
```

### Interactive Diagram Flow (CSS-Only)

```
User hovers over SVG <g class="diagram-node">
    |
    v
CSS :hover rule highlights node + connected edges
    |
    +---> .diagram-node:hover rect { stroke-width: 2.5; stroke: var(--color-accent) }
    +---> :has(.diagram-node:hover) dims non-hovered nodes
    |
    v
<title> element provides native browser tooltip
```

### Key Data Flows

1. **Pattern catalog rendering:** `patterns.json` -> Zod validation -> `getCollection()` -> sort/group by category -> render `PatternCardGrid.astro` with `data-pattern-category` attributes -> `DecisionFilter.tsx` island toggles visibility at runtime.

2. **Pattern detail rendering:** `[slug].astro` uses `getStaticPaths()` to generate one page per pattern. Each page renders the radar chart (reusing `radar-math.ts`), the architecture diagram (from `diagram.nodes`/`diagram.edges`), score breakdowns, and contextual content -- matching the `db-compass/[slug].astro` structure.

3. **OG image generation:** `open-graph/cloud-patterns/[slug].png.ts` calls a new `generatePatternOgImage()` function in `lib/og-image.ts` that renders a simplified diagram + radar chart via Satori -> Sharp, following the `generateCompassModelOgImage()` pattern exactly.

4. **Radar chart reuse:** The existing `radar-math.ts` functions are framework-agnostic and axis-count-agnostic. The new `PatternRadarChart.astro` mirrors `CompassRadarChart.astro` but with 6 dimensions and cloud-pattern-specific colors.

## Integration Points

### Existing Components to Modify

| File | Change | Scope |
|------|--------|-------|
| `src/content.config.ts` | Add `cloudPatterns` and `cloudCategories` collection definitions | ~15 lines |
| `src/components/Header.astro` | Add `{ href: '/cloud-patterns/', label: 'Cloud Patterns' }` to `navLinks` array | 1 line |
| `src/pages/index.astro` | Add callout card for Cloud Patterns (matching beauty-index/db-compass/eda card pattern) | ~25 lines |
| `src/lib/og-image.ts` | Add `generatePatternOgImage()` function following existing `generateCompassModelOgImage()` | ~50 lines |
| `src/pages/llms.txt.ts` | Add cloud patterns summary section | ~20 lines |
| `src/pages/llms-full.txt.ts` | Add cloud patterns full content section | ~30 lines |

### Existing Libraries to Reuse (NOT Modify)

| Library | Reuse For | Import Pattern |
|---------|-----------|----------------|
| `lib/beauty-index/radar-math.ts` | `polarToCartesian()`, `radarPolygonPoints()`, `hexagonRingPoints()` for 6-axis radar | Direct import, no changes needed |
| `lib/eda/svg-generators/plot-base.ts` | `PALETTE` object for CSS custom property colors in diagrams | Direct import for consistent theming |
| `layouts/Layout.astro` | Page wrapper with SEO, analytics, view transitions, animations | Standard usage via prop pass-through |
| `components/BreadcrumbJsonLd.astro` | Breadcrumb structured data on all pages | Standard usage |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| `patterns.json` <-> `schema.ts` | Zod `file()` loader validates at build time | Schema errors fail the build -- intentional |
| `schema.ts` <-> `diagram-gen/` | Typed `DiagramNode[]` and `DiagramEdge[]` from schema | diagram-gen consumes validated data only |
| `diagram-gen/` <-> `ArchitectureDiagram.astro` | Returns SVG string, Astro renders via `set:html` | Same pattern as EDA's `PlotFigure.astro` using `set:html` |
| `DecisionFilter.tsx` <-> server-rendered cards | `data-pattern-category` attributes on DOM elements | Same pattern as `CategoryFilter.tsx` in EDA, `UseCaseFilter.tsx` in DB Compass |
| `PatternRadarChart.astro` <-> `radar-math.ts` | Function imports only, no shared state | Proven stable across beauty-index + db-compass |

## Diagram Generation Architecture (Deep Dive)

### Approach: Data-Driven from JSON, Not Hardcoded SVGs

Each pattern's JSON entry contains a `diagram` object with `nodes` (positioned service components) and `edges` (connections between them). The build-time generator converts this declarative data into an SVG string.

**Why data-driven (not hand-drawn):**
1. Consistent visual language across 10-15 patterns
2. Automatic dark/light theme support via CSS custom properties
3. CSS-driven hover interactivity without per-diagram custom code
4. Easy to add new patterns without SVG editing tools
5. OG images can reuse the same generator with simplified options

### Node Types and Visual Representations

| Node Type | SVG Shape | Visual Metaphor |
|-----------|-----------|-----------------|
| `service` | Rounded rectangle | Microservice / API |
| `database` | Cylinder (ellipse + rect) | Persistent storage |
| `queue` | Parallelogram | Message queue / event bus |
| `cache` | Dashed-border rectangle | In-memory cache |
| `gateway` | Trapezoid | API gateway / load balancer |
| `client` | Monitor icon | End user / browser |
| `cdn` | Cloud shape | Content delivery |
| `function` | Lightning bolt badge | Serverless function |

### Edge Styles

| Style | SVG Stroke | Meaning |
|-------|------------|---------|
| `sync` | Solid line, filled arrowhead | Synchronous request/response |
| `async` | Dashed line, open arrowhead | Asynchronous message |
| `event` | Dotted line, diamond arrowhead | Event-driven / pub-sub |
| `data-flow` | Thick translucent line | Bulk data flow / ETL |

### CSS Hover Approach (No JavaScript)

```css
/* In ArchitectureDiagram.astro <style> block */
.diagram-node {
  cursor: pointer;
  transition: all 0.15s ease;
}

.diagram-node:hover rect,
.diagram-node:hover ellipse {
  stroke-width: 2.5;
  stroke: var(--color-accent);
}

.diagram-node:focus-visible rect,
.diagram-node:focus-visible ellipse {
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
}

/* Edge highlighting via :has() -- dim non-hovered nodes */
.diagram-svg:has(.diagram-node:hover) .diagram-node:not(:hover) {
  opacity: 0.4;
  transition: opacity 0.15s ease;
}

/* Highlight edges connected to hovered node.
   Each edge has data-from and data-to attributes.
   CSS :has() enables connected-edge highlighting. */
.diagram-svg:has(.diagram-node[data-node-id="api-gw"]:hover)
  .diagram-edge[data-from="api-gw"],
.diagram-svg:has(.diagram-node[data-node-id="api-gw"]:hover)
  .diagram-edge[data-to="api-gw"] {
  stroke: var(--color-accent);
  stroke-opacity: 1;
}

/* NOTE: The per-node-id rules above would need to be generated
   at build time for each diagram. Alternative: use a small
   inline <script> for edge highlighting instead of CSS :has()
   with dynamic selectors. See "Upgrade Path" below. */
```

**Note on CSS `:has()` support:** Supported in Chrome 105+, Safari 15.4+, Firefox 121+. For the portfolio site's target audience (developers, recruiters), this coverage is sufficient. The diagram is fully readable without hover effects as graceful degradation.

**Practical edge-highlighting approach:** Rather than generating per-node CSS rules at build time, use a tiny inline `<script>` (~20 lines) that adds/removes a CSS class on connected edges when a node is hovered. This is more maintainable than generating unique CSS selectors per diagram per node:

```astro
<!-- In ArchitectureDiagram.astro -->
<script>
  function initDiagramHover() {
    const svg = document.querySelector('.diagram-svg');
    if (!svg) return;

    svg.querySelectorAll('.diagram-node').forEach((node) => {
      const id = node.getAttribute('data-node-id');
      node.addEventListener('mouseenter', () => {
        svg.classList.add('has-hover');
        svg.querySelectorAll(
          `.diagram-edge[data-from="${id}"], .diagram-edge[data-to="${id}"]`
        ).forEach(e => e.classList.add('edge-active'));
      });
      node.addEventListener('mouseleave', () => {
        svg.classList.remove('has-hover');
        svg.querySelectorAll('.edge-active')
          .forEach(e => e.classList.remove('edge-active'));
      });
    });
  }
  document.addEventListener('astro:page-load', initDiagramHover);
</script>
```

This is ~20 lines of JS, adds zero framework dependencies, and handles the edge highlighting that pure CSS cannot do dynamically. The node dimming on hover still uses the CSS `:has()` approach shown above.

### Accessibility for Diagrams

- Each `<g class="diagram-node">` has `tabindex="0"` and `role="button"` with `aria-label="[label]: [description]"`
- `<title>` elements provide native tooltips on hover/focus
- A `<details>` block below the SVG provides a text-based "Architecture Description" for screen readers, listing all components and their connections in prose form
- Edge labels use `<text>` elements readable by screen readers

## Scoring Dimensions for Cloud Patterns

Following the established 1-10 scale pattern from Beauty Index (6 axes) and DB Compass (8 axes), Cloud Patterns uses 6 dimensions:

| Dimension | Key | Color | Measures |
|-----------|-----|-------|----------|
| Scalability | `scalability` | `#4A90D9` (blue) | How well the pattern handles growth in load and data |
| Complexity | `complexity` | `#E8734A` (coral) | Implementation and operational complexity (inverted: 10 = simple) |
| Reliability | `reliability` | `#2AAA8A` (teal) | Fault tolerance, recovery, and availability guarantees |
| Performance | `performance` | `#8FBC5A` (green) | Latency and throughput characteristics |
| Operational Cost | `operationalCost` | `#7B68EE` (purple) | Infrastructure and maintenance cost efficiency (10 = cheap) |
| Flexibility | `flexibility` | `#D4A843` (gold) | Ease of modification, technology swapping, and evolution |

**Why 6 dimensions (not 8):** Six axes produce a clean hexagonal radar chart. The Beauty Index already validates this axis count works visually. Eight would work (DB Compass proves it) but six keeps the comparison simpler for architectural patterns where dimensions are inherently fuzzier than database benchmarks.

**dimensions.ts structure:**
```typescript
// src/lib/cloud-patterns/dimensions.ts
import type { PatternScores } from './schema';

export const DIMENSION_COLORS: Record<keyof PatternScores, string> = {
  scalability: '#4A90D9',
  complexity: '#E8734A',
  reliability: '#2AAA8A',
  performance: '#8FBC5A',
  operationalCost: '#7B68EE',
  flexibility: '#D4A843',
};

export interface Dimension {
  key: keyof PatternScores;
  symbol: string;
  name: string;
  shortName: string;
  description: string;
}

export const DIMENSIONS: Dimension[] = [
  {
    key: 'scalability',
    symbol: '\u2191',       // Up arrow
    name: 'Scalability',
    shortName: 'Scale',
    description: 'How well the pattern handles growing load and data volume.',
  },
  {
    key: 'complexity',
    symbol: '\u2699',       // Gear
    name: 'Complexity',
    shortName: 'Complex',
    description: 'Implementation and operational complexity. 10 = simple to build and run.',
  },
  {
    key: 'reliability',
    symbol: '\u2693',       // Anchor
    name: 'Reliability',
    shortName: 'Rely',
    description: 'Fault tolerance, self-healing, and availability guarantees.',
  },
  {
    key: 'performance',
    symbol: '\u26A1',       // Lightning
    name: 'Performance',
    shortName: 'Perf',
    description: 'Latency characteristics and throughput under load.',
  },
  {
    key: 'operationalCost',
    symbol: '\u2605',       // Star
    name: 'Operational Cost',
    shortName: 'Cost',
    description: 'Infrastructure and maintenance cost efficiency. 10 = cheap to run.',
  },
  {
    key: 'flexibility',
    symbol: '\u29C9',       // Two joined squares
    name: 'Flexibility',
    shortName: 'Flex',
    description: 'Ease of modification, technology swapping, and architectural evolution.',
  },
];
```

## Page Structure: Detail Page ([slug].astro)

Following the proven `db-compass/[slug].astro` structure:

```
Back to Cloud Patterns (link)

Header
  h1: Pattern Name
  Category badge
  Total score / 60

Architecture Diagram (build-time SVG)
  + text-based description in <details> for accessibility

Radar Chart (build-time SVG, hexagonal)

Score Breakdown (dimension bars with colors)

Share Controls (social share + radar download)

Character Sketch (prose personality description)

When to Use (checkmark list)

Avoid When (X-mark list)

Dimension Analysis (per-dimension justification)

Cloud Services (AWS / GCP / Azure service mappings)

Related Patterns (pill links)

Prev/Next Navigation
```

## Comparison Page Architecture

The comparison page (`/cloud-patterns/compare/`) is a new feature type for this codebase. It presents 2-3 patterns side-by-side with overlaid radar charts and a score comparison table.

**State management:** A React island (`ComparisonPicker.tsx`) manages the selected patterns via a nanostore. The comparison view is rendered client-side because the combination of patterns is user-chosen.

```typescript
// src/stores/comparisonStore.ts
import { atom } from 'nanostores';

/** Array of selected pattern slugs for comparison (max 3) */
export const selectedPatterns = atom<string[]>([]);

export function addPattern(slug: string) {
  const current = selectedPatterns.get();
  if (current.length < 3 && !current.includes(slug)) {
    selectedPatterns.set([...current, slug]);
  }
}

export function removePattern(slug: string) {
  selectedPatterns.set(selectedPatterns.get().filter(s => s !== slug));
}
```

**Implementation approach:** Pass all pattern data as a serialized JSON prop to the React island. The island renders the comparison table and overlaid radar chart client-side based on the selected patterns. This avoids generating N-choose-3 static pages.

## Anti-Patterns

### Anti-Pattern 1: Hardcoded SVG Diagrams Per Pattern

**What people do:** Create each architecture diagram as a hand-drawn SVG file in `public/images/`, then reference it with `<img>`.
**Why it's wrong:** No dark/light theme support. No hover interactivity. No consistent visual language. Adding a pattern requires SVG editing tools. OG images can't reuse the same diagram logic.
**Do this instead:** Data-driven SVG generation from JSON node/edge definitions using TypeScript generators, following the exact pattern established by the 20+ EDA SVG generators.

### Anti-Pattern 2: Using D3 or a React Diagramming Library for Architecture Diagrams

**What people do:** Bring in D3.js force-directed layouts or React Flow / Mermaid for interactive diagrams.
**Why it's wrong:** Massively increases client JS bundle for what should be a static visualization. D3 force layouts produce unpredictable positions that change on each render. The site's build-time SVG pattern is proven and performant.
**Do this instead:** Fixed node positions defined in JSON (the architect curates the layout), rendered to SVG at build time. CSS and a tiny inline script handle hover states.

### Anti-Pattern 3: Separate JSON Files per Pattern

**What people do:** Create individual JSON files per pattern (e.g., `cqrs.json`, `event-sourcing.json`).
**Why it's wrong:** Breaks the established single-file-per-collection convention. The beauty-index, db-compass, and eda-techniques collections each use ONE JSON array file. This keeps the content collection loader simple and enables cross-pattern operations (sorting, filtering, comparison) without loading multiple files.
**Do this instead:** One `patterns.json` file with all 10-15 patterns. At roughly 200 lines per pattern entry (including diagram data), this is around 2000-3000 lines -- large but manageable and consistent with the site's conventions.

### Anti-Pattern 4: Client-Side Diagram Rendering

**What people do:** Pass raw JSON node/edge data to a client-side component that renders the diagram at runtime.
**Why it's wrong:** Causes layout shift, wastes client CPU, and the diagram cannot be crawled by search engines.
**Do this instead:** Generate the complete SVG at build time. The `set:html` directive injects it directly into the page. Zero layout shift, instant render, fully crawlable.

### Anti-Pattern 5: Creating a New Layout Component

**What people do:** Create a `CloudPatternsLayout.astro` to wrap pattern pages.
**Why it's wrong:** The existing `Layout.astro` handles all the base functionality (SEO, analytics, view transitions, header/footer). The `EDALayout.astro` exists only because it needed KaTeX CSS injection -- a specific requirement that cloud patterns do not have.
**Do this instead:** Use `Layout.astro` directly, passing title, description, ogImage props. Create a `PatternPage.astro` component (not layout) for the shared detail page structure, matching how `TechniquePage.astro` works -- it wraps `EDALayout` but is used as a component, not a layout.

## Suggested Build Order

The build order respects dependencies and follows the established pattern of "data model first, then rendering, then integration."

### Phase 1: Data Foundation
1. `src/lib/cloud-patterns/schema.ts` -- Zod schemas for patterns and categories
2. `src/lib/cloud-patterns/dimensions.ts` -- Scoring dimension metadata and colors
3. `src/data/cloud-patterns/patterns.json` -- Start with 3-4 patterns, full schema
4. `src/data/cloud-patterns/categories.json` -- Category definitions
5. `src/content.config.ts` -- Add new collections

**Rationale:** Everything downstream depends on the data model. Getting the schema right first prevents rework. Starting with 3-4 patterns validates the schema before committing to 10-15.

### Phase 2: Radar Charts and Core Components
6. `src/lib/cloud-patterns/routes.ts` -- URL helpers
7. `src/components/cloud-patterns/PatternRadarChart.astro` -- Reuse radar-math.ts
8. `src/components/cloud-patterns/CategoryBadge.astro` -- Simple display component
9. `src/components/cloud-patterns/PatternNav.astro` -- Prev/next navigation
10. `src/components/cloud-patterns/PatternPage.astro` -- Detail page wrapper
11. `src/pages/cloud-patterns/[slug].astro` -- Detail pages (initially without diagrams)

**Rationale:** Radar charts reuse proven math. Getting detail pages working early provides a testable end-to-end flow even before diagrams are ready.

### Phase 3: Architecture Diagrams
12. `src/lib/cloud-patterns/diagram-gen/diagram-base.ts` -- Node shape SVG primitives
13. `src/lib/cloud-patterns/diagram-gen/edge-renderer.ts` -- Arrow/connection rendering
14. `src/lib/cloud-patterns/diagram-gen/layout-engine.ts` -- Coordinate normalization
15. `src/lib/cloud-patterns/diagram-gen/index.ts` -- Barrel export
16. `src/components/cloud-patterns/ArchitectureDiagram.astro` -- Diagram component with CSS hover + inline script
17. Update `[slug].astro` to include the diagram component

**Rationale:** Diagram generation is the highest-complexity new work. Isolating it in Phase 3 means the rest of the section works even if diagram rendering takes longer to perfect.

### Phase 4: Catalog and Filtering
18. `src/components/cloud-patterns/PatternCardGrid.astro` -- Card grid with data attributes
19. `src/stores/patternFilterStore.ts` -- Nanostore for category filtering
20. `src/components/cloud-patterns/DecisionFilter.tsx` -- React island filter
21. `src/pages/cloud-patterns/index.astro` -- Catalog page with hero, filter, grid

**Rationale:** The catalog page depends on having enough patterns (from Phase 1) and card components. Filter follows the proven nanostore pattern.

### Phase 5: Integration and Polish
22. `src/components/Header.astro` -- Add nav link
23. `src/pages/index.astro` -- Add homepage callout card
24. `src/components/cloud-patterns/PatternJsonLd.astro` -- Structured data
25. `src/components/cloud-patterns/PatternShareControls.astro` -- Social sharing
26. `src/components/cloud-patterns/ComparisonTable.astro` -- Side-by-side comparison
27. `src/pages/cloud-patterns/compare/index.astro` -- Comparison page
28. `src/pages/open-graph/cloud-patterns.png.ts` -- Overview OG image
29. `src/pages/open-graph/cloud-patterns/[slug].png.ts` -- Per-pattern OG images
30. Update `llms.txt.ts` and `llms-full.txt.ts` -- LLM-friendly content
31. Expand `patterns.json` to full 10-15 patterns

**Rationale:** Integration touches (header, homepage, SEO) come last because they depend on everything else working. The comparison page and sharing features are incremental additions.

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| 10-15 patterns | Current architecture handles this perfectly. Single JSON file, build-time generation. |
| 30-50 patterns | Consider splitting `patterns.json` into per-category files with separate loaders. Add pagination on catalog page. |
| 100+ patterns | Not anticipated for this portfolio site. If reached, consider a headless CMS with Astro content layer adapters. |

### Build Performance

- 15 patterns x (1 detail page + 1 OG image + 1 diagram SVG) = ~45 generated outputs. Trivial for Astro's build pipeline.
- The EDA section already generates 90+ pages with 20+ SVG generator types. The cloud patterns section is smaller in scope and will not impact build times noticeably.

## Sources

- Astro Content Collections API: verified via direct analysis of `src/content.config.ts` (5 existing collections using `file()` and `glob()` loaders)
- Radar math library: `src/lib/beauty-index/radar-math.ts` -- verified axis-count-agnostic, pure functions, zero framework dependencies
- SVG generation pattern: `src/lib/eda/svg-generators/plot-base.ts` -- PALETTE, svgOpen, CSS custom property theming
- Page structure pattern: `src/pages/db-compass/[slug].astro` -- getStaticPaths, getCollection, prev/next nav, JSON-LD
- React island pattern: `src/components/db-compass/UseCaseFilter.tsx`, `src/components/eda/CategoryFilter.tsx` -- nanostore subscription, DOM visibility toggling
- Nanostore pattern: `src/stores/compassFilterStore.ts`, `src/stores/categoryFilterStore.ts` -- atom-based state
- OG image generation: `src/pages/open-graph/db-compass/[slug].png.ts` -- getStaticPaths + generateCompassModelOgImage
- CSS `:has()` browser support: baseline widely available since December 2023 per web platform baseline data

---
*Architecture research for: Cloud Architecture Patterns visual encyclopedia*
*Researched: 2026-03-01*
