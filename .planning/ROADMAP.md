# Milestone v1.21: SEO Audit Fixes

**Status:** Not started
**Phases:** 122-126
**Total Plans:** TBD

## Overview

Apply all actionable findings from the April 15, 2026 SEO audit. The highest-impact work is enriching 650 Beauty Index VS comparison pages from ~192 to 500+ unique words using existing codebase data (justifications.ts, code-features.ts), engineered for structural variation to avoid Google's scaled content abuse detection. The remaining work covers sitemap lastmod accuracy for all 1,184 URLs, font self-hosting to eliminate external DNS/TLS round-trips, batched on-page and technical SEO fixes (frontmatter edits, pagination canonicals, feed alias, thin tag exclusion), and a measurement-driven CSS investigation of the homepage bundle.

## Phases

- [x] **Phase 122: VS Page Content Enrichment** - Enrich 650 Beauty Index VS comparison pages with per-dimension analysis, code snippets, FAQ schema, and cross-links to reach 500+ unique words with structural variation (completed 2026-04-16; 3/3 plans; VS-06 max Jaccard 0.2519, VS-07 min wordcount 1217)
- [x] **Phase 123: Sitemap Lastmod** - Add accurate lastmod dates to all 1,184 sitemap URLs using frontmatter dates for blog and hardcoded publication dates for content sections (completed 2026-04-16)
- [ ] **Phase 124: Font Self-Hosting** - Replace Google Fonts CDN with @fontsource static packages, update CSP, and add preload hints
- [ ] **Phase 125: Blog, Pagination, and On-Page SEO Fixes** - Batch all low-complexity metadata fixes: pagination canonicals, sitemap exclusions, feed alias, and frontmatter description/title corrections
- [ ] **Phase 126: CSS Investigation and Remediation** - Diagnose homepage CSS bundle bloat with rollup-plugin-visualizer and remediate if warranted

## Phase Details

### Phase 122: VS Page Content Enrichment
**Goal**: Every Beauty Index VS comparison page delivers genuine, structurally varied analysis that a reader finds useful when comparing two programming languages
**Depends on**: Nothing (first phase of v1.21)
**Requirements**: VS-01, VS-02, VS-03, VS-04, VS-05, VS-06, VS-07
**Success Criteria** (what must be TRUE):
  1. Each VS page displays per-dimension analysis prose drawn from justifications.ts data for both languages being compared
  2. Each VS page includes 2-3 syntax-highlighted code feature comparisons from code-features.ts
  3. Each VS page has FAQPage JSON-LD with dimension-derived questions
  4. A random 20-page sample shows less than 40% content overlap between any two pages
  5. Each VS page reaches 500+ unique words (verified by word count check)
**Plans**: 3 plans
- [x] 122-01-PLAN.md — Build pure `src/lib/beauty-index/vs-content.ts` content-assembly lib + vitest suite covering VS-01 through VS-06 at lib level
- [x] 122-02-PLAN.md — Rewrite `[slug].astro` as thin renderer + add `VsFaqJsonLd.astro` component for FAQPage JSON-LD
- [x] 122-03-PLAN.md — Build-time verification scripts (`verify-vs-wordcount.mjs` enforcing VS-07, `verify-vs-overlap.mjs` enforcing VS-06) wired into `npm run build`, plus 5-page editorial sample review checkpoint
**UI hint**: yes

### Phase 123: Sitemap Lastmod
**Goal**: Search engines receive accurate per-URL modification dates so crawl budget is directed to recently changed pages
**Depends on**: Phase 122
**Requirements**: TSEO-01
**Success Criteria** (what must be TRUE):
  1. Every URL in sitemap-index.xml includes a lastmod date
  2. Blog post lastmod dates match their frontmatter pubDate or updatedDate
  3. Section-level pages use hardcoded publication dates (not build timestamps)
  4. Two consecutive builds without content changes produce identical sitemaps
**Plans**: 3 plans
- [x] 123-01-PLAN.md — Extract `buildContentDateMap` into `src/lib/sitemap/` with `static-dates.ts` + `git-dates.ts` + `content-dates.ts`; cover static/blog/guide/beauty-index/ai-landscape/db-compass/tool URLs; fix Claude Code guide-chapter lastmod bug
- [x] 123-02-PLAN.md — Extend `content-dates.ts` with EDA subpages (frontmatter + git log fallback), quantitative route-parity filter, blog index/pagination/tag aggregate-max, and synthetic guide routes; coverage 1184/1184
- [x] 123-03-PLAN.md — Build-time determinism + coverage verifier (`scripts/verify-sitemap-determinism.mjs`) wired into `npm run build` after the Phase 122 VS verifiers

### Phase 124: Font Self-Hosting
**Goal**: All fonts load from the same origin as the site, eliminating external DNS lookups and TLS handshakes for faster LCP
**Depends on**: Nothing (independent of other phases)
**Requirements**: PERF-01, PERF-02, PERF-03
**Success Criteria** (what must be TRUE):
  1. No requests to fonts.googleapis.com or fonts.gstatic.com appear in the network waterfall
  2. CSP meta tag no longer whitelists googleapis.com or gstatic.com domains
  3. Critical fonts have preload link hints with crossorigin attribute in the document head
  4. All four font families render correctly in both light and dark modes
**Plans**: 2 plans
- [ ] 124-01-PLAN.md — Self-host @fontsource packages + rewrite Layout.astro head (CSP + preload hints + remove Google Fonts block) + hand-written @font-face rules for LCP-critical weights
- [ ] 124-02-PLAN.md — Build-time verifier (scripts/verify-no-google-fonts.mjs with FastAPI MDX allowlist + 4-assertion enforcement) wired into npm run build + human smoke test of 4 families in light/dark modes

### Phase 125: Blog, Pagination, and On-Page SEO Fixes
**Goal**: All low-complexity metadata and routing issues from the SEO audit are resolved in a single batch
**Depends on**: Nothing (independent of other phases)
**Requirements**: TSEO-02, TSEO-03, TSEO-04, TSEO-05, OPSEO-01, OPSEO-02, OPSEO-03, OPSEO-04
**Success Criteria** (what must be TRUE):
  1. Blog pagination pages 2-6 have self-referencing canonical tags pointing to their own URL
  2. Blog pagination pages are excluded from sitemap generation
  3. Visiting /feed.xml serves the same RSS content as /rss.xml
  4. Tag pages with fewer than 3 posts do not appear in the sitemap
  5. The dark-code post title is 55-60 characters, its description is under 160 characters, Beauty Index single-language descriptions are 140-160 characters without mid-word truncation, and the Dockerfile Analyzer description is under 160 characters
**Plans**: TBD

### Phase 126: CSS Investigation and Remediation
**Goal**: The homepage CSS bundle is understood and remediated if diagnosis reveals unnecessary cross-route CSS loading
**Depends on**: Phase 124
**Requirements**: PERF-04, PERF-05
**Success Criteria** (what must be TRUE):
  1. A rollup-plugin-visualizer report exists showing CSS chunk composition for the homepage
  2. If cross-route CSS was loading unnecessarily, the fix reduces homepage CSS below the pre-investigation baseline
  3. If 132KB is correct shared-chunk behavior, the investigation closes with documented rationale
**Plans**: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 122 -> 123 -> 124 -> 125 -> 126
Note: Phases 124 and 125 are independent of each other and of 122/123. They could execute in parallel, but 124 must precede 126 (font migration provides clean CSS baseline for investigation).

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 122. VS Page Content Enrichment | 3/3 | Complete | 2026-04-16 |
| 123. Sitemap Lastmod | 3/3 | Complete   | 2026-04-16 |
| 124. Font Self-Hosting | 0/TBD | Not started | - |
| 125. Blog, Pagination, and On-Page SEO Fixes | 0/TBD | Not started | - |
| 126. CSS Investigation and Remediation | 0/TBD | Not started | - |
