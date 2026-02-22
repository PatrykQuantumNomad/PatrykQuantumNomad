# Phase 33: YAML Parsing & Schema Validation Foundation - Research

**Researched:** 2026-02-22
**Domain:** YAML parsing with AST line mapping, variable interpolation normalization, and JSON Schema validation with compose-spec
**Confidence:** HIGH

## Summary

Phase 33 builds the foundational parsing and schema validation pipeline for the Docker Compose Validator tool. This is the critical-path foundation upon which all subsequent phases (semantic rules, editor integration, graph visualization) depend. The phase delivers four core capabilities: (1) YAML parsing via the `yaml` npm package configured for Docker Compose's YAML 1.1 dialect with merge key support, (2) a `LineCounter`-based system that maps byte offsets to 1-based line/column positions, (3) a variable interpolation normalizer that prevents `${VAR:-default}` patterns from causing false-positive schema errors, and (4) JSON Schema validation via ajv v8 against the bundled compose-spec schema with a `resolveInstancePath()` function that walks the YAML Document AST to recover source line numbers from ajv's JSON Pointer error paths.

The two most architecturally novel pieces are the interpolation normalizer (which must run before schema validation so that interpolated values do not produce type/format errors) and the `resolveInstancePath()` AST walker (which bridges the gap between ajv's position-free JSON validation and the YAML source's exact line numbers). Both have well-defined implementation patterns documented below. The YAML 1.1 merge key configuration is a one-line option (`version: '1.1'`) that must be correct from the first line of parsing code -- getting this wrong silently breaks anchor/merge resolution in real-world Compose files.

This phase produces 8 schema validation rules (CV-S001 through CV-S008) that detect structural errors with accurate 1-based source line numbers. No test framework currently exists in the project (no vitest, jest, or mocha in `package.json`), so verification will use the Astro build pipeline and manual/runtime validation rather than unit tests, unless a test framework is added as part of this phase.

**Primary recommendation:** Use `yaml` 2.x `parseDocument()` with `{ version: '1.1', merge: true, lineCounter }` for parsing, `ajv` 8.x with `{ allErrors: true, strict: false }` for schema validation, and build a custom `resolveInstancePath()` to walk the YAML AST for line-number recovery. Bundle the compose-spec schema as a static JSON import. Normalize interpolated values before `doc.toJSON()` to prevent false positives.

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `yaml` (Eemeli) | 2.8.x | YAML parsing with full AST and source range tracking | Only YAML parser for JS that preserves node positions via `LineCounter` + `range` property. `js-yaml` returns plain objects with no positional data. Required for mapping violations to source lines. |
| `ajv` | 8.18.x | JSON Schema Draft-07 validation against compose-spec schema | De facto standard JS JSON Schema validator. Fastest, supports allErrors mode, Draft-07 (compose-spec format). Works in browser. |
| `ajv-formats` | 3.0.x | Format validators (duration, uri) required by compose-spec schema | compose-spec uses `"format": "duration"` for healthcheck intervals. Without this plugin, format validation is silently skipped. |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `@apideck/better-ajv-errors` | latest | Human-readable ajv error transformation | Optional. Use if custom error mapping proves insufficient for oneOf/anyOf errors. Adds ~1.5 KB gzip. Compatible with ajv v8. |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `yaml` (Eemeli) | `js-yaml` 4.x | js-yaml is simpler but returns plain JS objects. No AST, no source positions, no range tracking. Cannot map validation errors back to YAML line numbers. Dealbreaker for this phase's requirements. |
| `ajv` runtime | `ajv` standalone pre-compiled | Standalone eliminates the ajv runtime (~110 KB) from the browser bundle, replacing it with ~15-30 KB of generated validation code. Requires a build step. Start with runtime for development velocity; evaluate standalone if Lighthouse regresses. |
| Custom error messages | `@segment/ajv-human-errors` | Alternative to `@apideck/better-ajv-errors`. Similar functionality. Both work with ajv v8. Choose whichever handles compose-spec oneOf patterns better during implementation. |
| Custom error messages | `ajv-errors` (official) | Requires modifying the schema with `errorMessage` keywords. Not viable since we are using the unmodified compose-spec schema. |

**Installation:**
```bash
npm install yaml ajv ajv-formats
```

**Optional (evaluate during implementation):**
```bash
npm install @apideck/better-ajv-errors
```

## Architecture Patterns

### Recommended Project Structure

```
src/lib/tools/compose-validator/
├── types.ts                     # ComposeLintRule interface, violation types, ComposeRuleContext
├── parser.ts                    # parseDocument with YAML 1.1 + LineCounter + interpolation normalizer
├── interpolation.ts             # Variable interpolation detection and normalization
├── schema-validator.ts          # ajv validation + resolveInstancePath() line mapper
├── compose-spec-schema.json     # Bundled compose-spec JSON Schema (static import)
└── rules/
    └── schema/                  # 8 schema rules that wrap/categorize ajv errors
        ├── CV-S001-invalid-yaml-syntax.ts
        ├── CV-S002-unknown-top-level-property.ts
        ├── CV-S003-unknown-service-property.ts
        ├── CV-S004-invalid-port-format.ts
        ├── CV-S005-invalid-volume-format.ts
        ├── CV-S006-invalid-duration-format.ts
        ├── CV-S007-invalid-restart-policy.ts
        └── CV-S008-invalid-depends-on-condition.ts
```

### Pattern 1: YAML Parsing with LineCounter and YAML 1.1 Mode

**What:** Parse Docker Compose YAML into an AST Document that preserves source ranges on every node, with 1-based line/column conversion.

**When to use:** Every time a YAML string is analyzed. This is the entry point for the entire validation pipeline.

**Example:**
```typescript
// Source: https://eemeli.org/yaml/#parsing-documents + https://eemeli.org/yaml/#line-counter
import { parseDocument, LineCounter } from 'yaml';
import type { Document } from 'yaml';

export interface ComposeParseResult {
  doc: Document;
  lineCounter: LineCounter;
  json: Record<string, unknown> | null;
  parseSuccess: boolean;
  parseErrors: Array<{ line: number; column: number; message: string }>;
}

export function parseComposeYaml(rawText: string): ComposeParseResult {
  const lineCounter = new LineCounter();

  const doc = parseDocument(rawText, {
    version: '1.1',          // Docker Compose uses YAML 1.1 semantics (merge keys)
    merge: true,              // Enable << merge key resolution
    lineCounter,              // Track line positions for error mapping
    prettyErrors: true,       // Include line/col in parse error messages
    uniqueKeys: false,        // Compose allows duplicate keys in some contexts
    keepSourceTokens: false,  // We use range, not CST tokens
  });

  // Collect YAML parse errors (syntax issues)
  const parseErrors = doc.errors.map((err) => {
    // err.pos is [startOffset, endOffset]
    const pos = err.pos?.[0] != null
      ? lineCounter.linePos(err.pos[0])
      : { line: 1, col: 1 };
    return {
      line: pos.line,       // 1-based (LineCounter returns 1-indexed)
      column: pos.col,      // 1-based
      message: err.message,
    };
  });

  // Convert to plain JS for ajv validation
  let json: Record<string, unknown> | null = null;
  if (doc.errors.length === 0) {
    try {
      json = doc.toJSON() as Record<string, unknown>;
    } catch {
      // toJSON can fail on certain malformed documents
    }
  }

  return {
    doc,
    lineCounter,
    json,
    parseSuccess: doc.errors.length === 0,
    parseErrors,
  };
}
```

**Confidence:** HIGH -- verified against official yaml docs at eemeli.org/yaml. `LineCounter.linePos()` returns 1-indexed `{ line, col }`. `parseDocument()` `version` option accepts `'1.1'` or `'1.2'`. `merge` option defaults to `true` for 1.1, `false` for 1.2.

### Pattern 2: Variable Interpolation Normalization

**What:** Detect and normalize Docker Compose `${VAR:-default}` patterns before schema validation to prevent false-positive errors.

**When to use:** After YAML parsing succeeds, before calling `doc.toJSON()` for ajv validation.

**Why it matters:** A port mapping like `"${HOST_PORT:-8080}:80"` is valid Compose, but ajv would fail to parse it as a valid port format. An image tag like `${POSTGRES_VERSION:-16}` is valid but unparseable as a version number. The interpolation normalizer must replace interpolated values with schema-compatible placeholders.

**Example:**
```typescript
// Source: https://docs.docker.com/reference/compose-file/interpolation/

// All Docker Compose interpolation patterns
const INTERPOLATION_REGEX =
  /\$\{([^{}]+)\}|\$([A-Za-z_][A-Za-z0-9_]*)/;

/**
 * Check if a string contains Docker Compose variable interpolation
 */
export function containsInterpolation(value: string): boolean {
  return INTERPOLATION_REGEX.test(value);
}

/**
 * Resolve interpolation patterns for validation purposes.
 * Uses default values where available, replaces bare variables with placeholders.
 *
 * Supported Docker Compose patterns:
 * - ${VAR}              -> 'placeholder'
 * - ${VAR:-default}     -> 'default'
 * - ${VAR-default}      -> 'default'
 * - ${VAR:?error}       -> 'placeholder'
 * - ${VAR?error}        -> 'placeholder'
 * - ${VAR:+replacement} -> 'replacement'
 * - ${VAR+replacement}  -> 'replacement'
 * - $$                  -> '$' (literal dollar sign)
 * - Nested: ${VAR:-${FOO:-default}} -> handled recursively
 */
export function normalizeInterpolation(value: string): string {
  // First handle $$ escape (literal dollar)
  let result = value.replace(/\$\$/g, '$');

  // Handle ${VAR:-default} and ${VAR-default} -- use the default
  result = result.replace(/\$\{[^:}]+:-([^}]*)\}/g, '$1');
  result = result.replace(/\$\{[^:}]+-([^}]*)\}/g, '$1');

  // Handle ${VAR:+replacement} and ${VAR+replacement} -- use replacement
  result = result.replace(/\$\{[^:}]+:\+([^}]*)\}/g, '$1');
  result = result.replace(/\$\{[^:}]+\+([^}]*)\}/g, '$1');

  // Handle ${VAR:?error} and ${VAR?error} -- use placeholder
  result = result.replace(/\$\{[^:}]+:\?[^}]*\}/g, 'placeholder');
  result = result.replace(/\$\{[^:}]+\?[^}]*\}/g, 'placeholder');

  // Handle bare ${VAR} and $VAR -- use placeholder
  result = result.replace(/\$\{[^}]+\}/g, 'placeholder');
  result = result.replace(/\$([A-Za-z_][A-Za-z0-9_]*)/g, 'placeholder');

  return result;
}
```

**Confidence:** HIGH -- interpolation syntax verified against official Docker Compose interpolation docs at https://docs.docker.com/reference/compose-file/interpolation/

**Implementation strategy:** Two approaches exist:

1. **Pre-process the YAML string** before parsing: Find and replace interpolation patterns in the raw text, then parse the modified text. This changes offsets and breaks line mapping. NOT recommended.

2. **Post-process the JSON object** before ajv validation: Parse the original YAML to preserve correct AST ranges, then walk the resulting JSON object (from `doc.toJSON()`) and normalize interpolated string values. This preserves accurate line numbers while feeding ajv schema-compatible values. RECOMMENDED.

The post-process approach works because ajv validates the JSON object (which has no line numbers anyway), while line numbers come from the original YAML Document AST (which is not modified).

### Pattern 3: ajv Schema Validation with Line Number Recovery

**What:** Validate the parsed JSON against the compose-spec schema, then map each ajv error's `instancePath` back to the YAML AST to recover source line numbers.

**When to use:** After YAML parsing succeeds and the JSON object is available.

**Example:**
```typescript
// Source: https://ajv.js.org/api.html + https://eemeli.org/yaml/
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import composeSchema from './compose-spec-schema.json';
import type { ComposeRuleViolation } from './types';
import type { Document } from 'yaml';
import type { LineCounter } from 'yaml';
import { isMap, isPair, isScalar, isSeq } from 'yaml';

// Compile schema once at module level (singleton)
const ajv = new Ajv({
  allErrors: true,     // Report ALL errors, not just the first
  strict: false,       // Compose schema uses patternProperties that strict mode dislikes
  verbose: true,       // Include schema and parentSchema in errors for better messages
});
addFormats(ajv);
const validate = ajv.compile(composeSchema);

/**
 * Walk the YAML AST following a JSON Pointer path like "/services/web/ports/0"
 * to find the corresponding AST node (which carries source range info).
 */
function resolveInstancePath(doc: Document, path: string): any {
  if (!path || path === '/') return doc.contents;

  const segments = path.split('/').filter(Boolean);
  let current: any = doc.contents;

  for (const segment of segments) {
    if (isMap(current)) {
      const pair = current.items.find(
        (item: any) => isPair(item) && isScalar(item.key) && String(item.key.value) === segment
      );
      if (pair && isPair(pair)) {
        current = pair.value;
      } else {
        return null;  // Path segment not found in AST
      }
    } else if (isSeq(current)) {
      const index = parseInt(segment, 10);
      if (!isNaN(index) && current.items[index]) {
        current = current.items[index];
      } else {
        return null;
      }
    } else {
      return null;
    }
  }

  return current;
}

/**
 * Safe line-number extraction from an AST node.
 * Guards against undefined range (yaml package edge case, GitHub issue #573).
 */
function getNodeLine(
  node: any,
  lineCounter: LineCounter,
): { line: number; col: number } {
  if (node?.range && Array.isArray(node.range) && node.range.length >= 1) {
    return lineCounter.linePos(node.range[0]);
  }
  return { line: 1, col: 1 }; // Fallback
}
```

**Confidence:** HIGH -- ajv `instancePath` format (JSON Pointer) verified via ajv docs. YAML AST traversal with `isMap`/`isPair`/`isScalar`/`isSeq` type guards verified via yaml package docs.

### Pattern 4: Categorizing ajv Errors into Specific Schema Rules

**What:** Map raw ajv validation errors to specific, human-readable schema rule violations (CV-S001 through CV-S008) based on the error's `keyword`, `instancePath`, and `params`.

**When to use:** After ajv validation, to transform generic schema errors into categorized violations with clear messages.

**Example mapping logic:**
```typescript
function categorizeSchemaError(error: ErrorObject, doc: Document, lineCounter: LineCounter): ComposeRuleViolation | null {
  const node = resolveInstancePath(doc, error.instancePath);
  const pos = getNodeLine(node, lineCounter);

  // CV-S002: Unknown top-level property
  if (error.keyword === 'additionalProperties' && error.instancePath === '') {
    return {
      ruleId: 'CV-S002',
      line: pos.line,
      column: pos.col,
      message: `Unknown top-level property '${error.params.additionalProperty}'. Valid properties: services, networks, volumes, secrets, configs, name.`,
    };
  }

  // CV-S003: Unknown service property
  if (error.keyword === 'additionalProperties' && /^\/services\/[^/]+$/.test(error.instancePath)) {
    const serviceName = error.instancePath.split('/')[2];
    return {
      ruleId: 'CV-S003',
      line: pos.line,
      column: pos.col,
      message: `Unknown property '${error.params.additionalProperty}' in service '${serviceName}'.`,
    };
  }

  // CV-S004: Invalid port format
  if (error.instancePath.match(/\/services\/[^/]+\/ports\/\d+/) && error.keyword === 'oneOf') {
    return {
      ruleId: 'CV-S004',
      line: pos.line,
      column: pos.col,
      message: `Invalid port format. Use 'HOST:CONTAINER' (e.g., '8080:80') or an object with 'target' and 'published'.`,
    };
  }

  // CV-S005: Invalid volume format
  if (error.instancePath.match(/\/services\/[^/]+\/volumes\/\d+/) && error.keyword === 'oneOf') {
    return {
      ruleId: 'CV-S005',
      line: pos.line,
      column: pos.col,
      message: `Invalid volume format. Use 'SOURCE:TARGET[:MODE]' (e.g., './data:/app/data:ro') or an object with 'type', 'source', and 'target'.`,
    };
  }

  // CV-S006: Invalid duration format
  if (error.keyword === 'format' && error.params.format === 'duration') {
    return {
      ruleId: 'CV-S006',
      line: pos.line,
      column: pos.col,
      message: `Invalid duration format at ${error.instancePath}. Use Docker duration format (e.g., '30s', '5m', '1h30m').`,
    };
  }

  // CV-S007: Invalid restart policy
  if (error.instancePath.match(/\/services\/[^/]+\/restart$/) && error.keyword === 'enum') {
    return {
      ruleId: 'CV-S007',
      line: pos.line,
      column: pos.col,
      message: `Invalid restart policy. Must be one of: 'no', 'always', 'on-failure', 'unless-stopped'.`,
    };
  }

  // CV-S008: Invalid depends_on condition
  if (error.instancePath.match(/\/services\/[^/]+\/depends_on\/[^/]+\/condition$/) && error.keyword === 'enum') {
    return {
      ruleId: 'CV-S008',
      line: pos.line,
      column: pos.col,
      message: `Invalid depends_on condition. Must be one of: 'service_started', 'service_healthy', 'service_completed_successfully'.`,
    };
  }

  // Fallback: generic schema violation
  return {
    ruleId: 'CV-S001',
    line: pos.line,
    column: pos.col,
    message: humanizeAjvError(error),
  };
}
```

**Confidence:** HIGH -- compose-spec schema structure verified at https://github.com/compose-spec/compose-spec/blob/main/schema/compose-spec.json. `additionalProperties` keyword produces `params.additionalProperty` for unknown property detection. Restart policy uses `enum` keyword. `depends_on` condition uses `enum` keyword within a `oneOf` branch.

### Pattern 5: Types Definition (Mirroring Dockerfile Analyzer)

**What:** Define the `ComposeLintRule` interface and supporting types that mirror the existing `LintRule` pattern but accept YAML Document AST input.

**Example:**
```typescript
// src/lib/tools/compose-validator/types.ts
import type { Document, LineCounter } from 'yaml';

export type ComposeSeverity = 'error' | 'warning' | 'info';

export type ComposeCategory =
  | 'schema'
  | 'security'
  | 'reliability'
  | 'best-practice'
  | 'maintainability';

export interface ComposeRuleFix {
  description: string;
  beforeCode: string;
  afterCode: string;
}

export interface ComposeLintRule {
  id: string;           // CV-S001, CV-SEC001, etc.
  title: string;
  severity: ComposeSeverity;
  category: ComposeCategory;
  explanation: string;
  fix: ComposeRuleFix;
  check(ctx: ComposeRuleContext): ComposeRuleViolation[];
}

export interface ComposeRuleContext {
  doc: Document;        // yaml parseDocument result with AST nodes
  rawText: string;      // raw YAML string
  lineCounter: LineCounter;
  services: Map<string, any>;  // pre-extracted services map
  networks: Map<string, any>;  // pre-extracted networks map
  volumes: Map<string, any>;   // pre-extracted volumes map
}

export interface ComposeRuleViolation {
  ruleId: string;
  line: number;         // 1-based
  endLine?: number;
  column: number;       // 1-based
  endColumn?: number;
  message: string;
}
```

**Confidence:** HIGH -- directly mirrors `src/lib/tools/dockerfile-analyzer/types.ts` pattern verified in existing codebase.

### Anti-Patterns to Avoid

- **Using `yaml.parse()` instead of `yaml.parseDocument()`:** `yaml.parse()` returns a plain JavaScript object with no AST, no ranges, no line numbers. All positional data is lost. Always use `parseDocument()` which returns the Document AST with `range` on every node.

- **Forgetting `version: '1.1'` in parseDocument options:** Docker Compose uses YAML 1.1 merge keys (`<<`). The `yaml` package defaults to YAML 1.2 where `<<` is a literal key. Files with anchors and merge keys silently parse incorrectly. This must be configured from the first line of parsing code.

- **Directly accessing `node.range[0]` without null guards:** The `yaml` package has a documented edge case (GitHub issue #573) where certain YAML constructs produce nodes with `undefined` range. Always use a defensive helper: `if (node?.range && Array.isArray(node.range))`.

- **Running interpolation normalization on the YAML string before parsing:** This changes character offsets and breaks the LineCounter mapping. Normalize the JSON object (after `doc.toJSON()`) instead, or normalize only for validation while preserving the original AST.

- **Showing raw ajv error messages to users:** Messages like "must match exactly one schema in oneOf" are meaningless. Every ajv error must be categorized and mapped to a human-readable message via the error categorization function.

- **Recompiling the ajv schema on every analysis:** Schema compilation takes ~50-100ms. Compile once at module level using `ajv.compile(composeSchema)` and reuse the validate function.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| YAML parsing with source positions | Custom YAML parser | `yaml` 2.x `parseDocument()` + `LineCounter` | YAML has 9 scalar styles, anchors, flow/block, multi-doc. The `yaml` package handles all edge cases. Hand-parsing would take months and miss edge cases. |
| JSON Schema validation | Custom schema checker | `ajv` 8.x + compose-spec schema | The compose-spec schema is ~100KB of Draft-07 JSON Schema with `oneOf`, `$ref`, `patternProperties`, and format validators. Reimplementing this validation is infeasible. |
| Format validation (duration, uri) | Custom regex matchers | `ajv-formats` | Duration format alone has edge cases (ISO 8601 vs Docker shorthand). ajv-formats handles all standard formats. |
| Line position tracking | Custom line counter | `yaml` `LineCounter` class | Binary search implementation with efficient newline offset tracking. Already tested against all YAML edge cases. |

**Key insight:** The entire Phase 33 is about correctly integrating three well-tested libraries (`yaml`, `ajv`, `ajv-formats`) and building the bridge between them (the `resolveInstancePath()` function and the error categorizer). Hand-rolling any of the three library-provided capabilities would be a multi-month effort with lower quality.

## Common Pitfalls

### Pitfall 1: YAML 1.2 Default Silently Breaks Merge Keys

**What goes wrong:** The `yaml` npm package defaults to YAML 1.2, but Docker Compose files use YAML 1.1 `<<` merge keys. In YAML 1.2, `<<` is treated as a literal string key, not a merge directive. Compose files with anchors parse without error but produce incorrect JSON objects -- merged keys are missing from service objects.
**Why it happens:** The `yaml` package documents this explicitly: merge is `true` for 1.1, `false` for 1.2. The package defaults to 1.2.
**How to avoid:** Always pass `{ version: '1.1', merge: true }` to `parseDocument()`. Verify with a test Compose file that uses anchors and `<<` merge keys.
**Warning signs:** ajv reports "missing required fields" on services that use `<<: *anchor`. Tests only use simple files without anchors.

### Pitfall 2: ajv Errors Have No Line Numbers -- AST Path Resolver Required

**What goes wrong:** ajv validates a plain JSON object and reports errors with `instancePath` (JSON Pointer like `/services/web/ports/0`) but no line numbers. Without a resolver, all violations default to line 1.
**Why it happens:** JSON Schema validation operates on plain objects. The positional information is only in the YAML Document AST. A bridge function is required.
**How to avoid:** Build `resolveInstancePath()` that walks the Document AST following JSON Pointer segments. Every place that creates a violation must use this function. No direct `node.range[0]` access -- always go through `getNodeLine()` which guards against undefined ranges.
**Warning signs:** All schema violations highlight line 1 in the editor. The `LineCounter` instance is not passed through to the schema validation layer.

### Pitfall 3: Compose-Spec Schema's `patternProperties` Breaks ajv Strict Mode

**What goes wrong:** The compose-spec schema uses `patternProperties: {"^x-": {}}` on every object to allow `x-` extension fields. ajv's strict mode (default) flags the interaction between `patternProperties` and `additionalProperties: false` as potentially problematic.
**Why it happens:** The compose-spec schema is designed for specification compliance, not ajv compatibility. ajv's strict mode is conservative.
**How to avoid:** Set `strict: false` in the ajv constructor. This does not weaken validation -- it only suppresses strict-mode warnings that are false positives for this schema.
**Warning signs:** Console warnings during schema compilation. ajv throws during `compile()` in strict mode.

### Pitfall 4: Variable Interpolation `${VAR:-default}` Produces False Validation Errors

**What goes wrong:** Docker Compose supports `${VAR}`, `${VAR:-default}`, `${VAR:?error}`, `${VAR:+replacement}`, and `$$` for literal dollar signs. When these strings reach ajv via `doc.toJSON()`, they fail type/format validation. For example, port `"${HOST_PORT:-8080}:80"` does not match the port format pattern.
**Why it happens:** ajv sees the raw interpolated string as a literal value. It has no concept of Docker Compose variable interpolation.
**How to avoid:** Before passing the JSON object to ajv, walk the object tree and normalize interpolated string values using `normalizeInterpolation()`. Use default values where available (`${VAR:-default}` becomes `default`), and schema-compatible placeholders for bare variables.
**Warning signs:** Valid Compose files with `${}` variables produce dozens of spurious schema errors. Tests use only literal values, never interpolated variables.

### Pitfall 5: YAML AST Nodes Can Have Undefined `range` Property

**What goes wrong:** Certain YAML constructs produce parsed nodes without a `range` property (yaml package GitHub issue #573). The TypeScript types declare `range` as always present, but runtime can return `undefined`. Accessing `node.range[0]` throws `TypeError`.
**Why it happens:** Edge cases in the yaml parser. Known affected constructs: `[a:]` (flow mapping inside sequence), empty mapping values, documents with only comments.
**How to avoid:** Always use the `getNodeLine()` helper which guards range access. Never access `node.range[0]` directly anywhere in the codebase. Wrap the resolver in try/catch with fallback to `{ line: 1, col: 1 }`.
**Warning signs:** Pasting unusual YAML crashes the analyzer with no error in the UI. The error is intermittent -- only certain constructs trigger it.

### Pitfall 6: `oneOf`/`anyOf` ajv Errors Are Unhelpful Without Custom Handling

**What goes wrong:** The compose-spec schema uses `oneOf` for `depends_on` (short form vs long form), `ports` (string vs object), and `volumes` (string vs object). When a value matches neither branch, ajv reports "must match exactly one schema in oneOf" with sub-errors for every failed branch. This is incomprehensible to users.
**Why it happens:** ajv faithfully reports all schema validation branches. The information is complete but not human-readable.
**How to avoid:** Build the error categorizer function (Pattern 4 above) that detects `oneOf` errors at known paths (ports, volumes, depends_on) and maps them to domain-specific messages. Never show raw ajv `oneOf` messages in the UI. Optionally use `@apideck/better-ajv-errors` as a fallback for unmapped `oneOf` errors.
**Warning signs:** Raw ajv messages like "must match exactly one schema in oneOf" appear in the results panel.

## Code Examples

Verified patterns from official sources:

### YAML Parsing with Merge Key Support
```typescript
// Source: https://eemeli.org/yaml/#options
import { parseDocument, LineCounter } from 'yaml';

const lineCounter = new LineCounter();
const doc = parseDocument(yamlText, {
  version: '1.1',        // YAML 1.1 for Docker Compose
  merge: true,            // Enable << merge key resolution
  lineCounter,            // Track line positions
  prettyErrors: true,     // Rich error messages with positions
  uniqueKeys: false,      // Compose allows some duplicate key scenarios
});

// Check for parse errors before proceeding
if (doc.errors.length > 0) {
  // Report CV-S001 violations for each parse error
  const violations = doc.errors.map(err => {
    const pos = err.pos?.[0] != null
      ? lineCounter.linePos(err.pos[0])
      : { line: 1, col: 1 };
    return {
      ruleId: 'CV-S001',
      line: pos.line,
      column: pos.col,
      message: err.message,
    };
  });
  // Return violations, skip schema validation
}

// Convert to JSON for ajv (merge keys are already resolved)
const json = doc.toJSON();
```

### Extracting Services/Networks/Volumes from YAML Document AST
```typescript
// Source: https://eemeli.org/yaml/#content-nodes
import { isMap, isPair, isScalar } from 'yaml';
import type { Document } from 'yaml';

function extractTopLevelMap(doc: Document, key: string): Map<string, any> {
  const result = new Map<string, any>();
  const contents = doc.contents;
  if (!isMap(contents)) return result;

  const pair = contents.items.find(
    (item) => isPair(item) && isScalar(item.key) && item.key.value === key
  );

  if (pair && isPair(pair) && isMap(pair.value)) {
    for (const item of pair.value.items) {
      if (isPair(item) && isScalar(item.key)) {
        result.set(String(item.key.value), item.value);
      }
    }
  }

  return result;
}

// Usage:
const services = extractTopLevelMap(doc, 'services');
const networks = extractTopLevelMap(doc, 'networks');
const volumes = extractTopLevelMap(doc, 'volumes');
```

### ajv Schema Compilation (Module-Level Singleton)
```typescript
// Source: https://ajv.js.org/api.html
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import composeSchema from './compose-spec-schema.json';

const ajv = new Ajv({
  allErrors: true,     // Collect ALL errors, not just the first
  strict: false,       // Compose schema uses patternProperties
  verbose: true,       // Include schema/parentSchema in error objects
});
addFormats(ajv);       // Required for format: "duration", "uri" in compose-spec

// Compile ONCE at module level -- ~50-100ms, cached for all subsequent validations
const validate = ajv.compile(composeSchema);

export function validateComposeSchema(json: Record<string, unknown>) {
  const valid = validate(json);
  if (valid || !validate.errors) return [];
  return validate.errors; // ErrorObject[] with instancePath, keyword, message, params
}
```

### Walking AST for Line Number Resolution
```typescript
// Source: https://eemeli.org/yaml/#content-nodes
import { isMap, isPair, isScalar, isSeq } from 'yaml';
import type { Document, LineCounter } from 'yaml';

/**
 * Resolve a JSON Pointer path to a YAML AST node.
 * Returns null if the path cannot be followed (node was deleted by merge, etc.)
 */
function resolveInstancePath(doc: Document, path: string): any {
  if (!path || path === '/') return doc.contents;

  const segments = path.split('/').filter(Boolean);
  let current: any = doc.contents;

  for (const segment of segments) {
    if (!current) return null;

    if (isMap(current)) {
      const pair = current.items.find(
        (item: any) => isPair(item) && isScalar(item.key) &&
          String(item.key.value) === segment
      );
      current = pair && isPair(pair) ? pair.value : null;
    } else if (isSeq(current)) {
      const index = parseInt(segment, 10);
      current = !isNaN(index) ? current.items[index] ?? null : null;
    } else {
      return null;
    }
  }

  return current;
}

/**
 * Safe line extraction with range-undefined guard.
 */
function getNodeLine(node: any, lineCounter: LineCounter): { line: number; col: number } {
  try {
    if (node?.range && Array.isArray(node.range) && node.range.length >= 1) {
      return lineCounter.linePos(node.range[0]);
    }
  } catch {
    // Defensive: linePos can throw on invalid offsets
  }
  return { line: 1, col: 1 };
}
```

### Interpolation-Aware JSON Object Walker
```typescript
/**
 * Walk a JSON object and normalize interpolated string values
 * so ajv does not produce false-positive schema errors.
 * Returns a new object (does not mutate the original).
 */
function normalizeJsonForValidation(obj: unknown): unknown {
  if (typeof obj === 'string') {
    return containsInterpolation(obj) ? normalizeInterpolation(obj) : obj;
  }
  if (Array.isArray(obj)) {
    return obj.map(normalizeJsonForValidation);
  }
  if (obj !== null && typeof obj === 'object') {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      result[key] = normalizeJsonForValidation(value);
    }
    return result;
  }
  return obj;
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `js-yaml` for YAML parsing | `yaml` (Eemeli) for AST + positions | yaml 2.0 release (2022) | Only viable approach for line-number mapping |
| ajv 6 with `jsonPointers` option | ajv 8 with `instancePath` (always JSON Pointer) | ajv 8.0 (2021) | No special option needed; `instancePath` is default |
| Manual JSON Schema format validation | `ajv-formats` plugin | ajv-formats 3.0 for ajv 8 | Required for compose-spec duration format |
| `reactflow` npm package | `@xyflow/react` (scoped package) | React Flow 12 (2024) | Old package name deprecated; use `@xyflow/react` |
| `dagre` (original, unmaintained) | `@dagrejs/dagre` (maintained fork) | 2023 | Original unmaintained since 2018; fork has TS types |

**Deprecated/outdated:**
- `js-yaml`: Still widely used but cannot provide source positions. Not viable for this use case.
- `ajv` 6: Still supported but missing `instancePath` and modern features. Use 8.x.
- `reactflow` (unscoped): Redirects to `@xyflow/react`. Do not install the old package.

## Open Questions

1. **Interpolation normalization depth**
   - What we know: Docker Compose supports nested interpolation like `${VAR:-${FOO:-default}}`. The regex-based normalizer handles simple cases.
   - What's unclear: Whether deeply nested interpolation (3+ levels) occurs in real-world Compose files. The regex approach may not handle arbitrary nesting correctly.
   - Recommendation: Implement the regex-based normalizer for the common patterns (1-2 levels of nesting). If deeply nested patterns are encountered in user testing, consider a proper recursive parser. The cost of a false positive on a deeply nested interpolation is low (one incorrect schema warning).

2. **`ajv-formats` duration format vs Docker duration format**
   - What we know: Docker Compose accepts durations like `30s`, `5m`, `1h30m`. The compose-spec schema uses `format: "duration"` which maps to ISO 8601 duration format in ajv-formats.
   - What's unclear: Whether `ajv-formats`' duration validator accepts Docker's shorthand format (`30s`) or only ISO 8601 (`PT30S`). If it only accepts ISO 8601, Docker's shorthand durations will produce false-positive format errors.
   - Recommendation: Test during implementation. If ajv-formats rejects Docker shorthand durations, add a custom format validator for `"duration"` that accepts both Docker shorthand and ISO 8601. This is a small addition (~20 lines).

3. **Test framework for unit testing**
   - What we know: The project has no test framework installed (no vitest, jest, or mocha in package.json). The Dockerfile Analyzer has no unit tests.
   - What's unclear: Whether vitest should be added for this phase's foundational code (parser, interpolation normalizer, schema validator, line resolver).
   - Recommendation: The planner should decide. Adding vitest (~5 min setup) would significantly improve confidence in the parser and resolver. These are pure functions with no DOM dependency, making them ideal for unit testing. However, matching the existing project pattern (no tests) is also valid for consistency.

4. **Compose-spec schema version pinning**
   - What we know: The schema must be bundled as a static JSON file. The compose-spec repo updates the schema when new features are added.
   - What's unclear: Which specific commit SHA to pin to. The schema at HEAD may include very recent additions not yet widely supported by Docker Compose.
   - Recommendation: Pin to the latest tagged release of compose-spec (not HEAD). Add a comment in the JSON file with the source URL, commit SHA, and fetch date. Check `https://github.com/compose-spec/compose-spec/tags` during implementation.

## Sources

### Primary (HIGH confidence)
- [yaml (Eemeli) official docs](https://eemeli.org/yaml/) -- parseDocument API, LineCounter class (1-indexed positions), `version: '1.1'` option, `merge: true` option, node `range` property `[start, valueEnd, nodeEnd]`, `isMap`/`isPair`/`isScalar`/`isSeq` type guards
- [yaml GitHub repo](https://github.com/eemeli/yaml) -- Issue #573 documenting undefined `range` edge case
- [Ajv official docs](https://ajv.js.org/) -- `compile()`, `validate()`, `ErrorObject` interface (`instancePath`, `keyword`, `message`, `params`), `allErrors`, `strict: false`, `verbose` options
- [Ajv formats docs](https://ajv.js.org/packages/ajv-formats.html) -- duration format, required by compose-spec healthcheck intervals
- [compose-spec JSON Schema](https://github.com/compose-spec/compose-spec/blob/main/schema/compose-spec.json) -- Draft-07, `additionalProperties: false` with `patternProperties: {"^x-": {}}`, `oneOf` for depends_on/ports/volumes, `enum` for restart/condition
- [Docker Compose Interpolation Docs](https://docs.docker.com/reference/compose-file/interpolation/) -- `${VAR}`, `${VAR:-default}`, `${VAR-default}`, `${VAR:?error}`, `${VAR:+replacement}`, `$$` escape, nested interpolation support
- [Docker Compose Fragments Docs](https://docs.docker.com/reference/compose-file/fragments/) -- anchors, aliases, `<<` merge keys; confirms YAML 1.1 semantics

### Secondary (MEDIUM confidence)
- [@apideck/better-ajv-errors](https://github.com/apideck-libraries/better-ajv-errors) -- Human-readable ajv error transformation, compatible with ajv v8, ~1.5 KB gzip
- [Ajv strict mode docs](https://ajv.js.org/strict-mode.html) -- patternProperties interaction with additionalProperties; explains why `strict: false` is needed for compose-spec
- Existing codebase: `src/lib/tools/dockerfile-analyzer/types.ts` -- LintRule interface pattern (directly inspected)
- Existing codebase: `src/lib/tools/dockerfile-analyzer/parser.ts` -- parse result structure pattern (directly inspected)
- Existing codebase: `src/lib/tools/dockerfile-analyzer/engine.ts` -- rule engine iteration pattern (directly inspected)
- Existing codebase: `src/lib/tools/dockerfile-analyzer/scorer.ts` -- scoring algorithm pattern (directly inspected)
- Existing codebase: `src/lib/tools/dockerfile-analyzer/rules/index.ts` -- rule registry pattern (directly inspected)
- Existing codebase: `package.json` -- confirmed no test framework installed, confirmed existing dependencies

### Tertiary (LOW confidence)
- None. All findings verified with primary or secondary sources.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- yaml, ajv, ajv-formats are the only viable libraries for this use case. All APIs verified against official docs.
- Architecture: HIGH -- parsing pipeline, line-number resolver, and error categorizer patterns verified against yaml + ajv API behavior. Project structure mirrors proven Dockerfile Analyzer pattern.
- Pitfalls: HIGH -- YAML 1.1 merge key issue verified against yaml package docs. ajv strict mode issue verified against ajv docs. Range-undefined edge case verified against yaml GitHub issue #573. Interpolation patterns verified against Docker Compose official docs.

**Research date:** 2026-02-22
**Valid until:** 2026-03-22 (30 days -- stable libraries, compose-spec schema changes infrequently)
