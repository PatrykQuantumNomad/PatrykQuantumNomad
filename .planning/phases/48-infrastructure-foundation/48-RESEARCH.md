# Phase 48: Infrastructure Foundation - Research

**Researched:** 2026-02-24
**Domain:** Astro 5 static site infrastructure -- KaTeX math rendering, D3 code-splitting, OG image caching, Zod content collections, layout isolation
**Confidence:** HIGH

## Summary

Phase 48 establishes the technical foundation for 90+ EDA Visual Encyclopedia pages. The core challenges are: (1) integrating KaTeX math rendering into the Astro MDX pipeline without version conflicts, (2) ensuring D3 micro-modules load exclusively on distribution pages via Vite code-splitting, (3) preventing OG image generation from causing build time regression at scale, (4) defining Zod schemas for three new content collections, and (5) creating an EDA-specific layout that isolates its animation lifecycle from the existing GSAP system.

The existing codebase already proves all necessary patterns at smaller scale: `RadarChart.astro` demonstrates build-time SVG generation, `BreadcrumbJsonLd.astro` provides structured breadcrumbs, `content.config.ts` shows the `file()` loader pattern with Zod schemas (Beauty Index: 25 entries, DB Compass: 12 entries), and `og-image.ts` handles Satori+Sharp OG generation. Phase 48 extends these patterns to EDA-specific requirements while adding two genuinely new capabilities: KaTeX formula rendering and D3 micro-module isolation.

The highest-risk item is the KaTeX + MDX integration. Astro GitHub issue #8650 documents a `mathFlowInside` error with `remark-math@6.0.0`. The prior decision is to attempt v6 first, falling back to v5.1.1 + `rehype-katex@6.0.3` if errors occur. A test page at `/eda/test-formulas/` must validate 10+ formula categories before any content pages are created.

**Primary recommendation:** Build and validate each infrastructure component in isolation (KaTeX test page, D3 bundle proof, OG cache, Zod schemas, EDA layout) before combining them, because the KaTeX version conflict is the most likely blocker and must be resolved first.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| INFRA-01 | KaTeX pipeline installed and configured (remark-math + rehype-katex) with build-time rendering, zero client JS | KaTeX Pipeline section: exact install commands, astro.config.mjs changes, version strategy (v6 first, v5.1.1 fallback) |
| INFRA-02 | KaTeX CSS + woff2 fonts self-hosted, conditional loading on EDA pages only | Self-Hosting Pattern: copy script, font path rewriting, conditional `<link>` in EDALayout |
| INFRA-03 | D3 micro-modules installed, verified to load only on distribution pages via client:visible | D3 Isolation Pattern: exact packages, Vite bundle analysis with rollup-plugin-visualizer, client:visible React island |
| INFRA-04 | EDALayout.astro extending base Layout.astro with isolated animation lifecycle | EDA Layout Pattern: slot-based extension, no content-area GSAP, D3 lifecycle independence |
| INFRA-05 | OG image caching (content-hash based) to prevent build time regression | OG Caching Pattern: hash(title+description), file-based PNG cache, skip-if-exists logic |
| INFRA-06 | Zod schemas for EdaTechnique and EdaDistribution content types | Zod Schema section: complete schema definitions with all required fields |
| INFRA-07 | Three content collections: edaTechniques (JSON file()), edaDistributions (JSON file()), edaPages (MDX glob()) | Content Collection Pattern: exact content.config.ts additions, loader configurations |
| INFRA-08 | TechniquePage.astro template with slots for plot, formulas, Python code, interpretation, related links | Template Pattern: section structure, slot layout, conditional rendering |
| INFRA-09 | Breadcrumb component for EDA pages (EDA > Section > Technique) | Breadcrumb Pattern: visual nav component + BreadcrumbJsonLd, reusing existing pattern |
| INFRA-10 | KaTeX test page validates 10+ NIST formula categories | Test Page Pattern: formula categories to validate, expected render behavior |
| INFRA-11 | Vite bundle analysis confirms D3 only in Tier C page chunks | Bundle Verification: rollup-plugin-visualizer setup, what to check in stats.html |
</phase_requirements>

## Standard Stack

### Core (New Dependencies)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `remark-math` | ^6.0.0 (fallback: 5.1.1) | Parse `$...$` and `$$...$$` math syntax in MDX | Only remark ecosystem plugin for math syntax detection. Build-time only, zero client JS. |
| `rehype-katex` | ^7.0.1 (fallback: 6.0.3) | Transform math AST nodes into pre-rendered KaTeX HTML | Build-time rendering produces static HTML. 2-3x faster than rehype-mathjax. Zero client JS. |
| `katex` | ^0.16.33 | Peer dependency of rehype-katex; math rendering engine | Required by rehype-katex. Only CSS+fonts ship to browser (~24KB CSS + on-demand woff2 fonts). |
| `d3-scale` | ^4.0.2 | Linear/log/ordinal scales for data-to-visual mapping | DOM-independent; works at build time in Astro frontmatter AND client-side in React islands. |
| `d3-shape` | ^3.2.0 | Line/area generators with curve interpolation | DOM-independent; generates SVG path `d` attributes. Used build-time and client-side. |
| `d3-axis` | ^3.0.0 | Axis rendering with tick marks and labels | DOM-dependent; used ONLY in Tier C client-side React islands. |
| `d3-selection` | ^3.0.0 | DOM manipulation for D3 charts | DOM-dependent; used ONLY in Tier C client-side React islands. |
| `d3-array` | ^3.2.4 | Array utilities (extent, range, ticks, bisect) | Transitive dep of d3-scale. Also useful for histogram bins, data extents. DOM-independent. |
| `d3-path` | ^3.1.0 | SVG path serialization | Transitive dep of d3-shape. DOM-independent. |
| `rollup-plugin-visualizer` | ^5.14.0 | Vite bundle analysis for verifying D3 isolation | Astro's official recommended tool for bundle analysis. Dev dependency only. |

### Supporting (Dev Dependencies)

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `@types/d3-scale` | latest | TypeScript definitions for d3-scale | Type-checking D3 usage in Astro frontmatter and React islands |
| `@types/d3-shape` | latest | TypeScript definitions for d3-shape | Type-checking SVG path generation |
| `@types/d3-axis` | latest | TypeScript definitions for d3-axis | Type-checking axis creation in React islands |
| `@types/d3-selection` | latest | TypeScript definitions for d3-selection | Type-checking DOM operations in React islands |
| `@types/d3-array` | latest | TypeScript definitions for d3-array | Type-checking array utilities |
| `@types/d3-path` | latest | TypeScript definitions for d3-path | Type-checking path serialization |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `rehype-katex` (build-time) | Client-side KaTeX auto-render | Adds ~110KB client JS, flash of unstyled math, contradicts static-first architecture |
| `rehype-katex` | `rehype-mathjax` | MathJax produces larger HTML, slower build-time rendering. KaTeX is faster and smaller. |
| D3 micro-modules (6 pkgs, ~17KB gz) | Full `d3` package | Full D3 is ~280KB minified. Micro-modules give 5x smaller bundle with exact imports needed. |
| D3 micro-modules | Pure TypeScript math (no D3) | Reimplementing scale mapping and curve interpolation is error-prone. D3's algorithms are battle-tested. |
| JSON `file()` loader | MDX `glob()` for all data | JSON ensures schema consistency, enables batch computation, builds faster for structured data. |

**Installation:**
```bash
# Math rendering pipeline (build-time only)
npm install remark-math@^6.0.0 rehype-katex@^7.0.1

# D3 micro-modules
npm install d3-scale@^4.0.2 d3-shape@^3.2.0 d3-axis@^3.0.0 d3-selection@^3.0.0 d3-array@^3.2.4 d3-path@^3.1.0

# TypeScript types for D3 (dev only)
npm install -D @types/d3-scale @types/d3-shape @types/d3-axis @types/d3-selection @types/d3-array @types/d3-path

# Bundle analysis (dev only)
npm install -D rollup-plugin-visualizer
```

**Fallback installation (if remark-math v6 causes mathFlowInside errors):**
```bash
npm install remark-math@5.1.1 rehype-katex@6.0.3
```

## Architecture Patterns

### Recommended Project Structure (New Files)

```
src/
├── components/
│   └── eda/
│       ├── EdaBreadcrumb.astro          # Visual breadcrumb nav for EDA pages
│       └── TechniquePage.astro          # Technique page template with slots
├── data/
│   └── eda/
│       ├── techniques.json              # EdaTechnique entries (JSON file() loader)
│       └── distributions.json           # EdaDistribution entries (JSON file() loader)
├── layouts/
│   └── EDALayout.astro                  # Extends Layout.astro, adds KaTeX CSS, isolates animations
├── lib/
│   └── eda/
│       ├── schema.ts                    # Zod schemas: edaTechniqueSchema, edaDistributionSchema
│       └── og-cache.ts                  # Content-hash OG image caching utility
├── pages/
│   └── eda/
│       ├── test-formulas.astro          # KaTeX validation page (INFRA-10)
│       └── ...                          # Future technique/distribution pages
├── content.config.ts                    # Updated: add edaTechniques, edaDistributions, edaPages collections
public/
├── styles/
│   └── katex.min.css                    # Self-hosted KaTeX CSS (copied from node_modules)
├── fonts/
│   └── katex/
│       └── *.woff2                      # Self-hosted KaTeX fonts (20 woff2 files)
└── open-graph/
    └── eda/                             # Cached OG images for EDA pages
scripts/
└── copy-katex-assets.mjs               # One-time script to copy KaTeX CSS + fonts to public/
```

### Pattern 1: KaTeX Pipeline Configuration

**What:** Build-time math rendering via remark-math + rehype-katex. Zero client JS.
**When to use:** All MDX pages with mathematical formulas.

```javascript
// astro.config.mjs
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

### Pattern 2: EDALayout.astro (Layout Extension with Animation Isolation)

**What:** A layout that extends base Layout.astro but adds KaTeX CSS conditionally and avoids content-area GSAP ScrollTrigger conflicts.
**When to use:** All EDA pages.

```astro
---
// EDALayout.astro
import Layout from './Layout.astro';

interface Props {
  title: string;
  description?: string;
  ogImage?: string;
  ogImageAlt?: string;
  useKatex?: boolean;
}

const { title, description, ogImage, ogImageAlt, useKatex = false } = Astro.props;
---

<Layout title={title} description={description} ogImage={ogImage} ogImageAlt={ogImageAlt}>
  {/* Conditionally load KaTeX CSS only when page uses formulas */}
  {useKatex && (
    <link slot="head" rel="stylesheet" href="/styles/katex.min.css" />
  )}

  <slot />
</Layout>
```

**Key design decision:** EDALayout uses the base Layout's `<slot name="head" />` to inject KaTeX CSS conditionally. This avoids loading 24KB of KaTeX CSS on non-math pages. The base Layout already handles GSAP lifecycle via its script block. EDA pages should NOT add additional GSAP ScrollTrigger instances for content-area animations -- use CSS animations or IntersectionObserver instead.

### Pattern 3: Content Collection with file() Loader

**What:** JSON-based content collections for structured EDA data.
**When to use:** Technique and distribution entries with predictable schema.

```typescript
// src/content.config.ts (additions)
import { edaTechniqueSchema, edaDistributionSchema } from './lib/eda/schema';

const edaTechniques = defineCollection({
  loader: file('src/data/eda/techniques.json'),
  schema: edaTechniqueSchema,
});

const edaDistributions = defineCollection({
  loader: file('src/data/eda/distributions.json'),
  schema: edaDistributionSchema,
});

const edaPages = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/data/eda/pages' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    section: z.string(),
    category: z.enum(['foundations', 'case-studies', 'reference']),
    nistSection: z.string(),
  }),
});

export const collections = { blog, languages, dbModels, edaTechniques, edaDistributions, edaPages };
```

### Pattern 4: OG Image Caching

**What:** Content-hash based caching to skip OG image regeneration for unchanged pages.
**When to use:** All EDA OG image endpoints.

```typescript
// src/lib/eda/og-cache.ts
import { createHash } from 'node:crypto';
import { readFile, writeFile, mkdir, stat } from 'node:fs/promises';
import { join } from 'node:path';

const CACHE_DIR = 'public/open-graph/eda';
const CACHE_VERSION = '1'; // Bump when OG template markup/fonts change

export function computeOgHash(title: string, description: string): string {
  return createHash('md5')
    .update(`${CACHE_VERSION}:${title}:${description}`)
    .digest('hex')
    .slice(0, 12);
}

export async function getCachedOgImage(hash: string): Promise<Buffer | null> {
  const cachePath = join(CACHE_DIR, `${hash}.png`);
  try {
    await stat(cachePath);
    return await readFile(cachePath);
  } catch {
    return null;
  }
}

export async function cacheOgImage(hash: string, png: Buffer): Promise<void> {
  await mkdir(CACHE_DIR, { recursive: true });
  await writeFile(join(CACHE_DIR, `${hash}.png`), png);
}
```

### Pattern 5: D3 Isolation via client:visible React Island

**What:** D3 micro-modules load ONLY on distribution pages via a React island with `client:visible`.
**When to use:** Tier C distribution explorer pages only.

```astro
---
// In a distribution page .astro file
// D3 is NOT imported here in the frontmatter.
// Build-time SVG uses d3-scale and d3-shape (DOM-independent) for static fallback.
import { scaleLinear } from 'd3-scale';
import { line, curveBasis } from 'd3-shape';

// ... build-time static SVG generation ...
---

<!-- Static fallback (renders immediately, zero JS) -->
<svg viewBox="0 0 600 300" role="img" aria-label="Normal distribution PDF">
  <path d={staticPathD} fill="none" stroke="var(--color-accent)" stroke-width="2" />
</svg>

<!-- Interactive explorer loads D3 only when scrolled into view -->
<DistributionExplorer
  client:visible
  distribution="normal"
  defaultParams={{ mu: 0, sigma: 1 }}
/>
```

The `DistributionExplorer` React component imports `d3-selection`, `d3-axis`, `d3-scale`, `d3-shape` internally. Vite code-splits these into a separate chunk loaded only when the component hydrates.

### Pattern 6: TechniquePage Template

**What:** Reusable Astro component with named slots for technique page sections.
**When to use:** All 48 graphical + quantitative technique pages.

```astro
---
// TechniquePage.astro
import EDALayout from '../../layouts/EDALayout.astro';
import EdaBreadcrumb from './EdaBreadcrumb.astro';
import BreadcrumbJsonLd from '../BreadcrumbJsonLd.astro';

interface Props {
  title: string;
  description: string;
  category: string;
  nistSection: string;
  relatedTechniques?: Array<{ slug: string; name: string }>;
  useKatex?: boolean;
}

const { title, description, category, nistSection, relatedTechniques = [], useKatex = false } = Astro.props;
---

<EDALayout title={`${title} | EDA Visual Encyclopedia`} description={description} useKatex={useKatex}>
  <BreadcrumbJsonLd crumbs={[
    { name: 'Home', url: 'https://patrykgolabek.dev/' },
    { name: 'EDA', url: 'https://patrykgolabek.dev/eda/' },
    { name: category, url: `https://patrykgolabek.dev/eda/${category.toLowerCase().replace(/\s+/g, '-')}/` },
    { name: title, url: `https://patrykgolabek.dev/eda/techniques/${title.toLowerCase().replace(/\s+/g, '-')}/` },
  ]} />

  <article class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
    <EdaBreadcrumb category={category} techniqueName={title} />

    <header class="mb-10">
      <h1 class="text-3xl sm:text-4xl font-heading font-bold mb-4">{title}</h1>
      <p class="text-sm text-[var(--color-text-secondary)]">NIST/SEMATECH Section {nistSection}</p>
    </header>

    {/* Named slots for content sections */}
    <slot name="plot" />
    <slot name="description" />
    <slot name="formula" />
    <slot name="code" />
    <slot name="interpretation" />

    {/* Related techniques */}
    {relatedTechniques.length > 0 && (
      <section class="mt-12 pt-8 border-t border-[var(--color-border)]">
        <h2 class="text-xl font-heading font-bold mb-4">Related Techniques</h2>
        <div class="flex flex-wrap gap-3">
          {relatedTechniques.map((t) => (
            <a href={`/eda/techniques/${t.slug}/`}
               class="inline-flex items-center px-3 py-1.5 rounded-full text-sm bg-[var(--color-accent)]/10 text-[var(--color-accent)] hover:bg-[var(--color-accent)]/20 transition-colors">
              {t.name}
            </a>
          ))}
        </div>
      </section>
    )}
  </article>
</EDALayout>
```

### Anti-Patterns to Avoid

- **Importing D3 in EDALayout or any shared component:** D3 must ONLY be imported inside client-side island components (React) with `client:visible`. Importing in layout or Astro template ships D3 to ALL pages.
- **Using `client:load` for D3 islands:** Use `client:visible` (loads when scrolled into view) or `client:idle` (loads when browser is idle). `client:load` blocks rendering.
- **Loading KaTeX CSS globally in Layout.astro:** Add KaTeX CSS only in EDALayout.astro, only when `useKatex` prop is true. Non-EDA pages must not load 24KB of unused CSS.
- **Using the full `d3` package:** Always import specific sub-modules. Full D3 is 280KB minified and prevents effective tree-shaking.
- **Adding GSAP ScrollTrigger in EDA content areas:** GSAP lifecycle cleanup in `animation-lifecycle.ts` already handles header/footer animations. Adding content-area ScrollTrigger instances risks leaks during view transitions. Use CSS animations or IntersectionObserver for EDA content reveals.
- **Inlining complex SVG plots directly in MDX:** Use `<img>` tags pointing to SVG files or Astro component-generated SVGs via build-time rendering. Inline SVG bloats DOM node count and triggers Lighthouse warnings.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Math rendering | Custom LaTeX parser | remark-math + rehype-katex | LaTeX parsing has hundreds of edge cases (nested braces, Greek symbols, matrices, sizing). KaTeX is battle-tested by millions of users. |
| SVG path interpolation | Custom cubic bezier curves | d3-shape with curveBasis/curveMonotoneX | D3's interpolation algorithms handle edge cases (zero-length segments, discontinuities) that custom code misses. |
| Scale mapping | Custom linear/log scale functions | d3-scale | D3 scales handle domain/range inversion, clamping, nice rounding, and tick generation correctly. |
| OG image rendering | Custom Canvas/SVG-to-PNG | satori + sharp (already installed) | Satori handles React-to-SVG conversion, font loading, text wrapping. sharp handles PNG output optimization. |
| Content validation | Manual type checking | Zod schemas in content.config.ts | Zod provides runtime validation, TypeScript type inference, and helpful error messages for every collection entry. |
| Bundle analysis | Manual chunk inspection | rollup-plugin-visualizer | Visual treemap shows exactly which modules appear in which chunks, with sizes. |

**Key insight:** Every "infrastructure" component in this phase has an established library solution. The implementation work is configuration, integration, and verification -- not building from scratch.

## Common Pitfalls

### Pitfall 1: remark-math v6 mathFlowInside Error

**What goes wrong:** `remark-math@6.0.0` with Astro 5's internal remark/rehype versions can throw "Cannot read properties of undefined (reading 'mathFlowInside')" on multiline `$$...$$` math blocks.
**Why it happens:** Version mismatch between Astro's pinned remark/rehype internals and remark-math v6's expectations. Documented in Astro issue #8650 (closed as "not planned") and remark-math issue #89.
**How to avoid:** Attempt `remark-math@^6.0.0` + `rehype-katex@^7.0.1` first. If the error occurs, immediately downgrade to `remark-math@5.1.1` + `rehype-katex@6.0.3`. Test with 10+ formula categories on the test page BEFORE writing any content.
**Warning signs:** Build fails with `mathFlowInside` error; multiline display math (`$$...$$`) renders correctly but single-line breaks; formulas render as raw LaTeX text.

### Pitfall 2: KaTeX Font Path Mismatch After Self-Hosting

**What goes wrong:** KaTeX CSS references fonts at a relative path (`fonts/KaTeX_Main-Regular.woff2`). After copying to `public/styles/katex.min.css`, the relative path resolves to `public/styles/fonts/` instead of `public/fonts/katex/`.
**Why it happens:** KaTeX CSS uses relative font-face URLs. Moving the CSS file changes the base path for relative URLs.
**How to avoid:** After copying `katex.min.css` to `public/styles/`, find-and-replace all `url(fonts/` with `url(/fonts/katex/` to use absolute paths. Verify by checking that Greek letters, summation symbols, and integral signs render correctly (these use different font files).
**Warning signs:** Math renders but with wrong spacing; some symbols appear as empty boxes; Greek letters appear in browser fallback font (sans-serif instead of KaTeX serif).

### Pitfall 3: D3 Bundle Leaking to Non-Distribution Pages

**What goes wrong:** D3 modules appear in shared Vite chunks loaded by ALL EDA pages, not just distribution pages.
**Why it happens:** If a shared utility or Astro component imports from D3 (even d3-scale which is DOM-independent), Vite may bundle it into a shared chunk. Dynamic imports in Astro frontmatter (which runs at build time) can also confuse the bundler.
**How to avoid:** D3 imports for client-side use must ONLY appear inside React island components. Build-time usage of d3-scale/d3-shape in Astro frontmatter is fine (runs in Node.js, not bundled for client). Verify with `rollup-plugin-visualizer` after implementation.
**Warning signs:** Bundle analysis shows `d3-scale`, `d3-shape`, `d3-axis`, or `d3-selection` in chunks other than distribution page chunks. Lighthouse JS payload increases on non-distribution EDA pages.

### Pitfall 4: GSAP/D3 Animation Lifecycle Conflicts

**What goes wrong:** Navigating from an EDA page with D3 charts to a non-EDA page (blog, home) and back causes duplicate chart renders, console errors, or memory leaks.
**Why it happens:** The existing animation lifecycle (`cleanupAnimations()`) kills all GSAP ScrollTrigger instances and Lenis on `astro:before-swap`. D3 components manage their own DOM independently. If a D3 component doesn't clean up on unmount AND doesn't check for existing content on re-mount, view transitions cause duplicates.
**How to avoid:** D3 React island components must: (1) clear their container SVG on every mount, (2) clean up resize/scroll listeners on unmount via React `useEffect` cleanup, (3) use a `data-initialized` attribute to detect duplicate initialization. Test navigation: Home -> EDA -> Blog -> EDA -> Home (5 cycles).
**Warning signs:** Console errors about D3 selectors or null DOM refs; charts render doubled/overlapping after navigation; heap snapshot shows growing memory after navigation cycles.

### Pitfall 5: OG Image Cache Invalidation

**What goes wrong:** OG images are cached but the OG template markup or fonts change, resulting in stale cached images with the old design being served.
**Why it happens:** Cache key is based on content hash (title + description) but doesn't include the template version.
**How to avoid:** Include a `CACHE_VERSION` constant in the hash. Bump it whenever the OG template markup or fonts change. This invalidates all cached images, forcing regeneration.
**Warning signs:** OG images look different in development vs production; social media previews show outdated styling.

### Pitfall 6: MDX Curly Braces Conflict with LaTeX

**What goes wrong:** LaTeX formulas containing `{}` (e.g., `\frac{a}{b}`, `\sum_{i=1}^{n}`) are interpreted as JSX expressions by the MDX parser, causing build errors.
**Why it happens:** MDX treats `{}` as JSX expression boundaries. LaTeX syntax heavily uses `{}` for grouping. The remark-math plugin should intercept math blocks before JSX parsing, but complex nested braces can still confuse the parser.
**How to avoid:** (1) Test all formula patterns in the `/eda/test-formulas/` page before writing content pages. (2) For formulas that break MDX parsing, use a custom `<Math>` Astro component that accepts the formula as a string prop and calls `katex.renderToString()` directly. (3) Use `.md` (not `.mdx`) for pages that are formula-heavy but don't need interactive components.
**Warning signs:** MDX build errors mentioning unexpected `{` or `}` tokens; some formulas render but others on the same page don't; partial formula rendering where braces are stripped.

## Code Examples

### KaTeX Self-Hosting Script

```javascript
// scripts/copy-katex-assets.mjs
import { copyFile, mkdir, readFile, writeFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';

const KATEX_DIST = 'node_modules/katex/dist';
const CSS_DEST = 'public/styles';
const FONT_DEST = 'public/fonts/katex';

async function main() {
  // Create directories
  await mkdir(CSS_DEST, { recursive: true });
  await mkdir(FONT_DEST, { recursive: true });

  // Copy and patch CSS
  let css = await readFile(join(KATEX_DIST, 'katex.min.css'), 'utf-8');
  css = css.replace(/url\(fonts\//g, 'url(/fonts/katex/');
  await writeFile(join(CSS_DEST, 'katex.min.css'), css);

  // Copy woff2 fonts only (most efficient format)
  const fontDir = join(KATEX_DIST, 'fonts');
  const files = await readdir(fontDir);
  const woff2Files = files.filter((f) => f.endsWith('.woff2'));
  for (const file of woff2Files) {
    await copyFile(join(fontDir, file), join(FONT_DEST, file));
  }

  console.log(`Copied ${woff2Files.length} woff2 fonts to ${FONT_DEST}`);
  console.log(`Patched katex.min.css -> ${CSS_DEST}/katex.min.css`);
}

main();
```

### Zod Schemas for EDA Content Collections

```typescript
// src/lib/eda/schema.ts
import { z } from 'astro/zod';

/** Interactivity tier for EDA pages */
export const tierSchema = z.enum(['A', 'B', 'C']);

/** Zod schema for an EDA technique entry */
export const edaTechniqueSchema = z.object({
  id: z.string(),
  title: z.string(),
  slug: z.string(),
  category: z.enum(['graphical', 'quantitative']),
  section: z.string(), // e.g., "1.3.3.14" (NIST section ref)
  nistSection: z.string(), // Full NIST section identifier
  description: z.string(),
  tier: tierSchema,
  variantCount: z.number().int().min(0).default(0),
  relatedTechniques: z.array(z.string()).default([]), // Array of slugs
  tags: z.array(z.string()).default([]), // e.g., ["location", "randomness"]
});

/** Zod schema for an EDA distribution entry */
export const edaDistributionSchema = z.object({
  id: z.string(),
  title: z.string(),
  slug: z.string(),
  parameters: z.array(z.object({
    name: z.string(),    // e.g., "mu"
    symbol: z.string(),  // e.g., "\\mu"
    min: z.number(),
    max: z.number(),
    default: z.number(),
    step: z.number(),
  })),
  pdfFormula: z.string(),  // KaTeX-ready LaTeX string
  cdfFormula: z.string(),  // KaTeX-ready LaTeX string
  mean: z.string(),        // Formula for mean
  variance: z.string(),    // Formula for variance
  relatedDistributions: z.array(z.string()).default([]), // Array of slugs
  nistSection: z.string(),
  description: z.string(),
});

/** TypeScript types inferred from schemas */
export type EdaTechnique = z.infer<typeof edaTechniqueSchema>;
export type EdaDistribution = z.infer<typeof edaDistributionSchema>;
```

### Vite Bundle Analysis Configuration

```javascript
// astro.config.mjs addition for INFRA-11 verification
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig({
  // ... existing config
  vite: {
    plugins: [
      visualizer({
        emitFile: true,
        filename: 'stats.html',
      }),
    ],
  },
});
```

After running `npm run build`, open `dist/stats.html` in a browser. Search for `d3-scale`, `d3-shape`, `d3-axis`, `d3-selection` in the treemap. They must appear ONLY in chunks associated with distribution pages (Tier C), not in shared chunks or other EDA page chunks.

### KaTeX Test Page Formula Categories

```astro
---
// src/pages/eda/test-formulas.astro
import EDALayout from '../../layouts/EDALayout.astro';
---

<EDALayout title="KaTeX Formula Test" description="Validation page for KaTeX formula rendering" useKatex={true}>
  <div class="max-w-3xl mx-auto px-4 py-16 prose prose-lg">
    <h1>KaTeX Formula Validation</h1>

    <h2>1. Greek Symbols</h2>
    <p>Inline: $\alpha, \beta, \gamma, \delta, \sigma, \mu, \lambda, \chi^2$</p>

    <h2>2. Fractions</h2>
    <p>$$\frac{x + y}{z - w}$$</p>

    <h2>3. Summations</h2>
    <p>$$\sum_{i=1}^{n} x_i$$</p>

    <h2>4. Integrals</h2>
    <p>$$\int_{-\infty}^{\infty} f(x) \, dx$$</p>

    <h2>5. Square Roots</h2>
    <p>$$\sqrt{\frac{1}{n} \sum_{i=1}^{n} (x_i - \bar{x})^2}$$</p>

    <h2>6. Matrices</h2>
    <p>$$\begin{pmatrix} a & b \\ c & d \end{pmatrix}$$</p>

    <h2>7. Subscripts and Superscripts</h2>
    <p>$$\hat{\beta}_1 = \frac{\sum_{i=1}^n (x_i - \bar{x})(y_i - \bar{y})}{\sum_{i=1}^n (x_i - \bar{x})^2}$$</p>

    <h2>8. Probability Density Function (Normal)</h2>
    <p>$$f(x) = \frac{1}{\sigma\sqrt{2\pi}} e^{-\frac{1}{2}\left(\frac{x - \mu}{\sigma}\right)^2}$$</p>

    <h2>9. Multi-line Aligned Equations</h2>
    <p>$$\begin{aligned} \bar{x} &= \frac{1}{n}\sum_{i=1}^n x_i \\ s^2 &= \frac{1}{n-1}\sum_{i=1}^n (x_i - \bar{x})^2 \end{aligned}$$</p>

    <h2>10. Complex Statistical Formula (Chi-Squared Test)</h2>
    <p>$$\chi^2 = \sum_{i=1}^k \frac{(O_i - E_i)^2}{E_i}$$</p>

    <h2>11. Product/Large Operators</h2>
    <p>$$L(\theta) = \prod_{i=1}^n f(x_i | \theta)$$</p>
  </div>
</EDALayout>
```

### EdaBreadcrumb Component

```astro
---
// src/components/eda/EdaBreadcrumb.astro
interface Props {
  category: string;
  techniqueName?: string;
}

const { category, techniqueName } = Astro.props;

const categorySlug = category.toLowerCase().replace(/\s+/g, '-');

const crumbs = [
  { label: 'EDA', href: '/eda/' },
  { label: category, href: `/eda/${categorySlug}/` },
];

if (techniqueName) {
  crumbs.push({ label: techniqueName, href: '' }); // Current page, no link
}
---

<nav aria-label="Breadcrumb" class="mb-6">
  <ol class="flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
    {crumbs.map((crumb, i) => (
      <li class="flex items-center gap-2">
        {i > 0 && <span aria-hidden="true">/</span>}
        {crumb.href ? (
          <a href={crumb.href} class="hover:text-[var(--color-accent)] transition-colors">
            {crumb.label}
          </a>
        ) : (
          <span class="text-[var(--color-text-primary)] font-medium">{crumb.label}</span>
        )}
      </li>
    ))}
  </ol>
</nav>
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Client-side KaTeX auto-render (~110KB JS) | Build-time rehype-katex (zero client JS) | rehype-katex v6+ (2023) | Eliminates flash of unstyled math, reduces JS payload to zero |
| Full `d3` package import (280KB) | D3 micro-module imports (17KB gzipped) | D3 v4+ modular architecture (2016), but still commonly mis-used | 5x smaller bundle, effective tree-shaking |
| Astro Content Collections v1 (`type: 'content'`) | Content Layer API with `file()` and `glob()` loaders | Astro 5.0 (2024) | Up to 5x faster Markdown builds, 2x faster MDX, 25-50% less memory |
| OG images regenerated every build | Content-hash caching skips unchanged images | Community pattern (2024+) | Build time reduced from O(n) to O(changed pages) for OG step |
| CDN-hosted KaTeX CSS | Self-hosted CSS + woff2 fonts | Best practice for static sites | Eliminates external dependency, same-origin serving, no third-party tracking |

**Deprecated/outdated:**
- `remark-math@4.x` / `rehype-katex@5.x`: Incompatible with unified v11 ecosystem used by Astro 5
- Astro `src/content/config.ts` path: Changed to `src/content.config.ts` in Astro 5.0
- `extendDefaultPlugins` option: Removed in favor of `extendMarkdownConfig` (default true for MDX)

## Open Questions

1. **remark-math v6 compatibility with current Astro 5.x**
   - What we know: Astro issue #8650 reports `mathFlowInside` errors with v6, closed as "not planned". Some users report v6 works with Astro 5.3+. The remark-math issue #89 confirms the root cause is version misalignment.
   - What's unclear: Whether the current Astro 5.3.0 has updated its internal remark/rehype to be compatible with remark-math v6. The issue was filed against Astro 3.x.
   - Recommendation: Attempt v6 installation first. If it fails, immediately fall back to v5.1.1 + rehype-katex@6.0.3. The test page (INFRA-10) is specifically designed to validate this before any content is written.

2. **KaTeX Dark Mode Visibility**
   - What we know: KaTeX CSS assumes light backgrounds. The site uses dark mode. Math symbols (especially operators and delimiters) may be invisible on dark backgrounds.
   - What's unclear: Exactly which KaTeX elements need dark-mode CSS overrides.
   - Recommendation: After self-hosting KaTeX CSS, test formula rendering in dark mode. Add CSS overrides for `.katex` text color to use `var(--color-text-primary)` if needed.

3. **Content-Security-Policy impact**
   - What we know: KaTeX uses inline styles (`style` attributes on rendered HTML). The existing CSP meta tag includes `style-src 'self' 'unsafe-inline'`, which already allows this.
   - What's unclear: Whether KaTeX's specific inline style patterns work with the current CSP.
   - Recommendation: Verify after integration. The existing `'unsafe-inline'` in style-src should be sufficient.

4. **Build-time D3 imports in Astro frontmatter**
   - What we know: d3-scale and d3-shape are DOM-independent and work in Node.js. They should work in Astro frontmatter for build-time SVG generation.
   - What's unclear: Whether Vite's client-side bundler also picks up frontmatter-only D3 imports and includes them in client chunks.
   - Recommendation: Test with a simple build: import d3-scale in an Astro component's frontmatter, verify it does NOT appear in any client-side chunk via bundle analysis.

## Sources

### Primary (HIGH confidence)
- [Astro Content Collections Docs](https://docs.astro.build/en/guides/content-collections/) -- `file()` and `glob()` loader APIs, Zod schema validation, Content Layer API
- [Astro Bundle Analysis Recipe](https://docs.astro.build/en/recipes/analyze-bundle-size/) -- `rollup-plugin-visualizer` setup and usage
- [KaTeX Font Documentation](https://katex.org/docs/font) -- Self-hosting fonts, woff2 file inventory, font-face path configuration
- [KaTeX Node.js Documentation](https://katex.org/docs/node) -- Server-side rendering with `katex.renderToString()`
- Existing codebase: `src/content.config.ts` -- Proven `file()` loader pattern for Beauty Index (25 entries) and DB Compass (12 entries)
- Existing codebase: `src/layouts/Layout.astro` -- Base layout with `<slot name="head" />` for conditional CSS injection
- Existing codebase: `src/lib/animation-lifecycle.ts` -- GSAP/Lenis cleanup pattern on `astro:before-swap`
- Existing codebase: `src/components/BreadcrumbJsonLd.astro` -- JSON-LD breadcrumb structured data pattern
- Existing codebase: `src/lib/og-image.ts` -- Satori+Sharp OG image generation pattern
- Existing codebase: `src/components/beauty-index/RadarChart.astro` -- Build-time SVG generation in Astro frontmatter (zero client JS)
- Prior research: `.planning/research/STACK.md` -- Verified D3 micro-bundle size (48KB min / 17KB gzip), version compatibility matrix, build-time SVG strategy

### Secondary (MEDIUM confidence)
- [Astro GitHub Issue #8650](https://github.com/withastro/astro/issues/8650) -- remark-math multiline error, closed "not planned", recommends v5.1.1 fallback
- [remark-math GitHub Issue #89](https://github.com/remarkjs/remark-math/issues/89) -- `mathFlowInside` error caused by remark version mismatch
- [Astro OGP Build Cache (ainoya.dev)](https://ainoya.dev/posts/astro-ogp-build-cache/) -- Content-hash OG caching pattern, verified approach
- [MDX Math Guide](https://mdxjs.com/guides/math/) -- Official MDX documentation on remark-math + rehype-katex integration
- [Byteli: Math Typesetting in Astro](https://www.byteli.com/blog/2024/math_in_astro/) -- Community guide for remark-math + rehype-katex in Astro

### Tertiary (LOW confidence)
- [KaTeX GitHub Issue #4096](https://github.com/KaTeX/KaTeX/issues/4096) -- CSP `style-src 'unsafe-inline'` requirement (noted but current CSP already includes this)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries verified via official docs, npm, and existing codebase patterns. Version compatibility matrix from prior research.
- Architecture: HIGH - All patterns extend proven codebase conventions (Layout slots, file() loader, RadarChart build-time SVG, BreadcrumbJsonLd). No novel architecture.
- Pitfalls: HIGH - KaTeX version conflict documented in two GitHub issues with confirmed workaround. D3 bundle isolation verified via Astro's island architecture documentation. GSAP lifecycle documented in codebase CONCERNS.md.

**Research date:** 2026-02-24
**Valid until:** 2026-03-24 (stable ecosystem; KaTeX/D3/Astro versions unlikely to change in 30 days)
