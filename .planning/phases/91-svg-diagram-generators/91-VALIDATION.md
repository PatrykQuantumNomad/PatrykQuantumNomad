# Phase 91: SVG Diagram Generators - Validation

**Created:** 2026-03-10
**Source:** Extracted from 91-RESEARCH.md Validation Architecture section

## Test Framework

| Property | Value |
|----------|-------|
| Framework | vitest ^4.0.18 |
| Config file | vitest.config.ts |
| Quick run command | `npx vitest run src/lib/guides/svg-diagrams/__tests__/ --reporter=verbose` |
| Full suite command | `npx vitest run --reporter=verbose` |

## Phase Requirements to Test Map

| Req ID | Behavior | Test Type | Automated Command | Plan |
|--------|----------|-----------|-------------------|------|
| DIAG-01 | Agentic loop SVG with cycle labels | unit | `npx vitest run src/lib/guides/svg-diagrams/__tests__/agentic-loop.test.ts -x` | 91-01 |
| DIAG-02 | Hook lifecycle SVG with 18 event labels | unit | `npx vitest run src/lib/guides/svg-diagrams/__tests__/hook-lifecycle.test.ts -x` | 91-01 |
| DIAG-03 | Permission model SVG with allow/ask/deny labels | unit | `npx vitest run src/lib/guides/svg-diagrams/__tests__/permission-model.test.ts -x` | 91-02 |
| DIAG-04 | MCP architecture SVG with transport labels | unit | `npx vitest run src/lib/guides/svg-diagrams/__tests__/mcp-architecture.test.ts -x` | 91-02 |
| DIAG-05 | Agent teams SVG with lead/teammate/task/mailbox labels | unit | `npx vitest run src/lib/guides/svg-diagrams/__tests__/agent-teams.test.ts -x` | 91-03 |

## Sampling Rate

- **Per task commit:** `npx vitest run src/lib/guides/svg-diagrams/__tests__/ --reporter=verbose`
- **Per wave merge:** `npx vitest run --reporter=verbose`
- **Phase gate:** Full suite green + production build succeeds

## Cross-Cutting Assertions (all diagrams)

Every diagram test MUST verify:
1. Valid SVG structure (`<svg` ... `</svg>`)
2. Accessibility attributes (`role="img"`, `aria-label`)
3. CSS custom properties used (`var(--color-`)
4. No hardcoded hex colors (regex: `/#[0-9a-fA-F]{6}/`)
5. Unique marker ID prefix per diagram
