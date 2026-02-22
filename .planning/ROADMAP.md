# Milestone v1.5: Database Compass

**Status:** In progress
**Phases:** 28-32
**Total Plans:** TBD

## Overview

Database Compass is an interactive database model explorer at /tools/db-compass/ that helps developers understand and select the right database model for their use case. 12 database model categories scored across 8 dimensions (4 operational + 4 developer), with a complexity spectrum visualization, octagonal radar charts, sortable scoring table, and full SEO infrastructure. Follows the Beauty Index content pillar pattern — build-time SVG charts, Astro content collections, Zod-validated JSON data, and Satori+Sharp OG images. Zero new npm dependencies. Companion blog post: "How to Choose a Database in 2026."

## Phases

**Phase Numbering:**
- Integer phases (28, 29, 30, 31, 32): Planned milestone work
- Decimal phases (28.1, 28.2): Urgent insertions (marked with INSERTED)

- [x] **Phase 28: Data Foundation** - Schema, dimension definitions, 12 model entries with scores and content, content collection registration
- [x] **Phase 29: Visualization Components** - Complexity spectrum, 8-axis radar charts, score breakdown, sortable table, CAP badge, responsive testing
- [ ] **Phase 30: Overview Page** - Landing page at /tools/db-compass/ with spectrum, model grid, scoring table, interactive filter, and overview-level SEO
- [ ] **Phase 31: Detail Pages** - 12 model detail pages with radar charts, tradeoffs, top databases, prev/next nav, share controls, and per-page SEO
- [ ] **Phase 32: OG Images & Site Integration** - Build-time OG images, sitemap inclusion, homepage callout, tools page card, companion blog post

## Phase Details

### Phase 28: Data Foundation
**Goal**: All 12 database model categories exist as validated, content-complete JSON data ready for rendering — with scores, justifications, use cases, tradeoffs, top databases, and cross-category metadata
**Depends on**: Nothing (first phase of v1.5)
**Requirements**: DATA-01, DATA-02, DATA-03, DATA-04, DATA-05, DATA-06, DATA-07
**Success Criteria** (what must be TRUE):
  1. Running `astro build` succeeds with the dbModels content collection loaded and Zod-validated against the schema
  2. Each of the 12 model entries has scores across all 8 dimensions with per-dimension justification text explaining the score
  3. Multi-model databases (Redis, PostgreSQL, Cosmos DB, etc.) have crossCategory fields linking to their secondary model types
  4. Each model entry lists 3-6 top databases with name, description, license, and external link
  5. Dimension definitions exist in a dedicated library file with key, symbol, name, and description for all 8 axes
**Plans**: 2 plans

Plans:
- [x] 28-01-PLAN.md — Zod schema, dimension definitions, and content collection registration
- [x] 28-02-PLAN.md — 12 database model entries with scores, justifications, and metadata

### Phase 29: Visualization Components
**Goal**: All visualization primitives render correctly from real data at mobile, tablet, and desktop breakpoints — ready to be assembled into pages
**Depends on**: Phase 28
**Requirements**: VIZ-01, VIZ-02, VIZ-03, VIZ-04, VIZ-05, VIZ-06
**Success Criteria** (what must be TRUE):
  1. The complexity spectrum renders all 12 models positioned from simple (key-value) to complex (graph) as a build-time SVG
  2. Each model's 8-axis octagonal radar chart renders with readable labels at all breakpoints (375px, 768px, 1024px+)
  3. The sortable scoring table displays all 12 models across 8 dimensions and sorts correctly when column headers are clicked
  4. The CAP theorem badge correctly shows CP, AP, CA, or Tunable designation per model
  5. Score breakdown component displays 8 dimension scores with visual bars for any given model
**Plans**: 2 plans

Plans:
- [x] 29-01-PLAN.md — Foundation utilities (DIMENSION_COLORS, spectrum-math.ts) and SVG charts (ComplexitySpectrum, CompassRadarChart)
- [x] 29-02-PLAN.md — Score display components (CompassScoreBreakdown, CapBadge) and interactive sortable scoring table

### Phase 30: Overview Page
**Goal**: Users can visit /tools/db-compass/ and explore all 12 database models through the spectrum, grid, scoring table, and interactive filters — with proper SEO metadata
**Depends on**: Phase 29
**Requirements**: PAGE-01, PAGE-05, SEO-01, SEO-03, SEO-06
**Success Criteria** (what must be TRUE):
  1. The overview page at /tools/db-compass/ renders the complexity spectrum, model card grid, sortable scoring table, and dimension legend
  2. Users can filter models by use case (caching, analytics, OLTP, search, etc.) via the React island interactive filter
  3. JSON-LD Dataset + ItemList and BreadcrumbList structured data are present in the page source
  4. The page has an SEO-optimized meta description and title tag
**Plans**: 2 plans

Plans:
- [ ] 30-01-PLAN.md — Foundation utilities (use-case categories, filter store) and sub-components (ModelCardGrid, DimensionLegend, CompassJsonLd)
- [ ] 30-02-PLAN.md — UseCaseFilter React island and overview page assembly at /tools/db-compass/

### Phase 31: Detail Pages
**Goal**: Users can navigate to any of 12 model detail pages, understand that model's strengths, tradeoffs, and top databases, share the page, and move between models
**Depends on**: Phase 29, Phase 30
**Requirements**: PAGE-02, PAGE-03, PAGE-04, SEO-02, SHARE-01, SHARE-02
**Success Criteria** (what must be TRUE):
  1. All 12 detail pages render at /tools/db-compass/[slug]/ with radar chart, score breakdown, CAP badge, when-to-use/avoid lists, tradeoffs prose, and top databases section
  2. Prev/next navigation links appear on each detail page ordered by complexity position
  3. Users can share a detail page via Web Share API on mobile or Clipboard API on desktop
  4. Users can download any model's radar chart as a PNG image
  5. JSON-LD CreativeWork and BreadcrumbList structured data are present on each detail page
**Plans**: TBD

Plans:
- [ ] 31-01: TBD
- [ ] 31-02: TBD

### Phase 32: OG Images & Site Integration
**Goal**: Database Compass is fully discoverable — OG images render on social shares, all pages appear in the sitemap, the homepage and tools page link to it, and a companion blog post provides context
**Depends on**: Phase 30, Phase 31
**Requirements**: SEO-04, SEO-05, SEO-07, INTEG-01, INTEG-02, INTEG-03, INTEG-04
**Success Criteria** (what must be TRUE):
  1. Sharing the overview page on social media shows a custom OG image with a spectrum miniature
  2. Sharing any detail page shows a custom OG image with that model's radar chart
  3. All 14 new URLs (1 overview + 12 detail + 1 blog post) appear in the sitemap
  4. The homepage has a Database Compass callout card and the tools listing page shows a real card replacing the "Coming Soon" placeholder
  5. The companion blog post "How to Choose a Database in 2026" is published with bidirectional cross-links to the overview and selected detail pages
**Plans**: TBD

Plans:
- [ ] 32-01: TBD
- [ ] 32-02: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 28 → 29 → 30 → 31 → 32

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 28. Data Foundation | 2/2 | Complete | 2026-02-22 |
| 29. Visualization Components | 2/2 | Complete | 2026-02-22 |
| 30. Overview Page | 0/2 | Not started | - |
| 31. Detail Pages | 0/TBD | Not started | - |
| 32. OG Images & Site Integration | 0/TBD | Not started | - |

---

_For current project status, see .planning/PROJECT.md_
