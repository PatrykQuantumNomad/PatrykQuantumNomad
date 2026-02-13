---
phase: quick-006
plan: 01
subsystem: seo
tags: [seo, cross-linking, structured-data, json-ld, llms-txt, github-pages]

# Dependency graph
requires:
  - phase: quick-005
    provides: SEO audit findings and baseline structured data
provides:
  - Optional liveUrl field on Project interface for multi-URL project cards
  - Dual-link card rendering pattern (Source + Live Site) in projects page
  - Enriched PersonJsonLd with security expertise keywords
  - Featured Projects section in llms.txt
  - Conditional liveUrl output in llms-full.txt
affects: [projects-page, seo, structured-data, llm-content]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Conditional card rendering: div with dual links vs single anchor based on liveUrl"
    - "Optional liveUrl field enables progressive enhancement of project cards"

key-files:
  created: []
  modified:
    - src/data/projects.ts
    - src/pages/projects/index.astro
    - src/components/PersonJsonLd.astro
    - src/pages/llms.txt.ts
    - src/pages/llms-full.txt.ts

key-decisions:
  - "Used conditional rendering (div vs a) to preserve existing card behavior for projects without liveUrl"
  - "Added Penetration Testing and Network Security to knowsAbout for security domain authority"
  - "Added networking-tools GitHub Pages URL to sameAs for cross-site SEO signal"

patterns-established:
  - "Dual-link card pattern: projects with liveUrl get Source + Live Site pill buttons"
  - "liveUrl field convention: optional field for projects with hosted documentation sites"

# Metrics
duration: 3min
completed: 2026-02-13
---

# Quick 006: SEO Cross-Linking for networking-tools Summary

**Bidirectional SEO cross-linking between patrykgolabek.dev and networking-tools GitHub Pages via dual-link cards, enriched JSON-LD, and LLM content updates**

## Performance

- **Duration:** 3 min
- **Started:** 2026-02-13T13:46:12Z
- **Completed:** 2026-02-13T13:49:00Z
- **Tasks:** 3
- **Files modified:** 5

## Accomplishments
- Added optional `liveUrl` field to Project interface with networking-tools GitHub Pages URL
- Project cards with `liveUrl` now render dual "Source" and "Live Site" pill-style links
- PersonJsonLd enriched with "Penetration Testing" and "Network Security" in knowsAbout, plus networking-tools URL in sameAs
- llms.txt now has a Featured Projects section with networking-tools between Pages and Blog Posts
- llms-full.txt conditionally outputs Live URL for projects that have liveUrl set

## Task Commits

Each task was committed atomically:

1. **Task 1: Add liveUrl to Project interface and update networking-tools entry** - `66ed2ec` (feat)
2. **Task 2: Update project card rendering to show dual links when liveUrl exists** - `8488cd8` (feat)
3. **Task 3: Update structured data and LLM content files** - `2b33c18` (feat)

## Files Created/Modified
- `src/data/projects.ts` - Added optional liveUrl field to Project interface; updated networking-tools with liveUrl and expanded description
- `src/pages/projects/index.astro` - Conditional dual-link card rendering for projects with liveUrl
- `src/components/PersonJsonLd.astro` - Added security expertise keywords to knowsAbout and networking-tools URL to sameAs
- `src/pages/llms.txt.ts` - Added Featured Projects section with networking-tools live and source URLs
- `src/pages/llms-full.txt.ts` - Added conditional liveUrl output in projects loop

## Decisions Made
- Used conditional rendering (div with footer links vs single anchor tag) to keep existing card behavior intact for projects without liveUrl
- Added "Penetration Testing" and "Network Security" as knowsAbout entries to establish security domain authority in structured data
- Placed Featured Projects section in llms.txt between Pages and Blog Posts for logical content flow

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- liveUrl pattern is reusable for any future project with a hosted documentation site
- No blockers

## Self-Check: PASSED

All 5 modified files verified present. All 3 task commits verified in git log.

---
*Phase: quick-006*
*Completed: 2026-02-13*
