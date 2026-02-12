---
phase: 12-cleanup-verification
plan: 01
subsystem: content, build-output
tags: [astro, sitemap, rss, llms-txt, og-images, external-urls, cleanup]

# Dependency graph
requires:
  - phase: 09-external-blog
    provides: "External blog post stubs with externalUrl field"
  - phase: 11-hero-project-curation
    provides: "Final content changes for v1.1"
provides:
  - "Clean repository with all stale content removed"
  - "LLMs.txt with correct external blog post URLs"
  - "Homepage Latest Writing with correct external links and visual indicators"
  - "Verified build outputs: sitemap, RSS, LLMs.txt, OG images, homepage HTML"
affects: []

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Nullish coalescing for external URL resolution (externalUrl ?? internal path)"
    - "Spread attributes for conditional target=_blank on external links"

key-files:
  created: []
  modified:
    - "src/pages/llms.txt.ts"
    - "src/pages/index.astro"
    - "src/data/blog/draft-placeholder.md (deleted)"

key-decisions:
  - "Nullish coalescing for LLMs.txt URL resolution (matches rss.xml.ts pattern)"
  - "Inline external link detection in homepage (no shared helper, matches plan scope)"
  - "Source badge and external link icon on homepage Latest Writing (matches BlogCard.astro pattern)"

patterns-established:
  - "All URL-generating pages use externalUrl ?? internal path for blog posts"
  - "External posts get target=_blank, source badge, and external link icon across all views"

# Metrics
duration: 2min
completed: 2026-02-12
---

# Phase 12 Plan 01: Cleanup & Verification Summary

**Deleted draft placeholder, fixed external URL bugs in LLMs.txt and homepage, verified all 5 build outputs (sitemap, RSS, LLMs.txt, OG images, homepage HTML) match v1.1 content**

## Performance

- **Duration:** 2 min
- **Started:** 2026-02-12T11:51:22Z
- **Completed:** 2026-02-12T11:53:40Z
- **Tasks:** 2
- **Files modified:** 3 (1 deleted, 2 modified)

## Accomplishments

- Deleted stale draft-placeholder.md blog post (CLEAN-01)
- Fixed LLMs.txt to use externalUrl for external blog posts via nullish coalescing -- 10 external posts now link to their canonical external URLs instead of non-existent /blog/ext-*/ paths
- Fixed homepage Latest Writing to link external posts to external URLs with target=_blank, source badge, and external link icon -- matching BlogCard.astro's visual pattern
- Verified all 5 generated outputs are correct (CLEAN-02 and CLEAN-03):
  - Sitemap: 19 URLs, no ext-* or draft paths
  - RSS: 11 items with correct links (10 external, 1 local)
  - LLMs.txt: all 11 posts with correct URLs, no broken links
  - OG images: exactly 1 image (building-kubernetes-observability-stack.png)
  - Homepage HTML: Latest Writing links resolve correctly with target=_blank for external
- v1.1 Content Refresh milestone is complete

## Task Commits

Each task was committed atomically:

1. **Task 1: Delete draft placeholder and fix external URL bugs** - `31e944f` (fix)
2. **Task 2: Build and verify all generated outputs** - verification only, no source changes

**Plan metadata:** `acedfff` (docs: complete plan)

## Files Created/Modified

- `src/data/blog/draft-placeholder.md` - Deleted (stale draft placeholder blog post)
- `src/pages/llms.txt.ts` - Fixed URL generation to use externalUrl via nullish coalescing
- `src/pages/index.astro` - Fixed Latest Writing section: external URL resolution, target=_blank, source badge, external link icon

## Decisions Made

- Used nullish coalescing (`externalUrl ?? internal path`) for LLMs.txt URL resolution, matching the established pattern in rss.xml.ts
- Kept external link detection inline in index.astro (no shared helper) per plan scope -- only 2 files needed fixing
- Added source badge and external link icon to homepage Latest Writing to match BlogCard.astro's visual pattern for consistency

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- v1.1 Content Refresh is complete (all 7 plans across Phases 8-12 executed)
- All build outputs verified correct
- Repository is clean and ready for deployment
- No blockers or concerns

## Self-Check: PASSED

- FOUND: src/pages/llms.txt.ts
- FOUND: src/pages/index.astro
- CONFIRMED DELETED: src/data/blog/draft-placeholder.md
- FOUND: 12-01-SUMMARY.md
- FOUND: commit 31e944f

---
*Phase: 12-cleanup-verification*
*Completed: 2026-02-12*
