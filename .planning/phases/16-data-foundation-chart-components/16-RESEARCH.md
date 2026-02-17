# Phase 16: Data Foundation & Chart Components - Research

**Researched:** 2026-02-17
**Domain:** Astro 5 content collections, Zod validation, build-time SVG chart generation, Satori OG compatibility
**Confidence:** HIGH

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions

#### The 6 Aesthetic Dimensions
- **B = Phi + Omega + Lambda + Psi + Gamma + Sigma** (total Beauty score)
- **Phi -- Aesthetic Geometry**: Visual cleanliness, grid-based order, proportional structure. How code *looks* on a screen. Grounded in Bauhaus design.
- **Omega -- Mathematical Elegance**: Inevitability, unexpectedness, economy. Algorithms that feel "straight from The Book." Grounded in Hardy's *A Mathematician's Apology*.
- **Lambda -- Linguistic Clarity**: Code that reads like well-written prose. Signal-to-noise ratio at the level of meaning. Grounded in Knuth's Literate Programming.
- **Psi -- Practitioner Happiness**: The felt experience of writing and reading code. Flow states, community love, tooling pleasure. Grounded in developer experience research.
- **Gamma -- Organic Habitability**: Code as a place where programmers can live. Growth points, graceful aging, extensibility. Grounded in Richard Gabriel's "Habitability" and Wabi-Sabi philosophy.
- **Sigma -- Conceptual Integrity**: Does the language have a soul? Coherent design philosophy where features feel like natural consequences of a single idea. Grounded in Aristotelian consistency.

#### Scoring System
- Each dimension scored 1-10, **integers only**
- All dimensions **equally weighted** -- total = simple sum, max 60
- No weighting multipliers

#### Tier System
- 4 tiers: **Beautiful**, **Handsome**, **Practical**, **Workhorses**
- Tier boundaries: **evenly distributed** across the 6-60 score range
- Each tier gets a **distinct color** used consistently across the site (bar charts, badges, language cards, radar fills)
- **Tier colors only** -- no per-language brand colors. Languages inherit their tier's color.

#### Character Sketches
- **Personality/editorial style** -- opinionated, witty character descriptions for each language
- Not factual summaries; these should give each language a voice and make content shareable

#### Dimension Display
- **Short versions on-site**: Each dimension gets a 1-2 sentence summary for the overview page or tooltips
- Full intellectual grounding (Bauhaus, Hardy, Knuth references) lives in the methodology **blog post only**
- Data model stores: name, Greek symbol, short description -- NOT the philosophical grounding

#### Radar Chart Style
- **Filled polygon** -- solid/semi-transparent fill, no outline-only
- Polygon color = **tier color** of the language
- Axis labels: **Symbols + short names** (e.g., "Phi Geometry", "Omega Elegance", "Lambda Clarity", "Psi Happiness", "Gamma Habitability", "Sigma Integrity")
- **Grid rings visible** -- concentric hexagons at score intervals for reading exact values

#### Bar Chart Style
- **Horizontal orientation** -- language names left-aligned, bars extend right
- **Stacked segments** -- each bar divided into 6 colored segments for the 6 dimensions
- Dimension segments use **distinct dimension colors** (unique color per dimension, consistent across all bars, with legend)
- **Visual tier dividers** -- horizontal lines or background bands separating the 4 tier groups

### Claude's Discretion
- Exact tier color palette selection (must be distinct, work with the site's existing design)
- Exact dimension segment color palette for stacked bars
- Grid ring intervals on radar charts (e.g., every 2 points vs every 2.5)
- Radar chart sizing at different contexts (thumbnail vs full-size vs OG image)
- Polygon opacity level
- Font choices for chart labels
- Exact tier boundary numbers (evenly distributed across 6-60 range)

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope

</user_constraints>

<phase_requirements>

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| DATA-01 | Language data schema (languages.json) with Zod validation for all 25 languages | Zod v3 via `astro/zod`, `file()` loader pattern, schema design documented below |
| DATA-02 | Shared radar SVG math utility (polar-to-cartesian) for Astro + OG images | Pure TypeScript utility pattern, Satori SVG-as-data-URI approach documented below |
| DATA-03 | Content collection integration via Astro 5 `file()` loader | `file()` loader API verified against Astro 5.17.1 docs, code examples below |
| DATA-04 | Greek symbol rendering validated across site fonts with fallback | CRITICAL FINDING: Neither DM Sans nor Bricolage Grotesque supports Greek. `unicode-range` fallback strategy documented below |
| CHART-01 | Build-time SVG radar chart component -- zero client-side JS | Astro component with inline SVG generation, polar math, hexagonal grid rings |
| CHART-02 | Build-time SVG ranking bar chart -- all 25 languages sorted | SVG `<rect>` stacked horizontal bars with `<text>` labels, tier dividers |
| CHART-03 | Tier badge component with color-coded indicators | Simple Astro component with tier color lookup from shared constants |
| CHART-04 | Score breakdown display showing individual dimension scores | Astro component consuming typed data from content collection |

</phase_requirements>

## Summary

This phase establishes two foundational layers: a validated data model for 25 programming languages scored across 6 aesthetic dimensions, and a set of build-time SVG chart components that render those scores visually. The project already uses Astro 5.17.1 with Zod 3.25.76, Satori 0.19.2, and Sharp 0.34.5 -- all of which are current and sufficient for this work. No new dependencies are required.

The most important architectural decision is the **dual-use SVG math utility**: the same polar-to-cartesian conversion functions must work both inside Astro `.astro` components (for page rendering) and inside a Node.js/Satori context (for OG image generation in Phase 18). This means the radar math must be a pure TypeScript module with zero framework dependencies -- no Astro imports, no DOM APIs, no React. It should return SVG path strings or coordinate arrays that can be consumed by either context.

A critical discovery is that **neither DM Sans (body) nor Bricolage Grotesque (headings) includes Greek characters**. The six Greek symbols (Phi, Omega, Lambda, Psi, Gamma, Sigma) are integral to the brand identity, so a targeted `@font-face` with `unicode-range` for the Greek block (U+0370-U+03FF) is required, using a font like Noto Sans that includes full Greek support.

**Primary recommendation:** Build the data schema and SVG utilities as pure TypeScript modules in `src/lib/`, wire them into Astro's content collection via `file()` loader, and create chart components as `.astro` files that generate inline SVG at build time with zero client-side JavaScript.

## Standard Stack

### Core (Already Installed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Astro | 5.17.1 | Static site framework, content collections, build-time rendering | Already in use, `file()` loader for JSON data |
| Zod | 3.25.76 | Schema validation for language data | Bundled with Astro via `astro/zod`, type-safe inference |
| Satori | 0.19.2 | OG image generation (Phase 18, but math utility must be compatible) | Already in use for blog OG images |
| Sharp | 0.34.5 | SVG-to-PNG conversion for OG images | Already in use |
| TypeScript | 5.9.3 | Type safety throughout | Already configured with strict mode |
| Tailwind CSS | 3.4.19 | Utility classes for component styling | Already in use site-wide |

### Supporting (Already Available)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `astro/loaders` | (bundled) | `file()` loader for JSON content collections | DATA-03: Loading languages.json |
| `astro:content` | (bundled) | `getCollection()`, `getEntry()` for querying data | All components that consume language data |

### No New Dependencies Needed
| Instead of | Why Not | Use Instead |
|------------|---------|-------------|
| D3.js | Overkill for 6-axis radar + stacked bars; ships runtime JS | Hand-written SVG with pure TS math utilities |
| Chart.js / Recharts | Client-side charting library; violates zero-JS requirement | Build-time SVG in Astro components |
| svg-radar-chart (npm) | Returns virtual-dom nodes, requires stringification; adds dependency | 20 lines of trigonometry in `src/lib/radar-math.ts` |

**Installation:**
```bash
# No new packages needed. All tools are already installed.
```

## Architecture Patterns

### Recommended Project Structure
```
src/
  data/
    beauty-index/
      languages.json        # DATA-01: All 25 languages, Zod-validated
  lib/
    beauty-index/
      schema.ts             # DATA-01: Zod schema + TypeScript types
      radar-math.ts         # DATA-02: Polar-to-cartesian, SVG path generation
      tiers.ts              # Tier boundaries, tier colors, dimension colors
      dimensions.ts         # Dimension metadata (name, symbol, short description)
  components/
    beauty-index/
      RadarChart.astro      # CHART-01: SVG radar chart component
      RankingBarChart.astro  # CHART-02: Stacked horizontal bar chart
      TierBadge.astro       # CHART-03: Color-coded tier badge
      ScoreBreakdown.astro  # CHART-04: Individual dimension scores display
  styles/
    global.css              # Add @font-face for Greek unicode-range fallback
  content.config.ts         # Add 'languages' collection with file() loader
```

### Pattern 1: Pure TypeScript SVG Math Utility (Dual-Use)
**What:** A module that computes radar chart geometry and returns SVG-compatible data structures (coordinate arrays, path strings) with no framework dependencies.
**When to use:** Any time radar chart coordinates or SVG paths are needed -- Astro page rendering AND Satori OG image generation.
**Example:**
```typescript
// src/lib/beauty-index/radar-math.ts
// Source: Verified trigonometry for polar-to-cartesian conversion

/** Convert polar coordinates to cartesian (SVG coordinate space) */
export function polarToCartesian(
  cx: number,
  cy: number,
  angle: number,
  radius: number,
): { x: number; y: number } {
  // Offset by -PI/2 so first axis points upward (12 o'clock)
  const adjustedAngle = angle - Math.PI / 2;
  return {
    x: cx + Math.cos(adjustedAngle) * radius,
    y: cy + Math.sin(adjustedAngle) * radius,
  };
}

/** Generate polygon points for a radar chart */
export function radarPolygonPoints(
  cx: number,
  cy: number,
  maxRadius: number,
  values: number[],   // scores 1-10
  maxValue: number,    // 10
): string {
  const numAxes = values.length;
  return values
    .map((value, i) => {
      const angle = (Math.PI * 2 * i) / numAxes;
      const radius = (value / maxValue) * maxRadius;
      const { x, y } = polarToCartesian(cx, cy, angle, radius);
      return `${x},${y}`;
    })
    .join(' ');
}

/** Generate hexagonal grid ring points at a given radius */
export function hexagonRingPoints(
  cx: number,
  cy: number,
  radius: number,
  numSides: number,   // 6 for hexagon
): string {
  return Array.from({ length: numSides }, (_, i) => {
    const angle = (Math.PI * 2 * i) / numSides;
    const { x, y } = polarToCartesian(cx, cy, angle, radius);
    return `${x},${y}`;
  }).join(' ');
}

/** Generate complete SVG string for a radar chart (for Satori embedding) */
export function generateRadarSvgString(
  size: number,
  values: number[],
  fillColor: string,
  fillOpacity: number,
  labels: string[],
): string {
  // Returns a complete <svg> element as a string
  // Can be base64-encoded for Satori: data:image/svg+xml;base64,...
  // Implementation generates polygons, grid rings, axis lines, labels
  const cx = size / 2;
  const cy = size / 2;
  const maxRadius = size * 0.38; // Leave room for labels
  // ... SVG generation logic
  return `<svg xmlns="http://www.w3.org/2000/svg" ...>...</svg>`;
}
```

### Pattern 2: Astro Content Collection with file() Loader
**What:** Load `languages.json` as a typed Astro content collection with Zod validation.
**When to use:** Accessing language data from any Astro component or page.
**Example:**
```typescript
// src/content.config.ts
import { defineCollection, z } from 'astro:content';
import { glob, file } from 'astro/loaders';
import { languageSchema } from './lib/beauty-index/schema';

const blog = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/data/blog' }),
  schema: z.object({ /* existing blog schema */ }),
});

const languages = defineCollection({
  loader: file('src/data/beauty-index/languages.json'),
  schema: languageSchema,
});

export const collections = { blog, languages };
```

### Pattern 3: Build-Time SVG Astro Component
**What:** An Astro component that generates inline SVG markup at build time, shipping zero client-side JavaScript.
**When to use:** All chart components (radar, bar chart, tier badge).
**Example:**
```astro
---
// src/components/beauty-index/RadarChart.astro
import { polarToCartesian, radarPolygonPoints, hexagonRingPoints } from '../../lib/beauty-index/radar-math';
import { DIMENSIONS } from '../../lib/beauty-index/dimensions';
import { getTierColor } from '../../lib/beauty-index/tiers';
import type { Language } from '../../lib/beauty-index/schema';

interface Props {
  language: Language;
  size?: number;
}

const { language, size = 300 } = Astro.props;
const cx = size / 2;
const cy = size / 2;
const maxRadius = size * 0.38;
const maxValue = 10;

const scores = [
  language.phi,
  language.omega,
  language.lambda,
  language.psi,
  language.gamma,
  language.sigma,
];

const polygonPoints = radarPolygonPoints(cx, cy, maxRadius, scores, maxValue);
const tierColor = getTierColor(language.tier);

// Grid rings at intervals of 2 (scores 2, 4, 6, 8, 10)
const gridLevels = [2, 4, 6, 8, 10];
---

<svg
  width={size}
  height={size}
  viewBox={`0 0 ${size} ${size}`}
  xmlns="http://www.w3.org/2000/svg"
  role="img"
  aria-label={`Radar chart for ${language.name} showing scores across 6 dimensions`}
>
  <!-- Grid rings (concentric hexagons) -->
  {gridLevels.map((level) => {
    const r = (level / maxValue) * maxRadius;
    const points = hexagonRingPoints(cx, cy, r, 6);
    return <polygon points={points} fill="none" stroke="#e5ddd5" stroke-width="1" />;
  })}

  <!-- Axis lines from center to each vertex -->
  {DIMENSIONS.map((_, i) => {
    const angle = (Math.PI * 2 * i) / 6;
    const { x, y } = polarToCartesian(cx, cy, angle, maxRadius);
    return <line x1={cx} y1={cy} x2={x} y2={y} stroke="#e5ddd5" stroke-width="1" />;
  })}

  <!-- Data polygon (filled) -->
  <polygon
    points={polygonPoints}
    fill={tierColor}
    fill-opacity="0.35"
    stroke={tierColor}
    stroke-width="2"
  />

  <!-- Axis labels -->
  {DIMENSIONS.map((dim, i) => {
    const angle = (Math.PI * 2 * i) / 6;
    const labelRadius = maxRadius + 24;
    const { x, y } = polarToCartesian(cx, cy, angle, labelRadius);
    return (
      <text
        x={x}
        y={y}
        text-anchor="middle"
        dominant-baseline="middle"
        class="text-xs fill-current text-text-secondary"
      >
        {dim.symbol} {dim.shortName}
      </text>
    );
  })}
</svg>
```

### Pattern 4: Satori-Compatible SVG Embedding (for Phase 18)
**What:** Pre-render radar chart SVG, base64-encode it, embed as `<img>` in Satori layout.
**When to use:** OG image generation where Satori cannot render SVG elements directly.
**Example:**
```typescript
// Usage in OG image generator (Phase 18)
import { generateRadarSvgString } from '../lib/beauty-index/radar-math';

const svgString = generateRadarSvgString(300, scores, tierColor, 0.35, labels);
const base64 = Buffer.from(svgString).toString('base64');
const dataUri = `data:image/svg+xml;base64,${base64}`;

// In Satori layout:
// <img src={dataUri} width={300} height={300} />
```

### Anti-Patterns to Avoid
- **Client-side charting libraries:** Chart.js, D3, Recharts all ship JavaScript to the client. Build-time SVG is the correct approach for static data.
- **Generating SVG strings in .astro template expressions:** Use helper functions in `.ts` files to keep templates readable. The `.astro` file should compose pre-computed SVG elements, not build SVG strings inline.
- **Hardcoding tier colors in individual components:** Define tier colors, dimension colors, and boundaries in a single shared constants module (`tiers.ts`). All components import from there.
- **Using Astro content collection API inside Satori/Node context:** `getCollection()` only works in Astro runtime. For OG images, import the JSON file directly or read it with `fs`.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Content collection from JSON | Custom file-reading + parsing | Astro `file()` loader | Built-in type safety, caching, HMR, schema validation |
| Schema validation | Manual type guards | Zod via `astro/zod` | Automatic TypeScript inference, descriptive error messages |
| Greek character fallback | Hoping system fonts cover it | `@font-face` with `unicode-range` | Guarantees consistent rendering; DM Sans/Bricolage lack Greek glyphs |
| SVG-to-PNG for OG images | Canvas API or headless browser | Satori + Sharp pipeline | Already working in the project for blog OG images |
| Color palette management | Scattered hex values | Centralized `tiers.ts` constants module | Single source of truth for tier colors, dimension colors |

**Key insight:** The temptation is to reach for a charting library, but for 6-axis radar charts and horizontal stacked bars with static data, the SVG is straightforward to generate at build time. The math is ~30 lines of trigonometry. A charting library would add bundle weight and complexity for no benefit.

## Common Pitfalls

### Pitfall 1: Greek Symbols Not Rendering in Site Fonts
**What goes wrong:** The Greek symbols (Phi, Omega, Lambda, Psi, Gamma, Sigma) display as squares, tofu, or wrong-looking glyphs because neither DM Sans nor Bricolage Grotesque includes Greek character coverage.
**Why it happens:** Both DM Sans and Bricolage Grotesque only support Latin and Latin Extended subsets. The Greek and Coptic Unicode block (U+0370-U+03FF) is not included. Verified via Fontsource: DM Sans has "latin" and "latin-ext" only; Bricolage Grotesque has "latin", "latin-ext", and "vietnamese" only.
**How to avoid:** Add a `@font-face` declaration with `unicode-range: U+0370-03FF` that loads a Greek-capable font (Noto Sans) only for those specific characters. The browser will automatically use this font for Greek glyphs and the regular fonts for everything else.
**Warning signs:** Greek symbols look different from surrounding text, appear as rectangles, or have inconsistent weight/size.

### Pitfall 2: SVG Text Rendering Differences Across Browsers
**What goes wrong:** SVG `<text>` elements render with different font metrics, baseline alignment, and kerning across Chrome, Firefox, and Safari.
**Why it happens:** Each browser has its own SVG text rendering engine. `dominant-baseline` and `text-anchor` are interpreted slightly differently.
**How to avoid:** Use `text-anchor="middle"` and `dominant-baseline="middle"` for centered labels. Test in all three browsers. For the Satori context (OG images), fonts are embedded as paths -- this is actually more consistent than browser SVG text rendering.
**Warning signs:** Labels appear offset vertically or horizontally in one browser but not others.

### Pitfall 3: file() Loader Requires `id` Field
**What goes wrong:** Astro's `file()` loader fails silently or throws confusing errors when JSON entries lack an `id` field.
**Why it happens:** The `file()` loader expects either an array of objects each containing a unique `id` property, or an object where keys serve as IDs.
**How to avoid:** Use the array format with explicit `id` fields that match language slugs (e.g., `"rust"`, `"python"`, `"haskell"`). Include `id: z.string()` in the Zod schema.
**Warning signs:** Empty collection results, build errors mentioning "id", or type errors on collection entries.

### Pitfall 4: Satori Cannot Render SVG Elements Directly
**What goes wrong:** Attempting to include `<svg>`, `<path>`, or `<polygon>` elements in Satori layout produces no output or errors.
**Why it happens:** Satori converts HTML/CSS to SVG output -- it does not accept SVG as input. It only supports HTML elements styled with CSS flexbox properties.
**How to avoid:** Generate the radar chart as a complete SVG string, base64-encode it, and embed it via `<img src="data:image/svg+xml;base64,...">`. Satori supports `<img>` with data URIs.
**Warning signs:** Blank areas where charts should appear in OG images, Satori rendering errors.

### Pitfall 5: Satori Font Format Limitation
**What goes wrong:** Greek symbols in OG images render as tofu because Satori doesn't support the font format or the font lacks Greek glyphs.
**Why it happens:** Satori supports TTF, OTF, and WOFF only (NOT WOFF2). The project's existing fonts (Inter-Regular.woff, SpaceGrotesk-Bold.woff) likely lack Greek coverage. For OG images specifically, the radar chart SVG is embedded as an image, so Greek text in axis labels must be rendered within the SVG string itself, which means the SVG must use system-safe fonts or embed font paths.
**How to avoid:** In the `generateRadarSvgString()` function, use generic font families (`sans-serif`) for axis labels since the SVG is rasterized to PNG anyway. Alternatively, download a Noto Sans WOFF file and reference it in both the web `@font-face` and as a Satori font.
**Warning signs:** Axis labels in OG images show squares or missing characters.

### Pitfall 6: Radar Chart Axis Starting Position
**What goes wrong:** The first axis (Phi/Aesthetic Geometry) points to the right (3 o'clock) instead of upward (12 o'clock).
**Why it happens:** Without the `-Math.PI / 2` offset in the polar-to-cartesian conversion, `angle = 0` maps to the positive X axis (rightward).
**How to avoid:** Always subtract `Math.PI / 2` from the angle in `polarToCartesian()` to rotate the chart so the first axis points upward.
**Warning signs:** The radar chart looks rotated 90 degrees clockwise from expected orientation.

## Code Examples

Verified patterns from official sources:

### Zod Schema for Language Data (DATA-01)
```typescript
// src/lib/beauty-index/schema.ts
import { z } from 'astro/zod';

export const dimensionScoreSchema = z.number().int().min(1).max(10);

export const tierSchema = z.enum([
  'beautiful',
  'handsome',
  'practical',
  'workhorses',
]);

export const languageSchema = z.object({
  id: z.string(),           // URL-safe slug: "rust", "python", "haskell"
  name: z.string(),          // Display name: "Rust", "Python", "Haskell"
  phi: dimensionScoreSchema,     // Aesthetic Geometry (1-10)
  omega: dimensionScoreSchema,   // Mathematical Elegance (1-10)
  lambda: dimensionScoreSchema,  // Linguistic Clarity (1-10)
  psi: dimensionScoreSchema,     // Practitioner Happiness (1-10)
  gamma: dimensionScoreSchema,   // Organic Habitability (1-10)
  sigma: dimensionScoreSchema,   // Conceptual Integrity (1-10)
  tier: tierSchema,
  characterSketch: z.string(),   // Personality description (2-3 sentences)
  year: z.number().int().optional(),  // Year created (for metadata)
  paradigm: z.string().optional(),    // Primary paradigm (for metadata)
});

export type Language = z.infer<typeof languageSchema>;

// Computed fields (not in schema, calculated at use-time)
export function totalScore(lang: Language): number {
  return lang.phi + lang.omega + lang.lambda + lang.psi + lang.gamma + lang.sigma;
}

export function dimensionScores(lang: Language): number[] {
  return [lang.phi, lang.omega, lang.lambda, lang.psi, lang.gamma, lang.sigma];
}
```

### Content Collection Configuration (DATA-03)
```typescript
// src/content.config.ts
// Source: https://docs.astro.build/en/guides/content-collections/
import { defineCollection, z } from 'astro:content';
import { glob, file } from 'astro/loaders';

const blog = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/data/blog' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    publishedDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
    coverImage: z.string().optional(),
    externalUrl: z.string().url().optional(),
    source: z.enum(['Kubert AI', 'Translucent Computing']).optional(),
  }),
});

const languages = defineCollection({
  loader: file('src/data/beauty-index/languages.json'),
  schema: z.object({
    id: z.string(),
    name: z.string(),
    phi: z.number().int().min(1).max(10),
    omega: z.number().int().min(1).max(10),
    lambda: z.number().int().min(1).max(10),
    psi: z.number().int().min(1).max(10),
    gamma: z.number().int().min(1).max(10),
    sigma: z.number().int().min(1).max(10),
    tier: z.enum(['beautiful', 'handsome', 'practical', 'workhorses']),
    characterSketch: z.string(),
    year: z.number().int().optional(),
    paradigm: z.string().optional(),
  }),
});

export const collections = { blog, languages };
```

### JSON Data Structure (DATA-01)
```json
[
  {
    "id": "rust",
    "name": "Rust",
    "phi": 8,
    "omega": 9,
    "lambda": 7,
    "psi": 8,
    "gamma": 7,
    "sigma": 9,
    "tier": "beautiful",
    "characterSketch": "The overprotective friend who's always right. Rust won't let you make mistakes, and you'll resent it until you realize every error it caught would have been a 3am production incident.",
    "year": 2010,
    "paradigm": "multi-paradigm"
  }
]
```

### Greek Symbol Font Fallback (DATA-04)
```css
/* Add to src/styles/global.css */
/* Source: https://developer.mozilla.org/en-US/docs/Web/CSS/@font-face/unicode-range */

/* Greek character fallback — DM Sans and Bricolage Grotesque lack Greek glyphs */
@font-face {
  font-family: 'Greek Fallback';
  src: url('https://fonts.gstatic.com/s/notosans/v38/o-0mIpQlx3QUlC5A4PNB6Ryti20_6n1iPHjcz6L1SoM-jCpoiyD9A-9a6Vc.woff2') format('woff2');
  unicode-range: U+0370-03FF;  /* Greek and Coptic block */
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}

@font-face {
  font-family: 'Greek Fallback';
  src: url('https://fonts.gstatic.com/s/notosans/v38/o-0kIpQlx3QUlC5A4PNB6Ryti20_6n1iPHjcz6L1SoM-jCpoiyD9A-9a6VtJ.woff2') format('woff2');
  unicode-range: U+0370-03FF;
  font-weight: 700;
  font-style: normal;
  font-display: swap;
}
```

**IMPORTANT:** The font-family stacks in tailwind.config.mjs must be updated to include the Greek fallback:
```javascript
// tailwind.config.mjs
fontFamily: {
  sans: ['DM Sans', 'DM Sans Fallback', 'Greek Fallback', ...defaultTheme.fontFamily.sans],
  heading: ['Bricolage Grotesque', 'Bricolage Grotesque Fallback', 'Greek Fallback', ...defaultTheme.fontFamily.sans],
},
```

**Alternative approach (simpler, more reliable):** Load the Google Fonts "greek" subset directly by adding `&subset=greek` to the existing Google Fonts URL in the layout:
```html
<!-- Updated Google Fonts link in Layout.astro -->
<link
  rel="preload"
  href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@700;800&family=DM+Sans:wght@400;500;700&family=Fira+Code:wght@400&family=Noto+Sans:wght@400;700&display=swap"
  as="style"
  onload="this.onload=null;this.rel='stylesheet'"
/>
```
Then use CSS `unicode-range` to apply Noto Sans only for Greek characters, keeping DM Sans and Bricolage Grotesque for everything else.

### Dimension Metadata Constants
```typescript
// src/lib/beauty-index/dimensions.ts

export interface Dimension {
  key: 'phi' | 'omega' | 'lambda' | 'psi' | 'gamma' | 'sigma';
  symbol: string;       // Greek letter
  name: string;         // Full name
  shortName: string;    // Short label for chart axes
  description: string;  // 1-2 sentence summary for tooltips
}

export const DIMENSIONS: Dimension[] = [
  {
    key: 'phi',
    symbol: '\u03A6',  // Phi
    name: 'Aesthetic Geometry',
    shortName: 'Geometry',
    description: 'Visual cleanliness, grid-based order, proportional structure. How code looks on a screen.',
  },
  {
    key: 'omega',
    symbol: '\u03A9',  // Omega
    name: 'Mathematical Elegance',
    shortName: 'Elegance',
    description: 'Inevitability, unexpectedness, economy. Algorithms that feel straight from The Book.',
  },
  {
    key: 'lambda',
    symbol: '\u039B',  // Lambda
    name: 'Linguistic Clarity',
    shortName: 'Clarity',
    description: 'Code that reads like well-written prose. Signal-to-noise ratio at the level of meaning.',
  },
  {
    key: 'psi',
    symbol: '\u03A8',  // Psi
    name: 'Practitioner Happiness',
    shortName: 'Happiness',
    description: 'The felt experience of writing and reading code. Flow states, community love, tooling pleasure.',
  },
  {
    key: 'gamma',
    symbol: '\u0393',  // Gamma
    name: 'Organic Habitability',
    shortName: 'Habitability',
    description: 'Code as a place where programmers can live. Growth points, graceful aging, extensibility.',
  },
  {
    key: 'sigma',
    symbol: '\u03A3',  // Sigma
    name: 'Conceptual Integrity',
    shortName: 'Integrity',
    description: 'Coherent design philosophy where features feel like natural consequences of a single idea.',
  },
];

// Unicode code points for reference:
// Phi   U+03A6
// Omega U+03A9
// Lambda U+039B
// Psi   U+03A8
// Gamma U+0393
// Sigma U+03A3
```

### Tier Constants and Color Recommendations
```typescript
// src/lib/beauty-index/tiers.ts

export interface TierConfig {
  name: string;
  label: string;
  minScore: number;  // inclusive
  maxScore: number;  // inclusive
  color: string;     // hex color for charts, badges, radar fills
}

// Evenly distributed across 6-60 range:
// Range = 60 - 6 = 54, divided by 4 tiers = 13.5 per tier
// Boundaries: 6-19, 20-33, 34-46, 47-60
// Rounding to clean integers:
export const TIERS: TierConfig[] = [
  {
    name: 'workhorses',
    label: 'Workhorses',
    minScore: 6,
    maxScore: 19,
    color: '#8B8FA3',   // Muted slate — reliable, unsexy
  },
  {
    name: 'practical',
    label: 'Practical',
    minScore: 20,
    maxScore: 33,
    color: '#5B8A72',   // Sage green — solid, dependable
  },
  {
    name: 'handsome',
    label: 'Handsome',
    minScore: 34,
    maxScore: 46,
    color: '#C47F17',   // Warm amber — attractive, refined
  },
  {
    name: 'beautiful',
    label: 'Beautiful',
    minScore: 47,
    maxScore: 60,
    color: '#B84A1C',   // Rich burnt orange — aligned with site accent
  },
];

// Dimension colors for stacked bar chart segments
export const DIMENSION_COLORS: Record<string, string> = {
  phi:    '#4A90D9',  // Blue — Geometry
  omega:  '#7B68EE',  // Purple — Elegance
  lambda: '#2AAA8A',  // Teal — Clarity
  psi:    '#E8734A',  // Coral — Happiness
  gamma:  '#8FBC5A',  // Green — Habitability
  sigma:  '#D4A843',  // Gold — Integrity
};

export function getTierByScore(totalScore: number): TierConfig {
  const tier = TIERS.find(t => totalScore >= t.minScore && totalScore <= t.maxScore);
  if (!tier) throw new Error(`Score ${totalScore} out of valid range 6-60`);
  return tier;
}

export function getTierColor(tierName: string): string {
  const tier = TIERS.find(t => t.name === tierName);
  if (!tier) throw new Error(`Unknown tier: ${tierName}`);
  return tier.color;
}
```

### Querying Language Data in Components
```astro
---
// Example: Using language data in an Astro page/component
// Source: https://docs.astro.build/en/reference/modules/astro-content/
import { getCollection, getEntry } from 'astro:content';
import { totalScore, dimensionScores } from '../lib/beauty-index/schema';
import RadarChart from '../components/beauty-index/RadarChart.astro';

// Get all languages sorted by total score
const allLanguages = await getCollection('languages');
const sorted = allLanguages
  .map(entry => ({ ...entry.data, total: totalScore(entry.data) }))
  .sort((a, b) => b.total - a.total);

// Get a single language
const rust = await getEntry('languages', 'rust');
---
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `type: 'content'` / `type: 'data'` in content config | `loader: glob()` / `loader: file()` | Astro 5.0 (Dec 2024) | New Content Layer API replaces legacy approach |
| Config in `src/content/config.ts` | Config in `src/content.config.ts` | Astro 5.0 | File moved to project root `src/` level |
| `import { z } from 'zod'` (separate install) | `import { z } from 'astro/zod'` | Astro 5.0 | Zod bundled with Astro, no separate dependency |
| Satori `assert` keyword for JSON | Satori `with` keyword (import attributes) | TC39 2024 | Not relevant -- Satori uses `require`-style internally |
| WOFF2 in Satori | Still not supported | -- | Must use WOFF/TTF/OTF for Satori font loading |

**Deprecated/outdated:**
- `type: 'data'` collections: Replaced by `loader: file()` in Astro 5.0
- `src/content/config.ts` location: Now `src/content.config.ts` (note: `content.config.ts` not `content/config.ts`)
- `z.coerce.date()` for dates in JSON: Not needed for integer scores; use `z.number().int()` directly

## Open Questions

1. **Exact list of 25 languages**
   - What we know: The schema supports 25 languages with scores, tiers, and character sketches
   - What's unclear: The full list of 25 languages has not been specified in the CONTEXT.md or REQUIREMENTS.md
   - Recommendation: The planner should create a task for authoring the `languages.json` with all 25 entries. The executor will need guidance on which languages to include. Consider deferring to the user for the list, or including a placeholder task that the user fills in.

2. **Google Fonts Noto Sans URL stability for Greek fallback**
   - What we know: Noto Sans includes full Greek coverage and is available on Google Fonts
   - What's unclear: Whether the direct gstatic URL will remain stable, or if we should self-host the subset
   - Recommendation: Use the Google Fonts API link (which handles versioning), not a direct gstatic file URL. Add `&family=Noto+Sans:wght@400;700` to the existing Google Fonts `<link>` and define `@font-face` with `unicode-range` to scope it to Greek characters only. This is simpler and more maintainable than self-hosting.

3. **Satori SVG-as-data-URI rendering fidelity**
   - What we know: Satori supports `<img src="data:image/png;base64,...">` and `loadAdditionalAsset` can return SVG data URIs. The approach of encoding SVG as base64 and using `<img>` should work.
   - What's unclear: Whether `data:image/svg+xml;base64,...` specifically renders with full fidelity (fonts, colors) in Satori. The docs show PNG data URIs explicitly but don't explicitly confirm SVG data URIs.
   - Recommendation: Build the `generateRadarSvgString()` utility in this phase but add a validation task that generates a test OG image with an embedded radar SVG. If SVG data URIs don't work in Satori, the fallback is to pre-render the SVG to PNG using Sharp before embedding. This matches success criteria #4.

4. **Polygon opacity level for radar chart fill**
   - What we know: The fill should be semi-transparent using the tier color
   - What's unclear: Exact opacity value that looks best
   - Recommendation: Start with `fill-opacity="0.35"` which is a common choice for radar chart fills -- opaque enough to read the shape, transparent enough to see the grid lines beneath. Adjust during visual review.

## Sources

### Primary (HIGH confidence)
- Astro Content Collections Docs (https://docs.astro.build/en/guides/content-collections/) - file() loader API, schema validation
- Astro Content Loader API Reference (https://docs.astro.build/en/reference/content-loader-reference/) - file() loader parameters and data structure requirements
- Astro Zod Reference (https://docs.astro.build/en/reference/modules/astro-zod/) - Zod v3 re-export, available validators
- Fontsource DM Sans (https://fontsource.org/fonts/dm-sans) - Unicode subset coverage: latin, latin-ext ONLY (no Greek)
- Fontsource Bricolage Grotesque (https://fontsource.org/fonts/bricolage-grotesque) - Unicode subset coverage: latin, latin-ext, vietnamese ONLY (no Greek)
- Satori GitHub (https://github.com/vercel/satori) - CSS support, font format requirements (TTF/OTF/WOFF only), img data URI support
- MDN unicode-range (https://developer.mozilla.org/en-US/docs/Web/CSS/@font-face/unicode-range) - Targeted font loading for specific Unicode ranges
- Unicode Greek block (https://www.compart.com/en/unicode/U+03A6) - Confirmed code points for all 6 Greek symbols

### Secondary (MEDIUM confidence)
- Paul Scanlon SVG Radar Chart in Astro (https://www.paulie.dev/posts/2023/10/how-to-create-an-svg-radar-chart/) - Polar-to-cartesian math, SVG polygon generation pattern
- CSS-Tricks SVG Charts (https://css-tricks.com/how-to-make-charts-with-svg/) - SVG rect/text patterns for bar charts
- Noto Sans Google Fonts (https://fonts.google.com/noto/specimen/Noto+Sans) - Greek character coverage confirmed

### Tertiary (LOW confidence)
- Satori SVG data URI support - Confirmed for PNG data URIs but SVG data URI support needs validation during implementation

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries already installed and verified; no new dependencies needed
- Architecture: HIGH - Patterns verified against Astro 5 docs; dual-use utility approach is well-established
- Data schema: HIGH - Zod via astro/zod, file() loader API verified against current docs
- Greek font fallback: HIGH - Root cause confirmed (missing Greek subset), solution well-documented (unicode-range)
- Chart SVG math: HIGH - Trigonometry is well-established; patterns verified against multiple sources
- Satori SVG embedding: MEDIUM - PNG data URIs confirmed; SVG data URIs need implementation validation
- Pitfalls: HIGH - Based on verified font coverage data and documented Satori limitations

**Research date:** 2026-02-17
**Valid until:** 2026-03-17 (30 days -- stable domain, no rapidly changing APIs)
