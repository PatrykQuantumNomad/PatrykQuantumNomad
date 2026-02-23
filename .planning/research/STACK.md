# Stack Research: Kubernetes Manifest Analyzer

**Domain:** Browser-based Kubernetes manifest validation with multi-document YAML parsing, per-resource-type JSON Schema validation, security analysis (PSS/CIS), cross-resource validation, and interactive resource relationship graph
**Researched:** 2026-02-23
**Confidence:** HIGH

## Existing Stack (Already Installed -- No Changes Needed)

These technologies are already in the project and serve the K8s analyzer without modification.

| Technology | Version | Relevance to K8s Manifest Analyzer |
|------------|---------|-------------------------------------|
| `yaml` (eemeli) | ^2.8.2 | **Critical.** Already used by compose-validator. Provides `parseAllDocuments()` for multi-document YAML (K8s manifests use `---` separators), `parseDocument()` with `LineCounter` for AST-level line number resolution, and `isMap`/`isPair`/`isScalar`/`isSeq` for AST traversal. This is the correct library for K8s YAML parsing. |
| `ajv` | ^8.18.0 | **Critical.** Already used by compose-validator with pre-compiled standalone pattern. Supports JSON Schema draft-07 (which K8s schemas use). The standalone code generation pattern (`ajv/dist/standalone`) is proven in this codebase and avoids `new Function()` for CSP compliance. |
| `ajv-formats` | ^3.0.1 | **Supporting.** Some K8s schemas reference format validators (e.g., `date-time`, `int-or-string`). Already installed. |
| `@codemirror/lang-yaml` | ^6.1.2 | **Direct reuse.** YAML syntax highlighting for the editor. |
| `codemirror` | ^6.0.2 | **Direct reuse.** Editor foundation. |
| `@codemirror/theme-one-dark` | ^6.1.3 | **Direct reuse.** Editor dark theme. |
| `@xyflow/react` | ^12.10.1 | **Direct reuse.** Resource relationship graph visualization. |
| `@dagrejs/dagre` | ^2.0.4 | **Direct reuse.** Automatic graph layout for resource dependency visualization. |
| `nanostores` | ^1.1.0 | **Direct reuse.** State management for analysis results, editor content, active tab. |
| `@nanostores/react` | ^1.0.0 | **Direct reuse.** React bindings for nanostores. |
| `lz-string` | ^1.5.0 | **Direct reuse.** URL state compression for shareable analysis links. |
| `react` | ^19.2.4 | **Direct reuse.** UI component framework. |
| `react-dom` | ^19.2.4 | **Direct reuse.** React DOM rendering. |

**Verdict: Zero new npm dependencies required.** The entire K8s analyzer can be built using libraries already installed.

## New Data Assets Required (Not npm Packages)

The K8s analyzer requires Kubernetes JSON Schema files compiled into standalone Ajv validators at build time. These are data files, not runtime dependencies.

### Kubernetes JSON Schemas

| Asset | Source | Purpose | Confidence |
|-------|--------|---------|------------|
| K8s v1.31.0 standalone-strict JSON schemas | [yannh/kubernetes-json-schema](https://github.com/yannh/kubernetes-json-schema) | Per-resource-type schema validation | HIGH |

**Source:** The `yannh/kubernetes-json-schema` repository is the actively maintained successor to `instrumenta/kubernetes-json-schema` (archived) and `garethr/kubernetes-json-schema` (unmaintained since K8s 1.18). It is auto-updated daily via GitHub Actions and covers K8s v1.19.0 through v1.35.1+.

**Schema flavor:** Use `v1.31.0-standalone-strict` because:
- **standalone** = all `$ref` references are dereferenced/inlined (no external references to resolve at runtime)
- **strict** = `additionalProperties: false` at all levels (catches unknown/misspelled fields, which is the behavior users expect from a linter)

**File naming convention:** `{kind-lowercase}-{group}-{version}.json` or `{kind-lowercase}-{version}.json` for core API resources.

### Required Schema Files (18 Resource Types)

| Resource Kind | apiVersion | Schema File Name | Notes |
|--------------|------------|------------------|-------|
| Pod | v1 | `pod-v1.json` | Core workload spec |
| Deployment | apps/v1 | `deployment-apps-v1.json` | Most common workload |
| StatefulSet | apps/v1 | `statefulset-apps-v1.json` | Stateful workloads |
| DaemonSet | apps/v1 | `daemonset-apps-v1.json` | Node-level workloads |
| Job | batch/v1 | `job-batch-v1.json` | One-shot workloads |
| CronJob | batch/v1 | `cronjob-batch-v1.json` | Scheduled workloads |
| Service | v1 | `service-v1.json` | Networking |
| Ingress | networking.k8s.io/v1 | `ingress-networking-v1.json` | External access |
| NetworkPolicy | networking.k8s.io/v1 | `networkpolicy-networking-v1.json` | Network segmentation |
| ConfigMap | v1 | `configmap-v1.json` | Configuration |
| Secret | v1 | `secret-v1.json` | Sensitive data |
| PersistentVolumeClaim | v1 | `persistentvolumeclaim-v1.json` | Storage claims |
| ServiceAccount | v1 | `serviceaccount-v1.json` | Identity |
| Role | rbac.authorization.k8s.io/v1 | `role-rbac-v1.json` | Namespace RBAC |
| ClusterRole | rbac.authorization.k8s.io/v1 | `clusterrole-rbac-v1.json` | Cluster RBAC |
| RoleBinding | rbac.authorization.k8s.io/v1 | `rolebinding-rbac-v1.json` | RBAC binding |
| ClusterRoleBinding | rbac.authorization.k8s.io/v1 | `clusterrolebinding-rbac-v1.json` | Cluster RBAC binding |
| Namespace | v1 | `namespace-v1.json` | Namespace definition |

### Schema Compilation Strategy

**Use the same pre-compiled standalone Ajv pattern as the compose-validator.** Create `scripts/compile-k8s-schemas.mjs` that:

1. Downloads or reads the 18 standalone-strict JSON schema files from `src/lib/tools/k8s-analyzer/schemas/`
2. Compiles each schema into a standalone Ajv validation function
3. Exports them as a named ESM map: `export const validateDeployment = ...;`
4. Outputs a single `validate-k8s.js` file (or one per resource type if bundle size warrants splitting)

**Critical detail:** The compose-validator compiles ONE schema into ONE validator. The K8s analyzer compiles 18 schemas. Ajv's standalone code generation supports multiple named exports:

```javascript
const ajv = new Ajv({
  schemas: [deploymentSchema, podSchema, serviceSchema, ...],
  code: { source: true, esm: true },
  allErrors: true,
  strict: false,
  verbose: true,
  validateSchema: false,
});

const code = standaloneCode(ajv, {
  validateDeployment: deploymentSchema.$id || 'deployment-apps-v1',
  validatePod: podSchema.$id || 'pod-v1',
  validateService: serviceSchema.$id || 'service-v1',
  // ... 18 total
});
```

**Bundle size consideration:** K8s standalone-strict schemas are large (a single Deployment schema is 10,000+ lines when dereferenced because it includes the full PodSpec). The compiled validator code will be substantial. Recommendation:

- **Split into 3 bundles by frequency of use:**
  1. `validate-k8s-workloads.js` -- Pod, Deployment, StatefulSet, DaemonSet, Job, CronJob (most commonly validated)
  2. `validate-k8s-networking.js` -- Service, Ingress, NetworkPolicy
  3. `validate-k8s-config.js` -- ConfigMap, Secret, PVC, ServiceAccount, Namespace, Role, ClusterRole, RoleBinding, ClusterRoleBinding
- **Lazy-load bundles** -- Only import the validator needed for the detected resource type
- **Tree-shaking safe** -- ESM named exports allow bundlers to include only what is imported

**Alternative considered and rejected:** Runtime Ajv compilation (compiling schemas in the browser at validation time). This requires `new Function()` which violates CSP, adds 200-300ms startup latency per schema, and increases the browser bundle by the full Ajv library size (~150KB min). The pre-compiled approach avoids all of these issues.

## Resource Type Detection Strategy

K8s manifests declare their type via `apiVersion` + `kind` fields. The analyzer must map these to the correct pre-compiled validator.

```typescript
// Hardcoded mapping -- finite set of 18 supported types
const SCHEMA_MAP: Record<string, () => Promise<ValidateFunction>> = {
  'v1/Pod': () => import('./validate-k8s-workloads.js').then(m => m.validatePod),
  'apps/v1/Deployment': () => import('./validate-k8s-workloads.js').then(m => m.validateDeployment),
  'apps/v1/StatefulSet': () => import('./validate-k8s-workloads.js').then(m => m.validateStatefulSet),
  // ... etc
};

function getSchemaKey(apiVersion: string, kind: string): string {
  return `${apiVersion}/${kind}`;
}
```

**Why hardcoded, not dynamic:** This is a static site with no API server. CRD support would require users to paste their CRD schemas -- out of scope for v1.7. The 18 resource types cover the vast majority of K8s manifests users will validate.

## Multi-Document YAML Parsing

K8s manifests commonly contain multiple resources separated by `---`. The `yaml` package's `parseAllDocuments()` handles this natively:

```typescript
import { parseAllDocuments, LineCounter } from 'yaml';

function parseK8sManifest(rawText: string) {
  const lineCounter = new LineCounter();
  const docs = parseAllDocuments(rawText, {
    lineCounter,
    prettyErrors: true,
    uniqueKeys: true,  // K8s doesn't use duplicate keys (unlike Docker Compose YAML 1.1)
    keepSourceTokens: false,
  });
  // Each doc has its own errors, contents, and shares the lineCounter
  return docs.map(doc => ({
    doc,
    lineCounter,
    json: doc.toJSON(),
    errors: doc.errors,
  }));
}
```

**Key difference from compose-validator:** The compose-validator uses `parseDocument()` (single document, YAML 1.1 mode with merge key support). The K8s analyzer uses `parseAllDocuments()` (multi-document, YAML 1.2 default -- K8s uses YAML 1.2 and does not use merge keys).

**YAML version:** Use YAML 1.2 (the default). K8s manifests do not use YAML 1.1 features like merge keys (`<<`). Using 1.2 avoids edge cases where `yes`/`no`/`on`/`off` are treated as booleans (YAML 1.1 behavior that causes bugs in K8s manifests).

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| `js-yaml` | Older library, no AST access, no `LineCounter`, no multi-document with position tracking. The `yaml` package is already installed and superior for this use case. | `yaml` (eemeli) -- already installed |
| `@kubernetes/client-node` | Server-side library for K8s API access. 500KB+ bundle, requires Node.js APIs, not designed for browser validation. | Custom per-resource-type JSON Schema validation with pre-compiled Ajv |
| `kubeconform` / `kubeval` | Go binaries. Cannot run in browser. Server-side tools for CI/CD. | Pre-compiled Ajv validators from K8s JSON schemas |
| Runtime Ajv compilation | Requires `new Function()` (CSP violation), adds startup latency, bloats browser bundle | Pre-compiled standalone Ajv validators (same pattern as compose-validator) |
| `yannh/kubernetes-json-schema` non-strict schemas | Missing `additionalProperties: false`, so unknown/misspelled fields pass validation silently | Use `standalone-strict` flavor |
| `instrumenta/kubernetes-json-schema` | Archived/unmaintained. Last update was ~K8s 1.22 | Use `yannh/kubernetes-json-schema` (actively maintained, daily updates) |
| `garethr/kubernetes-json-schema` | Unmaintained since K8s 1.18 | Use `yannh/kubernetes-json-schema` |
| `graphology` for graph operations | Not needed for K8s resource graphs (no cycle detection needed unlike Docker Compose `depends_on`). The compose-validator needed cycle detection for circular dependencies; K8s resources reference each other but cycles are not an error. | Direct graph construction for `@xyflow/react` + `@dagrejs/dagre` |
| OPA/Rego policies | Requires a policy engine runtime (30KB+ for browser-compatible Rego evaluator), adds complexity, overkill for static rule checks that can be expressed as TypeScript functions | TypeScript rule functions (same pattern as compose-validator rules) |

## Stack Patterns by Variant

**Schema validation path (per-document):**
```
Raw YAML string
  -> parseAllDocuments() [yaml package]
  -> For each Document:
    -> doc.toJSON() to get plain object
    -> Extract apiVersion + kind
    -> Look up pre-compiled validator from SCHEMA_MAP
    -> Lazy-import the correct bundle
    -> Run validator(json)
    -> Map ajv ErrorObjects to K8s violations with line numbers (resolveInstancePath pattern from compose-validator)
```

**Custom rule execution path (per-document + cross-document):**
```
For each Document:
  -> Run per-resource rules (security, best practice, reliability)
  -> Collect violations with line numbers

Cross-document pass:
  -> Build reference graph (which resources reference which)
  -> Check selector matching (Service -> Pod labels)
  -> Check ConfigMap/Secret/PVC/SA references exist
  -> Check Ingress -> Service references
  -> Score all violations with category weights
```

## Version Compatibility

| Package | Compatible With | Notes |
|---------|-----------------|-------|
| `yaml@^2.8.2` | `ajv@^8.18.0` | Both produce plain JSON objects; no compatibility issues. `yaml` outputs JSON via `doc.toJSON()`, `ajv` validates JSON objects. |
| `ajv@^8.18.0` | K8s JSON Schema (draft-07) | K8s schemas use JSON Schema draft-07. Ajv 8.x supports draft-07 natively. No configuration needed. |
| `ajv@^8.18.0` standalone | Vite/Rollup (Astro bundler) | Pre-compiled ESM code is tree-shakeable and compatible with Vite's module resolution. Proven in compose-validator. |
| `@xyflow/react@^12.10.1` | `react@^19.2.4` | Already working together in compose-validator's DependencyGraph. No issues. |
| K8s schemas v1.31.0 | `ajv@^8.18.0` | The standalone-strict schemas may use `int-or-string` format. Need to register a custom format or strip it during compilation. Ajv's `strict: false` + `validateSchema: false` handles unknown formats gracefully. |

## Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| `scripts/compile-k8s-schemas.mjs` | Build-time K8s schema compilation | New script, mirrors `scripts/compile-compose-schema.mjs` pattern. Downloads/reads 18 schemas, compiles to standalone ESM validators. Run during build or as a one-time setup step. |
| `scripts/download-k8s-schemas.mjs` | One-time schema download | Fetches 18 schema files from `raw.githubusercontent.com/yannh/kubernetes-json-schema/master/v1.31.0-standalone-strict/` into `src/lib/tools/k8s-analyzer/schemas/`. Committed to repo so builds are reproducible without network access. |

## Installation

```bash
# No new npm packages needed!
# Only data files and build scripts:

# 1. Download K8s JSON schemas (one-time)
node scripts/download-k8s-schemas.mjs

# 2. Compile schemas to standalone validators (build-time)
node scripts/compile-k8s-schemas.mjs
```

## Sources

- [yannh/kubernetes-json-schema](https://github.com/yannh/kubernetes-json-schema) -- Actively maintained K8s JSON Schema repository, auto-updated daily. Verified v1.31.0-standalone-strict schemas exist. **HIGH confidence.**
- [Ajv Standalone Code Generation](https://ajv.js.org/standalone.html) -- Official Ajv docs confirming multi-schema ESM export support via `standaloneCode(ajv, { name: schemaId })`. **HIGH confidence.**
- [eemeli/yaml Documentation](https://eemeli.org/yaml/#documents) -- Official docs confirming `parseAllDocuments()` returns `Document[]` for multi-document YAML streams. **HIGH confidence.**
- [Kubernetes Pod Security Standards](https://kubernetes.io/docs/concepts/security/pod-security-standards/) -- Official K8s docs with complete Baseline/Restricted control reference (12 Baseline + 6 Restricted checks with exact field paths). **HIGH confidence.**
- [FairwindsOps/polaris](https://github.com/FairwindsOps/polaris) -- Polaris K8s best practices engine, 30+ built-in rules using JSON Schema checks. Used as reference for rule coverage (not as a dependency). **HIGH confidence.**
- [Kubernetes API Conventions](https://github.com/kubernetes/community/blob/master/contributors/devel/sig-architecture/api-conventions.md) -- Official K8s API structure docs confirming `apiVersion` + `kind` detection pattern. **HIGH confidence.**
- [kubernetesjsonschema.dev](https://kubernetesjsonschema.dev/) -- CDN for K8s JSON schemas. Verified URL pattern and availability. **HIGH confidence.**
- Existing codebase: `src/lib/tools/compose-validator/` -- Proven patterns for YAML parsing, Ajv standalone compilation, rule engine, scoring, React Flow graph. **HIGH confidence (first-party code).**

---
*Stack research for: Kubernetes Manifest Analyzer (v1.7)*
*Researched: 2026-02-23*
