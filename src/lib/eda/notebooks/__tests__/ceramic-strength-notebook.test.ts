import { describe, it, expect } from 'vitest';
import { buildCeramicStrengthNotebook } from '../templates/advanced/ceramic-strength';
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

describe('buildCeramicStrengthNotebook structure', () => {
  it('returns nbformat 4 minor 5', () => {
    const nb = buildCeramicStrengthNotebook();
    expect(nb.nbformat).toBe(4);
    expect(nb.nbformat_minor).toBe(5);
  });

  it('has at least 25 cells (11 sections, each 2+ cells)', () => {
    const nb = buildCeramicStrengthNotebook();
    expect(nb.cells.length).toBeGreaterThanOrEqual(25);
  });

  it('second markdown cell contains "Ceramic Strength" (title after branding)', () => {
    const nb = buildCeramicStrengthNotebook();
    const mdCells = nb.cells.filter((c) => c.cell_type === 'markdown');
    const src = Array.isArray(mdCells[1].source) ? mdCells[1].source.join('') : mdCells[1].source;
    expect(src).toContain('Ceramic Strength');
  });

  it('all cells have unique IDs', () => {
    const nb = buildCeramicStrengthNotebook();
    const ids = nb.cells.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('all cell IDs match /^[a-zA-Z0-9]+$/', () => {
    const nb = buildCeramicStrengthNotebook();
    for (const cell of nb.cells) {
      expect(cell.id).toMatch(/^[a-zA-Z0-9]+$/);
    }
  });

  it('JSON.stringify produces valid JSON', () => {
    const nb = buildCeramicStrengthNotebook();
    const json = JSON.stringify(nb);
    expect(() => JSON.parse(json)).not.toThrow();
  });
});

describe('custom DOE intro (not standard 5 EDA goals)', () => {
  it('third markdown cell contains DOE goals (strongest factor / factor rankings / optimal settings)', () => {
    const nb = buildCeramicStrengthNotebook();
    const mdCells = nb.cells.filter((c) => c.cell_type === 'markdown');
    const secondMdSrc = Array.isArray(mdCells[2].source)
      ? mdCells[2].source.join('')
      : mdCells[1].source;
    // Must contain DOE-specific goals, not standard 5 EDA goals
    expect(secondMdSrc).toMatch(/strongest factor|factor rankings|optimal settings/i);
  });

  it('does NOT contain the standard "5 EDA goals" (Location: What is a typical value)', () => {
    const nb = buildCeramicStrengthNotebook();
    const mdSrc = getMarkdownSources(nb);
    expect(mdSrc).not.toContain('What is a typical value');
  });
});

describe('no standard hypothesis tests', () => {
  it('no code cell contains "shapiro"', () => {
    const nb = buildCeramicStrengthNotebook();
    expect(getCodeSources(nb).toLowerCase()).not.toContain('shapiro');
  });

  it('no code cell contains "anderson"', () => {
    const nb = buildCeramicStrengthNotebook();
    expect(getCodeSources(nb).toLowerCase()).not.toContain('anderson');
  });

  it('no code cell contains "grubbs"', () => {
    const nb = buildCeramicStrengthNotebook();
    expect(getCodeSources(nb).toLowerCase()).not.toContain('grubbs');
  });
});

describe('batch effect analysis', () => {
  it('at least one code cell contains "ttest_ind" (two-sample t-test for batch means)', () => {
    const nb = buildCeramicStrengthNotebook();
    expect(getCodeSources(nb)).toContain('ttest_ind');
  });

  it('at least one code cell contains "boxplot" or "sns.boxplot" (batch box plots)', () => {
    const nb = buildCeramicStrengthNotebook();
    expect(getCodeSources(nb)).toMatch(/boxplot|sns\.boxplot/);
  });

  it('at least one markdown cell contains "688.9987" (NIST Batch 1 mean)', () => {
    const nb = buildCeramicStrengthNotebook();
    expect(getMarkdownSources(nb)).toContain('688.9987');
  });

  it('at least one markdown cell contains "611.1559" (NIST Batch 2 mean)', () => {
    const nb = buildCeramicStrengthNotebook();
    expect(getMarkdownSources(nb)).toContain('611.1559');
  });

  it('at least one markdown cell contains "13.3806" (NIST batch t-test T statistic)', () => {
    const nb = buildCeramicStrengthNotebook();
    expect(getMarkdownSources(nb)).toContain('13.3806');
  });
});

describe('DOE factor analysis', () => {
  it('at least one code cell contains "f_oneway" (one-way ANOVA)', () => {
    const nb = buildCeramicStrengthNotebook();
    expect(getCodeSources(nb)).toContain('f_oneway');
  });

  it('at least one code cell contains "groupby" and "mean" (DOE mean plots)', () => {
    const nb = buildCeramicStrengthNotebook();
    const code = getCodeSources(nb);
    expect(code).toContain('groupby');
    expect(code).toContain('mean');
  });

  it('at least one code cell contains "unstack" or "pivot" (interaction plots)', () => {
    const nb = buildCeramicStrengthNotebook();
    expect(getCodeSources(nb)).toMatch(/unstack|pivot/);
  });

  it('at least one markdown cell mentions factor rankings differ by batch (X1 dominant in batch 1, X2 dominant in batch 2)', () => {
    const nb = buildCeramicStrengthNotebook();
    const md = getMarkdownSources(nb);
    expect(md).toMatch(/X1/);
    expect(md).toMatch(/X2/);
    expect(md).toMatch(/batch\s*1/i);
    expect(md).toMatch(/batch\s*2/i);
  });
});

describe('data loading', () => {
  it('data loading section references 480 rows (assert len(df) == 480)', () => {
    const nb = buildCeramicStrengthNotebook();
    expect(getAllSource(nb)).toContain('assert len(df) == 480');
  });
});
