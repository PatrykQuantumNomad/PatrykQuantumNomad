# Phase 58: Standard Resistor Case Study - Research

**Researched:** 2026-02-26
**Domain:** NIST EDA case study authoring, datasets.ts population, Astro build-time SVG plot generation
**Confidence:** HIGH

## Summary

Phase 58 builds a complete new case study for NIST Section 1.4.2.7 (Standard Resistor) from scratch. Unlike Phase 57, which enhanced four existing case studies, this phase requires creating all four deliverables: the dataset array in `datasets.ts`, a `StandardResistorPlots.astro` component, a full MDX page, and navigation/cross-reference registration.

The Standard Resistor case study is significant because it illustrates a measurement process that **violates both the fixed-location and randomness assumptions** -- the resistor values drift upward over the 5-year measurement period (1980-1985) and exhibit extreme lag-1 autocorrelation of 0.97. The root cause was seasonal humidity effects on measurement equipment. This makes it structurally similar to the Filter Transmittance case study (also assumption-violating), but with a much larger dataset (n=1000 vs n=50) and a drift-over-years rather than drift-over-seconds mechanism.

All required SVG generators already exist in the codebase (run sequence, lag, histogram, probability, autocorrelation, spectral, 4-plot composite). The DZIUBA1.DAT dataset contains 1000 observations of resistor values ranging from approximately 27.828 to 28.115 ohms, measured over 5 years. The dataset format is single-column numeric (only the response variable is needed, not the date columns), matching the established `number[]` pattern used by 7 of the 9 existing case studies.

**Primary recommendation:** Follow the Filter Transmittance case study as the structural template (assumption-violating study with Interpretation section), use the FatigueLifePlots.astro component as the code template (single-column dataset with all 6 plot types), and populate the dataset from the NIST DZIUBA1.DAT source file.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| RSTR-01 | Dataset entry added to datasets.ts with NIST DZIUBA1.DAT data (1000 observations) | CLEAR: Add `standardResistor: number[]` array with 1000 values to datasets.ts, plus DATASET_SOURCES entry. Values are 4-decimal-place resistor measurements (27.8280 to 28.1146). Follow existing single-column pattern (like `fatigueLife`, `cryothermometry`). |
| RSTR-02 | StandardResistorPlots.astro component created with all required plot types | CLEAR: Create component following FatigueLifePlots.astro pattern. Required types: 4-plot, run-sequence, lag, histogram, probability, autocorrelation, spectral. All generators exist in svg-generators/index.ts. |
| RSTR-03 | Full MDX page with Background and Data, individual named plot subsections, quantitative results, interpretation, and conclusions | CLEAR: Create `src/data/eda/pages/case-studies/standard-resistor.mdx`. Follow Filter Transmittance MDX as structural template (assumption-violating study). Include explicit Interpretation section between quantitative results and conclusions. |
| RSTR-04 | Registered in case study navigation and cross-referenced from technique pages | CLEAR: Add entry to CaseStudyDataset.astro CASE_STUDY_MAP. No changes needed to navigation infrastructure -- the Astro content collection auto-discovers MDX files. Cross-references are inline markdown links within the MDX content. |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Astro | (project version) | Static site generation, MDX rendering | Already in use; zero-JS build-time rendering |
| TypeScript | (project version) | Build-time statistics computation in Plots components | Pure functions in statistics.ts |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| svg-generators/index.ts | Phase 50/56 | All 13 SVG generators including composite-plot | All plot rendering |
| PlotFigure.astro | Phase 56 | Consistent figure wrapper | All plot output |
| InlineMath.astro | Existing | KaTeX math rendering | All statistical formulas and test values |
| CaseStudyDataset.astro | Existing | Dataset access panel with preview and CSV download | Background and Data section |
| math/statistics.ts | Phase 56 | Pure math: mean, stddev, linearRegression, kde | Any computed values in MDX or Plots component |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Single `number[]` array | Object array with date columns | The date columns (month/day/year) are not used in the plots -- NIST uses sequential index. Single-column matches existing pattern for 7 of 9 case studies. |
| 4-plot composite | 6-plot composite (generate6Plot) | 6-plot exists and would show all 6 diagnostics at once, but the canonical NIST page uses a 4-plot. Individual separate plots are rendered for autocorrelation and spectral. Stick with 4-plot + individual. |

**Installation:**
```bash
# No new packages needed -- all work uses existing project dependencies
```

## Architecture Patterns

### Project Structure (Files to Create/Modify)
```
src/
├── data/eda/
│   ├── datasets.ts                          # MODIFY: add standardResistor[] + DATASET_SOURCES entry
│   └── pages/case-studies/
│       └── standard-resistor.mdx            # CREATE: full case study MDX
├── components/eda/
│   ├── StandardResistorPlots.astro          # CREATE: plot generator component
│   └── CaseStudyDataset.astro              # MODIFY: add 'standard-resistor' to CASE_STUDY_MAP
```

### Pattern 1: Single-Column Dataset Export (Verified from codebase)
**What:** Export a named `number[]` array for the case study data, plus a DATASET_SOURCES metadata entry.
**When to use:** All univariate case studies (7 of 9 existing ones follow this).
**Example:**
```typescript
// Source: src/data/eda/datasets.ts (existing pattern from fatigueLife)
// ---------------------------------------------------------------------------
// N. Standard Resistor — NIST DZIUBA1.DAT (verbatim, n=1000)
//    Source: Ron Dziuba, NIST, 1980-1985
//    Standard resistor measurements over 5 years
//    Case Study: Section 1.4.2.7
//    @see https://www.itl.nist.gov/div898/handbook/datasets/DZIUBA1.DAT
// ---------------------------------------------------------------------------
export const standardResistor: number[] = [
  27.8680, 27.8929, 27.8773, ... // 1000 values, 10 per line
];
```

### Pattern 2: Plots Component (Verified from FatigueLifePlots.astro)
**What:** An Astro component that imports the dataset and SVG generators, switches on `type` prop.
**When to use:** Each case study gets its own Plots component.
**Example:**
```typescript
// Source: src/components/eda/FatigueLifePlots.astro (verified pattern)
import PlotFigure from './PlotFigure.astro';
import { standardResistor } from '../../data/eda/datasets';
import { generate4Plot, generateLinePlot, generateLagPlot, ... } from '../../lib/eda/svg-generators/index';

type PlotType = '4-plot' | 'run-sequence' | 'lag' | 'histogram' | 'probability' | 'autocorrelation' | 'spectral';
// ... switch(type) with per-type SVG generation
// ... defaultCaptions record
```

### Pattern 3: MDX Frontmatter (Verified from existing case studies)
**What:** The MDX file uses the `edaPages` content collection schema: title, description, section, category, nistSection.
**When to use:** Every case study MDX file.
**Example:**
```yaml
---
title: "Standard Resistor Case Study"
description: "EDA case study analyzing NIST standard resistor data to demonstrate detection of drift in location and non-randomness caused by seasonal humidity effects on measurement equipment"
section: "1.4.2"
category: "case-studies"
nistSection: "1.4.2.7 Standard Resistor"
---
```

### Pattern 4: CaseStudyDataset Registration (Verified from CaseStudyDataset.astro)
**What:** Add a slug-to-dataset mapping in the CASE_STUDY_MAP object.
**When to use:** Every case study that wants the dataset access panel.
**Example:**
```typescript
// Source: src/components/eda/CaseStudyDataset.astro (verified pattern)
'standard-resistor': {
  kind: 'single',
  key: 'standardResistor',
  values: standardResistor,
  responseVariable: 'Resistance (ohms)',
},
```

### Anti-Patterns to Avoid
- **Including date columns in the dataset array:** The existing pattern uses only the response variable as a flat `number[]`. The run order index (1..n) is implicit. Date columns would require changing the `SingleColumnDataset` type or introducing a new dataset kind.
- **Using `generate6Plot` instead of `generate4Plot` + separate plots:** Every existing case study uses the 4-plot composite plus individual named plots. Using 6-plot would break the visual pattern.
- **Omitting the `## Interpretation` section:** Phase 57 identified this as a consistent gap. The Phase 58 MDX should include it from the start (between quantitative results and conclusions).
- **Computing statistics inline in MDX:** All computed values should be hardcoded literals in the MDX content after verifying against NIST source. The Plots component handles SVG generation; the MDX handles prose with known values.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| SVG plot rendering | Custom SVG strings | `generate4Plot`, `generateLinePlot`, `generateLagPlot`, `generateHistogram`, `generateProbabilityPlot`, `generateAutocorrelationPlot`, `generateSpectralPlot` | All 7 generators exist, are tested, and produce consistent styling |
| KaTeX math | HTML math rendering | `InlineMath` component with `tex` prop | Already handles all LaTeX rendering at build time |
| Dataset panel UI | Custom HTML | `CaseStudyDataset` component with slug prop | Handles preview table, CSV download, NIST source link |
| Figure wrapper | Custom figure HTML | `PlotFigure` component | Consistent border, padding, caption styling |
| Statistics | Custom mean/stddev | `math/statistics.ts` functions | If any build-time computation is needed in Plots component |

**Key insight:** This is primarily a content authoring task with a data population prerequisite. All infrastructure (generators, components, collection routing) exists. The engineering work is (1) transcribing 1000 data values and (2) creating a Plots component that wires up existing generators. The bulk of the effort is authoring the MDX prose with NIST-verified statistics.

## Common Pitfalls

### Pitfall 1: Dataset Array Length Mismatch
**What goes wrong:** The transcribed array has fewer or more than exactly 1000 values, causing the case study to report incorrect `n`.
**Why it happens:** Manual transcription errors, copy-paste mistakes, or misaligned line breaks when formatting 1000 numbers.
**How to avoid:** After populating the array, add a verification step: `standardResistor.length === 1000`. The success criteria explicitly require this check. Use a programmatic approach to extract the values from DZIUBA1.DAT rather than manual transcription.
**Warning signs:** Build succeeds but summary statistics don't match NIST (n, mean, stddev).

### Pitfall 2: Incorrect NIST Statistics
**What goes wrong:** The hardcoded mean, std dev, or test statistics in the MDX don't match NIST values.
**Why it happens:** Computing statistics from a slightly different dataset, rounding differently, or using the wrong formula (population vs sample std dev).
**How to avoid:** Cross-reference all statistics against the NIST quantitative output page (eda4273.htm). Known NIST values: mean=28.01634, std dev=0.06349, min=27.82800, max=28.11850, n=1000. The lag-1 autocorrelation is 0.97 and the slope t-value is 100.2.
**Warning signs:** Any summary statistic that differs from NIST values by more than rounding precision.

### Pitfall 3: Missing Import in CaseStudyDataset.astro
**What goes wrong:** The `standardResistor` export is added to datasets.ts but not imported in CaseStudyDataset.astro, causing a build error.
**Why it happens:** CaseStudyDataset.astro has explicit named imports from datasets.ts (not a wildcard import).
**How to avoid:** Add `standardResistor` to the import statement at the top of CaseStudyDataset.astro alongside the existing imports.
**Warning signs:** Astro build fails with "standardResistor is not defined" in CaseStudyDataset.astro.

### Pitfall 4: Forgetting DATASET_SOURCES Entry
**What goes wrong:** The dataset array is added but no DATASET_SOURCES metadata entry, so the CaseStudyDataset panel shows no source info.
**Why it happens:** Focus on data values, forgetting the metadata object.
**How to avoid:** Always add both the array export AND the DATASET_SOURCES entry in the same task.
**Warning signs:** CaseStudyDataset panel renders but shows no NIST URL or description.

### Pitfall 5: Non-Standard Section Headings
**What goes wrong:** Using headings like "### Fixed Location -- Run Sequence Plot" instead of the canonical "### Run Sequence Plot".
**Why it happens:** Phase 57 identified this pattern in the pre-57 Filter Transmittance study. Easy to introduce when writing from scratch.
**How to avoid:** Use the canonical heading structure from the enhanced Phase 57 case studies: `## Background and Data`, `## Graphical Output and Interpretation` (with `### 4-Plot Overview`, `### Run Sequence Plot`, `### Lag Plot`, `### Histogram`, `### Normal Probability Plot`, `### Autocorrelation Plot`, `### Spectral Plot`), `## Quantitative Output and Interpretation`, `## Interpretation`, `## Conclusions`.
**Warning signs:** Heading structure doesn't match other case studies.

### Pitfall 6: Omitting Interpretation of Non-Meaningful Tests
**What goes wrong:** Including distribution and outlier test results even though randomness is severely violated (making those tests meaningless).
**Why it happens:** Mechanical application of the full test battery without considering assumptions.
**How to avoid:** Follow the NIST guidance: when randomness is severely violated, distribution and outlier tests are omitted with explicit rationale. Filter Transmittance case study demonstrates this pattern.
**Warning signs:** Including normal probability plot interpretation or Grubbs' test results despite r1=0.97.

## Code Examples

Verified patterns from the existing codebase:

### Dataset Array Export Pattern
```typescript
// Source: src/data/eda/datasets.ts, line 563 (fatigueLife)
export const fatigueLife: number[] = [
  370, 706, 716, 746, 785, 797, 844, 855, 858, 886,
  // ... 10 per line, total 101 values
];
```

### DATASET_SOURCES Entry Pattern
```typescript
// Source: src/data/eda/datasets.ts, line 1175 (fatigueLife)
fatigueLife: {
  name: 'BIRNSAUN.DAT',
  nistUrl: 'https://www.itl.nist.gov/div898/handbook/datasets/BIRNSAUN.DAT',
  description: 'Birnbaum & Saunders (1958), aluminum fatigue life',
  nistDescription: 'Source: Birnbaum, Z. W. and Saunders, S. C. ...',
  n: 101,
},
```

### Plots Component Switch Pattern
```typescript
// Source: src/components/eda/FatigueLifePlots.astro (complete structure)
switch (type) {
  case '4-plot':
    svg = generate4Plot(fatigueLife, compositeConfig);
    break;
  case 'run-sequence':
    svg = generateLinePlot({
      data: fatigueLife,
      mode: 'run-sequence',
      config: singleConfig,
      title: 'Run Sequence Plot',
      xLabel: 'Observation',
      yLabel: 'Fatigue Life (x1000 cycles)',
    });
    break;
  // ... lag, histogram, probability, autocorrelation, spectral
}
```

### CaseStudyDataset CASE_STUDY_MAP Pattern
```typescript
// Source: src/components/eda/CaseStudyDataset.astro, line 97
'fatigue-life': {
  kind: 'single',
  key: 'fatigueLife',
  values: fatigueLife,
  responseVariable: 'Fatigue life (thousands of cycles)',
},
```

### MDX Import and Component Usage Pattern
```mdx
---
title: "Filter Transmittance Case Study"
description: "..."
section: "1.4.2"
category: "case-studies"
nistSection: "1.4.2.6 Filter Transmittance"
---
import CaseStudyDataset from '../../../../components/eda/CaseStudyDataset.astro';
import InlineMath from '../../../../components/eda/InlineMath.astro';
import FilterTransmittancePlots from '../../../../components/eda/FilterTransmittancePlots.astro';

## Background and Data
...
<CaseStudyDataset slug="filter-transmittance" />

## Graphical Output and Interpretation
### 4-Plot Overview
<FilterTransmittancePlots type="4-plot" />
### Run Sequence Plot
<FilterTransmittancePlots type="run-sequence" />
```

### InlineMath Usage Pattern
```mdx
<!-- Source: filter-transmittance.mdx -->
The mean is <InlineMath tex="\bar{Y} = 28.01634" /> with standard deviation
<InlineMath tex="s = 0.06349" />.
```

## NIST Standard Resistor Data: Key Facts

### Dataset Characteristics
| Property | Value | Source |
|----------|-------|--------|
| File name | DZIUBA1.DAT | NIST datasets archive |
| Collector | Ron Dziuba, NIST | eda4271.htm |
| Period | 1980-1985 | Dataset header |
| Sample size | 1000 | Dataset header |
| Response variable | Resistance (ohms) | eda4271.htm |
| Precision | 4 decimal places | Dataset values |
| Range | 27.828 to 28.115 | eda4273.htm |
| Purpose | Illustrate data that violate constant location and scale | eda4271.htm |

### NIST Summary Statistics (Verified from eda4273.htm)
| Statistic | Value |
|-----------|-------|
| n | 1000 |
| Mean | 28.01634 |
| Std Dev | 0.06349 |
| Median | 28.02910 |
| Min | 27.82800 |
| Max | 28.11850 |
| Range | 0.29050 |

### NIST Test Results (Verified from eda4273.htm)
| Assumption | Test | Key Statistic | Result |
|------------|------|---------------|--------|
| Fixed location | Linear regression on index | Slope t = 100.2 | **REJECT** -- significant drift |
| Fixed variation | Levene test (k=4) | W = 140.85, critical = 2.614 | **REJECT** -- non-constant variation |
| Randomness | Lag-1 autocorrelation | r1 = 0.97, critical = +/-0.062 | **REJECT** -- extreme autocorrelation |
| Randomness | Runs test | Z = -30.5629, critical = +/-1.96 | **REJECT** -- not random |
| Distribution | Normality | Omitted | Not meaningful (randomness violated) |
| Outliers | Grubbs' | Omitted | Not meaningful (randomness violated) |

### Root Cause
Non-constant variation resulted from seasonal humidity effects on measurement equipment (winter vs summer). The drift in location reflects genuine physical aging of the resistor over 5 years. The extreme autocorrelation arises because measurements close in time are taken under similar environmental conditions.

### Key Analytical Narrative
This case study illustrates **three simultaneous assumption violations** (location, variation, randomness), unlike Filter Transmittance (location + randomness but not variation). The regression slope is tiny numerically (0.00021) but the t-value of 100.2 is enormous because the residual variation is very small. The Levene test statistic of 140.85 (critical value 2.614) is massively significant, showing that the first and last thirds of the data have different variability from the middle third -- a seasonal humidity effect. The runs test Z of -30.56 is the most extreme randomness rejection of any case study in the collection.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Hand-rolled SVG per case study | Shared SVG generator library | Phase 50/56 | All plots generated from same functions; no custom SVG needed |
| Missing Interpretation section | Explicit Interpretation section between tests and conclusions | Phase 57 | Required from the start for new case studies |
| Minimal Background | Detailed Background with goals, model, and dataset panel | Phase 56/57 | Must include CaseStudyDataset component and analysis goals |

**Deprecated/outdated:**
- None. All infrastructure is current from Phase 56/57.

## Open Questions

1. **Date columns: include or omit?**
   - What we know: The DZIUBA1.DAT file has 4 columns (month, day, year, resistance). All existing single-column case studies use only the response variable. The run sequence plot uses sequential index, not date.
   - What's unclear: Whether future enhancements might want to plot resistance vs actual date for seasonal analysis.
   - Recommendation: **Omit date columns for now.** Store only the response variable as `number[]` to match the established pattern. If date-based analysis is needed later, it can be added as a separate typed array. The sequential index is sufficient for all standard EDA plots and matches NIST's presentation.

2. **Variation test: Levene on k=4 intervals vs other groupings?**
   - What we know: NIST uses k=4 equal-length intervals. The Levene test in the quantitative section uses W=140.85 with 3 df.
   - What's unclear: Whether our Plots component needs to render a variation-by-quarter plot.
   - Recommendation: **Report the Levene result in prose with NIST values.** No special variation plot is needed -- the run sequence plot visually shows the changing spread. The existing histogram and run sequence generators suffice.

3. **How many data values per line in datasets.ts?**
   - What we know: Existing datasets use 10 values per line (normalRandom, uniformRandom, timeSeries). With 1000 values at 10 per line, that's 100 lines.
   - What's unclear: Whether 10 per line is optimal for readability with 7-character values (27.8680 format).
   - Recommendation: **Use 10 values per line** for consistency with existing datasets. The values are 7-8 characters each, fitting comfortably in a line.

## Sources

### Primary (HIGH confidence)
- `src/data/eda/datasets.ts` -- verified all dataset export patterns, DATASET_SOURCES structure
- `src/components/eda/FatigueLifePlots.astro` -- verified Plots component pattern (single-column with all 6 plot types)
- `src/components/eda/FilterTransmittancePlots.astro` -- verified Plots component for assumption-violating study
- `src/data/eda/pages/case-studies/filter-transmittance.mdx` -- verified MDX structure for assumption-violating case study
- `src/data/eda/pages/case-studies/fatigue-life.mdx` -- verified MDX structure with all standard sections
- `src/components/eda/CaseStudyDataset.astro` -- verified CASE_STUDY_MAP registration pattern
- `src/content.config.ts` -- verified edaPages content collection schema
- `src/lib/eda/svg-generators/index.ts` -- verified all 13 SVG generators available

### Secondary (MEDIUM-HIGH confidence)
- https://www.itl.nist.gov/div898/handbook/eda/section4/eda4271.htm -- NIST Background and Data
- https://www.itl.nist.gov/div898/handbook/eda/section4/eda4272.htm -- NIST Graphical Output
- https://www.itl.nist.gov/div898/handbook/eda/section4/eda4273.htm -- NIST Quantitative Output
- https://www.itl.nist.gov/div898/handbook/datasets/DZIUBA1.DAT -- NIST source data file

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all libraries and components already exist and are verified from codebase
- Architecture: HIGH -- follows established patterns verified across 9 existing case studies
- Pitfalls: HIGH -- identified from actual Phase 57 gap analysis and NIST source verification
- Dataset: HIGH -- NIST source verified with exact statistics from eda4273.htm
- Content structure: HIGH -- template verified from enhanced Phase 57 studies

**Research date:** 2026-02-26
**Valid until:** 2026-03-28 (stable -- infrastructure is mature, NIST data is static)
