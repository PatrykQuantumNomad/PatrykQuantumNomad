---
phase: 123-sitemap-lastmod
plan: 03
subsystem: sitemap-lastmod-verifier
tags:
  - sitemap
  - lastmod
  - determinism
  - verifier
  - build-gate
  - zero-dep
dependency_graph:
  requires:
    - "src/lib/sitemap/* — Plan 01 + Plan 02 shipped the coverage this verifier gates"
    - "dist/sitemap-0.xml, dist/sitemap-index.xml — produced by @astrojs/sitemap"
    - "package.json build-script chain (vs-wordcount → vs-overlap → sitemap-determinism)"
  provides:
    - "Build-time coverage + determinism gate for sitemap (LOC_FLOOR=1184, LASTMOD_COVERAGE_FLOOR=1120, byte-identical rebuild)"
    - "scripts/verify-sitemap-determinism.mjs — zero-dep ESM verifier"
    - "verify:sitemap-determinism npm convenience script"
    - "JSON report artifact under .planning/reports/sitemap-determinism-*.json"
  affects:
    - "Any future edit to src/lib/sitemap/ that reintroduces new Date()/Date.now()/statSync — fails CI with byte-offset diff surround"
    - "Any new URL category that forgets to register a date source — fails CI with lastmod/loc mismatch"
    - "Any getStaticPaths filter change that silently drops URLs below LOC_FLOOR — fails CI with URL-count regression"
tech_stack:
  added: []
  patterns:
    - "Zero-dep ESM verifier chained into `npm run build` (matches Phase 122 P03 style exactly)"
    - "Three independent coverage invariants with separate failure diagnostics (locFloorOk, lastmodPerUrlOk, lastmodFloorOk) — splits what would otherwise be a combined check that could silently pass on URL regressions"
    - "Second-build determinism via `npx astro build` (bypasses npm-run-build chain → no recursion)"
    - "Diff localisation: first-differing-byte offset + 100-char surround emitted on non-determinism for operator triage"
    - "Reports written ONLY to .planning/reports/ (never dist/) to preserve the very determinism property being verified"
key_files:
  created:
    - "scripts/verify-sitemap-determinism.mjs (216 lines, zero-dep, Node built-ins only)"
    - ".planning/reports/sitemap-determinism-2026041613455.json (baseline green-state report)"
    - ".planning/phases/123-sitemap-lastmod/123-03-SUMMARY.md"
  modified:
    - "package.json (build-script chain extended; verify:sitemap-determinism convenience script added)"
    - ".gitignore (ignore future-timestamped verifier reports; committed baselines remain tracked)"
decisions:
  - "Two independent floors (LOC_FLOOR=1184 + LASTMOD_COVERAGE_FLOOR=1120) rather than a combined per-URL-equality check; negative test #4 proved the combined check would have silently greenlit a 534-URL sitemap because survivors all had lastmods"
  - "Verifier uses `npx astro build` not `npm run build` for the second build — avoids infinite recursion into the verifier chain"
  - "Reports land in .planning/reports/ not dist/ — writing to dist/ would itself break sitemap determinism (report filename contains a timestamp)"
  - "Allowed `new Date()` usages are limited to report filename stamp (line 126) and `generatedAt` report field (line 129); both flow only to .planning/reports/, never dist/"
  - "Per-build verifier reports added to .gitignore while already-committed baselines remain tracked (precedent: Phase 122 P03's 1147 reports)"
metrics:
  duration: "~22 minutes"
  completed: "2026-04-16T13:47:00Z"
---

# Phase 123 Plan 03: Sitemap coverage + determinism build-time verifier Summary

## One-liner

Zero-dep ESM verifier enforcing 1184-URL LOC_FLOOR, per-URL lastmod coverage, defensive LASTMOD_COVERAGE_FLOOR (1120), and byte-identical consecutive-build sitemap via sha256 — chained into `npm run build` after the Phase 122 VS verifiers.

## What shipped

- **`scripts/verify-sitemap-determinism.mjs`** — 216-line zero-dep ESM verifier (Node built-ins only: `node:fs`, `node:crypto`, `node:child_process`, `node:path`). Asserts three independent coverage invariants plus determinism across two consecutive `astro build` invocations.
- **`package.json`** — build-script chain extended to `astro build && node scripts/verify-vs-wordcount.mjs && node scripts/verify-vs-overlap.mjs && node scripts/verify-sitemap-determinism.mjs`. New `verify:sitemap-determinism` convenience script for local iteration without a fresh astro build.
- **`.gitignore`** — per-build timestamped reports ignored; committed baselines (Phase 122 1147 reports, Phase 123 P03 1345 report) remain tracked.

## `npm run build` tail (30 lines, final green-state run)

```
  1558  .../dist/beauty-index/vs/cpp-vs-csharp/index.html
  1558  .../dist/beauty-index/vs/cpp-vs-elixir/index.html
[VS-06] sampled 20 of 650 pages (seed=20260416): max Jaccard=0.252, mean=0.056, p95=0.205.
[VS-06] Report: .../.planning/reports/vs-overlap-20260416-1345.json
[sitemap-determinism] running second astro build for determinism comparison...
[sitemap] foundations/assumptions: frontmatter date absent, using git log (2026-03-01T22:46:24.000Z)
[sitemap] foundations/problem-categories: frontmatter date absent, using git log (2026-03-01T22:46:24.000Z)
[sitemap] foundations/role-of-graphics: frontmatter date absent, using git log (2026-03-01T22:46:24.000Z)
[sitemap] foundations/the-4-plot: frontmatter date absent, using git log (2026-03-01T22:46:24.000Z)
[sitemap] foundations/what-is-eda: frontmatter date absent, using git log (2026-03-01T22:46:24.000Z)
[sitemap] foundations/when-assumptions-fail: frontmatter date absent, using git log (2026-03-01T22:46:24.000Z)
[sitemap] case-studies/beam-deflections: frontmatter date absent, using git log (2026-02-27T12:31:37.000Z)
[sitemap] case-studies/ceramic-strength: frontmatter date absent, using git log (2026-03-01T22:46:24.000Z)
[sitemap] case-studies/cryothermometry: frontmatter date absent, using git log (2026-02-27T00:47:58.000Z)
[sitemap] case-studies/fatigue-life: frontmatter date absent, using git log (2026-02-27T14:04:47.000Z)
[sitemap] case-studies/filter-transmittance: frontmatter date absent, using git log (2026-02-27T00:51:45.000Z)
[sitemap] case-studies/heat-flow-meter: frontmatter date absent, using git log (2026-02-27T00:48:39.000Z)
[sitemap] case-studies/normal-random-numbers: frontmatter date absent, using git log (2026-02-27T00:47:34.000Z)
[sitemap] case-studies/random-walk: frontmatter date absent, using git log (2026-03-01T22:46:24.000Z)
[sitemap] case-studies/standard-resistor: frontmatter date absent, using git log (2026-02-27T11:22:07.000Z)
[sitemap] case-studies/uniform-random-numbers: frontmatter date absent, using git log (2026-03-01T22:46:24.000Z)
[sitemap] reference/analysis-questions: frontmatter date absent, using git log (2026-02-25T14:53:48.000Z)
[sitemap] reference/distribution-tables: frontmatter date absent, using git log (2026-03-01T22:46:24.000Z)
[sitemap] reference/related-distributions: frontmatter date absent, using git log (2026-02-25T14:53:48.000Z)
[sitemap] reference/techniques-by-category: frontmatter date absent, using git log (2026-02-25T14:53:48.000Z)
[sitemap-determinism] report: .../.planning/reports/sitemap-determinism-2026041613455.json
[coverage] <loc>=1184 <lastmod>=1184
[determinism] sitemap-0.xml: OK
[determinism] sitemap-index.xml: OK
[sitemap-determinism] OK — 1184 URLs, all with lastmod, deterministic across rebuilds.
```

Exit code: 0. Full chain passed: `VS-07 (wordcount) → VS-06 (overlap) → sitemap-determinism`.

## Determinism report — top-level fields

From `.planning/reports/sitemap-determinism-2026041613455.json` (committed baseline):

| Field | Value |
|-------|-------|
| `sitemap0.firstHash`  | `dcbc444bf6a6744178c05e939c055ba9cdd7d65ee1a17c5bdf54eff9bd1965e2` |
| `sitemap0.secondHash` | `dcbc444bf6a6744178c05e939c055ba9cdd7d65ee1a17c5bdf54eff9bd1965e2` |
| `sitemap0.deterministic` | `true` |
| `sitemap0.sizeBytes` | 210526 |
| `sitemap0.locCount` | **1184** |
| `sitemap0.lastmodCount` | **1184** |
| `sitemap0.locFloor` | 1184 |
| `sitemap0.lastmodCoverageFloor` | 1120 |
| `sitemap0.locFloorOk` | `true` |
| `sitemap0.lastmodPerUrlOk` | `true` |
| `sitemap0.lastmodFloorOk` | `true` |
| `sitemap0.coverageOk` | **`true`** |
| `sitemapIndex.firstHash`  | `3708774f05f4c28c0332cbc534c5e11b4409ddd379dc88ee43d1cb9cbdcf96f8` |
| `sitemapIndex.secondHash` | `3708774f05f4c28c0332cbc534c5e11b4409ddd379dc88ee43d1cb9cbdcf96f8` |
| `sitemapIndex.deterministic` | `true` |

The `dcbc444b...965e2` hash matches the stamp cited in Plan 02's SUMMARY — confirms end-to-end stability between Plan 02 completion and Plan 03 gate installation.

## Negative tests (4/4 acceptance)

All four negative tests from the plan's `<verify>` section were executed exactly as written, the verifier caught each failure mode with the exact diagnostic, and the injection was reverted before proceeding to the next test.

### Test 3 — Determinism injection (`new Date().toISOString()` on a static URL)

**Injection:** `src/lib/sitemap/content-dates.ts` line 89, added `map.set(\`${SITE}/\`, new Date().toISOString());` after the STATIC_PAGE_DATES loop.

**Verifier caught:** Exit 1. Stdout/stderr:
```
[coverage] <loc>=1184 <lastmod>=1184
[determinism] sitemap-0.xml: DIFFERS
[determinism] sitemap-index.xml: OK
[sitemap-determinism] FAIL — sitemap-0.xml differs between consecutive builds.
  First diff at byte offset 391.
  See .firstDiffSurround in .../.planning/reports/sitemap-determinism-2026041613290.json.
  Hint: grep src/lib/sitemap/ for `new Date()`, `Date.now()`, or `statSync().mtime`.
```

**Report evidence:** `sitemap0.firstHash=0a432eff...` vs `sitemap0.secondHash=880d24fd...`, `deterministic: false`, `firstDiffOffset: 391`. `firstDiffSurround.first` contains `<lastmod>2026-04-16T13:27:35.427Z</lastmod>` for the homepage; `firstDiffSurround.second` contains `<lastmod>2026-04-16T13:28:21.140Z</lastmod>` — exactly the two timestamps from the two consecutive builds' `new Date()` calls. The diff-surround mechanism pinpoints the offending URL (the `/` homepage) and the offending field (`<lastmod>`) unambiguously.

**Revert:** `git diff src/lib/sitemap/content-dates.ts` returned empty; subsequent clean `npm run build` exit 0.

### Test 4 — URL regression (hard LOC_FLOOR)

**Injection:** `astro.config.mjs` filter: `(page) => !page.includes('/404') && !page.includes('/beauty-index/vs/')` — drops all 650 VS pages.

**Verifier caught:** Exit 1.
```
[coverage] <loc>=534 <lastmod>=534
[determinism] sitemap-0.xml: OK
[determinism] sitemap-index.xml: OK
[sitemap-determinism] FAIL — URL count regressed: <loc>=534 < LOC_FLOOR=1184.
  Hint: a getStaticPaths filter change or collection schema change silently dropped URLs.
```

**Report evidence:** `locCount: 534`, `lastmodCount: 534`, `locFloorOk: false`, `lastmodPerUrlOk: true` (!), `lastmodFloorOk: false`. **This is the design-critical observation:** `lastmodPerUrlOk: true` — the survivors all had lastmods. A combined check (old pattern: `lastmodCount === locCount && locCount >= 1120`) would have silently greenlit a degraded 534-URL sitemap. The split invariant — specifically `locCount >= LOC_FLOOR` — is what caught it.

**Revert:** `git diff astro.config.mjs` returned empty.

### Test 5 — Per-URL lastmod mismatch (new page without date source)

**Injection:** `src/pages/new-page.astro` (minimal Astro page, renders at `/new-page/`, no date registration in `src/lib/sitemap/`).

**Verifier caught:** Exit 1.
```
[coverage] <loc>=1185 <lastmod>=1184
[determinism] sitemap-0.xml: OK
[determinism] sitemap-index.xml: OK
[sitemap-determinism] FAIL — lastmod/loc mismatch: <loc>=1185, <lastmod>=1184.
  Hint: a new URL category was added without a corresponding date source in src/lib/sitemap/.
```

**Report evidence:** `locCount: 1185`, `lastmodCount: 1184`, `locFloorOk: true`, `lastmodPerUrlOk: false`, `lastmodFloorOk: true`, `coverageOk: false`. Only the per-URL invariant flipped — isolates the failure mode cleanly. The "hint" message matches the actual root cause (a new page type added without a date source).

**Revert:** `rm src/pages/new-page.astro`; `git status src/pages/` empty.

### Test 6 — Broad coverage collapse (Beauty Index VS pass commented out)

**Injection:** `src/lib/sitemap/content-dates.ts` — the 26 × 25 = 650 Beauty Index VS map.set loop at lines 411-418 commented out.

**Verifier caught:** Exit 1.
```
[coverage] <loc>=1184 <lastmod>=534
[determinism] sitemap-0.xml: OK
[determinism] sitemap-index.xml: OK
[sitemap-determinism] FAIL — lastmod/loc mismatch: <loc>=1184, <lastmod>=534.
```

**Report evidence:** `locCount: 1184`, `lastmodCount: 534`, `locFloorOk: true`, `lastmodPerUrlOk: false`, `lastmodFloorOk: false` (534 < 1120), `coverageOk: false`. Matches the plan's predicted diagnostic exactly: "first it hits the per-URL mismatch (1184 loc, ~534 lastmod), and the LASTMOD_COVERAGE_FLOOR confirms 534 < 1120." **Both** `lastmodPerUrlOk` and `lastmodFloorOk` flipped — the per-URL invariant fires first in the ordered branch list, but the defensive floor would have caught it independently. This demonstrates graceful redundancy between the two invariants for broad-collapse scenarios.

**Revert:** `git diff src/lib/sitemap/content-dates.ts` returned empty.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 — Missing gitignore for runtime output] Added `.planning/reports/*-*.json` patterns to `.gitignore`**
- **Found during:** Final self-check after negative tests
- **Issue:** Every `npm run build` emits three timestamped JSON reports (vs-wordcount, vs-overlap, sitemap-determinism). Four builds during negative-test sequencing accumulated 12 untracked report files under `.planning/reports/`, polluting `git status` and risking accidental commits.
- **Fix:** Added three gitignore glob patterns (`sitemap-determinism-*.json`, `vs-overlap-*.json`, `vs-wordcount-*.json`). Git respects prior tracking — the Phase 122 P03 `vs-*-20260416-1147.json` baselines and this plan's `sitemap-determinism-2026041613455.json` baseline remain tracked.
- **Files modified:** `.gitignore` (+10 lines including comment)
- **Commit:** a0df2c7

**2. [Operator error, recovered] Accidentally deleted Phase 122 committed baseline reports with an `xargs rm` glob**
- **Found during:** Cleanup of accumulated untracked reports
- **Issue:** `ls .../vs-overlap-*.json | tail -n +2 | xargs rm` sorted by modification time, which put the old committed Phase 122 baselines LAST (oldest mtime) in a `ls -t` reversed-ordering. The pipe stripped the newest-only and deleted everything else — including the committed `vs-overlap-20260416-1147.json` and `vs-wordcount-20260416-1147.json` from Phase 122 P03.
- **Fix:** Restored via `git checkout -- <specific files>` (allowed per protocol; avoided blanket reset/clean).
- **Impact:** Zero — files restored to their committed state before any commit happened. Listed here for operational transparency; the near-miss reinforces why the protocol forbids `git clean` in worktree contexts.
- **Takeaway for future plans:** Never `xargs rm` inside `.planning/reports/` without first listing `git ls-files` to identify tracked baselines that must be preserved.

No Rule 1 / Rule 3 / Rule 4 deviations. No authentication gates.

## Phase 123 gate status — COMPLETE

All four Phase 123 success criteria are now either already shipped (Plan 01, Plan 02) or locked behind a build-time gate (Plan 03):

- [x] **Every URL in sitemap-index.xml includes a lastmod date** — enforced by `lastmodPerUrlOk` (per-URL equality) + `lastmodFloorOk` (defensive floor). Build fails if ANY URL drops.
- [x] **Blog post lastmod matches frontmatter** — enforced indirectly via determinism (any accidental switch to `statSync` would manifest as byte-identical-rebuild failure) + spot-checked in Plan 01/02 SUMMARIES.
- [x] **Section-level pages use hardcoded publication dates** — enforced indirectly via determinism; `STATIC_PAGE_DATES` + `COLLECTION_SHIP_DATES` remain the source of truth in `src/lib/sitemap/static-dates.ts`.
- [x] **Two consecutive builds produce byte-identical sitemaps** — enforced by sha256 compare of `dist/sitemap-0.xml` and `dist/sitemap-index.xml` between first and second `astro build`. Baseline hash committed: `dcbc444bf6a6744178c05e939c055ba9cdd7d65ee1a17c5bdf54eff9bd1965e2`.

## Handoff note — Phase 125

When Phase 125 ships (TSEO-03 pagination removal + TSEO-05 sparse tag removal):

1. **`COLLECTION_SHIP_DATES.beautyIndexLanguage`** in `src/lib/sitemap/static-dates.ts` should be bumped to the Phase 125 ship date when OPSEO-03 language-description edits land.
2. **Tag-page and pagination URL removal** via TSEO-03/TSEO-05 should update the `filter` callback in `astro.config.mjs`'s `sitemap(...)` integration config — **NOT** any constant in this verifier.
3. **`LOC_FLOOR` in `scripts/verify-sitemap-determinism.mjs`** MUST be bumped DOWNWARD to the new expected URL total (≈1120 after ~64 URLs are removed) in the same PR as the filter change. The comment beside `LOC_FLOOR` explicitly requests the Phase 125 PR URL be cited.
4. **`LASTMOD_COVERAGE_FLOOR`** currently has 64-URL headroom built in — Phase 125's expected removal ≤64 URLs will NOT require updating this constant. If Phase 125's removal exceeds 64 URLs, bump the floor in the same PR.

## Commits (this plan)

| # | Hash | Message | Files |
|---|------|---------|-------|
| 1 | 73d00c4 | feat(123-03): add sitemap coverage + determinism build-time verifier | scripts/verify-sitemap-determinism.mjs, package.json |
| 2 | a0df2c7 | chore(123-03): commit baseline determinism report + gitignore per-build reports | .planning/reports/sitemap-determinism-2026041613455.json, .gitignore |

## Self-Check: PASSED

- `scripts/verify-sitemap-determinism.mjs`: FOUND (216 lines)
- `package.json` build-script chain: FOUND (`grep "verify-sitemap-determinism" package.json` returns both the chain entry and the `verify:sitemap-determinism` convenience script)
- `.planning/reports/sitemap-determinism-2026041613455.json`: FOUND (committed baseline, sha256 `dcbc444b...965e2`)
- Commits 73d00c4, a0df2c7: FOUND in `git log --oneline -5`
- Final `npm run build` exit code: 0
- `git status dist/`: clean (no verifier pollution in dist/)
- `new Date()` usage in verifier: only at lines 126 (filename stamp), 129 (report field), 201 (error hint string literal) — all permitted per plan
