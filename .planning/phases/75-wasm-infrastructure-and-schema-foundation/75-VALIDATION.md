# Phase 75: WASM Infrastructure and Schema Foundation - Validation

**Source:** 75-RESEARCH.md, Validation Architecture section (Wave 0 Gaps)

## Test Files

### Unit Tests

| Test File | Covers | Command |
|-----------|--------|---------|
| `src/lib/tools/gha-validator/__tests__/schema-validator.test.ts` | SCHEMA-02 | `npx vitest run src/lib/tools/gha-validator/__tests__/schema-validator.test.ts -x` |
| `src/lib/tools/gha-validator/__tests__/schema-rules.test.ts` | SCHEMA-03, SCHEMA-04 | `npx vitest run src/lib/tools/gha-validator/__tests__/schema-rules.test.ts -x` |
| `src/lib/tools/gha-validator/worker/__tests__/worker-client.test.ts` | WASM-05 | `npx vitest run src/lib/tools/gha-validator/worker/__tests__/worker-client.test.ts -x` |

### Prerequisites

- Schema compile script must run before schema tests: `node scripts/compile-gha-schema.mjs`

### Requirement Coverage

| Req ID | Validation Method | Automated? |
|--------|-------------------|------------|
| WASM-01 | Smoke test: `ls public/wasm/actionlint.wasm` | Yes (file check) |
| WASM-02 | Manual: open browser console, check Worker initialization | No (browser-only) |
| WASM-03 | Manual: `window.__ghaWorker.analyze(badYaml)` in console | No (requires WASM runtime) |
| WASM-04 | Manual: throttle network in DevTools, observe UI | No (visual) |
| WASM-05 | Unit test: `worker-client.test.ts` | Yes |
| SCHEMA-01 | Smoke test: `node scripts/compile-gha-schema.mjs && ls src/lib/tools/gha-validator/validate-gha.js` | Yes (build script) |
| SCHEMA-02 | Unit test: `schema-validator.test.ts` | Yes |
| SCHEMA-03 | Unit test: `schema-rules.test.ts` | Yes |
| SCHEMA-04 | Unit test: `schema-rules.test.ts` | Yes |

### Sampling Rate

- **Per task commit:** `npx vitest run --reporter=verbose`
- **Per wave merge:** `npx vitest run`
- **Phase gate:** Full suite green + manual browser console verification
