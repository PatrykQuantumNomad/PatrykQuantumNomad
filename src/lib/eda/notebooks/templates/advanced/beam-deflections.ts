/**
 * Beam Deflections advanced notebook template.
 *
 * Assembles a complete EDA notebook for the beam deflections case study
 * (NIST Section 1.4.2.5) with sinusoidal model fitting and residual validation.
 *
 * Sections:
 *   1. Intro (reused standard)
 *   2. Setup (reused standard)
 *   3. Data Loading (reused standard)
 *   4. Summary Statistics (reused standard)
 *   5. 4-Plot (reused standard)
 *   6. Initial EDA Interpretation (inline - specific to beam deflections)
 *   7. Sinusoidal Model Fitting (new section builder)
 *   8. Residual 4-Plot Validation (new section builder)
 *   9. Residual Interpretation (inline - specific to beam deflections)
 *  10. Conclusions (inline - specialized for beam deflections)
 */

import type { NotebookV4, Cell } from '../../types';
import { getCaseStudyConfig } from '../../registry/index';
import { createNotebook } from '../../notebook';
import { buildIntro } from '../sections/intro';
import { buildSetup } from '../sections/setup';
import { buildDataLoading } from '../sections/data-loading';
import { buildSummaryStats } from '../sections/summary-stats';
import { buildFourPlot } from '../sections/four-plot';
import { buildSinusoidalFit } from '../sections/model-fitting/sinusoidal';
import { buildResidualValidation } from '../sections/model-fitting/residual-validation';
import { markdownCell } from '../../cells';

/**
 * Build the complete Beam Deflections advanced notebook.
 * Throws if the beam-deflections slug is not in the registry.
 */
export function buildBeamDeflectionsNotebook(): NotebookV4 {
  const slug = 'beam-deflections';
  const config = getCaseStudyConfig(slug);
  if (!config) {
    throw new Error(`Unknown case study slug: ${slug}`);
  }

  const allCells: Cell[] = [];
  let idx = 0;

  // --- Reuse standard sections ---
  const standardSections = [
    buildIntro,
    buildSetup,
    buildDataLoading,
    buildSummaryStats,
    buildFourPlot,
  ];

  for (const buildSection of standardSections) {
    const result = buildSection(config, slug, idx);
    allCells.push(...result.cells);
    idx = result.nextIndex;
  }

  // --- Initial EDA Interpretation (inline, beam-specific) ---
  allCells.push(markdownCell(slug, idx++, [
    '## Initial EDA Interpretation',
    '',
    'The standard 4-plot reveals important characteristics of the beam deflection data:',
    '',
    '- **Run Sequence Plot:** Shows a clear oscillating pattern -- the data are non-random',
    '- **Lag Plot:** Exhibits a **circular/sinusoidal pattern**, strongly suggesting periodic behavior',
    '- **Histogram:** The distribution appears roughly symmetric but is not normal',
    '- **Normal Probability Plot:** Deviations from the reference line indicate non-normality',
    '',
    'The circular lag plot is the key diagnostic: it reveals that the data follow a sinusoidal',
    'pattern rather than being random. Standard EDA assumptions (fixed location, fixed variation,',
    'randomness) are violated. A deterministic sinusoidal model is needed to capture the',
    'underlying process before the residuals can be treated as random.',
  ]));

  // --- Sinusoidal Model Fitting (section builder) ---
  {
    const result = buildSinusoidalFit(config, slug, idx);
    allCells.push(...result.cells);
    idx = result.nextIndex;
  }

  // --- Residual 4-Plot Validation (section builder) ---
  {
    const result = buildResidualValidation(config, slug, idx);
    allCells.push(...result.cells);
    idx = result.nextIndex;
  }

  // --- Residual Interpretation (inline, beam-specific) ---
  allCells.push(markdownCell(slug, idx++, [
    '## Residual Analysis Summary',
    '',
    'After fitting the sinusoidal model, the residual standard deviation is reduced from',
    '**277** (original data) to approximately **156** (residuals), confirming that the sinusoidal',
    'model captures a significant portion of the variability.',
    '',
    'The residual 4-plot should show:',
    '- **No systematic pattern** in the run sequence (unlike the original oscillating data)',
    '- **Random scatter** in the lag plot (the circular pattern should be removed)',
    '- **Approximately normal** histogram shape',
    '- **Better conformance** to the normal probability reference line',
    '',
    'If the residuals still show non-randomness, additional model refinement may be needed',
    '(e.g., outlier removal -- see NIST Section 1.4.2.5.4).',
  ]));

  // --- Conclusions (inline, beam-specific) ---
  allCells.push(markdownCell(slug, idx++, [
    '## Conclusions',
    '',
    '### Key Findings',
    '',
    '1. **Standard EDA reveals non-randomness:** The 4-plot analysis shows a clear sinusoidal',
    '   pattern in the beam deflection data, violating the randomness assumption',
    '',
    '2. **Sinusoidal model is appropriate:** The model Y = C + A*sin(2*pi*f*t + phi) fits the data',
    '   with parameters close to the NIST reference values',
    '',
    '3. **Model reduces variability:** The residual SD (~156) is substantially lower than the',
    '   original SD (~277), demonstrating the model captures the dominant periodic component',
    '',
    '4. **Residuals validate the model:** The residual 4-plot shows improved randomness compared',
    '   to the original data, confirming the sinusoidal model is adequate',
    '',
    '### Lessons Learned',
    '',
    '- The lag plot is a powerful diagnostic for detecting periodic patterns',
    '- When standard EDA reveals non-randomness, model development is the appropriate next step',
    '- Residual analysis is essential to validate that the fitted model is adequate',
    '',
    `**Reference:** [NIST/SEMATECH e-Handbook, Section ${config.nistSection}](${config.nistUrl})`,
  ]));

  return createNotebook(allCells);
}
