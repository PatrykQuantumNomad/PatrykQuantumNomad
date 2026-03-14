# Feature Landscape: Downloadable Jupyter Notebooks for EDA Case Studies

**Domain:** Educational downloadable notebooks for statistical case studies
**Researched:** 2026-03-14
**Confidence:** HIGH (well-established domain with clear community standards)

## Table Stakes

Features users expect. Missing = product feels incomplete or unprofessional.

| Feature | Why Expected | Complexity | Dependencies | Notes |
|---------|--------------|------------|--------------|-------|
| Valid `.ipynb` JSON (nbformat v4.5) | Notebooks must open cleanly in Jupyter, VS Code, Colab, or any compliant viewer. Broken JSON = complete failure. | Low | None (pure JSON generation) | Top-level keys: `metadata`, `nbformat` (4), `nbformat_minor` (5), `cells`. Cell types: `code` (with `execution_count: null`, `outputs: []`) and `markdown`. Cell IDs must be unique 1-64 char alphanumeric strings. |
| Correct `kernelspec` metadata | Users expect to open and run without kernel configuration errors. Missing or wrong kernelspec causes "No kernel found" dialogs in JupyterLab and VS Code. | Low | None | `{"name": "python3", "display_name": "Python 3", "language": "python"}` plus `language_info: {"name": "python", "version": "3.10", "codemirror_mode": {"name": "ipython", "version": 3}, "file_extension": ".py", "mimetype": "text/x-python"}` |
| Title and context cell | Every published educational notebook (fast.ai, scikit-learn tutorials, university courses, Jake VanderPlas PDSH) starts with a markdown H1 title, author/source attribution, and a brief description. Notebooks without a title cell look like draft scratchpads. | Low | Existing case study frontmatter (`title`, `description`, `nistSection`) | First cell: `# Normal Random Numbers Case Study\n\n**Source:** NIST/SEMATECH e-Handbook Section 1.4.2.1\n**Dataset:** RANDN.DAT (500 observations)\n**Web page:** [patrykgolabek.dev/eda/case-studies/normal-random-numbers/](url)` |
| Self-contained data loading cell | Users must be able to load the dataset without downloading separate files, configuring file paths, or fetching URLs. Inline data embedding is expected for datasets under ~1000 rows. This is how Google Colab tutorials, fast.ai course notebooks, and scikit-learn examples work. | Low | Existing `datasets.ts` data arrays (verbatim NIST values) | Embed data directly as Python list literals, then construct a pandas DataFrame. Avoids all external file dependency issues (path resolution, CORS, rate limiting). The data arrays already exist in the codebase -- the generator reads them and emits Python. |
| Import cell with standard libraries | `import numpy as np`, `import pandas as pd`, `import matplotlib.pyplot as plt`, `from scipy import stats`, `import seaborn as sns`. Users expect to see the full library stack in one cell at the top. | Low | None | Match the Python stack already referenced on case study pages. Include `%matplotlib inline` for Jupyter classic compatibility. |
| Executable analysis cells | The core value proposition: reproduce the analysis shown on the web page. Each statistical operation (4-plot, hypothesis tests, model fitting) must have runnable code that produces matching results. | Med | Existing case study analysis logic (currently in TypeScript `statistics.ts` and build-time SVG generators) | Must translate TypeScript analysis into equivalent Python using NumPy/SciPy/pandas. 10 notebooks x ~10-15 code cells each. |
| Markdown narrative between code cells | Interleaved explanation is what distinguishes a notebook from a script. The Jupyter4Edu community guidelines emphasize that "guiding text can be embedded exactly where it is needed where the coding is happening." Every code cell should be preceded by a markdown cell explaining what it does and why. | Med | Existing MDX prose from case study pages | Adapt the MDX narrative to notebook markdown. Strip HTML tags, `<InlineMath>` components, and Astro component references. Replace KaTeX syntax with standard LaTeX `$...$` (Jupyter renders LaTeX natively in markdown cells). Keep the statistical reasoning and NIST-aligned interpretation. |
| Summary statistics output | Mean, std dev, median, min, max, skewness, kurtosis displayed after data loading. Every EDA notebook starts with descriptive statistics. This is universal across tutorials, courses, and data science textbooks. | Low | Data loading cell | `df.describe()` plus custom stats via `scipy.stats.skew()` and `scipy.stats.kurtosis()` |
| 4-plot reproduction | The signature analysis of every NIST case study. Run sequence plot, lag plot, histogram, and normal probability plot in a 2x2 grid. This is the visual anchor that ties the notebook to the web page. | Med | matplotlib, scipy | `fig, axes = plt.subplots(2, 2, figsize=(10, 8))` pattern. Run sequence: `ax.plot(data)`. Lag plot: `ax.scatter(data[:-1], data[1:])`. Histogram: `ax.hist(data, bins='auto')`. Normal probability plot: `scipy.stats.probplot(data, plot=ax)`. |
| Hypothesis test results | t-test, runs test, Anderson-Darling, Bartlett/Levene, Grubbs -- whatever tests the web page reports. Users expect to verify the published numbers. | Med | scipy.stats | Most tests available directly: `scipy.stats.ttest_1samp()`, `scipy.stats.anderson()`, `scipy.stats.bartlett()`, `scipy.stats.levene()`. Runs test may need manual implementation (not in scipy) or `statsmodels.sandbox.stats.runs.runstest_1samp()`. |
| Interpretation markdown cells | After each test/plot, a markdown cell stating the conclusion in plain language: "The Anderson-Darling test statistic A^2 = 5.765 exceeds the critical value at all significance levels, rejecting normality." Numbers without interpretation are useless for learning. | Low | Existing MDX interpretation text | Adapt from existing prose. Critical for educational value per Practical Data Science guidelines: "Never present raw numerical outputs. Always contextualize results." |
| Conclusions cell | Final markdown cell summarizing the key findings, matching the web page conclusions section. | Low | Existing MDX conclusions | Direct adaptation to notebook markdown. Include cross-references to other case studies as text mentions (not web links, since notebooks are standalone). |
| One-click download button on each case study page | A visible download button/link on each case study page. Users expect to find the notebook where the content is. The existing `CaseStudyDataset.astro` component already has "Download CSV" and "NIST Source" buttons -- the notebook download should sit alongside them. | Low | Existing `CaseStudyDataset.astro` component, static `.ipynb` files | Add `.ipynb` download button with the same styling as the existing CSV download button. Same `<a href="..." download="...">` pattern. |
| Direct file download (not redirect) | Clicking download should trigger the browser file save dialog, not navigate to another page or open a viewer. The `download` HTML attribute on the `<a>` tag achieves this. | Low | Static `.ipynb` files served from `public/notebooks/` | Same pattern as existing CSV download. Link to `/notebooks/[slug].ipynb` with `download` attribute. |
| All 10 case studies covered | Partial coverage looks like a bug, not a feature. If the section advertises "10 case studies" and only 6 have notebooks, users assume the other 4 are broken. | Med | Notebook generator must handle all 3 template variants (standard, model development, DOE) | All 10 notebooks are required for the feature to be complete. |

## Differentiators

Features that set the product apart. Not expected, but valued. These make the notebooks memorable and shareable.

| Feature | Value Proposition | Complexity | Dependencies | Notes |
|---------|-------------------|------------|--------------|-------|
| "Open in Google Colab" button | Zero-setup execution. Users can run the notebook without installing Python, pip, or Jupyter. Google Colab is free and universally available. Massively lowers barrier to engagement -- a student or recruiter can verify the analysis in 30 seconds. Link format: `https://colab.research.google.com/github/PatrykQuantumNomad/[repo]/blob/main/[path].ipynb`. | Low | Notebooks must be committed to the GitHub repo at a predictable path. Notebooks must be self-contained (no external file dependencies -- already achieved by inline data embedding). | Include as BOTH (a) a button on the case study web page and (b) a Colab badge in the notebook's title markdown cell. Badge markdown: `[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](url)` |
| Build-time notebook generation (TypeScript) | Generate `.ipynb` JSON at Astro build time from case study data and template configurations. Eliminates the maintenance burden of hand-editing 10 separate JSON files. Ensures notebooks stay perfectly in sync with web content and datasets. When a dataset value is corrected or narrative is improved, the notebooks update automatically on next build. | Med | Astro build integration (custom integration or script in `astro.config.mjs`), `datasets.ts`, case study metadata, `DATASET_SOURCES` | `.ipynb` files are plain JSON. TypeScript can construct the JSON structure directly -- no Python dependency, no nbformat library needed. One generator module with a template function per variant (standard, model-development, DOE). Outputs files to `public/notebooks/`. Approach is validated by the nbformat TypeScript type definitions discussion on Jupyter forums. |
| Seaborn-styled plots | Match the visual quality of the web page SVG plots. Raw matplotlib defaults (white background, thin lines, small fonts) look amateur compared to styled publication-quality plots. `sns.set_theme()` with one line of code transforms every plot in the notebook. | Low | `import seaborn as sns; sns.set_theme(style='whitegrid')` | Add to the import/setup cell. Dramatic improvement in plot aesthetics with zero complexity. Community standard for educational data science notebooks. |
| `%matplotlib inline` magic | Ensures plots render inline in Jupyter classic and Google Colab without users needing to configure anything. Missing this magic causes plots to not display, which is the most common beginner confusion with Jupyter. | Low | Import cell | Single line: `%matplotlib inline`. JupyterLab does not require it (auto-inline), but Jupyter classic and Colab do. Include for maximum compatibility. |
| Requirements header cell | A markdown cell listing required packages and their purpose, plus a commented `!pip install` command that Colab users can uncomment. Follows the STScI JDAT notebooks standard and Google Colab tutorial convention. | Low | None | `## Requirements\n\nThis notebook uses:\n- **numpy** -- numerical computation\n- **scipy** -- statistical tests\n- **pandas** -- data manipulation\n- **matplotlib** -- plotting\n- **seaborn** -- plot styling\n\nUncomment to install:\n```python\n# !pip install numpy scipy pandas matplotlib seaborn\n```` |
| NIST source attribution with site backlinks | Every notebook links back to (1) the original NIST handbook section for academic credibility and (2) the case study page on patrykgolabek.dev for traffic. Every notebook becomes an SEO outpost. When shared on GitHub, forwarded to colleagues, or posted in course materials, the backlinks drive discovery. | Low | Existing `DATASET_SOURCES` metadata (contains all NIST URLs) | Add to the title markdown cell. Two links: NIST source URL and site URL. |
| Case-study-specific advanced analysis cells | For the 3 complex case studies, include the model development cycle that makes them unique: sinusoidal curve fitting (beam deflections), AR(1) residual analysis (random walk), and full DOE analysis with batch effects and factor rankings (ceramic strength). This goes beyond generic "pandas EDA tutorial" territory into NIST-quality statistical methodology. | High | scipy.optimize.curve_fit (beam deflections), statsmodels or manual AR(1) implementation (random walk), scipy.stats for ANOVA and two-sample tests (ceramic strength) | These 3 notebooks are significantly more complex than the other 7. Beam deflections: nonlinear regression for sinusoidal model parameters. Random walk: first-difference transformation, AR(1) coefficient estimation, residual validation. Ceramic strength: bimodal distribution analysis, F-test for equal variances, two-sample t-test, one-way ANOVA, DOE factor effects with interaction analysis. |
| Autocorrelation and spectral analysis cells | Include ACF computation and spectral density (periodogram) plots where the web page includes them. Most generic EDA notebooks skip these entirely -- NIST methodology includes them as standard practice for time-series-aware EDA. | Med | numpy FFT for spectral analysis, manual ACF computation or `statsmodels.tsa.stattools.acf()` | `np.fft.fft()` for spectral density. ACF can be computed manually as `np.correlate(data - mean, data - mean, mode='full') / (n * var)` to avoid a statsmodels dependency, or use statsmodels if already needed for other tests. |
| Download all notebooks (ZIP) from case studies index page | A single download for all 10 notebooks from `/eda/case-studies/`. Useful for teachers who want the complete collection, students downloading materials for a course, or anyone who wants to work through all 10 case studies offline. | Med | Build-time ZIP generation | Generate a ZIP at build time containing all 10 `.ipynb` files, a shared `requirements.txt`, and a collection `README.md`. Node.js built-in `zlib` module or the `archiver` npm package. Output to `public/notebooks/eda-case-studies.zip`. |
| Collection README inside ZIP | A `README.md` inside the ZIP explaining the full collection: what each notebook covers, prerequisites, how to run, NIST section references. Contextualizes the collection as a coherent educational resource. | Low | Case study metadata | Pure content. Include a table: Case Study | Dataset | Observations | NIST Section | What It Demonstrates. |

## Anti-Features

Features to explicitly NOT build. Tempting but wrong for this context.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Interactive notebook execution on the site (JupyterLite / Thebe / Pyodide) | Embedding a WASM Python runtime adds massive complexity (>5MB payload, package loading latency of 10-30s, state management, browser compatibility issues, WASM memory limits). The site already shows the analysis results as polished theme-aware SVG plots and formatted statistics -- an in-browser Jupyter would produce uglier, slower versions of the same content. | Provide "Open in Colab" button for zero-install cloud execution. Static `.ipynb` download for local Jupyter execution. The web page IS the polished view; the notebook is the reproducible companion. |
| Pre-executed notebooks with saved outputs | Saving cell outputs (plots as base64 PNG, printed text) into the `.ipynb` bloats file size 5-50x (a 20KB clean notebook becomes 200-500KB with images), makes git diffs unreadable, and creates stale output when code or data changes. The educational standard from fast.ai and Jupyter4Edu is to ship clean notebooks that students execute themselves -- the "Shift-Enter for the win" pedagogical pattern. | Ship clean notebooks with `execution_count: null` and `outputs: []` for all code cells. Add a markdown note in the title cell: "Run all cells (Kernel > Restart & Run All) to reproduce the analysis." |
| Separate `requirements.txt` per notebook | 10 identical `requirements.txt` files creates maintenance burden and confuses users about whether different notebooks need different environments. All 10 notebooks use the exact same Python stack (numpy, scipy, pandas, matplotlib, seaborn). | One requirements/install cell in each notebook (commented `!pip install` line). One shared `requirements.txt` at the collection root inside the ZIP download. |
| nbconvert HTML rendering pipeline | Converting notebooks to HTML to show rendered previews on the site duplicates what the MDX case study pages already do, and do better (with themed SVGs, KaTeX formulas, responsive layout, internal cross-links). | The case study MDX pages ARE the rendered version. Notebooks are the downloadable companion for hands-on execution. The page itself is the best preview of what the notebook contains. |
| Notebook rendering/preview component on the page | Building a component that renders the first few cells of the `.ipynb` as HTML on the case study page. | The case study page content already shows the same analysis. A notebook preview would be redundant. |
| Exercise / fill-in-the-blank cells | Adding `# YOUR CODE HERE` cells implies a course assignment / grading context that does not exist. This is a reference analysis from a portfolio site, not a homework set. The Jupyter4Edu catalogue distinguishes "Shift-Enter for the win" (complete reference notebooks) from "Fill in the blanks" (worksheets) -- this project is the former. | Provide complete, runnable code. Users who want to experiment will modify cells naturally. |
| Multi-language notebook support (R, Julia) | Supporting R or Julia kernels multiplies maintenance by 3x for a niche audience. The site's Python code examples and the existing NumPy/SciPy/pandas stack are already established. The datasets are language-agnostic but the analysis code is not. | Python 3 only. This is a deliberate scope decision. |
| Auto-updating notebooks from live NIST data | NIST datasets are static reference data published in the 1990s. Building a fetch-from-NIST pipeline adds network failure modes, CORS issues, and rate limiting for zero benefit. | Embed data directly as Python list literals in each notebook. Link to NIST source URL for provenance. The data has not changed since publication. |
| Notebook versioning / changelog system | Tracking notebook versions separately from the site creates parallel versioning overhead with no user benefit. | Notebooks are generated from site data at build time. Site version = notebook version. The git commit history is the changelog. |
| Binder integration | MyBinder.org provides free notebook execution but has cold-start times of 30-120 seconds, 12-hour session limits, frequent downtime, and unreliable availability. Google Colab is faster (5s cold start), more reliable, and more widely used. | Google Colab "Open in Colab" button only. One "run in cloud" option is sufficient. Do not fragment users across two cloud execution platforms. |
| ZIP download with separate .DAT files | Bundling separate .DAT files requires users to understand file structure and relative paths. Path resolution breaks when users move files or open notebooks from unexpected locations. | Embed all data inline in the notebook code cells. Zero external file dependencies. Users can run from any directory, in any environment. |

## Feature Dependencies

```
Valid .ipynb JSON structure ──> All other notebook features (foundation)
    |
    ├── kernelspec metadata (required for kernel selection on open)
    ├── Import cell ──> %matplotlib inline
    │                ──> seaborn styling (sns.set_theme())
    ├── Data loading cell ──> Summary statistics cell
    │                     ──> 4-plot reproduction cell
    │                     ──> Hypothesis test cells
    │                     ──> Autocorrelation / spectral cells
    │                     ──> Advanced analysis cells (beam, random walk, ceramic)
    ├── Markdown narrative cells (parallel with code cells, no execution dependency)
    ├── Title cell with attribution ──> NIST source links
    │                               ──> Site backlinks (SEO value)
    │                               ──> Colab badge (needs GitHub path)
    └── Requirements cell (independent, first actionable cell)

Build-time generation (TypeScript notebook generator):
    datasets.ts (all 10 data arrays) ──> Feed notebook data cells
    Case study MDX frontmatter (title, description, nistSection) ──> Feed title/context cells
    DATASET_SOURCES metadata (name, nistUrl, description) ──> Feed NIST attribution
    Case study MDX prose ──> Adapt for markdown narrative cells
    statistics.ts analysis logic ──> Reference for translating to Python equivalents

Download infrastructure on site:
    Build-time .ipynb generation ──> Static files in public/notebooks/
        ├── Download button on CaseStudyDataset.astro (add .ipynb alongside CSV)
        ├── "Open in Colab" button on case study page (needs GitHub blob URL)
        └── Download all ZIP on /eda/case-studies/ index page
                ├── Requires all 10 notebooks generated
                ├── Include shared requirements.txt
                └── Include collection README.md
```

## MVP Recommendation

**Phase 1: Core notebooks with download buttons**

Prioritize (in implementation order):

1. **TypeScript notebook generator module** -- Single module (`src/lib/eda/notebook-generator.ts`) that constructs nbformat v4.5 JSON. Takes case study slug, data array, variable label, and template configuration as inputs. Outputs valid `.ipynb` files. This is the foundation everything else depends on.

2. **Standard notebook template** -- Defines the cell sequence used by 7 of 10 case studies (normal random numbers, uniform random numbers, cryothermometry, filter transmittance, heat flow meter, fatigue life, standard resistor): title, requirements, imports, data loading, summary stats, 4-plot, individual plots, hypothesis tests (location, variation, randomness, distribution), test summary table, interpretation, conclusions.

3. **Executable Python analysis code** -- Translate the TypeScript `statistics.ts` analysis logic into equivalent Python using NumPy/SciPy/pandas. This is the core implementation work: 4-plot generation (`plt.subplots(2,2)`), t-tests (`scipy.stats.ttest_1samp`), Anderson-Darling (`scipy.stats.anderson`), runs tests, Bartlett test (`scipy.stats.bartlett`), autocorrelation computation, spectral analysis (`np.fft.fft`).

4. **Markdown narrative cells** -- Adapt existing MDX prose into notebook markdown. Strip HTML tags, `<InlineMath>` components, and Astro component references. Convert KaTeX `\tex{...}` to standard LaTeX `$...$` notation. Keep the NIST-aligned statistical reasoning and interpretation.

5. **Download button integration** -- Add `.ipynb` download button to `CaseStudyDataset.astro` alongside the existing CSV download. Same visual pattern, same `<a href="..." download="...">` mechanism. Link to `/notebooks/[slug].ipynb`.

6. **"Open in Colab" button** -- Add Colab badge to (a) each case study web page next to the download button and (b) as a markdown badge in each notebook's title cell. Low effort, high value.

**Phase 2: Advanced notebooks and distribution**

7. **Beam deflections notebook** -- Model development variation: sinusoidal curve fitting with `scipy.optimize.curve_fit`, residual 4-plot, model validation cycle. Significantly more complex than standard template.

8. **Random walk notebook** -- AR(1) model fitting, differencing, residual analysis. Manual AR(1) coefficient estimation or lightweight statsmodels usage.

9. **Ceramic strength notebook** -- DOE variation: multi-column structured data, batch histograms, two-sample t-test, F-test, one-way ANOVA, DOE factor analysis with interaction effects. Most complex notebook in the collection.

10. **Download all ZIP** -- Build-time archive of all 10 notebooks with shared `requirements.txt` and collection `README.md`. Available from the `/eda/case-studies/` index page.

11. **Visual polish** -- Consistent `figsize`, `sns.set_theme()`, axis labels, plot titles across all 10 notebooks.

**Defer:**
- Notebook preview on page: The case study page itself IS the preview.
- Interactive in-browser execution: "Open in Colab" solves this at zero maintenance cost.
- Pre-executed outputs: Educational standard is clean notebooks.
- Binder integration: Colab is sufficient, more reliable, and faster.

## Notebook Quality Standards

Based on research of fast.ai course notebooks, scikit-learn tutorial structure, Jupyter4Edu pedagogical patterns, STScI JDAT notebook requirements, Jake VanderPlas PDSH notebooks, and community best practices (Practical Data Science, Carpenter-Singh Lab).

### Cell Organization (follow this order for every notebook)

1. **Title cell** (markdown) -- H1 title, source attribution (NIST section + author), dataset summary (name, N, response variable), link to web page on patrykgolabek.dev, "Open in Colab" badge
2. **Requirements cell** (markdown) -- List of required packages with purpose, commented `!pip install` command
3. **Import cell** (code) -- All imports in one cell, `%matplotlib inline`, `sns.set_theme()`
4. **Data loading cell** (code) -- Inline data as Python list literal, construct DataFrame with descriptive column names, display `df.head()` and `df.describe()`
5. **EDA overview cell** (markdown) -- Brief statement of the four assumptions being tested (fixed location, fixed variation, randomness, fixed distribution) and analytical goals
6. **4-plot cell** (code) -- 2x2 grid: run sequence, lag, histogram, normal probability plot
7. **4-plot interpretation cell** (markdown) -- What the 4-plot reveals at a glance for this dataset
8. **Individual plot cells** (alternating markdown/code) -- Deeper dive into each plot type with detailed interpretation
9. **Quantitative test cells** (alternating markdown/code) -- Location test, variation test, randomness tests, distribution test; result interpretation after each
10. **Test summary cell** (markdown) -- Table: Assumption | Test | Statistic | Result (Pass/Fail)
11. **Interpretation cell** (markdown) -- Synthesis of graphical and quantitative evidence
12. **Conclusions cell** (markdown) -- Bullet-point key findings, mention of related case studies

### Quality Checklist (per notebook)

- [ ] Opens without errors in JupyterLab 4.x, VS Code Jupyter extension, and Google Colab
- [ ] All cells execute sequentially without errors (Kernel > Restart & Run All)
- [ ] No hardcoded file paths -- all data embedded inline as Python list literals
- [ ] Every code cell preceded by an explanatory markdown cell
- [ ] Numerical results match values published on the web page (within rounding precision)
- [ ] Plots reproduce the visual patterns shown in the web SVGs (same structure, not pixel-identical)
- [ ] NIST attribution present with clickable URL
- [ ] Site backlink URL present (patrykgolabek.dev case study page)
- [ ] Clean notebook: `execution_count: null`, `outputs: []` for all code cells
- [ ] File size under 100KB per notebook (no saved outputs, no embedded images)
- [ ] Cell IDs are unique, deterministic, and alphanumeric (e.g., `normal-random-01`)
- [ ] LaTeX formulas use `$...$` notation (not KaTeX `<InlineMath>` tags)
- [ ] No `import` statements outside the import cell (unless essential for readability in model-fitting sections)

## Complexity Tiers

The 10 case studies fall into three tiers for notebook generation complexity:

### Tier 1: Standard template (7 notebooks -- Low/Med complexity)
Normal Random Numbers, Cryothermometry, Filter Transmittance, Heat Flow Meter, Standard Resistor, Uniform Random Numbers, Fatigue Life

Same cell sequence with configuration differences: different data, different variable names, different expected test results in interpretation cells. The notebook generator handles these with a single template function parameterized by case study config.

### Tier 2: Model development variation (2 notebooks -- High complexity)
Beam Deflections (sinusoidal model), Random Walk (AR(1) model)

Additional cells: spectral analysis, model fitting, residual analysis, residual 4-plot, model validation cycle. Beam deflections requires `scipy.optimize.curve_fit` for nonlinear sinusoidal regression. Random walk requires AR(1) coefficient estimation and residual standard deviation computation. Significantly more code cells and more complex narrative with the NIST "test assumptions --> develop model --> validate residuals" cycle.

### Tier 3: DOE variation (1 notebook -- Highest complexity)
Ceramic Strength

Multi-column structured data (480 rows x 8 columns), batch effect analysis (box plots, histograms by batch), two-sample statistical tests (t-test, F-test), one-way ANOVA across labs, DOE factor analysis with main effects and interactions. Most Python code, most complex narrative, largest data cell (~48KB). Essentially a standalone statistical analysis report in notebook form.

## Estimated Notebook Sizes

| Case Study | Data Points | Est. Data Cell | Est. Total | Template |
|------------|-------------|----------------|------------|----------|
| Normal Random Numbers | 500 | 8 KB | 20 KB | Standard |
| Uniform Random Numbers | 500 | 10 KB | 22 KB | Standard (distribution focus) |
| Random Walk | 500 | 10 KB | 25 KB | Model development (AR(1)) |
| Beam Deflections | 200 | 3 KB | 25 KB | Model development (sinusoidal) |
| Cryothermometry | 700 | 7 KB | 20 KB | Standard |
| Filter Transmittance | 50 | 1 KB | 15 KB | Standard |
| Heat Flow Meter | 195 | 4 KB | 18 KB | Standard |
| Fatigue Life | 101 | 2 KB | 20 KB | Standard (distribution focus) |
| Ceramic Strength | 480 x 8 cols | 48 KB | 65 KB | DOE variation |
| Standard Resistor | 1000 | 15 KB | 30 KB | Standard |

**Total collection:** ~260 KB uncompressed, ~50-80 KB as ZIP.

## Data Embedding Strategy

Each notebook needs the dataset embedded as Python code. Three approaches by dataset type:

**Approach A: Compact list literal (datasets <= 200 values)**
Filter Transmittance (50), Fatigue Life (101), Heat Flow Meter (195), Beam Deflections (200)
```python
data = [-213, -564, -35, -15, 141, 115, -420, -360, 203, -338, ...]
df = pd.DataFrame({'deflection': data}, index=range(1, len(data) + 1))
df.index.name = 'observation'
```

**Approach B: Multi-line list, 10 values per row (datasets > 200 values)**
Normal Random (500), Uniform Random (500), Random Walk (500), Cryothermometry (700), Standard Resistor (1000)
```python
data = [
    -1.276, -1.218, -0.453, -0.350, 0.723, 0.676, -1.099, -0.314, -0.394, -0.633,
    -0.318, -0.799, -1.664, 1.391, 0.382, 0.733, 0.653, 0.219, -0.681, 1.129,
    # ... (10 values per line, matching NIST .DAT format)
]
```

**Approach C: List of dicts for structured data**
Ceramic Strength (480 rows x 8 columns)
```python
data = [
    {'id': 1, 'lab': 1, 'strength': 608.781, 'table_speed': -1, 'down_feed': -1, 'wheel_grit': -1, 'batch': 1, 'rep': 1},
    {'id': 2, 'lab': 1, 'strength': 569.670, 'table_speed': -1, 'down_feed': -1, 'wheel_grit': 1, 'batch': 1, 'rep': 1},
    # ... 480 rows
]
df = pd.DataFrame(data)
```

## Sources

- [The Notebook file format -- nbformat 5.10 documentation](https://nbformat.readthedocs.io/en/latest/format_description.html) -- HIGH confidence, authoritative specification for .ipynb JSON structure
- [nbformat v4 JSON Schema on GitHub](https://github.com/jupyter/nbformat/blob/main/nbformat/v4/nbformat.v4.schema.json) -- HIGH confidence, official schema definition
- [Teaching and Learning with Jupyter -- Pedagogical Patterns](https://jupyter4edu.github.io/jupyter-edu-book/catalogue.html) -- HIGH confidence, 23 catalogued pedagogical patterns for educational notebooks
- [Teaching and Learning with Jupyter -- Notebooks in Teaching](https://jupyter4edu.github.io/jupyter-edu-book/notebooks-in-teaching-and-learning.html) -- HIGH confidence, structural recommendations for educational use
- [Writing Good Jupyter Notebooks -- Practical Data Science](https://www.practicaldatascience.org/notebooks/PDS_not_yet_in_coursera/20_programming_concepts/writing_good_jupyter_notebooks.html) -- HIGH confidence, quality standards and anti-patterns
- [Notebook Best Practices -- nbdev / fast.ai](https://nbdev.fast.ai/tutorials/best_practices.html) -- HIGH confidence, industry-leading notebook practices (Diataxis system, cell decomposition)
- [Best Practices for Jupyter Notebooks -- Carpenter-Singh Lab](https://carpenter-singh-lab.broadinstitute.org/blog/best-practices-jupyter-notebook) -- MEDIUM confidence, practical recommendations for scientific notebooks
- [Open in Colab badge generator](https://openincolab.com/) -- HIGH confidence, official Colab badge format and URL structure
- [nbformat TypeScript type definitions discussion](https://discourse.jupyter.org/t/nbformat-typescript-type-definitions/1935) -- MEDIUM confidence, confirms TypeScript-native JSON generation is viable without Python nbformat dependency
- [Best Practices for Reproducible Jupyter Notebooks](https://towardsdatascience.com/best-practices-for-writing-reproducible-and-maintainable-jupyter-notebooks-49fcc984ea68/) -- MEDIUM confidence, reproducibility standards
- [Production Jupyter Notebooks: Managing Dependencies](https://blog.reviewnb.com/jupyter-notebook-reproducibility-managing-dependencies-data-secrets/) -- MEDIUM confidence, dependency management and requirements.txt guidance
- [Jake VanderPlas Python Data Science Handbook notebooks](https://github.com/jakevdp/PythonDataScienceHandbook) -- HIGH confidence, gold standard for educational Python data science notebooks
- [STScI JDAT Notebooks requirements specification](https://spacetelescope.github.io/jdat_notebooks/docs/requirements.html) -- HIGH confidence, scientific notebook requirements from Space Telescope Science Institute
- [Best practices for using Jupyter notebooks -- Russell Poldrack](https://russpoldrack.substack.com/p/best-practices-for-using-jupyter) -- MEDIUM confidence, scientific reproducibility perspective
- [Jupyter Best Practices -- Chris von Csefalvay (GitHub)](https://github.com/chrisvoncsefalvay/jupyter-best-practices) -- MEDIUM confidence, community-maintained style guide

---
*Feature landscape research for: Downloadable Jupyter Notebooks for EDA Case Studies*
*Researched: 2026-03-14*
