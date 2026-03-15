---
phase: 99-download-ui-and-colab-integration
plan: 01
subsystem: notebooks
tags: [jupyter, ipynb, nbformat, colab, tsx]

# Dependency graph
requires:
  - phase: 97-standard-case-study-notebooks
    provides: buildStandardNotebook function and STANDARD_SLUGS constant
  - phase: 98-packaging-pipeline
    provides: 1-space JSON indent serialization convention
provides:
  - 7 committed .ipynb files at notebooks/eda/ for Colab GitHub URL access
  - Repeatable generation script at scripts/generate-notebooks.ts
  - Validation test suite for committed notebook integrity
affects: [99-02-PLAN, 100-advanced-case-study-notebooks]

# Tech tracking
tech-stack:
  added: [tsx]
  patterns: [deterministic notebook generation, committed .ipynb for Colab]

key-files:
  created:
    - scripts/generate-notebooks.ts
    - notebooks/eda/normal-random-numbers.ipynb
    - notebooks/eda/uniform-random-numbers.ipynb
    - notebooks/eda/heat-flow-meter.ipynb
    - notebooks/eda/filter-transmittance.ipynb
    - notebooks/eda/cryothermometry.ipynb
    - notebooks/eda/fatigue-life.ipynb
    - notebooks/eda/standard-resistor.ipynb
    - src/lib/eda/notebooks/__tests__/committed-notebooks.test.ts
  modified:
    - package.json
    - package-lock.json

key-decisions:
  - "Used tsx dev dependency for TypeScript script execution (node --import tsx) instead of npx tsx due to npm cache issues"
  - "1-space JSON indent with trailing newline for notebook serialization (consistent with Phase 98 packager)"

patterns-established:
  - "node --import tsx for running TypeScript scripts in scripts/ directory"
  - "notebooks/eda/{slug}.ipynb naming convention for committed notebooks"

requirements-completed: [UI-03]

# Metrics
duration: 4min
completed: 2026-03-15
---

# Phase 99 Plan 01: Committed Notebooks for Colab Summary

**7 standard .ipynb notebooks generated via TypeScript and committed to notebooks/eda/ for Google Colab GitHub URL access**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-15T00:11:08Z
- **Completed:** 2026-03-15T00:16:06Z
- **Tasks:** 1 (TDD: RED-GREEN)
- **Files modified:** 10

## Accomplishments
- Generated 7 valid nbformat v4.5 notebooks from buildStandardNotebook via scripts/generate-notebooks.ts
- Each notebook committed to notebooks/eda/ enabling Colab's colab.research.google.com/github/... URL scheme
- 29 validation tests confirming JSON validity, nbformat version, non-empty cells, and Python 3 kernelspec
- Generation is deterministic -- re-running produces byte-identical output

## Task Commits

Each task was committed atomically (TDD RED-GREEN):

1. **Task 1 (RED): Failing validation tests** - `ba201a6` (test)
2. **Task 1 (GREEN): Generation script + 7 notebooks + tsx dependency** - `b67ffce` (feat)

**Plan metadata:** `908cc71` (docs: complete plan)

## Files Created/Modified
- `scripts/generate-notebooks.ts` - Notebook generation script importing buildStandardNotebook and STANDARD_SLUGS
- `notebooks/eda/normal-random-numbers.ipynb` - Normal Random Numbers case study notebook
- `notebooks/eda/uniform-random-numbers.ipynb` - Uniform Random Numbers case study notebook
- `notebooks/eda/heat-flow-meter.ipynb` - Heat Flow Meter case study notebook
- `notebooks/eda/filter-transmittance.ipynb` - Filter Transmittance case study notebook
- `notebooks/eda/cryothermometry.ipynb` - Cryothermometry case study notebook
- `notebooks/eda/fatigue-life.ipynb` - Fatigue Life case study notebook
- `notebooks/eda/standard-resistor.ipynb` - Standard Resistor case study notebook
- `src/lib/eda/notebooks/__tests__/committed-notebooks.test.ts` - 29 validation tests for committed notebooks
- `package.json` - Added tsx dev dependency
- `package-lock.json` - Lock file updated

## Decisions Made
- Used `node --import tsx` instead of `npx tsx` for script execution due to npm cache permission issues in the environment; tsx installed as dev dependency
- Kept 1-space JSON indentation consistent with Phase 98 packager serialization convention

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Installed tsx dev dependency**
- **Found during:** Task 1 (GREEN phase - running generation script)
- **Issue:** `npx tsx` failed due to npm cache permission errors; tsx not installed as project dependency
- **Fix:** Installed tsx as dev dependency (`npm install --save-dev tsx`), used `node --import tsx` invocation
- **Files modified:** package.json, package-lock.json
- **Verification:** Script runs successfully, notebooks generated
- **Committed in:** b67ffce (Task 1 GREEN commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** tsx installation was necessary for TypeScript script execution. No scope creep.

## Issues Encountered
- Pre-existing test failure in `src/lib/eda/notebooks/__tests__/notebook-packager.test.ts` due to missing `handbook/datasets/` directory in worktree (RANDN.DAT not available). This is unrelated to our changes and exists in the main branch as well.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- 7 committed notebooks ready for Colab URL integration in Plan 02
- Plan 02 (NotebookActions component) can now reference notebooks/eda/{slug}.ipynb paths
- Phase 100 (Advanced Notebooks) will add 3 more notebooks to this directory

## Self-Check: PASSED

All 9 key files verified on disk. Both commit hashes (ba201a6, b67ffce) confirmed in git log.

---
*Phase: 99-download-ui-and-colab-integration*
*Completed: 2026-03-15*
