# Stack Research: EDA Case Study Deep Dive

**Domain:** Enhancing 8 existing EDA case studies + adding 1 new case study (Standard Resistor) to match NIST/SEMATECH source depth in an existing Astro 5 static site
**Researched:** 2026-02-26
**Confidence:** HIGH

## Executive Summary

The existing 13 SVG generators and math library cover all plot types needed. No new npm packages are required. The scope of work is entirely additive within the existing TypeScript codebase: new statistical functions in `statistics.ts`, expanded plot type support in per-case-study `*Plots.astro` components, and a new `StandardResistorPlots.astro` component. The RandomWalkPlots.astro pattern (340 lines, 16 plot types, inline model computation) scales well to all 9 case studies.

## Existing Stack (Fully Sufficient -- Zero New npm Dependencies)

The current technology stack handles everything needed for the case study deep dive. Every analysis from the NIST source material can be implemented with existing tools.

### Existing SVG Generators -- All 13 Cover the Need

| Generator | Used By Case Studies | For Deep Dive |
|-----------|---------------------|---------------|
| `generateLinePlot` (run-sequence mode) | All 9 | Raw data + residual run sequence |
| `generateLagPlot` | All 9 | Raw data + residual lag |
| `generateHistogram` | All 9 | Raw data + residual histograms |
| `generateProbabilityPlot` (normal, uniform, weibull) | All 9 | Distribution assessment + residual normality |
| `generateAutocorrelationPlot` | 7 of 9 | Randomness verification + residual independence |
| `generateSpectralPlot` | 7 of 9 | Frequency analysis + residual white noise verification |
| `generateScatterPlot` | Random Walk (predicted vs original) | Predicted vs. original for all modeled cases |
| `generateBoxPlot` | Ceramic Strength, Fatigue Life | Batch comparisons, group comparisons |
| `generate4Plot` / `generate6Plot` | All 9 | Summary diagnostics + residual diagnostics |

**No new SVG generator types are needed.** Every plot type referenced in the NIST case studies maps to an existing generator. The "predicted vs. original" plot uses `generateScatterPlot`. Residual plots use the same generators applied to computed residual arrays.

### Existing Math Functions -- What We Have

| Function | Location | Used For |
|----------|----------|----------|
| `mean()` | statistics.ts | Summary statistics, model fitting |
| `standardDeviation()` | statistics.ts | Summary statistics, confidence intervals |
| `linearRegression()` | statistics.ts | Location drift test, AR(1) model fitting |
| `autocorrelation()` | statistics.ts | Randomness assessment, lag-k autocorrelation |
| `normalQuantile()` | statistics.ts | Probability plots |
| `kde()` | statistics.ts | Histogram overlays |
| `silvermanBandwidth()` | statistics.ts | KDE bandwidth selection |
| `fft()` | statistics.ts | Spectral analysis |
| `powerSpectrum()` | statistics.ts | Spectral plots |

## New Statistical Functions Required in statistics.ts

These functions must be added to `src/lib/eda/math/statistics.ts` to support the quantitative test result tables that every NIST case study includes. All are pure math -- no dependencies, no npm packages.

### Critical: Required by All Case Studies

| Function | Purpose | NIST Case Studies Using It | Complexity |
|----------|---------|---------------------------|------------|
| `runsTest(data)` | Runs test for randomness (Z-statistic) | Normal Random, Uniform Random, Random Walk, Cryothermometry, Filter Transmittance, Standard Resistor, Heat Flow Meter | Low |
| `leveneTest(data, k)` | Median-based Levene test for variance homogeneity (W-statistic) | Random Walk, Cryothermometry, Filter Transmittance, Standard Resistor, Uniform Random | Medium |
| `bartlettTest(data, k)` | Bartlett test for variance equality (T-statistic, chi-squared) | Normal Random, Heat Flow Meter | Medium |
| `andersonDarlingNormal(data)` | Anderson-Darling normality test (A-squared statistic) | Normal Random, Uniform Random, Cryothermometry, Heat Flow Meter | Medium |
| `grubbsTest(data)` | Grubbs outlier test (G-statistic) | Normal Random, Uniform Random, Heat Flow Meter | Low |
| `median(data)` | Sample median | Used by Levene test, summary statistics | Trivial |
| `tStatistic(slope, slopeStdErr)` | t-statistic for regression slope | All case studies with location drift test | Trivial |

### Required by Specific Case Studies

| Function | Purpose | Case Studies | Complexity |
|----------|---------|-------------|------------|
| `ppcc(data)` | Probability Plot Correlation Coefficient | Normal Random, Uniform Random, Cryothermometry | Low |
| `fTest(var1, var2, n1, n2)` | F-test for variance equality | Ceramic Strength (batch comparison) | Low |
| `twoSampleTTest(group1, group2)` | Two-sample pooled t-test | Ceramic Strength (batch mean comparison) | Low |
| `uniformQuantile(p)` | Uniform distribution quantile function | Uniform Random (uniform PPCC), Random Walk residuals | Trivial |

### Implementation Details

All functions are pure arithmetic operating on `number[]` arrays. None require matrix operations, numerical optimization, or external libraries. The most complex is `andersonDarlingNormal`, which requires sorting the data, computing the normal CDF (via the error function), and summing a weighted series. The normal CDF can be derived from the existing `normalQuantile` inverse using a rational approximation.

```typescript
// Example: Runs test implementation (complete)
export function runsTest(data: number[]): { z: number; runs: number } {
  const n = data.length;
  if (n < 2) return { z: 0, runs: 1 };
  const med = median(data);
  // Count runs (consecutive sequences above/below median)
  let runs = 1;
  let nAbove = 0;
  let nBelow = 0;
  const above = data.map(v => v > med);
  above.forEach((a, i) => {
    if (a) nAbove++; else nBelow++;
    if (i > 0 && above[i] !== above[i - 1]) runs++;
  });
  // Expected runs and standard deviation
  const expectedRuns = 1 + (2 * nAbove * nBelow) / n;
  const stdRuns = Math.sqrt(
    (2 * nAbove * nBelow * (2 * nAbove * nBelow - n)) / (n * n * (n - 1))
  );
  const z = stdRuns > 0 ? (runs - expectedRuns) / stdRuns : 0;
  return { z, runs };
}
```

**Estimated total: ~300-400 lines of TypeScript** for all new statistical functions.

### What Does NOT Need to Be Added

| Function | Why Not Needed |
|----------|---------------|
| Non-linear least squares (Levenberg-Marquardt) | Beam Deflections uses a linearized sinusoidal model (OLS on sin/cos basis) -- already implemented inline in BeamDeflectionPlots.astro |
| Chi-squared distribution CDF | Critical values are hard-coded constants from standard tables (3 df at alpha=0.05 = 7.815) |
| F-distribution CDF | Critical values for Levene/Bartlett/F-tests are known constants at standard significance levels |
| t-distribution CDF | Critical value at alpha=0.05 is 1.96 for large samples; exact values can be hard-coded per case |
| Gamma/Weibull/Birnbaum-Saunders PDF | Fatigue Life candidate distributions are described textually + existing probability plot types suffice |
| Complex demodulation | Beam Deflections uses spectral plot to identify frequency; complex demodulation is supplementary, not required |

**Rationale for hard-coded critical values:** Every NIST case study uses a fixed significance level (alpha = 0.05) with known degrees of freedom. The critical values are mathematical constants (e.g., Z_0.975 = 1.96, chi-squared_0.95(3) = 7.815, F_0.05(3,496) = 2.623). Computing these from scratch requires the incomplete gamma function or beta function -- far more complexity than they're worth when the values are known constants. Hard-code them per test, matching NIST exactly.

## New Astro Components Required

### New: StandardResistorPlots.astro

A new plot component following the exact RandomWalkPlots.astro pattern for the Standard Resistor case study (NIST Section 1.4.2.7, dataset PONTIUS.DAT with 1000 observations).

**Model type:** Linear regression on run order (drift detection), no autoregressive model. The NIST conclusion is that the non-constant variation stems from seasonal humidity effects -- the resolution is equipment modification, not statistical modeling.

**Estimated plot types:** 7-10 (4-plot, run-sequence, lag, histogram, probability, autocorrelation, spectral, plus potential residual plots from linear detrending).

### Existing Components to Expand

Each existing `*Plots.astro` component needs its `PlotType` union and `switch` statement expanded. The pattern is proven (RandomWalkPlots = 340 lines, 16 types; BeamDeflectionPlots already has residual plots).

| Component | Current Plot Types | New Plot Types to Add | Model Type |
|-----------|-------------------|----------------------|------------|
| `NormalRandomPlots.astro` | 7 (basic EDA) | 0 new plots, but quantitative results table data computed in frontmatter | None (satisfies all assumptions) |
| `UniformRandomPlots.astro` | 8 (basic EDA + uniform prob) | 0 new plots, quantitative results computed | None (satisfies all assumptions) |
| `RandomWalkPlots.astro` | 16 (complete with residuals) | **Already complete** -- serves as template | AR(1) |
| `CryothermometryPlots.astro` | 7 (basic EDA) | 0 new plots, quantitative results computed | None (mild autocorrelation noted but not modeled by NIST) |
| `BeamDeflectionPlots.astro` | 13 (EDA + residuals) | +2: `predicted-vs-original`, `residual-spectral` | Sinusoidal (already implemented) |
| `FilterTransmittancePlots.astro` | 7 (basic EDA) | 0 new plots, quantitative results computed | None (fix is instrumentation, not modeling) |
| `HeatFlowMeterPlots.astro` | 7 (basic EDA) | 0 new plots, quantitative results computed | None (well-behaved process) |
| `FatigueLifePlots.astro` | 8 (EDA + box plot) | +1: `weibull-probability` (Weibull prob plot for reliability) | None (distribution selection study) |
| `CeramicStrengthPlots.astro` | 8 (EDA + batch plots) | 0 new plots, quantitative results computed | None (batch effect, not time series model) |

### Component Pattern Scalability Assessment

**The RandomWalkPlots.astro pattern scales well to all 9 case studies.** Key architectural features:

1. **Single dataset import** -- each component imports its dataset from `datasets.ts`
2. **Inline model computation** -- regression, residual calculation happen in Astro frontmatter (build time)
3. **Type-safe plot selection** -- `PlotType` union ensures compile-time checking
4. **Default captions** -- `Record<PlotType, string>` maps each type to a descriptive caption
5. **Shared figure wrapper** -- identical `<figure>` HTML structure across all components

**Pattern does NOT need refactoring.** While a generic `CaseStudyPlots.astro` component could theoretically reduce duplication, it would require:
- A complex discriminated union of all possible model types (AR, sinusoidal, linear, none)
- Runtime branching for model computation that varies radically per case study
- Loss of type safety (PlotType would need to be a superset of all possibilities)

The per-case-study component approach is better because:
- Each case study has a unique model (or none) with different fitting logic
- The plot type set varies per case study
- Default captions are case-study-specific
- 200-350 lines per component is manageable
- Adding a new case study means copying a template and customizing

## New Data Required

### Standard Resistor Dataset

A new export in `src/data/eda/datasets.ts` for the PONTIUS.DAT dataset (1000 observations of standard resistor values, ~27.8-28.1 ohms). This follows the exact pattern of existing dataset exports.

```typescript
// In datasets.ts
export const standardResistor: number[] = [
  // 1000 values from NIST PONTIUS.DAT
  27.97, 28.01, ...
];
```

### Standard Resistor MDX

A new file at `src/data/eda/pages/case-studies/standard-resistor.mdx` following the established pattern.

## Quantitative Test Results Table Component

Each enhanced case study needs a "Quantitative Results" section with formatted test result tables. This does NOT require a new Astro component -- the existing MDX table syntax with `InlineMath` components handles this perfectly, as demonstrated in the Random Walk case study:

```mdx
| Assumption | Test | Statistic | Critical Value | Result |
|---|---|---|---|---|
| **Fixed location** | Regression on run order | <InlineMath tex="t = 9.275" /> | 1.96 | **Reject** |
| **Fixed variation** | Levene test | <InlineMath tex="W = 10.459" /> | 2.623 | **Reject** |
```

**The computations happen in the `*Plots.astro` frontmatter** (which runs at build time), and the results are passed as props or hard-coded in the MDX. Since these are deterministic computations on fixed datasets, the values never change -- they can be computed once and written directly into MDX.

**Recommended approach:** Compute all test statistics in the Astro component frontmatter and expose them as a `results` prop, OR compute them in a shared utility function and hard-code the results in MDX (since datasets are fixed). The latter is simpler and matches the current pattern.

## What NOT to Add

### No New npm Packages

| Tempting Addition | Why NOT to Add | What to Do Instead |
|-------------------|----------------|-------------------|
| `jstat` or `simple-statistics` | These npm packages provide statistical test functions but add 50-200KB of unused code. Our needs are narrow (6-8 specific functions) and the implementations are straightforward. | Implement the ~300 lines of TypeScript in statistics.ts. Pure functions, no dependencies, fully tested. |
| `mathjs` | 700KB+ general-purpose math library. Massive overkill for computing a runs test Z-statistic. | Hand-written functions in statistics.ts. |
| `@stdlib/stats` | Modular but still pulls in infrastructure packages. Each test function imports a dependency chain. | Direct implementations are smaller and have zero dependency risk. |
| `d3-contour` (already installed but unused for case studies) | Contour plots are not part of any NIST case study analysis. | Already available if ever needed; no action required. |
| Any charting library (Chart.js, Plotly, Nivo) | All 13 SVG generators already handle every needed plot type. These would add hundreds of KB for zero benefit. | Use existing generators. |

### No New SVG Generator Files

| Considered Generator | Why NOT Needed |
|---------------------|----------------|
| `predicted-vs-original.ts` | `generateScatterPlot` already does this -- Random Walk's predicted-vs-original uses it with `showRegression: false` |
| `residual-plot.ts` | Residual plots use existing generators (line, lag, histogram, probability, autocorrelation, spectral) applied to a residual array -- no special rendering logic needed |
| `comparison-plot.ts` | NIST case studies don't use side-by-side comparison plots; batch comparisons use box plots (already have `generateBoxPlot`) |
| `complex-demodulation.ts` | Only Beam Deflections mentions complex demodulation, and even NIST treats it as supplementary. The spectral plot already identifies the dominant frequency. |
| `dot-plot.ts` | Fatigue Life mentions dot charts but histograms serve the same analytical purpose and are already implemented |

### No Architecture Changes

| Tempting Refactor | Why NOT to Do |
|-------------------|---------------|
| Generic `CaseStudyPlots.astro` component | Model computation logic varies radically per case study (AR(1), sinusoidal, linear detrend, batch split, none). A generic component would require complex discriminated unions and lose type safety. Per-case-study components are more maintainable at 9 components. |
| Move model computation to statistics.ts | Model computation is tightly coupled to case-study-specific data transformations (e.g., Beam Deflections needs sin/cos basis vectors at a specific frequency). Keeping it in the Astro frontmatter co-locates the computation with its visualization. |
| Create a "test runner" framework | Over-engineering for 9 case studies with fixed datasets. Each test computation is 5-15 lines of arithmetic. A framework adds abstraction without value. |

## Installation

```bash
# No new packages required. Zero npm install commands.
```

## Summary of Required Work

| Category | What | Estimated Lines | Files Touched |
|----------|------|----------------|---------------|
| **statistics.ts** | Add 7-11 new statistical test functions | ~300-400 new lines | 1 file |
| **StandardResistorPlots.astro** | New plot component | ~200-250 lines | 1 new file |
| **datasets.ts** | Add Standard Resistor dataset | ~100-150 lines | 1 file (append) |
| **standard-resistor.mdx** | New case study content | ~300-400 lines | 1 new file |
| **BeamDeflectionPlots.astro** | Add 2 plot types | ~30 lines | 1 file (modify) |
| **FatigueLifePlots.astro** | Add 1 plot type | ~15 lines | 1 file (modify) |
| **8 existing .mdx files** | Add quantitative results tables + deeper analysis | ~200-300 lines each | 8 files (expand) |
| **Total** | | ~2500-3500 lines | ~13 files |

## Sources

- [NIST/SEMATECH e-Handbook Section 1.4.2](https://www.itl.nist.gov/div898/handbook/eda/section4/eda42.htm) -- Case study index listing all 10 case studies. HIGH confidence (official NIST source).
- [NIST Normal Random Quantitative Output](https://www.itl.nist.gov/div898/handbook/eda/section4/eda4213.htm) -- Tests: regression slope, Bartlett, runs, autocorrelation, PPCC, Anderson-Darling, Grubbs. HIGH confidence.
- [NIST Uniform Random Quantitative Output](https://www.itl.nist.gov/div898/handbook/eda/section4/eda4223.htm) -- Tests: regression slope, Levene, runs, autocorrelation, PPCC, Anderson-Darling. HIGH confidence.
- [NIST Random Walk Quantitative Output](https://www.itl.nist.gov/div898/handbook/eda/section4/eda4233.htm) -- AR(1) model fitting. HIGH confidence.
- [NIST Cryothermometry Quantitative Output](https://www.itl.nist.gov/div898/handbook/eda/section4/eda4243.htm) -- Tests: regression slope, Levene, runs, autocorrelation, PPCC, Anderson-Darling, Grubbs. HIGH confidence.
- [NIST Beam Deflections Quantitative Output](https://www.itl.nist.gov/div898/handbook/eda/section4/eda4253.htm) -- Non-linear regression, spectral analysis. HIGH confidence.
- [NIST Filter Transmittance Quantitative Output](https://www.itl.nist.gov/div898/handbook/eda/section4/eda4263.htm) -- Tests: regression slope, Levene, runs, autocorrelation. HIGH confidence.
- [NIST Standard Resistor Quantitative Output](https://www.itl.nist.gov/div898/handbook/eda/section4/eda4273.htm) -- Tests: regression slope, Levene, runs, autocorrelation. HIGH confidence.
- [NIST Heat Flow Meter Quantitative Output](https://www.itl.nist.gov/div898/handbook/eda/section4/eda4283.htm) -- Tests: regression slope, Bartlett, runs, autocorrelation, Anderson-Darling, Grubbs. HIGH confidence.
- [NIST Ceramic Strength Quantitative Output](https://www.itl.nist.gov/div898/handbook/eda/section4/eda42a3.htm) -- Tests: F-test, two-sample t-test. HIGH confidence.
- Existing codebase: `src/lib/eda/math/statistics.ts` -- 248 lines, 9 functions covering mean, stddev, linear regression, autocorrelation, FFT, KDE, power spectrum, normal quantile. Verified by reading source. HIGH confidence.
- Existing codebase: `src/lib/eda/svg-generators/index.ts` -- 13 generators + 2 composite generators, all verified. HIGH confidence.
- Existing codebase: `src/components/eda/RandomWalkPlots.astro` -- 227 lines, 16 plot types, inline AR(1) model computation. Proven pattern. HIGH confidence.
- Existing codebase: `src/components/eda/BeamDeflectionPlots.astro` -- 217 lines, 13 plot types, inline sinusoidal model computation. Already has residual analysis. HIGH confidence.
- Existing codebase: `package.json` -- 52 production dependencies, 7 dev dependencies. All D3 micro-modules and KaTeX already installed. HIGH confidence.

## Version Compatibility

No new packages means no new compatibility concerns. All existing versions remain unchanged.

| Existing Package | Relevance to Deep Dive |
|------------------|----------------------|
| `d3-scale@^4.0.2` | Used by existing SVG generators; no changes needed |
| `d3-shape@^3.2.0` | Used by existing SVG generators; no changes needed |
| `katex@0.16.33` (peer of rehype-katex) | InlineMath component for test result tables; no changes needed |
| `typescript@^5.9.3` | Type-safe statistical function implementations; no changes needed |

---
*Stack research for: EDA Case Study Deep Dive*
*Researched: 2026-02-26*
