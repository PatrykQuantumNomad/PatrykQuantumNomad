# Phase 126: CSS Investigation and Remediation - Research

**Researched:** 2026-04-16
**Domain:** Astro 5 CSS chunking, Vite/Rollup bundling, Tailwind content scanning, bundle analysis tooling
**Confidence:** HIGH (measurement artefacts already visible in `dist/` — hypothesis need not survive first contact with the code)

## Summary

This phase is expressed as a measurement-first diagnosis. The audit flagged a ~132KB homepage CSS figure that the investigation must either (a) remediate, or (b) close with documented rationale. Live measurement of the current `dist/` output (baseline was built 2026-04-16 19:03) shows the homepage loads **two external stylesheets — `/_astro/about.C49NBCVn.css` (62,243 bytes) + `/_astro/_slug_.CIgCJX9d.css` (86,597 bytes) = 148,840 bytes uncompressed / ~30KB gzipped** [VERIFIED: `wc -c dist/_astro/*.css` + `gzip -c | wc -c`]. The "132KB" figure in the phase success criteria is close enough to the actual number that it almost certainly refers to this pair.

Critically, **every other route in `dist/` loads the exact same two CSS files** — verified by grepping `/_astro/*.css` references across `dist/{index.html, about, contact, projects, blog, beauty-index, tools, ai-landscape, eda, db-compass, guides}/index.html` — the set is identical on all. A third file `/_astro/ec.t87ba.css` (15,773 bytes, Expressive Code) joins on code-heavy pages (`/blog/dark-code/`, `/eda/techniques/histogram/`, `/beauty-index/python/`). A fourth file `/_astro/asciinema-player.D16CJk62.css` (14,898 bytes) loads only on guide pages that import `TerminalRecording.astro`. A fifth file `/_astro/style.BZV40eAE.css` (15,851 bytes) contains React Flow CSS [VERIFIED: `head -c 500 dist/_astro/style.BZV40eAE.css` starts with `.react-flow{...}`] and only loads where the dependency graph / workflow components mount. [VERIFIED: `grep -oE '/_astro/[^"]+\.css' dist/*/index.html` enumeration]

This reframes the diagnosis before any tool is run. The two large files are already confirmed to be **shared chunks, not per-route artefacts.** The file naming is misleading — `about.css` is **not** "the /about/ page CSS." Astro derives shared-CSS-chunk names from the first alphabetically sorted page that consumes the chunk [CITED: withastro/astro#7469, Astro maintainer response: "We derive the CSS file name by the first name of a list of pages that uses it, e.g. if both `index` and `about` uses it, the first (sorted alphabetically) page - `about` - would be the name"]. With 10 top-level routes (about, ai-landscape, beauty-index, blog, contact, db-compass, eda, guides, index, projects, tools), `about` wins the alphabetical race; the second chunk gets named after the first page with the `[slug]` route pattern it contains. Byte inspection confirms: `about.css` starts with Tailwind's base reset (`*,::before,::after{--tw-border-spacing-x: 0;...}`) and ends with `[&_th]:*` Tailwind arbitrary-variant utilities — this is the Tailwind utility sheet. `_slug_.css` starts with `.astro-route-announcer` (ClientRouter), then `@font-face` blocks from `@fontsource/*`, then animation keyframes, then ends with `@keyframes astroSlideFromRight/Left`, `astroSlideToRight/Left`, `[data-astro-transition-scope]{animation:none!important}` — this is the Astro View Transitions + fonts + animations bundle.

**Primary recommendation:** This is almost certainly Success Criterion #3 territory — 148KB shared-chunk CSS that is (a) cached across navigations after first paint, (b) mostly Tailwind + Astro View Transitions + `@fontsource` `@font-face` declarations that must load before any route renders correctly, (c) shrinks to ~30KB gzipped on the wire. The investigation should NOT assume remediation is needed — the plan should run the diagnosis, present findings, then choose the close-with-rationale or remediate path based on evidence. If remediation IS pursued, the levers with highest ROI and lowest invariant risk are: (1) tighten `tailwind.config.mjs` `content` glob, (2) strip unused `@fontsource` weights, (3) consider `build.inlineStylesheets: 'always'` (inlines into HTML, kills the render-blocking external request) — each evaluated for byte-identical rebuild impact (Phase 123 invariant).

**Critical tooling caveat:** `rollup-plugin-visualizer@7.0.0` [VERIFIED: `node_modules/rollup-plugin-visualizer/package.json`] has **limited CSS support.** Source code inspection shows the plugin's main iteration filters out non-chunk entries with `if (bundle.type !== "chunk") continue; //only chunks` [CITED: https://github.com/btd/rollup-plugin-visualizer/blob/master/plugin/index.ts — confirmed via WebFetch]. CSS in Vite/Rollup is emitted as **assets**, not chunks. Issue #203 ("CSS files reported as zero-length") is currently open as a bug. Issue #165 ("No stats for CSS files in the build output") was closed in 2023 — CSS visualization is partial at best. PERF-04 explicitly names `rollup-plugin-visualizer`, so the plan must use it (and the Astro docs recipe recommends it [CITED: https://docs.astro.build/en/recipes/analyze-bundle-size/]) — but the planner must **supplement** it with direct byte-level CSS inspection (`wc -c`, `gzip -c | wc -c`, token counting, source-file mapping) to produce useful findings. The visualizer report alone will NOT answer "which component contributed how much CSS." This is the single most important constraint the planner needs to internalise.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| CSS chunk emission | CDN / Static | Frontend Server (SSR) | Vite/Rollup emits hashed `.css` assets into `dist/_astro/` at build time; Astro injects `<link rel="stylesheet">` tags into HTML |
| CSS shared-chunk splitting | CDN / Static | — | Astro + Vite's Rollup pipeline extracts CSS used by ≥2 pages into shared chunks automatically (no project code) |
| Inline stylesheet threshold | Frontend Server (SSR) | — | `build.inlineStylesheets: 'auto'` (default) inlines chunks < `vite.build.assetsInlineLimit` (4kB default) into `<style>` in HTML head |
| Tailwind utility generation | Frontend Server (SSR) | — | `@astrojs/tailwind` runs Tailwind JIT at build time, emits utilities matched by `content` glob |
| @font-face declarations | Browser / Client | — | Consumed by font engine at parse time from any stylesheet |
| View Transitions CSS | Browser / Client | — | ClientRouter emits `@keyframes astroSlide*` + `::view-transition-*` rules into the shared chunk when `<ClientRouter />` is imported by any layout |
| Bundle visualisation | CDN / Static | — | `rollup-plugin-visualizer` runs as a Vite plugin during `astro build`, emits HTML report |
| Build-time determinism gate | CDN / Static | — | Existing `scripts/verify-sitemap-determinism.mjs` asserts byte-identical `dist/sitemap-*.xml` across two builds — any tooling added here must not introduce non-determinism upstream of sitemap generation |

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| PERF-04 | Homepage CSS bundle diagnosed with rollup-plugin-visualizer | Standard Stack, Code Examples, Pitfall 2 (CSS coverage gap) |
| PERF-05 | Homepage CSS bloat remediated if diagnosis shows unnecessary cross-route CSS loading | Remediation Lever table + State of the Art discussion |

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `rollup-plugin-visualizer` | 7.0.0 | Bundle size visualization as treemap/sunburst/network/raw-data | Named in PERF-04; Astro's official docs recipe [CITED: docs.astro.build/en/recipes/analyze-bundle-size/]; already in `devDependencies` [VERIFIED: `package.json` line 91] |
| Node ≥ 22 | 24.11.1 | Required by `rollup-plugin-visualizer@7` | [CITED: README.md "This package requires Node.js >= 22"]; local env verified [VERIFIED: `node --version` → v24.11.1] |

### Supporting (diagnosis helpers, zero-dep)

| Tool | Purpose | When to Use |
|------|---------|-------------|
| `wc -c` / `gzip -c \| wc -c` | Raw + gzipped byte counts per CSS file | Every diagnosis step — grounds truth against visualizer numbers |
| `grep -oE '/_astro/[^"]+\.css' dist/*/index.html` | Route → CSS file mapping | Confirms which chunks each route actually loads (the shared/not-shared question) |
| `grep -oE 'astro-[a-z0-9]{8}' dist/_astro/*.css \| sort -u \| wc -l` | Count of Astro-scoped selectors per chunk | Distinguishes "shared Tailwind + globals" from "component-scoped CSS" in a chunk |
| `head -c 500` / `tail -c 500` on each CSS file | Chunk boundary inspection | Reveals what the chunk starts/ends with — fastest way to identify shared vs route-specific content |
| Byte-identical rebuild check (reuse Phase 123 pattern) | Verify tooling additions don't break determinism | MUST run before merging any `astro.config.mjs` change |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `rollup-plugin-visualizer` | `sonda` (sonda.dev/frameworks/astro) | **Better CSS support claims, dedicated Astro integration** [CITED: sonda.dev]. **But** PERF-04 explicitly names `rollup-plugin-visualizer` and it's already in `devDependencies`. Switching tools changes the contract. **Recommendation: use visualizer (satisfies PERF-04 literal text), supplement with byte-level grep** |
| `rollup-plugin-visualizer` | `vite-bundle-analyzer` (nonzzz/vite-bundle-analyzer) | Newer, actively maintained, interactive treemap. Not named in PERF-04. Same recommendation — don't swap |
| `rollup-plugin-visualizer` | `vite-bundle-visualizer` (CLI wrapper that uses visualizer under the hood) | Zero config, just CLI. Same CSS limitation (wraps the same plugin). No value add |
| Visualizer `template: 'treemap'` | `template: 'raw-data'` (JSON) | `raw-data` produces JSON stats (module-level size graph) that a follow-up script can parse. Combined with treemap HTML, gives both human-readable and machine-readable outputs. **Recommendation: emit BOTH** — treemap for humans, raw-data JSON for a follow-up Node script that can cross-correlate JS imports with CSS asset sizes |
| `template: 'treemap'` | `template: 'sunburst'` | Sunburst is better for deep hierarchies (nested `node_modules/`); treemap is better for comparing flat peers. For this small bundle, treemap is the right default |
| `vite.build.cssCodeSplit = false` (inline EVERYTHING into one file) | — | **Out of scope per `REQUIREMENTS.md` line 71** ("Known Astro breaking bug #4413"). [VERIFIED: Issue #4413 confirmed open as P3 minor bug since 2022] |

**Installation:** already complete.
```bash
# Already in devDependencies — no install step needed
grep rollup-plugin-visualizer package.json
# "rollup-plugin-visualizer": "^7.0.0"
```

**Version verification:**
```bash
npm view rollup-plugin-visualizer version
# Confirm 7.x is current stable as of 2026-04
```

## Architecture Patterns

### System Architecture Diagram

```
                      ┌──────────────────────────────────────┐
                      │  npm run build                       │
                      └──────────────┬───────────────────────┘
                                     │
                                     ▼
                      ┌──────────────────────────────────────┐
                      │  prebuild (download wasm, gen layout,│
                      │  copy preload fonts)                 │
                      └──────────────┬───────────────────────┘
                                     │
                                     ▼
                      ┌──────────────────────────────────────┐
                      │  astro build                         │
                      │  (Vite + Rollup pipeline)            │
                      │                                      │
                      │  1. Tailwind JIT scans content glob  │
                      │  2. Astro inlines component <style>  │
                      │  3. Vite bundles CSS into chunks:    │
                      │     - Per-page chunks                │
                      │     - Shared chunks (≥2 pages)       │
                      │  4. Astro emits <link rel="stylesheet│
                      │     "> tags in each dist/*/index.html│
                      │  5. Chunks < 4kB inlined as <style>  │
                      │     (build.inlineStylesheets='auto') │
                      │                                      │
                      │  ┌─────────────────────────────────┐ │
                      │  │ NEW: rollup-plugin-visualizer   │ │
                      │  │ emits stats.html + stats.json   │ │
                      │  │ via Vite plugin (last in chain) │ │
                      │  └─────────────────────────────────┘ │
                      └──────────────┬───────────────────────┘
                                     │
                                     ▼
                      ┌──────────────────────────────────────┐
                      │  verify-vs-wordcount                 │
                      │  verify-vs-overlap                   │
                      │  verify-sitemap-determinism          │
                      │  verify-no-google-fonts              │
                      │  verify-on-page-seo                  │
                      │  (existing 5-verifier chain)         │
                      └──────────────┬───────────────────────┘
                                     │
                                     ▼
                      ┌──────────────────────────────────────┐
                      │  OPTIONAL: new diagnose-homepage-css │
                      │  script (walks dist/_astro/*.css,    │
                      │  cross-refs dist/index.html <link>   │
                      │  tags, writes .planning/reports/     │
                      │  homepage-css-{stamp}.json)          │
                      └──────────────────────────────────────┘
```

### Current-state evidence (measured 2026-04-16)

**dist/index.html loads (ALL routes load these two):**
```
/_astro/_slug_.CIgCJX9d.css  86,597 bytes  (17,280 bytes gzipped est.)
/_astro/about.C49NBCVn.css   62,243 bytes  (12,750 bytes gzipped est.)
                             ────────────
                             148,840 bytes  ~30KB on the wire gzipped
```

**Chunk content evidence (from `head -c 500`):**

`about.C49NBCVn.css` — starts with:
```css
*,:before,:after{--tw-border-spacing-x: 0;--tw-border-spacing-y: 0;--tw-translate-x: 0;...
```
Ends with:
```css
...\[\&_th\]\:text-\[var\(--color-text-primary\)\] th{color:var(--color-text-primary)}
```
**Verdict:** This is the Tailwind utility sheet — base reset + all JIT-generated utilities matching the `content` glob.

`_slug_.CIgCJX9d.css` — starts with:
```css
.astro-route-announcer{position:absolute;...}@font-face{font-family:Bricolage Grotesque;...
```
Ends with:
```css
...@keyframes astroSlideFromRight{...} @keyframes astroSlideFromLeft{...} ::view-transition-group(*),::view-transition-old(*),::view-transition-new(*){animation:none!important}
```
**Verdict:** This is ClientRouter + `@fontsource/*` `@font-face` declarations + View Transitions animations + shared component styles. [VERIFIED: byte inspection]

**Scoped-selector counts** (distinguishes "shared library code" from "component-scoped CSS"):
- `about.css`: 0 astro-scoped selectors (100% global/shared)
- `_slug_.css`: 1 astro-scoped selector (essentially all global/shared)

### Pattern 1: Visualizer configuration (Astro 5 + Vite)

**What:** Add the visualizer to `astro.config.mjs` `vite.plugins`.
**When to use:** On-demand via env var (default OFF) — NOT on every build (see Pitfall 1).

```js
// Source: docs.astro.build/en/recipes/analyze-bundle-size/
//         github.com/btd/rollup-plugin-visualizer README
import { defineConfig } from 'astro/config';
import { visualizer } from 'rollup-plugin-visualizer';

const ANALYZE = process.env.ANALYZE === '1';

export default defineConfig({
  // ... existing config ...
  vite: {
    plugins: ANALYZE ? [
      visualizer({
        // Emit BOTH human-readable treemap and machine-readable raw data.
        // Use two visualizer calls in the plugins array, one per template.
        emitFile: false,           // Write to filesystem path, NOT via Rollup emitFile
                                   // (keeps report OUT of dist/ → preserves sitemap determinism)
        filename: '.planning/reports/css-visualizer-{stamp}.html',
        template: 'treemap',
        title: 'Homepage CSS bundle — {date}',
        gzipSize: true,
        brotliSize: true,
        sourcemap: false,          // No sourcemap coupling (keeps it simple)
      }),
      visualizer({
        emitFile: false,
        filename: '.planning/reports/css-visualizer-{stamp}.json',
        template: 'raw-data',
        gzipSize: true,
      }),
    ] : [],
  },
});
```

### Pattern 2: Keep the visualizer OFF by default, gated by env var

**What:** Only load visualizer when `ANALYZE=1`.
**Why:** Preserves byte-identical rebuilds (Phase 123 invariant) — the plugin can shift bundle-graph construction order or add metadata that subtly changes chunk contents.

```js
// Guard at config load time
const ANALYZE = process.env.ANALYZE === '1';

// In plugins array
vite: {
  plugins: ANALYZE ? [visualizer({...})] : [],
}
```

Add a dedicated npm script:
```json
// package.json
{
  "scripts": {
    "build:analyze": "ANALYZE=1 npm run build"
  }
}
```

### Pattern 3: Supplemental CSS diagnosis script (zero-dep, same convention as Phase 122/123/124/125 verifiers)

**What:** A zero-dep ESM Node script that walks `dist/_astro/*.css`, reads `dist/index.html` to identify which chunks load on the homepage, computes raw + gzip sizes, extracts leading/trailing byte samples for identification, and writes a JSON report to `.planning/reports/`.

**Why:** `rollup-plugin-visualizer` undercounts/misses CSS [VERIFIED: plugin source skips non-chunk entries; issue #203 open as bug]. A zero-dep supplement grounds the investigation in actual on-disk bytes.

```js
// scripts/diagnose-homepage-css.mjs — skeleton, NOT final code
import { readFileSync, readdirSync, mkdirSync, writeFileSync } from 'node:fs';
import { gzipSync, brotliCompressSync } from 'node:zlib';
import { resolve } from 'node:path';

const DIST = resolve(process.cwd(), 'dist');
const REPORTS = resolve(process.cwd(), '.planning/reports');

const homepageHtml = readFileSync(resolve(DIST, 'index.html'), 'utf8');
const cssLinks = [...homepageHtml.matchAll(/<link rel="stylesheet" href="([^"]+\.css)"/g)]
  .map(m => m[1]);

const report = cssLinks.map(href => {
  const path = resolve(DIST, href.replace(/^\//, ''));
  const raw = readFileSync(path);
  return {
    href,
    rawBytes: raw.length,
    gzipBytes: gzipSync(raw).length,
    brotliBytes: brotliCompressSync(raw).length,
    leading200: raw.subarray(0, 200).toString('utf8'),
    trailing200: raw.subarray(Math.max(0, raw.length - 200)).toString('utf8'),
    scopedSelectorCount: (raw.toString('utf8').match(/astro-[a-z0-9]{8}/g) || []).length,
  };
});

// Also walk every route HTML and list which CSS chunks load where —
// proves the "shared vs per-route" classification.
// ...

mkdirSync(REPORTS, { recursive: true });
const stamp = new Date().toISOString().replace(/\D/g, '').slice(0, 13);
writeFileSync(resolve(REPORTS, `homepage-css-${stamp}.json`), JSON.stringify(report, null, 2));
```

### Anti-Patterns to Avoid

- **Running the visualizer on every build.** Adds overhead, may introduce non-determinism, emits an HTML file per build. Gate via `ANALYZE=1`.
- **Trusting `rollup-plugin-visualizer`'s CSS totals as ground truth.** Supplement with `wc -c` and `gzip -c | wc -c`. If the treemap shows 0 bytes for a CSS chunk, that's the known bug #203, not a remediation opportunity.
- **Naming the investigation output file `stats.html` in `dist/`.** Placing ANY file in `dist/` after `astro build` breaks the Phase 123 sitemap-determinism verifier if it happens before or during that step, and pollutes the deploy artefact even if after. **Always write to `.planning/reports/`.**
- **Using `emitFile: true` in visualizer options without checking output path.** That option routes through Rollup's emit system and will land the file inside `dist/_astro/` by default — **breaks determinism and ships stats.html to production.**
- **Modifying Tailwind's `content` glob without a diff test.** Any content-glob change shifts which utilities JIT generates. Must verify byte-identical rebuild AND spot-check 5+ routes for visual regression before merging.
- **Assuming "route-specific CSS" from the filename alone.** `about.css` is not the /about/ CSS. It's alphabetically-first-sorted-consumer of a shared chunk.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Bundle visualization | Custom stats HTML emitter | `rollup-plugin-visualizer` | Named in PERF-04, already installed, Astro-docs-blessed |
| CSS minification | Custom minifier | Vite's default (esbuild/lightningcss) | Already handled by the build |
| CSS dead-code elimination | Custom PurgeCSS integration | Tailwind's `content` glob + JIT | Tailwind only generates utilities matching `content` globs — if a utility reaches output, a file in `content` used it [CITED: Tailwind docs] |
| CSS chunk splitting | Manual `rollupOptions.output.manualChunks` | Astro's default behaviour | Per-route + shared chunks are default; overrides are high-risk and listed as out-of-scope |
| Gzip size measurement | Custom compressor | `zlib.gzipSync` (Node built-in) | Zero-dep, bit-identical to `gzip` CLI |

**Key insight:** The entire remediation surface is 5–6 config toggles, not new infrastructure. If this phase writes >200 lines of new JavaScript outside a single `scripts/diagnose-homepage-css.mjs` supplementary script, the plan has drifted.

## Remediation Lever Inventory (IF diagnosis confirms waste)

Ordered by descending expected ROI × inverse risk. Each lever must be individually evaluated against byte-identical rebuild (Phase 123 invariant) and visual regression on ≥5 routes before merge.

### Lever 1: Tailwind `content` glob tightening — HIGH ROI, LOW RISK

**Current:** `content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}']` [VERIFIED: `tailwind.config.mjs` line 6].

**Issue:** The glob matches `.svelte` and `.vue` files but there are none in the repo [VERIFIED: no `.svelte` or `.vue` files found in source tree]. It also scans `.md` + `.mdx` which IS correct (blog posts use Tailwind utilities in MDX content), but **every token that looks like a Tailwind class gets hoisted into the utility sheet**. Tailwind's content scanner is string-based, so `code { @apply font-mono }` content inside a handbook file adds `font-mono` to output.

**Lever:** Run Tailwind's built-in `--debug` mode or inspect generated CSS for utilities that don't appear in any `src/**/*.astro` file (Tailwind 3.4 has `content.files` with a `transform` option). **Low-ROI unless specific over-generation is identified.**

**Risk:** Tightening the glob can remove used utilities and cause visual regression. MUST eyeball-test 5+ routes.

### Lever 2: `@fontsource/*` weight audit — MEDIUM ROI, LOW RISK

**Current (from `src/styles/global.css` lines 7-12):**
```css
@import '@fontsource/bricolage-grotesque/800.css';
@import '@fontsource/dm-sans/500.css';
@import '@fontsource/dm-sans/700.css';
@import '@fontsource/fira-code/400.css';
@import '@fontsource/noto-sans/greek-400.css';
@import '@fontsource/noto-sans/greek-700.css';
```

Plus hand-written `@font-face` rules for DM Sans 400 + Bricolage 700 (LCP-critical, preloaded). Phase 124 notes the hand-written rules DUPLICATE `@fontsource/dm-sans/400.css` + `@fontsource/bricolage-grotesque/700.css` content by design (preload alignment with stable `/fonts/*.woff2` paths) — both sources are intentional.

**Issue:** Each `@fontsource/*/NNN.css` import adds `@font-face` blocks per unicode-range subset (latin, latin-ext, vietnamese, cyrillic, etc.) — typically 3–7 blocks per weight. The shared `_slug_.css` chunk contains all of these. Even a single unused weight could contribute ~2–4KB.

**Lever:** Grep `src/` for actual usage of each weight class (Tailwind `font-medium` = 500, `font-bold` = 700, `font-extrabold` = 800, `font-normal` = 400). Any weight that isn't used in actual rendering (not just in utility generation) is a candidate for removal.

**Risk:** Removing a weight that IS used causes visible FOUT/FOIT. Verify on ≥3 routes.

### Lever 3: `build.inlineStylesheets: 'always'` — HIGH ROI, MEDIUM RISK

**Current:** Default `'auto'` → external `<link rel="stylesheet">` for chunks ≥4KB. Both 62KB + 86KB chunks are external.

**Option:** Set `build.inlineStylesheets: 'always'` to inline all CSS into `<style>` tags in HTML head. Removes 2 render-blocking external requests on homepage.

**Tradeoffs:**
- ✅ **Pros:** Eliminates round-trips on first paint, no cache-miss penalty on first visit, CSS bytes ship with the HTML (which is already gzipped).
- ❌ **Cons:** Every subsequent route loads the same CSS bytes again in their own HTML (no shared cache) — **only wins on single-page visits.** Increases `dist/*/index.html` file sizes substantially (each route adds ~150KB to its HTML before gzip). Increases sitemap generation coupling.
- ❌ **CSP risk:** Current CSP has `style-src 'self' 'unsafe-inline'` [VERIFIED: `src/layouts/Layout.astro` line 78] — `'unsafe-inline'` is already allowed, so inline `<style>` tags don't require CSP changes. **This lever is CSP-neutral.**
- ❌ **Phase 123 invariant:** Inlined CSS changes every `dist/*/index.html` byte layout. Must re-verify byte-identical rebuild.

**Recommendation:** Benchmark this lever with a profile-based decision — likely NOT worth it for a repeat-visit-heavy portfolio site, BUT worth an A/B byte comparison in the diagnosis report.

### Lever 4: Split View Transitions CSS out of the shared chunk — LOW ROI, MEDIUM RISK

**Observation:** `_slug_.css` ends with `@keyframes astroSlideFromRight/Left`, `astroSlideToRight/Left`, `::view-transition-*` rules. These are emitted because `<ClientRouter />` is imported in `Layout.astro` (used on every route).

**Option:** Move `<ClientRouter />` behind a conditional — e.g., only import on routes that benefit from SPA-like transitions. Remove for landing / blog index / static marketing pages.

**Risk:** View Transitions already live on EVERY route. Removing from homepage alone ruptures the SPA-navigation illusion. Not worth the regression risk.

### Lever 5: Strip unused `@astrojs/tailwind` typography plugin styles — LOW ROI, LOW RISK

**Current:** `tailwindcss/typography` is loaded via `plugins: [typography]` [VERIFIED: `tailwind.config.mjs` line 46] with a deep `DEFAULT` config override.

**Lever:** Typography plugin emits `.prose*` utilities. Grep `src/` for `prose` usage; if only used inside one content class (e.g., blog post body), scope Tailwind's typography to that one selector pattern (not needed across all routes' shared chunk).

**Risk:** Requires Tailwind typography scoping knowledge. Medium effort, low payoff.

### Lever 6: Remove unused arbitrary-variant utilities — LOW ROI, LOW RISK

**Observation:** `about.css` ends with `[&_td]:p-2`, `[&_th]:border-b`, `[&_th]:text-left`, etc. These are arbitrary-variant utilities, each one tiny. Unlikely to move the needle meaningfully.

## Documented-Rationale Shape (IF diagnosis shows 132KB is correct)

If the investigation closes via Success Criterion #3, the documented rationale should live at `.planning/phases/126-css-investigation-and-remediation/126-DIAGNOSIS.md` (new artefact type — not a plan or summary) and answer:

1. **What the two shared chunks actually contain** — first/last 200 bytes of each, with annotations tagging each section (Tailwind reset, Tailwind utilities, `@fontsource` @font-face, View Transitions, component scoped styles).
2. **Why they appear on every route** — dependency trace: `Layout.astro` → `global.css` → Tailwind base + `@fontsource` imports; `<ClientRouter />` → View Transitions CSS; every page uses `Layout.astro`.
3. **Why the naming is misleading** — `about.css` = first-alphabetical-sorted-consumer [CITED: withastro/astro#7469].
4. **Compressed vs raw comparison** — ~148KB raw → ~30KB gzipped (≈5:1 ratio, expected for CSS). The actual on-wire cost is ~30KB shared between 1137 URLs, cacheable after first paint.
5. **Per-lever evaluation summary** — for each remediation lever above, state "evaluated, not pursued because X" with the specific tradeoff.
6. **Baseline chunk sizes frozen** — commit the homepage-css-{stamp}.json baseline report alongside the diagnosis so future drift surfaces on the next audit.

This artefact becomes a permanent reference the next auditor can cite when they re-flag the 132KB figure.

## Common Pitfalls

### Pitfall 1: Visualizer output written to `dist/` breaks sitemap determinism

**What goes wrong:** `visualizer({ emitFile: true })` routes through Rollup's asset-emission system and typically ends up in `dist/_astro/stats.html`. Even `visualizer({ filename: 'stats.html' })` (without `emitFile`) writes `stats.html` to `dist/` root by default when invoked from a Vite plugin pipeline [VERIFIED: Astro docs recipe states "stats.html file(s) for your project at the root of your dist/ directory for entirely static sites"]. This pollutes the deploy artefact and, worse, if the write lands mid-build it could perturb the sitemap generation's file ordering.
**Why it happens:** The default filename is relative; `emitFile: true` explicitly uses Rollup's emit path.
**How to avoid:** Always pass an explicit absolute or project-relative path outside `dist/`:
```js
visualizer({
  emitFile: false,
  filename: '.planning/reports/css-visualizer-{stamp}.html',
  // ...
})
```
Verify with `ls dist/ | grep -i stat` after build — must return empty.
**Warning signs:** `stats.html` in git status after `npm run build`; sitemap-determinism verifier fails.

### Pitfall 2: `rollup-plugin-visualizer` CSS coverage is partial

**What goes wrong:** Plugin source filters non-chunk entries; CSS is emitted as assets, not chunks. Treemap may show CSS chunks at zero bytes or omit them entirely [CITED: issue #203 "CSS files reported as zero-length" open bug].
**Why it happens:** Plugin was designed for JS first. CSS support is incidental and incomplete.
**How to avoid:** Treat visualizer output as one input, not ground truth. Supplement with `scripts/diagnose-homepage-css.mjs` (zero-dep) that reads `dist/_astro/*.css` directly and computes raw + gzip sizes.
**Warning signs:** Visualizer shows CSS files with 0B or conspicuously small numbers that don't match `wc -c`.

### Pitfall 3: Misreading shared-chunk names as route-specific

**What goes wrong:** Auditor (human or LLM) sees `about.css` on the homepage, concludes "about page CSS is leaking onto homepage" — a remediation instinct fires. In reality the file is a shared chunk named after the alphabetically-first consumer.
**Why it happens:** File naming heuristic is misleading; Astro docs don't surface this prominently.
**How to avoid:** Before formulating remediation, run the route→chunk mapping step (`grep -oE '/_astro/[^"]+\.css' dist/*/index.html`). If a chunk appears on ≥5 routes, it's a shared chunk regardless of filename.
**Warning signs:** A "per-route" filename loaded on routes unrelated to the filename.

### Pitfall 4: Byte-identical rebuild regression from adding a Vite plugin

**What goes wrong:** Adding `visualizer()` to `vite.plugins` shifts the plugin graph, which can alter module processing order, which can in turn change chunk composition — even if the plugin is meant to be passive.
**Why it happens:** Rollup's plugin pipeline is order-sensitive. Metadata plugins that hook `generateBundle` are typically side-effect-free, but visualiser hooks `buildStart` + `generateBundle` and iterates the full module graph.
**How to avoid:** (a) Guard behind `ANALYZE=1` env var so the plugin doesn't load in normal builds. (b) If enabled on-demand, re-run the Phase 123 determinism verifier BEFORE merging:
```bash
ANALYZE=1 npm run build && sha256sum dist/sitemap-0.xml > /tmp/sha.a
rm -rf dist && ANALYZE=1 npm run build && sha256sum dist/sitemap-0.xml > /tmp/sha.b
diff /tmp/sha.a /tmp/sha.b  # must be empty
```
**Warning signs:** `verify-sitemap-determinism.mjs` fails with a byte-offset diff after adding the plugin.

### Pitfall 5: Tailwind content-glob tightening causes visible regression

**What goes wrong:** Narrowing the glob (e.g., removing `*.svelte,*.vue,*.jsx` extensions) is "safe" in theory since no files match, but in practice Tailwind 3.4 treats globs somewhat loosely — scoping changes can unintentionally drop scanned files.
**Why it happens:** Tailwind's content scanner has its own pattern semantics subtly different from pure minimatch.
**How to avoid:** After ANY `content` change: (a) byte-compare `dist/_astro/about.C49NBCVn.css` before/after, (b) spot-check 5+ routes visually in `npm run preview`, (c) measure the actual byte delta — if less than a few KB, probably not worth the change.
**Warning signs:** Utilities that appeared before no longer render; components look unstyled; Tailwind JIT emits a warning.

### Pitfall 6: Conditional phase execution — "remediate if warranted" trap

**What goes wrong:** Success Criteria #2 and #3 are mutually exclusive. The plan needs a decision gate between diagnosis and remediation. A plan that front-loads remediation tasks before diagnosis has concluded will either (a) remediate something that wasn't actually a problem, or (b) waste time on a plan that gets skipped.
**Why it happens:** LLM-written plans often assume a linear happy path.
**How to avoid:** Structure as TWO plans minimum. Plan 01 = diagnosis only (visualizer wired + supplement script + diagnosis report). Plan 02 ONLY starts after human review of Plan 01's output decides "remediate" vs "close with rationale." Plan 02 has branching content reflecting which lever(s) were chosen.
**Warning signs:** Plan 01 contains any `edit astro.config.mjs` step beyond adding the visualizer plugin gated behind `ANALYZE=1`.

## Code Examples

### Homepage CSS chunk enumeration (diagnosis baseline)

```bash
# Source: direct inspection of this repo's dist/ output 2026-04-16
# Enumerates which CSS files each route loads.
for f in dist/*/index.html dist/index.html; do
  route=$(dirname "$f" | sed "s|dist||; s|^$|/|")
  css=$(grep -oE '/_astro/[^"]+\.css' "$f" 2>/dev/null | sort -u | tr '\n' ',' | sed 's/,$//')
  echo "$route | $css"
done
```

### Visualizer Vite plugin config (from Astro official docs)

```js
// Source: https://docs.astro.build/en/recipes/analyze-bundle-size/
// astro.config.mjs excerpt
import { defineConfig } from 'astro/config';
import { visualizer } from 'rollup-plugin-visualizer';

const ANALYZE = process.env.ANALYZE === '1';

export default defineConfig({
  // ... existing expressiveCode, mdx, tailwind, sitemap, indexNow, notebookPackager, react ...
  vite: {
    plugins: ANALYZE ? [
      visualizer({
        emitFile: false,
        filename: '.planning/reports/css-visualizer.html',
        template: 'treemap',
        gzipSize: true,
        brotliSize: true,
      }),
    ] : [],
  },
});
```

### Astro default CSS chunking (no config change needed to understand it)

```js
// Source: docs.astro.build/en/reference/configuration-reference/#buildinlinestylesheets
// Astro's defaults that govern current behaviour:
{
  build: {
    inlineStylesheets: 'auto',  // Inline chunks < 4kB, link larger ones
  },
  vite: {
    build: {
      assetsInlineLimit: 4096,  // 4kB threshold (Vite default)
      cssCodeSplit: true,       // MUST remain true — setting false breaks Astro build [CITED: #4413]
    },
  },
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Single monolithic CSS file per build | Per-route + shared chunks with 4kB inline threshold | Astro 3.x | Smaller per-route delivery; first-paint cost shifted to cachable shared chunks |
| `@astrojs/tailwind` as separate integration | `astrojs/tailwind` still current in Astro 5 | — | Repo uses this; Tailwind 4.x migration is a separate future concern, out of scope |
| `rollup-plugin-visualizer` JS-only | Partial CSS support (unreliable) | v5+ | Still must supplement with direct byte measurement |
| View Transitions via `<ViewTransitions />` | `<ClientRouter />` (renamed) | Astro 5.x | Cosmetic rename; same CSS-bloat profile |
| Google Fonts CSS CDN | Self-hosted `@fontsource/*` | Phase 124 (2026-04-16) | Shifts font `@font-face` bytes into the shared chunk — *contributes to the 86KB `_slug_.css`* |

**Deprecated/outdated:**
- `ViewTransitions` component → use `ClientRouter`.
- `vite.build.cssCodeSplit = false` — explicitly forbidden by `REQUIREMENTS.md` line 71 due to Astro bug #4413.

## Decision Points for the Planner

The planner MUST surface these in plan stubs and ideally consult the user via `/gsd-discuss-phase` before locking a direction. No CONTEXT.md exists for this phase, so all of these are currently open.

### D1. Visualizer always-on vs env-var-gated?
**Recommendation:** Env-var gated (`ANALYZE=1`).
**Why:** Phase 123 byte-identical rebuild invariant. Zero-cost default builds.
**Counter-argument:** Always-on means the report lands in every CI artefact — but since `dist/` is already the deploy target and the report can't live there, it would still need a separate path.
**Needs user input if:** User wants the report as a CI artefact that travels with every build.

### D2. Treemap-only vs treemap + raw-data + markdown?
**Recommendation:** Treemap (human) + raw-data JSON (machine, for any follow-up script).
**Why:** Minimal overhead, enables both human review and programmatic diffing.
**Counter-argument:** Markdown template produces a committable report that can be PR-reviewed — nice but redundant with the diagnosis artefact.
**Needs user input if:** User wants a PR-reviewable markdown diff.

### D3. Separate supplement script `scripts/diagnose-homepage-css.mjs`?
**Recommendation:** YES. Zero-dep, follows Phase 122/123/124/125 verifier convention, grounds the investigation in on-disk bytes independent of the visualizer's CSS bugs.
**Why:** PERF-04 literally says "diagnosed with rollup-plugin-visualizer" but the visualizer has known CSS gaps. Supplementing with a zero-dep script covers the gap.
**Counter-argument:** Could stuff the logic into the visualizer report generation.
**Needs user input if:** User wants to avoid adding another script file.

### D4. If remediation pursued — which lever(s) and in which order?
**Recommendation:** Don't pre-commit. Gate by diagnosis evidence. Most likely candidate: inlineStylesheets A/B test + `@fontsource` weight audit.
**Why:** Levers have different tradeoffs that only the measurement reveals.
**Counter-argument:** Plan needs SOME structure upfront.
**Needs user input if:** User wants a specific lever locked in before measurement.

### D5. Close-with-rationale artefact location?
**Recommendation:** `.planning/phases/126-css-investigation-and-remediation/126-DIAGNOSIS.md` (new artefact type, committed).
**Why:** Lives with the phase evidence; survives as permanent reference for future audits.
**Counter-argument:** Could live as a permanent `docs/` file.
**Needs user input if:** User wants a site-level doc, not phase-scoped.

### D6. New build-time verifier after the investigation?
**Recommendation:** If remediation reduces homepage CSS, add `scripts/verify-homepage-css-budget.mjs` asserting `homepageCssBytes <= BUDGET` (locks in the win, same convention as Phase 122/123/124/125 gates). If closing with rationale, no new verifier — the diagnosis report is the artefact.
**Why:** Consistency with existing verifier pattern; budget regression alarm.
**Counter-argument:** Adds another build gate; CSS sizes naturally drift with content changes.
**Needs user input if:** User does not want another build-time gate.

### D7. Baseline freezing — commit a homepage-css-{stamp}.json to repo?
**Recommendation:** YES, one baseline (following Phase 122/123/125 convention of committing one representative green-state report).
**Why:** Future audits can diff against this baseline programmatically.
**Counter-argument:** Report rot as bytes change over time.
**Needs user input if:** User prefers no committed baselines.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | The 132KB figure in success criteria refers to the combined size of `about.css` + `_slug_.css` loaded on the homepage | Summary | LOW — the number is close enough (148KB raw) and no other CSS files load on the homepage; if it refers to a different metric (e.g., gzipped size, single file, uncompressed CSS budget target) the planner should confirm |
| A2 | Homepage repeat-visitor CSS cost is primarily the first-paint round-trip for the two external chunks, not bytes downloaded | Remediation Lever 3 analysis | MEDIUM — if the user cares about first-visit-LCP over repeat-visit feel, `inlineStylesheets: 'always'` changes calculus |
| A3 | The user considers byte-identical rebuild (Phase 123) a HARD invariant that any Phase 126 change must preserve | Multiple sections | HIGH — if this invariant is soft, several remediation levers open up |
| A4 | The user wants `rollup-plugin-visualizer` specifically (literal PERF-04 text) over better-for-CSS alternatives like Sonda | Standard Stack alternatives table | MEDIUM — if PERF-04 is interpreted loosely, Sonda is a better fit |
| A5 | The phase should produce a committable permanent-rationale doc if closing without remediation | Documented-Rationale Shape | LOW — if user prefers transient artefact, plan can skip this step |
| A6 | Gzip is representative of real-world on-wire cost (GitHub Pages serves gzip for CSS) | Summary | LOW — GitHub Pages serves gzipped CSS per Content-Encoding; brotli is not served |
| A7 | Adding the visualizer plugin behind an env var guard preserves byte-identical rebuild behaviour on default (no-env-var) builds | Pattern 2 | MEDIUM — conditional loading of Vite plugins is well-supported, but should be re-verified post-implementation |

## Open Questions

1. **Does the user want the visualizer CI-artefact or dev-only?**
   - What we know: local dev has Node 24; CI not inspected in this research.
   - What's unclear: whether GitHub Actions runs `npm run build:analyze`.
   - Recommendation: Default to dev-only (manual `npm run build:analyze`), add to CI later if useful.

2. **Is the 132KB figure from the audit a raw byte count or gzipped?**
   - What we know: raw = 148,840 bytes; gzipped ≈ 30KB.
   - What's unclear: which measurement the audit used.
   - Recommendation: Diagnosis report shows BOTH; user can decide which target matters.

3. **Are there routes where the user cares about CSS budget more than others?**
   - What we know: homepage is explicitly called out in phase description; `/blog/dark-code/` is a key SEO page; Beauty Index has 650+ pages.
   - What's unclear: priority ordering.
   - Recommendation: Diagnosis report includes per-route CSS totals for top-10 routes so the user can prioritize.

4. **Does the user plan to remove `<ClientRouter />` from any route?**
   - What we know: Layout.astro imports it unconditionally.
   - What's unclear: whether the SPA navigation is critical to UX.
   - Recommendation: OUT of scope for this phase unless explicitly raised — ClientRouter-gate is its own decision surface.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js ≥ 22 | `rollup-plugin-visualizer@7` | ✓ | 24.11.1 | — |
| `rollup-plugin-visualizer` | PERF-04 | ✓ | 7.0.0 (devDep) | — |
| `zlib` (node built-in) | diagnosis script gzip calc | ✓ | — | — |
| Vite | plugin loading | ✓ | ships with Astro 5 | — |
| `astro` | build pipeline | ✓ | ^5.3.0 (5.x installed) | — |
| `gzip` CLI | verification of zlib output matches | ✓ | macOS default | `zlib.gzipSync` (still sufficient) |

**Missing dependencies with no fallback:** None.
**Missing dependencies with fallback:** None.

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | vitest 4.0.18 for unit tests; zero-dep ESM Node scripts for build-time assertions (phase convention) |
| Config file | `vitest.config.ts` (unit); no config for build-time scripts (just `node scripts/*.mjs`) |
| Quick run command | `node scripts/diagnose-homepage-css.mjs` (after `astro build`) |
| Full suite command | `npm run build` (exercises full pipeline including all 5 existing verifiers + any new one) |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|--------------|
| PERF-04 | visualizer report exists after `ANALYZE=1 npm run build` | smoke | `ANALYZE=1 npm run build && test -f .planning/reports/css-visualizer*.html` | ❌ Wave 0 |
| PERF-04 | supplement diagnosis JSON exists and lists all CSS files homepage loads | smoke | `node scripts/diagnose-homepage-css.mjs && jq '.[] | .href' .planning/reports/homepage-css-*.json` | ❌ Wave 0 |
| PERF-05 (conditional — only if remediation pursued) | homepage CSS below pre-investigation baseline | budget-assertion | `node scripts/verify-homepage-css-budget.mjs` (threshold derived from diagnosis baseline) | ❌ Wave 0 (conditional) |
| Byte-identical rebuild preserved (cross-phase invariant) | adding visualizer + diagnosis script does not break Phase 123 determinism | regression | `npm run build && npm run verify:sitemap-determinism` (already wired into full build) | ✅ (exists) |

### Sampling Rate

- **Per task commit:** run the targeted verifier(s) for the task — e.g., after wiring visualizer, run `ANALYZE=1 npm run build` once.
- **Per wave merge:** full `npm run build` to exercise all 5 existing verifiers + any new one.
- **Phase gate:** `rm -rf dist && npm run build` clean build green with all verifiers before `/gsd-verify-work`.

### Wave 0 Gaps

- [ ] `scripts/diagnose-homepage-css.mjs` — zero-dep ESM, reads `dist/_astro/*.css` + `dist/index.html`, emits JSON to `.planning/reports/`. Covers PERF-04 supplement.
- [ ] `astro.config.mjs` addition of `vite.plugins` array (env-var-gated visualizer).
- [ ] `package.json` new script `"build:analyze": "ANALYZE=1 npm run build"`.
- [ ] `.gitignore` pattern for `.planning/reports/homepage-css-*.json` + force-add one representative baseline (matches Phase 122/123/125 convention).
- [ ] Only if remediation pursued: `scripts/verify-homepage-css-budget.mjs` — asserts homepage CSS byte count ≤ BUDGET derived from diagnosis. Wired AFTER `verify-on-page-seo` in the build chain.
- [ ] Only if closing with rationale: `.planning/phases/126-css-investigation-and-remediation/126-DIAGNOSIS.md` — permanent rationale artefact.

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | — |
| V3 Session Management | no | — |
| V4 Access Control | no | — |
| V5 Input Validation | no | — |
| V6 Cryptography | no | — |
| V14 Config | yes (partial) | CSP already locked (Phase 124); `inlineStylesheets: 'always'` is CSP-neutral because `style-src 'self' 'unsafe-inline'` is already present |

### Known Threat Patterns for Static SSG + Tailwind + Astro

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Inline CSS introducing XSS sink | Tampering | Astro auto-hashes inline styles; CSP present; out of scope — no user-generated CSS in this phase |
| Visualizer report shipped to production | Information Disclosure | Keep report in `.planning/reports/` (git-ignored pattern); never in `dist/` |
| Third-party Vite plugin adding network telemetry | Spoofing | `rollup-plugin-visualizer` is audited OSS, no network egress (verified via source code inspection — plugin only reads bundle graph and writes local files) |

## Project Constraints (from CLAUDE.md)

- **SEO & visibility priority:** Any CSS change that causes visible FOUC or visual regression undermines recruiter/collaborator first-impression goal — higher bar than pure byte reduction.
- **Structured formatting:** Style changes must preserve heading hierarchy, tables, bold rendering (search engine relevance signals).
- **GitHub-flavored Markdown compatibility:** README rendering not affected by this phase (unless CSS changes somehow affect open-graph image generation, which they don't).

## Sources

### Primary (HIGH confidence)

- [Astro Docs — Analyze bundle size](https://docs.astro.build/en/recipes/analyze-bundle-size/) — official visualizer recipe
- [Astro Docs — Styles and CSS](https://docs.astro.build/en/guides/styling/) — chunking behavior, inlineStylesheets threshold
- [Astro Docs — Configuration Reference: build.inlineStylesheets](https://docs.astro.build/en/reference/configuration-reference/#buildinlinestylesheets) — 'always' / 'auto' / 'never' semantics
- [`rollup-plugin-visualizer` README](https://github.com/btd/rollup-plugin-visualizer) — plugin API, templates, emitFile semantics
- [`rollup-plugin-visualizer` source code](https://github.com/btd/rollup-plugin-visualizer/blob/master/plugin/index.ts) — confirms CSS filtering via `if (bundle.type !== "chunk") continue;`
- Direct byte inspection of this repo's `dist/` output (2026-04-16 19:03 build) — VERIFIED measurements
- Local `package.json`, `astro.config.mjs`, `tailwind.config.mjs`, `src/layouts/Layout.astro`, `src/styles/global.css` — VERIFIED reads

### Secondary (MEDIUM confidence)

- [withastro/astro issue #7469](https://github.com/withastro/astro/issues/7469) — "Strange naming of css files" — confirmed shared-chunk naming strategy (first-alphabetical-consumer)
- [withastro/astro PR #8754](https://github.com/withastro/astro/pull/8754) — "Make CSS chunk names less confusing"
- [withastro/astro issue #4413](https://github.com/withastro/astro/issues/4413) — `cssCodeSplit: false` breaks Astro build (P3 minor bug, confirms REQUIREMENTS.md out-of-scope entry)

### Tertiary (LOW confidence, supplementary)

- [rollup-plugin-visualizer issue #203](https://github.com/btd/rollup-plugin-visualizer/issues/203) — open bug: "CSS files reported as zero-length"
- [rollup-plugin-visualizer issue #165](https://github.com/btd/rollup-plugin-visualizer/issues/165) — closed 2023: "No stats for CSS files in the build output"
- [Sonda bundle analyzer — Astro integration](https://sonda.dev/frameworks/astro) — alternative with claimed better CSS support
- [vite-bundle-analyzer (nonzzz/vite-bundle-analyzer)](https://github.com/nonzzz/vite-bundle-analyzer) — alternative; not used

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — visualizer installed, Astro/Vite versions pinned, Node version verified locally.
- Architecture: HIGH — chunk composition + route mapping verified by direct byte inspection, no inference needed.
- Pitfalls: HIGH — the two most important ones (CSS coverage gap in visualizer; shared-chunk naming) are confirmed via primary sources, not extrapolated.
- Remediation levers: MEDIUM — the levers are real and standard; which one wins depends on measurement the plan will produce, not on research.
- Close-with-rationale shape: MEDIUM — the shape is reasonable and follows Phase 122/123 documentation conventions, but the specific artefact location is my recommendation, not a user-locked decision.

**Research date:** 2026-04-16
**Valid until:** 2026-05-16 (30 days — Astro 5 + rollup-plugin-visualizer are stable; no fast-moving pieces)
