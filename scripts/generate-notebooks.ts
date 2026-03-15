/**
 * Generate committed .ipynb files for Google Colab access.
 *
 * Colab's GitHub URL scheme (colab.research.google.com/github/{user}/{repo}/blob/{branch}/{path})
 * requires .ipynb files to be committed to the repository. This script generates
 * all 10 case study notebooks (7 standard + 3 advanced) and writes them to notebooks/eda/.
 *
 * Run: node --import tsx scripts/generate-notebooks.ts
 */

import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { ALL_CASE_STUDY_SLUGS } from '../src/lib/eda/notebooks/registry/index';
import { buildNotebook } from '../src/lib/eda/notebooks/packager';

const ROOT = resolve(import.meta.dirname, '..');
const OUTPUT_DIR = join(ROOT, 'notebooks', 'eda');

// Ensure output directory exists
mkdirSync(OUTPUT_DIR, { recursive: true });

let count = 0;

for (const slug of ALL_CASE_STUDY_SLUGS) {
  const notebook = buildNotebook(slug);

  // 1-space JSON indent per Phase 98 decision, trailing newline for POSIX compliance
  const json = JSON.stringify(notebook, null, 1) + '\n';

  const outPath = join(OUTPUT_DIR, `${slug}.ipynb`);
  writeFileSync(outPath, json, 'utf-8');
  count++;
}

console.log(`Generated ${count} notebooks in ${OUTPUT_DIR}`);
