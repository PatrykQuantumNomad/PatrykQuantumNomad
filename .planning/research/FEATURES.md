# Feature Research: Kubernetes Manifest Analyzer

**Domain:** Interactive browser-based Kubernetes manifest validation/linting tool on an Astro 5 portfolio site
**Researched:** 2026-02-23
**Confidence:** HIGH
**Scope:** Kubernetes Manifest Analyzer at /tools/k8s-analyzer/ with multi-document YAML parsing, per-resource-type K8s OpenAPI schema validation, security checks (Pod Security Standards, CIS-aligned, RBAC analysis), cross-resource validation, interactive resource relationship graph, category-weighted scoring, ~67 rules with per-rule SEO documentation, and companion blog post

---

## Existing Infrastructure (Already Built)

These capabilities exist on patrykgolabek.dev from v1.4 Dockerfile Analyzer and v1.6 Docker Compose Validator:

| Capability | Where | Reuse Potential |
|------------|-------|-----------------|
| **Dockerfile Analyzer pattern** | `src/lib/tools/dockerfile-analyzer/` -- LintRule interface, engine, scorer, types | MIRROR -- K8s Analyzer follows same modular rule architecture |
| **Docker Compose Validator pattern** | `src/lib/tools/compose-validator/` -- YAML parsing, ajv schema validation, semantic analysis | ADAPT -- YAML parsing reusable, K8s schema validation is structurally different (per-resource-type OpenAPI schemas vs single compose-spec schema) |
| **Category-weighted scoring** | `scorer.ts` -- diminishing returns formula | ADAPT -- same algorithm with new categories and weights (Security 35%, Reliability 20%, Best Practice 20%, Schema 15%, Cross-Resource 10%) |
| **CodeMirror 6 YAML editor** | `use-codemirror.ts` + `@codemirror/lang-yaml` | DIRECT -- same YAML language mode already used in Compose Validator |
| **Inline annotations** | `highlight-line.ts` -- squiggly underlines + gutter markers | DIRECT -- same annotation pattern |
| **Score gauge component** | React SVG circular gauge + letter grade | DIRECT -- identical component |
| **Category breakdown panel** | React component showing sub-scores per dimension | ADAPT -- new category names (6 categories vs 5) |
| **Violation list component** | Severity-grouped, expandable details, click-to-navigate | DIRECT -- same UX pattern |
| **Badge generator** | `badge-generator.ts` -- programmatic SVG-to-PNG | ADAPT -- "K8s Manifest Analyzer" branding |
| **URL state compression** | `url-state.ts` -- lz-string | ADAPT -- need `#k8s=` hash prefix distinct from `#dockerfile=` and `#compose=` |
| **Rule documentation pages** | `/tools/compose-validator/rules/[code].astro` | MIRROR -- same template at `/tools/k8s-analyzer/rules/[code]` |
| **OG image generation** | `src/lib/og-image.ts` using Satori + Sharp | EXTEND -- K8s Analyzer OG images |
| **JSON-LD structured data** | SoftwareApplication schema | DIRECT -- same schema |
| **Nanostore bridge** | Editor-to-React state communication pattern | DIRECT -- same cross-framework pattern |
| **React island pattern** | `client:only="react"` with View Transitions lifecycle | DIRECT -- same island approach |
| **React Flow dependency graph** | Compose Validator service graph with dagre layout, cycle detection | ADAPT -- resource relationship graph instead of service dependency graph |

---

## Competitive Landscape Analysis

### Existing Kubernetes Manifest Validation Tools

| Tool | Type | Rule Count | Strengths | Weaknesses |
|------|------|------------|-----------|------------|
| **KubeLinter** (StackRox/Red Hat) | CLI, Go | ~60 checks | Comprehensive checks covering security, reliability, RBAC; CIS 5.1 checks; "dangling" cross-resource checks (Service->Deployment, Ingress->Service, NetworkPolicy->Pod, HPA->target); configurable templates for custom checks | CLI only; no scoring; no browser UI; no graph visualization |
| **Polaris** (Fairwinds) | CLI + Dashboard | ~40 checks across 4 categories (Security, Reliability, Efficiency, Networking) | Category-based check organization; JSON Schema-based custom checks; dashboard UI exists but is cluster-connected; security checks include RBAC exec/attach and NetworkPolicy | Dashboard requires cluster connection (not static file analysis in browser); no weighted scoring; limited cross-resource validation |
| **kube-score** | CLI, Go | ~43 checks | Good reliability focus (PDB, anti-affinity, topology spread, HPA conflicts); strong probe validation (identical probe detection); stable API version detection | CLI only; no browser UI; no scoring system (uses OK/WARNING/CRITICAL per-check); limited security depth; no RBAC checks |
| **Checkov** (Bridgecrew/Palo Alto) | CLI, Python | ~139 CKV_K8S checks | Most comprehensive rule set; CIS/NIST mapped; covers API server config, RBAC wildcards, image digest validation; custom rules via Python | CLI/CI only; enterprise-focused; many checks target cluster runtime config (not manifest files); no browser UI; no scoring |
| **kubeconform** | CLI, Go | Schema-only | Fastest K8s schema validator; supports custom CRD schemas; version-specific validation (K8s 1.x); multi-version JSON Schema registry | Schema validation ONLY -- no security, best practice, or semantic checks; CLI only |
| **kubeval** (deprecated) | CLI, Go | Schema-only | Was the standard schema validator | DEPRECATED -- replaced by kubeconform; unmaintained since 2022 |
| **Datree** | CLI | ~100 rules across 9 categories | Broad rule set; NSA hardening guide rules; Argo CD rules | Company CLOSED July 2023; effectively dead project; no browser UI |
| **Snyk IaC** | CLI + SaaS | Undisclosed (extensive) | CIS/NIST/SOC2 mapping; Helm chart support; context-aware prioritization | Enterprise SaaS; not open-source rule details; no standalone browser tool |
| **FOSSA K8s Linter** | Web | Basic | Browser-based; paste-and-validate UX | "Basic validation" only -- explicitly recommends other tools for depth; no scoring; no graph |
| **EaseCloud Validator** | Web | ~15 checks | Browser-based; client-side processing; multi-document support; PSS Baseline/Restricted checks; version 1.19-1.30 support | Limited rule depth; no scoring; no cross-resource validation; no graph; no rule documentation pages |
| **ValidKube** | Web | Multiple tools | Combines validation + cleaning + security scanning | JavaScript-heavy SPA; unclear which checks are actually run; no scoring |

### Gap Analysis

**What NO existing browser-based tool provides:**

1. **Category-weighted scoring with letter grades** -- no browser K8s tool scores manifests on a 0-100 scale
2. **Interactive resource relationship graph** -- no browser tool visualizes how Deployments, Services, ConfigMaps, Secrets, PVCs, and Ingresses reference each other
3. **Cross-resource validation** -- KubeLinter has "dangling" checks (Service->Deployment, Ingress->Service, NetworkPolicy->Pod, HPA->target) but only as CLI; no browser tool does this
4. **Combined schema + security + reliability + cross-resource analysis in one browser tool** -- existing browser tools do schema + basic security at most
5. **Per-rule SEO documentation pages** -- no K8s tool has 67+ individually indexed, expert-written rule pages
6. **Exportable score badges** -- unique to our tool pattern
7. **Shareable URL state** -- unique to our tool pattern
8. **Pod Security Standards mapping** -- KubeLinter/Polaris/Checkov do PSS checks but not in a browser-based tool with clear PSS Baseline/Restricted mapping
9. **Multi-document YAML with per-resource validation** -- browser tools that exist treat the whole file as one unit; we validate each `---` separated document against its resource-type-specific schema

**The opportunity is massive.** K8s manifest validation is a significantly larger domain than Dockerfile or Docker Compose validation. The existing browser-based tools are shallow. CLI tools are deep but inaccessible for quick checks. A browser tool that matches CLI-tool depth with interactive visualization would be a unique offering.

---

## Validation Rule Categories (Research Synthesis)

### Category 1: Schema Validation (Target: ~10 rules)

**What it is:** Structural correctness against Kubernetes OpenAPI schemas. Multi-document YAML is split on `---` separators, each document's `apiVersion` + `kind` is detected, and the appropriate schema is loaded for validation.

**Implementation approach:** Use Kubernetes JSON Schemas (from https://github.com/yannh/kubernetes-json-schema -- the same registry kubeconform uses) compiled for K8s 1.31. Bundle schemas for the 18 target resource types as static JSON at build time. Validate each document against its resource-type-specific schema using ajv.

**Key rules:**

| Rule Code | Name | Severity | What It Catches |
|-----------|------|----------|-----------------|
| KA-S001 | Invalid YAML syntax | error | Indentation errors, missing colons, tab characters, malformed arrays |
| KA-S002 | Missing apiVersion field | error | Document lacks required `apiVersion` field |
| KA-S003 | Missing kind field | error | Document lacks required `kind` field |
| KA-S004 | Unknown apiVersion/kind combination | error | `apiVersion`/`kind` pair does not match any known K8s resource type |
| KA-S005 | Schema validation failure | error | Resource fields violate the OpenAPI schema for that resource type (wrong types, invalid enum values, extra properties in strict resources) |
| KA-S006 | Deprecated API version | warning | Using API versions removed in K8s 1.16+ (extensions/v1beta1, apps/v1beta1, apps/v1beta2, etc.) |
| KA-S007 | Missing metadata.name | error | Resource lacks required `metadata.name` field |
| KA-S008 | Invalid metadata.name format | warning | Name doesn't comply with K8s naming rules (RFC 1123 DNS subdomain: lowercase, alphanumeric, hyphens, max 253 chars) |
| KA-S009 | Invalid label key/value format | warning | Labels violate K8s label syntax (key: prefix/name max 63 chars; value max 63 chars, alphanumeric with hyphens/dots/underscores) |
| KA-S010 | Empty document in multi-doc YAML | info | `---` separator followed by empty content or comments-only |

**Confidence:** HIGH -- Kubernetes JSON Schema registry (yannh/kubernetes-json-schema) is the authoritative source, used by kubeconform. K8s API deprecation guide is official Kubernetes documentation.

**Complexity note:** MEDIUM-HIGH. The per-resource-type schema approach is more complex than the Compose Validator's single-schema approach. Bundling 18 schemas at build time requires careful tree-shaking. Schema sizes for K8s resources are substantial (Deployment schema is ~50KB of JSON).

### Category 2: Security (Target: ~20 rules)

**What it is:** Pod security configuration checks aligned with Kubernetes Pod Security Standards (PSS Baseline + Restricted profiles), CIS Kubernetes Benchmark Section 5, and patterns from KubeLinter, Polaris, and Checkov.

This is the deepest category because security is the primary value proposition for a K8s linting tool. Every competing tool leads with security.

**Key rules:**

| Rule Code | Name | Severity | PSS Profile | Source Tools |
|-----------|------|----------|-------------|--------------|
| KA-C001 | Container runs as privileged | error | Baseline | KubeLinter, Polaris, Checkov CKV_K8S_2/16 |
| KA-C002 | Privilege escalation allowed | error | Restricted | Polaris, Checkov CKV_K8S_5/20 |
| KA-C003 | Container runs as root | warning | Restricted | KubeLinter, Polaris, Checkov CKV_K8S_6/23 |
| KA-C004 | Missing runAsNonRoot | warning | Restricted | Polaris, Checkov CKV_K8S_6 |
| KA-C005 | Running with UID 0 | error | Restricted | Checkov CKV_K8S_40 |
| KA-C006 | Host PID namespace shared | error | Baseline | KubeLinter, Polaris, Checkov CKV_K8S_1/17 |
| KA-C007 | Host IPC namespace shared | error | Baseline | KubeLinter, Polaris, Checkov CKV_K8S_3/18 |
| KA-C008 | Host network enabled | warning | Baseline | KubeLinter, Polaris, Checkov CKV_K8S_4/19 |
| KA-C009 | Host port specified | info | Baseline | Polaris, Checkov CKV_K8S_26 |
| KA-C010 | Dangerous capabilities (SYS_ADMIN, NET_RAW, ALL) | error | Baseline/Restricted | KubeLinter, Polaris, Checkov CKV_K8S_25/28/39 |
| KA-C011 | Capabilities not dropped | warning | Restricted | Polaris (insecureCapabilities), Checkov CKV_K8S_37 |
| KA-C012 | Filesystem not read-only | warning | -- | KubeLinter, Polaris, Checkov CKV_K8S_22 |
| KA-C013 | Missing seccomp profile | warning | Baseline | Checkov CKV_K8S_31/32, kube-score |
| KA-C014 | Sensitive host path mounted | error | Baseline | KubeLinter (sensitive-host-mounts), Checkov CKV_K8S_27 |
| KA-C015 | Docker socket mounted | error | -- | KubeLinter (docker-sock), Checkov CKV_K8S_27 |
| KA-C016 | ServiceAccount token auto-mounted | warning | -- | Polaris, Checkov CKV_K8S_38 |
| KA-C017 | Default ServiceAccount used | warning | -- | KubeLinter, Checkov CKV_K8S_41/42 |
| KA-C018 | Secrets in environment variables | warning | -- | KubeLinter (env-var-secret), Checkov CKV_K8S_35 |
| KA-C019 | Default namespace used | info | -- | Checkov CKV_K8S_21 |
| KA-C020 | Missing security context entirely | warning | -- | Checkov CKV_K8S_29/30 |

**Confidence:** HIGH -- every rule maps directly to at least 2 competing tools and/or official Kubernetes Pod Security Standards. PSS Baseline/Restricted profiles are official Kubernetes documentation.

### Category 3: Reliability (Target: ~12 rules)

**What it is:** Configuration that prevents downtime, ensures recoverability, and validates operational readiness. Sourced primarily from kube-score (strongest reliability focus), Polaris reliability checks, and KubeLinter.

**Key rules:**

| Rule Code | Name | Severity | Source Tools |
|-----------|------|----------|--------------|
| KA-R001 | Missing liveness probe | warning | All tools (KubeLinter, Polaris, kube-score, Checkov CKV_K8S_8) |
| KA-R002 | Missing readiness probe | warning | All tools (Checkov CKV_K8S_9, kube-score) |
| KA-R003 | Identical liveness and readiness probes | warning | kube-score (pod-probes-identical) -- unique check |
| KA-R004 | Single replica Deployment | warning | KubeLinter (minimum-three-replicas), Polaris (deploymentMissingReplicas), kube-score |
| KA-R005 | Missing PodDisruptionBudget | info | kube-score, Polaris (missingPodDisruptionBudget) |
| KA-R006 | No rolling update strategy | warning | KubeLinter (no-rolling-update-strategy) |
| KA-R007 | Missing pod anti-affinity | info | KubeLinter (no-anti-affinity), kube-score |
| KA-R008 | Missing topology spread constraint | info | Polaris (topologySpreadConstraint) |
| KA-R009 | Image uses latest or no tag | warning | All tools |
| KA-R010 | Image pull policy not Always | info | kube-score, Checkov CKV_K8S_15 |
| KA-R011 | Selector/template label mismatch | error | KubeLinter (mismatching-selector), kube-score |
| KA-R012 | CronJob missing deadline | warning | kube-score (cronjob-has-deadline) |

**Confidence:** HIGH -- these are the most agreed-upon checks across all tools. Every major tool checks probes, replicas, and image tags.

### Category 4: Best Practice (Target: ~12 rules)

**What it is:** Resource management, operational hygiene, and configuration patterns that every K8s practitioner expects. Distinct from reliability (which prevents downtime) and security (which prevents attacks).

**Key rules:**

| Rule Code | Name | Severity | Source Tools |
|-----------|------|----------|--------------|
| KA-B001 | Missing CPU requests | warning | KubeLinter, Polaris, Checkov CKV_K8S_10 |
| KA-B002 | Missing CPU limits | warning | KubeLinter, Polaris, Checkov CKV_K8S_11 |
| KA-B003 | Missing memory requests | warning | KubeLinter, Polaris, Checkov CKV_K8S_12 |
| KA-B004 | Missing memory limits | warning | KubeLinter, Polaris, Checkov CKV_K8S_13 |
| KA-B005 | Missing required labels (app, version) | info | KubeLinter (required-label-owner), Polaris (metadataAndInstanceMismatched) |
| KA-B006 | Missing namespace | info | KubeLinter (use-namespace), Checkov CKV_K8S_21 |
| KA-B007 | SSH port exposed | info | KubeLinter (ssh-port) |
| KA-B008 | NodePort service type used | info | kube-score (service-type), KubeLinter (exposed-services) |
| KA-B009 | Liveness probe port not in container ports | warning | KubeLinter (liveness-port) |
| KA-B010 | Readiness probe port not in container ports | warning | KubeLinter (readiness-port) |
| KA-B011 | Missing priorityClassName | info | KubeLinter (priority-class-name), Polaris |
| KA-B012 | Duplicate environment variable keys | warning | KubeLinter (duplicate-env-var), kube-score |

**Confidence:** HIGH -- resource requests/limits are the single most agreed-upon best practice across every K8s linting tool.

### Category 5: Cross-Resource Validation (Target: ~8 rules)

**What it is:** Validation that spans multiple documents in a multi-document YAML file. This is the analysis that checks if a Service's selector actually matches a Deployment's pod template labels, if a ConfigMap referenced by a Deployment exists in the same file, etc.

This is the HEADLINE DIFFERENTIATOR for the K8s Analyzer. No browser-based tool does this. KubeLinter is the only CLI tool with meaningful cross-resource checks ("dangling-*" checks), and our tool surfaces these visually in the relationship graph.

**Key rules:**

| Rule Code | Name | Severity | Inspired By |
|-----------|------|----------|-------------|
| KA-X001 | Service selector matches no Pod template | warning | KubeLinter (dangling-service), kube-score (service-targets-pod) |
| KA-X002 | Ingress references undefined Service | warning | KubeLinter (dangling-ingress), kube-score (ingress-targets-service) |
| KA-X003 | ConfigMap reference not found in file | info | KubeLinter (env-value-from) |
| KA-X004 | Secret reference not found in file | info | KubeLinter (env-value-from) |
| KA-X005 | PVC reference not found in file | info | Novel check -- no tool does this specifically |
| KA-X006 | ServiceAccount reference not found in file | warning | KubeLinter (non-existent-service-account) |
| KA-X007 | NetworkPolicy selector matches no Pod | info | KubeLinter (dangling-networkpolicy) |
| KA-X008 | HPA targets non-existent resource | warning | KubeLinter (dangling-horizontalpodautoscaler), kube-score (horizontalpodautoscaler-has-target) |

**Confidence:** MEDIUM -- cross-resource validation in a browser-based single-file context is inherently limited. Users may paste only a Deployment without its Service; false positives are likely. MUST be clearly communicated as "checks references within the pasted YAML" not "validates complete cluster state." These should surface as informational or warning, never error.

**Complexity note:** HIGH -- requires building an in-memory resource registry from all parsed documents, then resolving references between them. Label selector matching requires understanding K8s matchLabels/matchExpressions semantics.

### Category 6: RBAC Analysis (Target: ~5 rules)

**What it is:** Analysis of Role, ClusterRole, RoleBinding, and ClusterRoleBinding resources for over-permissive configurations. Aligned with CIS Kubernetes Benchmark Section 5.1.

**Key rules:**

| Rule Code | Name | Severity | Source |
|-----------|------|----------|--------|
| KA-A001 | Wildcard permissions in Role/ClusterRole | error | KubeLinter (wildcard-in-rules), Checkov CKV_K8S_49, CIS 5.1.3 |
| KA-A002 | cluster-admin RoleBinding | error | KubeLinter (cluster-admin-role-binding), Polaris, CIS 5.1.1 |
| KA-A003 | Pod exec/attach permissions | warning | Polaris (clusterrolePodExecAttach, rolePodExecAttach) |
| KA-A004 | Secret access permissions | warning | KubeLinter (access-to-secrets), CIS 5.1.2 |
| KA-A005 | Pod creation permissions | warning | KubeLinter (access-to-create-pods), CIS 5.1.4 |

**Confidence:** MEDIUM-HIGH -- RBAC checks are well-defined in CIS benchmarks and implemented by KubeLinter and Polaris. However, RBAC resources may be less commonly pasted into a browser-based validator (they're often managed by platform teams via GitOps). Worth including because they add credibility and SEO value, but expect lower usage frequency.

### Recommended Category Weights

| Category | Weight | Rationale |
|----------|--------|-----------|
| Security | 35% | Container escapes, privilege escalation, host compromise -- highest real-world impact. K8s security is the #1 reason people lint manifests. |
| Reliability | 20% | Probes, replicas, update strategies -- prevents downtime in production |
| Best Practice | 20% | Resource limits, labels, operational hygiene -- expected by every K8s practitioner |
| Schema Validation | 15% | Structural correctness -- foundational but usually caught early |
| Cross-Resource | 10% | Reference validation between resources -- valuable but inherently limited in single-file browser context |

**Total target: ~67 rules** (10 schema + 20 security + 12 reliability + 12 best practice + 8 cross-resource + 5 RBAC)

RBAC rules are scored within the Security category since they are security-focused checks. The 6 categories above represent 5 weighted scoring dimensions (with RBAC folded into Security).

This is 72% more rules than the Dockerfile Analyzer (39 rules) and 29% more than the Compose Validator (52 rules), reflecting the significantly larger K8s configuration surface area.

---

## Feature Landscape

### Table Stakes (Users Expect These)

Features users assume exist. Missing these = product feels incomplete.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| CodeMirror 6 editor with YAML syntax highlighting | Two prior tools set this precedent | LOW | Direct reuse of @codemirror/lang-yaml from Compose Validator |
| Multi-document YAML support (`---` separators) | K8s manifests are almost always multi-document | MEDIUM | Must parse each document independently and report per-resource findings |
| Pre-loaded sample K8s manifest with deliberate issues | Established pattern from both prior tools | LOW | New sample, same pattern |
| On-demand analysis (Analyze button + Cmd/Ctrl+Enter) | Proven UX from two prior tools | LOW | Direct reuse |
| Per-resource-type schema validation (K8s 1.31) | kubeconform and every CLI tool does this; browser tools that lack it feel shallow | HIGH | Bundle K8s JSON Schemas for 18 resource types; per-document apiVersion/kind detection |
| Security checks (Pod Security Standards aligned) | EVERY K8s linting tool leads with security; users expect it | MEDIUM | 20 rules covering PSS Baseline + Restricted profiles |
| Reliability checks (probes, replicas, update strategy) | Second most expected category after security | MEDIUM | 12 rules sourced from kube-score, Polaris, KubeLinter consensus |
| Resource limits/requests validation | Most universally agreed-upon K8s best practice | LOW | 4 rules checking CPU/memory requests and limits |
| Category-weighted 0-100 scoring with letter grades | Trademark of the tool suite | LOW | Adapt scorer.ts with new 5-category weights |
| Inline editor annotations | Established pattern | LOW | Direct reuse of highlight-line.ts |
| Score gauge with letter grade | Visual centerpiece | LOW | Direct reuse |
| Category breakdown panel | Shows where points are lost | LOW | Adapt with new category names |
| Violation list (severity-grouped, click-to-navigate) | Standard results presentation | LOW | Direct reuse |
| Per-rule documentation pages at /tools/k8s-analyzer/rules/[code] | SEO powerhouse -- 67+ indexable pages | MEDIUM | Mirror existing rule page template |
| Score badge PNG download | Proven sharing feature | LOW | Adapt badge-generator.ts |
| Shareable URL state (lz-string, `#k8s=` prefix) | Users want to share findings | LOW | Adapt url-state.ts with new hash prefix |
| Deprecated API version detection | Official K8s deprecation guide exists; users expect this flagged | LOW | extensions/v1beta1 -> apps/v1, etc. |
| Image tag/latest detection | Every single competing tool checks this | LOW | Same pattern as Compose Validator CV-C014 |

### Differentiators (Competitive Advantage)

Features that set the product apart. Not required, but high value.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Interactive resource relationship graph | NO browser K8s tool visualizes how Deployments, Services, ConfigMaps, Secrets, PVCs, and Ingresses reference each other. This is THE headline feature. | HIGH | React Flow + dagre layout. Nodes = K8s resources (color-coded by kind). Edges = references (Service->Deployment selector, Deployment->ConfigMap volume/envFrom, Ingress->Service backend, etc.) |
| Cross-resource validation with graph integration | Dangling references (Service selecting nothing, Ingress pointing to missing Service) are both flagged as violations AND shown as red dashed edges in the graph | HIGH | Requires building resource registry from all parsed documents, resolving selectors and references |
| Pod Security Standards (PSS) profile mapping | Each security rule explicitly maps to PSS Baseline or Restricted profile. Results panel shows "Baseline: X violations, Restricted: Y violations" so users know their PSS compliance level at a glance | MEDIUM | Metadata on security rules; summary calculation in scorer |
| RBAC analysis | Validate Role/ClusterRole/RoleBinding for over-permissive configs (wildcards, cluster-admin, exec/attach). No browser tool does this. | MEDIUM | 5 rules targeting RBAC resource types specifically |
| 18 resource type coverage | Deployment, StatefulSet, DaemonSet, Service, Ingress, ConfigMap, Secret, PVC, PV, Job, CronJob, NetworkPolicy, Role, ClusterRole, RoleBinding, ClusterRoleBinding, HPA, PDB -- broader than any browser competitor | HIGH | Each requires its own schema bundle and resource-type-specific rules |
| Multi-document resource count and type summary | Before even scoring, show "Found: 3 Deployments, 2 Services, 1 ConfigMap, 1 Secret" -- instant structural overview | LOW | Byproduct of multi-document parsing |
| CIS Benchmark reference tags | Security rules tagged with CIS Kubernetes Benchmark control numbers (5.1.1, 5.1.2, 5.2.x) where applicable | LOW | Metadata tags on rule definitions; shown in rule documentation pages |
| Companion blog post ("Kubernetes Manifest Best Practices") | SEO content pillar; bidirectional cross-linking with tool | MEDIUM | Same MDX blog pattern |
| Homepage callout + JSON-LD + OG images | Standard site integration for discoverability | LOW | Proven pattern |

### Anti-Features (Commonly Requested, Often Problematic)

Features that seem good but create problems. Explicitly NOT building these.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Helm chart rendering | Real projects use Helm | Template rendering requires a Go runtime (tiller/helm template); cannot run in browser; massive scope | Validate rendered manifests -- users should run `helm template` first, then paste output |
| Kustomize overlay resolution | Real projects use Kustomize | Same problem -- `kustomize build` requires Go runtime and filesystem access | Same approach -- paste rendered output from `kustomize build` |
| CRD validation | Custom resources are common in real clusters | CRD schemas are infinite and project-specific; cannot bundle all possible CRDs | Validate core K8s resource types only (18 types); skip unknown `kind` values with informational message |
| Cluster-connected validation | `kubectl --dry-run=server` catches more issues | Requires API server access; authentication; network calls; privacy/security concerns | Pure client-side static analysis; clearly document this is offline validation |
| Auto-fix / auto-remediation | KubeLinter and Polaris suggest fixes | Modifying K8s YAML has high blast radius (wrong indentation can change semantics); YAML anchor/alias preservation is hard; security fixes may break application logic | Show detailed fix suggestions with before/after code in rule documentation pages |
| Real-time as-you-type validation | Feels responsive | Multi-document K8s YAML parsing + schema validation per document is expensive; partial YAML is always invalid; creates noise mid-edit | On-demand analysis (proven UX from two prior tools) |
| AI-powered analysis | Trendy | Contradicts human-expertise positioning; requires API calls (violates zero-backend architecture); unpredictable suggestions | Expert-written rule explanations with production consequences |
| Container image vulnerability scanning | Snyk/Trivy do this | Requires network calls to vulnerability databases; rate limits; slow; completely different concern from manifest linting | Out of scope -- link to Snyk/Trivy in companion blog post |
| Policy-as-code (OPA/Rego, Kyverno) | Enterprises use policy engines | Rego/CEL evaluation in browser is possible but massive scope; not a validator concern; these are enforcement mechanisms | Static lint rules with clear mapping to CIS/PSS standards |
| Multi-cluster version support | Different clusters run different K8s versions | Version matrix (1.25-1.31) multiplies schema bundles; UI complexity for version selection; diminishing returns | Target K8s 1.31 only; flag deprecated APIs from historical removals |

---

## Feature Dependencies

```
[YAML Multi-Document Parser]
    |
    +--requires--> [Per-Document apiVersion/kind Detection]
    |                  |
    |                  +--requires--> [Resource Type Registry (18 types)]
    |                  |                  |
    |                  |                  +--enables--> [Schema Validation (per-resource-type)]
    |                  |
    |                  +--enables--> [Resource Summary ("Found: 3 Deployments, 2 Services...")]
    |
    +--requires--> [Resource Registry (in-memory index of all parsed resources)]
                       |
                       +--enables--> [Cross-Resource Validation]
                       |                  |
                       |                  +--enables--> [Interactive Resource Relationship Graph]
                       |                  |
                       |                  +--enables--> [Dangling Reference Detection]
                       |
                       +--enables--> [Security Rules (per-container analysis)]
                       +--enables--> [Reliability Rules (per-workload analysis)]
                       +--enables--> [Best Practice Rules (per-resource analysis)]
                       +--enables--> [RBAC Analysis (Role/ClusterRole rules)]

[Scoring Engine (adapted from existing scorer)]
    |
    +--requires--> [All rule categories producing violations]
    +--enables--> [Score Gauge Component]
    +--enables--> [Category Breakdown Panel]
    +--enables--> [PSS Profile Summary (Baseline/Restricted compliance)]
    +--enables--> [Badge Generator]
    +--enables--> [URL State (shareable links)]

[CodeMirror 6 Editor]
    |
    +--requires--> [@codemirror/lang-yaml (already installed)]
    +--enables--> [Inline Annotations]
    +--enables--> [Click-to-navigate from violations]

[Rule Documentation Pages]
    |
    +--requires--> [Rule definitions with explanations, CIS/PSS tags, fix suggestions]
    +--enables--> [SEO indexable pages (67+)]

[Interactive Resource Relationship Graph]
    |
    +--requires--> [Resource Registry (from multi-doc parser)]
    +--requires--> [Cross-Resource Validation results (edges with validity status)]
    +--requires--> [React Flow + dagre layout]
    +--enables--> [Visual dangling reference highlighting]
    +--enables--> [Resource kind color-coding]
```

### Dependency Notes

- **Multi-document parser is foundational:** Everything depends on splitting YAML on `---`, parsing each document, and detecting apiVersion/kind. The `yaml` npm package (already used in Compose Validator) handles multi-document parsing via `parseAllDocuments()`.
- **Resource registry is the key new concept:** Unlike the Compose Validator (which has a single document model), the K8s Analyzer must build an in-memory index of all resources by kind+name so cross-resource rules and the graph can resolve references.
- **Schema validation per resource type:** Requires bundling ~18 JSON Schema files at build time. These are substantial files (10-80KB each). Must be tree-shaken or lazy-loaded to maintain bundle size.
- **Cross-resource validation requires the graph builder:** The same data structure that powers the visual graph (edges between resources) also powers the "dangling reference" checks.
- **RBAC rules are independent of cross-resource:** They examine Role/ClusterRole resources in isolation for over-permissive patterns.
- **PSS profile mapping is metadata-only:** Each security rule has a `pssProfile: 'baseline' | 'restricted' | null` tag. The summary calculation is trivial once rules are tagged.
- **React Flow can be lazy-loaded:** Proven pattern from Compose Validator (222KB separate chunk). Same approach here.

---

## MVP Definition

### Launch With (v1.7)

Everything needed to ship a credible K8s manifest analyzer that surpasses every existing browser-based tool.

- [ ] Multi-document YAML parsing with per-document apiVersion/kind detection -- foundational
- [ ] Per-resource-type schema validation for 18 K8s resource types (K8s 1.31 schemas) -- structural correctness baseline
- [ ] Security rules (~20 rules) with PSS Baseline/Restricted profile mapping -- the primary value proposition
- [ ] Reliability rules (~12 rules) -- probes, replicas, update strategy, image tags
- [ ] Best practice rules (~12 rules) -- resource limits, labels, namespace, operational hygiene
- [ ] RBAC analysis (~5 rules) -- wildcard permissions, cluster-admin binding, exec/attach
- [ ] Cross-resource validation (~8 rules) -- Service->Deployment selector matching, Ingress->Service, ConfigMap/Secret/PVC/SA references, NetworkPolicy->Pod, HPA->target
- [ ] Category-weighted scoring (Security 35%, Reliability 20%, Best Practice 20%, Schema 15%, Cross-Resource 10%)
- [ ] CodeMirror 6 YAML editor with dark theme, sample manifest, Cmd/Ctrl+Enter shortcut
- [ ] Inline annotations (squiggly underlines + gutter markers)
- [ ] Score gauge, category breakdown, violation list (tabbed results panel)
- [ ] Resource summary panel ("Found: 3 Deployments, 2 Services, 1 ConfigMap")
- [ ] Interactive resource relationship graph (React Flow + dagre) -- headline differentiator
- [ ] Dangling references shown as red dashed edges in graph
- [ ] Per-rule documentation pages (67+ pages at /tools/k8s-analyzer/rules/[code])
- [ ] PSS profile tags and CIS benchmark references on rule documentation pages
- [ ] Score badge download (PNG)
- [ ] Shareable URL state (lz-string, `#k8s=` prefix)
- [ ] Companion blog post
- [ ] OG images, homepage callout, header navigation, JSON-LD, breadcrumbs, sitemap

### Add After Validation (v1.x)

Features to add once core is working and user feedback is available.

- [ ] Resource kind color-coding in relationship graph (blue for workloads, green for services, yellow for config, purple for RBAC)
- [ ] Graph export as PNG/SVG
- [ ] K8s version selector (1.28, 1.29, 1.30, 1.31) for schema validation
- [ ] Namespace grouping in graph visualization
- [ ] Additional resource types (ServiceMonitor, Ingress routes, etc.)
- [ ] Fix suggestions panel with copy-to-clipboard before/after code

### Future Consideration (v2+)

Features to defer until the tool has proven its value.

- [ ] Custom rule configuration (enable/disable individual rules, adjust severity)
- [ ] Partial CRD support (common CRDs like cert-manager, external-dns)
- [ ] Import from URL (fetch manifest from raw GitHub URL)
- [ ] Side-by-side diff comparison of two manifests
- [ ] Integration with Compose Validator (detect manifests vs compose files automatically)

---

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority | Notes |
|---------|------------|---------------------|----------|-------|
| Multi-document YAML parsing + resource detection | HIGH | MEDIUM | P1 | Foundation for everything else |
| Per-resource-type schema validation (18 types) | HIGH | HIGH | P1 | Credibility baseline -- kubeconform-level schema checking |
| Security rules (20 rules, PSS mapped) | HIGH | MEDIUM | P1 | #1 reason users lint K8s manifests |
| Reliability rules (12 rules) | HIGH | MEDIUM | P1 | Probes + replicas are universally expected |
| Best practice rules (12 rules) | HIGH | LOW | P1 | Resource limits are universally expected |
| RBAC analysis (5 rules) | MEDIUM | MEDIUM | P1 | Unique for browser tool; CIS-aligned credibility |
| Cross-resource validation (8 rules) | HIGH | HIGH | P1 | Headline differentiator -- no browser tool does this |
| Category-weighted scoring | HIGH | LOW | P1 | Proven pattern; adapted from existing scorer |
| CodeMirror 6 YAML editor | HIGH | LOW | P1 | Direct reuse from Compose Validator |
| Inline annotations | HIGH | LOW | P1 | Direct reuse |
| Score gauge + category breakdown + violations | HIGH | LOW | P1 | Direct reuse |
| Interactive resource relationship graph | HIGH | HIGH | P1 | Headline visual differentiator |
| Per-rule documentation pages (67+ pages) | HIGH | MEDIUM | P1 | SEO powerhouse; expert credibility |
| Score badge + shareable URL | MEDIUM | LOW | P1 | Low cost, proven feature |
| Companion blog post | MEDIUM | MEDIUM | P1 | SEO content pillar |
| OG images + JSON-LD + site integration | MEDIUM | LOW | P1 | Standard site integration |
| PSS profile summary in results | MEDIUM | LOW | P1 | Low-cost add-on to security rules |
| Resource summary panel | MEDIUM | LOW | P1 | Low-cost; immediate user orientation |
| K8s version selector | LOW | HIGH | P2 | Requires bundling multiple schema versions |
| Graph export (PNG/SVG) | LOW | LOW | P2 | Nice to have |
| Resource kind color-coding in graph | MEDIUM | LOW | P2 | Visual polish for the graph |
| Custom rule configuration | LOW | MEDIUM | P3 | Power user feature |

---

## Competitor Feature Analysis

| Feature | KubeLinter (CLI) | Polaris (CLI+Dashboard) | kube-score (CLI) | Checkov (CLI) | EaseCloud (Web) | Our Approach |
|---------|-----------------|------------------------|-----------------|---------------|-----------------|-------------|
| Schema validation | Yes (basic) | No | No (best practice focus) | No (policy focus) | Yes (K8s 1.19-1.30) | Yes -- per-resource-type for 18 types, K8s 1.31 |
| Security checks | Yes (14+ checks) | Yes (24 checks) | Yes (5 checks) | Yes (45+ CKV_K8S checks) | Yes (basic PSS) | Yes -- 20 rules, PSS Baseline/Restricted mapped, CIS-tagged |
| Reliability checks | Yes (probes, replicas) | Yes (12 checks) | Yes (strongest, 15+ checks) | Yes (probes, resources) | Basic | Yes -- 12 rules sourced from kube-score/Polaris consensus |
| Resource limits | Yes | Yes (4 checks) | Yes | Yes | Yes | Yes -- 4 explicit rules |
| RBAC analysis | Yes (5 checks) | Yes (8 checks) | No | Yes (wildcards) | No | Yes -- 5 rules, CIS 5.1 mapped |
| Cross-resource validation | Yes ("dangling-*" checks: Service, Ingress, NetworkPolicy, HPA, ServiceMonitor) | No | Yes (service-targets-pod, ingress-targets-service, networkpolicy-targets-pod) | No | No | Yes -- 8 rules with VISUAL graph integration |
| Scoring system | None | Category pass/fail | OK/WARNING/CRITICAL per-check | Pass/fail per-check | Error/Warning/Info | Category-weighted 0-100 with letter grades |
| Visualization | None | Dashboard (cluster-connected) | None | None | None | Interactive resource relationship graph (React Flow) |
| Browser-based | No | No (dashboard needs cluster) | No | No | Yes | Yes -- fully client-side |
| Per-rule documentation | Markdown | Docs site | README_CHECKS.md | Policy index | None | 67+ dedicated SEO pages with expert explanations |
| Deprecated API detection | Yes (no-extensions-v1beta) | No | Yes (stable-version) | No | Yes | Yes -- comprehensive deprecation guide mapping |
| PSS profile mapping | No | Implicit in checks | No | Implicit | Yes (Baseline/Restricted) | Yes -- explicit per-rule PSS profile tags |
| Custom rules | Yes (templates) | Yes (JSON Schema) | No | Yes (Python) | No | No (anti-feature for v1; P3 for future) |
| Badge/sharing | No | No | No | No | No | PNG badge + lz-string URL |
| Multi-document | Yes | N/A (cluster) | Yes | Yes | Yes | Yes -- per-resource parsing and validation |

---

## Supported Resource Types (18)

| Resource Type | apiVersion | Schema Needed | Rule Categories |
|---------------|------------|---------------|-----------------|
| Deployment | apps/v1 | Yes | Schema, Security, Reliability, Best Practice, Cross-Resource |
| StatefulSet | apps/v1 | Yes | Schema, Security, Reliability, Best Practice, Cross-Resource |
| DaemonSet | apps/v1 | Yes | Schema, Security, Reliability, Best Practice, Cross-Resource |
| Job | batch/v1 | Yes | Schema, Security, Best Practice |
| CronJob | batch/v1 | Yes | Schema, Security, Best Practice, Reliability |
| Service | v1 | Yes | Schema, Best Practice, Cross-Resource |
| Ingress | networking.k8s.io/v1 | Yes | Schema, Cross-Resource |
| ConfigMap | v1 | Yes | Schema, Cross-Resource |
| Secret | v1 | Yes | Schema, Security (sensitive data patterns), Cross-Resource |
| PersistentVolumeClaim | v1 | Yes | Schema, Cross-Resource |
| PersistentVolume | v1 | Yes | Schema |
| NetworkPolicy | networking.k8s.io/v1 | Yes | Schema, Cross-Resource |
| Role | rbac.authorization.k8s.io/v1 | Yes | Schema, RBAC |
| ClusterRole | rbac.authorization.k8s.io/v1 | Yes | Schema, RBAC |
| RoleBinding | rbac.authorization.k8s.io/v1 | Yes | Schema, RBAC |
| ClusterRoleBinding | rbac.authorization.k8s.io/v1 | Yes | Schema, RBAC |
| HorizontalPodAutoscaler | autoscaling/v2 | Yes | Schema, Cross-Resource, Reliability |
| PodDisruptionBudget | policy/v1 | Yes | Schema, Reliability |

---

## Rule Naming Convention

Following the established pattern:

- **Dockerfile Analyzer:** DL-prefixed (Hadolint-compatible) and PG-prefixed (custom)
- **Compose Validator:** CV-prefixed with sub-prefixes (CV-S, CV-M, CV-C, CV-B, CV-F)
- **K8s Manifest Analyzer:** KA-prefixed (K8s Analyzer custom), with sub-prefixes for categories:
  - `KA-S0xx` -- Schema validation
  - `KA-C0xx` -- seCurity (including RBAC analysis rules KA-A0xx for docs, scored under Security)
  - `KA-R0xx` -- Reliability
  - `KA-B0xx` -- Best practices
  - `KA-X0xx` -- cross-Resource (X for cross)
  - `KA-A0xx` -- RBAC Analysis (scored under Security category)

Each rule maps to a documentation URL: `/tools/k8s-analyzer/rules/ka-s001`.

---

## Sample K8s Manifest Design

The pre-loaded sample should contain deliberate issues across ALL categories:

```yaml
# Sample K8s manifest with deliberate issues for demonstration
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: web-app
spec:
  replicas: 1
  selector:
    matchLabels:
      app: web
  template:
    metadata:
      labels:
        app: web-frontend
    spec:
      containers:
        - name: web
          image: nginx:latest
          ports:
            - containerPort: 80
          securityContext:
            privileged: true
            allowPrivilegeEscalation: true
          env:
            - name: DB_PASSWORD
              value: "supersecret123"
            - name: API_KEY
              value: "sk-1234567890abcdef"
          volumeMounts:
            - name: docker-sock
              mountPath: /var/run/docker.sock
            - name: app-config
              mountPath: /etc/config
      volumes:
        - name: docker-sock
          hostPath:
            path: /var/run/docker.sock
        - name: app-config
          configMap:
            name: app-settings
---
apiVersion: v1
kind: Service
metadata:
  name: web-service
spec:
  type: NodePort
  selector:
    app: web-app
  ports:
    - port: 80
      targetPort: 80
---
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: web-ingress
spec:
  rules:
    - host: example.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: missing-service
                port:
                  number: 80
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: overpermissive-role
rules:
  - apiGroups: ["*"]
    resources: ["*"]
    verbs: ["*"]
---
apiVersion: batch/v1
kind: CronJob
metadata:
  name: data-cleanup
spec:
  schedule: "0 2 * * *"
  jobTemplate:
    spec:
      template:
        spec:
          containers:
            - name: cleanup
              image: busybox
              command: ["sh", "-c", "echo cleanup"]
          restartPolicy: OnFailure
```

This sample triggers:
- **Schema:** selector/template label mismatch (web vs web-frontend)
- **Security:** privileged container, privilege escalation allowed, no runAsNonRoot, docker socket mounted, secrets in env vars, no security context on CronJob, no capabilities dropped, no read-only root filesystem, no seccomp profile
- **Reliability:** single replica, no liveness probe, no readiness probe, no rolling update strategy, latest tag, no image pull policy
- **Best Practice:** no CPU/memory requests or limits, no labels beyond app, NodePort service type, SSH-adjacent port exposure, no namespace, no priorityClassName, missing CronJob deadline
- **Cross-Resource:** Service selector matches no pod template (web-app vs web-frontend), Ingress references missing-service (not defined), ConfigMap app-settings not defined, dangling Service
- **RBAC:** wildcard permissions on ClusterRole (all apiGroups, resources, verbs)

---

## Key Implementation Considerations

### Schema Bundle Size

K8s JSON Schemas are large. The Deployment schema alone is ~50-80KB. Bundling 18 types naively would add 500KB-1MB to the build.

**Mitigation:** Lazy-load schemas per resource type. When a document is parsed and its kind is identified, dynamically import only the needed schema. Use Astro/Vite code splitting.

### False Positives in Cross-Resource Validation

Users may paste only a Deployment without its Service, triggering "Service selector matches no Pod template" false positives.

**Mitigation:** Cross-resource rules should default to `info` severity, not `warning` or `error`. The UI should clearly communicate "Checks references within the pasted YAML -- paste complete manifests for best results." The resource summary panel helps users understand what was parsed.

### Multi-Document Line Number Mapping

When YAML is split on `---`, line numbers must be offset correctly so violations point to the right line in the original editor content.

**Mitigation:** The `yaml` package's `parseAllDocuments()` with LineCounter handles this natively. Each document knows its range within the source.

---

## Sources

### Primary (HIGH confidence)
- [Kubernetes Pod Security Standards](https://kubernetes.io/docs/concepts/security/pod-security-standards/) -- Official Kubernetes documentation for PSS Baseline/Restricted profiles
- [Kubernetes API Deprecation Guide](https://kubernetes.io/docs/reference/using-api/deprecation-guide/) -- Official deprecated API version list
- [KubeLinter checks.md](https://github.com/stackrox/kube-linter/blob/main/docs/generated/checks.md) -- Complete list of ~60 KubeLinter checks
- [Polaris Security Checks](https://polaris.docs.fairwinds.com/checks/security/) -- 24 security checks with severity levels
- [Polaris Reliability Checks](https://polaris.docs.fairwinds.com/checks/reliability/) -- 12 reliability checks
- [Polaris Efficiency Checks](https://polaris.docs.fairwinds.com/checks/efficiency/) -- 4 resource limit checks
- [kube-score README_CHECKS.md](https://github.com/zegl/kube-score/blob/master/README_CHECKS.md) -- Complete list of 43 checks
- [Checkov Kubernetes Policy Index](https://www.checkov.io/5.Policy%20Index/kubernetes.html) -- 139+ CKV_K8S checks
- [kubernetes-json-schema registry](https://github.com/yannh/kubernetes-json-schema) -- JSON Schemas used by kubeconform
- [Kubernetes RBAC Good Practices](https://kubernetes.io/docs/concepts/security/rbac-good-practices/) -- Official RBAC security guidance

### Secondary (MEDIUM confidence)
- [EaseCloud K8s Manifest Validator](https://www.easecloud.io/tools/docker/kubernetes-manifest-validator/) -- Browser-based competitor analysis
- [FOSSA K8s Manifest Linter](https://fossa.com/resources/devops-tools/kubernetes-manifest-linter/) -- Browser-based competitor analysis
- [ValidKube](https://validkube.com/) -- Browser-based competitor analysis
- [CIS Kubernetes Benchmarks](https://www.cisecurity.org/benchmark/kubernetes) -- CIS 5.1 RBAC and 5.2 Pod Security controls
- [Datree GitHub](https://github.com/datreeio/datree) -- 100+ rules (company closed July 2023, project effectively dead)

### Existing Codebase (VERIFIED)
- `src/lib/tools/dockerfile-analyzer/types.ts` -- LintRule interface, RuleViolation, ScoreResult
- `src/lib/tools/dockerfile-analyzer/engine.ts` -- rule engine loop pattern
- `src/lib/tools/dockerfile-analyzer/scorer.ts` -- diminishing returns scoring algorithm
- `src/lib/tools/dockerfile-analyzer/rules/index.ts` -- rule registry pattern
- Compose Validator's YAML parsing (yaml npm package), ajv schema validation, React Flow graph

---
*Feature research for: Kubernetes Manifest Analyzer (v1.7 milestone)*
*Researched: 2026-02-23*
