---
phase: 15-filtering-animations-polish
plan: 02
subsystem: ui
tags: [css, gsap, animations, mouse-tracking, parallax, magnetic-buttons, accessibility]

# Dependency graph
requires:
  - phase: 15-filtering-animations-polish
    provides: "Filter system with inline script, REDUCED_MOTION constant, data-card-item/data-section-bg attributes"
  - phase: 14-visual-design-card-components
    provides: "--category-glow inline styles on cards, category slug system"
provides:
  - "Mouse-tracking radial gradient glow on project cards via CSS custom properties"
  - "Category-tinted floating parallax orbs behind 4 category sections"
  - "Magnetic hover pull on CTA buttons (Source, Live Site) via data-magnetic attribute"
  - "Full reduced-motion and touch device accessibility fallbacks"
affects: []

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "CSS custom properties (--mouse-x, --mouse-y) set via JS mousemove for GPU-composited effects"
    - "::after pseudo-element overlay pattern for card glow (z-index layering with content above)"
    - "data-magnetic attribute convention consumed by MagneticButton component"
    - "ORB_CONFIG dictionary keyed by data-section-bg slug for auto-discovery"

key-files:
  created: []
  modified:
    - "src/styles/global.css"
    - "src/pages/projects/index.astro"
    - "src/components/animations/FloatingOrbs.astro"
    - "src/components/ProjectCard.astro"

key-decisions:
  - "Added position: relative to .card-hover class (was missing, required for ::after glow overlay)"
  - "Glow uses var(--category-glow) with fallback to accent-glow, matching existing card hover system"
  - "Orb colors use raw rgba values (not CSS vars) to match category glow opacity tuning"

patterns-established:
  - "Mouse-tracking effect: JS sets CSS custom properties, CSS consumes via calc() in radial-gradient"
  - "Touch device guard: @media (pointer: coarse) in CSS + JS matchMedia check"

# Metrics
duration: 3min
completed: 2026-02-13
---

# Phase 15 Plan 02: Interactive Animations Summary

**Mouse-tracking gradient glow on cards, category-tinted parallax orbs, and magnetic CTA buttons with full a11y fallbacks**

## Performance

- **Duration:** 3 min
- **Started:** 2026-02-13T21:58:59Z
- **Completed:** 2026-02-13T22:02:08Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- Mouse cursor creates a category-tinted radial gradient glow that follows movement across card surfaces on desktop
- Floating parallax orbs appear behind all 4 category sections with scroll-linked opacity and movement (violet/AI, blue/K8s, emerald/Platform, amber/Security)
- CTA buttons (Source, Live Site) magnetically pull toward cursor on hover via existing MagneticButton component
- All effects disabled for reduced-motion users and touch devices

## Task Commits

Each task was committed atomically:

1. **Task 1: Add mouse-tracking gradient glow CSS and mousemove script** - `531bcfe` (feat)
2. **Task 2: Extend FloatingOrbs config and add data-magnetic to CTA buttons** - `1a122b2` (feat)

## Files Created/Modified
- `src/styles/global.css` - Mouse-tracking glow CSS via ::after pseudo-element, touch device safeguard, reduced-motion rule, position: relative on .card-hover
- `src/pages/projects/index.astro` - initCardGlow() mousemove handler setting --mouse-x/--mouse-y CSS vars
- `src/components/animations/FloatingOrbs.astro` - 4 new category-tinted orb configs (ai-ml, kubernetes, platform, security)
- `src/components/ProjectCard.astro` - data-magnetic attribute on Source and Live Site CTA links

## Decisions Made
- Added `position: relative` to `.card-hover` class -- was missing and required for the `::after` glow overlay to position correctly within card bounds
- Used raw `rgba()` values for orb colors instead of CSS variables to allow per-orb opacity tuning independent of the card glow system
- Glow inherits `var(--category-glow)` with accent-glow fallback, keeping non-project cards unchanged

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Added position: relative to .card-hover**
- **Found during:** Task 1 (mouse-tracking glow CSS)
- **Issue:** Plan stated `.card-hover` already provided `position: relative`, but it did not -- the `::after` pseudo-element with `position: absolute; inset: 0` would not be contained within the card
- **Fix:** Added `position: relative` to the `.card-hover` class definition
- **Files modified:** src/styles/global.css
- **Verification:** Build passes, glow overlay constrained to card bounds
- **Committed in:** 531bcfe (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Essential for correct glow positioning. No scope creep.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Phase 15 (Filtering, Animations & Polish) is now COMPLETE
- v1.2 Projects Page Redesign milestone is fully delivered
- All 16 projects display in bento grid with filtering, animations, and interactive effects
- All effects have accessibility fallbacks (reduced-motion, touch devices)

## Self-Check: PASSED

- FOUND: src/styles/global.css
- FOUND: src/pages/projects/index.astro
- FOUND: 2 commits matching "15-02" (531bcfe, 1a122b2)

---
*Phase: 15-filtering-animations-polish*
*Completed: 2026-02-13*
