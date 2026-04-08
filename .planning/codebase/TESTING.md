# Testing

## Framework

- **Vitest 4.0** — test runner
- **Config:** `vitest.config.ts` — includes `src/**/*.test.ts`
- **No browser testing** — all tests are unit/integration tests running in Node

## Test Organization

Tests live in `__tests__/` directories co-located with source:

```
src/lib/eda/notebooks/__tests__/          # 11 test files — notebook generation
src/lib/tools/gha-validator/__tests__/    # 5 test files — GHA validation engine
src/lib/tools/gha-validator/rules/__tests__/ # 7 test files — GHA rule sets
src/lib/tools/dockerfile-analyzer/rules/*/__tests__/ # 2 test files — Dockerfile rules
src/lib/ai-landscape/__tests__/           # 8 test files — graph data, tours, schema
src/lib/guides/__tests__/                 # 3 test files — guide routes, schema, helpers
src/lib/guides/svg-diagrams/__tests__/    # 8 test files — SVG diagram generators
src/lib/guides/interactive-data/__tests__/ # 2 test files — interactive data
src/integrations/__tests__/               # 1 test file — notebook packager
```

**Total: 47 test files**

## Test Patterns

### Data-driven Tests
```typescript
it.each([...cases])('description %s', (input, expected) => { ... })
```
Used extensively in rule tests and schema validation.

### Factory Helpers
Test files create fixtures with helper functions rather than importing shared test utilities.

### Lifecycle Hooks
- `beforeAll` / `afterAll` for expensive setup (file reads, schema compilation)
- `beforeEach` for per-test state reset

### Mock-free Philosophy
Tests use real implementations rather than mocks. Validation engines, parsers, and scorers are tested against actual input data.

## Coverage Landscape

### Well-tested Areas
- EDA notebook generation (`src/lib/eda/notebooks/`) — 11 test files
- GHA validator engine + rules — 12 test files
- AI landscape data model — 8 test files
- Guide SVG diagrams — 8 test files

### Untested Areas
- **React components** (77 `.tsx` files) — 0 component tests
- **Astro components** (100 `.astro` files) — 0 tests
- **EDA SVG generators** (22 generators in `src/lib/eda/svg-generators/`) — 0 tests
- **Compose validator rules** (`src/lib/tools/compose-validator/rules/`) — 0 tests
- **K8s analyzer rules** (`src/lib/tools/k8s-analyzer/rules/`) — 0 tests
- **EDA math functions** (`src/lib/eda/math/`) — 0 tests
- **OG image generation** (`src/lib/og-image.ts`, 3,879 lines) — 0 tests
- **Beauty index scoring** (`src/lib/beauty-index/`) — 0 tests
- **DB compass logic** (`src/lib/db-compass/`) — 0 tests

## Running Tests

```bash
npx vitest          # Watch mode
npx vitest run      # Single run
```
