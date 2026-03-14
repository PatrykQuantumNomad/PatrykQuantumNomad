/**
 * Data loading section: load data with Colab fallback + preview + assertion.
 *
 * Handles three data formats:
 * - Single value per line (e.g., ZARR13.DAT, MAVRO.DAT, BIRNSAUN.DAT)
 * - Multiple values per line requiring flatten (e.g., RANDN.DAT, RANDU.DAT, SOULEN.DAT)
 * - Multiple named columns (e.g., DZIUBA1.DAT with Month, Day, Year, Resistance)
 */

import type { Cell } from '../../types';
import type { CaseStudyConfig } from '../../registry/types';
import { codeCell, markdownCell } from '../../cells';

/**
 * Build the Python source for loading data from a .DAT file.
 * Generates format-specific parsing code based on config properties.
 */
function buildLoadCode(config: CaseStudyConfig): string[] {
  const lines: string[] = [];
  const varName = config.responseVariable;
  const hasMultiValues = config.valuesPerLine && config.valuesPerLine > 1;
  const hasMultiColumns = config.columns.length > 1;

  // Colab fallback: try local file first, then fetch from GitHub
  lines.push(`# Load data from NIST .DAT file`);
  lines.push(`DATA_FILE = '${config.dataFile}'`);
  lines.push(`GITHUB_URL = '${config.githubRawUrl}'`);
  lines.push('');
  lines.push('try:');
  lines.push(`    with open(DATA_FILE, 'r') as f:`);
  lines.push('        raw_text = f.read()');
  lines.push('except FileNotFoundError:');
  lines.push("    import urllib.request");
  lines.push('    raw_text = urllib.request.urlopen(GITHUB_URL).read().decode()');
  lines.push('');
  lines.push(`# Skip header lines (${config.skipRows} lines)`);
  lines.push(`header_lines = ${config.skipRows}`);
  lines.push("data_text = '\\n'.join(raw_text.strip().split('\\n')[header_lines:])");
  lines.push('');

  if (hasMultiColumns) {
    // Multi-column: use read_fwf with named columns
    const colList = config.columns.map((c) => `'${c}'`).join(', ');
    lines.push(`df = pd.read_fwf(StringIO(data_text), header=None, names=[${colList}])`);
  } else if (hasMultiValues) {
    // Multi-value per line: read all values, flatten into single column
    lines.push('df = pd.read_fwf(StringIO(data_text), header=None)');
    lines.push(`df = pd.DataFrame({'${varName}': df.values.flatten()})  # flatten multi-value rows`);
    lines.push('df = df.dropna()');
  } else {
    // Single value per line: straightforward read
    lines.push(`df = pd.read_fwf(StringIO(data_text), header=None, names=['${varName}'])`);
  }

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
