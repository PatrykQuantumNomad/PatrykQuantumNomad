---
phase: 110-site-integration
plan: 01
subsystem: ui
tags: [astro, navigation, sitemap, homepage, svg]

requires:
  - phase: 104-static-landing-page-force-layout
    provides: "/ai-landscape/ landing page exists to link to"
  - phase: 102-data-foundation
    provides: "graph.json cluster darkColors for card SVG"
provides:
  - "AI Landscape link in site header navigation (desktop + mobile)"
  - "Sitemap serialize rule for /ai-landscape/ pages (priority 0.5, monthly)"
  - "AI Landscape Explorer card in homepage Reference Guides grid"
affects: [110-02, 110-03, 110-04]

tech-stack:
  added: []
  patterns: ["Inline SVG generation in Astro frontmatter for card hero visuals"]

key-files:
  modified:
    - src/components/Header.astro
    - astro.config.mjs
    - src/pages/index.astro

key-decisions:
  - "AI Landscape nav link placed after Blog and before Beauty Index for alphabetical consistency among content sections"
  - "Sitemap rule extended in existing beauty-index/db-compass/eda condition rather than adding separate else-if block"
  - "Homepage card uses inline SVG node-graph motif with 8 circles and 10 edges using cluster darkColors at 70% opacity"
  - "Card placed as 6th (last) entry in Reference Guides grid for balanced 3+3 layout on desktop"

patterns-established:
  - "Inline SVG card hero: generate SVG string in frontmatter IIFE, render with set:html directive"

requirements-completed: [SITE-02, SITE-03, SITE-04]

duration: 4min
completed: 2026-03-27
---

# Plan 110-01: Site Navigation, Sitemap, and Homepage Card Summary

**AI Landscape nav link in header, sitemap priority rule for ~64 pages, and homepage card with inline SVG node-graph motif**

## Performance

- **Duration:** 4 min
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- Header navigation now includes "AI Landscape" link (11 nav items total) serving both desktop and mobile
- Sitemap serialize function includes `/ai-landscape/` in the monthly/0.5 priority rule alongside beauty-index, db-compass, and eda
- Homepage Reference Guides grid expanded to 6 cards (3+3 on desktop) with AI Landscape Explorer as the final card

## Task Commits

Each task was committed atomically:

1. **Task 1: Add AI Landscape to header navigation and sitemap** - `f98161d` (feat)
2. **Task 2: Add AI Landscape card to homepage Reference Guides grid** - `19b5cbe` (feat)

## Files Modified
- `src/components/Header.astro` - Added AI Landscape entry to navLinks array (position 3, after Blog)
- `astro.config.mjs` - Extended sitemap serialize condition to include /ai-landscape/ URLs
- `src/pages/index.astro` - Added aiLandscapeCardSvg inline generation and card HTML to Reference Guides grid

## Decisions Made
- Nav link placed after Blog, before Beauty Index for alphabetical ordering among content sections
- Reused existing sitemap priority rule (beauty-index/db-compass/eda) rather than creating separate block since values are identical
- SVG uses 8 nodes with 10 connecting edges, colors from graph.json cluster darkColors (AI, ML, GenAI, Agentic, DL, NN, accent, Agent Frameworks)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Header, sitemap, and homepage integration complete
- Ready for 110-02 (OG image endpoint), 110-03 (LLMs.txt), and 110-04 (companion blog post)

---
*Phase: 110-site-integration, Plan: 01*
*Completed: 2026-03-27*
