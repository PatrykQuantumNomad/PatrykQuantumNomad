# Phase 44: Cross-Resource Validation & RBAC - Research

**Researched:** 2026-02-23
**Domain:** Kubernetes cross-resource reference validation (selector matching, ConfigMap/Secret/PVC/SA references) and RBAC static analysis (Role/ClusterRole permissions, RoleBinding checks)
**Confidence:** HIGH

## Summary

Phase 44 adds 13 new lint rules to the K8s Manifest Analyzer: 8 cross-resource reference checks (KA-X001 through KA-X008) and 5 RBAC analysis rules (KA-A001 through KA-A005). These rules plug into the existing engine via the `allK8sRules` array in `rules/index.ts`, following the exact same architecture proven in Phases 42 (20 security rules) and 43 (24 reliability + best practice rules). RBAC violations are scored under the Security category (35% weight) per the SCORE-04 requirement. No new dependencies are needed.

The critical difference between Phase 44 and prior phases is that cross-resource rules (XREF) operate on relationships between resources rather than on individual resources in isolation. The existing `ResourceRegistry` provides exactly the infrastructure needed: `getByKind()` retrieves all resources of a given kind, `getByName()` looks up specific resources by kind/namespace/name, and `getByLabels()` matches resources by label selectors. These methods were designed in Phase 41 specifically for Phase 44 consumption.

The RBAC rules are structurally simpler -- they inspect the `rules` array within Role/ClusterRole resources for dangerous permission patterns (wildcards, exec/attach verbs, secret access). These operate on individual resources and follow the same pattern as security rules, just targeting RBAC-specific fields. RoleBinding/ClusterRoleBinding rules check for `cluster-admin` roleRef bindings.

A key design challenge is avoiding false positives for well-known system resources. When a manifest references `default` ServiceAccount, `kube-root-ca.crt` ConfigMap, or other auto-created cluster resources, these will not be present in the manifest file but are not "dangling" references -- they exist at runtime. The cross-resource rules must maintain a whitelist of well-known system resources to suppress these false positives.

**Primary recommendation:** Follow the Phase 42/43 rule pattern exactly (one file per rule, category index, master index integration). Create `rules/cross-resource/` and `rules/rbac/` directories. RBAC rules use `category: 'security'` for scoring under the Security weight. Cross-resource rules use `category: 'cross-resource'` (already defined in `K8sCategory`). Implement a `WELL_KNOWN_RESOURCES` whitelist in a shared constant to prevent false positives on system resources.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| XREF-01 | KA-X001 -- Service selector matches no Pod template (warning) | Use Service `spec.selector` labels, match against all workload resources' `spec.template.metadata.labels` via registry iteration |
| XREF-02 | KA-X002 -- Ingress references undefined Service (warning) | Extract `spec.rules[*].http.paths[*].backend.service.name`, look up in registry via `getByName('Service', namespace, name)` |
| XREF-03 | KA-X003 -- ConfigMap reference not found in file (info) | Scan `volumes[*].configMap.name` and `envFrom[*].configMapRef.name` and `env[*].valueFrom.configMapKeyRef.name`, look up via `getByName('ConfigMap', namespace, name)` |
| XREF-04 | KA-X004 -- Secret reference not found in file (info) | Same pattern as XREF-03 but for `volumes[*].secret.secretName`, `envFrom[*].secretRef.name`, `env[*].valueFrom.secretKeyRef.name` |
| XREF-05 | KA-X005 -- PVC reference not found in file (info) | Scan `volumes[*].persistentVolumeClaim.claimName`, look up via `getByName('PersistentVolumeClaim', namespace, name)` |
| XREF-06 | KA-X006 -- ServiceAccount reference not found in file (warning) | Check `spec.serviceAccountName` (pod-level), look up via `getByName('ServiceAccount', namespace, name)` |
| XREF-07 | KA-X007 -- NetworkPolicy selector matches no Pod (info) | Use NetworkPolicy `spec.podSelector.matchLabels`, match against all workload resources' pod template labels in same namespace |
| XREF-08 | KA-X008 -- HPA targets non-existent resource (warning) | Use HPA `spec.scaleTargetRef.kind` + `spec.scaleTargetRef.name`, look up via `getByName(kind, namespace, name)` |
| RBAC-01 | KA-A001 -- Wildcard permissions in Role/ClusterRole (error) -- CIS 5.1.3 | Check `rules[*].verbs` contains `"*"` or `rules[*].resources` contains `"*"` or `rules[*].apiGroups` contains `"*"` |
| RBAC-02 | KA-A002 -- cluster-admin RoleBinding (error) -- CIS 5.1.1 | Check RoleBinding/ClusterRoleBinding `roleRef.name === 'cluster-admin'` |
| RBAC-03 | KA-A003 -- Pod exec/attach permissions (warning) | Check for `rules[*].resources` containing `"pods/exec"` or `"pods/attach"` or `"pods/*"` |
| RBAC-04 | KA-A004 -- Secret access permissions (warning) -- CIS 5.1.2 | Check for `rules[*].resources` containing `"secrets"` with verbs `get`, `list`, or `watch` |
| RBAC-05 | KA-A005 -- Pod creation permissions (warning) -- CIS 5.1.4 | Check for `rules[*].resources` containing `"pods"` with verbs `create` |
| SCORE-04 | RBAC rules scored under Security category | Set `category: 'security'` on all KA-A rules; existing scorer weights apply (Security 35%) |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| yaml | 2.8.2 | YAML AST traversal via resolveInstancePath + line resolution via getNodeLine | Already in project; same pattern proven in 44 existing rules |
| typescript | 5.9.3 | Type-safe rule definitions using K8sLintRule interface | Already in project |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| (none) | -- | -- | No new dependencies needed; all 13 rules are pure TypeScript functions operating on parsed JSON + YAML AST |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| ResourceRegistry.getByName() for reference lookups | Manual iteration over all resources | Registry already has efficient indexed lookups by kind/namespace/name; manual iteration would be O(n) per reference check |
| Whitelist of well-known system resources | No whitelist (flag everything) | Without whitelist, every manifest referencing `default` SA or `kube-root-ca.crt` ConfigMap would produce false positives, reducing tool credibility |
| category: 'security' for RBAC rules | New 'rbac' category | SCORE-04 requirement explicitly says "RBAC rules scored under Security category weight (35%)"; using existing category avoids scorer changes |

**Installation:**
```bash
# No new npm installs needed -- all dependencies already in package.json
```

## Architecture Patterns

### Recommended Project Structure
```
src/lib/tools/k8s-analyzer/
  rules/
    cross-resource/
      KA-X001-service-selector-mismatch.ts    # XREF-01
      KA-X002-ingress-undefined-service.ts    # XREF-02
      KA-X003-configmap-not-found.ts          # XREF-03
      KA-X004-secret-not-found.ts             # XREF-04
      KA-X005-pvc-not-found.ts                # XREF-05
      KA-X006-serviceaccount-not-found.ts     # XREF-06
      KA-X007-networkpolicy-no-match.ts       # XREF-07
      KA-X008-hpa-target-not-found.ts         # XREF-08
      well-known-resources.ts                 # Shared whitelist constant
      index.ts                                # exports crossResourceRules: K8sLintRule[]
    rbac/
      KA-A001-wildcard-permissions.ts         # RBAC-01
      KA-A002-cluster-admin-binding.ts        # RBAC-02
      KA-A003-pod-exec-attach.ts              # RBAC-03
      KA-A004-secret-access.ts                # RBAC-04
      KA-A005-pod-creation.ts                 # RBAC-05
      index.ts                                # exports rbacRules: K8sLintRule[]
    security/                                 # existing from Phase 42
    reliability/                              # existing from Phase 43
    best-practice/                            # existing from Phase 43
    index.ts                                  # updated: spread crossResourceRules + rbacRules
  engine.ts                                   # existing (no changes -- totalRules formula auto-adapts)
  sample-manifest.ts                          # updated: add RBAC + cross-resource violation examples
```

### Pattern 1: Cross-Resource Selector Match Rule (Service -> Pod template)
**What:** Rules that check whether a Service's `spec.selector` labels match any Pod template's labels in any workload resource. The Service selector is a simple key-value map (not matchLabels/matchExpressions like Deployment selectors). It matches against the Pod's labels, which are set in `spec.template.metadata.labels` of workload resources.
**When to use:** XREF-01 (KA-X001)
**Example:**
```typescript
// Source: Kubernetes Service selector resolution docs
import type { K8sLintRule, K8sRuleContext, K8sRuleViolation } from '../../types';
import { resolveInstancePath, getNodeLine } from '../../parser';

// Workload kinds that have pod template labels
const WORKLOAD_KINDS = new Set(['Deployment', 'StatefulSet', 'DaemonSet', 'Job', 'CronJob', 'Pod']);

// JSON path to template labels per kind
const TEMPLATE_LABEL_PATHS: Record<string, string> = {
  Pod: '/metadata/labels',
  Deployment: '/spec/template/metadata/labels',
  StatefulSet: '/spec/template/metadata/labels',
  DaemonSet: '/spec/template/metadata/labels',
  Job: '/spec/template/metadata/labels',
  CronJob: '/spec/jobTemplate/spec/template/metadata/labels',
};

export const KAX001: K8sLintRule = {
  id: 'KA-X001',
  title: 'Service selector matches no Pod template',
  severity: 'warning',
  category: 'cross-resource',
  // ... explanation, fix ...

  check(ctx: K8sRuleContext): K8sRuleViolation[] {
    const violations: K8sRuleViolation[] = [];

    for (const resource of ctx.resources) {
      if (resource.kind !== 'Service') continue;

      const spec = resource.json.spec as Record<string, unknown> | undefined;
      const selector = spec?.selector as Record<string, string> | undefined;
      if (!selector || Object.keys(selector).length === 0) continue;

      // Check if any workload resource in the same namespace has matching template labels
      const namespace = resource.namespace;
      let matched = false;

      for (const candidate of ctx.resources) {
        if (!WORKLOAD_KINDS.has(candidate.kind)) continue;
        if (candidate.namespace !== namespace) continue;

        // Get template labels based on resource kind
        const labelPath = TEMPLATE_LABEL_PATHS[candidate.kind];
        if (!labelPath) continue;

        // Navigate to template labels in JSON
        const templateLabels = getNestedValue(candidate.json, labelPath) as Record<string, string> | undefined;
        if (!templateLabels) continue;

        // Check if all selector entries match template labels
        const allMatch = Object.entries(selector).every(
          ([k, v]) => templateLabels[k] === v
        );
        if (allMatch) { matched = true; break; }
      }

      if (!matched) {
        const node = resolveInstancePath(resource.doc, '/spec/selector');
        const { line, col } = getNodeLine(node, ctx.lineCounter);
        violations.push({
          ruleId: 'KA-X001',
          line, column: col,
          message: `Service '${resource.name}' selector ${JSON.stringify(selector)} matches no Pod template in namespace '${namespace}'.`,
        });
      }
    }

    return violations;
  },
};

// Helper to navigate nested JSON by path
function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  const segments = path.split('/').filter(s => s !== '');
  let current: unknown = obj;
  for (const segment of segments) {
    if (current && typeof current === 'object' && !Array.isArray(current)) {
      current = (current as Record<string, unknown>)[segment];
    } else {
      return undefined;
    }
  }
  return current;
}
```

### Pattern 2: Named Reference Lookup Rule (Ingress -> Service, ConfigMap, Secret, PVC, SA)
**What:** Rules that check whether a named reference to another resource exists in the manifest. Uses `registry.getByName(kind, namespace, name)` for O(1) lookup. Must consult the well-known resources whitelist to suppress false positives for system resources.
**When to use:** XREF-02 through XREF-06 (KA-X002 through KA-X006)
**Example:**
```typescript
// Source: Kubernetes Ingress spec.rules[*].http.paths[*].backend.service.name
import type { K8sLintRule, K8sRuleContext, K8sRuleViolation } from '../../types';
import { resolveInstancePath, getNodeLine } from '../../parser';
import { WELL_KNOWN_SERVICES } from './well-known-resources';

export const KAX002: K8sLintRule = {
  id: 'KA-X002',
  title: 'Ingress references undefined Service',
  severity: 'warning',
  category: 'cross-resource',
  // ... explanation, fix ...

  check(ctx: K8sRuleContext): K8sRuleViolation[] {
    const violations: K8sRuleViolation[] = [];

    for (const resource of ctx.resources) {
      if (resource.kind !== 'Ingress') continue;

      const spec = resource.json.spec as Record<string, unknown> | undefined;
      const rules = spec?.rules as Record<string, unknown>[] | undefined;
      if (!Array.isArray(rules)) continue;

      for (let ri = 0; ri < rules.length; ri++) {
        const http = rules[ri].http as Record<string, unknown> | undefined;
        const paths = http?.paths as Record<string, unknown>[] | undefined;
        if (!Array.isArray(paths)) continue;

        for (let pi = 0; pi < paths.length; pi++) {
          const backend = paths[pi].backend as Record<string, unknown> | undefined;
          const service = backend?.service as Record<string, unknown> | undefined;
          const serviceName = service?.name as string | undefined;
          if (!serviceName) continue;

          // Skip well-known system services
          if (WELL_KNOWN_SERVICES.has(serviceName)) continue;

          // Look up the referenced service in the same namespace
          const found = ctx.registry.getByName('Service', resource.namespace, serviceName);
          if (!found) {
            const node = resolveInstancePath(
              resource.doc,
              `/spec/rules/${ri}/http/paths/${pi}/backend/service/name`,
            );
            const { line, col } = getNodeLine(node, ctx.lineCounter);
            violations.push({
              ruleId: 'KA-X002',
              line, column: col,
              message: `Ingress '${resource.name}' references Service '${serviceName}' which is not defined in the manifest.`,
            });
          }
        }
      }
    }

    return violations;
  },
};
```

### Pattern 3: Volume/Env Reference Scanning (ConfigMap, Secret, PVC)
**What:** Rules that scan container specs and pod volumes for references to ConfigMaps, Secrets, or PVCs. References can appear in three places: (1) `volumes[*].configMap.name` / `volumes[*].secret.secretName` / `volumes[*].persistentVolumeClaim.claimName` at the pod spec level; (2) `envFrom[*].configMapRef.name` / `envFrom[*].secretRef.name` at the container level; (3) `env[*].valueFrom.configMapKeyRef.name` / `env[*].valueFrom.secretKeyRef.name` at the env var level.
**When to use:** XREF-03, XREF-04, XREF-05 (KA-X003, KA-X004, KA-X005)
**Example:**
```typescript
// ConfigMap reference locations in a workload resource:
// 1. spec[.template].spec.volumes[*].configMap.name
// 2. spec[.template].spec.containers[*].envFrom[*].configMapRef.name
// 3. spec[.template].spec.containers[*].env[*].valueFrom.configMapKeyRef.name

import { getPodSpec, getContainerSpecs } from '../../container-helpers';
import { WELL_KNOWN_CONFIGMAPS } from './well-known-resources';

check(ctx: K8sRuleContext): K8sRuleViolation[] {
  const violations: K8sRuleViolation[] = [];

  for (const resource of ctx.resources) {
    const pod = getPodSpec(resource);
    if (!pod) continue;

    // 1. Check volumes
    const volumes = pod.podSpec.volumes as Record<string, unknown>[] | undefined;
    if (Array.isArray(volumes)) {
      for (let i = 0; i < volumes.length; i++) {
        const cm = volumes[i].configMap as Record<string, unknown> | undefined;
        const name = cm?.name as string | undefined;
        if (name && !WELL_KNOWN_CONFIGMAPS.has(name)) {
          const found = ctx.registry.getByName('ConfigMap', resource.namespace, name);
          if (!found) {
            // emit violation at /spec[...]/volumes/{i}/configMap/name
          }
        }
      }
    }

    // 2. Check envFrom on each container
    const containerSpecs = getContainerSpecs(resource);
    for (const { container, jsonPath } of containerSpecs) {
      const envFrom = container.envFrom as Record<string, unknown>[] | undefined;
      if (Array.isArray(envFrom)) {
        for (let ei = 0; ei < envFrom.length; ei++) {
          const ref = envFrom[ei].configMapRef as Record<string, unknown> | undefined;
          const name = ref?.name as string | undefined;
          if (name && !WELL_KNOWN_CONFIGMAPS.has(name)) {
            const found = ctx.registry.getByName('ConfigMap', resource.namespace, name);
            if (!found) {
              // emit violation at {jsonPath}/envFrom/{ei}/configMapRef/name
            }
          }
        }
      }

      // 3. Check env[*].valueFrom.configMapKeyRef
      const envList = container.env as Record<string, unknown>[] | undefined;
      if (Array.isArray(envList)) {
        for (let ei = 0; ei < envList.length; ei++) {
          const valueFrom = envList[ei].valueFrom as Record<string, unknown> | undefined;
          const cmKeyRef = valueFrom?.configMapKeyRef as Record<string, unknown> | undefined;
          const name = cmKeyRef?.name as string | undefined;
          if (name && !WELL_KNOWN_CONFIGMAPS.has(name)) {
            const found = ctx.registry.getByName('ConfigMap', resource.namespace, name);
            if (!found) {
              // emit violation at {jsonPath}/env/{ei}/valueFrom/configMapKeyRef/name
            }
          }
        }
      }
    }
  }

  return violations;
}
```

### Pattern 4: RBAC Permission Inspection Rule (Role/ClusterRole rules array)
**What:** Rules that inspect the `rules` array of Role or ClusterRole resources for dangerous permission patterns. Each entry in `rules` has `apiGroups`, `resources`, and `verbs` arrays.
**When to use:** RBAC-01, RBAC-03, RBAC-04, RBAC-05 (KA-A001, KA-A003, KA-A004, KA-A005)
**Example:**
```typescript
// Source: Kubernetes RBAC Role structure -- rules[*].{apiGroups, resources, verbs}
import type { K8sLintRule, K8sRuleContext, K8sRuleViolation } from '../../types';
import { resolveInstancePath, getNodeLine } from '../../parser';

export const KAA001: K8sLintRule = {
  id: 'KA-A001',
  title: 'Wildcard permissions in Role/ClusterRole',
  severity: 'error',
  category: 'security',  // SCORE-04: scored under Security (35%)
  explanation:
    'The Role or ClusterRole uses wildcard (*) in apiGroups, resources, or verbs. ' +
    'Wildcard permissions grant broader access than typically needed, violating ' +
    'the principle of least privilege. CIS Kubernetes Benchmark 5.1.3 recommends ' +
    'replacing wildcards with specific resource names and actions.',
  fix: {
    description: 'Replace wildcard permissions with explicit resources and verbs',
    beforeCode:
      'rules:\n- apiGroups: ["*"]\n  resources: ["*"]\n  verbs: ["*"]',
    afterCode:
      'rules:\n- apiGroups: [""]\n  resources: ["pods"]\n  verbs: ["get", "list", "watch"]',
  },

  check(ctx: K8sRuleContext): K8sRuleViolation[] {
    const violations: K8sRuleViolation[] = [];

    for (const resource of ctx.resources) {
      if (resource.kind !== 'Role' && resource.kind !== 'ClusterRole') continue;

      const rules = resource.json.rules as Record<string, unknown>[] | undefined;
      if (!Array.isArray(rules)) continue;

      for (let i = 0; i < rules.length; i++) {
        const apiGroups = rules[i].apiGroups as string[] | undefined;
        const resources = rules[i].resources as string[] | undefined;
        const verbs = rules[i].verbs as string[] | undefined;

        const wildcardFields: string[] = [];
        if (apiGroups?.includes('*')) wildcardFields.push('apiGroups');
        if (resources?.includes('*')) wildcardFields.push('resources');
        if (verbs?.includes('*')) wildcardFields.push('verbs');

        if (wildcardFields.length > 0) {
          const node = resolveInstancePath(resource.doc, `/rules/${i}`);
          const { line, col } = getNodeLine(node, ctx.lineCounter);
          violations.push({
            ruleId: 'KA-A001',
            line, column: col,
            message: `${resource.kind} '${resource.name}' uses wildcard (*) in ${wildcardFields.join(', ')} (CIS 5.1.3 violation).`,
          });
        }
      }
    }

    return violations;
  },
};
```

### Pattern 5: RoleBinding/ClusterRoleBinding Inspection (cluster-admin check)
**What:** Rules that inspect RoleBinding or ClusterRoleBinding resources for dangerous roleRef bindings. The `roleRef` field has `kind`, `name`, and `apiGroup`.
**When to use:** RBAC-02 (KA-A002)
**Example:**
```typescript
// Source: Kubernetes RBAC RoleBinding structure -- roleRef.name
export const KAA002: K8sLintRule = {
  id: 'KA-A002',
  title: 'cluster-admin RoleBinding',
  severity: 'error',
  category: 'security',  // SCORE-04: scored under Security (35%)
  explanation:
    'A RoleBinding or ClusterRoleBinding grants the cluster-admin ClusterRole. ' +
    'The cluster-admin role provides unrestricted access to the entire cluster. ' +
    'CIS Kubernetes Benchmark 5.1.1 recommends restricting use of the ' +
    'cluster-admin role to only where absolutely required.',
  // ... fix ...

  check(ctx: K8sRuleContext): K8sRuleViolation[] {
    const violations: K8sRuleViolation[] = [];

    for (const resource of ctx.resources) {
      if (resource.kind !== 'RoleBinding' && resource.kind !== 'ClusterRoleBinding') continue;

      const roleRef = resource.json.roleRef as Record<string, unknown> | undefined;
      if (roleRef?.name === 'cluster-admin') {
        const node = resolveInstancePath(resource.doc, '/roleRef/name');
        const { line, col } = getNodeLine(node, ctx.lineCounter);
        violations.push({
          ruleId: 'KA-A002',
          line, column: col,
          message: `${resource.kind} '${resource.name}' grants the cluster-admin ClusterRole (CIS 5.1.1 violation).`,
        });
      }
    }

    return violations;
  },
};
```

### Pattern 6: Well-Known Resources Whitelist
**What:** A shared constant module listing Kubernetes system resources that are auto-created in every namespace and should not trigger "not found in file" warnings.
**When to use:** XREF-03 through XREF-06 to suppress false positives.
**Example:**
```typescript
// cross-resource/well-known-resources.ts

/** ConfigMaps auto-created by Kubernetes controllers in every namespace. */
export const WELL_KNOWN_CONFIGMAPS = new Set([
  'kube-root-ca.crt',  // Root CA certificate (rootcacertpublisher controller)
]);

/** ServiceAccounts auto-created by Kubernetes in every namespace. */
export const WELL_KNOWN_SERVICE_ACCOUNTS = new Set([
  'default',  // Default ServiceAccount auto-created per namespace
]);

/** Secrets that are well-known and auto-created. */
export const WELL_KNOWN_SECRETS = new Set<string>([
  // No universal well-known secrets; SA token secrets are namespace-specific
]);

/** Services that are well-known (empty -- no auto-created services in user namespaces). */
export const WELL_KNOWN_SERVICES = new Set<string>([
  // 'kubernetes' service exists in 'default' namespace but unlikely to be
  // referenced by Ingress. Add if false positives are reported.
]);
```

### Anti-Patterns to Avoid
- **Checking cross-resource references without namespace scoping:** ConfigMaps, Secrets, PVCs, and Services are namespace-scoped. A reference in namespace `A` should only look for resources in namespace `A`, not across all namespaces. Always use `resource.namespace` when calling `registry.getByName()`.
- **Flagging all missing references equally:** System resources like `default` ServiceAccount and `kube-root-ca.crt` ConfigMap exist at runtime but will never be in a static manifest. A well-known resources whitelist is essential.
- **Making RBAC rules category: 'cross-resource':** The SCORE-04 requirement explicitly states "RBAC rules scored under Security category weight (35%)". RBAC rules must use `category: 'security'`.
- **Checking only `spec.containers` for volume/env references without init containers:** ConfigMap and Secret references can appear in both containers and initContainers. Use `getContainerSpecs()` which returns both.
- **Iterating ALL resources for template label matching (KA-X001):** Only workload resources (Deployment, StatefulSet, DaemonSet, Job, CronJob, Pod) have pod template labels. Filter by kind before matching.
- **Forgetting CronJob template labels path:** CronJob template labels are at `spec.jobTemplate.spec.template.metadata.labels`, not `spec.template.metadata.labels`. The `TEMPLATE_LABEL_PATHS` map must handle this.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Resource lookup by kind/namespace/name | Manual iteration over all resources | `registry.getByName(kind, namespace, name)` | O(1) indexed lookup vs O(n) iteration; already built in Phase 41 |
| Label selector matching | Custom selector comparison loop | `registry.getByLabels(selector)` for general cases, or inline comparison for template labels | Registry method exists; for Service selectors we compare against template labels directly |
| Container extraction from workloads | Inline PodSpec path resolution | Existing `getContainerSpecs()` / `getPodSpec()` from `container-helpers.ts` | Already built in Phase 42 |
| Line number resolution | String-based regex counting | Existing `resolveInstancePath()` + `getNodeLine()` from `parser.ts` | Proven in 44 existing rules |
| Nested JSON traversal | Custom recursive accessor | Simple segment-based path navigation (like `getNestedValue` helper) | K8s resource paths are well-defined; no need for general-purpose deep access |

**Key insight:** The ResourceRegistry was designed in Phase 41 specifically for Phase 44's cross-resource validation. All the indexing infrastructure (`getByKind`, `getByName`, `getByLabels`, `getByNamespace`) already exists. Phase 44 rules are purely consumers of this infrastructure.

## Common Pitfalls

### Pitfall 1: False Positives for System Resources
**What goes wrong:** KA-X003 flags `kube-root-ca.crt` ConfigMap as "not found in file." KA-X006 flags `default` ServiceAccount as "not found in file." These exist at runtime but are never in a static manifest.
**Why it happens:** Kubernetes auto-creates certain resources in every namespace (default ServiceAccount, kube-root-ca.crt ConfigMap). The analyzer only sees what is in the manifest file.
**How to avoid:** Maintain `WELL_KNOWN_CONFIGMAPS` and `WELL_KNOWN_SERVICE_ACCOUNTS` Set constants. Check against these before flagging a missing reference. Keep the sets minimal and well-documented.
**Warning signs:** Every manifest that uses the default ServiceAccount produces a "ServiceAccount not found" warning.

### Pitfall 2: Service Selector vs Deployment Selector Confusion
**What goes wrong:** KA-X001 compares Service `spec.selector` against Deployment's `spec.selector.matchLabels` instead of against the Pod template labels at `spec.template.metadata.labels`.
**Why it happens:** Both Services and Deployments have "selectors" but they target different things. Services select Pods by their labels. Deployments select Pods they manage by their template labels.
**How to avoid:** For KA-X001, match Service `spec.selector` (which is a simple `{key: value}` map) against `spec.template.metadata.labels` (Pod template labels) of workload resources, NOT against `spec.selector.matchLabels` of the Deployment. The Service routes traffic to Pods, not to Deployments.
**Warning signs:** A Service with selector `{app: myapp}` that targets a Deployment whose template labels include `{app: myapp}` is incorrectly flagged as having no match.

### Pitfall 3: Namespace Mismatch in Cross-Resource Lookups
**What goes wrong:** KA-X002 finds a Service in a different namespace than the Ingress and considers the reference resolved, when in fact the Ingress can only reference Services in the same namespace.
**Why it happens:** ConfigMaps, Secrets, PVCs, Services, and ServiceAccounts are namespace-scoped. Cross-namespace references require ExternalName Services or special configurations.
**How to avoid:** Always pass the referring resource's namespace to `registry.getByName()`. For example, an Ingress in namespace `online-store` should only find Services in namespace `online-store`.
**Warning signs:** A reference to Service `web-frontend-svc` from an Ingress in namespace `A` is resolved by a Service named `web-frontend-svc` in namespace `B`.

### Pitfall 4: RBAC Rules Array Structure
**What goes wrong:** KA-A001 checks `resource.json.rules` but the `rules` field does not exist because the Role/ClusterRole has `aggregationRule` instead of `rules`.
**Why it happens:** ClusterRoles can use `aggregationRule.clusterRoleSelectors` instead of a `rules` array. The actual rules are aggregated from other ClusterRoles at runtime.
**How to avoid:** Check if `rules` is defined and is an array before iterating. If `rules` is absent (aggregated ClusterRole), skip the rule check gracefully. Do not flag this as an error.
**Warning signs:** ClusterRole with `aggregationRule` causes a runtime error or incorrect "missing rules" violation.

### Pitfall 5: HPA scaleTargetRef Kind Matching
**What goes wrong:** KA-X008 checks `scaleTargetRef.kind === 'Deployment'` but the user wrote `kind: deployment` (wrong case) or a different kind like `StatefulSet`.
**Why it happens:** HPA `scaleTargetRef.kind` can be any scalable resource kind (Deployment, StatefulSet, ReplicaSet, or custom resources).
**How to avoid:** Use the `scaleTargetRef.kind` value directly for the `registry.getByName()` lookup. The GVK registry already uses exact kind names (case-sensitive). If the referenced kind is not in the GVK registry (e.g., a CRD), skip the check rather than false-flagging.
**Warning signs:** HPA targeting a StatefulSet is not checked, or HPA targeting a CRD produces a false positive.

### Pitfall 6: Multiple Reference Locations for ConfigMaps and Secrets
**What goes wrong:** KA-X003 only checks `volumes[*].configMap.name` and misses ConfigMap references in `envFrom` or `env[*].valueFrom.configMapKeyRef`.
**Why it happens:** ConfigMaps and Secrets can be referenced from three distinct locations in the pod/container spec.
**How to avoid:** Check all three reference locations for each resource type: (1) volume mounts at pod spec level, (2) `envFrom` at container level, (3) `env[*].valueFrom` at env var level. Collect all referenced names, deduplicate, then check each against the registry.
**Warning signs:** A ConfigMap referenced only via `envFrom` is not detected.

### Pitfall 7: Pod-Level ServiceAccount vs Container-Level
**What goes wrong:** KA-X006 checks `container.serviceAccountName` instead of the pod-level `spec.serviceAccountName`.
**Why it happens:** `serviceAccountName` is a pod-level field under the PodSpec, not a container-level field.
**How to avoid:** Use `getPodSpec(resource)` to get the pod spec, then check `podSpec.serviceAccountName`. This is a pod-level attribute, not per-container.
**Warning signs:** ServiceAccount references are never detected because the wrong path is checked.

### Pitfall 8: RBAC Sub-resource Syntax (pods/exec, pods/attach)
**What goes wrong:** KA-A003 checks `resources.includes('pods/exec')` but the actual RBAC resource entry might be `pods` with a separate `resourceNames` filter, or the sub-resource might be specified differently.
**Why it happens:** Kubernetes RBAC sub-resources are specified as `resource/subresource` in the `resources` array. However, if `resources: ["*"]` is used, all sub-resources are included. Also, `pods/exec` and `pods/attach` are the standard sub-resource format.
**How to avoid:** Check for: (1) exact match `"pods/exec"` or `"pods/attach"` in resources; (2) `"pods/*"` which grants all pod sub-resources; (3) `"*"` which grants all resources including sub-resources. For KA-A003, all three patterns should trigger the warning.
**Warning signs:** A Role with `resources: ["*"]` and `verbs: ["*"]` triggers KA-A001 (wildcard) but not KA-A003 (exec/attach), even though `*` includes exec/attach.

## Code Examples

### Well-Known Resources Module
```typescript
// Source: Kubernetes controller behavior -- auto-created resources per namespace

/** ConfigMaps auto-created by Kubernetes controllers in every namespace. */
export const WELL_KNOWN_CONFIGMAPS = new Set([
  'kube-root-ca.crt',  // Created by rootcacertpublisher controller
]);

/** ServiceAccounts auto-created by Kubernetes in every namespace. */
export const WELL_KNOWN_SERVICE_ACCOUNTS = new Set([
  'default',  // Created by ServiceAccount controller in every active namespace
]);

/** Secrets that are well-known. Empty by default as SA token secrets are namespace-specific. */
export const WELL_KNOWN_SECRETS = new Set<string>([]);

/** Services that are well-known. Empty by default. */
export const WELL_KNOWN_SERVICES = new Set<string>([]);

/** PVCs that are well-known. Empty by default. */
export const WELL_KNOWN_PVCS = new Set<string>([]);
```

### ConfigMap Reference Extraction (all three locations)
```typescript
// Source: Kubernetes PodSpec/ContainerSpec structure

interface NamedReference {
  name: string;
  jsonPath: string;  // JSON Pointer for AST line resolution
}

/**
 * Extract all ConfigMap references from a resource.
 * Checks: volumes, envFrom, env[*].valueFrom.configMapKeyRef
 */
function extractConfigMapRefs(
  resource: ParsedResource,
): NamedReference[] {
  const refs: NamedReference[] = [];
  const pod = getPodSpec(resource);
  if (!pod) return refs;

  // 1. Volume references: volumes[*].configMap.name
  const volumes = pod.podSpec.volumes as Record<string, unknown>[] | undefined;
  if (Array.isArray(volumes)) {
    for (let i = 0; i < volumes.length; i++) {
      const cm = volumes[i].configMap as Record<string, unknown> | undefined;
      const name = cm?.name as string | undefined;
      if (name) {
        refs.push({ name, jsonPath: `${pod.podSpecPath}/volumes/${i}/configMap/name` });
      }
    }
  }

  // 2 & 3. Container-level references (envFrom and env valueFrom)
  const containerSpecs = getContainerSpecs(resource);
  for (const { container, jsonPath } of containerSpecs) {
    // envFrom[*].configMapRef.name
    const envFrom = container.envFrom as Record<string, unknown>[] | undefined;
    if (Array.isArray(envFrom)) {
      for (let ei = 0; ei < envFrom.length; ei++) {
        const ref = envFrom[ei].configMapRef as Record<string, unknown> | undefined;
        const name = ref?.name as string | undefined;
        if (name) {
          refs.push({ name, jsonPath: `${jsonPath}/envFrom/${ei}/configMapRef/name` });
        }
      }
    }

    // env[*].valueFrom.configMapKeyRef.name
    const envList = container.env as Record<string, unknown>[] | undefined;
    if (Array.isArray(envList)) {
      for (let ei = 0; ei < envList.length; ei++) {
        const valueFrom = envList[ei].valueFrom as Record<string, unknown> | undefined;
        const cmKeyRef = valueFrom?.configMapKeyRef as Record<string, unknown> | undefined;
        const name = cmKeyRef?.name as string | undefined;
        if (name) {
          refs.push({ name, jsonPath: `${jsonPath}/env/${ei}/valueFrom/configMapKeyRef/name` });
        }
      }
    }
  }

  return refs;
}
```

### Secret Reference Extraction (parallel structure)
```typescript
// Secret references follow same pattern but with different field names:
// volumes[*].secret.secretName  (NOT secret.name -- K8s uses secretName for volumes)
// envFrom[*].secretRef.name
// env[*].valueFrom.secretKeyRef.name

function extractSecretRefs(resource: ParsedResource): NamedReference[] {
  const refs: NamedReference[] = [];
  const pod = getPodSpec(resource);
  if (!pod) return refs;

  // Volume references use secretName (not name)
  const volumes = pod.podSpec.volumes as Record<string, unknown>[] | undefined;
  if (Array.isArray(volumes)) {
    for (let i = 0; i < volumes.length; i++) {
      const sec = volumes[i].secret as Record<string, unknown> | undefined;
      const name = sec?.secretName as string | undefined;
      if (name) {
        refs.push({ name, jsonPath: `${pod.podSpecPath}/volumes/${i}/secret/secretName` });
      }
    }
  }

  // Container-level: envFrom[*].secretRef.name, env[*].valueFrom.secretKeyRef.name
  // ... same pattern as ConfigMap but with secretRef / secretKeyRef
  return refs;
}
```

### RBAC Permission Check Helpers
```typescript
// Source: CIS Kubernetes Benchmark 5.1.x controls

/**
 * Check if a rules entry grants a specific permission pattern.
 * Used by KA-A003 (exec/attach), KA-A004 (secret access), KA-A005 (pod creation).
 */
function ruleGrantsPermission(
  rule: Record<string, unknown>,
  targetResources: string[],
  targetVerbs: string[],
): boolean {
  const resources = rule.resources as string[] | undefined;
  const verbs = rule.verbs as string[] | undefined;
  if (!Array.isArray(resources) || !Array.isArray(verbs)) return false;

  // Check if any target resource is granted
  const hasResource = resources.includes('*') ||
    targetResources.some(tr => resources.includes(tr));
  if (!hasResource) return false;

  // Check if any target verb is granted
  const hasVerb = verbs.includes('*') ||
    targetVerbs.some(tv => verbs.includes(tv));
  return hasVerb;
}

// Usage in KA-A003:
// ruleGrantsPermission(rule, ['pods/exec', 'pods/attach', 'pods/*'], ['create', 'get', '*'])

// Usage in KA-A004:
// ruleGrantsPermission(rule, ['secrets'], ['get', 'list', 'watch', '*'])

// Usage in KA-A005:
// ruleGrantsPermission(rule, ['pods'], ['create', '*'])
```

### Template Labels Path Helper (for cross-resource selector matching)
```typescript
// Source: Kubernetes API -- pod template location per workload kind

/** JSON path from resource root to the pod template's metadata.labels */
const TEMPLATE_LABEL_PATHS: Record<string, string> = {
  Pod: '/metadata/labels',                                // Pod uses its own labels
  Deployment: '/spec/template/metadata/labels',
  StatefulSet: '/spec/template/metadata/labels',
  DaemonSet: '/spec/template/metadata/labels',
  Job: '/spec/template/metadata/labels',
  CronJob: '/spec/jobTemplate/spec/template/metadata/labels',
};

/** Workload kinds that produce Pods (for selector matching). */
const WORKLOAD_KINDS_WITH_PODS = new Set(Object.keys(TEMPLATE_LABEL_PATHS));

/**
 * Get the pod template labels for a resource.
 * Returns null for non-workload resources.
 */
function getTemplateLabels(resource: ParsedResource): Record<string, string> | null {
  const path = TEMPLATE_LABEL_PATHS[resource.kind];
  if (!path) return null;

  const segments = path.split('/').filter(s => s !== '');
  let current: unknown = resource.json;
  for (const segment of segments) {
    if (current && typeof current === 'object' && !Array.isArray(current)) {
      current = (current as Record<string, unknown>)[segment];
    } else {
      return null;
    }
  }

  if (current && typeof current === 'object' && !Array.isArray(current)) {
    return current as Record<string, string>;
  }
  return null;
}
```

### Master Index Update (rules/index.ts)
```typescript
// Updated master index with Phase 44 additions
import type { K8sLintRule, K8sSeverity, K8sCategory, K8sRuleFix } from '../types';
import { securityRules } from './security';
import { reliabilityRules } from './reliability';
import { bestPracticeRules } from './best-practice';
import { crossResourceRules } from './cross-resource';
import { rbacRules } from './rbac';

export interface DocumentedK8sRule {
  id: string;
  title: string;
  severity: K8sSeverity;
  category: K8sCategory;
  explanation: string;
  fix: K8sRuleFix;
}

export const allK8sRules: K8sLintRule[] = [
  ...securityRules,
  ...reliabilityRules,
  ...bestPracticeRules,
  ...crossResourceRules,
  ...rbacRules,
];

export const allDocumentedK8sRules: DocumentedK8sRule[] = [
  ...(allK8sRules as DocumentedK8sRule[]),
];

export function getK8sRuleById(id: string): K8sLintRule | undefined {
  return allK8sRules.find((r) => r.id === id);
}
```

### Sample Manifest RBAC + Cross-Resource Additions
```yaml
# RBAC violations -- Wildcard permissions (triggers KA-A001)
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: overly-permissive-role
rules:
  - apiGroups: ["*"]
    resources: ["*"]
    verbs: ["*"]
---
# RBAC violation -- cluster-admin binding (triggers KA-A002)
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: give-admin-to-dev
subjects:
  - kind: User
    name: developer
    apiGroup: rbac.authorization.k8s.io
roleRef:
  kind: ClusterRole
  name: cluster-admin
  apiGroup: rbac.authorization.k8s.io
---
# Cross-resource: Ingress references non-existent service (triggers KA-X002)
# (web-ingress already references web-frontend-svc which exists, so add a
#  new Ingress with a dangling reference)
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: broken-ingress
  namespace: online-store
spec:
  rules:
    - host: api.example.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: nonexistent-api-svc
                port:
                  number: 8080
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Manual RBAC auditing | Static analysis tools (kube-linter, Polaris, kubesec) flag RBAC issues | 2020+ | Automated RBAC linting catches overly permissive roles before deployment |
| No cross-resource validation in manifest linters | Tools like kube-linter and Datree check for dangling references | 2021+ | Reduces deployment failures from broken references |
| CIS Benchmark v1.6 RBAC controls | CIS Benchmark v1.8+ aligns RBAC controls with PSS and newer K8s versions | 2024-2025 | Section 5.1.x controls are stable and well-established |
| PodSecurityPolicy for RBAC enforcement | Pod Security Admission + RBAC audit | K8s 1.25 (2022) | PSP removal shifted RBAC-level policy enforcement to admission controllers |
| Single-resource linting only | Cross-resource reference validation | Tools like Datree, kube-linter started adding | Catches integration issues between resources in the same manifest |

**Deprecated/outdated:**
- `PodSecurityPolicy`: Removed in K8s 1.25; RBAC audit is now the primary manifest-level security check
- `system:masters` group: Still exists but CIS recommends avoiding direct binding; use explicit RBAC instead

## Open Questions

1. **Should KA-X001 (Service selector) check defaultBackend on Ingress?**
   - What we know: Some Ingress definitions use `spec.defaultBackend` instead of or in addition to `spec.rules[*].http.paths[*].backend`. This is a less common pattern.
   - What's unclear: Whether to include defaultBackend checking in KA-X002 (Ingress -> Service).
   - Recommendation: Include `spec.defaultBackend.service.name` in KA-X002 for completeness. It uses the same Service reference structure and the same lookup pattern. Adding it is minimal effort.

2. **Should KA-X003/X004 deduplicate references before checking?**
   - What we know: The same ConfigMap/Secret can be referenced multiple times in a manifest (e.g., in both volume and envFrom). Each reference would produce a separate "not found" violation.
   - What's unclear: Whether duplicate violations for the same missing resource are helpful or noisy.
   - Recommendation: Deduplicate by resource name per-resource. If ConfigMap `app-config` is referenced twice in the same Deployment (once in volume, once in envFrom), emit only one violation pointing to the first occurrence. Different resources (Deployment A and Deployment B both referencing the same missing ConfigMap) should each produce their own violation.

3. **Should RBAC rules also check for sensitive permissions beyond the 5 specified?**
   - What we know: There are many dangerous RBAC patterns beyond the 5 specified (e.g., `escalate` verb, `bind` verb, impersonation permissions, CSR approval).
   - What's unclear: Whether to expand scope beyond the 5 required rules.
   - Recommendation: Implement only the 5 specified rules for Phase 44. Additional RBAC checks can be added in a future phase. The 5 specified rules cover the most critical CIS Benchmark controls.

4. **NetworkPolicy selector matching (KA-X007): What if podSelector is empty?**
   - What we know: An empty `podSelector: {}` in a NetworkPolicy selects all pods in the namespace. This is a valid and common pattern (e.g., "deny all traffic by default").
   - What's unclear: Whether an empty podSelector should be flagged or skipped.
   - Recommendation: Skip the check when `podSelector` is empty (`{}` or no `matchLabels`). An empty selector intentionally matches all pods. Only check when `matchLabels` has specific entries and those entries match no pod template.

## Sources

### Primary (HIGH confidence)
- Codebase analysis: `src/lib/tools/k8s-analyzer/resource-registry.ts` -- ResourceRegistry with getByKind, getByName, getByLabels, getByNamespace already implemented
- Codebase analysis: `src/lib/tools/k8s-analyzer/types.ts` -- K8sCategory includes 'cross-resource' (10% weight); K8sLintRule interface with check(ctx)
- Codebase analysis: `src/lib/tools/k8s-analyzer/container-helpers.ts` -- getPodSpec/getContainerSpecs for all 6 workload kinds
- Codebase analysis: `src/lib/tools/k8s-analyzer/gvk-registry.ts` -- 19 supported GVK entries including all RBAC resource types
- Codebase analysis: `src/lib/tools/k8s-analyzer/engine.ts` -- totalRules formula `10 + allK8sRules.length` auto-adapts
- [Kubernetes RBAC Authorization](https://kubernetes.io/docs/reference/access-authn-authz/rbac/) -- Role/ClusterRole rules structure, RoleBinding/ClusterRoleBinding roleRef structure
- [Kubernetes Service Selectors](https://kubernetes.io/docs/concepts/services-networking/service/) -- Service spec.selector maps to Pod labels
- [Kubernetes Ingress Spec](https://kubernetes.io/docs/concepts/services-networking/ingress/) -- backend.service.name reference structure
- [Kubernetes Managing Service Accounts](https://kubernetes.io/docs/reference/access-authn-authz/service-accounts-admin/) -- default ServiceAccount auto-creation
- [CIS Kubernetes Benchmark](https://www.cisecurity.org/benchmark/kubernetes) -- Section 5.1.x RBAC controls (5.1.1, 5.1.2, 5.1.3, 5.1.4)

### Secondary (MEDIUM confidence)
- [Kubernetes NetworkPolicy Spec](https://kubernetes.io/docs/concepts/services-networking/network-policies/) -- podSelector.matchLabels structure
- [Kubernetes HPA Spec](https://kubernetes.io/docs/tasks/run-application/horizontal-pod-autoscale-walkthrough/) -- scaleTargetRef.kind + scaleTargetRef.name structure
- [kube-root-ca.crt ConfigMap](https://github.com/kubernetes/kubernetes/issues/112147) -- Auto-created in every namespace by rootcacertpublisher controller

### Tertiary (LOW confidence)
- None -- all findings verified against official K8s docs or existing codebase analysis

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- No new dependencies; identical stack to Phases 42/43 which are fully implemented
- Architecture: HIGH -- Direct extension of proven rule architecture; ResourceRegistry designed for this exact use case
- Cross-resource rule logic: HIGH -- Kubernetes API structures for selectors, references, and RBAC are well-documented and stable
- RBAC rule logic: HIGH -- CIS Benchmark controls have explicit field paths and values; Role/ClusterRole rules structure is straightforward
- Well-known resources whitelist: MEDIUM -- The `default` ServiceAccount and `kube-root-ca.crt` ConfigMap are verified; additional system resources may need to be added based on user feedback
- Pitfalls: HIGH -- Based on direct codebase analysis and Kubernetes API behavior analysis

**Research date:** 2026-02-23
**Valid until:** 2026-04-23 (stable domain; K8s RBAC and cross-resource APIs are GA and stable)
