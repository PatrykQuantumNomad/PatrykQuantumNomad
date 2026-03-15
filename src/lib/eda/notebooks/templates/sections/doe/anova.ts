/**
 * One-way ANOVA section builder for DOE case studies.
 *
 * Produces cells for:
 * - One-way ANOVA per factor per batch using scipy.stats.f_oneway
 * - Summary ANOVA results table
 * - Interpretation of significant factors
 */

import type { Cell } from '../../../types';
import type { CaseStudyConfig } from '../../../registry/types';
import { codeCell, markdownCell } from '../../../cells';

/**
 * Build one-way ANOVA section cells.
 * @param config Case study configuration
 * @param slug Case study slug
 * @param startIndex Starting cell index for ID generation
 * @returns Array of cells and the next available index
 */
export function buildAnova(
  config: CaseStudyConfig,
  slug: string,
  startIndex: number,
): { cells: Cell[]; nextIndex: number } {
  let idx = startIndex;
  const cells: Cell[] = [];

  // Section header
  cells.push(markdownCell(slug, idx++, [
    '## One-Way ANOVA',
    '',
    'One-way ANOVA tests whether the mean response differs significantly across',
    'levels of each factor. We perform this **per batch** since the batch effect dominates.',
    'We use `scipy.stats.f_oneway` which returns the F-statistic and p-value.',
  ]));

  // ANOVA computation per factor per batch
  cells.push(codeCell(slug, idx++, [
    '# One-way ANOVA for each factor, per batch',
    'from scipy.stats import f_oneway',
    '',
    "anova_results = []",
    '',
    'for batch_num in [1, 2]:',
    "    batch_data = df[df['Batch'] == batch_num]",
    "    for factor in ['X1', 'X2', 'X3']:",
    "        groups = [group['Y'].values for _, group in batch_data.groupby(factor)]",
    '        f_stat, p_val = f_oneway(*groups)',
    "        anova_results.append({",
    "            'Factor': factor,",
    "            'Batch': batch_num,",
    "            'F-statistic': f_stat,",
    "            'p-value': p_val,",
    "            'Significant': 'Yes' if p_val < 0.05 else 'No'",
    '        })',
    '',
    'anova_df = pd.DataFrame(anova_results)',
    "print(anova_df.to_string(index=False))",
  ]));

  // Summary table code
  cells.push(codeCell(slug, idx++, [
    '# ANOVA summary visualization',
    'fig, axes = plt.subplots(1, 2, figsize=(12, 5))',
    '',
    'for i, batch_num in enumerate([1, 2]):',
    "    batch_results = anova_df[anova_df['Batch'] == batch_num]",
    '    ax = axes[i]',
    "    colors = [QUANTUM_COLORS['accent'] if sig == 'Yes' else QUANTUM_COLORS['border']",
    "             for sig in batch_results['Significant']]",
    "    ax.barh(batch_results['Factor'], batch_results['F-statistic'], color=colors)",
    '    ax.set_title(f\'ANOVA F-statistics - Batch {batch_num}\',',
    "                 color=QUANTUM_COLORS['text'])",
    "    ax.set_xlabel('F-statistic')",
    "    ax.axvline(x=3.84, color=QUANTUM_COLORS['teal'], linestyle='--',",
    "              label='F critical (approx)', linewidth=1)",
    '    ax.legend(fontsize=9)',
    '',
    'plt.tight_layout()',
    'plt.show()',
  ]));

  // Interpretation
  cells.push(markdownCell(slug, idx++, [
    '### ANOVA Interpretation',
    '',
    'The ANOVA results confirm the factor ranking findings from the DOE mean plots:',
    '',
    '- **Batch 1:** X1 (Table Speed) shows the largest F-statistic, confirming it as the',
    '  dominant factor. X2 and X3 are also significant but with smaller effects.',
    '- **Batch 2:** X2 (Down Feed Rate) shows the largest F-statistic, confirming it as the',
    '  dominant factor in this batch. X1 remains significant but less dominant.',
    '',
    'The differing factor significance across batches reinforces that the batch effect',
    'fundamentally changes the factor-response relationship.',
  ]));

  return { cells, nextIndex: idx };
}
