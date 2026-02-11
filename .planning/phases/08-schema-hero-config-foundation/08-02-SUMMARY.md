---
phase: 08-schema-hero-config-foundation
plan: 02
subsystem: ui
tags: [astro, seo, json-ld, hero, siteConfig, define-vars, meta-tags]

requires:
  - phase: 08-01
    provides: Centralized siteConfig export (name, jobTitle, description, tagline, roles, url)
provides:
  - Home page title, description, hero h1, tagline, and typing roles all sourced from siteConfig
  - PersonJsonLd name, url, jobTitle, description all sourced from siteConfig
  - Single-source propagation: changing site.ts updates 6+ locations automatically
affects: [11, 12]

tech-stack:
  added: []
  patterns: ["define:vars for passing Astro server data to inline scripts", "Computed page metadata from centralized config"]

key-files:
  created: []
  modified:
    - src/pages/index.astro
    - src/components/PersonJsonLd.astro

key-decisions:
  - "Used spread operator [...siteConfig.roles] in define:vars to convert readonly tuple to mutable array for JSON serialization"
  - "Computed pageTitle and pageDescription in frontmatter rather than inline to keep template clean"

patterns-established:
  - "Config consumption pattern: Import siteConfig, compute derived values in frontmatter, use in template"
  - "define:vars pattern: Spread readonly arrays when passing to inline scripts via define:vars"

duration: 3min
completed: 2026-02-11
---

# Phase 8 Plan 2: Wire Home Page and PersonJsonLd to siteConfig Summary

**Home page and JSON-LD Person entity wired to centralized siteConfig -- title, description, hero, and structured data now propagate from a single source**

## Performance

- **Duration:** 3min
- **Started:** 2026-02-11T22:45:44Z
- **Completed:** 2026-02-11T22:49:31Z
- **Tasks:** 2/2
- **Files modified:** 2

## Accomplishments

- Wired `index.astro` to import and use `siteConfig` for all hero identity data (name, tagline, roles, title, description)
- Replaced inline roles array in typing script with `define:vars` binding from `siteConfig.roles`
- Wired `PersonJsonLd.astro` to source name, url, jobTitle, and description from `siteConfig`
- JSON-LD output is byte-identical to v1.0 baseline
- Verified `astro build` passes with zero errors and all 10 pages build successfully

## Task Commits

1. **Task 1: Wire index.astro to consume siteConfig** - `1d019d0` (feat)
2. **Task 2: Wire PersonJsonLd.astro to consume siteConfig** - `a5504d4` (feat)

## Files Created/Modified

- `src/pages/index.astro` - Imports siteConfig; computes pageTitle and pageDescription from config; hero h1, typing default role, and tagline all reference siteConfig; typing script uses define:vars with spread roles array
- `src/components/PersonJsonLd.astro` - Imports siteConfig; name, url, jobTitle, description in Person schema sourced from config instead of hardcoded strings

## Decisions Made

- Used `[...siteConfig.roles]` spread in `define:vars` to convert the `as const` readonly tuple to a plain mutable array, avoiding potential JSON serialization issues with readonly types
- Computed `pageTitle` and `pageDescription` as frontmatter variables for clean separation of logic and template

## Deviations from Plan

None - plan executed exactly as written.

Note: The meta description changed slightly from v1.0 ("17+ years in") to match the siteConfig value ("17+ years of experience in"). This is expected behavior -- siteConfig was established in 08-01 to match the JSON-LD, which already used the longer phrasing. The meta description now consistently matches the JSON-LD description.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

Phase 8 is now complete. The foundation is in place:
- All hero identity data flows from `src/data/site.ts` through to title tag, meta description, JSON-LD, h1, tagline, and typing animation
- Phase 11 can now update hero messaging by editing only `site.ts` -- changes will automatically propagate to all 6+ locations
- Phase 9 can proceed with external blog integration (schema was extended in 08-01)
- Phase 12 can verify consistency across all outputs

## Self-Check: PASSED

All files verified present. All commit hashes verified in git log.

---
*Phase: 08-schema-hero-config-foundation*
*Completed: 2026-02-11*
