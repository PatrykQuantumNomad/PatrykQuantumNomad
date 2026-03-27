# Roadmap: patrykgolabek.dev

## Milestones

- v1.0 through v1.16: Shipped (see MILESTONES.md)
- v1.17 EDA Jupyter Notebooks: Shipped (Phases 96-101)
- **v1.18 AI Landscape Explorer** - Phases 102-110 (in progress)

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

<details>
<summary>v1.17 EDA Jupyter Notebooks (Phases 96-101) - SHIPPED 2026-03-15</summary>

- [x] **Phase 96: Notebook Foundation** - TypeScript nbformat v4.5 types, cell factories, case study registry, and requirements.txt template (completed 2026-03-14)
- [x] **Phase 97: Standard Case Study Notebooks** - 7 standard-template notebooks with parameterized 4-plot analysis, hypothesis tests, and interpretation (completed 2026-03-14)
- [x] **Phase 98: Packaging Pipeline** - ZIP packaging with archiver, Astro build integration hook, and static file serving (completed 2026-03-14)
- [x] **Phase 99: Download UI and Colab Integration** - Download buttons on case study pages, Open in Colab badges, and committed .ipynb files for Colab GitHub URLs (completed 2026-03-15)
- [x] **Phase 100: Advanced Case Study Notebooks** - 3 complex notebooks: sinusoidal model fitting, AR(1) development, and DOE multi-factor analysis (completed 2026-03-15)
- [x] **Phase 101: Site Integration** - Notebooks landing page, companion blog post, LLMs.txt update, sitemap inclusion, and OG image (completed 2026-03-15)

</details>

### v1.18 AI Landscape Explorer

- [x] **Phase 102: Data Foundation** - DOT-to-JSON extraction, Zod schema, two-tier educational content for ~80 nodes, content collection registration (completed 2026-03-26)
- [x] **Phase 103: SEO Concept Pages** - Individual /ai-landscape/[slug] pages with structured data, breadcrumbs, and OG images (completed 2026-03-26)
- [ ] **Phase 104: Static Landing Page & Force Layout** - Build-time force simulation, static SVG fallback, landing page with legend and concept list
- [x] **Phase 105: Interactive Graph Core** - D3 force-directed React island with pan/zoom, tooltips, and edge labels (completed 2026-03-27)
- [x] **Phase 106: Detail Panel & Node Selection** - Side panel (desktop) and bottom sheet (mobile) with ELI5 toggle, grouped relationships, and ancestry path highlighting (completed 2026-03-27)
- [ ] **Phase 107: Search, Navigation & Deep Links** - Search autocomplete, mobile-responsive layout, shareable URL state, keyboard navigation
- [ ] **Phase 108: Guided Tours & Compare Mode** - Curated learning paths with tour UI, side-by-side comparison, and VS pages
- [ ] **Phase 109: Graph Polish** - Cluster zoom, animated edge traversal, and mini-map
- [ ] **Phase 110: Site Integration** - Header nav, homepage callout, sitemap, LLMs.txt, companion blog post, and landing OG image

## Phase Details

### Phase 102: Data Foundation
**Goal**: Establish the canonical data model that every downstream phase builds on — graph, pages, panel, and SEO all consume this data
**Depends on**: Nothing (first phase of v1.18)
**Requirements**: DATA-01, DATA-02, DATA-03, DATA-04, DATA-05
**Success Criteria** (what must be TRUE):
  1. ✅ A TypeScript/JSON data model exists with 51 concept nodes (plus ~32 grouped examples) containing slug, name, cluster membership, and edge relationships extracted from the DOT file
  2. ✅ Zod schema validates every node with required fields: slug, name, cluster, simpleDescription, technicalDescription; relationships computed via getNodeRelationships() helper from edges array
  3. ✅ Every node has two tiers of hand-crafted educational content — a plain-English "simple" description and a "technical" description — each at least 100 words
  4. ✅ Edge data preserves labeled relationship types from the DOT file ("subset of", "enables", "e.g.", "powers", "characterized by") across 66 edges
  5. ✅ Content collection is registered in Astro config with file() loader and a test build confirms all nodes are accessible via getCollection('aiLandscape')
**Plans:** 3/3 plans complete

Plans:
- [x] 102-01-PLAN.md — Schema definitions, graph.json (clusters + edges), content collection registration, tests
- [x] 102-02-PLAN.md — Content authoring: AI, ML, NN, DL cluster nodes (~26 nodes)
- [x] 102-03-PLAN.md — Content authoring: GenAI, Levels, Agentic, DevTools, MCP nodes (~25 nodes) + content quality tests

### Phase 103: SEO Concept Pages
**Goal**: Every AI concept has its own indexable page delivering search value before the interactive graph exists
**Depends on**: Phase 102
**Requirements**: SEO-01, SEO-02, SEO-03, SEO-04
**Success Criteria** (what must be TRUE):
  1. Visiting /ai-landscape/[slug]/ for any concept renders a complete page with both explanation tiers, ancestry breadcrumb, related concepts list, and a link back to the graph landing page
  2. Each concept page includes JSON-LD DefinedTerm and BreadcrumbList structured data that passes the Google Rich Results Test
  3. Each concept page has a build-time OG image using a shared template showing the concept name and cluster color
  4. Production build generates ~80 static concept pages without errors
**Plans:** 3/3 plans complete

Plans:
- [x] 103-01-PLAN.md — Utility functions (ancestry.ts, routes.ts), unit tests, DefinedTermJsonLd component
- [x] 103-02-PLAN.md — Dynamic [slug].astro concept page route with AncestryBreadcrumb and RelatedConcepts components
- [x] 103-03-PLAN.md — OG image generator function and build-time endpoint for 51 concept images
**UI hint**: yes

### Phase 104: Static Landing Page & Force Layout
**Goal**: Users can visit /ai-landscape/ and see the full AI landscape as a static, color-coded SVG with a navigable concept list — no JavaScript required
**Depends on**: Phase 102
**Requirements**: GRAPH-08, GRAPH-02, GRAPH-07, SITE-01
**Success Criteria** (what must be TRUE):
  1. A build-time script runs d3-force headlessly (~300 ticks) and produces a deterministic layout.json with x/y positions for all nodes
  2. The /ai-landscape/ landing page renders a static SVG from layout.json with cluster-colored nodes matching the DOT hierarchy (cyan, green, yellow, amber, pink, purple, blue, grey) and dark mode equivalents
  3. A color-coded legend on the landing page explains cluster colors, node shapes, and edge styles
  4. The landing page includes a category-grouped concept list linking to individual /ai-landscape/[slug]/ pages
  5. The static SVG is the first meaningful paint — visible before any JavaScript loads
**Plans**: 2/2 plans complete

Plans:
- [x] 104-01-PLAN.md — Layout generation pipeline (d3-force prebuild script, layout-schema, SVG builder, tests)
- [x] 104-02-PLAN.md — Landing page assembly (GraphLegend, ConceptList, index.astro, visual checkpoint)
**UI hint**: yes

### Phase 105: Interactive Graph Core
**Goal**: Users can explore the AI landscape as a live, pannable, zoomable force-directed graph rendered from pre-computed positions
**Depends on**: Phase 104
**Requirements**: GRAPH-01, GRAPH-03, GRAPH-04, GRAPH-05, GRAPH-06
**Success Criteria** (what must be TRUE):
  1. A React island (client:only="react") renders the ~80 nodes as an interactive SVG force-directed graph from pre-computed layout.json positions
  2. Users can pan (drag) and zoom (mouse wheel on desktop, pinch on mobile) without accidentally trapping page scroll — modifier key guard is active
  3. A zoom-to-fit reset button returns the viewport to the full graph overview
  4. Hovering over any node shows a tooltip with the concept's brief description
  5. Edge labels are visible — "subset of" backbone edges always shown, other relationship labels appear on hover
**Plans**: 2 plans

Plans:
- [x] 105-01-PLAN.md — Install d3-zoom, graph-data.ts types, InteractiveGraph.tsx with pan/zoom/modifier key guard/zoom reset
- [x] 105-02-PLAN.md — Node tooltips, edge labels (backbone + hover), wire into index.astro with noscript fallback, visual checkpoint
**UI hint**: yes

### Phase 106: Detail Panel & Node Selection
**Goal**: Users can click any node to learn about that AI concept in context, with progressive disclosure and ancestry navigation
**Depends on**: Phase 105
**Requirements**: PANEL-01, PANEL-02, PANEL-03, PANEL-04, PANEL-05
**Success Criteria** (what must be TRUE):
  1. Clicking a node on desktop opens a slide-out side panel showing the concept title, explanation, grouped relationships, and a link to the full concept page
  2. The "Explain Like I'm 5" toggle switches between simple and technical descriptions, defaulting to simple
  3. Clicking "How did we get here?" highlights the full ancestry chain on the graph (e.g., GPT-4o -> LLM -> GenAI -> DL -> NN -> ML -> AI)
  4. Relationships in the panel are grouped by type: "Part of", "Includes", "Enables", "Examples"
  5. On mobile (below 768px), the detail panel renders as a bottom sheet instead of a side panel
**Plans**: 2 plans

Plans:
- [x] 106-01-PLAN.md — Relationship grouper helper, useMediaQuery hook, DetailPanel presentational component
- [x] 106-02-PLAN.md — BottomSheet wrapper, selection state + click handler + ancestry highlighting in InteractiveGraph, responsive panel/sheet switching, visual checkpoint
**UI hint**: yes

### Phase 107: Search, Navigation & Deep Links
**Goal**: Users can find any concept instantly via search, navigate the graph with keyboard, and share specific concept views via URL
**Depends on**: Phase 106
**Requirements**: NAV-01, NAV-02, SEO-05, SEO-06
**Success Criteria** (what must be TRUE):
  1. A search autocomplete field filters nodes by name — selecting a result zooms the graph to that node and opens its detail panel
  2. The graph layout is fully responsive: full-width graph with side panel on desktop, bottom sheet on mobile, and a readable experience at 350px width
  3. Selecting a node updates the URL to /ai-landscape?node=[slug] and visiting that URL restores the selection, zoom, and panel state
  4. Keyboard navigation works: arrow keys traverse edges between nodes, Enter selects/opens panel, Escape deselects, Tab cycles through nodes
**Plans**: 2 plans
- [x] 107-01-PLAN.md — New utility files: graph-navigation.ts, useUrlNodeState.ts, SearchBar.tsx
- [ ] 107-02-PLAN.md — Integrate search, keyboard nav, URL deep links, and zoom-to-node into InteractiveGraph
**UI hint**: yes

### Phase 108: Guided Tours & Compare Mode
**Goal**: Non-technical users can follow curated learning paths through the landscape, and curious users can compare concepts side by side
**Depends on**: Phase 107
**Requirements**: NAV-03, NAV-04, SEO-07, SEO-08
**Success Criteria** (what must be TRUE):
  1. At least 3 guided learning paths are available ("The Big Picture", "How ChatGPT Works", "What is Agentic AI") that step through a curated sequence of nodes
  2. The tour UI shows a progress indicator, next/previous controls, and highlights the current node plus its connections on the graph
  3. Selecting two concepts activates a side-by-side comparison view showing both descriptions, relationships, and ancestry paths
  4. Popular comparisons have dedicated VS pages at /ai-landscape/vs/[slug1]-vs-[slug2] with structured data and OG images
**Plans**: TBD
**UI hint**: yes

### Phase 109: Graph Polish
**Goal**: The graph experience feels premium with cluster zoom, animated edge highlighting, and spatial orientation aids
**Depends on**: Phase 105
**Requirements**: GRAPH-09, GRAPH-10, GRAPH-11
**Success Criteria** (what must be TRUE):
  1. Clicking a cluster label in the legend zooms the viewport smoothly into that cluster's region of the graph
  2. When a node is selected, a GSAP-animated pulse travels along the edges connecting it to its parent and child nodes
  3. A mini-map in the corner (desktop only) shows the full graph with a highlighted rectangle indicating the current viewport position
**Plans**: TBD
**UI hint**: yes

### Phase 110: Site Integration
**Goal**: The AI Landscape Explorer is fully woven into the site — discoverable from every navigation path, indexed by search engines, and announced via blog post
**Depends on**: Phase 103, Phase 104
**Requirements**: SITE-02, SITE-03, SITE-04, SITE-05, SITE-06, SITE-07
**Success Criteria** (what must be TRUE):
  1. The site header navigation includes an "AI Landscape" link that navigates to /ai-landscape/
  2. The homepage features a callout card linking to the AI Landscape Explorer
  3. All AI Landscape pages (landing + ~80 concept pages + VS pages) appear in the sitemap
  4. LLMs.txt includes entries describing the AI Landscape section and its key concepts
  5. A companion blog post about navigating the AI landscape for non-technical readers is published with cross-links to the explorer and concept pages
**Plans**: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 102 -> 103 -> 104 -> 105 -> 106 -> 107 -> 108 -> 109 -> 110
Note: Phases 103 and 104 both depend only on 102 and could execute in parallel. Phase 110 depends on 103 and 104.

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 102. Data Foundation | 3/3 | Complete   | 2026-03-26 |
| 103. SEO Concept Pages | 3/3 | Complete   | 2026-03-26 |
| 104. Static Landing Page & Force Layout | 2/2 | Complete   | 2026-03-27 |
| 105. Interactive Graph Core | 2/2 | Complete   | 2026-03-27 |
| 106. Detail Panel & Node Selection | 2/2 | Complete   | 2026-03-27 |
| 107. Search, Navigation & Deep Links | 1/2 | In Progress|  |
| 108. Guided Tours & Compare Mode | 0/? | Not started | - |
| 109. Graph Polish | 0/? | Not started | - |
| 110. Site Integration | 0/? | Not started | - |
