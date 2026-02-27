# Canonical Case Study Section Template

## Purpose

This document defines the standard heading structure for all 9 EDA case study pages (phases 57-62). Content authors should follow this template to ensure structural consistency across all case studies. Each heading includes a brief description of what content belongs there and notes on which component/function call maps to each section.

## Standard Template

Used by: **Normal Random Numbers**, **Cryothermometry**, **Heat Flow Meter**, **Filter Transmittance**, **Standard Resistor** (Phase 58)

```
## Background and Data
```
- Describe the dataset origin, measurement context, number of observations, and the NIST section reference.
- Include `<CaseStudyDataset dataset="..." />` component for the raw data display.

```
## Test Underlying Assumptions
```
- State the four EDA assumptions being tested: fixed location, fixed variation, randomness, fixed distribution.

```
### Goals
```
- List 1-3 specific analytical goals for this case study (e.g., "determine if the data are random").

```
## Graphical Output and Interpretation
```
- Introductory paragraph explaining the graphical analysis approach.

```
### 4-Plot Overview
```
- Component: `<*Plots type="4-plot" />`
- One paragraph interpreting the composite 4-plot as a screening tool.

```
### Run Sequence Plot
```
- Component: `<*Plots type="run-sequence" />`
- Interpretation of location/variation stability, trends, shifts, or outliers.

```
### Lag Plot
```
- Component: `<*Plots type="lag" />`
- Interpretation of randomness: structureless cloud = random; linear/elliptical = autocorrelated.

```
### Histogram
```
- Component: `<*Plots type="histogram" />`
- Interpretation of distributional shape: symmetric, skewed, bimodal, etc.

```
### Normal Probability Plot
```
- Component: `<*Plots type="probability" />`
- Interpretation of normality: linear = normal; S-shaped = non-normal.

```
### Autocorrelation Plot
```
- Component: `<*Plots type="autocorrelation" />`
- Interpretation: coefficients within bands = independent; outside = autocorrelated.

```
### Spectral Plot
```
- Component: `<*Plots type="spectral" />`
- Interpretation of frequency content: flat = white noise; peaks = periodic components.

```
## Quantitative Output and Interpretation
```
- Introductory paragraph explaining the quantitative analysis approach.

```
### Summary Statistics
```
- Function: `mean()`, `standardDeviation()`, `median()`, `min()`, `max()` from statistics.ts
- Table with N, Mean, Std Dev, Median, Min, Max, Skewness, Kurtosis.

```
### Location Test
```
- Function: `tTestOneSample()` or location regression t-test from statistics.ts
- Test whether the mean equals a reference value. Report t-statistic, p-value, conclusion.

```
### Variation Test
```
- Function: `bartlettTest()` from statistics.ts
- Test whether variation is constant. Report test statistic, p-value, conclusion.

```
### Randomness Tests
```
- Function: `runsTest()` from statistics.ts for the runs test.
- Function: Lag-1 autocorrelation from `autocorrelation()` in statistics.ts.
- Report both test results with statistics and conclusions.

```
### Distribution Test
```
- Function: `andersonDarlingTest()` from statistics.ts
- Test whether data follow the hypothesized distribution. Report A-squared, p-value, conclusion.

```
### Outlier Detection
```
- Function: `grubbsTest()` from statistics.ts
- Test for the most extreme value. Report Grubbs statistic, critical value, conclusion.

```
### Test Summary
```
- Summary table with columns: Assumption, Test, Statistic, Result (Pass/Fail).
- One row per assumption tested.

```
## Interpretation
```
- Synthesize graphical and quantitative evidence into 2-3 paragraphs.
- State which assumptions are satisfied and which are violated.
- Explain practical implications for the dataset.

```
## Conclusions
```
- 3-5 bullet points summarizing the key findings.
- Cross-reference to relevant technique and quantitative method pages using links from the URL cheat sheet.

---

## Distribution Focus Variation

Used by: **Uniform Random Numbers**, **Fatigue Life**

Identical to the Standard Template with the following additions:

### Additional subsection under Graphical Output

After the standard plot subsections, add:

```
### Distribution Comparison
```
- Component: `<*Plots type="uniform-probability" />` (Uniform Random) or additional probability plot types for Fatigue Life
- For Uniform Random: Show uniform probability plot demonstrating the correct distributional fit.
- For Fatigue Life: Show Weibull and/or gamma probability plots with fitted overlays to compare candidate distributions.
- Interpretation of which distribution provides the best fit.

### Adjusted Distribution Test

The Distribution Test subsection under Quantitative Output should test against the specific candidate distribution (uniform, Weibull, gamma) rather than only normal.

---

## Model Development Variation

Used by: **Beam Deflections**

Identical to the Standard Template through "Quantitative Output and Interpretation", then adds:

```
## Develop Better Model
```
- Identify the dominant frequency from the spectral plot.
- Describe the sinusoidal model: Y = B0 + A*sin(2*pi*f*t) + B*cos(2*pi*f*t)
- Present regression parameter estimates (B0, A, B, f) matching NIST values.
- Component: Model fitting is done in BeamDeflectionPlots.astro frontmatter.

```
### Model Parameters
```
- Table with parameter estimates: Intercept (B0), Amplitude (A), Sine coefficient, Cosine coefficient, Frequency.
- Compare to NIST source values.

```
## Validate New Model
```
- Apply the same graphical and quantitative diagnostics to the model residuals.

```
### Residual 4-Plot
```
- Component: `<BeamDeflectionPlots type="residual-4-plot" />`

```
### Residual Run Sequence Plot
```
- Component: `<BeamDeflectionPlots type="residual-run-sequence" />`

```
### Residual Lag Plot
```
- Component: `<BeamDeflectionPlots type="residual-lag" />`

```
### Residual Histogram
```
- Component: `<BeamDeflectionPlots type="residual-histogram" />`

```
### Residual Normal Probability Plot
```
- Component: `<BeamDeflectionPlots type="residual-probability" />`

```
### Residual Autocorrelation Plot
```
- Component: `<BeamDeflectionPlots type="residual-autocorrelation" />`

```
### Validation Summary
```
- Table comparing assumption test results for original data vs. residuals.
- Demonstrate that the model adequately captures the deterministic structure.

Then continues with:

```
## Interpretation
```
- Synthesize evidence from both the original data analysis and the model validation.

```
## Conclusions
```

---

## DOE Variation

Used by: **Ceramic Strength**

This variation replaces the standard single-dataset structure with a multi-factor analysis structure matching NIST Section 1.4.2.6.

```
## Background and Data
```
- Describe the ceramic strength dataset: 480 observations, 2 batches, multiple labs, table/furnace factors.
- Include `<CaseStudyDataset dataset="ceramicStrength" />`.

```
## Response Variable Analysis
```
- Pooled analysis of all 480 strength values (ignoring factors).

```
### 4-Plot Overview
```
- Component: `<CeramicStrengthPlots type="4-plot" />`
- Interpret as screening of the pooled dataset.

```
### Run Sequence Plot
```
- Component: `<CeramicStrengthPlots type="run-sequence" />`

```
### Lag Plot
```
- Component: `<CeramicStrengthPlots type="lag" />`

```
### Histogram
```
- Component: `<CeramicStrengthPlots type="histogram" />`
- Note bimodal shape from batch effect.

```
### Normal Probability Plot
```
- Component: `<CeramicStrengthPlots type="probability" />`
- Note S-shaped curvature from mixture of batches.

```
## Batch Effect Analysis
```
- Compare Batch 1 vs. Batch 2 using comparative plots and tests.

```
### Batch Box Plot
```
- Component: `<CeramicStrengthPlots type="batch-box-plot" />`

```
### Batch Histograms
```
- Components: `<CeramicStrengthPlots type="batch1-histogram" />` and `<CeramicStrengthPlots type="batch2-histogram" />`

```
### Batch Statistical Tests
```
- Two-sample t-test for location difference between batches.
- F-test or Levene test for equal variance between batches.

```
## Lab Effect Analysis
```
- Compare across labs within each batch.
- Lab-specific box plots and statistical tests (one-factor ANOVA).

```
## Primary Factors Analysis
```
- Analyze table and furnace effects using DOE-specific visualizations.

```
### Bihistogram
```
- Compare factor levels using bihistogram plots.

```
### Block Plots
```
- Block plot showing factor means by group.

```
### Interaction Plots
```
- Interaction plot showing whether factor effects are additive or interactive.

```
## Interpretation
```
- Synthesize multi-factor evidence: which factors significantly affect ceramic strength?
- Batch is the dominant effect; lab, table, and furnace may have secondary effects.

```
## Conclusions
```
- Summarize key findings about factor effects on ceramic strength.

---

## Notes for Content Authors

1. **Always use the `<PlotFigure>` wrapper** -- all `*Plots.astro` components already use it internally, so you just call `<*Plots type="..." />`.
2. **Default captions are built into each Plots component** -- override with `caption="..."` prop only when needed.
3. **Cross-reference links** -- use the URL cross-reference cheat sheet (`url-cross-reference.md`) to build links to technique and quantitative method pages.
4. **Statistics functions** -- all quantitative functions are in `src/lib/eda/math/statistics.ts`. Import and call at build time in the component frontmatter.
5. **Consistency** -- follow the heading hierarchy exactly. Do not skip heading levels or invent new sections without updating this template.
