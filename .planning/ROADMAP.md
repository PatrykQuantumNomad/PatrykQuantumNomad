# Roadmap: patrykgolabek.dev

## Milestones

- ✅ **v1.0 MVP** - Phases 1-7 (shipped 2026-02-11)
- ✅ **v1.1 Content Refresh** - Phases 8-12 (shipped 2026-02-12)
- 🚧 **v1.2 Projects Page Redesign** - Phases 13-15 (in progress)

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

<details>
<summary>✅ v1.1 Content Refresh (Phases 8-12) - SHIPPED 2026-02-12</summary>

- [x] Phase 8: Schema & Hero Config Foundation (2/2 plans) — completed 2026-02-11
- [x] Phase 9: External Blog Integration (2/2 plans) — completed 2026-02-12
- [x] Phase 10: Social Links & Contact Update (1/1 plan) — completed 2026-02-11
- [x] Phase 11: Hero & Project Curation (1/1 plan) — completed 2026-02-12
- [x] Phase 12: Cleanup & Verification (1/1 plan) — completed 2026-02-12

See `.planning/milestones/v1.1-ROADMAP.md` for full details.

</details>

### 🚧 v1.2 Projects Page Redesign (In Progress)

**Milestone Goal:** Transform the projects page from a basic 3-column grid into a visually striking, interactive bento-grid showcase with category filtering, rich animations, and enhanced project data -- a portfolio page that demonstrates frontend craft.

#### Phase 13: Data Model & Bento Grid Layout
**Goal**: Projects page renders all 16 projects in an asymmetric bento grid with featured hero section and responsive breakpoints
**Depends on**: Phase 12 (existing projects.ts data and page)
**Requirements**: DATA-01, DATA-02, DATA-03, DATA-04, LAYOUT-01, LAYOUT-02, LAYOUT-03, LAYOUT-04
**Success Criteria** (what must be TRUE):
  1. Each project card displays its technology stack, featured flag, status, and grid size from the extended data model
  2. The projects page renders an asymmetric bento grid where card sizes vary based on gridSize (large cards span 2 columns, medium span 1, small are compact)
  3. Featured project(s) appear in a visually distinct hero section above the category grid
  4. Category groups are separated by gradient dividers
  5. Layout adapts correctly: bento grid on desktop, 2-column on tablet, single-column stack on mobile
**Plans**: 2 plans

Plans:
- [ ] 13-01-PLAN.md -- Extend Project data model with technologies, featured, status, gridSize
- [ ] 13-02-PLAN.md -- Rebuild projects page with hero section and bento grid layout

#### Phase 14: Visual Design & Card Components
**Goal**: Project cards are visually rich with tech badges, status indicators, glassmorphism effects, and polished category headers
**Depends on**: Phase 13 (bento grid structure and data model)
**Requirements**: VIS-01, VIS-02, VIS-04, VIS-05
**Success Criteria** (what must be TRUE):
  1. Each project card shows technology badges as styled pills (e.g., "Python", "HCL", "TypeScript")
  2. Project cards display status badges (Featured/Active/Live) with visually distinct styling per status
  3. Cards use glassmorphism with category-tinted glow on hover (visible color shift per category)
  4. Each category header shows the project count in monospace metadata style (e.g., "AI/ML & LLM Agents // 7 projects")
**Plans**: TBD

#### Phase 15: Filtering, Animations & Polish
**Goal**: Users can filter projects by category with smooth transitions, and all page elements use rich scroll-triggered and interactive animations with accessibility fallbacks
**Depends on**: Phase 14 (complete visual card design)
**Requirements**: FILTER-01, FILTER-02, FILTER-03, FILTER-04, VIS-03, ANIM-01, ANIM-02, ANIM-03, ANIM-04, ANIM-05, ANIM-06
**Success Criteria** (what must be TRUE):
  1. Category filter tabs appear at the top of the page with "All" selected by default; clicking a tab shows only that category's projects
  2. Filter transitions are smooth -- cards fade out and in with position shifts, not instant show/hide
  3. The active filter tab is visually distinct (accent-styled pill button), and the selected filter is reflected in the URL hash (e.g., #kubernetes)
  4. Cards stagger-reveal on scroll, mouse-tracking gradient glow follows cursor across card surfaces, floating orbs appear behind category sections, and CTA buttons have magnetic pull effect
  5. All animations degrade gracefully when prefers-reduced-motion is enabled (no motion, instant transitions)
**Plans**: TBD

## Progress

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Project Scaffold | v1.0 | 3/3 | Complete | 2026-02-11 |
| 2. Layout & Theme | v1.0 | 2/2 | Complete | 2026-02-11 |
| 3. Blog Infrastructure | v1.0 | 2/2 | Complete | 2026-02-11 |
| 4. Core Static Pages | v1.0 | 2/2 | Complete | 2026-02-11 |
| 5. SEO Foundation | v1.0 | 2/2 | Complete | 2026-02-11 |
| 6. Visual Effects | v1.0 | 2/2 | Complete | 2026-02-11 |
| 7. Enhanced Blog & SEO | v1.0 | 3/3 | Complete | 2026-02-11 |
| 8. Schema & Hero Config | v1.1 | 2/2 | Complete | 2026-02-11 |
| 9. External Blog | v1.1 | 2/2 | Complete | 2026-02-12 |
| 10. Social Links | v1.1 | 1/1 | Complete | 2026-02-11 |
| 11. Hero & Projects | v1.1 | 1/1 | Complete | 2026-02-12 |
| 12. Cleanup & Verify | v1.1 | 1/1 | Complete | 2026-02-12 |
| 13. Data Model & Bento Grid | v1.2 | 0/2 | Not started | - |
| 14. Visual Design & Cards | v1.2 | 0/TBD | Not started | - |
| 15. Filtering & Animations | v1.2 | 0/TBD | Not started | - |

---
*Roadmap created: 2026-02-11*
*Last updated: 2026-02-13 (Phase 13 planned: 2 plans in 2 waves)*
