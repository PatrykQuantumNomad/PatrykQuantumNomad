---
phase: 33-yaml-parsing-schema-validation-foundation
plan: 01
subsystem: tools
tags: [yaml, ajv, json-schema, docker-compose, parser, interpolation, ast]

# Dependency graph
requires:
  - phase: 32-polish-blog-post
    provides: shipped v1.5 site with Dockerfile Analyzer pattern to mirror
provides:
  - YAML 1.1 parser with merge key support and LineCounter integration
  - Variable interpolation normalizer for Docker Compose ${VAR:-default} patterns
  - Bundled compose-spec JSON Schema (Draft-07) for ajv validation
  - Complete compose-validator type system (11 exported types/interfaces)
  - AST extraction helpers (extractTopLevelMap, resolveInstancePath, getNodeLine)
affects: [33-02, 34, 35, 36, 37, 38, 39, 40]

# Tech tracking
tech-stack:
  added: [yaml 2.8.2, ajv 8.18.0, ajv-formats 3.0.1]
  patterns: [YAML 1.1 parsing with LineCounter, interpolation normalization on JSON not raw YAML, AST node range safety guard]

key-files:
  created:
    - src/lib/tools/compose-validator/types.ts
    - src/lib/tools/compose-validator/interpolation.ts
    - src/lib/tools/compose-validator/parser.ts
    - src/lib/tools/compose-validator/compose-spec-schema.json
  modified:
    - package.json
    - package-lock.json

key-decisions:
  - "Used yaml 2.x (eemeli) with version 1.1 mode for YAML merge key support critical to Docker Compose"
  - "Interpolation normalizer operates on JSON output (post-toJSON) not raw YAML to preserve AST line offsets"
  - "compose-spec schema bundled as static JSON file with $comment attribution rather than runtime fetch"
  - "getNodeLine includes try/catch and range-undefined guard per yaml issue #573"

patterns-established:
  - "Compose validator type naming: Compose prefix on all types (ComposeSeverity, ComposeCategory, etc.)"
  - "5-category scoring: schema, security, semantic, best-practice, style (vs Dockerfile Analyzer's 5 different categories)"
  - "Parse errors mapped to CV-S001 rule violations with 1-based line numbers from LineCounter"
  - "Top-level map extraction at AST level (not JSON level) for range-aware rule checking"

requirements-completed: [PARSE-01, PARSE-02, PARSE-03, PARSE-06, SCHEMA-01]

# Metrics
duration: 6min
completed: 2026-02-22
---

# Phase 33 Plan 01: YAML Parser & Type System Summary

**YAML 1.1 parser with merge key support, variable interpolation normalizer for ${VAR:-default} patterns, bundled compose-spec Draft-07 schema, and compose-validator type system with 11 exports**

## Performance

- **Duration:** 6 min
- **Started:** 2026-02-22T17:59:18Z
- **Completed:** 2026-02-22T18:05:19Z
- **Tasks:** 2
- **Files created:** 4
- **Files modified:** 2

## Accomplishments

- Installed yaml 2.8.2, ajv 8.18.0, and ajv-formats 3.0.1 as direct dependencies
- Created complete compose-validator type system (96 lines) mirroring Dockerfile Analyzer pattern with 5 categories matching ROADMAP weights
- Built variable interpolation normalizer handling all Docker Compose patterns ($$, :-default, -default, :+replacement, +replacement, :?error, ?error, ${VAR}, $VAR) without mutating the AST
- Bundled compose-spec JSON Schema from official repo with Draft-07 declaration and source attribution
- Created YAML 1.1 parser with LineCounter integration producing Document AST, raw JSON, normalized JSON, and extracted top-level maps
- Implemented AST helpers: extractTopLevelMap (AST-level section extraction), resolveInstancePath (JSON Pointer to AST node), getNodeLine (safe line extraction with range guard)

## Task Commits

Each task was committed atomically:

1. **Task 1: Install dependencies, create types and interpolation normalizer** - `dea90eb` (feat)
2. **Task 2: Bundle compose-spec schema and create YAML parser with AST helpers** - `d50c886` (feat)

## Files Created/Modified

- `src/lib/tools/compose-validator/types.ts` - Complete type system: ComposeSeverity, ComposeCategory, ComposeRuleFix, ComposeLintRule, ComposeRuleContext, ComposeRuleViolation, ComposeScoreDeduction, ComposeCategoryScore, ComposeScoreResult, ComposeLintViolation, ComposeAnalysisResult
- `src/lib/tools/compose-validator/interpolation.ts` - Variable interpolation detection (containsInterpolation), normalization (normalizeInterpolation), and recursive JSON walker (normalizeJsonForValidation)
- `src/lib/tools/compose-validator/parser.ts` - YAML 1.1 parser (parseComposeYaml) with ComposeParseResult, extractTopLevelMap, resolveInstancePath, getNodeLine
- `src/lib/tools/compose-validator/compose-spec-schema.json` - Bundled compose-spec JSON Schema (1907 lines, Draft-07) with $comment source attribution
- `package.json` - Added yaml, ajv, ajv-formats direct dependencies
- `package-lock.json` - Lock file updated

## Decisions Made

- **yaml 2.x with version: '1.1' mode:** Docker Compose relies on YAML 1.1 merge keys (<<) which are not supported in YAML 1.2. The version: '1.1' option is critical and set explicitly alongside merge: true for clarity.
- **Interpolation on JSON, not raw YAML:** Running the normalizer on doc.toJSON() output rather than raw YAML text preserves correct AST node ranges and line offsets. This is essential because ajv validates JSON but line numbers come from the AST.
- **Static schema bundling:** The compose-spec schema is committed as a static JSON file rather than fetched at runtime, ensuring offline functionality and build-time availability.
- **Range-undefined safety guard:** getNodeLine wraps linePos in try/catch and checks node?.range && Array.isArray(node.range) per yaml library issue #573 where some nodes may have undefined ranges.
- **uniqueKeys: false in parser options:** Some Docker Compose contexts allow duplicate keys; this prevents parsing failures on valid-in-practice compose files.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Types, interpolation normalizer, parser, and schema are all ready for Plan 33-02
- Plan 33-02 will create the ajv schema validator using compose-spec-schema.json, the normalizedJson from parseComposeYaml, and resolveInstancePath/getNodeLine for error line mapping
- All 5 exports from parser.ts (ComposeParseResult, parseComposeYaml, extractTopLevelMap, resolveInstancePath, getNodeLine) are ready for downstream use
- Astro build succeeds with no regressions (731 pages)

## Self-Check: PASSED

- [x] `src/lib/tools/compose-validator/types.ts` exists on disk
- [x] `src/lib/tools/compose-validator/interpolation.ts` exists on disk
- [x] `git log --oneline --all --grep="33-01"` returns 2 commits (dea90eb, d50c886)

---
*Phase: 33-yaml-parsing-schema-validation-foundation*
*Completed: 2026-02-22*
