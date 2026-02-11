# Roadmap: patrykgolabek.dev

## Overview

This roadmap delivers a complete personal portfolio and blog site for Patryk Golabek at patrykgolabek.dev. The journey progresses from infrastructure foundation through layout and content, then layers on SEO, visual effects, and enhanced blog features. Seven phases deliver 36 requirements, with each phase completing a coherent, verifiable capability that builds on the previous one.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Project Scaffold + Deployment Pipeline** - Astro project with CI/CD deploying to GitHub Pages with custom domain
- [ ] **Phase 2: Layout Shell + Theme System** - Base layout, navigation, dark/light mode, typography, and accessibility foundation
- [ ] **Phase 3: Blog Infrastructure** - Content collections, blog listing, post pages, syntax highlighting, reading time, draft filtering
- [ ] **Phase 4: Core Static Pages** - Home (with hero), Projects (19 repos), About, and Contact — responsive across devices
- [ ] **Phase 5: SEO Foundation** - Meta tags, Open Graph, sitemap, RSS, JSON-LD, robots.txt, and keyword integration
- [ ] **Phase 6: Visual Effects + Quantum Explorer** - Particle canvas, view transitions, scroll reveals, and reduced-motion fallbacks
- [ ] **Phase 7: Enhanced Blog + Advanced SEO** - Tag pages, table of contents, dynamic OG images, LLMs.txt, GEO optimization, Lighthouse validation

## Phase Details

### Phase 1: Project Scaffold + Deployment Pipeline
**Goal**: A bare Astro site deploys automatically to GitHub Pages at patrykgolabek.dev on every push to main
**Depends on**: Nothing (first phase)
**Requirements**: INFRA-01, INFRA-02, INFRA-04
**Research flag**: Standard patterns, skip research
**Success Criteria** (what must be TRUE):
  1. Pushing to main triggers a GitHub Actions build that deploys to GitHub Pages without manual intervention
  2. Visiting patrykgolabek.dev in a browser loads the site over HTTPS
  3. The site rebuilds and redeploys successfully on subsequent pushes (CNAME persists across deploys)
**Plans**: 2 plans

Plans:
- [x] 01-01-PLAN.md — Scaffold Astro project from scratch with astro.config.mjs, minimal index page, CNAME, robots.txt
- [ ] 01-02-PLAN.md — GitHub Actions deployment workflow + DNS/Pages configuration checkpoint

### Phase 2: Layout Shell + Theme System
**Goal**: Every page shares a consistent layout with header navigation, footer, dark/light mode toggle, futuristic typography, and accessibility fundamentals
**Depends on**: Phase 1
**Requirements**: SITE-02, THEME-01, THEME-02, THEME-03, THEME-09, THEME-10
**Research flag**: Standard patterns, skip research
**Success Criteria** (what must be TRUE):
  1. User can navigate between pages via a persistent header with nav items visible on all screen sizes
  2. User can toggle between dark and light mode, and the preference persists after closing and reopening the browser
  3. Site loads in the user's OS-preferred color scheme with no flash of wrong theme on any page load or navigation
  4. Site uses Space Grotesk for headings, Inter for body text, and JetBrains Mono for code — visible across all pages
  5. Site passes WCAG 2.1 AA checks: all interactive elements are keyboard-navigable, color contrast ratios meet minimums, and HTML is semantic
**Plans**: TBD

Plans:
- [ ] 02-01: TBD
- [ ] 02-02: TBD
- [ ] 02-03: TBD

### Phase 3: Blog Infrastructure
**Goal**: Users can browse and read blog posts with proper typography, syntax-highlighted code, and reading time — while draft posts stay hidden in production
**Depends on**: Phase 2
**Requirements**: BLOG-01, BLOG-02, BLOG-03, BLOG-04, BLOG-05
**Research flag**: Standard patterns, skip research
**Success Criteria** (what must be TRUE):
  1. User can browse a chronologically sorted list of published blog posts at /blog/
  2. User can click through to read a full blog post at /blog/[slug]/ with readable typography
  3. Code blocks in blog posts display syntax highlighting with a visible copy button that copies code to clipboard
  4. Each blog post displays an estimated reading time (e.g., "5 min read")
  5. Posts with `draft: true` in frontmatter do not appear on /blog/ or generate pages in production builds
**Plans**: TBD

Plans:
- [ ] 03-01: TBD
- [ ] 03-02: TBD

### Phase 4: Core Static Pages
**Goal**: Users can explore a complete 5-page site — home page with animated hero, projects page with all 19 repos, about page, and contact information — responsive across devices
**Depends on**: Phase 3
**Requirements**: SITE-01, SITE-03, SITE-04, SITE-05
**Research flag**: Standard patterns, skip research
**Success Criteria** (what must be TRUE):
  1. User sees a responsive layout on mobile, tablet, and desktop across all five page types (Home, Blog, Blog Post, Projects, About)
  2. Home page hero section displays a typing animation for role title and visible CTA buttons linking to key sections
  3. Projects page displays all 19 GitHub repos grouped by category with descriptions and links to each repository
  4. User can find contact information (mailto link and LinkedIn profile link) on the site
**Plans**: TBD

Plans:
- [ ] 04-01: TBD
- [ ] 04-02: TBD

### Phase 5: SEO Foundation
**Goal**: Every page is discoverable by search engines and social platforms with proper metadata, structured data, sitemap, and RSS feed
**Depends on**: Phase 4
**Requirements**: SEO-01, SEO-02, SEO-03, SEO-04, SEO-05, SEO-06, SEO-10
**Research flag**: Standard patterns, skip research
**Success Criteria** (what must be TRUE):
  1. Every page has a unique title tag (50-60 chars) and meta description (150-160 chars) visible in page source
  2. Every page has canonical URL, Open Graph tags, and Twitter Card tags that render correct previews when shared on social platforms
  3. Visiting /sitemap-index.xml returns a valid sitemap listing all pages with correct absolute URLs
  4. Visiting /rss.xml returns a valid RSS feed with all published blog posts
  5. robots.txt exists at site root and points to sitemap-index.xml
  6. Homepage includes Person JSON-LD schema and blog posts include BlogPosting JSON-LD schema (validatable via Google Rich Results Test)
  7. SEO keywords (Kubernetes, cloud-native, AI/ML, platform engineering, etc.) appear naturally throughout site content
**Plans**: TBD

Plans:
- [ ] 05-01: TBD
- [ ] 05-02: TBD

### Phase 6: Visual Effects + Quantum Explorer
**Goal**: The site delivers the signature "Quantum Explorer" experience — particle canvas on the hero, smooth page transitions, scroll-triggered reveals — without compromising performance or accessibility
**Depends on**: Phase 5
**Requirements**: THEME-04, THEME-05, THEME-06, THEME-07, THEME-08
**Research flag**: NEEDS RESEARCH for particle performance optimization and reduced-motion patterns
**Success Criteria** (what must be TRUE):
  1. Home page hero displays an animated particle canvas creating the "Quantum Explorer" dark space aesthetic
  2. Particle effects pause automatically when the browser tab is hidden, and particle count is reduced on mobile devices
  3. Users with prefers-reduced-motion enabled see a static gradient fallback instead of any animations (particles, scroll reveals, transitions)
  4. Navigating between pages produces smooth view transitions (no full-page reload flash)
  5. Page sections animate into view as the user scrolls down (scroll-triggered reveal animations)
**Plans**: TBD

Plans:
- [ ] 06-01: TBD
- [ ] 06-02: TBD

### Phase 7: Enhanced Blog + Advanced SEO
**Goal**: Blog gains discoverability features (tags, ToC, dynamic social images) and the site achieves advanced SEO capabilities (LLMs.txt, GEO optimization) with verified Lighthouse 90+ performance
**Depends on**: Phase 6
**Requirements**: BLOG-06, BLOG-07, SEO-07, SEO-08, SEO-09, INFRA-03
**Research flag**: NEEDS RESEARCH for dynamic OG image generation (Satori + Sharp)
**Success Criteria** (what must be TRUE):
  1. User can click a tag on a blog post and see all posts with that tag at /blog/tags/[tag]/
  2. Blog posts with multiple headings display an auto-generated table of contents
  3. Each blog post has a unique, auto-generated Open Graph image (visible when sharing the post URL on social platforms)
  4. /llms.txt serves an LLM-friendly content summary for AI-powered discovery tools
  5. Site achieves Lighthouse scores of 90+ in Performance, Accessibility, Best Practices, and SEO on mobile

**Plans**: TBD

Plans:
- [ ] 07-01: TBD
- [ ] 07-02: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3 -> 4 -> 5 -> 6 -> 7

| Phase | Plans Complete | Status | Completed |
|-------|---------------|--------|-----------|
| 1. Project Scaffold + Deployment Pipeline | 1/2 | In progress | - |
| 2. Layout Shell + Theme System | 0/TBD | Not started | - |
| 3. Blog Infrastructure | 0/TBD | Not started | - |
| 4. Core Static Pages | 0/TBD | Not started | - |
| 5. SEO Foundation | 0/TBD | Not started | - |
| 6. Visual Effects + Quantum Explorer | 0/TBD | Not started | - |
| 7. Enhanced Blog + Advanced SEO | 0/TBD | Not started | - |
