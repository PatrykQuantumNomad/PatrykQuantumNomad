---
gsd_state_version: 1.0
milestone: v1.21
milestone_name: milestone
status: completed
stopped_at: "Completed 124-02-PLAN.md — Phase 124 Font Self-Hosting COMPLETE (2/2 plans). Verifier wired, 4/4 negative tests passed, human smoke test 8/8 PASS after 5 fix-forward commits resolved browser-runtime preload-consumption timing gaps on Plan 01's surface."
last_updated: "2026-04-16T16:40:00.000Z"
last_activity: 2026-04-16 — Phase 124 P02 closed; checkpoint approved after 5 fix(124-01) commits (CSP data: for Vite-inlined fonts + Astro ClientRouter, LCP weight 800→700, inline @font-face + font-family priming, source-order reorder); Phase 124 COMPLETE
progress:
  total_phases: 5
  completed_phases: 3
  total_plans: 8
  completed_plans: 8
  percent: 100
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-04-15)

**Core value:** A fast, SEO-optimized, visually distinctive portfolio that ranks well in search engines and makes a memorable impression on recruiters, collaborators, and the developer community.
**Current focus:** v1.21 Phase 124 COMPLETE — advancing to Phase 125 (Blog/pagination/on-page SEO batch)

## Current Position

Phase: 124 of 126 (Font Self-Hosting) — **COMPLETE**
Plan: 2/2 complete — P01 shipped font migration; P02 shipped build-time verifier (4 assertions, 4/4 negative tests PASS) + human smoke test (8/8 PASS across 4 routes × 2 modes) + 5 fix-forward commits closing browser-runtime preload-consumption gaps.
Status: Phase 124 COMPLETE. Next: Phase 125 (Blog/pagination/on-page SEO batch) — independent of 124, unblocked. Phase 126 (CSS investigation) unblocked too (it depends on 124).
Last activity: 2026-04-16 — Phase 124 P02 closed after checkpoint approval; all 4 build verifiers (VS-07, VS-06, sitemap-determinism, no-google-fonts) PASS end-to-end

Progress: [██████████] 100% (2/2 plans in Phase 124 — Phase 124 COMPLETE)

## Performance Metrics

**Velocity:**

- Total plans completed: 297 (across 20 milestones)
- v1.21 plans completed: 8 (Phase 122: 3/3; Phase 123: 3/3; Phase 124: 2/2)

**Cumulative Stats:**

| Milestone | Phases | Plans | Requirements | Date |
|-----------|--------|-------|--------------|------|
| v1.0 through v1.17 | 1-101 | 231 | 831 | 2026-02-11 to 2026-03-15 |
| v1.18 AI Landscape Explorer | 102-110 | 25 | 40 | 2026-03-26 to 2026-03-27 |
| v1.19 Claude Code Guide Refresh | 111-116 | 25 | 34 | 2026-04-12 |
| v1.20 Dark Code Blog Post | 117-121 | 8 | 25 | 2026-04-14 |
| v1.21 SEO Audit Fixes | 122-126 | 8 (so far) | 21 | 2026-04-15 (in progress) |
| Phase 122 P01 | 4m | 2 tasks | 2 files |
| Phase 122 P02 | 5 | 2 tasks | 2 files |
| Phase 122 P03 | 4m | 2 tasks | 3 files |
| Phase 123-sitemap-lastmod P01 | 34m | 2 tasks | 4 files |
| Phase 123-sitemap-lastmod P02 | 20m | 2 tasks | 1 file |
| Phase 123-sitemap-lastmod P03 | 22m | 1 task | 4 files |
| Phase 123 P03 | 22m | 1 tasks | 5 files |
| Phase 124 P01 | 5m | 3 tasks | 6 files |
| Phase 124 P02 | 82m | 2 tasks | 6 files |

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

### Pending Todos

None.

### Blockers/Concerns

- VS page quality is highest risk: 650 pages must show structural variation to avoid scaled content abuse detection
- CSS investigation may close as no-op if 132KB is correct shared-chunk behavior

### Quick Tasks Completed

| # | Description | Date | Commit | Directory |
|---|-------------|------|--------|-----------|
| 010 | Correctness validation | 2026-02-26 | 9d20b42 | [010-correctness-validation](./quick/010-correctness-validation/) |
| 011 | EDA content correctness validation | 2026-02-26 | 958be19 | [011-eda-content-correctness-validation](./quick/011-eda-content-correctness-validation/) |
| 012 | Fix Snyk security scan vulnerabilities (npm audit + W007 secret redaction) | 2026-03-06 | ddf902c | [012-fix-snyk-security-scan-issue-on-gha-vali](./quick/012-fix-snyk-security-scan-issue-on-gha-vali/) |

## Session Continuity

Last session: 2026-04-16T16:40:00.000Z
Stopped at: Completed 124-02-PLAN.md — Phase 124 Font Self-Hosting COMPLETE (2/2 plans). Verifier (scripts/verify-no-google-fonts.mjs, 218 lines, 4 assertions, 4/4 negative tests PASS) wired into build chain after verify-sitemap-determinism; human smoke test 8/8 PASS across 4 routes × 2 modes after 5 fix-forward commits (c689f18, 3a891ce, cbd6b9d, 2274b8e, 7fac8a2) resolved browser-runtime preload-consumption timing gaps surfaced only in live DevTools.
Resume file: None
Next: /gsd-plan-phase 125 (Blog/pagination/on-page SEO batch) — covers TSEO-02 through TSEO-05 + OPSEO-01 through OPSEO-04. Independent of 124; Phase 126 (CSS investigation) unblocked too.
