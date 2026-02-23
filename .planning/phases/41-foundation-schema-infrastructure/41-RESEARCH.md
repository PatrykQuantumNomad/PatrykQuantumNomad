# Phase 41: Foundation & Schema Infrastructure - Research

**Researched:** 2026-02-23
**Domain:** Multi-document YAML parsing, Kubernetes JSON Schema validation, ajv standalone compilation
**Confidence:** HIGH

## Summary

Phase 41 builds the foundational engine for the K8s Manifest Analyzer: a multi-document YAML parser with source position tracking, a GVK (Group/Version/Kind) registry for 18 supported resource types, per-resource-type JSON Schema validation compiled via ajv standalone, and a resource registry for downstream cross-resource lookups.

The codebase has a well-established pattern from the Docker Compose Validator (v1.6): pure TypeScript engine with types/parser/schema-validator/scorer/rules architecture, ajv standalone pre-compiled schemas, `yaml` 2.x library for AST parsing with `LineCounter`, and nanostore atoms for React state. Phase 41 follows the same patterns but with key differences: multi-document parsing via `parseAllDocuments` (not `parseDocument`), multiple per-resource-type schemas (not one monolithic compose-spec schema), and an async engine (dynamic imports for lazy-loaded validators).

The critical risk is bundle size: the 6 workload schemas (Deployment, Pod, StatefulSet, DaemonSet, Job, CronJob) each contain ~600-780KB of inline JSON because they duplicate PodSpec. The decision to compile all 18 schemas into a single ajv standalone module with shared definitions is correct -- ajv will deduplicate PodSpec, ObjectMeta, and other shared types. Using the `v1.31.0-local` schema variant (which uses `$ref` to `_definitions.json`) is essential for enabling this deduplication. The Compose validator's single schema compiled to 63KB gzipped; 18 K8s schemas with heavy shared definitions should fit within 200KB gzipped with this approach.

**Primary recommendation:** Follow the compose-validator architecture exactly, but use `parseAllDocuments` for multi-doc support, compile all 18 K8s schemas into one standalone ESM module from `v1.31.0-local` refs, and make the engine async for dynamic schema imports.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| PARSE-01 | Multi-document YAML parsing with `---` separators and source range preservation | `yaml` 2.x `parseAllDocuments()` with shared `LineCounter` -- verified working with line tracking per document relative to full input |
| PARSE-02 | Per-document apiVersion/kind detection | Extract from each `Document.toJSON()` result, access via AST `isMap`/`isPair`/`isScalar` for line numbers |
| PARSE-03 | GVK registry maps valid apiVersion/kind to 18 resource types | Static TypeScript map of GVK tuples to resource type identifiers |
| PARSE-04 | Resource Registry indexes by kind, name, namespace, labels | In-memory `Map<string, ParsedResource[]>` with secondary indexes |
| PARSE-05 | Resource summary with counts per type | Derived from Resource Registry `Map.size` per kind |
| PARSE-06 | YAML syntax errors with accurate line numbers | `Document.errors` array with `pos` offsets resolved via shared `LineCounter.linePos()` |
| SCHEMA-01 | Per-resource-type JSON Schema validation for 18 K8s 1.31 types | Pre-compiled ajv standalone from `yannh/kubernetes-json-schema` v1.31.0-local schemas |
| SCHEMA-02 | Pre-compiled validators, lazy-loaded per resource type | Single compiled ESM module with named exports per resource type, dynamically imported |
| SCHEMA-03 | KA-S001: Invalid YAML syntax (error) | Mapped from `Document.errors` -- same pattern as CV-S001 |
| SCHEMA-04 | KA-S002: Missing apiVersion field (error) | Check `doc.toJSON()?.apiVersion` presence |
| SCHEMA-05 | KA-S003: Missing kind field (error) | Check `doc.toJSON()?.kind` presence |
| SCHEMA-06 | KA-S004: Unknown apiVersion/kind combination (error) | GVK registry lookup failure |
| SCHEMA-07 | KA-S005: Schema validation failure per resource type (error) | ajv `ErrorObject[]` mapped to violations with AST-resolved line numbers |
| SCHEMA-08 | KA-S006: Deprecated API version (warning) | Static deprecated-versions map checked before schema validation |
| SCHEMA-09 | KA-S007: Missing metadata.name (error) | Check `doc.toJSON()?.metadata?.name` presence |
| SCHEMA-10 | KA-S008: Invalid metadata.name format (warning) | RFC 1123 DNS subdomain regex validation |
| SCHEMA-11 | KA-S009: Invalid label key/value format (warning) | K8s qualified name regex for keys, DNS label regex for values |
| SCHEMA-12 | KA-S010: Empty document in multi-doc YAML (info) | `doc.toJSON()` returns null/undefined or empty object |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| yaml | 2.8.2 | Multi-document YAML parsing with AST and source positions | Already in project; `parseAllDocuments` handles `---` separators with `LineCounter` for line tracking |
| ajv | 8.18.0 | JSON Schema validation (build-time compilation) | Already in project; standalone code generation eliminates runtime `new Function()` |
| ajv-formats | 3.0.1 | JSON Schema format validators (date-time, uri, etc.) | Already in project; K8s schemas use format keywords |
| nanostores | 1.1.0 | Atom-based state management for analysis results | Already in project; proven pattern from compose-validator |
| lz-string | 1.5.0 | URL state compression for shareable analysis links | Already in project; `#k8s=` prefix for K8s analyzer |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @nanostores/react | 1.0.0 | React bindings for nanostores | Already in project; used by React component layer (Phase 45) |
| typescript | 5.9.3 | Type safety for engine, types, rules | Already in project |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| yaml (eemeli) | js-yaml | js-yaml `loadAll` lacks AST/range info needed for line numbers; yaml 2.x already in project |
| ajv standalone | Runtime ajv compilation | Runtime compilation uses `new Function()` (CSP violation) and bloats bundle with full ajv |
| yannh/kubernetes-json-schema | instrumenta/kubernetes-json-schema | yannh is actively maintained, instrumenta is archived since 2020 |

**Installation:**
```bash
# No new npm installs needed -- all dependencies already in package.json
# Build-time only: download K8s schemas for compilation script
```

## Architecture Patterns

### Recommended Project Structure
```
src/lib/tools/k8s-analyzer/
  types.ts                    # All TypeScript interfaces (K8sSeverity, K8sCategory, K8sRuleViolation, etc.)
  parser.ts                   # parseK8sYaml() - multi-doc YAML parsing with parseAllDocuments
  gvk-registry.ts             # GVK_REGISTRY map + isValidGvk() + getResourceType() + deprecated versions
  resource-registry.ts        # ResourceRegistry class - indexes parsed resources by kind/name/namespace/labels
  schema-validator.ts         # validateResource() - loads compiled validators, maps ajv errors to violations
  engine.ts                   # runK8sEngine() - async orchestrator: parse -> validate -> collect violations
  diagnostic-rules.ts         # KA-S001 through KA-S010 rule metadata (SchemaRuleMetadata, no check())
  sample-manifest.ts          # Pre-loaded multi-doc K8s YAML with deliberate issues
  url-state.ts                # #k8s= hash prefix for shareable links
  validate-k8s.js             # AUTO-GENERATED: pre-compiled ajv standalone module (18 named exports)
scripts/
  compile-k8s-schemas.mjs     # Build script: downloads schemas, compiles to standalone ESM
  schemas/                    # Downloaded K8s JSON schemas (gitignored or committed)
    _definitions.json
    deployment-apps-v1.json
    ... (17 more)
```

### Pattern 1: Async Engine (differs from compose-validator)
**What:** The engine is async because schema validators are dynamically imported for bundle splitting.
**When to use:** Always -- this is the Phase 41 engine pattern.
**Example:**
```typescript
// Source: Adapted from compose-validator engine.ts pattern
export interface K8sEngineResult {
  violations: K8sRuleViolation[];
  resources: ParsedResource[];
  resourceSummary: Map<string, number>;
  rulesRun: number;
}

export async function runK8sEngine(rawText: string): Promise<K8sEngineResult> {
  // 1. Parse multi-document YAML
  const parseResult = parseK8sYaml(rawText);
  const violations: K8sRuleViolation[] = [...parseResult.parseErrors];

  // 2. For each parsed document, run pre-validation checks then schema validation
  for (const doc of parseResult.documents) {
    // KA-S010: Empty document
    if (doc.isEmpty) {
      violations.push({ ruleId: 'KA-S010', ... });
      continue;
    }
    // KA-S002/S003: Missing apiVersion/kind
    if (!doc.apiVersion) { violations.push({ ruleId: 'KA-S002', ... }); continue; }
    if (!doc.kind) { violations.push({ ruleId: 'KA-S003', ... }); continue; }
    // KA-S004: Unknown GVK
    const resourceType = getResourceType(doc.apiVersion, doc.kind);
    if (!resourceType) { violations.push({ ruleId: 'KA-S004', ... }); continue; }
    // KA-S006: Deprecated API version
    const deprecation = getDeprecation(doc.apiVersion, doc.kind);
    if (deprecation) { violations.push({ ruleId: 'KA-S006', ... }); }
    // KA-S005: Schema validation
    const schemaViolations = await validateResource(resourceType, doc);
    violations.push(...schemaViolations);
    // KA-S007/S008/S009: metadata checks
    violations.push(...checkMetadata(doc));
  }

  // 3. Build resource registry for downstream phases
  const registry = buildResourceRegistry(parseResult.documents);

  return { violations, resources: parseResult.documents, ... };
}
```

### Pattern 2: Multi-Document Parser with Shared LineCounter
**What:** Single `LineCounter` instance shared across all documents for consistent line numbering relative to full input.
**When to use:** PARSE-01 through PARSE-06.
**Example:**
```typescript
// Source: yaml 2.x docs + verified behavior
import { parseAllDocuments, LineCounter, isMap, isPair, isScalar } from 'yaml';

export interface ParsedDocument {
  doc: Document;         // yaml AST Document
  json: Record<string, unknown> | null;
  apiVersion: string | null;
  kind: string | null;
  name: string | null;
  namespace: string | null;
  labels: Record<string, string>;
  startLine: number;     // 1-based line in full input
  isEmpty: boolean;
}

export interface K8sParseResult {
  documents: ParsedDocument[];
  lineCounter: LineCounter;
  parseErrors: K8sRuleViolation[];
}

export function parseK8sYaml(rawText: string): K8sParseResult {
  const lineCounter = new LineCounter();
  const docs = parseAllDocuments(rawText, { lineCounter });
  const parseErrors: K8sRuleViolation[] = [];
  const documents: ParsedDocument[] = [];

  for (const doc of docs) {
    // Map YAML syntax errors to KA-S001
    for (const err of doc.errors) {
      const pos = err.pos ? lineCounter.linePos(err.pos[0]) : { line: 1, col: 1 };
      parseErrors.push({
        ruleId: 'KA-S001',
        line: pos.line,
        column: pos.col,
        message: err.message,
      });
    }

    const json = safeToJSON(doc);
    const startLine = doc.contents?.range
      ? lineCounter.linePos(doc.contents.range[0]).line
      : 1;

    documents.push({
      doc,
      json,
      apiVersion: json?.apiVersion as string | null ?? null,
      kind: json?.kind as string | null ?? null,
      name: (json?.metadata as any)?.name ?? null,
      namespace: (json?.metadata as any)?.namespace ?? null,
      labels: (json?.metadata as any)?.labels ?? {},
      startLine,
      isEmpty: json === null || (typeof json === 'object' && Object.keys(json).length === 0),
    });
  }

  return { documents, lineCounter, parseErrors };
}
```

### Pattern 3: GVK Registry (Static Map)
**What:** Maps valid apiVersion/kind combinations to resource type identifiers used for schema lookup.
**When to use:** PARSE-03, SCHEMA-06.
**Example:**
```typescript
export interface GvkEntry {
  apiVersion: string;
  kind: string;
  resourceType: string;  // matches schema export name
  schemaFile: string;     // file in yannh repo
}

export const GVK_REGISTRY: GvkEntry[] = [
  { apiVersion: 'v1', kind: 'ConfigMap', resourceType: 'configmap', schemaFile: 'configmap-v1.json' },
  { apiVersion: 'v1', kind: 'Secret', resourceType: 'secret', schemaFile: 'secret-v1.json' },
  { apiVersion: 'v1', kind: 'Service', resourceType: 'service', schemaFile: 'service-v1.json' },
  { apiVersion: 'v1', kind: 'ServiceAccount', resourceType: 'serviceaccount', schemaFile: 'serviceaccount-v1.json' },
  { apiVersion: 'v1', kind: 'Namespace', resourceType: 'namespace', schemaFile: 'namespace-v1.json' },
  { apiVersion: 'v1', kind: 'Pod', resourceType: 'pod', schemaFile: 'pod-v1.json' },
  { apiVersion: 'v1', kind: 'PersistentVolumeClaim', resourceType: 'persistentvolumeclaim', schemaFile: 'persistentvolumeclaim-v1.json' },
  { apiVersion: 'apps/v1', kind: 'Deployment', resourceType: 'deployment', schemaFile: 'deployment-apps-v1.json' },
  { apiVersion: 'apps/v1', kind: 'StatefulSet', resourceType: 'statefulset', schemaFile: 'statefulset-apps-v1.json' },
  { apiVersion: 'apps/v1', kind: 'DaemonSet', resourceType: 'daemonset', schemaFile: 'daemonset-apps-v1.json' },
  { apiVersion: 'batch/v1', kind: 'Job', resourceType: 'job', schemaFile: 'job-batch-v1.json' },
  { apiVersion: 'batch/v1', kind: 'CronJob', resourceType: 'cronjob', schemaFile: 'cronjob-batch-v1.json' },
  { apiVersion: 'networking.k8s.io/v1', kind: 'Ingress', resourceType: 'ingress', schemaFile: 'ingress-networking-v1.json' },
  { apiVersion: 'networking.k8s.io/v1', kind: 'NetworkPolicy', resourceType: 'networkpolicy', schemaFile: 'networkpolicy-networking-v1.json' },
  { apiVersion: 'autoscaling/v2', kind: 'HorizontalPodAutoscaler', resourceType: 'horizontalpodautoscaler', schemaFile: 'horizontalpodautoscaler-autoscaling-v2.json' },
  { apiVersion: 'rbac.authorization.k8s.io/v1', kind: 'Role', resourceType: 'role', schemaFile: 'role-rbac-v1.json' },
  { apiVersion: 'rbac.authorization.k8s.io/v1', kind: 'ClusterRole', resourceType: 'clusterrole', schemaFile: 'clusterrole-rbac-v1.json' },
  { apiVersion: 'rbac.authorization.k8s.io/v1', kind: 'RoleBinding', resourceType: 'rolebinding', schemaFile: 'rolebinding-rbac-v1.json' },
  { apiVersion: 'rbac.authorization.k8s.io/v1', kind: 'ClusterRoleBinding', resourceType: 'clusterrolebinding', schemaFile: 'clusterrolebinding-rbac-v1.json' },
];
```

### Pattern 4: Deprecated API Versions Map
**What:** Static lookup of deprecated apiVersion/kind combinations with migration guidance.
**When to use:** SCHEMA-08 (KA-S006).
**Example:**
```typescript
export interface DeprecatedApiVersion {
  apiVersion: string;
  kind: string;
  removedIn: string;
  replacement: string;
  message: string;
}

export const DEPRECATED_API_VERSIONS: DeprecatedApiVersion[] = [
  // Removed in K8s 1.16
  { apiVersion: 'extensions/v1beta1', kind: 'Deployment', removedIn: '1.16', replacement: 'apps/v1', message: 'extensions/v1beta1 Deployment was removed in K8s 1.16. Use apps/v1 instead.' },
  { apiVersion: 'extensions/v1beta1', kind: 'DaemonSet', removedIn: '1.16', replacement: 'apps/v1', message: 'extensions/v1beta1 DaemonSet was removed in K8s 1.16. Use apps/v1 instead.' },
  { apiVersion: 'extensions/v1beta1', kind: 'ReplicaSet', removedIn: '1.16', replacement: 'apps/v1', message: 'extensions/v1beta1 ReplicaSet was removed in K8s 1.16. Use apps/v1 instead.' },
  { apiVersion: 'apps/v1beta1', kind: 'Deployment', removedIn: '1.16', replacement: 'apps/v1', message: 'apps/v1beta1 Deployment was removed in K8s 1.16. Use apps/v1 instead.' },
  { apiVersion: 'apps/v1beta2', kind: 'Deployment', removedIn: '1.16', replacement: 'apps/v1', message: 'apps/v1beta2 Deployment was removed in K8s 1.16. Use apps/v1 instead.' },
  { apiVersion: 'apps/v1beta1', kind: 'StatefulSet', removedIn: '1.16', replacement: 'apps/v1', message: 'apps/v1beta1 StatefulSet was removed in K8s 1.16. Use apps/v1 instead.' },
  { apiVersion: 'apps/v1beta2', kind: 'StatefulSet', removedIn: '1.16', replacement: 'apps/v1', message: 'apps/v1beta2 StatefulSet was removed in K8s 1.16. Use apps/v1 instead.' },
  { apiVersion: 'apps/v1beta2', kind: 'DaemonSet', removedIn: '1.16', replacement: 'apps/v1', message: 'apps/v1beta2 DaemonSet was removed in K8s 1.16. Use apps/v1 instead.' },
  { apiVersion: 'extensions/v1beta1', kind: 'NetworkPolicy', removedIn: '1.16', replacement: 'networking.k8s.io/v1', message: 'extensions/v1beta1 NetworkPolicy was removed in K8s 1.16. Use networking.k8s.io/v1 instead.' },
  // Removed in K8s 1.22
  { apiVersion: 'extensions/v1beta1', kind: 'Ingress', removedIn: '1.22', replacement: 'networking.k8s.io/v1', message: 'extensions/v1beta1 Ingress was removed in K8s 1.22. Use networking.k8s.io/v1 instead.' },
  { apiVersion: 'networking.k8s.io/v1beta1', kind: 'Ingress', removedIn: '1.22', replacement: 'networking.k8s.io/v1', message: 'networking.k8s.io/v1beta1 Ingress was removed in K8s 1.22. Use networking.k8s.io/v1 instead.' },
  { apiVersion: 'rbac.authorization.k8s.io/v1beta1', kind: 'Role', removedIn: '1.22', replacement: 'rbac.authorization.k8s.io/v1', message: 'rbac.authorization.k8s.io/v1beta1 Role was removed in K8s 1.22. Use rbac.authorization.k8s.io/v1 instead.' },
  { apiVersion: 'rbac.authorization.k8s.io/v1beta1', kind: 'ClusterRole', removedIn: '1.22', replacement: 'rbac.authorization.k8s.io/v1', message: 'rbac.authorization.k8s.io/v1beta1 ClusterRole was removed in K8s 1.22. Use rbac.authorization.k8s.io/v1 instead.' },
  { apiVersion: 'rbac.authorization.k8s.io/v1beta1', kind: 'RoleBinding', removedIn: '1.22', replacement: 'rbac.authorization.k8s.io/v1', message: 'rbac.authorization.k8s.io/v1beta1 RoleBinding was removed in K8s 1.22. Use rbac.authorization.k8s.io/v1 instead.' },
  { apiVersion: 'rbac.authorization.k8s.io/v1beta1', kind: 'ClusterRoleBinding', removedIn: '1.22', replacement: 'rbac.authorization.k8s.io/v1', message: 'rbac.authorization.k8s.io/v1beta1 ClusterRoleBinding was removed in K8s 1.22. Use rbac.authorization.k8s.io/v1 instead.' },
  // Removed in K8s 1.25
  { apiVersion: 'batch/v1beta1', kind: 'CronJob', removedIn: '1.25', replacement: 'batch/v1', message: 'batch/v1beta1 CronJob was removed in K8s 1.25. Use batch/v1 instead.' },
  { apiVersion: 'autoscaling/v2beta1', kind: 'HorizontalPodAutoscaler', removedIn: '1.25', replacement: 'autoscaling/v2', message: 'autoscaling/v2beta1 HPA was removed in K8s 1.25. Use autoscaling/v2 instead.' },
  // Removed in K8s 1.26
  { apiVersion: 'autoscaling/v2beta2', kind: 'HorizontalPodAutoscaler', removedIn: '1.26', replacement: 'autoscaling/v2', message: 'autoscaling/v2beta2 HPA was removed in K8s 1.26. Use autoscaling/v2 instead.' },
];
```

### Pattern 5: Resource Registry (In-Memory Index)
**What:** Multi-index registry for fast lookups by kind, name, namespace, and labels.
**When to use:** PARSE-04, consumed by Phase 44 cross-resource validation.
**Example:**
```typescript
export interface ParsedResource {
  apiVersion: string;
  kind: string;
  name: string;
  namespace: string;        // 'default' when unspecified
  labels: Record<string, string>;
  doc: Document;            // YAML AST for line lookups
  json: Record<string, unknown>;
  startLine: number;
}

export class ResourceRegistry {
  private byKind = new Map<string, ParsedResource[]>();
  private byName = new Map<string, ParsedResource[]>();  // key: "kind/namespace/name"
  private byNamespace = new Map<string, ParsedResource[]>();
  private all: ParsedResource[] = [];

  add(resource: ParsedResource): void {
    this.all.push(resource);
    // Index by kind
    const kindList = this.byKind.get(resource.kind) ?? [];
    kindList.push(resource);
    this.byKind.set(resource.kind, kindList);
    // Index by qualified name
    const qualName = `${resource.kind}/${resource.namespace}/${resource.name}`;
    const nameList = this.byName.get(qualName) ?? [];
    nameList.push(resource);
    this.byName.set(qualName, nameList);
    // Index by namespace
    const nsList = this.byNamespace.get(resource.namespace) ?? [];
    nsList.push(resource);
    this.byNamespace.set(resource.namespace, nsList);
  }

  getByKind(kind: string): ParsedResource[] { return this.byKind.get(kind) ?? []; }
  getByName(kind: string, namespace: string, name: string): ParsedResource | undefined {
    return this.byName.get(`${kind}/${namespace}/${name}`)?.[0];
  }
  getByLabels(selector: Record<string, string>): ParsedResource[] {
    return this.all.filter(r =>
      Object.entries(selector).every(([k, v]) => r.labels[k] === v)
    );
  }
  getSummary(): Map<string, number> {
    const summary = new Map<string, number>();
    for (const [kind, resources] of this.byKind) {
      summary.set(kind, resources.length);
    }
    return summary;
  }
}
```

### Pattern 6: Schema Compilation Build Script
**What:** Node.js script that downloads K8s schemas, strips status/description for size, and compiles via ajv standalone.
**When to use:** Build-time only, generates `validate-k8s.js`.
**Example:**
```javascript
// scripts/compile-k8s-schemas.mjs
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import standaloneCode from 'ajv/dist/standalone/index.js';
import { readFileSync, writeFileSync } from 'fs';

// Load shared definitions
const definitions = JSON.parse(readFileSync('scripts/schemas/_definitions.json', 'utf8'));

// Load each resource schema and add $id
const resourceSchemas = {
  configmap: 'configmap-v1.json',
  secret: 'secret-v1.json',
  service: 'service-v1.json',
  // ... all 18
};

const ajv = new Ajv({
  allErrors: true,
  strict: false,
  verbose: true,
  validateSchema: false,
  code: { source: true, esm: true },
});
addFormats(ajv);

// Add definitions schema (referenced by $ref in resource schemas)
ajv.addSchema(definitions, '_definitions.json');

// Compile each resource schema with unique $id
const exportMap = {};
for (const [name, file] of Object.entries(resourceSchemas)) {
  const schema = JSON.parse(readFileSync(`scripts/schemas/${file}`, 'utf8'));
  schema.$id = name;
  ajv.addSchema(schema);
  exportMap[name] = name;
}

// Generate single module with named exports
let code = standaloneCode(ajv, exportMap);

// Replace require("ajv/dist/runtime/equal") with inline (same as compose script)
// ... (same equal function replacement as compile-compose-schema.mjs)

writeFileSync('src/lib/tools/k8s-analyzer/validate-k8s.js', output);
```

### Anti-Patterns to Avoid
- **Runtime schema compilation:** Never call `ajv.compile()` at runtime in the browser. Always use pre-compiled standalone validators.
- **Individual schema files per resource:** Do NOT split into 18 separate compiled JS files -- the shared PodSpec/ObjectMeta definitions would be duplicated in each, multiplying bundle size by 5-6x.
- **Standalone-strict schemas directly:** Do NOT use `v1.31.0-standalone-strict` schemas with ajv -- they have everything inlined with no `$ref`, so ajv cannot deduplicate shared definitions. Use `v1.31.0-local` schemas instead.
- **Synchronous engine:** Do NOT make the engine synchronous. Dynamic `import()` for the compiled validator module is async and required for code splitting.
- **Using `parseDocument` for multi-doc:** `parseDocument` only handles a single YAML document. Must use `parseAllDocuments`.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| YAML parsing | Custom `---` splitter + per-doc parser | `parseAllDocuments` from `yaml` 2.x | Edge cases: `---` in strings, `...` end markers, empty documents, BOM handling |
| JSON Schema validation | Custom property-by-property validation | ajv standalone compiled validators | K8s schemas are 5000+ nested properties deep; custom validation would be incomplete |
| Schema compilation | Runtime `new Ajv().compile()` in browser | Pre-compiled standalone ESM module | CSP compliance, bundle size, startup time |
| Line number resolution | String splitting + offset counting | `LineCounter` + AST node `range` property | Handles multi-byte chars, comments, folded strings correctly |
| DNS name validation | Simple regex | Port K8s validation patterns exactly | K8s has specific rules for DNS-1123 subdomain (253 chars), DNS-1123 label (63 chars), and qualified names |
| Label key/value validation | Simple alphanumeric check | K8s qualified name regex (prefix/name format) | Labels allow prefixed keys like `app.kubernetes.io/name` with specific rules per segment |

**Key insight:** K8s schemas encode thousands of validation rules (property types, required fields, enum values, pattern constraints). The ajv standalone approach gives us all of this for free -- the alternative would be manually coding validation for every field of every resource type.

## Common Pitfalls

### Pitfall 1: Bundle Size Explosion from Duplicated Definitions
**What goes wrong:** Each standalone-strict K8s schema inlines all definitions. The 6 workload schemas alone total ~4MB of JSON because PodSpec (~600KB) is duplicated in each.
**Why it happens:** The `v1.31.0-standalone-strict` variant resolves all `$ref` into inline definitions.
**How to avoid:** Use `v1.31.0-local` schemas with `$ref` to shared `_definitions.json`. Compile all 18 schemas together in one ajv instance so shared definitions (PodSpec, ObjectMeta, Container, etc.) are deduplicated in the generated code.
**Warning signs:** Compiled JS file exceeds 2MB raw or 200KB gzipped.

### Pitfall 2: Empty Documents from Trailing `---`
**What goes wrong:** `parseAllDocuments` produces an empty document for a trailing `---` separator. If not handled, this triggers false "missing apiVersion" errors.
**Why it happens:** YAML spec treats `---` as a document start marker. `---` at end of input starts a new empty document.
**How to avoid:** Check for empty documents first (SCHEMA-12 / KA-S010) and skip further validation for those.
**Warning signs:** Every multi-doc YAML with trailing `---` produces an extra "Missing apiVersion" error.

### Pitfall 3: Line Numbers Off by Document Offset
**What goes wrong:** ajv errors report JSON Pointer paths (e.g., `/spec/template/spec/containers/0`) relative to the document. Line numbers must be resolved relative to the full multi-document input, not the individual document.
**Why it happens:** Each document has its own AST, but the `LineCounter` tracks offsets in the full input.
**How to avoid:** Use a single shared `LineCounter` across all documents. Resolve ajv error paths via `resolveInstancePath(doc, path)` then `getNodeLine(node, lineCounter)` to get full-input line numbers. Same pattern as compose-validator's `categorizeSchemaErrors`.
**Warning signs:** Line numbers in second/third documents appear at line 1 instead of their actual position.

### Pitfall 4: require() in Compiled ajv Standalone Code
**What goes wrong:** ajv standalone output may contain `require("ajv/dist/runtime/equal")` which breaks ESM and browser environments.
**Why it happens:** ajv code generator emits CJS require() for runtime helpers like deep-equal.
**How to avoid:** Replace `require()` calls with inline implementations in the compile script, exactly as done in `compile-compose-schema.mjs`. Check for remaining `require()` calls and fail the build if found.
**Warning signs:** Runtime error "require is not defined" in browser.

### Pitfall 5: Strict Mode Rejecting Valid Custom Fields
**What goes wrong:** Using `additionalProperties: false` schemas causes ajv to reject CRD annotations, Helm templating syntax, or other legitimate additional fields.
**Why it happens:** The `-strict` schema variant disallows any properties not in the K8s spec.
**How to avoid:** Consider using `-standalone` (non-strict) schemas if user feedback indicates too many false positives. Alternatively, use strict but configure specific `additionalProperties` overrides for `metadata.annotations` and `metadata.labels`.
**Warning signs:** Users see "unknown property" errors for common annotations like `kubernetes.io/ingress.class`.

### Pitfall 6: GVK Matching Case Sensitivity
**What goes wrong:** Users type `apiversion` or `Kind` (wrong case) and get confusing errors.
**Why it happens:** YAML keys are case-sensitive; `apiVersion` must be exact.
**How to avoid:** When `apiVersion` or `kind` is not found, check for case-insensitive near-matches and include a helpful "Did you mean `apiVersion`?" in the error message.
**Warning signs:** User pastes valid manifest with typo and gets unhelpful "missing apiVersion" error.

## Code Examples

### Multi-Document YAML Parsing (Verified)
```typescript
// Source: Tested locally with yaml 2.8.2
import { parseAllDocuments, LineCounter } from 'yaml';

const lineCounter = new LineCounter();
const docs = parseAllDocuments(rawText, { lineCounter });
// docs.length includes empty documents from trailing ---
// Each doc has: doc.errors (syntax errors), doc.contents (AST), doc.toJSON()
// lineCounter.linePos(offset) returns { line, col } (1-based, full input)
// doc.contents.range = [startOffset, valueEndOffset, nodeEndOffset]
```

### ajv Error to Line Number Resolution (Verified)
```typescript
// Source: Proven in compose-validator/schema-validator.ts
import { resolveInstancePath, getNodeLine } from './parser';

function mapAjvErrorToViolation(
  error: ErrorObject,
  doc: Document,
  lineCounter: LineCounter,
  startLine: number,
): K8sRuleViolation {
  const node = resolveInstancePath(doc, error.instancePath);
  const { line, col } = getNodeLine(node, lineCounter);
  return {
    ruleId: 'KA-S005',
    line,
    column: col,
    message: humanizeAjvError(error),
  };
}
```

### RFC 1123 DNS Subdomain Validation (metadata.name)
```typescript
// Source: kubernetes/apimachinery validation.go
const DNS_1123_SUBDOMAIN_RE = /^[a-z0-9]([a-z0-9.-]*[a-z0-9])?$/;
const DNS_1123_SUBDOMAIN_MAX = 253;

export function validateMetadataName(name: string): string | null {
  if (name.length === 0) return null; // handled by KA-S007
  if (name.length > DNS_1123_SUBDOMAIN_MAX)
    return `metadata.name '${name}' exceeds maximum length of ${DNS_1123_SUBDOMAIN_MAX} characters.`;
  if (!DNS_1123_SUBDOMAIN_RE.test(name))
    return `metadata.name '${name}' is not a valid DNS subdomain. Must consist of lowercase alphanumeric characters, '-' or '.', and must start and end with an alphanumeric character.`;
  return null;
}
```

### Label Key/Value Validation
```typescript
// Source: kubernetes/apimachinery validation.go
const LABEL_NAME_RE = /^([A-Za-z0-9][-A-Za-z0-9_.]*)?[A-Za-z0-9]$/;
const LABEL_VALUE_RE = /^([A-Za-z0-9][-A-Za-z0-9_.]*)?[A-Za-z0-9]$/;
const DNS_1123_SUBDOMAIN_RE_FOR_PREFIX = /^[a-z0-9]([a-z0-9.-]*[a-z0-9])?$/;
const LABEL_VALUE_MAX = 63;
const LABEL_NAME_MAX = 63;
const LABEL_PREFIX_MAX = 253;

export function validateLabelKey(key: string): string | null {
  const parts = key.split('/');
  if (parts.length > 2) return `Label key '${key}' contains multiple '/' characters.`;
  if (parts.length === 2) {
    const [prefix, name] = parts;
    if (prefix.length > LABEL_PREFIX_MAX)
      return `Label key prefix '${prefix}' exceeds ${LABEL_PREFIX_MAX} characters.`;
    if (!DNS_1123_SUBDOMAIN_RE_FOR_PREFIX.test(prefix))
      return `Label key prefix '${prefix}' is not a valid DNS subdomain.`;
    if (name.length === 0 || name.length > LABEL_NAME_MAX)
      return `Label key name portion must be 1-${LABEL_NAME_MAX} characters.`;
    if (!LABEL_NAME_RE.test(name))
      return `Label key name '${name}' must start/end with alphanumeric and contain only [-_.A-Za-z0-9].`;
  } else {
    if (key.length === 0 || key.length > LABEL_NAME_MAX)
      return `Label key must be 1-${LABEL_NAME_MAX} characters.`;
    if (!LABEL_NAME_RE.test(key))
      return `Label key '${key}' must start/end with alphanumeric and contain only [-_.A-Za-z0-9].`;
  }
  return null;
}

export function validateLabelValue(value: string): string | null {
  if (value === '') return null; // empty label values are valid
  if (value.length > LABEL_VALUE_MAX)
    return `Label value exceeds ${LABEL_VALUE_MAX} characters.`;
  if (!LABEL_VALUE_RE.test(value))
    return `Label value '${value}' must start/end with alphanumeric and contain only [-_.A-Za-z0-9].`;
  return null;
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `instrumenta/kubernetes-json-schema` | `yannh/kubernetes-json-schema` | 2020 (instrumenta archived) | yannh repo is actively maintained with latest K8s versions |
| `kubeval` for validation | `kubeconform` by yannh | 2021 | kubeconform is 5x faster and actively maintained; validates against same schemas |
| `ajv.compile()` at runtime | `ajv/dist/standalone` pre-compiled | ajv 8.x | No `new Function()` at runtime, CSP-safe, smaller bundle |
| `js-yaml` for parsing | `yaml` (eemeli) 2.x | Adopted in v1.6 | AST access, LineCounter for positions, multi-doc support |
| `parseDocument` single doc | `parseAllDocuments` multi-doc | N/A (new for K8s) | K8s manifests are typically multi-document |

**Deprecated/outdated:**
- `instrumenta/kubernetes-json-schema`: Archived since 2020, no K8s 1.25+ schemas
- `kubeval`: Archived, replaced by kubeconform
- `extensions/v1beta1`, `apps/v1beta1`, `apps/v1beta2`: Removed from K8s in 1.16 (2019)
- `batch/v1beta1`: Removed in K8s 1.25 (2022)
- `networking.k8s.io/v1beta1`: Removed in K8s 1.22 (2021)

## Open Questions

1. **Exact compiled bundle size for 18 K8s schemas**
   - What we know: Compose single schema compiles to 481KB raw / 63KB gzipped. K8s schemas are much more complex but share heavy definitions (PodSpec ~600KB appears in 6 schemas).
   - What's unclear: Whether ajv standalone deduplication of shared definitions from `v1.31.0-local` refs keeps total under 200KB gzipped.
   - Recommendation: The compile script should be the FIRST task in planning. Run it early, measure the gzipped output. If over 200KB, apply optimizations: (1) strip `description` fields from schemas before compilation (saves ~30-40% because descriptions are lengthy strings), (2) strip `status` properties (linters typically don't validate status), (3) consider non-strict variant (no additionalProperties: false, halving schema size).

2. **Strict vs non-strict schema variant**
   - What we know: Strict schemas add `additionalProperties: false` at every level (~2x size vs non-strict). Strict catches typos. Non-strict avoids false positives on annotations.
   - What's unclear: Whether strict mode's false positive rate is acceptable for the target audience.
   - Recommendation: Start with strict (catches more real issues). Add `additionalProperties` override for `metadata.annotations` and `metadata.labels` which legitimately contain arbitrary keys. Revisit if user feedback indicates too many false positives.

3. **Schema description stripping impact**
   - What we know: K8s schemas have lengthy description strings on every property. These are not needed by ajv validation.
   - What's unclear: Exact size savings from stripping descriptions before compilation.
   - Recommendation: Strip descriptions in the compile script as a size optimization. They add zero value to runtime validation.

## Sources

### Primary (HIGH confidence)
- [yannh/kubernetes-json-schema](https://github.com/yannh/kubernetes-json-schema) - Schema file structure, naming conventions, v1.31.0 variants
- [Ajv Standalone Documentation](https://ajv.js.org/standalone.html) - Multiple schema compilation, ESM output, named exports
- [yaml (eemeli) docs](https://eemeli.org/yaml/) - parseAllDocuments API, LineCounter, Document range property
- [Kubernetes Deprecation Guide](https://kubernetes.io/docs/reference/using-api/deprecation-guide/) - Deprecated API versions and removal timelines
- [Kubernetes validation.go](https://github.com/kubernetes/apimachinery/blob/master/pkg/util/validation/validation.go) - DNS-1123, label key/value validation regex patterns

### Secondary (MEDIUM confidence)
- Local testing of `parseAllDocuments` with multi-doc YAML, `---` separators, and error recovery - Verified behavior matches documentation
- Schema size measurements via curl - Raw sizes for all 18 resource schemas from yannh repo

### Tertiary (LOW confidence)
- Bundle size estimation for compiled 18-schema module - Extrapolated from compose-validator single-schema experience; actual size needs validation via compile script

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries already in project, proven patterns from v1.6
- Architecture: HIGH - Direct adaptation of compose-validator patterns with well-understood modifications (async engine, multi-doc parsing)
- Schema compilation: MEDIUM - Approach is sound but exact bundle size unverified; compile script must run early to validate <200KB constraint
- Pitfalls: HIGH - Based on direct codebase analysis and verified behavior testing
- Deprecated API versions: HIGH - From official Kubernetes deprecation guide

**Research date:** 2026-02-23
**Valid until:** 2026-04-23 (stable domain; K8s schemas update with each K8s release but v1.31 is pinned)
