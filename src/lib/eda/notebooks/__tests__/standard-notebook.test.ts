import { describe, it, expect } from 'vitest';
import { buildStandardNotebook, STANDARD_SLUGS } from '../templates/standard';
import type { NotebookV4, Cell } from '../types';

/** All 7 standard case study slugs */
const SLUGS = [
  'normal-random-numbers',
  'uniform-random-numbers',
  'heat-flow-meter',
  'filter-transmittance',
  'cryothermometry',
  'fatigue-life',
  'standard-resistor',
] as const;

/** Concatenate all cell sources into one string for content searching */
function getAllSource(notebook: NotebookV4): string {
  return notebook.cells
    .map((c) => (Array.isArray(c.source) ? c.source.join('') : c.source))
    .join('\n');
}

/** Get concatenated source of code cells only */
function getCodeSources(notebook: NotebookV4): string {
  return notebook.cells
    .filter((c): c is Extract<Cell, { cell_type: 'code' }> => c.cell_type === 'code')
    .map((c) => (Array.isArray(c.source) ? c.source.join('') : c.source))
    .join('\n');
}

/** Get concatenated source of markdown cells only */
function getMarkdownSources(notebook: NotebookV4): string {
  return notebook.cells
    .filter((c): c is Extract<Cell, { cell_type: 'markdown' }> => c.cell_type === 'markdown')
    .map((c) => (Array.isArray(c.source) ? c.source.join('') : c.source))
    .join('\n');
}

describe('STANDARD_SLUGS constant', () => {
  it('contains exactly 7 slugs', () => {
    expect(STANDARD_SLUGS).toHaveLength(7);
  });

  it('contains all 7 expected slugs', () => {
    for (const slug of SLUGS) {
      expect(STANDARD_SLUGS).toContain(slug);
    }
  });
});

describe('buildStandardNotebook structure', () => {
  it.each(SLUGS)('%s returns nbformat 4 minor 5', (slug) => {
    const nb = buildStandardNotebook(slug);
    expect(nb.nbformat).toBe(4);
    expect(nb.nbformat_minor).toBe(5);
  });

  it.each(SLUGS)('%s has at least 15 cells', (slug) => {
    const nb = buildStandardNotebook(slug);
    expect(nb.cells.length).toBeGreaterThanOrEqual(15);
  });

  it.each(SLUGS)('%s first cell is markdown (title)', (slug) => {
    const nb = buildStandardNotebook(slug);
    expect(nb.cells[0].cell_type).toBe('markdown');
  });

  it.each(SLUGS)('%s all cell IDs are unique', (slug) => {
    const nb = buildStandardNotebook(slug);
    const ids = nb.cells.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it.each(SLUGS)('%s all cell IDs match /^[a-zA-Z0-9]+$/', (slug) => {
    const nb = buildStandardNotebook(slug);
    for (const cell of nb.cells) {
      expect(cell.id).toMatch(/^[a-zA-Z0-9]+$/);
    }
  });

  it.each(SLUGS)('%s no empty source arrays', (slug) => {
    const nb = buildStandardNotebook(slug);
    for (const cell of nb.cells) {
      const src = Array.isArray(cell.source) ? cell.source : [cell.source];
      expect(src.length, `Cell ${cell.id} has empty source`).toBeGreaterThan(0);
    }
  });

  it.each(SLUGS)('%s JSON.stringify produces valid JSON', (slug) => {
    const nb = buildStandardNotebook(slug);
    const json = JSON.stringify(nb);
    expect(() => JSON.parse(json)).not.toThrow();
  });
});

describe('data loading', () => {
  it('normal-random-numbers contains assert len(df) == 500', () => {
    const nb = buildStandardNotebook('normal-random-numbers');
    expect(getAllSource(nb)).toContain('assert len(df) == 500');
  });

  it('uniform-random-numbers contains assert len(df) == 500', () => {
    const nb = buildStandardNotebook('uniform-random-numbers');
    expect(getAllSource(nb)).toContain('assert len(df) == 500');
  });

  it('heat-flow-meter contains assert len(df) == 195', () => {
    const nb = buildStandardNotebook('heat-flow-meter');
    expect(getAllSource(nb)).toContain('assert len(df) == 195');
  });

  it('filter-transmittance contains assert len(df) == 50', () => {
    const nb = buildStandardNotebook('filter-transmittance');
    expect(getAllSource(nb)).toContain('assert len(df) == 50');
  });

  it('cryothermometry contains assert len(df) == 700', () => {
    const nb = buildStandardNotebook('cryothermometry');
    expect(getAllSource(nb)).toContain('assert len(df) == 700');
  });

  it('fatigue-life contains assert len(df) == 101', () => {
    const nb = buildStandardNotebook('fatigue-life');
    expect(getAllSource(nb)).toContain('assert len(df) == 101');
  });

  it('standard-resistor contains assert len(df) == 1000', () => {
    const nb = buildStandardNotebook('standard-resistor');
    expect(getAllSource(nb)).toContain('assert len(df) == 1000');
  });

  // CSV-based data loading from GitHub URL
  it('all notebooks use pd.read_csv for data loading', () => {
    for (const slug of SLUGS) {
      const nb = buildStandardNotebook(slug);
      expect(getCodeSources(nb)).toContain('pd.read_csv');
    }
  });

  it('data loading uses GitHub raw URL', () => {
    const nb = buildStandardNotebook('normal-random-numbers');
    const src = getCodeSources(nb);
    expect(src).toContain('DATA_URL');
    expect(src).toContain('raw.githubusercontent.com');
  });
});

describe('setup and theme', () => {
  it.each(SLUGS)('%s contains QUANTUM_COLORS in a code cell', (slug) => {
    const nb = buildStandardNotebook(slug);
    expect(getCodeSources(nb)).toContain('QUANTUM_COLORS');
  });

  it.each(SLUGS)('%s contains !pip install in a code cell', (slug) => {
    const nb = buildStandardNotebook(slug);
    expect(getCodeSources(nb)).toContain('!pip install');
  });

  it.each(SLUGS)('%s contains import numpy as np in a code cell', (slug) => {
    const nb = buildStandardNotebook(slug);
    expect(getCodeSources(nb)).toContain('import numpy as np');
  });
});

describe('visualization sections', () => {
  it.each(SLUGS)('%s contains probplot (probability plot)', (slug) => {
    const nb = buildStandardNotebook(slug);
    expect(getCodeSources(nb)).toContain('probplot');
  });

  it.each(SLUGS)('%s contains plt.subplots(2, 2 (4-plot grid)', (slug) => {
    const nb = buildStandardNotebook(slug);
    expect(getCodeSources(nb)).toContain('plt.subplots(2, 2');
  });

  it.each(SLUGS)('%s contains Run Sequence in a markdown cell', (slug) => {
    const nb = buildStandardNotebook(slug);
    expect(getMarkdownSources(nb)).toContain('Run Sequence');
  });

  it.each(SLUGS)('%s has at least 4 code cells after the 4-plot section (individual plots)', (slug) => {
    const nb = buildStandardNotebook(slug);
    // Find the 4-plot cell (contains plt.subplots(2, 2)
    const fourPlotIndex = nb.cells.findIndex((c) => {
      if (c.cell_type !== 'code') return false;
      const src = Array.isArray(c.source) ? c.source.join('') : c.source;
      return src.includes('plt.subplots(2, 2');
    });
    expect(fourPlotIndex).toBeGreaterThan(-1);

    // Count code cells after the 4-plot cell
    const codeCellsAfter = nb.cells
      .slice(fourPlotIndex + 1)
      .filter((c) => c.cell_type === 'code');
    expect(codeCellsAfter.length).toBeGreaterThanOrEqual(4);
  });
});

// ============================================================
// Plan 02: Hypothesis tests, test summary, interpretation, conclusions
// ============================================================

describe('hypothesis tests', () => {
  // Location test: every notebook uses scipy linregress
  it.each(SLUGS)('%s contains linregress in a code cell (location test)', (slug) => {
    const nb = buildStandardNotebook(slug);
    expect(getCodeSources(nb)).toContain('linregress');
  });

  // Variation test: every notebook uses bartlett or levene
  it.each(SLUGS)('%s contains bartlett or levene in a code cell (variation test)', (slug) => {
    const nb = buildStandardNotebook(slug);
    const code = getCodeSources(nb);
    expect(code).toMatch(/bartlett|levene/i);
  });

  // Randomness test: manual runs test (no statsmodels)
  it.each(SLUGS)('%s contains def runs_test(data): in a code cell (manual runs test)', (slug) => {
    const nb = buildStandardNotebook(slug);
    expect(getCodeSources(nb)).toContain('def runs_test(');
  });

  // No statsmodels in any notebook
  it.each(SLUGS)('%s does NOT contain statsmodels in any cell', (slug) => {
    const nb = buildStandardNotebook(slug);
    expect(getAllSource(nb)).not.toContain('statsmodels');
  });

  // Autocorrelation critical value: 2/sqrt(N)
  it.each(SLUGS)('%s contains 2 / np.sqrt or 2/np.sqrt (autocorrelation critical value)', (slug) => {
    const nb = buildStandardNotebook(slug);
    const code = getCodeSources(nb);
    expect(code).toMatch(/2\s*\/\s*np\.sqrt/);
  });

  // Distribution tests: applied for some, skipped for others
  it('normal-random-numbers contains anderson in code cell', () => {
    const nb = buildStandardNotebook('normal-random-numbers');
    expect(getCodeSources(nb)).toContain('anderson');
  });

  it('normal-random-numbers contains grubbs or Grubbs in code cell', () => {
    const nb = buildStandardNotebook('normal-random-numbers');
    expect(getCodeSources(nb)).toMatch(/[Gg]rubbs/);
  });

  it('uniform-random-numbers contains anderson in code cell', () => {
    const nb = buildStandardNotebook('uniform-random-numbers');
    expect(getCodeSources(nb)).toContain('anderson');
  });

  it('heat-flow-meter contains anderson in code cell', () => {
    const nb = buildStandardNotebook('heat-flow-meter');
    expect(getCodeSources(nb)).toContain('anderson');
  });

  it('cryothermometry contains anderson in code cell', () => {
    const nb = buildStandardNotebook('cryothermometry');
    expect(getCodeSources(nb)).toContain('anderson');
  });

  // Filter-transmittance: skip distribution/outlier due to severe autocorrelation
  it('filter-transmittance does NOT contain anderson in code cell (skipped)', () => {
    const nb = buildStandardNotebook('filter-transmittance');
    expect(getCodeSources(nb)).not.toContain('anderson');
  });

  it('filter-transmittance contains autocorrelation and skipped/omitted in cell source', () => {
    const nb = buildStandardNotebook('filter-transmittance');
    const all = getAllSource(nb);
    expect(all).toMatch(/autocorrelation/i);
    expect(all).toMatch(/skipped|omitted/i);
  });

  // Standard-resistor: skip distribution/outlier due to severe autocorrelation
  it('standard-resistor does NOT contain anderson in code cell (skipped)', () => {
    const nb = buildStandardNotebook('standard-resistor');
    expect(getCodeSources(nb)).not.toContain('anderson');
  });

  it('standard-resistor contains autocorrelation and skipped/omitted in cell source', () => {
    const nb = buildStandardNotebook('standard-resistor');
    const all = getAllSource(nb);
    expect(all).toMatch(/autocorrelation/i);
    expect(all).toMatch(/skipped|omitted/i);
  });

  // Fatigue-life: Weibull/Gamma distribution comparison
  it('fatigue-life contains weibull or Weibull in code cell', () => {
    const nb = buildStandardNotebook('fatigue-life');
    expect(getCodeSources(nb)).toMatch(/[Ww]eibull/);
  });

  it('fatigue-life contains gamma or Gamma in code cell', () => {
    const nb = buildStandardNotebook('fatigue-life');
    expect(getCodeSources(nb)).toMatch(/[Gg]amma/);
  });
});

describe('test summary', () => {
  it.each(SLUGS)('%s contains a cell with Test Summary', (slug) => {
    const nb = buildStandardNotebook(slug);
    expect(getAllSource(nb)).toMatch(/Test Summary/);
  });

  it.each(SLUGS)('%s contains Location, Variation, and Randomness in a code cell (summary table)', (slug) => {
    const nb = buildStandardNotebook(slug);
    const code = getCodeSources(nb);
    expect(code).toContain('Location');
    expect(code).toContain('Variation');
    expect(code).toContain('Randomness');
  });
});

describe('per-study interpretation (NBSTD-01 through NBSTD-07)', () => {
  it('NBSTD-01: normal-random-numbers interpretation contains assumptions and satisfied/pass', () => {
    const nb = buildStandardNotebook('normal-random-numbers');
    const all = getAllSource(nb);
    expect(all).toMatch(/assumptions/i);
    expect(all).toMatch(/satisfied|pass/i);
  });

  it('NBSTD-02: uniform-random-numbers interpretation contains non-normal or non-normality', () => {
    const nb = buildStandardNotebook('uniform-random-numbers');
    expect(getAllSource(nb)).toMatch(/non-normal|non-normality/i);
  });

  it('NBSTD-03: heat-flow-meter interpretation contains non-random or randomness', () => {
    const nb = buildStandardNotebook('heat-flow-meter');
    expect(getAllSource(nb)).toMatch(/non-random|randomness/i);
  });

  it('NBSTD-04: filter-transmittance interpretation contains autocorrelation and serial', () => {
    const nb = buildStandardNotebook('filter-transmittance');
    const all = getAllSource(nb);
    expect(all).toMatch(/autocorrelation/i);
    expect(all).toMatch(/serial/i);
  });

  it('NBSTD-05: cryothermometry interpretation contains discrete and integer', () => {
    const nb = buildStandardNotebook('cryothermometry');
    const all = getAllSource(nb);
    expect(all).toMatch(/discrete/i);
    expect(all).toMatch(/integer/i);
  });

  it('NBSTD-06: fatigue-life interpretation contains skewed and Weibull/reliability', () => {
    const nb = buildStandardNotebook('fatigue-life');
    const all = getAllSource(nb);
    expect(all).toMatch(/right-skewed|skewed/i);
    expect(all).toMatch(/Weibull|reliability/i);
  });

  it('NBSTD-07: standard-resistor interpretation contains drift and non-stationary/trend', () => {
    const nb = buildStandardNotebook('standard-resistor');
    const all = getAllSource(nb);
    expect(all).toMatch(/drift/i);
    expect(all).toMatch(/non-stationary|trend/i);
  });
});

describe('conclusions', () => {
  it.each(SLUGS)('%s contains Conclusions or Key Findings in markdown', (slug) => {
    const nb = buildStandardNotebook(slug);
    expect(getMarkdownSources(nb)).toMatch(/## Conclusions|## Key Findings/);
  });

  it.each(SLUGS)('%s contains nistUrl in a markdown cell (reference link)', (slug) => {
    const nb = buildStandardNotebook(slug);
    // Build the notebook and get its config's nistUrl via content check
    const md = getMarkdownSources(nb);
    expect(md).toMatch(/itl\.nist\.gov/);
  });
});

describe('cell count', () => {
  it.each(SLUGS)('%s has at least 25 cells', (slug) => {
    const nb = buildStandardNotebook(slug);
    expect(nb.cells.length).toBeGreaterThanOrEqual(25);
  });
});
