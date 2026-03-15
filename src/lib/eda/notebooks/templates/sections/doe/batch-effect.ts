/**
 * Batch effect analysis section for DOE case studies.
 *
 * Produces cells for:
 * - Bihistogram of batch 1 vs batch 2
 * - Side-by-side box plots by batch
 * - Two-sample t-test and F-test
 * - NIST reference value comparison table
 */

import type { Cell } from '../../../types';
import type { CaseStudyConfig } from '../../../registry/types';
import { codeCell, markdownCell } from '../../../cells';

/**
 * Build batch effect analysis section cells.
 * @param config Case study configuration
 * @param slug Case study slug
 * @param startIndex Starting cell index for ID generation
 * @returns Array of cells and the next available index
 */
export function buildBatchEffect(
  config: CaseStudyConfig,
  slug: string,
  startIndex: number,
): { cells: Cell[]; nextIndex: number } {
  let idx = startIndex;
  const cells: Cell[] = [];
  const varName = config.responseVariable;

  // Section header
  cells.push(markdownCell(slug, idx++, [
    '## Batch Effect Analysis',
    '',
    'The 4-plot histogram reveals a **bimodal distribution**, suggesting a dominant batch effect.',
    'Before analyzing primary factors (X1, X2, X3), we must first quantify the batch-to-batch',
    'variability. This is standard practice in DOE: nuisance factors are investigated before',
    'primary factors.',
  ]));

  // Split data by batch and compute descriptive stats
  cells.push(codeCell(slug, idx++, [
    '# Split data by Batch',
    `batch1 = df[df['Batch'] == 1]['${varName}']`,
    `batch2 = df[df['Batch'] == 2]['${varName}']`,
    '',
    "print(f'Batch 1: N={len(batch1)}, Mean={batch1.mean():.4f}, SD={batch1.std(ddof=1):.4f}')",
    "print(f'Batch 2: N={len(batch2)}, Mean={batch2.mean():.4f}, SD={batch2.std(ddof=1):.4f}')",
    "print(f'Batch effect (mean difference): {batch1.mean() - batch2.mean():.4f}')",
  ]));

  // Bihistogram: overlaid histograms
  cells.push(codeCell(slug, idx++, [
    '# Bihistogram: Batch 1 vs Batch 2',
    "fig, ax = plt.subplots(figsize=(10, 6))",
    '',
    "ax.hist(batch1, bins=25, alpha=0.6, color=QUANTUM_COLORS['accent'],",
    "        label=f'Batch 1 (mean={batch1.mean():.2f})', edgecolor='none')",
    "ax.hist(batch2, bins=25, alpha=0.6, color=QUANTUM_COLORS['teal'],",
    "        label=f'Batch 2 (mean={batch2.mean():.2f})', edgecolor='none')",
    '',
    "ax.set_xlabel('Ceramic Strength (Y)')",
    "ax.set_ylabel('Frequency')",
    "ax.set_title('Bihistogram: Batch 1 vs Batch 2', color=QUANTUM_COLORS['text'])",
    'ax.legend()',
    'plt.tight_layout()',
    'plt.show()',
  ]));

  // Box plots by batch
  cells.push(codeCell(slug, idx++, [
    '# Side-by-side box plots by Batch',
    "fig, ax = plt.subplots(figsize=(8, 6))",
    '',
    "sns.boxplot(data=df, x='Batch', y='Y', ax=ax,",
    "            palette=[QUANTUM_COLORS['accent'], QUANTUM_COLORS['teal']])",
    "ax.set_title('Ceramic Strength by Batch', color=QUANTUM_COLORS['text'])",
    "ax.set_xlabel('Batch')",
    "ax.set_ylabel('Strength (Y)')",
    'plt.tight_layout()',
    'plt.show()',
  ]));

  // Two-sample t-test and F-test
  cells.push(codeCell(slug, idx++, [
    '# Two-sample t-test for batch means',
    'from scipy.stats import ttest_ind, f_oneway',
    '',
    't_stat, t_pval = ttest_ind(batch1, batch2)',
    "print(f'Two-sample t-test: T = {t_stat:.4f}, p-value = {t_pval:.2e}')",
    '',
    '# Pooled standard deviation',
    'n1, n2 = len(batch1), len(batch2)',
    's1, s2 = batch1.std(ddof=1), batch2.std(ddof=1)',
    'pooled_sd = np.sqrt(((n1-1)*s1**2 + (n2-1)*s2**2) / (n1+n2-2))',
    "print(f'Pooled SD = {pooled_sd:.4f}')",
    '',
    '# F-test for equal variances',
    'f_stat = s1**2 / s2**2',
    "print(f'F-test for equal variances: F = {f_stat:.3f}')",
  ]));

  // NIST reference comparison
  cells.push(markdownCell(slug, idx++, [
    '### NIST Reference Comparison',
    '',
    '| Statistic | Batch 1 | Batch 2 |',
    '|-----------|---------|---------|',
    '| N | 240 | 240 |',
    '| Mean | 688.9987 | 611.1559 |',
    '| SD | 65.5491 | 61.8543 |',
    '',
    '**T-statistic:** 13.3806 (two-sample t-test for equal means)',
    '',
    'The batch effect is approximately **75-100 units**, confirming that batch is a dominant',
    'nuisance factor. All subsequent factor analysis should be performed **within each batch**.',
  ]));

  return { cells, nextIndex: idx };
}
