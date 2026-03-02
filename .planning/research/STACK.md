# Stack Research: Cloud Architecture Patterns Visual Encyclopedia

**Domain:** Interactive cloud architecture pattern diagrams with dimensional scoring, radar charts, and decision support filtering -- added as a new content pillar to an existing Astro 5 portfolio site
**Researched:** 2026-03-01
**Confidence:** HIGH

## Executive Summary

Zero new npm packages are required. Every capability needed for the Cloud Architecture Patterns pillar -- interactive SVG architecture diagrams with hover/click, multi-dimensional scoring with radar charts, and decision support filtering -- already exists in the installed stack and has proven patterns in the codebase.

The three core needs map directly to existing, battle-tested implementations:

1. **Interactive architecture diagrams** -- Build-time SVG generators (13+ in `src/lib/eda/svg-generators/`) provide the custom SVG pattern. CSS `:hover`/`:focus` pseudo-classes plus inline `<script>` event handlers (proven in `CompassScoringTable.astro`) deliver interactivity without React hydration. For complex architecture diagrams that need pan/zoom/drag, `@xyflow/react@12.10.1` with `@dagrejs/dagre@2.0.4` is already installed and proven in `K8sResourceGraph.tsx`.

2. **Radar chart scoring** -- `radar-math.ts` already provides `polarToCartesian()`, `radarPolygonPoints()`, and `hexagonRingPoints()` for any N-axis radar chart. `CompassRadarChart.astro` renders an 8-axis octagonal chart at build time with zero client JS. This exact pattern works for architecture pattern scoring with different dimension labels and axis counts.

3. **Decision support filtering** -- `UseCaseFilter.tsx` (React island with `client:load`) + `compassFilterStore.ts` (nanostores atom with toggle/selectAll/selectNone) + data-attribute DOM filtering is the proven pattern. The Beauty Index uses the same pattern via `languageFilterStore.ts`. Direct reuse with different category labels.

## Existing Stack (Zero New npm Dependencies)

### Interactive SVG Architecture Diagrams -- Two Proven Approaches

**Approach A: Build-time SVG + CSS/inline-script interactivity (RECOMMENDED for architecture diagrams)**

| Component | Version | Location | How It Works |
|-----------|---------|----------|--------------|
| `plot-base.ts` | -- | `src/lib/eda/svg-generators/plot-base.ts` | Shared SVG foundation: CSS-variable colors, viewBox, margins, axes. Dark/light theme via `var()` references |
| 13+ SVG generators | -- | `src/lib/eda/svg-generators/*.ts` | TypeScript functions that return SVG strings. Build-time only, zero JS shipped |
| `CompassRadarChart.astro` | -- | `src/components/db-compass/CompassRadarChart.astro` | Build-time Astro SVG component using `radar-math.ts`. Accessible (`role="img"`, `aria-label`) |
| `CompassScoringTable.astro` | -- | `src/components/db-compass/CompassScoringTable.astro` | Inline `<script>` with `astro:page-load` event for sort interactivity, `aria-sort`, keyboard-accessible buttons. Pattern for adding hover/click to static SVG. |

**Why this approach for architecture diagrams:** Architecture pattern diagrams (e.g., Circuit Breaker, CQRS, Saga) are static educational illustrations. They do not change shape based on user input -- they only need hover-to-highlight and click-to-reveal-detail. CSS `:hover`/`:focus-within` pseudo-classes on SVG `<g>` groups plus an inline `<script>` for click-to-show-panel is the lightest-weight solution. Ships near-zero JS.

**Approach B: @xyflow/react for complex node-edge graphs (AVAILABLE if needed)**

| Component | Version | Location | How It Works |
|-----------|---------|----------|--------------|
| `@xyflow/react` | 12.10.1 | `package.json` | React Flow v12 -- interactive node-edge graphs with pan, zoom, drag |
| `@dagrejs/dagre` | 2.0.4 | `package.json` | Automatic hierarchical layout for directed graphs |
| `K8sResourceGraph.tsx` | -- | `src/components/tools/k8s-results/K8sResourceGraph.tsx` | Complete example: custom nodes, custom edges, dagre layout, legend, lazy-loaded |
| `K8sResourceNode.tsx` | -- | `src/components/tools/k8s-results/K8sResourceNode.tsx` | Custom node with `Handle` components, color-coded categories, phantom node styling |

**When to use Approach B:** Only if a specific architecture pattern diagram requires user-draggable nodes or dynamic node/edge creation (e.g., an interactive "build your own microservice topology" tool). For the 10-15 static educational pattern diagrams, Approach A is simpler and ships less JS.

### Radar Chart Scoring -- Already Solved

| Component | Version | Location | How It Works |
|-----------|---------|----------|--------------|
| `radar-math.ts` | -- | `src/lib/beauty-index/radar-math.ts` | Pure TS utility. `polarToCartesian()`, `radarPolygonPoints()`, `hexagonRingPoints()`, `generateRadarSvgString()`. N-axis support (not hardcoded to any specific count). |
| `CompassRadarChart.astro` | -- | `src/components/db-compass/CompassRadarChart.astro` | 8-axis octagonal build-time radar chart. Uses `DIMENSIONS` array for axis count. Ships zero client JS. |
| `dimensions.ts` | -- | `src/lib/db-compass/dimensions.ts` | Typed `Dimension` interface with `key`, `symbol`, `name`, `shortName`, `description`, color palette. Exact model for architecture pattern dimensions. |
| `schema.ts` | -- | `src/lib/db-compass/schema.ts` | Zod schema with `dimensionScoreSchema` (int 1-10), `scoresSchema`, `dimensionScores()` helper. Reusable pattern for pattern scoring. |

**Key insight:** `radar-math.ts` is framework-agnostic (no DOM, no React, no Astro deps). It works in Astro components (build-time SVG), in Satori (OG image generation), and would work in React islands if interactive radar comparison is needed. The function `hexagonRingPoints()` already takes `numSides` as a parameter -- it renders pentagons, hexagons, heptagons, octagons, or any polygon shape based on the number of scoring dimensions chosen.

### Decision Support Filtering -- Already Solved

| Component | Version | Location | How It Works |
|-----------|---------|----------|--------------|
| `nanostores` | 1.1.0 | `package.json` | Atom-based state for filter selections. `atom<Set<string>>` pattern. |
| `@nanostores/react` | 1.0.0 | `package.json` | React bindings for nanostores. `useStore()` hook. |
| `compassFilterStore.ts` | -- | `src/stores/compassFilterStore.ts` | `activeCategories` atom + `initCategories()`, `toggleCategory()`, `selectAllCategories()`, `selectNoCategories()`. |
| `UseCaseFilter.tsx` | -- | `src/components/db-compass/UseCaseFilter.tsx` | React island (`client:load`). Pill buttons with active/inactive states. DOM filtering via `data-*` attributes. |
| `use-case-categories.ts` | -- | `src/lib/db-compass/use-case-categories.ts` | Category definition with `id`, `label`, `useCases[]` mapping. `modelCategories()` lookup function. |
| `languageFilterStore.ts` | -- | `src/stores/languageFilterStore.ts` | Identical pattern to compassFilterStore: `visibleLanguages` atom + toggle/selectAll/selectNone. |

**Proven integration pattern:** The DB Compass overview page (`src/pages/db-compass/index.astro`) renders all model cards server-side with `data-model-id` and `data-use-cases` attributes. The React island (`UseCaseFilter.tsx` with `client:load`) reads these data attributes and toggles `display: none` on cards that don't match the filter. This requires no client-side data fetching, no API calls, and no re-rendering of the card grid. The Cloud Architecture Patterns filter can use the identical approach.

### Pattern Comparison -- Two Existing Approaches

**Side-by-side radar chart comparison:**
The `generateRadarSvgString()` function in `radar-math.ts` generates standalone SVG strings. Two patterns can be compared by rendering two radar SVGs side-by-side with the same axis labels. No additional library needed.

**Tabular comparison:**
`CompassScoringTable.astro` is a sortable table with per-dimension score columns. Inline `<script>` handles sort, `aria-sort` provides accessibility. This exact pattern works for pattern score comparison.

**Interactive overlay comparison (if desired):**
Render two `<polygon>` elements on the same radar chart SVG. This is a pure SVG technique -- layer two `radarPolygonPoints()` outputs with different fill colors/opacities on the same axes. Zero new dependencies.

### Content Data Layer -- Existing Patterns

| Pattern | Location | Relevance |
|---------|----------|-----------|
| Content collection + Zod schema + JSON `file()` loader | `src/data/db-compass/models.json` + `schema.ts` | Architecture patterns should use the same pattern: `src/data/cloud-patterns/patterns.json` with a Zod schema |
| TypeScript content objects | `src/lib/eda/technique-content.ts` | Alternative for smaller datasets, but JSON content collection is better for 10-15 patterns (separates data from code) |
| `getStaticPaths()` + content collection | `src/pages/db-compass/[slug].astro` | Exact pattern for generating `/cloud-patterns/[slug]/` pages |

### OG Image Generation -- Already Solved

| Component | Version | Location | How It Works |
|-----------|---------|----------|--------------|
| `satori` | 0.19.2 | `package.json` | JSX-to-SVG renderer for OG images at build time |
| `sharp` | 0.34.5 | `package.json` | SVG-to-PNG conversion |
| `radar-math.ts` | -- | `src/lib/beauty-index/radar-math.ts` | `generateRadarSvgString()` already designed for Satori embedding via base64 data URI |
| DB Compass OG endpoint | -- | `src/pages/open-graph/db-compass/[slug].png.ts` | Complete example of per-item OG image generation with radar chart embedding |

## Recommended Stack Changes

### Zero -- No New Packages

This milestone requires no `npm install` commands. Every capability maps to an existing dependency:

| Need | Existing Solution | Status |
|------|-------------------|--------|
| Custom SVG architecture diagrams | `plot-base.ts` pattern + new TypeScript SVG generators | Build new generators following existing pattern |
| SVG hover/click interactivity | CSS `:hover`/`:focus` + inline `<script>` (per `CompassScoringTable.astro`) | Write new inline scripts |
| N-axis radar charts | `radar-math.ts` (already N-axis capable) | Direct reuse, no modifications needed |
| Radar chart Astro component | Clone `CompassRadarChart.astro` pattern with new `DIMENSIONS` | New component, same pattern |
| Dimensional scoring schema | Clone `db-compass/schema.ts` + `dimensions.ts` pattern | New files, same Zod + TypeScript pattern |
| Use-case/scenario filtering | Clone `UseCaseFilter.tsx` + `compassFilterStore.ts` pattern | New React island, same nanostores pattern |
| Data-attribute DOM filtering | Proven in `UseCaseFilter.tsx` | Same technique |
| Content collection with JSON | Proven in `db-compass/models.json` | New JSON file + Zod schema |
| Build-time OG images with radar | Proven in `open-graph/db-compass/[slug].png.ts` | New endpoint, same satori+sharp pattern |
| Dark/light theme SVG colors | `PALETTE` in `plot-base.ts` using CSS `var()` | Direct reuse |
| Accessible SVG (`role="img"`, `aria-label`) | All existing SVG generators | Follow same pattern |

## What Already Exists and Must NOT Be Re-Added

| Technology | Status | Do NOT |
|------------|--------|--------|
| `@xyflow/react@12.10.1` | Installed, proven in K8s analyzer tool | Do not add Mermaid.js, GoJS, JointJS, or any other diagramming library |
| `@dagrejs/dagre@2.0.4` | Installed, proven for auto-layout | Do not add ELK, Cola.js, or other layout engines |
| `d3-shape@3.2.0` | Installed for path generation | Do not add Chart.js, Recharts, Nivo, or Victory |
| `gsap@3.14.2` | Installed for animations | Do not add Framer Motion, React Spring, or anime.js |
| `nanostores@1.1.0` + `@nanostores/react@1.0.0` | Installed, proven for filter state | Do not add Zustand, Jotai, Redux, or any other state manager |
| `radar-math.ts` | Pure TS, N-axis, works in Astro + Satori | Do not add a radar chart library (react-chartjs-2, visx, etc.) |
| Build-time SVG generators | 13+ generators in `svg-generators/` | Do not add SVG.js, Snap.svg, or runtime SVG manipulation libraries |
| `satori@0.19.2` + `sharp@0.34.5` | Installed, proven for OG images | Do not add @vercel/og or Puppeteer for OG generation |
| `tailwindcss@3.4.19` | Installed with typography plugin | Do not add any CSS framework or utility library |
| `astro-expressive-code@0.41.6` | Installed for syntax highlighting | Do not add Shiki, Prism, or highlight.js |

## What NOT to Add

### No Diagramming Libraries

| Tempting Addition | Why NOT | Use Instead |
|-------------------|---------|-------------|
| `mermaid` | Ships ~2MB of JS to client. Architecture diagrams are static educational content. Mermaid's auto-layout removes artistic control over diagram composition. | Custom TypeScript SVG generators (same pattern as 13+ existing generators). Full control over layout, colors, theme support. |
| `excalidraw` | Runtime dependency, ~1.5MB. Hand-drawn style inappropriate for architecture reference material. | Build-time SVG with clean professional styling. |
| `react-flow` (adding another instance) | Already installed as `@xyflow/react@12.10.1`. A second instance would be a version conflict. | Use existing `@xyflow/react` if node-edge graph interaction is truly needed. |
| `gojs` | Commercial license ($5K+). Overkill for static diagrams. | Custom SVG generators. |
| `jointjs` | Heavyweight (~500KB). Runtime diagramming engine designed for editors, not viewers. | CSS-interactive build-time SVG. |

### No Chart Libraries

| Tempting Addition | Why NOT | Use Instead |
|-------------------|---------|-------------|
| `recharts` / `visx` / `nivo` | Each ships React components + D3 bundles. Radar charts already solved with 170 lines of pure TypeScript in `radar-math.ts`. Adding a chart library for one chart type wastes bundle. | `radar-math.ts` + Astro component (or React island for interactive comparison). |
| `chart.js` + `react-chartjs-2` | Canvas-based. No SVG output for build-time rendering or OG images. Breaks the SVG-first pattern. | `radar-math.ts` generates SVG strings usable in both Astro components and Satori OG images. |
| `d3` (full bundle) | Already using selective D3 micro-bundles (`d3-shape`, `d3-scale`, `d3-selection`, etc.). The full `d3` bundle is ~280KB. | Continue with selective imports of only the D3 modules needed. |

### No Additional State Management

| Tempting Addition | Why NOT | Use Instead |
|-------------------|---------|-------------|
| `zustand` / `jotai` / `@tanstack/query` | Nanostores already handles filter state across components with `atom<Set<string>>`. Two proven filter stores exist (`compassFilterStore.ts`, `languageFilterStore.ts`). Adding a second state library creates inconsistency. | New nanostore file per the existing pattern: `src/stores/patternFilterStore.ts`. |
| `url-search-params` state sync | Over-engineering for a filter UI with 5-8 categories. The DB Compass filter works without URL sync and users don't bookmark filter states. | Keep it simple: nanostore atom, initialize all categories active on page load. |

### No Architecture Changes

| Tempting Refactor | Why NOT | Impact |
|-------------------|---------|--------|
| Move `radar-math.ts` from `beauty-index/` to a shared `lib/` location | It is already imported cross-pillar (DB Compass imports from `beauty-index/`). Moving it breaks existing imports. The current location works. | Unnecessary churn. If it bothers you, create a re-export barrel file, but don't move the original. |
| Create a generic `ScoringDimensionSystem` abstraction | DB Compass and Cloud Patterns have different dimension counts, different semantics, and different scoring criteria. A premature abstraction couples them. | Duplicate the pattern (schema.ts, dimensions.ts) in a new `cloud-patterns/` directory. Two copies is fine for two distinct domains. |
| Use MDX files for pattern content instead of JSON | DB Compass uses JSON content collection successfully for structured data. Architecture pattern data (scores, dimensions, categories) is structured. Prose content (descriptions, when-to-use) embeds naturally in JSON strings. MDX adds unnecessary build complexity. | JSON content collection with Zod schema, matching DB Compass pattern. |

## New Files to Create (Architecture, Not Dependencies)

These are the files that need to be created, using existing patterns:

| New File | Modeled After | Purpose |
|----------|---------------|---------|
| `src/lib/cloud-patterns/schema.ts` | `src/lib/db-compass/schema.ts` | Zod schema for pattern data (scores, categories, descriptions) |
| `src/lib/cloud-patterns/dimensions.ts` | `src/lib/db-compass/dimensions.ts` | Dimension definitions, colors, symbols for pattern scoring axes |
| `src/lib/cloud-patterns/categories.ts` | `src/lib/db-compass/use-case-categories.ts` | Pattern category definitions for filtering (Resilience, Data Management, Messaging, etc.) |
| `src/data/cloud-patterns/patterns.json` | `src/data/db-compass/models.json` | Content collection data file with all 10-15 patterns |
| `src/components/cloud-patterns/PatternRadarChart.astro` | `src/components/db-compass/CompassRadarChart.astro` | Build-time radar chart for pattern scoring |
| `src/components/cloud-patterns/PatternFilter.tsx` | `src/components/db-compass/UseCaseFilter.tsx` | React island for category filtering |
| `src/stores/patternFilterStore.ts` | `src/stores/compassFilterStore.ts` | Nanostores atom for filter state |
| `src/lib/cloud-patterns/svg-generators/*.ts` | `src/lib/eda/svg-generators/*.ts` | Architecture diagram SVG generators (one per pattern) |
| `src/pages/cloud-patterns/[slug].astro` | `src/pages/db-compass/[slug].astro` | Pattern detail page with radar chart, diagram, scoring |
| `src/pages/cloud-patterns/index.astro` | `src/pages/db-compass/index.astro` | Overview page with filter, card grid, comparison table |
| `src/pages/open-graph/cloud-patterns/[slug].png.ts` | `src/pages/open-graph/db-compass/[slug].png.ts` | Per-pattern OG images with embedded radar chart |

## SVG Interactivity Strategy (No New Dependencies)

Architecture diagrams need hover-to-highlight and click-to-reveal-detail. Here is how to implement this with existing tech:

### CSS-only hover highlighting on SVG groups

```html
<!-- Build-time SVG output from TypeScript generator -->
<svg viewBox="0 0 800 500" role="img" aria-label="Circuit Breaker pattern architecture diagram">
  <!-- Each component is a <g> with a data attribute and class -->
  <g class="arch-component" data-component="client" tabindex="0">
    <rect ... />
    <text ...>Client</text>
  </g>
  <g class="arch-component" data-component="circuit-breaker" tabindex="0">
    <rect ... />
    <text ...>Circuit Breaker</text>
  </g>
  <!-- Connection arrows between components -->
  <g class="arch-connection" data-from="client" data-to="circuit-breaker">
    <path ... />
  </g>
</svg>
```

### CSS for hover/focus interactivity (zero JS)

```css
.arch-component { cursor: pointer; }
.arch-component rect { transition: stroke-width 0.2s, filter 0.2s; }
.arch-component:hover rect,
.arch-component:focus-within rect {
  stroke-width: 3;
  filter: drop-shadow(0 0 6px var(--color-accent));
}
```

### Inline script for click-to-show-detail (minimal JS)

```html
<script>
  document.addEventListener('astro:page-load', () => {
    const components = document.querySelectorAll<SVGGElement>('.arch-component');
    const detailPanel = document.getElementById('component-detail');
    components.forEach(comp => {
      comp.addEventListener('click', () => {
        const id = comp.dataset.component;
        // Show detail panel for this component
        // Detail content is pre-rendered in hidden divs with data-detail-for="..."
        document.querySelectorAll('[data-detail-for]').forEach(el => {
          (el as HTMLElement).hidden = el.getAttribute('data-detail-for') !== id;
        });
      });
    });
  });
</script>
```

This pattern mirrors `CompassScoringTable.astro`'s approach: build-time HTML + inline `<script>` for lightweight interactivity.

## Version Compatibility

No new packages means no new compatibility concerns. All versions verified from installed `node_modules`:

| Package | Installed | Relevance to This Milestone |
|---------|-----------|---------------------------|
| `astro` | 5.17.1 | Content collections, `getStaticPaths()`, `client:load` islands, inline `<script>` |
| `react` | 19.2.4 | React islands for filter component |
| `nanostores` | 1.1.0 | Filter state atom |
| `@nanostores/react` | 1.0.0 | `useStore()` in filter component |
| `@xyflow/react` | 12.10.1 | Available for complex node-edge diagrams (not needed for most patterns) |
| `@dagrejs/dagre` | 2.0.4 | Available for auto-layout (not needed for hand-crafted diagrams) |
| `d3-shape` | 3.2.0 | Available for complex SVG paths if needed |
| `d3-scale` | 4.0.2 | Available for score normalization if needed |
| `gsap` | 3.14.2 | Available for entrance animations on diagram reveal |
| `satori` | 0.19.2 | OG image generation with radar chart |
| `sharp` | 0.34.5 | SVG-to-PNG for OG images |
| `tailwindcss` | 3.4.19 | Page layout, responsive design, typography |
| `typescript` | ^5.9.3 | SVG generators, schemas, dimension types |
| `vitest` | ^4.0.18 | Unit tests for SVG generators and scoring math |

## Integration Points Summary

| Integration | How | Existing Proof |
|-------------|-----|----------------|
| Content collection with Zod validation | `astro:content` + `file()` loader + Zod schema | DB Compass `models.json` |
| Build-time radar chart SVG | `radar-math.ts` imported in Astro component | `CompassRadarChart.astro` |
| React filter island with nanostores | `client:load` + atom + DOM data-attribute filtering | `UseCaseFilter.tsx` + `compassFilterStore.ts` |
| Sortable comparison table | Inline `<script>` with data-attribute sorting | `CompassScoringTable.astro` |
| Per-item OG images with radar | Satori + radar SVG string + Sharp | `open-graph/db-compass/[slug].png.ts` |
| Dark/light theme SVG | CSS custom properties in SVG fills/strokes | `PALETTE` in `plot-base.ts`, all EDA SVG generators |
| Accessible SVG | `role="img"`, `aria-label`, `tabindex="0"` on interactive groups | All existing SVG generators |
| Custom SVG architecture diagrams | TypeScript generator functions returning SVG strings | 13+ generators in `svg-generators/` |

## Stack Patterns by Variant

**If pattern diagrams are purely educational (hover-highlight, click-detail):**
- Use build-time SVG generators + CSS `:hover`/`:focus` + inline `<script>`
- Because this ships near-zero JS and matches the EDA SVG generator pattern

**If a specific diagram needs user-draggable nodes (e.g., "design your topology"):**
- Use `@xyflow/react` with custom nodes (already installed)
- Because it is proven in `K8sResourceGraph.tsx` and lazy-loadable via `React.lazy()`

**If pattern comparison needs interactive overlay (two patterns on one radar):**
- Use a React island with `radar-math.ts` for dynamic polygon rendering
- Because `radar-math.ts` is framework-agnostic and works in React components

**If filtering needs URL persistence (bookmarkable filter states):**
- Extend the nanostore pattern to sync with `URLSearchParams`
- Because this is a small addition to the existing atom pattern, not a new library

## Sources

- Existing codebase: `src/lib/beauty-index/radar-math.ts` -- 171-line pure TS radar math utility. Framework-agnostic. N-axis polygon support. Used by both Beauty Index and DB Compass. HIGH confidence.
- Existing codebase: `src/components/db-compass/CompassRadarChart.astro` -- Build-time 8-axis octagonal radar chart Astro component. Zero client JS. Imports from `radar-math.ts`. HIGH confidence.
- Existing codebase: `src/lib/db-compass/schema.ts` -- Zod schema with `dimensionScoreSchema` (int 1-10), `scoresSchema`, `totalScore()`, `dimensionScores()`. Direct model for architecture pattern scoring schema. HIGH confidence.
- Existing codebase: `src/lib/db-compass/dimensions.ts` -- `Dimension` interface with `key`, `symbol`, `name`, `shortName`, `description`, color palette. Direct model for pattern scoring dimensions. HIGH confidence.
- Existing codebase: `src/components/db-compass/UseCaseFilter.tsx` -- React island filter with nanostores + DOM data-attribute filtering. 103 lines. Direct model for pattern category filtering. HIGH confidence.
- Existing codebase: `src/stores/compassFilterStore.ts` -- Nanostores `atom<Set<string>>` pattern with init/toggle/selectAll/selectNone. 31 lines. Direct model for pattern filter store. HIGH confidence.
- Existing codebase: `src/components/db-compass/CompassScoringTable.astro` -- Sortable table with inline `<script>`, `aria-sort`, keyboard accessibility. 222 lines. Direct model for pattern comparison table. HIGH confidence.
- Existing codebase: `src/components/tools/k8s-results/K8sResourceGraph.tsx` -- React Flow graph with custom nodes, dagre layout, lazy-loading. 202 lines. Available for complex interactive diagrams. HIGH confidence.
- Existing codebase: `src/lib/eda/svg-generators/plot-base.ts` -- Shared SVG foundation with CSS-variable `PALETTE`, `PlotConfig`, `svgOpen()`. 141 lines. Direct model for architecture diagram SVG generators. HIGH confidence.
- Existing codebase: `src/pages/db-compass/index.astro` -- Overview page integrating filter, card grid, scoring table, spectrum. 107 lines. Direct model for patterns overview page. HIGH confidence.
- Existing codebase: `package.json` -- All package versions verified from installed `node_modules` on 2026-03-01. HIGH confidence.

---
*Stack research for: Cloud Architecture Patterns Visual Encyclopedia*
*Researched: 2026-03-01*
