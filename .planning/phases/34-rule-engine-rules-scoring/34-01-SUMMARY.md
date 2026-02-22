---
phase: 34-rule-engine-rules-scoring
plan: 01
subsystem: tools
tags: [docker-compose, semantic-rules, port-parser, graph-builder, cycle-detection, yaml-ast, compose-validator]

# Dependency graph
requires:
  - phase: 33-yaml-parsing-schema-validation-foundation
    provides: YAML parser with AST helpers (parseComposeYaml, getNodeLine, extractTopLevelMap), types.ts with ComposeLintRule/ComposeRuleContext/ComposeRuleViolation
provides:
  - Port string parser with ParsedPort interface, parsePortString, parseLongSyntaxPort, expandPortRange, portsConflict
  - Dependency graph builder with Kahn's cycle detection (buildDependencyGraph, detectCycles, extractDependsOn)
  - 15 semantic analysis rules (CV-M001 through CV-M015) implementing ComposeLintRule with check() methods
  - Semantic rules registry (semanticRules array with 15 entries)
affects: [34-02, 34-03, 35, 36, 38]

# Tech tracking
tech-stack:
  added: []
  patterns: [Port range overlap detection via numeric range intersection, Kahn's algorithm for topological sort with cycle participant identification, Cross-service AST analysis for resource reference validation, findTopLevelKeyNode helper for orphan definition line reporting]

key-files:
  created:
    - src/lib/tools/compose-validator/port-parser.ts
    - src/lib/tools/compose-validator/graph-builder.ts
    - src/lib/tools/compose-validator/rules/semantic/CV-M001-duplicate-ports.ts
    - src/lib/tools/compose-validator/rules/semantic/CV-M002-circular-depends-on.ts
    - src/lib/tools/compose-validator/rules/semantic/CV-M003-undefined-network.ts
    - src/lib/tools/compose-validator/rules/semantic/CV-M004-undefined-volume.ts
    - src/lib/tools/compose-validator/rules/semantic/CV-M005-undefined-secret.ts
    - src/lib/tools/compose-validator/rules/semantic/CV-M006-undefined-config.ts
    - src/lib/tools/compose-validator/rules/semantic/CV-M007-orphan-network.ts
    - src/lib/tools/compose-validator/rules/semantic/CV-M008-orphan-volume.ts
    - src/lib/tools/compose-validator/rules/semantic/CV-M009-orphan-secret.ts
    - src/lib/tools/compose-validator/rules/semantic/CV-M010-depends-on-healthy-no-healthcheck.ts
    - src/lib/tools/compose-validator/rules/semantic/CV-M011-self-referencing-dependency.ts
    - src/lib/tools/compose-validator/rules/semantic/CV-M012-undefined-service-dependency.ts
    - src/lib/tools/compose-validator/rules/semantic/CV-M013-duplicate-container-names.ts
    - src/lib/tools/compose-validator/rules/semantic/CV-M014-port-range-overlap.ts
    - src/lib/tools/compose-validator/rules/semantic/CV-M015-invalid-image-reference.ts
    - src/lib/tools/compose-validator/rules/semantic/index.ts
  modified: []

key-decisions:
  - "Port conflict detection uses numeric range intersection (Math.max(aStart,bStart) <= Math.min(aEnd,bEnd)) instead of set expansion for efficiency"
  - "CV-M001 handles single-port duplicates while CV-M014 handles range overlaps to avoid duplicate violations"
  - "Bind mount detection uses prefix check (., /, ~, $) to avoid false positives on named volume references"
  - "extractDependsOn helper centralized in graph-builder.ts for reuse across CV-M002, CV-M010, CV-M011, CV-M012"
  - "Orphan rules (CV-M007/M008/M009) traverse doc.contents directly to find top-level key nodes for line reporting"

patterns-established:
  - "Semantic rule file pattern: single const export (CVM001-CVM015) implementing ComposeLintRule with check(ctx) returning ComposeRuleViolation[]"
  - "Cross-service analysis: collect data from all services first, then compare across services (used by port conflict and container name rules)"
  - "findTopLevelKeyNode helper for locating AST nodes in top-level sections (networks, volumes, secrets) for orphan violation line reporting"
  - "Shared utility pattern: port-parser.ts and graph-builder.ts as importable modules used by multiple rules"

requirements-completed: [SEM-01, SEM-02, SEM-03, SEM-04, SEM-05, SEM-06, SEM-07, SEM-08, SEM-09, SEM-10, SEM-11, SEM-12, SEM-13, SEM-14, SEM-15]

# Metrics
duration: 5min
completed: 2026-02-22
---

# Phase 34 Plan 01: Semantic Rules & Shared Utilities Summary

**Port parser handling 6+ Docker Compose port formats, dependency graph builder with Kahn's cycle detection, and 15 semantic analysis rules for cross-service validation (ports, dependencies, resource references, orphan definitions, container names, image references)**

## Performance

- **Duration:** 5 min
- **Started:** 2026-02-22T19:03:26Z
- **Completed:** 2026-02-22T19:09:20Z
- **Tasks:** 2
- **Files created:** 18

## Accomplishments

- Created port-parser.ts with ParsedPort interface handling all Docker Compose short-syntax formats (container-only, host:container, ip:host:container, protocol suffix, port ranges, ephemeral host ports) plus long-syntax map ports
- Built graph-builder.ts with extractDependsOn (handling both short/long depends_on forms), buildDependencyGraph, and detectCycles using Kahn's topological sort algorithm -- exported for both semantic rules and Phase 36 graph visualization
- Implemented all 15 semantic rules with AST traversal, line-accurate violation reporting, and handling of both short and long syntax forms for depends_on, ports, volumes, secrets, and configs
- Created semantic/index.ts registry exporting semanticRules array with all 15 ComposeLintRule entries

## Task Commits

Each task was committed atomically:

1. **Task 1: Create port-parser.ts and graph-builder.ts shared utilities** - `7dd8846` (feat)
2. **Task 2: Create 15 semantic rules and semantic/index.ts registry** - `2878215` (feat)

## Files Created/Modified

- `src/lib/tools/compose-validator/port-parser.ts` - Port string parser: ParsedPort interface, parsePortString (6+ formats), parseLongSyntaxPort (map objects), expandPortRange, portsConflict (protocol + IP + range overlap)
- `src/lib/tools/compose-validator/graph-builder.ts` - Dependency graph builder: ServiceNode, DependencyEdge, DependencyGraph, CycleDetectionResult interfaces, extractDependsOn (short/long form), buildDependencyGraph, detectCycles (Kahn's algorithm)
- `src/lib/tools/compose-validator/rules/semantic/CV-M001-duplicate-ports.ts` - Duplicate exported host ports between services (error)
- `src/lib/tools/compose-validator/rules/semantic/CV-M002-circular-depends-on.ts` - Circular depends_on chain detection via graph builder (error)
- `src/lib/tools/compose-validator/rules/semantic/CV-M003-undefined-network.ts` - Undefined network reference (error)
- `src/lib/tools/compose-validator/rules/semantic/CV-M004-undefined-volume.ts` - Undefined volume reference with bind mount filtering (error)
- `src/lib/tools/compose-validator/rules/semantic/CV-M005-undefined-secret.ts` - Undefined secret reference (error)
- `src/lib/tools/compose-validator/rules/semantic/CV-M006-undefined-config.ts` - Undefined config reference (error)
- `src/lib/tools/compose-validator/rules/semantic/CV-M007-orphan-network.ts` - Orphan network definition (warning)
- `src/lib/tools/compose-validator/rules/semantic/CV-M008-orphan-volume.ts` - Orphan volume definition (warning)
- `src/lib/tools/compose-validator/rules/semantic/CV-M009-orphan-secret.ts` - Orphan secret definition (warning)
- `src/lib/tools/compose-validator/rules/semantic/CV-M010-depends-on-healthy-no-healthcheck.ts` - depends_on service_healthy without healthcheck (error)
- `src/lib/tools/compose-validator/rules/semantic/CV-M011-self-referencing-dependency.ts` - Self-referencing dependency (error)
- `src/lib/tools/compose-validator/rules/semantic/CV-M012-undefined-service-dependency.ts` - Dependency on undefined service (error)
- `src/lib/tools/compose-validator/rules/semantic/CV-M013-duplicate-container-names.ts` - Duplicate container names (error)
- `src/lib/tools/compose-validator/rules/semantic/CV-M014-port-range-overlap.ts` - Port range overlap between services (warning)
- `src/lib/tools/compose-validator/rules/semantic/CV-M015-invalid-image-reference.ts` - Invalid image reference format (warning)
- `src/lib/tools/compose-validator/rules/semantic/index.ts` - Semantic rules registry with all 15 rules

## Decisions Made

- **Port conflict detection with range intersection:** Used `Math.max(aStart, bStart) <= Math.min(aEnd, bEnd)` for range overlap detection instead of expanding ranges into sets, which is more efficient for large ranges.
- **M001 vs M014 split:** CV-M001 handles single-port duplicates and CV-M014 handles range-based overlaps (at least one side is a range) to avoid duplicate violations for the same conflict.
- **Bind mount filtering:** Volume rules (CV-M004, CV-M008) use prefix checks (`.`, `/`, `~`, `$`) to distinguish named volumes from bind mounts, preventing false positives on host path mounts.
- **Centralized extractDependsOn:** Built in graph-builder.ts and imported by CV-M002, CV-M010, CV-M011, CV-M012 to handle both short (`[redis, db]`) and long (`{ redis: { condition: service_healthy } }`) depends_on forms consistently.
- **Orphan rule line reporting:** Orphan rules traverse `ctx.doc.contents` directly to find top-level key nodes for accurate line numbers, since `ctx.networks`/`ctx.volumes`/`ctx.secrets` Maps store values but not parent key nodes.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- port-parser.ts exports are ready for CV-C009 (unbound port interface), STYLE-02 (ports not quoted), and STYLE-03 (inconsistent quoting) in Plans 34-02 and 34-03
- graph-builder.ts exports are ready for Phase 36's React Flow dependency graph visualization
- semanticRules array is ready for the master rules/index.ts registry in Plan 34-03
- All 15 semantic rules compile and conform to ComposeLintRule interface, ready for rule engine integration
- Astro build succeeds with no regressions (731 pages)

## Self-Check: PASSED

- [x] `src/lib/tools/compose-validator/port-parser.ts` exists on disk
- [x] `src/lib/tools/compose-validator/graph-builder.ts` exists on disk
- [x] `src/lib/tools/compose-validator/rules/semantic/index.ts` exists on disk
- [x] 15 semantic rule files (CV-M001 through CV-M015) exist on disk
- [x] `git log --oneline --all --grep="34-01"` returns 2 commits (7dd8846, 2878215)

---
*Phase: 34-rule-engine-rules-scoring*
*Completed: 2026-02-22*
