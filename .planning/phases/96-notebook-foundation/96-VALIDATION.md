# Phase 96: Notebook Foundation - Validation

**Created:** 2026-03-14
**Source:** 96-RESEARCH.md Validation Architecture section

## Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 4.x |
| Config file | vitest.config.ts |
| Quick run command | `npx vitest run src/lib/eda/notebooks/` |
| Full suite command | `npx vitest run` |

## Phase Requirements to Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| NBGEN-01 | createNotebook() produces valid nbformat v4.5 JSON with correct top-level fields | unit | `npx vitest run src/lib/eda/notebooks/__tests__/notebook.test.ts -x` | Wave 1 |
| NBGEN-01 | Cell IDs are deterministic (same input = same output) | unit | `npx vitest run src/lib/eda/notebooks/__tests__/cells.test.ts -x` | Wave 1 |
| NBGEN-01 | Cell IDs match pattern `^[a-zA-Z0-9-_]+$` and are 1-64 chars | unit | `npx vitest run src/lib/eda/notebooks/__tests__/cells.test.ts -x` | Wave 1 |
| NBGEN-02 | markdownCell() returns object with id, cell_type='markdown', metadata, source | unit | `npx vitest run src/lib/eda/notebooks/__tests__/cells.test.ts -x` | Wave 1 |
| NBGEN-02 | codeCell() returns object with id, cell_type='code', metadata, source, outputs=[], execution_count=null | unit | `npx vitest run src/lib/eda/notebooks/__tests__/cells.test.ts -x` | Wave 1 |
| NBGEN-02 | Source lines are newline-terminated (except last) | unit | `npx vitest run src/lib/eda/notebooks/__tests__/cells.test.ts -x` | Wave 1 |
| NBGEN-03 | Registry exports configs for all 10 case study slugs | unit | `npx vitest run src/lib/eda/notebooks/__tests__/registry.test.ts -x` | Wave 1 |
| NBGEN-03 | Each config has required fields: slug, dataFile, skipRows, expectedRows, columns | unit | `npx vitest run src/lib/eda/notebooks/__tests__/registry.test.ts -x` | Wave 1 |
| NBGEN-04 | REQUIREMENTS_TXT contains numpy, scipy, pandas, matplotlib, seaborn with >= pins | unit | `npx vitest run src/lib/eda/notebooks/__tests__/requirements.test.ts -x` | Wave 1 |

## Sampling Rate

- **Per task commit:** `npx vitest run src/lib/eda/notebooks/`
- **Per wave merge:** `npx vitest run`
- **Phase gate:** Full suite green before `/gsd:verify-work`

## Wave 0 Gaps

All tests are created as part of Wave 1 plans (TDD approach — tests written first):
- [ ] `src/lib/eda/notebooks/__tests__/cells.test.ts` -- covers NBGEN-01, NBGEN-02
- [ ] `src/lib/eda/notebooks/__tests__/notebook.test.ts` -- covers NBGEN-01
- [ ] `src/lib/eda/notebooks/__tests__/registry.test.ts` -- covers NBGEN-03
- [ ] `src/lib/eda/notebooks/__tests__/requirements.test.ts` -- covers NBGEN-04
