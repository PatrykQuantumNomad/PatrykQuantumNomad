/**
 * Generate committed .ipynb files and CSV data files for Google Colab access.
 *
 * Colab's GitHub URL scheme (colab.research.google.com/github/{user}/{repo}/blob/{branch}/{path})
 * requires .ipynb files to be committed to the repository. This script generates
 * all 10 case study notebooks (7 standard + 3 advanced) and writes them to notebooks/eda/.
 *
 * CSV data files are generated from the embedded TypeScript dataset arrays in
 * src/data/eda/datasets.ts. These CSV files are committed at notebooks/eda/data/
 * and used by both the notebooks (local + Colab fallback) and the ZIP packager.
 *
 * Run: node --import tsx scripts/generate-notebooks.ts
 */

import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { ALL_CASE_STUDY_SLUGS } from '../src/lib/eda/notebooks/registry/index';
import { buildNotebook } from '../src/lib/eda/notebooks/packager';
import {
  normalRandom,
  uniformRandom,
  timeSeries,
  beamDeflections,
  randomWalk,
  cryothermometry,
  filterTransmittance,
  fatigueLife,
  ceramicStrength,
  standardResistor,
} from '../src/data/eda/datasets';

const ROOT = resolve(import.meta.dirname, '..');
const NOTEBOOK_DIR = join(ROOT, 'notebooks', 'eda');
const DATA_DIR = join(ROOT, 'notebooks', 'eda', 'data');

// Ensure output directories exist
mkdirSync(NOTEBOOK_DIR, { recursive: true });
mkdirSync(DATA_DIR, { recursive: true });

// --- CSV Generation ---

/** Generate a single-column CSV from a number array. */
function singleColumnCsv(header: string, values: number[]): string {
  const rows = values.map((v) => String(v));
  return [header, ...rows].join('\n') + '\n';
}

// Map slug -> CSV content
const csvData: Record<string, string> = {
  'normal-random-numbers': singleColumnCsv('Y', normalRandom),
  'uniform-random-numbers': singleColumnCsv('Y', uniformRandom),
  'heat-flow-meter': singleColumnCsv('Y', timeSeries),
  'filter-transmittance': singleColumnCsv('Y', filterTransmittance),
  'cryothermometry': singleColumnCsv('Y', cryothermometry),
  'fatigue-life': singleColumnCsv('Y', fatigueLife),
  'beam-deflections': singleColumnCsv('Y', beamDeflections),
  'random-walk': singleColumnCsv('Y', randomWalk),
  'standard-resistor': singleColumnCsv('Resistance', standardResistor),
  'ceramic-strength': (() => {
    // Multi-column CSV: map TypeScript field names to NIST column names
    const header = 'Lab,Batch,Y,X1,X2,X3';
    const rows = ceramicStrength.map((obs) =>
      [obs.lab, obs.batch, obs.strength, obs.tableSpeed, obs.downFeed, obs.wheelGrit].join(',')
    );
    return [header, ...rows].join('\n') + '\n';
  })(),
};

let csvCount = 0;
for (const slug of ALL_CASE_STUDY_SLUGS) {
  const csv = csvData[slug];
  if (!csv) {
    console.error(`No CSV data mapping for slug: ${slug}`);
    process.exit(1);
  }
  const outPath = join(DATA_DIR, `${slug}.csv`);
  writeFileSync(outPath, csv, 'utf-8');
  csvCount++;
}
console.log(`Generated ${csvCount} CSV data files in ${DATA_DIR}`);

// --- Notebook Generation ---

let nbCount = 0;
for (const slug of ALL_CASE_STUDY_SLUGS) {
  const notebook = buildNotebook(slug);

  // 1-space JSON indent per Phase 98 decision, trailing newline for POSIX compliance
  const json = JSON.stringify(notebook, null, 1) + '\n';

  const outPath = join(NOTEBOOK_DIR, `${slug}.ipynb`);
  writeFileSync(outPath, json, 'utf-8');
  nbCount++;
}
console.log(`Generated ${nbCount} notebooks in ${NOTEBOOK_DIR}`);
