# Stack Research: The Beauty Index

**Domain:** Interactive data visualization content pillar for static portfolio site
**Researched:** 2026-02-17
**Confidence:** HIGH

## Existing Stack (DO NOT reinstall)

Already present in `package.json` -- validated and working:

| Technology | Version | Role in Beauty Index |
|------------|---------|---------------------|
| Astro | ^5.3.0 | Static pages, `getStaticPaths()` for 25 language detail pages, content collections |
| React 19 | ^19.2.4 | Interactive chart islands via `@astrojs/react` (already configured with `client:visible`) |
| Tailwind CSS | ^3.4.19 | Chart wrapper styling, tab UI, responsive layouts |
| TypeScript | ^5.9.3 | Type-safe language data schemas, component props |
| GSAP | ^3.14.2 | Scroll-triggered chart entrance animations (reuse existing scroll reveal patterns) |
| Satori | ^0.19.2 | Build-time OG image generation for language detail pages (radar chart shapes in SVG) |
| Sharp | ^0.34.5 | Satori SVG-to-PNG conversion for OG images |
| astro-expressive-code | ^0.41.6 | Syntax-highlighted code blocks for the 25-language code comparison view |
| Content Collections + Zod | via Astro 5 | New `languages` collection with typed schemas for scores, code snippets, metadata |

## Recommended Additions

### 1. Recharts -- Interactive Radar + Bar Charts

| Property | Value |
|----------|-------|
| **Package** | `recharts` |
| **Version** | `^3.7.0` (latest stable, released Jan 2025) |
| **Purpose** | `RadarChart` for 6-dimension spider charts per language; `BarChart` (horizontal) for overall rankings |
| **Bundle impact** | ~50 KB gzipped (loaded ONLY in chart islands via `client:visible`, zero cost for pages without charts) |

**Why Recharts over alternatives:**

- **React 19 compatible out of the box.** Recharts 3.x removed the `react-smooth` and `recharts-scale` dependencies that caused React 19 conflicts in 2.x. In 3.x, `react`, `react-dom`, and `react-is` are peer dependencies that match whatever React version you install. No `overrides` or `resolutions` hacks needed with the project's React 19.2.4.
- **Declarative component API.** `<RadarChart>`, `<Radar>`, `<PolarGrid>`, `<PolarAngleAxis>`, `<PolarRadiusAxis>` map directly to the 6-dimension spider chart requirement. No imperative D3 wrangling.
- **Horizontal BarChart built-in.** `<BarChart layout="vertical">` gives the overall ranking view where the longest bar is the highest-ranked language. Zero custom drawing code.
- **SVG-based output.** Charts render as inline SVG elements in the DOM. This is critical for two reasons: (a) SVG scales crisply at any resolution, and (b) the share/download feature captures SVG-rendered charts reliably via `html-to-image`.
- **ResponsiveContainer.** `<ResponsiveContainer width="100%" height={400}>` handles viewport resizing, essential for mobile-first design on a portfolio site.
- **Perfect Astro islands fit.** React components with `client:visible` hydrate only when the user scrolls to them. A page with three chart islands pays zero JS cost until each chart scrolls into view. For the index page with 25 small charts, this is significant.
- **Theming via props.** Colors for radar fills, strokes, and bar fills can be passed as Tailwind-derived CSS variables, integrating cleanly with the existing dark/light mode toggle and "Quantum Explorer" theme.

**Recharts 3.x breaking changes to know:**
- `Cell` component deprecated -- use `cells` prop on Bar/Pie instead
- Internal state rewrite: `CategoricalChartState` no longer exposed outside
- `activeIndex` prop removed from Scatter/Bar/Pie
- All animations now internal (no `react-smooth` needed)
- None of these affect our use case (RadarChart + BarChart with basic customization)

**Confidence:** HIGH -- verified via [GitHub releases v3.7.0](https://github.com/recharts/recharts/releases), [3.0 migration guide](https://github.com/recharts/recharts/wiki/3.0-migration-guide), React 19 support [issue #4558](https://github.com/recharts/recharts/issues/4558) (closed/resolved), peer dependency [discussion #5701](https://github.com/recharts/recharts/discussions/5701).

### 2. html-to-image -- Client-Side Chart Export for Social Sharing

| Property | Value |
|----------|-------|
| **Package** | `html-to-image` |
| **Version** | `1.11.11` (PIN this exact version) |
| **Purpose** | Export rendered chart DOM nodes as PNG blobs for download/sharing |
| **Bundle impact** | ~12 KB gzipped |

**Why html-to-image:**

- **DOM-node based.** Takes a ref to any DOM element and captures it as an image. This means we capture the full styled card -- chart SVG + title + scores + branding -- not just the raw chart.
- **Multiple output formats.** `toPng()`, `toBlob()`, `toSvg()`, `toJpeg()`. We use `toPng()` and `toBlob()` because Twitter/LinkedIn/Reddit do not accept SVG in shared images.
- **No server required.** Runs entirely client-side. Essential for GitHub Pages static deployment.
- **Maintained fork of dom-to-image.** The original `dom-to-image` is abandoned. `html-to-image` is the successor with the same API but active bug fixes.

**CRITICAL: Pin to version 1.11.11.** Versions 1.11.12 and 1.11.13 have a documented regression where exported images are blank or incomplete. There is an open GitHub issue. Use `"html-to-image": "1.11.11"` (exact, no caret) in `package.json`.

**Confidence:** MEDIUM -- html-to-image 1.11.11 is stable and widely used, but the library has not had a successful release in over a year. If it becomes fully unmaintained, `modern-screenshot` (v4.6.8, actively published) is the migration target with a similar API.

### 3. file-saver -- Cross-Browser Download Trigger

| Property | Value |
|----------|-------|
| **Package** | `file-saver` |
| **Version** | `^2.0.5` |
| **Purpose** | Trigger "Save As" dialog from a Blob (the PNG output from html-to-image) |
| **Bundle impact** | ~3 KB gzipped |

**Why file-saver:**

- **Cross-browser `saveAs()`.** The pattern is: `htmlToImage.toBlob(node)` then `saveAs(blob, 'python-beauty-index.png')`. This works reliably across Chrome, Firefox, Safari, and mobile browsers.
- **Edge cases handled.** Manual `<a download>` click simulation has known issues in Safari and some mobile WebViews. file-saver handles these.
- **Tiny.** 3 KB is not worth reimplementing.

**Confidence:** HIGH -- mature, stable, unchanged API for years. 86M+ npm downloads.

### 4. @expressive-code/plugin-collapsible-sections -- Code Block Enhancement

| Property | Value |
|----------|-------|
| **Package** | `@expressive-code/plugin-collapsible-sections` |
| **Version** | `^0.41.0` (match the installed astro-expressive-code ^0.41.6) |
| **Purpose** | Collapse boilerplate (imports, class declarations, setup) in code comparison snippets |
| **Bundle impact** | Negligible -- Expressive Code plugins run at build time, no client JS |

**Why this plugin:**

- **First-party Expressive Code ecosystem.** The site already uses `astro-expressive-code ^0.41.6`. This plugin shares the same build pipeline and adds zero runtime cost.
- **Solves the 25-language code comparison problem.** When comparing feature implementations across 25 languages, boilerplate obscures the comparison-relevant code. `collapse={1-5}` hides imports/setup so users focus on the pattern.
- **Build-time only.** Processed during `astro build`. Ships as static HTML with CSS-only expand/collapse. No JavaScript in the client bundle.

**Configuration addition to `astro.config.mjs`:**

```javascript
import { pluginCollapsibleSections } from '@expressive-code/plugin-collapsible-sections';

export default defineConfig({
  integrations: [
    expressiveCode({
      themes: ['github-dark', 'github-light'],
      plugins: [pluginCollapsibleSections()],
      // ... existing config
    }),
    // ... rest
  ],
});
```

**Confidence:** HIGH -- [official plugin documentation](https://expressive-code.com/plugins/collapsible-sections/).

## Architecture Integration Points

### How New Libraries Fit the Existing Astro Island Pattern

```
src/pages/beauty-index/index.astro (Overview page)
  |
  +-- [Static] Hero section, methodology text, SEO    -- zero JS
  |
  +-- <OverallRanking client:visible />               -- Recharts BarChart island
  |     Horizontal bar chart of 25 languages ranked.
  |     Props: sorted score data from content collection.
  |     ~50 KB loaded only when user scrolls here.
  |
  +-- [Static] Grid of 25 language cards               -- zero JS
  |     Each card links to /beauty-index/[language]
  |     Shows mini radar preview (pure SVG, no JS)
  |
src/pages/beauty-index/[language].astro (Detail page, one per language)
  |
  +-- [Static] Language name, description, metadata    -- zero JS
  |
  +-- <RadarChart client:visible />                    -- Recharts RadarChart island
  |     6-axis spider chart for this language.
  |     ShareButton inside: html-to-image + file-saver.
  |
  +-- <CodeComparison client:visible />                -- Custom React island
  |     Tab UI (10 features as tabs).
  |     Each tab shows code snippet via Expressive Code <Code> component.
  |     ~2 KB custom code (useState for tab state).
  |
src/pages/open-graph/beauty-index/[language].png.ts
  |
  +-- Satori + Sharp (build time)                      -- zero client JS
       Generates OG image with radar chart shape.
       Uses the SAME Satori JSX-to-SVG pipeline as existing blog OG images.
       Radar shape drawn with trigonometry, no Recharts dependency at build time.
```

### Content Collection Extension

Extend `src/content.config.ts` (currently has only `blog`):

```typescript
const languages = defineCollection({
  loader: glob({ pattern: '**/*.json', base: './src/data/languages' }),
  schema: z.object({
    name: z.string(),
    slug: z.string(),
    tagline: z.string(),
    description: z.string(),
    scores: z.object({
      readability: z.number().min(0).max(10),
      performance: z.number().min(0).max(10),
      ecosystem: z.number().min(0).max(10),
      safety: z.number().min(0).max(10),
      expressiveness: z.number().min(0).max(10),
      learnability: z.number().min(0).max(10),
    }),
    overallScore: z.number().min(0).max(10),
    overallRank: z.number().min(1).max(25),
    color: z.string(), // Hex color for chart theming
    features: z.record(z.string(), z.object({
      code: z.string(),
      language: z.string(), // Shiki language ID
      highlights: z.string().optional(), // Line highlight markers
    })),
  }),
});

export const collections = { blog, languages };
```

### OG Image Generation for Language Pages

The existing `src/lib/og-image.ts` uses Satori + Sharp to generate blog OG images at build time. The same pattern extends to Beauty Index pages:

1. Create `src/lib/og-image-beauty.ts` -- a Satori template that includes a radar chart shape
2. The radar chart shape is drawn using basic trigonometry in Satori's JSX object format (the same `{type: 'div', props: {...}}` pattern already in `og-image.ts`)
3. Route at `src/pages/open-graph/beauty-index/[language].png.ts` follows the exact pattern of `src/pages/open-graph/[...slug].png.ts`

**No new dependencies needed for build-time OG images.** Satori + Sharp already handle everything.

### Dynamic Routes for Language Detail Pages

Follow the existing `src/pages/blog/[slug].astro` pattern:

```typescript
// src/pages/beauty-index/[language].astro
export const getStaticPaths: GetStaticPaths = async () => {
  const languages = await getCollection('languages');
  return languages.map((lang) => ({
    params: { language: lang.data.slug },
    props: { language: lang },
  }));
};
```

This generates 25 static pages at build time, identical to how blog post pages work today.

## Installation

```bash
# Runtime dependencies (3 packages)
npm install recharts@^3.7.0 file-saver@^2.0.5 html-to-image@1.11.11

# Type definitions
npm install -D @types/file-saver

# Expressive Code plugin (build-time only)
npm install @expressive-code/plugin-collapsible-sections@^0.41.0
```

**Total new packages: 3 runtime + 1 dev types + 1 build plugin = 5 packages**
**Total new client-side JS (per chart island): ~65 KB gzipped**
**Pages without charts: 0 KB added**

## Alternatives Considered

| Category | Recommended | Alternative | Why Not Alternative |
|----------|-------------|-------------|---------------------|
| Charting | Recharts 3.7 | Chart.js / react-chartjs-2 | Canvas-based, not SVG. Harder to export styled images. Less React-native API. |
| Charting | Recharts 3.7 | D3.js directly | ~70 KB gzipped, imperative API fights React's declarative model, overkill for radar + bar |
| Charting | Recharts 3.7 | Victory | Opinionated styling clashes with "Quantum Explorer" theme, larger bundle |
| Charting | Recharts 3.7 | Nivo | ~200 KB, SSR-focused features unnecessary for client islands |
| Charting | Recharts 3.7 | Custom SVG (no library) | Viable for static charts, but we need interactivity (hover tooltips, animated transitions). Building a custom interactive radar chart is 500+ lines vs 30 lines of Recharts components. |
| Image export | html-to-image 1.11.11 | html2canvas | Known CSS rendering bugs (box-shadow, gradients), less reliable with SVG content |
| Image export | html-to-image 1.11.11 | recharts-to-png | Wraps html2canvas (inherits its bugs), and we need to capture the full styled card not just the chart |
| Image export | html-to-image 1.11.11 | modern-screenshot 4.6.8 | More actively maintained but smaller community. Earmarked as fallback if html-to-image dies. |
| Image export | html-to-image 1.11.11 | Native SVG serialization + Canvas API | foreignObject rendering inconsistent across browsers (especially Safari). 12 KB cost of html-to-image is trivial for the reliability gain. |
| Download trigger | file-saver | Manual `<a download>` click | Edge cases in Safari and mobile WebViews. 3 KB not worth debugging. |
| Code tabs | Custom React useState + Tailwind | Radix Tabs / Headless UI | Adding a UI library for one tab component is unjustified. 30 lines of React vs a new dependency. |
| Code highlighting | Expressive Code (already installed) | Prism.js / highlight.js | Would create duplicate highlighter bundles. Expressive Code already handles 25+ languages via Shiki. |
| Collapsible code | EC plugin-collapsible-sections | Custom CSS details/summary | Loses integration with Expressive Code's build-time processing and theming. |
| Social sharing | Native Web Share API | Share API polyfill | Web Share API works natively on mobile (where sharing matters most). Desktop fallback is copy-to-clipboard. |

## What NOT to Add

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| **Chart.js / react-chartjs-2** | Canvas-based (not SVG), harder to export styled images, less React-native | Recharts |
| **D3.js directly** | Massive bundle, imperative API, overkill for 2 chart types | Recharts (uses D3 internally) |
| **Nivo** | ~200 KB, SSR features unnecessary | Recharts |
| **html2canvas** | Known CSS rendering bugs, larger, less reliable with SVG | html-to-image |
| **Puppeteer/Playwright** | Requires Node.js server; incompatible with GitHub Pages | html-to-image (client-side) |
| **react-svg-radar-chart** | 759 weekly downloads, questionable maintenance | Recharts (40M+ ecosystem) |
| **Radix UI / Headless UI** | Adding a UI library for one tab component is unjustified bloat | Custom React tabs (~30 lines) |
| **Any additional icon library** | Existing codebase uses inline SVGs throughout | Continue inline SVG pattern |
| **Tailwind v4 upgrade** | Major infrastructure change, not scope of this milestone | Keep Tailwind v3 |
| **Any CMS** | 25 JSON files in a content collection; a CMS adds deployment complexity for no benefit | Content collections + JSON files |

## Version Compatibility Matrix

| Package | Version | Compatible With | Verified |
|---------|---------|-----------------|----------|
| recharts | ^3.7.0 | React ^19.2.4, react-dom ^19.2.4 | Peer deps resolved in 3.x; no overrides needed |
| recharts | ^3.7.0 | Astro 5 client:visible islands | SVG output, standard React component |
| html-to-image | 1.11.11 (pinned) | Any browser DOM | No React peer dep; works with DOM refs |
| file-saver | ^2.0.5 | Any browser | No framework dependency |
| @expressive-code/plugin-collapsible-sections | ^0.41.0 | astro-expressive-code ^0.41.6 | Must match EC major.minor version |

## Sources

- [Recharts GitHub releases v3.7.0](https://github.com/recharts/recharts/releases) -- latest version, Jan 2025 (HIGH confidence)
- [Recharts 3.0 migration guide](https://github.com/recharts/recharts/wiki/3.0-migration-guide) -- breaking changes documented (HIGH confidence)
- [Recharts React 19 support issue #4558](https://github.com/recharts/recharts/issues/4558) -- closed, resolved in 3.x (HIGH confidence)
- [Recharts peer dependency discussion #5701](https://github.com/recharts/recharts/discussions/5701) -- react/react-dom/react-is as peers confirmed (HIGH confidence)
- [html-to-image npm](https://www.npmjs.com/package/html-to-image) -- v1.11.11 known stable, later versions regressed (MEDIUM confidence)
- [recharts-to-png package.json](https://github.com/brammitch/recharts-to-png/blob/main/package.json) -- evaluated and rejected (HIGH confidence)
- [Astro Islands architecture docs](https://docs.astro.build/en/concepts/islands/) -- client:visible directive (HIGH confidence)
- [Expressive Code collapsible sections plugin](https://expressive-code.com/plugins/collapsible-sections/) -- official plugin docs (HIGH confidence)
- [Expressive Code component docs](https://expressive-code.com/key-features/code-component/) -- dynamic `<Code>` rendering (HIGH confidence)
- [Paul Scanlon: SVG radar chart in Astro](https://www.paulie.dev/posts/2023/10/how-to-create-an-svg-radar-chart/) -- pure SVG approach for build-time OG images (HIGH confidence)
- [modern-screenshot npm](https://www.npmjs.com/package/modern-screenshot) -- v4.6.8, fallback option (MEDIUM confidence)
- [Best HTML to Canvas Solutions 2025](https://portalzine.de/best-html-to-canvas-solutions-in-2025/) -- library comparison (MEDIUM confidence)
- [Recharts Radar API](https://recharts.org/?p=%2Fen-US%2Fapi%2FRadar) -- component documentation (HIGH confidence)
- [shadcn/ui radar chart components](https://ui.shadcn.com/charts/radar) -- Recharts-based reference implementation (HIGH confidence)
- Existing codebase analysis: `package.json`, `astro.config.mjs`, `tsconfig.json`, `src/content.config.ts`, `src/lib/og-image.ts`, `src/pages/open-graph/[...slug].png.ts` (HIGH confidence -- direct file inspection)

---
*Stack research for: The Beauty Index content pillar*
*Researched: 2026-02-17*
*Key finding: 3 runtime packages (recharts, html-to-image, file-saver) + 1 build plugin. ~65 KB gzipped client-side addition, loaded only in chart islands. Existing Satori + Sharp pipeline handles OG image generation with zero new dependencies.*
