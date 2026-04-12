---
phase: 112-new-chapters
plan: 04
subsystem: content
tags: [guide-json, chapter-registration, og-images, chapter-count, site-integration]

# Dependency graph
requires:
  - phase: 112-new-chapters
    provides: Three new MDX chapters (plugins.mdx, agent-sdk.mdx, computer-use.mdx) with correct frontmatter slugs and order values
provides:
  - "guide.json registry with 14 chapter entries including plugins, agent-sdk, computer-use"
  - "Updated chapter count (11->14) across site-wide references"
  - "Verified OG image auto-generation for all three new chapters"
  - "Verified cross-reference integrity across all three new chapters"
affects: [113-lower-impact-updates, 115-blog-post, 116-site-integration]

# Tech tracking
tech-stack:
  added: []
  patterns: []

key-files:
  created: []
  modified:
    - src/data/guides/claude-code/guide.json
    - src/pages/index.astro
    - src/pages/guides/claude-code/index.astro
    - src/pages/guides/claude-code/[slug].astro

key-decisions:
  - "Blog post claude-code-guide.mdx intentionally left at '11 chapters' -- Phase 115 scope"
  - "index.astro description updated to mention plugins and Agent SDK for SEO"
  - "OG image route confirmed dynamic -- no changes needed for new chapter OG generation"

patterns-established: []

requirements-completed: [NEW-04, NEW-05]

# Metrics
duration: 2m 29s
completed: 2026-04-12
---

# Phase 112 Plan 04: Guide Registration and Chapter Count Update Summary

**Registered 3 new chapters (Plugins, Agent SDK, Computer Use) in guide.json, updated all site-wide chapter counts from 11 to 14, and verified build passes with OG images for all 14 chapters**

## Performance

- **Duration:** 2m 29s
- **Started:** 2026-04-12T14:31:02Z
- **Completed:** 2026-04-12T14:33:31Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- Added three new chapter entries to guide.json with slugs matching MDX frontmatter exactly (plugins, agent-sdk, computer-use)
- Updated guide.json description and all site-wide "11 chapters" references to "14 chapters" (4 files)
- Full build passes (1181 pages) with OG images auto-generated for all three new chapters
- Comprehensive cross-reference verification: all inter-chapter links, Quick Start sections, Callout component, and safety-first structure confirmed

## Task Commits

Each task was committed atomically:

1. **Task 1: Register new chapters in guide.json and update chapter count references** - `66e0662` (feat)
2. **Task 2: Cross-chapter verification sweep** - No commit (verification-only task, no file changes)

## Files Created/Modified
- `src/data/guides/claude-code/guide.json` - Added 3 chapter entries (plugins, agent-sdk, computer-use), updated description to 14 chapters
- `src/pages/index.astro` - Updated Claude Code guide card from "11 chapters" to "14 chapters", added plugins and Agent SDK to description
- `src/pages/guides/claude-code/index.astro` - Updated comment from "all 11 chapters" to "all 14 chapters"
- `src/pages/guides/claude-code/[slug].astro` - Updated companion blog post label from "all 11 chapters" to "all 14 chapters"

## Decisions Made
- Blog post (src/data/blog/claude-code-guide.mdx) intentionally left unchanged at "11 chapters" -- updating it is Phase 115 scope per plan instructions
- Updated index.astro guide card description to include "plugins, the Agent SDK" for improved SEO signal
- Confirmed OG image route uses dynamic collection discovery, so no route changes needed

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Verification Results

All success criteria met:

- [x] guide.json has exactly 14 entries in the chapters array
- [x] guide.json slugs "plugins", "agent-sdk", "computer-use" match MDX frontmatter
- [x] guide.json top-level description says "14 practitioner-driven chapters"
- [x] guide.json is valid JSON (parsed successfully with Node.js)
- [x] src/pages/index.astro says "14 chapters"
- [x] src/pages/guides/claude-code/[slug].astro says "all 14 chapters"
- [x] src/pages/guides/claude-code/index.astro says "all 14 chapters"
- [x] No remaining "11 chapters" references in src/ except blog post
- [x] OG image route confirmed dynamic (getCollection-based)
- [x] All three chapter HTML pages generated in dist/
- [x] All three OG PNG images generated in dist/open-graph/
- [x] Build passes clean (1181 pages, no errors)
- [x] All cross-references verified (Ch12->Ch7/Ch8/Ch11, Ch13->Ch6/Ch7/Ch8/Ch12, Ch14->Ch3/Ch6/Ch11)
- [x] All three Quick Start sections present
- [x] Computer Use Callout component import and safety-first structure verified

## Next Phase Readiness
- Phase 112 (New Chapters) is fully complete -- all 4 plans executed
- Phase 113 (Lower-Impact Chapter Updates) can proceed with the full 14-chapter guide structure in place
- Blog post update deferred to Phase 115

---
*Phase: 112-new-chapters*
*Completed: 2026-04-12*
