/**
 * Residual 4-plot validation section: 4-plot of residuals after model fitting.
 *
 * Produces a markdown header, a code cell generating a 2x2 residual 4-plot
 * (run sequence, lag plot, histogram, normal probability plot on residuals),
 * and a markdown cell interpreting the residual analysis.
 */

import type { Cell } from '../../../types';
import type { CaseStudyConfig } from '../../../registry/types';
import { codeCell, markdownCell } from '../../../cells';

/**
 * Build residual 4-plot validation section cells.
 * @param config Case study configuration
 * @param slug Case study slug
 * @param startIndex Starting cell index for ID generation
 * @returns Array of cells and the next available index
 */
export function buildResidualValidation(
  config: CaseStudyConfig,
  slug: string,
  startIndex: number,
): { cells: Cell[]; nextIndex: number } {
  let idx = startIndex;
  const cells: Cell[] = [];

  // Section header
  cells.push(markdownCell(slug, idx++, [
    '## Residual 4-Plot Analysis',
    '',
    'To validate the sinusoidal model, we apply the standard 4-plot analysis to the **residuals**.',
    'If the model adequately captures the underlying pattern, the residuals should appear random,',
    'with no remaining autocorrelation or systematic trends.',
  ]));

  // Residual 4-plot code cell
  cells.push(codeCell(slug, idx++, [
    '# Residual 4-Plot: validate sinusoidal model fit',
    '',
    'fig, axes = plt.subplots(2, 2, figsize=(12, 10))',
    "fig.suptitle('4-Plot of Residuals (Sinusoidal Model)',",
    "             fontsize=16, color=QUANTUM_COLORS['text'], y=0.98)",
    '',
    '# 1. Run Sequence Plot of residuals (upper left)',
    'ax = axes[0, 0]',
    "ax.plot(range(len(residuals)), residuals, '.', color=QUANTUM_COLORS['accent'],",
    '        markersize=3, alpha=0.7)',
    "ax.axhline(0, color=QUANTUM_COLORS['teal'],",
    "           linestyle='--', linewidth=1, label='Zero line')",
    "ax.set_xlabel('Observation Number')",
    "ax.set_ylabel('Residual')",
    "ax.set_title('Run Sequence Plot of Residuals')",
    'ax.legend(fontsize=9)',
    '',
    '# 2. Lag Plot of residuals (upper right)',
    'ax = axes[0, 1]',
    "ax.scatter(residuals[:-1], residuals[1:], c=QUANTUM_COLORS['accent'],",
    '           s=5, alpha=0.5)',
    "ax.set_xlabel('Residual(i)')",
    "ax.set_ylabel('Residual(i+1)')",
    "ax.set_title('Lag Plot of Residuals (lag=1)')",
    '',
    '# 3. Histogram of residuals (lower left)',
    'ax = axes[1, 0]',
    "ax.hist(residuals, bins='auto', color=QUANTUM_COLORS['accent'],",
    "        edgecolor=QUANTUM_COLORS['border'], alpha=0.8)",
    "ax.set_xlabel('Residual')",
    "ax.set_ylabel('Frequency')",
    "ax.set_title('Histogram of Residuals')",
    '',
    '# 4. Normal Probability Plot of residuals (lower right)',
    'ax = axes[1, 1]',
    "stats.probplot(residuals, dist='norm', plot=ax)",
    "ax.get_lines()[0].set_color(QUANTUM_COLORS['accent'])",
    "ax.get_lines()[1].set_color(QUANTUM_COLORS['teal'])",
    "ax.set_title('Normal Probability Plot of Residuals')",
    '',
    'plt.tight_layout()',
    'plt.show()',
  ]));

  // Residual interpretation
  cells.push(markdownCell(slug, idx++, [
    '### Residual Interpretation',
    '',
    'Examine the residual 4-plot:',
    '',
    '- **Run Sequence:** Residuals should scatter randomly around zero with no trends',
    '- **Lag Plot:** Residuals should show no autocorrelation (random scatter, not circular or linear)',
    '- **Histogram:** Should be roughly symmetric and unimodal',
    '- **Normal Probability Plot:** Points should follow the reference line approximately',
    '',
    'If the sinusoidal model is adequate, the systematic pattern visible in the original data',
    'should be removed, leaving only random noise in the residuals.',
  ]));

  return { cells, nextIndex: idx };
}
