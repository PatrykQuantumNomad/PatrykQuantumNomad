---
phase: 53-distribution-pages-with-d3-explorers
plan: 01
subsystem: math
tags: [distributions, pdf, cdf, svg, d3, nist, pure-math, regularized-beta, tukey-lambda]

# Dependency graph
requires:
  - phase: 50-svg-generator-library
    provides: plot-base.ts, distribution-curve.ts (original 6-distribution version)
  - phase: 49-data-model-schema-population
    provides: distributions.json with 19 distribution definitions and parameter schemas
provides:
  - "distribution-math.ts: evalDistribution(), getXDomain(), isDiscrete() for all 19 NIST distributions"
  - "distribution-curve.ts: SVG generation for all 19 distributions including discrete bar-stems"
affects: [53-02 (DistributionExplorer React island), 53-03 (distribution page routing)]

# Tech tracking
tech-stack:
  added: []
  patterns: [regularizedBeta Lentz CF, modified Lentz for lowerIncompleteGammaRatio, Tukey-Lambda Newton inversion, log-space discrete PMF]

key-files:
  created: [src/lib/eda/math/distribution-math.ts]
  modified: [src/lib/eda/svg-generators/distribution-curve.ts]

key-decisions:
  - "Gamma distribution uses scale parameterization (mean=alpha*beta) matching distributions.json, not rate parameterization from original distribution-curve.ts"
  - "Fixed lowerIncompleteGammaRatio CF branch: original Lentz initialization was buggy for x >= a+1, replaced with modified Lentz (c=1e30, ai=-i*(i-a))"
  - "Tukey-Lambda PDF computed via Newton inversion of quantile function + 1/Q'(F), handles lambda=0 as logistic"
  - "Discrete distributions render as bar-stem PMF (line+circle) and step CDF (curveStepAfter)"

patterns-established:
  - "Pure-math module pattern: distribution-math.ts has zero DOM/D3 imports, safe for both build-time and client-side React island use"
  - "evalDistribution dispatch: single function with string ID matching JSON id field for all 19 distributions"

requirements-completed: [DIST-18]

# Metrics
duration: 7min
completed: 2026-02-25
---

# Phase 53 Plan 01: Distribution Math Module Summary

**Pure-math evalDistribution() covering all 19 NIST distributions with regularizedBeta, Tukey-Lambda Newton inversion, and discrete bar-stem SVG rendering**

## Performance

- **Duration:** 7 min
- **Started:** 2026-02-25T12:16:06Z
- **Completed:** 2026-02-25T12:22:46Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- Created distribution-math.ts with evalDistribution(), getXDomain(), isDiscrete() for all 19 NIST distributions
- Implemented regularizedBeta (Lentz CF) for beta and F-distribution CDFs
- Refactored distribution-curve.ts from 6-distribution inline math to 19-distribution delegated architecture
- Added discrete distribution rendering: bar-stem PMF with line+circle elements, step CDF with curveStepAfter

## Task Commits

Each task was committed atomically:

1. **Task 1: Create distribution-math.ts with all 19 PDF/CDF implementations** - `00eb540` (feat)
2. **Task 2: Refactor distribution-curve.ts to use distribution-math.ts** - `1650ae1` (refactor)

## Files Created/Modified
- `src/lib/eda/math/distribution-math.ts` - Pure-math module: 19 distributions, evalDistribution dispatch, getXDomain, isDiscrete, regularizedBeta, lowerIncompleteGammaRatio
- `src/lib/eda/svg-generators/distribution-curve.ts` - Refactored SVG generator: imports from distribution-math.ts, discrete bar-stem rendering, label map for all 19 distributions

## Decisions Made
- Gamma distribution uses scale parameterization (mean=alpha*beta) matching distributions.json, rather than the rate parameterization (mean=alpha/beta) used in the original distribution-curve.ts
- Fixed lowerIncompleteGammaRatio continued fraction branch: the original Lentz initialization (c=1e-30, f=d) produced divergent results for x >= a+1; replaced with modified Lentz algorithm (c=1e30 initial, ai=-i*(i-a) recurrence)
- Tukey-Lambda PDF computed via Newton inversion of quantile function Q(F) to find F, then f(x)=1/Q'(F); lambda=0 special-cased as logistic distribution
- Discrete distributions (binomial, poisson) render bar-stem PMF plots with line+circle SVG elements and step-function CDFs with d3-shape curveStepAfter

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed lowerIncompleteGammaRatio continued fraction divergence**
- **Found during:** Task 1 (distribution-math.ts creation)
- **Issue:** The continued fraction branch (x >= a+1) used incorrect Lentz initialization copied from the original distribution-curve.ts. When c=1e-30, the first iteration produces c=bn+an/c which is ~1e30, causing the CF to diverge to astronomically wrong values. Chi-square and gamma CDFs returned -3.4e28 instead of values in [0,1].
- **Fix:** Rewrote CF to use modified Lentz algorithm: c starts at 1e30, ai uses -i*(i-a) recurrence, b increments by 2 each step, with TINY guards on both c and d.
- **Files modified:** src/lib/eda/math/distribution-math.ts
- **Verification:** All 19 distributions produce valid CDF values in [0, 1.01] at domain midpoint
- **Committed in:** 00eb540 (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 bug fix)
**Impact on plan:** Bug fix was essential for chi-square and gamma CDF correctness. The original distribution-curve.ts had the same bug but it was masked because those distributions were rarely evaluated at large x values in the old 6-distribution setup. No scope creep.

## Issues Encountered
None beyond the CF bug documented above.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- distribution-math.ts is ready to be imported by DistributionExplorer.tsx (Plan 02) as the shared math source
- distribution-curve.ts can generate static SVG fallbacks for all 19 distribution pages
- Build passes with 912 pages, no regressions

---
*Phase: 53-distribution-pages-with-d3-explorers*
*Completed: 2026-02-25*
