---
phase: 77-semantic-best-practice-and-style-rules
plan: 02
subsystem: gha-validator
tags: [github-actions, best-practice, lint-rules, yaml-ast, vitest]

requires:
  - phase: 77-01
    provides: "Actionlint metadata rules, extended ast-helpers (forEachJobNode, forEachStepNode)"
provides:
  - "8 best practice rules (GA-B001 through GA-B008) for GHA workflow quality"
  - "bestPracticeRules barrel export array with all 8 rules"
  - "38 unit tests covering positive and negative cases"
affects: [77-03, rule-registry]

tech-stack:
  added: []
  patterns: [best-practice-rule-pattern, network-detection-regex, known-versions-map]

key-files:
  created:
    - src/lib/tools/gha-validator/rules/best-practice/GA-B001-missing-timeout.ts
    - src/lib/tools/gha-validator/rules/best-practice/GA-B002-missing-concurrency.ts
    - src/lib/tools/gha-validator/rules/best-practice/GA-B003-unnamed-step.ts
    - src/lib/tools/gha-validator/rules/best-practice/GA-B004-duplicate-step-name.ts
    - src/lib/tools/gha-validator/rules/best-practice/GA-B005-empty-env.ts
    - src/lib/tools/gha-validator/rules/best-practice/GA-B006-missing-conditional.ts
    - src/lib/tools/gha-validator/rules/best-practice/GA-B007-outdated-action.ts
    - src/lib/tools/gha-validator/rules/best-practice/GA-B008-missing-continue-on-error.ts
    - src/lib/tools/gha-validator/rules/best-practice/index.ts
    - src/lib/tools/gha-validator/rules/__tests__/best-practice-rules.test.ts
  modified: []

key-decisions:
  - "GA-B007 KNOWN_CURRENT_VERSIONS uses static map with 10 well-known actions; verified date comment for maintainability"
  - "GA-B008 network detection uses conservative regex patterns with word boundaries to avoid false positives on substrings"
  - "GA-B006 only fires on PR-only workflows with 2+ jobs -- single-job PRs excluded as too noisy"

patterns-established:
  - "Best practice rules follow same GhaLintRule interface as security rules with ast-helper imports"
  - "resolveKeyNode helper for position of YAML key itself (not value) using isPair/isScalar guards"
  - "KNOWN_CURRENT_VERSIONS map pattern for version staleness checks with date-stamped comment"

requirements-completed: [BP-01, BP-02, BP-03, BP-04, BP-05, BP-06, BP-07, BP-08]

duration: 4min
completed: 2026-03-04
---

# Phase 77 Plan 02: Best Practice Rules Summary

**8 GHA best practice rules (GA-B001--GA-B008) detecting timeout defaults, missing concurrency, unnamed steps, duplicate names, empty env, missing conditionals, outdated actions, and missing continue-on-error on network calls**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-04T15:30:08Z
- **Completed:** 2026-03-04T15:34:31Z
- **Tasks:** 2
- **Files modified:** 10

## Accomplishments
- Implemented 8 best practice rules covering workflow quality, resource waste, and maintainability
- All rules use shared ast-helpers for consistent YAML AST traversal
- 38 unit tests with positive and negative fixtures for every rule
- Barrel export provides bestPracticeRules array for rule registry integration

## Task Commits

Each task was committed atomically:

1. **Task 1: Implement GA-B001 through GA-B004 with barrel export** - `351fda8` (feat)
2. **Task 2 RED: Failing tests for all 8 rules** - `77cc23c` (test)
3. **Task 2 GREEN: Implement GA-B005 through GA-B008 with all tests passing** - `9487380` (feat)

## Files Created/Modified
- `src/lib/tools/gha-validator/rules/best-practice/GA-B001-missing-timeout.ts` - Flags jobs without timeout-minutes (default 360 min)
- `src/lib/tools/gha-validator/rules/best-practice/GA-B002-missing-concurrency.ts` - Flags workflows without concurrency group
- `src/lib/tools/gha-validator/rules/best-practice/GA-B003-unnamed-step.ts` - Flags run: steps without name: (skips uses: steps)
- `src/lib/tools/gha-validator/rules/best-practice/GA-B004-duplicate-step-name.ts` - Flags duplicate step names within same job
- `src/lib/tools/gha-validator/rules/best-practice/GA-B005-empty-env.ts` - Flags empty env blocks at all three levels
- `src/lib/tools/gha-validator/rules/best-practice/GA-B006-missing-conditional.ts` - Flags missing if: on PR-only multi-job workflows
- `src/lib/tools/gha-validator/rules/best-practice/GA-B007-outdated-action.ts` - Flags well-known actions 2+ major versions behind
- `src/lib/tools/gha-validator/rules/best-practice/GA-B008-missing-continue-on-error.ts` - Flags network steps (curl/wget/gh api) without continue-on-error
- `src/lib/tools/gha-validator/rules/best-practice/index.ts` - Barrel export of all 8 rules
- `src/lib/tools/gha-validator/rules/__tests__/best-practice-rules.test.ts` - 38 tests with positive/negative fixtures

## Decisions Made
- GA-B007 uses a static KNOWN_CURRENT_VERSIONS map with 10 well-known actions; a date-stamped comment marks when versions were last verified for maintainability
- GA-B008 network detection uses regex with word-boundary patterns to avoid false positives (e.g., "curling" won't match "curl")
- GA-B006 only fires on PR-only workflows (all triggers in pull_request/pull_request_target set) with 2+ jobs to reduce noise

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed TypeScript type error in GA-B005 resolveKeyNode**
- **Found during:** Task 2 (GA-B005 implementation)
- **Issue:** `pair.key.value` access without isPair/isScalar type guards caused TS2339 error
- **Fix:** Added `isPair(pair) && isScalar(pair.key)` guards matching ast-helpers pattern
- **Files modified:** src/lib/tools/gha-validator/rules/best-practice/GA-B005-empty-env.ts
- **Verification:** `npx tsc --noEmit` passes cleanly
- **Committed in:** 9487380 (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Minor type safety fix required for TS compilation. No scope creep.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All 8 best practice rules ready for rule registry integration
- bestPracticeRules barrel export available for Phase 77 Plan 03 (style rules)
- 145 total GHA validator tests passing (no regressions)

## Self-Check: PASSED

All 11 files verified present. All 3 commits (351fda8, 77cc23c, 9487380) verified in git log.

---
*Phase: 77-semantic-best-practice-and-style-rules*
*Completed: 2026-03-04*
