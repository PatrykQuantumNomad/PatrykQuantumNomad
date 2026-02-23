---
phase: 47-seo-documentation-site-integration
plan: 01
subsystem: tools
tags: [k8s, rules, cis-benchmark, documentation-data]

# Dependency graph
requires:
  - phase: 42-security-rules
    provides: 20 security rules (KA-C001 through KA-C020)
  - phase: 43-reliability-best-practice-rules
    provides: 24 reliability + best practice rules
  - phase: 44-cross-resource-validation-rbac
    provides: 8 cross-resource rules + 5 RBAC rules + SCHEMA_RULE_METADATA
provides:
  - allDocumentedK8sRules with 67 rules (57 lint + 10 schema) for static page generation
  - getRelatedK8sRules function returning same-category rules sorted by severity
  - CIS_BENCHMARK_REFS mapping 21 security/RBAC rules to CIS Benchmark v1.8 sections
affects: [47-03 rule documentation pages, 47-05 blog post cross-links]

# Tech tracking
tech-stack:
  added: []
  patterns: [spread-merge registry pattern for heterogeneous rule types]

key-files:
  created:
    - src/lib/tools/k8s-analyzer/rules/related.ts
    - src/lib/tools/k8s-analyzer/cis-benchmark.ts
  modified:
    - src/lib/tools/k8s-analyzer/rules/index.ts

key-decisions:
  - "SCHEMA_RULE_METADATA spread into allDocumentedK8sRules (compatible DocumentedK8sRule shape)"
  - "21 CIS Benchmark mappings (omit KA-C009/C012/C018 -- no direct CIS section)"
  - "getRelatedK8sRules follows exact compose-validator/rules/related.ts pattern"

patterns-established:
  - "Spread-merge pattern: allDocumentedK8sRules combines lint rules (with check()) and schema metadata (without check()) into single DocumentedK8sRule array"
  - "Related rules pattern: same-category filter + severity sort + limit slice, reusable across tool analyzers"

requirements-completed: []

# Metrics
duration: 2min
completed: 2026-02-23
---

# Phase 47 Plan 01: Rule Data Foundation Summary

**Complete rule registry (67 rules), related-rules lookup, and CIS Benchmark v1.8 reference mapping for documentation page generation**

## Performance

- **Duration:** 2 min
- **Started:** 2026-02-23T23:48:25Z
- **Completed:** 2026-02-23T23:50:31Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- Expanded allDocumentedK8sRules from 57 lint-only to 67 total (57 lint + 10 schema) by importing SCHEMA_RULE_METADATA
- Created getRelatedK8sRules function returning up to 5 same-category rules sorted by severity (error > warning > info)
- Created CIS_BENCHMARK_REFS mapping 21 security and RBAC rule IDs to CIS Kubernetes Benchmark v1.8 sections and titles

## Task Commits

Each task was committed atomically:

1. **Task 1: Expand allDocumentedK8sRules with schema rules + create related rules function** - `94c7682` (feat)
2. **Task 2: Create CIS Benchmark reference mapping** - `6d3a873` (feat)

## Files Created/Modified
- `src/lib/tools/k8s-analyzer/rules/index.ts` - Added SCHEMA_RULE_METADATA import and merge into allDocumentedK8sRules (67 total)
- `src/lib/tools/k8s-analyzer/rules/related.ts` - New file: getRelatedK8sRules() with severity-sorted same-category lookup
- `src/lib/tools/k8s-analyzer/cis-benchmark.ts` - New file: CIS_BENCHMARK_REFS mapping 21 rule IDs to CIS v1.8 sections

## Decisions Made
- SCHEMA_RULE_METADATA values are structurally compatible with DocumentedK8sRule (same fields: id, title, severity, category, explanation, fix) -- no adapter needed
- 21 CIS Benchmark entries included; KA-C009, KA-C012, and KA-C018 omitted because they lack direct CIS section equivalents
- getRelatedK8sRules follows the exact same pattern as compose-validator's getRelatedComposeRules for consistency

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- allDocumentedK8sRules (67 rules) ready for Plan 03 dynamic rule documentation pages
- getRelatedK8sRules ready for "Related Rules" sections on each documentation page
- CIS_BENCHMARK_REFS ready for compliance reference display on security/RBAC rule pages
- Plan 02 (OG images, JSON-LD, SEO) can proceed in parallel

## Self-Check: PASSED

All files verified present. All commit hashes confirmed in git log.

---
*Phase: 47-seo-documentation-site-integration*
*Completed: 2026-02-23*
