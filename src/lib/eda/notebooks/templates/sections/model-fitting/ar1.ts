/**
 * AR(1) model fitting section builder.
 *
 * Produces cells for autoregressive model development:
 *   - Markdown explaining AR(1) model: Y(i) = A0 + A1*Y(i-1) + E(i)
 *   - Code cell: linregress(y[:-1], y[1:]) to estimate A0, A1
 *   - Code cell: compute predicted values and residuals
 *   - Markdown with parameter comparison to NIST reference values
 */

import type { Cell } from '../../../types';
import type { CaseStudyConfig } from '../../../registry/types';
import { markdownCell, codeCell } from '../../../cells';

/**
 * Build AR(1) model fitting section cells.
 * @param config Case study configuration
 * @param slug Case study slug
 * @param startIndex Starting cell index for ID generation
 * @returns Array of cells and the next available index
 */
export function buildAR1Model(
  config: CaseStudyConfig,
  slug: string,
  startIndex: number,
): { cells: Cell[]; nextIndex: number } {
  let idx = startIndex;
  const cells: Cell[] = [];

  // Section header explaining the AR(1) model
  cells.push(markdownCell(slug, idx++, [
    '## AR(1) Model Development',
    '',
    'The lag plot reveals a strong linear relationship between Y(i) and Y(i-1), suggesting an **autoregressive model of order 1 (AR(1))**:',
    '',
    '$$Y(i) = A_0 + A_1 \\cdot Y(i-1) + E(i)$$',
    '',
    'where:',
    '- $A_0$ is the intercept',
    '- $A_1$ is the autoregressive coefficient (slope)',
    '- $E(i)$ is the random error term',
    '',
    'We fit this model using **linear regression** of Y(i) on Y(i-1) via `scipy.stats.linregress`.',
    '',
    '> **Note:** `linregress` returns `(slope, intercept, ...)`. In AR(1) notation: **slope = A1** (coefficient on Y(i-1)) and **intercept = A0**.',
  ]));

  // Code cell: fit AR(1) model using linregress
  cells.push(codeCell(slug, idx++, [
    '# Fit AR(1) model: Y(i) = A0 + A1 * Y(i-1) + E(i)',
    '# linregress(x, y) where x = Y(i-1) = y[:-1], y = Y(i) = y[1:]',
    'from scipy.stats import linregress',
    '',
    "y = df['Y'].values",
    '',
    '# AR(1): regress Y(i) on Y(i-1)',
    'slope, intercept, r_value, p_value, std_err = linregress(y[:-1], y[1:])',
    '',
    '# slope = A1 (autoregressive coefficient)',
    '# intercept = A0',
    'A1 = slope',
    'A0 = intercept',
    'A1_se = std_err',
    '',
    '# Compute t-value for A1',
    'A1_t = A1 / A1_se',
    '',
    "print(f'AR(1) Model: Y(i) = {A0:.6f} + {A1:.6f} * Y(i-1)')",
    "print(f'A0 (intercept) = {A0:.6f}')",
    "print(f'A1 (slope)     = {A1:.6f} +/- {A1_se:.6f}')",
    "print(f'A1 t-value     = {A1_t:.3f}')",
    "print(f'R-squared      = {r_value**2:.6f}')",
  ]));

  // Code cell: compute predicted values and residuals
  cells.push(codeCell(slug, idx++, [
    '# Compute predicted values and residuals',
    'y_pred = intercept + slope * y[:-1]',
    'residuals = y[1:] - y_pred',
    '',
    '# Residual standard deviation (ddof=2 for 2 estimated parameters: A0, A1)',
    'resid_sd = np.std(residuals, ddof=2)',
    'original_sd = np.std(y, ddof=1)',
    '',
    "print(f'Number of residuals: {len(residuals)}')",
    "print(f'Residual SD: {resid_sd:.4f}')",
    "print(f'Original SD: {original_sd:.4f}')",
    "print(f'Variability reduction: {original_sd/resid_sd:.1f}x')",
  ]));

  // Markdown cell: parameter comparison with NIST reference values
  cells.push(markdownCell(slug, idx++, [
    '### Parameter Comparison with NIST Reference Values',
    '',
    '| Parameter | Computed | NIST Reference | Std Error |',
    '|-----------|----------|---------------|-----------|',
    '| A0 (intercept) | `computed above` | 0.050165 | +/- 0.024171 |',
    '| A1 (slope) | `computed above` | 0.987087 | +/- 0.006313 |',
    '| A1 t-value | `computed above` | 156.350 | - |',
    '| Residual SD | `computed above` | 0.2931 | - |',
    '',
    'The AR(1) model captures nearly all the autocorrelation structure in the random walk data. ',
    'The autoregressive coefficient A1 = 0.987087 is very close to 1.0, indicating strong persistence.',
  ]));

  return { cells, nextIndex: idx };
}
