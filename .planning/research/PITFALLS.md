# Pitfalls Research: Docker Compose Validator

**Domain:** Adding a browser-based Docker Compose validation tool with interactive graph visualization to an existing Astro 5 portfolio site
**Researched:** 2026-02-22
**Confidence:** HIGH (verified against codebase analysis, yaml npm package docs, compose-spec JSON Schema source, React Flow/xyflow documentation, ajv documentation, existing Dockerfile Analyzer patterns)

**Context:** This is a SUBSEQUENT milestone pitfalls document for v1.6. The site (patrykgolabek.dev) already has 180 requirements across 6 milestones, including a Dockerfile Analyzer (v1.4) that solved CodeMirror lifecycle with View Transitions, React island hydration via `client:only="react"`, and Buffer polyfill for browser. The Compose Validator introduces three new classes of complexity: (1) YAML AST parsing with line number tracking, (2) JSON Schema validation via ajv against the compose-spec schema, and (3) interactive graph visualization with React Flow for service dependency graphs. Each of these intersects with each other and with the existing Astro architecture in non-obvious ways.

---

## Critical Pitfalls

### Pitfall 1: YAML Version Mismatch Silently Breaks Merge Key and Anchor Resolution

**What goes wrong:**
The `yaml` npm package defaults to YAML 1.2, but Docker Compose files rely heavily on YAML 1.1 features -- specifically the `<<` merge key for DRY configuration. In YAML 1.2, `<<` is not a special key; it is treated as a literal string key in a mapping. This means a Compose file using anchors and merge keys like this:

```yaml
x-common: &common
  restart: always
  networks:
    - backend

services:
  api:
    <<: *common
    image: api:latest
```

...will parse without error in YAML 1.2 mode, but the merged keys (`restart`, `networks`) will NOT be present on the `api` service object. Instead, `api` will have a key literally named `<<` with the alias value. When this parsed object is then validated against the compose-spec JSON Schema, ajv will report `api` as missing required fields or having unknown properties -- producing misleading validation errors that point to the wrong problem.

**Why it happens:**
The `yaml` npm package explicitly documents: "The `merge` option enables `<<` merge keys (a YAML 1.1 feature). Default is `true` for version 1.1, `false` for 1.2." Since the package defaults to YAML 1.2, merge key resolution is off by default. Developers who test with simple Compose files (no anchors) will never encounter this. It surfaces only when users paste real-world production Compose files that use `x-` extension fields with anchors.

**How to avoid:**
Configure `parseDocument` explicitly for Docker Compose's YAML dialect:

```typescript
import { parseDocument, LineCounter } from 'yaml';

const lineCounter = new LineCounter();
const doc = parseDocument(yamlText, {
  version: '1.1',        // Docker Compose uses YAML 1.1 semantics
  merge: true,            // Enable << merge key resolution
  lineCounter,            // Track line positions for error mapping
  prettyErrors: true,     // Include line/col in parse errors
  uniqueKeys: false,      // Compose allows duplicate keys in some contexts
});
```

Do NOT use `yaml.parse()` (the convenience function) -- it discards the AST document node and line position data needed for CodeMirror annotations.

**Warning signs:**
- Compose files with `x-` extension anchors produce unexpected ajv validation errors
- Tests use only simple Compose files without anchors or merge keys
- The `yaml` import does not pass `version: '1.1'` or `merge: true`
- Users report "missing required property" errors on services that clearly use `<<: *anchor`

**Phase to address:**
YAML parsing infrastructure phase (Phase 1). This is a configuration decision that must be correct from the first line of parsing code. Retrofitting it later means re-testing every validation rule against anchor-heavy files.

---

### Pitfall 2: YAML-to-JSON Lossy Conversion Destroys Line Number Mapping for CodeMirror Annotations

**What goes wrong:**
The validation pipeline has three steps: (1) parse YAML to AST, (2) convert to plain JS object for ajv validation, (3) map ajv errors back to YAML source lines for CodeMirror annotations. Step 2 loses all positional information. The `yaml` package's `doc.toJSON()` produces a plain object with no line numbers. When ajv reports an error at JSON path `/services/api/ports/0`, there is no built-in way to map that back to the line in the YAML source where `ports:` appears.

The Dockerfile Analyzer did not face this problem because `dockerfile-ast` nodes retain line/column properties directly. YAML-to-JSON-Schema validation introduces a fundamentally different error mapping architecture.

**Why it happens:**
JSON Schema validation (ajv) operates on plain JavaScript objects, not YAML AST nodes. The conversion to JSON is necessary but destructive -- it strips comments, anchors, merge key resolution metadata, and most importantly, source positions. Rebuilding the path-to-line mapping requires walking the YAML AST document in parallel with the JSON path from each ajv error.

**How to avoid:**
Build an explicit JSON-path-to-YAML-line resolver that walks the parsed YAML Document AST:

```typescript
import { Document, isMap, isSeq, isPair, isScalar } from 'yaml';

function resolveJsonPathToLine(
  doc: Document,
  jsonPath: string,
  lineCounter: LineCounter
): { line: number; col: number } | null {
  // Split "/services/api/ports/0" into ["services", "api", "ports", "0"]
  const segments = jsonPath.replace(/^\//, '').split('/');
  let node = doc.contents;

  for (const segment of segments) {
    if (isMap(node)) {
      const pair = node.items.find(
        (item) => isPair(item) && isScalar(item.key) && String(item.key.value) === segment
      );
      if (!pair || !isPair(pair)) return null;
      node = pair.value;
    } else if (isSeq(node)) {
      const index = parseInt(segment, 10);
      if (isNaN(index) || index >= node.items.length) return null;
      node = node.items[index];
    } else {
      return null;
    }
  }

  if (node && node.range) {
    return lineCounter.linePos(node.range[0]);
  }
  return null; // Fallback: node has no range (known yaml package edge case)
}
```

Store the `LineCounter` instance from parsing and pass it through the entire validation pipeline. Every ajv error must be mapped through this resolver before being converted to a CodeMirror `Diagnostic`.

**Warning signs:**
- All ajv validation errors highlight line 1 in the editor (the fallback position)
- `doc.toJSON()` is called but no reference to the original Document AST is retained
- The `LineCounter` is created in parsing code but not passed to the validation or annotation layer
- Clicking an error in the results panel does not scroll to the correct line

**Phase to address:**
YAML parsing infrastructure phase (Phase 1) for the resolver function. Annotation integration phase (Phase 2-3) for CodeMirror diagnostics. These are tightly coupled -- the resolver API must be designed before annotation code consumes it.

---

### Pitfall 3: Compose-Spec JSON Schema Has Structural Quirks That Break Default ajv Configuration

**What goes wrong:**
The official compose-spec JSON Schema (`compose-spec.json` from `compose-spec/compose-spec`) uses JSON Schema Draft-07, which ajv supports. However, the schema has several structural patterns that cause problems with ajv's default configuration:

1. **`patternProperties` with `^x-`**: Every Compose object allows extension fields prefixed with `x-`. The schema uses `patternProperties: {"^x-": {}}` to permit these. With ajv's strict mode enabled (the default), this triggers warnings or errors because `patternProperties` interacts with `additionalProperties: false` in ways that strict mode flags.

2. **Complex `oneOf`/`anyOf` unions**: The `depends_on` property supports both a simple string array (`["db", "redis"]`) and an object form (`{db: {condition: "service_healthy"}}`). The schema uses `oneOf` to express this, but ajv's error messages for `oneOf` failures are notoriously unhelpful -- they list every branch that failed without indicating which branch the user likely intended.

3. **`$ref` chains**: The schema uses internal `$ref` extensively (e.g., service definitions reference shared definitions for volumes, networks, etc.). ajv resolves these at compile time, but the resulting error paths include the resolved definition paths, not the original document paths.

4. **Mixed type fields**: Many Compose properties accept `["string", "number"]` or `["string", "boolean"]` -- for example, `ports` can be strings ("8080:80") or objects. This produces confusing validation errors when the user's value does not match either type.

5. **Format validators**: The schema uses `format: "duration"` for healthcheck intervals, which requires `ajv-formats` to be installed and configured. Without it, format validation is silently skipped.

**Why it happens:**
The compose-spec schema was designed for specification compliance validation, not for user-friendly error reporting. It is maximally correct but minimally helpful. ajv faithfully validates against it but produces error messages that require expert interpretation.

**How to avoid:**
1. Disable strict mode for the compose-spec schema specifically:

```typescript
import Ajv from 'ajv';
import addFormats from 'ajv-formats';

const ajv = new Ajv({
  strict: false,              // Compose schema uses patterns strict mode dislikes
  allErrors: true,            // Collect ALL errors, not just the first
  verbose: true,              // Include schema and data in error objects
  discriminator: true,        // Better oneOf matching
});
addFormats(ajv);
```

2. Post-process ajv errors to produce human-readable messages. Do NOT show raw ajv error messages to users. Map each `instancePath` + `keyword` combination to a domain-specific message:

```typescript
// Raw ajv: { instancePath: '/services/api/ports/0', keyword: 'oneOf', message: 'must match exactly one schema in oneOf' }
// Mapped: "Port '8080' is ambiguous. Use format '8080:80' (host:container) or an object with 'target' and 'published' fields."
```

3. Use ajv's `validateSchema: false` option if the compose-spec schema itself triggers validation warnings (it should not, but some draft-07 constructs are edge cases).

4. Pre-compile the schema at build time or on first use, cache the compiled validator function. Schema compilation is expensive (~50-100ms) and should not happen on every analysis click.

**Warning signs:**
- Raw ajv error messages like "must match exactly one schema in oneOf" appear in the UI
- Strict mode errors appear in the browser console during schema compilation
- Format validation for durations or URIs silently passes invalid values
- Schema compilation runs on every analysis button click (visible lag)

**Phase to address:**
Schema validation infrastructure phase (Phase 2). ajv configuration must be finalized before any validation rules are written that depend on schema error output format.

---

### Pitfall 4: React Flow SSR Crash and Bundle Size Explosion in Astro Island

**What goes wrong:**
React Flow (`@xyflow/react`) requires DOM APIs (window, document, ResizeObserver) that do not exist during server-side rendering. In Astro, even `client:load` attempts to SSR the component first, which crashes React Flow. The existing Dockerfile Analyzer already solved a similar problem by using `client:only="react"`, but React Flow introduces a new concern: bundle size.

React Flow v12 (`@xyflow/react`) is approximately 200-250KB minified (before gzip). Combined with the existing Dockerfile Analyzer's CodeMirror bundle (~192KB client-side as noted in the v1.5 architecture research), the Compose Validator page will ship a significantly larger client bundle than any other page on the site. If dagre is added for layout, that adds another ~30KB. The total client-side JavaScript for this page could reach 400-500KB, far exceeding the Lighthouse performance thresholds that the site maintains at 90+.

Additionally, React Flow requires its CSS stylesheet to be imported. In Astro's `client:only` islands, CSS imports from npm packages can behave unexpectedly -- they may not be extracted and optimized by Vite's CSS pipeline the same way they would in a full SPA.

**Why it happens:**
The Dockerfile Analyzer's client bundle is dominated by CodeMirror (~100KB) and React (~40KB). React Flow adds a second heavy library to the same island. Since both the editor and the graph live in the same React island (they share state -- clicking a service in the graph should highlight it in the editor), they cannot be separate islands without a cross-island state synchronization mechanism.

**How to avoid:**
1. Use `client:only="react"` (proven pattern from Dockerfile Analyzer). Do NOT use `client:load` or `client:visible` -- both attempt SSR.

2. Lazy-load React Flow. The graph is not visible until the user analyzes a Compose file. Use `React.lazy()` with dynamic import:

```typescript
const DependencyGraph = React.lazy(() => import('./DependencyGraph'));

// In the component:
{showGraph && (
  <Suspense fallback={<GraphSkeleton />}>
    <DependencyGraph nodes={nodes} edges={edges} />
  </Suspense>
)}
```

This splits React Flow into a separate chunk that only loads when the graph tab is activated, keeping the initial page load fast.

3. Import React Flow CSS in the lazy-loaded component, not at the top level:

```typescript
// Inside DependencyGraph.tsx
import '@xyflow/react/dist/style.css';
```

4. Consider `@xyflow/react`'s tree-shaking capabilities. Import only the components you need:

```typescript
import { ReactFlow, Background, Controls } from '@xyflow/react';
// NOT: import ReactFlow from '@xyflow/react'; (pulls everything)
```

5. Measure the final bundle with `npx vite-bundle-visualizer` after integration. Set a budget: the Compose Validator page's total JS should not exceed 350KB gzipped.

**Warning signs:**
- Lighthouse Performance score drops below 90 on the Compose Validator page
- Browser console shows "window is not defined" or "document is not defined" errors
- React Flow CSS does not render (nodes appear as unstyled divs)
- Initial page load transfers >500KB of JavaScript before user interaction

**Phase to address:**
React island architecture phase (Phase 1-2). The `client:only` directive and lazy loading strategy must be decided before any React Flow code is written. Bundle size measurement is a verification gate at the end of the graph visualization phase.

---

### Pitfall 5: Variable Interpolation Syntax `${VAR:-default}` Treated as YAML Content Instead of Docker Compose Tokens

**What goes wrong:**
Docker Compose supports Bash-like variable interpolation (`${VAR}`, `${VAR:-default}`, `${VAR:?error}`, `${VAR:+replacement}`, and `$$` for literal dollar signs). The `yaml` npm package correctly parses these as string values (they are just strings in YAML). However, the validator must understand that these are NOT literal values -- they are templates that will be resolved at runtime by Docker Compose.

This creates three specific problems:

1. **Schema validation false positives**: A port mapping `"${HOST_PORT:-8080}:80"` is a valid Compose port, but if the validator tries to parse port numbers from the literal string, it will fail. Similarly, `"${POSTGRES_VERSION:-16}"` as an image tag is valid but un-parseable as a version number.

2. **Semantic rule false positives**: A security rule checking for hardcoded secrets will flag `DB_PASSWORD: ${DB_PASSWORD}` as "variable references environment variable" but cannot determine if the actual value is hardcoded in a `.env` file. Meanwhile, `DB_PASSWORD: supersecret123` IS a hardcoded secret, but both look like string scalars to the YAML parser.

3. **Nested interpolation**: Docker Compose supports `${VARIABLE:-${FOO:-default}}`. The validator must not attempt to parse the inner `${...}` as a separate expression when the outer one is already being handled.

**Why it happens:**
The Dockerfile Analyzer did not face this problem because Dockerfiles have no variable interpolation syntax at the YAML level (ARG/ENV variables are Dockerfile instructions, not YAML constructs). The Compose Validator operates at a higher abstraction level where the raw YAML content includes runtime template syntax.

**How to avoid:**
1. Build an interpolation-aware value normalizer that runs BEFORE schema validation and semantic analysis:

```typescript
const INTERPOLATION_REGEX = /\$\{([^}]+)\}|\$([A-Za-z_][A-Za-z0-9_]*)/g;

function containsInterpolation(value: string): boolean {
  return INTERPOLATION_REGEX.test(value);
}

function resolveInterpolationForValidation(value: string): string {
  // Replace ${VAR:-default} with just "default" for validation purposes
  // Replace ${VAR} with a placeholder that passes schema validation
  return value.replace(/\$\{([^:}]+):-([^}]+)\}/g, '$2')
              .replace(/\$\{([^:}]+):?\?[^}]*\}/g, 'placeholder')
              .replace(/\$\{([^}]+)\}/g, 'placeholder')
              .replace(/\$([A-Za-z_][A-Za-z0-9_]*)/g, 'placeholder');
}
```

2. Tag interpolated values in semantic analysis so rules can distinguish between "definitely hardcoded" and "might be a variable reference."

3. Do NOT attempt to validate the interpolated value itself -- only validate the structure around it. For example, `"${PORT}:80"` has valid port mapping structure even if `${PORT}` is unknown.

**Warning signs:**
- Valid Compose files with `${}` variables produce dozens of spurious validation errors
- Port mapping rules fail on `"${PORT}:80"` with "invalid port number"
- Security rules cannot distinguish `password: ${SECRET}` from `password: hardcoded123`
- Tests use only literal values, never interpolated variables

**Phase to address:**
YAML parsing and normalization phase (Phase 1). The interpolation handler must exist before schema validation or semantic rules are written, because it affects what data both systems receive.

---

### Pitfall 6: YAML AST Nodes Can Have Undefined `range` Property, Crashing the Line Number Resolver

**What goes wrong:**
The `yaml` npm package has a documented bug (GitHub issue #573) where certain YAML constructs produce parsed nodes without a `range` property, even when the document parses successfully. The specific case documented is `[a:]` (a flow mapping inside a sequence), but similar edge cases exist for:

- Empty mapping values (bare keys with no value)
- Flow sequences with complex nested structures
- Documents with only comments and no content nodes
- Alias nodes (`*anchor`) when the anchor definition is malformed

When the line number resolver (from Pitfall 2) calls `node.range[0]` on such a node, it throws `TypeError: Cannot read properties of undefined (reading '0')`. This crashes the entire validation pipeline for that Compose file.

**Why it happens:**
The `yaml` package's TypeScript types declare `range` as `[number, number, number]` on Node, but the runtime implementation can return `undefined` in edge cases. The types do not reflect this, so TypeScript will not catch the error at compile time.

**How to avoid:**
1. Always guard `range` access with a null check:

```typescript
function getNodeLine(node: any, lineCounter: LineCounter): number {
  if (node?.range && Array.isArray(node.range) && node.range.length >= 1) {
    const pos = lineCounter.linePos(node.range[0]);
    return pos.line;
  }
  return 1; // Fallback to line 1 if range unavailable
}
```

2. Add a unit test specifically for the `[a:]` edge case and other known range-less nodes.

3. Wrap the entire JSON-path-to-line resolver in a try/catch that falls back to line 1 rather than crashing the analysis.

4. Log a console warning (dev-only) when a node lacks a range so edge cases can be identified and reported upstream.

**Warning signs:**
- Pasting unusual YAML constructs crashes the analyzer with no error message in the UI
- TypeScript compiles without error but runtime throws on `node.range[0]`
- The error is intermittent -- only certain Compose files trigger it
- The crash prevents ALL validation results from appearing, not just the affected line

**Phase to address:**
YAML parsing infrastructure phase (Phase 1). The `getNodeLine` helper with defensive checks must be the ONLY way any code accesses node positions. No direct `node.range[0]` access anywhere.

---

### Pitfall 7: Compose-Spec `version` Field Produces Confusing Validator Behavior

**What goes wrong:**
The `version` field in Docker Compose files is officially deprecated and obsolete. Docker Compose v2+ ignores it entirely and validates against the current Compose Specification regardless of what `version` says. However, the vast majority of existing Compose files in the wild still include `version: "3.8"` or similar. This creates a UX trap:

1. If the validator warns about the deprecated `version` field, users who do not know it is deprecated will be confused -- "but all my Compose files have this!"
2. If the validator does NOT warn about `version`, it misses an opportunity to educate users about modern Compose practices.
3. If the validator uses the `version` field to determine which schema to validate against (v2 schema vs v3 schema vs unified spec), it replicates the very complexity Docker Compose abandoned.

Additionally, files with `version: "2"` or `version: "2.1"` may use features that exist in v2 but are structured differently in the unified spec (e.g., `depends_on` with conditions was added differently in v2 vs v3 vs unified). Validating a v2 file against the unified spec may produce false positives.

**Why it happens:**
The compose-spec schema marks `version` as a deprecated string property. The schema validates any Compose file against the unified specification regardless of the version field. But user expectations are shaped by years of Docker Compose documentation that treated version as a critical field.

**How to avoid:**
1. Always validate against the unified Compose Specification schema, regardless of the `version` field value. This matches what Docker Compose itself does.

2. Add a specific informational rule (not a warning, not an error) that detects `version` and explains:
   - "The `version` field is obsolete and ignored by Docker Compose v2+. You can safely remove it."
   - Link to Docker's official documentation on this topic.

3. If the `version` field contains a v2.x value AND the file uses v2-only syntax (e.g., `links`, `volume_driver`, `extends` with `file`), surface a specific warning: "This file appears to use Docker Compose v2 syntax which may not be fully compatible with the current Compose Specification."

4. Do NOT build separate validation paths for v2 vs v3 vs unified. This is scope explosion that Docker themselves abandoned.

**Warning signs:**
- The validator has a `switch(version)` statement in validation logic
- Users paste files with `version: "3.8"` and get warnings that confuse rather than help
- The validator rejects valid Compose files because they use v2 syntax
- No test files include the `version` field

**Phase to address:**
Semantic rules phase (Phase 3). The `version` deprecation rule is a specific semantic rule, not a schema validation concern. It should be authored as a named rule with documentation page, consistent with the Dockerfile Analyzer's rule architecture.

---

## Moderate Pitfalls

### Pitfall 8: Dagre Layout Engine Cannot Handle Cycles in `depends_on`

**What goes wrong:**
Docker Compose's `depends_on` can create dependency cycles (A depends on B, B depends on C, C depends on A). Docker Compose itself detects and rejects these. However, dagre (the most common layout engine for React Flow) is designed for DAGs (Directed Acyclic Graphs) and produces unpredictable or infinite-loop behavior when given cyclic edges. The layout computation may hang the browser tab.

Elkjs handles cycles slightly better but is significantly larger (~100KB) and slower than dagre (~30KB).

**Why it happens:**
Dagre's algorithm assumes acyclic input. It does not validate this assumption -- it simply produces wrong output or runs forever. Since the Compose Validator's job is to DETECT cycle issues (as a semantic rule), the graph visualization must render them visually without relying on the layout engine to handle them correctly.

**How to avoid:**
1. Run cycle detection BEFORE layout computation. Use Tarjan's algorithm or simple DFS-based cycle detection on the dependency graph. This is a semantic analysis rule, not a layout concern.

2. If cycles are detected, break them for layout purposes by removing one edge per cycle (visually mark the removed edge as a cycle indicator with a distinct color/style -- red dashed line with a cycle icon).

3. Alternatively, use a force-directed layout (d3-force) instead of dagre for graphs with cycles. Force-directed layouts handle cycles gracefully because they do not assume DAG structure. However, they produce less visually organized results for tree-like graphs.

4. Set a timeout on the layout computation. If dagre does not return within 500ms, abort and fall back to a simple grid layout.

**Warning signs:**
- The browser tab freezes when analyzing a Compose file with circular `depends_on`
- The graph renders but edges cross chaotically because dagre's cycle-breaking heuristic is insufficient
- No test Compose files include circular dependencies
- The cycle detection semantic rule and the graph visualization are developed independently

**Phase to address:**
Graph visualization phase (Phase 4). Cycle detection must be a shared utility used by both the semantic analysis rules (to report the error) and the graph layout code (to break cycles for rendering).

---

### Pitfall 9: CodeMirror YAML Language Support Uses Lezer Parser, Not `yaml` npm Package

**What goes wrong:**
CodeMirror 6's YAML support (`@codemirror/lang-yaml`) uses the Lezer YAML grammar for syntax highlighting and folding. The `yaml` npm package uses its own parser. These are two completely different parsers with different behaviors. Key mismatches:

1. **Line numbering**: CodeMirror uses 0-based internal positions but 1-based line numbers via `state.doc.line(n)`. The `yaml` package's `LineCounter` produces 1-based `{line, col}`. But the offset systems are different -- CodeMirror counts characters from the start of the document, while `yaml`'s `range` values are byte offsets in the original string.

2. **Error positions**: When the `yaml` parser reports an error at offset 142, converting that to a CodeMirror position requires mapping through `state.doc.line()` -- but only if the document has not been edited since parsing. If the user edits the document and re-analyzes, the offsets shift.

3. **Syntax highlighting vs. semantic errors**: The Lezer parser may highlight syntactically valid YAML differently than the `yaml` package parses it. For example, Lezer may treat `<<:` as a plain key, while the `yaml` package with `merge: true` treats it as a merge key.

**Why it happens:**
The Dockerfile Analyzer avoided this by using a single parser (`dockerfile-ast`) for both analysis and annotation mapping. The Compose Validator uses three parsers: Lezer (CodeMirror highlighting), `yaml` (AST analysis), and ajv (schema validation). Their offset systems do not naturally align.

**How to avoid:**
1. Always re-parse the YAML from `view.state.doc.toString()` on each analysis. Do NOT cache the parsed document across edits.

2. Use character offsets consistently. The `yaml` package's `range` values are character offsets into the original string, which aligns with CodeMirror's `from`/`to` positions in `Diagnostic`. This alignment is correct as long as both operate on the same string.

3. Wrap the offset-to-diagnostic conversion in a validation step:

```typescript
function yamlOffsetToDiagnostic(
  view: EditorView,
  offset: number,
  endOffset: number,
  severity: 'error' | 'warning' | 'info',
  message: string,
): Diagnostic | null {
  const docLength = view.state.doc.length;
  const from = Math.max(0, Math.min(offset, docLength));
  const to = Math.max(from, Math.min(endOffset, docLength));
  if (from === to && from === docLength) return null; // Offset beyond document
  return { from, to, severity, message, source: 'compose-validator' };
}
```

4. Do NOT assume the `yaml` package's character offsets match byte offsets. For documents containing multi-byte UTF-8 characters (common in comments), character offset !== byte offset. JavaScript strings use UTF-16, and `yaml`'s offsets are character-based (matching JavaScript string indexing), which aligns with CodeMirror's character-based positions.

**Warning signs:**
- Squiggly underlines appear on the wrong line or shifted by a few characters
- Annotations work on ASCII-only files but are misaligned on files with emoji or CJK characters in comments
- The same analysis produces different annotation positions on successive runs without document changes

**Phase to address:**
CodeMirror integration phase (Phase 2). The offset-to-diagnostic conversion helper must be tested with multi-byte character documents and re-analysis after edits.

---

### Pitfall 10: Large Compose Files Cause Visible UI Lag from Synchronous Validation Pipeline

**What goes wrong:**
The Dockerfile Analyzer runs analysis synchronously on the main thread. This works because Dockerfiles are small (typically <100 lines) and `dockerfile-ast` parsing is fast (<5ms). Docker Compose files can be significantly larger -- production files with 20+ services, complex network configurations, and extensive environment variables can exceed 500+ lines. The validation pipeline (YAML parse + merge key resolution + JSON conversion + ajv schema validation + semantic analysis + graph layout computation) on a 500-line Compose file can take 100-500ms, causing visible UI jank (dropped frames, unresponsive button).

**Why it happens:**
The Dockerfile Analyzer set the precedent of synchronous, main-thread analysis. The Compose Validator inherits this pattern but adds significantly more computation: YAML parsing is more complex than Dockerfile parsing, ajv schema compilation is expensive (~50-100ms on first run), and graph layout with dagre adds another 50-100ms for 20+ nodes.

**How to avoid:**
1. Cache the compiled ajv validator. Compile the schema once on module load (or on first analysis), not on every click:

```typescript
let compiledValidator: ValidateFunction | null = null;

function getValidator(): ValidateFunction {
  if (!compiledValidator) {
    const ajv = new Ajv({ strict: false, allErrors: true });
    addFormats(ajv);
    compiledValidator = ajv.compile(composeSchema);
  }
  return compiledValidator;
}
```

2. If total analysis time exceeds 100ms on a representative large Compose file, move the analysis pipeline to a Web Worker. The existing `analysisResult` nanostore can receive results via `postMessage`:

```typescript
// Main thread:
worker.postMessage({ type: 'analyze', content: yamlText });
worker.onmessage = (e) => {
  analysisResult.set(e.data.result);
};
```

3. Profile the pipeline on a 500-line Compose file during development. Measure each step: YAML parse, JSON conversion, ajv validation, semantic rules, graph layout. Optimize the slowest step first.

4. Add a loading indicator (spinner or skeleton) during analysis, even if analysis is fast. This prevents the perception of jank if analysis occasionally takes longer than expected.

**Warning signs:**
- Clicking "Analyze" produces a visible freeze before results appear
- Users report the page "hangs" when pasting large Compose files
- Lighthouse Time to Interactive (TTI) degrades
- The "Analyze" button does not show a loading state

**Phase to address:**
Core validation engine phase (Phase 2) for caching the ajv validator. Performance optimization phase (late phase) for Web Worker extraction if needed. The loading indicator should be in the React island architecture from the start (copy the `isAnalyzing` nanostore pattern from the Dockerfile Analyzer).

---

### Pitfall 11: React Flow CSS Conflicts with Site's Quantum Explorer Theme

**What goes wrong:**
React Flow ships its own CSS (`@xyflow/react/dist/style.css`) that includes styles for nodes, edges, handles, controls, and the canvas background. These styles use class names like `.react-flow`, `.react-flow__node`, `.react-flow__edge` and set properties like `background`, `color`, `font-family`, `border`, and `z-index`. Several of these conflict with the site's "Quantum Explorer" theme:

1. React Flow's default light background clashes with the dark theme
2. React Flow's font-family overrides do not match Space Grotesk / Inter / JetBrains Mono
3. React Flow's z-index values may conflict with the particle canvas, floating orbs, or modal overlays
4. React Flow's selection rectangle uses colors that do not match the site's accent color system

**Why it happens:**
React Flow is designed as a standalone component library with its own design system. It does not inherit CSS custom properties from the host page. The site's theme is implemented via CSS custom properties (`--color-accent`, `--color-surface`, etc.), which React Flow does not use.

**How to avoid:**
1. Override React Flow's default styles with a custom theme CSS file specific to the Compose Validator:

```css
.react-flow {
  --xy-background-color: transparent;
  --xy-node-background-color: var(--color-surface, #1a1a2e);
  --xy-node-border-color: var(--color-border, #2a2a4a);
  --xy-node-color: var(--color-text-primary, #e0e0e0);
  --xy-edge-stroke: var(--color-accent, #c44b20);
  font-family: 'Inter', system-ui, sans-serif;
}
```

2. React Flow v12 supports CSS custom properties for theming. Use these instead of overriding class selectors directly.

3. Set `proOptions={{ hideAttribution: false }}` only if using the pro version. For open source, the attribution watermark appears -- plan for this in the layout.

4. Test the graph in both dark and light mode. The site supports both, and React Flow's defaults look different in each.

**Warning signs:**
- The graph area has a white background while the rest of the page is dark
- Node text uses a serif font or a font that does not match the site
- The graph's minimap or controls appear with different styling than the rest of the UI
- z-index issues cause the particle canvas to render over or under the graph

**Phase to address:**
Graph visualization phase (Phase 4). Theme integration is a styling task that should be done alongside the first graph rendering, not deferred to a polish phase.

---

### Pitfall 12: Compose-Spec Schema Evolution Creates a Maintenance Burden

**What goes wrong:**
The Compose Specification is a living document. New features are added periodically (e.g., `models` for AI/ML services was added recently, `include` for sub-projects, `develop` for development-time configuration). The JSON Schema at `compose-spec/compose-spec` on GitHub is updated accordingly. If the validator bundles a static copy of the schema, it will become outdated.

Unlike the Dockerfile Analyzer's rules (which are authored custom content), the compose-spec schema is an external dependency. When Docker adds new Compose features, the validator will incorrectly reject valid files using those features.

**Why it happens:**
Static sites cannot fetch the latest schema at runtime. The schema must be bundled at build time. There is no webhook or notification system for compose-spec schema updates. The maintainer must manually check for updates.

**How to avoid:**
1. Pin a specific commit SHA of the compose-spec schema in the codebase, not just "latest." Document the commit SHA and date in a comment:

```typescript
// compose-spec schema from: https://github.com/compose-spec/compose-spec
// Commit: abc123def (2026-02-15)
// Check for updates: https://github.com/compose-spec/compose-spec/commits/main/schema/compose-spec.json
import composeSchema from '../data/compose-spec.json';
```

2. Add a "Schema version" indicator on the tool page: "Validates against Compose Specification as of February 2026."

3. Consider making schema validation lenient by default: unknown properties produce info-level notices rather than errors. This prevents the validator from rejecting files that use newer Compose features.

4. Add a `"Schema last updated: [date]"` note in the tool's footer.

**Warning signs:**
- The bundled schema has no version indicator or date comment
- The validator rejects Compose files that work with `docker compose config` because they use new features
- No process exists for updating the schema

**Phase to address:**
Data and schema authoring phase (Phase 1) for initial schema bundling with version tracking. Site integration phase for the "last updated" indicator.

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Synchronous analysis on main thread | Simpler code, matches Dockerfile Analyzer pattern | UI jank on large Compose files (500+ lines); blocks user interaction during analysis | MVP only -- extract to Web Worker if profiling shows >100ms analysis time |
| Bundling entire compose-spec schema as JSON | No build-time fetch, no network dependency | Schema becomes stale when compose-spec adds features; 200KB+ of JSON in the bundle | Always acceptable for a static site, but must include version tracking and date indicator |
| Copying `useCodeMirror` hook from Dockerfile Analyzer | Immediate working editor | Two parallel hooks with identical lifecycle management, diverging maintenance | MVP only -- extract a shared `useCodeMirror` hook that accepts a language extension parameter |
| Skipping Web Worker for graph layout | Simpler architecture, less IPC complexity | Browser jank on graphs with 30+ nodes; layout computation blocks main thread | Acceptable until 20+ nodes are common in test files |
| Using dagre over elkjs | 30KB vs 100KB bundle, simpler API | Dagre is unmaintained (last release 2018); no subgraph support; cycle handling is fragile | Acceptable for v1.6 MVP -- dagre is sufficient for typical Compose file dependency graphs (5-15 nodes) |
| Inline compose-spec schema rather than importing from npm | No npm dependency on `compose-spec/compose-spec` (not published as npm package) | Manual update process when schema changes | Always -- the schema is not available as an npm package |

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| yaml + ajv pipeline | Calling `yaml.parse()` instead of `yaml.parseDocument()` | Always use `parseDocument()` to retain AST nodes with range data for line mapping |
| yaml + CodeMirror | Assuming yaml package's character offsets differ from CodeMirror's | Both use JavaScript string character indexing; offsets are compatible as long as both read the same string from `view.state.doc.toString()` |
| ajv error paths + yaml AST | Passing ajv's `instancePath` directly to CodeMirror as a line number | Build a JSON-path-to-YAML-line resolver that walks the Document AST; ajv paths are JSON pointer format (`/services/api/ports/0`) |
| React Flow + Astro | Using `client:load` or `client:visible` instead of `client:only="react"` | Only `client:only` avoids SSR entirely; React Flow crashes during SSR |
| React Flow CSS + site theme | Importing React Flow CSS globally | Import CSS inside the lazy-loaded graph component; override with Quantum Explorer theme custom properties |
| CodeMirror YAML mode + yaml parser | Expecting Lezer YAML grammar and yaml npm package to produce identical parse trees | They are separate parsers; Lezer handles highlighting, yaml handles analysis; accept the duplication |
| Nanostore bridge | Creating new stores instead of reusing Dockerfile Analyzer pattern | Create `composeValidatorStore.ts` mirroring `dockerfileAnalyzerStore.ts` -- separate stores, same architecture |
| View Transitions cleanup | Forgetting to destroy React Flow instance on navigation | Add `astro:before-swap` listener in the `useCodeMirror` hook (already proven) and extend it to destroy the React Flow instance |
| URL state encoding | Using the same URL hash namespace as the Dockerfile Analyzer | Use a different hash prefix or parameter name; both tools should support deep links simultaneously |
| Header navigation | Adding a 9th nav item | Do NOT add a separate "Compose Validator" nav link; it lives under "Tools" alongside the Dockerfile Analyzer |
| Sample compose file | Using a trivially simple example | Include a sample with anchors, merge keys, depends_on, networks, volumes, ports, env vars, and health checks -- exercise ALL rule categories |
| LLMs.txt endpoints | Forgetting to add Compose Validator rule pages | Update both `llms.txt.ts` and `llms-full.txt.ts` with Compose Validator tool page and all rule documentation pages |

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Re-compiling ajv schema on every analysis | 50-100ms delay before validation starts; visible on every click | Compile once, cache the validator function; use module-level `let` | Every analysis click |
| Synchronous YAML parse + ajv validate + dagre layout | UI freezes for 200-500ms on large files | Profile early; extract to Web Worker if >100ms; add loading indicator | Compose files with 20+ services |
| React Flow rendering all nodes on mount | Initial render stutter; graph appears then jumps as layout computes | Use `fitView` after layout completes; show skeleton during layout | Always -- layout is async |
| dagre layout with cycles | Infinite loop or browser tab crash | Run cycle detection before dagre; break cycles for layout | Any Compose file with circular depends_on |
| Importing React Flow at top level of island | 200KB+ loaded on page load before user clicks anything | Lazy-load React Flow with React.lazy() and dynamic import | Always -- graph is below the fold and optional |
| Full compose-spec schema bundled as ES module import | 200KB+ of JSON parsed at module load time | Use dynamic import or lazy loading for the schema JSON | Impacts First Contentful Paint |
| Re-running YAML parse on every keystroke | Parsing 500-line YAML on every character typed | On-demand analysis (button click), NOT real-time -- matches Dockerfile Analyzer pattern | Any attempt at as-you-type validation |

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| Displaying user-pasted secrets in the graph visualization | Service nodes show environment variables including `DB_PASSWORD=actual_secret` | Only show service names, ports, and dependency edges in the graph; never render env var values |
| eval()-based YAML tag resolution | Custom YAML tags can trigger constructor calls; `yaml` package has safe defaults | Use `yaml` package with default settings (safe by default); never enable `customTags` with executable constructors |
| Transmitting Compose file content to a server | Privacy violation; user expectation is client-side only | All parsing, validation, and visualization runs in the browser; no fetch() calls; clearly state "100% client-side" |
| URL state encoding exposes Compose file content | Shared URLs contain the full Compose file, potentially including secrets | Add a warning when users share URLs: "The shared URL contains your Compose file content. Remove sensitive values before sharing." |
| Hardcoded example credentials in sample Compose file | Users copy the sample and deploy with example credentials | Use obviously fake values: `password: change-me-before-deploying`, `POSTGRES_PASSWORD: example-only` |

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Showing raw ajv error messages | "must match exactly one schema in oneOf" is meaningless to users | Map every ajv error to a human-readable message with context-specific fix suggestions |
| Graph appears empty before first analysis | Users think the graph feature is broken | Show a placeholder message: "Analyze a Compose file to see the service dependency graph" |
| Graph and editor are disconnected | Clicking a service in the graph does nothing in the editor | Implement bidirectional navigation: click a graph node to scroll editor to that service; click a service in editor to highlight the graph node |
| No visual distinction between schema errors and semantic warnings | Users cannot prioritize which issues to fix first | Use the same severity + category system as the Dockerfile Analyzer: error/warning/info with color-coded indicators |
| Graph layout jumps after analysis | Nodes appear then rearrange as dagre computes positions | Compute layout before rendering; show a skeleton/spinner during computation; animate nodes to final positions |
| Variable interpolation errors overwhelm real issues | Files with many `${VAR}` references produce dozens of false-positive warnings | Recognize and skip interpolated values during validation; group interpolation notices separately |
| Version deprecation warning feels like an attack on users' existing files | Users feel judged for using `version: "3.8"` | Frame as informational, not warning: "Good to know: The `version` field is optional in modern Docker Compose. Your file works fine with or without it." |
| Tab switching between editor and graph loses context | User analyzes, switches to graph, switches back, loses scroll position in editor | Preserve editor scroll position across tab switches; do not recreate EditorView when toggling visibility |

## "Looks Done But Isn't" Checklist

- [ ] **YAML parsing**: `version: '1.1'` and `merge: true` passed to `parseDocument()` -- without this, anchors and merge keys silently fail
- [ ] **Line number mapping**: Every ajv error and semantic violation maps to a specific YAML source line -- not defaulting to line 1
- [ ] **ajv schema caching**: Schema compiled once and cached, not recompiled on every analysis click -- verify with `console.time()`
- [ ] **Variable interpolation**: Compose files with `${VAR:-default}` syntax do not produce false validation errors -- test with a heavily-interpolated file
- [ ] **Cycle detection**: Compose files with circular `depends_on` produce a clear error message AND the graph renders without hanging -- test with A->B->C->A cycle
- [ ] **React Flow lazy loading**: React Flow JS chunk is NOT in the initial page load -- verify with browser DevTools Network tab
- [ ] **React Flow theme**: Graph renders correctly in both dark and light mode -- test both explicitly
- [ ] **View Transitions**: Navigating away from the Compose Validator and back does not leave orphaned EditorView or React Flow instances -- test with browser DevTools memory snapshot
- [ ] **URL state**: Shared URL reproduces the exact Compose file and analysis results -- test with a file containing special characters, anchors, and multi-byte characters
- [ ] **Sample Compose file**: Exercises ALL rule categories (schema, security, best practice, semantic) and includes anchors, merge keys, depends_on, and interpolated variables
- [ ] **Rule documentation pages**: Every rule has a page at `/tools/compose-validator/rules/[code]` -- count pages in build output
- [ ] **LLMs.txt**: Both `llms.txt.ts` and `llms-full.txt.ts` include Compose Validator tool page and all rule documentation pages
- [ ] **Sitemap**: All new pages appear in `sitemap-index.xml` -- grep build output
- [ ] **CodeMirror annotation accuracy**: Squiggly underlines appear on the correct token, not the entire line -- test with multi-service file where errors are on specific nested keys
- [ ] **Graph node dimensions**: React Flow nodes have measured dimensions before dagre layout runs -- verify nodes are not all 0x0 pixels
- [ ] **Bundle size**: Total JS for the Compose Validator page < 350KB gzipped -- measure with `npx vite-bundle-visualizer`

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| YAML 1.2 default breaks merge keys (P1) | LOW | Add `version: '1.1', merge: true` to parseDocument options; re-test all anchor-using files |
| Line mapping broken (P2) | MEDIUM | Build JSON-path-to-line resolver; requires touching every place that creates CodeMirror Diagnostics |
| ajv configuration wrong (P3) | LOW | Fix ajv constructor options; recompile schema; rebuild error message mapper |
| React Flow SSR crash (P4) | LOW | Switch to `client:only="react"` (proven fix from Dockerfile Analyzer) |
| Variable interpolation false positives (P5) | MEDIUM | Build interpolation normalizer; retrofit into parsing pipeline; re-test all semantic rules |
| Node range undefined crash (P6) | LOW | Add null guard to every `node.range` access; wrap resolver in try/catch |
| Version field confusion (P7) | LOW | Add informational rule with friendly copy; adjust severity from warning to info |
| Dagre cycle hang (P8) | MEDIUM | Add cycle detection before layout; implement cycle-breaking logic; add timeout |
| CodeMirror offset mismatch (P9) | MEDIUM | Audit all offset conversion code; add multi-byte character test cases |
| Performance jank (P10) | HIGH | Extract validation pipeline to Web Worker; requires IPC bridge, message serialization |
| React Flow CSS conflicts (P11) | LOW | Add CSS override file; map React Flow variables to site custom properties |
| Schema staleness (P12) | LOW | Update bundled JSON; rebuild; deploy -- but requires knowing updates exist |

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| YAML 1.1 / merge key config (P1) | Phase 1: YAML parsing infrastructure | Unit test with anchor+merge-key Compose file; merged values appear on service objects |
| Line number mapping (P2) | Phase 1-2: YAML parsing + CodeMirror integration | Click-to-navigate from results panel jumps to correct line for every error type |
| ajv configuration (P3) | Phase 2: Schema validation infrastructure | Compose files with `x-` extensions, complex ports, and depends_on variants validate correctly |
| React Flow SSR + bundle (P4) | Phase 1: React island architecture | `client:only="react"` in Astro page; React Flow in separate lazy chunk; Lighthouse 90+ |
| Variable interpolation (P5) | Phase 1: YAML parsing and normalization | Compose file with 10+ `${VAR:-default}` expressions produces zero false positives |
| Node range undefined (P6) | Phase 1: YAML parsing infrastructure | Edge case `[a:]` and empty-value YAML constructs do not crash analysis |
| Version field UX (P7) | Phase 3: Semantic rules | `version: "3.8"` produces info-level notice, not warning/error; copy is friendly |
| Dagre cycle handling (P8) | Phase 4: Graph visualization | Circular depends_on file renders graph without hang; cycle edges visually distinct |
| CodeMirror offset alignment (P9) | Phase 2: CodeMirror integration | Annotations on file with emoji in comments appear at correct positions |
| Performance (P10) | Phase 2: Core validation engine | Analysis of 500-line file completes in <200ms; loading indicator visible |
| React Flow theme (P11) | Phase 4: Graph visualization | Graph matches site theme in both dark and light mode |
| Schema maintenance (P12) | Phase 1: Data authoring | Schema JSON has version comment; tool page shows "validates against [date] spec" |

## Sources

- [yaml npm package documentation](https://eemeli.org/yaml/) -- parseDocument options, LineCounter, merge key behavior, YAML 1.1 vs 1.2 defaults (HIGH confidence)
- [yaml GitHub Issue #573: Node without range](https://github.com/eemeli/yaml/issues/573) -- confirmed edge case where parsed nodes lack range property (HIGH confidence)
- [The YAML Document from Hell - JavaScript Edition](https://philna.sh/blog/2023/02/02/yaml-document-from-hell-javascript-edition/) -- YAML parsing edge cases: Norway problem, sexagesimal numbers, accidental types (HIGH confidence)
- [Docker Compose Interpolation Docs](https://docs.docker.com/reference/compose-file/interpolation/) -- variable substitution syntax: `${VAR:-default}`, `${VAR:?error}`, nesting, `$$` escaping (HIGH confidence)
- [Docker Compose Fragments Docs](https://docs.docker.com/reference/compose-file/fragments/) -- anchors, aliases, merge keys in Compose context; anchor resolution before interpolation (HIGH confidence)
- [Docker Compose Version and Name Docs](https://docs.docker.com/reference/compose-file/version-and-name/) -- version field is obsolete, Compose Specification is rolling (HIGH confidence)
- [compose-spec/compose-spec schema](https://github.com/compose-spec/compose-spec/blob/main/schema/compose-spec.json) -- Draft-07, patternProperties for x- extensions, oneOf for depends_on variants (HIGH confidence)
- [Ajv JSON Schema Validator](https://ajv.js.org/) -- strict mode, allErrors, format validation, standalone code generation, browser support (HIGH confidence)
- [Ajv Formats](https://ajv.js.org/packages/ajv-formats.html) -- duration format required by compose-spec healthcheck intervals (HIGH confidence)
- [Ajv Strict Mode](https://ajv.js.org/strict-mode.html) -- patternProperties interaction with additionalProperties, strict mode defaults (HIGH confidence)
- [React Flow / xyflow SSR Issue #3384](https://github.com/xyflow/xyflow/issues/3384) -- SSR crash in Vite/Astro, fixed in v11.9.0, `client:only` workaround (HIGH confidence)
- [React Flow Astro Example](https://github.com/xyflow/react-flow-example-apps/tree/main/reactflow-astro) -- official Astro integration example (HIGH confidence)
- [React Flow Layouting Guide](https://reactflow.dev/learn/layouting/layouting) -- dagre vs elkjs vs d3-force comparison (HIGH confidence)
- [dagre GitHub](https://github.com/dagrejs/dagre) -- unmaintained since 2018; DAG-only, no cycle handling (HIGH confidence)
- [CodeMirror lang-yaml](https://github.com/codemirror/lang-yaml) -- Lezer-based YAML grammar, separate from yaml npm package (HIGH confidence)
- [Docker Compose History](https://docs.docker.com/compose/intro/history/) -- v1/v2/v3 history, unified Compose Specification (HIGH confidence)
- Codebase analysis: `use-codemirror.ts` (View Transitions cleanup pattern), `buffer-polyfill.ts` (browser polyfill pattern), `EditorPanel.tsx` (analysis pipeline), `dockerfileAnalyzerStore.ts` (nanostore bridge), `types.ts` (rule/violation/score architecture), `package.json` (existing dependencies) (HIGH confidence -- direct code inspection)

---
*Pitfalls research for: Docker Compose Validator -- browser-based Compose validation tool with graph visualization (v1.6 milestone)*
*Researched: 2026-02-22*
