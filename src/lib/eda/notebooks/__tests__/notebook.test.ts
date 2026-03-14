import { describe, it, expect } from 'vitest';
import { createNotebook } from '../notebook';
import { markdownCell, codeCell } from '../cells';

describe('createNotebook', () => {
  it('returns object with nbformat: 4, nbformat_minor: 5', () => {
    const nb = createNotebook([]);
    expect(nb.nbformat).toBe(4);
    expect(nb.nbformat_minor).toBe(5);
  });

  it('returns metadata with kernelspec.name === "python3"', () => {
    const nb = createNotebook([]);
    expect(nb.metadata.kernelspec.name).toBe('python3');
    expect(nb.metadata.kernelspec.display_name).toBe('Python 3');
    expect(nb.metadata.kernelspec.language).toBe('python');
  });

  it('returns metadata with language_info.name === "python"', () => {
    const nb = createNotebook([]);
    expect(nb.metadata.language_info.name).toBe('python');
    expect(nb.metadata.language_info.file_extension).toBe('.py');
  });

  it('passes through cells array', () => {
    const cells = [
      markdownCell('test', 0, ['# Title']),
      codeCell('test', 1, ['print("hello")']),
    ];
    const nb = createNotebook(cells);
    expect(nb.cells).toEqual(cells);
    expect(nb.cells).toHaveLength(2);
  });

  it('produces valid JSON when serialized', () => {
    const cell = markdownCell('test', 0, ['# Hello']);
    const nb = createNotebook([cell]);
    const json = JSON.stringify(nb);
    expect(() => JSON.parse(json)).not.toThrow();
    const parsed = JSON.parse(json);
    expect(parsed.nbformat).toBe(4);
    expect(parsed.nbformat_minor).toBe(5);
  });
});
