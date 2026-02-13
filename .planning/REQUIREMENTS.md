# Requirements: patrykgolabek.dev

**Defined:** 2026-02-13
**Core Value:** A fast, SEO-optimized, visually distinctive portfolio that ranks well in search engines and makes a memorable impression on recruiters, collaborators, and the developer community.

## v1.2 Requirements

Requirements for the Projects Page Redesign milestone. Each maps to roadmap phases.

### Data Model

- [x] **DATA-01**: Project data includes `technologies` array for multi-tech badge display
- [x] **DATA-02**: Project data includes `featured` flag to spotlight hero projects
- [x] **DATA-03**: Project data includes `status` field (active/archived/experimental)
- [x] **DATA-04**: Project data includes `gridSize` hint for bento layout placement (large/medium/small)

### Layout

- [x] **LAYOUT-01**: Projects page uses bento grid with asymmetric card sizes based on gridSize
- [x] **LAYOUT-02**: Featured project(s) display in a hero section above the category grid
- [x] **LAYOUT-03**: Categories separated by animated gradient dividers
- [x] **LAYOUT-04**: Responsive layout — bento on desktop, 2-col on tablet, 1-col stacked on mobile

### Filtering

- [ ] **FILTER-01**: Category filter tabs at top of page with "All" default
- [ ] **FILTER-02**: Clicking filter tab shows/hides cards with smooth CSS transitions
- [ ] **FILTER-03**: Active filter state visually indicated (accent styling on active tab)
- [ ] **FILTER-04**: Filter state reflected in URL hash for shareability

### Animations

- [ ] **ANIM-01**: Cards stagger-reveal on scroll with GSAP (using existing `data-card-group` infrastructure)
- [ ] **ANIM-02**: Mouse-tracking gradient glow follows cursor across card surface
- [ ] **ANIM-03**: Floating section orbs behind category groups (using existing `data-section-bg`)
- [ ] **ANIM-04**: Magnetic effect on card CTA buttons (using existing `data-magnetic`)
- [ ] **ANIM-05**: Filter tab transitions animate card layout changes (fade out/in with position shift)
- [ ] **ANIM-06**: All animations respect `prefers-reduced-motion` with graceful fallbacks

### Visual Design

- [ ] **VIS-01**: Tech stack badges displayed as pills on each project card
- [ ] **VIS-02**: Project status badges (Featured/Active/Live) with distinct styling
- [ ] **VIS-03**: Category filter tabs styled as pill buttons with hover and active states
- [ ] **VIS-04**: Cards use enhanced glassmorphism with category-tinted glow on hover
- [ ] **VIS-05**: Category headers include project count in mono metadata style

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Content & Data

- **DATA-05**: Project screenshots/images for visual card previews
- **DATA-06**: GitHub API integration for star counts and last-commit dates

### Interactivity

- **FILTER-05**: Search bar with real-time text filtering across project name/description/tech

### Pages

- **LAYOUT-05**: Project detail modal or drawer with full README preview
- **LAYOUT-06**: Dedicated project detail pages at `/projects/[slug]/`

## Out of Scope

| Feature | Reason |
|---------|--------|
| GitHub API runtime calls | Static site — would need build-time fetch or external service |
| Project screenshots | Requires creating/hosting 16 images; defer to v2 |
| Sort options (date, popularity) | No date/popularity data available; defer until GitHub API |
| Contact form on project cards | Already out of scope from v1.0 |
| Comments/ratings on projects | Portfolio, not social platform |
| Server-side filtering | Static site — all filtering is client-side JS |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| DATA-01 | Phase 13 | Done |
| DATA-02 | Phase 13 | Done |
| DATA-03 | Phase 13 | Done |
| DATA-04 | Phase 13 | Done |
| LAYOUT-01 | Phase 13 | Done |
| LAYOUT-02 | Phase 13 | Done |
| LAYOUT-03 | Phase 13 | Done |
| LAYOUT-04 | Phase 13 | Done |
| VIS-01 | Phase 14 | Pending |
| VIS-02 | Phase 14 | Pending |
| VIS-04 | Phase 14 | Pending |
| VIS-05 | Phase 14 | Pending |
| FILTER-01 | Phase 15 | Pending |
| FILTER-02 | Phase 15 | Pending |
| FILTER-03 | Phase 15 | Pending |
| FILTER-04 | Phase 15 | Pending |
| VIS-03 | Phase 15 | Pending |
| ANIM-01 | Phase 15 | Pending |
| ANIM-02 | Phase 15 | Pending |
| ANIM-03 | Phase 15 | Pending |
| ANIM-04 | Phase 15 | Pending |
| ANIM-05 | Phase 15 | Pending |
| ANIM-06 | Phase 15 | Pending |

**Coverage:**
- v1.2 requirements: 23 total
- Mapped to phases: 23
- Unmapped: 0

---
*Requirements defined: 2026-02-13*
*Last updated: 2026-02-13 after roadmap creation (all 23 requirements mapped)*
