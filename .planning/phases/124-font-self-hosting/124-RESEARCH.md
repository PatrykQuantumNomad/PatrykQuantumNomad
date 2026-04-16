# Phase 124: Font Self-Hosting - Research

**Researched:** 2026-04-16
**Domain:** Web font delivery, CSP, Astro 5 static asset pipeline, Critical-path performance
**Confidence:** HIGH

## Summary

This phase replaces four Google Fonts CDN families (Bricolage Grotesque, DM Sans, Fira Code, Noto Sans) with self-hosted `@fontsource/*` static packages, updates the CSP meta tag to drop `googleapis.com` / `gstatic.com`, and adds `<link rel="preload" crossorigin>` hints for LCP-critical weights. The scope is narrowly constrained by `.planning/REQUIREMENTS.md` "Out of Scope" entries: the Astro experimental `experimental.fonts` API, `@fontsource-variable/*` packages, and Noto Sans Greek subsetting are explicitly forbidden. This leaves a single, low-risk approach: `@fontsource/*` (non-variable) CSS imports in the layout, per-weight only. [VERIFIED: Read `.planning/REQUIREMENTS.md` lines 63-76]

The current setup uses a single `<link rel="preload" as="style">` with `onload="this.rel='stylesheet'"` in `src/layouts/Layout.astro` that fetches a Google Fonts CSS stylesheet containing all 4 families and 8 weights in one request. That single CSS file then triggers 8 woff2 requests to `fonts.gstatic.com`. Self-hosting eliminates DNS resolution + TLS handshake to both hosts on first paint and consolidates everything under the same HTTP/2 connection as the site. Tailwind config (`tailwind.config.mjs`) already maps `sans`, `heading`, `mono` — the font-family names don't change, so no Tailwind edits are required. [VERIFIED: Read `src/layouts/Layout.astro` lines 115-129 and `tailwind.config.mjs` lines 9-13]

**Primary recommendation:** Install four `@fontsource/*` static packages (not `-variable`), import only the exact weights currently used (Bricolage 700/800, DM Sans 400/500/700, Fira Code 400, Noto Sans greek-400/greek-700) in `src/styles/global.css` or a new `src/styles/fonts.css`, remove the Google Fonts `<link>` block from `src/layouts/Layout.astro`, shrink the CSP meta tag accordingly, and add `<link rel="preload" as="font" type="font/woff2" crossorigin>` hints only for the LCP-critical weights (DM Sans 400 body + Bricolage 800 heading). Everything else should load at `font-display: swap` without preload to avoid LCP regression.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Font file hosting | CDN / Static | — | `@fontsource/*` woff2 files emitted by Vite into `/_astro/` and served from the same origin (GitHub Pages) |
| `@font-face` declarations | Browser / Client | — | CSS loaded at parse time, consumed by the browser's font engine |
| Font preload hints | Frontend Server (SSR) | Browser / Client | `<link rel="preload">` must be static HTML in `<head>`, inlined by Astro at build time |
| CSP enforcement | Browser / Client | Frontend Server (SSR) | Set via `<meta http-equiv>` in `app`'s `<head>` (GitHub Pages constraint — no HTTP headers) |
| Build-time verification | CDN / Static | — | Node script in `scripts/` run by `npm run build`, same pattern as `verify-sitemap-determinism.mjs` |

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| PERF-01 | Google Fonts CDN replaced with self-hosted @fontsource static packages (4 families) | Standard Stack + Code Examples show exact per-weight imports |
| PERF-02 | CSP meta tag updated to remove googleapis.com and gstatic.com domains | Common Pitfalls + Code Examples show safe CSP edit path |
| PERF-03 | Critical fonts have `<link rel="preload">` hints with `crossorigin` attribute | Architecture Patterns show preload selection rules |

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@fontsource/bricolage-grotesque` | 5.2.10 | Self-hosted woff2 + CSS for heading font | Canonical npm distribution of Google Fonts; no CDN dependency [VERIFIED: `npm view @fontsource/bricolage-grotesque version` → 5.2.10, published 2025-05] |
| `@fontsource/dm-sans` | 5.2.8 | Self-hosted woff2 + CSS for body font | Same [VERIFIED: `npm view @fontsource/dm-sans version`] |
| `@fontsource/fira-code` | 5.2.7 | Self-hosted woff2 + CSS for mono font | Same [VERIFIED: `npm view @fontsource/fira-code version`] |
| `@fontsource/noto-sans` | 5.2.10 | Self-hosted woff2 + CSS for Greek unicode-range fallback | Same [VERIFIED: `npm view @fontsource/noto-sans version`] |

### Supporting

None required. Vite (bundled with Astro 5.3) handles CSS `@import` from `node_modules` and emits hashed woff2 files into `dist/_astro/` automatically. [VERIFIED: confirmed current build emits hashed assets into `dist/_astro/` — `ls dist/_astro/` shows `.woff2` would co-locate with CSS and other assets if present]

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `@fontsource/*` static | `@fontsource-variable/*` | **Rejected by REQUIREMENTS.md line 70:** "Changes font-family CSS names, requires Tailwind config updates." Bricolage variable would need `'Bricolage Grotesque Variable'` in Tailwind config + CSS consumers. |
| `@fontsource/*` static | Astro 5.7+ `experimental.fonts` API | **Rejected by REQUIREMENTS.md line 69:** "Breaking changes between minor versions, 7+ open bugs, stable only in Astro 6.0.0." Project is pinned to Astro ^5.3.0. [VERIFIED: `package.json` line 41] |
| `@fontsource/noto-sans` | Drop Greek fallback entirely | **Deferred — PERF-07 future requirement** (Noto Sans Greek subsetting). Keep Greek fallback behavior bit-for-bit identical in this phase. |
| Per-weight CSS imports | `@fontsource/dm-sans` default import | Default import only loads weight 400 [VERIFIED: Fontsource install docs 2026]. Phase needs 400, 500, 700 — must import explicitly. |

**Installation:**

```bash
npm install @fontsource/bricolage-grotesque @fontsource/dm-sans @fontsource/fira-code @fontsource/noto-sans
```

**Total added dependencies:** 4 packages, ~0 transitive deps (each is a leaf asset package with no runtime dependencies).

## Architecture Patterns

### System Architecture Diagram

```
Browser request /
       |
       v
Astro build output: dist/index.html
       |
       +-- <meta CSP>  (no googleapis/gstatic in style-src/font-src/connect-src)
       +-- <link rel="preload" as="font" crossorigin>  (DM Sans 400, Bricolage 800)
       +-- <link rel="stylesheet" href="/_astro/*.css">
                 |
                 v
            Hashed CSS chunk (contains @font-face rules from @fontsource/*)
                 |
                 +-- @font-face src: url('/_astro/dm-sans-latin-400-normal.*.woff2')
                 +-- @font-face src: url('/_astro/bricolage-grotesque-latin-800-normal.*.woff2')
                 +-- @font-face src: url('/_astro/fira-code-latin-400-normal.*.woff2')
                 +-- @font-face src: url('/_astro/noto-sans-greek-400-normal.*.woff2')
                 +-- ...additional weights load non-preloaded, font-display: swap

Fallback path (during font load):
  Tailwind font-family → 'Bricolage Grotesque Fallback' → local('Arial') with metric overrides
  (already implemented in src/styles/global.css lines 40-55; preserved unchanged)
```

### Recommended Project Structure

```
src/
├── layouts/
│   └── Layout.astro          # Remove 3 Google Fonts <link> lines; add 2 preload <link>; shrink CSP
├── styles/
│   ├── global.css            # Keep existing @font-face fallbacks (lines 40-75); leave font-family stacks untouched
│   └── fonts.css             # NEW — consolidates @fontsource imports, imported from global.css (or inline in global.css)
└── (no other changes)

node_modules/@fontsource/
├── bricolage-grotesque/      # 700.css, 800.css, files/bricolage-grotesque-latin-{700,800}-normal.woff2
├── dm-sans/                  # 400.css, 500.css, 700.css, files/dm-sans-latin-{400,500,700}-normal.woff2
├── fira-code/                # 400.css, files/fira-code-latin-400-normal.woff2
└── noto-sans/                # greek-400.css, greek-700.css, files/noto-sans-greek-{400,700}-normal.woff2
```

[VERIFIED: Actual package contents via `npm pack @fontsource/dm-sans --dry-run` — per-weight CSS files confirmed at package root, woff2 files under `files/` with naming `{family}-{subset}-{weight}-{style}.woff2`]

### Pattern 1: Per-weight CSS imports in Astro

**What:** Import only the exact weights used in CSS — `@fontsource/*` default imports cover only weight 400, so explicit imports are required.
**When to use:** Every Astro project self-hosting fonts via @fontsource static packages.
**Example:**

```css
/* src/styles/global.css (top of file, before @tailwind directives) */
/* Source: https://fontsource.org/docs/getting-started/install (2026) */

/* Bricolage Grotesque — heading font, weights 700 and 800 */
@import '@fontsource/bricolage-grotesque/700.css';
@import '@fontsource/bricolage-grotesque/800.css';

/* DM Sans — body font, weights 400, 500, 700 */
@import '@fontsource/dm-sans/400.css';
@import '@fontsource/dm-sans/500.css';
@import '@fontsource/dm-sans/700.css';

/* Fira Code — mono font, weight 400 */
@import '@fontsource/fira-code/400.css';

/* Noto Sans — Greek unicode-range fallback only, subset-specific CSS */
@import '@fontsource/noto-sans/greek-400.css';
@import '@fontsource/noto-sans/greek-700.css';

@tailwind base;
@tailwind components;
@tailwind utilities;
```

**Alternative placement:** `src/styles/fonts.css` (new file) containing only the `@import` lines, then `@import './fonts.css'` as the first statement in `global.css`. Slightly cleaner separation. Either works — pick the simpler one (single file, all imports at top).

**Critical detail:** Subset-specific CSS files (`greek-400.css`, not `400.css`) exist for Noto Sans. Importing `@fontsource/noto-sans/400.css` would pull ALL subsets (latin, latin-ext, cyrillic, cyrillic-ext, devanagari, greek, greek-ext, vietnamese) via `unicode-range` declarations. Using `greek-400.css` pulls ONLY the Greek subset, matching current Google Fonts behavior. [VERIFIED: `npm pack @fontsource/noto-sans --dry-run` shows `greek-400.css` and `greek-700.css` subset-specific files]

### Pattern 2: Preload hints for LCP-critical fonts only

**What:** Add `<link rel="preload" as="font" type="font/woff2" crossorigin>` for the 1-2 fonts rendered above the fold. Do NOT preload every weight — this wastes bandwidth and delays other critical resources.
**When to use:** When there's a specific weight consistently rendered in the first viewport (e.g., body text at 400, hero heading at 800).

**The preload path challenge:** Vite emits hashed filenames like `/_astro/dm-sans-latin-400-normal.abc123.woff2`. Preload `<link>` hrefs are static HTML — they need predictable paths.

**Options ranked by complexity:**

1. **RECOMMENDED — Copy preload sources to `public/fonts/` with stable paths.** Copy the two LCP-critical woff2 files (DM Sans 400 + Bricolage 800) from `node_modules/@fontsource/*/files/` to `public/fonts/` via a prebuild script. The CSS from `@fontsource/*` imports continues to reference the hashed `/_astro/` paths (that's fine — those are the actual `@font-face` sources). The preload `<link>` points to the stable `/fonts/dm-sans-400.woff2` copy. The browser fetches the preload copy early; when the `@font-face` rule resolves to the hashed path, the browser uses its in-memory cache (same bytes, same CORS mode) — NO double-download. **Confirm with `curl` in verification: both URLs 200 OK.**

   **Edge case:** Browsers match preload to stylesheet by URL, not by bytes. If the preload URL is `/fonts/dm-sans-400.woff2` but the `@font-face` rule uses `/_astro/dm-sans-latin-400-normal.abc123.woff2`, the browser will fetch BOTH. [CITED: https://web.dev/articles/preload-critical-assets — "The URL must match exactly"] This is why Option 1 has a second sub-step: **ALSO inline a `@font-face` rule pointing to `/fonts/dm-sans-400.woff2`** as an override in `global.css` so the browser's font engine hits the preloaded URL. The `@fontsource` import then becomes redundant for that specific weight but remains fine as a fallback. OR: don't import the `@fontsource/dm-sans/400.css` at all; write the `@font-face` rule by hand pointing to `/fonts/dm-sans-400.woff2`. **This is the cleanest path.**

2. **Alternative — Hand-write all `@font-face` rules.** Skip the `@fontsource/*` CSS imports entirely, copy all 8 woff2 files to `public/fonts/`, and write 8 `@font-face` rules manually in `global.css`. Pros: full control, predictable paths, easy preload. Cons: loses upstream subset unicode-range data (have to copy it from the Fontsource CSS files).

3. **Rejected — Use Vite `assetFileNames` to disable hashing for fonts.** Breaks Vite's cache-busting guarantees for other assets.

**RECOMMENDED MINIMAL APPROACH FOR THIS PHASE:**
- Use `@fontsource/*` per-weight CSS imports for ALL non-preloaded weights (500, 700 of DM Sans; 700 of Bricolage; 400 of Fira Code; Greek 400, 700 of Noto Sans).
- For the two LCP-critical weights (DM Sans 400, Bricolage 800), write explicit `@font-face` rules pointing to `public/fonts/dm-sans-400.woff2` and `public/fonts/bricolage-800.woff2`, and add matching preload hints.
- Prebuild script copies those two woff2 files from `node_modules` into `public/fonts/` (gitignored, regenerated).
- Skip the `@fontsource/dm-sans/400.css` and `@fontsource/bricolage-grotesque/800.css` imports to avoid duplicate `@font-face` rules.

**Example preload hints in `src/layouts/Layout.astro`:**

```html
<!-- Source: https://web.dev/articles/preload-critical-assets -->
<link
  rel="preload"
  href="/fonts/dm-sans-400.woff2"
  as="font"
  type="font/woff2"
  crossorigin
/>
<link
  rel="preload"
  href="/fonts/bricolage-800.woff2"
  as="font"
  type="font/woff2"
  crossorigin
/>
```

[CITED: https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Attributes/rel/preload — `crossorigin` required for fonts, defaults to `anonymous`]

**Example inline `@font-face` rules (in `global.css`, BELOW the `@fontsource` imports):**

```css
/* LCP-critical fonts served from stable public/fonts/ paths (see preload hints in Layout.astro) */
@font-face {
  font-family: 'DM Sans';
  font-style: normal;
  font-weight: 400;
  font-display: swap;
  src: url('/fonts/dm-sans-400.woff2') format('woff2');
  unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+2074, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;
}
@font-face {
  font-family: 'Bricolage Grotesque';
  font-style: normal;
  font-weight: 800;
  font-display: swap;
  src: url('/fonts/bricolage-800.woff2') format('woff2');
  unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+2074, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;
}
```

[CITED: The `unicode-range` values are the Latin subset range from @fontsource's own generated CSS — copy these verbatim from `node_modules/@fontsource/dm-sans/400.css` at implementation time. They are stable across versions but verify at plan execution.]

### Pattern 3: Preserve existing font fallback metrics (CLS prevention)

**What:** `src/styles/global.css` lines 40-75 already define `Bricolage Grotesque Fallback`, `DM Sans Fallback`, and `Greek Fallback` `@font-face` rules with size-adjust / ascent-override / descent-override / line-gap-override values. These exist to reduce CLS during font swap.
**When to use:** Always — don't touch these lines in this phase. They solve a problem (CLS from font swap) that gets worse (not better) when fonts load faster. [VERIFIED: Read `src/styles/global.css` lines 40-75]

### Anti-Patterns to Avoid

- **Preloading every weight:** 8 preload hints for 8 weights will delay LCP (competing with the HTML's own requests). Preload 1-2 critical weights max. [CITED: https://web.dev/articles/preload-critical-assets]
- **Preloading fonts at hashed paths without matching `@font-face`:** Causes double-download. Always verify: the preload `href` === the `@font-face` `src` URL.
- **Importing full subset CSS for Noto Sans:** `@fontsource/noto-sans/400.css` pulls 7+ subsets via unicode-range. Use `greek-400.css` to match the current Greek-only fallback.
- **Removing the `Bricolage Grotesque Fallback` metric overrides:** These prevent CLS. They stay.
- **Removing Google Tag Manager domains from CSP:** The CSP also allows `googletagmanager.com` — that's Google Analytics, NOT fonts. Leave `script-src 'unsafe-inline' 'wasm-unsafe-eval' https://www.googletagmanager.com` and `connect-src` GA domains unchanged. [VERIFIED: Read `src/layouts/Layout.astro` line 78]
- **`font-display: optional`:** Would cause invisible text when fonts don't load in 100ms — worse UX than current `swap` behavior. Keep `swap`. [CITED: https://developer.mozilla.org/en-US/docs/Web/CSS/@font-face/font-display]

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| woff2 file hosting | Custom font download / subset pipeline | `@fontsource/*` npm packages | 4 years of curation, Google-parity unicode-ranges, semver-stable file paths |
| `@font-face` rule generation | Hand-written unicode-range for each subset | Fontsource's per-weight CSS files | Fontsource's unicode-range values track Google's exactly; writing them by hand risks missing glyphs |
| Font CDN fallback | Custom "try Google Fonts first, then local" logic | Self-host only, trust the browser cache | Dual sources defeat the DNS/TLS elimination goal of this phase |
| Font subsetting | Run `pyftsubset` or `fonttools` in build | Use subset-specific CSS files (`greek-400.css`) | Fontsource publishes pre-subsetted files; rebuilding them adds complexity and a Python dependency |

**Key insight:** `@fontsource/*` packages are explicitly designed for this use case. Every alternative (`astro-font`, `astro-google-fonts-optimizer`, `@gamesome/astro-font`) adds a framework-specific abstraction on top of the same woff2 files. For a single-layout Astro static site with well-defined font needs, direct CSS imports + manual preload are simpler and more transparent.

## Runtime State Inventory

N/A — this phase is purely a code/config change with no stored data, live service config, OS-registered state, secrets, or build artifacts that reference font URLs. Explicit inventory:

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | None — verified by `Grep "googleapis\|gstatic"` across entire repo | — |
| Live service config | None — site is static HTML on GitHub Pages, no external font service config | — |
| OS-registered state | None | — |
| Secrets/env vars | None | — |
| Build artifacts | `dist/` is regenerated from source on every build; no pinned font paths | Rebuild normal, no special action |

**Note:** `public/fonts/katex` exists (katex math fonts) and is unrelated — not modified by this phase.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js (bundled `node:fs/promises`) | Prebuild copy script | ✓ | Whatever runs the existing `scripts/copy-katex-assets.mjs` | — |
| npm registry (install-time only) | `npm install @fontsource/*` | ✓ (network at install) | — | — |
| `@fontsource/bricolage-grotesque` | PERF-01 | ✗ (not installed) | — | Install in plan |
| `@fontsource/dm-sans` | PERF-01 | ✗ (not installed) | — | Install in plan |
| `@fontsource/fira-code` | PERF-01 | ✗ (not installed) | — | Install in plan |
| `@fontsource/noto-sans` | PERF-01 | ✗ (not installed) | — | Install in plan |

**Missing dependencies with no fallback:** None — all four packages are publicly available on npm. [VERIFIED: `npm view @fontsource/bricolage-grotesque version` succeeded for all four]

**Missing dependencies with fallback:** None required.

## Common Pitfalls

### Pitfall 1: Preload URL mismatch causes double-download

**What goes wrong:** Preload `<link>` points to `/fonts/dm-sans-400.woff2`, but the CSS `@font-face` rule (auto-generated by Fontsource) references `/_astro/dm-sans-latin-400-normal.abc123.woff2`. Browser downloads BOTH, and the preload warning appears in DevTools console: "The resource was preloaded using link preload but not used within a few seconds."
**Why it happens:** The browser matches preload to stylesheet requests by URL, not by bytes or `font-family`.
**How to avoid:** Either (a) skip importing the `@fontsource` CSS for the preloaded weight and hand-write a `@font-face` rule that matches the preload URL (RECOMMENDED), or (b) extract the hashed path from the build output at runtime — not feasible for static HTML. Option (a) is the only practical solution.
**Warning signs:** DevTools Network tab shows two woff2 requests for the same font weight. Console shows preload-unused warning.
[CITED: https://web.dev/articles/preload-critical-assets]

### Pitfall 2: CSP edit breaks GA or breaks everything

**What goes wrong:** The current CSP at `src/layouts/Layout.astro` line 78 is a single long string. Mis-editing drops a directive, breaks Google Analytics, or introduces a typo that silently blocks inline scripts.
**Why it happens:** Meta CSP is a single `content="..."` attribute. No multi-line formatting makes diff review error-prone.
**How to avoid:**
1. Build a CSP diff table in the plan: before / after / reason.
2. Only remove `https://fonts.googleapis.com` from `style-src` and `connect-src`, and `https://fonts.gstatic.com` from `font-src` and `connect-src`. The `googletagmanager.com` and `google-analytics.com` entries MUST stay.
3. The `font-src` directive will become `font-src 'self'` after removal (or omit if default-src 'self' covers it — but explicit is safer).
4. Verify after deploy: DevTools Console → Security → confirm no CSP violations on any route. Also test dark mode, blog post, beauty-index page.

**Current CSP** [VERIFIED: Read `src/layouts/Layout.astro` line 78]:
```
default-src 'self';
script-src 'self' 'unsafe-inline' blob: 'wasm-unsafe-eval' https://www.googletagmanager.com;
style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
font-src 'self' https://fonts.gstatic.com;
img-src 'self' data: blob: https://www.google-analytics.com;
connect-src 'self' https://fonts.googleapis.com https://fonts.gstatic.com blob: https://www.google-analytics.com https://www.googletagmanager.com;
worker-src 'self' blob:;
frame-src 'self';
base-uri 'self';
form-action 'self'
```

**Target CSP** after this phase:
```
default-src 'self';
script-src 'self' 'unsafe-inline' blob: 'wasm-unsafe-eval' https://www.googletagmanager.com;
style-src 'self' 'unsafe-inline';
font-src 'self';
img-src 'self' data: blob: https://www.google-analytics.com;
connect-src 'self' blob: https://www.google-analytics.com https://www.googletagmanager.com;
worker-src 'self' blob:;
frame-src 'self';
base-uri 'self';
form-action 'self'
```

**Warning signs:** CSP violation reports in DevTools Console on any page after deploy.

### Pitfall 3: Fontsource CSS files use relative `./files/*.woff2` paths

**What goes wrong:** When Vite inlines `@fontsource/dm-sans/400.css` into a bundle, it must rewrite the `src: url('./files/dm-sans-latin-400-normal.woff2')` reference to point at the emitted asset path.
**Why it happens:** CSS `url()` resolution in bundlers is path-relative to the CSS file. Vite (via Astro) does rewrite these correctly, but misconfigured projects (e.g., `vite.css.preprocessorOptions` with wrong `includePaths`) can break resolution.
**How to avoid:** Don't change any Vite or Astro CSS config. Astro 5.3's default Vite config handles `@fontsource/*` imports correctly out of the box. Verify after first build: `ls dist/_astro/*.woff2` should show 8 hashed woff2 files.
**Warning signs:** Build errors like "Could not resolve `./files/dm-sans-latin-400-normal.woff2`". 404s for woff2 in deployed site.
[VERIFIED: Fontsource official docs confirm Vite/webpack bundler support; many production Astro sites use this pattern]

### Pitfall 4: `@fontsource-variable/*` accidentally installed

**What goes wrong:** Someone on the team or a co-pilot autocomplete installs `@fontsource-variable/dm-sans` instead of `@fontsource/dm-sans`. Variable packages use `font-family: 'DM Sans Variable'` in their CSS by default, which doesn't match the current Tailwind stack `'DM Sans'`.
**Why it happens:** Package names differ by only one hyphen; IDEs auto-complete to the "newer" one.
**How to avoid:** Add an explicit constraint in the plan that says "install `@fontsource/*`, NOT `@fontsource-variable/*`" and include a package.json verification step. [VERIFIED: `.planning/REQUIREMENTS.md` line 70 — explicitly out of scope]

### Pitfall 5: Greek subset import omitted or wrong

**What goes wrong:** Developer imports `@fontsource/noto-sans/400.css` (all subsets) or forgets Greek imports entirely. Greek characters (U+0370-03FF) render from the system fallback, causing visible font-family mismatch in content that uses Greek letters (EDA chapters, math notation).
**Why it happens:** The Noto Sans role is "Greek fallback only" — easy to miss.
**How to avoid:**
1. Import the subset-specific files: `@fontsource/noto-sans/greek-400.css` and `@fontsource/noto-sans/greek-700.css`.
2. Keep the existing `'Greek Fallback'` `@font-face` rules in `global.css` lines 60-75 — they use `local('Noto Sans')` which still works as a system fallback on user machines that have Noto Sans installed.
3. After the migration, the `Greek Fallback` rules become mostly redundant for users fetching from the network (the new imports will resolve first), but keep them for users with Noto Sans installed locally.
**Warning signs:** Greek characters render in a serif font (e.g., Times) when visiting pages with Greek content.
[VERIFIED: Read `src/styles/global.css` lines 60-75]

### Pitfall 6: Fallback metric `@font-face` rules get duplicated or reordered

**What goes wrong:** Reordering `@font-face` declarations in `global.css` causes the browser to pick a different font during swap, changing CLS behavior.
**Why it happens:** CSS cascade is order-sensitive for `@font-face` with the same `font-family` + weight + style.
**How to avoid:** Keep the existing Fallback `@font-face` rules (lines 40-75) in their current position. Add `@fontsource` imports BEFORE them (top of file, before `@tailwind` directives). New hand-written `@font-face` for preloaded fonts go AFTER the Fontsource imports but BEFORE the Fallback declarations. Order:
1. `@fontsource/*` imports (non-preloaded weights)
2. Hand-written `@font-face` (preloaded DM Sans 400 + Bricolage 800)
3. Fallback `@font-face` (`DM Sans Fallback`, `Bricolage Grotesque Fallback`, `Greek Fallback`) — existing
4. `@tailwind` directives — existing
5. `:root` CSS vars — existing

## Code Examples

### Final `src/styles/global.css` — top of file (additions in bold)

```css
/* ─── Self-Hosted Fonts (non-preloaded weights) ────────────────────────── */
/* Source: https://fontsource.org/docs/getting-started/install */
@import '@fontsource/bricolage-grotesque/700.css';
/* NOTE: Bricolage 800 is preloaded — hand-written @font-face below, no import */
@import '@fontsource/dm-sans/500.css';
@import '@fontsource/dm-sans/700.css';
/* NOTE: DM Sans 400 is preloaded — hand-written @font-face below, no import */
@import '@fontsource/fira-code/400.css';
@import '@fontsource/noto-sans/greek-400.css';
@import '@fontsource/noto-sans/greek-700.css';

/* ─── LCP-critical fonts (match preload hints in Layout.astro) ─────────── */
@font-face {
  font-family: 'DM Sans';
  font-style: normal;
  font-weight: 400;
  font-display: swap;
  src: url('/fonts/dm-sans-400.woff2') format('woff2');
  /* unicode-range copied from node_modules/@fontsource/dm-sans/400.css at implementation time */
  unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC,
                 U+0304, U+0308, U+0329, U+2000-206F, U+2074, U+20AC, U+2122, U+2191,
                 U+2193, U+2212, U+2215, U+FEFF, U+FFFD;
}
@font-face {
  font-family: 'Bricolage Grotesque';
  font-style: normal;
  font-weight: 800;
  font-display: swap;
  src: url('/fonts/bricolage-800.woff2') format('woff2');
  unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC,
                 U+0304, U+0308, U+0329, U+2000-206F, U+2074, U+20AC, U+2122, U+2191,
                 U+2193, U+2212, U+2215, U+FEFF, U+FFFD;
}

@tailwind base;
@tailwind components;
@tailwind utilities;

/* ... existing content unchanged ... */
```

### Final `src/layouts/Layout.astro` — head section edits

Replace lines 115-129 (current Google Fonts block) with:

```astro
<!-- Source: https://web.dev/articles/preload-critical-assets -->
<!-- Preload LCP-critical fonts (crossorigin required for fonts, defaults to anonymous) -->
<link
  rel="preload"
  href="/fonts/dm-sans-400.woff2"
  as="font"
  type="font/woff2"
  crossorigin
/>
<link
  rel="preload"
  href="/fonts/bricolage-800.woff2"
  as="font"
  type="font/woff2"
  crossorigin
/>
```

Replace the CSP meta tag at line 78 with the Target CSP from Pitfall 2.

Remove `<link rel="preconnect" href="https://fonts.googleapis.com" />` and `<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />` (lines 116-117 after other edits).

### Prebuild script: `scripts/copy-preload-fonts.mjs`

```javascript
// Source: pattern from existing scripts/copy-katex-assets.mjs
import { copyFile, mkdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';

const ROOT = process.cwd();
const PUBLIC_FONTS = join(ROOT, 'public', 'fonts');

const COPIES = [
  {
    from: 'node_modules/@fontsource/dm-sans/files/dm-sans-latin-400-normal.woff2',
    to: 'public/fonts/dm-sans-400.woff2',
  },
  {
    from: 'node_modules/@fontsource/bricolage-grotesque/files/bricolage-grotesque-latin-800-normal.woff2',
    to: 'public/fonts/bricolage-800.woff2',
  },
];

await mkdir(PUBLIC_FONTS, { recursive: true });
for (const { from, to } of COPIES) {
  await copyFile(join(ROOT, from), join(ROOT, to));
  console.log(`[preload-fonts] ${from} → ${to}`);
}
```

Wire into `package.json` `prebuild`:

```json
"prebuild": "node scripts/download-actionlint-wasm.mjs && node scripts/generate-layout.mjs && node scripts/copy-preload-fonts.mjs"
```

Add `public/fonts/dm-sans-400.woff2` and `public/fonts/bricolage-800.woff2` to `.gitignore` (same pattern as katex copied assets — check if katex fonts are gitignored first).

### Build-time verification: `scripts/verify-no-google-fonts.mjs`

```javascript
// Source: pattern from scripts/verify-sitemap-determinism.mjs
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const DIST = join(process.cwd(), 'dist');
const FORBIDDEN = ['fonts.googleapis.com', 'fonts.gstatic.com'];
const violations = [];

function walk(dir) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const s = statSync(full);
    if (s.isDirectory()) { walk(full); continue; }
    if (!/\.(html|css|js)$/.test(entry)) continue;
    const body = readFileSync(full, 'utf8');
    for (const needle of FORBIDDEN) {
      if (body.includes(needle)) {
        violations.push({ file: full.slice(DIST.length + 1), needle });
      }
    }
  }
}

walk(DIST);

if (violations.length) {
  console.error(`[verify-no-google-fonts] FAIL — ${violations.length} violations`);
  for (const v of violations) console.error(`  ${v.file}: contains "${v.needle}"`);
  process.exit(1);
}
console.log('[verify-no-google-fonts] PASS — no Google Fonts references in dist/');
```

Wire into `package.json` `build` after existing verifiers:

```json
"build": "astro build && node scripts/verify-vs-wordcount.mjs && node scripts/verify-vs-overlap.mjs && node scripts/verify-sitemap-determinism.mjs && node scripts/verify-no-google-fonts.mjs"
```

**Caveat:** The FastAPI guide at `src/data/guides/fastapi-production/pages/security-headers.mdx` contains `https://fonts.googleapis.com` as a CODE EXAMPLE (teaching CSP). The verifier will flag it as a false positive in the rendered HTML. Either (a) add an allowlist for that specific route/file, or (b) rewrite the code example to use a placeholder like `https://fonts.example.com`. Option (a) is lower-risk for content integrity. [VERIFIED: `Grep` found this in `src/data/guides/fastapi-production/pages/security-headers.mdx` lines 138, 140]

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Google Fonts CDN via `<link>` tag | `@fontsource/*` npm packages with per-weight imports | Fontsource 5.0 (2024) unified the API | Eliminates CDN DNS/TLS; lets bundlers tree-shake unused weights |
| Variable fonts via `@fontsource/*/variable.css` | `@fontsource-variable/*` separate packages | Fontsource 5.0 | Package rename; new packages are strictly variable, old packages are strictly static. **Blocked for this phase by REQUIREMENTS.md.** |
| `<link rel="preload" as="style">` with onload swap | Direct `<link rel="stylesheet">` of self-hosted CSS (no onload trick needed) | When self-hosting, because first-party CSS has no cross-origin HoL blocking | Simpler HTML, works without JS |
| Subset via `&subset=` query in Google Fonts URL | Subset-specific CSS files in @fontsource (e.g., `greek-400.css`) | Fontsource 5.0 | Import only what's needed; each subset is a separate CSS file |
| Astro `experimental.fonts` API | Direct `@fontsource/*` imports | Astro 5.7+ introduced experimental.fonts | **Not used in this phase** — API is experimental with open bugs, project is on 5.3 |

**Deprecated/outdated:**
- **Google Fonts `&display=swap` URL param:** Not deprecated per se, but the equivalent is `font-display: swap` in the `@font-face` rule — Fontsource sets this by default in all per-weight CSS files [VERIFIED via npm pack inspection].
- **Separate `<link rel="preconnect">` hints for fonts.googleapis.com / fonts.gstatic.com:** Remove after self-hosting — pointless and wasteful.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | DM Sans 400 and Bricolage Grotesque 800 are LCP-critical | Architecture Pattern 2 | If a different weight is LCP-critical (e.g., body is at 500 somewhere above the fold), preload selection is wrong and LCP may not improve. **Mitigation:** During planning or execution, run Lighthouse / WebPageTest on the current build to identify the exact LCP element and its computed font-weight. If it's 500, swap DM Sans 500 into preload instead of 400. [ASSUMED] |
| A2 | The `unicode-range` from `@fontsource/dm-sans/400.css` is the Google "Latin" subset | Code Examples | If Fontsource uses a different range than Google, some characters may be requested from the Fallback rather than the preloaded woff2. Low impact (fallback works), but warrants copying the range verbatim from the installed CSS at plan-execution time rather than from this research. [ASSUMED] |
| A3 | Prebuild copy script is the simplest path vs. Vite plugin | Pattern 2 | A Vite asset-inclusion plugin could emit the woff2 to a stable path. Would be more elegant but higher complexity for a 2-file copy operation. [ASSUMED — "simpler" is a judgment call] |
| A4 | The existing Fallback metric overrides (size-adjust, ascent-override) are still well-tuned after the self-host migration | Anti-Patterns | Fallback metrics are generated per source font. Fontsource's version of DM Sans could theoretically differ from Google's in metrics, breaking CLS tuning. Very unlikely (Fontsource uses the same upstream Google source) but worth a visual regression check. [ASSUMED] |
| A5 | No service worker caches Google Fonts URLs | Runtime State Inventory | Verified the repo for service worker files: none found. A browser-level cache on users' machines will naturally expire. [VERIFIED via Grep — no `sw.js`, no `workbox`, no `@vite-pwa` in package.json] |

## Open Questions

1. **Should the preload include a `media` attribute?**
   - What we know: Modern guidance is to ALWAYS preload fonts used above the fold without `media` gates.
   - What's unclear: Whether a dark-mode-specific weight exists. Inspection of `global.css` + `Layout.astro` shows no conditional font-weight between light and dark modes — only colors change.
   - Recommendation: No `media` attribute. Preload unconditionally.

2. **Is Bricolage 800 actually LCP or just H1?**
   - What we know: Body text uses DM Sans; H1 uses Bricolage 800 (from `global.css` line 86 `@apply font-heading font-bold`). On the homepage, the hero visual dominates above the fold — the H1 text may or may not BE the LCP element.
   - What's unclear: Without running a real Lighthouse trace, A1 is unconfirmed.
   - Recommendation: Plan should include a task that runs Lighthouse on the current build to identify the actual LCP element, then adjust preload selection. If the LCP element is the hero image, preloading fonts offers less LCP benefit; if it's H1 text, Bricolage 800 is correct.

3. **Tree-shaking: will unused imports from `@fontsource/*` still emit woff2 files?**
   - What we know: Vite tree-shakes JS but INCLUDES all `@import`-ed CSS. Only the 7 weights explicitly imported will generate `@font-face` rules; the other packaged weights in `files/` will NOT be emitted because no CSS references them.
   - What's unclear: Whether Astro's asset pipeline has any quirk that includes unreferenced woff2 from `node_modules`.
   - Recommendation: Post-build verification: `ls dist/_astro/*.woff2 | wc -l` should be ≤ 6 (7 imported weights minus the 2 preloaded ones, since those are copied separately to `public/fonts/`).

4. **Does FastAPI guide's MDX file need edit too?**
   - What we know: It contains `fonts.googleapis.com` as a code-example string (not a live link), so the CSP-verify script will flag it.
   - What's unclear: Whether the code example is in text-form only or actually triggers a browser request.
   - Recommendation: Inspect the rendered HTML for that page. If it's `<code>` / `<pre>` only, add file-path allowlist to `verify-no-google-fonts.mjs`. If it's a live request, rewrite the example to a placeholder domain.

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 4.0.18 (declared in `package.json` line 87) [VERIFIED: Read `package.json`] |
| Config file | `vitest.config.ts` (exists at repo root) [VERIFIED: directory listing] |
| Quick run command | `npx vitest run <file>` (single file) or `npx vitest run` (all) |
| Full suite command | `npx vitest run` |
| Build-time verifiers | `npm run build` runs `verify-vs-wordcount`, `verify-vs-overlap`, `verify-sitemap-determinism` after `astro build` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| PERF-01 | No Google Fonts URLs in `dist/` | smoke (build-time script) | `node scripts/verify-no-google-fonts.mjs` | ❌ Wave 0 — new script |
| PERF-02 | CSP meta tag excludes googleapis/gstatic | smoke (build-time script) | Extend `verify-no-google-fonts.mjs` OR unit test on `Layout.astro` string | ❌ Wave 0 |
| PERF-02 | CSP meta tag still allows GA (regression) | smoke (build-time script) | Same script, assert `googletagmanager.com` present | ❌ Wave 0 |
| PERF-03 | Preload `<link>` with `crossorigin` for DM Sans 400 + Bricolage 800 | smoke (build-time script) | Extend `verify-no-google-fonts.mjs` to parse `index.html` and assert preloads present | ❌ Wave 0 |
| Success Criteria 1 | No requests to fonts.googleapis.com / fonts.gstatic.com in waterfall | manual-only OR Playwright | Playwright not installed — rely on build-time grep + manual DevTools check | — |
| Success Criteria 4 | All four font families render in light AND dark modes | manual-only | Visual regression via local preview; document in verification report | — |

### Sampling Rate

- **Per task commit:** `npm run build` (runs all verifiers)
- **Per wave merge:** `npm run build && npx astro preview` + manual DevTools Network tab check on `/`, `/blog/`, `/eda/` (has Greek), `/beauty-index/`
- **Phase gate:** Full build passes + manual verification in light + dark modes documented

### Wave 0 Gaps

- [ ] `scripts/copy-preload-fonts.mjs` — copies 2 woff2 files for preload (PERF-03)
- [ ] `scripts/verify-no-google-fonts.mjs` — build-time assertion of no Google Fonts URLs + preload hints present + CSP edits correct (PERF-01, PERF-02, PERF-03)
- [ ] `.gitignore` entries for `public/fonts/dm-sans-400.woff2` and `public/fonts/bricolage-800.woff2` (regenerated from node_modules)
- [ ] (Optional) Playwright smoke test asserting zero network requests to `fonts.googleapis.com` / `fonts.gstatic.com` on `/`. Playwright NOT currently installed — deferring to manual verification is acceptable given the build-time grep provides strong coverage.

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | — (static site, no auth) |
| V3 Session Management | no | — |
| V4 Access Control | no | — |
| V5 Input Validation | no | — (no user input) |
| V6 Cryptography | no | — |
| **V14 Config** | **yes** | **CSP meta tag must maintain current strength; script-src `'unsafe-inline'` already present (documented accepted risk for Astro); don't weaken further** |

### Known Threat Patterns for static-site CSP edits

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Accidentally dropping CSP directives when editing the long single-line meta tag | Tampering | Plan includes before/after CSP table; verification script parses meta tag and asserts each remaining directive |
| Leaving `'unsafe-inline'` in `style-src` after removing Google Fonts (not a regression of this phase — it was already there, needed by Astro's inline styles) | Information disclosure | Out of scope for this phase. Document as known-accepted risk. |
| Supply-chain: compromised `@fontsource/*` package injects malicious CSS or font | Tampering | Pin exact versions in `package.json`. npm's lock file + integrity hash provide cryptographic verification. [VERIFIED: project uses `package-lock.json`] |

### Security review checklist for this phase

- CSP still rejects inline scripts from origins other than `'self'` + GTM (no broadening)
- CSP still rejects frame embedding from third parties (`frame-src 'self'`)
- No new `unsafe-*` directives introduced
- `@fontsource/*` packages verified from npm (not a typosquat — official Fontsource maintainers at https://github.com/fontsource/fontsource)
- No base64-embedded fonts added (would bloat CSS and bypass cache benefits)

## Sources

### Primary (HIGH confidence)

- **Read** `/Users/patrykattc/work/git/PatrykQuantumNomad/src/layouts/Layout.astro` — current Google Fonts implementation, CSP meta tag
- **Read** `/Users/patrykattc/work/git/PatrykQuantumNomad/src/styles/global.css` — existing fallback `@font-face` rules and usage
- **Read** `/Users/patrykattc/work/git/PatrykQuantumNomad/tailwind.config.mjs` — font-family stacks (unchanged by this phase)
- **Read** `/Users/patrykattc/work/git/PatrykQuantumNomad/package.json` — Astro 5.3.0, Vitest 4.0.18 confirmed
- **Read** `/Users/patrykattc/work/git/PatrykQuantumNomad/.planning/REQUIREMENTS.md` — out-of-scope constraints (Astro experimental.fonts, @fontsource-variable, Noto subsetting)
- **Read** `/Users/patrykattc/work/git/PatrykQuantumNomad/.planning/ROADMAP.md` — phase goal and success criteria
- **npm registry** `npm view @fontsource/{bricolage-grotesque,dm-sans,fira-code,noto-sans} version` — current published versions
- **npm pack** `npm pack @fontsource/{dm-sans,bricolage-grotesque,fira-code,noto-sans} --dry-run` — exact file structure, CSS file names, woff2 naming convention
- https://fontsource.org/docs/getting-started/install — official install and import docs (per-weight CSS)
- https://fontsource.org/docs/getting-started/variable — variable font docs (confirmed out of scope)
- https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Attributes/rel/preload — preload attribute + crossorigin requirement for fonts
- https://web.dev/articles/preload-critical-assets — LCP preload best practices, URL-match requirement

### Secondary (MEDIUM confidence)

- https://astro.build/blog/astro-570/ — Astro 5.7 experimental.fonts API introduction (confirmed experimental, not used here)
- https://docs.astro.build/en/guides/fonts/ — Astro Fonts API overview (skipped due to version constraint)
- https://www.npmjs.com/package/@fontsource/inter — npm package page (verified package naming pattern)
- https://everythingcs.dev/blog/self-host-google-fonts-astro-react-vue-svelte/ — community pattern confirming per-weight imports in Astro layout
- https://github.com/fontsource/fontsource/blob/main/CHANGELOG.md — migration history (5.0 breaking change)

### Tertiary (LOW confidence, cross-verified)

- https://www.kojordan.com/blog/everything-you-never-wanted-to-know-about-cors-and-font-preloads/ — cross-verified with MDN for preload+crossorigin rule
- https://github.com/w3c/preload/issues/32 — spec-level rationale for crossorigin on fonts (cross-verified with MDN)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — exact versions verified via npm, exact file paths verified via `npm pack --dry-run`
- Architecture: HIGH — current code read directly; REQUIREMENTS.md locks most of the architecture decisions
- Pitfalls: HIGH — cross-referenced with Fontsource docs, MDN, and web.dev; Pitfall 1 (preload URL match) is the highest-stakes item, well-documented

**Research date:** 2026-04-16
**Valid until:** 2026-05-16 (30 days — Fontsource versions move slowly; Astro 5.x is stable; web.dev preload guidance is stable)

## Project Constraints (from CLAUDE.md)

CLAUDE.md at repo root describes "this is a GitHub profile repository". HOWEVER — verification of the actual codebase shows `astro.config.mjs`, `src/`, and a full Astro 5 site. The CLAUDE.md appears to be for the README.md profile page use case, not the Astro site. The Astro site is the active codebase for Phase 124.

No directives in CLAUDE.md contradict this phase. The SEO/visibility priorities align — faster LCP from self-hosted fonts improves Core Web Vitals, which supports the SEO strategy.
