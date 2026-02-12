---
phase: "09-external-blog-integration"
plan: "02"
subsystem: "blog-ui"
tags: ["blog-card", "external-links", "rss", "source-badge", "astro"]
requires:
  - phase: "09-01"
    provides: "10 external blog post stubs with externalUrl and source fields"
provides:
  - "BlogCard component with external link handling, source badges, and external icon"
  - "RSS feed with external URL support and chronological sorting"
affects: ["12-cleanup-verify"]
tech-stack:
  added: []
  patterns: ["conditional attribute spread for target/rel", "nullish coalescing for RSS link fallback"]
key-files:
  created: []
  modified:
    - src/components/BlogCard.astro
    - src/pages/rss.xml.ts
key-decisions:
  - "Inline SVG for external link icon (no icon library dependency)"
  - "Nullish coalescing for RSS link fallback (externalUrl ?? internal path)"
duration: "2min 12s"
completed: "2026-02-12"
---

# Phase 9 Plan 2: BlogCard External Links and RSS Feed Summary

BlogCard renders external posts with source badges ("on Kubert AI" / "on Translucent Computing"), external link SVG icon, and target="_blank" new-tab behavior; RSS feed includes all 11 posts with canonical external URLs sorted chronologically.

## Performance

- **Duration:** 2min 12s
- **Started:** 2026-02-12T00:06:17Z
- **Completed:** 2026-02-12T00:08:29Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- BlogCard component now handles external posts with source badges, external link icons, and proper target/rel attributes
- RSS feed includes all 11 blog posts (1 local + 10 external) sorted by date with correct canonical URLs
- Tag pages automatically render external posts correctly via shared BlogCard component (no tag page changes needed)

## Task Commits

Each task was committed atomically:

1. **Task 1: Update BlogCard for external link behavior with source badge and icon** - `4cdd435` (feat)
2. **Task 2: Update RSS feed to include external posts with canonical URLs** - `73ecbf7` (feat)

## Files Created/Modified

| File | Action | Purpose |
|------|--------|---------|
| src/components/BlogCard.astro | modified | External link handling with source badge, external icon, conditional target/rel |
| src/pages/rss.xml.ts | modified | Chronological sorting and external URL support in RSS items |

## Decisions Made

1. **Inline SVG for external link icon**: Used a single inline SVG rather than an icon library or component. One icon does not justify a dependency.

2. **Nullish coalescing for RSS link**: Used `post.data.externalUrl ?? /blog/${post.id}/` -- clean, readable, and correctly handles undefined (local posts) vs string (external posts).

## Deviations from Plan

None -- plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None -- no external service configuration required.

## Next Phase Readiness

Phase 9 is now complete. All external blog integration work is done:
- 10 external blog post stubs created (Plan 01)
- getStaticPaths guards prevent external post detail pages (Plan 01)
- BlogCard renders external posts with badges and icons (Plan 02)
- RSS feed includes all posts with correct URLs (Plan 02)
- Tag pages work automatically via shared BlogCard (Plan 02)

Ready for Phase 10 (Social Links & Contact Update) which is independent of Phase 9.

## Self-Check: PASSED

- All 2 modified files verified present on disk
- Both commits verified (4cdd435, 73ecbf7)
- Build passes with zero errors (19 pages, 1.17s)
- Blog listing: 6 "on Kubert AI" badges, 4 "on Translucent Computing" badges
- Blog listing: 10 external links with target="_blank" rel="noopener noreferrer"
- Blog listing: 1 local post with internal link, no badge, no icon
- RSS feed: 11 items, chronologically sorted, correct canonical URLs
- Tag pages: external posts render correctly via shared BlogCard

---
*Phase: 09-external-blog-integration*
*Completed: 2026-02-12*
