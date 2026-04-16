---
phase: 124-font-self-hosting
plan: 01
subsystem: fonts
tags:
  - perf
  - csp
  - fonts
  - self-hosting
  - lcp
requirements:
  - PERF-01
  - PERF-02
  - PERF-03
dependency_graph:
  requires:
    - "@fontsource/* packages at 5.x (npm)"
    - "public/ static asset serving (Astro default)"
  provides:
    - "Self-hosted font delivery via /fonts/*.woff2 + bundled /_astro/*.woff2"
    - "Shrunken CSP meta tag (no external font allowlist)"
    - "2 preload hints matching @font-face src URLs exactly"
  affects:
    - "src/layouts/Layout.astro (CSP + head link rewrite)"
    - "src/styles/global.css (front-matter rewrite with @import + @font-face)"
    - "package.json prebuild chain"
tech_stack:
  added:
    - "@fontsource/bricolage-grotesque@5.2.10"
    - "@fontsource/dm-sans@5.2.8"
    - "@fontsource/fira-code@5.2.7"
    - "@fontsource/noto-sans@5.2.10"
  patterns:
    - "Prebuild copy script pattern (mirrors scripts/copy-katex-assets.mjs)"
    - "Preload-matching-@font-face src URL to avoid double-download"
key_files:
  created:
    - scripts/copy-preload-fonts.mjs
    - public/fonts/dm-sans-400.woff2 (gitignored — regenerated each prebuild)
    - public/fonts/bricolage-800.woff2 (gitignored — regenerated each prebuild)
  modified:
    - package.json
    - package-lock.json
    - .gitignore
    - src/styles/global.css
    - src/layouts/Layout.astro
decisions:
  - "Static @fontsource/* packages chosen over @fontsource-variable/* to preserve existing Tailwind font-family stacks without tailwind.config.mjs edits (Pitfall 4 / REQUIREMENTS line 70)"
  - "LCP weight pair kept at RESEARCH default: DM Sans 400 (body) + Bricolage 800 (H1) — no Lighthouse LCP measurement was performed (deferred to Plan 02 verifier checkpoint per plan's fallback clause)"
  - "Fira Code subset imports left at default-weight preset (400.css pulls all subsets including cyrillic/greek); could be narrowed to fira-code/latin-400.css in a future optimization but not in scope here — mirrors prior Google Fonts behavior which also delivered the full subset list"
  - "Hand-written @font-face rules omit woff fallback (woff2 only) because CanIUse shows 97%+ coverage; fontsource per-weight CSS keeps the woff fallback for non-preloaded weights"
metrics:
  duration: "5 minutes (11:00:13 -> 11:04:52 -0400)"
  completed_date: "2026-04-16"
  tasks: 3
  files_changed: 6
  insertions: 122
  deletions: 17
---

# Phase 124 Plan 01: Font Self-Hosting Migration Summary

Replaced the Google Fonts CDN `<link>` block with self-hosted `@fontsource/*` static packages, added stable-path preload hints for LCP-critical weights (DM Sans 400 + Bricolage 800), and shrunk the CSP meta tag to drop `fonts.googleapis.com` / `fonts.gstatic.com` while preserving every GA allowlist entry byte-for-byte.

## What Shipped

### Task 1 — @fontsource packages + prebuild copy script (commit `08e8e33`)

- Installed 4 fontsource packages at versions pinned in `package-lock.json`:
  - `@fontsource/bricolage-grotesque` **5.2.10**
  - `@fontsource/dm-sans` **5.2.8**
  - `@fontsource/fira-code` **5.2.7**
  - `@fontsource/noto-sans` **5.2.10**
- Created `scripts/copy-preload-fonts.mjs` (29 lines) — pure Node ESM, mirrors the `scripts/copy-katex-assets.mjs` pattern. Copies two woff2 files from `node_modules/@fontsource/*/files/` into `public/fonts/` with stable flat filenames (`dm-sans-400.woff2`, `bricolage-800.woff2`). The flat filenames are load-bearing: the preload `<link href>` in `Layout.astro` must match the `@font-face src url()` in `global.css` exactly, or the browser issues a second request and discards the preload (RESEARCH Pitfall 1).
- Chained the new script into `package.json`'s `prebuild`:
  ```
  prebuild: download-actionlint-wasm.mjs && generate-layout.mjs && copy-preload-fonts.mjs
  ```
  Order matters because `npm run build` runs `prebuild` before `astro build`, which is before the Phase 122/123 verifiers. Adding the copy step here guarantees `dist/fonts/` is populated for every build without needing dev to remember a manual step.
- Extended `.gitignore` with the two specific filenames (not the whole `public/fonts/` directory — that also contains Phase 112 katex math woff2 files that ARE committed).

### Task 2 — `src/styles/global.css` (commit `16fce1b`)

- Prepended 6 `@fontsource` per-weight CSS imports above the existing `@tailwind` directives. CSS-spec requires `@import` statements to be the very first non-comment rules in a stylesheet, so the `@tailwind` block had to move down exactly three lines.
  - `@fontsource/bricolage-grotesque/700.css`
  - `@fontsource/dm-sans/500.css`
  - `@fontsource/dm-sans/700.css`
  - `@fontsource/fira-code/400.css`
  - `@fontsource/noto-sans/greek-400.css`
  - `@fontsource/noto-sans/greek-700.css`
- Added 2 hand-written `@font-face` rules for DM Sans 400 + Bricolage 800 pointing to `/fonts/dm-sans-400.woff2` and `/fonts/bricolage-800.woff2` respectively, with `font-display: swap` and woff2-only `src`.
- **Unicode-range strings copied verbatim from `node_modules/@fontsource/*/400.css` and `800.css` latin subset block** (captured here for future re-derivation if packages churn):

  ```
  DM Sans 400 (latin):
    U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,
    U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,
    U+2212,U+2215,U+FEFF,U+FFFD

  Bricolage Grotesque 800 (latin):
    U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,
    U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,
    U+2212,U+2215,U+FEFF,U+FFFD
  ```

  Both latin subsets are byte-identical unicode-range strings (as expected — they correspond to the Google Fonts Latin subset across all fontsource 5.x families).

- Preserved all existing Fallback `@font-face` rules (Bricolage Grotesque Fallback, DM Sans Fallback, and 2× Greek Fallback) and their cascade position unchanged (Pitfall 6 — these rules own CLS behavior on first-paint).
- Intentionally did NOT import `@fontsource/dm-sans/400.css`, `@fontsource/bricolage-grotesque/800.css`, or `@fontsource/noto-sans/400.css`:
  - The first two would duplicate the hand-written rules and trigger the preload-mismatch double-download (Pitfall 1).
  - `noto-sans/400.css` pulls 7+ subsets; we only need Greek fallback coverage, so we use the subset-specific `greek-400.css` / `greek-700.css` imports (Pitfall 5).

### Task 3 — `src/layouts/Layout.astro` (commit `9a8a7c5`)

- **CSP meta tag:** three surgical removals, everything else byte-identical:
  - `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com` → `style-src 'self' 'unsafe-inline'`
  - `font-src 'self' https://fonts.gstatic.com` → `font-src 'self'`
  - `connect-src 'self' https://fonts.googleapis.com https://fonts.gstatic.com blob: https://www.google-analytics.com https://www.googletagmanager.com` → `connect-src 'self' blob: https://www.google-analytics.com https://www.googletagmanager.com`
  - All other directives (`default-src`, `script-src`, `img-src`, `worker-src`, `frame-src`, `base-uri`, `form-action`) byte-identical.
  - `'unsafe-inline'`, `'wasm-unsafe-eval'`, `blob:`, GA allowlist entries (`googletagmanager.com`, `google-analytics.com`) all preserved verbatim — Pitfall 2 sanity check passed.
- **Head link rewrite:** removed the 15-line Google Fonts `<link>` block (2× preconnect + preload css2 + noscript stylesheet) and replaced it with:
  ```astro
  <link rel="preload" href="/fonts/dm-sans-400.woff2" as="font" type="font/woff2" crossorigin />
  <link rel="preload" href="/fonts/bricolage-800.woff2" as="font" type="font/woff2" crossorigin />
  ```
  The `crossorigin` attribute is required even for same-origin font preloads (fonts are always fetched with CORS mode); omitting it would cause the browser to discard the preload.
- Preserved the rest of the `<head>` exactly as-is: `<ClientRouter />`, `<SEOHead />`, website JSON-LD schema, RSS + llmstxt autodiscovery, the GA `<script>` tags, `<slot name="head" />`.

## Font File Size Baseline (for PERF metric reference)

| Category              | Count | Total size |
|-----------------------|-------|------------|
| `public/fonts/` preload copies | 2     | **35.2 KB** (dm-sans-400: 13.9 KB + bricolage-800: 21.3 KB) |
| `dist/_astro/*.woff2` hashed subsets | 15    | **156.8 KB** (emitted from 6 per-weight fontsource imports) |
| **Grand total**       | **17**| **192.0 KB** |

Hashed subset breakdown (proves the 6 imported weights were all resolved correctly by Vite):

| Weight                      | Subsets emitted                                  |
|-----------------------------|--------------------------------------------------|
| Bricolage Grotesque 700     | latin, latin-ext, vietnamese (3 files, 38.1 KB)  |
| DM Sans 500                 | latin, latin-ext (2 files, 21.7 KB)              |
| DM Sans 700                 | latin, latin-ext (2 files, 21.8 KB)              |
| Fira Code 400               | latin, latin-ext, cyrillic, cyrillic-ext, greek, greek-ext (6 files, 63.0 KB) |
| Noto Sans greek-400         | greek (1 file, 7.7 KB)                           |
| Noto Sans greek-700         | greek (1 file, 7.8 KB)                           |

Browsers load only the subsets whose `unicode-range` overlaps characters actually rendered on the page — so the 156.8 KB figure is the theoretical ceiling, not the download cost per visit. In practice a primarily-English page will pull ~2-4 files (DM Sans 500/700 latin + Fira Code latin when code blocks exist).

## Verification Results

**`npm run build` end-to-end:** PASS

- Astro build: 1185 pages in 41.64 s
- VS-07 wordcount verifier: 650 pages, min=1217 max=1724 mean=1393.4, **0 failures**
- VS-06 overlap verifier: sampled 20/650, max Jaccard=0.252 (< 0.40 ceiling)
- Sitemap determinism verifier: **OK — 1184 URLs, all with lastmod, byte-identical across rebuilds**
  - Coverage: `<loc>=1184 <lastmod>=1184`
  - sitemap-0.xml: OK
  - sitemap-index.xml: OK

**Rendered HTML (`dist/index.html`) sanity:**

- Zero `fonts.googleapis.com` / `fonts.gstatic.com` references in entire `dist/` (outside the code-example text in `security-headers.mdx`, which is documentation content, not live CSP)
- CSP contains: `font-src 'self'`, `style-src 'self' 'unsafe-inline'`, no googleapis/gstatic, GA preserved (both `googletagmanager.com` and `google-analytics.com`), `'unsafe-inline'` × 2, `'wasm-unsafe-eval'` × 1, `blob:` × 4
- Two `rel="preload" as="font" type="font/woff2" crossorigin` hints rendered with stable `/fonts/*.woff2` hrefs matching `global.css @font-face src url()` byte-for-byte

## Deviations from Plan

### Note 1 (not a deviation — clarification for future readers)

The plan's Task 2 verification step says `ls dist/_astro/*.woff2 | wc -l` should return "at most 6". The actual count is **15** because each fontsource per-weight CSS import declares multiple `@font-face` rules (one per unicode-range subset: latin, latin-ext, cyrillic, greek, vietnamese, etc.), and Vite emits one hashed woff2 per declared subset. This is the correct, expected behavior — it mirrors what Google Fonts was previously delivering via `css2?...display=swap` (which returned the same subset set as separate `@font-face` rules inside the one stylesheet). The "at most 6" figure in the plan was an imprecise estimate; the real invariant is "6 weights are each represented by ≥1 subset file," which holds.

**All 3 auto-rule-eligible issues: NONE triggered.** No Rule 1/2/3 fixes were applied; the plan was executed verbatim.

## Known Stubs

None — all fonts are wired end-to-end:

- 6 fontsource @import URLs resolve to node_modules packages (Vite-bundled → `dist/_astro/*.woff2` hashed files).
- 2 hand-written @font-face URLs resolve to `dist/fonts/dm-sans-400.woff2` + `dist/fonts/bricolage-800.woff2` (copied from node_modules by prebuild script).
- 2 Layout.astro preload hints match the hand-written @font-face src URLs byte-for-byte.

## Threat Flags

None — this plan reduces attack surface (drops two external origins from CSP) rather than adding any. No new network endpoints, auth paths, file access patterns, or schema changes at trust boundaries were introduced.

## Self-Check: PASSED

Files created/modified (all verified present on disk at expected paths):

- FOUND: `/Users/patrykattc/work/git/PatrykQuantumNomad/scripts/copy-preload-fonts.mjs` (29 lines, executed successfully during prebuild)
- FOUND: `/Users/patrykattc/work/git/PatrykQuantumNomad/public/fonts/dm-sans-400.woff2` (14,200 bytes, gitignored)
- FOUND: `/Users/patrykattc/work/git/PatrykQuantumNomad/public/fonts/bricolage-800.woff2` (21,844 bytes, gitignored)
- FOUND: `/Users/patrykattc/work/git/PatrykQuantumNomad/package.json` (+4 fontsource deps, prebuild chained)
- FOUND: `/Users/patrykattc/work/git/PatrykQuantumNomad/.gitignore` (+3 lines for public/fonts/*.woff2)
- FOUND: `/Users/patrykattc/work/git/PatrykQuantumNomad/src/styles/global.css` (+36 lines at top)
- FOUND: `/Users/patrykattc/work/git/PatrykQuantumNomad/src/layouts/Layout.astro` (CSP shrunk, head block rewritten)

Commits (all verified present in git log):

- FOUND: `08e8e33` — chore(124-01): install @fontsource packages and wire prebuild copy script
- FOUND: `16fce1b` — feat(124-01): add @fontsource imports and hand-written @font-face rules to global.css
- FOUND: `9a8a7c5` — feat(124-01): replace Google Fonts link block with self-hosted preload hints + shrink CSP

Success criteria (plan + executor prompt):

- PERF-01: `dist/` contains zero `fonts.googleapis.com` / `fonts.gstatic.com` references — VERIFIED
- PERF-02: CSP has `font-src 'self'`, `style-src 'self' 'unsafe-inline'`, no googleapis/gstatic, GA preserved — VERIFIED
- PERF-03: Two preload hints with `crossorigin` + `type="font/woff2"` rendered with `/fonts/*.woff2` hrefs matching `global.css @font-face src url()` — VERIFIED
- Phase 123 sitemap determinism gate still passes — VERIFIED (`[sitemap-determinism] OK — 1184 URLs, all with lastmod, deterministic across rebuilds`)
- Phase 122 VS verifiers still pass — VERIFIED (VS-07: 0 failures, VS-06: max Jaccard 0.252)
- `git diff --stat` scope limited to the 6 expected files — VERIFIED
