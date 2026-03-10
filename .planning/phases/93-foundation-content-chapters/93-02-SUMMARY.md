---
phase: 93-foundation-content-chapters
plan: 02
subsystem: content
tags: [mdx, claude-code, permissions, sandboxing, models, cost-economics]

# Dependency graph
requires:
  - phase: 90-infrastructure-refactoring
    provides: CodeBlock component, content collections, chapter routing
  - phase: 91-svg-diagram-generators
    provides: PermissionModelDiagram.astro (DIAG-03)
  - phase: 92-interactive-react-components
    provides: PermissionFlowExplorer.tsx (INTV-01)
provides:
  - "Chapter 3 MDX: Models, Cost Economics & Permissions (models-and-costs.mdx)"
  - "Chapter 4 MDX: Environment Sandboxing & Customization (environment.mdx)"
affects: [94-advanced-content-chapters, 95-site-integration]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "CodeBlock for all inline code examples (bash, json, text)"
    - "Static SVG diagram + interactive React Flow explorer progressive enhancement"
    - "client:visible directive for lazy-loaded React components in MDX"

key-files:
  created:
    - src/data/guides/claude-code/pages/models-and-costs.mdx
    - src/data/guides/claude-code/pages/environment.mdx
  modified: []

key-decisions:
  - "(93-02) Model decision table with task-model mapping for practical model selection guidance"
  - "(93-02) Permission evaluation explained as numbered steps (deny->ask->allow->default) for clarity"
  - "(93-02) Rule specificity example shows broad allow + narrow deny pattern for git commands"
  - "(93-02) Settings precedence listed as managed > CLI > local > project > user (5 tiers including CLI)"
  - "(93-02) Status line script uses jq for JSON parsing to keep examples portable"

patterns-established:
  - "Chapter section separators: --- horizontal rules between major topic transitions"
  - "Cross-chapter linking via relative markdown links (/guides/claude-code/[slug]/)"
  - "Settings examples show both env var and settings.json approaches for each feature"

requirements-completed: [CHAP-03, CHAP-04]

# Metrics
duration: 9min
completed: 2026-03-10
---

# Phase 93 Plan 02: Models/Costs/Permissions + Environment/Sandboxing Summary

**Two MDX chapters covering model selection, cost economics with ~$6/dev/day baseline, deny->ask->allow permission system with 5 modes, 4-tier config scopes, macOS Seatbelt and Linux bubblewrap sandboxing, and status line customization**

## Performance

- **Duration:** 9 min
- **Started:** 2026-03-10T22:03:57Z
- **Completed:** 2026-03-10T22:13:00Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- Chapter 3 (351 lines): Complete coverage of model aliases (sonnet/opus/haiku/opusplan), effort levels, extended context, cost tracking, permission system with evaluation order, 5 permission modes, and settings precedence -- with embedded PermissionModelDiagram and interactive PermissionFlowExplorer
- Chapter 4 (360 lines): Complete coverage of 4-tier configuration scopes, settings file format, environment variables, sandbox rationale and modes, filesystem isolation (Seatbelt/bubblewrap), network isolation with allowedDomains, and status line customization
- Both chapters follow established FastAPI guide patterns with CodeBlock for all examples, cross-chapter links, and further reading sections

## Task Commits

Each task was committed atomically:

1. **Task 1: Write Chapter 3 -- Models, Cost Economics and Permissions** - `0903e24` (feat)
2. **Task 2: Write Chapter 4 -- Environment Sandboxing and Workspace Customization** - `412b5f9` (feat)

**Plan metadata:** (pending final commit)

## Files Created/Modified
- `src/data/guides/claude-code/pages/models-and-costs.mdx` - Chapter 3 covering model selection, effort levels, cost tracking, permission system with diagram + interactive explorer
- `src/data/guides/claude-code/pages/environment.mdx` - Chapter 4 covering config scopes, sandboxing, filesystem/network isolation, status line

## Decisions Made
- Model decision table added to help readers choose the right model for specific task types
- Permission evaluation explained as a 4-step numbered list (deny, ask, allow, default fallback) for maximum clarity
- Rule specificity example demonstrates the common pattern of broad allow + narrow deny for git commands
- Settings precedence includes CLI arguments as a separate tier between managed and local
- Status line script examples use jq for JSON parsing to keep examples portable across shells

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- Pre-existing Astro build error (`renderers.mjs` not found in static generation step) prevents full `npx astro build` completion. Verified this error exists without any changes (git stash test). The vite compilation step passes without errors for both MDX files, confirming they compile correctly. This is an out-of-scope infrastructure issue.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Chapters 3 and 4 complete and ready for production
- Chapter 4 cross-links to Chapter 5 (Remote Control & Headless Automation), which is the next plan (93-03)
- All Phase 91 SVG diagrams and Phase 92 interactive components successfully embedded

## Self-Check: PASSED

- [x] models-and-costs.mdx exists (351 lines)
- [x] environment.mdx exists (360 lines)
- [x] 93-02-SUMMARY.md exists
- [x] Commit 0903e24 found in git log
- [x] Commit 412b5f9 found in git log
- [x] PermissionModelDiagram imported and embedded
- [x] PermissionFlowExplorer imported with client:visible
- [x] CodeBlock used throughout both chapters

---
*Phase: 93-foundation-content-chapters*
*Completed: 2026-03-10*
