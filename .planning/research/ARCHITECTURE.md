# Architecture Research: EDA Visual Encyclopedia

**Domain:** 90+ page EDA Visual Encyclopedia pillar integrated into an existing Astro 5 portfolio site
**Researched:** 2026-02-24
**Confidence:** HIGH -- based on direct codebase analysis of existing Beauty Index (v1.3), Database Compass (v1.5), and tool patterns (v1.4/v1.6/v1.7), verified Astro 5 Content Layer API patterns, confirmed D3 modular architecture, KaTeX/remark-math integration documented

---

## System Overview

```
Existing Site Layer (MODIFY: extend, do not replace)
  +-- Layout.astro (ADD: KaTeX CSS via <slot name="head">)
  +-- Header.astro (MODIFY: add "EDA" nav link)
  +-- content.config.ts (MODIFY: add edaTechniques + edaDistributions collections)
  +-- og-image.ts (MODIFY: add EDA OG image generators)
  +-- Existing Collections: blog, languages, dbModels (UNCHANGED)
  +-- Existing Stores: all existing stores (UNCHANGED)

NEW: EDA Visual Encyclopedia Layer
  +-- Content Data: src/data/eda/
  |   +-- techniques.json          (90+ technique metadata entries)
  |   +-- distributions.json       (19 distribution parameter configs)
  |   +-- datasets/                (CSV/JSON sample datasets for case studies)
  +-- Core Lib: src/lib/eda/
  |   +-- schema.ts                (Zod schemas for technique + distribution data)
  |   +-- svg-generators/          (TypeScript functions generating SVG strings)
  |   |   +-- plot-base.ts         (shared SVG primitives: axes, grid, labels, palette)
  |   |   +-- line-plot.ts         (run-sequence, autocorrelation, spectral)
  |   |   +-- scatter-plot.ts      (scatter, lag, Q-Q, probability)
  |   |   +-- bar-plot.ts          (histogram, bar chart, bihistogram)
  |   |   +-- box-plot.ts          (box plot, star plot, block plot)
  |   |   +-- contour-plot.ts      (contour, DOE contour)
  |   |   +-- distribution-curve.ts(PDF/CDF curve rendering for distributions)
  |   |   +-- composite-plot.ts    (4-plot, 6-plot: multi-panel layouts)
  |   +-- math/
  |   |   +-- statistics.ts        (mean, std, quantiles, correlation, autocorrelation)
  |   |   +-- distributions.ts     (PDF/CDF formulas for 19 distributions)
  |   |   +-- datasets.ts          (sample data generators: random, uniform, etc.)
  |   +-- categories.ts            (section hierarchy, slugs, ordering)
  |   +-- related-techniques.ts    (cross-linking logic between techniques)
  +-- Components: src/components/eda/
  |   +-- TechniquePage.astro      (shared layout for all technique pages)
  |   +-- PlotContainer.astro      (responsive SVG wrapper with a11y)
  |   +-- PlotSvg.astro            (build-time SVG renderer -- Tier A)
  |   +-- PlotVariantSwap.astro    (pre-rendered SVG variants + vanilla JS -- Tier B)
  |   +-- FormulaBlock.astro       (KaTeX formula display wrapper)
  |   +-- PythonCode.astro         (Python code block with expressive-code)
  |   +-- InterpretationPanel.astro(interpretation guide for plot variants)
  |   +-- TechniqueCard.astro      (card for landing page grid)
  |   +-- SectionNav.astro         (section-aware prev/next navigation)
  |   +-- CategoryFilter.tsx       (React island for technique filtering)
  |   +-- DistributionExplorer.tsx  (D3 micro-bundle -- Tier C, 19 pages only)
  |   +-- EdaJsonLd.astro          (JSON-LD for EDA pages)
  |   +-- EdaShareControls.astro   (share + download SVG-to-PNG)
  +-- Pages: src/pages/eda/
  |   +-- index.astro              (landing page with filterable grid)
  |   +-- foundations/
  |   |   +-- [slug].astro         (6 foundation pages from MDX)
  |   +-- techniques/
  |   |   +-- [slug].astro         (30 graphical technique pages)
  |   +-- quantitative/
  |   |   +-- [slug].astro         (18 quantitative technique pages)
  |   +-- distributions/
  |   |   +-- [slug].astro         (19 distribution pages with D3 explorer)
  |   +-- case-studies/
  |   |   +-- [slug].astro         (9 case study pages)
  |   +-- reference/
  |       +-- [slug].astro         (4 reference pages)
  +-- OG Images: src/pages/open-graph/eda/
      +-- index.png.ts             (EDA overview OG image)
      +-- [slug].png.ts            (per-technique OG images)
```

---

## Key Architectural Decisions

### Decision 1: Dual Content Collection Strategy (JSON data + MDX content)

**Pattern:** Use `file()` loader for structured technique metadata (JSON) and `glob()` loader for prose-heavy pages (MDX).

**Why:** The 90+ EDA pages have two fundamentally different content types:

1. **Structured metadata** (technique name, category, section ref, plot config, related techniques, parameter ranges, formulas) -- this is best stored as JSON with Zod validation, matching the proven Beauty Index `languages.json` and DB Compass `models.json` patterns.

2. **Prose content** (interpretation text, step-by-step analysis, case study narratives) -- this is best stored as MDX files, matching the existing blog collection pattern, allowing rich Markdown with embedded Astro components.

**Implementation in `content.config.ts`:**

```typescript
import { defineCollection, z } from 'astro:content';
import { glob, file } from 'astro/loaders';
import { edaTechniqueSchema, edaDistributionSchema } from './lib/eda/schema';

// Structured metadata for all EDA techniques (JSON)
const edaTechniques = defineCollection({
  loader: file('src/data/eda/techniques.json'),
  schema: edaTechniqueSchema,
});

// Distribution parameter configs (JSON)
const edaDistributions = defineCollection({
  loader: file('src/data/eda/distributions.json'),
  schema: edaDistributionSchema,
});

// Prose-heavy pages: foundations, case studies (MDX)
const edaPages = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/data/eda/pages' }),
  schema: z.object({
    title: z.string(),
    section: z.string(),
    category: z.enum(['foundations', 'case-studies', 'reference']),
    description: z.string(),
    order: z.number(),
    nistRef: z.string().optional(),
  }),
});

export const collections = {
  blog, languages, dbModels,  // existing
  edaTechniques, edaDistributions, edaPages,  // new
};
```

**Why not put everything in JSON?** The foundation pages (6) and case study pages (9) have multi-paragraph interpretive prose that would be unwieldy as JSON string fields. MDX gives them proper authoring ergonomics with embedded components. The technique pages (30 graphical + 18 quantitative) are structured data with generated plots -- JSON metadata is the right format.

**Why not put everything in MDX?** The technique metadata (plot configs, formula data, parameter ranges, related links) is structured data that needs programmatic access for build-time SVG generation, landing page filtering, cross-linking, and OG image generation. Embedding this in MDX frontmatter would work but is harder to validate, query, and cross-reference compared to a typed JSON collection.

**Confidence:** HIGH -- this dual pattern is proven in the codebase (blog uses glob/MDX, Beauty Index and DB Compass use file/JSON).

---

### Decision 2: Build-Time SVG Generation in TypeScript (Not Python)

**Pattern:** Generate all plot SVGs at build time using TypeScript functions that produce SVG strings, rendered directly in Astro components. No Python build scripts.

**Why:** The existing site already has a proven pattern for build-time SVG generation:

- `radar-math.ts` generates SVG polygon points and full SVG strings for radar charts
- `spectrum-math.ts` generates complexity spectrum SVGs for DB Compass
- `RankingBarChart.astro` generates bar chart SVGs at build time
- `og-image.ts` uses Satori to render complex layouts as PNGs from SVG-like JSX trees

Python SVG generation would require:
- A Python runtime in the build environment (GitHub Actions needs extra setup)
- A build step coordination layer (run Python scripts before Astro build)
- File system coordination between Python output and Astro input
- Two languages for the same concern

TypeScript SVG generation keeps everything in one language, runs in the same build process, and the data flows directly from content collections through TypeScript functions to Astro components -- zero file system coordination needed.

**SVG generator architecture:**

```typescript
// src/lib/eda/svg-generators/plot-base.ts
export interface PlotConfig {
  width: number;
  height: number;
  padding: { top: number; right: number; bottom: number; left: number };
  palette: typeof QUANTUM_PALETTE;
}

export const QUANTUM_PALETTE = {
  primary: '#c44b20',      // accent color
  secondary: '#6366f1',    // accent-secondary
  grid: '#e5ddd5',         // same as radar chart grid
  text: '#5a5a5a',
  background: 'transparent',
  series: ['#c44b20', '#6366f1', '#22c55e', '#f59e0b', '#ec4899'],
} as const;

export function svgAxis(config: PlotConfig, xLabel: string, yLabel: string): string {
  // Returns SVG <g> elements for X and Y axes with labels
}

export function svgGridLines(config: PlotConfig, xTicks: number[], yTicks: number[]): string {
  // Returns SVG <g> with grid lines
}

// src/lib/eda/svg-generators/line-plot.ts
export function generateRunSequencePlot(
  data: number[],
  config: Partial<PlotConfig>,
  options?: { showMean?: boolean; showBounds?: boolean }
): string {
  // Returns complete <svg> string
}

export function generateAutocorrelationPlot(
  data: number[],
  maxLag: number,
  config: Partial<PlotConfig>
): string {
  // Returns complete <svg> string with correlation bars
}
```

**This mirrors `radar-math.ts` exactly**: pure TypeScript functions, zero DOM dependencies, usable in both Astro components and Satori/OG image contexts.

**Confidence:** HIGH -- proven pattern in this codebase across 3 features.

---

### Decision 3: Three-Tier Interactivity Architecture

**Pattern:** Categorize all 90+ pages into three tiers based on interactivity needs. Each tier uses the lightest possible technology.

| Tier | Pages | Technology | JS Budget | Pattern |
|------|-------|-----------|-----------|---------|
| **A: Static SVG** | ~60 (70%) | Build-time SVG + ~2KB vanilla JS for hover tooltips | ~2KB | Astro component renders SVG at build time; optional inline `<script>` for mouseover data display |
| **B: Variant Swap** | ~12 (14%) | Pre-rendered SVG variants + vanilla JS selector | ~3KB | Multiple SVGs generated at build time (e.g., histogram with different bin counts); vanilla JS swaps `display: none/block` |
| **C: D3 Explorer** | 19 (22%) | D3 micro-bundle | ~30KB | React island with D3 for distribution parameter sliders; `client:visible` loading |

**Tier A -- Static SVG (foundations, most graphical techniques, quantitative techniques, reference):**

```astro
---
// [slug].astro for a graphical technique
import { getCollection, getEntry } from 'astro:content';
import { generateRunSequencePlot } from '../../lib/eda/svg-generators/line-plot';
import PlotContainer from '../../components/eda/PlotContainer.astro';

const technique = Astro.props.technique;
const svgString = generateRunSequencePlot(technique.sampleData, {
  width: 600, height: 400
});
---
<PlotContainer
  svg={svgString}
  caption={technique.plotCaption}
  altText={technique.plotAltText}
/>
```

Vanilla JS hover (not React, not D3) via inline `<script>`:

```astro
<script>
  document.querySelectorAll('[data-plot-point]').forEach(el => {
    el.addEventListener('mouseenter', (e) => {
      const tooltip = document.getElementById('plot-tooltip');
      tooltip.textContent = el.dataset.value;
      tooltip.style.display = 'block';
      // Position near cursor
    });
  });
</script>
```

**Tier B -- Variant Swap (histogram interpretations, scatter plot patterns, normal probability plot shapes):**

These pages show the SAME plot type with DIFFERENT data patterns. All variants are pre-rendered at build time. A vanilla JS selector toggles which one is visible.

```astro
---
const variants = technique.variants.map(v => ({
  id: v.id,
  label: v.label,
  svg: generateHistogramPlot(v.data, { bins: v.bins }),
}));
---
<div class="variant-tabs">
  {variants.map((v, i) => (
    <button
      data-variant={v.id}
      class:list={['variant-tab', { active: i === 0 }]}
    >
      {v.label}
    </button>
  ))}
</div>
{variants.map((v, i) => (
  <div
    id={`variant-${v.id}`}
    class:list={['variant-panel', { hidden: i !== 0 }]}
    set:html={v.svg}
  />
))}

<script>
  document.querySelectorAll('[data-variant]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.variant-panel').forEach(p => p.classList.add('hidden'));
      document.querySelectorAll('.variant-tab').forEach(t => t.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById(`variant-${btn.dataset.variant}`).classList.remove('hidden');
    });
  });
</script>
```

**Tier C -- D3 Distribution Explorer (19 distribution pages only):**

```tsx
// src/components/eda/DistributionExplorer.tsx
// React island loaded via client:visible for viewport-triggered loading
import { useState, useRef, useEffect } from 'react';
import * as d3Scale from 'd3-scale';
import * as d3Shape from 'd3-shape';
import * as d3Axis from 'd3-axis';
import * as d3Selection from 'd3-selection';

interface Props {
  distribution: string;
  defaultParams: Record<string, number>;
  paramRanges: Record<string, { min: number; max: number; step: number }>;
  pdfFn: string; // function name key into math/distributions.ts
}
```

**D3 bundle strategy:** Import ONLY `d3-scale`, `d3-shape`, `d3-axis`, `d3-selection`. Estimated sizes (minified):
- `d3-selection`: ~8KB
- `d3-scale`: ~5KB
- `d3-shape`: ~5KB
- `d3-axis`: ~2KB
- Total: ~20KB minified, ~8KB gzipped

Do NOT import the full `d3` package (93KB minified). Use individual sub-modules. Astro's Vite bundler will tree-shake unused exports within each sub-module.

**Loading strategy:** Use `client:visible` directive so the D3 bundle only loads when the distribution explorer scrolls into view. This keeps Lighthouse scores high even on distribution pages.

```astro
<!-- In distributions/[slug].astro -->
<DistributionExplorer
  client:visible
  distribution={distribution.id}
  defaultParams={distribution.defaultParams}
  paramRanges={distribution.paramRanges}
  pdfFn={distribution.pdfFunction}
/>
```

**Confidence:** HIGH -- `client:visible` is a proven Astro directive, D3 sub-module imports are the documented approach for bundle optimization.

---

### Decision 4: KaTeX Integration via remark-math + rehype-katex

**Pattern:** Use `remark-math` and `rehype-katex` as Astro markdown/MDX plugins for server-side math rendering. KaTeX CSS loaded conditionally.

**Configuration:**

```javascript
// astro.config.mjs
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

export default defineConfig({
  markdown: {
    remarkPlugins: [remarkReadingTime, remarkMath],
    rehypePlugins: [rehypeKatex],
  },
  // ... rest of config
});
```

**CSS loading strategy:** KaTeX CSS (~28KB minified) and fonts (~1.2MB total, ~200KB used subset) should NOT be loaded on every page. Load them conditionally:

Option A -- Via Layout slot (recommended):

```astro
<!-- In quantitative/[slug].astro or any page needing math -->
<Layout title={...}>
  <link
    slot="head"
    rel="stylesheet"
    href="https://cdn.jsdelivr.net/npm/katex@0.16.21/dist/katex.min.css"
    integrity="sha384-..."
    crossorigin="anonymous"
  />
  <!-- page content -->
</Layout>
```

Option B -- Self-host KaTeX CSS and fonts:

```astro
<!-- Copy katex.min.css to public/css/ and font files to public/fonts/katex/ -->
<link slot="head" rel="stylesheet" href="/css/katex.min.css" />
```

**Recommendation:** Use Option A (CDN) initially for simplicity. The CDN has worldwide edge caching and the CSS is likely already cached in users' browsers from other math-heavy sites. Switch to self-hosted only if CSP restrictions or Lighthouse audits require it.

**Where KaTeX is needed:**
- Quantitative technique pages (18 pages) -- formulas for t-test, ANOVA, chi-square, etc.
- Distribution pages (19 pages) -- PDF/CDF formulas
- Some foundation pages (2-3 pages) -- basic statistical notation
- Total: ~40 pages need KaTeX, ~50 pages do not

**Confidence:** HIGH -- `remark-math` + `rehype-katex` is the standard Astro math integration, documented in MDX official guides and multiple Astro community tutorials.

---

### Decision 5: Content Collection Schema Design

**Pattern:** Rich Zod schemas that encode technique metadata, plot configuration, formula data, and cross-linking in a single validated JSON collection.

```typescript
// src/lib/eda/schema.ts
import { z } from 'astro/zod';

/** Section categories matching URL structure */
export const edaSectionSchema = z.enum([
  'foundations',
  'techniques',
  'quantitative',
  'distributions',
  'case-studies',
  'reference',
]);

/** Interactivity tier */
export const tierSchema = z.enum(['A', 'B', 'C']);

/** Plot type classification */
export const plotTypeSchema = z.enum([
  'line', 'scatter', 'histogram', 'box', 'bar',
  'contour', 'probability', 'radar', 'composite', 'none',
]);

/** Plot variant configuration for Tier B pages */
export const plotVariantSchema = z.object({
  id: z.string(),
  label: z.string(),
  description: z.string(),
  dataGenerator: z.string(), // function name in datasets.ts
  dataParams: z.record(z.number()).optional(),
});

/** Formula entry (rendered by KaTeX) */
export const formulaSchema = z.object({
  label: z.string(),
  latex: z.string(),
  description: z.string().optional(),
});

/** Complete technique metadata schema */
export const edaTechniqueSchema = z.object({
  id: z.string(),
  title: z.string(),
  slug: z.string(),
  section: edaSectionSchema,
  nistRef: z.string(), // e.g., "1.3.3.14" for Histogram
  category: z.string(), // e.g., "graphical", "quantitative"
  subcategory: z.string().optional(), // e.g., "location", "scale", "distribution"
  tier: tierSchema,
  order: z.number(), // display order within section
  description: z.string(),
  shortDescription: z.string(), // for card grid
  plotType: plotTypeSchema,
  plotConfig: z.object({
    dataGenerator: z.string(),
    dataParams: z.record(z.number()).optional(),
    showMean: z.boolean().optional(),
    showBounds: z.boolean().optional(),
    xLabel: z.string().optional(),
    yLabel: z.string().optional(),
  }).optional(),
  variants: z.array(plotVariantSchema).optional(), // Tier B only
  formulas: z.array(formulaSchema).optional(),
  pythonImports: z.array(z.string()).optional(), // e.g., ["numpy", "scipy.stats"]
  pythonCode: z.string().optional(), // Python code example
  interpretation: z.string(), // interpretation guidance prose
  whenToUse: z.string(),
  relatedTechniques: z.array(z.string()), // IDs of related techniques
  tags: z.array(z.string()),
});

/** Distribution schema (for Tier C pages) */
export const edaDistributionSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  nistRef: z.string(),
  order: z.number(),
  family: z.enum(['continuous', 'discrete']),
  description: z.string(),
  parameters: z.array(z.object({
    name: z.string(),
    symbol: z.string(), // LaTeX symbol
    default: z.number(),
    min: z.number(),
    max: z.number(),
    step: z.number(),
  })),
  pdfFormula: z.string(), // LaTeX
  cdfFormula: z.string().optional(),
  meanFormula: z.string().optional(),
  varianceFormula: z.string().optional(),
  pdfFunction: z.string(), // function name in math/distributions.ts
  relatedDistributions: z.array(z.string()),
  pythonCode: z.string(),
  tags: z.array(z.string()),
});

export type EdaTechnique = z.infer<typeof edaTechniqueSchema>;
export type EdaDistribution = z.infer<typeof edaDistributionSchema>;
```

**Why this schema structure?**

1. **`dataGenerator` string key** instead of inline data arrays: Keeps the JSON file manageable. The actual data generation happens in TypeScript functions (`datasets.ts`) that are called at build time. A 200-point dataset would bloat the JSON; a function name like `"normalRandom"` with `{ n: 200, mean: 0, sd: 1 }` params is compact.

2. **`variants` array for Tier B**: Pre-defines all plot variants (e.g., 8 histogram interpretations) so the page generator knows exactly how many SVGs to pre-render.

3. **`relatedTechniques` as ID array**: Enables bidirectional cross-linking computed at build time via a simple lookup.

4. **`formulas` array**: Separates formula data from prose. Each formula gets its own KaTeX rendering block with label and description.

5. **`pythonCode` as string**: Python code examples are stored in the JSON (short enough for inline storage) and rendered via astro-expressive-code's `<Code>` component.

**Confidence:** HIGH -- follows exact pattern of existing `languageSchema` and `dbModelSchema`.

---

## Component Architecture

### Component Responsibilities

| Component | Responsibility | Existing Analog | New/Modify |
|-----------|---------------|-----------------|------------|
| `TechniquePage.astro` | Shared layout for technique/quantitative pages: title, breadcrumbs, plot, interpretation, formulas, Python code, related links | Beauty Index `[slug].astro` | NEW |
| `PlotContainer.astro` | Responsive SVG wrapper, `role="img"`, alt text, caption | Beauty Index `RadarChart.astro` wrapper pattern | NEW |
| `PlotSvg.astro` | Renders a build-time SVG string into a container (Tier A) | `RadarChart.astro` | NEW |
| `PlotVariantSwap.astro` | Pre-renders multiple SVG variants with tab switcher (Tier B) | None (new pattern) | NEW |
| `FormulaBlock.astro` | Wraps KaTeX-rendered formula with label | None | NEW |
| `PythonCode.astro` | Wraps expressive-code `<Code>` for Python with copy button | Blog code blocks | NEW (thin wrapper) |
| `InterpretationPanel.astro` | Collapsible interpretation guide per plot variant | None | NEW |
| `TechniqueCard.astro` | Card for landing page grid: icon, title, section badge | Beauty Index `LanguageGrid.astro` | NEW |
| `SectionNav.astro` | Prev/next within section with section breadcrumb | `LanguageNav.astro` | NEW |
| `CategoryFilter.tsx` | React island for landing page filtering | `LanguageFilter.tsx` | NEW (mirrors pattern) |
| `DistributionExplorer.tsx` | D3 interactive parameter explorer | None (new island type) | NEW |
| `EdaJsonLd.astro` | JSON-LD structured data for EDA pages | `BeautyIndexJsonLd.astro` | NEW |
| `EdaShareControls.astro` | Share URL + download SVG as PNG | `ShareControls.astro` | NEW (mirrors pattern) |

### Page Template Patterns

**Pattern A: Technique Page (getStaticPaths from JSON collection)**

```astro
---
// src/pages/eda/techniques/[slug].astro
import { getCollection } from 'astro:content';
import Layout from '../../../layouts/Layout.astro';
import TechniquePage from '../../../components/eda/TechniquePage.astro';

export async function getStaticPaths() {
  const techniques = await getCollection('edaTechniques');
  const graphical = techniques
    .map(t => t.data)
    .filter(t => t.section === 'techniques')
    .sort((a, b) => a.order - b.order);

  return graphical.map((tech, i) => ({
    params: { slug: tech.slug },
    props: {
      technique: tech,
      prev: i > 0 ? graphical[i - 1] : null,
      next: i < graphical.length - 1 ? graphical[i + 1] : null,
    },
  }));
}

const { technique, prev, next } = Astro.props;
---
<Layout title={`${technique.title} | EDA Visual Encyclopedia`}>
  <TechniquePage technique={technique} prev={prev} next={next} />
</Layout>
```

**Pattern B: Foundation Page (getStaticPaths from MDX collection)**

```astro
---
// src/pages/eda/foundations/[slug].astro
import { getCollection, render } from 'astro:content';
import Layout from '../../../layouts/Layout.astro';

export async function getStaticPaths() {
  const pages = await getCollection('edaPages');
  const foundations = pages
    .filter(p => p.data.category === 'foundations')
    .sort((a, b) => a.data.order - b.data.order);

  return foundations.map((page, i) => ({
    params: { slug: page.id },
    props: {
      page,
      prev: i > 0 ? foundations[i - 1] : null,
      next: i < foundations.length - 1 ? foundations[i + 1] : null,
    },
  }));
}

const { page, prev, next } = Astro.props;
const { Content } = await render(page);
---
<Layout title={`${page.data.title} | EDA Visual Encyclopedia`}>
  <Content />
</Layout>
```

**Pattern C: Distribution Page (JSON metadata + D3 island)**

```astro
---
// src/pages/eda/distributions/[slug].astro
import { getCollection } from 'astro:content';
import Layout from '../../../layouts/Layout.astro';
import DistributionExplorer from '../../../components/eda/DistributionExplorer.tsx';

export async function getStaticPaths() {
  const distributions = await getCollection('edaDistributions');
  const sorted = [...distributions].map(d => d.data).sort((a, b) => a.order - b.order);

  return sorted.map((dist, i) => ({
    params: { slug: dist.slug },
    props: {
      distribution: dist,
      prev: i > 0 ? sorted[i - 1] : null,
      next: i < sorted.length - 1 ? sorted[i + 1] : null,
    },
  }));
}

const { distribution, prev, next } = Astro.props;
---
<Layout title={`${distribution.name} | EDA Visual Encyclopedia`}>
  <link
    slot="head"
    rel="stylesheet"
    href="https://cdn.jsdelivr.net/npm/katex@0.16.21/dist/katex.min.css"
    crossorigin="anonymous"
  />
  <!-- Static build-time content -->
  <section class="prose">
    <h1>{distribution.name}</h1>
    <p>{distribution.description}</p>
    <!-- KaTeX formula rendered at build time via rehype-katex -->
  </section>

  <!-- D3 interactive explorer (loads on scroll into view) -->
  <DistributionExplorer
    client:visible
    distribution={distribution.id}
    defaultParams={Object.fromEntries(distribution.parameters.map(p => [p.name, p.default]))}
    paramRanges={Object.fromEntries(distribution.parameters.map(p => [p.name, { min: p.min, max: p.max, step: p.step }]))}
    pdfFn={distribution.pdfFunction}
  />
</Layout>
```

---

## Data Flow

### Build-Time Flow (Tier A/B -- 80% of pages)

```
techniques.json
    |
    v
content.config.ts (Zod validation)
    |
    v
getStaticPaths() -- filters by section, sorts by order
    |
    v
[slug].astro -- receives technique data as props
    |
    v
svg-generators/*.ts -- pure functions: data -> SVG string
    |
    v
PlotContainer.astro -- wraps SVG with a11y, responsive container
    |
    v
Static HTML with inline SVG (zero JS for Tier A, ~2KB for Tier B)
```

### Client-Side Flow (Tier C -- 19 distribution pages)

```
distributions.json
    |
    v
content.config.ts (Zod validation)
    |
    v
getStaticPaths() -- generates 19 pages
    |
    v
[slug].astro -- renders static shell + distribution metadata
    |
    v
<DistributionExplorer client:visible />
    |
    v (when scrolled into view)
D3 micro-bundle loads (~8KB gzipped)
    |
    v
User adjusts parameter sliders
    |
    v
distributions.ts recalculates PDF/CDF
    |
    v
D3 redraws SVG curve in-place
```

### OG Image Flow

```
techniques.json / distributions.json
    |
    v
open-graph/eda/[slug].png.ts -- getStaticPaths from collection
    |
    v
og-image.ts -- generateEdaOgImage(technique)
    |
    v
Satori renders JSX tree with mini SVG plot thumbnail
    |
    v
Sharp converts to PNG (1200x630)
    |
    v
Static PNG at /open-graph/eda/{slug}.png
```

---

## Recommended Project Structure

```
src/
├── content.config.ts           # ADD: edaTechniques, edaDistributions, edaPages
├── data/
│   ├── eda/
│   │   ├── techniques.json     # 90+ technique metadata entries
│   │   ├── distributions.json  # 19 distribution configs
│   │   ├── datasets/           # Sample CSV/JSON data for case studies
│   │   │   ├── normal-random.json
│   │   │   ├── uniform-random.json
│   │   │   ├── ceramic-strength.json
│   │   │   └── ...
│   │   └── pages/              # MDX content for prose-heavy pages
│   │       ├── foundations/
│   │       │   ├── what-is-eda.mdx
│   │       │   ├── eda-vs-classical.mdx
│   │       │   ├── assumptions.mdx
│   │       │   ├── four-plot.mdx
│   │       │   ├── role-of-graphics.mdx
│   │       │   └── problem-categories.mdx
│   │       ├── case-studies/
│   │       │   ├── normal-random-numbers.mdx
│   │       │   ├── uniform-random-numbers.mdx
│   │       │   └── ...
│   │       └── reference/
│   │           ├── analysis-questions.mdx
│   │           ├── techniques-by-category.mdx
│   │           ├── distribution-tables.mdx
│   │           └── related-distributions.mdx
│   ├── beauty-index/           # UNCHANGED
│   ├── blog/                   # UNCHANGED
│   └── db-compass/             # UNCHANGED
├── lib/
│   ├── eda/
│   │   ├── schema.ts           # Zod schemas + type exports
│   │   ├── categories.ts       # Section hierarchy, slugs, icons
│   │   ├── related-techniques.ts # Cross-link resolution
│   │   ├── svg-generators/
│   │   │   ├── plot-base.ts    # Shared: axes, grid, labels, palette, scaling
│   │   │   ├── line-plot.ts    # Run sequence, autocorrelation, spectral
│   │   │   ├── scatter-plot.ts # Scatter, lag, Q-Q, probability, conditioning
│   │   │   ├── bar-plot.ts     # Histogram, bihistogram, bar
│   │   │   ├── box-plot.ts     # Box plot, star plot, block plot
│   │   │   ├── contour-plot.ts # Contour, DOE contour
│   │   │   ├── distribution-curve.ts # PDF/CDF static curves
│   │   │   └── composite-plot.ts     # 4-plot, 6-plot multi-panel
│   │   └── math/
│   │       ├── statistics.ts   # Mean, std, quantiles, correlation, runs test
│   │       ├── distributions.ts # PDF/CDF formulas for 19 distributions
│   │       └── datasets.ts     # Sample data generators (normal, uniform, etc.)
│   ├── beauty-index/           # UNCHANGED
│   ├── db-compass/             # UNCHANGED
│   └── og-image.ts             # MODIFY: add generateEdaOgImage()
├── components/
│   ├── eda/
│   │   ├── TechniquePage.astro
│   │   ├── PlotContainer.astro
│   │   ├── PlotSvg.astro
│   │   ├── PlotVariantSwap.astro
│   │   ├── FormulaBlock.astro
│   │   ├── PythonCode.astro
│   │   ├── InterpretationPanel.astro
│   │   ├── TechniqueCard.astro
│   │   ├── SectionNav.astro
│   │   ├── CategoryFilter.tsx
│   │   ├── DistributionExplorer.tsx
│   │   ├── EdaJsonLd.astro
│   │   └── EdaShareControls.astro
│   ├── beauty-index/           # UNCHANGED
│   ├── db-compass/             # UNCHANGED
│   └── tools/                  # UNCHANGED
├── pages/
│   ├── eda/
│   │   ├── index.astro         # Landing page
│   │   ├── foundations/
│   │   │   └── [slug].astro    # 6 pages
│   │   ├── techniques/
│   │   │   └── [slug].astro    # 30 pages
│   │   ├── quantitative/
│   │   │   └── [slug].astro    # 18 pages
│   │   ├── distributions/
│   │   │   └── [slug].astro    # 19 pages
│   │   ├── case-studies/
│   │   │   └── [slug].astro    # 9 pages
│   │   └── reference/
│   │       └── [slug].astro    # 4 pages
│   ├── open-graph/
│   │   └── eda/
│   │       ├── index.png.ts
│   │       └── [slug].png.ts
│   ├── beauty-index/           # UNCHANGED
│   ├── blog/                   # UNCHANGED
│   └── tools/                  # UNCHANGED
└── stores/
    └── edaFilterStore.ts       # Landing page filter state (nanostores)
```

### Structure Rationale

- **`data/eda/`**: Follows the established pattern of `data/beauty-index/` and `data/db-compass/`. Data files separate from code.
- **`data/eda/pages/`**: MDX files for prose-heavy content. Glob loader reads from here.
- **`lib/eda/svg-generators/`**: SVG generation is the core technical challenge. Organized by plot family rather than by page, because many pages share plot types (e.g., run-sequence plots appear in multiple technique pages AND case studies).
- **`lib/eda/math/`**: Statistical computation functions separate from rendering. These are pure math -- no SVG, no DOM, no framework dependencies. Usable in both SVG generators and D3 explorer.
- **`components/eda/`**: Follows the established pattern of `components/beauty-index/` and `components/db-compass/`. One directory per pillar.
- **`pages/eda/`**: Six sub-directories matching the six sections. Each has a single `[slug].astro` dynamic route file.

---

## Integration Points with Existing Architecture

### Files Modified (Existing)

| File | Change | Risk |
|------|--------|------|
| `src/content.config.ts` | Add 3 new collections (edaTechniques, edaDistributions, edaPages) | LOW -- additive, no breaking changes |
| `src/components/Header.astro` | Add "EDA" navigation link | LOW -- same as v1.3/v1.4/v1.5 pattern |
| `src/lib/og-image.ts` | Add `generateEdaOgImage()` and `generateEdaOverviewOgImage()` functions | LOW -- additive, follows existing multi-feature pattern |
| `src/pages/index.astro` | Add EDA callout section (same pattern as Beauty Index and tools callouts) | LOW -- additive |
| `src/pages/llms.txt.ts` | Add EDA section descriptions | LOW -- additive |
| `src/pages/llms-full.txt.ts` | Add EDA full content | LOW -- additive |
| `astro.config.mjs` | Add `remarkMath` and `rehypeKatex` plugins | MEDIUM -- affects all Markdown/MDX processing globally |
| `package.json` | Add `remark-math`, `rehype-katex`, `d3-scale`, `d3-shape`, `d3-axis`, `d3-selection` | LOW -- new dependencies only |

### Risk Mitigation for astro.config.mjs Change

Adding `remarkMath` and `rehypeKatex` to the global Markdown pipeline means ALL existing MDX/Markdown content gets processed through these plugins. This is generally safe because:

1. `remark-math` only activates on `$...$` and `$$...$$` delimited content. Existing blog posts and tool pages do not use dollar-sign delimiters.
2. `rehype-katex` only processes nodes created by `remark-math`. No existing content is affected.

**But verify:** Search existing MDX files for `$` characters that could be accidentally interpreted as math delimiters. Dollar signs in code blocks are safe (code blocks are excluded from remark processing). Dollar signs in inline prose are the risk.

### Files Created (New)

~25 new source files:
- 1 schema file
- 7 SVG generator files
- 3 math utility files
- 2 data JSON files
- 13 Astro/React components
- 7 page route files
- 2 OG image generators
- 1 nanostore

Plus ~15 MDX files for foundations/case-studies/reference content.

### Existing Files Unchanged

All existing pillars (Beauty Index, DB Compass, Dockerfile Analyzer, Compose Validator, K8s Analyzer) are completely unaffected. The EDA pillar is a parallel namespace with zero coupling to existing features.

---

## Scaling Considerations

| Concern | At 90 pages (v1.8) | At 200+ pages (future expansion) |
|---------|---------------------|----------------------------------|
| Build time | ~90 SVG generations + 90 OG images. Estimate: +30-60s build time. Acceptable. | Pre-compute SVGs once, cache in .astro/. Consider parallel SVG generation. |
| JSON collection size | `techniques.json` ~50-80KB for 90 entries. Well within memory limits. | At 500+ entries, consider splitting into per-section JSON files with multiple `file()` loaders. |
| Page count | ~90 new pages on top of 857 existing = ~950 total. Astro handles this fine. | 125K+ pages is where static Astro breaks (per FreeDevTools case study). Not a concern at 200. |
| D3 bundle | Single ~8KB gzipped chunk shared across 19 distribution pages. | Same bundle for any number of distributions. |
| KaTeX fonts | CDN-loaded, cached after first page visit. | Same CDN strategy works at any scale. |

### Build Time Budget

The site currently has 857 pages. Adding ~90 more is a ~10% increase. The primary build time cost is OG image generation (Satori + Sharp), which for 90 images at ~0.5s each = ~45s. This is the same cost structure as the existing 67 K8s rule pages.

**Mitigation:** OG images can be generated in a single `getStaticPaths` endpoint that processes all 90+ techniques in one pass, sharing the font loading cost.

---

## Anti-Patterns

### Anti-Pattern 1: Python SVG Generation Pipeline

**What people do:** Use Python (matplotlib, seaborn) to generate SVG files as a pre-build step, then reference them as static assets in Astro pages.
**Why it's wrong:** Adds a build dependency (Python runtime), file system coordination (write SVGs to disk, reference from Astro), two-language maintenance burden, and breaks the "one build command" pattern. Cannot integrate with Astro's build-time data flow (content collections, OG images, getStaticPaths).
**Do this instead:** TypeScript SVG generators that produce SVG strings directly consumed by Astro components at build time. Same language, same build process, zero file coordination.

### Anti-Pattern 2: Full D3 on Every Page

**What people do:** Import the complete `d3` package and use it for all visualizations, even static ones.
**Why it's wrong:** `d3` is 93KB minified. Most EDA plots are static and need zero client-side JavaScript. Using D3 for a static run-sequence plot is a 93KB tax for zero interactivity.
**Do this instead:** Build-time SVG generation for static plots (Tier A/B). D3 micro-bundle (4 sub-modules, ~8KB gzipped) only on the 19 distribution pages (Tier C).

### Anti-Pattern 3: One Mega JSON File for Everything

**What people do:** Put all technique metadata, distribution configs, case study data, sample datasets, and interpretation prose into a single massive JSON file.
**Why it's wrong:** Astro loads the entire file into memory for the collection. A single file with 90+ entries, each containing sample datasets (200+ data points), Python code strings, and interpretation prose, could be 500KB+ and slow to parse.
**Do this instead:** Separate concerns: metadata JSON (compact, ~80KB), MDX for prose, `datasets.ts` functions for data generation (zero-cost until invoked), Python code as strings in the JSON (they're short).

### Anti-Pattern 4: Client-Side Math Rendering

**What people do:** Load KaTeX or MathJax at runtime to render `$...$` expressions in the browser.
**Why it's wrong:** KaTeX JS is ~120KB and requires fonts. Runtime rendering causes layout shift and delays interactive elements.
**Do this instead:** `rehype-katex` renders all math to HTML+CSS at build time. The browser receives pre-rendered math. Only the KaTeX CSS (~28KB) is needed for styling, and it's cached after the first load.

### Anti-Pattern 5: React Islands for Tier A/B Interactivity

**What people do:** Wrap every plot in a React component with `client:load` for tooltip/hover behavior.
**Why it's wrong:** React's hydration cost (~40KB for React + ReactDOM) is unjustified for simple hover tooltips. 70% of pages need zero or minimal JS.
**Do this instead:** Vanilla JS inline `<script>` for Tier A tooltips (~2KB). DOM manipulation for Tier B variant swapping (~3KB). React island only for Tier C D3 explorers where component state management justifies the React overhead.

---

## Build Order Considering Dependencies

### Phase 1: Foundation (schema + SVG base + data structure)

**Must come first** -- everything else depends on these.

1. `lib/eda/schema.ts` -- Zod schemas (all pages depend on types)
2. `lib/eda/categories.ts` -- section hierarchy (navigation depends on this)
3. `lib/eda/math/statistics.ts` -- basic stat functions (SVG generators need these)
4. `lib/eda/math/datasets.ts` -- sample data generators (SVG generators need data)
5. `lib/eda/svg-generators/plot-base.ts` -- shared SVG primitives (all plot generators depend on this)
6. `data/eda/techniques.json` -- initial 5-10 entries for validation
7. `content.config.ts` -- add collections
8. Verify: `getCollection('edaTechniques')` returns validated data

### Phase 2: Core Components + First Technique Pages

**Depends on Phase 1** -- needs schema, SVG base, and data.

1. `components/eda/PlotContainer.astro` -- responsive SVG wrapper
2. `components/eda/PlotSvg.astro` -- build-time SVG renderer
3. `components/eda/TechniquePage.astro` -- shared technique layout
4. `components/eda/SectionNav.astro` -- prev/next navigation
5. `svg-generators/line-plot.ts` -- first plot family
6. `pages/eda/techniques/[slug].astro` -- first dynamic route
7. Build and verify: 2-3 technique pages render correctly

### Phase 3: All SVG Generators + Remaining Technique Pages

**Depends on Phase 2** -- pattern proven, now scale out.

1. `svg-generators/scatter-plot.ts`
2. `svg-generators/bar-plot.ts`
3. `svg-generators/box-plot.ts`
4. `svg-generators/contour-plot.ts`
5. `svg-generators/composite-plot.ts`
6. Complete `techniques.json` with all 30 graphical techniques
7. Add quantitative techniques data + pages
8. `components/eda/PlotVariantSwap.astro` -- Tier B component
9. `components/eda/FormulaBlock.astro` -- KaTeX wrapper
10. `components/eda/PythonCode.astro` -- Python code display

### Phase 4: KaTeX + Quantitative Techniques

**Depends on Phase 3** (component patterns) + Phase 1 (data).

1. `astro.config.mjs` -- add remarkMath + rehypeKatex
2. Verify existing MDX content unaffected
3. `pages/eda/quantitative/[slug].astro`
4. Complete quantitative technique data (18 entries)
5. KaTeX CSS conditional loading via slot

### Phase 5: D3 Distribution Explorer

**Depends on Phase 1** (schema) but can parallel Phase 3/4.

1. Install D3 sub-modules: `d3-scale`, `d3-shape`, `d3-axis`, `d3-selection`
2. `lib/eda/math/distributions.ts` -- PDF/CDF formulas
3. `lib/eda/svg-generators/distribution-curve.ts` -- static curve for non-interactive content
4. `components/eda/DistributionExplorer.tsx` -- React island with D3
5. `data/eda/distributions.json` -- all 19 distributions
6. `pages/eda/distributions/[slug].astro`
7. Verify: `client:visible` lazy loading works, D3 bundle size < 30KB

### Phase 6: Foundations + Case Studies (MDX)

**Depends on Phase 4** (KaTeX) + Phase 2 (components).

1. `data/eda/pages/foundations/*.mdx` -- 6 foundation pages
2. `data/eda/pages/case-studies/*.mdx` -- 9 case studies
3. `data/eda/pages/reference/*.mdx` -- 4 reference pages
4. `pages/eda/foundations/[slug].astro`
5. `pages/eda/case-studies/[slug].astro`
6. `pages/eda/reference/[slug].astro`
7. Sample datasets in `data/eda/datasets/`

### Phase 7: Landing Page + Filtering

**Depends on Phases 2-6** (all pages exist for cross-linking).

1. `components/eda/TechniqueCard.astro`
2. `components/eda/CategoryFilter.tsx` -- React island
3. `stores/edaFilterStore.ts` -- nanostores
4. `pages/eda/index.astro` -- landing page with grid

### Phase 8: Site Integration + Polish

**Depends on all previous phases.**

1. `Header.astro` -- add EDA nav link
2. `index.astro` -- add homepage callout
3. OG images: `open-graph/eda/index.png.ts` + `[slug].png.ts`
4. JSON-LD structured data
5. Breadcrumb navigation
6. Sitemap inclusion
7. LLMs.txt updates
8. Companion blog post
9. Lighthouse audit
10. Accessibility audit

---

## New npm Dependencies Required

| Package | Version | Purpose | Size (gzipped) |
|---------|---------|---------|----------------|
| `remark-math` | ^6.0 | Parse `$...$` math delimiters in Markdown/MDX | ~2KB |
| `rehype-katex` | ^7.0 | Render math to HTML with KaTeX at build time | ~300KB (build only, not shipped to browser) |
| `d3-scale` | ^4.0 | Scale functions for D3 explorer | ~5KB |
| `d3-shape` | ^3.0 | Line/area generators for D3 explorer | ~5KB |
| `d3-axis` | ^3.0 | Axis rendering for D3 explorer | ~2KB |
| `d3-selection` | ^3.0 | DOM manipulation for D3 explorer | ~8KB |

**Total new client-side JS shipped:** ~8KB gzipped (D3 sub-modules), loaded only on 19 distribution pages via `client:visible`.

**KaTeX CSS:** ~28KB from CDN (cached), loaded only on ~40 pages that use math formulas.

---

## Sources

- [Astro 5 Content Collections Documentation](https://docs.astro.build/en/guides/content-collections/)
- [Astro Content Layer API Reference](https://docs.astro.build/en/reference/content-loader-reference/)
- [Astro Zod API Reference](https://docs.astro.build/en/reference/modules/astro-zod/)
- [Content Layer Deep Dive](https://astro.build/blog/content-layer-deep-dive/)
- [remark-math + rehype-katex MDX Guide](https://mdxjs.com/guides/math/)
- [Math Typesetting in Astro MDX](https://www.byteli.com/blog/2024/math_in_astro/)
- [KaTeX Font Documentation](https://katex.org/docs/font)
- [D3 Modular Architecture](https://github.com/d3/d3/issues/3076)
- [D3 Bundle Size Analysis (Bundlephobia)](https://bundlephobia.com/package/d3)
- [Astro D3 Compatibility Discussion](https://github.com/withastro/astro/issues/3987)
- [Astro Experimental SVG Optimization](https://docs.astro.build/en/reference/experimental-flags/svg-optimization/)
- [Large-Scale Static Astro Site Case Study (FreeDevTools 125K pages)](https://dev.to/lovestaco/when-static-sites-stop-scaling-migrating-freedevtools-125k-pages-from-static-astro-to-ssr-1hf5)
- Existing codebase: `src/lib/beauty-index/radar-math.ts` (build-time SVG pattern)
- Existing codebase: `src/content.config.ts` (dual loader pattern)
- Existing codebase: `src/components/beauty-index/RadarChart.astro` (Astro SVG component pattern)
- Existing codebase: `src/lib/og-image.ts` (Satori + Sharp OG generation pattern)

---
*Architecture research for: EDA Visual Encyclopedia (v1.8 milestone)*
*Researched: 2026-02-24*
