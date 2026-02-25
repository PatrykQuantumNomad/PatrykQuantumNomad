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
- 🚧 **v1.8 EDA Visual Encyclopedia** - Phases 48-55 (in progress)

## Phases

<details>
<summary>v1.0 through v1.7 (Phases 1-47) - SHIPPED</summary>

Phases 1-47 delivered across milestones v1.0-v1.7. 403 requirements, 103 plans completed.
See `.planning/milestones/` for detailed archives.

</details>

### 🚧 v1.8 EDA Visual Encyclopedia (In Progress)

**Milestone Goal:** Modernize NIST/SEMATECH Engineering Statistics Handbook Chapter 1 as a complete interactive pillar section with 90+ pages, build-time SVG plots, Python code examples, KaTeX formulas, and D3.js distribution parameter explorers.

**Phase Numbering:**
- Integer phases (48, 49, ...): Planned milestone work
- Decimal phases (48.1, 48.2): Urgent insertions (marked with INSERTED)

- [x] **Phase 48: Infrastructure Foundation** - KaTeX pipeline, D3 isolation, OG caching, Zod schemas, EDA layout, content collections, technique template, breadcrumbs (completed 2026-02-24)
- [x] **Phase 49: Data Model + Schema Population** - Populate techniques.json, distributions.json, MDX stubs, sample datasets, cross-link validation (completed 2026-02-25)
- [x] **Phase 50: SVG Generator Library** - Build-time TypeScript SVG generators for all statistical chart types (completed 2026-02-25)
- [x] **Phase 51: Graphical Technique Pages** - 29 graphical technique pages with Tier A/B interactivity and PlotVariantSwap component (completed 2026-02-25)
- [ ] **Phase 52: Quantitative Techniques + Foundations** - 18 quantitative technique pages with KaTeX formulas and Python code, 6 foundation pages
- [ ] **Phase 53: Distribution Pages with D3 Explorers** - 19 distribution pages with D3 interactive parameter explorers and static SVG fallbacks
- [ ] **Phase 54: Case Studies + Reference + Landing Page** - 9 case study walkthroughs, 4 reference pages, complete landing page with category filtering
- [ ] **Phase 55: Site Integration + SEO + Polish** - Header nav, homepage callout, JSON-LD, OG images, companion blog post, Lighthouse audit, accessibility

## Phase Details

### Phase 48: Infrastructure Foundation
**Goal**: The EDA infrastructure is validated end-to-end -- KaTeX renders formulas without build errors, D3 loads only on distribution pages, OG images cache correctly, content collections accept technique/distribution data, and the EDA layout isolates animations from the rest of the site
**Depends on**: Phase 47 (v1.7 complete)
**Requirements**: INFRA-01, INFRA-02, INFRA-03, INFRA-04, INFRA-05, INFRA-06, INFRA-07, INFRA-08, INFRA-09, INFRA-10, INFRA-11
**Success Criteria** (what must be TRUE):
  1. A test page at /eda/test-formulas/ renders 10+ NIST formula categories (summations, integrals, fractions, Greek symbols, matrices) without build errors
  2. Vite bundle analysis confirms D3 modules appear only in distribution page chunks and not in any other EDA page
  3. Building the site with OG image caching skips regeneration for unchanged pages (measured build time delta)
  4. Content collections accept a sample technique entry and a sample distribution entry through Zod validation without errors
  5. Navigating Home > EDA test page > Blog > EDA test page > Home (5 cycles) produces no console errors or animation leaks
**Plans**: 3 plans

Plans:
- [x] 48-01-PLAN.md — KaTeX pipeline, EDA layout, technique template, breadcrumbs, and formula test page
- [x] 48-02-PLAN.md — Zod schemas, content collections, sample data, and OG image caching
- [x] 48-03-PLAN.md — D3 micro-modules, bundle isolation verification, and navigation lifecycle check

### Phase 49: Data Model + Schema Population
**Goal**: The complete data model for all 90+ EDA pages exists as validated JSON and MDX stubs, with every technique tagged by interactivity tier, every cross-link slug verified against the route structure, and sample datasets ready for SVG generation
**Depends on**: Phase 48
**Requirements**: DATA-01, DATA-02, DATA-03, DATA-04, DATA-05, DATA-06, DATA-07, DATA-08, DATA-09
**Success Criteria** (what must be TRUE):
  1. techniques.json contains 47 entries (29 graphical + 18 quantitative) that pass Zod schema validation with zero errors
  2. distributions.json contains 19 entries with PDF/CDF formulas and parameter definitions that pass Zod schema validation
  3. All MDX stub files exist for 6 foundations, 9 case studies, and 4 reference pages with valid frontmatter and NIST section references
  4. Every cross-linking slug in the data files resolves to a valid route in the Astro page structure, with correct category-based route prefixes
  5. Sample datasets in datasets.ts produce plottable numeric arrays meeting minimum size requirements for at least 5 representative chart types
**Plans**: 3 plans

Plans:
- [x] 49-01-PLAN.md — Populate techniques.json with 47 entries (29 graphical + 18 quantitative) with tier assignments and cross-links
- [x] 49-02-PLAN.md — Populate distributions.json with 19 probability distribution entries with KaTeX PDF/CDF formulas
- [x] 49-03-PLAN.md — MDX stubs (19 files), sample datasets, route map, and route-aware cross-link validation script

### Phase 50: SVG Generator Library
**Goal**: A complete library of build-time TypeScript SVG generators produces publication-quality statistical charts for every chart type needed across the encyclopedia, styled to the Quantum Explorer palette and verified in both dark and light themes
**Depends on**: Phase 49
**Requirements**: SVG-01, SVG-02, SVG-03, SVG-04, SVG-05, SVG-06, SVG-07, SVG-08, SVG-09, SVG-10, SVG-11, SVG-12, SVG-13, SVG-14, SVG-15
**Success Criteria** (what must be TRUE):
  1. Each of the 15 SVG generator functions produces valid SVG markup from sample NIST data without runtime errors
  2. All generated SVGs use viewBox (no fixed width/height) and scale correctly from 320px to 1440px viewport widths
  3. All generated SVGs render with readable labels, axes, and data points in both dark mode and light mode
  4. The composite 4-plot and 6-plot generators correctly compose individual chart generators into multi-panel layouts
  5. Distribution curve generator produces both PDF and CDF curves for at least 3 representative distributions (normal, exponential, chi-square)
**Plans**: 3 plans

Plans:
- [x] 50-01-PLAN.md — Plot base foundation, statistics math module, dark mode CSS, histogram, box plot, and bar plot generators
- [x] 50-02-PLAN.md — Scatter plot, line plot, lag plot, probability plot, spectral plot, and star plot generators
- [x] 50-03-PLAN.md — Contour plot, distribution curves, composite 4-plot/6-plot layouts, and barrel export index

### Phase 51: Graphical Technique Pages
**Goal**: All 29 graphical technique pages are live with build-time SVG plots, interpretation prose, related technique links, and Tier B pages offer interactive SVG variant switching via the PlotVariantSwap component for pattern exploration
**Depends on**: Phase 50
**Requirements**: GRAPH-01, GRAPH-02, GRAPH-03, GRAPH-04, GRAPH-05, GRAPH-06, GRAPH-07, GRAPH-08, GRAPH-09, GRAPH-10, GRAPH-11, GRAPH-12, GRAPH-13, GRAPH-14, GRAPH-15, GRAPH-16, GRAPH-17, GRAPH-18, GRAPH-19, GRAPH-20, GRAPH-21, GRAPH-22, GRAPH-23, GRAPH-24, GRAPH-25, GRAPH-26, GRAPH-27, GRAPH-28, GRAPH-29, GRAPH-30, LAND-05
**Success Criteria** (what must be TRUE):
  1. All 29 graphical technique pages render at their defined URLs with build-time SVG plots, 200+ words of explanatory prose, and NIST section citations
  2. Tier B pages (histogram, scatter, normal probability, lag, autocorrelation, spectral) display working tab-based SVG variant switching with vanilla JS (~3KB)
  3. Every technique page displays breadcrumb navigation (EDA > Techniques > [Technique Name]) and links to related techniques
  4. Build-time SVG thumbnails render on technique cards for the landing page grid
**Plans**: 3 plans

Plans:
- [x] 51-01-PLAN.md — PlotVariantSwap component and technique-renderer slug-to-generator mapping with Tier B variant datasets
- [x] 51-02-PLAN.md — Prose content module with 200+ words per technique for all 29 graphical techniques
- [x] 51-03-PLAN.md — Dynamic [slug].astro route, TechniquePage cross-link fix, and SVG thumbnail utility

### Phase 52: Quantitative Techniques + Foundations
**Goal**: All 18 quantitative technique pages display properly typeset KaTeX formulas with Python code examples, and all 6 foundation pages provide the conceptual framework that contextualizes the entire encyclopedia
**Depends on**: Phase 50, Phase 48 (KaTeX pipeline)
**Requirements**: QUANT-01, QUANT-02, QUANT-03, QUANT-04, QUANT-05, QUANT-06, QUANT-07, QUANT-08, QUANT-09, QUANT-10, QUANT-11, QUANT-12, QUANT-13, QUANT-14, QUANT-15, QUANT-16, QUANT-17, QUANT-18, FOUND-01, FOUND-02, FOUND-03, FOUND-04, FOUND-05, FOUND-06, SITE-13
**Success Criteria** (what must be TRUE):
  1. All 18 quantitative technique pages render KaTeX formulas correctly (verified character-by-character against NIST source for representative samples)
  2. Python code examples on quantitative pages use matplotlib/seaborn/scipy and include copy buttons via astro-expressive-code
  3. All 6 foundation pages render from MDX content with NIST section references and cross-links to relevant technique pages
  4. Cross-links between quantitative techniques, graphical techniques, and foundation pages are all functional
**Plans**: 3 plans

Plans:
- [ ] 52-01-PLAN.md — Quantitative content module and dynamic route for 18 KaTeX + Python technique pages
- [ ] 52-02-PLAN.md — Populate 6 foundation MDX stubs and create foundation dynamic route
- [ ] 52-03-PLAN.md — Cross-link validation, build verification, and visual review of all 24 new pages

### Phase 53: Distribution Pages with D3 Explorers
**Goal**: All 19 distribution pages offer both static SVG fallbacks (for no-JS users) and interactive D3 parameter explorers that let users adjust distribution parameters and see PDF/CDF curves update in real time
**Depends on**: Phase 50 (distribution curve SVG generator), Phase 48 (D3 isolation)
**Requirements**: DIST-01, DIST-02, DIST-03, DIST-04, DIST-05, DIST-06, DIST-07, DIST-08, DIST-09, DIST-10, DIST-11, DIST-12, DIST-13, DIST-14, DIST-15, DIST-16, DIST-17, DIST-18, DIST-19
**Success Criteria** (what must be TRUE):
  1. All 19 distribution pages render at their defined URLs with static build-time SVG fallbacks visible before JavaScript loads
  2. The DistributionExplorer.tsx React island loads via client:visible and displays parameter sliders that update PDF+CDF curves in real time on all 19 pages
  3. D3 bundle (d3-selection, d3-axis, d3-scale, d3-shape) loads only on distribution pages -- verified by checking network tab on a non-distribution EDA page
  4. The distribution landing page at /eda/distributions/ displays a browsable grid with shape preview thumbnails for all 19 distributions
  5. Parameter explorers are touch-friendly (sliders work on mobile) and handle resize events without duplicate chart instances
**Plans**: TBD

Plans:
- [ ] 53-01: TBD
- [ ] 53-02: TBD
- [ ] 53-03: TBD

### Phase 54: Case Studies + Reference + Landing Page
**Goal**: The encyclopedia is content-complete with 9 case study walkthroughs demonstrating EDA methodology on real NIST datasets, 4 reference pages providing lookup tables and technique taxonomies, and the landing page offering filterable discovery across all 90+ pages
**Depends on**: Phase 51, Phase 52, Phase 53
**Requirements**: CASE-01, CASE-02, CASE-03, CASE-04, CASE-05, CASE-06, CASE-07, CASE-08, CASE-09, REF-01, REF-02, REF-03, REF-04, LAND-01, LAND-02, LAND-03, LAND-04, LAND-06, LAND-07
**Success Criteria** (what must be TRUE):
  1. All 9 case study pages render with sequential analysis walkthroughs, embedded SVG plots from technique generators, and NIST section citations
  2. All 4 reference pages render with functional cross-links to technique and distribution pages
  3. The landing page at /eda/ displays a filterable card grid with category pills (All, Graphical, Quantitative, Distributions, Case Studies, Reference) that filter cards in real time
  4. The landing page card grid is responsive (3-col desktop, 2-col tablet, 1-col mobile) with section navigation and NIST section references on each card
**Plans**: TBD

Plans:
- [ ] 54-01: TBD
- [ ] 54-02: TBD
- [ ] 54-03: TBD

### Phase 55: Site Integration + SEO + Polish
**Goal**: The EDA Visual Encyclopedia is fully integrated into the site with header navigation, homepage callout, structured data, OG images, companion blog post, and verified Lighthouse/accessibility scores -- ready for staged publication
**Depends on**: Phase 54
**Requirements**: SITE-01, SITE-02, SITE-03, SITE-04, SITE-05, SITE-06, SITE-07, SITE-08, SITE-09, SITE-10, SITE-11, SITE-12, QUAL-01, QUAL-02, QUAL-03, QUAL-04
**Success Criteria** (what must be TRUE):
  1. "EDA" link appears in Header.astro navigation and homepage displays a callout card linking to /eda/
  2. Every EDA page has unique SEO meta description, JSON-LD structured data (TechArticle/LearningResource), and appears in the sitemap
  3. Build-time OG images generate for the EDA overview and key section pages; LLMs.txt includes EDA section
  4. Companion blog post is published with bidirectional cross-links to EDA pages
  5. Lighthouse 90+ verified on one representative page from each tier (A: static SVG, B: SVG swap, C: D3 explorer) and WCAG 2.1 AA accessibility passes (role="img" + aria-label on SVGs, keyboard nav)
**Plans**: TBD

Plans:
- [ ] 55-01: TBD
- [ ] 55-02: TBD
- [ ] 55-03: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 48 → 49 → 50 → 51 → 52 → 53 → 54 → 55

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
| 48. Infrastructure Foundation | v1.8 | 3/3 | Complete | 2026-02-24 |
| 49. Data Model + Schema Population | v1.8 | 3/3 | Complete | 2026-02-25 |
| 50. SVG Generator Library | v1.8 | 3/3 | Complete | 2026-02-25 |
| 51. Graphical Technique Pages | v1.8 | 3/3 | Complete | 2026-02-25 |
| 52. Quantitative Techniques + Foundations | 2/3 | In Progress|  | - |
| 53. Distribution Pages with D3 Explorers | v1.8 | 0/3 | Not started | - |
| 54. Case Studies + Reference + Landing Page | v1.8 | 0/3 | Not started | - |
| 55. Site Integration + SEO + Polish | v1.8 | 0/3 | Not started | - |
| **Total** | **v1.0-v1.8** | **115/127** | **In progress** | |
