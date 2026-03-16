import { describe, it, expect } from 'vitest';
import { buildBeamDeflectionsNotebook } from '../templates/advanced/beam-deflections';
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

describe('buildBeamDeflectionsNotebook structure', () => {
  it('returns nbformat 4 minor 5', () => {
    const nb = buildBeamDeflectionsNotebook();
    expect(nb.nbformat).toBe(4);
    expect(nb.nbformat_minor).toBe(5);
  });

  it('has at least 20 cells (5 reused + 5 new sections)', () => {
    const nb = buildBeamDeflectionsNotebook();
    expect(nb.cells.length).toBeGreaterThanOrEqual(20);
  });

  it('all cell IDs are unique', () => {
    const nb = buildBeamDeflectionsNotebook();
    const ids = nb.cells.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('all cells have valid cell_type (markdown or code)', () => {
    const nb = buildBeamDeflectionsNotebook();
    for (const cell of nb.cells) {
      expect(['markdown', 'code']).toContain(cell.cell_type);
    }
  });

  it('JSON.stringify produces valid JSON', () => {
    const nb = buildBeamDeflectionsNotebook();
    const json = JSON.stringify(nb);
    expect(() => JSON.parse(json)).not.toThrow();
  });
});

describe('standard sections (reused)', () => {
  it('second markdown cell contains "Beam Deflections" (title after branding)', () => {
    const nb = buildBeamDeflectionsNotebook();
    const mdCells = nb.cells.filter((c) => c.cell_type === 'markdown');
    const src = Array.isArray(mdCells[1].source) ? mdCells[1].source.join('') : mdCells[1].source;
    expect(src).toContain('Beam Deflections');
  });

  it('contains import numpy or import matplotlib (setup section)', () => {
    const nb = buildBeamDeflectionsNotebook();
    const code = getCodeSources(nb);
    expect(code).toMatch(/import numpy|import matplotlib/);
  });

  it('contains assert len(df) == 200 (data loading)', () => {
    const nb = buildBeamDeflectionsNotebook();
    expect(getAllSource(nb)).toContain('assert len(df) == 200');
  });

  it('contains summary statistics computation', () => {
    const nb = buildBeamDeflectionsNotebook();
    const code = getCodeSources(nb);
    expect(code).toContain('.mean()');
    expect(code).toContain('.std(');
  });

  it('contains plt.subplots(2, 2 (4-plot grid)', () => {
    const nb = buildBeamDeflectionsNotebook();
    expect(getCodeSources(nb)).toContain('plt.subplots(2, 2');
  });
});

describe('sinusoidal model fitting section', () => {
  it('contains curve_fit in a code cell', () => {
    const nb = buildBeamDeflectionsNotebook();
    expect(getCodeSources(nb)).toContain('curve_fit');
  });

  it('contains sinusoidal_model function definition', () => {
    const nb = buildBeamDeflectionsNotebook();
    expect(getCodeSources(nb)).toContain('sinusoidal_model');
  });

  it('contains p0 = with starting values (initial guesses)', () => {
    const nb = buildBeamDeflectionsNotebook();
    expect(getCodeSources(nb)).toContain('p0 = ');
  });

  it('contains NIST starting values in p0', () => {
    const nb = buildBeamDeflectionsNotebook();
    const code = getCodeSources(nb);
    expect(code).toContain('-177.44');
    expect(code).toContain('0.3025');
  });

  it('contains residuals computation', () => {
    const nb = buildBeamDeflectionsNotebook();
    expect(getCodeSources(nb)).toContain('residuals');
  });

  it('contains ddof=4 for residual SD (4 estimated parameters)', () => {
    const nb = buildBeamDeflectionsNotebook();
    expect(getCodeSources(nb)).toContain('ddof=4');
  });
});

describe('NIST reference values', () => {
  it('markdown contains NIST reference C value -178.786', () => {
    const nb = buildBeamDeflectionsNotebook();
    expect(getMarkdownSources(nb)).toContain('-178.786');
  });

  it('markdown contains NIST residual SD reference 155.8484', () => {
    const nb = buildBeamDeflectionsNotebook();
    expect(getMarkdownSources(nb)).toContain('155.8484');
  });

  it('markdown contains NIST amplitude reference -361.766', () => {
    const nb = buildBeamDeflectionsNotebook();
    expect(getMarkdownSources(nb)).toContain('-361.766');
  });

  it('markdown contains NIST frequency reference 0.302596', () => {
    const nb = buildBeamDeflectionsNotebook();
    expect(getMarkdownSources(nb)).toContain('0.302596');
  });

  it('markdown contains NIST phase reference 1.46536', () => {
    const nb = buildBeamDeflectionsNotebook();
    expect(getMarkdownSources(nb)).toContain('1.46536');
  });
});

describe('residual 4-plot validation section', () => {
  it('contains a code cell with subplot for residual 4-plot (fig, axes or subplot)', () => {
    const nb = buildBeamDeflectionsNotebook();
    const code = getCodeSources(nb);
    // Should have a second 4-plot (for residuals) after the standard 4-plot
    const matches = code.match(/plt\.subplots\(2,\s*2/g);
    expect(matches).not.toBeNull();
    expect(matches!.length).toBeGreaterThanOrEqual(2);
  });

  it('markdown contains "Residual" (residual interpretation section)', () => {
    const nb = buildBeamDeflectionsNotebook();
    expect(getMarkdownSources(nb)).toContain('Residual');
  });

  it('contains residual 4-plot header in markdown', () => {
    const nb = buildBeamDeflectionsNotebook();
    expect(getMarkdownSources(nb)).toMatch(/Residual.*4-Plot|4-Plot.*Residual/i);
  });
});

describe('initial EDA interpretation', () => {
  it('markdown explains sinusoidal pattern in lag plot', () => {
    const nb = buildBeamDeflectionsNotebook();
    const md = getMarkdownSources(nb);
    expect(md).toMatch(/lag plot|lag-plot/i);
    expect(md).toMatch(/sinusoidal|circular/i);
  });

  it('markdown explains non-randomness', () => {
    const nb = buildBeamDeflectionsNotebook();
    const md = getMarkdownSources(nb);
    expect(md).toMatch(/non-random|not random|randomness/i);
  });
});

describe('conclusions section', () => {
  it('contains Conclusions or Key Findings in markdown', () => {
    const nb = buildBeamDeflectionsNotebook();
    expect(getMarkdownSources(nb)).toMatch(/## Conclusions|## Key Findings/);
  });

  it('contains nist.gov reference link', () => {
    const nb = buildBeamDeflectionsNotebook();
    expect(getMarkdownSources(nb)).toMatch(/itl\.nist\.gov/);
  });
});
