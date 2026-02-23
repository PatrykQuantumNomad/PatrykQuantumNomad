---
phase: 38-rule-documentation-pages
plan: 01
subsystem: ui, seo
tags: [astro, static-pages, compose-validator, seo, breadcrumb-jsonld, yaml]

# Dependency graph
requires:
  - phase: 34-compose-validation-engine
    provides: 44 custom lint rules and 8 schema rule metadata
  - phase: 36-compose-results-ui
    provides: ComposeViolationList component with rule ID display
provides:
  - 52 static rule documentation pages at /tools/compose-validator/rules/{code}/
  - allDocumentedRules combined registry (44 custom + 8 schema)
  - getRelatedComposeRules utility for same-category lookups
  - Clickable rule ID links in violation list to documentation pages
affects: [phase-39-compose-rules-index, phase-40-compose-blog-post]

# Tech tracking
tech-stack:
  added: []
  patterns: [compose-rule-documentation-pages, combined-rule-registry]

key-files:
  created:
    - src/lib/tools/compose-validator/rules/related.ts
    - src/pages/tools/compose-validator/rules/[code].astro
  modified:
    - src/lib/tools/compose-validator/rules/index.ts
    - src/components/tools/compose-results/ComposeViolationList.tsx

key-decisions:
  - "DocumentedRule interface unifies ComposeLintRule and SchemaRuleMetadata for page generation without requiring check() method"
  - "allDocumentedRules merges both rule arrays via cast to DocumentedRule[] for 52-rule static path generation"
  - "Rule IDs in violation list use stopPropagation onClick to prevent details/summary toggle when clicking link"

patterns-established:
  - "Compose rule pages mirror Dockerfile Analyzer pattern: [code].astro with getStaticPaths from allDocumentedRules"
  - "Related rules utility follows same-category + severity-sorted pattern from Dockerfile Analyzer"

requirements-completed: [DOC-01, DOC-02, DOC-03, DOC-04]

# Metrics
duration: 3min
completed: 2026-02-22
---

# Phase 38 Plan 01: Rule Documentation Pages Summary

**52 per-rule SEO documentation pages for Docker Compose Validator with expert explanations, YAML before/after code, related rules, BreadcrumbJsonLd, and clickable rule ID links from violation list**

## Performance

- **Duration:** 3 min
- **Started:** 2026-02-23T00:42:22Z
- **Completed:** 2026-02-23T00:46:17Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- Created combined allDocumentedRules registry merging 44 custom + 8 schema rules (52 total) with DocumentedRule interface
- Generated 52 static HTML pages at /tools/compose-validator/rules/{code}/ with title, severity/category badges, explanation, fix description, YAML before/after code blocks, related rules, and BreadcrumbJsonLd structured data
- Each page has unique SEO meta description derived from truncated rule explanation (155 chars)
- Wired rule IDs in ComposeViolationList as clickable anchor links to their documentation pages

## Task Commits

Each task was committed atomically:

1. **Task 1: Create combined rule registry and related-rules utility** - `b0be556` (feat)
2. **Task 2: Create rule documentation pages and wire violation list links** - `ec305f0` (feat)

## Files Created/Modified
- `src/lib/tools/compose-validator/rules/index.ts` - Added DocumentedRule interface, allDocumentedRules array (52 rules), imported schemaRules
- `src/lib/tools/compose-validator/rules/related.ts` - Created getRelatedComposeRules utility for same-category rule lookups sorted by severity
- `src/pages/tools/compose-validator/rules/[code].astro` - Dynamic route generating 52 static rule documentation pages with full layout
- `src/components/tools/compose-results/ComposeViolationList.tsx` - Changed rule ID from plain span to anchor link with stopPropagation

## Decisions Made
- DocumentedRule interface unifies ComposeLintRule and SchemaRuleMetadata for page generation without requiring check() method
- allDocumentedRules merges both rule arrays via cast to DocumentedRule[] for 52-rule static path generation
- Rule IDs in violation list use stopPropagation onClick to prevent details/summary toggle when clicking link
- Omitted right-side footer link (blog post) since compose blog post is Phase 40

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- 52 rule documentation pages live and indexed in sitemap
- Related rules interlinks create internal link graph for SEO
- Ready for rules index page (Phase 39) and blog post (Phase 40)
- ComposeViolationList links point to documentation pages

## Self-Check: PASSED

All 4 files verified present. Both task commits (b0be556, ec305f0) verified in git log. 52 rule directories confirmed in dist/tools/compose-validator/rules/.

---
*Phase: 38-rule-documentation-pages*
*Completed: 2026-02-22*
