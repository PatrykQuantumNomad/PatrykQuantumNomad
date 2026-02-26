# Architecture Patterns

**Domain:** EDA Case Study Deep Dive -- enhancing 8 existing case studies + 1 new case study to match NIST/SEMATECH source depth
**Researched:** 2026-02-26
**Confidence:** HIGH (based on direct codebase analysis of all 9 existing components, 13 SVG generators, statistics library, and MDX content)

## Current Architecture Inventory

### What Exists Today

| Component Type | Count | Location | Pattern |
|---|---|---|---|
| Plot Components | 9 | `src/components/eda/*Plots.astro` | Per-case-study Astro component with `type` prop |
| SVG Generators | 13+2 | `src/lib/eda/svg-generators/*.ts` | Pure functions returning SVG strings |
| Math Functions | 8 | `src/lib/eda/math/statistics.ts` | Pure arithmetic, no DOM/D3 |
| Datasets | 9 case-study + 6 technique | `src/data/eda/datasets.ts` | Named exports of `number[]` or typed arrays |
| Case Study MDX | 9 | `src/data/eda/pages/case-studies/*.mdx` | MDX importing plot component + InlineMath |
| Dynamic Route | 1 | `src/pages/eda/case-studies/[...slug].astro` | Astro content collection rendering |

### Case Study Maturity Matrix

Each case study was assessed against the Random Walk gold standard for completeness.

| Case Study | Plots Component | Has Residuals | Has Model | Quantitative Tests | Enhancement Needed |
|---|---|---|---|---|---|
| **Random Walk** | RandomWalkPlots | Yes (AR(1)) | Yes (AR(1)) | Full (location, variation, runs, autocorrelation) | NONE -- gold standard |
| **Normal Random** | NormalRandomPlots | No | No (not needed) | Full | Minor -- already comprehensive |
| **Uniform Random** | UniformRandomPlots | No | No (not needed) | Full | Minor -- already comprehensive |
| **Beam Deflections** | BeamDeflectionPlots | Yes (sinusoidal) | Yes (sinusoidal) | Full | Moderate -- residual interpretation sparse |
| **Cryothermometry** | CryothermometryPlots | No | No (but NIST discusses "no model needed") | Full | Moderate -- consider discrete-data discussion depth |
| **Filter Transmittance** | FilterTransmittancePlots | No | No (NIST recommends re-run) | Full | Moderate -- root cause section could expand |
| **Heat Flow Meter** | HeatFlowMeterPlots | No | No (not needed) | Partial | Significant -- needs deeper quantitative section |
| **Fatigue Life** | FatigueLifePlots | No | No (distribution focus) | Partial | Significant -- needs distribution comparison plots |
| **Ceramic Strength** | CeramicStrengthPlots | No (batch comparison) | Partial (ANOVA discussed) | Partial | Significant -- needs factor effects plots |

## Recommended Architecture

### Decision 1: Keep Per-Case-Study Components (NOT a Generic Component)

**Recommendation: Keep individual `*Plots.astro` components per case study.**

**Rationale:**

1. **Each case study has unique data transformations.** Random Walk computes AR(1) residuals via `linearRegression`. Beam Deflections computes sinusoidal model residuals via OLS normal equations with `sin`/`cos` basis. Ceramic Strength splits data by batch. These are fundamentally different computations that cannot be genericized without creating a configuration object more complex than the component itself.

2. **Type safety per component.** Each `PlotType` union is specific to its case study. RandomWalkPlots has 16 types including `'residual-uniform-probability'`. NormalRandomPlots has 7 types. CeramicStrengthPlots has 8 types including `'batch-box-plot'`. A generic component would need a superset type that sacrifices compile-time safety.

3. **The existing pattern scales linearly.** Each component is ~100-200 lines of self-contained code. With 9 case studies, that is ~1,800 lines total -- well within maintainability bounds. A generic component would save perhaps 30% of that but add indirection.

4. **Default captions are case-study-specific.** Each component has a `Record<PlotType, string>` of default captions. These are domain-specific descriptions that cannot be generated.

**What CAN be shared (and already is):**
- The `<figure>` wrapper template is identical across all 9 components. Extract to a `PlotFigure.astro` helper:

```astro
<!-- src/components/eda/PlotFigure.astro -->
---
interface Props {
  svg: string;
  caption?: string;
  maxWidth?: string;
}
const { svg, caption, maxWidth = '720px' } = Astro.props;
---
<figure class="my-8 not-prose">
  <div class="overflow-x-auto rounded-lg border border-[var(--color-border)] bg-white dark:bg-[#1a1a2e] p-3">
    <div class="mx-auto" style={`max-width: ${maxWidth}`} set:html={svg} />
  </div>
  {caption && (
    <figcaption class="mt-2 text-center text-sm text-[var(--color-text-secondary)] italic">
      {caption}
    </figcaption>
  )}
</figure>
```

- The `singleConfig` and `compositeConfig` objects are identical across all 9 components. Extract to a shared constant:

```typescript
// src/lib/eda/plot-configs.ts
export const SINGLE_PLOT_CONFIG = {
  width: 720,
  height: 450,
  margin: { top: 35, right: 20, bottom: 45, left: 55 },
};

export const COMPOSITE_PLOT_CONFIG = {
  width: 720,
  height: 540,
};
```

**Estimated savings from extraction:** ~40 lines per component (figure wrapper + config). Not a massive win, but reduces the "copy-paste" surface for bugs.

### Decision 2: SVG Generator Strategy for New Plot Types

**Current generators cover most needs.** The 13 existing generators handle:
- `generateLinePlot` -- run sequence, time series
- `generateLagPlot` -- lag-k scatter
- `generateHistogram` -- with KDE
- `generateProbabilityPlot` -- normal, uniform, Weibull, QQ, PPCC
- `generateAutocorrelationPlot` -- ACF with confidence bands
- `generateSpectralPlot` -- Blackman-Tukey PSD
- `generateScatterPlot` -- bivariate with optional regression
- `generateBoxPlot` -- single/multi-group
- `generate4Plot` / `generate6Plot` -- composite diagnostics
- `generateBarPlot`, `generateStarPlot`, `generateContourPlot`, `generateDistributionCurve` -- technique-level

**New generators potentially needed:**

| Plot Type | Needed By | Existing Generator | New Generator? |
|---|---|---|---|
| Predicted vs. Original scatter | Random Walk, Beam Deflections | `generateScatterPlot` -- already used | No |
| Residual run-sequence | Random Walk, Beam Deflections | `generateLinePlot` -- already used | No |
| Residual lag plot | Random Walk, Beam Deflections | `generateLagPlot` -- already used | No |
| Residual histogram | Random Walk, Beam Deflections | `generateHistogram` -- already used | No |
| Residual probability plot | Random Walk, Beam Deflections | `generateProbabilityPlot` -- already used | No |
| Residual autocorrelation | Random Walk, Beam Deflections | `generateAutocorrelationPlot` -- already used | No |
| Residual spectral | Random Walk | `generateSpectralPlot` -- already used | No |
| Uniform probability plot | Random Walk, Uniform Random | `generateProbabilityPlot({ type: 'uniform' })` -- already supported | No |
| Weibull probability plot | Fatigue Life | `generateProbabilityPlot({ type: 'weibull' })` -- already supported | No |
| Multi-distribution overlay | Fatigue Life | None | **Maybe** |
| DOE main effects / interaction | Ceramic Strength | None | **Maybe** |
| DEX means plot | Ceramic Strength | None | **Maybe** |

**Recommendation:** The existing SVG generator library is sufficient for all standard EDA plot types. Two case-study-specific visualization needs may arise:

1. **Fatigue Life** -- if NIST-depth requires overlaying multiple fitted distributions (normal, Weibull, lognormal) on the same histogram, this could be handled by calling `generateHistogram` with a custom KDE overlay or by extending `generateProbabilityPlot` to accept multiple distribution types for comparison. Assess during implementation -- likely achievable with existing generators plus frontmatter computation.

2. **Ceramic Strength** -- if NIST-depth requires DOE main-effects plots or interaction plots, these are essentially bar charts or line charts that can be built from `generateBarPlot` or `generateLinePlot` with pre-computed factor-level means. No new generator needed.

**Conclusion: No new SVG generators are required.** All case-study-specific plot variants (residuals, predicted-vs-original, batch comparisons) are produced by computing transformed data in the Astro component frontmatter and passing it to existing generators.

### Decision 3: Quantitative Test Results -- Hybrid Approach

**Recommendation: Use a hybrid approach for quantitative results.**

**Rationale:**

1. **The gold standard (Random Walk) already computes in frontmatter.** The AR(1) model coefficients are computed in `RandomWalkPlots.astro` frontmatter via `linearRegression()`. The residuals are computed in real-time from the dataset.

2. **MDX tables cannot call TypeScript functions inline.** Values in Markdown table cells wrapped in `<InlineMath>` are static text. Attempting to inject computed values into MDX table cells would require custom components for every table row.

3. **NIST source values are fixed.** The datasets are verbatim from NIST .DAT files. The test results are deterministic. Hardcoding verified values in MDX tables is acceptable.

**Implementation pattern:**

- **Values that drive visualizations** (regression coefficients, residuals, predicted values) -- computed in the `*Plots.astro` component frontmatter at build time. Already established pattern.
- **Values that appear in MDX prose tables** (test statistics, critical values, conclusions) -- hardcoded in MDX. Acceptable because NIST source values are fixed and well-documented.
- **Optional verification** -- a build-time assertion module could compute expected values from datasets.ts and compare against MDX-stated values. Catches staleness without restructuring the MDX. Implement only if drift becomes a concern.

### Decision 4: Statistical Test Functions -- New hypothesis-tests.ts Module

**Recommendation: Create `src/lib/eda/math/hypothesis-tests.ts` for formal statistical tests. Keep `statistics.ts` for descriptive statistics and core computations.**

**Rationale:**

1. **Separation of concerns.** `statistics.ts` contains descriptive statistics and signal processing (mean, std dev, KDE, ACF, FFT). Hypothesis tests are "compute test statistic + compare to critical value" -- conceptually different.

2. **Current file is ~250 lines and focused.** Adding 7+ test functions would double it.

3. **Some functions stay in statistics.ts.** `linearRegression` is already there and is used for both computation (AR(1) model) and the location test. Keep it.

**New module structure:**

```
src/lib/eda/math/
  statistics.ts          -- descriptive stats, KDE, FFT, ACF, OLS (existing, unchanged)
  hypothesis-tests.ts    -- formal tests (NEW)
```

**Functions needed in `hypothesis-tests.ts`:**

| Function | Used By | Complexity | Notes |
|---|---|---|---|
| `runsTest(data)` | 7/9 case studies | Low | Count runs above/below median, compute Z-statistic |
| `leveneTest(data, k)` | 6/9 case studies | Medium | Median-based variant, F-statistic |
| `bartlettTest(data, k)` | Normal Random | Medium | Chi-squared test for equal variances |
| `locationTest(data)` | All 9 | Low | Linear regression slope t-test (wraps existing `linearRegression`) |
| `andersonDarlingTest(data)` | 4/9 case studies | Medium | Goodness-of-fit test |
| `grubbsTest(data)` | 3/9 case studies | Low | Outlier detection |
| `ppcc(data)` | 3/9 case studies | Medium | Probability plot correlation coefficient |

**Critical values approach:** For this static site where all test parameters are known at build time, hardcode common critical values (e.g., `t_{0.975, 498} = 1.96`) in a lookup table rather than implementing full CDF inversions. The NIST source provides the critical values for each test. A lookup table is simpler and more reliable than implementing incomplete beta function inversions.

**Note:** These functions are primarily useful if we want build-time verification of the MDX-hardcoded values, or if future interactive features need live computation. For the current static MDX tables, they are a "nice to have" rather than a strict dependency.

### Decision 5: Component Boundaries and Data Flow

```
                    datasets.ts
                        |
           +------------+-------------+
           |                          |
    statistics.ts              hypothesis-tests.ts
    (descriptive,               (formal tests)
     regression,                 [NEW]
     ACF, FFT)
           |                          |
           +-------+------------------+
                   |
           *Plots.astro components
           (case-study-specific frontmatter
            computes residuals, predicted
            values, test results)
                   |
           +-------+-------+
           |               |
    SVG generators    PlotFigure.astro
    (generic,         (shared wrapper)
     reusable)          [NEW]
                   |
           case-study MDX pages
           (import *Plots component,
            embed as <XxxPlots type="..." />)
                   |
           [...slug].astro
           (Astro content collection
            dynamic routing)
```

**Key data flow principles:**

1. **Data flows DOWN.** datasets.ts -> statistics/hypothesis-tests -> Plots.astro -> SVG generators. Never upward.
2. **Computation in frontmatter.** All build-time computation happens in Astro component frontmatter (the `---` block). This is server-side TypeScript at build time.
3. **SVG generators are stateless.** They receive data + config, return SVG strings. They never import from datasets.ts directly.
4. **MDX is presentation only.** MDX files contain prose, InlineMath, and component invocations. They do not contain computation logic.

## Patterns to Follow

### Pattern 1: The "Residual Analysis" Extension Pattern

When a case study requires model validation (residual analysis), the pattern established by RandomWalkPlots.astro is:

**What:** Compute the model and residuals in the Astro component frontmatter, then use existing SVG generators with the residuals array.

**When:** Case study where the univariate model fails and a better model is developed (Random Walk, Beam Deflections, potentially others).

**Example (established pattern in RandomWalkPlots.astro):**

```typescript
// In Astro frontmatter:
import { randomWalk } from '../../data/eda/datasets';
import { linearRegression } from '../../lib/eda/math/statistics';

// 1. Compute model
const xLag = randomWalk.slice(0, -1);
const yNext = randomWalk.slice(1);
const reg = linearRegression(xLag, yNext);

// 2. Compute residuals
const predicted = xLag.map((x) => reg.intercept + reg.slope * x);
const residuals = yNext.map((y, i) => y - predicted[i]);

// 3. Pass residuals to EXISTING generators
case 'residual-run-sequence':
  svg = generateLinePlot({ data: residuals, mode: 'run-sequence', ... });
```

**Key insight:** The "residual" variants are not new generator types. They are the same generators called with transformed data. The transformation logic lives in the component, not the generator.

### Pattern 2: The "Multi-Data" Extension Pattern

When a case study requires comparing subsets of the data (e.g., batch comparison in Ceramic Strength):

**What:** Split the dataset in the Astro component frontmatter, then pass subsets to existing generators.

**Example (established pattern in CeramicStrengthPlots.astro):**

```typescript
// In Astro frontmatter:
import { ceramicStrength } from '../../data/eda/datasets';

const strengths = ceramicStrength.map(d => d.strength);
const batch1 = ceramicStrength.filter(d => d.batch === 1).map(d => d.strength);
const batch2 = ceramicStrength.filter(d => d.batch === 2).map(d => d.strength);

case 'batch-box-plot':
  svg = generateBoxPlot({
    groups: [
      { label: 'Batch 1', values: batch1 },
      { label: 'Batch 2', values: batch2 },
    ],
    ...
  });
```

### Pattern 3: Adding New PlotTypes to an Existing Component

When enhancing a case study, new plot types are added by:

1. Extending the `PlotType` union type
2. Adding a new `case` to the `switch` statement
3. Adding a new entry to `defaultCaptions`
4. Adding the corresponding `<XxxPlots type="new-type" />` invocation in the MDX

**No other files need to change.** This is the strength of the per-component architecture.

## Anti-Patterns to Avoid

### Anti-Pattern 1: Generic CaseStudyPlots Component

**What:** A single `CaseStudyPlots.astro` that takes a `caseStudy` prop and dispatches to the right data/computation.

**Why bad:** The component would need to import ALL datasets, implement ALL model computations (AR(1), sinusoidal, batch splitting, distribution fitting), and have a PlotType union of 50+ members. The switch statement would be enormous. TypeScript would lose the ability to verify that a specific MDX file only uses valid plot types for its case study. Changes to one case study would risk regressions in others.

**Instead:** Keep per-case-study components. Share the figure wrapper and config constants.

### Anti-Pattern 2: Computing Test Statistics Inside SVG Generators

**What:** Extending the SVG generators to compute and display test statistics alongside the plot.

**Why bad:** Violates the single-responsibility principle. SVG generators produce visual output. Test statistics are textual results that belong in the MDX prose. Mixing them creates generators that are both visualization and analysis tools, making them harder to test and reuse.

**Instead:** Compute test statistics in the Astro component frontmatter or a dedicated stats module. Display them in MDX tables via hardcoded values verified against computed values.

### Anti-Pattern 3: Putting Model Computation in statistics.ts

**What:** Adding case-study-specific model fitting functions (e.g., `fitAR1Model`, `fitSinusoidalModel`) to the shared statistics.ts.

**Why bad:** These functions are only used by one case study each. They pollute the shared module with single-use code. The computations are already compact enough to live in the component frontmatter (Random Walk AR(1) is 4 lines, Beam Deflections sinusoidal is 15 lines).

**Instead:** Keep model computations in the component frontmatter where they are used. Only general-purpose functions (linearRegression, mean, etc.) belong in statistics.ts.

### Anti-Pattern 4: Dynamic Imports or Lazy Loading for Build-Time Components

**What:** Using dynamic imports or conditional loading to avoid importing all datasets at build time.

**Why bad:** Astro already handles this. Each MDX page imports only its own Plots component, which imports only its own dataset. No bundle-size concern because everything runs at build time. Dynamic imports add complexity without benefit in SSG.

## Integration Points: New vs. Modified

### New Files

| File | Purpose | Depends On |
|---|---|---|
| `src/lib/eda/math/hypothesis-tests.ts` | Formal statistical tests (runs, Levene, Bartlett, Anderson-Darling, Grubbs, PPCC, location) | `statistics.ts` (for `mean`, `standardDeviation`, `linearRegression`, `normalQuantile`) |
| `src/components/eda/PlotFigure.astro` | Shared figure wrapper (optional, reduces duplication) | None |
| `src/lib/eda/plot-configs.ts` | Shared plot dimension constants (optional, reduces duplication) | None |

### Modified Files (Enhancements)

| File | Change | Scope |
|---|---|---|
| `src/components/eda/HeatFlowMeterPlots.astro` | Add deeper quantitative test computation | Extend PlotType, add cases |
| `src/components/eda/FatigueLifePlots.astro` | Add Weibull/lognormal probability plot types | Extend PlotType, add cases |
| `src/components/eda/CeramicStrengthPlots.astro` | Add factor-effects plots, interaction plots, within-batch analysis | Extend PlotType, add cases, more data splitting |
| `src/components/eda/CryothermometryPlots.astro` | Minor -- may add caption updates | Minimal |
| `src/components/eda/FilterTransmittancePlots.astro` | Minor -- possibly add decimated-data analysis | Moderate |
| `src/components/eda/BeamDeflectionPlots.astro` | Deepen residual interpretation, add residual spectral if missing | Moderate -- add captions |
| `src/components/eda/NormalRandomPlots.astro` | Minor -- already comprehensive | Minimal |
| `src/components/eda/UniformRandomPlots.astro` | Minor -- already comprehensive | Minimal |
| `src/data/eda/pages/case-studies/*.mdx` (8 files) | All 8 enhanced MDX files -- deeper prose, quantitative sections, test summaries | Major content work |
| `src/lib/eda/svg-generators/probability-plot.ts` | May need Weibull quantile function refinement for Fatigue Life | Low risk |

### Unchanged Files

| File | Why Unchanged |
|---|---|
| `src/lib/eda/svg-generators/index.ts` | No new generators needed |
| `src/data/eda/datasets.ts` | All 9 datasets already present (new case study would add to it) |
| `src/pages/eda/case-studies/[...slug].astro` | Dynamic routing unchanged |
| `src/components/eda/CaseStudyDataset.astro` | All 9 case studies already mapped |
| `src/lib/eda/svg-generators/*.ts` (all 13 generators) | Used as-is with different data |

## Build Order and Dependencies

### Dependency Graph

```
Layer 0 (no dependencies):
  datasets.ts (already complete)
  plot-configs.ts (new, trivial)

Layer 1 (depends on Layer 0):
  statistics.ts (already complete)
  PlotFigure.astro (new, trivial)

Layer 2 (depends on Layer 1):
  hypothesis-tests.ts (new, depends on statistics.ts)

Layer 3 (depends on Layers 0-2):
  *Plots.astro components (enhanced, depend on datasets + statistics + hypothesis-tests + SVG generators)

Layer 4 (depends on Layer 3):
  *.mdx case study pages (enhanced, import *Plots components)
```

### Recommended Build Order

**Phase 1: Foundation (no external dependencies)**
1. Create `src/lib/eda/plot-configs.ts` -- shared constants
2. Create `src/components/eda/PlotFigure.astro` -- shared figure wrapper
3. Create `src/lib/eda/math/hypothesis-tests.ts` -- formal test functions
4. Write tests for hypothesis-tests.ts against known NIST values

**Phase 2: "Already Deep" Case Studies (minimal new work)**
5. Enhance Normal Random Numbers MDX -- verify completeness against NIST
6. Enhance Uniform Random Numbers MDX -- verify completeness against NIST
7. Verify Random Walk -- already gold standard, no changes expected

**Phase 3: "Has Residuals" Case Studies (moderate new work)**
8. Enhance Beam Deflections -- deepen residual interpretation prose, add quantitative model validation results
9. Refactor existing components to use PlotFigure.astro (optional, can batch)

**Phase 4: "Needs Significant Enhancement" Case Studies**
10. Enhance Cryothermometry -- discrete-data discussion depth
11. Enhance Filter Transmittance -- root cause expansion, possibly decimated analysis
12. Enhance Heat Flow Meter -- deeper quantitative section
13. Enhance Fatigue Life -- distribution comparison plots (Weibull probability)
14. Enhance Ceramic Strength -- factor-effects analysis, batch comparison deepening

**Phase 5: New Case Study (if adding 1 new)**
15. Add dataset to datasets.ts
16. Create new *Plots.astro component
17. Create new MDX case study page
18. Register in CaseStudyDataset.astro

### Why This Order

1. **Foundation first** -- hypothesis-tests.ts is needed by all enhanced case studies. Build and test it once.
2. **Easy wins second** -- Normal Random and Uniform Random are already near-complete. Quick confidence builders that establish the enhanced format.
3. **Incremental complexity** -- Beam Deflections already has residuals, just needs deepening. Fatigue Life and Ceramic Strength need the most new plot types.
4. **New case study last** -- requires all infrastructure to be in place.

## Scalability Considerations

| Concern | At 9 case studies (current) | At 15 case studies | At 25+ case studies |
|---|---|---|---|
| Per-component approach | 9 files, ~1,800 lines total | 15 files, ~3,000 lines | Consider generic component |
| datasets.ts size | ~48,000 tokens (already large) | Split into per-case-study files | Definitely split |
| Build time | Fast (SSG, parallel) | Still fast | Monitor, Astro parallelizes well |
| statistics.ts | 250 lines, focused | Unchanged | Unchanged |
| hypothesis-tests.ts | ~200-300 lines (new) | Same | Same |

**The per-component pattern is correct for 9 case studies.** It would need revisiting at ~20+, but that is outside the scope of this milestone.

## Sources

- Direct codebase analysis of all files listed in the research question
- NIST/SEMATECH e-Handbook of Statistical Methods (https://www.itl.nist.gov/div898/handbook/) -- Section 1.4.2 case study structure
- Astro component architecture: build-time frontmatter computation model
- Existing gold-standard implementation: `RandomWalkPlots.astro` + `random-walk.mdx`
