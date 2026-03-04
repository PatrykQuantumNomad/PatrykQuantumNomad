# Project Research Summary

**Project:** GitHub Actions Workflow Validator (v1.13)
**Domain:** Browser-based GitHub Actions workflow linting and visualization tool
**Researched:** 2026-03-04
**Confidence:** HIGH (with one open architecture decision — see Key Decision below)

## Key Decision Required Before Roadmap Finalizes

**The actionlint WASM question must be resolved during requirements scoping.** The four research files disagree on a central architectural choice. Both paths are technically sound; they produce different tools with different trade-offs. The user must choose before roadmap phases are finalized.

| | Option A: TypeScript-Native Rules | Option B: actionlint WASM |
|---|---|---|
| **Advocate** | STACK.md | FEATURES.md, ARCHITECTURE.md, PITFALLS.md |
| **Rule count** | ~40-50 TypeScript rules | ~50-64 rules (18 actionlint kinds + 32-46 custom) |
| **New npm deps** | Zero | Zero (binary assets only) |
| **Binary download** | None | ~800 KB-1 MB gzipped (~2.5 MB uncompressed) |
| **Unique capability lost** | Expression type checking, action input validation, cron syntax, matrix semantics | None (all actionlint coverage preserved) |
| **Build complexity added** | None (pure TypeScript) | Download pre-built WASM binary; Go toolchain NOT required (use playground binary) |
| **CI complexity added** | None | Verify binary version in CI; no Go compilation needed |
| **Integration pattern** | Same synchronous TS pattern as 3 existing tools | Web Worker + postMessage (first Worker in codebase) |
| **Main thread risk** | None | Must use Web Worker (mandatory, well-documented) |
| **Differentiator vs competitors** | Strong (scoring, graph, docs) | Strongest (only browser tool combining SchemaStore + actionlint) |
| **Expression checking depth** | Syntax + known names (~300-line TS parser) | Full type checking via actionlint's Go implementation |
| **Action input validation** | Not feasible without 200+ action manifests | Yes (actionlint has built-in popular action metadata) |

**STACK.md's primary objection to WASM is partially addressed by ARCHITECTURE.md:** STACK.md assumed Go toolchain compilation would be required in CI. ARCHITECTURE.md identifies that the pre-built actionlint playground WASM binary can be downloaded directly — no Go toolchain required. The `wasm_exec.js` version-coupling concern remains valid; PITFALLS.md addresses it with a copy-from-GOROOT-in-same-CI-step mitigation.

**Synthesis recommendation:** Option B (actionlint WASM) is the stronger product if the user accepts the Web Worker integration complexity. The 3-vote majority (FEATURES, ARCHITECTURE, PITFALLS) is backed by concrete implementation patterns, binary acquisition strategy, and explicit mitigations for every concern STACK.md raised. The expression type checking and action input validation gaps in Option A are real — they represent what most users associate with "actionlint coverage." That said, Option A ships a fully capable validator faster with lower integration risk. Both are defensible choices; the user must decide.

---

## Executive Summary

The GitHub Actions Workflow Validator is the fourth tool in an established portfolio suite (Dockerfile Analyzer, Compose Validator, K8s Analyzer). The build pattern is proven: pre-compiled Ajv schema validator for structural checks, custom TypeScript lint rules for semantic checks, React Flow for graph visualization, nanostores for state, CodeMirror for editing, and lz-string for URL state. Zero new npm dependencies are required regardless of which architecture path is chosen. The only genuinely new code is either a custom TypeScript expression parser for `${{ }}` syntax (Option A) or a Web Worker bridge for the actionlint Go WASM binary (Option B). All other components follow patterns already established by existing tools.

The competitive landscape reveals a clear market gap: no existing browser-based tool combines SchemaStore JSON Schema validation with actionlint's semantic analysis. The actionlint playground runs only actionlint; `action-validator` runs only SchemaStore. The two-pass architecture combining both is unique and represents the primary product differentiator available under Option B. The workflow graph visualization (triggers -> jobs -> steps) is equally unique — no competitor renders all three tiers, and GitHub's own built-in graph only appears for running workflows, not during authoring. These two features together define what makes this tool worth building over the existing alternatives.

The primary technical risks are WASM-specific (Option B path): binary size on mobile connections (~800 KB-1 MB gzipped is acceptable but requires lazy loading), main thread blocking (mandatory Web Worker, well-documented Go WASM pattern), and two-pass diagnostic deduplication (must be designed upfront, not retrofitted). All risks have documented mitigations sourced from the actionlint playground implementation itself. The TypeScript-only path (Option A) carries no new technical risks but sacrifices the tool's strongest competitive differentiator: actionlint-grade expression type checking and action input validation in the browser.

---

## Key Findings

### Recommended Stack

The validator requires zero new npm dependencies regardless of path. All runtime libraries (CodeMirror, yaml, ajv, @xyflow/react, @dagrejs/dagre, nanostores, lz-string, React) are already installed and proven in existing tools. Under Option A, new artifacts are TypeScript source files only. Under Option B, two static assets are added to `public/wasm/` — `actionlint.wasm` (~2.5 MB uncompressed) and `wasm_exec.js` (~18 KB) — plus one Web Worker TypeScript file.

**Core technologies (both options):**
- **Astro 5.17.1**: Static site generator — `getStaticPaths()` for per-rule documentation pages, proven in 3 existing tools
- **TypeScript + yaml library**: YAML AST parsing with line numbers — same pattern as compose-validator and k8s-analyzer
- **Ajv 8.18.0 (build-time only)**: Pre-compile SchemaStore `github-workflow.json` to standalone CSP-safe validator — same pattern as `compile-compose-schema.mjs`
- **@xyflow/react + @dagrejs/dagre**: Workflow graph visualization — already installed, proven in Compose and K8s tools
- **nanostores**: Editor-to-results bridge — already installed, proven in 3 tools
- **lz-string**: URL state compression — already installed, proven in 3 tools

**Option B additional artifacts (static assets, not npm packages):**
- **`public/wasm/actionlint.wasm`**: Pre-built Go WASM binary downloaded from actionlint playground deployment — no Go toolchain required; ~2.5 MB uncompressed, ~800 KB-1 MB with Brotli
- **`public/wasm/wasm_exec.js`**: Go runtime JavaScript bridge (~18 KB) — must match Go version used to compile binary

**Option A additional code (TypeScript only):**
- **`expression-parser.ts`**: ~300-400 line recursive-descent parser for `${{ }}` syntax — covers syntax + known names, not full type checking

**Explicitly rejected (both options):** `vite-plugin-wasm`, `vite-plugin-top-level-await`, `pako`, any `actionlint` npm wrapper (abandoned), Go toolchain in CI.

### Expected Features

**Must have (table stakes):**
- YAML syntax validation — #1 cause of workflow failures; every validator starts here
- SchemaStore JSON Schema structural validation — IDEs use this schema; users expect equivalent coverage
- Inline CodeMirror error annotations — all existing tools have this; users expect consistency
- Category-weighted scoring with letter grades (A+ through F) — consistent with tool suite
- Score badge PNG for README embedding — Dockerfile and K8s tools set this expectation
- Per-rule documentation pages (`/tools/gha-validator/rules/[code]`) — established pattern with SEO value
- Results panel with violation list grouped by category — standard in all tools
- Sample workflow demonstrating common issues — expected for first-time visitors
- URL state persistence for shareable links — established pattern

**Should have (differentiators):**
- Workflow graph visualization (triggers -> jobs -> steps) — unique; no competitor renders all three tiers
- Two-pass architecture (SchemaStore + actionlint) — unique combination; Option B only; Option A provides single-pass
- Custom security rules (GA-C001-010): unpinned actions, script injection, overly permissive permissions, `pull_request_target` misuse — 10 rules, both options
- Custom best practice rules (GA-B001-008): missing `timeout-minutes`, concurrency groups, unnamed steps — 8 rules, both options
- Expression syntax and context validation (GA-E*) — both options, but type-depth differs significantly
- Job `needs:` dependency cycle detection with visual feedback — both options (algorithm reused from compose-validator)
- Rich fix explanations with before/after code — key UX differentiator vs terse actionlint one-liners

**Defer to v2+:**
- Reusable workflow resolution (multi-file upload, cross-workflow analysis)
- Custom rule configuration UI (enable/disable individual rules)
- Action version update suggestions (requires GitHub API)
- Matrix expansion preview (show all combinations)

**Do not build (anti-features):**
- Live GitHub API validation — CORS, rate limits, requires token; breaks offline use
- Auto-fix / rewrite workflow — context-dependent fixes could introduce breaking changes
- shellcheck/pyflakes in browser — requires native Haskell/Python binaries; not feasible as WASM
- Real-time keystroke validation with WASM — debounce at 300-500 ms instead

### Architecture Approach

The architecture follows the established three-layer pattern: Astro page with `client:only="react"` island boundary, React components connected via nanostores atoms, and a TypeScript engine layer with validators and rules. The primary architectural novelty under Option B is a Web Worker bridge for the Go WASM binary — the first Worker in the codebase, but a well-documented pattern with concrete implementation guidance in the research. Under Option A, the architecture is identical to compose-validator with only a custom expression parser as new territory.

**Major components (both options):**
1. **engine.ts** — Validation orchestrator; single-pass (Option A) or two-pass with schema + WASM coordination (Option B)
2. **schema-validator.ts** — Pass 1: SchemaStore github-workflow.json validated with pre-compiled Ajv standalone
3. **rules/** — Category-organized TypeScript lint rules (GA-C*, GA-B*, GA-E*, GA-F*, GA-S*, and GA-R* for reliability)
4. **graph-data-extractor.ts** — Workflow graph: extract triggers from `on:`, jobs with `needs:` edges, sequential steps within each job
5. **scorer.ts** — Category-weighted diminishing-returns scoring (schema 15%, security 30%, reliability 25%, best-practice 20%, style 10%)
6. **GhaResultsPanel.tsx** — Tabbed results: Score, Categories, Violations, Graph
7. **GhaWorkflowGraph.tsx** — React Flow graph with custom trigger/job/step nodes and dagre TB layout

**Option B additional components:**
- **actionlint.worker.ts** — Classic Web Worker (NOT module worker); loads `wasm_exec.js` via `importScripts()` + fetches `actionlint.wasm` via `WebAssembly.instantiateStreaming()`
- **actionlint-bridge.ts** — Promise wrapper around Worker `postMessage`/`onmessage`; lazy-initializes Worker on first Analyze click; graceful degradation if WASM fails

**Critical architectural rules (both options):**
- `client:only="react"` is mandatory for the validator island — WASM, Worker, and CodeMirror all require browser APIs; `client:load` causes SSR crashes
- WASM binary must live in `public/wasm/`, never imported as a Vite module — Go WASM uses `wasm_exec.js` bridge, not ES module exports
- Classic worker (no `{ type: 'module' }`), because `importScripts()` is unavailable in module workers
- No `vite-plugin-wasm` needed — static asset + `fetch()` approach sidesteps Vite plugin compatibility entirely
- Lazy-initialize Worker on first Analyze click — do not load WASM on page load

### Critical Pitfalls

1. **WASM main thread blocking (Option B — CRITICAL)** — `go.run()` blocks indefinitely; running on the main thread freezes the UI for the page lifetime. Web Worker is mandatory, not optional. Must be the first architectural decision proven in Phase 1. Recovery cost if missed: 2-3 days of refactoring.

2. **Two-pass diagnostic deduplication (Option B)** — Both passes may flag the same line (schema: "unknown property"; actionlint: "invalid event name"). Without deduplication, users see duplicate diagnostics and scores are double-penalized. Mitigation: deduplicate on `(line, column)` pairs, preferring actionlint findings over schema findings at same position. Must be designed upfront in the engine, not retrofitted.

3. **`wasm_exec.js` version mismatch (Option B)** — Bridge file must exactly match the Go compiler version used to build the binary. Using mismatched pair causes silent failures or runtime panics. Mitigation: copy `wasm_exec.js` from `GOROOT` in the same CI step as binary download; pin both files together in git commits.

4. **React Flow performance at scale (both options)** — Workflows with 10+ jobs and matrix strategies can produce 50-200 graph nodes. Without memoization the graph becomes unusable. Mandatory mitigations: `React.memo()` on all custom node components; `nodeTypes` defined at module scope; dagre layout computed only when graph structure changes; matrix strategy nodes collapsed by default.

5. **Astro hydration mismatch (both options)** — Using `client:load` instead of `client:only="react"` causes SSR crashes on `window`, `WebAssembly`, and `Worker` references. Recovery is fast (15 minutes) but easy to get wrong. Mitigation: `client:only="react"` for the entire validator component; static skeleton in the Astro page template.

6. **shellcheck/pyflakes absence (Option B — user expectation management)** — actionlint WASM explicitly disables shell and Python script analysis. Users familiar with the CLI will notice. Mitigation: document clearly on the tool page which checks run vs. which are unavailable in browser mode; never promise "complete GitHub Actions validation."

7. **Go WASM memory leaks (Option B)** — `js.FuncOf` allocations that are not `.Release()`d accumulate. Register Go functions exactly once at Worker startup; never create new `js.FuncOf` instances per lint call. Optionally restart Worker after ~100 lint operations in long-lived sessions.

---

## Implications for Roadmap

The phase structure below applies to **Option B (actionlint WASM)**. If Option A is chosen, Phase 1 collapses to schema infrastructure setup only (no WASM concerns), and the overall timeline shortens by approximately 2-3 days of Worker integration work.

### Phase 1: WASM Infrastructure and Schema Foundation

**Rationale:** The Web Worker + WASM integration is the highest-risk component. PITFALLS.md maps 6 of 10 critical pitfalls to this phase. Proving the WASM binary loads, runs in a Worker, and returns actionlint errors before any application code is built de-risks the entire project. If WASM proves unworkable, the team pivots to Option A with minimal sunk cost. The schema compilation (Ajv + SchemaStore) runs in parallel and follows the established compose-schema pattern exactly.

**Delivers:**
- `public/wasm/actionlint.wasm` and `public/wasm/wasm_exec.js` committed to repo (Option B) or skipped (Option A)
- `actionlint.worker.ts` proven to load binary, post "ready", and respond to lint requests (Option B)
- `actionlint-bridge.ts` with lazy-init, graceful degradation fallback, Promise wrapper (Option B)
- `scripts/compile-gha-schema.mjs` — downloads and pre-compiles SchemaStore github-workflow.json via Ajv standalone
- `src/lib/tools/gha-validator/validate-gha.js` — auto-generated compiled validator
- Production hosting configured with `Content-Type: application/wasm` and Brotli/gzip compression (Option B)
- Verification gate: actionlint WASM returns `ActionlintError[]` for a known-bad workflow in the browser console

**Avoids:** Pitfall 1 (WASM binary size), Pitfall 2 (main thread blocking), Pitfall 4 (MIME type misconfiguration), Pitfall 5 (Vite plugin conflicts), Pitfall 6 (wasm_exec.js version mismatch)

**Research flag:** Needs `/gsd:research-phase` — the exact download URL/version strategy for the pre-built actionlint playground WASM, how to pin it alongside `wasm_exec.js`, and the CI verification script for `Content-Type: application/wasm` in production.

---

### Phase 2: Validation Engine and Core Rules

**Rationale:** With infrastructure proven, the engine can be built against a working WASM bridge. Schema validation (ajv pass) follows the established compose-validator pattern exactly. Custom rules follow patterns from all three existing tools. The expression parser is the only genuinely novel TypeScript code. Two-pass deduplication must be built here — retrofitting it after the results panel is built causes compounding rework.

**Delivers:**
- `engine.ts` — two-pass orchestrator with merge + deduplication (Option B) or single-pass (Option A)
- `schema-validator.ts` — SchemaStore ajv validation with line-number mapping (GA-S001 through GA-S008)
- `expression-parser.ts` — recursive-descent `${{ }}` parser covering syntax, context names, function names (~300-400 lines)
- `rules/security/` — GA-C001 through GA-C010: unpinned actions, script injection, permissions, `pull_request_target`
- `rules/reliability/` — GA-R*: `needs:` cycle detection (Kahn's algorithm reused from compose-validator), undefined deps, deprecated actions, missing `timeout-minutes`
- `rules/best-practice/` — GA-B001 through GA-B008: concurrency groups, step naming, outdated actions
- `rules/expression/` — GA-E*: expression syntax, unknown context names, unknown function names
- `scorer.ts` — 5-category weighted scoring with diminishing-returns formula
- `types.ts` — `GhaLintRule`, `GhaRuleViolation`, `GhaSeverity`, `GhaCategory` interfaces
- Vitest unit tests for all rules and the expression parser

**Uses:** Ajv standalone validator (build-time), yaml library (AST parsing), actionlint WASM bridge (Option B)

**Implements:** Engine layer, schema validator, custom rules registry

**Avoids:** Pitfall 8 (two-pass diagnostic conflicts — deduplication built here, not later)

**Research flag:** Standard patterns from existing tools. No `/gsd:research-phase` needed unless expression parser scope expands to full type checking.

---

### Phase 3: UI Components and Results Panel

**Rationale:** UI follows the K8s Analyzer pattern closely. CodeMirror hook, results panel, nanostores atoms, and the Astro page skeleton are built once the engine API is stable. The island boundary (`client:only="react"`) must be declared correctly from the first line — it is not easily changed once component hierarchy is established.

**Delivers:**
- `ghaValidatorStore.ts` — nanostores atoms: `ghaResult`, `ghaAnalyzing`, `ghaEditorViewRef`, `ghaResultsStale`
- `use-codemirror-gha.ts` — CodeMirror 6 React hook with YAML lang, diagnostics, localStorage persistence
- `GhaValidator.tsx` — top-level React island (layout: EditorPanel + ResultsPanel)
- `GhaEditorPanel.tsx` — CodeMirror editor, Analyze button, Cmd+Enter shortcut, loading skeleton during WASM init
- `GhaResultsPanel.tsx` — tabbed results: Score, Categories, Violations, Graph
- `GhaCategoryBreakdown.tsx`, `GhaViolationList.tsx`, `GhaEmptyState.tsx` — result subcomponents
- `GhaShareActions.tsx`, `GhaPromptGenerator.tsx` — share/export following compose-results pattern
- `badge-generator.ts`, `url-state.ts`, `sample-workflow.ts` — following existing tool patterns exactly
- `src/pages/tools/gha-validator/index.astro` — main tool page with `client:only="react"` island

**Implements:** React island layer, nanostore bridge, CodeMirror integration

**Avoids:** Pitfall 10 (Astro hydration mismatch — `client:only` used correctly from the start)

**Research flag:** Standard K8s Analyzer pattern reuse. No `/gsd:research-phase` needed.

---

### Phase 4: Workflow Graph Visualization

**Rationale:** Graph visualization is separated from core validation because it is the most complex UI component and React Flow performance pitfalls must be addressed from the start. The core validator is functional after Phase 3; this phase adds the primary visual differentiator. The graph depends on `engine.ts` completing successfully but is independent of the results panel's violation list.

**Delivers:**
- `graph-data-extractor.ts` — `extractWorkflowGraph()` returning `GhaGraphData` (triggers, jobs with `needs:` edges, sequential steps)
- `GhaWorkflowGraph.tsx` — React Flow graph with dagre TB layout, lazy-loaded via `React.lazy()`
- `GhaTriggerNode.tsx`, `GhaJobNode.tsx`, `GhaStepNode.tsx` — custom nodes, all wrapped in `React.memo()`
- `GhaGraphSkeleton.tsx` — loading skeleton while React Flow chunk loads
- `nodeTypes` and `edgeTypes` defined at module scope (not inside render function)
- Dagre layout computed once per structure change, result cached between renders
- Matrix strategy nodes collapsed by default (single "matrix" node with expand-on-click)
- Step-level detail collapsed by default for workflows with 4+ jobs

**Implements:** Graph data model, React Flow visualization layer

**Avoids:** Pitfall 9 (React Flow performance collapse — memoization and layout caching built in from start)

**Research flag:** React Flow + dagre patterns proven in 2 existing tools. No `/gsd:research-phase` needed unless matrix strategy node interaction design requires deeper investigation.

---

### Phase 5: Rule Documentation Pages and Site Integration

**Rationale:** Per-rule SEO pages depend on the complete rule registry being stable. Once all GA-* rule IDs are finalized across Phases 2-4, the `getStaticPaths()` generator and `[code].astro` pages can be built in one coordinated pass. Site integration (navigation, homepage callout, JSON-LD, OG image) follows the same pattern as the three existing tools.

**Delivers:**
- `rules/index.ts` — `allGhaRules` array (all GA-S*, GA-C*, GA-B*, GA-R*, GA-E*, GA-F* rules + GA-L* actionlint kind mappings under Option B)
- `rules/related.ts` — cross-rule relationship graph for "related rules" sections
- `src/pages/tools/gha-validator/rules/[code].astro` — per-rule documentation pages with `getStaticPaths()`
- Satori + sharp OG image generation for rule pages
- Style rules (GA-F001 through GA-F004) added as final lowest-priority category
- Homepage/tools page callout with tool metadata
- Navigation header updated with new tool entry
- JSON-LD structured data for the tool page

**Implements:** Astro page layer (rule docs), site-level integration

**Research flag:** Standard Astro `getStaticPaths()` pattern proven in 3 existing tools. No `/gsd:research-phase` needed.

---

### Phase Ordering Rationale

- **Infrastructure before everything:** The WASM Worker is the only architectural unknown under Option B. Proving it in Phase 1 means all subsequent phases build on verified ground. If WASM is abandoned after Phase 1, Phases 2-5 are unaffected.
- **Engine before UI:** Phase 2 defines the `GhaEngineResult` and `GhaRuleViolation` types that all UI components depend on. Building UI against a stable API prevents rework.
- **Core UI before graph:** The tool is useful for validation after Phase 3. This ordering enables soft-launch before the graph is complete. The graph is enhancement, not blocker.
- **Documentation last:** Rule pages require finalized rule IDs. Phase 5 is a one-time batch operation that would require constant regeneration if done earlier.
- **Free algorithm reuse:** Kahn's cycle detection from `compose-validator/graph-builder.ts` is directly reusable for `needs:` dependency graphs. Zero new algorithm design required.

### Research Flags

**Needs `/gsd:research-phase` during planning:**
- **Phase 1** — WASM binary acquisition: exact download URL and version strategy for the pre-built actionlint playground WASM binary, how to version-pin it alongside `wasm_exec.js`, and CI script for verifying `Content-Type: application/wasm` in production. These operational details are not fully resolved in the research.

**Standard patterns, skip `/gsd:research-phase`:**
- **Phase 2** — All rule patterns follow existing tools. Expression parser is new code but well-scoped (~300 lines, documented grammar from GitHub's official docs).
- **Phase 3** — Direct K8s Analyzer pattern reuse. `client:only="react"` is well-established across the codebase.
- **Phase 4** — React Flow + dagre patterns proven in 2 existing tools. Performance mitigations are explicitly documented.
- **Phase 5** — Astro `getStaticPaths()` pattern proven in 3 existing tools. One-time batch operation.

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Direct codebase inspection confirms all dependencies installed and versions verified. WASM binary acquisition strategy (playground download vs. other sources) is the only open operational question. |
| Features | HIGH | Competitor analysis covers 6 tools with feature matrix. Rule counts are estimates (40-64 rules) but all rule IDs, severities, and check logic are specified. actionlint `kind` list verified against playground source code. |
| Architecture | HIGH | Web Worker + Go WASM pattern verified against actionlint's own playground implementation. `importScripts()` + classic worker pattern confirmed. Static asset approach confirmed correct for Go WASM (incompatible with ES module WASM import pattern). |
| Pitfalls | HIGH (WASM-specific), MEDIUM (two-pass coordination) | Binary size, Worker pattern, MIME type config, and `wasm_exec.js` versioning are all sourced from primary references. Two-pass deduplication overlap extent requires empirical mapping against real workflows — not benchmarked in research. React Flow performance thresholds are general guidance, not benchmarked for this specific three-tier graph model. |

**Overall confidence:** HIGH

### Gaps to Address

- **actionlint WASM binary version strategy:** The exact pre-built binary source and how to handle actionlint version updates without Go toolchain. Resolve during Phase 1 planning via `/gsd:research-phase`.

- **Two-pass diagnostic overlap extent:** The research identifies that both passes may flag the same issues, but the exact overlap set is not empirically mapped. Build a 20-workflow test corpus during Phase 2 and run both passes independently to catalog duplicates before finalizing the deduplication logic.

- **Expression parser coverage vs. actionlint depth (Option A):** The custom TypeScript parser covers syntax and known names but not type checking. The practical coverage gap versus actionlint's Go implementation is not quantified. If expression type errors are common in real-world workflows, Option A's coverage may feel incomplete to power users. Evaluate during requirements scoping.

- **Mobile performance with WASM (Option B):** Go WASM can OOM on mobile devices with limited heap (Go issue #27462). The ~2.5 MB binary plus Go runtime memory requirements during execution have not been benchmarked on low-end mobile. Verify on a mid-range Android device during Phase 1 validation before public launch.

---

## Sources

### Primary (HIGH confidence)
- **Existing codebase** (`compose-validator/`, `k8s-analyzer/`, `dockerfile-analyzer/`) — Direct inspection of integration patterns, APIs, and dependency versions
- [actionlint GitHub repository](https://github.com/rhysd/actionlint) — playground source (`main.go`, `Makefile`), WASM interface (`lib.d.ts`), checks documentation, Go module dependencies
- [actionlint playground](https://rhysd.github.io/actionlint/) — Live WASM reference demonstrating browser feasibility with the same binary
- [SchemaStore github-workflow.json](https://github.com/SchemaStore/schemastore/blob/master/src/schemas/json/github-workflow.json) — ~97 KB JSON Schema draft-07, Apache-2.0 license
- [Go Wiki: WebAssembly](https://go.dev/wiki/WebAssembly) — minimum binary size, `wasm_exec.js` requirements, compilation flags
- [Go issue #59061](https://github.com/golang/go/issues/59061) — confirmed WASM does not return memory to OS
- [Go issue #74342](https://github.com/golang/go/issues/74342) — `syscall/js` bridge memory leak behavior
- [React Flow Performance Guide](https://reactflow.dev/learn/advanced-use/performance) — memoization requirements and re-render triggers
- [Vite Features: Web Workers](https://vite.dev/guide/features#web-workers) — Worker bundling in Vite
- [Astro client directives reference](https://docs.astro.build/en/reference/directives-reference/) — `client:only` semantics and SSR behavior

### Secondary (MEDIUM confidence)
- [xing/actionlint npm package](https://github.com/xing/actionlint) — Community WASM packaging with browser + Node.js entry points (alternative binary source)
- [Eli Bendersky: Go WebAssembly notes](https://eli.thegreenplace.net/2024/notes-on-running-go-in-the-browser-with-webassembly/) — ~2.5 MB binary size data, TinyGo reflection limitations
- [Digital Flapjack: Go WASM in Web Workers](https://digitalflapjack.com/blog/go-wasm-workers/) — Worker initialization pattern, `importScripts()` approach
- [Minimizing Go WASM Binary Size](https://dev.bitolog.com/minimizing-go-webassembly-binary-size/) — `fmt` costs ~400 KB, gzip reduces 2 MB to ~500 KB
- [zizmor](https://github.com/zizmorcore/zizmor) — Closest security competitor; CLI-only, 24 rules, SARIF output
- [GitHub Docs: Script Injections](https://docs.github.com/en/actions/concepts/security/script-injections) — Untrusted input contexts for security rule design
- [StepSecurity GitHub Actions Security Best Practices](https://www.stepsecurity.io/blog/github-actions-security-best-practices) — Security rule design reference
- [action-validator](https://github.com/mpalmer/action-validator) — SchemaStore-based CLI validator (competitor analysis)
- [FOSSA GitHub Actions Visualizer](https://fossa.com/resources/devops-tools/github-actions-visualizer/) — Job-only graph competitor (no triggers, no steps)
- [vite-plugin-wasm](https://github.com/Menci/vite-plugin-wasm) — Why NOT needed for Go WASM (ES module pattern incompatible with Go bridge)

### Tertiary (LOW confidence)
- [Go issue #27462: WASM OOM on mobile](https://github.com/golang/go/issues/27462) — Mobile memory concern; not benchmarked for this specific binary size
- [Gist: Minimizing Go WASM multi-pronged approach](https://gist.github.com/paralin/57b0b6a03da3f38709c76480dce1be45) — Community optimization techniques, unverified claims

---
*Research completed: 2026-03-04*
*Ready for roadmap: yes — pending resolution of actionlint WASM architecture decision (Option A vs Option B)*
