/**
 * 4-plot section: combined run sequence, lag, histogram, probability plot.
 *
 * Produces a markdown header and a single code cell generating
 * a 2x2 subplot grid with QUANTUM_COLORS theming.
 */

import type { Cell } from '../../types';
import type { CaseStudyConfig } from '../../registry/types';
import { codeCell, markdownCell } from '../../cells';

/**
 * Build 4-plot section cells.
 */
export function buildFourPlot(
  config: CaseStudyConfig,
  slug: string,
  startIndex: number,
): { cells: Cell[]; nextIndex: number } {
  let idx = startIndex;
  const cells: Cell[] = [];
  const varName = config.responseVariable;

  // Section header
  cells.push(markdownCell(slug, idx++, [
    '## 4-Plot Analysis',
    '',
    `The 4-plot is a collection of four graphical EDA techniques whose purpose is to test `,
    'the assumptions that underlie most measurement processes:',
    '',
    '1. **Run Sequence Plot** (upper left) -- tests fixed location and variation',
    '2. **Lag Plot** (upper right) -- tests randomness',
    '3. **Histogram** (lower left) -- tests distributional assumptions',
    '4. **Normal Probability Plot** (lower right) -- tests normality',
  ]));

  // 4-plot code cell
  cells.push(codeCell(slug, idx++, [
    `# 4-Plot: ${config.plotTitles.fourPlot}`,
    `y = df['${varName}'].values`,
    '',
    'fig, axes = plt.subplots(2, 2, figsize=(12, 10))',
    `fig.suptitle('${config.plotTitles.fourPlot}',`,
    "             fontsize=16, color=QUANTUM_COLORS['text'], y=0.98)",
    '',
    '# 1. Run Sequence Plot (upper left)',
    'ax = axes[0, 0]',
    "ax.plot(range(len(y)), y, '.', color=QUANTUM_COLORS['accent'],",
    '        markersize=3, alpha=0.7)',
    "ax.axhline(y.mean(), color=QUANTUM_COLORS['teal'],",
    "           linestyle='--', linewidth=1, label=f'Mean = {y.mean():.4f}')",
    "ax.set_xlabel('Observation Number')",
    `ax.set_ylabel('${varName}')`,
    "ax.set_title('Run Sequence Plot')",
    'ax.legend(fontsize=9)',
    '',
    '# 2. Lag Plot (upper right)',
    'ax = axes[0, 1]',
    "ax.scatter(y[:-1], y[1:], c=QUANTUM_COLORS['accent'],",
    '           s=5, alpha=0.5)',
    "ax.set_xlabel('Y(i)')",
    "ax.set_ylabel('Y(i+1)')",
    "ax.set_title('Lag Plot (lag=1)')",
    '',
    '# 3. Histogram (lower left)',
    'ax = axes[1, 0]',
    "ax.hist(y, bins='auto', color=QUANTUM_COLORS['accent'],",
    "        edgecolor=QUANTUM_COLORS['border'], alpha=0.8)",
    "ax.set_xlabel(f'{varName}')" === '' ? '' : `ax.set_xlabel('${varName}')`,
    "ax.set_ylabel('Frequency')",
    "ax.set_title('Histogram')",
    '',
    '# 4. Normal Probability Plot (lower right)',
    'ax = axes[1, 1]',
    "stats.probplot(y, dist='norm', plot=ax)",
    "ax.get_lines()[0].set_color(QUANTUM_COLORS['accent'])",
    "ax.get_lines()[1].set_color(QUANTUM_COLORS['teal'])",
    "ax.set_title('Normal Probability Plot')",
    '',
    'plt.tight_layout()',
    'plt.show()',
  ]));

  return { cells, nextIndex: idx };
}
