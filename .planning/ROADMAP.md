# Roadmap: v1.12 Dockerfile Rules Expansion

## Overview

Expand the Dockerfile Analyzer from 44 to 46 rules by adding PG011 (missing USER directive security rule) and PG012 (Node.js pointer compression efficiency rule). Each rule gets a documentation page. All hardcoded rule counts are updated site-wide and verified with a full production build.

## Milestones

- ✅ **v1.0 MVP** - Phases 1-7 (shipped 2026-02-11)
- ✅ **v1.1 Content Refresh** - Phases 8-12 (shipped 2026-02-12)
- ✅ **v1.2 Projects Page Redesign** - Phases 13-15 (shipped 2026-02-13)
- ✅ **v1.3 The Beauty Index** - Phases 16-21 (shipped 2026-02-17)
- ✅ **v1.4 Dockerfile Analyzer** - Phases 22-27 (shipped 2026-02-20)
- ✅ **v1.5 Database Compass** - Phases 28-32 (shipped 2026-02-22)
- ✅ **v1.6 Docker Compose Validator** - Phases 33-40 (shipped 2026-02-23)
- ✅ **v1.7 Kubernetes Manifest Analyzer** - Phases 41-47 (shipped 2026-02-23)
- ✅ **v1.8 EDA Visual Encyclopedia** - Phases 48-55 (shipped 2026-02-25)
- ✅ **v1.9 EDA Case Study Deep Dive** - Phases 56-63 (shipped 2026-02-27)
- ✅ **v1.10 EDA Graphical Techniques NIST Parity** - Phases 64-68 (shipped 2026-02-28)
- ✅ **v1.11 Beauty Index: Lisp** - Phases 69-71 (shipped 2026-03-02)
- ✅ **v1.12 Dockerfile Rules Expansion** - Phases 72-74 (shipped 2026-03-02)

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

- [x] **Phase 72: PG011 Missing USER Directive** - Security rule flagging Dockerfiles with no USER instruction in the final build stage
- [x] **Phase 73: PG012 Node.js Pointer Compression** - Efficiency rule suggesting platformatic/node-caged for Node.js base images
- [x] **Phase 74: Site-Wide Integration** - Register both rules, update all hardcoded counts to 46, and verify full production build

## Phase Details

### Phase 72: PG011 Missing USER Directive
**Goal**: Users running the Dockerfile Analyzer see a security warning when their final build stage has no USER directive
**Depends on**: Nothing (first phase of v1.12)
**Requirements**: RULES-01, RULES-02, RULES-03, DOCS-01
**Success Criteria** (what must be TRUE):
  1. Dockerfile with no USER instruction anywhere triggers a PG011 security violation in the results panel
  2. Dockerfile with `USER root` triggers DL3002 only -- PG011 stays silent (no overlap)
  3. Multi-stage Dockerfile with USER only in a builder stage triggers PG011 on the final stage
  4. `FROM scratch` with no USER does NOT trigger PG011
  5. Rule documentation page renders at /tools/dockerfile-analyzer/rules/pg011/ with expert explanation, before/after code, and related rules
**Plans:** 1 plan

Plans:
- [x] 72-01-PLAN.md -- Implement PG011 rule and register in engine

### Phase 73: PG012 Node.js Pointer Compression
**Goal**: Users running the Dockerfile Analyzer on Node.js images see an efficiency suggestion for platformatic/node-caged with memory savings context
**Depends on**: Phase 72
**Requirements**: RULES-04, RULES-05, RULES-06, DOCS-02
**Success Criteria** (what must be TRUE):
  1. `FROM node:22` in the final stage triggers a PG012 info-level efficiency suggestion mentioning platformatic/node-caged
  2. Non-node images (python, ubuntu, etc.) and custom registry node images (myregistry.io/node) do NOT trigger PG012
  3. PG012 explanation text includes the Node 25+ version requirement and ~50% memory benefit
  4. Rule documentation page renders at /tools/dockerfile-analyzer/rules/pg012/ with expert explanation, before/after code, and related rules
**Plans:** 1 plan

Plans:
- [x] 73-01-PLAN.md -- Implement PG012 rule, tests, and register in engine

### Phase 74: Site-Wide Integration
**Goal**: Both new rules are registered in the analyzer engine and all site-wide references reflect 46 total rules with a clean production build
**Depends on**: Phase 73
**Requirements**: INTG-01, INTG-02, INTG-03
**Success Criteria** (what must be TRUE):
  1. Both PG011 and PG012 appear in the allRules array and are executed during analysis
  2. No references to "39 rules" or "44 rules" remain in source -- all updated to 46
  3. Full `astro build` passes with both new rule documentation pages in the output
**Plans:** 1 plan

Plans:
- [x] 74-01-PLAN.md -- Update all hardcoded counts to 46, add missing SKILL.md entries, verify production build

## Progress

**Execution Order:**
Phases execute in numeric order: 72 → 73 → 74

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 72. PG011 Missing USER Directive | 1/1 | Complete | 2026-03-02 |
| 73. PG012 Node.js Pointer Compression | 1/1 | Complete | 2026-03-02 |
| 74. Site-Wide Integration | 1/1 | Complete | 2026-03-02 |

---
*Roadmap created: 2026-03-02*
*Last updated: 2026-03-02*
