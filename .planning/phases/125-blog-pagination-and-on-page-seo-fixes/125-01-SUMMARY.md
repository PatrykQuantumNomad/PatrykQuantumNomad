---
phase: 125-blog-pagination-and-on-page-seo-fixes
plan: 01
subsystem: sitemap,blog,rss
tags: [seo, sitemap, canonical, rss, pagination, tags]
requires:
  - Phase 123 sitemap infrastructure (buildContentDateMap, resolvePrefixLastmod, verify-sitemap-determinism.mjs)
  - SEOHead.astro canonicalURL prop pass-through (Layout.astro → SEOHead.astro)
provides:
  - Self-referencing canonicals on /blog/ and /blog/2/../6/ (TSEO-02)
  - /feed.xml alias endpoint byte-identical to /rss.xml (TSEO-04)
  - Sitemap filter excludes pagination /blog/{N}/ (TSEO-03)
  - Sitemap filter excludes sparse tags (<3 posts) via buildSparseTagSet (TSEO-05)
  - LOC_FLOOR decremented 1184 → 1137 in verify-sitemap-determinism
affects:
  - dist/sitemap-0.xml (1184 → 1137 URLs, 47-URL drop)
  - dist/blog/{N}/index.html canonical header content
  - new dist/feed.xml endpoint
tech-stack:
  added: []
  patterns:
    - Re-export endpoint alias pattern (export { GET } from './rss.xml')
    - Slug-normalized tag set for O(1) filter lookup
    - Regex-guarded pagination filter (\d+ not \d* to preserve page 1)
key-files:
  created:
    - src/pages/feed.xml.ts
  modified:
    - src/pages/blog/[...page].astro
    - src/lib/sitemap/content-dates.ts
    - astro.config.mjs
    - scripts/verify-sitemap-determinism.mjs
decisions:
  - "Explicit canonicalURL prop on pagination route (defensive — SEOHead.astro already self-canonicalizes by default, but prop-forwarding makes intent visible in the route source and prevents silent regression if the default ever changes)"
  - "/feed.xml implemented as a re-export alias, NOT a redirect (GitHub Pages static hosting can't serve 301 with XML Content-Type; duplicate endpoint ensures any RSS reader pointed at either URL gets identical bytes; future RSS edits propagate automatically)"
  - "Sparse-tag threshold set to 3 (tags with <3 posts excluded — drops 42 URLs to match plan's success criteria; threshold chosen to keep topic hubs with real authority signal while cutting thin single-post tag pages)"
  - "LASTMOD_COVERAGE_FLOOR (1120) NOT changed — Phase 123 pre-allocated 64 URLs of headroom precisely for this 47-URL drop"
  - "Dead-weight lastmod entries for removed /blog/{N}/ and sparse tag URLs left in place in content-dates.ts — serialize hook only consumes them when the URL survives filter, so they're benign and removing them would expand blast radius"
metrics:
  duration: "~5m"
  tasks: 2
  files-modified: 4
  files-created: 1
  completed: "2026-04-16T22:44:35Z"
commits:
  - hash: "7b78705"
    task: "Task 1: Explicit self-canonical on blog pagination + /feed.xml alias"
  - hash: "eba76e8"
    task: "Task 2: Sitemap filter + LOC_FLOOR decrement"
---

# Phase 125 Plan 01: Blog Pagination + Sitemap + RSS SEO Fixes Summary

**One-liner:** Landed TSEO-02/03/04/05 — explicit self-canonicals on blog pagination routes, new /feed.xml alias re-exporting GET from /rss.xml, sitemap filter dropping 47 URLs (5 pagination + 42 sparse tags), and LOC_FLOOR decremented from 1184 to 1137 to keep the determinism gate green.

## Objective Recap

Resolve all routing/config SEO blockers from the 2026-04-15 SEO audit in a single atomic plan:

1. **TSEO-02** — Blog pagination (/blog/2/../6/) needs self-referencing `<link rel="canonical">` to prevent duplicate-content signals.
2. **TSEO-03** — Paginated blog pages should NOT appear in sitemap-0.xml (Google's "thin index page" heuristic penalizes low-value URLs at crawl-budget cost).
3. **TSEO-04** — /feed.xml alias (industry convention) must serve byte-identical bytes to /rss.xml for RSS readers that assume either URL.
4. **TSEO-05** — Tag pages with fewer than 3 posts are thin content; exclude them from sitemap to concentrate crawl equity on topic hubs with real authority.

All four requirements were independent of Plan 02 (on-page content edits) → shipped together in Wave 1 parallel with Plan 02.

## Work Completed

### Task 1 — TSEO-02 + TSEO-04 (commit 7b78705)

- **`src/pages/blog/[...page].astro`** — Added explicit `canonicalURL` prop to `<Layout>`. Computes `/blog/` for page 1 and `/blog/{N}/` for pages 2-6 (trailing slash matches `trailingSlash: 'always'`). Layout.astro forwards `canonicalURL` to SEOHead.astro, which emits `<link rel="canonical">`.
- **`src/pages/feed.xml.ts`** — NEW file, 4 lines: `export { GET } from './rss.xml';`. Astro 5.x treats re-exported `GET` as a valid endpoint handler, so /feed.xml and /rss.xml serve identical bytes at build time.

**Verification results:**

| Page | Canonical count |
|------|-----------------|
| `dist/blog/index.html` | 1 (`https://patrykgolabek.dev/blog/`) |
| `dist/blog/2/index.html` | 1 (`https://patrykgolabek.dev/blog/2/`) |
| `dist/blog/3/index.html` | 1 |
| `dist/blog/4/index.html` | 1 |
| `dist/blog/5/index.html` | 1 |
| `dist/blog/6/index.html` | 1 |

`dist/feed.xml` and `dist/rss.xml` share sha1 `de458466827cdf3fed6c4a8e2acb1578444f793f` (byte-identical).

### Task 2 — TSEO-03 + TSEO-05 + LOC_FLOOR (commit eba76e8)

- **`src/lib/sitemap/content-dates.ts`** — Added `buildSparseTagSet(minPosts: number): Set<string>`. Mirrors the existing `buildContentDateMap()` blog-iteration pattern (readdirSync + draft filter + extractTags) and normalizes slugs via `toLowerCase().replace(/\s+/g, '-')` to match route slugification. Returns set of slugs with count < minPosts.
- **`astro.config.mjs`** — Named import now includes `buildSparseTagSet`. After `contentDates = buildContentDateMap()`, added `const sparseTags = buildSparseTagSet(3)`. Sitemap `filter` is now a 4-branch function rejecting `/404`, `/blog/{N}/` pagination (regex `/\/blog\/\d+\/?$/` — uses `\d+` NOT `\d*` so `/blog/` page 1 survives), and tag URLs whose captured slug is in `sparseTags`.
- **`scripts/verify-sitemap-determinism.mjs`** — `LOC_FLOOR` decremented 1184 → 1137 with inline comment citing Phase 125 drop (5 pagination + 42 sparse). `LASTMOD_COVERAGE_FLOOR` unchanged (Phase 123 reserved 64-URL headroom for exactly this scenario).

**Verification results:**

| Check | Expected | Actual |
|-------|----------|--------|
| `/blog/2/`..`/blog/6/` in sitemap | 0 each | 0 each |
| `/blog/` (page 1) in sitemap | 1 | 1 |
| `/blog/tags/kubernetes/` in sitemap | 1 | 1 |
| `/blog/tags/ollama/` in sitemap (sparse) | 0 | 0 |
| `/blog/tags/terraform/` in sitemap (sparse) | 0 | 0 |
| Total `<loc>` count in sitemap-0.xml | ~1137 | **exactly 1137** |
| Total kept tag URLs | 16 | 16 |
| feed.xml byte-identical to rss.xml | yes | yes (same sha1) |
| verify-sitemap-determinism report | `coverageOk: true` | `coverageOk: true` |
| sitemap-0.xml deterministic across 2 builds | yes | sha256 `8a3d1496...251b8e` both builds |

### Plan-level build verification

`npm run build` ran clean end-to-end. All 4 existing verifiers (VS-07 wordcount, VS-06 overlap, sitemap-determinism, no-google-fonts) passed:

- VS-07: 650 pages, min=1217 max=1724 mean=1393.4, 0 failures.
- VS-06: max Jaccard=0.252, mean=0.056, p95=0.205 (ceiling 0.40).
- sitemap-determinism: `<loc>=1137 <lastmod>=1137`, deterministic across back-to-back builds (sha256 match).
- no-google-fonts: 0 violations, 2 preload hints, 2 allowlisted code-example matches.

## Deviations from Plan

None — plan executed exactly as written. No auto-fixes (Rules 1-3) triggered, no architectural questions (Rule 4), no authentication gates. All verification commands in both tasks' `<verify>` blocks returned expected counts.

The plan's prediction that "LOC_FLOOR=1137 but the actual URL count after filtering may differ by a few" turned out to be conservative — the filter landed exactly 1137 URLs on the first try, matching LOC_FLOOR with no adjustment needed. The 42-sparse-tag estimate was computed correctly during planning.

## Requirements Closed

| Requirement | Status | Evidence |
|-------------|--------|----------|
| TSEO-02 (blog pagination self-canonical) | Complete | 6 built HTML files each emit 1 self-referencing canonical link |
| TSEO-03 (sitemap excludes pagination) | Complete | 0 `/blog/{N}/` URLs in sitemap-0.xml, `/blog/` page 1 retained |
| TSEO-04 (/feed.xml alias) | Complete | dist/feed.xml byte-identical to dist/rss.xml |
| TSEO-05 (sitemap excludes sparse tags) | Complete | 42 sparse tags absent, 16 kept tags (incl. kubernetes) retained |

## Files Touched

**Created (1):**
- `src/pages/feed.xml.ts` (4 lines — re-export alias)

**Modified (4):**
- `src/pages/blog/[...page].astro` (+1 line — canonicalURL prop on Layout)
- `src/lib/sitemap/content-dates.ts` (+28 lines — buildSparseTagSet export)
- `astro.config.mjs` (+6 / -1 lines — import + sparseTags + filter function)
- `scripts/verify-sitemap-determinism.mjs` (+4 / -1 lines — LOC_FLOOR 1184→1137 with audit comment)

## Known Stubs

None. No hardcoded empty values, placeholder text, or unwired data sources introduced.

## Impact on Downstream Work

- **Plan 03 (verifier) in Wave 2** — has concrete targets to assert: 6 canonical checks, `dist/feed.xml` existence + sha1 match, sitemap pagination/sparse-tag absence, and LOC_FLOOR=1137 exact match. All outputs stable and reproducible.
- **Phase 126 (CSS investigation)** — unaffected; pure measurement phase on unrelated subsystem.
- **Future blog tag reorg** — `buildSparseTagSet(minPosts)` is parameterized, so a future bump to `minPosts: 5` (e.g., after content consolidation) is a one-integer change.

## Self-Check: PASSED

**Files claimed as created/modified — existence check:**
- `src/pages/feed.xml.ts` — FOUND
- `src/pages/blog/[...page].astro` — FOUND (modified)
- `src/lib/sitemap/content-dates.ts` — FOUND (modified)
- `astro.config.mjs` — FOUND (modified)
- `scripts/verify-sitemap-determinism.mjs` — FOUND (modified)

**Commits claimed — git log check:**
- `7b78705` (Task 1) — FOUND
- `eba76e8` (Task 2) — FOUND

**Build state:** green end-to-end, all 4 verifiers PASS, sitemap-0.xml deterministic.
