# Project Research Summary

**Project:** Kubernetes Manifest Analyzer (v1.7 milestone)
**Domain:** Browser-based Kubernetes manifest validation, security analysis, and resource relationship visualization
**Researched:** 2026-02-23
**Confidence:** HIGH

## Executive Summary

The Kubernetes Manifest Analyzer is a browser-side static analysis tool for Kubernetes YAML manifests, built as the third tool in an existing Astro 5 portfolio site that already has a Dockerfile Analyzer (v1.4) and Docker Compose Validator (v1.6). The existing codebase provides a mature, proven pattern: CodeMirror 6 editor, pre-compiled Ajv standalone validators, a rule engine with diminishing-returns scoring, React Flow graph visualization with dagre layout, nanostore state management, and lz-string URL state. Zero new npm dependencies are needed. The K8s analyzer extends this pattern with three new architectural layers: multi-document YAML parsing (via `parseAllDocuments()`), per-resource-type schema validation (18 K8s resource types, K8s v1.31 schemas from yannh/kubernetes-json-schema), and a Resource Registry that enables cross-resource validation and interactive graph visualization.

The recommended approach is to build on the proven compose-validator architecture, introducing only the minimal new layers required: a GVK (Group-Version-Kind) registry for apiVersion/kind routing, a Resource Registry for cross-resource lookups, and a schema compilation pipeline that produces a single pre-compiled Ajv module for all 18 validators. The tool targets ~67 rules across six categories (Schema, Security, Reliability, Best Practice, Cross-Resource, RBAC), with category-weighted scoring (Security 35%, Reliability 20%, Best Practice 20%, Schema 15%, Cross-Resource 10%) and an interactive resource relationship graph as the headline differentiator. No existing browser-based K8s tool combines schema validation, security analysis, cross-resource validation, scoring, and graph visualization in one client-side tool.

The primary risks are bundle size explosion from K8s JSON schemas (each standalone schema is 50-200KB due to fully-inlined definitions) and cross-resource validation correctness (label selector semantics have non-obvious AND/OR behavior, namespace scoping, and well-known system resources that must be whitelisted). Both are well-documented in the research and have clear mitigation strategies. The schema risk must be addressed in Phase 1 before any other work proceeds; it is the critical path for the entire milestone.

## Key Findings

### Recommended Stack

The entire analyzer is buildable with zero new npm packages. The stack is the existing site's dependencies applied to a new domain. The `yaml` package's `parseAllDocuments()` handles multi-document YAML streams with a shared `LineCounter` that produces absolute character offsets across all documents. Ajv 8.x with standalone code generation compiles all 18 K8s JSON schemas (from yannh/kubernetes-json-schema v1.31.0-standalone-strict) into a single ESM module at build time, eliminating both runtime `new Function()` CSP violations and startup latency. React Flow + dagre are already proven in the compose-validator's dependency graph and extend directly to the more complex K8s resource relationship graph.

**Core technologies:**
- `yaml` (eemeli) v2.8.2: Multi-document YAML parsing — `parseAllDocuments()` with shared `LineCounter` for correct global line offsets across all documents
- `ajv` v8.18.0 + standalone code generation: Pre-compiled per-resource-type validators — same CSP-safe pattern proven in compose-validator, extended to 18 K8s resource types in one compiled module
- `@xyflow/react` v12.10.1 + `@dagrejs/dagre` v2.0.4: Resource relationship graph — extend compose service graph to multi-node-type K8s resource graph with LR layout
- `nanostores` v1.1.0: Cross-component state — same pattern as compose-validator; `k8sAnalyzerStore.ts` mirrors `composeValidatorStore.ts`
- `lz-string` v1.5.0: URL state compression — adapt with `#k8s=` hash prefix distinct from existing tools
- yannh/kubernetes-json-schema v1.31.0-standalone-strict: Schema data source — 18 JSON schema files downloaded at build time, compiled to single Ajv standalone module

**What NOT to use:** `js-yaml` (no AST/LineCounter), `@kubernetes/client-node` (500KB Node.js-only), runtime Ajv compilation (CSP violation), non-strict schema flavors (misses misspelled fields), graphology (cycle detection not needed for K8s resource graphs).

### Expected Features

The research identifies 67 total rules across six categories. The feature set is well-defined, with the competitive analysis confirming that no existing browser tool matches the planned depth.

**Must have (table stakes):**
- Multi-document YAML parsing with per-resource apiVersion/kind detection — K8s manifests are almost always multi-document
- Per-resource-type schema validation for 18 K8s resource types (K8s 1.31) — kubeconform-level structural correctness baseline
- Security rules (~20 rules, PSS Baseline/Restricted mapped, CIS-tagged) — primary user motivation for K8s linting
- Reliability rules (~12 rules: probes, replicas, update strategy, image tags) — universally expected
- Best practice rules (~12 rules: resource limits, labels, namespace) — every K8s practitioner expects resource limits checking
- RBAC analysis (~5 rules: wildcard permissions, cluster-admin binding) — CIS 5.1 aligned, adds credibility
- Cross-resource validation (~8 rules: Service->Deployment selector, Ingress->Service, ConfigMap/Secret/PVC/SA references) — headline differentiator
- Category-weighted 0-100 scoring with letter grades — established tool suite pattern
- Interactive resource relationship graph (React Flow + dagre) — no browser competitor has this
- Per-rule documentation pages at `/tools/k8s-analyzer/rules/[code]` — 67+ individually indexed SEO pages
- CodeMirror 6 editor with YAML highlighting, sample manifest, inline annotations — direct reuse from compose-validator
- Score badge, shareable URL state, companion blog post, OG images, JSON-LD — standard site integration

**Should have (competitive advantage):**
- PSS profile summary in results (Baseline vs Restricted compliance at a glance)
- Resource summary panel ("Found: 3 Deployments, 2 Services, 1 ConfigMap") — instant structural orientation
- Dangling references shown as red dashed edges in the graph — cross-resource violations visualized
- CIS Benchmark reference tags on rule documentation pages
- Deprecated API version detection with migration path messages

**Defer to v1.x (post-validation):**
- Resource kind color-coding in graph (visual polish)
- Graph export as PNG/SVG
- K8s version selector (1.28-1.31) — requires multiple schema bundles
- Namespace grouping in graph visualization
- Fix suggestions panel with copy-to-clipboard before/after code

**Anti-features (explicitly excluded):**
- Helm chart rendering / Kustomize overlay resolution — requires Go runtime
- CRD validation — infinite and cluster-specific
- Cluster-connected validation — violates zero-backend architecture
- Auto-fix / real-time validation — high blast radius, excessive noise
- AI-powered analysis — contradicts human-expertise positioning

### Architecture Approach

The K8s analyzer mirrors the compose-validator's three-layer architecture (parse -> lint rules -> engine -> scorer -> UI) but introduces three new structural layers that did not exist before: a Resource Registry (indexes all parsed resources for O(1) cross-resource lookups), a schema-registry pattern with dynamic import (routes each resource to its type-specific pre-compiled Ajv validator without eager-loading all 18 validators), and a cross-resource validator (uses the registry to resolve selector matches, name references, and RBAC bindings across documents). The engine becomes async (dynamic schema imports vs. the synchronous compose engine) and operates on a `ParsedResource[]` array instead of a single document.

**Major components:**
1. `parser.ts` — `parseAllDocuments()` with single shared `LineCounter`; returns `K8sParseResult { resources: ParsedResource[], lineCounter, parseErrors }` where each resource carries docIndex, kind, apiVersion, name, namespace, json
2. `resource-registry.ts` — builds `ResourceRegistry { byKind, byKey (namespace/kind/name), byLabel }` with O(1) lookup methods; consumed by cross-resource rules, graph builder, and RBAC analyzer
3. `schema-validator.ts` + `schemas/schema-registry.ts` — maps `kind/apiVersion` key to dynamically imported pre-compiled Ajv validator; cache prevents re-importing; single compiled module for all 18 types
4. `cross-resource-validator.ts` — label selector matching (matchLabels AND semantics, matchExpressions, Service vs Deployment selector distinction), name reference resolution with namespace scoping, well-known resource whitelisting
5. `engine.ts` — async 4-phase orchestration: parse errors -> schema validation -> per-resource rules -> cross-resource rules; sorts all violations by docIndex then line
6. `scorer.ts` — adapted diminishing-returns algorithm with 5 category weights (Security 35%, Reliability 20%, Best Practice 20%, Schema 15%, Cross-Resource 10%)
7. `graph-builder.ts` — multi-type resource graph with 6 node categories (workload/networking/config/storage/RBAC/scaling) and 12 edge types; dagre LR layout
8. React components — `K8sAnalyzer.tsx` (root island), `K8sEditorPanel.tsx`, `K8sResultsPanel.tsx`, `ResourceGraph.tsx` (lazy-loaded), nanostore bridge

**Build order dependencies (strictly enforced):**
- Layer 0: `types.ts`, `sample-manifest.ts`, `url-state.ts`, `badge-generator.ts` (no dependencies)
- Layer 1: `parser.ts`, schema compilation scripts, `schema-registry.ts`, `scorer.ts`
- Layer 2: `resource-registry.ts` (depends on parser output types)
- Layer 3: `schema-validator.ts`, `cross-resource-validator.ts`, rules, `graph-builder.ts` (all depend on registry)
- Layer 4: `engine.ts` (depends on all lib)
- Layer 5: store + UI hook (depends on engine types)
- Layer 6: React components, Astro pages (depends on everything)

### Critical Pitfalls

1. **Schema size explosion (CRITICAL)** — K8s standalone schemas are 50-200KB each due to fully-inlined definitions; 18 schemas naive bundling = 1-3MB. Mitigation: compile ALL 18 schemas into a SINGLE Ajv instance (shared definitions deduplicated); generate one standalone module (`validate-k8s.js`) exporting all validators as named functions; target <200KB before gzip, <60KB gzipped. Must use dynamic import for the compiled module. Verify with bundle visualizer before any other work proceeds.

2. **Multi-document line number tracking (CRITICAL)** — `parseAllDocuments()` with a SINGLE shared `LineCounter` produces correct absolute offsets across all documents; creating per-document LineCounters produces wrong line numbers for documents 2+. Empty documents (`doc.contents === null`) must be filtered before processing. Every violation must carry document index AND resource identity (kind/name), not just line number.

3. **apiVersion/kind combinatorial validation (CRITICAL)** — `kind` and `apiVersion` are not independent; a GVK registry must validate combinations before schema selection. A `Deployment` with `apiVersion: v1` must produce a clear error, not a schema-not-found crash. Deprecated apiVersions (extensions/v1beta1, apps/v1beta1, batch/v1beta1, etc.) must produce warnings with migration paths, not silent failures.

4. **Label selector matching semantics (CRITICAL)** — `matchLabels` is AND (all labels must match); `matchExpressions NotIn` matches resources where the key is ABSENT (counterintuitive); `matchLabels + matchExpressions` are ANDed; Service `.spec.selector` is a flat equality map only (no `matchExpressions`); empty `Service.spec.selector` selects ALL pods. Build a dedicated selector matcher utility with exhaustive tests before any cross-resource rules.

5. **Cross-resource namespace scoping (CRITICAL)** — Resources without `metadata.namespace` are in "default"; cluster-scoped resources (ClusterRole, Namespace, PV) have no namespace; well-known auto-created resources (`ServiceAccount/default`, `ConfigMap/kube-root-ca.crt`) must be whitelisted or every Pod gets false-positive "resource not found" violations. Resource index must be keyed by `namespace/kind/name`.

6. **NetworkPolicy AND/OR selector semantics (HIGH)** — `podSelector` + `namespaceSelector` in the SAME `from` block = AND; in SEPARATE `from` items = OR. The YAML indentation is the only difference. Empty `spec.podSelector: {}` selects ALL pods (valid but often unintentional). Absent `spec.ingress` allows all traffic; `spec.ingress: []` denies all traffic. Build NetworkPolicy analysis as a dedicated rule module, not generic cross-resource logic.

## Implications for Roadmap

Based on research, suggested phase structure (matches the architecture's build-order dependencies):

### Phase 1: Foundation and Schema Infrastructure

**Rationale:** The schema compilation pipeline is the critical path. Everything downstream (schema validation, all 18 resource types, bundle size) depends on getting this right first. Pitfall 1 (schema explosion) and Pitfall 11 (ajv compilation strategy) both occur here and have HIGH recovery cost if skipped. This phase must be validated with a bundle visualizer before Phase 2 begins.

**Delivers:** Working multi-document YAML parser with shared LineCounter; GVK registry mapping 18 resource types with deprecated apiVersion mappings; single compiled Ajv module (`validate-k8s.js`) exporting all 18 validators; `resource-registry.ts` for downstream consumption; download and compilation scripts for K8s schemas.

**Addresses:** KA-S001 through KA-S010 (schema validation rules); KA-S006 deprecated API detection

**Avoids:** Pitfalls 1, 2, 3, 11 — all CRITICAL severity; the four most expensive-to-fix mistakes

### Phase 2: Per-Resource Lint Rules (Security + Reliability + Best Practice)

**Rationale:** With the parsing and schema infrastructure proven in Phase 1, per-resource rules are straightforward TypeScript functions following the established rule pattern from compose-validator. These rules only need the current resource's context — no cross-resource dependencies. Security rules should be implemented first because they are the primary user motivation and carry the highest scoring weight (35%).

**Delivers:** ~44 per-resource rules: 20 security (KA-C001-C020) with PSS Baseline/Restricted tags and CIS references; 12 reliability (KA-R001-R012); 12 best practice (KA-B001-B012). Working scorer with 5 category weights. Functional tool that scores a single-document manifest.

**Uses:** Rule engine pattern from `src/lib/tools/dockerfile-analyzer/` and `compose-validator/`; PSS Baseline/Restricted check list from official Kubernetes documentation; kube-score, Polaris, KubeLinter rule sets as reference

**Implements:** `engine.ts` phases 1-3, `scorer.ts`, all per-resource rules

### Phase 3: Cross-Resource Validation and RBAC Analysis

**Rationale:** Cross-resource validation is the headline differentiator and also the highest-complexity feature. It depends on the Resource Registry (built in Phase 1) and the label selector matcher. Pitfalls 4, 5, and 9 (selector semantics, namespace scoping, RBAC relationships) all land here. Building this phase after per-resource rules are stable means bugs in cross-resource logic don't obscure per-resource validation correctness.

**Delivers:** 8 cross-resource rules (KA-X001-X008: Service->Deployment selector matching, Ingress->Service, ConfigMap/Secret/PVC/SA references, NetworkPolicy->Pod, HPA->target); 5 RBAC analysis rules (KA-A001-A005: wildcard permissions, cluster-admin binding, exec/attach, secret access); label selector matcher utility with exhaustive test suite; namespace-scoped resource index with well-known resource whitelist; NetworkPolicy AND/OR semantic checks.

**Avoids:** Pitfalls 4, 5, 6, 7, 9 — label selector correctness, namespace identity, NetworkPolicy semantics, selector-template consistency, RBAC cross-references

### Phase 4: UI Shell and Core Results Panel

**Rationale:** With the analysis engine complete through Phase 3, the UI can be assembled from reused and adapted compose-validator components. The editor, score gauge, category breakdown, and violation list are all direct reuse or minor adaptations. The resource summary panel (showing "Found: 3 Deployments, 2 Services") is a low-cost differentiator built from Phase 1's parsing output.

**Delivers:** `K8sAnalyzer.tsx` root island; `K8sEditorPanel.tsx` with CodeMirror 6 YAML editor, sample manifest, Cmd/Ctrl+Enter shortcut, inline annotations; `K8sResultsPanel.tsx` with score gauge, category breakdown, violation list (grouped by resource/document), resource summary panel; `k8sAnalyzerStore.ts` nanostore; score badge download; lz-string URL state with `#k8s=` prefix; Astro page at `/tools/k8s-analyzer/`.

**Addresses:** All table stakes UI features; URL state, badge sharing

**Implements:** All UI components except the graph; functional tool deployable without graph

### Phase 5: Resource Relationship Graph

**Rationale:** The graph is the last feature to implement because it depends on the Resource Registry (Phase 1), cross-resource validation results (Phase 3), and is itself the highest-complexity UI component. Deferring it to Phase 5 means the tool is functional and shippable before the graph is complete. Pitfall 12 (graph complexity) is addressed here with edge type filtering and node limits.

**Delivers:** `graph-builder.ts` constructing multi-type K8s resource graph with 12 edge types; `ResourceGraph.tsx` (lazy-loaded React Flow component); `ResourceNode.tsx` and `ResourceEdge.tsx` custom components; dagre LR layout; dangling references shown as red dashed edges; node categories color-coded; graph tab in results panel; edge type toggle for managing visual complexity on large manifests.

**Addresses:** Interactive resource relationship graph — the primary visual differentiator

**Implements:** Architecture graph data model; 6 node type categories; 12 edge type definitions

### Phase 6: SEO, Documentation, and Site Integration

**Rationale:** Rule documentation pages, blog post, OG images, and homepage callout are the SEO and discoverability deliverables. These are independent of analysis correctness and can be built in parallel with Phase 5 or after. They have the highest long-term value (67+ indexed pages) but no dependencies on the analysis engine.

**Delivers:** 67+ per-rule documentation pages at `/tools/k8s-analyzer/rules/[code]` with PSS profile tags, CIS benchmark references, fix suggestions; companion blog post; OG images for tool and rule pages; homepage callout; header navigation; JSON-LD SoftwareApplication schema; breadcrumbs; sitemap entries.

**Addresses:** SEO powerhouse; expert credibility positioning; backlink structure for profile discoverability

### Phase Ordering Rationale

- **Phase 1 must be first** because schema compilation is the critical path with the highest recovery cost (rewriting the entire validation foundation if schema size is wrong). All downstream phases assume per-type validators exist and are within bundle budget.
- **Phase 2 before Phase 3** because per-resource rules have no cross-resource dependencies; building them first provides a testable baseline and confirms the rule engine pattern works before introducing the more complex cross-resource layer.
- **Phase 3 requires Phase 1** because the Resource Registry (Phase 1 output) is a precondition for all cross-resource validation. Label selector matcher must be built and tested before any cross-resource rules are implemented.
- **Phase 4 can begin** as soon as Phase 2 is working (basic scoring). Phase 3 cross-resource rules and Phase 5 graph can be integrated into an already-functional UI.
- **Phase 5 last among functional phases** because it requires both the Resource Registry (Phase 1) and cross-resource validation results (Phase 3) as inputs. Graph edges are the visual representation of cross-resource relationships.
- **Phase 6 independent** — rule documentation pages can be written as rules are implemented in Phases 2-3, but the final pass (CIS tags, PSS profiles, fix suggestions) is cleanest after all rules are finalized.

### Research Flags

Phases likely needing deeper research during planning:

- **Phase 1 (Schema Infrastructure):** Schema compilation is well-documented in Ajv docs, but the build script (compile-k8s-schemas.mjs) needs careful size measurement during implementation. Run bundle visualizer after first build. Target: validate-k8s.js < 200KB uncompressed.
- **Phase 3 (Cross-Resource Validation):** Label selector matching semantics are tricky; the `matchExpressions NotIn` with absent key behavior needs unit tests before any cross-resource rule depends on it. Namespace scoping with well-known resource whitelist needs a written list verified against current K8s behavior.
- **Phase 5 (Resource Graph):** Dagre layout quality for graphs with > 15 nodes and mixed edge types is unknown. May need edge type filtering implemented earlier than planned if layout is visually unusable.

Phases with standard patterns (skip research-phase):

- **Phase 2 (Per-Resource Rules):** Rule implementation follows established patterns from dockerfile-analyzer and compose-validator. PSS Baseline/Restricted check list is from official K8s docs. No novel patterns needed.
- **Phase 4 (UI Shell):** All components are direct reuse or minor adaptation of proven compose-validator components. No research needed.
- **Phase 6 (SEO):** Mirrors existing rule documentation page template exactly.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Zero new dependencies; all libraries are already installed and proven in compose-validator. yannh/kubernetes-json-schema verified with daily-updated schemas for v1.31.0. Ajv standalone multi-schema compilation verified in official docs. |
| Features | HIGH | Rule set sourced from official K8s docs (PSS, RBAC, deprecation guide) and 4 CLI tools (KubeLinter, Polaris, kube-score, Checkov). 67-rule count is precise with per-rule codes defined. Browser competitor analysis confirms unique positioning. |
| Architecture | HIGH | Based on direct codebase analysis of compose-validator. Three new layers (Resource Registry, schema-registry, cross-resource-validator) have concrete TypeScript interfaces documented. parseAllDocuments shared LineCounter behavior verified in eemeli/yaml official docs. |
| Pitfalls | HIGH | 12 pitfalls documented with CRITICAL/HIGH/MEDIUM severity, recovery cost, specific warning signs, and phase mapping. All critical pitfalls have code-level prevention strategies. Sources include official K8s docs for selector semantics, NetworkPolicy behavior, and RBAC structure. |

**Overall confidence:** HIGH

### Gaps to Address

- **Schema bundle size (Phase 1):** The target of <200KB for the compiled validate-k8s.js is based on Ajv standalone compression estimates. Actual size must be measured during Phase 1 implementation. If it exceeds 500KB, the lazy-loading strategy must be adjusted (per-type lazy loading instead of single module).
- **Cross-resource false positive rate (Phase 3):** Users who paste partial manifests (e.g., only a Deployment without its Service) will get cross-resource warnings. The "Checks references within the pasted YAML" UX messaging needs to be prominent. Severity should be `info`, not `warning`, for most cross-resource reference checks to minimize noise.
- **Graph layout quality (Phase 5):** Dagre handles ~50 nodes well but may degrade on K8s manifests with complex RBAC + workload + networking resources. If layout quality is poor at 15+ nodes, edge type filtering or ELK.js must be considered. Validate with a realistic 15-resource sample manifest during Phase 5.
- **RBAC rule accuracy (Phase 3):** RBAC rules are rated MEDIUM-HIGH confidence because RBAC resources are less commonly pasted into browser validators. The false positive risk (especially around RoleBinding-references-ClusterRole which is valid) must be verified with representative test cases before shipping.

## Sources

### Primary (HIGH confidence)
- [Kubernetes Pod Security Standards](https://kubernetes.io/docs/concepts/security/pod-security-standards/) — PSS Baseline/Restricted profiles; complete control reference with exact field paths
- [Kubernetes API Deprecation Guide](https://kubernetes.io/docs/reference/using-api/deprecation-guide/) — deprecated and removed apiVersions by K8s version
- [Kubernetes Labels and Selectors](https://kubernetes.io/docs/concepts/overview/working-with-objects/labels/) — matchLabels/matchExpressions semantics; In/NotIn/Exists/DoesNotExist operators; label format constraints
- [Kubernetes Network Policies](https://kubernetes.io/docs/concepts/services-networking/network-policies/) — AND/OR semantics in from/to blocks; empty vs absent ingress/egress
- [Kubernetes RBAC Authorization](https://kubernetes.io/docs/reference/access-authn-authz/rbac/) — Role/ClusterRole/RoleBinding/ClusterRoleBinding relationships; namespace scoping
- [yannh/kubernetes-json-schema](https://github.com/yannh/kubernetes-json-schema) — actively maintained K8s JSON Schema registry, auto-updated daily, v1.31.0-standalone-strict schemas verified
- [Ajv Standalone Code Generation](https://ajv.js.org/standalone.html) — multi-schema ESM export support confirmed
- [eemeli/yaml Documentation](https://eemeli.org/yaml/#documents) — `parseAllDocuments()` with shared LineCounter verified
- [KubeLinter checks.md](https://github.com/stackrox/kube-linter/blob/main/docs/generated/checks.md) — complete ~60 rule reference including cross-resource "dangling-*" checks
- [Polaris Security/Reliability Checks](https://polaris.docs.fairwinds.com/checks/) — 24 security + 12 reliability rules with severity levels
- [kube-score README_CHECKS.md](https://github.com/zegl/kube-score/blob/master/README_CHECKS.md) — 43 checks, strongest reliability focus
- [Checkov Kubernetes Policy Index](https://www.checkov.io/5.Policy%20Index/kubernetes.html) — 139+ CKV_K8S checks
- Existing codebase: `src/lib/tools/compose-validator/` and `src/lib/tools/dockerfile-analyzer/` — first-party proven patterns

### Secondary (MEDIUM confidence)
- [CIS Kubernetes Benchmarks](https://www.cisecurity.org/benchmark/kubernetes) — CIS 5.1 RBAC and 5.2 Pod Security controls; rule code references (5.1.1, 5.1.2, etc.)
- [EaseCloud K8s Manifest Validator](https://www.easecloud.io/tools/docker/kubernetes-manifest-validator/) — browser competitor analysis confirming gap in scoring and cross-resource validation
- [FOSSA K8s Manifest Linter](https://fossa.com/resources/devops-tools/kubernetes-manifest-linter/) — browser competitor confirming "basic validation only" positioning
- [ValidKube](https://validkube.com/) — browser competitor analysis
- [Kubernetes RBAC Good Practices](https://kubernetes.io/docs/concepts/security/rbac-good-practices/) — security anti-patterns; wildcard permissions risk
- [Datree GitHub](https://github.com/datreeio/datree) — 100+ rules (company closed July 2023; referenced for rule coverage, not as active tool)

---
*Research completed: 2026-02-23*
*Ready for roadmap: yes*
