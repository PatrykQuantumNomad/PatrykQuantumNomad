# Requirements: patrykgolabek.dev

**Defined:** 2026-02-11
**Core Value:** A fast, SEO-optimized, visually distinctive portfolio that ranks well in search engines and makes a memorable impression on recruiters, collaborators, and the developer community.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Site Structure

- [ ] **SITE-01**: User sees a responsive 5-page site (Home, Blog, Blog Posts, Projects, About) that works on mobile, tablet, and desktop
- [ ] **SITE-02**: User can navigate between all pages via a persistent header with 5-7 nav items
- [ ] **SITE-03**: User sees an animated hero section on the home page with typing effect for role title and CTA buttons
- [ ] **SITE-04**: User can find contact information (mailto link + LinkedIn) on the site
- [ ] **SITE-05**: User can browse all 19 GitHub repos on the Projects page, grouped by category with descriptions and links

### Content & Blog

- [ ] **BLOG-01**: User can browse a list of blog posts sorted by date on /blog/
- [ ] **BLOG-02**: User can read individual blog posts at /blog/[slug]/ with proper typography
- [ ] **BLOG-03**: User sees syntax-highlighted code blocks with copy buttons in blog posts
- [ ] **BLOG-04**: User sees estimated reading time on each blog post
- [ ] **BLOG-05**: Draft posts are excluded from production builds
- [ ] **BLOG-06**: User can filter blog posts by tag on /blog/tags/[tag]/ pages
- [ ] **BLOG-07**: User sees an auto-generated table of contents from headings on blog posts

### Theme & Visual Effects

- [ ] **THEME-01**: User can toggle between dark and light mode, with preference persisted across sessions
- [ ] **THEME-02**: Site defaults to user's OS color scheme preference
- [ ] **THEME-03**: No flash of unstyled content (FOUC) on page load or View Transition navigation
- [ ] **THEME-04**: User sees the "Quantum Explorer" particle canvas on the home page hero section
- [ ] **THEME-05**: Particle effects pause when tab is hidden and reduce on mobile devices
- [ ] **THEME-06**: Users with prefers-reduced-motion see a static fallback instead of animations
- [ ] **THEME-07**: User experiences smooth view transitions between pages via ClientRouter
- [ ] **THEME-08**: User sees scroll-triggered reveal animations on page sections
- [ ] **THEME-09**: Site uses futuristic typography (Space Grotesk headings, Inter body, JetBrains Mono code)
- [ ] **THEME-10**: Site meets WCAG 2.1 AA accessibility standards (semantic HTML, keyboard nav, contrast ratios)

### SEO & Discoverability

- [ ] **SEO-01**: Every page has unique title (50-60 chars) and meta description (150-160 chars)
- [ ] **SEO-02**: Every page has canonical URL, Open Graph tags, and Twitter Card tags
- [ ] **SEO-03**: Sitemap auto-generated at /sitemap-index.xml
- [ ] **SEO-04**: RSS feed available at /rss.xml
- [ ] **SEO-05**: robots.txt points to sitemap-index.xml
- [ ] **SEO-06**: JSON-LD structured data on homepage (Person schema) and blog posts (BlogPosting schema)
- [ ] **SEO-07**: Dynamic OG images auto-generated per blog post using Satori + Sharp
- [ ] **SEO-08**: LLMs.txt file served for LLM-friendly content discovery
- [ ] **SEO-09**: Site optimized for Generative Search Optimization (GEO) with structured, authoritative content
- [ ] **SEO-10**: SEO keywords naturally integrated throughout site content

### Deployment & Infrastructure

- [ ] **INFRA-01**: Site deploys automatically via GitHub Actions using withastro/action@v5 on push to main
- [ ] **INFRA-02**: Custom domain patrykgolabek.dev configured with CNAME in public/
- [ ] **INFRA-03**: Site achieves Lighthouse 90+ scores across all categories on mobile
- [ ] **INFRA-04**: astro.config.mjs configured with site: 'https://patrykgolabek.dev' and output: 'static'

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Search & Discovery

- **SRCH-01**: User can search blog posts and projects via Pagefind
- **SRCH-02**: Search results highlight matching terms

### Engagement

- **ENGM-01**: User can subscribe to email newsletter
- **ENGM-02**: User sees GitHub activity (pinned repos, contribution count) on the site

### Content Depth

- **DEEP-01**: User can read detailed project case studies with architecture diagrams
- **DEEP-02**: User sees privacy-friendly analytics badge (Plausible/Fathom)

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| CMS backend (WordPress, Strapi, etc.) | Overkill for single-author site updated monthly; Git-based Markdown editing is simpler and more reliable |
| Comments system | Requires moderation, attracts spam, adds noise; use "Discuss on Twitter" or "Reply via email" links instead |
| Complex contact form with backend | Needs third-party service for static site; mailto link + LinkedIn is reliable and zero-dependency |
| Multi-language / i18n | Doubles content maintenance; target audience is English-speaking tech recruiters and collaborators |
| Heavy animations on every page | Tanks performance, distracts from content; reserve particle effects for home hero only |
| Google Analytics | 45KB+ script, requires cookie consent banner, sends user data to Google; use Plausible/Fathom later if needed |
| User accounts / authentication | Portfolio is a public read-only site; authentication adds massive complexity for zero value |
| Real-time features (WebSockets) | Requires server; fetch GitHub data at build time instead |
| Client-side SPA rendering | Defeats Astro's zero-JS advantage; use View Transitions for smooth navigation |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| SITE-01 | Phase 4 | Pending |
| SITE-02 | Phase 2 | Pending |
| SITE-03 | Phase 4 | Pending |
| SITE-04 | Phase 4 | Pending |
| SITE-05 | Phase 4 | Pending |
| BLOG-01 | Phase 3 | Pending |
| BLOG-02 | Phase 3 | Pending |
| BLOG-03 | Phase 3 | Pending |
| BLOG-04 | Phase 3 | Pending |
| BLOG-05 | Phase 3 | Pending |
| BLOG-06 | Phase 7 | Pending |
| BLOG-07 | Phase 7 | Pending |
| THEME-01 | Phase 2 | Pending |
| THEME-02 | Phase 2 | Pending |
| THEME-03 | Phase 2 | Pending |
| THEME-04 | Phase 6 | Pending |
| THEME-05 | Phase 6 | Pending |
| THEME-06 | Phase 6 | Pending |
| THEME-07 | Phase 6 | Pending |
| THEME-08 | Phase 6 | Pending |
| THEME-09 | Phase 2 | Pending |
| THEME-10 | Phase 2 | Pending |
| SEO-01 | Phase 5 | Pending |
| SEO-02 | Phase 5 | Pending |
| SEO-03 | Phase 5 | Pending |
| SEO-04 | Phase 5 | Pending |
| SEO-05 | Phase 5 | Pending |
| SEO-06 | Phase 5 | Pending |
| SEO-07 | Phase 7 | Pending |
| SEO-08 | Phase 7 | Pending |
| SEO-09 | Phase 7 | Pending |
| SEO-10 | Phase 5 | Pending |
| INFRA-01 | Phase 1 | Pending |
| INFRA-02 | Phase 1 | Pending |
| INFRA-03 | Phase 7 | Pending |
| INFRA-04 | Phase 1 | Pending |

**Coverage:**
- v1 requirements: 36 total
- Mapped to phases: 36
- Unmapped: 0

---
*Requirements defined: 2026-02-11*
*Last updated: 2026-02-11 after roadmap creation*
