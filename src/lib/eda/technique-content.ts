/**
 * Prose content for all 29 graphical technique pages.
 *
 * Each entry provides structured educational text derived from
 * NIST/SEMATECH Engineering Statistics Handbook Section 1.3.3.
 * Content is keyed by technique slug and consumed by [slug].astro.
 */

export interface TechniqueContent {
  /** 1-2 sentences: what this technique is */
  definition: string;
  /** 2-3 sentences: when and why to use it */
  purpose: string;
  /** 3-5 sentences: how to read the plot */
  interpretation: string;
  /** 1-3 sentences: key assumptions and limitations */
  assumptions: string;
  /** NIST/SEMATECH section reference string */
  nistReference: string;
}

const TECHNIQUE_CONTENT: Record<string, TechniqueContent> = {
  'autocorrelation-plot': {
    definition:
      'An autocorrelation plot displays the sample autocorrelation function of a dataset as a function of the lag. Each vertical bar in the plot represents the correlation between pairs of observations separated by that lag interval, providing a compact view of serial dependence across all relevant time offsets.',
    purpose:
      'Use an autocorrelation plot when analyzing time-ordered data to determine whether successive observations are statistically independent. It is essential for validating the randomness assumption underlying many statistical procedures, including control charts, capability studies, and regression models. The plot is particularly valuable after fitting a model, where it helps verify that residuals behave as white noise rather than retaining unexplained temporal structure.',
    interpretation:
      'The horizontal axis shows the lag value and the vertical axis shows the autocorrelation coefficient, which ranges from -1 to +1. A pair of horizontal reference lines, typically drawn at plus and minus 1.96 divided by the square root of the sample size, marks the 95 percent significance bounds. For truly random data, approximately 95 percent of the autocorrelation values should fall within these bounds. A pattern where the autocorrelation decays slowly from a large positive value at lag 1 indicates a trend or drift in the process. A single dominant spike at lag 1 that cuts off sharply suggests a first-order autoregressive process, while a sinusoidal pattern in the autocorrelation function indicates periodic behavior in the data. Variant patterns include random data showing no significant spikes, moderate autocorrelation with a gradual exponential decay, strong autocorrelation from an autoregressive model with slow decay, and sinusoidal models producing oscillating autocorrelation values.',
    assumptions:
      'The autocorrelation plot assumes the data are uniformly spaced in time or sequence order. It requires a reasonably large sample size, typically at least 50 observations, to produce reliable estimates at moderate lags. The significance bounds assume normality and independence under the null hypothesis, so they serve as approximate guides rather than exact critical values.',
    nistReference: 'NIST/SEMATECH e-Handbook of Statistical Methods, Section 1.3.3.1',
  },

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

  'block-plot': {
    definition:
      'A block plot displays the response values from a designed experiment organized by blocks, with group means connected to highlight blocking and treatment effects. Each block is shown as a separate cluster of points, making it easy to see whether systematic differences exist between blocks or between treatments within blocks.',
    purpose:
      'Use a block plot when running a randomized complete block design or similar blocked experiment to visualize whether blocking was effective and whether treatment effects are present. It answers the practical question of whether the variability between blocks is large enough to justify the blocking strategy and whether treatment differences are visible after removing block-to-block variation. The block plot is a standard diagnostic in design of experiments analysis and complements formal ANOVA results with visual insight.',
    interpretation:
      'The horizontal axis typically represents blocks or treatment levels, and the vertical axis represents the response. Within each block, individual observations are plotted, and the block means are connected by lines. If the connecting lines are roughly parallel, the treatment effect is consistent across blocks and no interaction exists. If the lines cross, there may be a block-by-treatment interaction that warrants further investigation. Large vertical separation between block means confirms that blocking captured meaningful variability, while minimal separation suggests blocking may not have been necessary.',
    assumptions:
      'The block plot assumes a balanced or near-balanced design where each treatment appears in every block. It is most effective when the number of blocks and treatments is moderate, as very large designs produce cluttered displays. The plot provides visual guidance rather than formal significance tests and should be used alongside ANOVA to quantify the observed effects.',
    nistReference: 'NIST/SEMATECH e-Handbook of Statistical Methods, Section 1.3.3.3',
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
      'A Box-Cox linearity plot helps identify the optimal power transformation of the response variable that achieves the best linear relationship between two variables. It evaluates a range of power transformation exponents and displays a goodness-of-fit measure, such as the correlation coefficient, as a function of the transformation parameter lambda.',
    purpose:
      'Use a Box-Cox linearity plot when a scatter plot suggests a curvilinear relationship between a predictor and a response and a linear model is desired. The technique finds the value of lambda that maximizes the correlation between the transformed response and the predictor, effectively straightening the relationship. This is particularly useful in regression analysis when the analyst wants to apply a simple linear model but the raw data violate the linearity assumption.',
    interpretation:
      'The horizontal axis shows the range of lambda values tested, typically from -2 to +2, and the vertical axis shows the corresponding correlation coefficient between the transformed response and the predictor. The peak of the curve identifies the optimal lambda value. Common interpretable values include lambda equal to 1 (no transformation needed), 0.5 (square root), 0 (log transform by convention), and -1 (reciprocal). If the curve is relatively flat near the peak, multiple transformations give similar results and the analyst may choose the most interpretable one. A sharply peaked curve indicates that the linearity of the relationship is highly sensitive to the choice of transformation.',
    assumptions:
      'The Box-Cox linearity plot requires that the response values be strictly positive for most values of lambda, since raising negative numbers to fractional powers is undefined. It assumes a monotonic relationship between the predictor and response; if the relationship is not monotonic, no power transformation will produce linearity. The method targets linearity only and does not address heteroscedasticity or non-normality of residuals.',
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

  'complex-demodulation': {
    definition:
      'Complex demodulation is a time-series analysis technique that extracts the time-varying amplitude and phase of a sinusoidal component at a specified frequency. It produces two companion plots: an amplitude plot showing how the strength of the cyclic component changes over time, and a phase plot showing how the timing or alignment of the cycle shifts.',
    purpose:
      'Use complex demodulation when a time series contains a known or suspected periodic component and the analyst needs to determine whether that component is stationary or whether its amplitude or phase drifts over time. This is particularly important in manufacturing process monitoring, vibration analysis, and environmental science where cyclic effects may strengthen, weaken, or shift in timing. Unlike spectral analysis, which gives a single global frequency decomposition, complex demodulation tracks the evolution of a specific frequency component across the observation period.',
    interpretation:
      'In the amplitude plot, the vertical axis shows the estimated amplitude of the sinusoidal component as a function of time. A flat amplitude trace indicates a stationary cyclic component, while trends or abrupt changes indicate non-stationarity in the cycle strength. In the phase plot, the vertical axis shows the phase angle in degrees or radians. A constant phase indicates a stable cycle aligned with the demodulation frequency, while a linear drift in phase suggests that the true frequency differs slightly from the specified demodulation frequency. Sudden phase jumps may indicate structural changes in the underlying process.',
    assumptions:
      'Complex demodulation requires specifying the target frequency in advance, which typically comes from prior domain knowledge or a preliminary spectral analysis. It assumes the signal can be approximated by a sinusoidal model at the chosen frequency, and it uses a low-pass filter whose bandwidth must be selected to balance smoothing and time resolution. The technique is most effective when the cyclic component is well-separated in frequency from other signals and noise.',
    nistReference: 'NIST/SEMATECH e-Handbook of Statistical Methods, Sections 1.3.3.8-9',
  },

  'conditioning-plot': {
    definition:
      'A conditioning plot, also called a coplot, displays the relationship between two variables conditioned on the values of one or more additional variables. The conditioning variable is divided into overlapping intervals, and a separate scatter plot of the two primary variables is drawn for each interval, arranged in a trellis-style grid.',
    purpose:
      'Use a conditioning plot when exploring how a bivariate relationship changes across levels of a third variable, a question that is central to detecting interactions and confounding in multivariate data. It is especially useful in regression diagnostics, response surface analysis, and process characterization where the effect of one predictor on the response may depend on the setting of another predictor. The conditioning plot goes beyond a simple scatter plot matrix by explicitly showing how the two-variable relationship evolves as a function of the conditioning variable.',
    interpretation:
      'Each panel in the conditioning plot shows a scatter plot of the two primary variables for a subset of data falling within a particular range of the conditioning variable. The analyst examines whether the pattern, slope, or strength of the relationship changes across panels. If the scatter plots look similar across all panels, the relationship is stable and there is no interaction with the conditioning variable. If the slope, spread, or shape changes, the conditioning variable is influencing the bivariate relationship. The panels are ordered by the conditioning variable, so systematic changes across the grid are informative.',
    assumptions:
      'The conditioning plot requires that the conditioning variable be continuous or ordinal with enough distinct values to form meaningful intervals. The overlapping interval approach introduces some smoothing but can be sensitive to the number of conditioning intervals chosen. With high-dimensional data, conditioning on multiple variables simultaneously can produce many panels, making the display difficult to interpret.',
    nistReference: 'NIST/SEMATECH e-Handbook of Statistical Methods, Section 1.3.3.26.12',
  },

  'contour-plot': {
    definition:
      'A contour plot represents a three-dimensional response surface on a two-dimensional plane by drawing lines of constant response value, called contour lines or isolines. Each contour line connects all combinations of two predictor variables that produce the same predicted response, creating a topographic map of the response surface.',
    purpose:
      'Use a contour plot when exploring the relationship between a response variable and two predictor variables, particularly in the context of response surface methodology and designed experiments. Contour plots are the primary tool for identifying optimal operating conditions, finding regions of high or low response, and understanding the curvature and interaction structure of a fitted response surface. They are widely used in process optimization, formulation studies, and engineering design problems.',
    interpretation:
      'The horizontal and vertical axes represent the two predictor variables, and the contour lines represent constant levels of the response. Closely spaced contour lines indicate a steep response surface where small changes in the predictors lead to large changes in the response. Widely spaced lines indicate a flat region where the response is insensitive to changes. Elliptical contours suggest a well-defined optimum, while saddle-shaped contours indicate a minimax point. The direction of steepest ascent is perpendicular to the contour lines. Color fills between contours, when used, provide an additional visual cue for the response magnitude.',
    assumptions:
      'Contour plots require a mathematical model or dense grid of data points to interpolate the response surface between observed data. The smoothness and accuracy of the contour lines depend on the quality of the underlying model fit. Extrapolation beyond the range of the experimental data should be avoided, as the contour shape may change dramatically outside the observed region.',
    nistReference: 'NIST/SEMATECH e-Handbook of Statistical Methods, Section 1.3.3.10',
  },

  'doe-plots': {
    definition:
      'DOE plots are a set of three diagnostic scatter plots used in designed experiments: the DOE scatter plot, the DOE mean plot, and the DOE standard deviation plot. Together, they show the raw data, group means, and group standard deviations for each factor level, providing a comprehensive graphical summary of factor effects on both location and spread.',
    purpose:
      'Use DOE plots when analyzing results from a factorial or screening experiment to quickly identify which factors have significant effects on the response. The DOE scatter plot reveals the raw data distribution by factor level, the mean plot highlights location shifts, and the standard deviation plot highlights dispersion effects. These plots are especially useful as a first step before formal ANOVA, as they provide immediate visual evidence of which factors matter and whether assumptions of equal variance hold.',
    interpretation:
      'In the DOE scatter plot, the horizontal axis represents factor levels and the vertical axis represents the response; the spread of points at each level shows within-group variability. In the mean plot, each factor level is represented by its sample mean, with a horizontal reference line at the grand mean; large deviations from the grand mean indicate significant effects. In the standard deviation plot, each factor level shows its sample standard deviation; if the standard deviations differ markedly across levels, the factor affects the process variability and not just the average. Factors whose mean plots show large separation and whose standard deviation plots show roughly equal values are strong candidates for location effects.',
    assumptions:
      'DOE plots assume that the experiment was conducted according to the planned design with proper randomization. They are most effective for two-level or low-level factorial designs. The visual assessment should be confirmed with formal ANOVA or effect significance tests, as visual impressions can be misleading when sample sizes are small.',
    nistReference: 'NIST/SEMATECH e-Handbook of Statistical Methods, Sections 1.3.3.11-13',
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

  'lag-plot': {
    definition:
      'A lag plot is a scatter plot of each observation in a dataset against the observation at a fixed lag, typically lag 1. That is, the point at position i is plotted as (Y_i, Y_{i+k}) where k is the chosen lag, creating a visual test for serial dependence in time-ordered data.',
    purpose:
      'Use a lag plot as a simple and powerful diagnostic for detecting non-randomness in time series data. It complements the autocorrelation plot by providing a direct visual impression of how successive observations are related. The lag plot is particularly useful for detecting non-linear dependencies that might not be captured by linear autocorrelation, such as clustered or oscillating patterns. It is one of the four panels in the standard 4-plot diagnostic display.',
    interpretation:
      'For random data, the lag plot appears as a structureless cloud of points with no discernible pattern, indicating that knowing the value at time i provides no information about the value at time i+1. A strong positive linear pattern in the lag plot indicates positive autocorrelation, meaning high values tend to follow high values and low values follow low values. A cluster of points along the diagonal suggests a slowly drifting process. An elliptical or circular pattern suggests oscillatory behavior. A pattern of distinct clusters indicates that the data alternate between distinct states. Variant patterns include random data showing a formless scatter, moderate autocorrelation producing an elongated ellipse along the diagonal, strong autocorrelation displaying a tight linear band, and sinusoidal models creating a structured elliptical loop.',
    assumptions:
      'The lag plot requires that the data be recorded in the order of collection. It is most effective at lag 1 for detecting first-order dependence, though higher lags can be explored for more complex patterns. The visual assessment is qualitative and should be supported by quantitative tests such as the autocorrelation coefficient or the Durbin-Watson statistic.',
    nistReference: 'NIST/SEMATECH e-Handbook of Statistical Methods, Section 1.3.3.15',
  },

  'linear-plots': {
    definition:
      'Linear plots are a set of four companion plots used to assess the quality of a linear fit between two variables: the linear correlation plot, the linear intercept plot, the linear slope plot, and the linear residual standard deviation plot. Together, they show how the correlation, intercept, slope, and residual variability change across subsets of the data.',
    purpose:
      'Use linear plots when evaluating whether a linear regression relationship is stable across the range of the data or across different subgroups. These plots detect local departures from linearity, non-constant variance, and influential subsets that may distort the global regression. They are particularly valuable when the data span a wide range and the analyst suspects that the relationship may differ in different regions of the predictor space.',
    interpretation:
      'In the linear correlation plot, the correlation coefficient is computed for successive subsets and plotted against the subset index. A roughly constant line near the global correlation value indicates stability. The linear intercept and slope plots show the fitted intercept and slope for each subset; stable values confirm a consistent linear relationship, while trends or jumps suggest that the model parameters shift across the data range. The residual standard deviation plot shows the spread of residuals for each subset; increasing or decreasing trends indicate heteroscedasticity, which may require a weighted regression or variance-stabilizing transformation.',
    assumptions:
      'Linear plots require enough data to form meaningful subsets, typically at least 10 observations per subset. The choice of subset size involves a trade-off between stability of the local estimates and sensitivity to local changes. These plots assume the analyst has already established that a linear model is a reasonable starting point, and they serve to diagnose whether that model holds uniformly.',
    nistReference: 'NIST/SEMATECH e-Handbook of Statistical Methods, Sections 1.3.3.16-19',
  },

  'mean-plot': {
    definition:
      'A mean plot displays the group means for each level of a factor variable, with a horizontal reference line drawn at the grand mean of all observations. It provides a direct visual comparison of how the average response changes across factor levels in a designed experiment or observational study.',
    purpose:
      'Use a mean plot to determine whether a factor has a significant effect on the location of the response variable. It is one of the core graphical tools in design of experiments, providing an immediate visual answer to the question of whether factor levels produce different average responses. The mean plot is often used alongside the standard deviation plot to simultaneously assess effects on both location and spread.',
    interpretation:
      'The horizontal axis shows the factor levels and the vertical axis shows the corresponding group means. The grand mean reference line provides a baseline for comparison. Factor levels whose means are well above or below the grand mean line are likely to be statistically significant, while levels clustering near the grand mean suggest no effect. The practical significance depends on the magnitude of the departure relative to the within-group variability. When multiple factors are present, separate mean plots for each factor help identify which factors dominate.',
    assumptions:
      'The mean plot assumes that the sample means are reasonable estimators of the population means, which requires that within-group sample sizes are not too small. It does not account for variability within each group, so it should be interpreted in conjunction with the standard deviation plot or box plots. Equal sample sizes across groups are not required but simplify interpretation.',
    nistReference: 'NIST/SEMATECH e-Handbook of Statistical Methods, Section 1.3.3.20',
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

  'ppcc-plot': {
    definition:
      'A probability plot correlation coefficient (PPCC) plot displays the correlation coefficient from a probability plot as a function of a distribution shape parameter. For each candidate value of the shape parameter, a probability plot is constructed and the correlation between the ordered data and the theoretical quantiles is computed, yielding a curve whose peak identifies the best-fitting distribution.',
    purpose:
      'Use a PPCC plot when the goal is to identify which member of a distribution family best fits the data, or to estimate the optimal value of a shape parameter. The technique is particularly powerful for the Tukey-Lambda family of distributions, where the shape parameter controls tail heaviness and the PPCC plot can distinguish between short-tailed, normal, and long-tailed distributions. It provides a data-driven method for distribution selection that is more systematic than visual inspection of multiple probability plots.',
    interpretation:
      'The horizontal axis shows the shape parameter value and the vertical axis shows the corresponding probability plot correlation coefficient. The peak of the curve identifies the optimal shape parameter, and the height of the peak indicates the overall goodness of fit. A high peak close to 1.0 indicates an excellent fit. For the Tukey-Lambda PPCC plot, the optimal shape parameter near 0.14 corresponds to a normal distribution, values near -1 correspond to a Cauchy-like heavy-tailed distribution, and large positive values correspond to a short-tailed distribution approaching the uniform. The width of the peak also carries information: a broad peak suggests the data are compatible with a range of distributions, while a narrow peak indicates strong evidence for a specific shape.',
    assumptions:
      'The PPCC plot assumes that the data are a random sample from a continuous distribution. It requires a distribution family parameterized by a shape parameter, which limits its applicability to families with such structure. The correlation coefficient as a goodness-of-fit measure is most sensitive to departures in the center of the distribution and somewhat less sensitive to tail behavior compared to formal tests like Anderson-Darling.',
    nistReference: 'NIST/SEMATECH e-Handbook of Statistical Methods, Section 1.3.3.23',
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

  'run-sequence-plot': {
    definition:
      'A run-sequence plot, also called a run chart, displays the measured values in the order they were collected, with the horizontal axis representing the run order or time index and the vertical axis representing the response. It is the simplest and most direct graphical diagnostic for time-ordered data.',
    purpose:
      'Use a run-sequence plot as the first step in analyzing any time-ordered dataset to detect shifts in location, changes in spread, drifts, trends, and oscillations. It addresses the fundamental question of whether the process is stable over time, which is a prerequisite for meaningful statistical analysis. The run-sequence plot is one of the four panels in the standard 4-plot diagnostic and is often the single most informative plot for process data.',
    interpretation:
      'For a stable process, the run-sequence plot shows a horizontal band of points scattered randomly around a constant mean, with no visible patterns, trends, or shifts. An upward or downward trend indicates systematic drift in the process. A sudden jump in the level of the data indicates a shift event, such as a tool change, batch change, or environmental disturbance. Increasing or decreasing spread over time indicates non-constant variability. A recurring oscillatory pattern suggests a periodic influence such as temperature cycling, operator rotation, or seasonal effects. The run-sequence plot is intentionally simple so that any departures from randomness are immediately visible.',
    assumptions:
      'The run-sequence plot requires that the data be recorded in the order of collection. It makes no distributional assumptions and is appropriate for any measurement data. The plot is purely visual and does not provide formal tests; it should be complemented with quantitative methods such as the runs test, CUSUM chart, or control chart when formal change detection is needed.',
    nistReference: 'NIST/SEMATECH e-Handbook of Statistical Methods, Section 1.3.3.25',
  },

  'scatter-plot': {
    definition:
      'A scatter plot displays the relationship between two quantitative variables by plotting each observation as a point in a two-dimensional coordinate system, with one variable on the horizontal axis and the other on the vertical axis. Optional enhancements include a regression line, confidence bands, and a LOWESS smoother to highlight the underlying trend.',
    purpose:
      'Use a scatter plot as the primary tool for exploring the relationship between two continuous variables, including questions about correlation, linearity, and the presence of clusters or outliers. It is the foundation of bivariate exploratory analysis and is used before fitting regression models to verify that the assumed relationship is reasonable. Scatter plots are ubiquitous in science, engineering, and business analysis wherever two-variable relationships need to be visualized.',
    interpretation:
      'A positive linear trend, with points rising from lower left to upper right, indicates a positive correlation between the variables. A negative linear trend indicates a negative correlation. A cloud of points with no discernible pattern indicates little or no relationship. Curvature in the scatter pattern suggests a non-linear relationship that may require transformation or a polynomial model. Distinct clusters of points suggest subgroups in the data. A single point far from the main body of data is an outlier that may be influential in a fitted model. Variant patterns include no relationship (random scatter), strong positive linear, strong negative linear, exact linear, quadratic, exponential, sinusoidal, homoscedastic, heteroscedastic, outlier-contaminated, and multi-cluster patterns, each suggesting different modeling strategies.',
    assumptions:
      'The scatter plot makes no distributional assumptions and is valid for any pair of continuous variables. However, it shows only the marginal bivariate relationship and cannot account for confounding by additional variables. For datasets with many observations, overplotting can obscure patterns, and techniques such as transparency, jittering, or hexagonal binning may be needed.',
    nistReference: 'NIST/SEMATECH e-Handbook of Statistical Methods, Section 1.3.3.26',
  },

  'scatterplot-matrix': {
    definition:
      'A scatterplot matrix displays all pairwise scatter plots of variables in a multivariate dataset, arranged in a symmetric grid where the row and column positions identify the variable pair. The diagonal cells typically show variable names or univariate summaries such as histograms, and the off-diagonal cells show bivariate scatter plots.',
    purpose:
      'Use a scatterplot matrix when exploring a multivariate dataset to identify which variable pairs exhibit strong correlations, non-linear relationships, clusters, or outliers. It provides a comprehensive overview of the bivariate structure of the data in a single display, guiding decisions about variable selection, transformation, and modeling strategy. The scatterplot matrix is particularly useful in regression analysis, principal component analysis, and multivariate quality control.',
    interpretation:
      'Each off-diagonal cell shows the scatter plot for one pair of variables. Strong linear patterns indicate high correlation, while formless clouds indicate weak relationships. The symmetry of the matrix means that each pair appears twice, reflected across the diagonal, which allows using the lower triangle for scatter plots and the upper triangle for correlation coefficients or other summaries. Consistent patterns across multiple pairs may indicate an underlying latent factor. Outliers that appear in multiple scatter plots simultaneously are multivariate outliers that warrant investigation. Comparing the upper and lower triangles can reveal asymmetric relationships or conditioning effects.',
    assumptions:
      'The scatterplot matrix grows quadratically with the number of variables, so it is most practical for datasets with 3 to 8 variables. Beyond that, the individual panels become too small to interpret effectively. The display only reveals pairwise relationships and cannot capture higher-order interactions or conditional dependencies. Large datasets may require transparency or sampling to manage overplotting in each panel.',
    nistReference: 'NIST/SEMATECH e-Handbook of Statistical Methods, Section 1.3.3.26.11',
  },

  'spectral-plot': {
    definition:
      'A spectral plot, also known as a power spectral density (PSD) plot, displays the contribution of each frequency component to the total variance of a time series. It transforms the time-domain representation into the frequency domain using the Fourier transform, revealing the dominant periodicities and cyclic behavior in the data.',
    purpose:
      'Use a spectral plot when the goal is to identify dominant frequencies, periodicities, or cyclic patterns in time series data. It provides a global frequency decomposition that complements the time-domain information from run-sequence and autocorrelation plots. Spectral analysis is particularly important in vibration monitoring, signal processing, environmental science, and manufacturing process diagnostics where cyclic patterns may be caused by rotating equipment, seasonal effects, or periodic disturbances.',
    interpretation:
      'The horizontal axis represents frequency, often in cycles per unit time, and the vertical axis represents power spectral density, typically on a logarithmic scale when the dynamic range is large. Sharp peaks in the spectral plot indicate dominant periodic components at those frequencies. The frequency of a peak can be converted to a period by taking its reciprocal. A flat spectrum indicates white noise with equal power at all frequencies, consistent with random data. A spectrum that decreases with frequency indicates a red noise process where low-frequency variations dominate. Variant patterns include white noise (flat spectrum), autoregressive processes with broad spectral peaks, and sinusoidal signals producing sharp narrow spikes at the signal frequency and its harmonics.',
    assumptions:
      'Spectral analysis assumes that the time series is stationary, meaning that its statistical properties do not change over time. Non-stationary data should be detrended or differenced before applying spectral methods. The frequency resolution depends on the length of the time series: longer series provide finer frequency resolution. Windowing functions such as Hanning or Hamming are typically applied to reduce spectral leakage from the finite sample length.',
    nistReference: 'NIST/SEMATECH e-Handbook of Statistical Methods, Section 1.3.3.27',
  },

  'star-plot': {
    definition:
      'A star plot, also known as a radar chart or spider chart, displays multivariate data as a series of equi-angular spokes radiating from a central point, with each spoke representing a different variable. The data value for each variable determines the length of the corresponding spoke, and the tips of the spokes are connected to form a polygon whose shape provides a visual fingerprint of the observation.',
    purpose:
      'Use a star plot when comparing the multivariate profiles of individual observations or groups across many variables simultaneously. It is especially useful for comparing products, specimens, systems, or process conditions on multiple quality characteristics at once. The star plot enables rapid visual identification of which observations are similar, which are outliers, and which variables differentiate between groups. It is commonly used in quality control, benchmarking, and competitive analysis.',
    interpretation:
      'Each spoke of the star represents one variable, and the distance from the center indicates the magnitude of that variable, typically scaled to a common range. A large, regular polygon indicates an observation that scores highly on all variables. A small polygon indicates uniformly low values. An irregular or lopsided polygon highlights variables where the observation is unusually high or low. When multiple star plots are displayed side by side, similar polygon shapes indicate similar multivariate profiles, while contrasting shapes indicate differentiation. The area of the polygon provides a rough aggregate measure, but the shape is more informative than the area alone.',
    assumptions:
      'The star plot requires that all variables be measured on comparable scales or that the data be standardized before plotting. The visual impression depends on the ordering of variables around the perimeter, and different orderings can produce different visual patterns for the same data. The technique works best with 5 to 12 variables; fewer than 5 does not justify the radial layout, and more than 12 makes individual spokes difficult to distinguish.',
    nistReference: 'NIST/SEMATECH e-Handbook of Statistical Methods, Section 1.3.3.29',
  },

  'std-deviation-plot': {
    definition:
      'A standard deviation plot displays the sample standard deviations for each level of a factor variable, with a horizontal reference line drawn at the pooled or overall standard deviation. It is the spread counterpart to the mean plot, focusing on whether a factor affects process variability rather than process average.',
    purpose:
      'Use a standard deviation plot in designed experiments to determine whether a factor influences the variability of the response. Dispersion effects, where a factor setting changes the spread of the output, are as important as location effects in process optimization and quality improvement. The standard deviation plot helps identify factors that can be used to reduce variability, which is a primary objective of robust parameter design and Taguchi methods.',
    interpretation:
      'The horizontal axis shows the factor levels and the vertical axis shows the sample standard deviations. The overall reference line serves as a benchmark for comparison. Factor levels with standard deviations well above the reference line indicate conditions that increase variability, while levels below the line indicate conditions that reduce variability. When comparing the standard deviation plot to the corresponding mean plot, a factor may affect both location and spread, only location, or only spread. Factors that affect spread are particularly valuable because setting them to the low-variability level can improve process consistency.',
    assumptions:
      'The standard deviation plot requires multiple observations per factor level to compute meaningful within-group standard deviations. The sample standard deviation is a less robust measure of spread than the interquartile range, so it can be sensitive to outliers within a group. For very small within-group sample sizes, the standard deviation estimates have high uncertainty and visual differences between factor levels may not be statistically significant.',
    nistReference: 'NIST/SEMATECH e-Handbook of Statistical Methods, Section 1.3.3.28',
  },

  'weibull-plot': {
    definition:
      'A Weibull plot is a probability plot specifically designed to assess whether data follow a Weibull distribution and to estimate the Weibull shape and scale parameters. The axes are scaled so that data from a Weibull distribution appear as a straight line, with the slope providing the shape parameter and the intercept providing the scale parameter.',
    purpose:
      'Use a Weibull plot primarily in reliability engineering and failure analysis, where the Weibull distribution is the standard model for time-to-failure data. The Weibull distribution is flexible enough to model decreasing failure rates (shape parameter less than 1, indicating infant mortality), constant failure rates (shape equal to 1, equivalent to the exponential distribution), and increasing failure rates (shape greater than 1, indicating wear-out). The Weibull plot provides simultaneous assessment of distributional fit and parameter estimation in a single graphical display.',
    interpretation:
      'The horizontal axis shows the logarithm of the data values and the vertical axis shows the Weibull probability scale, which is derived from the double logarithm of the inverse survival function. Points falling along a straight line indicate that the Weibull distribution is a good fit. The slope of the fitted line estimates the shape parameter beta: a slope less than 1 indicates a decreasing hazard rate, a slope of 1 indicates a constant hazard rate, and a slope greater than 1 indicates an increasing hazard rate. The scale parameter eta is read from the point where the fitted line crosses the 63.2nd percentile. Departures from linearity indicate that the Weibull model is not appropriate and an alternative distribution should be considered.',
    assumptions:
      'The Weibull plot assumes that all failure times are observed and come from a single failure mode. Censored data, where some units have not yet failed, require modified plotting positions. Mixed failure modes, where different components fail by different mechanisms, produce a curved or kinked Weibull plot and should be analyzed separately by failure mode. The visual parameter estimates from the plot are useful starting values but are less efficient than maximum likelihood estimates for formal inference.',
    nistReference: 'NIST/SEMATECH e-Handbook of Statistical Methods, Section 1.3.3.30',
  },

  'youden-plot': {
    definition:
      'A Youden plot is a scatter plot used in interlaboratory studies that plots the result from one run or condition against the result from a second run or condition for each laboratory, with reference lines drawn at the medians of both runs. The resulting display separates within-laboratory variability from between-laboratory variability.',
    purpose:
      'Use a Youden plot when analyzing data from interlaboratory comparisons, proficiency testing, or paired-sample studies where each laboratory or instrument produces two measurements under different conditions. The plot reveals whether laboratories that score high on one measurement also score high on the other, which would indicate a systematic between-laboratory bias. It is a standard tool in metrology and quality assurance for identifying laboratories whose measurement systems are consistently biased.',
    interpretation:
      'The horizontal axis shows the result from one run and the vertical axis shows the result from the other run. The median reference lines divide the plot into four quadrants. Laboratories in the upper-right quadrant measure consistently high on both runs, while those in the lower-left quadrant measure consistently low. This diagonal pattern indicates between-laboratory systematic bias. Laboratories scattered uniformly across all four quadrants show primarily within-laboratory random variability and no systematic bias. A tight cluster of points along the diagonal indicates that between-laboratory variability dominates, while a diffuse cloud with no diagonal trend indicates that within-laboratory variability dominates.',
    assumptions:
      'The Youden plot requires paired measurements from each laboratory, typically two runs or two samples. It assumes that the two conditions are measured on the same scale. The plot is most informative when the number of laboratories is moderate to large, typically 10 or more. The median reference lines are used instead of means because they are robust to outlying laboratories.',
    nistReference: 'NIST/SEMATECH e-Handbook of Statistical Methods, Section 1.3.3.31',
  },

  '4-plot': {
    definition:
      'The 4-plot is a composite diagnostic display that combines four graphical panels into a single figure: a run-sequence plot, a lag plot, a histogram, and a normal probability plot. Each panel tests one of the four underlying assumptions of a univariate measurement process: fixed location, fixed variation, randomness, and distributional form.',
    purpose:
      'Use the 4-plot as a comprehensive screening tool to simultaneously check all four assumptions that underlie most univariate statistical analyses. Rather than examining each assumption separately, the 4-plot provides a single-page summary that reveals whether the data are suitable for standard statistical methods. It is the recommended starting point in the NIST/SEMATECH handbook for univariate process characterization and is particularly valuable during initial data exploration before committing to specific modeling or testing approaches.',
    interpretation:
      'The run-sequence plot (upper left) checks for fixed location and fixed variation over time: a horizontal band of points with constant spread indicates stability. The lag plot (upper right) checks for randomness: a structureless cloud indicates independence, while any pattern indicates serial correlation. The histogram (lower left) provides a visual summary of the distributional shape, center, and spread, and flags potential outliers or multimodality. The normal probability plot (lower right) specifically assesses normality: points along the reference line indicate a normal distribution. When all four panels show ideal patterns, the analyst can proceed with standard methods. When any panel shows departures, the nature of the departure guides the choice of alternative methods.',
    assumptions:
      'The 4-plot requires time-ordered data for the run-sequence and lag plot panels to be meaningful. If the data do not have a natural time ordering, only the histogram and probability plot panels are interpretable. The 4-plot is a screening tool, not a definitive test, and unusual patterns should be investigated with more specialized techniques.',
    nistReference: 'NIST/SEMATECH e-Handbook of Statistical Methods, Section 1.3.3.32',
  },

  '6-plot': {
    definition:
      'The 6-plot extends the 4-plot by adding two additional panels: an autocorrelation plot and a spectral plot. This six-panel composite provides a comprehensive diagnostic display that covers all four underlying assumptions of a univariate measurement process plus detailed time-series diagnostics for serial dependence and frequency structure.',
    purpose:
      'Use the 6-plot when the data are time-ordered and the analyst wants a thorough single-page diagnostic that goes beyond the 4-plot. The added autocorrelation and spectral panels provide quantitative and frequency-domain information about temporal dependencies that the lag plot alone cannot fully characterize. The 6-plot is especially useful for process monitoring data, sensor readings, and any application where cyclic behavior or complex temporal patterns may be present.',
    interpretation:
      'The four upper and lower-left panels are interpreted identically to the 4-plot: run-sequence for stability, lag plot for randomness, histogram for shape, and normal probability plot for normality. The autocorrelation plot (middle right or lower middle) provides a quantitative measure of serial dependence at multiple lags, with significance bounds to identify statistically meaningful correlations. The spectral plot (lower right or lower right) reveals the frequency decomposition of the data, highlighting any dominant periodicities. Together, the six panels provide a complete picture: the run-sequence and lag plots give qualitative time-domain impressions, the autocorrelation plot quantifies the temporal structure, the spectral plot identifies specific frequencies, and the histogram and normal probability plot characterize the marginal distribution.',
    assumptions:
      'Like the 4-plot, the 6-plot requires time-ordered data for all panels to be fully meaningful. The autocorrelation and spectral panels assume stationarity, so non-stationary data should be detrended before analysis. The 6-plot is a comprehensive screening tool that trades panel size for breadth of coverage, so individual panels are smaller than in standalone displays.',
    nistReference: 'NIST/SEMATECH e-Handbook of Statistical Methods, Section 1.3.3.33',
  },
} as const;

/**
 * Retrieve the prose content for a graphical technique by slug.
 *
 * @param slug - Technique slug matching an entry in techniques.json
 * @returns Structured prose content or undefined if slug is not found
 */
export function getTechniqueContent(slug: string): TechniqueContent | undefined {
  return TECHNIQUE_CONTENT[slug];
}
