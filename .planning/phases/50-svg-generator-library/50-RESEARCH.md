# Phase 50: SVG Generator Library - Research

**Researched:** 2026-02-24
**Domain:** Build-time TypeScript SVG string generation for statistical charts -- pure functions producing SVG markup strings using D3 computation modules and hand-crafted SVG, styled to Quantum Explorer palette with dark/light theme support
**Confidence:** HIGH

## Summary

Phase 50 builds a library of pure TypeScript functions that take numeric data arrays (from `datasets.ts`) and return SVG markup strings. These generators run at Astro build time (Node.js, no DOM) and produce static SVG that is inlined into technique pages in Phase 51+. The project already has a proven pattern for this: `radar-math.ts` generates SVG string output consumed by `RadarChart.astro` and `CompassRadarChart.astro`. Phase 50 scales this pattern to 13 distinct chart types plus 2 composite layouts.

The D3 micro-modules (`d3-scale`, `d3-shape`, `d3-array`, `d3-path`) are confirmed to work without DOM. They provide scale computations, path string generation (lines, areas, arcs), array statistics (mean, deviation, quantile, bin), and SVG path data. The generators do NOT use `d3-selection` (which requires DOM) -- they use D3 purely for math/geometry and concatenate SVG element strings directly. For contour plots (SVG-08), `d3-contour` must be added as a dependency (~4KB, pure computation, marching squares algorithm). A small math utilities module (`statistics.ts`) handles KDE, linear regression, normal quantile function (probit), and FFT for spectral analysis -- these are ~200 lines of pure math, not worth a library dependency.

Dark/light theme support (SVG-13) uses CSS custom properties (`var(--color-text-primary)`, `var(--color-accent)`, etc.) embedded directly in SVG `fill`, `stroke`, and `style` attributes. Since SVGs are inlined in the HTML (not `<img>` embeds), they inherit the page's CSS custom property values. The site's `ThemeToggle.astro` component toggles the `dark` class on `<html>`, and the CSS variables resolve to different values per theme. **Important finding:** The current `global.css` only defines `:root` variables (the light "Tropical Sunset" palette) with no `.dark` overrides for the EDA-relevant colors. Phase 50 must define the dark-mode color overrides for SVG elements as part of the plot-base generator or in a CSS supplement, ensuring text, grid lines, axes, and data elements are readable on dark backgrounds.

**Primary recommendation:** Build a `plot-base.ts` module that provides shared layout computation (margins, scales, viewBox, grid, axes) and a palette object mapping semantic roles (axis, grid, text, data-primary, data-secondary, etc.) to CSS variable references. Each chart generator imports plot-base and focuses only on its unique data-to-geometry logic.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| SVG-01 | Plot base generator (plot-base.ts) with shared axes, grid lines, viewBox responsiveness, and Quantum Explorer palette | Architecture pattern 1 (PlotConfig/PlotBase), palette object with CSS variables, viewBox pattern from existing radar charts |
| SVG-02 | Histogram SVG generator with configurable bin count and kernel density overlay | d3-array `bin()` for binning, KDE via statistics.ts Gaussian kernel, d3-shape `area()` for KDE curve |
| SVG-03 | Box plot SVG generator with quartile markers, median line, whiskers, and outlier dots | d3-array `quantile()` for Q1/Q2/Q3, IQR calculation for whiskers/outliers, rect+line SVG elements |
| SVG-04 | Scatter plot SVG generator with optional regression line and confidence band | d3-scale for axes, statistics.ts `linearRegression()` for regression line, d3-shape `area()` for confidence band |
| SVG-05 | Line plot SVG generator for run-sequence, autocorrelation, and time series | d3-shape `line()` for path generation, d3-scale for axes, statistics.ts `autocorrelation()` for ACF values |
| SVG-06 | Probability plot SVG generator (normal probability, Q-Q, Weibull, PPCC) | statistics.ts `normalQuantile()` (probit/PPF), sorted data vs theoretical quantiles, Weibull plotting position formula |
| SVG-07 | Bar plot SVG generator for mean plots, standard deviation plots, and DOE plots | d3-scale `scaleBand()` for categories, rect elements for bars, d3-array `mean()`/`deviation()` |
| SVG-08 | Contour plot SVG generator for response surface visualization | d3-contour (NEW dependency) marching squares, d3-scale for color mapping, path elements for contour lines |
| SVG-09 | Star plot (radar) SVG generator for multivariate display | Existing `polarToCartesian()` pattern from radar-math.ts, polygon SVG element for data shape |
| SVG-10 | Composite plot generators for 4-plot and 6-plot layouts | SVG `<g>` transform groups composing individual generators at offset positions, shared viewBox |
| SVG-11 | Distribution curve SVG generator for PDF/CDF static rendering | statistics.ts distribution math (normalPDF, exponentialPDF, chiSquarePDF, etc.), d3-shape `line()` for curves |
| SVG-12 | All SVG plots use viewBox for responsiveness with no fixed width/height | PlotConfig.viewBox computed from margins+dimensions, no width/height attributes on root `<svg>` |
| SVG-13 | All SVG plots render correctly in both dark and light themes | CSS custom properties in SVG attributes (`var(--color-text-primary)`, etc.), dark mode CSS overrides must be defined |
| SVG-14 | Spectral plot SVG generator for frequency domain visualization | statistics.ts `fft()` (Cooley-Tukey radix-2), power spectrum density computation, d3-shape `line()` |
| SVG-15 | Lag plot SVG generator for autocorrelation pattern detection | Simple x[i] vs x[i+k] scatter, d3-scale for axes, circle elements for data points |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| d3-scale | ^4.0.2 (installed) | Linear, band, log scales for axis computation | Industry standard, DOM-independent, already in project |
| d3-shape | ^3.2.0 (installed) | Line, area, arc path string generators | Generates SVG `d` attribute strings without DOM |
| d3-array | ^3.2.4 (installed) | bin(), quantile(), mean(), deviation(), extent(), range() | Statistical array operations, no DOM needed |
| d3-path | ^3.1.0 (installed) | SVG path serialization | Used internally by d3-shape, no DOM |
| d3-contour | ^4.0.2 (NEW) | Marching squares contour generation | Required only for SVG-08 contour plots; pure computation, no DOM |
| TypeScript | via Astro 5.3.0 | Type safety for all generators | Already configured in project |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| d3-interpolate | (installed) | Color interpolation for contour plots | SVG-08 contour color scales |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| d3-contour | Hand-rolled marching squares | d3-contour is 4KB, battle-tested, handles edge cases (saddle points). Hand-rolling wastes time. |
| Hand-rolled statistics.ts | stdlib-js or fast-kde | Adding 50KB+ of stdlib for 5 functions (KDE, regression, FFT, normal quantile, autocorrelation) is overkill. These are well-defined math formulas at ~40 lines each. |
| CSS variables in SVG | Hardcoded color hex values | CSS variables enable dark/light mode without regenerating SVGs. Hardcoded values require separate SVG sets per theme. |
| Inline SVG strings | SVG file generation + import | Inline strings are simpler for Astro build-time rendering and allow CSS variable inheritance. File-based SVGs as `<img>` cannot use CSS variables. |

**Installation:**
```bash
npm install d3-contour@^4.0.2
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── lib/
│   └── eda/
│       ├── schema.ts                # Existing: Zod schemas
│       ├── og-cache.ts              # Existing: OG caching
│       ├── routes.ts                # Existing: Route map
│       ├── svg-generators/
│       │   ├── plot-base.ts         # SVG-01: Shared layout, axes, grid, palette
│       │   ├── histogram.ts         # SVG-02: Histogram + KDE overlay
│       │   ├── box-plot.ts          # SVG-03: Box plot with quartiles
│       │   ├── scatter-plot.ts      # SVG-04: Scatter + regression
│       │   ├── line-plot.ts         # SVG-05: Run-sequence, ACF, time series
│       │   ├── probability-plot.ts  # SVG-06: Normal prob, Q-Q, Weibull, PPCC
│       │   ├── bar-plot.ts          # SVG-07: Mean, SD, DOE plots
│       │   ├── contour-plot.ts      # SVG-08: Response surface contours
│       │   ├── star-plot.ts         # SVG-09: Radar/star multivariate
│       │   ├── composite-plot.ts    # SVG-10: 4-plot and 6-plot layouts
│       │   ├── distribution-curve.ts # SVG-11: PDF/CDF static curves
│       │   ├── spectral-plot.ts     # SVG-14: FFT power spectrum
│       │   ├── lag-plot.ts          # SVG-15: Lag scatter plot
│       │   └── index.ts            # Re-exports all generators
│       └── math/
│           └── statistics.ts        # KDE, regression, FFT, normal quantile, autocorrelation
├── data/
│   └── eda/
│       ├── datasets.ts              # Existing: Sample NIST data arrays
│       ├── techniques.json          # Existing: 47 technique entries
│       └── distributions.json       # Existing: 19 distribution entries
```

### Pattern 1: PlotConfig and PlotBase (SVG-01)

**What:** A shared configuration object and base SVG builder that all chart generators use for consistent layout, axes, grid lines, and theming.
**When to use:** Every single SVG generator imports this.

```typescript
// src/lib/eda/svg-generators/plot-base.ts

/** Semantic color palette using CSS custom properties */
export const PALETTE = {
  // Text and labels
  text: 'var(--color-text-primary)',
  textSecondary: 'var(--color-text-secondary)',
  // Axes and grid
  axis: 'var(--color-text-secondary)',
  grid: 'var(--color-border)',
  // Data series colors (Quantum Explorer palette)
  dataPrimary: 'var(--color-accent)',           // #c44b20 (burnt orange)
  dataSecondary: 'var(--color-accent-secondary)', // #006d6d (teal)
  dataTertiary: 'var(--color-gradient-end)',     // fallback for 3rd series
  // Background and surface
  surface: 'var(--color-surface)',
  surfaceAlt: 'var(--color-surface-alt)',
  // Fill with opacity
  fillPrimary: 'var(--color-accent)',
  fillSecondary: 'var(--color-accent-secondary)',
} as const;

/** Standard plot dimensions and margins */
export interface PlotConfig {
  width: number;        // Coordinate space width (not pixel width)
  height: number;       // Coordinate space height
  margin: { top: number; right: number; bottom: number; left: number };
  title?: string;
  xLabel?: string;
  yLabel?: string;
  fontFamily?: string;
}

export const DEFAULT_CONFIG: PlotConfig = {
  width: 600,
  height: 400,
  margin: { top: 40, right: 20, bottom: 50, left: 60 },
  fontFamily: "'DM Sans', sans-serif",
};

/** Computed inner dimensions (the plotting area) */
export function innerDimensions(config: PlotConfig) {
  return {
    innerWidth: config.width - config.margin.left - config.margin.right,
    innerHeight: config.height - config.margin.top - config.margin.bottom,
  };
}

/** Generate the root <svg> opening tag with viewBox (NO width/height) */
export function svgOpen(config: PlotConfig, ariaLabel: string): string {
  return `<svg viewBox="0 0 ${config.width} ${config.height}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${ariaLabel}" style="width:100%;height:auto;max-width:${config.width}px">`;
}

/** Generate horizontal grid lines */
export function gridLinesH(
  yTicks: number[],
  yScale: (v: number) => number,
  xStart: number,
  xEnd: number,
): string {
  return yTicks.map(t =>
    `<line x1="${xStart}" y1="${yScale(t)}" x2="${xEnd}" y2="${yScale(t)}" stroke="${PALETTE.grid}" stroke-width="0.5" stroke-dasharray="4,4" />`
  ).join('\n');
}

/** Generate vertical grid lines */
export function gridLinesV(
  xTicks: number[],
  xScale: (v: number) => number,
  yStart: number,
  yEnd: number,
): string {
  return xTicks.map(t =>
    `<line x1="${xScale(t)}" y1="${yStart}" x2="${xScale(t)}" y2="${yEnd}" stroke="${PALETTE.grid}" stroke-width="0.5" stroke-dasharray="4,4" />`
  ).join('\n');
}

/** Generate X axis with ticks and label */
export function xAxis(
  ticks: number[],
  scale: (v: number) => number,
  y: number,
  label: string,
  config: PlotConfig,
  formatter?: (v: number) => string,
): string {
  const fmt = formatter ?? ((v: number) => String(v));
  const tickMarks = ticks.map(t => `
    <line x1="${scale(t)}" y1="${y}" x2="${scale(t)}" y2="${y + 6}" stroke="${PALETTE.axis}" stroke-width="1" />
    <text x="${scale(t)}" y="${y + 18}" text-anchor="middle" font-size="11" fill="${PALETTE.textSecondary}" font-family="${config.fontFamily}">${fmt(t)}</text>
  `).join('');
  const axisLine = `<line x1="${config.margin.left}" y1="${y}" x2="${config.width - config.margin.right}" y2="${y}" stroke="${PALETTE.axis}" stroke-width="1" />`;
  const labelEl = label
    ? `<text x="${(config.width) / 2}" y="${y + 40}" text-anchor="middle" font-size="12" fill="${PALETTE.text}" font-family="${config.fontFamily}">${label}</text>`
    : '';
  return axisLine + tickMarks + labelEl;
}

/** Generate Y axis with ticks and label */
export function yAxis(
  ticks: number[],
  scale: (v: number) => number,
  x: number,
  label: string,
  config: PlotConfig,
  formatter?: (v: number) => string,
): string {
  const fmt = formatter ?? ((v: number) => String(v));
  const tickMarks = ticks.map(t => `
    <line x1="${x - 6}" y1="${scale(t)}" x2="${x}" y2="${scale(t)}" stroke="${PALETTE.axis}" stroke-width="1" />
    <text x="${x - 10}" y="${scale(t) + 4}" text-anchor="end" font-size="11" fill="${PALETTE.textSecondary}" font-family="${config.fontFamily}">${fmt(t)}</text>
  `).join('');
  const axisLine = `<line x1="${x}" y1="${config.margin.top}" x2="${x}" y2="${config.height - config.margin.bottom}" stroke="${PALETTE.axis}" stroke-width="1" />`;
  const labelEl = label
    ? `<text x="${x - 45}" y="${config.height / 2}" text-anchor="middle" font-size="12" fill="${PALETTE.text}" font-family="${config.fontFamily}" transform="rotate(-90,${x - 45},${config.height / 2})">${label}</text>`
    : '';
  return axisLine + tickMarks + labelEl;
}
```

### Pattern 2: Individual Chart Generator Function Signature

**What:** Each generator is a pure function taking data + optional config, returning an SVG string.
**When to use:** Every chart type follows this pattern.

```typescript
// Consistent function signature for all generators
export interface HistogramOptions {
  data: number[];
  binCount?: number;         // default: Sturges' formula
  showKDE?: boolean;         // default: false
  config?: Partial<PlotConfig>;
  title?: string;
  xLabel?: string;
  yLabel?: string;
}

export function generateHistogram(options: HistogramOptions): string {
  const config = { ...DEFAULT_CONFIG, ...options.config };
  // ... computation ...
  return svgOpen(config, `Histogram of ${options.title ?? 'data'}`)
    + /* grid lines */
    + /* bars */
    + /* optional KDE curve */
    + /* axes */
    + '</svg>';
}
```

### Pattern 3: CSS Variables for Dark/Light Theme (SVG-13)

**What:** SVG elements use CSS custom property references instead of hardcoded colors. When the page theme changes, SVG colors update automatically.
**When to use:** Every SVG generator. This is enforced by using `PALETTE` constants.

```html
<!-- Generated SVG uses CSS variables (works because SVG is inlined) -->
<svg viewBox="0 0 600 400" role="img" aria-label="Histogram">
  <line x1="60" y1="350" x2="580" y2="350"
        stroke="var(--color-text-secondary)" stroke-width="1" />
  <rect x="70" y="100" width="40" height="250"
        fill="var(--color-accent)" fill-opacity="0.7" />
  <text x="300" y="390" fill="var(--color-text-primary)"
        font-size="12">Observed Values</text>
</svg>
```

**CRITICAL: Dark mode CSS overrides must be created.** The current site only has `:root` (light) CSS variables. For SVGs to render correctly in dark mode, add dark-mode variable overrides. The project uses Tailwind's class-based dark mode (`.dark` on `<html>`):

```css
/* Must be added to global.css or a dedicated eda-theme.css */
html.dark {
  --color-surface: #0f1117;
  --color-surface-alt: #1a1d27;
  --color-text-primary: #e8e8f0;
  --color-text-secondary: #9ca3af;
  --color-accent: #e06040;         /* Slightly brighter for dark bg contrast */
  --color-accent-hover: #f07050;
  --color-accent-secondary: #00a3a3;  /* Brighter teal for dark bg */
  --color-accent-glow: rgba(224, 96, 64, 0.3);
  --color-gradient-start: #e06040;
  --color-gradient-end: #00a3a3;
  --color-border: #2a2d3a;
}
```

**Note:** Whether to create these dark mode overrides as part of Phase 50 or defer to Phase 55 (Site Integration + Polish) is a planning decision. For Phase 50, the SVG generators just need to use `PALETTE` constants consistently. The CSS overrides can be added later and will automatically apply to all generated SVGs.

### Pattern 4: Composite Plot Composition (SVG-10)

**What:** The 4-plot and 6-plot generators compose individual chart generators in a grid layout using SVG `<g>` transform groups.
**When to use:** SVG-10 (4-plot: run-sequence + lag + histogram + normal-probability; 6-plot: adds ACF + spectral).

```typescript
export function generate4Plot(data: number[], config?: Partial<PlotConfig>): string {
  const fullConfig = { ...DEFAULT_CONFIG, width: 800, height: 600, ...config };
  const halfW = (fullConfig.width - 20) / 2;
  const halfH = (fullConfig.height - 20) / 2;
  const subConfig = { width: halfW, height: halfH, margin: { top: 30, right: 15, bottom: 35, left: 50 } };

  const runSeq = generateLinePlot({ data, config: subConfig, title: 'Run Sequence', yLabel: 'Value' });
  const lag = generateLagPlot({ data, config: subConfig, title: 'Lag Plot' });
  const hist = generateHistogram({ data, config: subConfig, title: 'Histogram', showKDE: true });
  const probPlot = generateProbabilityPlot({ data, config: subConfig, title: 'Normal Probability' });

  // Strip <svg> wrappers from sub-plots and wrap in positioned <g> elements
  const strip = (svg: string) => svg.replace(/<svg[^>]*>/, '').replace(/<\/svg>/, '');

  return svgOpen(fullConfig, '4-Plot diagnostic layout')
    + `<g transform="translate(0,0)">${strip(runSeq)}</g>`
    + `<g transform="translate(${halfW + 10},0)">${strip(lag)}</g>`
    + `<g transform="translate(0,${halfH + 10})">${strip(hist)}</g>`
    + `<g transform="translate(${halfW + 10},${halfH + 10})">${strip(probPlot)}</g>`
    + '</svg>';
}
```

### Pattern 5: Math Utilities Module

**What:** Pure math functions needed by multiple generators. No library dependencies.
**When to use:** Any generator needing KDE, regression, normal quantile, FFT, or autocorrelation.

```typescript
// src/lib/eda/math/statistics.ts

/** Gaussian kernel density estimation */
export function kde(data: number[], bandwidth: number, points: number[]): number[] {
  const n = data.length;
  return points.map(x => {
    const sum = data.reduce((acc, xi) => {
      const u = (x - xi) / bandwidth;
      return acc + Math.exp(-0.5 * u * u);
    }, 0);
    return sum / (n * bandwidth * Math.sqrt(2 * Math.PI));
  });
}

/** Silverman's rule-of-thumb bandwidth */
export function silvermanBandwidth(data: number[]): number {
  const n = data.length;
  const sorted = [...data].sort((a, b) => a - b);
  const q1 = sorted[Math.floor(n * 0.25)];
  const q3 = sorted[Math.floor(n * 0.75)];
  const iqr = q3 - q1;
  const std = Math.sqrt(data.reduce((s, x) => s + (x - mean(data)) ** 2, 0) / (n - 1));
  return 0.9 * Math.min(std, iqr / 1.34) * Math.pow(n, -0.2);
}

/** Simple linear regression (OLS) */
export function linearRegression(x: number[], y: number[]): { slope: number; intercept: number; r2: number } { /* ... */ }

/** Normal quantile function (probit / inverse CDF) -- Beasley-Springer-Moro approximation */
export function normalQuantile(p: number): number { /* ... */ }

/** Autocorrelation function at lag k */
export function autocorrelation(data: number[], maxLag: number): number[] { /* ... */ }

/** Radix-2 Cooley-Tukey FFT (in-place) */
export function fft(re: number[], im: number[]): void { /* ... */ }

/** Power spectral density from FFT output */
export function powerSpectrum(data: number[]): number[] { /* ... */ }
```

### Anti-Patterns to Avoid

- **Using d3-selection in generators:** `d3-selection` requires DOM (`document.createElement`). SVG generators must build strings manually. Use `d3-scale`, `d3-shape`, `d3-array`, `d3-path` only (all DOM-independent).
- **Hardcoded hex colors in SVG output:** Use `PALETTE` constants (CSS variable references) instead. Hardcoded colors break dark mode.
- **Setting `width` and `height` attributes on root `<svg>`:** Use `viewBox` only. Add `style="width:100%;height:auto"` via inline style for responsive scaling. This is SVG-12 requirement.
- **Complex `<style>` blocks inside SVG:** Keep SVG elements simple. Use inline `fill`, `stroke`, `font-size` attributes. CSS class-based styling inside SVG creates specificity issues when the SVG is inlined in the page.
- **Large coordinate spaces:** Use 600x400 as default. Larger viewBoxes create unnecessarily precise decimal coordinates in path data, bloating the HTML.
- **Generating separate SVGs for dark and light modes:** CSS variables handle this automatically. Do NOT generate two versions of each SVG.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Scale computation (linear, band, log) | Custom scale functions | `d3-scale` scaleLinear, scaleBand, scaleLog | Edge cases (nice ticks, domain clamping, band padding) |
| SVG path data for lines/areas | Manual `M/L/C` path commands | `d3-shape` line(), area() | Handles monotone interpolation, missing data, curve fitting |
| Histogram binning | Custom bin boundary logic | `d3-array` bin() | Handles edge cases (empty bins, domain boundaries, Sturges/Scott/Freedman-Diaconis rules) |
| Contour generation (marching squares) | Custom marching squares | `d3-contour` contours() | Saddle point disambiguation, GeoJSON output, threshold computation |
| Quantile computation | Sorted array index lookup | `d3-array` quantile() | Linear interpolation between data points, handles edge cases |
| SVG path serialization | String concatenation | `d3-path` | Arc computations, ellipse parameterization |

**Key insight:** D3's computation modules are tiny (4-8KB each), battle-tested, and produce correct output for edge cases that are easy to get wrong (empty datasets, single values, NaN handling, domain inversion). The SVG string construction itself is the custom part; the math should delegate to D3.

## Common Pitfalls

### Pitfall 1: SVG Text Rendering Inconsistency Across Browsers
**What goes wrong:** Axis labels and tick values render at different sizes or positions across Chrome, Firefox, and Safari because SVG text metrics vary by browser.
**Why it happens:** SVG `<text>` font metrics depend on the browser's font rendering engine. `text-anchor` and `dominant-baseline` behave inconsistently.
**How to avoid:** Use `text-anchor="middle"` for centered labels and explicit `y` offsets (not `dominant-baseline`). Add `dy="0.35em"` for vertical centering. Test in at least Chrome and Firefox. Use `font-family="'DM Sans', sans-serif"` matching the site's body font.
**Warning signs:** Labels overlap axis lines, tick labels are cut off, text appears shifted up/down.

### Pitfall 2: viewBox Aspect Ratio Distortion
**What goes wrong:** SVG stretches or squashes when container aspect ratio differs from viewBox aspect ratio.
**Why it happens:** Default `preserveAspectRatio="xMidYMid meet"` maintains aspect ratio but may add whitespace. Missing `preserveAspectRatio` uses the default which is usually fine, but setting it incorrectly causes distortion.
**How to avoid:** Always use the default `preserveAspectRatio` (don't set it). Set `style="width:100%;height:auto"` on the SVG element. The viewBox defines the coordinate system; CSS controls the display size.
**Warning signs:** Charts appear squished on mobile or stretched on wide screens.

### Pitfall 3: CSS Variables Not Resolving in SVG
**What goes wrong:** SVG elements show as black/invisible because CSS variables are not inherited.
**Why it happens:** CSS variables only work in **inline** SVGs (part of the HTML DOM). If SVGs are loaded via `<img src="chart.svg">` or `<object>`, CSS variables from the parent page are not inherited.
**How to avoid:** All SVG generators produce markup strings that are inlined directly in Astro templates (e.g., `<Fragment set:html={svgString} />`). Never output SVGs as separate files loaded via `<img>`.
**Warning signs:** Charts render all-black or invisible. Inspecting in DevTools shows `var(--color-*)` not resolving.

### Pitfall 4: D3 Scale Domain/Range Inversion for Y-Axis
**What goes wrong:** Data plots appear upside-down because SVG Y-axis increases downward, but data Y-axis increases upward.
**Why it happens:** SVG coordinate origin is top-left. `scaleLinear().domain([0, max]).range([height, 0])` is the correct inversion, but it is easy to forget or reverse.
**How to avoid:** Always define Y scales with **inverted range**: `.range([innerHeight, 0])`. The `plot-base.ts` helper should enforce this convention.
**Warning signs:** Histograms grow downward from the top, scatter plots are flipped.

### Pitfall 5: Empty or Constant Data Arrays
**What goes wrong:** Generators crash with NaN/Infinity when data has zero variance (all values identical) or empty arrays.
**Why it happens:** `d3-scale` domain `[min, max]` becomes `[5, 5]` for constant data, producing NaN from division. Empty arrays produce `undefined` from `d3-array` functions.
**How to avoid:** Add guard clauses: if `data.length < 2`, return a placeholder SVG with "Insufficient data" message. If `extent[0] === extent[1]`, add +/- 1 padding to the domain.
**Warning signs:** SVG output contains `NaN` in attribute values, charts render as blank rectangles.

### Pitfall 6: Excessive SVG Markup Size
**What goes wrong:** Generated SVG strings are 50KB+ per chart, bloating page HTML.
**Why it happens:** High-precision coordinates (15+ decimal places from d3-scale), excessive grid lines, or large datasets generating thousands of SVG elements.
**How to avoid:** Round all coordinate values to 2 decimal places using `.toFixed(2)`. Limit grid lines to 5-7 per axis. For scatter plots with 100+ points, coordinates are fine; for contour plots, simplify paths. Target <10KB per SVG.
**Warning signs:** Page HTML is 500KB+ for a single technique page. Build time increases noticeably.

### Pitfall 7: Font Not Available in SVG at Build Time
**What goes wrong:** SVG `<text>` elements specify 'DM Sans' but the font is loaded via Google Fonts at runtime. At build time (SSG), the font is not available for text metric calculations.
**Why it happens:** Astro builds pages as static HTML. Font files are loaded by the browser, not available during Node.js build.
**How to avoid:** This does not affect SVG rendering because SVG text metrics are computed by the browser at render time, not at build time. The SVG just specifies the font-family string. Ensure fallback fonts are listed: `font-family="'DM Sans', sans-serif"`.
**Warning signs:** None at build time. Browser renders with fallback font briefly (FOUT), then swaps to DM Sans.

## Code Examples

### Histogram Generator (SVG-02) -- Core Logic

```typescript
import { scaleLinear } from 'd3-scale';
import { bin, extent, range } from 'd3-array';
import { area, curveBasis } from 'd3-shape';
import { DEFAULT_CONFIG, PALETTE, svgOpen, xAxis, yAxis, gridLinesH, innerDimensions } from './plot-base';
import { kde, silvermanBandwidth } from '../math/statistics';

export interface HistogramOptions {
  data: number[];
  binCount?: number;
  showKDE?: boolean;
  config?: Partial<PlotConfig>;
  title?: string;
  xLabel?: string;
  yLabel?: string;
}

export function generateHistogram(options: HistogramOptions): string {
  const { data, binCount, showKDE = false } = options;
  const config = { ...DEFAULT_CONFIG, ...options.config };
  const { innerWidth, innerHeight } = innerDimensions(config);
  const { margin } = config;

  // Compute bins
  const [dataMin, dataMax] = extent(data) as [number, number];
  const thresholds = binCount ?? Math.ceil(Math.log2(data.length) + 1); // Sturges
  const binGen = bin().domain([dataMin, dataMax]).thresholds(thresholds);
  const bins = binGen(data);

  // Scales
  const xScale = scaleLinear()
    .domain([dataMin, dataMax])
    .range([margin.left, margin.left + innerWidth]);
  const yMax = Math.max(...bins.map(b => b.length));
  const yScale = scaleLinear()
    .domain([0, yMax * 1.1])
    .range([margin.top + innerHeight, margin.top]);

  // Bars
  const bars = bins.map(b => {
    const x = xScale(b.x0!);
    const w = xScale(b.x1!) - xScale(b.x0!);
    const y = yScale(b.length);
    const h = yScale(0) - yScale(b.length);
    return `<rect x="${x.toFixed(2)}" y="${y.toFixed(2)}" width="${Math.max(0, w - 1).toFixed(2)}" height="${h.toFixed(2)}" fill="${PALETTE.dataPrimary}" fill-opacity="0.7" stroke="${PALETTE.dataPrimary}" stroke-width="1" />`;
  }).join('\n');

  // Optional KDE overlay
  let kdeOverlay = '';
  if (showKDE) {
    const bw = silvermanBandwidth(data);
    const kdePoints = range(dataMin, dataMax, (dataMax - dataMin) / 100);
    const kdeValues = kde(data, bw, kdePoints);
    const kdeScale = scaleLinear()
      .domain([0, Math.max(...kdeValues)])
      .range([margin.top + innerHeight, margin.top]);
    const areaGen = area<[number, number]>()
      .x(d => xScale(d[0]))
      .y0(yScale(0))
      .y1(d => kdeScale(d[1]))
      .curve(curveBasis);
    const kdePath = areaGen(kdePoints.map((x, i) => [x, kdeValues[i]]));
    kdeOverlay = `<path d="${kdePath}" fill="${PALETTE.dataSecondary}" fill-opacity="0.2" stroke="${PALETTE.dataSecondary}" stroke-width="2" />`;
  }

  // Assemble
  const xTicks = xScale.ticks(7);
  const yTicks = yScale.ticks(5);

  return svgOpen(config, `Histogram${options.title ? ': ' + options.title : ''}`)
    + gridLinesH(yTicks, yScale, margin.left, margin.left + innerWidth)
    + bars
    + kdeOverlay
    + xAxis(xTicks, xScale, margin.top + innerHeight, options.xLabel ?? '', config)
    + yAxis(yTicks, yScale, margin.left, options.yLabel ?? 'Frequency', config)
    + (options.title ? `<text x="${config.width / 2}" y="${margin.top - 10}" text-anchor="middle" font-size="14" font-weight="bold" fill="${PALETTE.text}" font-family="${config.fontFamily}">${options.title}</text>` : '')
    + '</svg>';
}
```

### Using a Generator in Astro (Phase 51 will use this pattern)

```astro
---
// In a technique page's .astro file
import { generateHistogram } from '../../lib/eda/svg-generators/histogram';
import { normalRandom } from '../../data/eda/datasets';

const histogramSvg = generateHistogram({
  data: normalRandom,
  binCount: 15,
  showKDE: true,
  title: 'Normal Random Numbers',
  xLabel: 'Value',
  yLabel: 'Frequency',
});
---

<div class="w-full max-w-2xl mx-auto">
  <Fragment set:html={histogramSvg} />
</div>
```

### Distribution Curve Generator (SVG-11) -- Multi-Distribution Pattern

```typescript
// Supports PDF and CDF for normal, exponential, chi-square at minimum
export interface DistributionCurveOptions {
  type: 'pdf' | 'cdf';
  distribution: 'normal' | 'exponential' | 'chi-square';
  params: Record<string, number>;  // e.g., { mu: 0, sigma: 1 }
  config?: Partial<PlotConfig>;
}

export function generateDistributionCurve(options: DistributionCurveOptions): string {
  const { type, distribution, params } = options;
  const config = { ...DEFAULT_CONFIG, ...options.config };

  // Generate curve points using math functions
  const { xDomain, fn } = getDistributionFn(distribution, type, params);
  const points = range(xDomain[0], xDomain[1], (xDomain[1] - xDomain[0]) / 200);
  const values = points.map(x => ({ x, y: fn(x) }));

  // Scale and render using d3-scale + d3-shape line()
  // ... (similar to histogram pattern)
}

function getDistributionFn(
  dist: string,
  type: 'pdf' | 'cdf',
  params: Record<string, number>,
): { xDomain: [number, number]; fn: (x: number) => number } {
  switch (dist) {
    case 'normal': {
      const { mu = 0, sigma = 1 } = params;
      if (type === 'pdf') {
        return {
          xDomain: [mu - 4 * sigma, mu + 4 * sigma],
          fn: (x) => Math.exp(-0.5 * ((x - mu) / sigma) ** 2) / (sigma * Math.sqrt(2 * Math.PI)),
        };
      }
      // CDF uses erf approximation
      return { xDomain: [mu - 4 * sigma, mu + 4 * sigma], fn: (x) => normalCDF(x, mu, sigma) };
    }
    case 'exponential': { /* ... */ }
    case 'chi-square': { /* ... */ }
    default: throw new Error(`Unknown distribution: ${dist}`);
  }
}
```

### Lag Plot Generator (SVG-15)

```typescript
import { scaleLinear } from 'd3-scale';
import { extent } from 'd3-array';
import { DEFAULT_CONFIG, PALETTE, svgOpen, xAxis, yAxis, innerDimensions } from './plot-base';

export interface LagPlotOptions {
  data: number[];
  lag?: number;  // default: 1
  config?: Partial<PlotConfig>;
  title?: string;
}

export function generateLagPlot(options: LagPlotOptions): string {
  const { data, lag = 1 } = options;
  const config = { ...DEFAULT_CONFIG, ...options.config };
  const { innerWidth, innerHeight } = innerDimensions(config);
  const { margin } = config;

  // Create lag pairs: (x[i], x[i+lag])
  const pairs = data.slice(0, -lag).map((v, i) => ({ x: v, y: data[i + lag] }));
  const [xMin, xMax] = extent(pairs, d => d.x) as [number, number];
  const [yMin, yMax] = extent(pairs, d => d.y) as [number, number];
  const domainMin = Math.min(xMin, yMin);
  const domainMax = Math.max(xMax, yMax);

  const xScale = scaleLinear().domain([domainMin, domainMax]).range([margin.left, margin.left + innerWidth]);
  const yScale = scaleLinear().domain([domainMin, domainMax]).range([margin.top + innerHeight, margin.top]);

  // Diagonal reference line
  const diagLine = `<line x1="${xScale(domainMin).toFixed(2)}" y1="${yScale(domainMin).toFixed(2)}" x2="${xScale(domainMax).toFixed(2)}" y2="${yScale(domainMax).toFixed(2)}" stroke="${PALETTE.grid}" stroke-width="1" stroke-dasharray="6,4" />`;

  // Data points
  const points = pairs.map(p =>
    `<circle cx="${xScale(p.x).toFixed(2)}" cy="${yScale(p.y).toFixed(2)}" r="3" fill="${PALETTE.dataPrimary}" fill-opacity="0.6" />`
  ).join('\n');

  return svgOpen(config, `Lag ${lag} plot`)
    + diagLine + points
    + xAxis(xScale.ticks(7), xScale, margin.top + innerHeight, `Y(i)`, config)
    + yAxis(yScale.ticks(7), yScale, margin.left, `Y(i+${lag})`, config)
    + '</svg>';
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Full D3 bundle (280KB) for all chart rendering | D3 micro-modules (17KB) for computation only, hand-built SVG strings | D3 v7 modular architecture (2021+) | 94% smaller bundle, build-time compatible, no DOM dependency |
| JSDOM for server-side D3 rendering | Direct string concatenation with d3-scale/shape math | Pattern matured ~2023 | Eliminates JSDOM dependency, faster builds, simpler code |
| Separate dark/light SVG files | CSS custom properties in inline SVG | CSS Variables Level 1 (widely supported since 2020) | Single SVG output, theme changes are zero-cost |
| Canvas-based charts for web | SVG for static charts, Canvas/WebGL for interactive only | Best practice ~2022+ | SVG is indexable, accessible (aria-label), responsive, CSS-styleable |

**Deprecated/outdated:**
- `d3-node` package (JSDOM wrapper for D3): Not needed when using D3 computation modules directly. Adds unnecessary complexity and JSDOM dependency.
- `nivo` / `recharts` / `chart.js`: React-based charting libraries. Not applicable for Astro build-time SVG string generation. These render to DOM, not strings.

## Open Questions

1. **Dark Mode CSS Variable Overrides**
   - What we know: The site has a ThemeToggle that adds `.dark` class to `<html>`. CSS custom properties in `:root` define the light palette. There are NO `.dark` (or `html.dark`) overrides in `global.css` currently.
   - What's unclear: Whether the dark palette colors have already been designed/decided elsewhere, or if Phase 50 needs to define them.
   - Recommendation: Phase 50 should include creating the `html.dark` CSS variable overrides as a task. The PALETTE constants in plot-base.ts will reference the same CSS variables. Alternatively, if the team prefers to defer dark mode to Phase 55, the SVG generators still use CSS variables and will "just work" once the overrides are added. **Suggest including a minimal dark palette in Phase 50 so SVGs can be visually verified in both themes immediately.**

2. **Contour Plot Data Source**
   - What we know: SVG-08 requires a contour plot for "response surface visualization." The datasets.ts has DOE factorial data but not a 2D response surface grid.
   - What's unclear: Whether to generate a synthetic 2D grid from the DOE data or add a new dataset.
   - Recommendation: Generate a synthetic 2D response surface grid from the DOE factors using bilinear interpolation. This is a small addition to datasets.ts (~20 lines). The contour generator needs a flat array of z-values on a regular grid.

3. **Star Plot Reuse of radar-math.ts**
   - What we know: `radar-math.ts` already implements `polarToCartesian()`, `radarPolygonPoints()`, and `hexagonRingPoints()` -- exactly what star-plot.ts needs.
   - What's unclear: Whether to import from radar-math.ts directly or duplicate into the eda module.
   - Recommendation: Import from `radar-math.ts` directly. It is already a pure utility with no framework dependencies. Add a re-export from the svg-generators index if needed.

4. **Spectral Plot FFT Precision**
   - What we know: The Cooley-Tukey radix-2 FFT requires input length to be a power of 2. The timeSeries dataset has 100 values.
   - What's unclear: Whether to zero-pad to 128 or truncate to 64.
   - Recommendation: Zero-pad to 128 (next power of 2). This is standard practice and gives better frequency resolution. Document the zero-padding in the spectral plot generator.

5. **Number of Distribution Curve Types for SVG-11**
   - What we know: Success criteria 5 requires "at least 3 representative distributions (normal, exponential, chi-square)." All 19 distributions eventually need static SVG fallbacks (DIST-18, Phase 53).
   - What's unclear: Whether Phase 50 should implement all 19 distribution math functions or just the 3 required by success criteria.
   - Recommendation: Implement 5-6 distribution math functions in Phase 50 (normal, exponential, chi-square, uniform, t-distribution, gamma). This covers the 3 required by success criteria plus common distributions. Phase 53 can add the remaining 13 when building distribution pages.

## Sources

### Primary (HIGH confidence)
- Existing codebase: `src/lib/beauty-index/radar-math.ts` -- Verified SVG string generation pattern (pure TypeScript, no DOM)
- Existing codebase: `src/components/beauty-index/RadarChart.astro` -- Verified Astro component consuming SVG string generators
- Existing codebase: `src/components/db-compass/CompassRadarChart.astro` -- Confirmed inline SVG with `viewBox` pattern
- Existing codebase: `src/data/eda/datasets.ts` -- Verified sample data arrays (normalRandom, scatterData, timeSeries, boxPlotData, doeFactors)
- Existing codebase: `src/styles/global.css` -- Verified CSS custom property palette (`:root` only, no dark overrides)
- Existing codebase: `src/components/ThemeToggle.astro` -- Verified dark mode toggle mechanism (class-based)
- Existing codebase: `src/lib/eda/schema.ts` -- Verified EdaDistribution schema with parameter definitions
- D3 module verification: Confirmed `d3-scale`, `d3-shape`, `d3-array` all work without DOM via Node.js test
- Package.json: d3-scale ^4.0.2, d3-shape ^3.2.0, d3-array ^3.2.4, d3-path ^3.1.0 (all installed)

### Secondary (MEDIUM confidence)
- [d3-contour npm](https://www.npmjs.com/package/d3-contour) -- v4.0.2, marching squares implementation, pure computation
- [D3 Getting Started](https://d3js.org/getting-started) -- Confirms D3 modules work in Node.js without DOM
- [SVG dark mode with CSS variables](https://www.ctrl.blog/entry/svg-embed-dark-mode.html) -- Confirmed inline SVGs inherit CSS variables
- [SVG viewBox responsive sizing](https://www.codegenes.net/blog/change-svg-viewbox-size-with-css/) -- Confirmed viewBox + width:100% pattern

### Tertiary (LOW confidence)
- FFT implementation details -- Based on well-known Cooley-Tukey algorithm; specific JavaScript implementation performance characteristics not verified with benchmarks for this project's data sizes (100-200 points)
- Dark palette color values -- Proposed `html.dark` overrides are illustrative; actual values should be verified for WCAG contrast ratios against chosen dark background

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- D3 micro-modules confirmed working without DOM, pattern proven in existing radar-math.ts
- Architecture: HIGH -- PlotConfig/generator pattern is a scaled version of existing radar chart approach, well-understood
- Math utilities: HIGH -- KDE, regression, FFT, normal quantile are standard algorithms; implementation is straightforward pure math
- Dark/light theme: MEDIUM -- CSS variable approach is correct but dark palette overrides need to be created (currently missing from site)
- Pitfalls: HIGH -- SVG text rendering, viewBox, scale inversion pitfalls are well-documented and widely known

**Research date:** 2026-02-24
**Valid until:** 2026-03-24 (SVG and D3 APIs are stable; this is implementation guidance, not library version tracking)
