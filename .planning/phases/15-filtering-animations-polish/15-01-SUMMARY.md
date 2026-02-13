---
phase: 15-filtering-animations-polish
plan: 01
subsystem: ui
tags: [gsap, flip, filter, animation, vanilla-tilt, url-hash, accessibility]

# Dependency graph
requires:
  - phase: 14-visual-design-card-components
    provides: ProjectCard with data-category and data-card-item attributes, category glow colors
  - phase: 13-data-model-bento-grid
    provides: Projects data model with categories, ProjectHero component, bento grid layout
provides:
  - ProjectFilterBar component with 5 pill buttons (All + 4 categories)
  - GSAP Flip animated filter transitions on projects page
  - URL hash sync for filter state persistence and shareability
  - data-hero-section and data-category-section wrapper attributes
  - Filter tab CSS with hover and aria-pressed active states
affects: [15-02-scroll-animations, projects-page]

# Tech tracking
tech-stack:
  added: [gsap/Flip]
  patterns: [GSAP Flip layout animation, vanilla-tilt lifecycle management, URL hash state sync]

key-files:
  created:
    - src/components/ProjectFilterBar.astro
  modified:
    - src/pages/projects/index.astro
    - src/styles/global.css

key-decisions:
  - "Button elements for filter tabs (not anchor tags) to prevent Astro ClientRouter interception"
  - "replaceState for hash updates (not pushState) to avoid polluting browser history"
  - "vanilla-tilt destroy before Flip.getState, reinit via dynamic import in onComplete"
  - "Instant toggle fallback when prefers-reduced-motion is active"

patterns-established:
  - "GSAP Flip lifecycle: destroy tilt -> getState -> toggle visibility -> Flip.from -> reinit tilt in onComplete"
  - "URL hash filter persistence: replaceState on click, getFilterFromHash on page-load"
  - "Rapid-click guard pattern: isAnimating flag prevents concurrent Flip animations"

# Metrics
duration: 5min
completed: 2026-02-13
---

# Phase 15 Plan 01: Category Filter System Summary

**GSAP Flip-animated category filter tabs with URL hash sync, reduced-motion fallback, and vanilla-tilt lifecycle management on the projects page**

## Performance

- **Duration:** 5 min
- **Started:** 2026-02-13T21:49:01Z
- **Completed:** 2026-02-13T21:54:34Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- ProjectFilterBar renders 5 pill buttons (All, AI/ML, Kubernetes, Platform, Security) with aria-pressed state
- Clicking a filter tab triggers GSAP Flip.from() animated layout transition with staggered card enter/leave
- URL hash reflects active filter (#ai-ml, #kubernetes, etc.) and restores on page load
- Hero section and category wrappers (headers, dividers, grids) hide/show as units when filtered
- Reduced-motion users get instant toggle instead of Flip animation
- vanilla-tilt explicitly destroyed before Flip state capture and reinited via dynamic import in onComplete
- Rapid-click guard prevents animation conflicts during Flip transitions

## Task Commits

Each task was committed atomically:

1. **Task 1: Create ProjectFilterBar and update projects page markup** - `60e2181` (feat)
2. **Task 2: Implement GSAP Flip filter logic and URL hash sync** - `724dfe7` (feat)

## Files Created/Modified
- `src/components/ProjectFilterBar.astro` - Filter tab bar with 5 pill buttons (All + 4 categories) using data-filter attributes
- `src/pages/projects/index.astro` - Added filter bar import, hero/section wrappers, inline script with GSAP Flip filter logic and hash sync
- `src/styles/global.css` - Filter tab pill button styles with hover and aria-pressed="true" active states

## Decisions Made
- Used `<button>` elements for filter tabs (not `<a>` tags) to prevent Astro ClientRouter interception on click
- Used `history.replaceState` (not `pushState`) for hash updates to avoid polluting browser history
- Destroy vanilla-tilt before `Flip.getState()` and reinit via `import('vanilla-tilt')` in `Flip.from` onComplete callback -- matches TiltCard.astro's dynamic import pattern and identical tilt params (max: 15, speed: 300, glare: true, max-glare: 0.3, perspective: 800)
- Instant visibility toggle (no animation) when `prefers-reduced-motion: reduce` is active

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Filter system complete, ready for Plan 15-02 (scroll animations and polish)
- data-category-section wrappers provide clean targets for future scroll-triggered section reveals
- ScrollTrigger.refresh() is called after filter transitions, ensuring scroll animations recalculate correctly

## Self-Check: PASSED

- [x] `src/components/ProjectFilterBar.astro` exists
- [x] `src/pages/projects/index.astro` exists
- [x] `src/styles/global.css` exists
- [x] `git log --grep="15-01"` returns 2 commits (60e2181, 724dfe7)

---
*Phase: 15-filtering-animations-polish*
*Completed: 2026-02-13*
