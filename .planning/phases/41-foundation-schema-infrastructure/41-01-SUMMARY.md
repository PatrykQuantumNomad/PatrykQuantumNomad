---
phase: 41-foundation-schema-infrastructure
plan: 01
subsystem: k8s-analyzer
tags: [kubernetes, json-schema, ajv, standalone, typescript, validation]

# Dependency graph
requires:
  - phase: 33-40 (compose-validator)
    provides: ajv standalone compilation pattern, compose-validator types.ts pattern
provides:
  - K8s analyzer TypeScript type system (16 interfaces + ResourceRegistry)
  - Pre-compiled ajv standalone validator module for 19 K8s resource types
  - Schema compilation build script (reproducible)
  - Downloaded K8s v1.31.0-local JSON schemas (pinned)
affects: [41-02, 41-03, 41-04, 42, 43, 44, 45, 46, 47]

# Tech tracking
tech-stack:
  added: []
  patterns: [ajv-standalone-multi-schema, k8s-schema-stripping, format-field-removal]

key-files:
  created:
    - src/lib/tools/k8s-analyzer/types.ts
    - scripts/compile-k8s-schemas.mjs
    - src/lib/tools/k8s-analyzer/validate-k8s.js
    - scripts/schemas/_definitions.json
    - scripts/schemas/*.json (19 resource schemas)
  modified: []

key-decisions:
  - "Strip format fields from K8s schemas to avoid ajv-formats require() calls -- K8s format keywords (int32, int64, double, byte, date-time) are type hints not validation constraints"
  - "Commit downloaded schema source files for reproducibility (pinned to K8s v1.31.0)"
  - "ResourceRegistry defined as interface in types.ts for forward reference typing"
  - "19 resource types compiled (not 18) -- ClusterRoleBinding included as separate type"

patterns-established:
  - "K8s schema size optimization: strip description + format + x-kubernetes-* + status before ajv compilation"
  - "Multi-schema ajv standalone: all resource types in one module with named exports for shared definition deduplication"
  - "K8s types follow compose-validator naming convention with K8s prefix"

requirements-completed: [SCHEMA-01, SCHEMA-02]

# Metrics
duration: 6min
completed: 2026-02-23
---

# Phase 41 Plan 01: Types and Schema Compilation Summary

**K8s analyzer type system with 16 interfaces and pre-compiled ajv standalone validators for 19 resource types at 76KB gzipped**

## Performance

- **Duration:** 5m 52s
- **Started:** 2026-02-23T16:23:21Z
- **Completed:** 2026-02-23T16:29:13Z
- **Tasks:** 2/2
- **Files modified:** 22 (1 types.ts + 1 build script + 20 schema files + 1 compiled output)

## Accomplishments
- Defined complete K8s analyzer type system: 16 types/interfaces covering severity, categories, violations, scoring, parsing, and engine results
- Built schema compilation pipeline that downloads K8s v1.31.0-local schemas, strips non-validation fields, and compiles via ajv standalone
- Achieved 76.1KB gzipped bundle (62% under the 200KB limit) for 19 resource type validators in a single ESM module
- Zero require() calls in compiled output -- pure ESM, CSP-safe

## Task Commits

Each task was committed atomically:

1. **Task 1: Create K8s analyzer type system** - `81affcc` (feat)
2. **Task 2: Create schema compilation build script and compile K8s validators** - `c3921c6` (feat)

**Plan metadata:** [pending] (docs: complete plan)

## Files Created/Modified
- `src/lib/tools/k8s-analyzer/types.ts` - All TypeScript interfaces for K8s analyzer engine (K8sSeverity, K8sCategory, K8sRuleViolation, K8sLintRule, K8sLintViolation, K8sScoreResult, K8sAnalysisResult, ParsedDocument, K8sParseResult, ParsedResource, K8sEngineResult, SchemaRuleMetadata, ResourceRegistry, etc.)
- `scripts/compile-k8s-schemas.mjs` - Build script: downloads K8s v1.31.0-local schemas, strips description/format/status/x-kubernetes-* fields, compiles via ajv standalone, validates gzipped size under 200KB
- `src/lib/tools/k8s-analyzer/validate-k8s.js` - Auto-generated pre-compiled ajv standalone module with 19 named validator exports (configmap, secret, service, deployment, pod, etc.)
- `scripts/schemas/_definitions.json` - Shared K8s schema definitions (referenced by $ref)
- `scripts/schemas/*.json` - 19 K8s v1.31.0-local resource type schemas (pinned for reproducibility)

## Decisions Made
- **Strip format fields:** K8s schemas use `format` keywords (int32, int64, double, byte, date-time) as Go/JSON type hints, not validation constraints. Stripping them avoids `require("ajv-formats/dist/formats")` in standalone output and reduces bundle size.
- **No addFormats:** Since all format fields are stripped, ajv-formats is not needed at compilation time, eliminating a runtime dependency.
- **Commit source schemas:** Downloaded schemas are committed (not gitignored) because they're pinned to v1.31.0 and provide reproducibility without network access.
- **19 resource types:** The plan mentioned 18 but the GVK registry has 19 entries (ClusterRoleBinding is the 19th). All 19 are included.
- **ResourceRegistry as interface:** Defined as a TypeScript interface in types.ts for forward-reference typing by K8sRuleContext. The concrete class implementation will be in resource-registry.ts (plan 02).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Fixed ajv-formats require() calls in standalone output**
- **Found during:** Task 2 (Schema compilation)
- **Issue:** ajv standalone output contained `require("ajv-formats/dist/formats")` calls (4 occurrences) because K8s schemas use `format` keywords. This breaks ESM and browser environments.
- **Fix:** Added `format` field stripping to the `stripForSize()` function and removed `addFormats(ajv)` call. K8s format keywords (int32, int64, double, byte, date-time) are type hints for Go code generation, not validation constraints.
- **Files modified:** scripts/compile-k8s-schemas.mjs
- **Verification:** Compiled output has zero require() calls, all 19 validators load and validate correctly
- **Committed in:** c3921c6 (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Auto-fix was necessary for pure ESM output. Format stripping is the correct approach -- these format keywords have no validation semantics in a browser context.

## Issues Encountered
- Pre-existing `@types/mdx` JSX namespace errors appear when running `tsc --noEmit` without `--skipLibCheck`. These are unrelated to our code and identical to what compose-validator types.ts produces. The project's Astro tsconfig handles this correctly at build time.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Type system is ready for all downstream modules (parser, engine, rules, scorer)
- Compiled validators are ready for schema-validator.ts to import dynamically
- K8sRuleContext interface defines the multi-resource context shape for all lint rules
- Bundle size (76KB gzipped) leaves ample room for application code in the total bundle

## Self-Check: PASSED

- [x] src/lib/tools/k8s-analyzer/types.ts - FOUND
- [x] scripts/compile-k8s-schemas.mjs - FOUND
- [x] src/lib/tools/k8s-analyzer/validate-k8s.js - FOUND
- [x] scripts/schemas/_definitions.json - FOUND
- [x] Commit 81affcc (Task 1) - FOUND
- [x] Commit c3921c6 (Task 2) - FOUND

---
*Phase: 41-foundation-schema-infrastructure*
*Completed: 2026-02-23*
