---
phase: 126-css-investigation-and-remediation
verified: 2026-04-16T23:59:00Z
status: passed
score: 3/3
overrides_applied: 0
re_verification: false
---

# Phase 126: CSS Investigation and Remediation Verification Report

**Phase Goal:** The homepage CSS bundle is understood and remediated if diagnosis reveals unnecessary cross-route CSS loading
**Verified:** 2026-04-16T23:59:00Z
**Status:** passed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | A rollup-plugin-visualizer report exists showing CSS chunk composition for the homepage | VERIFIED | `.planning/reports/css-visualizer-2026041700184.html` (692KB treemap) and `.planning/reports/css-visualizer-2026041700184.json` (978KB raw-data) both exist on disk; emitted by `ANALYZE=1 npm run build` via the env-gated conditional in `astro.config.mjs` |
| 2 | If cross-route CSS was loading unnecessarily, the fix reduces homepage CSS below the pre-investigation baseline | VERIFIED (N/A — operator chose Option A) | Diagnosis found CSS is NOT loading unnecessarily; SC #2 condition does not apply. SC #3 applies instead. Operator checkpoint explicitly chose Option A per 126-01-SUMMARY.md. |
| 3 | If 132KB is correct shared-chunk behavior, the investigation closes with documented rationale | VERIFIED | `126-DIAGNOSIS.md` (163 lines, 8 sections) provides measured evidence (148,840 raw / 30,287 gzip), identifies both shared chunks by content, explains why they load on all 1,184 routes, evaluates all 6 remediation levers (2 REJECT / 4 DEFER), and explicitly states "Option A — Close with rationale". A build-time budget verifier (`scripts/verify-homepage-css-budget.mjs`) locks the current baseline as a hard ceiling. |

**Score:** 3/3 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `.planning/reports/css-visualizer-2026041700184.html` | rollup-plugin-visualizer treemap | VERIFIED | 692KB HTML treemap; substantive |
| `.planning/reports/css-visualizer-2026041700184.json` | rollup-plugin-visualizer raw-data JSON | VERIFIED | 978KB JSON; substantive |
| `.planning/reports/homepage-css-2026041700200.json` | Committed baseline with homepageRawBytes and chunk data | VERIFIED | 165KB JSON; tracked in git (`git ls-files` returns 1); contains `homepageChunkCount: 2`, `homepageRawBytes: 148840`, `homepageGzipBytes: 30287`, `homepageChunks` array length 2 |
| `.planning/phases/126-css-investigation-and-remediation/126-DIAGNOSIS.md` | Rationale doc with measured numbers and Option A stated | VERIFIED | 163 lines, 8 sections (`## 1` through `## 8`); references `homepage-css-2026041700200.json`; numbers match baseline JSON exactly (148,840 / 30,287 / 25,307); D1-D7 all present (9+ mentions); Section 7 states "Option A — Close with rationale" explicitly |
| `scripts/diagnose-homepage-css.mjs` | Zero-dep CSS inspector, min 100 lines | VERIFIED | 290 lines; shebang `#!/usr/bin/env node`; imports only `node:fs`, `node:path`, `node:zlib`, `node:crypto`; reads `dist/**/index.html` via `readFileSync` |
| `scripts/verify-homepage-css-budget.mjs` | Build-time budget gate, 4 invariants | VERIFIED | 299 lines; shebang present; zero-dep (imports only `node:fs`, `node:path`, `node:zlib`); asserts all 4 invariants (chunk count, per-chunk raw, total raw, total gzip); behavioral spot-check exits 0 with `[homepage-css-budget] OK — 2 chunks, totalRaw=148840/156282 bytes (95.2%), totalGzip=30287/31802 bytes (95.2%)` |
| `astro.config.mjs` | ANALYZE=1 env-gated visualizer wiring | VERIFIED | `const ANALYZE = process.env.ANALYZE === '1'` (line 20); two `visualizer()` calls inside the ternary (lines 105, 114); both use `emitFile: false` and write to `.planning/reports/` paths; conditional resolves to `{}` on default builds |
| `package.json` build chain | `verify-homepage-css-budget.mjs` as LAST gate after `verify-on-page-seo.mjs` | VERIFIED | Build chain confirmed: `verify-on-page-seo.mjs` at position 196, `verify-homepage-css-budget.mjs` at position 235, is the final entry (chain ends with `.mjs"`); `build:analyze` alias present; `verify:homepage-css-budget` alias present |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `astro.config.mjs` vite.plugins | `rollup-plugin-visualizer` | `process.env.ANALYZE === '1'` conditional + dynamic `import()` | WIRED | Conditional present at line 20; dynamic imports at lines 105 and 114; verified by grep: 3 occurrences of `rollup-plugin-visualizer`, 1 of `ANALYZE === '1'` |
| `package.json` `build:analyze` | `ANALYZE=1 npm run build` | shell env prefix | WIRED | `"build:analyze": "ANALYZE=1 npm run build"` present |
| `scripts/diagnose-homepage-css.mjs` | `dist/**/index.html` + `dist/_astro/*.css` | `readFileSync` + regex CSS link extraction | WIRED | `readFileSync.*dist` pattern found in script |
| `126-DIAGNOSIS.md` | `scripts/diagnose-homepage-css.mjs` output JSON | embedded numbers + references to `homepage-css-{stamp}.json` | WIRED | References `homepage-css-2026041700200.json` 3 times; all numbers in diagnosis match the committed JSON exactly |
| `package.json` build script | `scripts/verify-homepage-css-budget.mjs` | shell chain after `verify-on-page-seo.mjs` | WIRED | Confirmed as last entry in build chain |
| `scripts/verify-homepage-css-budget.mjs` | `dist/index.html` + `dist/_astro/*.css` | `readFileSync` + gzipSync + regex | WIRED | `readFileSync.*dist` pattern found; `BASELINE_FILENAME = 'homepage-css-2026041700200.json'` hardcoded at line 57 |
| `scripts/verify-homepage-css-budget.mjs` | `.planning/reports/homepage-css-2026041700200.json` | `readFileSync` at startup | WIRED | Hard-coded baseline filename; baseline read confirmed by behavioral spot-check (exit 0) |

### Data-Flow Trace (Level 4)

Scripts are diagnostic/verification tools (not React components rendering dynamic data). Data-flow trace applies differently:

| Script | Data Variable | Source | Produces Real Data | Status |
|--------|---------------|--------|--------------------|--------|
| `verify-homepage-css-budget.mjs` | `currentChunks` (live CSS hrefs from dist/) | `readFileSync('dist/index.html')` + `gzipSync` | Yes — reads actual built CSS files | FLOWING |
| `verify-homepage-css-budget.mjs` | `baseline` (ceiling source) | `readFileSync('.planning/reports/homepage-css-2026041700200.json')` | Yes — reads committed baseline with real measurements | FLOWING |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Budget verifier passes on current dist/ | `node scripts/verify-homepage-css-budget.mjs` | Exit 0; `OK — 2 chunks, totalRaw=148840/156282 bytes (95.2%), totalGzip=30287/31802 bytes (95.2%)` | PASS |
| Budget verifier is last gate in build chain | Parse `package.json` build script | `verify-homepage-css-budget.mjs` at position 235 (after on-page-seo at 196); is final entry | PASS |
| Baseline JSON parses and has expected fields | `node -e JSON.parse(readFileSync(...))` | `homepageChunkCount: 2`, `homepageRawBytes: 148840`, `homepageGzipBytes: 30287`, `chunks.length: 2` | PASS |
| No visualizer artifacts in dist/ | `ls dist/ | grep css-visualizer` | CLEAN — no results | PASS |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|---------|
| PERF-04 | 126-01-PLAN.md | Homepage CSS bundle diagnosed with rollup-plugin-visualizer | SATISFIED | Treemap HTML (692KB) + raw-data JSON (978KB) in `.planning/reports/`; REQUIREMENTS.md marks `[x] PERF-04` |
| PERF-05 | 126-02-PLAN.md | Homepage CSS bloat remediated if diagnosis shows unnecessary cross-route CSS loading | SATISFIED (Option A) | Diagnosis established CSS loading is NOT unnecessary; investigation closed with documented rationale in 126-DIAGNOSIS.md + budget verifier enforcing baseline ceiling; REQUIREMENTS.md marks `[x] PERF-05` |

### Anti-Patterns Found

No anti-patterns found in key artifacts. Grep for `TODO`, `FIXME`, `PLACEHOLDER`, `placeholder`, `coming soon`, `not yet implemented` across `verify-homepage-css-budget.mjs`, `diagnose-homepage-css.mjs`, and `126-DIAGNOSIS.md` returned zero results.

One observation (non-blocking): `ANALYZE_STAMP` is computed at module parse time on every `astro build` (including default builds without `ANALYZE=1`). It evaluates `new Date().toISOString()...` as a pure JS expression assigned to a `const` — no disk writes occur; the variable is only referenced inside the `ANALYZE ? {...} : {}` conditional. The Phase 123 invariant (byte-identical `dist/sitemap-0.xml`) is not affected because the stamp never enters the Rollup pipeline on default builds. Confirmed by the sha256 evidence in 126-01-SUMMARY.md and the Plan 02 negative test #4.

### Human Verification Required

None. All success criteria are verifiable programmatically for this phase:
- SC #1 (visualizer report exists): file existence and size confirmed
- SC #2 (N/A): operator decision (Option A) documented in SUMMARY
- SC #3 (close with rationale): DIAGNOSIS.md content verified programmatically; budget verifier passes

### Gaps Summary

No gaps. All three ROADMAP success criteria are satisfied:

1. SC #1 is met by the `css-visualizer-2026041700184.{html,json}` reports in `.planning/reports/`.
2. SC #2 is N/A — the diagnosis found no unnecessary CSS loading (every CSS byte is shared globally and cached immutably across all 1,184 routes). The operator chose Option A at the blocking checkpoint.
3. SC #3 is met by `126-DIAGNOSIS.md` (163 lines, explicit "Option A" verdict, all measured numbers matching the committed baseline JSON) and locked in by `scripts/verify-homepage-css-budget.mjs` as the 6th and final gate in `npm run build`.

Git commits: `b743bfa` (Plan 01 investigation artifacts), `86842ad` (DIAGNOSIS.md), `93c202e` (budget verifier + build chain wiring) — all present in git log.

---

_Verified: 2026-04-16T23:59:00Z_
_Verifier: Claude (gsd-verifier)_
