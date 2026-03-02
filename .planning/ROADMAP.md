# Roadmap: patrykgolabek.dev

## Milestones

- ~~v1.0 MVP~~ - Phases 1-7 (shipped 2026-02-11)
- ~~v1.1 Content Refresh~~ - Phases 8-12 (shipped 2026-02-12)
- ~~v1.2 Projects Page Redesign~~ - Phases 13-15 (shipped 2026-02-13)
- ~~v1.3 The Beauty Index~~ - Phases 16-21 (shipped 2026-02-17)
- ~~v1.4 Dockerfile Analyzer~~ - Phases 22-27 (shipped 2026-02-20)
- ~~v1.5 Database Compass~~ - Phases 28-32 (shipped 2026-02-22)
- ~~v1.6 Docker Compose Validator~~ - Phases 33-40 (shipped 2026-02-23)
- ~~v1.7 Kubernetes Manifest Analyzer~~ - Phases 41-47 (shipped 2026-02-23)
- ~~v1.8 EDA Visual Encyclopedia~~ - Phases 48-55 (shipped 2026-02-25)
- ~~v1.9 EDA Case Study Deep Dive~~ - Phases 56-63 (shipped 2026-02-27)
- ~~v1.10 EDA Graphical Techniques — NIST Parity & Validation~~ - Phases 64-68 (shipped 2026-02-27)
- **v1.11 Cloud Architecture Patterns** - Phases 69-73 (in progress)

## Phases

<details>
<summary>v1.0 through v1.10 (Phases 1-68) - SHIPPED</summary>

Phases 1-68 delivered across milestones v1.0-v1.10. 609 requirements, 159 plans completed.
See `.planning/milestones/` for detailed archives.

</details>

### v1.11 Cloud Architecture Patterns

- [ ] **Phase 69: Infrastructure Foundation** - Zod schema, content collection, scoring dimensions, SVG diagram generation framework, radar chart component, and filter store
- [ ] **Phase 70: Catalog Page & Site Shell** - Overview page at /patterns/ with category filter, scoring table, complexity spectrum, header nav link, homepage callout, and JSON-LD
- [ ] **Phase 71: Pattern Detail Pages** - All 13 pattern detail pages with radar charts, custom SVG architecture diagrams, score breakdowns, prose sections, and navigation
- [ ] **Phase 72: Comparison, Interactivity & Integration** - Comparison pages, interactive SVG enhancements, share controls, OG images, blog post, sitemap, and LLMs.txt
- [ ] **Phase 73: Verification & Audit** - Full-sweep verification of build, Lighthouse, DOM node counts, cross-links, CSS/JS isolation, and scoring methodology

## Phase Details

### Phase 69: Infrastructure Foundation
**Goal**: All infrastructure is in place so pattern content, SVG diagrams, and scoring can be authored without further framework changes
**Depends on**: Nothing (first phase of v1.11)
**Requirements**: DATA-01, DATA-02, DATA-03, SCOR-01
**Success Criteria** (what must be TRUE):
  1. A pattern entry in patterns.json with all fields (slug, name, category, scores across 7 dimensions, strengths, weaknesses, whenToUse, whenToAvoid, relatedPatterns, characterSketch, summary) passes Zod validation and is accessible via `getCollection('cloudPatterns')`
  2. The PatternRadarChart component renders a 7-axis heptagonal radar chart from score data at build time with zero client-side JavaScript
  3. A proof-of-concept SVG architecture diagram (Circuit Breaker) renders within the 200 DOM node budget and displays correctly in both dark and light themes
  4. The pattern filter store and DecisionFilter React island toggle pattern card visibility by category using data-attribute DOM manipulation
**Plans**: TBD

### Phase 70: Catalog Page & Site Shell
**Goal**: Users can browse all patterns on the catalog page with category filtering, compare scores in a sortable table, and navigate to the Patterns section from the header and homepage
**Depends on**: Phase 69
**Requirements**: CATL-01, CATL-02, CATL-03, CATL-04, SITE-01, SITE-02, SITE-04
**Success Criteria** (what must be TRUE):
  1. Visiting /patterns/ displays a card grid of all 13 patterns grouped by 5 categories (Resilience, Data Management, Communication, Structural, Scaling) with pattern name, summary, and category indicator on each card
  2. Clicking a category filter pill shows only patterns in that category; clicking "All" restores the full grid
  3. The scoring table on the catalog page shows all 13 patterns across 7 dimensions with clickable column headers that re-sort the table
  4. A complexity spectrum visualization positions all 13 patterns on a simple-to-complex continuum
  5. The site header contains a "Patterns" navigation link, the homepage displays a callout card linking to /patterns/, and all pattern pages include JSON-LD structured data
**Plans**: TBD

### Phase 71: Pattern Detail Pages
**Goal**: Users can explore any of the 13 patterns in depth with visual architecture diagrams, quantitative scoring, and contextual guidance on when to use each pattern
**Depends on**: Phase 69, Phase 70
**Requirements**: DETL-01, DETL-02, DETL-03, DETL-04, DETL-05, DETL-06, DETL-07, DETL-08, SCOR-02
**Success Criteria** (what must be TRUE):
  1. All 13 pattern detail pages exist at /patterns/[slug]/ and render a custom SVG architecture diagram, heptagonal radar chart, and score breakdown with per-dimension values
  2. Each pattern page displays a character sketch narrative, strengths/weaknesses lists, and when-to-use/when-to-avoid guidance sections
  3. Each pattern page includes scoring justification paragraphs for all 7 dimensions explaining why that pattern received each score
  4. Each pattern page shows a related patterns section with linked cards to other patterns, and prev/next navigation allows sequential browsing through all 13 patterns
  5. All 13 SVG architecture diagrams stay within the 200 DOM node budget and render correctly in both dark and light themes
**Plans**: TBD

### Phase 72: Comparison, Interactivity & Integration
**Goal**: Users can compare patterns side-by-side, interact with SVG diagrams, share results, and discover the patterns encyclopedia through blog content, search engines, and AI assistants
**Depends on**: Phase 71
**Requirements**: INTX-01, INTX-02, INTX-03, INTX-04, SCOR-03, SITE-03, SITE-05, SITE-06
**Success Criteria** (what must be TRUE):
  1. SVG architecture diagrams respond to hover/click with highlighted data flow paths and component detail popups using CSS and minimal vanilla JS (no framework components for SVG interactivity)
  2. Comparison pages at /patterns/vs/[slug]/ display overlay radar charts for two patterns with a picker to select the comparison pattern
  3. Users can download any radar chart as a 2x PNG image and share pattern pages via Web Share API on mobile or Clipboard API on desktop
  4. Build-time OG images exist for the overview page and all 13 pattern detail pages (14 total) and render correctly when shared on social media
  5. A companion blog post with bidirectional cross-links to pattern pages is published, and all pattern pages appear in the sitemap and LLMs.txt
**Plans**: TBD

### Phase 73: Verification & Audit
**Goal**: The entire v1.11 milestone is validated with zero regressions, all quality gates passed, and production readiness confirmed
**Depends on**: Phase 72
**Requirements**: (validates all v1.11 requirements)
**Success Criteria** (what must be TRUE):
  1. `astro build` completes cleanly with zero errors and the total page count reflects 13 pattern detail pages + comparison pages + catalog page + blog post
  2. Lighthouse scores are 90+ on mobile for the catalog page, one pattern detail page, and one comparison page
  3. All 13 SVG architecture diagrams have fewer than 200 DOM nodes and all pattern pages have fewer than 1,500 total DOM nodes
  4. Zero CSS or JS from the patterns pillar leaks to EDA, Beauty Index, or DB Compass pages (and vice versa)
  5. All related-pattern cross-links, blog post cross-links, and comparison page links resolve to valid pages with no 404s
**Plans**: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 69 -> 70 -> 71 -> 72 -> 73

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1-7 | v1.0 MVP | 15/15 | Complete | 2026-02-11 |
| 8-12 | v1.1 Content Refresh | 7/7 | Complete | 2026-02-12 |
| 13-15 | v1.2 Projects Page Redesign | 6/6 | Complete | 2026-02-13 |
| 16-21 | v1.3 The Beauty Index | 15/15 | Complete | 2026-02-17 |
| 22-27 | v1.4 Dockerfile Analyzer | 13/13 | Complete | 2026-02-20 |
| 28-32 | v1.5 Database Compass | 10/10 | Complete | 2026-02-22 |
| 33-40 | v1.6 Docker Compose Validator | 14/14 | Complete | 2026-02-23 |
| 41-47 | v1.7 Kubernetes Manifest Analyzer | 23/23 | Complete | 2026-02-23 |
| 48-55 | v1.8 EDA Visual Encyclopedia | 24/24 | Complete | 2026-02-25 |
| 56-63 | v1.9 EDA Case Study Deep Dive | 19/19 | Complete | 2026-02-27 |
| 64-68 | v1.10 EDA Graphical NIST Parity | 12/12 | Complete | 2026-02-27 |
| 69. Infrastructure Foundation | v1.11 | 0/? | Not started | - |
| 70. Catalog Page & Site Shell | v1.11 | 0/? | Not started | - |
| 71. Pattern Detail Pages | v1.11 | 0/? | Not started | - |
| 72. Comparison, Interactivity & Integration | v1.11 | 0/? | Not started | - |
| 73. Verification & Audit | v1.11 | 0/? | Not started | - |
