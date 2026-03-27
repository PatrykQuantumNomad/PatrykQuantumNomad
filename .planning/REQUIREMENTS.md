# Requirements: patrykgolabek.dev

**Defined:** 2026-03-26
**Core Value:** The site must be fast, fully SEO-optimized, and visually distinctive — a portfolio that ranks well in search engines and makes a memorable impression on recruiters, collaborators, and the developer community.

## v1.18 Requirements

Requirements for milestone v1.18 AI Landscape Explorer. Each maps to roadmap phases.

### Data Foundation

- [x] **DATA-01**: DOT file converted to canonical TypeScript/JSON data model with 51 concept nodes + ~32 grouped examples, cluster membership, and 66 edge relationships
- [x] **DATA-02**: Zod-validated content collection schema for AI landscape concepts (slug, name, cluster, simpleDescription, technicalDescription, whyItMatters, examples); relationships computed via helper function from edges array
- [x] **DATA-03**: Two-tier educational content (simple + technical) written for all 51 concept nodes in plain English for non-technical audience
- [x] **DATA-04**: Edge data preserves relationship labels from DOT file ("subset of", "enables", "e.g.", "powers", "characterized by")
- [x] **DATA-05**: Content collection registered in Astro config with file() loader

### Interactive Graph

- [x] **GRAPH-01**: D3 force-directed graph renders ~80 nodes as SVG with spatial clustering
- [x] **GRAPH-02**: Cluster coloring matches DOT hierarchy (cyan=AI, green=ML, yellow=NN, amber=DL, pink=GenAI, purple=Agentic, blue=DevTools, grey=Levels) with dark mode equivalents
- [x] **GRAPH-03**: Pan and zoom via d3-zoom supporting both mouse (wheel+drag) and touch (pinch+swipe)
- [x] **GRAPH-04**: Zoom-to-fit reset button to return to full overview
- [x] **GRAPH-05**: Node hover tooltips showing brief description
- [x] **GRAPH-06**: Edge labels visible for key relationships ("subset of" backbone always shown, others on hover)
- [ ] **GRAPH-07**: Color-coded legend explaining cluster colors, node shapes, and edge styles
- [x] **GRAPH-08**: Static SVG fallback pre-computed at build time for instant first paint before JS hydrates
- [ ] **GRAPH-09**: Cluster zoom — click cluster label to zoom into that area
- [ ] **GRAPH-10**: Animated edge traversal — GSAP pulse along edges connecting selected node to parents/children
- [ ] **GRAPH-11**: Mini-map overview in corner showing current viewport position (desktop only)

### Detail Panel

- [x] **PANEL-01**: Click node opens slide-out side panel with title, explanation, relationships, and link to full page
- [x] **PANEL-02**: "Explain Like I'm 5" toggle switches between simple and technical descriptions (simple is default)
- [x] **PANEL-03**: "How did we get here?" ancestry path — clicking any node highlights the full hierarchy chain (e.g., GPT-4o → LLM → GenAI → DL → NN → ML → AI)
- [x] **PANEL-04**: Relationships grouped by type in panel ("Part of", "Includes", "Enables", "Examples")
- [x] **PANEL-05**: Bottom sheet layout on mobile instead of side panel

### SEO Pages

- [x] **SEO-01**: Individual /ai-landscape/[slug] page for each of the ~80 concepts
- [x] **SEO-02**: Each concept page shows full explanation (both tiers), ancestry breadcrumb, related concepts, and link back to graph
- [x] **SEO-03**: JSON-LD DefinedTerm + BreadcrumbList structured data on each concept page
- [x] **SEO-04**: Build-time OG image per concept (shared template with concept name + cluster color)
- [ ] **SEO-05**: Shareable deep links — URL updates with selected node (/ai-landscape?node=LLM)
- [ ] **SEO-06**: Keyboard navigation — arrow keys traverse edges, Enter selects, Escape deselects, Tab through nodes
- [ ] **SEO-07**: Compare mode — select two concepts for side-by-side comparison
- [ ] **SEO-08**: VS pages at /ai-landscape/vs/[slug1]-vs-[slug2] for popular comparisons

### Search & Navigation

- [ ] **NAV-01**: Search autocomplete that filters nodes — on select, zooms to node and opens panel
- [ ] **NAV-02**: Mobile-responsive layout — full-width graph on mobile, detail as bottom sheet
- [ ] **NAV-03**: Guided learning paths — 3-4 curated tours ("The Big Picture", "How ChatGPT Works", "What is Agentic AI")
- [ ] **NAV-04**: Tour UI with progress indicator, next/prev controls, sequential node highlighting

### Site Integration

- [ ] **SITE-01**: Landing page at /ai-landscape/ with graph embed and category-grouped concept list
- [ ] **SITE-02**: Header navigation link for AI Landscape
- [ ] **SITE-03**: Homepage callout card linking to AI Landscape
- [ ] **SITE-04**: All AI Landscape pages in sitemap
- [ ] **SITE-05**: LLMs.txt entries for AI Landscape section
- [ ] **SITE-06**: Companion blog post about navigating the AI landscape for non-technical readers
- [ ] **SITE-07**: Build-time OG image for landing page

## Future Requirements

### Enhancements

- **FUT-01**: Auto-updating concept descriptions from curated feeds
- **FUT-02**: User-submitted concept corrections via GitHub Issues
- **FUT-03**: Collection download (landscape poster PDF)
- **FUT-04**: Additional guided tour paths based on user feedback

## Out of Scope

| Feature | Reason |
|---------|--------|
| 3D graph visualization | Disorienting for non-technical users, GPU contention with HeadScene |
| Real-time DOT parsing at build time | Fragile; use pre-processed JSON instead |
| User-editable graph / drag-to-rearrange | Educational tool, not a graph editor |
| Auto-updating from live APIs | Stale data risk; curated content is the value |
| Quiz / gamification | Patronizing to target audience (managers, recruiters) |
| Chat / AI assistant integration | Write excellent static explanations instead |
| Complex filtering / faceted search | Graph clustering is the visual filter for ~80 nodes |
| Physics simulation controls | Meaningless to non-technical users |
| In-browser Python/Pyodide | Not relevant to AI landscape content |
| Infinite scroll concept list | Terrible for SEO; individual pages per concept |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| DATA-01 | Phase 102 | Complete |
| DATA-02 | Phase 102 | Complete |
| DATA-03 | Phase 102 | Complete |
| DATA-04 | Phase 102 | Complete |
| DATA-05 | Phase 102 | Complete |
| GRAPH-01 | Phase 105 | Complete |
| GRAPH-02 | Phase 104 | Complete |
| GRAPH-03 | Phase 105 | Complete |
| GRAPH-04 | Phase 105 | Complete |
| GRAPH-05 | Phase 105 | Complete |
| GRAPH-06 | Phase 105 | Complete |
| GRAPH-07 | Phase 104 | Pending |
| GRAPH-08 | Phase 104 | Complete |
| GRAPH-09 | Phase 109 | Pending |
| GRAPH-10 | Phase 109 | Pending |
| GRAPH-11 | Phase 109 | Pending |
| PANEL-01 | Phase 106 | Complete |
| PANEL-02 | Phase 106 | Complete |
| PANEL-03 | Phase 106 | Complete |
| PANEL-04 | Phase 106 | Complete |
| PANEL-05 | Phase 106 | Complete |
| SEO-01 | Phase 103 | Complete |
| SEO-02 | Phase 103 | Complete |
| SEO-03 | Phase 103 | Complete |
| SEO-04 | Phase 103 | Complete |
| SEO-05 | Phase 107 | Pending |
| SEO-06 | Phase 107 | Pending |
| SEO-07 | Phase 108 | Pending |
| SEO-08 | Phase 108 | Pending |
| NAV-01 | Phase 107 | Pending |
| NAV-02 | Phase 107 | Pending |
| NAV-03 | Phase 108 | Pending |
| NAV-04 | Phase 108 | Pending |
| SITE-01 | Phase 104 | Pending |
| SITE-02 | Phase 110 | Pending |
| SITE-03 | Phase 110 | Pending |
| SITE-04 | Phase 110 | Pending |
| SITE-05 | Phase 110 | Pending |
| SITE-06 | Phase 110 | Pending |
| SITE-07 | Phase 110 | Pending |

**Coverage:**
- v1.18 requirements: 40 total
- Mapped to phases: 40
- Unmapped: 0

---
*Requirements defined: 2026-03-26*
*Last updated: 2026-03-26 after roadmap creation*
