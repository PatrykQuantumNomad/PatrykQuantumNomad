---
phase: 104-static-landing-page-force-layout
plan: 01
subsystem: ui
tags: [d3-force, svg, force-layout, dark-mode, zod, vitest]

# Dependency graph
requires:
  - phase: 102-data-foundation
    provides: nodes.json (51 nodes), graph.json (9 clusters, 66 edges)
provides:
  - layout.json with pre-computed d3-force node positions (51 nodes, 1200x900 viewBox)
  - layout-schema.ts with Zod schema and LayoutPosition/LayoutMeta/Layout types
  - svg-builder.ts with buildLandscapeSvg pure function for static SVG generation
  - generate-layout.mjs prebuild script for deterministic headless simulation
affects: [104-02-landing-page, 105-interactive-graph]

# Tech tracking
tech-stack:
  added: [d3-force, @types/d3-force]
  patterns: [headless d3-force simulation, CSS class-based cluster coloring, html.dark dark mode pattern, prebuild script chaining]

key-files:
  created:
    - scripts/generate-layout.mjs
    - src/data/ai-landscape/layout.json
    - src/lib/ai-landscape/layout-schema.ts
    - src/lib/ai-landscape/svg-builder.ts
    - src/lib/ai-landscape/__tests__/layout-schema.test.ts
    - src/lib/ai-landscape/__tests__/svg-builder.test.ts
  modified:
    - package.json

key-decisions:
  - "d3-force micro-module import only (never umbrella d3) per project convention"
  - "Headless simulation with 300 ticks and forceX/forceY cluster centroids for spatial grouping"
  - "CSS class-based coloring (.ai-cluster-{id}) with html.dark overrides instead of inline styles"
  - "SVG uses CSS vars (--color-text-primary, --color-border) for theme integration"
  - "Root nodes (parentId null) get r=24, child nodes r=18 for visual hierarchy"

patterns-established:
  - "Prebuild script pattern: generate-layout.mjs chained into prebuild via && operator"
  - "SVG builder pattern: pure function taking data + positions, returning SVG string"
  - "Cluster CSS naming: .ai-cluster-{clusterId} with html.dark variants"

requirements-completed: [GRAPH-08, GRAPH-02]

# Metrics
duration: 35min
completed: 2026-03-26
---

# Phase 104 Plan 01: Layout Pipeline Summary

**d3-force headless layout with 51-node positions, SVG builder with 9-cluster coloring and dark mode support**

## Performance

- **Duration:** 35 min
- **Started:** 2026-03-26T20:06:30Z
- **Completed:** 2026-03-26T20:41:30Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments
- Pre-computed d3-force layout with deterministic 300-tick headless simulation producing 51 node positions within 1200x900 viewBox
- SVG builder function with CSS class-based cluster coloring for all 9 clusters, html.dark dark mode overrides, and correct edge-before-nodes z-ordering
- 31 unit and integration tests (15 layout-schema + 16 svg-builder) all passing
- Prebuild script chaining: layout generation runs automatically before every build

## Task Commits

Each task was committed atomically:

1. **Task 1: Install d3-force, create layout-schema.ts, and write layout generation script**
   - `65e5c97` (test: failing layout-schema tests)
   - `c69811f` (feat: d3-force layout pipeline with 51 positions)

2. **Task 2: Create SVG builder function with cluster coloring and dark mode**
   - `5b9c49b` (test: failing svg-builder tests)
   - `60e496e` (feat: SVG builder with cluster coloring and dark mode)

## Files Created/Modified
- `scripts/generate-layout.mjs` - Headless d3-force simulation script (reads nodes/graph, writes layout.json)
- `src/data/ai-landscape/layout.json` - Pre-computed positions for 51 nodes within 1200x900 viewBox
- `src/lib/ai-landscape/layout-schema.ts` - Zod schema + types for layout.json (LayoutPosition, LayoutMeta, Layout)
- `src/lib/ai-landscape/svg-builder.ts` - Pure function building SVG string with cluster coloring and dark mode
- `src/lib/ai-landscape/__tests__/layout-schema.test.ts` - 15 tests: schema validation + layout.json integration
- `src/lib/ai-landscape/__tests__/svg-builder.test.ts` - 16 tests: SVG structure, ARIA, cluster CSS, dark mode, z-order
- `package.json` - Added d3-force deps, prebuild chaining, generate-layout script

## Decisions Made
- d3-force micro-module imports only (per project convention, never umbrella d3 package)
- Cluster centroids placed to approximate the original DOT graph topology (AI/ML/NN/DL left-center cascade, levels/agentic right side)
- Force params: forceManyBody(-200), forceLink(60/0.3), forceCollide(25), forceX/Y(0.15), forceCenter(600,450)
- CSS class naming convention: `.ai-cluster-{id}` with `html.dark .ai-cluster-{id}` overrides
- Edge differentiation: hierarchy=solid/thick(2), includes=dashed(1.5), others=thin(1)/faded(0.4)
- Node label stripping: parenthetical suffixes removed (e.g., "Machine Learning" not "Machine Learning (ML)")

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- vitest v4 does not support `-x` flag (plan referenced it); used `--bail 1` instead
- npm cache permission issue resolved by using alternate cache directory ($TMPDIR)

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- layout.json and svg-builder.ts are ready for Plan 02 (Landing Page) consumption
- buildLandscapeSvg can be called at build time from an Astro page to produce static SVG
- All force layout data is pre-computed; no runtime d3 dependency needed for the landing page

## Self-Check: PASSED

All 6 files verified present. All 4 commit hashes verified in git log.

---
*Phase: 104-static-landing-page-force-layout*
*Completed: 2026-03-26*
