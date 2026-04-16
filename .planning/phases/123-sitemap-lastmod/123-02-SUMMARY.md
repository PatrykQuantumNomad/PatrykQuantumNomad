---
phase: 123-sitemap-lastmod
plan: 02
subsystem: seo
tags: [astro-sitemap, lastmod, seo, tseo-01, eda, blog-aggregation, tag-pages, pagination, determinism]

requires:
  - phase: 123
    plan: 01
    provides: "src/lib/sitemap/ module boundary (buildContentDateMap + STATIC/COLLECTION/TOOL registries), gitLogDate helper, resolvePrefixLastmod prefix fallback, astro.config.mjs wiring"
provides:
  - "Full 1184/1184 sitemap `<lastmod>` coverage (zero missing URLs)"
  - "EDA subpages pass: frontmatter -> gitLogDate -> COLLECTION_SHIP_DATES.eda with loud warnings on fallback"
  - "EDA category-index aggregate-max pass (/eda/foundations/, case-studies/, reference/, techniques/, distributions/, quantitative/)"
  - "Quantitative pass filters techniques.json by category === 'quantitative' to mirror the [slug].astro route exactly (18 URLs)"
  - "Blog aggregate pass: index = max(post dates); pagination pages = max of 10-post slice; tag pages = max across tagged posts"
  - "Runtime preflight assertion tying sitemap PAGE_SIZE to the route's pageSize (throws on drift)"
  - "Synthetic guide routes (/guides/claude-code/cheatsheet/, /guides/fastapi-production/faq/) covered via gitLogDate(route-file)"
  - "extractTags(raw) YAML helper handling inline + block list forms"
affects: [123-03, 125]

tech-stack:
  added: []
  patterns:
    - "Post-iteration aggregate-max pattern: collect per-item dates into a per-category array during the main loop, then stamp category-index URLs with the sorted max at the end"
    - "Runtime-loaded preflight assertion: read the consuming route's source and regex-assert a literal config value (pageSize=10) matches sitemap's constant, throwing to fail the build on drift"
    - "Mixed-population filter-then-emit: iterate all collection entries for aggregation (pagination, tags) while emitting per-item URLs only for non-external posts — matches Astro's route semantics without double-counting"
    - "Slug transform parity: mirror the consuming route's slug derivation (tag.toLowerCase().replace whitespace) inside the sitemap lookup-key construction to guarantee the emitted URL and the map key always match"

key-files:
  created: []
  modified:
    - "src/lib/sitemap/content-dates.ts (178 -> 470 lines, +292)"

key-decisions:
  - "Aggregate pool uses ALL non-draft posts (internal + external) because the blog route's pagination and tag route both call getCollection('blog') with only the draft filter; external-URL posts still appear on those pages and contribute to tag counts. Per-slug lastmod stays internal-only."
  - "Preflight pageSize assertion throws rather than warns: silent drift would propagate wrong lastmods into pagination pages without any signal. Throwing fails the build immediately — the mismatch cannot ship."
  - "Quantitative URLs derived by filtering techniques.json (category === 'quantitative') to mirror the route's getCollection + filter exactly, not via a prefix fallback. Keeps a single source of truth (techniques.json) and makes slug drift impossible."
  - "EDA MDX pass uses gitLogDate as the happy path today (no MDX file carries frontmatter dates at plan time, 20 warnings fire). Warnings are INTENTIONAL — they surface the underlying authoring gap so future content additions can add frontmatter without needing to edit sitemap code."
  - "Synthetic guide routes added inside buildContentDateMap() rather than static-dates.ts to honor the plan's `files_modified: [src/lib/sitemap/content-dates.ts]` scope constraint. gitLogDate on the .astro file keeps the source-of-truth at the route file itself."

patterns-established:
  - "Aggregate-max per-category: Record<category, string[]> collector, then sort + last-element stamp per category index URL at pass end."
  - "Route-contract preflight: readFileSync(routePath) + regex + throw — enforces invariants that span module boundaries (sitemap logic + route logic) at build time, not at test time."
  - "Mixed-population aggregation: emit per-item URLs from a filtered subset, emit aggregate URLs from the full set, in a single pass."

duration: 20min
completed: 2026-04-16
---

# Phase 123 Plan 02: EDA + Blog Aggregate Lastmod Coverage Summary

**Closed the remaining 158-URL gap to achieve 1184/1184 sitemap `<lastmod>` coverage by extending `buildContentDateMap()` with EDA subpage frontmatter/git-log passes, JSON-backed technique/distribution/quantitative stamping, blog index/pagination/tag aggregate-max, and two synthetic guide routes — all deterministic, all in the one file the plan authorized.**

## Performance

- **Duration:** ~20 min
- **Started:** 2026-04-16T13:07:00Z
- **Completed:** 2026-04-16T13:18:00Z (plus ~5 min for SUMMARY write)
- **Tasks:** 2
- **Files modified:** 1 (src/lib/sitemap/content-dates.ts — grew from 178 to 470 lines)

## Accomplishments

- **Sitemap coverage 1026/1184 -> 1184/1184 (100%).** Every URL emitted by `@astrojs/sitemap` now carries a `<lastmod>`.
- **EDA: 92 new URLs covered** via a single pass — 20 MDX subpages (foundations/case-studies/reference) by frontmatter -> gitLogDate fallback -> EDA ship-date safety net; 47 technique entries stamped with `gitLogDate('src/data/eda/techniques.json')`; 19 distributions stamped likewise; 18 quantitative slugs filtered from techniques.json to mirror the `[slug].astro` route's `category === 'quantitative'` filter exactly; 6 category-index URLs stamped with aggregate-max of their subpages.
- **Blog: 64 new URLs covered** via refactored post loop + aggregate pass — `/blog/` = max(post dates) = 2026-04-14; 5 pagination pages with per-slice max; 58 unique tag pages each = max-date of posts carrying that tag. Pool iterates all 55 non-draft posts so external-URL-only tags (ollama, iot, android, etc.) are covered.
- **Runtime preflight assertion** reads `src/pages/blog/[...page].astro` and throws on any `pageSize` drift between route and sitemap. Plan 03's determinism verifier can rely on the invariant holding.
- **Two synthetic guide routes** (`/guides/claude-code/cheatsheet/`, `/guides/fastapi-production/faq/`) covered via `gitLogDate` on the route `.astro` file with hardcoded YMD fallback per Plan 01's handoff.
- **Determinism preserved:** two back-to-back `npx astro build` runs produce byte-identical `dist/sitemap-0.xml` (sha256 `dcbc444bf6a6744178c05e939c055ba9cdd7d65ee1a17c5bdf54eff9bd1965e2`).

## Coverage Verification

### Final Counts

```
urls: 1184 lastmods: 1184 missing: 0
```

### Per-Category Delta vs Plan 01

| Category     | Plan 01 coverage | Plan 02 coverage | Delta |
|--------------|-----------------:|-----------------:|------:|
| static       | 4/4              | 4/4              | +0    |
| blog         | 15/79            | 79/79            | +64   |
| guides       | 31/33            | 33/33            | +2    |
| ai-landscape | 64/64            | 64/64            | +0    |
| beauty-index | 679/679          | 679/679          | +0    |
| db-compass   | 13/13            | 13/13            | +0    |
| eda          | 2/94             | 94/94            | +92   |
| tools        | 218/218          | 218/218          | +0    |
| **TOTAL**    | **1026/1184**    | **1184/1184**    | **+158** |

### Sample URLs (one per newly-covered pattern)

| Category             | Sample URL                                                           | lastmod                   |
|----------------------|----------------------------------------------------------------------|---------------------------|
| EDA foundation MDX   | `https://patrykgolabek.dev/eda/foundations/what-is-eda/`             | 2026-03-01T22:46:24.000Z  |
| EDA case-study MDX   | `https://patrykgolabek.dev/eda/case-studies/ceramic-strength/`       | 2026-03-01T22:46:24.000Z  |
| EDA reference MDX    | `https://patrykgolabek.dev/eda/reference/analysis-questions/`        | 2026-02-25T14:53:48.000Z  |
| EDA technique JSON   | `https://patrykgolabek.dev/eda/techniques/autocorrelation-plot/`     | 2026-03-01T22:46:24.000Z  |
| EDA distribution     | `https://patrykgolabek.dev/eda/distributions/normal/`                | 2026-03-01T22:46:24.000Z  |
| EDA quantitative     | `https://patrykgolabek.dev/eda/quantitative/grubbs-test/`            | 2026-03-01T22:46:24.000Z  |
| EDA category index   | `https://patrykgolabek.dev/eda/quantitative/`                        | 2026-03-01T22:46:24.000Z  |
| Blog index           | `https://patrykgolabek.dev/blog/`                                    | 2026-04-14T00:00:00.000Z  |
| Blog pagination      | `https://patrykgolabek.dev/blog/2/`                                  | 2026-02-22T00:00:00.000Z  |
| Blog tag             | `https://patrykgolabek.dev/blog/tags/kubernetes/`                    | 2026-03-08T00:00:00.000Z  |
| Synthetic guide      | `https://patrykgolabek.dev/guides/claude-code/cheatsheet/`           | 2026-04-12T16:50:50.000Z  |
| Synthetic guide      | `https://patrykgolabek.dev/guides/fastapi-production/faq/`           | 2026-03-10T10:43:57.000Z  |

### Blog Aggregate Example (kubernetes tag)

`/blog/tags/kubernetes/` gets `2026-03-08T00:00:00.000Z` = max date across 14 posts carrying the `kubernetes` tag. Top contributors:

| Date       | Post slug                              |
|------------|----------------------------------------|
| 2026-03-08 | fastapi-production-guide               |
| 2026-02-24 | kubernetes-manifest-best-practices     |
| 2026-02-23 | docker-compose-best-practices          |
| 2026-02-21 | dockerfile-best-practices              |
| 2026-02-12 | building-kubernetes-observability-stack|

The newest-dated post (`fastapi-production-guide`, 2026-03-08) wins. The aggregate reflects the freshest item a crawler would see on that tag page — matching Google's expected listing-page freshness semantics.

### Pagination Aggregate Example

| URL          | lastmod (max of page's slice) | oldest in slice | post count |
|--------------|-------------------------------|-----------------|-----------:|
| `/blog/`     | 2026-04-14                    | 2026-02-23      | 10         |
| `/blog/2/`   | 2026-02-22                    | 2025-01-22      | 10         |
| `/blog/3/`   | 2025-01-19                    | 2021-11-26      | 10         |
| `/blog/4/`   | 2021-11-26                    | 2019-12-31      | 10         |
| `/blog/5/`   | 2019-12-31                    | 2013-01-22      | 10         |
| `/blog/6/`   | 2012-07-12                    | 2012-05-07      | 5          |

### EDA Coverage Breakdown (source-wise)

| Source                                     | URL count | Date origin                                                                  |
|--------------------------------------------|----------:|------------------------------------------------------------------------------|
| MDX foundations/                           | 6         | gitLogDate — no frontmatter dates at plan time; warnings fire (see below)    |
| MDX case-studies/                          | 10        | gitLogDate — same                                                            |
| MDX reference/                             | 4         | gitLogDate — same                                                            |
| JSON techniques (graphical)                | 29        | gitLogDate('src/data/eda/techniques.json') = 2026-03-01T22:46:24Z            |
| JSON distributions                         | 19        | gitLogDate('src/data/eda/distributions.json') = 2026-03-01T22:46:24Z         |
| JSON techniques (quantitative subset)      | 18        | Same techniques.json gitLogDate                                              |
| Category index aggregate-max               | 6         | Max of the category's per-item dates                                         |
| **Total EDA new coverage**                 | **92**    | 0 collection-ship-date fallbacks (git log works everywhere in full history)  |

Zero `COLLECTION_SHIP_DATES.eda` fallback hits — all 20 MDX files got git-log dates, both JSONs got git-log dates, and neither warning-path's second branch ("no frontmatter, no git log") triggered.

### Determinism Check

```
First  build sha256: dcbc444bf6a6744178c05e939c055ba9cdd7d65ee1a17c5bdf54eff9bd1965e2
Second build sha256: dcbc444bf6a6744178c05e939c055ba9cdd7d65ee1a17c5bdf54eff9bd1965e2
diff result: identical (zero bytes differ)
```

### Deterministic Date Source Audit

```bash
grep -nE "new Date\(\)|Date\.now\(\)|statSync" src/lib/sitemap/content-dates.ts
# only matches in comments (module docblock) — zero active usages.
```

### Build Log Warnings (expected)

20 `[sitemap] {cat}/{slug}: frontmatter date absent, using git log (...)` warnings fire during build — one per EDA MDX file under foundations/, case-studies/, reference/. This is **by design**: the plan specifies gitLogDate is a FALLBACK when frontmatter is absent, and the warning surfaces the underlying authoring gap. To silence any specific warning, add `updatedDate: YYYY-MM-DD` to that file's frontmatter. Until then, the git-log date is a correct and deterministic source.

No `[sitemap] no frontmatter, no git log` warnings fired — every EDA MDX has a committed history, so the second-branch safety net (COLLECTION_SHIP_DATES.eda) was unreached.

## Task Commits

1. **Task 1: Extend content-dates.ts with EDA subpages + category-index aggregate-max** — `0feab73` (feat)
2. **Task 2: Blog aggregates + synthetic guide routes → 1184/1184 coverage** — `d9488cf` (feat)

## Files Created/Modified

- `src/lib/sitemap/content-dates.ts` (modified, 178 → 470 lines, +292) — adds EDA MDX pass (frontmatter/gitLogDate/collection-fallback ladder), EDA JSON pass (techniques + distributions), quantitative filter-pass, category-index aggregate-max pass, blog post loop refactor to collect { slug, date, tags }, blog index/pagination/tag aggregate pass with PAGE_SIZE=10 preflight assertion against the route source, and synthetic guide route coverage (claude-code/cheatsheet, fastapi-production/faq). Imports `gitLogDate` from `./git-dates`.

## Decisions Made

See frontmatter `key-decisions` — five decisions, all grounded in route-semantics alignment:

1. **Aggregate pool = all non-draft posts (internal + external).** Pagination and tag routes don't filter externalUrl, so the sitemap's aggregate population must match. Otherwise the 9 tags that only appear on external posts (ollama, iot, android, mobile, ios, llm, terraform, platform-engineering, data-engineering) would ship without lastmods.

2. **PAGE_SIZE preflight throws on drift.** A warning would let the drift ship; a throw makes the build fail until both sides are updated together. Same argument as TypeScript's `strict: true`: catch class-wide errors at compile time, not in prod.

3. **Quantitative coverage via source-filter parity.** The `[slug].astro` route reads `edaTechniques` (loaded from techniques.json) and filters `category === 'quantitative'`. Sitemap iterates the same JSON with the same filter. If techniques.json gains or loses a quantitative entry, both sides track automatically — no manual list to maintain.

4. **EDA warnings are intentional.** Today all 20 warnings fire. Tomorrow when an author adds `updatedDate: 2026-04-16` to one MDX frontmatter, one warning silences itself — no sitemap code change needed. The warnings act as a CI-visible todo list for frontmatter enrichment.

5. **Synthetic routes inside content-dates.ts, not static-dates.ts.** Plan 02's `files_modified` frontmatter lists only `content-dates.ts`. Adding 2 entries to static-dates.ts would violate that scope without benefit (the data belongs next to the other guide-route logic anyway). gitLogDate on the .astro file makes the route file the single source of truth for its own lastmod.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Blog aggregate pool widened to include external-URL posts**
- **Found during:** Task 2 post-build verification
- **Issue:** Plan's code example excluded external-URL posts from the aggregate pool (reused the existing `isExternalBlog` skip). With only 15 internal posts, Math.ceil(15/10)=2 pages — but the sitemap has `/blog/3/` through `/blog/6/` because Astro's route paginates all 55 non-draft posts (no externalUrl filter). Similarly 9 tags (ollama, iot, android, etc.) appear on external-only posts and would ship lastmod-less. Result: 13 URLs missing lastmod after the plan's literal code.
- **Fix:** Refactored the blog loop to separate two populations: (a) `map.set(/blog/{slug}/, iso)` — internal posts only (per-slug URL only exists for internal); (b) `blogPosts.push({ slug, date, tags })` — ALL non-draft posts, internal + external, for aggregate computation. Added a `draft: true` guard to mirror the route's PROD filter. Pagination count is now Math.ceil(55/10)=6, matching the sitemap.
- **Files modified:** `src/lib/sitemap/content-dates.ts`
- **Verification:** After refactor, `/blog/3/`–`/blog/6/` all have lastmods; all 9 external-only tags now covered. Total missing drops from 13 to 2.
- **Committed in:** `d9488cf`

**2. [Rule 3 - Blocking] Synthetic guide routes covered (cheatsheet, faq)**
- **Found during:** Task 2 post-build verification (after deviation #1 was fixed, 2 URLs still missing)
- **Issue:** The plan body enumerates blog aggregates only; the 2 synthetic guide routes (`/guides/claude-code/cheatsheet/`, `/guides/fastapi-production/faq/`) were in Plan 01's handoff note but not in Plan 02's task list. Plan 02's success criterion requires 1184/1184 coverage, so these must be handled somewhere in Plan 02 for that criterion to pass.
- **Fix:** Added a small synthetic-routes block inside `buildContentDateMap()` that uses `gitLogDate(routeFile) ?? isoFromYmd(fallbackYmd)`. Kept the work inside content-dates.ts (the only file in Plan 02's `files_modified` frontmatter) rather than editing static-dates.ts as Plan 01 suggested.
- **Files modified:** `src/lib/sitemap/content-dates.ts`
- **Verification:** Both URLs now ship with lastmods: cheatsheet 2026-04-12T16:50:50Z, faq 2026-03-10T10:43:57Z. Coverage: 1184/1184.
- **Committed in:** `d9488cf`

---

**Total deviations:** 2 auto-fixed (both Rule 3 - Blocking, both required to satisfy the plan's own success criterion of 1184/1184).
**Impact on plan:** No scope creep — both fixes stayed within `content-dates.ts`. The first was a correctness gap in the plan's code example (external posts wrongly excluded from aggregation); the second was a coverage gap the plan body hadn't addressed. Both resolved without touching any other file.

## Issues Encountered

None beyond the two deviations above. Build produces 20 expected `[sitemap]` warnings for EDA MDX files without frontmatter dates — intentional surface-up behavior, not an issue.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- **Plan 03 ready to start.** Its determinism verifier can assert `urls === lastmods === 1184` with no known exceptions; the back-to-back-build sha256 check will pass immediately.
- **PAGE_SIZE=10 contract guarded** — any future change to `src/pages/blog/[...page].astro`'s `pageSize` will throw at build time until sitemap PAGE_SIZE is updated in the same PR.
- **Phase 125 handoff intact:** when OPSEO-03 removes pagination and sparse tag URLs, those URL entries will simply be filtered before serialize; their lastmods remain computed and can be dropped without side effects.

## Self-Check: PASSED

- FOUND: src/lib/sitemap/content-dates.ts (modified, 470 lines)
- FOUND: commit 0feab73 (Task 1, feat EDA pass)
- FOUND: commit d9488cf (Task 2, feat blog aggregates + synthetic routes)
- VERIFIED: urls=1184, lastmods=1184, missing=0 in dist/sitemap-0.xml
- VERIFIED: zero `new Date()` / `Date.now()` / `statSync` in executable code of content-dates.ts (only matches are in the module docblock)
- VERIFIED: two back-to-back builds produce identical sha256 `dcbc444bf6a6744178c05e939c055ba9cdd7d65ee1a17c5bdf54eff9bd1965e2`
- FOUND: .planning/phases/123-sitemap-lastmod/123-02-SUMMARY.md (this file)

---
*Phase: 123-sitemap-lastmod*
*Plan: 02*
*Completed: 2026-04-16*
