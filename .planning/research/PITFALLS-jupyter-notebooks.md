# Domain Pitfalls: Jupyter Notebook Case Study Downloads

**Domain:** Build-time Jupyter notebook generation and packaging
**Researched:** 2026-03-14

## Critical Pitfalls

Mistakes that cause broken notebooks or user-facing failures.

### Pitfall 1: Invalid nbformat Produces Silent Failures

**What goes wrong:** A generated .ipynb file opens in JupyterLab but cells are missing, metadata is wrong, or the notebook appears blank. JupyterLab does not always show clear error messages for schema violations.
**Why it happens:** Missing required fields (especially `id` in v4.5), wrong `nbformat_minor` version, `source` as a string instead of string array, `execution_count` missing from code cells.
**Consequences:** Users download the notebook, open it, and see nothing. They assume the product is broken. No error message tells them what went wrong.
**Prevention:**
1. Define a TypeScript interface that matches the nbformat v4.5 schema exactly
2. Always set `nbformat: 4`, `nbformat_minor: 5`
3. Every cell must have a unique `id` (1-64 chars, alphanumeric + `-` + `_`)
4. Code cells must have `execution_count: null` and `outputs: []`
5. `source` must be an array of strings (lines), NOT a single string
6. Add a build-time validation step that checks the generated JSON against the schema before writing
**Detection:** Open every generated .ipynb in JupyterLab during development. Check that all cells render. Check the JupyterLab console for validation warnings.

### Pitfall 2: .DAT File Parsing Code Fails for Users

**What goes wrong:** The notebook's `pd.read_csv()` call fails because the .DAT file format doesn't match the assumed delimiter, header structure, or encoding.
**Why it happens:** NIST .DAT files are NOT standard CSV. They use fixed-width format, have header rows with metadata, or use whitespace delimiters. Each .DAT file has a different structure. A generic `pd.read_csv()` call won't work.
**Consequences:** The first code cell users run throws an error. First impressions are ruined.
**Prevention:**
1. Test the data-loading code for every single .DAT file -- there are only 10, so manual verification is feasible
2. Use `pd.read_csv(filename, delim_whitespace=True, skiprows=N)` with file-specific parameters
3. For complex files like JAHANMI2.DAT (ceramic strength), provide explicit column names and skip lines
4. Include a "Data Preview" code cell after loading that shows `df.head()` so users can verify the load worked
**Detection:** Actually run the generated notebook's data-loading cells in a real Python environment during development.

### Pitfall 3: Relative Path Breaks Depending on How User Opens the Zip

**What goes wrong:** The notebook references `data.DAT` but the user extracts the zip to a different location, or opens the .ipynb without extracting, or their working directory is different.
**Why it happens:** Jupyter sets the working directory to where the .ipynb file is located. If the .DAT file is in the same directory as the .ipynb (flat structure inside the zip), it works. But if the user moves just the .ipynb without the .DAT, it breaks.
**Consequences:** `FileNotFoundError` when running the data-loading cell.
**Prevention:**
1. Use a FLAT structure inside the zip (all files in one directory): `slug/slug.ipynb` + `slug/FILE.DAT`
2. In the notebook, reference the .DAT file with a simple relative path: `'FILE.DAT'` (not `'./data/FILE.DAT'`)
3. Add a markdown cell explaining: "Ensure the .DAT file is in the same directory as this notebook"
4. Add a defensive check in the data-loading cell:

```python
import os
dat_file = 'RANDN.DAT'
if not os.path.exists(dat_file):
    raise FileNotFoundError(
        f"'{dat_file}' not found. Ensure you extracted the full zip archive "
        f"and are running this notebook from the extracted directory."
    )
```

**Detection:** Test the download-extract-open workflow end-to-end.

## Moderate Pitfalls

### Pitfall 4: Archiver Output Corruption with Async Races

**What goes wrong:** Zip files are corrupted or truncated because the archive.finalize() promise resolves before the write stream is fully flushed.
**Prevention:**
1. Always await the `output.on('close')` event, not the `archive.finalize()` call
2. Use the Promise wrapper pattern (see Architecture):

```typescript
return new Promise((resolve, reject) => {
  output.on('close', resolve);
  archive.on('error', reject);
  // ... add files ...
  archive.finalize();
});
```

3. Do NOT run multiple archiver instances concurrently for the same output directory without proper file locking (sequential generation is fine for 10 files)

### Pitfall 5: Notebook Source Lines Must Not Include Trailing Newlines

**What goes wrong:** Each line in the `source` array gets double-newlined, producing notebooks with excessive blank lines.
**Why it happens:** The nbformat spec says `source` is "a list of strings which should be joined without a separator to reconstitute the source." If each string already ends with `\n`, joining them produces the correct result. But if you split on `\n` and each element does NOT end with `\n`, JupyterLab will join them without newlines, collapsing all code into one line.
**Prevention:** When constructing source arrays, each line EXCEPT the last must end with `\n`:

```typescript
function toSourceLines(code: string): string[] {
  const lines = code.split('\n');
  return lines.map((line, i) =>
    i < lines.length - 1 ? line + '\n' : line
  );
}
```

This matches the nbformat convention where source elements are joined without separator.

### Pitfall 6: Build Integration Runs Before Output Directory Exists

**What goes wrong:** The `astro:build:done` hook tries to write to `dist/downloads/notebooks/` but the subdirectory doesn't exist yet.
**Prevention:** Use `mkdirSync(outPath, { recursive: true })` before writing any zip files. The `dir` parameter from Astro points to the root `dist/` directory -- subdirectories must be created explicitly.

### Pitfall 7: GitHub Pages 404 for Download URLs

**What goes wrong:** The download link `https://patrykgolabek.dev/downloads/notebooks/slug.zip` returns 404 because GitHub Pages doesn't serve the file.
**Why it happens:** GitHub Pages serves everything in the `dist/` directory. If the zip files are written to the correct output directory during `astro:build:done`, they should be served. But if `trailingSlash: 'always'` is configured (which it is in this project), there might be path resolution issues for non-HTML files.
**Prevention:**
1. Write zip files to `{dir}/downloads/notebooks/{slug}.zip` (using the `dir` from the hook)
2. Test the download URL after deployment
3. Verify that `.zip` files are served with the correct `Content-Type` (application/zip) -- GitHub Pages handles this automatically based on extension
4. The download link should be a direct `<a href="/downloads/notebooks/{slug}.zip" download>` -- no trailing slash

### Pitfall 8: Python Version Assumptions in Notebooks

**What goes wrong:** Users with older Python (3.8, 3.9) can't run the notebooks because pandas 3.0 requires Python 3.11+.
**Prevention:**
1. Set requirements.txt floors that are broadly compatible: `pandas>=2.0,<4` (not `pandas>=3.0`)
2. This allows users with Python 3.9+ to install pandas 2.x, which works fine
3. Add a markdown cell noting recommended Python version: "Python 3.10 or later recommended"
4. The `language_info.version` in notebook metadata should be `3.11.0` (aspirational, not restrictive)

## Minor Pitfalls

### Pitfall 9: Large Zip Files Due to Uncompressed .DAT

**What goes wrong:** Zip files are larger than necessary because .DAT text files compress well but aren't being compressed.
**Prevention:** Use `archiver('zip', { zlib: { level: 9 } })` for maximum compression. NIST .DAT files are text and compress ~70-80%. For reference, JAHANMI2.DAT (largest file, 480 observations x 15 columns) is ~50KB uncompressed and ~12KB compressed.

### Pitfall 10: Cell ID Collisions

**What goes wrong:** Two cells in the same notebook have the same `id`, causing JupyterLab to silently ignore or merge cells.
**Prevention:** Use a sequential counter per notebook with the slug as prefix: `ceramic-001`, `ceramic-002`, etc. Reset counter for each new notebook.

### Pitfall 11: Missing NIST Attribution

**What goes wrong:** Notebooks lack proper attribution to NIST/SEMATECH, which is the data source.
**Prevention:** Include a markdown cell at the top with proper attribution and a link to the NIST source URL. This is already tracked in DATASET_SOURCES[key].nistUrl.

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| Notebook JSON generation | Invalid nbformat (Pitfall 1) | TypeScript types matching v4.5 schema, build-time validation |
| .DAT file parsing code | File-specific format quirks (Pitfall 2) | Test every .DAT file's loading code manually in Python |
| Zip packaging | Stream finalization race (Pitfall 4) | Promise wrapper with close event |
| Download button UI | 404 on GitHub Pages (Pitfall 7) | Verify after first deployment |
| Python compatibility | Version floor mismatch (Pitfall 8) | Use `>=2.0` not `>=3.0` for pandas |
| Source array format | Line ending convention (Pitfall 5) | Append `\n` to all lines except last |

## Sources

- [nbformat v4.5 specification](https://nbformat.readthedocs.io/en/latest/format_description.html) -- cell ID requirements, source format
- [archiver documentation](https://www.archiverjs.com/) -- finalize/close event handling
- [Astro Integration API](https://docs.astro.build/en/reference/integrations-reference/) -- dir parameter behavior
- [pandas 3.0.0 release notes](https://pandas.pydata.org/docs/dev/whatsnew/v3.0.0.html) -- Python 3.11+ requirement
- NIST .DAT files in `handbook/datasets/` -- verified file format variability

---

*Pitfalls research: 2026-03-14*
