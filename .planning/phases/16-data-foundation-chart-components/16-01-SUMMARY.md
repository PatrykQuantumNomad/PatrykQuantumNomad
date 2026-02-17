---
phase: 16-data-foundation-chart-components
plan: 01
subsystem: data, ui
tags: [zod, astro-content-collections, radar-chart, svg-math, greek-fonts, typescript]

# Dependency graph
requires:
  - phase: none
    provides: first phase of v1.3
provides:
  - Zod-validated language data schema with TypeScript types
  - 25 language entries with 6-dimension scores, tiers, and character sketches
  - Astro content collection for languages via file() loader
  - Pure TypeScript radar math utility (polar-to-cartesian, SVG generation)
  - Tier configuration with score boundaries and brand colors
  - Dimension metadata with Greek symbols and descriptions
  - Greek character font fallback via Noto Sans unicode-range
affects: [16-02, 17, 18, 19, 20, 21]

# Tech tracking
tech-stack:
  added: [Noto Sans (Google Fonts, Greek subset)]
  patterns: [Zod schema + Astro file() loader for JSON data, unicode-range font scoping, pure TypeScript utility modules for cross-context use]

key-files:
  created:
    - src/lib/beauty-index/schema.ts
    - src/lib/beauty-index/radar-math.ts
    - src/lib/beauty-index/tiers.ts
    - src/lib/beauty-index/dimensions.ts
    - src/data/beauty-index/languages.json
  modified:
    - src/content.config.ts
    - src/styles/global.css
    - tailwind.config.mjs
    - src/layouts/Layout.astro

key-decisions:
  - "Tier boundaries distributed as 6-19/20-33/34-46/47-60 across the 6-60 score range"
  - "radar-math.ts kept as pure TypeScript with zero framework imports for Astro + Satori dual use"
  - "Greek Fallback font uses unicode-range U+0370-03FF scoping to avoid any impact on Latin rendering"
  - "Noto Sans loaded via Google Fonts (not self-hosted) to match existing font loading strategy"

patterns-established:
  - "Beauty Index data module pattern: schema.ts exports Zod schema + TypeScript type + helper functions"
  - "Canonical dimension order: phi, omega, lambda, psi, gamma, sigma (used everywhere)"
  - "Content collection JSON pattern: file() loader with external Zod schema import"

requirements-completed: [DATA-01, DATA-02, DATA-03, DATA-04]

# Metrics
duration: 7min
completed: 2026-02-17
---

# Phase 16 Plan 01: Data Foundation Summary

**Zod-validated language data model with 25 entries, pure TypeScript radar math utility, Astro content collection, and Greek unicode font fallback**

## Performance

- **Duration:** 7 min
- **Started:** 2026-02-17T14:40:47Z
- **Completed:** 2026-02-17T14:47:40Z
- **Tasks:** 3
- **Files modified:** 9

## Accomplishments

- Created 4 TypeScript utility modules (schema, dimensions, tiers, radar-math) with correct types and exports
- Built languages.json with 25 validated entries across 4 tiers, each with personality-driven character sketches
- Wired Astro content collection with file() loader for build-time validation of all language data
- Established Greek character font fallback infrastructure for 6 dimension symbols

## Task Commits

Each task was committed atomically:

1. **Task 1: Create Beauty Index schema, constants, and radar math utility** - `0203780` (feat)
2. **Task 2: Create languages.json with 25 languages and wire content collection** - `6c1454c` (feat)
3. **Task 3: Set up Greek character font fallback** - `2af190e` (feat)

## Files Created/Modified

- `src/lib/beauty-index/schema.ts` - Zod schema, Language type, totalScore/dimensionScores helpers
- `src/lib/beauty-index/dimensions.ts` - 6 dimension metadata constants with Greek symbols
- `src/lib/beauty-index/tiers.ts` - Tier boundaries, colors, lookup functions
- `src/lib/beauty-index/radar-math.ts` - Pure TS polar-to-cartesian math and SVG generation
- `src/data/beauty-index/languages.json` - 25 language entries with scores, tiers, sketches
- `src/content.config.ts` - Added languages collection with file() loader
- `src/styles/global.css` - Greek Fallback @font-face with unicode-range
- `tailwind.config.mjs` - Greek Fallback added to sans and heading font stacks
- `src/layouts/Layout.astro` - Noto Sans added to Google Fonts URL

## Decisions Made

- Tier boundaries set to 6-19/20-33/34-46/47-60 for even distribution across the 6-60 score range
- radar-math.ts designed with zero framework imports (no Astro, no React, no DOM APIs) so it works in both Astro components and Node/Satori OG image generation
- Greek font fallback uses Noto Sans via Google Fonts with unicode-range scoping rather than self-hosting, matching the existing font loading pattern
- Character sketches written in witty, personality-driven tone rather than technical summaries

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed tier assignments for practical-tier languages**
- **Found during:** Task 2 (languages.json creation)
- **Issue:** Initial score assignments for Go, C#, Dart, Julia, Lua, and Zig totaled above 33 (the practical tier ceiling), placing them in the handsome tier despite the plan specifying them as practical
- **Fix:** Adjusted dimension scores downward to achieve totals in the 28-29 range, keeping scores aesthetically reasonable while fitting the prescribed tier
- **Files modified:** src/data/beauty-index/languages.json
- **Verification:** Node.js validation script confirmed all 25 tier assignments match computed totals
- **Committed in:** 6c1454c (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Score adjustment necessary for data correctness. No scope creep.

## Issues Encountered

- Pre-existing TypeScript errors in OG image files (src/pages/open-graph/) unrelated to this plan. Not addressed per scope boundary rules.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- All data and utility modules are ready for Phase 16 Plan 02 (chart components)
- Content collection is wired and validated -- getCollection('languages') will return all 25 entries
- radar-math.ts is ready for both Astro component use and Satori OG image generation
- Greek character rendering infrastructure is in place for dimension labels

---
*Phase: 16-data-foundation-chart-components*
*Completed: 2026-02-17*
