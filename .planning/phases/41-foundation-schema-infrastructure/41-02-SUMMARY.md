---
phase: 41-foundation-schema-infrastructure
plan: 02
subsystem: k8s-analyzer
tags: [kubernetes, yaml, parser, gvk, diagnostics, multi-document, line-tracking]

# Dependency graph
requires:
  - phase: 41-01
    provides: K8s analyzer type system (ParsedDocument, K8sParseResult, K8sRuleViolation, SchemaRuleMetadata)
provides:
  - GVK registry mapping 19 apiVersion/kind combinations to resource types
  - 18 deprecated API version entries with migration guidance
  - Multi-document YAML parser with shared LineCounter for accurate line tracking
  - AST navigation (resolveInstancePath, getNodeLine) for ajv error line resolution
  - Schema rule metadata definitions for KA-S001 through KA-S010
  - Metadata validation helpers (name, label key, label value) following K8s validation.go
affects: [41-03, 41-04, 42, 43, 44, 45, 46, 47]

# Tech tracking
tech-stack:
  added: []
  patterns: [multi-document-yaml-parsing, shared-linecounter, gvk-registry-lookup, k8s-metadata-validation]

key-files:
  created:
    - src/lib/tools/k8s-analyzer/gvk-registry.ts
    - src/lib/tools/k8s-analyzer/parser.ts
    - src/lib/tools/k8s-analyzer/diagnostic-rules.ts
  modified: []

key-decisions:
  - "GVK registry uses flat array with find() for simplicity over Map -- 19 entries is small enough that linear scan is negligible"
  - "findNearMatch provides case-insensitive lookup for helpful error messages on typos"
  - "Parser uses unknown type for AST node walking to avoid complex yaml type gymnastics while maintaining safety"
  - "checkMetadata skips documents without apiVersion/kind to avoid duplicate diagnostics with upstream rules"

patterns-established:
  - "Multi-document parser: shared LineCounter across all documents for consistent line numbering relative to full input"
  - "AST navigation: resolveInstancePath + getNodeLine pattern for recovering line numbers from JSON Pointer paths"
  - "Metadata validation: RFC 1123 DNS subdomain for names, qualified name format for label keys, K8s spec for label values"

requirements-completed: [PARSE-01, PARSE-02, PARSE-03, PARSE-06, SCHEMA-03, SCHEMA-04, SCHEMA-05, SCHEMA-06, SCHEMA-08, SCHEMA-09, SCHEMA-10, SCHEMA-11, SCHEMA-12]

# Metrics
duration: 4min
completed: 2026-02-23
---

# Phase 41 Plan 02: GVK Registry, Parser, and Diagnostic Rules Summary

**GVK registry with 19 resource types, multi-document YAML parser with shared LineCounter, and KA-S001 through KA-S010 diagnostic rule metadata with K8s-spec metadata validation**

## Performance

- **Duration:** 4m 05s
- **Started:** 2026-02-23T16:33:23Z
- **Completed:** 2026-02-23T16:37:28Z
- **Tasks:** 2/2
- **Files modified:** 3 (gvk-registry.ts, parser.ts, diagnostic-rules.ts)

## Accomplishments
- Created GVK registry mapping all 19 supported K8s 1.31 apiVersion/kind combinations to resource type identifiers with lookup functions (getResourceType, isValidGvk, findNearMatch)
- Created deprecated API versions registry with 18 entries covering K8s 1.16-1.26 removals and migration guidance
- Built multi-document YAML parser using parseAllDocuments with shared LineCounter for accurate full-input line tracking
- Defined schema rule metadata for all 10 diagnostic rules (KA-S001 through KA-S010) with explanations and fix suggestions
- Implemented metadata validation following K8s validation.go patterns: RFC 1123 DNS subdomain for names, qualified name format for label keys

## Task Commits

Each task was committed atomically:

1. **Task 1: Create GVK registry and deprecated API versions** - `9a083af` (feat)
2. **Task 2: Create multi-document YAML parser and diagnostic rule metadata** - `9aa1d9a` (feat)

**Plan metadata:** [pending] (docs: complete plan)

## Files Created/Modified
- `src/lib/tools/k8s-analyzer/gvk-registry.ts` - GVK registry (19 entries), deprecated API versions (18 entries), lookup functions (getResourceType, isValidGvk, findNearMatch, getDeprecation)
- `src/lib/tools/k8s-analyzer/parser.ts` - Multi-document YAML parser (parseK8sYaml), AST navigation (resolveInstancePath, getNodeLine)
- `src/lib/tools/k8s-analyzer/diagnostic-rules.ts` - Schema rule metadata (KA-S001 through KA-S010), metadata validation (validateMetadataName, validateLabelKey, validateLabelValue, checkMetadata)

## Decisions Made
- **Flat array for GVK registry:** Used simple array with `.find()` rather than a Map, since 19 entries means linear scan is negligible and the code is more readable.
- **findNearMatch for error UX:** Added case-insensitive near-match lookup so the engine can suggest corrections when users type `apiversion` instead of `apiVersion`.
- **unknown type for AST walking:** Parser uses `unknown` for intermediate AST node references during path resolution, avoiding complex yaml library type gymnastics while maintaining runtime safety.
- **checkMetadata skips incomplete documents:** Documents missing apiVersion/kind are skipped in metadata validation to avoid duplicate diagnostics (those documents are already flagged by KA-S002/S003).

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- Pre-existing `@types/mdx` JSX namespace errors appear when running `tsc --noEmit` without `--skipLibCheck`. These are unrelated to our code and identical to what all other K8s analyzer modules produce. The project's Astro tsconfig handles this correctly at build time.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- GVK registry ready for engine.ts to identify resource types during validation
- Parser ready for engine.ts to parse multi-document YAML input
- resolveInstancePath/getNodeLine ready for schema-validator.ts to resolve ajv error line numbers
- Diagnostic rule metadata ready for engine.ts to emit pre-schema violations (KA-S001 through KA-S010)
- checkMetadata ready for engine.ts to validate metadata fields after GVK identification
- getDeprecation ready for engine.ts to produce KA-S006 warnings for deprecated API versions

## Self-Check: PASSED

- [x] src/lib/tools/k8s-analyzer/gvk-registry.ts - FOUND
- [x] src/lib/tools/k8s-analyzer/parser.ts - FOUND
- [x] src/lib/tools/k8s-analyzer/diagnostic-rules.ts - FOUND
- [x] GVK_REGISTRY: 19 entries - VERIFIED
- [x] DEPRECATED_API_VERSIONS: 18 entries - VERIFIED
- [x] SCHEMA_RULE_METADATA: KA-S001 through KA-S010 - ALL FOUND
- [x] Commit 9a083af (Task 1) - FOUND
- [x] Commit 9aa1d9a (Task 2) - FOUND

---
*Phase: 41-foundation-schema-infrastructure*
*Completed: 2026-02-23*
