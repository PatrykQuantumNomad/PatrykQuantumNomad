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
- 🚧 **v1.9 EDA Case Study Deep Dive** - Phases 56-63 (in progress)

## Phases

<details>
<summary>v1.0 through v1.8 (Phases 1-55) - SHIPPED</summary>

Phases 1-55 delivered across milestones v1.0-v1.8. 548 requirements, 127 plans completed.
See `.planning/milestones/` for detailed archives.

</details>

### 🚧 v1.9 EDA Case Study Deep Dive (In Progress)

**Milestone Goal:** Enhance all EDA case studies to match NIST/SEMATECH source depth with individual plot subsections, detailed quantitative test results, interpretation sections, and develop/validate model sections. Add Standard Resistor as a new case study.

**Phase Numbering:**
- Integer phases (56, 57, 58...): Planned milestone work
- Decimal phases (57.1, 57.2): Urgent insertions (marked with INSERTED)

- [x] **Phase 56: Infrastructure Foundation** - Hypothesis test library, shared components, canonical template, and cross-reference cheat sheet
- [ ] **Phase 57: Minor-Gap Case Studies** - Complete Normal Random Numbers, Cryothermometry, Filter Transmittance, and Heat Flow Meter to full NIST parity
- [x] **Phase 58: Standard Resistor Case Study** - Build new case study from scratch with DZIUBA1.DAT dataset (completed 2026-02-27)
- [x] **Phase 59: Uniform Random Numbers Enhancement** - Complete with uniform PDF overlay and full quantitative results (completed 2026-02-27)
- [x] **Phase 60: Beam Deflections Deep Dive** - Sinusoidal model fitting, residual diagnostics, and develop/validate model sections (completed 2026-02-27)
- [x] **Phase 61: Fatigue Life Deep Dive** - Distribution fitting, Weibull/gamma probability plots, and comparison analysis (completed 2026-02-27)
- [x] **Phase 62: Ceramic Strength DOE** - Multi-factor DOE analysis with batch/lab effects, bihistogram, block plots, and interaction plots (completed 2026-02-27)
- [ ] **Phase 63: Validation** - Cross-reference link verification, build validation, and statistical value audit

## Phase Details

### Phase 56: Infrastructure Foundation
**Goal**: All shared infrastructure is in place so every content phase can focus purely on content writing and verification
**Depends on**: Nothing (first phase of v1.9)
**Requirements**: INFRA-01, INFRA-02, INFRA-03, INFRA-04
**Success Criteria** (what must be TRUE):
  1. Hypothesis test functions (runs test, Levene, Bartlett, Anderson-Darling, Grubbs, PPCC, location regression t-test) exist in the statistics library and return correct values when called with known NIST dataset arrays
  2. A shared PlotFigure.astro wrapper component renders figure HTML with consistent markup, and at least one existing Plots component uses it instead of inline figure HTML
  3. A canonical section template document exists defining the standard heading structure for case studies, and a URL cross-reference cheat sheet maps all technique/quantitative slugs to prevent broken links
**Plans**: 2 plans

Plans:
- [x] 56-01-PLAN.md — Hypothesis test functions (TDD: 7 test functions + 6 helpers validated against NIST datasets)
- [x] 56-02-PLAN.md — PlotFigure extraction, canonical template, and URL cross-reference cheat sheet

### Phase 57: Minor-Gap Case Studies
**Goal**: Four nearly-complete case studies reach full NIST parity with computed quantitative results, individual plot subsections, and interpretation sections
**Depends on**: Phase 56
**Requirements**: NRN-01, NRN-02, NRN-03, CRYO-01, CRYO-02, CRYO-03, FILT-01, FILT-02, FILT-03, HFM-01, HFM-02, HFM-03
**Success Criteria** (what must be TRUE):
  1. Each of the 4 case studies (Normal Random Numbers, Cryothermometry, Filter Transmittance, Heat Flow Meter) has individually named plot subsections with dataset-specific captions and per-plot interpretation paragraphs
  2. Each of the 4 case studies has a Quantitative Results section with summary statistics table, hypothesis test results (location, variation, randomness, distribution, outlier), and a Test Summary table showing pass/fail for each assumption
  3. Each of the 4 case studies has an Interpretation section that synthesizes graphical and quantitative evidence into conclusions about the dataset assumptions
  4. All test statistic values in quantitative tables are computed from dataset arrays and match NIST source values
**Plans**: 3 plans

Plans:
- [x] 57-01-PLAN.md — Add Interpretation sections to Normal Random Numbers and Heat Flow Meter, verify NIST values, resolve HFM PPCC discrepancy
- [x] 57-02-PLAN.md — Fix Cryothermometry heading structure to canonical format and add Interpretation section
- [x] 57-03-PLAN.md — Restructure Filter Transmittance with canonical headings, add missing Histogram/Probability Plot subsections, add Interpretation section

### Phase 58: Standard Resistor Case Study
**Goal**: A complete new case study for NIST Section 1.4.2.7 (Standard Resistor) exists with the same depth and structure as the enhanced Phase 57 studies
**Depends on**: Phase 57
**Requirements**: RSTR-01, RSTR-02, RSTR-03, RSTR-04
**Success Criteria** (what must be TRUE):
  1. DZIUBA1.DAT dataset (1000 observations) is present in datasets.ts and the array length is verified as exactly 1000
  2. StandardResistorPlots.astro component renders all required plot types (run sequence, lag, histogram, normal probability, autocorrelation, spectral) with computed data from the dataset array
  3. Standard Resistor MDX page is accessible at its case study URL with Background and Data, individual named plot subsections, quantitative results, interpretation, and conclusions sections
  4. Standard Resistor appears in case study navigation, CaseStudyDataset.astro mapping, and is cross-referenced from relevant technique pages
**Plans:** 2/2 plans complete

Plans:
- [x] 58-01-PLAN.md — Dataset array (1000 values) + StandardResistorPlots.astro + CaseStudyDataset registration
- [x] 58-02-PLAN.md — Full MDX page with all sections, NIST-verified statistics, and cross-references

### Phase 59: Uniform Random Numbers Enhancement
**Goal**: Uniform Random Numbers case study reaches full NIST parity including the uniform PDF overlay that distinguishes it from the standard-pattern studies
**Depends on**: Phase 56
**Requirements**: URN-01, URN-02, URN-03, URN-04
**Success Criteria** (what must be TRUE):
  1. Uniform Random Numbers has individually named plot subsections with per-plot interpretation
  2. Quantitative results section includes full test suite with summary statistics, hypothesis test results, and Test Summary table
  3. Histogram includes a uniform PDF overlay showing the expected distribution fit against the observed data
  4. Interpretation section synthesizes all graphical and quantitative evidence into conclusions
**Plans:** 2/2 plans complete

Plans:
- [x] 59-01-PLAN.md — Uniform PDF overlay option in histogram generator + UniformRandomPlots update
- [x] 59-02-PLAN.md — Interpretation section content + URN-01/URN-02 verification

### Phase 60: Beam Deflections Deep Dive
**Goal**: Beam Deflections case study includes full model development and validation workflow matching NIST depth, with sinusoidal model fitting and complete residual diagnostics
**Depends on**: Phase 56
**Requirements**: BEAM-01, BEAM-02, BEAM-03, BEAM-04, BEAM-05
**Success Criteria** (what must be TRUE):
  1. Individual named plot subsections exist for both original data and residual analysis, each with per-plot interpretation
  2. Quantitative results section includes full test suite for original data with Test Summary table
  3. Develop Better Model section presents sinusoidal/polynomial model fitting with regression parameter estimates matching NIST values (C, AMP, FREQ, PHASE verified against source)
  4. Validate New Model section includes residual diagnostics (4-plot, run sequence, lag, histogram, probability, autocorrelation, spectral) with a validation summary table
  5. Interpretation section synthesizes evidence from both original and model-based analysis
**Plans**: 3 plans

Plans:
- [x] 60-01-PLAN.md — Add residual-spectral plot type and per-plot interpretation for all 7 residual subsections
- [x] 60-02-PLAN.md — Expand Develop Better Model with NIST regression parameters and residual SD comparison
- [x] 60-03-PLAN.md — Validation Summary table, Interpretation section, and Conclusions update

### Phase 61: Fatigue Life Deep Dive
**Goal**: Fatigue Life case study includes distribution fitting analysis with Weibull and gamma probability plots matching NIST depth
**Depends on**: Phase 56
**Requirements**: FAT-01, FAT-02, FAT-03, FAT-04
**Success Criteria** (what must be TRUE):
  1. Individual named plot subsections exist with per-plot interpretation for all standard plot types
  2. Quantitative results section includes distribution fitting tests and Test Summary table
  3. Distribution comparison plots show Weibull and gamma probability plots with fitted overlays, demonstrating which distribution best fits the data
  4. Interpretation section synthesizes graphical and quantitative evidence including distribution selection reasoning
**Plans**: 3 plans

Plans:
- [x] 61-01-PLAN.md — Restructure MDX to canonical Distribution Focus Variation template with named plot subsections
- [x] 61-02-PLAN.md — Gamma probability plot engineering, Weibull/gamma distribution comparison plots, and full quantitative test battery
- [x] 61-03-PLAN.md — Interpretation section synthesizing distribution selection evidence and Conclusions update

### Phase 62: Ceramic Strength DOE
**Goal**: Ceramic Strength case study includes full multi-factor DOE analysis with batch effects, lab effects, and primary factors analysis matching the unique NIST 6-section structure
**Depends on**: Phase 56
**Requirements**: CER-01, CER-02, CER-03, CER-04, CER-05
**Success Criteria** (what must be TRUE):
  1. Response variable analysis section has individual plot subsections for the overall dataset
  2. Batch effect analysis section includes batch-specific plots and statistical tests comparing batches
  3. Lab effect analysis section includes lab-specific plots and statistical tests comparing labs
  4. Primary factors analysis section includes DOE-specific visualizations (bihistogram, block plots, interaction plots) showing factor effects
  5. Interpretation section synthesizes multi-factor evidence into conclusions about which factors significantly affect ceramic strength
**Plans**: 2 plans

Plans:
- [x] 62-01-PLAN.md — DOE SVG generators (bihistogram, DOE mean, block plot, interaction), MDX restructure to DOE template, Batch/Lab effect subsections
- [x] 62-02-PLAN.md — Primary Factors DOE visualizations, Interpretation section, and Conclusions update

### Phase 63: Validation
**Goal**: All 9 enhanced case studies are verified for link integrity, build correctness, and statistical accuracy
**Depends on**: Phase 57, Phase 58, Phase 59, Phase 60, Phase 61, Phase 62
**Requirements**: VAL-01, VAL-02, VAL-03
**Success Criteria** (what must be TRUE):
  1. All cross-reference links across all 9 case studies resolve correctly with zero 404s (technique, quantitative, distribution, and inter-case-study links)
  2. `npx astro check` reports 0 errors and `npx astro build` completes successfully with no regressions
  3. Statistical values in all quantitative tables have been verified against NIST source data with zero discrepancies in test statistics, critical values, and conclusions
**Plans**: 2 plans

Plans:
- [ ] 63-01-PLAN.md — Cross-reference link integrity and statistical value audit against NIST sources
- [ ] 63-02-PLAN.md — Astro build validation and REQUIREMENTS.md checkbox cleanup

## Progress

**Execution Order:**
Phases execute in numeric order: 56 → 57 → 58 → 59 → 60 → 61 → 62 → 63
Note: Phases 59-62 all depend only on Phase 56 (not on each other), but execute sequentially for consistency.

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
| 56. Infrastructure Foundation | v1.9 | 2/2 | Complete | 2026-02-27 |
| 57. Minor-Gap Case Studies | v1.9 | 3/3 | Complete | 2026-02-27 |
| 58. Standard Resistor Case Study | v1.9 | 2/2 | Complete | 2026-02-27 |
| 59. Uniform Random Numbers Enhancement | v1.9 | 2/2 | Complete | 2026-02-27 |
| 60. Beam Deflections Deep Dive | v1.9 | 3/3 | Complete | 2026-02-27 |
| 61. Fatigue Life Deep Dive | v1.9 | 3/3 | Complete | 2026-02-27 |
| 62. Ceramic Strength DOE | v1.9 | 2/2 | Complete | 2026-02-27 |
| 63. Validation | v1.9 | 0/2 | Not started | - |
| **Total** | **v1.0-v1.9** | **144/146** | **99%** | |
