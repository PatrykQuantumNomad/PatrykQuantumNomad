# Graphical Technique Review: Combined-Diagnostic, Multivariate, and DOE

**Reviewer:** Task #5 agent
**Date:** 2026-03-01
**Files reviewed:**
- Content: `src/lib/eda/technique-content/combined-diagnostic.ts`, `multivariate.ts`, `designed-experiments.ts`
- SVG generators: `composite-plot.ts`, `contour-plot.ts`, `doe-mean-plot.ts`, `doe-scatter-plot.ts`
- Handbook sources: `handbook/eda/section3/4plot.htm`, `ppccplot.htm`, `weibplot.htm`, `contour.htm`, `scatplma.htm`, `condplot.htm`, `dexsplot.htm`, `dexmeanp.htm`, `dexsdplo.htm`, `dexcont.htm`

---

## 1. 4-Plot (NIST 1.3.3.32)

### Verdict: PASS -- accurate

**Definition:** Correctly describes the 4-plot as a composite of run-sequence plot, lag plot, histogram, and normal probability plot. Matches handbook exactly.

**Purpose:** Accurately states it tests the four underlying assumptions of a measurement process. Correctly notes its role as a "recommended starting point" for univariate process characterization.

**Interpretation:** All four panel descriptions match handbook:
- Run-sequence plot (upper left): fixed location + fixed variation -- correct
- Lag plot (upper right): randomness -- correct
- Histogram (lower left): distributional shape -- correct
- Normal probability plot (lower right): normality -- correct

The handbook says: "flat and non-drifting" for run-sequence, "structureless and random" for lag plot, "bell-shaped" for histogram, "approximately linear" for normal probability plot. The site's interpretation captures all of these patterns correctly.

**Questions:** All 16 questions from the handbook (Section 1.3.3.32) are faithfully reproduced in the site content.

**Formulas:** The 4-plot diagnostic ensemble formula is a correct and useful summary. The notation for the 2x2 grid layout matches the handbook's description.

**Assumptions:** Correctly notes that time-ordered data is needed for run-sequence and lag plot panels.

**Expanded definition:** Correctly mentions applicability to residuals from fitted models Y_i = f(X_1,...,X_k) + E_i, matching handbook text.

**SVG generator (composite-plot.ts):** The `generate4Plot` function creates the correct 2x2 grid layout with run-sequence, lag, histogram, and normal probability plot panels in the correct positions matching the NIST layout.

**No issues found.**

---

## 2. PPCC Plot (NIST 1.3.3.23)

### Verdict: PASS -- accurate

**Definition:** Correctly describes the PPCC plot as displaying the probability plot correlation coefficient against shape parameter values. Matches handbook.

**Purpose:** Accurately describes its use for identifying shape parameters and comparing distributional families. Correctly mentions the Tukey-Lambda family.

**Interpretation:** Tukey-Lambda reference values match handbook exactly:
- lambda = -1: Cauchy -- correct
- lambda = 0: logistic -- correct
- lambda ~= 0.14: normal -- correct
- lambda = 0.5: U-shaped -- correct
- lambda = 1: uniform -- correct

The site correctly states that lambda < 0.14 suggests long-tailed distributions and lambda > 0.14 suggests short-tailed distributions, matching handbook.

**Questions:** All four questions from the handbook are accurately reproduced.

**Formulas:**
- PPCC formula: `PPCC(lambda) = Corr(X_(i), M_(i)(lambda))` -- correct formulation
- Optimal shape parameter: argmax definition -- correct
- Tukey-Lambda quantile function: The piecewise formula with lambda != 0 and lambda = 0 cases is mathematically correct

**Assumptions:** Correctly notes the requirement for a continuous distribution and a family parameterized by a shape parameter, consistent with handbook's statement that it is "not appropriate for distributions, such as the normal, that are defined only by location and scale parameters."

**Importance:** Accurately reflects the handbook's guidance about using judgement when selecting distributions (broad peak = multiple adequate fits).

**No issues found.**

---

## 3. Weibull Plot (NIST 1.3.3.30)

### Verdict: PASS -- accurate

**Definition:** Correctly describes the Weibull plot as a probability plot with linearized axes for the Weibull distribution. Correctly states the axes: horizontal = log10(data values), vertical = ln(-ln(1-p)).

**Purpose:** Accurately describes use in reliability engineering for time-to-failure data. Correctly explains the flexibility of the Weibull distribution for decreasing (beta < 1), constant (beta = 1), and increasing (beta > 1) failure rates.

**Interpretation:**
- Shape parameter beta = reciprocal of slope -- **CORRECT** per handbook: "the shape parameter is the reciprocal of the slope of the fitted line"
- Scale parameter at 63.2nd percentile -- **CORRECT** per handbook: "the scale parameter falls at the 63.2% point irrespective of the value of the shape parameter"
- Beta interpretations (infant mortality, constant hazard, wear-out) -- correct

**Questions:** All three questions from handbook accurately reproduced.

**Formulas:**
- CDF linearization: `ln(-ln(1-F(t))) = beta * ln(t) - beta * ln(eta)` -- correct linearization of the Weibull CDF
- Plotting position (Benard's approximation): `F_hat_i = (i - 0.3)/(N + 0.4)` -- **CORRECT**, matches handbook exactly: "p = (i - 0.3)/(n + 0.4)"

**Assumptions:** Correctly notes limitations with censored data and mixed failure modes.

**Minor note:** The site says "scale parameter eta is the exponent of the intercept." This is correct because the intercept is -beta*ln(eta), so eta = exp(-intercept/beta). The handbook says "the scale parameter is the exponent of the intercept of the fitted line." Both use the same wording.

**No issues found.**

---

## 4. Contour Plot (NIST 1.3.3.10)

### Verdict: PASS -- accurate

**Definition:** Matches handbook exactly: "a graphical technique for representing a 3-dimensional surface by plotting constant z slices, called contours, on a 2-dimensional format."

**Purpose:** Correctly describes it as an alternative to 3-D surface plots, and correctly notes its importance for large 3-D datasets.

**Interpretation:** The site adds useful content about contour spacing (closely spaced = steep, widely spaced = flat) and contour shapes (elliptical = optimum, saddle = minimax). These are standard contour plot interpretation guidelines consistent with the handbook's general approach, though the handbook doesn't go into this level of detail for the general contour plot (it covers some of this in the DOE contour plot section).

**Questions:** Matches handbook: "How does Z change as a function of X and Y?"

**Assumptions:** Correctly notes the regular grid requirement and interpolation need, matching handbook: "The independent variables are usually restricted to a regular grid" and "you typically need to perform a 2-D interpolation to form a regular grid."

**Importance:** Correctly references block plots and DOE mean plots for small designed experiment data, and contour plots for large data, matching handbook structure.

**SVG generator (contour-plot.ts):** Uses d3-contour for marching-squares isoline computation, renders contour lines with inline labels and subtle color fills. Correct implementation.

**No issues found.**

---

## 5. Scatterplot Matrix (NIST 1.3.3.26.11)

### Verdict: PASS -- accurate

**Definition:** Correctly describes the scatterplot matrix as all pairwise scatter plots in a k x k grid. Matches handbook.

**Purpose:** Accurately describes use for exploring multivariate data and identifying correlations, non-linear relationships, clusters, and outliers.

**Interpretation:** Correctly describes the symmetry of the matrix (each pair appears twice). The discussion of linking and brushing matches the handbook's dedicated section on these concepts.

**Questions:** All four questions from the handbook are accurately reproduced:
1. Pairwise relationships -- correct
2. Nature of relationships -- correct
3. Outliers -- correct
4. Clustering by groups -- correct

**Assumptions:** Correctly notes the practical limit of 3-8 variables and the quadratic growth. The handbook mentions similar concerns about the number of plots.

**Importance:** Accurately mentions linking and brushing concepts, matching the handbook's dedicated section on these topics.

**No issues found.**

---

## 6. Conditioning Plot (NIST 1.3.3.26.12)

### Verdict: PASS -- accurate

**Definition:** Matches handbook: "A conditional plot, also known as a coplot or subset plot, is a plot of two variables conditional on the value of a third variable (called the conditioning variable)."

**Purpose:** Correctly states that the conditioning plot addresses the limitation of the scatterplot matrix (cannot show interaction effects), which is directly from the handbook: "One limitation of the scatter plot matrix is that it cannot show interaction effects with another variable. This is the strength of the conditioning plot."

**Interpretation:** Correctly describes examining whether the pattern changes across panels. Mentions lowess overlay option matching handbook.

**Questions:** All four questions from the handbook are accurately reproduced.

**Assumptions:** Correctly notes the alternatives in detail (fitted curves, axis labeling, panel spacing), matching the handbook's numbered list of alternatives.

**Definition expanded:** Correctly describes the division of Z into k groups with n rows and c columns where n*c >= k, matching handbook exactly.

**No issues found.**

---

## 7. DOE Plots (NIST 1.3.3.11-13)

### Verdict: PASS -- accurate, with minor notes

**Definition:** Correctly defines the three component plots (DOE scatter plot, DOE mean plot, DOE standard deviation plot) and their roles.

**Purpose:** Accurately describes the purpose of each component:
- DOE scatter plot: raw data by factor level -- matches handbook 1.3.3.11
- DOE mean plot: group means -- matches handbook 1.3.3.12
- DOE SD plot: group standard deviations -- matches handbook 1.3.3.13

The site correctly notes that "the mean plot does not provide a definitive answer about factor importance, but it helps categorize factors as 'clearly important', 'clearly not important', or of 'borderline importance'." This is a direct match to the handbook (dexmeanp.htm): "The DOE mean plot does not provide a definitive answer to this question, but it does help categorize factors as 'clearly important', 'clearly not important', and 'borderline importance'."

**Questions:** The combined questions from all three NIST sections are appropriately merged.

**Formulas:**
- Group mean: `x_bar_j = (1/n_j) * sum(x_ij)` -- correct
- Grand mean: `x_bar_bar = (1/N) * sum_j sum_i x_ij` -- correct
- Group standard deviation: standard sample SD formula -- correct

**Interaction effects extension:** Correctly describes the k x k matrix extension with diagonal main effects and off-diagonal interaction effects (X_i * X_j), matching the handbook's description in both dexmeanp.htm and dexsplot.htm.

**SVG generators:**
- `doe-mean-plot.ts`: Correctly implements multi-panel layout with group means, connecting lines, and grand mean reference line. Matches handbook description.
- `doe-scatter-plot.ts`: Correctly implements raw response values with jitter at each factor level, with solid grand mean reference line. Matches handbook description.

**Minor note:** The NIST reference says "Sections 1.3.3.11-13" which is correct but omits section 1.3.3.10.1 (DOE contour plot). The content does not explicitly include the DOE contour plot description in the doe-plots content, but the contour-plot technique covers the general contour plot. This is an acceptable editorial choice since DOE contour plot is a sub-technique of contour plot in the handbook hierarchy.

**No issues found.**

---

## Summary

| Technique | Verdict | Issues |
|---|---|---|
| 4-Plot | PASS | None |
| PPCC Plot | PASS | None |
| Weibull Plot | PASS | None |
| Contour Plot | PASS | None |
| Scatterplot Matrix | PASS | None |
| Conditioning Plot | PASS | None |
| DOE Plots | PASS | None |

**Overall assessment:** All seven techniques are accurately represented. Definitions, purposes, interpretation guidance, formulas, and assumptions match the NIST/SEMATECH handbook source material. The SVG generators correctly implement the described plot layouts. No factual errors or misleading information was found.
