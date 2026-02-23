# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-23)

**Core value:** A fast, SEO-optimized, visually distinctive portfolio that ranks well in search engines and makes a memorable impression on recruiters, collaborators, and the developer community.
**Current focus:** v1.7 Kubernetes Manifest Analyzer — Phase 46 in progress (resource relationship graph)

## Current Position

Phase: 46 of 47 (Resource Relationship Graph) -- COMPLETE
Plan: 2 of 2
Status: Phase Complete
Last activity: 2026-02-23 — Completed 46-02 K8sResourceGraph assembly + panel integration

Progress: ▓▓▓▓▓▓░░░░ 50%

## Performance Metrics

**Velocity:**
- Total plans completed: 98 (16 v1.0 + 7 v1.1 + 6 v1.2 + 15 v1.3 + 13 v1.4 + 9 v1.5 + 14 v1.6 + 18 v1.7)

**Cumulative Stats:**

| Milestone | Phases | Plans | Requirements | Date |
|-----------|--------|-------|--------------|------|
| v1.0 MVP | 1-7 | 15 | 36 | 2026-02-11 |
| v1.1 Content Refresh | 8-12 | 7 | 18 | 2026-02-12 |
| v1.2 Projects Page Redesign | 13-15 | 6 | 23 | 2026-02-13 |
| v1.3 The Beauty Index | 16-21 | 15 | 37 | 2026-02-17 |
| v1.4 Dockerfile Analyzer | 22-27 | 13 | 38 | 2026-02-20 |
| v1.5 Database Compass | 28-32 | 10 | 28 | 2026-02-22 |
| v1.6 Compose Validator | 33-40 | 14 | 100 | 2026-02-23 |
| v1.7 K8s Analyzer | 41-47 | TBD | 123 | In progress |
| **Total** | **47** | **84+** | **403** | |
| Phase 44 P01 | 3min | 2 tasks | 10 files |
| Phase 44 P02 | 4min | 2 tasks | 6 files |
| Phase 44 P03 | 3min | 1 tasks | 2 files |
| Phase 45 P01 | 4min | 3 tasks | 6 files |
| Phase 45 P02 | 3min | 2 tasks | 8 files |
| Phase 45 P03 | 3min | 2 tasks | 4 files |
| Phase 46 P01 | 3min | 2 tasks | 5 files |
| Phase 46 P02 | 3min | 2 tasks | 2 files |

## Accumulated Context

### Decisions

Full decision log in PROJECT.md Key Decisions table.
v1.0-v1.6 decisions archived in respective milestone files.

v1.7 decisions pending (to be logged during execution):
- Async engine (dynamic schema imports require async unlike compose-validator)
- Single compiled Ajv module for all 19 K8s schemas (dedup shared definitions)
- Phase 42/43 can run in parallel (both are per-resource, no cross-deps)
- Strip format fields from K8s schemas to avoid ajv-formats require() in standalone output
- Commit source schemas for reproducibility (pinned to K8s v1.31.0)
- 19 resource types (not 18) -- ClusterRoleBinding is the 19th
- GVK flat array with find() over Map -- 19 entries makes linear scan negligible
- checkMetadata skips documents without apiVersion/kind to avoid duplicate diagnostics
- ResourceRegistry implements types.ts interface, keeps forward-reference pattern for K8sRuleContext
- Schema validator caches validators at module level -- dynamic import only happens once
- Inline ValidateFunction/ErrorObject types to avoid runtime ajv dependency
- Engine tracks rulesTriggered via Set for accurate rulesPassed count
- Deprecated GVK takes precedence over unknown GVK (KA-S006 over KA-S004)
- Case-insensitive key search for "Did you mean?" suggestions on missing apiVersion/kind
- SEC-03/SEC-05 no-overlap: KA-C005 fires for explicit runAsUser:0, KA-C003 skips
- KA-C020 fires only for undefined securityContext, not empty {} (strict 'in' check)
- KA-C018 flags inline value only, not valueFrom.secretKeyRef
- Pod-level securityContext inheritance checked in C003/C004/C005/C013
- PssComplianceSummary in types.ts (not pss-compliance.ts) to avoid circular imports
- PSS Restricted inherits Baseline: zero Baseline AND zero Restricted violations required
- totalRules = 10 + allK8sRules.length for Phase 43 extensibility (not hardcoded 30)
- Probe rules (R001-R003) filter containerType === 'container' (exclude initContainers)
- R003 uses stableStringify for reliable deep probe comparison regardless of key order
- R005 emits PDB recommendation without registry.getByKind (PDB not in GVK registry)
- R009 getImageTag splits on '/' to handle registry:port format correctly
- R011 subset check (not exact match) for selector vs template labels
- B005 fires ONE violation per resource listing all missing labels (not one per label)
- B006 checks literally absent namespace, distinct from KA-C019 default namespace
- B009/B010 filter containerType=container only, skip containers with no ports array
- B012 fires per duplicate occurrence using Map-based first-seen tracking
- allK8sRules uses spread aggregation of 3 category arrays (security, reliability, best-practice) for extensibility
- Sample manifest adds CronJob (R009/R012) and NodePort Service (B008) as minimal new-category triggers
- [Phase 44]: Inline ruleGrantsPermission helper in A003/A004/A005 (5 lines, 3 consumers same directory)
- [Phase 44]: All 5 RBAC rules use category: 'security' for SCORE-04 35% weight compliance
- [Phase 44]: TEMPLATE_LABEL_PATHS exported from KA-X001, reused by KA-X007 for DRY label matching
- [Phase 44]: KA-X008 skips CRD/unknown targetKind via KNOWN_SCALABLE_KINDS set
- [Phase 44]: KA-X003/X004 deduplicate by name per resource using Map-based first-seen tracking
- [Phase 44]: No engine.ts changes needed for Phase 44 integration -- totalRules auto-adapts via 10 + allK8sRules.length
- [Phase 45]: Dual rule lookup uses Object.entries(SCHEMA_RULE_METADATA) for schema rules + allK8sRules for lint rules in scorer
- [Phase 45]: Keymap.of() placed before theme extensions in CodeMirror hook for correct precedence
- [Phase 45]: Async analyzeRef.current with await runK8sEngine() and setTimeout(0) yield before engine call for React paint
- [Phase 45]: Resource enrichment: violations enriched with resourceKind/resourceName by matching line ranges to resource startLines
- [Phase 45]: K8sResourceSummary uses Array.from(resourceSummary.entries()) for Map-to-array conversion
- [Phase 45]: Results|Graph tab type (not Violations|Graph) to match K8s multi-resource results paradigm
- [Phase 45]: Graph tab placeholder for Phase 46 -- no graph library loaded in Phase 45
- [Phase 46]: resourceId format matches ResourceRegistry byNameIndex key: kind/namespace/name
- [Phase 46]: Dangling Service selectors do NOT create phantom edges (no specific target)
- [Phase 46]: ClusterRole targets use 'default' namespace in target ID for registry consistency
- [Phase 46]: CATEGORY_COLORS exported from K8sResourceNode for reuse in graph layout
- [Phase 46]: Include all edges (including dangling) in dagre layout so phantom nodes get positioned
- [Phase 46]: Rebuild ResourceRegistry from result.resources inside useMemo (no stale registry)

### Pending Todos

None.

### Blockers/Concerns

- [Infra]: DNS configuration for patrykgolabek.dev is a manual step outside automation scope
- [Tech Debt]: No shared getBlogPostUrl helper -- URL resolution duplicated in 3 files
- [Tech Debt]: Social links hardcoded across 5 component files instead of centralized config
- [Tech Debt]: Category colors defined in 3 places (ProjectCard, ProjectHero, FloatingOrbs)
- [Tech Debt]: Filter system inline script (~80 lines) in projects/index.astro
- [Deferred]: LinkedIn removal from JSON-LD sameAs (CONFIG-02)
- [v1.3 Gap]: Dark mode strategy deferred -- charts use light mode CSS custom properties only
- [v1.4 Tech Debt]: Category colors/grade colors duplicated in badge-generator.ts
- [v1.7 Risk RESOLVED]: Schema bundle size validated at 76KB gzipped (well under 200KB limit)
- [v1.7 Risk]: Cross-resource false positives for partial manifests (Phase 44)

## Session Continuity

Last session: 2026-02-23
Stopped at: Completed 46-02-PLAN.md (K8sResourceGraph assembly + K8sResultsPanel integration)
Resume file: None
Next: Phase 47 (final phase)
