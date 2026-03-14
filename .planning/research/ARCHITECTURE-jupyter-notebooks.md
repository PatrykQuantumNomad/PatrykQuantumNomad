# Architecture Patterns: Jupyter Notebook Case Study Downloads

**Domain:** Build-time notebook generation for Astro static site
**Researched:** 2026-03-14

## Recommended Architecture

### Overview

Build-time generation via a custom Astro integration. The integration hooks into `astro:build:done`, constructs .ipynb JSON for each case study, bundles it with the NIST .DAT file and a requirements.txt, creates a .zip archive using archiver, and writes it to the output directory. No runtime code, no API, no Python execution.

### Component Boundaries

| Component | Responsibility | Communicates With |
|-----------|---------------|-------------------|
| `src/integrations/notebook-generator.ts` | Astro integration entry point. Orchestrates the build-time generation loop. | Astro build pipeline (hook), notebook builder, zip packager |
| `src/lib/notebook/builder.ts` | Constructs nbformat v4.5 JSON from case study metadata and templates. Pure function: metadata in, JSON out. | Case study config, cell templates |
| `src/lib/notebook/cells.ts` | Cell factory functions: `markdownCell()`, `codeCell()`. Handles id generation, source line splitting. | Builder |
| `src/lib/notebook/templates/` | Per-case-study analysis code (Python source as string constants or template functions). | Builder |
| `src/lib/notebook/packager.ts` | Creates .zip archives using archiver. Bundles .ipynb + .dat + requirements.txt. | Builder output, filesystem (handbook/datasets/), archiver |
| `src/lib/notebook/config.ts` | Case study metadata: slug-to-dataset mapping, .DAT file paths, notebook titles. Extracted from existing CASE_STUDY_MAP. | Builder, packager |
| `src/components/eda/CaseStudyDataset.astro` (modified) | Adds "Download Notebook" button alongside existing CSV download. | Static zip URL |

### Data Flow

```
astro:build:done({ dir })
  |
  v
notebook-generator.ts
  |-- reads config.ts (10 case studies)
  |-- for each case study:
  |     |
  |     |-- builder.ts
  |     |     |-- cells.ts (markdown + code cells)
  |     |     |-- templates/{slug}.ts (Python analysis code)
  |     |     |-- returns: NotebookV4 object (typed JSON)
  |     |
  |     |-- packager.ts
  |           |-- JSON.stringify(notebook) --> .ipynb buffer
  |           |-- reads handbook/datasets/{FILE}.DAT
  |           |-- generates requirements.txt string
  |           |-- archiver: creates .zip in memory/stream
  |           |-- writes: {dir}/downloads/notebooks/{slug}.zip
  |
  v
dist/downloads/notebooks/
  |-- normal-random-numbers.zip
  |-- uniform-random-numbers.zip
  |-- random-walk.zip
  |-- cryothermometry.zip
  |-- beam-deflections.zip
  |-- filter-transmittance.zip
  |-- heat-flow-meter.zip
  |-- fatigue-life.zip
  |-- ceramic-strength.zip
  |-- standard-resistor.zip
```

## Patterns to Follow

### Pattern 1: Typed Notebook Builder (Builder Pattern)

**What:** A fluent or functional API for constructing notebook JSON with TypeScript type safety.
**When:** Every notebook generation call.
**Example:**

```typescript
// src/lib/notebook/builder.ts
import { markdownCell, codeCell } from './cells';
import type { NotebookV4 } from './types';

export function buildNotebook(opts: {
  title: string;
  description: string;
  datasetFile: string;
  analysisCells: ReturnType<typeof codeCell>[];
}): NotebookV4 {
  return {
    metadata: {
      kernelspec: {
        display_name: 'Python 3',
        language: 'python',
        name: 'python3',
      },
      language_info: {
        name: 'python',
        version: '3.11.0',
      },
    },
    nbformat: 4,
    nbformat_minor: 5,
    cells: [
      markdownCell(`# ${opts.title}\n\n${opts.description}`),
      markdownCell('## Setup\n\nRun `pip install -r requirements.txt`'),
      codeCell([
        'import numpy as np',
        'import pandas as pd',
        'import matplotlib.pyplot as plt',
        'import seaborn as sns',
        'from scipy import stats',
      ].join('\n')),
      codeCell(`data = pd.read_csv('${opts.datasetFile}', ...)`),
      ...opts.analysisCells,
    ],
  };
}
```

### Pattern 2: Deterministic Cell IDs

**What:** Generate stable, reproducible cell IDs from slug + index rather than random UUIDs.
**When:** Every cell creation.
**Why:** Deterministic builds -- same input always produces the same .ipynb file. Important for caching, diffing, and reproducibility.
**Example:**

```typescript
// src/lib/notebook/cells.ts
let cellCounter = 0;

export function resetCounter(): void {
  cellCounter = 0;
}

export function markdownCell(source: string, idPrefix = 'cell'): MarkdownCell {
  return {
    cell_type: 'markdown',
    id: `${idPrefix}-${String(++cellCounter).padStart(3, '0')}`,
    metadata: {},
    source: source.split('\n'),
  };
}

export function codeCell(source: string, idPrefix = 'cell'): CodeCell {
  return {
    cell_type: 'code',
    id: `${idPrefix}-${String(++cellCounter).padStart(3, '0')}`,
    metadata: {},
    source: source.split('\n'),
    execution_count: null,
    outputs: [],
  };
}
```

### Pattern 3: Astro Integration with Build Hook

**What:** Follow the existing `indexnow.ts` integration pattern for the notebook generator.
**When:** Registering the integration in `astro.config.mjs`.
**Example:**

```typescript
// src/integrations/notebook-generator.ts
import type { AstroIntegration } from 'astro';
import { generateAllNotebooks } from '../lib/notebook/packager';

export default function notebookGenerator(): AstroIntegration {
  return {
    name: 'notebook-generator',
    hooks: {
      'astro:build:done': async ({ dir, logger }) => {
        const outDir = new URL('downloads/notebooks/', dir);
        const count = await generateAllNotebooks(outDir, logger);
        logger.info(`Generated ${count} notebook archives`);
      },
    },
  };
}
```

### Pattern 4: Stream-Based Zip Creation

**What:** Use archiver's streaming API to create zip files efficiently.
**When:** Packaging each notebook archive.
**Example:**

```typescript
import archiver from 'archiver';
import { createWriteStream } from 'node:fs';

export async function createNotebookZip(
  outputPath: string,
  slug: string,
  ipynbJson: string,
  datBuffer: Buffer,
  datFilename: string,
  requirementsTxt: string,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const output = createWriteStream(outputPath);
    const archive = archiver('zip', { zlib: { level: 9 } });

    output.on('close', resolve);
    archive.on('error', reject);
    archive.pipe(output);

    // Add files to zip under a directory named after the slug
    archive.append(ipynbJson, { name: `${slug}/${slug}.ipynb` });
    archive.append(datBuffer, { name: `${slug}/${datFilename}` });
    archive.append(requirementsTxt, { name: `${slug}/requirements.txt` });

    archive.finalize();
  });
}
```

## Anti-Patterns to Avoid

### Anti-Pattern 1: Pre-Generating Zips in Public Directory

**What:** Generating zip files manually and placing them in `public/downloads/`.
**Why bad:** Binary files in git. Manual regeneration on content change. Divergence between notebook content and web content.
**Instead:** Generate at build time via Astro integration. Zips are build artifacts, not source artifacts.

### Anti-Pattern 2: Python Execution at Build Time

**What:** Running Python to generate or validate notebooks during `astro build`.
**Why bad:** Adds Python as a CI dependency. GitHub Pages runners have Python but it's an unnecessary coupling. The .ipynb format is just JSON.
**Instead:** Generate .ipynb as JSON in Node.js. Let users execute the Python code in their own environment.

### Anti-Pattern 3: Random UUIDs for Cell IDs

**What:** Using `crypto.randomUUID()` for nbformat cell IDs.
**Why bad:** Non-deterministic builds. Every build produces a different .ipynb, even with identical content. Breaks caching. Makes diffing impossible.
**Instead:** Use deterministic IDs based on slug + sequential counter.

### Anti-Pattern 4: Monolithic Notebook Template

**What:** A single giant template string for all 10 case studies with conditionals.
**Why bad:** Unmaintainable. Hard to customize per-case-study analysis. Each case study has different analysis techniques (e.g., ceramic-strength has ANOVA, random-walk has stationarity tests).
**Instead:** Shared structure (imports, data loading, summary stats) + per-case-study analysis modules.

### Anti-Pattern 5: Embedding Dataset as Python Literal

**What:** Writing the entire dataset as a Python list literal inside the notebook (e.g., `data = [1.23, 4.56, ...]`).
**Why bad:** Bloats notebook size (ceramic-strength has 480 multi-column observations). Defeats the purpose of bundling the .DAT file. Not how data science works.
**Instead:** Bundle the .DAT file in the zip and use `pd.read_csv()` or `np.loadtxt()` in the notebook.

## Scalability Considerations

Not applicable in the traditional sense (this is a static site with 10 fixed case studies), but relevant for build-time:

| Concern | Current (10 case studies) | If Expanded (50+ case studies) |
|---------|--------------------------|-------------------------------|
| Build time | Negligible (<1s for 10 zips) | Still negligible -- archiver is fast, each zip is <100KB |
| Output size | ~10 x 15KB = 150KB total | Still small -- .DAT files are text, notebooks are JSON |
| Maintenance | 10 template modules | Would need a template registry pattern, possibly YAML-driven |

## Sources

- Existing codebase: `src/integrations/indexnow.ts` (integration pattern)
- [Astro Integration API](https://docs.astro.build/en/reference/integrations-reference/) (hook parameters)
- [archiver documentation](https://www.archiverjs.com/) (streaming zip API)
- [nbformat v4.5 specification](https://nbformat.readthedocs.io/en/latest/format_description.html) (notebook JSON structure)

---

*Architecture research: 2026-03-14*
