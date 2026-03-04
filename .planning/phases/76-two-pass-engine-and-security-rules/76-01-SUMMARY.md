---
phase: 76-two-pass-engine-and-security-rules
plan: 01
subsystem: tools
tags: [validation-engine, two-pass, deduplication, actionlint, unified-violations, nanostores]

# Dependency graph
requires:
  - phase: 75-wasm-infrastructure-and-schema-foundation
    provides: parseGhaWorkflow, validateGhaSchema, categorizeSchemaErrors, ActionlintError type, GhaRuleViolation type
provides:
  - Two-pass validation engine with runPass1 (sync) and mergePass2 (async merge)
  - GhaUnifiedViolation type with all 6 required fields (ruleId, message, line, column, severity, category)
  - GhaLintRule interface for custom rule implementations
  - GhaRuleContext interface for rule check() methods
  - Actionlint error mapping (16 kinds to GA-L001-L018 rule IDs)
  - Deduplication on (line,column) with Pass 1 priority
  - ghaViolations nanostore atom for two-pass results
affects: [76-02-security-rules, 76-03-security-rules, 77-semantic-bp-style-rules, 78-scoring-editor-results]

# Tech tracking
tech-stack:
  added: []
  patterns: [two-pass-sync-async-engine, line-column-deduplication, custom-rule-injection-via-parameter]

key-files:
  created:
    - src/lib/tools/gha-validator/engine.ts
    - src/lib/tools/gha-validator/__tests__/engine.test.ts
    - src/lib/tools/gha-validator/__tests__/types.test.ts
  modified:
    - src/lib/tools/gha-validator/types.ts
    - src/stores/ghaValidatorStore.ts

key-decisions:
  - "Custom rules injected via parameter (not imported from rules/) to avoid circular dependencies and enable testing without rules"
  - "Deduplication keys on line:column string, not ruleId -- handles cross-pass overlap correctly"
  - "runPass1 accepts optional customRules parameter defaulting to empty array, making engine independent of rule registry"

patterns-established:
  - "Two-pass engine: runPass1(rawText, customRules?) for sync, mergePass2(pass1Violations, actionlintErrors) for async merge"
  - "toUnified(violation, severity, category) converts base GhaRuleViolation to GhaUnifiedViolation"
  - "ACTIONLINT_KIND_MAP: static Record mapping actionlint error kinds to GA-L* rule IDs with severity/category"

requirements-completed: [ENGINE-01, ENGINE-02, ENGINE-03, ENGINE-04]

# Metrics
duration: 4min
completed: 2026-03-04
---

# Phase 76 Plan 01: Two-Pass Engine Summary

**Two-pass validation engine with sync runPass1 (schema + custom rules), async mergePass2 (actionlint WASM dedup), 16-kind actionlint mapping, and GhaUnifiedViolation type system**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-04T14:01:15Z
- **Completed:** 2026-03-04T14:05:39Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- Two-pass engine with runPass1 (synchronous schema + custom rules) and mergePass2 (async actionlint merge with deduplication)
- GhaUnifiedViolation, GhaLintRule, and GhaRuleContext interfaces extending Phase 75 types without modification
- Complete actionlint error mapping: 16 kinds to GA-L001-L018 rule IDs with severity/category, GA-L000 fallback
- 22 passing tests across engine and types test files (18 engine + 4 types)
- ghaViolations nanostore atom for merged two-pass violation results

## Task Commits

Each task was committed atomically (TDD: test -> feat):

1. **Task 1: Type extensions and store atom**
   - `efd8ed0` (test): Failing tests for Phase 76 type extensions
   - `dcde723` (feat): GhaUnifiedViolation, GhaLintRule, GhaRuleContext types and ghaViolations atom
2. **Task 2: Engine with runPass1, mergePass2, and tests**
   - `19a0c62` (test): Failing tests for two-pass engine
   - `f73d6e5` (feat): Two-pass validation engine implementation

## Files Created/Modified
- `src/lib/tools/gha-validator/engine.ts` - Two-pass validation engine: runPass1, mergePass2, toUnified, mapActionlintError, ACTIONLINT_KIND_MAP
- `src/lib/tools/gha-validator/__tests__/engine.test.ts` - 18 tests covering conversion, mapping, pass 1, pass 2, dedup, sorting, required fields (428 lines)
- `src/lib/tools/gha-validator/__tests__/types.test.ts` - 4 tests for type extensions and ghaViolations atom
- `src/lib/tools/gha-validator/types.ts` - Extended with GhaUnifiedViolation, GhaLintRule, GhaRuleContext interfaces (Phase 75 types unchanged)
- `src/stores/ghaValidatorStore.ts` - Added ghaViolations atom for two-pass violation results

## Decisions Made
- Custom rules injected via `customRules` parameter to runPass1 instead of importing from `rules/` directory -- avoids circular dependencies and enables testing without any rules existing
- Deduplication uses `${line}:${column}` string key, not ruleId -- this correctly handles cross-pass overlap where different rule IDs flag the same code position
- runPass1 defaults customRules to empty array, making engine.ts completely independent of which rules exist (Phase 76 plans 02-03 create rules)
- GhaRuleContext uses `import('yaml').Document` type-only import to avoid adding yaml as a direct dependency of the types file

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Engine ready for Phase 76 plans 02-03 to create security rules conforming to GhaLintRule interface
- runPass1 accepts custom rules via parameter, so security rules just need to be passed in at call site
- mergePass2 ready for Phase 78 UI integration (call with pass1 violations + actionlint Worker results)
- All Phase 75 types and exports unchanged -- no downstream breakage

## Self-Check: PASSED

- All 5 created/modified files exist on disk
- All 4 task commits found in git log (efd8ed0, dcde723, 19a0c62, f73d6e5)
- GhaUnifiedViolation, GhaLintRule, GhaRuleContext exported from types.ts
- ghaViolations exported from ghaValidatorStore.ts
- runPass1, mergePass2 exported from engine.ts
- Engine tests: 428 lines (min 80 required)
- 22 tests passing, 0 TypeScript errors

---
*Phase: 76-two-pass-engine-and-security-rules*
*Completed: 2026-03-04*
