---
phase: 14-visual-design-card-components
plan: 01
subsystem: project-cards
tags: [visual-design, css, components, glassmorphism, badges, hover-effects]
dependency-graph:
  requires: [13-01-data-model, 13-02-bento-grid]
  provides: [category-glow-system, styled-tech-pills, status-dot-badges, featured-live-badges]
  affects: [ProjectCard.astro, ProjectHero.astro, global.css]
tech-stack:
  added: []
  patterns: [inline-css-custom-properties, css-fallback-pattern, tailwind-arbitrary-values]
key-files:
  created: []
  modified:
    - src/styles/global.css
    - src/components/ProjectCard.astro
    - src/components/ProjectHero.astro
key-decisions:
  - Inline style --category-glow approach over data-attribute CSS selectors (simpler, fewer CSS rules)
  - CSS var() fallback pattern ensures non-project cards retain accent glow unchanged
  - Status dot colors match badge background semantics (emerald/amber/gray)
  - Live badge uses sky-blue with animate-pulse dot, distinct from status badges
metrics:
  duration: 3min
  completed: 2026-02-13T21:07:00Z
  tasks: 2
  files: 3
---

# Phase 14 Plan 01: Card Visual Enhancements Summary

Category-tinted glassmorphism hover glow with styled tech pills, status dot badges, and Featured/Live supplementary badges on project cards.

## Performance

- **Build time:** ~1.9s (unchanged from baseline)
- **Zero errors:** Clean build with all 29 pages
- **No new dependencies:** Pure CSS custom properties + Tailwind utility classes

## Accomplishments

### VIS-01: Tech Badge Pills
- Enhanced tech pills with `bg-[var(--color-surface-alt)]` background tint at rest
- Added `tracking-wide` for improved letter spacing
- Increased horizontal padding to `px-2.5` for better visual weight
- Applied consistently across ProjectCard (both branches) and ProjectHero

### VIS-02: Status Badges with Dot Indicators
- Status badges now include colored dot indicators: emerald (active), amber (experimental), gray (archived)
- Featured badge with accent-colored dot on featured project cards
- Live badge with sky-blue pulsing dot on cards with liveUrl (only networking-tools)
- All badges use `inline-flex items-center gap-1` for dot alignment

### VIS-04: Category-Tinted Glassmorphism Glow
- Each project card sets `--category-glow` via inline style with category-specific rgba color
- AI/ML: violet (139, 92, 246, 0.3)
- Kubernetes: blue (59, 130, 246, 0.3)
- Platform: emerald (16, 185, 129, 0.3)
- Security: amber (245, 158, 11, 0.3)
- CSS `.card-hover:hover` uses `var(--category-glow, var(--color-accent-glow))` fallback
- Non-project cards (blog, contact) have no `--category-glow` set, so they fall through to existing accent glow

### Accessibility
- `prefers-reduced-motion: reduce` now disables `.animate-pulse` animation
- Existing reduced-motion rules for `.card-hover:hover` transform already in place

## Task Commits

| Task | Name | Commit | Key Changes |
|------|------|--------|-------------|
| 1 | Category glow CSS system | 37412aa | global.css: --category-glow fallback in .card-hover:hover, animate-pulse reduced-motion |
| 2 | Enhanced badges and glow | 25f4cc3 | ProjectCard.astro + ProjectHero.astro: categoryMeta, statusDotStyles, styled pills, badge system |

## Files Modified

| File | Changes |
|------|---------|
| `src/styles/global.css` | .card-hover:hover box-shadow uses var(--category-glow) fallback; .animate-pulse disabled in reduced-motion |
| `src/components/ProjectCard.astro` | categoryMeta + statusDotStyles mappings, inline --category-glow style, data-category attr, enhanced tech pills, Featured/status/Live badges with dots |
| `src/components/ProjectHero.astro` | categoryMeta + statusStyles + statusDotStyles mappings, inline --category-glow style, data-category attr, enhanced tech pills, Featured + status badges with dots |

## Decisions Made

1. **Inline style over data-attribute CSS:** Using `style="--category-glow: rgba(...)"` directly on elements rather than `[data-category="ai-ml"]` CSS rules. This eliminates per-category CSS rules and keeps the glow color definition co-located with the component logic.

2. **CSS var() fallback pattern:** `var(--category-glow, var(--color-accent-glow))` ensures cards without `--category-glow` set (blog, contact) naturally fall through to the existing accent glow. Zero changes needed to non-project card components.

3. **data-category attribute retained:** Added `data-category` as a semantic hook for potential future CSS targeting or JavaScript interaction, even though current glow system uses inline styles.

4. **Live badge distinct from status:** Sky-blue color with pulsing dot differentiates "Live" from status badges (emerald/amber/gray), making it immediately scannable.

## Deviations from Plan

None -- plan executed exactly as written.

## Issues Encountered

None.

## Verification Results

| Check | Result |
|-------|--------|
| `npx astro build` succeeds | PASS (29 pages, 1.84s) |
| AI/ML glow in built HTML | PASS (2 instances) |
| Kubernetes glow in built HTML | PASS (2 instances) |
| Platform glow in built HTML | PASS (1 instance) |
| Security glow in built HTML | PASS (1 instance) |
| Featured badge text present | PASS (3 instances) |
| Status dot spans (w-1.5 h-1.5) | PASS (8 instances) |
| Live badge with animate-pulse | PASS (1 instance) |
| Tech pills with bg-surface-alt | PASS (9 instances) |
| Blog page no category-glow | PASS (0 instances) |
| Contact page no category-glow | PASS (0 instances) |
| .card-hover:hover uses var(--category-glow) | PASS |
| Reduced-motion includes .animate-pulse | PASS |

## Next Phase Readiness

Plan 14-01 provides all visual badge and glow enhancements needed. Plan 14-02 (GSAP scroll animations and micro-interactions) can proceed -- it depends on the card structure established here and will add animation behavior on top of these visual styles.

## Self-Check: PASSED

- src/styles/global.css: FOUND
- src/components/ProjectCard.astro: FOUND
- git log --grep="14-01": 2 commits found (37412aa, 25f4cc3)
