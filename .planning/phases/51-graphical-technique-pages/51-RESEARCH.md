# Phase 51: Graphical Technique Pages - Research

**Researched:** 2026-02-25
**Domain:** Astro static page generation, build-time SVG composition, vanilla JS tab switching
**Confidence:** HIGH

## Summary

Phase 51 produces 29 graphical technique pages at `/eda/techniques/{slug}/`, plus a `PlotVariantSwap.astro` component for Tier B interactive tab switching, and build-time SVG thumbnails for the landing page grid. The codebase already has all necessary infrastructure: 13 SVG generators (Phase 50), the `TechniquePage.astro` layout component with named slots (Phase 48), `EdaBreadcrumb.astro`, `BreadcrumbJsonLd.astro`, the complete `techniques.json` data catalog (Phase 49), sample datasets in `datasets.ts`, and a route map in `routes.ts`.

The primary implementation pattern is Astro file-based routing at `src/pages/eda/techniques/[slug].astro` using `getStaticPaths()` fed from the `edaTechniques` collection (filtered to `category === 'graphical'`). Each page imports the appropriate SVG generator, calls it with sample data at build time, and renders the SVG inline via `set:html`. Tier B pages additionally include the `PlotVariantSwap.astro` component which generates multiple SVG variants at build time and switches them client-side via vanilla JS tabs (~3KB). The approach follows the exact same `getStaticPaths` + collection pattern used by `db-compass/[slug].astro` and `beauty-index/[slug].astro`.

**Primary recommendation:** Use a single dynamic route file `[slug].astro` with a technique-to-generator mapping object, rather than 29 separate `.astro` files. This is the established codebase pattern and keeps the routing DRY. The Tier B PlotVariantSwap component should use `<script>` inline in an `.astro` component (not a React island) since it is ~3KB vanilla JS with zero framework dependency.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| GRAPH-01 | Histogram page with 8 variants, SVG swap (Tier B) | `generateHistogram` exists with configurable bins/KDE; PlotVariantSwap generates 8 dataset variants at build |
| GRAPH-02 | Box plot page with annotated diagram | `generateBoxPlot` exists; annotations can be added via prose slot |
| GRAPH-03 | Scatter plot page with 12 variants, SVG swap (Tier B) | `generateScatterPlot` exists with regression/confidence band options; 12 pattern variants at build |
| GRAPH-04 | Normal probability plot with 4 shape variants (Tier B) | `generateProbabilityPlot` type='normal' exists; 4 shape datasets (normal, skewed, heavy-tail, bimodal) |
| GRAPH-05 | Run-sequence plot page | `generateLinePlot` mode='run-sequence' exists |
| GRAPH-06 | Lag plot with 4 variants (Tier B) | `generateLagPlot` exists with configurable lag param; 4 pattern datasets |
| GRAPH-07 | Autocorrelation plot with 4 variants (Tier B) | `generateLinePlot` mode='autocorrelation' exists; 4 pattern datasets |
| GRAPH-08 | 4-plot page with composite layout | `generate4Plot` exists in composite-plot.ts |
| GRAPH-09 | 6-plot page with extended composite | `generate6Plot` exists in composite-plot.ts |
| GRAPH-10 | Probability plot page | `generateProbabilityPlot` type='normal' exists |
| GRAPH-11 | Q-Q plot page | `generateProbabilityPlot` type='qq' exists |
| GRAPH-12 | Spectral plot with 3 variants (Tier B) | `generateSpectralPlot` exists; 3 frequency pattern datasets |
| GRAPH-13 | Bihistogram page | `generateHistogram` called twice with mirrored layout |
| GRAPH-14 | Block plot page | `generateBarPlot` with block grouping |
| GRAPH-15 | Bootstrap plot page | `generateHistogram` on bootstrap resampled means |
| GRAPH-16 | Box-Cox linearity plot page | `generateScatterPlot` with transformation lambda sweep |
| GRAPH-17 | Box-Cox normality plot page | `generateLinePlot` for lambda vs. normality correlation |
| GRAPH-18 | Complex demodulation page | `generateLinePlot` mode='time-series' for amplitude/phase |
| GRAPH-19 | Contour plot page | `generateContourPlot` exists |
| GRAPH-20 | Star plot page | `generateStarPlot` exists |
| GRAPH-21 | Weibull plot page | `generateProbabilityPlot` type='weibull' exists |
| GRAPH-22 | Youden plot page | `generateScatterPlot` with median reference lines |
| GRAPH-23 | Mean plot page | `generateBarPlot` with group means |
| GRAPH-24 | Standard deviation plot page | `generateBarPlot` with group SDs |
| GRAPH-25 | PPCC plot page | `generateProbabilityPlot` type='ppcc' exists |
| GRAPH-26 | Linear plots page (4 sub-plots) | `generateScatterPlot` + `generateLinePlot` for correlation, intercept, slope, residual SD |
| GRAPH-27 | DOE plots page (3 sub-plots) | `generateBarPlot` with DOE factor data |
| GRAPH-28 | Scatterplot matrix page | Multiple `generateScatterPlot` calls in grid layout |
| GRAPH-29 | Conditioning plot page | `generateScatterPlot` calls conditioned on third variable bins |
| GRAPH-30 | PlotVariantSwap.astro component | Vanilla JS tab-switching component (~3KB) |
| LAND-05 | Build-time SVG thumbnails on technique cards | Thumbnail generator function using existing generators with smaller config |
</phase_requirements>

## Standard Stack

### Core (Already Installed)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Astro | 5.x | Static page generation via `getStaticPaths` | Project framework |
| d3-scale | micro | Build-time scale computations for SVG | Already used by all generators |
| d3-array | micro | Statistical binning, extent, range | Already used by histogram/scatter |
| d3-shape | micro | Line/area path generation | Already used by line/spectral |
| d3-contour | micro | Isoline computation for contour plots | Already used by contour generator |

### Supporting (Already Available)

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| astro:content | built-in | `getCollection('edaTechniques')` for route generation | Every technique page |
| TechniquePage.astro | custom | Layout wrapper with named slots | Every technique page |
| EdaBreadcrumb.astro | custom | Breadcrumb navigation component | Every technique page |
| BreadcrumbJsonLd.astro | custom | Structured data for SEO | Every technique page |
| EDALayout.astro | custom | EDA-specific layout with KaTeX support | Through TechniquePage |

### No New Dependencies Required

All SVG generators and layout components exist. No `npm install` needed.

## Architecture Patterns

### Recommended Project Structure

```
src/
  pages/
    eda/
      techniques/
        [slug].astro              # Single dynamic route for all 29 graphical techniques
  components/
    eda/
      TechniquePage.astro         # EXISTS - layout with slots
      EdaBreadcrumb.astro         # EXISTS - breadcrumb nav
      PlotVariantSwap.astro       # NEW - Tier B tab switching component
  lib/
    eda/
      svg-generators/             # EXISTS - all 13 generators
      technique-renderer.ts       # NEW - technique-to-generator mapping + rendering logic
      thumbnail.ts                # NEW - thumbnail generation (smaller config)
```

### Pattern 1: Dynamic Route with getStaticPaths (ESTABLISHED PATTERN)

**What:** A single `[slug].astro` file generates all 29 technique pages using `getStaticPaths()` from the collection.
**When to use:** Always -- this is the established pattern in the codebase (see `db-compass/[slug].astro`, `beauty-index/[slug].astro`).
**Example:**

```typescript
// src/pages/eda/techniques/[slug].astro
---
import { getCollection } from 'astro:content';
import TechniquePage from '../../../components/eda/TechniquePage.astro';
import PlotVariantSwap from '../../../components/eda/PlotVariantSwap.astro';
import { renderTechniquePlot, renderVariants } from '../../../lib/eda/technique-renderer';

export async function getStaticPaths() {
  const techniques = await getCollection('edaTechniques');
  const graphical = techniques
    .filter((t) => t.data.category === 'graphical')
    .map((t) => t.data);

  // Build related technique name lookups
  const nameMap = Object.fromEntries(graphical.map((t) => [t.slug, t.title]));

  return graphical.map((technique) => ({
    params: { slug: technique.slug },
    props: {
      technique,
      relatedTechniques: technique.relatedTechniques
        .filter((slug) => nameMap[slug])
        .map((slug) => ({ slug, name: nameMap[slug] })),
    },
  }));
}

const { technique, relatedTechniques } = Astro.props;
const plotSvg = renderTechniquePlot(technique);
const isTierB = technique.tier === 'B';
const variants = isTierB ? renderVariants(technique) : [];
---

<TechniquePage
  title={technique.title}
  description={technique.description}
  category="Graphical Techniques"
  nistSection={technique.nistSection}
  relatedTechniques={relatedTechniques}
>
  <Fragment slot="plot">
    {isTierB ? (
      <PlotVariantSwap variants={variants} defaultSvg={plotSvg} />
    ) : (
      <div class="mt-8 mb-10" set:html={plotSvg} />
    )}
  </Fragment>
  <Fragment slot="description">
    <section class="prose-section">
      <!-- 200+ words of explanatory prose per technique -->
    </section>
  </Fragment>
</TechniquePage>
```

### Pattern 2: Technique-to-Generator Mapping

**What:** A centralized mapping object that routes each technique slug to the correct SVG generator call with appropriate data and options.
**When to use:** To avoid a massive if/else chain in the route file.
**Example:**

```typescript
// src/lib/eda/technique-renderer.ts
import type { EdaTechnique } from './schema';
import { generateHistogram } from './svg-generators';
import { generateBoxPlot } from './svg-generators';
import { generateScatterPlot } from './svg-generators';
// ... all generator imports

import { normalRandom, timeSeries, scatterData, doeFactors, boxPlotData, responseSurface } from '../../data/eda/datasets';

type TechniqueRenderer = (technique: EdaTechnique) => string;

const renderers: Record<string, TechniqueRenderer> = {
  'histogram': () => generateHistogram({ data: normalRandom, showKDE: true, title: 'Histogram', xLabel: 'Value', yLabel: 'Frequency' }),
  'box-plot': () => generateBoxPlot({ groups: boxPlotData, title: 'Box Plot' }),
  'scatter-plot': () => generateScatterPlot({ data: scatterData, showRegression: true, title: 'Scatter Plot' }),
  'run-sequence-plot': () => generateLinePlot({ data: timeSeries, mode: 'run-sequence', title: 'Run Sequence Plot' }),
  // ... 29 entries total
};

export function renderTechniquePlot(technique: EdaTechnique): string {
  const renderer = renderers[technique.slug];
  return renderer ? renderer(technique) : '';
}
```

### Pattern 3: PlotVariantSwap Component (Tier B)

**What:** An Astro component that renders all SVG variants at build time in hidden panels, with vanilla JS tab buttons that toggle visibility.
**When to use:** Tier B pages (histogram, scatter, normal-probability, lag, autocorrelation, spectral).
**Example:**

```astro
---
// src/components/eda/PlotVariantSwap.astro
interface Variant {
  label: string;
  svg: string;
}

interface Props {
  variants: Variant[];
  defaultSvg: string;
}

const { variants, defaultSvg } = Astro.props;
const componentId = `pvs-${Math.random().toString(36).slice(2, 8)}`;
---

<div class="plot-variant-swap" id={componentId}>
  <div class="flex flex-wrap gap-2 mb-4" role="tablist">
    <button
      role="tab"
      aria-selected="true"
      class="px-3 py-1.5 text-sm rounded-full bg-[var(--color-accent)]/10 text-[var(--color-accent)]"
      data-variant="default"
    >
      Default
    </button>
    {variants.map((v, i) => (
      <button
        role="tab"
        aria-selected="false"
        class="px-3 py-1.5 text-sm rounded-full text-[var(--color-text-secondary)] hover:bg-[var(--color-accent)]/10"
        data-variant={`variant-${i}`}
      >
        {v.label}
      </button>
    ))}
  </div>

  <div class="plot-panels">
    <div data-panel="default" set:html={defaultSvg} />
    {variants.map((v, i) => (
      <div data-panel={`variant-${i}`} class="hidden" set:html={v.svg} />
    ))}
  </div>
</div>

<script>
  // ~3KB vanilla JS tab switching
  document.querySelectorAll('.plot-variant-swap').forEach((container) => {
    const tabs = container.querySelectorAll('[role="tab"]');
    const panels = container.querySelectorAll('[data-panel]');

    tabs.forEach((tab) => {
      tab.addEventListener('click', () => {
        const variant = tab.getAttribute('data-variant');
        tabs.forEach((t) => {
          t.setAttribute('aria-selected', 'false');
          t.classList.remove('bg-[var(--color-accent)]/10', 'text-[var(--color-accent)]');
          t.classList.add('text-[var(--color-text-secondary)]');
        });
        tab.setAttribute('aria-selected', 'true');
        tab.classList.add('bg-[var(--color-accent)]/10', 'text-[var(--color-accent)]');
        tab.classList.remove('text-[var(--color-text-secondary)]');
        panels.forEach((p) => {
          p.classList.toggle('hidden', p.getAttribute('data-panel') !== variant);
        });
      });
    });
  });
</script>
```

### Pattern 4: Build-Time SVG Thumbnails (LAND-05)

**What:** Generate smaller, simplified SVG at build time for technique cards on the landing page.
**When to use:** Landing page technique cards need visual previews.
**Example:**

```typescript
// src/lib/eda/thumbnail.ts
import type { PlotConfig } from './svg-generators/plot-base';

export const THUMBNAIL_CONFIG: Partial<PlotConfig> = {
  width: 200,
  height: 140,
  margin: { top: 10, right: 10, bottom: 10, left: 10 },
};

// Thumbnail strips axes/labels, keeps only data visualization
export function generateThumbnail(slug: string): string {
  // Use technique-renderer mapping with THUMBNAIL_CONFIG
  // Strip title, axis labels for minimal footprint
}
```

### Pattern 5: Content Prose Strategy

**What:** Each page needs 200+ words of unique explanatory prose sourced from NIST/SEMATECH handbook content.
**When to use:** Every technique page's description slot.
**Key sections for each technique page:**
1. What it is (definition)
2. When to use it (purpose/context)
3. How to interpret it (interpretation guidance)
4. Assumptions and limitations
5. NIST section citation

### Anti-Patterns to Avoid

- **29 separate `.astro` files:** Do NOT create individual page files for each technique. Use the `[slug].astro` dynamic route pattern already established.
- **React island for PlotVariantSwap:** Do NOT use a React component. The tab switching is trivial vanilla JS (~3KB). React would add unnecessary hydration overhead.
- **Client-side SVG generation:** Do NOT generate SVGs in the browser. All SVG generation happens at build time. The `set:html` directive inlines pre-rendered SVG.
- **Hardcoded colors in SVG:** Do NOT use hex color values. Use PALETTE CSS custom properties (already enforced by all generators).
- **Full d3 import:** Do NOT import `d3` -- only micro-modules are allowed per INFRA-03 decision.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| SVG histograms | Custom bin calculation + path drawing | `generateHistogram()` from svg-generators | Already handles KDE overlay, bin count, edge cases |
| SVG scatter plots | Custom point rendering | `generateScatterPlot()` from svg-generators | Already handles regression, confidence bands |
| SVG probability plots | Custom quantile calculation | `generateProbabilityPlot()` from svg-generators | Handles normal, QQ, Weibull, PPCC with proper Blom positions |
| SVG autocorrelation | Custom ACF calculation | `generateLinePlot({ mode: 'autocorrelation' })` | Handles lollipops, significance bounds |
| SVG spectral analysis | Custom FFT + PSD | `generateSpectralPlot()` from svg-generators | Handles log/linear scale selection, area fill |
| SVG composite layouts | Custom multi-panel assembly | `generate4Plot()` / `generate6Plot()` | Handles sub-plot composition via `<g transform>` |
| SVG contour fills | Custom marching squares | `generateContourPlot()` from svg-generators | Uses d3-contour with proper isoline computation |
| SVG star/radar plots | Custom polar coordinate math | `generateStarPlot()` from svg-generators | Reuses radar-math.ts |
| SVG bar/mean/SD plots | Custom categorical layout | `generateBarPlot()` from svg-generators | Handles error bars, groups, scale bands |
| Math utilities | Custom mean/std/regression | statistics.ts | Already has KDE, FFT, regression, normal quantile, autocorrelation |
| Route generation | Manual page creation | `getStaticPaths` + `getCollection` | Established project pattern |

**Key insight:** Phase 50 built ALL the SVG generators. Phase 51 is exclusively a page composition + content authoring phase. No new generator code should be needed.

## Common Pitfalls

### Pitfall 1: Monolithic Route File
**What goes wrong:** Putting all 29 technique prose bodies inline in `[slug].astro` creates a 3000+ line file.
**Why it happens:** Temptation to keep everything in one place.
**How to avoid:** Extract prose content into a separate module (technique-content.ts or per-technique MDX fragments). The route file should only handle routing logic and component composition.
**Warning signs:** Route file exceeds ~300 lines.

### Pitfall 2: Tier B Variant Data Confusion
**What goes wrong:** Using the same dataset for all variants makes them visually identical.
**Why it happens:** datasets.ts has a limited number of datasets.
**How to avoid:** Create technique-specific variant datasets that illustrate distinct patterns (e.g., for histogram: symmetric, right-skewed, bimodal, uniform, heavy-tailed, light-tailed, outlier, platykurtic). These can be simple inline arrays in the renderer mapping.
**Warning signs:** All variant tabs show nearly identical plots.

### Pitfall 3: SVG Size Bloat
**What goes wrong:** 29 pages x (1-12 variant SVGs per page) = potentially hundreds of SVGs bloating the HTML.
**Why it happens:** Tier B pages embed multiple full-size SVGs in hidden panels.
**How to avoid:** Use `.toFixed(2)` (already enforced) and consider thumbnail-sized configs for variant previews. Monitor per-page HTML size. For histogram with 8 variants, each SVG is ~5-10KB, so 8 variants = ~80KB of hidden SVGs per page. This is acceptable for static HTML.
**Warning signs:** Individual page HTML exceeds 200KB.

### Pitfall 4: Missing Related Technique Cross-Links
**What goes wrong:** `relatedTechniques` array references slugs that may belong to quantitative techniques (different category), causing broken links.
**Why it happens:** The `techniques.json` data includes cross-category references.
**How to avoid:** In `getStaticPaths`, build the name lookup map from ALL techniques (not just graphical), and construct URLs using `techniqueUrl(slug, category)` from routes.ts. Check that related technique slugs exist in the full techniques collection.
**Warning signs:** Links to `/eda/techniques/autocorrelation/` (quantitative) instead of `/eda/quantitative/autocorrelation/`.

### Pitfall 5: PlotVariantSwap Tab Styling with Tailwind
**What goes wrong:** Dynamic Tailwind class toggling (`bg-[var(--color-accent)]/10`) does not work with JS classList because Tailwind purges unused classes.
**Why it happens:** Tailwind's JIT compiler only scans template strings at build time.
**How to avoid:** Define the active/inactive tab styles in the component's `<style>` block or use data attributes with CSS selectors (`[aria-selected="true"]`). This is more reliable than classList toggling of Tailwind utility classes.
**Warning signs:** Tabs have no visual state change when clicked.

### Pitfall 6: Bihistogram Requires Custom Composition
**What goes wrong:** There is no dedicated bihistogram generator -- calling `generateHistogram` twice produces two separate SVGs, not a mirrored layout.
**Why it happens:** The bihistogram is a unique visualization where one histogram points up and the other points down on a shared axis.
**How to avoid:** Create a simple composition function (similar to composite-plot.ts `stripSvgWrapper` pattern) that renders two histograms into a shared SVG with one mirrored via `transform="scale(1,-1)"` on the Y axis. This is a small helper, not a new generator.
**Warning signs:** Two separate histogram images instead of a single mirrored display.

### Pitfall 7: Scatterplot Matrix N-squared Complexity
**What goes wrong:** A scatterplot matrix of k variables produces k*k panels, which can be expensive.
**Why it happens:** Matrix layout requires O(k^2) scatter plot renders.
**How to avoid:** Limit to 4-5 variables max for the demonstration. Use smaller plot configs (200x200 per panel). Compose via the `stripSvgWrapper` + `<g transform>` pattern from composite-plot.ts.
**Warning signs:** Build timeout or very large SVG output for matrix page.

## Code Examples

### Technique-to-Generator Mapping (core pattern)

```typescript
// Source: derived from existing generators in src/lib/eda/svg-generators/index.ts
import {
  generateHistogram,
  generateBoxPlot,
  generateScatterPlot,
  generateLinePlot,
  generateLagPlot,
  generateProbabilityPlot,
  generateSpectralPlot,
  generateStarPlot,
  generateContourPlot,
  generateBarPlot,
  generate4Plot,
  generate6Plot,
} from './svg-generators';

import {
  normalRandom,
  uniformRandom,
  scatterData,
  timeSeries,
  doeFactors,
  boxPlotData,
  responseSurface,
} from '../../data/eda/datasets';

// Each entry returns the primary SVG string for a technique
const TECHNIQUE_RENDERERS: Record<string, () => string> = {
  'histogram': () => generateHistogram({
    data: normalRandom,
    showKDE: true,
    title: 'Histogram of Normal Random Numbers',
    xLabel: 'Value',
    yLabel: 'Frequency',
  }),
  'box-plot': () => generateBoxPlot({
    groups: boxPlotData,
    title: 'Box Plot Comparison',
    yLabel: 'Transmittance',
  }),
  'scatter-plot': () => generateScatterPlot({
    data: scatterData,
    showRegression: true,
    showConfidenceBand: true,
    title: 'Scatter Plot with Regression',
    xLabel: 'Load (kN)',
    yLabel: 'Deflection (mm)',
  }),
  'run-sequence-plot': () => generateLinePlot({
    data: timeSeries,
    mode: 'run-sequence',
    title: 'Run Sequence Plot',
    yLabel: 'Response (mV)',
  }),
  'lag-plot': () => generateLagPlot({
    data: timeSeries,
    lag: 1,
    title: 'Lag 1 Plot',
  }),
  'autocorrelation-plot': () => generateLinePlot({
    data: timeSeries,
    mode: 'autocorrelation',
    title: 'Autocorrelation Plot',
  }),
  '4-plot': () => generate4Plot(timeSeries),
  '6-plot': () => generate6Plot(timeSeries),
  'normal-probability-plot': () => generateProbabilityPlot({
    data: normalRandom,
    type: 'normal',
    title: 'Normal Probability Plot',
  }),
  'probability-plot': () => generateProbabilityPlot({
    data: normalRandom,
    type: 'normal',
    title: 'Probability Plot',
  }),
  'qq-plot': () => generateProbabilityPlot({
    data: normalRandom,
    type: 'qq',
    title: 'Q-Q Plot',
  }),
  'spectral-plot': () => generateSpectralPlot({
    data: timeSeries,
    title: 'Spectral Plot',
  }),
  'contour-plot': () => generateContourPlot({
    grid: responseSurface,
    title: 'Contour Plot',
    xLabel: 'Temperature',
    yLabel: 'Pressure',
  }),
  'star-plot': () => generateStarPlot({
    axes: [
      { label: 'Location', value: 8 },
      { label: 'Scale', value: 6 },
      { label: 'Skewness', value: 3 },
      { label: 'Kurtosis', value: 5 },
      { label: 'Randomness', value: 9 },
    ],
    title: 'Star Plot',
  }),
  'weibull-plot': () => generateProbabilityPlot({
    data: normalRandom.map(v => Math.exp(v)), // log-transform for Weibull
    type: 'weibull',
    title: 'Weibull Probability Plot',
  }),
  'ppcc-plot': () => generateProbabilityPlot({
    data: normalRandom,
    type: 'ppcc',
    title: 'PPCC Plot',
  }),
  'mean-plot': () => generateBarPlot({
    categories: [
      { label: 'Temp Low', value: 73.3, group: 'Temperature' },
      { label: 'Temp High', value: 85.9, group: 'Temperature' },
      { label: 'Press Low', value: 76.5, group: 'Pressure' },
      { label: 'Press High', value: 82.7, group: 'Pressure' },
    ],
    title: 'Mean Plot',
    yLabel: 'Mean Response',
  }),
  'std-deviation-plot': () => generateBarPlot({
    categories: [
      { label: 'Temp Low', value: 4.2, group: 'Temperature' },
      { label: 'Temp High', value: 5.1, group: 'Temperature' },
      { label: 'Press Low', value: 3.8, group: 'Pressure' },
      { label: 'Press High', value: 4.5, group: 'Pressure' },
    ],
    title: 'Standard Deviation Plot',
    yLabel: 'Std Dev',
  }),
  // Remaining techniques use composition of existing generators:
  // 'bihistogram', 'block-plot', 'bootstrap-plot', 'box-cox-linearity',
  // 'box-cox-normality', 'complex-demodulation', 'youden-plot',
  // 'linear-plots', 'doe-plots', 'scatterplot-matrix', 'conditioning-plot'
};
```

### Tier B Variant Dataset Pattern

```typescript
// Histogram variants: 8 interpretation patterns
const HISTOGRAM_VARIANTS = [
  { label: 'Symmetric', data: normalRandom },
  { label: 'Right Skewed', data: normalRandom.map(v => Math.exp(v * 0.5)) },
  { label: 'Left Skewed', data: normalRandom.map(v => -Math.exp(-v * 0.5) + 5) },
  { label: 'Bimodal', data: [...normalRandom.slice(0, 50).map(v => v - 2), ...normalRandom.slice(50).map(v => v + 2)] },
  { label: 'Uniform', data: uniformRandom },
  { label: 'Heavy Tailed', data: normalRandom.map(v => v * (1 + Math.abs(v))) },
  { label: 'Peaked', data: normalRandom.map(v => v * 0.3) },
  { label: 'With Outlier', data: [...normalRandom.slice(0, 99), 8.5] },
];
```

### Bihistogram Composition Pattern

```typescript
// Compose two histograms into a single mirrored SVG
function generateBihistogram(
  dataA: number[],
  dataB: number[],
  config: PlotConfig,
): string {
  // Generate top histogram (normal orientation)
  const topConfig = { ...config, height: config.height / 2 };
  const top = generateHistogram({ data: dataA, config: topConfig, title: 'Group A' });

  // Generate bottom histogram (will be flipped)
  const bottom = generateHistogram({ data: dataB, config: topConfig, title: 'Group B' });

  // Compose using stripSvgWrapper + g transform (same pattern as composite-plot.ts)
  const stripSvgWrapper = (svg: string) => svg.replace(/<svg[^>]*>/, '').replace(/<\/svg>$/, '');

  return svgOpen(config, 'Bihistogram comparison') +
    `<g transform="translate(0, 0)">${stripSvgWrapper(top)}</g>` +
    `<g transform="translate(0, ${config.height / 2})">${stripSvgWrapper(bottom)}</g>` +
    '</svg>';
}
```

### CSS-Based Tab Styling (avoids Tailwind purge issue)

```astro
<style>
  .plot-variant-swap [role="tab"] {
    padding: 0.375rem 0.75rem;
    font-size: 0.875rem;
    border-radius: 9999px;
    color: var(--color-text-secondary);
    cursor: pointer;
    border: none;
    background: transparent;
    transition: background-color 0.15s, color 0.15s;
  }

  .plot-variant-swap [role="tab"]:hover {
    background-color: color-mix(in srgb, var(--color-accent) 10%, transparent);
  }

  .plot-variant-swap [role="tab"][aria-selected="true"] {
    background-color: color-mix(in srgb, var(--color-accent) 10%, transparent);
    color: var(--color-accent);
  }
</style>
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Client-side D3 rendering | Build-time SVG string generation | Phase 50 decision | Zero client JS for Tier A pages |
| Individual page files | Dynamic `[slug].astro` route | Phase 48 infrastructure | 1 file generates 29 pages |
| Hardcoded SVG colors | CSS custom property PALETTE | Phase 50-01 decision | Automatic dark/light theme support |
| External SVG files | Inline SVG via `set:html` | Phase 50 pattern | No additional HTTP requests |

**Deprecated/outdated:**
- None within this project scope.

## Open Questions

1. **Prose Content Source**
   - What we know: Each page needs 200+ words. The NIST/SEMATECH e-Handbook is the reference source.
   - What is unclear: Whether to inline prose in the route file, use a separate content module, or create per-technique MDX fragments.
   - Recommendation: Use a TypeScript content map (`technique-content.ts`) that exports prose strings keyed by slug. This keeps the route file clean and allows content iteration without touching routing logic.

2. **Bihistogram, Bootstrap, Box-Cox, Linear, DOE, Scatterplot Matrix, Conditioning Plot Composition**
   - What we know: These 11 techniques do not have dedicated generators but can be composed from existing ones.
   - What is unclear: Exact composition logic for each.
   - Recommendation: Create small composition helper functions in `technique-renderer.ts`. Use the `stripSvgWrapper` + `<g transform>` pattern from composite-plot.ts. These are light wrappers, not new generators.

3. **SVG Thumbnail Size for Landing Page**
   - What we know: LAND-05 requires thumbnails on technique cards.
   - What is unclear: Exact thumbnail dimensions and whether to strip all text/labels.
   - Recommendation: 200x140px viewBox, strip axis labels and titles, keep only the data visualization paths. This produces ~1-2KB SVGs suitable for card grids.

## Sources

### Primary (HIGH confidence)
- `src/lib/eda/svg-generators/index.ts` -- barrel export of all 13 generators (read directly)
- `src/lib/eda/svg-generators/plot-base.ts` -- PALETTE, PlotConfig, shared utilities (read directly)
- `src/data/eda/techniques.json` -- 29 graphical technique entries with full metadata (read directly)
- `src/data/eda/datasets.ts` -- sample datasets for all plot types (read directly)
- `src/components/eda/TechniquePage.astro` -- page layout with named slots (read directly)
- `src/components/eda/EdaBreadcrumb.astro` -- breadcrumb component (read directly)
- `src/content.config.ts` -- collection definitions (read directly)
- `src/lib/eda/schema.ts` -- Zod schemas for technique/distribution types (read directly)
- `src/lib/eda/routes.ts` -- route map and URL builders (read directly)
- `src/pages/db-compass/[slug].astro` -- established getStaticPaths pattern (read directly)
- `src/pages/beauty-index/[slug].astro` -- established getStaticPaths pattern (read directly)
- `.planning/REQUIREMENTS.md` -- GRAPH-01 through GRAPH-30 + LAND-05 requirements (read directly)
- `.planning/STATE.md` -- Phase 50 completion status and accumulated decisions (read directly)

### Secondary (MEDIUM confidence)
- Astro documentation on `getStaticPaths` and `getCollection` -- well-established patterns confirmed by codebase usage
- NIST/SEMATECH e-Handbook Section 1.3.3 -- source material for technique descriptions

### Tertiary (LOW confidence)
- None

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - all libraries already installed, all generators already built
- Architecture: HIGH - follows established codebase patterns (getStaticPaths, collection-driven routes)
- Pitfalls: HIGH - derived from direct codebase analysis and known Astro/Tailwind behavior
- Content strategy: MEDIUM - prose volume (200+ words x 29 pages) is the largest unknown

**Research date:** 2026-02-25
**Valid until:** 2026-03-25 (stable -- no external dependency changes expected)
