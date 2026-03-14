/**
 * Individual plots section: 4 separate full-size plot cells.
 *
 * Produces a markdown header + 4 pairs of (markdown header + code cell)
 * for run sequence, lag, histogram, and probability plots at full size.
 */

import type { Cell } from '../../types';
import type { CaseStudyConfig } from '../../registry/types';
import { codeCell, markdownCell } from '../../cells';

/**
 * Build individual plot section cells (4 separate code cells).
 */
export function buildIndividualPlots(
  config: CaseStudyConfig,
  slug: string,
  startIndex: number,
): { cells: Cell[]; nextIndex: number } {
  let idx = startIndex;
  const cells: Cell[] = [];
  const varName = config.responseVariable;

  // Section header
  cells.push(markdownCell(slug, idx++, [
    '## Individual Plots',
    '',
    'Full-size versions of each plot for detailed examination.',
  ]));

  // --- Run Sequence Plot ---
  cells.push(markdownCell(slug, idx++, [
    '### Run Sequence Plot',
    '',
    'Tests fixed location and fixed variation assumptions.',
  ]));

  cells.push(codeCell(slug, idx++, [
    `# ${config.plotTitles.runSequence}`,
    `y = df['${varName}'].values`,
    '',
    'fig, ax = plt.subplots(figsize=(12, 6))',
    "ax.plot(range(len(y)), y, '.', color=QUANTUM_COLORS['accent'],",
    '        markersize=4, alpha=0.7)',
    "ax.axhline(y.mean(), color=QUANTUM_COLORS['teal'],",
    "           linestyle='--', linewidth=1.5, label=f'Mean = {y.mean():.4f}')",
    "ax.axhline(y.mean() + y.std(), color=QUANTUM_COLORS['text_secondary'],",
    "           linestyle=':', linewidth=1, alpha=0.5, label=f'+1 SD')",
    "ax.axhline(y.mean() - y.std(), color=QUANTUM_COLORS['text_secondary'],",
    "           linestyle=':', linewidth=1, alpha=0.5, label=f'-1 SD')",
    "ax.set_xlabel('Observation Number')",
    `ax.set_ylabel('${varName}')`,
    `ax.set_title('${config.plotTitles.runSequence}')`,
    'ax.legend()',
    'plt.tight_layout()',
    'plt.show()',
  ]));

  // --- Lag Plot ---
  cells.push(markdownCell(slug, idx++, [
    '### Lag Plot',
    '',
    'Tests randomness assumption by plotting Y(i) vs Y(i-1).',
  ]));

  cells.push(codeCell(slug, idx++, [
    `# ${config.plotTitles.lagPlot}`,
    `y = df['${varName}'].values`,
    '',
    'fig, ax = plt.subplots(figsize=(8, 8))',
    "ax.scatter(y[:-1], y[1:], c=QUANTUM_COLORS['accent'],",
    '           s=8, alpha=0.5, edgecolors=\'none\')',
    '',
    '# Add diagonal reference line',
    'lims = [min(y.min(), y.min()), max(y.max(), y.max())]',
    "ax.plot(lims, lims, '--', color=QUANTUM_COLORS['teal'],",
    '        linewidth=1, alpha=0.5)',
    "ax.set_xlabel('Y(i)')",
    "ax.set_ylabel('Y(i+1)')",
    `ax.set_title('${config.plotTitles.lagPlot}')`,
    'ax.set_aspect(\'equal\')',
    'plt.tight_layout()',
    'plt.show()',
  ]));

  // --- Histogram ---
  cells.push(markdownCell(slug, idx++, [
    '### Histogram',
    '',
    'Tests distributional assumptions by showing the frequency distribution.',
  ]));

  cells.push(codeCell(slug, idx++, [
    `# ${config.plotTitles.histogram}`,
    `y = df['${varName}'].values`,
    '',
    'fig, ax = plt.subplots(figsize=(10, 6))',
    "ax.hist(y, bins='auto', color=QUANTUM_COLORS['accent'],",
    "        edgecolor=QUANTUM_COLORS['border'], alpha=0.8, density=True)",
    '',
    '# Overlay normal curve',
    'x_range = np.linspace(y.min(), y.max(), 200)',
    'ax.plot(x_range, stats.norm.pdf(x_range, y.mean(), y.std()),',
    "        color=QUANTUM_COLORS['teal'], linewidth=2, label='Normal fit')",
    '',
    `ax.set_xlabel('${varName}')`,
    "ax.set_ylabel('Density')",
    `ax.set_title('${config.plotTitles.histogram}')`,
    'ax.legend()',
    'plt.tight_layout()',
    'plt.show()',
  ]));

  // --- Normal Probability Plot ---
  cells.push(markdownCell(slug, idx++, [
    '### Normal Probability Plot',
    '',
    'Tests normality assumption. Points close to the line indicate normal distribution.',
  ]));

  cells.push(codeCell(slug, idx++, [
    `# ${config.plotTitles.probabilityPlot}`,
    `y = df['${varName}'].values`,
    '',
    'fig, ax = plt.subplots(figsize=(8, 8))',
    "res = stats.probplot(y, dist='norm', plot=ax)",
    '',
    "ax.get_lines()[0].set_color(QUANTUM_COLORS['accent'])",
    "ax.get_lines()[0].set_markersize(4)",
    "ax.get_lines()[1].set_color(QUANTUM_COLORS['teal'])",
    "ax.get_lines()[1].set_linewidth(2)",
    '',
    `ax.set_title('${config.plotTitles.probabilityPlot}')`,
    'plt.tight_layout()',
    'plt.show()',
  ]));

  return { cells, nextIndex: idx };
}
