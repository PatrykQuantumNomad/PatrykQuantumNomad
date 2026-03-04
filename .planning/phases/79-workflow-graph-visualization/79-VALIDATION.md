# Phase 79: Validation Architecture

**Created:** 2026-03-04
**Source:** 79-RESEARCH.md Validation Architecture section

## Test Framework

| Property | Value |
|----------|-------|
| Framework | vitest 4.0.18 |
| Config file | `vitest.config.ts` |
| Quick run command | `npx vitest run src/lib/tools/gha-validator/__tests__/gha-graph-data-extractor.test.ts` |
| Full suite command | `npx vitest run src/lib/tools/gha-validator/` |

## Phase Requirements -> Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| GRAPH-01 | Three node types extracted from workflow JSON | unit | `npx vitest run src/lib/tools/gha-validator/__tests__/gha-graph-data-extractor.test.ts -x` | Wave 0 |
| GRAPH-02 | Job dependency edges from needs: with cycle detection | unit | `npx vitest run src/lib/tools/gha-validator/__tests__/gha-graph-data-extractor.test.ts -x` | Wave 0 |
| GRAPH-03 | Trigger-to-job edges from on: events | unit | `npx vitest run src/lib/tools/gha-validator/__tests__/gha-graph-data-extractor.test.ts -x` | Wave 0 |
| GRAPH-04 | Steps as sequential nodes within job containers | unit + manual | Unit test verifies parentJobId and stepIndex; manual verifies visual nesting | Wave 0 |
| GRAPH-05 | Color-coded nodes by violation status | unit + manual | Unit test verifies violationStatus computation; manual verifies colors | Wave 0 |
| GRAPH-06 | React.lazy loading (separate chunk) | manual-only | `npm run build` and verify chunk splitting in dist output | N/A |
| GRAPH-07 | dagre LR layout with grouped dependency levels | manual-only | Visual inspection of layout direction and grouping | N/A |

## Sampling Rate

- **Per task commit:** `npx vitest run src/lib/tools/gha-validator/__tests__/gha-graph-data-extractor.test.ts -x`
- **Per wave merge:** `npx vitest run src/lib/tools/gha-validator/`
- **Phase gate:** Full suite green + manual visual verification of graph rendering, layout direction, node types, and color coding

## Wave 0 Gaps

- [ ] `src/lib/tools/gha-validator/__tests__/gha-graph-data-extractor.test.ts` -- covers GRAPH-01, GRAPH-02, GRAPH-03, GRAPH-04, GRAPH-05
- Framework and test infrastructure already in place (vitest.config.ts, existing test files in `__tests__/`)
