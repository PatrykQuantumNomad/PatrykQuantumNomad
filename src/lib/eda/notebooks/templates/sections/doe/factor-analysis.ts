/**
 * DOE factor analysis section builder.
 *
 * Produces cells for:
 * - DOE mean plots per factor (overall and per batch)
 * - DOE SD plots per factor per batch
 * - Factor ranking summary
 * - Interaction effect plots for factor pairs per batch
 * - Interaction effect interpretation
 */

import type { Cell } from '../../../types';
import type { CaseStudyConfig } from '../../../registry/types';
import { codeCell, markdownCell } from '../../../cells';

/**
 * Build DOE factor analysis section cells.
 * @param config Case study configuration
 * @param slug Case study slug
 * @param startIndex Starting cell index for ID generation
 * @returns Array of cells and the next available index
 */
export function buildFactorAnalysis(
  config: CaseStudyConfig,
  slug: string,
  startIndex: number,
): { cells: Cell[]; nextIndex: number } {
  let idx = startIndex;
  const cells: Cell[] = [];

  // Section header
  cells.push(markdownCell(slug, idx++, [
    '## Primary Factor Analysis',
    '',
    'DOE mean plots show the average response at each factor level. The factor with the',
    'largest difference between its high (+1) and low (-1) level means has the greatest',
    'effect on the response. We compute these **per batch** since the batch effect dominates.',
  ]));

  // DOE mean plots per batch
  cells.push(codeCell(slug, idx++, [
    '# DOE Mean Plots: average Y at each factor level, per batch',
    "factors = ['X1', 'X2', 'X3']",
    "factor_names = {'X1': 'Table Speed', 'X2': 'Down Feed Rate', 'X3': 'Wheel Grit'}",
    '',
    'fig, axes = plt.subplots(2, 3, figsize=(15, 10))',
    "fig.suptitle('DOE Mean Plots by Factor and Batch',",
    "             fontsize=16, color=QUANTUM_COLORS['text'], y=1.02)",
    '',
    'for batch_num, ax_row in zip([1, 2], axes):',
    "    batch_data = df[df['Batch'] == batch_num]",
    '    for i, factor in enumerate(factors):',
    "        means = batch_data.groupby(factor)['Y'].mean()",
    '        ax = ax_row[i]',
    "        ax.plot(means.index, means.values, 'o-',",
    "                color=QUANTUM_COLORS['accent'], linewidth=2, markersize=8)",
    "        effect = means.values[-1] - means.values[0]",
    '        ax.set_title(f\'{factor_names[factor]}\\nBatch {batch_num} (effect={effect:.2f})\',',
    "                     fontsize=11)",
    "        ax.set_xlabel(f'{factor} Level')",
    "        ax.set_ylabel('Mean Strength')",
    "        ax.set_xticks([-1, 1])",
    '',
    'plt.tight_layout()',
    'plt.show()',
  ]));

  // DOE SD plots per batch
  cells.push(codeCell(slug, idx++, [
    '# DOE SD Plots: standard deviation of Y at each factor level, per batch',
    'fig, axes = plt.subplots(2, 3, figsize=(15, 10))',
    "fig.suptitle('DOE SD Plots by Factor and Batch',",
    "             fontsize=16, color=QUANTUM_COLORS['text'], y=1.02)",
    '',
    'for batch_num, ax_row in zip([1, 2], axes):',
    "    batch_data = df[df['Batch'] == batch_num]",
    '    for i, factor in enumerate(factors):',
    "        sds = batch_data.groupby(factor)['Y'].std()",
    '        ax = ax_row[i]',
    "        ax.plot(sds.index, sds.values, 's-',",
    "                color=QUANTUM_COLORS['teal'], linewidth=2, markersize=8)",
    '        ax.set_title(f\'{factor_names[factor]} - Batch {batch_num}\', fontsize=11)',
    "        ax.set_xlabel(f'{factor} Level')",
    "        ax.set_ylabel('SD of Strength')",
    "        ax.set_xticks([-1, 1])",
    '',
    'plt.tight_layout()',
    'plt.show()',
  ]));

  // Factor ranking summary
  cells.push(markdownCell(slug, idx++, [
    '### Factor Rankings by Batch',
    '',
    'Factor rankings **differ by batch**, a key finding of this analysis:',
    '',
    '| Rank | Batch 1 | Effect | Batch 2 | Effect |',
    '|------|---------|--------|---------|--------|',
    '| 1 | X1 (Table Speed) | -30.77 | X2 (Down Feed Rate) | 18.22 |',
    '| 2 | X2 (Down Feed Rate) | 12.48 | X1 (Table Speed) | -14.98 |',
    '| 3 | X3 (Wheel Grit) | 5.07 | X3 (Wheel Grit) | 6.14 |',
    '',
    'In **Batch 1**, X1 (table speed) is the dominant factor with effect = -30.77.',
    'In **Batch 2**, X2 (down feed rate) is the dominant factor with effect = 18.22.',
    'This reversal of factor importance across batches is critical for optimization.',
  ]));

  // Interaction plots per batch
  cells.push(codeCell(slug, idx++, [
    '# Interaction Effects: mean response for each factor combination, per batch',
    "factor_pairs = [('X1', 'X2'), ('X1', 'X3'), ('X2', 'X3')]",
    '',
    'fig, axes = plt.subplots(2, 3, figsize=(15, 10))',
    "fig.suptitle('Interaction Plots by Batch',",
    "             fontsize=16, color=QUANTUM_COLORS['text'], y=1.02)",
    '',
    'for batch_num, ax_row in zip([1, 2], axes):',
    "    batch_data = df[df['Batch'] == batch_num]",
    '    for i, (f1, f2) in enumerate(factor_pairs):',
    "        interaction = batch_data.groupby([f1, f2])['Y'].mean().unstack()",
    '        ax = ax_row[i]',
    '        for col in interaction.columns:',
    "            ax.plot(interaction.index, interaction[col], 'o-',",
    '                    label=f\'{f2}={col}\', linewidth=2, markersize=6)',
    '        ax.set_title(f\'{f1} x {f2} - Batch {batch_num}\', fontsize=11)',
    "        ax.set_xlabel(f'{f1} Level')",
    "        ax.set_ylabel('Mean Strength')",
    "        ax.set_xticks([-1, 1])",
    '        ax.legend(fontsize=9)',
    '',
    'plt.tight_layout()',
    'plt.show()',
  ]));

  // Interaction interpretation
  cells.push(markdownCell(slug, idx++, [
    '### Interaction Effects Interpretation',
    '',
    'Non-parallel lines in the interaction plots indicate **interaction effects** between factors.',
    'When two lines cross or diverge substantially, the effect of one factor depends on the level',
    'of the other factor. Key observations:',
    '',
    '- **X1 x X2:** Moderate interaction in both batches',
    '- **X1 x X3:** Weak interaction',
    '- **X2 x X3:** Weak interaction',
    '',
    'The presence of interactions means that factor effects cannot be interpreted in isolation.',
    'Optimal settings must consider factor combinations, not just individual factor levels.',
  ]));

  return { cells, nextIndex: idx };
}
