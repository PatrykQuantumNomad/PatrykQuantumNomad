---
phase: 123-sitemap-lastmod
verified: 2026-04-16T14:30:00Z
status: passed
score: 4/4
overrides_applied: 0
---

# Phase 123: Sitemap Lastmod — Verification Report

**Phase Goal:** Search engines receive accurate per-URL modification dates so crawl budget is directed to recently changed pages
**Verified:** 2026-04-16T14:30:00Z
**Status:** passed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Every URL in sitemap-index.xml includes a lastmod date | VERIFIED | sitemap-0.xml (the content sitemap referenced by sitemap-index.xml) has 1184 `<loc>` and 1184 `<lastmod>` tags — exact match. The sitemap-index.xml itself is a structural index with one `<sitemap>` pointer entry; `@astrojs/sitemap` does not emit `<lastmod>` on structural sitemap-index entries (standard format). TSEO-01 requires "All 1,184 sitemap URLs include accurate `<lastmod>` dates" — confirmed. Verifier report `sitemap-determinism-2026041613455.json` shows `coverageOk: true`, `lastmodPerUrlOk: true`. |
| 2 | Blog post lastmod dates match their frontmatter pubDate or updatedDate | VERIFIED | Spot-checked `dark-code.mdx` (`publishedDate: 2026-04-14`) → sitemap shows `2026-04-14T00:00:00.000Z`. `extractFrontmatterDate()` in `content-dates.ts` implements precedence `updatedDate > lastVerified > publishedDate` and pipes through `isoFromYmd()`. |
| 3 | Section-level pages use hardcoded publication dates (not build timestamps) | VERIFIED | `STATIC_PAGE_DATES` in `static-dates.ts` maps every static/section URL to a hardcoded YMD string converted via `iso()`. Confirmed for `/` (2026-02-11), `/about/` (2026-02-11), `/eda/` (2026-03-01), `/beauty-index/` (2026-02-17). No `Date.now()`, `statSync`, or runtime clock — `iso()` takes string literal input only. |
| 4 | Two consecutive builds without content changes produce identical sitemaps | VERIFIED | Committed baseline report `sitemap-determinism-2026041613455.json`: `sitemap0.deterministic: true`, `sitemap0.firstHash === sitemap0.secondHash` (`dcbc444bf6a6744178c05e939c055ba9cdd7d65ee1a17c5bdf54eff9bd1965e2`). `sitemapIndex.deterministic: true`. Build-time gate enforces this on every `npm run build`. |

**Score:** 4/4 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/lib/sitemap/static-dates.ts` | Hardcoded URL→ISO date registry for section/static pages | VERIFIED | Exists, 116 lines (plan spec: min 80). Exports `STATIC_PAGE_DATES`, `TOOL_RULES_DATES`, `COLLECTION_SHIP_DATES`. Contains `git log -1` — wait, no: contains `iso()` helper only. |
| `src/lib/sitemap/git-dates.ts` | gitLogDate helper with in-memory cache | VERIFIED | Exists, 41 lines (plan spec: min 20). Exports `gitLogDate(relativePath)`. Contains `git log -1 --format=%cI`. Returns `undefined` on miss (no throw). |
| `src/lib/sitemap/content-dates.ts` | buildContentDateMap() covering all URL categories | VERIFIED | Exists, 470 lines (plan spec: min 120). Exports `buildContentDateMap()` and `resolvePrefixLastmod()`. Covers blog, guides, EDA, beauty-index, AI landscape, db-compass, tools. |
| `astro.config.mjs` | Imports from `src/lib/sitemap/content-dates` and invokes serialize hook | VERIFIED | Imports `buildContentDateMap, resolvePrefixLastmod` from `./src/lib/sitemap/content-dates`. Calls `buildContentDateMap()` at config load. Serialize hook uses `contentDates.get(item.url) ?? resolvePrefixLastmod(item.url)`. |
| `scripts/verify-sitemap-determinism.mjs` | Zero-dep ESM verifier wired into npm run build | VERIFIED | Exists, 216 lines. Chained in `package.json` build script: `astro build && node scripts/verify-vs-wordcount.mjs && node scripts/verify-vs-overlap.mjs && node scripts/verify-sitemap-determinism.mjs`. Convenience script `verify:sitemap-determinism` also present. |
| `.planning/reports/sitemap-determinism-2026041613455.json` | Committed baseline green-state report | VERIFIED | File exists. `coverageOk: true`, `locCount: 1184`, `lastmodCount: 1184`, `deterministic: true`. |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `astro.config.mjs` serialize() | `content-dates.ts buildContentDateMap()` | import + call at module load | WIRED | `import { buildContentDateMap, resolvePrefixLastmod } from './src/lib/sitemap/content-dates'` + `const contentDates = buildContentDateMap()` confirmed at lines 12, 22. |
| `content-dates.ts` | `static-dates.ts STATIC_PAGE_DATES` | import + Object.entries iteration | WIRED | `import { STATIC_PAGE_DATES, TOOL_RULES_DATES, COLLECTION_SHIP_DATES } from './static-dates'` at line 20. Iterated at line 89. |
| `content-dates.ts` guide pass | per-chapter MDX frontmatter updatedDate | readFileSync + extractFrontmatterDate | WIRED | `extractFrontmatterDate()` reads raw MDX via `readFileSync`, regex-matches `updatedDate|publishedDate|lastVerified`. Claude Code chapter `agent-sdk.mdx` has `updatedDate: 2026-04-12` → sitemap shows `2026-04-12T00:00:00.000Z`. |
| `package.json` build chain | `scripts/verify-sitemap-determinism.mjs` | `&&` chain in build script | WIRED | `"build": "astro build && node scripts/verify-vs-wordcount.mjs && node scripts/verify-vs-overlap.mjs && node scripts/verify-sitemap-determinism.mjs"` confirmed. |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|--------------------|--------|
| `astro.config.mjs` serialize hook | `contentDates` Map | `buildContentDateMap()` called at config load | Yes — map populated from frontmatter, JSON files, and hardcoded registries | FLOWING |
| `buildContentDateMap()` blog pass | per-post ISO date | `readFileSync` on `src/data/blog/*.{md,mdx}` + `extractFrontmatterDate` | Yes — 1184/1184 sitemap entries have lastmods in output dist | FLOWING |
| `verify-sitemap-determinism.mjs` | `locCount`/`lastmodCount` | `readFileSync('dist/sitemap-0.xml')` + regex count | Yes — report shows 1184/1184, `coverageOk: true` | FLOWING |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| sitemap-0.xml loc count equals lastmod count | `grep -o "<loc>" dist/sitemap-0.xml | wc -l` vs `grep -o "<lastmod>" dist/sitemap-0.xml | wc -l` | 1184 / 1184 | PASS |
| Determinism report exists with coverageOk: true | Read `.planning/reports/sitemap-determinism-2026041613455.json` | `coverageOk: true`, `deterministic: true` | PASS |
| Claude Code chapters show 2026-04-12 (bug fix) | sitemap entry for `/guides/claude-code/agent-sdk/` | `2026-04-12T00:00:00.000Z` | PASS |
| No runtime Date.now()/statSync in src/lib/sitemap | grep for `new Date()\|Date\.now()\|statSync` in sitemap/*.ts | Only matches in comments and `iso(ymd)` helper (deterministic string-input only) | PASS |
| Verifier wired into npm run build | grep in package.json | `&&` chain confirmed | PASS |
| Verifier convenience script present | grep in package.json | `verify:sitemap-determinism` confirmed | PASS |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| TSEO-01 | 123-01, 123-02, 123-03 | All 1,184 sitemap URLs include accurate `<lastmod>` dates (blog from frontmatter, sections from hardcoded publication dates) | SATISFIED | sitemap-0.xml: 1184 `<loc>`, 1184 `<lastmod>`. Verifier enforces at every build. Dates sourced from frontmatter (blog/guides) and `STATIC_PAGE_DATES` (sections). |

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `src/lib/sitemap/static-dates.ts` | 35 | `new Date(ymd + 'T00:00:00Z').toISOString()` | Info | Non-issue: `iso()` helper takes a hardcoded string literal — deterministic by construction. Explicitly permitted by plan spec. |
| `src/lib/sitemap/content-dates.ts` | 27 | `new Date(ymd + 'T00:00:00Z').toISOString()` | Info | Non-issue: same `isoFromYmd()` pattern — deterministic. |
| `scripts/verify-sitemap-determinism.mjs` | 126, 129 | `new Date().toISOString()` | Info | Flows only to `.planning/reports/` filename and `generatedAt` field — never to `dist/`. Explicitly permitted per Plan 03 decisions. |

No blockers. No warnings. All anti-pattern candidates are verified non-issues.

### Human Verification Required

None. All success criteria are verifiable programmatically and confirmed by:
- Actual `dist/sitemap-0.xml` counts (1184/1184)
- Committed determinism report (`coverageOk: true`)
- Grep-confirmed wiring and frontmatter spot-checks

### Gaps Summary

No gaps. All four success criteria are verified against the actual codebase.

---

_Verified: 2026-04-16T14:30:00Z_
_Verifier: Claude (gsd-verifier)_
