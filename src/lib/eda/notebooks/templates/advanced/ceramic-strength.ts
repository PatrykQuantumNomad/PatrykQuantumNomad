/**
 * Ceramic Strength advanced notebook template.
 *
 * Builds a specialized Jupyter notebook for the NIST ceramic strength
 * DOE case study (JAHANMI2.DAT, 480 rows, 15 columns). This notebook
 * follows a fundamentally different analysis path from the standard
 * 10-section template:
 *
 *   custom-intro -> setup -> data-loading -> summary-stats -> 4-plot ->
 *   batch-effect -> lab-effect -> factor-analysis -> interaction-effects ->
 *   anova -> conclusions
 *
 * Key differences from standard template:
 * - Custom DOE-specific intro goals (not the standard 5 EDA goals)
 * - No standard hypothesis tests (shapiro, anderson, grubbs)
 * - Goes from 4-plot directly to batch effect and DOE analysis
 * - Factor rankings analyzed per batch (batch effect ~75 units)
 * - Only longitudinal data (X4=-1) are used (480 of 960 total rows)
 */

import type { NotebookV4, Cell } from '../../types';
import { getCaseStudyConfig } from '../../registry/index';
import { createNotebook } from '../../notebook';
import { markdownCell, codeCell } from '../../cells';
import { buildBrandingCell } from '../sections/intro';
import { buildSetup } from '../sections/setup';
import { buildDataLoading } from '../sections/data-loading';
import { buildSummaryStats } from '../sections/summary-stats';
import { buildFourPlot } from '../sections/four-plot';
import { buildBatchEffect } from '../sections/doe/batch-effect';
import { buildFactorAnalysis } from '../sections/doe/factor-analysis';
import { buildAnova } from '../sections/doe/anova';

/**
 * Build the Ceramic Strength advanced notebook.
 *
 * Uses custom DOE intro goals, reuses standard setup/data-loading/summary-stats/4-plot,
 * then adds specialized DOE sections: batch effect, lab effect, factor analysis,
 * interaction effects (within factor-analysis), and ANOVA.
 */
export function buildCeramicStrengthNotebook(): NotebookV4 {
  const slug = 'ceramic-strength';
  const config = getCaseStudyConfig(slug);
  if (!config) {
    throw new Error(`Unknown case study slug: ${slug}`);
  }

  const allCells: Cell[] = [];
  let idx = 0;

  // ── Section 1: Custom DOE Intro (NOT standard buildIntro) ──
  // Branding banner
  allCells.push(buildBrandingCell(slug, idx++));

  // Title cell
  allCells.push(markdownCell(slug, idx++, [
    `# ${config.title}`,
    '',
    `**NIST/SEMATECH e-Handbook of Statistical Methods, Section ${config.nistSection}**`,
    '',
    `Source: [${config.nistUrl}](${config.nistUrl})`,
  ]));

  // Background with DOE-specific goals
  allCells.push(markdownCell(slug, idx++, [
    '## Background',
    '',
    `${config.description}.`,
    '',
    'This is a **2^4 full factorial design of experiment (DOE)** with factors:',
    '- **X1:** Table Speed (-1 = slow, +1 = fast)',
    '- **X2:** Down Feed Rate (-1 = slow, +1 = fast)',
    '- **X3:** Wheel Grit (-1 = 140/170, +1 = 80/100)',
    '- **X4:** Direction (-1 = longitudinal, +1 = transverse)',
    '',
    'Only **longitudinal data (X4 = -1)** are analyzed here (480 of 960 total observations).',
    '',
    '### Analysis Goals',
    '',
    '1. **Factor Rankings:** Determine the strongest factor affecting ceramic strength',
    '2. **Effect Magnitudes:** Estimate the effect size of each factor',
    '3. **Optimal Settings:** Determine optimal factor settings for maximum strength',
    '4. **Batch Variability:** Assess batch-to-batch variability as a nuisance factor',
  ]));

  // ── Section 2: Setup (reuse standard) ──
  {
    const result = buildSetup(config, slug, idx);
    allCells.push(...result.cells);
    idx = result.nextIndex;
  }

  // ── Section 3: Data Loading (reuse standard) ──
  {
    const result = buildDataLoading(config, slug, idx);
    allCells.push(...result.cells);
    idx = result.nextIndex;
  }

  // ── Section 4: Summary Statistics (reuse standard) ──
  {
    const result = buildSummaryStats(config, slug, idx);
    allCells.push(...result.cells);
    idx = result.nextIndex;
  }

  // ── Section 5: 4-Plot (reuse standard) ──
  {
    const result = buildFourPlot(config, slug, idx);
    allCells.push(...result.cells);
    idx = result.nextIndex;
  }

  // ── Section 6: Batch Effect Analysis ──
  {
    const result = buildBatchEffect(config, slug, idx);
    allCells.push(...result.cells);
    idx = result.nextIndex;
  }

  // ── Section 7: Lab Effect Analysis (inline) ──
  allCells.push(markdownCell(slug, idx++, [
    '## Lab Effect Analysis',
    '',
    'Before analyzing primary factors, we also check for **lab effects** (nuisance factor).',
    'The data were collected across multiple labs, and systematic lab differences could',
    'confound factor effects.',
  ]));

  // Box plots by lab
  allCells.push(codeCell(slug, idx++, [
    '# Box plots by Lab',
    "fig, axes = plt.subplots(1, 2, figsize=(14, 6))",
    '',
    "# Overall by lab",
    'ax = axes[0]',
    "sns.boxplot(data=df, x='Lab', y='Y', ax=ax,",
    "            color=QUANTUM_COLORS['accent'])",
    "ax.set_title('Strength by Lab (Overall)', color=QUANTUM_COLORS['text'])",
    "ax.set_xlabel('Lab')",
    "ax.set_ylabel('Strength (Y)')",
    '',
    "# By lab within each batch",
    'ax = axes[1]',
    "for batch_num, color in zip([1, 2], [QUANTUM_COLORS['accent'], QUANTUM_COLORS['teal']]):",
    "    batch_data = df[df['Batch'] == batch_num]",
    "    lab_means = batch_data.groupby('Lab')['Y'].mean()",
    "    ax.plot(lab_means.index, lab_means.values, 'o-',",
    "            color=color, label=f'Batch {batch_num}', linewidth=2, markersize=6)",
    "ax.set_title('Mean Strength by Lab within Batch', color=QUANTUM_COLORS['text'])",
    "ax.set_xlabel('Lab')",
    "ax.set_ylabel('Mean Strength')",
    'ax.legend()',
    '',
    'plt.tight_layout()',
    'plt.show()',
  ]));

  // ── Section 8-9: Factor Analysis + Interaction Effects ──
  {
    const result = buildFactorAnalysis(config, slug, idx);
    allCells.push(...result.cells);
    idx = result.nextIndex;
  }

  // ── Section 10: ANOVA ──
  {
    const result = buildAnova(config, slug, idx);
    allCells.push(...result.cells);
    idx = result.nextIndex;
  }

  // ── Section 11: Conclusions ──
  allCells.push(markdownCell(slug, idx++, [
    '## Conclusions',
    '',
    '### Key Findings',
    '',
    '1. **Batch Effect Dominates:** The batch-to-batch difference (~75 units) is the',
    '   largest single source of variation. Batch 1 mean = 688.9987, Batch 2 mean = 611.1559',
    '   (T = 13.3806, highly significant).',
    '',
    '2. **Factor Rankings Differ by Batch:**',
    '   - **Batch 1:** X1 (Table Speed) is dominant (effect = -30.77)',
    '   - **Batch 2:** X2 (Down Feed Rate) is dominant (effect = 18.22)',
    '   - X3 (Wheel Grit) ranks third in both batches',
    '',
    '3. **Interaction Effects Present:** Non-parallel interaction plots indicate that',
    '   factor effects are not purely additive. The X1-X2 interaction is most notable.',
    '',
    '4. **Practical Implications:**',
    '   - The dominant batch effect must be controlled before optimizing factor settings',
    '   - Optimal factor settings depend on which batch is being produced',
    '   - A single set of optimal settings does not exist across batches',
    '',
    '### NIST Reference',
    '',
    `Full analysis: [${config.nistUrl}](${config.nistUrl})`,
  ]));

  return createNotebook(allCells);
}
