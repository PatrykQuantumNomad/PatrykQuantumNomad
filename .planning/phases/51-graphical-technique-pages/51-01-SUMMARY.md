---
phase: 51-graphical-technique-pages
plan: 01
subsystem: ui
tags: [astro, svg, vanilla-js, aria, tab-switching, technique-renderer, composition]

# Dependency graph
requires:
  - phase: 50-svg-generation
    provides: "13 SVG generators (histogram, box-plot, scatter, line, lag, probability, spectral, star, contour, bar, 4-plot, 6-plot, distribution-curve)"
  - phase: 49-data-model-schema-population
    provides: "techniques.json with 29 graphical entries, datasets.ts with NIST sample data"
provides:
  - "PlotVariantSwap.astro: Tier B tab-switching component with vanilla JS and CSS attribute selectors"
  - "technique-renderer.ts: centralized slug-to-generator mapping for all 29 graphical techniques"
  - "renderTechniquePlot(slug): default SVG string for any graphical technique"
  - "renderVariants(slug): labeled variant SVG array for 6 Tier B techniques"
affects: [51-02, 51-03, 52-quantitative-technique-pages]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "CSS attribute selectors [aria-selected] for JS-toggled styling (avoids Tailwind JIT purge)"
    - "stripSvgWrapper + g transform composition for multi-panel SVG layouts"
    - "Seeded PRNG for reproducible variant data across builds"

key-files:
  created:
    - src/components/eda/PlotVariantSwap.astro
    - src/lib/eda/technique-renderer.ts
  modified: []

key-decisions:
  - "CSS attribute selectors instead of Tailwind classList toggling for tab styling (JIT purge issue)"
  - "First variant in array IS the default variant (no separate defaultSvg prop)"
  - "Seeded pseudo-random number generator for reproducible variant datasets across builds"
  - "boxPlotData mapped from group->label to match BoxPlotOptions interface"

patterns-established:
  - "PlotVariantSwap pattern: build-time SVG in hidden panels, vanilla JS tab toggling via aria-selected"
  - "TECHNIQUE_RENDERERS Record<string, () => string> pattern for slug-to-SVG mapping"
  - "Composition helper functions for multi-panel techniques (bihistogram, linear-plots, doe-plots, etc.)"

requirements-completed: [GRAPH-01, GRAPH-02, GRAPH-03, GRAPH-04, GRAPH-05, GRAPH-06, GRAPH-07, GRAPH-08, GRAPH-09, GRAPH-10, GRAPH-11, GRAPH-12, GRAPH-13, GRAPH-14, GRAPH-15, GRAPH-16, GRAPH-17, GRAPH-18, GRAPH-19, GRAPH-20, GRAPH-21, GRAPH-22, GRAPH-23, GRAPH-24, GRAPH-25, GRAPH-26, GRAPH-27, GRAPH-28, GRAPH-29, GRAPH-30]

# Metrics
duration: 6min
completed: 2026-02-25
---

# Phase 51 Plan 01: PlotVariantSwap and Technique Renderer Summary

**PlotVariantSwap.astro component with vanilla JS tab switching and technique-renderer.ts mapping all 29 graphical techniques to SVG generators with 6 Tier B variant datasets (35 total variants)**

## Performance

- **Duration:** 6 min
- **Started:** 2026-02-25T02:16:05Z
- **Completed:** 2026-02-25T02:21:41Z
- **Tasks:** 2
- **Files created:** 2

## Accomplishments
- PlotVariantSwap.astro with CSS attribute selectors for tab styling, inline vanilla JS (~3KB), proper ARIA attributes (role=tab, role=tabpanel, aria-selected, aria-controls)
- technique-renderer.ts with 29 slug entries: 18 direct generator calls + 11 composition-based techniques using stripSvgWrapper pattern
- 6 Tier B variant datasets producing visually distinct patterns: histogram (8), scatter-plot (12), normal-probability-plot (4), lag-plot (4), autocorrelation-plot (4), spectral-plot (3)
- All runtime tests pass: each slug produces valid SVG, variants have distinct content, compositions generate complete multi-panel layouts

## Task Commits

Each task was committed atomically:

1. **Task 1: Create PlotVariantSwap.astro tab-switching component** - `6caff34` (feat)
2. **Task 2: Create technique-renderer.ts with 29 slug-to-generator mappings** - `e064d9f` (feat)

## Files Created/Modified
- `src/components/eda/PlotVariantSwap.astro` - Tier B tab-switching component with vanilla JS, CSS attribute selectors, ARIA tabs
- `src/lib/eda/technique-renderer.ts` - Centralized 29-entry slug-to-generator map, 11 composition helpers, 6 variant dataset arrays, public renderTechniquePlot/renderVariants API

## Decisions Made
- CSS attribute selectors `[aria-selected="true"]` for tab active state instead of Tailwind classList toggling (avoids JIT purge issue where dynamically added classes get stripped)
- First variant in the array IS the default (no separate defaultSvg prop needed)
- Seeded pseudo-random number generator (`seededRandom`) ensures reproducible variant data across builds (important for consistent SSG output)
- boxPlotData mapped from `{ group, values }` to `{ label, values }` to match BoxPlotOptions interface (property name mismatch between dataset and generator)
- Event delegation on container click rather than per-tab listeners for View Transition safety

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed boxPlotData property name mismatch**
- **Found during:** Task 2 (technique-renderer.ts)
- **Issue:** boxPlotData uses `{ group: string }` but BoxPlotOptions expects `{ label: string }` for each group
- **Fix:** Added `.map(g => ({ label: g.group, values: g.values }))` in the box-plot renderer entry
- **Files modified:** src/lib/eda/technique-renderer.ts
- **Verification:** Runtime test confirms box-plot SVG renders correctly
- **Committed in:** e064d9f (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 bug fix)
**Impact on plan:** Minor property mapping fix required for API compatibility. No scope creep.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- PlotVariantSwap.astro ready for use in `[slug].astro` dynamic route (Plan 02/03)
- technique-renderer.ts provides complete renderTechniquePlot and renderVariants API for route consumption
- All 29 graphical technique slugs verified against techniques.json entries

## Self-Check: PASSED

All created files exist, all commit hashes verified in git log.

---
*Phase: 51-graphical-technique-pages*
*Completed: 2026-02-25*
