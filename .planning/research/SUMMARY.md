# Project Research Summary

**Project:** Docker Compose Validator (v1.6 milestone)
**Domain:** Browser-based Docker Compose validation tool with interactive dependency graph visualization
**Researched:** 2026-02-22
**Confidence:** HIGH

## Executive Summary

The Docker Compose Validator is a browser-based developer tool that validates Docker Compose YAML files against the compose-spec JSON Schema and a custom semantic rule engine, displays category-weighted scores with letter grades, annotates violations inline in a CodeMirror 6 editor, and renders an interactive service dependency graph. This is a direct extension of the existing Dockerfile Analyzer (v1.4) architecture — the same patterns govern the rule engine, scoring system, editor, nanostores, and Astro page structure. The primary novel challenges are: (1) YAML AST parsing with source-range preservation using the `yaml` npm package, (2) JSON Schema validation via Ajv against the official compose-spec schema with error-to-line mapping, and (3) interactive graph visualization using React Flow with dagre layout.

The recommended approach is to treat the Compose Validator as a parallel tool, not an extension of the Dockerfile Analyzer. All code lives under a separate `src/lib/tools/compose-validator/` namespace. Patterns are copied and adapted rather than abstracted into shared modules — this keeps tools independently evolvable without coupling. The pipeline has a strict dependency order: YAML parsing must work first, then schema validation, then semantic rules, then the editor integration, then the React Flow graph, then site integration. Deviating from this order creates integration problems that are expensive to untangle.

The most critical risks are: YAML 1.1 merge key configuration (Docker Compose uses `<<` merge keys that YAML 1.2 ignores by default), the line-number mapping problem (ajv operates on plain JSON objects with no positional data, so a path resolver must walk the YAML AST to recover source lines), and React Flow bundle size (the graph adds ~100-150 KB gzipped, requiring lazy-loading to keep Lighthouse scores at 90+). All three risks have well-defined prevention strategies documented in the research and must be addressed in Phase 1 before any UI code is written.

## Key Findings

### Recommended Stack

The project builds on the existing Astro 5 + React 19 + TypeScript + Tailwind + CodeMirror 6 stack already deployed on the site. Eight new npm dependencies are required. All are MIT-licensed, all ship TypeScript types, none introduce SSR complexity beyond what is already solved by the `client:only="react"` pattern.

**Core technologies:**

- `yaml` 2.8.2 — YAML parsing with full AST and source ranges — the only YAML parser that preserves node positions for CodeMirror annotation mapping; `js-yaml` is not viable because it returns plain objects with no line data
- `@codemirror/lang-yaml` 6.1.2 — CodeMirror YAML syntax highlighting — Lezer-based (not the legacy stream mode used for Dockerfiles), proper indentation support
- `ajv` 8.18.0 + `ajv-formats` 3.0.1 — JSON Schema validation against compose-spec — fastest JavaScript JSON Schema validator, Draft-07 support required by the compose-spec schema, reducible from ~122 KB to ~20 KB gzip with pre-compiled standalone validation
- `@xyflow/react` 12.10.1 — interactive dependency graph — standard React graph library with pan/zoom/minimap built in, fits the existing `client:only="react"` island pattern, requires lazy-loading to manage bundle impact
- `@dagrejs/dagre` 2.0.4 — hierarchical graph layout — 30-40 KB gzip vs. elkjs at 1.4 MB; adequate for Docker Compose graphs which are typically 5-30 nodes in a tree/forest shape
- `graphology` 0.26.0 + `graphology-dag` 0.4.1 — graph data structures and analysis — `hasCycle()`, `topologicalSort()`, `topologicalGenerations()` for circular dependency detection and startup order computation

Bundle impact: ~170-175 KB gzip eager + ~120-140 KB gzip deferred (lazy-loaded graph). With Ajv pre-compilation: ~70-75 KB eager. Both strategies keep Lighthouse Performance at 90+.

### Expected Features

The tool has 44+ rules across five categories. The rule count is comparable to the Dockerfile Analyzer's 39 rules. No existing browser-based tool combines schema validation, semantic analysis, security rules, best practices, scoring, and interactive graph visualization — this gap is the primary market position.

**Must have (table stakes):**
- CodeMirror 6 editor with YAML syntax highlighting — users expect this from the Dockerfile Analyzer precedent
- On-demand analysis triggered by button and keyboard shortcut — not real-time (as-you-type validation is an anti-feature for YAML)
- Schema validation (~8 rules via Ajv + compose-spec.json) — structural correctness baseline
- Semantic analysis (~15 rules) — port conflicts, circular `depends_on`, undefined resource references, orphan definitions
- Security rules (~14 rules, OWASP-aligned) — privileged mode, Docker socket mount, secrets in env vars, dangerous capabilities
- Best practice rules (~12 rules) — image pinning, healthchecks, restart policies, resource limits
- Style rules (~3 rules) — alphabetical ordering, port quoting
- Category-weighted 0-100 scoring with letter grades and per-category breakdown
- Inline editor annotations (squiggly underlines + gutter markers)
- Interactive dependency graph with cycle detection — no competing browser tool has this
- Per-rule documentation pages at `/tools/compose-validator/rules/[code]` (44+ pages) — SEO value
- Score badge PNG download and shareable lz-string URL state
- Pre-loaded sample compose file that exercises all rule categories

**Should have (competitive):**
- Network topology overlay on graph (color-coded network membership)
- Volume sharing visualization on graph
- Graph export as PNG/SVG
- Rule severity configuration for power users

**Defer (v2+):**
- YAML formatting/prettification — many tools already do this
- Compose file template library — out of scope for v1
- Side-by-side comparison mode
- Integration with Dockerfile Analyzer for build-section Dockerfiles

**Anti-features (explicitly not building):**
- Auto-fix/auto-correct — too many edge cases; fix suggestions in rule docs instead
- Real-time as-you-type linting — noisy during mid-edit, expensive on large files
- Multi-file compose support — browser has no filesystem; scope explosion
- AI-powered analysis — contradicts expert-positioning; requires backend API calls
- Docker Hub image verification — requires network calls, rate-limited

### Architecture Approach

The architecture is parallel-namespace, pattern-mirrored. Every structural decision mirrors the Dockerfile Analyzer at each layer: core lib, rules directory, components, store, pages. The Compose Validator does not share code with the Dockerfile Analyzer because the rule input types are fundamentally different (`dockerfile-ast` nodes vs. `yaml` Document AST nodes). Scoring, URL state, and badge generator algorithms are copied and customized — not abstracted — to keep the tools independently maintainable.

**Major components:**

1. `src/lib/tools/compose-validator/parser.ts` — YAML parsing entry point; creates `LineCounter`, calls `parseDocument()` with YAML 1.1 + merge key options, returns Document AST + LineCounter + plain JSON object for Ajv
2. `src/lib/tools/compose-validator/schema-validator.ts` — Ajv validation against bundled compose-spec.json; maps `instancePath` JSON Pointer paths back to YAML AST nodes via `resolveInstancePath()` to recover 1-based source line numbers
3. `src/lib/tools/compose-validator/rules/` — 44+ rule files in schema/security/reliability/best-practice/maintainability subdirectories; each rule receives a `ComposeRuleContext` with Document, LineCounter, and pre-extracted services/networks/volumes maps
4. `src/lib/tools/compose-validator/graph-builder.ts` — extracts service dependency graph from the YAML AST; shared output consumed by both semantic analysis rules (cycle detection) and React Flow visualization
5. `src/stores/composeValidatorStore.ts` — six nanostores mirroring the Dockerfile Analyzer store pattern: analysis result, analyzing flag, editor view ref, stale flag, graph data, active tab
6. `src/components/tools/compose-validator/DependencyGraph.tsx` — React Flow + dagre layout; lazy-loaded via `React.lazy()` to defer the ~120-140 KB graph bundle until user activates the graph tab
7. `src/pages/tools/compose-validator/` — tool page (Astro with `client:only="react"` island) and rule documentation pages (via `getStaticPaths` from the rule registry)

The analysis pipeline is sequential: parse YAML → validate schema → run semantic rules → build graph → compute score → set CodeMirror diagnostics → set nanostores → UI rerenders.

### Critical Pitfalls

1. **YAML 1.2 default silently breaks merge keys** — Docker Compose uses YAML 1.1 `<<` merge keys extensively; `yaml` package defaults to YAML 1.2 where `<<` is a literal key. Prevention: always pass `{ version: '1.1', merge: true, lineCounter }` to `parseDocument()`. Must be correct from the first line of parsing code.

2. **ajv errors have no line numbers — AST path resolver required** — ajv validates plain JSON objects and reports errors as JSON Pointer paths (`/services/api/ports/0`). The YAML Document AST must be walked segment by segment to find the source node's range. Prevention: build `resolveInstancePath()` as the single line-mapping entry point; pass `LineCounter` through the entire pipeline.

3. **YAML AST nodes can have undefined `range` property** — documented yaml package edge case (GitHub issue #573); TypeScript types declare range as always present but runtime can return `undefined`. Prevention: always guard with `if (node?.range && Array.isArray(node.range))` before accessing; wrap resolver in try/catch with fallback to line 1.

4. **React Flow requires DOM APIs — SSR crashes without `client:only`** — `client:load` and `client:visible` both attempt SSR; React Flow crashes. Prevention: use `client:only="react"` (proven from Dockerfile Analyzer). Lazy-load React Flow with `React.lazy()` to keep initial bundle under 175 KB gzip.

5. **Variable interpolation `${VAR:-default}` produces false validation positives** — Compose files widely use Bash-style variable interpolation; rules that parse port numbers or check for hardcoded secrets cannot distinguish `${DB_PASS}` from `hardcoded-secret`. Prevention: build an interpolation-aware normalizer in Phase 1 before any validation rules run.

6. **Dagre layout hangs on cyclic `depends_on`** — dagre is a DAG layout engine and can hang on cyclic graphs. Prevention: run graphology `hasCycle()` before calling dagre; break cycles for layout by removing one edge per cycle and visually marking it (red dashed edge with a cycle icon).

## Implications for Roadmap

Based on the combined research, the architecture prescribes a strict dependency order. The suggested 8-phase structure maps directly from the architecture's build-order analysis. Phases 1 through 4 are a strict sequential chain; Phases 5 and 6 can proceed in parallel; Phases 7 and 8 finalize integration and polish.

### Phase 1: YAML Parsing and Schema Validation Foundation

**Rationale:** Everything in the pipeline depends on being able to parse YAML into an AST with source ranges AND validate it against the compose-spec schema with line-accurate error reporting. This is the only phase with no upstream code dependencies. The line-number mapping problem is the most architecturally novel piece of the project and must be proven correct before any UI code is written.

**Delivers:** `types.ts`, `parser.ts` (with YAML 1.1 + merge key config), `compose-spec-schema.json` (bundled with version comment), `schema-validator.ts` with working `resolveInstancePath()`, interpolation normalizer. Unit-testable in isolation.

**Addresses:** Schema validation rules (~8 CV-S prefix rules), interpolation handling, YAML syntax error reporting

**Avoids:** Pitfall 1 (YAML 1.1 config), Pitfall 2 (line mapping), Pitfall 3 (Ajv configuration), Pitfall 5 (interpolation normalizer), Pitfall 6 (range undefined guard), Pitfall 12 (schema version pinning)

**Research flag:** Standard patterns — yaml package API verified at eemeli.org/yaml; Ajv verified at ajv.js.org; compose-spec schema verified at GitHub. No additional research phase needed.

### Phase 2: Semantic Rule Engine and Scoring

**Rationale:** Rules are the core value proposition. Building the logic layer before the UI ensures correctness is verified independently of visual noise. The rule engine pattern is a direct copy of the Dockerfile Analyzer's engine — low risk, well-understood. Cycle detection must be built here as a shared utility consumed by both semantic rules AND graph visualization (Phase 4) — building it in Phase 2 prevents duplication.

**Delivers:** 44+ rule files across schema/security/reliability/best-practice/maintainability, rule registry (`rules/index.ts`), engine (`engine.ts`), scorer (`scorer.ts`), graph-builder (`graph-builder.ts`), cycle-detector (`cycle-detector.ts`).

**Uses:** `graphology` + `graphology-dag` for cycle detection and topological sort; Ajv errors merged with custom rules in engine.

**Implements:** `ComposeLintRule` interface, `ComposeRuleContext`, category weights (schema 20%, security 30%, reliability 25%, best-practice 15%, maintainability 10%)

**Avoids:** Pitfall 8 (dagre cycle hang — shared cycle detector built here, consumed by graph layout in Phase 4)

**Research flag:** Standard patterns — rule engine is a direct mirror of the Dockerfile Analyzer. Security rule content is sourced from OWASP Docker Security Cheat Sheet and compose-spec docs. No additional research phase needed.

### Phase 3: CodeMirror YAML Editor and Nanostores

**Rationale:** The editor is the input surface; it depends on the parser and engine from Phases 1-2 being proven correct. CodeMirror lifecycle management (View Transitions, unmount cleanup) is already solved by the Dockerfile Analyzer — this is adaptation, not new engineering.

**Delivers:** `use-codemirror-yaml.ts` (adapted from existing hook, swapping `@codemirror/lang-yaml` for legacy Dockerfile mode), `editor-theme.ts`, `sample-compose.ts` (sample with deliberate issues across all categories), `composeValidatorStore.ts`, `ComposeEditorPanel.tsx`.

**Uses:** `@codemirror/lang-yaml` for YAML syntax highlighting and indentation.

**Implements:** Editor → analyze → write results to nanostore data flow. Stale flag when document changes after last analysis. Tab state atom for Results vs Graph toggle.

**Avoids:** Pitfall 9 (CodeMirror offset alignment — both yaml package and CodeMirror use JavaScript string character indexing; offsets are compatible when both operate on the same string from `view.state.doc.toString()`)

**Research flag:** Standard patterns — direct adaptation of existing `use-codemirror.ts` hook.

### Phase 4: Results Panel and Dependency Graph

**Rationale:** The UI visualization layer is output-only — it reads from nanostores populated by earlier phases. React Flow's lazy-loading strategy must be in place from the first render to avoid bundle size regression on Lighthouse.

**Delivers:** `ComposeScoreGauge.tsx`, `ComposeCategoryBreakdown.tsx`, `ComposeViolationList.tsx`, `ComposeEmptyState.tsx`, `ComposeShareActions.tsx`, `ComposeResultsPanel.tsx`, `DependencyGraph.tsx` (lazy-loaded via `React.lazy()`), `ComposeValidator.tsx` (root island with tab toggle).

**Uses:** `@xyflow/react` + `@dagrejs/dagre` for graph rendering and layout; cycle data from graph-builder (Phase 2) breaks cycles before dagre runs.

**Implements:** Tab-toggle layout (Results | Graph) so both panels share the right-side space — a three-column layout does not work on standard desktops. Cycle edges rendered in red animated dashes. Custom ServiceNode component styled to site theme.

**Avoids:** Pitfall 4 (React Flow SSR — `client:only="react"` + `React.lazy()`); Pitfall 8 (dagre cycles — cycle-breaker from Phase 2 used here); Pitfall 11 (React Flow CSS conflicts — CSS custom properties override mapped to site design tokens)

**Research flag:** React Flow v12 layout with dagre is documented with official examples. The tab-toggle UX pattern needs no research. No additional research phase needed.

### Phase 5: Shareability and Badge Export

**Rationale:** These features depend on the full analysis cycle working correctly. They are low-complexity adaptations of existing Dockerfile Analyzer utilities and can proceed in parallel with Phase 6.

**Delivers:** `url-state.ts` (lz-string compress/decompress for shareable URLs, with distinct query parameter to avoid collision with Dockerfile Analyzer URL state), `badge-generator.ts` (SVG badge + PNG download with Compose Validator branding).

**Avoids:** URL hash namespace collision with Dockerfile Analyzer URL state.

**Research flag:** Standard patterns — direct adaptation of existing utilities.

### Phase 6: Rule Documentation Pages

**Rationale:** Rule doc pages are build-time Astro static pages; they only require the rule registry from Phase 2 to exist. They can be built in parallel with Phase 5. They deliver 44+ SEO-indexable pages which are a significant traffic driver.

**Delivers:** `src/pages/tools/compose-validator/rules/[code].astro` generating 44+ documentation pages via `getStaticPaths` from `allComposeRules`.

**Research flag:** Standard patterns — direct mirror of Dockerfile Analyzer rule page template at `src/pages/tools/dockerfile-analyzer/rules/[code].astro`.

### Phase 7: Tool Page and Site Integration

**Rationale:** The tool page wraps the React island (Phase 4) in an Astro page with SEO metadata, JSON-LD structured data, and navigation integration. All modification targets are well-understood: Header, tools index, homepage callout.

**Delivers:** `src/pages/tools/compose-validator/index.astro`, `ComposeValidatorJsonLd.astro`, Header nav link (under Tools, not as a standalone 9th item), tools index card, homepage callout.

**Avoids:** Adding a standalone nav link that creates visual clutter — the Compose Validator lives under the Tools section, not as a top-level nav item.

**Research flag:** Standard patterns. Integration targets (Header, tools index, homepage) are all well-understood files.

### Phase 8: OG Images, Blog Post, and Polish

**Rationale:** Finalization tasks depend on pages existing (Phase 7) and have no blocking dependencies on each other.

**Delivers:** OG image route (`compose-validator.png.ts`), `generateComposeValidatorOgImage()` addition to `og-image.ts`, companion blog post (MDX), Lighthouse audit (target 90+), accessibility review, sitemap verification, LLMs.txt updates (both `llms.txt.ts` and `llms-full.txt.ts` must include the tool page and all 44+ rule documentation pages).

**Avoids:** Missing the LLMs.txt update (an easy omission that silently breaks AI-discoverable content)

**Research flag:** Standard patterns. The LLMs.txt update is a checklist task — inspect existing Dockerfile Analyzer entries and mirror the pattern.

### Phase Ordering Rationale

- Phases 1 → 2 → 3 → 4 is a strict sequential chain: parsing enables rules, rules enable the editor integration, editor integration enables the results UI.
- Phases 5 and 6 are parallel and depend only on Phase 4 (full analysis cycle) and Phase 2 (rule registry) respectively.
- Phase 7 depends on Phase 4 (the React island must exist) and Phase 6 (rule pages must exist for cross-linking in navigation and rule violation detail links).
- Phase 8 depends on Phase 7 (pages must exist for OG image routes).
- Cycle detection (Phase 2) is deliberately built before graph visualization (Phase 4) because dagre hangs on cyclic graphs. Sharing one cycle-detection utility between both consumers prevents the pitfall without duplication.
- Pitfalls 1, 2, 5, 6 are all addressed in Phase 1 — front-loading the highest-risk novel code into the most isolated, unit-testable phase.

### Research Flags

**Phases needing deeper research during planning:** None identified. All 8 phases operate on well-documented libraries with verified APIs, or on direct adaptations of the existing Dockerfile Analyzer. Every major library was verified against official documentation during the research phase.

**Phases with standard patterns (skip additional research phase):**
- Phase 1: yaml package and Ajv APIs fully verified with official docs.
- Phase 2: Rule engine is a direct mirror of the existing Dockerfile Analyzer engine.
- Phase 3: CodeMirror 6 integration pattern is already proven in production on the site.
- Phase 4: React Flow v12 + dagre integration documented with official examples at reactflow.dev.
- Phases 5-8: All adaptations of existing site patterns with no novel technical unknowns.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All 8 packages verified via npm registry, official docs, and GitHub. Version numbers confirmed. Bundle sizes estimated from official sources. The dual-parser architecture (yaml for AST + Ajv for schema) is the architectural cornerstone and was thoroughly verified. |
| Features | HIGH | 44 rules sourced from compose-spec JSON Schema, OWASP Docker Security Cheat Sheet, DCLint, Code Pathfinder, and Docker official docs. Competitive analysis covered all significant browser and CLI tools. Rule gaps (no browser tool combines schema + semantic + security + scoring + graph) are confirmed. |
| Architecture | HIGH | Based on direct codebase analysis of the existing Dockerfile Analyzer. yaml/ajv/@xyflow/react APIs verified via official documentation. The parallel-namespace, pattern-mirrored approach is the clear recommendation for independent tool evolution. |
| Pitfalls | HIGH | Critical pitfalls sourced from yaml package GitHub issues, Docker Compose issue trackers, ajv strict mode docs, React Flow SSR issue trackers, and direct codebase pattern analysis. Most pitfalls are verified against real library behavior, not speculation. |

**Overall confidence:** HIGH

### Gaps to Address

- **Variable interpolation normalizer edge cases:** Research identified the need for interpolation handling but did not fully specify normalizer behavior for all Docker Compose interpolation syntax variants (`${VAR:?error}`, `$$` literal dollar sign, nested `${VAR:-${FOO}}`). The regex approach in PITFALLS.md is a starting point; verify all edge cases against Docker Compose's official interpolation docs during Phase 1 implementation before writing any semantic rules.

- **Ajv standalone pre-compilation evaluation:** STACK.md recommends this as a production optimization (reduces Ajv from ~110 KB to ~20 KB gzip), but the `ajv-cli` build step was not fully specified. Evaluate during Phase 1 — start with runtime Ajv for development velocity, add standalone compilation only if bundle size triggers a Lighthouse regression.

- **LLMs.txt update format:** Both `llms.txt.ts` and `llms-full.txt.ts` must be updated for the new tool and all rule pages. The exact format was not researched. Inspect the existing Dockerfile Analyzer entries during Phase 8 and mirror the pattern exactly.

- **React Flow CSS import behavior in Astro islands:** The `@xyflow/react/dist/style.css` import inside a `client:only` component may behave unexpectedly in Vite's CSS pipeline. Test CSS extraction on the first DependencyGraph render in Phase 4 and adjust if styles do not apply correctly. This is a known caveat from PITFALLS.md.

## Sources

### Primary (HIGH confidence)

- [yaml (Eemeli) official docs](https://eemeli.org/yaml/) — parseDocument API, LineCounter, YAML 1.1 vs 1.2 merge key behavior, range property
- [yaml GitHub repo + Issue #573](https://github.com/eemeli/yaml) — range undefined edge case, documented but not reflected in TypeScript types
- [Ajv official docs](https://ajv.js.org/) — JSON Schema validation, allErrors, strict mode, standalone compilation
- [Ajv strict mode docs](https://ajv.js.org/strict-mode.html) — patternProperties interaction with compose-spec schema's `^x-` extension fields
- [compose-spec JSON Schema](https://github.com/compose-spec/compose-spec/blob/main/schema/compose-spec.json) — Draft-07, verified structural coverage
- [React Flow / xyflow docs](https://reactflow.dev/) — dagre layout example, SSR crash fix, v12 migration guide
- [React Flow Astro Example](https://github.com/xyflow/react-flow-example-apps/tree/main/reactflow-astro) — official Astro integration
- [graphology-dag docs](https://graphology.github.io/standard-library/dag.html) — hasCycle, topologicalSort, topologicalGenerations APIs
- [OWASP Docker Security Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Docker_Security_Cheat_Sheet.html) — security rule foundation
- [Docker Compose Interpolation Docs](https://docs.docker.com/reference/compose-file/interpolation/) — variable substitution syntax
- [Docker Compose Fragments Docs](https://docs.docker.com/reference/compose-file/fragments/) — anchors, aliases, merge keys
- [Docker Compose Version and Name Docs](https://docs.docker.com/reference/compose-file/version-and-name/) — version field is obsolete in Compose v2+
- Existing codebase: `src/lib/tools/dockerfile-analyzer/` — rule engine, scorer, CodeMirror hook, nanostore patterns (verified by direct inspection)

### Secondary (MEDIUM confidence)

- [DCLint GitHub](https://github.com/zavoloklom/docker-compose-linter) — competitive rule set, auto-fix patterns
- [Code Pathfinder COMPOSE-SEC Rules](https://codepathfinder.dev/blog/announcing-docker-compose-security-rules) — CWE-mapped security rules
- [Docker Compose port conflict issue #6708](https://github.com/docker/compose/issues/6708) — semantic rule basis
- [Docker Compose circular dependency issue #7239](https://github.com/docker/compose/issues/7239) — semantic rule basis
- npm registry — all version numbers verified via `npm view [pkg] version`
- [dagre GitHub](https://github.com/dagrejs/dagre) — unmaintained since 2018; DAG-only, no cycle handling (informs pitfall 8)

---
*Research completed: 2026-02-22*
*Ready for roadmap: yes*
