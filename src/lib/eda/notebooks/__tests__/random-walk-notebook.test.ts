import { describe, it, expect } from 'vitest';
import { buildRandomWalkNotebook } from '../templates/advanced/random-walk';
import type { NotebookV4, Cell } from '../types';

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

describe('Random Walk Advanced Notebook', () => {
  const notebook = buildRandomWalkNotebook();

  describe('notebook structure', () => {
    it('returns nbformat 4, minor 5', () => {
      expect(notebook.nbformat).toBe(4);
      expect(notebook.nbformat_minor).toBe(5);
    });

    it('has at least 20 cells', () => {
      expect(notebook.cells.length).toBeGreaterThanOrEqual(20);
    });

    it('all cell IDs are unique', () => {
      const ids = notebook.cells.map((c) => c.id);
      expect(new Set(ids).size).toBe(ids.length);
    });

    it('first markdown cell contains "Random Walk"', () => {
      expect(notebook.cells[0].cell_type).toBe('markdown');
      const src = Array.isArray(notebook.cells[0].source)
        ? notebook.cells[0].source.join('')
        : notebook.cells[0].source;
      expect(src).toContain('Random Walk');
    });
  });

  describe('AR(1) model fitting', () => {
    it('contains "linregress" in a code cell (AR(1) fitting)', () => {
      expect(getCodeSources(notebook)).toContain('linregress');
    });

    it('contains "y[:-1]" and "y[1:]" in a code cell (lag regression)', () => {
      const code = getCodeSources(notebook);
      expect(code).toContain('y[:-1]');
      expect(code).toContain('y[1:]');
    });

    it('contains "residuals" in a code cell (residual computation)', () => {
      expect(getCodeSources(notebook)).toContain('residuals');
    });

    it('contains "ddof=2" in a code cell (2 parameters estimated for residual SD)', () => {
      expect(getCodeSources(notebook)).toContain('ddof=2');
    });
  });

  describe('NIST reference values', () => {
    it('contains "0.050165" in a markdown cell (NIST A0 reference)', () => {
      expect(getMarkdownSources(notebook)).toContain('0.050165');
    });

    it('contains "0.987087" in a markdown cell (NIST A1 reference)', () => {
      expect(getMarkdownSources(notebook)).toContain('0.987087');
    });

    it('contains "0.2931" in a markdown cell (NIST residual SD reference)', () => {
      expect(getMarkdownSources(notebook)).toContain('0.2931');
    });
  });

  describe('predicted vs original plot', () => {
    it('contains "y_pred" and "plot" or "scatter" in a code cell', () => {
      const code = getCodeSources(notebook);
      expect(code).toContain('y_pred');
      expect(code).toMatch(/plot|scatter/);
    });
  });

  describe('residual distribution analysis', () => {
    it('mentions "uniform" distribution for residuals in a markdown cell', () => {
      expect(getMarkdownSources(notebook)).toMatch(/uniform/i);
    });

    it('generates a uniform probability plot of residuals in a code cell', () => {
      const code = getCodeSources(notebook);
      // Should use scipy.stats.uniform for the probability plot
      expect(code).toMatch(/uniform/i);
      expect(code).toContain('probplot');
    });
  });

  describe('residual 4-plot', () => {
    it('contains residual 4-plot code cell (fig with 4 subplots for residuals)', () => {
      const code = getCodeSources(notebook);
      // The residual 4-plot should have a 2x2 subplot grid applied to residuals
      expect(code).toMatch(/residual/i);
      expect(code).toContain('subplots(2, 2');
    });
  });
});
