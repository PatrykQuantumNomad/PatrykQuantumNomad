# Phase 62: Ceramic Strength DOE - Research

**Researched:** 2026-02-27
**Domain:** MDX content authoring, DOE (Design of Experiments) multi-factor analysis, bihistogram/block plot/interaction plot/DOE mean plot SVG generation, NIST EDA case study parity
**Confidence:** HIGH

## Summary

Phase 62 enhances the Ceramic Strength case study to full NIST parity with the DOE Variation of the canonical case study template. This is the most structurally unique case study in the entire EDA collection because it is a **designed experiment** with a 6-section analysis structure rather than the standard 4-assumption testing framework used by all other case studies. The NIST page (Section 1.4.2.10) has 6 sub-pages: (1) Background and Data, (2) Analysis of the Response Variable, (3) Analysis of Batch Effect, (4) Analysis of Lab Effect, (5) Analysis of Primary Factors, and (6) Conclusions/Interpretation.

A detailed gap analysis of the existing `ceramic-strength.mdx` (266 lines) reveals that the case study already has substantial textual content covering ALL six analytical areas -- Background & Data, 4-Plot with individual named subsections (Run Sequence, Lag, Histogram, Normal Probability), Batch Effect Analysis, Lab Effect Analysis, Factor Effects by batch with ranked tables, Distribution Test, Outlier Detection, and Conclusions. However, the content structure does not match the DOE Variation canonical template: the "Response Variable Analysis" is currently headed as "Graphical Output and Interpretation" (standard template name rather than DOE-specific), the batch and lab analysis sections lack individual plot subsections with `<CeramicStrengthPlots>` component calls for each plot type, the Primary Factors section is missing DOE-specific visualizations (bihistogram, block plots, DOE mean plots, DOE scatter plots, interaction plots), and there is no separate Interpretation section synthesizing multi-factor evidence.

The key engineering challenge is that several DOE-specific SVG generators do NOT exist yet and must be created: (1) a **bihistogram** generator (two back-to-back histograms on shared x-axis), (2) a **DOE mean plot** generator (group means connected by lines showing factor effects), (3) a **block plot** generator (means by block showing factor consistency), and (4) an **interaction plot** generator (lines connecting factor-level means, with crossing lines indicating interaction). The existing `bar-plot.ts` and `line-plot.ts` generators provide useful infrastructure but cannot be directly reused for these DOE-specific chart types. The `box-plot.ts` generator already supports grouped box plots and can be used for lab-specific and batch-specific box plots. The `histogram.ts` generator does not support back-to-back bihistogram mode and would need extension or a new generator.

**Primary recommendation:** Implement in three plans: (1) restructure the MDX to match the DOE Variation canonical template with individually named plot subsections in all 4 analysis sections (Response Variable, Batch Effect, Lab Effect, Primary Factors) and add missing `<CeramicStrengthPlots>` component calls for existing plot types; (2) create new DOE-specific SVG generators (bihistogram, DOE mean plot, block plot, interaction plot) and wire them into CeramicStrengthPlots.astro with new plot types for the Primary Factors section; (3) add the Interpretation section synthesizing multi-factor evidence and update Conclusions.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| CER-01 | Response variable analysis with individual plot subsections | PARTIALLY COMPLETE: Has 4-Plot Overview, Run Sequence, Lag, Histogram, Normal Probability Plot as named subsections with interpretation. GAPS: Section heading should be "## Response Variable Analysis" (DOE template) not "## Graphical Output and Interpretation" (standard template). Individual subsections exist but need verification against DOE template structure. |
| CER-02 | Batch effect analysis with batch-specific plots and tests | PARTIALLY COMPLETE: Has Batch Effect Analysis section with batch box plot, batch histograms mentioned textually, F-test and t-test tables. GAPS: Missing individually named plot subsections with component calls -- the bihistogram, batch histograms, batch box plot, and block plots need standalone subsections each with their own `<CeramicStrengthPlots type="...">` calls. CeramicStrengthPlots currently supports `batch-box-plot`, `batch1-histogram`, `batch2-histogram` but these are not all rendered in the MDX. |
| CER-03 | Lab effect analysis with lab-specific plots and tests | PARTIALLY COMPLETE: Has Lab Effect Analysis section with textual description of lab box plots. GAPS: Missing actual `<CeramicStrengthPlots>` component calls for lab-specific visualizations (box plot by lab overall, box plot by lab Batch 1, box plot by lab Batch 2). Need new plot types in CeramicStrengthPlots. |
| CER-04 | Primary factors analysis with DOE-specific visualizations (bihistogram, block plots, interaction plots) | GAP: The Factor Effects section has ranked effect tables but NO DOE-specific visualizations. Need new SVG generators for: bihistogram (batch comparison), DOE mean plots (factor effect magnitudes), DOE scatter plots (raw data by factor level), interaction plots (factor interactions), and block plots (factor consistency across blocks). These do not exist in the SVG generator library. |
| CER-05 | Interpretation section synthesizing multi-factor evidence | GAP: No "## Interpretation" section exists. The current MDX goes from Quantitative Output directly to Conclusions. Need 3+ paragraph synthesis following the Phase 57 pattern but adapted for multi-factor DOE context. |
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
| d3-scale | (project version) | Scale functions for SVG generators | scaleLinear, scaleBand -- already used by all generators |
| d3-array | (project version) | Array utilities (bin, extent, quantile) | Already used by histogram.ts, box-plot.ts |
| d3-shape | (project version) | Line/area generators | Already used by histogram.ts (for KDE curve) |
| statistics.ts | Phase 56 | Mean, standard deviation, correlation | Computing group means, batch/lab statistics |
| plot-base.ts | Existing | Shared SVG foundation (axes, grid, palette, config) | All new generators must use this |
| PlotFigure.astro | Phase 56 | Consistent figure rendering | Already used by CeramicStrengthPlots.astro |
| InlineMath.astro | Existing | LaTeX math rendering | All statistical formulas in MDX content |
| CaseStudyDataset.astro | Existing | Dataset display panel | Already in use |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| New bihistogram generator | Extend existing histogram.ts with back-to-back mode | Extending histogram adds complexity to an already-long file; a focused bihistogram generator is cleaner |
| New DOE mean plot generator | Use existing bar-plot.ts | Bar plot uses bars; DOE mean plot uses connected lines/points. They are visually distinct chart types. |
| New interaction plot generator | Use existing scatter-plot.ts or line-plot.ts | Interaction plots have very specific structure (factor levels on x-axis, separate line per other factor level). A dedicated generator is cleaner. |

**Installation:**
```bash
# No new packages needed -- all work uses existing d3 dependencies
```

## Architecture Patterns

### Existing Project Structure (Targeted Changes)
```
src/
├── data/eda/
│   ├── datasets.ts                              # CeramicStrengthObs interface (NO CHANGES)
│   └── pages/case-studies/
│       └── ceramic-strength.mdx                 # CER-01 through CER-05: Major restructure + new content
├── components/eda/
│   └── CeramicStrengthPlots.astro               # CER-02/03/04: Add many new plot types
└── lib/eda/
    ├── math/
    │   └── statistics.ts                        # NO CHANGES -- all needed functions exist
    └── svg-generators/
        ├── index.ts                             # CER-04: Export new generators
        ├── bihistogram.ts                       # CER-04: NEW -- back-to-back histogram
        ├── doe-mean-plot.ts                     # CER-04: NEW -- DOE mean/sd plot
        ├── block-plot.ts                        # CER-04: NEW -- block plot
        └── interaction-plot.ts                  # CER-04: NEW -- interaction effects plot
```

### Pattern 1: DOE Variation Template Structure (from case-study-template.md)
**What:** The Ceramic Strength case study follows the DOE Variation of the canonical template, which replaces the standard single-dataset 4-assumption structure with a multi-factor analysis structure.
**When to use:** Only this case study.
**Structure:**
```
## Background and Data
### Study Design
## Response Variable Analysis                    <-- CER-01 (rename from "Graphical Output and Interpretation")
### 4-Plot Overview
### Run Sequence Plot
### Lag Plot
### Histogram
### Normal Probability Plot
## Batch Effect Analysis                         <-- CER-02
### Bihistogram                                  <-- CER-02/04: NEW plot subsection
### Batch Box Plot                               <-- CER-02: existing but needs component call
### Batch Block Plots                            <-- CER-02/04: NEW plot subsection
### Batch Statistical Tests                      <-- CER-02: existing F-test + t-test tables
## Lab Effect Analysis                           <-- CER-03
### Lab Box Plot                                 <-- CER-03: NEW plot subsection
### Lab Box Plot by Batch                        <-- CER-03: NEW plot subsection
## Primary Factors Analysis                      <-- CER-04
### DOE Scatter Plot                             <-- CER-04: NEW
### DOE Mean Plot                                <-- CER-04: NEW
### DOE Standard Deviation Plot                  <-- CER-04: NEW
### Interaction Effects                          <-- CER-04: NEW
### Ranked Effects                               <-- CER-04: existing tables, restructured
## Quantitative Output and Interpretation        <-- existing
### Summary Statistics                           <-- existing
### Batch Comparison                             <-- existing
### Factor Effects                               <-- existing
### Distribution Test                            <-- existing
### Outlier Detection                            <-- existing
## Interpretation                                <-- CER-05: NEW
## Conclusions                                   <-- existing, update
```

### Pattern 2: Bihistogram SVG Generator
**What:** A new SVG generator that renders two histograms back-to-back on a shared x-axis, one plotted upward and one plotted downward.
**When to use:** CER-02 and CER-04 -- comparing Batch 1 vs Batch 2, or comparing factor levels.
**Design:**
```typescript
// New file: src/lib/eda/svg-generators/bihistogram.ts
import { scaleLinear } from 'd3-scale';
import { bin, extent, range } from 'd3-array';
import {
  DEFAULT_CONFIG, PALETTE, svgOpen, gridLinesH,
  innerDimensions, titleText, type PlotConfig,
} from './plot-base';

export interface BihistogramOptions {
  topData: number[];
  bottomData: number[];
  topLabel: string;
  bottomLabel: string;
  binCount?: number;
  config?: Partial<PlotConfig>;
  title?: string;
  xLabel?: string;
}

export function generateBihistogram(options: BihistogramOptions): string {
  // Shared x-domain from both datasets combined
  // Top histogram bars go UP from center line
  // Bottom histogram bars go DOWN from center line
  // Center horizontal line at height/2
  // Y-axis shows frequency (positive both ways)
  // Legend labels for top and bottom groups
}
```

### Pattern 3: DOE Mean Plot SVG Generator
**What:** A line+point plot showing group means for each factor level, with a dashed grand mean reference line.
**When to use:** CER-04 -- showing which factors affect ceramic strength.
**Design:**
```typescript
// New file: src/lib/eda/svg-generators/doe-mean-plot.ts
export interface DoeMeanPlotOptions {
  factors: {
    label: string;
    levels: { label: string; mean: number }[];
  }[];
  grandMean: number;
  config?: Partial<PlotConfig>;
  title?: string;
  yLabel?: string;
}

export function generateDoeMeanPlot(options: DoeMeanPlotOptions): string {
  // For each factor: plot its level means connected by a line
  // Dashed horizontal reference line at the grand mean
  // X-axis: factor levels (e.g., "-1" and "+1" or "Low"/"High")
  // Y-axis: mean response
  // Separate subplot panel per factor or all on one plot
}
```

### Pattern 4: Block Plot SVG Generator
**What:** Shows means of the response for each combination of block levels, with different symbols/colors for the primary factor levels.
**When to use:** CER-02 -- showing batch effect is consistent across labs; CER-04 -- showing factor effects across blocks.
**Design:**
```typescript
// New file: src/lib/eda/svg-generators/block-plot.ts
export interface BlockPlotOptions {
  blocks: {
    label: string;
    values: { group: string; mean: number }[];
  }[];
  config?: Partial<PlotConfig>;
  title?: string;
  xLabel?: string;
  yLabel?: string;
}

export function generateBlockPlot(options: BlockPlotOptions): string {
  // X-axis: block labels (e.g., Lab 1, Lab 2, ..., Lab 8)
  // Y-axis: mean response
  // For each block: plot connected points for each group level
  // Different colors for each group (e.g., Batch 1 vs Batch 2)
  // Legend showing group labels and colors
}
```

### Pattern 5: Interaction Plot SVG Generator
**What:** A line plot showing the mean response at each level of one factor, with separate lines for each level of a second factor. Non-parallel lines indicate interaction.
**When to use:** CER-04 -- showing interaction effects between primary factors.
**Design:**
```typescript
// New file: src/lib/eda/svg-generators/interaction-plot.ts
export interface InteractionPlotOptions {
  factorA: { label: string; levels: string[] };
  factorB: { label: string; levels: string[] };
  means: { aLevel: string; bLevel: string; mean: number }[];
  config?: Partial<PlotConfig>;
  title?: string;
}

export function generateInteractionPlot(options: InteractionPlotOptions): string {
  // X-axis: levels of Factor A
  // Y-axis: mean response
  // Separate line for each level of Factor B
  // Parallel lines = no interaction; crossing lines = interaction
  // Legend identifying Factor B levels
}
```

### Pattern 6: Adding New Plot Types to CeramicStrengthPlots.astro
**What:** Extend the PlotType union and switch statement with all new DOE plot types.
**When to use:** CER-02, CER-03, CER-04.
**New types needed:**
```typescript
type PlotType =
  // Existing:
  | '4-plot' | 'run-sequence' | 'lag' | 'histogram' | 'probability'
  | 'batch-box-plot' | 'batch1-histogram' | 'batch2-histogram'
  // New for CER-02 (Batch Effect):
  | 'batch-bihistogram'           // Bihistogram comparing batches
  | 'batch-block-plot'            // Block plot: batch means by lab
  // New for CER-03 (Lab Effect):
  | 'lab-box-plot'                // Box plot by lab (all data)
  | 'lab-box-plot-batch1'         // Box plot by lab (Batch 1 only)
  | 'lab-box-plot-batch2'         // Box plot by lab (Batch 2 only)
  // New for CER-04 (Primary Factors):
  | 'doe-mean-batch1'            // DOE mean plot for Batch 1 factors
  | 'doe-mean-batch2'            // DOE mean plot for Batch 2 factors
  | 'doe-sd-batch1'              // DOE SD plot for Batch 1 factors
  | 'doe-sd-batch2'              // DOE SD plot for Batch 2 factors
  | 'interaction-batch1'          // Interaction plot for Batch 1
  | 'interaction-batch2';         // Interaction plot for Batch 2
```

### Anti-Patterns to Avoid
- **Trying to reuse the standard template structure:** This case study MUST follow the DOE Variation. Do NOT add "## Test Underlying Assumptions" or "### Goals" sections -- they do not apply to designed experiments. The analysis starts with response variable exploration, then decomposes by factors.
- **Pooled quantitative tests as the primary analysis:** Unlike standard case studies, the pooled data statistics here are secondary. The batch effect is the dominant finding. Do NOT add a full standard quantitative test battery (location test, variation test, randomness tests) as the primary analysis. The existing summary statistics, F-test, and t-test are correct.
- **Building overly complex SVG generators:** Keep generators simple -- each produces a single static SVG. No interactivity, no animations, no responsive features. The NIST plots are basic (points + lines + labels). Match that simplicity.
- **Trying to compute ANOVA tables:** Out of scope per REQUIREMENTS.md. The factor effects (ranked effect estimates) are taken from NIST. Hardcode these values in the MDX.
- **Computing factor effects from raw data:** The NIST source provides all factor effect magnitudes. Hardcode them rather than implementing a Yates analysis or ANOVA decomposition.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Factor effect magnitudes | Yates analysis or ANOVA solver | Hardcoded NIST values | Out of scope per REQUIREMENTS.md; values are published |
| Batch comparison tests | Custom F-test/t-test implementations | Existing statistics.ts functions OR hardcoded NIST values | Tests already present in MDX with correct values |
| Box plots by group | Custom grouped box plot renderer | Existing `generateBoxPlot` with `groups` parameter | Box plot generator already supports multiple groups |
| Cross-reference URLs | Manual URL construction | url-cross-reference.md cheat sheet | Copy-paste prevents broken links |
| Section structure | Ad-hoc headings | case-study-template.md DOE Variation | Ensures consistency with template |
| SVG axes, grid, palette | Custom axis rendering per generator | plot-base.ts shared utilities | All existing generators use these; consistency matters |

**Key insight:** This phase has TWO distinct work streams: (1) content restructuring (reorganizing existing text into the DOE template, adding component calls) and (2) new SVG generator engineering (4 new chart types). The content restructuring is the larger task by line count; the SVG generators are the larger task by complexity. All quantitative values are already present in the MDX or published by NIST.

## Common Pitfalls

### Pitfall 1: Applying Standard Template to a DOE Case Study
**What goes wrong:** Adding "## Test Underlying Assumptions" and "### Goals" sections that don't belong in a designed experiment analysis. Adding standard quantitative test battery (location test, variation test, randomness tests) as the primary analysis framework.
**Why it happens:** Pattern matching from other case studies (Phase 57-61) that all use the standard or distribution-focus template.
**How to avoid:** Follow the DOE Variation template explicitly. The ceramic strength case study has a fundamentally different analytical structure: Response Variable -> Batch Effect -> Lab Effect -> Primary Factors -> Interpretation. The quantitative output section is NOT the standard test battery; it contains batch comparison (F-test, t-test), factor effects (ranked tables), and only supplementary distribution/outlier tests.
**Warning signs:** Headings like "### Location Test" or "### Variation Test" appearing in the MDX.

### Pitfall 2: Bihistogram Bin Alignment
**What goes wrong:** The top and bottom histograms in a bihistogram use different bin edges, making visual comparison impossible.
**Why it happens:** Computing bins independently for each dataset.
**How to avoid:** Compute a shared bin domain from the union of both datasets, then apply the same bin edges to both. This ensures bars align vertically for direct comparison.
**Warning signs:** Bars in the top and bottom histograms don't align on the x-axis.

### Pitfall 3: Losing Existing Content During Restructure
**What goes wrong:** The existing 266-line MDX has detailed interpretation paragraphs, statistical tables, and nuanced discussions. Restructuring could lose or misplace content.
**Why it happens:** Moving large blocks of text between headings.
**How to avoid:** Map every existing paragraph to its destination heading in the new structure BEFORE editing. Use a checklist:
- Background and Data (lines 1-42): KEEP AS-IS
- 4-Plot Overview (lines 44-66): MOVE to "## Response Variable Analysis" -> "### 4-Plot Overview"
- Run Sequence through Normal Prob (lines 68-90): MOVE to corresponding subsections under Response Variable
- Batch Effect (lines 92-101): MOVE to "## Batch Effect Analysis" subsections
- Lab Effect (lines 103-109): MOVE to "## Lab Effect Analysis" subsections
- Quantitative Output (lines 111-250): Partially KEEP (Summary Statistics, Batch Comparison, Distribution, Outlier) and partially MOVE (Factor Effects -> Primary Factors)
- Conclusions (lines 252-266): KEEP as Conclusions, add Interpretation before it
**Warning signs:** Line count of restructured MDX is significantly less than original (content lost).

### Pitfall 4: DOE Mean Plot Y-Axis Domain
**What goes wrong:** The y-axis of the DOE mean plot uses the full data range (300-820) instead of a focused range around the factor level means, making effect differences invisible.
**Why it happens:** Using `extent(data)` for the y-domain instead of `extent(means)` with padding.
**How to avoid:** The y-axis should be focused on the range of the group means, not the full data range. For Batch 1 means ranging from ~670-720, the y-axis should span approximately 660-730 with the grand mean as a reference line.
**Warning signs:** Mean plot shows nearly flat lines because the y-axis spans the entire data range.

### Pitfall 5: Forgetting InlineMath for Statistical Values
**What goes wrong:** Writing plain text test statistics instead of using InlineMath component.
**Why it happens:** Rushing through content writing.
**How to avoid:** Every statistical value in the MDX must use `<InlineMath tex="..." />`. The existing ceramic-strength.mdx already uses InlineMath consistently -- preserve this pattern when adding new content.
**Warning signs:** Numbers in plain text that should be formatted mathematically.

### Pitfall 6: Interaction Plot Without Batch Separation
**What goes wrong:** Creating a single interaction plot for all 480 observations, ignoring the batch effect.
**Why it happens:** Not reading the NIST analysis carefully. The factor rankings DIFFER between batches.
**How to avoid:** NIST analyzes factors separately by batch because the batch effect dominates. Create interaction plots for Batch 1 and Batch 2 separately. The key finding is that factor rankings are INCONSISTENT between batches (table speed dominates Batch 1, down feed dominates Batch 2).
**Warning signs:** A single interaction plot that averages over both batches, hiding the batch-by-factor interaction.

### Pitfall 7: Too Many New SVG Generators Creating Scope Creep
**What goes wrong:** Building 6+ elaborate SVG generators with full feature sets, error bars, confidence bands, etc.
**Why it happens:** Over-engineering to match sophisticated statistical visualization packages.
**How to avoid:** Keep generators minimal. NIST's plots are basic -- points, lines, labels. Each generator should be <150 lines, following the existing pattern in bar-plot.ts and line-plot.ts. Focus on clarity, not features.
**Warning signs:** A generator file exceeding 200 lines.

## Code Examples

### Example 1: Bihistogram Generator Pattern
```typescript
// Source: Based on NIST bihistogram description + existing histogram.ts pattern
// New file: src/lib/eda/svg-generators/bihistogram.ts

import { scaleLinear } from 'd3-scale';
import { bin, extent } from 'd3-array';
import {
  DEFAULT_CONFIG, PALETTE, svgOpen, gridLinesH,
  innerDimensions, titleText, type PlotConfig,
} from './plot-base';

export interface BihistogramOptions {
  topData: number[];
  bottomData: number[];
  topLabel: string;
  bottomLabel: string;
  binCount?: number;
  config?: Partial<PlotConfig>;
  title?: string;
  xLabel?: string;
}

export function generateBihistogram(options: BihistogramOptions): string {
  const { topData, bottomData, topLabel, bottomLabel } = options;
  const config: PlotConfig = { ...DEFAULT_CONFIG, ...options.config };
  const { innerWidth, innerHeight } = innerDimensions(config);
  const { margin } = config;

  // Shared x-domain from both datasets
  const allData = [...topData, ...bottomData];
  const [domainMin, domainMax] = extent(allData) as [number, number];

  // Shared bin edges
  const thresholds = options.binCount ?? Math.ceil(Math.log2(allData.length) + 1);
  const binGen = bin().domain([domainMin, domainMax]).thresholds(thresholds);
  const topBins = binGen(topData);
  const bottomBins = binGen(bottomData);

  // Center line splits the plot area in half
  const centerY = margin.top + innerHeight / 2;
  const halfHeight = innerHeight / 2;

  // Y scale: frequency -> pixel distance from center
  const maxFreq = Math.max(
    ...topBins.map(b => b.length),
    ...bottomBins.map(b => b.length)
  );
  const yScale = scaleLinear().domain([0, maxFreq]).range([0, halfHeight - 10]);

  // X scale
  const xScale = scaleLinear()
    .domain([domainMin, domainMax])
    .range([margin.left, margin.left + innerWidth]);

  // Top bars (going UP from center)
  const topBarsStr = topBins.map(b => {
    const x = xScale(b.x0!);
    const w = xScale(b.x1!) - xScale(b.x0!);
    const h = yScale(b.length);
    const y = centerY - h;
    return `<rect x="${x.toFixed(2)}" y="${y.toFixed(2)}" width="${w.toFixed(2)}" height="${h.toFixed(2)}" fill="${PALETTE.dataPrimary}" fill-opacity="0.7" stroke="${PALETTE.dataPrimary}" stroke-width="0.5" />`;
  }).join('\n');

  // Bottom bars (going DOWN from center)
  const bottomBarsStr = bottomBins.map(b => {
    const x = xScale(b.x0!);
    const w = xScale(b.x1!) - xScale(b.x0!);
    const h = yScale(b.length);
    return `<rect x="${x.toFixed(2)}" y="${centerY.toFixed(2)}" width="${w.toFixed(2)}" height="${h.toFixed(2)}" fill="${PALETTE.dataSecondary}" fill-opacity="0.7" stroke="${PALETTE.dataSecondary}" stroke-width="0.5" />`;
  }).join('\n');

  // Center dividing line + labels
  // ... (x-axis, y-axis, title, legend for top/bottom labels)
}
```

### Example 2: DOE Mean Plot Generator Pattern
```typescript
// Source: Based on NIST DOE Mean Plot description
// New file: src/lib/eda/svg-generators/doe-mean-plot.ts

export interface DoeMeanPlotOptions {
  factors: {
    name: string;
    levels: { label: string; mean: number }[];
  }[];
  grandMean: number;
  config?: Partial<PlotConfig>;
  title?: string;
  yLabel?: string;
}

export function generateDoeMeanPlot(options: DoeMeanPlotOptions): string {
  // Multi-panel: one panel per factor
  // Each panel: x-axis shows factor levels, y-axis shows mean response
  // Points connected by lines; steeper line = larger effect
  // Dashed horizontal line at grand mean
  // All panels share the same y-axis scale for comparability
}
```

### Example 3: CeramicStrengthPlots.astro Data Computation
```typescript
// In CeramicStrengthPlots.astro frontmatter:
// Compute group means for DOE plots

import { mean } from '../../lib/eda/math/statistics';
import { ceramicStrength } from '../../data/eda/datasets';

// Group by batch
const batch1 = ceramicStrength.filter(d => d.batch === 1);
const batch2 = ceramicStrength.filter(d => d.batch === 2);

// Batch 1 factor means
const b1_x1_low = mean(batch1.filter(d => d.tableSpeed === -1).map(d => d.strength));
const b1_x1_high = mean(batch1.filter(d => d.tableSpeed === 1).map(d => d.strength));
const b1_x2_low = mean(batch1.filter(d => d.downFeed === -1).map(d => d.strength));
const b1_x2_high = mean(batch1.filter(d => d.downFeed === 1).map(d => d.strength));
const b1_x3_low = mean(batch1.filter(d => d.wheelGrit === -1).map(d => d.strength));
const b1_x3_high = mean(batch1.filter(d => d.wheelGrit === 1).map(d => d.strength));

// Lab means for block plot
const labs = [1, 2, 3, 4, 5, 6, 7, 8];
const labBatchMeans = labs.map(lab => ({
  label: `Lab ${lab}`,
  values: [
    { group: 'Batch 1', mean: mean(ceramicStrength.filter(d => d.lab === lab && d.batch === 1).map(d => d.strength)) },
    { group: 'Batch 2', mean: mean(ceramicStrength.filter(d => d.lab === lab && d.batch === 2).map(d => d.strength)) },
  ]
}));
```

### Example 4: Interaction Plot Data Structure
```typescript
// Interaction of X1 (table speed) and X3 (wheel grit) for Batch 1
const interactionX1X3_B1 = {
  factorA: { label: 'Table Speed (X1)', levels: ['Low (-1)', 'High (+1)'] },
  factorB: { label: 'Wheel Grit (X3)', levels: ['150 (-1)', '80 (+1)'] },
  means: [
    { aLevel: 'Low (-1)', bLevel: '150 (-1)', mean: /* computed */ },
    { aLevel: 'Low (-1)', bLevel: '80 (+1)', mean: /* computed */ },
    { aLevel: 'High (+1)', bLevel: '150 (-1)', mean: /* computed */ },
    { aLevel: 'High (+1)', bLevel: '80 (+1)', mean: /* computed */ },
  ],
};
// Non-parallel lines would indicate X1*X3 interaction (-20.25 effect in Batch 1)
```

### Example 5: MDX DOE Variation Heading Structure
```mdx
## Response Variable Analysis

The pooled response variable analysis examines all [480 observations](/eda/techniques/4-plot/) ignoring the designed experiment structure.

### 4-Plot Overview

The [4-plot](/eda/techniques/4-plot/) of the response variable reveals important features...

<CeramicStrengthPlots type="4-plot" />

### Run Sequence Plot

The [run sequence plot](/eda/techniques/run-sequence-plot/) of the pooled response shows...

<CeramicStrengthPlots type="run-sequence" />

### Lag Plot
...
### Histogram
...
### Normal Probability Plot
...

## Batch Effect Analysis

### Bihistogram

A [bihistogram](/eda/techniques/bihistogram/) comparing Batch 1 and Batch 2 reveals...

<CeramicStrengthPlots type="batch-bihistogram" />

### Batch Box Plot

<CeramicStrengthPlots type="batch-box-plot" />

### Batch Block Plots

[Block plots](/eda/techniques/block-plot/) by lab and batch show the batch effect is consistent...

<CeramicStrengthPlots type="batch-block-plot" />

### Batch Statistical Tests
#### F-Test for Equal Variances
...
#### Two-Sample t-Test for Equal Means
...

## Lab Effect Analysis

### Lab Box Plot

[Box plots](/eda/techniques/box-plot/) by lab show minor variation in medians...

<CeramicStrengthPlots type="lab-box-plot" />

### Lab Box Plot by Batch

<CeramicStrengthPlots type="lab-box-plot-batch1" />
<CeramicStrengthPlots type="lab-box-plot-batch2" />

## Primary Factors Analysis

### DOE Mean Plot

[DOE mean plots](/eda/techniques/doe-plots/) for Batch 1 show table speed as the dominant factor...

<CeramicStrengthPlots type="doe-mean-batch1" />
<CeramicStrengthPlots type="doe-mean-batch2" />

### Interaction Effects

[Interaction plots](/eda/techniques/doe-plots/) reveal...

<CeramicStrengthPlots type="interaction-batch1" />
<CeramicStrengthPlots type="interaction-batch2" />

### Ranked Effects

#### Batch 1 -- Ranked Effects
| Rank | Effect | Estimate |
...

#### Batch 2 -- Ranked Effects
...
```

### Example 6: Interpretation Section Pattern for DOE
```mdx
## Interpretation

The [4-plot](/eda/techniques/4-plot/) screening of the pooled 480 ceramic strength
observations reveals a [bimodal distribution](/eda/techniques/histogram/) as the dominant
graphical finding, with [run sequence](/eda/techniques/run-sequence-plot/) and
[lag](/eda/techniques/lag-plot/) plots showing no concerning temporal patterns. The bimodality
immediately implicates a grouping factor, and the [bihistogram](/eda/techniques/bihistogram/)
comparing batches identifies the source: Batch 1 specimens are centered approximately
<InlineMath tex="78" /> units higher than Batch 2 (<InlineMath tex="T = 13.38" />,
<InlineMath tex="p \ll 0.001" />). This batch effect of approximately 75-100 units is
consistent across all 8 labs and all 16 treatment combinations, as confirmed by the
[block plots](/eda/techniques/block-plot/) and lab-specific
[box plots](/eda/techniques/box-plot/).

The [lab effect analysis](/eda/case-studies/ceramic-strength/) shows minor variation in medians
across the 8 labs (negligible relative to the batch effect), justifying treatment of the labs
as homogeneous. The primary factor analysis using [DOE mean plots](/eda/techniques/doe-plots/)
reveals a critical finding: the factor rankings are **not consistent across batches**. In
Batch 1, table speed (<InlineMath tex="X_1" />) dominates with a <InlineMath tex="-30.77" />
effect while down feed (<InlineMath tex="X_2" />) is negligible. In Batch 2, the ranking
reverses -- down feed dominates at <InlineMath tex="+18.22" /> while table speed has
essentially no effect. The <InlineMath tex="X_1 \times X_3" /> interaction is substantial in
both batches.

This batch-by-factor interaction is the most consequential finding for engineering practice:
it means no single set of optimal machining parameters applies to both batches. The batch
effect was completely unexpected by the NIST investigators and demonstrates how graphical EDA
techniques -- [bihistograms](/eda/techniques/bihistogram/),
[block plots](/eda/techniques/block-plot/), and [DOE mean plots](/eda/techniques/doe-plots/)
-- can efficiently reveal multi-factor structure that would be difficult to detect from
summary statistics alone. The recommended analysis approach is a
[multi-factor ANOVA](/eda/quantitative/multi-factor-anova/) with batch as a blocking factor,
with primary factor effects examined separately by batch.
```

## Detailed Gap Analysis

### Current State of ceramic-strength.mdx (266 lines)

| Section | Exists? | DOE Template Match | Status | Notes |
|---------|---------|-------------------|--------|-------|
| ## Background and Data | Yes | Correct | Complete | NIST reference, CaseStudyDataset, Study Design |
| ### Study Design | Yes | Correct | Complete | Experiment structure described |
| ## Response Variable Analysis | **Incorrect heading** | Should replace "Graphical Output" | Rename needed | Currently "## Graphical Output and Interpretation" |
| ### 4-Plot Overview | Yes | Correct | Complete | Has `<CeramicStrengthPlots type="4-plot" />` + interpretation |
| ### Run Sequence Plot | Yes | Correct | Complete | Has component call + interpretation |
| ### Lag Plot | Yes | Correct | Complete | Has component call + interpretation |
| ### Histogram | Yes | Correct | Complete | Has component call + interpretation |
| ### Normal Probability Plot | Yes | Correct | Complete | Has component call + interpretation |
| ## Batch Effect Analysis | Yes | Correct heading | **Needs subsections** | Has textual description but missing named plot subsections |
| ### Bihistogram | **NO** | DOE template required | **MISSING (CER-02/04)** | Mentioned textually ("A bihistogram comparing...") but no component call, no SVG generator exists |
| ### Batch Box Plot | **Partially** | Correct | Needs named subsection | `<CeramicStrengthPlots type="batch-box-plot" />` exists in MDX but under general heading |
| ### Batch Block Plots | **NO** | DOE template required | **MISSING (CER-02/04)** | Mentioned textually but no component or generator |
| ### Batch Statistical Tests | Yes | Correct | Complete | F-test + t-test tables present with correct values |
| ## Lab Effect Analysis | Yes | Correct heading | **Needs subsections** | Has textual description but no component calls |
| ### Lab Box Plot | **NO** | DOE template required | **MISSING (CER-03)** | Described textually but no component or generator call |
| ### Lab Box Plot by Batch | **NO** | DOE template required | **MISSING (CER-03)** | Described textually but no component calls |
| ## Primary Factors Analysis | **Partially** | "Factor Effects" heading | Rename + expand | Has ranked effect tables but NO DOE visualizations |
| ### DOE Mean Plot | **NO** | DOE template required | **MISSING (CER-04)** | No generator exists |
| ### DOE SD Plot | **NO** | DOE template required | **MISSING (CER-04)** | No generator exists |
| ### Interaction Effects | **NO** | DOE template required | **MISSING (CER-04)** | No generator exists |
| ### Ranked Effects | Yes | Correct | Needs restructure | Existing Batch 1/Batch 2 ranked tables, move under Primary Factors |
| ## Quantitative Output | Yes | Correct | Keep most | Summary Stats, Batch Comparison, Distribution, Outlier |
| ## Interpretation | **NO** | DOE template required | **MISSING (CER-05)** | |
| ## Conclusions | Yes | Correct | Needs update | Good content, update after adding Interpretation |

### NIST Values Already in MDX (Hardcoded)

All key statistical values are already present and correct:

| Statistic | Value | Source |
|-----------|-------|--------|
| Sample size | 480 | NIST |
| Grand mean | 650.0773 | NIST |
| Batch 1 mean | 688.9987 | NIST |
| Batch 2 mean | 611.1559 | NIST |
| F-test statistic | 1.123 | NIST |
| t-test statistic | 13.3806 | NIST |
| Batch 1 X1 effect | -30.77 | NIST |
| Batch 1 X1*X3 interaction | -20.25 | NIST |
| Batch 2 X2 effect | +18.22 | NIST |
| Batch 2 X1*X3 interaction | -16.71 | NIST |

### New SVG Generators Required

| Generator | File | Lines (est.) | Complexity | Basis |
|-----------|------|-------------|------------|-------|
| Bihistogram | bihistogram.ts | ~120 | Medium | histogram.ts pattern, shared bins |
| DOE Mean Plot | doe-mean-plot.ts | ~100 | Low | Simple point+line per factor |
| Block Plot | block-plot.ts | ~100 | Low | Point+line per block, grouped |
| Interaction Plot | interaction-plot.ts | ~110 | Low-Medium | Multi-line plot, 2x2 means |

### New Plot Types for CeramicStrengthPlots.astro

| Plot Type String | Generator | Data Source |
|-----------------|-----------|-------------|
| `batch-bihistogram` | generateBihistogram | batch1/batch2 strength arrays |
| `batch-block-plot` | generateBlockPlot | means by lab and batch |
| `lab-box-plot` | generateBoxPlot (existing) | 8 groups by lab |
| `lab-box-plot-batch1` | generateBoxPlot (existing) | 8 groups by lab, Batch 1 only |
| `lab-box-plot-batch2` | generateBoxPlot (existing) | 8 groups by lab, Batch 2 only |
| `doe-mean-batch1` | generateDoeMeanPlot | Batch 1 factor means |
| `doe-mean-batch2` | generateDoeMeanPlot | Batch 2 factor means |
| `doe-sd-batch1` | generateDoeMeanPlot (SD mode) | Batch 1 factor SDs |
| `doe-sd-batch2` | generateDoeMeanPlot (SD mode) | Batch 2 factor SDs |
| `interaction-batch1` | generateInteractionPlot | Batch 1 2-factor interaction means |
| `interaction-batch2` | generateInteractionPlot | Batch 2 2-factor interaction means |

## Recommended Plan Structure

This phase naturally splits into 3 plans:

**Plan 1: MDX Restructure and Response Variable / Batch / Lab Subsections (CER-01, CER-02 partial, CER-03 partial)**
- Rename "## Graphical Output and Interpretation" to "## Response Variable Analysis"
- Verify all 5 response variable plot subsections have component calls (they do)
- Break Batch Effect Analysis into named subsections with existing component calls (batch-box-plot, batch1-histogram, batch2-histogram are already in CeramicStrengthPlots)
- Add lab box plot types to CeramicStrengthPlots (using existing generateBoxPlot with lab groups)
- Break Lab Effect Analysis into named subsections with new component calls
- Move Factor Effects content to restructured "## Primary Factors Analysis" (content move only, visuals in Plan 2)
- Verify `npx astro check` passes

**Plan 2: DOE SVG Generators and Primary Factors Visualizations (CER-02 bihistogram, CER-04)**
- Create bihistogram.ts SVG generator
- Create doe-mean-plot.ts SVG generator (supports both mean and SD modes)
- Create block-plot.ts SVG generator
- Create interaction-plot.ts SVG generator
- Export all new generators from index.ts
- Wire all new plot types into CeramicStrengthPlots.astro with data computation
- Add bihistogram subsection to Batch Effect Analysis
- Add batch block plot subsection to Batch Effect Analysis
- Add DOE Mean Plot, DOE SD Plot, and Interaction Effects subsections to Primary Factors Analysis
- Verify `npx astro check` and `npx astro build` pass

**Plan 3: Interpretation Section and Final Polish (CER-05)**
- Add "## Interpretation" section with 3 paragraphs following the DOE synthesis pattern:
  - Paragraph 1: Response variable screening -- bimodal distribution as dominant finding, no temporal issues
  - Paragraph 2: Factor decomposition -- batch effect dominates (~78 units), negligible lab effect, inconsistent factor rankings between batches
  - Paragraph 3: Practical implications -- no single optimal parameter set, batch-by-factor interaction, recommended multi-factor ANOVA approach
- Update "## Conclusions" to reference new visualizations
- Final verification: `npx astro check` and `npx astro build`

**Rationale for 3 plans:** Plan 1 is content restructuring + lab box plot additions (using existing generators). Plan 2 is the engineering-heavy plan creating 4 new SVG generators and wiring them in. Plan 3 is the synthesis writing. Each builds on the previous and has clear verification.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| All plot content under single heading | Named subsections per plot type with component calls | Phase 57 (standard) | Consistent cross-referencing, per-plot SEO, technique page linking |
| Textual description of DOE plots | SVG-rendered DOE visualizations | Phase 62 (this phase) | Visual parity with NIST, rich interactive-feeling static content |
| No bihistogram generator | Dedicated bihistogram.ts | Phase 62 (this phase) | Enables back-to-back comparison visualization |
| "Graphical Output and Interpretation" heading | "Response Variable Analysis" heading | Phase 62 (DOE template) | Correct DOE terminology distinguishing from standard template |

## Open Questions

1. **Should DOE SD plots use bars or points+lines?**
   - What we know: NIST uses bars for SD plots. The existing bar-plot.ts generator could be used. However, DOE mean plots use points+lines. Mixing visual styles within the same analysis section could be confusing.
   - What's unclear: Whether visual consistency (all point+line) or NIST fidelity (bars for SD) is more important.
   - Recommendation: Use a shared DOE mean plot generator that can operate in both "mean" and "sd" mode. Use the same point+line visual for both. This keeps visual consistency and simplifies the generator count.

2. **How many interaction plots per batch?**
   - What we know: With 3 factors (X1, X2, X3), there are 3 possible 2-factor interactions (X1*X2, X1*X3, X2*X3). NIST shows a matrix of all interactions.
   - What's unclear: Whether to show all 3 interactions per batch (6 plots total) or only the significant ones.
   - Recommendation: Show the top 2-3 ranked interaction effects per batch. For Batch 1: X1*X3 (-20.25) and X1*X2 (+9.70). For Batch 2: X1*X3 (-16.71). This matches NIST's emphasis on significant effects without overwhelming the page with 6 interaction plots.

3. **Should the bihistogram replace or supplement the batch histograms?**
   - What we know: CeramicStrengthPlots already supports `batch1-histogram` and `batch2-histogram` as separate plot types. The bihistogram shows both on one plot.
   - What's unclear: Whether to show the bihistogram alone (more compact, better comparison) or also keep separate batch histograms (more detail per batch).
   - Recommendation: Use the bihistogram as the primary visualization in the Batch Effect section. Remove the separate batch histograms to avoid redundancy. The bihistogram provides better visual comparison, which is the whole point.

4. **Interaction plot format: 2D line plot or interaction effects matrix?**
   - What we know: NIST uses an interaction effects matrix (upper triangular matrix of subplots). This is complex to implement as a single SVG.
   - What's unclear: Whether the full matrix is needed or individual interaction line plots suffice.
   - Recommendation: Use individual interaction line plots (one per significant interaction). This is simpler to implement, easier to read, and the ranked effects tables already provide the quantitative summary. The matrix format is a NIST software artifact, not an inherently superior visualization.

## Sources

### Primary (HIGH confidence)
- NIST Section 1.4.2.10: Ceramic Strength case study structure (6 sub-pages)
  - 1.4.2.10.1: Background and Data -- 480 obs, 8 labs, 2 batches, 3 primary factors
  - 1.4.2.10.2: Response Variable Analysis -- 4-plot, bimodal histogram, run sequence, lag, probability
  - 1.4.2.10.3: Batch Effect Analysis -- bihistogram, QQ plot, box plot, block plots, F-test (1.123), t-test (13.38)
  - 1.4.2.10.4: Lab Effect Analysis -- box plots by lab overall, by batch
  - 1.4.2.10.5: Primary Factors Analysis -- DOE scatter, DOE mean, DOE SD, interaction effects
  - 1.4.2.10.6: Conclusions
- Codebase: `ceramic-strength.mdx` -- 266 lines, verified all existing content
- Codebase: `CeramicStrengthPlots.astro` -- 8 existing plot types (4-plot, run-sequence, lag, histogram, probability, batch-box-plot, batch1-histogram, batch2-histogram)
- Codebase: `datasets.ts` -- `CeramicStrengthObs` interface with lab, strength, tableSpeed, downFeed, wheelGrit, batch, rep fields
- Codebase: `case-study-template.md` -- DOE Variation template structure (lines 235-337)
- Codebase: `url-cross-reference.md` -- bihistogram, block-plot, doe-plots, mean-plot slugs confirmed
- Codebase: `bar-plot.ts` -- existing bar plot generator (groups, error bars) -- can inform DOE generators
- Codebase: `box-plot.ts` -- existing box plot generator (multiple groups) -- reusable for lab box plots
- Codebase: `histogram.ts` -- existing histogram generator -- informs bihistogram design
- Codebase: `plot-base.ts` -- shared SVG foundation all generators must use
- Codebase: `statistics.ts` -- `mean()` function available for computing group means

### Secondary (MEDIUM confidence)
- NIST bihistogram description (Section 1.3.3.2): Two adjoined histograms, top/bottom on shared x-axis
- NIST block plot description (Section 1.3.3.3): Response means by block with primary factor symbols
- NIST DOE mean plot description (Section 1.3.3.12): Mean response by factor level, line+point format
- NIST interaction effects matrix description (Section 5.5.9.4): Upper triangular matrix of mean plots for main effects and interactions

### Tertiary (LOW confidence)
- Exact visual style of NIST DOE plots: The NIST handbook images are low-resolution and some pages redirected (NIST migration). The generator designs are based on textual descriptions and general DOE plotting conventions. The visual output should be validated against the NIST pages that are accessible.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all infrastructure verified present in codebase, d3 dependencies already available
- Architecture: HIGH -- DOE Variation template explicitly defined in case-study-template.md, data model fully supports factor grouping
- Gap analysis: HIGH -- compared current MDX line-by-line against DOE template and requirements
- SVG generator design: MEDIUM -- design patterns are sound and based on existing generators, but the 4 new generators have not been implemented yet
- NIST values: HIGH -- all quantitative values already present in the MDX and verified correct
- Pitfalls: HIGH -- identified from structural uniqueness of DOE case study, bin alignment issues, batch-factor interaction complexity

**Research date:** 2026-02-27
**Valid until:** 2026-03-29 (stable content domain, no technology changes expected)
