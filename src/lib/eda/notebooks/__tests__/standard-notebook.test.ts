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

  // Multi-value parsing
  it('normal-random-numbers data loading contains flatten()', () => {
    const nb = buildStandardNotebook('normal-random-numbers');
    expect(getCodeSources(nb)).toContain('flatten()');
  });

  it('uniform-random-numbers data loading contains flatten()', () => {
    const nb = buildStandardNotebook('uniform-random-numbers');
    expect(getCodeSources(nb)).toContain('flatten()');
  });

  it('cryothermometry data loading contains flatten()', () => {
    const nb = buildStandardNotebook('cryothermometry');
    expect(getCodeSources(nb)).toContain('flatten()');
  });

  it('heat-flow-meter data loading does NOT contain flatten()', () => {
    const nb = buildStandardNotebook('heat-flow-meter');
    expect(getCodeSources(nb)).not.toContain('flatten()');
  });

  // Multi-column
  it('standard-resistor data loading contains column names', () => {
    const nb = buildStandardNotebook('standard-resistor');
    const src = getCodeSources(nb);
    expect(src).toContain('Month');
    expect(src).toContain('Day');
    expect(src).toContain('Year');
    expect(src).toContain('Resistance');
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
