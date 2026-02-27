# Feature Research: EDA Graphical Techniques NIST Section Parity

**Domain:** EDA Visual Encyclopedia -- Graphical Technique Page Enhancement
**Researched:** 2026-02-27
**Confidence:** HIGH (sourced directly from NIST/SEMATECH handbook pages, verified against existing codebase)

---

## Context: What Exists Today vs. What NIST Provides

### Current State (29 Graphical Technique Pages)

Each page currently renders **5 content fields** from `technique-content.ts`:

| Current Section | Maps To NIST Section | Status |
|----------------|---------------------|--------|
| "What It Is" (definition) | Definition | Complete |
| "When to Use It" (purpose) | Purpose | Complete |
| "How to Interpret" (interpretation) | Part of Definition/Questions | Complete |
| "Assumptions and Limitations" (assumptions) | Partially in Importance | Complete |
| NIST Reference (nistReference) | Footer reference | Complete |
| Build-time SVG plot | Sample Plot | Complete |
| Related Techniques links | Related Techniques | Complete |
| PlotVariantSwap (Tier B) | Examples (partial) | Complete for 6 techniques |

### NIST Canonical Page Structure (from handbook crawl)

Every NIST graphical technique page follows this template (verified across 15+ pages):

| NIST Section | Present on All? | Currently Implemented? |
|-------------|----------------|----------------------|
| **Purpose** | YES (all 29) | YES (as "When to Use It") |
| **Sample Plot** | YES (all 29) | YES (SVG generators) |
| **Definition** | YES (all 29) | YES (as "What It Is") |
| **Questions** | YES (all 29) | **NO -- MISSING** |
| **Importance** | YES (most, ~25 of 29) | **NO -- MISSING** |
| **Examples** | YES (most, ~20 of 29) | PARTIAL (Tier B variants only) |
| **Related Techniques** | YES (all 29) | YES |
| **Case Study** | YES (most, ~22 of 29) | **NO -- MISSING (no cross-links)** |
| **Software** | YES (all 29) | **NO -- replaced by Python code** |

### Gap Summary

Three **entirely missing** NIST sections across all 29 pages:
1. **"Questions Answered"** -- Every NIST page lists 2-9 specific questions the technique answers
2. **"Importance"** -- Most NIST pages explain why the technique matters for engineering conclusions
3. **"Case Study" cross-links** -- NIST pages link to specific case studies; our case studies exist but are not linked from technique pages

Two **partially missing** sections:
4. **Formulas** -- ~12 of 29 graphical techniques have formulas on their NIST pages; 0 of 29 graphical pages currently show formulas (quantitative pages do)
5. **Python code examples** -- 0 of 29 graphical pages have Python code (quantitative pages do)

---

## Feature Landscape

### Table Stakes (Users Expect These)

Features that complete the NIST section parity contract. Missing these makes pages feel thin compared to the quantitative technique pages which already have formulas and Python code.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| **Questions Answered section** | Every NIST page has this; users visit to answer specific analytical questions | LOW | 2-9 bullet points per technique, pure content addition to `technique-content.ts` |
| **Importance section** | ~25 of 29 NIST pages have this; explains WHY this technique matters | LOW | 1-3 paragraphs per technique, pure content addition |
| **Case Study cross-links** | NIST pages link to case studies; our 10 case studies already exist but are orphaned from technique pages | LOW | Map technique-to-case-study relationships, render as links |
| **Expanded Definition with formulas** | ~12 techniques have formulas on NIST; autocorrelation, spectral, probability plots, Box-Cox, Weibull, PPCC all need math | MEDIUM | Requires adding `formulas` field to `TechniqueContent` interface, KaTeX rendering in `[slug].astro`, ~40 formula blocks total |
| **Python code examples** | Quantitative pages already have Python code; graphical pages without them feel incomplete by comparison | MEDIUM | 29 code snippets using matplotlib/seaborn/statsmodels, added to `technique-content.ts` |

### Differentiators (Competitive Advantage)

Features that go beyond NIST parity and make these pages uniquely valuable.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **Examples section with interpretation** | NIST lists example sub-pages but our Tier B variants already show 6 techniques with multiple patterns; extending interpretive text to variants makes them pedagogically rich | MEDIUM | Add interpretive captions per variant (e.g., "This right-skewed histogram suggests a lognormal or exponential model") |
| **Interactive "Try It" Python snippets** | Copyable Python code blocks with realistic sample data that users can paste into Jupyter | LOW | Already done for quantitative pages; extend the pattern |
| **Technique-to-Technique navigation flow** | NIST's "Related Techniques" section is just a list; adding contextual "When to use X instead of Y" guidance creates a decision tree | MEDIUM | Extends existing `relatedTechniques` with `whenToUseInstead` text |
| **Formula-to-Code mapping** | Show formula alongside the Python function that computes it | LOW | Combine existing formula and code sections with visual pairing |

### Anti-Features (Commonly Requested, Often Problematic)

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| **Client-side interactive plots (D3/Plotly)** | "Let users manipulate the data" | Adds massive JS bundle, SSR complexity, hydration bugs; site is static-first with build-time SVG | Keep build-time SVG plots; Python code examples let users reproduce interactively in their own environment |
| **Full NIST "Software" section** | NIST lists Dataplot/R availability | Dataplot is obsolete; users expect Python, not legacy tool lists | Replace with focused Python code examples using modern libraries |
| **Exhaustive formula derivations** | "Show all the math" | Turns technique pages into textbook chapters; overwhelms non-statistician visitors | Show 1-3 key formulas with brief explanations; link to NIST for full derivations |
| **Real dataset downloads** | "Let users download the NIST .DAT files" | Copyright/licensing ambiguity with NIST data files; adds file hosting burden | Python code examples generate synthetic data that demonstrates the same patterns |
| **Video tutorials per technique** | "Add video walkthroughs" | Production cost of 29 videos; maintenance burden; slows page load | Well-structured text + SVG + Python code is more searchable and scannable |

---

## Detailed Feature Specifications

### Feature 1: Questions Answered Section

**NIST source pattern:** Every technique page has a "Questions" section listing 2-9 specific questions the technique can answer, formatted as a bulleted list.

**Verified questions by technique (from NIST crawl):**

| Technique | # Questions | Sample Questions |
|-----------|-------------|------------------|
| Autocorrelation Plot | 9 | "Are the data random?", "Is an autoregressive model appropriate?", "Is the assumed model valid?" |
| Bihistogram | 6 | "Is a factor significant?", "Does the location differ?", "Does the variation differ?", "Does the distribution differ?" |
| Block Plot | 3 | "Are there block effects?", "Are there treatment effects?", "Which factors dominate?" |
| Bootstrap Plot | 3 | "What does the sampling distribution look like?", "What is a 95% CI?", "Which statistic has the narrowest CI?" |
| Box-Cox Linearity | 2 | "What power transformation maximizes linearity?", "Is a transformation needed?" |
| Box-Cox Normality | 2 | "What transformation normalizes the data?", "What is the optimal lambda?" |
| Box Plot | 4 | "Is a factor significant?", "Does location differ between subgroups?", "Does variation differ?", "Are there outliers?" |
| Complex Demodulation | 3 | "Is amplitude changing?", "Is phase changing?", "At what rate?" |
| Contour Plot | 1 | "How does Z change as a function of X and Y?" |
| DOE Plots | 2 | "Which factors are important with respect to location and scale?", "Are there outliers?" |
| Histogram | 5 | "What distribution?", "Where located?", "How spread?", "Symmetric or skewed?", "Outliers?" |
| Lag Plot | 4 | "Are the data random?", "Serial correlation?", "Suitable model?", "Outliers?" |
| Linear Plots | 2 | "Is the intercept/slope/correlation constant across groups?", "Is there a discernible pattern?" |
| Mean Plot | 3 | "Do location shifts exist?", "What is the magnitude?", "Is there a pattern?" |
| Normal Probability Plot | 2 | "Are the data normally distributed?", "What characterizes departures from normality?" |
| Probability Plot | 3 | "Does a specified distribution fit?", "Which distribution fits best?", "What are the parameter estimates?" |
| PPCC Plot | 4 | "Best-fit member of a family?", "How good is the fit?", "Comparison among distributions?", "Parameter sensitivity?" |
| Q-Q Plot | 4 | "Common distribution?", "Matching location/scale?", "Similar shapes?", "Comparable tail behavior?" |
| Run-Sequence Plot | 3 | "Location shifts?", "Variation shifts?", "Outliers?" |
| Scatter Plot | 5 | "Related?", "Linear?", "Non-linear?", "Does variation in Y depend on X?", "Outliers?" |
| Spectral Plot | 3 | "How many cyclic components?", "Dominant frequency?", "What is the frequency?" |
| Std Deviation Plot | 3 | "Do variation shifts exist?", "What is the magnitude?", "Is there a pattern?" |
| Star Plot | 3 | "Which variables dominate?", "Which observations cluster?", "Outliers?" |
| Weibull Plot | 3 | "Weibull distributed?", "Shape parameter?", "Scale parameter?" |
| Youden Plot | 3 | "Within-lab vs between-lab variability?", "Lab biases?", "Outlier labs?" |
| 4-Plot | 4 | "Random?", "Fixed distribution?", "Fixed location?", "Fixed variation?" |
| 6-Plot | 4 | "Residuals normal with fixed location/scale?", "Outliers?", "Model adequate?", "Better model?" |
| Scatterplot Matrix | 3 | "Pairwise correlations?", "Clusters?", "Outlier observations?" |
| Conditioning Plot | 3 | "Does the X-Y relationship change with Z?", "Interaction effects?", "Pattern across conditions?" |

**Implementation:**
- Add `questionsAnswered: string[]` field to `TechniqueContent` interface
- Render as a styled `<ul>` in the `[slug].astro` page between "When to Use It" and "How to Interpret"
- Each question is a short sentence ending in "?"
- Total: ~95 question strings across 29 techniques

**Complexity: LOW** -- Pure content authoring + 1 new field + ~10 lines of Astro template.

---

### Feature 2: Importance Section

**NIST source pattern:** Most technique pages have an "Importance" section explaining why the technique matters for engineering conclusions and which statistical assumptions it validates.

**Importance themes by technique (from NIST crawl):**

| Technique | Importance Theme |
|-----------|-----------------|
| Autocorrelation Plot | "Ensure validity of engineering conclusions" -- validates randomness assumption |
| Bihistogram | Validates 3 of 4 assumptions (location, variation, distribution) |
| Box Plot | "Important EDA tool for determining if a factor has a significant effect" |
| Bootstrap Plot | "Provides method for calculating uncertainty where formulas are impractical" |
| Contour Plot | "Necessary for understanding 3-D data" -- analogous to scatter plot for 2-D |
| Histogram | Reveals 5 key features: center, spread, skewness, outliers, multiple modes |
| Lag Plot | "Randomness is an underlying assumption for most statistical estimation" |
| Mean Plot | Validates constant-location assumption across groups |
| Normal Probability Plot | "Most statistical models assume normal residuals" |
| Probability Plot | Validates distributional assumptions for reliability applications |
| PPCC Plot | "Statistical analyses depend on distributional assumptions" |
| Run-Sequence Plot | Validates constant location and scale; "even in complex models when applied to residuals" |
| Scatter Plot | Identifies relationships; warns against assuming causation from association |
| Spectral Plot | "Primary technique for assessing cyclic nature of time series in frequency domain" |
| Std Deviation Plot | Validates constant-variation assumption across groups |
| Weibull Plot | "Check distributional assumptions" for reliability engineering |
| 4-Plot | Simultaneous check of all 4 underlying assumptions |
| 6-Plot | "Validating model" -- checks residual behavior in regression |

**Implementation:**
- Add `importance: string` field to `TechniqueContent` interface
- Render as a paragraph section after "Assumptions and Limitations"
- 2-4 sentences per technique emphasizing practical consequences
- Total: 29 importance paragraphs

**Complexity: LOW** -- Same pattern as Questions Answered.

---

### Feature 3: Case Study Cross-Links

**NIST source pattern:** Most technique pages link to 1-2 case studies that demonstrate the technique in practice. Our site has 10 case studies that already use these techniques in their analysis.

**Technique-to-Case-Study mapping (from NIST and existing case study content):**

| Technique | NIST Case Study Reference | Our Case Studies That Use It |
|-----------|--------------------------|------------------------------|
| Autocorrelation Plot | Beam deflections | normal-random-numbers, uniform-random-numbers, random-walk, beam-deflections, filter-transmittance, standard-resistor, heat-flow-meter, cryothermometry |
| Bihistogram | Ceramic strength | ceramic-strength |
| Block Plot | Ceramic strength | ceramic-strength |
| Bootstrap Plot | Uniform random numbers | uniform-random-numbers |
| Box-Cox Linearity | -- | -- |
| Box-Cox Normality | -- | -- |
| Box Plot | Ceramic strength | ceramic-strength |
| Complex Demodulation | -- | -- |
| Contour Plot | -- | -- |
| DOE Plots | Ceramic strength | ceramic-strength |
| Histogram | Heat flow meter | normal-random-numbers, uniform-random-numbers, random-walk, beam-deflections, filter-transmittance, standard-resistor, heat-flow-meter, cryothermometry, fatigue-life |
| Lag Plot | Beam deflections | normal-random-numbers, uniform-random-numbers, random-walk, beam-deflections, filter-transmittance, standard-resistor, heat-flow-meter, cryothermometry |
| Linear Plots | -- | -- |
| Mean Plot | -- | ceramic-strength |
| Normal Probability Plot | Normal random numbers | normal-random-numbers, uniform-random-numbers, random-walk, beam-deflections, filter-transmittance, standard-resistor, heat-flow-meter, cryothermometry, fatigue-life |
| Probability Plot | Fatigue life | fatigue-life |
| PPCC Plot | -- | fatigue-life |
| Q-Q Plot | Ceramic strength | ceramic-strength |
| Run-Sequence Plot | Filter transmittance | normal-random-numbers, uniform-random-numbers, random-walk, beam-deflections, filter-transmittance, standard-resistor, heat-flow-meter, cryothermometry |
| Scatter Plot | Load cell calibration | beam-deflections |
| Spectral Plot | Beam deflections | beam-deflections, standard-resistor |
| Std Deviation Plot | -- | ceramic-strength |
| Star Plot | -- | -- |
| Weibull Plot | Fatigue life | fatigue-life |
| Youden Plot | -- | -- |
| 4-Plot | Normal random numbers | normal-random-numbers, uniform-random-numbers, random-walk, beam-deflections, filter-transmittance, standard-resistor, heat-flow-meter, cryothermometry |
| 6-Plot | Alaska pipeline | -- |
| Scatterplot Matrix | -- | -- |
| Conditioning Plot | -- | -- |

**Implementation:**
- Add `caseStudies: Array<{ slug: string; title: string }>` field to `TechniqueContent` interface (or compute from a mapping object)
- Render as pill-style links (matching existing Related Techniques pattern) in a "See It In Action" section
- Only techniques with at least 1 linked case study get the section (~22 of 29)
- Alternative: Create a standalone mapping constant `TECHNIQUE_CASE_STUDY_MAP` for maintainability

**Complexity: LOW** -- Content mapping + ~15 lines of Astro template. Data already exists; just need the linkage.

---

### Feature 4: Formulas (KaTeX) for Graphical Techniques

**NIST source pattern:** ~12 of 29 graphical technique pages include mathematical formulas. The quantitative technique pages already render KaTeX formulas using the proven `katex.renderToString()` build-time pattern.

**Techniques requiring formulas:**

| Technique | Formula(s) Needed | KaTeX Complexity |
|-----------|-------------------|------------------|
| Autocorrelation Plot | r(h) = C_h/C_0, autocovariance C_h, confidence bands +/- z/sqrt(N) | HIGH (5-6 formulas) |
| Box-Cox Linearity | T(X) = (X^lambda - 1)/lambda | LOW (1 formula) |
| Box-Cox Normality | T(Y) = (Y^lambda - 1)/lambda, ln(Y) when lambda=0 | LOW (1-2 formulas) |
| Normal Probability Plot | N_i = G(U_i), Filliben approximation for U_i | MEDIUM (3 formulas) |
| Probability Plot | N_i = G(U_i) generalized | MEDIUM (2 formulas) |
| PPCC Plot | r = correlation coefficient from probability plot | LOW (1 formula) |
| Spectral Plot | Y_i = C + alpha*sin(2*pi*omega*t + phi) + E_i, power spectrum | MEDIUM (2-3 formulas) |
| Weibull Plot | Weibull CDF, log-log transformation, shape/scale extraction | MEDIUM (3-4 formulas) |
| Box Plot | Fence calculations: L1 = Q1 - 1.5*IQR, U1 = Q3 + 1.5*IQR | LOW (4 formulas) |
| Bootstrap Plot | Resampling definition | LOW (1 formula) |
| Q-Q Plot | Quantile mapping definition | LOW (1 formula) |
| 6-Plot | Y_i = f(X_i) + E_i | LOW (1 formula) |

**Total: ~40 formula blocks across 12 techniques**

**Implementation:**
- Extend `TechniqueContent` interface with optional `formulas?: Array<{ label: string; tex: string; explanation: string }>` (matching `QuantitativeContent` interface exactly)
- Update `[slug].astro` to import `katex` and render formulas in the `formula` slot (pattern already exists in `quantitative/[slug].astro`)
- Add `useKatex={true}` prop when formulas are present
- 17 techniques (no formulas) remain unchanged

**Complexity: MEDIUM** -- Template change is small (copy from quantitative), but authoring ~40 KaTeX formula strings with explanations requires careful validation.

---

### Feature 5: Python Code Examples

**NIST source pattern:** NIST's "Software" section lists Dataplot/R code. Modern users expect Python. The quantitative technique pages already show Python code using `astro-expressive-code`.

**Standard Python libraries per technique category:**

| Plot Category | Primary Library | Function | Techniques |
|-------------|----------------|----------|------------|
| Distribution plots | `matplotlib.pyplot` + `seaborn` | `sns.histplot()`, `plt.hist()` | histogram, bihistogram |
| Box plots | `matplotlib.pyplot` + `seaborn` | `sns.boxplot()`, `plt.boxplot()` | box-plot |
| Scatter plots | `matplotlib.pyplot` + `seaborn` | `sns.scatterplot()`, `plt.scatter()` | scatter-plot, youden-plot |
| Probability plots | `scipy.stats` | `scipy.stats.probplot()` | normal-probability-plot, probability-plot, qq-plot, weibull-plot, ppcc-plot |
| Time series | `matplotlib.pyplot` | `plt.plot()` | run-sequence-plot |
| Autocorrelation | `statsmodels` | `plot_acf()`, `plot_pacf()` | autocorrelation-plot |
| Lag plots | `pandas` | `pd.plotting.lag_plot()` | lag-plot |
| Spectral | `scipy.signal` + `matplotlib` | `scipy.signal.periodogram()`, `plt.semilogy()` | spectral-plot |
| Contour | `matplotlib.pyplot` | `plt.contour()`, `plt.contourf()` | contour-plot |
| Bar/Mean/SD | `matplotlib.pyplot` | `plt.bar()` | mean-plot, std-deviation-plot, block-plot |
| DOE | `matplotlib.pyplot` + `statsmodels` | Custom DOE plotting | doe-plots |
| Star/Radar | `matplotlib.pyplot` | Polar axes `plt.subplot(polar=True)` | star-plot |
| Multi-panel | `matplotlib.pyplot` | `fig, axes = plt.subplots()` | 4-plot, 6-plot, linear-plots, complex-demodulation, scatterplot-matrix |
| Conditional | `seaborn` | `sns.FacetGrid()` | conditioning-plot |
| Bootstrap | `numpy` + `matplotlib` | `np.random.choice()` + `plt.hist()` | bootstrap-plot |
| Box-Cox | `scipy.stats` | `scipy.stats.boxcox()`, `scipy.stats.boxcox_normplot()` | box-cox-linearity, box-cox-normality |

**Python code template pattern (matching quantitative pages):**

```python
import numpy as np
import matplotlib.pyplot as plt
# technique-specific imports

# Generate or load sample data
data = np.random.normal(0, 1, 200)

# Create the plot
fig, ax = plt.subplots(figsize=(8, 5))
# technique-specific plot code
ax.set_title('Technique Name')
ax.set_xlabel('X Label')
ax.set_ylabel('Y Label')
plt.tight_layout()
plt.show()
```

**Implementation:**
- Add `pythonCode?: string` field to `TechniqueContent` interface
- Update `[slug].astro` to import `Code` from `astro-expressive-code/components` and render in `code` slot (pattern already exists in `quantitative/[slug].astro`)
- Each code example is 10-25 lines, self-contained, generates synthetic data
- Total: 29 Python code strings

**Complexity: MEDIUM** -- Template change is trivial (copy from quantitative), but authoring 29 correct, runnable Python snippets requires validation.

---

### Feature 6: Variant Interpretation Captions (Differentiator)

**NIST source pattern:** NIST's "Examples" sections describe what each pattern looks like and what it means. Our Tier B variants show the visual patterns but lack interpretive text.

**Current Tier B variant coverage:**

| Technique | # Variants | Current State | Enhancement Needed |
|-----------|-----------|---------------|-------------------|
| Histogram | 8 | Label only ("Symmetric", "Right Skewed", etc.) | Add 1-2 sentence interpretation per variant |
| Scatter Plot | 12 | Label only ("Strong Positive", "Quadratic", etc.) | Add 1-2 sentence interpretation per variant |
| Normal Probability Plot | 4 | Label only ("Normal", "Right Skewed", etc.) | Add 1-2 sentence interpretation per variant |
| Lag Plot | 4 | Label only ("Random", "Autoregressive", etc.) | Add 1-2 sentence interpretation per variant |
| Autocorrelation Plot | 4 | Label only ("White Noise", "AR(1)", etc.) | Add 1-2 sentence interpretation per variant |
| Spectral Plot | 3 | Label only ("Single Frequency", "Multiple Frequencies", etc.) | Add 1-2 sentence interpretation per variant |

**Total: 35 interpretation captions**

**Implementation:**
- Extend variant data structure to include `interpretation: string`
- Render caption below each variant plot in `PlotVariantSwap.astro`
- Example: "Right Skewed -- The long right tail suggests a lognormal or exponential underlying distribution. Consider a log transformation before applying normal-theory tests."

**Complexity: MEDIUM** -- Requires changes to `PlotVariantSwap.astro` and `technique-renderer.ts` variant data structures, plus 35 content strings.

---

## Feature Dependencies

```
[Questions Answered]         (standalone, no deps)

[Importance Section]         (standalone, no deps)

[Case Study Cross-Links]
    requires: Case study slugs exist (DONE -- 10 case studies built)
    requires: technique-to-case-study mapping (NEW)

[Formulas (KaTeX)]
    requires: KaTeX already installed (DONE -- used by quantitative pages)
    requires: TechniqueContent interface extension (NEW)
    requires: [slug].astro template update (NEW)

[Python Code Examples]
    requires: astro-expressive-code installed (DONE -- used by quantitative pages)
    requires: TechniqueContent interface extension (NEW -- same as Formulas)
    requires: [slug].astro template update (NEW -- same as Formulas)

[Variant Interpretation Captions]
    requires: PlotVariantSwap.astro update (NEW)
    requires: technique-renderer.ts variant data extension (NEW)
    enhances: [Formulas] and [Python Code] (more context for pattern recognition)

[Formulas] + [Python Code]
    share: TechniqueContent interface extension
    share: [slug].astro template update
    SHOULD be done together to avoid two template changes
```

### Dependency Notes

- **Formulas and Python Code share infrastructure**: Both require extending `TechniqueContent` and updating `[slug].astro`. Doing them in the same phase avoids duplicate template work.
- **Questions Answered and Importance are independent**: Pure content additions with no infrastructure changes beyond a new field each.
- **Case Study Cross-Links depend on existing case studies**: All 10 case studies are already built. The only new work is the mapping data and a render section.
- **Variant Captions enhance but don't require Formulas/Code**: They can be done independently but are more valuable when users can also see the formula and reproduce in Python.

---

## MVP Definition

### Phase 1: Content Depth (Questions + Importance + Case Study Links)

The minimum viable enhancement that makes every page feel substantially richer.

- [x] Add `questionsAnswered: string[]` to `TechniqueContent` -- ~95 question strings
- [x] Add `importance: string` to `TechniqueContent` -- 29 importance paragraphs
- [x] Add case study cross-link mapping and render section -- ~22 techniques get links
- [x] Update `[slug].astro` template to render 3 new sections

**Rationale:** These three features are all LOW complexity, pure content additions that triple the section count on each page (from 5 to 8 sections). They bring every page to content parity with the NIST canonical structure minus formulas/code.

### Phase 2: Formulas + Python Code (Technical Depth)

Add the technical content that matches quantitative technique pages.

- [x] Extend `TechniqueContent` with `formulas` and `pythonCode` optional fields
- [x] Update `[slug].astro` to render formula and code slots (copy from quantitative)
- [x] Author ~40 KaTeX formula blocks for 12 techniques
- [x] Author 29 Python code examples

**Rationale:** Formulas and code share infrastructure changes. The quantitative pages already prove the pattern works. This phase makes graphical pages first-class citizens matching quantitative page depth.

### Phase 3: Variant Enrichment (Polish)

Enhance the 6 Tier B techniques with interpretive captions.

- [x] Extend variant data structure with `interpretation` field
- [x] Update `PlotVariantSwap.astro` to render captions
- [x] Author 35 interpretation strings

**Rationale:** This is polish that builds on Phase 2. The captions reference concepts from formulas and connect to "what model to use" guidance that Python code demonstrates.

---

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority | Phase |
|---------|------------|---------------------|----------|-------|
| Questions Answered | HIGH | LOW | P1 | 1 |
| Importance Section | HIGH | LOW | P1 | 1 |
| Case Study Cross-Links | HIGH | LOW | P1 | 1 |
| Formulas (KaTeX) | HIGH | MEDIUM | P1 | 2 |
| Python Code Examples | HIGH | MEDIUM | P1 | 2 |
| Variant Interpretation Captions | MEDIUM | MEDIUM | P2 | 3 |
| Technique Decision Guidance | MEDIUM | MEDIUM | P3 | Future |
| Formula-to-Code Visual Pairing | LOW | LOW | P3 | Future |

**Priority key:**
- P1: Must have for NIST parity
- P2: Should have, adds pedagogical depth
- P3: Nice to have, future consideration

---

## Competitor/Reference Feature Analysis

| Feature | NIST Handbook | Wikipedia | Khan Academy | Our Approach |
|---------|--------------|-----------|--------------|--------------|
| Definition | Plain text, often verbose | Comprehensive, with history | Simple, video-first | Concise 2-sentence definition (DONE) |
| Questions Answered | Bulleted list, 2-9 items | Not structured this way | Not structured this way | Bulleted list matching NIST (TO ADD) |
| Importance | 1-3 paragraphs | Implicit in "Applications" | Not explicit | Focused paragraph (TO ADD) |
| Formulas | Inline in text, sometimes images | Full derivations | Step-by-step | Display-mode KaTeX with explanations (TO ADD) |
| Code Examples | Dataplot (obsolete) + R | None | None | Modern Python with matplotlib/scipy (TO ADD) |
| Interactive plots | None (static images) | None | Yes (JS widgets) | Build-time SVG (DONE, deliberately static) |
| Visual variants | Links to sub-pages | None | Some | PlotVariantSwap tabs (DONE for 6 techniques) |
| Case study links | Links to section 1.4.2 | External links | Worked examples | Cross-links to our 10 case studies (TO ADD) |

**Our unique position:** We are the only resource combining NIST's authoritative section structure with modern Python code, build-time SVG visualization, and interactive variant switching in a single, fast-loading static page. Wikipedia has depth but no code. Khan Academy has interactivity but not for EDA techniques. NIST has authority but uses obsolete tools and static GIF images.

---

## Technique-Specific Formula Inventory

For Phase 2 planning, here is the complete formula inventory per technique:

### Techniques WITH formulas needed (12)

**Autocorrelation Plot (5 formulas):**
1. Autocorrelation coefficient: `r_h = C_h / C_0`
2. Autocovariance: `C_h = (1/N) sum((Y_t - Ybar)(Y_{t+h} - Ybar))`
3. Variance: `C_0 = (1/N) sum((Y_t - Ybar)^2)`
4. Confidence band (randomness): `+/- z_{1-alpha/2} / sqrt(N)`
5. Standard error of mean: `s_Ybar = s / sqrt(N)`

**Box-Cox Linearity Plot (1 formula):**
1. Box-Cox transform: `T(X) = (X^lambda - 1) / lambda; ln(X) when lambda = 0`

**Box-Cox Normality Plot (1 formula):**
1. Same Box-Cox transform applied to Y

**Box Plot (4 formulas):**
1. Inner fence lower: `L1 = Q1 - 1.5 * IQR`
2. Inner fence upper: `U1 = Q3 + 1.5 * IQR`
3. Outer fence lower: `L2 = Q1 - 3.0 * IQR`
4. Outer fence upper: `U2 = Q3 + 3.0 * IQR`

**Normal Probability Plot (3 formulas):**
1. Normal order statistics: `N_i = G(U_i)`
2. Filliben approximation for U_1: `U_1 = 1 - 0.5^(1/n)`
3. Filliben approximation for U_i: `U_i = (i - 0.3175) / (n + 0.365)`

**Probability Plot (2 formulas):**
1. Generalized order statistics: `M_i = G(U_i)` for distribution G
2. Same Filliben approximation

**PPCC Plot (1 formula):**
1. PPCC = correlation coefficient between ordered data and order statistic medians

**Q-Q Plot (1 formula):**
1. Quantile mapping: plot `Q1(p)` vs `Q2(p)` for p in (0,1)

**Spectral Plot (2 formulas):**
1. Sinusoidal model: `Y_i = C + alpha * sin(2*pi*omega*t_i + phi) + E_i`
2. Power spectral density definition

**Weibull Plot (3 formulas):**
1. Weibull CDF: `F(x) = 1 - exp(-(x/beta)^gamma)`
2. Log-log linearization
3. Shape/scale parameter extraction from slope/intercept

**Bootstrap Plot (1 formula):**
1. Bootstrap resample definition

**6-Plot (1 formula):**
1. Regression model: `Y_i = f(X_i) + E_i`

### Techniques WITHOUT formulas (17)

Bihistogram, Block Plot, Complex Demodulation, Contour Plot, DOE Plots, Histogram, Lag Plot, Linear Plots, Mean Plot, Run-Sequence Plot, Scatter Plot, Std Deviation Plot, Star Plot, Youden Plot, 4-Plot, Scatterplot Matrix, Conditioning Plot

These 17 techniques are purely visual/graphical with no defining formula on the NIST page. Their Python code examples will demonstrate the plotting functions directly.

---

## Python Code Library Mapping (Complete)

| Technique | Import | Key Function | Lines Est. |
|-----------|--------|-------------|-----------|
| autocorrelation-plot | `from statsmodels.graphics.tsaplots import plot_acf` | `plot_acf(data, lags=40)` | 12 |
| bihistogram | `import matplotlib.pyplot as plt` | Two `plt.subplot()` + `plt.hist()` | 18 |
| block-plot | `import matplotlib.pyplot as plt` | `plt.bar()` with grouped means | 15 |
| bootstrap-plot | `import numpy as np; import matplotlib.pyplot as plt` | `np.random.choice()` loop + `plt.hist()` | 18 |
| box-cox-linearity | `from scipy.stats import boxcox` | `boxcox()` sweep + `plt.plot()` | 15 |
| box-cox-normality | `from scipy.stats import boxcox_normplot` | `boxcox_normplot(data)` | 12 |
| box-plot | `import seaborn as sns` | `sns.boxplot()` | 10 |
| complex-demodulation | `import numpy as np; import matplotlib.pyplot as plt` | Custom amplitude/phase extraction + `plt.subplot()` | 22 |
| contour-plot | `import matplotlib.pyplot as plt` | `plt.contour()` or `plt.contourf()` | 15 |
| conditioning-plot | `import seaborn as sns` | `sns.FacetGrid()` | 15 |
| doe-plots | `import matplotlib.pyplot as plt` | 3 subplots: scatter, mean bar, SD bar | 20 |
| histogram | `import seaborn as sns` | `sns.histplot(data, kde=True)` | 10 |
| lag-plot | `import pandas as pd` | `pd.plotting.lag_plot(series)` | 10 |
| linear-plots | `import matplotlib.pyplot as plt; from scipy.stats import linregress` | 4 subplots with `linregress()` | 25 |
| mean-plot | `import matplotlib.pyplot as plt` | `plt.bar()` + `plt.axhline()` | 12 |
| normal-probability-plot | `from scipy import stats` | `stats.probplot(data, plot=plt)` | 10 |
| ppcc-plot | `from scipy.stats import ppcc_plot` | `ppcc_plot(data)` | 12 |
| probability-plot | `from scipy import stats` | `stats.probplot(data, dist='weibull_min')` | 12 |
| qq-plot | `from scipy import stats` | `stats.probplot()` for two samples | 15 |
| run-sequence-plot | `import matplotlib.pyplot as plt` | `plt.plot(data)` | 10 |
| scatter-plot | `import seaborn as sns` | `sns.scatterplot()` or `sns.regplot()` | 12 |
| scatterplot-matrix | `import seaborn as sns` | `sns.pairplot()` | 10 |
| spectral-plot | `from scipy.signal import periodogram` | `periodogram(data)` + `plt.semilogy()` | 15 |
| star-plot | `import matplotlib.pyplot as plt` | Polar axes `plt.subplot(polar=True)` | 18 |
| std-deviation-plot | `import matplotlib.pyplot as plt` | `plt.bar()` + `plt.axhline()` | 12 |
| weibull-plot | `from scipy import stats` | `stats.probplot(data, dist='weibull_min')` | 12 |
| youden-plot | `import matplotlib.pyplot as plt` | `plt.scatter()` + `plt.axhline()` + `plt.axvline()` | 15 |
| 4-plot | `import matplotlib.pyplot as plt; from scipy import stats` | `fig, axes = plt.subplots(2, 2)` | 22 |
| 6-plot | `import matplotlib.pyplot as plt; from scipy import stats` | `fig, axes = plt.subplots(2, 3)` | 25 |

**Total estimated: ~420 lines of Python across 29 techniques**

---

## Sources

- NIST/SEMATECH e-Handbook of Statistical Methods, Section 1.3.3 (graphical techniques index): https://www.itl.nist.gov/div898/handbook/eda/section3/eda33.htm
- NIST Histogram page: https://www.itl.nist.gov/div898/handbook/eda/section3/histogra.htm
- NIST Autocorrelation Plot page: https://www.itl.nist.gov/div898/handbook/eda/section3/autocopl.htm
- NIST Box Plot page: https://www.itl.nist.gov/div898/handbook/eda/section3/boxplot.htm
- NIST Normal Probability Plot page: https://www.itl.nist.gov/div898/handbook/eda/section3/normprpl.htm
- NIST Lag Plot page: https://www.itl.nist.gov/div898/handbook/eda/section3/lagplot.htm
- NIST Run-Sequence Plot page: https://www.itl.nist.gov/div898/handbook/eda/section3/runseqpl.htm
- NIST Weibull Plot page: https://www.itl.nist.gov/div898/handbook/eda/section3/weibplot.htm
- NIST Spectral Plot page: https://www.itl.nist.gov/div898/handbook/eda/section3/spectrum.htm
- NIST Box-Cox Normality Plot page: https://www.itl.nist.gov/div898/handbook/eda/section3/eda336.htm
- NIST 6-Plot page: https://www.itl.nist.gov/div898/handbook/eda/section3/6plot.htm
- NIST Scatter Plot page: https://www.itl.nist.gov/div898/handbook/eda/section3/scatplot.htm
- NIST PPCC Plot page: https://www.itl.nist.gov/div898/handbook/eda/section3/ppccplot.htm
- NIST Q-Q Plot page: https://www.itl.nist.gov/div898/handbook/eda/section3/qqplot.htm
- NIST Mean Plot page: https://www.itl.nist.gov/div898/handbook/eda/section3/meanplot.htm
- NIST Contour Plot page: https://www.itl.nist.gov/div898/handbook/eda/section3/contour.htm
- NIST Bootstrap Plot page: https://www.itl.nist.gov/div898/handbook/eda/section3/bootplot.htm
- NIST Star Plot page: https://www.itl.nist.gov/div898/handbook/eda/section3/starplot.htm
- NIST Bihistogram page: https://www.itl.nist.gov/div898/handbook/eda/section3/bihistog.htm
- NIST DOE Scatter Plot page: https://www.itl.nist.gov/div898/handbook/eda/section3/eda33b.htm
- statsmodels plot_acf documentation: https://www.statsmodels.org/stable/generated/statsmodels.graphics.tsaplots.plot_acf.html
- Existing codebase: `src/lib/eda/technique-content.ts`, `src/lib/eda/quantitative-content.ts`, `src/pages/eda/techniques/[slug].astro`, `src/pages/eda/quantitative/[slug].astro`

---
*Feature research for: EDA Graphical Techniques NIST Section Parity*
*Researched: 2026-02-27*
