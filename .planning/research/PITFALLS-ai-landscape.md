# Domain Pitfalls: AI Landscape Explorer

**Domain:** Interactive D3 force-directed graph with SEO pages, added to existing Astro 5 static site
**Researched:** 2026-03-26
**Overall Confidence:** HIGH (based on existing codebase patterns, D3 documentation, Astro documentation, and ecosystem evidence)

---

## Critical Pitfalls

Mistakes that cause rewrites, major performance regressions, or user-facing breakage.

### Pitfall 1: D3 Force Module Bloats the Existing ~17KB D3 Micro-Bundle

**What goes wrong:** The existing site uses a careful D3 micro-module strategy (d3-scale, d3-shape, d3-axis, d3-array, d3-selection, d3-path, d3-contour) totaling ~17KB gzipped. Adding `d3-force`, `d3-zoom`, and `d3-drag` for the force graph doubles this. Worse, importing `d3-force` pulls in `d3-quadtree`, `d3-dispatch`, and `d3-timer` as transitive dependencies. If someone accidentally imports from the umbrella `d3` package instead of individual modules, the entire 280KB D3 library gets bundled.

**Why it happens:** Force simulation needs modules the existing site does not use: `d3-force` (~15KB min), `d3-zoom` (~16KB min), `d3-drag` (~8KB min), plus their transitive deps. Developers unfamiliar with the micro-bundle strategy import `import { forceSimulation } from 'd3'` instead of `import { forceSimulation } from 'd3-force'`.

**Consequences:** Bundle size for the AI Landscape page balloons from ~17KB shared to 50-60KB+ total. Since the force graph is a single page (not site-wide), this JS should load ONLY on `/ai-landscape/` -- but improper code-splitting could leak it into the shared bundle affecting all 1090+ pages.

**Prevention:**
1. Install ONLY the needed micro-modules: `d3-force`, `d3-zoom`, `d3-drag` (d3-selection already installed)
2. Add `@types/d3-force`, `@types/d3-zoom`, `@types/d3-drag` to devDependencies
3. NEVER import from `d3` umbrella -- import from specific modules only
4. Use `client:only="react"` or `client:visible` to ensure the force graph component is an isolated island that does not pollute the shared bundle
5. After implementation, verify with `rollup-plugin-visualizer` (already in devDependencies) that d3-force modules appear only in the AI landscape chunk
6. Set a budget: force graph island should be under 40KB gzipped total (D3 modules + component code)

**Detection:** Run `npx astro build` and check chunk sizes. If any shared chunk grew by >5KB, force modules leaked.

**Phase to address:** Phase 1 (project scaffold / data model) -- set up the micro-module imports in the initial component skeleton.

---

### Pitfall 2: D3 Zoom Traps Page Scroll on Mobile

**What goes wrong:** D3's zoom behavior (`d3-zoom`) captures wheel events and touch gestures on the SVG/canvas element. On mobile, users trying to scroll past the force graph get trapped -- their touch gestures are consumed by D3's zoom handler instead of scrolling the page. On desktop, mouse wheel over the graph zooms instead of scrolling, making it impossible to scroll past the visualization without moving the cursor outside it.

**Why it happens:** `d3-zoom` calls `event.preventDefault()` on wheel and touch events by default. This is correct behavior for a full-screen visualization but catastrophic for an embedded visualization within a scrollable page. The D3 documentation acknowledges this as a known friction point (GitHub issues #2549, #141).

**Consequences:** Users (especially non-technical target audience) cannot scroll the page on mobile when the graph is in viewport. They get stuck. On desktop, they accidentally zoom the graph when trying to scroll. This is the single most common UX complaint for embedded D3 zoom visualizations.

**Prevention:**
1. Require a modifier key for zoom: `zoom.filter(event => event.ctrlKey || event.metaKey || event.type === 'mousedown')` -- plain wheel scrolls the page, Ctrl+wheel zooms the graph
2. On touch devices, require two-finger pinch for zoom, allow single-finger to scroll the page. Implement via `zoom.filter()` checking `event.touches.length >= 2`
3. Add a visible overlay hint: "Ctrl + scroll to zoom / Pinch to zoom" that appears when user hovers/focuses the graph area
4. Set `scaleExtent([0.5, 3])` to limit zoom range -- once at min/max scale, wheel events pass through to page scroll
5. Consider making the force graph a fixed-height container (e.g., 500px on desktop, 350px on mobile) with explicit boundaries rather than full-viewport

**Detection:** Test on actual mobile devices (not just Chrome DevTools emulator). Test with trackpad on laptop. Try scrolling from top to bottom of the page with the graph in the middle.

**Phase to address:** Phase 2 (interactive visualization) -- this must be solved during the zoom/pan implementation, not retrofitted.

---

### Pitfall 3: Force Simulation Runs on Every Re-render, Causing Layout Thrashing

**What goes wrong:** If the D3 force simulation is initialized inside a React component without proper lifecycle management, every re-render (state change, prop change, parent re-render) restarts the simulation. Nodes scatter to random positions and re-converge, causing visible layout thrashing. With React 18+ strict mode in development, effects run twice, making the problem even more visible.

**Why it happens:** D3 force simulation is stateful and imperative -- it mutates node positions in place. React is declarative and expects to control rendering. Naively calling `d3.forceSimulation()` inside a `useEffect` without cleanup creates multiple competing simulations. The existing codebase uses React Flow (which handles this internally) for graphs like PermissionFlowExplorer and DependencyGraph, so developers may not realize raw D3 force requires manual lifecycle management.

**Consequences:** Nodes visually "explode" and re-converge on state changes. CPU spikes from multiple concurrent simulations. On mobile, this causes visible jank and battery drain. Memory leaks from un-stopped simulations accumulate during view transitions.

**Prevention:**
1. Initialize simulation ONCE in a `useRef`, not in `useEffect` state
2. Use `useEffect` only for starting/stopping the simulation, with cleanup: `return () => simulation.stop()`
3. For node/edge data changes, update the existing simulation via `simulation.nodes(newNodes)` and `simulation.alpha(0.3).restart()` rather than creating a new simulation
4. Pre-compute the layout: run the simulation to completion (`simulation.tick(300)`) before the first render, then display the stable layout. Only animate when the user interacts (drag, filter)
5. Pattern to follow:
```typescript
const simulationRef = useRef<d3.Simulation | null>(null);

useEffect(() => {
  if (!simulationRef.current) {
    simulationRef.current = d3.forceSimulation(nodes)
      .force('charge', d3.forceManyBody().strength(-200))
      .force('link', d3.forceLink(links))
      .force('center', d3.forceCenter(width/2, height/2));
  }
  return () => { simulationRef.current?.stop(); };
}, []);
```

**Detection:** Open React DevTools Profiler. If the force graph component re-renders more than once on page load (excluding strict mode double-fire), the simulation is being recreated.

**Phase to address:** Phase 2 (interactive visualization) -- the core simulation setup.

---

### Pitfall 4: SSR/Hydration Crash from D3 DOM Access at Build Time

**What goes wrong:** D3 modules like `d3-selection`, `d3-zoom`, and `d3-drag` access `window`, `document`, and DOM APIs. If the force graph component is rendered during Astro's static build (SSR), the build crashes with `ReferenceError: window is not defined` or `document is not defined`. This is a hard build failure, not a runtime degradation.

**Why it happens:** Astro pre-renders pages to HTML at build time by default. If a component imports D3 in its module scope (outside a `useEffect`), the import executes during SSR. The existing codebase carefully avoids this by using `client:only="react"` for heavy interactive tools (DockerfileAnalyzer, K8sAnalyzer, ComposeValidator, GhaValidator) and `client:visible` for lighter components. A new developer might use `client:load` or forget the directive entirely.

**Consequences:** `astro build` fails entirely. Zero pages generated. CI/CD pipeline blocks. If the error is in a transitive import, the error message may be cryptic and hard to trace.

**Prevention:**
1. Use `client:only="react"` for the force graph component -- this skips SSR entirely and renders only on the client. This is the pattern already established for the tool analyzers in the existing codebase
2. NEVER import D3 at the module top level in an `.astro` file's frontmatter. D3 imports must be inside `<script>` tags or React components
3. For the individual `/ai-landscape/[slug]` pages that are static content (no force graph), those can render server-side normally -- only the interactive graph island needs `client:only`
4. Add a smoke test to CI: `astro build` must succeed after every change to AI landscape files

**Detection:** Run `astro build` locally before pushing. If it fails with `window is not defined`, trace the import chain.

**Phase to address:** Phase 1 (scaffold) -- choose the hydration directive (`client:only="react"`) in the initial component setup. This must be decided upfront, not changed later (changing from `client:visible` to `client:only` changes rendering behavior).

---

### Pitfall 5: ~80 Thin SEO Pages Trigger Google's Helpful Content Penalty

**What goes wrong:** Generating ~80 individual `/ai-landscape/[slug]` pages (one per AI concept) with short, template-generated descriptions creates "thin content" pages. Google's 2025-2026 Helpful Content system (now integrated into core ranking) penalizes sites with mass-produced pages that lack substantive, unique content. Traffic drops of 85-95% have been documented for sites relying on thin programmatic SEO pages.

**Why it happens:** The temptation is to auto-generate pages from the DOT file metadata: node label becomes the H1, cluster membership becomes a breadcrumb, edges become a "related concepts" list. This produces structurally correct pages with 50-100 words of unique content each -- exactly the pattern Google now penalizes. The existing site already generates 1090+ pages; adding 80 thin pages dilutes the site's overall content quality signal.

**Consequences:** Not just the 80 AI landscape pages get demoted -- Google's Helpful Content system is a site-wide signal. Thin AI landscape pages could drag down rankings for the entire portfolio site, including high-quality blog posts and guides. This is the highest-stakes pitfall because it affects the entire site's SEO.

**Prevention:**
1. Each concept page MUST have substantial, hand-crafted content (minimum 300-500 words of unique educational text per page). This is non-negotiable
2. Content should answer "What is this?", "Why does it matter?", "How does it relate to other concepts?", and "Real-world example" for each concept
3. Use the DOT file hierarchy to create topical authority clusters: AI > ML > Neural Networks > Deep Learning > GenAI, with each level linking to its children and parent
4. Consider a tiered approach: write full-length content for the ~15-20 most important concepts (LLM, Transformers, GenAI, Agentic AI, etc.) and group the remaining 60 into category overview pages rather than individual thin pages
5. Add `noindex` to any page that cannot meet the minimum content quality bar, then progressively index them as content is written
6. Cross-link heavily between AI landscape pages and existing blog posts that cover related topics (e.g., the Claude Code guide connects to Agentic AI concepts)

**Detection:** After deployment, monitor Google Search Console for "Excluded by 'noindex' tag" count and for any site-wide ranking changes. Check page indexing rate after 2-4 weeks.

**Phase to address:** Phase 1 (content/data model) for the tiered content strategy decision, and Phase 3 (SEO pages) for the actual content writing. Content quality must be validated BEFORE pages go live.

---

### Pitfall 6: OG Image Generation at Scale Breaks Build Performance

**What goes wrong:** The site already generates OG images for blog posts, beauty-index pages, db-compass pages, EDA pages, and guide pages using Satori + Sharp. Adding ~80 AI landscape concept pages means ~80 additional PNG renders at build time. Each OG image takes ~1 second (Satori SVG generation + Sharp PNG conversion). At 80 images, that is 80 seconds added to build time on top of the existing image generation load.

**Why it happens:** The existing `generateOgImage()` function in `src/lib/og-image.ts` loads fonts from disk, runs Satori (which converts React-like JSX to SVG), then pipes through Sharp for PNG conversion. This is CPU-bound, not I/O-bound, so it cannot be easily parallelized. The existing OG image endpoints (21 files in `src/pages/open-graph/`) already generate images for every dynamic page in the site.

**Consequences:** Build time increases from the current range to potentially 3-5+ minutes. GitHub Actions CI becomes slow. Development iteration suffers because `astro build` takes too long to validate changes. The pre-existing "Cannot find module renderers.mjs" OG image error may also resurface or worsen under increased load.

**Prevention:**
1. Reuse the existing `generateOgImage()` function with a consistent visual template for AI landscape pages -- do not create a new OG image pipeline
2. Consider using a single shared OG image for all AI landscape pages initially (like the existing `default.png.ts` pattern), then progressively add per-concept images later
3. If per-concept OG images are needed, use a simpler template (text overlay on solid color, no cover image processing) to reduce per-image generation time
4. Cache generated OG images between builds: check if the content hash has changed before regenerating. Sharp processing is the bottleneck, not Satori
5. Monitor build time after adding each batch of pages. Set a budget: total build time must not exceed 3 minutes

**Detection:** Time `astro build` before and after adding OG image endpoints. If build time increases by more than 60 seconds, optimize the template or implement caching.

**Phase to address:** Phase 3 (SEO pages) -- when the `[slug].png.ts` endpoint is created for AI landscape concept pages. Decide the OG image strategy (shared vs per-concept) early.

---

## Moderate Pitfalls

### Pitfall 7: Force Graph Unreadable on Mobile (80 Nodes in 350px Width)

**What goes wrong:** Rendering ~80 nodes with labels in a 350px-wide mobile viewport produces an illegible, cluttered visualization. Node labels overlap. Edges become a tangled mess. Touch targets are too small (finger vs cursor precision). The nested cluster hierarchy (AI > ML > NN > DL > GenAI) compounds the problem because cluster boundaries need visual space.

**Prevention:**
1. Do NOT attempt to show all 80 nodes on mobile at initial load. Show top-level clusters only (AI, ML, Levels of Intelligence, Agentic AI, Dev Tools) with expand/collapse
2. Implement a mobile-specific layout: vertical list of categories with expandable sections, not a force graph. The force graph is a desktop/tablet experience
3. Set a minimum viable width for the force graph: 768px. Below that, show the list view with a "View interactive map on desktop" message
4. For the side panel on mobile, use a bottom sheet pattern (slides up from bottom) instead of a side panel (which would consume half the already-small viewport)

**Detection:** Test on an iPhone SE (375px wide) and a standard Android phone (390px). If any node label requires zooming to read, the mobile experience needs redesign.

**Phase to address:** Phase 2 (interactive visualization) -- responsive breakpoint strategy must be decided during layout, not after the desktop version is built.

---

### Pitfall 8: DOT File Hierarchy Does Not Map Cleanly to Force Graph Clusters

**What goes wrong:** The DOT file defines nested `subgraph cluster_*` blocks (5 levels deep: AI > ML > NN > DL > GenAI) with explicit rank constraints and layout hints. D3 force simulation has no native concept of nested clusters. Developers try to replicate the DOT hierarchy by using `forceCluster` or `forceX`/`forceY` with group-specific targets, but the result looks nothing like the clean nested layout from Graphviz.

**Why it happens:** Graphviz (which renders DOT files) uses a fundamentally different layout algorithm (Sugiyama/hierarchical for `dot`, spring-based for `neato`). D3 force simulation is a physics engine. Trying to reproduce a hierarchical layout with physics forces creates a visual uncanny valley -- neither a clean hierarchy nor a natural force layout.

**Prevention:**
1. Accept that the force graph will look DIFFERENT from the DOT/SVG rendering. That is fine -- the force graph provides interactivity (click, zoom, explore) that the static SVG cannot
2. Use `forceX` and `forceY` with cluster-specific target positions to create loose groupings, not rigid nesting. Nodes from the same cluster gravitate toward the same region
3. Color-code clusters using the DOT file's existing color scheme (light cyan for AI, light green for ML, light yellow for NN, amber for DL, light red for GenAI) to maintain visual cluster identity without geometric nesting
4. Use convex hull overlays (semi-transparent colored regions) behind cluster members to show group boundaries dynamically as the layout evolves
5. Parse the DOT file into a structured JSON data model at build time, extracting nodes, edges, cluster membership, and colors. Do NOT try to parse DOT at runtime

**Detection:** If users cannot identify which cluster a node belongs to within 2 seconds of looking at the graph, the cluster visualization needs improvement.

**Phase to address:** Phase 1 (data model) for DOT-to-JSON parsing, Phase 2 (visualization) for cluster rendering strategy.

---

### Pitfall 9: Side Panel State Desyncs from Graph Selection

**What goes wrong:** Clicking a node opens a side panel with educational content about that concept. But the panel content does not update if the user clicks a different node while the panel is already open. Or worse, the panel shows content for node A while node B is visually highlighted in the graph. State management between the D3 force graph (imperative) and the React side panel (declarative) drifts.

**Why it happens:** D3 manages its own state via DOM mutations. React manages state via `useState`/`useReducer`. When a D3 click handler updates a `selectedNodeId` state, React re-renders the panel. But if the D3 click handler also applies visual highlighting directly via `d3.select(node).attr('fill', 'highlight')`, and the React re-render triggers a D3 re-paint, the two systems fight over the DOM.

**Prevention:**
1. React owns ALL state. D3 reads from React state (via refs or props) but never stores its own selection state
2. Click handler pattern: `onClick -> setSelectedNodeId(id)` in React, then `useEffect([selectedNodeId])` applies D3 visual highlighting. Never apply D3 highlighting inside the click handler directly
3. The existing codebase has a proven pattern in `PermissionFlowExplorer.tsx`: React Flow nodes have an `onClick` that calls `setSelectedNodeId`, and a `PermissionDetailPanel` component reads that state. Follow this exact pattern with D3
4. Side panel content should be driven by the content collection data (the same data that generates individual pages), not by inline strings in the component

**Detection:** Rapidly click 5 different nodes in sequence. If the panel ever shows content that does not match the highlighted node, state is desynced.

**Phase to address:** Phase 2 (interactive visualization) -- the state management pattern must be established from the first interactive prototype.

---

### Pitfall 10: Content Tone Mismatch -- Too Technical for Non-Technical Audience, Too Shallow for Technical Audience

**What goes wrong:** The AI Landscape Explorer targets non-technical users ("What is a transformer?") but the site's existing audience is technical (Kubernetes architects, DevSecOps engineers). Writing content that satisfies both audiences is hard. Overly simplified content ("AI is when computers think!") embarrasses the site's technical credibility. Overly technical content ("Transformers use scaled dot-product attention with multi-head projections") alienates the target non-technical audience.

**Why it happens:** The DOT file itself is technically accurate but dense (multi-line labels with abbreviations like "RLHF / DPO", "PCA (Dim. Reduction)"). Directly converting these labels into page content produces jargon-heavy text. Meanwhile, AI explanation content on the web tends toward either academic papers or "AI for dummies" blog posts, with little middle ground.

**Prevention:**
1. Write in the "smart friend at dinner" tone: assumes intelligence but not domain knowledge. Use analogies and concrete examples before introducing technical terms
2. Structure every concept page with a progressive disclosure pattern:
   - **Lead paragraph:** Plain English, zero jargon (non-technical audience reads this and feels informed)
   - **How it works:** Gentle technical explanation with analogies (curious non-technical readers dig deeper)
   - **Technical details (collapsible):** Accurate technical content (technical audience validates credibility)
   - **Why it matters:** Real-world impact (both audiences care about this)
3. Avoid the "explain like I'm 5" trap. The audience is adults who are smart but not ML engineers. Treat them with respect
4. Every concept must include at least one concrete, relatable example ("When Netflix recommends a movie you end up loving, that is collaborative filtering -- a type of unsupervised learning")
5. Peer review: have a non-technical person read 3 random concept pages before publishing the batch. If they have questions, the content needs revision

**Detection:** Readability score check (aim for Flesch-Kincaid grade 8-10 for lead paragraphs, 12-14 for technical sections). If lead paragraphs score above grade 12, they are too technical for the target audience.

**Phase to address:** Phase 3 (SEO pages / content creation) -- content writing is the most time-intensive phase and cannot be rushed.

---

### Pitfall 11: View Transitions Break Force Graph State on Navigation

**What goes wrong:** Astro's view transitions (which the site uses for smooth page navigation) re-run page scripts on navigation. If a user navigates from `/ai-landscape/` to another page and back, the force graph re-initializes from scratch: simulation restarts, zoom resets to default, selected node deselects. The user loses their exploration context.

**Why it happens:** The existing site already deals with this for ParticleCanvas and CustomCursor via `window.__*` global state persistence and the `astro:page-load` / `astro:before-swap` lifecycle hooks. But the force graph is more complex -- it has zoom state, selected node, simulation positions, and potentially a side panel open state. The `transition:persist` directive preserves the DOM element but CSS animations and iframes restart regardless.

**Prevention:**
1. Use `client:only="react"` (not `client:visible`) to ensure the component is never server-rendered. Combined with `transition:persist`, this preserves React state across navigations
2. Store zoom transform and selected node in URL search params or a nanostores atom (nanostores is already installed) so state survives full page reloads
3. For simulation positions: after the simulation converges, save node positions to a ref. On re-mount, initialize nodes at their saved positions instead of random positions
4. Accept that returning to the graph after navigating away may require a brief re-initialization. Prioritize fast re-initialization (pre-computed positions) over seamless persistence

**Detection:** Navigate from `/ai-landscape/` to `/about/` and back using the site navigation. If the graph visually "restarts" (nodes scatter and re-converge), state persistence is broken.

**Phase to address:** Phase 2 (interactive visualization) -- view transition integration should be tested after the basic graph works, not as a final polish step.

---

## Minor Pitfalls

### Pitfall 12: Accessible Labels Missing from Force Graph SVG

**What goes wrong:** D3-generated SVGs lack semantic HTML, ARIA labels, and keyboard navigation by default. Screen readers cannot convey the graph structure. Keyboard-only users cannot select nodes. The site's existing accessibility patterns (skip links, ARIA labels, semantic HTML, focus management) do not extend automatically to D3-generated content.

**Prevention:**
1. Add `role="img"` and `aria-label="Interactive AI concept map showing relationships between artificial intelligence fields"` to the root SVG element
2. Add `<title>` and `<desc>` elements inside the SVG for screen readers
3. Implement keyboard navigation: Tab moves focus between nodes, Enter/Space selects a node and opens the side panel
4. Each node should have `role="button"`, `tabindex="0"`, and `aria-label` with the concept name
5. Provide a text-based alternative below the graph: "View as a list" link that shows the same data in an accessible table format

**Phase to address:** Phase 2 (interactive visualization) -- bake accessibility into the initial implementation, do not bolt it on later.

---

### Pitfall 13: Content Collection Schema Grows Unwieldy

**What goes wrong:** The existing `content.config.ts` already defines 10 collections (blog, languages, dbModels, edaTechniques, edaDistributions, edaPages, guidePages, guides, claudeCodePages, claudeCodeGuide). Adding an AI landscape collection (and possibly a sub-collection for concept pages) increases schema complexity. The file becomes a maintenance burden, and Zod schema validation errors during build become harder to debug.

**Prevention:**
1. Follow the existing pattern: add one `aiLandscape` collection using `file()` loader for the JSON data model (nodes, edges, clusters) and optionally one `aiLandscapePages` collection using `glob()` loader for MDX concept pages
2. Extract the Zod schema to a separate file (`src/lib/ai-landscape/schema.ts`) following the pattern of `src/lib/beauty-index/schema.ts` and `src/lib/eda/schema.ts`
3. Keep the schema flat: `{ id, label, description, cluster, parentCluster, color, slug, content? }`. Avoid nesting cluster hierarchy in the schema -- derive it from flat `cluster`/`parentCluster` fields
4. Validate the JSON data file in a unit test (vitest is already in devDependencies) to catch schema issues before they surface as cryptic Astro build errors

**Phase to address:** Phase 1 (data model) -- schema design happens first and is hard to change later.

---

### Pitfall 14: Tailwind Dynamic Class Interpolation Spreads to Force Graph Styles

**What goes wrong:** The existing `/guides/` hub page has a known tech debt issue with Tailwind dynamic class interpolation (constructing class names from variables). If the force graph component uses dynamic Tailwind classes for cluster colors (e.g., `` `bg-${cluster.color}` ``), Tailwind's JIT compiler will not detect these classes and they will be missing from the production CSS.

**Why it happens:** Tailwind CSS scans source files for complete class strings at build time. Dynamically constructed strings like `` `bg-${color}` `` are invisible to the scanner. The classes work in development (where Tailwind generates all possible classes) but break in production.

**Prevention:**
1. Use inline styles (`style={{ backgroundColor: cluster.color }}`) for dynamic colors from the DOT file's color scheme. The DOT file uses hex colors (`#e0f7fa`, `#c8e6c9`, etc.) which are ideal for inline styles
2. Alternatively, use CSS custom properties: define `--cluster-color` as an inline style, then use `bg-[var(--cluster-color)]` in Tailwind (this is safe because the Tailwind class itself is static)
3. NEVER construct Tailwind class names dynamically from variables. This is already a known debt pattern in the codebase -- do not repeat it
4. For the side panel, use static Tailwind classes with conditional rendering, not dynamic class construction

**Detection:** Run `astro build` and check if cluster colors render correctly in the production build. If any colors are missing in production but work in dev, Tailwind purging removed them.

**Phase to address:** Phase 2 (interactive visualization) -- when applying visual styles to cluster groups.

---

### Pitfall 15: Force Simulation Drains Battery on Mobile When Tab Is Backgrounded

**What goes wrong:** D3 force simulation runs a continuous `requestAnimationFrame` loop via `d3-timer`. If the user switches tabs on mobile, the simulation keeps running, draining battery. The existing site already handles this for ParticleCanvas (pauses animation when tab is hidden), but a new D3 component might not implement the same optimization.

**Prevention:**
1. Stop the simulation when the tab is hidden: listen for `document.visibilitychange` and call `simulation.stop()` on hidden, `simulation.restart()` on visible
2. After the initial layout converges (alpha < 0.01), stop the simulation entirely. Only restart on user interaction (drag, filter). An 80-node graph converges in ~300 ticks (~5 seconds) -- after that, the simulation should be idle
3. Set `alphaDecay(0.05)` (higher than default 0.0228) to make the simulation converge faster and stop sooner
4. Follow the existing pattern in `ParticleCanvas.astro` (lines 205-208) for visibility change handling

**Phase to address:** Phase 2 (interactive visualization) -- add visibility handling in the same PR as the simulation setup.

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Severity | Mitigation |
|-------------|---------------|----------|------------|
| Data model / DOT parsing | Pitfall 8 (DOT hierarchy mismatch), Pitfall 13 (schema bloat) | Moderate | Parse DOT to flat JSON at build time, extract schema to separate file |
| Interactive visualization | Pitfall 2 (scroll trap), Pitfall 3 (simulation lifecycle), Pitfall 4 (SSR crash), Pitfall 9 (state desync), Pitfall 11 (view transitions) | Critical | Use `client:only="react"`, require modifier for zoom, React owns all state |
| SEO pages / content | Pitfall 5 (thin content), Pitfall 6 (OG image scale), Pitfall 10 (tone mismatch) | Critical | Tiered content strategy, minimum 300 words per concept, shared OG template |
| Bundle / performance | Pitfall 1 (bundle bloat), Pitfall 7 (mobile readability), Pitfall 15 (battery drain) | Moderate-Critical | Micro-module imports only, mobile list view, stop simulation when idle |
| Styling / polish | Pitfall 12 (accessibility), Pitfall 14 (Tailwind dynamic classes) | Minor-Moderate | Inline styles for dynamic colors, ARIA labels on SVG elements |

---

## Integration Risk Summary

The existing codebase provides strong patterns to follow:
- **React Flow graphs** (PermissionFlowExplorer, DependencyGraph, K8sResourceGraph) demonstrate `client:only`/`client:visible` island patterns with detail panels
- **D3 micro-module strategy** (EDA notebooks, distribution explorer) proves the bundle isolation approach works
- **OG image pipeline** (21 endpoint files) shows the scaling challenge is already present
- **Content collections** (10 existing collections) show the schema pattern to follow

The highest-risk pitfalls are:
1. **Thin content penalty** (Pitfall 5) -- site-wide SEO impact, hardest to fix retroactively
2. **Scroll trap on mobile** (Pitfall 2) -- destroys UX for the primary audience, easy to prevent but hard to fix after the fact
3. **Bundle bloat** (Pitfall 1) -- affects all 1090+ pages if not isolated properly

## Sources

- [D3 Force Simulation Performance](https://github.com/d3/d3/issues/1936) -- GitHub issue on large layout performance
- [D3 Force Simulation Documentation](https://d3js.org/d3-force/simulation) -- Official D3 force module docs
- [D3 Zoom Scroll Conflict](https://github.com/d3/d3/issues/2549) -- GitHub issue on zoom blocking window scroll
- [D3 Zoom Touch Issues](https://github.com/d3/d3-zoom/issues/141) -- Touch event failures with d3-zoom
- [D3 SSR Support Discussion](https://github.com/d3/d3/issues/3635) -- D3 server-side rendering limitations
- [Astro View Transitions](https://docs.astro.build/en/guides/view-transitions/) -- Official Astro view transitions docs
- [Astro client:only Navigation Bug](https://github.com/withastro/astro/issues/8988) -- Known issue with client:only and view transitions
- [Astro Islands Architecture](https://docs.astro.build/en/concepts/islands/) -- Official Astro islands docs
- [Google Helpful Content 2026](https://orbitinfotech.com/blog/google-2026-helpful-content-update/) -- Google's anti-thin-content system
- [D3 Accessibility Patterns](https://fossheim.io/writing/posts/accessible-dataviz-d3-intro/) -- Accessible D3 visualizations
- [D3 Rollup Tree Shaking Issues](https://github.com/d3/d3/issues/3076) -- D3 umbrella package tree-shaking failures
- [OG Image Scaling with Satori](https://knaap.dev/posts/dynamic-og-images-with-any-static-site-generator/) -- Satori build-time generation at scale

---

*Pitfalls research: 2026-03-26*
