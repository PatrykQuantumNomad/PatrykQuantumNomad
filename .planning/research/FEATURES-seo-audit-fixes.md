# Feature Research: SEO Audit Fixes

**Domain:** Technical portfolio site SEO remediation
**Researched:** 2026-04-15
**Confidence:** HIGH

## Feature Landscape

This research covers six fix categories identified by the site's SEO audit. Each category
is analyzed for table stakes, differentiators, and anti-features.

---

### Category 1: VS Page Content Enrichment (650 pages, ~192 words each)

**Risk level:** CRITICAL -- Google's Helpful Content system flags sites where >32% of
pages have <500 words. The 650 VS pages represent ~55% of total site pages (1,184 URLs).
With ~192 words each, these are squarely in thin-content territory. Google's March 2024
core update specifically targets "scaled content abuse" -- pages that are templated with
minimal variation for the purpose of ranking rather than helping users.

**Current content per VS page:** Overlay radar chart, 1-sentence verdict, 6-row dimension
breakdown table (scores + visual bars + delta), two character sketches (~40-60 words each),
methodology link.

**Existing data available for enrichment (already in codebase):**
- Per-dimension justifications (JUSTIFICATIONS object) -- editorial reasoning for each score
- 10 code feature categories with per-language snippets (code-features.ts)
- Signature code snippets per language (snippets.ts)
- Language metadata: year, paradigm, tier, character sketch
- 6 dimension definitions with descriptions (dimensions.ts)

#### Table Stakes (Must-Have for Non-Thin Pages)

| Feature | Why Expected | Complexity | Dependencies |
|---------|--------------|------------|--------------|
| Per-dimension justification prose | Users landing on "Python vs Rust" expect to understand *why* scores differ, not just see numbers. The JUSTIFICATIONS data already exists -- it just needs rendering on VS pages | LOW | `justifications.ts` data exists; needs template changes to `[slug].astro` only |
| Expanded verdict paragraph | Current verdict is 1 sentence. Comparison pages need 2-3 sentences explaining the overall story: who wins, where, and what it means for different use cases | LOW | Computed from existing dimension data at build time |
| Code comparison snippet (1 feature) | The single most requested element on programming language comparison pages. A side-by-side "Hello World" or variable declaration shows rather than tells | MEDIUM | `code-features.ts` has 10 feature categories with 26 languages. Needs a curated selection per pair, syntax highlighting via Shiki (already configured) |
| Year/paradigm metadata display | Context for "why these scores differ" -- a 1991 dynamic language vs a 2012 systems language invites different expectations. Currently in data but not shown on VS pages | LOW | `year` and `paradigm` fields exist on Language schema |

#### Differentiators (Make Pages Genuinely Valuable)

| Feature | Value Proposition | Complexity | Dependencies |
|---------|-------------------|------------|--------------|
| Multi-feature code comparison tabs | Show 2-3 code features (e.g., Variable Declaration, Pattern Matching, Error Handling) in a tabbed interface. This is the content pattern that top comparison sites (hackr.io, Real Python) use at 2,000-2,500 words. Each feature adds ~100-200 words of unique content per page | MEDIUM-HIGH | 10 feature categories exist in `code-features.ts`. Need tab component (likely client:visible React or vanilla JS). Must handle missing languages (some features undefined for certain languages) |
| Dimension "who wins and why" narrative | For each of the 6 dimensions, render a 1-2 sentence comparison: "Python scores 9 in Clarity because [justification excerpt]; Rust scores 8 because [justification excerpt]." This automatically generates ~150-250 unique words per page from existing data | MEDIUM | Requires extracting and comparing justification text for both languages per dimension. Template logic, no new data needed |
| FAQ section (3-5 questions) | Programmatic FAQ generation: "Which is better for beginners?", "Which has better performance?", "Which is more popular?" mapped to dimension scores. Adds ~100 words and triggers FAQ rich result schema | MEDIUM | Can be generated from existing dimension data (psi=happiness ~ "beginner-friendliness", sigma=integrity ~ "design philosophy"). Needs FAQPage JSON-LD component (already exists in codebase) |
| "See also" cross-links | Link to both individual language pages + related VS pairs (e.g., Python-vs-Rust links to Python-vs-Go and Rust-vs-Go). Strengthens internal linking topology for 650 pages | LOW | Computed from language list at build time. No new data needed |

#### Anti-Features (Do NOT Build)

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| AI-generated prose narratives | Tempting to use LLM to generate unique comparison essays per page | Google explicitly targets AI-generated "filler content that artificially inflates content." 650 AI-generated essays would trigger scaled content abuse detection. Also violates EEAT (Experience, Expertise) | Use the existing human-written justifications data -- it already exists and is genuine editorial content |
| Benchmark performance data | Users expect "which is faster" -- tempting to add TIOBE/benchmark data | Benchmark data changes frequently, requires maintenance across 650 pages, and is easily outdated. Also risks accuracy claims without sources | Link to external benchmark sources. Use the existing "Happiness" dimension (psi) and character sketch to address this qualitatively |
| User comments/ratings | Interactive comparison pages often add user voting | Requires server-side infrastructure on a static site. Adds moderation burden. For a portfolio site, adds no SEO value | The character sketches already provide opinionated editorial voice |
| All 10 code features on every page | Maximum content = maximum words | Page becomes overwhelming. Users scanning for Python-vs-Rust don't want to scroll through 10 code comparisons. Also slows page load significantly with syntax highlighting | Show 2-3 most differentiating features. Link to `/beauty-index/code/` for the full matrix |

#### Content Budget Analysis

| Content Element | Estimated Words | Source | New Data Required? |
|-----------------|----------------|--------|-------------------|
| Current page content | ~192 | Existing | No |
| Per-dimension justifications (6 dims x 2 langs) | ~180-300 | `justifications.ts` | No |
| Expanded verdict | ~50-80 | Computed | No |
| Year/paradigm context line | ~15-20 | `languages.json` | No |
| 2 code feature comparisons | ~80-120 (labels + context) | `code-features.ts` | No |
| FAQ section (3 questions) | ~90-120 | Generated from scores | No |
| Cross-links section | ~30-40 | Computed | No |
| **Total estimated per page** | **~640-870** | -- | **No new data needed** |

This brings pages comfortably above the 500-word threshold using entirely existing data.
No new content authoring required.

---

### Category 2: Blog Meta Tag Fixes (Dark Code Post)

**Issue:** Title "Dark Code" is 26 characters (should be 50-60). Description is 219
characters (should be 140-160).

#### Table Stakes

| Feature | Why Expected | Complexity | Dependencies |
|---------|--------------|------------|--------------|
| Expand blog title to 50-60 chars | Google displays ~580px / ~60 characters in SERPs. Titles under 30 chars waste ranking real estate. "Dark Code" alone is not descriptive for search -- need the subtitle in the title tag | LOW | Frontmatter `title` field change. The `[slug].astro` template already truncates at 65 chars (line 93-97) |
| Trim meta description to 140-160 chars | Descriptions >160 chars get truncated in SERPs on desktop, >120 on mobile. The 219-char description will be cut mid-sentence, losing the call-to-action | LOW | Frontmatter `description` field change. Keep the core message, remove redundancy |

#### Differentiators

| Feature | Value Proposition | Complexity | Dependencies |
|---------|-------------------|------------|--------------|
| Add `updatedDate` to frontmatter | Post was published 2026-04-14 and already revised (commit 5de320e). Setting `updatedDate` feeds into sitemap lastmod and JSON-LD `dateModified`, signaling freshness to Google | LOW | Blog schema likely supports `updatedDate` already. Check frontmatter schema |

#### Anti-Features

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Keyword-stuff the title | Tempting to pack "AI coding assistant technical debt security" into title | Google rewrites 60-70% of meta descriptions anyway; keyword-stuffed titles look spammy and reduce CTR | Use natural language: "Dark Code: The Silent Rot AI Accelerated and No One Is Measuring" is already excellent -- the issue is the title *tag* is using a truncated version |

---

### Category 3: Sitemap Lastmod Dates

**Issue:** 1,184 URLs with no lastmod dates. The astro.config.mjs already implements
`buildContentDateMap()` for blog posts and guides, but all other pages (Beauty Index,
EDA, tools, etc.) have `lastmod = undefined`.

#### Table Stakes

| Feature | Why Expected | Complexity | Dependencies |
|---------|--------------|------------|--------------|
| Add lastmod to blog posts and guides | Google and Bing explicitly stress lastmod importance. Google maintains a trust score per sitemap based on lastmod accuracy. Currently only blog/guide pages get lastmod | DONE | Already implemented in `buildContentDateMap()` |
| Add lastmod to static content sections (EDA, Beauty Index, tools) | These sections change infrequently but have known creation dates. A fixed lastmod (the actual deployment date) is better than omitting it entirely | LOW | Extend `buildContentDateMap()` with hardcoded dates for static sections, or add a `lastModified` field to each content collection |
| Use W3C Datetime format | Google requires ISO 8601 / W3C Datetime: `YYYY-MM-DDTHH:MM:SS+00:00` or at minimum `YYYY-MM-DD` | LOW | Current implementation uses `.toISOString()` which produces full ISO format -- correct |

#### Differentiators

| Feature | Value Proposition | Complexity | Dependencies |
|---------|-------------------|------------|--------------|
| Derive lastmod from git commit dates | The most accurate approach: use `git log --format=%aI -1 -- <file>` at build time to get the actual last-modified date per content file. Eliminates manual date maintenance | MEDIUM | Requires a build-time script that shells out to git. May slow builds. The Astro sitemap integration's `serialize` function can accept these dates. Consider caching |
| Section-level default dates | For sections that don't change per-page (e.g., all 650 VS pages generated from the same data), use the modification date of the source data file (`languages.json`) as the lastmod for all pages in that section | LOW | Stat the source file at build time, apply date to all URLs matching the section pattern |

#### Anti-Features

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Set all lastmod to today's date | Quick fix to populate all 1,184 URLs | Google explicitly warns: "If all lastmod dates are identical, Google will assume they are incorrect" and will start ignoring your sitemap's lastmod entirely. This erodes sitemap trust score | Use real dates. Omitting lastmod is better than lying about it |
| Use changefreq as a substitute | Tempting to rely on changefreq instead of lastmod | Google ignores `<changefreq>` and `<priority>` entirely (confirmed in official docs). Only `<loc>` and `<lastmod>` matter | Focus exclusively on accurate lastmod |

---

### Category 4: Blog Pagination SEO

**Issue:** Blog pages 2-6 are paginated listing pages. The audit recommends noindexing them.

**Research finding:** The recommendation to noindex is DISPUTED.

#### Table Stakes

| Feature | Why Expected | Complexity | Dependencies |
|---------|--------------|------------|--------------|
| Self-referencing canonical tags on each page | Google's official documentation: "Each paginated page should reference itself, not page one." This is the most critical pagination SEO signal | LOW | Check if `SEOHead.astro` already does this. Astro's canonical generation from `Astro.url.pathname` should produce `/blog/2/`, `/blog/3/` etc. -- verify |
| Sequential `<a href>` links between pages | Google requires crawlable HTML links connecting paginated pages. The existing `<Pagination>` component likely handles this | LOW | Verify the `Pagination.astro` component uses `<a>` tags (not JS-only navigation) |
| Exclude pagination pages from sitemap | Google's e-commerce pagination guidance: "Don't list paginated URLs in sitemaps." The listing pages are discovery paths, not destination content | LOW | Add filter in sitemap config: exclude URLs matching `/blog/\d+/` |
| Unique titles per page | Already implemented: page 1 = "Blog -- Patryk Golabek", page 2+ = "Blog -- Page 2 -- Patryk Golabek" | DONE | Already in `[...page].astro` |

#### Differentiators

| Feature | Value Proposition | Complexity | Dependencies |
|---------|-------------------|------------|--------------|
| Add `rel="next"` and `rel="prev"` | Google deprecated these in 2019, but Bing and other search engines still use them. Adding them is low-cost insurance | LOW | Add `<link>` tags in the head slot based on `page.url.prev` and `page.url.next` from Astro's paginate |

#### Anti-Features

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Noindex pages 2-6 | Appears in many SEO audit checklists | Google's official pagination documentation does NOT recommend noindexing pagination pages. Search Engine Land (2025): "noindexing paginated pages causes crawl paths to disappear, product discovery to slow, and internal PageRank loss." The blog has only 6 pages -- noindexing 5 of them removes 83% of the blog listing section from the index, weakening internal link discovery for older posts | Keep pages indexed with self-referencing canonicals. Remove from sitemap instead. Each page surfaces different blog posts with unique titles -- they serve distinct queries |
| Load-more / infinite scroll replacement | Seems modern | Destroys crawlability. Google cannot execute JavaScript to discover content behind "load more" buttons. Static pagination with HTML `<a>` links is the gold standard for SEO | Keep current numbered pagination |

---

### Category 5: Homepage CSS Optimization

**Issue:** Homepage loads 132KB of CSS from wrong routes. This likely means Astro's CSS
chunking is pulling in stylesheets from other sections (e.g., EDA KaTeX styles, tool
page styles) into the homepage bundle.

#### Table Stakes

| Feature | Why Expected | Complexity | Dependencies |
|---------|--------------|------------|--------------|
| Audit and identify which CSS chunks load on homepage | Before fixing, need to identify which stylesheets are loading and which route they belong to. Use Chrome DevTools Coverage panel to see which CSS bytes are actually used on homepage | LOW | No code changes -- diagnostic step |
| Move component-specific styles into scoped `<style>` tags | Astro scopes `<style>` blocks to the component they are in. If global CSS imports are pulling in tool or EDA styles, scoping them to their components prevents cross-page bleeding | MEDIUM | May require refactoring how some components import CSS. Check if Tailwind `@apply` directives or global CSS imports cause the issue |
| Configure `vite.build.cssCodeSplit` | Astro uses Vite under the hood. Ensuring `cssCodeSplit: true` (the default) splits CSS per page chunk. If this is off, all CSS bundles into one file | LOW | Check `astro.config.mjs` vite config |

#### Differentiators

| Feature | Value Proposition | Complexity | Dependencies |
|---------|-------------------|------------|--------------|
| Inline critical CSS for homepage | Astro automatically inlines CSS chunks under 4KB. For the homepage specifically, ensuring above-the-fold styles are inlined eliminates render-blocking requests | LOW-MEDIUM | Astro's `assetsInlineLimit` option. Verify the threshold is appropriate |
| Lazy-load non-critical CSS | If KaTeX or D3 styles are loading on homepage (they shouldn't be), ensure those CSS imports are inside components with `client:visible` or conditional rendering | MEDIUM | Requires tracing import chains. KaTeX CSS is already conditionally loaded via `useKatex={true}` in EDALayout -- verify no leakage |

#### Anti-Features

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Purge all unused CSS globally | Tempting to run PurgeCSS as a post-build step | Tailwind already purges unused utilities. A secondary purge risks removing dynamically-applied classes (e.g., classes added via JavaScript or template conditionals) | Tailwind's built-in content scanning is sufficient. Focus on CSS code splitting instead |

---

### Category 6: Google Fonts Self-Hosting

**Issue:** 4 font families loaded from Google Fonts CDN (fonts.googleapis.com). This adds
2-4 external DNS lookups, blocks rendering even with the preload/swap pattern, and
prevents optimal caching.

**Current fonts:**
- Bricolage Grotesque (700, 800) -- headings
- DM Sans (400, 500, 700) -- body
- Fira Code (400) -- monospace
- Noto Sans (400, 700) -- Greek character fallback

#### Table Stakes

| Feature | Why Expected | Complexity | Dependencies |
|---------|--------------|------------|--------------|
| Download WOFF2 files for all fonts | WOFF2 offers ~30% better compression than WOFF and has 96%+ browser support. IE is dead. No need for WOFF/TTF fallbacks | LOW | Use google-webfonts-helper (gwfh.mranftl.com) or extract directly from Google Fonts CSS. Download specific weights only |
| Write local `@font-face` declarations | Replace the Google Fonts `<link>` tag with local CSS `@font-face` rules pointing to self-hosted files. Use `font-display: swap` for heading/body fonts | LOW | Add to `global.css` or a new `fonts.css`. Font fallback metrics already defined in `global.css:40-51` -- keep those |
| Remove external `<link>` and `preconnect` | Remove the 4 lines in `Layout.astro:116-129` (preconnect hints, preload/swap pattern, noscript fallback). All replaced by local `@font-face` | LOW | Ensure no other component references Google Fonts CDN |
| Preload 1-2 critical font files | `<link rel="preload" as="font" href="/fonts/dm-sans-400.woff2" type="font/woff2" crossorigin>` for the body font. Must include `crossorigin` attribute even for same-origin fonts | LOW | Add to `Layout.astro` `<head>`. Preload only the most critical weight (body text regular) |

#### Differentiators

| Feature | Value Proposition | Complexity | Dependencies |
|---------|-------------------|------------|--------------|
| Subset fonts to used character ranges | Google Fonts auto-subsets by unicode-range, but self-hosting lets you go further. If Noto Sans is only used for Greek letters in the Beauty Index, subset to Greek range only using fonttools/pyftsubset | MEDIUM | Requires Python fonttools. Saves potentially 50-80% of Noto Sans file size. Only worth it if the font is large |
| Use `font-display: optional` for Noto Sans | Noto Sans is a fallback for Greek characters -- not critical for initial render. `font-display: optional` prevents any layout shift by never swapping the font if it misses the initial load window | LOW | Only applies to non-critical fonts. Body and heading fonts should use `swap` |
| Cache with immutable headers | Self-hosted fonts can be served with `Cache-Control: public, max-age=31536000, immutable` because font files never change. Google Fonts CDN uses shorter cache durations | LOW | Requires server/CDN configuration (e.g., Cloudflare page rules or _headers file) |

#### Anti-Features

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Use system fonts instead | Maximum performance -- zero font loading | Destroys the site's visual brand. Bricolage Grotesque headings are a distinctive design element. System fonts look generic | Self-host the custom fonts. The performance delta vs system fonts is small with proper WOFF2 + preload |
| Preload all font files | If 1 preload is good, 4 must be better | Preloading too many fonts wastes bandwidth on resources that may not be immediately needed. Each preload competes for early connection bandwidth | Preload only the primary body font weight (DM Sans 400). Other weights load on demand |
| Keep CDN but add `font-display: optional` | Avoids self-hosting work | Does not fix the core issue: 2-4 external DNS lookups and network requests to fonts.googleapis.com + fonts.gstatic.com. Privacy concern: Google tracks font requests | Self-host. The migration is straightforward and the performance improvement is measurable (~180ms median LCP improvement per CoreDash data) |

#### Performance Impact

| Metric | CDN (Current) | Self-Hosted (Target) | Delta |
|--------|---------------|----------------------|-------|
| External DNS lookups | 2 (googleapis.com, gstatic.com) | 0 | -2 |
| External HTTP requests | 3-5 (CSS + font files) | 0 external | -3 to -5 |
| LCP impact | Baseline | ~180ms improvement (median) | Significant |
| CLS impact | Low (fallback metrics exist) | Same or better | Neutral to positive |
| Total font payload | ~80-120KB (per Google's subsetting) | ~60-100KB (custom subsetting possible) | ~20% smaller |

---

## Feature Dependencies

```
[Self-host fonts]
    (independent -- no dependencies)

[Sitemap lastmod dates]
    (independent -- no dependencies)

[Blog meta tag fixes]
    (independent -- no dependencies)

[Blog pagination SEO]
    (independent -- no dependencies)

[Homepage CSS audit]
    (independent -- but should be done AFTER font self-hosting
     to avoid re-auditing CSS once external font links are removed)

[VS page enrichment]
    requires --> existing data files (all present)
    requires --> syntax highlighting (Shiki already configured via expressive-code)
    may require --> tab component for code comparisons (new UI component)
    enhances --> sitemap lastmod (enriched pages warrant a new lastmod date)
```

### Dependency Notes

- **VS page enrichment requires existing data files:** All enrichment data exists in
  `justifications.ts`, `code-features.ts`, `snippets.ts`, and `languages.json`. No new
  data authoring is needed.
- **Homepage CSS audit depends on font self-hosting:** Self-hosting fonts removes external
  CSS requests. If CSS is audited first, the external font CSS will still show as "wrong
  route" CSS. Do fonts first, then audit CSS.
- **VS enrichment enhances sitemap lastmod:** Once VS pages are enriched, update their
  lastmod dates in the sitemap to signal content freshness to Google.

---

## Priority Order

### Phase 1: Quick Wins (Low Complexity, High Impact)

- [x] Blog meta tag fixes (title + description) -- 5 minutes, immediate SERP improvement
- [x] Google Fonts self-hosting -- 30-60 minutes, measurable LCP improvement
- [x] Sitemap lastmod dates for existing content -- 30 minutes, improves crawl efficiency
- [x] Blog pagination: self-referencing canonicals + remove from sitemap -- 15 minutes

### Phase 2: Primary Fix (High Impact, Medium Complexity)

- [x] VS page enrichment with existing data -- 2-4 hours, resolves the thin content risk
      across 650 pages (55% of total site URLs)

### Phase 3: Polish (Medium Impact, Medium Complexity)

- [x] Homepage CSS audit and optimization -- 1-2 hours, requires investigation first
- [x] FAQ schema on VS pages -- 1 hour, triggers rich results for 650 pages

## Feature Prioritization Matrix

| Feature | User/SEO Value | Implementation Cost | Priority |
|---------|----------------|---------------------|----------|
| VS page enrichment (justifications + verdict) | HIGH | LOW | P1 |
| Google Fonts self-hosting | HIGH | LOW | P1 |
| Blog meta tag fixes | HIGH | LOW (5 min) | P1 |
| Sitemap lastmod dates | MEDIUM | LOW | P1 |
| Blog pagination canonicals | MEDIUM | LOW | P1 |
| VS page code comparisons (2-3 features) | HIGH | MEDIUM | P1 |
| VS page FAQ section | MEDIUM | MEDIUM | P2 |
| VS page cross-links | MEDIUM | LOW | P2 |
| Homepage CSS optimization | MEDIUM | MEDIUM | P2 |
| Sitemap lastmod from git dates | LOW | MEDIUM | P3 |
| Font subsetting (Noto Sans) | LOW | MEDIUM | P3 |

**Priority key:**
- P1: Must have -- addresses audit findings directly
- P2: Should have -- additional value on top of fixes
- P3: Nice to have -- diminishing returns

## Competitor Feature Analysis (VS Comparison Pages)

| Content Element | hackr.io (2,200-2,500 words) | Wikipedia Comparison Tables | Rosetta Code | Our Approach (Target) |
|-----------------|------------------------------|----------------------------|--------------|----------------------|
| Language overviews | 2 sections, ~300 words each | Brief | None | Character sketches + year/paradigm context (~100 words) |
| Code examples | 2 code blocks | None | Hundreds per feature | 2-3 feature tabs with side-by-side snippets (~100 words) |
| Comparison table | ~10-row feature matrix | Extensive multi-page tables | Per-task tables | 6-row dimension breakdown (exists) + justification text (~200 words) |
| Verdict/recommendation | Conclusion paragraph | None | None | Expanded verdict + per-dimension narrative (~150 words) |
| FAQ | Not common | None | None | 3-5 programmatic questions (~100 words) -- differentiator |
| Word count | 2,200-2,500 | Varies widely | Minimal prose | ~640-870 (sufficient, all from existing data) |

## Sources

### VS Page Content & Thin Content
- [Google Helpful Content Principles 2026](https://www.mightyroar.com/blog/helpful-content-update) -- quality over word count, but <500 words correlates with thin content penalties
- [Programmatic SEO Best Practices](https://seomatic.ai/blog/programmatic-seo-best-practices) -- 500+ unique words, 30-40% differentiation target
- [Programmatic SEO in 2026 - Metaflow](https://metaflow.life/blog/what-is-programmatic-seo) -- scaled content abuse detection, 8-10 distinct data points per page
- [Google's December 2025 Core Update Analysis](https://raptive.com/blog/what-googles-december-2025-core-update-tells-us-about-quality/) -- sites with >32% thin pages penalized
- [Leveraging Comparison Content - Fire & Spark](https://www.fireandspark.com/blog/leveraging-comparison-content-for-ecommerce-conversion/) -- comparison table structure, FAQ, customer-centric content
- [hackr.io C# vs Python](https://hackr.io/blog/c-sharp-vs-python) -- exemplar comparison page structure at ~2,400 words

### Meta Descriptions
- [Meta Title & Description 2026 Guidelines](https://www.wscubetech.com/blog/meta-title-description-length/) -- 140-160 chars, 50-60 title chars
- [Title Tag & Meta Description Length 2025](https://destination-digital.co.uk/news-blogs-case-studies/title-meta-description-length-google-serps-2025/) -- 120 mobile, 160 desktop

### Sitemap Lastmod
- [Google & Bing Stress Lastmod Importance - Yoast](https://yoast.com/lastmod-xml-sitemaps-google-bing/) -- trust score per sitemap, accuracy critical
- [Google Sitemap Documentation](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap) -- official W3C datetime format requirement
- [Sitemap SEO 2026](https://chapters-eg.com/blog/seo-blog/sitemaps-seo-in-2026/) -- dynamic generation, accurate lastmod

### Blog Pagination
- [Google Pagination Best Practices (Official)](https://developers.google.com/search/docs/specialty/ecommerce/pagination-and-incremental-page-loading) -- self-referencing canonicals, no noindex recommendation
- [Pagination and SEO 2025 - Search Engine Land](https://searchengineland.com/pagination-seo-what-you-need-to-know-453707) -- noindex causes crawl path loss
- [Pagination SEO Guide - Gray Dot Co](https://thegray.company/blog/pagination-seo-guide) -- blog tag/category distinction

### Font Self-Hosting
- [Self-Host Google Fonts for Better CWV](https://www.corewebvitals.io/pagespeed/self-host-google-fonts) -- WOFF2 only, preload 1-2 fonts, 180ms LCP improvement
- [Ultimate Guide to Font Loading Optimization](https://onenine.com/ultimate-guide-to-font-loading-optimization/) -- font-display strategies

### General SEO 2026
- [SEO in 2026 - Search Engine Land](https://searchengineland.com/seo-2026-higher-standards-ai-influence-web-catching-up-473540) -- higher quality standards, AI influence
- [Google Quality Rater Guidelines 2025](https://searchxpro.com/google-quality-rater-guidelines-key-2025-updates/) -- EEAT, filler content definition

---
*Feature research for: SEO Audit Fixes -- patrykgolabek.dev*
*Researched: 2026-04-15*
