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
  },
} as const;
