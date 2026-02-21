# Architecture: Database Compass Integration

**Domain:** Interactive database model explorer integrated into existing Astro 5 portfolio site
**Researched:** 2026-02-21
**Confidence:** HIGH -- based on direct codebase analysis of existing Beauty Index and Dockerfile Analyzer patterns, verified Astro 5 content collections API, and existing radar-math.ts source code

---

## System Overview

```
Existing Site Layer (unchanged)
  ├── Layout.astro, Header.astro, Footer.astro, SEOHead.astro
  ├── Content Collections: blog (glob), languages (file)
  └── OG Image Pipeline: Satori + Sharp in src/lib/og-image.ts

NEW: Database Compass Layer
  ├── Content Collection: dbModels (file loader, single JSON)
  ├── Zod Schema: src/lib/db-compass/schema.ts
  ├── Visualization Lib: src/lib/db-compass/
  │   ├── spectrum-math.ts        (NEW: complexity spectrum SVG math)
  │   └── compass-dimensions.ts   (NEW: 8 dimension metadata)
  ├── Components: src/components/db-compass/
  │   ├── ComplexitySpectrum.astro (NEW: horizontal spectrum SVG)
  │   ├── ModelGrid.astro         (NEW: category card grid)
  │   ├── CompassRadarChart.astro (NEW: 8-axis radar, reuses radar-math.ts)
  │   ├── CompassScoringTable.astro (NEW: 12-model scoring table)
  │   ├── TradeoffPanel.astro     (NEW: strengths/weaknesses per model)
  │   ├── TopDatabases.astro      (NEW: database examples per model)
  │   └── ModelNav.astro          (NEW: prev/next navigation)
  ├── Pages: src/pages/db-compass/
  │   ├── index.astro             (overview: spectrum + grid + table)
  │   └── [slug].astro            (12 detail pages via getStaticPaths)
  ├── JSON-LD: src/components/DbCompassJsonLd.astro
  ├── OG Images: src/pages/open-graph/db-compass/
  │   ├── index.png.ts            (overview OG)
  │   └── [slug].png.ts           (per-model OG)
  └── Integration Points:
      ├── src/content.config.ts   (MODIFY: add dbModels collection)
      ├── src/pages/index.astro   (MODIFY: add callout card)
      └── src/pages/tools/index.astro (NO CHANGE -- Compass is content, not a tool)
```

---

## Question 1: Data Structure -- Single JSON vs Separate Files

**Recommendation: Single JSON file at `src/data/db-compass/models.json`**

**Confidence:** HIGH

### Rationale

The Beauty Index uses exactly this pattern -- a single `languages.json` containing 25 entries, loaded via Astro's `file()` loader in `content.config.ts`. The Database Compass has 12 model categories, each smaller and simpler than a language entry. A single file is the clear choice.

**Why single JSON, not separate files per category:**

1. **Established precedent.** `src/data/beauty-index/languages.json` holds 25 entries (352 lines) in a single file. 12 database model entries with nested database lists will be roughly similar size (~500-600 lines). Manageable.

2. **Content collection integration.** Astro's `file()` loader is designed for single-file collections. It returns each top-level array element as a collection entry with `entry.data` containing the validated Zod object and `entry.id` generated from the `id` field. Using `glob()` with individual JSON files per category would require wrapping each in `{ "id": "...", ...data }` separately and loses the benefit of a unified file where you can see all 12 models' relative scores at a glance.

3. **Authoring ergonomics.** When scoring 12 models across 8 dimensions, you need to see adjacent entries to ensure scoring consistency. A single file lets you scroll and compare. Separate files would require opening 12 tabs.

4. **Build performance.** One file read vs 12. Negligible either way at this scale, but single file is simpler.

**When separate files WOULD be correct:** If each model category had its own MDX content (long-form prose, embedded components). But the milestone scope specifies pure JSON data with structured fields -- no MDX needed. Rich SEO content comes from the structured JSON fields rendered through Astro template components, exactly like the Beauty Index `[slug].astro` page builds a full article from `language.characterSketch` + `justifications[dim.key]` + code snippets.

### Recommended JSON Structure

```json
[
  {
    "id": "key-value",
    "name": "Key-Value Store",
    "slug": "key-value",
    "icon": "key",
    "complexityPosition": 0.08,
    "summary": "The simplest database model...",
    "scores": {
      "readLatency": 10,
      "writeLatency": 10,
      "queryFlexibility": 2,
      "scalability": 9,
      "consistency": 7,
      "schemaFlexibility": 3,
      "operationalComplexity": 2,
      "analyticsCapability": 1
    },
    "strengths": [
      "Sub-millisecond read/write latency",
      "Horizontal scaling is trivial"
    ],
    "weaknesses": [
      "No relationships between data",
      "Limited query patterns beyond key lookup"
    ],
    "bestFor": [
      "Session storage",
      "Caching layers",
      "Feature flags"
    ],
    "avoidWhen": [
      "Data has relationships",
      "Complex queries needed"
    ],
    "topDatabases": [
      {
        "name": "Redis",
        "description": "In-memory data structure store...",
        "url": "https://redis.io"
      },
      {
        "name": "Amazon DynamoDB",
        "description": "Fully managed NoSQL...",
        "url": "https://aws.amazon.com/dynamodb/"
      }
    ],
    "characterSketch": "The speed demon who memorized..."
  }
]
```

### Key Design Decisions in the Schema

- **`complexityPosition`**: A float 0.0-1.0 representing where this model sits on the complexity spectrum. This is hand-authored, not computed. Key-value might be 0.08 (simple end), graph might be 0.92 (complex end). This drives placement on the horizontal spectrum SVG.

- **`scores` object with named keys** (not an array): Unlike the Beauty Index which uses flat top-level fields (`phi`, `omega`, etc.), the Database Compass uses a nested `scores` object. The reason: 8 dimensions is enough that spreading them as top-level fields becomes unwieldy. A nested object groups them logically and makes the Zod schema cleaner.

- **`topDatabases` as nested array**: 3-6 database entries per model, each with name, one-liner description, and URL. This provides the "rich enough content for SEO" without MDX. Each detail page renders these as a structured list with external links.

- **`strengths`/`weaknesses`/`bestFor`/`avoidWhen`**: String arrays that render as bullet-point sections on detail pages. These produce semantic HTML content that search engines can index. Combined with `characterSketch` and `summary`, each detail page gets 200-400 words of unique content without any MDX.

### Zod Schema

```typescript
// src/lib/db-compass/schema.ts
import { z } from 'astro/zod';

export const dimensionScoreSchema = z.number().int().min(1).max(10);

export const topDatabaseSchema = z.object({
  name: z.string(),
  description: z.string(),
  url: z.string().url(),
});

export const dbModelSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  icon: z.string(),
  complexityPosition: z.number().min(0).max(1),
  summary: z.string(),
  scores: z.object({
    readLatency: dimensionScoreSchema,
    writeLatency: dimensionScoreSchema,
    queryFlexibility: dimensionScoreSchema,
    scalability: dimensionScoreSchema,
    consistency: dimensionScoreSchema,
    schemaFlexibility: dimensionScoreSchema,
    operationalComplexity: dimensionScoreSchema,
    analyticsCapability: dimensionScoreSchema,
  }),
  strengths: z.array(z.string()).min(2).max(5),
  weaknesses: z.array(z.string()).min(2).max(5),
  bestFor: z.array(z.string()).min(2).max(6),
  avoidWhen: z.array(z.string()).min(1).max(4),
  topDatabases: z.array(topDatabaseSchema).min(3).max(6),
  characterSketch: z.string(),
});

export type DbModel = z.infer<typeof dbModelSchema>;

export function totalScore(model: DbModel): number {
  return Object.values(model.scores).reduce((sum, s) => sum + s, 0);
}

export function dimensionScores(model: DbModel): number[] {
  return [
    model.scores.readLatency,
    model.scores.writeLatency,
    model.scores.queryFlexibility,
    model.scores.scalability,
    model.scores.consistency,
    model.scores.schemaFlexibility,
    model.scores.operationalComplexity,
    model.scores.analyticsCapability,
  ];
}
```

### Content Collection Registration

```typescript
// Addition to src/content.config.ts
import { dbModelSchema } from './lib/db-compass/schema';

const dbModels = defineCollection({
  loader: file('src/data/db-compass/models.json'),
  schema: dbModelSchema,
});

export const collections = { blog, languages, dbModels };
```

---

## Question 2: Complexity Spectrum SVG

**Recommendation: Build-time SVG with a horizontal axis, labeled endpoints, and plotted model points with vertical stem markers.**

**Confidence:** HIGH

### Visualization Design

The complexity spectrum is a horizontal 1D visualization (not a chart with two axes). It shows all 12 database models positioned left-to-right from "Simple" to "Complex" based on their `complexityPosition` value.

```
Simple ─────────────────────────────────── Complex
  ●           ●    ●   ● ●      ●  ●    ●     ●
 KV         Doc  Col  WC TS    Rel  Sp  Vec   Graph
```

### SVG Structure

```
┌──────────────────────────────────────────────────────┐
│                    Complexity Spectrum                 │
│                                                       │
│  Simple ──────────────────────────────────── Complex  │
│     │                                           │     │
│     ●         ●     ●  ● ●      ●   ●    ●     ●    │
│    ╱│╲       ╱│╲                                      │
│   label     label    (labels below points)            │
│                                                       │
└──────────────────────────────────────────────────────┘
```

### Implementation: `src/lib/db-compass/spectrum-math.ts`

This is a new pure-TS file following the same pattern as `radar-math.ts`: zero framework dependencies, usable in both Astro components and Satori OG image contexts.

```typescript
// src/lib/db-compass/spectrum-math.ts

export interface SpectrumPoint {
  x: number;
  y: number;
  label: string;
  id: string;
}

/**
 * Computes pixel positions for models on the complexity spectrum.
 *
 * @param width - Total SVG width
 * @param models - Array of { id, name, complexityPosition (0-1) }
 * @param padding - Horizontal padding from edges
 * @param baselineY - Y coordinate for the axis line
 */
export function computeSpectrumPositions(
  width: number,
  models: { id: string; name: string; complexityPosition: number }[],
  padding: number = 60,
  baselineY: number = 80,
): SpectrumPoint[] {
  const usableWidth = width - 2 * padding;
  return models.map((m) => ({
    x: padding + m.complexityPosition * usableWidth,
    y: baselineY,
    label: m.name,
    id: m.id,
  }));
}

/**
 * Generates a complete standalone SVG string for the complexity spectrum.
 * Designed for both Astro component embedding and Satori OG image use.
 */
export function generateSpectrumSvgString(
  width: number,
  height: number,
  models: { id: string; name: string; complexityPosition: number }[],
  dotColor: string = '#c44b20',
): string {
  const padding = 60;
  const baselineY = height * 0.4;
  const points = computeSpectrumPositions(width, models, padding, baselineY);
  const lineY = baselineY;

  // Axis line
  const axisLine = `<line x1="${padding}" y1="${lineY}" x2="${width - padding}" y2="${lineY}" stroke="#ccc" stroke-width="2"/>`;

  // Endpoint labels
  const simpleLabel = `<text x="${padding}" y="${lineY - 20}" text-anchor="start" font-size="14" fill="#888" font-weight="600">Simple</text>`;
  const complexLabel = `<text x="${width - padding}" y="${lineY - 20}" text-anchor="end" font-size="14" fill="#888" font-weight="600">Complex</text>`;

  // Model dots and labels
  const dots = points.map((p) => {
    // Stagger labels to avoid overlap: alternate above and below
    const labelY = p.y + 28;
    return [
      `<circle cx="${p.x.toFixed(1)}" cy="${p.y}" r="6" fill="${dotColor}"/>`,
      `<line x1="${p.x.toFixed(1)}" y1="${p.y + 6}" x2="${p.x.toFixed(1)}" y2="${p.y + 14}" stroke="${dotColor}" stroke-width="1.5"/>`,
      `<text x="${p.x.toFixed(1)}" y="${labelY}" text-anchor="middle" font-size="11" fill="#666">${p.label}</text>`,
    ].join('\n    ');
  }).join('\n    ');

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    ${axisLine}
    ${simpleLabel}
    ${complexLabel}
    ${dots}
  </svg>`;
}
```

### SVG Patterns That Work Well for This Visualization

**Label collision avoidance.** With 12 models, labels will overlap if all placed on the same baseline. Two strategies:

1. **Alternating vertical offset.** Odd-indexed labels appear below the line, even-indexed above. This is the simplest and works because the spectrum has enough horizontal spread.

2. **Diagonal labels.** Rotate labels 45 degrees at their anchor point. More compact but harder to read on mobile.

**Recommendation: Use alternating vertical offset.** Simpler to implement, works in Satori for OG images, and matches the clean aesthetic of the existing site.

**Interactive enhancement (optional, no React required).** The Astro component can include `<a>` elements wrapping each dot/label group with `href="/db-compass/{slug}/"`. SVG `<a>` elements are valid and create clickable regions. This provides navigation without any JavaScript.

### Astro Component: `src/components/db-compass/ComplexitySpectrum.astro`

Follows the same build-time SVG pattern as `RadarChart.astro` -- all math computed in the frontmatter, SVG rendered as static HTML.

```astro
---
import { computeSpectrumPositions } from '../../lib/db-compass/spectrum-math';
import type { DbModel } from '../../lib/db-compass/schema';

interface Props {
  models: DbModel[];
  width?: number;
  height?: number;
}

const { models, width = 900, height = 160 } = Astro.props;
const points = computeSpectrumPositions(
  width,
  models.map(m => ({ id: m.id, name: m.name, complexityPosition: m.complexityPosition })),
);
---

<svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}
  xmlns="http://www.w3.org/2000/svg"
  role="img"
  aria-label="Complexity spectrum showing 12 database model categories from simple to complex">
  <!-- axis, dots, labels rendered here -->
</svg>
```

---

## Question 3: Radar Chart -- Reuse radar-math.ts for 8-Axis Charts

**Recommendation: Reuse `radar-math.ts` directly. No modifications needed.**

**Confidence:** HIGH -- verified by reading the source code.

### Why It Works Without Changes

The existing `radar-math.ts` was deliberately designed to be axis-count agnostic. Every function uses `values.length` or `numSides` as a parameter, not a hardcoded 6:

- **`radarPolygonPoints(cx, cy, maxRadius, values, maxValue)`**: Uses `const numAxes = values.length` and `const angleStep = (2 * Math.PI) / numAxes`. Pass an 8-element array, get an octagonal polygon.

- **`hexagonRingPoints(cx, cy, radius, numSides)`**: Despite the name containing "hexagon", it generates a regular polygon with `numSides` sides. Pass `8` and you get an octagonal grid ring. The function name is misleading but the implementation is correct.

- **`generateRadarSvgString(size, values, fillColor, fillOpacity, labels, labelColors)`**: Uses `values.length` for everything. Pass 8 values and 8 labels, get an 8-axis radar chart with octagonal grid rings.

### What the CompassRadarChart.astro Component Looks Like

```astro
---
import { polarToCartesian, radarPolygonPoints, hexagonRingPoints } from '../../lib/beauty-index/radar-math';
import { COMPASS_DIMENSIONS } from '../../lib/db-compass/compass-dimensions';
import type { DbModel } from '../../lib/db-compass/schema';
import { dimensionScores } from '../../lib/db-compass/schema';

interface Props {
  model: DbModel;
  size?: number;
}

const { model, size = 300 } = Astro.props;
const pad = 28; // Slightly more padding for 8 labels
const vbSize = size + pad * 2;
const cx = vbSize / 2;
const cy = vbSize / 2;
const maxRadius = size * 0.42;
const scores = dimensionScores(model);

const numAxes = 8; // KEY DIFFERENCE from Beauty Index's 6
const angleStep = (2 * Math.PI) / numAxes;
const gridLevels = [2, 4, 6, 8, 10];
---

<svg width={size} height={size} viewBox={`0 0 ${vbSize} ${vbSize}`} ...>
  {/* Grid rings -- octagonal instead of hexagonal */}
  {gridLevels.map((level) => {
    const ringRadius = (level / 10) * maxRadius;
    const points = hexagonRingPoints(cx, cy, ringRadius, numAxes);
    return <polygon points={points} fill="none" stroke="#e5ddd5" stroke-width="1" />;
  })}

  {/* 8 axis lines */}
  {/* Data polygon from 8 scores */}
  {/* 8 dimension labels */}
</svg>
```

### OG Image Radar Charts

The `generateRadarSvgString()` function in `radar-math.ts` is already used by `og-image.ts` to embed radar charts in OG images as base64 data URIs. The same function works with 8 values for Database Compass OG images:

```typescript
const radarSvg = generateRadarSvgString(
  300,
  dimensionScores(model),    // 8-element array
  accentColor,
  0.35,
  COMPASS_DIMENSIONS.map(d => d.shortName),  // 8 labels
);
```

### Dimension Metadata: `src/lib/db-compass/compass-dimensions.ts`

Follows the same pattern as `src/lib/beauty-index/dimensions.ts`:

```typescript
export interface CompassDimension {
  key: keyof DbModel['scores'];
  shortName: string;
  name: string;
  description: string;
  color: string;
}

export const COMPASS_DIMENSIONS: CompassDimension[] = [
  { key: 'readLatency', shortName: 'Read', name: 'Read Latency', description: 'Speed of data retrieval operations', color: '#4A90D9' },
  { key: 'writeLatency', shortName: 'Write', name: 'Write Latency', description: 'Speed of data insertion and update operations', color: '#7B68EE' },
  { key: 'queryFlexibility', shortName: 'Query', name: 'Query Flexibility', description: 'Range and complexity of supported query patterns', color: '#2AAA8A' },
  { key: 'scalability', shortName: 'Scale', name: 'Scalability', description: 'Ability to handle growing data volume and traffic', color: '#E8734A' },
  { key: 'consistency', shortName: 'Consist.', name: 'Consistency', description: 'Strength of data consistency guarantees', color: '#8FBC5A' },
  { key: 'schemaFlexibility', shortName: 'Schema', name: 'Schema Flexibility', description: 'Ability to evolve data structure over time', color: '#D4A843' },
  { key: 'operationalComplexity', shortName: 'Ops', name: 'Operational Complexity', description: 'Effort required to deploy, monitor, and maintain', color: '#C44B20' },
  { key: 'analyticsCapability', shortName: 'Analytics', name: 'Analytics Capability', description: 'Suitability for analytical queries and aggregations', color: '#9B59B6' },
];
```

---

## Question 4: SEO-Rich Content from Pure JSON

**Recommendation: Use structured JSON fields rendered through Astro template sections. No MDX required.**

**Confidence:** HIGH -- this is exactly how the Beauty Index detail pages work.

### How the Beauty Index Achieves SEO Without MDX

The `[slug].astro` page for the Beauty Index builds a ~400-word article from structured data:

1. **`characterSketch`** (string) -- rendered as a paragraph in the "Character" section
2. **`justifications[dim.key]`** (HTML string per dimension) -- rendered in the "Dimension Analysis" section
3. **Code snippet** (from `snippets.ts`) -- rendered with Astro Expressive Code
4. **Computed metadata** -- rank, total score, tier label, prev/next navigation

The result is a unique, crawlable page with multiple heading-delimited sections, semantic HTML, and keyword-rich content. Google treats it as high-quality content because it IS high-quality content -- just assembled from data, not written in prose format.

### Database Compass Detail Page Content Sections

Each `/db-compass/[slug]/` page renders these sections from JSON fields:

| Section | JSON Source | Estimated Words | SEO Value |
|---------|------------|-----------------|-----------|
| Summary | `summary` (string) | 40-80 | Core page description |
| Character Sketch | `characterSketch` (string) | 30-60 | Unique voice, sharable |
| Radar Chart | `scores` (8 ints) | 0 (visual) | Engagement, time-on-page |
| Score Breakdown | `scores` + dimension metadata | 8 x ~5 = 40 | Dimension names are keywords |
| Strengths | `strengths` (string array) | 2-5 x ~10 = 30 | "Benefits of key-value stores" |
| Weaknesses | `weaknesses` (string array) | 2-5 x ~10 = 30 | "Limitations of key-value stores" |
| Best For | `bestFor` (string array) | 2-6 x ~8 = 30 | Use case keywords |
| Avoid When | `avoidWhen` (string array) | 1-4 x ~10 = 25 | Counter-positioning |
| Top Databases | `topDatabases` (object array) | 3-6 x ~20 = 80 | Named products (high search volume) |
| Navigation | computed links | ~10 | Internal linking |
| **Total** | | **~300-400** | |

This produces unique, keyword-rich pages competitive with dedicated database comparison sites, all from structured JSON.

### SEO Content Patterns

**Meta description** (computed):
```typescript
const metaDescription = `${model.name} database model scores ${totalScore(model)}/80 in the Database Compass. ${model.summary.slice(0, 100)}...`;
```

**Heading hierarchy** on each detail page:
```
h1: Key-Value Store -- Database Compass
  h2: Character
  h2: Capability Profile (radar chart + score breakdown)
  h2: Strengths
  h2: Weaknesses
  h2: Best For / Use Cases
  h2: When to Avoid
  h2: Top Databases
  h2: Explore Other Models (prev/next nav)
```

**Screen-reader accessible score data** (same pattern as Beauty Index):
```html
<div class="sr-only">
  <dl>
    <dt>Read Latency</dt><dd>10 out of 10</dd>
    <dt>Write Latency</dt><dd>10 out of 10</dd>
    ...
  </dl>
</div>
```

---

## Question 5: Build Order

**Recommended build order, based on dependency analysis:**

### Phase 1: Data Foundation
*No dependencies on other new code*

1. **`src/lib/db-compass/schema.ts`** -- Zod schema, TypeScript types, `totalScore()`, `dimensionScores()`
2. **`src/lib/db-compass/compass-dimensions.ts`** -- 8 dimension metadata (names, colors, descriptions)
3. **`src/data/db-compass/models.json`** -- All 12 model entries with scores, descriptions, databases
4. **`src/content.config.ts`** -- Add `dbModels` collection (3-line modification)

**Verification gate:** `npm run build` succeeds, `getCollection('dbModels')` returns 12 validated entries.

### Phase 2: Visualizations
*Depends on: Phase 1 (schema types, dimension metadata)*

5. **`src/lib/db-compass/spectrum-math.ts`** -- Pure-TS complexity spectrum SVG math
6. **`src/components/db-compass/ComplexitySpectrum.astro`** -- Horizontal spectrum component
7. **`src/components/db-compass/CompassRadarChart.astro`** -- 8-axis radar chart (reuses radar-math.ts)
8. **`src/components/db-compass/CompassScoringTable.astro`** -- Sortable scoring table (follows ScoringTable.astro pattern)

**Verification gate:** Components render correctly in isolation. Radar chart has 8 axes. Spectrum shows 12 points.

### Phase 3: Detail Pages
*Depends on: Phase 1 (data), Phase 2 (radar chart)*

9. **`src/components/db-compass/TradeoffPanel.astro`** -- Strengths/weaknesses/bestFor/avoidWhen
10. **`src/components/db-compass/TopDatabases.astro`** -- Database list with external links
11. **`src/components/db-compass/ModelNav.astro`** -- Prev/next navigation
12. **`src/pages/db-compass/[slug].astro`** -- 12 detail pages via getStaticPaths

**Verification gate:** All 12 detail pages render with full content. Internal links work.

### Phase 4: Overview Page
*Depends on: Phase 2 (spectrum, grid, table), Phase 3 (detail pages exist for linking)*

13. **`src/components/db-compass/ModelGrid.astro`** -- Category card grid linking to detail pages
14. **`src/pages/db-compass/index.astro`** -- Overview page assembling spectrum + grid + table

**Verification gate:** Overview page renders. All grid cards link to valid detail pages.

### Phase 5: SEO and OG Images
*Depends on: Phase 1 (schema), Phase 4 (pages exist)*

15. **`src/components/DbCompassJsonLd.astro`** -- Dataset + ItemList structured data
16. **`src/lib/og-image.ts`** -- Add `generateDbCompassOverviewOgImage()` and `generateDbModelOgImage()`
17. **`src/pages/open-graph/db-compass.png.ts`** -- Overview OG endpoint
18. **`src/pages/open-graph/db-compass/[slug].png.ts`** -- Per-model OG endpoint

**Verification gate:** OG images generate. JSON-LD validates at schema.org validator.

### Phase 6: Site Integration
*Depends on: Phase 4 (overview page exists)*

19. **`src/pages/index.astro`** -- Add Database Compass callout card (follows existing pattern)
20. **Breadcrumb JSON-LD** on all pages (uses existing `BreadcrumbJsonLd.astro`)
21. **Companion blog post** -- `src/data/blog/database-compass.mdx`

**Verification gate:** Full build succeeds. All pages accessible. Sitemap includes new pages.

### Dependency Graph

```
Phase 1: Schema + Data
    │
    ├─── Phase 2: Visualizations (spectrum, radar, table)
    │        │
    │        ├─── Phase 3: Detail Pages (assemble components)
    │        │        │
    │        │        └─── Phase 4: Overview Page
    │        │                 │
    │        │                 ├─── Phase 5: SEO + OG Images
    │        │                 │
    │        │                 └─── Phase 6: Site Integration
    │        │
    │        └─── Phase 4: Overview Page (also uses spectrum + table)
    │
    └─── Phase 5: SEO (needs schema types for JSON-LD)
```

---

## Question 6: DbCompassJsonLd vs BeautyIndexJsonLd

**Recommendation: Use `Dataset` + `ItemList` as the primary type, same as `BeautyIndexJsonLd.astro`, but with database-specific vocabulary.**

**Confidence:** HIGH

### Structural Comparison

| Aspect | BeautyIndexJsonLd | DbCompassJsonLd |
|--------|-------------------|-----------------|
| `@type` | `Dataset` | `Dataset` |
| `mainEntity.@type` | `ItemList` | `ItemList` |
| `itemListOrder` | `ItemListOrderDescending` (by score) | `ItemListOrderAscending` (by complexity) |
| `variableMeasured` | 6 dimension names | 8 dimension names |
| `keywords` | `"programming languages", "code aesthetics"` | `"database models", "database comparison", "NoSQL vs SQL"` |
| `measurementTechnique` | Editorial scoring 1-10 | Editorial scoring 1-10 |
| `about` (per item) | `ComputerLanguage` | Not applicable -- no schema.org type for "database model" |

### Key Differences

1. **Item ordering.** The Beauty Index ranks by total score (descending). The Database Compass should order items by complexity position (ascending, simple to complex) because that is the natural taxonomy -- it is a spectrum, not a competition. Alternatively, alphabetical order works since models are categories, not ranked entries.

2. **No `aggregateRating` on detail pages.** The Beauty Index uses `aggregateRating` because scores represent quality judgment. Database model scores represent capability profiles -- a key-value store scoring 2/10 on query flexibility is not "worse" than a relational database scoring 9/10. The scores are dimensional comparisons, not quality ratings. Using `aggregateRating` would mislead search engines.

3. **Detail page `@type`.** Instead of `CreativeWork` with `aggregateRating`, use `Article` with `about` referencing the database model concept:

```json
{
  "@context": "https://schema.org",
  "@type": "Article",
  "name": "Key-Value Store -- Database Compass",
  "description": "...",
  "url": "https://patrykgolabek.dev/db-compass/key-value/",
  "datePublished": "2026-02-XX",
  "author": {
    "@type": "Person",
    "@id": "https://patrykgolabek.dev/#person"
  },
  "isPartOf": {
    "@type": "Dataset",
    "name": "Database Compass",
    "url": "https://patrykgolabek.dev/db-compass/"
  },
  "about": {
    "@type": "Thing",
    "name": "Key-Value Store Database Model",
    "description": "A database architecture pattern optimized for simple key-based data retrieval"
  },
  "mentions": [
    { "@type": "SoftwareApplication", "name": "Redis", "url": "https://redis.io" },
    { "@type": "SoftwareApplication", "name": "Amazon DynamoDB", "url": "https://aws.amazon.com/dynamodb/" }
  ]
}
```

4. **`mentions` for top databases.** The `topDatabases` array maps naturally to `mentions` with `@type: SoftwareApplication`. This tells search engines that the page discusses Redis, DynamoDB, etc., improving discoverability for searches like "Redis vs DynamoDB" or "best key-value database".

### Overview Page JSON-LD

```typescript
// src/components/DbCompassJsonLd.astro
const schema = {
  "@context": "https://schema.org",
  "@type": "Dataset",
  "name": "Database Compass",
  "alternateName": "Database Model Comparison Guide 2026",
  "description": "An interactive guide to 12 database model categories, scored across 8 capability dimensions. From key-value stores to graph databases.",
  "url": "https://patrykgolabek.dev/db-compass/",
  "datePublished": "2026-XX-XX",
  "version": "2026 Edition",
  "license": "https://creativecommons.org/licenses/by/4.0/",
  "creator": {
    "@type": "Person",
    "@id": "https://patrykgolabek.dev/#person",
  },
  "keywords": [
    "database models",
    "database comparison",
    "NoSQL vs SQL",
    "database architecture",
    "key-value store",
    "document database",
    "graph database",
    "time-series database",
    "database selection guide",
  ],
  "variableMeasured": COMPASS_DIMENSIONS.map(d => d.name),
  "measurementTechnique": "Editorial scoring: each dimension rated 1-10 by expert judgment based on 17+ years of production database experience",
  "mainEntity": {
    "@type": "ItemList",
    "itemListOrder": "https://schema.org/ItemListUnordered",
    "numberOfItems": models.length,
    "itemListElement": models.map((model, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": model.name,
      "url": `https://patrykgolabek.dev/db-compass/${model.slug}/`,
    })),
  },
};
```

---

## Component Boundaries Summary

### New Files (21 files)

| File | Type | Purpose |
|------|------|---------|
| `src/lib/db-compass/schema.ts` | TypeScript | Zod schema, types, score helpers |
| `src/lib/db-compass/compass-dimensions.ts` | TypeScript | 8 dimension metadata |
| `src/lib/db-compass/spectrum-math.ts` | TypeScript | Complexity spectrum SVG math |
| `src/data/db-compass/models.json` | JSON Data | 12 model entries |
| `src/components/db-compass/ComplexitySpectrum.astro` | Astro Component | Horizontal spectrum SVG |
| `src/components/db-compass/ModelGrid.astro` | Astro Component | Category card grid |
| `src/components/db-compass/CompassRadarChart.astro` | Astro Component | 8-axis radar chart |
| `src/components/db-compass/CompassScoringTable.astro` | Astro Component | Sortable scoring table |
| `src/components/db-compass/TradeoffPanel.astro` | Astro Component | Strengths/weaknesses |
| `src/components/db-compass/TopDatabases.astro` | Astro Component | Database list with links |
| `src/components/db-compass/ModelNav.astro` | Astro Component | Prev/next navigation |
| `src/components/DbCompassJsonLd.astro` | Astro Component | Overview JSON-LD |
| `src/pages/db-compass/index.astro` | Astro Page | Overview page |
| `src/pages/db-compass/[slug].astro` | Astro Page | 12 detail pages |
| `src/pages/open-graph/db-compass.png.ts` | API Route | Overview OG image |
| `src/pages/open-graph/db-compass/[slug].png.ts` | API Route | Per-model OG images |

### Modified Files (3 files)

| File | Change | Scope |
|------|--------|-------|
| `src/content.config.ts` | Add `dbModels` collection | ~5 lines added |
| `src/lib/og-image.ts` | Add `generateDbCompassOverviewOgImage()` and `generateDbModelOgImage()` | ~150 lines added |
| `src/pages/index.astro` | Add Database Compass callout card | ~15 lines added (follows existing Dockerfile Analyzer callout pattern) |

### Unchanged Existing Files

| File | Why Unchanged |
|------|---------------|
| `src/lib/beauty-index/radar-math.ts` | Already axis-count agnostic -- used as-is |
| `src/pages/tools/index.astro` | Database Compass is content/reference, not a tool |
| `src/lib/beauty-index/schema.ts` | Beauty Index schema stays separate |
| `src/lib/beauty-index/dimensions.ts` | Beauty Index dimensions stay separate |
| `src/lib/beauty-index/tiers.ts` | Not used by Database Compass (no tier system) |

---

## Anti-Patterns to Avoid

### Anti-Pattern 1: Shared Schema Abstractions

**What people do:** Create a generic `ScoredEntity` base schema that both Beauty Index languages and Database Compass models extend.

**Why it is wrong:** The two domains have different dimension counts (6 vs 8), different score semantics (aesthetic quality vs capability profile), different tier systems (4 tiers vs none), and different total score ranges (6-60 vs 8-80). A shared abstraction would require so many conditionals and generics that it becomes harder to maintain than two independent schemas.

**Do this instead:** Keep schemas completely independent. The only shared code is `radar-math.ts`, which is a pure math utility with no domain knowledge.

### Anti-Pattern 2: Putting Database Compass Under /tools/

**What people do:** Since it is an "explorer", treat it as a tool and put it at `/tools/db-compass/`.

**Why it is wrong:** The Database Compass is static, informational content -- like the Beauty Index. It has no interactive input (no editor, no user-supplied data). Tools like the Dockerfile Analyzer take user input and produce output. The Compass is a reference guide. Putting reference content under `/tools/` confuses the site's information architecture.

**Do this instead:** Use `/db-compass/` as a top-level content pillar, same as `/beauty-index/`. Add a callout on the homepage, same as the Beauty Index and Dockerfile Analyzer callouts.

### Anti-Pattern 3: Inverting Operational Complexity Scores

**What people do:** Score "operational complexity" where 10 means "most complex" (most is worst). This inverts the radar chart's visual language where bigger polygons = better.

**Why it is wrong:** On the Beauty Index, a score of 10 means "best in this dimension." If operational complexity 10 means "hardest to operate," then a fully-filled radar polygon means the database is terrible to operate. The visual language breaks.

**Do this instead:** Score operational complexity as "operational simplicity" -- 10 means easiest to operate, 1 means hardest. Alternatively, rename it to "Ease of Operations." This keeps the radar chart's visual language consistent: bigger polygon = better across all dimensions.

---

## Data Flow

### Build-Time Data Flow (getStaticPaths)

```
models.json
    │
    │ Astro file() loader + Zod validation
    v
getCollection('dbModels')
    │
    │ .map(entry => entry.data) -- extract validated DbModel objects
    v
getStaticPaths() -- generates 12 { params: { slug }, props: { model, prev, next, rank } }
    │
    │ For each model:
    v
[slug].astro renders:
  ├── CompassRadarChart (radar-math.ts with 8 values)
  ├── TradeoffPanel (strengths, weaknesses, bestFor, avoidWhen)
  ├── TopDatabases (external links)
  ├── ModelNav (prev/next)
  ├── JSON-LD (Article + mentions)
  └── BreadcrumbJsonLd (Home > DB Compass > [Model Name])
```

### OG Image Generation Flow

```
[slug].png.ts (API route)
    │
    │ getStaticPaths() from dbModels collection
    v
generateDbModelOgImage(model: DbModel)
    │
    ├── generateRadarSvgString(300, scores, color, 0.35, labels)
    │   └── returns SVG string (8-axis octagonal chart)
    │
    ├── Convert SVG to base64 data URI
    │
    ├── Build Satori layout (two-column: text + radar)
    │   └── Uses existing renderOgPng(), brandingRow(), accentBar()
    │
    └── sharp(svg).png().toBuffer() -- returns PNG
```

---

## Sources

- Astro Content Collections file() loader: verified in `src/content.config.ts` (existing `languages` collection)
- radar-math.ts: verified axis-count agnostic by reading source (`values.length`, `numSides` parameters)
- OG image pipeline: verified in `src/lib/og-image.ts` (Satori + Sharp, reusable helpers)
- Beauty Index [slug].astro: verified SEO content generation pattern from structured JSON data
- BeautyIndexJsonLd.astro: verified Dataset + ItemList schema.org pattern
- DockerfileAnalyzerJsonLd.astro: verified SoftwareApplication pattern (not used for Compass)
- Schema.org Dataset type: https://schema.org/Dataset
- Schema.org ItemList type: https://schema.org/ItemList

---
*Architecture research for: Database Compass integration into existing Astro 5 portfolio site*
*Researched: 2026-02-21*
