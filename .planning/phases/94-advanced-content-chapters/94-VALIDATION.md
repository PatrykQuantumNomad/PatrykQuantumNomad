# Phase 94: Advanced Content Chapters - Validation

**Created:** 2026-03-10
**Source:** 94-RESEARCH.md Validation Architecture section

## Test Framework

| Property | Value |
|----------|-------|
| Framework | vitest ^4.0.18 |
| Config file | vitest.config.ts |
| Quick run command | `npx vitest run --reporter=json` |
| Full suite command | `npx vitest run` |

## Phase Requirements to Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| CHAP-07 | custom-skills.mdx renders without build errors | smoke | `npx astro build 2>&1 \| grep -i error` | N/A (build test) |
| CHAP-08 | hooks.mdx renders with diagram + interactive imports | smoke | `npx astro build 2>&1 \| grep -i error` | N/A (build test) |
| CHAP-09 | worktrees.mdx renders without build errors | smoke | `npx astro build 2>&1 \| grep -i error` | N/A (build test) |
| CHAP-10 | agent-teams.mdx renders with diagram import | smoke | `npx astro build 2>&1 \| grep -i error` | N/A (build test) |
| CHAP-11 | security.mdx renders without build errors | smoke | `npx astro build 2>&1 \| grep -i error` | N/A (build test) |
| ALL | All 5 new chapters accessible at correct URLs | smoke | `npx astro build && ls dist/guides/claude-code/*/index.html` | N/A (build test) |
| ALL | Existing tests still pass | regression | `npx vitest run` | All existing test files |

## Sampling Rate

- **Per task commit:** `npx vitest run` (existing tests, ~15s)
- **Per wave merge:** `npx astro build` (full production build verifying all chapters render)
- **Phase gate:** Full build green + all 11 chapter URLs accessible before `/gsd:verify-work`

## Wave 0 Gaps

None -- existing test infrastructure covers all phase requirements. Content chapters are MDX files that produce build errors if imports are wrong or frontmatter is invalid. No new unit tests are needed since there is no new TypeScript logic to test. Validation is through successful builds and URL accessibility.
