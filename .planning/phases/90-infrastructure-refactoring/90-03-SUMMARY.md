---
phase: 90-infrastructure-refactoring
plan: 03
subsystem: infra
tags: [astro, multi-guide, landing-page, chapter-routing, llms-txt, reading-time]

# Dependency graph
requires:
  - phase: 90-01
    provides: "claudeCodePages and claudeCodeGuide collections, extended schema with accentColor and chapter descriptions"
  - phase: 90-02
    provides: "Parameterized GuideLayout with optional companionLink and parentTitle/parentUrl props"
provides:
  - "Claude Code landing page at /guides/claude-code/ with chapter card grid and reading time"
  - "Claude Code chapter routing at /guides/claude-code/[slug]/ with GuideLayout"
  - "Multi-guide hub page at /guides/ listing both FastAPI and Claude Code"
  - "Multi-guide LLMs.txt and LLMs-full.txt with Claude Code sections"
affects: [90-04, 93-foundation-content, 94-advanced-content, 95-site-integration]

# Tech tracking
tech-stack:
  added: []
  patterns: ["render() for reading time extraction at build", "accent-color-driven card hover via CSS custom property"]

key-files:
  created:
    - "src/pages/guides/claude-code/index.astro"
    - "src/pages/guides/claude-code/[slug].astro"
  modified:
    - "src/pages/guides/index.astro"
    - "src/pages/llms.txt.ts"
    - "src/pages/llms-full.txt.ts"

key-decisions:
  - "Landing page uses render() to extract reading time from remarkPluginFrontmatter at build time"
  - "Claude Code card on hub page uses guide title prominently instead of logo image"
  - "templateRepo/versionTag access wrapped in conditionals in llms-full.txt.ts for safe handling"

patterns-established:
  - "Guide landing page pattern: getCollection for meta + pages, render for reading time, accent color for visual identity"
  - "Chapter routing pattern: getStaticPaths with claudeCodePages, parentTitle/parentUrl to GuideLayout, no companionLink"

requirements-completed: [INFRA-04, INFRA-05]

# Metrics
duration: 4min
completed: 2026-03-10
---

# Phase 90 Plan 03: Claude Code Landing Page, Chapter Routing, Hub Page, and LLMs.txt Summary

**Claude Code guide landing page with reading-time chapter cards, chapter routing via GuideLayout, multi-guide hub page, and LLMs.txt/LLMs-full.txt with both guides**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-10T19:20:47Z
- **Completed:** 2026-03-10T19:25:07Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- Created Claude Code landing page at /guides/claude-code/ with hero section, prerequisites box, and 11-chapter numbered card grid showing reading time for existing chapters
- Created Claude Code chapter page template at /guides/claude-code/[slug]/ using GuideLayout with breadcrumbs, sidebar, and prev/next navigation
- Refactored hub page at /guides/ to show both FastAPI and Claude Code guide cards with distinct accent colors
- Updated LLMs.txt and LLMs-full.txt to include Claude Code Guide sections with chapter listings
- Made templateRepo/versionTag access conditional in llms-full.txt.ts for safe handling of guides without them

## Task Commits

Each task was committed atomically:

1. **Task 1: Create Claude Code guide landing page and chapter routing** - `2d5616d` (feat)
2. **Task 2: Refactor hub page and LLMs.txt endpoints for multi-guide support** - `52512b1` (feat)

## Files Created/Modified
- `src/pages/guides/claude-code/index.astro` - Claude Code landing page with chapter card grid, reading time, and prerequisites box
- `src/pages/guides/claude-code/[slug].astro` - Claude Code chapter page template using GuideLayout with Claude Code parent metadata
- `src/pages/guides/index.astro` - Multi-guide hub page with both FastAPI and Claude Code cards
- `src/pages/llms.txt.ts` - Added Claude Code Guide section with chapter listing and citation example
- `src/pages/llms-full.txt.ts` - Added Claude Code Guide section, conditional templateRepo/versionTag, citation example

## Decisions Made
- Landing page uses render() on each claudeCodePage to extract minutesRead from remarkPluginFrontmatter -- build cost is negligible with few pages
- Claude Code hub card uses guide title text prominently instead of a logo image (no logo asset exists)
- templateRepo/versionTag access wrapped in conditionals rather than coalescing to empty string -- cleaner output when fields are absent

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All guide pages (landing + chapter routing) are functional and building
- Hub page and LLMs.txt both include Claude Code
- Ready for Plan 04 (OG images + full regression verification)
- Claude Code chapters added in Phase 93/94 will automatically appear on landing page and in LLMs.txt

## Self-Check: PASSED

All 5 files verified present. Both task commits (2d5616d, 52512b1) verified in git log.

---
*Phase: 90-infrastructure-refactoring*
*Completed: 2026-03-10*
