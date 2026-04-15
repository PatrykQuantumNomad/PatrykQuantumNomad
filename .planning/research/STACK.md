# Stack Research: v1.21 SEO Audit Fixes

**Domain:** SEO audit fixes for Astro 5 portfolio site (self-hosted fonts, sitemap lastmod, VS page enrichment, CSS investigation)
**Researched:** 2026-04-15
**Confidence:** HIGH

---

## Recommended Stack Additions

### 1. Self-Hosted Fonts via @fontsource

Use **static** @fontsource packages (not variable, not Astro's experimental Fonts API) to replace the Google Fonts CDN `<link>` tags.

| Package | Version | Purpose | Why |
|---------|---------|---------|-----|
| `@fontsource/bricolage-grotesque` | 5.2.10 | Heading font (700, 800 weights) | Eliminates DNS/TLS round-trip to fonts.googleapis.com + fonts.gstatic.com. Static packages produce per-weight CSS files that tree-shake cleanly. |
| `@fontsource/dm-sans` | 5.2.8 | Body font (400, 500, 700 weights) | Same CDN elimination. DM Sans is the primary body typeface used across the entire site. |
| `@fontsource/fira-code` | 5.2.7 | Monospace font (400 weight) | Used in `.meta-mono` class and code contexts. Only weight 400 needed. |
| `@fontsource/noto-sans` | 5.2.10 | Greek character fallback (400, 700 weights) | Used exclusively for Greek glyphs (U+0370-03FF) in Beauty Index dimension symbols. Default import includes unicode-range subsetting automatically. |

**Why static packages over @fontsource-variable:**

Variable font packages change the CSS `font-family` name to `"[Font] Variable"` (e.g., `"DM Sans Variable"`, `"Bricolage Grotesque Variable"`). This would require updating:
- `tailwind.config.mjs` font-family definitions
- `src/styles/global.css` fallback `@font-face` declarations
- `src/styles/global.css` `.meta-mono` class
- Any component with hardcoded font-family references

Static packages use the **exact same font-family names** already in the codebase (`"DM Sans"`, `"Bricolage Grotesque"`, `"Fira Code"`, `"Noto Sans"`). Zero CSS changes needed beyond removing the Google Fonts `<link>` tags and adding imports.

Variable fonts also ship unused weight ranges (DM Sans Variable includes weights 100-900 when we only use 400/500/700), adding ~30-50KB of unused font data per family.

**Why NOT Astro's experimental Fonts API:**

Astro's `experimental.fonts` was introduced in Astro 5.7 and is available on the project's installed Astro 5.17.1. However:
- Still experimental with breaking changes between 5.16.x and 5.17.0 (PR #15213 redesigned the config format)
- Open bugs: fallback font stacks not outputting correctly (#16127), too-many-builds issue (#16007), dev server creating spurious `dist_astro/fonts` directory (#15091)
- Requires wrapping font config in `astro.config.mjs` experimental block + learning a new API
- The direct `@fontsource` import approach is battle-tested, simpler, and produces identical results

The Fonts API became stable in Astro 6.0.0 (not installed). When the project upgrades to Astro 6, migrating to the built-in provider would be appropriate.

### 2. Sitemap lastmod Enhancement

**No new packages needed.** The existing `@astrojs/sitemap` v3.7.0 (latest: 3.7.2) already has the `serialize` hook with full `lastmod` support. The project already uses `serialize()` in `astro.config.mjs` for blog and guide pages.

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| `@astrojs/sitemap` | 3.7.0 (installed) | Sitemap generation with serialize hook | Already handles blog + guide lastmod. Needs extension, not replacement. |

**What needs to change (code, not dependencies):**

The existing `buildContentDateMap()` function in `astro.config.mjs` only populates dates for:
- Blog posts (from frontmatter `publishedDate`/`updatedDate`)
- Guide pages (from `guide.json` metadata)

To cover all 1,184 pages, extend `buildContentDateMap()` to include:

1. **Beauty Index pages (~678 pages):** All are generated from `languages.json` which has no dates. Use a single hardcoded date (the date the Beauty Index was published or last updated). This applies to `/beauty-index/`, `/beauty-index/[lang]/`, `/beauty-index/vs/[a]-vs-[b]/`, `/beauty-index/justifications/`, and `/beauty-index/code/`.

2. **DB Compass pages:** Similar static data, use hardcoded publish date.

3. **EDA pages:** Similar static data, use hardcoded publish date. Notebooks have `publishedDate` in frontmatter.

4. **AI Landscape pages (~12 VS pages + hub):** Use hardcoded publish date.

5. **Tools pages:** Use hardcoded publish date.

6. **Static pages (home, about, projects, etc.):** Use build date or a manually maintained date.

**Serialize hook API reference (confirmed v3.7.2):**

```typescript
serialize?: (item: SitemapItem) => SitemapItem | Promise<SitemapItem | undefined> | undefined

interface SitemapItem {
  url: string;                         // required, absolute URL
  lastmod?: string | undefined;        // ISO formatted date string
  changefreq?: ChangeFreqEnum | undefined;
  priority?: number | undefined;
  links?: LinkItem[] | undefined;
}
```

The existing serialize function already sets `changefreq` and `priority` by URL pattern. Adding lastmod fallbacks is a matter of extending the `else` branch (line 85 in current config) to set a date instead of `undefined`.

### 3. VS Comparison Page Content Enrichment

**No new libraries needed.** The enrichment is a build-time template enhancement, not a runtime feature.

| Approach | What | Why |
|----------|------|-----|
| Build-time data derivation | Compute comparative analysis from existing `Language` data at build time in `[slug].astro` | All 26 languages already have: year, paradigm, characterSketch, 6 dimension scores, tier. Enough data to generate 500+ unique words per pairing. |

**Content enrichment strategy (no new packages):**

The existing VS page template (`src/pages/beauty-index/vs/[slug].astro`) currently renders:
- Header with scores (1 sentence)
- Radar chart (visual only)
- Verdict (1 sentence)
- Dimension breakdown table (structured data)
- Character sketches (2 paragraphs, copied from single-language pages)

To reach 500+ unique words, add these **computed sections** using existing data:

1. **Strengths & Weaknesses Analysis** (~150 words): For each language, compute which dimensions are above/below the tier average. Generate sentences like "Python's highest-scoring dimension is Practitioner Happiness (10/10), which exceeds the Beautiful tier average of 8.5."

2. **Dimension Deep-Dives** (~200 words): For each of the 6 dimensions, generate a comparison paragraph. The dimension metadata (`DIMENSIONS[].description`) plus the delta computation already in the template provides the raw material: "In Aesthetic Geometry, Python scores 9/10 compared to Ruby's 9/10 -- a tie. Both languages prioritize visual cleanliness and grid-based order."

3. **Paradigm & Era Context** (~100 words): Both languages have `year` and `paradigm` fields. Generate: "Python (1991, multi-paradigm) predates Ruby (1995, object-oriented) by 4 years. Despite emerging in the same decade, they evolved different aesthetic philosophies."

4. **Related Comparisons** (~50 words): Link to reverse comparison and other popular pairings involving the same languages. Internal linking that also adds word count.

**Key insight:** Every comparison is mathematically unique because no two language pairs have identical score vectors. The 6 dimension scores, 2 paradigms, 2 years, 2 tiers, and 2 character sketches create sufficient entropy for 650 genuinely unique pages.

### 4. CSS Code-Splitting Investigation

**No new production packages needed.** Investigation tooling only.

| Tool | Version | Purpose | When to Use |
|------|---------|---------|-------------|
| `rollup-plugin-visualizer` | 7.0.0 (already installed as devDep) | Bundle size analysis | Run `npx vite-bundle-visualizer` after build to identify CSS chunk sizes |
| `astro-purgecss` | 6.0.1 | Remove unused CSS from final HTML | **Evaluate only** -- Tailwind v3 already JIT-compiles only used utilities, but non-Tailwind CSS (global.css custom rules, component `<style>` blocks) may have dead rules |

**Built-in Astro CSS handling (no package needed):**

Astro already:
- Minifies and combines CSS into per-page chunks at build time
- Splits shared CSS into reusable chunks across pages
- Inlines CSS under 4KB as `<style>` tags, links CSS over 4KB as `<link rel="stylesheet">`
- Configurable via `build.inlineStylesheets` (`'auto'` | `'always'` | `'never'`) and `build.assetsInlineLimit`

**Investigation approach for the 132KB homepage CSS:**

1. Build the site and inspect the output CSS files in `dist/`
2. Use the already-installed `rollup-plugin-visualizer` to see which CSS chunks are large
3. Check if Tailwind utility classes from non-homepage components are leaking into the shared chunk
4. Evaluate whether `astro-purgecss` removes meaningful dead CSS (test build size before/after)
5. Consider moving heavy component styles from global scope to component-scoped `<style>` tags

**What NOT to do:** Do not set `vite.build.cssCodeSplit = false` -- this was confirmed as breaking all CSS in Astro builds (GitHub issue #4413).

---

## Installation

```bash
# Font self-hosting (production dependencies -- CSS is imported at build time)
npm install @fontsource/bricolage-grotesque @fontsource/dm-sans @fontsource/fira-code @fontsource/noto-sans

# CSS investigation (dev dependency, evaluate then remove if not useful)
npm install -D astro-purgecss
```

---

## Integration Points

### Font Integration

**In `src/layouts/Layout.astro`:**

Remove these lines (116-128):
```html
<!-- DELETE: Google Fonts CDN -->
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link rel="preload" href="https://fonts.googleapis.com/css2?..." as="style" ... />
<noscript><link href="https://fonts.googleapis.com/css2?..." rel="stylesheet" /></noscript>
```

Add imports in the frontmatter section:
```typescript
// Self-hosted fonts (replaces Google Fonts CDN)
import '@fontsource/bricolage-grotesque/700.css';
import '@fontsource/bricolage-grotesque/800.css';
import '@fontsource/dm-sans/400.css';
import '@fontsource/dm-sans/500.css';
import '@fontsource/dm-sans/700.css';
import '@fontsource/fira-code/400.css';
import '@fontsource/noto-sans/400.css';
import '@fontsource/noto-sans/700.css';
```

**In `src/layouts/Layout.astro` CSP meta tag (line 78):**

Remove `https://fonts.googleapis.com` from `style-src` and `connect-src`.
Remove `https://fonts.gstatic.com` from `font-src` and `connect-src`.
Add `'self'` to `font-src` (fonts now served from same origin).

Updated CSP directives:
```
style-src 'self' 'unsafe-inline';
font-src 'self';
connect-src 'self' blob: https://www.google-analytics.com https://www.googletagmanager.com;
```

**In `tailwind.config.mjs`:** No changes needed. Font-family names remain identical.

**In `src/styles/global.css`:** No changes needed. Fallback `@font-face` declarations and font-family references remain valid.

**Noto Sans unicode-range:** The `@fontsource/noto-sans` default CSS import already includes `unicode-range` definitions for automatic subset loading. The existing `@font-face` declarations in `global.css` for `'Greek Fallback'` (lines 60-75) that reference `local('Noto Sans')` will now resolve to the self-hosted font files instead of requiring the browser to find a system-installed Noto Sans. This is an improvement in reliability.

### Sitemap Integration

**In `astro.config.mjs` `buildContentDateMap()` function:**

Extend to cover all content types. For pages without frontmatter dates, use section-level publication dates. Example approach:

```typescript
// Section-level dates for content without per-page dates
const SECTION_DATES: Record<string, string> = {
  '/beauty-index/': '2025-10-15',     // Beauty Index launch date
  '/db-compass/':   '2025-08-20',     // DB Compass launch date
  '/eda/':          '2025-11-10',     // EDA launch date
  '/ai-landscape/': '2026-01-15',    // AI Landscape launch date
  '/tools/':        '2025-07-01',     // Tools section launch date
};
```

Then in `serialize()`, after the existing `contentDates.get()` check, fall back to section dates:

```typescript
if (knownDate) {
  item.lastmod = knownDate;
} else {
  // Fall back to section-level dates
  const sectionDate = Object.entries(SECTION_DATES)
    .find(([prefix]) => item.url.includes(prefix))?.[1];
  if (sectionDate) {
    item.lastmod = new Date(sectionDate).toISOString();
  }
  // Pages with no date still omit lastmod (better than a fake date)
}
```

---

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|------------------------|
| `@fontsource/[font]` static packages | `@fontsource-variable/[font]` variable packages | When you need arbitrary weights (e.g., weight 350, 450). The project uses only fixed weights (400, 500, 700, 800) so variable fonts add unnecessary bytes and require CSS changes. |
| `@fontsource/[font]` static packages | Astro `experimental.fonts` API | When the project upgrades to Astro 6.0.0 where the API is stable. Not now -- still experimental on Astro 5.x with known bugs. |
| `@fontsource/[font]` static packages | `astro-font` npm package | When you want a single integration that handles preloading and fallback font generation. However, it adds another abstraction layer over what is fundamentally 8 CSS import statements. |
| `@fontsource/[font]` static packages | Manual font file download (woff2 files) | When you need absolute control over font files or fontsource packages are unavailable. More maintenance burden with no benefit. |
| Extend `buildContentDateMap()` | `astro-sitemap` (community fork) | When you need features beyond what `@astrojs/sitemap` provides (e.g., i18n sitemap). Not needed here -- the official integration's `serialize` hook is sufficient. |
| Build-time computed sections in `[slug].astro` | External CMS or AI-generated content | When programmatic content derivation from structured data is insufficient. Here, the data model is rich enough (6 scores + year + paradigm + tier + characterSketch per language) to generate genuinely unique 500+ word comparisons. |

---

## What NOT to Add

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| `@fontsource-variable/*` packages | Changes font-family CSS names, ships unused weight data, requires updating tailwind.config + global.css | `@fontsource/*` static packages (same font-family names) |
| `astro experimental.fonts` | Breaking changes between minor versions, 7+ open bugs, requires Astro 6 for stability | Direct `@fontsource` CSS imports |
| `vite.build.cssCodeSplit = false` | Confirmed to break all CSS in Astro (issue #4413) | Astro's default CSS splitting + investigation |
| AI/LLM content generation libraries | Adds build-time API dependency, cost, non-determinism for content that can be computed deterministically | Pure TypeScript build-time computation from existing Language data |
| `google-webfonts-helper` | Deprecated project, last updated 2023. Fontsource supersedes it. | `@fontsource/*` packages |
| Additional content/CMS libraries for VS enrichment | Overengineers what is fundamentally string interpolation with structured data | Template-level Astro component logic |

---

## Version Compatibility

| Package | Compatible With | Notes |
|---------|-----------------|-------|
| `@fontsource/bricolage-grotesque@5.2.10` | Astro 5.x, Vite 6.x | CSS imports handled by Vite at build time. No runtime dependency. |
| `@fontsource/dm-sans@5.2.8` | Astro 5.x, Vite 6.x | Same as above. |
| `@fontsource/fira-code@5.2.7` | Astro 5.x, Vite 6.x | Same as above. |
| `@fontsource/noto-sans@5.2.10` | Astro 5.x, Vite 6.x | Same as above. |
| `@astrojs/sitemap@3.7.0` | Astro 5.x | Already installed. `serialize` hook stable since v1.0. |
| `astro-purgecss@6.0.1` | Astro 5.x | Dev-only. Test compatibility with Tailwind v3 JIT output. |

---

## Build Impact Assessment

| Change | Build Time Impact | Output Size Impact |
|--------|-------------------|-------------------|
| Font self-hosting | Negligible (CSS imports resolved at build) | +~120KB of woff2 font files in `dist/` (offset by removing 2 external DNS lookups + TLS handshakes + render-blocking CSS download) |
| Sitemap lastmod extension | Negligible (string interpolation in serialize hook) | +~20KB in sitemap XML (1,184 `<lastmod>` elements) |
| VS page enrichment | Moderate (650 pages x additional string computation) | +~300KB total across 650 pages (~500 words x 650 pages) |
| CSS investigation | Zero (dev-only analysis) | Potential 10-50KB reduction if dead CSS found |

**Net performance impact:** Positive. Removing 2 external domain connections (fonts.googleapis.com + fonts.gstatic.com) eliminates 2 DNS lookups, 2 TLS handshakes, and 1 render-blocking CSS download. Font files served from same origin benefit from existing HTTP/2 connection.

---

## Sources

- [Fontsource: Bricolage Grotesque Install](https://fontsource.org/fonts/bricolage-grotesque/install) -- package names, weights, import syntax (HIGH confidence)
- [Fontsource: DM Sans Install](https://fontsource.org/fonts/dm-sans/install) -- package names, static vs variable (HIGH confidence)
- [Fontsource: Fira Code Install](https://fontsource.org/fonts/fira-code/install) -- package names, version (HIGH confidence)
- [Fontsource: Noto Sans Install](https://fontsource.org/fonts/noto-sans/install) -- subsets, unicode-range (HIGH confidence)
- [Fontsource: Individual Subsets](https://fontsource.org/docs/getting-started/subsets) -- default unicode-range behavior, explicit subset imports (HIGH confidence)
- [Fontsource: Variable Fonts](https://fontsource.org/docs/getting-started/variable) -- font-family name changes for variable packages (HIGH confidence)
- [npm registry](https://registry.npmjs.org) -- version verification via `npm view` (HIGH confidence)
- [@astrojs/sitemap docs](https://docs.astro.build/en/guides/integrations-guide/sitemap/) -- serialize hook API, SitemapItem type, v3.7.2 (HIGH confidence)
- [Astro Styling docs](https://docs.astro.build/en/guides/styling/) -- CSS code splitting, 4KB threshold, inlineStylesheets config (HIGH confidence)
- [Astro Experimental Fonts API](https://docs.astro.build/en/reference/experimental-flags/fonts/) -- added in Astro 5.7, stable in 6.0.0 (HIGH confidence)
- [Astro Font Provider Reference](https://docs.astro.build/en/reference/font-provider-reference/) -- provider API requires Astro 6.0.0 (HIGH confidence)
- [GitHub issue #15515](https://github.com/withastro/astro/issues/15515) -- experimental fonts API breaking changes 5.16->5.17 (HIGH confidence)
- [GitHub issue #4413](https://github.com/withastro/astro/issues/4413) -- cssCodeSplit=false breaks Astro (HIGH confidence)
- [astro-purgecss npm](https://www.npmjs.com/package/astro-purgecss) -- v6.0.1 for unused CSS removal (MEDIUM confidence)

---
*Stack research for: v1.21 SEO Audit Fixes*
*Researched: 2026-04-15*
