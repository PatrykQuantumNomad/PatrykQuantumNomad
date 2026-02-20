---
phase: 25-content-rule-documentation
plan: 01
subsystem: ui
tags: [astro, seo, dockerfile, documentation, dynamic-routes, breadcrumbs]

# Dependency graph
requires:
  - phase: 23-rule-engine
    provides: "39 LintRule definitions with id, title, severity, category, explanation, fix (beforeCode/afterCode)"
provides:
  - "39 static rule documentation pages at /tools/dockerfile-analyzer/rules/{code}/"
  - "getRelatedRules(ruleId, limit) utility for same-category rule lookups"
  - "Dynamic [code].astro route template with Dockerfile syntax-highlighted code blocks"
affects: [25-content-rule-documentation, seo, dockerfile-analyzer]

# Tech tracking
tech-stack:
  added: []
  patterns: ["Astro dynamic route from TypeScript registry (non-content-collection)", "getRelatedRules same-category sort by severity priority"]

key-files:
  created:
    - "src/lib/tools/dockerfile-analyzer/rules/related.ts"
    - "src/pages/tools/dockerfile-analyzer/rules/[code].astro"
  modified: []

key-decisions:
  - "Used Astro Code component for syntax-highlighted before/after Dockerfile blocks"
  - "Related rules sorted by severity priority (error > warning > info) for relevance"
  - "Stripped trailing slash from Astro.site in BreadcrumbJsonLd to prevent double-slash URLs"

patterns-established:
  - "Dynamic route from non-collection TypeScript data: getStaticPaths maps allRules array directly"
  - "Severity color mapping pattern: Record<RuleSeverity, {bg, text}> for badge styling"

requirements-completed: [DOCS-01, DOCS-02]

# Metrics
duration: 5min
completed: 2026-02-20
---

# Phase 25 Plan 01: Rule Documentation Pages Summary

**39 SEO-optimized rule documentation pages via single Astro dynamic route with syntax-highlighted before/after code, severity badges, related rules interlinks, and breadcrumb JSON-LD**

## Performance

- **Duration:** 5 min
- **Started:** 2026-02-20T21:07:15Z
- **Completed:** 2026-02-20T21:12:46Z
- **Tasks:** 1
- **Files created:** 2

## Accomplishments
- 39 static rule documentation pages generated at build time from TypeScript rule registry
- Each page contains: rule explanation, severity/category badges, before/after Dockerfile code blocks with syntax highlighting, related rules section with interlinks, breadcrumb navigation + JSON-LD structured data
- Related rules utility returns same-category rules sorted by severity priority (error > warning > info)
- Back-links to Dockerfile Analyzer tool page and best practices blog post on every rule page
- All URLs lowercase (e.g., /tools/dockerfile-analyzer/rules/dl3006/)

## Task Commits

Each task was committed atomically:

1. **Task 1: Create related-rules utility and rule documentation dynamic route** - `cd6585e` (feat)

**Plan metadata:** [pending] (docs: complete plan)

## Files Created/Modified
- `src/lib/tools/dockerfile-analyzer/rules/related.ts` - getRelatedRules utility: finds same-category rules, sorts by severity priority, returns up to limit
- `src/pages/tools/dockerfile-analyzer/rules/[code].astro` - Dynamic route template generating 39 static pages with explanation, code blocks, related rules, breadcrumbs

## Decisions Made
- Used Astro's built-in `<Code>` component (from `astro:components`) for Dockerfile syntax highlighting in before/after blocks -- no extra dependency needed
- Related rules sorted by severity priority (error first, then warning, then info) to surface most important related rules
- Stripped trailing slash from `Astro.site` before constructing BreadcrumbJsonLd URLs to prevent double-slash artifacts (e.g., `https://site.dev//tools/`)
- Blog post back-link included as forward reference to `/blog/dockerfile-best-practices/` (blog post created in Plan 25-02)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed double-slash in BreadcrumbJsonLd URLs**
- **Found during:** Task 1 (verification step)
- **Issue:** `Astro.site` returns URL with trailing slash; concatenating with `/tools/` produced `https://patrykgolabek.dev//tools/`
- **Fix:** Strip trailing slash from siteBase: `(Astro.site?.toString() ?? '...').replace(/\/$/, '')`
- **Files modified:** src/pages/tools/dockerfile-analyzer/rules/[code].astro
- **Verification:** Rebuilt and confirmed all BreadcrumbJsonLd URLs have no double slashes
- **Committed in:** cd6585e (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Necessary for correct JSON-LD structured data URLs. No scope creep.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- 39 rule documentation pages ready for indexing
- Plan 25-02 (companion blog post) already complete -- cross-links between blog and rule pages will be fully functional
- Ready for Phase 26 (SEO & Performance Optimization)

## Self-Check: PASSED

- FOUND: src/lib/tools/dockerfile-analyzer/rules/related.ts
- FOUND: src/pages/tools/dockerfile-analyzer/rules/[code].astro
- FOUND: .planning/phases/25-content-rule-documentation/25-01-SUMMARY.md
- FOUND: commit cd6585e

---
*Phase: 25-content-rule-documentation*
*Completed: 2026-02-20*
