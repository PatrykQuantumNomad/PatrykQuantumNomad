---
phase: 50-svg-generator-library
plan: 02
subsystem: svg-generation
tags: [d3-scale, d3-shape, d3-array, svg, typescript, scatter, line-plot, lag-plot, probability-plot, spectral-plot, star-plot, fft, regression, radar]

requires:
  - phase: 50-svg-generator-library
    provides: plot-base.ts shared SVG foundation and statistics.ts math module
provides:
  - scatter plot SVG generator with optional regression line and confidence band
  - line plot SVG generator for run-sequence, autocorrelation, and time-series modes
  - lag plot SVG generator for autocorrelation pattern detection
  - probability plot SVG generator for normal, Q-Q, Weibull, and PPCC types
  - spectral plot SVG generator with FFT-based power spectral density
  - star/radar plot SVG generator reusing polarToCartesian from radar-math.ts
affects: [50-03-PLAN, 51-graphical-technique-pages, 53-distribution-pages]

tech-stack:
  added: []
  patterns: [scatter with OLS regression and confidence band, lollipop ACF plot with significance bounds, Blom plotting position for probability plots, Tukey-Lambda PPCC shape parameter sweep, polar coordinate star/radar reuse from radar-math]

key-files:
  created:
    - src/lib/eda/svg-generators/scatter-plot.ts
    - src/lib/eda/svg-generators/line-plot.ts
    - src/lib/eda/svg-generators/lag-plot.ts
    - src/lib/eda/svg-generators/probability-plot.ts
    - src/lib/eda/svg-generators/spectral-plot.ts
    - src/lib/eda/svg-generators/star-plot.ts
  modified: []

key-decisions:
  - "Scatter confidence band uses pointwise 1.96*SE*sqrt(leverage) for 95% interval, rendered as a polygon path (no d3-shape area dependency for this)"
  - "Autocorrelation plot uses lollipop style (line + circle) instead of filled bars for cleaner appearance at variable lag counts"
  - "Probability plot PPCC mode uses Tukey-Lambda quantile function Q(p)=(p^r-(1-p)^r)/r for shape parameter sweep"
  - "Star plot uses custom viewBox with 40px padding to accommodate axis labels, similar to radar-math.ts pattern"
  - "Spectral plot dynamically selects log vs linear Y scale based on max/min PSD ratio (>100 triggers log scale)"

patterns-established:
  - "Multi-mode generator pattern: single export function with mode/type discriminator dispatching to private render functions"
  - "Shared domain pattern for lag plots: both axes use identical domain for square aspect ratio"
  - "Guard clause consistency: all generators return placeholder SVG with 'Insufficient data' text for small inputs"

requirements-completed: [SVG-04, SVG-05, SVG-06, SVG-09, SVG-14, SVG-15]

duration: 4min
completed: 2026-02-25
---

# Phase 50 Plan 02: XY-Coordinate SVG Generators Summary

**Six SVG generators (scatter, line, lag, probability, spectral, star) producing publication-quality charts from NIST data using plot-base foundation, with regression lines, ACF lollipops, FFT spectra, and polar radar reuse**

## Performance

- **Duration:** 4 min
- **Started:** 2026-02-25T01:25:26Z
- **Completed:** 2026-02-25T01:29:43Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments
- Created scatter-plot.ts with optional OLS regression line (R-squared annotation) and 95% confidence band using linearRegression from statistics.ts
- Created line-plot.ts with 3 modes: run-sequence (mean reference), autocorrelation (lollipop bars + significance bounds at 1.96/sqrt(n)), and time-series
- Created lag-plot.ts showing Y(i) vs Y(i+k) with diagonal reference line and shared domain for square aspect
- Created probability-plot.ts supporting 4 types: normal probability (Blom formula), Q-Q (mean+sd reference line), Weibull (ln-ln transform), PPCC (Tukey-Lambda shape sweep with maximum highlight)
- Created spectral-plot.ts using powerSpectrum FFT with adaptive log/linear Y scale and area fill under PSD curve
- Created star-plot.ts reusing polarToCartesian from radar-math.ts with concentric grid rings, axis labels, and configurable fill

## Task Commits

Each task was committed atomically:

1. **Task 1: Create scatter plot, line plot, and lag plot SVG generators** - `862a5c5` (feat)
2. **Task 2: Create probability plot, spectral plot, and star plot SVG generators** - `4f9fcfd` (feat)

## Files Created/Modified
- `src/lib/eda/svg-generators/scatter-plot.ts` - Scatter plot with optional regression and confidence band (SVG-04)
- `src/lib/eda/svg-generators/line-plot.ts` - Line plot for run-sequence, ACF, and time-series modes (SVG-05)
- `src/lib/eda/svg-generators/lag-plot.ts` - Lag scatter plot for autocorrelation pattern detection (SVG-15)
- `src/lib/eda/svg-generators/probability-plot.ts` - Normal, Q-Q, Weibull, PPCC probability plots (SVG-06)
- `src/lib/eda/svg-generators/spectral-plot.ts` - FFT power spectrum with adaptive scale (SVG-14)
- `src/lib/eda/svg-generators/star-plot.ts` - Star/radar plot reusing polarToCartesian (SVG-09)

## Decisions Made
- Scatter confidence band rendered as polygon path with pointwise leverage-based standard error (no d3-shape area dependency needed)
- Autocorrelation uses lollipop style (line+circle) for cleaner rendering across variable lag counts
- PPCC mode sweeps Tukey-Lambda shape parameters r=[0.5,5.0] step 0.1, highlighting maximum correlation
- Star plot extends viewBox by 40px padding to prevent axis label clipping
- Spectral plot auto-selects log Y scale when PSD dynamic range exceeds 100:1

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All 6 XY-coordinate generators are ready for import by Phase 51 (graphical technique pages)
- Pattern established: multi-mode generators use private render functions dispatched by type/mode option
- Plan 50-03 (contour, distribution curve, and composite generators) can now build on all 9 generators from Plans 01+02

## Self-Check: PASSED

All 6 created files verified present on disk. Both task commits (862a5c5, 4f9fcfd) verified in git log.

---
*Phase: 50-svg-generator-library*
*Completed: 2026-02-25*
