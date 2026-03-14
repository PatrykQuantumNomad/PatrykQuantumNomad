/**
 * Summary statistics section: computation + display cell.
 *
 * Produces a markdown header and a code cell computing
 * mean, std, min, max, median, skewness, kurtosis.
 */

import type { Cell } from '../../types';
import type { CaseStudyConfig } from '../../registry/types';
import { codeCell, markdownCell } from '../../cells';

/**
 * Build summary statistics section cells.
 */
export function buildSummaryStats(
  config: CaseStudyConfig,
  slug: string,
  startIndex: number,
): { cells: Cell[]; nextIndex: number } {
  let idx = startIndex;
  const cells: Cell[] = [];
  const varName = config.responseVariable;

  // Section header
  cells.push(markdownCell(slug, idx++, [
    '## Summary Statistics',
    '',
    `Compute key descriptive statistics for the **${varName}** variable.`,
  ]));

  // Summary statistics code cell
  cells.push(codeCell(slug, idx++, [
    `# Summary statistics for ${varName}`,
    `y = df['${varName}']`,
    '',
    "summary = pd.DataFrame({",
    "    'Statistic': ['Mean', 'Std Dev', 'Median', 'Min', 'Max',",
    "                  'Skewness', 'Kurtosis', 'N'],",
    "    'Value': [",
    '        y.mean(),',
    '        y.std(ddof=1),',
    '        y.median(),',
    '        y.min(),',
    '        y.max(),',
    '        y.skew(),',
    '        y.kurtosis(),',
    '        len(y),',
    '    ]',
    '})',
    '',
    "print(summary.to_string(index=False))",
  ]));

  return { cells, nextIndex: idx };
}
