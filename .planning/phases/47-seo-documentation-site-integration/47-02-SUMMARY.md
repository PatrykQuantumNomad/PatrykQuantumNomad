---
phase: 47-seo-documentation-site-integration
plan: 02
subsystem: seo
tags: [og-image, json-ld, satori, sharp, structured-data, opengraph, kubernetes]

# Dependency graph
requires:
  - phase: 45-editor-ui-and-scoring
    provides: K8s Analyzer tool page at /tools/k8s-analyzer/
provides:
  - generateK8sAnalyzerOgImage() function in og-image.ts
  - OG image API route at /open-graph/tools/k8s-analyzer.png
  - K8sAnalyzerJsonLd.astro SoftwareApplication structured data component
  - Tool page with ogImage meta, JSON-LD, and aside links to rules/blog
affects: [47-03, 47-04, 47-05, 47-06]

# Tech tracking
tech-stack:
  added: []
  patterns: [K8s Analyzer OG image generation, K8s Analyzer SoftwareApplication JSON-LD]

key-files:
  created:
    - src/pages/open-graph/tools/k8s-analyzer.png.ts
    - src/components/K8sAnalyzerJsonLd.astro
  modified:
    - src/lib/og-image.ts
    - src/pages/tools/k8s-analyzer/index.astro

key-decisions:
  - "Follow exact ComposeValidator pattern for both OG image and JSON-LD"
  - "Use new URL() with Astro.site for ogImage prop (same as compose-validator)"

patterns-established:
  - "K8s Analyzer OG image: two-column layout with K8s YAML code panel and 67-rule badge"

requirements-completed: []

# Metrics
duration: 3min
completed: 2026-02-23
---

# Phase 47 Plan 02: OG Image and JSON-LD Summary

**K8s Analyzer OG image with two-column YAML code panel layout and SoftwareApplication JSON-LD structured data for search engine discoverability**

## Performance

- **Duration:** 3 min
- **Started:** 2026-02-23T23:49:01Z
- **Completed:** 2026-02-23T23:52:00Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- Created generateK8sAnalyzerOgImage() with two-column layout: title/description/category pills on the left, dark K8s YAML code panel on the right with error/warning markers and 67-rule badge
- Created SoftwareApplication JSON-LD component with full structured data (keywords, featureList, author, softwareHelp)
- Updated tool page with ogImage/ogImageAlt meta props, JSON-LD component, and aside links to rule documentation and companion blog post

## Task Commits

Each task was committed atomically:

1. **Task 1: Create OG image generator + API route** - `d9d40af` (feat)
2. **Task 2: Create JSON-LD component + update tool page** - `8a8311d` (feat)

## Files Created/Modified
- `src/lib/og-image.ts` - Added generateK8sAnalyzerOgImage() function following ComposeValidator pattern
- `src/pages/open-graph/tools/k8s-analyzer.png.ts` - OG image API route returning PNG with cache headers
- `src/components/K8sAnalyzerJsonLd.astro` - SoftwareApplication JSON-LD with 67 rules, 10 features, 9 keywords
- `src/pages/tools/k8s-analyzer/index.astro` - Added JSON-LD import, ogImage props, updated aside with rule docs and blog links

## Decisions Made
- Followed exact ComposeValidator pattern for both OG image and JSON-LD -- no architectural deviations
- Used `new URL('/open-graph/tools/k8s-analyzer.png', Astro.site).toString()` for ogImage prop (matches compose-validator pattern)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- OG image and JSON-LD are ready for the tool page
- Rule documentation pages (Plan 03) can reference the OG image URL
- Blog post (Plan 04) can link to the tool page with proper SEO metadata
- Site integration (Plan 05/06) will find the K8sAnalyzerJsonLd already in place

## Self-Check: PASSED

All 4 files verified on disk. Both task commits (d9d40af, 8a8311d) verified in git log.

---
*Phase: 47-seo-documentation-site-integration*
*Completed: 2026-02-23*
