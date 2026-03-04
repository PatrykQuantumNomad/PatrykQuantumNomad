---
phase: 75-wasm-infrastructure-and-schema-foundation
plan: 02
subsystem: tools
tags: [ajv, json-schema, yaml, github-actions, schemastore, validation]

requires:
  - phase: 75-wasm-infrastructure-and-schema-foundation (plan 01)
    provides: GhaRuleViolation type definition in types.ts
provides:
  - SchemaStore-compiled standalone ajv validator for github-workflow.json
  - YAML parser with AST line resolution (parseGhaWorkflow)
  - Schema error categorization with 8 rule IDs (GA-S001 through GA-S008)
  - Sample workflow constants for default editor content and testing
affects: [76-rule-engine-and-diagnostics, 77-editor-ui-and-codemirror, 78-scoring-and-results-panel]

tech-stack:
  added: [ajv standalone compilation for GHA schema, SchemaStore github-workflow.json]
  patterns: [schema compile script with caching and require() elimination, keyword-to-ruleId mapping with path context]

key-files:
  created:
    - scripts/compile-gha-schema.mjs
    - scripts/schemas/github-workflow.json
    - src/lib/tools/gha-validator/validate-gha.js
    - src/lib/tools/gha-validator/parser.ts
    - src/lib/tools/gha-validator/schema-validator.ts
    - src/lib/tools/gha-validator/sample-workflow.ts
  modified: []

key-decisions:
  - "Inline ucs2length function alongside equal function to eliminate all require() calls from compiled validator"
  - "Strip format fields and recompile without ajv-formats if runtime require detected (K8s approach fallback)"
  - "Context-aware error messages extract job names and step numbers from instancePath for human readability"

patterns-established:
  - "GHA schema compile: download-cache-compile pattern with require() elimination for CSP-safe ESM output"
  - "Error categorization: keyword-to-ruleId mapping with oneOf/anyOf suppression and deduplication"

requirements-completed: [SCHEMA-01, SCHEMA-02, SCHEMA-03, SCHEMA-04]

duration: 4min
completed: 2026-03-04
---

# Phase 75 Plan 02: Schema Validation Pipeline Summary

**SchemaStore-compiled ajv validator with 8 rule mappings (GA-S001-S008), YAML parser with AST line resolution, and sample workflows**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-04T12:33:45Z
- **Completed:** 2026-03-04T12:37:40Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments
- Compile script downloads github-workflow.json from SchemaStore, caches locally, and produces pure ESM standalone ajv validator with zero require() calls
- YAML parser with GA-S001 syntax error mapping plus resolveInstancePath/getNodeLine for ajv error line resolution
- Schema validator categorizes ajv errors into 8 domain-specific rule IDs with context-aware messages (job names, step numbers)
- Clean sample workflow for default editor, broken sample for testing all schema error categories

## Task Commits

Each task was committed atomically:

1. **Task 1: Schema compile script and YAML parser** - `860a64f` (feat)
2. **Task 2: Schema validator with 8 rule mappings and sample workflow** - `87dcc8d` (feat)

## Files Created/Modified
- `scripts/compile-gha-schema.mjs` - Build-time schema compilation from SchemaStore to standalone validator
- `scripts/schemas/github-workflow.json` - Cached SchemaStore schema
- `src/lib/tools/gha-validator/validate-gha.js` - AUTO-GENERATED pre-compiled ajv standalone validator (pure ESM)
- `src/lib/tools/gha-validator/parser.ts` - YAML parsing with AST line resolution for GHA workflows
- `src/lib/tools/gha-validator/schema-validator.ts` - Schema validation + error categorization with 8 rule mappings
- `src/lib/tools/gha-validator/sample-workflow.ts` - Clean and broken sample workflow YAML constants

## Decisions Made
- Inlined both `equal` and `ucs2length` runtime functions to eliminate all require() calls from compiled validator output
- Implemented fallback strategy: if ajv-formats produces runtime require, strip format fields from schema and recompile without ajv-formats
- Added context-aware messages that extract job names and step numbers from ajv instancePath (e.g., "in job 'build', step 2")
- Used GA-S006 for oneOf/anyOf suppression (suppress when specific rule matched at same path) to reduce noise

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Added ucs2length inline replacement in compile script**
- **Found during:** Task 1 (Schema compile script)
- **Issue:** Compiled output contained `require("ajv/dist/runtime/ucs2length")` not mentioned in plan
- **Fix:** Added inline ucs2length function replacement alongside the existing equal function replacement
- **Files modified:** scripts/compile-gha-schema.mjs
- **Verification:** Compile produces clean output with 0 require() calls
- **Committed in:** 860a64f (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Essential fix for producing pure ESM output. No scope creep.

## Issues Encountered
None beyond the ucs2length deviation documented above.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Schema validation pipeline complete and tested
- parseGhaWorkflow, validateGhaSchema, and categorizeSchemaErrors ready for integration with rule engine (Phase 76)
- Sample workflows available for editor default content (Phase 77)
- All 8 schema rules (GA-S001 through GA-S008) producing meaningful errors with line numbers

---
*Phase: 75-wasm-infrastructure-and-schema-foundation*
*Completed: 2026-03-04*
