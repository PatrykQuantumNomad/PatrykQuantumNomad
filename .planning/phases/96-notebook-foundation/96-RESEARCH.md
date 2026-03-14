# Phase 96: Notebook Foundation - Research

**Researched:** 2026-03-14
**Domain:** TypeScript nbformat v4.5 types, cell factories, case study registry, requirements.txt template
**Confidence:** HIGH

## Summary

This phase creates the TypeScript foundation that all notebook generation (phases 97 and 100) depends on. The core deliverables are: (1) TypeScript interfaces mirroring the nbformat v4.5 JSON schema, (2) factory functions for creating markdown and code cells with deterministic IDs, (3) a case study registry mapping all 10 case study slugs to their NIST .DAT file metadata and analysis parameters, and (4) a shared requirements.txt template with floor-pinned Python scientific library versions.

The nbformat v4.5 schema is well-documented and stable. The key v4.5 addition over v4.4 is mandatory cell IDs (`id` field on every cell, pattern `^[a-zA-Z0-9-_]+$`, 1-64 chars). The `source` field is a "multiline_string" -- either a single string or an array of strings. When stored as an array, each line should be newline-terminated (`\n`) and joined with empty string to reconstruct the original. For deterministic, diff-friendly output, the array-of-strings format with newline termination is the right choice.

The existing codebase already has a `DATASET_SOURCES` mapping in `src/data/eda/datasets.ts` and a `CASE_STUDY_MAP` in the `CaseStudyDataset.astro` component. The registry should be built as 10 independent config files under `src/lib/eda/notebooks/registry/` to match the user's decision for per-study configs with cleaner diffs.

**Primary recommendation:** Model nbformat v4.5 as pure TypeScript interfaces (no runtime dependency), create `markdownCell()` and `codeCell()` factory functions with deterministic hash-based cell IDs, and build the case study registry as 10 separate TypeScript config files exporting a typed `CaseStudyConfig` object.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **Notebook cell structure:** Textbook chapter style with theory before each technique, building understanding progressively. Rich explanations: 2-4 paragraph markdown cells. Automated interpretation: code prints conclusions. Each notebook ends with key findings summary + next steps.
- **Case study registry design:** Per-study config files: 10 separate config files, one per case study. Comprehensive config: registry defines everything (dataset file, skiprows, column names, expected statistics, test parameters, plot titles). Include NIST-verified expected values for validation. Extended type: single base CaseStudyConfig with optional fields for model params, DOE factors.
- **Python setup experience:** First cell: dependency check + install with try/except import checks and !pip install fallback. Matplotlib configured with dark theme matching the site's Quantum Explorer aesthetic. No Python version check. Custom seaborn theme configured alongside matplotlib.
- **Data loading approach:** Load from bundled .DAT file via pd.read_fwf(). Data loading cell includes preview: df.shape, df.head(), df.dtypes. Assert expected row count. Colab fallback: if local file not found, fetch from GitHub raw URL.

### Claude's Discretion
- Exact matplotlib/seaborn color palette for dark theme
- Cell ID generation strategy (deterministic, hash-based or sequential)
- TypeScript interface structure details
- File organization within src/utils/notebooks/

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| NBGEN-01 | Build-time TypeScript notebook builder generates valid nbformat v4.5 JSON with deterministic cell IDs | nbformat v4.5 schema fully documented; cell ID pattern `^[a-zA-Z0-9-_]+$` (1-64 chars); TypeScript interfaces model all required fields |
| NBGEN-02 | Cell factory creates markdown, code, and output cells following nbformat schema | Factory functions produce cells with `id`, `cell_type`, `metadata`, `source`; code cells additionally require `outputs: []` and `execution_count: null` |
| NBGEN-03 | Notebook registry maps all 10 case studies to their dataset files and analysis parameters | All 10 case study slug-to-DAT-file mappings verified from existing `DATASET_SOURCES` and `CASE_STUDY_MAP`; skiprows and column metadata extracted from .DAT file headers |
| NBGEN-04 | Each notebook bundles a requirements.txt specifying numpy, scipy, pandas, matplotlib, seaborn | Current stable versions verified on PyPI; floor version pins recommended (e.g., `numpy>=2.0.0`) |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| TypeScript | 5.9.x | Type-safe nbformat interfaces and factories | Already in project; strict mode via Astro tsconfig |
| Vitest | 4.x | Unit tests for cell factories and registry | Already configured in project (`vitest.config.ts`) |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Node.js crypto | built-in | Deterministic cell ID hashing | Used in `createHash('sha256')` for cell ID generation |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Hand-written interfaces | `@types/nbformat` npm package | No such package exists; hand-written is the only option |
| SHA-256 hash IDs | Sequential IDs (`cell-001`) | Sequential is simpler but not stable under cell insertion; hash-based preferred for determinism |

**Installation:**
No new packages needed. All tooling already exists in the project.

## Architecture Patterns

### Recommended Project Structure
```
src/lib/eda/notebooks/
  types.ts                    # nbformat v4.5 TypeScript interfaces
  cells.ts                    # markdownCell(), codeCell() factory functions
  notebook.ts                 # createNotebook() assembler
  requirements.ts             # requirements.txt template string
  theme.ts                    # matplotlib/seaborn dark theme config
  registry/
    index.ts                  # Registry loader + type exports
    types.ts                  # CaseStudyConfig interface
    normal-random-numbers.ts  # Per-study config
    uniform-random-numbers.ts
    heat-flow-meter.ts
    filter-transmittance.ts
    cryothermometry.ts
    fatigue-life.ts
    standard-resistor.ts
    beam-deflections.ts
    random-walk.ts
    ceramic-strength.ts
```

**Rationale:** Place under `src/lib/eda/notebooks/` rather than `src/utils/notebooks/` because:
- The project already uses `src/lib/eda/` for EDA domain logic (math, svg-generators, schema, etc.)
- `src/lib/` contains domain-specific code; `src/utils/` is not present in the project
- Registry configs live in a `registry/` subdirectory matching the "10 separate config files" decision

### Pattern 1: nbformat v4.5 TypeScript Interfaces
**What:** Pure TypeScript interfaces that mirror the nbformat v4.5 JSON schema exactly
**When to use:** All notebook generation code imports these types
**Example:**
```typescript
// Source: https://github.com/jupyter/nbformat/blob/main/nbformat/v4/nbformat.v4.5.schema.json

/** nbformat v4.5 multiline string: single string or array of strings */
export type MultilineString = string | string[];

/** Cell ID: alphanumeric, hyphen, underscore; 1-64 chars */
export type CellId = string;

export interface MarkdownCell {
  id: CellId;
  cell_type: 'markdown';
  metadata: Record<string, unknown>;
  source: MultilineString;
  attachments?: Record<string, Record<string, string>>;
}

export interface CodeCell {
  id: CellId;
  cell_type: 'code';
  metadata: Record<string, unknown>;
  source: MultilineString;
  outputs: Output[];
  execution_count: number | null;
}

export interface RawCell {
  id: CellId;
  cell_type: 'raw';
  metadata: Record<string, unknown>;
  source: MultilineString;
}

export type Cell = MarkdownCell | CodeCell | RawCell;

// Output types
export interface ExecuteResult {
  output_type: 'execute_result';
  data: Record<string, MultilineString>;
  metadata: Record<string, unknown>;
  execution_count: number;
}

export interface DisplayData {
  output_type: 'display_data';
  data: Record<string, MultilineString>;
  metadata: Record<string, unknown>;
}

export interface StreamOutput {
  output_type: 'stream';
  name: 'stdout' | 'stderr';
  text: MultilineString;
}

export interface ErrorOutput {
  output_type: 'error';
  ename: string;
  evalue: string;
  traceback: string[];
}

export type Output = ExecuteResult | DisplayData | StreamOutput | ErrorOutput;

export interface KernelSpec {
  name: string;
  display_name: string;
  language?: string;
}

export interface LanguageInfo {
  name: string;
  version?: string;
  codemirror_mode?: string | Record<string, unknown>;
  file_extension?: string;
  mimetype?: string;
  pygments_lexer?: string;
}

export interface NotebookMetadata {
  kernelspec: KernelSpec;
  language_info: LanguageInfo;
  [key: string]: unknown;
}

export interface NotebookV4 {
  nbformat: 4;
  nbformat_minor: 5;
  metadata: NotebookMetadata;
  cells: Cell[];
}
```

### Pattern 2: Cell Factory Functions with Deterministic IDs
**What:** Factory functions that produce cells with deterministic IDs based on notebook slug + cell index
**When to use:** Every cell in every notebook is created via these factories
**Example:**
```typescript
import { createHash } from 'node:crypto';
import type { MarkdownCell, CodeCell, MultilineString } from './types';

/**
 * Generate a deterministic cell ID from notebook slug and cell index.
 * Uses SHA-256 hash truncated to 8 chars (within the 1-64 char limit).
 * Pattern: ^[a-zA-Z0-9-_]+$
 */
function cellId(slug: string, index: number): string {
  const hash = createHash('sha256')
    .update(`${slug}:${index}`)
    .digest('hex')
    .slice(0, 8);
  return hash;
}

/**
 * Normalize source lines: ensure each line ends with \n.
 * This produces the canonical array-of-strings format for nbformat.
 */
function normalizeSource(lines: string[]): string[] {
  return lines.map((line, i) =>
    i < lines.length - 1
      ? line.endsWith('\n') ? line : line + '\n'
      : line  // last line: no trailing \n
  );
}

export function markdownCell(
  slug: string,
  index: number,
  source: string[],
): MarkdownCell {
  return {
    id: cellId(slug, index),
    cell_type: 'markdown',
    metadata: {},
    source: normalizeSource(source),
  };
}

export function codeCell(
  slug: string,
  index: number,
  source: string[],
): CodeCell {
  return {
    id: cellId(slug, index),
    cell_type: 'code',
    metadata: {},
    source: normalizeSource(source),
    outputs: [],
    execution_count: null,
  };
}
```

### Pattern 3: Case Study Registry Config
**What:** Each case study has its own TypeScript config file exporting a typed CaseStudyConfig
**When to use:** Notebook generators import the registry to get all parameters for a given case study
**Example:**
```typescript
// src/lib/eda/notebooks/registry/types.ts
export interface CaseStudyConfig {
  /** URL-friendly slug matching the MDX filename */
  slug: string;
  /** Human-readable title */
  title: string;
  /** NIST section reference */
  nistSection: string;
  /** .DAT filename (e.g., 'RANDN.DAT') */
  dataFile: string;
  /** Lines to skip in the .DAT file header (before data begins) */
  skipRows: number;
  /** Number of expected data rows (for assertion) */
  expectedRows: number;
  /** Column names for pd.read_fwf() */
  columns: string[];
  /** Response variable name */
  responseVariable: string;
  /** Expected statistics for validation assertions */
  expectedStats: {
    mean: number;
    stdDev: number;
    min: number;
    max: number;
    median?: number;
  };
  /** NIST URL for Colab fallback download */
  nistUrl: string;
  /** GitHub raw URL for Colab fallback */
  githubRawUrl: string;
  /** Plot titles for the case study */
  plotTitles: {
    fourPlot: string;
    runSequence: string;
    lagPlot: string;
    histogram: string;
    probabilityPlot: string;
  };
  /** Hypothesis test parameters */
  testParams?: {
    /** Target mean for location test (H0) */
    targetMean?: number;
    /** Significance level (default 0.05) */
    alpha?: number;
  };
  /** Optional: model fitting parameters (beam deflections, random walk) */
  modelParams?: {
    type: 'sinusoidal' | 'ar1';
    [key: string]: unknown;
  };
  /** Optional: DOE factors (ceramic strength) */
  doeFactors?: {
    name: string;
    column: string;
    levels: (string | number)[];
  }[];
}
```

### Anti-Patterns to Avoid
- **Monolithic registry file:** Do NOT put all 10 case study configs in a single file. The user explicitly chose per-study config files for cleaner diffs and individual editing.
- **Runtime schema validation:** Do NOT add Zod or JSON schema validation for the nbformat output at this stage. TypeScript's compile-time type checking is sufficient. Validation can be added in phase 97 if needed.
- **Python-style snake_case in TypeScript:** The nbformat JSON schema uses `snake_case` for JSON property names (`cell_type`, `execution_count`, `nbformat_minor`). The TypeScript interfaces MUST use `snake_case` to match the JSON output. Do NOT convert to camelCase.
- **Generating notebooks in this phase:** This phase produces only the types, factories, registry, and requirements template. No actual .ipynb files are created until phases 97 and 100.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Cell ID generation | Random UUID generation | Deterministic hash from `node:crypto` | Cell IDs must be stable across builds for diff-friendliness and reproducibility |
| nbformat JSON serialization | Custom JSON formatter | `JSON.stringify(notebook, null, 1)` | Standard JSON serialization produces valid nbformat; use indent=1 to match Jupyter convention |
| Source line normalization | Manual string splitting | Helper function with `\n` termination | Every line except the last must end with `\n`; easy to get wrong without a dedicated function |

**Key insight:** The nbformat v4.5 schema is intentionally simple JSON. No special serialization library is needed -- the challenge is getting the types right so TypeScript prevents invalid notebooks at compile time.

## Common Pitfalls

### Pitfall 1: Source Line Newline Termination
**What goes wrong:** Lines in the `source` array missing `\n` terminators, causing cells to render as single concatenated lines in Jupyter
**Why it happens:** Natural string arrays don't include trailing newlines
**How to avoid:** The `normalizeSource()` helper must ensure every line except the last ends with `\n`. When the source is `["import numpy as np", "import pandas as pd"]`, the output must be `["import numpy as np\n", "import pandas as pd"]`.
**Warning signs:** Notebook cells displaying all code on one line when opened in JupyterLab

### Pitfall 2: Missing Required Fields on Code Cells
**What goes wrong:** Code cells missing `outputs: []` or `execution_count: null` cause Jupyter validation errors
**Why it happens:** Markdown cells don't have these fields, so copy-paste from markdown cell logic omits them
**How to avoid:** TypeScript interfaces enforce this at compile time. The `CodeCell` interface requires both fields. Factory functions always include them.
**Warning signs:** `nbformat.validate()` errors when opening generated notebooks

### Pitfall 3: Cell ID Uniqueness Violations
**What goes wrong:** Duplicate cell IDs cause notebook validation warnings and potential rendering issues
**Why it happens:** Using the same seed for hash generation across different cells or notebooks
**How to avoid:** Hash input includes both the notebook slug AND the cell index: `${slug}:${index}`
**Warning signs:** Jupyter showing "Cell ID collision" warnings

### Pitfall 4: .DAT File Skiprows Mismatch
**What goes wrong:** Python `pd.read_fwf()` reads header text as data, producing corrupt dataframes
**Why it happens:** Most NIST .DAT files have 25 header lines, but JAHANMI2.DAT (ceramic strength) has 50. The separator line (`---...`) is also a row to skip.
**How to avoid:** Each case study config specifies the exact `skipRows` value. Use the verified values from this research.
**Warning signs:** Row count assertions failing, non-numeric values in data columns

### Pitfall 5: nbformat_minor Must Be Exactly 5
**What goes wrong:** Setting `nbformat_minor: 4` produces v4.4 notebooks that don't require cell IDs
**Why it happens:** Using v4.4 as reference instead of v4.5
**How to avoid:** The `NotebookV4` interface has `nbformat_minor: 5` as a literal type
**Warning signs:** Notebooks opening correctly but without cell ID validation

### Pitfall 6: JAHANMI2.DAT Multi-Column Format
**What goes wrong:** Treating ceramic strength data as single-column like other datasets
**Why it happens:** All other 9 case studies have single-column or simple fixed-width data
**How to avoid:** The ceramic strength config must specify 15 columns with their names. The CaseStudyConfig type handles this with the `columns` array.
**Warning signs:** pd.read_fwf() returning a single column or misaligned data

## Code Examples

### Complete Notebook Skeleton
```typescript
// Source: https://github.com/jupyter/nbformat/blob/main/nbformat/v4/nbformat.v4.5.schema.json
import type { NotebookV4 } from './types';

export function createNotebook(cells: Cell[]): NotebookV4 {
  return {
    nbformat: 4,
    nbformat_minor: 5,
    metadata: {
      kernelspec: {
        name: 'python3',
        display_name: 'Python 3',
        language: 'python',
      },
      language_info: {
        name: 'python',
        version: '3.11.0',
        codemirror_mode: { name: 'ipython', version: 3 },
        file_extension: '.py',
        mimetype: 'text/x-python',
        pygments_lexer: 'ipython3',
      },
    },
    cells,
  };
}
```

### Requirements.txt Template
```typescript
/**
 * Floor-pinned requirements for educational EDA notebooks.
 * Uses >= (floor pins) rather than == (exact pins) because these
 * are educational notebooks, not production applications.
 */
export const REQUIREMENTS_TXT = [
  'numpy>=2.0.0',
  'scipy>=1.14.0',
  'pandas>=2.2.0',
  'matplotlib>=3.9.0',
  'seaborn>=0.13.0',
].join('\n') + '\n';
```

### Dark Theme for Matplotlib/Seaborn
```python
# Quantum Explorer dark theme for matplotlib/seaborn
# Matches the site's color scheme:
#   Background: #0f1117 (--color-surface dark mode)
#   Surface alt: #1a1d27 (--color-surface-alt dark mode)
#   Accent: #e06040 (--color-accent dark mode)
#   Accent secondary: #00a3a3 (--color-accent-secondary dark mode)
#   Text: #e8e8f0 (--color-text-primary dark mode)
#   Text secondary: #9ca3af (--color-text-secondary dark mode)
#   Border: #2a2d3a (--color-border dark mode)

import matplotlib.pyplot as plt
import seaborn as sns

QUANTUM_COLORS = {
    'background': '#0f1117',
    'surface': '#1a1d27',
    'accent': '#e06040',
    'teal': '#00a3a3',
    'text': '#e8e8f0',
    'text_secondary': '#9ca3af',
    'border': '#2a2d3a',
    'gradient_start': '#e06040',
    'gradient_end': '#00a3a3',
}

# Color cycle for multiple series
QUANTUM_PALETTE = ['#e06040', '#00a3a3', '#f0c040', '#a080e0', '#60c0a0', '#e080a0']

plt.rcParams.update({
    'figure.facecolor': QUANTUM_COLORS['background'],
    'axes.facecolor': QUANTUM_COLORS['surface'],
    'axes.edgecolor': QUANTUM_COLORS['border'],
    'axes.labelcolor': QUANTUM_COLORS['text'],
    'axes.titlecolor': QUANTUM_COLORS['text'],
    'xtick.color': QUANTUM_COLORS['text_secondary'],
    'ytick.color': QUANTUM_COLORS['text_secondary'],
    'text.color': QUANTUM_COLORS['text'],
    'grid.color': QUANTUM_COLORS['border'],
    'grid.alpha': 0.5,
    'figure.figsize': [10, 6],
    'font.size': 12,
    'axes.titlesize': 14,
    'axes.labelsize': 12,
    'axes.prop_cycle': plt.cycler('color', QUANTUM_PALETTE),
})

sns.set_theme(style='darkgrid', rc={
    'axes.facecolor': QUANTUM_COLORS['surface'],
    'figure.facecolor': QUANTUM_COLORS['background'],
    'grid.color': QUANTUM_COLORS['border'],
    'text.color': QUANTUM_COLORS['text'],
    'axes.labelcolor': QUANTUM_COLORS['text'],
    'xtick.color': QUANTUM_COLORS['text_secondary'],
    'ytick.color': QUANTUM_COLORS['text_secondary'],
})
```

### Deterministic Cell ID Generation
```typescript
import { createHash } from 'node:crypto';

/**
 * Generate deterministic cell ID.
 * Input: notebook slug + sequential cell index
 * Output: 8-char hex hash matching pattern ^[a-zA-Z0-9-_]+$
 *
 * Using 8 hex chars = 32 bits = 4 billion unique IDs.
 * With max ~50 cells per notebook, collision probability is negligible.
 */
export function cellId(slug: string, index: number): string {
  return createHash('sha256')
    .update(`${slug}:${index}`)
    .digest('hex')
    .slice(0, 8);
}
```

## Case Study Registry Reference Data

All 10 case study dataset mappings verified from existing `DATASET_SOURCES` in `src/data/eda/datasets.ts` and `.DAT` file headers in `handbook/datasets/`.

| Slug | .DAT File | Skip Rows | N (rows) | Columns | Response Variable |
|------|-----------|-----------|----------|---------|-------------------|
| normal-random-numbers | RANDN.DAT | 25 | 500 | Y | Random normal value |
| uniform-random-numbers | RANDU.DAT | 25 | 500 | Y | Random uniform value |
| heat-flow-meter | ZARR13.DAT | 25 | 195 | Y | Calibration factor |
| filter-transmittance | MAVRO.DAT | 25 | 50 | Y | Transmittance |
| cryothermometry | SOULEN.DAT | 25 | 700 | Y | Voltage counts |
| fatigue-life | BIRNSAUN.DAT | 25 | 101 | Y | Fatigue life (kcycles) |
| standard-resistor | DZIUBA1.DAT | 25 | 1000 | Month, Day, Year, Resistance | Resistance (ohms) |
| beam-deflections | LEW.DAT | 25 | 200 | Y | Beam deflection |
| random-walk | RANDWALK.DAT | 25 | 500 | Y | Cumulative sum |
| ceramic-strength | JAHANMI2.DAT | 50 | 480 | 15 columns (ID, Lab, Bar, Set, Y, X1-X10, Set2) | Ceramic strength (MPa) |

**Critical notes:**
- JAHANMI2.DAT has 50 skiprows (all others have 25) -- the separator `---` line is at line 50
- DZIUBA1.DAT has 4 columns (Month, Day, Year, Resistance) -- multi-column but simpler than JAHANMI2
- Most .DAT files use fixed-width format -- `pd.read_fwf()` is the correct reader
- RANDN.DAT has 10 values per line; RANDU.DAT has 5 values per line; SOULEN.DAT has 5 values per line
- For single-response datasets with multiple values per line, pd.read_fwf() will need to be used with appropriate column width specifications, or the data reshaped after reading

**GitHub raw URLs for Colab fallback:**
Pattern: `https://raw.githubusercontent.com/PatrykQuantumNomad/PatrykQuantumNomad/main/handbook/datasets/{FILENAME}`

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| nbformat v4.4 (no cell IDs) | nbformat v4.5 (mandatory cell IDs) | 2022 (nbformat 5.7+) | Every cell needs a unique `id` field |
| `source` as single string | `source` as array of newline-terminated strings | Convention (not schema change) | Array format is preferred for diff-friendliness |
| `IPython.nbformat` Python lib | Direct JSON generation from TypeScript | Project decision | No Python dependency in CI; TypeScript generates valid JSON directly |

**Deprecated/outdated:**
- nbformat v3: Completely different schema, not relevant
- `worksheets` array: Removed in v4; notebooks have a flat `cells` array

## Open Questions

1. **Multi-values-per-line .DAT files**
   - What we know: RANDN.DAT has 10 values per line, RANDU.DAT has 5, SOULEN.DAT has 5
   - What's unclear: Whether `pd.read_fwf()` handles this natively or if post-read reshaping is needed
   - Recommendation: Include parsing instructions in each case study config. For multi-value-per-line files, the config should specify `valuesPerLine` and the notebook code should flatten after reading. This is a concern for phases 97/100, not this phase -- the registry just needs the metadata.

2. **DZIUBA1.DAT column handling**
   - What we know: Has 4 columns (Month, Day, Year, Resistance), the first 3 are date components
   - What's unclear: Whether the notebook should combine M/D/Y into a date index or just use row index
   - Recommendation: Store all column names in registry; notebook generation (phase 97) decides display

3. **Theme consistency across Jupyter environments**
   - What we know: Dark theme rcParams work in JupyterLab and Colab
   - What's unclear: Whether Colab's default CSS overrides some matplotlib rcParams
   - Recommendation: The theme.ts template should include `plt.rcParams.update()` which overrides environment defaults; test in Colab during phase 97

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.x |
| Config file | `vitest.config.ts` (exists) |
| Quick run command | `npx vitest run src/lib/eda/notebooks/` |
| Full suite command | `npx vitest run` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| NBGEN-01 | createNotebook() produces valid nbformat v4.5 JSON with correct top-level fields | unit | `npx vitest run src/lib/eda/notebooks/__tests__/notebook.test.ts -x` | Wave 0 |
| NBGEN-01 | Cell IDs are deterministic (same input = same output) | unit | `npx vitest run src/lib/eda/notebooks/__tests__/cells.test.ts -x` | Wave 0 |
| NBGEN-01 | Cell IDs match pattern `^[a-zA-Z0-9-_]+$` and are 1-64 chars | unit | `npx vitest run src/lib/eda/notebooks/__tests__/cells.test.ts -x` | Wave 0 |
| NBGEN-02 | markdownCell() returns object with id, cell_type='markdown', metadata, source | unit | `npx vitest run src/lib/eda/notebooks/__tests__/cells.test.ts -x` | Wave 0 |
| NBGEN-02 | codeCell() returns object with id, cell_type='code', metadata, source, outputs=[], execution_count=null | unit | `npx vitest run src/lib/eda/notebooks/__tests__/cells.test.ts -x` | Wave 0 |
| NBGEN-02 | Source lines are newline-terminated (except last) | unit | `npx vitest run src/lib/eda/notebooks/__tests__/cells.test.ts -x` | Wave 0 |
| NBGEN-03 | Registry exports configs for all 10 case study slugs | unit | `npx vitest run src/lib/eda/notebooks/__tests__/registry.test.ts -x` | Wave 0 |
| NBGEN-03 | Each config has required fields: slug, dataFile, skipRows, expectedRows, columns | unit | `npx vitest run src/lib/eda/notebooks/__tests__/registry.test.ts -x` | Wave 0 |
| NBGEN-04 | REQUIREMENTS_TXT contains numpy, scipy, pandas, matplotlib, seaborn with >= pins | unit | `npx vitest run src/lib/eda/notebooks/__tests__/requirements.test.ts -x` | Wave 0 |

### Sampling Rate
- **Per task commit:** `npx vitest run src/lib/eda/notebooks/`
- **Per wave merge:** `npx vitest run`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/lib/eda/notebooks/__tests__/cells.test.ts` -- covers NBGEN-01, NBGEN-02
- [ ] `src/lib/eda/notebooks/__tests__/notebook.test.ts` -- covers NBGEN-01
- [ ] `src/lib/eda/notebooks/__tests__/registry.test.ts` -- covers NBGEN-03
- [ ] `src/lib/eda/notebooks/__tests__/requirements.test.ts` -- covers NBGEN-04

## Sources

### Primary (HIGH confidence)
- [nbformat v4.5 JSON schema](https://github.com/jupyter/nbformat/blob/main/nbformat/v4/nbformat.v4.5.schema.json) -- complete schema definition with cell ID requirements, multiline_string type, output types
- [nbformat documentation](https://nbformat.readthedocs.io/en/latest/format_description.html) -- format description, source field handling, multi-line string conventions
- Existing codebase: `src/data/eda/datasets.ts` DATASET_SOURCES -- verified all 10 dataset-to-file mappings
- Existing codebase: `src/components/eda/CaseStudyDataset.astro` CASE_STUDY_MAP -- verified slug-to-dataset mappings
- Existing codebase: `handbook/datasets/*.DAT` file headers -- verified skiprows and column counts for all 10 files
- Existing codebase: `src/styles/global.css` -- dark mode color variables for Quantum Explorer theme

### Secondary (MEDIUM confidence)
- [PyPI numpy](https://pypi.org/project/numpy/) -- latest stable 2.4.3 (Mar 2026)
- [PyPI scipy](https://pypi.org/project/scipy/) -- latest stable 1.17.1 (Feb 2026)
- [PyPI pandas](https://pypi.org/project/pandas/) -- latest stable 3.0.1 (Feb 2026)
- [PyPI matplotlib](https://pypi.org/project/matplotlib/) -- latest stable 3.10.8 (Dec 2025)
- [PyPI seaborn](https://pypi.org/project/seaborn/) -- latest stable 0.13.2 (Jan 2024)

### Tertiary (LOW confidence)
- None -- all findings verified with primary or secondary sources

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- no new dependencies; uses existing TypeScript + Vitest
- Architecture: HIGH -- file structure follows existing `src/lib/eda/` patterns; nbformat v4.5 schema is well-documented and stable
- Pitfalls: HIGH -- verified against official schema and existing codebase data
- Registry data: HIGH -- all 10 case study mappings cross-verified between `DATASET_SOURCES`, `.DAT` file headers, and MDX frontmatter

**Research date:** 2026-03-14
**Valid until:** 2026-04-14 (stable domain -- nbformat v4.5 unlikely to change)
