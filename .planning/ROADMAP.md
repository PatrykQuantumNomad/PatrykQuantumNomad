# Roadmap: patrykgolabek.dev

## Milestones

- v1.0 through v1.16: Shipped (see MILESTONES.md)
- **v1.17 EDA Jupyter Notebooks** - Phases 96-101 (in progress)

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

- [x] **Phase 96: Notebook Foundation** - TypeScript nbformat v4.5 types, cell factories, case study registry, and requirements.txt template (completed 2026-03-14)
- [x] **Phase 97: Standard Case Study Notebooks** - 7 standard-template notebooks with parameterized 4-plot analysis, hypothesis tests, and interpretation (completed 2026-03-14)
- [ ] **Phase 98: Packaging Pipeline** - ZIP packaging with archiver, Astro build integration hook, and static file serving
- [ ] **Phase 99: Download UI and Colab Integration** - Download buttons on case study pages, Open in Colab badges, and committed .ipynb files for Colab GitHub URLs
- [ ] **Phase 100: Advanced Case Study Notebooks** - 3 complex notebooks: sinusoidal model fitting, AR(1) development, and DOE multi-factor analysis
- [ ] **Phase 101: Site Integration** - Notebooks landing page, companion blog post, LLMs.txt update, sitemap inclusion, and OG image

## Phase Details

### Phase 96: Notebook Foundation
**Goal**: Establish the TypeScript contracts and factories that all notebook generation builds on
**Depends on**: Nothing (first phase of v1.17)
**Requirements**: NBGEN-01, NBGEN-02, NBGEN-03, NBGEN-04
**Success Criteria** (what must be TRUE):
  1. TypeScript compiles with complete nbformat v4.5 interfaces (NotebookV4, MarkdownCell, CodeCell with required `id`, `execution_count: null`, `outputs: []`)
  2. `markdownCell()` and `codeCell()` factories produce cells with deterministic IDs and newline-terminated source lines
  3. Notebook registry maps all 10 case study slugs to their NIST .DAT filenames and analysis parameters
  4. A shared requirements.txt template specifies numpy, scipy, pandas, matplotlib, seaborn with floor version pins
**Plans:** 2/2 plans complete
Plans:
- [x] 96-01-PLAN.md — nbformat v4.5 types, cell factories, and notebook assembler with tests
- [x] 96-02-PLAN.md — Case study registry (10 configs), requirements.txt template, and dark theme module with tests

### Phase 97: Standard Case Study Notebooks
**Goal**: Deliver 7 standard-template notebooks that validate the full generation pipeline
**Depends on**: Phase 96
**Requirements**: NBSTD-01, NBSTD-02, NBSTD-03, NBSTD-04, NBSTD-05, NBSTD-06, NBSTD-07
**Success Criteria** (what must be TRUE):
  1. `buildStandardNotebook(slug)` produces valid nbformat v4.5 JSON for each of the 7 standard case studies
  2. Each notebook contains interleaved markdown narrative and code cells: title, requirements check, imports, data loading with per-dataset parsing parameters, summary statistics, 4-plot, individual plots, hypothesis tests, test summary table, interpretation, and conclusions
  3. Each notebook opens without errors in JupyterLab, VS Code, and Google Colab
  4. Data loading cells include row-count assertions matching NIST dataset sizes
  5. All 7 notebooks use a single parameterized standard template with case-study-specific configuration (dataset name, skiprows, column names, expected statistics)
**Plans:** 2/2 plans complete
Plans:
- [x] 97-01-PLAN.md — Template skeleton with setup, data loading, and visualization sections (TDD)
- [x] 97-02-PLAN.md — Hypothesis tests, test summary, interpretation, and conclusions (TDD)

### Phase 98: Packaging Pipeline
**Goal**: Notebooks are packaged as downloadable ZIP files and served from the built site
**Depends on**: Phase 97
**Requirements**: PACK-01, PACK-02, PACK-03
**Success Criteria** (what must be TRUE):
  1. Each case study produces a self-contained ZIP containing the .ipynb notebook, the NIST .DAT dataset file (LF-normalized), and a requirements.txt
  2. ZIP files are generated at build time via an Astro `astro:build:done` integration hook using archiver (not JSZip)
  3. `astro build` produces ZIP files at `dist/downloads/notebooks/{slug}.zip` that are served as static assets with correct MIME type
  4. Build time regression from notebook generation is under 5 seconds
**Plans:** 2 plans
Plans:
- [ ] 98-01-PLAN.md — Core ZIP packaging functions with archiver: createZipFile and buildNotebookZipEntries (TDD)
- [ ] 98-02-PLAN.md — Astro notebookPackager integration hook and config registration

### Phase 99: Download UI and Colab Integration
**Goal**: Users can download notebooks and open them in Colab directly from case study pages
**Depends on**: Phase 98
**Requirements**: UI-01, UI-02, UI-03
**Success Criteria** (what must be TRUE):
  1. Every case study page shows a download button that triggers a file save dialog for the corresponding ZIP file
  2. Every case study page shows an "Open in Colab" badge that opens the notebook in Google Colab via the GitHub URL scheme
  3. All 10 .ipynb files are committed to the repo at `notebooks/eda/` to support the Colab `colab.research.google.com/github/...` URL pattern
**Plans**: TBD

### Phase 100: Advanced Case Study Notebooks
**Goal**: The 3 complex case studies have specialized notebooks with model development and DOE analysis
**Depends on**: Phase 96, Phase 98
**Requirements**: NBADV-01, NBADV-02, NBADV-03
**Success Criteria** (what must be TRUE):
  1. Beam Deflections notebook includes sinusoidal model fitting via `scipy.optimize.curve_fit` with residual validation plots
  2. Random Walk notebook includes AR(1) coefficient estimation, model development, and residual analysis
  3. Ceramic Strength notebook includes multi-column data loading (480 rows), batch effect analysis, factor rankings, interaction plots, and one-way ANOVA
  4. All 3 notebooks run end-to-end in a clean Python environment and statistical values match NIST-verified website values from v1.9
**Plans**: TBD

### Phase 101: Site Integration
**Goal**: Notebooks are discoverable from the EDA section and promoted across the site
**Depends on**: Phase 100
**Requirements**: SITE-01, SITE-02, SITE-03, SITE-04, SITE-05
**Success Criteria** (what must be TRUE):
  1. A notebooks landing page at `/eda/notebooks/` lists all 10 notebooks with descriptions, download links, and Colab badges
  2. The EDA index page links to the notebooks section
  3. A companion blog post about EDA learning with Jupyter notebooks is published
  4. LLMs.txt includes a notebooks section and the notebooks landing page appears in the sitemap
  5. An OG image is generated for the notebooks landing page via Satori + Sharp
**Plans**: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 96 -> 97 -> 98 -> 99 -> 100 -> 101

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 96. Notebook Foundation | 2/2 | Complete   | 2026-03-14 |
| 97. Standard Case Study Notebooks | 2/2 | Complete   | 2026-03-14 |
| 98. Packaging Pipeline | 0/2 | Not started | - |
| 99. Download UI and Colab Integration | 0/TBD | Not started | - |
| 100. Advanced Case Study Notebooks | 0/TBD | Not started | - |
| 101. Site Integration | 0/TBD | Not started | - |
