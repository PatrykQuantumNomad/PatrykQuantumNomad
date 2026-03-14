# Domain Pitfalls: Adding Jupyter Notebook Downloads to Existing Astro Static Site

**Domain:** Downloadable Jupyter Notebooks for 10 EDA case studies on existing Astro 5 / GitHub Pages site
**Researched:** 2026-03-14
**Confidence:** HIGH (verified against official nbformat docs, GitHub Pages docs, project source code, and community issue trackers)

## Critical Pitfalls

Mistakes that cause broken downloads, user-facing failures, or build regressions.

### Pitfall 1: Notebook Format Version Mismatch Causes Validation Errors

**What goes wrong:** Generating .ipynb files with `nbformat: 4, nbformat_minor: 5` (format 4.5) but omitting cell `id` fields, or generating with `nbformat_minor: 0` and including `id` fields that older clients do not expect. The notebook opens in one environment but fails validation in another.

**Why it happens:** The notebook format is JSON with a schema that evolved significantly. Format 4.5 (introduced via JEP 62) **requires** a unique `id` field on every cell -- a string of 1-64 characters matching `^[a-zA-Z0-9-_]+$`. Earlier format versions (4.0-4.4) do not have this field. When generating programmatically in TypeScript/Node.js (not using Python's `nbformat` library), it is easy to get the version/schema contract wrong. There is no maintained TypeScript library for generating Jupyter notebooks -- the canonical `nbformat` library is Python-only.

**Consequences:**
- JupyterLab 3.x+ and nbformat 5.x validators reject notebooks with missing IDs when declared as 4.5
- VS Code Jupyter extension shows MissingIDFieldWarning or refuses to render cells
- Google Colab silently ignores the issue (masking the bug during testing)
- Users who validate notebooks with `nbformat.validate()` get `ValidationError`

**Prevention:**
- Target format version 4, minor version 5 (`"nbformat": 4, "nbformat_minor": 5`) -- this is the current standard all environments support
- Generate a unique `id` for every cell using 8-character hex strings (e.g., deterministic hash from cell index + notebook slug)
- Use **deterministic** IDs (not random) so that builds are reproducible and git diffs are clean
- Validate the complete notebook JSON structure against the nbformat 4.5 schema before writing to disk

**Detection:** Open every generated notebook in JupyterLab, VS Code, AND run `python -c "import nbformat; nbformat.validate(nbformat.read('notebook.ipynb', as_version=4))"` from CLI. If any one fails, the format is wrong.

**Sources:**
- [Cell ID JEP 62](https://jupyter.org/enhancement-proposals/62-cell-id/cell-id.html)
- [nbformat 4.5 format description](https://nbformat.readthedocs.io/en/latest/format_description.html)
- [MissingIDFieldWarning issue #335](https://github.com/jupyter/nbformat/issues/335)

---

### Pitfall 2: Generating .ipynb JSON in TypeScript Without a Schema Reference

**What goes wrong:** Hand-writing the notebook JSON structure from memory produces notebooks that are subtly invalid -- missing required fields like `execution_count` on code cells, wrong types for `outputs` (object instead of array), or incorrect `source` format (string instead of list of strings).

**Why it happens:** There is no maintained TypeScript library for generating Jupyter notebooks. When building notebooks in a Node.js/Astro build pipeline, developers must construct the JSON manually. The format has subtle requirements:
- Code cells require `execution_count` (set to `null` for unexecuted cells, NOT omitted)
- Code cells require `outputs` as an array (empty `[]` for unexecuted cells)
- `source` can be a string or a list of strings -- JupyterLab handles both, but behavior varies
- `metadata` must be an object (even if empty `{}`), never `null` or omitted
- `cell_type` must be exactly `"code"`, `"markdown"`, or `"raw"` (case-sensitive)
- `kernelspec` inside top-level `metadata` should specify `"name": "python3"` and `"display_name": "Python 3"` for the kernel chooser to work

**Consequences:**
- Notebook opens but cells are empty or show raw JSON
- Kernel selection dialog appears repeatedly because `kernelspec` is missing or malformed
- nbformat validation rejects the file entirely
- Subtle rendering differences between JupyterLab, VS Code, and Colab

**Prevention:**
- Define a TypeScript type/interface that exactly mirrors the nbformat 4.5 schema:
  ```typescript
  interface NotebookCell {
    cell_type: 'code' | 'markdown' | 'raw';
    id: string;
    metadata: Record<string, unknown>;
    source: string;
    execution_count?: null;  // code cells only
    outputs?: unknown[];     // code cells only
  }
  interface Notebook {
    nbformat: 4;
    nbformat_minor: 5;
    metadata: {
      kernelspec: { name: string; display_name: string; language: string };
      language_info: { name: string; version: string; mimetype: string; file_extension: string };
    };
    cells: NotebookCell[];
  }
  ```
- Set `execution_count: null` (not `undefined`, not omitted) on all code cells
- Set `outputs: []` on all code cells
- Always use a single multi-line string for `source` (simplest, most compatible)
- Include complete `kernelspec` and `language_info` in notebook metadata
- Write a build-time validation step that parses each generated .ipynb and checks all required fields

**Detection:** Automated build-time JSON schema validation. Verify by opening in JupyterLab, VS Code, and Colab.

**Sources:**
- [nbformat file format specification](https://nbformat.readthedocs.io/en/latest/format_description.html)
- [nbformat TypeScript type definitions discussion](https://discourse.jupyter.org/t/nbformat-typescript-type-definitions/1935)

---

### Pitfall 3: ZIP File Corruption from Encoding Mismatches

**What goes wrong:** The generated .zip files are corrupt -- they extract to garbled content, fail to unzip, or the .ipynb inside has mangled characters. The download link works but the content is broken.

**Why it happens:** In Node.js, ZIP libraries (JSZip, archiver) distinguish between text and binary content. If you add a JSON string (the .ipynb content) using the binary option, or add binary data (the .DAT file) as UTF-8 text, the file is corrupted. JSZip specifically warns: "If you use a library that returns a binary string, you should use the binary option, otherwise JSZip will try to encode the string with UTF-8." Additionally, the `archiver` library has a known issue where string-based streams compute file sizes by character count instead of byte count, producing invalid ZIPs.

**Consequences:**
- Users download a .zip that cannot be extracted
- The .ipynb inside extracts but fails to parse as JSON (encoding corruption)
- The .DAT file inside extracts but has wrong line endings or garbled characters
- Failures may be platform-specific (works on macOS, breaks on Windows, or vice versa)

**Prevention:**
- Use `archiver` (stream-based, more robust for file I/O at build time) over JSZip for server-side/build-time ZIP generation
- Add .ipynb files as UTF-8 strings explicitly: `archive.append(jsonString, { name: 'notebook.ipynb' })`
- Add .DAT files by reading them as Buffers: `archive.file(filePath, { name: 'data.dat' })` -- do NOT read as string first
- After generation, validate every .zip by extracting it in a test and verifying contents match source
- Test on all three target platforms (macOS, Linux, Windows) since ZIP format has known cross-platform issues

**Detection:** Build-time validation that extracts each generated .zip and compares contents byte-for-byte with source files.

**Sources:**
- [JSZip encoding issues #368](https://github.com/Stuk/jszip/issues/368)
- [Archiver corrupt ZIPs from string streams #375](https://github.com/archiverjs/node-archiver/issues/375)
- [JSZip binary handling docs](https://stuk.github.io/jszip/documentation/api_jszip/file_data.html)

---

### Pitfall 4: NIST .DAT Files Have Inconsistent Formats and Encodings

**What goes wrong:** The notebook code for loading the bundled .DAT file fails with parsing errors because each NIST .DAT file has a different format: variable number of header lines to skip, inconsistent column delimiters, mixed line endings, and different column layouts.

**Why it happens:** The 10 case study datasets come from different NIST experiments spanning decades. Direct analysis of the actual files in `handbook/datasets/` reveals:
- **Line endings are inconsistent**: `CERAMIC.DAT` and `LEW.DAT` use CRLF (`\r\n`), while `FLICKER.DAT` and `ANSCOMBE.DAT` use LF (`\n`) -- confirmed via `file` command on actual repository files
- **Header lengths vary**: `LEW.DAT` has 25 lines of metadata before data begins (the file literally says "SKIP 25"), while other files have different skip counts
- **Delimiters vary**: Some use fixed-width columns, others use whitespace-delimited fields
- **Column structures differ**: Single-column datasets (normal random, random walk) vs multi-column datasets (ceramic strength with 7 variables plus run order)
- **Data row formats differ**: `CERAMIC.DAT` has a header row with column names plus a separator line (`----`), others jump to data after metadata

**Consequences:**
- A generic `pd.read_csv(filename, sep='\s+')` call fails on files with headers
- Users get `ParserError` or load header text as data values
- Wrong `skiprows` value loads partial data or includes metadata as numbers
- Multi-column datasets need explicit column name assignment
- CRLF vs LF inconsistency can cause subtle parsing bugs on different platforms

**Prevention:**
- Each notebook must have a **dataset-specific** loading cell with the correct `skiprows`, `names`, and `sep` parameters hardcoded for that dataset
- Normalize all bundled .DAT files to consistent LF line endings when copying into the ZIP (do not modify the originals in `handbook/datasets/`)
- Include a data validation cell after loading that prints shape, dtypes, and first 5 rows so the user can verify correct loading
- Do NOT rely on pandas auto-detection -- be explicit about every parameter:
  ```python
  # LEW.DAT (single column, 25 header lines)
  df = pd.read_csv('LEW.DAT', sep=r'\s+', skiprows=25, header=None, names=['deflection'])

  # CERAMIC.DAT (multi-column, skip metadata + column header + separator)
  df = pd.read_csv('CERAMIC.DAT', sep=r'\s+', skiprows=22,
                    names=['X1','X2','X3','X4','X5','Y','ORDER'])
  ```
- Cross-reference expected row counts against what `src/data/eda/datasets.ts` already has (e.g., normalRandom has 500 values, LEW has 200 values, ceramicStrength has 32 observations)

**Detection:** Each notebook's data loading cell should assert the expected row count: `assert len(df) == 200, f"Expected 200 rows, got {len(df)}"`

---

### Pitfall 5: Users Cannot Run Notebooks Due to Missing Python Dependencies

**What goes wrong:** Users download the notebook, open it in JupyterLab or VS Code, run the first cell, and immediately get `ModuleNotFoundError: No module named 'scipy'` or `No module named 'seaborn'`. They abandon the notebook.

**Why it happens:** This is the single most common failure mode for distributed Jupyter notebooks. The root cause is that Jupyter's kernel may not match the user's pip environment. Even users who have numpy installed system-wide may have Jupyter running in a different virtual environment. The problem is well-documented in the Jupyter community and affects beginners disproportionately. Google Colab users do NOT hit this (packages are pre-installed) -- creating a false sense during testing that notebooks "work fine."

**Consequences:**
- Users with less Python experience give up immediately
- Even experienced users waste time debugging environment issues
- Support burden falls on the site owner through confused issue reports

**Prevention:**
- Include a `requirements.txt` in each ZIP alongside the notebook and .DAT file
- Add a "Setup" markdown cell at the very top of every notebook explaining prerequisites
- Add a dependency check cell as the first code cell:
  ```python
  import sys
  required = ['numpy', 'scipy', 'pandas', 'matplotlib', 'seaborn']
  missing = []
  for pkg in required:
      try:
          __import__(pkg)
      except ImportError:
          missing.append(pkg)
  if missing:
      print(f"Missing packages: {', '.join(missing)}")
      print(f"Install with: {sys.executable} -m pip install {' '.join(missing)}")
  else:
      print("All dependencies available.")
  ```
- Use `{sys.executable} -m pip install` (not `!pip install`) to ensure the correct environment
- Pin version ranges (not exact versions) to avoid resolution failures: `numpy>=1.24`, `scipy>=1.10`, `pandas>=2.0`, `matplotlib>=3.7`, `seaborn>=0.12`
- Include an "Open in Google Colab" badge/link on the download page as the zero-setup alternative

**Detection:** Test notebooks in a clean Python 3.11+ virtual environment with only `jupyter` installed -- no scientific packages pre-installed.

**Sources:**
- [Installing Python packages from Jupyter](https://jakevdp.github.io/blog/2017/12/05/installing-python-packages-from-jupyter/)
- [Kernel/pip mismatch discussion](https://discourse.jupyter.org/t/python-in-terminal-finds-module-jupyter-notebook-does-not/2262)
- [Jupyter notebook reproducibility best practices](https://blog.reviewnb.com/jupyter-notebook-reproducibility-managing-dependencies-data-secrets/)

---

## Moderate Pitfalls

### Pitfall 6: Build Time Regression from ZIP Generation

**What goes wrong:** Adding ZIP file generation to the Astro build increases build time. If done naively (regenerating all 10 ZIPs on every build), it compounds with the existing 1090+ page build and OG image generation.

**Why it happens:** The project already generates 1090+ pages with OG images (using content-hash caching to avoid regeneration). ZIP generation adds file I/O -- reading .DAT files from `handbook/datasets/`, generating .ipynb JSON, compressing everything. While individual ZIPs are small (the largest dataset DZIUBA1.DAT is only 21KB), pipeline overhead adds up if not managed.

**Prevention:**
- Use the existing content-hash caching pattern (already proven for OG images) to skip ZIP regeneration when source data has not changed
- Alternative (recommended): pre-generate ZIPs in a prebuild script -- the `prebuild` pattern already exists in `package.json` (`"prebuild": "node scripts/download-actionlint-wasm.mjs"`)
- Total ZIP payload is tiny: all 10 datasets total ~58KB, plus ~10 notebooks at ~15-25KB each. Compressed ZIPs likely under 100KB total
- Generate to `public/downloads/eda/` so Astro copies them to `dist/` automatically

**Detection:** Compare `astro build` time before and after. Acceptable threshold: < 5 seconds added.

---

### Pitfall 7: Generated Notebooks Drift from Website Case Study Content

**What goes wrong:** The notebook analysis produces different numbers, uses different plot styles, or follows a different analysis sequence than what the case study page shows. Users see one thing on the website and get something different in the notebook.

**Why it happens:** The website case studies use TypeScript SVG generators with hardcoded NIST parameters (from `src/data/eda/datasets.ts`) and custom hypothesis test implementations (runs test, Bartlett, Levene, Anderson-Darling, Grubbs, PPCC, location test -- all validated against NIST in v1.9). The notebooks will use Python (NumPy, SciPy, matplotlib) which may compute slightly different values due to floating-point differences, different default parameters in statistical functions, or different binning algorithms.

**Consequences:**
- Users lose trust in either the website or the notebook
- Statistical test results may disagree at the margins (e.g., p-values that round differently)
- Hardcoded NIST regression parameters on the website vs SciPy's optimizer may give different decimal places

**Prevention:**
- For each case study, verify that notebook output matches the website's verified NIST values (already validated in v1.9)
- Use the same rounding conventions as the website (typically 4-6 significant digits)
- For hardcoded parameters (e.g., Beam Deflections sinusoidal model), include a comment explaining the NIST reference values
- Do NOT try to match SVG plot aesthetics -- use a clean matplotlib/seaborn style. The notebook is the "Python implementation" of the same analysis.
- Add interpretation markdown cells that match the website's conclusions

**Detection:** Review notebook output cell-by-cell against the corresponding website case study page. All statistical values should agree to published precision.

---

### Pitfall 8: Relative File Paths Break When Users Move Notebooks

**What goes wrong:** The notebook loads data with `pd.read_csv('RANDN.DAT')` which works when the notebook and data file are in the same directory. But users commonly move the .ipynb to a different folder while leaving the .DAT file in the download folder.

**Why it happens:** ZIP files extract to a flat structure or a named directory depending on creation. Users may move just the notebook, or extract to a different location, or their Jupyter working directory may differ from the extraction path. Google Colab users must upload the data file separately (different workflow entirely).

**Consequences:**
- `FileNotFoundError: [Errno 2] No such file or directory: 'RANDN.DAT'`
- Users who extract to their home directory and open Jupyter from a different path get path errors
- Colab requires separate data upload step

**Prevention:**
- Bundle notebook and data inside a subdirectory within the ZIP: `normal-random-numbers/notebook.ipynb` + `normal-random-numbers/RANDN.DAT` -- this forces extraction into a single folder, keeping files together
- Add a helpful error message in the data loading cell:
  ```python
  import os
  data_file = 'RANDN.DAT'
  if not os.path.exists(data_file):
      print(f"ERROR: '{data_file}' not found in current directory: {os.getcwd()}")
      print(f"Please ensure '{data_file}' is in the same folder as this notebook.")
  ```
- For Colab compatibility, add a conditional upload cell:
  ```python
  try:
      from google.colab import files
      uploaded = files.upload()  # User selects the .DAT file
  except ImportError:
      pass  # Not running in Colab
  ```

**Detection:** Test the notebook from a different working directory than the extraction path.

---

### Pitfall 9: Astro Build Integration Approach -- Hook vs Script vs Public Directory

**What goes wrong:** Choosing the wrong integration point for notebook/ZIP generation leads to files not appearing in the build output, race conditions with other integrations, or unnecessary complexity.

**Why it happens:** There are three viable approaches:
1. **`public/` directory** -- pre-generate ZIPs and commit them to `public/downloads/eda/`. Simplest. Copied as-is to `dist/`. But binary files bloat git history.
2. **`prebuild` script** -- add to `package.json` prebuild. Already a pattern in this project (`download-actionlint-wasm.mjs`). Generates to `public/downloads/eda/` before Astro sees it.
3. **Astro integration hook** -- generate ZIPs in `astro:build:done` or `astro:build:generated`. Most "Astro-native" but adds complexity. The existing `indexnow.ts` integration already uses `astro:build:done`.

**Consequences of wrong choice:**
- Option 1: ZIPs must be regenerated manually and committed to git when notebooks change
- Option 3: Files generated in `astro:build:done` may miss the deploy artifact packaging depending on when Astro finalizes the output directory
- Option 2: Cleanest separation but requires ensuring the script runs before dev server too

**Prevention:**
- Use **Option 2 (prebuild script)** -- it matches the existing `download-actionlint-wasm.mjs` pattern, runs before Astro build, and outputs to `public/downloads/eda/` where Astro copies it to `dist/` automatically
- This avoids committing binary ZIPs to git (generated fresh each build from source data and notebook templates)
- Add to prebuild chain: `"prebuild": "node scripts/download-actionlint-wasm.mjs && node scripts/generate-notebooks.mjs"`
- Add `public/downloads/` to `.gitignore` since these are generated artifacts

**Detection:** Verify `dist/downloads/eda/*.zip` exists after `astro build`. Verify ZIPs are accessible in `astro dev`.

---

### Pitfall 10: MIME Type / Content-Type Issues for ZIP Downloads from GitHub Pages

**What goes wrong:** Users click the download button but the browser tries to display the .zip file as text instead of downloading it, or the file arrives with wrong headers.

**Why it happens:** The existing CSV downloads in `CaseStudyDataset.astro` use `data:` URIs (`data:text/csv;charset=utf-8,...`). This works for small text files but is completely wrong for ZIP files -- binary data encoded as base64 data URIs would be enormous and unreliable. GitHub Pages (served via Fastly CDN) should serve `.zip` files with correct `application/zip` MIME type, but this must be verified rather than assumed.

**Prevention:**
- Serve ZIP files as static assets from `public/downloads/eda/` (NOT as `data:` URIs)
- Use `<a href="/downloads/eda/normal-random-numbers.zip" download="normal-random-numbers.zip">` with the `download` attribute
- Verify Content-Type header after deployment: `curl -I https://patrykgolabek.dev/downloads/eda/normal-random-numbers.zip`
- Keep the existing CSV `data:` URI pattern for inline CSV downloads (those are small text)

**Detection:** After deployment, verify `content-type: application/zip` header. Test actual download in Chrome, Firefox, and Safari.

---

## Minor Pitfalls

### Pitfall 11: Google Colab "Open in Colab" Links Require GitHub Raw URLs

**What goes wrong:** Adding an "Open in Colab" button that links to the GitHub Pages URL (`https://patrykgolabek.dev/downloads/eda/notebook.ipynb`) does not work because Colab's URL rewriting only works for GitHub **repository** paths (`colab.research.google.com/github/USER/REPO/blob/BRANCH/path/to/notebook.ipynb`), not GitHub Pages static file URLs.

**Prevention:**
- Option A: Commit the raw .ipynb files (not ZIPs) to a `notebooks/eda/` directory in the repo. Colab links point to repo. Download ZIPs point to built site. This is the cleanest approach.
- Option B: Skip Colab integration entirely -- focus on download-and-run workflow
- Option C: Use Colab's file upload flow -- user downloads ZIP, extracts, uploads to Colab manually
- Recommendation: Option A. Commit 10 .ipynb files to repo (they are tiny -- ~15-25KB each). Colab "Open in Colab" links use `colab.research.google.com/github/PatrykQuantumNomad/PatrykQuantumNomad/blob/main/notebooks/eda/normal-random-numbers.ipynb`. The Colab user still needs to upload the .DAT file separately (add an upload cell).

**Detection:** Click every "Open in Colab" link and verify the notebook loads.

**Sources:**
- [Google Colab GitHub integration](https://github.com/googlecolab/open_in_colab)

---

### Pitfall 12: Notebook Markdown Cells Render Differently Across Environments

**What goes wrong:** Markdown cells that look good in JupyterLab may render differently in VS Code (which uses its own Markdown renderer) or Colab (which has limited Markdown support). LaTeX math in markdown cells is particularly fragile.

**Prevention:**
- Use standard Markdown only (no HTML, no custom CSS)
- LaTeX math works in all three environments: use `$inline$` and `$$block$$` syntax
- Avoid complex table formatting in markdown cells -- keep tables simple
- Do NOT use raw HTML in markdown cells -- Colab strips it
- Test representative markdown cells in all three target environments

**Detection:** Visual review of every markdown cell in JupyterLab, VS Code, and Colab.

---

### Pitfall 13: Matplotlib Backend Issues in Headless Environments

**What goes wrong:** Notebooks that use `plt.show()` may fail or produce no output if the matplotlib backend is not set correctly. Some environments require `%matplotlib inline` magic, others handle it automatically.

**Prevention:**
- Always include `%matplotlib inline` in the first code cell (before any plotting)
- This is harmless in environments that do not need it and essential in those that do
- Use `plt.figure()` and `plt.show()` consistently
- Set a consistent style at the top: `plt.style.use('seaborn-v0_8-whitegrid')` or similar

**Detection:** Run notebooks in JupyterLab (not just Colab) and verify all plots render inline.

---

### Pitfall 14: Version Pinning in requirements.txt Creates Future Incompatibilities

**What goes wrong:** Pinning exact versions (e.g., `numpy==1.26.4`) causes `pip install` failures when users have a newer Python that drops support for that numpy version, or when the pinned version has no wheel for their platform (especially Apple Silicon).

**Prevention:**
- Use minimum version pins with `>=` instead of `==`: `numpy>=1.24`, `scipy>=1.10`, `pandas>=2.0`, `matplotlib>=3.7`, `seaborn>=0.12`
- Do NOT pin jupyter, ipykernel, or notebook -- those are the user's environment
- Test with both the minimum pinned versions AND the latest versions
- Add a Python version note: "Requires Python 3.9 or later"

**Detection:** Test `pip install -r requirements.txt` in both Python 3.9 and 3.12+ environments.

---

### Pitfall 15: GitHub Pages Site Size Trajectory

**What goes wrong:** Not an immediate blocker (adding ~200KB of ZIPs to a 170MB dist/), but the repository is already 1.1GB (primarily due to the full NIST handbook copy in `handbook/`). GitHub Pages has a hard published site limit of 1GB and a recommended repository limit of 1GB. Git LFS cannot be used with GitHub Pages.

**Prevention:**
- The ZIPs for this milestone are tiny: ~58KB total datasets + ~150KB notebooks = well under 500KB total
- Monitor `dist/` size as part of build output
- The `handbook/` directory (the NIST source data) is NOT deployed -- only `public/` and generated content go to `dist/`
- If committing .ipynb files to repo for Colab links (Pitfall 11), that adds ~150-250KB -- negligible
- Add `du -sh dist/` to build output for monitoring

**Detection:** Alert if `dist/` approaches 500MB.

**Sources:**
- [GitHub Pages limits](https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits)

---

### Pitfall 16: Dataset Attribution and Source Credibility

**What goes wrong:** Bundling NIST .DAT files in downloadable ZIPs without proper attribution undermines the educational credibility of the notebooks and may confuse users about data provenance.

**Prevention:**
- NIST data is public domain (produced by US government employees) -- no copyright issue
- Include a markdown cell in each notebook crediting the NIST/SEMATECH e-Handbook as the source
- Include the NIST URL for each dataset
- Reference the specific handbook section (e.g., "Section 1.4.2.1")
- Mirror the attribution pattern already used in the `CaseStudyDataset.astro` component and `DATASET_SOURCES` in `datasets.ts`

**Detection:** Review each notebook for proper NIST attribution and source URLs.

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| Notebook template/generator | Pitfall 1 (format version), Pitfall 2 (invalid JSON) | Define TypeScript interfaces for nbformat 4.5; validate output against schema; generate deterministic cell IDs |
| Dataset bundling | Pitfall 4 (inconsistent .DAT formats) | Per-dataset loading code with explicit skiprows/names/sep; normalize line endings to LF; assert row counts |
| ZIP generation pipeline | Pitfall 3 (encoding corruption), Pitfall 9 (integration approach) | Use archiver with explicit encoding; prebuild script pattern matching existing `download-actionlint-wasm.mjs` |
| Download UI on case study pages | Pitfall 10 (MIME type) | Static file serving from `public/downloads/eda/`, not data: URIs; use download attribute on links |
| User experience (running notebooks) | Pitfall 5 (missing dependencies), Pitfall 8 (file paths) | Requirements cell at top; helpful error messages for missing files; requirements.txt in ZIP |
| Content parity | Pitfall 7 (drift from website) | Cross-reference all statistical values with NIST-verified website values from v1.9 |
| Build integration | Pitfall 6 (build time), Pitfall 9 (hook vs script) | Prebuild script to `public/downloads/eda/`; add to `.gitignore` |
| Google Colab integration | Pitfall 11 (Colab URL scheme) | Commit .ipynb files to `notebooks/eda/` in repo for `colab.research.google.com/github/` links |
| Notebooks landing page | Pitfall 15 (site size) | Monitor dist/ size; ZIPs are tiny so no concern for this milestone |
| Testing/validation | Pitfall 1 (format version), Pitfall 13 (matplotlib backend) | Test in JupyterLab, VS Code, Colab; run nbformat.validate(); include %matplotlib inline |

## Integration Gotchas Specific to This Project

| Integration Point | Common Mistake | Correct Approach |
|-------------------|----------------|------------------|
| `CaseStudyDataset.astro` | Adding download button in the existing CSV download section using data: URI for ZIP | Add a separate "Download Notebook" button that links to static file at `/downloads/eda/[slug].zip` |
| `src/data/eda/datasets.ts` | Trying to reuse the TypeScript dataset arrays in notebook generation | Read original .DAT files from `handbook/datasets/` for the ZIP; the TypeScript arrays are for SVG rendering only |
| `public/downloads/eda/` | Committing generated ZIPs to git | Add to `.gitignore`; generate via prebuild script |
| `package.json` prebuild | Only running notebook generation in `prebuild`, not accessible during dev | Add a standalone script too: `"generate-notebooks": "node scripts/generate-notebooks.mjs"` |
| Case study MDX pages | Adding notebook download link in MDX content (fragile, scattered) | Add download button via the existing `CaseStudyDataset.astro` component (centralized, already on every case study page) |
| CASE_STUDY_MAP in CaseStudyDataset.astro | Assuming all case studies have the same data shape | 9 are single-column, 1 (ceramic-strength) is multi-column. Notebook generation must handle both shapes. |
| Line endings in .DAT files | Copying .DAT files directly to ZIP without normalization | Normalize to LF when writing to ZIP. 4 files use CRLF, others use LF. |

## "Looks Done But Isn't" Checklist

- [ ] All 10 ZIP files exist in `dist/downloads/eda/` after build
- [ ] Every ZIP extracts correctly on macOS, Linux, and Windows
- [ ] Every .ipynb inside passes `nbformat.validate()` from Python CLI
- [ ] Every notebook opens without errors in JupyterLab
- [ ] Every notebook opens without errors in VS Code with Jupyter extension
- [ ] Every notebook opens without warnings in Google Colab
- [ ] Every notebook runs top-to-bottom in a clean Python environment (only jupyter pre-installed)
- [ ] Every data loading cell successfully loads the bundled .DAT file
- [ ] Every data loading cell asserts correct row count
- [ ] All statistical values in notebooks match website case study values
- [ ] All plots render inline (not just in Colab which auto-handles this)
- [ ] Download buttons appear on all 10 case study pages
- [ ] Download links work on the deployed site (not just localhost)
- [ ] Content-Type header for .zip files is `application/zip`
- [ ] requirements.txt is included in every ZIP
- [ ] Notebooks landing page at `/eda/notebooks/` exists and links work
- [ ] NIST attribution appears in every notebook
- [ ] `%matplotlib inline` appears in every notebook before plotting cells
- [ ] Build time regression is under 5 seconds compared to baseline
- [ ] `public/downloads/` is in `.gitignore`

## Sources

### Primary (HIGH confidence -- direct project analysis + official docs)
- `handbook/datasets/*.DAT` -- direct `file` command inspection confirming mixed CRLF/LF line endings across dataset files
- `src/data/eda/datasets.ts` -- TypeScript dataset arrays with row counts for all 10 case studies (62,000+ tokens of inline data)
- `src/components/eda/CaseStudyDataset.astro` -- existing CSV download pattern using data: URIs, CASE_STUDY_MAP structure
- `package.json` -- existing prebuild pattern (`download-actionlint-wasm.mjs`), no archiver/jszip dependency yet
- `astro.config.mjs` -- static output mode, GitHub Pages deployment configuration
- `.github/workflows/deploy.yml` -- withastro/action@v3 build, no custom caching for generated assets
- [nbformat 4.5 format specification](https://nbformat.readthedocs.io/en/latest/format_description.html) -- required fields, cell ID format, metadata structure
- [Cell ID JEP 62](https://jupyter.org/enhancement-proposals/62-cell-id/cell-id.html) -- cell ID required for format 4.5+, pattern `^[a-zA-Z0-9-_]+$`, 1-64 chars
- [GitHub Pages limits](https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits) -- 1GB published site limit, 100GB bandwidth, 10-minute deploy timeout

### Secondary (MEDIUM-HIGH confidence -- verified library documentation)
- [JSZip documentation and limitations](https://stuk.github.io/jszip/documentation/limitations.html) -- UTF-8 only, binary handling requirements
- [JSZip encoding issue #368](https://github.com/Stuk/jszip/issues/368) -- UTF-8 encoding not preserved after zip generation
- [Archiver string stream issue #375](https://github.com/archiverjs/node-archiver/issues/375) -- invalid ZIP from string-based streams
- [Astro Integration API](https://docs.astro.build/en/reference/integrations-reference/) -- astro:build:done hook, static asset handling
- [Google Colab GitHub integration](https://github.com/googlecolab/open_in_colab) -- URL pattern for opening notebooks from GitHub repos

### Tertiary (MEDIUM confidence -- community best practices)
- [Installing Python packages from Jupyter](https://jakevdp.github.io/blog/2017/12/05/installing-python-packages-from-jupyter/) -- kernel/pip mismatch explanation
- [Jupyter notebook reproducibility](https://blog.reviewnb.com/jupyter-notebook-reproducibility-managing-dependencies-data-secrets/) -- dependency management best practices
- [nbformat MissingIDFieldWarning #335](https://github.com/jupyter/nbformat/issues/335) -- warning behavior for missing cell IDs

---
*Pitfalls research for: Adding downloadable Jupyter Notebooks for 10 EDA case studies to patrykgolabek.dev (1090+ page Astro 5 site on GitHub Pages)*
*Researched: 2026-03-14*
