# Requirements: patrykgolabek.dev

**Defined:** 2026-03-02
**Core Value:** The site must be fast, fully SEO-optimized, and visually distinctive — a portfolio that ranks well in search engines and makes a memorable impression.

## v1.12 Requirements

Requirements for Dockerfile Rules Expansion milestone. Each maps to roadmap phases.

### Rules

- [x] **RULES-01**: PG011 security rule flags Dockerfiles with no USER directive in final build stage
- [x] **RULES-02**: PG011 only checks final stage (skips builder stages and FROM scratch)
- [x] **RULES-03**: PG011 has no overlap with DL3002 (fires only when no USER instruction exists at all)
- [x] **RULES-04**: PG012 efficiency rule suggests platformatic/node-caged for Node.js base images
- [x] **RULES-05**: PG012 matches official node images correctly (not substrings or custom namespaces)
- [x] **RULES-06**: PG012 explanation includes Node 25+ version requirement and ~50% memory benefit

### Documentation

- [x] **DOCS-01**: PG011 rule page includes expert explanation, fix with before/after code, and related rules
- [x] **DOCS-02**: PG012 rule page includes expert explanation, fix with before/after code, and related rules

### Integration

- [ ] **INTG-01**: Both rules registered in allRules array in rules/index.ts
- [ ] **INTG-02**: All hardcoded rule counts updated site-wide to reflect 46 total rules
- [ ] **INTG-03**: Full production build passes with 46 rules and both new documentation pages

## Future Requirements

None for this milestone.

## Out of Scope

| Feature | Reason |
|---------|--------|
| Updating the sample Dockerfile | New rules will surface on users' own Dockerfiles |
| Blog post updates | Companion blog post unchanged for this milestone |
| Additional rules beyond PG011/PG012 | Scoped to 2 rules; more can come in future milestones |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| RULES-01 | Phase 72 | Complete |
| RULES-02 | Phase 72 | Complete |
| RULES-03 | Phase 72 | Complete |
| RULES-04 | Phase 73 | Complete |
| RULES-05 | Phase 73 | Complete |
| RULES-06 | Phase 73 | Complete |
| DOCS-01 | Phase 72 | Complete |
| DOCS-02 | Phase 73 | Complete |
| INTG-01 | Phase 74 | Pending |
| INTG-02 | Phase 74 | Pending |
| INTG-03 | Phase 74 | Pending |

**Coverage:**
- v1.12 requirements: 11 total
- Mapped to phases: 11
- Unmapped: 0

---
*Requirements defined: 2026-03-02*
*Last updated: 2026-03-02 after roadmap creation*
