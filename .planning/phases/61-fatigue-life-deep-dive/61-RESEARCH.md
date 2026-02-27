# Phase 61: Fatigue Life Deep Dive - Research

**Researched:** 2026-02-27
**Domain:** MDX content authoring, distribution fitting analysis, probability plots (Weibull/gamma), NIST EDA case study parity
**Confidence:** HIGH

## Summary

Phase 61 enhances the Fatigue Life of Aluminum Alloy Specimens case study to full NIST parity with distribution fitting analysis. A detailed gap analysis of the existing `fatigue-life.mdx` reveals that the case study already has substantial content -- Background and Data, graphical plots (histogram, box plot, normal probability, 4-plot, run sequence, lag, autocorrelation, spectral), summary statistics, model selection (AIC/BIC), and prediction intervals. However, several significant gaps remain that prevent it from meeting the FAT-01 through FAT-04 requirements.

The NIST Fatigue Life case study (Section 1.4.2.9) has a simpler structure than Beam Deflections -- it has only two sub-pages (Background/Data and Graphical Output/Interpretation). NIST combines all graphical and quantitative analysis on a single page. The core analytical theme is **probabilistic model selection**: determining which distribution (Normal, Gamma, Weibull, Birnbaum-Saunders) best describes fatigue life dispersion for reliability prediction. NIST's conclusion is that the Gaussian model wins by AIC/BIC despite visual right-skewness -- a counterintuitive finding that makes this case study pedagogically valuable.

The key engineering gaps are: (1) the current MDX is missing individual named subsections for each of the 7 standard plot types -- the 4-Plot, Run Sequence, and Lag plots exist as named subsections but "Histogram" is embedded under "Initial Plots" rather than as a standalone "### Histogram" subsection, and there is no standalone "### Normal Probability Plot" subsection (it's partially absorbed into "### Normal Probability Plot" with non-standard content); (2) no distribution fitting tests (Anderson-Darling for normality, PPCC) or Test Summary table exist; (3) no Weibull or gamma probability plots with fitted overlays exist (requirement FAT-03) -- the Weibull probability plot generator already exists in `probability-plot.ts` but a gamma probability plot type does NOT exist and must be added; (4) no "## Interpretation" section exists. The existing "### Candidate Distribution Comparison" subsection discusses fitted PDFs but does not include actual probability plots for Weibull/gamma distributions.

**Primary recommendation:** Implement in three plans: (1) restructure the MDX to match the Distribution Focus Variation template with individually named plot subsections and per-plot interpretation for all standard plot types; (2) add gamma probability plot type to `probability-plot.ts`, add `weibull-probability` and `gamma-probability` plot types to `FatigueLifePlots.astro`, create distribution comparison subsections with probability plots and fitted overlays, add quantitative distribution fitting tests and Test Summary table; (3) add the Interpretation section synthesizing graphical and quantitative evidence including distribution selection reasoning.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| FAT-01 | Individual named plot subsections with per-plot interpretation | PARTIALLY COMPLETE: Has 4-Plot Overview, Run Sequence Plot, Lag Plot, Normal Probability Plot, Autocorrelation Plot, Spectral Plot as named subsections with interpretation. GAPS: "### Initial Plots" subsection bundles histogram and box plot instead of having a standalone "### Histogram" subsection. The section structure does not fully match the Distribution Focus Variation template from the canonical case-study-template.md. Need to restructure to standard named subsections. |
| FAT-02 | Quantitative results with distribution fitting tests and test summary table | GAP: Has Summary Statistics and Model Selection (AIC/BIC) tables. MISSING: Location test, variation test, randomness tests (runs test, lag-1 autocorrelation), distribution tests (Anderson-Darling for normality, PPCC normal), outlier test (Grubbs), and Test Summary table. The existing "Model Selection" subsection with AIC/BIC is unique to this case study (Distribution Focus Variation) and should be retained, but the standard quantitative test battery must also be added. |
| FAT-03 | Distribution comparison plots (Weibull, gamma probability plots with fitted overlays) | GAP: No Weibull or gamma probability plots exist. The existing "### Candidate Distribution Comparison" subsection discusses fitted PDF overlays on KDE but does not include actual probability plots. The Weibull probability plot generator already exists in `probability-plot.ts` (type: 'weibull'). A gamma probability plot type does NOT exist and must be added to the generator. Both need to be wired into FatigueLifePlots.astro as new plot types. |
| FAT-04 | Interpretation section synthesizing evidence | GAP: No "## Interpretation" section. MDX goes directly from Prediction Intervals to Conclusions. Need 2-3 paragraph synthesis following the Phase 57 pattern, incorporating distribution selection reasoning (why Gaussian wins despite visual skewness). |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Astro | (project version) | Static site generation, MDX rendering | Already in use; zero-JS build-time SVG rendering |
| TypeScript | (project version) | Build-time statistics, SVG generation | Pure functions in statistics.ts and svg-generators |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| statistics.ts | Phase 56 | Hypothesis test computations | Location test, variation test, randomness tests, distribution tests, outlier test |
| probability-plot.ts | Existing | Probability plot SVG generation (normal, qq, weibull, ppcc, uniform) | Weibull probability plot (existing); gamma probability plot (to add) |
| histogram.ts | Existing | Histogram SVG with optional KDE overlay | Already used for fatigue life histogram |
| distribution-math.ts | Existing | Gamma/Weibull PDF/CDF evaluation | Gamma quantile function needed for gamma probability plot |
| PlotFigure.astro | Phase 56 | Consistent figure rendering | Already used by FatigueLifePlots.astro |
| InlineMath.astro | Existing | LaTeX math rendering | All statistical formulas in MDX content |
| CaseStudyDataset.astro | Existing | Dataset display panel | Already used in Background and Data |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Adding gamma probability plot to probability-plot.ts | Use PPCC plot for gamma shape parameter | PPCC explores shape parameters but a probability plot directly compares sorted data to fitted quantiles -- requirement FAT-03 specifically asks for "probability plots with fitted overlays" |
| Computing gamma quantiles via Newton-Raphson on incomplete gamma | Using a third-party gamma quantile library | The project already has `lowerIncompleteGammaRatio` in distribution-math.ts; a bisection-based inverse is straightforward and avoids new dependencies |

**Installation:**
```bash
# No new packages needed -- all work uses existing project dependencies
```

## Architecture Patterns

### Existing Project Structure (Targeted Changes)
```
src/
├── data/eda/
│   ├── datasets.ts                         # fatigueLife array (101 values) -- NO CHANGES
│   └── pages/case-studies/
│       └── fatigue-life.mdx                # FAT-01 through FAT-04: Major content restructure
├── components/eda/
│   └── FatigueLifePlots.astro              # FAT-03: Add weibull-probability, gamma-probability types
└── lib/eda/
    ├── math/
    │   ├── statistics.ts                   # NO CHANGES -- all needed test functions exist
    │   └── distribution-math.ts            # FAT-03: Add gammaQuantile function (inverse CDF)
    └── svg-generators/
        └── probability-plot.ts             # FAT-03: Add 'gamma' type to generateProbabilityPlot
```

### Pattern 1: Distribution Focus Variation (from case-study-template.md)
**What:** The Fatigue Life case study follows the Distribution Focus Variation of the canonical template, which adds distribution comparison subsections and adjusted distribution tests.
**When to use:** This case study and Uniform Random Numbers.
**Structure:**
```
## Background and Data
## Test Underlying Assumptions
### Goals
## Graphical Output and Interpretation
### 4-Plot Overview
### Run Sequence Plot
### Lag Plot
### Histogram
### Normal Probability Plot
### Autocorrelation Plot
### Spectral Plot
### Distribution Comparison                  <-- Distribution Focus addition
#### Weibull Probability Plot                <-- FAT-03
#### Gamma Probability Plot                  <-- FAT-03
#### Candidate Distribution Overlay          <-- existing content, restructured
## Quantitative Output and Interpretation
### Summary Statistics
### Location Test                            <-- FAT-02: ADD
### Variation Test                           <-- FAT-02: ADD
### Randomness Tests                         <-- FAT-02: ADD
### Distribution Tests                       <-- FAT-02: ADD (A-D normality, PPCC, + AIC/BIC model selection)
### Outlier Detection                        <-- FAT-02: ADD
### Test Summary                             <-- FAT-02: ADD
### Model Selection                          <-- existing, retain and integrate
### Prediction Intervals                     <-- existing, retain
## Interpretation                            <-- FAT-04: ADD
## Conclusions                               <-- existing, update
```

### Pattern 2: Adding a Gamma Probability Plot Type
**What:** Add `type: 'gamma'` to the `ProbabilityPlotOptions` and implement `renderGamma()` in `probability-plot.ts`.
**When to use:** FAT-03 -- gamma probability plot for fatigue life data.
**How it works:**

A gamma probability plot maps sorted data values against theoretical gamma quantiles. For each order statistic Y_(i), the theoretical quantile is computed as:
- Plotting position: `p_i = (i - 0.375) / (n + 0.25)` (Blom's formula, consistent with the existing normal probability plot)
- Theoretical quantile: `Q(p_i) = gammaQuantile(p_i, shape)` where `gammaQuantile` is the inverse of the regularized lower incomplete gamma function

The gamma quantile function requires:
1. The shape parameter (alpha = 11.85 for this dataset, from MLE)
2. The scale parameter (beta = 1/0.00846 = 118.2, since NIST uses rate parameterization)
3. An inverse CDF computation: find x such that `P(a, x/beta) = p` where `P(a, x)` is the regularized lower incomplete gamma

The project already has `lowerIncompleteGammaRatio(a, x)` in `distribution-math.ts`. The inverse can be computed via bisection search.

**Implementation approach:**
```typescript
// In distribution-math.ts -- add exported gammaQuantile function
export function gammaQuantile(p: number, shape: number, scale: number = 1): number {
  // Bisection on lowerIncompleteGammaRatio(shape, x) = p
  // where x = value / scale (standardized)
  let lo = 0;
  let hi = shape * scale * 10; // generous upper bound
  for (let iter = 0; iter < 100; iter++) {
    const mid = (lo + hi) / 2;
    const cdf = lowerIncompleteGammaRatio(shape, mid / scale);
    if (cdf < p) lo = mid;
    else hi = mid;
    if (hi - lo < 1e-10) break;
  }
  return (lo + hi) / 2;
}
```

```typescript
// In probability-plot.ts -- add 'gamma' to type union and renderGamma function
export interface ProbabilityPlotOptions {
  data: number[];
  type?: 'normal' | 'qq' | 'weibull' | 'ppcc' | 'uniform' | 'gamma';
  gammaShape?: number;  // required when type = 'gamma'
  gammaScale?: number;  // required when type = 'gamma'
  config?: Partial<PlotConfig>;
  title?: string;
  xLabel?: string;
  yLabel?: string;
}
```

### Pattern 3: Adding New Plot Types to FatigueLifePlots.astro
**What:** Add `weibull-probability` and `gamma-probability` to the PlotType union and switch statement.
**When to use:** FAT-03 -- distribution comparison probability plots.
**Example:**
```typescript
type PlotType =
  | '4-plot' | 'run-sequence' | 'lag' | 'histogram'
  | 'normal-probability' | 'box-plot'
  | 'autocorrelation' | 'spectral'
  | 'weibull-probability'      // NEW
  | 'gamma-probability';       // NEW

// Switch cases:
case 'weibull-probability':
  svg = generateProbabilityPlot({
    data: fatigueLife,
    type: 'weibull',
    config: singleConfig,
    title: 'Weibull Probability Plot',
    xLabel: 'ln(-ln(1-p))',
    yLabel: 'ln(Fatigue Life)',
  });
  break;

case 'gamma-probability':
  svg = generateProbabilityPlot({
    data: fatigueLife,
    type: 'gamma',
    gammaShape: 11.85,
    gammaScale: 118.2,  // 1/0.00846
    config: singleConfig,
    title: 'Gamma Probability Plot',
  });
  break;
```

### Pattern 4: Standard Quantitative Test Battery (from Phase 57 pattern)
**What:** Apply the standard quantitative test battery used by all case studies.
**When to use:** FAT-02 -- adding missing quantitative tests.
**Tests required (computed in FatigueLifePlots.astro frontmatter or hardcoded in MDX):**

| Test | Function | What it tests |
|------|----------|---------------|
| Location test | `locationTest(fatigueLife)` | Whether mean is drifting over time |
| Variation test (Bartlett k=4) | `bartlettTest(fatigueLife, 4)` | Whether variation is constant |
| Runs test | `runsTest(fatigueLife)` | Whether data are random (runs above/below median) |
| Lag-1 autocorrelation | `autocorrelation(fatigueLife)[1]` | Serial dependence |
| Anderson-Darling (normal) | `andersonDarlingNormal(fatigueLife)` | Whether data follow normal distribution |
| PPCC (normal) | `ppccNormal(fatigueLife)` | Normal distribution fit quality |
| Grubbs test | `grubbsTest(fatigueLife)` | Whether max/min is an outlier |

**Important note on distribution tests for this case study:** Unlike other case studies that only test for normality, the Fatigue Life case study should also include the AIC/BIC model comparison (already present) as the primary distribution selection tool. The Anderson-Darling and PPCC for normality complement rather than replace the model comparison approach.

### Anti-Patterns to Avoid
- **Implementing MLE distribution fitting:** Out of scope per REQUIREMENTS.md. Use hardcoded NIST parameter estimates (Normal: mean=1401, sd=389; Gamma: shape=11.85, rate=0.00846; Weibull: location=181, shape=3.43, scale=1357; BS: shape=0.310, scale=1337).
- **Building a full gamma quantile function from scratch without reusing existing infrastructure:** The project already has `lowerIncompleteGammaRatio` in `distribution-math.ts`. Use it as the basis for the inverse CDF via bisection.
- **Removing existing content:** The existing Model Selection (AIC/BIC) and Prediction Intervals sections are unique to this case study and match NIST. Retain them.
- **Confusing the Fatigue Life case study with Beam Deflections:** This is a Distribution Focus Variation, NOT a Model Development Variation. There is no regression model, no residuals, no "Develop Better Model" section.
- **Making quantitative tests the sole basis for distribution selection:** NIST emphasizes that AIC/BIC is the primary tool for model comparison in this case study. The standard quantitative tests (A-D, PPCC) provide supplementary evidence about the normality assumption.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Weibull probability plot | Custom SVG rendering | `generateProbabilityPlot({ type: 'weibull' })` | Already exists in probability-plot.ts, fully functional |
| Standard hypothesis tests | Custom test implementations | statistics.ts functions (runsTest, leveneTest, etc.) | Phase 56 implemented all needed test functions |
| Gamma/Weibull PDF evaluation | Custom math functions | distribution-math.ts (gammaPdf, weibullPdf, gammaCdf, weibullCdf) | Already implemented for all 19 NIST distributions |
| Distribution parameter estimates | MLE solver | Hardcoded NIST values | Out of scope per REQUIREMENTS.md |
| Cross-reference URLs | Manual URL construction | url-cross-reference.md cheat sheet | Copy-paste prevents broken links |
| Section structure | Ad-hoc headings | case-study-template.md Distribution Focus Variation | Ensures consistency with template |

**Key insight:** This phase is primarily a content restructuring task with one engineering addition (gamma probability plot type). The Weibull probability plot already works. The standard quantitative tests already work. The distribution math already works. The main work is: (1) restructuring the MDX headings to match the canonical template, (2) adding the gamma probability plot to the SVG generator library, (3) wiring both probability plot types into FatigueLifePlots.astro, (4) computing and presenting the standard quantitative test battery, and (5) writing the Interpretation section.

## Common Pitfalls

### Pitfall 1: Gamma Quantile Function Convergence for Extreme Quantiles
**What goes wrong:** The bisection search for `gammaQuantile` may converge slowly or fail for very small or very large p values (e.g., p < 0.01 or p > 0.99) with high shape parameters.
**Why it happens:** The gamma CDF changes very slowly in the tails when shape is large (11.85 in this case).
**How to avoid:** Use a generous initial bracket (hi = shape * scale * 10) and sufficient iterations (100). For shape=11.85, scale=118.2, the domain is approximately [0, 5000]. Pre-check that the CDF evaluates correctly at the bracket endpoints. The plotting positions for n=101 range from p=0.006 to p=0.994, which are moderate enough for bisection to work.
**Warning signs:** Points clustering at 0 or at the upper bracket boundary on the gamma probability plot.

### Pitfall 2: Gamma Parameter Convention Mismatch
**What goes wrong:** NIST reports gamma parameters as shape=11.85 and rate=0.00846. The project's `distribution-math.ts` uses scale parameterization (alpha=shape, beta=scale). The scale is 1/rate = 1/0.00846 = 118.2.
**Why it happens:** Different conventions for parameterizing the gamma distribution (rate vs. scale).
**How to avoid:** Convert rate to scale: beta = 1/rate = 1/0.00846 = 118.2. The `gammaCdf` function in `distribution-math.ts` uses scale parameterization: `gammaCdf(x, {alpha: 11.85, beta: 118.2})`. Verify by checking that `gammaCdf(1401, {alpha: 11.85, beta: 118.2})` is approximately 0.5 (since 1401 is close to the mean = alpha * beta = 11.85 * 118.2 = 1401).
**Warning signs:** Gamma probability plot shows data far from the reference line.

### Pitfall 3: Restructuring MDX While Preserving Existing Content
**What goes wrong:** When reorganizing the MDX headings to match the canonical template, existing interpretation paragraphs get lost or duplicated.
**Why it happens:** The current MDX has non-standard heading structure ("### Initial Plots" bundles histogram and box plot; the 4-Plot is after the Normal Probability Plot instead of first).
**How to avoid:** Map the current content to the canonical template first, then reorganize. The key changes:
- "### Initial Plots" content splits into "### Histogram" (standalone) and "### Box Plot" (optional -- NIST mentions box plot but it's not one of the standard 7 required subsections)
- "### Normal Probability Plot" keeps its content but moves after "### Histogram" in the heading order
- "### 4-Plot Overview" moves to the first position under Graphical Output
- "### Candidate Distribution Comparison" becomes "### Distribution Comparison" with sub-subsections for probability plots
**Warning signs:** Heading count or hierarchy doesn't match template; content paragraphs appear in wrong section.

### Pitfall 4: Not Including the Box Plot in the Standard Subsections
**What goes wrong:** The fatigue life case study uniquely includes a box plot among its graphical techniques. The canonical standard template doesn't include a box plot subsection, but FAT-01 requires "individual named plot subsections with per-plot interpretation."
**Why it happens:** The canonical template lists 7 standard plot types, but the fatigue life NIST page also discusses box plots as part of its initial graphical exploration.
**How to avoid:** Include the box plot as a named subsection between the 4-Plot and Run Sequence Plot, matching the current MDX content. The Distribution Focus Variation template accommodates additional plot types. The 7 standard types plus box plot gives 8 named subsections.
**Warning signs:** Box plot content lost during restructure.

### Pitfall 5: Forgetting InlineMath for Statistical Values
**What goes wrong:** Writing plain text test statistics ("A-squared = 0.41") instead of using InlineMath component.
**Why it happens:** Rushing through content writing.
**How to avoid:** Every statistical value in the MDX must use `<InlineMath tex="..." />`. Check against Normal Random Numbers and Cryothermometry as reference patterns.
**Warning signs:** Numbers in plain text that should be formatted mathematically.

### Pitfall 6: Misinterpreting the NIST Conclusion About Distribution Selection
**What goes wrong:** Writing the Interpretation section as if the skewed distribution is the correct model, when NIST's quantitative analysis shows the Gaussian model wins.
**Why it happens:** Visual impression of right-skewness naturally suggests non-normal distribution.
**How to avoid:** Follow NIST's conclusion: the key pedagogical point is that AIC/BIC favors Normal (76% posterior probability) despite visual skewness. The Interpretation should acknowledge the visual right-skew, note that candidate distributions were tested via probability plots and AIC/BIC, and conclude that the Gaussian model provides the best fit for this specific dataset. The lesson is "don't judge a distribution by its histogram."
**Warning signs:** Interpretation contradicts the AIC/BIC results.

## Code Examples

### Example 1: Gamma Quantile Function via Bisection
```typescript
// Source: Built on existing lowerIncompleteGammaRatio in distribution-math.ts
// Add to distribution-math.ts as an exported function

export function gammaQuantile(p: number, shape: number, scale: number = 1): number {
  if (p <= 0) return 0;
  if (p >= 1) return Infinity;

  // Initial bracket: [0, generous_upper]
  // Mean of Gamma(shape, scale) = shape * scale
  // Use 5x the mean as upper bracket
  let lo = 0;
  let hi = Math.max(shape * scale * 5, 100);

  // Ensure upper bracket is high enough
  while (lowerIncompleteGammaRatio(shape, hi / scale) < p) {
    hi *= 2;
  }

  // Bisection search
  for (let iter = 0; iter < 100; iter++) {
    const mid = (lo + hi) / 2;
    const cdf = lowerIncompleteGammaRatio(shape, mid / scale);
    if (cdf < p) lo = mid;
    else hi = mid;
    if ((hi - lo) / Math.max(1, lo) < 1e-10) break;
  }
  return (lo + hi) / 2;
}
```

### Example 2: Gamma Probability Plot Renderer
```typescript
// Add to probability-plot.ts as a new case and renderer

// In the switch statement:
case 'gamma':
  return renderGamma(data, options, config);

// Renderer function:
function renderGamma(
  data: number[],
  options: ProbabilityPlotOptions,
  config: PlotConfig,
): string {
  const { innerWidth, innerHeight } = innerDimensions(config);
  const { margin } = config;
  const shape = options.gammaShape ?? 2;
  const scale = options.gammaScale ?? 1;

  const sorted = [...data].sort((a, b) => a - b);
  const n = sorted.length;

  // Theoretical quantiles via Blom plotting position
  const theoretical: number[] = [];
  for (let i = 0; i < n; i++) {
    const p = (i + 1 - 0.375) / (n + 0.25);
    theoretical.push(gammaQuantile(p, shape, scale));
  }

  // ... (scales, grid, points, fit line -- same pattern as renderNormalProbability)
  // X-axis: Gamma Theoretical Quantiles
  // Y-axis: Sample Quantiles (Fatigue Life)
  // Best-fit line via linearRegression(theoretical, sorted)
}
```

### Example 3: FatigueLifePlots.astro New Plot Types
```typescript
// Add to PlotType union and switch statement

type PlotType =
  | '4-plot' | 'run-sequence' | 'lag' | 'histogram'
  | 'normal-probability' | 'box-plot'
  | 'autocorrelation' | 'spectral'
  | 'weibull-probability'
  | 'gamma-probability';

case 'weibull-probability':
  svg = generateProbabilityPlot({
    data: fatigueLife,
    type: 'weibull',
    config: singleConfig,
    title: 'Weibull Probability Plot',
    xLabel: 'ln(-ln(1-p))',
    yLabel: 'ln(Fatigue Life)',
  });
  break;

case 'gamma-probability':
  svg = generateProbabilityPlot({
    data: fatigueLife,
    type: 'gamma',
    gammaShape: 11.85,
    gammaScale: 118.2,
    config: singleConfig,
    title: 'Gamma Probability Plot',
  });
  break;

// Default captions:
'weibull-probability': 'Weibull probability plot of fatigue life data. If the Weibull model fits well, points should fall close to a straight line. Deviations indicate the Weibull distribution may not be the best model.',
'gamma-probability': 'Gamma probability plot of fatigue life data with shape=11.85, scale=118.2 (NIST MLE estimates). Points near the reference line indicate a good gamma fit.',
```

### Example 4: Standard Quantitative Test Battery in MDX
```mdx
### Location Test

A linear regression of the fatigue life values against run order tests whether the location is drifting.

| Statistic | Value |
|-----------|-------|
| Slope <InlineMath tex="t" />-statistic | <InlineMath tex="t = ..." /> |
| Critical value <InlineMath tex="t_{0.975, 99}" /> | <InlineMath tex="..." /> |

**Conclusion:** [Fail to reject / Reject] — the location [is / is not] stable over the run.

### Variation Test

[Bartlett's test](/eda/quantitative/bartletts-test/) with <InlineMath tex="k = 4" /> groups tests whether the variation is constant.

| Statistic | Value |
|-----------|-------|
| Bartlett <InlineMath tex="T" /> | <InlineMath tex="..." /> |
| Critical value <InlineMath tex="\chi^2_{0.95, 3}" /> | 7.815 |

### Randomness Tests

**Runs test** — tests whether the sequence of observations above and below the median is random.

| Statistic | Value |
|-----------|-------|
| Runs <InlineMath tex="Z" /> | <InlineMath tex="..." /> |
| Critical value <InlineMath tex="Z_{1-\alpha/2}" /> | 1.96 |

**Lag-1 autocorrelation:**

| Statistic | Value |
|-----------|-------|
| <InlineMath tex="r_1" /> | <InlineMath tex="..." /> |
| Critical value <InlineMath tex="2/\sqrt{N}" /> | <InlineMath tex="0.199" /> |
```

### Example 5: Interpretation Section Pattern (FAT-04)
```mdx
## Interpretation

The graphical analysis of the fatigue life data reveals a right-skewed distribution
with most observations clustering between 800 and 1,600 thousand cycles and a long
upper tail past 2,000. The [run sequence plot](/eda/techniques/run-sequence-plot/)
confirms stable location and variation (supported by the location test with
<InlineMath tex="t = ..." /> and [Bartlett test](/eda/quantitative/bartletts-test/)
with <InlineMath tex="T = ..." />). The [lag plot](/eda/techniques/lag-plot/) and
[autocorrelation plot](/eda/techniques/autocorrelation-plot/) confirm independence.
The three core assumptions — fixed location, fixed variation, and randomness — are
all satisfied, making the distributional question the central analytical challenge.

The distribution comparison via [probability plots](/eda/techniques/probability-plot/)
shows that the [normal](/eda/distributions/normal/),
[Weibull](/eda/distributions/weibull/), and
[gamma](/eda/distributions/gamma/) distributions all provide reasonable fits, with
the normal probability plot showing moderate tail departures. Despite the visual
right-skew in the [histogram](/eda/techniques/histogram/), the AIC/BIC model
comparison decisively favors the Gaussian model (posterior probability 76%) over the
Gamma (16%), Weibull (7.4%), and Birnbaum-Saunders (0.27%) alternatives.

For reliability applications, the key practical output is the 0.1st percentile
estimate of <InlineMath tex="198" /> thousand cycles (the B0.1 life), with a 95%
bootstrap confidence interval of <InlineMath tex="(40, 366)" /> thousand cycles.
The wide interval reflects the substantial uncertainty in estimating extreme
percentiles from 101 observations. This case study illustrates a critical principle:
visual impressions of distributional shape should be confirmed by formal model
selection criteria before choosing an alternative to the normal distribution.
```

## Detailed Gap Analysis

### Current State of fatigue-life.mdx

| Section | Exists? | Template Match | Status | Notes |
|---------|---------|----------------|--------|-------|
| ## Background and Data | Yes | Correct | Complete | NIST reference, CaseStudyDataset component |
| ## Graphical Output and Interpretation | Yes | Correct heading | Complete | |
| ### 4-Plot Overview | Yes | Should be first | Needs reorder | Currently third; should be first under Graphical |
| ### Run Sequence Plot | Yes | Correct | Complete | Per-plot interpretation present |
| ### Lag Plot | Yes | Correct | Complete | Per-plot interpretation present |
| ### Histogram | **Partially** | Non-standard: "### Initial Plots" | Needs restructure | Bundled with box plot under "Initial Plots" |
| ### Box Plot | **Partially** | Not in standard template | Keep as extra | Unique to this case study |
| ### Normal Probability Plot | Yes | Correct | Complete | Has interpretation |
| ### Autocorrelation Plot | Yes | Correct | Complete | Per-plot interpretation |
| ### Spectral Plot | Yes | Correct | Complete | Per-plot interpretation |
| ### Distribution Comparison | Yes | "Candidate Distribution Comparison" | Needs expansion | Has PDF overlay discussion but no Weibull/gamma probability plots |
| #### Weibull Probability Plot | **NO** | Template: distribution plots | **MISSING (FAT-03)** | Weibull plot generator exists; needs wiring |
| #### Gamma Probability Plot | **NO** | Template: distribution plots | **MISSING (FAT-03)** | Gamma plot generator does NOT exist; needs implementation |
| ## Quantitative Output and Interpretation | Yes | Correct heading | Partially complete | |
| ### Summary Statistics | Yes | Correct | Complete | n=101, mean=1401, SD=389 |
| ### Location Test | **NO** | Template: required | **MISSING (FAT-02)** | |
| ### Variation Test | **NO** | Template: required | **MISSING (FAT-02)** | |
| ### Randomness Tests | **NO** | Template: required | **MISSING (FAT-02)** | |
| ### Distribution Tests | **NO** | Template: required | **MISSING (FAT-02)** | A-D, PPCC (normal) |
| ### Outlier Detection | **NO** | Template: required | **MISSING (FAT-02)** | Grubbs test |
| ### Test Summary | **NO** | Template: required | **MISSING (FAT-02)** | Summary table |
| ### Model Selection | Yes | Distribution Focus unique | Complete | AIC/BIC table, posterior probabilities |
| ### Prediction Intervals | Yes | Distribution Focus unique | Complete | Bootstrap CI for 0.1st percentile |
| ## Interpretation | **NO** | Template: required | **MISSING (FAT-04)** | |
| ## Conclusions | Yes | Correct | Needs update | Good content but should reference test results |

### NIST Values to Hardcode

All distribution parameters from NIST MLE (out of scope to compute):

| Distribution | Parameters | Source |
|---|---|---|
| Normal (Gaussian) | mean=1401, sd=389 | NIST Section 1.4.2.9.2 |
| Gamma | shape=11.85, rate=0.00846 (scale=118.2) | NIST Section 1.4.2.9.2 |
| Birnbaum-Saunders | shape=0.310, scale=1337 | NIST Section 1.4.2.9.2 |
| 3-parameter Weibull | location=181, shape=3.43, scale=1357 | NIST Section 1.4.2.9.2 |

Model selection values from NIST:

| Model | AIC | BIC | Posterior Prob |
|---|---|---|---|
| Gaussian | 1495 | 1501 | 76% |
| Gamma | 1499 | 1504 | 16% |
| Weibull | 1498 | 1505 | 7.4% |
| Birnbaum-Saunders | 1507 | 1512 | 0.27% |

### Quantitative Test Values (to compute at build time)

These are NOT published by NIST for this dataset, so they must be computed using the project's statistics.ts functions. The tests will be called in FatigueLifePlots.astro frontmatter and passed to the MDX, or values can be hardcoded after running a one-time computation.

| Test | Expected Behavior | Notes |
|---|---|---|
| Location test | Likely fail to reject | NIST shows stable run sequence |
| Bartlett/Levene (k=4) | Likely fail to reject | NIST shows stable variation |
| Runs test | Likely fail to reject | NIST confirms randomness |
| Lag-1 autocorrelation | Likely within bounds | NIST shows no autocorrelation |
| Anderson-Darling (normal) | May reject | Data are right-skewed |
| PPCC (normal) | PPCC value close to 1 or slightly below | Right-skew may reduce PPCC |
| Grubbs test | May flag max value (2440) | NIST mentions potential outlier at high end |

**Note:** The actual test statistic values will need to be computed once and verified. Since NIST does not publish these for fatigue life, the values are ours to compute and present.

## Recommended Plan Structure

This phase naturally splits into 3 plans:

**Plan 1: Content Restructure and Named Plot Subsections (FAT-01)**
- Restructure the MDX headings to match the Distribution Focus Variation canonical template
- Ensure each of the standard plot types has an individually named subsection with per-plot interpretation
- Reorder: 4-Plot first, then Run Sequence, Lag, Histogram, Box Plot, Normal Probability, Autocorrelation, Spectral
- Preserve all existing interpretation paragraphs during restructure
- Verify `npx astro check` passes after restructure

**Plan 2: Distribution Comparison Plots and Quantitative Tests (FAT-02, FAT-03)**
- Add `gammaQuantile()` function to `distribution-math.ts`
- Add `'gamma'` type with `renderGamma()` to `probability-plot.ts`
- Add `'weibull-probability'` and `'gamma-probability'` types to `FatigueLifePlots.astro`
- Add Weibull Probability Plot and Gamma Probability Plot subsections to "### Distribution Comparison"
- Import statistics.ts functions in FatigueLifePlots.astro to compute quantitative test values
- Add Location Test, Variation Test, Randomness Tests, Distribution Tests, Outlier Detection, and Test Summary subsections
- Verify build passes with `npx astro check`

**Plan 3: Interpretation Section and Final Polish (FAT-04)**
- Add "## Interpretation" section (3 paragraphs following Phase 57 pattern)
- Paragraph 1: Overall assessment -- three core assumptions satisfied, distribution is the analytical focus
- Paragraph 2: Distribution comparison finding -- probability plots + AIC/BIC favors Gaussian despite visual skewness
- Paragraph 3: Practical implications -- B0.1 life estimate, bootstrap CI, lesson about visual vs. formal selection
- Update "## Conclusions" to reference quantitative test results and distribution selection evidence
- Final verification: `npx astro check` and `npx astro build`

**Rationale for 3 plans:** Plan 1 is the structural reorganization (content-only, no engineering). Plan 2 is the engineering + quantitative content hybrid (add gamma probability plot, compute tests, add new subsections). Plan 3 is the synthesis (Interpretation section, Conclusions update). Each has clear verification criteria and builds on the previous.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Non-standard heading structure | Canonical template alignment | Phase 61 (this phase) | Consistency with all other case studies |
| PDF overlay comparison only | Probability plots per candidate distribution | Phase 61 (this phase) | Deeper distributional analysis matching NIST depth |
| No quantitative test battery | Full test suite with Test Summary table | Phase 61 (this phase) | Complete quantitative analysis per canonical template |
| No Interpretation section | Separate Interpretation synthesizing evidence | Phase 57 pattern | Consistent synthesis across all case studies |
| Normal probability plot only | Normal + Weibull + Gamma probability plots | Phase 61 (this phase) | Multi-distribution comparison for Distribution Focus Variation |

## Open Questions

1. **Should the box plot remain as a named subsection?**
   - What we know: The canonical template has 7 standard plot types (4-plot, run sequence, lag, histogram, normal probability, autocorrelation, spectral). The current fatigue life MDX includes a box plot that is not in the standard 7.
   - What's unclear: Whether it should be a standalone named subsection or folded into the 4-Plot Overview discussion.
   - Recommendation: Keep it as a standalone "### Box Plot" subsection between 4-Plot and Run Sequence. It is in the existing MDX with interpretation, and NIST specifically discusses box plots for this dataset. The canonical template accommodates distribution-specific additions for the Distribution Focus Variation.

2. **How to handle the 3-parameter Weibull in the probability plot?**
   - What we know: NIST uses a 3-parameter Weibull (location=181, shape=3.43, scale=1357). The existing `renderWeibull` in probability-plot.ts implements a 2-parameter Weibull probability plot (no location parameter shift).
   - What's unclear: Whether to subtract the location parameter before plotting (shifted data) or modify the renderer to accept a location parameter.
   - Recommendation: Subtract the location parameter from the data before passing to the Weibull probability plot: `data: fatigueLife.map(v => v - 181)`. This is the standard approach for 3-parameter Weibull probability plots -- the location shift converts it to a 2-parameter problem. Document this in the MDX interpretation.

3. **Quantitative test values: compute at build time or hardcode?**
   - What we know: The existing Plots components for other case studies compute test statistics at build time using statistics.ts functions.
   - What's unclear: Whether to import and compute in FatigueLifePlots.astro or to compute once and hardcode values in the MDX.
   - Recommendation: Compute at build time in FatigueLifePlots.astro, consistent with the pattern used by other case studies (e.g., NormalRandomPlots.astro, CryothermometryPlots.astro). Export the computed values via Astro frontmatter for use in the MDX.

4. **Should we include "## Test Underlying Assumptions" and "### Goals" subsections?**
   - What we know: The canonical template includes these. The current fatigue life MDX does not have them -- it goes directly from Background and Data to Graphical Output.
   - What's unclear: Whether this omission was intentional.
   - Recommendation: Add both subsections to match the canonical template. The Goals section should state the three standard objectives (model validation, assumption testing, confidence interval validity) plus the additional distribution selection goal unique to this case study.

## Sources

### Primary (HIGH confidence)
- NIST Section 1.4.2.9: Fatigue Life case study (structure, all sub-sections)
  - 1.4.2.9.1: Background and Data -- dataset description (101 obs, BIRNSAUN.DAT, Birnbaum & Saunders 1958)
  - 1.4.2.9.2: Graphical Output and Interpretation -- ALL content including MLE parameters, AIC/BIC, posterior probabilities, prediction intervals, bootstrap CIs
- Codebase: `probability-plot.ts` -- confirmed Weibull type exists (`renderWeibull`), gamma type does NOT exist
- Codebase: `distribution-math.ts` -- confirmed `lowerIncompleteGammaRatio`, `gammaPdf`, `gammaCdf`, `weibullPdf`, `weibullCdf` all exist
- Codebase: `statistics.ts` -- confirmed all required test functions exist (runsTest, bartlettTest, leveneTest, andersonDarlingNormal, grubbsTest, ppccNormal, locationTest)
- Codebase: `FatigueLifePlots.astro` -- current PlotType union has 8 types, no Weibull/gamma probability types
- Codebase: `datasets.ts` -- `fatigueLife` array confirmed with 101 values
- Phase 56: `case-study-template.md` -- Distribution Focus Variation template structure
- Phase 56: `url-cross-reference.md` -- all technique/quantitative/distribution slugs

### Secondary (MEDIUM confidence)
- NIST Section 1.4.2.9.2 parameter values verified via WebFetch:
  - Normal: mean=1401, sd=389
  - Gamma: shape=11.85, rate=0.00846
  - BS: shape=0.310, scale=1337
  - Weibull (3-param): location=181, shape=3.43, scale=1357
  - AIC/BIC values: GAU(1495/1501), GAM(1499/1504), BS(1507/1512), WEI(1498/1505)
  - Posterior: GAU 76%, GAM 16%, WEI 7.4%, BS 0.27%
  - 0.1st percentile: 198 thousand cycles; 95% bootstrap CI: (40, 366)
- NIST PPCC plot documentation (Section 1.3.3.23): confirms PPCC is appropriate for shape parameter families (Weibull, gamma, etc.)

### Tertiary (LOW confidence)
- Gamma probability plot construction: Based on standard statistical methodology (inverse CDF via bisection on regularized incomplete gamma). No direct NIST documentation found for gamma probability plot implementation details. The approach uses the same Blom plotting positions as the existing normal probability plot.
- Standard quantitative test values for fatigue life data: NOT published by NIST. These will be computed fresh using the project's statistics.ts functions. Values should be verified against a reference statistical package if possible.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all infrastructure verified present in codebase, only gamma probability plot addition needed
- Architecture: HIGH -- canonical template and Distribution Focus Variation directly applicable from case-study-template.md
- Gap analysis: HIGH -- compared current MDX line-by-line against template and requirements
- NIST parameter values: HIGH -- fetched and verified from NIST Section 1.4.2.9.2
- Gamma probability plot implementation: MEDIUM -- standard statistical methodology, but implementation is new (not yet in codebase)
- Quantitative test values: MEDIUM -- test functions exist and are proven, but specific values for fatigue life data not yet computed
- Pitfalls: HIGH -- identified from parameter convention mismatches, content restructuring risks, and NIST interpretive nuances

**Research date:** 2026-02-27
**Valid until:** 2026-03-29 (stable content domain, no technology changes expected)
