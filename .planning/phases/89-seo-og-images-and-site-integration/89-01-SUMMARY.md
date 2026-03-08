---
phase: 89-seo-og-images-and-site-integration
plan: 01
subsystem: seo
tags: [og-images, satori, sharp, json-ld, structured-data, sitemap, content-hash-caching]

# Dependency graph
requires:
  - phase: 88-content-authoring
    provides: All 11 domain MDX pages for guide chapters
provides:
  - Guide OG image pipeline (satori + sharp + content-hash caching) for 12 pages
  - GuideJsonLd component (TechArticle + CollectionPage)
  - BreadcrumbJsonLd wiring on all guide pages
  - OG image URL props on all guide page routes
affects: [89-02-PLAN, 89-03-PLAN]

# Tech tracking
tech-stack:
  added: []
  patterns: [guide-specific OG cache with separate CACHE_DIR, geometric pattern OG layout]

key-files:
  created:
    - src/lib/guides/og-cache.ts
    - src/components/guide/GuideJsonLd.astro
    - src/pages/open-graph/guides/fastapi-production.png.ts
    - src/pages/open-graph/guides/fastapi-production/[slug].png.ts
  modified:
    - src/lib/og-image.ts
    - src/layouts/GuideLayout.astro
    - src/pages/guides/fastapi-production/[slug].astro
    - src/pages/guides/fastapi-production/index.astro

key-decisions:
  - "Guide OG cache uses separate CACHE_DIR (og-guide) to avoid collisions with EDA cache"
  - "Single generateGuideOgImage function for both landing and chapter pages, differentiated by chapterLabel param"
  - "Geometric pattern (rectangles, lines, dots) for right column instead of importing external SVG"

patterns-established:
  - "Guide OG cache pattern: copy og-cache.ts with domain-specific CACHE_DIR"
  - "GuideJsonLd component pattern: TechArticle for chapters, CollectionPage for landing"

requirements-completed: [SITE-04, SITE-05, SITE-07]

# Metrics
duration: 10min
completed: 2026-03-08
---

# Phase 89 Plan 01: OG Image Pipeline and JSON-LD Summary

**Build-time OG images (satori + sharp) with content-hash caching for 12 guide pages, plus TechArticle/CollectionPage JSON-LD and BreadcrumbList structured data on all guide pages**

## Performance

- **Duration:** 10 min
- **Started:** 2026-03-08T17:02:12Z
- **Completed:** 2026-03-08T17:12:20Z
- **Tasks:** 2
- **Files modified:** 8

## Accomplishments
- 12 OG images generated at build time (1 landing + 11 chapters) as 1200x630 PNG with branded two-column layout
- Content-hash caching in `node_modules/.cache/og-guide/` prevents regeneration of unchanged images
- TechArticle JSON-LD on all 11 chapter pages with `isPartOf` linking to guide landing
- CollectionPage JSON-LD on guide landing page
- BreadcrumbList JSON-LD on all 12 guide pages (Home > Guides > FastAPI Production Guide > Chapter)
- All 12 guide pages present in sitemap-0.xml (verified: 12 occurrences)
- Full production build passes (1075 pages, zero errors)

## Task Commits

Each task was committed atomically:

1. **Task 1: Create guide OG cache module and generateGuideOgImage function** - `1b522bb` (feat)
2. **Task 2: Create GuideJsonLd component and wire OG images + JSON-LD into guide pages** - `ba92535` (feat)
3. **Satori display flex fix** - `6eb01d8` (fix)

## Files Created/Modified
- `src/lib/guides/og-cache.ts` - Guide-specific OG image content-hash caching (CACHE_DIR=og-guide, CACHE_VERSION=1)
- `src/lib/og-image.ts` - Added generateGuideOgImage function with two-column branded layout
- `src/pages/open-graph/guides/fastapi-production.png.ts` - Landing page OG image endpoint
- `src/pages/open-graph/guides/fastapi-production/[slug].png.ts` - Chapter OG image endpoints (11 pages via getStaticPaths)
- `src/components/guide/GuideJsonLd.astro` - TechArticle (chapters) and CollectionPage (landing) JSON-LD
- `src/layouts/GuideLayout.astro` - Added GuideJsonLd and BreadcrumbJsonLd component wiring
- `src/pages/guides/fastapi-production/[slug].astro` - Added ogImage and ogImageAlt props
- `src/pages/guides/fastapi-production/index.astro` - Added ogImage, ogImageAlt, GuideJsonLd, and BreadcrumbJsonLd

## Decisions Made
- Guide OG cache uses separate CACHE_DIR (`og-guide`) to avoid cache collisions with EDA cache (`og-eda`)
- Single `generateGuideOgImage` function handles both landing and chapter pages -- landing passes `chapterLabel = 'Production Guide'`, chapters pass their domain title
- Right column uses decorative geometric shapes (rectangles, lines, dot cluster) with accent colors rather than importing external SVG, matching the EDA hero pattern approach
- Chapter label pill uses blue (`#3b82f6`) to distinguish from the accent orange branding

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed satori display:flex requirement on geometric pattern container**
- **Found during:** Task 1 verification (build step)
- **Issue:** Satori requires explicit `display: flex` on div elements with multiple children. The decorative geometric pattern container div had 8 child elements but no display property.
- **Fix:** Added `display: 'flex'` to the right column geometric pattern container style
- **Files modified:** src/lib/og-image.ts
- **Verification:** Build passes without satori warnings, all 12 OG images generate correctly
- **Committed in:** `6eb01d8`

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Necessary fix for satori compatibility. No scope creep.

## Issues Encountered
None beyond the satori display:flex fix documented above.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- OG images and JSON-LD are fully wired -- ready for Plan 89-02 (header nav, homepage callout, LLMs.txt)
- Pre-existing uncommitted changes to llms.txt.ts and llms-full.txt.ts are in the working tree (guide section additions) -- Plan 89-02 should commit these

## Self-Check: PASSED

- src/lib/guides/og-cache.ts: FOUND
- src/components/guide/GuideJsonLd.astro: FOUND
- git log --oneline --all --grep="89-01": 3 commits found

---
*Phase: 89-seo-og-images-and-site-integration*
*Completed: 2026-03-08*
