/**
 * Test summary section builder.
 *
 * Generates a code cell that collects all hypothesis test results
 * into a summary table (Location, Variation, Randomness, Distribution, Outlier).
 */

import type { Cell } from '../../types';
import type { CaseStudyConfig } from '../../registry/types';
import { codeCell, markdownCell } from '../../cells';
import { SKIP_DISTRIBUTION_SLUGS } from './hypothesis-tests';

/**
 * Build test summary section cells.
 */
export function buildTestSummary(
  config: CaseStudyConfig,
  slug: string,
  startIndex: number,
): { cells: Cell[]; nextIndex: number } {
  let idx = startIndex;
  const cells: Cell[] = [];
  const skipDist = SKIP_DISTRIBUTION_SLUGS.includes(slug);

  // Section header
  cells.push(markdownCell(slug, idx++, [
    '## Test Summary',
    '',
    'Summary of all hypothesis test results for this case study.',
  ]));

  // Build the summary table code
  const distRow = skipDist
    ? "    ['Distribution', 'N/A', 'N/A', 'Skipped (autocorrelation)'],"
    : "    ['Distribution', f'{ad_result.statistic:.4f}', f'{ad_result.critical_values[2]:.4f}', 'Reject' if ad_result.statistic > ad_result.critical_values[2] else 'Fail to reject'],";

  const outlierRow = skipDist
    ? "    ['Outlier', 'N/A', 'N/A', 'Skipped (autocorrelation)'],"
    : "    ['Outlier', f'{G:.4f}', f'{G_crit:.4f}', 'Outlier detected' if is_outlier else 'No outlier'],";

  cells.push(codeCell(slug, idx++, [
    '# Test Summary Table',
    "print('=' * 70)",
    "print('Test Summary')",
    "print('=' * 70)",
    '',
    'summary_data = [',
    "    ['Location', f'{slope:.6f}', f'{p_value:.6f}', 'Trend detected' if p_value < alpha else 'No trend'],",
    "    ['Variation', f'{stat:.4f}', f'{p_value:.6f}', 'Variances differ' if p_value < alpha else 'Variances equal'],",
    "    ['Randomness (Runs)', f'{z_stat:.4f}', f'{p_val:.6f}', 'Not random' if p_val < alpha else 'Random'],",
    "    ['Randomness (Lag-1)', f'{r1:.6f}', f'{critical:.6f}', 'Autocorrelated' if abs(r1) > critical else 'No autocorrelation'],",
    `    ${distRow}`,
    `    ${outlierRow}`,
    ']',
    '',
    "headers = ['Test', 'Statistic', 'Threshold', 'Conclusion']",
    '',
    '# Print formatted table',
    "print(f\"{'Test':<22} {'Statistic':>12} {'Threshold':>12} {'Conclusion'}\")",
    "print('-' * 70)",
    'for row in summary_data:',
    "    print(f'{row[0]:<22} {row[1]:>12} {row[2]:>12} {row[3]}')",
  ]));

  return { cells, nextIndex: idx };
}
