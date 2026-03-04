---
phase: 76-two-pass-engine-and-security-rules
plan: 03
subsystem: tools
tags: [security-rules, rule-registry, sample-workflow, pull-request-target, hardcoded-secrets, third-party-pinning, token-scopes, self-hosted-runner]

# Dependency graph
requires:
  - phase: 76-two-pass-engine-and-security-rules
    provides: GhaLintRule interface, GhaRuleContext interface, ast-helpers (resolveKey, forEachUsesNode, forEachRunNode), GA-C001 through GA-C005
provides:
  - GA-C006 rule detecting unrestricted pull_request_target triggers
  - GA-C007 rule detecting 9 hardcoded secret patterns (ghp_, github_pat_, gho_, ghs_, ghr_, AKIA, sk-, xoxb-, SG.)
  - GA-C008 rule detecting third-party actions not pinned to 40-char SHA
  - GA-C009 rule detecting dangerous GITHUB_TOKEN permission combinations
  - GA-C010 rule detecting self-hosted runner usage (informational)
  - securityRules barrel array with all 10 security rules
  - allGhaRules master registry with 10 rules plus getGhaRuleById lookup
  - SAMPLE_GHA_WORKFLOW_SECURITY constant with violations for all 10 rules
affects: [77-semantic-bp-style-rules, 78-scoring-editor-results, 80-rule-documentation-pages]

# Tech tracking
tech-stack:
  added: []
  patterns: [walkScalars-recursive-yaml-traversal, getWriteScopes-permission-extraction, dangerous-combo-pair-matching]

key-files:
  created:
    - src/lib/tools/gha-validator/rules/security/GA-C006-pull-request-target.ts
    - src/lib/tools/gha-validator/rules/security/GA-C007-hardcoded-secrets.ts
    - src/lib/tools/gha-validator/rules/security/GA-C008-third-party-no-sha.ts
    - src/lib/tools/gha-validator/rules/security/GA-C009-dangerous-token-scopes.ts
    - src/lib/tools/gha-validator/rules/security/GA-C010-self-hosted-runner.ts
    - src/lib/tools/gha-validator/rules/security/index.ts
    - src/lib/tools/gha-validator/rules/index.ts
    - src/lib/tools/gha-validator/rules/__tests__/security-rules-6-10.test.ts
  modified:
    - src/lib/tools/gha-validator/sample-workflow.ts

key-decisions:
  - "GA-C006 handles both map form (on: {pull_request_target:}) and list form (on: [pull_request_target]) with correct null-value detection via yaml Scalar node"
  - "GA-C007 uses walkScalars recursive helper to traverse all YAML values, not just env: blocks -- catches secrets anywhere in the document"
  - "GA-C008 distinguishes first-party (actions/, github/) from third-party by prefix check, complementing GA-C001 semver-only focus"
  - "GA-C009 checks 3 dangerous combo patterns: contents+actions, packages+contents, id-token+any -- opinionated but documented"
  - "GA-C010 uses info severity (not warning) since self-hosted runners are a valid pattern"
  - "Rule registry uses spread operator for category arrays to allow future category additions without modifying the registry"

patterns-established:
  - "walkScalars(node, lineCounter, callback) for recursive YAML scalar traversal across Maps, Seqs, and Pairs"
  - "getWriteScopes(permsNode) extracts Set<string> of scopes with write value from permissions Map"
  - "checkPermsNode() shared function for checking permissions at both workflow and job level"
  - "FIRST_PARTY_PREFIXES array for distinguishing first-party vs third-party actions"

requirements-completed: [SEC-06, SEC-07, SEC-08, SEC-09, SEC-10]

# Metrics
duration: 6min
completed: 2026-03-04
---

# Phase 76 Plan 03: Security Rules 6-10 and Registry Summary

**5 security rules (GA-C006--C010) for pull_request_target, hardcoded secrets, third-party SHA pinning, dangerous scope combos, and self-hosted runners, plus 10-rule registry and security sample workflow**

## Performance

- **Duration:** 6 min
- **Started:** 2026-03-04T14:43:16Z
- **Completed:** 2026-03-04T14:49:27Z
- **Tasks:** 2
- **Files created/modified:** 9

## Accomplishments
- 5 security rules completing the full GA-C001--C010 set, each implementing GhaLintRule interface
- GA-C006 detects unrestricted pull_request_target in both map and list forms, including YAML null values
- GA-C007 detects 9 hardcoded secret patterns using recursive YAML scalar traversal with secrets reference exclusion
- GA-C008 flags third-party actions (non-actions/, non-github/) without 40-char SHA pinning
- GA-C009 flags 3 dangerous permission combination patterns at both workflow and job level
- GA-C010 detects self-hosted runners in scalar and array runs-on values (informational severity)
- Master rule registry (allGhaRules) with all 10 security rules and getGhaRuleById lookup
- SAMPLE_GHA_WORKFLOW_SECURITY with deliberate violations for all 10 security rules
- 89 passing tests across all 4 test files (engine + types + security 1-5 + security 6-10)

## Task Commits

Each task was committed atomically (TDD: test -> feat for Task 1):

1. **Task 1: Security rules GA-C006 through GA-C010 with tests**
   - `fc3f035` (test): Failing tests for security rules GA-C006 through GA-C010
   - `404abf0` (feat): Implement security rules GA-C006 through GA-C010
2. **Task 2: Rule registry, security barrel, and security sample workflow**
   - `cc366d8` (feat): Rule registry, security barrel, and SAMPLE_GHA_WORKFLOW_SECURITY

## Files Created/Modified
- `src/lib/tools/gha-validator/rules/security/GA-C006-pull-request-target.ts` - Detects unrestricted pull_request_target (map+list forms, null value handling)
- `src/lib/tools/gha-validator/rules/security/GA-C007-hardcoded-secrets.ts` - Detects 9 secret patterns via recursive walkScalars, skips ${{ secrets.* }}
- `src/lib/tools/gha-validator/rules/security/GA-C008-third-party-no-sha.ts` - Flags non-first-party actions without 40-char SHA pinning
- `src/lib/tools/gha-validator/rules/security/GA-C009-dangerous-token-scopes.ts` - Flags 3 dangerous permission combos at workflow+job level
- `src/lib/tools/gha-validator/rules/security/GA-C010-self-hosted-runner.ts` - Flags self-hosted runners in scalar and array runs-on (severity: info)
- `src/lib/tools/gha-validator/rules/security/index.ts` - Barrel export: securityRules array with all 10 security rules
- `src/lib/tools/gha-validator/rules/index.ts` - Master registry: allGhaRules, allDocumentedGhaRules, getGhaRuleById
- `src/lib/tools/gha-validator/rules/__tests__/security-rules-6-10.test.ts` - 36 tests covering all 5 rules (626 lines)
- `src/lib/tools/gha-validator/sample-workflow.ts` - Added SAMPLE_GHA_WORKFLOW_SECURITY with violations for all 10 rules

## Decisions Made
- GA-C006 handles YAML null values (Scalar with null) from `pull_request_target:` (no value) correctly via isScalar check instead of `=== null`
- GA-C007 uses recursive walkScalars traversal of entire YAML document (not just env: blocks) to catch secrets in any position
- GA-C008 uses `FIRST_PARTY_PREFIXES = ['actions/', 'github/']` prefix matching, complementing GA-C001's semver-only scope
- GA-C009 treats id-token:write + any-other-write as dangerous (opinionated, documented in rule explanation)
- GA-C010 uses info severity since self-hosted runners are a valid and common pattern
- Registry uses spread operator (`...securityRules`) to allow future category additions without modifying the registry file

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed GA-C006 null value detection**
- **Found during:** Task 1 GREEN phase
- **Issue:** YAML library returns Scalar{value: null} for `pull_request_target:` (no value), not JavaScript null. Initial code path for `prtNode === null` was never reached.
- **Fix:** Simplified logic to handle null-valued Scalar in the else branch of isMap check
- **Files modified:** GA-C006-pull-request-target.ts
- **Commit:** 404abf0

**2. [Rule 1 - Bug] Fixed OpenAI key test pattern length**
- **Found during:** Task 1 GREEN phase
- **Issue:** Test fixture had 47 chars after `sk-` but regex requires 48 chars
- **Fix:** Added one more character to the test value
- **Files modified:** security-rules-6-10.test.ts
- **Commit:** 404abf0

**3. [Rule 3 - Blocking] Fixed template literal escaping in sample-workflow.ts**
- **Found during:** Task 2
- **Issue:** Edit tool introduced escaped backticks in template literal, causing esbuild syntax errors
- **Fix:** Rewrote entire file with correct escaping
- **Files modified:** sample-workflow.ts
- **Commit:** cc366d8

## Issues Encountered

None beyond the auto-fixed deviations above.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- All 10 security rules registered in allGhaRules -- ready for Phase 77 to add semantic, best-practice, and style rules
- allDocumentedGhaRules ready for Phase 80 rule documentation page generation
- getGhaRuleById utility available for rule lookup in UI and documentation
- SAMPLE_GHA_WORKFLOW_SECURITY available as test corpus for Phase 77 deduplication overlap mapping
- Engine's runPass1 can be called with allGhaRules directly (or via the rules/ import)

## Self-Check: PASSED

- All 9 created/modified files exist on disk
- All 3 task commits found in git log (fc3f035, 404abf0, cc366d8)
- Test file: 626 lines (min 120 required)
- 89 tests passing across 4 test files, 0 TypeScript errors
- GAC006-GAC010 exported from respective files
- securityRules array has 10 entries
- allGhaRules array has 10 entries
- SAMPLE_GHA_WORKFLOW_SECURITY parses as valid YAML

---
*Phase: 76-two-pass-engine-and-security-rules*
*Completed: 2026-03-04*
