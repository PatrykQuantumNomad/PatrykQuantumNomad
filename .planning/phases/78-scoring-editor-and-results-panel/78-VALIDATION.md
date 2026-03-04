# Phase 78: Validation Architecture

**Created:** 2026-03-04
**Source:** 78-RESEARCH.md Validation Architecture section

## Test Framework

| Property | Value |
|----------|-------|
| Framework | vitest ^4.0.18 |
| Config file | `vitest.config.ts` |
| Quick run command | `npx vitest run src/lib/tools/gha-validator/__tests__/scorer.test.ts -x` |
| Full suite command | `npx vitest run src/lib/tools/gha-validator/` |

## Phase Requirements -> Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| SCORE-01 | Category weights: Schema 15%, Security 35%, Semantic 20%, BP 20%, Style 10% | unit | `npx vitest run src/lib/tools/gha-validator/__tests__/scorer.test.ts -x` | Wave 1 |
| SCORE-02 | Overall 0-100 with letter grade using diminishing returns | unit | `npx vitest run src/lib/tools/gha-validator/__tests__/scorer.test.ts -x` | Wave 1 |
| SCORE-03 | Per-category sub-scores alongside aggregate | unit | `npx vitest run src/lib/tools/gha-validator/__tests__/scorer.test.ts -x` | Wave 1 |
| SCORE-04 | SVG score gauge component | manual-only | Visual inspection of rendered gauge | N/A |
| UI-01 | CodeMirror YAML editor with syntax highlighting | manual-only | Visual inspection in browser | N/A |
| UI-02 | Analyze button + Cmd/Ctrl+Enter shortcut | manual-only | Click button and press shortcut | N/A |
| UI-03 | Pre-loaded sample workflow | unit | `npx vitest run src/lib/tools/gha-validator/__tests__/integration.test.ts -x` | Wave 1 |
| UI-04 | Inline annotations (squiggly + gutter markers) | manual-only | Visual inspection after analysis | N/A |
| UI-05 | Tabbed results panel | manual-only | Visual inspection of tabs | N/A |
| UI-06 | Click-to-navigate from results to editor line | manual-only | Click violation line number | N/A |
| UI-07 | Category-grouped violation list with expandable details | manual-only | Visual inspection | N/A |
| UI-08 | Empty state for clean workflow | manual-only | Test with clean workflow | N/A |
| UI-09 | Responsive layout | manual-only | Resize browser window | N/A |
| UI-10 | React island with client:only | manual-only | `npm run build` + verify SSR exclusion | N/A |

## Sampling Rate

- **Per task commit:** `npx vitest run src/lib/tools/gha-validator/__tests__/scorer.test.ts -x`
- **Per wave merge:** `npx vitest run src/lib/tools/gha-validator/`
- **Phase gate:** Full suite green + manual visual verification of all UI requirements

## Wave 0 Gaps

- [ ] `src/lib/tools/gha-validator/__tests__/scorer.test.ts` -- covers SCORE-01, SCORE-02, SCORE-03
- [ ] `src/lib/tools/gha-validator/__tests__/integration.test.ts` -- covers UI-03 (sample workflow triggers all categories)
