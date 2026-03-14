/**
 * Astro integration that generates ZIP downloads for EDA notebooks
 * at build time via the `astro:build:done` hook.
 *
 * For each standard case study slug, creates a ZIP containing:
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
import { STANDARD_SLUGS } from '../lib/eda/notebooks/templates/standard';

export default function notebookPackager(): AstroIntegration {
  return {
    name: 'notebook-packager',
    hooks: {
      'astro:build:done': async ({ dir, logger }) => {
        const distPath = fileURLToPath(dir);
        const outDir = join(distPath, 'downloads', 'notebooks');
        mkdirSync(outDir, { recursive: true });

        const start = Date.now();

        for (const slug of STANDARD_SLUGS) {
          const entries = buildNotebookZipEntries(slug, process.cwd());
          await createZipFile(join(outDir, `${slug}.zip`), entries);
        }

        const elapsed = ((Date.now() - start) / 1000).toFixed(2);
        logger.info(`Packaged ${STANDARD_SLUGS.length} notebooks in ${elapsed}s`);
      },
    },
  };
}
