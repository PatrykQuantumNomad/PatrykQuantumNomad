# Phase 42: Security Rules - Research

**Researched:** 2026-02-23
**Domain:** Kubernetes pod/container security static analysis, PSS Baseline/Restricted profiles, CIS Benchmark controls
**Confidence:** HIGH

## Summary

Phase 42 adds 20 security rules (KA-C001 through KA-C020) and a PSS compliance summary (SCORE-05) to the K8s Manifest Analyzer. These rules inspect pod and container security contexts, host namespace sharing, volume mounts, service account configuration, and secrets exposure. Every rule maps to either a Kubernetes Pod Security Standards (PSS) profile control (Baseline or Restricted) or a CIS Kubernetes Benchmark recommendation.

The codebase already has two proven patterns for this exact type of work: (1) the compose-validator's 14 security rules (`src/lib/tools/compose-validator/rules/security/`), which use the `ComposeLintRule` interface with per-rule `check(ctx)` functions that traverse YAML AST nodes via `isMap`/`isPair`/`isScalar`/`isSeq` helpers and resolve line numbers with `getNodeLine`; and (2) the K8s analyzer's own `K8sLintRule` interface defined in `types.ts` with `K8sRuleContext` providing `resources`, `registry`, `lineCounter`, and `rawText`. Phase 41 built the engine, parser, and resource registry -- Phase 42 plugs security rules into this existing architecture.

The critical implementation challenge is that K8s resources have different PodSpec nesting depths depending on kind: Pod uses `spec.containers`, Deployment/StatefulSet/DaemonSet use `spec.template.spec.containers`, and CronJob uses `spec.jobTemplate.spec.template.spec.containers`. Each security rule must extract containers from the correct path for each resource kind. A shared helper function `getContainers(resource)` / `getPodSpec(resource)` is essential to avoid duplicating this path-resolution logic in all 20 rules.

**Primary recommendation:** Follow the compose-validator security rule pattern exactly (one file per rule, category index, master index), but add a shared `container-helpers.ts` utility module that extracts containers and pod-level security context from any supported resource kind. Each rule uses JSON traversal on `resource.json` for value checks and AST traversal on `resource.doc` for line number resolution.

<phase_requirements>
## Phase Requirements

| ID | Description | PSS Profile | Severity |
|----|-------------|-------------|----------|
| SEC-01 | KA-C001 -- Container runs as privileged | PSS Baseline | error |
| SEC-02 | KA-C002 -- Privilege escalation allowed (allowPrivilegeEscalation != false) | PSS Restricted | error |
| SEC-03 | KA-C003 -- Container runs as root (runAsUser: 0) | PSS Restricted | warning |
| SEC-04 | KA-C004 -- Missing runAsNonRoot | PSS Restricted | warning |
| SEC-05 | KA-C005 -- Running with UID 0 (explicit runAsUser: 0) | PSS Restricted | error |
| SEC-06 | KA-C006 -- Host PID namespace shared | PSS Baseline | error |
| SEC-07 | KA-C007 -- Host IPC namespace shared | PSS Baseline | error |
| SEC-08 | KA-C008 -- Host network enabled | PSS Baseline | warning |
| SEC-09 | KA-C009 -- Host port specified | PSS Baseline | info |
| SEC-10 | KA-C010 -- Dangerous capabilities SYS_ADMIN, NET_RAW, ALL | PSS Baseline/Restricted | error |
| SEC-11 | KA-C011 -- Capabilities not dropped (ALL) | PSS Restricted | warning |
| SEC-12 | KA-C012 -- Filesystem not read-only | N/A (best practice) | warning |
| SEC-13 | KA-C013 -- Missing seccomp profile | PSS Baseline | warning |
| SEC-14 | KA-C014 -- Sensitive host path mounted | PSS Baseline | error |
| SEC-15 | KA-C015 -- Docker socket mounted | N/A (CIS) | error |
| SEC-16 | KA-C016 -- ServiceAccount token auto-mounted | N/A (CIS) | warning |
| SEC-17 | KA-C017 -- Default ServiceAccount used | N/A (CIS) | warning |
| SEC-18 | KA-C018 -- Secrets in environment variables (secretKeyRef or inline) | N/A (CIS) | warning |
| SEC-19 | KA-C019 -- Default namespace used | N/A (CIS) | info |
| SEC-20 | KA-C020 -- Missing security context entirely | N/A (best practice) | warning |
| SCORE-05 | PSS profile compliance summary -- count of Baseline/Restricted violations | N/A | N/A |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| yaml | 2.8.2 | YAML AST traversal via isMap/isPair/isScalar/isSeq + line resolution via getNodeLine | Already in project; same AST traversal pattern proven in 14 compose-validator security rules |
| typescript | 5.9.3 | Type-safe rule definitions using K8sLintRule interface | Already in project |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| (none) | -- | -- | No new dependencies needed; security rules are pure TypeScript functions operating on parsed JSON + YAML AST |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| JSON traversal (resource.json) for value checks | Full AST traversal for everything | JSON is simpler and less error-prone for reading values; AST is only needed for line number resolution |
| One file per rule | Single large rules file | One-file-per-rule matches compose-validator pattern, enables targeted review and testing |
| Shared helper for container extraction | Inline extraction in each rule | 20 rules x 6 resource kinds = 120 path-resolution duplications without helpers |

**Installation:**
```bash
# No new npm installs needed -- all dependencies already in package.json
```

## Architecture Patterns

### Recommended Project Structure
```
src/lib/tools/k8s-analyzer/
  rules/
    security/
      KA-C001-privileged-container.ts     # SEC-01
      KA-C002-privilege-escalation.ts      # SEC-02
      KA-C003-runs-as-root.ts              # SEC-03
      KA-C004-missing-run-as-non-root.ts   # SEC-04
      KA-C005-uid-zero.ts                  # SEC-05
      KA-C006-host-pid.ts                  # SEC-06
      KA-C007-host-ipc.ts                  # SEC-07
      KA-C008-host-network.ts              # SEC-08
      KA-C009-host-port.ts                 # SEC-09
      KA-C010-dangerous-capabilities.ts    # SEC-10
      KA-C011-capabilities-not-dropped.ts  # SEC-11
      KA-C012-writable-filesystem.ts       # SEC-12
      KA-C013-missing-seccomp.ts           # SEC-13
      KA-C014-sensitive-host-path.ts       # SEC-14
      KA-C015-docker-socket-mount.ts       # SEC-15
      KA-C016-sa-token-automount.ts        # SEC-16
      KA-C017-default-service-account.ts   # SEC-17
      KA-C018-secrets-in-env.ts            # SEC-18
      KA-C019-default-namespace.ts         # SEC-19
      KA-C020-missing-security-context.ts  # SEC-20
      index.ts                             # exports securityRules: K8sLintRule[]
    index.ts                               # exports allK8sRules, allDocumentedRules
  container-helpers.ts                     # getPodSpec, getContainers, getInitContainers helper
  engine.ts                                # Updated: add security rule loop after schema validation
  types.ts                                 # Already has K8sLintRule, K8sRuleContext (no changes needed)
  sample-manifest.ts                       # Updated: add security-violating resources
```

### Pattern 1: K8s Security Rule (one file per rule)
**What:** Each security rule implements the `K8sLintRule` interface with `check(ctx: K8sRuleContext)`. Rules iterate over `ctx.resources`, extract containers/podSpec via helpers, check JSON values, and resolve line numbers from YAML AST.
**When to use:** All 20 SEC rules.
**Example:**
```typescript
// Source: Adapted from compose-validator CV-C001 pattern + K8s types.ts K8sLintRule interface
import type { K8sLintRule, K8sRuleContext, K8sRuleViolation } from '../../types';
import { resolveInstancePath, getNodeLine } from '../../parser';
import { getContainerSpecs } from '../../container-helpers';

export const KAC001: K8sLintRule = {
  id: 'KA-C001',
  title: 'Container runs as privileged',
  severity: 'error',
  category: 'security',
  explanation:
    'Running a container in privileged mode disables most container isolation mechanisms. ' +
    'The container gains full access to the host kernel and devices. ' +
    'PSS Baseline profile prohibits spec.containers[*].securityContext.privileged=true.',
  fix: {
    description: 'Remove privileged: true or set it to false',
    beforeCode:
      'containers:\n  - name: app\n    securityContext:\n      privileged: true',
    afterCode:
      'containers:\n  - name: app\n    securityContext:\n      privileged: false',
  },

  check(ctx: K8sRuleContext): K8sRuleViolation[] {
    const violations: K8sRuleViolation[] = [];

    for (const resource of ctx.resources) {
      const containerSpecs = getContainerSpecs(resource);
      for (const { container, jsonPath } of containerSpecs) {
        const sc = container.securityContext as Record<string, unknown> | undefined;
        if (sc?.privileged === true) {
          const node = resolveInstancePath(resource.doc, `${jsonPath}/securityContext/privileged`);
          const { line, col } = getNodeLine(node, ctx.lineCounter);
          violations.push({
            ruleId: 'KA-C001',
            line,
            column: col,
            message: `Container '${container.name}' in ${resource.kind} '${resource.name}' runs in privileged mode (PSS Baseline violation).`,
          });
        }
      }
    }

    return violations;
  },
};
```

### Pattern 2: Container Extraction Helper (critical shared utility)
**What:** Extracts container arrays from any supported K8s resource kind, accounting for the different PodSpec nesting depths. Returns container JSON with the JSON Pointer path prefix for AST line resolution.
**When to use:** Every security rule that checks container-level fields (SEC-01 through SEC-05, SEC-09 through SEC-13, SEC-15, SEC-18, SEC-20).
**Example:**
```typescript
// Source: Derived from K8s API structure for workload resources
import type { ParsedResource } from './types';

export interface ContainerSpec {
  container: Record<string, unknown>;  // The container JSON object
  jsonPath: string;                     // JSON Pointer to this container in the doc
  containerType: 'container' | 'initContainer';
}

export interface PodSpec {
  podSpec: Record<string, unknown>;    // The pod-level spec object
  podSpecPath: string;                 // JSON Pointer to the podSpec in the doc
}

/** Map of kind -> JSON Pointer path to the pod spec */
const POD_SPEC_PATHS: Record<string, string> = {
  Pod: '/spec',
  Deployment: '/spec/template/spec',
  StatefulSet: '/spec/template/spec',
  DaemonSet: '/spec/template/spec',
  Job: '/spec/template/spec',
  CronJob: '/spec/jobTemplate/spec/template/spec',
};

/**
 * Get the PodSpec object and its JSON Pointer path for a resource.
 * Returns null for resource kinds that don't have a PodSpec (e.g., ConfigMap, Service).
 */
export function getPodSpec(resource: ParsedResource): PodSpec | null {
  const path = POD_SPEC_PATHS[resource.kind];
  if (!path) return null;

  // Navigate the JSON object along the path segments
  const segments = path.split('/').filter(s => s !== '');
  let current: unknown = resource.json;
  for (const segment of segments) {
    if (current && typeof current === 'object' && !Array.isArray(current)) {
      current = (current as Record<string, unknown>)[segment];
    } else {
      return null;
    }
  }

  if (!current || typeof current !== 'object') return null;
  return { podSpec: current as Record<string, unknown>, podSpecPath: path };
}

/**
 * Get all container specs (containers + initContainers) from a resource.
 * Returns an array of ContainerSpec with JSON Pointer paths for AST resolution.
 */
export function getContainerSpecs(resource: ParsedResource): ContainerSpec[] {
  const pod = getPodSpec(resource);
  if (!pod) return [];

  const specs: ContainerSpec[] = [];
  const { podSpec, podSpecPath } = pod;

  // Regular containers
  const containers = podSpec.containers as Record<string, unknown>[] | undefined;
  if (Array.isArray(containers)) {
    for (let i = 0; i < containers.length; i++) {
      specs.push({
        container: containers[i],
        jsonPath: `${podSpecPath}/containers/${i}`,
        containerType: 'container',
      });
    }
  }

  // Init containers
  const initContainers = podSpec.initContainers as Record<string, unknown>[] | undefined;
  if (Array.isArray(initContainers)) {
    for (let i = 0; i < initContainers.length; i++) {
      specs.push({
        container: initContainers[i],
        jsonPath: `${podSpecPath}/initContainers/${i}`,
        containerType: 'initContainer',
      });
    }
  }

  return specs;
}
```

### Pattern 3: Pod-Level Rule (host namespace, volumes)
**What:** Some rules check pod-level fields (hostPID, hostIPC, hostNetwork, volumes) rather than container-level fields. These use `getPodSpec()` and check fields directly on the pod spec.
**When to use:** SEC-06 through SEC-08, SEC-14, SEC-15, SEC-16, SEC-17, SEC-19.
**Example:**
```typescript
// SEC-06: Host PID namespace shared
check(ctx: K8sRuleContext): K8sRuleViolation[] {
  const violations: K8sRuleViolation[] = [];
  for (const resource of ctx.resources) {
    const pod = getPodSpec(resource);
    if (!pod) continue;
    if (pod.podSpec.hostPID === true) {
      const node = resolveInstancePath(resource.doc, `${pod.podSpecPath}/hostPID`);
      const { line, col } = getNodeLine(node, ctx.lineCounter);
      violations.push({
        ruleId: 'KA-C006',
        line, column: col,
        message: `${resource.kind} '${resource.name}' shares the host PID namespace (PSS Baseline violation).`,
      });
    }
  }
  return violations;
}
```

### Pattern 4: Engine Integration (adding rule loop)
**What:** The engine currently runs schema rules only. Phase 42 adds a security rule loop after schema validation and resource registry building. Rules receive the full `K8sRuleContext` with all resources and the registry.
**When to use:** Engine update in Phase 42.
**Example:**
```typescript
// In engine.ts, after registry build (Step 3), before sort (Step 4):
// ── Step 3.5: Run security rules ──────────────────────────────
const ruleCtx: K8sRuleContext = {
  resources: registry.getAll(),
  registry,
  lineCounter: parseResult.lineCounter,
  rawText,
};

for (const rule of allK8sRules) {
  const ruleViolations = rule.check(ruleCtx);
  if (ruleViolations.length === 0) {
    rulesPassed++;
  }
  violations.push(...ruleViolations);
  for (const v of ruleViolations) {
    rulesTriggered.add(v.ruleId);
  }
}

// Update total rule count
const totalRules = totalSchemaRules + allK8sRules.length;
```

### Pattern 5: PSS Compliance Summary (SCORE-05)
**What:** After all security rules run, compute a PSS compliance summary: count violations tagged as PSS Baseline vs Restricted. This is metadata attached to the analysis result, not a rule itself.
**When to use:** SCORE-05.
**Example:**
```typescript
// Each security rule metadata includes a pssProfile field (optional extension)
// After violations are collected, the engine or a helper computes:
interface PssComplianceSummary {
  baselineViolations: number;
  restrictedViolations: number;
  baselineCompliant: boolean;
  restrictedCompliant: boolean;
}

// Rule metadata maps rule IDs to PSS profiles
const PSS_RULE_PROFILES: Record<string, 'baseline' | 'restricted'> = {
  'KA-C001': 'baseline',   // privileged
  'KA-C002': 'restricted', // privilege escalation
  'KA-C003': 'restricted', // runs as root
  'KA-C004': 'restricted', // missing runAsNonRoot
  'KA-C005': 'restricted', // UID 0
  'KA-C006': 'baseline',   // host PID
  'KA-C007': 'baseline',   // host IPC
  'KA-C008': 'baseline',   // host network
  'KA-C009': 'baseline',   // host port
  'KA-C010': 'baseline',   // dangerous capabilities (also restricted)
  'KA-C011': 'restricted', // capabilities not dropped
  'KA-C013': 'baseline',   // missing seccomp
  'KA-C014': 'baseline',   // sensitive host path
};
```

### Pattern 6: Resource-Scoped Rule (non-workload resources)
**What:** Some rules apply to non-workload resources. SEC-17 (default ServiceAccount) applies to ServiceAccount resources directly. SEC-19 (default namespace) applies to any resource.
**When to use:** SEC-17, SEC-19.
**Example:**
```typescript
// SEC-19: Default namespace used
check(ctx: K8sRuleContext): K8sRuleViolation[] {
  const violations: K8sRuleViolation[] = [];
  for (const resource of ctx.resources) {
    // Skip cluster-scoped resources (Namespace, ClusterRole, ClusterRoleBinding)
    if (['Namespace', 'ClusterRole', 'ClusterRoleBinding'].includes(resource.kind)) continue;
    if (resource.namespace === 'default') {
      const node = resolveInstancePath(resource.doc, '/metadata');
      const { line, col } = getNodeLine(node, ctx.lineCounter);
      violations.push({
        ruleId: 'KA-C019',
        line, column: col,
        message: `${resource.kind} '${resource.name}' uses the default namespace. Use a dedicated namespace for isolation.`,
      });
    }
  }
  return violations;
}
```

### Anti-Patterns to Avoid
- **Duplicating PodSpec path resolution in every rule:** Create a shared helper. Without it, 15+ rules would each hardcode the same 6-entry kind-to-path map.
- **Using only JSON for line numbers:** JSON gives you the values but not the line positions. Must use `resolveInstancePath(resource.doc, jsonPath)` + `getNodeLine(node, ctx.lineCounter)` for accurate line numbers.
- **Checking only `spec.containers` without init containers:** K8s PSS profiles explicitly cover `initContainers` and `ephemeralContainers`. At minimum check both containers and initContainers.
- **Hardcoding container names in messages without resource context:** Always include both the container name AND the resource kind/name in violation messages for clear identification in multi-resource manifests.
- **Forgetting CronJob's extra nesting level:** CronJob is `spec.jobTemplate.spec.template.spec.containers`, not `spec.template.spec.containers`. The helper must handle this.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| PodSpec path resolution per resource kind | Inline `if (kind === 'Pod') ... else if (kind === 'Deployment') ...` in every rule | Shared `container-helpers.ts` with `getPodSpec()` / `getContainerSpecs()` | 6 resource kinds x 20 rules = 120 duplications; single source of truth prevents path errors |
| Line number resolution from JSON paths | String-based line counting or regex | `resolveInstancePath()` + `getNodeLine()` from `parser.ts` | Handles multi-byte chars, folded strings, comments; proven in Phase 41 |
| Sensitive path matching | Simple string equality | Regex patterns or prefix matching (e.g., `/etc`, `/proc`, `/sys`) | Path variations: `/etc/`, `/etc/shadow`, `/etc/passwd/`, trailing slashes |
| Secret env var name detection | Simple list of exact names | Suffix-based regex pattern (from compose-validator CV-C008) | Catches `DB_PASSWORD`, `API_SECRET_KEY`, `AUTH_TOKEN` etc. without false positives on `PASSWORD_MIN_LENGTH` |

**Key insight:** The compose-validator has already solved these problems for Docker Compose. The K8s version differs only in the data structure (nested PodSpec paths) and the security standards referenced (PSS profiles instead of CWE). The check logic, AST traversal, and line resolution patterns are identical.

## Common Pitfalls

### Pitfall 1: CronJob PodSpec Path is Two Levels Deeper
**What goes wrong:** Rules work on Deployment/Pod but silently skip CronJob containers because the PodSpec is at `spec.jobTemplate.spec.template.spec` (three extra nesting levels vs Pod).
**Why it happens:** CronJob wraps a Job template which wraps a Pod template.
**How to avoid:** The `POD_SPEC_PATHS` map in `container-helpers.ts` must include all 6 workload kinds with their correct paths. Test each rule against a CronJob resource specifically.
**Warning signs:** CronJob manifests with privileged containers get zero security violations.

### Pitfall 2: SEC-03 vs SEC-05 Overlap (runAsUser: 0)
**What goes wrong:** KA-C003 (runs as root, warning) and KA-C005 (UID 0, error) both fire for the same `runAsUser: 0` container.
**Why it happens:** The requirements list both as separate rules with different severities.
**How to avoid:** Make the distinction clear: KA-C005 checks for explicit `runAsUser: 0` (error-level, definite root). KA-C003 is the absence scenario -- container does not set `runAsNonRoot: true` AND does not set a non-zero `runAsUser`, meaning it *could* run as root depending on the image (warning-level, probable root). If `runAsUser: 0` is set, only KA-C005 fires (error). If `runAsUser` is absent and `runAsNonRoot` is not true, KA-C003 fires (warning).
**Warning signs:** Same container gets both warning and error for the same field.

### Pitfall 3: Pod-Level vs Container-Level SecurityContext
**What goes wrong:** Rules only check container-level `securityContext` and miss pod-level `spec.securityContext` settings that apply to all containers.
**Why it happens:** K8s has two security context scopes: `spec.securityContext` (pod-level, applies to all containers) and `spec.containers[*].securityContext` (container-level, overrides pod-level).
**How to avoid:** For fields like `runAsNonRoot` and `runAsUser`, check both pod-level and container-level. Pod-level `runAsNonRoot: true` satisfies the requirement for all containers unless a container overrides it. Container-level takes precedence.
**Warning signs:** A pod with `spec.securityContext.runAsNonRoot: true` but no container-level setting still triggers KA-C004.

### Pitfall 4: Line Numbers Point to Wrong Location in Multi-Doc YAML
**What goes wrong:** Security rule violation line numbers point to line 1 or to a location in a different document.
**Why it happens:** Using `resource.startLine` instead of resolving the specific field's AST node.
**How to avoid:** Always use `resolveInstancePath(resource.doc, jsonPointerPath)` + `getNodeLine(node, ctx.lineCounter)` to get the exact line of the violating field. The `lineCounter` is shared across all documents and gives absolute line positions in the full input.
**Warning signs:** All violations for a resource point to the same line (the resource start line).

### Pitfall 5: Missing Security Context vs Empty Security Context
**What goes wrong:** SEC-20 (missing security context entirely) fires even when `securityContext: {}` is present (empty object).
**Why it happens:** Treating `undefined` and `{}` the same way.
**How to avoid:** SEC-20 should only fire when `securityContext` is completely absent (undefined). An empty `securityContext: {}` is explicitly set (even though it has no useful settings) and other specific rules (SEC-01 through SEC-13) will catch the individual missing settings.
**Warning signs:** Container with `securityContext: {}` triggers both SEC-20 and specific field-level rules.

### Pitfall 6: Sensitive Host Path False Positives
**What goes wrong:** SEC-14 fires for benign hostPath mounts like `/data` or `/logs`.
**Why it happens:** Overly broad hostPath matching.
**How to avoid:** Maintain an explicit list of sensitive host paths: `/`, `/etc`, `/proc`, `/sys`, `/var/run`, `/var/lib/kubelet`, `/var/lib/docker`, `/root`, `/home`, `/boot`, `/dev`. Match as prefixes (e.g., `/etc/shadow` starts with `/etc`). Do NOT flag arbitrary hostPath mounts -- that is SEC-14's job (PSS Baseline prohibits ALL hostPath, but SEC-14 specifically targets *sensitive* paths). The PSS Baseline hostPath prohibition is a separate consideration.
**Warning signs:** User sees error for `hostPath: /app/data` which is unusual but not sensitive.

### Pitfall 7: Secrets in Env Vars -- secretKeyRef is NOT a Violation
**What goes wrong:** SEC-18 flags `valueFrom.secretKeyRef` as "secrets in environment variables."
**Why it happens:** Confusing the secret *delivery mechanism* with the actual problem. `secretKeyRef` is the RECOMMENDED way to inject secrets (from K8s Secrets objects) vs hardcoding values.
**How to avoid:** SEC-18 should flag env vars with hardcoded secret-looking values (suffix pattern: PASSWORD, TOKEN, SECRET, API_KEY, etc.) that have inline `value:` set. It should also flag env vars using `valueFrom.secretKeyRef` with a lower severity or informational note that secrets-as-env-vars are less secure than volume-mounted secrets, but this is a separate consideration. Primary focus: inline hardcoded secrets.
**Warning signs:** User using K8s Secrets properly via secretKeyRef gets a security warning.

## Code Examples

### Container Helper Utility (Verified against K8s API structure)
```typescript
// Source: K8s API docs -- PodSpec location per workload kind
// Pod:         spec.containers
// Deployment:  spec.template.spec.containers
// StatefulSet: spec.template.spec.containers
// DaemonSet:   spec.template.spec.containers
// Job:         spec.template.spec.containers
// CronJob:     spec.jobTemplate.spec.template.spec.containers

const POD_SPEC_PATHS: Record<string, string> = {
  Pod: '/spec',
  Deployment: '/spec/template/spec',
  StatefulSet: '/spec/template/spec',
  DaemonSet: '/spec/template/spec',
  Job: '/spec/template/spec',
  CronJob: '/spec/jobTemplate/spec/template/spec',
};

// Only these 6 kinds have PodSpec. Other resource kinds (ConfigMap, Service,
// Ingress, etc.) are skipped by security rules that check containers.
```

### Sensitive Host Paths List
```typescript
// Source: Elastic SIEM detection rules, CIS Kubernetes Benchmark 5.x
const SENSITIVE_HOST_PATHS = [
  '/',          // root filesystem
  '/etc',       // system configuration
  '/proc',      // process information
  '/sys',       // kernel parameters
  '/dev',       // device files
  '/boot',      // boot loader
  '/root',      // root home directory
  '/home',      // user home directories
  '/var/run',   // runtime data (incl. docker socket, containerd socket)
  '/var/lib/kubelet',  // kubelet data
  '/var/lib/docker',   // Docker data
  '/var/lib/containerd', // containerd data
  '/var/log',   // system logs
];

function isSensitiveHostPath(path: string): boolean {
  const normalized = path.replace(/\/+$/, ''); // strip trailing slashes
  return SENSITIVE_HOST_PATHS.some(
    sensitive => normalized === sensitive || normalized.startsWith(sensitive + '/')
  );
}
```

### Dangerous Capabilities List (PSS Baseline)
```typescript
// Source: https://kubernetes.io/docs/concepts/security/pod-security-standards/
// PSS Baseline allows only these capabilities to be added:
const PSS_BASELINE_ALLOWED_CAPS = new Set([
  'AUDIT_WRITE', 'CHOWN', 'DAC_OVERRIDE', 'FOWNER', 'FSETID',
  'KILL', 'MKNOD', 'NET_BIND_SERVICE', 'SETFCAP', 'SETGID',
  'SETPCAP', 'SETUID', 'SYS_CHROOT',
]);

// For SEC-10, flag any capability NOT in the allowed set:
// Specifically called out: SYS_ADMIN, NET_RAW, ALL (per requirements)
// But any capability outside the allowed set is a Baseline violation
const EXPLICITLY_DANGEROUS = new Set(['SYS_ADMIN', 'NET_RAW', 'ALL']);
```

### Rule Index Pattern (from compose-validator)
```typescript
// src/lib/tools/k8s-analyzer/rules/security/index.ts
import type { K8sLintRule } from '../../types';
import { KAC001 } from './KA-C001-privileged-container';
// ... imports for all 20 rules ...
import { KAC020 } from './KA-C020-missing-security-context';

export const securityRules: K8sLintRule[] = [
  KAC001, KAC002, KAC003, KAC004, KAC005,
  KAC006, KAC007, KAC008, KAC009, KAC010,
  KAC011, KAC012, KAC013, KAC014, KAC015,
  KAC016, KAC017, KAC018, KAC019, KAC020,
];
```

### Engine Integration Pattern
```typescript
// src/lib/tools/k8s-analyzer/rules/index.ts
import type { K8sLintRule } from '../types';
import { securityRules } from './security';

export const allK8sRules: K8sLintRule[] = [
  ...securityRules,
  // Phase 43 will add: ...reliabilityRules, ...bestPracticeRules
];
```

### PSS Compliance Summary Computation
```typescript
// Source: Kubernetes PSS profiles -- each security rule maps to a PSS profile
const PSS_BASELINE_RULES = new Set([
  'KA-C001', 'KA-C006', 'KA-C007', 'KA-C008', 'KA-C009',
  'KA-C010', 'KA-C013', 'KA-C014',
]);
const PSS_RESTRICTED_RULES = new Set([
  'KA-C002', 'KA-C003', 'KA-C004', 'KA-C005', 'KA-C011',
]);

// Note: Restricted profile inherits all Baseline controls
// So Baseline violations are also Restricted violations
// But we report them separately for clarity

export interface PssComplianceSummary {
  baselineViolations: number;
  restrictedViolations: number;   // Only restricted-specific violations
  totalPssViolations: number;     // baseline + restricted
  baselineCompliant: boolean;
  restrictedCompliant: boolean;
}

export function computePssCompliance(
  violations: K8sRuleViolation[]
): PssComplianceSummary {
  let baselineViolations = 0;
  let restrictedViolations = 0;

  for (const v of violations) {
    if (PSS_BASELINE_RULES.has(v.ruleId)) baselineViolations++;
    if (PSS_RESTRICTED_RULES.has(v.ruleId)) restrictedViolations++;
  }

  return {
    baselineViolations,
    restrictedViolations,
    totalPssViolations: baselineViolations + restrictedViolations,
    baselineCompliant: baselineViolations === 0,
    restrictedCompliant: baselineViolations === 0 && restrictedViolations === 0,
  };
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| PodSecurityPolicy (PSP) | Pod Security Standards (PSS) + PodSecurity admission controller | K8s 1.25 (2022) -- PSP removed | PSS is the current standard; all security rules should reference PSS profiles |
| Manual security audits | Static analysis tools (kubesec, kube-linter, Polaris, Trivy) | 2020+ | Industry standard to lint manifests before deployment |
| Binary "pass/fail" security checks | Profile-based compliance (Baseline, Restricted) | K8s 1.22 (2021) -- PSS introduced | Graduated approach lets teams adopt security incrementally |
| CIS Benchmark v1.6 | CIS Benchmark v1.8+ (2024-2025) | Ongoing | Section 5 (Policies) covers pod security standards alignment |

**Deprecated/outdated:**
- `PodSecurityPolicy (PSP)`: Removed in K8s 1.25; replaced by PSS + PodSecurity admission controller
- `beta.kubernetes.io/os` annotation: Replaced by `kubernetes.io/os` label
- `seccomp.security.alpha.kubernetes.io/*` annotations: Replaced by `spec.securityContext.seccompProfile` (GA in K8s 1.19)

## Open Questions

1. **SEC-18: Exact scope of "secrets in environment variables"**
   - What we know: The compose-validator uses a suffix-based regex pattern for env var names. K8s has two mechanisms: inline `value:` and `valueFrom.secretKeyRef`.
   - What's unclear: Should SEC-18 only flag inline hardcoded values with secret-looking names, or also flag `valueFrom.secretKeyRef` (which is the K8s-recommended approach but still injects secrets as env vars)?
   - Recommendation: Flag BOTH but with different messaging. Inline hardcoded secrets get the standard "secrets in environment variables" warning. `secretKeyRef` env vars get a softer "consider using volume-mounted secrets instead of env vars for sensitive data" info-level message. For Phase 42 scope, start with inline hardcoded values only (matching compose-validator behavior). The secretKeyRef case can be added later if needed.

2. **SCORE-05: Where does the PSS compliance summary live in the data model?**
   - What we know: K8sAnalysisResult already has `violations`, `score`, `resources`, `resourceSummary`. The PSS summary is a new computed metric.
   - What's unclear: Whether to add it to K8sEngineResult or compute it downstream in the nanostore.
   - Recommendation: Add a `pssCompliance: PssComplianceSummary` field to `K8sEngineResult` (and `K8sAnalysisResult`). Compute it in the engine after all security rules run. This keeps the engine as the single computation point, consistent with how `resourceSummary` is computed.

3. **Sample manifest updates: how many security violations to include?**
   - What we know: The current sample has 10 resources triggering schema-level rules. Adding security violations means adding containers with security issues.
   - What's unclear: Whether to modify existing resources or add new ones.
   - Recommendation: Add 2-3 new resources to the sample manifest that demonstrate security violations (privileged container, missing security context, host namespace sharing). Keep existing resources unchanged to preserve Phase 41 test coverage. Total sample size should remain manageable (~120-150 lines).

## Sources

### Primary (HIGH confidence)
- [Kubernetes Pod Security Standards](https://kubernetes.io/docs/concepts/security/pod-security-standards/) -- Complete control specifications for Baseline and Restricted profiles with exact field paths
- [Configure a Security Context for a Pod or Container](https://kubernetes.io/docs/tasks/configure-pod-container/security-context/) -- Official K8s docs on securityContext fields
- Codebase analysis: `src/lib/tools/compose-validator/rules/security/` -- 14 proven security rule implementations following the exact pattern needed
- Codebase analysis: `src/lib/tools/k8s-analyzer/types.ts` -- K8sLintRule interface, K8sRuleContext, K8sRuleViolation already defined
- Codebase analysis: `src/lib/tools/k8s-analyzer/engine.ts` -- Current engine architecture showing where rules integrate

### Secondary (MEDIUM confidence)
- [Elastic SIEM: Sensitive hostPath Volume](https://www.elastic.co/guide/en/security/current/kubernetes-pod-created-with-a-sensitive-hostpath-volume.html) -- Sensitive host path list used in production security monitoring
- [CIS Kubernetes Benchmarks](https://www.cisecurity.org/benchmark/kubernetes) -- Section 5 policies covering pod security (requires registration for full document)
- [Kubernetes API Reference](https://kubernetes.io/docs/reference/generated/kubernetes-api/v1.26/) -- PodSpec structure per workload kind

### Tertiary (LOW confidence)
- None -- all findings verified against official K8s docs or existing codebase patterns

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- No new dependencies; all libraries already in project and proven in compose-validator
- Architecture: HIGH -- Direct adaptation of compose-validator rule architecture with well-understood K8s-specific modifications (container helpers, PodSpec paths)
- Rule logic: HIGH -- PSS profile controls have explicit field paths and allowed values documented by K8s project; no ambiguity
- Pitfalls: HIGH -- Based on direct codebase analysis of compose-validator rules and K8s API structure analysis
- SCORE-05 (PSS summary): MEDIUM -- Data model extension is straightforward but exact integration point (engine vs nanostore) needs a decision

**Research date:** 2026-02-23
**Valid until:** 2026-04-23 (stable domain; PSS profiles are GA and stable since K8s 1.25)
