/**
 * Technique content for distribution-shape analysis techniques.
 *
 * Techniques: bihistogram, bootstrap-plot, box-cox-linearity,
 * box-cox-normality, box-plot, histogram, normal-probability-plot,
 * probability-plot, qq-plot
 */

import type { TechniqueContent } from './types';

export const DISTRIBUTION_SHAPE_CONTENT: Record<string, TechniqueContent> = {
  'bihistogram': {
    definition:
      'A bihistogram is a graphical comparison tool that displays the frequency distributions of two datasets on a common horizontal axis, with one histogram plotted upward and the other plotted downward in mirror fashion. This back-to-back arrangement makes it straightforward to compare the shapes, centers, and spreads of two groups simultaneously.',
    purpose:
      'Use a bihistogram when comparing the distributional characteristics of two groups, such as a before-and-after treatment comparison, two competing manufacturing processes, or two measurement instruments. It is especially useful in quality engineering for assessing whether a process change shifted the location, altered the spread, or changed the shape of the distribution. The bihistogram provides a richer comparison than a simple comparison of summary statistics because it reveals the full distributional context.',
    interpretation:
      'The shared horizontal axis represents the measurement scale, while the upper histogram shows the frequency counts for one group and the lower histogram shows the counts for the other group reflected downward. A shift in the center of one histogram relative to the other indicates a difference in location between the two groups. A difference in the width of the two histograms suggests a difference in variability. Differences in shape, such as one distribution being symmetric while the other is skewed, are also readily apparent. When both histograms are roughly aligned and share a similar shape, the two groups are likely drawn from the same population.',
    assumptions:
      'The bihistogram requires that both datasets share a common measurement scale and that the bin widths are identical for both groups. Results can be sensitive to the choice of bin width, so it is advisable to experiment with different numbers of bins. The technique does not provide a formal statistical test and should be complemented with quantitative two-sample tests when a decision threshold is needed.',
    nistReference: 'NIST/SEMATECH e-Handbook of Statistical Methods, Section 1.3.3.2',
    questions: ['Is a (2-level) factor significant?', 'Does a (2-level) factor have an effect?', 'Does the location change between the 2 subgroups?', 'Does the variation change between the 2 subgroups?', 'Does the distributional shape change between subgroups?', 'Are there any outliers?'],
    importance: 'The bihistogram reveals the full distributional impact of a two-level factor, not just a shift in means. It detects changes in location, spread, and shape simultaneously, catching effects that a simple t-test would miss. This comprehensive comparison is critical in manufacturing process changes where a shift in variability matters as much as a shift in average.',
    definitionExpanded: 'The upper histogram displays the frequency distribution of one group (e.g., before treatment) and the lower histogram displays the other group (e.g., after treatment) reflected downward on a shared horizontal axis. Both histograms use identical bin widths and bin boundaries so that visual comparison is valid. The back-to-back layout eliminates the alignment ambiguity of overlaid histograms.',
    caseStudySlugs: ['ceramic-strength'],
    pythonCode: `import numpy as np
import matplotlib.pyplot as plt

# Generate two groups of data (before/after treatment)
rng = np.random.default_rng(42)
before = rng.normal(loc=50, scale=8, size=200)
after = rng.normal(loc=55, scale=6, size=200)

# Create bihistogram with shared x-axis
bins = np.linspace(25, 80, 35)
fig, (ax1, ax2) = plt.subplots(2, 1, sharex=True,
                                figsize=(10, 6))

ax1.hist(before, bins=bins, density=True, alpha=0.7,
         color='steelblue', edgecolor='white')
ax1.set_ylabel("Density")
ax1.set_title("Before Treatment")

ax2.hist(after, bins=bins, density=True, alpha=0.7,
         color='coral', edgecolor='white')
ax2.invert_yaxis()
ax2.set_ylabel("Density")
ax2.set_xlabel("Measurement Value")
ax2.set_title("After Treatment")

fig.suptitle("Bihistogram: Before vs After", y=1.02)
plt.tight_layout()
plt.show()`,
  },

  'bootstrap-plot': {
    definition:
      'A bootstrap plot shows the distribution of a sample statistic obtained through repeated resampling with replacement from the original dataset. By drawing many bootstrap samples and computing the statistic of interest for each, the plot builds an empirical picture of the sampling variability without requiring distributional assumptions.',
    purpose:
      'Use a bootstrap plot when assessing the stability of an estimate such as the mean, median, or standard deviation and when traditional confidence interval formulas may not be valid due to small sample size, non-normality, or complex estimators. Bootstrap methods are valuable when the theoretical sampling distribution of a statistic is unknown or difficult to derive analytically. The resulting distribution provides a direct, assumption-lean estimate of uncertainty for the statistic in question.',
    interpretation:
      'The bootstrap plot typically takes the form of a histogram or density plot of the resampled statistic values. The center of the distribution approximates the point estimate, while its spread reflects the sampling variability. A narrow, symmetric distribution indicates a stable estimate with low uncertainty, whereas a wide or skewed distribution warns that the estimate is imprecise or that the underlying data distribution has heavy tails or other features that affect estimation. The percentile interval, obtained by reading off the 2.5th and 97.5th percentiles of the bootstrap distribution, provides a nonparametric confidence interval.',
    assumptions:
      'The bootstrap assumes that the observed sample is representative of the population and that observations are independent. It may perform poorly with very small samples where the original data do not adequately capture the population structure. The number of bootstrap replications should be at least 1,000 and preferably 10,000 or more for reliable percentile intervals.',
    nistReference: 'NIST/SEMATECH e-Handbook of Statistical Methods, Section 1.3.3.4',
    questions: ['What does the sampling distribution for the statistic look like?', 'What is a 95% confidence interval for the statistic?', 'Which statistic has a sampling distribution with the smallest variance?'],
    importance: 'When theoretical confidence interval formulas are unavailable or unreliable (small samples, complex estimators, non-normal data), the bootstrap provides a purely empirical alternative. It answers the fundamental question "how much would my estimate change if I collected new data?" without requiring distributional assumptions.',
    definitionExpanded: 'The bootstrap procedure draws B random samples of size N with replacement from the original dataset, computes the statistic of interest for each resample, and plots the resulting B values as a histogram or density. The 2.5th and 97.5th percentiles of the bootstrap distribution form a 95% nonparametric confidence interval. Standard practice uses B \u2265 1000 for stable percentile intervals.',
    caseStudySlugs: ['uniform-random-numbers'],
    formulas: [
      {
        label: 'Bootstrap Resample',
        tex: String.raw`X^{*}_b = \{X^{*}_{b,1}, X^{*}_{b,2}, \ldots, X^{*}_{b,N}\} \quad \text{drawn with replacement from } \{X_1, \ldots, X_N\}`,
        explanation:
          'Each bootstrap sample draws N observations with replacement from the original dataset, so some observations may appear multiple times and others not at all.',
      },
      {
        label: 'Percentile Confidence Interval',
        tex: String.raw`CI_{1-\alpha} = \left(\hat{\theta}^{*}_{(\alpha/2)},\; \hat{\theta}^{*}_{(1-\alpha/2)}\right)`,
        explanation:
          'The bootstrap percentile interval uses the alpha/2 and 1-alpha/2 quantiles of the B bootstrap statistic values as the confidence bounds.',
      },
    ],
    pythonCode: `import numpy as np
import matplotlib.pyplot as plt
from scipy import stats

# Generate sample data
rng = np.random.default_rng(42)
data = rng.normal(loc=50, scale=10, size=30)

# Bootstrap the mean using scipy.stats.bootstrap
result = stats.bootstrap(
    (data,), np.mean, n_resamples=9999,
    confidence_level=0.95,
    rng=np.random.default_rng(42)
)

# Compute bootstrap distribution for plotting
boot_means = [np.mean(rng.choice(data, size=len(data)))
              for _ in range(9999)]

fig, ax = plt.subplots(figsize=(10, 5))
ax.hist(boot_means, bins=50, density=True,
        alpha=0.7, color='steelblue', edgecolor='white')
ax.axvline(result.confidence_interval.low, color='r',
           linestyle='--', label='95% CI')
ax.axvline(result.confidence_interval.high, color='r',
           linestyle='--')
ax.set_xlabel("Bootstrap Mean")
ax.set_ylabel("Density")
ax.set_title("Bootstrap Distribution of the Sample Mean")
ax.legend()
plt.tight_layout()
plt.show()`,
  },

  'box-cox-linearity': {
    definition:
      'A Box-Cox linearity plot helps identify the optimal power transformation of the predictor (X) variable that maximizes the linear correlation between a response Y and a predictor X. It evaluates a range of power transformation exponents and displays the correlation coefficient as a function of the transformation parameter lambda.',
    purpose:
      'Use a Box-Cox linearity plot when a scatter plot suggests a curvilinear relationship between a predictor and a response and a linear model is desired. The technique finds the value of lambda that maximizes the correlation between the response and the transformed predictor, effectively straightening the relationship. This is particularly useful in regression analysis when the analyst wants to apply a simple linear model but the raw data violate the linearity assumption.',
    interpretation:
      'The horizontal axis shows the range of lambda values tested, typically from -2 to +2, and the vertical axis shows the corresponding correlation coefficient between Y and the transformed X. The peak of the curve identifies the optimal lambda value. Common interpretable values include lambda equal to 1 (no transformation needed), 0.5 (square root), 0 (log transform by convention), and -1 (reciprocal). If the curve is relatively flat near the peak, multiple transformations give similar results and the analyst may choose the most interpretable one. A sharply peaked curve indicates that the linearity of the relationship is highly sensitive to the choice of transformation.',
    assumptions:
      'The Box-Cox linearity plot requires that the predictor values be strictly positive for most values of lambda, since raising negative numbers to fractional powers is undefined. It assumes a monotonic relationship between the predictor and response; if the relationship is not monotonic, no power transformation will produce linearity. The method targets linearity only and does not address heteroscedasticity or non-normality of residuals.',
    nistReference: 'NIST/SEMATECH e-Handbook of Statistical Methods, Section 1.3.3.5',
    questions: ['Would a suitable transformation improve my linear fit?', 'What is the optimal value of the transformation parameter?'],
    importance: 'Many bivariate relationships are non-linear in their original scale but become linear after a power transformation of the predictor. The Box-Cox linearity plot automates the search for this transformation, turning a difficult non-linear modeling problem into a simple linear regression.',
    definitionExpanded: 'The procedure evaluates X^\u03BB for a range of \u03BB values (typically \u22122 to +2) and computes the Pearson correlation between Y and X^\u03BB at each \u03BB. The \u03BB = 0 case uses log(X) by convention. The plot displays correlation vs. \u03BB, and the peak identifies the optimal transformation. Common special cases: \u03BB = 1 (no transform), 0.5 (square root), 0 (log), \u22121 (reciprocal).',
    formulas: [
      {
        label: 'Box-Cox Transformation',
        tex: String.raw`T(X) = \begin{cases} \dfrac{X^{\lambda} - 1}{\lambda} & \lambda \neq 0 \\[6pt] \ln(X) & \lambda = 0 \end{cases}`,
        explanation:
          'The Box-Cox family of power transformations applied to the predictor variable X. The lambda = 0 case uses the natural logarithm by convention as the limiting case.',
      },
      {
        label: 'Linearity Measure',
        tex: String.raw`r(\lambda) = \text{corr}\!\left(Y,\; T_{\lambda}(X)\right)`,
        explanation:
          'The Pearson correlation between the response Y and the transformed predictor is computed for each lambda value. The lambda that maximizes r(lambda) yields the most linear relationship.',
      },
    ],
    pythonCode: `import numpy as np
import matplotlib.pyplot as plt
from scipy import stats

# Generate nonlinear relationship: Y = sqrt(X) + noise
rng = np.random.default_rng(42)
X = rng.uniform(1, 50, size=100)
Y = np.sqrt(X) + rng.normal(0, 0.5, size=100)

# Evaluate correlation for a range of lambda values
lambdas = np.linspace(-2, 2, 201)
correlations = []
for lam in lambdas:
    if abs(lam) < 1e-10:
        T = np.log(X)
    else:
        T = (X**lam - 1) / lam
    r, _ = stats.pearsonr(Y, T)
    correlations.append(r)

optimal_idx = np.argmax(correlations)
optimal_lambda = lambdas[optimal_idx]

fig, ax = plt.subplots(figsize=(10, 5))
ax.plot(lambdas, correlations, 'b-', linewidth=2)
ax.axvline(optimal_lambda, color='r', linestyle='--',
           label=f'Optimal lambda = {optimal_lambda:.2f}')
ax.set_xlabel("Lambda")
ax.set_ylabel("Correlation r(lambda)")
ax.set_title("Box-Cox Linearity Plot")
ax.legend()
plt.tight_layout()
plt.show()`,
  },

  'box-cox-normality': {
    definition:
      'A Box-Cox normality plot identifies the optimal power transformation to make a dataset approximately normally distributed. It evaluates the normality of the transformed data across a range of lambda values and selects the one that yields the best fit to a normal distribution.',
    purpose:
      'Use a Box-Cox normality plot when the data are skewed or otherwise non-normal and normality is required for downstream statistical analysis, such as t-tests, ANOVA, or control chart construction. The method automates the search for an appropriate power transformation, saving the analyst from trial-and-error experimentation with logs, square roots, and reciprocals. It is especially common in process capability studies where normality is a prerequisite for calculating capability indices.',
    interpretation:
      'The horizontal axis represents the lambda parameter and the vertical axis represents a normality measure, often the probability plot correlation coefficient or the Shapiro-Wilk statistic. The value of lambda that maximizes normality is the optimal transformation. The plot typically includes a confidence interval or reference threshold to help the analyst assess whether the improvement is statistically meaningful. If the optimal lambda is near 1, no transformation is needed. If the peak is broad, several transformations yield comparably normal results, and the simplest interpretable value should be chosen.',
    assumptions:
      'The data must be strictly positive for the Box-Cox family of transformations to be applied over the full range of lambda. Outliers can strongly influence the optimal lambda and should be investigated before relying on the transformation. The Box-Cox approach finds the best power transformation for normality but cannot make fundamentally multi-modal data normal, since no power transformation can split a bimodal distribution into a unimodal one.',
    nistReference: 'NIST/SEMATECH e-Handbook of Statistical Methods, Section 1.3.3.6',
    questions: ['Is there a transformation that will normalize my data?', 'What is the optimal value of the transformation parameter?'],
    importance: 'Many statistical procedures (t-tests, ANOVA, capability indices) assume normally distributed data. When the raw data are skewed, the Box-Cox normality plot identifies the power transformation that best achieves normality, providing a systematic, data-driven alternative to ad hoc log or square root transforms.',
    definitionExpanded: 'The procedure transforms the data as Y^\u03BB for a range of \u03BB values and evaluates the normality of each transformed dataset using the probability plot correlation coefficient (PPCC) or a similar metric. The optimal \u03BB maximizes normality. The plot typically includes a confidence interval around the peak to indicate the range of \u03BB values that produce comparable normality. If the interval includes \u03BB = 1, no transformation is necessary.',
    formulas: [
      {
        label: 'Box-Cox Transformation for Normality',
        tex: String.raw`T(Y) = \begin{cases} \dfrac{Y^{\lambda} - 1}{\lambda} & \lambda \neq 0 \\[6pt] \ln(Y) & \lambda = 0 \end{cases}`,
        explanation:
          'The Box-Cox power transformation applied to the response variable Y. The optimal lambda is the value that makes the transformed data most closely approximate a normal distribution.',
      },
      {
        label: 'PPCC vs Lambda Curve',
        tex: String.raw`\text{PPCC}(\lambda) = \text{corr}\!\left(T_{\lambda}(Y_{(i)}),\; M_i\right)`,
        explanation:
          'The probability plot correlation coefficient measures the linearity of the normal probability plot for the transformed data. M_i are the expected normal order statistics. The lambda that maximizes PPCC yields the best normality.',
      },
    ],
    pythonCode: `import numpy as np
import matplotlib.pyplot as plt
from scipy import stats

# Generate right-skewed sample data
rng = np.random.default_rng(42)
data = rng.lognormal(mean=2, sigma=0.8, size=200)

# Box-Cox normality plot
fig, ax = plt.subplots(figsize=(10, 5))
lmbdas, ppcc = stats.boxcox_normplot(data, la=-2, lb=2, plot=ax)

# Find and mark the optimal lambda
optimal_lambda = lmbdas[np.argmax(ppcc)]
ax.axvline(optimal_lambda, color='r', linestyle='--',
           label=f'Optimal lambda = {optimal_lambda:.2f}')
ax.set_title("Box-Cox Normality Plot")
ax.legend()
plt.tight_layout()
plt.show()`,
  },

  'box-plot': {
    definition:
      'A box plot, also known as a box-and-whisker plot, is a standardized display of a dataset based on the five-number summary: minimum, first quartile, median, third quartile, and maximum. The central box spans the interquartile range (IQR) from Q1 to Q3, a line inside the box marks the median, and whiskers extend to the most extreme data points within 1.5 times the IQR, with points beyond that threshold plotted individually as potential outliers.',
    purpose:
      'Use a box plot when comparing the location, spread, and symmetry of one or more groups in a compact graphical format. Box plots are particularly effective for side-by-side comparisons of multiple samples or factor levels, making them a staple of exploratory data analysis in quality engineering, process comparison, and designed experiments. They provide immediate visual answers to questions such as whether groups differ in central tendency, whether variability is constant across groups, and whether outliers are present.',
    interpretation:
      'The position of the median line within the box reveals the symmetry of the distribution: a centered median indicates symmetry, while a median closer to Q1 or Q3 suggests right or left skewness, respectively. The length of the box shows the interquartile range and serves as a robust measure of spread. Whisker lengths indicate the range of the bulk of the data, and individual points plotted beyond the whiskers are candidate outliers deserving further investigation. When comparing multiple box plots, differences in box height indicate differing variability, while vertical offsets between median lines indicate differences in location.',
    assumptions:
      'Box plots make no distributional assumptions and are appropriate for any continuous or ordinal data. However, they can be misleading for very small samples where quartile estimates are unreliable, and they do not reveal multi-modality within a group. For small datasets, supplementing the box plot with a dot plot or jitter plot provides additional context about the underlying data density.',
    nistReference: 'NIST/SEMATECH e-Handbook of Statistical Methods, Section 1.3.3.7',
    questions: ['Is a factor significant?', 'Does the location differ between subgroups?', 'Does the variation differ between subgroups?', 'Are there any outliers?'],
    importance: 'The box plot is the most widely used graphical tool for comparing groups in designed experiments and process analysis. It provides a compact, standardized five-number summary that enables rapid comparison of location, spread, and symmetry across many groups simultaneously, making it indispensable for factorial analysis and quality control.',
    definitionExpanded: 'The box spans from Q1 (25th percentile) to Q3 (75th percentile), with the median marked as a line within the box. The interquartile range (IQR) = Q3 \u2212 Q1 measures the spread of the middle 50% of the data. Whiskers extend to the most extreme observations within 1.5 \u00D7 IQR from the box edges. Observations beyond the whiskers are plotted individually as potential outliers. The 1.5 \u00D7 IQR rule identifies approximately 0.7% of observations as outliers under a normal distribution.',
    caseStudySlugs: ['ceramic-strength'],
    pythonCode: `import numpy as np
import matplotlib.pyplot as plt

# Generate data for 4 groups with different characteristics
rng = np.random.default_rng(42)
group_a = rng.normal(loc=50, scale=5, size=30)
group_b = rng.normal(loc=55, scale=8, size=30)
group_c = rng.normal(loc=45, scale=5, size=30)
group_d = rng.normal(loc=50, scale=12, size=30)

# Create box plot
fig, ax = plt.subplots(figsize=(10, 5))
ax.boxplot([group_a, group_b, group_c, group_d],
           labels=['Group A', 'Group B', 'Group C', 'Group D'],
           orientation='vertical', patch_artist=True,
           boxprops=dict(facecolor='steelblue', alpha=0.7))
ax.set_ylabel("Measurement Value")
ax.set_title("Box Plot: Comparison of Four Groups")
plt.tight_layout()
plt.show()`,
    examples: [
      { label: 'Equal Groups', description: 'All box plots have similar medians, similar IQR heights, and similar whisker lengths. This indicates no significant difference between groups — the factor does not affect either the location or the spread of the response.' },
      { label: 'Location Shift', description: 'Box plots have similar heights and whisker lengths but different median positions. This indicates the factor affects the average response without changing the variability, a classic location effect.' },
      { label: 'Spread Difference', description: 'Box plots have similar medians but markedly different heights. Taller boxes indicate groups with greater variability. This dispersion effect is important for process optimization and robust parameter design.' },
    ],
  },

  'histogram': {
    definition:
      'A histogram is a graphical summary of the frequency distribution of a single variable, constructed by dividing the data range into contiguous intervals called bins and drawing rectangles whose heights represent the count or proportion of observations falling in each bin. An optional kernel density estimation (KDE) overlay provides a smooth estimate of the underlying probability density function.',
    purpose:
      'Use a histogram as the primary tool for assessing the shape, center, and spread of a univariate dataset. It is the most fundamental graphical technique in exploratory data analysis, answering questions about symmetry, skewness, modality, tail behavior, and the presence of outliers or gaps. Histograms are routinely used in process characterization, incoming inspection, and data screening to form an initial impression of the data before applying more specialized techniques.',
    interpretation:
      'The horizontal axis represents the measurement scale and the vertical axis represents frequency or relative frequency. A bell-shaped histogram centered on the mean suggests approximate normality. A histogram that peaks on one side and trails off on the other indicates skewness: a long right tail means right skew and a long left tail means left skew. Two or more distinct peaks indicate a bimodal or multimodal distribution, often arising from mixed populations or distinct operating conditions. Short-tailed histograms, where observations are tightly concentrated around the center, suggest a distribution with lighter tails than the normal. Long-tailed histograms, where observations extend far from the center, suggest heavier tails. A histogram with a single extreme observation far from the main body of data flags a potential outlier. Variant patterns include normal, short-tailed symmetric, long-tailed symmetric, bimodal, right-skewed, left-skewed, uniform, and distributions with outliers, each carrying distinct diagnostic meaning.',
    assumptions:
      'The appearance of a histogram depends on the choice of bin width and starting point. Too few bins obscure detail, while too many bins produce a noisy display that is hard to interpret. Rules of thumb such as the Sturges, Freedman-Diaconis, or Scott rules provide reasonable defaults, but the analyst should experiment with several bin widths. The histogram does not perform well for very small samples, where a dot plot or stem-and-leaf display may be more informative.',
    nistReference: 'NIST/SEMATECH e-Handbook of Statistical Methods, Section 1.3.3.14',
    questions: ['What kind of population distribution do the data come from?', 'Where are the data located (center)?', 'How spread out are the data?', 'Are the data symmetric or skewed?', 'Are there outliers in the data?'],
    importance: 'The histogram is the foundational graphical technique in exploratory data analysis. It provides the most direct visual answer to the question "what does my data look like?" and is the prerequisite for choosing appropriate statistical methods, since nearly every statistical procedure depends on distributional shape assumptions.',
    definitionExpanded: 'The data range is divided into k contiguous, non-overlapping intervals (bins) of equal width. The height of each bar represents the count (or relative frequency) of observations falling in that bin. The number of bins affects the visual impression: too few bins over-smooth and hide structure, too many bins create noise. The Freedman-Diaconis rule (bin width = 2 \u00D7 IQR \u00D7 N^{\u22121/3}) and Sturges\u2019 rule (k = 1 + log\u2082(N)) provide automatic defaults. An optional kernel density estimate (KDE) overlay provides a smooth probability density curve.',
    caseStudySlugs: ['heat-flow-meter'],
    pythonCode: `import numpy as np
import matplotlib.pyplot as plt

# Generate bimodal data: mixture of two normals
rng = np.random.default_rng(42)
data = np.concatenate([
    rng.normal(loc=50, scale=5, size=300),
    rng.normal(loc=70, scale=8, size=200)
])

# Create histogram with density overlay
fig, ax = plt.subplots(figsize=(10, 5))
ax.hist(data, bins=30, density=True, alpha=0.7,
        color='steelblue', edgecolor='white')
ax.set_xlabel("Value")
ax.set_ylabel("Density")
ax.set_title("Histogram with Bimodal Data")
plt.tight_layout()
plt.show()`,
    examples: [
      { label: 'Symmetric (Normal)', description: 'A bell-shaped histogram centered on the mean with symmetric tails tapering smoothly on both sides. This is the signature of normally distributed data and confirms that standard statistical methods (t-tests, confidence intervals, capability indices) are appropriate.', variantLabel: 'Symmetric' },
      { label: 'Right Skewed', description: 'The histogram peaks on the left side and has a long tail extending to the right. This indicates positively skewed data where a few large values pull the mean above the median. Common in reliability data (time-to-failure), income distributions, and measurements with a natural lower bound.', variantLabel: 'Right Skewed' },
      { label: 'Left Skewed', description: 'The histogram peaks on the right side and has a long tail extending to the left. This indicates negatively skewed data where a few small values pull the mean below the median. Less common than right skew, but occurs in failure-time data with wear-out mechanisms.', variantLabel: 'Left Skewed' },
      { label: 'Bimodal', description: 'Two distinct peaks separated by a valley, indicating that the data come from a mixture of two populations or processes. Investigation should identify the source of the two modes, such as two machines, two operators, or two material batches.', variantLabel: 'Bimodal' },
      { label: 'Uniform', description: 'A flat histogram with roughly equal bar heights across the range, indicating that all values are equally likely. This pattern suggests data from a uniform distribution or a process with no central tendency, and is sometimes seen in rounded or discretized data.', variantLabel: 'Uniform' },
      { label: 'Heavy Tailed', description: 'A histogram with more observations in the extreme tails than expected for a normal distribution. The center may appear somewhat peaked. Heavy tails inflate the standard deviation and make normal-theory confidence intervals unreliable. Robust methods or a heavy-tailed model (e.g., t-distribution) may be needed.', variantLabel: 'Heavy Tailed' },
      { label: 'Peaked (Leptokurtic)', description: 'A histogram with a sharp central peak and thin tails, indicating a distribution more concentrated around the center than the normal. The excess kurtosis is positive. This can occur when measurement precision is very high relative to process variation.', variantLabel: 'Peaked' },
      { label: 'With Outlier', description: 'The main body of the histogram follows a recognizable pattern, but one or more bars appear isolated far from the bulk of the data. These outlying observations may indicate measurement errors, data entry mistakes, or genuine extreme events that require investigation.', variantLabel: 'With Outlier' },
    ],
  },

  'normal-probability-plot': {
    definition:
      'A normal probability plot displays the sorted data values on the vertical axis against the expected normal order statistics (theoretical quantiles) on the horizontal axis. If the data follow a normal distribution, the points fall approximately along a straight reference line, with departures from linearity indicating specific types of non-normality.',
    purpose:
      'Use a normal probability plot as the primary graphical tool for assessing whether a dataset is consistent with a normal distribution. Normality is a foundational assumption for many statistical procedures, including t-tests, ANOVA, regression inference, and capability analysis. The normal probability plot provides a more sensitive and detailed assessment than the histogram because it magnifies departures in the tails, which are the regions most consequential for statistical inference.',
    interpretation:
      'Points that follow the reference line closely indicate that the data are consistent with a normal distribution. An S-shaped curve, where the tails deviate in opposite directions from the line, indicates a distribution with heavier or lighter tails than the normal. Concave or convex curvature indicates skewness: if the curve bows below the line on the left and above on the right, the data are right-skewed. A step pattern or gap in the points suggests rounding, discreteness, or multimodality in the data. Variant patterns include normally distributed data lying close to the line, short-tailed data curving inward at both ends, long-tailed data curving outward at both ends, and right-skewed data showing a concave departure from linearity.',
    assumptions:
      'The normal probability plot is a graphical technique and does not yield a formal p-value for normality. It is most effective for moderate to large sample sizes, as small samples may not produce a clear linear pattern even when drawn from a normal distribution. The plotting positions (theoretical quantiles) are typically computed using the Blom, Hazen, or Filliben formula, and the choice can slightly affect the visual impression for small samples.',
    nistReference: 'NIST/SEMATECH e-Handbook of Statistical Methods, Section 1.3.3.21',
    questions: ['Are the data normally distributed?', 'What is the nature of the departure from normality (skewed, short tails, long tails)?'],
    importance: 'Normality is the most frequently tested distributional assumption in statistics. The normal probability plot is more sensitive than the histogram for detecting departures from normality because it magnifies tail behavior, which is exactly where non-normality has the greatest impact on statistical inference (confidence intervals, hypothesis tests, capability indices).',
    definitionExpanded: 'The ordered data values Y_{(1)} \u2264 Y_{(2)} \u2264 ... \u2264 Y_{(N)} are plotted against the corresponding expected normal order statistics (theoretical quantiles). If the data are normal, the points fall on a straight line whose slope estimates the standard deviation and whose intercept estimates the mean. The theoretical quantiles are computed using a plotting position formula such as Filliben\u2019s.',
    caseStudySlugs: ['heat-flow-meter'],
    formulas: [
      {
        label: 'Normal Order Statistic Medians',
        tex: String.raw`M_i = \Phi^{-1}\!\left(\frac{i - 0.3175}{N + 0.365}\right)`,
        explanation:
          'The theoretical quantiles (normal order statistic medians) are computed using the Filliben approximation, where Phi^{-1} is the inverse standard normal CDF. These serve as the horizontal axis values.',
      },
      {
        label: 'Parameter Estimates from Fitted Line',
        tex: String.raw`\hat{\sigma} = \text{slope}, \quad \hat{\mu} = \text{intercept}`,
        explanation:
          'When the data are normally distributed and the points fall on a straight line, the slope of the fitted line estimates the standard deviation and the intercept estimates the mean.',
      },
    ],
    pythonCode: `import numpy as np
import matplotlib.pyplot as plt
from scipy import stats

# Generate normally distributed sample data
rng = np.random.default_rng(42)
data = rng.normal(loc=50, scale=10, size=100)

# Create normal probability plot
fig, ax = plt.subplots(figsize=(10, 5))
res = stats.probplot(data, dist='norm', plot=ax)

ax.set_title("Normal Probability Plot")
ax.set_xlabel("Theoretical Quantiles")
ax.set_ylabel("Ordered Values")
ax.get_lines()[0].set_markerfacecolor('steelblue')
ax.get_lines()[0].set_markeredgecolor('steelblue')
plt.tight_layout()
plt.show()`,
    examples: [
      { label: 'Normal Data', description: 'Points follow the reference line closely from end to end with only minor random scatter. This confirms that the data are consistent with a normal distribution, and standard normal-theory methods are appropriate.', variantLabel: 'Normal' },
      { label: 'Right Skewed', description: 'Points curve below the reference line on the left and above it on the right, forming a concave-up shape. This indicates right (positive) skewness — the upper tail is heavier than expected for a normal distribution. A log or square root transformation may normalize the data.', variantLabel: 'Right Skewed' },
      { label: 'Heavy Tailed', description: 'Points curve away from the reference line at BOTH ends: below the line on the left and above the line on the right, forming an S-shape. This indicates a distribution with heavier tails than the normal (leptokurtic). A t-distribution or similar heavy-tailed model may be more appropriate.', variantLabel: 'Heavy Tailed' },
      { label: 'Bimodal', description: 'Points show a step or plateau pattern with a flat region in the middle of the plot. This indicates the data come from a mixture of two populations. The flat region corresponds to the valley between the two modes. The two populations should be separated and analyzed individually.', variantLabel: 'Bimodal' },
    ],
  },

  'probability-plot': {
    definition:
      'A probability plot is a graphical technique for assessing whether a dataset follows a specified theoretical distribution by plotting the ordered data values against the quantiles of the theoretical distribution. It generalizes the normal probability plot to any distributional family, including Weibull, lognormal, exponential, and others.',
    purpose:
      'Use a probability plot when evaluating whether data are consistent with a hypothesized distribution, a question that arises in reliability analysis, process capability studies, and statistical modeling. The probability plot is one of the most versatile graphical tools in statistics because it can assess fit to any continuous distribution, not just the normal. It also provides visual estimates of distribution parameters: the intercept and slope of the fitted line correspond to the location and scale parameters of the distribution.',
    interpretation:
      'If the data follow the hypothesized distribution, the points will fall approximately along a straight line. Systematic departures from the line indicate that the hypothesized distribution does not fit the data well. The nature of the departure provides diagnostic information: S-shaped departures suggest a different tail weight, concave or convex patterns suggest skewness mismatch, and clusters or gaps in the points suggest discreteness or contamination. For location-scale families, the fitted line directly provides parameter estimates, with the intercept estimating the location parameter and the slope estimating the scale parameter.',
    assumptions:
      'The probability plot requires that the analyst specify the family of distributions to evaluate. If the family is incorrect, the plot will show systematic departures regardless of parameter choices. Multiple probability plots for different families can be compared to find the best fit. The visual assessment should be supplemented with a quantitative goodness-of-fit test such as the Anderson-Darling test when a formal decision is needed.',
    nistReference: 'NIST/SEMATECH e-Handbook of Statistical Methods, Section 1.3.3.22',
    questions: ['Does a given distribution provide a good fit to the data?', 'What distribution best fits the data?', 'What are good estimates of the location and scale parameters?'],
    importance: 'Choosing the correct distributional model is essential for reliability prediction, process capability analysis, and simulation. The probability plot provides a visual goodness-of-fit assessment for any hypothesized distribution, making it the most versatile single tool for distribution identification. The slope and intercept of the fitted line directly estimate the distribution parameters.',
    definitionExpanded: 'The ordered data are plotted against the quantiles of the hypothesized distribution, with the axis scales chosen so that data from that distribution appear as a straight line. For location-scale families, the intercept estimates the location parameter and the slope estimates the scale parameter. Different distributions require different probability scales: normal scale for the normal, Weibull scale for the Weibull, exponential scale for the exponential, etc. Comparing probability plots for several candidate distributions identifies the best fit.',
    caseStudySlugs: ['uniform-random-numbers'],
    formulas: [
      {
        label: 'Plotting Positions',
        tex: String.raw`m_i = \frac{i - a}{N + 1 - 2a}`,
        explanation:
          'The plotting positions map each ordered observation to a cumulative probability. The constant a depends on the distribution: a = 0.3175 for normal (Filliben), a = 0 for uniform, and other values for other distributions.',
      },
      {
        label: 'Probability Plot Correlation Coefficient',
        tex: String.raw`\text{PPCC} = \text{corr}\!\left(Y_{(i)},\; Q(m_i)\right)`,
        explanation:
          'The correlation between the ordered data values and the theoretical quantiles Q(m_i) of the hypothesized distribution. A PPCC close to 1.0 indicates a good fit.',
      },
    ],
    pythonCode: `import numpy as np
import matplotlib.pyplot as plt
from scipy import stats

# Generate exponentially distributed sample data
rng = np.random.default_rng(42)
data = rng.exponential(scale=5.0, size=100)

# Create probability plot against exponential distribution
fig, ax = plt.subplots(figsize=(10, 5))
res = stats.probplot(data, dist='expon', plot=ax)

ax.set_title("Probability Plot (Exponential Distribution)")
ax.set_xlabel("Theoretical Quantiles")
ax.set_ylabel("Ordered Values")
ax.get_lines()[0].set_markerfacecolor('steelblue')
ax.get_lines()[0].set_markeredgecolor('steelblue')
plt.tight_layout()
plt.show()`,
    examples: [
      { label: 'Good Fit', description: 'Points follow the fitted line closely across the entire range, with only minor random scatter. The probability plot correlation coefficient is close to 1.0. The hypothesized distribution provides a good model for the data.' },
      { label: 'S-Shaped Departure', description: 'Points form an S-curve around the reference line, with systematic departures at both tails. This indicates the data have a different tail weight than the hypothesized distribution. Try a distribution with heavier or lighter tails.' },
      { label: 'Concave Departure', description: 'Points show a consistent concave curvature, bowing away from the reference line. This indicates a skewness mismatch — the data are more skewed than the hypothesized distribution. Try a more skewed distributional family.' },
    ],
  },

  'qq-plot': {
    definition:
      'A quantile-quantile (Q-Q) plot compares two probability distributions by plotting their quantiles against each other. Most commonly, it compares the sample quantiles of a dataset against the theoretical quantiles of a reference distribution, but it can also compare two empirical samples directly.',
    purpose:
      'Use a Q-Q plot to determine whether two datasets come from populations with a common distribution, or whether a single dataset is consistent with a theoretical distribution. The Q-Q plot is closely related to the probability plot but emphasizes the comparison aspect: it answers questions like whether two batches have the same distribution, whether the residuals from a regression follow a normal distribution, or whether a pre- and post-treatment dataset share the same shape. It is widely used in model validation, goodness-of-fit assessment, and two-sample comparison.',
    interpretation:
      'If the two distributions being compared are identical, the Q-Q plot points will fall on the 45-degree identity line. A linear pattern with a slope different from 1 indicates that the distributions have the same shape but different scales. A linear pattern shifted from the identity line indicates a location difference. Curvature in the Q-Q plot indicates a difference in distributional shape, such as one distribution being more skewed or heavy-tailed than the other. Departures at the extremes of the plot highlight differences in the tails, which may not be apparent from histograms alone. The Q-Q plot is particularly effective at detecting subtle tail differences that formal tests might miss.',
    assumptions:
      'The Q-Q plot assumes both datasets are drawn from continuous distributions. When comparing two samples, the sample sizes need not be equal; linear interpolation is used to match quantiles. The visual assessment is inherently subjective and should be accompanied by quantitative tests when formal decisions are required. For very small samples, the plot may show scatter around the reference line even when the distributions match.',
    nistReference: 'NIST/SEMATECH e-Handbook of Statistical Methods, Section 1.3.3.24',
    questions: ['Do two data sets come from populations with a common distribution?', 'Do two data sets have common location and scale?', 'Do two data sets have similar distributional shapes?', 'Do two data sets have similar tail behavior?'],
    importance: 'The Q-Q plot is the most powerful graphical tool for comparing two distributions because it is sensitive to differences in location, scale, and shape simultaneously. It is particularly effective at detecting subtle tail differences that histograms and summary statistics miss, making it essential for two-sample comparison and model validation.',
    definitionExpanded: 'For two-sample comparison, the quantiles of dataset 1 are plotted against the quantiles of dataset 2. If sample sizes differ, the quantiles of the smaller sample are plotted against linearly interpolated quantiles of the larger sample. If the distributions are identical, points fall on the y = x identity line. A linear pattern with slope \u2260 1 indicates a scale difference; a linear pattern shifted from y = x indicates a location difference. Curvature indicates a shape difference.',
    caseStudySlugs: ['ceramic-strength'],
    formulas: [
      {
        label: 'Quantile Matching',
        tex: String.raw`\text{Plot } Q_1(p_i) \text{ vs } Q_2(p_i) \text{ for percentiles } p_i`,
        explanation:
          'For two-sample comparison, the quantiles of both datasets at matching cumulative probabilities are plotted against each other. If the distributions are identical, points fall on the y = x identity line.',
      },
      {
        label: 'Plotting Positions',
        tex: String.raw`p_i = \frac{i - 0.5}{N}`,
        explanation:
          'The Hazen plotting position assigns cumulative probabilities to the ordered observations. This symmetric formula avoids probabilities of exactly 0 or 1.',
      },
    ],
    pythonCode: `import numpy as np
import matplotlib.pyplot as plt

# Generate two samples from different distributions
rng = np.random.default_rng(42)
sample1 = rng.normal(loc=50, scale=10, size=200)
sample2 = rng.normal(loc=55, scale=15, size=150)

# Compute quantiles at matching percentiles
n_quantiles = min(len(sample1), len(sample2))
probs = np.linspace(0, 1, n_quantiles + 2)[1:-1]
q1 = np.quantile(sample1, probs)
q2 = np.quantile(sample2, probs)

# Create Q-Q plot
fig, ax = plt.subplots(figsize=(8, 8))
ax.scatter(q1, q2, alpha=0.5, color='steelblue', s=15)
lims = [min(q1.min(), q2.min()), max(q1.max(), q2.max())]
ax.plot(lims, lims, 'r--', linewidth=1, label='y = x')
ax.set_xlabel("Sample 1 Quantiles")
ax.set_ylabel("Sample 2 Quantiles")
ax.set_title("Two-Sample Q-Q Plot")
ax.legend()
ax.set_aspect('equal')
plt.tight_layout()
plt.show()`,
  },
} as const;
