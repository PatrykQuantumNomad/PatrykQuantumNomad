---
phase: 125-blog-pagination-and-on-page-seo-fixes
plan: 03
subsystem: testing
tags: [verifier, build-gate, seo, canonical, meta-description, feed, rss, zero-dep, nodejs]

# Dependency graph
requires:
  - phase: 125-blog-pagination-and-on-page-seo-fixes
    provides: "Plan 01 shipped /feed.xml alias + pagination canonicals + sparse-tag removal; Plan 02 shipped dark-code title/desc + Beauty Index clause-boundary truncator + dockerfile-analyzer desc"
provides:
  - "Build-time gate asserting all 6 Phase 125 on-page SEO + feed-alias invariants"
  - "Regression-catching harness that hard-fails npm run build on drift of Plans 01/02 outputs"
  - "JSON report format (.planning/reports/on-page-seo-{stamp}.json) following Phase 122/123 convention"
affects:
  - future blog pagination edits (any new /blog/N/ must self-canonical)
  - future dark-code.mdx frontmatter edits (title must sum to [55, 60] with suffix, desc ≤ 160)
  - future Beauty Index language additions (new slug must produce desc in [140, 160] with no mid-word truncation)
  - future dockerfile-analyzer description edits (≤ 160)
  - future src/pages/feed.xml.ts edits (must stay byte-identical to rss.xml)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Build-time verifier as the final gate in npm run build, chained after astro build via &&. Each verifier is zero-dep, exits 0 on success with single-line OK summary and exit 1 with actionable per-invariant hints on failure."
    - "Two-pass regex meta-description extraction (find <meta ...name=\"description\"...>, then extract content=) to avoid Astro attribute-order fragility."
    - "Unicode-aware word-boundary check (/[\\p{L}\\p{N}]/u) for mid-word truncation detection."

key-files:
  created:
    - scripts/verify-on-page-seo.mjs
    - .planning/reports/on-page-seo-2026041623001.json
  modified:
    - package.json
    - .gitignore

key-decisions:
  - "Skip dist/beauty-index/{vs,code,justifications}/ — vs is the 650-page comparison corpus (covered by Phase 122's separate verifiers), code and justifications are aggregate landing pages with intentionally shorter descriptions. Enumerates to exactly 26 language slugs matching Plan 02's sizing target."
  - "Two-pass meta extraction (find tag, then content=) rather than single combined regex — Astro attribute order is template-declaration-dependent and single-regex approaches silently miss valid tags with reversed attribute order."
  - "Unicode property classes (\\p{L}\\p{N}) for word-boundary check — avoids ASCII-only bug if future language descriptions include Unicode word chars (currently all English, but future-proof)."
  - "Pattern-ignore reports in .gitignore + force-add one representative green-state baseline — follows the established Phase 122/123 convention so that subsequent local npm run build runs don't churn the git tree while the green-state baseline stays auditable."

patterns-established:
  - "Phase 125 verifier: zero-dep ESM, runs LAST in build chain, writes JSON to .planning/reports/, exits 1 with per-invariant hints on failure."
  - "Mid-word truncation detection: ellipsis is word-complete iff preceded by alphanumeric OR terminal punctuation (.,;!?) OR whitespace."

# Metrics
duration: 4 min
completed: 2026-04-16
---

# Phase 125 Plan 03: On-Page SEO Verifier Summary

**Build-time gate asserting all six Phase 125 invariants (blog pagination canonicals, dark-code title/description, Beauty Index 26-language descriptions with no mid-word truncation, dockerfile-analyzer description, feed-rss byte identity) — chained after verify-no-google-fonts.mjs as the last gate in `npm run build`.**

## Performance

- **Duration:** 4 min
- **Started:** 2026-04-16T22:59:05Z
- **Completed:** 2026-04-16T23:04:02Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments

- New `scripts/verify-on-page-seo.mjs` (~283 lines, zero-dep ESM) asserts all 6 Phase 125 invariants against `dist/` and exits 0 on the current shipped state with a concise single-line OK summary: `5 canonicals, dark-code title=57, 26/26 beauty-index in range, dockerfile=156, feed===rss.`
- Verifier wired into `npm run build` as the LAST gate — no `|| true` suppression, hard-fails on any regression of Plans 01/02 outputs.
- `npm run verify:on-page-seo` alias for targeted runs added.
- Force-break test confirmed: removing `dist/feed.xml` triggers exit 1 with actionable error `[6/6] feed.xml/rss.xml — dist/feed.xml missing` + hint pointing to `src/pages/feed.xml.ts`.
- Unit-tested the mid-word truncation detector against 9 cases (including the plan's canonical `"Python'…"` and `"C#…"` failures and 7 positive cases) — all pass.
- JSON report schema matches Plan 03 spec (generatedAt, invariants.{paginationCanonicals,darkCodeTitle,darkCodeDescription,beautyIndexDescriptions,dockerfileDescription,feedRssIdentical}, overallPass). One representative green-state baseline committed at `.planning/reports/on-page-seo-2026041623001.json`; timestamped per-run reports gitignored following the Phase 122/123 pattern.

## Task Commits

1. **Task 1: Create `scripts/verify-on-page-seo.mjs` with 6 invariants** — `bfc68dc` (feat)
2. **Task 2: Wire verifier into `npm run build`** — `2ee1023` (chore)

## Files Created/Modified

- `scripts/verify-on-page-seo.mjs` (new) — Zero-dep ESM verifier, ~283 lines, asserts 6 invariants, writes JSON report, exits 0/1 with actionable per-invariant hints.
- `package.json` — Appended `&& node scripts/verify-on-page-seo.mjs` to build chain AFTER verify-no-google-fonts.mjs; added `verify:on-page-seo` alias.
- `.gitignore` — Added `.planning/reports/on-page-seo-*.json` pattern to match the existing Phase 122/123 report-ignoring convention.
- `.planning/reports/on-page-seo-2026041623001.json` (new, force-added) — Representative green-state baseline report.

## Decisions Made

- **Skipped aggregate Beauty Index pages (`vs`, `code`, `justifications`):** The `vs` directory is the 650-page Phase 122 comparison corpus covered by `verify-vs-wordcount.mjs` and `verify-vs-overlap.mjs`. The `code` and `justifications` directories are shorter aggregate landing pages (descriptions 96 and 109 chars respectively) that were never targeted by Plan 02's [140, 160] sizing. Enumerating `dist/beauty-index/*/index.html` and filtering out these three names yields exactly 26 language slugs — matching the Plan 02 corpus.
- **Two-pass meta-description extraction:** A single combined regex (e.g., `/<meta name="description" content="([^"]*)">/`) is fragile because Astro template attribute order varies. Using `<meta\b[^>]*\bname="description"[^>]*>` to find the tag, then `\bcontent="([^"]*)"` to extract the value, is robust against any attribute permutation.
- **Unicode-aware word-boundary detection (`/[\p{L}\p{N}]/u`):** Handles future descriptions that may include Unicode letters. Current corpus is English-only, but hardcoding ASCII-only `[a-zA-Z0-9]` would create a silent bug if a non-English language slug is ever added.
- **Gitignore pattern-plus-force-add baseline:** Matches the established Phase 122/123 convention documented in the `.gitignore` comment block. Local `npm run build` runs won't churn the git tree, but one representative green-state report stays committed as an auditable baseline.

## Deviations from Plan

None - plan executed exactly as written.

The plan's Beauty Index description example cases ("Python's…") contained a minor ambiguity: the literal string has `s` (alphanumeric) before `…`, but the plan's stated rule says "the char immediately before `…` is `'`, `#`, or any non-alpha mid-word punctuation." I treated the stated RULE as authoritative (consistent with the plan's `"C#…"` example, which truly has `#` before `…`), and added a unit test confirming both the rule's canonical failures (`"Python'…"`, `"C#…"`) and its accepted cases (`"Python's…"` where the apostrophe+s forms a complete possessive). This is a test-coverage decision, not a deviation from plan output — the verifier implements exactly what the plan's rule described.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Phase 125 is now **3/3 plans complete**. All six Phase 125 invariants are asserted at build time; any future regression of Plans 01/02 outputs (canonicals, titles, descriptions, feed alias) hard-fails `npm run build` with an actionable hint pointing at the source file to edit.
- All 5 verifiers green on `rm -rf dist && npm run build` end-to-end.
- Ready for Phase 125 completion → Phase 126 (CSS investigation) becomes next candidate.
- Milestone v1.21 progresses to 11/11 plans (100%).

## Self-Check: PASSED

- FOUND `scripts/verify-on-page-seo.mjs`
- FOUND `.planning/reports/on-page-seo-2026041623001.json` (representative baseline)
- FOUND `.planning/phases/125-blog-pagination-and-on-page-seo-fixes/125-03-SUMMARY.md`
- FOUND commit `bfc68dc` (Task 1: verifier)
- FOUND commit `2ee1023` (Task 2: build chain wiring)
- FOUND `verify-on-page-seo.mjs` referenced in `package.json` (2 occurrences: build chain + alias)
- FOUND `.planning/reports/on-page-seo-*.json` pattern in `.gitignore`

---
*Phase: 125-blog-pagination-and-on-page-seo-fixes*
*Completed: 2026-04-16*
