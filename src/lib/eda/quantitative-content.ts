/**
 * Prose content, KaTeX formulas, and Python code for all 18 quantitative technique pages.
 *
 * Each entry provides structured educational text derived from
 * NIST/SEMATECH Engineering Statistics Handbook Section 1.3.5.
 * Content is keyed by technique slug and consumed by
 * src/pages/eda/quantitative/[slug].astro.
 *
 * IMPORTANT: All `tex` strings use String.raw template literals
 * to prevent backslash escaping issues in KaTeX rendering.
 */

export interface QuantitativeContent {
  /** 2-3 sentences: what this technique is */
  definition: string;
  /** 2-3 sentences: when and why to use it */
  purpose: string;
  /** KaTeX display-mode formulas with labels and explanations */
  formulas: Array<{
    label: string;
    /** KaTeX display-mode formula (use String.raw) */
    tex: string;
    /** 1-2 sentences explaining the formula */
    explanation: string;
  }>;
  /** 3-5 sentences: how to interpret results */
  interpretation: string;
  /** 2-3 sentences: assumptions and limitations */
  assumptions: string;
  /** Python code example, if applicable */
  pythonCode?: string;
  /** NIST section reference */
  nistReference: string;
}

const QUANTITATIVE_CONTENT: Record<string, QuantitativeContent> = {
  'measures-of-location': {
    definition:
      'Measures of location summarize the central tendency of a dataset, indicating where the "center" of the data lies. The most common measures are the mean, median, and mode, each offering a different perspective on the typical value in a distribution.',
    purpose:
      'Use measures of location to characterize the center of a dataset before conducting further analysis. They are foundational descriptive statistics that provide a single representative value for a distribution. The choice between mean, median, and mode depends on the data distribution: the mean is preferred for symmetric data, while the median is more robust to outliers and skewed distributions.',
    formulas: [
      {
        label: 'Sample Mean',
        tex: String.raw`\bar{x} = \frac{1}{n}\sum_{i=1}^{n} x_i`,
        explanation:
          'The arithmetic average of all n observations. It uses every data point and is the most commonly used measure of location.',
      },
      {
        label: 'Sample Median',
        tex: String.raw`\tilde{x} = \begin{cases} x_{(k+1)} & \text{if } n = 2k+1 \\ \frac{x_{(k)} + x_{(k+1)}}{2} & \text{if } n = 2k \end{cases}`,
        explanation:
          'The middle value of the ordered dataset. It divides the data into two equal halves and is resistant to extreme values.',
      },
      {
        label: 'Trimmed Mean',
        tex: String.raw`\bar{x}_t = \frac{1}{n - 2g}\sum_{i=g+1}^{n-g} x_{(i)}`,
        explanation:
          'A compromise between the mean and median, computed by averaging after removing the g smallest and g largest values.',
      },
    ],
    interpretation:
      'When the mean and median are approximately equal, the data distribution is roughly symmetric. If the mean is substantially larger than the median, the distribution is right-skewed, indicating the presence of high outliers pulling the mean upward. Conversely, a mean smaller than the median suggests left skew. The trimmed mean provides a useful compromise: it retains the efficiency of the mean for symmetric distributions while offering some protection against outlier influence. Comparing all three measures gives a quick diagnostic of distributional shape.',
    assumptions:
      'The sample mean assumes the data come from a distribution with a finite first moment. It is sensitive to outliers, which can make it unrepresentative for heavily skewed or contaminated data. The median makes no distributional assumptions but is less statistically efficient than the mean for normally distributed data.',
    nistReference: 'NIST/SEMATECH e-Handbook, Section 1.3.5.1',
  },

  'confidence-limits': {
    definition:
      'Confidence limits define an interval estimate around a sample statistic that contains the true population parameter with a specified level of confidence. For the mean, this interval is constructed using the t-distribution to account for the uncertainty from estimating the population standard deviation.',
    purpose:
      'Use confidence limits to quantify the precision of a sample mean estimate. They provide a range of plausible values for the population mean, making them essential in quality control, process characterization, and scientific reporting. The width of the interval reflects both the sample variability and the sample size, guiding decisions about whether more data are needed.',
    formulas: [
      {
        label: 'Confidence Interval for the Mean',
        tex: String.raw`\bar{x} \pm t_{1-\alpha/2,\,\nu} \cdot \frac{s}{\sqrt{n}}`,
        explanation:
          'The interval is centered on the sample mean and extends by the critical t-value multiplied by the standard error. Here s is the sample standard deviation and nu = n - 1 degrees of freedom.',
      },
      {
        label: 'Standard Error of the Mean',
        tex: String.raw`\text{SE} = \frac{s}{\sqrt{n}}`,
        explanation:
          'The standard error quantifies the variability of the sample mean across repeated sampling. It decreases as the sample size increases.',
      },
      {
        label: 'Degrees of Freedom',
        tex: String.raw`\nu = n - 1`,
        explanation:
          'The degrees of freedom for the t-distribution equal the sample size minus one, reflecting the loss of one degree of freedom from estimating the mean.',
      },
    ],
    interpretation:
      'A 95% confidence interval means that if the sampling procedure were repeated many times, approximately 95% of the resulting intervals would contain the true population mean. A wider interval indicates greater uncertainty about the parameter, typically due to high variability or small sample size. If the confidence interval for a difference includes zero, the difference is not statistically significant at that confidence level. The interval width is inversely proportional to the square root of the sample size, so quadrupling the sample size halves the interval width. Reporting confidence intervals alongside point estimates is considered best practice because it conveys both the estimate and its precision.',
    assumptions:
      'The confidence interval for the mean assumes the data are independently and identically distributed from a population with a finite variance. For small samples, the underlying population should be approximately normal; for large samples (n > 30), the Central Limit Theorem ensures approximate validity regardless of the parent distribution.',
    nistReference: 'NIST/SEMATECH e-Handbook, Section 1.3.5.2',
  },

  'two-sample-t-test': {
    definition:
      'The two-sample t-test is a hypothesis test that determines whether the means of two independent groups differ significantly. It computes a t-statistic from the observed difference in sample means, standardized by the pooled (or unpooled) standard error.',
    purpose:
      'Use the two-sample t-test when you have two independent groups and want to test whether their population means are equal. This is one of the most commonly used statistical tests in science and engineering, applicable to comparing treatments, processes, or populations. It is a prerequisite check in many quality improvement and experimental analysis workflows.',
    formulas: [
      {
        label: 't-Statistic (Equal Variances)',
        tex: String.raw`t = \frac{\bar{x}_1 - \bar{x}_2}{s_p \sqrt{\frac{1}{n_1} + \frac{1}{n_2}}}`,
        explanation:
          'The test statistic measures the difference between two sample means in units of the pooled standard error.',
      },
      {
        label: 'Pooled Standard Deviation',
        tex: String.raw`s_p = \sqrt{\frac{(n_1 - 1)s_1^2 + (n_2 - 1)s_2^2}{n_1 + n_2 - 2}}`,
        explanation:
          'The pooled standard deviation combines the two sample variances, weighted by their degrees of freedom, under the equal-variance assumption.',
      },
      {
        label: 'Degrees of Freedom',
        tex: String.raw`\nu = n_1 + n_2 - 2`,
        explanation:
          'Under the equal-variance assumption, the degrees of freedom equal the total sample size minus two.',
      },
    ],
    interpretation:
      'Compare the absolute value of the computed t-statistic to the critical value from the t-distribution at the chosen significance level. If |t| exceeds the critical value, reject the null hypothesis that the two means are equal. Equivalently, if the p-value is less than the significance level (commonly 0.05), the difference is statistically significant. A large t-statistic indicates that the difference between means is large relative to the variability within the groups. Always pair this test with an examination of the confidence interval for the mean difference to assess practical significance.',
    assumptions:
      'The test assumes both samples are drawn independently from normally distributed populations. The pooled version additionally assumes equal population variances; when this assumption is violated, use the Welch (unequal variance) version. For large samples, the normality assumption is relaxed by the Central Limit Theorem.',
    pythonCode: `import numpy as np
from scipy import stats

# Sample data: two independent groups
group_a = np.array([24.5, 23.8, 25.1, 22.9, 24.2, 23.6, 25.0, 24.8])
group_b = np.array([26.3, 27.1, 25.8, 26.9, 27.5, 26.0, 27.2, 26.5])

# Two-sample t-test (assuming equal variances)
t_stat, p_value = stats.ttest_ind(group_a, group_b, equal_var=True)

print(f"t-statistic: {t_stat:.4f}")
print(f"p-value:     {p_value:.6f}")
print(f"Reject H0 at alpha=0.05: {p_value < 0.05}")

# Welch's t-test (unequal variances)
t_welch, p_welch = stats.ttest_ind(group_a, group_b, equal_var=False)
print(f"\\nWelch t-statistic: {t_welch:.4f}")
print(f"Welch p-value:     {p_welch:.6f}")`,
    nistReference: 'NIST/SEMATECH e-Handbook, Section 1.3.5.3',
  },

  'one-factor-anova': {
    definition:
      'One-factor analysis of variance (ANOVA) is a hypothesis test that determines whether three or more group means differ significantly. It decomposes the total variability into between-group and within-group components, comparing them via an F-statistic.',
    purpose:
      'Use one-factor ANOVA when comparing the means of three or more independent groups defined by a single categorical factor. It extends the two-sample t-test to multiple groups while controlling the family-wise error rate. ANOVA is fundamental in designed experiments, quality improvement studies, and any setting where the effect of a factor with multiple levels must be assessed.',
    formulas: [
      {
        label: 'F-Statistic',
        tex: String.raw`F = \frac{\text{MS}_{\text{between}}}{\text{MS}_{\text{within}}} = \frac{SS_B / (k-1)}{SS_W / (N-k)}`,
        explanation:
          'The ratio of between-group mean square to within-group mean square. A large F indicates that group means differ more than expected by chance.',
      },
      {
        label: 'Between-Group Sum of Squares',
        tex: String.raw`SS_B = \sum_{j=1}^{k} n_j (\bar{x}_j - \bar{x})^2`,
        explanation:
          'Measures the variability of the group means around the grand mean, weighted by group sizes.',
      },
      {
        label: 'Within-Group Sum of Squares',
        tex: String.raw`SS_W = \sum_{j=1}^{k} \sum_{i=1}^{n_j} (x_{ij} - \bar{x}_j)^2`,
        explanation:
          'Measures the variability of individual observations around their respective group means.',
      },
      {
        label: 'Total Sum of Squares',
        tex: String.raw`SS_T = SS_B + SS_W = \sum_{j=1}^{k}\sum_{i=1}^{n_j}(x_{ij} - \bar{x})^2`,
        explanation:
          'The total variability in the data, partitioned into between-group and within-group components.',
      },
    ],
    interpretation:
      'If the F-statistic exceeds the critical value from the F-distribution with (k-1, N-k) degrees of freedom, reject the null hypothesis that all group means are equal. A significant result indicates that at least one group mean differs, but does not identify which pairs differ -- follow-up multiple comparison tests (e.g., Tukey HSD) are needed for that. The ratio SS_B / SS_T gives the proportion of total variability explained by the factor, analogous to R-squared. When F is close to 1, the between-group variation is comparable to within-group variation, suggesting no factor effect.',
    assumptions:
      'ANOVA assumes that observations are independent, each group is drawn from a normally distributed population, and all groups have equal variances (homoscedasticity). Violations of normality are less serious for large, balanced designs, but unequal variances can inflate the Type I error rate. Use Levene or Bartlett tests to check the equal-variance assumption.',
    pythonCode: `import numpy as np
from scipy import stats

# Three groups of measurements
group1 = np.array([23.1, 24.3, 22.8, 23.9, 24.0])
group2 = np.array([26.4, 25.9, 27.1, 26.3, 26.8])
group3 = np.array([28.2, 27.5, 29.1, 28.0, 28.7])

# One-factor ANOVA
f_stat, p_value = stats.f_oneway(group1, group2, group3)

print(f"F-statistic: {f_stat:.4f}")
print(f"p-value:     {p_value:.6f}")
print(f"Reject H0 at alpha=0.05: {p_value < 0.05}")

# Effect size (eta-squared)
grand_mean = np.mean(np.concatenate([group1, group2, group3]))
ss_between = sum(len(g) * (np.mean(g) - grand_mean)**2
                 for g in [group1, group2, group3])
ss_total = sum(np.sum((g - grand_mean)**2)
               for g in [group1, group2, group3])
eta_sq = ss_between / ss_total
print(f"Eta-squared: {eta_sq:.4f}")`,
    nistReference: 'NIST/SEMATECH e-Handbook, Section 1.3.5.4',
  },

  'multi-factor-anova': {
    definition:
      'Multi-factor analysis of variance extends one-factor ANOVA to simultaneously test for the effects of two or more factors and their interactions. It partitions the total variability into components attributable to each factor, each interaction, and the residual error.',
    purpose:
      'Use multi-factor ANOVA in designed experiments where multiple factors may influence the response variable. It is more efficient than running separate one-factor analyses because it can detect interaction effects -- situations where the effect of one factor depends on the level of another. This technique is central to factorial experimental design and industrial process optimization.',
    formulas: [
      {
        label: 'Two-Factor F-Statistic (Factor A)',
        tex: String.raw`F_A = \frac{MS_A}{MS_E} = \frac{SS_A / (a-1)}{SS_E / (N - ab)}`,
        explanation:
          'Tests whether the main effect of factor A is significant. MS_A is the mean square for factor A and MS_E is the mean square error.',
      },
      {
        label: 'Interaction F-Statistic',
        tex: String.raw`F_{AB} = \frac{MS_{AB}}{MS_E} = \frac{SS_{AB} / (a-1)(b-1)}{SS_E / (N - ab)}`,
        explanation:
          'Tests whether the interaction between factors A and B is significant. A significant interaction means the effect of one factor depends on the level of the other.',
      },
      {
        label: 'Total Decomposition',
        tex: String.raw`SS_T = SS_A + SS_B + SS_{AB} + SS_E`,
        explanation:
          'The total sum of squares is partitioned into main effects for each factor, the interaction term, and the residual error.',
      },
    ],
    interpretation:
      'Examine the F-statistics for each main effect and interaction term, comparing them against the F-distribution critical values at the appropriate degrees of freedom. If the interaction term is significant, interpret main effects cautiously because the effect of each factor depends on the other factor levels. Interaction plots (plotting mean response versus one factor at each level of the other) are essential for understanding significant interactions. When no significant interaction exists, interpret main effects independently. The residual mean square provides an estimate of experimental error.',
    assumptions:
      'Multi-factor ANOVA assumes normality, independence, and homogeneity of variance across all factor-level combinations. Balanced designs (equal sample sizes per cell) are preferred because they make the analysis robust to moderate violations of assumptions and simplify the sum-of-squares decomposition. Unbalanced designs require Type III (or similar) sum-of-squares adjustments.',
    nistReference: 'NIST/SEMATECH e-Handbook, Section 1.3.5.5',
  },

  'measures-of-scale': {
    definition:
      'Measures of scale quantify the spread or variability of a dataset, indicating how tightly or loosely the observations cluster around the center. The most common measures are the variance, standard deviation, range, and interquartile range (IQR).',
    purpose:
      'Use measures of scale to characterize data dispersion and assess process variability. They are essential companions to measures of location: two datasets can have identical means but very different spreads. In quality control, the standard deviation directly determines process capability indices and control chart limits. The IQR is preferred when outliers are present or the distribution is skewed.',
    formulas: [
      {
        label: 'Sample Variance',
        tex: String.raw`s^2 = \frac{1}{n-1}\sum_{i=1}^{n}(x_i - \bar{x})^2`,
        explanation:
          'The average squared deviation from the sample mean, using n-1 in the denominator for an unbiased estimate of the population variance.',
      },
      {
        label: 'Sample Standard Deviation',
        tex: String.raw`s = \sqrt{\frac{1}{n-1}\sum_{i=1}^{n}(x_i - \bar{x})^2}`,
        explanation:
          'The square root of the variance, expressed in the same units as the original data for easier interpretation.',
      },
      {
        label: 'Range',
        tex: String.raw`R = x_{(n)} - x_{(1)}`,
        explanation:
          'The difference between the largest and smallest observations. Simple to compute but sensitive to outliers.',
      },
      {
        label: 'Interquartile Range',
        tex: String.raw`\text{IQR} = Q_3 - Q_1`,
        explanation:
          'The difference between the 75th and 25th percentiles. It captures the spread of the central 50% of the data and is robust to outliers.',
      },
    ],
    interpretation:
      'A small standard deviation relative to the mean indicates that observations are clustered tightly around the center, while a large value suggests wide dispersion. The coefficient of variation (CV = s / x-bar) allows comparison of variability across datasets with different units or scales. The range is the simplest but least robust measure, as a single outlier can inflate it dramatically. The IQR is preferred for skewed data or when outliers are present, as it depends only on the central portion of the distribution. When reporting variability, always pair the measure of scale with the corresponding measure of location.',
    assumptions:
      'The sample variance is an unbiased estimator of the population variance when observations are independent and identically distributed. The standard deviation is slightly biased for small samples from normal populations but consistent. For non-normal distributions, robust alternatives like the median absolute deviation (MAD) may be more appropriate.',
    nistReference: 'NIST/SEMATECH e-Handbook, Section 1.3.5.6',
  },

  'bartletts-test': {
    definition:
      'Bartlett\'s test assesses whether several independent samples have equal variances, a condition known as homoscedasticity. It computes a test statistic based on the ratio of the pooled variance to the individual group variances, approximately following a chi-square distribution.',
    purpose:
      'Use Bartlett\'s test before applying ANOVA or pooled t-tests to verify the equal-variance assumption. Violations of this assumption can inflate Type I error rates and produce misleading F-statistics. Bartlett\'s test is the most powerful test for homogeneity of variances when the data are normally distributed, making it the default choice for well-behaved data.',
    formulas: [
      {
        label: 'Bartlett Test Statistic',
        tex: String.raw`\chi^2 = \frac{(N-k)\ln s_p^2 - \sum_{j=1}^{k}(n_j - 1)\ln s_j^2}{1 + \frac{1}{3(k-1)}\left(\sum_{j=1}^{k}\frac{1}{n_j - 1} - \frac{1}{N-k}\right)}`,
        explanation:
          'Compares the logarithm of the pooled variance to the weighted sum of logarithms of individual group variances. Under H0, this follows a chi-square distribution with k-1 degrees of freedom.',
      },
      {
        label: 'Pooled Variance',
        tex: String.raw`s_p^2 = \frac{\sum_{j=1}^{k}(n_j - 1)s_j^2}{N - k}`,
        explanation:
          'The combined variance estimate across all groups, weighted by degrees of freedom.',
      },
    ],
    interpretation:
      'If the Bartlett test statistic exceeds the chi-square critical value at (k-1) degrees of freedom, reject the null hypothesis of equal variances. A large test statistic indicates that the group variances differ substantially. When the test is significant, consider using the Welch ANOVA or a non-parametric alternative instead of standard ANOVA. Note that Bartlett\'s test is highly sensitive to departures from normality -- even if variances are truly equal, non-normal data can produce false positives. For non-normal data, use the Levene test instead.',
    assumptions:
      'Bartlett\'s test assumes that each sample is drawn from a normal distribution. It is sensitive to non-normality, which can cause inflated Type I error rates. The test requires at least two groups, each with at least two observations.',
    pythonCode: `import numpy as np
from scipy import stats

# Three groups of measurements
group1 = np.array([23.1, 24.3, 22.8, 23.9, 24.0, 23.5])
group2 = np.array([26.4, 25.9, 27.1, 26.3, 26.8, 25.7])
group3 = np.array([28.2, 27.5, 29.1, 28.0, 28.7, 27.9])

# Bartlett's test for equal variances
stat, p_value = stats.bartlett(group1, group2, group3)

print(f"Bartlett statistic: {stat:.4f}")
print(f"p-value:            {p_value:.6f}")
print(f"Equal variances (alpha=0.05): {p_value > 0.05}")`,
    nistReference: 'NIST/SEMATECH e-Handbook, Section 1.3.5.7',
  },

  'chi-square-sd-test': {
    definition:
      'The chi-square test for the standard deviation tests whether a population standard deviation (or variance) equals a specified value. It uses the chi-square distribution to assess whether the observed sample variance is consistent with the hypothesized population variance.',
    purpose:
      'Use this test when a process or product specification defines an acceptable level of variability and you need to verify whether the observed variability meets that standard. It is commonly applied in manufacturing quality control, where specifications may require the process standard deviation to be below a target value. This is a one-sample test for variability, analogous to the one-sample t-test for means.',
    formulas: [
      {
        label: 'Chi-Square Test Statistic',
        tex: String.raw`\chi^2 = \frac{(n-1)s^2}{\sigma_0^2}`,
        explanation:
          'The test statistic scales the sample variance by the hypothesized population variance. Under H0, it follows a chi-square distribution with n-1 degrees of freedom.',
      },
      {
        label: 'Confidence Interval for Variance',
        tex: String.raw`\frac{(n-1)s^2}{\chi^2_{1-\alpha/2,\,n-1}} \leq \sigma^2 \leq \frac{(n-1)s^2}{\chi^2_{\alpha/2,\,n-1}}`,
        explanation:
          'The confidence interval for the population variance is constructed by inverting the chi-square test, using upper and lower critical values.',
      },
    ],
    interpretation:
      'Compare the computed chi-square statistic to the critical values from the chi-square distribution with n-1 degrees of freedom. For a two-sided test, reject H0 if the statistic falls outside the interval defined by the lower and upper critical values. For a one-sided test against excessive variability (the more common case), reject if the statistic exceeds the upper critical value. The confidence interval for the variance provides a range of plausible values for the population variance. Note that the chi-square distribution is asymmetric, so the confidence interval for the variance is also asymmetric.',
    assumptions:
      'This test requires the data to be drawn from a normal distribution. Unlike the t-test for the mean, the chi-square test for the variance is not robust to departures from normality, even for large samples. Always verify normality using a probability plot or Anderson-Darling test before applying this test.',
    nistReference: 'NIST/SEMATECH e-Handbook, Section 1.3.5.8',
  },

  'f-test': {
    definition:
      'The F-test for equality of two variances compares the variances of two independent samples by computing their ratio. Under the null hypothesis of equal population variances, this ratio follows an F-distribution.',
    purpose:
      'Use the F-test when you need to determine whether two independent groups have the same variability. It is often used as a preliminary test before the two-sample t-test to decide whether the pooled or Welch version is appropriate. The test is also important in its own right when comparing the precision of two measurement methods or processes.',
    formulas: [
      {
        label: 'F-Statistic',
        tex: String.raw`F = \frac{s_1^2}{s_2^2}`,
        explanation:
          'The ratio of the two sample variances, where by convention the larger variance is placed in the numerator to produce F >= 1.',
      },
      {
        label: 'Degrees of Freedom',
        tex: String.raw`\nu_1 = n_1 - 1, \quad \nu_2 = n_2 - 1`,
        explanation:
          'The numerator and denominator degrees of freedom correspond to the sample sizes of the two groups minus one.',
      },
    ],
    interpretation:
      'If the computed F-statistic exceeds the critical value from the F-distribution at (nu_1, nu_2) degrees of freedom, reject the null hypothesis of equal variances. For a two-sided test, use both upper and lower critical values, or equivalently, double the one-sided p-value. An F-value close to 1 indicates similar variances, while a large F indicates that one group is much more variable than the other. When the F-test rejects equality of variances, use the Welch t-test instead of the pooled t-test for comparing means.',
    assumptions:
      'The F-test assumes that both samples come from independent, normally distributed populations. Like the chi-square variance test, it is highly sensitive to non-normality, which can produce misleading results. The Levene test is a more robust alternative when normality cannot be assured.',
    pythonCode: `import numpy as np
from scipy import stats

# Two independent samples
sample1 = np.array([24.5, 23.8, 25.1, 22.9, 24.2, 23.6, 25.0, 24.8])
sample2 = np.array([26.3, 27.1, 25.8, 26.9, 27.5, 26.0, 24.5, 28.1])

# Compute F-statistic
var1 = np.var(sample1, ddof=1)
var2 = np.var(sample2, ddof=1)
f_stat = var1 / var2 if var1 >= var2 else var2 / var1

# Degrees of freedom
df1 = len(sample1) - 1 if var1 >= var2 else len(sample2) - 1
df2 = len(sample2) - 1 if var1 >= var2 else len(sample1) - 1

# Two-sided p-value
p_value = 2 * min(stats.f.sf(f_stat, df1, df2),
                  stats.f.cdf(f_stat, df1, df2))

print(f"Variance 1: {var1:.4f}")
print(f"Variance 2: {var2:.4f}")
print(f"F-statistic: {f_stat:.4f}")
print(f"p-value:     {p_value:.6f}")
print(f"Equal variances (alpha=0.05): {p_value > 0.05}")`,
    nistReference: 'NIST/SEMATECH e-Handbook, Section 1.3.5.9',
  },

  'levene-test': {
    definition:
      'The Levene test assesses whether multiple groups have equal variances without requiring the data to be normally distributed. It applies a one-factor ANOVA to the absolute deviations of observations from their group means (or medians).',
    purpose:
      'Use the Levene test as a robust alternative to Bartlett\'s test when the data may not be normally distributed. Since Bartlett\'s test is sensitive to non-normality, the Levene test is preferred in practice for verifying the homogeneity of variance assumption before ANOVA. The median-based variant (Brown-Forsythe) provides additional robustness against heavy-tailed or skewed distributions.',
    formulas: [
      {
        label: 'Levene W Statistic',
        tex: String.raw`W = \frac{(N-k)}{(k-1)} \cdot \frac{\sum_{j=1}^{k} n_j (\bar{Z}_{j\cdot} - \bar{Z}_{\cdot\cdot})^2}{\sum_{j=1}^{k}\sum_{i=1}^{n_j}(Z_{ij} - \bar{Z}_{j\cdot})^2}`,
        explanation:
          'An F-statistic computed on the transformed values Z_ij = |x_ij - x-bar_j|. The test is equivalent to a one-way ANOVA on absolute deviations.',
      },
      {
        label: 'Absolute Deviation Transform',
        tex: String.raw`Z_{ij} = |x_{ij} - \bar{x}_j|`,
        explanation:
          'Each observation is replaced by its absolute deviation from its group mean. Using the group median instead gives the Brown-Forsythe variant.',
      },
    ],
    interpretation:
      'The Levene W statistic follows an approximate F-distribution with (k-1, N-k) degrees of freedom under the null hypothesis of equal variances. If W exceeds the F critical value, reject equal variances. When comparing the mean-based and median-based variants, the median version is more robust to outliers but slightly less powerful for normal data. A significant Levene test suggests that standard ANOVA assumptions are violated, and a Welch ANOVA or non-parametric test should be used instead.',
    assumptions:
      'The Levene test requires independent observations but does not require normality, making it applicable to a broader range of distributions. It does assume that the groups are independent and that the sample sizes are reasonably balanced for optimal power.',
    pythonCode: `import numpy as np
from scipy import stats

# Three groups with potentially different variances
group1 = np.array([23.1, 24.3, 22.8, 23.9, 24.0, 23.5])
group2 = np.array([20.4, 29.9, 27.1, 22.3, 30.8, 25.7])
group3 = np.array([28.2, 27.5, 29.1, 28.0, 28.7, 27.9])

# Levene test (mean-based, default)
stat_mean, p_mean = stats.levene(group1, group2, group3, center='mean')
print(f"Levene (mean):   W={stat_mean:.4f}, p={p_mean:.6f}")

# Brown-Forsythe (median-based, more robust)
stat_med, p_med = stats.levene(group1, group2, group3, center='median')
print(f"Brown-Forsythe:  W={stat_med:.4f}, p={p_med:.6f}")

print(f"\\nEqual variances (alpha=0.05): {p_mean > 0.05}")`,
    nistReference: 'NIST/SEMATECH e-Handbook, Section 1.3.5.10',
  },

  'skewness-kurtosis': {
    definition:
      'Skewness measures the asymmetry of a probability distribution about its mean, while kurtosis measures the heaviness of the distribution tails relative to a normal distribution. Together, they characterize the shape of a distribution beyond what location and scale can describe.',
    purpose:
      'Use skewness and kurtosis to assess whether data conform to distributional assumptions required by many statistical methods. Large skewness suggests the data are not symmetric, which may invalidate mean-based analyses. Excess kurtosis indicates heavier or lighter tails than normal, affecting the reliability of confidence intervals and hypothesis tests that assume normality. These measures guide decisions about data transformations and the selection of appropriate statistical tests.',
    formulas: [
      {
        label: 'Sample Skewness',
        tex: String.raw`g_1 = \frac{\frac{1}{n}\sum_{i=1}^{n}(x_i - \bar{x})^3}{\left[\frac{1}{n}\sum_{i=1}^{n}(x_i - \bar{x})^2\right]^{3/2}}`,
        explanation:
          'The ratio of the third central moment to the cube of the standard deviation. Positive values indicate right skew; negative values indicate left skew.',
      },
      {
        label: 'Sample Kurtosis (Excess)',
        tex: String.raw`g_2 = \frac{\frac{1}{n}\sum_{i=1}^{n}(x_i - \bar{x})^4}{\left[\frac{1}{n}\sum_{i=1}^{n}(x_i - \bar{x})^2\right]^{2}} - 3`,
        explanation:
          'The ratio of the fourth central moment to the square of the variance, minus 3 so that the normal distribution has excess kurtosis zero. Positive values indicate heavy tails.',
      },
      {
        label: 'Standard Error of Skewness',
        tex: String.raw`\text{SE}(g_1) \approx \sqrt{\frac{6}{n}}`,
        explanation:
          'An approximate standard error for the sample skewness, used to test whether the skewness is significantly different from zero.',
      },
    ],
    interpretation:
      'A skewness near zero suggests the distribution is approximately symmetric. Values greater than 1 or less than -1 indicate substantial skewness. For kurtosis, values greater than zero (leptokurtic) indicate heavier tails than normal, while values less than zero (platykurtic) indicate lighter tails. A common rule of thumb is that skewness or kurtosis outside the range [-2, 2] warrants concern about normality. The D\'Agostino-Pearson omnibus test combines skewness and kurtosis into a single normality test. High kurtosis suggests the data may contain outliers or come from a mixture distribution.',
    assumptions:
      'Skewness and kurtosis are computed from sample moments and require independent observations from a continuous distribution. They are sensitive to outliers, and their sampling distributions converge slowly, so large samples (n > 50) are preferred for reliable inference. For small samples, graphical methods like probability plots are generally more informative.',
    nistReference: 'NIST/SEMATECH e-Handbook, Section 1.3.5.11',
  },

  'autocorrelation': {
    definition:
      'The autocorrelation coefficient measures the linear dependence between observations separated by a fixed number of time steps (the lag). It is the correlation of a time series with a lagged version of itself, normalized to lie between -1 and +1.',
    purpose:
      'Use autocorrelation to test whether successive measurements are statistically independent or exhibit serial correlation. It is fundamental for validating the independence assumption underlying many statistical procedures, including control charts, regression, and hypothesis tests. Significant autocorrelation at early lags indicates that the process has memory, which must be accounted for in any subsequent analysis.',
    formulas: [
      {
        label: 'Autocorrelation Coefficient at Lag k',
        tex: String.raw`r_k = \frac{\sum_{i=1}^{n-k}(x_i - \bar{x})(x_{i+k} - \bar{x})}{\sum_{i=1}^{n}(x_i - \bar{x})^2}`,
        explanation:
          'The sample autocorrelation at lag k, normalized by the total sum of squared deviations so that r_0 = 1.',
      },
      {
        label: 'Approximate 95% Significance Bounds',
        tex: String.raw`\pm \frac{1.96}{\sqrt{n}}`,
        explanation:
          'Under the null hypothesis of white noise, the autocorrelation at any lag is approximately normally distributed with standard error 1/sqrt(n).',
      },
    ],
    interpretation:
      'Plot the autocorrelation coefficients as a function of lag to create a correlogram. If the data are truly random, all autocorrelations should fall within the significance bounds (plus or minus 1.96/sqrt(n)). A slowly decaying autocorrelation function suggests a trend or drift in the data. A single spike at lag 1 followed by near-zero values suggests a first-order autoregressive process. Periodic spikes (e.g., at lags 12, 24, ...) indicate seasonality. The pattern of autocorrelations guides the selection of appropriate time-series models such as AR, MA, or ARMA processes.',
    assumptions:
      'The autocorrelation coefficient assumes the time series is weakly stationary, meaning that its mean and variance do not change over time. The significance bounds assume the null hypothesis of independent, identically distributed observations. For non-stationary data, differencing or detrending should be applied before computing autocorrelations.',
    nistReference: 'NIST/SEMATECH e-Handbook, Section 1.3.5.12',
  },

  'runs-test': {
    definition:
      'The runs test (Wald-Wolfowitz test) is a non-parametric test for randomness that counts the number of runs -- uninterrupted sequences of observations above or below the median. Too few or too many runs indicate non-random patterns in the data.',
    purpose:
      'Use the runs test to assess whether the order of observations is random, without making assumptions about the underlying distribution. It detects trends, oscillations, clustering, and other departures from randomness that might not be captured by the autocorrelation function. The test is particularly useful for residual analysis after model fitting and for validating the randomness assumption in control chart applications.',
    formulas: [
      {
        label: 'Expected Number of Runs',
        tex: String.raw`E(R) = \frac{2 n_1 n_2}{n_1 + n_2} + 1`,
        explanation:
          'The expected number of runs under the null hypothesis of randomness, where n1 and n2 are the counts of observations above and below the median.',
      },
      {
        label: 'Standard Deviation of Runs',
        tex: String.raw`\sigma_R = \sqrt{\frac{2n_1 n_2(2n_1 n_2 - n_1 - n_2)}{(n_1 + n_2)^2(n_1 + n_2 - 1)}}`,
        explanation:
          'The standard deviation of the number of runs under randomness, used to standardize the test statistic.',
      },
      {
        label: 'Z-Statistic',
        tex: String.raw`Z = \frac{R - E(R)}{\sigma_R}`,
        explanation:
          'The standardized test statistic, which follows an approximate standard normal distribution for large samples.',
      },
    ],
    interpretation:
      'If the absolute value of Z exceeds 1.96 (at the 5% significance level), reject the null hypothesis of randomness. Too few runs (negative Z) suggest positive autocorrelation or trending behavior -- adjacent observations tend to be on the same side of the median. Too many runs (positive Z) suggest negative autocorrelation or oscillatory behavior -- observations frequently alternate above and below the median. The runs test complements the autocorrelation function by detecting patterns that may not manifest as simple lag-1 dependence. Always visualize the data with a run-sequence plot to supplement the test results.',
    assumptions:
      'The runs test requires a sequence of observations in their original time order. It is a non-parametric test and makes no assumptions about the underlying distribution. The normal approximation for the Z-statistic requires a minimum sample size (generally n >= 20). The test is sensitive to ties at the median, which must be handled consistently.',
    nistReference: 'NIST/SEMATECH e-Handbook, Section 1.3.5.13',
  },

  'anderson-darling': {
    definition:
      'The Anderson-Darling test is a goodness-of-fit test that assesses whether a dataset follows a specified probability distribution. It gives greater weight to the tails of the distribution compared to other tests such as the Kolmogorov-Smirnov test, making it particularly sensitive to tail departures.',
    purpose:
      'Use the Anderson-Darling test as a formal goodness-of-fit test to complement graphical assessments such as probability plots. It is widely used to test for normality because many statistical procedures (t-tests, ANOVA, control charts) assume normally distributed data. The test is also applicable to other distributions including exponential, logistic, Gumbel, and Weibull, making it versatile for reliability and survival analysis.',
    formulas: [
      {
        label: 'Anderson-Darling Statistic',
        tex: String.raw`A^2 = -n - \sum_{i=1}^{n} \frac{2i - 1}{n}\left[\ln F(x_{(i)}) + \ln(1 - F(x_{(n+1-i)}))\right]`,
        explanation:
          'The test statistic measures the integrated squared difference between the empirical and hypothesized distributions, with extra weight in the tails.',
      },
      {
        label: 'Adjusted Statistic (Normality Test)',
        tex: String.raw`A^{*2} = A^2 \left(1 + \frac{0.75}{n} + \frac{2.25}{n^2}\right)`,
        explanation:
          'A small-sample correction factor applied when testing for normality, improving the accuracy of the critical value comparison.',
      },
    ],
    interpretation:
      'Compare the computed A-squared statistic (or the adjusted version for normality) against published critical values for the hypothesized distribution. Larger values of A-squared indicate greater departure from the hypothesized distribution. For the normality test, critical values at the 5% significance level are approximately 0.752 (adjusted). The Anderson-Darling test is generally more powerful than the Kolmogorov-Smirnov test, especially for detecting tail departures. When the test rejects normality, consider transformations (Box-Cox, log) or use non-parametric methods.',
    assumptions:
      'The Anderson-Darling test requires a fully specified null distribution, meaning the distribution parameters must be either known or estimated from the data (with appropriate adjusted critical values). Observations must be independent. The test is designed for continuous distributions; for discrete data, use the chi-square goodness-of-fit test instead.',
    pythonCode: `import numpy as np
from scipy import stats

# Sample data
data = np.array([
    12.1, 11.5, 13.2, 12.8, 11.9, 12.4, 13.0, 12.6,
    11.7, 12.3, 13.5, 12.0, 11.8, 12.9, 12.2, 13.1
])

# Anderson-Darling test for normality
result = stats.anderson(data, dist='norm')

print(f"A-squared statistic: {result.statistic:.4f}")
print(f"\\nCritical values and significance levels:")
for sl, cv in zip(result.significance_level, result.critical_values):
    status = "REJECT" if result.statistic > cv else "FAIL TO REJECT"
    print(f"  {sl:5.1f}%: cv={cv:.4f} -> {status}")`,
    nistReference: 'NIST/SEMATECH e-Handbook, Section 1.3.5.14',
  },

  'chi-square-gof': {
    definition:
      'The chi-square goodness-of-fit test determines whether observed frequency counts match expected counts under a hypothesized distribution. It bins the data and compares observed bin frequencies to the frequencies predicted by the theoretical distribution.',
    purpose:
      'Use the chi-square goodness-of-fit test for distribution testing when the data can be naturally binned into categories, or when testing discrete distributions. It is one of the oldest and most general goodness-of-fit tests, applicable to any distribution (continuous or discrete) once the data are binned. It is particularly useful when testing hypotheses about categorical data or when a closed-form CDF is not available.',
    formulas: [
      {
        label: 'Chi-Square Statistic',
        tex: String.raw`\chi^2 = \sum_{i=1}^{k} \frac{(O_i - E_i)^2}{E_i}`,
        explanation:
          'The sum of squared differences between observed (O_i) and expected (E_i) counts, each divided by the expected count. Under H0, this approximately follows a chi-square distribution.',
      },
      {
        label: 'Expected Frequency',
        tex: String.raw`E_i = n \cdot p_i`,
        explanation:
          'The expected count for bin i, where n is the total sample size and p_i is the probability of falling in bin i under the hypothesized distribution.',
      },
      {
        label: 'Degrees of Freedom',
        tex: String.raw`\nu = k - 1 - m`,
        explanation:
          'The degrees of freedom equal the number of bins minus one, minus the number of parameters estimated from the data (m).',
      },
    ],
    interpretation:
      'If the chi-square statistic exceeds the critical value at the chosen significance level with the appropriate degrees of freedom, reject the null hypothesis that the data follow the specified distribution. Large contributions to the statistic from individual bins indicate where the model fits poorly. The test is sensitive to the choice of binning: too few bins reduce power, while too many bins can produce bins with very low expected counts (a rule of thumb requires E_i >= 5 for all bins). The chi-square goodness-of-fit test is less powerful than the Anderson-Darling or Kolmogorov-Smirnov tests for continuous data because binning discards information about the ordering within bins.',
    assumptions:
      'The chi-square approximation requires that all expected cell frequencies are sufficiently large (typically >= 5). Observations must be independent. The test is applicable to both continuous and discrete distributions, but for continuous data the Anderson-Darling test is generally preferred because it does not require binning.',
    nistReference: 'NIST/SEMATECH e-Handbook, Section 1.3.5.15',
  },

  'kolmogorov-smirnov': {
    definition:
      'The Kolmogorov-Smirnov (K-S) test compares the empirical cumulative distribution function (ECDF) of a sample with a theoretical CDF. The test statistic is the maximum absolute difference between the two CDFs, making it a distribution-free test that does not require binning.',
    purpose:
      'Use the Kolmogorov-Smirnov test for goodness-of-fit testing when you want to avoid the binning required by the chi-square test. It is applicable to any continuous distribution and is particularly useful when the sample size is small to moderate. The two-sample variant can also compare two empirical distributions directly. The K-S test is widely used as a quick screening tool for distributional fit.',
    formulas: [
      {
        label: 'K-S Statistic',
        tex: String.raw`D_n = \sup_x |F_n(x) - F_0(x)|`,
        explanation:
          'The supremum of the absolute difference between the empirical CDF F_n(x) and the hypothesized CDF F_0(x) over all values of x.',
      },
      {
        label: 'Empirical CDF',
        tex: String.raw`F_n(x) = \frac{1}{n}\sum_{i=1}^{n} \mathbf{1}(x_i \leq x)`,
        explanation:
          'The empirical CDF is a step function that increases by 1/n at each data point, representing the proportion of observations less than or equal to x.',
      },
    ],
    interpretation:
      'Compare the D_n statistic to the critical value from the Kolmogorov-Smirnov table at the chosen significance level. If D_n exceeds the critical value, reject the null hypothesis that the data follow the specified distribution. The K-S test has less power than the Anderson-Darling test because it weights all parts of the distribution equally, whereas the Anderson-Darling test gives more weight to the tails. The K-S test is most sensitive to differences near the center of the distribution. For composite hypotheses (parameters estimated from data), the standard critical values are conservative -- use the Lilliefors correction for normality testing.',
    assumptions:
      'The K-S test requires a fully specified continuous null distribution. When parameters are estimated from the data, the standard critical values are no longer valid and modified tables (Lilliefors) must be used. The test is not applicable to discrete distributions because the CDF has jumps.',
    pythonCode: `import numpy as np
from scipy import stats

# Sample data
data = np.array([
    12.1, 11.5, 13.2, 12.8, 11.9, 12.4, 13.0, 12.6,
    11.7, 12.3, 13.5, 12.0, 11.8, 12.9, 12.2, 13.1
])

# K-S test against a normal distribution (parameters estimated)
mu, sigma = np.mean(data), np.std(data, ddof=1)
d_stat, p_value = stats.kstest(data, 'norm', args=(mu, sigma))

print(f"D-statistic: {d_stat:.4f}")
print(f"p-value:     {p_value:.6f}")
print(f"Normal at alpha=0.05: {p_value > 0.05}")

# Two-sample K-S test
sample_b = np.array([14.2, 13.8, 15.1, 14.5, 13.9, 14.7, 15.0, 14.3])
d2, p2 = stats.ks_2samp(data, sample_b)
print(f"\\nTwo-sample D: {d2:.4f}, p={p2:.6f}")`,
    nistReference: 'NIST/SEMATECH e-Handbook, Section 1.3.5.16',
  },

  'grubbs-test': {
    definition:
      'Grubbs\' test (also known as the maximum normed residual test) detects a single outlier in a univariate dataset assumed to come from a normally distributed population. It tests whether the most extreme value (maximum or minimum) is statistically aberrant.',
    purpose:
      'Use Grubbs\' test when you suspect that a single data point in a dataset may be an outlier and you want a formal statistical test rather than relying solely on visual inspection. It is commonly used in laboratory settings, quality control, and measurement science to identify and potentially remove anomalous readings. The test is designed for one outlier at a time; for multiple outliers, apply iteratively or use other methods.',
    formulas: [
      {
        label: 'Grubbs\' G Statistic',
        tex: String.raw`G = \frac{\max_{i=1,\ldots,n} |x_i - \bar{x}|}{s}`,
        explanation:
          'The ratio of the largest absolute deviation from the sample mean to the sample standard deviation. A large G indicates a potential outlier.',
      },
      {
        label: 'Critical Value',
        tex: String.raw`G_{\text{crit}} = \frac{(n-1)}{\sqrt{n}}\sqrt{\frac{t_{\alpha/(2n),\,n-2}^2}{n - 2 + t_{\alpha/(2n),\,n-2}^2}}`,
        explanation:
          'The critical value for a two-sided Grubbs\' test at significance level alpha, derived from the t-distribution with n-2 degrees of freedom.',
      },
    ],
    interpretation:
      'If the computed G statistic exceeds the critical value, reject the null hypothesis and conclude that the most extreme value is a statistical outlier. The test is designed for a single outlier: if you suspect multiple outliers, apply the test iteratively by removing one outlier at a time and retesting. However, masking effects can occur when multiple outliers are present simultaneously, potentially causing the test to miss them. Always visualize the data with a box plot or histogram to supplement the formal test. If an outlier is confirmed, investigate its cause before deciding whether to remove it.',
    assumptions:
      'Grubbs\' test assumes the data (excluding the suspected outlier) come from a normal distribution. The test is designed for independent observations and a single outlier. It should not be applied to very small samples (typically n >= 7 is recommended) because the test has low power in small samples.',
    pythonCode: `import numpy as np
from scipy import stats

# Sample data with a potential outlier
data = np.array([12.1, 11.5, 13.2, 12.8, 11.9, 12.4, 25.3, 12.6,
                 11.7, 12.3, 13.5, 12.0])

# Grubbs' test (manual computation -- no direct scipy function)
n = len(data)
mean = np.mean(data)
std = np.std(data, ddof=1)

# G statistic
G = np.max(np.abs(data - mean)) / std

# Critical value (two-sided, alpha = 0.05)
alpha = 0.05
t_crit = stats.t.ppf(1 - alpha / (2 * n), n - 2)
G_crit = ((n - 1) / np.sqrt(n)) * np.sqrt(t_crit**2 / (n - 2 + t_crit**2))

outlier_idx = np.argmax(np.abs(data - mean))

print(f"Suspected outlier: {data[outlier_idx]} (index {outlier_idx})")
print(f"G statistic: {G:.4f}")
print(f"G critical:  {G_crit:.4f}")
print(f"Is outlier (alpha=0.05): {G > G_crit}")`,
    nistReference: 'NIST/SEMATECH e-Handbook, Section 1.3.5.18',
  },

  'yates-analysis': {
    definition:
      'Yates analysis is an efficient algorithm for computing all main effects and interaction effects in a two-level full factorial (2^k) experiment. It systematically applies pairwise sums and differences to the ordered response totals to extract every factor effect in a single pass.',
    purpose:
      'Use Yates analysis when analyzing data from a 2^k factorial experiment to efficiently compute all main effects and interactions without constructing the full ANOVA table. The algorithm reduces the computational effort from O(2^k * k) to O(k * 2^k) operations and provides effect estimates that can be directly compared to assess factor importance. It is a classical tool in industrial experimentation and process optimization.',
    formulas: [
      {
        label: 'Yates Algorithm (Column Operation)',
        tex: String.raw`\begin{aligned} y_i' &= y_i + y_{i + 2^{j-1}} \quad &\text{(first half)} \\ y_i' &= y_{i} - y_{i - 2^{j-1}} \quad &\text{(second half)} \end{aligned}`,
        explanation:
          'At each step j = 1, 2, ..., k, the column of responses is transformed by computing pairwise sums (first half) and differences (second half). After k steps, the first entry is the grand total.',
      },
      {
        label: 'Effect Estimate',
        tex: String.raw`\text{Effect} = \frac{\text{Contrast}}{n \cdot 2^{k-1}}`,
        explanation:
          'Each contrast from the Yates algorithm is divided by the number of replicates times 2^(k-1) to obtain the estimated effect, representing the average change in response when that factor moves from its low to high level.',
      },
      {
        label: 'Sum of Squares for an Effect',
        tex: String.raw`SS = \frac{(\text{Contrast})^2}{n \cdot 2^k}`,
        explanation:
          'The sum of squares for each factor or interaction, used to assess statistical significance via the F-test.',
      },
    ],
    interpretation:
      'After applying the Yates algorithm, the resulting contrasts are ordered by the standard Yates convention: grand mean, factor A, factor B, AB interaction, factor C, AC, BC, ABC, and so on. The magnitude of each effect estimate indicates the practical importance of that factor or interaction. Effects can be ranked and plotted on a normal probability plot of effects (Daniel plot) to identify which are statistically significant -- significant effects will deviate from the line formed by the inactive effects. The sum of squares for each effect can be used to construct an ANOVA table and compute F-statistics.',
    assumptions:
      'Yates analysis assumes a complete 2^k factorial design with a fixed number of replicates per treatment combination. It requires that the factors have exactly two levels (low and high). For fractional factorials or designs with more than two levels, modified approaches are needed. The standard analysis assumes normally distributed errors with constant variance across all treatment combinations.',
    nistReference: 'NIST/SEMATECH e-Handbook, Section 1.3.5.21',
  },
};

/**
 * Retrieve the quantitative content for a given technique slug.
 */
export function getQuantitativeContent(slug: string): QuantitativeContent | undefined {
  return QUANTITATIVE_CONTENT[slug];
}
