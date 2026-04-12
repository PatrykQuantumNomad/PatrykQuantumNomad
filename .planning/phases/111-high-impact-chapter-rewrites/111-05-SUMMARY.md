---
phase: 111-high-impact-chapter-rewrites
plan: 05
subsystem: content
tags: [security, enterprise, auto-mode, managed-settings, permissions, bash-hardening, mdx]

# Dependency graph
requires:
  - phase: none
    provides: standalone chapter rewrite
provides:
  - Ch11 Security chapter with Auto Mode governance, 6 permission modes, managed-settings.d/, Bash hardening, protected paths, disableSkillShellExecution
  - Enterprise admin reference for Auto Mode classifier behavior and controls
  - Cross-references to Ch3 (permission modes) and Ch8 (PermissionDenied event)
affects: [112-new-chapters, 116-cross-reference-audit]

# Tech tracking
tech-stack:
  added: []
  patterns: [managed-settings.d drop-in directory pattern, Auto Mode classifier governance pattern]

key-files:
  created: []
  modified:
    - src/data/guides/claude-code/pages/security.mdx

key-decisions:
  - "Placed Auto Mode Governance as a standalone section after Permission Governance and before Hook Governance -- it is a permission feature but significant enough for dedicated coverage"
  - "Added Skill Governance as a new standalone section (was not in original chapter) to house disableSkillShellExecution"
  - "Expanded Sandbox section title to 'Sandbox Enforcement and Bash Hardening' to signal expanded scope"
  - "Used managed-settings.d/ numbering convention (00-, 10-, 20-, 30-, 90-) to demonstrate priority-based layering"

patterns-established:
  - "Enterprise governance sections follow: concept explanation -> configuration JSON -> cross-reference to detailed chapter"
  - "Protected paths documented as trust boundaries, not just filesystem rules"

requirements-completed: []

# Metrics
duration: 5min
completed: 2026-04-12
---

# Phase 111 Plan 05: Ch11 Security Rewrite Summary

**Rewrote Ch11 Security & Enterprise Administration with Auto Mode classifier governance, 6 permission modes, managed-settings.d/ layered policy fragments, Bash hardening with protected paths, and disableSkillShellExecution skill governance**

## Performance

- **Duration:** 5 min
- **Started:** 2026-04-12T12:40:30Z
- **Completed:** 2026-04-12T12:45:50Z
- **Tasks:** 2
- **Files modified:** 1

## Accomplishments
- Added comprehensive Auto Mode Governance section covering classifier architecture (Sonnet 4.6 background evaluation), blocked/allowed defaults, subagent handling at three checkpoints (spawn, during, return), fallback behavior (3 consecutive or 20 total blocks), availability requirements (Team/Enterprise/API, Sonnet/Opus 4.6, API only), and enterprise controls (`permissions.disableAutoMode`, `autoMode.environment`)
- Updated all permission mode references from 5 to 6 modes throughout the chapter, listing all six modes explicitly (default, acceptEdits, plan, auto, dontAsk, bypassPermissions)
- Added managed-settings.d/ drop-in directory documentation with directory structure example, base policy fragment, team-specific fragment, and merge behavior explanation
- Added Skill Governance section with `disableSkillShellExecution` setting, explaining scope (user/plugin skills affected, bundled/managed skills unaffected)
- Expanded Sandbox section with protected paths (Claude config, .git, shell config, SSH, credentials) and Bash hardening (command analysis, working directory enforcement, environment isolation)
- Added PermissionDenied hook event to Hook Governance example for Auto Mode audit trail logging
- Updated Best Practices with Auto Mode pilot recommendations and managed-settings.d/ multi-team guidance
- Added Permission Modes external link to Further Reading
- Removed all deprecated /tag and /vim references; no "5 permission modes" references remain

## Task Commits

Each task was committed atomically:

1. **Task 1: Read existing Ch11 and feature research** - read-only task (no commit needed)
2. **Task 2: Rewrite Ch11 security.mdx** - `067e14b` (feat)

**Plan metadata:** pending (docs: complete plan)

## Files Created/Modified
- `src/data/guides/claude-code/pages/security.mdx` - Complete Ch11 rewrite (522 -> 761 lines)

## Decisions Made
- Placed Auto Mode Governance after Permission Governance and before Hook Governance. Auto Mode is fundamentally a permission feature, but its complexity warranted a dedicated section rather than folding it into Permission Governance.
- Created a standalone Skill Governance section rather than embedding disableSkillShellExecution in an existing section. Skills governance is distinct enough from hook/MCP/plugin governance to merit its own heading.
- Expanded Sandbox section title to "Sandbox Enforcement and Bash Hardening" to signal the expanded scope. Protected paths are documented as trust boundaries rather than just configuration entries.
- Used numbered prefix convention (00-, 10-, 20-, 30-, 90-) for managed-settings.d/ examples to demonstrate the priority-based layering pattern clearly.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Known Stubs

None - all sections contain complete, substantive content.

## Next Phase Readiness
- Ch11 Security is complete with all planned features documented
- Cross-references to Ch3 and Ch8 use existing valid slugs
- No forward references to not-yet-written chapters (avoiding 404 links)
- Ready for Phase 112 new chapters and Phase 116 cross-reference audit

## Self-Check: PASSED

- FOUND: src/data/guides/claude-code/pages/security.mdx
- FOUND: commit 067e14b
- FOUND: .planning/phases/111-high-impact-chapter-rewrites/111-05-SUMMARY.md

---
*Phase: 111-high-impact-chapter-rewrites*
*Completed: 2026-04-12*
