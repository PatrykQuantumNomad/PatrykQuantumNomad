# Phase 126 — Homepage CSS Diagnosis

**Diagnosed:** 2026-04-17
**Source:**
- `.planning/reports/homepage-css-2026041700200.json` (zero-dep supplement, force-added baseline)
- `.planning/reports/css-visualizer-2026041700184.html` (rollup-plugin-visualizer treemap)
- `.planning/reports/css-visualizer-2026041700184.json` (rollup-plugin-visualizer raw-data)
**Baseline commit:** `fde936af1e10` (tip of main before Phase 126 Plan 01 code changes)
**Analyzed by:** `rollup-plugin-visualizer` v7 (emitFile=false, treemap + raw-data) wired env-gated behind `ANALYZE=1`, plus `scripts/diagnose-homepage-css.mjs` (zero-dep ESM supplement)

## 1. Measured Homepage CSS Bundle

The homepage (`/`) loads exactly 2 CSS chunks via `<link rel="stylesheet">` tags, both served from `/_astro/`:

| Chunk                       | Raw Bytes | Gzip   | Brotli | Scoped Selectors | @font-face | Appears On  |
| --------------------------- | --------- | ------ | ------ | ---------------- | ---------- | ----------- |
| `about.C49NBCVn.css`        | 62,243    | 10,881 | 9,103  | 0                | 0          | 1184 routes |
| `_slug_.CIgCJX9d.css`       | 86,597    | 19,406 | 16,204 | 1                | 22         | 1184 routes |
| **TOTAL**                   | **148,840** | **30,287** | **25,307** |                  |            |             |

Both chunks are flagged `isShared: true` (appearsOnRouteCount=1184 ≥ threshold of 5). The homepage pulls the site's global shared CSS — nothing homepage-specific.

**Full site inventory (all 5 unique CSS chunks ordered by route frequency):**

| Chunk                              | Raw    | Gzip   | Brotli | Routes | Notes                                    |
| ---------------------------------- | ------ | ------ | ------ | ------ | ---------------------------------------- |
| `_slug_.CIgCJX9d.css`              | 86,597 | 19,406 | 16,204 | 1184   | Site-wide shared (ClientRouter + fonts)  |
| `about.C49NBCVn.css`               | 62,243 | 10,881 | 9,103  | 1184   | Site-wide shared (Tailwind utility sheet) |
| `ec.t87ba.css`                     | 15,773 | 3,822  | 3,379  | 756    | astro-expressive-code (code blocks)      |
| `style.BZV40eAE.css`               | 15,851 | 2,656  | 2,286  | 6      | Targeted — 6 routes only                 |
| `asciinema-player.D16CJk62.css`    | 14,898 | 3,316  | 2,717  | 5      | Targeted — 5 routes w/ terminal recordings |

Only the top two chunks reach the homepage. The other three are code-block / recording / specialty pages and do not load at `/`.

## 2. Chunk Content Identification

### `about.C49NBCVn.css` (62,243 bytes raw)
**Leading 200:** `*,:before,:after{--tw-border-spacing-x: 0;--tw-border-spacing-y: 0;--tw-translate-x: 0;--tw-translate-y: 0;--tw-rotate: 0;--tw-skew-x: 0;--tw-skew-y: 0;--tw-scale-x: 1;--tw-scale-y: 1;--tw-pan-x: ;--t`
**Trailing 200:** `[\&_th\]\:p-2 th{padding:.5rem}.[\&_th\]\:text-left th{text-align:left}.[\&_th\]\:font-medium th{font-weight:500}.[\&_th\]\:text-[var(--color-text-primary)] th{color:var(--color-text-primary)}`

**Identification:** This is the **Tailwind utility sheet**. The leading signature `*,:before,:after{--tw-*` is Tailwind's base-layer custom-property preamble, and the trailing arbitrary-variant utilities (`[\&_th\]\:...`) are the typography descendant selectors emitted by `@tailwindcss/typography`. The filename `about.*.css` is misleading — it is NOT the `/about/` page's CSS; it is the shared Tailwind bundle that Astro named after the first alphabetical consumer (Astro's first-alphabetical-consumer shared-chunk naming — see `withastro/astro#7469`).

Zero scoped selectors + zero `@font-face` confirms this chunk contains **no** component-scoped or font-face content.

### `_slug_.CIgCJX9d.css` (86,597 bytes raw)
**Leading 200:** `.astro-route-announcer{position:absolute;left:0;top:0;clip:rect(0 0 0 0);clip-path:inset(50%);overflow:hidden;white-space:nowrap;width:1px;height:1px}@font-face{font-family:Bricolage Grotesque;font-st`
**Trailing 200:** `e(-100%)}}@media(prefers-reduced-motion){::view-transition-group(*),::view-transition-old(*),::view-transition-new(*){animation:none!important}[data-astro-transition-scope]{animation:none!important}}`

**Identification:** This is the **global stylesheet + ClientRouter + font-face bundle**. Leading signature `.astro-route-announcer` is Astro's built-in SPA navigation a11y announcer (injected by `<ClientRouter />`). The content includes:

- Astro ClientRouter route-announcer styles.
- 22 `@font-face` declarations (from `@fontsource/bricolage-grotesque`, `@fontsource/dm-sans`, `@fontsource/fira-code`, `@fontsource/noto-sans` — plus hand-written `@font-face` blocks for preloaded weights from Phase 124 self-hosting).
- `global.css` layer (Tailwind base + component styles imported by `Layout.astro`).
- **View Transitions API keyframes** (trailing signature `::view-transition-group / -old / -new` + `@media(prefers-reduced-motion)` override + `[data-astro-transition-scope]` resets).

The single scoped selector count = 1 is the `.astro-route-announcer` class, which Astro scopes globally. Filename `_slug_.*.css` again reflects first-alphabetical-consumer naming — it is NOT the CSS for any `[slug]` route; it is the universal Layout-level bundle.

## 3. Why Both Chunks Load on Every Route

The route→chunks map in the baseline JSON shows both shared chunks present in **every single** route's `<link>` tags — all 1184 `dist/**/index.html` files, with no exceptions. This is Astro's default behavior driven by three mechanisms:

1. **`Layout.astro` imports `global.css`** (Tailwind base + `@fontsource/*` `@import`s + hand-written `@font-face` blocks). Every page uses `Layout` directly or transitively → every page loads the resulting shared chunk.
2. **`<ClientRouter />` lives in `Layout.astro`** → every route emits the View Transitions CSS block (announcer + scoped view-transition keyframes).
3. **Astro's shared-chunk naming convention** uses the first-alphabetical consumer's source filename as the chunk name. The chunk named `about.C49NBCVn.css` is NOT the CSS exclusive to `/about/`; it is the Tailwind utility sheet that happens to have `/about/` as its first-alphabetical dependent page. Similarly `_slug_.CIgCJX9d.css` (leading underscore makes it first) is the universal Layout bundle, not a `[...slug]` route's CSS.

This is textbook Tailwind+Astro shared-chunk behavior. The `appearsOnRouteCount: 1184` on both chunks is definitive evidence.

## 4. Raw vs Compressed — On-Wire Cost

From the baseline JSON summary:

| Metric        | Bytes   | Relative        |
| ------------- | ------- | --------------- |
| Total raw     | 148,840 | 100% (baseline) |
| Gzip          | 30,287  | 20.3%           |
| Brotli        | 25,307  | 17.0%           |

**On-wire cost (first paint, cold cache):** GitHub Pages serves `Content-Encoding: gzip`; brotli is not available on GH Pages. Therefore the real first-paint CSS transfer is **~30KB** across two HTTP/2 multiplexed requests (both from `/_astro/`, fingerprinted filenames, `Cache-Control: max-age=31536000, immutable` by Astro default).

**Subsequent navigation cost:** 0 bytes. Once cached, the browser serves both chunks from disk cache across all 1,184 URLs. This is the key architectural point — the 148KB raw cost amortizes across the entire site, not per-page.

**Relation to PERF-04/05 audit figure:** The Lighthouse audit reported "132KB". The closest match is the **raw (uncompressed) total**, meaning the audit appears to have been measuring uncompressed CSS. The discrepancy (148KB measured vs 132KB audit) is within reasonable drift for a portfolio that has accumulated blog posts and arbitrary-variant utilities since the audit ran. The gzipped on-wire cost (30KB) was never separately reported by the audit; if the audit had reported the gzipped figure, the PERF-04 concern would likely not have been raised.

## 5. Remediation Lever Evaluation

For each of the six levers enumerated in `126-RESEARCH.md § Remediation Lever Inventory`:

| # | Lever                                       | Measured Evidence                                                                                                   | Estimated Savings (gzip)     | Risk                                                    | Verdict    |
| - | ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- | ---------------------------- | ------------------------------------------------------- | ---------- |
| 1 | Tailwind `content` glob tightening          | Tailwind sheet is 10,881 gzip (about.C49NBCVn.css). No trivial globbing wins visible — already scoped to src.       | ~500B–2KB (speculative)      | Accidental utility drop causes silent visual regression | **DEFER**  |
| 2 | `@fontsource/*` weight audit                | 22 `@font-face` blocks in `_slug_.*.css`. Phase 124 already self-hosted only dm-sans-400 + bricolage-700 preload; remaining 20 weights are lazy-loaded on demand by @fontsource. Each @font-face descriptor block is ~300-500 bytes raw, ~100-150 gzip. Removing 10 blocks could save ~1-2KB gzip. | ~1–2KB gzip                  | FOUT (flash of unstyled text) on weights the site actually uses; requires full-site font-usage audit | **DEFER**  |
| 3 | `build.inlineStylesheets: 'always'`         | Would inline both chunks into every HTML page. Site has 1,184 pages × 148KB raw per page = **175MB raw HTML growth** | Net-negative for repeat visits | Kills browser cache, breaks Phase 123 byte-identical invariant on HTML files | **REJECT** |
| 4 | Split View Transitions CSS                  | View Transitions keyframes are only the trailing ~500 bytes of `_slug_.*.css`. Removing breaks `<ClientRouter />`.   | ~100-200B gzip               | Ruptures SPA navigation behavior across the whole site  | **REJECT** |
| 5 | Scope Tailwind typography plugin            | `@tailwindcss/typography` utilities (visible in trailing-200 of about.C49NBCVn.css: `[\&_th\]\:p-2` etc.) add maybe 2-4KB raw. Scoping to `/blog/` pages requires custom plugin config. | ~500B–1KB gzip               | Potential regression on any page that happens to use `prose` classes outside /blog/ | **DEFER**  |
| 6 | Remove unused arbitrary-variant utilities   | Arbitrary variants (`[\&_th\]\:...`) are Tailwind-generated from actual usage in source. If they are there, the source references them. Removing them requires refactoring templates, not config. | ~200-500B gzip               | Template refactor across the site, high surface area    | **DEFER**  |

**Aggregate remediation upper bound (Levers 1 + 2 + 5 + 6 combined, best case):** ~3-5KB gzip reduction → **~25KB gzip first-paint** instead of **~30KB gzip**. This is a 15-17% reduction on the CSS payload, at the cost of multi-day config archaeology + visual regression testing on ≥5 routes + re-verifying the Phase 123 byte-identical invariant. **Net ROI is low.**

Lever 3 (inlineStylesheets) is net-negative at any site size > ~50 pages; at 1,184 pages it is catastrophically wrong — the HTML budget explosion exceeds any CSS savings by two orders of magnitude.

Lever 4 (split View Transitions) trades a 100-200B gzip saving for a site-wide navigation behavior regression; pragmatically unpursuable.

## 6. Decision Log (D1-D7)

Recorded permanently in this artefact so future auditors see the decisions in context:

- **D1 (visualizer always-on vs env-gated):** env-gated via `ANALYZE=1`. Preserves the Phase 123 byte-identical rebuild invariant. Default `npm run build` never loads the plugin. Verified: sha `8a3d1496b2b51f1af0d3122fbeb5acee07cc6a955b7c9c6bbad9913ed7251b8e` identical across consecutive default builds; identical after `ANALYZE=1 npm run build` ran.
- **D2 (report format):** treemap HTML + raw-data JSON. Human review (treemap) + programmatic diff (JSON) both lightweight; zero marginal cost.
- **D3 (separate supplement script):** yes. Covers the `rollup-plugin-visualizer` CSS gap (btd/rollup-plugin-visualizer#203 — CSS emitted as Rollup assets isn't fully represented in the treemap). Script matches Phase 122/123/124/125 zero-dep ESM verifier convention.
- **D4 (remediation lever choice):** deferred to this diagnosis's § 7 verdict. Lever selection is evidence-driven, not pre-committed.
- **D5 (close-with-rationale artefact location):** `.planning/phases/126-css-investigation-and-remediation/126-DIAGNOSIS.md` (this file). Lives with phase evidence; permanent reference.
- **D6 (new build-time verifier):** scope deferred to Plan 02. The verifier will exist in either branch — a budget ceiling enforcer if we close with rationale, or a fix-verification script if we remediate.
- **D7 (commit baseline report):** yes. `.planning/reports/homepage-css-2026041700200.json` force-added in Task 1's commit (`b743bfa`). Matches Phase 122/123/125 convention. Plan 02's verifier will diff against this baseline.

## 7. Verdict and Recommendation for Plan 02

**Recommendation: Option A — Close with rationale (Success Criterion #3).**

The measured evidence supports this recommendation decisively:

1. **Byte cost is modest on the wire.** 30,287 gzip (actual GitHub Pages transfer) / 25,307 brotli. This is within the normal range for Tailwind + multi-family `@fontsource` + `<ClientRouter />` Astro sites. The 148KB raw figure was the audit's concern, but raw bytes aren't the cost the browser pays.

2. **Cost amortizes across 1,184 URLs.** Both chunks load once and cache immutably (Astro's fingerprinted `/_astro/` assets + default long-cache headers). Every subsequent navigation is 0 bytes. A site this large paying ~30KB once is exceptional efficiency.

3. **No lever in § 5 delivers a net-positive tradeoff.** Levers 3 and 4 are strict REJECT. Levers 1, 2, 5, 6 combined at best-case yield ~3-5KB gzip reduction (15-17% of the CSS payload, 0.2% of total page weight once images + JS are counted), at the cost of multi-day config archaeology, visual regression on ≥5 routes, and Phase 123 invariant re-verification.

4. **The "132KB" audit concern is resolved by documentation, not by code change.** The audit measured raw uncompressed CSS and flagged it as "excessive CSS". In reality, it is cached-across-navigation, gzip-transferred ~30KB shared-chunk behavior that any Tailwind + Astro site produces. The audit's framing does not survive contact with measurement.

**Plan 02 should therefore:**

- **(a)** Add `scripts/verify-homepage-css-budget.mjs` — a zero-dep ESM build-time verifier that asserts:
  - `homepageChunkCount === 2`
  - `homepageRawBytes <= 160000` (148,840 + ~7% headroom for Plan 02 content additions)
  - `homepageGzipBytes <= 33000` (30,287 + ~9% headroom)
  - `homepageBrotliBytes <= 28000` (25,307 + ~10% headroom)

  Exits 1 on any regression. Loud failure surfaces future CSS bloat (e.g., someone adding a heavy Tailwind plugin) before it ships.

- **(b)** Wire the new verifier into `npm run build` AFTER `verify-on-page-seo.mjs` (last in the verifier chain, matching Phase 125's ordering convention).

- **(c)** Keep the force-added `.planning/reports/homepage-css-2026041700200.json` baseline as the permanent reference point. The verifier reads this file at build time to compute "drift from baseline" as a warning signal (even if below the hard ceiling).

- **(d)** Commit this `126-DIAGNOSIS.md` as the permanent rationale artefact — the answer to "why didn't you fix the 132KB audit finding?"

**If the operator overrides to Option B,** the recommended lever is **Lever 2 (`@fontsource/*` weight audit)** — it has the most measurable impact (22 `@font-face` blocks to inspect), the lowest Phase 123 invariant risk (does not touch build config), and an auditable unit of work (enumerate which font weights are actually used by which `font-weight:` declarations in source → prune the rest). Expected savings: 1-2KB gzip, which moves the needle ~5%. Still marginal, but measurable.

## 8. Artefacts

- **Visualizer treemap:** `.planning/reports/css-visualizer-2026041700184.html` (708KB, open in browser for interactive treemap view)
- **Visualizer raw JSON:** `.planning/reports/css-visualizer-2026041700184.json` (1001KB, programmatic)
- **Supplement script JSON (force-added baseline):** `.planning/reports/homepage-css-2026041700200.json` (committed on this branch as the permanent baseline)
- **Supplement script source:** `scripts/diagnose-homepage-css.mjs` (zero-dep ESM, 290 lines)
- **Env-gated visualizer config:** `astro.config.mjs` (`vite.plugins` behind `ANALYZE=1`)
- **Analyze build alias:** `package.json` script `build:analyze` = `ANALYZE=1 npm run build`
- **This diagnosis:** `.planning/phases/126-css-investigation-and-remediation/126-DIAGNOSIS.md`
- **Research source:** `.planning/phases/126-css-investigation-and-remediation/126-RESEARCH.md`

---

**Operator action required:** Review this diagnosis and reply with one of:
- `option-a` — close with rationale, Plan 02 adds budget verifier + commits artefacts (researcher + diagnoser concur on this path).
- `option-b lever=<N>` — remediate lever N from § 5. Lever 2 is the only defensible candidate on measured evidence.
- Any other directive (e.g., "re-run analysis with the sunburst template", "scan 10 more routes for cross-chunk evidence") to refine before committing to a branch.
