---
phase: 85-foundation-and-content-schema
plan: 01
subsystem: infra
tags: [zod, astro, content-collections, mdx, fastapi, guide-system]

# Dependency graph
requires: []
provides:
  - Zod schemas (guidePageSchema, guideMetaSchema) for guide content validation
  - Astro content collections (guidePages, guides) registered in content.config.ts
  - Dynamic page route at /guides/fastapi-production/[slug]
  - Stub MDX chapter (builder-pattern) proving end-to-end pipeline
  - guide.json metadata for fastapi-production guide
affects: [86-guide-layout-and-navigation, 87-component-library, 88-content-authoring, 89-seo-and-launch]

# Tech tracking
tech-stack:
  added: []
  patterns: [guide-content-collection, guide-page-route, zod-schema-for-guides]

key-files:
  created:
    - src/lib/guides/schema.ts
    - src/lib/guides/__tests__/schema.test.ts
    - src/data/guides/fastapi-production/guide.json
    - src/data/guides/fastapi-production/pages/00-builder-pattern.mdx
    - src/pages/guides/fastapi-production/[slug].astro
  modified:
    - src/content.config.ts

key-decisions:
  - "Used astro/zod import (not bare zod) matching existing schema pattern in src/lib/eda/schema.ts"
  - "guide.json is a JSON array with id field, matching file() loader requirements"
  - "Dynamic route uses page.data.slug (frontmatter) for URL params, not page.id (filename)"

patterns-established:
  - "Guide schema pattern: guidePageSchema for MDX frontmatter, guideMetaSchema for JSON metadata"
  - "Guide content collections: guidePages (glob loader for MDX) and guides (file loader for JSON)"
  - "Guide page routing: /guides/fastapi-production/[slug].astro with getStaticPaths from guidePages collection"

requirements-completed: [INFRA-07, INFRA-08]

# Metrics
duration: 3min
completed: 2026-03-08
---

# Phase 85 Plan 01: Foundation and Content Schema Summary

**Zod-validated content collections for guide MDX pages and JSON metadata with dynamic page routing and end-to-end pipeline verification**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-08T14:02:45Z
- **Completed:** 2026-03-08T14:05:55Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments
- guidePageSchema validates title, description, order (int >= 0), slug with 12 unit tests (positive and negative cases)
- guideMetaSchema validates id, title, description, slug, templateRepo (URL), versionTag, chapters array
- content.config.ts now registers 8 collections (6 existing + guidePages + guides)
- Full pipeline verified: MDX -> Zod validation -> content collection -> getStaticPaths -> rendered HTML at /guides/fastapi-production/builder-pattern/

## Task Commits

Each task was committed atomically:

1. **Task 1 (RED): Failing schema tests** - `28970eb` (test)
2. **Task 1 (GREEN): Implement schemas, data files, content collections** - `ddd2668` (feat)
3. **Task 2: Dynamic page route and build verification** - `fe173c9` (feat)

_Note: Task 1 followed TDD with RED/GREEN commits. No REFACTOR needed -- schemas are clean as-is._

## Files Created/Modified
- `src/lib/guides/schema.ts` - Zod schemas (guidePageSchema, guideMetaSchema) and inferred TypeScript types
- `src/lib/guides/__tests__/schema.test.ts` - 12 unit tests for schema validation (positive and negative cases)
- `src/data/guides/fastapi-production/guide.json` - Guide-level metadata with chapter ordering
- `src/data/guides/fastapi-production/pages/00-builder-pattern.mdx` - Stub MDX chapter with frontmatter
- `src/content.config.ts` - Added guidePages (glob) and guides (file) collections
- `src/pages/guides/fastapi-production/[slug].astro` - Dynamic page route with getStaticPaths

## Decisions Made
- Used `astro/zod` import (not bare `zod`) matching existing schema pattern in `src/lib/eda/schema.ts`
- guide.json is a JSON array with `id` field, matching `file()` loader requirements for Astro content collections
- Dynamic route uses `page.data.slug` (frontmatter slug) for URL params, not `page.id` (which includes filename prefix like `00-builder-pattern`)
- Minimal scaffold page with base Layout -- GuideLayout deferred to Phase 86 as planned

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Content foundation complete: schemas, collections, data files, and page routing all working
- Phase 86 can build GuideLayout, sidebar navigation, and breadcrumbs on top of this foundation
- Phase 88 can add full MDX content chapters using the established guidePages collection pattern
- Blocker noted: fastapi-template repo needs v1.0.0 tag before Phase 88 content authoring

## Self-Check: PASSED

All 7 files verified present. All 3 commits verified in git log.

---
*Phase: 85-foundation-and-content-schema*
*Completed: 2026-03-08*
