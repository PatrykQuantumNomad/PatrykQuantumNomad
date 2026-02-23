---
phase: 42-security-rules
plan: 01
subsystem: k8s-analyzer
tags: [kubernetes, security, pss, cis-benchmark, container-security, pod-security-standards]

# Dependency graph
requires:
  - phase: 41-foundation-schema-infrastructure
    provides: "K8sLintRule interface, ParsedResource, parser (resolveInstancePath, getNodeLine), types.ts"
provides:
  - "container-helpers.ts with getPodSpec/getContainerSpecs for 6 workload kinds"
  - "20 security rules (KA-C001 through KA-C020) implementing K8sLintRule"
  - "securityRules array aggregator in rules/security/index.ts"
  - "allK8sRules and allDocumentedK8sRules master arrays in rules/index.ts"
  - "getK8sRuleById lookup function"
  - "DocumentedK8sRule interface for static page generation"
affects: [42-02, 43-reliability-best-practice, 44-cross-resource, 45-engine-integration, 46-scoring]

# Tech tracking
tech-stack:
  added: []
  patterns: [one-file-per-rule, container-helpers extraction, pod-level vs container-level checks, JSON Pointer path building]

key-files:
  created:
    - src/lib/tools/k8s-analyzer/container-helpers.ts
    - src/lib/tools/k8s-analyzer/rules/security/KA-C001-privileged-container.ts
    - src/lib/tools/k8s-analyzer/rules/security/KA-C002-privilege-escalation.ts
    - src/lib/tools/k8s-analyzer/rules/security/KA-C003-runs-as-root.ts
    - src/lib/tools/k8s-analyzer/rules/security/KA-C004-missing-run-as-non-root.ts
    - src/lib/tools/k8s-analyzer/rules/security/KA-C005-uid-zero.ts
    - src/lib/tools/k8s-analyzer/rules/security/KA-C006-host-pid.ts
    - src/lib/tools/k8s-analyzer/rules/security/KA-C007-host-ipc.ts
    - src/lib/tools/k8s-analyzer/rules/security/KA-C008-host-network.ts
    - src/lib/tools/k8s-analyzer/rules/security/KA-C009-host-port.ts
    - src/lib/tools/k8s-analyzer/rules/security/KA-C010-dangerous-capabilities.ts
    - src/lib/tools/k8s-analyzer/rules/security/KA-C011-capabilities-not-dropped.ts
    - src/lib/tools/k8s-analyzer/rules/security/KA-C012-writable-filesystem.ts
    - src/lib/tools/k8s-analyzer/rules/security/KA-C013-missing-seccomp.ts
    - src/lib/tools/k8s-analyzer/rules/security/KA-C014-sensitive-host-path.ts
    - src/lib/tools/k8s-analyzer/rules/security/KA-C015-docker-socket-mount.ts
    - src/lib/tools/k8s-analyzer/rules/security/KA-C016-sa-token-automount.ts
    - src/lib/tools/k8s-analyzer/rules/security/KA-C017-default-service-account.ts
    - src/lib/tools/k8s-analyzer/rules/security/KA-C018-secrets-in-env.ts
    - src/lib/tools/k8s-analyzer/rules/security/KA-C019-default-namespace.ts
    - src/lib/tools/k8s-analyzer/rules/security/KA-C020-missing-security-context.ts
    - src/lib/tools/k8s-analyzer/rules/security/index.ts
    - src/lib/tools/k8s-analyzer/rules/index.ts
  modified: []

key-decisions:
  - "SEC-03/SEC-05 no-overlap: KA-C005 fires for explicit runAsUser:0 (error), KA-C003 skips that case"
  - "KA-C020 fires only for undefined securityContext, not empty object {} (strict 'in' check)"
  - "KA-C018 flags inline value only, not valueFrom.secretKeyRef (K8s-recommended approach)"
  - "KA-C014 uses prefix matching with 13 sensitive host paths from CIS/Elastic SIEM"
  - "Pod-level securityContext inheritance: C003, C004, C005, C013 check both levels"

patterns-established:
  - "K8s security rule pattern: import types + parser + container-helpers, check(ctx) iterates resources and containers"
  - "Container-level rule: getContainerSpecs(resource) -> iterate -> check container.securityContext fields"
  - "Pod-level rule: getPodSpec(resource) -> check podSpec fields (hostPID, volumes, automount, etc.)"
  - "Resource-scoped rule: iterate all resources, skip cluster-scoped kinds, check resource-level metadata"
  - "JSON Pointer path building: ${jsonPath}/securityContext/field for AST line resolution"

requirements-completed: []

# Metrics
duration: 6min
completed: 2026-02-23
---

# Phase 42 Plan 01: Container Helpers and Security Rules Summary

**20 K8s security rules (KA-C001 through KA-C020) covering PSS Baseline/Restricted profiles and CIS Benchmark controls with shared container extraction helpers for 6 workload kinds**

## Performance

- **Duration:** 6 min
- **Started:** 2026-02-23T17:23:43Z
- **Completed:** 2026-02-23T17:29:42Z
- **Tasks:** 2
- **Files created:** 23

## Accomplishments
- Created container-helpers.ts with getPodSpec/getContainerSpecs handling Pod, Deployment, StatefulSet, DaemonSet, Job, and CronJob (including CronJob's deeper nesting at /spec/jobTemplate/spec/template/spec)
- Implemented 20 security rules covering PSS Baseline (C001, C006-C010, C013-C014), PSS Restricted (C002-C005, C011), CIS Benchmark (C015-C019), and best practice (C012, C020)
- Enforced SEC-03/SEC-05 distinction: KA-C005 fires for explicit runAsUser:0, KA-C003 skips that container to prevent overlap
- Created rules/security/index.ts (securityRules array) and rules/index.ts (allK8sRules, allDocumentedK8sRules, getK8sRuleById)

## Task Commits

Each task was committed atomically:

1. **Task 1: Create container helpers and first 10 security rules** - `88fb111` (feat)
2. **Task 2: Create remaining 10 security rules** - `26cfb50` (feat)

**Plan metadata:** (pending)

## Files Created/Modified
- `src/lib/tools/k8s-analyzer/container-helpers.ts` - PodSpec/container extraction for 6 workload kinds
- `src/lib/tools/k8s-analyzer/rules/security/KA-C001-privileged-container.ts` - PSS Baseline: privileged mode (error)
- `src/lib/tools/k8s-analyzer/rules/security/KA-C002-privilege-escalation.ts` - PSS Restricted: allowPrivilegeEscalation (error)
- `src/lib/tools/k8s-analyzer/rules/security/KA-C003-runs-as-root.ts` - PSS Restricted: could run as root (warning)
- `src/lib/tools/k8s-analyzer/rules/security/KA-C004-missing-run-as-non-root.ts` - PSS Restricted: missing runAsNonRoot (warning)
- `src/lib/tools/k8s-analyzer/rules/security/KA-C005-uid-zero.ts` - PSS Restricted: explicit UID 0 (error)
- `src/lib/tools/k8s-analyzer/rules/security/KA-C006-host-pid.ts` - PSS Baseline: host PID namespace (error)
- `src/lib/tools/k8s-analyzer/rules/security/KA-C007-host-ipc.ts` - PSS Baseline: host IPC namespace (error)
- `src/lib/tools/k8s-analyzer/rules/security/KA-C008-host-network.ts` - PSS Baseline: host network (warning)
- `src/lib/tools/k8s-analyzer/rules/security/KA-C009-host-port.ts` - PSS Baseline: host port (info)
- `src/lib/tools/k8s-analyzer/rules/security/KA-C010-dangerous-capabilities.ts` - PSS Baseline: dangerous caps (error)
- `src/lib/tools/k8s-analyzer/rules/security/KA-C011-capabilities-not-dropped.ts` - PSS Restricted: drop ALL (warning)
- `src/lib/tools/k8s-analyzer/rules/security/KA-C012-writable-filesystem.ts` - Best practice: readOnlyRootFilesystem (warning)
- `src/lib/tools/k8s-analyzer/rules/security/KA-C013-missing-seccomp.ts` - PSS Baseline: seccomp profile (warning)
- `src/lib/tools/k8s-analyzer/rules/security/KA-C014-sensitive-host-path.ts` - PSS Baseline: sensitive hostPath (error)
- `src/lib/tools/k8s-analyzer/rules/security/KA-C015-docker-socket-mount.ts` - CIS: Docker socket (error)
- `src/lib/tools/k8s-analyzer/rules/security/KA-C016-sa-token-automount.ts` - CIS: SA token automount (warning)
- `src/lib/tools/k8s-analyzer/rules/security/KA-C017-default-service-account.ts` - CIS: default SA (warning)
- `src/lib/tools/k8s-analyzer/rules/security/KA-C018-secrets-in-env.ts` - CIS: hardcoded secrets (warning)
- `src/lib/tools/k8s-analyzer/rules/security/KA-C019-default-namespace.ts` - CIS: default namespace (info)
- `src/lib/tools/k8s-analyzer/rules/security/KA-C020-missing-security-context.ts` - Best practice: missing securityContext (warning)
- `src/lib/tools/k8s-analyzer/rules/security/index.ts` - securityRules array (20 rules)
- `src/lib/tools/k8s-analyzer/rules/index.ts` - allK8sRules, allDocumentedK8sRules, getK8sRuleById

## Decisions Made
- SEC-03/SEC-05 no-overlap enforced: KA-C005 fires for explicit runAsUser:0 (error), KA-C003 checks broader "could run as root" absence scenario and skips when runAsUser:0 is set
- KA-C020 fires ONLY for undefined securityContext (not empty object {}) using `!('securityContext' in container)` check
- KA-C018 flags inline `value:` only, NOT `valueFrom.secretKeyRef` which is the K8s-recommended secret delivery
- KA-C014 uses prefix matching with 13 sensitive host paths from CIS/Elastic SIEM list
- Pod-level securityContext inheritance handled in KA-C003, KA-C004, KA-C005, and KA-C013 (pod-level satisfies unless container overrides)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- All 20 security rules compile and implement K8sLintRule interface
- rules/index.ts exports allK8sRules ready for engine integration (Phase 45)
- Phase 42-02 (sample manifest and engine wiring) can proceed
- Phase 43 (reliability/best-practice rules) can add to allK8sRules via spread operator

## Self-Check: PASSED

- All 23 created files verified on disk
- Both task commits (88fb111, 26cfb50) verified in git log
- 20 security rule files confirmed
- All 20 rule files contain `category: 'security'`
- container-helpers.ts contains CronJob path `/spec/jobTemplate/spec/template/spec`
- rules/index.ts exports allK8sRules and allDocumentedK8sRules
- TypeScript compiles with no k8s-analyzer errors

---
*Phase: 42-security-rules*
*Completed: 2026-02-23*
