# Architecture Patterns: Jupyter Notebook Downloads for EDA Case Studies

**Domain:** Downloadable Jupyter notebooks for Astro 5 static site
**Researched:** 2026-03-14
**Overall confidence:** HIGH

## Recommended Architecture

### Overview

Generate `.ipynb` notebooks and `.zip` download bundles at **Astro build time** using the same pattern the codebase already uses for OG images: TypeScript API route endpoints with `getStaticPaths()` that return binary `Response` objects. No new build scripts, no pre-built files committed to the repo -- everything flows through Astro's existing static output pipeline.

```
handbook/datasets/*.DAT        (source data, already in repo)
         |
src/lib/eda/notebooks/         (NEW: notebook builder + templates)
         |
         v
src/pages/eda/notebooks/
  |- index.astro                (NEW: landing page at /eda/notebooks/)
  |- [slug].zip.ts              (NEW: build-time endpoint -> /eda/notebooks/{slug}.zip)
  |- [slug].ipynb.ts            (NEW: build-time endpoint -> /eda/notebooks/{slug}.ipynb)
         |
         v
dist/eda/notebooks/
  |- index.html
  |- ceramic-strength.zip       (notebook + .DAT file)
  |- ceramic-strength.ipynb     (standalone notebook)
  |- ...10 case studies
```

### Component Boundaries

| Component | Responsibility | Communicates With | Status |
|-----------|---------------|-------------------|--------|
| `src/lib/eda/notebooks/builder.ts` | Constructs nbformat v4.5 JSON for a given case study | datasets.ts, DATASET_SOURCES, handbook/datasets/ | **NEW** |
| `src/lib/eda/notebooks/templates.ts` | Per-case-study cell definitions (markdown narrative + Python code cells) | builder.ts | **NEW** |
| `src/lib/eda/notebooks/zip.ts` | Assembles .zip buffer (notebook + .DAT data file) | builder.ts, Node.js fs for .DAT files | **NEW** |
| `src/lib/eda/notebooks/registry.ts` | Maps case study slugs to notebook metadata (title, .DAT filename, description) | DATASET_SOURCES from datasets.ts | **NEW** |
| `src/lib/eda/notebooks/types.ts` | TypeScript interfaces for nbformat v4.5 structures | None | **NEW** |
| `src/pages/eda/notebooks/[slug].zip.ts` | Astro API route endpoint: getStaticPaths + GET -> binary zip Response | zip.ts, registry.ts | **NEW** |
| `src/pages/eda/notebooks/[slug].ipynb.ts` | Astro API route endpoint: getStaticPaths + GET -> .ipynb JSON Response | builder.ts, registry.ts | **NEW** |
| `src/pages/eda/notebooks/index.astro` | Landing page listing all 10 notebooks with download links | registry.ts, EDALayout | **NEW** |
| `src/components/eda/NotebookDownload.astro` | Download button/card for embedding in existing case study pages | registry.ts | **NEW** |
| `src/lib/eda/routes.ts` | Add `notebookUrl()`, `notebookZipUrl()`, and `notebooks` route | Existing, **MODIFY** |
| `src/pages/eda/index.astro` | Add "Notebooks" to the SECTIONS array and NAV_ITEMS | Existing, **MODIFY** |
| `src/pages/eda/case-studies/[...slug].astro` | Import and render NotebookDownload component | Existing, **MODIFY** |
| `src/data/eda/datasets.ts` | Reference only -- no changes needed (DATASET_SOURCES already maps slug to .DAT name) | Existing, **NO CHANGE** |
| `handbook/datasets/*.DAT` | Source .DAT files read at build time by zip.ts | Existing, **NO CHANGE** |

### Data Flow

**Build-time flow (no runtime computation):**

1. Astro calls `getStaticPaths()` in `[slug].zip.ts` / `[slug].ipynb.ts`
2. Registry provides 10 case study entries (slug, title, .DAT filename, description)
3. For each slug, `builder.ts` constructs nbformat v4.5 JSON:
   - Markdown cells: title, background, dataset description, analysis steps
   - Code cells: pandas import, data loading, EDA plots (matplotlib/seaborn), statistical summaries
4. `zip.ts` reads the corresponding `.DAT` file from `handbook/datasets/` using Node.js `fs`
5. `zip.ts` combines `.ipynb` JSON + `.DAT` file into a zip buffer using JSZip
6. Endpoint returns `new Response(zipBuffer, { headers: { 'Content-Type': 'application/zip' } })`
7. Astro writes the response to `dist/eda/notebooks/{slug}.zip`

**User-facing flow:**

1. User visits `/eda/notebooks/` landing page or a case study page
2. Clicks "Download Notebook" button
3. Browser downloads static `.zip` file from GitHub Pages CDN (no server needed)

## Key Design Decisions

### Decision 1: Build-Time Generation (not pre-committed .ipynb files)

**Rationale:** The codebase already generates OG images, SVG plots, and CSV downloads at build time. Pre-committing 10+ binary .ipynb/.zip files to git bloats the repo and creates maintenance drift. Build-time generation ensures notebooks stay synchronized with DATASET_SOURCES and case study content.

**Pattern precedent:** `src/pages/open-graph/eda/[...slug].png.ts` uses `getStaticPaths()` from content collections, generates PNG in the `GET` handler, and returns a binary Response. The notebook endpoint follows the exact same pattern.

### Decision 2: Dual Download Format (.zip primary, .ipynb secondary)

**Rationale:** The `.zip` bundles the notebook with its `.DAT` data file, so the user can `jupyter notebook ceramic-strength.ipynb` immediately without hunting for the dataset. The standalone `.ipynb` endpoint exists for users who already have the data or want to inspect the notebook without downloading a zip.

**Structure inside each zip:**
```
ceramic-strength/
  ceramic-strength.ipynb
  JAHANMI2.DAT
  README.txt           (1-paragraph attribution + instructions)
```

### Decision 3: nbformat v4 JSON Construction in Pure TypeScript

**Rationale:** The .ipynb format is just JSON with a specific schema. No Python tooling or nbconvert is needed. Building the JSON in TypeScript keeps the build pipeline simple (no Python dependency in CI). The schema is stable (nbformat v4 has been the standard since 2015, current minor is v4.5).

**Minimal valid notebook structure:**
```typescript
interface NotebookV4 {
  nbformat: 4;
  nbformat_minor: 5;
  metadata: {
    kernelspec: { display_name: string; language: string; name: string };
    language_info: { name: string; version: string };
  };
  cells: Array<MarkdownCell | CodeCell>;
}

interface MarkdownCell {
  cell_type: 'markdown';
  id: string;
  metadata: Record<string, unknown>;
  source: string;
}

interface CodeCell {
  cell_type: 'code';
  id: string;
  metadata: Record<string, unknown>;
  source: string;
  execution_count: null;
  outputs: [];
}
```

Notebooks ship with `execution_count: null` and empty `outputs` -- users execute cells themselves. Each cell requires a unique `id` field (alphanumeric, 1-64 characters) per the nbformat v4.5 spec.

### Decision 4: JSZip for In-Memory Zip Creation

**Rationale:** JSZip works entirely in memory (no temp files), has zero native dependencies (pure JS), works identically on macOS dev and Ubuntu CI, and handles the simple case (2-3 files per archive) without streaming complexity. `archiver` is overkill for 3 files totaling less than 500KB. The existing GitHub Actions CI (`withastro/action@v3`) needs no changes.

### Decision 5: Python 3 + pandas + matplotlib as Notebook Target

**Rationale:** This is the standard data science stack that the target audience (engineers reading the NIST handbook) will have. The notebooks import `pandas`, `matplotlib.pyplot`, and `scipy.stats` -- nothing exotic. Each notebook loads the `.DAT` file relative to its own directory with `pd.read_csv()` or `pd.read_fwf()` depending on the file format.

### Decision 6: Landing Page at /eda/notebooks/ (New Section)

**Rationale:** Follows the existing EDA section pattern. The EDA index already has a `SECTIONS` array with `foundations`, `graphical`, `quantitative`, `distributions`, `case-studies`, `reference`. Adding `notebooks` as a 7th section maintains the established information architecture. URL `/eda/notebooks/` is consistent with `/eda/case-studies/`, `/eda/distributions/`, etc.

### Decision 7: Registry Array (not Content Collection)

**Rationale:** Notebooks are 1:1 with case studies, not independent content. Adding a new Astro content collection in `src/content.config.ts` would create unnecessary schema overhead and require keeping two collections in sync. A simple TypeScript `NOTEBOOK_REGISTRY` array in `src/lib/eda/notebooks/registry.ts` is sufficient for 10 entries and can be validated at build time.

## Component Details

### NEW: `src/lib/eda/notebooks/types.ts`

Defines the nbformat v4.5 TypeScript interfaces:

```typescript
export interface NotebookV4 {
  nbformat: 4;
  nbformat_minor: 5;
  metadata: NotebookMetadata;
  cells: NotebookCell[];
}

export interface NotebookMetadata {
  kernelspec: {
    display_name: string;
    language: string;
    name: string;
  };
  language_info: {
    name: string;
    version: string;
  };
}

export type NotebookCell = MarkdownCell | CodeCell;

export interface MarkdownCell {
  cell_type: 'markdown';
  id: string;
  metadata: Record<string, unknown>;
  source: string;
}

export interface CodeCell {
  cell_type: 'code';
  id: string;
  metadata: Record<string, unknown>;
  source: string;
  execution_count: null;
  outputs: [];
}
```

### NEW: `src/lib/eda/notebooks/registry.ts`

Single source of truth mapping case study slugs to notebook metadata. Derives from existing `DATASET_SOURCES` and `CASE_STUDY_MAP`:

```typescript
export interface NotebookEntry {
  slug: string;
  title: string;
  description: string;
  datFilename: string;
  datLoadMethod: 'csv' | 'fwf';    // how pandas should read the .DAT file
  nistSection: string;
  responseVariable: string;
}

export const NOTEBOOK_REGISTRY: NotebookEntry[] = [
  {
    slug: 'normal-random-numbers',
    title: 'Normal Random Numbers',
    description: 'EDA of 500 standard normal random numbers from the Rand Corporation',
    datFilename: 'RANDN.DAT',
    datLoadMethod: 'fwf',
    nistSection: '1.4.2.1',
    responseVariable: 'value',
  },
  {
    slug: 'uniform-random-numbers',
    title: 'Uniform Random Numbers',
    description: 'EDA of 500 uniform U(0,1) random numbers from the Rand Corporation',
    datFilename: 'RANDU.DAT',
    datLoadMethod: 'fwf',
    nistSection: '1.4.2.2',
    responseVariable: 'value',
  },
  // ... all 10 case studies
];
```

The full registry maps to the 10 case study slugs already defined in `CaseStudyDataset.astro`:
1. `normal-random-numbers` -> `RANDN.DAT`
2. `uniform-random-numbers` -> `RANDU.DAT`
3. `random-walk` -> `RANDWALK.DAT`
4. `cryothermometry` -> `SOULEN.DAT`
5. `beam-deflections` -> `LEW.DAT`
6. `filter-transmittance` -> `MAVRO.DAT`
7. `heat-flow-meter` -> `ZARR13.DAT`
8. `fatigue-life` -> `BIRNSAUN.DAT`
9. `ceramic-strength` -> `JAHANMI2.DAT`
10. `standard-resistor` -> `DZIUBA1.DAT`

### NEW: `src/lib/eda/notebooks/builder.ts`

Core function that constructs a notebook for a given case study:

```typescript
import type { NotebookV4, NotebookCell } from './types';
import { getTemplate } from './templates';

export function buildNotebook(slug: string): NotebookV4 {
  const template = getTemplate(slug);
  return {
    nbformat: 4,
    nbformat_minor: 5,
    metadata: {
      kernelspec: {
        display_name: 'Python 3',
        language: 'python',
        name: 'python3',
      },
      language_info: {
        name: 'python',
        version: '3.10.0',
      },
    },
    cells: template.cells,
  };
}
```

### NEW: `src/lib/eda/notebooks/templates.ts`

Contains the cell content for each case study. Each template returns an array of markdown and code cells that mirror the analysis on the web page. Helper functions (`md()`, `code()`) create properly shaped cell objects with unique IDs:

```typescript
function md(id: string, source: string): MarkdownCell {
  return { cell_type: 'markdown', id, metadata: {}, source };
}

function code(id: string, source: string): CodeCell {
  return { cell_type: 'code', id, metadata: {}, source, execution_count: null, outputs: [] };
}

export function getTemplate(slug: string): { cells: NotebookCell[] } {
  const templateFn = TEMPLATES[slug];
  if (!templateFn) throw new Error(`No notebook template for slug: ${slug}`);
  return templateFn();
}

const TEMPLATES: Record<string, () => { cells: NotebookCell[] }> = {
  'normal-random-numbers': normalRandomTemplate,
  'uniform-random-numbers': uniformRandomTemplate,
  'random-walk': randomWalkTemplate,
  'cryothermometry': cryothermometryTemplate,
  'beam-deflections': beamDeflectionsTemplate,
  'filter-transmittance': filterTransmittanceTemplate,
  'heat-flow-meter': heatFlowMeterTemplate,
  'fatigue-life': fatigueLifeTemplate,
  'ceramic-strength': ceramicStrengthTemplate,
  'standard-resistor': standardResistorTemplate,
};
```

Each template function builds cells like:
```typescript
function normalRandomTemplate(): { cells: NotebookCell[] } {
  return {
    cells: [
      md('nrn-01', [
        '# Normal Random Numbers -- EDA Case Study',
        '',
        'NIST/SEMATECH Section 1.4.2.1',
        '',
        '500 standard normal N(0,1) random numbers from the Rand Corporation.',
        'This notebook applies the full 4-plot EDA diagnostic.',
      ].join('\n')),
      code('nrn-02', [
        'import pandas as pd',
        'import numpy as np',
        'import matplotlib.pyplot as plt',
        'from scipy import stats',
        '',
        '# Load the dataset',
        "df = pd.read_fwf('RANDN.DAT', header=None, names=['value'])",
        "print(f'Observations: {len(df)}')",
        'df.head(10)',
      ].join('\n')),
      md('nrn-03', '## 4-Plot Diagnostic'),
      code('nrn-04', [
        'fig, axes = plt.subplots(2, 2, figsize=(12, 8))',
        '# ... run sequence, lag plot, histogram, probability plot',
      ].join('\n')),
      // ... additional analysis cells
    ],
  };
}
```

### NEW: `src/lib/eda/notebooks/zip.ts`

```typescript
import JSZip from 'jszip';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { NotebookV4 } from './types';

export async function buildZipBuffer(
  slug: string,
  notebook: NotebookV4,
  datFilename: string,
): Promise<Buffer> {
  const zip = new JSZip();
  const folder = zip.folder(slug)!;

  // Add notebook JSON
  folder.file(`${slug}.ipynb`, JSON.stringify(notebook, null, 1));

  // Add .DAT file from handbook/datasets/
  const datPath = join(process.cwd(), 'handbook', 'datasets', datFilename);
  folder.file(datFilename, readFileSync(datPath));

  // Add README with attribution
  folder.file('README.txt', buildReadme(slug, datFilename));

  return Buffer.from(await zip.generateAsync({ type: 'uint8array' }));
}

function buildReadme(slug: string, datFilename: string): string {
  return [
    `${slug} -- EDA Case Study Notebook`,
    '',
    'Source: NIST/SEMATECH e-Handbook of Statistical Methods',
    `Dataset: ${datFilename}`,
    '',
    'To run:',
    '  1. Install Python 3 with pandas, matplotlib, scipy',
    '  2. jupyter notebook ' + slug + '.ipynb',
    '',
    'Generated by https://patrykgolabek.dev/eda/notebooks/',
    '',
  ].join('\n');
}
```

### NEW: `src/pages/eda/notebooks/[slug].zip.ts`

Follows the OG image endpoint pattern exactly:

```typescript
import type { APIRoute } from 'astro';
import { NOTEBOOK_REGISTRY, type NotebookEntry } from '../../../lib/eda/notebooks/registry';
import { buildNotebook } from '../../../lib/eda/notebooks/builder';
import { buildZipBuffer } from '../../../lib/eda/notebooks/zip';

export function getStaticPaths() {
  return NOTEBOOK_REGISTRY.map((entry) => ({
    params: { slug: entry.slug },
    props: entry,
  }));
}

export const GET: APIRoute = async ({ props }) => {
  const { slug, datFilename } = props as NotebookEntry;
  const notebook = buildNotebook(slug);
  const zipBuffer = await buildZipBuffer(slug, notebook, datFilename);

  return new Response(zipBuffer, {
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="${slug}.zip"`,
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
};
```

### NEW: `src/pages/eda/notebooks/[slug].ipynb.ts`

Standalone notebook download (no zip):

```typescript
import type { APIRoute } from 'astro';
import { NOTEBOOK_REGISTRY, type NotebookEntry } from '../../../lib/eda/notebooks/registry';
import { buildNotebook } from '../../../lib/eda/notebooks/builder';

export function getStaticPaths() {
  return NOTEBOOK_REGISTRY.map((entry) => ({
    params: { slug: entry.slug },
    props: entry,
  }));
}

export const GET: APIRoute = async ({ props }) => {
  const { slug } = props as NotebookEntry;
  const notebook = buildNotebook(slug);

  return new Response(JSON.stringify(notebook, null, 1), {
    headers: {
      'Content-Type': 'application/x-ipynb+json',
      'Content-Disposition': `attachment; filename="${slug}.ipynb"`,
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
};
```

### NEW: `src/pages/eda/notebooks/index.astro`

Landing page following the same pattern as `src/pages/eda/case-studies/index.astro`:

- Uses `EDALayout` wrapper
- `BreadcrumbJsonLd` with crumbs: Home > EDA > Notebooks
- `EDAJsonLd` for structured data
- `EdaBreadcrumb` component
- Card grid showing all 10 notebooks with download buttons
- Each card shows: title, description, NIST section, .DAT filename, download links (.zip + .ipynb)

### NEW: `src/components/eda/NotebookDownload.astro`

Compact download card for embedding in case study pages (below the existing `CaseStudyDataset` component):

```astro
---
import { NOTEBOOK_REGISTRY } from '../../lib/eda/notebooks/registry';

interface Props {
  slug: string;
}

const { slug } = Astro.props;
const entry = NOTEBOOK_REGISTRY.find(e => e.slug === slug);
if (!entry) return;
---
<section class="mt-6 rounded-lg border border-[var(--color-border)] p-5">
  <div class="flex items-center gap-3 mb-3">
    <svg><!-- notebook icon --></svg>
    <h2 class="text-lg font-heading font-bold">Jupyter Notebook</h2>
  </div>
  <p class="text-sm text-[var(--color-text-secondary)] mb-4">
    Download a ready-to-run Python notebook for this case study,
    bundled with the {entry.datFilename} dataset.
  </p>
  <div class="flex flex-wrap gap-3">
    <a href={`/eda/notebooks/${slug}.zip`} download
       class="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded
              bg-[var(--color-accent)] !text-white hover:opacity-90 transition-opacity !no-underline">
      Download .zip (notebook + data)
    </a>
    <a href={`/eda/notebooks/${slug}.ipynb`} download
       class="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded
              border border-[var(--color-border)] !text-[var(--color-text-secondary)]
              hover:!text-[var(--color-accent)] hover:border-[var(--color-accent)]
              transition-colors !no-underline">
      Download .ipynb only
    </a>
  </div>
</section>
```

### MODIFY: `src/lib/eda/routes.ts`

Add notebook route constants and URL helpers:

```typescript
export const EDA_ROUTES = {
  // ... existing routes unchanged
  notebooks: '/eda/notebooks/',     // NEW
} as const;

/** Map a case study slug to its notebook zip download URL */
export function notebookZipUrl(slug: string): string {
  return `${EDA_ROUTES.notebooks}${slug}.zip`;
}

/** Map a case study slug to its standalone notebook download URL */
export function notebookUrl(slug: string): string {
  return `${EDA_ROUTES.notebooks}${slug}.ipynb`;
}
```

### MODIFY: `src/pages/eda/index.astro`

Add "Notebooks" section to the landing page. Two arrays need entries:

```typescript
// In SECTIONS array (around line 112-119):
{ id: 'notebooks', heading: 'Jupyter Notebooks', category: 'notebooks', indexHref: '/eda/notebooks/' },

// In NAV_ITEMS array (around line 138-145):
{ label: 'Notebooks', href: '#notebooks', indexHref: '/eda/notebooks/' },
```

The notebook cards on the landing page link to the landing page (not direct downloads) to provide context before download. The notebook section will not use the `getCards()` function since notebooks are not from a content collection -- it will render a custom section that imports `NOTEBOOK_REGISTRY` directly.

### MODIFY: `src/pages/eda/case-studies/[...slug].astro`

Add `NotebookDownload` component after the `<Content />` render:

```astro
---
// Add import (line ~6):
import NotebookDownload from '../../../components/eda/NotebookDownload.astro';
---
<!-- After <Content /> inside the prose-foundations div, before closing </article>: -->
<NotebookDownload slug={slug} />
```

This is a 2-line change to the existing file.

### NO CHANGE: `astro.config.mjs`

The new `/eda/notebooks/` pages will automatically be picked up by the existing sitemap integration since they match the `/eda/` URL pattern already handled with `priority: 0.5` and `changefreq: 'monthly'`. No config modifications needed.

### NO CHANGE: `.github/workflows/deploy.yml`

JSZip is a pure JavaScript dependency -- no native binaries, no Python runtime. The `withastro/action@v3` handles `npm install` and `astro build` unchanged.

## Patterns to Follow

### Pattern 1: Static API Route for Binary Assets

**What:** Use Astro's `[param].ext.ts` endpoint pattern with `getStaticPaths()` to generate binary files at build time.

**When:** Any time you need to produce downloadable files (zip, ipynb, pdf, etc.) that are deterministic from source data.

**Why this over alternatives:**
- A `prebuild` script would work but creates a parallel build system outside Astro's awareness
- Committing built artifacts to git causes repo bloat and maintenance drift
- The API route pattern is already proven in this codebase (20+ OG image endpoints use it)

**Example from existing codebase:**
```typescript
// src/pages/open-graph/eda/case-studies.png.ts
export const GET: APIRoute = async () => {
  const png = await getOrGenerateOgImage('Case Studies', '...', () => generateEdaSectionOgImage(...));
  return new Response(png, {
    headers: { 'Content-Type': 'image/png', 'Cache-Control': 'public, max-age=31536000, immutable' },
  });
};
```

### Pattern 2: Registry-Driven Content

**What:** A single TypeScript module (`registry.ts`) maps slugs to metadata, used by both the endpoint `getStaticPaths()` and the landing page template.

**When:** Multiple pages/endpoints need the same list of entries.

**Why:** Prevents the slug list from diverging between the endpoint, the landing page, and the download buttons. This is the same pattern used by `DATASET_SOURCES` in `datasets.ts` and the technique/distribution JSON collections.

### Pattern 3: Notebook-as-Data (not Notebook-as-File)

**What:** Notebooks are defined as TypeScript data structures (arrays of cell objects), not as `.ipynb` files checked into the repo.

**When:** The notebook content is derived from existing data (datasets, analysis steps) rather than being hand-authored in Jupyter.

**Why:** Keeps the single source of truth in TypeScript. If a dataset changes or the analysis narrative is improved, the notebook regenerates automatically on next build.

## Anti-Patterns to Avoid

### Anti-Pattern 1: Pre-Built Notebooks in `public/`

**What:** Committing `.ipynb` and `.zip` files to `public/downloads/` or similar.

**Why bad:** Binary files in git cause repo bloat (10 zips x ~100KB = 1MB per change, accumulating across commits). The notebooks will drift from the actual datasets/analysis. No build-time validation. Every data correction requires manually rebuilding notebooks.

**Instead:** Generate at build time via API route endpoints.

### Anti-Pattern 2: Python Build Step for Notebook Generation

**What:** Adding a Python script to `scripts/` that uses `nbformat` or `nbconvert` to create notebooks, run as a `prebuild` step.

**Why bad:** Introduces a Python runtime dependency into the CI pipeline (currently Node.js only). The `withastro/action@v3` GitHub Action does not include Python. The `.ipynb` format is just JSON -- TypeScript handles it directly without any external tooling.

**Instead:** Build nbformat v4 JSON in TypeScript.

### Anti-Pattern 3: Client-Side Zip Generation

**What:** Using JSZip in the browser to assemble zips on-demand when the user clicks download.

**Why bad:** Requires shipping JSZip (~100KB) to the client. Requires fetching the .DAT file and .ipynb separately before zipping. Violates the "zero client-side JS" philosophy of the EDA section (all plots are build-time SVG). Fails for users with JS disabled.

**Instead:** Pre-build the zip at build time, serve as a static file.

### Anti-Pattern 4: Separate Content Collection for Notebooks

**What:** Creating a new Astro content collection in `src/content.config.ts` for notebook metadata.

**Why bad:** Notebooks are 1:1 with case studies, not independent content. Adding a collection creates unnecessary schema overhead (Zod schema, loader config, type exports) and requires keeping two collections in sync. A simple TypeScript registry array is sufficient for 10 entries.

**Instead:** Use a plain `NOTEBOOK_REGISTRY` array in `src/lib/eda/notebooks/registry.ts`.

### Anti-Pattern 5: Overloading CaseStudyDataset Component

**What:** Adding notebook download buttons directly into the existing `CaseStudyDataset.astro` component.

**Why bad:** `CaseStudyDataset` already has a clear responsibility: dataset preview + CSV download + NIST source link. Adding notebook downloads would violate single-responsibility and make the component harder to maintain. The component is already 320 lines long.

**Instead:** Create a separate `NotebookDownload.astro` component placed after `CaseStudyDataset` in the case study page template.

## File Structure Summary

```
NEW files:
  src/lib/eda/notebooks/
    types.ts                  - NotebookV4 interface, Cell types
    builder.ts                - buildNotebook(slug) -> NotebookV4
    templates.ts              - Per-case-study cell definitions (10 template functions)
    zip.ts                    - buildZipBuffer() using JSZip
    registry.ts               - NOTEBOOK_REGISTRY array (10 entries)
  src/pages/eda/notebooks/
    index.astro               - Landing page at /eda/notebooks/
    [slug].zip.ts             - Build-time zip endpoint (10 files generated)
    [slug].ipynb.ts           - Build-time ipynb endpoint (10 files generated)
  src/components/eda/
    NotebookDownload.astro    - Download button for case study pages

MODIFIED files:
  src/lib/eda/routes.ts       - Add notebooks route + 2 URL helpers
  src/pages/eda/index.astro   - Add Notebooks to SECTIONS + NAV_ITEMS arrays
  src/pages/eda/case-studies/[...slug].astro  - Import + render NotebookDownload

UNCHANGED files:
  src/data/eda/datasets.ts          - Read-only reference for DATASET_SOURCES
  handbook/datasets/*.DAT           - Read-only reference for .DAT file contents
  astro.config.mjs                  - Sitemap auto-picks up /eda/ pages
  .github/workflows/deploy.yml     - JSZip is pure JS, no CI changes
  src/content.config.ts             - No new content collections needed
  src/layouts/EDALayout.astro       - Reused as-is by notebooks landing page
  src/components/eda/EdaBreadcrumb.astro  - Reused as-is
  src/components/BreadcrumbJsonLd.astro   - Reused as-is
```

## Integration Points with Existing Architecture

| Existing System | Integration Point | Change Type |
|----------------|-------------------|-------------|
| `EDALayout.astro` | Used by notebooks/index.astro | No change to layout |
| `EdaBreadcrumb.astro` | Used by notebooks/index.astro | No change to component |
| `BreadcrumbJsonLd.astro` | Used by notebooks/index.astro | No change to component |
| `EDAJsonLd.astro` | Used by notebooks/index.astro, may need `pageType` variant | Minor: add `'notebook'` to `pageType` union |
| `src/lib/eda/routes.ts` | Add `notebooks` route + 2 helpers | 3 additive lines |
| `DATASET_SOURCES` in datasets.ts | Read `.name` field for .DAT filenames | Read-only reference |
| `handbook/datasets/*.DAT` | Read at build time by zip.ts | Read-only reference |
| `src/pages/eda/index.astro` | Add notebooks to SECTIONS + NAV_ITEMS | 2 array entries |
| `src/pages/eda/case-studies/[...slug].astro` | Import + render NotebookDownload | 2-line change |
| Sitemap integration | Auto-picks up /eda/notebooks/ | No config change |
| GitHub Actions CI | JSZip is pure JS | No CI change |
| OG images | May add notebooks OG image endpoint | Optional future enhancement |

## Suggested Build Order

The build order respects dependencies -- each phase only uses components from prior phases:

### Phase 1: Types + Registry (no dependencies)
- `src/lib/eda/notebooks/types.ts` -- nbformat v4.5 TypeScript interfaces
- `src/lib/eda/notebooks/registry.ts` -- NOTEBOOK_REGISTRY array with all 10 entries
- **Test gate:** TypeScript compiles. Registry entries match DATASET_SOURCES .DAT filenames.

### Phase 2: Notebook Builder (depends on Phase 1)
- `src/lib/eda/notebooks/builder.ts` -- buildNotebook() function
- `src/lib/eda/notebooks/templates.ts` -- Start with 1-2 templates (normal-random-numbers, ceramic-strength) for validation
- **Test gate:** `buildNotebook('normal-random-numbers')` returns valid nbformat v4.5 JSON. JSON validates against nbformat schema.

### Phase 3: Zip Assembler (depends on Phase 1 + 2)
- `npm install jszip` (add to dependencies)
- `src/lib/eda/notebooks/zip.ts` -- buildZipBuffer() function
- **Test gate:** Generated zip can be opened. Contains .ipynb, .DAT, README.txt in a named subfolder.

### Phase 4: API Route Endpoints (depends on Phase 1 + 2 + 3)
- `src/pages/eda/notebooks/[slug].zip.ts`
- `src/pages/eda/notebooks/[slug].ipynb.ts`
- **Test gate:** `astro build` succeeds. `dist/eda/notebooks/normal-random-numbers.zip` exists and is a valid zip. `dist/eda/notebooks/normal-random-numbers.ipynb` exists and is valid JSON.

### Phase 5: Routes Update (no dependencies on Phases 1-4)
- Modify `src/lib/eda/routes.ts` -- add `notebooks` route + URL helpers
- **Test gate:** TypeScript compiles. `notebookZipUrl('foo')` returns `/eda/notebooks/foo.zip`.

### Phase 6: NotebookDownload Component (depends on Phase 1 + 5)
- `src/components/eda/NotebookDownload.astro`
- **Test gate:** Component renders download buttons with correct URLs.

### Phase 7: Landing Page (depends on Phase 1 + 5)
- `src/pages/eda/notebooks/index.astro`
- **Test gate:** `/eda/notebooks/` renders card grid with all 10 notebooks. Breadcrumbs correct. JSON-LD validates.

### Phase 8: Case Study Integration (depends on Phase 6)
- Modify `src/pages/eda/case-studies/[...slug].astro` -- add NotebookDownload import + render
- **Test gate:** Each case study page shows notebook download section below the dataset panel.

### Phase 9: EDA Index Update (depends on Phase 7)
- Modify `src/pages/eda/index.astro` -- add Notebooks to SECTIONS + NAV_ITEMS
- **Test gate:** `/eda/` shows Notebooks section with link to `/eda/notebooks/`.

### Phase 10: Remaining Templates (depends on Phase 2)
- Complete all 10 template functions in `templates.ts`
- **Test gate:** All 10 notebooks generate. All 10 zips contain correct .DAT files.

## .DAT File Format Handling

Each NIST .DAT file has a different format. The notebook templates must use the correct `pandas` loading method:

| Case Study | .DAT File | Format | pandas Method |
|-----------|-----------|--------|---------------|
| Normal Random Numbers | RANDN.DAT | Fixed-width, 10 values/line | `pd.read_fwf()` with widths |
| Uniform Random Numbers | RANDU.DAT | Fixed-width, 10 values/line | `pd.read_fwf()` with widths |
| Random Walk | RANDWALK.DAT | Fixed-width, single column | `pd.read_fwf()` |
| Cryothermometry | SOULEN.DAT | Fixed-width, single column | `pd.read_fwf()` |
| Beam Deflections | LEW.DAT | Fixed-width, single column | `pd.read_fwf()` |
| Filter Transmittance | MAVRO.DAT | Fixed-width, single column | `pd.read_fwf()` |
| Heat Flow Meter | ZARR13.DAT | Fixed-width, single column | `pd.read_fwf()` |
| Fatigue Life | BIRNSAUN.DAT | Fixed-width, single column | `pd.read_fwf()` |
| Ceramic Strength | JAHANMI2.DAT | Fixed-width, multi-column (15 vars) | `pd.read_fwf()` with column names |
| Standard Resistor | DZIUBA1.DAT | Fixed-width, single column | `pd.read_fwf()` |

This mapping is stored in the `datLoadMethod` field of each `NotebookEntry` in the registry.

## Scalability Considerations

| Concern | At 10 notebooks | At 50 notebooks | At 200 notebooks |
|---------|-----------------|-----------------|-------------------|
| Build time | Negligible (<2s added) | ~5-10s | Consider parallel generation or caching |
| Repo size | No impact (generated at build) | No impact | No impact |
| Deploy size | ~1MB total (10 zips) | ~5MB total | May need CDN for large datasets |
| Template maintenance | 10 template functions | Extract shared cell patterns | Auto-generate from structured analysis metadata |

## Sources

- [nbformat v4.5 JSON Schema](https://github.com/jupyter/nbformat/blob/main/nbformat/v4/nbformat.v4.5.schema.json) -- Official notebook format schema (HIGH confidence)
- [The Notebook file format -- nbformat 5.10 documentation](https://nbformat.readthedocs.io/en/latest/format_description.html) -- Notebook format specification (HIGH confidence)
- [Astro Endpoints documentation](https://docs.astro.build/en/guides/endpoints/) -- Static file endpoint patterns with getStaticPaths (HIGH confidence)
- [JSZip npm package](https://www.npmjs.com/package/jszip) -- In-memory zip creation, pure JS (HIGH confidence)
- [ADM-ZIP](https://github.com/cthackers/adm-zip) -- Alternative considered, heavier API surface (HIGH confidence)
- Existing codebase patterns verified by direct code inspection (HIGH confidence):
  - `src/pages/open-graph/eda/[...slug].png.ts` -- Binary asset endpoint pattern
  - `src/pages/open-graph/eda/case-studies.png.ts` -- Static OG image endpoint
  - `src/components/eda/CaseStudyDataset.astro` -- Dataset panel with CSV download
  - `src/data/eda/datasets.ts` -- DATASET_SOURCES with .DAT file mappings
  - `src/lib/eda/routes.ts` -- EDA_ROUTES constant pattern
  - `src/pages/eda/case-studies/index.astro` -- Landing page card grid pattern
  - `src/pages/eda/index.astro` -- SECTIONS/NAV_ITEMS pattern
  - `astro.config.mjs` -- Static output mode, sitemap /eda/ handling
  - `.github/workflows/deploy.yml` -- withastro/action@v3 CI pipeline
