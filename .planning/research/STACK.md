# Stack Research

**Domain:** GitHub Actions Workflow Validator -- stack additions for browser-based two-pass linting, workflow graph visualization, category-weighted scoring, and per-rule documentation
**Researched:** 2026-03-04
**Confidence:** HIGH

## Verdict: No New npm Dependencies Required

The GitHub Actions Workflow Validator can be built entirely with existing dependencies. The only new artifacts are a pre-compiled Ajv standalone validator (from the SchemaStore github-workflow.json schema) and custom TypeScript lint rules -- the exact same pattern already proven by the Docker Compose Validator and Kubernetes Manifest Analyzer.

No WASM compilation. No Go toolchain. No new npm packages.

## Rationale: Why NOT actionlint WASM

The milestone description mentions "actionlint WASM" as a second lint pass. After thorough investigation, this approach is **rejected** in favor of TypeScript-native lint rules. Here is why:

### actionlint WASM Problems

| Issue | Impact |
|-------|--------|
| **Binary size**: Go WASM binaries include the full Go runtime. A blank Go WASM is ~1.3MB; actionlint with its dependency tree would be 3-6MB uncompressed | Adds 1-2MB gzipped to page load for a single tool -- unacceptable on a portfolio site with 1009 pages |
| **No npm package**: actionlint does not publish a pre-built WASM binary or npm package. We would need Go installed in CI to compile `GOOS=js GOARCH=wasm go build -o main.wasm` | Adds Go toolchain dependency to the build pipeline -- every other tool uses only Node.js |
| **Different integration pattern**: Go WASM requires `wasm_exec.js` (Go's JS runtime glue), `new Go()` instantiation, `WebAssembly.instantiateStreaming()`, and global window function callbacks (`window.runActionlint`, `window.onCheckCompleted`) | Completely different from the established CodeMirror + nanostore + React pattern. Every other tool uses synchronous TypeScript function calls |
| **Version coupling**: Go compiler version must match `wasm_exec.js` version exactly | Fragile dependency management |
| **Maintenance burden**: actionlint updates require re-compiling the WASM binary with the exact same Go version | Cannot use simple `npm update` like every other dependency |

### What actionlint Does That We Actually Need

actionlint performs ~20 categories of checks. Most valuable ones fall into two groups:

**Group A -- Already covered by SchemaStore JSON Schema validation:**
- Unknown/missing keys, duplicate keys, type mismatches
- Runner label validation, shell name validation
- Event trigger structure, permissions structure
- CRON syntax validation, webhook event names

**Group B -- Implementable as TypeScript lint rules (same pattern as existing tools):**
- Expression `${{ }}` syntax validation (lexer + parser in ~300 lines of TypeScript)
- Context/function name validation (`github.event`, `steps.*.outputs`, `needs.*.outputs`)
- Job `needs:` dependency cycle detection (already built for Compose Validator, reusable)
- Hardcoded credentials detection (already built for Dockerfile Analyzer and Compose Validator)
- Deprecated action version detection (string matching on `uses:` values)
- Reusable workflow `workflow_call` validation
- Matrix strategy type checking

**Group C -- Not suitable for browser (requires network/filesystem):**
- shellcheck integration (requires shellcheck binary)
- pyflakes integration (requires Python)
- Popular action input validation (requires downloading action.yml from GitHub)

The TypeScript-native approach covers Groups A and B completely while maintaining the exact same patterns as the existing 3 tools. Group C is out of scope for any browser-based tool.

## Existing Stack (No Changes Needed)

### Core Technologies (Already Installed)

| Technology | Version | Purpose | Status |
|------------|---------|---------|--------|
| Astro | 5.17.1 | Static site generator with `getStaticPaths()` for rule pages | No change |
| TypeScript | ^5.9.3 | Type-safe rule implementation | No change |
| Vite | 6.4.1 | Bundler (via Astro) | No change |
| React | ^19.2.4 | Results panel, graph visualization | No change |
| @xyflow/react | ^12.10.1 | Workflow graph visualization (triggers, jobs, steps) | No change; same pattern as Compose and K8s graphs |
| @dagrejs/dagre | ^2.0.4 | Auto-layout for workflow graph | No change |
| nanostores | ^1.1.0 | Editor-to-results bridge | No change |
| @nanostores/react | ^1.0.0 | React bindings for nanostores | No change |
| yaml | ^2.8.2 | YAML AST parsing with line numbers | No change; provides `Document`, `LineCounter`, `isMap`, `isSeq`, `isScalar`, `isPair` |
| ajv | ^8.18.0 | JSON Schema validation (compile-time only) | No change; used in build script to compile standalone validator |
| ajv-formats | ^3.0.1 | Format validation (compile-time only) | No change |
| codemirror | ^6.0.2 | Code editor | No change |
| @codemirror/lang-yaml | ^6.1.2 | YAML language support in editor | No change; GitHub Actions workflows are YAML |
| @codemirror/theme-one-dark | ^6.1.3 | Editor theme | No change |
| lz-string | ^1.5.0 | URL state compression for sharing | No change |
| satori + sharp | ^0.19.2 / ^0.34.5 | OG image generation for rule pages | No change |
| vitest | ^4.0.18 | Unit testing | No change |

### New Artifacts to Create (Zero New Dependencies)

| Artifact | Type | Pattern Source | Purpose |
|----------|------|---------------|---------|
| `scripts/compile-gha-schema.mjs` | Build script | `scripts/compile-compose-schema.mjs` | Pre-compile SchemaStore github-workflow.json into standalone Ajv validator |
| `src/lib/tools/gha-validator/validate-gha.js` | Auto-generated | `src/lib/tools/compose-validator/validate-compose.js` | Compiled validator module (no `new Function()`, CSP-safe) |
| `src/lib/tools/gha-validator/github-workflow-schema.json` | Vendored schema | `src/lib/tools/compose-validator/compose-spec-schema.json` | SchemaStore github-workflow.json, vendored locally |
| `src/lib/tools/gha-validator/types.ts` | Types | `src/lib/tools/compose-validator/types.ts` | `GhaLintRule`, `GhaRuleViolation`, `GhaRuleContext`, `GhaSeverity`, `GhaCategory` |
| `src/lib/tools/gha-validator/parser.ts` | Parser | `src/lib/tools/compose-validator/parser.ts` | YAML AST parsing with `resolveInstancePath`, `getNodeLine` |
| `src/lib/tools/gha-validator/schema-validator.ts` | Schema pass | `src/lib/tools/compose-validator/schema-validator.ts` | Pass 1: SchemaStore JSON Schema validation with line numbers |
| `src/lib/tools/gha-validator/engine.ts` | Lint engine | `src/lib/tools/compose-validator/engine.ts` | Pass 2: Run all custom TypeScript lint rules |
| `src/lib/tools/gha-validator/expression-parser.ts` | NEW | None (new capability) | Lexer + parser for `${{ }}` expression syntax |
| `src/lib/tools/gha-validator/graph-builder.ts` | Graph builder | `src/lib/tools/compose-validator/graph-builder.ts` | Build workflow graph: triggers -> jobs -> steps with `needs:` edges |
| `src/lib/tools/gha-validator/graph-data-extractor.ts` | Graph metadata | `src/lib/tools/compose-validator/graph-data-extractor.ts` | Extract runner labels, container images, step actions for graph node enrichment |
| `src/lib/tools/gha-validator/scorer.ts` | Scorer | `src/lib/tools/compose-validator/scorer.ts` | Diminishing-returns scoring with category weights |
| `src/lib/tools/gha-validator/rules/` | Rule directory | All existing tools | Category-organized rule files |
| `src/lib/tools/gha-validator/rules/index.ts` | Rule registry | All existing tools | Exports `allRules` array for engine and `getStaticPaths()` |
| `src/lib/tools/gha-validator/rules/related.ts` | Related rules | All existing tools | `getRelatedRules()` for rule documentation pages |
| `src/lib/tools/gha-validator/sample-workflow.ts` | Sample input | All existing tools | Default GitHub Actions workflow for the editor |
| `src/lib/tools/gha-validator/url-state.ts` | URL state | All existing tools | Encode/decode workflow text in URL for sharing |
| `src/lib/tools/gha-validator/badge-generator.ts` | Badge SVG | All existing tools | Score badge for sharing |
| `src/lib/tools/gha-validator/use-codemirror-gha.ts` | Editor hook | `src/lib/tools/compose-validator/use-codemirror-yaml.ts` | CodeMirror YAML editor with GHA-specific diagnostics |

## Pass 1: SchemaStore JSON Schema Validation

### Schema Source

The SchemaStore github-workflow.json schema is the community-maintained JSON Schema for GitHub Actions workflow files. It is actively updated (multiple PRs merged per week) and covers:

- All 30+ trigger event types with type-specific filters
- Job configuration (normal jobs with `runs-on`/`steps`, reusable workflow calls with `uses`)
- Step definitions (actions via `uses:`, shell commands via `run:`)
- Permissions (16+ resource types with read/write/none)
- Strategy/matrix definitions
- Container/service specifications
- Concurrency configuration
- Environment variable scoping

**URL:** `https://raw.githubusercontent.com/SchemaStore/schemastore/master/src/schemas/json/github-workflow.json`
**Size:** ~2,500 lines of JSON Schema (~100KB)
**License:** Apache-2.0

### Compilation Approach

Follow the exact pattern from `scripts/compile-compose-schema.mjs`:

1. Download `github-workflow.json` from SchemaStore (or vendor it locally)
2. Compile with Ajv standalone (`{ allErrors: true, strict: false, code: { source: true, esm: true } }`)
3. Replace `require("ajv/dist/runtime/equal")` with inline deep-equal function
4. Verify no remaining `require()` calls
5. Output to `src/lib/tools/gha-validator/validate-gha.js`

**Expected compiled validator size:** ~50-80KB gzipped (smaller than K8s validators since single schema with no external `$ref` definitions, unlike the K8s 19-schema bundle at ~160KB gzipped)

### Schema Error Categorization

Map Ajv errors to domain-specific rule codes (same pattern as `categorizeSchemaErrors` in compose-validator):

| Rule Code | Ajv Error | Human Message |
|-----------|-----------|---------------|
| GA-S001 | YAML parse error | Invalid YAML syntax |
| GA-S002 | `additionalProperties` at root | Unknown top-level property |
| GA-S003 | `additionalProperties` at job | Unknown job property |
| GA-S004 | `additionalProperties` at step | Unknown step property |
| GA-S005 | `required` at job | Missing required job property (e.g., `runs-on`) |
| GA-S006 | `enum` at permissions | Invalid permission value |
| GA-S007 | `pattern` at event | Invalid event filter pattern |
| GA-S008 | `type` mismatch | Type mismatch (expected string, got object, etc.) |

## Pass 2: TypeScript Lint Rules

### Expression Parser (New Capability)

The `${{ }}` expression syntax follows a well-documented grammar from GitHub's official docs. The parser needs to handle:

- **Literals:** strings, numbers, booleans, null
- **Context access:** `github.event.action`, `steps.build.outputs.result`
- **Functions:** `contains()`, `startsWith()`, `endsWith()`, `format()`, `join()`, `toJSON()`, `fromJSON()`, `hashFiles()`, `success()`, `failure()`, `cancelled()`, `always()`
- **Operators:** `==`, `!=`, `&&`, `||`, `!`, `<`, `>`, `<=`, `>=`
- **Indexing:** `github.event.commits[0].message`

Implementation: ~300-400 lines of TypeScript for a recursive-descent parser. This is the only truly new code that has no precedent in the existing tools. Everything else follows established patterns.

### Rule Categories and Weights

Following the established diminishing-returns scoring pattern:

| Category | Weight | Description | Comparable To |
|----------|--------|-------------|---------------|
| `schema` | 15% | JSON Schema validation errors | CV-S*, KA-S* |
| `security` | 30% | Credential exposure, script injection, permissions | CV-C*, KA-C* |
| `reliability` | 25% | Job dependency issues, missing error handling, deprecated actions | KA-R* |
| `best-practice` | 20% | Missing concurrency, pinning, runner selection | CV-B*, KA-B* |
| `style` | 10% | Naming conventions, formatting, organization | CV-F* |

### Planned Rule Coverage (~40-50 rules)

**Security rules (GA-C*):**
- Hardcoded secrets in `env:` values (pattern from PG001/CV-C008)
- Script injection via `${{ github.event.* }}` in `run:` steps
- Overly permissive `permissions: write-all`
- Missing `permissions:` declaration (defaults to write-all)
- Untrusted PR head ref in checkout
- `pull_request_target` with dangerous checkout

**Reliability rules (GA-R*):**
- Job `needs:` dependency cycle detection (algorithm from compose-validator `graph-builder.ts`)
- Undefined job dependency in `needs:`
- Missing `timeout-minutes` (defaults to 360 minutes)
- Deprecated action versions (`actions/checkout@v2`, etc.)
- `continue-on-error: true` without handling
- Missing `if: failure()` or `if: always()` for cleanup steps
- Duplicate step IDs
- Matrix strategy without `fail-fast` consideration

**Best Practice rules (GA-B*):**
- Action version not pinned to SHA
- Missing `concurrency:` for deploy workflows
- Unnecessary `actions/checkout` for non-code jobs
- Missing workflow `name:`
- Missing job `name:` (uses job ID as display name)
- Redundant `shell: bash` on ubuntu runners
- Large matrix without `max-parallel`
- Missing `cache:` for package manager steps

**Expression rules (GA-E*):**
- Invalid `${{ }}` expression syntax (uses expression-parser.ts)
- Unknown context name (not `github`, `env`, `steps`, `needs`, `matrix`, `secrets`, `inputs`, `vars`, `runner`, `strategy`, `job`)
- Unknown function name
- Incorrect function argument count
- `format()` placeholder count mismatch

**Style rules (GA-F*):**
- Jobs not in logical order (triggers imply order)
- Inconsistent action version format (mixing `@v4` and `@v4.1.0`)
- Step names inconsistent casing

## Workflow Graph Visualization

### Graph Structure

The GitHub Actions workflow graph is richer than the Compose dependency graph. It has three tiers:

```
[Trigger Nodes] --> [Job Nodes] --> [Step Nodes]
                     |         |
                     +--needs--+  (inter-job edges)
```

| Node Type | Source | Visual |
|-----------|--------|--------|
| Trigger | `on:` events (push, pull_request, workflow_dispatch, schedule, etc.) | Diamond shape, colored by event type |
| Job | `jobs.<id>` entries | Rectangle, colored by runner type |
| Step | `jobs.<id>.steps[*]` entries | Rounded rectangle, colored by type (action vs run) |

| Edge Type | Source | Visual |
|-----------|--------|--------|
| trigger-to-job | Implicit (all jobs triggered by events unless filtered) | Dashed line |
| job-needs | `jobs.<id>.needs: [other-job]` | Solid arrow with label |
| job-to-step | Sequential within job | Thin line |
| conditional | `if:` conditions on jobs/steps | Dotted line with condition label |

### Implementation

Follow the pattern from `k8s-graph-data-extractor.ts`:

1. `extractGhaGraphData()` function that takes parsed workflow JSON
2. Returns `{ nodes: GhaGraphNode[], edges: GhaGraphEdge[], hasCycles: boolean }`
3. Cycle detection reuses Kahn's algorithm from `compose-validator/graph-builder.ts`
4. Dagre layout with `@dagrejs/dagre` for automatic positioning
5. React Flow rendering with `@xyflow/react` using custom node components

### Enriched Node Metadata

| Node Type | Metadata | Source |
|-----------|----------|--------|
| Trigger | Event name, filters (branches, paths) | `on:` block |
| Job | Runner label, container image, environment | `runs-on:`, `container:`, `environment:` |
| Step | Action name + version OR shell command preview | `uses:` or `run:` |

## Files to Create

### Build Scripts

| File | Purpose | Pattern |
|------|---------|---------|
| `scripts/compile-gha-schema.mjs` | Compile SchemaStore github-workflow.json to standalone Ajv | `scripts/compile-compose-schema.mjs` |

### Library Files

| File | Purpose | Pattern |
|------|---------|---------|
| `src/lib/tools/gha-validator/types.ts` | Type definitions | `compose-validator/types.ts` |
| `src/lib/tools/gha-validator/parser.ts` | YAML parsing + AST navigation | `compose-validator/parser.ts` |
| `src/lib/tools/gha-validator/schema-validator.ts` | Pass 1: Schema validation | `compose-validator/schema-validator.ts` |
| `src/lib/tools/gha-validator/engine.ts` | Pass 2: Custom rule execution | `compose-validator/engine.ts` |
| `src/lib/tools/gha-validator/expression-parser.ts` | `${{ }}` expression parser | NEW (recursive descent) |
| `src/lib/tools/gha-validator/graph-builder.ts` | Workflow graph construction | `compose-validator/graph-builder.ts` |
| `src/lib/tools/gha-validator/graph-data-extractor.ts` | Graph node enrichment | `compose-validator/graph-data-extractor.ts` |
| `src/lib/tools/gha-validator/scorer.ts` | Diminishing-returns scoring | `compose-validator/scorer.ts` |
| `src/lib/tools/gha-validator/sample-workflow.ts` | Default editor content | All tools |
| `src/lib/tools/gha-validator/url-state.ts` | URL state management | All tools |
| `src/lib/tools/gha-validator/badge-generator.ts` | Score badge SVG | All tools |
| `src/lib/tools/gha-validator/use-codemirror-gha.ts` | CodeMirror hook | `compose-validator/use-codemirror-yaml.ts` |
| `src/lib/tools/gha-validator/rules/index.ts` | Rule registry | All tools |
| `src/lib/tools/gha-validator/rules/related.ts` | Related rules | All tools |
| `src/lib/tools/gha-validator/rules/schema/*.ts` | Schema rules (GA-S*) | `compose-validator/rules/schema/` |
| `src/lib/tools/gha-validator/rules/security/*.ts` | Security rules (GA-C*) | `compose-validator/rules/security/` |
| `src/lib/tools/gha-validator/rules/reliability/*.ts` | Reliability rules (GA-R*) | `k8s-analyzer/rules/reliability/` |
| `src/lib/tools/gha-validator/rules/best-practice/*.ts` | Best practice rules (GA-B*) | `compose-validator/rules/best-practice/` |
| `src/lib/tools/gha-validator/rules/expression/*.ts` | Expression rules (GA-E*) | NEW |
| `src/lib/tools/gha-validator/rules/style/*.ts` | Style rules (GA-F*) | `compose-validator/rules/style/` |

### Auto-generated Files

| File | Generation | Purpose |
|------|-----------|---------|
| `src/lib/tools/gha-validator/validate-gha.js` | `node scripts/compile-gha-schema.mjs` | Compiled standalone validator |
| `src/lib/tools/gha-validator/github-workflow-schema.json` | Downloaded from SchemaStore | Source schema (vendored) |

### Page Files

| File | Purpose | Pattern |
|------|---------|---------|
| `src/pages/tools/gha-validator/index.astro` | Main tool page | `src/pages/tools/compose-validator/index.astro` |
| `src/pages/tools/gha-validator/rules/[code].astro` | Per-rule documentation | `src/pages/tools/compose-validator/rules/[code].astro` |

### React Components

| File | Purpose | Pattern |
|------|---------|---------|
| `src/components/tools/GhaResultsPanel.tsx` | Results panel | `ComposeResultsPanel.tsx` |
| `src/components/tools/gha-results/GhaShareActions.tsx` | Share actions | `compose-results/ComposeShareActions.tsx` |
| `src/components/tools/gha-results/GhaPromptGenerator.tsx` | AI prompt export | `compose-results/ComposePromptGenerator.tsx` |
| `src/components/tools/gha-results/GhaGraphPanel.tsx` | Workflow graph | Compose/K8s graph panels |

## Installation

```bash
# No npm installation needed. Zero new dependencies.

# One-time schema compilation (run during build or CI):
node scripts/compile-gha-schema.mjs
```

## Alternatives Considered

| Decision | Chosen | Alternative | Why Not Alternative |
|----------|--------|-------------|---------------------|
| Lint engine | TypeScript-native rules | actionlint via Go WASM | 3-6MB binary, Go toolchain in CI, different integration pattern, wasm_exec.js dependency. See "Why NOT actionlint WASM" section above. |
| Schema source | SchemaStore github-workflow.json | Hand-written schema | SchemaStore is community-maintained, covers 30+ event types, updated weekly. Hand-writing would be months of work and immediately stale. |
| Schema validation | Pre-compiled Ajv standalone | Runtime Ajv compilation | CSP-safe (no `new Function()`), faster startup, smaller bundle. Proven pattern in 2 existing tools. |
| Expression parser | Custom recursive-descent parser | actionlint expression parser (Go) | Would require Go WASM just for expression parsing. The grammar is small (~12 operators, ~15 functions, ~11 contexts). A TypeScript parser is ~300 lines. |
| Graph library | @xyflow/react + @dagrejs/dagre | D3-force, vis.js, Cytoscape.js | Already installed, proven in 2 existing tools, React integration, consistent UX |
| State management | nanostores | zustand, jotai, Redux | Already installed, proven in 3 existing tools, minimal bundle size |
| Editor | CodeMirror 6 with @codemirror/lang-yaml | Monaco, Ace | Already installed, proven in 3 existing tools, YAML language support included |
| URL state | lz-string | pako, URL params | Already installed, proven in 3 existing tools |
| Scoring | Diminishing-returns formula | Linear, percentage-based | Already proven in 3 existing tools, prevents single-category domination |
| Rule naming | GA-* prefix (GitHub Actions) | GHA-*, WF-* | Two letters consistent with existing tools (DL-*, PG-*, CV-*, KA-*). GA is unambiguous. |

## What NOT to Do

| Avoid | Why | Do Instead |
|-------|-----|------------|
| Compile actionlint to WASM | 3-6MB binary, Go toolchain requirement, different integration pattern, wasm_exec.js runtime | Build TypeScript-native rules following existing patterns |
| Install `vite-plugin-wasm` or `vite-plugin-top-level-await` | No WASM binary to load. These plugins are unnecessary without Go WASM. | Not needed |
| Install `pako` (compression) | actionlint playground uses pako for WASM compression. We have no WASM binary. | Not needed |
| Install `github-actions-linter` npm package | Last published 6 years ago (v2.7.0). Abandoned. Minimal checks. | Build custom TypeScript rules |
| Install `gh-actions-linter` npm package | Deprecated. No longer maintained. | Build custom TypeScript rules |
| Add any WASM-related npm packages | No WASM in the architecture | Not needed |
| Add separate CodeMirror language for GitHub Actions | No such package exists. `@codemirror/lang-yaml` is sufficient -- GHA files are YAML. | Use existing `@codemirror/lang-yaml` |
| Use runtime Ajv for schema validation | Requires `new Function()`, blocked by CSP, larger bundle | Pre-compile with standalone module at build time |
| Download schema at runtime | Network dependency, latency, offline failure | Vendor schema locally, compile at build time |
| Add Go to CI/CD pipeline | Only needed for actionlint WASM compilation | Not needed -- all TypeScript |

## Version Compatibility

| Package | Version | GHA Validator Support | Notes |
|---------|---------|----------------------|-------|
| yaml@2.8.2 | ^2.8.2 | Full support | `Document`, `LineCounter`, `isMap`, `isSeq`, `isScalar`, `isPair` -- all used by existing parsers |
| ajv@8.18.0 | ^8.18.0 | Full support (build-time only) | Standalone compilation with `code: { source: true, esm: true }` -- proven in 2 existing tools |
| ajv-formats@3.0.1 | ^3.0.1 | Full support (build-time only) | May be needed if github-workflow.json uses format keywords (duration, uri, etc.) |
| @xyflow/react@12.10.1 | ^12.10.1 | Full support | Custom node types, edge types, dagre layout -- proven in 2 existing tools |
| @dagrejs/dagre@2.0.4 | ^2.0.4 | Full support | Auto-layout for workflow graph -- proven in 2 existing tools |
| codemirror@6.0.2 | ^6.0.2 | Full support | Editor framework -- proven in 3 existing tools |
| @codemirror/lang-yaml@6.1.2 | ^6.1.2 | Full support | YAML language support -- proven in 2 existing tools |
| nanostores@1.1.0 | ^1.1.0 | Full support | State management -- proven in 3 existing tools |
| lz-string@1.5.0 | ^1.5.0 | Full support | URL state compression -- proven in 3 existing tools |
| Astro@5.17.1 | ^5.3.0 | Full support | `getStaticPaths()` for rule pages -- proven in 3 existing tools |
| Vite@6.4.1 | 6.x | Full support | Bundler via Astro -- no special configuration needed |
| vitest@4.0.18 | ^4.0.18 | Full support | Unit testing for rules and expression parser |

## Key Technical Decisions

### SchemaStore Schema Vendoring

Vendor `github-workflow.json` locally rather than downloading at build time. Reasons:
1. Build reproducibility (not dependent on GitHub CDN)
2. Version control of schema changes
3. Ability to patch schema if needed (e.g., allow custom event types)
4. Same pattern as Compose spec schema vendoring

Update process: periodically fetch latest from `https://raw.githubusercontent.com/SchemaStore/schemastore/master/src/schemas/json/github-workflow.json` and commit.

### Expression Parser Scope

The `${{ }}` expression parser is the only genuinely new code with no precedent in existing tools. Scope it tightly:

1. **Lexer**: Tokenize expression strings into tokens (identifiers, operators, literals, parentheses, dots, brackets)
2. **Parser**: Build a minimal AST (BinaryExpr, UnaryExpr, FunctionCall, MemberAccess, IndexAccess, Literal)
3. **Validator**: Walk the AST and check context names, function names, argument counts

This is NOT a full type-checker like actionlint's Go implementation. It validates syntax and known names, not types. This is a deliberate scope reduction that still catches the majority of real-world expression errors.

### Graph Visualization Hierarchy

The workflow graph is more hierarchical than Compose (which is flat services) or K8s (which is cross-resource references). Use dagre's `rankdir: 'TB'` (top-to-bottom) layout with explicit rank assignment:

- Rank 0: Trigger nodes
- Rank 1: Jobs (with `needs:` edges creating sub-ranks)
- Rank 2+: Steps within each job (collapsed by default, expandable)

This provides a clean visual flow that matches how developers think about workflow execution.

## Sources

- **Existing codebase:** Direct inspection of `compose-validator/`, `k8s-analyzer/`, `dockerfile-analyzer/` implementations -- confirmed all patterns, APIs, and integration points
- [SchemaStore github-workflow.json](https://github.com/SchemaStore/schemastore/blob/master/src/schemas/json/github-workflow.json) -- Community-maintained JSON Schema for GitHub Actions workflows. Apache-2.0 license. ~2,500 lines covering 30+ event types, job configuration, steps, permissions, matrix, concurrency
- [SchemaStore JSON Schema URL](https://json.schemastore.org/github-workflow.json) -- CDN URL for the schema
- [actionlint repository](https://github.com/rhysd/actionlint) -- Go-based GitHub Actions linter by rhysd. Studied playground WASM implementation to evaluate and reject WASM approach
- [actionlint playground](https://rhysd.github.io/actionlint/) -- Browser-based actionlint using Go WASM. Demonstrates the approach works but at significant cost (multi-MB binary, Go runtime)
- [actionlint playground/main.go](https://github.com/rhysd/actionlint/blob/main/playground/main.go) -- Go WASM interface using `syscall/js`, exposes `window.runActionlint` returning `ActionlintError[]` with kind, message, line, column
- [actionlint playground/Makefile](https://github.com/rhysd/actionlint/blob/main/playground/Makefile) -- Build with `GOOS=js GOARCH=wasm go build -o main.wasm`, no wasm-opt optimization
- [actionlint v1.7.11 release](https://github.com/rhysd/actionlint/releases/tag/v1.7.11) -- Latest version as of 2026-03-04
- [actionlint checks documentation](https://github.com/rhysd/actionlint/blob/main/docs/checks.md) -- Full list of checks: expression syntax/type checking, context validation, credential detection, script injection, deprecated actions, reusable workflows
- [Ajv standalone compilation](https://ajv.js.org/standalone.html) -- Pre-compile JSON Schema validators for browser use without `new Function()`
- [Go WebAssembly wiki](https://go.dev/wiki/WebAssembly) -- Documents wasm_exec.js requirement, `GOOS=js GOARCH=wasm` compilation, Go runtime inclusion in WASM binary (~1.3MB minimum)
- [Go WASM binary size analysis](https://dev.bitolog.com/minimizing-go-webassembly-binary-size/) -- Blank Go WASM is ~1.3MB, standard library imports add 0.4MB+ each
- [vite-plugin-wasm](https://github.com/Menci/vite-plugin-wasm) -- v3.5.0, supports Vite 2.x-7.x. NOT needed since we are not loading WASM.
- [GitHub Actions workflow syntax documentation](https://docs.github.com/actions/using-workflows/workflow-syntax-for-github-actions) -- Official reference for expression grammar, contexts, functions

---
*Stack research for: GitHub Actions Workflow Validator*
*Researched: 2026-03-04*
