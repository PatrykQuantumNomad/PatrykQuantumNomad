import { describe, it, expect } from 'vitest';
import { cellId, markdownCell, codeCell } from '../cells';

describe('cellId', () => {
  it('returns an 8-char hex string', () => {
    const id = cellId('test-slug', 0);
    expect(id).toHaveLength(8);
    expect(id).toMatch(/^[a-zA-Z0-9]+$/);
  });

  it('is deterministic: same slug+index always produces same ID', () => {
    const id1 = cellId('test-slug', 0);
    const id2 = cellId('test-slug', 0);
    expect(id1).toBe(id2);
  });

  it('produces unique IDs for different indices', () => {
    const id0 = cellId('test-slug', 0);
    const id1 = cellId('test-slug', 1);
    expect(id0).not.toBe(id1);
  });

  it('produces unique IDs for different slugs', () => {
    const idA = cellId('test-slug', 0);
    const idB = cellId('other-slug', 0);
    expect(idA).not.toBe(idB);
  });

  it('matches valid nbformat cell ID pattern', () => {
    const id = cellId('my-notebook', 42);
    expect(id).toMatch(/^[a-zA-Z0-9]+$/);
    expect(id.length).toBeGreaterThanOrEqual(1);
    expect(id.length).toBeLessThanOrEqual(64);
  });
});

describe('markdownCell', () => {
  it('returns a markdown cell with correct structure', () => {
    const cell = markdownCell('slug', 0, ['line1', 'line2']);
    expect(cell.cell_type).toBe('markdown');
    expect(cell.metadata).toEqual({});
    expect(cell.id).toBeDefined();
    expect(cell.source).toEqual(['line1\n', 'line2']);
  });

  it('normalizes source: all lines except last have trailing \\n', () => {
    const cell = markdownCell('slug', 0, ['a', 'b', 'c']);
    expect(cell.source).toEqual(['a\n', 'b\n', 'c']);
  });

  it('handles single-line source without adding \\n', () => {
    const cell = markdownCell('slug', 0, ['only line']);
    expect(cell.source).toEqual(['only line']);
  });

  it('does not double-terminate lines that already have \\n', () => {
    const cell = markdownCell('slug', 0, ['has newline\n', 'last']);
    expect(cell.source).toEqual(['has newline\n', 'last']);
  });
});

describe('codeCell', () => {
  it('returns a code cell with correct structure', () => {
    const cell = codeCell('slug', 0, ['import numpy']);
    expect(cell.cell_type).toBe('code');
    expect(cell.metadata).toEqual({});
    expect(cell.id).toBeDefined();
    expect(cell.source).toEqual(['import numpy']);
    expect(cell.outputs).toEqual([]);
    expect(cell.execution_count).toBeNull();
  });

  it('always has outputs: [] and execution_count: null', () => {
    const cell = codeCell('slug', 5, ['x = 1', 'y = 2']);
    expect(cell.outputs).toEqual([]);
    expect(cell.execution_count).toBeNull();
  });

  it('normalizes source lines like markdownCell', () => {
    const cell = codeCell('slug', 0, ['import numpy as np', 'import pandas as pd']);
    expect(cell.source).toEqual(['import numpy as np\n', 'import pandas as pd']);
  });
});
