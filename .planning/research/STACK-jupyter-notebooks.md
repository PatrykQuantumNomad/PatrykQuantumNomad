# Technology Stack: Jupyter Notebook Case Study Downloads

**Project:** patrykgolabek.dev EDA Case Study Notebooks
**Researched:** 2026-03-14
**Scope:** NEW dependencies only -- Astro 5, Tailwind, TypeScript, MDX, D3, Vitest, etc. are already validated and excluded from this research.

## Recommended Stack Additions

### Notebook Generation (Build-Time, Node.js)

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| None (hand-rolled) | N/A | Programmatic `.ipynb` generation | The ipynb format is plain JSON conforming to nbformat v4.5. No npm library is needed -- a ~150-line TypeScript module can construct valid notebooks by emitting the correct JSON structure. Using a library would add a dependency for what is fundamentally `JSON.stringify()` with a schema. |

**Rationale:** The Jupyter notebook format (nbformat v4.5) is a well-documented JSON schema. A notebook is a dictionary with four top-level keys: `metadata`, `nbformat` (4), `nbformat_minor` (5), and `cells` (array). Each cell has `cell_type`, `id`, `metadata`, and `source`. Code cells add `execution_count` (null for unexecuted) and `outputs` (empty array). This is trivially constructable in TypeScript without any runtime dependency.

**Confidence:** HIGH -- verified against [nbformat v4.5 schema](https://github.com/jupyter/nbformat/blob/main/nbformat/v4/nbformat.v4.5.schema.json) and [official documentation](https://nbformat.readthedocs.io/en/latest/format_description.html).

### Zip Archive Creation (Build-Time, Node.js)

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| archiver | ^7.0.1 | Create .zip files containing .ipynb + .dat files | Most downloaded zip-creation library (14.6M weekly downloads), stream-oriented, low memory usage. Mature and stable (current version for 2+ years). Works in ESM projects via default import. |
| @types/archiver | ^7.0.0 | TypeScript type definitions | Project uses TypeScript strict mode; types required for DX. Updated Oct 2025. |

**Alternatives Considered:**

| Library | Weekly Downloads | Why Not |
|---------|-----------------|---------|
| jszip | 13.5M | Designed for browser + Node dual use. Main package (3.10.1) not updated in 4 years. ESM fork (@node-projects/jszip) exists but is a third-party fork. Overkill for server-side-only zip creation. |
| yazl | 1.6M | Minimalist and fast, but smaller community, fewer types, and less documentation. |
| adm-zip | ~3M | Synchronous API (loads entire archive into memory). Fine for small files but archiver's streaming approach is the better pattern. |
| Node.js zlib (built-in) | N/A | Only handles gzip/deflate compression, not the ZIP archive container format. Cannot create .zip files. |

**Confidence:** HIGH -- archiver downloads and API verified via [npm trends](https://npmtrends.com/archiver-vs-jszip-vs-node-stream-zip-vs-yauzl-vs-yazl-vs-zip-js) and [npm registry](https://www.npmjs.com/package/archiver).

### Python Scientific Stack (Inside Generated Notebooks)

These are NOT Node.js dependencies. They are declared as pip requirements inside the generated notebooks and in a bundled `requirements.txt`.

| Library | Pin Strategy | Purpose | Why This Version |
|---------|-------------|---------|-----------------|
| numpy | >=1.26,<3 | Numerical arrays, statistics | Floor at 1.26 (last v1 with broad compat). Allow v2.x (current: 2.4.3). Upper bound <3 prevents future breaking changes. |
| scipy | >=1.11 | Statistical tests, distributions | 1.11+ supports Python 3.11+. Current: 1.17.1. No upper cap needed -- SciPy maintains strong backward compat. |
| pandas | >=2.0,<4 | DataFrame operations, CSV/DAT loading | 2.0+ for Copy-on-Write and modern API. Current: 3.0.1 (released Jan 2026). Upper bound <4 for safety. |
| matplotlib | >=3.7 | Plotting (histograms, scatter, time series) | 3.7+ for modern style defaults. Current: 3.10.8. |
| seaborn | >=0.12 | Statistical visualization (KDE, box plots) | 0.12+ for objects interface. Current: 0.13.2. |

**Pin philosophy:** Use >= floor versions (not ==) because notebooks are educational -- users should be able to run them with whatever recent Python environment they have. Pinning exact versions would cause unnecessary friction. The floor versions ensure API compatibility with the code patterns used in the notebooks.

**Confidence:** HIGH -- versions verified against PyPI ([numpy](https://pypi.org/project/numpy/), [scipy](https://pypi.org/project/SciPy/), [pandas](https://pypi.org/project/pandas/), [matplotlib](https://pypi.org/project/matplotlib/), [seaborn](https://pypi.org/project/seaborn/)).

### Static File Serving (Astro Integration)

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Custom Astro integration | N/A | Generate zip files at build time, write to output directory | The project already has a custom integration pattern (`src/integrations/indexnow.ts`). A new `notebook-generator` integration using the `astro:build:done` hook writes zip files directly to `dist/downloads/notebooks/`. |

**Why NOT use `public/` directory:**

The `public/` directory approach (pre-generating zips and checking them into the repo) would work but is inferior because:
1. Binary .zip files in git bloat the repository
2. Zips must be manually regenerated when notebook content changes
3. The build process already has all the data needed (datasets in `src/data/eda/datasets.ts`, case study metadata in MDX frontmatter)

**Why an Astro integration instead of a prebuild script:**

The project already uses `prebuild` in package.json for WASM downloads. A second prebuild script could work, but an Astro integration is better because:
1. It has access to the `dir` (output directory) parameter -- no need to hardcode `dist/`
2. It follows the existing pattern (indexnow integration)
3. It runs as part of the build pipeline, not before it
4. It can access Astro's logger for consistent build output

**Confidence:** HIGH -- verified against [Astro Integration API docs](https://docs.astro.build/en/reference/integrations-reference/) and confirmed the existing `indexnow.ts` integration as a working pattern in this codebase.

## What NOT to Add

| Technology | Why Skip |
|------------|----------|
| nbformat (Python package) | We are generating notebooks in Node.js at build time, not in Python. The ipynb JSON format is simple enough to construct directly. |
| nbconvert | Only needed to convert notebooks to HTML/PDF. We are creating notebooks, not converting them. |
| Any npm notebook library (notebookjs, tslab, etc.) | These are for rendering or running notebooks in JS, not for generating .ipynb files. |
| jupyterlab / jupyter-core | Server-side notebook execution tools. Users run the notebooks locally -- the build process just generates the JSON. |
| Python runtime in CI | The build generates .ipynb JSON files (which are just structured JSON). No Python execution is needed at build time. |
| ADM-Zip or yauzl | yauzl is for reading zips (not creating). adm-zip uses synchronous in-memory approach -- archiver's streaming is more appropriate. |
| @progress/jszip-esm | Browser-focused ESM fork of jszip. Documentation explicitly says "should not be used in NodeJS". |

## Installation

```bash
# New production dependency (zip creation at build time)
npm install archiver

# New dev dependency (TypeScript types)
npm install -D @types/archiver
```

**Total new npm dependencies: 2** (archiver + its types). Everything else is either hand-rolled TypeScript (notebook generation) or Python packages declared inside the notebooks themselves.

## Integration Architecture

### Build-Time Flow

```
astro build
  --> astro:build:done hook fires
  --> notebook-generator integration runs:
      1. For each of 10 case studies:
         a. Read dataset from src/data/eda/datasets.ts (already in memory)
         b. Read .DAT file from handbook/datasets/
         c. Generate .ipynb JSON (nbformat v4.5)
         d. Generate requirements.txt
         e. Create .zip using archiver (ipynb + dat + requirements.txt)
         f. Write .zip to dist/downloads/notebooks/{slug}.zip
      2. Log summary: "Generated 10 notebook archives"
```

### Notebook JSON Structure (nbformat v4.5)

```typescript
interface NotebookV4 {
  metadata: {
    kernelspec: {
      display_name: string;  // "Python 3"
      language: string;      // "python"
      name: string;          // "python3"
    };
    language_info: {
      name: string;          // "python"
      version: string;       // "3.11.0"
    };
  };
  nbformat: 4;
  nbformat_minor: 5;
  cells: NotebookCell[];
}

interface NotebookCell {
  cell_type: 'code' | 'markdown' | 'raw';
  id: string;              // unique, 1-64 chars, [a-zA-Z0-9_-]
  metadata: Record<string, unknown>;
  source: string[];         // lines of content (joined without separator)
  execution_count?: number | null;  // code cells only
  outputs?: OutputEntry[];           // code cells only
}
```

### Case Study to Dataset Mapping (from existing codebase)

| Case Study Slug | .DAT File | Observations |
|----------------|-----------|-------------|
| normal-random-numbers | RANDN.DAT | 500 |
| uniform-random-numbers | RANDU.DAT | 500 |
| random-walk | RANDWALK.DAT | 500 |
| cryothermometry | SOULEN.DAT | 700 |
| beam-deflections | LEW.DAT | 200 |
| filter-transmittance | MAVRO.DAT | 50 |
| heat-flow-meter | ZARR13.DAT | 195 |
| fatigue-life | BIRNSAUN.DAT | 101 |
| ceramic-strength | JAHANMI2.DAT | 480 |
| standard-resistor | DZIUBA1.DAT | 1,000 |

### Download URL Pattern

```
https://patrykgolabek.dev/downloads/notebooks/{slug}.zip
```

Each zip contains:
```
{slug}/
  {slug}.ipynb          -- Jupyter notebook
  {DATASET_NAME}.DAT    -- NIST dataset file
  requirements.txt      -- Python dependencies
```

## Existing Codebase Integration Points

| Existing Code | How It Connects |
|--------------|----------------|
| `src/data/eda/datasets.ts` | Source of truth for dataset arrays and DATASET_SOURCES metadata (names, URLs, descriptions). The notebook generator imports this. |
| `src/components/eda/CaseStudyDataset.astro` | Contains CASE_STUDY_MAP (slug to dataset key mapping). The notebook generator needs an equivalent mapping. Consider extracting to a shared module. |
| `handbook/datasets/*.DAT` | Raw NIST data files. Copied into zip archives alongside notebooks. |
| `src/integrations/indexnow.ts` | Pattern reference for `astro:build:done` hook integration. |
| `astro.config.mjs` | Register new integration: `notebookGenerator()` in the integrations array. |

## Sources

- [nbformat v4.5 specification](https://nbformat.readthedocs.io/en/latest/format_description.html) -- HIGH confidence
- [nbformat v4.5 JSON schema](https://github.com/jupyter/nbformat/blob/main/nbformat/v4/nbformat.v4.5.schema.json) -- HIGH confidence
- [Astro Integration API](https://docs.astro.build/en/reference/integrations-reference/) -- HIGH confidence
- [archiver npm package](https://www.npmjs.com/package/archiver) -- HIGH confidence
- [npm trends: archiver vs jszip vs yazl](https://npmtrends.com/archiver-vs-jszip-vs-node-stream-zip-vs-yauzl-vs-yazl-vs-zip-js) -- HIGH confidence
- [NumPy releases](https://numpy.org/doc/stable/release.html) -- HIGH confidence
- [pandas 3.0.0 release notes](https://pandas.pydata.org/docs/dev/whatsnew/v3.0.0.html) -- HIGH confidence
- [SciPy releases](https://docs.scipy.org/doc/scipy/release.html) -- HIGH confidence
- [matplotlib releases](https://matplotlib.org/stable/users/release_notes.html) -- HIGH confidence
- [seaborn on PyPI](https://pypi.org/project/seaborn/) -- HIGH confidence

---

*Stack research: 2026-03-14*
