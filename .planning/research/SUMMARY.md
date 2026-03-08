# Project Research Summary

**Project:** FastAPI Production Guide (v1.15 milestone)
**Domain:** Multi-page production framework guide as a portfolio content section on an Astro 5 static site
**Researched:** 2026-03-08
**Confidence:** HIGH

## Executive Summary

This milestone adds a multi-page FastAPI production guide section to an existing 1010+ page Astro 5 portfolio site. The guide explains the architectural decisions in the PatrykQuantumNomad/fastapi-template repository across ~11 domain pages (builder pattern, auth, middleware, observability, database, Docker, testing, health checks, security headers, rate limiting, caching). Research confirms that the entire guide can be built with zero new npm dependencies -- every technology needed is already installed and proven in the codebase. The unique differentiator is an "AI agent enablement" narrative that frames every production concern as something the agent never has to think about. No competing FastAPI guide combines multi-page depth, architecture diagrams, and this narrative angle.

The recommended approach follows the site's established EDA Encyclopedia pattern: MDX content collections for chapter pages, JSON metadata for guide-level structure, build-time SVG generators for architecture diagrams, and Astro components for navigation. The architecture is a direct extension of proven patterns (EDALayout, EdaBreadcrumb, PlotFigure, og-cache) rather than anything novel. The two diagram strategies -- build-time SVG generators for static architecture visualizations and @xyflow/react for interactive deployment topologies -- are both already operational in the codebase with 19 SVG generators and 3 React Flow implementations respectively.

The primary risks are code snippet drift (the fastapi-template is actively evolving with 20+ commits on 2026-03-08 alone), scope creep (the site has a demonstrated pattern of scope expansion -- EDA grew to 90+ pages, Beauty Index to 650+ comparison pages), and SEO cannibalization between guide pages and future blog posts. All three are preventable with upfront discipline: tag the template repo at a specific version, hard-cap at ~12 pages, and define keyword boundaries between guide pages and the companion blog post before writing content.

## Key Findings

### Recommended Stack

No new npm packages required. All diagrams use two existing patterns: build-time SVG generators (extending the EDA pattern from `src/lib/eda/svg-generators/`) for static architecture diagrams with CSS-driven interactivity, and @xyflow/react with @dagrejs/dagre for interactive deployment topology graphs. Mermaid.js was investigated thoroughly and rejected -- its ~200KB+ gzipped client bundle or Playwright headless browser requirement for SSR is architecturally disproportionate for ~8 diagrams on a site that currently ships zero diagram runtime.

**Core technologies (all existing):**
- **Astro 5 (^5.3.0):** Build-time SVG generation via frontmatter scripts, `set:html` rendering, MDX content collections
- **TypeScript (^5.9.3):** Type-safe SVG generator functions with typed diagram configs and Zod-validated content schemas
- **@xyflow/react (^12.10.1) + @dagrejs/dagre (^2.0.4):** Interactive node-graph for deployment topology diagrams -- proven in 3 existing tools
- **astro-expressive-code (^0.41.6):** Syntax-highlighted Python/YAML/Bash code blocks with copy buttons -- already configured site-wide
- **Tailwind CSS (^3.4.19):** Diagram container styling, responsive layout, guide page design
- **GSAP (^3.14.2):** Optional scroll-triggered diagram reveal animations -- already used for hero section

### Expected Features

**Must have (table stakes):**
- Landing page at `/guides/fastapi-production/` with chapter card grid and AI agent narrative hero
- 11 domain deep-dive pages with full prose, code snippets, "why not" callouts, production checklists, and configuration references
- GuideLayout.astro extending Layout.astro (following EDALayout pattern)
- Breadcrumb and previous/next page navigation
- Build-time OG images for all ~12 pages using existing Satori + Sharp pipeline with content-hash caching
- JSON-LD structured data (TechArticle + BreadcrumbList)
- Header navigation entry, homepage callout card
- Companion blog post with bidirectional cross-links
- LLMs.txt integration, sitemap inclusion (automatic via Astro)

**Should have (differentiators):**
- AI agent enablement narrative woven into every page (not isolated to one section)
- 4-6 build-time SVG architecture diagrams (request flow, middleware stack, builder pattern, auth flow, deployment topology)
- "Why not the obvious approach?" sections sourced from the template's 5 ADRs
- Builder pattern as compositional narrative -- each page expands one `setup_*()` method
- Production checklist callouts and configuration reference tables per domain page

**Defer (v2+):**
- Additional guides for other templates (Next.js, Go) -- only after FastAPI guide validates the format
- Printable/PDF export, versioned guides, guide search/filter

### Architecture Approach

The guide integrates as a new content section following the established hybrid pattern: a `guidePages` MDX content collection (glob-loaded) for chapter content with embedded components, and a `guides` JSON collection (file-loaded) for guide-level metadata including chapter ordering and template repo URLs. Page generation uses `getStaticPaths()` in `[slug].astro` to compute navigation props (prev/next/sidebar) at build time with zero client JavaScript for navigation. Build-time SVG generators live in `src/lib/guides/svg-generators/` following the exact pattern from `src/lib/eda/svg-generators/`. Starlight was considered and rejected -- it is a full-site theme that would conflict with the existing design language.

**Major components:**
1. **Content layer** (`src/data/guides/fastapi-production/`) -- guide.json metadata + numbered MDX chapter files with Zod-validated frontmatter
2. **Page generation layer** (`src/pages/guides/fastapi-production/`) -- index.astro landing page + [slug].astro chapter pages via getStaticPaths
3. **Component layer** (`src/components/guides/`) -- GuideBreadcrumb, GuideNav, GuidePrevNext, GuideJsonLd, CodeFromRepo, ArchitectureDiagram, FileTree
4. **Library layer** (`src/lib/guides/`) -- schema.ts (Zod schemas), routes.ts (URL builders), svg-generators/ (architecture diagram SVGs)
5. **OG image layer** (`src/pages/open-graph/guides/`) -- per-chapter OG image endpoints reusing existing og-cache.ts infrastructure

### Critical Pitfalls

1. **Code snippet drift** -- The fastapi-template is actively evolving. Tag the repo at a specific version (e.g., v1.0.0), annotate every snippet with source file path + tag, and show conceptual patterns rather than verbatim code. Address in Phase 1 before any content is written.
2. **Scope creep** -- Hard-cap at ~12 pages. Each domain page covers WHAT, WHY, and HOW TO CONFIGURE -- not full theory. The guide is a map of decisions, not a textbook. Address in Phase 1 with explicit depth boundaries.
3. **SEO cannibalization** -- Blog post targets broad keywords, guide pages target long-tail specifics. Define keyword boundaries before writing. Hub-and-spoke model with canonical cross-links.
4. **Architecture diagram maintenance** -- Use build-time SVG components with TypeScript data constants, not exported PNG files. Diagrams receive data as props, making them updateable by changing a constant.
5. **Build time regression** -- Reuse existing OG image caching (`getOrGenerateOgImage()`). Zero new npm dependencies. Measure build time before/after each phase.

## Implications for Roadmap

Based on research, suggested phase structure:

### Phase 1: Foundation and Content Planning
**Rationale:** All other phases depend on schemas, navigation data structure, and content scope decisions. Pitfalls P1 (snippet drift) and P2 (scope creep) must be addressed here. The template repo must be tagged before any content references it.
**Delivers:** Zod schemas, route helpers, guide.json with chapter ordering, content.config.ts collections, tagged template repo release, keyword boundary document
**Addresses:** GuideLayout.astro, schema.ts, routes.ts, guide.json, content.config.ts modifications
**Avoids:** P1 (snippet drift -- tag repo), P2 (scope creep -- define boundaries), P3 (SEO cannibalization -- define keyword targets)

### Phase 2: Page Infrastructure and Navigation
**Rationale:** Page templates and navigation components must exist before content can be authored. Architecture depends on the content collection registered in Phase 1. The first MDX chapter validates the entire pipeline end-to-end.
**Delivers:** GuideLayout.astro, GuideBreadcrumb, GuideNav, GuidePrevNext, [slug].astro page template, index.astro landing page, first MDX chapter (01-project-structure.mdx) as pipeline validation
**Uses:** Astro content collections, getStaticPaths, existing Layout.astro
**Implements:** Chapter-aware navigation pattern, build-time nav computation
**Avoids:** Anti-pattern of React islands for static navigation

### Phase 3: Guide-Specific Components
**Rationale:** CodeFromRepo, FileTree, and ArchitectureDiagram components are used inside MDX content. They should be built before bulk content authoring so all 11 chapters can use them immediately. SVG diagram generators belong here.
**Delivers:** CodeFromRepo.astro, FileTree.astro, ArchitectureDiagram.astro, diagram-base.ts, 4-6 SVG generator functions, guide-diagrams.css
**Uses:** Build-time SVG pattern from EDA, CSS-only interactivity (hover highlights, animated flow arrows)
**Avoids:** P4 (diagram maintenance -- TypeScript constants, not PNG exports)

### Phase 4: Content Authoring (All 11 Domain Pages)
**Rationale:** With infrastructure and components in place, all 11 domain pages can be authored. This is the bulk of the work. Each page follows the consistent 7-section template (agent framing, problem, solution, why-not, config reference, checklist, agent summary).
**Delivers:** All 11 MDX chapter files with full prose, code snippets, diagrams, production checklists, configuration references, and AI agent narrative
**Addresses:** All P1 table-stakes features, all differentiator features (AI narrative, "why not" sections, checklists)
**Avoids:** P2 (scope creep -- enforce 2000-word limit per page), P6 (non-self-contained content -- apply "never seen the repo" review test to each page)

### Phase 5: SEO, OG Images, and Site Integration
**Rationale:** OG images need finalized page titles/descriptions. JSON-LD, LLMs.txt, header nav, and homepage callout require pages to exist. The companion blog post cross-links to all 11 pages, so it must be written last.
**Delivers:** GuideJsonLd.astro, per-chapter OG images with caching, Header.astro "Guides" link, homepage callout card, companion blog post, LLMs.txt entries, build time verification
**Avoids:** P3 (SEO cannibalization -- implement hub-and-spoke cross-linking), P5 (build time regression -- verify OG cache works, measure total build time), P7 (navigation complexity -- test mobile nav)

### Phase Ordering Rationale

- **Phase 1 before everything:** Schemas and content structure are foundational dependencies. The architecture research shows that `content.config.ts`, `schema.ts`, and `guide.json` must exist before any page template or MDX file can be created.
- **Phase 2 before Phase 3:** Page templates validate the collection pipeline. There is no point building SVG generators if the content collection is misconfigured.
- **Phase 3 before Phase 4:** Components should exist before content authoring begins. Writing 11 MDX files without CodeFromRepo or ArchitectureDiagram means retrofitting them later.
- **Phase 4 as the largest phase:** Content authoring is the bulk of effort. With all infrastructure ready, chapters can potentially be authored in parallel.
- **Phase 5 last:** Integration touches (OG images, JSON-LD, blog post, header nav) require stable content. The companion blog post specifically requires all 11 pages to exist for cross-linking.

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 3 (Guide-Specific Components):** The SVG diagram generators for architecture diagrams (middleware stack, request lifecycle, builder pattern) are a new diagram type not previously built. While the SVG generator pattern is proven with 19 existing generators, architecture diagrams have different primitives (boxes, arrows, layers, connectors) than data visualizations (axes, grids, data points). The `diagram-base.ts` module needs careful design.
- **Phase 4 (Content Authoring):** Each domain page requires understanding the FastAPI template's implementation of that concern. The template's 1,838 lines of existing docs and 5 ADRs are source material, but translating them into the guide's pedagogical format requires domain knowledge of each production concern.

Phases with standard patterns (skip research-phase):
- **Phase 1 (Foundation):** Direct extension of existing content.config.ts pattern. Schema and route patterns are cloned from EDA section.
- **Phase 2 (Page Infrastructure):** getStaticPaths, layout wrapping, breadcrumb, and prev/next components are all proven patterns in the codebase.
- **Phase 5 (SEO and Integration):** OG images, JSON-LD, header nav, homepage callout, companion blog post -- all done 5+ times in prior milestones with established patterns.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Zero new dependencies. Every technology verified as installed and proven in existing codebase. Mermaid rejection based on concrete bundle size data and Playwright SSR requirement. |
| Features | HIGH | Feature list derived from 14 prior milestones of established patterns + competitor analysis. Table stakes verified against existing site sections. AI agent narrative validated as feasible (content framing, not technical complexity). |
| Architecture | HIGH | Directly validated by inspecting content.config.ts, EDALayout.astro, EDA page templates, and svg-generator patterns in the codebase. Every proposed component has a named analog in the existing code. |
| Pitfalls | HIGH | Pitfalls sourced from direct codebase inspection (1010+ pages, 14 milestones, active template evolution). Code snippet drift confirmed by observing 20+ commits to template repo on research date. Scope creep backed by historical evidence. |

**Overall confidence:** HIGH

### Gaps to Address

- **Template repo tagging:** The fastapi-template does not currently have a tagged release. A `v1.0.0` tag must be created before content authoring begins. This is a prerequisite action outside this repository.
- **Chapter count finality:** FEATURES.md lists 11 domains, ARCHITECTURE.md shows 10 numbered chapters. The final chapter list must be reconciled during Phase 1 planning. The discrepancy is minor but must be resolved before guide.json is written.
- **Interactive vs. static diagram boundary:** STACK research recommends React Flow for deployment topology, but FEATURES research lists "Client-side diagram interactivity" as an anti-feature. Resolution: React Flow is appropriate ONLY for deployment topology where users genuinely explore container/service relationships -- not for static architecture diagrams. Confirm during Phase 3 planning.
- **Header navigation strategy:** PITFALLS identifies the 10th nav item risk. The final decision (add "Guides" link vs. group under existing category vs. rely on homepage callout) should be made during Phase 1, implementation deferred to Phase 5.

## Sources

### Primary (HIGH confidence)
- Existing site codebase -- content.config.ts, EDALayout.astro, svg-generators/plot-base.ts, og-cache.ts, Header.astro, all directly inspected
- FastAPI template source -- docs/, src/, git log, 1,838 lines of docs, 5 ADRs, 41 Python source files
- PROJECT.md -- 737 requirements across 14 milestones providing pattern evidence
- npm package inspection -- @xyflow/react v12.10.1, @dagrejs/dagre v2.0.4, mermaid v11.12.3 bundle sizes verified

### Secondary (MEDIUM confidence)
- [Astro Content Collections Documentation](https://docs.astro.build/en/guides/content-collections/) -- glob/file loaders, schema validation
- [Mermaid.js npm](https://www.npmjs.com/package/mermaid) -- v11.12.3 bundle size, SSR requirements
- [rehype-mermaid GitHub](https://github.com/remcohaszing/rehype-mermaid) -- Playwright dependency for SSR
- [Semrush Keyword Cannibalization Guide](https://www.semrush.com/blog/keyword-cannibalization-guide/) -- hub-and-spoke SEO model
- FastAPI production deployment guides (Render, FastLaunchAPI) -- feature landscape comparison

### Tertiary (LOW confidence)
- General pattern knowledge for documentation drift detection and scope management
- Competitor analysis of FastAPI Official Template, s3rius/FastAPI-template, typical blog post guides

---
*Research completed: 2026-03-08*
*Ready for roadmap: yes*
