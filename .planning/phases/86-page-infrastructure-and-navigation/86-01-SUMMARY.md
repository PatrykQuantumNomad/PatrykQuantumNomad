---
phase: 86-page-infrastructure-and-navigation
plan: 01
subsystem: infra
tags: [astro, navigation, sidebar, breadcrumb, layout, route-helpers, vitest]

# Dependency graph
requires:
  - phase: 85-foundation-and-content-schema
    provides: Zod schemas, content collections, guide.json, dynamic page route
provides:
  - Centralized route helpers (guidePageUrl, guideLandingUrl, GUIDE_ROUTES)
  - GuideLayout with two-column grid (sidebar + content)
  - GuideSidebar with sticky chapter navigation and active-page highlighting
  - GuideBreadcrumb with Home > Guides > Guide Title > Chapter path
  - GuideChapterNav with prev/next chapter links
  - Complete guide.json with all 11 chapter entries
affects: [86-02-landing-page, 87-guide-components, 88-content-authoring]

# Tech tracking
tech-stack:
  added: []
  patterns: [guide-route-helpers, two-column-guide-layout, sticky-sidebar-nav, guide-breadcrumb, chapter-prev-next-nav]

key-files:
  created:
    - src/lib/guides/routes.ts
    - src/lib/guides/__tests__/routes.test.ts
    - src/layouts/GuideLayout.astro
    - src/components/guide/GuideSidebar.astro
    - src/components/guide/GuideBreadcrumb.astro
    - src/components/guide/GuideChapterNav.astro
  modified:
    - src/data/guides/fastapi-production/guide.json

key-decisions:
  - "Route helpers follow exact pattern from src/lib/eda/routes.ts with GUIDE_ROUTES const and URL builder functions"
  - "GuideLayout extends Layout.astro (not EDALayout) matching the layout-wrapping pattern"
  - "Sidebar uses CSS position:sticky (no JavaScript) with top-20 offset accounting for sticky header"
  - "All navigation components use route helpers from routes.ts -- zero hardcoded URLs"

patterns-established:
  - "Guide route helpers: GUIDE_ROUTES const + guidePageUrl() + guideLandingUrl() with trailing slashes"
  - "Two-column guide layout: lg:grid lg:grid-cols-[240px_1fr] with hidden sidebar on mobile"
  - "Guide component composition: Layout > GuideLayout > [GuideBreadcrumb + GuideSidebar + content + GuideChapterNav]"

requirements-completed: [INFRA-02, INFRA-03, INFRA-04, INFRA-05, INFRA-06]

# Metrics
duration: 3min
completed: 2026-03-08
---

# Phase 86 Plan 01: Route Helpers and Navigation Components Summary

**TDD route helpers with 8 unit tests plus 4 zero-JS Astro navigation components providing two-column layout, sticky sidebar, breadcrumbs, and prev/next chapter navigation**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-08T15:01:21Z
- **Completed:** 2026-03-08T15:04:09Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments

- Route helper module (routes.ts) with GUIDE_ROUTES const, guidePageUrl(), and guideLandingUrl() -- all URLs enforce trailing slashes
- 8 unit tests covering route constant values, URL generation for multiple slugs, and trailing slash enforcement
- guide.json updated from 1 chapter to all 11 planned chapters in correct reading order
- GuideLayout.astro providing two-column grid (240px sidebar + content) on desktop, single column on mobile
- GuideSidebar.astro with sticky positioning, chapter links via route helpers, and aria-current="page" active highlighting
- GuideBreadcrumb.astro rendering Home > Guides > Guide Title > Chapter breadcrumbs with accessible nav markup
- GuideChapterNav.astro computing prev/next chapters from guide.json order with directional arrow indicators
- Full Astro build succeeds (1063 pages) with all new components

## Task Commits

Each task was committed atomically:

1. **Task 1 (RED): Failing route helper tests** - `544ebdf` (test)
2. **Task 1 (GREEN): Route helpers + guide.json chapters** - `1685a74` (feat)
3. **Task 2: GuideLayout and navigation components** - `d99ef38` (feat)

_Note: Task 1 followed TDD with RED/GREEN commits. No REFACTOR needed -- route helpers are clean as-is._

## Files Created/Modified

- `src/lib/guides/routes.ts` - GUIDE_ROUTES const, guidePageUrl(), guideLandingUrl() URL builders
- `src/lib/guides/__tests__/routes.test.ts` - 8 unit tests for route helpers (describe blocks for GUIDE_ROUTES, guidePageUrl, guideLandingUrl)
- `src/data/guides/fastapi-production/guide.json` - Updated chapters array from 1 to 11 entries
- `src/layouts/GuideLayout.astro` - Two-column layout wrapping Layout.astro with sidebar, breadcrumb, and chapter nav
- `src/components/guide/GuideSidebar.astro` - Sticky sidebar with chapter links and active-page highlighting
- `src/components/guide/GuideBreadcrumb.astro` - Breadcrumb navigation with Home > Guides > Guide > Chapter path
- `src/components/guide/GuideChapterNav.astro` - Previous/next chapter navigation links

## Decisions Made

- Route helpers follow the exact pattern from `src/lib/eda/routes.ts` (const object + URL builder functions)
- GuideLayout extends Layout.astro directly (not EDALayout) since guide pages need a different structure (two-column grid vs. simple content wrapper)
- Sidebar uses CSS `position: sticky` with `top: 5rem` offset to account for the sticky header height
- All components are zero-JS (pure Astro templates) -- no client-side JavaScript needed for navigation
- All URLs constructed via route helpers from `routes.ts` -- zero hardcoded URL strings in components

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- All navigation infrastructure ready for Plan 02 (landing page + [slug].astro integration)
- GuideLayout can be imported by [slug].astro to replace the current bare Layout wrapper
- guide.json has all 11 chapters for landing page card grid rendering
- Route helpers available for any component needing guide URLs

## Self-Check: PASSED

All 7 files verified present. All 3 commits verified in git log.
