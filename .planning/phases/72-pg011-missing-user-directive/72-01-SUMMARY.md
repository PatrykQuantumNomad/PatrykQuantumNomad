---
phase: 72-pg011-missing-user-directive
plan: 01
subsystem: dockerfile-analyzer
tags: [dockerfile, security, lint-rule, user-directive, container-security]

# Dependency graph
requires: []
provides:
  - PG011 security rule detecting missing USER directive in final Dockerfile stage
  - Vitest test infrastructure with 5 edge-case scenarios
  - Auto-generated documentation page at /tools/dockerfile-analyzer/rules/pg011/
affects: [74-site-wide-integration]

# Tech tracking
tech-stack:
  added: [vitest (config only, already installed)]
  patterns: [absence-detection rule pattern, final-stage-only scoping, FROM scratch skip]

key-files:
  created:
    - src/lib/tools/dockerfile-analyzer/rules/security/PG011-missing-user-directive.ts
    - src/lib/tools/dockerfile-analyzer/rules/security/__tests__/PG011-missing-user-directive.test.ts
    - vitest.config.ts
  modified:
    - src/lib/tools/dockerfile-analyzer/rules/index.ts

key-decisions:
  - "PG011 uses warning severity matching DL3002 convention for USER-related issues"
  - "Violation points to final FROM line (consistent with DL3057 missing-HEALTHCHECK pattern)"
  - "Non-overlap boundary: PG011 fires only when zero USER instructions exist, DL3002 handles all cases where USER is present"

patterns-established:
  - "Absence-detection rule: check for zero instructions of a type in final stage, flag on FROM line"
  - "Vitest test pattern: DockerfileParser.parse() with inline Dockerfile strings for rule unit testing"

# Metrics
duration: 3min
completed: 2026-03-02
---

# Phase 72 Plan 01: PG011 Missing USER Directive Summary

**PG011 security rule flags Dockerfiles with no USER directive in final stage, filling the gap left by DL3002 which only catches explicit USER root**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-02T17:54:59Z
- **Completed:** 2026-03-02T17:58:17Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- PG011 security rule detects missing USER directive in final Dockerfile stage with expert CIS Docker Benchmark 4.1 explanation
- Clean non-overlap boundary with DL3002: PG011 fires only when zero USER instructions exist, defers when any USER is present
- 5 edge-case test scenarios all pass: no USER triggers, USER root defers, multi-stage builder-only USER triggers, FROM scratch skips, non-root USER happy path
- Documentation page auto-generates at /tools/dockerfile-analyzer/rules/pg011/ via existing plugin architecture

## Task Commits

Each task was committed atomically:

1. **Task 1: Create PG011 rule and register in engine** - `8bec1c3` (feat)
2. **Task 2: Verify PG011 behavior against all edge cases** - `8109c3b` (test)

## Files Created/Modified
- `src/lib/tools/dockerfile-analyzer/rules/security/PG011-missing-user-directive.ts` - PG011 rule with absence-detection logic for missing USER in final stage
- `src/lib/tools/dockerfile-analyzer/rules/index.ts` - Added PG011 import and allRules entry (security count 14 -> 15)
- `src/lib/tools/dockerfile-analyzer/rules/security/__tests__/PG011-missing-user-directive.test.ts` - 5 edge-case vitest scenarios
- `vitest.config.ts` - Minimal vitest configuration for project test infrastructure

## Decisions Made
- PG011 uses warning severity matching DL3002 convention for USER-related issues (not error, which would over-penalize given official images that default to root safely)
- Violation points to the final FROM line, consistent with DL3057 (missing HEALTHCHECK) pattern for absence-detection rules
- Non-overlap boundary with DL3002: if any USER instruction exists in the final stage (even USER root), PG011 returns empty and defers entirely to DL3002

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- PG011 is fully functional and registered in the allRules array (now 45 rules total: 15 security + 30 others)
- Phase 73 (PG012 Node.js Pointer Compression) can proceed independently
- Phase 74 (Site-Wide Integration) will update all hardcoded rule counts to 46 after both PG011 and PG012 are complete

## Self-Check: PASSED

- All 5 files verified: FOUND
- Both commits verified: 8bec1c3, 8109c3b
- allRules array contains 45 entries (15 security + 30 others)
- astro build: 1008 pages, zero errors
- vitest: 5/5 tests pass

---
*Phase: 72-pg011-missing-user-directive*
*Completed: 2026-03-02*
