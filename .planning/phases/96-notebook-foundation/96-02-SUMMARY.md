---
phase: 96-notebook-foundation
plan: 02
subsystem: notebook-generation
tags: [typescript, eda, jupyter, nbformat, registry, matplotlib, seaborn]

requires:
  - phase: none
    provides: standalone registry and shared Python code templates
provides:
  - CaseStudyConfig type and 10 per-study config files mapping slugs to NIST .DAT metadata
  - CASE_STUDY_REGISTRY lookup map with getCaseStudyConfig() and ALL_CASE_STUDY_SLUGS
  - REQUIREMENTS_TXT template string with floor-pinned Python scientific packages
  - THEME_SETUP_CODE and DEPENDENCY_CHECK_CODE Python source line arrays
  - QUANTUM_COLORS and QUANTUM_PALETTE TypeScript color constants
affects: [97-eda-notebooks, 100-notebook-generation, notebook-templates]

tech-stack:
  added: []
  patterns:
    - "Per-study config files: one TypeScript config per case study for clean diffs"
    - "Python code as string arrays: THEME_SETUP_CODE and DEPENDENCY_CHECK_CODE as string[] for codeCell factory"
    - "Floor version pins in requirements.txt for educational notebooks"

key-files:
  created:
    - src/lib/eda/notebooks/registry/types.ts
    - src/lib/eda/notebooks/registry/index.ts
    - src/lib/eda/notebooks/registry/normal-random-numbers.ts
    - src/lib/eda/notebooks/registry/uniform-random-numbers.ts
    - src/lib/eda/notebooks/registry/heat-flow-meter.ts
    - src/lib/eda/notebooks/registry/filter-transmittance.ts
    - src/lib/eda/notebooks/registry/cryothermometry.ts
    - src/lib/eda/notebooks/registry/fatigue-life.ts
    - src/lib/eda/notebooks/registry/standard-resistor.ts
    - src/lib/eda/notebooks/registry/beam-deflections.ts
    - src/lib/eda/notebooks/registry/random-walk.ts
    - src/lib/eda/notebooks/registry/ceramic-strength.ts
    - src/lib/eda/notebooks/requirements.ts
    - src/lib/eda/notebooks/theme.ts
    - src/lib/eda/notebooks/__tests__/registry.test.ts
    - src/lib/eda/notebooks/__tests__/requirements.test.ts
  modified: []

key-decisions:
  - "Expected statistics sourced from existing MDX case study pages with NIST-verified values"
  - "THEME_SETUP_CODE and DEPENDENCY_CHECK_CODE exported as string[] (array of Python source lines) for direct use with codeCell factory"
  - "Ceramic strength column names use short labels (Run, Lab, Bar, etc.) matching NIST JAHANMI2.DAT header convention"

patterns-established:
  - "Per-study config pattern: each case study has its own TypeScript file exporting a typed CaseStudyConfig"
  - "Python code templates as string arrays: theme and dependency setup code stored as string[] for notebook cell generation"

requirements-completed: [NBGEN-03, NBGEN-04]

duration: 5min
completed: 2026-03-14
---

# Phase 96 Plan 02: Case Study Registry and Shared Python Templates Summary

**10 per-study registry configs with NIST-verified statistics, floor-pinned requirements.txt template, and Quantum Explorer dark theme for matplotlib/seaborn**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-14T20:11:57Z
- **Completed:** 2026-03-14T20:17:55Z
- **Tasks:** 2
- **Files created:** 16

## Accomplishments
- Registry maps all 10 case study slugs to NIST .DAT file metadata with verified expected statistics
- Each config includes slug, dataFile, skipRows, expectedRows, columns, responseVariable, expectedStats, plotTitles, githubRawUrl
- REQUIREMENTS_TXT provides 5 floor-pinned Python packages (numpy, scipy, pandas, matplotlib, seaborn)
- THEME_SETUP_CODE generates matplotlib/seaborn configuration matching Quantum Explorer dark theme
- DEPENDENCY_CHECK_CODE provides try/except import with !pip install fallback for Colab/local environments

## Task Commits

Each task was committed atomically (TDD red-green pattern):

1. **Task 1: Create case study registry with 10 config files and tests**
   - `7765d81` (test): add failing tests for case study registry
   - `55c6907` (feat): implement case study registry with 10 config files
2. **Task 2: Create requirements.txt template and dark theme module with tests**
   - `8f5169a` (test): add failing tests for requirements.txt and theme modules
   - `10c7367` (feat): implement requirements.txt template and dark theme module

## Files Created/Modified
- `src/lib/eda/notebooks/registry/types.ts` - CaseStudyConfig interface with optional modelParams, doeFactors, valuesPerLine
- `src/lib/eda/notebooks/registry/index.ts` - CASE_STUDY_REGISTRY map, getCaseStudyConfig(), ALL_CASE_STUDY_SLUGS, re-exports type
- `src/lib/eda/notebooks/registry/normal-random-numbers.ts` - RANDN.DAT config (N=500, mean=-0.0029, stdDev=1.0210)
- `src/lib/eda/notebooks/registry/uniform-random-numbers.ts` - RANDU.DAT config (N=500, mean=0.5078, stdDev=0.2943)
- `src/lib/eda/notebooks/registry/heat-flow-meter.ts` - ZARR13.DAT config (N=195, mean=9.261460, stdDev=0.022789)
- `src/lib/eda/notebooks/registry/filter-transmittance.ts` - MAVRO.DAT config (N=50, mean=2.0019, stdDev=0.0004)
- `src/lib/eda/notebooks/registry/cryothermometry.ts` - SOULEN.DAT config (N=700, mean=2898.562, stdDev=1.305)
- `src/lib/eda/notebooks/registry/fatigue-life.ts` - BIRNSAUN.DAT config (N=101, mean=1401, stdDev=389)
- `src/lib/eda/notebooks/registry/standard-resistor.ts` - DZIUBA1.DAT config (N=1000, 4 columns: Month, Day, Year, Resistance)
- `src/lib/eda/notebooks/registry/beam-deflections.ts` - LEW.DAT config (N=200, modelParams: sinusoidal)
- `src/lib/eda/notebooks/registry/random-walk.ts` - RANDWALK.DAT config (N=500, modelParams: ar1)
- `src/lib/eda/notebooks/registry/ceramic-strength.ts` - JAHANMI2.DAT config (N=480, skipRows=50, 15 columns, 4 DOE factors)
- `src/lib/eda/notebooks/requirements.ts` - Floor-pinned requirements.txt template (5 packages)
- `src/lib/eda/notebooks/theme.ts` - QUANTUM_COLORS, QUANTUM_PALETTE, THEME_SETUP_CODE, DEPENDENCY_CHECK_CODE
- `src/lib/eda/notebooks/__tests__/registry.test.ts` - 24 registry tests
- `src/lib/eda/notebooks/__tests__/requirements.test.ts` - 19 requirements/theme tests

## Decisions Made
- Expected statistics sourced from existing MDX case study pages (NIST-verified values from the project's own content)
- THEME_SETUP_CODE and DEPENDENCY_CHECK_CODE exported as string[] arrays for direct use with the codeCell factory from Plan 01
- Ceramic strength column names use short labels (Run, Lab, Bar, Set, Y, X1-X4, Trt, SetOf15, Rep, CLabCode, Batch, Set2) matching the NIST JAHANMI2.DAT convention

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Registry complete with all 10 case studies mapped to NIST datasets
- Requirements.txt and theme modules ready for notebook cell generation
- Phase 96 complete (both plans executed), ready for phase 97 (EDA notebook templates)

## Self-Check: PASSED

All 16 created files verified on disk. All 4 task commits (7765d81, 55c6907, 8f5169a, 10c7367) verified in git log.

---
*Phase: 96-notebook-foundation*
*Completed: 2026-03-14*
