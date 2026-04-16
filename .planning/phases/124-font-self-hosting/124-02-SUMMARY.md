---
phase: 124-font-self-hosting
plan: 02
subsystem: fonts
tags:
  - perf
  - csp
  - fonts
  - self-hosting
  - build-verifier
  - preload
requirements:
  - PERF-01
  - PERF-02
  - PERF-03
dependency_graph:
  requires:
    - phase: 124-01
      provides: "Self-hosted @fontsource imports + hand-written @font-face rules + preload hints + shrunken CSP in Layout.astro"
  provides:
    - "Build-time gate (scripts/verify-no-google-fonts.mjs) locking in the 3 PERF requirements + Pitfall 1 (preload↔src URL match) + FastAPI guide allowlist"
    - "Inline <style is:inline> @font-face + font-family priming pattern for preload consumption at first paint"
    - "CSP patch set: data: added to font-src (Vite-inlined subsets) + data: added to script-src (Astro ClientRouter)"
    - "Plan 01 LCP-weight correction (Bricolage 800 → 700) reflecting Tailwind font-bold=700 default"
  affects:
    - "scripts/verify-no-google-fonts.mjs"
    - "package.json (build chain + verify:no-google-fonts script)"
    - "src/layouts/Layout.astro (CSP font-src + script-src + inline @font-face block)"
    - "src/styles/global.css (@font-face weight 800 → 700)"
    - "scripts/copy-preload-fonts.mjs (bricolage-latin-800 → bricolage-latin-700 copy)"
    - "public/fonts/bricolage-700.woff2 (replaces bricolage-800.woff2 as preloaded weight)"
    - ".gitignore (filename swap)"
tech_stack:
  added:
    - "Zero-dep ESM verifier scripts/verify-no-google-fonts.mjs (node:fs + node:path only, 218 lines, 4 assertions)"
  patterns:
    - "Inline <style is:inline> + <link rel=preload> source-order discipline in <head> to close Chrome preload-usage race window"
    - "Duplicate @font-face declarations (inline head + per-route CSS) are intentional redundancy — browsers merge identical rules; covers both first-paint consumption AND future verifier regression-catch"
    - "Build-time grep gate for origin/CSP/preload constraints when visual testing is out-of-scope (no Playwright)"
key_files:
  created:
    - scripts/verify-no-google-fonts.mjs
  modified:
    - package.json
    - src/layouts/Layout.astro
    - src/styles/global.css
    - scripts/copy-preload-fonts.mjs
    - .gitignore
decisions:
  - "LCP weight corrected: preload Bricolage 700, not 800. Rationale: Tailwind font-bold=700, font-extrabold=800; base-layer `h1-h6 { @apply font-heading font-bold }` means 95%+ of pages render headings at 700. Plan 01 A1 clause explicitly permitted this in-flight swap when live evidence contradicts the assumption."
  - "Inline @font-face + inline font-family in Layout.astro <head> (duplicated from global.css). Reason: global.css lands in per-route CSS chunks that load AFTER preload fires; Chrome's preload-usage window closes before the font-family cascade arrives. Inline priming activates fonts at first paint without losing the full fallback stack once external CSS loads."
  - "Source order: <style is:inline> precedes <link rel=preload> in <head>. The CSS parser registers @font-face consumers BEFORE preload fetches fire, eliminating the race window where Chrome can miss the association even when URLs match byte-for-byte."
  - "CSP additions: data: in font-src (Vite's 4KB assetsInlineLimit inlines tiny @fontsource/fira-code/symbols2 subset as data:font/woff2) + data: in script-src (Astro's <ClientRouter /> creates data:application/javascript, bootstrap scripts). Security impact: minimal. Data: fonts are self-contained bytes, cannot beacon. Data: scripts are no stronger than the 'unsafe-inline' already permitted."
  - "Verifier design: 4 assertions (no-google-fonts / GA regression guard / 2-preload presence+shape / preload↔@font-face URL match) + 4/4 negative tests + FastAPI security-headers MDX allowlist (narrow single regex, logged as INFO). Mirrors Phase 123 P03's determinism verifier contract (exit 1 with categorized errors; exit 0 with PASS line listing preload hrefs)."
metrics:
  duration: "82 minutes (11:15:22 Task 1 landed → 12:17:21 final fix-forward → 12:35 human approval after rebuild confirmation)"
  completed_date: "2026-04-16"
  tasks: 2
  files_changed: 6
  verifier_lines: 218
  fix_forward_commits: 5
---

# Phase 124 Plan 02: Font Self-Hosting Verifier + Human Smoke Test Summary

**Locked Phase 124's three PERF requirements behind a 4-assertion zero-dep build-time verifier (scripts/verify-no-google-fonts.mjs, 218 lines) and resolved all preload-consumption timing issues surfaced by the human-verify smoke test through 5 fix-forward commits to Plan 01's surface (CSP patches for Vite-inlined subsets + Astro ClientRouter, LCP weight correction 800→700, inline @font-face + font-family priming, source-order reorder).**

## Performance

- **Duration:** 82 min (11:15 Task 1 commit → 12:35 user approval)
- **Started:** 2026-04-16T15:15:22Z (Task 1 landed)
- **Completed:** 2026-04-16T16:35:00Z (approved post-rebuild)
- **Tasks:** 2 (1 auto + 1 checkpoint:human-verify)
- **Files modified:** 6 (1 created, 5 modified)
- **Commits:** 6 (1 feat + 5 fix-forward)

## Accomplishments

- **Built the Phase 124 guardrail:** `scripts/verify-no-google-fonts.mjs` runs after `verify-sitemap-determinism.mjs` in the build chain and fails the build on any of 4 independent regressions (Google Fonts origin leak, CSP GA over-edit, preload malformation, preload↔src URL mismatch).
- **Human-verified 4 families × 2 modes × 4 routes** (homepage, /blog/, /eda/, /beauty-index/ + VS pages). All 8 cells PASSED after the 5 fix-forward commits.
- **Discovered and corrected Plan 01 A1 assumption gap:** LCP-critical heading weight is Bricolage 700 (Tailwind font-bold), not 800 (font-extrabold). 95%+ of site routes benefit.
- **Closed three preload-timing gaps** that only manifest in a live browser: CSS-chunk arrival timing (inline @font-face), cascade timing (inline font-family priming), and parse-order race (style-before-link reorder).
- **Patched two CSP gaps** surfaced by the in-browser console: `data:` in font-src (Vite inlining) and `data:` in script-src (Astro ClientRouter).

## Task Commits

1. **Task 1: verify-no-google-fonts.mjs + build-chain wiring** — `6a222d2` (feat)
2. **Task 2: human-verify smoke test** (5 fix-forward commits landed DURING the checkpoint before approval):
   - `c689f18` — fix(124-01): add data: to CSP font-src
   - `3a891ce` — fix(124-01): swap preload weight Bricolage 800 → 700
   - `cbd6b9d` — fix(124-01): inline @font-face + allow data: in script-src
   - `2274b8e` — fix(124-01): apply font-family inline for first-paint consumption
   - `7fac8a2` — fix(124-01): reorder <style> before <link rel=preload>

**Plan metadata:** (this commit) — docs(124-02): complete font-self-hosting verifier + phase P02

## Files Created/Modified

### Created (Task 1)
- `scripts/verify-no-google-fonts.mjs` (218 lines) — Zero-dep ESM verifier enforcing:
  1. **No Google Fonts origins in dist/** — walks every `.html`/`.css`/`.js` file, greps for `fonts.googleapis.com` and `fonts.gstatic.com`, collects violations. Allowlisted path regex `/^guides\/fastapi-production\/.*security-headers/` lets the MDX code-example page through; hits are logged as INFO for auditability (2 INFO lines per run: one per needle × 1 allowed file).
  2. **GA preservation guard on `dist/index.html`** — asserts presence of `googletagmanager.com`, `google-analytics.com`, and `Content-Security-Policy` markers. Catches over-aggressive CSP edits that strip GA along with Google Fonts.
  3. **Preload hint shape** — exactly 2 `<link rel="preload" as="font">` tags, each with `type="font/woff2"`, a `crossorigin` attribute (bare or `="anonymous"`), and an href matching `/fonts/[a-z0-9-]+\.woff2`.
  4. **Preload↔@font-face URL match (Pitfall 1 guard)** — concatenates all `dist/_astro/*.css` plus `dist/index.html` inline `<style>` blocks and asserts each preload href appears verbatim as `url('...')` / `url("...")` / `url(...)` somewhere in that aggregate. Prevents the double-download failure mode where a preload URL doesn't match any `@font-face` consumer byte-for-byte.

### Modified (Task 1)
- `package.json` — Two changes:
  - `build` chain extended: `… && node scripts/verify-sitemap-determinism.mjs && node scripts/verify-no-google-fonts.mjs` (appended at the end, after Phase 123 determinism gate).
  - Standalone convenience script added: `"verify:no-google-fonts": "node scripts/verify-no-google-fonts.mjs"`.

### Modified during fix-forward (Plan 01 surface, Task 2 checkpoint phase)
- `src/layouts/Layout.astro` — 4 patches across 4 commits:
  - `c689f18`: CSP `font-src 'self'` → `font-src 'self' data:`
  - `cbd6b9d`: CSP `script-src 'self' 'unsafe-inline' blob: 'wasm-unsafe-eval' …` → `script-src 'self' 'unsafe-inline' blob: data: 'wasm-unsafe-eval' …`; added `<style is:inline>` block with the 2 hand-written `@font-face` rules AFTER the preload links.
  - `2274b8e`: extended the inline `<style>` with `html { font-family: 'DM Sans', … }` and `h1, h2, h3, h4, h5, h6 { font-family: 'Bricolage Grotesque', … font-weight: 700 }`.
  - `7fac8a2`: moved the `<style is:inline>` block to precede `<link rel=preload>`; extended `html` selector to `html, body`.
- `src/styles/global.css` — `3a891ce`: hand-written `@font-face` `font-weight: 800 → 700`, `src url('/fonts/bricolage-800.woff2') → url('/fonts/bricolage-700.woff2')`.
- `scripts/copy-preload-fonts.mjs` — `3a891ce`: source `bricolage-latin-800-normal.woff2 → bricolage-latin-700-normal.woff2`; destination `bricolage-800.woff2 → bricolage-700.woff2`.
- `.gitignore` — `3a891ce`: `public/fonts/bricolage-800.woff2 → public/fonts/bricolage-700.woff2`.

## Verifier Assertion Summary

**Clean build output (from `npm run build` after all fixes):**

```
[verify-no-google-fonts] INFO — allowlisted match in guides/fastapi-production/security-headers/index.html ("fonts.googleapis.com") — code example, not a live resource
[verify-no-google-fonts] INFO — allowlisted match in guides/fastapi-production/security-headers/index.html ("fonts.gstatic.com") — code example, not a live resource
[verify-no-google-fonts] PASS — 0 violations, 2 preload hints (/fonts/dm-sans-400.woff2, /fonts/bricolage-700.woff2), all @font-face src URLs matched, 2 allowlisted code-example match(es)
```

**Allowlist regex:** `/^guides\/fastapi-production\/.*security-headers/`
- Matches `dist/guides/fastapi-production/security-headers/index.html` (confirmed by Astro's collection routing for `src/data/guides/fastapi-production/pages/security-headers.mdx`).
- Matches exactly 1 file; logs 2 INFO lines per run (one per forbidden needle × 1 allowed file).

### Negative Test Results (4/4 PASS)

Each negative test was performed by temporarily breaking one invariant, rebuilding, and confirming the verifier failed with the expected error category. All 4 were reverted cleanly after capture.

| # | Invariant broken | Expected failure category | Result |
|---|------------------|--------------------------|--------|
| 1 | Restored `fonts.gstatic.com` reference in a non-allowlisted file | "Google Fonts URL leak" | PASS — verifier exited 1 with `Google Fonts URL leak: <file> contains "fonts.gstatic.com"` |
| 2 | Removed `https://www.googletagmanager.com` from the CSP meta | "GA regression" | PASS — verifier exited 1 with `GA regression: dist/index.html missing required marker "googletagmanager.com"` |
| 3 | Renamed a `public/fonts/*.woff2` so the preload href no longer matches the `@font-face src` | "URL mismatch (Pitfall 1)" | PASS — verifier exited 1 with `URL mismatch: preload href /fonts/... has no matching @font-face src in dist/_astro/*.css — Pitfall 1 (double-download risk)` |
| 4 | Deleted one of the two preload `<link>` lines | "expected exactly 2 preload" | PASS — verifier exited 1 with `Preload issue: expected exactly 2 preload <link as=font>, found 1` |

### Full `npm run build` Chain (All 4 Verifiers PASS)

Chain order and observed output markers:

1. `astro build` — 1185 pages built in 41.46 s
2. `verify-vs-wordcount` — 650 pages, min=1217 max=1724 mean=1393.4, 0 failures (VS-07)
3. `verify-vs-overlap` — sampled 20/650, max Jaccard=0.252, p95=0.205, mean=0.056 (VS-06, ceiling 0.40)
4. `verify-sitemap-determinism` — 1184 URLs, all with lastmod, sha256-identical across two consecutive astro builds
5. `verify-no-google-fonts` — 0 violations, 2 preload hints matched to @font-face src, 2 allowlisted INFO hits

Total pipeline (astro build + 4 verifiers): approximately `41.46 s + ~3 s (VS-07) + ~2 s (VS-06) + ~45 s (determinism, includes second astro build) + ~1 s (no-google-fonts) ≈ 92 s`.

## Decisions Made

See frontmatter `decisions:` block for the full record. Top four:

1. **LCP weight corrected 800 → 700** (Tailwind font-bold=700 default; Plan 01 A1 clause permitted the in-flight swap when live evidence contradicts the assumption).
2. **Inline @font-face + inline font-family priming in `<head>`** (external CSS chunks load after Chrome's preload-usage window closes; inline rules activate fonts on first paint without disturbing the fallback cascade).
3. **Source order: style precedes preload** (parser registers consumers before fetches fire; closes a race window where preload↔@font-face association can fail even with byte-perfect URLs).
4. **CSP `data:` additions** (font-src for Vite inline, script-src for Astro ClientRouter); security impact minimal given `'unsafe-inline'` already present.

## Deviations from Plan

### Auto-fixed Issues

Five auto-fixes landed during the Task 2 `checkpoint:human-verify` window. All modify Plan 01's surface rather than Plan 02's new verifier — they close gaps in Plan 01's assumptions that were only discoverable by a human opening DevTools on `astro preview`. Plan 02's own deliverable (the verifier) required no deviations. All five are committed as `fix(124-01)` with detailed commit bodies.

**1. [Rule 3 — Blocking] CSP `font-src 'self'` blocks Vite-inlined font subsets**
- **Found during:** Task 2 smoke test on homepage
- **Issue:** Vite's default `assetsInlineLimit` (4096 bytes) inlines the tiny `@fontsource/fira-code/symbols2` subset woff2 as a `data:font/woff2;base64,…` URI inside `dist/_astro/_slug_.*.css`. Post-Plan-01 CSP `font-src 'self'` blocked it with a console violation.
- **Fix:** Added `data:` to `font-src` directive.
- **Files modified:** `src/layouts/Layout.astro`
- **Verification:** Chrome console now shows zero `font-src` CSP violations across all 4 tested routes; verify-no-google-fonts still passes (assertion 2 only checks GA marker presence, not font-src specifics).
- **Commit:** `c689f18`
- **Security impact:** Minimal. `data:` fonts are self-contained bytes already fetched via CSS; cannot beacon or pull remote resources.

**2. [Rule 1 — Bug] LCP preload weight wrong (Bricolage 800 → 700)**
- **Found during:** Task 2 smoke test on `/blog/dark-code/` and other post routes
- **Issue:** Plan 01 Task 2 A1 assumed H1 uses `font-bold` = Bricolage 800. Tailwind's `font-bold` is actually 700; `font-extrabold` is 800. Only `/` and `/blog/` override to `font-extrabold`; every other route renders headings at 700. Preloading 800 triggered Chrome's `"preloaded but not used within a few seconds"` warning on ~95% of routes.
- **Fix:** Copy Bricolage latin 700 (not 800), rename public file, update `@font-face` rule + preload href + `.gitignore`. The homepage's extra-bold still works via the `@fontsource/bricolage-grotesque/800.css` import (hashed woff2 in `_astro/`, font-display: swap).
- **Files modified:** `scripts/copy-preload-fonts.mjs`, `src/styles/global.css`, `src/layouts/Layout.astro`, `.gitignore`
- **Verification:** Preload-unused warnings gone on all tested non-homepage routes; verify-no-google-fonts emits `/fonts/bricolage-700.woff2` in its PASS line.
- **Commit:** `3a891ce`
- **Plan clause covering:** Plan 01 Task 2 A1 explicitly permitted swapping the preload pair when live evidence contradicts the assumption. This is allowed deviation, not unplanned work.

**3. [Rule 1 — Bug] Per-route CSS arrives AFTER preload usage window closes**
- **Found during:** Task 2 smoke test on `/beauty-index/`, `/blog/`, `/blog/dark-code/`
- **Issue:** Astro bundles `src/styles/global.css` (which holds hand-written `@font-face` for preloaded weights) into per-route CSS chunks. Preload hints fire BEFORE those chunks finish parsing, so Chrome's "used within a few seconds" window closes before the browser can associate the preloaded woff2 with its `@font-face` consumer. Also: `<ClientRouter />` uses `data:application/javascript,` bootstrap scripts that CSP `script-src 'self' 'unsafe-inline' blob: 'wasm-unsafe-eval' …` blocked.
- **Fix:** (a) Added `<style is:inline>` block in Layout.astro `<head>` duplicating the two hand-written `@font-face` rules. Both copies intentionally retained — browsers merge identical declarations and keeping them in global.css preserves the verifier's assertion 4 path (concatenated `dist/_astro/*.css` must contain the preload URLs as `url(...)`). (b) Added `data:` to `script-src`.
- **Files modified:** `src/layouts/Layout.astro`
- **Verification:** Inline `<style>` contains `@font-face { ... url('/fonts/dm-sans-400.woff2') ... }` and `url('/fonts/bricolage-700.woff2')`; verifier's assertion 4 reads both `dist/_astro/*.css` AND the inline `<style>` block in `dist/index.html`. No script-src violations on any tested route.
- **Commit:** `cbd6b9d`
- **Security impact:** script-src `data:` is no stronger than `'unsafe-inline'` already present — both permit arbitrary script execution paths.

**4. [Rule 1 — Bug] @font-face declaration ≠ font activation; need inline font-family**
- **Found during:** Task 2 smoke test on `/beauty-index/` after fix (3) landed
- **Issue:** Inline `@font-face` made the rules available, but the browser only activates a font (and counts its preload as "used") when an element actually COMPUTES to that font-family. Tailwind's `body { @apply font-sans }` and `h1-h6 { @apply font-heading font-bold }` live in the per-route CSS chunk, so until that chunk loads, NO element computes to DM Sans or Bricolage — preloads land unconsumed.
- **Fix:** Added inline `html { font-family: 'DM Sans', ... }` and `h1-h6 { font-family: 'Bricolage Grotesque', ..., font-weight: 700 }` to the same `<style is:inline>` block. Tailwind's base-layer rules still win once external CSS loads (same specificity, later in cascade order), preserving the full fallback stack including `DM Sans Fallback`, `Greek Fallback`, and system stack extensions.
- **Files modified:** `src/layouts/Layout.astro`
- **Verification:** Chrome DevTools shows both preloads consumed at first paint across all 4 routes × 2 modes; no "preloaded but not used" warnings.
- **Commit:** `2274b8e`

**5. [Rule 1 — Bug] Source order: preload fires before parser registers @font-face consumer**
- **Found during:** Task 2 smoke test final verification pass
- **Issue:** The inline `<style is:inline>` block was placed AFTER `<link rel=preload>` in `<head>`. Created a race window where the preload fetch fires before the parser sees the `@font-face` consumer, and Chrome's usage heuristic can miss the association even when URLs match byte-for-byte.
- **Fix:** Moved `<style is:inline>` to precede the preload hints. Also extended `html` selector to `html, body` for defense-in-depth against UA styles that might set `body { font-family: initial }`.
- **Files modified:** `src/layouts/Layout.astro`
- **Verification:** Final smoke-test pass: all 4 routes × 2 modes render correctly with zero console warnings on first paint; verify-no-google-fonts PASS.
- **Commit:** `7fac8a2`

---

**Total deviations:** 5 auto-fixed (4 Rule 1 bugs discovered only in browser runtime + 1 Rule 3 blocking CSP gap)
**Impact on plan:** All 5 fixes were correctness/performance requirements for the phase success criterion 4 ("all four families render correctly in both light and dark modes"). No scope creep — every fix is strictly within Plan 01's stated surface area (Layout.astro CSP/head + global.css + prebuild copy script + .gitignore). The verifier (Plan 02's own deliverable) tolerates all 5 fixes without modification — its assertions were designed to be orthogonal to the specific font weights and CSS chunk layout.

## Human Verification Report

Run: `npm run build && npx astro preview` on port 4321. Hard-reload each route (Cmd+Shift+R) with DevTools Network tab filtered by `Font` and Console open.

| Route | Light mode | Dark mode |
|-------|------------|-----------|
| `/` (homepage) | PASS — Bricolage hero H1, DM Sans body, 2 preloads consumed on first paint, 0 CSP violations, 0 preload-unused warnings | PASS — same families, colors change only |
| `/blog/` | PASS — Bricolage post titles, DM Sans body copy | PASS |
| `/eda/` | PASS — Greek glyphs (σ, μ, θ) render in Noto Sans Greek subset, not serif fallback | PASS |
| `/beauty-index/` + `/beauty-index/python-vs-rust/` (VS page) | PASS — Fira Code monospace on code snippets, DM Sans body, Bricolage headings at 700 | PASS |

**All 8 cells (4 routes × 2 modes) PASS.** No requests to `fonts.googleapis.com` / `fonts.gstatic.com` on any route. First-paint woff2 requests: `/fonts/dm-sans-400.woff2` (~14 KB) + `/fonts/bricolage-700.woff2` (~21 KB), both preloaded. Additional on-demand requests to `/_astro/*.woff2` for non-preloaded weights fire as content paints.

## Production Follow-Up Note

The preload-unused warnings that drove fix commits 2-5 were observed under `npx astro preview` (Node.js HTTP server, single-threaded, HTTP/1.1, localhost). GitHub Pages serves over an HTTP/2 CDN with parallel request pipelining and edge caching, which typically delivers per-route CSS chunks substantially faster than Node preview. There is a non-trivial chance the 3 inline-priming patches (fix 3/4/5) are over-engineering for production delivery — the preload-usage window may never have closed early there.

**Recommendation:** Do not roll back the inline priming. It is defensive, incurs <2 KB of extra HTML, and guarantees first-paint font activation regardless of delivery path. Re-verify under production load on the `patrykgolabek.dev` GitHub Pages deployment AFTER merge; if no preload-unused warnings surface in Chrome DevTools over a 10-route sample, the current belt-and-suspenders setup is the right steady state. Do NOT block phase approval on this follow-up.

## Known Stubs

None.

## Threat Flags

None. Plan 02's verifier is a local file-reading script that only emits logs and exit codes — no new network endpoints, auth, or trust-boundary changes. The CSP `data:` additions in fix commits 1 and 3 do not widen attack surface beyond what `'unsafe-inline'` already permits.

## Issues Encountered

- **5 iterative browser-runtime fixes during human-verify:** Each fix surfaced a successor issue. Root cause: browser font-loading semantics (preload usage window, @font-face timing, cascade order of font-family application) cannot be asserted by grep-based build-time tooling; only DevTools on real preview catches them. Plan 02's verifier catches URL-level regressions (Pitfall 1) but cannot catch timing/ordering regressions. This is acceptable — the verifier is a guardrail, not a substitute for the human-verify checkpoint, and the checkpoint caught everything.

## Next Phase Readiness

Phase 124 is complete (both plans shipped). Phase 125 (Blog + pagination + on-page SEO fixes) and Phase 126 (CSS investigation) are unblocked. Phase 126 specifically depends on Phase 124 per ROADMAP — the font migration provides a clean CSS baseline for homepage bundle analysis.

## Self-Check: PASSED

**Files created/modified (all verified present on disk at expected paths):**

- FOUND: `/Users/patrykattc/work/git/PatrykQuantumNomad/scripts/verify-no-google-fonts.mjs` (218 lines)
- FOUND: `/Users/patrykattc/work/git/PatrykQuantumNomad/package.json` (build chain + verify:no-google-fonts)
- FOUND: `/Users/patrykattc/work/git/PatrykQuantumNomad/src/layouts/Layout.astro` (CSP patches + inline @font-face + inline font-family + source order)
- FOUND: `/Users/patrykattc/work/git/PatrykQuantumNomad/src/styles/global.css` (@font-face weight 700)
- FOUND: `/Users/patrykattc/work/git/PatrykQuantumNomad/scripts/copy-preload-fonts.mjs` (bricolage-latin-700-normal source)
- FOUND: `/Users/patrykattc/work/git/PatrykQuantumNomad/.gitignore` (public/fonts/bricolage-700.woff2)

**Commits (all verified present in git log):**

- FOUND: `6a222d2` — feat(124-02): add build-time font self-hosting verifier
- FOUND: `c689f18` — fix(124-01): add data: to CSP font-src for Vite-inlined font subsets
- FOUND: `3a891ce` — fix(124-01): swap preload weight Bricolage 800 → 700
- FOUND: `cbd6b9d` — fix(124-01): inline @font-face for preloads + allow data: in script-src
- FOUND: `2274b8e` — fix(124-01): apply font-family inline so preloads are consumed at first paint
- FOUND: `7fac8a2` — fix(124-01): move <style> before <link rel=preload> + add body to font-family

**Success criteria (plan + executor prompt):**

- PERF-01 locked: VERIFIED — verifier assertion 1 (exit 1 on any non-allowlisted dist/ file containing googleapis/gstatic)
- PERF-02 locked: VERIFIED — verifier assertion 2 (exit 1 if dist/index.html missing GA markers or Content-Security-Policy)
- PERF-03 locked: VERIFIED — verifier assertions 3+4 (exit 1 if preload count ≠ 2, missing crossorigin/type, or href doesn't match @font-face src)
- Phase success criterion 4 confirmed: VERIFIED — 4 families × 2 modes × 4 routes = 8/8 PASS
- Allowlist narrow + logged as INFO: VERIFIED — 1 regex, 2 INFO lines per clean run
- `npm run build` end-to-end: VERIFIED — 4 verifiers PASS in sequence (VS-07, VS-06, sitemap-determinism, no-google-fonts)

---
*Phase: 124-font-self-hosting*
*Completed: 2026-04-16*
