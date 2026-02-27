---
gsd_state_version: 1.0
milestone: v1.10
milestone_name: EDA Graphical Techniques — NIST Parity & Validation
status: active
last_updated: "2026-02-27T20:20:36Z"
progress:
  total_phases: 68
  completed_phases: 66
  total_plans: 158
  completed_plans: 158
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-27)

**Core value:** A fast, SEO-optimized, visually distinctive portfolio that ranks well in search engines and makes a memorable impression on recruiters, collaborators, and the developer community.
**Current focus:** Phase 67 — Technical Depth (v1.10)

## Current Position

Phase: 67 of 68 (Technical Depth)
Plan: 3 of 3 in current phase
Status: Phase 67 complete, ready for Phase 68
Last activity: 2026-02-27 — Completed Phase 67 (Technical Depth)

Progress: █████████░ 80% (v1.10: 4/5 phases complete)

## Performance Metrics

**Velocity:**
- Total plans completed: 158 (15 v1.0 + 7 v1.1 + 6 v1.2 + 15 v1.3 + 13 v1.4 + 10 v1.5 + 14 v1.6 + 23 v1.7 + 24 v1.8 + 19 v1.9 + 12 v1.10)

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
| v1.7 K8s Analyzer | 41-47 | 23 | 123 | 2026-02-23 |
| v1.8 EDA Encyclopedia | 48-55 | 24 | 145 | 2026-02-25 |
| v1.9 Case Study Deep Dive | 56-63 | 19 | 41 | 2026-02-27 |
| v1.10 (in progress) | 64-67 | 12 | 15 | - |
| **Total** | **67** | **158** | **597** | |

**Phase 64 Metrics:**

| Plan | Duration | Tasks | Files |
|------|----------|-------|-------|
| 64-01 | 7min | 2 | 10 |
| 64-02 | 3min | 2 | 1 |

**Phase 65 Metrics:**

| Plan | Duration | Tasks | Files |
|------|----------|-------|-------|
| 65-01 | 11min | 2 | 2 |
| 65-02 | 6min | 2 | 2 |
| 65-03 | 4min | 3 | 1 |
| Phase 66 P01 | 4min | 2 tasks | 3 files |
| Phase 66 P02 | 5min | 2 tasks | 2 files |
| Phase 66 P03 | 5min | 2 tasks | 3 files |
| Phase 67 P01 | 5min | 2 tasks | 2 files |
| Phase 67 P02 | 6min | 2 tasks | 1 files |
| Phase 67 P03 | 5min | 2 tasks | 4 files |

## Accumulated Context

### Decisions

Full decision log in PROJECT.md Key Decisions table.
v1.0-v1.9 decisions archived in respective milestone files.

- [64-01] Split monolith by NIST category for domain coherence (not alphabetically)
- [64-01] Extended existing TechniqueContent interface in place (no V2 migration)
- [64-02] Data-driven useKatex from content.formulas (never hardcoded)
- [64-02] Case study resolution in getStaticPaths for build-time validation
- [65-01] Removed generateBarPlot import entirely since all bar-chart usages replaced by dedicated generators
- [65-01] 6-plot accepts bivariate scatterData and computes regression internally
- [65-01] DOE plots composition kept but inner panels switched to generateDoeMeanPlot
- [Phase 65]: Used 2/sqrt(N) for NIST consistency over 1.96/sqrt(N) statistical precision
- [Phase 65]: Polyline injection over generateLinePlot for Box-Cox (preserves scatter dots + adds connecting line)
- [65-03] All 11 HIGH/MEDIUM issues confirmed FIXED via code review against NIST specifications
- [65-03] Star plot and scatterplot matrix marked MINOR (cosmetic), not requiring fixes
- [65-03] 35/35 Tier B variant datasets validated as producing correct statistical patterns
- [Phase 66]: Omitted caseStudySlugs entirely for techniques with no matching case study (not empty array)
- [66-02] Unicode symbols for math notation in prose fields to avoid KaTeX dependency in definitionExpanded
- [66-03] Unicode characters for mathematical symbols in definitionExpanded (lambda, beta, eta, em-dash)
- [67-01] Tukey-Lambda ppf() with seeded RNG for PPCC example (avoids scipy rvs random_state parameter)
- [67-01] 4-plot formula uses LaTeX bmatrix for 2x2 diagnostic ensemble definition
- [67-02] Filliben approximation for normal order statistic medians formula (matches NIST convention)
- [67-02] Bootstrap pythonCode uses both scipy.stats.bootstrap for CI and manual loop for histogram visualization
- [67-02] QQ-plot uses manual two-sample quantile matching with np.quantile for pedagogical clarity
- [67-02] Hazen plotting positions (p_i = (i-0.5)/N) for QQ-plot formula per NIST 1.3.3.24
- [67-03] 6-plot autocorrelation panel uses manual computation (not plt.acorr) per NIST requirements
- [67-03] scatterplot-matrix uses sns.pairplot with pandas DataFrame for idiomatic Python

### Pending Todos

None.

### Blockers/Concerns

- [SEO]: Bulk publishing 90+ template-similar pages risks SpamBrain classification (monitor post-deploy)
- [v1.10]: ~~technique-content.ts must be split BEFORE adding content~~ RESOLVED in 64-01 (split into 9 modules)
- [v1.10]: Python examples must avoid deprecated APIs (distplot, vert=True, plt.acorr) -- grep validation required

### Quick Tasks Completed

| # | Description | Date | Commit | Directory |
|---|-------------|------|--------|-----------|
| 010 | Correctness validation | 2026-02-26 | 9d20b42 | [010-correctness-validation](./quick/010-correctness-validation/) |
| 011 | EDA content correctness validation | 2026-02-26 | 958be19 | [011-eda-content-correctness-validation](./quick/011-eda-content-correctness-validation/) |

## Session Continuity

Last session: 2026-02-27
Stopped at: Completed 67-03-PLAN.md (comparison/designed-experiments/regression/multivariate Python + formulas)
Resume file: None
Next: Phase 67 fully complete, ready for Phase 68
