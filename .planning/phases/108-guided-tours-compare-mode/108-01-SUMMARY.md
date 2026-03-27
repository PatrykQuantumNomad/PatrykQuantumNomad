---
phase: 108-guided-tours-compare-mode
plan: 01
subsystem: data
tags: [tours, comparisons, routes, vitest, ai-landscape]

requires:
  - phase: 102-data-foundation
    provides: 51-node AI landscape dataset (nodes.json) with slugs used as tour step IDs and comparison concept references
provides:
  - Tour and TourStep TypeScript interfaces
  - TOURS array with 3 curated guided learning paths (26 total steps)
  - ComparisonPair interface and POPULAR_COMPARISONS array with 12 curated VS pairs
  - comparisonSlug() canonical slug helper
  - vsPageUrl() and vsOgImageUrl() route helpers
  - Full test coverage validating all node references against real dataset
affects: [108-02 tour UI, 108-03 compare mode, 108-04 VS pages]

tech-stack:
  added: []
  patterns:
    - "Curated data arrays in TypeScript files (not JSON) for type safety and co-located documentation"
    - "Canonical alphabetical ordering for comparison slugs to prevent duplicate pages"

key-files:
  created:
    - src/lib/ai-landscape/tours.ts
    - src/lib/ai-landscape/comparisons.ts
    - src/lib/ai-landscape/__tests__/tours.test.ts
    - src/lib/ai-landscape/__tests__/comparisons.test.ts
  modified:
    - src/lib/ai-landscape/routes.ts

key-decisions:
  - "Tour data stored in TypeScript (not JSON) for interface co-location and narrative strings"
  - "12 curated comparison pairs covers top search queries without generating all 1,275 possible pairs"
  - "No parseComparisonSlug function -- slug parsing is ambiguous with hyphenated concept names; use curated array for lookups"
  - "Canonical alphabetical ordering (concept1 < concept2) prevents duplicate VS pages"

patterns-established:
  - "comparisonSlug() sorts alphabetically then joins with -vs- for canonical slugs"
  - "vsPageUrl() and vsOgImageUrl() follow same pattern as existing conceptUrl() and ogImageUrl()"

requirements-completed: [NAV-03, SEO-08]

duration: 2min
completed: 2026-03-27
---

# Phase 108 Plan 01: Tour & Comparison Data Layer Summary

**3 curated tours (26 steps), 12 comparison pairs, and VS route helpers with 16 tests validating all node IDs against the 51-node dataset**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-27T18:37:24Z
- **Completed:** 2026-03-27T18:40:08Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- Created 3 curated guided tours: "The Big Picture" (7 steps), "How ChatGPT Works" (10 steps), "What is Agentic AI" (9 steps) -- all 26 step nodeIds validated against real dataset
- Created 12 curated comparison pairs covering top AI concept search queries with canonical alphabetical slug ordering
- Added vsPageUrl() and vsOgImageUrl() route helpers to routes.ts
- 16 tests validate tour structure, comparison data integrity, slug ordering, and route helper output against the live 51-node dataset

## Task Commits

Each task was committed atomically:

1. **Task 1: Create tours.ts and comparisons.ts data files** - `3ee911a` (feat)
2. **Task 2: Create unit tests for tours and comparisons data** - `5e4d63a` (test)

## Files Created/Modified
- `src/lib/ai-landscape/tours.ts` - Tour/TourStep interfaces and TOURS array with 3 curated guided paths
- `src/lib/ai-landscape/comparisons.ts` - ComparisonPair interface, POPULAR_COMPARISONS array (12 pairs), comparisonSlug() helper
- `src/lib/ai-landscape/routes.ts` - Added vsPageUrl() and vsOgImageUrl() route helpers
- `src/lib/ai-landscape/__tests__/tours.test.ts` - 6 tests validating tour data against real dataset
- `src/lib/ai-landscape/__tests__/comparisons.test.ts` - 10 tests validating comparison data, slug ordering, and route helpers

## Decisions Made
- Tour data stored in TypeScript files (not JSON) for type safety and co-located narrative strings
- 12 curated comparison pairs covers top search queries without generating all 1,275 possible permutations
- No parseComparisonSlug function included -- slug parsing is ambiguous with hyphenated concept names per research pitfall 3; curated array used for lookups instead
- Canonical alphabetical ordering (concept1 < concept2) in all comparison pairs prevents duplicate VS pages

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Known Stubs
None - all data is fully populated with real narratives, questions, and summaries.

## Next Phase Readiness
- Tour data ready for TourBar component and useTour hook (Plan 02)
- Comparison data ready for ComparePanel component (Plan 03)
- VS route helpers ready for static VS pages with getStaticPaths (Plan 04)
- All node references validated -- downstream plans can import TOURS and POPULAR_COMPARISONS with confidence

## Self-Check: PASSED

All 5 created/modified files verified on disk. Both task commits (3ee911a, 5e4d63a) confirmed in git log. 16/16 tests pass.

---
*Phase: 108-guided-tours-compare-mode*
*Completed: 2026-03-27*
