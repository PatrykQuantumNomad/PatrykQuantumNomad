/**
 * Data loading section: load CSV data with Colab fallback + preview + assertion.
 *
 * CSV files are pre-generated from NIST .DAT datasets and committed to the repo
 * at notebooks/eda/data/{slug}.csv. This enables both local use (ZIP download)
 * and Google Colab access (GitHub raw URL).
 */

import type { Cell } from '../../types';
import type { CaseStudyConfig } from '../../registry/types';
import { codeCell, markdownCell } from '../../cells';

/**
 * Build the Python source for loading data from a CSV file.
 * Uses pd.read_csv() with Colab fallback to GitHub raw URL.
 */
function buildLoadCode(config: CaseStudyConfig): string[] {
  const csvFile = `${config.slug}.csv`;
  const lines: string[] = [];

  lines.push(`# Load dataset (CSV generated from NIST ${config.dataFile})`);
  lines.push(`DATA_FILE = '${csvFile}'`);
  lines.push(`GITHUB_URL = '${config.githubRawUrl}'`);
  lines.push('');
  lines.push('try:');
  lines.push('    df = pd.read_csv(DATA_FILE)');
  lines.push('except FileNotFoundError:');
  lines.push('    df = pd.read_csv(GITHUB_URL)');
  lines.push('');
  lines.push(`print(f'Loaded {len(df)} rows')`);
  lines.push(`assert len(df) == ${config.expectedRows}, f'Expected ${config.expectedRows} rows, got {len(df)}'`);

  return lines;
}

/**
 * Build data loading section cells.
 */
export function buildDataLoading(
  config: CaseStudyConfig,
  slug: string,
  startIndex: number,
): { cells: Cell[]; nextIndex: number } {
  let idx = startIndex;
  const cells: Cell[] = [];

  // Section header
  cells.push(markdownCell(slug, idx++, [
    '## Data Loading',
    '',
    `Load the **${config.dataFile}** dataset from NIST (${config.expectedRows} observations).`,
  ]));

  // Data loading code cell
  cells.push(codeCell(slug, idx++, buildLoadCode(config)));

  // Data preview cell
  cells.push(codeCell(slug, idx++, [
    '# Preview the first few rows',
    'print(df.head(10))',
    'print()',
    "print(f'Shape: {df.shape}')",
    "print(f'Data types:\\n{df.dtypes}')",
  ]));

  return { cells, nextIndex: idx };
}
