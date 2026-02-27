# Roadmap: patrykgolabek.dev

## Milestones

- ~~v1.0 MVP~~ - Phases 1-7 (shipped 2026-02-11)
- ~~v1.1 Content Refresh~~ - Phases 8-12 (shipped 2026-02-12)
- ~~v1.2 Projects Page Redesign~~ - Phases 13-15 (shipped 2026-02-13)
- ~~v1.3 The Beauty Index~~ - Phases 16-21 (shipped 2026-02-17)
- ~~v1.4 Dockerfile Analyzer~~ - Phases 22-27 (shipped 2026-02-20)
- ~~v1.5 Database Compass~~ - Phases 28-32 (shipped 2026-02-22)
- ~~v1.6 Docker Compose Validator~~ - Phases 33-40 (shipped 2026-02-23)
- ~~v1.7 Kubernetes Manifest Analyzer~~ - Phases 41-47 (shipped 2026-02-23)
- ~~v1.8 EDA Visual Encyclopedia~~ - Phases 48-55 (shipped 2026-02-25)
- ~~v1.9 EDA Case Study Deep Dive~~ - Phases 56-63 (shipped 2026-02-27)
- **v1.10 EDA Graphical Techniques — NIST Parity & Validation** - Phases 64-68 (in progress)

## Phases

<details>
<summary>v1.0 through v1.9 (Phases 1-63) - SHIPPED</summary>

Phases 1-63 delivered across milestones v1.0-v1.9. 589 requirements, 146 plans completed.
See `.planning/milestones/` for detailed archives.

</details>

### v1.10 EDA Graphical Techniques — NIST Parity & Validation

- [x] **Phase 64: Infrastructure Foundation** - Split technique-content.ts, extend TechniqueContent interface, update graphical template with new sections and code slot (completed 2026-02-27)
- [x] **Phase 65: SVG Audit & Fixes** - Audit all 29 graphical technique SVGs against NIST originals and fix visual/data pattern issues (completed 2026-02-27)
- [x] **Phase 66: Content Depth** - Add Questions, Importance, expanded Definitions, Case Study cross-links, and Examples sections to all 29 technique pages (completed 2026-02-27)
- [ ] **Phase 67: Technical Depth** - Add KaTeX formulas for 12 techniques and Python code examples for all 29 techniques
- [ ] **Phase 68: Verification & Audit** - Full-sweep verification of build, Lighthouse, cross-links, formulas, and Python API correctness

## Phase Details

### Phase 64: Infrastructure Foundation
**Goal**: All infrastructure is in place so content and code can be added to any graphical technique page without further template or interface changes
**Depends on**: Nothing (first phase of v1.10)
**Requirements**: INFRA-01, INFRA-02, INFRA-03, INFRA-04, INFRA-05, INFRA-06
**Success Criteria** (what must be TRUE):
  1. technique-content.ts is split into per-category modules with identical public API (getTechniqueContent works unchanged)
  2. Adding a questions array, importance string, pythonCode string, formulas array, caseStudySlugs array, or examples content to any technique entry compiles and renders the corresponding new section on the page
  3. A technique with formulas renders KaTeX math at build time and loads KaTeX CSS only on that page (not on formula-free pages)
  4. A technique with caseStudySlugs renders linked pill buttons that resolve to real case study page titles and URLs
  5. A technique with pythonCode renders a syntax-highlighted Python code block via astro-expressive-code
**Plans**: 2 plans

Plans:
- [x] 64-01-PLAN.md — Split technique-content.ts into per-category modules and extend TechniqueContent interface
- [x] 64-02-PLAN.md — Update graphical [slug].astro template with new sections, KaTeX formula slot, Code slot, and case study resolution

### Phase 65: SVG Audit & Fixes
**Goal**: Every graphical technique SVG is visually accurate and statistically correct relative to its NIST original
**Depends on**: Phase 64
**Requirements**: SVG-01, SVG-02, SVG-03, SVG-04
**Success Criteria** (what must be TRUE):
  1. An audit checklist documents every SVG with pass/fail for axes, shapes, labels, scales, and data patterns
  2. All SVGs that had visual inaccuracies (wrong axis labels, missing gridlines, incorrect shapes) are fixed and match NIST originals
  3. All SVGs that had data pattern issues (datasets generating statistically incorrect patterns) are fixed with correct seeded PRNG datasets
  4. All 29 technique pages render their SVGs without console errors or layout shifts
**Plans**: 3 plans

Plans:
- [x] 65-01-PLAN.md — Wire dedicated generators for bihistogram, block-plot, mean-plot, std-deviation-plot, doe-plots, and restructure 6-plot as regression diagnostic
- [x] 65-02-PLAN.md — Fix autocorrelation confidence band, Box-Cox line rendering, Youden reference lines, and probability-plot differentiation
- [x] 65-03-PLAN.md — Build audit checklist, run full build verification, document final status of all 29 techniques

### Phase 66: Content Depth
**Goal**: Every graphical technique page has full NIST-parity prose sections: what questions the plot answers, why it matters, expanded definitions, relevant case study links, and interpretation examples
**Depends on**: Phase 64, Phase 65
**Requirements**: QUES-01, QUES-02, IMPT-01, IMPT-02, DEFN-01, CASE-01, CASE-02, CASE-03, EXMP-01, EXMP-02
**Success Criteria** (what must be TRUE):
  1. All 29 technique pages display a "Questions This Plot Answers" section with 2-9 specific, actionable questions sourced from NIST (not generic "what does this show?" questions)
  2. All 29 technique pages display a "Why It Matters" section connecting the technique to practical statistical or engineering consequences
  3. All 29 technique pages have expanded definitions covering axis meanings, construction method, and mathematical formulation where applicable
  4. At least 14 of 29 techniques display a "See It In Action" section with styled pill-button links to relevant case studies, and all linked case study URLs resolve to valid pages
  5. All 6 Tier B techniques have interpretive captions on their variant plots explaining what each pattern means, and Tier A techniques with NIST examples have an Examples section describing common patterns
**Plans**: 3 plans

Plans:
- [x] 66-01-PLAN.md — Populate time-series, designed-experiments, and multivariate content (10 techniques + Tier B captions)
- [x] 66-02-PLAN.md — Populate distribution-shape content (9 techniques + Tier B captions for histogram and normal-probability-plot)
- [x] 66-03-PLAN.md — Populate comparison, regression, and combined-diagnostic content (10 techniques + Tier B captions for scatter-plot)

### Phase 67: Technical Depth
**Goal**: Every graphical technique page has a self-contained Python code example, and the 12 techniques with NIST formulas have KaTeX-rendered math
**Depends on**: Phase 64, Phase 66
**Requirements**: DEFN-02, PYTH-01, PYTH-02, PYTH-03, PYTH-04
**Success Criteria** (what must be TRUE):
  1. All 12 techniques with NIST formulas display KaTeX-rendered formulas with no raw LaTeX visible on the page
  2. All 29 technique pages have a Python code example section with syntax-highlighted code via astro-expressive-code
  3. Every Python example is self-contained (includes sample data generation) and uses only current, non-deprecated matplotlib/seaborn/scipy APIs
  4. KaTeX CSS loads conditionally only on the 12 pages with formulas (Lighthouse performance score unaffected on the other 17)
**Plans**: TBD

Plans:
- [ ] 67-01: TBD
- [ ] 67-02: TBD
- [ ] 67-03: TBD

### Phase 68: Verification & Audit
**Goal**: The entire v1.10 milestone is validated with zero regressions, all cross-links resolving, and Lighthouse scores maintained
**Depends on**: Phase 67
**Requirements**: VRFY-01, VRFY-02, VRFY-03, VRFY-04, VRFY-05
**Success Criteria** (what must be TRUE):
  1. `astro build` completes cleanly with zero errors and zero warnings related to EDA technique pages
  2. Lighthouse performance score is 90+ on three representative graphical technique pages (one with formulas, one without, one Tier B with variants)
  3. Every case study cross-link on all 29 technique pages resolves to a valid page (no 404s)
  4. All KaTeX formulas across 12 technique pages render as styled math (no raw LaTeX strings visible)
  5. Zero deprecated Python API patterns (distplot, vert=True, plt.acorr without bounds) found via grep across all 29 code examples
**Plans**: TBD

Plans:
- [ ] 68-01: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 64 -> 65 -> 66 -> 67 -> 68

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1-7 | v1.0 MVP | 15/15 | Complete | 2026-02-11 |
| 8-12 | v1.1 Content Refresh | 7/7 | Complete | 2026-02-12 |
| 13-15 | v1.2 Projects Page Redesign | 6/6 | Complete | 2026-02-13 |
| 16-21 | v1.3 The Beauty Index | 15/15 | Complete | 2026-02-17 |
| 22-27 | v1.4 Dockerfile Analyzer | 13/13 | Complete | 2026-02-20 |
| 28-32 | v1.5 Database Compass | 10/10 | Complete | 2026-02-22 |
| 33-40 | v1.6 Docker Compose Validator | 14/14 | Complete | 2026-02-23 |
| 41-47 | v1.7 Kubernetes Manifest Analyzer | 23/23 | Complete | 2026-02-23 |
| 48-55 | v1.8 EDA Visual Encyclopedia | 24/24 | Complete | 2026-02-25 |
| 56-63 | v1.9 EDA Case Study Deep Dive | 19/19 | Complete | 2026-02-27 |
| 64. Infrastructure Foundation | v1.10 | 2/2 | Complete | 2026-02-27 |
| 65. SVG Audit & Fixes | v1.10 | 3/3 | Complete | 2026-02-27 |
| 66. Content Depth | v1.10 | 3/3 | Complete | 2026-02-27 |
| 67. Technical Depth | v1.10 | 0/TBD | Not started | - |
| 68. Verification & Audit | v1.10 | 0/TBD | Not started | - |
