# Requirements: patrykgolabek.dev

**Defined:** 2026-02-26
**Core Value:** A fast, SEO-optimized, visually distinctive portfolio that ranks well in search engines and makes a memorable impression on recruiters, collaborators, and the developer community.

## v1.9 Requirements

Requirements for EDA Case Study Deep Dive milestone. Each maps to roadmap phases.

### Infrastructure

- [x] **INFRA-01**: Hypothesis test functions added to statistics library (runs test, Levene test, Bartlett test, Anderson-Darling, Grubbs test, PPCC, location regression t-test)
- [x] **INFRA-02**: Shared PlotFigure.astro wrapper component extracted from existing *Plots.astro pattern to reduce duplication
- [x] **INFRA-03**: Canonical case study section template defined and documented for consistent structure across all 9 case studies
- [x] **INFRA-04**: Cross-reference URL cheat sheet created mapping technique/quantitative slugs to prevent broken links

### Case Study — Normal Random Numbers

- [x] **NRN-01**: Individual named plot subsections (4-plot, run sequence, lag, histogram, normal probability, autocorrelation, spectral) with per-plot interpretation
- [x] **NRN-02**: Quantitative results with summary statistics table, location test, variation test (Bartlett), randomness tests (runs + autocorrelation), normality test (Anderson-Darling), outlier test (Grubbs), and test summary table
- [x] **NRN-03**: Interpretation section synthesizing graphical and quantitative evidence

### Case Study — Uniform Random Numbers

- [ ] **URN-01**: Individual named plot subsections with per-plot interpretation
- [ ] **URN-02**: Quantitative results with full test suite and test summary table
- [x] **URN-03**: Histogram with uniform PDF overlay showing distributional fit
- [ ] **URN-04**: Interpretation section synthesizing evidence

### Case Study — Cryothermometry

- [x] **CRYO-01**: Individual named plot subsections (4-plot, run sequence, lag, histogram, normal probability, autocorrelation, spectral) with per-plot interpretation
- [x] **CRYO-02**: Quantitative results with full test suite and test summary table
- [x] **CRYO-03**: Interpretation section synthesizing evidence

### Case Study — Beam Deflections

- [ ] **BEAM-01**: Individual named plot subsections with per-plot interpretation for both original data and residuals
- [ ] **BEAM-02**: Quantitative results with full test suite and test summary table
- [ ] **BEAM-03**: Develop Better Model section with sinusoidal/polynomial model fitting and regression results
- [ ] **BEAM-04**: Validate New Model section with residual diagnostics (4-plot, run sequence, lag, histogram, probability, autocorrelation, spectral) and validation summary table
- [ ] **BEAM-05**: Interpretation section synthesizing evidence

### Case Study — Filter Transmittance

- [x] **FILT-01**: Individual named plot subsections with per-plot interpretation
- [x] **FILT-02**: Quantitative results with full test suite and test summary table
- [x] **FILT-03**: Interpretation section synthesizing evidence

### Case Study — Standard Resistor (New)

- [ ] **RSTR-01**: Dataset entry added to datasets.ts with NIST DZIUBA1.DAT data (1000 observations)
- [ ] **RSTR-02**: StandardResistorPlots.astro component created with all required plot types
- [x] **RSTR-03**: Full MDX page with Background and Data, individual named plot subsections, quantitative results, interpretation, and conclusions
- [x] **RSTR-04**: Registered in case study navigation and cross-referenced from technique pages

### Case Study — Heat Flow Meter

- [x] **HFM-01**: Individual named plot subsections with per-plot interpretation
- [x] **HFM-02**: Quantitative results with full test suite and test summary table
- [x] **HFM-03**: Interpretation section synthesizing evidence

### Case Study — Fatigue Life

- [ ] **FAT-01**: Individual named plot subsections with per-plot interpretation
- [ ] **FAT-02**: Quantitative results with distribution fitting tests and test summary table
- [ ] **FAT-03**: Distribution comparison plots (Weibull, gamma probability plots with fitted overlays)
- [ ] **FAT-04**: Interpretation section synthesizing evidence

### Case Study — Ceramic Strength

- [ ] **CER-01**: Response variable analysis with individual plot subsections
- [ ] **CER-02**: Batch effect analysis with batch-specific plots and tests
- [ ] **CER-03**: Lab effect analysis with lab-specific plots and tests
- [ ] **CER-04**: Primary factors analysis with DOE-specific visualizations (bihistogram, block plots, interaction plots)
- [ ] **CER-05**: Interpretation section synthesizing multi-factor evidence

### Validation

- [ ] **VAL-01**: All cross-reference links verified working across all 9 enhanced case studies
- [ ] **VAL-02**: npx astro check reports 0 errors and npx astro build completes successfully
- [ ] **VAL-03**: Statistical values in quantitative tables verified against NIST source data

## v2 Requirements

Deferred to future release.

- **EDA-FUTURE-01**: User data upload for all EDA techniques (4-Plot tool covers valuable use case)
- **EDA-FUTURE-02**: Interactive parameter fitting on case study pages

## Out of Scope

| Feature | Reason |
|---------|--------|
| New OG images per case study | Existing OG images sufficient; case studies share EDA pillar OG |
| Complex demodulation implementation | Textual description sufficient for Beam Deflections |
| In-browser Python/R execution | 14MB+ WASM destroys performance |
| MLE distribution fitting | Hardcode NIST parameter estimates instead |
| Nonlinear least squares solver | Hardcode NIST regression parameters, compute residuals from those |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| INFRA-01 | Phase 56 | Complete |
| INFRA-02 | Phase 56 | Complete |
| INFRA-03 | Phase 56 | Complete |
| INFRA-04 | Phase 56 | Complete |
| NRN-01 | Phase 57 | Complete |
| NRN-02 | Phase 57 | Complete |
| NRN-03 | Phase 57 | Complete |
| CRYO-01 | Phase 57 | Complete |
| CRYO-02 | Phase 57 | Complete |
| CRYO-03 | Phase 57 | Complete |
| FILT-01 | Phase 57 | Complete |
| FILT-02 | Phase 57 | Complete |
| FILT-03 | Phase 57 | Complete |
| HFM-01 | Phase 57 | Complete |
| HFM-02 | Phase 57 | Complete |
| HFM-03 | Phase 57 | Complete |
| RSTR-01 | Phase 58 | Pending |
| RSTR-02 | Phase 58 | Pending |
| RSTR-03 | Phase 58 | Complete |
| RSTR-04 | Phase 58 | Complete |
| URN-01 | Phase 59 | Pending |
| URN-02 | Phase 59 | Pending |
| URN-03 | Phase 59 | Complete |
| URN-04 | Phase 59 | Pending |
| BEAM-01 | Phase 60 | Pending |
| BEAM-02 | Phase 60 | Pending |
| BEAM-03 | Phase 60 | Pending |
| BEAM-04 | Phase 60 | Pending |
| BEAM-05 | Phase 60 | Pending |
| FAT-01 | Phase 61 | Pending |
| FAT-02 | Phase 61 | Pending |
| FAT-03 | Phase 61 | Pending |
| FAT-04 | Phase 61 | Pending |
| CER-01 | Phase 62 | Pending |
| CER-02 | Phase 62 | Pending |
| CER-03 | Phase 62 | Pending |
| CER-04 | Phase 62 | Pending |
| CER-05 | Phase 62 | Pending |
| VAL-01 | Phase 63 | Pending |
| VAL-02 | Phase 63 | Pending |
| VAL-03 | Phase 63 | Pending |

**Coverage:**
- v1.9 requirements: 41 total
- Mapped to phases: 41/41
- Unmapped: 0

---
*Requirements defined: 2026-02-26*
*Last updated: 2026-02-26 after roadmap creation*
