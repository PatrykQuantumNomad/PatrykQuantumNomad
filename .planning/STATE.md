# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-23)

**Core value:** A fast, SEO-optimized, visually distinctive portfolio that ranks well in search engines and makes a memorable impression on recruiters, collaborators, and the developer community.
**Current focus:** v1.7 Kubernetes Manifest Analyzer — Phase 43 complete (44 custom rules integrated), Phase 44 next

## Current Position

Phase: 43 of 47 (Reliability & Best Practice Rules) -- COMPLETE
Plan: 3 of 3 complete
Status: Phase Complete
Last activity: 2026-02-23 — Completed 43-03 master index integration (44 rules wired into engine)

Progress: ▓▓▓▓▓▓░░░░ 43%

## Performance Metrics

**Velocity:**
- Total plans completed: 89 (16 v1.0 + 7 v1.1 + 6 v1.2 + 15 v1.3 + 13 v1.4 + 9 v1.5 + 14 v1.6 + 9 v1.7)

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
Stopped at: Completed 43-03-PLAN.md (master index integration, 44 rules in engine, Phase 43 complete)
Resume file: None
Next: Phase 44 (Cross-Resource Validation & RBAC) -- plan and execute
