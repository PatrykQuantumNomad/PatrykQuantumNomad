# Distribution-Shape Techniques Review

Review of 9 distribution-shape technique pages in `src/lib/eda/technique-content/distribution-shape.ts` against the NIST/SEMATECH e-Handbook source files.

---

## 1. Histogram (NIST 1.3.3.14)

**Source:** `handbook/eda/section3/histogra.htm` + `histogr1.htm` through `histogr8.htm`

### Definition
- **PASS.** The site's definition accurately describes the histogram as a frequency distribution using bins with rectangle heights representing counts/proportions. The mention of KDE overlay is an enhancement not in NIST but is not contradictory -- acceptable addition.

### Purpose
- **PASS.** Consistent with NIST: summarize distribution of univariate data, assess shape/center/spread/outliers/modality.

### Questions
- **PASS.** All five questions match the handbook exactly:
  1. What kind of population distribution?
  2. Where are the data located?
  3. How spread out are the data?
  4. Are the data symmetric or skewed?
  5. Are there outliers?
- Minor wording difference: site says "center" in parenthetical for Q2 vs. NIST's plain "Where are the data located?" -- acceptable.

### Interpretation
- **PASS.** Accurately describes bell-shaped (normal), skewness directions, bimodality, short-tailed, long-tailed, and outlier patterns. Consistent with all 8 histogram interpretation sub-pages.

### Formulas
- **PASS.** Freedman-Diaconis rule (h = 2 * IQR * N^{-1/3}) is correct.
- **PASS.** Sturges' rule (k = 1 + log2(N)) is correct.
- **PASS.** Relative frequency density normalization (f_i = n_i / (N * h)) is correct.

### Examples (Variants)
- **PASS.** Normal variant: Correctly describes bell-shaped, symmetric, moderate-tailed. Matches NIST 1.3.3.14.1.
- **PASS.** Short-Tailed variant: Correctly identifies uniform as classical short-tailed, midrange as best estimator. Matches NIST 1.3.3.14.2.
- **PASS.** Long-Tailed variant: Correctly identifies Cauchy as classical long-tailed, median as best estimator. Matches NIST 1.3.3.14.3.
- **PASS.** Bimodal Sinusoidal variant: Correctly describes sinusoidal cause, recommends lag plot/spectral plot. Matches NIST 1.3.3.14.4.
- **PASS.** Bimodal Mixture variant: Correctly describes mixture of two normal distributions, mixture model formula. Matches NIST 1.3.3.14.5.
- **PASS.** Right Skewed variant: Correctly describes right tail, mean above median. Matches NIST 1.3.3.14.6. Site mentions Weibull/lognormal/gamma -- consistent with NIST.
- **PASS.** Left Skewed variant: Correctly describes left tail, mean below median. Matches NIST 1.3.3.14.7.
- **PASS.** With Outlier variant: Correctly advises investigation, recommends box plot. Matches NIST 1.3.3.14.8.

### Case Study
- **PASS.** References heat-flow-meter, matching NIST.

### Verdict: CLEAN -- no errors found.

---

## 2. Box Plot (NIST 1.3.3.7)

**Source:** `handbook/eda/section3/boxplot.htm`

### Definition
- **PASS.** Correctly attributes Chambers 1983. Accurately describes Q1-Q3 box, median line, whiskers to 1.5 IQR. Matches NIST description.

### Purpose
- **PASS.** Consistent with NIST: compare location, spread, symmetry of groups. Mentions single and multiple box plot usage, matching NIST.

### Questions
- **PASS.** All four questions match NIST exactly:
  1. Is a factor significant?
  2. Does the location differ between subgroups?
  3. Does the variation differ between subgroups?
  4. Are there any outliers?

### Importance
- **PASS.** Matches NIST almost verbatim: "important EDA tool for determining if a factor has a significant effect on the response with respect to either location or variation" and "effective tool for summarizing large quantities of information."

### Interpretation
- **PASS.** Correctly describes median position indicating symmetry/skewness, IQR as spread, whiskers, outlier points.

### Assumptions
- **PASS.** Correctly notes no distributional assumptions, mentions width can be proportional to sample size. Mentions limitation for small samples and multi-modality -- reasonable addition.

### Formulas
- **PASS.** IQR = Q3 - Q1 -- correct.
- **PASS.** Inner fences: L1 = Q1 - 1.5*IQR, U1 = Q3 + 1.5*IQR -- matches NIST exactly.
- **PASS.** Outer fences: L2 = Q1 - 3.0*IQR, U2 = Q3 + 3.0*IQR -- matches NIST exactly.
- **PASS.** Description of mild outliers (between inner and outer, small circles) and extreme outliers (beyond outer, large circles) matches NIST.

### Expanded Definition (Box plots with fences)
- **PASS.** Matches the NIST "Box plots with fences" variation accurately.

### Case Study
- **PASS.** References ceramic-strength, matching NIST.

### Verdict: CLEAN -- no errors found.

---

## 3. Bihistogram (NIST 1.3.3.2)

**Source:** `handbook/eda/section3/bihistog.htm`

### Definition
- **PASS.** Correctly describes back-to-back histograms with one plotted upward and one downward on a common horizontal axis. Matches NIST definition of "vertically juxtaposing two histograms."

### Purpose
- **PASS.** Matches NIST: assessing whether a before-versus-after modification caused change in location, variation, or distribution. Site adds "quality engineering" context -- reasonable enhancement.

### Questions
- **PASS.** All six questions match NIST exactly.

### Importance
- **MINOR DISCREPANCY.** NIST states: "Since the bihistogram provides insight into the validity of three (location, variation, and distribution) out of the four (missing only randomness) underlying assumptions in a measurement process, it is an especially valuable tool." The site's importance text focuses on "reveals the full distributional impact of a two-level factor... catching effects that a simple t-test would miss." This is accurate but misses the NIST framing about the 3-out-of-4 measurement process assumptions. Not an error per se, just a different emphasis.

### Interpretation
- **PASS.** Accurately describes shared axis, upper/lower histograms, how to read shifts in location/spread/shape.

### Assumptions
- **PASS.** Correctly notes identical bin widths requirement, sensitivity to bin width, restriction to two levels (matches NIST: "restricted to assessing factors that have only two levels").

### Case Study
- **PASS.** References ceramic-strength, matching NIST.

### Verdict: CLEAN -- no errors found. Minor framing difference in importance section is not an inaccuracy.

---

## 4. Bootstrap Plot (NIST 1.3.3.4)

**Source:** `handbook/eda/section3/bootplot.htm`

### Definition
- **PASS.** Correctly describes: vertical axis = computed statistic, horizontal axis = subsample number, subsamples drawn with replacement. Matches NIST.

### Purpose
- **PASS.** Matches NIST: "estimate the uncertainty of a statistic."

### Questions
- **PASS.** All three questions match NIST exactly.

### Importance
- **PASS.** Matches NIST: "most common uncertainty calculation is generating a confidence interval for the mean... However, there are many situations in which the uncertainty formulas are mathematically intractable."

### Interpretation
- **PASS.** Correctly describes stable estimate = tight band, wide scatter = high variability. Mentions histogram follow-up and percentile confidence intervals.

### Confidence Interval Example
- **PASS.** Site says "from 500 bootstrap samples, the 25th and 475th sorted values give a 90% confidence interval." NIST says the same: "the value of the 25th median (assuming exactly 500 subsamples were taken) is the lower confidence limit while the value of the 475th median... is the upper confidence limit" for a 90% CI. Correct.

### Assumptions/Cautions
- **PASS.** Correctly notes: representative sample, independent observations, 500-1000 replications typical. Matches NIST caution: "The bootstrap is not appropriate for all distributions and statistics... the bootstrap is not appropriate for estimating the distribution of statistics that are heavily dependent on the tails, such as the range."

### Formulas
- **PASS.** Bootstrap resample notation is standard and correct.
- **PASS.** Percentile confidence interval formula is correct.

### Case Study
- **PASS.** References uniform-random-numbers, matching NIST.

### Verdict: CLEAN -- no errors found.

---

## 5. Box-Cox Linearity Plot (NIST 1.3.3.5)

**Source:** `handbook/eda/section3/boxcoxli.htm`

### Definition
- **PASS.** Correctly describes: finds optimal power transformation of X to maximize correlation with Y. Matches NIST.

### Purpose
- **PASS.** Matches NIST: improve linear fit when scatter plot suggests curvilinear relationship.

### Questions
- **PASS.** Both questions match NIST exactly:
  1. Would a suitable transformation improve my fit?
  2. What is the optimal value of the transformation parameter?

### Formulas
- **PASS.** Box-Cox transformation formula T(X) = (X^lambda - 1) / lambda for lambda != 0, ln(X) for lambda = 0. Matches NIST exactly.
- **PASS.** Linearity measure r(lambda) = corr(Y, T_lambda(X)) -- correctly stated.

### Interpretation
- **PASS.** Correctly describes lambda range (-2 to +2), common special cases (1, 0.5, 0, -1), flat vs. sharp peak behavior. Matches NIST.

### Assumptions
- **PASS.** Correctly notes: predictor must be strictly positive, monotonic relationship required, targets linearity only. These are accurate constraints.

### Importance
- **PASS.** Site adds context about Box-Cox transformation also being applicable to Y (for normality/constant variance), referencing the Box-Cox normality plot. This matches NIST: "Transforming X is used to improve the fit. The Box-Cox transformation applied to Y can be used as the basis for meeting the error assumptions."

### Verdict: CLEAN -- no errors found.

---

## 6. Box-Cox Normality Plot (NIST 1.3.3.6)

**Source:** `handbook/eda/section3/boxcoxno.htm`

### Definition
- **PASS.** Correctly describes: finds optimal power transformation to normalize data. Matches NIST.

### Purpose
- **PASS.** Matches NIST: automate search for normalizing transformation when normality is required for t-tests, ANOVA, etc.

### Questions
- **PASS.** Both questions match NIST exactly.

### Formulas
- **PASS.** Box-Cox transformation T(Y) = (Y^lambda - 1) / lambda, ln(Y) for lambda = 0. Matches NIST.
- **PASS.** Mentions PPCC as the normality measure, matching NIST: "compute the correlation coefficient of a normal probability plot."

### Interpretation
- **PASS.** Correctly describes lambda range, PPCC or Shapiro-Wilk on vertical axis, optimal lambda = max normality measure. NIST specifically uses PPCC; site mentions "often the probability plot correlation coefficient (PPCC) or the Shapiro-Wilk statistic." The Shapiro-Wilk mention is an acceptable generalization since both measure normality, though NIST specifically uses PPCC.

### Assumptions
- **PASS.** Correctly notes: data must be strictly positive, outliers influence, cannot make bimodal data normal.

### Expanded Definition
- **PASS.** Mentions confidence interval around peak and "if interval includes lambda=1, no transformation necessary." This is a correct and useful addition.

### Verdict: CLEAN -- no errors found.

---

## 7. Normal Probability Plot (NIST 1.3.3.21)

**Source:** `handbook/eda/section3/normprpl.htm` + `normprp1.htm` through `normprp4.htm`

### Definition
- **PASS.** Correctly describes: sorted data (vertical) vs. expected normal order statistics (horizontal). Matches NIST: "Vertical axis: Ordered response values, Horizontal axis: Normal order statistic medians."

### Purpose
- **PASS.** Matches NIST: assess whether data are approximately normally distributed.

### Questions
- **PASS.** Both questions match NIST exactly.

### Formulas -- Filliben Approximation
- **PASS.** Uniform order statistic medians (Filliben):
  - U_1 = 1 - U_n -- matches NIST
  - U_i = (i - 0.3175)/(N + 0.365) for i = 2,...,N-1 -- matches NIST
  - U_N = 0.5^(1/N) -- matches NIST
- **PASS.** Normal order statistic medians: M_i = Phi^{-1}(U_i) -- matches NIST: N_i = G(U_i).
- **PASS.** Parameter estimates: slope = sigma, intercept = mu. Matches NIST: "the intercept and slope estimates of the fitted line are in fact estimates for the location and scale parameters."

### Interpretation
- **PASS.** Correctly describes:
  - Linear pattern = normal data. Matches NIST 1.3.3.21.1.
  - Short-tailed: first few above, last few below. Matches NIST 1.3.3.21.2 exactly.
  - Long-tailed: first few below, last few above (reversed pattern). Matches NIST 1.3.3.21.3 exactly.
  - Right-skewed: concave/quadratic, all points below reference line. Matches NIST 1.3.3.21.4 exactly: "a quadratic pattern in which all the points are below a reference line drawn between the first and last points."

### Examples (Variants)
- **PASS.** Normal Data: matches NIST 1.3.3.21.1.
- **PASS.** Short Tails: "S-shaped pattern, first few above, last few below" -- matches NIST.
- **PASS.** Long Tails: "first few below, last few above, opposite direction" -- matches NIST.
- **PASS.** Right Skewed: "concave pattern, all points below reference line" -- matches NIST.

### Case Study
- **PASS.** References heat-flow-meter, matching NIST.

### Verdict: CLEAN -- no errors found.

---

## 8. Probability Plot (NIST 1.3.3.22)

**Source:** `handbook/eda/section3/probplot.htm`

### Definition
- **PASS.** Correctly describes: generalizes normal probability plot to any distribution by using that distribution's percent point function. Matches NIST.

### Purpose
- **PASS.** Matches NIST: assess whether data follow a given distribution. Correctly notes intercept/slope estimate location/scale parameters.

### Questions
- **PASS.** All three questions match NIST:
  1. Does a given distribution provide a good fit?
  2. What distribution best fits my data?
  3. What are good estimates for location and scale parameters?

### Formulas -- Order Statistic Medians
- **PASS.** N_i = G(U_i) -- matches NIST exactly.
- **PASS.** Uniform order statistic medians (Filliben):
  - U_1 = 1 - 0.5^(1/n) -- matches NIST
  - U_i = (i - 0.3175)/(n + 0.365) -- matches NIST
  - U_n = 0.5^(1/n) -- matches NIST
- **PASS.** PPCC formula: corr(Y_(i), N_i) -- correct.

### Interpretation
- **PASS.** Linear = good fit, S-shape = tail weight mismatch, concave/convex = skewness mismatch. Consistent with NIST.

### Case Study
- **PASS.** References uniform-random-numbers, matching NIST.

### Verdict: CLEAN -- no errors found.

---

## 9. Q-Q Plot (NIST 1.3.3.24)

**Source:** `handbook/eda/section3/qqplot.htm`

### Definition
- **PASS.** Correctly describes: graphical technique for determining if two data sets come from populations with a common distribution, plots quantiles of one vs. quantiles of other. Matches NIST.

### Purpose
- **PASS.** Matches NIST: detect differences in location, scale, symmetry, tail behavior. Site correctly notes: "provides more insight into the nature of distributional differences than analytical methods such as the chi-square or Kolmogorov-Smirnov 2-sample tests." This matches NIST exactly.
- **PASS.** Correctly notes relationship to probability plot: "It is similar to a probability plot, but in a probability plot one of the data samples is replaced with the quantiles of a theoretical distribution." Matches NIST.
- **PASS.** Sample sizes need not be equal -- matches NIST.

### Questions
- **PASS.** All four questions match NIST exactly.

### Interpretation
- **PASS.** Correctly describes: y=x line = identical distributions, slope != 1 = scale difference, shift from y=x = location difference, curvature = shape difference. Consistent with NIST.

### Assumptions
- **PASS.** Correctly notes continuous distributions assumption, linear interpolation for unequal sample sizes (matches NIST: "the quantiles for the larger data set are interpolated").

### Formulas
- **PASS.** Quantile matching formula is correctly stated.
- **PASS.** Hazen plotting position p_i = (i - 0.5)/N -- this is a standard plotting position formula. Note: NIST does not specify a particular plotting position for the Q-Q plot; it simply says quantiles are estimated and interpolated. The Hazen formula is a valid choice.

### Case Study
- **PASS.** References ceramic-strength, matching NIST.

### Verdict: CLEAN -- no errors found.

---

## Summary

| Technique | Status | Issues Found |
|-----------|--------|-------------|
| Histogram | CLEAN | None |
| Box Plot | CLEAN | None |
| Bihistogram | CLEAN | Minor: importance framing differs from NIST (not an error) |
| Bootstrap Plot | CLEAN | None |
| Box-Cox Linearity | CLEAN | None |
| Box-Cox Normality | CLEAN | None |
| Normal Probability Plot | CLEAN | None |
| Probability Plot | CLEAN | None |
| Q-Q Plot | CLEAN | None |

**Overall verdict: All 9 distribution-shape technique pages are factually accurate against the NIST/SEMATECH handbook source.** No factual errors, formula errors, or misleading information was found. The content faithfully represents the NIST definitions, questions, formulas, interpretation guidance, and examples, with some acceptable enhancements (KDE overlay mention for histogram, Shapiro-Wilk generalization for Box-Cox normality) that do not contradict the source material.
