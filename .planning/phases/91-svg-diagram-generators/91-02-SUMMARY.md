---
phase: 91-svg-diagram-generators
plan: 02
subsystem: diagrams
tags: [svg, permission-model, mcp, flowchart, topology, vitest, astro]

requires:
  - phase: 91-01
    provides: diagram-base.ts helpers (diamondNode, groupBox, curvedPath)
provides:
  - generatePermissionModel() SVG generator (DIAG-03)
  - generateMcpArchitecture() SVG generator (DIAG-04)
  - PermissionModelDiagram.astro wrapper component
  - McpArchitectureDiagram.astro wrapper component
affects: [93-foundation-chapters, 94-advanced-chapters]

tech-stack:
  added: []
  patterns: [diamond-decision-node flowchart, groupBox server topology]

key-files:
  created:
    - src/lib/guides/svg-diagrams/permission-model.ts
    - src/lib/guides/svg-diagrams/mcp-architecture.ts
    - src/lib/guides/svg-diagrams/__tests__/permission-model.test.ts
    - src/lib/guides/svg-diagrams/__tests__/mcp-architecture.test.ts
    - src/components/guide/PermissionModelDiagram.astro
    - src/components/guide/McpArchitectureDiagram.astro
  modified:
    - src/lib/guides/svg-diagrams/index.ts

key-decisions:
  - "Permission model uses 3 diamondNode decision nodes for deny->ask->allow evaluation chain"
  - "MCP architecture uses groupBox containers for Local Servers and Remote Servers"
  - "SSE transport clearly labeled as deprecated with textSecondary styling"
  - "HTTP transport highlighted with accent color as recommended transport"

patterns-established:
  - "Diamond decision flowchart: diamondNode + arrowLine + Yes/No textLabels for branching logic"
  - "Server topology: groupBox containers with transport badges and scope rows"

requirements-completed: [DIAG-03, DIAG-04]

duration: 4min
completed: 2026-03-10
---

# Phase 91 Plan 02: Permission Model + MCP Architecture Diagrams Summary

**Deny->ask->allow permission flowchart with diamond decision nodes and MCP server topology showing stdio/HTTP/SSE transports across local, project, and user scopes**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-10T20:19:18Z
- **Completed:** 2026-03-10T20:23:45Z
- **Tasks:** 2 (TDD: RED-GREEN each)
- **Files modified:** 7

## Accomplishments
- Permission Model diagram (DIAG-03): deny->ask->allow evaluation flowchart with 3 diamond decision nodes, tool tier reference panel, settings precedence bar, and 5 permission mode labels
- MCP Architecture diagram (DIAG-04): server topology with Local/Remote server groups, stdio and HTTP transports (HTTP recommended), SSE marked as deprecated, configuration scopes (Local/Project/User), and server source badges
- All 59 tests pass across 8 test files (including parallel Plan 03's agent-teams tests) with zero regressions
- Production build succeeds (1085 pages)

## Task Commits

Each task was committed atomically:

1. **Task 1: Permission Model flowchart (DIAG-03)**
   - `377368c` test(91-02): add failing tests for permission model diagram (TDD RED)
   - `68e6eb9` feat(91-02): implement permission model flowchart diagram (TDD GREEN)

2. **Task 2: MCP Architecture topology (DIAG-04)**
   - `df86e3e` test(91-02): add failing tests for MCP architecture diagram (TDD RED)
   - `1949acb` feat(91-02): implement MCP architecture topology diagram (TDD GREEN)

## Files Created/Modified
- `src/lib/guides/svg-diagrams/permission-model.ts` - Deny->ask->allow flowchart with diamond decision nodes, tool tiers, settings precedence, permission modes
- `src/lib/guides/svg-diagrams/mcp-architecture.ts` - Server topology with stdio/HTTP/SSE transports, scopes, server sources, capabilities
- `src/lib/guides/svg-diagrams/__tests__/permission-model.test.ts` - 7 tests covering SVG validity, a11y, evaluation labels, tool tiers, modes, marker prefix, CSS vars
- `src/lib/guides/svg-diagrams/__tests__/mcp-architecture.test.ts` - 8 tests covering SVG validity, a11y, transports, SSE deprecated, scopes, sources, marker prefix, CSS vars
- `src/components/guide/PermissionModelDiagram.astro` - PlotFigure wrapper for DIAG-03
- `src/components/guide/McpArchitectureDiagram.astro` - PlotFigure wrapper for DIAG-04
- `src/lib/guides/svg-diagrams/index.ts` - Added generatePermissionModel and generateMcpArchitecture exports

## Decisions Made
- Permission model uses 3 diamondNode() decision nodes for the deny->ask->allow evaluation chain, with Yes arrows branching right to result boxes (BLOCKED, Prompt User, ALLOWED) and No arrows continuing down
- MCP architecture uses groupBox() containers for Local Servers and Remote Servers with transport badges inside each group
- SSE transport clearly labeled as "(deprecated)" with textSecondary styling to differentiate from recommended HTTP
- HTTP transport highlighted with accent color border and "Recommended" sub-label
- Settings precedence shown as: Managed > CLI > Local > Shared > User

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- Parallel Plan 03 (agent-teams) modified index.ts concurrently, adding generateAgentTeams export. Merged cleanly by inserting generateMcpArchitecture between generatePermissionModel and generateAgentTeams.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- All 5 Claude Code SVG diagrams (DIAG-01 through DIAG-05) are now available as Astro components
- Phase 91 Plan 03 (agent-teams + regression) running in parallel
- Ready for Phase 92 (Interactive React Components) and Phase 93/94 (chapter content embedding)

## Self-Check: PASSED

All 6 created files verified on disk. All 4 task commits (377368c, 68e6eb9, df86e3e, 1949acb) found in git history.

---
*Phase: 91-svg-diagram-generators*
*Completed: 2026-03-10*
