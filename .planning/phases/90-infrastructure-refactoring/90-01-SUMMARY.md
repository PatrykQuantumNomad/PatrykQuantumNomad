---
phase: 90-infrastructure-refactoring
plan: 01
subsystem: infra
tags: [zod, astro-collections, sitemap, content-config, multi-guide]

# Dependency graph
requires:
  - phase: 85-89 (v1.15)
    provides: "Single-guide infrastructure (schema.ts, routes.ts, content.config.ts, astro.config.mjs)"
provides:
  - "Extended guidePageSchema with lastVerified optional date"
  - "Extended guideMetaSchema with optional templateRepo/versionTag, accentColor, chapter descriptions"
  - "claudeCodePages and claudeCodeGuide collections in content.config.ts"
  - "Claude Code guide.json with 11 chapters and #D97706 accent"
  - "Dynamic multi-guide sitemap builder in astro.config.mjs"
  - "GUIDE_ROUTES without hardcoded landing constant"
affects: [90-02, 90-03, 90-04, 91-content-pipeline, 93-chapter-content]

# Tech tracking
tech-stack:
  added: []
  patterns: ["dynamic guide directory iteration via readdirSync", "per-guide collection registration pattern"]

key-files:
  created:
    - "src/data/guides/claude-code/guide.json"
    - "src/data/guides/claude-code/pages/introduction.mdx"
  modified:
    - "src/lib/guides/schema.ts"
    - "src/lib/guides/routes.ts"
    - "src/lib/guides/__tests__/schema.test.ts"
    - "src/lib/guides/__tests__/routes.test.ts"
    - "src/content.config.ts"
    - "astro.config.mjs"

key-decisions:
  - "Removed GUIDE_ROUTES.landing constant -- guideLandingUrl() is the single source of truth for all guide landing URLs"
  - "Per-guide collection registration pattern (claudeCodePages, claudeCodeGuide) rather than a single merged collection"
  - "Dynamic sitemap builder uses readdirSync to iterate src/data/guides/* directories"

patterns-established:
  - "Multi-guide collection registration: each guide gets its own pair of collections (pages + meta)"
  - "Dynamic sitemap builder: iterates all guide directories instead of hardcoding paths"

requirements-completed: [INFRA-01, INFRA-02, INFRA-03]

# Metrics
duration: 4min
completed: 2026-03-10
---

# Phase 90 Plan 01: Foundation Infrastructure Summary

**Extended guide Zod schemas with multi-guide fields, registered Claude Code collections, and refactored sitemap builder for dynamic guide discovery**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-10T19:12:46Z
- **Completed:** 2026-03-10T19:17:03Z
- **Tasks:** 2
- **Files modified:** 8

## Accomplishments
- Extended guidePageSchema with optional lastVerified date and guideMetaSchema with optional templateRepo/versionTag, accentColor, and chapter descriptions
- Removed hardcoded GUIDE_ROUTES.landing constant in favor of dynamic guideLandingUrl()
- Registered claudeCodePages and claudeCodeGuide collections in content.config.ts
- Created Claude Code guide.json with 11 chapters (introduction through security) and #D97706 accent color
- Scaffolded stub introduction.mdx for collection pipeline validation
- Refactored sitemap builder to dynamically iterate all guide directories using readdirSync
- Full production build succeeds with zero errors; FastAPI guide regression check passed (15 pages)

## Task Commits

Each task was committed atomically:

1. **Task 1: Extend guide schemas, clean up routes, and update tests**
   - `9b9d350` (test) - RED: Failing tests for new schema fields and route cleanup
   - `07ce982` (feat) - GREEN: Schema extensions and GUIDE_ROUTES.landing removal
2. **Task 2: Register Claude Code collections, create guide.json, scaffold stub, refactor sitemap**
   - `dc38e96` (feat) - Collections, guide.json, stub MDX, dynamic sitemap

## Files Created/Modified
- `src/lib/guides/schema.ts` - Added lastVerified, optional templateRepo/versionTag, accentColor, chapter description
- `src/lib/guides/routes.ts` - Removed hardcoded GUIDE_ROUTES.landing constant
- `src/lib/guides/__tests__/schema.test.ts` - 11 new/updated tests for extended schema (26 total)
- `src/lib/guides/__tests__/routes.test.ts` - Updated to verify landing removal (8 total)
- `src/content.config.ts` - Added claudeCodePages and claudeCodeGuide collection definitions
- `src/data/guides/claude-code/guide.json` - 11-chapter guide metadata with accent color
- `src/data/guides/claude-code/pages/introduction.mdx` - Stub chapter for pipeline validation
- `astro.config.mjs` - Dynamic multi-guide sitemap builder using readdirSync

## Decisions Made
- Removed GUIDE_ROUTES.landing constant -- guideLandingUrl() is the single source of truth for all guide landing URLs
- Used per-guide collection registration pattern (separate collections per guide) rather than merging into a single collection
- Dynamic sitemap builder uses readdirSync with withFileTypes to iterate guide directories

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Schema extensions are complete -- all subsequent plans can use optional templateRepo, accentColor, and chapter descriptions
- Claude Code collections are registered and loadable at build time
- Sitemap builder automatically picks up new guides
- Ready for Plan 02 (guide hub page and navigation components)

## Self-Check: PASSED

All 8 files verified present. All 3 task commits verified in git log.

---
*Phase: 90-infrastructure-refactoring*
*Completed: 2026-03-10*
