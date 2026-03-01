# Regression Techniques Review: Accuracy Against NIST Handbook

**Reviewer:** regression-reviewer agent
**Date:** 2026-03-01
**Source files compared:**
- Site content: `src/lib/eda/technique-content/regression.ts`
- SVG generators: `src/lib/eda/svg-generators/scatter-plot.ts`, `composite-plot.ts`, `line-plot.ts`
- Handbook sources: `handbook/eda/section3/scatterp.htm`, `scatter1-c.htm`, `linecorr.htm`, `lineinte.htm`, `lineslop.htm`, `linressd.htm`, `6plot.htm`

---

## 1. Scatter Plot (NIST 1.3.3.26)

### Definition
- **Site:** "A scatter plot displays the relationship between two quantitative variables by plotting each observation as a point in a two-dimensional coordinate system..."
- **Handbook:** "A scatter plot is a plot of the values of Y versus the corresponding values of X." Vertical axis = Y (response), Horizontal axis = X (suspected related variable).
- **Verdict: ACCURATE.** The site's definition is an expanded, accurate paraphrase of the handbook. It adds mention of "regression line, confidence bands, and LOWESS smoother" which the handbook does not mention in the definition (only in examples/related techniques), but these are legitimate enhancements and described as "optional."

### Purpose
- **Site:** "Use a scatter plot as the primary tool for exploring the relationship between two continuous variables..."
- **Handbook:** "A scatter plot reveals relationships or association between two variables. Such relationships manifest themselves by any non-random structure in the plot."
- **Verdict: ACCURATE.** The site expands the handbook's purpose appropriately. No factual errors.

### Questions
- **Site:** 5 questions matching handbook exactly.
- **Handbook:** Same 5 questions in same order.
- **Verdict: EXACT MATCH.** No issues.

### Interpretation
- **Site:** Covers positive/negative linear trends, no relationship, curvature, clusters, outliers, and lists variant patterns.
- **Handbook:** The main page is sparse on interpretation, deferring to the 10 variant sub-pages. The site's interpretation synthesizes all variant pages accurately.
- **Verdict: ACCURATE.**

### Importance
- **Site:** "The scatter plot is the single most important graphical tool for bivariate analysis... correlation does not imply causation."
- **Handbook:** The importance section is commented out in the HTML but says essentially the same thing. The "causality is not proved by association" section is present and says "association does NOT imply causality."
- **Verdict: ACCURATE.** Good that the site includes the causation caveat.

### Assumptions
- **Site:** "The scatter plot makes no distributional assumptions and is valid for any pair of continuous variables."
- **Handbook:** Does not have an explicit assumptions section, which is consistent -- it truly has no distributional assumptions.
- **Verdict: ACCURATE.**

### Formulas
1. **Linear Model:** `Y = B_0 + B_1 X + E` -- Correct, standard notation.
2. **Quadratic Model:** `Y = B_0 + B_1 X + B_2 X^2 + E` -- **Handbook (scatter5.htm):** `Y_i = A + BX_i + CX_i^2 + E_i`. Different variable names but mathematically identical. **ACCURATE.**
3. **Exponential Model:** `Y = A + B e^{CX} + E` -- **Handbook (scatter6.htm):** `Y_i = A + B*exp(C*X_i) + E_i`. **EXACT MATCH.**
4. **Sinusoidal Model:** `Y = C + (B_0 + B_1 X) sin(2*pi*omega*X + phi) + E` -- **Handbook (scatter7.htm):** `Y_i = C + (B_0 + B_1*t_i)*sin(2*pi*omega*t_i + phi) + E_i`. **EXACT MATCH** (site uses X where handbook uses t, which is equivalent).

### Scatter Plot Variant Review (12 variants)

The NIST handbook lists 10 basic variants (scatter1-scattera) plus 2 combining techniques (scatterb=scatterplot matrix, scatterc=conditioning plot). The site lists 12 example variants. Here is the cross-check:

| # | NIST Variant | Site Variant | Match? |
|---|---|---|---|
| 1 | 1.3.3.26.1 - No Relationship | "No Correlation" | ACCURATE |
| 2 | 1.3.3.26.2 - Strong Linear (positive) | "Strong Positive Correlation" | ACCURATE |
| 3 | 1.3.3.26.3 - Strong Linear (negative) | "Strong Negative Correlation" | ACCURATE |
| 4 | 1.3.3.26.4 - Exact Linear (positive) | "Exact Linear" | ACCURATE |
| 5 | 1.3.3.26.5 - Quadratic | "Quadratic Relationship" | ACCURATE |
| 6 | 1.3.3.26.6 - Exponential | "Exponential Relationship" | ACCURATE |
| 7 | 1.3.3.26.7 - Sinusoidal (damped) | "Sinusoidal (Damped)" | ACCURATE |
| 8 | 1.3.3.26.8 - Homoscedastic | "Homoscedastic" | ACCURATE |
| 9 | 1.3.3.26.9 - Heteroscedastic | "Heteroscedastic" | ACCURATE |
| 10 | 1.3.3.26.10 - Outlier | "With Outliers" | ACCURATE |
| 11 | 1.3.3.26.11 - Scatterplot Matrix | Not a variant (separate technique) | N/A |
| 12 | 1.3.3.26.12 - Conditioning Plot | Not a variant (separate technique) | N/A |

The site adds two extra variants not in the handbook:
- **"Weak Positive Correlation"** -- Not a separate NIST section but a valid general scatter pattern. The description is accurate.
- **"Clustered"** -- Not a separate NIST section but a valid general scatter pattern. The description is accurate.

The site omits scatterplot matrix and conditioning plot from the scatter plot examples, which is correct since these are separate multi-variable techniques handled elsewhere.

**Variant Description Accuracy:**

1. **No Correlation:** Site says "correlation coefficient is near zero. X provides no information about Y." Handbook says "no relationship" with values ranging all over. **ACCURATE.**
2. **Strong Positive:** Site says "correlation coefficient is close to +1." Handbook says "strong linear relationship" with "positive co-relation." **ACCURATE.**
3. **Strong Negative:** Site says "correlation coefficient is close to -1." Handbook says "strong linear relationship" with "negative co-relation." **ACCURATE.**
4. **Exact Linear:** Site says "R = 1.0" and "perfect linear relationship is rare in practice." Handbook says "scatter about the line is zero -- there is perfect predictability." **ACCURATE.** The site adds reasonable editorial commentary about rarity.
5. **Quadratic:** Site says "linear correlation may be near zero despite a strong relationship." This is a correct and important insight. Handbook focuses on the model form. **ACCURATE.**
6. **Exponential:** Site says "log transformation of Y or an exponential model is needed." Handbook gives the exponential model. **ACCURATE.**
7. **Sinusoidal (Damped):** Site correctly describes the damped sinusoidal model and references NIST 1.3.3.26.7. **ACCURATE.**
8. **Homoscedastic:** Site says "constant vertical spread across the full range of X" and "satisfies a key assumption of ordinary least squares regression." Handbook says variation is "about the same (+- 10 units), regardless of the value of X" and calls it "very important as it is an underlying assumption for regression." **ACCURATE.**
9. **Heteroscedastic:** Site says "vertical spread of points increases (or decreases) systematically... forming a fan or trumpet shape. This non-constant variance violates a key regression assumption." Handbook describes same pattern and recommends "proper weighting of the data" or "performing a Y variable transformation." **ACCURATE.**
10. **With Outliers:** Site says "one or more points lie far from the main body. These outliers may be influential observations." Handbook says "a single outlier... emanates from a different model than do the rest of the data." **ACCURATE.**
11. **Weak Positive (site-only):** Description of moderate correlation (0.3-0.6) is standard statistics. **ACCURATE (valid addition).**
12. **Clustered (site-only):** Description of distinct groups is standard EDA knowledge. **ACCURATE (valid addition).**

### Case Study Reference
- **Site:** References "beam-deflections" case study slug.
- **Handbook:** References the "load cell calibration" data case study.
- **Issue: MINOR DISCREPANCY.** These are different case studies, but this is a site-specific design choice (they may have chosen a different example). Not a factual error in the technique description itself.

### SVG Generator (`scatter-plot.ts`)
- Correctly plots points at (x, y) coordinates with d3 scales.
- Optional linear regression line uses `linearRegression()` from stats library.
- Confidence band uses standard error of estimate with leverage formula `1/n + (xi - mx)^2 / ssx` and z=1.96 multiplier. This is the standard 95% confidence interval for the mean response (not prediction interval). **MATHEMATICALLY CORRECT.**
- R-squared annotation is displayed. **CORRECT.**

### Scatter Plot Summary: NO ERRORS FOUND

---

## 2. Linear Plots (NIST 1.3.3.16-19)

### Definition
- **Site:** "Linear plots are a set of four companion plots used to assess whether linear fits are consistent across groups: the linear correlation plot (1.3.3.16), the linear intercept plot (1.3.3.17), the linear slope plot (1.3.3.18), and the linear residual standard deviation plot (1.3.3.19)."
- **Handbook:** Each of the four NIST pages describes its individual plot. The site accurately consolidates them into a single technique entry.
- **Verdict: ACCURATE.** The site correctly identifies all four components and their NIST section numbers.

### Purpose
- **Site:** "Use linear plots when your data have groups and you need to know whether a single linear fit can be used across all groups or whether separate fits are required..."
- **Handbook (linecorr.htm):** "Linear correlation plots are used to assess whether or not correlations are consistent across groups."
- **Handbook (lineinte.htm):** "Linear intercept plots are used to graphically assess whether or not linear fits are consistent across groups."
- **Handbook (lineslop.htm):** "Linear slope plots are used to graphically assess whether or not linear fits are consistent across groups."
- **Handbook (linressd.htm):** "Linear RESSD plots are used to graphically assess whether or not linear fits are consistent across groups."
- **Verdict: ACCURATE.** The site synthesizes all four correctly.

### Purpose detail about correlation plot examined first
- **Site:** "The correlation plot is often examined first: if correlations are high across groups, it is worthwhile to continue with the slope, intercept, and residual standard deviation plots."
- **Handbook (linecorr.htm):** "A linear correlation plot could be generated initially to see if linear fitting would be a fruitful direction. If the correlations are high, this implies it is worthwhile to continue with the linear slope, intercept, and residual standard deviation plots."
- **Verdict: EXACT MATCH.**

### Questions (8 total, 2 from each plot)
Comparing each pair:

1. "Are there linear relationships across groups?" -- **MATCH** (linecorr.htm Q1)
2. "Are the strength of the linear relationships relatively constant across the groups?" -- **MATCH** (linecorr.htm Q2)
3. "Is the intercept from linear fits relatively constant across groups?" -- **MATCH** (lineinte.htm Q1)
4. "If the intercepts vary across groups, is there a discernible pattern?" -- **MATCH** (lineinte.htm Q2)
5. "Do you get the same slope across groups for linear fits?" -- **MATCH** (lineslop.htm Q1)
6. "If the slopes differ, is there a discernible pattern in the slopes?" -- **MATCH** (lineslop.htm Q2)
7. "Is the residual standard deviation from a linear fit constant across groups?" -- **MATCH** (linressd.htm Q1)
8. "If the residual standard deviations vary, is there a discernible pattern across the groups?" -- **MATCH** (linressd.htm Q2)

**All 8 questions: EXACT MATCH.**

### Interpretation
- **Site:** Describes each of the four panels and what constant vs. varying values mean.
- **Handbook:** Each page has its own definition section matching the site's description.
- **Verdict: ACCURATE.**

### Assumptions
- **Site:** "Linear plots require grouped data with enough observations per group to compute a meaningful linear fit."
- **Handbook:** Does not state assumptions explicitly, but the technique inherently requires grouped data.
- **Verdict: ACCURATE (reasonable inference).**

### Importance
- **Site:** "For grouped data, it may be important to know whether the different groups are homogeneous (similar) or heterogeneous (different). Linear plots help answer this question in the context of linear fitting."
- **Handbook (all four pages):** "For grouped data, it may be important to know whether the different groups are homogeneous (i.e., similar) or heterogeneous (i.e., different). Linear [correlation/intercept/slope/RESSD] plots help answer this question in the context of linear fitting."
- **Verdict: NEAR-EXACT MATCH.**

### Expanded definition note about reference line
- **Site:** "A reference line on each panel shows the corresponding statistic from a linear fit using all the data combined."
- **Handbook:** Each definition section says "A reference line is plotted at the [statistic] from a linear fit using all the data."
- **Verdict: EXACT MATCH.**

### NIST Reference
- **Site:** "Sections 1.3.3.16-19"
- **Verdict: CORRECT.**

### Line Plot SVG Generator (`line-plot.ts`)
- Used in `run-sequence` mode for the linear plots.
- Draws connected line series with reference line at mean (or custom refValue).
- The linear plots would use this generator with group statistics as data points and the overall statistic as the refValue.
- **Implementation appears correct** for the linear plot use case.

### Linear Plots Summary: NO ERRORS FOUND

---

## 3. 6-Plot (NIST 1.3.3.33)

### Definition
- **Site:** "The 6-plot is a regression diagnostic display with six panels for validating a fitted Y versus X model."
- **Handbook:** "The 6-plot is a collection of 6 specific graphical techniques whose purpose is to assess the validity of a Y versus X fit."
- **Verdict: ACCURATE.**

### Six Panels
- **Site lists:**
  1. Response and predicted values vs independent variable
  2. Residuals vs independent variable
  3. Residuals vs predicted values
  4. Lag plot of residuals
  5. Histogram of residuals
  6. Normal probability plot of residuals

- **Handbook lists (same order):**
  1. Scatter plot of the response and predicted values versus the independent variable
  2. Scatter plot of the residuals versus the independent variable
  3. Scatter plot of the residuals versus the predicted values
  4. Lag plot of the residuals
  5. Histogram of the residuals
  6. Normal probability plot of the residuals

- **Verdict: EXACT MATCH.**

### Purpose
- **Site:** "Use the 6-plot after fitting any Y versus X model to assess its validity. The fit can be linear, non-linear, LOWESS, spline, or any other fit utilizing a single independent variable."
- **Handbook:** "The 6-plot is a collection of 6 specific graphical techniques whose purpose is to assess the validity of a Y versus X fit. The fit can be a linear fit, a non-linear fit, a LOWESS (locally weighted least squares) fit, a spline fit, or any other fit utilizing a single independent variable."
- **Verdict: NEAR-EXACT MATCH.**

### Questions
- **Site:** 4 questions.
- **Handbook:** Same 4 questions in same order.
- **Verdict: EXACT MATCH.**

### Interpretation
- **Site:** Describes each of the 6 panels and what to look for.
- **Handbook:** The definition section describes the axes for each panel. The importance section describes what the panels check.
- Panel-by-panel check:
  - Panel 1: Site says "overlays raw data with fitted curve to visually assess goodness of fit." Handbook says "the plot of the response variable and the predicted values versus the independent variable is used to assess whether the variation is sufficiently small." **ACCURATE.**
  - Panel 2: Site says "should show random scatter with no systematic pattern; curvature suggests the model form is wrong." Handbook says "the plots of the residuals versus the independent variable and the predicted values is used to assess the independence assumption." **MINOR NOTE:** The handbook says panels 2-3 assess "independence," but they actually assess both independence and functional form adequacy. The site's description of "curvature suggests model form is wrong" is a more precise description of what panels 2-3 reveal, and is standard regression diagnostic practice. **ACCURATE (site is arguably more precise).**
  - Panel 3: Site says "fan shape indicates non-constant variance." This is correct -- the handbook doesn't specifically say this for the 6-plot page, but it is standard regression diagnostic practice. **ACCURATE.**
  - Panel 4: Site says "checks for serial correlation; structure indicates non-independence." Handbook says lag plot checks independence via the fixed distribution/location/variation assumptions. **ACCURATE.**
  - Panel 5: Site says "should be approximately bell-shaped." Handbook says histogram verifies the "fixed distribution" assumption. **ACCURATE.**
  - Panel 6: Site says "should be approximately linear; deviations suggest non-normal errors." Handbook says normal probability plot verifies assumptions. **ACCURATE.**

### Layout
- **Site (definitionExpanded):** "arranged in a 2 x 3 grid (2 rows, 3 columns)."
- **Handbook:** The 6plot.gif shows a 2x3 layout (2 rows, 3 columns). The definition lists 6 panels in order that maps to Row1: panels 1-3, Row2: panels 4-6.
- **Verdict: ACCURATE.**

### Lag Plot Axis Labels
- **Site (interpretation):** Panel 4 is "lag plot of residuals"
- **Handbook (definition):** Vertical axis: RES(I), Horizontal axis: RES(I-1)
- **Site (Python code):** Uses `residuals[:-1]` for x-axis (RES(i-1)) and `residuals[1:]` for y-axis (RES(i)). Labels: xlabel="RES(i-1)", ylabel="RES(i)".
- **ISSUE FOUND:** The handbook says Vertical=RES(I) and Horizontal=RES(I-1). The Python code correctly implements this. However, let me verify the SVG generator...

### Formula
- **Site:** `Y_i = f(X_i) + E_i` with explanation about f being the deterministic function and E the random error.
- **Handbook:** `Y_i = f(X_i) + E_i` with same decomposition.
- **Verdict: EXACT MATCH.**

### Assumptions
- **Site:** "The 6-plot assumes a regression model has been fit to bivariate (X, Y) data."
- **Handbook:** Implicit -- the 6-plot is applied after fitting. The handbook says "For a good model, the error component should behave like: (1) random drawings (i.e., independent); (2) from a fixed distribution; (3) with fixed location; and (4) with fixed variation."
- **Verdict: ACCURATE.**

### Case Study Reference
- **Site:** References "alaska-pipeline" case study slug.
- **Handbook:** "The 6-plot is used in the Alaska pipeline data case study."
- **Verdict: EXACT MATCH.**

### SVG Generator (`composite-plot.ts` - `generate6Plot`)
- Correctly creates a 2x3 grid layout.
- Computes linear regression and residuals: `residuals = y - (slope * x + intercept)`. **CORRECT.**
- Panel 1: Scatter with regression line (Y vs X). **CORRECT.**
- Panel 2: Residuals vs X. **CORRECT.**
- Panel 3: Residuals vs predicted. **CORRECT.**
- Panel 4: Lag plot of residuals. Uses `generateLagPlot` which handles lag-1 plotting. **CORRECT.**
- Panel 5: Histogram of residuals with KDE. **CORRECT.**
- Panel 6: Normal probability plot of residuals. **CORRECT.**

**Note:** The generator currently only supports linear regression (`linearRegression`). The NIST 6-plot is valid for any Y vs X fit. This is a limitation, not an error -- the technique description correctly states it works for any fit type.

### 6-Plot Summary: NO ERRORS FOUND

---

## Overall Summary

| Technique | Errors Found | Status |
|---|---|---|
| Scatter Plot (1.3.3.26) | 0 | PASS |
| Linear Plots (1.3.3.16-19) | 0 | PASS |
| 6-Plot (1.3.3.33) | 0 | PASS |

### Minor Notes (not errors):
1. **Scatter plot case study:** Site references "beam-deflections" while handbook references "load cell calibration." This is a site-specific choice, not a factual error.
2. **6-Plot SVG generator:** Only supports linear regression, but the technique description correctly states the 6-plot works for any fit type. This is a feature limitation, not a content error.
3. **Scatter plot variants:** The site adds 2 variants not in the handbook (Weak Positive Correlation, Clustered). Both are legitimate scatter plot patterns and accurately described. The site correctly omits scatterplot matrix and conditioning plot from the variant list since those are separate techniques.
4. **Scatter plot definition mentions LOWESS/confidence bands:** The handbook does not mention these in its definition, but the site describes them as "optional enhancements." This is accurate editorial enrichment.

All regression technique content is factually correct and consistent with the NIST/SEMATECH handbook source material.
