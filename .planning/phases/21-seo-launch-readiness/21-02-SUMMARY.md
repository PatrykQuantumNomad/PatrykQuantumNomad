---
phase: 21-seo-launch-readiness
plan: 02
subsystem: ui, seo
tags: [internal-linking, accessibility, wcag, aria, keyboard-navigation, astro]

# Dependency graph
requires:
  - phase: 20-blog-content-cross-linking
    provides: "Beauty Index pages and initial blog cross-link (the-beauty-index.mdx)"
  - phase: 17-overview-scoring-table
    provides: "ScoringTable.astro component with sort functionality"
provides:
  - "Homepage Beauty Index callout section with internal link"
  - "Second blog post cross-link to Beauty Index (building-kubernetes-observability-stack.mdx)"
  - "WCAG 2.1 AA keyboard-accessible ScoringTable sort controls"
  - "Screen reader sort announcements via aria-live region"
affects: [21-seo-launch-readiness]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Button-inside-th pattern for accessible sortable tables"
    - "aria-sort attribute management for active sort column"
    - "aria-live polite region for dynamic content announcements"

key-files:
  created: []
  modified:
    - src/pages/index.astro
    - src/data/blog/building-kubernetes-observability-stack.mdx
    - src/components/beauty-index/ScoringTable.astro

key-decisions:
  - "Button-inside-th pattern per Adrian Roselli sortable table guidance (not role=button on th)"
  - "aria-sort omitted from non-active columns (not aria-sort=none) per WAI-ARIA best practice"
  - "Beauty Index callout placed between What I Build and Latest Writing for natural content flow"

patterns-established:
  - "Accessible sortable table: button elements in th, aria-sort on active column, aria-live for announcements"

requirements-completed: [SEO-04, SEO-07]

# Metrics
duration: 4min
completed: 2026-02-17
---

# Phase 21 Plan 02: Cross-Links & Accessibility Summary

**Homepage and blog internal links to Beauty Index, plus WCAG 2.1 AA keyboard-accessible ScoringTable sort with aria-sort and live region announcements**

## Performance

- **Duration:** 4 min
- **Started:** 2026-02-17T20:41:50Z
- **Completed:** 2026-02-17T20:46:09Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- Homepage now includes a Beauty Index callout section linking to /beauty-index/
- Kubernetes observability blog post now cross-links to Beauty Index (2 blog posts total linking to Beauty Index)
- ScoringTable sort headers refactored from th click handlers to button elements for native keyboard support
- Active sort column communicates state via aria-sort attribute
- Sort changes announced to screen readers via aria-live polite region
- Focus-visible styles added for keyboard navigation

## Task Commits

Each task was committed atomically:

1. **Task 1: Add Beauty Index cross-links to homepage and blog post** - `761dc6c` (feat)
2. **Task 2: Make ScoringTable sort keyboard-accessible with ARIA attributes** - `175feff` (feat)

## Files Created/Modified
- `src/pages/index.astro` - Added Beauty Index callout section between What I Build and Latest Writing
- `src/data/blog/building-kubernetes-observability-stack.mdx` - Added Related cross-link to Beauty Index at end of post
- `src/components/beauty-index/ScoringTable.astro` - Refactored sort headers to use button elements with aria-sort, scope=col, aria-live region, and focus-visible styles

## Decisions Made
- Used button-inside-th pattern (not role="button" on th) per Adrian Roselli's sortable table guidance -- native keyboard focus and activation without extra ARIA
- Omitted aria-sort from non-active columns entirely (not aria-sort="none") per WAI-ARIA best practice
- Placed Beauty Index callout between "What I Build" and "Latest Writing" sections for natural content hierarchy

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Internal linking strengthened: homepage and 2 blog posts link to Beauty Index
- ScoringTable is fully keyboard-accessible and screen reader friendly
- Ready for remaining Phase 21 plans (01 meta/structured data, 03 final verification)

## Self-Check: PASSED

All files exist. All commits verified (761dc6c, 175feff). Build passes with zero errors.

---
*Phase: 21-seo-launch-readiness*
*Completed: 2026-02-17*
