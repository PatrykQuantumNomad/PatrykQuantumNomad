/**
 * Astro integration that generates ZIP downloads for EDA notebooks
 * at build time via the `astro:build:done` hook.
 *
 * For each of the 10 case study slugs, creates a ZIP containing:
 *   - {slug}.ipynb — the generated notebook
 *   - {dataFile}.DAT — NIST dataset
 *   - requirements.txt — Python dependencies
 *
 * Follows the same integration pattern as indexnow.ts.
 */

import type { AstroIntegration } from 'astro';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { mkdirSync } from 'node:fs';
import { createZipFile, buildNotebookZipEntries } from '../lib/eda/notebooks/packager';
import { ALL_CASE_STUDY_SLUGS } from '../lib/eda/notebooks/registry/index';

export default function notebookPackager(): AstroIntegration {
  return {
    name: 'notebook-packager',
    hooks: {
      'astro:build:done': async ({ dir, logger }) => {
        const distPath = fileURLToPath(dir);
        const outDir = join(distPath, 'downloads', 'notebooks');
        mkdirSync(outDir, { recursive: true });

        const start = Date.now();

        for (const slug of ALL_CASE_STUDY_SLUGS) {
          const entries = buildNotebookZipEntries(slug, process.cwd());
          await createZipFile(join(outDir, `${slug}.zip`), entries);
        }

        const elapsed = ((Date.now() - start) / 1000).toFixed(2);
        logger.info(`Packaged ${ALL_CASE_STUDY_SLUGS.length} notebooks in ${elapsed}s`);
      },
    },
  };
}
