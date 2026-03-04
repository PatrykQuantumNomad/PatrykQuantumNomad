# Phase 77: Validation Architecture

**Created:** 2026-03-04
**Source:** 77-RESEARCH.md Validation Architecture section

## Test Framework

| Property | Value |
|----------|-------|
| Framework | vitest ^4.0.18 |
| Config file | `vitest.config.ts` |
| Quick run command | `npx vitest run --reporter=verbose` |
| Full suite command | `npx vitest run` |

## Phase Requirements -> Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| SEM-01 | 18 actionlint kinds mapped to GA-L001-L018 | unit | `npx vitest run src/lib/tools/gha-validator/__tests__/engine.test.ts -x` | Exists (update) |
| SEM-02 | Each kind assigned correct category | unit | `npx vitest run src/lib/tools/gha-validator/__tests__/engine.test.ts -x` | Exists (update) |
| SEM-03 | GA-L017/GA-L018 documented as unavailable | unit | `npx vitest run src/lib/tools/gha-validator/rules/__tests__/semantic-rules.test.ts -x` | Wave 1 |
| SEM-04 | Enriched explanations and fix suggestions | unit | `npx vitest run src/lib/tools/gha-validator/rules/__tests__/semantic-rules.test.ts -x` | Wave 1 |
| BP-01 | GA-B001 flags missing timeout-minutes | unit | `npx vitest run src/lib/tools/gha-validator/rules/__tests__/best-practice-rules.test.ts -x` | Wave 2 |
| BP-02 | GA-B002 flags missing concurrency | unit | `npx vitest run src/lib/tools/gha-validator/rules/__tests__/best-practice-rules.test.ts -x` | Wave 2 |
| BP-03 | GA-B003 flags unnamed run: steps | unit | `npx vitest run src/lib/tools/gha-validator/rules/__tests__/best-practice-rules.test.ts -x` | Wave 2 |
| BP-04 | GA-B004 flags duplicate step names | unit | `npx vitest run src/lib/tools/gha-validator/rules/__tests__/best-practice-rules.test.ts -x` | Wave 2 |
| BP-05 | GA-B005 flags empty env blocks | unit | `npx vitest run src/lib/tools/gha-validator/rules/__tests__/best-practice-rules.test.ts -x` | Wave 2 |
| BP-06 | GA-B006 flags jobs without conditional on PR workflows | unit | `npx vitest run src/lib/tools/gha-validator/rules/__tests__/best-practice-rules.test.ts -x` | Wave 2 |
| BP-07 | GA-B007 flags outdated action versions | unit | `npx vitest run src/lib/tools/gha-validator/rules/__tests__/best-practice-rules.test.ts -x` | Wave 2 |
| BP-08 | GA-B008 flags missing continue-on-error | unit | `npx vitest run src/lib/tools/gha-validator/rules/__tests__/best-practice-rules.test.ts -x` | Wave 2 |
| STYLE-01 | GA-F001 flags non-alphabetical jobs | unit | `npx vitest run src/lib/tools/gha-validator/rules/__tests__/style-rules.test.ts -x` | Wave 3 |
| STYLE-02 | GA-F002 flags inconsistent uses: quoting | unit | `npx vitest run src/lib/tools/gha-validator/rules/__tests__/style-rules.test.ts -x` | Wave 3 |
| STYLE-03 | GA-F003 flags step names > 80 chars | unit | `npx vitest run src/lib/tools/gha-validator/rules/__tests__/style-rules.test.ts -x` | Wave 3 |
| STYLE-04 | GA-F004 flags missing workflow name | unit | `npx vitest run src/lib/tools/gha-validator/rules/__tests__/style-rules.test.ts -x` | Wave 3 |

## Sampling Rate

- **Per task commit:** `npx vitest run --reporter=verbose`
- **Per wave merge:** `npx vitest run`
- **Phase gate:** Full suite green before `/gsd:verify-work`

## Wave 0 Gaps

- [ ] `src/lib/tools/gha-validator/rules/__tests__/semantic-rules.test.ts` -- covers SEM-03, SEM-04
- [ ] `src/lib/tools/gha-validator/rules/__tests__/best-practice-rules.test.ts` -- covers BP-01 through BP-08
- [ ] `src/lib/tools/gha-validator/rules/__tests__/style-rules.test.ts` -- covers STYLE-01 through STYLE-04
- [ ] Update `src/lib/tools/gha-validator/__tests__/engine.test.ts` -- covers SEM-01, SEM-02
