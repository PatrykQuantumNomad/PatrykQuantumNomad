# Requirements: patrykgolabek.dev — v1.8 EDA Visual Encyclopedia

**Defined:** 2026-02-24
**Core Value:** A fast, SEO-optimized, visually distinctive portfolio that ranks well in search engines and makes a memorable impression on recruiters, collaborators, and the developer community.

## v1.8 Requirements

Requirements for the EDA Visual Encyclopedia milestone. Each maps to roadmap phases.

### Infrastructure

- [x] **INFRA-01**: KaTeX pipeline installed and configured (remark-math + rehype-katex) with build-time formula rendering and zero client-side JS
- [x] **INFRA-02**: KaTeX CSS and woff2 fonts self-hosted, loaded conditionally only on EDA pages that use formulas
- [x] **INFRA-03**: D3 micro-modules (d3-scale, d3-shape, d3-axis, d3-selection, d3-array, d3-path) installed and verified to load only on distribution pages via client:visible
- [x] **INFRA-04**: EDALayout.astro created extending base Layout.astro with isolated animation lifecycle (no GSAP/D3 conflicts)
- [x] **INFRA-05**: OG image caching implemented (content-hash based) to prevent build time regression with 90+ new pages
- [x] **INFRA-06**: Zod schemas defined for EdaTechnique and EdaDistribution content types in content.config.ts
- [x] **INFRA-07**: Three content collections registered: edaTechniques (JSON file() loader), edaDistributions (JSON file() loader), edaPages (MDX glob() loader)
- [x] **INFRA-08**: EDA technique page template (TechniquePage.astro) with slots for plot, formulas, Python code, interpretation, related links
- [x] **INFRA-09**: Breadcrumb component for EDA pages (EDA > Section > Technique)
- [x] **INFRA-10**: KaTeX test page validates 10+ representative NIST formula categories without build errors
- [x] **INFRA-11**: Vite bundle analysis confirms D3 modules appear only in Tier C page chunks

### Data Model

- [x] **DATA-01**: techniques.json populated with all 29 graphical technique entries (title, slug, section ref, category, description, related techniques, interactivity tier). Note: NIST catalog consolidates to 29 graphical techniques; GRAPH-30 is the PlotVariantSwap component, not a data entry.
- [x] **DATA-02**: techniques.json populated with all 18 quantitative technique entries
- [x] **DATA-03**: distributions.json populated with all 19 probability distribution entries (title, slug, parameters, PDF/CDF formulas, related distributions)
- [x] **DATA-04**: Each technique tagged with interactivity tier (A/B/C) and variant count
- [x] **DATA-05**: MDX stub files created for 6 foundations pages with NIST section references
- [x] **DATA-06**: MDX stub files created for 9 case study pages with NIST section references
- [x] **DATA-07**: MDX stub files created for 4 reference pages
- [x] **DATA-08**: Sample datasets defined in datasets.ts for technique plot generation (NIST reference data)
- [x] **DATA-09**: All cross-linking slugs pre-populated and validated against route structure

### SVG Generators

- [x] **SVG-01**: Plot base generator (plot-base.ts) with shared axes, grid lines, viewBox responsiveness, and Quantum Explorer palette
- [x] **SVG-02**: Histogram SVG generator with configurable bin count and kernel density overlay
- [x] **SVG-03**: Box plot SVG generator with quartile markers, median line, whiskers, and outlier dots
- [x] **SVG-04**: Scatter plot SVG generator with optional regression line and confidence band
- [x] **SVG-05**: Line plot SVG generator for run-sequence, autocorrelation, and time series plots
- [x] **SVG-06**: Probability plot SVG generator (normal probability, Q-Q, Weibull, PPCC)
- [x] **SVG-07**: Bar plot SVG generator for mean plots, standard deviation plots, and DOE plots
- [x] **SVG-08**: Contour plot SVG generator for response surface visualization
- [x] **SVG-09**: Star plot (radar) SVG generator for multivariate display
- [x] **SVG-10**: Composite plot generators for 4-plot and 6-plot layouts
- [x] **SVG-11**: Distribution curve SVG generator for PDF/CDF static rendering (build-time fallback for Tier C)
- [x] **SVG-12**: All SVG plots use viewBox for responsiveness with no fixed width/height
- [x] **SVG-13**: All SVG plots render correctly in both dark and light themes
- [x] **SVG-14**: Spectral plot SVG generator for frequency domain visualization
- [x] **SVG-15**: Lag plot SVG generator for autocorrelation pattern detection

### Graphical Techniques

- [x] **GRAPH-01**: Histogram page at /eda/techniques/histogram/ with 8 interpretation variant sub-sections and SVG swap (Tier B)
- [x] **GRAPH-02**: Box plot page at /eda/techniques/box-plot/ with annotated diagram
- [x] **GRAPH-03**: Scatter plot page at /eda/techniques/scatter-plot/ with 12 relationship variant sub-sections and SVG swap (Tier B)
- [x] **GRAPH-04**: Normal probability plot page at /eda/techniques/normal-probability-plot/ with 4 shape variants (Tier B)
- [x] **GRAPH-05**: Run-sequence plot page at /eda/techniques/run-sequence-plot/
- [x] **GRAPH-06**: Lag plot page at /eda/techniques/lag-plot/ with 4 variants (Tier B)
- [x] **GRAPH-07**: Autocorrelation plot page at /eda/techniques/autocorrelation-plot/ with 4 variants (Tier B)
- [x] **GRAPH-08**: 4-plot page at /eda/techniques/4-plot/ with composite layout
- [x] **GRAPH-09**: 6-plot page at /eda/techniques/6-plot/ with extended composite layout
- [x] **GRAPH-10**: Probability plot page at /eda/techniques/probability-plot/
- [x] **GRAPH-11**: Q-Q plot page at /eda/techniques/qq-plot/
- [x] **GRAPH-12**: Spectral plot page at /eda/techniques/spectral-plot/ with 3 variants (Tier B)
- [x] **GRAPH-13**: Bihistogram page at /eda/techniques/bihistogram/
- [x] **GRAPH-14**: Block plot page at /eda/techniques/block-plot/
- [x] **GRAPH-15**: Bootstrap plot page at /eda/techniques/bootstrap-plot/
- [x] **GRAPH-16**: Box-Cox linearity plot page at /eda/techniques/box-cox-linearity/
- [x] **GRAPH-17**: Box-Cox normality plot page at /eda/techniques/box-cox-normality/
- [x] **GRAPH-18**: Complex demodulation page at /eda/techniques/complex-demodulation/
- [x] **GRAPH-19**: Contour plot page at /eda/techniques/contour-plot/
- [x] **GRAPH-20**: Star plot page at /eda/techniques/star-plot/
- [x] **GRAPH-21**: Weibull plot page at /eda/techniques/weibull-plot/
- [x] **GRAPH-22**: Youden plot page at /eda/techniques/youden-plot/
- [x] **GRAPH-23**: Mean plot page at /eda/techniques/mean-plot/
- [x] **GRAPH-24**: Standard deviation plot page at /eda/techniques/std-deviation-plot/
- [x] **GRAPH-25**: PPCC plot page at /eda/techniques/ppcc-plot/
- [x] **GRAPH-26**: Linear plots page at /eda/techniques/linear-plots/ (correlation, intercept, slope, residual SD)
- [x] **GRAPH-27**: DOE plots page at /eda/techniques/doe-plots/ (scatter, mean, SD)
- [x] **GRAPH-28**: Scatterplot matrix page at /eda/techniques/scatterplot-matrix/
- [x] **GRAPH-29**: Conditioning plot page at /eda/techniques/conditioning-plot/
- [x] **GRAPH-30**: PlotVariantSwap.astro component for Tier B pages with vanilla JS tab switching (~3KB)

### Quantitative Techniques

- [ ] **QUANT-01**: Measures of location page at /eda/quantitative/measures-of-location/ with KaTeX formulas
- [ ] **QUANT-02**: Confidence limits page at /eda/quantitative/confidence-limits/ with KaTeX formulas
- [ ] **QUANT-03**: Two-sample t-test page at /eda/quantitative/two-sample-t-test/ with KaTeX formulas and Python code
- [ ] **QUANT-04**: One-factor ANOVA page at /eda/quantitative/one-factor-anova/ with KaTeX formulas and Python code
- [ ] **QUANT-05**: Multi-factor ANOVA page at /eda/quantitative/multi-factor-anova/ with KaTeX formulas
- [ ] **QUANT-06**: Measures of scale page at /eda/quantitative/measures-of-scale/ with KaTeX formulas
- [ ] **QUANT-07**: Bartlett's test page at /eda/quantitative/bartletts-test/ with KaTeX formulas and Python code
- [ ] **QUANT-08**: Chi-square SD test page at /eda/quantitative/chi-square-sd-test/ with KaTeX formulas
- [ ] **QUANT-09**: F-test page at /eda/quantitative/f-test/ with KaTeX formulas and Python code
- [ ] **QUANT-10**: Levene test page at /eda/quantitative/levene-test/ with KaTeX formulas and Python code
- [ ] **QUANT-11**: Skewness and kurtosis page at /eda/quantitative/skewness-kurtosis/ with KaTeX formulas
- [ ] **QUANT-12**: Autocorrelation page at /eda/quantitative/autocorrelation/ with KaTeX formulas
- [ ] **QUANT-13**: Runs test page at /eda/quantitative/runs-test/ with KaTeX formulas
- [ ] **QUANT-14**: Anderson-Darling test page at /eda/quantitative/anderson-darling/ with KaTeX formulas and Python code
- [ ] **QUANT-15**: Chi-square goodness-of-fit page at /eda/quantitative/chi-square-gof/ with KaTeX formulas
- [ ] **QUANT-16**: Kolmogorov-Smirnov test page at /eda/quantitative/kolmogorov-smirnov/ with KaTeX formulas and Python code
- [ ] **QUANT-17**: Grubbs' test page at /eda/quantitative/grubbs-test/ with KaTeX formulas and Python code
- [ ] **QUANT-18**: Yates analysis page at /eda/quantitative/yates-analysis/ with KaTeX formulas

### Foundations

- [ ] **FOUND-01**: "What is EDA?" page at /eda/foundations/what-is-eda/ covering section 1.1.1-1.1.4
- [ ] **FOUND-02**: "Role of Graphics" page at /eda/foundations/role-of-graphics/ covering section 1.1.5-1.1.6
- [ ] **FOUND-03**: "Problem Categories" page at /eda/foundations/problem-categories/ covering section 1.1.7
- [ ] **FOUND-04**: "Assumptions" page at /eda/foundations/assumptions/ covering section 1.2.1-1.2.3
- [ ] **FOUND-05**: "The 4-Plot" page at /eda/foundations/the-4-plot/ covering section 1.2.4
- [ ] **FOUND-06**: "When Assumptions Fail" page at /eda/foundations/when-assumptions-fail/ covering section 1.2.5

### Distributions

- [ ] **DIST-01**: Normal distribution page at /eda/distributions/normal/ with D3 interactive parameter explorer
- [ ] **DIST-02**: Uniform distribution page at /eda/distributions/uniform/ with D3 interactive parameter explorer
- [ ] **DIST-03**: Exponential distribution page at /eda/distributions/exponential/ with D3 interactive parameter explorer
- [ ] **DIST-04**: Weibull distribution page at /eda/distributions/weibull/ with D3 interactive parameter explorer
- [ ] **DIST-05**: Lognormal distribution page at /eda/distributions/lognormal/ with D3 interactive parameter explorer
- [ ] **DIST-06**: Gamma distribution page at /eda/distributions/gamma/ with D3 interactive parameter explorer
- [ ] **DIST-07**: Chi-square distribution page at /eda/distributions/chi-square/ with D3 interactive parameter explorer
- [ ] **DIST-08**: Student's t-distribution page at /eda/distributions/t-distribution/ with D3 interactive parameter explorer
- [ ] **DIST-09**: F-distribution page at /eda/distributions/f-distribution/ with D3 interactive parameter explorer
- [ ] **DIST-10**: Tukey-Lambda distribution page at /eda/distributions/tukey-lambda/ with D3 interactive parameter explorer
- [ ] **DIST-11**: Extreme Value Type I (Gumbel) page at /eda/distributions/extreme-value/ with D3 interactive parameter explorer
- [ ] **DIST-12**: Beta distribution page at /eda/distributions/beta/ with D3 interactive parameter explorer
- [ ] **DIST-13**: Binomial distribution page at /eda/distributions/binomial/ with D3 interactive parameter explorer
- [ ] **DIST-14**: Poisson distribution page at /eda/distributions/poisson/ with D3 interactive parameter explorer
- [ ] **DIST-15**: Cauchy distribution page at /eda/distributions/cauchy/ with D3 interactive parameter explorer
- [ ] **DIST-16**: Lognormal distribution page at /eda/distributions/lognormal/ with D3 interactive parameter explorer
- [ ] **DIST-17**: DistributionExplorer.tsx React island with parameter sliders, dual PDF+CDF display, touch-friendly controls
- [ ] **DIST-18**: Static build-time SVG fallback for each distribution (no-JS users)
- [ ] **DIST-19**: Distribution landing page at /eda/distributions/ with browsable grid and shape previews

### Case Studies

- [ ] **CASE-01**: Normal random numbers case study at /eda/case-studies/normal-random-numbers/ (section 1.4.2.1)
- [ ] **CASE-02**: Uniform random numbers case study at /eda/case-studies/uniform-random-numbers/ (section 1.4.2.2)
- [ ] **CASE-03**: Random walk case study at /eda/case-studies/random-walk/ (section 1.4.2.3)
- [ ] **CASE-04**: Cryothermometry case study at /eda/case-studies/cryothermometry/ (section 1.4.2.4)
- [ ] **CASE-05**: Beam deflections case study at /eda/case-studies/beam-deflections/ (section 1.4.2.5)
- [ ] **CASE-06**: Filter transmittance case study at /eda/case-studies/filter-transmittance/ (section 1.4.2.6)
- [ ] **CASE-07**: Heat flow meter case study at /eda/case-studies/heat-flow-meter/ (section 1.4.2.8)
- [ ] **CASE-08**: Fatigue life case study at /eda/case-studies/fatigue-life/ (section 1.4.2.9)
- [ ] **CASE-09**: Ceramic strength case study at /eda/case-studies/ceramic-strength/ (section 1.4.2.10)

### Reference Pages

- [ ] **REF-01**: Analysis questions page at /eda/reference/analysis-questions/ (section 1.3.2)
- [ ] **REF-02**: Techniques by category page at /eda/reference/techniques-by-category/ (section 1.3.4)
- [ ] **REF-03**: Distribution tables page at /eda/reference/distribution-tables/ (section 1.3.6.7)
- [ ] **REF-04**: Related distributions page at /eda/reference/related-distributions/ (section 1.3.6.2-5)

### Landing Page

- [ ] **LAND-01**: Visual Encyclopedia landing page at /eda/ with technique card grid
- [ ] **LAND-02**: Category filter pills (All, Graphical, Quantitative, Distributions, Case Studies, Reference)
- [ ] **LAND-03**: Section navigation (Foundations, Techniques, Quantitative Methods, Distributions, Case Studies, Reference)
- [ ] **LAND-04**: Responsive card grid (3 columns desktop, 2 tablet, 1 mobile)
- [x] **LAND-05**: Build-time SVG thumbnails on technique cards
- [ ] **LAND-06**: Section reference (section X.X.X) displayed on each card
- [ ] **LAND-07**: CategoryFilter.tsx React island for landing page filtering (mirrors LanguageFilter.tsx pattern)

### Site Integration

- [ ] **SITE-01**: "EDA" link added to Header.astro navigation between "DB Compass" and "Tools"
- [ ] **SITE-02**: Homepage callout card linking to /eda/
- [ ] **SITE-03**: JSON-LD structured data (TechArticle/LearningResource) on all EDA pages
- [ ] **SITE-04**: Unique SEO meta description for every EDA page
- [ ] **SITE-05**: All EDA pages included in sitemap
- [ ] **SITE-06**: LLMs.txt updated with EDA section
- [ ] **SITE-07**: Build-time OG images for EDA overview and key pages
- [ ] **SITE-08**: Companion blog post covering EDA methodology and tool walkthrough
- [ ] **SITE-09**: Bidirectional cross-links between blog post and EDA pages
- [ ] **SITE-10**: Lighthouse 90+ verified on representative pages from each tier (A, B, C)
- [ ] **SITE-11**: WCAG 2.1 AA accessibility (role="img" + aria-label on SVGs, keyboard nav, screen reader)
- [ ] **SITE-12**: Every EDA page cites its NIST source section
- [ ] **SITE-13**: Python code blocks with copy button using existing astro-expressive-code

### Content Quality

- [ ] **QUAL-01**: Every formula verified character-by-character against NIST source
- [ ] **QUAL-02**: Every page contains 200+ words of unique explanatory prose
- [ ] **QUAL-03**: All Python code examples are runnable (matplotlib/seaborn/scipy/plotly)
- [ ] **QUAL-04**: Cross-links between related techniques functional on all pages

## Future Requirements

Deferred to v1.9+ milestone. Tracked but not in current roadmap.

### Interactive Tools

- **TOOL-01**: 4-Plot interactive diagnostic tool with CSV paste input and URL state
- **TOOL-02**: Distribution relationship diagram (all 19 distributions + mathematical edges)

### Advanced Features

- **ADV-01**: Expandable formula tooltips (hover on Greek symbols for plain-English definition)
- **ADV-02**: Technique comparison matrix (filterable techniques x problem categories)

## Out of Scope

| Feature | Reason |
|---------|--------|
| In-browser Python/R execution (Pyodide) | 14MB+ WASM destroys performance; code examples are illustrative |
| User data upload for all techniques | Scope explosion; 4-Plot tool covers the valuable use case (deferred to v1.9) |
| Multi-language i18n | 90 pages x N languages; defer indefinitely |
| Animated plot transitions on all SVGs | Enormous scope; D3 animation budget reserved for distributions only |
| Full D3 bundle import | 280KB vs 17KB micro-bundle; explicit anti-pattern |
| Warm palette / new fonts (Bricolage Grotesque, DM Sans) | Keep Quantum Explorer visual language consistent |
| Real-time collaborative features | Static site, no server |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| INFRA-01 | Phase 48 | Complete |
| INFRA-02 | Phase 48 | Complete |
| INFRA-03 | Phase 48 | Complete |
| INFRA-04 | Phase 48 | Complete |
| INFRA-05 | Phase 48 | Complete |
| INFRA-06 | Phase 48 | Complete |
| INFRA-07 | Phase 48 | Complete |
| INFRA-08 | Phase 48 | Complete |
| INFRA-09 | Phase 48 | Complete |
| INFRA-10 | Phase 48 | Complete |
| INFRA-11 | Phase 48 | Complete |
| DATA-01 | Phase 49 | Complete |
| DATA-02 | Phase 49 | Complete |
| DATA-03 | Phase 49 | Complete |
| DATA-04 | Phase 49 | Complete |
| DATA-05 | Phase 49 | Complete |
| DATA-06 | Phase 49 | Complete |
| DATA-07 | Phase 49 | Complete |
| DATA-08 | Phase 49 | Complete |
| DATA-09 | Phase 49 | Complete |
| SVG-01 | Phase 50 | Complete |
| SVG-02 | Phase 50 | Complete |
| SVG-03 | Phase 50 | Complete |
| SVG-04 | Phase 50 | Complete |
| SVG-05 | Phase 50 | Complete |
| SVG-06 | Phase 50 | Complete |
| SVG-07 | Phase 50 | Complete |
| SVG-08 | Phase 50 | Complete |
| SVG-09 | Phase 50 | Complete |
| SVG-10 | Phase 50 | Complete |
| SVG-11 | Phase 50 | Complete |
| SVG-12 | Phase 50 | Complete |
| SVG-13 | Phase 50 | Complete |
| SVG-14 | Phase 50 | Complete |
| SVG-15 | Phase 50 | Complete |
| GRAPH-01 | Phase 51 | Complete |
| GRAPH-02 | Phase 51 | Complete |
| GRAPH-03 | Phase 51 | Complete |
| GRAPH-04 | Phase 51 | Complete |
| GRAPH-05 | Phase 51 | Complete |
| GRAPH-06 | Phase 51 | Complete |
| GRAPH-07 | Phase 51 | Complete |
| GRAPH-08 | Phase 51 | Complete |
| GRAPH-09 | Phase 51 | Complete |
| GRAPH-10 | Phase 51 | Complete |
| GRAPH-11 | Phase 51 | Complete |
| GRAPH-12 | Phase 51 | Complete |
| GRAPH-13 | Phase 51 | Complete |
| GRAPH-14 | Phase 51 | Complete |
| GRAPH-15 | Phase 51 | Complete |
| GRAPH-16 | Phase 51 | Complete |
| GRAPH-17 | Phase 51 | Complete |
| GRAPH-18 | Phase 51 | Complete |
| GRAPH-19 | Phase 51 | Complete |
| GRAPH-20 | Phase 51 | Complete |
| GRAPH-21 | Phase 51 | Complete |
| GRAPH-22 | Phase 51 | Complete |
| GRAPH-23 | Phase 51 | Complete |
| GRAPH-24 | Phase 51 | Complete |
| GRAPH-25 | Phase 51 | Complete |
| GRAPH-26 | Phase 51 | Complete |
| GRAPH-27 | Phase 51 | Complete |
| GRAPH-28 | Phase 51 | Complete |
| GRAPH-29 | Phase 51 | Complete |
| GRAPH-30 | Phase 51 | Complete |
| LAND-05 | Phase 51 | Complete |
| QUANT-01 | Phase 52 | Pending |
| QUANT-02 | Phase 52 | Pending |
| QUANT-03 | Phase 52 | Pending |
| QUANT-04 | Phase 52 | Pending |
| QUANT-05 | Phase 52 | Pending |
| QUANT-06 | Phase 52 | Pending |
| QUANT-07 | Phase 52 | Pending |
| QUANT-08 | Phase 52 | Pending |
| QUANT-09 | Phase 52 | Pending |
| QUANT-10 | Phase 52 | Pending |
| QUANT-11 | Phase 52 | Pending |
| QUANT-12 | Phase 52 | Pending |
| QUANT-13 | Phase 52 | Pending |
| QUANT-14 | Phase 52 | Pending |
| QUANT-15 | Phase 52 | Pending |
| QUANT-16 | Phase 52 | Pending |
| QUANT-17 | Phase 52 | Pending |
| QUANT-18 | Phase 52 | Pending |
| FOUND-01 | Phase 52 | Pending |
| FOUND-02 | Phase 52 | Pending |
| FOUND-03 | Phase 52 | Pending |
| FOUND-04 | Phase 52 | Pending |
| FOUND-05 | Phase 52 | Pending |
| FOUND-06 | Phase 52 | Pending |
| SITE-13 | Phase 52 | Pending |
| DIST-01 | Phase 53 | Pending |
| DIST-02 | Phase 53 | Pending |
| DIST-03 | Phase 53 | Pending |
| DIST-04 | Phase 53 | Pending |
| DIST-05 | Phase 53 | Pending |
| DIST-06 | Phase 53 | Pending |
| DIST-07 | Phase 53 | Pending |
| DIST-08 | Phase 53 | Pending |
| DIST-09 | Phase 53 | Pending |
| DIST-10 | Phase 53 | Pending |
| DIST-11 | Phase 53 | Pending |
| DIST-12 | Phase 53 | Pending |
| DIST-13 | Phase 53 | Pending |
| DIST-14 | Phase 53 | Pending |
| DIST-15 | Phase 53 | Pending |
| DIST-16 | Phase 53 | Pending |
| DIST-17 | Phase 53 | Pending |
| DIST-18 | Phase 53 | Pending |
| DIST-19 | Phase 53 | Pending |
| CASE-01 | Phase 54 | Pending |
| CASE-02 | Phase 54 | Pending |
| CASE-03 | Phase 54 | Pending |
| CASE-04 | Phase 54 | Pending |
| CASE-05 | Phase 54 | Pending |
| CASE-06 | Phase 54 | Pending |
| CASE-07 | Phase 54 | Pending |
| CASE-08 | Phase 54 | Pending |
| CASE-09 | Phase 54 | Pending |
| REF-01 | Phase 54 | Pending |
| REF-02 | Phase 54 | Pending |
| REF-03 | Phase 54 | Pending |
| REF-04 | Phase 54 | Pending |
| LAND-01 | Phase 54 | Pending |
| LAND-02 | Phase 54 | Pending |
| LAND-03 | Phase 54 | Pending |
| LAND-04 | Phase 54 | Pending |
| LAND-06 | Phase 54 | Pending |
| LAND-07 | Phase 54 | Pending |
| SITE-01 | Phase 55 | Pending |
| SITE-02 | Phase 55 | Pending |
| SITE-03 | Phase 55 | Pending |
| SITE-04 | Phase 55 | Pending |
| SITE-05 | Phase 55 | Pending |
| SITE-06 | Phase 55 | Pending |
| SITE-07 | Phase 55 | Pending |
| SITE-08 | Phase 55 | Pending |
| SITE-09 | Phase 55 | Pending |
| SITE-10 | Phase 55 | Pending |
| SITE-11 | Phase 55 | Pending |
| SITE-12 | Phase 55 | Pending |
| QUAL-01 | Phase 55 | Pending |
| QUAL-02 | Phase 55 | Pending |
| QUAL-03 | Phase 55 | Pending |
| QUAL-04 | Phase 55 | Pending |

**Coverage:**
- v1.8 requirements: 145 total (12 categories)
- Mapped to phases: 145
- Unmapped: 0

**Note:** DIST-16 duplicates DIST-05 (both Lognormal distribution) in the original requirement list. Both are mapped to Phase 53 and will be delivered as a single page.

---
*Requirements defined: 2026-02-24*
*Last updated: 2026-02-24 after plan revision (DATA-01 corrected from 30 to 29 graphical entries)*
