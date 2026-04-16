---
gsd_state_version: 1.0
milestone: v1.21
milestone_name: milestone
status: in-progress
stopped_at: "Completed 125-02-PLAN.md — OPSEO-01/02/03/04 shipped: dark-code title 64→40 chars (renders 57, was 26 via fallback), dark-code description 219→152, Beauty Index regex truncator replaced with clause-boundary truncateDescription() helper (all 26 langs in [143,158]), Dockerfile Analyzer description 196→156. npm run build green with all 4 verifiers. Commits: ee3acc5 (Task 1), ad27920 (Task 2), 8ade8ff (Task 3). No deviations."
last_updated: "2026-04-16T22:54:51Z"
last_activity: 2026-04-16 — Phase 125 P02 shipped (OPSEO-01/02/03/04). dark-code title 57 chars, dark-code desc 152, Beauty Index 26/26 in [143,158] no mid-word truncation, dockerfile-analyzer desc 156. All within SEO spec.
progress:
  total_phases: 5
  completed_phases: 3
  total_plans: 11
  completed_plans: 10
  percent: 91
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-04-15)

**Core value:** A fast, SEO-optimized, visually distinctive portfolio that ranks well in search engines and makes a memorable impression on recruiters, collaborators, and the developer community.
**Current focus:** v1.21 Phase 125 in progress — P01 + P02 COMPLETE (TSEO-02/03/04/05 + OPSEO-01/02/03/04 shipped); P03 verifier next

## Current Position

Phase: 125 of 126 (Blog/Pagination/On-Page SEO Batch) — **IN PROGRESS**
Plan: 2/3 complete — P01 shipped the 4 TSEO routing/config fixes; P02 shipped the 4 OPSEO on-page content edits (dark-code title/desc, Beauty Index clause-boundary truncator, dockerfile-analyzer desc). P03 (verify-on-page-seo.mjs) next — Wave 2 verifier that asserts the P02 invariants at build time.
Status: Phase 125 P02 COMPLETE. Next: Plan 03 (verify-on-page-seo.mjs asserting 6 invariants, wired into npm run build after verify-no-google-fonts).
Last activity: 2026-04-16 — Phase 125 P02 shipped OPSEO-01..04. dark-code <title> 57 chars, <meta desc> 152; all 26 Beauty Index descs in [143,158] with no mid-word truncation; dockerfile-analyzer desc 156.

Progress: [█████████░] 91% (10/11 plans in milestone v1.21)

## Performance Metrics

**Velocity:**

- Total plans completed: 298 (across 20 milestones)
- v1.21 plans completed: 10 (Phase 122: 3/3; Phase 123: 3/3; Phase 124: 2/2; Phase 125: 2/3)

**Cumulative Stats:**

| Milestone | Phases | Plans | Requirements | Date |
|-----------|--------|-------|--------------|------|
| v1.0 through v1.17 | 1-101 | 231 | 831 | 2026-02-11 to 2026-03-15 |
| v1.18 AI Landscape Explorer | 102-110 | 25 | 40 | 2026-03-26 to 2026-03-27 |
| v1.19 Claude Code Guide Refresh | 111-116 | 25 | 34 | 2026-04-12 |
| v1.20 Dark Code Blog Post | 117-121 | 8 | 25 | 2026-04-14 |
| v1.21 SEO Audit Fixes | 122-126 | 10 (so far) | 25 | 2026-04-15 (in progress) |
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

Last session: 2026-04-16T22:54:51Z
Stopped at: Completed 125-02-PLAN.md — OPSEO-01/02/03/04 shipped. dark-code <title> 57 chars (was 26 via fallback), <meta desc> 152 chars; Beauty Index 26/26 descs in [143,158] with clause-boundary truncateDescription helper; dockerfile-analyzer desc 156 chars with concrete '46 rules'. npm run build green with all 4 verifiers. Commits: ee3acc5 (Task 1 — OPSEO-01/02), ad27920 (Task 2 — OPSEO-03), 8ade8ff (Task 3 — OPSEO-04). No deviations.
Resume file: None
Next: /gsd-execute-phase 125 P03 — Wave 2 verifier (scripts/verify-on-page-seo.mjs asserting 6 invariants, wired into npm run build after verify-no-google-fonts). After P03, Phase 125 complete; Phase 126 (CSS investigation) becomes next candidate.
