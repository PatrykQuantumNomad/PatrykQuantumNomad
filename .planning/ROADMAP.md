# Roadmap: patrykgolabek.dev

## Milestones

- ✅ **v1.0 MVP** - Phases 1-7 (shipped 2026-02-11)
- 🚧 **v1.1 Content Refresh** - Phases 8-12 (in progress)

## Phases

<details>
<summary>✅ v1.0 MVP (Phases 1-7) - SHIPPED 2026-02-11</summary>

### Phase 1: Project Scaffold & Deployment Pipeline
**Goal**: Working Astro 5 site deployed to GitHub Pages via GitHub Actions
**Plans**: 3 plans

Plans:
- [x] 01-01: Astro project scaffold with TypeScript
- [x] 01-02: GitHub Actions deployment pipeline
- [x] 01-03: Custom domain configuration

### Phase 2: Layout Shell & Theme System
**Goal**: Reusable layout with Quantum Explorer theme, dark/light mode, and responsive navigation
**Plans**: 2 plans

Plans:
- [x] 02-01: Base layout and navigation
- [x] 02-02: Theme system with dark/light toggle

### Phase 3: Blog Infrastructure
**Goal**: Complete blog system with content collections, listing, detail pages, and MDX support
**Plans**: 2 plans

Plans:
- [x] 03-01: Content collections and blog listing
- [x] 03-02: Blog detail pages with MDX

### Phase 4: Core Static Pages
**Goal**: All content pages (Home, Projects, About, Contact) with real content
**Plans**: 2 plans

Plans:
- [x] 04-01: Home and About pages
- [x] 04-02: Projects and Contact pages

### Phase 5: SEO Foundation
**Goal**: Full SEO stack with meta tags, structured data, sitemap, and RSS
**Plans**: 2 plans

Plans:
- [x] 05-01: SEO component and structured data
- [x] 05-02: Sitemap, RSS, and robots.txt

### Phase 6: Visual Effects & Quantum Explorer
**Goal**: Distinctive visual identity with particle canvas, animations, and scroll reveals
**Plans**: 2 plans

Plans:
- [x] 06-01: Particle canvas and hero animations
- [x] 06-02: Scroll reveals and view transitions

### Phase 7: Enhanced Blog & Advanced SEO
**Goal**: Blog polish (syntax highlighting, TOC, tags, OG images) and advanced SEO (LLMs.txt, GEO, accessibility audit)
**Plans**: 2 plans

Plans:
- [x] 07-01: Blog enhancements
- [x] 07-02: Dynamic OG images and LLMs.txt
- [x] 07-03: Accessibility audit and Lighthouse optimization

</details>

### 🚧 v1.1 Content Refresh (In Progress)

**Milestone Goal:** Update personal info, refine hero messaging, curate projects, and integrate external blog content from Kubert AI and Translucent Computing

**Phase Numbering:**
- Integer phases (8, 9, 10, 11, 12): Planned milestone work
- Decimal phases (e.g., 8.1): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 8: Schema & Hero Config Foundation** - Establish data contracts that all content phases depend on
- [ ] **Phase 9: External Blog Integration** - Surface curated external blog posts alongside local content
- [ ] **Phase 10: Social Links & Contact Update** - Update email, add X and YouTube, remove LinkedIn from UI
- [ ] **Phase 11: Hero & Project Curation** - Refresh hero messaging and remove deprecated projects
- [ ] **Phase 12: Cleanup & Verification** - Delete draft post and verify all outputs are consistent

## Phase Details

### Phase 8: Schema & Hero Config Foundation
**Goal**: Data contracts exist so that all subsequent content changes propagate consistently
**Depends on**: Nothing (first phase of v1.1 -- builds on shipped v1.0)
**Requirements**: BLOG-07, HERO-03
**Success Criteria** (what must be TRUE):
  1. Blog content schema accepts optional `externalUrl` and `source` fields without breaking existing posts
  2. A centralized hero config in `src/data/site.ts` exports name, tagline, and roles array
  3. Home page title tag, meta description, and JSON-LD Person entity consume hero data from site.ts (not hardcoded strings)
**Plans**: TBD

Plans:
- [ ] 08-01: TBD
- [ ] 08-02: TBD

### Phase 9: External Blog Integration
**Goal**: Visitors see a credible content hub with 8-12 curated external posts from Kubert AI and Translucent Computing alongside local blog content
**Depends on**: Phase 8 (schema must support externalUrl and source fields)
**Requirements**: BLOG-01, BLOG-02, BLOG-03, BLOG-04, BLOG-05, BLOG-06
**Success Criteria** (what must be TRUE):
  1. Blog listing page displays external posts mixed with local posts, sorted chronologically by date
  2. External blog entries show a visible source badge (e.g., "on Kubert AI") and an external link icon distinguishing them from local posts
  3. Clicking an external blog entry opens the external site in a new tab (not an internal page)
  4. No `/blog/ext-*` detail pages exist in the built output -- external posts do not generate slug pages or OG images
  5. RSS feed at `/rss.xml` includes external blog entries with their canonical external URL as the link
**Plans**: TBD

Plans:
- [ ] 09-01: TBD
- [ ] 09-02: TBD

### Phase 10: Social Links & Contact Update
**Goal**: All visible social links and contact info reflect current accounts (X, YouTube, updated email) with LinkedIn removed from the UI
**Depends on**: Nothing (independent of Phases 8-9 -- updates component files directly)
**Requirements**: SOCIAL-01, SOCIAL-02, SOCIAL-03, SOCIAL-04
**Success Criteria** (what must be TRUE):
  1. Footer, Contact page, and Home CTA all display pgolabek@gmail.com as the email address
  2. X (@QuantumMentat) link appears in Footer and Contact with proper SVG icon and aria-label
  3. YouTube (@QuantumMentat) link appears in Footer and Contact with proper SVG icon and aria-label
  4. LinkedIn link is no longer visible anywhere in the site UI (Footer, Contact, Home CTA)
**Plans**: TBD

Plans:
- [ ] 10-01: TBD

### Phase 11: Hero & Project Curation
**Goal**: Hero section conveys a craft-and-precision architect identity, and the Projects page shows only active, relevant work
**Depends on**: Phase 8 (hero config in site.ts must exist for keyword propagation)
**Requirements**: HERO-01, HERO-02, PROJ-01, PROJ-02, PROJ-03
**Success Criteria** (what must be TRUE):
  1. Hero section displays a new tagline with craft and precision tone -- no location reference, no "Pre-1.0 Kubernetes adopter"
  2. Hero typing animation cycles through updated roles reflecting architect/engineer/builder identity
  3. Projects page no longer shows the "Full-Stack Applications" category or gemini-beauty-math
  4. Project count in meta descriptions matches the actual number of displayed projects
**Plans**: TBD

Plans:
- [ ] 11-01: TBD

### Phase 12: Cleanup & Verification
**Goal**: All stale content is removed and every generated output (sitemap, RSS, LLMs.txt, OG images) accurately reflects the v1.1 content changes
**Depends on**: Phases 8, 9, 10, 11 (verification must happen after all content changes)
**Requirements**: CLEAN-01, CLEAN-02, CLEAN-03
**Success Criteria** (what must be TRUE):
  1. The draft placeholder blog post file is deleted and does not appear in any build output
  2. `astro build` completes with zero errors and no broken internal links
  3. Sitemap lists all valid pages (no removed pages, includes new tag pages if any)
  4. RSS feed entries have correct links -- external posts link externally, local posts link to `/blog/[slug]/`
  5. LLMs.txt reflects updated content accurately
**Plans**: TBD

Plans:
- [ ] 12-01: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 8 → 9 → 10 → 11 → 12
(Phases 10 and 11 could execute in parallel since they are independent, but 10 depends on nothing while 11 depends on Phase 8)

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Project Scaffold | v1.0 | 3/3 | Complete | 2026-02-11 |
| 2. Layout & Theme | v1.0 | 2/2 | Complete | 2026-02-11 |
| 3. Blog Infrastructure | v1.0 | 2/2 | Complete | 2026-02-11 |
| 4. Core Static Pages | v1.0 | 2/2 | Complete | 2026-02-11 |
| 5. SEO Foundation | v1.0 | 2/2 | Complete | 2026-02-11 |
| 6. Visual Effects | v1.0 | 2/2 | Complete | 2026-02-11 |
| 7. Enhanced Blog & SEO | v1.0 | 3/3 | Complete | 2026-02-11 |
| 8. Schema & Hero Config | v1.1 | 0/2 | Not started | - |
| 9. External Blog | v1.1 | 0/2 | Not started | - |
| 10. Social Links | v1.1 | 0/1 | Not started | - |
| 11. Hero & Projects | v1.1 | 0/1 | Not started | - |
| 12. Cleanup & Verify | v1.1 | 0/1 | Not started | - |

---
*Roadmap created: 2026-02-11*
*Last updated: 2026-02-11*
