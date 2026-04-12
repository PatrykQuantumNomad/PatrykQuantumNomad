---
phase: 113-lower-impact-chapter-updates
plan: 03
subsystem: docs
tags: [mdx, astro, claude-code-guide, remote-control, headless, channels, server-mode]

# Dependency graph
requires:
  - phase: 112-new-chapters
    provides: "Ch12 Plugins, Ch13 Agent SDK chapters (cross-reference targets)"
provides:
  - "Updated Ch5 with Remote Control server mode (--spawn, --capacity, 3 isolation modes)"
  - "New Channels section covering Telegram/Discord/iMessage with security model"
  - "Documentation of --bare flag, --teleport flag, deep links, PR Auto-Fix"
  - "Cross-references to Ch12 Plugins, Ch13 Agent SDK, Ch11 Security"
affects: [113-lower-impact-chapter-updates]

# Tech tracking
tech-stack:
  added: []
  patterns: ["Research Preview blockquote format (matching Ch10 agent-teams pattern)"]

key-files:
  created: []
  modified:
    - src/data/guides/claude-code/pages/remote-and-headless.mdx

key-decisions:
  - "Updated scheduled task expiry from 3 days to 7 days based on STACK.md April 2026 research (most current source)"
  - "Channels section kept to 68 lines (within 60-80 target) -- no per-platform deep-dives"
  - "Used blockquote format for Research Preview (matching Ch10 pattern, not Callout component)"
  - "Added Web-Based Workflows as brief standalone section for PR Auto-Fix mention"

patterns-established:
  - "Research Preview blockquote: > **Research Preview:** [feature] are experimental... (matching Ch10)"
  - "Cross-reference to Ch12-14 using real hyperlinks to /guides/claude-code/plugins/ etc."

# Metrics
duration: 4min
completed: 2026-04-12
---

# Phase 113 Plan 03: Remote & Headless Update Summary

**Ch5 updated with Remote Control server mode (--spawn with 3 isolation modes, --capacity), new Channels section (Telegram/Discord/iMessage with sender allowlist security), --bare flag for CI, and --teleport for web session resumption**

## Performance

- **Duration:** 4 min
- **Started:** 2026-04-12T15:30:53Z
- **Completed:** 2026-04-12T15:34:51Z
- **Tasks:** 2
- **Files modified:** 1

## Accomplishments
- Added Remote Control server mode subsection documenting --spawn (same-dir, worktree, session modes), --capacity N, and session name prefix
- Added Channels section (68 lines) with Research Preview blockquote, setup flow, security model (sender allowlist, pairing codes), and enterprise controls (channelsEnabled, allowedChannelPlugins)
- Added --bare flag documentation for clean CI/scripted invocations
- Added --teleport flag for resuming web sessions in local terminal
- Added cross-references to Ch12 Plugins, Ch13 Agent SDK, Ch11 Security
- Updated scheduled task expiry from 3 to 7 days per current documentation
- Added Best Practices entries for --bare and Channels

## Task Commits

Each task was committed atomically:

1. **Task 1: Read existing Ch5 and feature sources** - No commit (read-only task)
2. **Task 2: Rewrite Ch5 remote-and-headless.mdx** - `f6ada72` (docs)

## Files Created/Modified
- `src/data/guides/claude-code/pages/remote-and-headless.mdx` - Updated Ch5 from 396 to 531 lines with server mode, Channels, --bare, --teleport, and cross-references

## Decisions Made
- Updated scheduled task expiry from 3 days to 7 days: STACK.md (April 2026, most current research) reports 7-day auto-expiry, while older FEATURES.md said 3 days. Applied the newer data.
- Channels section scoped to 68 lines: Covered concept, setup, security model, and enterprise controls without per-platform deep-dives (Telegram vs Discord vs iMessage specifics). Research preview status means details may change.
- Used blockquote format for Research Preview: Matches the Ch10 Agent Teams pattern exactly, not the Callout component used in Ch14.
- Added Web-Based Workflows as its own section: PR Auto-Fix is web-only and doesn't fit cleanly in other sections. Kept to 3 lines.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Updated scheduled task expiry from 3 days to 7 days**
- **Found during:** Task 2 (chapter rewrite)
- **Issue:** Existing chapter stated CLI cron tasks expire after 3 days. STACK.md (April 2026) reports 7-day auto-expiry.
- **Fix:** Updated all references from "3 days" to "7 days" throughout the scheduled tasks and durable scheduling sections.
- **Files modified:** src/data/guides/claude-code/pages/remote-and-headless.mdx
- **Verification:** Confirmed STACK.md feature #5 states "7-day auto-expiry for recurring tasks"
- **Committed in:** f6ada72 (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 bug fix)
**Impact on plan:** Factual correction based on updated documentation. No scope creep.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Verification Results

| Check | Result |
|-------|--------|
| File line count | 531 lines (target: 520-570) |
| Channels section lines | 68 lines (target: 60-80) |
| Key terms present | 23 occurrences of Channels/--spawn/--bare/--teleport/server mode |
| Cross-refs to Ch12 Plugins | Present (line 123) |
| Cross-refs to Ch13 Agent SDK | Present (line 238) |
| Cross-refs to Ch11 Security | Present (line 157) |
| Next-chapter link to Ch6 MCP | Present (line 531) |
| Deprecated terms (/tag, /vim, ANTHROPIC_SMALL_FAST_MODEL) | Zero matches |
| Research Preview blockquote | Present (line 94), matches Ch10 pattern |
| MDX imports | CodeBlock and TerminalRecording both present |
| Component tag balance | 23 CodeBlock + 2 TerminalRecording, all self-closing |

## Next Phase Readiness
- Ch5 is complete and ready for build verification
- All cross-references to Ch12-14 use real hyperlinks
- Channels section follows Research Preview convention for future updates

---
*Phase: 113-lower-impact-chapter-updates*
*Completed: 2026-04-12*
