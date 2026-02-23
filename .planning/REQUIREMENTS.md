# v1.7 Requirements — Kubernetes Manifest Analyzer

## Foundation & Parsing

- [x] **PARSE-01**: Multi-document YAML parsing splits input on `---` separators and parses each document independently with source range preservation
- [x] **PARSE-02**: Per-document apiVersion/kind detection identifies resource type from each parsed document
- [x] **PARSE-03**: GVK registry maps valid apiVersion/kind combinations to the 18 supported resource types
- [x] **PARSE-04**: Resource Registry builds an in-memory index of all parsed resources by kind, name, namespace, and labels for cross-resource validation
- [x] **PARSE-05**: Resource summary displays count of each resource type found ("Found: 3 Deployments, 2 Services, 1 ConfigMap")
- [x] **PARSE-06**: YAML syntax errors reported with accurate line numbers in the original editor content

## Schema Validation (10 rules)

- [x] **SCHEMA-01**: Per-resource-type JSON Schema validation for 18 K8s resource types using K8s 1.31 schemas from yannh/kubernetes-json-schema
- [x] **SCHEMA-02**: Schema validators pre-compiled via ajv standalone for bundle size efficiency, lazy-loaded per resource type
- [x] **SCHEMA-03**: KA-S001 — Invalid YAML syntax (error)
- [x] **SCHEMA-04**: KA-S002 — Missing apiVersion field (error)
- [x] **SCHEMA-05**: KA-S003 — Missing kind field (error)
- [x] **SCHEMA-06**: KA-S004 — Unknown apiVersion/kind combination (error)
- [x] **SCHEMA-07**: KA-S005 — Schema validation failure per resource type (error)
- [x] **SCHEMA-08**: KA-S006 — Deprecated API version (warning) — extensions/v1beta1, apps/v1beta1, apps/v1beta2, etc.
- [x] **SCHEMA-09**: KA-S007 — Missing metadata.name (error)
- [x] **SCHEMA-10**: KA-S008 — Invalid metadata.name format (warning) — RFC 1123 DNS subdomain validation
- [x] **SCHEMA-11**: KA-S009 — Invalid label key/value format (warning)
- [x] **SCHEMA-12**: KA-S010 — Empty document in multi-doc YAML (info)

## Security Rules (20 rules)

- [x] **SEC-01**: KA-C001 — Container runs as privileged (error) — PSS Baseline
- [x] **SEC-02**: KA-C002 — Privilege escalation allowed (error) — PSS Restricted
- [x] **SEC-03**: KA-C003 — Container runs as root (warning) — PSS Restricted
- [x] **SEC-04**: KA-C004 — Missing runAsNonRoot (warning) — PSS Restricted
- [x] **SEC-05**: KA-C005 — Running with UID 0 (error) — PSS Restricted
- [x] **SEC-06**: KA-C006 — Host PID namespace shared (error) — PSS Baseline
- [x] **SEC-07**: KA-C007 — Host IPC namespace shared (error) — PSS Baseline
- [x] **SEC-08**: KA-C008 — Host network enabled (warning) — PSS Baseline
- [x] **SEC-09**: KA-C009 — Host port specified (info) — PSS Baseline
- [x] **SEC-10**: KA-C010 — Dangerous capabilities SYS_ADMIN, NET_RAW, ALL (error) — PSS Baseline/Restricted
- [x] **SEC-11**: KA-C011 — Capabilities not dropped (warning) — PSS Restricted
- [x] **SEC-12**: KA-C012 — Filesystem not read-only (warning)
- [x] **SEC-13**: KA-C013 — Missing seccomp profile (warning) — PSS Baseline
- [x] **SEC-14**: KA-C014 — Sensitive host path mounted (error) — PSS Baseline
- [x] **SEC-15**: KA-C015 — Docker socket mounted (error)
- [x] **SEC-16**: KA-C016 — ServiceAccount token auto-mounted (warning)
- [x] **SEC-17**: KA-C017 — Default ServiceAccount used (warning)
- [x] **SEC-18**: KA-C018 — Secrets in environment variables (warning)
- [x] **SEC-19**: KA-C019 — Default namespace used (info)
- [x] **SEC-20**: KA-C020 — Missing security context entirely (warning)

## Reliability Rules (12 rules)

- [x] **REL-01**: KA-R001 — Missing liveness probe (warning)
- [x] **REL-02**: KA-R002 — Missing readiness probe (warning)
- [x] **REL-03**: KA-R003 — Identical liveness and readiness probes (warning)
- [x] **REL-04**: KA-R004 — Single replica Deployment (warning)
- [x] **REL-05**: KA-R005 — Missing PodDisruptionBudget (info)
- [x] **REL-06**: KA-R006 — No rolling update strategy (warning)
- [x] **REL-07**: KA-R007 — Missing pod anti-affinity (info)
- [x] **REL-08**: KA-R008 — Missing topology spread constraint (info)
- [x] **REL-09**: KA-R009 — Image uses latest or no tag (warning)
- [x] **REL-10**: KA-R010 — Image pull policy not Always (info)
- [x] **REL-11**: KA-R011 — Selector/template label mismatch (error)
- [x] **REL-12**: KA-R012 — CronJob missing deadline (warning)

## Best Practice Rules (12 rules)

- [x] **BP-01**: KA-B001 — Missing CPU requests (warning)
- [x] **BP-02**: KA-B002 — Missing CPU limits (warning)
- [x] **BP-03**: KA-B003 — Missing memory requests (warning)
- [x] **BP-04**: KA-B004 — Missing memory limits (warning)
- [x] **BP-05**: KA-B005 — Missing required labels app, version (info)
- [x] **BP-06**: KA-B006 — Missing namespace (info)
- [x] **BP-07**: KA-B007 — SSH port exposed (info)
- [x] **BP-08**: KA-B008 — NodePort service type used (info)
- [x] **BP-09**: KA-B009 — Liveness probe port not in container ports (warning)
- [x] **BP-10**: KA-B010 — Readiness probe port not in container ports (warning)
- [x] **BP-11**: KA-B011 — Missing priorityClassName (info)
- [x] **BP-12**: KA-B012 — Duplicate environment variable keys (warning)

## Cross-Resource Validation (8 rules)

- [ ] **XREF-01**: KA-X001 — Service selector matches no Pod template (warning)
- [ ] **XREF-02**: KA-X002 — Ingress references undefined Service (warning)
- [ ] **XREF-03**: KA-X003 — ConfigMap reference not found in file (info)
- [ ] **XREF-04**: KA-X004 — Secret reference not found in file (info)
- [ ] **XREF-05**: KA-X005 — PVC reference not found in file (info)
- [ ] **XREF-06**: KA-X006 — ServiceAccount reference not found in file (warning)
- [ ] **XREF-07**: KA-X007 — NetworkPolicy selector matches no Pod (info)
- [ ] **XREF-08**: KA-X008 — HPA targets non-existent resource (warning)

## RBAC Analysis (5 rules)

- [ ] **RBAC-01**: KA-A001 — Wildcard permissions in Role/ClusterRole (error) — CIS 5.1.3
- [ ] **RBAC-02**: KA-A002 — cluster-admin RoleBinding (error) — CIS 5.1.1
- [ ] **RBAC-03**: KA-A003 — Pod exec/attach permissions (warning)
- [ ] **RBAC-04**: KA-A004 — Secret access permissions (warning) — CIS 5.1.2
- [ ] **RBAC-05**: KA-A005 — Pod creation permissions (warning) — CIS 5.1.4

## Scoring

- [ ] **SCORE-01**: Category-weighted scoring — Security 35%, Reliability 20%, Best Practice 20%, Schema 15%, Cross-Resource 10%
- [ ] **SCORE-02**: Overall 0-100 score with letter grade (A+ through F) using diminishing returns formula
- [ ] **SCORE-03**: Per-category sub-scores alongside aggregate
- [ ] **SCORE-04**: RBAC rules scored under Security category
- [x] **SCORE-05**: PSS profile compliance summary — count of Baseline/Restricted violations

## Editor & UI

- [ ] **UI-01**: CodeMirror 6 YAML editor with dark theme matching site aesthetic
- [ ] **UI-02**: Pre-loaded sample K8s manifest with deliberate issues across all rule categories
- [ ] **UI-03**: Analyze button triggers analysis cycle (on-demand, not real-time)
- [ ] **UI-04**: Keyboard shortcut Cmd/Ctrl+Enter to trigger analysis
- [ ] **UI-05**: Inline CodeMirror annotations — squiggly underlines + gutter severity markers
- [ ] **UI-06**: Score gauge component (SVG circular gauge with letter grade)
- [ ] **UI-07**: Category breakdown panel with sub-scores per dimension
- [ ] **UI-08**: Violation list grouped by severity with expandable details
- [ ] **UI-09**: Click-to-navigate from results panel to corresponding editor line
- [ ] **UI-10**: Clean manifest empty state ("No issues found" with congratulatory message)
- [ ] **UI-11**: Responsive layout — stacked on mobile, side-by-side on desktop
- [ ] **UI-12**: React island with client:only="react" directive
- [ ] **UI-13**: View Transitions lifecycle — destroy/recreate EditorView on navigation
- [ ] **UI-14**: Nanostore bridge for CodeMirror-React state communication
- [ ] **UI-15**: Tabbed results panel (Results | Graph)
- [ ] **UI-16**: Resource summary panel showing parsed resource types and counts

## Resource Relationship Graph

- [ ] **GRAPH-01**: Interactive React Flow dependency graph with dagre layout
- [ ] **GRAPH-02**: Node types color-coded by resource kind (workloads, services, config, storage, RBAC, scaling)
- [ ] **GRAPH-03**: Edge types represent references (selector match, volume mount, envFrom, Ingress backend, HPA target, RBAC binding)
- [ ] **GRAPH-04**: Dangling references shown as red dashed edges
- [ ] **GRAPH-05**: React Flow lazy-loaded via React.lazy() to maintain Lighthouse 90+
- [ ] **GRAPH-06**: Graph data derived from cross-resource validation results

## Shareability

- [ ] **SHARE-01**: Score badge download as PNG image
- [ ] **SHARE-02**: URL state encoding — manifest content in URL hash with `#k8s=` prefix via lz-string
- [ ] **SHARE-03**: 3-tier share fallback — Web Share API > Clipboard API > prompt()

## Rule Documentation

- [ ] **DOCS-01**: 67 per-rule documentation pages at /tools/k8s-analyzer/rules/[code]
- [ ] **DOCS-02**: Each rule page includes explanation, fix suggestion, before/after code, related rules
- [ ] **DOCS-03**: PSS profile tags and CIS Benchmark references on applicable rule pages
- [ ] **DOCS-04**: SEO-optimized meta descriptions for all rule pages

## Site Integration

- [ ] **SITE-01**: Tool page at /tools/k8s-analyzer/ with Astro page wrapping React island
- [ ] **SITE-02**: Header navigation link for K8s Manifest Analyzer (under Tools)
- [ ] **SITE-03**: Homepage callout linking to the K8s Manifest Analyzer
- [ ] **SITE-04**: Tools page card for K8s Manifest Analyzer
- [ ] **SITE-05**: JSON-LD structured data (SoftwareApplication schema) on tool page
- [ ] **SITE-06**: Breadcrumb navigation on tool page and rule documentation pages
- [ ] **SITE-07**: All tool and rule pages in sitemap
- [ ] **SITE-08**: Build-time OG image via Satori + Sharp for social sharing
- [ ] **SITE-09**: LLMs.txt updated with tool page and all rule documentation pages

## Content

- [ ] **CONTENT-01**: Companion blog post "Kubernetes Manifest Best Practices" with rule links and bidirectional cross-linking
- [ ] **CONTENT-02**: Blog post covers security, reliability, best practices with ~20 rule cross-links

## Quality

- [ ] **QA-01**: Lighthouse 90+ on all K8s Analyzer page types (tool page, rule pages)
- [ ] **QA-02**: WCAG 2.1 AA accessibility — keyboard navigation, screen reader, contrast
- [ ] **QA-03**: Responsive design across mobile, tablet, and desktop

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| PARSE-01 | Phase 41 | Complete |
| PARSE-02 | Phase 41 | Complete |
| PARSE-03 | Phase 41 | Complete |
| PARSE-04 | Phase 41 | Complete |
| PARSE-05 | Phase 41 | Complete |
| PARSE-06 | Phase 41 | Complete |
| SCHEMA-01 | Phase 41 | Complete |
| SCHEMA-02 | Phase 41 | Complete |
| SCHEMA-03 | Phase 41 | Complete |
| SCHEMA-04 | Phase 41 | Complete |
| SCHEMA-05 | Phase 41 | Complete |
| SCHEMA-06 | Phase 41 | Complete |
| SCHEMA-07 | Phase 41 | Complete |
| SCHEMA-08 | Phase 41 | Complete |
| SCHEMA-09 | Phase 41 | Complete |
| SCHEMA-10 | Phase 41 | Complete |
| SCHEMA-11 | Phase 41 | Complete |
| SCHEMA-12 | Phase 41 | Complete |
| SEC-01 | Phase 42 | Pending |
| SEC-02 | Phase 42 | Pending |
| SEC-03 | Phase 42 | Pending |
| SEC-04 | Phase 42 | Pending |
| SEC-05 | Phase 42 | Pending |
| SEC-06 | Phase 42 | Pending |
| SEC-07 | Phase 42 | Pending |
| SEC-08 | Phase 42 | Pending |
| SEC-09 | Phase 42 | Pending |
| SEC-10 | Phase 42 | Pending |
| SEC-11 | Phase 42 | Pending |
| SEC-12 | Phase 42 | Pending |
| SEC-13 | Phase 42 | Pending |
| SEC-14 | Phase 42 | Pending |
| SEC-15 | Phase 42 | Pending |
| SEC-16 | Phase 42 | Pending |
| SEC-17 | Phase 42 | Pending |
| SEC-18 | Phase 42 | Pending |
| SEC-19 | Phase 42 | Pending |
| SEC-20 | Phase 42 | Pending |
| SCORE-05 | Phase 42 | Complete |
| REL-01 | Phase 43 | Complete |
| REL-02 | Phase 43 | Complete |
| REL-03 | Phase 43 | Complete |
| REL-04 | Phase 43 | Complete |
| REL-05 | Phase 43 | Complete |
| REL-06 | Phase 43 | Complete |
| REL-07 | Phase 43 | Complete |
| REL-08 | Phase 43 | Complete |
| REL-09 | Phase 43 | Complete |
| REL-10 | Phase 43 | Complete |
| REL-11 | Phase 43 | Complete |
| REL-12 | Phase 43 | Complete |
| BP-01 | Phase 43 | Complete |
| BP-02 | Phase 43 | Complete |
| BP-03 | Phase 43 | Complete |
| BP-04 | Phase 43 | Complete |
| BP-05 | Phase 43 | Complete |
| BP-06 | Phase 43 | Complete |
| BP-07 | Phase 43 | Complete |
| BP-08 | Phase 43 | Complete |
| BP-09 | Phase 43 | Complete |
| BP-10 | Phase 43 | Complete |
| BP-11 | Phase 43 | Complete |
| BP-12 | Phase 43 | Complete |
| XREF-01 | Phase 44 | Pending |
| XREF-02 | Phase 44 | Pending |
| XREF-03 | Phase 44 | Pending |
| XREF-04 | Phase 44 | Pending |
| XREF-05 | Phase 44 | Pending |
| XREF-06 | Phase 44 | Pending |
| XREF-07 | Phase 44 | Pending |
| XREF-08 | Phase 44 | Pending |
| RBAC-01 | Phase 44 | Pending |
| RBAC-02 | Phase 44 | Pending |
| RBAC-03 | Phase 44 | Pending |
| RBAC-04 | Phase 44 | Pending |
| RBAC-05 | Phase 44 | Pending |
| SCORE-04 | Phase 44 | Pending |
| UI-01 | Phase 45 | Pending |
| UI-02 | Phase 45 | Pending |
| UI-03 | Phase 45 | Pending |
| UI-04 | Phase 45 | Pending |
| UI-05 | Phase 45 | Pending |
| UI-06 | Phase 45 | Pending |
| UI-07 | Phase 45 | Pending |
| UI-08 | Phase 45 | Pending |
| UI-09 | Phase 45 | Pending |
| UI-10 | Phase 45 | Pending |
| UI-11 | Phase 45 | Pending |
| UI-12 | Phase 45 | Pending |
| UI-13 | Phase 45 | Pending |
| UI-14 | Phase 45 | Pending |
| UI-15 | Phase 45 | Pending |
| UI-16 | Phase 45 | Pending |
| SHARE-01 | Phase 45 | Pending |
| SHARE-02 | Phase 45 | Pending |
| SHARE-03 | Phase 45 | Pending |
| SCORE-01 | Phase 45 | Pending |
| SCORE-02 | Phase 45 | Pending |
| SCORE-03 | Phase 45 | Pending |
| GRAPH-01 | Phase 46 | Pending |
| GRAPH-02 | Phase 46 | Pending |
| GRAPH-03 | Phase 46 | Pending |
| GRAPH-04 | Phase 46 | Pending |
| GRAPH-05 | Phase 46 | Pending |
| GRAPH-06 | Phase 46 | Pending |
| DOCS-01 | Phase 47 | Pending |
| DOCS-02 | Phase 47 | Pending |
| DOCS-03 | Phase 47 | Pending |
| DOCS-04 | Phase 47 | Pending |
| SITE-01 | Phase 47 | Pending |
| SITE-02 | Phase 47 | Pending |
| SITE-03 | Phase 47 | Pending |
| SITE-04 | Phase 47 | Pending |
| SITE-05 | Phase 47 | Pending |
| SITE-06 | Phase 47 | Pending |
| SITE-07 | Phase 47 | Pending |
| SITE-08 | Phase 47 | Pending |
| SITE-09 | Phase 47 | Pending |
| CONTENT-01 | Phase 47 | Pending |
| CONTENT-02 | Phase 47 | Pending |
| QA-01 | Phase 47 | Pending |
| QA-02 | Phase 47 | Pending |
| QA-03 | Phase 47 | Pending |

---
*Generated: 2026-02-23*
*Total: 123 requirements across 15 categories*
