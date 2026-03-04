# Feature Research

**Domain:** Browser-based GitHub Actions Workflow Validator
**Researched:** 2026-03-04
**Confidence:** HIGH

## Feature Landscape

### Table Stakes (Users Expect These)

Features users assume exist. Missing these = product feels incomplete.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| **YAML syntax validation** | Invalid YAML is the #1 cause of workflow failures. Every validator starts here. Snyk 2024 survey: 19% of pipeline errors from malformed YAML. | LOW | Existing pattern: `yaml` library parser + error recovery, already proven in Compose Validator and K8s Analyzer. |
| **SchemaStore JSON Schema structural validation** | SchemaStore's `github-workflow.json` (~97KB) is the authoritative structural schema. IDEs (VS Code, JetBrains) already use it. Users expect equivalent coverage. Validates `on:`, `jobs:`, `steps:`, `permissions:`, `concurrency:`, `env:`, event types, required properties. | MEDIUM | Two-pass architecture: Pass 1. Parse YAML to JSON, validate against SchemaStore schema with ajv. Same pattern as K8s Analyzer's `schema-validator.ts` using pre-compiled ajv standalone. |
| **actionlint deep analysis (WASM)** | actionlint is the gold standard for GitHub Actions linting. 17 rule categories, expression type checking, context validation, security checks. Users who know actionlint expect its coverage. | HIGH | Pass 2. Load actionlint WASM binary (~8.9MB uncompressed, ~3MB gzipped). Go compiled to WASM via `GOOS=js GOARCH=wasm`. Returns `ActionlintError[]` with `{kind, message, line, column}`. First WASM tool in the suite. |
| **CodeMirror YAML editor** | All three existing tools use CodeMirror 6 with YAML highlighting. Users expect consistent editing experience with syntax highlighting, line numbers, inline error annotations. | LOW | Reuse existing CodeMirror YAML setup from Compose Validator / K8s Analyzer. Identical component structure. |
| **Inline error annotations** | CodeMirror Diagnostic API integration showing squiggly underlines at violation locations. All existing tools have this. | LOW | Existing pattern: map violations to `Diagnostic[]` with `from/to` positions and severity levels. |
| **Category-weighted scoring with letter grades** | All three existing tools produce A+ through F scores. Users of the tool suite expect this consistency. | LOW | Existing pattern from `scorer.ts`. Need new category weights appropriate for GitHub Actions (see Rule Categories below). |
| **Score badge PNG generation** | Dockerfile Analyzer and K8s Analyzer generate shareable score badge images. Users expect to embed these in READMEs. | LOW | Existing pattern from `badge-generator.ts`. Reuse with new tool name/colors. |
| **Per-rule documentation pages** | Every rule in existing tools has a dedicated `/tools/[tool]/rules/[code]` page with explanation, fix examples, severity badge, and related rules. Auto-generated from rule metadata. | LOW | Existing `[code].astro` dynamic route pattern. Rule metadata drives page generation automatically. |
| **Results panel with violation list** | Grouped-by-category results display showing each violation with line number, message, severity icon, and rule link. | LOW | Existing pattern from all three tools. |
| **Sample workflow file** | Default content in the editor demonstrating common issues so first-time visitors see the tool in action immediately. | LOW | Craft a sample `.github/workflows/ci.yml` with intentional issues across all categories. |
| **URL state persistence** | Shareable URLs encoding editor content so users can share specific workflow analyses. | LOW | Existing pattern from `url-state.ts` in Dockerfile Analyzer. |

### Differentiators (Competitive Advantage)

Features that set the product apart. Not required, but valuable.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **Workflow graph visualization (triggers -> jobs -> steps)** | No existing browser-based GitHub Actions validator visualizes the workflow as a graph. GitHub's built-in visualization only appears for *running* workflows, not during authoring. The FOSSA GitHub Actions Visualizer only shows job dependencies, not steps or triggers. This tool shows the full DAG: event triggers -> jobs (with `needs:` edges) -> steps (sequential). | HIGH | Use React Flow (already in Compose Validator and K8s Analyzer). Extract `on:` events as trigger nodes, `jobs:` as job nodes with `needs:` edges, `steps:` as child nodes within jobs. Color-code by status (valid/warning/error). Phantom nodes for unresolved `needs:` references. |
| **Two-pass architecture (SchemaStore + actionlint)** | No existing tool combines SchemaStore schema validation with actionlint's deep analysis. The official actionlint playground only runs actionlint. SchemaStore catches structural issues (unknown properties, missing required fields, type mismatches) that actionlint may not flag. actionlint catches semantic issues (expression types, context availability, security) that schema validation cannot. Together they provide the most comprehensive validation available. | HIGH | Deduplicate overlapping findings between passes. SchemaStore catches ~15 structural rule types; actionlint catches ~18 semantic rule types. Map both to unified violation format with consistent severity/category. |
| **Custom rules beyond actionlint (GA-* prefix)** | actionlint is comprehensive but focused on correctness, not best practices or security hardening. Custom rules can flag: unpinned action versions (not using SHA), overly permissive `permissions:`, missing `timeout-minutes`, `pull_request_target` without input validation, mutable tag references. These fill gaps that actionlint deliberately leaves out. | MEDIUM | 10-15 custom rules in the `security` and `best-practice` categories. Same rule interface pattern as Dockerfile Analyzer (`id`, `title`, `severity`, `category`, `explanation`, `fix`, `check()`). |
| **Security hardening score** | Dedicated security subscore analyzing: permissions scope, action pinning strategy, secret handling, injection risk surface, `pull_request_target` usage. Inspired by StepSecurity's approach but as a real-time browser-based analysis, not a CI-only tool. | MEDIUM | Security category weight at 30-35% of total score. Custom rules + actionlint `[credentials]` and `[expression]` (script injection) findings contribute. |
| **Unified rule ID namespace (GA-* prefix)** | Consistent with existing suite: Dockerfile uses `DL*/PG*`, Compose uses `CV-*`, K8s uses `KA-*`. GitHub Actions gets `GA-*` prefix. Schema rules: `GA-S*`, Security: `GA-C*`, Semantic: `GA-M*`, Best Practice: `GA-B*`, Style: `GA-F*`. actionlint errors mapped to `GA-L*` namespace. | LOW | Rule ID mapping layer between actionlint's `kind` strings and the `GA-L*` namespace. Each actionlint kind (18 kinds) gets a stable `GA-L` ID. |
| **Rich explanations with "why it matters"** | actionlint gives terse one-line messages. The existing tool suite provides multi-paragraph explanations with before/after code, security implications, and links to official docs. This is the key UX differentiator across all tools in the suite. | MEDIUM | Each `GA-*` rule includes `explanation` (Markdown), `fix.description`, `fix.beforeCode`, `fix.afterCode`. actionlint errors get enriched explanations layered on top of the raw message. |
| **Cross-job dependency validation visualization** | Show `needs:` graph with cycle detection (same Kahn's algorithm from Compose Validator). Highlight circular dependencies, missing job references, and unreachable jobs. No browser-based tool does this with visual feedback during authoring. | MEDIUM | Reuse `detectCycles()` from `compose-validator/graph-builder.ts`. Adapt for `jobs[*].needs` instead of `services[*].depends_on`. |

### Anti-Features (Commonly Requested, Often Problematic)

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| **Live GitHub API validation** | Validate action versions exist, check runner labels against org's actual runners, verify secret names exist. | Requires GitHub API token (security risk in a browser tool), rate limiting, network dependency breaks offline use, CORS issues. The tool must work entirely client-side. | Validate action reference *format* (owner/repo@ref syntax) and flag common issues (mutable tags, missing version pin) without API calls. Use actionlint's built-in popular action metadata for known actions. |
| **Auto-fix / rewrite workflow** | Users want one-click fixes for common issues. | Many fixes are context-dependent (e.g., "pin this action" requires knowing which SHA to pin to, which needs API access). Auto-fix could introduce breaking changes. The tool is an analyzer, not an editor. | Provide clear before/after code examples in rule documentation. Show the exact YAML change needed. Let users make the conscious decision. |
| **Real-time validation as you type** | Immediate feedback on every keystroke. | actionlint WASM takes 50-200ms per run. On fast typing, this creates janky UX with rapid re-renders, stale results, and wasted computation. SchemaStore + actionlint = two validation passes per keystroke. | Debounce validation (300-500ms after last keystroke). Show "Analyzing..." indicator during debounce. Same pattern as actionlint's official playground ("results updated on the fly when editing"). |
| **shellcheck/pyflakes integration** | actionlint integrates shellcheck for `run:` scripts and pyflakes for Python scripts. Users might expect this in the browser version. | shellcheck and pyflakes are native binaries, not available as WASM. actionlint's WASM build explicitly disables these integrations. Adding them would require separate WASM compilations of shellcheck (Haskell -> WASM, not straightforward) and pyflakes (Python -> WASM, massive binary). | Document that shell/Python script linting is not available in the browser version. Suggest running actionlint locally for full coverage. Flag this clearly in the tool's description. |
| **Custom rule configuration UI** | Let users enable/disable rules, change severities, configure thresholds. | Adds significant UI complexity for a feature most users won't use. Rule configuration is a power-user feature better served by local `.actionlintrc` files. Breaks the "paste and validate" simplicity. | Ship with opinionated defaults. All rules enabled. Fixed severities matching industry consensus. If rule configuration is needed later, it's a v2+ feature. |
| **Validate entire repository's workflows** | Upload multiple workflow files for cross-workflow analysis. | Multi-file upload UX is complex. Cross-workflow analysis (reusable workflow calls) requires resolving file references that may not be present. Dramatically increases scope. | Validate one workflow file at a time. For reusable workflow calls (`uses: ./.github/workflows/reusable.yml`), flag the reference format but don't attempt to resolve it. |
| **GitHub Actions Marketplace integration** | Show action descriptions, badges, popularity metrics for referenced actions. | Requires GitHub API, adds network dependency, stale data risk, scope creep into "action discovery" rather than "workflow validation." | Use actionlint's built-in popular actions metadata (covers ~200 well-known actions with input/output type information). Flag unknown actions as info-level, not errors. |

## Rule Categories and Counts

### Category Architecture (Matching Existing Tools)

| Category | Weight | Purpose | Source | Estimated Rules |
|----------|--------|---------|--------|-----------------|
| **Schema** (`GA-S*`) | 15% | YAML syntax, structural validation from SchemaStore JSON Schema | SchemaStore ajv validation | 8-12 rules |
| **Security** (`GA-C*`) | 35% | Permissions, action pinning, secret handling, injection risks, `pull_request_target` safety | Custom rules + actionlint `[credentials]`, `[expression]` | 12-16 rules |
| **Semantic** (`GA-M*`) | 20% | Expression types, context availability, `needs:` graph validity, event/input consistency | actionlint WASM (all 18 kinds mapped) | 18 rules (1:1 with actionlint kinds) |
| **Best Practice** (`GA-B*`) | 20% | `timeout-minutes`, concurrency groups, job naming, step IDs, caching strategy | Custom rules | 8-12 rules |
| **Style** (`GA-F*`) | 10% | Key ordering, consistent quoting, YAML formatting conventions | Custom rules | 4-6 rules |
| **TOTAL** | 100% | | | **50-64 rules** |

### actionlint Kind-to-Rule Mapping (18 kinds -> GA-L* IDs)

actionlint returns errors with a `kind` string. Each kind maps to one `GA-L*` rule ID for documentation and scoring.

| actionlint Kind | Mapped Rule ID | Category | Description |
|-----------------|---------------|----------|-------------|
| `syntax-check` | `GA-L001` | Schema | Unexpected keys, missing required keys, empty mappings, type mismatches |
| `expression` | `GA-L002` | Semantic | Expression syntax, type checking, context/function validation, format() args |
| `action` | `GA-L003` | Semantic | Action input/output validation, metadata checking |
| `workflow-call` | `GA-L004` | Semantic | Reusable workflow input/output/secret validation |
| `credentials` | `GA-L005` | Security | Hard-coded credentials detection |
| `runner-label` | `GA-L006` | Semantic | Invalid runner label validation |
| `events` | `GA-L007` | Semantic | Webhook event names, cron syntax, workflow_dispatch inputs |
| `glob` | `GA-L008` | Semantic | Glob pattern syntax in paths/branches filters |
| `job-needs` | `GA-L009` | Semantic | Job dependency graph validation |
| `matrix` | `GA-L010` | Semantic | Matrix strategy configuration |
| `permissions` | `GA-L011` | Security | Permission scope validation |
| `id` | `GA-L012` | Semantic | Job/step ID uniqueness and naming |
| `shell-name` | `GA-L013` | Semantic | Shell name validation (bash, sh, pwsh, etc.) |
| `if-cond` | `GA-L014` | Semantic | Conditional expression validation |
| `env-var` | `GA-L015` | Semantic | Environment variable naming |
| `deprecated-commands` | `GA-L016` | Best Practice | Deprecated workflow commands (set-output -> GITHUB_OUTPUT) |
| `shellcheck` | `GA-L017` | Semantic | Shell script errors (disabled in WASM, documented) |
| `pyflakes` | `GA-L018` | Semantic | Python script errors (disabled in WASM, documented) |

Note: `GA-L017` and `GA-L018` will never fire in the browser WASM build. They exist in the rule registry for documentation completeness, with explanations noting they require the CLI version.

### Custom Security Rules (GA-C* prefix)

| Rule ID | Title | Severity | What It Checks |
|---------|-------|----------|----------------|
| `GA-C001` | Unpinned action version | warning | `uses: actions/checkout@v4` instead of `uses: actions/checkout@<sha>` |
| `GA-C002` | Mutable action tag | warning | `uses: actions/checkout@main` (branch ref, not tag or SHA) |
| `GA-C003` | Overly permissive permissions | warning | `permissions: write-all` or no permissions block (defaults to write-all) |
| `GA-C004` | Missing permissions block | info | No `permissions:` key at workflow or job level |
| `GA-C005` | Script injection risk | error | `${{ github.event.pull_request.title }}` in `run:` without env var intermediary |
| `GA-C006` | `pull_request_target` without restrictions | warning | `on: pull_request_target` without `paths:`/`branches:` filters |
| `GA-C007` | Secrets in workflow file | error | Hardcoded tokens, passwords, API keys in env values |
| `GA-C008` | Third-party action without SHA pin | info | Non-official actions (not `actions/*`) without commit SHA pinning |
| `GA-C009` | Dangerous `GITHUB_TOKEN` permissions | warning | `permissions: { contents: write, pull-requests: write }` combined scope |
| `GA-C010` | Self-hosted runner in public repo pattern | info | `runs-on: self-hosted` (informational security reminder) |

### Custom Best Practice Rules (GA-B* prefix)

| Rule ID | Title | Severity | What It Checks |
|---------|-------|----------|----------------|
| `GA-B001` | Missing timeout-minutes | info | Jobs without `timeout-minutes` (default is 6 hours) |
| `GA-B002` | Missing concurrency group | info | Workflow without `concurrency:` for branches that should cancel stale runs |
| `GA-B003` | Step without name | info | Steps missing the `name:` field, making logs harder to read |
| `GA-B004` | Duplicate step names | warning | Multiple steps with identical `name:` values in same job |
| `GA-B005` | Empty `env:` block | info | Empty environment variable blocks |
| `GA-B006` | Job without conditional | info | Jobs that always run (no `if:` condition on PR-only workflows) |
| `GA-B007` | Outdated well-known action | warning | Using older major versions of popular actions (e.g., `actions/checkout@v3` when v4 exists) |
| `GA-B008` | Missing `continue-on-error` consideration | info | Steps that fetch external data without error handling |

### Schema Rules (GA-S* prefix, from SchemaStore)

| Rule ID | Title | Severity | What It Checks |
|---------|-------|----------|----------------|
| `GA-S001` | Invalid YAML syntax | error | YAML parse errors (indentation, illegal characters, tabs vs spaces) |
| `GA-S002` | Unknown top-level property | error | Properties not in the workflow schema (typos like `job:` instead of `jobs:`) |
| `GA-S003` | Unknown job property | warning | Properties not valid in a job definition |
| `GA-S004` | Unknown step property | warning | Properties not valid in a step definition |
| `GA-S005` | Invalid event type | error | Unknown event name in `on:` block |
| `GA-S006` | Type mismatch | error | Wrong value type (string where boolean expected, etc.) |
| `GA-S007` | Missing required property | error | Required fields missing (e.g., `jobs:` is mandatory) |
| `GA-S008` | Invalid enum value | warning | Value not in allowed set (e.g., invalid `shell:` value) |

### Style Rules (GA-F* prefix)

| Rule ID | Title | Severity | What It Checks |
|---------|-------|----------|----------------|
| `GA-F001` | Jobs not alphabetically ordered | info | Job keys not in alphabetical order |
| `GA-F002` | Inconsistent `uses:` quoting | info | Mixed quoting styles for action references |
| `GA-F003` | Long step name | info | Step names exceeding 80 characters |
| `GA-F004` | Workflow name missing | info | No `name:` at workflow level |

## Feature Dependencies

```
YAML Parser (yaml library)
    required by ──> SchemaStore JSON Schema Validation (GA-S*)
    required by ──> Custom Rule Engine (GA-C*, GA-B*, GA-F*)
    required by ──> Graph Data Extractor
    required by ──> CodeMirror Editor Integration

SchemaStore JSON Schema Validation (GA-S*)
    required by ──> Two-Pass Engine (must complete before actionlint pass)
    provides ──> Structural violations for scoring

actionlint WASM Binary
    required by ──> Semantic Validation (GA-L*)
    independent of ──> SchemaStore validation (can run in parallel)
    NOTE: ~8.9MB binary, async load with progress indicator

Two-Pass Engine
    requires ──> YAML Parser
    requires ──> SchemaStore Validator
    requires ──> actionlint WASM
    requires ──> Custom Rule Engine
    provides ──> Unified violation list for Scorer

Custom Rule Engine (GA-C*, GA-B*, GA-F*)
    requires ──> Parsed YAML (JSON object)
    independent of ──> actionlint WASM
    follows ──> Same rule interface pattern as Dockerfile/Compose/K8s tools

Graph Data Extractor
    requires ──> Parsed YAML (on: events, jobs: with needs:, steps:)
    independent of ──> Validation engine
    provides ──> React Flow node/edge data

Scorer
    requires ──> Unified violation list from Two-Pass Engine
    follows ──> Existing scorer pattern (category weights, diminishing returns)

Badge Generator
    requires ──> Score result from Scorer

Rule Documentation Pages
    requires ──> Rule metadata registry (all GA-* rules)
    follows ──> Existing [code].astro pattern

CodeMirror Editor
    requires ──> YAML language support (existing)
    requires ──> Diagnostic annotations from violation list

React Flow Graph
    requires ──> Graph Data Extractor output
    follows ──> Existing compose-validator/k8s-analyzer graph patterns
```

### Dependency Notes

- **SchemaStore and actionlint are independent passes:** They can run in parallel after YAML parsing. Deduplicate overlapping findings (e.g., both may flag unknown properties). SchemaStore runs first for immediate feedback while WASM loads.
- **Custom rules are independent of actionlint:** Custom rules (GA-C*, GA-B*, GA-F*) run against the parsed YAML JSON object, not through actionlint. They execute synchronously and return results immediately.
- **Graph extraction is independent of validation:** The workflow graph can be built from parsed YAML regardless of validation results. Graph and validation can run in parallel.
- **actionlint WASM is the critical-path dependency:** The ~8.9MB binary must be loaded and initialized before semantic validation can run. Lazy-load with code splitting. Show SchemaStore + custom rule results immediately while WASM loads.
- **Rule documentation depends on the full rule registry:** All GA-* rules (schema, lint, custom, style) must be in a single registry for the [code].astro page generator.

## MVP Definition

### Launch With (v1)

Minimum viable product that matches the quality bar of the existing three tools.

- [ ] **YAML parser with error recovery** -- Parse workflow YAML to JSON, handle malformed input gracefully
- [ ] **SchemaStore JSON Schema validation (Pass 1)** -- Pre-compile `github-workflow.json` with ajv standalone, same pattern as K8s Analyzer
- [ ] **actionlint WASM integration (Pass 2)** -- Load WASM binary, expose `runActionlint(src)` -> `ActionlintError[]`, map to GA-L* violations
- [ ] **Two-pass deduplication engine** -- Merge SchemaStore and actionlint findings, suppress duplicates, sort by line number
- [ ] **Core custom rules (10 security + 8 best practice)** -- GA-C001 through GA-C010, GA-B001 through GA-B008
- [ ] **Category-weighted scorer** -- 5 categories with weights summing to 100%, same diminishing returns formula
- [ ] **CodeMirror editor with inline annotations** -- YAML highlighting, Diagnostic integration, line numbers
- [ ] **Results panel** -- Grouped by category, clickable to scroll to line, severity icons, rule ID links
- [ ] **Workflow graph visualization** -- React Flow graph: trigger events -> jobs (with needs: edges) -> steps
- [ ] **Rule documentation pages** -- Auto-generated [code].astro pages for all GA-* rules
- [ ] **Sample workflow file** -- Default editor content demonstrating common issues
- [ ] **Score badge PNG** -- Reuse badge generator pattern
- [ ] **URL state persistence** -- Shareable URLs encoding workflow content

### Add After Validation (v1.x)

Features to add once core is working and user feedback is collected.

- [ ] **Style rules (GA-F*)** -- Lower priority, add 4 style rules after core categories are stable
- [ ] **Blog post** -- "Free GitHub Actions Workflow Validator with 50+ Rules" for SEO
- [ ] **Cross-tool comparison page** -- Landing page showing all 4 tools with feature matrix
- [ ] **Enhanced graph interactivity** -- Click job/step nodes to scroll to source line, hover for details
- [ ] **Export validation report** -- JSON/markdown export of findings for CI integration

### Future Consideration (v2+)

- [ ] **Reusable workflow resolution** -- Parse referenced `.github/workflows/*.yml` files (requires multi-file upload UX)
- [ ] **Custom rule configuration** -- UI for enabling/disabling rules and adjusting severities
- [ ] **Action version update suggestions** -- When a pinned action has newer releases (requires API integration)
- [ ] **Matrix expansion preview** -- Show all combinations a matrix strategy would generate

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| YAML parser + error recovery | HIGH | LOW | P1 |
| SchemaStore JSON Schema validation | HIGH | MEDIUM | P1 |
| actionlint WASM integration | HIGH | HIGH | P1 |
| Two-pass deduplication engine | HIGH | MEDIUM | P1 |
| Custom security rules (GA-C*) | HIGH | MEDIUM | P1 |
| Custom best practice rules (GA-B*) | MEDIUM | MEDIUM | P1 |
| Category-weighted scorer | HIGH | LOW | P1 |
| CodeMirror editor + annotations | HIGH | LOW | P1 |
| Results panel | HIGH | LOW | P1 |
| Workflow graph visualization | HIGH | HIGH | P1 |
| Rule documentation pages | HIGH | LOW | P1 |
| Sample workflow file | MEDIUM | LOW | P1 |
| Score badge PNG | MEDIUM | LOW | P1 |
| URL state persistence | MEDIUM | LOW | P1 |
| Style rules (GA-F*) | LOW | LOW | P2 |
| Blog post for SEO | MEDIUM | LOW | P2 |
| Cross-tool comparison page | LOW | LOW | P2 |
| Enhanced graph interactivity | MEDIUM | MEDIUM | P2 |
| Export validation report | LOW | MEDIUM | P3 |
| Reusable workflow resolution | LOW | HIGH | P3 |
| Custom rule configuration | LOW | HIGH | P3 |

**Priority key:**
- P1: Must have for launch (core tool parity with existing 3 tools)
- P2: Should have, add when possible
- P3: Nice to have, future consideration

## Competitor Feature Analysis

| Feature | actionlint Playground | Elysiate Validator | FOSSA Visualizer | action-validator | zizmor | Our Approach (GA-*) |
|---------|----------------------|-------------------|------------------|-----------------|--------|---------------------|
| YAML syntax check | Yes (via Go parser) | Basic | No | Yes (JSON Schema) | No | Yes (yaml library + SchemaStore) |
| JSON Schema validation | No | No | No | Yes (SchemaStore) | No | **Yes (SchemaStore ajv, Pass 1)** |
| Deep semantic analysis | Yes (18 rule kinds) | No | No | No | No (security only) | **Yes (actionlint WASM, Pass 2)** |
| Expression type checking | Yes | No | No | No | No | **Yes (via actionlint)** |
| Security hardening | Partial (credentials, injection) | No | No | No | Yes (24 rules, SARIF output) | **Yes (10 custom rules + actionlint security)** |
| Action input validation | Yes (200+ popular actions) | No | No | No | No | **Yes (via actionlint)** |
| Workflow graph visualization | No | No | Job DAG only | No | No | **Full DAG: triggers -> jobs -> steps** |
| Category-weighted scoring | No | No | No | No | No | **Yes (5 categories, A+ through F)** |
| Per-rule documentation | No (inline only) | No | No | No | Docs site | **Yes (auto-generated pages with SEO)** |
| Rich fix explanations | Terse one-liners | None | N/A | None | Brief | **Multi-paragraph with before/after code** |
| Score badge | No | No | No | No | No | **Yes (shareable PNG)** |
| Browser-only (no install) | Yes | Yes | Yes | No (CLI) | No (CLI) | **Yes** |
| Offline capable | Yes (WASM) | Unknown | Yes (client-side) | N/A | N/A | **Yes (all client-side)** |
| Combined schema + lint | No | No | No | No | No | **Yes (unique two-pass architecture)** |
| Rule count | 18 kinds (40+ sub-checks) | ~5 basic checks | 0 (visualization only) | SchemaStore only | 24 security rules | **50-64 rules across 5 categories** |

### Key Competitive Insights

1. **No tool combines SchemaStore + actionlint.** The actionlint playground only runs actionlint. action-validator only runs SchemaStore validation. Our two-pass architecture is the first to combine both, catching issues neither finds alone.

2. **No browser-based tool visualizes the full workflow graph.** The actionlint playground shows a text-only error list. FOSSA's visualizer shows only job dependencies (no triggers, no steps). GitHub's built-in visualization only appears for *running* workflows, not during authoring. Our React Flow graph showing triggers -> jobs -> steps is unique.

3. **No validator provides scored assessments with grades.** Every existing tool gives pass/fail or a flat error list. The category-weighted scoring with letter grades and shareable badges is exclusive to this tool suite.

4. **zizmor is the closest security competitor** but it's CLI-only, focuses exclusively on security (no best practices, no schema validation, no scoring), and targets CI pipelines rather than developer authoring experience. Our security rules cover similar ground but integrate into a comprehensive browser-based tool.

5. **actionlint WASM is proven technology.** The official playground demonstrates that actionlint runs reliably in the browser via WASM. The binary is ~8.9MB uncompressed but compresses well with gzip/brotli. The `xing/actionlint` npm package provides a community-maintained WASM packaging with browser and Node.js entry points.

6. **actionlint's WASM build disables shellcheck and pyflakes.** This is a known limitation that must be documented clearly. These integrations require native binaries that are not available as WASM. This is not a gap we can fill in the browser.

## Workflow Graph Specification

### Node Types

| Node Type | Visual | Source | Count |
|-----------|--------|--------|-------|
| **Trigger** | Rounded rectangle, blue | `on:` events (push, pull_request, schedule, workflow_dispatch, etc.) | 1-N per workflow |
| **Job** | Rectangle, green/yellow/red based on violation count | `jobs:` entries | 1-N per workflow |
| **Step** | Small rectangle, nested within job | `steps:` entries within each job | 1-N per job |

### Edge Types

| Edge Type | From -> To | Visual | Source |
|-----------|-----------|--------|--------|
| **triggers** | Trigger -> Job | Dashed arrow | All jobs are triggered by all events (unless filtered by `if:`) |
| **needs** | Job -> Job | Solid arrow | `jobs.<id>.needs: [other_job]` |
| **sequential** | Step -> Step | Thin solid line | Steps execute sequentially within a job |

### Graph Layout

- Left-to-right (LR) layout matching React Flow patterns in existing tools
- Trigger nodes on the left
- Job nodes in the middle (grouped by dependency level using topological sort)
- Step nodes nested within job nodes (collapsible)
- Phantom nodes (dashed border) for `needs:` references to undefined jobs

## Sources

- [actionlint - Static checker for GitHub Actions](https://rhysd.github.io/actionlint/) -- Official playground and documentation
- [actionlint GitHub repository](https://github.com/rhysd/actionlint) -- Source code, checks.md, playground WASM architecture
- [actionlint Go package documentation](https://pkg.go.dev/github.com/rhysd/actionlint) -- Complete list of 18 rule kinds and rule types
- [actionlint playground TypeScript types](https://github.com/rhysd/actionlint/blob/main/playground/lib.d.ts) -- WASM interface: `ActionlintError { kind, message, line, column }`
- [xing/actionlint](https://github.com/xing/actionlint) -- Community WASM packaging with npm distribution
- [SchemaStore github-workflow.json](https://github.com/SchemaStore/schemastore/blob/master/src/schemas/json/github-workflow.json) -- ~97KB JSON Schema for structural validation
- [action-validator](https://github.com/mpalmer/action-validator) -- SchemaStore-based CLI validator
- [Elysiate GitHub Actions Validator](https://www.elysiate.com/tools/github-actions-validator) -- Basic browser-based structural checker
- [FOSSA GitHub Actions Visualizer](https://fossa.com/resources/devops-tools/github-actions-visualizer/) -- Job dependency graph visualization
- [zizmor](https://github.com/zizmorcore/zizmor) -- Rust-based security-focused GitHub Actions linter (CLI only)
- [GitHub Docs: Script Injections](https://docs.github.com/en/actions/concepts/security/script-injections) -- Untrusted input contexts (head_ref, title, body, etc.)
- [GitHub Actions Security Best Practices (StepSecurity)](https://www.stepsecurity.io/blog/github-actions-security-best-practices) -- Security hardening checklist
- [GitHub Actions Security Cheat Sheet (GitGuardian)](https://blog.gitguardian.com/github-actions-security-cheat-sheet/) -- Comprehensive security reference
- [GitHub Docs: Workflow Syntax](https://docs.github.com/en/actions/using-workflows/workflow-syntax-for-github-actions) -- Official workflow YAML reference
- [GitHub Docs: Using the visualization graph](https://docs.github.com/actions/managing-workflow-runs/using-the-visualization-graph) -- GitHub's built-in workflow run visualization
- [tj-actions/changed-files supply chain attack](https://www.wiz.io/blog/github-actions-security-guide) -- 2025 incident demonstrating importance of action pinning

---
*Feature research for: GitHub Actions Workflow Validator*
*Researched: 2026-03-04*
