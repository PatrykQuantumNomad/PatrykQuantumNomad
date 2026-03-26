---
phase: 103-seo-concept-pages
plan: 02
subsystem: ui
tags: [astro, seo, json-ld, static-site, ai-landscape, breadcrumb, structured-data]

requires:
  - phase: 103-01
    provides: "ancestry.ts, routes.ts, DefinedTermJsonLd.astro utilities"
  - phase: 102-data-foundation
    provides: "51 AI concept nodes in nodes.json, graph.json with clusters and edges"
provides:
  - "Dynamic route generating 51 static AI concept pages at /ai-landscape/{slug}/"
  - "AncestryBreadcrumb component for visual concept lineage navigation"
  - "RelatedConcepts component for grouped relationship links"
  - "DefinedTerm + BreadcrumbList JSON-LD on every concept page"
affects: [104-graph-visualization, 105-interactive-features, 106-og-images]

tech-stack:
  added: []
  patterns:
    - "Two-tier content layout (simple + technical descriptions) for concept pages"
    - "Cluster color accent via border-left and pill badge using graph.json darkColor/color"
    - "nodesMap passed as Record<string, {name, slug}> to components (not full AiNode)"

key-files:
  created:
    - src/pages/ai-landscape/[slug].astro
    - src/components/ai-landscape/AncestryBreadcrumb.astro
    - src/components/ai-landscape/RelatedConcepts.astro
  modified: []

key-decisions:
  - "Used Object.fromEntries with projected fields for nodesMap to keep component props lightweight"
  - "Ancestry breadcrumb is a visual nav element separate from BreadcrumbJsonLd structured data"
  - "Related concepts grouped into Part of / Includes / Connected to sections with edge labels in parentheses"

patterns-established:
  - "AI landscape concept page pattern: back link + ancestry breadcrumb + header with cluster accent + content sections + related concepts"
  - "Cluster color styling: border-left with darkColor, pill badge with color bg and darkColor text"

requirements-completed: [SEO-01, SEO-02, SEO-03]

duration: 3min
completed: 2026-03-26
---

# Phase 103 Plan 02: Concept Page Route Summary

**Dynamic [slug].astro route generating 51 static AI concept pages with two-tier content, ancestry breadcrumbs, related concept links, and DefinedTerm + BreadcrumbList JSON-LD**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-26T16:46:13Z
- **Completed:** 2026-03-26T16:49:35Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- Created AncestryBreadcrumb and RelatedConcepts visual components
- Built dynamic [slug].astro route that generates 51 static concept pages from the aiLandscape content collection
- Every page includes DefinedTerm and BreadcrumbList JSON-LD structured data for SEO
- Cluster color accents (border + pill badge) provide visual differentiation per taxonomy branch
- Zero client-side JavaScript -- purely static content pages

## Task Commits

Each task was committed atomically:

1. **Task 1: Create AncestryBreadcrumb and RelatedConcepts components** - `9b8579d` (feat)
2. **Task 2: Create [slug].astro dynamic concept page route** - `a360859` (feat)

## Files Created/Modified
- `src/components/ai-landscape/AncestryBreadcrumb.astro` - Visual breadcrumb trail showing concept lineage through AI taxonomy
- `src/components/ai-landscape/RelatedConcepts.astro` - Grouped relationship links (parents, children, related) with edge labels
- `src/pages/ai-landscape/[slug].astro` - Dynamic route generating 51 static concept pages with getStaticPaths

## Decisions Made
- Used `Object.fromEntries` with projected `{name, slug}` fields for nodesMap prop to keep component data lightweight rather than passing full AiNode objects
- Visual ancestry breadcrumb is a separate nav element from the BreadcrumbJsonLd structured data component (educational navigation vs. search engine markup)
- Related concepts use three semantic groups (Part of / Includes / Connected to) with edge labels shown in parentheses for context

## Deviations from Plan

None -- plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None -- no external service configuration required.

## Known Stubs

None -- all 51 concept pages render with real data from nodes.json and graph.json. No placeholders or mock data.

## Next Phase Readiness
- 51 static concept pages deployed and indexable by search engines
- Phase 103 now complete (Plans 01, 02, 03 all done)
- Ready for Phase 104 (graph visualization) which will add the interactive SVG/D3 graph to /ai-landscape/

## Self-Check: PASSED

All 3 created files verified on disk. Both task commits (9b8579d, a360859) verified in git log. All 5 key_links (buildAncestryChain, conceptUrl, DefinedTermJsonLd, BreadcrumbJsonLd, getCollection) confirmed present in [slug].astro.

---
*Phase: 103-seo-concept-pages*
*Completed: 2026-03-26*
