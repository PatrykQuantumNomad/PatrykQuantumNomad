/**
 * Random Walk advanced notebook template.
 *
 * Assembles a complete notebook for the NIST Random Walk case study
 * (Section 1.4.2.3) with AR(1) model development and residual analysis.
 *
 * Section flow:
 *   1. Intro (reuse standard)
 *   2. Setup (reuse standard)
 *   3. Data Loading (reuse standard)
 *   4. Summary Statistics (reuse standard)
 *   5. 4-Plot (reuse standard)
 *   6. Initial EDA Interpretation (inline)
 *   7. AR(1) Model Development (via buildAR1Model)
 *   8. Predicted vs Original Plot (inline)
 *   9. Residual 4-Plot (inline - NOT imported from Plan 01)
 *  10. Residual Distribution (inline - uniform probability plot)
 *  11. Conclusions (inline)
 */

import type { NotebookV4, Cell } from '../../types';
import { getCaseStudyConfig } from '../../registry/index';
import { createNotebook } from '../../notebook';
import { markdownCell, codeCell } from '../../cells';
import { buildIntro } from '../sections/intro';
import { buildSetup } from '../sections/setup';
import { buildDataLoading } from '../sections/data-loading';
import { buildSummaryStats } from '../sections/summary-stats';
import { buildFourPlot } from '../sections/four-plot';
import { buildAR1Model } from '../sections/model-fitting/ar1';

/**
 * Build the complete Random Walk advanced notebook.
 * Produces a valid nbformat v4.5 notebook with AR(1) model
 * development and residual analysis.
 */
export function buildRandomWalkNotebook(): NotebookV4 {
  const slug = 'random-walk';
  const config = getCaseStudyConfig(slug);
  if (!config) {
    throw new Error(`Case study config not found for slug: ${slug}`);
  }

  const allCells: Cell[] = [];
  let idx = 0;

  // === Reuse standard sections ===

  // 1. Intro
  const intro = buildIntro(config, slug, idx);
  allCells.push(...intro.cells);
  idx = intro.nextIndex;

  // 2. Setup
  const setup = buildSetup(config, slug, idx);
  allCells.push(...setup.cells);
  idx = setup.nextIndex;

  // 3. Data Loading
  const dataLoading = buildDataLoading(config, slug, idx);
  allCells.push(...dataLoading.cells);
  idx = dataLoading.nextIndex;

  // 4. Summary Statistics
  const summaryStats = buildSummaryStats(config, slug, idx);
  allCells.push(...summaryStats.cells);
  idx = summaryStats.nextIndex;

  // 5. 4-Plot
  const fourPlot = buildFourPlot(config, slug, idx);
  allCells.push(...fourPlot.cells);
  idx = fourPlot.nextIndex;

  // === Custom sections for Random Walk ===

  // 6. Initial EDA Interpretation
  allCells.push(markdownCell(slug, idx++, [
    '## Initial EDA Interpretation',
    '',
    'The 4-plot reveals several important characteristics of this dataset:',
    '',
    '- **Run Sequence Plot:** Shows a wandering, non-stationary pattern with no fixed location.',
    '- **Lag Plot:** Shows a **strong linear relationship** between Y(i) and Y(i-1). ',
    'This strong positive autocorrelation indicates the data are **NOT random** -- each value is highly ',
    'dependent on the previous value.',
    '- **Histogram:** Appears roughly symmetric but does not follow a bell curve.',
    '- **Normal Probability Plot:** Shows some deviation from normality.',
    '',
    'The key insight is the lag plot: the nearly perfect linear structure Y(i) vs Y(i-1) ',
    'suggests an **AR(1) autoregressive model** is appropriate for this data.',
  ]));

  // 7. AR(1) Model Development (via section builder)
  const ar1 = buildAR1Model(config, slug, idx);
  allCells.push(...ar1.cells);
  idx = ar1.nextIndex;

  // 8. Predicted vs Original Plot
  allCells.push(markdownCell(slug, idx++, [
    '## Predicted vs Original',
    '',
    'Overlay the AR(1) predicted values on the original data to visually assess model fit.',
  ]));

  allCells.push(codeCell(slug, idx++, [
    '# Predicted vs Original overlay plot',
    "fig, ax = plt.subplots(figsize=(12, 5))",
    '',
    "ax.plot(range(len(y)), y, '.', color=QUANTUM_COLORS['accent'],",
    "        markersize=3, alpha=0.5, label='Original Y')",
    "ax.plot(range(1, len(y)), y_pred, '-', color=QUANTUM_COLORS['teal'],",
    "        linewidth=0.8, alpha=0.8, label='AR(1) Predicted')",
    '',
    "ax.set_xlabel('Observation Number')",
    "ax.set_ylabel('Y')",
    "ax.set_title('Random Walk: Original vs AR(1) Predicted Values')",
    'ax.legend()',
    'plt.tight_layout()',
    'plt.show()',
  ]));

  // 9. Residual 4-Plot (inlined -- Plan 01/02 run in parallel, cannot import)
  allCells.push(markdownCell(slug, idx++, [
    '## Residual 4-Plot',
    '',
    'Apply the standard 4-plot to the AR(1) residuals to validate that the model ',
    'has adequately captured the autocorrelation structure. If the model is correct, ',
    'the residuals should appear random.',
  ]));

  allCells.push(codeCell(slug, idx++, [
    '# Residual 4-Plot: run sequence, lag plot, histogram, normal probability plot',
    "fig, axes = plt.subplots(2, 2, figsize=(12, 10))",
    "fig.suptitle('4-Plot of AR(1) Residuals',",
    "             fontsize=16, color=QUANTUM_COLORS['text'], y=0.98)",
    '',
    '# 1. Run Sequence Plot of Residuals (upper left)',
    'ax = axes[0, 0]',
    "ax.plot(range(len(residuals)), residuals, '.', color=QUANTUM_COLORS['accent'],",
    '        markersize=3, alpha=0.7)',
    "ax.axhline(0, color=QUANTUM_COLORS['teal'],",
    "           linestyle='--', linewidth=1, label='Zero')",
    "ax.set_xlabel('Observation Number')",
    "ax.set_ylabel('Residual')",
    "ax.set_title('Run Sequence Plot of Residuals')",
    'ax.legend(fontsize=9)',
    '',
    '# 2. Lag Plot of Residuals (upper right)',
    'ax = axes[0, 1]',
    "ax.scatter(residuals[:-1], residuals[1:], c=QUANTUM_COLORS['accent'],",
    '           s=5, alpha=0.5)',
    "ax.set_xlabel('Residual(i)')",
    "ax.set_ylabel('Residual(i+1)')",
    "ax.set_title('Lag Plot of Residuals (lag=1)')",
    '',
    '# 3. Histogram of Residuals (lower left)',
    'ax = axes[1, 0]',
    "ax.hist(residuals, bins='auto', color=QUANTUM_COLORS['accent'],",
    "        edgecolor=QUANTUM_COLORS['border'], alpha=0.8)",
    "ax.set_xlabel('Residual')",
    "ax.set_ylabel('Frequency')",
    "ax.set_title('Histogram of Residuals')",
    '',
    '# 4. Normal Probability Plot of Residuals (lower right)',
    'ax = axes[1, 1]',
    "stats.probplot(residuals, dist='norm', plot=ax)",
    "ax.get_lines()[0].set_color(QUANTUM_COLORS['accent'])",
    "ax.get_lines()[1].set_color(QUANTUM_COLORS['teal'])",
    "ax.set_title('Normal Probability Plot of Residuals')",
    '',
    'plt.tight_layout()',
    'plt.show()',
  ]));

  // 10. Residual Distribution Analysis (uniform probability plot)
  allCells.push(markdownCell(slug, idx++, [
    '## Residual Distribution Analysis',
    '',
    'The NIST analysis shows that the AR(1) residuals follow a **uniform distribution**, ',
    'not a normal distribution. This is because the original random walk was generated ',
    'from cumulative sums of uniform random numbers minus 0.5.',
    '',
    'We verify this by generating a **uniform probability plot** of the residuals.',
  ]));

  allCells.push(codeCell(slug, idx++, [
    '# Uniform probability plot of residuals',
    'from scipy.stats import uniform',
    '',
    '# Fit a uniform distribution to the residuals',
    'loc, scale = uniform.fit(residuals)',
    '',
    "fig, axes = plt.subplots(1, 2, figsize=(12, 5))",
    '',
    '# Left: Uniform probability plot',
    'ax = axes[0]',
    "res = stats.probplot(residuals, dist='uniform', plot=ax)",
    "ax.get_lines()[0].set_color(QUANTUM_COLORS['accent'])",
    "ax.get_lines()[1].set_color(QUANTUM_COLORS['teal'])",
    "ax.set_title('Uniform Probability Plot of Residuals')",
    '',
    '# Right: Compare with normal probability plot',
    'ax = axes[1]',
    "res_n = stats.probplot(residuals, dist='norm', plot=ax)",
    "ax.get_lines()[0].set_color(QUANTUM_COLORS['accent'])",
    "ax.get_lines()[1].set_color(QUANTUM_COLORS['teal'])",
    "ax.set_title('Normal Probability Plot of Residuals (for comparison)')",
    '',
    'plt.tight_layout()',
    'plt.show()',
    '',
    "print(f'Uniform fit: loc={loc:.4f}, scale={scale:.4f}')",
    "print('The uniform probability plot should show points close to the diagonal,')",
    "print('confirming the residuals follow a uniform distribution.')",
  ]));

  // 11. Conclusions
  allCells.push(markdownCell(slug, idx++, [
    '## Conclusions',
    '',
    '### Key Findings',
    '',
    '1. **The data are NOT random.** The lag plot shows strong linear autocorrelation ',
    'between successive values Y(i) and Y(i-1).',
    '',
    '2. **AR(1) model captures the autocorrelation.** The model Y(i) = A0 + A1*Y(i-1) + E(i) ',
    'with A0 = 0.050165 and A1 = 0.987087 (t = 156.350) explains nearly all the serial dependence.',
    '',
    '3. **Variability reduced 7x.** The residual standard deviation (0.2931) is approximately ',
    '7 times smaller than the original standard deviation (2.079), demonstrating the model ',
    'captures most of the data structure.',
    '',
    '4. **Residuals are uniform, not normal.** The residual distribution follows a uniform pattern, ',
    'consistent with the data-generating process (cumulative sum of uniform random numbers).',
    '',
    '5. **Residual 4-plot confirms model adequacy.** The residuals show no remaining autocorrelation, ',
    'fixed location near zero, and constant variation.',
    '',
    `**Reference:** [NIST/SEMATECH e-Handbook, Section ${config.nistSection}](${config.nistUrl})`,
  ]));

  return createNotebook(allCells);
}
