---
phase: 65-svg-audit-fixes
plan: 02
subsystem: eda
tags: [svg, nist, autocorrelation, box-cox, youden, probability-plot, build-time-svg]

# Dependency graph
requires:
  - phase: 64-infrastructure-foundation
    provides: TechniqueContent interface and graphical template sections
  - phase: 50-svg-generator-library
    provides: SVG generator functions (line-plot, scatter-plot, plot-base)
provides:
  - Corrected autocorrelation confidence band at 2/sqrt(N) matching NIST
  - Connected-line Box-Cox Linearity and Normality plots (polyline over scatter)
  - Scale-based Youden Plot reference lines (data-driven, not hardcoded pixel math)
  - Differentiated probability-plot using uniform data vs normal-probability-plot
affects: [66-content-depth, 68-verification-audit]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Polyline injection pattern: generate scatter + inject <polyline> before </svg>"
    - "Scale-based reference lines: compute domain extents + linear interpolation for pixel positioning"

key-files:
  created: []
  modified:
    - src/lib/eda/svg-generators/line-plot.ts
    - src/lib/eda/technique-renderer.ts

key-decisions:
  - "Used 2/sqrt(N) for NIST consistency over 1.96/sqrt(N) statistical precision"
  - "Polyline injection over generateLinePlot for Box-Cox (preserves scatter dots + adds connecting line)"
  - "Uniform data on normal probability plot to show S-curve deviation for general probability-plot differentiation"

patterns-established:
  - "Polyline injection: baseSvg.replace('</svg>', polyline + '</svg>') for overlaying connected lines on scatter plots"

requirements-completed: [SVG-03, SVG-04]

# Metrics
duration: 6min
completed: 2026-02-27
---

# Phase 65 Plan 02: MEDIUM-Priority SVG Fixes Summary

**Corrected autocorrelation band to 2/sqrt(N), added polyline connections for Box-Cox plots, replaced Youden hardcoded pixel math with scale functions, and differentiated probability-plot with uniform data**

## Performance

- **Duration:** 6 min
- **Started:** 2026-02-27T18:25:29Z
- **Completed:** 2026-02-27T18:31:38Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- Autocorrelation confidence band now uses 2/sqrt(N) per NIST convention (was 1.96/sqrt(N))
- Box-Cox Linearity and Normality plots render connected lines through computed points (was discrete scatter dots)
- Youden Plot reference lines use data-driven scale functions (was hardcoded pixel math assuming 45-90 range)
- Probability Plot uses uniform data to show S-curve deviation, visually distinct from Normal Probability Plot

## Task Commits

Each task was committed atomically:

1. **Task 1: Fix autocorrelation confidence band and Box-Cox line rendering** - `672b9fb` (fix)
2. **Task 2: Fix Youden reference lines and differentiate probability-plot** - `e709c9e` (fix)

## Files Created/Modified
- `src/lib/eda/svg-generators/line-plot.ts` - Changed autocorrelation confidence band from 1.96/sqrt(N) to 2/sqrt(N) per NIST convention
- `src/lib/eda/technique-renderer.ts` - Added polyline connections for Box-Cox plots, replaced Youden hardcoded pixel math with scale-based positioning, changed probability-plot to use uniformRandom data

## Decisions Made
- Used 2/sqrt(N) over 1.96/sqrt(N): NIST e-Handbook uses the simpler approximation; the difference is negligible but values should match the source material
- Polyline injection pattern for Box-Cox: keeps scatter dots visible while adding connecting line, matching NIST convention of showing both data points and trend line
- Uniform data for probability-plot differentiation: shows the characteristic S-curve deviation on a normal probability plot, demonstrating the general-purpose diagnostic power of probability plots per NIST Section 1.3.3.22

## Deviations from Plan

None - plan executed exactly as written. Note: Box-Cox polyline changes (Fix 2 and Fix 3 from Task 1) were already applied during the 65-01 plan execution, so those edits were no-ops in this plan. The line-plot.ts autocorrelation fix, Youden scale-based reference lines, and probability-plot differentiation were the net-new changes.

## Issues Encountered
- Box-Cox polyline and 21-point lambda sweep were already committed in 65-01 (commit 59afd23). The 65-01 executor applied them proactively. Task 1 commit captured only the line-plot.ts autocorrelation fix as the net-new change.
- Pre-existing build warning for Beauty Index VS OG image module (unrelated to this plan's changes, not a regression)

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All MEDIUM-priority and LOW-priority SVG visual issues are now fixed
- Phase 65 Plan 03 (audit checklist and build verification) can proceed
- All 29 technique pages build and render correctly with 951 total pages

## Self-Check: PASSED

- [x] src/lib/eda/svg-generators/line-plot.ts exists and contains `2 / Math.sqrt`
- [x] src/lib/eda/technique-renderer.ts exists and contains `polyline`
- [x] 65-02-SUMMARY.md created
- [x] Commit 672b9fb exists (Task 1)
- [x] Commit e709c9e exists (Task 2)

---
*Phase: 65-svg-audit-fixes*
*Completed: 2026-02-27*
