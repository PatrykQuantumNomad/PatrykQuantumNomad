---
phase: 33-yaml-parsing-schema-validation-foundation
plan: 02
subsystem: tools
tags: [ajv, json-schema, docker-compose, schema-validation, error-categorization, compose-spec]

# Dependency graph
requires:
  - phase: 33-yaml-parsing-schema-validation-foundation (plan 01)
    provides: YAML parser with resolveInstancePath/getNodeLine, compose-spec schema JSON, types.ts with ComposeRuleViolation
provides:
  - ajv schema validation pipeline with compose-spec schema compilation
  - Error categorization engine mapping ajv errors to CV-S002 through CV-S008 with line-accurate positions
  - 8 schema rule metadata files (CV-S001 through CV-S008) with expert explanations and fix suggestions
  - Schema rule registry (schemaRules array + lookup helpers)
  - SchemaRuleMetadata type for metadata-only rules (no check method)
affects: [34, 35, 36, 38]

# Tech tracking
tech-stack:
  added: []
  patterns: [ajv singleton with strict:false for compose-spec patternProperties, error categorization by keyword+instancePath regex, schema rule metadata pattern without check method]

key-files:
  created:
    - src/lib/tools/compose-validator/schema-validator.ts
    - src/lib/tools/compose-validator/rules/schema/CV-S001-invalid-yaml-syntax.ts
    - src/lib/tools/compose-validator/rules/schema/CV-S002-unknown-top-level-property.ts
    - src/lib/tools/compose-validator/rules/schema/CV-S003-unknown-service-property.ts
    - src/lib/tools/compose-validator/rules/schema/CV-S004-invalid-port-format.ts
    - src/lib/tools/compose-validator/rules/schema/CV-S005-invalid-volume-format.ts
    - src/lib/tools/compose-validator/rules/schema/CV-S006-invalid-duration-format.ts
    - src/lib/tools/compose-validator/rules/schema/CV-S007-invalid-restart-policy.ts
    - src/lib/tools/compose-validator/rules/schema/CV-S008-invalid-depends-on-condition.ts
    - src/lib/tools/compose-validator/rules/schema/index.ts
  modified:
    - src/lib/tools/compose-validator/types.ts

key-decisions:
  - "ajv singleton compiled at module level with strict:false (compose-spec uses patternProperties), allErrors:true, verbose:true"
  - "Schema rules use SchemaRuleMetadata interface (no check method) because ajv drives validation, not per-rule check() calls"
  - "Error categorization uses keyword+instancePath regex matching to map ajv errors to specific CV-S rules"
  - "CV-S006 (invalid duration) set to warning severity since durations may work at runtime even if schema-invalid"

patterns-established:
  - "Schema rule metadata pattern: SchemaRuleMetadata without check() -- ajv categorization drives validation"
  - "Error categorization by keyword (additionalProperties, oneOf, type, enum, format, pattern) + instancePath regex"
  - "Deduplication by ruleId+line+message to suppress noisy oneOf sub-errors"
  - "Schema rule registry mirrors Dockerfile Analyzer rules/index.ts with schemaRules array + lookup helpers"

requirements-completed: [PARSE-04, PARSE-05, SCHEMA-01, SCHEMA-02, SCHEMA-03, SCHEMA-04, SCHEMA-05, SCHEMA-06, SCHEMA-07, SCHEMA-08]

# Metrics
duration: 5min
completed: 2026-02-22
---

# Phase 33 Plan 02: Schema Validator & Rules Summary

**ajv schema validation pipeline with compose-spec compilation, error categorization engine mapping 7 error patterns to CV-S002 through CV-S008 with line-accurate positions, and 8 schema rule metadata files with expert explanations and before/after code examples**

## Performance

- **Duration:** 5 min
- **Started:** 2026-02-22T18:11:14Z
- **Completed:** 2026-02-22T18:16:19Z
- **Tasks:** 2
- **Files created:** 10
- **Files modified:** 1

## Accomplishments

- Created ajv schema validation singleton compiled once at module level with strict:false, allErrors:true, verbose:true, and ajv-formats for duration validation
- Built error categorization engine (categorizeSchemaErrors) that maps every ajv error to a specific CV-S rule (CV-S002 through CV-S008) with human-readable messages and 1-based line numbers resolved from the YAML AST
- Created 8 schema rule metadata files with expert-level explanations covering YAML syntax, unknown properties, port/volume/duration formats, restart policies, and depends_on conditions -- each with before/after code examples
- Built schema rule registry mirroring Dockerfile Analyzer pattern with schemaRules array, getSchemaRuleById, getSchemaRuleSeverity, getSchemaRuleCategory

## Task Commits

Each task was committed atomically:

1. **Task 1: Create schema-validator.ts with ajv singleton, error categorization, and human-readable messages** - `30798be` (feat)
2. **Task 2: Create 8 schema rule metadata files and rules/schema/index.ts registry** - `6eabae2` (feat)

## Files Created/Modified

- `src/lib/tools/compose-validator/schema-validator.ts` - ajv singleton, validateComposeSchema(), categorizeSchemaErrors(), humanizeAjvError()
- `src/lib/tools/compose-validator/rules/schema/CV-S001-invalid-yaml-syntax.ts` - Invalid YAML syntax rule metadata (error)
- `src/lib/tools/compose-validator/rules/schema/CV-S002-unknown-top-level-property.ts` - Unknown top-level property rule metadata (error)
- `src/lib/tools/compose-validator/rules/schema/CV-S003-unknown-service-property.ts` - Unknown service property rule metadata (error)
- `src/lib/tools/compose-validator/rules/schema/CV-S004-invalid-port-format.ts` - Invalid port format rule metadata (error)
- `src/lib/tools/compose-validator/rules/schema/CV-S005-invalid-volume-format.ts` - Invalid volume format rule metadata (error)
- `src/lib/tools/compose-validator/rules/schema/CV-S006-invalid-duration-format.ts` - Invalid duration format rule metadata (warning)
- `src/lib/tools/compose-validator/rules/schema/CV-S007-invalid-restart-policy.ts` - Invalid restart policy rule metadata (error)
- `src/lib/tools/compose-validator/rules/schema/CV-S008-invalid-depends-on-condition.ts` - Invalid depends_on condition rule metadata (error)
- `src/lib/tools/compose-validator/rules/schema/index.ts` - Schema rule registry with all 8 rules and lookup helpers
- `src/lib/tools/compose-validator/types.ts` - Added SchemaRuleMetadata interface

## Decisions Made

- **ajv strict:false:** Required because the compose-spec schema uses patternProperties (for x- extension fields and service names) which ajv strict mode rejects.
- **SchemaRuleMetadata without check():** Schema rules are metadata-only because ajv drives validation through the categorization engine in schema-validator.ts, unlike Dockerfile Analyzer rules which have individual check() methods. This avoids unnecessary abstraction.
- **Error categorization by keyword+instancePath:** Each ajv error is matched by its keyword (additionalProperties, oneOf, type, enum, format, pattern) combined with regex on instancePath to determine the specific rule. This approach handles the compose-spec's extensive use of oneOf/anyOf for flexible value formats.
- **CV-S006 as warning:** Duration format errors are set to warning severity because Docker Compose may accept non-standard duration strings at runtime even though they are schema-invalid.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Phase 33 is now complete (both plans executed)
- Full validation pipeline is wired: parser.ts (YAML AST + line mapping) -> schema-validator.ts (ajv validation + error categorization) -> rules/schema/index.ts (rule metadata)
- Phase 34 can build the rule engine, 44 custom analysis rules, graph builder, cycle detector, and scoring system on top of these foundations
- The ComposeRuleContext, ComposeLintRule, and schema-validator exports are all ready for integration

## Self-Check: PASSED

- [x] `src/lib/tools/compose-validator/schema-validator.ts` exists on disk
- [x] `src/lib/tools/compose-validator/rules/schema/CV-S001-invalid-yaml-syntax.ts` exists on disk
- [x] `git log --oneline --all --grep="33-02"` returns 2 commits (30798be, 6eabae2)

---
*Phase: 33-yaml-parsing-schema-validation-foundation*
*Completed: 2026-02-22*
