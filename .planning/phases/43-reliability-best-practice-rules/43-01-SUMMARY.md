---
phase: 43-reliability-best-practice-rules
plan: 01
subsystem: k8s-analyzer
tags: [kubernetes, reliability, probes, replicas, image-tags, topology-spread, rolling-update, cronjob]

# Dependency graph
requires:
  - phase: 41-foundation-schema-infrastructure
    provides: "K8sLintRule interface, ParsedResource, parser (resolveInstancePath, getNodeLine), types.ts"
  - phase: 42-security-rules
    provides: "container-helpers.ts (getPodSpec, getContainerSpecs), security rule pattern"
provides:
  - "12 reliability rules (KA-R001 through KA-R012) implementing K8sLintRule"
  - "reliabilityRules array aggregator in rules/reliability/index.ts"
affects: [43-02, 43-03, 45-editor-ui-scoring, 47-seo-documentation]

# Tech tracking
tech-stack:
  added: []
  patterns: [stableStringify for deep object comparison, getImageTag parser for registry:port handling, subset label check for selector mismatch]

key-files:
  created:
    - src/lib/tools/k8s-analyzer/rules/reliability/KA-R001-missing-liveness-probe.ts
    - src/lib/tools/k8s-analyzer/rules/reliability/KA-R002-missing-readiness-probe.ts
    - src/lib/tools/k8s-analyzer/rules/reliability/KA-R003-identical-probes.ts
    - src/lib/tools/k8s-analyzer/rules/reliability/KA-R004-single-replica.ts
    - src/lib/tools/k8s-analyzer/rules/reliability/KA-R005-missing-pdb.ts
    - src/lib/tools/k8s-analyzer/rules/reliability/KA-R006-no-rolling-update.ts
    - src/lib/tools/k8s-analyzer/rules/reliability/KA-R007-missing-anti-affinity.ts
    - src/lib/tools/k8s-analyzer/rules/reliability/KA-R008-missing-topology-spread.ts
    - src/lib/tools/k8s-analyzer/rules/reliability/KA-R009-latest-image-tag.ts
    - src/lib/tools/k8s-analyzer/rules/reliability/KA-R010-image-pull-policy.ts
    - src/lib/tools/k8s-analyzer/rules/reliability/KA-R011-selector-mismatch.ts
    - src/lib/tools/k8s-analyzer/rules/reliability/KA-R012-cronjob-missing-deadline.ts
    - src/lib/tools/k8s-analyzer/rules/reliability/index.ts
  modified: []

key-decisions:
  - "Probe rules (R001, R002, R003) filter to containerType === 'container' only (exclude initContainers)"
  - "R003 uses stableStringify (recursive sorted-key JSON) for reliable probe object comparison"
  - "R004 treats undefined replicas as 1 (K8s default)"
  - "R005 emits informational PDB recommendation (does NOT call registry.getByKind since PDB is not in GVK registry)"
  - "R006 only flags when strategy is explicitly non-RollingUpdate (absent strategy defaults to RollingUpdate)"
  - "R009 image tag parser splits on '/' to handle registry:port correctly before checking last segment for :tag"
  - "R010 only flags explicit non-Always imagePullPolicy (omitted is acceptable default behavior)"
  - "R011 uses subset check (not exact match) for selector vs template labels, with break after first mismatch"

requirements-completed: [REL-01, REL-02, REL-03, REL-04, REL-05, REL-06, REL-07, REL-08, REL-09, REL-10, REL-11, REL-12]

# Metrics
duration: 5min
completed: 2026-02-23
---

# Phase 43 Plan 01: Reliability Rules Summary

**12 K8s reliability rules (KA-R001 through KA-R012) covering probes, replicas, update strategy, image tags, topology spread, selector mismatch, and CronJob deadline checks**

## Performance

- **Duration:** 5 min
- **Started:** 2026-02-23T18:23:51Z
- **Completed:** 2026-02-23T18:28:50Z
- **Tasks:** 2
- **Files created:** 13

## Accomplishments

- Created 12 reliability rules following the exact Phase 42 security rule pattern (same imports, code style, check function signature)
- Implemented 4 container-level rules (R001, R002, R003 filter to non-initContainers; R009, R010 apply to all containers)
- Implemented 4 deployment-level rules (R004 single replica, R005 PDB recommendation, R006 rolling update, R011 selector mismatch)
- Implemented 2 pod-level rules (R007 anti-affinity, R008 topology spread) using getPodSpec for all workload kinds
- Implemented 2 resource-specific rules (R009 image tag with registry:port-safe parser, R012 CronJob deadline)
- Created reliability/index.ts aggregating all 12 rules into reliabilityRules array
- R003 uses stableStringify helper for reliable deep comparison of probe objects regardless of key ordering
- R009 getImageTag function correctly handles digest references (@sha256:...), registry:port prefixes, and implicit latest

## Task Commits

Each task was committed atomically:

1. **Task 1: Create reliability rules KA-R001 through KA-R006** - `54f740e` (feat)
2. **Task 2: Create reliability rules KA-R007 through KA-R012 and category index** - `c703e98` (feat)

## Files Created/Modified

- `src/lib/tools/k8s-analyzer/rules/reliability/KA-R001-missing-liveness-probe.ts` - Missing liveness probe (warning, container-level)
- `src/lib/tools/k8s-analyzer/rules/reliability/KA-R002-missing-readiness-probe.ts` - Missing readiness probe (warning, container-level)
- `src/lib/tools/k8s-analyzer/rules/reliability/KA-R003-identical-probes.ts` - Identical probes (warning, stableStringify comparison)
- `src/lib/tools/k8s-analyzer/rules/reliability/KA-R004-single-replica.ts` - Single replica Deployment (warning, undefined = 1)
- `src/lib/tools/k8s-analyzer/rules/reliability/KA-R005-missing-pdb.ts` - Missing PDB (info, 2+ replicas recommendation)
- `src/lib/tools/k8s-analyzer/rules/reliability/KA-R006-no-rolling-update.ts` - No rolling update (warning, explicit non-RollingUpdate only)
- `src/lib/tools/k8s-analyzer/rules/reliability/KA-R007-missing-anti-affinity.ts` - Missing anti-affinity (info, pod-level)
- `src/lib/tools/k8s-analyzer/rules/reliability/KA-R008-missing-topology-spread.ts` - Missing topology spread (info, pod-level)
- `src/lib/tools/k8s-analyzer/rules/reliability/KA-R009-latest-image-tag.ts` - Latest/no image tag (warning, all containers)
- `src/lib/tools/k8s-analyzer/rules/reliability/KA-R010-image-pull-policy.ts` - Pull policy not Always (info, explicit only)
- `src/lib/tools/k8s-analyzer/rules/reliability/KA-R011-selector-mismatch.ts` - Selector/template mismatch (error, subset check)
- `src/lib/tools/k8s-analyzer/rules/reliability/KA-R012-cronjob-missing-deadline.ts` - CronJob missing deadline (warning, CronJob spec level)
- `src/lib/tools/k8s-analyzer/rules/reliability/index.ts` - reliabilityRules array (12 rules)

## Decisions Made

- Probe rules (R001, R002, R003) skip initContainers since init containers run to completion and don't need ongoing health checks
- R003 uses stableStringify (recursive sorted-key serialization) rather than plain JSON.stringify for reliable deep comparison regardless of key insertion order
- R004 treats omitted replicas as 1 (K8s default) and resolves AST at /spec when replicas field is absent vs /spec/replicas when explicit
- R005 does NOT attempt registry.getByKind('PodDisruptionBudget') since PDB is not in the GVK registry; instead emits a general recommendation for Deployments with 2+ replicas
- R006 only fires when strategy is explicitly set to non-RollingUpdate (e.g., Recreate); absent strategy means K8s uses RollingUpdate by default
- R009 getImageTag splits on '/' to isolate the last path segment before checking for ':tag', correctly handling registry:port formats like registry.example.com:5000/myapp:1.0
- R010 only flags when imagePullPolicy is explicitly set to non-Always; omitted imagePullPolicy is acceptable (K8s uses tag-based defaults)
- R011 performs subset check (every selector label must exist in template labels, but template can have extra labels) with one violation per resource

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- All 12 reliability rules compile cleanly and implement K8sLintRule with category 'reliability'
- reliability/index.ts exports reliabilityRules array ready for master index integration
- Plan 43-02 (best practice rules) can create rules/best-practice/ following the same pattern
- Plan 43-03 (master index integration) will add ...reliabilityRules to allK8sRules in rules/index.ts

## Self-Check: PASSED

- All 13 created files verified on disk (12 rules + index)
- Both task commits (54f740e, c703e98) verified in git log
- 12 rule files all contain category: 'reliability'
- Probe rules (R001, R002, R003) filter containerType !== 'container'
- R009 image tag parser handles @ digest and registry:port correctly
- R011 uses subset check with break after first mismatch
- R004 handles undefined replicas as 1
- R005 does not call registry.getByKind
- TypeScript compiles with no reliability rule errors

---
*Phase: 43-reliability-best-practice-rules*
*Completed: 2026-02-23*
