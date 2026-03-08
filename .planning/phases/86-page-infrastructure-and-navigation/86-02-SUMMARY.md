---
phase: 86-page-infrastructure-and-navigation
plan: 02
subsystem: infra
tags: [astro, landing-page, guide-layout, chapter-cards, ai-agent-narrative]

# Dependency graph
requires:
  - phase: 86-page-infrastructure-and-navigation
    provides: GuideLayout, GuideSidebar, GuideBreadcrumb, GuideChapterNav, route helpers, guide.json with 11 chapters
provides:
  - Guide landing page at /guides/fastapi-production/ with AI agent hero and chapter card grid
  - Chapter pages using GuideLayout with sidebar, breadcrumb, and prev/next navigation
  - Coming Soon treatment for chapters without MDX content
affects: [87-guide-components, 88-content-authoring, 89-seo-and-integration]

# Tech tracking
tech-stack:
  added: []
  patterns: [landing-page-hero-with-narrative, chapter-card-grid-with-coming-soon, guide-layout-integration]

key-files:
  created:
    - src/pages/guides/fastapi-production/index.astro
  modified:
    - src/pages/guides/fastapi-production/[slug].astro

key-decisions:
  - "Landing page uses Layout (not GuideLayout) since it is not a chapter page"
  - "Chapter list sourced from guide.json chapters array (not guidePages collection) to show all 11 chapters even with only 1 MDX"
  - "Coming Soon cards rendered as div (not anchor) with opacity-60 to prevent dead links"
  - "Chapter descriptions hardcoded in index.astro as marketing copy (not in data model)"

patterns-established:
  - "Guide landing page pattern: hero with narrative + chapter card grid using guide.json as source of truth"
  - "Coming Soon pattern: existingSlugs Set from guidePages collection to conditionally render link vs div cards"

requirements-completed: [INFRA-01, INFRA-06, AGENT-03]

# Metrics
duration: 2min
completed: 2026-03-08
---

# Phase 86 Plan 02: Landing Page and Guide Layout Integration Summary

**Landing page at /guides/fastapi-production/ with AI agent hero narrative and 11-chapter card grid, plus [slug].astro wired to GuideLayout with sidebar, breadcrumb, and prev/next navigation**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-08T15:08:10Z
- **Completed:** 2026-03-08T15:10:43Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- Guide landing page with hero section containing AI agent narrative ("every production concern configured and battle-tested") and template repo link
- 11-chapter card grid: builder-pattern renders as clickable link card, 10 others render as Coming Soon cards with reduced opacity
- Chapter pages now use GuideLayout gaining two-column layout with sticky sidebar, breadcrumb navigation, and prev/next chapter links
- Full build succeeds (1064 pages) and all 283 vitest tests pass

## Task Commits

Each task was committed atomically:

1. **Task 1: Create guide landing page with hero and chapter card grid** - `0eef50b` (feat)
2. **Task 2: Update [slug].astro to use GuideLayout with full navigation** - `3e92dcc` (feat)

## Files Created/Modified

- `src/pages/guides/fastapi-production/index.astro` - Landing page with AI agent hero, template repo link, and 11-chapter card grid with Coming Soon treatment
- `src/pages/guides/fastapi-production/[slug].astro` - Updated from bare Layout to GuideLayout with sidebar, breadcrumb, and prev/next nav props

## Decisions Made

- Landing page uses `Layout` (not `GuideLayout`) because the landing page is not a chapter page and does not need sidebar/breadcrumb/prev-next
- Chapter card grid maps over `guideMeta.data.chapters` (from guide.json) rather than `guidePages` collection, ensuring all 11 chapters display even when only 1 MDX file exists
- Coming Soon chapters render as `<div>` (not `<a>`) with `opacity-60` to prevent dead links and visually signal unavailability
- Chapter descriptions are hardcoded in index.astro as a `Record<string, string>` map since they are landing-page-specific marketing copy, not part of the guide data model

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Landing page and chapter navigation fully functional for the 1 existing chapter (builder-pattern)
- As Phase 88 adds MDX files for remaining chapters, they will automatically appear as clickable cards (no landing page changes needed)
- GuideLayout ready to receive guide-specific components from Phase 87 (CodeFromRepo, architecture diagrams)
- All 11 chapters in guide.json provide structure for content authoring

## Self-Check: PASSED

All 2 files verified present. Both commits verified in git log (0eef50b, 3e92dcc).
