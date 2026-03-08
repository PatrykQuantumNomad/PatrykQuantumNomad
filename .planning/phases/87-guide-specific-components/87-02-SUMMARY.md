---
phase: 87-guide-specific-components
plan: 02
subsystem: ui
tags: [astro, expressive-code, github, code-snippets, typescript, vitest]

# Dependency graph
requires:
  - phase: 86-page-infrastructure-and-navigation
    provides: Guide page layout and navigation components
provides:
  - CodeFromRepo Astro component for syntax-highlighted code with source attribution
  - buildGitHubFileUrl helper for constructing GitHub blob URLs
  - Unit tests for URL construction edge cases
affects: [88-content-authoring]

# Tech tracking
tech-stack:
  added: []
  patterns: [component-wraps-expressive-code, github-url-builder-with-line-ranges]

key-files:
  created:
    - src/components/guide/CodeFromRepo.astro
    - src/lib/guides/code-helpers.ts
    - src/lib/guides/__tests__/code-helpers.test.ts
  modified: []

key-decisions:
  - "Default templateRepo and versionTag hardcoded in component (matching guide.json) rather than reading guide.json at build time -- keeps component self-contained and usable outside guide context"
  - "Used CSS child selector overrides ([&_.expressive-code]) to remove top rounding and join code block seamlessly with header bar"

patterns-established:
  - "CodeFromRepo pattern: wrap expressive-code Code with metadata header for source attribution"
  - "code-helpers utility module: pure functions for GitHub URL construction, easily testable"

requirements-completed: [CODE-01, CODE-02, CODE-03]

# Metrics
duration: 2min
completed: 2026-03-08
---

# Phase 87 Plan 02: CodeFromRepo Component Summary

**Reusable CodeFromRepo Astro component wrapping expressive-code with file path annotation header and GitHub source link, backed by TDD-validated URL builder**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-08T15:41:49Z
- **Completed:** 2026-03-08T15:44:18Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- buildGitHubFileUrl helper constructs GitHub blob URLs with trailing/leading slash normalization and optional line range fragments (#L10-L25)
- All 5 unit tests pass covering basic URL, edge cases, line range, and single line scenarios
- CodeFromRepo.astro renders syntax-highlighted code blocks with a file path header bar and "View source" link to the tagged GitHub repository
- Component defaults to fastapi-template repo and v1.0.0 tag, matching guide.json values

## Task Commits

Each task was committed atomically:

1. **Task 1 (RED): Failing tests for buildGitHubFileUrl** - `56a6713` (test)
2. **Task 1 (GREEN): Implement buildGitHubFileUrl helper** - `78c2920` (feat)
3. **Task 2: Create CodeFromRepo.astro component** - `70e7c53` (feat)

**Plan metadata:** `befaca6` (docs: complete plan)

_Note: Task 1 followed TDD RED-GREEN cycle with separate commits._

## Files Created/Modified
- `src/lib/guides/__tests__/code-helpers.test.ts` - 5 unit tests for buildGitHubFileUrl covering URL construction and edge cases
- `src/lib/guides/code-helpers.ts` - buildGitHubFileUrl function with trailing/leading slash normalization and line range support
- `src/components/guide/CodeFromRepo.astro` - Wrapper component with file path header, View source link, and expressive-code integration

## Decisions Made
- Default templateRepo and versionTag hardcoded in component props (matching guide.json values) rather than dynamically reading guide.json at build time -- keeps the component self-contained and usable outside guide context
- Used CSS child selector overrides (`[&_.expressive-code]:!rounded-t-none`) to seamlessly join the header bar with the code block without modifying expressive-code internals

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- CodeFromRepo component is ready for Phase 88 content authoring
- All 11 domain pages can use CodeFromRepo to embed syntax-highlighted code with automatic GitHub source links
- Line range support enables precise code excerpts with #L fragment links

## Self-Check: PASSED

- All 3 source files exist (code-helpers.ts, code-helpers.test.ts, CodeFromRepo.astro)
- All 3 task commits verified (56a6713, 78c2920, 70e7c53)
- CodeFromRepo.astro: 85 lines (min 20)
- code-helpers.test.ts: 39 lines (min 15)
- All 5 unit tests pass
- Astro build succeeds (1064 pages)

---
*Phase: 87-guide-specific-components*
*Completed: 2026-03-08*
