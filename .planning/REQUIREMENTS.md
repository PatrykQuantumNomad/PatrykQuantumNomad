# Requirements: patrykgolabek.dev

**Defined:** 2026-04-15
**Core Value:** A fast, SEO-optimized, visually distinctive portfolio that ranks well in search engines and makes a memorable impression on recruiters, collaborators, and the developer community.

## v1.21 Requirements

Requirements for SEO Audit Fixes milestone. Each maps to roadmap phases.

### VS Page Content Enrichment

- [ ] **VS-01**: Each VS comparison page displays per-dimension analysis prose using justifications.ts data for both languages
- [ ] **VS-02**: Each VS comparison page shows an expanded verdict (2-3 sentences of genuine analysis, not just score difference)
- [ ] **VS-03**: Each VS comparison page includes 2-3 code feature comparisons from code-features.ts with syntax-highlighted snippets
- [ ] **VS-04**: Each VS comparison page has FAQPage JSON-LD schema with 3-5 dimension-derived questions
- [ ] **VS-05**: Each VS comparison page cross-links to related comparison pairs (reverse pair + shared-language pairs)
- [ ] **VS-06**: VS pages demonstrate structural variation (random 20-page sample shows <40% content overlap)
- [ ] **VS-07**: Each VS comparison page reaches 500+ unique words (up from ~192)

### Technical SEO

- [ ] **TSEO-01**: All 1,184 sitemap URLs include accurate `<lastmod>` dates (blog from frontmatter, sections from hardcoded publication dates)
- [x] **TSEO-02**: Blog pagination pages 2-6 have self-referencing canonical tags (NOT noindex)
- [x] **TSEO-03**: Blog pagination pages excluded from sitemap generation
- [x] **TSEO-04**: `/feed.xml` serves as alias for `/rss.xml`
- [x] **TSEO-05**: Tag pages with fewer than 3 posts excluded from sitemap

### On-Page SEO

- [x] **OPSEO-01**: `/blog/dark-code/` title tag expanded to keyword-rich 55-60 characters
- [x] **OPSEO-02**: `/blog/dark-code/` meta description trimmed to ≤160 characters with keywords front-loaded
- [x] **OPSEO-03**: Beauty Index single-language page descriptions fixed (no mid-word truncation, 140-160 chars)
- [x] **OPSEO-04**: `/tools/dockerfile-analyzer/` meta description trimmed to ≤160 characters

### Performance

- [x] **PERF-01**: Google Fonts CDN replaced with self-hosted @fontsource static packages (4 families)
- [x] **PERF-02**: CSP meta tag updated to remove googleapis.com and gstatic.com domains
- [x] **PERF-03**: Critical fonts have `<link rel="preload">` hints with `crossorigin` attribute
- [ ] **PERF-04**: Homepage CSS bundle diagnosed with rollup-plugin-visualizer
- [ ] **PERF-05**: Homepage CSS bloat remediated if diagnosis shows unnecessary cross-route CSS loading

## Future Requirements

Deferred to future milestones. Tracked but not in current roadmap.

### Content Depth

- **CDEP-01**: Tool landing pages expanded with 300-400 word "What it checks" sections
- **CDEP-02**: Contact page expanded with "What to expect" section
- **CDEP-03**: AI Landscape heading structure changed from H2 to nav landmarks

### AEO Enhancements

- **AEO-01**: HowTo schema added to step-by-step guide sections
- **AEO-02**: Machine-readable glossary endpoint at /glossary.json

### Performance (Deferred)

- **PERF-06**: GA4 moved off main thread via Partytown
- **PERF-07**: Noto Sans font subsetting for Greek-only usage

## Out of Scope

| Feature | Reason |
|---------|--------|
| Noindex on blog pagination pages | Google official docs confirm this is an anti-pattern that severs crawl paths |
| AI-generated VS page prose | Scaled content abuse risk per March 2026 core update |
| Astro experimental.fonts API | Breaking changes between minor versions, 7+ open bugs, stable only in Astro 6.0.0 |
| @fontsource-variable packages | Changes font-family CSS names, requires Tailwind config updates |
| `vite.build.cssCodeSplit = false` | Known Astro breaking bug (#4413) |
| `lastmod: new Date()` on every build | Destroys per-sitemap trust for all 1,184 URLs |
| Subdomain consolidation | Substantial effort per subdomain, requires careful 301 planning |
| Backlink campaign | Marketing activity, not code changes |
| Upgrade to Astro 6 | Framework upgrade risk mid-milestone |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| VS-01 | Phase 122 | Pending |
| VS-02 | Phase 122 | Pending |
| VS-03 | Phase 122 | Pending |
| VS-04 | Phase 122 | Pending |
| VS-05 | Phase 122 | Pending |
| VS-06 | Phase 122 | Pending |
| VS-07 | Phase 122 | Pending |
| TSEO-01 | Phase 123 | Pending |
| TSEO-02 | Phase 125 | Complete |
| TSEO-03 | Phase 125 | Complete |
| TSEO-04 | Phase 125 | Complete |
| TSEO-05 | Phase 125 | Complete |
| OPSEO-01 | Phase 125 | Complete |
| OPSEO-02 | Phase 125 | Complete |
| OPSEO-03 | Phase 125 | Complete |
| OPSEO-04 | Phase 125 | Complete |
| PERF-01 | Phase 124 | Complete |
| PERF-02 | Phase 124 | Complete |
| PERF-03 | Phase 124 | Complete |
| PERF-04 | Phase 126 | Pending |
| PERF-05 | Phase 126 | Pending |

**Coverage:**
- v1.21 requirements: 21 total
- Mapped to phases: 21
- Unmapped: 0

---
*Requirements defined: 2026-04-15*
*Last updated: 2026-04-16 — Phase 124 Font Self-Hosting COMPLETE; PERF-01/02/03 locked in by scripts/verify-no-google-fonts.mjs build-time gate (4 assertions, 4/4 negative tests PASS) + 8/8 human smoke-test cells*
