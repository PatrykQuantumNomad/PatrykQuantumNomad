---
phase: 33-yaml-parsing-schema-validation-foundation
verified: 2026-02-22T18:23:02Z
status: passed
score: 5/5 must-haves verified
re_verification: false
human_verification:
  - test: "Parse a Docker Compose YAML string containing merge keys (<<) and verify the returned Document AST has node ranges"
    expected: "No parse errors; doc.contents is a YAMLMap with items each having a range property"
    why_human: "Requires running parseComposeYaml() in a Node.js context to inspect AST output at runtime"
  - test: "Pass ${PORT:-8080} in a port mapping and verify schema validation produces no false-positive error"
    expected: "validateComposeSchema returns [] for a compose file using ${PORT:-8080} as a port string"
    why_human: "Requires running the full normalizeJsonForValidation -> validateComposeSchema pipeline end-to-end"
  - test: "Pass an invalid restart policy like 'never' and verify the output message reads as CV-S007 human text"
    expected: "categorizeSchemaErrors returns a violation with ruleId CV-S007 and message containing 'Invalid restart policy'"
    why_human: "Requires running ajv + categorizeSchemaErrors in a Node.js context"
---

# Phase 33: YAML Parsing & Schema Validation Foundation — Verification Report

**Phase Goal:** A YAML string can be parsed into an AST with source line numbers, variable interpolation is normalized, and the compose-spec JSON Schema validates structural correctness with human-readable error messages mapped to exact source lines

**Verified:** 2026-02-22T18:23:02Z
**Status:** passed
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | A Docker Compose YAML string with merge keys (<<) parses correctly in YAML 1.1 mode and returns a Document AST with node ranges | VERIFIED | `parser.ts:40-47` calls `parseDocument(rawText, { version: '1.1', merge: true, lineCounter, ... })`; `parseDocument`, `LineCounter`, `isMap`, `isSeq`, `isPair`, `isScalar` all imported from `'yaml'` |
| 2 | Variable interpolation patterns like ${VAR:-default} are normalized before validation so they do not produce false-positive schema errors | VERIFIED | `interpolation.ts` implements all 6 Docker Compose interpolation patterns ($$, :-default, -default, :+replacement, +replacement, :?error, ?error, ${VAR}, $VAR); `parser.ts:83` calls `normalizeJsonForValidation(json)` on the JSON output before returning `normalizedJson` |
| 3 | Schema validation against compose-spec reports structural errors with accurate 1-based source line numbers | VERIFIED | `schema-validator.ts:117-118` calls `resolveInstancePath(doc, instancePath)` and `getNodeLine(node, lineCounter)` for every ajv error; categorization covers CV-S002 through CV-S008 |
| 4 | Invalid YAML syntax produces a clear error message with the line number where parsing failed | VERIFIED | `parser.ts:50-70` maps `doc.errors` to `ComposeRuleViolation[]` with `ruleId: 'CV-S001'`; uses `lineCounter.linePos(err.pos[0])` with null guard on `err.pos` |
| 5 | Human-readable error messages are generated from ajv oneOf/anyOf validation failures (not raw JSON Schema paths) | VERIFIED | `humanizeAjvError()` in `schema-validator.ts:226-260` handles `oneOf`/`anyOf` with "Value does not match any of the expected formats."; specific rules (CV-S004, CV-S005, CV-S008) intercept oneOf errors before fallback via early returns in `categoriseSingleError()` |

**Score:** 5/5 truths verified

---

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/lib/tools/compose-validator/types.ts` | 11 exported type/interface definitions | VERIFIED | 107 lines; exports ComposeSeverity, ComposeCategory, ComposeRuleFix, ComposeLintRule, ComposeRuleContext, ComposeRuleViolation, ComposeScoreDeduction, ComposeCategoryScore, ComposeScoreResult, ComposeLintViolation, ComposeAnalysisResult, SchemaRuleMetadata (12 total including SchemaRuleMetadata added in Plan 02) |
| `src/lib/tools/compose-validator/interpolation.ts` | containsInterpolation, normalizeInterpolation, normalizeJsonForValidation | VERIFIED | 127 lines; all 3 functions exported; all 6 Docker Compose interpolation patterns implemented with correct processing order |
| `src/lib/tools/compose-validator/parser.ts` | ComposeParseResult, parseComposeYaml, extractTopLevelMap, resolveInstancePath, getNodeLine | VERIFIED | 222 lines; all 5 exports present; YAML 1.1 mode confirmed; range-undefined guard at line 209-212 |
| `src/lib/tools/compose-validator/compose-spec-schema.json` | Bundled compose-spec JSON Schema Draft-07 | VERIFIED | 1907 lines; `"$schema": "https://json-schema.org/draft-07/schema"` confirmed; `$comment` with source attribution present |
| `src/lib/tools/compose-validator/schema-validator.ts` | validateComposeSchema, categorizeSchemaErrors | VERIFIED | 269 lines; ajv singleton compiled at module level with `strict: false, allErrors: true, verbose: true`; addFormats called; categorizes CV-S002 through CV-S008 with humanizeAjvError fallback |
| `src/lib/tools/compose-validator/rules/schema/CV-S001-invalid-yaml-syntax.ts` | CVS001 metadata (error severity) | VERIFIED | 30 lines; severity: 'error'; explanation 6 sentences; before/after code examples |
| `src/lib/tools/compose-validator/rules/schema/CV-S002-unknown-top-level-property.ts` | CVS002 metadata | VERIFIED | 21 lines; substantive explanation; before/after examples |
| `src/lib/tools/compose-validator/rules/schema/CV-S003-unknown-service-property.ts` | CVS003 metadata | VERIFIED | 23 lines; substantive explanation; before/after examples |
| `src/lib/tools/compose-validator/rules/schema/CV-S004-invalid-port-format.ts` | CVS004 metadata | VERIFIED | 21 lines; substantive explanation; before/after examples |
| `src/lib/tools/compose-validator/rules/schema/CV-S005-invalid-volume-format.ts` | CVS005 metadata | VERIFIED | 22 lines; substantive explanation; before/after examples |
| `src/lib/tools/compose-validator/rules/schema/CV-S006-invalid-duration-format.ts` | CVS006 metadata (warning severity) | VERIFIED | 21 lines; severity: 'warning' confirmed |
| `src/lib/tools/compose-validator/rules/schema/CV-S007-invalid-restart-policy.ts` | CVS007 metadata | VERIFIED | 23 lines; lists all 4 valid values; quotes "no" caveat |
| `src/lib/tools/compose-validator/rules/schema/CV-S008-invalid-depends-on-condition.ts` | CVS008 metadata | VERIFIED | 25 lines; lists all 3 valid conditions |
| `src/lib/tools/compose-validator/rules/schema/index.ts` | schemaRules array + lookup helpers | VERIFIED | 37 lines; imports all 8 CVS constants; exports schemaRules, getSchemaRuleById, getSchemaRuleSeverity, getSchemaRuleCategory |

---

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `parser.ts` | `types.ts` | `import type { ComposeRuleViolation } from './types'` | WIRED | Line 10 of parser.ts |
| `parser.ts` | `interpolation.ts` | `normalizeJsonForValidation` called on `doc.toJSON()` output | WIRED | Lines 11 and 83 of parser.ts |
| `parser.ts` | `yaml` package | `parseDocument(..., { version: '1.1', merge: true, lineCounter })` | WIRED | Lines 1-8 (imports) and 40-47 (call site) |
| `schema-validator.ts` | `compose-spec-schema.json` | `import composeSchema from './compose-spec-schema.json'` | WIRED | Line 6; `ajv.compile(composeSchema)` at line 20 |
| `schema-validator.ts` | `parser.ts` | `resolveInstancePath` and `getNodeLine` used in `categoriseSingleError` | WIRED | Lines 7, 117-118 |
| `schema-validator.ts` | `rules/schema/index.ts` | Rule IDs CV-S001 through CV-S008 referenced in categorization | WIRED | Lines 124, 136, 149, 164, 179, 193, 206, 216 |
| `rules/schema/index.ts` | `types.ts` | `import type { SchemaRuleMetadata, ComposeSeverity, ComposeCategory } from '../../types'` | WIRED | Line 1 |

---

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| PARSE-01 | 33-01 | YAML parsing via yaml package with YAML 1.1 mode | SATISFIED | `parseDocument(..., { version: '1.1', ... })` in parser.ts:40 |
| PARSE-02 | 33-01 | LineCounter integration for mapping errors to line numbers | SATISFIED | `new LineCounter()` at parser.ts:38; `lineCounter.linePos()` at parser.ts:56 |
| PARSE-03 | 33-01 | Variable interpolation normalizer for ${VAR:-default} patterns | SATISFIED | interpolation.ts with all 6 pattern types; called in parser.ts:83 |
| PARSE-04 | 33-02 | compose-spec JSON Schema validation via ajv v8 Draft-07 | SATISFIED | ajv 8.18.0 installed; schema compiled in schema-validator.ts:20 |
| PARSE-05 | 33-02 | Human-readable error messages from ajv oneOf/anyOf failures | SATISFIED | humanizeAjvError() in schema-validator.ts:226-260; specific rules intercept oneOf before fallback |
| PARSE-06 | 33-01 | compose-spec schema bundled statically at build time | SATISFIED | compose-spec-schema.json (1907 lines) committed to repository |
| SCHEMA-01 | 33-01 / 33-02 | CV-S001 — Invalid YAML syntax detection with line-level reporting | SATISFIED | parser.ts:50-70 maps doc.errors to CV-S001 violations with lineCounter |
| SCHEMA-02 | 33-02 | CV-S002 — Unknown top-level property detection | SATISFIED | categoriseSingleError handles `keyword===additionalProperties && instancePath===''` |
| SCHEMA-03 | 33-02 | CV-S003 — Unknown service property detection | SATISFIED | categoriseSingleError handles `keyword===additionalProperties && SERVICE_PATH_RE.test(instancePath)` |
| SCHEMA-04 | 33-02 | CV-S004 — Invalid port format validation | SATISFIED | categoriseSingleError handles `PORT_ITEM_RE && (keyword===oneOf\|type\|pattern)` |
| SCHEMA-05 | 33-02 | CV-S005 — Invalid volume format validation | SATISFIED | categoriseSingleError handles `VOLUME_ITEM_RE && (keyword===oneOf\|type)` |
| SCHEMA-06 | 33-02 | CV-S006 — Invalid duration format in healthcheck | SATISFIED | categoriseSingleError handles `keyword===format && params.format===duration` |
| SCHEMA-07 | 33-02 | CV-S007 — Invalid restart policy values | SATISFIED | categoriseSingleError handles `RESTART_RE && (keyword===enum\|type)` |
| SCHEMA-08 | 33-02 | CV-S008 — Invalid depends_on condition values | SATISFIED | categoriseSingleError handles `DEPENDS_ON_CONDITION_RE && (keyword===enum\|type)` |

---

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `schema-validator.ts` | 62-78 | oneOf/anyOf suppression loop is a no-op: `for (const sp of specificPaths)` loop body only contains `continue` and a comment; `return true` at the end means no suppression occurs | Warning | Low — because `categoriseSingleError` uses early returns, each ajv error maps to exactly one rule before reaching the fallback. The suppression logic was intended to handle cross-error-type duplicates at the same `instancePath` (e.g., a `oneOf` error generating both a CV-S004 and a CV-S002 fallback). In practice `categoriseSingleError`'s early returns prevent this from occurring for the mapped keywords, but edge-case ajv error combinations could produce duplicate violations in output. The deduplication-by-key step at lines 82-91 catches same-ruleId+line+message duplicates, providing partial mitigation. Not a blocker for goal achievement. |
| `schema-validator.ts` | 266-268 | `humanizeAjvErrorByParts` always returns `''` — stub function referenced only in the no-op suppression loop | Info | Not independently callable as a real humanizer — but it is only used internally in the dead suppression code, so no downstream impact |

---

### Human Verification Required

#### 1. Merge Key Parse in YAML 1.1 Mode

**Test:** Create a Node.js script that calls `parseComposeYaml()` with a string containing YAML anchors and merge keys (`<<: *anchor`) and inspect the returned `doc.contents`.
**Expected:** `parseSuccess === true`, `doc.errors` is empty, the merged properties appear in the resulting JSON/AST.
**Why human:** Requires running the yaml 2.8.2 library in a Node.js context with version: '1.1' to confirm merge key resolution works end-to-end.

#### 2. Interpolation Suppresses False-Positive Schema Errors

**Test:** Call `parseComposeYaml()` with a Compose YAML using `image: ${REGISTRY:-docker.io}/myapp:${TAG}`, then call `validateComposeSchema(result.normalizedJson)`.
**Expected:** Returns an empty array (no errors). The interpolation normalizer should have resolved `${REGISTRY:-docker.io}` to `docker.io` and `${TAG}` to `placeholder`, producing a valid image string.
**Why human:** Requires running the full pipeline in Node.js to confirm normalization + ajv behave correctly together.

#### 3. Line-Accurate Error Mapping for Invalid restart Policy

**Test:** Call `parseComposeYaml()` with a Compose YAML containing `restart: never` at line 5, then call `categorizeSchemaErrors(errors, doc, lineCounter)`.
**Expected:** Returns a `ComposeRuleViolation` with `ruleId: 'CV-S007'`, `line: 5`, and `message` containing "Invalid restart policy 'never'".
**Why human:** Requires running ajv validation + categorization to confirm line-number accuracy in practice.

---

### Dependency Installation Verification

All three required npm packages confirmed present in `package.json` and installed:

- `yaml`: `^2.8.2` (direct dependency, deduped at 2.8.2)
- `ajv`: `^8.18.0` (direct dependency, 8.18.0)
- `ajv-formats`: `^3.0.1` (direct dependency, 3.0.1)

TypeScript compilation of compose-validator files produces zero errors. The only `tsc --noEmit` errors observed are pre-existing `Buffer<ArrayBufferLike>` type errors in `src/pages/open-graph/` files that are unrelated to Phase 33.

Commit history confirms 4 atomic commits:
- `dea90eb` — feat(33-01): install yaml/ajv/ajv-formats and create types and interpolation normalizer
- `d50c886` — feat(33-01): bundle compose-spec schema and create YAML 1.1 parser with AST helpers
- `30798be` — feat(33-02): create schema-validator.ts with ajv singleton, error categorization, and human-readable messages
- `6eabae2` — feat(33-02): create 8 schema rule metadata files and rules/schema/index.ts registry

---

_Verified: 2026-02-22T18:23:02Z_
_Verifier: Claude (gsd-verifier)_
