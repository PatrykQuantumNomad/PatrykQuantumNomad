# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-17)

**Core value:** A fast, SEO-optimized, visually distinctive portfolio that ranks well in search engines and makes a memorable impression on recruiters, collaborators, and the developer community.
**Current focus:** v1.3 The Beauty Index — Phase 21 in progress (SEO & Launch Readiness)

## Current Position

Phase: 21 of 21 (Final Verification)
Plan: 2 of 3 in current phase
Status: Phase 21 in progress — 21-01 and 21-02 complete
Last activity: 2026-02-17 — Completed 21-01 (SEO Navigation & Structured Data)

Progress: [======================>........] 20/21 phases (v1.0-v1.2 complete, v1.3 phases 16-20 complete, 21 remaining)

## Performance Metrics

**Velocity:**
- Total plans completed: 41 (16 v1.0 + 7 v1.1 + 6 v1.2 + 12 v1.3)
- Average duration: ~10 min (v1.0), ~3 min (v1.1), ~3 min (v1.2), ~5.5 min (v1.3)

**Cumulative Stats:**

| Milestone | Phases | Plans | Requirements | Date |
|-----------|--------|-------|--------------|------|
| v1.0 MVP | 1-7 | 15 | 36 | 2026-02-11 |
| v1.1 Content Refresh | 8-12 | 7 | 18 | 2026-02-12 |
| v1.2 Projects Page Redesign | 13-15 | 6 | 23 | 2026-02-13 |
| v1.3 The Beauty Index | 16-21 | TBD | 37 | in progress |
| **Total** | **21** | **29+** | **114** | |

## Accumulated Context

### Decisions

Full decision log in PROJECT.md Key Decisions table.
v1.0-v1.2 decisions archived in respective milestone files.

v1.3 decisions to date:
- Build-time SVG for all charts (no client-side charting libraries)
- Defer dark mode for Beauty Index v1 (charts work in light mode only)
- Phase 19 (Code Comparison) flagged for research-phase due to 250 code block complexity
- Tier boundaries: 6-19/20-33/34-46/47-60 across 6-60 score range
- radar-math.ts kept framework-agnostic (pure TS) for Astro + Satori dual use
- Greek font fallback via Noto Sans unicode-range scoping (not self-hosted)
- Radar chart maxRadius = size * 0.38 with labelRadius = maxRadius + 24 for label spacing
- Bar chart uses canonical dimension order for segment stacking with tier group headers
- Zero-JS chart component pattern: all SVG computation in Astro frontmatter
- Inline script with astro:page-load event for sort interactivity (view transition compatible)
- CodeSnippet interface as standard shape for language code examples
- Overview page uses 4 sections: hero, ranking chart, scoring table, radar grid
- Phase 16 test pages removed once real overview page exists
- file() loader slug pattern: use entry.data.id not entry.id for URL params
- BuiltinLanguage cast needed for Astro Code component lang prop type safety
- OG helper extraction: shared renderOgPng/brandingRow/accentBar functions reduce duplication
- Radar chart embedded in OG images via SVG base64 data URI in Satori VNode tree
- Client-side SVG-to-PNG at 2x via canvas for share controls (white #faf8f5 background)
- Progressive enhancement: Web Share API on mobile, Clipboard API on desktop, text URL fallback
- Nanostores atom for tab state management (286 bytes, official Astro recommendation)
- Pattern Matching undefined for 10 languages without native support
- Signature Idiom feature reuses existing SNIPPETS data directly
- data-tab-panel attribute convention for server-rendered panel visibility sync
- All 240 code blocks rendered at build time via Astro Code component (zero runtime Shiki)
- content-visibility: auto on tab panels for deferred paint performance
- Blog post uses prose dimension descriptions rather than importing data files
- Back-links in hero sections (overview, code) and after Character section (detail pages)
- Button-inside-th pattern per Adrian Roselli sortable table guidance (not role=button on th)
- aria-sort omitted from non-active columns (not aria-sort=none) per WAI-ARIA best practice
- Beauty Index callout placed between What I Build and Latest Writing for natural content flow
- No separate sr-only table for bar chart -- ScoringTable already provides accessible tabular data
- BeautyIndexJsonLd uses creator @id reference to match PersonJsonLd
- Visual breadcrumbs centered on overview/code pages, left-aligned on detail pages

### Pending Todos

None.

### Blockers/Concerns

- [Infra]: DNS configuration for patrykgolabek.dev is a manual step outside automation scope
- [Tech Debt]: No shared getBlogPostUrl helper — URL resolution duplicated in 3 files
- [Tech Debt]: Social links hardcoded across 5 component files instead of centralized config
- [Tech Debt]: Category colors defined in 3 places (ProjectCard, ProjectHero, FloatingOrbs)
- [Tech Debt]: Filter system inline script (~80 lines) in projects/index.astro
- [Deferred]: LinkedIn removal from JSON-LD sameAs (CONFIG-02)
- [v1.3 Gap]: Dark mode strategy deferred — charts use light mode CSS custom properties only
- [v1.3 Resolved]: Code comparison uses content-visibility: auto + hidden attribute for lazy rendering (validated Phase 19)

### Quick Tasks Completed

| # | Description | Date | Commit | Directory |
|---|-------------|------|--------|-----------|
| 001 | Create favicon for the website | 2026-02-12 | a21a260 | [001-create-favicon-for-the-website](./quick/001-create-favicon-for-the-website/) |
| 002 | Enhance blog listing page | 2026-02-12 | da1db30 | [002-enhance-blog-listing-page](./quick/002-enhance-blog-listing-page/) |
| 003 | Blog pagination and animations | 2026-02-12 | 03f503f | [003-blog-pagination-and-animations](./quick/003-blog-pagination-and-animations/) |
| 004 | SEO/LLM-SEO/GEO audit | 2026-02-13 | 0790a8f | [004-review-seo-llm-seo-and-geo-for-the-websi](./quick/004-review-seo-llm-seo-and-geo-for-the-websi/) |
| 005 | Implement SEO audit findings (P1+P2) | 2026-02-13 | 098f9cd | [005-implement-seo-audit-findings](./quick/005-implement-seo-audit-findings/) |
| 006 | SEO cross-linking for networking-tools | 2026-02-13 | 2b33c18 | [006-seo-cross-linking-for-networking-tools-p](./quick/006-seo-cross-linking-for-networking-tools-p/) |
| 007 | Add security headers via CSP meta tag | 2026-02-13 | 94633d0 | [007-add-security-headers-via-csp-meta-tag](./quick/007-add-security-headers-via-csp-meta-tag/) |
| 008 | Implement external SEO audit findings | 2026-02-13 | 2d6253d | [008-implement-external-seo-audit-findings](./quick/008-implement-external-seo-audit-findings/) |
| 009 | Change featured projects to networking-tools and JobFlow | 2026-02-13 | e153249 | [009-change-which-project-is-featured](./quick/009-change-which-project-is-featured/) |

## Session Continuity

Last session: 2026-02-17
Stopped at: Completed 21-01-PLAN.md (SEO Navigation & Structured Data)
Resume file: None
Next: Phase 21 Plan 03 remaining
