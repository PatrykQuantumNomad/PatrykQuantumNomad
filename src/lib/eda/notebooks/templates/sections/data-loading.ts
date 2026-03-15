/**
 * Data loading section: load CSV data from GitHub + preview + assertion.
 *
 * CSV files are pre-generated from NIST .DAT datasets and committed to the repo
 * at notebooks/eda/data/{slug}.csv. Notebooks load directly from the GitHub raw
 * URL, which works in both Colab and local environments with internet access.
 * The ZIP download also includes the CSV for offline use.
 */

import type { Cell } from '../../types';
import type { CaseStudyConfig } from '../../registry/types';
import { codeCell, markdownCell } from '../../cells';

/**
 * Build the Python source for loading data from the GitHub raw CSV URL.
 */
function buildLoadCode(config: CaseStudyConfig): string[] {
  const lines: string[] = [];

  lines.push(`# Load dataset (CSV generated from NIST ${config.dataFile})`);
  lines.push(`DATA_URL = '${config.githubRawUrl}'`);
  lines.push('df = pd.read_csv(DATA_URL)');
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
