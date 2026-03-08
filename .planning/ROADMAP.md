# Roadmap: patrykgolabek.dev

## Milestones

- v1.0 through v1.14: Shipped (see MILESTONES.md)
- **v1.15 FastAPI Production Guide** - Phases 85-89 (in progress)

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 85: Foundation and Content Schema** - Zod schemas, content collections, guide metadata, route helpers, and page generation pipeline (completed 2026-03-08)
- [x] **Phase 86: Page Infrastructure and Navigation** - GuideLayout, landing page, sidebar, breadcrumb, prev/next navigation, reading progress, and first chapter validation (completed 2026-03-08)
- [x] **Phase 87: Guide-Specific Components** - CodeFromRepo component, 4 architecture diagram SVG generators, diagram-base module, and interactive deployment topology (completed 2026-03-08)
- [x] **Phase 88: Content Authoring** - All 11 domain MDX pages with prose, code snippets, diagrams, and AI agent narrative (completed 2026-03-08)
- [ ] **Phase 89: SEO, OG Images, and Site Integration** - JSON-LD, OG images, header nav, homepage callout, companion blog post, LLMs.txt, and sitemap

## Phase Details

### Phase 85: Foundation and Content Schema
**Goal**: Guide content structure exists and pages can be generated from MDX content collections
**Depends on**: Nothing (first phase of v1.15)
**Requirements**: INFRA-07, INFRA-08
**Success Criteria** (what must be TRUE):
  1. A `guidePages` MDX content collection with Zod-validated frontmatter (title, description, order, slug) is registered in content.config.ts and accepts MDX files
  2. A `guides` JSON collection loads guide-level metadata (guide.json) with chapter ordering, template repo URL, and version tag
  3. `getStaticPaths` at `/guides/fastapi-production/[slug]/` generates pages from the content collection
  4. A stub MDX chapter file builds successfully through the full pipeline (collection -> page -> rendered HTML)
**Plans:** 1/1 plans complete
Plans:
- [x] 85-01-PLAN.md -- Zod schemas, content collections, stub MDX, dynamic page route, and schema unit tests

### Phase 86: Page Infrastructure and Navigation
**Goal**: Users can navigate the guide with sidebar, breadcrumbs, prev/next links, and reading progress -- and the landing page introduces the guide
**Depends on**: Phase 85
**Requirements**: INFRA-01, INFRA-02, INFRA-03, INFRA-04, INFRA-05, INFRA-06
**Success Criteria** (what must be TRUE):
  1. The landing page at `/guides/fastapi-production/` displays a chapter card grid with titles and descriptions for all chapters, and a hero section with AI agent narrative framing
  2. GuideLayout.astro wraps all guide pages with consistent header, sidebar navigation, and footer
  3. Sidebar shows all chapters with the current page visually highlighted, and clicking a chapter navigates to it
  4. Breadcrumb navigation on every guide page shows the path (Home > Guides > FastAPI Production > Chapter Title)
  5. Previous/next chapter links at the bottom of each domain page navigate to the correct adjacent chapters in order
**Plans:** 2/2 plans complete
Plans:
- [x] 86-01-PLAN.md -- Route helpers (TDD), guide.json data update, GuideLayout, and navigation components
- [x] 86-02-PLAN.md -- Landing page with AI agent hero and chapter card grid, [slug].astro GuideLayout integration

### Phase 87: Guide-Specific Components
**Goal**: Reusable components for code snippets and architecture diagrams are ready for content authoring
**Depends on**: Phase 86
**Requirements**: DIAG-01, DIAG-02, DIAG-03, DIAG-04, CODE-01, CODE-02, CODE-03
**Success Criteria** (what must be TRUE):
  1. CodeFromRepo component renders syntax-highlighted code blocks with source file path annotation and link to the tagged GitHub source
  2. Build-time SVG diagram of the middleware request flow renders the 8-layer stack with labeled layers and directional arrows
  3. Build-time SVG diagram of the Builder pattern shows setup_*() method composition and factory function structure
  4. Build-time SVG diagram of JWT auth flow shows the 3 validation modes (shared secret, static key, JWKS) as distinct paths
  5. Interactive React Flow deployment topology diagram renders app, Postgres, Redis, and reverse proxy nodes with connection edges
**Plans:** 3/3 plans complete
Plans:
- [x] 87-01-PLAN.md -- TDD SVG diagram generators (diagram-base, middleware-stack, builder-pattern, jwt-auth-flow)
- [x] 87-02-PLAN.md -- CodeFromRepo component with source attribution and GitHub link
- [x] 87-03-PLAN.md -- Astro diagram wrappers and interactive React Flow deployment topology

### Phase 88: Content Authoring
**Goal**: All 11 domain deep-dive pages are complete with full prose, code snippets, architecture diagrams, and AI agent narrative
**Depends on**: Phase 87
**Requirements**: PAGE-01, PAGE-02, PAGE-03, PAGE-04, PAGE-05, PAGE-06, PAGE-07, PAGE-08, PAGE-09, PAGE-10, PAGE-11, AGENT-01, AGENT-02, AGENT-03
**Success Criteria** (what must be TRUE):
  1. All 11 domain pages render at `/guides/fastapi-production/[slug]/` with complete prose explaining the production concern, configuration options, and "why not the obvious approach" callouts
  2. Each domain page opens with a section framing what the AI agent inherits from this production concern and closes with a summary of what the agent never needs to implement
  3. Each domain page includes syntax-highlighted code snippets from the FastAPI template with source file path annotations via CodeFromRepo
  4. Architecture diagrams are embedded in the relevant domain pages (middleware stack in Middleware page, builder pattern in Builder page, auth flow in Authentication page, deployment topology in Docker page)
  5. The guide is self-contained -- a reader who has never seen the fastapi-template repository can understand every page without referencing external docs
**Plans:** 4/4 plans complete
Plans:
- [x] 88-01-PLAN.md -- Builder Pattern and Middleware pages (core architecture with diagrams)
- [x] 88-02-PLAN.md -- Authentication, Security Headers, and Rate Limiting pages (security cluster)
- [x] 88-03-PLAN.md -- Observability, Database, and Docker pages (infrastructure cluster with topology diagram)
- [x] 88-04-PLAN.md -- Testing, Health Checks, and Caching pages (supporting layers)

### Phase 89: SEO, OG Images, and Site Integration
**Goal**: The guide is fully integrated into the site with discoverability, SEO metadata, and a companion blog post
**Depends on**: Phase 88
**Requirements**: SITE-01, SITE-02, SITE-03, SITE-04, SITE-05, SITE-06, SITE-07
**Success Criteria** (what must be TRUE):
  1. A "Guides" link in the site header navigates to the FastAPI Production Guide landing page
  2. A callout card on the homepage links to the FastAPI Production Guide
  3. A companion blog post exists with bidirectional cross-links to all 11 domain pages
  4. Build-time OG images exist for the landing page and all 11 domain pages (12 total) with content-hash caching
  5. JSON-LD structured data (TechArticle + BreadcrumbList) is present on all guide pages, all pages appear in sitemap, and LLMs.txt includes guide section entries
**Plans:** 1/3 plans executed
Plans:
- [ ] 89-01-PLAN.md -- OG image pipeline (satori + sharp + content-hash caching) and JSON-LD structured data wiring
- [x] 89-02-PLAN.md -- Header nav, /guides/ hub page, homepage callout card, and LLMs.txt entries
- [ ] 89-03-PLAN.md -- Companion blog post with bidirectional cross-links to all 11 chapter pages

## Progress

**Execution Order:**
Phases execute in numeric order: 85 -> 86 -> 87 -> 88 -> 89

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 85. Foundation and Content Schema | 1/1 | Complete   | 2026-03-08 |
| 86. Page Infrastructure and Navigation | 2/2 | Complete | 2026-03-08 |
| 87. Guide-Specific Components | 3/3 | Complete | 2026-03-08 |
| 88. Content Authoring | 4/4 | Complete   | 2026-03-08 |
| 89. SEO, OG Images, and Site Integration | 1/3 | In Progress|  |
