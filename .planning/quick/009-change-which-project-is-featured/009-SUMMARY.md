---
phase: quick-009
plan: 01
subsystem: ui
tags: [projects, featured, data]

# Dependency graph
requires: []
provides:
  - Updated featured project flags for hero section
  - JobFlo display name for jobs project
affects: [projects-page, project-hero]

# Tech tracking
tech-stack:
  added: []
  patterns: []

key-files:
  created: []
  modified:
    - src/data/projects.ts

key-decisions:
  - "networking-tools and JobFlo replace kps-graph-agent and kps-cluster-deployment as featured projects"

patterns-established: []

# Metrics
duration: 1min
completed: 2026-02-13
---

# Quick Task 009: Change Which Project Is Featured Summary

**Swapped featured projects to networking-tools and JobFlo, un-featuring kps-graph-agent and kps-cluster-deployment**

## Performance

- **Duration:** 1 min
- **Started:** 2026-02-13T22:25:27Z
- **Completed:** 2026-02-13T22:26:21Z
- **Tasks:** 1
- **Files modified:** 1

## Accomplishments
- Un-featured kps-graph-agent and kps-cluster-deployment, setting their gridSize to medium
- Featured networking-tools (already had large gridSize) and jobs project
- Renamed jobs display name to "JobFlo" with large gridSize
- Verified exactly 2 projects have `featured: true`
- Build passes with no errors

## Task Commits

Each task was committed atomically:

1. **Task 1: Update featured flags, gridSize, and display name in projects.ts** - `e153249` (feat)

**Plan metadata:** see final commit (docs: complete plan)

## Files Created/Modified
- `src/data/projects.ts` - Updated featured flags, gridSize values, and display name for 4 projects

## Decisions Made
None - followed plan as specified.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Featured projects hero section now shows networking-tools and JobFlo
- kps-graph-agent and kps-cluster-deployment return to their category grids with medium cards
- No follow-up work required

## Self-Check: PASSED

- FOUND: src/data/projects.ts
- FOUND: commit e153249
- FOUND: 009-SUMMARY.md

---
*Quick Task: 009-change-which-project-is-featured*
*Completed: 2026-02-13*
