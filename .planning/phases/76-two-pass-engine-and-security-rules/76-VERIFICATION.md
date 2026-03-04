---
phase: 76-two-pass-engine-and-security-rules
verified: 2026-03-04T09:53:45Z
status: passed
score: 14/14 must-haves verified
re_verification: false
gaps: []
---

# Phase 76: Two-Pass Engine and Security Rules Verification Report

**Phase Goal:** Users get merged, deduplicated validation results from both schema and WASM passes, with all 10 security rules detecting dangerous workflow patterns
**Verified:** 2026-03-04T09:53:45Z
**Status:** passed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Pass 1 (schema + custom rules) returns results immediately while Pass 2 (WASM) loads and runs asynchronously | VERIFIED | `runPass1` in `engine.ts` is synchronous (no async/await, returns `GhaEngineResult` directly); `mergePass2` accepts already-collected `ActionlintError[]` and merges them — test confirms `result` is not a `Promise` |
| 2 | Duplicate diagnostics from both passes on the same (line, column) are merged into a single violation | VERIFIED | `mergePass2` builds an `occupied` Set keyed on `"${line}:${column}"`, skips any actionlint error whose key is already occupied; test "deduplicates: Pass 1 violation at same position takes precedence" passes |
| 3 | All violations carry a unified format with ruleId, message, line, column, severity, and category | VERIFIED | `GhaUnifiedViolation` interface in `types.ts` requires all 6 fields; `toUnified` and `mapActionlintError` both populate all 6; two tests assert every violation from `runPass1` and `mergePass2` has all required fields |
| 4 | Security rules detect unpinned actions, script injection, overly permissive permissions, pull_request_target misuse, hardcoded secrets, and self-hosted runner usage | VERIFIED | All 10 GA-C* rules implemented and tested (89 total tests, all passing): GA-C001 (unpinned semver), GA-C002 (mutable branch ref), GA-C003 (write-all permissions), GA-C004 (missing permissions), GA-C005 (script injection), GA-C006 (pull_request_target misuse), GA-C007 (hardcoded secrets), GA-C008 (third-party no SHA), GA-C009 (dangerous token combos), GA-C010 (self-hosted runners) |

**Score:** 4/4 success criteria verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/lib/tools/gha-validator/engine.ts` | runPass1, mergePass2, deduplicateViolations, mapActionlintError | VERIFIED | 225 lines; exports `runPass1`, `mergePass2`, `toUnified`, `mapActionlintError`, `GhaEngineResult`; imports from `parser`, `schema-validator`, and `types`; fully wired |
| `src/lib/tools/gha-validator/types.ts` | GhaLintRule, GhaUnifiedViolation, GhaRuleContext interfaces | VERIFIED | All 3 Phase 76 interfaces appended; Phase 75 types unchanged (`GhaSeverity`, `GhaCategory`, `GhaRuleViolation`, `ActionlintError`, etc.) |
| `src/lib/tools/gha-validator/__tests__/engine.test.ts` | Unit tests for engine functions (min 80 lines) | VERIFIED | 428 lines; 14 tests covering toUnified, mapActionlintError, runPass1 (7 cases), mergePass2 (5 cases), required-fields assertions |
| `src/stores/ghaValidatorStore.ts` | ghaViolations atom for two-pass results | VERIFIED | Exports `ghaViolations = atom<GhaUnifiedViolation[]>([])` with correct type import; all Phase 75 atoms unchanged |
| `src/lib/tools/gha-validator/rules/security/GA-C001-unpinned-action.ts` | GA-C001 rule detecting unpinned semver tags | VERIFIED | Exports `GAC001`; uses `forEachUsesNode`; SEMVER_TAG_RE and SHA_RE defined; 6 tests pass |
| `src/lib/tools/gha-validator/rules/security/GA-C002-mutable-action-tag.ts` | GA-C002 rule detecting mutable branch refs | VERIFIED | Exports `GAC002`; flags main/master/develop/dev/HEAD case-insensitively; 7 tests pass |
| `src/lib/tools/gha-validator/rules/security/GA-C003-overly-permissive-permissions.ts` | GA-C003 rule detecting write-all permissions | VERIFIED | Exports `GAC003`; checks top-level and job-level permissions; 4 tests pass |
| `src/lib/tools/gha-validator/rules/security/GA-C004-missing-permissions.ts` | GA-C004 rule detecting missing permissions block | VERIFIED | Exports `GAC004`; severity `info`; emits at line 1 col 1 when no top-level permissions key; 3 tests pass |
| `src/lib/tools/gha-validator/rules/security/GA-C005-script-injection.ts` | GA-C005 rule detecting script injection in run: blocks | VERIFIED | Exports `GAC005`; 18 dangerous contexts in `DANGEROUS_CONTEXTS`; `INJECTION_RE` built from contexts; handles multiline; 7 tests pass |
| `src/lib/tools/gha-validator/rules/security/ast-helpers.ts` | Shared AST traversal helpers | VERIFIED | Exports `resolveKey`, `forEachUsesNode`, `forEachRunNode`; skips docker:// and ./ prefixes; imports from `yaml` and `../../types` |
| `src/lib/tools/gha-validator/rules/__tests__/security-rules-1-5.test.ts` | Unit tests for GA-C001 through GA-C005 (min 120 lines) | VERIFIED | 495 lines; 34 tests all passing |
| `src/lib/tools/gha-validator/rules/security/GA-C006-pull-request-target.ts` | GA-C006 pull_request_target rule | VERIFIED | Exports `GAC006`; handles Map form and Seq list form; 8 tests pass |
| `src/lib/tools/gha-validator/rules/security/GA-C007-hardcoded-secrets.ts` | GA-C007 hardcoded secrets detection | VERIFIED | Exports `GAC007`; 9 SECRET_PATTERNS; `walkScalars` helper; skips `${{ secrets.* }}`; 5 tests pass |
| `src/lib/tools/gha-validator/rules/security/GA-C008-third-party-no-sha.ts` | GA-C008 third-party SHA pinning rule | VERIFIED | Exports `GAC008`; skips `actions/` and `github/` prefixes; SHA_RE check; 7 tests pass |
| `src/lib/tools/gha-validator/rules/security/GA-C009-dangerous-token-scopes.ts` | GA-C009 dangerous permission combinations | VERIFIED | Exports `GAC009`; DANGEROUS_COMBOS array; id-token + any-write check; top-level and job-level checks; 6 tests pass |
| `src/lib/tools/gha-validator/rules/security/GA-C010-self-hosted-runner.ts` | GA-C010 self-hosted runner detection | VERIFIED | Exports `GAC010`; severity `info`; handles scalar and Seq (array) forms; 5 tests pass |
| `src/lib/tools/gha-validator/rules/security/index.ts` | Barrel export of all 10 security rules | VERIFIED | Imports all 10 GAC* rules; exports `securityRules: GhaLintRule[]` with all 10 |
| `src/lib/tools/gha-validator/rules/index.ts` | Master rule registry exporting allGhaRules | VERIFIED | Imports `securityRules` from `./security`; exports `allGhaRules`, `allDocumentedGhaRules`, `getGhaRuleById` |
| `src/lib/tools/gha-validator/sample-workflow.ts` | SAMPLE_GHA_WORKFLOW_SECURITY constant | VERIFIED | Exports `SAMPLE_GHA_WORKFLOW_SECURITY` with violations for all 10 rules |
| `src/lib/tools/gha-validator/rules/__tests__/security-rules-6-10.test.ts` | Unit tests for GA-C006 through GA-C010 (min 100 lines) | VERIFIED | 626 lines; 37 tests all passing |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `engine.ts` | `parser.ts` | `import parseGhaWorkflow` | WIRED | Line 13: `import { parseGhaWorkflow } from './parser'`; `parseGhaWorkflow` called in `runPass1` body |
| `engine.ts` | `schema-validator.ts` | `import validateGhaSchema + categorizeSchemaErrors` | WIRED | Line 14: `import { validateGhaSchema, categorizeSchemaErrors } from './schema-validator'`; both called in `runPass1` |
| `engine.ts` | `types.ts` | `import GhaUnifiedViolation, GhaLintRule, ActionlintError` | WIRED | Lines 15-23: all required types imported; `GhaUnifiedViolation` used as return type throughout |
| `GA-C001-unpinned-action.ts` | `ast-helpers.ts` | `import forEachUsesNode` | WIRED | Line 14: `import { forEachUsesNode } from './ast-helpers'`; called in `check()` |
| `GA-C005-script-injection.ts` | `ast-helpers.ts` | `import forEachRunNode` | WIRED | Line 15: `import { forEachRunNode } from './ast-helpers'`; called in `check()` |
| `GA-C001-unpinned-action.ts` | `types.ts` | `import GhaLintRule, GhaRuleContext, GhaRuleViolation` | WIRED | Line 13: `import type { GhaLintRule, GhaRuleContext, GhaRuleViolation } from '../../types'` |
| `rules/index.ts` | `rules/security/index.ts` | `import securityRules` | WIRED | Line 10: `import { securityRules } from './security'`; spread into `allGhaRules` |
| `rules/security/index.ts` | `GA-C001-unpinned-action.ts` | `import GAC001` | WIRED | Line 8: `import { GAC001 } from './GA-C001-unpinned-action'`; included in `securityRules` array |
| `GA-C008-third-party-no-sha.ts` | `ast-helpers.ts` | `import forEachUsesNode` | WIRED | Line 17: `import { forEachUsesNode } from './ast-helpers'`; called in `check()` |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| ENGINE-01 | 76-01 | runPass1 synchronous execution | SATISFIED | `runPass1` has no async/await; test confirms it does not return a Promise |
| ENGINE-02 | 76-01 | mergePass2 deduplication on (line, column) | SATISFIED | `occupied` Set keyed on `"${line}:${column}"`; dedup test passes |
| ENGINE-03 | 76-01 | Pass 1 takes precedence over Pass 2 at same position | SATISFIED | `occupied` set built from Pass 1 violations before processing Pass 2; Pass 2 skips if key already occupied |
| ENGINE-04 | 76-01 | Unified violation format with ruleId, message, line, column, severity, category | SATISFIED | `GhaUnifiedViolation` interface defines all 6 fields; `toUnified` and `mapActionlintError` populate all 6 |
| SEC-01 | 76-02 | GA-C001 detects unpinned semver tags | SATISFIED | `SEMVER_TAG_RE = /^v\d+(\.\d+)*$/` matched against ref; skips SHAs; 6 tests pass |
| SEC-02 | 76-02 | GA-C002 detects mutable branch refs | SATISFIED | Pattern `/^(main|master|develop|dev|HEAD)$/i`; 7 tests pass |
| SEC-03 | 76-02 | GA-C003 detects write-all permissions | SATISFIED | Checks scalar value `=== 'write-all'` at top-level and job-level; 4 tests pass |
| SEC-04 | 76-02 | GA-C004 detects missing top-level permissions block | SATISFIED | `resolveKey(doc.contents, 'permissions') === null` triggers violation at line 1, col 1; 3 tests pass |
| SEC-05 | 76-02 | GA-C005 detects script injection in run: blocks | SATISFIED | 18-entry DANGEROUS_CONTEXTS list; INJECTION_RE built from them; multiline blocks handled; 7 tests pass |
| SEC-06 | 76-03 | GA-C006 detects pull_request_target without restrictions | SATISFIED | Handles Map form (checks for restriction keys) and Seq form (always flags); 8 tests pass |
| SEC-07 | 76-03 | GA-C007 detects hardcoded secrets | SATISFIED | 9 SECRET_PATTERNS; `walkScalars` recursive traversal; skips `${{ secrets.* }}`; 5 tests pass |
| SEC-08 | 76-03 | GA-C008 detects third-party actions without SHA | SATISFIED | Skips `actions/` and `github/` prefixes; requires 40-char hex SHA; 7 tests pass |
| SEC-09 | 76-03 | GA-C009 detects dangerous GITHUB_TOKEN permission combos | SATISFIED | DANGEROUS_COMBOS: contents+actions, packages+contents; id-token+any-write; top and job level; 6 tests pass |
| SEC-10 | 76-03 | GA-C010 detects self-hosted runner usage | SATISFIED | Checks scalar and Seq (array) forms; severity `info`; 5 tests pass |

### Anti-Patterns Found

No anti-patterns found. Scanned all modified files for:
- TODO/FIXME/XXX/HACK/PLACEHOLDER comments — none found
- Stub implementations (empty returns, console.log-only handlers) — none found
- Placeholder returns (return null, return {}, return []) — all rule check() methods contain substantive logic

### Human Verification Required

No human verification items identified. All behavioral contracts (detection accuracy, false positive rates, output format) are fully covered by automated tests that pass.

---

## Summary

Phase 76 goal is fully achieved. The two-pass validation engine is implemented with:

1. **Synchronous Pass 1** (`runPass1`) that runs schema validation and all 10 custom security rules and returns results immediately.

2. **Async-merge Pass 2** (`mergePass2`) that accepts WASM actionlint output and merges it with Pass 1 results, deduplicating on `(line, column)` with Pass 1 priority.

3. **Unified violation format** (`GhaUnifiedViolation`) with all 6 required fields across both passes.

4. **All 10 security rules** (GA-C001 through GA-C010) implemented, tested, and wired into the master registry via `allGhaRules`.

5. **89 tests passing** across 4 test files with no gaps, stubs, or orphaned code.

---

_Verified: 2026-03-04T09:53:45Z_
_Verifier: Claude (gsd-verifier)_
