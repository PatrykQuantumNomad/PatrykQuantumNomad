# Architecture Research: SEO Audit Fixes Integration

**Domain:** Astro 5 SSG portfolio site -- SEO remediation
**Researched:** 2026-04-15
**Confidence:** HIGH

## System Overview

```
+---------------------------------------------------------------+
|                      Layout.astro                              |
|  (Google Fonts <link>, CSP meta, SEOHead, ClientRouter)        |
+-------+-----------+-----------+-----------+-------------------+
        |           |           |           |
  +-----+---+ +----+----+ +----+----+ +----+--------+
  | Blog    | | Beauty  | | EDA     | | Tools /     |
  | [slug]  | | Index   | | Layout  | | DB-Compass  |
  +----+----+ +----+----+ +----+----+ +----+--------+
       |           |           |           |
       v           v           v           v
  content      languages   edaPages    models.json
  collections  .json       .mdx        (file loader)
  (glob)       (file)      (glob)
```

### Key Architectural Layers

| Layer | Components | Current Implementation |
|-------|-----------|------------------------|
| **Layout** | `Layout.astro` wrapping `SEOHead.astro` | Single global layout with `<slot name="head" />` for page-specific head injections |
| **Page Routes** | `src/pages/**/*.astro` | Dynamic routes via `getStaticPaths()` returning `params` + `props` |
| **Content** | `src/data/` with Zod-validated collections | `content.config.ts` defines all collections; blog uses `glob` loader, beauty-index uses `file` loader |
| **Lib** | `src/lib/beauty-index/`, `src/lib/eda/` | Pure TypeScript modules for schemas, math, dimensions -- no side effects |
| **Components** | `src/components/beauty-index/`, `src/components/blog/` | Astro components with scoped `<style>` + Tailwind utility classes |
| **Styles** | `src/styles/global.css` imported in `Layout.astro` | Tailwind base/components/utilities + CSS custom properties for theming |
| **Build Config** | `astro.config.mjs` | Sitemap serialize hook, IndexNow integration, MDX + Tailwind + ExpressiveCode |

## Integration Point 1: VS Page Template -- Adding Rich Content Sections

### Current State

The VS comparison page lives at:
```
src/pages/beauty-index/vs/[slug].astro
```

It generates **650 static pages** (26 x 25 ordered pairs). The template receives `langA` and `langB` as props from `getStaticPaths()`, which iterates all ordered pairs from the `languages` content collection.

**Current page structure (top to bottom):**
1. Back link to `/beauty-index/`
2. `<header>` with H1 ("{langA} vs {langB}"), tier badges, scores
3. `OverlayRadarChart` (build-time SVG, zero JS)
4. Download button for OG image
5. Verdict paragraph (computed text)
6. Dimension Breakdown table (6 rows + total)
7. Character Sketches (2-column grid)
8. Methodology link

**Current JSON-LD:** `VsJsonLd.astro` emits a `WebPage` schema with `about: [ComputerLanguage, ComputerLanguage]`.

### Where to Add Rich Content

New sections should be inserted **between the Dimension Breakdown table and the Character Sketches** (after `</section>` at ~line 220, before the Character Sketches `<section>` at ~line 222). This maintains the natural reading flow: numbers first, then narrative.

**Content to add (suggested):**

```astro
{/* NEW: Winner/Edge Summary */}
<section class="mt-12">
  <h2 class="text-xl font-heading font-bold mb-4">
    Where Each Language Shines
  </h2>
  {/* Per-dimension prose for dimensions where delta != 0 */}
  {dimensions.filter(d => d.delta !== 0).map((row) => (
    <div class="mb-4">
      <h3 class="font-heading font-bold text-base">
        <span class="text-[var(--color-accent)]">{row.dim.symbol}</span>
        {' '}{row.dim.shortName}: {row.delta > 0 ? langA.name : langB.name} leads
      </h3>
      <p class="text-[var(--color-text-secondary)] leading-relaxed">
        {/* Generate dimension-specific comparison prose */}
      </p>
    </div>
  ))}
</section>
```

**Data availability:** All dimension metadata (descriptions, symbols, short names) is already available via the `DIMENSIONS` import. The `dimensions` array computed in the frontmatter has `scoreA`, `scoreB`, `delta`, and the `dim` object. No new data sources are needed.

**Template modification approach:**
- The file is self-contained at 247 lines -- small enough to modify directly
- No external state or side effects beyond the content collection query
- The computed `verdict` string can be reused or expanded
- New sections should use the same Tailwind patterns: `mt-12`, `text-xl font-heading font-bold`, `text-[var(--color-text-secondary)]`

### Files to Modify

| File | Change |
|------|--------|
| `src/pages/beauty-index/vs/[slug].astro` | Add rich content sections between dimension table and character sketches |
| `src/components/beauty-index/VsJsonLd.astro` | Expand schema with FAQPage or add more structured data |

### Files NOT to Modify

| File | Why |
|------|-----|
| `src/lib/beauty-index/dimensions.ts` | Dimension metadata is already complete |
| `src/lib/beauty-index/schema.ts` | Language schema is unchanged |
| `src/data/beauty-index/languages.json` | Data source is unchanged |
| `src/components/beauty-index/OverlayRadarChart.astro` | Chart component is independent |

## Integration Point 2: CSS Code-Splitting and Cross-Route Leaks

### How Astro CSS Works in This Project

**Three CSS mechanisms coexist:**

1. **Global CSS:** `src/styles/global.css` is imported in `Layout.astro` line 3 (`import '../styles/global.css'`). This file contains Tailwind directives, CSS custom properties, and extensive global styles (~660 lines). Every page inherits this.

2. **Scoped `<style>` tags:** Astro components use `<style>` which compiles to `data-astro-cid-*` attribute selectors. These are safe -- they cannot leak.

3. **Imported CSS from components:** This is the leak vector. When a page imports a component, ALL CSS that component imports is included in the page's CSS chunk -- even if the component is conditionally rendered.

### Code-Splitting Behavior

At build time, Astro:
- Minifies and combines CSS into chunks per page
- Shared CSS (used by 2+ pages) is split into separate reusable chunks
- Chunks > 4kB are linked as external `<link>` tags
- Smaller shared chunks are inlined as `<style>` tags

### Where CSS Bloat Originates in This Site

**Primary suspect: `Layout.astro` imports 8 animation components unconditionally:**

```typescript
// Layout.astro lines 8-15
import CustomCursor from '../components/animations/CustomCursor.astro';
import TiltCard from '../components/animations/TiltCard.astro';
import MagneticButton from '../components/animations/MagneticButton.astro';
import SplitText from '../components/animations/SplitText.astro';
import TextScramble from '../components/animations/TextScramble.astro';
import WordReveal from '../components/animations/WordReveal.astro';
import FloatingOrbs from '../components/animations/FloatingOrbs.astro';
import TimelineDrawLine from '../components/animations/TimelineDrawLine.astro';
```

All 8 are rendered on every page. Their CSS (if any is imported rather than scoped) ships to all 1,184 pages. This is by design for this site -- these are global UI enhancements -- but any CSS they import globally will inflate every page.

**Secondary suspect: `global.css` at ~660 lines.** Contains styles for features not present on every page (`.prose`, `.meta-mono`, `.contact-card`, `.live-site-btn`, etc.). Since it is a single `@import`, Astro treats it as one chunk shared across all pages.

**Known Astro bug (fixed):** Issue #16115 documented CSS graph traversal crossing page boundaries via `astro:i18n`. The fix (PR #16116) introduced `createCssTraversalBoundary` to stop at top-level page modules. This site does not use `astro:i18n`, so this specific bug does not apply. However, the same class of issue can occur with any shared virtual module.

### Cross-Route Leak Risk Assessment

| Risk | Severity | This Site |
|------|----------|-----------|
| Scoped `<style>` leaking | None | Astro handles correctly |
| Imported CSS from unused component | Medium | Possible if future components import external CSS |
| Shared virtual module traversal | Low | No `astro:i18n`, but `ClientRouter` is shared |
| Global CSS bloat | Low-Medium | `global.css` ships everything everywhere |

### Mitigation Strategies

1. **Keep component CSS scoped:** Use `<style>` tags in `.astro` components, not imported `.css` files
2. **Audit global.css:** Consider splitting `.prose` styles into a separate file imported only by blog layout
3. **Conditional imports via `<slot name="head">`:** The EDA layout already demonstrates this pattern -- it injects KaTeX CSS only when `useKatex` is true
4. **PurgeCSS:** `astro-purgecss` can strip unused rules, but adds build complexity
5. **Build analysis:** Use `rollup-plugin-visualizer` (already in devDependencies) to identify CSS chunk sizes

### Files to Investigate/Modify

| File | Action |
|------|--------|
| `src/styles/global.css` | Audit for section-specific styles that could be split out |
| `src/layouts/Layout.astro` | Consider whether animation imports can be conditional |
| Any new components | Ensure CSS is scoped, not imported |

## Integration Point 3: Font Migration -- Google Fonts to @fontsource

### Current Font Architecture

**Fonts loaded (Layout.astro lines 115-129):**
- Bricolage Grotesque: weights 700, 800 (headings)
- DM Sans: weights 400, 500, 700 (body)
- Fira Code: weight 400 (monospace)
- Noto Sans: weights 400, 700 (Greek fallback only, unicode-range U+0370-03FF)

**Current loading strategy:**
1. `<link rel="preconnect">` to `fonts.googleapis.com` and `fonts.gstatic.com`
2. `<link rel="preload" as="style" onload="...">` -- async stylesheet loading
3. `<noscript>` fallback with synchronous `<link rel="stylesheet">`

**CSS custom property fallbacks (global.css lines 40-67):**
```css
@font-face { font-family: 'Bricolage Grotesque Fallback'; src: local('Arial'); size-adjust: 95%; ... }
@font-face { font-family: 'DM Sans Fallback'; src: local('Arial'); size-adjust: 97%; ... }
@font-face { font-family: 'Greek Fallback'; src: local('Noto Sans'); unicode-range: U+0370-03FF; ... }
```

**Tailwind config (tailwind.config.mjs):**
```javascript
fontFamily: {
  sans: ['DM Sans', 'DM Sans Fallback', 'Greek Fallback', ...defaultTheme.fontFamily.sans],
  heading: ['Bricolage Grotesque', 'Bricolage Grotesque Fallback', 'Greek Fallback', ...defaultTheme.fontFamily.sans],
  mono: ['Fira Code', ...defaultTheme.fontFamily.mono],
}
```

**CSP header (Layout.astro line 78):**
```
style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
font-src 'self' https://fonts.gstatic.com;
connect-src 'self' https://fonts.googleapis.com https://fonts.gstatic.com ...;
```

### Migration Options

**Option A: Astro experimental.fonts API (Astro 5.7+)**

The Fonts API was introduced in Astro 5.7 as an experimental feature. It supports Fontsource as a provider and generates CSS variables automatically.

```javascript
// astro.config.mjs
import { defineConfig, fontProviders } from "astro/config";
export default defineConfig({
  experimental: {
    fonts: [
      { provider: fontProviders.fontsource(), name: "DM Sans", cssVariable: "--font-dm-sans" },
      { provider: fontProviders.fontsource(), name: "Bricolage Grotesque", cssVariable: "--font-bricolage" },
      { provider: fontProviders.fontsource(), name: "Fira Code", cssVariable: "--font-fira-code" },
    ]
  }
});
```

**Risk:** Experimental flag means API may change between minor versions. The site runs `astro ^5.3.0` and would need to update to 5.7+.

**Option B: Direct @fontsource npm packages (RECOMMENDED)**

Install font packages, import in Layout.astro, remove Google Fonts `<link>` tags.

```bash
npm install @fontsource-variable/bricolage-grotesque @fontsource-variable/dm-sans @fontsource/fira-code @fontsource/noto-sans
```

```astro
// Layout.astro -- replace Google Fonts links with:
import '@fontsource-variable/bricolage-grotesque';
import '@fontsource-variable/dm-sans';
import '@fontsource/fira-code/400.css';
import '@fontsource/noto-sans/400.css';
import '@fontsource/noto-sans/700.css';
```

**Why Option B over A:**
- Stable API, not experimental
- Works with current Astro version (^5.3.0)
- Direct control over which weights/subsets are imported
- Variable font packages (`@fontsource-variable/*`) give full weight range in a single file
- No new Astro API to learn or track

### Migration Checklist

| Step | File | Action |
|------|------|--------|
| 1 | `package.json` | `npm install` fontsource packages |
| 2 | `src/layouts/Layout.astro` | Replace lines 115-129 (Google Fonts) with `import` statements |
| 3 | `src/layouts/Layout.astro` | Remove `<link rel="preconnect">` for fonts.googleapis.com/gstatic.com |
| 4 | `src/layouts/Layout.astro` | Update CSP meta tag: remove `https://fonts.googleapis.com` from `style-src`, remove `https://fonts.gstatic.com` from `font-src`, remove both from `connect-src` |
| 5 | `src/styles/global.css` | Keep fallback `@font-face` declarations (they still reduce CLS during font load) |
| 6 | `tailwind.config.mjs` | No change needed -- font-family names stay the same |
| 7 | Verify | Check that `font-display: swap` is set in fontsource imports (it is by default) |

### Impact on Other Files

| File | Impact |
|------|--------|
| `src/layouts/EDALayout.astro` | None -- it extends Layout.astro, inherits font changes |
| `src/layouts/GuideLayout.astro` | None -- same inheritance |
| `src/components/beauty-index/OverlayRadarChart.astro` | Has `font-family: Georgia, 'Noto Sans', serif` hardcoded for SVG text -- independent of web fonts |
| `src/styles/global.css` | Greek Fallback `@font-face` uses `src: local('Noto Sans')` -- will work if Noto Sans is loaded via @fontsource |

## Integration Point 4: Sitemap Serialize Hook with Content Collection Dates

### Current Implementation

The sitemap hook lives in `astro.config.mjs` lines 24-116. It uses a **build-time-only** approach:

```javascript
function buildContentDateMap() {
  const map = new Map();
  // Blog: regex-parses MDX frontmatter for publishedDate/updatedDate
  // Guides: reads guide.json for publishedDate + chapter slugs
  return map;
}
const contentDates = buildContentDateMap();
```

**Key design decisions:**
1. Runs at config load time (before Astro's content layer starts)
2. Uses `fs.readFileSync` + regex to parse dates -- does NOT use `getCollection()`
3. Prefers `updatedDate` over `publishedDate` for `lastmod`
4. Omits `lastmod` entirely when no date is known (good practice per Google's guidance)

**Currently handled:**
- Blog posts at `/blog/{slug}/` -- reads `publishedDate` and `updatedDate` from MDX frontmatter
- Guide pages at `/guides/{slug}/` and `/guides/{slug}/{chapter}/` -- reads from `guide.json`

**Not currently handled (missing lastmod):**
- Beauty Index pages at `/beauty-index/{id}/` -- has hardcoded `datePublished: "2026-02-17"` in JSON-LD but not in sitemap
- Beauty Index VS pages at `/beauty-index/vs/{langA}-vs-{langB}/` -- no dates at all
- EDA pages, DB Compass pages, Tools pages -- no dates
- Home page, Contact page -- no dates (appropriate)

### How to Add Beauty Index Dates to Sitemap

**Option 1: Add to `buildContentDateMap()` (RECOMMENDED)**

Since Beauty Index dates are static (they do not change per-language), add a fixed date:

```javascript
// In buildContentDateMap(), after the guides block:
try {
  const biDate = new Date('2026-02-18').toISOString(); // last content update
  const langFile = readFileSync('./src/data/beauty-index/languages.json', 'utf-8');
  const langs = JSON.parse(langFile);
  // Index page
  map.set(`${SITE}/beauty-index/`, biDate);
  // Language detail pages
  for (const lang of langs) {
    map.set(`${SITE}/beauty-index/${lang.id}/`, biDate);
  }
  // VS comparison pages
  for (let i = 0; i < langs.length; i++) {
    for (let j = 0; j < langs.length; j++) {
      if (i === j) continue;
      map.set(`${SITE}/beauty-index/vs/${langs[i].id}-vs-${langs[j].id}/`, biDate);
    }
  }
} catch { /* non-fatal */ }
```

**Option 2: Use the serialize hook's URL pattern matching**

Instead of pre-building a map, detect Beauty Index URLs in the serialize callback:

```javascript
serialize(item) {
  const knownDate = contentDates.get(item.url);
  if (knownDate) {
    item.lastmod = knownDate;
  } else if (item.url.includes('/beauty-index/')) {
    item.lastmod = new Date('2026-02-18').toISOString();
  } else {
    item.lastmod = undefined;
  }
  // ... changefreq/priority logic
}
```

**Recommendation:** Option 1 is more consistent with the existing pattern and makes the date map the single source of truth. Option 2 is simpler but scatters date logic between the map builder and the serialize callback.

### Why Not Use `getCollection()` in the Sitemap Hook

The `buildContentDateMap()` function runs at config load time, before Astro's content layer is initialized. Calling `getCollection()` here would fail because content collections are not available during config resolution. The current regex-parsing approach is intentional -- it avoids this circular dependency.

The Astro team has discussed this limitation in [roadmap discussion #1087](https://github.com/withastro/roadmap/discussions/1087), but no official solution exists for accessing content collections from sitemap config.

### Files to Modify

| File | Change |
|------|--------|
| `astro.config.mjs` | Extend `buildContentDateMap()` with Beauty Index entries |

## Data Flow

### VS Page Generation Flow

```
languages.json
    |
    v
content.config.ts (file loader + languageSchema validation)
    |
    v
getStaticPaths() in vs/[slug].astro
    |  (generates 650 {params, props} pairs)
    v
[slug].astro template
    |  (imports: Layout, BreadcrumbJsonLd, VsJsonLd,
    |   OverlayRadarChart, TierBadge, DIMENSIONS, etc.)
    v
Static HTML at /beauty-index/vs/{langA}-vs-{langB}/
```

### Font Loading Flow (Current)

```
Browser requests page
    |
    v
HTML <head> with preconnect + preload hints
    |
    v
fonts.googleapis.com CSS (render-blocking if onload fails)
    |  (fetches CSS with @font-face rules pointing to fonts.gstatic.com)
    v
fonts.gstatic.com woff2 files
    |
    v
Fallback @font-face (Arial with size-adjust) used until swap
```

### Font Loading Flow (After @fontsource migration)

```
Browser requests page
    |
    v
HTML <head> with inline <style> from Astro's CSS bundler
    |  (fontsource CSS is imported in Layout.astro, bundled by Vite)
    v
/_astro/*.woff2 served from same origin (self-hosted)
    |  (no external network requests, no CORS, no CSP complications)
    v
Fallback @font-face (Arial with size-adjust) used until swap
```

### Sitemap Generation Flow

```
Build starts
    |
    v
buildContentDateMap() runs at config load
    |  (reads blog/*.mdx frontmatter + guides/guide.json via fs)
    v
contentDates Map<string, string> populated
    |
    v
@astrojs/sitemap integration runs after page generation
    |  (receives all generated URLs)
    v
filter() removes /404
    |
    v
serialize() for each URL:
    |  (looks up contentDates, sets lastmod/changefreq/priority)
    v
sitemap-0.xml written to dist/
```

## Recommended Build Order

Based on dependency analysis, implement SEO fixes in this order:

### Phase 1: Font Migration (no dependencies, high impact)
1. Install @fontsource packages
2. Update Layout.astro imports
3. Update CSP meta tag
4. Verify build + visual regression

**Rationale:** This is self-contained -- only Layout.astro changes. Eliminates external font dependency, improves TTFB, and simplifies CSP. No other fix depends on this.

### Phase 2: Sitemap Dates (no dependencies, low risk)
1. Extend `buildContentDateMap()` in astro.config.mjs
2. Verify sitemap output includes correct lastmod values

**Rationale:** Single file change, mechanical addition following existing patterns. Independent of other fixes.

### Phase 3: VS Page Content (depends on content decisions)
1. Add rich content sections to `vs/[slug].astro`
2. Update VsJsonLd.astro if adding FAQ or structured data
3. Verify generated pages render correctly

**Rationale:** May require content writing/generation for 650 pages. Template changes are straightforward but content decisions take longer.

### Phase 4: CSS Audit (optional, depends on measurement)
1. Run build with `rollup-plugin-visualizer` to measure CSS chunk sizes
2. Identify oversized chunks
3. Split global.css if warranted
4. Consider `astro-purgecss` if unused rules are significant

**Rationale:** This is optimization, not a fix. Measure first, act only if the data warrants it.

## Anti-Patterns

### Anti-Pattern 1: Using Imported CSS in New Components

**What people do:** Create a new `.css` file and import it in a component
**Why it's wrong:** The CSS ships to every page that imports the component, even if the component is conditionally rendered. In a site with 1,184 pages, this multiplies fast.
**Do this instead:** Use `<style>` tags in `.astro` components (auto-scoped) or Tailwind utility classes

### Anti-Pattern 2: Using `getCollection()` in astro.config.mjs

**What people do:** Try to call `getCollection()` in the sitemap serialize hook
**Why it's wrong:** Content collections are not initialized at config load time. The call will fail or return undefined.
**Do this instead:** Use `fs.readFileSync` with regex parsing, as the current `buildContentDateMap()` does

### Anti-Pattern 3: Hardcoding Dates in JSON-LD but Not in Sitemap

**What people do:** Add `datePublished`/`dateModified` to JSON-LD schemas on the page, but forget to add the same dates to the sitemap's `lastmod`
**Why it's wrong:** Google sees conflicting signals -- structured data says one thing, sitemap says nothing. This reduces trust in both signals.
**Do this instead:** Maintain a single source of truth for content dates (the `contentDates` map) and use it for both sitemap and JSON-LD

### Anti-Pattern 4: Switching to Experimental Astro APIs for Production Sites

**What people do:** Adopt `experimental.fonts` in production
**Why it's wrong:** Experimental flags can change or be removed in minor versions. For a site with 1,184 pages that needs stable builds, this adds unnecessary risk.
**Do this instead:** Use stable @fontsource npm packages with direct imports

## Sources

- [Astro Styles and CSS documentation](https://docs.astro.build/en/guides/styling/) -- CSS scoping, code-splitting, import behavior
- [Astro CSS graph traversal issue #16115](https://github.com/withastro/astro/issues/16115) -- Cross-route CSS leak bug and fix
- [Astro Using Custom Fonts guide](https://docs.astro.build/en/guides/fonts/) -- Font integration options including Fontsource
- [Astro Experimental Fonts API](https://docs.astro.build/en/reference/experimental-flags/fonts/) -- experimental.fonts flag (Astro 5.7+)
- [@astrojs/sitemap integration guide](https://docs.astro.build/en/guides/integrations-guide/sitemap/) -- serialize hook API, SitemapItem interface
- [Astro Roadmap Discussion #1087](https://github.com/withastro/roadmap/discussions/1087) -- getCollection in sitemap limitations
- [Adding accurate lastmod to Astro sitemap](https://www.printezisn.com/blog/post/adding-accurate-lastmod-tags-to-your-astro-sitemap/) -- Community pattern for content-driven lastmod
- Direct codebase analysis of all referenced source files (HIGH confidence)

---
*Architecture research for: SEO audit fixes integration into Astro 5 portfolio site*
*Researched: 2026-04-15*
