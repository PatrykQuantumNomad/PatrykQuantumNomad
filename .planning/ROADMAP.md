# Roadmap: patrykgolabek.dev

## Milestones

- ~~v1.0 MVP~~ - Phases 1-7 (shipped 2026-02-11)
- ~~v1.1 Content Refresh~~ - Phases 8-12 (shipped 2026-02-12)
- ~~v1.2 Projects Page Redesign~~ - Phases 13-15 (shipped 2026-02-13)
- ~~v1.3 The Beauty Index~~ - Phases 16-21 (shipped 2026-02-17)
- ~~v1.4 Dockerfile Analyzer~~ - Phases 22-27 (shipped 2026-02-20)
- ~~v1.5 Database Compass~~ - Phases 28-32 (shipped 2026-02-22)
- ~~v1.6 Docker Compose Validator~~ - Phases 33-40 (shipped 2026-02-23)
- **v1.7 Kubernetes Manifest Analyzer** - Phases 41-47 (in progress)

## Phases

<details>
<summary>v1.0 through v1.6 (Phases 1-40) - SHIPPED</summary>

Phases 1-40 delivered across milestones v1.0-v1.6. 280 requirements, 80 plans completed.
See previous milestone archives for details.

</details>

### v1.7 Kubernetes Manifest Analyzer

**Milestone Goal:** Build an interactive browser-based K8s manifest linter with multi-resource schema validation, security analysis, cross-resource validation, resource dependency graph, and 67+ SEO rule documentation pages.

- [ ] **Phase 41: Foundation & Schema Infrastructure** - Multi-document YAML parser, GVK registry, resource registry, and pre-compiled K8s schema validators for 18 resource types
- [ ] **Phase 42: Security Rules** - 20 pod security and container security rules covering PSS Baseline/Restricted profiles and CIS Benchmarks
- [ ] **Phase 43: Reliability & Best Practice Rules** - 12 reliability rules (probes, replicas, image tags) and 12 best practice rules (resource limits, labels, namespace)
- [ ] **Phase 44: Cross-Resource Validation & RBAC** - 8 cross-resource reference checks (selector matching, ConfigMap/Secret/PVC/SA references) and 5 RBAC analysis rules
- [ ] **Phase 45: Editor UI & Scoring** - CodeMirror 6 YAML editor, score gauge, category breakdown, violation list, resource summary, share controls, and category-weighted scoring engine
- [ ] **Phase 46: Resource Relationship Graph** - Interactive React Flow dependency graph with dagre layout, color-coded node types, and dangling reference visualization
- [ ] **Phase 47: SEO, Documentation & Site Integration** - 67 rule documentation pages, companion blog post, OG images, homepage callout, header navigation, JSON-LD, and quality validation

## Phase Details

### Phase 41: Foundation & Schema Infrastructure
**Goal**: Users can paste a multi-document K8s manifest and get accurate schema validation results for all 18 supported resource types
**Depends on**: Nothing (first phase of v1.7)
**Requirements**: PARSE-01, PARSE-02, PARSE-03, PARSE-04, PARSE-05, PARSE-06, SCHEMA-01, SCHEMA-02, SCHEMA-03, SCHEMA-04, SCHEMA-05, SCHEMA-06, SCHEMA-07, SCHEMA-08, SCHEMA-09, SCHEMA-10, SCHEMA-11, SCHEMA-12
**Success Criteria** (what must be TRUE):
  1. A multi-document YAML string with `---` separators is parsed into individual resources, each identified by apiVersion/kind with correct line numbers relative to the full input
  2. Each parsed resource is validated against the correct K8s 1.31 JSON Schema for its resource type, producing specific field-level error messages
  3. Invalid apiVersion/kind combinations, deprecated API versions, missing metadata.name, and malformed label keys/values all produce appropriate diagnostics with accurate line numbers
  4. The compiled schema validators load via dynamic import and the total bundle contribution stays under 200KB gzipped
  5. A resource registry indexes all parsed resources by kind, name, namespace, and labels for downstream cross-resource lookups
**Plans**: TBD

### Phase 42: Security Rules
**Goal**: Users see comprehensive pod and container security analysis covering PSS Baseline/Restricted profiles and CIS Benchmark controls
**Depends on**: Phase 41
**Requirements**: SEC-01, SEC-02, SEC-03, SEC-04, SEC-05, SEC-06, SEC-07, SEC-08, SEC-09, SEC-10, SEC-11, SEC-12, SEC-13, SEC-14, SEC-15, SEC-16, SEC-17, SEC-18, SEC-19, SEC-20, SCORE-05
**Success Criteria** (what must be TRUE):
  1. A manifest with containers running as privileged, root, or with dangerous capabilities produces error-level security violations with explanations referencing the applicable PSS profile (Baseline or Restricted)
  2. A manifest with host namespace sharing (PID, IPC, network), sensitive host path mounts, or Docker socket mounts produces error-level violations
  3. A manifest with missing security contexts, auto-mounted service account tokens, default service accounts, or secrets in env vars produces warning-level violations
  4. The results panel shows a PSS compliance summary indicating count of Baseline and Restricted violations
**Plans**: TBD

### Phase 43: Reliability & Best Practice Rules
**Goal**: Users receive actionable reliability and best practice recommendations for production-readiness
**Depends on**: Phase 41
**Requirements**: REL-01, REL-02, REL-03, REL-04, REL-05, REL-06, REL-07, REL-08, REL-09, REL-10, REL-11, REL-12, BP-01, BP-02, BP-03, BP-04, BP-05, BP-06, BP-07, BP-08, BP-09, BP-10, BP-11, BP-12
**Success Criteria** (what must be TRUE):
  1. A Deployment missing liveness/readiness probes, using a single replica, or lacking a rolling update strategy produces reliability warnings
  2. Containers with latest/no image tag, missing resource requests/limits, or duplicate environment variable keys produce appropriate warnings
  3. Resources missing recommended labels (app, version), namespace, or priorityClassName produce informational diagnostics
  4. A CronJob without startingDeadlineSeconds, or a container with probe ports not matching container ports, produces specific warnings
**Plans**: TBD

### Phase 44: Cross-Resource Validation & RBAC
**Goal**: Users see validation of references between resources (Service->Deployment selectors, ConfigMap/Secret mounts, RBAC bindings) and get warnings for dangling references and overly permissive RBAC
**Depends on**: Phase 41, Phase 42 (RBAC rules scored under Security)
**Requirements**: XREF-01, XREF-02, XREF-03, XREF-04, XREF-05, XREF-06, XREF-07, XREF-08, RBAC-01, RBAC-02, RBAC-03, RBAC-04, RBAC-05, SCORE-04
**Success Criteria** (what must be TRUE):
  1. A Service whose selector matches no Pod template in any Deployment/StatefulSet/DaemonSet in the manifest produces a warning identifying the unmatched selector
  2. References to ConfigMaps, Secrets, PVCs, and ServiceAccounts that do not exist in the manifest produce informational diagnostics (not false positives for well-known system resources like default ServiceAccount or kube-root-ca.crt ConfigMap)
  3. Roles or ClusterRoles with wildcard permissions, cluster-admin RoleBindings, or permissions granting pod exec/attach/create or secret access produce RBAC violations with CIS Benchmark references
  4. RBAC violations are scored under the Security category weight (35%)
**Plans**: TBD

### Phase 45: Editor UI & Scoring
**Goal**: Users interact with a polished browser-based tool: paste or edit K8s manifests in a code editor, trigger analysis, and see scored results with inline annotations and share controls
**Depends on**: Phase 42, Phase 43 (needs rules to score)
**Requirements**: UI-01, UI-02, UI-03, UI-04, UI-05, UI-06, UI-07, UI-08, UI-09, UI-10, UI-11, UI-12, UI-13, UI-14, UI-15, UI-16, SHARE-01, SHARE-02, SHARE-03, SCORE-01, SCORE-02, SCORE-03
**Success Criteria** (what must be TRUE):
  1. User can type or paste K8s YAML into a CodeMirror editor with syntax highlighting, click Analyze (or press Cmd/Ctrl+Enter), and see a 0-100 score with letter grade, per-category sub-scores, and a violation list grouped by severity
  2. Violations appear as inline squiggly underlines and gutter severity markers in the editor; clicking a violation in the results panel navigates the editor to the corresponding line
  3. A clean manifest with no issues shows a congratulatory empty state; the resource summary panel shows parsed resource types and counts
  4. User can download a score badge PNG, share the analysis via URL (with #k8s= hash prefix), and the tool works responsively on mobile (stacked) and desktop (side-by-side)
  5. The React island renders via client:only="react", survives View Transitions navigation, and communicates with the editor via nanostore bridge
**Plans**: TBD

### Phase 46: Resource Relationship Graph
**Goal**: Users can visualize the dependency relationships between all K8s resources in their manifest as an interactive graph
**Depends on**: Phase 44 (cross-resource validation provides graph edge data)
**Requirements**: GRAPH-01, GRAPH-02, GRAPH-03, GRAPH-04, GRAPH-05, GRAPH-06
**Success Criteria** (what must be TRUE):
  1. Switching to the Graph tab in the results panel renders an interactive React Flow graph where each resource is a node and edges represent relationships (selector match, volume mount, envFrom, Ingress backend, HPA target, RBAC binding)
  2. Nodes are color-coded by resource kind category (workloads, services, config, storage, RBAC, scaling) and dangling references appear as red dashed edges
  3. The graph component is lazy-loaded via React.lazy() so it does not impact initial page load or Lighthouse scores
**Plans**: TBD

### Phase 47: SEO, Documentation & Site Integration
**Goal**: The K8s Manifest Analyzer is fully integrated into the site with 67+ individually indexed rule documentation pages, a companion blog post, and all standard site integration touchpoints
**Depends on**: Phase 42, Phase 43, Phase 44 (all rules must be finalized for documentation)
**Requirements**: DOCS-01, DOCS-02, DOCS-03, DOCS-04, SITE-01, SITE-02, SITE-03, SITE-04, SITE-05, SITE-06, SITE-07, SITE-08, SITE-09, CONTENT-01, CONTENT-02, QA-01, QA-02, QA-03
**Success Criteria** (what must be TRUE):
  1. Every rule has a documentation page at /tools/k8s-analyzer/rules/[code] with explanation, fix suggestion, before/after code examples, related rules, and (where applicable) PSS profile tags and CIS Benchmark references
  2. The companion blog post "Kubernetes Manifest Best Practices" is published with ~20 cross-links to rule pages and bidirectional linking from the tool page
  3. The tool page appears in header navigation, homepage callout, tools page card, sitemap, and LLMs.txt; JSON-LD SoftwareApplication schema and breadcrumb navigation are present
  4. Lighthouse scores 90+ on the tool page and rule documentation pages; WCAG 2.1 AA accessibility and responsive design pass on mobile, tablet, and desktop
**Plans**: TBD

## Progress

**Execution Order:** Phase 41 -> 42 -> 43 -> 44 -> 45 -> 46 -> 47
(Phases 42 and 43 can execute in parallel after Phase 41 completes)

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 41. Foundation & Schema Infrastructure | v1.7 | 0/TBD | Not started | - |
| 42. Security Rules | v1.7 | 0/TBD | Not started | - |
| 43. Reliability & Best Practice Rules | v1.7 | 0/TBD | Not started | - |
| 44. Cross-Resource Validation & RBAC | v1.7 | 0/TBD | Not started | - |
| 45. Editor UI & Scoring | v1.7 | 0/TBD | Not started | - |
| 46. Resource Relationship Graph | v1.7 | 0/TBD | Not started | - |
| 47. SEO, Documentation & Site Integration | v1.7 | 0/TBD | Not started | - |
