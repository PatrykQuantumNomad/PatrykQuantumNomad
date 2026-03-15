/**
 * ZIP packager for EDA Jupyter notebooks.
 *
 * Creates self-contained ZIP downloads containing:
 * - {slug}.ipynb — the generated notebook (nbformat v4.5)
 * - {slug}.csv — the NIST dataset as CSV
 * - requirements.txt — Python dependencies
 *
 * Uses archiver (locked decision over JSZip due to encoding issues
 * with mixed binary/UTF-8 content).
 */

import archiver from 'archiver';
import { createWriteStream, mkdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { buildStandardNotebook } from './templates/standard';
import { buildBeamDeflectionsNotebook } from './templates/advanced/beam-deflections';
import { buildRandomWalkNotebook } from './templates/advanced/random-walk';
import { buildCeramicStrengthNotebook } from './templates/advanced/ceramic-strength';
import { getCaseStudyConfig } from './registry/index';
import { REQUIREMENTS_TXT } from './requirements';
import type { NotebookV4 } from './types';

/**
 * A single entry to be added to a ZIP archive.
 * Provide either `content` (inline string) or `sourcePath` (file on disk).
 */
export interface ZipEntry {
  /** Filename inside the ZIP archive */
  name: string;
  /** Inline string content */
  content?: string;
  /** Absolute path to a file on disk */
  sourcePath?: string;
}

/**
 * Create a ZIP archive at `outputPath` containing the given entries.
 *
 * Uses archiver with maximum zlib compression (level 9).
 * Resolves on the output stream's `close` event (NOT on finalize())
 * to ensure all data has been flushed to disk.
 */
export async function createZipFile(
  outputPath: string,
  entries: ZipEntry[],
): Promise<void> {
  // Ensure parent directories exist
  mkdirSync(dirname(outputPath), { recursive: true });

  const output = createWriteStream(outputPath);
  const archive = archiver('zip', { zlib: { level: 9 } });

  return new Promise<void>((resolve, reject) => {
    // Resolve when ALL data has been written to disk
    output.on('close', () => resolve());

    // Reject on archive errors
    archive.on('error', (err) => reject(err));

    // Reject on warnings (except ENOENT which is non-fatal)
    archive.on('warning', (err) => {
      if (err.code === 'ENOENT') {
        // Non-fatal, skip
      } else {
        reject(err);
      }
    });

    archive.pipe(output);

    // Add each entry to the archive
    for (const entry of entries) {
      if (entry.content !== undefined) {
        archive.append(entry.content, { name: entry.name });
      } else if (entry.sourcePath) {
        archive.file(entry.sourcePath, { name: entry.name });
      }
    }

    // Signal that no more entries will be added
    archive.finalize();
  });
}

/**
 * Build a notebook for any case study slug.
 *
 * Dispatches to the appropriate advanced builder for beam-deflections,
 * random-walk, and ceramic-strength. All other slugs use the standard template.
 */
export function buildNotebook(slug: string): NotebookV4 {
  switch (slug) {
    case 'beam-deflections':
      return buildBeamDeflectionsNotebook();
    case 'random-walk':
      return buildRandomWalkNotebook();
    case 'ceramic-strength':
      return buildCeramicStrengthNotebook();
    default:
      return buildStandardNotebook(slug);
  }
}

/**
 * Build the 3 ZIP entries for a case study notebook download.
 *
 * Returns:
 * 1. {slug}.ipynb — notebook JSON (1-space indent, trailing newline)
 * 2. {slug}.csv — dataset as CSV (generated from NIST data)
 * 3. requirements.txt — Python package pins
 *
 * @throws Error if slug is not found in the registry
 */
export function buildNotebookZipEntries(slug: string, projectRoot: string): ZipEntry[] {
  const config = getCaseStudyConfig(slug);
  if (!config) {
    throw new Error(`Unknown case study slug: ${slug}`);
  }

  // Build notebook and serialize with 1-space indent + trailing newline
  const notebook = buildNotebook(slug);
  const notebookJson = JSON.stringify(notebook, null, 1) + '\n';

  // Read CSV data file (committed at notebooks/eda/data/{slug}.csv)
  const csvPath = join(projectRoot, 'notebooks', 'eda', 'data', `${slug}.csv`);
  const csvContent = readFileSync(csvPath, 'utf-8');

  return [
    { name: `${slug}.ipynb`, content: notebookJson },
    { name: `${slug}.csv`, content: csvContent },
    { name: 'requirements.txt', content: REQUIREMENTS_TXT },
  ];
}
