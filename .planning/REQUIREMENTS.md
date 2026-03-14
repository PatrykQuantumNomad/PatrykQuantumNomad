# Requirements: patrykgolabek.dev

**Defined:** 2026-03-14
**Core Value:** The site must be fast, fully SEO-optimized, and visually distinctive — a portfolio that ranks well in search engines and makes a memorable impression on recruiters, collaborators, and the developer community.

## v1.17 Requirements

Requirements for milestone v1.17 EDA Jupyter Notebooks. Each maps to roadmap phases.

### Notebook Generation

- [x] **NBGEN-01**: Build-time TypeScript notebook builder generates valid nbformat v4.5 JSON with deterministic cell IDs
- [x] **NBGEN-02**: Cell factory creates markdown, code, and output cells following nbformat schema
- [ ] **NBGEN-03**: Notebook registry maps all 10 case studies to their dataset files and analysis parameters
- [ ] **NBGEN-04**: Each notebook bundles a requirements.txt specifying numpy, scipy, pandas, matplotlib, seaborn

### Standard Notebooks

- [ ] **NBSTD-01**: Normal Random Numbers notebook with full 4-plot analysis, hypothesis tests, and interpretation
- [ ] **NBSTD-02**: Uniform Random Numbers notebook with distribution detection and non-normality analysis
- [ ] **NBSTD-03**: Heat Flow Meter notebook with mild non-randomness analysis
- [ ] **NBSTD-04**: Filter Transmittance notebook with extreme autocorrelation detection
- [ ] **NBSTD-05**: Cryothermometry notebook with discrete data analysis
- [ ] **NBSTD-06**: Fatigue Life notebook with distribution comparison and model selection
- [ ] **NBSTD-07**: Standard Resistor notebook with multi-assumption failure analysis

### Advanced Notebooks

- [ ] **NBADV-01**: Beam Deflections notebook with sinusoidal model fitting and residual validation
- [ ] **NBADV-02**: Random Walk notebook with AR(1) model development and residual analysis
- [ ] **NBADV-03**: Ceramic Strength notebook with DOE analysis (batch effects, factor rankings, interaction plots)

### Packaging

- [ ] **PACK-01**: Each notebook zipped with its NIST .DAT dataset file(s) as self-contained download
- [ ] **PACK-02**: Zip files generated at build time via Astro integration hook or prebuild script
- [ ] **PACK-03**: Generated zip files served as static assets from GitHub Pages

### User Interface

- [ ] **UI-01**: Download button on each case study page linking to the .zip file
- [ ] **UI-02**: "Open in Colab" badge/link on each case study page for zero-install execution
- [ ] **UI-03**: Notebook .ipynb files committed to repo to enable Colab GitHub URL format

### Site Integration

- [ ] **SITE-01**: Notebooks landing page at /eda/notebooks/ listing all 10 notebooks with descriptions and download links
- [ ] **SITE-02**: Companion blog post about EDA learning with Jupyter notebooks
- [ ] **SITE-03**: LLMs.txt updated with notebooks section
- [ ] **SITE-04**: Sitemap includes notebooks landing page
- [ ] **SITE-05**: OG image for notebooks landing page

## Future Requirements

### Notebook Enhancements

- **NBFUT-01**: Interactive widgets (ipywidgets) for parameter exploration
- **NBFUT-02**: JupyterLite in-browser execution on the site
- **NBFUT-03**: Collection download (single zip with all 10 notebooks)

## Out of Scope

| Feature | Reason |
|---------|--------|
| In-browser notebook execution (JupyterLite/Pyodide) | 14MB+ WASM payload; defer to future |
| Pre-executed notebook outputs | Inflates file size, stale outputs mislead users |
| Real-time as-you-type notebook editing on site | Not a notebook editor — download and run locally |
| statsmodels dependency | Implement runs test manually to keep deps minimal |
| Auto-grading or exercises | Educational content, not courseware |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| NBGEN-01 | Phase 96 | Complete |
| NBGEN-02 | Phase 96 | Complete |
| NBGEN-03 | Phase 96 | Pending |
| NBGEN-04 | Phase 96 | Pending |
| NBSTD-01 | Phase 97 | Pending |
| NBSTD-02 | Phase 97 | Pending |
| NBSTD-03 | Phase 97 | Pending |
| NBSTD-04 | Phase 97 | Pending |
| NBSTD-05 | Phase 97 | Pending |
| NBSTD-06 | Phase 97 | Pending |
| NBSTD-07 | Phase 97 | Pending |
| NBADV-01 | Phase 100 | Pending |
| NBADV-02 | Phase 100 | Pending |
| NBADV-03 | Phase 100 | Pending |
| PACK-01 | Phase 98 | Pending |
| PACK-02 | Phase 98 | Pending |
| PACK-03 | Phase 98 | Pending |
| UI-01 | Phase 99 | Pending |
| UI-02 | Phase 99 | Pending |
| UI-03 | Phase 99 | Pending |
| SITE-01 | Phase 101 | Pending |
| SITE-02 | Phase 101 | Pending |
| SITE-03 | Phase 101 | Pending |
| SITE-04 | Phase 101 | Pending |
| SITE-05 | Phase 101 | Pending |

**Coverage:**
- v1.17 requirements: 25 total
- Mapped to phases: 25
- Unmapped: 0

---
*Requirements defined: 2026-03-14*
*Last updated: 2026-03-14 after roadmap creation (phases 96-101)*
