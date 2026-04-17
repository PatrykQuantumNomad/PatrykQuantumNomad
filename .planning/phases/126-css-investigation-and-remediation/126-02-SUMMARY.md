---
phase: 126-css-investigation-and-remediation
plan: 02
subsystem: perf
tags: [css, budget-verifier, build-gate, tailwind, astro, zero-dep]

requires:
  - phase: 126-css-investigation-and-remediation
    plan: 01
    provides: committed homepage-css-2026041700200.json baseline + 126-DIAGNOSIS.md with Option A recommendation
  - phase: 123-sitemap-determinism
    provides: byte-identical rebuild invariant that the new verifier must not perturb
  - phase: 125-on-page-seo
    provides: verify-on-page-seo.mjs pattern + build chain position (new verifier appends AFTER it)
provides:
  - scripts/verify-homepage-css-budget.mjs (zero-dep ESM, 299 lines, 4 invariants)
  - package.json build chain with 6 verifiers (homepage-css-budget as last gate)
  - verify:homepage-css-budget npm alias
affects: [future-css-changes, tailwind-config-edits, font-config-edits]

tech-stack:
  added: []
  patterns:
    - "Hard-coded BASELINE_FILENAME const for deterministic ceiling resolution (avoids silently reading newer timestamped reports)"
    - "stableName() helper strips content-hash suffix for cross-build chunk matching (about.C49NBCVn.css -> about.css)"
    - "Per-chunk headroom (2%) + total headroom (5%) — tight enough to catch 5KB+ bloat, lenient for Tailwind churn"

key-files:
  created:
    - scripts/verify-homepage-css-budget.mjs
  modified:
    - package.json (build chain + verify alias)

key-decisions:
  - "Option A chosen at Plan 01 checkpoint: no CSS source remediation, budget locks current baseline"
  - "Hard-coded BASELINE_FILENAME instead of lexicographic-first glob — deterministic, fails loudly if baseline renamed"
  - "Per-chunk headroom 2%, total headroom 5% — balances bloat detection sensitivity vs normal churn tolerance"
  - "Verifier reads baseline at startup, not at build-chain invocation — keeps ceiling stable regardless of local diagnose reruns"

patterns-established:
  - "Pattern: 6-verifier build chain (wordcount, overlap, sitemap-determinism, no-google-fonts, on-page-seo, homepage-css-budget) — each zero-dep ESM, each exits 1 on failure with actionable hints"

requirements-completed: [PERF-04, PERF-05]

duration: ~15min
completed: 2026-04-17
---

# Phase 126 Plan 02: CSS Budget Verifier Summary

**Zero-dep build-time CSS budget gate locking homepage at 2 chunks / 148,840 raw / 30,287 gzip bytes with 2% per-chunk and 5% total headroom, wired as the 6th and last verifier in npm run build -- Option A (close with rationale) path taken, no source remediation.**

## Performance

- **Duration:** ~15 min
- **Started:** 2026-04-17T10:59:23Z
- **Completed:** 2026-04-17T11:10:00Z
- **Tasks:** 2 (Task 1 was a no-op validation under Option A)
- **Files created:** 1 (scripts/verify-homepage-css-budget.mjs)
- **Files modified:** 1 (package.json)

## Accomplishments

- **Option A confirmed:** No CSS source changes needed. Plan 01 baseline (148,840 raw / 30,287 gzip / 2 chunks) remains the green-state truth, backed by 126-DIAGNOSIS.md rationale (30KB gzip is textbook Tailwind+Astro shared-chunk behavior; best-case remediation yields only 3-5KB gzip saving at high cost).
- **Budget verifier shipped:** `scripts/verify-homepage-css-budget.mjs` (299 lines, zero external deps) asserts 4 independent invariants — chunk count stable, per-chunk raw ceiling (2%), total raw ceiling (5%), total gzip ceiling (5%).
- **Build chain complete:** 6 verifiers now gate every `npm run build`, with homepage-css-budget as the last gate.
- **4/4 negative tests pass:** Budget enforcement (5KB bloat detected), missing baseline (clear error), chunk count drift (inlineStylesheets detected), determinism preserved (byte-identical sitemap-0.xml across consecutive builds).
- **Phase 123 invariant preserved:** Two consecutive `npm run build` runs produce byte-identical `dist/sitemap-0.xml`.

## Task Commits

Each task was committed atomically:

1. **Task 1: Execute chosen remediation path (Option A: no-op validation)** -- No commit (no files changed; Option A means no source edits)
2. **Task 2: Create scripts/verify-homepage-css-budget.mjs + wire into npm run build** -- `93c202e` (feat)

## Files Created/Modified

- **`scripts/verify-homepage-css-budget.mjs`** -- NEW. 299-line zero-dep ESM verifier (imports only node:fs, node:path, node:zlib). Hard-codes `BASELINE_FILENAME = 'homepage-css-2026041700200.json'` for deterministic ceiling resolution. Asserts 4 invariants against dist/index.html CSS `<link>` tags. Writes JSON report to `.planning/reports/homepage-css-budget-{stamp}.json`. Exit 0 with summary on pass; exit 1 with per-invariant diagnostics + hints on failure.
- **`package.json`** -- Build script appended with `&& node scripts/verify-homepage-css-budget.mjs` (last gate). Added `"verify:homepage-css-budget"` npm alias.

## Budget Ceilings (from baseline + headroom)

| Metric | Baseline | Ceiling | Headroom |
|--------|----------|---------|----------|
| Chunk count | 2 | 2 (exact) | 0% |
| Per-chunk raw (about.css) | 62,243 | 63,488 | 2% |
| Per-chunk raw (_slug_.css) | 86,597 | 88,329 | 2% |
| Total raw | 148,840 | 156,282 | 5% |
| Total gzip | 30,287 | 31,802 | 5% |

## Negative Test Results

| # | Test | Result | Evidence |
|---|------|--------|----------|
| 1 | Budget enforcement (5KB bloat in global.css) | PASS -- exit 1, `chunk "_slug_.css" grew from 86597 to 91670 bytes (+5073, 5.9% > 2% ceiling)` | Reverted after test |
| 2 | Missing baseline | PASS -- exit 1, `no baseline found at ...homepage-css-2026041700200.json` | Restored after test |
| 3 | Chunk count drift (inlineStylesheets: 'always') | PASS -- exit 1, `homepage now loads 0 chunks (was 2)` | Reverted after test |
| 4 | Determinism preserved | PASS -- two consecutive `npm run build` produce byte-identical `dist/sitemap-0.xml` | sha256 match confirmed |

## Decisions Made

- **Option A (close with rationale):** Chosen by operator at Plan 01 checkpoint. 126-DIAGNOSIS.md documents that 30KB gzip across 1,184 cached-immutably routes is textbook shared-chunk behavior; remediation ROI is 3-5KB gzip at multi-day cost.
- **Hard-coded baseline filename:** `BASELINE_FILENAME = 'homepage-css-2026041700200.json'` instead of lexicographic-first glob. Fails loudly if baseline is renamed. Update path is documented in verifier hints.
- **Headroom constants:** 2% per-chunk (catches 5KB+ single-chunk bloat from new utility/font import), 5% total (absorbs normal content-driven growth across multiple chunks without hiding silent CSS bloat).

## Deviations from Plan

None -- plan executed exactly as written. Option A path was a straightforward no-op validation + verifier authoring.

## Issues Encountered

None.

## User Setup Required

None -- no external service configuration required.

## Next Phase Readiness

- Phase 126 is COMPLETE. All 2/2 plans shipped.
- Milestone v1.21 is COMPLETE. All 13/13 plans across Phases 122-126 shipped.
- The 6-verifier build chain now gates every `npm run build`:
  1. verify-vs-wordcount (Phase 122)
  2. verify-vs-overlap (Phase 122)
  3. verify-sitemap-determinism (Phase 123)
  4. verify-no-google-fonts (Phase 124)
  5. verify-on-page-seo (Phase 125)
  6. verify-homepage-css-budget (Phase 126)

## Self-Check

Verification of claims above:

- `test -f scripts/verify-homepage-css-budget.mjs` -- FOUND
- `test -f package.json` -- FOUND
- `git log --oneline | grep 93c202e` -- FOUND

## Self-Check: PASSED

---
*Phase: 126-css-investigation-and-remediation*
*Plan: 02*
*Completed: 2026-04-17*
