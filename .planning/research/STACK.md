# Stack Research: EDA Visual Encyclopedia

**Domain:** Static-site EDA reference encyclopedia with build-time SVG plots, KaTeX math rendering, interactive distribution parameter explorers, and large-scale content collection (90+ pages)
**Researched:** 2026-02-24
**Confidence:** HIGH

## Existing Stack (Already Installed -- No Changes Needed)

These technologies are already in the project and serve the EDA Visual Encyclopedia without modification.

| Technology | Version | Relevance to EDA Visual Encyclopedia |
|------------|---------|--------------------------------------|
| `astro` | ^5.3.0 | **Critical.** Static output, Content Layer API with `glob()` and `file()` loaders, `getStaticPaths()` for 90+ page generation. Astro 5 builds content collections up to 5x faster for Markdown and 2x faster for MDX vs Astro 4, with 25-50% less memory. Already proven at 857 pages. |
| `@astrojs/mdx` | ^4.3.13 | **Critical.** MDX processing for EDA pages with embedded math, code blocks, and interactive components. Inherits remark/rehype plugins from `markdown` config by default (`extendMarkdownConfig: true`). |
| `astro-expressive-code` | ^0.41.6 | **Critical.** Python syntax highlighting for code blocks. Expressive Code uses Shiki under the hood which supports 100+ languages including Python out of the box. Already configured with `github-dark` theme. Zero additional configuration needed for Python. |
| `@astrojs/react` | ^4.4.2 | **Supporting.** React island hydration for Tier C interactive D3 distribution explorers. Use `client:visible` directive to lazy-load D3 components only when scrolled into view. |
| `@astrojs/tailwind` | ^6.0.2 | **Direct reuse.** Styling for EDA pages using existing design tokens (CSS variables). |
| `@tailwindcss/typography` | ^0.5.19 | **Direct reuse.** Prose styling for MDX content including math-heavy explanations. |
| `@astrojs/sitemap` | ^3.7.0 | **Direct reuse.** Automatic sitemap generation for 90+ new EDA pages. |
| `satori` | ^0.19.2 | **Direct reuse.** OG image generation for EDA pages at `/open-graph/eda/[slug].png`. |
| `sharp` | ^0.34.5 | **Direct reuse.** Image processing for OG images. |
| `nanostores` | ^1.1.0 | **Minimal reuse.** Only needed if Tier C distribution explorers share state across components on a single page. Most EDA pages use Tier A (static SVG + vanilla JS hover) which needs no state management. |
| `typescript` | ^5.9.3 | **Direct reuse.** Type-safe content schemas, build-time SVG generation logic, D3 type definitions. |

## New npm Dependencies Required

### Core: Math Rendering Pipeline

| Package | Version | Purpose | Bundle Impact | Why |
|---------|---------|---------|---------------|-----|
| `remark-math` | ^6.0.0 | Remark plugin that parses `$...$` (inline) and `$$...$$` (display) math syntax in Markdown/MDX into math AST nodes | **Zero client JS** (build-time only) | The standard unified ecosystem plugin for math syntax detection. Works with rehype-katex to produce static HTML at build time. No alternative exists in the remark ecosystem. |
| `rehype-katex` | ^7.0.1 | Rehype plugin that transforms math AST nodes into pre-rendered KaTeX HTML | **Zero client JS** (build-time only) | Renders math at compile time, producing static HTML that needs only CSS to display. No client-side JavaScript shipped. This is the correct choice over `rehype-mathjax` because KaTeX is 2-3x faster at build time and produces smaller HTML output. |
| `katex` | ^0.16.33 | Peer dependency of rehype-katex; the actual math rendering engine | **CSS only: ~24KB min** (katex.min.css) + **~592KB woff2 fonts** (20 files, loaded on-demand by browser) | Required by rehype-katex. The JavaScript is used only at build time (Node.js). Only the CSS and fonts ship to the browser. Fonts are loaded on-demand per glyph -- most EDA pages will load 3-5 font files, not all 20. |

### Core: D3 Micro-Bundle for Interactive Distribution Explorers (Tier C only)

| Package | Version | Purpose | Bundle Impact | Why |
|---------|---------|---------|---------------|-----|
| `d3-scale` | ^4.0.2 | Linear, log, ordinal, band scales for mapping data domains to visual ranges | Part of micro-bundle below | Required for axis scaling in distribution parameter explorers. DOM-independent -- also used at build time for Tier A/B static SVG generation in Astro component frontmatter. |
| `d3-shape` | ^3.2.0 | Line and area generators with curve interpolation (curveMonotoneX, curveBasis) for smooth distribution curves | Part of micro-bundle below | Generates SVG path `d` attributes for distribution curves. DOM-independent -- used at both build time and client side. |
| `d3-axis` | ^3.0.0 | Axis rendering with tick marks and labels | Part of micro-bundle below | Only needed for Tier C client-side interactive charts (requires DOM via d3-selection). Not used at build time. |
| `d3-selection` | ^3.0.0 | DOM manipulation for D3 components | Part of micro-bundle below | Only needed for Tier C client-side interactive distribution explorers. NOT used at build time (Astro component frontmatter uses DOM-independent D3 modules directly). |
| `d3-array` | ^3.2.4 | Array utilities (extent, range, ticks, bisect) | Part of micro-bundle below | Transitive dependency of d3-scale. Also directly useful for computing histogram bins, data extents. DOM-independent. |
| `d3-path` | ^3.1.0 | SVG path serialization | Part of micro-bundle below | Transitive dependency of d3-shape. DOM-independent. |

**D3 micro-bundle size (measured):** Importing `scaleLinear`, `scaleOrdinal`, `scaleBand`, `line`, `area`, `curveBasis`, `curveMonotoneX`, `arc`, `axisBottom`, `axisLeft`, `select`, `selectAll` from the above 6 packages produces:
- **48KB minified** / **17KB gzipped** (measured with esbuild)
- This is loaded ONLY on the ~19 distribution pages with Tier C interactivity, via `client:visible` React islands
- The remaining ~70 EDA pages ship ZERO D3 JavaScript (Tier A/B use build-time SVG)

## Build-Time SVG Generation Strategy (NO Python Required)

**Critical architectural decision: Generate all static distribution plots in TypeScript/Astro at build time, not Python/matplotlib.**

### Why NOT Python/matplotlib

| Concern | Impact |
|---------|--------|
| Adds Python + matplotlib + numpy as build dependencies | CI/CD complexity; GitHub Actions needs Python setup step; version pinning headaches |
| Matplotlib SVG output includes embedded fonts and verbose markup | 10-50KB per SVG vs 2-5KB for hand-crafted SVG |
| Matplotlib default styling does not match site palette | Requires custom mplstyle configuration that duplicates CSS variables |
| Deterministic output requires `svg.hashsalt` + metadata stripping | Extra configuration to avoid git diff noise |
| Cross-language build pipeline (Node.js + Python) | Debugging is harder; `child_process.execSync` is fragile |
| The site already generates build-time SVG charts without Python | RadarChart.astro and CompassRadarChart.astro prove the pattern works |

### What to Do Instead: TypeScript + D3 Math at Build Time

The site already generates SVG radar charts at build time in Astro components (`RadarChart.astro`, `CompassRadarChart.astro`) using pure TypeScript math in the component frontmatter, producing `<svg>` elements with zero client JavaScript. The EDA Visual Encyclopedia follows the exact same pattern:

**Tier A pages (~70 pages): Static SVG generated in Astro component frontmatter**
```typescript
// In DistributionPlot.astro frontmatter (runs at build time in Node.js)
import { scaleLinear } from 'd3-scale';
import { line, curveBasis } from 'd3-shape';

const x = scaleLinear().domain([0, 10]).range([0, 400]);
const y = scaleLinear().domain([0, 0.5]).range([200, 0]);
const pathGenerator = line<[number, number]>()
  .x(d => x(d[0]))
  .y(d => y(d[1]))
  .curve(curveBasis);
const pathD = pathGenerator(dataPoints);
// Then use pathD in <svg><path d={pathD} /></svg> in the template
```

`d3-scale`, `d3-shape`, `d3-array`, and `d3-path` are **DOM-independent** -- they are pure math/data transformation libraries that work identically in Node.js and browser. This is confirmed by D3 documentation and the packages' source code (no `document`, `window`, or DOM API usage).

**Tier B pages: Pre-rendered SVG sets swapped with vanilla JS**
Same build-time generation as Tier A, but multiple SVG variants per parameter combination. Vanilla JS `<script>` toggles visibility. Still zero framework JavaScript.

**Tier C pages (~19 distribution pages): D3 React islands with client:visible**
Only these pages load the D3 micro-bundle (17KB gzipped) for live parameter manipulation. Uses `d3-selection` and `d3-axis` for DOM interaction.

### SVG Styling for Site Palette

Build-time SVGs use CSS variables directly in SVG attributes or inline styles:
```html
<svg>
  <line stroke="var(--color-border)" />
  <path fill="var(--color-accent)" fill-opacity="0.3" stroke="var(--color-accent)" />
  <text fill="var(--color-text-secondary)" font-family="'DM Sans', sans-serif" />
</svg>
```

This approach inherits the site's Tropical Sunset palette automatically, including any future theme changes.

## Content Collection Pattern for 90+ Pages

### Recommended: JSON Data File + Astro `file()` Loader

Follow the proven pattern from Beauty Index (25 languages) and Database Compass (12 models), scaled to 90+ entries.

**Data structure:** Single JSON file at `src/data/eda/distributions.json` (or split into category files: `descriptive.json`, `distributions.json`, `hypothesis.json`, etc.)

**Content collection definition:**
```typescript
// In src/content.config.ts
const edaTopics = defineCollection({
  loader: file('src/data/eda/topics.json'),
  schema: edaTopicSchema,
});

export const collections = { blog, languages, dbModels, edaTopics };
```

**Page generation:**
```typescript
// In src/pages/eda/[slug].astro
export async function getStaticPaths() {
  const topics = await getCollection('edaTopics');
  // ... sort, compute prev/next, return params
}
```

### Why JSON + `file()` Instead of MDX + `glob()`

| Factor | JSON + `file()` | MDX + `glob()` |
|--------|-----------------|----------------|
| Data consistency | Schema-validated; every field guaranteed | Free-form; frontmatter varies |
| Build performance | Single file parse; fastest for structured data | 90+ file reads; slower |
| SVG generation | Data drives Astro component SVG generation at build time | Would need to embed SVG in MDX or use components anyway |
| Formulas | Data includes `formulaTeX` field; rendered by Astro component via KaTeX | `$$...$$` in MDX body |
| Code blocks | Data includes `pythonCode` field; rendered via Expressive Code `<Code>` component | Fenced code in MDX body |
| Batch operations | Easy to compute cross-page relationships, navigation, categories | Requires `getCollection()` in each page |

**The Beauty Index and Database Compass already validate this pattern at scale.** Each EDA topic is a structured data object with predictable fields (name, category, formulaTeX, description, pythonCode, parameters, etc.). The Astro component templates handle layout, SVG generation, and rendering consistently.

### Hybrid Approach for Rich Content

If some EDA pages need long-form prose beyond what fits in JSON fields, use a **hybrid pattern**:
- Structured data in JSON (`file()` loader) for scores, parameters, formulas, code, metadata
- Optional MDX companion files (`glob()` loader) for extended explanations, matched by slug
- Astro page checks for companion MDX and renders it if present

This mirrors how the Beauty Index uses JSON for scores but has a separate justifications data file for extended text.

### Performance at 90+ Pages

Astro 5's Content Layer caches parsed content between builds, only reprocessing changed files. At 90 pages:
- **Cold build:** ~10-15 seconds for page generation (based on existing 857-page site performance)
- **Incremental build:** Sub-second for single-file changes
- **Memory:** Well within Node.js defaults; no special configuration needed

For comparison, the existing site generates 857 pages without memory issues.

## Installation

```bash
# Math rendering pipeline (build-time only; ships CSS + fonts to browser, zero JS)
npm install remark-math@^6.0.0 rehype-katex@^7.0.1

# D3 micro-modules (build-time SVG math + client-side Tier C interactivity)
npm install d3-scale@^4.0.2 d3-shape@^3.2.0 d3-axis@^3.0.0 d3-selection@^3.0.0 d3-array@^3.2.4 d3-path@^3.1.0

# TypeScript type definitions for D3 modules (dev only)
npm install -D @types/d3-scale @types/d3-shape @types/d3-axis @types/d3-selection @types/d3-array @types/d3-path
```

**Total new production dependencies: 8 packages** (2 remark/rehype + 6 D3 micro-modules)
**Total new dev dependencies: 6 packages** (@types for D3)

## Configuration Changes Required

### astro.config.mjs

```javascript
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

export default defineConfig({
  // ... existing config
  markdown: {
    remarkPlugins: [remarkReadingTime, remarkMath],
    rehypePlugins: [rehypeKatex],
  },
  // MDX inherits markdown plugins by default (extendMarkdownConfig: true)
});
```

### Layout (KaTeX CSS -- only on EDA pages)

Self-host `katex.min.css` and woff2 fonts rather than using CDN:
1. Copy `node_modules/katex/dist/katex.min.css` to `public/styles/katex.min.css`
2. Copy `node_modules/katex/dist/fonts/*.woff2` to `public/fonts/katex/`
3. Update CSS `@font-face` URLs in the copied katex.min.css to point to `/fonts/katex/`
4. Conditionally load in EDA layout: `<link rel="stylesheet" href="/styles/katex.min.css" />`

**Why self-host:** Eliminates CDN dependency; GitHub Pages serves from same origin (no additional DNS lookup); fonts cached with site assets; no third-party tracking.

**Why conditional loading:** The 24KB CSS + on-demand font loading should only apply to EDA pages that use math, not the entire site. Use an Astro layout prop or a dedicated EDA layout.

### src/content.config.ts

Add the EDA content collection (see Content Collection Pattern section above).

## Alternatives Considered

| Recommended | Alternative | Why Not |
|-------------|-------------|---------|
| `rehype-katex` (build-time) | `rehype-mathjax` (build-time) | MathJax produces larger HTML output; slower build-time rendering; KaTeX is the standard for performance-sensitive static sites. MathJax is better for accessibility (screen reader support), but KaTeX's HTML output is sufficient for visual math rendering. |
| `rehype-katex` (build-time) | Client-side KaTeX auto-render | Adds ~110KB client JavaScript to every math page; flashes unstyled content; contradicts the zero-JS-for-static-content architecture. rehype-katex produces pre-rendered HTML at build time with zero client JS. |
| D3 micro-modules (6 packages) | Full `d3` package | Full D3 is ~280KB minified. The 6 micro-modules total ~48KB minified for the exact imports needed. Over 5x smaller. Full D3 includes DOM utilities, geo projections, force simulations, etc. that are irrelevant to distribution plots. |
| D3 micro-modules (build-time SVG) | Python matplotlib build pipeline | Adds Python as a build dependency; produces verbose SVG; requires cross-language build coordination; the site already generates build-time SVG with TypeScript. See detailed comparison above. |
| D3 micro-modules (build-time SVG) | Pure TypeScript math (no D3) | Reimplementing scale mapping, curve interpolation, and SVG path generation from scratch is error-prone and pointless when d3-scale and d3-shape are DOM-independent and designed exactly for this. D3's interpolation algorithms (monotone, basis, cardinal) are battle-tested. |
| JSON `file()` loader | MDX `glob()` loader for all content | MDX is appropriate for free-form blog posts; EDA topics are structured data with predictable fields. JSON ensures schema consistency, enables batch computation (cross-page navigation, category grouping), and builds faster. |
| JSON `file()` loader | YAML data files | JSON is natively parseable, has better TypeScript tooling, and the existing codebase uses JSON for both Beauty Index and Database Compass data. YAML adds parsing overhead with no benefit for structured data. |
| Self-hosted KaTeX CSS/fonts | CDN (jsdelivr) | Self-hosting eliminates external dependency, serves from same origin, avoids third-party tracking, and works offline. GitHub Pages handles static asset serving efficiently. |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| Python + matplotlib for SVG generation | Adds cross-language build complexity; verbose SVG output; styling mismatch with site palette; CI/CD Python setup overhead | TypeScript + D3 micro-modules at build time in Astro component frontmatter. Proven pattern from RadarChart.astro and CompassRadarChart.astro. |
| Full `d3` npm package | 280KB minified; includes ~30 sub-modules for geo, force, hierarchy, etc. that are irrelevant. Prevents tree-shaking in practice (bundlers cannot eliminate D3's internal cross-module references). | Import only `d3-scale`, `d3-shape`, `d3-axis`, `d3-selection`, `d3-array`, `d3-path` (~48KB minified total for needed exports). |
| `d3-transition` | Pulls in `d3-color`, `d3-dispatch`, `d3-ease`, `d3-interpolate`, `d3-timer` (5 additional transitive deps). CSS transitions and GSAP (already installed) handle animation. | CSS `transition` for hover states; GSAP for complex entrance animations if needed. |
| Client-side KaTeX rendering (auto-render.js) | 110KB+ JavaScript per page; flash of unstyled math content; contradicts static-site-first architecture | `rehype-katex` renders math at build time. Zero client JavaScript. Only CSS + fonts shipped. |
| `rehype-mathjax` | Produces larger HTML output than KaTeX; slower build-time rendering; MathJax HTML is more complex (nested `<mjx-*>` elements vs KaTeX's simpler `<span class="katex">` structure) | `rehype-katex` for smaller, faster output |
| `@observablehq/plot` | Higher-level D3 wrapper; 150KB+ bundle; opinionated styling that conflicts with site palette; designed for Observable notebooks, not embedded static sites | D3 micro-modules give exact control over SVG output and styling |
| Separate MDX files for each EDA topic | 90+ individual `.mdx` files with inconsistent frontmatter; no schema enforcement; slower builds; harder to compute cross-page relationships | JSON content collection with `file()` loader + Astro template components |
| `chart.js` or `plotly.js` | Canvas-based (chart.js) or heavy bundle (plotly.js ~3MB); cannot produce build-time static SVG; designed for fully interactive browser charts | D3 micro-modules for both build-time SVG generation and client-side interactivity |
| `nivo` (React charting library) | Wraps D3 with React components; adds abstraction layer over what we already control; 200KB+ for chart types; cannot generate SVG at build time in Astro frontmatter | Direct D3 micro-modules in Astro components and React islands |

## Stack Patterns by Tier

**Tier A (Static SVG + vanilla JS hover, ~70% of pages):**
- Build-time: `d3-scale` + `d3-shape` + `d3-array` + `d3-path` in Astro component frontmatter
- Client-side: Zero JavaScript (or tiny `<script>` for tooltip hover)
- Math: `rehype-katex` pre-renders all formulas at build time
- Code: `astro-expressive-code` highlights Python blocks at build time

**Tier B (Pre-rendered SVG swap, ~11 pages):**
- Build-time: Same as Tier A, but generates multiple SVG variants per parameter set
- Client-side: Vanilla JS `<script>` (~1-2KB) swaps SVG visibility on dropdown/slider change
- No framework JavaScript; no React; no D3 runtime

**Tier C (D3 React island, ~19 distribution pages):**
- Build-time: Static fallback SVG (same as Tier A) for initial render and no-JS users
- Client-side: React island with `client:visible` loads D3 micro-bundle (17KB gzipped) when scrolled into view
- Uses `d3-selection` + `d3-axis` for DOM manipulation; `d3-scale` + `d3-shape` for data transformation
- `nanostores` only if multiple D3 components on same page need shared state (unlikely for most distribution pages)

## Version Compatibility

| Package A | Compatible With | Notes |
|-----------|-----------------|-------|
| `remark-math@^6.0.0` | `@astrojs/mdx@^4.3.13` | Both use unified v11 ecosystem. remark-math v6 requires unified v11 which Astro 5's MDX integration uses internally. |
| `rehype-katex@^7.0.1` | `@astrojs/mdx@^4.3.13` | rehype-katex v7 requires rehype v4+ which Astro 5's MDX integration uses internally. |
| `rehype-katex@^7.0.1` | `katex@^0.16.0` | rehype-katex 7.0.1 declares `katex: "^0.16.0"` as a dependency; installs katex 0.16.33 (latest). |
| `remark-math@^6.0.0` | `astro-expressive-code@^0.41.6` | No conflict. remark-math processes `$...$` syntax before Expressive Code processes fenced code blocks. Dollar signs inside code blocks/fences are not affected. |
| `d3-scale@^4.0.2` | `d3-array@^3.2.4` | d3-scale declares `d3-array: "2.10.0 - 3"` peer range; 3.2.4 satisfies this. |
| `d3-shape@^3.2.0` | `d3-path@^3.1.0` | d3-shape declares `d3-path: "^3.1.0"` dependency; exact match. |
| `d3-scale@^4.0.2` | Astro build (Node.js) | DOM-independent; works identically at build time in Astro component frontmatter and at runtime in browser. |
| `d3-shape@^3.2.0` | Astro build (Node.js) | DOM-independent; same as d3-scale. |
| `d3-selection@^3.0.0` | React 19 (`react@^19.2.4`) | Used inside React island components (Tier C only). D3-selection directly manipulates DOM refs from `useRef`; does not conflict with React's virtual DOM when scoped to a ref container. |

## Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| `scripts/copy-katex-assets.mjs` | One-time script to copy KaTeX CSS and woff2 fonts to `public/` | Run once during setup. Copy `katex.min.css` to `public/styles/` and woff2 fonts to `public/fonts/katex/`. Update font paths in CSS. Commit the copied assets so builds are self-contained. |
| Astro Dev Server | Hot-reload during EDA page development | `npm run dev` -- Astro 5 dev server hot-reloads MDX content changes, SVG generation, and KaTeX rendering. |
| `npx astro build && npx astro preview` | Verify build-time SVG generation and KaTeX rendering | Essential to verify that D3 build-time imports work correctly in Astro's Vite-based build pipeline. |

## Sources

- [remarkjs/remark-math](https://github.com/remarkjs/remark-math) -- remark-math v6.0.0 and rehype-katex v7.0.1; confirmed build-time rendering with zero client JavaScript. **HIGH confidence (npm version verified).**
- [KaTeX Font Documentation](https://katex.org/docs/font) -- 20 woff2 font files totaling ~592KB, loaded on-demand by browser. Self-hosting supported. **HIGH confidence (verified locally by installing katex@0.16.33).**
- [Astro MDX Integration Docs](https://docs.astro.build/en/guides/integrations-guide/mdx/) -- MDX inherits markdown remark/rehype plugins by default via `extendMarkdownConfig: true`. **HIGH confidence (official docs).**
- [Astro Syntax Highlighting Docs](https://docs.astro.build/en/guides/syntax-highlighting/) -- Expressive Code (Shiki) supports Python out of the box. No configuration needed. **HIGH confidence (official docs).**
- [Astro Content Collections Docs](https://docs.astro.build/en/guides/content-collections/) -- `file()` loader for JSON data; `glob()` loader for MDX; Content Layer caches between builds. **HIGH confidence (official docs).**
- [D3 Getting Started](https://d3js.org/getting-started) -- D3 modules like d3-scale, d3-shape, d3-array are DOM-independent and work in Node.js. **HIGH confidence (official docs + verified in esbuild test).**
- D3 micro-bundle size measurement -- 48KB minified / 17KB gzipped for the exact imports needed (scaleLinear, scaleOrdinal, scaleBand, line, area, curveBasis, curveMonotoneX, arc, axisBottom, axisLeft, select, selectAll). **HIGH confidence (measured locally with esbuild).**
- [Matplotlib savefig SVG docs](https://matplotlib.org/stable/api/_as_gen/matplotlib.pyplot.savefig.html) -- SVG generation capabilities reviewed and rejected in favor of TypeScript/D3 build-time approach. **MEDIUM confidence (reviewed but not adopted).**
- Existing codebase: `src/components/beauty-index/RadarChart.astro` and `src/components/db-compass/CompassRadarChart.astro` -- proven build-time SVG generation pattern using TypeScript math in Astro component frontmatter with zero client JavaScript. **HIGH confidence (first-party code, verified).**
- Existing codebase: `src/content.config.ts` -- proven JSON `file()` loader pattern for Beauty Index (25 entries) and Database Compass (12 entries). **HIGH confidence (first-party code, verified).**
- [Byteli: Math Typesetting in Astro MDX](https://www.byteli.com/blog/2024/math_in_astro/) -- Practical configuration guide for remark-math + rehype-katex in Astro. **MEDIUM confidence (community source, verified against official docs).**

---
*Stack research for: EDA Visual Encyclopedia*
*Researched: 2026-02-24*
