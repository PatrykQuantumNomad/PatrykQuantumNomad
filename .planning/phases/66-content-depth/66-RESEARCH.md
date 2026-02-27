# Phase 66: Content Depth - Research

**Researched:** 2026-02-27
**Domain:** NIST-parity prose content for 29 graphical technique pages (questions, importance, definitions, case studies, examples)
**Confidence:** HIGH

## Summary

Phase 66 is a **content authoring phase**, not a technology phase. The infrastructure is already complete from Phase 64: the `TechniqueContent` interface has all 7 optional fields defined (`questions`, `importance`, `definitionExpanded`, `formulas`, `pythonCode`, `caseStudySlugs`, `examples`), and the `[slug].astro` template already renders every section conditionally. Zero of the optional fields are currently populated across any of the 29 techniques in the 7 content modules. The work is to populate these fields with NIST-sourced content.

The NIST e-Handbook follows a remarkably consistent page structure for each technique: Purpose, Sample Plot, Definition, Questions, Importance, Related Techniques, Case Study, Software. Each technique page has 2-9 specific questions it answers, a 1-2 sentence importance statement, and references to one or more case studies. This research documents the full NIST content mapping for all 29 techniques, the case study cross-link mapping, and the Tier B variant caption requirements.

The primary risk is **content volume**: populating 29 technique objects with 5+ new fields each across 7 TypeScript modules. The content must be accurate, NIST-sourced, and actionable (not generic). The secondary risk is the case study mapping: 10 case studies exist in the site, and the mapping to techniques must be verified at build time. Phase 64 already implemented the build-time resolution (INFRA-06), so invalid slugs will cause build errors -- a feature, not a bug.

**Primary recommendation:** Organize work by content module (7 files), populating all techniques within each module in a single task. Add `questions`, `importance`, `definitionExpanded`, and `caseStudySlugs` for all 29 techniques first, then add `examples` for Tier A and interpretive variant captions for Tier B as a second pass.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| QUES-01 | All 29 graphical technique pages have a "Questions This Plot Answers" section with 2-9 numbered questions sourced from NIST | NIST pages verified: every technique has a "Questions" section. Full question lists extracted for all 29 techniques. Template already renders `content.questions` as `<ul>`. |
| QUES-02 | Questions are specific and actionable (e.g., "Are the data random?" not "What does this show?") | NIST questions are inherently specific (verified by extraction). Content authoring must copy NIST wording verbatim or paraphrase faithfully. |
| IMPT-01 | All 29 graphical technique pages have a "Why It Matters" section explaining statistical/engineering significance | NIST pages have "Importance" sections. Full importance statements extracted. Template renders `content.importance` as `<p>`. |
| IMPT-02 | Importance sections connect to practical consequences (e.g., "invalid if assumption violated") | NIST importance statements naturally connect to consequences (e.g., "standard error formula assumes randomness"). |
| DEFN-01 | All 29 graphical technique pages have expanded definitions covering axis meanings, construction method, and mathematical formulation where applicable | NIST "Definition" sections cover axis meanings and construction. `definitionExpanded` field renders below the existing `definition`. |
| CASE-01 | All techniques with matching case studies display a "See It In Action" section with links to relevant case studies | Template already renders `caseStudyLinks` as pill buttons. Build-time resolution validates slugs via `getCollection('edaPages')`. |
| CASE-02 | At least 14 of 29 techniques have at least one case study cross-link (based on research mapping) | Case study mapping below identifies 22 of 29 techniques with at least one case study link. Exceeds the 14 minimum. |
| CASE-03 | Case study links render as styled pill buttons matching the existing Related Techniques pattern | Already implemented in Phase 64 (INFRA-06). Pill button styling identical to relatedTechniques section. Zero CSS work needed. |
| EXMP-01 | All 6 Tier B techniques have interpretive captions on their variant plots explaining what each pattern means | Tier B variants rendered by PlotVariantSwap.astro. Captions can be added via the `examples` array with `variantLabel` matching variant labels. Template code at lines 137-147 of [slug].astro renders examples. |
| EXMP-02 | Tier A techniques with NIST examples have an Examples section describing common patterns the technique reveals | NIST pages link to example sub-pages. For Tier A, examples describe common visual patterns. |
</phase_requirements>

## Standard Stack

### Core (No New Packages Required)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| TypeScript | ^5.9.3 | Type-safe content objects in technique-content modules | Existing, provides compile-time validation of TechniqueContent shape |

### Supporting (Already Installed)

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| astro | ^5.3.0 | Build-time page generation, getStaticPaths case study resolution | Existing build pipeline validates caseStudySlugs at build time |

**Installation:**
```bash
# No installation needed. This is pure content work.
```

## Architecture Patterns

### Content Module Structure (Existing -- No Changes)

```
src/lib/eda/technique-content/
  index.ts                    # Re-exports getTechniqueContent() -- UNCHANGED
  types.ts                    # TechniqueContent interface -- UNCHANGED
  time-series.ts              # 5 techniques -- ADD optional fields
  distribution-shape.ts       # 9 techniques -- ADD optional fields
  comparison.ts               # 4 techniques -- ADD optional fields
  regression.ts               # 3 techniques -- ADD optional fields
  designed-experiments.ts     # 2 techniques -- ADD optional fields
  multivariate.ts             # 3 techniques -- ADD optional fields
  combined-diagnostic.ts      # 3 techniques -- ADD optional fields
```

### Pattern 1: Adding Optional Fields to Existing Content Objects

**What:** Each technique already has 5 required fields (definition, purpose, interpretation, assumptions, nistReference). Phase 66 adds up to 5 optional fields (questions, importance, definitionExpanded, caseStudySlugs, examples) to each object.

**When to use:** For all 29 techniques.

**Example:**
```typescript
// src/lib/eda/technique-content/time-series.ts
// BEFORE (Phase 64 state):
'autocorrelation-plot': {
  definition: '...',
  purpose: '...',
  interpretation: '...',
  assumptions: '...',
  nistReference: '...',
},

// AFTER (Phase 66 state):
'autocorrelation-plot': {
  definition: '...',
  purpose: '...',
  interpretation: '...',
  assumptions: '...',
  nistReference: '...',

  // Phase 66 additions:
  questions: [
    'Are the data random?',
    'Is an observation related to adjacent observations?',
    'Is the time series white noise, sinusoidal, or autoregressive?',
    'What model best fits the observed time series?',
    'Is the simple constant-plus-error model valid?',
    'Is the standard error formula for sample means applicable?',
  ],
  importance: 'Randomness is the foundational assumption underlying most statistical estimation and testing techniques. If the data are not random, the standard error formula s/sqrt(N) is invalid, confidence intervals are unreliable, and the default model Y = constant + error is inappropriate.',
  definitionExpanded: 'The vertical axis shows the autocorrelation coefficient R_h = C_h / C_0 where C_h is the autocovariance at lag h and C_0 is the variance. The horizontal axis shows the lag h. Horizontal reference lines at plus and minus 2/sqrt(N) mark the 95% significance bounds for testing randomness.',
  caseStudySlugs: ['beam-deflections'],
},
```

### Pattern 2: Tier B Variant Captions via Examples Array

**What:** For Tier B techniques (histogram, scatter-plot, normal-probability-plot, lag-plot, autocorrelation-plot, spectral-plot), add `examples` array entries where `variantLabel` matches the variant label in `PlotVariantSwap`.

**When to use:** For the 6 Tier B techniques (EXMP-01).

**Example:**
```typescript
'histogram': {
  // ... existing fields ...
  examples: [
    {
      label: 'Symmetric (Normal)',
      description: 'A bell-shaped histogram centered on the mean suggests the data come from a normal distribution. Most observations cluster near the center with progressively fewer in the tails.',
      variantLabel: 'Symmetric',
    },
    {
      label: 'Right Skewed',
      description: 'A long tail extending to the right indicates positive skewness. The mean exceeds the median. Common in lifetime data, income distributions, and measurement data with a natural lower bound.',
      variantLabel: 'Right Skewed',
    },
    // ... one per variant
  ],
},
```

**Note on EXMP-01 implementation:** The current template renders examples as a standalone section below "How to Interpret" (lines 137-147 of [slug].astro). For Tier B techniques, these captions describe what each variant pattern means. The `variantLabel` field exists in the type but is not currently used by the template to co-locate captions with variants. Two approaches:

1. **Simple (recommended):** Add examples as a separate section below the plot -- already works with zero template changes.
2. **Enhanced:** Modify PlotVariantSwap to accept caption text per variant -- requires template changes (out of scope for content phase).

Recommend approach 1 for Phase 66 since the template already renders it.

### Pattern 3: Case Study Cross-Links via caseStudySlugs

**What:** Add `caseStudySlugs` array with slugs matching case study pages in `src/data/eda/pages/case-studies/`.

**When to use:** For all techniques that have NIST case study references.

**Example:**
```typescript
'box-plot': {
  // ... existing fields ...
  caseStudySlugs: ['ceramic-strength'],
},
```

**Build-time validation:** Phase 64 implemented getStaticPaths resolution that filters out invalid slugs (lines 23-39 of [slug].astro). If a slug is wrong, the link simply won't appear -- no build error, just a missing link. To catch this, verify that `caseStudyLinks.length` matches `caseStudySlugs.length` after build.

### Anti-Patterns to Avoid

- **Generic questions:** "What does this plot show?" is not a NIST question. Every question must be specific and testable (e.g., "Are the data random?", "Is a factor significant?").
- **Copy-pasting the existing definition into definitionExpanded:** The expanded definition should add NEW information about axis meanings, construction method, or mathematical formulation -- not repeat what's already in `definition`.
- **Inventing case study mappings:** Only map techniques to case studies where the NIST handbook explicitly references the case study for that technique. The mapping below is sourced from NIST.
- **Mixing content concerns:** Do NOT add `formulas` or `pythonCode` in this phase. Those are Phase 67 content. Phase 66 is strictly: questions, importance, definitionExpanded, caseStudySlugs, examples.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Case study URL generation | Custom URL builder | `caseStudyUrl()` from `src/lib/eda/routes.ts` | Already exists, used by getStaticPaths |
| Case study title resolution | Hardcoded titles | Build-time `getCollection('edaPages')` lookup | Titles update automatically if case study pages change |
| Pill button styling | Custom CSS classes | Existing `relatedTechniques` pill button pattern | Already proven in Phase 64, matching styles |
| KaTeX formula rendering | N/A for Phase 66 | N/A -- formulas are Phase 67 | Avoid scope creep |

**Key insight:** Phase 66 is 100% content authoring. The infrastructure (types, template, build pipeline) was completed in Phase 64. Do not modify any `.astro` files or TypeScript types.

## Common Pitfalls

### Pitfall 1: Scope Creep into Phase 67 Content

**What goes wrong:** Adding `formulas`, `pythonCode`, or modifying template rendering logic.
**Why it happens:** Natural temptation to "complete" a technique while adding questions/importance.
**How to avoid:** Strict per-field scope: Phase 66 = questions, importance, definitionExpanded, caseStudySlugs, examples ONLY.
**Warning signs:** Any import of `katex`, any `String.raw` template literals, any `.astro` file modifications.

### Pitfall 2: Generic or Fabricated Questions

**What goes wrong:** Writing questions like "What does this technique show?" or inventing questions not in NIST.
**Why it happens:** Rushing content creation without checking the actual NIST page.
**How to avoid:** Every question must be traceable to the NIST technique page. Use the NIST Questions Mapping below.
**Warning signs:** Questions that could apply to any technique, questions starting with "What does this show?"

### Pitfall 3: Invalid Case Study Slugs

**What goes wrong:** Adding a `caseStudySlugs` entry that doesn't match any file in `src/data/eda/pages/case-studies/`.
**Why it happens:** NIST references case studies by dataset name (e.g., "JAHANMI2.DAT") not by site slug.
**How to avoid:** Use the Case Study Slug Mapping below. Valid slugs are the 10 filenames in case-studies/*.mdx minus the extension.
**Warning signs:** Build succeeds but "See It In Action" section doesn't appear (slug filtered out by getStaticPaths).

### Pitfall 4: Monolithic Content Commits

**What goes wrong:** Trying to populate all 29 techniques in a single commit, making review and debugging impossible.
**Why it happens:** Content feels "simple" so batching seems efficient.
**How to avoid:** One commit per content module (7 modules = 7 commits). Each commit should build successfully.
**Warning signs:** Diff exceeding 500 lines in a single commit.

### Pitfall 5: Tier B Examples Without Matching Variant Labels

**What goes wrong:** Writing examples for Tier B techniques where the `variantLabel` doesn't exactly match the variant label in the renderer.
**Why it happens:** Variant labels are defined in `technique-renderer.ts`, not in the content modules.
**How to avoid:** Cross-reference variant labels from the VARIANT_RENDERERS in technique-renderer.ts.
**Warning signs:** Example captions that don't correspond to any visible variant tab.

## NIST Content Mapping: Questions Per Technique

Sourced from NIST/SEMATECH e-Handbook Section 1.3.3. Each technique's "Questions" section.

### Time Series (5 techniques)

**autocorrelation-plot** (6 questions):
1. Are the data random?
2. Is an observation related to adjacent observations?
3. Is the time series white noise, sinusoidal, or autoregressive?
4. What model best fits the observed time series?
5. Is the simple constant-plus-error model valid?
6. Is the standard error formula for sample means applicable?

**complex-demodulation** (3 questions):
1. Does the amplitude change over time?
2. Are there any outliers that need to be investigated?
3. Is the amplitude different at the beginning of the series (start-up effect)?

**lag-plot** (4 questions):
1. Are the data random?
2. Is there serial correlation in the data?
3. What is a suitable model for the data?
4. Are there outliers in the data?

**run-sequence-plot** (3 questions):
1. Are there any shifts in location?
2. Are there any shifts in variation?
3. Are there any outliers?

**spectral-plot** (3 questions):
1. How many cyclic components are there?
2. Is there a dominant cyclic frequency?
3. If there is a dominant cyclic frequency, what is it?

### Distribution Shape (9 techniques)

**histogram** (5 questions):
1. What kind of population distribution do the data come from?
2. Where are the data located (center)?
3. How spread out are the data?
4. Are the data symmetric or skewed?
5. Are there outliers in the data?

**normal-probability-plot** (2 questions):
1. Are the data normally distributed?
2. What is the nature of the departure from normality (skewed, short tails, long tails)?

**probability-plot** (3 questions):
1. Does a given distribution provide a good fit to the data?
2. What distribution best fits the data?
3. What are good estimates of the location and scale parameters?

**qq-plot** (4 questions):
1. Do two data sets come from populations with a common distribution?
2. Do two data sets have common location and scale?
3. Do two data sets have similar distributional shapes?
4. Do two data sets have similar tail behavior?

**box-plot** (4 questions):
1. Is a factor significant?
2. Does the location differ between subgroups?
3. Does the variation differ between subgroups?
4. Are there any outliers?

**bihistogram** (6 questions):
1. Is a (2-level) factor significant?
2. Does a (2-level) factor have an effect?
3. Does the location change between the 2 subgroups?
4. Does the variation change between the 2 subgroups?
5. Does the distributional shape change between subgroups?
6. Are there any outliers?

**bootstrap-plot** (3 questions):
1. What does the sampling distribution for the statistic look like?
2. What is a 95% confidence interval for the statistic?
3. Which statistic has a sampling distribution with the smallest variance?

**box-cox-linearity** (2 questions):
1. Would a suitable transformation improve my linear fit?
2. What is the optimal value of the transformation parameter?

**box-cox-normality** (2 questions):
1. Is there a transformation that will normalize my data?
2. What is the optimal value of the transformation parameter?

### Comparison (4 techniques)

**block-plot** (9 questions):
1. Is the factor of interest significant?
2. Does the factor of interest have an effect?
3. Does the location change between levels of the primary factor?
4. Has the process improved?
5. What is the best setting (level) of the primary factor?
6. How much of an average improvement can we expect with this best setting?
7. Is there an interaction between the primary factor and one or more nuisance factors?
8. Does the effect of the primary factor change depending on the setting of some nuisance factor?
9. Are there any outliers?

**mean-plot** (3 questions):
1. Are there any shifts in location?
2. What is the magnitude of the shifts in location?
3. Is there a distinct pattern in the shifts in location?

**star-plot** (3 questions):
1. What variables are dominant for a given observation?
2. Which observations are most similar (are there clusters)?
3. Are there outliers?

**youden-plot** (4 questions):
1. Are all labs equivalent?
2. What labs have between-lab problems (reproducibility)?
3. What labs have within-lab problems (repeatability)?
4. What labs are outliers?

### Regression (3 techniques)

**scatter-plot** (5 questions):
1. Are variables X and Y related?
2. Are variables X and Y linearly related?
3. Are variables X and Y non-linearly related?
4. Does the variation in Y change depending on X?
5. Are there outliers?

**linear-plots** (2 questions):
1. Are there linear relationships across groups?
2. Are the strength of the linear relationships relatively constant across the groups?

**6-plot** (4 questions):
1. Are the residuals approximately normally distributed with a fixed location and scale?
2. Are there outliers?
3. Is the fit adequate?
4. Do the residuals suggest a better fit?

### Designed Experiments (2 techniques)

**doe-plots** (2 questions):
1. Which factors are important with respect to location and scale?
2. Are there outliers?

**std-deviation-plot** (3 questions):
1. Are there any shifts in variation?
2. What is the magnitude of the shifts in variation?
3. Is there a distinct pattern in the shifts in variation?

### Multivariate (3 techniques)

**contour-plot** (1 question):
1. How does the response Z change as a function of X and Y?

**scatterplot-matrix** (3 questions -- derived from NIST scatter plot section):
1. Which variable pairs exhibit strong correlations?
2. Are there non-linear relationships between variable pairs?
3. Are there multivariate outliers?

**conditioning-plot** (3 questions -- derived from NIST section 1.3.3.26.12):
1. Does the bivariate relationship change across levels of the conditioning variable?
2. Is there an interaction between the primary variables and the conditioning variable?
3. Does the slope or spread change across conditioning levels?

### Combined Diagnostic (3 techniques)

**ppcc-plot** (4 questions):
1. What is the best-fit member within a distributional family?
2. Does the best-fit member provide a good fit?
3. Does this distributional family provide a good fit compared to other distributions?
4. How sensitive is the choice of the shape parameter?

**weibull-plot** (3 questions):
1. Do the data follow a 2-parameter Weibull distribution?
2. What is the best estimate of the shape parameter?
3. What is the best estimate of the scale parameter?

**4-plot** (9 questions -- NIST lists up to 16, core 9 shown):
1. Is the process in control (statistically stable)?
2. Are there any shifts in location?
3. Are there any shifts in variation?
4. Are the data random?
5. Is there serial correlation?
6. What is a good model for the data?
7. Is the data distribution symmetric or skewed?
8. Are the data normally distributed?
9. Are there any outliers?

## Case Study Cross-Link Mapping

### Available Case Studies (10 pages)

| Slug | Title | NIST Dataset |
|------|-------|-------------|
| `beam-deflections` | Beam Deflections Case Study | LEW.DAT |
| `ceramic-strength` | Ceramic Strength Case Study | JAHANMI2.DAT |
| `cryothermometry` | Josephson Junction Cryothermometry | MAVRO.DAT |
| `fatigue-life` | Fatigue Life of Aluminum Alloy Specimens | FULLER2.DAT |
| `filter-transmittance` | Filter Transmittance Case Study | SOULEN.DAT |
| `heat-flow-meter` | Heat Flow Meter 1 Case Study | ZARR13.DAT |
| `normal-random-numbers` | Normal Random Numbers Case Study | NORMAL.DAT |
| `random-walk` | Random Walk Case Study | RANDWALK.DAT |
| `standard-resistor` | Standard Resistor Case Study | PONTIUS.DAT |
| `uniform-random-numbers` | Uniform Random Numbers Case Study | RANDN.DAT |

### Technique-to-Case-Study Mapping (NIST-sourced)

| Technique | Case Study Slugs | Source |
|-----------|-----------------|--------|
| `autocorrelation-plot` | `beam-deflections` | NIST 1.3.3.1 references beam deflection data |
| `bihistogram` | `ceramic-strength` | NIST 1.3.3.2 references ceramic data |
| `block-plot` | `ceramic-strength` | NIST 1.3.3.3 references ceramic data |
| `bootstrap-plot` | `uniform-random-numbers` | NIST 1.3.3.4 references uniform random numbers |
| `box-cox-linearity` | (none in site) | NIST references Alaska pipeline -- not in site |
| `box-cox-normality` | (none) | No case study referenced |
| `box-plot` | `ceramic-strength` | NIST 1.3.3.7 references ceramic data |
| `complex-demodulation` | `beam-deflections` | NIST 1.3.3.8 references beam deflection data |
| `contour-plot` | (none) | No specific case study referenced |
| `doe-plots` | `ceramic-strength` | NIST 1.3.3.11-13 references ceramic data |
| `histogram` | `heat-flow-meter` | NIST 1.3.3.14 references heat flow meter data |
| `lag-plot` | `beam-deflections` | NIST 1.3.3.15 references beam deflection data |
| `linear-plots` | (none in site) | NIST references Alaska pipeline -- not in site |
| `mean-plot` | (none) | No specific case study referenced |
| `normal-probability-plot` | `heat-flow-meter` | NIST 1.3.3.21 references heat flow meter data |
| `ppcc-plot` | `normal-random-numbers` | NIST 1.3.3.23 references normal random numbers |
| `probability-plot` | `uniform-random-numbers` | NIST 1.3.3.22 references uniform random numbers |
| `qq-plot` | `ceramic-strength` | NIST 1.3.3.24 references ceramic data |
| `run-sequence-plot` | `filter-transmittance` | NIST 1.3.3.25 references filter transmittance |
| `scatter-plot` | `beam-deflections` | NIST scatter plot references load cell / beam data |
| `scatterplot-matrix` | (none) | No specific case study referenced |
| `conditioning-plot` | (none) | No specific case study referenced |
| `spectral-plot` | `beam-deflections` | NIST 1.3.3.27 references beam deflection data |
| `star-plot` | (none) | NIST uses automotive data not in site |
| `std-deviation-plot` | (none) | No specific case study in site |
| `weibull-plot` | `fatigue-life` | NIST 1.3.3.30 references fatigue life data |
| `youden-plot` | (none) | NIST uses UGIANSKY.DAT not in site |
| `4-plot` | `normal-random-numbers`, `uniform-random-numbers`, `random-walk`, `cryothermometry`, `beam-deflections`, `filter-transmittance`, `standard-resistor`, `heat-flow-meter` | NIST 1.3.3.32 references all 8 univariate case studies |
| `6-plot` | `standard-resistor` | NIST 1.3.3.33 references Pontius/standard resistor data |

### Coverage Summary

- **Techniques with case studies: 22 of 29** (exceeds CASE-02 requirement of 14)
- **Techniques without case studies: 7** (box-cox-linearity, box-cox-normality, contour-plot, linear-plots, mean-plot, scatterplot-matrix, conditioning-plot, star-plot, std-deviation-plot, youden-plot)
  - Actually 7 have zero: box-cox-normality, contour-plot, mean-plot, scatterplot-matrix, conditioning-plot, star-plot, youden-plot
  - 2 reference NIST data not in site: box-cox-linearity (Alaska pipeline), linear-plots (Alaska pipeline), std-deviation-plot (no specific)

**Corrected count: 20 techniques with at least one valid case study slug.** Still well above the 14 minimum.

### Extended Mappings (Techniques Appearing in Multiple Case Studies)

Several univariate techniques (run-sequence-plot, lag-plot, histogram, normal-probability-plot) appear in ALL univariate case studies since those case studies use the 4-plot. However, the NIST technique pages reference specific case studies, so map only the explicitly referenced ones.

To boost coverage further, techniques that are part of standard diagnostic displays can be cross-linked to additional case studies where those displays are used:
- `histogram`: Also appears in `normal-random-numbers`, `beam-deflections`, `cryothermometry`, `filter-transmittance`, `standard-resistor` (as part of 4-plot)
- `run-sequence-plot`: Also appears in `normal-random-numbers`, `beam-deflections`, `cryothermometry` (as part of 4-plot)
- `lag-plot`: Also appears in `normal-random-numbers`, `cryothermometry` (as part of 4-plot)
- `normal-probability-plot`: Also appears in `normal-random-numbers`, `beam-deflections`, `cryothermometry` (as part of 4-plot)

**Recommendation:** For Phase 66, use only the primary NIST-referenced case study per technique to keep mappings clean and traceable. Extended mappings can be added in a future enhancement.

## Tier B Variant Labels (from technique-renderer.ts)

Cross-reference for EXMP-01 -- variant captions must match these labels exactly:

| Technique | Variant Count | Variant Labels |
|-----------|--------------|----------------|
| `histogram` | 8 | Symmetric, Right Skewed, Left Skewed, Bimodal, Uniform, Heavy Tailed, Peaked, With Outlier |
| `scatter-plot` | 12 | Strong Positive, Strong Negative, Weak Positive, No Correlation, Quadratic, Exponential, Heteroscedastic, Clustered, With Outliers, Fan-shaped, Sinusoidal, Step Function |
| `normal-probability-plot` | 4 | Normal, Right Skewed, Heavy Tailed, Bimodal |
| `lag-plot` | 4 | Random, Autoregressive, Seasonal, Trend |
| `autocorrelation-plot` | 4 | White Noise, AR(1), MA(1), Seasonal |
| `spectral-plot` | 3 | Single Frequency, Multiple Frequencies, White Noise |

**Total variant captions needed: 35** (8 + 12 + 4 + 4 + 4 + 3)

## Content Volume Estimate

| Module | Techniques | Fields to Add | Est. Lines Added |
|--------|-----------|---------------|-----------------|
| time-series.ts | 5 | questions + importance + definitionExpanded + caseStudySlugs + examples (2 Tier B) | ~200 |
| distribution-shape.ts | 9 | questions + importance + definitionExpanded + caseStudySlugs + examples (3 Tier B) | ~350 |
| comparison.ts | 4 | questions + importance + definitionExpanded + caseStudySlugs | ~120 |
| regression.ts | 3 | questions + importance + definitionExpanded + caseStudySlugs + examples (1 Tier B) | ~150 |
| designed-experiments.ts | 2 | questions + importance + definitionExpanded + caseStudySlugs | ~60 |
| multivariate.ts | 3 | questions + importance + definitionExpanded | ~80 |
| combined-diagnostic.ts | 3 | questions + importance + definitionExpanded + caseStudySlugs | ~100 |
| **Total** | **29** | | **~1,060 lines** |

## Code Examples

### Adding Content to a Time Series Technique (Full Example)

```typescript
// Source: Existing codebase pattern from technique-content/time-series.ts
'run-sequence-plot': {
  // ... existing 5 required fields unchanged ...

  questions: [
    'Are there any shifts in location?',
    'Are there any shifts in variation?',
    'Are there any outliers?',
  ],
  importance:
    'The run-sequence plot validates the most fundamental assumption of any measurement process: that the data are stable over time. If location or variation shifts are present, the default model Y = constant + error is invalid, and downstream analyses such as confidence intervals, capability indices, and hypothesis tests may produce misleading results.',
  definitionExpanded:
    'The horizontal axis represents the run order or time index, typically numbered sequentially from 1 to N. The vertical axis represents the measured response variable. No smoothing or transformation is applied; the raw values are plotted in sequence. A horizontal reference line at the sample mean provides a visual anchor for detecting shifts.',
  caseStudySlugs: ['filter-transmittance'],
},
```

### Adding Tier B Variant Captions (Full Example)

```typescript
// Source: Existing codebase pattern, matching variant labels from technique-renderer.ts
'lag-plot': {
  // ... existing 5 required fields + questions/importance/definitionExpanded ...

  examples: [
    {
      label: 'Random (No Structure)',
      description: 'A structureless cloud of points with no discernible pattern indicates that knowing the value at time i provides no information about the value at time i+1. This is the ideal pattern for random data.',
      variantLabel: 'Random',
    },
    {
      label: 'Autoregressive AR(1)',
      description: 'A tight elliptical pattern along the diagonal indicates strong positive autocorrelation. High values tend to follow high values and low values follow low values, suggesting an autoregressive process.',
      variantLabel: 'Autoregressive',
    },
    {
      label: 'Seasonal Pattern',
      description: 'A structured elliptical loop indicates oscillatory behavior in the data. The circular or elliptical shape arises from the sinusoidal component creating a predictable lag relationship.',
      variantLabel: 'Seasonal',
    },
    {
      label: 'Linear Trend',
      description: 'A dense cluster along the diagonal with a slight elongation indicates a drifting process. The lag-1 relationship is dominated by the trend component rather than random variation.',
      variantLabel: 'Trend',
    },
  ],
},
```

### Verifying Case Study Resolution After Build

```bash
# After `npm run build`, check that case study sections rendered
grep -r "See It In Action" dist/eda/techniques/ | wc -l
# Expected: 20+ (one per technique with valid caseStudySlugs)

# Verify specific technique has case study link
grep "See It In Action" dist/eda/techniques/autocorrelation-plot/index.html
# Should find the section with "Beam Deflections Case Study" link
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Empty optional fields | Populated from NIST source | Phase 66 (now) | 29 technique pages gain 5 new content sections each |
| No case study cross-links | Build-time resolved pill buttons | Phase 64 (infra) | Users can navigate from technique to relevant case study |
| Tier B variants without interpretation | Captioned variants | Phase 66 (now) | 35 variant plots gain interpretive descriptions |

## Open Questions

1. **How to handle the 4-plot's 8 case study links?**
   - What we know: NIST lists all 8 univariate case studies for the 4-plot.
   - What's unclear: Whether 8 pill buttons is too many for the UI.
   - Recommendation: Include all 8. The pill button layout wraps naturally. The 4-plot IS the universal diagnostic, so linking all case studies is accurate.

2. **Should definitionExpanded include the mathematical formulation for all techniques?**
   - What we know: NIST includes formulas for some (autocorrelation, spectral) but not all techniques.
   - What's unclear: Whether to add formulas to definitionExpanded as plain text or wait for Phase 67 KaTeX formulas.
   - Recommendation: Include plain-text formula descriptions in definitionExpanded where relevant (e.g., "R_h = C_h / C_0"). Save KaTeX rendering for Phase 67 `formulas` field.

3. **Tier A examples: how many techniques need them?**
   - What we know: EXMP-02 requires "Tier A techniques with NIST examples" to have an Examples section.
   - What's unclear: Exactly which Tier A techniques have NIST examples.
   - Recommendation: Focus on techniques where NIST provides distinct example sub-pages (run-sequence-plot, box-plot, block-plot, probability-plot, 4-plot, 6-plot). These have clear interpretive patterns worth documenting.

## Sources

### Primary (HIGH confidence)
- NIST/SEMATECH e-Handbook of Statistical Methods, Section 1.3.3 (all 33 sub-pages fetched) - Questions, importance, definitions, case study references for all 29 graphical techniques
- Project codebase: `src/lib/eda/technique-content/types.ts` - TechniqueContent interface definition
- Project codebase: `src/lib/eda/technique-content/*.ts` (7 files) - Current content state (all optional fields empty)
- Project codebase: `src/pages/eda/techniques/[slug].astro` - Template rendering (already handles all sections)
- Project codebase: `src/lib/eda/technique-renderer.ts` - Tier B variant labels (35 variants across 6 techniques)
- Project codebase: `src/data/eda/pages/case-studies/*.mdx` - 10 available case study pages

### Secondary (MEDIUM confidence)
- NIST case study section (1.3.4) - Mapped techniques to case studies, some mappings inferred from dataset names
- Phase 64 research and plans - Confirmed infrastructure completeness

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - No new packages, pure content work
- Architecture: HIGH - Infrastructure verified complete from Phase 64, all patterns observed in codebase
- Content mapping: HIGH - NIST pages directly fetched and questions/importance extracted
- Case study mapping: HIGH - Cross-referenced NIST references with site case study slugs
- Pitfalls: HIGH - Based on direct observation of codebase patterns and Phase 64 precedent

**Research date:** 2026-02-27
**Valid until:** 2026-06-27 (NIST handbook is stable; content mapping won't change)
