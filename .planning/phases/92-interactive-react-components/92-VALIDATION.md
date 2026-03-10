# Phase 92: Interactive React Components - Validation

**Created:** 2026-03-10
**Source:** 92-RESEARCH.md Validation Architecture section

## Test Framework

| Property | Value |
|----------|-------|
| Framework | vitest ^4.0.18 |
| Config file | vitest.config.ts |
| Quick run command | `npx vitest run src/lib/guides/interactive-data/__tests__/ --reporter=verbose` |
| Full suite command | `npx vitest run --reporter=verbose` |

## Phase Requirements to Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| INTV-01 | Permission flow data has correct node structure, edge connections, and detail content | unit | `npx vitest run src/lib/guides/interactive-data/__tests__/permission-flow-data.test.ts -x` | Wave 0 |
| INTV-02 | Hook event data has all 18 events, correct categories, and payload descriptions | unit | `npx vitest run src/lib/guides/interactive-data/__tests__/hook-event-data.test.ts -x` | Wave 0 |
| INTV-01 | Permission flow explorer renders in Astro build (no build errors) | smoke | `npx astro build 2>&1 \| tail -5` | N/A (build test) |
| INTV-02 | Hook event visualizer renders in Astro build (no build errors) | smoke | `npx astro build 2>&1 \| tail -5` | N/A (build test) |
| INTV-01+02 | Components use client:visible directive (verified in MDX source) | manual-only | Verify MDX import uses `client:visible` directive | N/A |

## Sampling Rate

- **Per task commit:** `npx vitest run src/lib/guides/interactive-data/__tests__/ --reporter=verbose`
- **Per wave merge:** `npx vitest run --reporter=verbose`
- **Phase gate:** Full suite green + production build succeeds before `/gsd:verify-work`

## Wave 0 Gaps

- [ ] `src/lib/guides/interactive-data/__tests__/permission-flow-data.test.ts` -- covers INTV-01 data integrity
- [ ] `src/lib/guides/interactive-data/__tests__/hook-event-data.test.ts` -- covers INTV-02 data integrity
- [ ] `src/lib/guides/interactive-data/` directory -- needs to be created

No framework install needed -- vitest is already configured and running (59+ existing tests pass).
