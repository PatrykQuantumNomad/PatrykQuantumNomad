# Requirements: patrykgolabek.dev v1.1

**Defined:** 2026-02-11
**Core Value:** A fast, SEO-optimized, visually distinctive portfolio that ranks well in search engines and makes a memorable impression on recruiters, collaborators, and the developer community.

## v1.1 Requirements

Requirements for the Content Refresh milestone. Each maps to roadmap phases.

### Social & Contact

- [ ] **SOCIAL-01**: Site displays updated email address (pgolabek@gmail.com) across Footer, Contact, and Home CTA
- [ ] **SOCIAL-02**: Site displays X social link (@QuantumMentat) with proper SVG icon and aria-label
- [ ] **SOCIAL-03**: Site displays YouTube social link (@QuantumMentat) with proper SVG icon and aria-label
- [ ] **SOCIAL-04**: LinkedIn is removed from visible social links in Footer, Contact, and Home CTA

### External Blog Integration

- [ ] **BLOG-01**: Blog listing displays curated external blog entries from Kubert AI and Translucent Computing alongside local posts, sorted by date
- [ ] **BLOG-02**: External blog entries show visual source badge (e.g., "on Kubert AI") and external link icon
- [ ] **BLOG-03**: External blog entry links open the external site in a new tab with `target="_blank"` and `rel="noopener noreferrer"`
- [ ] **BLOG-04**: Blog detail pages are not generated for external posts (slug page guard in getStaticPaths)
- [ ] **BLOG-05**: RSS feed includes external blog entries with their external URL as the link
- [ ] **BLOG-06**: OG images are not generated for external blog posts
- [ ] **BLOG-07**: Blog content schema supports optional `externalUrl` and `source` fields

### Hero & Content

- [ ] **HERO-01**: Hero section displays updated tagline with craft & precision tone (no location, no "Pre-1.0 Kubernetes adopter")
- [ ] **HERO-02**: Hero typing animation uses updated roles array reflecting architect/engineer/builder identity
- [ ] **HERO-03**: Hero keywords propagate consistently to page title tag, meta description, and JSON-LD structured data via centralized hero config

### Project Curation

- [ ] **PROJ-01**: Full-Stack Applications category and its projects are removed from the Projects page
- [ ] **PROJ-02**: gemini-beauty-math project is removed from the Projects page
- [ ] **PROJ-03**: Project count in meta descriptions reflects updated total

### Cleanup & Verification

- [ ] **CLEAN-01**: Draft placeholder blog post is deleted
- [ ] **CLEAN-02**: Build completes successfully with no broken internal links
- [ ] **CLEAN-03**: Sitemap, RSS feed, and LLMs.txt reflect all content changes correctly

## v1.2+ Requirements

Deferred to future release. Tracked but not in current roadmap.

### Configuration

- **CONFIG-01**: Centralized site.ts configuration for social links (single source of truth across Footer, Contact, Home, PersonJsonLd)
- **CONFIG-02**: LinkedIn retained in JSON-LD sameAs array for SEO entity recognition

### Blog Enhancements

- **BLOG-08**: Blog listing supports source filtering tabs (All, On this site, Kubert AI, Translucent Computing)
- **BLOG-09**: About page cross-promotes external blog content

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Google Analytics / Plausible | 45KB+ script, requires cookie consent — evaluate in dedicated milestone |
| CMS integration | Adding a CMS for 3-5 stub files is overkill — content managed as Markdown |
| Tailwind v4 upgrade | Save for infrastructure milestone — v3.4.19 works fine |
| RSS feed loader (astro-loader-rss) | Adds build-time network dependency for quarterly publishing cadence |
| Icon library (astro-icon) | 2 new SVG icons do not justify a dependency |
| Blog source filtering tabs | Not enough posts to warrant — defer to v1.2+ |
| Comments system | Requires moderation infrastructure — out of scope |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| SOCIAL-01 | — | Pending |
| SOCIAL-02 | — | Pending |
| SOCIAL-03 | — | Pending |
| SOCIAL-04 | — | Pending |
| BLOG-01 | — | Pending |
| BLOG-02 | — | Pending |
| BLOG-03 | — | Pending |
| BLOG-04 | — | Pending |
| BLOG-05 | — | Pending |
| BLOG-06 | — | Pending |
| BLOG-07 | — | Pending |
| HERO-01 | — | Pending |
| HERO-02 | — | Pending |
| HERO-03 | — | Pending |
| PROJ-01 | — | Pending |
| PROJ-02 | — | Pending |
| PROJ-03 | — | Pending |
| CLEAN-01 | — | Pending |
| CLEAN-02 | — | Pending |
| CLEAN-03 | — | Pending |

**Coverage:**
- v1.1 requirements: 18 total
- Mapped to phases: 0
- Unmapped: 18 ⚠️ (pending roadmap creation)

---
*Requirements defined: 2026-02-11*
*Last updated: 2026-02-11 after initial definition*
