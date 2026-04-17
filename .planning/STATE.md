---
gsd_state_version: 1.0
milestone: v1.21
milestone_name: milestone
status: completed
stopped_at: Completed 126-02-PLAN.md (CSS budget verifier). Phase 126 COMPLETE (2/2 plans). Milestone v1.21 COMPLETE (13/13 plans across Phases 122-126). 6-verifier build chain fully wired.
last_updated: "2026-04-17T11:12:09.606Z"
last_activity: "2026-04-17 — Phase 126 P01 diagnosis shipped. Homepage loads 2 shared chunks (about.*.css + _slug_.*.css) totaling 148840 raw / 30287 gzip / 25307 brotli bytes across all 1184 routes. Recommendation: Option A."
progress:
  total_phases: 5
  completed_phases: 5
  total_plans: 13
  completed_plans: 13
  percent: 100
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-04-15)

**Core value:** A fast, SEO-optimized, visually distinctive portfolio that ranks well in search engines and makes a memorable impression on recruiters, collaborators, and the developer community.
**Current focus:** v1.21 COMPLETE — all 13 plans across Phases 122-126 shipped. 6-verifier build chain fully wired.

## Current Position

Phase: 126 of 126 (CSS Investigation and Remediation) — **COMPLETE (2/2 plans)**
Plan: 2/2 complete — P01 shipped measurement artefacts + diagnosis; P02 shipped homepage CSS budget verifier (Option A path, no source remediation).
Status: Milestone v1.21 COMPLETE. All phases (122-126) done.
Last activity: 2026-04-17 — Phase 126 P02 shipped scripts/verify-homepage-css-budget.mjs (299 lines, zero-dep ESM, 4 invariants, 4/4 negative tests). Wired as 6th and last gate in npm run build. Option A chosen: budget locks baseline at 148840 raw / 30287 gzip / 2 chunks.

Progress: [██████████] 100% (13/13 plans in milestone v1.21)

## Performance Metrics

**Velocity:**

- Total plans completed: 300 (across 20 milestones)
- v1.21 plans completed: 13 (Phase 122: 3/3; Phase 123: 3/3; Phase 124: 2/2; Phase 125: 3/3; Phase 126: 2/2)

**Cumulative Stats:**

| Milestone | Phases | Plans | Requirements | Date |
|-----------|--------|-------|--------------|------|
| v1.0 through v1.17 | 1-101 | 231 | 831 | 2026-02-11 to 2026-03-15 |
| v1.18 AI Landscape Explorer | 102-110 | 25 | 40 | 2026-03-26 to 2026-03-27 |
| v1.19 Claude Code Guide Refresh | 111-116 | 25 | 34 | 2026-04-12 |
| v1.20 Dark Code Blog Post | 117-121 | 8 | 25 | 2026-04-14 |
| v1.21 SEO Audit Fixes | 122-126 | 13 | 25 | 2026-04-15 to 2026-04-17 |
| Phase 122 P01 | 4m | 2 tasks | 2 files |
| Phase 122 P02 | 5 | 2 tasks | 2 files |
| Phase 122 P03 | 4m | 2 tasks | 3 files |
| Phase 123-sitemap-lastmod P01 | 34m | 2 tasks | 4 files |
| Phase 123-sitemap-lastmod P02 | 20m | 2 tasks | 1 file |
| Phase 123-sitemap-lastmod P03 | 22m | 1 task | 4 files |
| Phase 123 P03 | 22m | 1 tasks | 5 files |
| Phase 124 P01 | 5m | 3 tasks | 6 files |
| Phase 124 P02 | 82m | 2 tasks | 6 files |
| Phase 125 P01 | 5m | 2 tasks | 5 files |
| Phase 125 P02 | 6m | 3 tasks | 3 files |
| Phase 125 P03 | 4m | 2 tasks | 4 files |
| Phase 126 P01 | ~25m | 2 tasks (+ blocking checkpoint) | 6 files |
| Phase 126 P02 | 12m | 2 tasks | 2 files |

## Accumulated Context

### Decisions

Full decision log in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- VS page enrichment uses existing justifications.ts and code-features.ts data (not AI-generated prose)
- Blog pagination gets self-referencing canonicals (NOT noindex — anti-pattern per Google docs)
- Font self-hosting uses @fontsource static packages (NOT @fontsource-variable, NOT experimental.fonts)
- CSS investigation is measurement-first: diagnose before fixing
- [Phase 122]: VS content assembly uses three-seam prose (justification + connective + verdict/closer) with deterministic FNV-1a hash pool selection. All pools module-level const, ≥3 options per key. Observed max Jaccard 0.2119 against <0.40 threshold.
- [Phase 122]: [Phase 122 P02] VS template is a thin renderer consuming buildVsContent. Character sketches placed inside Hero (not removed) to honour preserve directive without violating 6-section locked order. Zero client-side JS added — both languages' code snippets server-rendered via astro-expressive-code <Code>.
- [Phase 122]: [Phase 122 P03] VS-06 and VS-07 enforced at build time via zero-dep ESM verifiers chained after `astro build`. Deterministic mulberry32 SEED=20260416; shared-chrome stripping (nav/header/footer/svg + known shared heading strings) before Jaccard to avoid false inflation. Reports written to `.planning/reports/` (not `dist/`) to preserve Phase 123 sitemap-lastmod determinism. Observed max Jaccard 0.2519 (37% under 0.40 ceiling); min wordcount 1217 (717 words above the 500 floor). 5-page editorial human review passed.
- [Phase 123-sitemap-lastmod]: Sitemap date logic owned by src/lib/sitemap/; astro.config.mjs is a thin consumer importing buildContentDateMap + resolvePrefixLastmod. Registry split: per-URL in STATIC_PAGE_DATES, collection-wide in COLLECTION_SHIP_DATES, per-tool in TOOL_RULES_DATES. Prefix fallback handles route families whose internals aren't easily enumerated at config load (ai-landscape VS, tool rules). Coverage jumped 45→1026/1184 URLs; Claude Code chapter lastmod bug fixed (now per-chapter updatedDate).
- [Phase 123 P02]: Full 1184/1184 coverage. EDA subpages follow frontmatter -> gitLogDate -> COLLECTION_SHIP_DATES.eda ladder with loud warnings; quantitative URLs derived by filtering techniques.json by category === 'quantitative' to mirror the [slug].astro route exactly (18 URLs). Blog aggregate pool = ALL non-draft posts (internal + external) because pagination/tag routes don't filter externalUrl; per-slug lastmod stays internal-only. PAGE_SIZE=10 preflight assertion reads the route source and throws on any drift. Synthetic guide routes (cheatsheet, faq) added inside content-dates.ts via gitLogDate on the .astro file. Back-to-back builds byte-identical (sha256 dcbc444...965e2).
- [Phase 123]: [Phase 123 P03] Build-time coverage + determinism gate shipped. Verifier enforces three independent invariants: (a) locCount >= LOC_FLOOR=1184 (catches URL regressions the old combined check would silently pass), (b) lastmodCount === locCount (per-URL coverage), (c) lastmodCount >= LASTMOD_COVERAGE_FLOOR=1120 (defensive broad-collapse floor); plus byte-identical sha256 compare of dist/sitemap-0.xml + dist/sitemap-index.xml across two consecutive astro build invocations. Verifier uses npx astro build directly to avoid npm-run-build recursion; reports land in .planning/reports/ never dist/. 4/4 negative tests passed: determinism injection caught (first-diff offset + surround emitted); LOC_FLOOR regression caught (survived URLs all had lastmods but hard floor fired); per-URL mismatch caught (new page without date source); broad collapse caught (both per-URL and LASTMOD_COVERAGE_FLOOR flipped). Phase 123 gate: COMPLETE.
- [Phase 124]: Phase 124 P01: Self-hosted fonts via @fontsource/* 5.x static packages (NOT variable, preserves Tailwind stacks). 6 per-weight CSS @imports + 2 hand-written @font-face rules for preload-critical DM Sans 400 and Bricolage 800 matching stable /fonts/*.woff2 paths byte-for-byte (avoids double-download, RESEARCH Pitfall 1). CSP shrunk: drops googleapis/gstatic from style-src/font-src/connect-src, GA entries preserved verbatim. npm run build passes including Phase 122 VS verifiers + Phase 123 sitemap determinism (1184 URLs byte-identical across rebuilds).
- [Phase 124]: [Phase 124 P02] (a) LCP-preload weight corrected Bricolage 800 → 700 because Tailwind `font-bold` = 700 (not 800 — `font-extrabold` is 800); base-layer `h1-h6 { @apply font-heading font-bold }` means ~95% of routes render headings at 700, so preloading 800 triggered Chrome's "preloaded but not used" warning on every non-homepage route. Plan 01 A1 clause explicitly permitted in-flight swap. (b) Inline `<style is:inline>` block in Layout.astro `<head>` duplicates the 2 hand-written @font-face rules AND primes font-family on html/body/h1-h6 BEFORE the `<link rel=preload>` hints — closes Chrome preload-usage race window (per-route CSS chunks arrive too late for preload consumption). Duplicate @font-face in both inline and global.css is intentional (browsers merge identical rules; verifier assertion 4 concatenates both sources). (c) CSP additions: `data:` in font-src (Vite `assetsInlineLimit`=4096 inlines tiny @fontsource/fira-code/symbols2 subset as data:font/woff2) + `data:` in script-src (Astro `<ClientRouter />` creates `data:application/javascript,` bootstrap scripts). Security impact minimal because `'unsafe-inline'` already present. (d) verify-no-google-fonts.mjs: 218 lines, zero deps, 4 independent assertions (Google Fonts origin absence / GA markers present / 2 preload hints with crossorigin+type+valid-href / preload↔@font-face URL match including inline `<style>` in dist/index.html) + 4/4 negative tests PASS + narrow single-regex FastAPI security-headers MDX allowlist logged as INFO on every run.
- [Phase 125]: Phase 125 P01: /feed.xml alias implemented as re-export ('export { GET } from ./rss.xml'), NOT redirect — GitHub Pages can't serve 301 with XML Content-Type; both endpoints ship byte-identical bytes, future RSS edits propagate automatically.
- [Phase 125]: Phase 125 P01: Sitemap filter drops 47 URLs (5 pagination + 42 sparse tags <3 posts) reaching exactly 1137 URLs on first build. buildSparseTagSet(minPosts) parameterized for future threshold bumps. LOC_FLOOR 1184→1137; LASTMOD_COVERAGE_FLOOR unchanged (Phase 123 pre-allocated 64-URL headroom).
- [Phase 125]: Phase 125 P02: On-page SEO content fixes shipped OPSEO-01..04. OPSEO-01 fix was to shorten the dark-code frontmatter title from 64→40 chars so title+' — Patryk Golabek' (17-char suffix) sums to 57, bypassing the 65-char fallback branch in blog/[slug].astro:224-227 — the pre-fix rendered <title> was 'Dark Code — Patryk Golabek' (26 chars, split-at-colon) because the unshortened 81-char sum triggered the truncation branch. Fix target = input (frontmatter) not fallback logic (shared across all blog posts, unknown blast radius). OPSEO-03 replaced regex slice+replace with truncateDescription(full, targetMin=140, targetMax=157) helper that prefers last '. ', '; ', ', ' boundary in window, falls back to word boundary, never mid-word. All 26 Beauty Index language pages in [143, 158]; short fullDescription (≤157) returns verbatim. OPSEO-04 prefers concrete '46 rules' count over 'Dozens of rules' — specificity as minor ranking signal; 46 sourced from blog/[slug].astro:139 authoritative tool rules reference.
- [Phase 125]: Phase 125 P03: scripts/verify-on-page-seo.mjs (283 lines, zero-dep ESM) asserts all 6 Phase 125 invariants at build time: (1) /blog/{2..6}/ self-canonicals, (2) dark-code <title> in [55,60], (3) dark-code <meta description> ≤160, (4) 26 Beauty Index language descs in [140,160] with no mid-word truncation, (5) dockerfile-analyzer <meta description> ≤160, (6) feed.xml === rss.xml byte-wise via sha256. Two-pass meta extraction (find tag, then content=) avoids Astro attribute-order fragility. Skips dist/beauty-index/{vs,code,justifications}/ — vs is Phase 122's 650-page comparison corpus covered by separate verifiers, code and justifications are aggregate landing pages with intentionally shorter descriptions; filter yields exactly 26 language slugs. Mid-word truncation detection uses Unicode property classes (/[\\p{L}\\p{N}]/u) — future-proof for non-English language slugs. Ellipsis is word-complete iff preceded by alphanumeric OR terminal punctuation OR whitespace; rejects "Python'…" (apostrophe) and "C#…" (hash) canonical failures. Wired into npm run build as LAST gate after verify-no-google-fonts. Reports land in .planning/reports/on-page-seo-{stamp}.json (NOT dist/ — preserves Phase 123 sitemap determinism). Gitignore pattern-ignores timestamped reports + force-adds one representative green-state baseline (on-page-seo-2026041623001.json) — matches Phase 122/123 convention. rm -rf dist && npm run build green with all 5 verifiers.
- [Phase 126]: [Phase 126 P01] D1 env-gated visualizer via `ANALYZE=1` + top-level `await import('rollup-plugin-visualizer')` in astro.config.mjs preserves Phase 123 byte-identical rebuild invariant (default builds plugin-free; sha `8a3d1496b2b51f1af0d3122fbeb5acee07cc6a955b7c9c6bbad9913ed7251b8e` identical across default/default and default/analyze pairs). D2 emit both treemap HTML and raw-data JSON for human + programmatic review. D3 shipped zero-dep scripts/diagnose-homepage-css.mjs (290 lines) walking dist/**/index.html to build route→chunks map, measuring per-chunk raw/gzip/brotli + sha256 + leading/trailing samples + scoped-selector + @font-face counts + cross-route frequency — covers rollup-plugin-visualizer CSS gap bug #203. emitFile: false on both visualizer() calls forces filesystem write to .planning/reports/ outside Rollup's asset pipeline (never lands in dist/). D7 force-added baseline homepage-css-2026041700200.json as the permanent reference Plan 02's verifier will diff against.
- [Phase 126]: [Phase 126 P01 measurement] Homepage loads 2 CSS chunks — about.C49NBCVn.css (62,243 raw / 10,881 gzip / 9,103 brotli; 0 scoped; 0 @font-face; Tailwind utility sheet signature `*,:before,:after{--tw-*`) and _slug_.CIgCJX9d.css (86,597 raw / 19,406 gzip / 16,204 brotli; 1 scoped; 22 @font-face; ClientRouter announcer + View Transitions keyframes + @fontsource + global.css). Both appear on all 1184 routes (filesystem dist/**/index.html count; 1137 is the sitemap-included subset after Phase 125 TSEO-03/05 exclusions). Filenames are misleading — Astro's first-alphabetical-consumer shared-chunk naming makes about.*.css the Tailwind bundle (not /about/'s CSS) and _slug_.*.css the Layout bundle (not any [slug] route's CSS). Full site has 5 unique CSS chunks total — the other 3 are ec.*.css (astro-expressive-code, 756 routes with code blocks), style.*.css (6 routes), asciinema-player.*.css (5 routes).
- [Phase 126]: [Phase 126 P01 verdict] Option A recommended. 30KB gzip across 1184 cached-immutably routes is textbook Tailwind+Astro shared-chunk behavior. 6-lever evaluation: Levers 3 (inlineStylesheets) and 4 (split View Transitions) are strict REJECT — Lever 3 explodes HTML budget by ~175MB (1184 pages × 148KB), Lever 4 trades 100-200B gzip for site-wide ClientRouter regression. Levers 1/2/5/6 combined best-case yield only 3-5KB gzip (~15% CSS, 0.2% page weight once images+JS are counted) at the cost of multi-day config archaeology + visual regression on ≥5 routes + Phase 123 invariant re-verification. The PERF-04 audit's "132KB" figure was closest to raw uncompressed total; actual on-wire cost (~30KB gzip) was never separately reported. If operator overrides to Option B, Lever 2 (@fontsource weight audit, 22 @font-face blocks) is the only defensible lever on measured evidence.
- [Phase 126]: Option A chosen: no CSS source remediation; budget verifier locks current baseline (148840 raw / 30287 gzip / 2 chunks) with 2% per-chunk and 5% total headroom

### Pending Todos

None.

### Blockers/Concerns

- VS page quality is highest risk: 650 pages must show structural variation to avoid scaled content abuse detection
- CSS investigation closed as no-op (Option A): 132KB raw / 30KB gzip is correct shared-chunk behavior, locked by budget verifier

### Quick Tasks Completed

| # | Description | Date | Commit | Directory |
|---|-------------|------|--------|-----------|
| 010 | Correctness validation | 2026-02-26 | 9d20b42 | [010-correctness-validation](./quick/010-correctness-validation/) |
| 011 | EDA content correctness validation | 2026-02-26 | 958be19 | [011-eda-content-correctness-validation](./quick/011-eda-content-correctness-validation/) |
| 012 | Fix Snyk security scan vulnerabilities (npm audit + W007 secret redaction) | 2026-03-06 | ddf902c | [012-fix-snyk-security-scan-issue-on-gha-vali](./quick/012-fix-snyk-security-scan-issue-on-gha-vali/) |

## Session Continuity

Last session: 2026-04-17T11:12:09.602Z
Stopped at: Completed 126-02-PLAN.md (CSS budget verifier). Phase 126 COMPLETE (2/2 plans). Milestone v1.21 COMPLETE (13/13 plans across Phases 122-126). 6-verifier build chain fully wired.
Resume file: None
Next: Milestone v1.21 complete. No pending work.
