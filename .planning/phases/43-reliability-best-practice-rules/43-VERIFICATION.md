---
phase: 43-reliability-best-practice-rules
verified: 2026-02-23T19:00:00Z
status: passed
score: 4/4 must-haves verified
re_verification: false
---

# Phase 43: Reliability & Best Practice Rules Verification Report

**Phase Goal:** Users receive actionable reliability and best practice recommendations for production-readiness
**Verified:** 2026-02-23T19:00:00Z
**Status:** passed
**Re-verification:** No -- initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | A Deployment missing liveness/readiness probes, using a single replica, or lacking a rolling update strategy produces reliability warnings | VERIFIED | KA-R001 checks `!container.livenessProbe` (containerType=container only); KA-R004 treats undefined replicas as 1; KA-R006 fires only when strategy is explicitly non-RollingUpdate |
| 2 | Containers with latest/no image tag, missing resource requests/limits, or duplicate environment variable keys produce appropriate warnings | VERIFIED | KA-R009 getImageTag splits on '/' for registry:port safety, returns 'latest' for missing tag; KA-B001-B004 check resources.requests/limits; KA-B012 uses Map-based first-seen tracking for duplicates |
| 3 | Resources missing recommended labels (app, version), namespace, or priorityClassName produce informational diagnostics | VERIFIED | KA-B005 checks REQUIRED_LABELS=['app','version'], fires ONE violation per resource listing all missing; KA-B006 checks metadata.namespace === undefined (skips 6 cluster-scoped kinds); KA-B011 uses getPodSpec |
| 4 | A CronJob without startingDeadlineSeconds, or a container with probe ports not matching container ports, produces specific warnings | VERIFIED | KA-R012 checks spec.startingDeadlineSeconds === undefined for CronJob kind; KA-B009/B010 build declared port set (numeric+named), skip containers with no ports array to avoid false positives |

**Score:** 4/4 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/lib/tools/k8s-analyzer/rules/reliability/KA-R001-missing-liveness-probe.ts` | Reliability rule: liveness probe check | VERIFIED | 51 lines, full check() implementation, containerType filter |
| `src/lib/tools/k8s-analyzer/rules/reliability/KA-R002-missing-readiness-probe.ts` | Reliability rule: readiness probe check | VERIFIED | File exists, same pattern as R001 |
| `src/lib/tools/k8s-analyzer/rules/reliability/KA-R003-identical-probes.ts` | Reliability rule: identical probes via stableStringify | VERIFIED | 92 lines, stableStringify helper, recursive sorted-key comparison |
| `src/lib/tools/k8s-analyzer/rules/reliability/KA-R004-single-replica.ts` | Reliability rule: single replica, undefined=1 | VERIFIED | 51 lines, `replicas === undefined \|\| replicas === 1` check |
| `src/lib/tools/k8s-analyzer/rules/reliability/KA-R005-missing-pdb.ts` | Reliability rule: PDB recommendation | VERIFIED | File exists |
| `src/lib/tools/k8s-analyzer/rules/reliability/KA-R006-no-rolling-update.ts` | Reliability rule: explicit non-RollingUpdate only | VERIFIED | 60 lines, skips absent strategy (`if (!strategy) continue`), fires on explicit non-RollingUpdate |
| `src/lib/tools/k8s-analyzer/rules/reliability/KA-R007-missing-anti-affinity.ts` | Reliability rule: missing anti-affinity | VERIFIED | File exists |
| `src/lib/tools/k8s-analyzer/rules/reliability/KA-R008-missing-topology-spread.ts` | Reliability rule: missing topology spread | VERIFIED | File exists |
| `src/lib/tools/k8s-analyzer/rules/reliability/KA-R009-latest-image-tag.ts` | Reliability rule: latest/no tag, registry:port safe | VERIFIED | 80 lines, getImageTag splits on '/' to isolate last path segment, handles digest (@sha256) |
| `src/lib/tools/k8s-analyzer/rules/reliability/KA-R010-image-pull-policy.ts` | Reliability rule: explicit non-Always policy only | VERIFIED | File exists |
| `src/lib/tools/k8s-analyzer/rules/reliability/KA-R011-selector-mismatch.ts` | Reliability rule: selector subset check | VERIFIED | 77 lines, subset check with `break` after first mismatch |
| `src/lib/tools/k8s-analyzer/rules/reliability/KA-R012-cronjob-missing-deadline.ts` | Reliability rule: CronJob startingDeadlineSeconds | VERIFIED | 51 lines, checks `spec.startingDeadlineSeconds === undefined` |
| `src/lib/tools/k8s-analyzer/rules/reliability/index.ts` | reliabilityRules array aggregator (12 rules) | VERIFIED | 30 lines, imports all 12 KAR* exports, spreads into reliabilityRules array |
| `src/lib/tools/k8s-analyzer/rules/best-practice/KA-B001-missing-cpu-requests.ts` | Best practice rule: CPU requests | VERIFIED | File exists |
| `src/lib/tools/k8s-analyzer/rules/best-practice/KA-B002-missing-cpu-limits.ts` | Best practice rule: CPU limits | VERIFIED | File exists |
| `src/lib/tools/k8s-analyzer/rules/best-practice/KA-B003-missing-memory-requests.ts` | Best practice rule: memory requests | VERIFIED | File exists |
| `src/lib/tools/k8s-analyzer/rules/best-practice/KA-B004-missing-memory-limits.ts` | Best practice rule: memory limits | VERIFIED | File exists |
| `src/lib/tools/k8s-analyzer/rules/best-practice/KA-B005-missing-labels.ts` | Best practice rule: app+version labels | VERIFIED | 61 lines, REQUIRED_LABELS=['app','version'], one violation per resource |
| `src/lib/tools/k8s-analyzer/rules/best-practice/KA-B006-missing-namespace.ts` | Best practice rule: absent namespace | VERIFIED | 63 lines, checks metadata.namespace === undefined, skips 6 cluster-scoped kinds |
| `src/lib/tools/k8s-analyzer/rules/best-practice/KA-B007-ssh-port-exposed.ts` | Best practice rule: SSH port 22 | VERIFIED | File exists |
| `src/lib/tools/k8s-analyzer/rules/best-practice/KA-B008-nodeport-service.ts` | Best practice rule: NodePort service | VERIFIED | File exists |
| `src/lib/tools/k8s-analyzer/rules/best-practice/KA-B009-liveness-probe-port.ts` | Best practice rule: liveness probe port cross-validation | VERIFIED | 96 lines, getDeclaredPorts includes both numeric and named ports, skips containers with no ports array |
| `src/lib/tools/k8s-analyzer/rules/best-practice/KA-B010-readiness-probe-port.ts` | Best practice rule: readiness probe port cross-validation | VERIFIED | 95 lines, same pattern as B009 |
| `src/lib/tools/k8s-analyzer/rules/best-practice/KA-B011-missing-priority-class.ts` | Best practice rule: missing priorityClassName | VERIFIED | File exists |
| `src/lib/tools/k8s-analyzer/rules/best-practice/KA-B012-duplicate-env-keys.ts` | Best practice rule: duplicate env keys | VERIFIED | 64 lines, Map-based first-seen tracking, fires on duplicate occurrence (not pair) |
| `src/lib/tools/k8s-analyzer/rules/best-practice/index.ts` | bestPracticeRules array aggregator (12 rules) | VERIFIED | 30 lines, imports all 12 KAB* exports, spreads into bestPracticeRules array |
| `src/lib/tools/k8s-analyzer/rules/index.ts` | Master index: allK8sRules with 44 rules | VERIFIED | Imports securityRules + reliabilityRules + bestPracticeRules, spreads all 3 into allK8sRules |
| `src/lib/tools/k8s-analyzer/sample-manifest.ts` | Sample manifest triggering all 3 rule categories | VERIFIED | 273 lines; CronJob (cleanup-job, no deadline, no image tag), NodePort Service (debug-nodeport), insecure-app with Recreate strategy, web-frontend with identical liveness/readiness probes |

### Key Link Verification

| From | To | Via | Status | Details |
|------|-----|-----|--------|---------|
| `rules/reliability/index.ts` | `rules/index.ts` | `import { reliabilityRules }` | WIRED | Line 3 of rules/index.ts: `import { reliabilityRules } from './reliability'` |
| `rules/best-practice/index.ts` | `rules/index.ts` | `import { bestPracticeRules }` | WIRED | Line 4 of rules/index.ts: `import { bestPracticeRules } from './best-practice'` |
| `allK8sRules` | engine pipeline | `...reliabilityRules, ...bestPracticeRules` | WIRED | allK8sRules spreads all 3 category arrays; engine's `10 + allK8sRules.length` formula yields 54 automatically |
| `KA-R009` | image tag parser | `getImageTag` splits on '/' | WIRED | Correctly handles `registry.example.com:5000/myapp:1.0` format by checking last segment only |
| `KA-R011` | selector validation | subset check with break | WIRED | Iterates matchLabels entries, checks against templateLabels, breaks after first mismatch |
| `KA-B009/B010` | probe port cross-validation | `getDeclaredPorts` with numeric+named | WIRED | Port set includes both `containerPort` (number) and `name` (string) values |
| `KA-B006` | cluster-scoped skip list | `CLUSTER_SCOPED_KINDS` Set | WIRED | Set includes Namespace, ClusterRole, ClusterRoleBinding, PersistentVolume, Node, CustomResourceDefinition |
| Sample manifest | reliability triggers | CronJob + Recreate + identical probes | WIRED | cleanup-job has no startingDeadlineSeconds (R012), image `myapp/cleanup` (R009); insecure-app has `strategy.type: Recreate` (R006); web-frontend has identical httpGet probes on same path+port (R003) |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| REL-01 | 43-01 | Missing liveness probe | SATISFIED | KA-R001 implemented, containerType filter applied |
| REL-02 | 43-01 | Missing readiness probe | SATISFIED | KA-R002 implemented, same pattern as R001 |
| REL-03 | 43-01 | Identical liveness/readiness probes | SATISFIED | KA-R003 with stableStringify for key-order-independent comparison |
| REL-04 | 43-01 | Single replica Deployment | SATISFIED | KA-R004 treats undefined replicas as 1 |
| REL-05 | 43-01 | Missing PodDisruptionBudget | SATISFIED | KA-R005 emits informational PDB recommendation without GVK registry lookup |
| REL-06 | 43-01 | No rolling update strategy | SATISFIED | KA-R006 fires only on explicit non-RollingUpdate (absent strategy skipped) |
| REL-07 | 43-01 | Missing pod anti-affinity | SATISFIED | KA-R007 implemented |
| REL-08 | 43-01 | Missing topology spread constraints | SATISFIED | KA-R008 implemented |
| REL-09 | 43-01 | Latest or no image tag | SATISFIED | KA-R009 with registry:port-safe parser |
| REL-10 | 43-01 | Image pull policy not Always | SATISFIED | KA-R010 flags only explicit non-Always |
| REL-11 | 43-01 | Selector/template label mismatch | SATISFIED | KA-R011 subset check with break |
| REL-12 | 43-01 | CronJob missing startingDeadlineSeconds | SATISFIED | KA-R012 checks undefined spec field |
| BP-01 | 43-02 | Missing CPU requests | SATISFIED | KA-B001 implemented |
| BP-02 | 43-02 | Missing CPU limits | SATISFIED | KA-B002 implemented |
| BP-03 | 43-02 | Missing memory requests | SATISFIED | KA-B003 implemented |
| BP-04 | 43-02 | Missing memory limits | SATISFIED | KA-B004 implemented |
| BP-05 | 43-02 | Missing recommended labels (app, version) | SATISFIED | KA-B005 fires one violation per resource listing all missing labels |
| BP-06 | 43-02 | Missing namespace | SATISFIED | KA-B006 checks absent namespace, distinct from KA-C019 (default namespace) |
| BP-07 | 43-02 | SSH port 22 exposed | SATISFIED | KA-B007 implemented |
| BP-08 | 43-02 | NodePort service type | SATISFIED | KA-B008 implemented; sample manifest has debug-nodeport Service |
| BP-09 | 43-02 | Liveness probe port mismatch | SATISFIED | KA-B009 with getDeclaredPorts supporting numeric+named ports |
| BP-10 | 43-02 | Readiness probe port mismatch | SATISFIED | KA-B010 same pattern as B009 |
| BP-11 | 43-02 | Missing priorityClassName | SATISFIED | KA-B011 uses getPodSpec for all workload kinds |
| BP-12 | 43-02 | Duplicate environment variable keys | SATISFIED | KA-B012 Map-based first-seen tracking |

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| KA-R009 L13 | 13 | `return null` | Info | Intentional: null signals digest reference (safe to skip), not a stub |
| KA-B009 L14 | 14 | `return null` | Info | Intentional: null signals exec probe (no port to validate), not a stub |
| KA-B010 L14 | 14 | `return null` | Info | Intentional: null signals exec probe (no port to validate), not a stub |

No blocker anti-patterns found. The `return null` occurrences are intentional logic signals within helper functions, not empty implementations.

### Human Verification Required

None. All success criteria are fully verifiable through static code analysis.

### Rule Count Verification

- Security rules: 20 (from Phase 42)
- Reliability rules: 12 (KA-R001 through KA-R012)
- Best practice rules: 12 (KA-B001 through KA-B012)
- Total allK8sRules: 44 (20 + 12 + 12)
- Total engine rules: 54 (10 schema + 44 custom)

### TypeScript Compilation

Zero TypeScript errors in k8s-analyzer files. Unrelated pre-existing errors exist in `src/pages/open-graph/` files (Buffer type mismatch unrelated to this phase).

### Commit Verification

All 6 task commits confirmed in git history:
- `54f740e` feat(43-01): add reliability rules KA-R001 through KA-R006
- `c703e98` feat(43-01): add reliability rules KA-R007 through KA-R012 and category index
- `9bab75c` feat(43-02): create best practice rules KA-B001 through KA-B006
- `8d08ff5` feat(43-02): create best practice rules KA-B007 through KA-B012 and index
- `bebd906` feat(43-03): integrate reliability and best practice rules into master index
- `1f68859` feat(43-03): update sample manifest with reliability and best practice violation triggers

---

_Verified: 2026-02-23T19:00:00Z_
_Verifier: Claude (gsd-verifier)_
