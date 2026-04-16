---
phase: 123-sitemap-lastmod
plan: 01
subsystem: seo
tags: [astro-sitemap, lastmod, seo, tseo-01, determinism, typescript, xml-sitemap]

requires:
  - phase: 122
    provides: "Build-time verifier pattern (.planning/reports/ not dist/) and VS page ship date (2026-04-16) used by COLLECTION_SHIP_DATES.beautyIndexVs"
provides:
  - "src/lib/sitemap/ module boundary — single source of truth for sitemap date logic"
  - "STATIC_PAGE_DATES + TOOL_RULES_DATES + COLLECTION_SHIP_DATES hardcoded-date registries"
  - "gitLogDate(relativePath) helper with in-memory cache and undefined-on-miss contract"
  - "buildContentDateMap() covering blog, guides, beauty-index (lang + VS), ai-landscape concepts, db-compass, static pages"
  - "resolvePrefixLastmod() URL-prefix fallback for tool rules and ai-landscape VS"
  - "astro.config.mjs serialize hook consulting map + prefix fallback, with dev-mode console.warn for misses"
  - "Claude Code guide-chapter lastmod bug fix (per-chapter frontmatter beats guide.json)"
affects: [123-02, 123-03, 125]

tech-stack:
  added: []
  patterns:
    - "Hardcoded per-collection ship dates committed to TS — auditable in code review, survives shallow clones"
    - "URL-prefix fallback via resolvePrefixLastmod() for dynamically-enumerated route families"
    - "Frontmatter precedence: updatedDate > lastVerified > publishedDate"
    - "iso() helper coerces 'YYYY-MM-DD' → UTC ISO string at module load, no runtime clock calls"

key-files:
  created:
    - "src/lib/sitemap/static-dates.ts"
    - "src/lib/sitemap/git-dates.ts"
    - "src/lib/sitemap/content-dates.ts"
  modified:
    - "astro.config.mjs"

key-decisions:
  - "Module boundary: src/lib/sitemap/ owns all date logic; astro.config.mjs is a thin consumer importing buildContentDateMap + resolvePrefixLastmod."
  - "Prefix-fallback pattern for /ai-landscape/vs/ and /tools/{tool}/rules/ — avoids coupling sitemap logic to route internals (POPULAR_COMPARISONS list, rule-TS enumeration)."
  - "Guide chapter lastmod uses per-chapter frontmatter (updatedDate || lastVerified) first, falling back to guide.json.publishedDate only when frontmatter is absent. Fixes 14 Claude Code chapter URLs showing 2026-03-15 → now 2026-04-12."
  - "Guide root lastmod = max(chapter dates) rather than guide.json.publishedDate — /guides/ and /guides/claude-code/ now both show 2026-04-12."
  - "Beauty Index VS covers 26*25=650 ordered pairs (matches route's getStaticPaths i !== j iteration), not C(26,2)=325 unordered pairs."

patterns-established:
  - "iso(ymd: string): string — single-line helper coercing date-only string to UTC ISO via new Date(str + 'T00:00:00Z').toISOString(). Determinism by construction."
  - "Registry split: per-URL overrides in STATIC_PAGE_DATES, collection-wide batches in COLLECTION_SHIP_DATES, per-tool batches in TOOL_RULES_DATES."
  - "Dev-mode warn on lastmod miss: console.warn only when !import.meta.env.PROD — silent in CI, loud during local authoring so gaps surface."

duration: 34min
completed: 2026-04-16
---

# Phase 123 Plan 01: Sitemap Lastmod Scaffolding + Guide Bug Fix Summary

**Extracted buildContentDateMap into src/lib/sitemap/, wired hardcoded + frontmatter + prefix-fallback date sources into the @astrojs/sitemap serialize hook, and jumped sitemap lastmod coverage from 45/1184 (3.8%) to 1026/1184 (86.7%) URLs — fixing the Claude Code guide-chapter lastmod bug along the way.**

## Performance

- **Duration:** ~34 min
- **Started:** 2026-04-16T12:55:00Z
- **Completed:** 2026-04-16T13:29:00Z
- **Tasks:** 2
- **Files modified:** 4 (3 created, 1 edited)

## Accomplishments

- `src/lib/sitemap/` module scaffolding established. Three files, one import point from `astro.config.mjs`. Plan 02 can extend `buildContentDateMap()` for EDA and blog-listing/tag/pagination without touching the Astro config again.
- `STATIC_PAGE_DATES` (16 entries), `TOOL_RULES_DATES` (4 entries), and `COLLECTION_SHIP_DATES` (5 entries) now cover every non-per-page-frontmatter URL family.
- `buildContentDateMap()` consumes the registry + per-page MDX/MD frontmatter + collection JSONs (beauty-index languages, ai-landscape nodes, db-compass models) to populate 1026 URLs at config load.
- `resolvePrefixLastmod()` handles the 213 tool-rule URLs and 12 ai-landscape VS URLs via URL-prefix match — no need to enumerate the route internals.
- **Bug fixed:** all 14 Claude Code guide chapter URLs (`/guides/claude-code/*/`) now show `2026-04-12T00:00:00.000Z` (per-chapter `updatedDate` frontmatter) instead of the guide-level `2026-03-15` publishedDate. `/guides/claude-code/` root also updated to 2026-04-12 (max of chapter dates).
- **`/guides/` landing** now shows `2026-04-12` (max of all guide roots) instead of no lastmod.
- **Determinism preserved:** two back-to-back `npx astro build` invocations produce byte-identical `dist/sitemap-0.xml` (sha256 = `87215d67…f7fda235c0`).

## Task Commits

1. **Task 1: Create src/lib/sitemap/static-dates.ts + git-dates.ts** — `2df8b53` (feat)
2. **Task 2: Extract buildContentDateMap, fix guide bug, wire astro.config.mjs** — `ca16822` (feat)

## Files Created/Modified

- `src/lib/sitemap/static-dates.ts` (created, 94 lines) — STATIC_PAGE_DATES registry, TOOL_RULES_DATES, COLLECTION_SHIP_DATES; iso(ymd) helper.
- `src/lib/sitemap/git-dates.ts` (created, 42 lines) — gitLogDate(relativePath) with in-memory cache and undefined-on-miss fallback for shallow-clone safety.
- `src/lib/sitemap/content-dates.ts` (created, 178 lines) — buildContentDateMap() and resolvePrefixLastmod(); blog, guides, beauty-index (lang+VS), ai-landscape, db-compass passes; guide bug fix.
- `astro.config.mjs` (modified) — removed 52-line inline buildContentDateMap function; added import + prefix-fallback in serialize hook; added dev-only warn on misses.

## Decisions Made

See `key-decisions` frontmatter. Highlights:

- **Prefix fallback over enumeration** for `/ai-landscape/vs/` (POPULAR_COMPARISONS lives in `src/lib/ai-landscape/comparisons.ts`, not easily reachable from config-load) and `/tools/{tool}/rules/` (213 rules across 4 tools). Keeping sitemap logic decoupled from route internals preserves Plan 02's ability to add categories without touching existing code.
- **VS page enumeration matches the route:** beauty-index VS uses `i !== j` (both directions), producing 650 URLs. Avoided the C(26,2)=325 mistake the plan text gestured at in comments.
- **Guide chapter precedence:** `updatedDate > lastVerified > publishedDate`. This matches the `extractFrontmatterDate()` regex ordering in `src/lib/sitemap/content-dates.ts`. Claude Code chapters set both `updatedDate` and `lastVerified`; `updatedDate` wins per the precedence.

## Deviations from Plan

None substantive — plan executed as written. Two micro-adjustments worth noting:

**1. [Rule 2 - Defensive] Stricter shape-guards in guide-pass**
- **Found during:** Task 2 implementation
- **Issue:** Plan's code example didn't type-guard `guideMeta.slug` or `ch.slug` before use — missing/empty slugs would produce malformed URLs like `${SITE}/guides//chapter/`.
- **Fix:** Added `if (!guideMeta?.slug) continue;` and `if (!ch?.slug) continue;` before URL construction. Matches existing defensive pattern in the original inline code.
- **Files modified:** `src/lib/sitemap/content-dates.ts`
- **Verification:** Build produced zero malformed URLs (`grep "guides/[a-z-]*//" dist/sitemap-0.xml` returns nothing).
- **Committed in:** `ca16822`

**2. [Rule 3 - Blocking] Iterator for guide-root aggregation**
- **Found during:** Task 2 implementation
- **Issue:** Plan's example used `.replace(SITE, '')` inside a filter which would mis-handle any URL containing `SITE` as a substring elsewhere.
- **Fix:** Used explicit `url.startsWith(SITE) ? url.slice(SITE.length) : url` to extract the path portion before regex-matching `/^\/guides\/[^/]+\/$/`.
- **Files modified:** `src/lib/sitemap/content-dates.ts`
- **Verification:** `/guides/` landing shows 2026-04-12 (correct max over guide roots).
- **Committed in:** `ca16822`

**Total deviations:** 0 substantive / 2 micro-hardenings. Impact: defensive only; no scope creep; no plan intent changed.

## Issues Encountered

- Sandbox write restrictions: `/tmp/` is outside the writable zone; used `$TMPDIR` (`/tmp/claude/`) instead for the two-build determinism snapshot. No impact on the deliverable.

## Verification Results

### Coverage Count
- **Total sitemap URLs:** 1184
- **URLs with `<lastmod>`:** 1026 (86.7%) — jumped from 45/1184 pre-plan.
- **URLs missing `<lastmod>`:** 158 — all in Plan 02 / Plan 03 scope.

### Per-Category Coverage Table

| Category       | Total URLs | With lastmod | Missing | Status |
|----------------|-----------:|-------------:|--------:|--------|
| static         | 4          | 4            | 0       | complete |
| blog           | 79         | 15           | 64      | Plan 02 handles index/pagination/tags (64 URLs) |
| guides         | 33         | 31           | 2       | 2 synthetic routes (cheatsheet, fastapi faq) — Plan 02 or 03 |
| ai-landscape   | 64         | 64           | 0       | complete |
| beauty-index   | 679        | 679          | 0       | complete |
| db-compass     | 13         | 13           | 0       | complete |
| eda            | 94         | 2            | 92      | Plan 02 handles all EDA subpages |
| tools          | 218        | 218          | 0       | complete (landings + 213 rule pages via prefix fallback) |
| **TOTAL**      | **1184**   | **1026**     | **158** | **Plan 02 closes remaining 158** |

### Sample URLs (one per category shape)

| Category           | Sample URL                                                          | lastmod                    |
|--------------------|---------------------------------------------------------------------|----------------------------|
| static             | `https://patrykgolabek.dev/`                                        | 2026-02-11T00:00:00.000Z   |
| blog post          | `https://patrykgolabek.dev/blog/dark-code/`                         | 2026-04-14T00:00:00.000Z   |
| guide chapter      | `https://patrykgolabek.dev/guides/claude-code/agent-sdk/`           | 2026-04-12T00:00:00.000Z   |
| beauty-index VS    | `https://patrykgolabek.dev/beauty-index/vs/python-vs-rust/`         | 2026-04-16T00:00:00.000Z   |
| ai-landscape       | `https://patrykgolabek.dev/ai-landscape/artificial-intelligence/`   | 2026-03-27T00:00:00.000Z   |
| tool rule (prefix) | `https://patrykgolabek.dev/tools/dockerfile-analyzer/rules/dl3000/` | 2026-02-21T00:00:00.000Z   |

### Determinism Check (back-to-back builds)

```
First  build sha256: 87215d672a78becbfa23f4f0bab0909af90641939a4d198f3a596ef7fda235c0
Second build sha256: 87215d672a78becbfa23f4f0bab0909af90641939a4d198f3a596ef7fda235c0
diff result: identical (zero bytes differ)
```

### Deterministic Date Source Audit

```bash
grep -nE "new Date\(\)|Date\.now\(\)|statSync" src/lib/sitemap/*.ts
# only matches in comments ("DO NOT introduce new Date()...") — zero active usages.
```

### Guide Bug Fix Confirmation

All 14 Claude Code chapters + `/guides/claude-code/` root + `/guides/` landing all show **2026-04-12T00:00:00.000Z** (max of per-chapter `updatedDate` frontmatter), replacing the previous `2026-03-15` (guide-level publishedDate).

## Handoff Note for Plan 02

Plan 02 should cover these **158 remaining URLs** to close TSEO-01 fully:

### Blog Listing / Pagination / Tag (64 URLs)
- `/blog/` (1) — use max of blog post dates
- `/blog/2/` … `/blog/6/` (5) — max of posts on each paginated page
- `/blog/tags/{tag}/` (58) — max of `publishedDate || updatedDate` across posts with that tag

### EDA Subpages (92 URLs)
- `/eda/case-studies/` + 10 subpages (11 total)
- `/eda/distributions/` + 19 subpages (20 total)
- `/eda/foundations/` + 6 subpages (7 total)
- `/eda/quantitative/` + 18 subpages (19 total) — filtered from `techniques.json` by `category === 'quantitative'`
- `/eda/reference/` + 4 subpages (5 total)
- `/eda/techniques/` + 29 subpages (30 total)
- Plus `/blog/tags/eda/` (already counted above)

Use gitLogDate() on the MDX file (foundations/case-studies/reference) or the JSON file (techniques/distributions) — batch date per JSON file is acceptable per RESEARCH.md Option A (resolved). Category index pages = max of their children.

### Synthetic Guide Routes (2 URLs)
- `/guides/claude-code/cheatsheet/` — no MDX file, not in `guide.json.chapters`. Either add a synthetic registration in content-dates.ts or enumerate in static-dates.ts. Recommended: add to static-dates.ts with `iso('2026-04-12')`.
- `/guides/fastapi-production/faq/` — same pattern. Add to static-dates.ts with `iso('2026-03-08')`.

Plan 03 then adds the determinism verifier script and the 1184/1184-or-fail assertion.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- `src/lib/sitemap/` module boundary clean; Plan 02 extends `buildContentDateMap()` without touching `astro.config.mjs`.
- Determinism invariant preserved (byte-identical back-to-back builds).
- Guide bug fix verified; 14 Claude Code chapters now reflect true per-chapter `updatedDate`.
- Plan 02 handoff list above is precise (158 URLs, enumerated by pattern).

## Self-Check: PASSED

- FOUND: src/lib/sitemap/static-dates.ts
- FOUND: src/lib/sitemap/git-dates.ts
- FOUND: src/lib/sitemap/content-dates.ts
- FOUND: astro.config.mjs (modified)
- FOUND: .planning/phases/123-sitemap-lastmod/123-01-SUMMARY.md
- FOUND: commit 2df8b53 (Task 1)
- FOUND: commit ca16822 (Task 2)

---
*Phase: 123-sitemap-lastmod*
*Plan: 01*
*Completed: 2026-04-16*
