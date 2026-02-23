---
phase: 44-cross-resource-validation-rbac
plan: 01
subsystem: k8s-analyzer
tags: [kubernetes, cross-resource, validation, lint-rules, service-selector, ingress, configmap, secret, pvc, serviceaccount, networkpolicy, hpa]

# Dependency graph
requires:
  - phase: 41-k8s-parser-registry
    provides: "ResourceRegistry with getByName/getByKind O(1) lookups"
  - phase: 42-security-rules
    provides: "K8sLintRule pattern, container-helpers, parser AST navigation"
provides:
  - "8 cross-resource validation rules (KA-X001 through KA-X008)"
  - "Well-known resources whitelist for false positive suppression"
  - "crossResourceRules array for engine integration"
  - "TEMPLATE_LABEL_PATHS reusable constant for pod template label navigation"
affects: [44-02, 44-03, k8s-engine-integration]

# Tech tracking
tech-stack:
  added: []
  patterns: ["cross-resource registry lookups", "well-known resource whitelisting", "per-resource deduplication for noisy references"]

key-files:
  created:
    - src/lib/tools/k8s-analyzer/rules/cross-resource/well-known-resources.ts
    - src/lib/tools/k8s-analyzer/rules/cross-resource/KA-X001-service-selector-mismatch.ts
    - src/lib/tools/k8s-analyzer/rules/cross-resource/KA-X002-ingress-undefined-service.ts
    - src/lib/tools/k8s-analyzer/rules/cross-resource/KA-X003-configmap-not-found.ts
    - src/lib/tools/k8s-analyzer/rules/cross-resource/KA-X004-secret-not-found.ts
    - src/lib/tools/k8s-analyzer/rules/cross-resource/KA-X005-pvc-not-found.ts
    - src/lib/tools/k8s-analyzer/rules/cross-resource/KA-X006-serviceaccount-not-found.ts
    - src/lib/tools/k8s-analyzer/rules/cross-resource/KA-X007-networkpolicy-no-match.ts
    - src/lib/tools/k8s-analyzer/rules/cross-resource/KA-X008-hpa-target-not-found.ts
    - src/lib/tools/k8s-analyzer/rules/cross-resource/index.ts
  modified: []

key-decisions:
  - "TEMPLATE_LABEL_PATHS exported from KA-X001 and reused by KA-X007 for DRY pod template label navigation"
  - "KA-X008 uses KNOWN_SCALABLE_KINDS set (Deployment, StatefulSet, ReplicaSet, ReplicationController) to skip CRD targets"
  - "KA-X003/X004 deduplicate by name per resource using Map-based first-seen tracking"

patterns-established:
  - "Cross-resource rules use ctx.registry.getByName for O(1) lookups by kind/namespace/name"
  - "Well-known resources whitelist prevents false positives for system-managed resources"
  - "TEMPLATE_LABEL_PATHS maps kind to JSON path segments for pod template label extraction"

# Metrics
duration: 3min
completed: 2026-02-23
---

# Phase 44 Plan 01: Cross-Resource Validation Rules Summary

**8 cross-resource rules (KA-X001--KA-X008) validating Service selectors, Ingress backends, ConfigMap/Secret/PVC/SA references, NetworkPolicy selectors, and HPA targets with well-known resource false-positive suppression**

## Performance

- **Duration:** 3 min
- **Started:** 2026-02-23T19:07:51Z
- **Completed:** 2026-02-23T19:11:20Z
- **Tasks:** 2
- **Files created:** 10

## Accomplishments
- Implemented all 8 cross-resource validation rules covering the most common integration errors in K8s manifests
- Created well-known resources whitelist (kube-root-ca.crt ConfigMap, default ServiceAccount) to prevent false positives
- KA-X003/X004 deduplicate references per resource to avoid noisy repeated violations
- KA-X008 gracefully skips CRD/unknown target kinds that cannot be validated from manifest alone
- crossResourceRules index aggregates all 8 rules for engine integration

## Task Commits

Each task was committed atomically:

1. **Task 1: Well-known resources + KA-X001 through KA-X004** - `3b20581` (feat)
2. **Task 2: KA-X005 through KA-X008 + category index** - `ba63bd6` (feat)

## Files Created/Modified
- `rules/cross-resource/well-known-resources.ts` - 5 Set constants for system resources
- `rules/cross-resource/KA-X001-service-selector-mismatch.ts` - Service selector vs Pod template label matching
- `rules/cross-resource/KA-X002-ingress-undefined-service.ts` - Ingress -> Service reference validation
- `rules/cross-resource/KA-X003-configmap-not-found.ts` - ConfigMap reference validation (volumes, envFrom, env.valueFrom)
- `rules/cross-resource/KA-X004-secret-not-found.ts` - Secret reference validation (secretName for volumes)
- `rules/cross-resource/KA-X005-pvc-not-found.ts` - PVC reference validation (persistentVolumeClaim.claimName)
- `rules/cross-resource/KA-X006-serviceaccount-not-found.ts` - ServiceAccount reference validation
- `rules/cross-resource/KA-X007-networkpolicy-no-match.ts` - NetworkPolicy podSelector matching
- `rules/cross-resource/KA-X008-hpa-target-not-found.ts` - HPA scaleTargetRef validation
- `rules/cross-resource/index.ts` - crossResourceRules array with all 8 rules

## Decisions Made
- TEMPLATE_LABEL_PATHS exported from KA-X001 and reused by KA-X007 to avoid duplication
- KA-X008 uses KNOWN_SCALABLE_KINDS set to skip CRD targets gracefully
- KA-X003/X004 use Map-based first-seen tracking for per-resource deduplication

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All 8 cross-resource rules ready for engine integration in 44-03
- crossResourceRules array exported from index.ts for inclusion in allK8sRules
- TEMPLATE_LABEL_PATHS available for reuse by any future label-matching rules

---
*Phase: 44-cross-resource-validation-rbac*
*Completed: 2026-02-23*
