# EDA URL Cross-Reference Cheat Sheet

## Purpose

This document prevents broken links in case study MDX files by providing a complete mapping of all EDA slugs and their full URL paths. Content authors for phases 57-62 should copy-paste URLs from this cheat sheet rather than constructing them manually.

**Source of truth:** All slugs are enumerated from actual data files (`techniques.json`, `distributions.json`, and page directories).

---

## Section 1: Route Patterns

| Route Pattern | Example | Source |
|---|---|---|
| `/eda/techniques/{slug}/` | `/eda/techniques/histogram/` | `src/data/eda/techniques.json` (graphical) |
| `/eda/quantitative/{slug}/` | `/eda/quantitative/anderson-darling/` | `src/data/eda/techniques.json` (quantitative) |
| `/eda/distributions/{slug}/` | `/eda/distributions/normal/` | `src/data/eda/distributions.json` |
| `/eda/case-studies/{slug}/` | `/eda/case-studies/normal-random-numbers/` | `src/data/eda/pages/case-studies/*.mdx` |
| `/eda/foundations/{slug}/` | `/eda/foundations/what-is-eda/` | `src/data/eda/pages/foundations/*.mdx` |
| `/eda/reference/{slug}/` | `/eda/reference/distribution-tables/` | `src/data/eda/pages/reference/*.mdx` |

---

## Section 2: Graphical Technique Slugs (28)

All from `techniques.json` where `category = "graphical"`.

| # | Slug | Title | Full URL |
|---|---|---|---|
| 1 | `autocorrelation-plot` | Autocorrelation Plot | `/eda/techniques/autocorrelation-plot/` |
| 2 | `bihistogram` | Bihistogram | `/eda/techniques/bihistogram/` |
| 3 | `block-plot` | Block Plot | `/eda/techniques/block-plot/` |
| 4 | `bootstrap-plot` | Bootstrap Plot | `/eda/techniques/bootstrap-plot/` |
| 5 | `box-cox-linearity` | Box-Cox Linearity Plot | `/eda/techniques/box-cox-linearity/` |
| 6 | `box-cox-normality` | Box-Cox Normality Plot | `/eda/techniques/box-cox-normality/` |
| 7 | `box-plot` | Box Plot | `/eda/techniques/box-plot/` |
| 8 | `complex-demodulation` | Complex Demodulation | `/eda/techniques/complex-demodulation/` |
| 9 | `contour-plot` | Contour Plot | `/eda/techniques/contour-plot/` |
| 10 | `doe-plots` | DOE Plots | `/eda/techniques/doe-plots/` |
| 11 | `histogram` | Histogram | `/eda/techniques/histogram/` |
| 12 | `lag-plot` | Lag Plot | `/eda/techniques/lag-plot/` |
| 13 | `linear-plots` | Linear Plots | `/eda/techniques/linear-plots/` |
| 14 | `mean-plot` | Mean Plot | `/eda/techniques/mean-plot/` |
| 15 | `normal-probability-plot` | Normal Probability Plot | `/eda/techniques/normal-probability-plot/` |
| 16 | `probability-plot` | Probability Plot | `/eda/techniques/probability-plot/` |
| 17 | `ppcc-plot` | PPCC Plot | `/eda/techniques/ppcc-plot/` |
| 18 | `qq-plot` | Q-Q Plot | `/eda/techniques/qq-plot/` |
| 19 | `run-sequence-plot` | Run-Sequence Plot | `/eda/techniques/run-sequence-plot/` |
| 20 | `scatter-plot` | Scatter Plot | `/eda/techniques/scatter-plot/` |
| 21 | `spectral-plot` | Spectral Plot | `/eda/techniques/spectral-plot/` |
| 22 | `std-deviation-plot` | Standard Deviation Plot | `/eda/techniques/std-deviation-plot/` |
| 23 | `star-plot` | Star Plot | `/eda/techniques/star-plot/` |
| 24 | `weibull-plot` | Weibull Plot | `/eda/techniques/weibull-plot/` |
| 25 | `youden-plot` | Youden Plot | `/eda/techniques/youden-plot/` |
| 26 | `4-plot` | 4-Plot | `/eda/techniques/4-plot/` |
| 27 | `6-plot` | 6-Plot | `/eda/techniques/6-plot/` |
| 28 | `scatterplot-matrix` | Scatterplot Matrix | `/eda/techniques/scatterplot-matrix/` |

Note: `conditioning-plot` is also in techniques.json as graphical (total 29 entries), listed below:

| 29 | `conditioning-plot` | Conditioning Plot | `/eda/techniques/conditioning-plot/` |

---

## Section 3: Quantitative Technique Slugs (18)

All from `techniques.json` where `category = "quantitative"`.

| # | Slug | Title | Full URL |
|---|---|---|---|
| 1 | `measures-of-location` | Measures of Location | `/eda/quantitative/measures-of-location/` |
| 2 | `confidence-limits` | Confidence Limits for the Mean | `/eda/quantitative/confidence-limits/` |
| 3 | `two-sample-t-test` | Two-Sample t-Test | `/eda/quantitative/two-sample-t-test/` |
| 4 | `one-factor-anova` | One-Factor ANOVA | `/eda/quantitative/one-factor-anova/` |
| 5 | `multi-factor-anova` | Multi-Factor ANOVA | `/eda/quantitative/multi-factor-anova/` |
| 6 | `measures-of-scale` | Measures of Scale | `/eda/quantitative/measures-of-scale/` |
| 7 | `bartletts-test` | Bartlett's Test | `/eda/quantitative/bartletts-test/` |
| 8 | `chi-square-sd-test` | Chi-Square Test for Standard Deviation | `/eda/quantitative/chi-square-sd-test/` |
| 9 | `f-test` | F-Test for Equality of Two Variances | `/eda/quantitative/f-test/` |
| 10 | `levene-test` | Levene Test | `/eda/quantitative/levene-test/` |
| 11 | `skewness-kurtosis` | Measures of Skewness and Kurtosis | `/eda/quantitative/skewness-kurtosis/` |
| 12 | `autocorrelation` | Autocorrelation | `/eda/quantitative/autocorrelation/` |
| 13 | `runs-test` | Runs Test for Randomness | `/eda/quantitative/runs-test/` |
| 14 | `anderson-darling` | Anderson-Darling Test | `/eda/quantitative/anderson-darling/` |
| 15 | `chi-square-gof` | Chi-Square Goodness-of-Fit Test | `/eda/quantitative/chi-square-gof/` |
| 16 | `kolmogorov-smirnov` | Kolmogorov-Smirnov Test | `/eda/quantitative/kolmogorov-smirnov/` |
| 17 | `grubbs-test` | Grubbs' Test for Outliers | `/eda/quantitative/grubbs-test/` |
| 18 | `yates-analysis` | Yates Analysis | `/eda/quantitative/yates-analysis/` |

---

## Section 4: Distribution Slugs (20)

All from `distributions.json`.

| # | Slug | Title | Full URL |
|---|---|---|---|
| 1 | `normal` | Normal Distribution | `/eda/distributions/normal/` |
| 2 | `uniform` | Uniform Distribution | `/eda/distributions/uniform/` |
| 3 | `cauchy` | Cauchy Distribution | `/eda/distributions/cauchy/` |
| 4 | `t-distribution` | Student's t-Distribution | `/eda/distributions/t-distribution/` |
| 5 | `f-distribution` | F-Distribution | `/eda/distributions/f-distribution/` |
| 6 | `chi-square` | Chi-Square Distribution | `/eda/distributions/chi-square/` |
| 7 | `exponential` | Exponential Distribution | `/eda/distributions/exponential/` |
| 8 | `weibull` | Weibull Distribution | `/eda/distributions/weibull/` |
| 9 | `lognormal` | Lognormal Distribution | `/eda/distributions/lognormal/` |
| 10 | `fatigue-life` | Birnbaum-Saunders Distribution | `/eda/distributions/fatigue-life/` |
| 11 | `gamma` | Gamma Distribution | `/eda/distributions/gamma/` |
| 12 | `double-exponential` | Double Exponential Distribution | `/eda/distributions/double-exponential/` |
| 13 | `power-normal` | Power Normal Distribution | `/eda/distributions/power-normal/` |
| 14 | `power-lognormal` | Power Lognormal Distribution | `/eda/distributions/power-lognormal/` |
| 15 | `tukey-lambda` | Tukey-Lambda Distribution | `/eda/distributions/tukey-lambda/` |
| 16 | `extreme-value` | Extreme Value Type I Distribution | `/eda/distributions/extreme-value/` |
| 17 | `beta` | Beta Distribution | `/eda/distributions/beta/` |
| 18 | `binomial` | Binomial Distribution | `/eda/distributions/binomial/` |
| 19 | `poisson` | Poisson Distribution | `/eda/distributions/poisson/` |

---

## Section 5: Case Study Slugs (10)

From `src/data/eda/pages/case-studies/*.mdx` filenames.

| # | Slug | Title | Full URL | Status |
|---|---|---|---|---|
| 1 | `normal-random-numbers` | Normal Random Numbers | `/eda/case-studies/normal-random-numbers/` | Exists |
| 2 | `uniform-random-numbers` | Uniform Random Numbers | `/eda/case-studies/uniform-random-numbers/` | Exists |
| 3 | `cryothermometry` | Cryothermometry | `/eda/case-studies/cryothermometry/` | Exists |
| 4 | `beam-deflections` | Beam Deflections | `/eda/case-studies/beam-deflections/` | Exists |
| 5 | `filter-transmittance` | Filter Transmittance | `/eda/case-studies/filter-transmittance/` | Exists |
| 6 | `heat-flow-meter` | Heat Flow Meter | `/eda/case-studies/heat-flow-meter/` | Exists |
| 7 | `fatigue-life` | Fatigue Life | `/eda/case-studies/fatigue-life/` | Exists |
| 8 | `ceramic-strength` | Ceramic Strength | `/eda/case-studies/ceramic-strength/` | Exists |
| 9 | `random-walk` | Random Walk | `/eda/case-studies/random-walk/` | Exists |
| 10 | `standard-resistor` | Standard Resistor | `/eda/case-studies/standard-resistor/` | (Phase 58) |

---

## Section 6: Foundation Slugs (6)

From `src/data/eda/pages/foundations/*.mdx` filenames.

| # | Slug | Title | Full URL |
|---|---|---|---|
| 1 | `what-is-eda` | What Is EDA? | `/eda/foundations/what-is-eda/` |
| 2 | `assumptions` | EDA Assumptions | `/eda/foundations/assumptions/` |
| 3 | `problem-categories` | Problem Categories | `/eda/foundations/problem-categories/` |
| 4 | `role-of-graphics` | Role of Graphics | `/eda/foundations/role-of-graphics/` |
| 5 | `the-4-plot` | The 4-Plot | `/eda/foundations/the-4-plot/` |
| 6 | `when-assumptions-fail` | When Assumptions Fail | `/eda/foundations/when-assumptions-fail/` |

---

## Section 7: Reference Slugs (4)

From `src/data/eda/pages/reference/*.mdx` filenames.

| # | Slug | Title | Full URL |
|---|---|---|---|
| 1 | `analysis-questions` | Analysis Questions | `/eda/reference/analysis-questions/` |
| 2 | `distribution-tables` | Distribution Tables | `/eda/reference/distribution-tables/` |
| 3 | `related-distributions` | Related Distributions | `/eda/reference/related-distributions/` |
| 4 | `techniques-by-category` | Techniques by Category | `/eda/reference/techniques-by-category/` |

---

## Section 8: Most Common Cross-References

These are the links most frequently used in case study MDX content. Copy-paste the full path.

### Graphical Techniques (used in every case study)

| Link Text | Full URL |
|---|---|
| 4-plot | `/eda/techniques/4-plot/` |
| run-sequence plot | `/eda/techniques/run-sequence-plot/` |
| lag plot | `/eda/techniques/lag-plot/` |
| histogram | `/eda/techniques/histogram/` |
| normal probability plot | `/eda/techniques/normal-probability-plot/` |
| autocorrelation plot | `/eda/techniques/autocorrelation-plot/` |
| spectral plot | `/eda/techniques/spectral-plot/` |
| box plot | `/eda/techniques/box-plot/` |
| scatter plot | `/eda/techniques/scatter-plot/` |
| probability plot | `/eda/techniques/probability-plot/` |
| bihistogram | `/eda/techniques/bihistogram/` |
| block plot | `/eda/techniques/block-plot/` |

### Quantitative Methods (used in every case study)

| Link Text | Full URL |
|---|---|
| measures of location | `/eda/quantitative/measures-of-location/` |
| measures of scale | `/eda/quantitative/measures-of-scale/` |
| Anderson-Darling test | `/eda/quantitative/anderson-darling/` |
| runs test | `/eda/quantitative/runs-test/` |
| autocorrelation | `/eda/quantitative/autocorrelation/` |
| Grubbs' test | `/eda/quantitative/grubbs-test/` |
| Bartlett's test | `/eda/quantitative/bartletts-test/` |
| Levene test | `/eda/quantitative/levene-test/` |
| two-sample t-test | `/eda/quantitative/two-sample-t-test/` |
| one-factor ANOVA | `/eda/quantitative/one-factor-anova/` |
| confidence limits | `/eda/quantitative/confidence-limits/` |

### Distributions (commonly referenced)

| Link Text | Full URL |
|---|---|
| normal distribution | `/eda/distributions/normal/` |
| uniform distribution | `/eda/distributions/uniform/` |
| Weibull distribution | `/eda/distributions/weibull/` |
| gamma distribution | `/eda/distributions/gamma/` |
| chi-square distribution | `/eda/distributions/chi-square/` |
| t-distribution | `/eda/distributions/t-distribution/` |
| F-distribution | `/eda/distributions/f-distribution/` |
| fatigue life distribution | `/eda/distributions/fatigue-life/` |

### Inter-Case-Study Links

| Link Text | Full URL |
|---|---|
| Normal Random Numbers | `/eda/case-studies/normal-random-numbers/` |
| Uniform Random Numbers | `/eda/case-studies/uniform-random-numbers/` |
| Cryothermometry | `/eda/case-studies/cryothermometry/` |
| Beam Deflections | `/eda/case-studies/beam-deflections/` |
| Filter Transmittance | `/eda/case-studies/filter-transmittance/` |
| Heat Flow Meter | `/eda/case-studies/heat-flow-meter/` |
| Fatigue Life | `/eda/case-studies/fatigue-life/` |
| Ceramic Strength | `/eda/case-studies/ceramic-strength/` |
| Random Walk | `/eda/case-studies/random-walk/` |
| Standard Resistor | `/eda/case-studies/standard-resistor/` (Phase 58) |

### Foundation References

| Link Text | Full URL |
|---|---|
| What is EDA? | `/eda/foundations/what-is-eda/` |
| EDA assumptions | `/eda/foundations/assumptions/` |
| the 4-plot | `/eda/foundations/the-4-plot/` |
| when assumptions fail | `/eda/foundations/when-assumptions-fail/` |

---

## MDX Link Syntax Reference

Standard markdown link in MDX:
```mdx
See the [histogram](/eda/techniques/histogram/) technique page for details.
```

Cross-reference to another case study:
```mdx
Compare with the [Normal Random Numbers](/eda/case-studies/normal-random-numbers/) case study.
```

Link to a quantitative method:
```mdx
The [Anderson-Darling test](/eda/quantitative/anderson-darling/) confirms normality.
```

Link to a distribution:
```mdx
The data follow a [normal distribution](/eda/distributions/normal/).
```

---

*Generated from: `src/data/eda/techniques.json` (47 entries: 29 graphical + 18 quantitative), `src/data/eda/distributions.json` (19 entries), case-study/foundations/reference page directories.*
*Last updated: 2026-02-27*
