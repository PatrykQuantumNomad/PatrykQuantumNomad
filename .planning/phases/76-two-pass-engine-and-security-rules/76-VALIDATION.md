# Phase 76: Two-Pass Engine and Security Rules - Validation

**Source:** 76-RESEARCH.md, Validation Architecture section

## Test Files

### Unit Tests

| Test File | Covers | Command |
|-----------|--------|---------|
| `src/lib/tools/gha-validator/__tests__/engine.test.ts` | ENGINE-01, ENGINE-02, ENGINE-03, ENGINE-04 | `npx vitest run src/lib/tools/gha-validator/__tests__/engine.test.ts -x` |
| `src/lib/tools/gha-validator/rules/__tests__/security-rules-1-5.test.ts` | SEC-01, SEC-02, SEC-03, SEC-04, SEC-05 | `npx vitest run src/lib/tools/gha-validator/rules/__tests__/security-rules-1-5.test.ts -x` |
| `src/lib/tools/gha-validator/rules/__tests__/security-rules-6-10.test.ts` | SEC-06, SEC-07, SEC-08, SEC-09, SEC-10 | `npx vitest run src/lib/tools/gha-validator/rules/__tests__/security-rules-6-10.test.ts -x` |

### Requirement Coverage

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| ENGINE-01 | runPass1 returns sync results, mergePass2 accepts async results | unit | `npx vitest run src/lib/tools/gha-validator/__tests__/engine.test.ts -x` | Wave 0 |
| ENGINE-02 | Dedup suppresses duplicate (line,col) findings from both passes | unit | `npx vitest run src/lib/tools/gha-validator/__tests__/engine.test.ts -x` | Wave 0 |
| ENGINE-03 | Pass 1 results returned immediately (sync function returns) | unit | `npx vitest run src/lib/tools/gha-validator/__tests__/engine.test.ts -x` | Wave 0 |
| ENGINE-04 | All violations have ruleId, message, line, column, severity, category | unit | `npx vitest run src/lib/tools/gha-validator/__tests__/engine.test.ts -x` | Wave 0 |
| SEC-01 | GA-C001 flags unpinned semver tags on uses: | unit | `npx vitest run src/lib/tools/gha-validator/rules/__tests__/security-rules-1-5.test.ts -x` | Wave 0 |
| SEC-02 | GA-C002 flags mutable branch refs on uses: | unit | `npx vitest run src/lib/tools/gha-validator/rules/__tests__/security-rules-1-5.test.ts -x` | Wave 0 |
| SEC-03 | GA-C003 flags write-all permissions | unit | `npx vitest run src/lib/tools/gha-validator/rules/__tests__/security-rules-1-5.test.ts -x` | Wave 0 |
| SEC-04 | GA-C004 flags missing permissions block | unit | `npx vitest run src/lib/tools/gha-validator/rules/__tests__/security-rules-1-5.test.ts -x` | Wave 0 |
| SEC-05 | GA-C005 flags script injection in run: blocks | unit | `npx vitest run src/lib/tools/gha-validator/rules/__tests__/security-rules-1-5.test.ts -x` | Wave 0 |
| SEC-06 | GA-C006 flags pull_request_target without restrictions | unit | `npx vitest run src/lib/tools/gha-validator/rules/__tests__/security-rules-6-10.test.ts -x` | Wave 0 |
| SEC-07 | GA-C007 flags hardcoded secrets | unit | `npx vitest run src/lib/tools/gha-validator/rules/__tests__/security-rules-6-10.test.ts -x` | Wave 0 |
| SEC-08 | GA-C008 flags third-party actions without SHA pinning | unit | `npx vitest run src/lib/tools/gha-validator/rules/__tests__/security-rules-6-10.test.ts -x` | Wave 0 |
| SEC-09 | GA-C009 flags dangerous combined token scopes | unit | `npx vitest run src/lib/tools/gha-validator/rules/__tests__/security-rules-6-10.test.ts -x` | Wave 0 |
| SEC-10 | GA-C010 flags self-hosted runner usage | unit | `npx vitest run src/lib/tools/gha-validator/rules/__tests__/security-rules-6-10.test.ts -x` | Wave 0 |

### Test Fixtures

- Workflow YAML strings with deliberate security violations for all 10 rules (inline in test files)
- `SAMPLE_GHA_WORKFLOW_SECURITY` constant in `sample-workflow.ts` (integration test corpus)

### Sampling Rate

- **Per task commit:** `npx vitest run --reporter=verbose`
- **Per wave merge:** `npx vitest run`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `src/lib/tools/gha-validator/__tests__/engine.test.ts` -- covers ENGINE-01 through ENGINE-04
- [ ] `src/lib/tools/gha-validator/rules/__tests__/security-rules-1-5.test.ts` -- covers SEC-01 through SEC-05
- [ ] `src/lib/tools/gha-validator/rules/__tests__/security-rules-6-10.test.ts` -- covers SEC-06 through SEC-10
