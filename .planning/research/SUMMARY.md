# Project Research Summary

**Project:** Cloud Architecture Patterns Visual Encyclopedia
**Domain:** Interactive visual encyclopedia for cloud/distributed systems architecture patterns — 7th content pillar added to existing Astro 5 portfolio site
**Researched:** 2026-03-01
**Confidence:** HIGH

## Executive Summary

This milestone adds a Cloud Architecture Patterns Visual Encyclopedia as the 7th content pillar to an existing Astro 5 portfolio site with 951 pages and Lighthouse 90+ on mobile. The work is a content pillar addition, not a platform or architecture change. Every technical capability needed — interactive SVG architecture diagrams, multi-dimensional radar chart scoring, and category filtering — already exists and is proven in the codebase. Zero new npm packages are required. The DB Compass pillar is the primary reference implementation: its data model, component pattern, OG image generation, and filter island directly map to what Cloud Patterns needs, with different data schemas and visual elements.

The recommended approach is a four-phase build: infrastructure (schema, data model, SVG generation framework, filter store) before content (13 patterns authored in batches), finishing with comparison pages and verification. The 13 core patterns cover 5 categories (Resilience, Data Management, Communication, Structural, Scaling) and are scored across 7 orthogonal dimensions rendered on heptagonal radar charts — the only pattern reference anywhere that offers quantitative, comparable scoring. This differentiation positions the encyclopedia to rank for competitive search terms like "cloud architecture patterns comparison" and "microservices pattern scoring."

The primary risks are SVG DOM node count explosion (architecture diagrams are graph-based, not chart-based, and can easily exceed 200 nodes), Google SpamBrain detection from 13 template-similar pages published simultaneously, and radar chart UX pitfalls (quadratic area growth misleads users). All three have clear, proven prevention strategies: hard node budgets with `<symbol>`/`<use>` reuse, batched publishing with 500+ unique words per pattern, and horizontal bar charts as the primary comparison visualization alongside radar charts as secondary.

## Key Findings

### Recommended Stack

Zero new packages are needed. See `STACK.md` for full analysis.

The three core capabilities map directly to existing, battle-tested implementations in the codebase. Interactive SVG architecture diagrams use the build-time TypeScript SVG generator pattern (13+ generators in `src/lib/eda/svg-generators/`) with CSS `:hover`/`:focus` pseudo-classes for interactivity — zero client JavaScript. Radar chart scoring reuses `radar-math.ts` directly: the function `hexagonRingPoints()` already accepts `numSides` as a parameter, so a 7-axis heptagonal chart requires zero modifications to the library. Category filtering reuses `UseCaseFilter.tsx` + `compassFilterStore.ts` + the data-attribute DOM toggling pattern proven across three existing pillars.

**Core technologies (all existing, zero new packages):**
- `radar-math.ts` (`src/lib/beauty-index/`): N-axis polygon math for heptagonal radar charts — direct reuse, no changes needed
- `CompassRadarChart.astro` pattern: Build-time Astro SVG component — clone with new `DIMENSIONS` array (7 dimensions vs 8)
- `UseCaseFilter.tsx` + `compassFilterStore.ts`: React island + nanostores atom — clone with 5 category labels replacing use-case categories
- `plot-base.ts` `PALETTE` + SVG generator pattern: CSS custom property theming + build-time SVG generation — new generators follow existing 13-generator pattern
- `satori@0.19.2` + `sharp@0.34.5`: OG image generation per pattern — follow `open-graph/db-compass/[slug].png.ts` pattern exactly
- `@xyflow/react@12.10.1`: Available for complex node-edge interactive diagrams if needed — not needed for the initial 13 static educational patterns
- `nanostores@1.1.0` + `@nanostores/react@1.0.0`: New `patternFilterStore.ts` follows existing atom pattern

**What must NOT be added:** Mermaid.js, GoJS, JointJS (diagramming libraries), recharts/visx/nivo (chart libraries), Zustand/Jotai/Redux (state managers), D3 full bundle, or any framework for SVG manipulation. All forbidden by existing architectural decisions.

### Expected Features

See `FEATURES.md` for full feature analysis, pattern selection rationale, and scoring dimension definitions.

**Must have (table stakes — v1 launch):**
- Catalog page (`/patterns/`) with pattern card grid grouped by 5 categories — users expect this; every major pattern reference leads with a catalog
- Category filter React island with 5 toggle pills — unique vs Azure/AWS/microservices.io which have no filtering
- Detail pages for all 13 patterns (`/patterns/[slug]/`) with summary, character sketch, radar chart, score breakdown, strengths/weaknesses, when to use/avoid, related patterns
- Custom SVG architecture diagram per pattern (13 total) — the highest-effort table-stakes item; a "visual encyclopedia" without visuals is not an encyclopedia
- 7-dimension radar chart scoring — the only pattern reference with quantitative comparison; dimensions are Scalability, Resilience, Complexity, Coupling, Consistency, Latency, Observability
- SEO metadata + JSON-LD CreativeWork structured data — existing pillars all have this; required for search indexing
- Prev/next navigation and share controls — reuse `ModelNav.astro` and `CompassShareControls.astro` directly
- Complexity spectrum bar — reuse `ComplexitySpectrum.astro` from DB Compass
- Sortable comparison table — reuse `CompassScoringTable.astro` from DB Compass
- Header nav addition and homepage callout card

**Should have (competitive, add after initial launch validates the pillar):**
- Pattern comparison pages (`/patterns/vs/[slug]/`) with overlay radar chart — adapt `VsComparePicker.tsx` and `OverlayRadarChart.astro` from Beauty Index
- Interactive SVG diagrams (hover states, flow animation, clickable components)
- Scoring justifications (written paragraph per dimension per pattern — 91 paragraphs total)
- OG images per pattern with radar chart embedded

**Defer (v2+):**
- Decision flowchart wizard (`/patterns/decide/`) — significant UX design required; build static comparison table first
- Pattern relationship force-directed graph — visually impressive, low practical utility vs inline related-pattern links
- Expansion to 18-20 patterns — add after initial 13 are fully polished and traffic validates the pillar

**Anti-features (do not build):**
- Exhaustive 40+ pattern catalog — maintenance burden; Azure has a docs team; start with 13 curated patterns
- Code implementation examples per pattern — language-specific, ages quickly, contradicts vendor-agnostic positioning
- User-submitted ratings/comments — requires auth, moderation, database; incompatible with static Astro site

**13 core patterns across 5 categories:**
- Resilience: Circuit Breaker, Retry with Backoff, Bulkhead
- Data Management: CQRS, Event Sourcing, Saga
- Communication: API Gateway, Pub/Sub, Backends for Frontends (BFF)
- Structural: Sidecar, Strangler Fig
- Scaling: Cache-Aside, Queue-Based Load Leveling

### Architecture Approach

The architecture directly mirrors the DB Compass pillar structure. See `ARCHITECTURE.md` for full component diagrams, code examples, and data flow documentation.

New files are organized under `src/lib/cloud-patterns/`, `src/components/cloud-patterns/`, `src/pages/cloud-patterns/`, and `src/data/cloud-patterns/` — following the identical directory convention as `lib/db-compass/`, `components/db-compass/`, `pages/db-compass/`, and `data/db-compass/`. Only 6 existing files require modification: `content.config.ts` (add 2 collections), `Header.astro` (1 nav link), `index.astro` homepage (1 callout card), `lib/og-image.ts` (1 new OG function), and `llms.txt.ts`/`llms-full.txt.ts` (pattern sections).

**Major components and their responsibilities:**
1. `src/lib/cloud-patterns/schema.ts` — Zod validation for all pattern data including diagram node/edge schemas, 7-dimension score schemas, and typed exports
2. `src/lib/cloud-patterns/diagram-gen/` — Build-time SVG generators: `diagram-base.ts` (serviceBox, databaseCylinder, etc.), `layout-engine.ts` (normalized 0-1 to pixel coordinate conversion), `edge-renderer.ts` (arrow styles for sync/async/event/data-flow connections)
3. `src/components/cloud-patterns/PatternRadarChart.astro` — Build-time heptagonal (7-axis) radar chart, cloned from `CompassRadarChart.astro` with new `DIMENSIONS` array
4. `src/components/cloud-patterns/ArchitectureDiagram.astro` — Assembles build-time SVG from pattern JSON node/edge data with CSS `:hover`/`:has()` interactivity, zero client JS
5. `src/components/cloud-patterns/DecisionFilter.tsx` — React island (`client:load`) for category filtering via nanostores atom + `data-pattern-category` DOM attribute toggling
6. `src/pages/cloud-patterns/index.astro` — Catalog page: filter island, card grid, scoring table, complexity spectrum
7. `src/pages/cloud-patterns/[slug].astro` — Detail page via `getStaticPaths()`: radar chart, architecture diagram, score breakdown, related patterns, prev/next
8. `src/stores/patternFilterStore.ts` — Nanostores `atom<string>('all')` for single-category filter state

**Key data flows:**
- `patterns.json` → Zod validation → `getCollection('cloudPatterns')` → `index.astro` renders card grid with `data-pattern-category` attrs + `DecisionFilter.tsx` toggles visibility at runtime
- `[slug].astro` uses `getStaticPaths()` → renders `PatternRadarChart.astro` (from `radar-math.ts`) + `ArchitectureDiagram.astro` (from `diagram.nodes`/`diagram.edges` data)
- `open-graph/cloud-patterns/[slug].png.ts` → Satori + Sharp → per-pattern OG PNG (following `open-graph/db-compass/[slug].png.ts` exactly)

**Architecture note on diagram interactivity:** CSS `:hover`/`:focus-within` and `:has()` selectors handle 80%+ of interactive requirements with zero JavaScript. The inline `<script>` pattern from `CompassScoringTable.astro` (using `astro:page-load` event) handles the remaining click-to-show-detail interactions. A full framework React island must NOT be used for SVG interactivity — it triggers the Astro SVG bundle inflation bug (800 bytes → 64KB).

### Critical Pitfalls

See `PITFALLS.md` for full analysis of 10 pitfalls with recovery strategies and phase-to-pitfall mapping.

1. **SVG DOM node count explosion tanks Lighthouse** — Architecture diagrams are graph-based (not chart-based) and can easily contain 300-800 SVG nodes. One measured 200KB inline SVG adds 1.4 seconds to FCP; Lighthouse flags pages exceeding 1,500 total DOM nodes. Prevention: hard 200-node limit per diagram, `<symbol>`/`<use>` for repeated elements, simple rectangles with text labels (no detailed icons), proof-of-concept diagram built and profiled before any content phase begins.

2. **SVG interactivity shipped as a React/framework component inflates JS bundle 80x** — Importing SVGs inside a `client:*` component triggers an Astro bug that pulls in server runtime + Zod, inflating the bundle from ~800 bytes to ~64KB. Prevention: CSS `:hover`/`:has()` for all hover effects (zero JS), vanilla JS `<script>` for click-to-reveal (< 1KB), NEVER import SVG files inside framework components.

3. **SpamBrain flags 13 template-similar pattern pages as scaled content abuse** — Each pattern page uses the same section structure; 13 pages published simultaneously is a SpamBrain risk pattern. Prevention: 500+ unique words per page with practitioner "From the Field" sections, publish in batches of 5-8, differentiate template structure across categories, monitor Google Search Console for "Crawled - currently not indexed" status.

4. **Multi-dimensional scoring system becomes meaningless** — Radar charts have well-documented UX problems (quadratic area growth, axis-ordering effects, enclosed area perceived as "quality"). Prevention: horizontal grouped bar charts as PRIMARY comparison visualization, radar charts secondary with methodology caveat, scores accompanied by written justification, scoring methodology published on a dedicated page, 7-dimension cap (not 8+).

5. **Build time regression from 40+ new OG images + complex SVG generation** — First build after adding 13 pattern pages generates ~13+ OG images (13 * 2.5s = ~33s) plus SVG generation. Prevention: verify content-hash OG cache applies to the new pattern collection, use deterministic hand-positioned layouts (O(n) rendering, not O(n²) force-directed), add patterns in batches of 5-8, record build time baseline before any content is added.

## Implications for Roadmap

Based on research, the natural phase structure follows the dependency graph from FEATURES.md: infrastructure before content, catalog before detail pages before comparison pages, each content batch before the next. The critical blocking dependency is SVG architecture diagrams: detail pages cannot ship without them. The catalog page CAN ship before detail pages are complete, providing immediate value.

### Phase 1: Infrastructure Foundation

**Rationale:** Every subsequent phase depends on this phase. The SVG generation framework, Zod schema, nanostore, and diagram node-count budgets must be established before any content is authored. Building the proof-of-concept Circuit Breaker diagram first validates the SVG generation approach and establishes the 200-node budget constraint with real data. The OG image cache extension and CSS scoping isolation must be verified before content phases create OG images.
**Delivers:** `src/lib/cloud-patterns/schema.ts` (Zod), `dimensions.ts` (7 dimensions), `diagram-gen/` (diagram-base, layout-engine, edge-renderer), `patternFilterStore.ts`, `PatternRadarChart.astro`, `ArchitectureDiagram.astro`, `DecisionFilter.tsx`, `categories.ts`; proof-of-concept Circuit Breaker diagram profiled at <200 DOM nodes; CSS isolation scoping established; build time baseline recorded; OG image cache verified for pattern collection.
**Addresses:** Infrastructure prerequisites for all FEATURES.md P1 items
**Avoids:** Pitfall 1 (SVG DOM explosion — framework established with node budgets), Pitfall 2 (JS bundle inflation — CSS+vanilla JS pattern established), Pitfall 5 (build time regression — baseline recorded, cache verified), Pitfall 7 (SVG accessibility — `role="img"`, `<title>`, `<desc>`, text alternative template established), Pitfall 9 (CSS/JS leakage — isolation scoped and tested)
**Research flag:** NONE — all patterns proven in existing codebase; DB Compass `[slug].astro` is the primary reference

### Phase 2: Catalog Page + First Content Batch (Resilience, Data Management)

**Rationale:** Publish the catalog page with the first 6 patterns (Resilience + Data Management categories) to get content indexed early. These two categories cover the most searched architecture patterns (Circuit Breaker, CQRS, Event Sourcing, Saga) and provide the highest SEO value per pattern authored. Publishing catalog before all 13 detail pages are live is correct: the catalog with cards, filtering, scoring table, and complexity spectrum delivers reference value even with partial detail page coverage.
**Delivers:** `patterns.json` with Resilience + Data Management entries (6 patterns), `categories.json`, catalog page (`/patterns/`) with `PatternCardGrid.astro`, `DecisionFilter.tsx` island, `ComplexitySpectrum.astro` reuse, `CompassScoringTable.astro` reuse; detail pages for first 6 patterns with radar charts, architecture diagrams, score breakdowns; JSON-LD structured data; header nav link; homepage callout card; first batch of 6 OG images.
**Uses:** All Phase 1 infrastructure; `radar-math.ts` direct reuse; `CompassScoringTable.astro` direct reuse; `ComplexitySpectrum.astro` direct reuse
**Implements:** Catalog page architecture, content collection pipeline, per-pattern detail page template
**Avoids:** Pitfall 3 (SpamBrain — first batch of 6 published with 500+ unique words each, practitioner sections included); Pitfall 4 (meaningless scoring — 3 pilot patterns scored and methodology verified before all 6); Pitfall 5 (build time — measured after 6 patterns, within budget before adding more)
**Research flag:** NONE — DB Compass `[slug].astro`, `index.astro`, and `UseCaseFilter.tsx` are complete reference implementations

### Phase 3: Remaining Content (Communication, Structural, Scaling)

**Rationale:** Complete the 13 core patterns with the remaining 7 (API Gateway, Pub/Sub, BFF, Sidecar, Strangler Fig, Cache-Aside, Queue-Based Load Leveling). These patterns are less frequently searched than Phase 2's selections but complete the 5-category coverage needed for a coherent encyclopedia. Publishing in a second batch (not simultaneous with Phase 2) follows the SpamBrain prevention strategy.
**Delivers:** Full `patterns.json` with all 13 patterns; detail pages for remaining 7 patterns with diagrams, radar charts, scoring; `relatedPatterns` bidirectional links verified across all 13 patterns; remaining 7 OG images; `llms.txt.ts` and `llms-full.txt.ts` sections updated.
**Avoids:** Pitfall 3 (SpamBrain — second batch published 1-2 weeks after Phase 2, not simultaneously); Pitfall 8 (decision support — static comparison table ships in this phase, no wizard built)
**Research flag:** NONE — identical content authoring pattern to Phase 2

### Phase 4: Comparison Pages + Interactive Enhancements

**Rationale:** Comparison pages (`/patterns/vs/[slug]/`) depend on all 13 detail pages existing. They cannot ship before Phase 3 completes. Interactive SVG enhancements (hover states beyond CSS, flow animations, click-to-reveal) are deferred until the base SVGs are solid and usage data confirms demand. OG images for remaining patterns are generated in this phase if not completed in Phase 3.
**Delivers:** Pattern comparison pages with overlay radar chart (adapting `VsComparePicker.tsx` and `OverlayRadarChart.astro` from Beauty Index); interactive SVG enhancements where CSS-only is insufficient; scoring justifications (91 written paragraphs); full OG image coverage for all 13 patterns.
**Uses:** `VsComparePicker.tsx` adaptation from Beauty Index; `generateRadarSvgString()` for overlay radar; `client:visible` for comparison picker
**Research flag:** NEEDS RESEARCH — the VsComparePicker and OverlayRadarChart components from Beauty Index need a quick research pass to verify the adaptation approach (different dimension counts, different route structure)

### Phase 5: Verification and Audit

**Rationale:** A dedicated verification phase catches systematic issues invisible in per-pattern review. PITFALLS.md defines a specific 12-item "Looks Done But Isn't" checklist covering DOM node counts, Lighthouse scores, JS payload, SpamBrain content differentiation, scoring methodology documentation, OG image cache, build time, mobile interaction latency, accessibility, CSS/JS isolation, comparison page load time, and cross-link bidirectionality.
**Delivers:** All 13 pattern pages confirmed at Lighthouse 90+ on mobile; SVG DOM node counts <200 on all diagrams; JS payload <5KB per pattern page; no CSS/JS leakage to EDA/Beauty Index/DB Compass pages; scoring methodology page published; all related-pattern cross-links bidirectional and resolving; Google Search Console monitoring established for 30 days post-launch.
**Avoids:** Every pitfall — this phase catches regressions that slipped through content phases
**Research flag:** NONE — checklist fully defined in PITFALLS.md

### Phase Ordering Rationale

- Infrastructure before content: the SVG generation framework, schema, and node-count budgets must be established before any diagrams are built; retrofitting these constraints after 13 diagrams exist is expensive
- Proof-of-concept diagram before content batch: one circuit breaker diagram built and profiled establishes the 200-node constraint with real evidence
- Catalog before all detail pages: catalog delivers value immediately and enables SEO indexing to begin
- Content in two batches (not one): SpamBrain prevention; 6 patterns first then 7 patterns 1-2 weeks later
- High-value patterns first (Resilience + Data Management): Circuit Breaker, CQRS, Event Sourcing, Saga are the most searched; publishing them first maximizes early organic traffic
- Comparison pages after all 13 detail pages: functional dependency; cannot compare patterns that don't have pages yet
- Dedicated verification phase: follows proven pattern from v1.9 case study milestone where a sweep caught systematic issues

### Research Flags

Phases likely needing `/gsd:research-phase` during planning:
- **Phase 4 (Comparison Pages):** The adaptation of `VsComparePicker.tsx` and `OverlayRadarChart.astro` from Beauty Index to Cloud Patterns involves different dimension counts (7 vs whatever Beauty Index uses) and a different route structure. A focused research pass on the Beauty Index implementation details will prevent incorrect assumptions during planning.

Phases with standard patterns (skip research-phase):
- **Phase 1:** DB Compass `schema.ts`, `dimensions.ts`, `compassFilterStore.ts`, and `UseCaseFilter.tsx` are complete reference implementations. SVG generator pattern is established across 13 existing generators.
- **Phase 2:** DB Compass `[slug].astro`, `index.astro`, and the `file()` content collection loader are complete references. Pattern content authoring follows FEATURES.md structure.
- **Phase 3:** Identical to Phase 2 authoring pattern.
- **Phase 5:** PITFALLS.md 12-item checklist is the complete verification framework.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Verified from installed `node_modules` and working code in the same repo; zero new packages required; all three key capabilities (SVG generation, radar math, filter state) proven across multiple existing pillars |
| Features | HIGH | Sourced from Azure Architecture Center, microservices.io, AWS Prescriptive Guidance, and Martin Fowler's distributed systems patterns; 13 patterns selected with documented rationale; 7 dimensions verified as orthogonal with sample scores producing distinct radar shapes |
| Architecture | HIGH | Based on direct codebase analysis; target state mirrors DB Compass pillar structure with documented file-by-file mappings; code examples verified against actual component signatures |
| Pitfalls | HIGH | Sourced from direct codebase experience, Astro GitHub issues (SVG bundle bug confirmed open), Lighthouse documentation, SpamBrain enforcement research, and data visualization research on radar chart limitations |

**Overall confidence:** HIGH

### Gaps to Address

- **Scoring methodology finalization before content authoring begins:** The 7 dimensions and sample scores (3 patterns illustrated in FEATURES.md) need to be finalized and documented on a methodology page before scoring all 13 patterns. The research provides the framework; the specific per-pattern scores are opinions that require explicit authoring and peer review, not just templating.

- **`VsComparePicker.tsx` + `OverlayRadarChart.astro` exact interface from Beauty Index:** The comparison page architecture in Phase 4 assumes these components exist in Beauty Index and can be adapted. The exact props, route structure, and radar overlay mechanism need to be verified before Phase 4 planning begins. This is the single gap that warrants a research flag.

- **SVG node count for complex patterns before Phase 2 content begins:** The 200-node budget established in Phase 1 via proof-of-concept needs to be validated against the most complex planned diagram (likely the Saga pattern, which has orchestration vs choreography variants, or API Gateway, which shows multiple backend service connections). If the Saga diagram can be built within 200 nodes, all 13 patterns can be. Validate this in Phase 1 before committing to Phase 2 scope.

- **Pattern page HTML size validation at scale:** With 13 patterns + OG images + scoring tables, the catalog page and detail pages need HTML size monitoring. Individual pattern page HTML should stay under 100KB. The comparison table page with all 13 patterns' scores is the highest-risk page for HTML bloat.

## Sources

### Primary (HIGH confidence)
- Existing codebase: `src/lib/beauty-index/radar-math.ts` — N-axis polygon math utility; framework-agnostic; N-axis support confirmed
- Existing codebase: `src/components/db-compass/CompassRadarChart.astro` — 8-axis build-time radar chart; direct model for 7-axis clone
- Existing codebase: `src/lib/db-compass/schema.ts` + `dimensions.ts` — Zod dimension scoring pattern; direct model for cloud pattern schema
- Existing codebase: `src/components/db-compass/UseCaseFilter.tsx` + `src/stores/compassFilterStore.ts` — React island + nanostores filter pattern; direct model for pattern filter
- Existing codebase: `src/components/db-compass/CompassScoringTable.astro` — Sortable table; direct reuse
- Existing codebase: `src/pages/open-graph/db-compass/[slug].png.ts` — Per-item OG generation; direct model
- Existing codebase: `src/lib/eda/svg-generators/plot-base.ts` + 13 generators — SVG generation pattern; direct model for diagram generators
- [Astro SVG client component bundle inflation bug](https://github.com/withastro/astro/issues/14577) — Confirmed open; 800 bytes → 64KB inflation when importing SVG inside `client:*` component
- [Lighthouse excessive DOM size audit](https://github.com/GoogleChrome/lighthouse/issues/6807) — 1,500 total DOM node threshold confirmed
- [SVG optimization performance data (VectoSolve)](https://vectosolve.com/blog/svg-optimization-web-performance-2025) — 200KB inline SVG adds 1.4s to FCP; measured data
- [Azure Architecture Center — Cloud Design Patterns](https://learn.microsoft.com/en-us/azure/architecture/patterns/) — 40+ patterns; canonical reference for when-to-use structure
- [Radar chart geometry caveats (data-to-viz.com)](https://www.data-to-viz.com/caveat/spider.html) — Quadratic area growth; axis ordering effects; established visualization research
- [SVG accessibility with ARIA (TPGi)](https://www.tpgi.com/using-aria-enhance-svg-accessibility/) — role="img" + aria-labelledby pattern; `<title>` + `<desc>` for accessible names

### Secondary (MEDIUM confidence)
- [microservices.io Pattern Language](https://microservices.io/patterns/) — 44+ patterns by Chris Richardson; source for feature analysis
- [AWS Prescriptive Guidance — Cloud Design Patterns](https://docs.aws.amazon.com/prescriptive-guidance/latest/cloud-design-patterns/introduction.html) — 14 patterns; competitor analysis
- [Google SpamBrain 2025 enforcement (geneo.app)](https://geneo.app/blog/google-spambrain-ai-update-2025-seo-compliance-best-practices/) — 500+ unique words + 30% differentiation threshold
- [Programmatic SEO content quality (getpassionfruit.com)](https://www.getpassionfruit.com/blog/programmatic-seo-traffic-cliff-guide) — 98% deindexing case study for template-similar pages
- [OG image caching with Satori (ainoya.dev)](https://ainoya.dev/posts/astro-ogp-build-cache/) — content-hash caching; 100-300ms savings per cached image
- [Wizard UX patterns (Nielsen Norman Group)](https://www.nngroup.com/articles/wizards/) — Multi-step abandonment rates; power users reject wizards

### Tertiary (applied from existing codebase patterns)
- Existing codebase: `src/components/tools/k8s-results/K8sResourceGraph.tsx` — `@xyflow/react` + dagre layout proven; available for complex interactive diagrams if needed
- [Martin Fowler — Patterns of Distributed Systems](https://martinfowler.com/articles/patterns-of-distributed-systems/) — Pattern selection rationale for distributed systems coverage

---
*Research completed: 2026-03-01*
*Supersedes: v1.10 SUMMARY.md (EDA Graphical Techniques, 2026-02-27)*
*Ready for roadmap: yes*
