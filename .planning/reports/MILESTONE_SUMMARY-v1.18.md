# Milestone v1.18 — AI Landscape Explorer

**Generated:** 2026-04-08
**Purpose:** Team onboarding and project review

---

## 1. Project Overview

**patrykgolabek.dev** is a personal portfolio, blog, and interactive tools site for Patryk Golabek, a Cloud-Native Software Architect with 17+ years of experience. Built with Astro 5, deployed on GitHub Pages.

**Milestone v1.18** added an **AI Landscape Explorer** — an interactive, explorable map that helps non-technical users understand how AI concepts relate to each other. The explorer provides:

- A D3 force-directed graph of **51 AI concepts** across 9 clusters (AI, ML, Neural Networks, Deep Learning, GenAI, Agentic AI, DevTools, Levels, MCP)
- **51 individual concept pages** with two-tier explanations (simple + technical), structured data, and OG images
- **Guided tours** ("The Big Picture", "How ChatGPT Works", "What is Agentic AI")
- **Side-by-side comparisons** with 12 dedicated VS pages
- Full keyboard navigation, search autocomplete, URL deep links
- Mobile-responsive design with bottom sheet on small screens

All 9 phases complete. All 40 requirements shipped. Zero requirements dropped or adjusted.

---

## 2. Architecture & Technical Decisions

- **Pre-computed layout via headless d3-force** (300 ticks at build time → `layout.json`)
  - Why: Deterministic, instant first paint as static SVG before JS hydrates
  - Phase: 104

- **React island with `client:only="react"` for interactive graph**
  - Why: D3-zoom + React state cannot be server-side rendered
  - Phase: 105

- **D3 micro-module imports** (d3-force, d3-zoom, d3-selection) instead of full D3
  - Why: Bundle isolation — ~17KB gzipped total
  - Phase: 105

- **Modifier key guard for zoom** (Ctrl/Cmd + wheel)
  - Why: Prevents accidental page scroll trapping when scrolling past graph
  - Phase: 105

- **Two-file data split**: `nodes.json` (content collection) + `graph.json` (clusters/edges)
  - Why: Astro's `file()` loader needs flat collection; edges/clusters are structural metadata
  - Phase: 102

- **51 nodes instead of ~80 from DOT file** — grouped ~32 product/framework examples under parent concepts
  - Why: Concept nodes are educational; products (GPT-4o, Claude, etc.) are examples, not standalone graph nodes
  - Phase: 102

- **Tour data in TypeScript** (not JSON)
  - Why: Interface co-location and narrative strings benefit from TypeScript types
  - Phase: 108

- **12 curated VS pairs** (not all 1,275 permutations)
  - Why: Focus on common confusions, not combinatorial explosion
  - Phase: 108

- **CSS class-based cluster coloring** with `html.dark` overrides
  - Why: Theme-responsive without SVG regeneration; embedded in React SVG via `dangerouslySetInnerHTML`
  - Phase: 104

- **GSAP edge pulse with `prefers-reduced-motion` skip**
  - Why: Decorative animation respects accessibility settings
  - Phase: 109

- **`history.replaceState`** for URL node state (not `pushState`)
  - Why: Avoids polluting browser back-button history
  - Phase: 107

- **MiniMap is read-only** (no click-to-pan) with `aria-hidden=true`
  - Why: Visual orientation aid, not a navigation control
  - Phase: 109

---

## 3. Phases Delivered

| Phase | Name | Status | One-Liner |
|-------|------|--------|-----------|
| 102 | Data Foundation | Complete | Canonical data model with 51 concept nodes, Zod schema, two-tier content, 66 edges, 400 tests |
| 103 | SEO Concept Pages | Complete | 51 static concept pages with DefinedTerm JSON-LD, OG images, ancestry breadcrumbs |
| 104 | Static Landing Page & Force Layout | Complete | Build-time d3-force layout, static SVG first paint, color-coded legend, concept list |
| 105 | Interactive Graph Core | Complete | React island with pan/zoom, modifier key guard, tooltips, edge labels, noscript fallback |
| 106 | Detail Panel & Node Selection | Complete | Side panel (desktop) / bottom sheet (mobile), ELI5 toggle, ancestry chain highlighting |
| 107 | Search, Navigation & Deep Links | Complete | Search autocomplete, keyboard nav, URL deep links with zoom/panel state restoration |
| 108 | Guided Tours & Compare Mode | Complete | 3 guided tours, compare panel, 12 VS pages with structured data and OG images |
| 109 | Graph Polish | Complete | Cluster zoom, GSAP edge pulse animation, desktop mini-map with viewport tracking |
| 110 | Site Integration | Complete | Header nav, homepage card, sitemap, LLMs.txt, companion blog post |

---

## 4. Requirements Coverage

**40 of 40 requirements shipped. 0 adjusted. 0 dropped.**

### Data Foundation (5/5)
- ✅ DATA-01: DOT → JSON data model with 51 nodes + ~32 grouped examples
- ✅ DATA-02: Zod-validated schema with all required fields
- ✅ DATA-03: Two-tier educational content for all 51 nodes
- ✅ DATA-04: 66 edges with relationship labels preserved
- ✅ DATA-05: Astro content collection with file() loader

### Interactive Graph (11/11)
- ✅ GRAPH-01 through GRAPH-11: Force-directed graph, cluster coloring, pan/zoom, reset, tooltips, edge labels, legend, static fallback, cluster zoom, edge pulse, mini-map

### Detail Panel (5/5)
- ✅ PANEL-01 through PANEL-05: Side panel, ELI5 toggle, ancestry chain, grouped relationships, mobile bottom sheet

### SEO Pages (8/8)
- ✅ SEO-01 through SEO-08: Concept pages, structured data, OG images, deep links, keyboard nav, compare mode, VS pages

### Search & Navigation (4/4)
- ✅ NAV-01 through NAV-04: Search autocomplete, responsive layout, guided tours, tour UI

### Site Integration (7/7)
- ✅ SITE-01 through SITE-07: Landing page, header nav, homepage card, sitemap, LLMs.txt, blog post, OG image

---

## 5. Key Decisions Log

| Decision | Phase | Rationale |
|----------|-------|-----------|
| Group ~32 examples under parent concepts (51 nodes, not ~80) | 102 | Products are illustrative examples, not standalone educational concepts |
| Two-tier content: simple (layperson) + technical (Wikipedia-level) | 102 | Target audience is non-technical; advanced readers need depth |
| Separate graph.json (structure) from nodes.json (content) | 102 | Astro file() loader needs flat arrays; edges are metadata |
| DOT file becomes historical reference after JSON extraction | 102 | JSON is canonical; DOT was input, not source of truth |
| Pre-computed layout.json from headless d3-force | 104 | Deterministic SSR, instant first paint, no runtime simulation |
| CSS class coloring (not inline fill attributes) | 104 | Dark mode via html.dark overrides without SVG regeneration |
| client:only="react" for InteractiveGraph | 105 | d3-zoom + React state incompatible with SSR |
| Ctrl/Cmd+wheel zoom guard | 105 | Page scroll must not be hijacked by embedded graph |
| replaceState (not pushState) for ?node= URL | 107 | Clicking nodes must not pollute browser history |
| 12 curated comparisons (not 1,275 permutations) | 108 | Focus on real confusions people search for |
| Tour data in TypeScript | 108 | Narrative text benefits from type safety and colocation |
| MiniMap read-only with aria-hidden | 109 | Orientation aid, not a navigation surface |

---

## 6. Tech Debt & Deferred Items

### Deferred from v1.18
- **Hub page** (`/guides/`) uses Tailwind dynamic class interpolation for `accentColor` — tech debt from v1.16
- **Beauty Index OG image** "Cannot find module renderers.mjs" error — pre-existing, not introduced by v1.18

### Phase 102 Gaps (documentation-level)
- ROADMAP said ~80 nodes; actual is 51 (documented architectural decision — not a bug)
- ROADMAP said "relationships array" on schema; actual uses `getNodeRelationships()` helper from edges (avoids denormalization)

### Browser Testing Pending
- Phases 105 and 107 flagged HUMAN_NEEDED for 5 browser-only interaction tests each (pan/zoom, touch pinch, keyboard nav, scroll guard behavior)

### Cleanup Candidates
- Unused `nodeMap` useMemo in `InteractiveGraph.tsx` (Phase 105 — dead code)

---

## 7. Getting Started

### Run the project
```bash
npm install
npm run dev        # Dev server at localhost:4321
npm run build      # Production build to dist/
npm run preview    # Preview production build
```

### Key directories for AI Landscape
- **Pages:** `src/pages/ai-landscape/` — landing, concept, VS pages
- **Components:** `src/components/ai-landscape/` �� InteractiveGraph, DetailPanel, BottomSheet, SearchBar, TourBar, MiniMap
- **Library:** `src/lib/ai-landscape/` — data access, ancestry, graph-navigation, tours, comparisons
- **Data:** `src/data/ai-landscape/` — graph.json, nodes.json, layout.json
- **Build scripts:** `scripts/generate-layout.mjs` — pre-computes force layout

### Tests
```bash
npx vitest run     # 47 test files, including 8 for AI Landscape
```

### Where to look first
1. `src/components/ai-landscape/InteractiveGraph.tsx` — main React island (~800 lines)
2. `src/data/ai-landscape/nodes.json` — all 51 concept definitions
3. `src/data/ai-landscape/graph.json` — clusters, edges, examples
4. `scripts/generate-layout.mjs` — headless d3-force simulation
5. `src/pages/ai-landscape/index.astro` — landing page

---

## Stats

- **Timeline:** 2026-03-26 → 2026-03-27 (2 days)
- **Phases:** 9/9 complete
- **Plans:** 25/25 complete
- **Requirements:** 40/40 shipped
- **Commits:** 109
- **Files changed:** 136 (+24,549 / -472)
- **Contributors:** Patryk Golabek
