# Infrastructure & SEO Review

## Summary

The EDA Visual Encyclopedia infrastructure is well-architected with a clean separation between layout components, route configuration, SEO metadata, and content rendering. The site uses a layered layout system (Layout.astro -> EDALayout.astro -> TechniquePage/DistributionPage), centralized route helpers, dynamic OG image generation, and proper breadcrumb/JSON-LD structured data. The majority of the implementation is deployment-ready.

**Issues found:** 3 Major, 6 Minor, 0 Critical.

No critical deployment blockers were identified. The major issues involve incorrect breadcrumb URLs, a missing CategoryFilter option, and a broken OG image path for quantitative technique pages. All are fixable without architectural changes.

---

## Index Pages Review

### Main EDA Hub (`src/pages/eda/index.astro`)

**Status: Good**

- Aggregates all content collections (`edaTechniques`, `edaDistributions`, `edaPages`) correctly.
- Cards are grouped into 6 sections with proper `data-category` attributes for filtering.
- Section navigation with anchor links (`#foundations`, `#techniques`, etc.) works correctly.
- "View all" links per section route to the correct index pages.
- Hero SVG generated at build time via `generateEdaHeroSvg()`.
- Companion blog post link points to `/blog/eda-visual-encyclopedia/` -- correct.
- `CategoryFilter` React component hydrated via `client:visible`.
- JSON-LD uses `@type: "Dataset"` for the overview page (via `isOverview` flag) -- appropriate.

**No issues found.**

### Case Studies Index (`src/pages/eda/case-studies/index.astro`)

**Status: Good**

- Filters `edaPages` collection for `category === 'case-studies'`.
- Sorts by section number using `localeCompare` with `numeric: true`.
- Slug extraction: `page.id.replace('case-studies/', '')` -- matches the pattern used in routes.ts `caseStudyUrl()`.
- Description claims "10 worked EDA case studies" and there are exactly 10 `.mdx` files in `src/data/eda/pages/case-studies/`.
- BreadcrumbJsonLd has correct 3-level hierarchy.
- OG image points to `/open-graph/eda/overview.png` (shared) -- acceptable.

**No issues found.**

### Distributions Index (`src/pages/eda/distributions/index.astro`)

**Status: Good**

- Generates PDF thumbnail SVGs at build time for each distribution using `generateDistributionCurve()`.
- Cards link to `distributionUrl(dist.data.slug)` -- correct.
- Uses a 4-column grid for compact thumbnail display.
- OG image points to `/open-graph/eda/distributions.png` -- has a dedicated generator.
- BreadcrumbJsonLd correct.

**No issues found.**

### Foundations Index (`src/pages/eda/foundations/index.astro`)

**Status: Good**

- Filters for `category === 'foundations'`, sorted by section.
- 6 foundation pages confirmed in filesystem.
- BreadcrumbJsonLd correct.
- OG image falls back to `/open-graph/eda/overview.png` (shared).

**No issues found.**

### Quantitative Methods Index (`src/pages/eda/quantitative/index.astro`)

**Status: Good**

- Rich educational content with sections on confirmatory statistics, interval estimates, hypothesis tests, practical vs. statistical significance, and bootstrap methods.
- Groups 18 techniques into 7 categories (Location, Scale, etc.) with section-based filtering.
- Internal links to `/eda/techniques/4-plot/` and `/eda/techniques/bootstrap-plot/` in prose -- valid.
- BreadcrumbJsonLd correct.

**No issues found.**

### Reference Index (`src/pages/eda/reference/index.astro`)

**Status: Good**

- 4 reference pages confirmed in filesystem.
- Standard card grid layout.
- BreadcrumbJsonLd correct.

**No issues found.**

### Techniques Index (`src/pages/eda/techniques/index.astro`)

**Status: Good**

- Generates SVG thumbnails via `generateThumbnail()` for all 29 graphical techniques.
- Uses 4-column grid matching distribution layout style.
- OG image uses shared `/open-graph/eda/overview.png`.
- BreadcrumbJsonLd correct.

**No issues found.**

---

## Layout & Component Review

### EDALayout.astro (`src/layouts/EDALayout.astro`)

**Status: Good**

- Thin wrapper around `Layout.astro` that adds conditional KaTeX CSS loading.
- Props forwarded correctly: title, description, ogImage, ogImageAlt, ogType, publishedDate, updatedDate, tags, useKatex.
- Default `ogType = 'article'` is appropriate for EDA content pages.
- KaTeX CSS loaded via `<link slot="head">` and dark-mode color override via `<style slot="head">`.

**No issues found.**

### Layout.astro (`src/layouts/Layout.astro`)

**Status: Good**

- Comprehensive base layout with security headers (CSP, referrer, permissions policy).
- SEOHead component receives all required props.
- WebSite JSON-LD schema with SearchAction potentialAction.
- RSS, LLM-friendly alternates, Google Fonts, Google Analytics all present.
- `<slot name="head" />` allows child layouts to inject head content (used by EDALayout for KaTeX).
- ClientRouter for View Transitions.
- Skip-to-main-content link present.

**No issues found.**

### EdaBreadcrumb.astro (`src/components/eda/EdaBreadcrumb.astro`)

**Status: Good**

- Maps category labels to index page hrefs via `categoryHrefMap`.
- All 6 categories mapped correctly:
  - `distributions` -> `/eda/distributions/`
  - `foundations` -> `/eda/foundations/`
  - `case-studies` -> `/eda/case-studies/`
  - `reference` -> `/eda/reference/`
  - `graphical-techniques` -> `/eda/techniques/`
  - `quantitative-methods` -> `/eda/quantitative/`
- Falls back to `/eda/` for unrecognized categories.
- Uses semantic `<nav aria-label="Breadcrumb">` with `<ol>`.
- Last crumb (techniqueName) rendered as non-linked `<span>` -- correct.

**No issues found.**

### TechniquePage.astro (`src/components/eda/TechniquePage.astro`)

**Status: Has Issues**

- Named slots: `plot`, `description`, `formula`, `code` -- clean composition.
- Related techniques rendered as pill links.
- BreadcrumbJsonLd and EDAJsonLd generated dynamically.

**MAJOR [M1]: Incorrect OG image path for quantitative technique pages.**

The `ogCategoryMap` on line 28-33 maps `'quantitative-techniques'` to `'quantitative'`, but quantitative pages pass `category="Quantitative Methods"` (from `src/pages/eda/quantitative/[slug].astro:53`). This slugifies to `quantitative-methods`, which is NOT in the map. The fallback on line 33 uses `categorySlug` directly, producing OG paths like `/open-graph/eda/quantitative-methods/{slug}.png`. The actual OG generator at `src/pages/open-graph/eda/[...slug].png.ts` generates paths at `/open-graph/eda/quantitative/{slug}.png`.

**Fix:** Add `'quantitative-methods': 'quantitative'` to the `ogCategoryMap` in TechniquePage.astro.

**MINOR [m1]: categoryHrefMap is incomplete.**

The `categoryHrefMap` on line 20-23 only maps `'graphical-techniques'` and `'distributions'`. For `quantitative-methods`, it falls back to `/eda/`, meaning the breadcrumb JSON-LD `url` for the "Quantitative Methods" crumb points to `/eda/` instead of `/eda/quantitative/`. The visual breadcrumb (via EdaBreadcrumb) works correctly because EdaBreadcrumb has its own complete map. Only the JSON-LD structured data is affected.

**Fix:** Add `'quantitative-methods': '/eda/quantitative/'`, `'case-studies': '/eda/case-studies/'`, `'reference': '/eda/reference/'`, and `'foundations': '/eda/foundations/'` to the `categoryHrefMap`.

### DistributionPage.astro (`src/components/eda/DistributionPage.astro`)

**Status: Good**

- Hardcodes `useKatex={true}` -- correct since all distribution pages use formulas.
- OG image path constructed correctly: `/open-graph/eda/distributions/${slug}.png`.
- BreadcrumbJsonLd points to `/eda/distributions/` for the Distributions crumb -- correct.
- Named slots: `fallback`, `explorer`, `formulas`, `properties`, `description`.

**No issues found.**

### PlotVariantSwap.astro (`src/components/eda/PlotVariantSwap.astro`)

**Status: Good**

- ARIA tablist/tab/tabpanel pattern correctly implemented.
- CSS uses attribute selectors (`[aria-selected="true"]`) -- no Tailwind class toggling.
- Random component ID prevents conflicts when multiple instances on page.
- `data-pvs-init` attribute prevents double-initialization.
- Listens for `astro:page-load` for View Transition compatibility.

**No issues found.**

### PlotFigure.astro (`src/components/eda/PlotFigure.astro`)

**Status: Good**

- Clean figure/figcaption semantic markup.
- Dark mode background: `dark:bg-[#1a1a2e]` -- appropriate for chart backgrounds.
- `not-prose` class prevents Tailwind Typography from interfering.
- Configurable `maxWidth` with sensible default of 720px.

**No issues found.**

### InlineMath.astro (`src/components/eda/InlineMath.astro`)

**Status: Good**

- Renders KaTeX at build time via `katex.renderToString()`.
- Supports both inline (`display: false`) and display mode.
- `throwOnError: false` prevents build failures from malformed LaTeX.

**No issues found.**

### CaseStudyDataset.astro (`src/components/eda/CaseStudyDataset.astro`)

**Status: Good**

- Maps 10 case study slugs to their dataset imports.
- Supports both single-column (number[]) and multi-column (CeramicStrengthObs[]) datasets.
- CSV download via data URI -- works without server.
- Data preview with collapsible details element.
- NIST source link with external link icon.
- Graceful fallback: returns nothing for unknown slugs.

**No issues found.**

### CategoryFilter.tsx (`src/components/eda/CategoryFilter.tsx`)

**Status: Has Issue**

- Uses nanostores for state management with React.
- DOM manipulation for show/hide (data-category attribute matching).
- Toggles both individual cards and section-level visibility.

**MAJOR [M2]: Missing "Foundations" category in filter options.**

The CATEGORIES array on lines 4-11 includes: `all`, `graphical`, `quantitative`, `distributions`, `case-studies`, `reference`. The `foundations` category is missing. This means:
1. Users cannot filter to show only Foundations pages.
2. When any non-"All" filter is active, Foundations pages are hidden with no way to show them.
3. The main EDA hub page (index.astro) renders Foundations cards with `data-category="foundations"` which the filter cannot select.

**Fix:** Add `{ id: 'foundations', label: 'Foundations' }` to the CATEGORIES array, preferably as the second entry (after 'all') to match the section ordering on the page.

### AnscombeQuartetPlot.astro (`src/components/eda/AnscombeQuartetPlot.astro`)

**Status: Good**

- Correct Anscombe's Quartet data (verified against original 1973 paper values).
- Shared regression line y = 3 + 0.5x -- correct for all four datasets.
- Uses d3-scale for coordinate mapping but produces static SVG (no client-side JS).
- Wrapped in PlotFigure for consistent styling.
- Good accessibility: `role="img"` with descriptive `aria-label`.

**No issues found.**

---

## SEO Review

### Meta Tags

**Status: Good**

SEOHead.astro (`src/components/SEOHead.astro`) provides comprehensive meta tags:

- **Primary:** title, description, canonical URL, robots directive, hreflang (en-CA + x-default).
- **Open Graph:** og:type, og:title, og:description, og:url, og:site_name, og:locale, og:image (with width/height/type/alt).
- **Twitter Card:** summary_large_image when ogImage present, otherwise summary. Includes twitter:site and twitter:creator.
- **Article-specific:** published_time, modified_time, tags, author -- conditional on `ogType === 'article'`.

All EDA pages pass through EDALayout -> Layout -> SEOHead, ensuring meta tags are consistently generated.

**MINOR [m2]: EDA pages use `ogType="article"` but do not pass `publishedDate`/`updatedDate` on most index pages.**

Index pages (techniques/index.astro, case-studies/index.astro, etc.) do not pass `publishedDate`, so no `article:published_time` meta tag is emitted despite `ogType` defaulting to `'article'` in EDALayout. Individual content pages (foundations, case-studies, reference, distributions, techniques) do pass `publishedDate={new Date('2026-02-25')}`. This is not a deployment blocker but is technically inconsistent.

### JSON-LD Structured Data

**Status: Good**

Three layers of JSON-LD:

1. **WebSite** (Layout.astro): Global site schema with SearchAction.
2. **BreadcrumbList** (BreadcrumbJsonLd.astro): Used on every EDA page with correct hierarchical paths.
3. **TechArticle/LearningResource or Dataset** (EDAJsonLd.astro):
   - Overview page uses `@type: "Dataset"` with keywords, version, license (CC-BY 4.0).
   - Individual pages use `@type: ["TechArticle", "LearningResource"]` with proficiencyLevel, learningResourceType, educationalLevel.
   - `isBasedOn` links to NIST handbook URLs.
   - Author/publisher reference `#person` entity.

**MAJOR [M3]: Breadcrumb JSON-LD for foundations, case-studies, and reference detail pages incorrectly link category level to `/eda/` instead of their section index.**

In the dynamic route pages:
- `src/pages/eda/foundations/[...slug].astro:40`: `{ name: 'Foundations', url: 'https://patrykgolabek.dev/eda/' }` -- should be `/eda/foundations/`
- `src/pages/eda/case-studies/[...slug].astro:39`: `{ name: 'Case Studies', url: 'https://patrykgolabek.dev/eda/' }` -- should be `/eda/case-studies/`
- `src/pages/eda/reference/[...slug].astro:39`: `{ name: 'Reference', url: 'https://patrykgolabek.dev/eda/' }` -- should be `/eda/reference/`

These breadcrumb JSON-LD crumbs tell search engines that the intermediate category level is the main EDA page, which flattens the site hierarchy in Google's eyes and reduces the SEO value of the section index pages. The visual breadcrumb (EdaBreadcrumb) renders correctly because it has its own href map.

**Fix:** Update the BreadcrumbJsonLd `url` values to point to the actual section index pages.

### Open Graph Images

**Status: Good with one path issue (covered in M1)**

OG image generation infrastructure:
- `src/pages/open-graph/eda/overview.png.ts` -- EDA hub page
- `src/pages/open-graph/eda/distributions.png.ts` -- Distributions section
- `src/pages/open-graph/eda/techniques.png.ts` -- Techniques section
- `src/pages/open-graph/eda/case-studies.png.ts` -- Case Studies section
- `src/pages/open-graph/eda/[...slug].png.ts` -- All individual pages (techniques, quantitative, distributions, foundations, case-studies, reference)

`og-cache.ts` provides MD5-based caching in `node_modules/.cache/og-eda/` with a version-bumped cache key.

**MINOR [m3]: No dedicated OG image generators for Foundations, Quantitative Methods, and Reference section index pages.**

These sections use the generic `overview.png` OG image. Techniques, Distributions, and Case Studies each have their own section-level OG generators. While functional, this reduces visual distinctiveness when these section pages are shared on social media.

**MINOR [m4]: Techniques and Case Studies section index pages reference `overview.png` instead of their dedicated section OG images.**

`src/pages/eda/techniques/index.astro:32` uses `ogImage="/open-graph/eda/overview.png"` when `techniques.png` exists.
`src/pages/eda/case-studies/index.astro:32` uses `ogImage="/open-graph/eda/overview.png"` when `case-studies.png` exists.

**Fix:** Update to `/open-graph/eda/techniques.png` and `/open-graph/eda/case-studies.png` respectively.

---

## Route Configuration Review

### routes.ts (`src/lib/eda/routes.ts`)

**Status: Good**

- 6 route prefixes defined as `const` object.
- 5 URL builder functions: `techniqueUrl`, `distributionUrl`, `foundationUrl`, `caseStudyUrl`, `referenceUrl`.
- All builders append trailing slashes -- correct for static site deployment.
- `techniqueUrl` accepts a `category` parameter to route graphical vs. quantitative techniques to different prefixes.

**Cross-reference verification:**
- `techniqueUrl('histogram', 'graphical')` -> `/eda/techniques/histogram/` -- matches `src/pages/eda/techniques/[slug].astro` route.
- `techniqueUrl('measures-of-location', 'quantitative')` -> `/eda/quantitative/measures-of-location/` -- matches `src/pages/eda/quantitative/[slug].astro` route.
- `distributionUrl('normal')` -> `/eda/distributions/normal/` -- matches `src/pages/eda/distributions/[slug].astro` route.
- `foundationUrl('what-is-eda')` -> `/eda/foundations/what-is-eda/` -- matches `src/pages/eda/foundations/[...slug].astro` route.
- `caseStudyUrl('ceramic-strength')` -> `/eda/case-studies/ceramic-strength/` -- matches `src/pages/eda/case-studies/[...slug].astro` route.
- `referenceUrl('distribution-tables')` -> `/eda/reference/distribution-tables/` -- matches `src/pages/eda/reference/[...slug].astro` route.

All routes verified correct.

### schema.ts (`src/lib/eda/schema.ts`)

**Status: Good**

- Zod schemas for `EdaTechnique` and `EdaDistribution` with proper types and defaults.
- Tier schema (`A`, `B`, `C`) for interactivity levels.
- Distribution parameters properly typed with `name`, `symbol`, `min`, `max`, `default`, `step`.

### og-cache.ts (`src/lib/eda/og-cache.ts`)

**Status: Good**

- MD5 hash with version prefix for cache invalidation.
- 12-character hex hash provides sufficient uniqueness for ~90 pages.
- `stat()` check before `readFile()` for efficient cache lookups.
- `mkdir({ recursive: true })` for safe cache directory creation.
- `getOrGenerateOgImage()` convenience wrapper for use in endpoints.

### thumbnail.ts (`src/lib/eda/thumbnail.ts`)

**Status: Good**

- Delegates to `renderTechniquePlot()` and wraps in fixed-size container.
- Adds `role="img"` and `aria-label` for accessibility.
- Relies on `viewBox` for scaling -- correct approach.

**MINOR [m5]: Title derived from slug uses simple hyphen-to-space replacement.**

`slug.replace(/-/g, ' ')` on line 26 produces lowercase titles like "scatter plot" instead of "Scatter Plot" for the aria-label. This is minor since aria-labels are read aloud, not displayed, but proper casing would be more professional.

---

## Site Integration Review

### Homepage (`src/pages/index.astro`)

**Status: Good**

- EDA Visual Encyclopedia featured as the third "Reference Guide" card alongside Beauty Index and Database Compass.
- Card includes:
  - Build-time hero SVG via `generateEdaHeroSvg({ width: 280, height: 160 })`.
  - "90+ Pages" label.
  - Descriptive text covering all sections.
  - "Explore techniques" CTA linking to `/eda/`.
- Card styling consistent with sibling cards (Beauty Index, Database Compass).

**No issues found.**

### Blog Post (`src/data/blog/eda-visual-encyclopedia.mdx`)

**Status: Good**

- Comprehensive 2000+ word post covering all 6 encyclopedia sections.
- All internal links verified against routes.ts:
  - `/eda/` -- main hub
  - `/eda/foundations/what-is-eda/` -- valid
  - `/eda/foundations/assumptions/` -- valid
  - `/eda/foundations/when-assumptions-fail/` -- valid
  - `/eda/foundations/role-of-graphics/` -- valid
  - `/eda/foundations/the-4-plot/` -- valid
  - `/eda/techniques/4-plot/` -- valid (graphical technique)
  - `/eda/techniques/histogram/` -- valid
  - `/eda/techniques/scatter-plot/` -- valid
  - `/eda/techniques/box-plot/` -- valid
  - `/eda/techniques/autocorrelation-plot/` -- valid
  - `/eda/techniques/normal-probability-plot/` -- valid
  - `/eda/techniques/weibull-plot/` -- valid
  - `/eda/techniques/ppcc-plot/` -- valid
  - `/eda/techniques/star-plot/` -- valid
  - `/eda/techniques/spectral-plot/` -- valid
  - `/eda/techniques/conditioning-plot/` -- valid
  - `/eda/techniques/bootstrap-plot/` -- valid
  - `/eda/techniques/scatterplot-matrix/` -- valid
  - `/eda/techniques/run-sequence-plot/` -- valid
  - `/eda/quantitative/measures-of-location/` -- valid
  - `/eda/quantitative/measures-of-scale/` -- valid
  - `/eda/quantitative/two-sample-t-test/` -- valid
  - `/eda/quantitative/one-factor-anova/` -- valid
  - `/eda/quantitative/multi-factor-anova/` -- valid
  - `/eda/quantitative/bartletts-test/` -- valid
  - `/eda/quantitative/levene-test/` -- valid
  - `/eda/quantitative/f-test/` -- valid
  - `/eda/quantitative/anderson-darling/` -- valid
  - `/eda/quantitative/chi-square-gof/` -- valid
  - `/eda/quantitative/kolmogorov-smirnov/` -- valid
  - `/eda/quantitative/skewness-kurtosis/` -- valid
  - `/eda/quantitative/grubbs-test/` -- valid
  - `/eda/quantitative/runs-test/` -- valid
  - `/eda/distributions/` -- valid
  - `/eda/distributions/normal/` -- valid
  - `/eda/distributions/tukey-lambda/` -- valid
  - `/eda/distributions/fatigue-life/` -- valid
  - `/eda/distributions/weibull/` -- valid
  - `/eda/distributions/chi-square/` -- valid
  - `/eda/case-studies/ceramic-strength/` -- valid
  - `/eda/case-studies/heat-flow-meter/` -- valid
  - `/eda/case-studies/fatigue-life/` -- valid
  - `/eda/case-studies/beam-deflections/` -- valid
  - `/eda/reference/techniques-by-category/` -- valid
  - `/eda/reference/distribution-tables/` -- valid
  - `/eda/reference/related-distributions/` -- valid
  - `/eda/reference/analysis-questions/` -- valid
- Frontmatter: published date 2026-02-25, 6 tags, cover image set, `draft: false`.
- No broken internal links found.

**No issues found.**

### llms.txt (`src/pages/llms.txt.ts`)

**Status: Good**

- Imports all EDA route builders from `routes.ts`.
- Enumerates all 5 EDA content types: graphical techniques, quantitative methods, distributions, foundations, case studies, reference.
- Each entry includes title, full URL, and description.
- Slug extraction uses the same `page.id.replace()` pattern as the route pages.
- EDA section properly positioned after Database Compass, before Blog Posts.
- Correct page counts: "29 pages" for graphical, "18 pages" for quantitative, "19 interactive pages" for distributions, "6 pages" for foundations, "9 pages" for case studies, "4 pages" for reference.

**MINOR [m6]: Case studies count says "9 pages" but there are 10 case study `.mdx` files.**

The `llms.txt.ts` header says "### Case Studies (9 pages)" on line 170, but the filesystem contains 10 case study pages (beam-deflections, ceramic-strength, cryothermometry, fatigue-life, filter-transmittance, heat-flow-meter, normal-random-numbers, random-walk, standard-resistor, uniform-random-numbers). Similarly, the case-studies OG image says "9 Case Studies" in `case-studies.png.ts`. The actual card grid will show all 10 since it reads from the collection.

**Fix:** Update the count to "10 pages" in llms.txt.ts and "10 Case Studies" in the OG image generator.

---

## Cross-Cutting Issues

1. **Content collection consistency:** All dynamic route pages use `getCollection()` and filter by category. Slug extraction is consistent across all routes (`page.id.replace('${category}/', '')`). No mismatches found.

2. **View Transition compatibility:** PlotVariantSwap listens for `astro:page-load`. DistributionExplorer uses `client:visible`. Both approaches are View Transition safe.

3. **Accessibility:** All SVG plots use `role="img"` with descriptive `aria-label`. Breadcrumb uses `aria-label="Breadcrumb"`. TabList uses proper ARIA roles. Skip-to-main-content link present in Layout.astro.

4. **Performance:** Build-time SVG generation for techniques and distribution thumbnails. KaTeX rendered at build time. D3 isolated to distribution pages via `client:visible`. CSS-only dark mode via custom properties. KaTeX CSS conditionally loaded.

5. **SEO architecture:** Every EDA page has: canonical URL, OG tags, Twitter card, JSON-LD (BreadcrumbList + TechArticle/LearningResource), and hreflang tags. The llms.txt endpoint provides machine-readable discovery. The blog post provides extensive internal linking for PageRank distribution.

---

## Severity Summary

- **Critical: 0**
- **Major: 3**
  - [M1] Quantitative technique OG image path broken due to `ogCategoryMap` mismatch in TechniquePage.astro
  - [M2] CategoryFilter missing "Foundations" option -- Foundations section hidden when any filter is active
  - [M3] Breadcrumb JSON-LD for foundations, case-studies, and reference detail pages points category crumb to `/eda/` instead of section index
- **Minor: 6**
  - [m1] TechniquePage.astro `categoryHrefMap` incomplete for breadcrumb JSON-LD URLs
  - [m2] Index pages missing `publishedDate`/`updatedDate` despite `ogType="article"`
  - [m3] No dedicated OG images for Foundations, Quantitative, Reference section indexes
  - [m4] Techniques and Case Studies index pages reference `overview.png` instead of their dedicated section OG images
  - [m5] Thumbnail aria-labels use lowercase slug-derived titles
  - [m6] Case study count says "9" in llms.txt and OG image but 10 case studies exist
