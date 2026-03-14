# Phase 97: Standard Case Study Notebooks - Research

**Researched:** 2026-03-14
**Domain:** Parameterized Jupyter notebook generation from TypeScript, Python EDA analysis templates, scipy hypothesis testing
**Confidence:** HIGH

## Summary

Phase 97 builds on the Phase 96 foundation (nbformat types, cell factories, case study registry, theme, requirements) to produce 7 standard-template Jupyter notebooks. The core technical challenge is designing a single parameterized `buildStandardNotebook(slug)` function that generates case-study-specific notebooks by composing cells from the existing `markdownCell()` and `codeCell()` factories using data from the `CaseStudyConfig` registry. Each notebook follows the same structure: title, dependency check, theme setup, imports, data loading with Colab fallback, summary statistics, 4-plot, individual plots, hypothesis tests (location, variation, randomness, distribution, outlier), test summary table, interpretation, and conclusions.

The 7 standard case studies span a range of EDA outcomes: Normal Random Numbers (baseline, all assumptions pass), Uniform Random Numbers (non-normal distribution), Heat Flow Meter (mild non-randomness), Filter Transmittance (extreme autocorrelation r1=0.94), Cryothermometry (discrete integer data), Fatigue Life (right-skewed, distribution comparison), and Standard Resistor (triple assumption failure: drift + non-constant variation + r1=0.97). The template must handle all 7 cases through configuration, not code branching. Key per-study differences include: data file format (single value per line vs multi-value-per-line requiring flatten), the specific hypothesis tests run (some case studies skip distribution/outlier tests when randomness is severely violated), and the interpretation narrative (each case study has unique findings).

The two open questions from Phase 96 must be resolved: (1) Colab data file delivery -- the Phase 96 CONTEXT.md already locked the decision to "if local file not found, fetch from GitHub raw URL," so the data loading cell should try local file first and fall back to `urllib.request.urlretrieve` from the config's `githubRawUrl`. (2) Numerical precision -- use 4 significant digits for expected statistics comparisons, with tolerances using `np.isclose(rtol=1e-2)` for assertions to account for Python vs TypeScript floating-point differences.

**Primary recommendation:** Create a single `buildStandardNotebook(slug: string): NotebookV4` function that composes ~25-35 cells per notebook using the existing cell factories and registry configs, with cell content parameterized by CaseStudyConfig fields. Split the template into logical section builders (intro, data loading, summary stats, 4-plot, individual plots, hypothesis tests, interpretation, conclusions) for maintainability.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| NBSTD-01 | Normal Random Numbers notebook with full 4-plot analysis, hypothesis tests, and interpretation | Registry config `normal-random-numbers` provides all params; MDX page verified with complete section structure; all 4 assumptions pass in this baseline case |
| NBSTD-02 | Uniform Random Numbers notebook with distribution detection and non-normality analysis | Registry config `uniform-random-numbers` has `valuesPerLine: 5` for multi-value parsing; distribution section must show non-normality (flat histogram, curved probability plot) |
| NBSTD-03 | Heat Flow Meter notebook with mild non-randomness analysis | Registry config `heat-flow-meter` is single-value-per-line; MDX shows mild randomness violations in lag plot; all tests applied |
| NBSTD-04 | Filter Transmittance notebook with extreme autocorrelation detection | Registry config `filter-transmittance`; extreme autocorrelation r1=0.94; distribution/outlier tests skipped when randomness severely violated |
| NBSTD-05 | Cryothermometry notebook with discrete data analysis | Registry config `cryothermometry` has `valuesPerLine: 5`; discrete integer data creates artifacts in probability plots; needs interpretation of discreteness |
| NBSTD-06 | Fatigue Life notebook with distribution comparison and model selection | Registry config `fatigue-life`; right-skewed data requiring Weibull/Gamma/Birnbaum-Saunders comparison via probability plots and AIC/BIC |
| NBSTD-07 | Standard Resistor notebook with multi-assumption failure analysis | Registry config `standard-resistor` has 4 columns (Month, Day, Year, Resistance); extreme drift + seasonal variation + r1=0.97; distribution/outlier tests skipped |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| TypeScript | 5.9.x | Notebook builder functions, cell composition | Already in project; strict mode via Astro tsconfig |
| Vitest | 4.x | Unit tests for `buildStandardNotebook()` output validation | Already configured (`vitest.config.ts`) |

### Supporting (from Phase 96, already implemented)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `src/lib/eda/notebooks/cells.ts` | n/a | `markdownCell()`, `codeCell()`, `cellId()` factories | Every cell in every notebook |
| `src/lib/eda/notebooks/notebook.ts` | n/a | `createNotebook()` assembler | Wrapping cells into complete nbformat v4.5 |
| `src/lib/eda/notebooks/registry/` | n/a | `getCaseStudyConfig()`, `CASE_STUDY_REGISTRY` | All per-study parameters |
| `src/lib/eda/notebooks/theme.ts` | n/a | `THEME_SETUP_CODE`, `DEPENDENCY_CHECK_CODE` | First cells in every notebook |
| `src/lib/eda/notebooks/requirements.ts` | n/a | `REQUIREMENTS_TXT` | Bundled with ZIP in Phase 98 |

### Python Libraries (in generated notebook code)
| Library | Floor Pin | Purpose | Notes |
|---------|-----------|---------|-------|
| numpy | >=2.0.0 | Array operations, statistics | `np.mean`, `np.std`, `np.isclose` |
| scipy | >=1.14.0 | Hypothesis tests | `scipy.stats.anderson`, `scipy.stats.bartlett`, `scipy.stats.levene`, `scipy.stats.shapiro`, `scipy.stats.linregress` |
| pandas | >=2.2.0 | Data loading (`pd.read_fwf`), display | DataFrame operations, `.describe()` |
| matplotlib | >=3.9.0 | All plots (4-plot, individual, probability) | `plt.subplot`, `plt.figure`, `plt.savefig` not needed (display only) |
| seaborn | >=0.13.0 | Enhanced histograms, distribution overlays | `sns.histplot`, `sns.kdeplot` |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Manual runs test | statsmodels `runstest_1samp` | Out of scope per REQUIREMENTS.md -- keep deps minimal |
| scipy.stats.anderson | scipy.stats.kstest (KS test) | Anderson-Darling is more powerful for normality; matches NIST handbook analysis |
| Custom 4-plot function | Individual subplot calls | Custom function wraps 4 subplots, reusable across all 7 notebooks |

**Installation:**
No new npm packages needed. All tooling exists from Phase 96.

## Architecture Patterns

### Recommended Project Structure
```
src/lib/eda/notebooks/
  types.ts                     # (Phase 96) nbformat v4.5 interfaces
  cells.ts                     # (Phase 96) markdownCell(), codeCell() factories
  notebook.ts                  # (Phase 96) createNotebook() assembler
  requirements.ts              # (Phase 96) REQUIREMENTS_TXT
  theme.ts                     # (Phase 96) THEME_SETUP_CODE, DEPENDENCY_CHECK_CODE
  registry/                    # (Phase 96) 10 per-study configs
  templates/
    standard.ts                # buildStandardNotebook(slug) -- main entry point
    sections/
      intro.ts                 # Title, background, goals markdown cells
      setup.ts                 # Dependency check + theme + imports cells
      data-loading.ts          # Data load with Colab fallback + preview + assertion
      summary-stats.ts         # Summary statistics table cell
      four-plot.ts             # 4-plot code cell
      individual-plots.ts      # Run sequence, lag, histogram, probability plot cells
      hypothesis-tests.ts      # Location, variation, randomness, distribution, outlier test cells
      test-summary.ts          # Test summary table cell
      interpretation.ts        # Case-study-specific interpretation narrative
      conclusions.ts           # Key findings + next steps
  __tests__/
    standard-notebook.test.ts  # Tests for buildStandardNotebook()
```

### Pattern 1: Parameterized Template with Section Builders
**What:** A `buildStandardNotebook(slug)` function that looks up the CaseStudyConfig, then calls section builder functions in sequence to assemble cells. Each section builder takes the config and a mutable cell index counter, returns an array of cells.
**When to use:** For all 7 standard case studies.
**Example:**
```typescript
import { getCaseStudyConfig, type CaseStudyConfig } from '../registry';
import type { Cell, NotebookV4 } from '../types';
import { createNotebook } from '../notebook';
import { buildIntro } from './sections/intro';
import { buildSetup } from './sections/setup';
import { buildDataLoading } from './sections/data-loading';
import { buildSummaryStats } from './sections/summary-stats';
import { buildFourPlot } from './sections/four-plot';
import { buildIndividualPlots } from './sections/individual-plots';
import { buildHypothesisTests } from './sections/hypothesis-tests';
import { buildTestSummary } from './sections/test-summary';
import { buildInterpretation } from './sections/interpretation';
import { buildConclusions } from './sections/conclusions';

/**
 * Build a standard EDA case study notebook from registry config.
 * All 7 standard case studies use this single template.
 */
export function buildStandardNotebook(slug: string): NotebookV4 {
  const config = getCaseStudyConfig(slug);
  if (!config) {
    throw new Error(`Unknown case study slug: ${slug}`);
  }

  const cells: Cell[] = [];
  let cellIndex = 0;

  // Helper to add cells and advance the index
  const addCells = (sectionCells: Cell[]) => {
    cells.push(...sectionCells);
    cellIndex += sectionCells.length;
  };

  addCells(buildIntro(slug, cellIndex, config));
  addCells(buildSetup(slug, cellIndex, config));
  addCells(buildDataLoading(slug, cellIndex, config));
  addCells(buildSummaryStats(slug, cellIndex, config));
  addCells(buildFourPlot(slug, cellIndex, config));
  addCells(buildIndividualPlots(slug, cellIndex, config));
  addCells(buildHypothesisTests(slug, cellIndex, config));
  addCells(buildTestSummary(slug, cellIndex, config));
  addCells(buildInterpretation(slug, cellIndex, config));
  addCells(buildConclusions(slug, cellIndex, config));

  return createNotebook(cells);
}

export const STANDARD_SLUGS = [
  'normal-random-numbers',
  'uniform-random-numbers',
  'heat-flow-meter',
  'filter-transmittance',
  'cryothermometry',
  'fatigue-life',
  'standard-resistor',
] as const;
```

### Pattern 2: Section Builder Function Signature
**What:** Each section builder follows a consistent signature: takes slug, starting cell index, and config; returns an array of cells.
**When to use:** Every section builder in the `sections/` directory.
**Example:**
```typescript
import type { Cell } from '../../types';
import type { CaseStudyConfig } from '../../registry/types';
import { markdownCell, codeCell } from '../../cells';

/**
 * Build data loading cells with Colab fallback and row-count assertion.
 */
export function buildDataLoading(
  slug: string,
  startIndex: number,
  config: CaseStudyConfig,
): Cell[] {
  const cells: Cell[] = [];
  let idx = startIndex;

  // Markdown: explain data loading
  cells.push(markdownCell(slug, idx++, [
    `## Data Loading`,
    ``,
    `The dataset is loaded from the bundled \`${config.dataFile}\` file using `,
    `\`pd.read_fwf()\` (fixed-width format). If running in Google Colab, the data `,
    `is automatically downloaded from GitHub.`,
  ]));

  // Code: data loading with Colab fallback
  const loadLines = buildDataLoadCode(config);
  cells.push(codeCell(slug, idx++, loadLines));

  return cells;
}
```

### Pattern 3: Multi-Value-Per-Line Data Loading
**What:** Three datasets (RANDN, RANDU, SOULEN) have multiple values per line and need special parsing.
**When to use:** When `config.valuesPerLine` is defined.
**Example Python code generated:**
```python
# For single-value-per-line files (ZARR13, MAVRO, BIRNSAUN, DZIUBA1):
df = pd.read_fwf(data_path, skiprows=25, header=None, names=['Y'])

# For multi-value-per-line files (RANDN, RANDU, SOULEN):
df_raw = pd.read_fwf(data_path, skiprows=25, header=None)
data = df_raw.values.flatten()
data = data[~np.isnan(data)]  # Remove NaN padding from short last row
df = pd.DataFrame({'Y': data})

# For multi-column files (DZIUBA1):
df = pd.read_fwf(data_path, skiprows=25, header=None,
                  names=['Month', 'Day', 'Year', 'Resistance'])
```

### Pattern 4: Runs Test Manual Implementation
**What:** Manual implementation of the Wald-Wolfowitz runs test (statsmodels excluded per REQUIREMENTS.md).
**When to use:** In the randomness testing section of every notebook.
**Example Python code generated:**
```python
def runs_test(data):
    """Manual Wald-Wolfowitz runs test (above/below median)."""
    median = np.median(data)
    signs = np.array([1 if x >= median else 0 for x in data])
    n1 = np.sum(signs)       # count above/equal median
    n2 = len(signs) - n1     # count below median
    # Count runs
    runs = 1 + np.sum(signs[1:] != signs[:-1])
    # Expected runs and std dev under H0
    expected = (2 * n1 * n2) / (n1 + n2) + 1
    std = np.sqrt((2 * n1 * n2 * (2 * n1 * n2 - n1 - n2)) /
                  ((n1 + n2)**2 * (n1 + n2 - 1)))
    z = (runs - expected) / std
    return z, runs, expected
```

### Anti-Patterns to Avoid
- **Hardcoded case-study content in the template:** Do NOT embed case-study-specific text directly in the template function. All variable data comes from CaseStudyConfig. Narrative text for interpretation/conclusions is generated from config fields (title, expectedStats, test results) plus pattern-based text templates.
- **Branching on slug in the template:** Do NOT use `if (slug === 'filter-transmittance')` style switches. Instead, use config-driven flags (e.g., `config.testParams` presence determines whether location test has a target mean; severe autocorrelation detection drives whether distribution/outlier tests are included).
- **Duplicating theme/dependency code:** Do NOT rewrite theme or dependency check code -- import `THEME_SETUP_CODE` and `DEPENDENCY_CHECK_CODE` from `theme.ts`.
- **Generating pre-executed outputs:** Do NOT include any cell outputs in the generated notebooks. All cells have `outputs: []` and `execution_count: null`. Users execute the notebooks themselves.
- **Importing statsmodels:** Out of scope per REQUIREMENTS.md. The runs test must be implemented manually in the generated Python code.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| nbformat JSON structure | Custom JSON builder | Phase 96 `createNotebook()` + `markdownCell()` + `codeCell()` | Already built and tested; 60 tests passing |
| Cell ID generation | New ID scheme | Phase 96 `cellId(slug, index)` | Deterministic SHA-256 hash already implemented |
| Source line normalization | Manual newline handling | Phase 96 `normalizeSource()` inside cell factories | Handles edge cases (single-line, pre-terminated lines) |
| Case study metadata | Hardcoded values | Phase 96 `getCaseStudyConfig(slug)` | All 10 configs verified with 24 registry tests |
| Theme/dependency setup | Inline Python strings | Phase 96 `THEME_SETUP_CODE`, `DEPENDENCY_CHECK_CODE` | Tested and consistent with site colors |
| Bartlett's test implementation | Custom chi-squared test | `scipy.stats.bartlett` | Scipy's implementation handles all edge cases |
| Levene's test implementation | Custom F-test | `scipy.stats.levene` | Scipy's median-based variant is robust to non-normality |
| Anderson-Darling test | Custom normality test | `scipy.stats.anderson` | Scipy provides test statistic and critical values |
| Normal probability plot | Custom Q-Q plot | `scipy.stats.probplot` | Standard implementation with theoretical quantiles |

**Key insight:** Phase 96 built the entire generation infrastructure. Phase 97's job is content composition -- assembling Python code strings and markdown narrative into cells using existing factories. No new infrastructure is needed.

## Common Pitfalls

### Pitfall 1: Cell Index Counter Drift
**What goes wrong:** Cell IDs collide or are non-deterministic because section builders don't correctly track the cell index across sections.
**Why it happens:** Each section builder creates multiple cells, and the starting index for the next section must account for all cells created by previous sections.
**How to avoid:** Pass `startIndex` to each section builder and return the cell array. The main `buildStandardNotebook` function accumulates the total cell count. Use a mutable counter or accumulate: `cellIndex += sectionCells.length` after each section.
**Warning signs:** Duplicate cell IDs in the generated notebook JSON; `nbformat.validate()` warnings.

### Pitfall 2: Multi-Value-Per-Line Data Parsing
**What goes wrong:** RANDN.DAT (10 values/line), RANDU.DAT (5 values/line), and SOULEN.DAT (5 values/line) are read as DataFrames with multiple columns instead of being flattened to a single Series.
**Why it happens:** `pd.read_fwf()` naturally creates one column per value on each line. Without explicit flattening, the DataFrame has 10 or 5 columns instead of the expected single `Y` column with 500/700 rows.
**How to avoid:** When `config.valuesPerLine` is defined, generate code that reads into a raw DataFrame, flattens with `.values.flatten()`, removes NaN padding from the last row (which may have fewer values), and creates a new DataFrame with the correct column name.
**Warning signs:** Row count assertion fails (e.g., 50 rows instead of 500 for RANDN).

### Pitfall 3: Hypothesis Test Skipping for Autocorrelated Data
**What goes wrong:** Running normality tests (Anderson-Darling, Shapiro-Wilk) and outlier tests (Grubbs') on data with severe autocorrelation produces misleading results that the notebook presents as valid.
**Why it happens:** These tests assume independent observations. When autocorrelation is extreme (filter-transmittance r1=0.94, standard-resistor r1=0.97), the test assumptions are violated.
**How to avoid:** The template must detect when randomness tests show severe violation (lag-1 autocorrelation exceeds ~0.5 or runs test rejects strongly) and skip distribution/outlier tests. Print an explanation: "Distribution and outlier tests are omitted because the randomness assumption is severely violated (r1 = X.XX). These tests assume independent observations."
**Warning signs:** Notebooks presenting Anderson-Darling p-values as meaningful for autocorrelated data.

### Pitfall 4: Grubbs' Test Not in scipy
**What goes wrong:** Attempting to import `scipy.stats.grubbs_test` -- no such function exists in scipy.
**Why it happens:** Grubbs' test is not part of scipy.stats.
**How to avoid:** Implement Grubbs' test manually in the generated Python code: `G = max(|x_i - mean|) / s`, compare against tabulated critical values or use the t-distribution approximation. Alternatively, use the scipy.stats approach: compute the test statistic and compare against the Grubbs critical value formula based on the t-distribution.
**Warning signs:** ImportError at runtime when users execute the notebook.

### Pitfall 5: Python String Escaping in TypeScript
**What goes wrong:** Generated Python code has broken string literals because TypeScript template literals interact poorly with Python's backslashes, quotes, and f-string braces.
**Why it happens:** TypeScript uses backticks for template literals while Python uses f-strings with curly braces. Backslashes need double-escaping. Single quotes inside Python strings conflict with TypeScript string delimiters.
**How to avoid:** Use string arrays (string[]) consistently, matching the pattern from Phase 96's `THEME_SETUP_CODE`. Each line is a plain string element in the array. Use Python single quotes inside TypeScript double-quoted strings or vice versa. Avoid template literals for Python code.
**Warning signs:** SyntaxError when executing generated notebook cells in Jupyter.

### Pitfall 6: Bartlett vs Levene Test Selection
**What goes wrong:** Using Bartlett's test on non-normal data produces unreliable results, or using Levene's test inconsistently across notebooks.
**Why it happens:** Bartlett's test is sensitive to departures from normality. Some case studies (uniform, fatigue life) have non-normal distributions.
**How to avoid:** Follow the NIST handbook's approach per case study. The MDX pages document which test each case study uses: most use Bartlett's, but filter-transmittance and standard-resistor use Levene's (median variant). The template should use Bartlett's test by default and Levene's test when the data are known to be non-normal or when following the NIST approach.
**Warning signs:** Inconsistent test choices across notebooks compared to the site's MDX pages.

### Pitfall 7: Autocorrelation Critical Value Formula
**What goes wrong:** Using the wrong formula for the lag-1 autocorrelation critical value. The correct approximation is +/- 2/sqrt(N), not +/- 1.96/sqrt(N).
**Why it happens:** Confusion between the z-critical value (1.96) used in the runs test and the autocorrelation critical value approximation (2/sqrt(N)).
**How to avoid:** The MDX pages consistently use 2/sqrt(N). Generate code that computes `critical = 2 / np.sqrt(len(data))`.
**Warning signs:** Autocorrelation conclusions that differ from the website.

## Code Examples

### Data Loading with Colab Fallback and Multi-Value Handling
```typescript
// Generates Python code for data loading based on config
function buildDataLoadCode(config: CaseStudyConfig): string[] {
  const lines: string[] = [
    'import os',
    'import urllib.request',
    '',
    `DATA_FILE = '${config.dataFile}'`,
    `GITHUB_URL = '${config.githubRawUrl}'`,
    '',
    '# Try local file first, fall back to GitHub for Colab',
    'if not os.path.exists(DATA_FILE):',
    "    print(f'Downloading {DATA_FILE} from GitHub...')",
    '    urllib.request.urlretrieve(GITHUB_URL, DATA_FILE)',
    "    print('Download complete.')",
    '',
  ];

  if (config.valuesPerLine) {
    // Multi-value-per-line: read raw, flatten, remove NaN padding
    lines.push(
      `df_raw = pd.read_fwf(DATA_FILE, skiprows=${config.skipRows}, header=None)`,
      'data = df_raw.values.flatten()',
      'data = data[~np.isnan(data)]',
      `df = pd.DataFrame({'${config.responseVariable}': data})`,
    );
  } else if (config.columns.length > 1) {
    // Multi-column file (e.g., DZIUBA1.DAT)
    const colStr = config.columns.map(c => `'${c}'`).join(', ');
    lines.push(
      `df = pd.read_fwf(DATA_FILE, skiprows=${config.skipRows}, header=None,`,
      `                  names=[${colStr}])`,
    );
  } else {
    // Single-value-per-line, single column
    lines.push(
      `df = pd.read_fwf(DATA_FILE, skiprows=${config.skipRows}, header=None,`,
      `                  names=['${config.responseVariable}'])`,
    );
  }

  lines.push(
    '',
    `assert len(df) == ${config.expectedRows}, \\`,
    `    f'Expected ${config.expectedRows} rows, got {len(df)}'`,
    '',
    "print(f'Dataset shape: {df.shape}')",
    'print(f"Columns: {list(df.columns)}")',
    'df.head(10)',
  );

  return lines;
}
```

### 4-Plot Generation
```typescript
// Generates the 4-plot code cell
function buildFourPlotCode(config: CaseStudyConfig): string[] {
  const resp = config.responseVariable;
  return [
    `# 4-Plot: Run Sequence, Lag, Histogram, Normal Probability`,
    `fig, axes = plt.subplots(2, 2, figsize=(12, 10))`,
    `fig.suptitle('${config.plotTitles.fourPlot}', fontsize=16,`,
    `             color=QUANTUM_COLORS['text'])`,
    ``,
    `# Run Sequence Plot (upper left)`,
    `axes[0, 0].plot(data, color=QUANTUM_COLORS['accent'], linewidth=0.5,`,
    `                marker='.', markersize=2, alpha=0.7)`,
    `axes[0, 0].axhline(y=np.mean(data), color=QUANTUM_COLORS['teal'],`,
    `                    linestyle='--', linewidth=1, label=f'Mean = {np.mean(data):.4f}')`,
    `axes[0, 0].set_xlabel('Observation Order')`,
    `axes[0, 0].set_ylabel('${resp}')`,
    `axes[0, 0].set_title('Run Sequence Plot')`,
    `axes[0, 0].legend(fontsize=9)`,
    ``,
    `# Lag Plot (upper right)`,
    `axes[0, 1].scatter(data[:-1], data[1:], s=8, alpha=0.5,`,
    `                   color=QUANTUM_COLORS['accent'])`,
    `axes[0, 1].set_xlabel(f'{resp}(i)')`,
    `axes[0, 1].set_ylabel(f'{resp}(i+1)')`,
    `axes[0, 1].set_title('Lag Plot (lag=1)')`,
    ``,
    `# Histogram (lower left)`,
    `axes[1, 0].hist(data, bins='auto', color=QUANTUM_COLORS['accent'],`,
    `                edgecolor=QUANTUM_COLORS['border'], alpha=0.7)`,
    `axes[1, 0].set_xlabel('${resp}')`,
    `axes[1, 0].set_ylabel('Frequency')`,
    `axes[1, 0].set_title('Histogram')`,
    ``,
    `# Normal Probability Plot (lower right)`,
    `from scipy import stats`,
    `stats.probplot(data, dist='norm', plot=axes[1, 1])`,
    `axes[1, 1].get_lines()[0].set_color(QUANTUM_COLORS['accent'])`,
    `axes[1, 1].get_lines()[1].set_color(QUANTUM_COLORS['teal'])`,
    `axes[1, 1].set_title('Normal Probability Plot')`,
    ``,
    `plt.tight_layout()`,
    `plt.show()`,
  ];
}
```

### Hypothesis Test Cells: Location Test
```typescript
function buildLocationTestCode(config: CaseStudyConfig): string[] {
  return [
    '# Location Test: Linear regression of Y vs run order',
    "print('='*60)",
    "print('LOCATION TEST')",
    "print('H0: slope = 0 (constant location)')",
    "print('Ha: slope != 0 (location changes over time)')",
    "print('='*60)",
    '',
    'from scipy.stats import linregress',
    'x = np.arange(1, len(data) + 1)',
    'slope, intercept, r_value, p_value, std_err = linregress(x, data)',
    't_stat = slope / std_err',
    'n = len(data)',
    'from scipy.stats import t as t_dist',
    'critical_t = t_dist.ppf(0.975, df=n-2)',
    '',
    "print(f'Slope:     {slope:.6e}')",
    "print(f'Intercept: {intercept:.6f}')",
    "print(f't-value:   {t_stat:.4f}')",
    "print(f'Critical:  +/- {critical_t:.4f}')",
    "print(f'p-value:   {p_value:.6f}')",
    '',
    'if abs(t_stat) > critical_t:',
    "    print(f'\\nREJECT H0: Location is NOT constant (|t|={abs(t_stat):.4f} > {critical_t:.4f})')",
    'else:',
    "    print(f'\\nFail to reject H0: Location is constant (|t|={abs(t_stat):.4f} <= {critical_t:.4f})')",
  ];
}
```

### Manual Runs Test Implementation
```typescript
function buildRunsTestCode(): string[] {
  return [
    '# Runs Test (manual implementation -- statsmodels not required)',
    'def runs_test(data):',
    '    """Wald-Wolfowitz runs test for randomness (above/below median)."""',
    '    median = np.median(data)',
    '    signs = np.array([1 if x >= median else 0 for x in data])',
    '    n1 = int(np.sum(signs))       # count >= median',
    '    n2 = len(signs) - n1          # count < median',
    '    # Count runs (sequences of consecutive same-sign values)',
    '    runs = 1 + int(np.sum(signs[1:] != signs[:-1]))',
    '    # Expected value and std dev under H0 (random)',
    '    expected = (2 * n1 * n2) / (n1 + n2) + 1',
    '    std = np.sqrt((2 * n1 * n2 * (2 * n1 * n2 - n1 - n2)) /',
    '                  ((n1 + n2)**2 * (n1 + n2 - 1)))',
    '    z = (runs - expected) / std',
    '    return z, runs, expected, n1, n2',
    '',
    "print('Runs Test for Randomness')",
    "print('H0: sequence is random')",
    "print('Ha: sequence is not random')",
    'z_runs, num_runs, exp_runs, n_above, n_below = runs_test(data)',
    "print(f'Runs: {num_runs} (expected: {exp_runs:.1f})')",
    "print(f'Z-statistic: {z_runs:.4f}')",
    "print(f'Critical value: +/- 1.96')",
    '',
    'if abs(z_runs) > 1.96:',
    "    print(f'\\nREJECT H0: Data are NOT random (|Z|={abs(z_runs):.4f} > 1.96)')",
    'else:',
    "    print(f'\\nFail to reject H0: Data are consistent with random (|Z|={abs(z_runs):.4f} <= 1.96)')",
  ];
}
```

### Notebook Cell Structure (Expected ~25-35 cells per notebook)
```
Cell 0:  [markdown] Title + badge
Cell 1:  [markdown] Background + data description
Cell 2:  [code]     Dependency check + install
Cell 3:  [code]     Theme setup (THEME_SETUP_CODE)
Cell 4:  [code]     Imports (numpy, scipy, pandas, matplotlib, seaborn)
Cell 5:  [markdown] Data Loading explanation
Cell 6:  [code]     Data load with Colab fallback + preview + assertion
Cell 7:  [markdown] Summary Statistics explanation
Cell 8:  [code]     Summary stats computation + display
Cell 9:  [markdown] 4-Plot explanation
Cell 10: [code]     4-Plot generation
Cell 11: [markdown] 4-Plot interpretation
Cell 12: [markdown] Individual plots explanation
Cell 13: [code]     Run sequence plot
Cell 14: [code]     Lag plot
Cell 15: [code]     Histogram
Cell 16: [code]     Normal probability plot
Cell 17: [markdown] Hypothesis tests explanation
Cell 18: [code]     Location test (linregress)
Cell 19: [code]     Variation test (Bartlett's or Levene's)
Cell 20: [code]     Randomness tests (runs test + lag-1 autocorrelation)
Cell 21: [code]     Distribution test (Anderson-Darling) -- conditional
Cell 22: [code]     Outlier test (Grubbs') -- conditional
Cell 23: [markdown] Test summary table
Cell 24: [code]     Test summary table computation + print
Cell 25: [markdown] Interpretation narrative (case-study specific)
Cell 26: [markdown] Conclusions + next steps
```

## Resolving Open Questions from Phase 96

### Open Question 1: Colab Data File Delivery
**Resolution:** Use GitHub raw URL fetch via `urllib.request.urlretrieve`.
**Rationale:** The Phase 96 CONTEXT.md locked the decision: "Colab fallback: if local file not found, fetch from GitHub raw URL." Each config already has `githubRawUrl`. The data loading cell checks `os.path.exists(DATA_FILE)` first, then downloads from `config.githubRawUrl`. This works in both Colab (no local file) and local Jupyter (file bundled in ZIP from Phase 98). Using `urllib.request` avoids adding a `requests` dependency.
**Confidence:** HIGH -- pattern is standard and well-tested in Colab environments.

### Open Question 2: Numerical Precision Threshold
**Resolution:** Use 4 significant digits for display, `np.isclose(rtol=1e-2)` for assertions.
**Rationale:** NIST handbook values are reported to 4-6 significant digits. Python and TypeScript floating-point arithmetic may differ at the 5th+ digit. Using `rtol=1e-2` (1% relative tolerance) for the row-count assertion is exact (integer comparison). For statistical value assertions in printed output, display 4 significant figures with `:.4g` format. Do NOT assert exact match of computed statistics against expected values -- the notebook computes live and the expected values in the config are reference values for the student to compare against, not programmatic assertions.
**Confidence:** HIGH -- matches STATE.md recommendation of 3-4 sig digits.

## Notebook-Specific Variations

The template is parameterized, but some sections vary by case study. These variations are driven by config properties, not slug-based branching.

| Variation | Config Signal | Affected Case Studies | How Template Handles It |
|-----------|--------------|----------------------|------------------------|
| Multi-value-per-line parsing | `config.valuesPerLine` defined | normal-random, uniform-random, cryothermometry | Conditional `flatten()` code in data loading section |
| Multi-column DataFrame | `config.columns.length > 1` | standard-resistor | Column names passed to `read_fwf(names=[...])`, extract response variable |
| Distribution comparison plots | `config.slug` in fatigue-life set (or could add config flag) | fatigue-life | Additional Weibull/Gamma probability plots and AIC/BIC comparison |
| Skip distribution/outlier tests | Autocorrelation r1 > threshold (computed at runtime) | filter-transmittance, standard-resistor | Python runtime check: if `abs(r1) > 0.5`, skip and print explanation |
| Discrete data interpretation | `config.slug === 'cryothermometry'` (or config flag) | cryothermometry | Additional markdown noting integer-valued data affects plot interpretation |
| Target mean for location test | `config.testParams?.targetMean` defined | normal-random, uniform-random | One-sample t-test against target vs regression slope test |

**Important design decision:** The fatigue-life case study (NBSTD-06) requires distribution comparison (Weibull, Gamma, Birnbaum-Saunders) which is unique among the 7 standard notebooks. This could either: (a) be included in the standard template with a config flag, or (b) be handled as a minor extension. Recommendation: include it in the standard template with a config property like `distributionComparison: true` since it still follows the standard 4-plot + tests structure.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Python nbformat library for notebook creation | TypeScript direct JSON generation | Project decision (Phase 96) | No Python in CI; TypeScript generates valid JSON |
| statsmodels for runs test | Manual implementation in generated code | Project decision (REQUIREMENTS.md) | Keeps Python deps to 5 core scientific packages |
| Individual notebook files per case study | Single parameterized template | Phase 97 design | DRY; all 7 notebooks from one template + configs |
| Hardcoded plot colors | Quantum Explorer dark theme from config | Phase 96 theme.ts | Consistent branding across all notebooks |

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.x |
| Config file | `vitest.config.ts` (exists) |
| Quick run command | `npx vitest run src/lib/eda/notebooks/__tests__/standard-notebook.test.ts` |
| Full suite command | `npx vitest run` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| NBSTD-01 | `buildStandardNotebook('normal-random-numbers')` returns valid nbformat v4.5 with correct cell sequence | unit | `npx vitest run src/lib/eda/notebooks/__tests__/standard-notebook.test.ts -t "normal-random"` | Wave 0 |
| NBSTD-02 | `buildStandardNotebook('uniform-random-numbers')` returns notebook with non-normality analysis cells | unit | `npx vitest run src/lib/eda/notebooks/__tests__/standard-notebook.test.ts -t "uniform-random"` | Wave 0 |
| NBSTD-03 | `buildStandardNotebook('heat-flow-meter')` returns notebook with mild non-randomness analysis | unit | `npx vitest run src/lib/eda/notebooks/__tests__/standard-notebook.test.ts -t "heat-flow"` | Wave 0 |
| NBSTD-04 | `buildStandardNotebook('filter-transmittance')` returns notebook with autocorrelation analysis | unit | `npx vitest run src/lib/eda/notebooks/__tests__/standard-notebook.test.ts -t "filter"` | Wave 0 |
| NBSTD-05 | `buildStandardNotebook('cryothermometry')` returns notebook with discrete data analysis | unit | `npx vitest run src/lib/eda/notebooks/__tests__/standard-notebook.test.ts -t "cryo"` | Wave 0 |
| NBSTD-06 | `buildStandardNotebook('fatigue-life')` returns notebook with distribution comparison section | unit | `npx vitest run src/lib/eda/notebooks/__tests__/standard-notebook.test.ts -t "fatigue"` | Wave 0 |
| NBSTD-07 | `buildStandardNotebook('standard-resistor')` returns notebook with multi-assumption failure analysis | unit | `npx vitest run src/lib/eda/notebooks/__tests__/standard-notebook.test.ts -t "resistor"` | Wave 0 |
| ALL | Every notebook has nbformat: 4, nbformat_minor: 5, valid cell IDs, and correct structure | unit | `npx vitest run src/lib/eda/notebooks/__tests__/standard-notebook.test.ts -t "structure"` | Wave 0 |
| ALL | Every notebook contains interleaved markdown and code cells in expected order | unit | `npx vitest run src/lib/eda/notebooks/__tests__/standard-notebook.test.ts -t "interleaved"` | Wave 0 |
| ALL | Data loading cells contain row-count assertion matching config.expectedRows | unit | `npx vitest run src/lib/eda/notebooks/__tests__/standard-notebook.test.ts -t "row-count"` | Wave 0 |

### Testing Strategy
Tests validate the TypeScript output (notebook JSON structure), NOT the Python execution. Specifically:
- Each notebook has `nbformat: 4, nbformat_minor: 5`
- Cells array is non-empty with correct interleaving of markdown and code
- Data loading code cells contain `assert len(df) == {expectedRows}`
- Hypothesis test cells contain expected scipy function calls
- Runs test cell contains manual implementation (no statsmodels import)
- Theme setup cell matches `THEME_SETUP_CODE`
- All cell IDs are unique within each notebook
- All cell IDs match the `^[a-zA-Z0-9]+$` pattern
- Source lines are properly newline-terminated (except last)
- No empty source arrays
- JSON.stringify produces valid JSON

### Sampling Rate
- **Per task commit:** `npx vitest run src/lib/eda/notebooks/__tests__/standard-notebook.test.ts`
- **Per wave merge:** `npx vitest run`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/lib/eda/notebooks/__tests__/standard-notebook.test.ts` -- covers all NBSTD-01 through NBSTD-07
- [ ] `src/lib/eda/notebooks/templates/standard.ts` -- main entry point
- [ ] `src/lib/eda/notebooks/templates/sections/*.ts` -- all section builders

## Open Questions

1. **Fatigue Life distribution comparison scope**
   - What we know: The MDX page includes Weibull, Gamma, Birnbaum-Saunders, and Normal distribution comparisons with probability plots and AIC/BIC
   - What's unclear: Whether this level of distribution comparison belongs in the "standard" template or is too specialized
   - Recommendation: Include it in the standard template with a `distributionComparison` config flag. The fatigue-life case study is explicitly in the NBSTD requirements (not NBADV), so it must be handled by the standard template. The distribution comparison uses scipy.stats functions already in the dependency list.

2. **Grubbs' test implementation**
   - What we know: Not available in scipy.stats; used in normal-random-numbers, uniform-random-numbers, heat-flow-meter, fatigue-life MDX pages
   - What's unclear: The exact critical value table or formula for arbitrary n
   - Recommendation: Implement using the t-distribution approximation: `G_critical = ((n-1)/sqrt(n)) * sqrt(t_crit^2 / (n - 2 + t_crit^2))` where `t_crit = t.ppf(1 - alpha/(2*n), n-2)`. This is the standard Grubbs' critical value formula. Include this as a helper function in the generated Python code alongside the runs test.

3. **Interpretation narrative generation**
   - What we know: Each case study has a unique interpretation in the MDX page (2-3 paragraphs)
   - What's unclear: Whether the interpretation should be fully parameterized from config or have case-study-specific text
   - Recommendation: Use a hybrid approach. Store case-study-specific interpretation key points in the CaseStudyConfig (or a companion map). The template generates the narrative structure (which assumptions pass/fail, what the implications are) from computed results + config-provided insight text. This keeps the template parameterized while allowing unique interpretations.

## Sources

### Primary (HIGH confidence)
- Phase 96 codebase: `src/lib/eda/notebooks/` -- all foundation files verified (60 tests passing)
- Phase 96 research: `.planning/phases/96-notebook-foundation/96-RESEARCH.md` -- nbformat v4.5 schema, registry data
- MDX case study pages: `src/data/eda/pages/case-studies/*.mdx` -- complete section structure, test values, interpretations for all 7 standard case studies
- NIST .DAT files: `handbook/datasets/` -- verified file formats, skiprows, column layouts
- Phase 96 CONTEXT.md: locked decisions on cell structure, data loading, Python setup

### Secondary (MEDIUM confidence)
- [scipy.stats.anderson](https://docs.scipy.org/doc/scipy/reference/generated/scipy.stats.anderson.html) -- Anderson-Darling test API (v1.17.0)
- [scipy.stats.levene](https://docs.scipy.org/doc/scipy/reference/generated/scipy.stats.levene.html) -- Levene test API (v1.17.0)
- [pandas.read_fwf](https://pandas.pydata.org/docs/reference/api/pandas.read_fwf.html) -- Fixed-width format reader API (v3.0.1)

### Tertiary (LOW confidence)
- Grubbs' test critical value formula: standard statistical reference, needs validation against NIST handbook values during implementation

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all tools already exist from Phase 96; no new dependencies
- Architecture: HIGH -- pattern (parameterized template with section builders) is well-understood; section structure verified from 7 MDX case study pages
- Pitfalls: HIGH -- all 7 pitfalls identified from concrete analysis of data file formats, scipy API limitations, and MDX page content discrepancies
- Test strategy: HIGH -- structure-based testing (validate JSON output, not Python execution) is appropriate and feasible
- Python code correctness: MEDIUM -- generated Python code templates are based on MDX page content and scipy docs, but runtime validation requires manual notebook execution (Phase 99 or manual verification)

**Research date:** 2026-03-14
**Valid until:** 2026-04-14 (stable domain -- nbformat v4.5, scipy API, NIST data all stable)
