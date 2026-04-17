---
phase: 126-css-investigation-and-remediation
plan: 01
subsystem: perf
tags: [css, rollup-plugin-visualizer, bundle-analysis, tailwind, astro, fontsource]

requires:
  - phase: 123-sitemap-determinism
    provides: byte-identical rebuild invariant that any new Vite plugin must not perturb
  - phase: 124-font-self-hosting
    provides: the @fontsource self-hosted font weight set measured in the homepage _slug_ chunk
  - phase: 125-on-page-seo
    provides: the verify-*.mjs zero-dep ESM pattern + .planning/reports/ convention + 1137 URL floor
provides:
  - Env-var-gated rollup-plugin-visualizer wiring in astro.config.mjs (ANALYZE=1)
  - build:analyze npm script alias
  - scripts/diagnose-homepage-css.mjs (zero-dep ESM supplement covering visualizer CSS gap bug #203)
  - Baseline homepage-css-2026041700200.json (force-added, permanent reference)
  - 126-DIAGNOSIS.md — 8-section rationale artefact with Option A recommendation
affects: [126-02, perf-audit-followups]

tech-stack:
  added:
    - rollup-plugin-visualizer@7 (already in devDependencies; now wired into the build conditionally)
  patterns:
    - "Env-var-gated Vite plugin via top-level await dynamic import in astro.config.mjs"
    - "emitFile: false forces filesystem write outside Rollup's asset pipeline, preserving dist/ determinism"
    - "Zero-dep ESM diagnosis script walking dist/**/index.html to build route→chunks map"

key-files:
  created:
    - scripts/diagnose-homepage-css.mjs
    - .planning/reports/homepage-css-2026041700200.json
    - .planning/phases/126-css-investigation-and-remediation/126-DIAGNOSIS.md
  modified:
    - astro.config.mjs (added ANALYZE-gated vite.plugins with two visualizer() calls)
    - package.json (added build:analyze script)
    - .gitignore (added 3 report patterns for .planning/reports/)

key-decisions:
  - "D1: Env-var-gated visualizer (ANALYZE=1) preserves Phase 123 byte-identical rebuild invariant"
  - "D2: Emit BOTH treemap HTML + raw-data JSON for human + programmatic review"
  - "D3: Ship a zero-dep supplement script covering rollup-plugin-visualizer CSS gap bug #203"
  - "D7: Force-add one representative homepage-css-*.json baseline (Phase 122/123/125 convention)"
  - "Recommendation: Option A (close with rationale) — aggregate best-case remediation is 3-5KB gzip, net ROI is low"

patterns-established:
  - "Pattern: ANALYZE=1 env-var gating for on-demand diagnostic plugins that must not affect default builds"
  - "Pattern: emitFile: false + .planning/reports/ filename for any build-time analyzer that must stay out of dist/"

duration: ~25min
completed: 2026-04-17
---

# Phase 126 Plan 01: CSS Investigation (Diagnosis) Summary

**Wired env-gated rollup-plugin-visualizer + zero-dep homepage-css diagnosis script, measured 2 shared chunks totaling 148,840 raw / 30,287 gzip / 25,307 brotli bytes loaded on every one of 1,184 routes, and produced 126-DIAGNOSIS.md recommending Option A (close with rationale) based on a full 6-lever evaluation.**

## Performance

- **Duration:** ~25 min
- **Started:** 2026-04-16T23:58:30Z (approximate — plan execution began after init)
- **Completed:** 2026-04-17T00:23:54Z (checkpoint reached)
- **Tasks executed:** 2 of 3 (Task 3 is the blocking operator checkpoint)
- **Files modified:** 3 (astro.config.mjs, package.json, .gitignore)
- **Files created:** 3 (diagnose-homepage-css.mjs, homepage-css baseline JSON, 126-DIAGNOSIS.md)

## Accomplishments

- **PERF-04 named tool delivered:** `rollup-plugin-visualizer` v7 wired into `astro.config.mjs` as two conditional `visualizer()` calls (treemap HTML + raw-data JSON), both gated behind `process.env.ANALYZE === '1'` via top-level `await import(...)`. Default builds never load the plugin.
- **PERF-04 CSS-gap supplement delivered:** `scripts/diagnose-homepage-css.mjs` (290 lines, zero external deps) walks `dist/**/index.html` to build a route→chunks map, measures per-chunk raw/gzip/brotli bytes + sha256 + leading/trailing samples + scoped-selector count + @font-face count + cross-route frequency, and emits structured JSON to `.planning/reports/`.
- **Phase 123 byte-identical rebuild invariant preserved:** Verified via sha256 comparison — `dist/sitemap-0.xml` produces identical sha (`8a3d1496b2b51f1af0d3122fbeb5acee07cc6a955b7c9c6bbad9913ed7251b8e`) across consecutive default builds AND after an `ANALYZE=1 npm run build` run. No visualizer output appeared in `dist/` (`find dist -name 'stats*' -o -name 'css-visualizer*'` returns empty).
- **Baseline committed:** `homepage-css-2026041700200.json` force-added to git as the permanent reference point for Plan 02's verifier.
- **126-DIAGNOSIS.md delivered:** 8 sections, 163 lines, with a concrete Option A recommendation backed by measured evidence and a full 6-lever evaluation table (2 REJECT / 4 DEFER).

## Measured Homepage CSS Totals (the core finding)

| Metric               | Value       |
| -------------------- | ----------- |
| Homepage chunk count | **2**       |
| Raw bytes total      | **148,840** |
| Gzip bytes total     | **30,287**  |
| Brotli bytes total   | **25,307**  |
| Routes scanned       | 1,184       |
| Unique site chunks   | 5           |

**Per-chunk breakdown:**

| Chunk                        | Raw    | Gzip   | Brotli | Routes | Content identity                         |
| ---------------------------- | ------ | ------ | ------ | ------ | ---------------------------------------- |
| `/_astro/about.C49NBCVn.css` | 62,243 | 10,881 | 9,103  | 1184   | Tailwind utility sheet                   |
| `/_astro/_slug_.CIgCJX9d.css` | 86,597 | 19,406 | 16,204 | 1184   | global.css + ClientRouter + 22 @font-face |

Both homepage chunks are site-wide shared (appear on every one of 1,184 routes), confirming Astro's first-alphabetical-consumer shared-chunk naming (the filenames `about.*.css` and `_slug_.*.css` are misleading — they are universal bundles).

## Task Commits

Each task was committed atomically:

1. **Task 1: Wire env-gated visualizer + create zero-dep supplement script + run both** — `b743bfa` (feat)
   - 6 files changed, 6,675 insertions (includes the baseline homepage-css JSON which inflates the line count)
   - astro.config.mjs + package.json + .gitignore + scripts/diagnose-homepage-css.mjs + force-added baseline + the 126-01-PLAN.md itself
2. **Task 2: Write 126-DIAGNOSIS.md synthesizing evidence with D1-D7 decision log** — `86842ad` (docs)
   - 1 file changed, 163 insertions
   - 8-section diagnosis with concrete Option A recommendation

**Task 3: Operator decision — Option A vs Option B** — NOT YET COMMITTED. Blocking checkpoint; operator must reply with `option-a`, `option-b lever=<N>`, or a directive to refine diagnosis. Plan 02 does not start until the operator selects a branch.

## Files Created/Modified

- **`astro.config.mjs`** — Added `const ANALYZE = process.env.ANALYZE === '1'` + `const ANALYZE_STAMP` timestamp + appended `vite: ANALYZE ? { plugins: [...] } : {}` after `markdown:` block. Two `(await import('rollup-plugin-visualizer')).visualizer({...})` calls with `emitFile: false` + filenames under `.planning/reports/`.
- **`package.json`** — Added `"build:analyze": "ANALYZE=1 npm run build"` alias.
- **`.gitignore`** — Added 3 patterns: `css-visualizer-*.html`, `css-visualizer-*.json`, `homepage-css-*.json` (all under `.planning/reports/`). Force-added baseline is not affected by gitignore.
- **`scripts/diagnose-homepage-css.mjs`** — NEW. 290-line zero-dep ESM (only imports from `node:fs`, `node:path`, `node:zlib`, `node:crypto`). Reads `dist/**/index.html`, builds route→chunks map, measures each unique chunk, emits JSON to `.planning/reports/homepage-css-{stamp}.json`. Exit 0 always on success.
- **`.planning/reports/homepage-css-2026041700200.json`** — Force-added baseline. Contains `summary` (totals), `homepageChunks` (2-entry detailed measurements), `allChunksByFrequency` (5-entry site-wide view), and `routeChunkMap` (1,184 entries).
- **`.planning/phases/126-css-investigation-and-remediation/126-DIAGNOSIS.md`** — NEW. 8-section permanent rationale artefact (see full contents). Recommends Option A.

## Decisions Made

**D1-D7 decision log fully recorded in 126-DIAGNOSIS.md § 6.** Highlights:

- **D1 (env-gated visualizer):** chose `ANALYZE=1` gate to preserve Phase 123 byte-identical rebuild invariant. Verified: sha unchanged across default/default and default/analyze build pairs.
- **D2 (report format):** both treemap HTML (human) and raw-data JSON (programmatic) — zero marginal cost, covers both review modes.
- **D3 (zero-dep supplement script):** shipped. Covers `rollup-plugin-visualizer` CSS gap (upstream issue #203). Matches Phase 122/123/124/125 verifier convention.
- **D7 (force-add baseline JSON):** yes. `homepage-css-2026041700200.json` is the reference point Plan 02's verifier will diff against.
- **Recommendation:** Option A (close with rationale). 148KB raw / 30KB gzip is textbook Tailwind+Astro shared-chunk behavior. Aggregate best-case remediation (Levers 1+2+5+6 combined) is 3-5KB gzip — 0.2% of total page weight once images + JS are counted. Levers 3 and 4 are strict REJECT (175MB HTML growth / breaks ClientRouter).

## Deviations from Plan

None of significance. Two minor observations, neither requiring a deviation:

1. **Visualizer plugin re-ran during the sitemap-determinism verifier's second astro build.** The verifier inherits `ANALYZE=1` via `process.env` when invoked through `npm run build`, so a second set of `css-visualizer-*.{html,json}` files appeared with a slightly later timestamp. This is harmless — both sets land in `.planning/reports/`, not `dist/`, and the sitemap-0.xml sha stayed identical across both runs, proving determinism survives. Plan 02 could consider suppressing this via `ANALYZE=` in the verifier's exec env if the extra files become noise; out of scope for Plan 01.
2. **`totalRoutesScanned: 1184` in the diagnose output.** The sitemap's `<loc>` count is 1,137 after Phase 125's TSEO-03 + TSEO-05 exclusions; the dist/ filesystem still contains 1,184 `index.html` files (pagination + sparse-tag pages exist on disk but are filtered out of the sitemap). This is not a bug — the diagnose script walks the filesystem, not the sitemap — and it is what we want for CSS coverage accounting.

**Total deviations:** 0 auto-fixed
**Impact on plan:** Plan executed exactly as written.

## Issues Encountered

None. First analyze build and first diagnose run both worked on first try. All 16 Task 1 verification checks + all 6 Task 2 verification checks passed.

## Checkpoint State (for orchestrator / operator)

Plan 01 ended at `<task type="checkpoint:decision" gate="blocking">`. **Plan 02 has NOT been started.**

**Operator must reply with one of:**

- `option-a` — close with rationale. Plan 02 will add `scripts/verify-homepage-css-budget.mjs` locking the measured numbers as a build-time ceiling (chunkCount===2, rawBytes ≤ 160000, gzipBytes ≤ 33000, brotliBytes ≤ 28000 — all with 7-10% headroom above current baseline), wire it into `npm run build`, and commit the baseline + DIAGNOSIS as the permanent audit-response artefacts.
- `option-b lever=<N>` — remediate lever N from 126-DIAGNOSIS.md § 5. On measured evidence, **only Lever 2 (`@fontsource/*` weight audit)** is defensible (22 `@font-face` blocks → ~1-2KB gzip saving, low Phase 123 risk). Levers 1/5/6 yield smaller marginal saves with harder rollback surfaces. Levers 3/4 are strict REJECT.
- Any other directive (e.g., "re-run diagnosis with more routes", "rebuild analyzer report with sunburst template").

**Recommended path (researcher + diagnoser concur):** `option-a`.

## Next Phase Readiness

- ✅ Evidence artefacts all in place (baseline JSON + diagnosis doc + visualizer reports).
- ✅ Phase 123 invariant preserved — Plan 02 can safely touch `astro.config.mjs` or `tailwind.config.mjs` without pre-existing determinism regressions from Plan 01.
- ✅ `scripts/diagnose-homepage-css.mjs` is available for Plan 02 to re-run (on Option B, to compare post-fix numbers against the committed baseline).
- ⏸ **Blocked:** Plan 02 cannot start until the operator selects a branch at the checkpoint.

## Self-Check

Verification of claims above:

- `test -f astro.config.mjs` → FOUND
- `test -f package.json` → FOUND
- `test -f .gitignore` → FOUND
- `test -f scripts/diagnose-homepage-css.mjs` → FOUND
- `test -f .planning/reports/homepage-css-2026041700200.json` → FOUND (force-added)
- `test -f .planning/phases/126-css-investigation-and-remediation/126-DIAGNOSIS.md` → FOUND
- `git log --oneline | grep b743bfa` → FOUND (Task 1)
- `git log --oneline | grep 86842ad` → FOUND (Task 2)

## Self-Check: PASSED

---
*Phase: 126-css-investigation-and-remediation*
*Plan: 01*
*Completed: 2026-04-17 (blocking checkpoint reached)*
