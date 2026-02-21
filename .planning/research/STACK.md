# Stack Research: Database Compass (Database Model Explorer)

**Domain:** Interactive database model explorer and comparison tool for static Astro 5 portfolio site
**Researched:** 2026-02-21
**Confidence:** HIGH

## Existing Stack (DO NOT reinstall -- already validated)

| Technology | Version | Relevance to Database Compass |
|------------|---------|-------------------------------|
| Astro | ^5.3.0 (installed: 5.17.1) | Static pages, content collections with `file()` loader, build-time rendering |
| TypeScript | ^5.9.3 | Zod schemas, radar math utilities, type-safe data |
| Tailwind CSS | ^3.4.19 | Responsive layout, tables, cards, badges |
| React 19 | ^19.2.4 | Available for islands if needed (likely NOT needed -- see below) |
| Nanostores | ^1.1.0 | Client-side state for filters/sorting if React islands are used |
| Satori + Sharp | ^0.19.2 / ^0.34.5 | OG image generation for each database model page |
| GSAP | ^3.14.2 | Scroll animations for visual polish |
| lz-string | ^1.5.0 | URL state compression if sharing is added |

## Key Finding: ZERO New Dependencies Needed

The Database Compass does NOT require any new npm packages. Every capability required is already present in the codebase or achievable with pure TypeScript and Astro's built-in features.

This is the single most important finding of this research.

---

## Question-by-Question Analysis

### 1. Complexity Spectrum SVG Visualization -- No New Dependencies

**Answer:** No new dependencies needed. Use pure TypeScript to generate SVG at build time, following the exact same pattern as `radar-math.ts` and `RadarChart.astro`.

**What the complexity spectrum is:** A horizontal bar or gradient visualization showing where each database model sits on a spectrum from "simple key-value" to "complex graph/multi-model." This is fundamentally simpler than a radar chart -- it is a positioned element on a linear axis.

**Implementation pattern (pure TypeScript, build-time SVG):**

```typescript
// src/lib/database-compass/spectrum-math.ts
export function spectrumPosition(
  complexity: number,   // 1-10
  maxWidth: number,
  maxValue: number = 10
): number {
  return (complexity / maxValue) * maxWidth;
}

export function generateSpectrumSvg(
  models: Array<{ name: string; complexity: number; color: string }>,
  width: number,
  height: number
): string {
  // Pure string concatenation, same pattern as generateRadarSvgString()
  const barHeight = 8;
  const markerRadius = 6;
  const padding = 40;
  const usableWidth = width - padding * 2;

  const markers = models.map((m) => {
    const x = padding + spectrumPosition(m.complexity, usableWidth);
    return `<circle cx="${x}" cy="${height / 2}" r="${markerRadius}" fill="${m.color}"/>`;
  }).join('\n');

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <rect x="${padding}" y="${height / 2 - barHeight / 2}" width="${usableWidth}" height="${barHeight}" rx="4" fill="#e5e5e5"/>
    ${markers}
  </svg>`;
}
```

**Why this works:** The existing `radar-math.ts` already demonstrates the pattern -- pure math functions that return SVG coordinate strings, consumed by `.astro` components at build time. A complexity spectrum is geometrically simpler than a radar chart (linear positioning vs. polar coordinates). No charting library (D3, Chart.js, Recharts) is needed.

**Confidence:** HIGH -- direct precedent exists in the codebase (`radar-math.ts`, `RadarChart.astro`, `generateRadarSvgString()`).

### 2. 8-Axis Radar/Octagon Chart -- Existing Code Already Supports It

**Answer:** The existing `radar-math.ts` already supports variable axis counts. No changes needed to the math utilities. The functions `radarPolygonPoints()`, `hexagonRingPoints()`, and `generateRadarSvgString()` all parameterize by `values.length` (number of axes). Pass an 8-element array and you get an octagon.

**Proof from existing code:**

```typescript
// radar-math.ts line 42-43 -- axis count derived from array length
const numAxes = values.length;
const angleStep = (2 * Math.PI) / numAxes;
```

The function name `hexagonRingPoints` is misleading (it was written for the Beauty Index's 6-axis chart) but the implementation is generic:

```typescript
// radar-math.ts line 65-78 -- numSides parameter, not hardcoded to 6
export function hexagonRingPoints(
  cx: number, cy: number, radius: number, numSides: number
): string {
  const angleStep = (2 * Math.PI) / numSides;
  // ... generates polygon with numSides vertices
}
```

**For the Database Compass octagon chart, the usage is:**

```astro
---
// In a DatabaseRadarChart.astro component
import { radarPolygonPoints, hexagonRingPoints } from '../../lib/beauty-index/radar-math';

const scores = [8, 6, 9, 4, 7, 5, 3, 8]; // 8 values = 8 axes = octagon
const points = radarPolygonPoints(cx, cy, maxRadius, scores, 10);
const gridRing = hexagonRingPoints(cx, cy, ringRadius, 8); // 8-sided grid
---
```

**Optional cleanup:** Consider renaming `hexagonRingPoints` to `polygonRingPoints` since it is not hexagon-specific. This is a cosmetic refactor, not a functional one.

**Confidence:** HIGH -- verified by reading the source code of `radar-math.ts`. The math is generic.

### 3. Data Format for 12 Database Model Categories with Nested Entries

**Answer:** Use a single flat JSON file with Astro's `file()` loader and a Zod schema. Do NOT use nested JSON requiring a custom parser -- the flat approach is simpler, follows the existing `languages.json` pattern, and gives better content collection ergonomics.

**Recommended data architecture: Two collections, two files.**

**File 1: Database model categories** (`src/data/database-compass/categories.json`)

```json
[
  {
    "id": "relational",
    "name": "Relational",
    "shortDescription": "Tables with rows and columns, SQL queries, ACID transactions",
    "icon": "table",
    "complexity": 5,
    "color": "#3B82F6",
    "useCases": ["OLTP", "Financial systems", "ERP"],
    "strengths": ["ACID compliance", "Mature tooling", "SQL standardization"],
    "weaknesses": ["Horizontal scaling", "Schema rigidity", "Object-relational impedance"],
    "sortOrder": 1
  },
  {
    "id": "document",
    "name": "Document",
    "shortDescription": "Flexible JSON/BSON documents, schema-optional",
    "icon": "file-json",
    "complexity": 4,
    "color": "#10B981",
    "useCases": ["Content management", "Catalogs", "User profiles"],
    "strengths": ["Schema flexibility", "Developer experience", "Horizontal scaling"],
    "weaknesses": ["Transaction support", "Join operations", "Data duplication"],
    "sortOrder": 2
  }
]
```

**File 2: Individual databases** (`src/data/database-compass/databases.json`)

```json
[
  {
    "id": "postgresql",
    "name": "PostgreSQL",
    "categoryId": "relational",
    "year": 1996,
    "license": "PostgreSQL License",
    "description": "Advanced open-source relational database with extensibility focus",
    "scores": {
      "scalability": 7,
      "queryPower": 9,
      "schemaFlex": 6,
      "ecosystem": 9,
      "learning": 7,
      "performance": 8,
      "reliability": 9,
      "operability": 7
    },
    "usedBy": ["Instagram", "Uber", "Twitch"],
    "bestFor": "Complex queries, data integrity, extensibility"
  }
]
```

**Why two flat files instead of one nested file:**

1. **Astro's `file()` loader works best with flat arrays.** The default `file()` loader auto-parses `JSON` arrays without needing a custom `parser` function. Nested JSON requires `parser: (text) => JSON.parse(text).categories` -- an unnecessary complication.

2. **Matches the existing pattern.** The Beauty Index uses `src/data/beauty-index/languages.json` as a flat array with `file()`. The Database Compass should follow the same convention.

3. **Two collections enable independent querying.** `getCollection('dbCategories')` returns all categories. `getCollection('databases')` returns all databases. Filtering databases by category is a simple `.filter(db => db.data.categoryId === 'relational')` -- no nested traversal needed.

4. **Zod schemas validate the `categoryId` relationship.** The database schema can reference category IDs via `z.enum()` or `z.string()`, ensuring data integrity at build time.

**Content collection registration** (`src/content.config.ts` additions):

```typescript
import { databaseSchema, dbCategorySchema } from './lib/database-compass/schema';

const dbCategories = defineCollection({
  loader: file('src/data/database-compass/categories.json'),
  schema: dbCategorySchema,
});

const databases = defineCollection({
  loader: file('src/data/database-compass/databases.json'),
  schema: databaseSchema,
});

export const collections = { blog, languages, dbCategories, databases };
```

**Zod schemas:**

```typescript
// src/lib/database-compass/schema.ts
import { z } from 'astro/zod';

export const dbCategorySchema = z.object({
  id: z.string(),
  name: z.string(),
  shortDescription: z.string(),
  icon: z.string(),
  complexity: z.number().int().min(1).max(10),
  color: z.string(),
  useCases: z.array(z.string()),
  strengths: z.array(z.string()),
  weaknesses: z.array(z.string()),
  sortOrder: z.number().int(),
});

export type DbCategory = z.infer<typeof dbCategorySchema>;

const scoreSchema = z.number().int().min(1).max(10);

export const databaseSchema = z.object({
  id: z.string(),
  name: z.string(),
  categoryId: z.string(),
  year: z.number().int().optional(),
  license: z.string().optional(),
  description: z.string(),
  scores: z.object({
    scalability: scoreSchema,
    queryPower: scoreSchema,
    schemaFlex: scoreSchema,
    ecosystem: scoreSchema,
    learning: scoreSchema,
    performance: scoreSchema,
    reliability: scoreSchema,
    operability: scoreSchema,
  }),
  usedBy: z.array(z.string()).optional(),
  bestFor: z.string(),
});

export type Database = z.infer<typeof databaseSchema>;
```

**Why 8 scoring dimensions for the octagon chart:**
- **Scalability** -- horizontal/vertical scaling capability
- **Query Power** -- query language expressiveness, join support, aggregation
- **Schema Flexibility** -- how rigid or flexible the data model is
- **Ecosystem** -- tooling, drivers, cloud provider support, community
- **Learning Curve** -- ease of getting started (inverted: 10 = easy)
- **Performance** -- raw throughput and latency characteristics
- **Reliability** -- durability, consistency guarantees, ACID support
- **Operability** -- ease of deployment, monitoring, backup, upgrades

These map directly to the 8-axis octagon radar chart.

**Confidence:** HIGH -- the `file()` loader flat array pattern is proven in the existing codebase, and Astro 5's content collection API is well-documented for this use case.

### 4. Sortable Tables -- No Library Needed, Reuse Existing Pattern

**Answer:** Do NOT install a sortable table library. The codebase already has a production-tested inline sortable table implementation in `ScoringTable.astro` (lines 133-189).

**Existing pattern (already working in the Beauty Index):**

The `ScoringTable.astro` component implements client-side column sorting with:
- Data attributes on `<tr>` elements (`data-rank`, `data-name`, etc.)
- Button elements in `<th>` cells with `data-sort` and `data-type` attributes
- Inline `<script>` using `document.addEventListener('astro:page-load', ...)` for ClientRouter compatibility
- `aria-sort` attributes and live region announcements for WCAG 2.1 AA accessibility
- CSS-only sort indicators (triangles via Unicode `\25B2` / `\25BC`)
- Numeric vs. string sort type detection via `data-type="number"`

**For the Database Compass comparison table, the same pattern applies directly:**

```astro
<tr
  data-name={db.name.toLowerCase()}
  data-category={db.categoryId}
  data-year={db.year}
  data-scalability={db.scores.scalability}
  data-query-power={db.scores.queryPower}
  data-total={totalScore(db)}
>
```

The inline script from `ScoringTable.astro` can be extracted into a shared utility if both pages coexist, but even copy-paste-adapt is fine for a second table on a different page.

**Why NOT use a third-party library:**

| Library | Version | Size (gzipped) | Why Not |
|---------|---------|----------------|---------|
| `sortable-tablesort` | 4.1.7 | 899 bytes | Requires `<thead>`/`<tbody>` structure (which we have), but adds a dependency for ~60 lines of inline JS we already own and control |
| `table-sort-js` | 1.22.3 | ~3kb | Larger, class-name-based API that does not match the existing `data-sort` attribute pattern |
| `tablesort` | 5.7.0 | ~5kb | Legacy jQuery-era design, unnecessarily large |

The existing 55-line inline `<script>` in `ScoringTable.astro` is:
- Zero dependencies
- Fully accessible (ARIA, keyboard, live region)
- Compatible with Astro ClientRouter (`astro:page-load`)
- Already tested and shipping in production

Adding a third-party library to replace working code that is smaller than the library itself is an anti-pattern.

**Confidence:** HIGH -- verified by reading `ScoringTable.astro` source code. The pattern is proven.

### 5. Astro Integrations for Database Comparison Data -- None Exist

**Answer:** No. There are no Astro integrations, npm packages, or community libraries specifically for database comparison or database compass-type data.

**What exists in the Astro ecosystem for databases:**
- `@astrojs/db` -- SQLite integration for Astro projects (not relevant: this is for querying data, not for database comparison content)
- Various headless CMS integrations (Strapi, Contentful, etc.) -- not relevant

**What exists generally for database comparison:**
- [DB-Engines](https://db-engines.com/) -- a popularity ranking site with 498 databases across 20 categories. Their data is not available as an npm package or API.
- No npm package provides structured database comparison data.

**Implication:** All database comparison data must be hand-authored as JSON content. This is actually a strength -- the content represents expert opinion (the architect's perspective), not scraped commodity data. The same "expert voice" differentiation strategy that worked for the Dockerfile Analyzer rules applies here.

**Confidence:** HIGH -- searched npm registry, Astro integrations directory, and web. No relevant packages exist.

---

## Recommended Stack Additions

### Summary: Nothing to Install

| Category | Recommendation | New Dependencies |
|----------|---------------|-----------------|
| Complexity spectrum SVG | Pure TypeScript (`spectrum-math.ts`) | 0 |
| 8-axis radar/octagon chart | Existing `radar-math.ts` (already generic) | 0 |
| Data format | Two flat JSON files + Zod schemas + `file()` loader | 0 |
| Sortable tables | Existing inline `<script>` pattern from `ScoringTable.astro` | 0 |
| Database comparison data | Hand-authored JSON content | 0 |
| OG images | Existing Satori + Sharp pipeline | 0 |
| Animations | Existing GSAP + ScrollTrigger | 0 |

**Total new npm packages: 0**

This is the ideal outcome for a milestone on an existing site. The existing stack was designed well enough to support this new feature without expansion.

---

## Supporting Libraries (Already Installed -- Reuse Patterns)

| Library | Existing Version | Database Compass Usage |
|---------|-----------------|----------------------|
| `astro` (content collections) | 5.17.1 | Two new collections: `dbCategories`, `databases` |
| `satori` + `sharp` | 0.19.2 / 0.34.5 | OG images for `/database-compass/[category]/` and `/database-compass/[category]/[db]/` pages |
| `gsap` | 3.14.2 | Optional: animate spectrum markers, radar chart data polygon draw-in |
| `lz-string` | 1.5.0 | Optional: URL-encoded comparison state for sharing |
| `nanostores` | 1.1.0 | IF any client-side filtering is needed (category selector, score threshold filter) |

---

## Architecture Decision: Minimal Client-Side JavaScript

The Database Compass should follow the Beauty Index pattern, NOT the Dockerfile Analyzer pattern:

| Aspect | Beauty Index Pattern (Use This) | Dockerfile Analyzer Pattern (Do NOT Use) |
|--------|--------------------------------|----------------------------------------|
| Rendering | Build-time Astro + SVG | Client-side React island |
| Charts | Pure SVG in `.astro` files | N/A (CodeMirror was the "chart") |
| Interactivity | Inline `<script>` for sorting/filtering | Full React island with hooks |
| Data | Content collections + `file()` loader | Runtime state in Nanostores |
| JavaScript weight | ~1-2kb inline scripts | ~192kb client bundle |

**Why:** The Database Compass is primarily a content/reference tool. The data is static (database characteristics do not change at runtime). The interactivity is limited to sorting table columns and optionally filtering by category. This is exactly the use case that Astro's build-time rendering excels at.

**Exception:** If a "Compare Databases" interactive feature is added (select 2-3 databases and see side-by-side radar charts), that might warrant a small React island. But the core explorer pages should be zero-JS static HTML with inline sort scripts.

---

## Data Volume Estimates

| Data | Estimated Size | Build Impact |
|------|---------------|-------------|
| 12 database model categories | ~5kb JSON | Negligible |
| ~60-80 individual databases (5-7 per category) | ~40-60kb JSON | Negligible |
| Generated pages (12 category + 60-80 database detail) | ~72-92 static HTML pages | <5 seconds additional build time |
| OG images (one per page) | 72-92 PNG files | ~30-60 seconds additional build time (Satori + Sharp) |

The existing site builds ~150+ pages. Adding ~80 more is well within Astro's static build performance envelope.

---

## What NOT to Add

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| **D3.js** | 290kb library for charts that can be done with 50 lines of SVG math. The site's philosophy is "zero-dependency SVG generation." D3 would be the largest dependency in the project. | Pure TypeScript SVG generation (`spectrum-math.ts` + existing `radar-math.ts`) |
| **Chart.js / Recharts / Nivo** | Client-side charting libraries that require JavaScript to render. The Database Compass charts should be static SVG rendered at build time, shipping zero client JS. | Build-time Astro SVG components |
| **sortable-tablesort / table-sort-js** | Adding a dependency to replace ~55 lines of inline JS that already exist, are accessible, and are tested in production. | Existing `ScoringTable.astro` inline sorting pattern |
| **React islands for static content** | The database model category pages and database detail pages are static content. React adds hydration overhead for content that does not need interactivity. | Astro components (`.astro` files) with optional inline `<script>` for sorting |
| **@astrojs/db / SQLite** | The data is static JSON, not a queryable database. Adding a database layer to serve static content that changes at build time (not runtime) is over-engineering. | Content collections with `file()` loader |
| **Headless CMS (Contentful, Strapi, Sanity)** | The data volume (~80 entries) and update frequency (rare, manual) do not justify a CMS. JSON files in the repo are easier to maintain, version, and review. | JSON files in `src/data/database-compass/` |
| **@tanstack/react-table** | A React-specific table library. Overkill for static tables with sort. The existing inline sort script is simpler and lighter. | Inline `<script>` sort pattern |
| **Custom Astro integration** | No need for a build hook or integration -- content collections and static pages handle everything. | Standard Astro pages + content collections |

---

## Alternatives Considered

| Decision | Recommended | Alternative | When to Use Alternative |
|----------|-------------|-------------|------------------------|
| Chart rendering | Build-time SVG (`radar-math.ts`) | Client-side D3.js | If charts need user interaction (zoom, hover tooltips with rich content, dynamic axis selection). The Database Compass does not need this. |
| Data format | Two flat JSON files | Single nested JSON with `parser` | If categories and databases have a strict parent-child relationship that makes querying cumbersome with flat files. In practice, `.filter(db => db.data.categoryId === cat.id)` is trivial. |
| Data format | JSON files in repo | External API / headless CMS | If data changes frequently (weekly+), requires non-developer editing, or exceeds ~200 entries. Database comparison data changes rarely. |
| Table sorting | Inline `<script>` (existing pattern) | React island with @tanstack/react-table | If the table needs complex filtering (multi-column, range sliders, search), column visibility toggles, or virtual scrolling for 1000+ rows. With ~60-80 databases, vanilla sorting is fine. |
| Table sorting | Inline `<script>` (existing pattern) | `sortable-tablesort` npm package | Never for this project. The inline script is already smaller than the package and is battle-tested. |
| Interactivity model | Astro components + inline `<script>` | React island | If a "Compare X vs Y" interactive builder is added that requires complex state management (selected databases, dynamic chart rendering). Even then, consider a single small island, not full-page React. |

---

## Version Compatibility

| Existing Package | Version | Compatibility with Database Compass |
|-----------------|---------|--------------------------------------|
| Astro | 5.17.1 | Content collections with `file()` loader, dynamic routes `[...slug].astro`, build-time SVG -- all stable and verified |
| TypeScript | ^5.9.3 | Zod schemas, pure TS math utilities -- full compatibility |
| Tailwind CSS | ^3.4.19 | Tables, responsive grid, badges, cards -- no new plugins needed |
| Satori | ^0.19.2 | OG images -- same pattern as Beauty Index OG images |
| Sharp | ^0.34.5 | PNG conversion for OG images -- same pattern |
| GSAP | ^3.14.2 | Optional scroll animations -- same pattern as Beauty Index |

No version bumps or compatibility concerns.

---

## Installation

```bash
# No installation needed.
# All required capabilities exist in the current stack.
#
# The only "installation" is creating new files:
#   src/data/database-compass/categories.json
#   src/data/database-compass/databases.json
#   src/lib/database-compass/schema.ts
#   src/lib/database-compass/spectrum-math.ts
#   src/content.config.ts (add two new collections)
```

---

## Stack Patterns to Follow

### Pattern 1: Build-Time SVG (Established -- Mandatory)

**What:** Pure TypeScript math functions generate SVG coordinates. Astro `.astro` components render `<svg>` elements at build time.
**Precedent:** `radar-math.ts` + `RadarChart.astro` + `generateRadarSvgString()` for OG images.
**Apply to:** Complexity spectrum visualization, 8-axis database radar charts, category comparison charts.

### Pattern 2: Content Collections with `file()` Loader (Established -- Mandatory)

**What:** JSON data files in `src/data/`, loaded via `file()` in `content.config.ts`, validated by Zod schemas.
**Precedent:** `languages.json` + `languageSchema` + `languages` collection.
**Apply to:** `categories.json` + `databases.json` with corresponding Zod schemas.

### Pattern 3: Inline `<script>` for Table Sorting (Established -- Mandatory)

**What:** Data attributes on `<tr>` elements, `<button>` sort headers, `astro:page-load` event listener for ClientRouter compatibility, ARIA sort attributes.
**Precedent:** `ScoringTable.astro` lines 133-189.
**Apply to:** Database comparison table, category overview table.

### Pattern 4: Dynamic Routes for Detail Pages (Established -- Use)

**What:** `[slug].astro` or `[...slug].astro` pages that `getStaticPaths()` generates from content collections.
**Precedent:** `/beauty-index/[id]/` detail pages for individual languages.
**Apply to:** `/database-compass/[category]/` and `/database-compass/[category]/[db]/` detail pages.

---

## Sources

- **Codebase analysis** (HIGH confidence):
  - `src/lib/beauty-index/radar-math.ts` -- verified `radarPolygonPoints()` and `hexagonRingPoints()` accept variable axis counts
  - `src/components/beauty-index/RadarChart.astro` -- verified build-time SVG rendering pattern
  - `src/components/beauty-index/ScoringTable.astro` -- verified inline sortable table with ARIA accessibility
  - `src/content.config.ts` -- verified `file()` loader usage with flat JSON arrays
  - `src/data/beauty-index/languages.json` -- verified flat array data format
  - `src/lib/beauty-index/schema.ts` -- verified Zod schema pattern
  - `package.json` -- verified all existing dependencies

- **Astro documentation** (HIGH confidence):
  - [Content collections guide](https://docs.astro.build/en/guides/content-collections/) -- `file()` loader, `parser` property for nested JSON
  - [Content Loader API Reference](https://docs.astro.build/en/reference/content-loader-reference/) -- `parser` callback type signature

- **DB-Engines** (HIGH confidence):
  - [Ranking categories](https://db-engines.com/en/ranking_categories) -- 20 database model categories, 433+ database systems tracked

- **npm registry** (HIGH confidence):
  - `sortable-tablesort` v4.1.7 -- 899 bytes gzipped, zero dependencies, no TypeScript types
  - `table-sort-js` v1.22.3 -- ~3kb, zero dependencies, no TypeScript types
  - `tablesort` v5.7.0 -- ~5kb, zero dependencies

- **SVG radar chart patterns** (HIGH confidence):
  - [Paul Scanlon: SVG Radar Chart using Astro](https://www.paulie.dev/posts/2023/10/how-to-create-an-svg-radar-chart/) -- confirms pure trigonometry approach for any axis count
  - [CSS-Tricks: Charts with SVG](https://css-tricks.com/how-to-make-charts-with-svg/) -- confirms no library needed for simple chart types

---
*Stack research for: Database Compass (Database Model Explorer)*
*Researched: 2026-02-21*
*Key finding: ZERO new dependencies. The existing Astro 5 stack (content collections, build-time SVG via radar-math.ts, inline sortable tables via ScoringTable.astro pattern, Satori+Sharp OG images) provides everything needed. The radar-math.ts functions already support variable axis counts -- pass 8 values and you get an octagon. Data should use two flat JSON files (categories + databases) matching the existing languages.json pattern. Do NOT add D3, Chart.js, sortable-tablesort, React islands for static content, or any database/CMS infrastructure.*
