# Project Research Summary

**Project:** AI Landscape Explorer
**Domain:** Interactive educational knowledge map — force-directed graph with SEO concept pages
**Researched:** 2026-03-26
**Confidence:** HIGH

## Executive Summary

The AI Landscape Explorer converts an existing `ai_landscape.dot` file (~83 nodes, ~120 edges, 7 nested clusters) into two deliverables: (1) a force-directed SVG graph with pan/zoom/click interactions, and (2) ~80 individual static SEO pages, one per AI concept. This is a content and visualization expansion layered onto an existing Astro 5 portfolio site — not a new product — and the existing codebase already provides 90% of the necessary infrastructure: D3 micro-modules, React islands, Nanostores, content collections, Satori OG images, and JSON-LD patterns. Only one new runtime npm package is required (`d3-force`, ~5.5KB gzipped). All other D3 modules needed for interaction (`d3-zoom`, `d3-drag`, `d3-selection`, `d3-transition`) are already installed as transitive dependencies of `@xyflow/react`.

The recommended implementation order is strictly data-first: extract the DOT file to typed JSON, author educational content for each concept, then build the SEO pages, then the interactive graph. The single most important differentiator for audience impact is the "Explain Like I'm 5" content toggle — it requires two description fields per node in the data model (authored once) and zero additional code complexity, but directly serves the non-technical target audience (recruiters, managers, curious people) that every competing AI landscape map ignores. The force-directed graph should render from pre-computed positions (build-time force simulation) rather than running a live physics simulation in the browser, delivering instant first paint and eliminating layout jank for non-technical users.

The highest-stakes risks are content quality and bundle isolation — not technical complexity. Google's Helpful Content system will penalize thin auto-generated pages with site-wide ranking consequences across all 1090+ existing pages. Each of the ~80 concept pages requires hand-crafted content of at least 300-500 words before being indexed. Separately, D3 force modules must be imported from individual micro-packages only and the graph island must be isolated so force modules never leak into the shared bundle.

---

## Researcher Disagreement: Build-Time vs Runtime D3 Force Simulation

**This is a real architectural disagreement between STACK.md and ARCHITECTURE.md with concrete product consequences. It must be resolved before Phase 4 planning.**

**STACK.md (runtime simulation):** `d3-force` must run at runtime in the browser. The simulation produces organic node settling, live drag-to-rearrange, and the "breathing" layout that defines force-directed graphs. Pre-computing positions at build time produces "a dead static diagram."

**ARCHITECTURE.md (build-time simulation):** Run `d3-force` headlessly at build time (300 ticks via `simulation.stop()` + `simulation.tick()`), write a deterministic `layout.json`. The client React island renders from pre-computed positions. No simulation runs in the browser. `d3-force` stays out of the client bundle entirely — zero bundle impact.

**FEATURES.md (implicit support for build-time):** Lists drag-to-rearrange as an explicit anti-feature ("This is an educational tool, not a graph editor") and lists the Static SVG Fallback as a differentiator requiring pre-computed positions. Also flags that non-technical users have low patience for loading spinners.

**Comparison of approaches:**

| Concern | Runtime Simulation | Build-Time Pre-compute |
|---|---|---|
| Drag-to-rearrange nodes | Yes | No (or partial with re-init on drag) |
| Organic settling animation on load | Yes | No (nodes appear at known positions) |
| Deterministic layout across loads | No | Yes |
| `d3-force` in client bundle | ~5.5KB | 0KB |
| First meaningful paint | 1-3s delay while sim converges | Instant |
| Consistent UX on slow devices | Variable (sim takes longer) | Consistent |

**Recommendation:** Build-time pre-computation is the better fit for an educational tool targeting non-technical users. The anti-feature list explicitly excludes drag-to-rearrange. Instant first paint matters more than organic settling for an audience that has low patience for loading spinners. A pragmatic middle path is possible: pre-compute at build time, but allow optional drag on client — which triggers a lightweight re-simulation scoped to the dragged node, not a full-graph simulation on every tick.

**This is an open question requiring user decision** before Phase 4 is planned (see Open Questions section).

---

## Key Findings

### Recommended Stack

Only one new runtime npm package is required: `d3-force ^3.0.0` (~5.5KB gzipped). `d3-quadtree` is a transitive dependency of `d3-force` that installs automatically (+~3.5KB). All other D3 modules needed for client-side interaction are already installed as transitive deps of `@xyflow/react`: `d3-zoom` (3.0.0), `d3-drag` (3.0.0), `d3-transition` (3.0.1), `d3-dispatch` (3.0.1), `d3-timer` (3.0.1). Four type-definition dev packages are needed: `@types/d3-force`, `@types/d3-zoom`, `@types/d3-drag`, `@types/d3-transition`.

No graph-specific library should be added. React Flow (`@xyflow/react`) uses dagre layout for DAGs — wrong paradigm for a force-directed concept map. `react-force-graph` is Canvas-based and loses CSS styling, accessibility, and native click handling. `cytoscape`, `vis-network`, and `sigma.js` are all 100-200KB+ libraries designed for graph algorithm problems or 5000+ node visualizations, not an 80-node educational display.

**Core technologies:**
- `d3-force ^3.0.0` — only new runtime dependency; force simulation engine powering cluster-aware layout via `forceX`/`forceY`; can be build-time-only if pre-computation approach is chosen
- `d3-zoom` (already installed) — pan and zoom on SVG container; present as transitive dep of `@xyflow/react`
- `d3-drag` (already installed) — optional node dragging; present as transitive dep of `@xyflow/react`
- `d3-selection`, `d3-scale`, `d3-array` (already installed, direct deps) — SVG manipulation, cluster color mapping, viewport bounds
- Nanostores (already installed, 22+ usages) — `selectedNodeId`, `hoveredNodeId`, `activeCluster` atoms; zero new state library needed
- Astro content collections with `file()` loader — `nodes.json` collection; follows `techniques.json` / `distributions.json` pattern exactly
- Satori + Sharp (already installed) — OG image generation for 83 concept pages
- Tailwind CSS (already installed) — side panel, controls layout; inline styles for dynamic cluster colors (not dynamic Tailwind class strings)

**Total new client bundle impact:** ~9KB gzipped (d3-force + d3-quadtree) if runtime simulation. 0KB additional if build-time-only. Full graph island on a fresh page load: ~22KB total including React component.

**What not to add:** `d3` (umbrella, 280KB), `react-force-graph` (Canvas, 60KB+), `vis-network` (200KB+), `sigma.js` (WebGL, wrong tier), `cytoscape.js` (170KB), `ts-graphviz` / `dotparser` (DOT parser libraries for one-time conversion), `framer-motion` (animation already covered by d3-transition + GSAP).

See `.planning/research/STACK-ai-landscape.md` for complete dependency tree, `npm ls` verification, API surface, and alternatives considered.

### Expected Features

**Must have (table stakes) — users expect these, absence feels broken:**
- Force-directed graph with cluster coloring — 7 color-coded clusters matching DOT file (`#e0f7fa` cyan for AI through `#f3e5f5` purple for Agentic)
- Click-to-select node with detail side panel (desktop) / bottom sheet (mobile)
- Pan and zoom — mouse wheel + touch with modifier key guard to prevent scroll trap
- Node hover tooltips showing brief concept description
- Individual concept pages `/ai-landscape/[slug]/` — ~83 static SEO pages
- Edge labels showing relationship types ("subset of", "enables", "example", "includes")
- Legend explaining cluster colors, node shapes, and edge styles
- Search / find node with autocomplete — zoom-to-node + open detail panel on select
- JSON-LD `DefinedTerm` + `DefinedTermSet` structured data on every concept page
- Landing page `/ai-landscape/` with graph embed and category-grouped concept list
- Mobile-responsive layout — bottom sheet panel, list view fallback below 768px

**Should have (differentiators) — not expected but create high-value moments:**
- "Explain Like I'm 5" content toggle — plain vs technical descriptions — HIGHEST audience impact per line of code; requires two description fields in data model; default to plain
- "How did we get here?" ancestry path highlight — illuminates the full hierarchy chain for any buzzword node
- Shareable deep links — `/ai-landscape?node=LLM` — reuses `lz-string` / URL state already in codebase
- Open Graph images per concept — extend existing Satori pipeline
- Guided learning paths — 3-4 curated step-by-step tours ("The Big Picture", "How ChatGPT Works", "What is Agentic AI")
- Keyboard navigation + ARIA — WCAG 2.1 compliance
- Static SVG fallback (SSR preview) — instant first paint before JS hydrates; requires pre-computed layout positions

**Defer to post-launch:**
- Compare concepts VS pages — high complexity; validate user interest first
- Mini-map — useful but not essential for 83 nodes
- Animated edge traversal (GSAP pulse) — pure polish after core is stable
- Cluster zoom on cluster label click — search + pan/zoom achieves same result initially

**Anti-features (explicitly exclude):**
- 3D visualization, real-time data feeds, quiz/gamification, AI assistant chatbot, physics simulation controls sliders, user-editable/drag-to-rearrange graph, complex multi-axis filtering, infinite scroll concept list, real-time collaboration

See `.planning/research/FEATURES-ai-landscape.md` for full feature dependency tree, non-technical audience considerations, and MVP phase recommendation.

### Architecture Approach

The architecture has three clean layers: a build-time data pipeline (DOT parsing, content authoring, optional force layout pre-computation), Astro static page generation (83 SEO pages via `getStaticPaths`), and a React island for interactive graph rendering. All three layers consume the same canonical JSON data model at `src/data/ai-landscape/`. The pattern is identical to how EDA distributions work — JSON files consumed by content collections and by React islands — with the addition of a build-time DOT extraction step.

**Major components:**
1. `scripts/parse-ai-landscape.ts` — one-time DOT-to-JSON extractor producing `nodes.json` skeleton and `edges.json`; run via `npx tsx`; custom regex parser (ts-graphviz deprecated; dotparser unnecessary dep for one-time job)
2. `scripts/compute-ai-layout.ts` — `d3-force` headless simulation (300 ticks, `simulation.stop()`) producing deterministic `layout.json` with x/y positions; re-runnable to regenerate
3. `src/lib/ai-landscape/schema.ts` — Zod schemas for `aiNodeSchema`, `aiEdgeSchema`, `layoutPositionSchema`; extracted to own file following `src/lib/eda/schema.ts` pattern
4. `src/content.config.ts` addition — `aiNodes` collection via `file()` loader from `nodes.json`; edges and layout are plain JSON imports, not collections
5. `src/pages/ai-landscape/[slug].astro` — 83 static pages via `getStaticPaths()` from `getCollection('aiNodes')`; follows `eda/distributions/[slug].astro` exactly
6. `src/components/ai-landscape/LandscapeGraph.tsx` — React island (`client:only="react"`); renders SVG from pre-computed `layout.json` positions; d3-zoom for pan/zoom
7. `src/components/ai-landscape/LandscapeSidePanel.tsx` — slide-in drawer driven by `landscapeStore.selectedNodeId`; plain-English educational content from node data
8. `src/stores/landscapeStore.ts` — nanostores atoms: `selectedNodeId`, `hoveredNodeId`, `activeCluster`; same pattern as `categoryFilterStore.ts`
9. `src/pages/ai-landscape/index.astro` — landing page; static SVG fallback from `layout.json`; React island hydrated over it via CSS `:has()` hiding pattern
10. OG image endpoint — extends existing Satori pipeline; per-concept images for concept pages

**Build-time data flow:** `ai_landscape.dot` → parse script → `nodes.json` skeleton + `edges.json` → manual content authoring → force layout script → `layout.json` → Astro build → 83 static pages + static SVG + OG images + sitemap.

**Runtime data flow:** Static SVG renders instantly → React island hydrates (`client:only`) → renders SVG from `layout.json` positions → d3-zoom enables pan/zoom → node click → nanostores update → side panel slides in → "Learn more" → full page nav to `/ai-landscape/[slug]/`.

**Key architectural choices:**
- `client:only="react"` not `client:visible` — graph is primary content of landing page, should load immediately not wait for scroll
- `nodes.json` only as a content collection (maps 1:1 to pages); `edges.json` and `layout.json` are plain JSON imports
- React owns ALL state; D3 reads from React via refs, never stores its own selection state
- Inline styles (`style={{ backgroundColor: cluster.color }}`) for dynamic cluster colors — never dynamic Tailwind class strings

See `.planning/research/ARCHITECTURE-ai-landscape.md` for full file structure, component designs, build order, and integration points with the existing codebase.

### Critical Pitfalls

1. **Thin content penalty — site-wide SEO risk (Pitfall 5, CRITICAL):** 80 auto-generated pages with <300 words each can trigger Google's Helpful Content penalty site-wide, dragging down rankings for all existing 1090+ pages. Prevention: tiered content strategy — hand-craft 300-500 words per concept before indexing; apply `noindex` to any page below the quality bar; cross-link to existing blog posts. This is the hardest to fix retroactively and the highest-stakes risk in the project.

2. **D3 zoom scroll trap on mobile (Pitfall 2, CRITICAL):** `d3-zoom` captures wheel and touch events by default, trapping mobile users who try to scroll past the graph. Prevention: `zoom.filter()` requiring modifier key (Ctrl+scroll on desktop; two-finger pinch on mobile); fixed-height container; visible hint text. Must be solved during initial zoom implementation, not retrofitted.

3. **Bundle bloat from umbrella D3 import (Pitfall 1, CRITICAL):** `import { forceSimulation } from 'd3'` instead of `import { forceSimulation } from 'd3-force'` adds 280KB gzipped to the bundle. Force modules must also be isolated to the AI landscape island via `client:only="react"` to prevent leaking into the shared bundle. Prevention: micro-module imports only; verify isolation with rollup-plugin-visualizer (already in devDependencies) after build.

4. **SSR crash from D3 DOM access at build time (Pitfall 4, CRITICAL):** D3 accesses `window` and `document`. If the React island uses any hydration directive other than `client:only="react"`, Astro's static build fails with `ReferenceError: window is not defined`. Prevention: `client:only="react"` — set it in the initial component skeleton, never change it. Never import D3 in `.astro` frontmatter.

5. **OG image build time blowout (Pitfall 6, MODERATE-HIGH):** Adding 83 OG image endpoints adds ~80 seconds to build time (Satori + Sharp is CPU-bound, ~1s per image). Prevention: use a shared template for AI landscape pages initially (like the existing `default.png.ts` pattern); add per-concept images as a later increment; monitor `astro build` time before and after.

**Moderate pitfalls:**
- Pitfall 3: Force simulation lifecycle in React — if sim runs in browser, initialize once in `useRef`, cleanup in `useEffect`; stop on alpha < 0.01 and on tab background (applies only if runtime simulation is chosen)
- Pitfall 7: Force graph unreadable on mobile at 350px — show list view below 768px, not force graph
- Pitfall 8: DOT hierarchy does not map cleanly to force layout — accept visual difference; use `forceX`/`forceY` + convex hull overlays for loose cluster grouping
- Pitfall 9: Side panel state desync — React owns ALL state; D3 reads from refs, never stores selection state directly
- Pitfall 14: Tailwind dynamic class interpolation for cluster colors — use inline styles, never `\`bg-${cluster}\``

---

## Implications for Roadmap

Based on research, suggested four-phase structure:

### Phase 1: Data Foundation

**Rationale:** Everything downstream — graph component, SEO pages, OG images, JSON-LD — depends on a well-structured, content-rich JSON data model. The schema must be right before any pages or components are built. This phase is also the longest human-time phase: content authoring for ~83 concepts. Get it right first.

**Delivers:** `nodes.json` (83 concepts with full educational content in two tiers: plain English + technical), `edges.json`, Zod schema in `src/lib/ai-landscape/schema.ts`, `aiNodes` content collection registered in `content.config.ts`, DOT parse script.

**Features addressed:** All table stakes features are unblocked. "Explain Like I'm 5" toggle (highest-impact differentiator) requires two description fields authored here. Edge relationship types typed here.

**Avoids:** Pitfall 5 (thin content) — content quality bar set and enforced in this phase; Pitfall 13 (schema bloat) — schema extracted to own file from day one.

**Open question for user:** Content tiering strategy: (a) write full-length content for all 83 concepts before publishing, (b) write full-length for top ~20 (LLM, Transformer, GenAI, Agentic AI, Deep Learning, etc.) and `noindex` the rest until written, or (c) abbreviated content for all with progressive `noindex` removal. Research strongly recommends option (b) as the safe launch path.

**Research flag:** Standard patterns (Zod schema, content collection). No additional research needed. Content authoring is the constraint.

### Phase 2: SEO Pages

**Rationale:** Static concept pages deliver immediate search value independently of the interactive graph. They follow the established `[slug].astro` + `getStaticPaths` pattern with zero novel technical risk and can ship before the graph component is written. Early indexing means earlier ranking signal accumulation.

**Delivers:** 83 static pages at `/ai-landscape/[slug]/`, JSON-LD `DefinedTerm` + `DefinedTermSet` markup, breadcrumb navigation, related concept links, OG images (shared template via existing Satori pipeline), sitemap integration.

**Features addressed:** Individual concept pages (table stakes), JSON-LD structured data (table stakes), breadcrumb navigation, Open Graph images (differentiator via existing pipeline).

**Uses:** `getStaticPaths`, `getCollection('aiNodes')`, `BreadcrumbJsonLd.astro`, existing `generateOgImage()` with new AI landscape template.

**Avoids:** Pitfall 6 (OG image scale) — shared template initially; Pitfall 10 (tone mismatch) — progressive disclosure structure on each page (plain lead paragraph → gentle technical → collapsible deep dive → why it matters).

**Research flag:** Standard patterns. Direct mirror of `eda/distributions/[slug].astro`. No additional research needed.

### Phase 3: Static Landing Page + Force Layout

**Rationale:** Build the landing page and force layout pre-computation before adding client-side interactivity. A working navigable page with a static SVG fallback and a concept list is a complete, useful experience without JavaScript. This phase also validates the force layout approach and resolves the build-time vs runtime simulation decision at low risk before the interactive component is written.

**Delivers:** `scripts/compute-ai-layout.ts` (headless `d3-force` simulation producing `layout.json`), `/ai-landscape/` landing page with hero text, static SVG fallback rendered from `layout.json` positions, category-grouped concept list, legend, alphabetical index.

**Features addressed:** Landing page (table stakes), legend (table stakes), static SVG fallback (differentiator).

**Uses:** `d3-force` (new install), `npx tsx` build script, `layout.json` positions passed as Astro props.

**Avoids:** Pitfall 8 (DOT-to-force mismatch) — cluster centroid positions tuned here; Pitfall 1 (bundle bloat) — `d3-force` used only in build script at this stage, not in client bundle.

**Open question resolved here:** Build-time vs runtime simulation debate must be settled in this phase. The layout script establishes what positions the client will render from. Decision directly determines whether `d3-force` ships in the client bundle in Phase 4.

**Research flag:** Standard patterns. D3 headless simulation is documented via Observable examples. No additional research needed.

### Phase 4: Interactive Graph

**Rationale:** Interactivity is the final layer. All previous phases are fully functional without it. This phase has the most implementation risk (SSR crash, zoom scroll trap, simulation lifecycle, state sync between D3 and React) and benefits from stable data and layout from prior phases.

**Delivers:** `LandscapeGraph.tsx` React island (SVG rendered from `layout.json` positions, `client:only="react"`), `LandscapeSidePanel.tsx` (slide-in drawer), `landscapeStore.ts` (nanostores atoms), d3-zoom pan/zoom with scroll trap guard, node click/hover interactions, cluster convex hull overlays, search autocomplete with zoom-to-node, "How did we get here?" ancestry highlight, shareable deep links, keyboard navigation + ARIA, static SVG fallback hidden via CSS `:has()` when React mounts.

**Features addressed:** Force-directed graph (table stakes), click-to-select detail panel (table stakes), pan and zoom (table stakes), hover tooltips (table stakes), search/find node (table stakes), cluster coloring (table stakes), ancestry path highlight (differentiator), shareable deep links (differentiator), keyboard navigation (differentiator).

**Uses:** `d3-zoom`, `d3-drag`, `d3-selection`, `d3-transition` (all already installed), nanostores, Tailwind for side panel, inline styles for cluster colors.

**Avoids:**
- Pitfall 2 — `zoom.filter()` with Ctrl+scroll on desktop, two-finger pinch on mobile; add hint text
- Pitfall 3 — pre-computed positions eliminate live simulation; if runtime sim chosen, `useRef` pattern for lifecycle
- Pitfall 4 — `client:only="react"` set in initial scaffold; never change
- Pitfall 9 — React owns ALL state; D3 click handler calls `setSelectedNodeId(id)`; `useEffect([selectedNodeId])` applies highlighting
- Pitfall 11 — `transition:persist` + nanostores URL persistence for zoom state on navigation
- Pitfall 12 — `role="img"` on SVG, `role="button"` + `tabindex` on nodes, `<title>` + `<desc>` elements
- Pitfall 14 — inline styles for cluster colors only
- Pitfall 15 — stop simulation on `visibilitychange` hidden event

**Research flag:** This phase benefits from a `/gsd:research-phase` pass scoped to: (a) the precise `zoom.filter()` pattern for modifier-key zoom guard, (b) the CSS `:has()` selector pattern for hiding static SVG fallback when React mounts, and (c) the `transition:persist` + nanostores combination for view transition state persistence. These three implementation details are fiddly and have documented edge cases worth pre-researching.

### Phase 5: Learning Experience Polish (Post-Launch)

**Rationale:** Differentiator features that enhance the experience but are not required for a functional, SEO-complete product. Defer until core product is live and validated.

**Delivers:** Guided learning paths (3-4 curated tours with step-by-step progression and progress indicator), animated edge traversal (GSAP path dash-offset pulse on selection), cluster zoom on cluster label click, mini-map (desktop only), compare concepts VS pages (`/ai-landscape/vs/[slug1]-vs-[slug2]`).

**Features addressed:** Guided learning paths (differentiator), animated edge traversal (differentiator), cluster zoom (differentiator), compare concepts (post-launch differentiator).

### Phase Ordering Rationale

- Data precedes everything: the JSON data model is the prerequisite for every other phase
- SEO pages before the interactive graph: deliver search value immediately via zero-risk established patterns; early indexing means more time for ranking signals to accumulate
- Static landing page before interactive graph: validates force layout approach and resolves the build-time vs runtime decision at low risk before writing the interactive component
- Interactive graph last: highest implementation risk; benefits from stable data and layout from all prior phases; is the last layer on an already-functional product
- This ordering matches both FEATURES.md's MVP recommendation and ARCHITECTURE.md's suggested build order — strong cross-researcher agreement

### Research Flags

**Phases needing deeper research during planning:**
- **Phase 4 (Interactive Graph):** Recommend `/gsd:research-phase` scoped to (a) `d3-zoom` modifier-key scroll guard pattern, (b) CSS `:has()` static SVG fallback hiding, (c) `transition:persist` + nanostores view transition state preservation. These three implementation details have documented pitfalls and the codebase does not yet have examples of them.
- **Phase 1 (Data Foundation):** Not a technical research question — content tiering strategy requires user decision before writing begins (see Open Questions). Flag for early clarification.

**Phases with standard patterns (skip research-phase):**
- **Phase 2 (SEO Pages):** Direct mirror of `eda/distributions/[slug].astro`. Zero novel patterns.
- **Phase 3 (Static Landing Page):** Headless force layout is a 30-line script; well-documented via D3 Observable examples.
- **Phase 5 (Polish):** Each feature is small and independent. Research inline during implementation.

---

## Open Questions Requiring User Decision

These are not technical unknowns. They are product decisions the research identified but cannot resolve without user input.

1. **Build-time vs runtime force simulation:** Do users need drag-to-rearrange interactivity (requires runtime simulation and ~5.5KB d3-force in client bundle) or is a zoomable/clickable educational map sufficient (build-time pre-computation, 0KB additional client JS, instant first paint)? Research and the anti-feature list both lean strongly toward build-time as the better fit for an educational tool targeting non-technical users.

2. **Content tiering strategy for launch:** Will all 83 concepts have hand-crafted 300-500 word content before first publish, or will the site launch with full content on the most important ~20 concepts (LLM, Transformer, GenAI, Agentic AI, Neural Networks, Deep Learning, etc.) and `noindex` on the rest? Research strongly recommends the tiered approach as the only safe path to avoid Google's Helpful Content penalty affecting the entire site.

3. **Mobile graph strategy:** Show the force graph on mobile (with heavy simplification — top-level clusters only) or show a list view below 768px with a "View on desktop" message? Research recommends the list view fallback for the non-technical audience who will be on mobile, but this is a UX preference call.

4. **"Explain Like I'm 5" toggle vs single blended description:** Two-tier content (plain default + technical toggle) or a single accessible description written at a grade 8-10 reading level? The toggle is the highest-impact differentiator per line of code but doubles content authoring load. Single blended is faster to author but less differentiated from competitors.

5. **OG image strategy:** Per-concept OG images (83 additional images, ~80s added to build time) or a shared AI Landscape template for all concept pages initially? Research recommends shared template at launch, per-concept images as a later post-launch increment.

---

## Confidence Assessment

| Area | Confidence | Notes |
|---|---|---|
| Stack | HIGH | npm versions verified against registry API; `npm ls` confirmed transitive deps already installed; bundle sizes from bundlephobia + minified dist inspection; alternatives evaluated against documented limitations |
| Features | HIGH | Table stakes derived from established UX research and competitor analysis; differentiators grounded in peer-reviewed visualization research (IEEE D-Tour 2024); anti-features grounded in documented technical limitations |
| Architecture | HIGH | Derived from direct codebase analysis of 22+ existing patterns; all proposed patterns have running implementations in the same repo; component boundaries follow established conventions |
| Pitfalls | HIGH | Most critical pitfalls verified against D3 GitHub issues, Astro documentation, and existing codebase tech debt; SEO thin content risk grounded in documented Google HCU cases; scroll trap issue documented in D3 GitHub issues #2549 and #141 |

**Overall confidence: HIGH.** The project is well-understood technically. The main uncertainties are product decisions (content tiering, simulation approach), not technical unknowns. Research from all four files converges on the same build order and architecture.

### Gaps to Address

- **Simulation approach decision:** Must be resolved in Phase 3 planning before writing Phase 4 code. See researcher disagreement section and Open Questions #1.
- **Content volume / time estimate:** No researcher assessed actual authoring time for 83 hand-crafted concept descriptions. This is the longest-pole constraint — not engineering, but writing. Phase 1 should be flagged as high-effort and may need to span multiple work sessions before Phase 2 begins.
- **Dark mode cluster colors:** The DOT file uses pastel hex values (`#e0f7fa`, `#c8e6c9`, `#fff9c4`, etc.) that wash out or disappear in dark mode. Dark mode equivalents for all 7 cluster colors need to be defined during Phase 3 when the static SVG fallback is rendered.
- **View transition compatibility (Pitfall 11):** `transition:persist` + nanostores URL persistence is the mitigation direction but has not been tested in this codebase's view transition setup. Flag for Phase 4 testing.

---

## Sources

### Primary (HIGH confidence — verified official sources)
- [npm registry: d3-force, d3-zoom, d3-drag, d3-quadtree, d3-transition](https://registry.npmjs.org/) — versions 3.0.0 / 3.0.1 confirmed 2026-03-26
- [D3 Force documentation](https://d3js.org/d3-force) — API reference: forceSimulation, forceLink, forceManyBody, forceCenter, forceCollide, forceX, forceY
- [Astro Content Collections](https://docs.astro.build/en/guides/content-collections/) — file() loader, getStaticPaths patterns
- [Astro Islands Architecture](https://docs.astro.build/en/concepts/islands/) — client:only, client:visible hydration directives
- [schema.org/DefinedTerm](https://schema.org/DefinedTerm) — JSON-LD markup type for taxonomy concept pages
- Codebase analysis: `package.json`, `npm ls d3-zoom d3-drag`, `src/components/eda/DistributionExplorer.tsx`, `src/components/guide/DeploymentTopology.tsx`, `src/stores/categoryFilterStore.ts`, `src/content.config.ts`, `src/lib/eda/schema.ts`, `src/lib/beauty-index/schema.ts`, `src/lib/og-image.ts`

### Secondary (MEDIUM confidence — multiple sources agree)
- [Graph visualization performance study (PMC)](https://pmc.ncbi.nlm.nih.gov/articles/PMC12061801/) — SVG performant for sub-1000 nodes; Canvas wins at 5000+
- [D3 Zoom Scroll Conflict (GitHub #2549)](https://github.com/d3/d3/issues/2549) — scroll trap behavior and zoom.filter() pattern documented
- [D3 Zoom Touch Issues (GitHub #141)](https://github.com/d3/d3-zoom/issues/141) — touch event capture issues
- [D-Tour: IEEE 2024](https://ieeexplore.ieee.org/document/10678807/) — guided tours improve non-expert visualization comprehension
- [Knowledge Graph Visualization (Datavid, yFiles)](https://datavid.com/blog/knowledge-graph-visualization) — detail panel and progressive disclosure patterns
- [Google Helpful Content 2026](https://orbitinfotech.com/blog/google-2026-helpful-content-update/) — thin content site-wide penalty patterns documented
- [Bundlephobia: d3-force, d3-zoom](https://bundlephobia.com/) — bundle size estimates

### Tertiary (reference only)
- [Static force-directed graph (Observable)](https://observablehq.com/@d3/static-force-directed-graph) — build-time pre-computation pattern reference
- [React + D3 Force Graphs with TypeScript (Medium)](https://medium.com/@qdangdo/visualizing-connections-a-guide-to-react-d3-force-graphs-typescript-74b7af728c90) — React+D3 integration pattern
- [D3 Accessibility Patterns (fossheim.io)](https://fossheim.io/writing/posts/accessible-dataviz-d3-intro/) — ARIA labels on SVG elements

---
*Research completed: 2026-03-26*
*Ready for roadmap: yes*
