# Project Research Summary

**Project:** Database Compass (Database Model Explorer)
**Domain:** Static content pillar — interactive database model comparison and exploration tool on an existing Astro 5 portfolio site
**Researched:** 2026-02-21
**Confidence:** HIGH

## Executive Summary

Database Compass is a static reference guide built as a new content pillar on patrykgolabek.dev, following the Beauty Index pattern rather than the Dockerfile Analyzer pattern. The existing Astro 5 stack already provides every capability required — content collections with `file()` loader, build-time SVG generation via `radar-math.ts`, sortable tables via `ScoringTable.astro`, and the Satori+Sharp OG image pipeline. Zero new npm packages are needed. The feature set centers on 12 database model categories scored across 8 dimensions, each rendered with an octagonal radar chart, sortable comparison table, complexity spectrum visualization, and full SEO infrastructure. The tool's differentiator is the combination of visual multi-dimensional scoring, opinionated architect perspective, and character sketches — a combination no existing database reference (DB-Engines, Prisma Data Guide, AWS/Azure guides) provides.

The recommended approach is a phased build starting with data schema and JSON authoring, then visualization components, then detail pages, then the overview page, and finally SEO infrastructure and site integration. Content authoring is the highest-effort work unit in this milestone — 12 model entries each requiring 400-600 words of unique expert-voice technical content across well-defined structured fields. The code patterns are all proven; the challenge is the content investment. The correct URL structure is `/db-compass/` as a top-level content pillar (not `/tools/db-compass/`), matching the Beauty Index's placement.

The two critical risks to manage from the start: (1) dimension scores need transparent rubrics and per-score justification text to avoid credibility attacks from database professionals, and (2) multi-model databases like Redis, PostgreSQL, and Cosmos DB must carry a `crossCategory` field in the JSON schema to acknowledge their multi-model nature. Both risks are data schema design decisions that must be made before any content is authored — retrofitting them later is costly.

---

## Key Findings

### Recommended Stack

The existing Astro 5 stack (v5.17.1) is fully sufficient. The single most important finding from the stack research is that zero new dependencies are needed. Every required capability has a proven precedent in the codebase. `radar-math.ts` already supports variable axis counts — passing 8 values produces an octagonal chart. `ScoringTable.astro` has a production-tested sortable table implementation in ~55 lines of inline JavaScript. The Satori+Sharp pipeline already handles OG image generation. Content collections with the `file()` loader already handle flat JSON data.

**Core technologies:**
- **Astro 5.17.1 (content collections):** Single new collection `dbModels` — loaded via `file()` loader with Zod validation, identical to the existing `languages` collection pattern
- **TypeScript (radar-math.ts + new spectrum-math.ts):** Build-time SVG math — octagonal radar charts reuse existing generic functions; complexity spectrum is a new pure-TS utility following the same pattern
- **Tailwind CSS v3.4.19:** Responsive layout, score tables, cards, badges — no new configuration needed
- **Satori + Sharp (existing versions):** OG image generation for 1 overview + 12 detail pages = 13 images (not 66+ vs-comparison pages)
- **GSAP v3.14.2:** Optional scroll animations — same ScrollTrigger integration already in use

**What NOT to add:** D3.js, Chart.js, React islands for static content, `@astrojs/db`, any headless CMS, `sortable-tablesort` or similar table libraries, `@tanstack/react-table`.

### Expected Features

**Must have (table stakes):**
- Overview page showing all 12 model categories with sorting and spectrum visualization
- 12 detail pages at `/db-compass/[slug]/` with consistent structured content
- 8-axis octagonal radar chart per category (adapted from Beauty Index 6-axis)
- Category descriptions with 3-5 concrete use cases and when-NOT-to-use guidance
- 3-5 representative databases per category with brief descriptions
- Responsive layout (mobile-first; radar charts scale or hide below 480px)
- SEO-optimized pages with unique titles, meta descriptions, JSON-LD, breadcrumbs, and OG images
- Navigation between categories (prev/next links)
- Trade-offs and explicit limitations per category
- Consistent data model enforced by Zod schema

**Should have (competitive differentiators):**
- Character sketches per model (personality-driven descriptions in the Beauty Index style)
- CAP theorem position visual per detail page
- Ops vs Dev scoring split (4 operational + 4 developer dimensions visualized distinctly)
- Custom OG images (1 overview + 12 detail = 13 total via Satori+Sharp)
- Dataset + TechArticle JSON-LD structured data
- Share controls (SVG-to-PNG download for radar charts)
- Complexity spectrum on overview page

**Defer to v1.1+:**
- VS comparison pages (top 15-20 pairs) — high SEO value but significant scope; do after core is stable
- Companion blog post — can ship with core or immediately after
- Cross-links from existing blog posts to Database Compass pages

**Anti-features (explicitly out of scope):**
- Individual database entries (explodes scope to 50+ entries competing with DB-Engines)
- Live benchmarks or performance data (context-dependent, stale quickly)
- Interactive database selector wizard (oversimplifies, requires ongoing maintenance)
- User-submitted ratings (requires backend and moderation)
- Real-time data from DB-Engines (no public API exists)
- Pricing comparison (changes too frequently)

### Architecture Approach

The architecture mirrors the Beauty Index pattern: a single flat JSON file (`src/data/db-compass/models.json`) registered as an Astro content collection, Zod-validated, rendered at build time through Astro `.astro` components with no client-side JavaScript beyond the existing inline sort table script. New pages live at `/db-compass/` as a top-level path, not under `/tools/`. The existing `radar-math.ts` is used unchanged for radar chart math — it is already axis-count agnostic. Three new TypeScript utility files are needed: `schema.ts` (Zod schema + type exports), `compass-dimensions.ts` (8 dimension metadata), and `spectrum-math.ts` (complexity spectrum SVG math). Seven new Astro components handle rendering. Two files are modified: `content.config.ts` (add collection) and `og-image.ts` (add OG generators). One homepage modification adds a third callout card.

**Major components:**
1. **`src/data/db-compass/models.json`** — Single source of truth: 12 model entries with scores, strengths, weaknesses, use cases, representative databases, character sketches, and `crossCategory` metadata
2. **`src/lib/db-compass/schema.ts`** — Zod schema with `dbModelSchema`, `crossCategory` field, per-dimension `justification` strings, `lastVerified` date, and score helpers (`totalScore()`, `dimensionScores()`)
3. **`src/lib/db-compass/compass-dimensions.ts`** — 8 dimension metadata (key, name, shortName, description, color, rubric endpoints) — the single source of truth for dimension definitions
4. **`src/lib/db-compass/spectrum-math.ts`** — Pure-TS complexity spectrum SVG math following the `radar-math.ts` pattern
5. **`src/components/db-compass/CompassRadarChart.astro`** — 8-axis octagonal radar chart, reuses `radarPolygonPoints()` and `hexagonRingPoints()` from existing `radar-math.ts`
6. **`src/pages/db-compass/[slug].astro`** — 12 detail pages via `getStaticPaths()` assembling all components
7. **`src/pages/db-compass/index.astro`** — Overview page with complexity spectrum, model grid, and sortable comparison table
8. **OG image endpoints** — `src/pages/open-graph/db-compass.png.ts` and `src/pages/open-graph/db-compass/[slug].png.ts`

**Data flow:** `models.json` → Astro `file()` loader + Zod validation → `getCollection('dbModels')` → `getStaticPaths()` → per-model Astro component rendering → static HTML output.

### Critical Pitfalls

1. **Multi-model database categorization creates credibility attacks (P1)** — Placing Redis under "Key-Value" invites immediate pushback from database professionals because Redis, PostgreSQL, Cosmos DB, and MongoDB all support multiple models. Prevention: add `crossCategory: string[]` to the JSON schema from day one; add a visible methodology note explaining "primary data model" categorization; render "Also supports" cross-links on each detail page. Address in: data schema design phase.

2. **Dimension scores look arbitrary without transparent rubrics (P2)** — Database scoring carries expectations of technical objectivity. An unexplained 4/10 on "Ecosystem Maturity" destroys tool credibility. Prevention: define rubrics for all 8 dimensions (what does 1/10 mean? what does 10/10 mean?) before assigning any scores; add a `justification` string field per dimension per model; show rubrics inline on detail pages, not only in the blog post. Address in: data schema design phase, before content authoring.

3. **8-axis radar chart label crowding and perception failure (P3)** — 8 axes is at the upper limit of radar chart readability. At 45-degree spacing, adjacent labels collide. The existing `generateRadarSvgString()` was designed for 6 axes. Prevention: test the chart at actual render sizes (375px, 768px, 1024px) before shipping; group related dimensions on adjacent axes; always pair chart with a score breakdown table; hide radar chart below 480px on mobile. Address in: component development phase.

4. **Static scores become stale within months (P4)** — Database capabilities change rapidly with major version releases. Prevention: add `lastVerified` date field per model and `dataAsOf` overview-level metadata; frame as "Database Compass 2026" explicitly in title and URL; avoid specific version numbers in data. Address in: data schema design phase and content authoring phase.

5. **SEO content too thin to rank in competitive database SERP (P5)** — Database comparison pages are dominated by DB-Engines, AWS/Azure, and Prisma with high domain authority. Template-driven pages with 200-word descriptions will not rank. Prevention: each detail page must have 400-600 words of unique expert-voice content; include real company examples; use unique meta descriptions; include HTML tables for dimension scores (Google extracts these for featured snippets); add internal cross-links between related model pages. Address in: content authoring phase.

---

## Implications for Roadmap

The build follows clear dependency ordering. Content authoring is the blocking constraint, not code. The architecture is straightforward reuse of proven patterns. The phases below reflect the build order from ARCHITECTURE.md with additional content authoring gates.

### Phase 1: Data Foundation and Schema

**Rationale:** Everything renders from data. The JSON schema must be designed with `crossCategory`, per-dimension `justification` strings, `lastVerified` dates, and rubric-aware dimension definitions before a single line of content is written. Retrofitting these fields after 12 entries are authored is costly.
**Delivers:** Validated TypeScript schema, Zod types, 8 dimension metadata with rubrics, content collection registered in `content.config.ts`, `models.json` structure established.
**Addresses:** T10 (consistent data model), P2 (score arbitrariness prevented), P1 (multi-model metadata), P4 (staleness framing)
**Avoids:** Retrofitting `crossCategory` and `justification` fields after content is written.
**Research flag:** Standard patterns — no phase research needed. Direct precedent in `src/lib/beauty-index/schema.ts` and `src/data/beauty-index/languages.json`.

### Phase 2: Content Authoring (12 Model Entries)

**Rationale:** Content authoring is the highest-effort, most time-consuming task. It must happen early because every other phase depends on real data to render and test. Authoring with placeholder data produces misleading test results. Doing it last creates a compression crunch at the end.
**Delivers:** Complete `models.json` with all 12 entries: scores with justifications, strengths, weaknesses, use cases, avoid-when guidance, representative databases, character sketches, and `crossCategory` metadata. All entries meet the 400+ word rendering target when assembled.
**Addresses:** T4 (use cases), T5 (representative databases), T9 (trade-offs), D3 (character sketches), P5 (SEO thin content), P2 (score justifications)
**Avoids:** Authoring scores without rubrics defined (P2), forgetting `crossCategory` field for multi-model databases like Redis, PostgreSQL, Cosmos DB (P1).
**Research flag:** No code research needed. The dimension definitions and rubrics from Phase 1 are the prerequisite. This is content work, not technical research.

### Phase 3: Visualization Components

**Rationale:** Visualization components depend on schema types and dimension metadata from Phase 1, but can be built before all 12 content entries are complete. Building components first enables iterative testing as content is filled in.
**Delivers:** `spectrum-math.ts`, `ComplexitySpectrum.astro`, `CompassRadarChart.astro` (8-axis, tested at 375/768/1024px widths), `CompassScoringTable.astro` (sortable, follows `ScoringTable.astro` inline script pattern).
**Addresses:** T3 (scoring with visual representation), D1 (8-axis radar), D2 (complexity spectrum)
**Avoids:** Label crowding at 8 axes without testing (P3); mobile radar chart unreadability (P3).
**Research flag:** Standard patterns — `radar-math.ts` reuse is fully documented in ARCHITECTURE.md. The 8-axis label test is a verification step, not a research problem.

### Phase 4: Detail Pages (12 Pages)

**Rationale:** Detail pages assemble Phase 3 components with Phase 2 content. They are the primary SEO surface and the bulk of the page count. `[slug].astro` with `getStaticPaths()` follows the identical pattern to the Beauty Index.
**Delivers:** 12 static detail pages at `/db-compass/[slug]/`, each with radar chart, score breakdown, strengths and weaknesses, use cases, representative databases, character sketch, CAP theorem position, and nav links.
**Addresses:** T2 (detail pages), T7 (SEO), T8 (navigation), T9 (trade-offs), D1 (radar), D3 (character), D4 (ops/dev split), D5 (CAP theorem)
**Avoids:** Thin content (P5) — word count gate (400+ words per page) before phase is considered complete.
**Research flag:** Standard patterns — direct precedent in `src/pages/beauty-index/[slug].astro`.

### Phase 5: Overview Page

**Rationale:** The overview page depends on all 12 detail pages existing for accurate links and on the visualization components for the complexity spectrum, model grid, and sortable table. Building it last ensures grid cards link to complete, real pages.
**Delivers:** `/db-compass/index.astro` — hero section, complexity spectrum visualization, sortable model comparison table, category card grid with radar thumbnails.
**Addresses:** T1 (overview page), D2 (complexity spectrum)
**Avoids:** Grid cards linking to empty or placeholder pages during development.
**Research flag:** Standard patterns — follows the Beauty Index overview page structure.

### Phase 6: SEO Infrastructure and OG Images

**Rationale:** SEO infrastructure (JSON-LD, OG images, breadcrumbs) requires pages to exist. OG images require the radar SVG pipeline to be working. This phase is a pure enhancement layer on top of complete content.
**Delivers:** `DbCompassJsonLd.astro` (Dataset + ItemList schema for overview), per-page TechArticle JSON-LD, 13 OG image endpoints (1 overview + 12 detail), breadcrumb JSON-LD on all pages.
**Addresses:** T7 (SEO optimization), D8 (OG images), D9 (JSON-LD)
**Avoids:** Wrong JSON-LD schema type (P9 — use Dataset for overview, TechArticle for detail pages); OG image multiplication (P6 — 13 images, not 66+ vs-comparison images).
**Research flag:** Standard patterns — validated schema types documented in ARCHITECTURE.md and PITFALLS.md.

### Phase 7: Site Integration and Verification

**Rationale:** Site integration touches shared infrastructure (homepage, navigation, LLMs.txt, sitemap). Doing this last avoids disrupting in-progress work and ensures final integration matches the completed feature.
**Delivers:** Homepage third callout card (3-card horizontal grid layout), LLMs.txt and llms-full.txt updated to include Database Compass pages, sitemap verified (14 new URLs), header navigation verified, view transitions confirmed.
**Addresses:** P7 (homepage callout design), P8 (tools page taxonomy — `/db-compass/` top-level, not `/tools/`), P10 (LLMs.txt and sitemap coverage)
**Avoids:** Homepage vertical clutter from three stacked callouts (P7); LLMs.txt silently missing new pages (P10); nav active state errors for new URL prefix.
**Research flag:** Standard patterns — checklist verification, not research. PITFALLS.md provides the exact 14-item "Looks Done But Isn't" checklist.

### Phase Ordering Rationale

- **Data first, code second:** The JSON schema and content authoring must precede all rendering work. Schema changes cascade — adding `crossCategory` after authoring 12 entries costs hours of rework.
- **Content before components:** Components need real data to validate rendering fidelity. Testing with a 2-entry placeholder JSON masks real-world label collision and content overflow issues.
- **Components before pages:** Pages assemble components. Testing a page without its components is testing an empty shell.
- **Detail pages before overview:** The overview grid links to detail pages. Accurate link verification requires all 12 detail pages to exist.
- **Pages before SEO infrastructure:** JSON-LD, OG images, and breadcrumbs enhance existing pages. Generating them for non-existent pages is waste.
- **Integration last:** Shared site infrastructure changes go last to avoid breaking the existing site during a multi-phase build.

### Research Flags

**Phases needing deeper research during planning:**
- **Phase 2 (Content Authoring):** No code research needed, but dimension rubric definitions are a subject-matter task requiring expert judgment. The 8 dimension names proposed differ slightly across the three research files — a final reconciliation of dimension keys, names, and rubric endpoints is required before authoring begins (see Gaps section below).
- **Phase 3 (Visualizations):** The complexity spectrum 1D vs 2D decision (FEATURES.md recommends 2D scatter plot; ARCHITECTURE.md specifies 1D horizontal spectrum) must be resolved before building `spectrum-math.ts`. The choice affects the JSON schema (one `complexityPosition` float vs two — conceptual and operational).

**Phases with standard patterns (skip phase research):**
- **Phase 1 (Schema):** Direct precedent in `src/lib/beauty-index/schema.ts`
- **Phase 4 (Detail pages):** Direct precedent in `src/pages/beauty-index/[slug].astro`
- **Phase 5 (Overview):** Direct precedent in Beauty Index overview page
- **Phase 6 (SEO/OG):** Direct precedent in existing OG pipeline and `BeautyIndexJsonLd.astro`
- **Phase 7 (Integration):** Checklist verification using the 14-item list in PITFALLS.md

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All findings based on direct codebase analysis — existing files verified, npm packages checked, Astro docs confirmed. Zero new dependencies conclusion is certain. |
| Features | HIGH | Based on analysis of DB-Engines, Prisma Data Guide, AWS/Azure decision frameworks, dbdb.io, and Google E-E-A-T. The 12 category list is defensible and documented with inclusion/exclusion rationale. |
| Architecture | HIGH | Build-time SVG pattern and content collection pattern verified against existing source code. `radar-math.ts` axis-count agnosticism verified by reading the implementation. Data flow is a direct mirror of the Beauty Index. |
| Pitfalls | HIGH | Radar chart limitations sourced from visualization research with citations. Multi-model database problem sourced from Redis's own documentation and DB-Engines methodology critique. Build time numbers sourced from actual build output (714 pages in 22.17 seconds). |

**Overall confidence:** HIGH

### Gaps to Address

- **Dimension name reconciliation:** STACK.md, FEATURES.md, and ARCHITECTURE.md each propose slightly different dimension names and scoring keys. STACK.md uses (scalability, queryPower, schemaFlex, ecosystem, learning, performance, reliability, operability). FEATURES.md uses (scalability, performance, reliability, operability, queryFlexibility, schemaFlexibility, ecosystemMaturity, learningCurve). ARCHITECTURE.md uses (readLatency, writeLatency, queryFlexibility, scalability, consistency, schemaFlexibility, operationalComplexity, analyticsCapability). A single canonical 8-dimension list must be chosen before Phase 2 begins. Recommendation: use FEATURES.md's 4+4 operational/developer split as the organizing framework; use ARCHITECTURE.md's specific naming convention as the canonical key names.

- **Complexity spectrum: 1D vs 2D:** FEATURES.md recommends a 2D scatter plot (conceptual complexity vs operational complexity) as a genuine differentiator. ARCHITECTURE.md specifies a 1D horizontal spectrum using a single `complexityPosition` float. The 2D approach requires two scores per model instead of one, affecting the JSON schema. Resolution: if two complexity scores can be added to the schema without rework, implement 2D — the differentiator value is real. If it adds too much schema complexity for v1, default to 1D and defer 2D to v1.1.

- **URL structure confirmation:** PITFALLS.md and ARCHITECTURE.md both recommend `/db-compass/` as a top-level content pillar (not `/tools/db-compass/`). This decision should be confirmed before Phase 1 begins — URL structure affects content collection registration, sitemap, breadcrumbs, navigation active states, and LLMs.txt generation.

---

## Sources

### Primary (HIGH confidence — direct codebase analysis)
- `src/lib/beauty-index/radar-math.ts` — verified axis-count agnostic implementation; `values.length` and `numSides` parameters, not hardcoded 6
- `src/components/beauty-index/ScoringTable.astro` — verified sortable table inline script pattern (55 lines, zero dependencies, ARIA-accessible)
- `src/content.config.ts` — verified `file()` loader flat JSON array pattern
- `src/data/beauty-index/languages.json` — verified flat array data format and file size (~350 lines for 25 entries)
- `src/lib/beauty-index/schema.ts` — verified Zod schema pattern
- `src/lib/og-image.ts` — verified Satori+Sharp OG pipeline reuse points (`renderOgPng()`, `brandingRow()`, `accentBar()`)
- `package.json` — verified all existing dependencies and versions
- Build output — 714 pages in 22.17 seconds (600 are Beauty Index vs-comparison OG images)

### Primary (HIGH confidence — official documentation)
- [Astro Content Collections Guide](https://docs.astro.build/en/guides/content-collections/) — `file()` loader, `parser` property for nested JSON
- [DB-Engines Ranking Categories](https://db-engines.com/en/ranking_categories) — 20 categories, methodology
- [Schema.org Dataset](https://schema.org/Dataset) and [ItemList](https://schema.org/ItemList) — JSON-LD schema types
- [Redis Multi-Model Documentation](https://redis.io/technology/multi-model/) — multi-model categorization problem confirmed

### Secondary (HIGH confidence — domain research)
- [Prisma Data Guide](https://www.prisma.io/dataguide/intro/comparing-database-types) — database comparison content structure patterns
- [Azure Architecture Center Data Store Decision Tree](https://learn.microsoft.com/en-us/azure/architecture/guide/technology-choices/data-store-decision-tree) — evaluation dimensions framework
- [Highcharts: Radar Chart Explained](https://www.highcharts.com/blog/tutorials/radar-chart-explained-when-they-work-when-they-fail-and-how-to-use-them-right/) — axis count limits and readability thresholds (5-8 recommended)
- [Data-to-Viz: Spider Chart Caveats](https://www.data-to-viz.com/caveat/spider.html) — axis ordering effects on perception
- [Google E-E-A-T Framework](https://developers.google.com/search/docs/fundamentals/creating-helpful-content) — content quality signals for SEO
- [Backlinko: Featured Snippets](https://backlinko.com/hub/seo/featured-snippets) — HTML table extraction for comparison queries
- [Andy Pavlo: Databases in 2025 Retrospective](https://www.cs.cmu.edu/~pavlo/blog/2026/01/2025-databases-retrospective.html) — landscape change velocity (stale data risk)

### Tertiary (MEDIUM confidence — community sources)
- [Ainoya.dev: Cache Satori OGP Images in Astro](https://ainoya.dev/posts/astro-ogp-build-cache/) — 100-300ms per Satori render estimate
- [DB-Engines Ranking Method Critique](https://db-engines.com/en/ranking_definition) — proxy-based scoring limitations

---
*Research completed: 2026-02-21*
*Ready for roadmap: yes*
