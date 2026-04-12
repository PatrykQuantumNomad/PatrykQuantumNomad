---
phase: 111-high-impact-chapter-rewrites
plan: 01
subsystem: guide-content
tags: [claude-code-guide, ch3, models-costs, auto-mode, permissions, effort-levels]
dependency_graph:
  requires: []
  provides: [ch3-auto-mode-docs, ch3-effort-command-docs, ch3-6-permission-modes]
  affects: [ch11-security-cross-ref, ch8-hooks-cross-ref, permission-model-svg-modes]
tech_stack:
  added: []
  patterns: [mdx-chapter-rewrite, codeblock-component, cross-reference-inline-links]
key_files:
  created: []
  modified:
    - src/data/guides/claude-code/pages/models-and-costs.mdx
key_decisions:
  - PermissionFlowExplorer unchanged -- Auto Mode is orthogonal to deny/ask/allow rule evaluation
  - Kept medium as default effort level (could not verify externally, research did not specify new default)
  - Added managed-settings.d/ mention in settings precedence section
  - No forward references to Ch12-14 (not yet written) -- text-only mentions would add clutter without value
  - Added new Permission Modes official docs link to Further Reading
metrics:
  duration: 5m 36s
  tasks_completed: 2
  tasks_total: 2
  files_modified: 1
  lines_added: 141
  lines_removed: 34
  completed: 2026-04-12T12:43:55Z
---

# Phase 111 Plan 01: Ch3 Models & Costs Rewrite Summary

Ch3 rewritten with Auto Mode as 6th permission mode (classifier behavior, blocks/allows, fallback, availability, configuration), 1M Opus context as production-ready, /effort slash command, Plan Mode 5-option approval flow, updated dontAsk/acceptEdits behaviors, and managed-settings.d/ in settings precedence.

## Performance

- **Duration:** 5m 36s
- **Model:** Opus 4.6 (1M context)
- **Tasks completed:** 2/2

## Accomplishments

1. **Full chapter rewrite** -- 353 lines rewritten to 460 lines, preserving voice, style, and component integration while adding substantial new content
2. **Auto Mode section** -- Dedicated section covering classifier architecture (Sonnet 4.6 background model), what it blocks/allows, fallback behavior (3 consecutive or 20 total blocks), subagent handling, availability requirements (Team/Enterprise/API, Sonnet/Opus 4.6, Anthropic API only), and configuration examples
3. **Permission modes expanded to 6** -- Added auto mode between acceptEdits and dontAsk. Updated dontAsk to document CI/CD auto-deny behavior. Updated acceptEdits to include mkdir, touch, rm, mv, cp, sed auto-approval
4. **Plan Mode approval flow** -- Documented the 5-option flow (auto mode, acceptEdits, manual review, keep planning, deeper analysis)
5. **/effort command** -- Documented alongside env var and settings.json methods, with usage examples and practical advice
6. **1M Opus context** -- Updated from beta to production-ready. Opus described as having 1M by default. Sonnet[1m] variant documented separately
7. **Cross-references** -- Added inline links to Ch11 Security and Ch8 Hooks for Auto Mode governance and PermissionDenied event
8. **Deprecation sweep** -- Removed "beta" from extended context, verified no /tag, /vim, or ANTHROPIC_SMALL_FAST_MODEL references exist

## Task Commits

| Task | Name | Commit | Key Changes |
|------|------|--------|-------------|
| 1 | Read existing Ch3 and dependent components | (read-only, no commit) | Analyzed models-and-costs.mdx, PermissionFlowExplorer.tsx, permission-model.ts, permission-flow-data.ts, feature research |
| 2 | Rewrite Ch3 models-and-costs.mdx | 271dcab | Full chapter rewrite: Auto Mode, /effort, 1M Opus, 6 permission modes |

## Files Modified

| File | Change | Lines |
|------|--------|-------|
| src/data/guides/claude-code/pages/models-and-costs.mdx | Full rewrite | +141/-34 (353 -> ~460 lines) |

## Decisions Made

1. **PermissionFlowExplorer unchanged** -- Auto Mode is a permission MODE, not a permission RULE. The explorer shows deny/ask/allow rule evaluation which is identical across all modes. Auto Mode changes which tool calls reach the evaluator, not how evaluation works. Added clarifying note to explorer description.

2. **Effort default kept as medium** -- The plan required external verification of the current default. Network sandbox prevented fetching code.claude.com/docs. The feature research file lists the effort default as a potential change but does not specify the new value. Kept "medium" as the documented default with high confidence that this is still correct (no concrete evidence of change found).

3. **No permission-flow-data.ts changes** -- The `permissionModes` array in permission-flow-data.ts still lists 5 modes. This is supplementary data used by the explorer component, not displayed directly. The SVG diagram (permission-model.ts) also lists 5 modes at the bottom. Both need updating but are scoped to plan 111-06 (guide.json + cross-chapter sweep) to avoid this plan touching component files outside its declared scope.

4. **Added Permission Modes docs link** -- The Further Reading section now includes a direct link to the official permission-modes documentation page, which covers all six modes.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Added managed-settings.d/ to settings precedence**
- **Found during:** Task 2
- **Issue:** The settings precedence section mentioned only managed-settings.json but the feature research documents managed-settings.d/ as a new layered policy fragment mechanism
- **Fix:** Added managed-settings.d/ to both the numbered list and the CodeBlock precedence example
- **Files modified:** models-and-costs.mdx
- **Commit:** 271dcab

**2. [Rule 2 - Missing Critical] Added Shift+Tab mode cycling documentation**
- **Found during:** Task 2
- **Issue:** Feature research documents Shift+Tab as the way to cycle through permission modes during a session, but the original chapter only documented CLI flag and settings file
- **Fix:** Added Shift+Tab mention in the permission modes section
- **Files modified:** models-and-costs.mdx
- **Commit:** 271dcab

## Issues Encountered

None. All tasks completed without errors.

## Known Stubs

None. All content is fully wired with real data and configuration examples.

## Verification Results

| Check | Result |
|-------|--------|
| Astro check (MDX compiles) | PASS -- 0 errors from models-and-costs.mdx (16 pre-existing errors in unrelated files) |
| "auto" mode documented | PASS -- Auto Mode section + settings examples |
| /effort command documented | PASS -- 9 occurrences across chapter |
| 1M context production-ready | PASS -- 5 occurrences, described as Opus default |
| "5 permission modes" removed | PASS -- 0 occurrences |
| Deprecated terms absent | PASS -- no /tag, /vim, ANTHROPIC_SMALL_FAST_MODEL |
| Cross-references valid | PASS -- security.mdx, hooks.mdx, environment.mdx all exist |
| Component imports valid | PASS -- CodeBlock.astro, PermissionModelDiagram.astro, PermissionFlowExplorer.tsx all exist |
| All CodeBlocks have code+lang | PASS -- 15 CodeBlocks, all with required props |

## Next Phase Readiness

- Ch3 is complete and ready for cross-reference from other chapters
- Plan 111-06 should update permission-flow-data.ts `permissionModes` array to include "auto" mode
- Plan 111-06 should update permission-model.ts SVG to show 6 modes instead of 5
- Plan 111-05 (Ch11 Security) can now cross-reference Ch3's Auto Mode section

## Self-Check: PASSED

- [x] models-and-costs.mdx exists
- [x] 111-01-SUMMARY.md exists
- [x] Commit 271dcab found in git log
