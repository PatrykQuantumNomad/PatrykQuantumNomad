---
phase: 67-technical-depth
plan: 01
subsystem: eda
tags: [katex, python, matplotlib, scipy, statsmodels, formulas, time-series, combined-diagnostic]

requires:
  - phase: 64-infrastructure-foundation
    provides: TechniqueContent interface with formulas/pythonCode fields, per-category module structure
  - phase: 66-content-depth
    provides: Populated technique content entries with questions, importance, definitionExpanded, examples, caseStudySlugs
provides:
  - KaTeX formulas for 5 techniques (autocorrelation, spectral, ppcc, weibull, 4-plot)
  - Python code examples for 8 techniques across time-series and combined-diagnostic categories
affects: [67-02, 67-03, 68-verification]

tech-stack:
  added: []
  patterns: [String.raw for KaTeX tex values, np.random.default_rng(42) for reproducibility, scipy.stats.probplot for probability plots]

key-files:
  created: []
  modified:
    - src/lib/eda/technique-content/time-series.ts
    - src/lib/eda/technique-content/combined-diagnostic.ts

key-decisions:
  - "Used Tukey-Lambda quantile function with seeded RNG for PPCC example (avoids scipy.stats.rvs random_state parameter)"
  - "4-plot formula uses LaTeX bmatrix notation to represent the 2x2 diagnostic grid as a formal ensemble definition"

patterns-established:
  - "pythonCode examples: all use np.random.default_rng(42), generate own sample data, include all imports"
  - "formulas: all tex values use String.raw template literals to prevent backslash escaping"
  - "Weibull data generation via ppf(rng.uniform()) instead of rvs() to keep seeded RNG consistent"

requirements-completed: [DEFN-02, PYTH-01, PYTH-02, PYTH-03, PYTH-04]

duration: 5min
completed: 2026-02-27
---

# Phase 67 Plan 01: Time-Series and Combined-Diagnostic Formulas + Python Code Summary

**KaTeX formulas (5 techniques, 10 entries) and self-contained Python examples (8 techniques) added to time-series.ts and combined-diagnostic.ts**

## Performance

- **Duration:** 5 min
- **Started:** 2026-02-27T20:14:09Z
- **Completed:** 2026-02-27T20:19:57Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- Added 3 KaTeX formulas to autocorrelation-plot (autocovariance, R_h coefficient, 2/sqrt(N) significance bounds per Phase 65 NIST decision)
- Added 2 KaTeX formulas to spectral-plot (PSD periodogram, frequency range to Nyquist)
- Added 2 KaTeX formulas to ppcc-plot (PPCC correlation, optimal lambda argmax)
- Added 2 KaTeX formulas to weibull-plot (CDF linearization, Benard's plotting position)
- Added 1 KaTeX formula to 4-plot (2x2 diagnostic ensemble definition using bmatrix)
- Added 5 Python code examples to time-series techniques (statsmodels plot_acf, scipy periodogram, scipy hilbert, manual lag scatter, run chart with mean line)
- Added 3 Python code examples to combined-diagnostic techniques (scipy ppcc_plot, scipy probplot with weibull_min, 2x2 subplot 4-plot grid)

## Task Commits

Each task was committed atomically:

1. **Task 1: Add formulas and pythonCode to 5 time-series techniques** - `23d0d99` (feat)
2. **Task 2: Add formulas and pythonCode to 3 combined-diagnostic techniques** - `fb43b52` (feat)

## Files Created/Modified
- `src/lib/eda/technique-content/time-series.ts` - Added formulas (autocorrelation, spectral) and pythonCode (all 5 techniques)
- `src/lib/eda/technique-content/combined-diagnostic.ts` - Added formulas (ppcc, weibull, 4-plot) and pythonCode (all 3 techniques)

## Decisions Made
- Used Tukey-Lambda quantile function (`ppf`) with seeded uniform RNG for PPCC example instead of `rvs()` with `random_state=` to maintain consistency with the `np.random.default_rng(42)` pattern
- 4-plot formula uses LaTeX `bmatrix` notation to represent the 2x2 diagnostic grid as a formal ensemble definition, matching the NIST description of the technique as a composite

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed PPCC pythonCode using deprecated random_state pattern**
- **Found during:** Task 2 (PPCC plot example)
- **Issue:** Initial draft used `scipy.stats.tukey_lambda.rvs(-0.5, size=200, random_state=None)` which conflicts with the no-`random_state=` rule
- **Fix:** Rewrote to use `tukey_lambda.ppf(rng.uniform(...))` for data generation with seeded RNG
- **Files modified:** src/lib/eda/technique-content/combined-diagnostic.ts
- **Verification:** grep confirmed zero `random_state=` matches
- **Committed in:** fb43b52 (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Essential for correctness -- avoided deprecated API pattern. No scope creep.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Time-series and combined-diagnostic categories complete with formulas + Python code
- Ready for 67-02 (distribution-shape techniques: 9 more pythonCode + formulas)
- Pattern established: String.raw for tex, default_rng(42) for data, ppf() for distribution sampling

## Self-Check: PASSED

- FOUND: src/lib/eda/technique-content/time-series.ts
- FOUND: src/lib/eda/technique-content/combined-diagnostic.ts
- FOUND: .planning/phases/67-technical-depth/67-01-SUMMARY.md
- FOUND: commit 23d0d99
- FOUND: commit fb43b52

---
*Phase: 67-technical-depth*
*Completed: 2026-02-27*
