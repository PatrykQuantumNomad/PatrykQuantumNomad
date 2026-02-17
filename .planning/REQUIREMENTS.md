# Requirements: patrykgolabek.dev

**Defined:** 2026-02-17
**Core Value:** A fast, SEO-optimized, visually distinctive portfolio that ranks well in search engines and makes a memorable impression on recruiters, collaborators, and the developer community.

## v1.3 Requirements

Requirements for The Beauty Index milestone. Each maps to roadmap phases.

### Data Foundation

- [ ] **DATA-01**: Language data schema (languages.json) with Zod validation for all 25 languages — scores across 6 dimensions, metadata, character sketches, tier assignments
- [ ] **DATA-02**: Shared radar SVG math utility (polar-to-cartesian coordinate conversion) usable by both Astro components and OG image generation
- [ ] **DATA-03**: Content collection integration via Astro 5 file() loader for language data
- [ ] **DATA-04**: Greek symbol rendering validated across site fonts with fallback if needed

### Chart Components

- [ ] **CHART-01**: Build-time SVG radar chart component showing 6 dimensions per language — zero client-side JavaScript
- [ ] **CHART-02**: Build-time SVG ranking bar chart component showing all 25 languages sorted by total score
- [ ] **CHART-03**: Tier badge component with color-coded visual indicators (Beautiful/Handsome/Practical/Workhorses)
- [ ] **CHART-04**: Score breakdown display component showing individual dimension scores

### Overview Page

- [ ] **OVER-01**: Overview page at /beauty-index/ with ranking chart, scoring table, and language grid
- [ ] **OVER-02**: Scoring table sortable by individual dimensions (click column header to re-sort)
- [ ] **OVER-03**: 4-tier visual grouping with color-coded sections and tier labels
- [ ] **OVER-04**: All 25 radar charts displayed in overview grid, each linking to detail page
- [ ] **OVER-05**: Responsive layout across mobile, tablet, and desktop

### Language Detail Pages

- [ ] **LANG-01**: Per-language detail pages at /beauty-index/[slug]/ for all 25 languages via getStaticPaths
- [ ] **LANG-02**: Radar chart with full 6-dimension score breakdown on each detail page
- [ ] **LANG-03**: Character sketch narrative (2-3 sentence personality description) per language
- [ ] **LANG-04**: Signature code snippet with syntax highlighting per language
- [ ] **LANG-05**: Tier badge and total score prominently displayed
- [ ] **LANG-06**: Navigation between languages (previous/next) and back to overview

### Code Comparison

- [ ] **CODE-01**: Code comparison page at /beauty-index/code/ with feature-tabbed layout
- [ ] **CODE-02**: 10 feature tabs (Variable Declaration, If/Else, Loops, Functions, Structs, Pattern Matching, Error Handling, String Interpolation, List Operations, Signature Idiom)
- [ ] **CODE-03**: All 25 languages displayed per tab with syntax-highlighted code blocks
- [ ] **CODE-04**: Tab-based lazy rendering to keep DOM under performance threshold
- [ ] **CODE-05**: Feature support matrix table (Quick-Reference from source data)

### Shareability

- [ ] **SHARE-01**: Build-time OG images with radar chart visuals for overview page and all 25 language pages
- [ ] **SHARE-02**: Download-as-image button on radar charts for social media sharing
- [ ] **SHARE-03**: Web Share API integration on mobile devices
- [ ] **SHARE-04**: Copy-to-clipboard for chart images

### Blog Content

- [ ] **BLOG-01**: Full Beauty Index methodology blog post as local MDX content in blog collection
- [ ] **BLOG-02**: Cross-links between blog post and Beauty Index pages (bidirectional)

### SEO & Navigation

- [ ] **SEO-01**: Navigation link added to site header for Beauty Index section
- [ ] **SEO-02**: JSON-LD structured data on Beauty Index pages (Dataset/ItemList schema)
- [ ] **SEO-03**: Breadcrumb navigation and BreadcrumbJsonLd on all Beauty Index pages
- [ ] **SEO-04**: Internal cross-linking from existing pages (homepage, blog) to Beauty Index
- [ ] **SEO-05**: All Beauty Index pages in sitemap
- [ ] **SEO-06**: Lighthouse 90+ audit on all Beauty Index page types
- [ ] **SEO-07**: Accessibility audit (keyboard navigation, screen reader, WCAG 2.1 AA)

## Future Requirements

### v2 Enhancements

- **COMP-01**: Overlay comparison mode — pick 2-3 languages and overlay their radar charts
- **ANIM-01**: Animated chart entrance on scroll via GSAP ScrollTrigger
- **DARK-01**: Full dark mode support for all Beauty Index charts and components
- **HIST-01**: Historical tracking of score changes over time

## Out of Scope

| Feature | Reason |
|---------|--------|
| User voting / crowd-sourced scores | Destroys the editorial thesis — this is one person's informed opinion |
| Real-time GitHub/Stack Overflow data | Conflates beauty with popularity — the entire point is they're different |
| Comments section | Let debate happen on social media where it generates backlinks and engagement |
| Client-side charting library (Chart.js, D3, Recharts) | Static data doesn't need runtime JS — build-time SVG maintains Lighthouse 90+ |
| Language addition form | Curated list of 25, not an open database |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| DATA-01 | Phase 16 | Pending |
| DATA-02 | Phase 16 | Pending |
| DATA-03 | Phase 16 | Pending |
| DATA-04 | Phase 16 | Pending |
| CHART-01 | Phase 16 | Pending |
| CHART-02 | Phase 16 | Pending |
| CHART-03 | Phase 16 | Pending |
| CHART-04 | Phase 16 | Pending |
| OVER-01 | Phase 17 | Pending |
| OVER-02 | Phase 17 | Pending |
| OVER-03 | Phase 17 | Pending |
| OVER-04 | Phase 17 | Pending |
| OVER-05 | Phase 17 | Pending |
| LANG-01 | Phase 17 | Pending |
| LANG-02 | Phase 17 | Pending |
| LANG-03 | Phase 17 | Pending |
| LANG-04 | Phase 17 | Pending |
| LANG-05 | Phase 17 | Pending |
| LANG-06 | Phase 17 | Pending |
| SHARE-01 | Phase 18 | Pending |
| SHARE-02 | Phase 18 | Pending |
| SHARE-03 | Phase 18 | Pending |
| SHARE-04 | Phase 18 | Pending |
| CODE-01 | Phase 19 | Pending |
| CODE-02 | Phase 19 | Pending |
| CODE-03 | Phase 19 | Pending |
| CODE-04 | Phase 19 | Pending |
| CODE-05 | Phase 19 | Pending |
| BLOG-01 | Phase 20 | Pending |
| BLOG-02 | Phase 20 | Pending |
| SEO-01 | Phase 21 | Pending |
| SEO-02 | Phase 21 | Pending |
| SEO-03 | Phase 21 | Pending |
| SEO-04 | Phase 21 | Pending |
| SEO-05 | Phase 21 | Pending |
| SEO-06 | Phase 21 | Pending |
| SEO-07 | Phase 21 | Pending |

**Coverage:**
- v1.3 requirements: 37 total
- Mapped to phases: 37
- Unmapped: 0

---
*Requirements defined: 2026-02-17*
*Last updated: 2026-02-17 — traceability updated with phase mappings*
