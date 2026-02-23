---
phase: 43-reliability-best-practice-rules
plan: 02
subsystem: k8s-analyzer
tags: [kubernetes, best-practice, resource-limits, labels, probes, namespace, priority-class, env-vars]

# Dependency graph
requires:
  - phase: 42-security-rules
    provides: "K8sLintRule interface, container-helpers (getContainerSpecs/getPodSpec), parser (resolveInstancePath/getNodeLine)"
provides:
  - "12 best practice rules (KA-B001 through KA-B012) implementing K8sLintRule"
  - "bestPracticeRules array aggregator in rules/best-practice/index.ts"
affects: [43-03, 45-engine-integration, 46-scoring]

# Tech tracking
tech-stack:
  added: []
  patterns: [resource-limit-check, label-presence-check, probe-port-cross-validation, duplicate-env-detection, cluster-scoped-skip-list]

key-files:
  created:
    - src/lib/tools/k8s-analyzer/rules/best-practice/KA-B001-missing-cpu-requests.ts
    - src/lib/tools/k8s-analyzer/rules/best-practice/KA-B002-missing-cpu-limits.ts
    - src/lib/tools/k8s-analyzer/rules/best-practice/KA-B003-missing-memory-requests.ts
    - src/lib/tools/k8s-analyzer/rules/best-practice/KA-B004-missing-memory-limits.ts
    - src/lib/tools/k8s-analyzer/rules/best-practice/KA-B005-missing-labels.ts
    - src/lib/tools/k8s-analyzer/rules/best-practice/KA-B006-missing-namespace.ts
    - src/lib/tools/k8s-analyzer/rules/best-practice/KA-B007-ssh-port-exposed.ts
    - src/lib/tools/k8s-analyzer/rules/best-practice/KA-B008-nodeport-service.ts
    - src/lib/tools/k8s-analyzer/rules/best-practice/KA-B009-liveness-probe-port.ts
    - src/lib/tools/k8s-analyzer/rules/best-practice/KA-B010-readiness-probe-port.ts
    - src/lib/tools/k8s-analyzer/rules/best-practice/KA-B011-missing-priority-class.ts
    - src/lib/tools/k8s-analyzer/rules/best-practice/KA-B012-duplicate-env-keys.ts
    - src/lib/tools/k8s-analyzer/rules/best-practice/index.ts
  modified: []

key-decisions:
  - "B005 fires ONE violation per resource listing all missing labels (not one per label)"
  - "B006 checks for literally absent namespace field, distinct from KA-C019 default namespace"
  - "B006 skip list extended: Namespace, ClusterRole, ClusterRoleBinding, PersistentVolume, Node, CustomResourceDefinition"
  - "B009/B010 filter to containerType=container only (exclude initContainers for probe checks)"
  - "B009/B010 build declared port set with both numeric containerPort and string name values"
  - "B009/B010 skip containers with no ports array to avoid false positives"
  - "B012 fires per duplicate occurrence, not per pair (Map tracks first-seen index)"
  - "Probe port helpers duplicated in B009/B010 files for rule isolation (15 lines each)"

requirements-completed: [BP-01, BP-02, BP-03, BP-04, BP-05, BP-06, BP-07, BP-08, BP-09, BP-10, BP-11, BP-12]

# Metrics
duration: 4min
completed: 2026-02-23
---

# Phase 43 Plan 02: Best Practice Rules Summary

**12 best practice rules (KA-B001 through KA-B012) covering resource requests/limits, labels, namespace, SSH port, NodePort service, probe port validation, priority class, and duplicate env vars**

## Performance

- **Duration:** 4 min
- **Started:** 2026-02-23T18:24:52Z
- **Completed:** 2026-02-23T18:29:33Z
- **Tasks:** 2
- **Files created:** 13

## Accomplishments

- Created 4 resource limit rules (KA-B001 through KA-B004) checking CPU/memory requests/limits on ALL containers including initContainers, with AST resolution pointing to /resources when present or container path when absent
- Implemented KA-B005 (missing labels) firing ONE violation per resource listing all missing labels (app, version), checking metadata.labels for key presence
- Implemented KA-B006 (missing namespace) checking for literally undefined namespace field in metadata, distinct from KA-C019 (default namespace), with extended cluster-scoped skip list (6 kinds)
- Created KA-B007 (SSH port 22) iterating all container ports arrays to flag port 22 exposure
- Created KA-B008 (NodePort service) checking Service resources for spec.type === 'NodePort'
- Implemented KA-B009/B010 (probe port mismatch) with cross-field validation comparing liveness/readiness probe ports against declared container ports, supporting both numeric and named port references
- Created KA-B011 (missing priorityClassName) using getPodSpec to check pod-level field on all workload kinds
- Created KA-B012 (duplicate env keys) using Map-based first-occurrence tracking to fire one violation per duplicate (not per pair)
- Created best-practice/index.ts exporting bestPracticeRules array with all 12 rules

## Task Commits

Each task was committed atomically:

1. **Task 1: Create best practice rules KA-B001 through KA-B006** - `9bab75c` (feat)
2. **Task 2: Create best practice rules KA-B007 through KA-B012 and index** - `8d08ff5` (feat)

## Files Created/Modified

- `src/lib/tools/k8s-analyzer/rules/best-practice/KA-B001-missing-cpu-requests.ts` - Missing CPU requests (warning, container-level)
- `src/lib/tools/k8s-analyzer/rules/best-practice/KA-B002-missing-cpu-limits.ts` - Missing CPU limits (warning, container-level)
- `src/lib/tools/k8s-analyzer/rules/best-practice/KA-B003-missing-memory-requests.ts` - Missing memory requests (warning, container-level)
- `src/lib/tools/k8s-analyzer/rules/best-practice/KA-B004-missing-memory-limits.ts` - Missing memory limits (warning, container-level)
- `src/lib/tools/k8s-analyzer/rules/best-practice/KA-B005-missing-labels.ts` - Missing required labels app/version (info, resource-level)
- `src/lib/tools/k8s-analyzer/rules/best-practice/KA-B006-missing-namespace.ts` - Missing namespace (info, resource-level)
- `src/lib/tools/k8s-analyzer/rules/best-practice/KA-B007-ssh-port-exposed.ts` - SSH port 22 exposed (info, container-level)
- `src/lib/tools/k8s-analyzer/rules/best-practice/KA-B008-nodeport-service.ts` - NodePort service type (info, Service-level)
- `src/lib/tools/k8s-analyzer/rules/best-practice/KA-B009-liveness-probe-port.ts` - Liveness probe port mismatch (warning, container-level)
- `src/lib/tools/k8s-analyzer/rules/best-practice/KA-B010-readiness-probe-port.ts` - Readiness probe port mismatch (warning, container-level)
- `src/lib/tools/k8s-analyzer/rules/best-practice/KA-B011-missing-priority-class.ts` - Missing priorityClassName (info, pod-level)
- `src/lib/tools/k8s-analyzer/rules/best-practice/KA-B012-duplicate-env-keys.ts` - Duplicate env var keys (warning, container-level)
- `src/lib/tools/k8s-analyzer/rules/best-practice/index.ts` - bestPracticeRules array (12 rules)

## Decisions Made

- B005 fires ONE violation per resource listing all missing labels, not one violation per missing label
- B006 checks for literally absent namespace (metadata.namespace === undefined), while KA-C019 checks for namespace === 'default' -- both can fire for the same resource when namespace is omitted (correct behavior)
- B006 cluster-scoped skip list extended to 6 kinds: Namespace, ClusterRole, ClusterRoleBinding, PersistentVolume, Node, CustomResourceDefinition
- B009/B010 only check containerType === 'container' (not initContainers), as probes are not meaningful for init containers
- B009/B010 skip containers with no declared ports array to avoid false positives
- B009/B010 support both numeric port numbers and string port names for cross-validation
- B012 fires per duplicate occurrence (the later one), not per pair, using Map-based first-seen tracking
- Probe port helper functions (getProbePort, getDeclaredPorts) duplicated in B009/B010 files rather than shared, to maintain rule isolation (~15 lines each)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- All 12 best practice rules compile and implement K8sLintRule interface
- best-practice/index.ts exports bestPracticeRules ready for master index integration (Plan 43-03)
- Phase 43-03 (master index integration, sample manifest updates) can proceed
- Engine's totalRules = 10 + allK8sRules.length formula will automatically account for the 12 new rules once integrated

## Self-Check: PASSED
