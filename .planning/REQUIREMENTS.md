# Requirements: patrykgolabek.dev

**Defined:** 2026-03-08
**Core Value:** A fast, SEO-optimized, visually distinctive portfolio that ranks well in search engines and makes a memorable impression on recruiters, collaborators, and the developer community.

## v1.15 Requirements

Requirements for the FastAPI Production Guide milestone. Each maps to roadmap phases.

### Guide Infrastructure

- [ ] **INFRA-01**: Guide landing page at `/guides/fastapi-production/` with chapter card grid and AI agent narrative hero
- [ ] **INFRA-02**: GuideLayout.astro extending Layout.astro with guide-specific navigation and reading progress
- [ ] **INFRA-03**: Sidebar chapter navigation showing all chapters with current-page highlighting
- [ ] **INFRA-04**: Breadcrumb navigation on all guide pages (Home > Guides > FastAPI Production > Chapter)
- [ ] **INFRA-05**: Previous/next chapter navigation at bottom of each domain page
- [ ] **INFRA-06**: Reading progress indicator (scroll-based progress bar at top of page)
- [ ] **INFRA-07**: Zod-validated content collection for guide pages (MDX) and guide metadata (JSON)
- [ ] **INFRA-08**: Page generation via getStaticPaths for `/guides/fastapi-production/[slug]/`

### Domain Pages

- [ ] **PAGE-01**: Builder Pattern page covering FastAPIAppBuilder, setup_*() composition, and factory function
- [ ] **PAGE-02**: Authentication page covering 3-mode JWT validation (shared secret, static key, JWKS)
- [ ] **PAGE-03**: Middleware page covering 6 raw ASGI middlewares, ordering, and why not BaseHTTPMiddleware
- [ ] **PAGE-04**: Observability page covering OpenTelemetry, Prometheus metrics, and structured JSON logging
- [ ] **PAGE-05**: Database page covering async SQLAlchemy, Alembic migrations, and multi-backend support
- [ ] **PAGE-06**: Docker page covering multi-stage builds, tini, unprivileged user, digest-pinned images
- [ ] **PAGE-07**: Testing page covering unit/integration architecture, hermetic helpers, and 98%+ coverage
- [ ] **PAGE-08**: Health Checks page covering readiness vs liveness separation and dependency-aware registry
- [ ] **PAGE-09**: Security Headers page covering HSTS, CSP, permissions policy, and trusted hosts
- [ ] **PAGE-10**: Rate Limiting page covering fixed-window algorithm, memory/Redis backends, and proxy trust
- [ ] **PAGE-11**: Caching page covering optional memory/Redis cache layer with per-key TTL

### Architecture Diagrams

- [ ] **DIAG-01**: Build-time SVG diagram showing request flow through the 8-layer middleware stack
- [ ] **DIAG-02**: Build-time SVG diagram showing Builder pattern composition (setup_*() method chain)
- [ ] **DIAG-03**: Build-time SVG diagram showing JWT auth flow across 3 validation modes
- [ ] **DIAG-04**: Interactive React Flow deployment topology diagram (app, Postgres, Redis, reverse proxy)

### AI Agent Narrative

- [ ] **AGENT-01**: Each domain page opens with what the AI agent inherits from this production concern
- [ ] **AGENT-02**: Each domain page closes with a summary of what the agent never needs to implement
- [ ] **AGENT-03**: Landing page hero frames the template as "production concerns handled, agent writes business logic"

### Code Snippets

- [ ] **CODE-01**: Each domain page includes syntax-highlighted code snippets from the FastAPI template
- [ ] **CODE-02**: Code snippets reference tagged template repo version with source file path annotations
- [ ] **CODE-03**: CodeFromRepo component linking snippets to full source files on GitHub

### Site Integration

- [ ] **SITE-01**: Header navigation link for Guides section
- [ ] **SITE-02**: Homepage callout card linking to the FastAPI Production Guide
- [ ] **SITE-03**: Companion blog post with bidirectional cross-links to all 11 domain pages
- [ ] **SITE-04**: Build-time OG images for landing page and all 11 domain pages (12 total) with content-hash caching
- [ ] **SITE-05**: JSON-LD structured data (TechArticle + BreadcrumbList) on all guide pages
- [ ] **SITE-06**: LLMs.txt entries for guide section
- [ ] **SITE-07**: All guide pages included in sitemap

## Future Requirements

### Additional Guides

- **GUIDE-01**: Next.js production guide (validate format with FastAPI first)
- **GUIDE-02**: Go production guide
- **GUIDE-03**: Guide search/filter across multiple guides
- **GUIDE-04**: Printable/PDF export of guide content
- **GUIDE-05**: Versioned guides (track template version changes)

## Out of Scope

| Feature | Reason |
|---------|--------|
| Live API playground | Requires server-side execution; contradicts static site constraint |
| Auto-sync with template repo | Introduces build-time fragility; manual curation ensures quality |
| Video walkthroughs | Different content format; consider separately |
| Comments/discussion on guide pages | Requires moderation infrastructure; use "Reply via email" approach |
| Mermaid.js for diagrams | ~200KB+ client bundle or Playwright SSR requirement; build-time SVG is lighter and proven |
| Full tutorial/course format | Guide covers WHAT, WHY, HOW TO CONFIGURE -- not step-by-step tutorial |
| Template repo code auto-extraction | Fragile; curated excerpts with version annotations are more maintainable |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| INFRA-01 | Phase 86 | Pending |
| INFRA-02 | Phase 86 | Pending |
| INFRA-03 | Phase 86 | Pending |
| INFRA-04 | Phase 86 | Pending |
| INFRA-05 | Phase 86 | Pending |
| INFRA-06 | Phase 86 | Pending |
| INFRA-07 | Phase 85 | Pending |
| INFRA-08 | Phase 85 | Pending |
| PAGE-01 | Phase 88 | Pending |
| PAGE-02 | Phase 88 | Pending |
| PAGE-03 | Phase 88 | Pending |
| PAGE-04 | Phase 88 | Pending |
| PAGE-05 | Phase 88 | Pending |
| PAGE-06 | Phase 88 | Pending |
| PAGE-07 | Phase 88 | Pending |
| PAGE-08 | Phase 88 | Pending |
| PAGE-09 | Phase 88 | Pending |
| PAGE-10 | Phase 88 | Pending |
| PAGE-11 | Phase 88 | Pending |
| DIAG-01 | Phase 87 | Pending |
| DIAG-02 | Phase 87 | Pending |
| DIAG-03 | Phase 87 | Pending |
| DIAG-04 | Phase 87 | Pending |
| AGENT-01 | Phase 88 | Pending |
| AGENT-02 | Phase 88 | Pending |
| AGENT-03 | Phase 86 | Pending |
| CODE-01 | Phase 88 | Pending |
| CODE-02 | Phase 88 | Pending |
| CODE-03 | Phase 87 | Pending |
| SITE-01 | Phase 89 | Pending |
| SITE-02 | Phase 89 | Pending |
| SITE-03 | Phase 89 | Pending |
| SITE-04 | Phase 89 | Pending |
| SITE-05 | Phase 89 | Pending |
| SITE-06 | Phase 89 | Pending |
| SITE-07 | Phase 89 | Pending |

**Coverage:**
- v1.15 requirements: 36 total
- Mapped to phases: 36
- Unmapped: 0

---
*Requirements defined: 2026-03-08*
*Last updated: 2026-03-08 after roadmap creation*
