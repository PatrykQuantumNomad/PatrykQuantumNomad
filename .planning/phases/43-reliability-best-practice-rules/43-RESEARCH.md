# Phase 43: Reliability & Best Practice Rules - Research

**Researched:** 2026-02-23
**Domain:** Kubernetes reliability checks (probes, replicas, update strategy, image tags) and best practice checks (resource limits, labels, ports, env vars) -- static analysis of K8s manifests
**Confidence:** HIGH

## Summary

Phase 43 adds 24 new lint rules (12 reliability KA-R001--KA-R012 and 12 best practice KA-B001--KA-B012) to the K8s Manifest Analyzer, following the exact same architecture proven in Phase 42's 20 security rules. The rules plug into the existing engine via the `allK8sRules` array in `rules/index.ts`. No new dependencies are needed -- all rules are pure TypeScript functions operating on `ParsedResource` JSON data with YAML AST line resolution.

The rule implementation patterns fall into four categories: (1) **container-level checks** using `getContainerSpecs()` -- probes, image tags, resource requests/limits, ports, env vars (REL-01/02/03/09/10, BP-01/02/03/04/07/09/10/12); (2) **pod-level checks** using `getPodSpec()` -- anti-affinity, topology spread constraints, priorityClassName (REL-07/08, BP-11); (3) **deployment-level checks** on `resource.json` directly -- replicas, update strategy, selector/template label mismatch (REL-04/06/11); and (4) **resource-level checks** on resource metadata/spec -- missing labels, missing namespace, CronJob deadline, NodePort service type, PodDisruptionBudget presence (REL-05/12, BP-05/06/08). The existing `container-helpers.ts`, `parser.ts` (resolveInstancePath/getNodeLine), and the `ResourceRegistry` provide all the infrastructure needed.

The key integration points are: updating `rules/index.ts` to spread `...reliabilityRules, ...bestPracticeRules` into `allK8sRules` (the engine already iterates this array), and updating the sample manifest to trigger representative reliability/best-practice violations. The engine's `totalRules = 10 + allK8sRules.length` formula automatically accounts for the new rules without any engine changes.

**Primary recommendation:** Follow the Phase 42 security rule pattern exactly (one file per rule, category index, master index integration), creating `rules/reliability/` and `rules/best-practice/` directories with their own `index.ts` aggregators.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| REL-01 | KA-R001 -- Missing liveness probe (warning) | Container-level check via getContainerSpecs; check for absence of `livenessProbe` on each container |
| REL-02 | KA-R002 -- Missing readiness probe (warning) | Container-level check via getContainerSpecs; check for absence of `readinessProbe` on each container |
| REL-03 | KA-R003 -- Identical liveness and readiness probes (warning) | Container-level check; deep-compare livenessProbe and readinessProbe JSON objects |
| REL-04 | KA-R004 -- Single replica Deployment (warning) | Deployment-level check; `resource.json.spec.replicas === 1` or undefined (default is 1) |
| REL-05 | KA-R005 -- Missing PodDisruptionBudget (info) | Cross-resource check; use `registry.getByKind('PodDisruptionBudget')` -- note: PDB is not in GVK registry (see Open Questions) |
| REL-06 | KA-R006 -- No rolling update strategy (warning) | Deployment-level check; `spec.strategy.type` not `RollingUpdate` or strategy absent |
| REL-07 | KA-R007 -- Missing pod anti-affinity (info) | Pod-level check via getPodSpec; check for absence of `affinity.podAntiAffinity` |
| REL-08 | KA-R008 -- Missing topology spread constraint (info) | Pod-level check via getPodSpec; check for absence of `topologySpreadConstraints` array |
| REL-09 | KA-R009 -- Image uses latest or no tag (warning) | Container-level check; parse image string for tag portion after `:` |
| REL-10 | KA-R010 -- Image pull policy not Always (info) | Container-level check; `imagePullPolicy` not set to `Always` |
| REL-11 | KA-R011 -- Selector/template label mismatch (error) | Deployment/StatefulSet/DaemonSet-level check; compare `spec.selector.matchLabels` with `spec.template.metadata.labels` |
| REL-12 | KA-R012 -- CronJob missing startingDeadlineSeconds (warning) | CronJob-level check; `resource.json.spec.startingDeadlineSeconds` absent |
| BP-01 | KA-B001 -- Missing CPU requests (warning) | Container-level check; `resources.requests.cpu` absent |
| BP-02 | KA-B002 -- Missing CPU limits (warning) | Container-level check; `resources.limits.cpu` absent |
| BP-03 | KA-B003 -- Missing memory requests (warning) | Container-level check; `resources.requests.memory` absent |
| BP-04 | KA-B004 -- Missing memory limits (warning) | Container-level check; `resources.limits.memory` absent |
| BP-05 | KA-B005 -- Missing required labels app, version (info) | Resource-level check on resource.labels for `app` and `version` keys |
| BP-06 | KA-B006 -- Missing namespace (info) | Resource-level check; resource.namespace === 'default' AND no explicit namespace in JSON |
| BP-07 | KA-B007 -- SSH port exposed (info) | Container-level check; containerPort === 22 in ports array |
| BP-08 | KA-B008 -- NodePort service type used (info) | Service-level check; `spec.type === 'NodePort'` |
| BP-09 | KA-B009 -- Liveness probe port not in container ports (warning) | Container-level check; extract probe port, verify against declared containerPort values |
| BP-10 | KA-B010 -- Readiness probe port not in container ports (warning) | Container-level check; extract probe port, verify against declared containerPort values |
| BP-11 | KA-B011 -- Missing priorityClassName (info) | Pod-level check via getPodSpec; `priorityClassName` absent |
| BP-12 | KA-B012 -- Duplicate environment variable keys (warning) | Container-level check; scan env array for duplicate `name` fields |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| yaml | 2.8.2 | YAML AST traversal via resolveInstancePath + line resolution via getNodeLine | Already in project; same pattern proven in 20 security rules |
| typescript | 5.9.3 | Type-safe rule definitions using K8sLintRule interface | Already in project |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| (none) | -- | -- | No new dependencies needed; all 24 rules are pure TypeScript functions |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Deep equality via JSON.stringify for probe comparison (REL-03) | lodash.isEqual or custom deep compare | JSON.stringify is sufficient for comparing probe objects since key ordering is consistent from YAML parsing; no need for external dependency |
| Registry-based PDB lookup (REL-05) | Skip PDB check entirely | PDB is not in GVK registry; simplest approach is to check if any PodDisruptionBudget resource exists in the registry by kind |

**Installation:**
```bash
# No new npm installs needed -- all dependencies already in package.json
```

## Architecture Patterns

### Recommended Project Structure
```
src/lib/tools/k8s-analyzer/
  rules/
    reliability/
      KA-R001-missing-liveness-probe.ts      # REL-01
      KA-R002-missing-readiness-probe.ts      # REL-02
      KA-R003-identical-probes.ts             # REL-03
      KA-R004-single-replica.ts               # REL-04
      KA-R005-missing-pdb.ts                  # REL-05
      KA-R006-no-rolling-update.ts            # REL-06
      KA-R007-missing-anti-affinity.ts        # REL-07
      KA-R008-missing-topology-spread.ts      # REL-08
      KA-R009-latest-image-tag.ts             # REL-09
      KA-R010-image-pull-policy.ts            # REL-10
      KA-R011-selector-mismatch.ts            # REL-11
      KA-R012-cronjob-missing-deadline.ts     # REL-12
      index.ts                                # exports reliabilityRules: K8sLintRule[]
    best-practice/
      KA-B001-missing-cpu-requests.ts         # BP-01
      KA-B002-missing-cpu-limits.ts           # BP-02
      KA-B003-missing-memory-requests.ts      # BP-03
      KA-B004-missing-memory-limits.ts        # BP-04
      KA-B005-missing-labels.ts               # BP-05
      KA-B006-missing-namespace.ts            # BP-06
      KA-B007-ssh-port-exposed.ts             # BP-07
      KA-B008-nodeport-service.ts             # BP-08
      KA-B009-liveness-probe-port.ts          # BP-09
      KA-B010-readiness-probe-port.ts         # BP-10
      KA-B011-missing-priority-class.ts       # BP-11
      KA-B012-duplicate-env-keys.ts           # BP-12
      index.ts                                # exports bestPracticeRules: K8sLintRule[]
    security/                                 # existing from Phase 42
      index.ts                                # existing
    index.ts                                  # updated: spread reliabilityRules + bestPracticeRules
  container-helpers.ts                        # existing (no changes)
  engine.ts                                   # existing (no changes needed -- totalRules formula already dynamic)
  sample-manifest.ts                          # updated: add reliability/BP violation examples
```

### Pattern 1: Container-Level Rule (probes, image, resources, ports, env)
**What:** Rules that check container-level fields. Iterate `ctx.resources`, call `getContainerSpecs(resource)`, inspect container JSON object, resolve AST node for line number.
**When to use:** REL-01/02/03/09/10, BP-01/02/03/04/07/09/10/12
**Example:**
```typescript
// Source: Adapted from KA-C001 (Phase 42 security rule pattern)
import type { K8sLintRule, K8sRuleContext, K8sRuleViolation } from '../../types';
import { resolveInstancePath, getNodeLine } from '../../parser';
import { getContainerSpecs } from '../../container-helpers';

export const KAR001: K8sLintRule = {
  id: 'KA-R001',
  title: 'Missing liveness probe',
  severity: 'warning',
  category: 'reliability',
  explanation:
    'The container does not define a livenessProbe. Without a liveness probe, ' +
    'Kubernetes cannot detect if the application has entered a broken state ' +
    'and will not restart it automatically.',
  fix: {
    description: 'Add a livenessProbe to the container spec',
    beforeCode:
      'containers:\n  - name: app\n    image: myapp:1.0',
    afterCode:
      'containers:\n  - name: app\n    image: myapp:1.0\n    livenessProbe:\n      httpGet:\n        path: /healthz\n        port: 8080\n      initialDelaySeconds: 10\n      periodSeconds: 15',
  },

  check(ctx: K8sRuleContext): K8sRuleViolation[] {
    const violations: K8sRuleViolation[] = [];

    for (const resource of ctx.resources) {
      const containerSpecs = getContainerSpecs(resource);
      for (const { container, jsonPath } of containerSpecs) {
        if (!container.livenessProbe) {
          const node = resolveInstancePath(resource.doc, jsonPath);
          const { line, col } = getNodeLine(node, ctx.lineCounter);
          violations.push({
            ruleId: 'KA-R001',
            line,
            column: col,
            message: `Container '${container.name}' in ${resource.kind} '${resource.name}' has no liveness probe.`,
          });
        }
      }
    }

    return violations;
  },
};
```

### Pattern 2: Deployment-Level Rule (replicas, strategy, selector)
**What:** Rules that check deployment-specific fields directly on `resource.json.spec`. Only apply to specific resource kinds (Deployment, StatefulSet, DaemonSet).
**When to use:** REL-04/06/11
**Example:**
```typescript
// Source: Adapted from Phase 42 pod-level pattern
import type { K8sLintRule, K8sRuleContext, K8sRuleViolation } from '../../types';
import { resolveInstancePath, getNodeLine } from '../../parser';

export const KAR004: K8sLintRule = {
  id: 'KA-R004',
  title: 'Single replica Deployment',
  severity: 'warning',
  category: 'reliability',
  explanation:
    'The Deployment specifies only 1 replica (or omits the replicas field, ' +
    'which defaults to 1). A single-replica Deployment has no redundancy ' +
    'and will experience downtime during rolling updates or node failures.',
  fix: {
    description: 'Set replicas to 2 or more for production workloads',
    beforeCode: 'spec:\n  replicas: 1',
    afterCode: 'spec:\n  replicas: 2',
  },

  check(ctx: K8sRuleContext): K8sRuleViolation[] {
    const violations: K8sRuleViolation[] = [];

    for (const resource of ctx.resources) {
      if (resource.kind !== 'Deployment') continue;

      const spec = resource.json.spec as Record<string, unknown> | undefined;
      if (!spec) continue;

      const replicas = spec.replicas as number | undefined;
      // Default replicas is 1 when omitted
      if (replicas === undefined || replicas === 1) {
        const nodePath = replicas !== undefined ? '/spec/replicas' : '/spec';
        const node = resolveInstancePath(resource.doc, nodePath);
        const { line, col } = getNodeLine(node, ctx.lineCounter);
        violations.push({
          ruleId: 'KA-R004',
          line,
          column: col,
          message: `Deployment '${resource.name}' has ${replicas ?? 1} replica. Use 2+ replicas for high availability.`,
        });
      }
    }

    return violations;
  },
};
```

### Pattern 3: CronJob-Specific Rule
**What:** Rules that check CronJob-specific fields. CronJob has unique nesting: `spec.startingDeadlineSeconds` is at the CronJob spec level (NOT inside the jobTemplate).
**When to use:** REL-12
**Example:**
```typescript
// Source: Kubernetes CronJob API reference
import type { K8sLintRule, K8sRuleContext, K8sRuleViolation } from '../../types';
import { resolveInstancePath, getNodeLine } from '../../parser';

export const KAR012: K8sLintRule = {
  id: 'KA-R012',
  title: 'CronJob missing startingDeadlineSeconds',
  severity: 'warning',
  category: 'reliability',
  explanation:
    'The CronJob does not set startingDeadlineSeconds. Without a deadline, ' +
    'if the CronJob controller misses a schedule (e.g., due to controller downtime), ' +
    'it may create many jobs at once when it recovers, overwhelming the cluster.',
  fix: {
    description: 'Add startingDeadlineSeconds to the CronJob spec',
    beforeCode:
      'apiVersion: batch/v1\nkind: CronJob\nspec:\n  schedule: "*/5 * * * *"',
    afterCode:
      'apiVersion: batch/v1\nkind: CronJob\nspec:\n  schedule: "*/5 * * * *"\n  startingDeadlineSeconds: 200',
  },

  check(ctx: K8sRuleContext): K8sRuleViolation[] {
    const violations: K8sRuleViolation[] = [];

    for (const resource of ctx.resources) {
      if (resource.kind !== 'CronJob') continue;

      const spec = resource.json.spec as Record<string, unknown> | undefined;
      if (!spec) continue;

      if (spec.startingDeadlineSeconds === undefined) {
        const node = resolveInstancePath(resource.doc, '/spec');
        const { line, col } = getNodeLine(node, ctx.lineCounter);
        violations.push({
          ruleId: 'KA-R012',
          line,
          column: col,
          message: `CronJob '${resource.name}' does not set startingDeadlineSeconds. Missed schedules may cause job storms on recovery.`,
        });
      }
    }

    return violations;
  },
};
```

### Pattern 4: Service-Level Rule (non-workload resource)
**What:** Rules that check Service-specific fields. Services do not have PodSpec, so `getPodSpec()` returns null. Check `resource.json.spec` directly.
**When to use:** BP-08
**Example:**
```typescript
export const KAB008: K8sLintRule = {
  id: 'KA-B008',
  title: 'NodePort service type used',
  severity: 'info',
  category: 'best-practice',
  explanation:
    'The Service uses type NodePort, which exposes ports directly on cluster nodes. ' +
    'NodePort services bypass load balancers and are harder to secure in production. ' +
    'Prefer ClusterIP with an Ingress controller or LoadBalancer type.',
  fix: {
    description: 'Use ClusterIP type with an Ingress, or LoadBalancer type',
    beforeCode: 'spec:\n  type: NodePort',
    afterCode: 'spec:\n  type: ClusterIP',
  },

  check(ctx: K8sRuleContext): K8sRuleViolation[] {
    const violations: K8sRuleViolation[] = [];

    for (const resource of ctx.resources) {
      if (resource.kind !== 'Service') continue;

      const spec = resource.json.spec as Record<string, unknown> | undefined;
      if (spec?.type === 'NodePort') {
        const node = resolveInstancePath(resource.doc, '/spec/type');
        const { line, col } = getNodeLine(node, ctx.lineCounter);
        violations.push({
          ruleId: 'KA-B008',
          line,
          column: col,
          message: `Service '${resource.name}' uses NodePort type. Prefer ClusterIP with Ingress or LoadBalancer.`,
        });
      }
    }

    return violations;
  },
};
```

### Pattern 5: Probe Port Mismatch Check (container cross-field comparison)
**What:** Rules that cross-reference two fields within the same container. For BP-09/BP-10, extract the probe port (from httpGet.port or tcpSocket.port) and verify it appears in the container's `ports[*].containerPort` list.
**When to use:** BP-09, BP-10
**Example:**
```typescript
// Extract port from a probe object (httpGet.port or tcpSocket.port)
function getProbePort(probe: Record<string, unknown>): number | string | null {
  const httpGet = probe.httpGet as Record<string, unknown> | undefined;
  if (httpGet?.port !== undefined) return httpGet.port as number | string;
  const tcpSocket = probe.tcpSocket as Record<string, unknown> | undefined;
  if (tcpSocket?.port !== undefined) return tcpSocket.port as number | string;
  return null;
}

// Get declared container ports as a Set for O(1) lookup
function getDeclaredPorts(container: Record<string, unknown>): Set<number | string> {
  const ports = container.ports as Record<string, unknown>[] | undefined;
  if (!Array.isArray(ports)) return new Set();
  const declared = new Set<number | string>();
  for (const p of ports) {
    if (p.containerPort !== undefined) declared.add(p.containerPort as number);
    if (p.name !== undefined) declared.add(p.name as string);  // named port reference
  }
  return declared;
}
```

### Pattern 6: Selector/Template Label Mismatch (Deployment-level cross-field)
**What:** REL-11 compares `spec.selector.matchLabels` with `spec.template.metadata.labels`. Every key-value pair in `matchLabels` must appear in the template labels (the template may have additional labels). This is an error-level rule because a mismatch causes the Deployment to fail.
**When to use:** REL-11
**Example:**
```typescript
// Applies to Deployment, StatefulSet, DaemonSet
const SELECTOR_RESOURCE_KINDS = new Set(['Deployment', 'StatefulSet', 'DaemonSet']);

check(ctx: K8sRuleContext): K8sRuleViolation[] {
  const violations: K8sRuleViolation[] = [];

  for (const resource of ctx.resources) {
    if (!SELECTOR_RESOURCE_KINDS.has(resource.kind)) continue;

    const spec = resource.json.spec as Record<string, unknown> | undefined;
    if (!spec) continue;

    const selector = spec.selector as Record<string, unknown> | undefined;
    const matchLabels = selector?.matchLabels as Record<string, string> | undefined;
    if (!matchLabels) continue;  // no selector to check

    const template = spec.template as Record<string, unknown> | undefined;
    const templateMeta = template?.metadata as Record<string, unknown> | undefined;
    const templateLabels = templateMeta?.labels as Record<string, string> | undefined;

    for (const [key, value] of Object.entries(matchLabels)) {
      if (!templateLabels || templateLabels[key] !== value) {
        // Selector key not found or value mismatch in template labels
        const node = resolveInstancePath(resource.doc, '/spec/selector/matchLabels');
        const { line, col } = getNodeLine(node, ctx.lineCounter);
        violations.push({
          ruleId: 'KA-R011',
          line, column: col,
          message: `${resource.kind} '${resource.name}': selector label '${key}=${value}' not found in template labels.`,
        });
        break;  // One violation per resource is sufficient
      }
    }
  }

  return violations;
}
```

### Anti-Patterns to Avoid
- **Checking probes only on init containers:** Init containers do not need liveness/readiness probes. REL-01/02/03 and BP-09/10 should filter to `containerType === 'container'` only, not initContainers.
- **Treating missing `spec.replicas` as 0:** The Kubernetes default for omitted replicas is 1, not 0. REL-04 must treat `undefined` as 1.
- **Comparing probe objects with `===`:** Two separate JS objects are never `===` equal. Use `JSON.stringify()` for deep comparison of probe objects (REL-03).
- **Hardcoding CronJob deadline path wrong:** `startingDeadlineSeconds` is at `/spec/startingDeadlineSeconds` on CronJob (NOT inside the jobTemplate). Do not confuse with the PodSpec path in container-helpers.ts.
- **Firing BP-06 (missing namespace) on cluster-scoped resources:** Namespace, ClusterRole, ClusterRoleBinding are cluster-scoped and must be skipped, same as KA-C019.
- **Duplicate violations from BP-05 for missing labels:** Fire once per resource listing all missing labels, not once per missing label. Same approach for REL-11 -- one violation per resource for selector mismatch.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Container extraction from workload resources | Inline PodSpec path resolution in each rule | Existing `getContainerSpecs()` / `getPodSpec()` from `container-helpers.ts` | Already built in Phase 42; 6 kinds x 24 rules = 144 potential duplications |
| Line number resolution | String-based regex counting | Existing `resolveInstancePath()` + `getNodeLine()` from `parser.ts` | Proven in Phase 41/42; handles multi-byte, folded strings, comments |
| Image tag parsing | Complex regex for all image formats | Simple split on `:` and check last segment | Docker image format is `[registry/]name[:tag][@digest]`; a split on `:` with digest check is sufficient |
| Deep object comparison (probes) | Custom recursive comparison | `JSON.stringify()` with sorted keys | Probe objects are small (3-5 keys); JSON.stringify works because YAML parsing produces consistent key ordering |
| Cross-resource PDB lookup | Manual resource iteration | Existing `registry.getByKind('PodDisruptionBudget')` | ResourceRegistry already indexes by kind |

**Key insight:** Phase 42 built all the infrastructure. Phase 43 is purely additive -- 24 new rule files following the exact same pattern, two new category index files, and one update to the master index. No architectural changes needed.

## Common Pitfalls

### Pitfall 1: Init Containers Do Not Need Probes
**What goes wrong:** REL-01/02 (missing probes) fires for init containers, producing false positives.
**Why it happens:** `getContainerSpecs()` returns both containers and initContainers. Init containers run to completion before the main containers start -- liveness/readiness probes are meaningless for them.
**How to avoid:** Filter `getContainerSpecs()` results to `containerType === 'container'` for probe-related rules (REL-01, REL-02, REL-03, BP-09, BP-10). Init containers DO need resource limits (BP-01--04) and image tag checks (REL-09).
**Warning signs:** A CronJob with an initContainer that has no probes (normal) triggers probe warnings.

### Pitfall 2: Kubernetes Default Replicas is 1, Not 0
**What goes wrong:** REL-04 only checks for `replicas === 1` and misses the case where `replicas` is omitted entirely (which defaults to 1).
**Why it happens:** The JSON object simply has no `replicas` key when the user omits it.
**How to avoid:** Check both `replicas === 1` and `replicas === undefined`. Both conditions mean a single replica. The fix message should say "has 1 replica" in both cases.
**Warning signs:** A Deployment without an explicit `replicas` field gets no single-replica warning.

### Pitfall 3: Image Tag Parsing Edge Cases
**What goes wrong:** REL-09 incorrectly identifies images with digest references (`myimage@sha256:abc123`) as having no tag, or fails to detect `latest` in registry-prefixed images like `gcr.io/project/app:latest`.
**Why it happens:** Docker image references have the format `[registry[:port]/]name[:tag][@digest]`. The registry portion can contain `:` (port numbers), making naive `:` splitting unreliable.
**How to avoid:** Parse the image string by first stripping any `@sha256:...` digest suffix. Then split the remaining string on `/` to separate the registry from the name. Only the last segment after the final `/` should be checked for `:tag`. If no tag is present after the image name, treat it as using `latest` implicitly. If the tag is literally `latest`, flag it.
**Warning signs:** `registry.example.com:5000/myapp:1.0` is flagged because the `:5000` port is misinterpreted as the tag boundary.

### Pitfall 4: Probe Port Comparison -- Named Ports vs Numeric Ports
**What goes wrong:** BP-09/BP-10 flags a mismatch when the probe references a named port (e.g., `httpGet.port: "http"`) and the container defines `ports: [{name: "http", containerPort: 8080}]`.
**Why it happens:** Comparing a string port name against a numeric containerPort without considering the name field.
**How to avoid:** Build the declared ports set with both numeric `containerPort` values AND string `name` values. When a probe references a port, check if it matches either the numeric port or the named port. If the probe uses a number, compare against containerPort numbers. If the probe uses a string, compare against port names.
**Warning signs:** A properly configured probe using named ports gets a false positive mismatch warning.

### Pitfall 5: BP-06 vs KA-C019 Overlap
**What goes wrong:** BP-06 (missing namespace, best-practice, info) and KA-C019 (default namespace, security, info) fire for the same resource, creating redundant noise.
**Why it happens:** Both detect resources in the default namespace. KA-C019 checks `resource.namespace === 'default'` from the security perspective. BP-06 checks for an explicitly missing namespace field from the best-practice perspective.
**How to avoid:** Make BP-06 specifically check whether the `namespace` field is literally absent from the YAML metadata (i.e., the user did not write a namespace at all), while KA-C019 fires for resources that are explicitly or implicitly in the `default` namespace. In practice, BP-06 should check the raw JSON: `resource.json.metadata.namespace` is undefined. KA-C019 already handles the `resource.namespace === 'default'` case. This distinction means: if a user writes `namespace: default`, KA-C019 fires but BP-06 does NOT (namespace was explicitly set). If a user omits namespace entirely, BOTH fire (this is correct -- the resource is missing namespace AND ends up in default).
**Warning signs:** Identical diagnostic for every resource that omits namespace.

### Pitfall 6: REL-11 Selector Mismatch -- Template Labels Are a Superset
**What goes wrong:** REL-11 reports a mismatch when template labels have additional keys beyond what the selector specifies.
**Why it happens:** Checking for exact equality between selector matchLabels and template labels.
**How to avoid:** The correct check is: every key-value pair in `selector.matchLabels` must exist in `template.metadata.labels`. Template labels can have additional keys. The selector is a subset of template labels, not an exact match. Only flag when a selector key is MISSING from template labels or has a DIFFERENT value.
**Warning signs:** A Deployment with selector `{app: myapp}` and template labels `{app: myapp, version: v1}` incorrectly triggers a mismatch.

### Pitfall 7: REL-05 PDB Check -- PodDisruptionBudget May Not Be in Registry
**What goes wrong:** REL-05 uses `registry.getByKind('PodDisruptionBudget')` but PDB is not in the GVK_REGISTRY (only 19 resource types are supported for schema validation). This means PDB resources will not be added to the registry even if present in the manifest.
**Why it happens:** The engine only adds resources to the registry if they pass GVK identification and schema validation. PDB resources get rejected at the KA-S004 (unknown GVK) stage.
**How to avoid:** For REL-05, acknowledge that PDB detection is best-effort within the analyzer's scope. Since PDB is not a recognized resource type, `registry.getByKind('PodDisruptionBudget')` will always return empty. The simplest approach is to emit this as a general informational recommendation for Deployments with 2+ replicas -- "Consider defining a PodDisruptionBudget" -- rather than trying to detect PDB presence. The message should say "No PodDisruptionBudget found in the manifest" to be technically accurate.
**Warning signs:** PDB is present in the manifest but the rule still fires because PDB resources are not parsed into the registry.

### Pitfall 8: JSON.stringify for Probe Comparison -- Key Ordering
**What goes wrong:** `JSON.stringify(livenessProbe) === JSON.stringify(readinessProbe)` returns false even when the probes are logically identical, because object keys are in different order.
**Why it happens:** JavaScript does not guarantee object key ordering (though V8 preserves insertion order for string keys).
**How to avoid:** Since YAML parsing with the `yaml` library preserves key order from the source document, and both probes are parsed from the same document with consistent serialization, `JSON.stringify` should work for YAML-parsed objects. However, for robustness, sort the keys before stringifying or use a recursive comparison function. The simplest safe approach: `JSON.stringify(obj, Object.keys(obj).sort())` -- but note this only sorts top-level keys. For nested objects, a simple recursive sort is needed. Alternatively, compare the specific known probe fields individually (httpGet, tcpSocket, exec, initialDelaySeconds, periodSeconds, timeoutSeconds, successThreshold, failureThreshold).
**Warning signs:** Two visually identical probes in the YAML are not detected as identical.

## Code Examples

### Image Tag Parser
```typescript
// Source: Docker image reference specification
/**
 * Parse an image string and return the tag portion.
 * Returns null if the image uses a digest reference (@sha256:...).
 * Returns 'latest' if no tag is specified (implicit latest).
 * Returns the tag string otherwise.
 */
function getImageTag(image: string): string | null {
  // If image uses a digest reference, tag is irrelevant
  if (image.includes('@')) return null;

  // Split on '/' to separate registry from image name
  const parts = image.split('/');
  const lastPart = parts[parts.length - 1]; // e.g., "app:1.0" or "app"

  const colonIndex = lastPart.indexOf(':');
  if (colonIndex === -1) {
    return 'latest'; // no tag means implicit :latest
  }

  return lastPart.substring(colonIndex + 1);
}

// Usage in KA-R009:
const tag = getImageTag(container.image as string);
if (tag === 'latest' || tag === '') {
  // Flag: image uses latest or no tag
}
```

### Probe Object Deep Comparison (REL-03)
```typescript
// Source: Kubernetes probe specification
/**
 * Compare two probe objects for logical equality.
 * Uses JSON.stringify with sorted keys for reliable comparison.
 */
function probesAreIdentical(
  probe1: Record<string, unknown>,
  probe2: Record<string, unknown>,
): boolean {
  return stableStringify(probe1) === stableStringify(probe2);
}

function stableStringify(obj: unknown): string {
  if (obj === null || obj === undefined) return String(obj);
  if (typeof obj !== 'object') return JSON.stringify(obj);
  if (Array.isArray(obj)) {
    return '[' + obj.map(stableStringify).join(',') + ']';
  }
  const sorted = Object.keys(obj as Record<string, unknown>).sort();
  return '{' + sorted.map(k =>
    JSON.stringify(k) + ':' + stableStringify((obj as Record<string, unknown>)[k])
  ).join(',') + '}';
}
```

### Category Index Pattern (reliability/index.ts)
```typescript
// Source: Adapted from security/index.ts pattern (Phase 42)
import type { K8sLintRule } from '../../types';

import { KAR001 } from './KA-R001-missing-liveness-probe';
import { KAR002 } from './KA-R002-missing-readiness-probe';
import { KAR003 } from './KA-R003-identical-probes';
import { KAR004 } from './KA-R004-single-replica';
import { KAR005 } from './KA-R005-missing-pdb';
import { KAR006 } from './KA-R006-no-rolling-update';
import { KAR007 } from './KA-R007-missing-anti-affinity';
import { KAR008 } from './KA-R008-missing-topology-spread';
import { KAR009 } from './KA-R009-latest-image-tag';
import { KAR010 } from './KA-R010-image-pull-policy';
import { KAR011 } from './KA-R011-selector-mismatch';
import { KAR012 } from './KA-R012-cronjob-missing-deadline';

/** All 12 reliability rules for K8s manifest validation. */
export const reliabilityRules: K8sLintRule[] = [
  KAR001, KAR002, KAR003, KAR004, KAR005, KAR006,
  KAR007, KAR008, KAR009, KAR010, KAR011, KAR012,
];
```

### Master Index Update (rules/index.ts)
```typescript
// Source: Current rules/index.ts with Phase 43 additions
import type { K8sLintRule, K8sSeverity, K8sCategory, K8sRuleFix } from '../types';
import { securityRules } from './security';
import { reliabilityRules } from './reliability';
import { bestPracticeRules } from './best-practice';

/** Common documentation shape shared by K8sLintRule and SchemaRuleMetadata. */
export interface DocumentedK8sRule {
  id: string;
  title: string;
  severity: K8sSeverity;
  category: K8sCategory;
  explanation: string;
  fix: K8sRuleFix;
}

/** All custom lint rules with check() methods. */
export const allK8sRules: K8sLintRule[] = [
  ...securityRules,
  ...reliabilityRules,
  ...bestPracticeRules,
];

/** All documented rules for static page generation. */
export const allDocumentedK8sRules: DocumentedK8sRule[] = [
  ...(allK8sRules as DocumentedK8sRule[]),
];

/** Look up a rule by ID. Returns undefined if not found. */
export function getK8sRuleById(id: string): K8sLintRule | undefined {
  return allK8sRules.find((r) => r.id === id);
}
```

### Resource Limit Check Pattern (BP-01 through BP-04)
```typescript
// Source: Kubernetes resource management best practices
// All four resource rules follow the same pattern; only field name differs
check(ctx: K8sRuleContext): K8sRuleViolation[] {
  const violations: K8sRuleViolation[] = [];

  for (const resource of ctx.resources) {
    const containerSpecs = getContainerSpecs(resource);
    for (const { container, jsonPath } of containerSpecs) {
      const resources = container.resources as Record<string, unknown> | undefined;
      const requests = resources?.requests as Record<string, unknown> | undefined;

      if (!requests?.cpu) {
        const nodePath = resources
          ? `${jsonPath}/resources`
          : jsonPath;
        const node = resolveInstancePath(resource.doc, nodePath);
        const { line, col } = getNodeLine(node, ctx.lineCounter);
        violations.push({
          ruleId: 'KA-B001',
          line,
          column: col,
          message: `Container '${container.name}' in ${resource.kind} '${resource.name}' has no CPU request defined.`,
        });
      }
    }
  }

  return violations;
}
```

### Duplicate Env Keys Check (BP-12)
```typescript
// Source: Kubernetes container spec -- env is an array, duplicates take last value
check(ctx: K8sRuleContext): K8sRuleViolation[] {
  const violations: K8sRuleViolation[] = [];

  for (const resource of ctx.resources) {
    const containerSpecs = getContainerSpecs(resource);
    for (const { container, jsonPath } of containerSpecs) {
      const envList = container.env as Record<string, unknown>[] | undefined;
      if (!Array.isArray(envList) || envList.length < 2) continue;

      const seen = new Map<string, number>(); // name -> first index
      for (let i = 0; i < envList.length; i++) {
        const name = envList[i].name as string | undefined;
        if (typeof name !== 'string') continue;

        if (seen.has(name)) {
          const node = resolveInstancePath(
            resource.doc,
            `${jsonPath}/env/${i}/name`,
          );
          const { line, col } = getNodeLine(node, ctx.lineCounter);
          violations.push({
            ruleId: 'KA-B012',
            line,
            column: col,
            message: `Container '${container.name}' in ${resource.kind} '${resource.name}' has duplicate env var '${name}'. The later value overrides the earlier one.`,
          });
        } else {
          seen.set(name, i);
        }
      }
    }
  }

  return violations;
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| No probes required | Liveness/readiness probes expected on all production containers | K8s 1.0+ (always recommended) | Industry standard for production-readiness |
| Replicas field required | Replicas defaults to 1 when omitted | K8s 1.0+ | Many users omit replicas and get single-replica by default |
| `Recreate` strategy common | `RollingUpdate` is the default strategy for Deployments | K8s 1.2+ | Rolling update is the standard for zero-downtime deployments |
| Resource limits optional | Resource requests and limits expected on all containers | K8s 1.8+ (ResourceQuota enforcement) | LimitRange and ResourceQuota enforcement makes limits essential |
| `latest` tag acceptable | Pinned image tags strongly recommended | Docker/K8s best practice (always) | latest tag prevents rollback and breaks reproducibility |
| topologySpreadConstraints N/A | topologySpreadConstraints GA in K8s 1.19 | K8s 1.19 (2020) | Replaces pod anti-affinity for many use cases |

**Deprecated/outdated:**
- `PodDisruptionBudget v1beta1`: Removed in K8s 1.25; use `policy/v1` PDB (note: PDB is not in the analyzer's GVK registry)
- `spec.strategy.rollingUpdate` without `maxSurge`/`maxUnavailable`: These have defaults (25%) but explicit values are recommended

## Open Questions

1. **REL-05: PodDisruptionBudget detection limitation**
   - What we know: PDB (policy/v1) is not in the GVK_REGISTRY. Resources not in the GVK registry are rejected at the KA-S004 stage and never enter the ResourceRegistry.
   - What's unclear: Whether to add PDB to the GVK registry (expanding scope beyond Phase 43), or accept the limitation.
   - Recommendation: Do NOT add PDB to the GVK registry in Phase 43 (that's a Phase 41 schema infrastructure change). Instead, implement REL-05 as a general informational recommendation on Deployments: "Consider adding a PodDisruptionBudget for high-availability workloads." This accurately reflects the limitation without requiring infrastructure changes.

2. **REL-01/02: Should probe checks apply to DaemonSet?**
   - What we know: DaemonSets typically run infrastructure components (log collectors, monitoring agents) where probe behavior may differ from regular application workloads.
   - What's unclear: Whether missing probes on DaemonSet containers should have the same severity as on Deployment containers.
   - Recommendation: Apply probe checks to all workload kinds equally (Pod, Deployment, StatefulSet, DaemonSet, Job, CronJob). However, skip Job and CronJob containers since they are batch workloads that run to completion -- probes are less meaningful for them. DaemonSets should still get probe warnings because they run long-lived containers.

3. **Sample manifest updates: which violations to demonstrate?**
   - What we know: The current sample manifest already has some resources without probes, without resource limits, etc. We need to add explicit examples.
   - What's unclear: How many new resources to add without bloating the sample.
   - Recommendation: Modify existing resources minimally (e.g., ensure at least one Deployment has no probes and replicas: 1) and add 1-2 new resources that demonstrate reliability/BP violations (a CronJob without startingDeadlineSeconds, a NodePort Service, a Deployment with latest tag). Keep total manifest under 250 lines.

## Sources

### Primary (HIGH confidence)
- Codebase analysis: `src/lib/tools/k8s-analyzer/rules/security/` -- 20 proven security rules establishing the exact file structure, import pattern, check function signature, and violation construction
- Codebase analysis: `src/lib/tools/k8s-analyzer/container-helpers.ts` -- getPodSpec/getContainerSpecs for all 6 workload kinds
- Codebase analysis: `src/lib/tools/k8s-analyzer/parser.ts` -- resolveInstancePath/getNodeLine for AST line resolution
- Codebase analysis: `src/lib/tools/k8s-analyzer/engine.ts` -- totalRules formula `10 + allK8sRules.length` already accommodates new rules
- Codebase analysis: `src/lib/tools/k8s-analyzer/types.ts` -- K8sLintRule, K8sRuleContext, K8sCategory includes 'reliability' and 'best-practice'
- Codebase analysis: `src/lib/tools/k8s-analyzer/resource-registry.ts` -- getByKind() for cross-resource lookups
- [Kubernetes Probes Documentation](https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/) -- Official probe configuration reference
- [Kubernetes CronJob API Reference](https://kubernetes.io/docs/concepts/workloads/controllers/cron-jobs/) -- startingDeadlineSeconds documentation
- [Kubernetes Resource Management](https://kubernetes.io/docs/concepts/configuration/manage-resources-containers/) -- Resource requests and limits best practices

### Secondary (MEDIUM confidence)
- [Kubernetes Recommended Labels](https://kubernetes.io/docs/concepts/overview/working-with-objects/common-labels/) -- `app.kubernetes.io/name`, `app.kubernetes.io/version` (note: the requirement says `app` and `version`, not the full qualified labels)
- [Kubernetes Deployment Strategy](https://kubernetes.io/docs/concepts/workloads/controllers/deployment/#strategy) -- RollingUpdate vs Recreate

### Tertiary (LOW confidence)
- None -- all findings verified against codebase and official K8s docs

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- No new dependencies; identical stack to Phase 42 which is fully implemented
- Architecture: HIGH -- Direct replication of Phase 42 security rule pattern; all infrastructure already exists
- Rule logic: HIGH -- K8s API fields for probes, replicas, strategy, resources, labels are well-documented and stable
- Pitfalls: HIGH -- Based on direct codebase analysis and K8s API behavior analysis
- PDB detection (REL-05): MEDIUM -- Limited by GVK registry scope; workaround is documented

**Research date:** 2026-02-23
**Valid until:** 2026-04-23 (stable domain; K8s reliability/best-practice patterns are mature and stable)
