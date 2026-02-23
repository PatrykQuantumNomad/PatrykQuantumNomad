# Architecture: Kubernetes Manifest Analyzer

**Domain:** Browser-based Kubernetes manifest linting tool integrated into existing Astro 5 portfolio site
**Researched:** 2026-02-23
**Confidence:** HIGH -- based on direct codebase analysis of existing Compose Validator (v1.6) and Dockerfile Analyzer (v1.4) architecture patterns, verified yaml parseAllDocuments API, confirmed yannh/kubernetes-json-schema availability for v1.31.0, and ajv standalone compilation feasibility

---

## System Overview

```
Existing Site Layer (unchanged core)
  +-- Layout.astro, Header.astro (MODIFY: add nav link), Footer.astro, SEOHead.astro
  +-- Content Collections: blog, languages, dbModels
  +-- OG Image Pipeline: Satori + Sharp (MODIFY: add k8s OG)
  +-- Existing Stores: dockerfileAnalyzerStore.ts, composeValidatorStore.ts (UNCHANGED)

EXISTING Compose Validator Layer (UNCHANGED -- parallel namespace)
  +-- src/lib/tools/compose-validator/  (52 rules, single-doc YAML, single schema)
  +-- src/components/tools/ComposeValidator.tsx, ComposeEditorPanel.tsx, ComposeResultsPanel.tsx
  +-- src/stores/composeValidatorStore.ts
  +-- src/pages/tools/compose-validator/

NEW: Kubernetes Manifest Analyzer Layer
  +-- Core Lib: src/lib/tools/k8s-analyzer/
  |   +-- types.ts                     (K8sLintRule, K8sRuleContext, violations, score types)
  |   +-- parser.ts                    (yaml parseAllDocuments + LineCounter -- multi-doc)
  |   +-- resource-registry.ts         (NEW: builds typed resource index from parsed documents)
  |   +-- schema-validator.ts          (ajv pre-compiled per-resource-type validators)
  |   +-- cross-resource-validator.ts  (NEW: selector matching, reference checking across docs)
  |   +-- engine.ts                    (orchestrates parse -> schema -> lint -> cross-resource)
  |   +-- scorer.ts                    (category-weighted scoring, mirrored from compose)
  |   +-- graph-builder.ts             (NEW: multi-resource-type relationship graph)
  |   +-- graph-data-extractor.ts      (enriches graph nodes with metadata)
  |   +-- badge-generator.ts           (SVG/PNG score badge)
  |   +-- url-state.ts                 (lz-string hash encoding)
  |   +-- use-codemirror-yaml.ts       (CodeMirror 6 hook, reuse pattern from compose)
  |   +-- sample-manifest.ts           (sample multi-doc K8s manifest)
  |   +-- rules/
  |   |   +-- index.ts                 (allK8sRules, allDocumentedK8sRules)
  |   |   +-- related.ts              (same-category rule lookup)
  |   |   +-- schema/                  (KS-S001..S00N: YAML parse, per-type schema violations)
  |   |   +-- security/               (KS-C001..C0NN: pod security, RBAC, image policy)
  |   |   +-- semantic/               (KS-M001..M0NN: cross-resource refs, selector matching)
  |   |   +-- best-practice/          (KS-B001..B0NN: resource limits, probes, labels)
  |   |   +-- style/                  (KS-F001..F0NN: naming, label conventions)
  |   +-- schemas/
  |       +-- validate-k8s-deployment.js   (pre-compiled ajv validator)
  |       +-- validate-k8s-service.js
  |       +-- validate-k8s-pod.js
  |       +-- ... (18 resource-type validators)
  |       +-- schema-registry.ts       (NEW: maps kind/apiVersion to validator function)
  +-- Components: src/components/tools/
  |   +-- K8sAnalyzer.tsx              (root island: editor + results grid)
  |   +-- K8sEditorPanel.tsx           (CodeMirror editor with analyze button)
  |   +-- K8sResultsPanel.tsx          (tabbed: violations, graph, resources)
  |   +-- k8s-results/
  |       +-- K8sCategoryBreakdown.tsx
  |       +-- K8sViolationList.tsx
  |       +-- K8sEmptyState.tsx
  |       +-- K8sShareActions.tsx
  |       +-- K8sResourceList.tsx      (NEW: parsed resource inventory panel)
  |       +-- ResourceGraph.tsx        (lazy-loaded React Flow graph)
  |       +-- ResourceNode.tsx         (custom node component)
  |       +-- ResourceEdge.tsx         (custom edge component)
  |       +-- GraphSkeleton.tsx
  +-- Store: src/stores/k8sAnalyzerStore.ts
  +-- Pages: src/pages/tools/k8s-analyzer/
      +-- index.astro
      +-- rules/[code].astro
```

---

## Key Architectural Differences from Compose Validator

The K8s Manifest Analyzer mirrors the Compose Validator's architecture pattern but introduces three new architectural layers that do not exist in the compose tool. These differences justify separate treatment and careful build ordering.

### Difference 1: Multi-Document YAML Parsing

**Compose Validator:** Single `parseDocument()` call, one AST, one LineCounter.

**K8s Analyzer:** Uses `parseAllDocuments()` which returns `Document[]`. A single `LineCounter` instance tracks positions across ALL documents in the stream (verified in eemeli/yaml documentation -- the `addNewLine` callback accumulates positions cumulatively).

```
Compose: rawText --> parseDocument() --> 1 Document, 1 LineCounter
K8s:     rawText --> parseAllDocuments() --> Document[], 1 shared LineCounter
```

**Implication:** The parser must return an array of parsed resources, each tagged with its document index, kind, apiVersion, name, and namespace. Every downstream consumer (engine, scorer, rules, graph) operates on this array rather than a single document.

### Difference 2: Per-Resource-Type Schema Validation

**Compose Validator:** One schema (compose-spec), one pre-compiled ajv validator (validate-compose.js, 470KB), applied to the entire document.

**K8s Analyzer:** 18 different JSON schemas (one per resource type), each requiring its own pre-compiled ajv validator. The correct validator is selected at runtime based on the `kind` + `apiVersion` fields of each parsed resource.

```
Compose: normalizedJson --> validate(normalizedJson) --> errors
K8s:     for each resource:
           kind + apiVersion --> schemaRegistry.get(kind, apiVersion) --> validator
           resource.json --> validator(resource.json) --> errors
```

**Bundle size concern:** Each K8s standalone schema (yannh/kubernetes-json-schema v1.31.0-standalone-strict) is 150-500KB raw JSON. Pre-compiling 18 schemas via ajv standalone would produce 18 validator modules, each potentially 500KB-2MB of generated JS. Total uncompressed: 10-30MB.

**Mitigation strategy (CRITICAL):**
1. Pre-compile all 18 validators via ajv standalone at build time (same pattern as compose)
2. Dynamic import each validator -- only load when a resource of that type is encountered
3. Group schemas by frequency: common types (Deployment, Service, Pod, ConfigMap) eager-loaded; rare types (ClusterRole, NetworkPolicy) lazy-loaded
4. Vite tree-shakes unused validators in production builds
5. Consider a "core" bundle (~6 types) vs "extended" bundle (~12 more types) split

### Difference 3: Cross-Resource Validation (NEW Architectural Layer)

**Compose Validator:** Semantic rules check references within a single document (e.g., service references network defined in same file). The `ComposeRuleContext` provides `services`, `networks`, `volumes`, `secrets`, `configs` maps extracted from one document.

**K8s Analyzer:** Cross-resource validation must match selectors and references ACROSS multiple independent resources that may span different documents. This requires building a **Resource Registry** -- an intermediate data structure that indexes all parsed resources by kind, name, namespace, and labels.

```
NEW Layer: Resource Registry
  Input:  ParsedResource[] (from parser)
  Output: ResourceRegistry {
    byKind:      Map<string, ParsedResource[]>
    byName:      Map<string, ParsedResource>       // kind/namespace/name key
    byLabel:     Map<string, ParsedResource[]>      // label key=value index
    selectors:   Map<string, LabelSelector>         // resource -> its selector
  }
```

**Cross-resource checks enabled by this registry:**
- Service selector matches Deployment/Pod labels
- Ingress backend references existing Service names
- ConfigMap/Secret volume mounts reference existing ConfigMap/Secret names
- PVC references match PV or StorageClass
- RBAC RoleBinding references existing Role/ClusterRole
- HPA targets existing Deployment/StatefulSet
- NetworkPolicy pod/namespace selectors match existing resources

---

## Component Responsibilities

| Component | Responsibility | Communicates With |
|-----------|---------------|-------------------|
| `parser.ts` | Multi-doc YAML parsing, per-document AST extraction, resource identification by kind/apiVersion | engine.ts (provides ParseResult[]) |
| `resource-registry.ts` | Builds indexed registry of all parsed resources with label/name/namespace lookups | engine.ts (receives ParseResult[], provides ResourceRegistry) |
| `schema-validator.ts` | Routes each resource to its type-specific pre-compiled ajv validator | engine.ts (receives ParseResult + schema-registry) |
| `schemas/schema-registry.ts` | Maps kind+apiVersion to dynamically imported validator function | schema-validator.ts |
| `cross-resource-validator.ts` | Runs cross-resource semantic checks using ResourceRegistry | engine.ts (receives ResourceRegistry) |
| `engine.ts` | Orchestrates full pipeline: parse -> registry -> schema -> lint rules -> cross-resource -> sort | K8sEditorPanel.tsx (called on analyze) |
| `scorer.ts` | Category-weighted scoring with diminishing returns (mirror compose pattern) | K8sEditorPanel.tsx (receives violations) |
| `graph-builder.ts` | Builds multi-type resource relationship graph from ResourceRegistry | ResourceGraph.tsx (lazy-loaded) |
| `graph-data-extractor.ts` | Extracts display metadata (images, ports, labels) for graph nodes | ResourceGraph.tsx |
| `rules/*.ts` | Individual lint rules receiving K8sRuleContext | engine.ts |
| `K8sEditorPanel.tsx` | CodeMirror editor, analyze button, diagnostic dispatch | K8sAnalyzer.tsx (parent), nanostore |
| `K8sResultsPanel.tsx` | Tabbed results display (violations, graph, resource list) | nanostore, ResourceGraph (lazy) |
| `k8sAnalyzerStore.ts` | Nanostore atoms: result, analyzing, stale, editorViewRef | Both panels |

---

## Data Flow

### Primary Analysis Pipeline

```
User pastes/types K8s YAML
        |
        v
[K8sEditorPanel] -- clicks "Analyze" or Cmd+Enter
        |
        v
[parser.ts: parseK8sManifest(rawText)]
  |  Uses yaml.parseAllDocuments(rawText, { lineCounter })
  |  For each Document in stream:
  |    Extract apiVersion, kind, metadata.name, metadata.namespace
  |    Extract JSON via doc.toJSON()
  |    Tag with document index + line offset
  |  Returns: K8sParseResult { documents: ParsedResource[], lineCounter, parseErrors[] }
        |
        v
[resource-registry.ts: buildResourceRegistry(parsedResources)]
  |  Index by kind, by name (kind/ns/name), by labels
  |  Build selector index for Services, NetworkPolicies, etc.
  |  Returns: ResourceRegistry
        |
        v
[engine.ts: runK8sEngine(parseResult, rawText)]
  |
  |-- Phase 1: Collect parse errors (KS-S001)
  |
  |-- Phase 2: Schema validation (per resource type)
  |     For each ParsedResource:
  |       schemaRegistry.getValidator(kind, apiVersion)
  |       Run validator against resource JSON
  |       Map ajv errors to KS-S002..KS-S0NN violations
  |
  |-- Phase 3: Per-resource lint rules
  |     Build K8sRuleContext { resource, doc, lineCounter, registry }
  |     For each rule in allK8sRules:
  |       rule.check(ctx) --> violations
  |
  |-- Phase 4: Cross-resource validation
  |     crossResourceValidator.check(registry, lineCounter)
  |     Selector matching, reference checking, etc.
  |
  |-- Sort all violations by document index, then line, then column
  |-- Returns: K8sEngineResult { violations, rulesRun, rulesPassed }
        |
        v
[scorer.ts: computeK8sScore(violations)]
  |  Same algorithm as compose: category weights, severity deductions,
  |  diminishing returns. Returns K8sScoreResult.
        |
        v
[K8sEditorPanel] dispatches:
  1. CodeMirror diagnostics via setDiagnostics()
  2. Enriched violations + score to k8sAnalyzerStore
        |
        v
[K8sResultsPanel] reads from store, renders:
  - ScoreGauge + CategoryBreakdown
  - ViolationList with click-to-navigate
  - ResourceList tab (inventory of parsed resources)
  - ResourceGraph tab (lazy-loaded React Flow)
```

### Graph Data Flow

```
[ResourceGraph.tsx] receives result + yamlContent
        |
        v
[parser.ts] re-parse to get fresh AST (same pattern as compose)
        |
        v
[graph-builder.ts: buildResourceGraph(registry)]
  |  Node types:
  |    Deployment, StatefulSet, DaemonSet  (workloads -- blue)
  |    Service, Ingress                     (networking -- green)
  |    ConfigMap, Secret                    (config -- amber)
  |    PVC                                  (storage -- purple)
  |    ServiceAccount, Role, RoleBinding    (RBAC -- red)
  |    HPA                                  (scaling -- cyan)
  |    NetworkPolicy                        (security -- orange)
  |
  |  Edge types:
  |    Service --> Deployment/Pod           (selector match)
  |    Ingress --> Service                  (backend reference)
  |    Deployment --> ConfigMap/Secret      (volume mount / envFrom)
  |    Deployment --> PVC                   (volume claim)
  |    Deployment --> ServiceAccount        (serviceAccountName)
  |    RoleBinding --> Role/ClusterRole     (roleRef)
  |    RoleBinding --> ServiceAccount       (subjects)
  |    HPA --> Deployment/StatefulSet       (scaleTargetRef)
  |    NetworkPolicy --> Pods               (podSelector)
  |
  |  Returns: K8sResourceGraph { nodes[], edges[] }
        |
        v
[dagre layout] with cycle-safe handling (same pattern as compose)
        |
        v
[React Flow] renders with custom ResourceNode + ResourceEdge components
```

---

## Recommended Project Structure

```
src/lib/tools/k8s-analyzer/
  +-- types.ts                          # Core type definitions
  +-- parser.ts                         # Multi-doc YAML parser
  +-- resource-registry.ts              # Resource indexing layer
  +-- schema-validator.ts               # Per-type schema validation dispatcher
  +-- cross-resource-validator.ts       # Cross-resource semantic checks
  +-- engine.ts                         # Orchestration pipeline
  +-- scorer.ts                         # Category-weighted scoring
  +-- graph-builder.ts                  # Resource relationship graph builder
  +-- graph-data-extractor.ts           # Node metadata extraction
  +-- badge-generator.ts                # SVG/PNG badge export
  +-- url-state.ts                      # lz-string URL encoding
  +-- use-codemirror-yaml.ts            # CodeMirror 6 hook
  +-- sample-manifest.ts               # Default sample content
  +-- schemas/
  |   +-- schema-registry.ts            # Kind/apiVersion -> validator mapping
  |   +-- validate-k8s-deployment.js    # Pre-compiled ajv (build-time generated)
  |   +-- validate-k8s-service.js
  |   +-- validate-k8s-pod.js
  |   +-- validate-k8s-configmap.js
  |   +-- validate-k8s-secret.js
  |   +-- validate-k8s-ingress.js
  |   +-- validate-k8s-networkpolicy.js
  |   +-- validate-k8s-pvc.js
  |   +-- validate-k8s-statefulset.js
  |   +-- validate-k8s-daemonset.js
  |   +-- validate-k8s-job.js
  |   +-- validate-k8s-cronjob.js
  |   +-- validate-k8s-serviceaccount.js
  |   +-- validate-k8s-clusterrole.js
  |   +-- validate-k8s-clusterrolebinding.js
  |   +-- validate-k8s-role.js
  |   +-- validate-k8s-rolebinding.js
  |   +-- validate-k8s-hpa.js
  +-- rules/
      +-- index.ts
      +-- related.ts
      +-- schema/
      |   +-- index.ts
      |   +-- KS-S001-invalid-yaml-syntax.ts
      |   +-- KS-S002-missing-api-version.ts
      |   +-- KS-S003-missing-kind.ts
      |   +-- KS-S004-unknown-kind.ts
      |   +-- KS-S005-schema-violation.ts     # Generic per-type schema error
      +-- security/
      |   +-- index.ts
      |   +-- KS-C001-privileged-container.ts
      |   +-- KS-C002-run-as-root.ts
      |   +-- KS-C003-missing-security-context.ts
      |   +-- KS-C004-host-network.ts
      |   +-- KS-C005-host-pid.ts
      |   +-- KS-C006-dangerous-capabilities.ts
      |   +-- KS-C007-default-capabilities-not-dropped.ts
      |   +-- KS-C008-no-read-only-root-fs.ts
      |   +-- KS-C009-secrets-in-env-value.ts
      |   +-- KS-C010-image-latest-tag.ts
      |   +-- KS-C011-missing-no-new-privileges.ts
      |   +-- KS-C012-automount-service-account-token.ts
      |   +-- KS-C013-excessive-rbac-permissions.ts
      |   +-- KS-C014-wildcard-rbac-verbs.ts
      +-- semantic/
      |   +-- index.ts
      |   +-- KS-M001-service-selector-no-match.ts       # Cross-resource
      |   +-- KS-M002-ingress-backend-no-service.ts       # Cross-resource
      |   +-- KS-M003-configmap-ref-not-found.ts          # Cross-resource
      |   +-- KS-M004-secret-ref-not-found.ts             # Cross-resource
      |   +-- KS-M005-pvc-not-found.ts                    # Cross-resource
      |   +-- KS-M006-rolebinding-role-not-found.ts       # Cross-resource
      |   +-- KS-M007-hpa-target-not-found.ts             # Cross-resource
      |   +-- KS-M008-duplicate-resource-name.ts
      |   +-- KS-M009-namespace-mismatch.ts
      |   +-- KS-M010-label-selector-mismatch.ts
      +-- best-practice/
      |   +-- index.ts
      |   +-- KS-B001-missing-resource-limits.ts
      |   +-- KS-B002-missing-resource-requests.ts
      |   +-- KS-B003-missing-liveness-probe.ts
      |   +-- KS-B004-missing-readiness-probe.ts
      |   +-- KS-B005-no-image-pull-policy.ts
      |   +-- KS-B006-missing-namespace.ts
      |   +-- KS-B007-no-pod-disruption-budget.ts
      |   +-- KS-B008-replica-count-one.ts
      |   +-- KS-B009-missing-labels.ts
      |   +-- KS-B010-image-tag-not-pinned.ts
      |   +-- KS-B011-no-topology-spread.ts
      |   +-- KS-B012-missing-startup-probe.ts
      +-- style/
          +-- index.ts
          +-- KS-F001-inconsistent-label-naming.ts
          +-- KS-F002-recommended-labels-missing.ts   # app.kubernetes.io/*
          +-- KS-F003-resources-not-alphabetical.ts

scripts/
  +-- compile-k8s-schemas.mjs           # Build-time schema compilation script
```

### Structure Rationale

- **`schemas/` directory:** Isolated from rules because validators are auto-generated build artifacts (not hand-written code). The schema-registry.ts provides the runtime mapping layer.
- **`resource-registry.ts` at lib root:** This is the central architectural novelty. It sits between parsing and all downstream consumers (engine, rules, graph). Every cross-resource check depends on it.
- **Rule prefix `KS-`:** Following the established pattern (DL/PG for Dockerfile, CV for Compose). K8s-Spec = KS.
- **Rule numbering:** Schema rules KS-S0xx, Security KS-C0xx, Semantic KS-M0xx, Best Practice KS-B0xx, Style KS-F0xx. Mirrors compose conventions.

---

## Architectural Patterns

### Pattern 1: Multi-Document Parse with Unified LineCounter

**What:** Parse all YAML documents in a stream using a single `LineCounter` that tracks positions across the entire input. Tag each parsed resource with its document index and absolute line offset.

**When:** Always -- this is the foundation of the entire pipeline.

**Trade-offs:** Simpler than maintaining per-document line counters. The yaml library supports this natively via `parseAllDocuments(str, { lineCounter })`. All position calculations remain absolute offsets into the raw text, which CodeMirror expects.

**Example:**
```typescript
import { parseAllDocuments, LineCounter } from 'yaml';
import type { Document } from 'yaml';

interface ParsedResource {
  docIndex: number;
  doc: Document;
  kind: string;
  apiVersion: string;
  name: string;
  namespace: string;
  json: Record<string, unknown> | null;
}

interface K8sParseResult {
  resources: ParsedResource[];
  lineCounter: LineCounter;
  parseErrors: K8sRuleViolation[];
  rawDocuments: Document[];
}

function parseK8sManifest(rawText: string): K8sParseResult {
  const lineCounter = new LineCounter();
  const documents = parseAllDocuments(rawText, {
    lineCounter,
    prettyErrors: true,
    uniqueKeys: false,
  });

  const resources: ParsedResource[] = [];
  const parseErrors: K8sRuleViolation[] = [];

  for (let i = 0; i < documents.length; i++) {
    const doc = documents[i];

    // Collect parse errors as KS-S001
    for (const err of doc.errors) {
      parseErrors.push(mapParseError(err, lineCounter, i));
    }

    if (doc.errors.length > 0) continue;

    const json = doc.toJSON();
    if (!json || typeof json !== 'object') continue;

    resources.push({
      docIndex: i,
      doc,
      kind: json.kind ?? '',
      apiVersion: json.apiVersion ?? '',
      name: json.metadata?.name ?? '',
      namespace: json.metadata?.namespace ?? 'default',
      json,
    });
  }

  return { resources, lineCounter, parseErrors, rawDocuments: documents };
}
```

### Pattern 2: Schema Registry with Dynamic Import

**What:** A registry that maps `kind` + `apiVersion` to a dynamically imported pre-compiled ajv validator. Validators are loaded on-demand to control bundle size.

**When:** During schema validation phase of the engine pipeline.

**Trade-offs:** Dynamic import adds a microtask delay on first use of each resource type, but keeps the initial bundle small. Validators are cached after first import, so subsequent validations of the same type are synchronous.

**Example:**
```typescript
type ValidatorFn = (data: unknown) => boolean;

interface SchemaValidator {
  validate: ValidatorFn;
  errors: unknown[] | null;
}

const validatorCache = new Map<string, SchemaValidator>();

const SCHEMA_MAP: Record<string, () => Promise<{ validate: ValidatorFn }>> = {
  'Deployment/apps/v1': () => import('./validate-k8s-deployment.js'),
  'Service/v1':         () => import('./validate-k8s-service.js'),
  'Pod/v1':             () => import('./validate-k8s-pod.js'),
  'ConfigMap/v1':       () => import('./validate-k8s-configmap.js'),
  // ... 14 more
};

export async function getValidator(
  kind: string,
  apiVersion: string
): Promise<SchemaValidator | null> {
  const key = `${kind}/${apiVersion}`;
  if (validatorCache.has(key)) return validatorCache.get(key)!;

  const loader = SCHEMA_MAP[key];
  if (!loader) return null;

  const mod = await loader();
  const validator = mod.validate as unknown as SchemaValidator;
  validatorCache.set(key, validator);
  return validator;
}
```

### Pattern 3: Resource Registry for Cross-Resource Validation

**What:** An intermediate data structure that indexes all parsed resources by multiple dimensions (kind, name, namespace, labels), enabling efficient cross-resource lookups.

**When:** Built once after parsing, consumed by cross-resource rules and graph builder.

**Trade-offs:** Adds memory overhead proportional to resource count. For typical K8s manifests (5-50 resources), this is negligible. The alternative (O(n^2) scanning for each cross-resource check) is worse for both performance and code clarity.

**Example:**
```typescript
interface ResourceRegistry {
  // All resources indexed by kind
  byKind: Map<string, ParsedResource[]>;

  // Unique key: kind/namespace/name
  byKey: Map<string, ParsedResource>;

  // Label index: "key=value" -> resources with that label
  byLabel: Map<string, Set<ParsedResource>>;

  // Quick lookups
  getByKindAndName(kind: string, name: string, namespace?: string): ParsedResource | undefined;
  getByLabels(labels: Record<string, string>): ParsedResource[];
  matchSelector(selector: Record<string, string>, targetKind?: string): ParsedResource[];
}

function buildResourceRegistry(resources: ParsedResource[]): ResourceRegistry {
  const byKind = new Map<string, ParsedResource[]>();
  const byKey = new Map<string, ParsedResource>();
  const byLabel = new Map<string, Set<ParsedResource>>();

  for (const resource of resources) {
    // Index by kind
    const kindList = byKind.get(resource.kind) ?? [];
    kindList.push(resource);
    byKind.set(resource.kind, kindList);

    // Index by unique key
    const key = `${resource.kind}/${resource.namespace}/${resource.name}`;
    byKey.set(key, resource);

    // Index by labels
    const labels = resource.json?.metadata?.labels as Record<string, string> | undefined;
    if (labels) {
      for (const [k, v] of Object.entries(labels)) {
        const labelKey = `${k}=${v}`;
        const set = byLabel.get(labelKey) ?? new Set();
        set.add(resource);
        byLabel.set(labelKey, set);
      }
    }
  }

  return {
    byKind,
    byKey,
    byLabel,
    getByKindAndName(kind, name, namespace = 'default') {
      return byKey.get(`${kind}/${namespace}/${name}`);
    },
    getByLabels(labels) {
      // Intersection: all resources matching ALL labels
      let result: Set<ParsedResource> | null = null;
      for (const [k, v] of Object.entries(labels)) {
        const matches = byLabel.get(`${k}=${v}`);
        if (!matches) return [];
        result = result
          ? new Set([...result].filter(r => matches.has(r)))
          : new Set(matches);
      }
      return result ? [...result] : [];
    },
    matchSelector(selector, targetKind) {
      const matches = this.getByLabels(selector);
      return targetKind
        ? matches.filter(r => r.kind === targetKind)
        : matches;
    },
  };
}
```

### Pattern 4: Extended Rule Context

**What:** The `K8sRuleContext` extends the compose pattern by providing both per-resource context AND the full registry for cross-resource rules. Rules that only need the current resource ignore the registry. Rules that need cross-resource checks use it.

**When:** All rule execution.

**Example:**
```typescript
interface K8sRuleContext {
  // Current resource being checked
  resource: ParsedResource;
  doc: Document;
  rawText: string;
  lineCounter: LineCounter;

  // Full registry for cross-resource rules
  registry: ResourceRegistry;

  // All resources (convenience)
  allResources: ParsedResource[];
}

// Per-resource rule (only needs current resource)
const KSB001: K8sLintRule = {
  id: 'KS-B001',
  // ...
  check(ctx: K8sRuleContext): K8sRuleViolation[] {
    // Only accesses ctx.resource, ctx.doc, ctx.lineCounter
  },
};

// Cross-resource rule (needs registry)
const KSM001: K8sLintRule = {
  id: 'KS-M001',
  // ...
  check(ctx: K8sRuleContext): K8sRuleViolation[] {
    // Uses ctx.registry.matchSelector() to find matching pods
  },
};
```

---

## Anti-Patterns to Avoid

### Anti-Pattern 1: Loading All Schemas Eagerly

**What people do:** Import all 18 pre-compiled validators at the top of schema-validator.ts.
**Why it is wrong:** Each validator can be 500KB-2MB compiled. Loading 18 up-front adds 10-30MB to the initial bundle, destroying load performance. Most manifests only use 3-5 resource types.
**Do this instead:** Use the Schema Registry pattern with dynamic `import()`. Only load validators for resource types actually present in the user's manifest.

### Anti-Pattern 2: Per-Document LineCounters

**What people do:** Create a separate LineCounter for each document in a multi-doc stream.
**Why it is wrong:** CodeMirror operates on a single text buffer with absolute positions. Separate LineCounters would require offset translation for every diagnostic, creating bugs and complexity.
**Do this instead:** Use one LineCounter for the entire stream. The `parseAllDocuments` function supports this natively -- positions are absolute offsets into the raw text.

### Anti-Pattern 3: Inline Cross-Resource Checks in Individual Rules

**What people do:** Each rule that needs cross-resource validation builds its own ad-hoc lookup (scanning all resources to find matches).
**Why it is wrong:** O(rules * resources) scanning. Duplicated logic. Inconsistent matching behavior between rules. Impossible to test in isolation.
**Do this instead:** Build the ResourceRegistry once, pass it in context. Rules call `registry.matchSelector()` or `registry.getByKindAndName()` -- consistent, tested, O(1) lookups.

### Anti-Pattern 4: Treating Multi-Doc YAML as String Concatenation

**What people do:** Split raw text on `---` using regex, parse each chunk separately.
**Why it is wrong:** `---` can appear inside YAML strings or comments. The yaml library's `parseAllDocuments` handles this correctly at the parser level. Regex splitting also loses the crucial line offset tracking.
**Do this instead:** Always use `parseAllDocuments()` from the yaml library. It handles document boundaries correctly per the YAML spec.

### Anti-Pattern 5: Single Schema for All Resource Types

**What people do:** Try to create one giant K8s "meta-schema" that validates any resource type.
**Why it is wrong:** K8s schemas are per-resource-type by design. A meta-schema with `oneOf` over 18+ schemas would be enormous, slow, and produce unhelpful error messages ("didn't match any of 18 schemas").
**Do this instead:** Route to per-type validators based on kind/apiVersion. Error messages are specific to the resource type.

---

## Graph Data Model

The K8s resource graph is fundamentally more complex than the compose dependency graph. Compose has one node type (service) and one edge type (depends_on). K8s has multiple node types and multiple edge types.

### Node Types

| Type Category | Resource Kinds | Color | Shape |
|--------------|----------------|-------|-------|
| Workload | Deployment, StatefulSet, DaemonSet, Job, CronJob, Pod | Blue (#3b82f6) | Rectangle |
| Networking | Service, Ingress, NetworkPolicy | Green (#10b981) | Rectangle with icon |
| Configuration | ConfigMap, Secret | Amber (#f59e0b) | Rounded rectangle |
| Storage | PVC | Purple (#8b5cf6) | Rounded rectangle |
| RBAC | ServiceAccount, Role, ClusterRole, RoleBinding, ClusterRoleBinding | Red (#ef4444) | Diamond |
| Scaling | HPA | Cyan (#06b6d4) | Rounded rectangle |

### Edge Types

| Edge | Source Kind | Target Kind | Detection Method |
|------|-----------|------------|------------------|
| selector-match | Service | Deployment/Pod | `spec.selector.matchLabels` matches target labels |
| ingress-backend | Ingress | Service | `spec.rules[].http.paths[].backend.service.name` |
| config-mount | Workload | ConfigMap | `spec.template.spec.volumes[].configMap.name` |
| secret-mount | Workload | Secret | `spec.template.spec.volumes[].secret.secretName` |
| env-from-config | Workload | ConfigMap | `spec.template.spec.containers[].envFrom[].configMapRef.name` |
| env-from-secret | Workload | Secret | `spec.template.spec.containers[].envFrom[].secretRef.name` |
| volume-claim | Workload | PVC | `spec.template.spec.volumes[].persistentVolumeClaim.claimName` |
| service-account | Workload | ServiceAccount | `spec.template.spec.serviceAccountName` |
| role-binding | RoleBinding | Role/ClusterRole | `roleRef.name` |
| role-subject | RoleBinding | ServiceAccount | `subjects[].name` where `kind=ServiceAccount` |
| scale-target | HPA | Deployment/StatefulSet | `spec.scaleTargetRef.name` |
| network-policy | NetworkPolicy | Pods | `spec.podSelector.matchLabels` |

### Layout Strategy

Use dagre with `rankdir: 'LR'` (left-to-right) for K8s graphs. K8s resource flows typically read left-to-right: Ingress -> Service -> Deployment -> ConfigMap/Secret. This differs from compose which uses `TB` (top-to-bottom) for simple dependency chains.

For graphs with > 20 nodes, consider ELK.js as a dagre alternative (mentioned in React Flow docs as better for complex layouts). However, start with dagre for consistency with compose, and only switch if layout quality is poor.

---

## Scaling Considerations

| Concern | 1-10 resources | 10-50 resources | 50-200 resources |
|---------|---------------|-----------------|-------------------|
| Parse time | < 10ms | < 50ms | < 200ms |
| Schema validation | < 20ms (dynamic import overhead on first type) | < 100ms | < 500ms (consider Web Worker) |
| Cross-resource checks | < 5ms | < 20ms | < 100ms |
| Graph layout | < 50ms | < 200ms (dagre) | Consider ELK.js or paginate |
| Bundle size | Load ~3 validators | Load ~6-8 validators | Load most validators |
| URL state | Fits in 2000 chars | May exceed URL limit | Definitely exceeds; warn user |

**First bottleneck:** Schema validation with dynamic import. First load of a validator type adds ~50-100ms for the import. Mitigation: preload common types (Deployment, Service, Pod) after first analysis.

**Second bottleneck:** Graph layout with many nodes. Dagre handles ~50 nodes well but degrades beyond that. Mitigation: for > 50 nodes, show a "simplified view" grouping related resources.

---

## Build Order Dependencies

The architecture has clear dependency layers that dictate build order:

```
Layer 0 (no dependencies):
  types.ts, sample-manifest.ts, url-state.ts, badge-generator.ts

Layer 1 (depends on types):
  parser.ts (depends on types, yaml library)
  schemas/compile script + all validate-k8s-*.js (build-time only, depends on ajv)
  schemas/schema-registry.ts (depends on types)
  scorer.ts (depends on types)

Layer 2 (depends on parser):
  resource-registry.ts (depends on types, parser output types)

Layer 3 (depends on registry):
  schema-validator.ts (depends on parser, schema-registry)
  cross-resource-validator.ts (depends on types, resource-registry)
  rules/* (depend on types, some on resource-registry)
  graph-builder.ts (depends on resource-registry)

Layer 4 (depends on all lib):
  engine.ts (depends on parser, resource-registry, schema-validator,
             cross-resource-validator, rules, scorer)
  graph-data-extractor.ts (depends on resource-registry)

Layer 5 (depends on engine + lib):
  use-codemirror-yaml.ts (depends on store)
  k8sAnalyzerStore.ts (depends on types)

Layer 6 (depends on everything):
  K8sEditorPanel.tsx (depends on engine, store, codemirror hook)
  K8sResultsPanel.tsx (depends on store, graph components)
  K8sAnalyzer.tsx (depends on both panels)
  Pages: index.astro, rules/[code].astro
```

**Suggested build phases based on dependencies:**

1. **Foundation:** types.ts + parser.ts + sample-manifest.ts (enables manual testing of multi-doc parsing)
2. **Schema Infrastructure:** compile script + schema-registry + schema-validator (enables per-type validation)
3. **Resource Registry:** resource-registry.ts (unlocks cross-resource features)
4. **Core Rules:** security + best-practice rules (per-resource, no cross-resource dependency)
5. **Cross-Resource:** cross-resource-validator + semantic rules (depends on registry)
6. **Engine + Scorer:** engine.ts + scorer.ts (orchestration layer)
7. **UI Shell:** store + editor panel + results panel + Astro pages (functional tool)
8. **Graph:** graph-builder + graph components + React Flow (visual layer, can be deferred)
9. **Polish:** badge export, URL state, Claude Skill, rule documentation pages, SEO

---

## Integration Points

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| Parser -> Engine | Function call returning K8sParseResult | Synchronous, pure function |
| Engine -> Schema Validator | Async (dynamic import of validators) | Engine must be async or handle promises |
| Engine -> Rules | Synchronous iteration with K8sRuleContext | Same pattern as compose |
| Engine -> Cross-Resource Validator | Synchronous using pre-built registry | Registry built before this phase |
| EditorPanel -> Store | Nanostore atom.set() | Same pattern as compose |
| ResultsPanel -> Store | useStore() hook | Same pattern as compose |
| ResultsPanel -> ResourceGraph | React.lazy() dynamic import | Same pattern as compose DependencyGraph |

### Key Difference from Compose: Async Engine

The compose engine is fully synchronous (one schema, pre-compiled, always loaded). The K8s engine must be **async** because schema validators are dynamically imported. This changes the engine interface:

```typescript
// Compose (sync)
export function runComposeEngine(parseResult, rawText): ComposeEngineResult

// K8s (async -- dynamic schema import)
export async function runK8sEngine(parseResult, rawText): Promise<K8sEngineResult>
```

The EditorPanel's analyze function must handle this Promise (already fine since it uses a ref-based callback pattern with try/catch).

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| yannh/kubernetes-json-schema (GitHub) | Build-time only: download schemas, compile with ajv | No runtime dependency on external services |
| CodeMirror 6 | Same as compose: basicSetup + yaml() + lintGutter() | Reuse editor-theme.ts from dockerfile-analyzer |
| React Flow (@xyflow/react) | Lazy-loaded graph component | Same as compose pattern |
| dagre (@dagrejs/dagre) | Graph layout algorithm | Same as compose pattern |
| lz-string | URL state compression | Same as compose pattern |

---

## Sources

- **eemeli/yaml parseAllDocuments:** [github.com/eemeli/yaml](https://github.com/eemeli/yaml) -- Verified multi-doc support with shared LineCounter (HIGH confidence)
- **yannh/kubernetes-json-schema:** [github.com/yannh/kubernetes-json-schema](https://github.com/yannh/kubernetes-json-schema) -- v1.31.0-standalone-strict schemas confirmed available for all 18 target resource types (HIGH confidence)
- **ajv standalone compilation:** [ajv.js.org/standalone.html](https://ajv.js.org/standalone.html) -- Pre-compilation pattern verified, same approach as existing compose-spec compilation (HIGH confidence)
- **React Flow + dagre:** [reactflow.dev/examples/layout/dagre](https://reactflow.dev/examples/layout/dagre) -- Same pattern already proven in compose DependencyGraph (HIGH confidence)
- **KubeLinter checks:** [github.com/stackrox/kube-linter](https://github.com/stackrox/kube-linter) -- Reference for rule categories and cross-resource checks (MEDIUM confidence)
- **Existing codebase:** Direct analysis of compose-validator/ and dockerfile-analyzer/ directories (HIGH confidence)
- **Kubernetes label selectors:** [kubernetes.io labels and selectors docs](https://kubernetes.io/docs/concepts/overview/working-with-objects/labels/) -- matchLabels / matchExpressions semantics (HIGH confidence)

---
*Architecture research for: Kubernetes Manifest Analyzer (v1.7)*
*Researched: 2026-02-23*
