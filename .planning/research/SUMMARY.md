# Research Summary: v1.17 EDA Jupyter Notebooks

**Project:** patrykgolabek.dev — v1.17 Downloadable Jupyter Notebooks for EDA Case Studies
**Domain:** Build-time notebook generation for Astro 5 static site (GitHub Pages)
**Researched:** 2026-03-14
**Confidence:** HIGH

## Executive Summary

This milestone adds downloadable Jupyter notebooks for all 10 NIST EDA case studies to patrykgolabek.dev. The research is unambiguously clear on approach: generate `.ipynb` files at build time in TypeScript (the format is plain JSON — no Python tooling needed), bundle each notebook with its `.DAT` dataset file into a `.zip` archive using `archiver`, and serve them as static files from the Astro build output. This fits cleanly inside the existing build pipeline on GitHub Pages without new CI infrastructure, no Python runtime in CI, and only two new npm dependencies (`archiver` + its types).

The core implementation work is writing Python analysis code inside cell templates, not infrastructure. The TypeScript notebook builder and zip packager together are under 300 lines. The bulk of the effort is the 10 per-case-study cell template modules — 7 share a standard parameterized template, 2 are model-development variations (beam deflections with sinusoidal regression, random walk with AR(1)), and 1 is the complex DOE variant (ceramic strength). Building the standard template first delivers 70% of the milestone's content and validates the full pipeline before tackling the harder notebooks.

The primary risk is correctness, not complexity. Notebooks that open but fail to run — due to invalid nbformat JSON, broken `.DAT` file parsing, missing Python dependencies, or statistical values that disagree with the NIST-verified website — will undermine user trust. Every notebook must pass a build-time format check and a manual end-to-end run in a clean Python environment before the milestone is considered done.

## Key Findings

### Recommended Stack

Only two new npm dependencies are needed. The `.ipynb` format is nbformat v4.5 JSON — constructable directly from a TypeScript type definition without any npm notebook library.

**New npm dependencies:**
- `archiver ^7.0.1` — stream-based ZIP creation (14.6M weekly downloads, mature, ESM-compatible). Preferred over JSZip for build-time server-side generation because of its streaming API and correct handling of binary files alongside UTF-8 strings. JSZip has documented encoding issues with mixed binary/text content (issue #368).
- `@types/archiver ^7.0.0` — TypeScript types for the above.

**Python stack declared inside notebooks (not in package.json):**

| Library | Pin | Purpose |
|---------|-----|---------|
| numpy | >=1.26,<3 | Numerical arrays, statistics |
| scipy | >=1.11 | Statistical tests, distributions |
| pandas | >=2.0,<4 | DataFrame operations, DAT loading |
| matplotlib | >=3.7 | Plotting |
| seaborn | >=0.12 | Plot styling |

Pin philosophy: floor versions (`>=`) not exact pins. Notebooks are educational — exact pins block installation for users with recent Python. Floor versions ensure API compatibility.

**What NOT to add:** nbformat Python library, nbconvert, any JS notebook execution library, Python runtime in CI, ADM-Zip, yauzl, or any pre-built `.ipynb`/`.zip` files committed to the repo.

See: `.planning/research/STACK-jupyter-notebooks.md`

### Features: Table Stakes vs Differentiators

**Must-have (table stakes — missing = product feels broken):**
- Valid nbformat v4.5 JSON with correct `kernelspec` — opens in Jupyter, VS Code, and Colab without errors
- Inline data embedding as Python list literals — no external file dependencies for running cells (the standard for educational notebooks)
- Import cell with `%matplotlib inline` and `sns.set_theme()` — standard setup preamble
- Markdown narrative interleaved with every code cell — what distinguishes a notebook from a script
- Summary statistics, 4-plot reproduction, hypothesis test cells with interpretation — the analytical core that mirrors each web page
- All 10 case studies covered — partial coverage looks like a bug
- Download button on every case study page alongside the existing CSV button

**Should-have (differentiators — not expected, but valued):**
- "Open in Google Colab" button on case study pages and as a badge in each notebook's title cell — zero-setup execution
- NIST source attribution + site backlinks in every notebook — each notebook becomes an SEO outpost when shared
- Seaborn-styled plots (`sns.set_theme()`) — one line, dramatic improvement over raw matplotlib defaults
- Requirements header cell with commented `!pip install` and a dependency-check code cell — reduces first-run failures
- Notebooks landing page at `/eda/notebooks/` — new EDA section following existing section patterns
- Collection ZIP (all 10 + shared requirements.txt + README) from the landing page
- Case-study-specific advanced analysis for the 3 complex notebooks (sinusoidal curve fit, AR(1), DOE ANOVA)

**Anti-features (explicitly do not build):**
- In-browser notebook execution (JupyterLite/Pyodide) — massive complexity for worse UX than existing SVG plots
- Pre-executed notebooks with saved cell outputs — bloats files 5-50x, creates stale outputs, violates educational standard
- Separate `.DAT` files bundled independently from data embedded in cells (causes path resolution failures)
- Binder integration — Colab is faster, more reliable, and more widely used
- Notebook preview component on case study pages — the case study page itself is the preview

See: `.planning/research/FEATURES-jupyter-notebooks.md`

### Architecture Approach

**Recommended pattern: Astro integration hook (`astro:build:done`) + archiver + static file serving**

The research produced two competing architecture proposals:

- **ARCHITECTURE.md** (from one researcher) recommends Astro API route endpoints (`[slug].zip.ts` / `[slug].ipynb.ts` with `getStaticPaths()`) using JSZip for in-memory zip creation, following the OG image endpoint pattern.
- **ARCHITECTURE-jupyter-notebooks.md** and **STACK.md** (from a second researcher) recommend an Astro integration hook (`astro:build:done`) with archiver for streaming zip creation, writing to `dist/downloads/notebooks/`. This follows the existing `indexnow.ts` integration pattern.

**Go with the Astro integration hook + archiver approach.** The PITFALLS research provides the deciding factor: JSZip has documented encoding problems when mixing binary (`.DAT` files) and UTF-8 (notebook JSON) content in the same archive. archiver's streaming API handles this correctly. The integration hook also receives the `dir` parameter directly — no need to hardcode `dist/`. The existing `indexnow.ts` is a direct template in this codebase.

The API route approach is not wrong, but archiver is the better zip tool for this use case.

**Component structure (new files):**

| Component | Responsibility |
|-----------|---------------|
| `src/lib/notebook/types.ts` | TypeScript interfaces for nbformat v4.5 |
| `src/lib/notebook/config.ts` | `NOTEBOOK_REGISTRY` array (slug to dataset metadata) |
| `src/lib/notebook/cells.ts` | `markdownCell()` / `codeCell()` factories with deterministic IDs |
| `src/lib/notebook/builder.ts` | Constructs `NotebookV4` JSON from slug + template |
| `src/lib/notebook/templates/` | Per-case-study cell definitions (10 template modules) |
| `src/lib/notebook/packager.ts` | Creates `.zip` using archiver (notebook + `.DAT` + requirements.txt) |
| `src/integrations/notebook-generator.ts` | Astro `astro:build:done` hook, orchestration loop |
| `src/pages/eda/notebooks/index.astro` | Landing page at `/eda/notebooks/` |
| `src/components/eda/NotebookDownload.astro` | Download buttons for case study pages |

**Modified existing files (minimal changes):**
- `src/lib/eda/routes.ts` — add `notebooks` route constant + `notebookZipUrl()` helper
- `src/pages/eda/index.astro` — add Notebooks to `SECTIONS` and `NAV_ITEMS` arrays
- `src/pages/eda/case-studies/[...slug].astro` — import and render `NotebookDownload` (2 lines)
- `astro.config.mjs` — register `notebookGenerator()` in integrations array

**Unchanged:** `datasets.ts`, `handbook/datasets/*.DAT`, `.github/workflows/deploy.yml`, `astro.config.mjs` sitemap config, `src/content.config.ts`

**Download URL pattern:** `/downloads/notebooks/{slug}.zip` and `/downloads/notebooks/{slug}.ipynb`

**ZIP structure per archive:**
```
{slug}/
  {slug}.ipynb          (notebook JSON, clean — no executed outputs)
  {DATASET_NAME}.DAT    (line endings normalized to LF)
  requirements.txt      (Python version floors)
```

**Google Colab strategy:** Commit 10 raw `.ipynb` files to `notebooks/eda/` in the repo. Colab links require GitHub repository paths (`colab.research.google.com/github/PatrykQuantumNomad/...`), not GitHub Pages static URLs. Total size: ~150-250KB, negligible.

See: `.planning/research/ARCHITECTURE.md`, `.planning/research/ARCHITECTURE-jupyter-notebooks.md`

### Critical Pitfalls

Five pitfalls have the highest probability of causing user-facing failures:

1. **Invalid nbformat v4.5 JSON** — Missing `id` fields on cells (required in v4.5 per JEP 62), wrong `execution_count` type (must be `null`, not `undefined` or omitted), or `source` array format errors cause cells to not render or notebook validators to reject the file. JupyterLab may silently show blank cells. Google Colab masks some issues during testing. Prevention: define strict TypeScript interfaces, always set `execution_count: null` and `outputs: []` on code cells, use deterministic cell IDs (slug prefix + zero-padded counter), run `nbformat.validate()` in a build-time check.

2. **`.DAT` file parsing fails on first run** — NIST `.DAT` files are not standard CSV. They use fixed-width format, have varying header line counts to skip, inconsistent delimiters, mixed CRLF/LF line endings, and different column structures. A generic `pd.read_csv()` call fails on most of them. Prevention: per-dataset loading code with explicit `skiprows`, `names`, and `sep` parameters; normalize `.DAT` files to LF line endings when copying into ZIP; add a row-count assertion after loading (`assert len(df) == 200`).

3. **ZIP encoding corruption** — JSZip has known issues encoding binary files alongside UTF-8 strings. archiver handles this correctly but requires explicit types: `archive.append(buffer, ...)` for binary `.DAT` files and `archive.append(jsonString, ...)` for notebook JSON. Additionally, always await `output.on('close')` not `archive.finalize()` to avoid stream truncation races.

4. **Users cannot run notebooks due to missing dependencies** — The most common failure mode for distributed notebooks. Users in different virtual environments get `ModuleNotFoundError` immediately. Google Colab testing masks this because packages are pre-installed there. Prevention: dependency-check cell as the first code cell (prints install command for missing packages); include `requirements.txt` in every ZIP; prominently feature "Open in Colab" as the zero-install path.

5. **Notebook values disagree with website** — The website's TypeScript analysis is NIST-verified (completed in v1.9). Python's SciPy may compute slightly different p-values or apply different default parameters than the TypeScript implementations. Users who notice discrepancies lose trust in both the website and the notebook. Prevention: cross-reference all statistical values against verified NIST values from `src/data/eda/datasets.ts` and case study pages; document any systematic differences in interpretation cells.

**Additional pitfall requiring a decision:** Google Colab users cannot access the bundled `.DAT` file automatically. Either add a Colab-specific upload cell (simple) or fetch the `.DAT` from a GitHub raw URL conditionally (more friction). This must be decided before templates are written.

See: `.planning/research/PITFALLS.md`, `.planning/research/PITFALLS-jupyter-notebooks.md`

## Implications for Roadmap

### Suggested Phase Structure

The build order is strictly constrained by dependencies: types and config first (no dependencies), then cell factories and builder (depend on types), then packager (depends on builder), then Astro integration (depends on all library code), then UI components (depend on routes), then landing page and EDA index integration.

---

**Phase 1: Foundation — Types, Config, and Cell Factory**

Rationale: Zero external dependencies. Establishes the TypeScript contracts that all subsequent phases build on. Getting the nbformat schema right here prevents schema bugs from propagating into all 10 templates.

Delivers:
- `src/lib/notebook/types.ts` — nbformat v4.5 TypeScript interfaces (NotebookV4, MarkdownCell, CodeCell)
- `src/lib/notebook/config.ts` — NOTEBOOK_REGISTRY array (10 entries, slug to DAT filename + NIST metadata)
- `src/lib/notebook/cells.ts` — `markdownCell()` / `codeCell()` with deterministic IDs and correct `\n`-terminated source line format

Test gate: TypeScript compiles. `markdownCell('test')` returns correct nbformat shape. Registry entries match DATASET_SOURCES DAT filenames. Cell IDs are unique per notebook.

Avoids: Pitfall 1 (invalid nbformat), source line newline convention bug (PITFALLS-jupyter-notebooks Pitfall 5).

---

**Phase 2: Notebook Builder + Standard Template (7 case studies)**

Rationale: The 7 standard-template case studies share a single parameterized cell sequence. Building and validating this template first delivers 70% of the milestone content and proves the full generation pipeline before tackling the complex notebooks.

Delivers:
- `src/lib/notebook/builder.ts` — `buildNotebook(slug)` function
- `src/lib/notebook/templates/standard.ts` — standard cell sequence (title, requirements, imports, data loading, summary stats, 4-plot, individual plots, hypothesis tests, test summary table, interpretation, conclusions)
- Per-case-study configs for: normal-random-numbers, uniform-random-numbers, cryothermometry, filter-transmittance, heat-flow-meter, fatigue-life, standard-resistor

Test gate: `buildNotebook('normal-random-numbers')` returns valid JSON. Validate against nbformat schema. Open in JupyterLab and VS Code without errors. Data loading cell asserts correct row count.

Avoids: Pitfall 1 (format version), Pitfall 2 (per-dataset loading parameters verified for all 7 files).

Research flag: Standard patterns, no deeper research needed. Cell sequence is fully documented in FEATURES.md. Per-dataset `skiprows` and `names` parameters must be empirically verified in Python — this is implementation work.

---

**Phase 3: ZIP Packager + Astro Integration**

Rationale: Depends on builder output. Establishes the delivery mechanism. Without this, notebooks exist as JSON in memory but never reach the user's browser.

Delivers:
- `npm install archiver @types/archiver`
- `src/lib/notebook/packager.ts` — `createNotebookZip()` using archiver (notebook + DAT + requirements.txt, LF-normalized line endings)
- `src/integrations/notebook-generator.ts` — Astro `astro:build:done` hook with `mkdirSync` guard, generation loop, Astro logger output
- Register `notebookGenerator()` in `astro.config.mjs`
- Update `src/lib/eda/routes.ts` with `notebooks` route and `notebookZipUrl()` helper
- Add generated output paths to `.gitignore`

Test gate: `astro build` succeeds. `dist/downloads/notebooks/normal-random-numbers.zip` exists, extracts correctly on macOS and Linux, contains correct files with LF line endings. Build time regression under 5 seconds.

Avoids: Pitfall 3 (ZIP encoding), stream finalization race (PITFALLS-jupyter-notebooks Pitfall 4), output directory not existing (PITFALLS-jupyter-notebooks Pitfall 6).

---

**Phase 4: Download UI + Case Study Integration**

Rationale: Depends on routes being defined. Wires the generated files to the user interface with minimal changes to existing files.

Delivers:
- `src/components/eda/NotebookDownload.astro` — download buttons (`.zip` primary, `.ipynb` secondary) with "Open in Colab" badge
- Modify `src/pages/eda/case-studies/[...slug].astro` — import and render `NotebookDownload` (2 lines)
- Commit 10 `.ipynb` files to `notebooks/eda/` in the repo for Colab GitHub URL scheme

Test gate: Every case study page shows notebook download section. Colab links open the correct notebooks. Download button triggers file save dialog (not browser navigation). Content-Type header is `application/zip`.

Avoids: MIME type pitfall (static file served with download attribute, not data: URI), Colab URL scheme pitfall.

---

**Phase 5: Advanced Templates — Beam Deflections, Random Walk, Ceramic Strength**

Rationale: These 3 notebooks are in a higher complexity tier and depend on the standard pipeline being proven. Beam deflections needs `scipy.optimize.curve_fit` for sinusoidal regression. Random walk needs AR(1) coefficient estimation. Ceramic strength needs multi-column data loading (480 rows × 8 columns), two-sample t-test, F-test, one-way ANOVA, and DOE factor analysis.

Delivers:
- `src/lib/notebook/templates/beam-deflections.ts` — sinusoidal model development variant
- `src/lib/notebook/templates/random-walk.ts` — AR(1) model development variant
- `src/lib/notebook/templates/ceramic-strength.ts` — DOE variant (~65KB notebook, most complex)

Test gate: All 3 notebooks open and run end-to-end in a clean Python environment. Statistical values match NIST-verified website values from v1.9. Ceramic strength loads correctly from JAHANMI2.DAT (480 rows × 8 columns, multi-column fixed-width format).

Avoids: Pitfall 5 (drift from website), Pitfall 2 (JAHANMI2.DAT is the most complex DAT format).

Research flag: Statistical values for sinusoidal parameters (beam deflections), AR(1) coefficients (random walk), and ANOVA F-statistics (ceramic strength) must be cross-referenced against NIST-verified website values from v1.9 during implementation. This is the highest-risk phase for value drift.

---

**Phase 6: Notebooks Landing Page + EDA Index Integration**

Rationale: The landing page and EDA index update are independent of the notebook content itself. They surface the feature to users who arrive at the EDA section without going to a specific case study.

Delivers:
- `src/pages/eda/notebooks/index.astro` — landing page with card grid (all 10 notebooks, download links, NIST section references)
- Modify `src/pages/eda/index.astro` — add Notebooks to SECTIONS + NAV_ITEMS
- Collection ZIP (all 10 + shared requirements.txt + collection README) from the landing page

Test gate: `/eda/notebooks/` renders with correct breadcrumbs and JSON-LD. EDA index shows Notebooks section. Collection ZIP downloads and contains all 10 notebooks plus README.

---

### Phase Ordering Rationale

- Phases 1 through 3 follow strict dependency order (types → builder → packager → integration). Nothing can be built out of sequence.
- Phase 4 (UI) is intentionally decoupled from Phase 5 (advanced templates). Download buttons for the 7 standard-template notebooks can go live while the 3 complex notebooks are still in development.
- Phase 6 (landing page) is structurally independent and can be done in parallel with Phase 5 once Phase 3 is complete.
- Standard template first (Phase 2) validates the full pipeline before the complexity of advanced templates.

### Research Flags

**Phases needing attention during implementation:**
- **Phase 2:** Per-dataset `.DAT` parsing parameters (`skiprows`, `names`, `sep`) must be manually verified in Python for all 7 standard-template files. Do not assume generic parsing works — each file has a different structure.
- **Phase 5:** Statistical values for beam deflections (sinusoidal model parameters), random walk (AR(1) coefficients), and ceramic strength (ANOVA F-statistics, batch effects) must be cross-referenced against the NIST-verified website values from v1.9. These are the highest-risk notebooks for value drift.
- **Phase 3:** Test ZIP extraction on both macOS and Linux. Verify `Content-Type: application/zip` after first deployment.

**Phases with standard patterns (no deeper research needed):**
- **Phase 1:** Pure TypeScript type definitions matching a stable JSON schema. No ambiguity.
- **Phase 4:** Follows exact patterns from existing `CaseStudyDataset.astro` CSV download buttons.
- **Phase 6:** Follows exact pattern from `src/pages/eda/case-studies/index.astro` card grid.

## Open Questions and Decisions Needed

1. **Colab data file delivery** — Colab users cannot access the bundled `.DAT` file automatically. Options: (a) add a Colab-specific upload cell at the top of each notebook, or (b) fetch the `.DAT` file from a GitHub raw URL conditionally. Option (a) is simpler and avoids network dependencies. Must be decided before Phase 2 templates are written since it affects the title and data-loading cells.

2. **`source` field format in notebook cells** — Both a single multi-line string and a string array (with `\n` appended to all lines except the last) are valid per the nbformat spec. ARCHITECTURE.md recommends single string for simplicity; ARCHITECTURE-jupyter-notebooks.md recommends string array for spec fidelity. Recommendation: use single multi-line string. JupyterLab, VS Code, and Colab all handle both correctly. Simplify the cell factory.

3. **Collection ZIP scope** — FEATURES.md lists this as a Phase 2 differentiator for the `/eda/notebooks/` landing page. Confirm whether this is in scope for v1.17 or deferred. It requires all 10 notebooks to be complete first.

4. **Numerical precision threshold** — Python SciPy may compute slightly different p-values than the TypeScript implementations. Decide the acceptable precision threshold before writing interpretation cells. Recommendation: match to 3-4 significant digits, document any systematic differences in a comment.

5. **`astro:build:done` vs API route endpoints** — Resolved in favor of integration hook + archiver (see Architecture section). Only reopen this decision if the integration hook approach hits unexpected issues during Phase 3.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | nbformat v4.5 spec verified against official schema and JEP 62. archiver downloads and API verified on npm. Python package versions verified on PyPI. JSZip encoding issues confirmed in library issue tracker. |
| Features | HIGH | Cell order and quality checklist derived from fast.ai, Jake VanderPlas PDSH, STScI JDAT notebooks, and Jupyter4Edu pedagogical patterns — gold standard sources. Anti-features grounded in documented tradeoffs. |
| Architecture | HIGH | Existing `indexnow.ts` integration and OG image endpoint patterns are proven in this codebase. archiver vs JSZip decision is based on documented encoding issues. Component boundaries follow single-responsibility principle from existing codebase. |
| Pitfalls | HIGH | `.DAT` file format variability verified by direct `file` command inspection of files in `handbook/datasets/`. JSZip encoding issue documented in the library's own issue tracker (#368). nbformat cell ID requirement in official spec (JEP 62). NIST value cross-reference requirement grounded in v1.9 verification work. |

**Overall confidence: HIGH**

### Gaps to Address

- **Exact `.DAT` parsing parameters for all 10 files** — Known formats documented in PITFALLS.md, but `skiprows` counts and column names need empirical verification in Python. This is implementation work, not a research gap.
- **Numerical agreement with website** — Will not be known until Python code is written and compared cell-by-cell with the website values. The v1.9 website values are the ground truth. Requires careful implementation discipline, not additional research.
- **Colab `.DAT` file delivery** — No decision made yet (Open Question #1). Must be resolved before Phase 2 templates begin.

## Sources

### Primary (HIGH confidence)
- [nbformat v4.5 JSON Schema](https://github.com/jupyter/nbformat/blob/main/nbformat/v4/nbformat.v4.5.schema.json)
- [nbformat v4.5 format description](https://nbformat.readthedocs.io/en/latest/format_description.html)
- [Cell ID JEP 62](https://jupyter.org/enhancement-proposals/62-cell-id/cell-id.html)
- [Astro Integration API](https://docs.astro.build/en/reference/integrations-reference/)
- [Astro Endpoints documentation](https://docs.astro.build/en/guides/endpoints/)
- [archiver npm package](https://www.npmjs.com/package/archiver)
- [npm trends: archiver vs jszip vs alternatives](https://npmtrends.com/archiver-vs-jszip-vs-node-stream-zip-vs-yauzl-vs-yazl-vs-zip-js)
- Existing codebase patterns (direct code inspection): `src/integrations/indexnow.ts`, `src/pages/open-graph/eda/[...slug].png.ts`, `src/components/eda/CaseStudyDataset.astro`, `src/data/eda/datasets.ts`, `src/lib/eda/routes.ts`, `src/pages/eda/case-studies/index.astro`
- [Teaching and Learning with Jupyter — Pedagogical Patterns](https://jupyter4edu.github.io/jupyter-edu-book/catalogue.html)
- [Jake VanderPlas Python Data Science Handbook notebooks](https://github.com/jakevdp/PythonDataScienceHandbook)
- [STScI JDAT Notebooks requirements specification](https://spacetelescope.github.io/jdat_notebooks/docs/requirements.html)
- [GitHub Pages limits](https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits)
- NumPy, SciPy, pandas, matplotlib, seaborn — PyPI releases verified

### Secondary (MEDIUM-HIGH confidence)
- [JSZip encoding issue #368](https://github.com/Stuk/jszip/issues/368) — UTF-8 encoding not preserved after zip generation
- [Archiver string stream issue #375](https://github.com/archiverjs/node-archiver/issues/375) — invalid ZIP from string-based streams
- [Google Colab GitHub integration](https://github.com/googlecolab/open_in_colab) — URL pattern requirement
- [Writing Good Jupyter Notebooks — Practical Data Science](https://www.practicaldatascience.org/notebooks/PDS_not_yet_in_coursera/20_programming_concepts/writing_good_jupyter_notebooks.html)
- [nbformat MissingIDFieldWarning #335](https://github.com/jupyter/nbformat/issues/335)
- `handbook/datasets/*.DAT` — direct file inspection confirming mixed CRLF/LF line endings

---
*Research completed: 2026-03-14*
*Ready for roadmap: yes*
