/**
 * Sinusoidal model fitting section: model definition, curve_fit, residuals.
 *
 * Produces markdown and code cells for:
 * 1. Explanation of sinusoidal model Y(i) = C + A*sin(2*pi*freq*t + phi) + E(i)
 * 2. Model function definition
 * 3. Nonlinear least squares fitting via scipy.optimize.curve_fit
 * 4. Residual computation with ddof=4
 * 5. Parameter comparison table vs NIST reference values
 */

import type { Cell } from '../../../types';
import type { CaseStudyConfig } from '../../../registry/types';
import { codeCell, markdownCell } from '../../../cells';

/**
 * Build sinusoidal model fitting section cells.
 * @param config Case study configuration
 * @param slug Case study slug
 * @param startIndex Starting cell index for ID generation
 * @returns Array of cells and the next available index
 */
export function buildSinusoidalFit(
  config: CaseStudyConfig,
  slug: string,
  startIndex: number,
): { cells: Cell[]; nextIndex: number } {
  let idx = startIndex;
  const cells: Cell[] = [];

  // Section header: sinusoidal model explanation
  cells.push(markdownCell(slug, idx++, [
    '## Sinusoidal Model Fitting',
    '',
    'The 4-plot analysis revealed a clear sinusoidal pattern. We fit the model:',
    '',
    '$$Y(i) = C + A \\cdot \\sin(2\\pi \\cdot f \\cdot t + \\phi) + E(i)$$',
    '',
    'where:',
    '- **C** = constant offset (mean level)',
    '- **A** = amplitude',
    '- **f** = frequency (cycles per observation)',
    '- **phi** = phase shift',
    '- **E(i)** = random error',
    '',
    'We use `scipy.optimize.curve_fit` for nonlinear least squares estimation.',
  ]));

  // Model function definition
  cells.push(codeCell(slug, idx++, [
    '# Define the sinusoidal model',
    'from scipy.optimize import curve_fit',
    '',
    'def sinusoidal_model(t, C, A, freq, phi):',
    '    """Sinusoidal model: Y = C + A * sin(2*pi*freq*t + phi)"""',
    '    return C + A * np.sin(2 * np.pi * freq * t + phi)',
  ]));

  // Curve fitting with NIST starting values
  cells.push(codeCell(slug, idx++, [
    '# Fit sinusoidal model using NIST starting values',
    "y = df['Y'].values",
    't = np.arange(1, len(y) + 1)',
    '',
    '# Starting values from NIST analysis:',
    '# C = mean = -177.44, A = -390 (amplitude from complex demodulation)',
    '# freq = 0.3025 (from spectral plot), phi = 1.5 (initial guess)',
    'p0 = [-177.44, -390, 0.3025, 1.5]',
    '',
    'popt, pcov = curve_fit(sinusoidal_model, t, y, p0=p0)',
    'C_fit, A_fit, freq_fit, phi_fit = popt',
    'perr = np.sqrt(np.diag(pcov))  # parameter standard errors',
    '',
    "print('Fitted Parameters:')",
    "print(f'  C (offset)    = {C_fit:.3f} +/- {perr[0]:.2f}')",
    "print(f'  A (amplitude) = {A_fit:.3f} +/- {perr[1]:.2f}')",
    "print(f'  f (frequency) = {freq_fit:.6f} +/- {perr[2]:.6f}')",
    "print(f'  phi (phase)   = {phi_fit:.5f} +/- {perr[3]:.5f}')",
  ]));

  // Residual computation
  cells.push(codeCell(slug, idx++, [
    '# Compute residuals and residual standard deviation',
    'y_pred = sinusoidal_model(t, *popt)',
    'residuals = y - y_pred',
    '',
    '# ddof=4 because 4 parameters were estimated (C, A, freq, phi)',
    'resid_sd = np.std(residuals, ddof=4)',
    '',
    "print(f'Residual SD = {resid_sd:.4f}')",
    "print(f'Original SD = {np.std(y, ddof=1):.3f}')",
    "print(f'Variability reduction = {np.std(y, ddof=1)/resid_sd:.1f}x')",
  ]));

  // NIST reference comparison table
  cells.push(markdownCell(slug, idx++, [
    '### Parameter Comparison with NIST Reference Values',
    '',
    '| Parameter | Fitted Value | NIST Reference | NIST Std Error |',
    '|-----------|-------------|----------------|----------------|',
    '| C (offset) | see above | -178.786 | +/- 11.02 |',
    '| A (amplitude) | see above | -361.766 | +/- 26.19 |',
    '| f (frequency) | see above | 0.302596 | +/- 0.000151 |',
    '| phi (phase) | see above | 1.46536 | +/- 0.04909 |',
    '| Residual SD | see above | 155.8484 | -- |',
    '',
    'Source: NIST/SEMATECH e-Handbook, Section 1.4.2.5.3',
  ]));

  return { cells, nextIndex: idx };
}
