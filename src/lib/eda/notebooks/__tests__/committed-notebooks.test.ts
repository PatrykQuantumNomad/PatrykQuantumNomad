/**
 * Validation tests for committed .ipynb notebook files.
 *
 * These tests verify that the 7 standard case study notebooks
 * are committed to notebooks/eda/ and are valid nbformat v4.5 JSON.
 * The notebooks must exist on disk for Google Colab's
 * colab.research.google.com/github/... URL scheme to work.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { STANDARD_SLUGS } from '../templates/standard';

const NOTEBOOKS_DIR = join(process.cwd(), 'notebooks', 'eda');

describe('committed notebooks', () => {
  it('all 7 STANDARD_SLUGS have corresponding .ipynb files in notebooks/eda/', () => {
    for (const slug of STANDARD_SLUGS) {
      const filePath = join(NOTEBOOKS_DIR, `${slug}.ipynb`);
      expect(existsSync(filePath), `Missing notebook: ${filePath}`).toBe(true);
    }
  });

  describe.each(STANDARD_SLUGS)('%s.ipynb', (slug) => {
    const filePath = join(NOTEBOOKS_DIR, `${slug}.ipynb`);

    it('parses as valid JSON', () => {
      const raw = readFileSync(filePath, 'utf-8');
      expect(() => JSON.parse(raw)).not.toThrow();
    });

    it('has nbformat=4 and nbformat_minor=5', () => {
      const nb = JSON.parse(readFileSync(filePath, 'utf-8'));
      expect(nb.nbformat).toBe(4);
      expect(nb.nbformat_minor).toBe(5);
    });

    it('has non-empty cells array', () => {
      const nb = JSON.parse(readFileSync(filePath, 'utf-8'));
      expect(Array.isArray(nb.cells)).toBe(true);
      expect(nb.cells.length).toBeGreaterThan(0);
    });

    it('has metadata.kernelspec with Python 3', () => {
      const nb = JSON.parse(readFileSync(filePath, 'utf-8'));
      expect(nb.metadata).toBeDefined();
      expect(nb.metadata.kernelspec).toBeDefined();
      expect(nb.metadata.kernelspec.name).toBe('python3');
      expect(nb.metadata.kernelspec.display_name).toBe('Python 3');
      expect(nb.metadata.kernelspec.language).toBe('python');
    });
  });
});
