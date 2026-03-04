---
phase: 76-two-pass-engine-and-security-rules
plan: 02
subsystem: tools
tags: [security-rules, action-pinning, script-injection, permissions, yaml-ast, supply-chain]

# Dependency graph
requires:
  - phase: 76-two-pass-engine-and-security-rules
    provides: GhaLintRule interface, GhaRuleContext interface, GhaRuleViolation type, getNodeLine from parser.ts
provides:
  - GA-C001 rule detecting unpinned semver action tags
  - GA-C002 rule detecting mutable branch refs (main/master/develop/dev/HEAD)
  - GA-C003 rule detecting write-all permissions at workflow and job level
  - GA-C004 rule detecting missing top-level permissions block
  - GA-C005 rule detecting script injection from 17 dangerous GitHub contexts
  - Shared AST helpers (resolveKey, forEachUsesNode, forEachRunNode) for security rules
  - 31 passing unit tests covering all 5 rules
affects: [76-03-security-rules-6-10, 77-semantic-bp-style-rules, 78-scoring-editor-results, 80-rule-documentation-pages]

# Tech tracking
tech-stack:
  added: []
  patterns: [forEachUsesNode-traversal, forEachRunNode-traversal, resolveKey-yaml-map, dangerous-context-regex-builder]

key-files:
  created:
    - src/lib/tools/gha-validator/rules/security/ast-helpers.ts
    - src/lib/tools/gha-validator/rules/security/GA-C001-unpinned-action.ts
    - src/lib/tools/gha-validator/rules/security/GA-C002-mutable-action-tag.ts
    - src/lib/tools/gha-validator/rules/security/GA-C003-overly-permissive-permissions.ts
    - src/lib/tools/gha-validator/rules/security/GA-C004-missing-permissions.ts
    - src/lib/tools/gha-validator/rules/security/GA-C005-script-injection.ts
    - src/lib/tools/gha-validator/rules/__tests__/security-rules-1-5.test.ts
  modified: []

key-decisions:
  - "forEachUsesNode/forEachRunNode shared in ast-helpers.ts -- avoids duplicating YAML traversal logic across rules"
  - "GA-C004 uses severity info (not warning) since missing permissions is informational, not a definite vulnerability"
  - "GA-C005 builds regex dynamically from 17 DANGEROUS_CONTEXTS array -- easy to extend when new dangerous contexts discovered"
  - "GA-C003 checks both top-level and job-level permissions for write-all"

patterns-established:
  - "Security rule pattern: import ast-helpers + getNodeLine, export single GhaLintRule object with check() method"
  - "forEachUsesNode skips docker:// and ./ prefixed actions automatically"
  - "forEachRunNode handles multiline run: | blocks via String(node.value)"
  - "INJECTION_RE built from DANGEROUS_CONTEXTS array with dot-escaping and wildcard replacement"

requirements-completed: [SEC-01, SEC-02, SEC-03, SEC-04, SEC-05]

# Metrics
duration: 3min
completed: 2026-03-04
---

# Phase 76 Plan 02: Security Rules 1-5 Summary

**5 security rules (GA-C001--C005) detecting action pinning, write-all permissions, missing permissions, and script injection from 17 dangerous GitHub contexts, with shared AST traversal helpers**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-04T14:35:48Z
- **Completed:** 2026-03-04T14:39:11Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments
- Shared AST helpers (resolveKey, forEachUsesNode, forEachRunNode) eliminating traversal duplication across rules
- 5 security rules implementing GhaLintRule interface with id, title, severity, category, explanation, fix, and check()
- GA-C001/C002 address supply-chain attack vector (tj-actions March 2025) by detecting unpinned semver tags and mutable branch refs
- GA-C005 detects all 17 dangerous GitHub context expressions in run: blocks (including multiline run: | blocks)
- 31 passing unit tests with zero false positives on clean workflow fixtures

## Task Commits

Each task was committed atomically (TDD: test -> feat):

1. **Task 1: Shared AST helpers**
   - `9dacf44` (feat): resolveKey, forEachUsesNode, forEachRunNode
2. **Task 2: Security rules GA-C001 through GA-C005 with tests**
   - `1d4b70c` (test): Failing tests for all 5 security rules
   - `81faa2b` (feat): All 5 rule implementations passing 31 tests

## Files Created/Modified
- `src/lib/tools/gha-validator/rules/security/ast-helpers.ts` - Shared YAML AST traversal: resolveKey, forEachUsesNode (skips docker/local), forEachRunNode (handles multiline)
- `src/lib/tools/gha-validator/rules/security/GA-C001-unpinned-action.ts` - Detects semver tags (@v4) without SHA pinning
- `src/lib/tools/gha-validator/rules/security/GA-C002-mutable-action-tag.ts` - Detects mutable branch refs (@main, @master, @develop, @dev, @HEAD)
- `src/lib/tools/gha-validator/rules/security/GA-C003-overly-permissive-permissions.ts` - Detects write-all at workflow and job level
- `src/lib/tools/gha-validator/rules/security/GA-C004-missing-permissions.ts` - Detects missing top-level permissions block (severity: info)
- `src/lib/tools/gha-validator/rules/security/GA-C005-script-injection.ts` - Detects 17 dangerous GitHub context expressions in run: blocks
- `src/lib/tools/gha-validator/rules/__tests__/security-rules-1-5.test.ts` - 31 tests: interface checks, violation scenarios, clean workflow scenarios (495 lines)

## Decisions Made
- AST traversal helpers shared in `ast-helpers.ts` rather than duplicated in each rule -- follows DRY and enables reuse by GA-C006-C010 in plan 03
- GA-C004 uses `info` severity (not `warning`) because missing permissions is a best-practice reminder, not a confirmed vulnerability
- GA-C005 regex built dynamically from a `DANGEROUS_CONTEXTS` array (17 entries) with dot-escaping and wildcard replacement -- easy to extend
- GA-C003 checks both top-level and per-job permissions blocks for `write-all` string

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- 5 security rules ready to be registered in rule index (Phase 76 plan 03)
- AST helpers (forEachUsesNode, forEachRunNode, resolveKey) available for GA-C006-C010 rules
- All rules conform to GhaLintRule interface -- can be passed to runPass1(rawText, customRules)
- No new dependencies added -- all using existing yaml library AST utilities

## Self-Check: PASSED

- All 7 created files exist on disk
- All 3 task commits found in git log (9dacf44, 1d4b70c, 81faa2b)
- Test file: 495 lines (min 120 required)
- 31 tests passing, 0 TypeScript errors
- GAC001-GAC005 exported from respective files
- resolveKey, forEachUsesNode, forEachRunNode exported from ast-helpers.ts

---
*Phase: 76-two-pass-engine-and-security-rules*
*Completed: 2026-03-04*
