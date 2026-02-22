# Requirements: patrykgolabek.dev

**Defined:** 2026-02-21
**Core Value:** A fast, SEO-optimized, visually distinctive portfolio that ranks well in search engines and makes a memorable impression on recruiters, collaborators, and the developer community.

## v1.5 Requirements

Requirements for Database Compass milestone. Each maps to roadmap phases.

### Data & Schema

- [x] **DATA-01**: Database model categories defined in JSON with Zod schema validation for 12 models across 8 dimensions
- [x] **DATA-02**: Each model has crossCategory field linking to related model types for multi-model databases
- [x] **DATA-03**: Each model has per-dimension justification text explaining why that score was assigned
- [x] **DATA-04**: Each model lists 3-6 top databases with name, description, license, and DB-Engines external link
- [x] **DATA-05**: Content collection registered in content.config.ts with file() loader
- [x] **DATA-06**: Dimension definitions with key, symbol, name, and description in dedicated library file
- [x] **DATA-07**: CAP theorem profile (CP/AP/CA/Tunable) with notes per model

### Visualization

- [x] **VIZ-01**: Complexity spectrum — horizontal build-time SVG showing 12 models positioned from simple to complex
- [x] **VIZ-02**: 8-axis octagonal radar chart per model — build-time SVG reusing existing radar-math.ts
- [x] **VIZ-03**: Score breakdown component showing 8 dimension scores with visual bars
- [x] **VIZ-04**: Sortable scoring table — all 12 models across 8 dimensions with column sort
- [x] **VIZ-05**: CAP theorem badge component (CP/AP/CA/Tunable indicator)
- [x] **VIZ-06**: All visualizations render correctly at mobile (375px), tablet (768px), and desktop (1024px+)

### Pages

- [x] **PAGE-01**: Overview page at /tools/db-compass/ with spectrum, model grid, scoring table, and dimension legend
- [x] **PAGE-02**: 12 model detail pages at /tools/db-compass/[slug]/ via getStaticPaths
- [x] **PAGE-03**: Detail pages include radar chart, score breakdown, CAP badge, when-to-use/avoid lists, tradeoffs prose, and top databases
- [x] **PAGE-04**: Prev/next navigation between detail pages by complexity position
- [x] **PAGE-05**: Interactive filter on overview — React island filtering models by use case (caching, analytics, OLTP, search, etc.)

### SEO & Structured Data

- [x] **SEO-01**: JSON-LD Dataset + ItemList on overview page
- [x] **SEO-02**: JSON-LD CreativeWork on each detail page
- [x] **SEO-03**: BreadcrumbList JSON-LD on overview and all detail pages
- [ ] **SEO-04**: Build-time OG image for overview page (spectrum miniature)
- [ ] **SEO-05**: Build-time OG images for each of 12 detail pages (radar chart)
- [x] **SEO-06**: SEO-optimized meta descriptions for overview and all detail pages
- [ ] **SEO-07**: All pages included in sitemap

### Site Integration

- [ ] **INTEG-01**: Homepage callout card linking to /tools/db-compass/
- [ ] **INTEG-02**: Tools listing page card replacing "Coming Soon" placeholder
- [ ] **INTEG-03**: Companion blog post — "How to Choose a Database in 2026" with bidirectional cross-links
- [ ] **INTEG-04**: Blog post cross-links to overview and selected detail pages

### Share & Download

- [x] **SHARE-01**: Share controls on detail pages — Web Share API on mobile, Clipboard API on desktop
- [x] **SHARE-02**: Radar chart download-as-PNG via client-side SVG-to-PNG

## Future Requirements

### Comparison Pages

- **VS-01**: Model-vs-model comparison pages (e.g., /tools/db-compass/vs/relational-vs-document/)
- **VS-02**: Overlay radar chart comparing two models side-by-side
- **VS-03**: Dimension-by-dimension comparison table with verdict

### Advanced Features

- **ADV-01**: Use-case wizard — questionnaire recommending database models based on answers
- **ADV-02**: Database-level detail pages (e.g., /tools/db-compass/relational/postgresql/)
- **ADV-03**: Build-time DB-Engines popularity data fetch for freshness indicators

## Out of Scope

| Feature | Reason |
|---------|--------|
| VS comparison pages | Avoided to prevent 66+ page OG image explosion; defer to future milestone |
| Individual database pages | Scope to model categories, not 50+ specific databases |
| Real-time data from DB-Engines | Static site; would need build-time fetch or API proxy |
| AI-powered recommendations | Contradicts human-expertise positioning |
| Database benchmarks | Too complex, rapidly outdated, legally fraught |
| Pricing comparison | Changes frequently, varies by usage, cloud-vendor specific |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| DATA-01 | Phase 28 | Complete |
| DATA-02 | Phase 28 | Complete |
| DATA-03 | Phase 28 | Complete |
| DATA-04 | Phase 28 | Complete |
| DATA-05 | Phase 28 | Complete |
| DATA-06 | Phase 28 | Complete |
| DATA-07 | Phase 28 | Complete |
| VIZ-01 | Phase 29 | Complete |
| VIZ-02 | Phase 29 | Complete |
| VIZ-03 | Phase 29 | Complete |
| VIZ-04 | Phase 29 | Complete |
| VIZ-05 | Phase 29 | Complete |
| VIZ-06 | Phase 29 | Complete |
| PAGE-01 | Phase 30 | Complete |
| PAGE-02 | Phase 31 | Complete |
| PAGE-03 | Phase 31 | Complete |
| PAGE-04 | Phase 31 | Complete |
| PAGE-05 | Phase 30 | Complete |
| SEO-01 | Phase 30 | Complete |
| SEO-02 | Phase 31 | Complete |
| SEO-03 | Phase 30 | Complete |
| SEO-04 | Phase 32 | Pending |
| SEO-05 | Phase 32 | Pending |
| SEO-06 | Phase 30 | Complete |
| SEO-07 | Phase 32 | Pending |
| INTEG-01 | Phase 32 | Pending |
| INTEG-02 | Phase 32 | Pending |
| INTEG-03 | Phase 32 | Pending |
| INTEG-04 | Phase 32 | Pending |
| SHARE-01 | Phase 31 | Complete |
| SHARE-02 | Phase 31 | Complete |

**Coverage:**
- v1.5 requirements: 28 total
- Mapped to phases: 28
- Unmapped: 0

---
*Requirements defined: 2026-02-21*
*Last updated: 2026-02-22 after Phase 31 completion*
