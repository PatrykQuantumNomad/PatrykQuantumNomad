# Phase 29: Visualization Components - Research

**Researched:** 2026-02-21
**Domain:** Build-time SVG generation, responsive data visualization, Astro component patterns, client-side table sorting
**Confidence:** HIGH

## Summary

Phase 29 builds five visualization components for the Database Compass: a complexity spectrum (VIZ-01), 8-axis octagonal radar charts (VIZ-02), score breakdown bars (VIZ-03), a sortable scoring table (VIZ-04), and a CAP theorem badge (VIZ-05), all responsive across three breakpoints (VIZ-06). Every component has a direct, battle-tested precedent in the Beauty Index codebase (`src/components/beauty-index/`). The work is 80% pattern replication and 20% adaptation for 8 axes (vs 6), nested scores (vs flat), and the new spectrum visualization.

The data layer from Phase 28 is complete: 12 database model entries in `models.json` validated by Zod schema in `schema.ts`, with `dimensionScores()` and `totalScore()` helpers ready to consume, and 8 dimension definitions in `dimensions.ts`. The content collection `dbModels` is registered in `content.config.ts`. All type contracts are established.

The primary technical challenge is radar chart label readability at 375px with 8 axes instead of 6. The Beauty Index uses single Greek letter symbols as labels, which fit easily at small sizes. Database Compass uses Unicode symbols (`\u2191`, `\u26A1`, etc.) which are similarly compact, but 8 labels on an octagon have ~33% less angular spacing between them (45 degrees vs 60 degrees). At small viewports the chart itself shrinks, compounding the crowding. The research below documents the math, the existing patterns, and the specific adaptations needed.

**Primary recommendation:** Create all five components in `src/components/db-compass/`, following the Beauty Index component patterns exactly. The complexity spectrum needs a new `spectrum-math.ts` utility; all other components reuse existing `radar-math.ts` functions and established Astro patterns. The only client-side JavaScript is the sortable table script (proven pattern from `ScoringTable.astro`). A dimension colors definition is needed (missing from Phase 28) -- add `DIMENSION_COLORS` to `dimensions.ts` or create a separate colors file.

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Astro | 5.17.1 (installed) | Build-time SVG rendering in `.astro` components | All Beauty Index visualizations use this pattern; ships zero JS |
| TypeScript | ^5.9.3 (installed) | Type-safe SVG math, component props, data access | All lib files use TS |
| radar-math.ts | existing | `polarToCartesian`, `radarPolygonPoints`, `hexagonRingPoints` | Axis-count agnostic -- pass 8 values, get octagon. Verified in source. |
| Tailwind CSS | 3.4.19 (installed) | Responsive layout, utility classes for breakpoints | All existing components use Tailwind |
| Zod (via astro/zod) | bundled | Schema types consumed by components | Phase 28 established schema |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| None | - | - | Zero new dependencies. All visualization math is pure TypeScript. |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Hand-rolled SVG math | D3.js, Chart.js, Recharts | Adds 30-200KB bundle; project constraint forbids new dependencies; build-time SVG is simpler |
| Build-time SVG | Canvas rendering | Cannot server-render; requires client JS; no text selection or accessibility |
| Inline `<script>` for sort | React island for table | Overkill for a single sort feature; Beauty Index proves inline script works |

**Installation:**
```bash
# No installation needed. Zero new dependencies.
```

## Architecture Patterns

### Recommended Project Structure
```
src/
  lib/
    db-compass/
      schema.ts              # EXISTS (Phase 28) - types, helpers
      dimensions.ts           # EXISTS (Phase 28) - 8 dimensions, needs DIMENSION_COLORS addition
      spectrum-math.ts        # NEW - complexity spectrum SVG positioning math
    beauty-index/
      radar-math.ts           # EXISTS - reused directly (axis-count agnostic)
  components/
    db-compass/
      ComplexitySpectrum.astro # NEW (VIZ-01) - horizontal build-time SVG
      CompassRadarChart.astro  # NEW (VIZ-02) - 8-axis octagonal radar
      CompassScoreBreakdown.astro # NEW (VIZ-03) - 8 dimension bars
      CompassScoringTable.astro   # NEW (VIZ-04) - sortable table, 12 models x 8 dims
      CapBadge.astro           # NEW (VIZ-05) - CP/AP/CA/Tunable indicator
```

### Pattern 1: Build-Time SVG in Astro Components
**What:** SVG math computed in the Astro frontmatter (server-side at build), SVG markup rendered as static HTML. Zero client JS.
**When to use:** All visualization components except the sortable table's sort interaction.
**Existing precedent:**
```astro
---
// Source: src/components/beauty-index/RadarChart.astro
import { polarToCartesian, radarPolygonPoints, hexagonRingPoints } from '../../lib/beauty-index/radar-math';
const scores = dimensionScores(language);
const polygonPoints = radarPolygonPoints(cx, cy, maxRadius, scores, 10);
---
<svg width={size} height={size} viewBox={...} role="img" aria-label="...">
  {/* All SVG elements use computed values from frontmatter */}
</svg>
```

### Pattern 2: Inline Client Script for Table Sorting
**What:** A `<script>` tag inside the Astro component that adds click handlers for column sorting. Data attributes on `<tr>` elements carry sort values. Uses `astro:page-load` event for view transition compatibility.
**When to use:** Only for VIZ-04 (sortable scoring table).
**Existing precedent:**
```astro
---
// Source: src/components/beauty-index/ScoringTable.astro (lines 133-189)
---
<script>
  document.addEventListener('astro:page-load', () => {
    const table = document.querySelector<HTMLTableElement>('[data-sortable]');
    // ... sort logic using data-* attributes on <tr> elements
  });
</script>
```
**Key details:**
- Sort buttons are `<button>` elements inside `<th>` for keyboard accessibility
- `aria-sort` attribute updated on active column
- Live region (`aria-live="polite"`) announces sort changes to screen readers
- CSS classes `sort-asc`/`sort-desc` drive visual indicators via `::after` pseudo-elements

### Pattern 3: Badge Component (Minimal)
**What:** A simple Astro component that maps a data value to a color-coded display.
**When to use:** VIZ-05 (CAP badge).
**Existing precedent:**
```astro
---
// Source: src/components/beauty-index/TierBadge.astro
const { tier, size = 'md' } = Astro.props;
const color = getTierColor(tier);
---
<span class={classes} style={`background-color: ${color}20; color: ${textColor};`}>
  {label}
</span>
```

### Pattern 4: Pure TypeScript SVG Math Utility
**What:** A `.ts` file exporting pure functions that compute SVG coordinates. No DOM, no framework, no side effects.
**When to use:** VIZ-01 needs a new `spectrum-math.ts` for computing model positions on the horizontal spectrum.
**Existing precedent:** `src/lib/beauty-index/radar-math.ts` -- exports `polarToCartesian`, `radarPolygonPoints`, `hexagonRingPoints`, `generateRadarSvgString`.

### Anti-Patterns to Avoid

- **Importing from `beauty-index/tiers.ts` for db-compass components:** The Beauty Index tier system (beautiful/handsome/practical/workhorses) is specific to programming languages. Database Compass does not have tiers. Create db-compass-specific color definitions.

- **Hardcoding `numAxes = 6` or `numSides = 6`:** The Beauty Index RadarChart.astro hardcodes `const numAxes = 6`. The new CompassRadarChart must use `const numAxes = 8` (or better: `const numAxes = DIMENSIONS.length`).

- **Using the Beauty Index `dimensionScores()` function:** There are two `dimensionScores()` functions -- one in `src/lib/beauty-index/schema.ts` and one in `src/lib/db-compass/schema.ts`. Import from `db-compass/schema.ts` for db-compass components.

- **Rendering radar chart labels as full words at small sizes:** At 375px the radar chart is ~160-200px. Full dimension names like "Operational Simplicity" will overlap catastrophically. Use `shortName` from dimensions.ts at all sizes, or switch to `symbol` (single Unicode character) below a threshold.

- **Forgetting `role="img"` and `aria-label` on SVG elements:** Every build-time SVG must have accessibility attributes. The Beauty Index sets this precedent on every SVG component.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Polar-to-cartesian math | Custom trig functions | `polarToCartesian()` from radar-math.ts | Tested, handles 12 o'clock offset, proven in production |
| Regular polygon points | Loop with manual sin/cos | `hexagonRingPoints(cx, cy, radius, 8)` from radar-math.ts | Despite the name, it generates any N-sided polygon |
| Data polygon from scores | Custom SVG path builder | `radarPolygonPoints(cx, cy, maxRadius, scores, 10)` from radar-math.ts | Handles arbitrary axis count via `values.length` |
| Table sort logic | React state, external sort lib | Inline `<script>` pattern from ScoringTable.astro | 55 lines, zero dependencies, keyboard accessible |
| Responsive breakpoints | Custom media queries | Tailwind's `sm:`, `md:`, `lg:` utility classes | Existing site convention |

**Key insight:** Four of the five visualization components are structural copies of existing Beauty Index components with different data imports and axis counts. The complexity spectrum is the only genuinely new visualization, and it is geometrically simpler than a radar chart (linear axis vs polar coordinates).

## Common Pitfalls

### Pitfall 1: 8-Axis Radar Label Crowding at 375px
**What goes wrong:** With 8 axes at 45-degree intervals (vs 6 axes at 60 degrees), labels crowd together, especially at the 3 o'clock and 9 o'clock positions where adjacent labels are closest.
**Why it happens:** Angular spacing decreases with more axes. At 375px viewport, the radar chart renders at ~160px diameter. Label font at 14px (Beauty Index default) occupies ~8px height. Two labels 45 degrees apart at a radius of ~80px are only ~60px apart in Cartesian distance -- tight for even 4-character shortNames.
**How to avoid:**
1. Use `symbol` (single Unicode character: `\u2191`, `\u26A1`, etc.) as labels at all sizes, consistent with Beauty Index's Greek letters
2. If shortNames are desired on desktop, use a `size`-dependent switch: symbols below 250px chart size, shortNames at 300px+
3. Increase `labelRadius` offset from `maxRadius + 20` (Beauty Index) to `maxRadius + 24` for 8-axis charts
4. Test at exact breakpoints: 375px, 768px, 1024px with actual rendered output
**Warning signs:** Labels overlapping visually; text clipped by SVG viewBox; labels running off-screen on mobile.

### Pitfall 2: Complexity Spectrum Label Collision for Closely-Spaced Models
**What goes wrong:** Multiple models share similar `complexityPosition` values (e.g., time-series=0.35, relational=0.42, search=0.45 -- three models within 10% of the spectrum width). Their labels overlap horizontally.
**Why it happens:** 12 labels on a 375px-wide horizontal axis have ~31px average spacing. Three labels at 0.35/0.42/0.45 occupy ~23px of horizontal space total, but each label (e.g., "Relational (SQL)") is 80-100px wide at 11px font.
**How to avoid:**
1. Use alternating vertical offset (stagger labels above/below the axis line) as ARCHITECTURE.md recommends
2. Use shortNames or abbreviated labels for the spectrum ("KV", "Doc", "Rel", "Col", "TS", "Search", "Vec", "NewSQL", "Graph", "Obj", "Multi")
3. On mobile (375px), rotate labels 45-60 degrees or use a vertical layout (spectrum becomes a vertical bar)
4. Use the `complexityPosition` values to detect clusters and apply additional vertical stagger for models within 0.08 of each other
**Warning signs:** Labels overlapping on mobile preview; spectrum unreadable below 600px width.

### Pitfall 3: Score Breakdown Bars Not Matching Radar Chart Order
**What goes wrong:** The radar chart renders dimensions in the order defined by `DIMENSIONS` array (scalability first, clockwise). The score breakdown component lists dimensions in a different order (e.g., alphabetical, or the order of `Object.keys(model.scores)`).
**Why it happens:** `Object.keys()` on a JavaScript object does not guarantee order. The `DIMENSIONS` array is the canonical order. If the score breakdown iterates over the scores object instead of the DIMENSIONS array, the visual mismatch between chart and breakdown confuses users.
**How to avoid:** Always iterate over `DIMENSIONS` array, never over `Object.keys(model.scores)`. Access scores via `model.scores[dim.key]` where `dim` comes from the DIMENSIONS iteration. This is exactly what the Beauty Index ScoreBreakdown.astro does with its `DIMENSIONS.map()` pattern.
**Warning signs:** Score breakdown shows "ecosystemMaturity" first while radar chart shows "scalability" at 12 o'clock.

### Pitfall 4: Missing Dimension Colors for DB Compass
**What goes wrong:** The Beauty Index has `DIMENSION_COLORS` in `tiers.ts` mapping each dimension key to a hex color. The DB Compass `dimensions.ts` file from Phase 28 does not include colors. Without colors, the radar chart data polygon is a single color (acceptable) but the score breakdown bars, scoring table, and spectrum dots all lack per-dimension visual differentiation.
**Why it happens:** Phase 28 focused on schema and data. Colors are a visualization concern. The Dimension interface has no `color` field.
**How to avoid:** Add a `DIMENSION_COLORS` record to `src/lib/db-compass/dimensions.ts` (or add a `color` field to the Dimension interface). Use 8 visually distinct colors with sufficient contrast against the `#fffaf7` background. Recommended: extend the Beauty Index 6-color palette with 2 additional colors for the 2 new dimensions.
**Warning signs:** All score bars are the same color; no visual distinction between dimensions in the scoring table.

### Pitfall 5: Sortable Table with 8 Dimension Columns Overflowing on Mobile
**What goes wrong:** The Beauty Index scoring table has: Rank + Language + 6 dims + Total = 9 columns. Database Compass has: Rank + Model + 8 dims + Total = 11 columns. At 375px, 11 columns of ~60px minimum = 660px, requiring horizontal scroll.
**Why it happens:** More columns than horizontal pixels at mobile viewport.
**How to avoid:**
1. Use `overflow-x-auto` (existing pattern from ScoringTable.astro and FeatureMatrix.astro)
2. Make the first column (Model name) sticky with `sticky left-0 bg-[var(--color-surface)]` (existing pattern from FeatureMatrix.astro)
3. Use dimension symbols (`\u2191`, `\u26A1`) as column headers instead of shortNames to minimize column width
4. Optionally hide the Rank column on mobile
**Warning signs:** Table overflows viewport without scroll indicator; model names scroll off-screen with no anchor.

### Pitfall 6: SVG viewBox Clipping Labels
**What goes wrong:** Labels positioned outside the chart area (radar axis labels, spectrum endpoint labels) are clipped because the viewBox does not account for label overflow.
**Why it happens:** The SVG `width` and `height` define the chart area, but labels extend beyond it. Without padding in the viewBox, they are invisible.
**How to avoid:** Add padding to the viewBox calculation, exactly as the Beauty Index RadarChart does (`const pad = 24; const vbSize = size + pad * 2; viewBox="0 0 ${vbSize} ${vbSize}"`). For the 8-axis chart, increase padding to account for longer labels or more tightly spaced labels. The `generateRadarSvgString()` function in radar-math.ts adds `size * 0.18` padding -- this may need to increase for 8 axes.
**Warning signs:** Labels appear in the page inspector DOM but are not visible; truncated text at chart edges.

## Code Examples

Verified patterns from the existing codebase:

### CompassRadarChart.astro (VIZ-02) -- Adapting RadarChart for 8 Axes

```astro
---
// Follows: src/components/beauty-index/RadarChart.astro
import { polarToCartesian, radarPolygonPoints, hexagonRingPoints } from '../../lib/beauty-index/radar-math';
import { DIMENSIONS, DIMENSION_COLORS } from '../../lib/db-compass/dimensions';
import type { DbModel } from '../../lib/db-compass/schema';
import { dimensionScores } from '../../lib/db-compass/schema';

interface Props {
  model: DbModel;
  size?: number;
}

const { model, size = 300 } = Astro.props;

const pad = 28;  // Slightly more than Beauty Index's 24 for 8 labels
const vbSize = size + pad * 2;
const cx = vbSize / 2;
const cy = vbSize / 2;
const maxRadius = size * 0.42;  // Slightly smaller than BI's 0.44 to leave label room
const scores = dimensionScores(model);

const numAxes = DIMENSIONS.length; // 8
const angleStep = (2 * Math.PI) / numAxes;
const gridLevels = [2, 4, 6, 8, 10];

// Axis endpoints for lines from center
const axisEndpoints = Array.from({ length: numAxes }, (_, i) => {
  const angle = i * angleStep;
  return polarToCartesian(cx, cy, angle, maxRadius);
});

// Label positions outside chart
const labelRadius = maxRadius + 22;
const labelPositions = DIMENSIONS.map((dim, i) => {
  const angle = i * angleStep;
  const pos = polarToCartesian(cx, cy, angle, labelRadius);
  const color = DIMENSION_COLORS[dim.key] || '#5a5a5a';
  return { ...pos, dim, color };
});

// Data polygon
const polygonPoints = radarPolygonPoints(cx, cy, maxRadius, scores, 10);
const accentColor = 'var(--color-accent)'; // or a fixed hex for SVG
---

<svg
  width={size}
  height={size}
  viewBox={`0 0 ${vbSize} ${vbSize}`}
  xmlns="http://www.w3.org/2000/svg"
  role="img"
  aria-label={`Radar chart for ${model.name} showing scores across 8 dimensions`}
>
  {/* Concentric octagonal grid rings */}
  {gridLevels.map((level) => {
    const ringRadius = (level / 10) * maxRadius;
    const points = hexagonRingPoints(cx, cy, ringRadius, numAxes);
    return <polygon points={points} fill="none" stroke="#e5ddd5" stroke-width="1" />;
  })}

  {/* 8 axis lines from center */}
  {axisEndpoints.map((ep) => (
    <line x1={cx} y1={cy} x2={ep.x.toFixed(2)} y2={ep.y.toFixed(2)} stroke="#e5ddd5" stroke-width="1" />
  ))}

  {/* Data polygon */}
  <polygon
    points={polygonPoints}
    fill="#c44b20"
    fill-opacity="0.3"
    stroke="#c44b20"
    stroke-width="2"
  />

  {/* Axis labels: dimension symbols */}
  {labelPositions.map((lp) => (
    <text
      x={lp.x.toFixed(2)}
      y={lp.y.toFixed(2)}
      text-anchor="middle"
      dominant-baseline="middle"
      font-size="13"
      font-weight="bold"
      fill={lp.color}
      font-family="'DM Sans', sans-serif"
    >
      {lp.dim.symbol}
    </text>
  ))}
</svg>
```

### spectrum-math.ts (VIZ-01) -- New Utility

```typescript
// Source: .planning/research/ARCHITECTURE.md (verified design)

export interface SpectrumPoint {
  x: number;
  y: number;
  label: string;
  id: string;
  complexityPosition: number;
}

/**
 * Computes pixel positions for models on the complexity spectrum.
 * Pure function, zero side effects, usable in Astro and Satori.
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
    complexityPosition: m.complexityPosition,
  }));
}
```

### CompassScoringTable.astro (VIZ-04) -- Data Attribute Pattern for 8 Dimensions

```astro
---
// Key difference from ScoringTable.astro: scores are nested (model.scores[dim.key])
// instead of flat (lang[dim.key]). Data attributes must use dim.key for sort mapping.
---
<tr
  data-rank={i + 1}
  data-name={model.name.toLowerCase()}
  data-scalability={model.scores.scalability}
  data-performance={model.scores.performance}
  data-reliability={model.scores.reliability}
  data-operationalSimplicity={model.scores.operationalSimplicity}
  data-queryFlexibility={model.scores.queryFlexibility}
  data-schemaFlexibility={model.scores.schemaFlexibility}
  data-ecosystemMaturity={model.scores.ecosystemMaturity}
  data-learningCurve={model.scores.learningCurve}
  data-total={totalScore(model)}
>
```

**Note on data attribute naming:** HTML data attributes are case-insensitive and lowercased by the DOM. `data-operationalSimplicity` becomes `dataset.operationalsimplicity` in JavaScript. The sort script must account for this by using lowercase keys in `dataset[key]` lookups, or by using kebab-case data attributes (`data-operational-simplicity`) with the corresponding camelCase dataset access (`dataset.operationalSimplicity`). The Beauty Index avoids this issue because its dimension keys are single Greek letters (`data-phi`, `data-omega`).

**Recommended approach:** Use kebab-case data attributes: `data-operational-simplicity`, `data-query-flexibility`, etc. In the sort script, the `dataset` API automatically converts these to camelCase: `dataset.operationalSimplicity`. Use `data-sort` attribute on buttons with the camelCase form to match dataset property names.

### CapBadge.astro (VIZ-05) -- CAP Theorem Badge

```astro
---
interface Props {
  classification: 'CP' | 'AP' | 'CA' | 'Tunable';
  size?: 'sm' | 'md' | 'lg';
}

const { classification, size = 'md' } = Astro.props;

const CAP_CONFIG: Record<string, { label: string; color: string; textColor: string }> = {
  CP: { label: 'CP', color: '#4A90D9', textColor: '#2c6fad' },
  AP: { label: 'AP', color: '#2AAA8A', textColor: '#1f8068' },
  CA: { label: 'CA', color: '#E8734A', textColor: '#c45a34' },
  Tunable: { label: 'Tunable', color: '#D4A843', textColor: '#a88335' },
};

const config = CAP_CONFIG[classification];
---

<span
  class={`inline-block rounded-md font-semibold ${sizeClasses[size]}`}
  style={`background-color: ${config.color}20; color: ${config.textColor};`}
  title={`CAP Theorem: ${config.label}`}
>
  {config.label}
</span>
```

### CompassScoreBreakdown.astro (VIZ-03) -- Adapted for Nested Scores

```astro
---
// Key difference from ScoreBreakdown.astro: uses model.scores[dim.key] instead of language[dim.key]
import { DIMENSIONS, DIMENSION_COLORS } from '../../lib/db-compass/dimensions';
import type { DbModel } from '../../lib/db-compass/schema';
import { totalScore } from '../../lib/db-compass/schema';

interface Props {
  model: DbModel;
}

const { model } = Astro.props;
const total = totalScore(model);

const dimensionRows = DIMENSIONS.map((dim) => {
  const score = model.scores[dim.key];
  const color = DIMENSION_COLORS[dim.key];
  const widthPercent = (score / 10) * 100;
  return { dim, score, color, widthPercent };
});
---
```

## Responsive Strategy (VIZ-06)

### Breakpoint Behavior

| Component | 375px (mobile) | 768px (tablet) | 1024px+ (desktop) |
|-----------|---------------|----------------|-------------------|
| ComplexitySpectrum | Vertical layout or narrow horizontal with staggered labels | Full horizontal with staggered labels | Full horizontal, comfortable spacing |
| CompassRadarChart | size=200, symbol labels only | size=260, symbol labels | size=300, symbol labels (or shortNames) |
| CompassScoreBreakdown | Full width, stacked rows | Side-by-side with radar | Side-by-side with radar |
| CompassScoringTable | overflow-x-auto, sticky model column, symbol headers | Full table visible | Full table visible |
| CapBadge | Inline, sm size | Inline, md size | Inline, md size |

### Radar Chart Size Scaling

The Beauty Index uses a fixed `size={300}` on detail pages and `size={160}` for grid thumbnails. For Database Compass:

- **Detail page:** `size={300}` desktop, `size={240}` tablet, `size={200}` mobile. Use Tailwind responsive classes on wrapper, or pass size conditionally. Since Astro builds at a single viewport (it's SSG), use CSS scaling or a single intermediate size (280px) with `max-width: 100%` on the SVG and `viewBox` scaling.

- **Grid thumbnails (future overview page):** `size={160}` consistently, using symbols only.

**Recommended approach:** Render the SVG at a single `size` (e.g., 300) but make the wrapper responsive with `max-width: 100%` and let the SVG scale via viewBox. The SVG `width` attribute sets the intrinsic size but CSS can override it. Add `class="w-full max-w-[300px]"` to the wrapper.

### Spectrum Mobile Strategy

At 375px, a horizontal spectrum with 12 labels is tight. Options:

1. **Horizontal with CSS overflow-x-auto:** Let spectrum scroll horizontally. Simple but hides content.
2. **Horizontal with very short labels and alternating stagger:** Use 2-4 character abbreviations (KV, Doc, Mem, TS, Rel, Search, Col, Vec, SQL, Graph, Obj, Multi) with labels alternating above/below the axis line.
3. **Vertical orientation on mobile:** Rotate spectrum to vertical (top=simple, bottom=complex). Most natural reading direction on narrow screens.

**Recommendation:** Use option 2 (short labels with stagger) for all viewports. The spectrum is a quick visual overview, not a primary navigation element. Abbreviated labels are sufficient -- each dot links to the full model detail page. On mobile, ensure the SVG uses `viewBox` scaling and `width="100%"` so it fills the container.

## Missing Dependencies from Phase 28

### DIMENSION_COLORS

The `src/lib/db-compass/dimensions.ts` file exports `DIMENSIONS` and `Dimension` but does not define colors for each dimension. The Beauty Index has `DIMENSION_COLORS` in `tiers.ts`:

```typescript
// src/lib/beauty-index/tiers.ts (existing)
export const DIMENSION_COLORS: Record<string, string> = {
  phi: '#4A90D9',
  omega: '#7B68EE',
  lambda: '#2AAA8A',
  psi: '#E8734A',
  gamma: '#8FBC5A',
  sigma: '#D4A843',
};
```

**Phase 29 must add a `DIMENSION_COLORS` record to `src/lib/db-compass/dimensions.ts`:**

```typescript
/** Color palette for each dimension, keyed by dimension key */
export const DIMENSION_COLORS: Record<keyof import('./schema').Scores, string> = {
  scalability: '#4A90D9',      // Blue -- growth/upward
  performance: '#E8734A',      // Coral -- speed/energy
  reliability: '#2AAA8A',      // Teal -- stability
  operationalSimplicity: '#8FBC5A', // Green -- ease
  queryFlexibility: '#7B68EE',  // Purple -- flexibility
  schemaFlexibility: '#D4A843', // Gold -- adaptability
  ecosystemMaturity: '#C44B20', // Burnt orange -- maturity
  learningCurve: '#9B59B6',    // Violet -- education
};
```

These 8 colors must be:
- Visually distinct from each other
- Readable against the `#fffaf7` surface background
- Consistent with the site's existing warm palette

### SVG Font Rendering of Unicode Symbols

The 8 dimension symbols from `dimensions.ts` are:
- `\u2191` (upward arrow) -- scalability
- `\u26A1` (high voltage / lightning) -- performance
- `\u2693` (anchor) -- reliability
- `\u2699` (gear) -- operational simplicity
- `\u2BD1` (uncertainty sign) -- query flexibility
- `\u29C9` (joined squares) -- schema flexibility
- `\u2605` (black star) -- ecosystem maturity
- `\u2197` (north-east arrow) -- learning curve

**Potential issue:** `\u2BD1` and `\u29C9` are less common Unicode characters that may not render in all system fonts or in SVG contexts. They are BMP-safe (not emoji-range), which is correct per the Phase 28 decision. However, the `font-family` specified on SVG text elements must include a font that supports these codepoints.

**Mitigation:** Use `font-family="'DM Sans', 'Noto Sans', sans-serif"` in SVG `<text>` elements. DM Sans may lack these glyphs; Noto Sans has broader Unicode coverage. The existing Beauty Index uses `font-family="Georgia, 'Noto Sans', serif"` for Greek letters. Test all 8 symbols in the actual rendered SVG during implementation.

**Fallback:** If `\u2BD1` or `\u29C9` do not render, replace with simpler alternatives:
- queryFlexibility: `Q` (plain letter) or `\u2318` (place of interest sign)
- schemaFlexibility: `\u25A6` (square with diagonal crosshatch) or `S` (plain letter)

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Client-side chart rendering (D3, Chart.js) | Build-time SVG in Astro components | Astro 1.0 (2022) + team adoption | Zero JS for visualizations, faster page load, better SEO |
| `hexagonRingPoints` name implies 6 sides | Function is actually N-sided polygon generator | Original implementation | Pass `8` for numSides, get octagon -- no code change needed |
| React islands for all interactivity | Inline `<script>` for simple interactions | Beauty Index v1.3 | Table sorting needs ~55 lines of vanilla JS, not a React island |
| Separate `tiers.ts` for dimension colors | Can add `DIMENSION_COLORS` directly to `dimensions.ts` | This phase | Consolidates dimension metadata in one file |

**Deprecated/outdated:**
- Using `type: 'data'` in content collection definitions -- use `loader: file()` (Astro 5)
- Importing `z` from `zod` directly -- use `astro/zod`

## Open Questions

1. **Spectrum orientation on mobile**
   - What we know: Horizontal spectrum works well at 768px+ but 12 labels at 375px will be tight
   - What's unclear: Whether short abbreviated labels with stagger are sufficient or if a vertical orientation is needed on mobile
   - Recommendation: Start with horizontal + stagger + short labels at all breakpoints. If testing reveals illegibility at 375px, add a mobile-specific vertical variant. The SVG `viewBox` approach means the same SVG can scale down gracefully.

2. **Radar chart polygon color: fixed accent or per-model color?**
   - What we know: Beauty Index uses tier colors (different color per tier). Database Compass has no tier system.
   - What's unclear: Whether all 12 radar charts should use the same accent color (`#c44b20`) or each model should have a unique color.
   - Recommendation: Use the site accent color (`#c44b20`) for all radar chart data polygons. This is simpler, consistent, and avoids the need for a model-to-color mapping. The visual differentiation comes from the polygon shape (scores vary per model), not the color.

3. **Score breakdown total display: /80 or weighted?**
   - What we know: Beauty Index shows `total/60` (6 dims x 10 max). Database Compass has 8 dims x 10 max = 80 max.
   - What's unclear: Whether to display total as raw sum (/80) or normalize to a friendlier scale.
   - Recommendation: Display as `/80` to match the raw sum. The `totalScore()` function already returns the raw sum. Normalization (to /100 or /10) adds a layer of indirection that the Beauty Index avoids.

4. **Unicode symbol rendering validation**
   - What we know: `\u2BD1` and `\u29C9` are BMP-safe but uncommon. Phase 28 chose them to avoid emoji-range codepoints.
   - What's unclear: Whether they render correctly in SVG `<text>` elements across browsers and operating systems.
   - Recommendation: During implementation, build and visually inspect the radar chart and score breakdown at all three breakpoints. If any symbol shows as a tofu box (missing glyph), replace with a plain letter alternative. This is a Phase 29 verification task, not a blocker.

## Sources

### Primary (HIGH confidence)
- `src/lib/beauty-index/radar-math.ts` -- verified axis-count agnostic implementation; `values.length` parameter, `numSides` parameter, not hardcoded to 6
- `src/components/beauty-index/RadarChart.astro` -- verified build-time SVG pattern with frontmatter math + JSX SVG markup
- `src/components/beauty-index/ScoreBreakdown.astro` -- verified dimension iteration pattern using `DIMENSIONS.map()` and `language[dim.key]` access
- `src/components/beauty-index/ScoringTable.astro` -- verified inline `<script>` sort pattern: data attributes, button headers, aria-sort, live region
- `src/components/beauty-index/TierBadge.astro` -- verified badge component pattern: prop-to-color mapping, size variants
- `src/components/beauty-index/FeatureMatrix.astro` -- verified sticky column pattern for mobile table scrolling
- `src/components/beauty-index/RankingBarChart.astro` -- verified build-time SVG bar chart pattern
- `src/lib/db-compass/schema.ts` -- verified `DbModel` type, `dimensionScores()`, `totalScore()` exports
- `src/lib/db-compass/dimensions.ts` -- verified 8 `DIMENSIONS` entries with `key`, `symbol`, `name`, `shortName`, `description`
- `src/data/db-compass/models.json` -- verified 12 entries with nested `scores`, `justifications`, `capTheorem` objects
- `.planning/research/ARCHITECTURE.md` -- verified complexity spectrum design, radar chart reuse analysis, spectrum-math.ts specification

### Secondary (MEDIUM confidence)
- `.planning/research/STACK.md` -- verified zero-dependency conclusion for SVG visualizations
- `.planning/research/PITFALLS.md` -- verified label crowding, mobile radar, table overflow concerns
- `.planning/research/FEATURES.md` -- verified 1D spectrum decision (single `complexityPosition` settled in Phase 28 schema)

### Tertiary (LOW confidence)
- Unicode symbol rendering across browsers -- needs empirical validation during implementation
- Exact label spacing at 375px with 8-axis octagon -- needs visual testing

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- zero new dependencies; all tools exist in codebase
- Architecture: HIGH -- every component has a direct Beauty Index precedent; patterns verified in source
- Pitfalls: HIGH -- label crowding and table overflow documented with specific measurements; mobile radar concern flagged in project research
- Code examples: HIGH -- all examples derived from verified existing source files, not training data

**Research date:** 2026-02-21
**Valid until:** 2026-03-21 (30 days -- stable patterns, no external API dependencies)
