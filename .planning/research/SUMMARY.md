# Project Research Summary

**Project:** v1.21 SEO Audit Fixes — patrykgolabek.dev
**Domain:** Technical SEO remediation on Astro 5 static portfolio site
**Researched:** 2026-04-15
**Confidence:** HIGH

## Executive Summary

This milestone addresses SEO audit findings on an Astro 5 SSG portfolio site with 1,184 generated URLs. The site is architecturally sound — the gaps are correctness issues in metadata and content depth, not structural failures. No new production dependencies are needed beyond four @fontsource static packages. All VS page enrichment can be derived from data already in the codebase (`justifications.ts`, `code-features.ts`, `languages.json`), which means the 650-page content problem is a template engineering task, not a content authoring task.

The single highest risk is VS page enrichment triggering Google's scaled content abuse detection. The March 2026 core update specifically targets pages where content is structurally identical across many URLs with only variable substitution. The mitigation is to engineer genuine structural variation and use human-authored editorial content from `justifications.ts` — not AI-generated filler text. Sites that used AI-generated filler saw 60-90% ranking drops.

A critical anti-pattern was discovered: noindexing blog pagination pages 2-6 is **wrong** per Google's official documentation. The correct fix is self-referencing canonicals + sitemap exclusion. The audit's recommendation of `noindex` would sever crawl paths to older blog posts.

## Key Findings

### Stack Additions

- `@fontsource/bricolage-grotesque` (5.2.10): Heading font — static package preserves `"Bricolage Grotesque"` CSS name, zero Tailwind config changes
- `@fontsource/dm-sans` (5.2.8): Body font — ~180ms median LCP improvement from eliminating external DNS/TLS
- `@fontsource/fira-code` (5.2.7): Monospace font — weight 400 only
- `@fontsource/noto-sans` (5.2.10): Greek fallback — unicode-range subsetting automatic

**What NOT to add:**
- `@fontsource-variable/*`: Changes `font-family` CSS names, requires Tailwind config updates
- Astro `experimental.fonts`: Breaking changes between 5.16→5.17, 7+ open bugs, stable only in Astro 6.0.0
- AI/LLM content generation for VS pages: Scaled content abuse risk
- `vite.build.cssCodeSplit = false`: Known Astro breaking bug (#4413)

### Feature Table Stakes

| Feature | Category | Complexity | Data Source |
|---------|----------|------------|-------------|
| VS page enrichment (640-870 words) | Content Quality | HIGH | Existing: justifications.ts, code-features.ts, languages.json |
| Sitemap lastmod for 1,184 URLs | Technical SEO | LOW | Extend existing buildContentDateMap() |
| Font self-hosting (@fontsource) | Performance | LOW | 4 npm packages, Layout.astro changes |
| Blog meta fixes (dark-code title/desc) | On-Page SEO | TRIVIAL | Frontmatter edit |
| Blog pagination canonical + sitemap exclusion | Technical SEO | LOW | [...page].astro + sitemap filter |
| /feed.xml RSS alias | Technical SEO | TRIVIAL | Astro redirect |
| Homepage CSS investigation | Performance | MEDIUM | rollup-plugin-visualizer (already installed) |

### Critical Anti-Patterns Discovered

1. **Noindexing blog pagination is WRONG** — Google official docs confirm noindex causes crawl path loss. Correct fix: self-referencing canonicals + sitemap exclusion.
2. **`lastmod: new Date()` destroys sitemap trust** — Google's per-sitemap trust is binary. Inaccurate dates cause ALL 1,184 lastmod values to be ignored.
3. **Scaled content abuse on VS pages** — Template-with-variable-substitution on 650 pages matches Google's March 2026 violation signals. Must use human-authored editorial content from justifications.ts, add structural variation, include code snippets.

### Architecture Integration Points

1. `src/pages/beauty-index/vs/[slug].astro` (247 lines) — VS enrichment: insert 4 new sections between dimension table and character sketches. All data already available via `DIMENSIONS` import and computed `dimensions` array.
2. `src/layouts/Layout.astro` — Font migration: replace 14-line Google Fonts block with 5 @fontsource imports, update CSP meta tag.
3. `astro.config.mjs` `buildContentDateMap()` — Sitemap lastmod: extend with section-level dates using existing `fs.readFileSync` pattern. Key constraint: `getCollection()` unavailable at config load time.
4. `src/pages/blog/[...page].astro` — Pagination: self-referencing canonical, exclude from sitemap.
5. `src/styles/global.css` — CSS investigation: audit section-specific styles; keep fallback `@font-face` declarations post-font-migration.
6. Beauty Index JSON-LD already has hardcoded `datePublished`/`dateModified` but these are absent from sitemap — a date-signal inconsistency to fix.

### Watch Out For

1. **VS page quality:** 650 pages × 500+ words = massive content surface. If pages feel templated/repetitive, Google's helpful content classifier will flag the entire domain. Manual review of 65+ pages required. Use `justifications.ts` human-authored content (not AI prose), add structural variation (not just language name swaps), include code snippet per page. Sample 20 random pages for <40% overlap before deploying.
2. **Font CLS regression:** Removing Google Fonts preconnect without `<link rel="preload">` creates loading waterfall. Must add preload hints with `crossorigin` attribute (required even for same-origin fonts).
3. **CSS investigation may be a no-op:** 132KB homepage CSS may be correct shared-chunk caching behavior. The 8 animation components imported unconditionally in Layout.astro are the primary CSS-bloat risk. Diagnose before fixing — never `cssCodeSplit: false`.
4. **Lastmod accuracy:** Build twice without content changes and diff sitemaps — must be identical. Section-level dates must be hardcoded constants, not dynamic.
5. **Noto Sans local() behavior:** The current `global.css` Greek Fallback uses `src: local('Noto Sans')` — verify @fontsource's installed font files are discoverable via `local()` or update to reference the installed woff2 path.

## Suggested Phase Order

1. **VS Page Content Enrichment** — Highest risk, longest verification window, addresses 55% of site URLs
2. **Sitemap Lastmod** — Should follow enrichment so dates reflect actual content change
3. **Font Self-Hosting** — Independent, measurable LCP improvement (~180ms)
4. **Blog & Pagination SEO Fixes** — Low complexity metadata fixes (dark-code meta, pagination canonicals, feed.xml alias, Beauty Index description truncation fix)
5. **CSS Investigation** — Measurement-driven, may close as no-op. Must follow font migration for clean baseline.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All packages verified via npm registry; Astro version compatibility confirmed |
| Features | HIGH | Each fix researched against Google official documentation; noindex anti-pattern confirmed |
| Architecture | HIGH | Based on direct codebase analysis with specific file paths and line numbers |
| Pitfalls | HIGH | Verified against March 2026 core update reports, Google docs, Astro GitHub issues |

### Gaps to Address

- **VS page quality threshold:** Research defines what pages must achieve (<40% overlap, structural variation) but whether specific enriched pages meet the bar requires human review of 65-page sample
- **CSS investigation outcome:** 132KB figure requires build-time measurement to diagnose; Phase 5 must start as measurement before code changes
- **Section-level dates for lastmod:** Hardcoded dates for each content section need confirmation from git history
- **`/feed.xml` RSS alias:** Standard Astro redirect pattern, no research gap

---
*Research completed: 2026-04-15*
*Ready for requirements: yes*
