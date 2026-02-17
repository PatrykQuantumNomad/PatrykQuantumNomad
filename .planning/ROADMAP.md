# Roadmap: patrykgolabek.dev

## Milestones

- SHIPPED **v1.0 MVP** — Phases 1-7 (shipped 2026-02-11)
- SHIPPED **v1.1 Content Refresh** — Phases 8-12 (shipped 2026-02-12)
- SHIPPED **v1.2 Projects Page Redesign** — Phases 13-15 (shipped 2026-02-13)
- IN PROGRESS **v1.3 The Beauty Index** — Phases 16-21

## Phases

<details>
<summary>v1.0 MVP (Phases 1-7) — SHIPPED 2026-02-11</summary>

- [x] Phase 1: Project Scaffold & Deployment Pipeline (3/3 plans) — completed 2026-02-11
- [x] Phase 2: Layout Shell & Theme System (2/2 plans) — completed 2026-02-11
- [x] Phase 3: Blog Infrastructure (2/2 plans) — completed 2026-02-11
- [x] Phase 4: Core Static Pages (2/2 plans) — completed 2026-02-11
- [x] Phase 5: SEO Foundation (2/2 plans) — completed 2026-02-11
- [x] Phase 6: Visual Effects & Quantum Explorer (2/2 plans) — completed 2026-02-11
- [x] Phase 7: Enhanced Blog & Advanced SEO (3/3 plans) — completed 2026-02-11

See `.planning/milestones/v1.0-ROADMAP.md` for full details.

</details>

<details>
<summary>v1.1 Content Refresh (Phases 8-12) — SHIPPED 2026-02-12</summary>

- [x] Phase 8: Schema & Hero Config Foundation (2/2 plans) — completed 2026-02-11
- [x] Phase 9: External Blog Integration (2/2 plans) — completed 2026-02-12
- [x] Phase 10: Social Links & Contact Update (1/1 plan) — completed 2026-02-11
- [x] Phase 11: Hero & Project Curation (1/1 plan) — completed 2026-02-12
- [x] Phase 12: Cleanup & Verification (1/1 plan) — completed 2026-02-12

See `.planning/milestones/v1.1-ROADMAP.md` for full details.

</details>

<details>
<summary>v1.2 Projects Page Redesign (Phases 13-15) — SHIPPED 2026-02-13</summary>

- [x] Phase 13: Data Model & Bento Grid Layout (2/2 plans) — completed 2026-02-13
- [x] Phase 14: Visual Design & Card Components (2/2 plans) — completed 2026-02-13
- [x] Phase 15: Filtering, Animations & Polish (2/2 plans) — completed 2026-02-13

See `.planning/milestones/v1.2-ROADMAP.md` for full details.

</details>

### v1.3 The Beauty Index (In Progress)

**Milestone Goal:** Add a new content pillar ranking 25 programming languages across 6 aesthetic dimensions, with interactive overview, per-language detail pages, a code comparison explorer, OG images for social sharing, a methodology blog post, and full SEO integration.

- [ ] **Phase 16: Data Foundation & Chart Components** - Language data schema, shared SVG math, and all build-time chart components
- [ ] **Phase 17: Overview & Language Detail Pages** - Core user-facing pages with rankings, radar charts, and language profiles
- [ ] **Phase 18: OG Images & Shareability** - Build-time OG images with radar visuals and social sharing features
- [ ] **Phase 19: Code Comparison Page** - Feature-tabbed code explorer with 25 languages and lazy rendering
- [ ] **Phase 20: Blog Content & Cross-Linking** - Methodology blog post and bidirectional links between blog and index
- [ ] **Phase 21: SEO & Launch Readiness** - Navigation, structured data, sitemap, Lighthouse, and accessibility audits

## Phase Details

### Phase 16: Data Foundation & Chart Components
**Goal**: Establish the data model and visual building blocks that every downstream page depends on
**Depends on**: Nothing (first phase of v1.3)
**Requirements**: DATA-01, DATA-02, DATA-03, DATA-04, CHART-01, CHART-02, CHART-03, CHART-04
**Success Criteria** (what must be TRUE):
  1. A languages.json file with all 25 languages validates against a Zod schema and loads via Astro 5 file() content collection — each entry contains scores across 6 dimensions, tier assignment, character sketch, and metadata
  2. A standalone Astro page rendering a radar chart for any single language produces correct SVG output with 6 labeled axes and a filled polygon matching the score values — zero client-side JavaScript shipped
  3. A standalone Astro page rendering the ranking bar chart shows all 25 languages sorted by total score with tier color coding — zero client-side JavaScript shipped
  4. The same polar-to-cartesian math utility used by radar chart components also works when imported by a Node/Satori context (validated by generating a test OG image with a radar shape)
  5. Greek dimension symbols render correctly in the site's fonts across Chrome, Firefox, and Safari
**Plans**: 2 plans

Plans:
- [x] 16-01-PLAN.md — Data model, utilities, content collection, and Greek font fallback
- [x] 16-02-PLAN.md — Chart components (radar, bar, tier badge, score breakdown) and test pages

### Phase 17: Overview & Language Detail Pages
**Goal**: Users can browse the complete Beauty Index — an overview ranking all 25 languages and individual pages with deep profiles for each language
**Depends on**: Phase 16
**Requirements**: OVER-01, OVER-02, OVER-03, OVER-04, OVER-05, LANG-01, LANG-02, LANG-03, LANG-04, LANG-05, LANG-06
**Success Criteria** (what must be TRUE):
  1. Visiting /beauty-index/ displays a ranking bar chart, a scoring table with all 25 languages, and a grid of 25 radar chart thumbnails — each thumbnail links to that language's detail page
  2. Clicking any column header in the scoring table re-sorts the table by that dimension (client-side sort)
  3. The overview page visually groups languages into 4 tiers (Beautiful, Handsome, Practical, Workhorses) with distinct color-coded sections and tier labels
  4. Visiting /beauty-index/rust/ (or any of the 25 language slugs) displays that language's radar chart, 6-dimension score breakdown, tier badge, total score, character sketch narrative, and a syntax-highlighted signature code snippet
  5. Each language detail page has previous/next navigation to adjacent languages and a back-to-overview link
**Plans**: TBD

Plans:
- [ ] 17-01: TBD
- [ ] 17-02: TBD
- [ ] 17-03: TBD

### Phase 18: OG Images & Shareability
**Goal**: Every Beauty Index page has a visually rich OG image for social sharing, and users can download or share individual chart images
**Depends on**: Phase 16
**Requirements**: SHARE-01, SHARE-02, SHARE-03, SHARE-04
**Success Criteria** (what must be TRUE):
  1. Sharing /beauty-index/ on social media (Twitter, LinkedIn, Discord) shows a custom OG image with the Beauty Index branding and ranking visual
  2. Sharing any /beauty-index/[slug]/ page shows a custom OG image featuring that language's radar chart and score summary
  3. Clicking a "Download as Image" button on a radar chart saves a PNG file to the user's device
  4. On mobile devices, a share button triggers the native OS share sheet via Web Share API; on desktop, a copy-to-clipboard button copies the chart image
**Plans**: TBD

Plans:
- [ ] 18-01: TBD
- [ ] 18-02: TBD

### Phase 19: Code Comparison Page
**Goal**: Users can compare how 25 programming languages express the same programming concepts side-by-side
**Depends on**: Phase 16
**Requirements**: CODE-01, CODE-02, CODE-03, CODE-04, CODE-05
**Research flag**: NEEDS RESEARCH-PHASE (complex interaction between Expressive Code build-time rendering, tab state management, and DOM performance with 250 code blocks)
**Success Criteria** (what must be TRUE):
  1. Visiting /beauty-index/code/ displays a tabbed interface with 10 feature tabs (Variable Declaration, If/Else, Loops, Functions, Structs, Pattern Matching, Error Handling, String Interpolation, List Operations, Signature Idiom)
  2. Clicking a tab shows syntax-highlighted code blocks for all 25 languages implementing that feature — only the active tab's code blocks are in the DOM at any time
  3. A feature support matrix table shows which languages support each feature, serving as a quick-reference grid
  4. The page loads and tab-switches without perceptible lag on mobile devices (Lighthouse performance remains 90+)
**Plans**: TBD

Plans:
- [ ] 19-01: TBD
- [ ] 19-02: TBD

### Phase 20: Blog Content & Cross-Linking
**Goal**: A full-length blog post explains the Beauty Index methodology, and all Beauty Index pages and the blog post link to each other
**Depends on**: Phase 17 (pages must exist to link to)
**Requirements**: BLOG-01, BLOG-02
**Success Criteria** (what must be TRUE):
  1. A blog post titled "The Beauty Index" (or similar) appears in the blog listing at /blog/, renders as a full local MDX post with methodology explanation, scoring rubric, and editorial commentary
  2. The blog post links to the overview page, at least 3 individual language pages, and the code comparison page — and those pages link back to the blog post
**Plans**: TBD

Plans:
- [ ] 20-01: TBD

### Phase 21: SEO & Launch Readiness
**Goal**: The Beauty Index section is fully integrated into site navigation, discoverable by search engines, and meets all quality standards
**Depends on**: Phase 17, Phase 19, Phase 20 (all content must exist for cross-linking and auditing)
**Requirements**: SEO-01, SEO-02, SEO-03, SEO-04, SEO-05, SEO-06, SEO-07
**Success Criteria** (what must be TRUE):
  1. The site header navigation includes a "Beauty Index" link that takes users to /beauty-index/
  2. All Beauty Index pages include JSON-LD structured data (Dataset/ItemList on overview, breadcrumbs on all pages) and appear in the sitemap
  3. The homepage and at least 2 existing blog posts contain internal links to Beauty Index pages
  4. Lighthouse audit scores 90+ on Performance, Accessibility, Best Practices, and SEO for the overview page, a language detail page, and the code comparison page
  5. Keyboard navigation works across all Beauty Index pages — scoring table sort, tab switching, language navigation — and screen readers can access chart data via accessible alternatives
**Plans**: TBD

Plans:
- [ ] 21-01: TBD
- [ ] 21-02: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 16 -> 17 -> 18 -> 19 -> 20 -> 21
Note: Phase 18 depends only on Phase 16 (not 17), so it could run in parallel with Phase 17 if needed.

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
| 13. Data Model & Bento Grid | v1.2 | 2/2 | Complete | 2026-02-13 |
| 14. Visual Design & Cards | v1.2 | 2/2 | Complete | 2026-02-13 |
| 15. Filtering & Animations | v1.2 | 2/2 | Complete | 2026-02-13 |
| 16. Data Foundation & Charts | v1.3 | 2/2 | Complete | 2026-02-17 |
| 17. Overview & Detail Pages | v1.3 | 0/? | Not started | - |
| 18. OG Images & Shareability | v1.3 | 0/? | Not started | - |
| 19. Code Comparison | v1.3 | 0/? | Not started | - |
| 20. Blog Content | v1.3 | 0/? | Not started | - |
| 21. SEO & Launch | v1.3 | 0/? | Not started | - |

---
*Roadmap created: 2026-02-11*
*Last updated: 2026-02-17 — Phase 16 complete (2/2 plans done)*
