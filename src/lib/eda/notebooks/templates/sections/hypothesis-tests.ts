/**
 * Hypothesis tests section builder.
 *
 * Generates code cells for the 5 categories of hypothesis tests:
 *   1. Location test (linregress for trend)
 *   2. Variation test (Bartlett)
 *   3. Randomness tests (manual runs test + lag-1 autocorrelation)
 *   4. Distribution test (Anderson-Darling) -- skipped for severe autocorrelation
 *   5. Outlier test (Grubbs) -- skipped for severe autocorrelation
 *
 * Conditional logic:
 *   - filter-transmittance and standard-resistor skip distribution/outlier
 *     tests with an explanation cell about severe autocorrelation.
 *   - fatigue-life adds Weibull/Gamma distribution comparison.
 *   - All notebooks use manual runs test (no statsmodels dependency).
 */

import type { Cell } from '../../types';
import type { CaseStudyConfig } from '../../registry/types';
import { codeCell, markdownCell } from '../../cells';

/** Slugs with severe autocorrelation that skip distribution/outlier tests */
export const SKIP_DISTRIBUTION_SLUGS = ['filter-transmittance', 'standard-resistor'];

/** Python code lines for Grubbs' test (reused for standard and fatigue-life paths) */
function grubbsTestCode(varName: string): string[] {
  return [
    "# Grubbs' test for outliers (manual implementation)",
    'def grubbs_test(data, alpha=0.05):',
    '    """',
    "    Grubbs' test for a single outlier.',",
    '    Returns (G_statistic, critical_value, is_outlier, suspect_value).',
    '    """',
    '    n = len(data)',
    '    mean = np.mean(data)',
    '    std = np.std(data, ddof=1)',
    '    abs_devs = np.abs(data - mean)',
    '    max_idx = np.argmax(abs_devs)',
    '    G = abs_devs[max_idx] / std',
    '',
    '    # Critical value from t-distribution',
    '    from scipy.stats import t as t_dist',
    '    t_crit = t_dist.ppf(1 - alpha / (2 * n), n - 2)',
    '    G_crit = ((n - 1) / np.sqrt(n)) * np.sqrt(t_crit**2 / (n - 2 + t_crit**2))',
    '',
    '    return G, G_crit, G > G_crit, data[max_idx]',
    '',
    `y = df['${varName}'].values`,
    'G, G_crit, is_outlier, suspect = grubbs_test(y)',
    '',
    "print(\"Grubbs' Test for Outliers\")",
    "print('=' * 40)",
    "print(f'G statistic:    {G:.4f}')",
    "print(f'Critical value: {G_crit:.4f}')",
    "print(f'Suspect value:  {suspect:.4f}')",
    "if is_outlier:",
    "    print(f'Result: {suspect:.4f} IS an outlier (G={G:.4f} > {G_crit:.4f})')",
    "else:",
    "    print(f'Result: No outlier detected (G={G:.4f} <= {G_crit:.4f})')",
  ];
}

/**
 * Build hypothesis tests section cells.
 */
export function buildHypothesisTests(
  config: CaseStudyConfig,
  slug: string,
  startIndex: number,
): { cells: Cell[]; nextIndex: number } {
  let idx = startIndex;
  const cells: Cell[] = [];
  const varName = config.responseVariable;
  const skipDistribution = SKIP_DISTRIBUTION_SLUGS.includes(slug);

  // Section header
  cells.push(markdownCell(slug, idx++, [
    '## Hypothesis Tests',
    '',
    'We apply five categories of hypothesis tests to evaluate the assumptions',
    'underlying a standard univariate EDA analysis.',
  ]));

  // --- 1. Location test (linear regression for trend) ---
  cells.push(markdownCell(slug, idx++, [
    '### 1. Location Test',
    '',
    'Test whether the data have a significant linear trend (drift in location)',
    'using ordinary least-squares regression of the response on run order.',
  ]));

  cells.push(codeCell(slug, idx++, [
    `# Location test: linear regression of ${varName} on run order`,
    `y = df['${varName}'].values`,
    'x = np.arange(1, len(y) + 1)',
    '',
    'from scipy.stats import linregress',
    '',
    'slope, intercept, r_value, p_value, std_err = linregress(x, y)',
    '',
    "print('Location Test (Linear Regression)')",
    "print('=' * 40)",
    "print(f'Slope:     {slope:.6f}')",
    "print(f'Intercept: {intercept:.6f}')",
    "print(f'R-squared: {r_value**2:.6f}')",
    "print(f'p-value:   {p_value:.6f}')",
    "print(f'Std Error: {std_err:.6f}')",
    "print()",
    `alpha = ${config.testParams?.alpha ?? 0.05}`,
    "if p_value < alpha:",
    "    print(f'Result: REJECT H0 (p={p_value:.4f} < {alpha}) -- significant trend detected')",
    "else:",
    "    print(f'Result: FAIL TO REJECT H0 (p={p_value:.4f} >= {alpha}) -- no significant trend')",
  ]));

  // --- 2. Variation test (Bartlett) ---
  cells.push(markdownCell(slug, idx++, [
    '### 2. Variation Test',
    '',
    "Bartlett's test for equality of variances across groups.",
    'We split the data into 4 equal groups and test whether their variances differ.',
  ]));

  cells.push(codeCell(slug, idx++, [
    `# Variation test: Bartlett's test on 4 equal groups`,
    `y = df['${varName}'].values`,
    'n = len(y)',
    'q = n // 4',
    'groups = [y[i*q:(i+1)*q] for i in range(4)]',
    '# Include remainder in last group',
    'if n % 4 != 0:',
    '    groups[-1] = y[3*q:]',
    '',
    'from scipy.stats import bartlett',
    '',
    'stat, p_value = bartlett(*groups)',
    '',
    "print(\"Bartlett's Test for Equal Variances\")",
    "print('=' * 40)",
    "print(f'Test statistic: {stat:.4f}')",
    "print(f'p-value:        {p_value:.6f}')",
    `alpha = ${config.testParams?.alpha ?? 0.05}`,
    "if p_value < alpha:",
    "    print(f'Result: REJECT H0 (p={p_value:.4f} < {alpha}) -- variances differ')",
    "else:",
    "    print(f'Result: FAIL TO REJECT H0 (p={p_value:.4f} >= {alpha}) -- variances are equal')",
  ]));

  // --- 3. Randomness tests ---
  cells.push(markdownCell(slug, idx++, [
    '### 3. Randomness Tests',
    '',
    'Two tests for randomness:',
    '- **Runs test** (manual implementation, no external dependencies)',
    '- **Lag-1 autocorrelation** with critical value 2/sqrt(N)',
  ]));

  // 3a. Manual runs test
  cells.push(codeCell(slug, idx++, [
    '# Manual runs test implementation',
    'def runs_test(data):',
    '    """',
    '    Wald-Wolfowitz runs test for randomness.',
    '    Returns (n_runs, expected_runs, z_statistic, p_value).',
    '    """',
    '    median = np.median(data)',
    '    binary = [1 if x >= median else 0 for x in data]',
    '    n1 = sum(binary)',
    '    n2 = len(binary) - n1',
    '',
    '    # Count runs',
    '    runs = 1',
    '    for i in range(1, len(binary)):',
    '        if binary[i] != binary[i - 1]:',
    '            runs += 1',
    '',
    '    # Expected runs and standard deviation',
    '    expected = (2 * n1 * n2) / (n1 + n2) + 1',
    '    std = np.sqrt((2 * n1 * n2 * (2 * n1 * n2 - n1 - n2)) /',
    '                  ((n1 + n2)**2 * (n1 + n2 - 1)))',
    '',
    '    z = (runs - expected) / std if std > 0 else 0.0',
    '    p = 2 * (1 - stats.norm.cdf(abs(z)))',
    '    return runs, expected, z, p',
    '',
    `y = df['${varName}'].values`,
    'n_runs, exp_runs, z_stat, p_val = runs_test(y)',
    '',
    "print('Runs Test for Randomness')",
    "print('=' * 40)",
    "print(f'Observed runs: {n_runs}')",
    "print(f'Expected runs: {exp_runs:.1f}')",
    "print(f'Z-statistic:   {z_stat:.4f}')",
    "print(f'p-value:       {p_val:.6f}')",
    `alpha = ${config.testParams?.alpha ?? 0.05}`,
    "if p_val < alpha:",
    "    print(f'Result: REJECT H0 (p={p_val:.4f} < {alpha}) -- data are NOT random')",
    "else:",
    "    print(f'Result: FAIL TO REJECT H0 (p={p_val:.4f} >= {alpha}) -- data appear random')",
  ]));

  // 3b. Lag-1 autocorrelation
  cells.push(codeCell(slug, idx++, [
    '# Lag-1 autocorrelation with critical value 2/sqrt(N)',
    `y = df['${varName}'].values`,
    'N = len(y)',
    'y_mean = np.mean(y)',
    '',
    '# Compute lag-1 autocorrelation coefficient',
    'numerator = np.sum((y[1:] - y_mean) * (y[:-1] - y_mean))',
    'denominator = np.sum((y - y_mean) ** 2)',
    'r1 = numerator / denominator',
    '',
    '# Critical value: 2/sqrt(N)',
    'critical = 2 / np.sqrt(N)',
    '',
    "print('Lag-1 Autocorrelation Test')",
    "print('=' * 40)",
    "print(f'Lag-1 autocorrelation: {r1:.6f}')",
    "print(f'Critical value (+/-): {critical:.6f}')",
    "print(f'Sample size N:        {N}')",
    "print()",
    "if abs(r1) > critical:",
    "    print(f'Result: |r1| = {abs(r1):.4f} > {critical:.4f} -- significant autocorrelation detected')",
    "else:",
    "    print(f'Result: |r1| = {abs(r1):.4f} <= {critical:.4f} -- no significant autocorrelation')",
  ]));

  // --- 4. Distribution test ---
  if (skipDistribution) {
    // Explain why distribution and outlier tests are skipped
    cells.push(markdownCell(slug, idx++, [
      '### 4. Distribution Test (Skipped)',
      '',
      `**Note:** Distribution and outlier tests are omitted for the ${config.title} case study`,
      'because the data exhibit severe autocorrelation (serial dependence).',
      'When data are strongly autocorrelated, distribution tests like Anderson-Darling',
      'and outlier tests like Grubbs produce misleading results because they assume',
      'independent observations. The autocorrelation must be modeled first.',
    ]));

    cells.push(markdownCell(slug, idx++, [
      '### 5. Outlier Test (Skipped)',
      '',
      'Skipped for the same reason as the distribution test above.',
      'Strong serial correlation in the data invalidates the independence assumption',
      'required by outlier detection methods.',
    ]));
  } else if (slug === 'fatigue-life') {
    // Fatigue-life: Anderson-Darling + Weibull/Gamma comparison
    cells.push(markdownCell(slug, idx++, [
      '### 4. Distribution Test',
      '',
      'The fatigue-life data are right-skewed, so we compare multiple distributions:',
      '- Normal (baseline)',
      '- Weibull (common for reliability/fatigue data)',
      '- Gamma (alternative for positive, skewed data)',
      '- Log-normal (common for multiplicative processes)',
    ]));

    cells.push(codeCell(slug, idx++, [
      '# Distribution comparison: Normal, Weibull, Gamma, Log-normal',
      `y = df['${varName}'].values`,
      '',
      '# Anderson-Darling test for normality',
      'from scipy.stats import anderson',
      'ad_result = anderson(y, dist="norm")',
      "print('Anderson-Darling Test for Normality')",
      "print('=' * 40)",
      "print(f'Statistic: {ad_result.statistic:.4f}')",
      "print(f'Critical values (15%, 10%, 5%, 2.5%, 1%): {ad_result.critical_values}')",
      "print()",
      '',
      '# Fit Weibull, Gamma, and Log-normal distributions',
      'from scipy.stats import weibull_min, gamma, lognorm',
      '',
      'weibull_params = weibull_min.fit(y, floc=0)',
      'gamma_params = gamma.fit(y, floc=0)',
      'lognorm_params = lognorm.fit(y, floc=0)',
      '',
      "print('Distribution Fit Comparison')",
      "print('=' * 40)",
      "print(f'Weibull shape (c): {weibull_params[0]:.4f}, scale: {weibull_params[2]:.2f}')",
      "print(f'Gamma shape (a):   {gamma_params[0]:.4f}, scale: {gamma_params[2]:.2f}')",
      "print(f'Log-normal shape:  {lognorm_params[0]:.4f}, scale: {lognorm_params[2]:.2f}')",
    ]));

    // Probability plots for distribution comparison
    cells.push(codeCell(slug, idx++, [
      '# Probability plots for Weibull and Gamma distributions',
      `y = df['${varName}'].values`,
      'y_sorted = np.sort(y)',
      'n = len(y)',
      'p = (np.arange(1, n + 1) - 0.5) / n',
      '',
      'fig, axes = plt.subplots(1, 2, figsize=(14, 6))',
      '',
      '# Weibull probability plot',
      'weibull_quantiles = weibull_min.ppf(p, *weibull_params)',
      "axes[0].scatter(weibull_quantiles, y_sorted, s=12, color=QUANTUM_COLORS['accent'], alpha=0.6)",
      'lims = [min(weibull_quantiles.min(), y_sorted.min()), max(weibull_quantiles.max(), y_sorted.max())]',
      "axes[0].plot(lims, lims, color=QUANTUM_COLORS['teal'], linewidth=2, label='Perfect fit')",
      "axes[0].set_xlabel('Weibull Theoretical Quantiles')",
      "axes[0].set_ylabel('Observed Values')",
      "axes[0].set_title('Weibull Probability Plot')",
      'axes[0].legend()',
      '',
      '# Gamma probability plot',
      'gamma_quantiles = gamma.ppf(p, *gamma_params)',
      "axes[1].scatter(gamma_quantiles, y_sorted, s=12, color=QUANTUM_COLORS['accent'], alpha=0.6)",
      'lims = [min(gamma_quantiles.min(), y_sorted.min()), max(gamma_quantiles.max(), y_sorted.max())]',
      "axes[1].plot(lims, lims, color=QUANTUM_COLORS['teal'], linewidth=2, label='Perfect fit')",
      "axes[1].set_xlabel('Gamma Theoretical Quantiles')",
      "axes[1].set_ylabel('Observed Values')",
      "axes[1].set_title('Gamma Probability Plot')",
      'axes[1].legend()',
      '',
      'plt.tight_layout()',
      'plt.show()',
    ]));

    // Grubbs outlier test
    cells.push(markdownCell(slug, idx++, [
      '### 5. Outlier Test (Grubbs)',
      '',
      "Grubbs' test identifies single outliers in a univariate dataset.",
    ]));

    cells.push(codeCell(slug, idx++, grubbsTestCode(varName)));
  } else {
    // Standard: Anderson-Darling + Grubbs
    cells.push(markdownCell(slug, idx++, [
      '### 4. Distribution Test (Anderson-Darling)',
      '',
      'The Anderson-Darling test checks whether the data follow a specified distribution.',
      'We test for normality.',
    ]));

    cells.push(codeCell(slug, idx++, [
      '# Anderson-Darling test for normality',
      `y = df['${varName}'].values`,
      '',
      'from scipy.stats import anderson',
      '',
      'ad_result = anderson(y, dist="norm")',
      '',
      "print('Anderson-Darling Test for Normality')",
      "print('=' * 40)",
      "print(f'Statistic: {ad_result.statistic:.4f}')",
      "print('Critical values:')",
      "for sl, cv in zip(ad_result.significance_level, ad_result.critical_values):",
      "    flag = ' ***' if ad_result.statistic > cv else ''",
      "    print(f'  {sl:5.1f}%: {cv:.4f}{flag}')",
      "print()",
      "if ad_result.statistic > ad_result.critical_values[2]:",
      "    print('Result: REJECT normality at 5% significance level')",
      "else:",
      "    print('Result: FAIL TO REJECT normality at 5% significance level')",
    ]));

    // Grubbs outlier test
    cells.push(markdownCell(slug, idx++, [
      '### 5. Outlier Test (Grubbs)',
      '',
      "Grubbs' test identifies single outliers in a univariate dataset.",
    ]));

    cells.push(codeCell(slug, idx++, grubbsTestCode(varName)));
  }

  return { cells, nextIndex: idx };
}
