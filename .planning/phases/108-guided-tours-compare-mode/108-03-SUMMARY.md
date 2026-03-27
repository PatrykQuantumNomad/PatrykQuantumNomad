---
phase: 108-guided-tours-compare-mode
plan: 03
subsystem: ui
tags: [astro, seo, json-ld, og-image, satori, sharp, structured-data]

requires:
  - phase: 108-01
    provides: POPULAR_COMPARISONS array, ComparisonPair interface, vsPageUrl/vsOgImageUrl route helpers
provides:
  - 12 static VS comparison pages at /ai-landscape/vs/[slug]/
  - FAQPage + dual DefinedTerm JSON-LD structured data per VS page
  - generateAiLandscapeVsOgImage function for dark-themed split-layout OG images
  - 12 branded 1200x630 PNG OG images for VS pages
affects: [108-04, seo-indexing, sitemap]

tech-stack:
  added: []
  patterns: [dark-bg-og-image, split-layout-comparison, multi-jsonld-per-page]

key-files:
  created:
    - src/pages/ai-landscape/vs/[slug].astro
    - src/pages/open-graph/ai-landscape/vs/[slug].png.ts
  modified:
    - src/lib/og-image.ts

key-decisions:
  - "Dark background (#0a0a0f) for VS OG images to differentiate from light-bg concept OG images"
  - "Cluster-gradient top accent bar (left color to right color) for visual pairing on OG images"
  - "Relationship groups capped to 3 groups x 4 items per concept column to prevent overflow"

patterns-established:
  - "VS page pattern: getStaticPaths filters POPULAR_COMPARISONS against nodesMap for safety"
  - "Multi-JSON-LD pages: 5 blocks (WebSite, 2x DefinedTerm, BreadcrumbList, FAQPage)"

duration: 6min
completed: 2026-03-27
---

# Phase 108 Plan 03: VS Comparison Pages Summary

**12 static VS comparison pages with FAQPage/DefinedTerm JSON-LD, side-by-side content, and dark-themed branded OG images targeting "X vs Y" search queries**

## Performance

- **Duration:** 6 min
- **Started:** 2026-03-27T18:42:34Z
- **Completed:** 2026-03-27T18:48:39Z
- **Tasks:** 1
- **Files modified:** 3

## Accomplishments
- Created 12 VS comparison pages at /ai-landscape/vs/[slug]/ with side-by-side concept descriptions, ancestry paths, and relationship groups
- Each VS page has 5 JSON-LD blocks: WebSite (from Layout), 2x DefinedTerm, BreadcrumbList, FAQPage
- Added generateAiLandscapeVsOgImage function producing dark-themed 1200x630 split-layout OG images with cluster colors and "VS" center divider
- Generated 12 valid PNG OG images, one per comparison pair

## Task Commits

Each task was committed atomically:

1. **Task 1: Create VS page template and OG image endpoint** - `a66a2d3` (feat)

**Plan metadata:** TBD (docs: complete plan)

## Files Created/Modified
- `src/pages/ai-landscape/vs/[slug].astro` - VS comparison page template with side-by-side layout, ancestry paths, relationship groups, and JSON-LD structured data
- `src/pages/open-graph/ai-landscape/vs/[slug].png.ts` - OG image endpoint generating branded PNG for each VS comparison
- `src/lib/og-image.ts` - Added generateAiLandscapeVsOgImage function for dark-themed split-layout OG images

## Decisions Made
- Dark background (#0a0a0f) for VS OG images to visually differentiate from the light-background concept OG images
- Cluster-gradient top accent bar transitions from concept1's cluster color to concept2's cluster color
- Relationship groups capped to 3 groups with 4 items each per column to prevent content overflow on mobile

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- VS pages are live and indexed in sitemap via @astrojs/sitemap
- All 12 comparison pairs generate successfully
- Pre-existing notebook test failures (kernelspec display_name) unrelated to this plan
- Ready for Phase 108 Plan 04 (compare mode UI integration)

## Self-Check: PASSED

- FOUND: src/pages/ai-landscape/vs/[slug].astro
- FOUND: src/pages/open-graph/ai-landscape/vs/[slug].png.ts
- FOUND: src/lib/og-image.ts
- FOUND: .planning/phases/108-guided-tours-compare-mode/108-03-SUMMARY.md
- FOUND: commit a66a2d3

---
*Phase: 108-guided-tours-compare-mode*
*Completed: 2026-03-27*
