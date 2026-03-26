# Feature Landscape

**Domain:** Interactive AI Landscape Explorer (educational taxonomy visualization)
**Researched:** 2026-03-26
**Audience:** Non-technical users (recruiters, managers, curious people)

---

## Table Stakes

Features users expect from an interactive educational visualization. Missing any of these = product feels incomplete or broken.

| Feature | Why Expected | Complexity | Existing Infra | Notes |
|---------|-------------|------------|----------------|-------|
| **Force-directed graph visualization** | Core of the product. Users see ~80 nodes arranged spatially showing AI taxonomy hierarchy. Without this there is no product. | High | D3 modular deps exist (d3-selection, d3-scale, d3-shape, d3-axis). Missing: d3-force, d3-drag, d3-zoom. | New D3 modules needed. Site already uses D3 in DistributionExplorer.tsx so the React+D3 integration pattern is established. |
| **Cluster coloring by category** | The DOT file defines 7 distinct cluster backgrounds (cyan=AI, green=ML, yellow=NN, amber=DL, pink=GenAI, purple=Agentic, blue=DevTools, grey=Levels). Users need visual grouping to parse the hierarchy. | Low | Tailwind + CSS vars for theming already in place. | Map DOT bgcolor values to CSS. Must respect dark mode -- the DOT file's pastel backgrounds will need dark-mode equivalents. |
| **Click-to-select node with detail panel** | Primary interaction. Click a node, see its explanation in a side/bottom panel. This is how non-technical users learn -- they do not want to decode graph structure alone. Every major interactive knowledge graph follows this pattern (AWS Graph Explorer, Knowledge Graph Browser). | Medium | nanostores for state management. React integration via @nanostores/react. Pattern used in tool analyzers (EditorPanel components). | Side panel on desktop, bottom sheet on mobile. Panel shows: title, plain-English explanation, relationships ("subset of", "enables"), and link to full concept page. |
| **Pan and zoom** | With ~80 nodes the graph will not fit a single viewport. Zoom to cluster, zoom to fit, pan around. Standard expectation for any graph larger than ~20 nodes. d3-zoom supports both mouse and touch input natively. | Medium | d3-zoom handles this. | Must handle both mouse (wheel+drag) and touch (pinch+swipe). Include zoom-to-fit reset button. Constrain zoom range to prevent disorienting over-zoom. |
| **Node hover tooltips** | Quick peek at what a node is before committing to a click. Shows the node label description text from the DOT file (e.g., "Enabling machines to mimic human intelligence"). | Low | CSS + JS event handlers. | Brief tooltip on hover/long-press. Desktop only for hover; mobile uses tap-to-select (first tap = select + open panel). |
| **Individual concept pages (/ai-landscape/[slug])** | Each of the ~80 concepts gets its own static page with full explanation, related concepts, and breadcrumbs. Critical for SEO -- each page targets a keyword like "what is deep learning" or "LLM explained simply". Entity-first SEO best practice: every page should be unambiguously about one canonical entity. | Medium | Astro getStaticPaths pattern well-established (EDA techniques, distributions, beauty-index). BreadcrumbJsonLd component exists. | Generate from a JSON/TS data file (not parsing DOT at build time). Each page: H1, plain-English explanation (2-3 paragraphs), "Part of" breadcrumb (AI > ML > NN > DL), related concepts links, link back to graph view. |
| **Mobile-responsive layout** | Non-technical audience heavily uses mobile. Graph must be usable on phones, not just desktop. | Medium | Tailwind responsive utilities in use throughout site. | Graph should be full-width on mobile. Detail panel becomes bottom sheet. Consider showing a simplified list view as fallback navigation on very small screens. |
| **Edge labels showing relationships** | The DOT file defines rich relationship types: "subset of", "enables", "e.g.", "powers", "includes fields", "characterized by". These labels are the educational backbone -- they explain WHY nodes connect. | Low | SVG text along paths. | Show on hover/click of an edge, or always show for "subset of" backbone edges. Hide tertiary edges by default to reduce visual clutter. |
| **Legend / key** | Users need to know what colors mean, what dashed vs solid lines mean, what ellipse vs box shapes mean. Non-technical users will not intuit graph conventions. | Low | Static Astro component. | Simple color-coded legend matching the 7 cluster colors. Edge style legend (solid=hierarchy, dashed=includes, dotted=example). Collapsible on mobile. |
| **Search / find node** | With ~80 nodes users must be able to type "transformer" and find the node. No search = frustration. | Medium | Could use nanostores for search state. | Combobox/autocomplete that filters node list. On select: zoom to node + highlight + open detail panel. Fuzzy matching helpful ("LLM" should find "Large Language Models"). |
| **JSON-LD structured data** | Each concept page needs DefinedTerm schema.org markup for SEO. The site already ships JSON-LD on every content page. DefinedTerm with DefinedTermSet is the correct schema.org type for taxonomy concept pages. | Low | EDAJsonLd.astro, BreadcrumbJsonLd.astro, BlogPostingJsonLd.astro patterns exist. | Use schema.org/DefinedTerm with DefinedTermSet for the collection. Each page: DefinedTerm with name, description, inDefinedTermSet. |
| **Landing page (/ai-landscape/)** | Entry point showing the graph, a title, and a category-grouped list of all concepts as fallback navigation. Every content section on the site (EDA, Beauty Index, tools, guides) has a landing page. | Low | Multiple landing page patterns exist (EDA index, projects index, beauty-index index). | Graph embed above the fold. Below: category sections (AI Subfields, Machine Learning Types, Deep Learning Architectures, etc.) with linked concept cards. |

---

## Differentiators

Features that set this apart from static AI landscape images (like FirstMark MAD Landscape) and basic taxonomy charts. Not expected, but create "wow" moments and serve the non-technical audience in ways competitors do not.

| Feature | Value Proposition | Complexity | Existing Infra | Notes |
|---------|-------------------|------------|----------------|-------|
| **"Explain Like I'm 5" toggle** | Switch between "Simple" and "Technical" explanation depths. Simple: "AI is when computers learn to do things that normally need a human brain." Technical: "AI encompasses computational systems that exhibit cognitive capabilities including learning, reasoning, and problem-solving." Default to Simple for target audience. THIS is the single most important differentiator -- every existing AI landscape map assumes technical literacy. | Low | Content is in the data file, just two fields per node. | Two description fields per concept in the data model. Toggle in the detail panel and on concept pages. Simple is default. Low build cost, high audience impact. |
| **Guided learning paths** | Pre-defined paths like "AI Basics Tour" (AI > ML > NN > DL > GenAI > LLM) that walk users through the hierarchy step-by-step. Research shows interactive guided tours significantly improve visualization comprehension for non-expert users (D-Tour research, IEEE 2024). Non-technical users often feel lost in free-exploration graphs. A guided path gives them structure. | Medium | No existing tour/stepper component. GSAP available for animations. | Implement as a "Start Tour" button that sequentially highlights nodes, zooms to each, and shows explanations in the detail panel. 3-4 curated paths: "The Big Picture" (5-node hierarchy), "How ChatGPT Works" (Transformers > Foundation Models > LLM > GPT), "What is Agentic AI" (LLM > Agentic AI > characteristics > frameworks). Progress indicator (step 3/8). |
| **"How did we get here?" path highlight** | Click any deep node (e.g., "GPT-4o") and see the full ancestry chain highlighted: AI > ML > NN > DL > GenAI > LLM > GPT-4o. Helps users understand where a buzzword fits in the big picture. The DOT file already encodes this hierarchy via "subset of" edges. | Low | Graph data already has parent-child relationships from DOT edges. | Compute ancestors from edge data. Highlight ancestor nodes + edges in a distinct color. Show breadcrumb-like trail in detail panel: "GPT-4o is an example of LLM, which is part of Generative AI, which is part of Deep Learning..." |
| **Animated edge traversal** | When viewing a concept, animate a pulse/glow along the edges connecting it to parent and child nodes. Shows the "flow" of the taxonomy visually. | Medium | GSAP already in project (gsap@3.14.2). | Use GSAP to animate SVG path dash-offset for edge pulse. Trigger on node selection. Subtle, not distracting -- reinforces relationships without overwhelming. |
| **Cluster zoom (click cluster label)** | Click "Deep Learning" cluster background/label to zoom into just those nodes. Reduces cognitive load by focusing on one area. | Medium | d3-zoom supports programmatic zoom transitions. | Calculate cluster bounding box from member node positions. Animate zoom with d3-transition. Add "zoom out" / "show all" button. |
| **Shareable deep links** | URL updates as user navigates: /ai-landscape?node=LLM. Share a link that opens the graph focused on a specific node. | Low | lz-string already in project for URL state (Dockerfile analyzer uses url-state.ts). | Encode selected node in URL params. On load, zoom to node + open detail panel. Simpler than the Dockerfile analyzer's full state encoding -- just a node ID. |
| **Keyboard navigation** | Arrow keys to traverse graph edges, Enter to select, Escape to deselect. Tab through nodes. Screen reader announcements for node focus. | Medium | No existing graph keyboard nav in the codebase. | Essential for accessibility (WCAG 2.1). Define tab order by cluster, then by node within cluster. Arrow keys follow edges. Announce: "GPT-4o, example of Large Language Models, part of Generative AI". |
| **Open Graph images per concept** | Each /ai-landscape/[slug] page gets a dynamic OG image showing the concept name, cluster color, and one-line description. | Low | Satori-based OG image pipeline exists with multiple templates (beauty-index per language, beauty-index VS pages, blog posts, default). | Extend existing Satori pipeline. Follow the beauty-index OG image pattern. Show concept name + cluster color + tagline. Generates at build time via getStaticPaths. |
| **"What is this connected to?" relationship panel** | In the detail panel, show all relationships for the selected node grouped by type: "Part of: Deep Learning", "Includes: CNN, RNN, Transformers, Autoencoders", "Enables: LLM, AgenticAI". Clicking any relationship navigates to that node. | Low | Data already exists in the edge definitions from the DOT file. | Parse edge labels from data model. Group by relationship type. Each related concept is a clickable link (navigates graph + updates panel). |
| **Mini-map** | Small overview of the full graph in a corner showing current viewport position. Helps orientation in a large graph. | Medium | Would be a custom SVG inset component. | Render simplified version of graph (colored dots for nodes) in a fixed-position overlay. Highlight current viewport rectangle. Click mini-map to navigate. Desktop only -- not enough screen real estate on mobile. |
| **"Compare concepts" mode** | Select two nodes (e.g., "Supervised Learning" vs "Unsupervised Learning") and see a side-by-side comparison. | High | beauty-index VsComparePicker.tsx exists as a pattern. VS page generation exists (beauty-index/vs/[slug].png.ts). | Reuse comparison pattern from Beauty Index. Show both descriptions, parent relationships, and key differences. Generate /ai-landscape/vs/[slug1]-vs-[slug2] pages for SEO (e.g., "supervised-vs-unsupervised-learning-explained"). |
| **Static SVG fallback (SSR preview)** | Pre-render a static SVG of the graph at build time so the graph appears instantly on page load, before JavaScript hydrates. The D3 force simulation then "brings it alive." | Medium | Site uses Astro SSR extensively. D3 can run server-side in Node. | Run D3 force simulation during build, capture final node positions, render static SVG. Client-side JS then attaches interactivity. First meaningful paint in <500ms instead of waiting for simulation to converge (typically 1-3 seconds). Critical for non-technical users who have low patience for loading spinners. |

---

## Anti-Features

Features to explicitly NOT build. Each would add complexity without serving the non-technical target audience, or would actively harm the experience.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| **3D graph visualization** | Three.js/react-three-fiber are already in the project (HeadScene.tsx) but 3D force graphs are disorienting for non-technical users. Depth perception in graphs confuses even technical users. Mobile performance degrades significantly. Two competing 3D elements on the same site creates GPU contention. | Stick with 2D force-directed layout. The nested cluster structure provides enough spatial organization. The color-coded clusters already convey hierarchy visually. |
| **Real-time DOT file parsing at build time** | The DOT file is a design artifact with deeply nested subgraphs, cluster semantics, and attribute inheritance. JS DOT parsers (dotparser, @ts-graphviz/parser) exist but are designed for flatter graphs. Subgraph nesting and cluster background colors require custom AST walking. Fragile build dependency for no user-facing benefit. | Pre-process DOT to a canonical JSON/TypeScript data file once (manually or via a one-time script). Build everything from the JSON. Update JSON when the landscape changes. The DOT file remains the visual design artifact; the JSON is the application's source of truth. |
| **User-editable graph / drag-to-rearrange** | This is an educational tool, not a graph editor. Adding edit capabilities creates state management complexity and confuses the pedagogical purpose. Non-technical users do not want to edit -- they want to learn. | Read-only graph. Drag is for panning the viewport, not rearranging nodes. Node positions are determined by the force simulation (or pre-computed). |
| **Auto-updating from live APIs** | Pulling current AI model info from HuggingFace, GitHub, or news APIs. Stale data, API failures, and unbounded content are all risks. The value is in the curated, plain-English explanations, not live data feeds. | Manually curated content updated periodically. Datestamp the content ("2026 Edition"). This matches the existing DOT file header which already says "2026 Edition". |
| **Quiz / gamification** | Flashcards, "test your knowledge", progress tracking, scores. Adds significant state management (localStorage, score computation, streak tracking) for marginal educational value. Non-technical users want to understand, not be tested. Gamification risks feeling patronizing to the target audience (managers, recruiters). | The guided learning paths provide structure without pressure. The "Explain Like I'm 5" toggle serves the learning goal directly and respectfully. |
| **Chat / AI assistant integration** | "Ask AI about this concept" embedded chatbot. Adds significant infrastructure (API keys, streaming responses, rate limiting, cost per query, abuse prevention). The site already has a comprehensive Claude Code guide -- users can learn about AI assistants there. | Write excellent static explanations. The content IS the product. If explanations are clear enough, no chatbot is needed. Each concept page should answer the questions a chatbot would answer. |
| **Complex filtering / faceted search** | Multi-axis filters (by date, by company, by modality, by open-source-status). Over-engineering for ~80 nodes. The graph IS the visual filter -- clusters are the categories. Multiple filter axes create combinatorial complexity that confuses non-technical users. | Simple text search + cluster zoom covers all realistic use cases for ~80 nodes. The concept pages have category breadcrumbs for hierarchical browsing. |
| **Animation-heavy intro / loading screen** | Particle effects, typing animations, or cinematic intros before showing the graph. The site already has animations (GSAP TextScramble, ParticleCanvas, WordReveal, TiltCard). Adding a cinematic intro to the graph page creates loading friction and competes with the content. | Show the graph immediately. Use subtle entrance animation (nodes fade in by cluster with 200ms stagger). First paint should be content, not chrome. The static SVG fallback ensures instant visibility. |
| **Physics simulation controls** | Sliders for gravity, charge strength, link distance, collision radius, simulation cooling. Fun for developers who understand force-directed layouts, meaningless for recruiters who do not know what "charge strength" means. Exposes implementation details that break the educational metaphor. | Pre-tune the force simulation parameters for this specific graph topology (~80 nodes, 7 clusters, nested hierarchy). Fixed, optimized layout. The simulation runs to convergence and then stops. |
| **Infinite scroll concept list** | Loading all ~80 concept explanations on a single scrollable page. Terrible for SEO (one page cannot rank for 80 different keywords) and overwhelming for users. Conflicts with individual page strategy. | Individual pages per concept (/ai-landscape/[slug]). Landing page shows category-grouped list with short descriptions + links. This matches the EDA Visual Encyclopedia pattern which successfully generates 90+ individual pages for search authority. |
| **Real-time collaboration / multi-user** | Shared cursors, live annotations, "explore together" mode. Massive infrastructure requirement (WebSocket server, presence state, conflict resolution) for an educational reference tool. | Static, single-user experience. Share via URL deep links. If discussion is needed, link to a GitHub Discussion or social media thread. |

---

## Feature Dependencies

```
DOT-to-JSON data extraction (prerequisite -- unblocks everything)
  |
  +-> Concept data model (TypeScript types + data file)
  |     |
  |     +-> [slug] dynamic route pages (getStaticPaths)
  |     |     +-> JSON-LD (DefinedTerm + BreadcrumbList)
  |     |     +-> Open Graph images (extend Satori pipeline)
  |     |     +-> "Explain Like I'm 5" toggle (two description fields)
  |     |     +-> [Differentiator] "Compare concepts" mode + VS pages
  |     |
  |     +-> Force-directed graph component (React island, client:visible)
  |     |     +-> Cluster coloring
  |     |     +-> Pan & zoom (d3-zoom, d3-drag)
  |     |     +-> Node hover tooltips
  |     |     +-> Click-to-select + detail panel (nanostores)
  |     |     |     +-> "What is this connected to?" relationship panel
  |     |     |     +-> [Differentiator] "How did we get here?" path highlight
  |     |     +-> Edge labels
  |     |     +-> Search / find node (autocomplete)
  |     |     +-> Legend
  |     |     +-> [Differentiator] Animated edge traversal (GSAP)
  |     |     +-> [Differentiator] Cluster zoom
  |     |     +-> [Differentiator] Mini-map
  |     |     +-> [Differentiator] Shareable deep links (URL params)
  |     |     +-> [Differentiator] Keyboard navigation
  |     |     +-> [Differentiator] Static SVG fallback (SSR preview)
  |     |     +-> [Differentiator] Guided learning paths
  |     |           +-> Requires: zoom, highlight, detail panel all working
  |     |
  |     +-> Landing page (/ai-landscape/index)
  |           +-> Graph embed
  |           +-> Category-grouped concept list (fallback nav)
  |           +-> Search bar
  |
  +-> New npm dependencies: d3-force, d3-drag, d3-zoom
        +-> Type definitions: @types/d3-force, @types/d3-drag, @types/d3-zoom
```

**Key dependency insight:** The data model must be built first. Everything downstream -- graph component, concept pages, SEO markup -- depends on having a well-structured JSON/TS data file with ~80 nodes, their cluster membership, two-tier descriptions (simple + technical), edge relationships with labels, and URL slugs. The graph component and concept pages can then be built in parallel.

---

## MVP Recommendation

### Phase 1: Data Foundation + Core Graph

Unblock everything and deliver the visual centerpiece.

1. **DOT-to-JSON data extraction** -- Build the canonical TypeScript data file with all ~80 nodes, cluster membership, descriptions (simple + technical), edge relationships with typed labels, and URL slugs. One-time manual/scripted extraction.
2. **Force-directed graph with clusters** -- The visual centerpiece. React island with d3-force + d3-zoom + d3-drag. Cluster coloring, basic hover tooltips, pan/zoom.
3. **Click-to-select detail panel** -- Side panel (desktop) / bottom sheet (mobile). Shows title, simple description, relationships, link to full page.
4. **Search / find node** -- Autocomplete combobox. Zoom-to-node on select.
5. **Legend** -- Static component explaining colors, shapes, and edge styles.
6. **Landing page** -- /ai-landscape/ with graph embed + category-grouped concept list below.

### Phase 2: SEO Pages + Structured Data

Capture search traffic for 80+ AI concept keywords.

7. **Individual concept pages** -- /ai-landscape/[slug] via getStaticPaths. Plain-English explanations, related concepts, breadcrumb navigation, "Part of" hierarchy display.
8. **JSON-LD structured data** -- DefinedTerm + DefinedTermSet + BreadcrumbList on every concept page. AILandscapeJsonLd.astro component.
9. **Open Graph images** -- Extend Satori pipeline for per-concept OG images.
10. **"Explain Like I'm 5" toggle** -- Low complexity, highest audience impact. Add to detail panel and concept pages.

### Phase 3: Learning Experience + Polish

Transform passive exploration into active learning.

11. **"How did we get here?" path highlight** -- Low complexity, teaches hierarchy visually.
12. **Guided learning paths** -- 3-4 curated tours with step-by-step progression.
13. **Keyboard navigation + ARIA** -- Accessibility compliance before public launch.
14. **Shareable deep links** -- URL updates with selected node.
15. **Static SVG fallback** -- Pre-render graph positions at build time for instant first paint.

### Defer to Post-Launch

- **Compare concepts mode** -- High complexity, requires VS page generation. Add after validating user interest.
- **Mini-map** -- Nice but not essential for ~80 nodes. Add if user testing shows orientation problems.
- **Animated edge traversal** -- Polish feature. Add after core graph is stable.
- **Cluster zoom** -- Search + pan/zoom achieves similar result initially.

---

## Non-Technical Audience Considerations

These cross-cutting concerns must inform every feature decision.

| Concern | Implication | Implementation |
|---------|-------------|----------------|
| **Jargon avoidance** | Every concept description must be in plain English first. "A neural network is a computer system that learns by example, loosely inspired by how brain cells connect." NOT "A parameterized function approximator using gradient-based optimization." | Default to "Simple" descriptions. Technical descriptions available via toggle. Write simple descriptions at an 8th-grade reading level. |
| **Entry point clarity** | Users must immediately understand what they are looking at and what to do. Force-directed graphs are NOT intuitive to non-technical users -- they expect recognizable UI patterns, not physics simulations. | Add a clear heading: "The AI Landscape -- Click any concept to learn more." Show a subtle pulse/glow on 2-3 key entry nodes (AI, ML, GenAI) to invite clicks. Brief instruction text: "Zoom with scroll, drag to pan." |
| **Cognitive load management** | ~80 nodes at once is overwhelming. Progressive disclosure research shows reducing initial complexity improves comprehension. | Start zoomed to show the main hierarchy backbone (AI > ML > NN > DL > GenAI). Peripheral clusters (Agentic, DevTools, Levels) visible but slightly de-emphasized. Users explore outward from the core. |
| **No dead ends** | Every interaction should lead somewhere meaningful. Clicking a leaf node (e.g., "Stable Diffusion") must still feel rewarding, not like hitting a wall. | Every node, no matter how peripheral, gets a description and a concept page. The detail panel always shows "Part of [cluster]" and related concepts to navigate to. |
| **Touch-first interactions** | Mobile users cannot hover. Any interaction that requires hover as its only trigger is broken for half the audience. | Replace hover with tap. First tap = select + show detail panel. Pinch to zoom. Swipe to pan. Tooltips become part of the detail panel, not a hover-only preview. |
| **Loading performance** | Non-technical users have low patience for loading. If the graph takes >2s to appear, they leave. D3 force simulations typically need 1-3 seconds to converge for ~80 nodes. | SSR the graph container with a static SVG preview (pre-rendered positions from build-time simulation). Hydrate with D3 force simulation on client. Graph appears instantly and "settles" as simulation runs. |
| **Plain language relationship labels** | Edge labels like "subset of" are clear, but "e.g." is jargon for some non-technical users. | Replace "e.g." with "example:" in the UI. Replace "enables" with "makes possible". Replace "paradigm" with "approach". Keep the DOT file as-is for accuracy; translate labels in the display layer. |

---

## Sources

**D3 / Visualization (HIGH confidence -- official docs):**
- [D3 Force Module](https://d3js.org/d3-force) -- Force-directed layout using velocity Verlet integration
- [D3 Zoom Module](https://github.com/d3/d3-zoom) -- Pan and zoom for SVG/HTML/Canvas with mouse and touch input
- [Force-Directed Graph Component (Observable)](https://observablehq.com/@d3/force-directed-graph-component) -- Reference implementation patterns
- [D3 In Depth: Force Layout](https://www.d3indepth.com/force-layout/) -- Practical tutorial on force simulation configuration

**Knowledge Graph UX (MEDIUM confidence -- multiple sources agree):**
- [Knowledge Graph Visualization Guide (Datavid)](https://datavid.com/blog/knowledge-graph-visualization) -- Progressive disclosure, detail panels, tooltips, contextual menus
- [Knowledge Graph Visualization Guide (yFiles)](https://www.yfiles.com/resources/how-to/guide-to-visualizing-knowledge-graphs) -- Best practices for interactive graph exploration
- [AWS Graph Explorer (GitHub)](https://github.com/aws/graph-explorer) -- React-based graph visualization with search, expand, and node detail patterns

**AI Landscape References (MEDIUM confidence -- competitor analysis):**
- [AI Agents Landscape Map](https://aiagentsdirectory.com/landscape) -- Interactive AI map with search, category filtering, agent profiles
- [FirstMark MAD Landscape](https://mad.firstmark.com/) -- ML/AI/Data market map with card-based browsing
- [FourWeekMBA Map of AI](https://fourweekmba.com/the-map-of-ai-march-2026-interactive-landscape/) -- Interactive AI industry framework

**Onboarding / Guided Tours (HIGH confidence -- peer-reviewed research):**
- [D-Tour: Visualization Dashboard Onboarding (IEEE 2024)](https://ieeexplore.ieee.org/document/10678807/) -- Semi-automatic guided tours improve visualization comprehension
- [Progressive Disclosure (IxDF)](https://ixdf.org/literature/topics/progressive-disclosure) -- Reducing cognitive load through staged information reveal

**Accessibility (HIGH confidence -- W3C standards + expert sources):**
- [Accessibility in Data Visualizations (Smashing Magazine)](https://www.smashingmagazine.com/2024/02/accessibility-standards-empower-better-chart-visual-design/) -- WCAG 2.1 chart accessibility, minimum 3:1 contrast ratio
- [Charts & Accessibility (Penn State)](https://accessibility.psu.edu/images/charts/) -- Keyboard navigation, screen reader patterns for interactive charts
- [Breadcrumbs: 11 Design Guidelines (Nielsen Norman Group)](https://www.nngroup.com/articles/breadcrumbs/) -- Location-based breadcrumbs for hierarchical content

**SEO / Structured Data (HIGH confidence -- schema.org + expert sources):**
- [schema.org/DefinedTerm](https://schema.org/DefinedTerm) -- Structured data type for taxonomy concept pages
- [WordLift Knowledge Graph SEO](https://wordlift.io/blog/en/knowledge-graph-seo/) -- Entity-first SEO strategy: each page = one canonical entity
- [Entity-First SEO (Search Engine Land)](https://searchengineland.com/guide/entity-first-content-optimization) -- Aligning content with knowledge graph entities

**DOT Parsers (MEDIUM confidence -- npm packages, reference only):**
- [@ts-graphviz/parser (npm)](https://www.npmjs.com/package/@ts-graphviz/parser) -- TypeScript DOT parser (reference for data extraction approach)
- [dotparser (GitHub)](https://github.com/anvaka/dotparser) -- Lightweight DOT parser producing AST

**Astro Infrastructure (HIGH confidence -- official docs):**
- [Astro Content Collections](https://docs.astro.build/en/guides/content-collections/) -- Dynamic route generation with getStaticPaths
- [Astro Dynamic Routes](https://docs.astro.build/en/reference/routing-reference/) -- Bracket-based route parameters

---
*Feature research for: AI Landscape Explorer (subsequent milestone on Astro 5 portfolio site)*
*Researched: 2026-03-26*
