---
phase: 41-foundation-schema-infrastructure
plan: 03
subsystem: k8s-analyzer
tags: [kubernetes, resource-registry, schema-validation, ajv, multi-index, cross-resource]

# Dependency graph
requires:
  - phase: 41-01
    provides: K8s analyzer types (ParsedDocument, ParsedResource, ResourceRegistry interface, K8sRuleViolation), pre-compiled ajv validators (validate-k8s.js)
  - phase: 41-02
    provides: parser.ts with resolveInstancePath and getNodeLine for AST line resolution
provides:
  - ResourceRegistry class with multi-index lookups (byKind, byName, byNamespace, byLabels) and buildFromDocuments factory
  - Async schema validator with dynamic import of compiled validators and ajv error to K8sRuleViolation mapping
affects: [41-04, 42, 43, 44, 45, 46, 47]

# Tech tracking
tech-stack:
  added: []
  patterns: [resource-registry-multi-index, async-schema-validation, dynamic-validator-import, ajv-error-humanization]

key-files:
  created:
    - src/lib/tools/k8s-analyzer/resource-registry.ts
    - src/lib/tools/k8s-analyzer/schema-validator.ts
  modified: []

key-decisions:
  - "ResourceRegistry class implements the interface from types.ts rather than replacing it, maintaining forward-reference compatibility"
  - "Validators cached at module level for single-load performance -- dynamic import only triggers once"
  - "humanizeAjvError includes field path prefix (e.g., 'spec.template.spec.containers[0]') for context in error messages"
  - "Deduplication by instancePath + keyword + message to suppress oneOf/anyOf branch noise"

patterns-established:
  - "ResourceRegistry.buildFromDocuments factory: converts ParsedDocuments to ParsedResources with namespace defaulting and annotation extraction"
  - "Async schema validator pattern: loadValidators() -> validate(json) -> map errors to violations with AST line resolution"
  - "K8s ajv error humanization with field path context prefix"

requirements-completed: [PARSE-04, PARSE-05, SCHEMA-07]

# Metrics
duration: 4min
completed: 2026-02-23
---

# Phase 41 Plan 03: Resource Registry and Schema Validator Summary

**Multi-index ResourceRegistry with 4 lookup patterns for cross-resource validation, and async schema validator mapping ajv errors to field-level K8s violations with AST-resolved line numbers**

## Performance

- **Duration:** 4m 14s
- **Started:** 2026-02-23T16:34:20Z
- **Completed:** 2026-02-23T16:38:34Z
- **Tasks:** 2/2
- **Files modified:** 2

## Accomplishments
- Created ResourceRegistry class with four indexes (byKind, byName, byNamespace, all) and six query methods including label selector matching for Phase 44 cross-resource validation
- Built async schema validator that dynamically imports pre-compiled validators from validate-k8s.js with module-level caching
- Implemented comprehensive ajv error humanization covering 13 keyword types with field path context (e.g., "'spec.template.spec.containers[0]': Missing required property 'image'.")
- Both files compile cleanly with project tsconfig

## Task Commits

Each task was committed atomically:

1. **Task 1: Create ResourceRegistry class with multi-index lookups** - `c07ce1a` (feat)
2. **Task 2: Create async schema validator with ajv error mapping** - `053a590` (feat)

**Plan metadata:** [pending] (docs: complete plan)

## Files Created/Modified
- `src/lib/tools/k8s-analyzer/resource-registry.ts` - ResourceRegistry class implementing the types.ts interface with 4 indexes, 7 query methods, getSummary, and static buildFromDocuments factory
- `src/lib/tools/k8s-analyzer/schema-validator.ts` - Async validateResource function with dynamic import of compiled validators, ajv error deduplication, AST line resolution, and human-readable error messages

## Decisions Made
- **Interface implementation over replacement:** ResourceRegistry class implements the `ResourceRegistry` interface from types.ts (named as `IResourceRegistry` locally) rather than removing the interface, preserving the forward-reference pattern for K8sRuleContext typing
- **Module-level validator cache:** Validators are cached after first `loadValidators()` call, so the 980KB dynamic import only happens once per session
- **Field path in error messages:** humanizeAjvError includes the JSON Pointer path converted to dot notation (e.g., `spec.template.spec.containers[0]`) as a prefix, providing context that raw ajv messages lack
- **Inline ErrorObject/ValidateFunction types:** Defined minimal type shapes inline rather than importing from ajv, avoiding a runtime dependency on the full ajv package

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- Bare `tsc --noEmit` without `--target` or `--module` flags shows false errors (Map iteration needs ES2015+, dynamic import needs ESM module). The project's tsconfig.json sets these correctly. All verification used project tsconfig for accurate results.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- ResourceRegistry is ready for Phase 44 cross-resource validation (selector matching, service-deployment binding, etc.)
- Schema validator is ready for engine.ts (41-04) to call validateResource() for each parsed document
- Both modules depend on parser.ts (created by 41-02) which exports resolveInstancePath and getNodeLine

## Self-Check: PASSED

- [x] src/lib/tools/k8s-analyzer/resource-registry.ts - FOUND
- [x] src/lib/tools/k8s-analyzer/schema-validator.ts - FOUND
- [x] Commit c07ce1a (Task 1) - FOUND
- [x] Commit 053a590 (Task 2) - FOUND

---
*Phase: 41-foundation-schema-infrastructure*
*Completed: 2026-02-23*
