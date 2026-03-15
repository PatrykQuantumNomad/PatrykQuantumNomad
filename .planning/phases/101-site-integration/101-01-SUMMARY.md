---
phase: 101-site-integration
plan: 01
subsystem: ui
tags: [astro, eda, notebooks, og-image, landing-page, colab, jupyter]

# Dependency graph
requires:
  - phase: 100-infrastructure-wiring
    provides: CASE_STUDY_REGISTRY with all 10 slugs, notebook-urls helpers, packager
provides:
  - Notebooks landing page at /eda/notebooks/ with 10 notebook cards
  - OG image endpoint at /open-graph/eda/notebooks.png
  - EDA_ROUTES.notebooks constant
affects: [101-02, site-integration]

# Tech tracking
tech-stack:
  added: []
  patterns: [registry-driven card grid, multi-action card (download + colab + case study)]

key-files:
  created:
    - src/pages/eda/notebooks/index.astro
    - src/pages/open-graph/eda/notebooks.png.ts
  modified:
    - src/lib/eda/routes.ts

key-decisions:
  - "Card uses div (not anchor) since each card has 3 independent links"
  - "OG image follows existing case-studies.png.ts pattern with getOrGenerateOgImage caching"

patterns-established:
  - "Multi-action card pattern: div container with multiple action links instead of single anchor wrapper"

requirements-completed: [SITE-01, SITE-05]

# Metrics
duration: 3min
completed: 2026-03-15
---

# Phase 101 Plan 01: Notebooks Landing Page Summary

**Notebooks landing page at /eda/notebooks/ with 10 NIST case study cards, download/Colab/case-study links, and OG image endpoint**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-15T11:29:00Z
- **Completed:** 2026-03-15T11:32:16Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- Notebooks landing page lists all 10 case study notebooks with titles, descriptions, NIST section references
- Each card provides Download ZIP, Open in Colab, and View case study links
- OG image endpoint generates social sharing preview for /eda/notebooks/
- EDA_ROUTES extended with notebooks constant at /eda/notebooks/
- BreadcrumbJsonLd and EDAJsonLd structured data for SEO

## Task Commits

Each task was committed atomically:

1. **Task 1: Add notebooks route and create OG image endpoint** - `5f4f8d2` (feat)
2. **Task 2: Create notebooks landing page** - `3021314` (feat)

## Files Created/Modified
- `src/pages/eda/notebooks/index.astro` - Notebooks landing page with card grid for all 10 notebooks
- `src/pages/open-graph/eda/notebooks.png.ts` - OG image endpoint for social sharing
- `src/lib/eda/routes.ts` - Added notebooks route to EDA_ROUTES constant

## Decisions Made
- Card uses div (not anchor) since each card has 3 independent action links (download, Colab, case study)
- OG image follows existing case-studies.png.ts pattern with getOrGenerateOgImage caching

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Notebooks landing page live and discoverable
- Ready for 101-02 (blog post, LLMs.txt, sitemap updates)
- Page already appears in sitemap-0.xml

## Self-Check: PASSED

- All 3 files exist (2 created, 1 modified)
- Both task commits verified (5f4f8d2, 3021314)
- Build produces dist/eda/notebooks/index.html with 10 notebooks
- OG image at dist/open-graph/eda/notebooks.png generated
- Page included in sitemap-0.xml

---
*Phase: 101-site-integration*
*Completed: 2026-03-15*
