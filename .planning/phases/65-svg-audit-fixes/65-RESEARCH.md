# Phase 65: SVG Audit & Fixes - Research

**Researched:** 2026-02-27
**Domain:** Visual and statistical correctness audit of 29 build-time SVG generators against NIST/SEMATECH e-Handbook originals, plus data pattern validation
**Confidence:** HIGH

## Summary

Phase 65 audits all 29 graphical technique SVGs for two dimensions of correctness: (1) visual accuracy relative to NIST originals (axes, labels, shapes, scales, gridlines) and (2) statistical data pattern correctness (do the generated datasets produce the correct visual patterns that NIST describes). The infrastructure is mature -- Phase 50 built the SVG generator library and Phase 64 established the rendering pipeline. All 29 techniques render successfully into technique pages via `technique-renderer.ts`, which maps slugs to generator functions. The work is primarily an audit-then-fix cycle: examine each SVG systematically, document issues in a checklist, then fix the identified problems.

A significant architectural finding is that `technique-renderer.ts` contains TWO rendering approaches for certain techniques: (a) dedicated standalone generators exported from `svg-generators/index.ts` (e.g., `generateBihistogram`, `generateBlockPlot`, `generateDoeMeanPlot`, `generateAutocorrelationPlot`, `generateInteractionPlot`) that were added after the initial build, and (b) hand-rolled composition functions inside `technique-renderer.ts` itself (e.g., `composeBihistogram`, `composeBlockPlot`, `composeDoePlots`). The technique-renderer currently uses the composition functions, NOT the dedicated generators. The audit should evaluate whether the dedicated generators produce more NIST-accurate output than the composition fallbacks and switch to them where appropriate.

The 29 techniques break down into three rendering categories: 18 use direct generator calls, 11 use composition from existing generators via `stripSvgWrapper` + `<g transform>`, and 6 Tier B techniques include variant datasets. Each category has different audit concerns. Composition-based techniques are highest risk because they manually wire data and may have hardcoded values that don't match NIST specifications.

**Primary recommendation:** Build a systematic audit checklist as an artifact (markdown table, one row per technique). Check each technique against the NIST source page's described plot characteristics. Prioritize fixing composition-based techniques first (highest defect risk), then verify Tier B variant data patterns, then sweep direct generator calls.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Existing SVG generators | N/A | All 19 generator files in `src/lib/eda/svg-generators/` | Already built in Phase 50, this phase audits and fixes them |
| Existing technique-renderer | N/A | `src/lib/eda/technique-renderer.ts` maps 29 slugs to SVG output | Central mapping that may need rewiring to use dedicated generators |
| Existing datasets | N/A | `src/data/eda/datasets.ts` (500 normalRandom, 500 uniformRandom, timeSeries, scatterData, etc.) | Verbatim NIST .DAT files for case-study data; synthetic data for technique plots |
| Existing math/statistics | N/A | `src/lib/eda/math/statistics.ts` (KDE, regression, FFT, normal quantile, autocorrelation) | Pure math functions used by generators |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Astro dev server | via `npm run dev` | Visual inspection of rendered SVGs in browser | Verifying each fix renders correctly |
| Astro build | via `npm run build` | Full build to confirm no console errors or build failures | Final verification after all fixes |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Manual visual audit | Automated pixel comparison (e.g., Playwright screenshot diffing) | Automated comparison requires reference screenshots of NIST originals. Manual audit is faster for 29 techniques and catches semantic issues (wrong axis label) that pixel diffing misses. |
| Fixing composition functions in technique-renderer.ts | Switching to dedicated generators | Dedicated generators (bihistogram.ts, block-plot.ts, etc.) are purpose-built with proper data structures. Switching to them may be cleaner than patching compositions. Evaluate on a per-technique basis. |

**Installation:**
```bash
# No new dependencies needed. All tools already installed.
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── lib/eda/
│   ├── technique-renderer.ts      # AUDIT TARGET: slug-to-SVG mapping for all 29 techniques
│   ├── svg-generators/
│   │   ├── plot-base.ts           # Shared axes, grid, palette (audit axis labels, tick formatting)
│   │   ├── histogram.ts           # Direct generator (audit bin computation, KDE overlay)
│   │   ├── box-plot.ts            # Direct generator (audit quartile computation, whisker rules)
│   │   ├── scatter-plot.ts        # Direct generator (audit regression line, confidence band)
│   │   ├── line-plot.ts           # Direct generator + autocorrelation mode (audit ACF computation)
│   │   ├── probability-plot.ts    # Direct generator: normal, QQ, weibull, PPCC (audit quantile formulas)
│   │   ├── spectral-plot.ts       # Direct generator (audit FFT, frequency axis units)
│   │   ├── lag-plot.ts            # Direct generator (audit diagonal reference, axis labels)
│   │   ├── star-plot.ts           # Direct generator (audit radar geometry, label placement)
│   │   ├── contour-plot.ts        # Direct generator (audit contour levels, color mapping)
│   │   ├── bar-plot.ts            # Direct generator (audit for mean-plot, std-deviation-plot)
│   │   ├── composite-plot.ts      # 4-plot and 6-plot layouts (audit panel order matches NIST)
│   │   ├── autocorrelation-plot.ts # Dedicated ACF generator (NOT currently used by renderer)
│   │   ├── bihistogram.ts         # Dedicated bihistogram (NOT currently used by renderer)
│   │   ├── block-plot.ts          # Dedicated block plot (NOT currently used by renderer)
│   │   ├── doe-mean-plot.ts       # Dedicated DOE mean plot (NOT currently used by renderer)
│   │   ├── interaction-plot.ts    # Dedicated interaction plot (NOT currently used by renderer)
│   │   └── index.ts              # Barrel export of all generators
│   └── math/
│       └── statistics.ts          # Pure math (audit autocorrelation, FFT, normalQuantile)
└── data/eda/
    └── datasets.ts                # NIST verbatim data + synthetic technique data
```

### Pattern 1: Audit Checklist Methodology
**What:** Systematic per-technique evaluation against NIST source material with pass/fail for each dimension.
**When to use:** Every single technique page.

For each of the 29 techniques, check:

| Dimension | What to Check | NIST Reference |
|-----------|--------------|----------------|
| Axes present | Both X and Y axes rendered with lines and tick marks | Every NIST plot has clearly labeled axes |
| Axis labels correct | Label text matches NIST conventions (e.g., "Lag" not "X", "ACF" not "Y") | Section-specific axis labels |
| Tick formatting | Numeric ticks formatted appropriately (integers for lag, decimals for correlation) | NIST plots use simple numeric formatting |
| Grid lines present | Horizontal and/or vertical grid lines for readability | Most NIST plots include grid lines |
| Title present | Plot title displayed above the chart | NIST convention |
| Shape correct | Visual elements match NIST (bars for histogram, stems for ACF, circles for scatter, etc.) | Section-specific shape requirements |
| Reference lines | Confidence bands, mean lines, zero lines, diagonal reference where NIST shows them | Section-specific reference elements |
| Scale appropriate | Y-axis range reasonable for the data, X-axis domain correct | Data-dependent |
| Data pattern correct | The visual pattern produced by the dataset matches what NIST describes | Statistical correctness |

### Pattern 2: Composition-to-Dedicated Generator Migration
**What:** For techniques where both a composition function and a dedicated generator exist, evaluate if the dedicated generator is more NIST-accurate and switch if so.
**When to use:** bihistogram, block-plot, doe-plots (and potentially autocorrelation-plot).

```typescript
// BEFORE (composition in technique-renderer.ts):
'bihistogram': composeBihistogram,  // Two stacked histograms via generateHistogram

// AFTER (dedicated generator):
'bihistogram': () => generateBihistogram({
  topData: normalRandom,
  bottomData: uniformRandom.map(v => v * 4 - 2),
  topLabel: 'Group A (Normal)',
  bottomLabel: 'Group B (Uniform)',
  title: 'Bihistogram',
  xLabel: 'Value',
}),
```

The dedicated `generateBihistogram` renders a true back-to-back bihistogram (bars growing up and down from a center line), which matches the NIST description more accurately than two separate histograms stacked vertically.

### Pattern 3: Seeded PRNG for Reproducible Variant Data
**What:** Variant datasets for Tier B techniques use `seededRandom()` for reproducible output across builds.
**When to use:** All 6 Tier B variant definitions.

```typescript
function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return s / 2147483647;
  };
}
```

This is already implemented. The audit verifies that each variant's seed produces a statistically meaningful pattern (e.g., the "Autoregressive" lag plot variant with phi=0.9 actually shows strong positive correlation in the lag plot).

### Anti-Patterns to Avoid
- **Fixing symptoms instead of root causes:** If an axis label is wrong, don't just rename it -- check if the underlying data or scale computation is also wrong.
- **Hardcoded pixel positions for reference lines:** The Youden plot's `composeYoudenPlot` hardcodes pixel offsets for median reference lines based on assumed data range `45-90`. These should use the actual scale functions.
- **Skipping variant data validation:** Each Tier B variant must produce a visually distinct, statistically correct pattern. A "bimodal" histogram that doesn't look bimodal is a data pattern bug.
- **Modifying NIST verbatim datasets:** `normalRandom` and `uniformRandom` are verbatim from NIST .DAT files. Never modify these. Fix the generators or synthetic technique-level datasets instead.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Back-to-back bihistogram layout | Manual stacking of two histograms | `generateBihistogram` (dedicated generator) | Handles shared binning, center-line layout, frequency scaling |
| DOE mean plot with grand mean line | Manual bar plot + reference line | `generateDoeMeanPlot` (dedicated generator) | Handles multi-factor panel layout, grand mean reference |
| Block plot with group-connected lines | Manual scatter plot with lines | `generateBlockPlot` (dedicated generator) | Handles block layout, group coloring, legend |
| Autocorrelation with shaded confidence band | Manual line plot with ACF computation | `generateAutocorrelationPlot` (dedicated generator) | Handles stem plot, shaded +-2/sqrt(N) band, lag-0 skip |

**Key insight:** The dedicated generators were built specifically to match NIST visual conventions for their respective techniques. The composition functions in technique-renderer.ts were stopgaps that use generic generators (bar plots for DOE, stacked histograms for bihistogram). Where dedicated generators exist, they should be preferred.

## Common Pitfalls

### Pitfall 1: Autocorrelation Plot Confidence Band Formula
**What goes wrong:** Using +/- 1.96/sqrt(N) vs +/- 2/sqrt(N) for the 95% confidence band.
**Why it happens:** NIST documentation uses the simpler +/- 2/sqrt(N) approximation while the current `line-plot.ts` autocorrelation renderer uses 1.96/sqrt(N). The dedicated `autocorrelation-plot.ts` uses 2/sqrt(N).
**How to avoid:** Use the NIST convention (+/- 2/sqrt(N)) for consistency with the source material. The difference is negligible but the numbers should match.
**Warning signs:** Confidence band appears at slightly different position than expected.

### Pitfall 2: Bihistogram Layout Mismatch
**What goes wrong:** NIST bihistogram is back-to-back (top bars grow UP, bottom bars grow DOWN from a shared center line on a shared x-axis). The current composition function stacks two independent histograms vertically.
**Why it happens:** `composeBihistogram()` in technique-renderer.ts calls `generateHistogram()` twice and stacks them. This produces two separate histograms, not a true bihistogram.
**How to avoid:** Switch to `generateBihistogram()` which implements the correct back-to-back layout.
**Warning signs:** Two histograms with separate Y-axes instead of a shared center-line layout.

### Pitfall 3: Spectral Plot Frequency Axis Units
**What goes wrong:** NIST spectral plots use "cycles per observation" (0 to 0.5) on the x-axis. If the FFT output indices are not properly normalized, the frequency axis shows raw bin indices instead.
**Why it happens:** Raw FFT output needs division by N to convert to cycles/observation.
**How to avoid:** The current `spectral-plot.ts` correctly normalizes: `frequencies.push(i / (2 * (nFreq - 1)))`. Verify this produces values in [0, 0.5] range.
**Warning signs:** X-axis goes to 64 or 128 instead of 0.5.

### Pitfall 4: Youden Plot Hardcoded Reference Lines
**What goes wrong:** The `composeYoudenPlot()` function in technique-renderer.ts computes median reference lines but uses hardcoded pixel math that assumes the data falls in a specific range.
**Why it happens:** The reference lines use formulas like `((1 - (medianY - 45) / 45) * 310 + 40)` which hardcode the coordinate system instead of using the scatter plot's scale functions.
**How to avoid:** Extract the xScale/yScale from the scatter plot generation, or compute reference lines using the actual data extents and margins.
**Warning signs:** Reference lines appear in wrong positions, especially if data range changes.

### Pitfall 5: Box-Cox Plots Using Scatter Plot Instead of Line Plot
**What goes wrong:** NIST Box-Cox linearity and normality plots show a smooth curve of correlation vs lambda. The current implementations use `generateScatterPlot` which renders discrete dots, not a connected line.
**Why it happens:** `composeBoxCoxLinearity()` and `composeBoxCoxNormality()` generate `{x, y}` pairs and pass them to `generateScatterPlot`. NIST shows these as connected line plots.
**How to avoid:** Either use `generateLinePlot` or add `showRegression: false` (already set) and connect the points with a path element. Alternatively, consider generating enough points to make the dots appear continuous.
**Warning signs:** Plot shows discrete dots instead of a smooth curve.

### Pitfall 6: 6-Plot Panel Order vs NIST
**What goes wrong:** NIST 6-plot is specifically a REGRESSION diagnostic (response vs predictor, residuals vs predictor, residuals vs predicted, lag of residuals, histogram of residuals, normal probability of residuals). The current `generate6Plot` treats it as an enhanced 4-plot (adds ACF and spectral).
**Why it happens:** The 6-plot was implemented as a straightforward extension of the 4-plot layout, but NIST Section 1.3.3.33 defines it as regression-specific.
**How to avoid:** Check if the 6-plot content matches NIST's regression diagnostic description. If it should show residual analysis panels, the data needs to come from a regression fit, not just raw time series.
**Warning signs:** 6-plot looks like a 4-plot with two extra panels instead of a regression diagnostic display.

### Pitfall 7: DOE Plots Missing Interaction Plot Panel
**What goes wrong:** NIST DOE plots (Section 1.3.3.11-13) include scatter, mean, and SD panels. The current `composeDoePlots()` renders these correctly as three panels. However, the DOE section on the NIST site also discusses interaction effects.
**Why it happens:** The scope of "DOE plots" varies by interpretation. The dedicated `generateInteractionPlot` exists but isn't wired into the DOE page.
**How to avoid:** Verify that the three-panel layout (scatter, mean, SD) matches what NIST Section 1.3.3.11-13 actually shows. Interaction plots are a separate concept.
**Warning signs:** Content description mentions interactions but the SVG doesn't show them.

## Code Examples

### Audit Checklist Pattern (markdown artifact)
```markdown
| # | Technique | Slug | Renderer Type | Axes | Labels | Grid | Shapes | Ref Lines | Scale | Data Pattern | Status |
|---|-----------|------|---------------|------|--------|------|--------|-----------|-------|-------------|--------|
| 1 | Autocorrelation Plot | autocorrelation-plot | direct | ... | ... | ... | ... | ... | ... | ... | PASS/FAIL |
| 2 | Bihistogram | bihistogram | composition | ... | ... | ... | ... | ... | ... | ... | PASS/FAIL |
...
```

### Switching Composition to Dedicated Generator
```typescript
// technique-renderer.ts — switch bihistogram from composition to dedicated
import { generateBihistogram } from './svg-generators';

// BEFORE:
'bihistogram': composeBihistogram,

// AFTER:
'bihistogram': () => generateBihistogram({
  topData: normalRandom,
  bottomData: uniformRandom.map(v => v * 4 - 2),
  topLabel: 'Group A (Normal)',
  bottomLabel: 'Group B (Uniform)',
  title: 'Bihistogram',
  xLabel: 'Value',
}),
```

### Fixing Youden Plot Reference Lines
```typescript
// BEFORE (hardcoded pixel math):
const refLines =
  `<line ... y1="${((1 - (medianY - 45) / 45) * 310 + 40).toFixed(2)}" ... />` +
  `<line ... x1="${((medianX - 45) / 45 * 520 + 60).toFixed(2)}" ... />`;

// AFTER (use scale functions):
// Need to either expose scale functions from scatter plot or compute inline
const margin = { top: 40, right: 20, bottom: 50, left: 60 };
const innerW = 600 - margin.left - margin.right;
const innerH = 400 - margin.top - margin.bottom;
// Recompute scales with same domain as scatter plot
const xScale = scaleLinear().domain([xMin, xMax]).range([margin.left, margin.left + innerW]).nice();
const yScale = scaleLinear().domain([yMin, yMax]).range([margin.top + innerH, margin.top]).nice();

const refLines =
  `<line x1="${margin.left}" y1="${yScale(medianY).toFixed(2)}" x2="${margin.left + innerW}" y2="${yScale(medianY).toFixed(2)}" ... />` +
  `<line x1="${xScale(medianX).toFixed(2)}" y1="${margin.top}" x2="${xScale(medianX).toFixed(2)}" y2="${margin.top + innerH}" ... />`;
```

## Inventory of All 29 Techniques and Their Rendering Approach

### Direct Generator Calls (18 techniques)
These call a specific generator function with data and options. Lowest risk for visual inaccuracy.

| # | Technique | Slug | Generator | Data Source | Known Concerns |
|---|-----------|------|-----------|-------------|----------------|
| 1 | Histogram | histogram | `generateHistogram` | normalRandom | None identified |
| 2 | Box Plot | box-plot | `generateBoxPlot` | boxPlotData | None identified |
| 3 | Scatter Plot | scatter-plot | `generateScatterPlot` | scatterData | None identified |
| 4 | Run Sequence Plot | run-sequence-plot | `generateLinePlot(mode:'run-sequence')` | timeSeries | None identified |
| 5 | Lag Plot | lag-plot | `generateLagPlot` | timeSeries | Verify Y(i) vs Y(i+1) axis labels match NIST |
| 6 | Autocorrelation Plot | autocorrelation-plot | `generateLinePlot(mode:'autocorrelation')` | timeSeries | Uses 1.96/sqrt(N) vs NIST's 2/sqrt(N); dedicated generator exists but unused |
| 7 | 4-Plot | 4-plot | `generate4Plot` | timeSeries | Verify panel order matches NIST |
| 8 | 6-Plot | 6-plot | `generate6Plot` | timeSeries | NIST 6-plot is regression-specific, current is time-series |
| 9 | Normal Probability Plot | normal-probability-plot | `generateProbabilityPlot(type:'normal')` | normalRandom | None identified |
| 10 | Probability Plot | probability-plot | `generateProbabilityPlot(type:'normal')` | normalRandom | Same as normal prob plot -- should it be general? |
| 11 | Q-Q Plot | qq-plot | `generateProbabilityPlot(type:'qq')` | normalRandom | None identified |
| 12 | Spectral Plot | spectral-plot | `generateSpectralPlot` | timeSeries | Verify frequency axis 0-0.5 cycles/observation |
| 13 | Contour Plot | contour-plot | `generateContourPlot` | responseSurface | None identified |
| 14 | Star Plot | star-plot | `generateStarPlot` | hardcoded 5-axis data | Should use realistic data |
| 15 | Weibull Plot | weibull-plot | `generateProbabilityPlot(type:'weibull')` | exp(normalRandom) | Verify Weibull plotting position formula |
| 16 | PPCC Plot | ppcc-plot | `generateProbabilityPlot(type:'ppcc')` | normalRandom | None identified |
| 17 | Mean Plot | mean-plot | `generateBarPlot` | hardcoded DOE means | NIST mean plot is connected dots, not bars |
| 18 | Std Deviation Plot | std-deviation-plot | `generateBarPlot` | hardcoded DOE SDs | NIST SD plot is connected dots, not bars |

### Composition-Based (11 techniques)
These use `stripSvgWrapper` to compose sub-plots into larger layouts, or hand-wire data. Highest risk.

| # | Technique | Slug | Composition | Dedicated Generator Available? | Known Concerns |
|---|-----------|------|-------------|-------------------------------|----------------|
| 19 | Bihistogram | bihistogram | `composeBihistogram` | YES: `generateBihistogram` | Stacked histograms vs NIST back-to-back |
| 20 | Block Plot | block-plot | `composeBlockPlot` | YES: `generateBlockPlot` | Uses bar plot, NIST block plot shows connected group means |
| 21 | Bootstrap Plot | bootstrap-plot | `composeBootstrapPlot` | No | Histogram of resampled means; seems reasonable |
| 22 | Box-Cox Linearity | box-cox-linearity | `composeBoxCoxLinearity` | No | Scatter plot instead of line plot for correlation vs lambda |
| 23 | Box-Cox Normality | box-cox-normality | `composeBoxCoxNormality` | No | Scatter plot instead of line plot for normality vs lambda |
| 24 | Complex Demodulation | complex-demodulation | `composeComplexDemodulation` | No | Two-panel stacked line plots; verify amplitude/phase computations |
| 25 | Youden Plot | youden-plot | `composeYoudenPlot` | No | Hardcoded reference line positions |
| 26 | Linear Plots | linear-plots | `composeLinearPlots` | No | 4-panel composition; verify panel content matches NIST 1.3.3.16-19 |
| 27 | DOE Plots | doe-plots | `composeDoePlots` | YES: `generateDoeMeanPlot` | Uses bar plots, NIST uses connected dot mean/SD plots |
| 28 | Scatterplot Matrix | scatterplot-matrix | `composeScatterplotMatrix` | No | 4x4 grid composition; verify diagonal=histograms, off-diagonal=scatter |
| 29 | Conditioning Plot | conditioning-plot | `composeConditioningPlot` | No | 6-panel grid; verify data sourced from conditioningData |

### Tier B Variants (6 techniques with variant datasets)
| Technique | Slug | Variant Count | Data Pattern Concerns |
|-----------|------|--------------|----------------------|
| Histogram | histogram | 8 | Verify bimodal, skewed, heavy-tailed patterns visually distinct |
| Scatter Plot | scatter-plot | 12 | Verify quadratic, clustered, heteroscedastic patterns correct |
| Normal Prob Plot | normal-probability-plot | 4 | Verify right-skewed, heavy-tailed deviations show on plot |
| Lag Plot | lag-plot | 4 | Verify AR(1), seasonal, trend patterns show correct structure |
| Autocorrelation Plot | autocorrelation-plot | 4 | Verify AR(1), MA(1), seasonal ACF decay patterns |
| Spectral Plot | spectral-plot | 3 | Verify single/multiple frequency peaks and white noise flat spectrum |

## Identified Issues Pre-Audit (from code review)

### HIGH Priority (likely visual mismatch with NIST)

1. **Bihistogram uses stacked histograms, not back-to-back layout** (composeBihistogram)
   - NIST: back-to-back with shared x-axis, top bars UP, bottom bars DOWN
   - Current: two independent histograms stacked vertically
   - Fix: switch to `generateBihistogram` dedicated generator

2. **Mean Plot and SD Plot use bar charts instead of connected dot plots** (mean-plot, std-deviation-plot)
   - NIST mean plot (1.3.3.20): dots connected by lines with a grand mean reference line
   - NIST SD plot (1.3.3.28): dots connected by lines with an overall SD reference line
   - Current: bar chart via `generateBarPlot`
   - Fix: switch to `generateDoeMeanPlot` or create a line-based mean plot

3. **Block Plot uses bar chart instead of connected group means** (block-plot)
   - NIST block plot (1.3.3.3): connected dots by group across blocks
   - Current: bar chart via `composeBlockPlot` -> `generateBarPlot`
   - Fix: switch to `generateBlockPlot` dedicated generator

4. **6-Plot is not a regression diagnostic** (6-plot)
   - NIST 6-plot (1.3.3.33): 6 panels of REGRESSION diagnostics (response vs predictor, residuals vs predictor, residuals vs predicted, lag of residuals, histogram of residuals, normal prob of residuals)
   - Current: extended 4-plot with ACF and spectral panels on raw time series
   - Fix: restructure to use regression data (requires scatter data with fitted model)

5. **DOE Plots use bar charts instead of NIST-style DOE mean/SD plots** (doe-plots)
   - NIST DOE plots (1.3.3.11-13): DOE scatter, mean plot (connected dots per factor), SD plot (connected dots per factor)
   - Current: bar charts in 3-panel layout
   - Fix: switch DOE mean/SD panels to `generateDoeMeanPlot`-style connected dot layout

### MEDIUM Priority (minor visual differences)

6. **Autocorrelation uses 1.96/sqrt(N) instead of 2/sqrt(N)** (autocorrelation-plot)
   - NIST uses the simpler 2/sqrt(N) approximation
   - Fix: change constant from 1.96 to 2 in line-plot.ts autocorrelation renderer

7. **Box-Cox Linearity and Normality plots show dots instead of connected line** (box-cox-linearity, box-cox-normality)
   - NIST shows a smooth curve of correlation coefficient vs lambda
   - Current: scatter plot of discrete (lambda, correlation) points
   - Fix: use a line generator to connect the points

8. **Youden Plot has hardcoded reference line pixel positions** (youden-plot)
   - Reference lines assume data in ~45-90 range
   - Fix: use scale functions from the actual data domain

9. **Probability Plot and Normal Probability Plot are identical** (probability-plot vs normal-probability-plot)
   - Both render `type:'normal'`. NIST Probability Plot (1.3.3.22) is general (any distribution), not just normal.
   - Fix: probability-plot should demonstrate the general case or use a different distribution

### LOW Priority (cosmetic or marginal)

10. **Star Plot uses hardcoded example data** (star-plot)
    - Current data is arbitrary (Location=8, Scale=6, etc.)
    - Fix: use data that demonstrates a meaningful multivariate profile

11. **Scatterplot Matrix variable names are generic** (scatterplot-matrix)
    - Current: X1, X2, X3, X4 (all derived from normalRandom)
    - Fix: use more distinct variable relationships to show the matrix's diagnostic power

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| All composition-based rendering | Dedicated generators for complex techniques | Phase 50 -> later additions | 5 dedicated generators (bihistogram, block-plot, doe-mean-plot, autocorrelation-plot, interaction-plot) exist but aren't wired into technique-renderer.ts |
| Generic plots for all techniques | NIST-specific plot types | This phase | Mean/SD/block plots should use connected-dot style, not bar charts |
| Stopgap compositions | Purpose-built generators | This phase | Switching from composition to dedicated generators improves accuracy |

**Deprecated/outdated:**
- The 11 composition functions in `technique-renderer.ts` are partial implementations that should be evaluated for replacement by dedicated generators where available.

## Open Questions

1. **6-Plot Regression Data Source**
   - What we know: NIST 6-plot is specifically for regression diagnostics. Current implementation uses raw time series.
   - What's unclear: Should the 6-plot page use `scatterData` with a linear fit to compute residuals, or is the current time-series approach acceptable as a simplification?
   - Recommendation: Use scatterData with linear regression to produce the NIST-accurate 6-panel regression diagnostic layout.

2. **Probability Plot vs Normal Probability Plot Differentiation**
   - What we know: Both currently render identical normal probability plots.
   - What's unclear: Should the general Probability Plot page demonstrate a non-normal distribution fit?
   - Recommendation: Keep normal for Normal Prob Plot. For Probability Plot, demonstrate with a different distribution (e.g., exponential or uniform) to show the general-purpose nature of the technique.

3. **DOE Scatter Panel Data**
   - What we know: The current DOE scatter panel uses hardcoded response values `[72.3, 84.7, 78.1, 91.5, 68.9, 80.2, 74.6, 87.3]` not from datasets.ts.
   - What's unclear: Whether to replace with data derived from `doeFactors` in datasets.ts.
   - Recommendation: Derive from `doeFactors` for consistency and traceability to NIST source.

4. **Layout Shift Verification**
   - What we know: Success criteria 4 requires "no layout shifts" on technique pages.
   - What's unclear: How to systematically verify layout shifts across 29 pages.
   - Recommendation: Run Astro build, spot-check 5-6 representative pages in browser. SVGs use `viewBox` with `width:100%;height:auto` which prevents layout shifts by design (the SVG container has a fixed aspect ratio).

## Sources

### Primary (HIGH confidence)
- Existing codebase: All 19 SVG generator files in `src/lib/eda/svg-generators/` -- read and analyzed
- Existing codebase: `src/lib/eda/technique-renderer.ts` -- all 29 technique mappings documented
- Existing codebase: `src/data/eda/techniques.json` -- all 29 graphical techniques with metadata
- Existing codebase: `src/pages/eda/techniques/[slug].astro` -- rendering pipeline verified
- NIST e-Handbook: [Section 1.3.3 Graphical Techniques](https://www.itl.nist.gov/div898/handbook/eda/section3/eda33.htm) -- all 33 technique pages listed (29 mapped to our techniques)
- NIST e-Handbook: [Autocorrelation Plot](https://www.itl.nist.gov/div898/handbook/eda/section3/autocopl.htm) -- axis labels, confidence bands verified
- NIST e-Handbook: [Histogram](https://www.itl.nist.gov/div898/handbook/eda/section3/histogra.htm) -- visual characteristics verified
- NIST e-Handbook: [Spectral Plot](https://www.itl.nist.gov/div898/handbook/eda/section3/spectrum.htm) -- frequency axis "cycles per observation" 0-0.5 verified
- NIST e-Handbook: [Bihistogram](https://www.itl.nist.gov/div898/handbook/eda/section3/bihistog.htm) -- back-to-back layout "above/below axis" verified
- NIST e-Handbook: [Box Plot](https://www.itl.nist.gov/div898/handbook/eda/section3/boxplot.htm) -- elements (median, Q1, Q3, whiskers, outliers) verified

### Secondary (MEDIUM confidence)
- Phase 50 Research (`50-RESEARCH.md`) -- architecture decisions, D3 micro-module approach, CSS variable strategy
- Phase 64 Verification (`64-VERIFICATION.md`) -- confirms technique page rendering pipeline is complete

### Tertiary (LOW confidence)
- 6-plot panel order interpretation -- NIST Section 1.3.3.33 describes regression diagnostics but the exact panel arrangement may vary in implementation

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- no new libraries needed, all tools already in place
- Architecture: HIGH -- existing codebase thoroughly analyzed, all 29 techniques mapped, dedicated vs composition gap identified
- Pitfalls: HIGH -- 11 specific issues identified from code review against NIST documentation, each with clear fix path
- Audit methodology: HIGH -- systematic checklist approach with per-dimension evaluation

**Research date:** 2026-02-27
**Valid until:** 2026-03-27 (NIST handbook content is stable; this is implementation audit guidance)
