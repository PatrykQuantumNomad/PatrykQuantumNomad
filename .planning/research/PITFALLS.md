# Pitfalls Research: Kubernetes Manifest Analyzer

**Domain:** Adding a browser-based Kubernetes manifest linter with cross-resource validation and security analysis to an existing Astro 5 portfolio site
**Researched:** 2026-02-23
**Confidence:** HIGH (verified against K8s OpenAPI spec structure, yannh/kubernetes-json-schema repo, K8s deprecation guide, Polaris security checks, eemeli/yaml parseAllDocuments docs, existing compose-validator codebase patterns)

**Context:** This is a SUBSEQUENT milestone pitfalls document for v1.7. The site already has a Dockerfile Analyzer (v1.5) and Docker Compose Validator (v1.6) that solved: YAML 1.1 merge keys, CodeMirror lifecycle with View Transitions, React Flow SSR/lazy loading, ajv configuration and line mapping, lz-string URL state encoding, and dagre cycle handling. This document covers ONLY K8s-specific pitfalls that are NEW -- problems unique to Kubernetes manifest analysis that were not encountered in previous milestones.

**Key differences from Compose Validator:**
- Multi-document YAML (multiple resources in one file separated by `---`)
- Per-resource-type schemas (not a single unified schema)
- apiVersion/kind combinatorial validation
- Cross-resource reference resolution (Service -> Deployment, Pod -> ConfigMap/Secret/PVC)
- Label selector matching semantics (matchLabels + matchExpressions)
- Schema size explosion (K8s OpenAPI is 4MB+; per-resource standalone schemas are 50-200KB each)

---

## Critical Pitfalls

### Pitfall 1: K8s Schema Size Explosion Destroys Bundle Budget

**What goes wrong:**
The Kubernetes OpenAPI specification (`swagger.json`) is approximately 4-5MB. Individual standalone schemas from `yannh/kubernetes-json-schema` are each 50-200KB because they inline ALL referenced definitions. A standalone `deployment-apps-v1.json` is approximately 150KB because it embeds the complete PodSpec, ObjectMeta, Container, Volume, Affinity, and every other nested type definition. If you bundle 18 resource types as standalone schemas, you are looking at 1-3MB of JSON schemas BEFORE gzip.

For comparison, the compose-spec schema is 75KB total -- a single file covering all Compose structures. The K8s equivalent is 15-40x larger because K8s has vastly more resource types with deeply nested shared definitions (PodSpec alone references Container, Volume, Probe, ResourceRequirements, SecurityContext, etc.).

Even with gzip compression (which JSON compresses well at ~70-80% reduction), you are still looking at 300-800KB of compressed schema data. The site's current Compose Validator page targets <350KB total gzipped JS. Adding K8s schemas as-is would more than double the bundle.

**Why it happens:**
Standalone schemas from yannh/kubernetes-json-schema resolve ALL `$ref` pointers into inline definitions. This makes each schema self-contained but massively redundant -- the ObjectMeta definition is duplicated identically inside Deployment, Service, Pod, ConfigMap, Secret, and every other resource schema. PodSpec (which alone is ~80KB) appears in Deployment, DaemonSet, StatefulSet, Job, CronJob, and ReplicaSet schemas.

**How to avoid:**
1. Do NOT use standalone schemas as-is. Extract and deduplicate. Create a shared definitions file containing common types (ObjectMeta, PodSpec, Container, Volume, etc.) and per-resource schemas that reference the shared definitions via `$ref`.

2. Build a schema extraction pipeline at build time:
   - Start from the full K8s OpenAPI spec for v1.31
   - Extract only the 18 resource types needed (Deployment, Service, Pod, ConfigMap, Secret, PVC, Ingress, NetworkPolicy, RBAC types, DaemonSet, StatefulSet, Job, CronJob, HPA, ServiceAccount, Namespace)
   - Deduplicate shared definitions into a single `k8s-definitions.json`
   - Each resource schema references shared definitions via `$ref: "#/$defs/io.k8s.api.core.v1.PodSpec"`
   - Pre-compile ALL schemas into a single ajv standalone validator module

3. Pre-compile with ajv's standalone code generation (`ajv.compileToStandalone()`). This produces a JavaScript module with validation functions, which is much smaller than the source schemas because ajv generates only the validation logic needed, not the full schema structure. The compose-validator already uses pre-compiled ajv (`validate-compose.js`).

4. Budget target: the compiled K8s validator module should be <200KB before gzip, <60KB gzipped. This is achievable because ajv standalone code is more compact than raw JSON schemas and benefits from gzip's deduplication of repeated validation patterns.

5. Lazy-load the schema validator module. Do NOT import it at the top level of the page -- load it on first analysis click, similar to the React Flow lazy loading pattern.

**Warning signs:**
- `npm run build` output shows a chunk >500KB containing JSON schema data
- Lighthouse Performance score drops below 80 on the K8s analyzer page
- The page takes >2 seconds to become interactive
- Schema JSON files are imported directly as ES module imports without pre-compilation
- Bundle visualizer shows massive repeated JSON structures

**Phase to address:**
Schema extraction and compilation phase (first phase). This is THE critical path -- every subsequent phase depends on having correctly extracted and compiled schemas. Getting this wrong means a rewrite of the entire validation foundation.

**Severity:** CRITICAL

---

### Pitfall 2: Multi-Document YAML Line Number Tracking Produces Wrong Lines After First Document

**What goes wrong:**
Kubernetes manifests typically contain multiple resources in a single YAML file separated by `---` document separators. The compose-validator uses `parseDocument()` for a single document. The K8s analyzer must use `parseAllDocuments()` which returns an array of Document objects.

The `LineCounter` from `eemeli/yaml` tracks absolute offsets across the ENTIRE input string, not per-document. Each Document's nodes have `range` values that are absolute character offsets into the full multi-document string. This means `lineCounter.linePos(node.range[0])` correctly returns global line numbers.

However, there are three failure modes:

1. **Displaying document-relative context**: When reporting "Deployment 'api' in document 3 has no resource limits," the user expects to see the line number within the context of that resource. If the full file is 300 lines and the Deployment starts at line 180, showing "line 180" is correct but confusing when the user thinks of the Deployment as "starting at line 1 of that section."

2. **The `---` separator itself**: The document separator line `---` has no AST node. If a parse error occurs at a `---` line (e.g., malformed separator `-- -`), there is no node to map. The LineCounter tracks it but the error cannot be attributed to any Document.

3. **Empty documents**: A file like `---\n---\n` produces empty Document objects. `parseAllDocuments()` returns Documents with `contents: null`. Accessing `.contents` on these produces null, and any code that assumes every Document has contents will crash.

**Why it happens:**
The compose-validator never dealt with multi-document YAML because Docker Compose files are always single documents. The K8s analyzer introduces a fundamentally different parsing model where one input string produces N independent resources, each needing its own apiVersion/kind identification and schema selection.

**How to avoid:**
1. Use a single `LineCounter` for the entire input -- this is how `parseAllDocuments` works naturally. Global line numbers are correct.

2. Build a document index that maps each Document to its start/end line range:
```typescript
interface K8sDocumentInfo {
  doc: Document;
  docIndex: number;      // 0-based document index
  startLine: number;     // 1-based global start line
  endLine: number;       // 1-based global end line
  apiVersion: string;
  kind: string;
  name: string;          // metadata.name
  namespace?: string;    // metadata.namespace
}
```

3. Filter out empty documents (`doc.contents === null`) before processing. Log a count: "Parsed 5 documents (2 empty, 3 with resources)."

4. For display, show both global line and document context: "Line 180 (Deployment 'api', document 3)."

5. Handle the `---` separator parsing edge case: if a Document has errors and `contents === null`, map the error to the line of the preceding `---` separator using the Document's `range` property.

**Warning signs:**
- Violations in the second or third document show line 1
- Empty `---` blocks crash the parser loop
- The UI shows "Unknown resource" for documents that have valid content
- Tests only use single-document YAML files

**Phase to address:**
Multi-document parsing infrastructure phase (first phase). The document index must be built before any per-resource validation runs.

**Severity:** CRITICAL

---

### Pitfall 3: apiVersion/Kind Validation Is a Combinatorial Problem, Not a Simple Lookup

**What goes wrong:**
Kubernetes resources are identified by the combination of `apiVersion` and `kind`. These are not independent -- each `kind` has a specific set of valid `apiVersion` values. A `Deployment` must use `apiVersion: apps/v1`, never `apiVersion: v1`. A `Service` must use `apiVersion: v1`, never `apiVersion: apps/v1`. An `Ingress` must use `apiVersion: networking.k8s.io/v1`, not the deprecated `apiVersion: extensions/v1beta1`.

The combinatorial mapping for just the 18 target resource types:

| kind | Valid apiVersion | Deprecated apiVersions |
|------|-----------------|----------------------|
| Pod | v1 | -- |
| Service | v1 | -- |
| ConfigMap | v1 | -- |
| Secret | v1 | -- |
| PersistentVolumeClaim | v1 | -- |
| ServiceAccount | v1 | -- |
| Namespace | v1 | -- |
| Deployment | apps/v1 | apps/v1beta1 (removed 1.16), apps/v1beta2 (removed 1.16), extensions/v1beta1 (removed 1.16) |
| DaemonSet | apps/v1 | apps/v1beta2 (removed 1.16), extensions/v1beta1 (removed 1.16) |
| StatefulSet | apps/v1 | apps/v1beta1 (removed 1.16), apps/v1beta2 (removed 1.16) |
| ReplicaSet | apps/v1 | apps/v1beta2 (removed 1.16), extensions/v1beta1 (removed 1.16) |
| Job | batch/v1 | -- |
| CronJob | batch/v1 | batch/v1beta1 (removed 1.25) |
| Ingress | networking.k8s.io/v1 | networking.k8s.io/v1beta1 (removed 1.22), extensions/v1beta1 (removed 1.22) |
| NetworkPolicy | networking.k8s.io/v1 | extensions/v1beta1 (removed 1.16) |
| Role | rbac.authorization.k8s.io/v1 | rbac.authorization.k8s.io/v1beta1 (removed 1.22) |
| ClusterRole | rbac.authorization.k8s.io/v1 | rbac.authorization.k8s.io/v1beta1 (removed 1.22) |
| RoleBinding | rbac.authorization.k8s.io/v1 | rbac.authorization.k8s.io/v1beta1 (removed 1.22) |
| ClusterRoleBinding | rbac.authorization.k8s.io/v1 | rbac.authorization.k8s.io/v1beta1 (removed 1.22) |
| HorizontalPodAutoscaler | autoscaling/v2 | autoscaling/v2beta1 (removed 1.25), autoscaling/v2beta2 (removed 1.26) |

Getting this mapping wrong means either (a) rejecting valid manifests or (b) allowing invalid apiVersion/kind combinations through to schema validation, where they will produce confusing errors like "schema not found" instead of "wrong apiVersion for this kind."

**Why it happens:**
The compose-validator had a simple problem: one schema, one spec. K8s has a GVK (Group-Version-Kind) system where the same Kind can exist in multiple API groups and versions, some current and some deprecated. The mapping is not derivable from the schema files alone -- it requires domain knowledge of the K8s API structure.

**How to avoid:**
1. Build a static GVK registry as a TypeScript constant:
```typescript
const GVK_REGISTRY: Record<string, { validApiVersions: string[]; deprecatedApiVersions: Record<string, string> }> = {
  Deployment: {
    validApiVersions: ['apps/v1'],
    deprecatedApiVersions: {
      'apps/v1beta1': 'Removed in K8s 1.16. Use apps/v1.',
      'apps/v1beta2': 'Removed in K8s 1.16. Use apps/v1.',
      'extensions/v1beta1': 'Removed in K8s 1.16. Use apps/v1.',
    },
  },
  // ... etc
};
```

2. Validate apiVersion/kind BEFORE selecting a schema. If the combination is invalid, report a clear error: "Deployment resources use apiVersion: apps/v1, not v1." If the apiVersion is deprecated, report: "apiVersion apps/v1beta2 for Deployment was removed in Kubernetes 1.16. Use apps/v1."

3. Handle unknown kinds gracefully. If `kind: MyCustomResource`, skip schema validation and report info: "Custom resource 'MyCustomResource' -- schema validation skipped (CRD schemas are cluster-specific)."

4. The schema file lookup key must be derived from the GVK, not guessed. The yannh schema naming convention is `{kind-lowercase}-{group}-{version}.json` (e.g., `deployment-apps-v1.json`). Core API types (v1) use just `{kind-lowercase}-v1.json` (e.g., `pod-v1.json`).

**Warning signs:**
- A Deployment with `apiVersion: v1` passes validation
- Deprecated apiVersions produce no warning
- Unknown kinds crash the schema lookup instead of being skipped
- The GVK mapping is hardcoded in multiple places instead of a central registry

**Phase to address:**
GVK registry and schema selection phase (first or second phase). Must be complete before per-resource-type schema validation can work.

**Severity:** CRITICAL

---

### Pitfall 4: Label Selector Matching Has Subtle Semantics That Cross-Resource Validation Gets Wrong

**What goes wrong:**
Cross-resource validation is the most valuable differentiator of this tool. The core use case: "Does this Service's selector match any Deployment's pod template labels?" Getting selector matching semantics wrong produces either false positives (claiming a match where none exists) or false negatives (missing broken references).

The subtle semantics:

1. **matchLabels is AND, not OR**: A selector with `{app: "api", tier: "backend"}` matches only pods with BOTH labels. Matching against a pod template with only `{app: "api"}` is NOT a match, even though one label matches.

2. **matchExpressions operators have non-obvious behavior**:
   - `In` with values `[a, b]` matches if the label key exists AND its value is "a" OR "b"
   - `NotIn` with values `[a, b]` matches if the label key does NOT exist OR its value is neither "a" nor "b". Note: NotIn matches resources WITHOUT the label key -- this is counterintuitive.
   - `Exists` matches if the label key exists, regardless of value
   - `DoesNotExist` matches if the label key does NOT exist

3. **matchLabels + matchExpressions are ANDed together**: If both are specified, ALL matchLabels must match AND ALL matchExpressions must match.

4. **Service selector uses simple equality only**: Service `.spec.selector` is a flat `map[string]string` -- it does NOT support `matchLabels`/`matchExpressions`. It uses strict equality-based matching only. This is different from Deployment's `.spec.selector` which uses `matchLabels`/`matchExpressions`.

5. **Empty selector semantics differ by resource type**:
   - Deployment with empty `spec.selector.matchLabels`: selects nothing (invalid, rejected by API server)
   - Service with empty `spec.selector`: selects all pods in namespace
   - NetworkPolicy with empty `spec.podSelector`: selects all pods in namespace

6. **Label value format validation**: Label keys must be `[prefix/]name` where prefix is a DNS subdomain (max 253 chars) and name is max 63 chars matching `[a-z0-9A-Z][-_.a-z0-9A-Z]*[a-z0-9A-Z]`. Label values must be max 63 chars with the same pattern (or empty). Cross-resource validation should verify label format, not just matching.

**Why it happens:**
The compose-validator's cross-resource validation was simple: "Does service X reference network Y that exists in the networks section?" K8s cross-resource validation requires implementing a label selector matching engine, which is a non-trivial algorithm with edge cases.

**How to avoid:**
1. Build a dedicated label selector matcher as a standalone utility:
```typescript
function matchesSelector(
  podLabels: Record<string, string>,
  selector: {
    matchLabels?: Record<string, string>;
    matchExpressions?: Array<{
      key: string;
      operator: 'In' | 'NotIn' | 'Exists' | 'DoesNotExist';
      values?: string[];
    }>;
  }
): boolean
```

2. Write exhaustive tests for the matcher covering:
   - matchLabels with exact match
   - matchLabels with subset (extra labels on pod -- should still match)
   - matchLabels with missing label (should NOT match)
   - matchExpressions `In` with matching and non-matching values
   - matchExpressions `NotIn` with absent key (should match!)
   - matchExpressions `Exists` and `DoesNotExist`
   - Combined matchLabels + matchExpressions
   - Empty selectors per resource type

3. Distinguish between Service selectors (simple map) and Deployment/DaemonSet selectors (matchLabels/matchExpressions). Do NOT apply matchExpressions logic to Service selectors.

4. For cross-resource matching, report partial matches as info (not errors): "Service 'api-svc' selector matches Deployment 'api' pod labels on 2 of 3 labels -- missing label 'version'."

**Warning signs:**
- Cross-resource validation reports Service selectors as "not matching" when they do match
- `NotIn` expressions always report "no match" when the label is absent (should report match)
- Service selector matching uses matchExpressions logic (Services don't support matchExpressions)
- Tests only cover exact-match cases, not subset or partial match scenarios

**Phase to address:**
Cross-resource validation phase (middle phase). The selector matcher must be built and tested BEFORE any cross-resource rules that depend on it.

**Severity:** CRITICAL

---

### Pitfall 5: Cross-Resource Reference Resolution Across Multi-Document YAML Has an Identity Problem

**What goes wrong:**
Cross-resource validation requires building a resource index: all ConfigMaps, all Secrets, all Services, all Deployments defined in the YAML input. Then rules check references: "Pod mounts ConfigMap 'app-config' -- does it exist?" But K8s resources are identified by namespace + kind + name, not just name. Two resources with the same name in different namespaces are different resources.

The pitfalls:

1. **Namespace resolution**: If a resource has no `metadata.namespace`, it belongs to the "default" namespace. But when a user pastes a multi-document file, they may intend all resources to be in the same namespace without specifying it. If a Pod references ConfigMap "app-config" and both omit namespace, they are in the same namespace. But if the Pod specifies `namespace: production` and the ConfigMap omits namespace, the ConfigMap is in "default" -- a cross-namespace reference that will fail at deploy time.

2. **Scope confusion for cluster-scoped resources**: ClusterRole, ClusterRoleBinding, Namespace, and PersistentVolume are cluster-scoped (no namespace). A RoleBinding can reference a ClusterRole, but a Role cannot be referenced from a different namespace. The validator must know which resources are namespaced vs. cluster-scoped.

3. **Resources not in the YAML**: A Pod may reference ConfigMap "kube-root-ca.crt" which is auto-created by K8s in every namespace. Flagging this as "ConfigMap not found" is a false positive. Similarly, ServiceAccount "default" always exists. The validator should distinguish "reference to resource in this YAML file" from "reference to external resource that may exist in the cluster."

4. **Multiple resources of the same kind and name**: A multi-document YAML could contain two ConfigMaps named "app-config" -- one intentionally for different namespaces, or one accidentally duplicated. The resource index must handle this.

**Why it happens:**
The compose-validator's resource index was flat and unique: each service name, network name, and volume name appeared exactly once. K8s resources exist in a three-dimensional space (namespace x kind x name) and have external references to resources that may not be in the input file.

**How to avoid:**
1. Build a resource index keyed by `{namespace}/{kind}/{name}`:
```typescript
interface ResourceIndex {
  byKey: Map<string, K8sDocumentInfo[]>;  // "default/ConfigMap/app-config" -> [doc1, doc2]
  byKind: Map<string, K8sDocumentInfo[]>; // "Deployment" -> [dep1, dep2, ...]
  clusterScoped: Set<string>;             // resource kinds that have no namespace
}
```

2. For cross-resource reference checks, use a three-tier severity:
   - ERROR: Reference to a resource of the same kind in the same namespace that appears elsewhere in the file with a different name (likely typo)
   - WARNING: Reference to a resource that does not exist in the YAML file (may exist in cluster)
   - INFO: Reference where namespace inference is ambiguous

3. Maintain a list of "well-known" resources that always exist and should not trigger warnings: `ServiceAccount/default`, `ConfigMap/kube-root-ca.crt`, `Namespace/default`, `Namespace/kube-system`, `Namespace/kube-public`.

4. Handle duplicate resources: if two ConfigMaps with the same name and namespace appear, flag as warning: "Duplicate ConfigMap 'app-config' in namespace 'default' (documents 2 and 5)."

**Warning signs:**
- Every Pod that uses ServiceAccount "default" gets flagged as "ServiceAccount not found"
- Cross-resource checks ignore namespace, matching resources that would be in different namespaces
- The resource index crashes on duplicate names
- Cluster-scoped resources are treated as namespaced

**Phase to address:**
Cross-resource validation phase (middle phase). The resource index must be designed before any cross-resource rules are implemented.

**Severity:** CRITICAL

---

### Pitfall 6: NetworkPolicy Selector Semantics Are Subtly Different from Deployment Selectors

**What goes wrong:**
NetworkPolicy uses `podSelector`, `namespaceSelector`, and `ipBlock` in its ingress/egress rules. These have semantics that differ from Deployment/Service selectors in critical ways:

1. **AND vs OR in ingress/egress rules**: When `podSelector` and `namespaceSelector` appear in the SAME `from`/`to` block, they are ANDed (pods matching the podSelector IN namespaces matching the namespaceSelector). When they appear in SEPARATE `from`/`to` blocks, they are ORed. This is the single most confusing aspect of NetworkPolicy and a common source of security misconfigurations.

Example of AND (one from block):
```yaml
ingress:
- from:
  - namespaceSelector:
      matchLabels:
        project: myproject
    podSelector:
      matchLabels:
        role: frontend
```

Example of OR (two from blocks):
```yaml
ingress:
- from:
  - namespaceSelector:
      matchLabels:
        project: myproject
  - podSelector:
      matchLabels:
        role: frontend
```

The YAML indentation is the only difference -- a single hyphen changes the semantics from "frontend pods in myproject namespace" to "ALL pods in myproject namespace OR ALL frontend pods in ANY namespace."

2. **Empty podSelector `{}` means ALL pods**: `spec.podSelector: {}` applies the NetworkPolicy to all pods in the namespace. An empty `from: [{}]` allows traffic from all pods. This is valid but often unintentional.

3. **Absent vs empty ingress/egress**: If `spec.ingress` is absent, all inbound traffic is allowed (pod is not isolated for ingress). If `spec.ingress: []` is present but empty, ALL inbound traffic is denied. The difference between "field absent" and "field present but empty" has opposite security implications.

**Why it happens:**
NetworkPolicy is widely acknowledged as one of the most confusing K8s resources. The YAML structure does not visually communicate the AND/OR distinction. Security audit tools frequently flag NetworkPolicies but rarely explain WHY the configuration may be wrong.

**How to avoid:**
1. Build NetworkPolicy analysis as a dedicated rule module, not as part of the generic cross-resource validator. It needs specialized parsing logic.

2. Detect the AND/OR ambiguity and surface it as an informational check: "NetworkPolicy 'allow-frontend' has a combined podSelector + namespaceSelector in a single 'from' block. This matches pods that satisfy BOTH selectors (AND logic). If you intended OR logic, separate them into individual 'from' entries."

3. Flag empty selectors with clear explanation: "`podSelector: {}` applies this policy to ALL pods in the namespace. Ensure this is intentional."

4. Flag absent vs. empty ingress/egress explicitly: "This NetworkPolicy has no `ingress` field -- inbound traffic is NOT restricted by this policy. To deny all inbound traffic, add `ingress: []`."

5. Do NOT attempt to evaluate NetworkPolicy effects across resources (e.g., "Can Pod A talk to Pod B?"). This requires full namespace/label resolution and is beyond the scope of static analysis. Stick to structural checks and common misconfiguration detection.

**Warning signs:**
- NetworkPolicy rules pass validation without any semantic checks
- AND/OR ambiguity in from/to blocks is not detected
- Empty vs. absent ingress/egress is not distinguished
- The analyzer tries to compute network reachability (scope explosion)

**Phase to address:**
Security rules phase (middle to late phase). NetworkPolicy analysis should be one of the last security rules implemented because it is the most complex.

**Severity:** HIGH

---

### Pitfall 7: Deployment spec.selector Is Immutable -- Validation Should Warn About Matching

**What goes wrong:**
In Kubernetes, a Deployment's `spec.selector` is immutable after creation. If a user creates a Deployment with `matchLabels: {app: api}`, they cannot later update it to `matchLabels: {app: api, version: v2}` without deleting and recreating the Deployment. This is a K8s constraint that causes real-world deployment failures.

The validator should check: `spec.selector.matchLabels` MUST be a subset of `spec.template.metadata.labels`. The template can have additional labels, but every label in the selector must appear in the template. This is a server-side validation that K8s performs, but catching it client-side with a clear message is highly valuable.

Additionally, the selector labels should be "stable" -- labels like `version` that change across deployments should NOT be in the selector, only in the template labels. This is a best practice, not a hard requirement.

**Why it happens:**
Users often copy labels into matchLabels without understanding that matchLabels is the identity selector for the ReplicaSet. Changing it creates a new ReplicaSet instead of updating the existing one, leading to orphaned pods.

**How to avoid:**
1. Implement a rule that validates selector-to-template label consistency:
   - ERROR if any selector label is not in template labels
   - WARNING if selector contains labels that look ephemeral (e.g., "version", "build", "hash")
   - INFO noting that selector is immutable after deployment

2. Apply the same check to StatefulSet, DaemonSet, ReplicaSet, and Job (all have immutable selectors).

3. For Services, check that the Service selector labels exist as labels on at least one Deployment/Pod template in the same file.

**Warning signs:**
- The validator does not check selector-to-template label consistency
- Tests only verify that selector exists, not that it matches template labels
- The immutability warning is missing

**Phase to address:**
Best practice rules phase (middle phase).

**Severity:** HIGH

---

## Moderate Pitfalls

### Pitfall 8: K8s Schema Validation Misses Server-Side-Only Constraints

**What goes wrong:**
K8s JSON schemas derived from the OpenAPI spec do NOT capture all validation rules. Many constraints are implemented in server-side admission controllers and are not expressed in the schema. Examples:

- Container port numbers must be 1-65535 (schema says `integer`, does not constrain range)
- `replicas` cannot be negative (schema says `integer`, does not constrain range)
- Resource quantities like "100m" (100 millicores) or "256Mi" (256 mebibytes) have a specific format not captured in the schema
- Label keys and values have format constraints (63 char max, alphanumeric start/end) not in the schema
- `metadata.name` must be a valid DNS subdomain (lowercase, max 253 chars) -- the schema says `string`

If the validator only uses schema validation, these common errors pass silently and the user discovers them only at `kubectl apply` time.

**Why it happens:**
K8s's OpenAPI spec is generated from Go struct definitions and does not fully express all validation logic. Many validations are in Go code (apiserver admission controllers) that cannot be represented in JSON Schema. This is a known limitation of kubeconform and kubeval -- they miss the same issues.

**How to avoid:**
1. Implement custom semantic rules for K8s-specific constraints that the schema misses:
   - Port range validation (1-65535)
   - Replica count non-negativity
   - Resource quantity format validation (`/^\d+(\.\d+)?[mKMGTPE]?i?$/`)
   - Label key/value format validation
   - metadata.name DNS subdomain format
   - Container name RFC 1123 label format

2. These rules are HIGH VALUE because they catch errors that schema validation and kubeconform miss. Highlight this as a differentiator: "Catches issues that kubeconform misses."

3. Do NOT try to implement ALL server-side validations. Focus on the 10-15 most common ones that users actually encounter.

**Warning signs:**
- `replicas: -1` passes validation
- `containerPort: 99999` passes validation
- Resource quantities like "100MiB" (invalid -- should be "100Mi") pass validation
- Label values with 100+ characters pass validation

**Phase to address:**
Semantic validation rules phase (middle phase). These rules should be prioritized after schema validation but before security rules.

**Severity:** HIGH

---

### Pitfall 9: RBAC Rules Analysis Crosses Resource Boundaries in Non-Obvious Ways

**What goes wrong:**
RBAC validation requires understanding four interconnected resource types: Role, ClusterRole, RoleBinding, ClusterRoleBinding. The relationships are:

- A RoleBinding references a Role OR a ClusterRole (via `roleRef`)
- A ClusterRoleBinding references only a ClusterRole
- A RoleBinding + ClusterRole grants the ClusterRole's permissions only in the RoleBinding's namespace
- A ClusterRoleBinding + ClusterRole grants permissions cluster-wide

The common mistakes to detect:
- RoleBinding references a Role that does not exist (in the same namespace)
- ClusterRoleBinding references a ClusterRole that does not exist
- Binding grants `cluster-admin` privileges (Polaris security check)
- Role/ClusterRole grants `pods/exec` or `pods/attach` (security risk)
- Role grants wildcard (`*`) on resources or verbs (overly permissive)
- RoleBinding in one namespace references a Role from a different namespace (impossible -- Roles are namespaced, RoleBinding can only reference a Role in its own namespace)

**Why it happens:**
RBAC is four separate resource types with complex inter-dependencies. Unlike Service-to-Deployment matching (which is just label comparison), RBAC matching uses string references (`roleRef.name`, `roleRef.kind`, `roleRef.apiGroup`) that must be resolved against the resource index.

**How to avoid:**
1. Build RBAC analysis as a dedicated module that:
   - Indexes all Role, ClusterRole, RoleBinding, ClusterRoleBinding resources
   - Validates roleRef references (name exists, kind is correct, apiGroup is correct)
   - Flags security anti-patterns (wildcard permissions, cluster-admin binding, pods/exec)

2. Keep RBAC checks focused on structural correctness and security anti-patterns. Do NOT try to compute effective permissions (requires full cluster state).

3. Be careful with namespace scoping: a RoleBinding can reference a ClusterRole, but the resulting permissions are scoped to the RoleBinding's namespace. Do NOT flag this as an error -- it is a valid and common pattern.

**Warning signs:**
- RoleBinding referencing a ClusterRole is flagged as an error (it is valid)
- RBAC rules ignore namespace scoping
- The validator tries to compute "effective permissions" from RBAC resources (too complex)
- ClusterRole with wildcard verbs is not flagged

**Phase to address:**
Security rules phase (middle to late phase). RBAC analysis should come after basic cross-resource validation is working.

**Severity:** HIGH

---

### Pitfall 10: Resource Quantity Parsing Is More Complex Than It Appears

**What goes wrong:**
Kubernetes resource quantities (for CPU, memory, storage) use a specific format that is not a standard unit system. Common formats:

- CPU: `100m` (100 millicores), `0.1` (same), `1` (1 core), `1.5` (1.5 cores)
- Memory: `128Mi` (128 mebibytes), `1Gi` (1 gibibyte), `128M` (128 megabytes), `1G` (1 gigabyte)
- Note: `Mi` vs `M` and `Gi` vs `G` are DIFFERENT (binary vs decimal)

Edge cases:
- `0` is valid for both CPU and memory
- `100m` for memory means 100 millibytes (valid but nonsensical -- 0.1 bytes)
- Exponential notation: `1e3` (1000), `1.5e2` (150) -- valid but unusual
- Negative quantities are invalid
- No spaces between number and suffix
- `Ki`, `Mi`, `Gi`, `Ti`, `Pi`, `Ei` are binary suffixes
- `k` (note: lowercase for kilo), `M`, `G`, `T`, `P`, `E` are decimal suffixes

The validator should detect:
- Invalid format (e.g., "100 Mi" with a space, "100MiB" with extra "B")
- Nonsensical values (e.g., memory request of `100m` = 0.1 bytes)
- Request exceeding limit (`resources.requests.memory > resources.limits.memory`)
- Missing requests when limits are set (best practice: always set both)

**Why it happens:**
Resource quantities use a K8s-specific format that is neither SI units nor IEC units exactly. The `m` suffix is overloaded (millicores for CPU, millibytes for memory). Parser must understand context.

**How to avoid:**
1. Build a resource quantity parser that handles all valid formats
2. Validate quantities in context (CPU vs memory)
3. Compare requests vs limits with parsed values
4. Flag nonsensical values (sub-byte memory, sub-millicore CPU)

**Warning signs:**
- `resources.limits.memory: 100m` passes without a warning
- `resources.requests.cpu: 2` and `resources.limits.cpu: 1` (request > limit) not detected
- Exponential notation crashes the parser

**Phase to address:**
Semantic validation rules phase (middle phase).

**Severity:** MEDIUM

---

### Pitfall 11: Pre-Compiled ajv Validators Need One Function Per Resource Type, Not One Monolithic Validator

**What goes wrong:**
The compose-validator has one schema and one pre-compiled validator function (`validate-compose.js`). The K8s analyzer has 18+ resource types, each with its own schema. If you pre-compile all 18 schemas into a single ajv instance and generate standalone code, the output module will be massive because ajv inlines all referenced definitions for each resource type.

Alternatively, if you try to compile each schema separately, you get 18 separate ajv instances, which wastes memory on duplicated shared definitions.

**Why it happens:**
ajv's standalone code generation produces a self-contained module. If you add 18 schemas to one ajv instance, the standalone output contains all 18 validators with their full dependency trees. Shared definitions (ObjectMeta, PodSpec, Container) are deduplicated within the ajv instance but still produce one validation function per schema.

**How to avoid:**
1. Add all 18 schemas to a SINGLE ajv instance (shared definitions are compiled once)
2. Generate standalone code with all validators exported as named functions
3. The build script should produce one file (`validate-k8s.js`) exporting functions like:
```typescript
export const validateDeployment: ValidateFunction;
export const validateService: ValidateFunction;
export const validatePod: ValidateFunction;
// ... etc
```
4. At runtime, select the correct validator based on the GVK registry:
```typescript
const validators: Record<string, ValidateFunction> = {
  'apps/v1/Deployment': validateDeployment,
  'v1/Service': validateService,
  // ...
};
```
5. Measure the output file size. Target: <200KB before gzip for all 18 validators combined.

**Warning signs:**
- 18 separate `validate-*.js` files are generated
- Each file is >100KB because shared definitions are duplicated
- Runtime creates 18 ajv instances
- Schema compilation happens at runtime instead of build time

**Phase to address:**
Schema extraction and compilation phase (first phase).

**Severity:** MEDIUM

---

### Pitfall 12: The Resource Relationship Graph Is Much More Complex Than Compose's Dependency Graph

**What goes wrong:**
The compose-validator's graph shows service dependencies (`depends_on` edges). It is a simple directed graph with one edge type. The K8s resource relationship graph has MANY edge types:

- Service -> Deployment/Pod (selector matching)
- Deployment -> ConfigMap (volume mount, envFrom, env.valueFrom)
- Deployment -> Secret (volume mount, envFrom, env.valueFrom, imagePullSecrets)
- Deployment -> PVC (volume mount)
- Deployment -> ServiceAccount (spec.serviceAccountName)
- Ingress -> Service (backend service reference)
- NetworkPolicy -> Pod (podSelector)
- RoleBinding -> Role/ClusterRole (roleRef)
- RoleBinding -> ServiceAccount/User/Group (subjects)
- Job/CronJob -> ConfigMap/Secret (same as Deployment)
- HPA -> Deployment/StatefulSet (scaleTargetRef)

This means 10+ edge types with different semantics. Rendering them all on one graph produces visual chaos. The compose dependency graph typically has 5-15 nodes with 5-20 edges. A K8s manifest with 15 resources could have 30-50 edges.

**Why it happens:**
K8s resources are more interconnected than Compose services. Each resource type has multiple reference mechanisms (label selectors, name references, volume mounts). The graph complexity grows quadratically with the number of resources.

**How to avoid:**
1. Implement edge type filtering in the graph UI. Let users toggle edge types: "Show selector matches," "Show ConfigMap/Secret references," "Show RBAC bindings."

2. Use different visual styles for different edge types:
   - Selector matches: solid lines
   - Name references (ConfigMap, Secret, PVC): dashed lines
   - RBAC bindings: dotted lines
   - Each type gets a distinct color

3. Group related resources visually (all core resources together, all RBAC together).

4. Consider a simplified "overview" mode that only shows the primary relationships (Service -> Deployment -> ConfigMap/Secret) and hides RBAC/NetworkPolicy edges by default.

5. Set a reasonable node limit for the graph. If there are >30 resources, show a warning: "Large manifest detected. Graph shows primary relationships only."

**Warning signs:**
- The graph is an unreadable tangle of edges on a 15+ resource manifest
- All edge types look the same (no visual distinction)
- Users cannot understand what relationship each edge represents
- dagre layout produces overlapping nodes because of too many edges

**Phase to address:**
Graph visualization phase (late phase). The graph is the LAST feature to implement because it depends on all cross-resource validation being complete first.

**Severity:** MEDIUM

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Bundling standalone schemas without deduplication | No build tooling needed | 1-3MB of JSON in the bundle; Lighthouse score tanks | Never -- deduplication is mandatory for browser delivery |
| Skipping apiVersion deprecation checks | Fewer rules to write initially | Users deploy deprecated resources without warning | MVP only -- deprecation checks should be in the first release |
| Treating all namespaces as "default" | Simpler cross-resource matching | False matches across namespaces; incorrect validation results | MVP only -- must handle explicit namespaces before cross-resource validation is trustworthy |
| Ignoring well-known auto-created resources | Simpler reference checking | Every Pod gets "ServiceAccount 'default' not found" | Never -- the false positive noise destroys trust in the tool |
| Single edge type in graph | Simpler graph rendering | Graph shows connections but not what KIND of connection; limited utility | MVP acceptable -- add edge types in a follow-up phase |
| Skipping resource quantity parsing | Simpler validation | Missing the most common user error (requests > limits, nonsensical values) | MVP only -- resource quantity checks are high value |

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Multi-doc YAML + ajv | Running one ajv validator on the entire multi-doc output | Parse into Document array, extract apiVersion/kind per document, select correct schema per resource |
| parseAllDocuments + LineCounter | Creating a new LineCounter per document | Use ONE LineCounter for entire input; offsets are global |
| GVK registry + schema selection | Hardcoding schema file paths inline | Central GVK registry maps apiVersion+kind to schema key; schema key maps to pre-compiled validator function |
| Cross-resource refs + namespace | Ignoring namespace in reference resolution | Build resource index keyed by namespace/kind/name; handle omitted namespace as "default" |
| Label selector matching | Treating matchLabels as OR | matchLabels entries are ANDed; matchExpressions entries are ANDed; matchLabels + matchExpressions are ANDed |
| Service selector vs Deployment selector | Applying matchExpressions logic to Service selector | Service uses simple `map[string]string` equality matching only |
| NetworkPolicy from/to blocks | Treating all selectors in a from block as AND | Multiple items in a `from` array are ORed; selectors within a single item are ANDed |
| RBAC RoleBinding + ClusterRole | Flagging RoleBinding referencing ClusterRole as error | Valid pattern -- ClusterRole permissions are scoped to RoleBinding's namespace |
| Resource quantity comparison | String comparison of "100Mi" vs "1Gi" | Parse quantities to numeric bytes/millicores before comparison |
| URL state with multi-document | Assuming single document in URL-decoded state | URL state contains full multi-doc YAML; display all documents on decode |

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Loading all 18 schemas at module init | 1-3MB parsed on page load | Pre-compile to ajv standalone; lazy-load the compiled module | Always -- schemas must be lazy or pre-compiled |
| Running cross-resource validation on every document pair | O(n^2) comparisons for n documents | Build resource index once, then run rules against index | Manifests with 20+ resources |
| dagre layout on 30+ node graph | Layout computation >500ms; browser jank | Set node limit for graph; simplify edges; add timeout | Large manifests with many cross-references |
| Re-parsing all documents when only one changed | Unnecessary work if editor supports incremental edits | Re-parse the full input on each analysis (K8s files are edited then analyzed, not live-validated) | Not an issue unless live validation is attempted |
| N schema validations per analysis (one per document) | 18 ajv calls on an 18-resource file | Pre-compiled validators are fast (<1ms each); total should be <20ms | Only if validators are compiled at runtime instead of build time |

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| Displaying Secret data values in the graph or results | Users paste real Secrets with base64-encoded credentials | Never render Secret `.data` or `.stringData` values; show only Secret name and referenced keys |
| Not warning about Secrets in base64 (not encrypted) | Users think K8s Secrets are encrypted | Add an informational rule: "K8s Secrets are base64-encoded, not encrypted. Use external secret management for sensitive data." |
| Flagging ServiceAccount automount as always-bad | Some workloads need API access | Frame as "review needed" not "error": "automountServiceAccountToken is true. Verify this workload needs K8s API access." |
| Missing wildcard RBAC detection | ClusterRole with `resources: ["*"], verbs: ["*"]` is cluster-admin equivalent | Detect and flag wildcard permissions in Roles/ClusterRoles as critical security finding |

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Showing all 67 rules as one flat list | Users cannot find the issues relevant to their resource type | Group results by resource (document) first, then by category within each resource |
| Not identifying which document a violation belongs to | "Line 145: missing resource limits" -- which resource? | Prefix violations with resource identity: "[Deployment/api] Line 145: missing resource limits" |
| Graph shows all edge types at once | Visual chaos on complex manifests | Default to showing primary edges only; let users toggle edge types |
| CRD / unknown resource rejection | User pastes a file with a CRD and the tool rejects the whole file | Skip unknown resource types gracefully; validate only known types; inform user which resources were skipped |
| Deprecated apiVersion shown as error | Users feel their working manifests are "wrong" | Frame as warning with migration path: "apiVersion extensions/v1beta1 for Ingress is deprecated. Use networking.k8s.io/v1." |

## "Looks Done But Isn't" Checklist

- [ ] **Multi-doc parsing**: `parseAllDocuments()` with shared LineCounter; empty documents filtered; document index built
- [ ] **GVK registry**: All 18 resource types mapped with valid and deprecated apiVersions; unknown kinds handled gracefully
- [ ] **Schema size**: Pre-compiled ajv module <200KB; NOT shipping raw JSON schemas in the bundle
- [ ] **Label selector matching**: matchLabels AND semantics tested; matchExpressions NotIn-with-absent-key tested; Service vs Deployment selector distinction implemented
- [ ] **Cross-resource namespace scoping**: Resources without namespace treated as "default"; cluster-scoped resources handled; well-known resources whitelisted
- [ ] **NetworkPolicy AND/OR**: Combined selectors detected; empty vs absent ingress/egress distinguished
- [ ] **RBAC cross-references**: RoleBinding->ClusterRole is valid; wildcard permissions flagged; namespace scoping correct
- [ ] **Resource quantities**: Parsed to numeric values; requests vs limits compared; nonsensical values flagged
- [ ] **Selector-to-template consistency**: Deployment selector labels are subset of template labels; same for StatefulSet/DaemonSet
- [ ] **Per-document violations**: Every violation includes document index and resource identity (kind/name)
- [ ] **Graph edge types**: At least 3 edge types visually distinguishable; edge count manageable on 15+ resource files
- [ ] **Deprecated apiVersions**: All deprecated versions from the GVK table produce clear warnings with migration paths
- [ ] **Server-side constraint rules**: Port range, replica non-negativity, resource quantity format, label format validated
- [ ] **Secret data safety**: Secret .data/.stringData values never rendered in UI, graph, or URL state

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Schema size explosion (P1) | HIGH | Must build schema extraction/deduplication pipeline; rewrite schema compilation; rebuild validation layer |
| Multi-doc line tracking (P2) | MEDIUM | Switch from parseDocument to parseAllDocuments; build document index; update all line mapping code |
| GVK validation wrong (P3) | LOW | Update GVK registry constant; fix schema selection logic; add tests for each apiVersion/kind combination |
| Label selector matching wrong (P4) | MEDIUM | Rewrite selector matcher; add comprehensive test suite; re-test all cross-resource rules |
| Cross-resource namespace issues (P5) | MEDIUM | Add namespace to resource index key; update all cross-resource rules to namespace-aware matching |
| NetworkPolicy semantics (P6) | LOW | Fix AND/OR detection logic in NetworkPolicy rules; add test cases for each pattern |
| Selector-template mismatch (P7) | LOW | Add new rule; straightforward implementation |
| Schema misses server-side constraints (P8) | MEDIUM | Add custom semantic rules for each missing constraint; must know which constraints to add |
| RBAC analysis wrong (P9) | MEDIUM | Fix RBAC module; add namespace scoping; add RoleBinding->ClusterRole test cases |
| Resource quantity parsing (P10) | LOW | Build/fix quantity parser; add test suite with edge cases |
| ajv compilation strategy wrong (P11) | HIGH | Rewrite build script; regenerate standalone validator; potentially restructure schema loading |
| Graph complexity (P12) | MEDIUM | Add edge type filtering; limit node count; add visual grouping |

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Schema size explosion (P1) | Phase 1: Schema extraction & compilation | Bundle visualizer shows K8s validator <200KB; Lighthouse 85+ |
| Multi-doc line tracking (P2) | Phase 1: Multi-doc parsing infrastructure | Violations in doc 3 of a 5-doc file show correct global line numbers AND resource identity |
| GVK validation (P3) | Phase 1: GVK registry & schema selection | Each of 18 resource types validates with correct apiVersion; deprecated versions produce warnings |
| Label selector matching (P4) | Phase 2: Cross-resource validation infrastructure | Comprehensive selector matching test suite passes (20+ test cases including NotIn-absent-key) |
| Cross-resource namespace scoping (P5) | Phase 2: Cross-resource validation | Same-name resources in different namespaces are not confused; well-known resources not flagged |
| NetworkPolicy semantics (P6) | Phase 3: Security rules | AND/OR detection works on canonical examples; empty/absent ingress/egress distinguished |
| Selector-template consistency (P7) | Phase 2-3: Best practice rules | Deployment with mismatched selector/template labels flagged; correct deployments pass |
| Server-side constraints (P8) | Phase 2: Semantic validation rules | Port range, replicas, resource quantities, label format all validated beyond schema |
| RBAC analysis (P9) | Phase 3: Security rules | RoleBinding->ClusterRole is valid; wildcard permissions flagged; non-existent role references flagged |
| Resource quantities (P10) | Phase 2: Semantic validation rules | Quantity parser handles all formats; request>limit detected; nonsensical values flagged |
| ajv compilation strategy (P11) | Phase 1: Schema extraction & compilation | One compiled module exports all validators; shared definitions not duplicated |
| Graph complexity (P12) | Phase 4: Graph visualization | Graph is usable on 15-resource manifest; edge types are filterable |

## Sources

- [yannh/kubernetes-json-schema](https://github.com/yannh/kubernetes-json-schema) -- per-version, per-resource standalone JSON Schemas for K8s; naming conventions; standalone format produces ~150KB per resource due to inlined definitions (HIGH confidence -- verified via WebFetch of actual schema file)
- [Kubernetes Deprecated API Migration Guide](https://kubernetes.io/docs/reference/using-api/deprecation-guide/) -- complete list of deprecated and removed apiVersions by K8s version; removal dates for extensions/v1beta1, apps/v1beta1, etc. (HIGH confidence -- official K8s docs)
- [Kubernetes v1.31 Upcoming Changes](https://kubernetes.io/blog/2024/07/19/kubernetes-1-31-upcoming-changes/) -- v1.31-specific removals and deprecations (HIGH confidence -- official K8s blog)
- [Kubernetes Labels and Selectors](https://kubernetes.io/docs/concepts/overview/working-with-objects/labels/) -- matchLabels/matchExpressions semantics; In/NotIn/Exists/DoesNotExist operators; label format constraints; Service vs Deployment selector differences (HIGH confidence -- official K8s docs)
- [Kubernetes Network Policies](https://kubernetes.io/docs/concepts/services-networking/network-policies/) -- AND/OR semantics in from/to blocks; empty/absent ingress/egress; podSelector/namespaceSelector (HIGH confidence -- official K8s docs)
- [Kubernetes RBAC Authorization](https://kubernetes.io/docs/reference/access-authn-authz/rbac/) -- Role/ClusterRole/RoleBinding/ClusterRoleBinding relationships; roleRef structure; namespace scoping (HIGH confidence -- official K8s docs)
- [RBAC Good Practices](https://kubernetes.io/docs/concepts/security/rbac-good-practices/) -- security anti-patterns; wildcard permissions; cluster-admin binding risks (HIGH confidence -- official K8s docs)
- [Polaris Security Checks](https://polaris.docs.fairwinds.com/checks/security/) -- 23 security checks including privilege escalation, host access, RBAC, capabilities; implementation via JSON Schema-based check definitions (HIGH confidence -- verified via WebFetch)
- [Datree: Selector Does Not Match Template Labels](https://www.datree.io/resources/kubernetes-error-codes-selector-does-not-match-template-labels) -- selector-template label mismatch; immutability of selector field; historical context for explicit matchLabels requirement (MEDIUM confidence -- verified by multiple sources)
- [kubeconform Limitations](https://github.com/yannh/kubeconform) -- schema validation misses server-side constraints; property type checks work but value validation is incomplete; CRD schema challenges (MEDIUM confidence -- community source, verified by multiple articles)
- [eemeli/yaml parseAllDocuments](https://eemeli.org/yaml/) -- single LineCounter across all documents; absolute offsets for node ranges; multi-document parsing behavior (HIGH confidence -- verified via WebFetch of official docs)
- [instrumenta/openapi2jsonschema](https://github.com/instrumenta/openapi2jsonschema) -- tool for extracting per-resource JSON Schemas from K8s OpenAPI spec; standalone/local/strict flavors (HIGH confidence -- official tool for schema extraction)
- [Ajv Managing Schemas](https://ajv.js.org/guide/managing-schemas.html) -- single ajv instance for multiple schemas; compileAsync for on-demand loading; standalone code generation (HIGH confidence -- official ajv docs)
- [Kubernetes API Groups and Versions](https://book.kubebuilder.io/cronjob-tutorial/gvks) -- GVK (Group-Version-Kind) concept; API group organization; core vs named groups (HIGH confidence -- Kubebuilder book)
- Codebase analysis: compose-validator parser.ts (parseDocument + LineCounter pattern), schema-validator.ts (pre-compiled ajv, error categorization), engine.ts (validation pipeline), types.ts (rule/violation architecture), compose-spec-schema.json (75KB single schema for comparison) (HIGH confidence -- direct code inspection)

---
*Pitfalls research for: Kubernetes Manifest Analyzer -- browser-based K8s manifest linter with cross-resource validation (v1.7 milestone)*
*Researched: 2026-02-23*
