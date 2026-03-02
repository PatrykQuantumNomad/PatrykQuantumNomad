# Requirements: patrykgolabek.dev

**Defined:** 2026-03-01
**Core Value:** The site must be fast, fully SEO-optimized, and visually distinctive — a portfolio that ranks well in search engines and makes a memorable impression on recruiters, collaborators, and the developer community.

## v1.11 Requirements

Requirements for Cloud Architecture Patterns milestone. Each maps to roadmap phases.

### Data Model

- [ ] **DATA-01**: Pattern data defined in JSON with Zod schema validation for 13 patterns across 7 scoring dimensions
- [ ] **DATA-02**: Content collection registered in content.config.ts with file() loader for pattern data
- [ ] **DATA-03**: Each pattern has slug, name, category, characterSketch, summary, scores (7 dimensions), strengths, weaknesses, whenToUse, whenToAvoid, relatedPatterns

### Catalog

- [ ] **CATL-01**: Overview page at /patterns/ with pattern card grid grouped by 5 categories (Resilience, Data Management, Communication, Structural, Scaling)
- [ ] **CATL-02**: Category filter React island with 5 toggle pills using nanostores pattern
- [ ] **CATL-03**: Sortable scoring table showing all 13 patterns across 7 dimensions
- [ ] **CATL-04**: Complexity spectrum visualization positioning patterns from simple to complex

### Detail Pages

- [ ] **DETL-01**: Per-pattern detail pages at /patterns/[slug]/ for all 13 patterns
- [ ] **DETL-02**: Radar chart visualization (7-axis heptagonal) per pattern using radar-math.ts
- [ ] **DETL-03**: Score breakdown display with per-dimension values
- [ ] **DETL-04**: Custom SVG architecture diagram per pattern (13 total)
- [ ] **DETL-05**: Strengths/weaknesses, when to use/avoid sections per pattern
- [ ] **DETL-06**: Character sketch narrative per pattern
- [ ] **DETL-07**: Related patterns section with linked cards
- [ ] **DETL-08**: Prev/next navigation between patterns

### Interactive Features

- [ ] **INTX-01**: Interactive SVG diagrams with hover states highlighting data flow paths and clickable components
- [ ] **INTX-02**: Pattern comparison pages at /patterns/vs/[slug]/ with overlay radar charts
- [ ] **INTX-03**: Compare picker React island for selecting comparison patterns
- [ ] **INTX-04**: Share controls (URL copy, Web Share API on mobile, Clipboard API on desktop, text URL fallback)

### Scoring

- [ ] **SCOR-01**: 7-dimension scoring system (Scalability, Resilience, Complexity, Coupling, Consistency, Latency, Observability) with 1-10 scale
- [ ] **SCOR-02**: Scoring justification paragraphs per dimension per pattern (91 total)
- [ ] **SCOR-03**: Download radar chart as PNG image via SVG-to-PNG at 2x

### Site Integration

- [ ] **SITE-01**: Header navigation link for Patterns
- [ ] **SITE-02**: Homepage callout linking to the Patterns encyclopedia
- [ ] **SITE-03**: Build-time OG images for overview and all 13 pattern detail pages (14 total)
- [ ] **SITE-04**: JSON-LD structured data (CreativeWork + BreadcrumbList) on all pattern pages
- [ ] **SITE-05**: All pattern pages in sitemap and LLMs.txt
- [ ] **SITE-06**: Companion blog post with bidirectional cross-links to pattern pages

## Future Requirements

Deferred to future milestones. Tracked but not in current roadmap.

### Decision Support

- **DCSN-01**: Interactive decision flowchart at /patterns/decide/ guiding architects to pattern recommendations
- **DCSN-02**: Pattern relationship graph (D3.js force-directed) showing how patterns connect

### Expansion

- **EXPN-01**: Expand catalog to 18-20 patterns (Event-Driven Architecture overview, Service Mesh, Outbox, Materialized View, Throttling)
- **EXPN-02**: "Pattern of the Month" blog series deep-diving individual patterns

## Out of Scope

| Feature | Reason |
|---------|--------|
| Code implementation examples | Vendor-agnostic by design; code ages quickly and requires language-specific maintenance |
| Cloud-provider-specific mapping | Creates maintenance burden and vendor-bias perception |
| User-submitted ratings or comments | Static site; deliberately opinionated author voice (consistent with Beauty Index, DB Compass) |
| Real-time playground / simulator | Enormous complexity for marginal value; animated SVGs convey flow effectively |
| Exhaustive 40+ pattern catalog | 13 core patterns at this quality level (custom SVG + scoring + justifications) is the right scope |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| DATA-01 | — | Pending |
| DATA-02 | — | Pending |
| DATA-03 | — | Pending |
| CATL-01 | — | Pending |
| CATL-02 | — | Pending |
| CATL-03 | — | Pending |
| CATL-04 | — | Pending |
| DETL-01 | — | Pending |
| DETL-02 | — | Pending |
| DETL-03 | — | Pending |
| DETL-04 | — | Pending |
| DETL-05 | — | Pending |
| DETL-06 | — | Pending |
| DETL-07 | — | Pending |
| DETL-08 | — | Pending |
| INTX-01 | — | Pending |
| INTX-02 | — | Pending |
| INTX-03 | — | Pending |
| INTX-04 | — | Pending |
| SCOR-01 | — | Pending |
| SCOR-02 | — | Pending |
| SCOR-03 | — | Pending |
| SITE-01 | — | Pending |
| SITE-02 | — | Pending |
| SITE-03 | — | Pending |
| SITE-04 | — | Pending |
| SITE-05 | — | Pending |
| SITE-06 | — | Pending |

**Coverage:**
- v1.11 requirements: 28 total
- Mapped to phases: 0
- Unmapped: 28 ⚠️

---
*Requirements defined: 2026-03-01*
*Last updated: 2026-03-01 after initial definition*
