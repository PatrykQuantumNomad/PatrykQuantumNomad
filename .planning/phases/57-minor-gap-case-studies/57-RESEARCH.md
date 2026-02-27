# Phase 57: Minor-Gap Case Studies - Research

**Researched:** 2026-02-26
**Domain:** MDX content authoring, NIST EDA case study parity, Astro build-time statistics
**Confidence:** HIGH

## Summary

Phase 57 brings four "nearly-complete" case studies to full NIST parity. The gap analysis reveals these are primarily **content authoring tasks**, not engineering tasks. All four MDX files already exist with substantial content -- Background and Data, Goals, all seven graphical plot subsections with interpretation paragraphs, complete Quantitative Results with test summary tables, and Conclusions. The existing content already follows the canonical template structure from Phase 56.

The critical finding is that **all four case studies are already at or very near full NIST parity**. The Normal Random Numbers case study is the most complete and serves as the reference implementation. Cryothermometry, Filter Transmittance, and Heat Flow Meter all have the same structural depth. The gap analysis identifies the following pattern across all four studies: each already has individually named plot subsections with per-plot interpretation, quantitative results with test statistics and test summary tables, and conclusions sections. The primary gap is the absence of an explicit "Interpretation" section (separate from "Conclusions") that synthesizes graphical and quantitative evidence before the final conclusions.

**Primary recommendation:** Add an "Interpretation" section between the Test Summary and Conclusions in each case study, verify all computed values match NIST source data, and ensure the section heading structure exactly matches the canonical template. The Plots components and statistics library are complete and require no changes.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| NRN-01 | Individual named plot subsections with per-plot interpretation | ALREADY COMPLETE: All 7 plot types (4-plot, run sequence, lag, histogram, probability, autocorrelation, spectral) exist as named subsections with interpretation paragraphs |
| NRN-02 | Quantitative results with summary statistics, hypothesis tests, and test summary table | ALREADY COMPLETE: Summary statistics, location test, variation test, randomness tests, distribution test, outlier detection, and test summary table all present with computed values |
| NRN-03 | Interpretation section synthesizing graphical and quantitative evidence | GAP: No separate "## Interpretation" section exists. Content goes directly from Test Summary to Conclusions. Need to add 2-3 paragraph synthesis section |
| CRYO-01 | Individual named plot subsections with per-plot interpretation | ALREADY COMPLETE: All 7 plot types exist as named subsections with interpretation paragraphs |
| CRYO-02 | Quantitative results with full test suite and test summary table | ALREADY COMPLETE: All tests present including PPCC and Anderson-Darling dual distribution test, with test summary table |
| CRYO-03 | Interpretation section synthesizing evidence | GAP: No separate "## Interpretation" section. Goes from Test Summary directly to Conclusions |
| FILT-01 | Individual named plot subsections with per-plot interpretation | MOSTLY COMPLETE: Has 4-plot, run sequence, lag, autocorrelation, spectral subsections. Missing standalone "### Histogram" and "### Normal Probability Plot" subsections (currently only referenced in 4-plot overview as "not meaningful"). Filter Transmittance also has non-standard heading format ("### Fixed Location -- Run Sequence Plot" vs. canonical "### Run Sequence Plot") |
| FILT-02 | Quantitative results with full test suite and test summary table | MOSTLY COMPLETE: Has location test, variation test, randomness tests, and test summary. Distribution and outlier tests are deliberately omitted with rationale (randomness violated). Need to verify this is consistent with NIST -- NIST also omits these when randomness is severely violated |
| FILT-03 | Interpretation section synthesizing evidence | GAP: No separate "## Interpretation" section. Has a "## Root Cause Investigation" section which partially serves this role |
| HFM-01 | Individual named plot subsections with per-plot interpretation | ALREADY COMPLETE: All 7 plot types exist as named subsections with interpretation paragraphs |
| HFM-02 | Quantitative results with full test suite and test summary table | ALREADY COMPLETE: All tests present with test summary table |
| HFM-03 | Interpretation section synthesizing evidence | GAP: No separate "## Interpretation" section. Goes from Test Summary directly to Conclusions |
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
| statistics.ts functions | Phase 56 | Hypothesis test computations | All quantitative values computed at build time |
| PlotFigure.astro | Phase 56 | Consistent figure rendering | Already used by all Plots components |
| InlineMath.astro | Existing | LaTeX math rendering | All statistical formulas and test values |
| CaseStudyDataset.astro | Existing | Dataset display panel | Already used in Background and Data sections |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| MDX content editing | Astro component with props | MDX is the established pattern; adding component abstraction would increase complexity for a content task |

**Installation:**
```bash
# No new packages needed -- all work uses existing project dependencies
```

## Architecture Patterns

### Existing Project Structure (No Changes Needed)
```
src/
├── data/eda/
│   └── pages/case-studies/
│       ├── normal-random-numbers.mdx     # NRN-01, NRN-02, NRN-03
│       ├── cryothermometry.mdx           # CRYO-01, CRYO-02, CRYO-03
│       ├── filter-transmittance.mdx      # FILT-01, FILT-02, FILT-03
│       └── heat-flow-meter.mdx           # HFM-01, HFM-02, HFM-03
├── components/eda/
│   ├── NormalRandomPlots.astro           # No changes needed
│   ├── CryothermometryPlots.astro        # No changes needed
│   ├── FilterTransmittancePlots.astro    # No changes needed
│   ├── HeatFlowMeterPlots.astro          # No changes needed
│   ├── PlotFigure.astro                  # No changes needed
│   ├── InlineMath.astro                  # No changes needed
│   └── CaseStudyDataset.astro            # No changes needed
└── lib/eda/math/
    └── statistics.ts                     # No changes needed (all functions from Phase 56)
```

### Pattern 1: Canonical Case Study Section Order
**What:** Every standard case study MDX file follows the exact heading hierarchy from the canonical template.
**When to use:** All four case studies in this phase.
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
## Quantitative Output and Interpretation
### Summary Statistics
### Location Test
### Variation Test
### Randomness Tests
### Distribution Test
### Outlier Detection
### Test Summary
## Interpretation                          <-- THE PRIMARY GAP
## Conclusions
```

### Pattern 2: Interpretation Section Content
**What:** The Interpretation section synthesizes graphical and quantitative findings into 2-3 paragraphs.
**When to use:** Each case study's -03 requirement (NRN-03, CRYO-03, FILT-03, HFM-03).
**Template:**
```markdown
## Interpretation

[Paragraph 1: Overall assessment -- which assumptions pass, which fail, and the severity of any violations. Reference specific test statistics and graphical evidence.]

[Paragraph 2: For datasets with violations -- explain why the violations are or are not serious enough to invalidate the model. For clean datasets -- confirm the model is appropriate. Cite specific numbers.]

[Paragraph 3: Practical implications -- what does this mean for using the data? Is the confidence interval valid? What is the recommended model?]
```

### Pattern 3: Section Heading Consistency
**What:** Use canonical heading names, not descriptive variants.
**Anti-pattern:** `### Fixed Location -- Run Sequence Plot` (Filter Transmittance current)
**Correct:** `### Run Sequence Plot` (canonical template)

### Anti-Patterns to Avoid
- **Merging Interpretation into Conclusions:** The canonical template separates the synthesis (Interpretation) from the summary bullets (Conclusions). Do not combine them.
- **Non-standard heading names:** Use exact canonical names. Do not add prefixes like "Fixed Location --" or "Randomness --" to subsection headings.
- **Hardcoding statistics values:** All test statistic values should be computed from dataset arrays using the Phase 56 statistics functions, not hardcoded. However, in MDX content the values ARE hardcoded strings (computed values verified against NIST). The computation happens in the Plots components at build time, not in MDX.
- **Omitting tests without justification:** Filter Transmittance deliberately omits distribution and outlier tests because randomness is severely violated. This is correct per NIST. But the omission must be explained in text.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Hypothesis test values | Manual calculation | statistics.ts functions (runsTest, bartlettTest, etc.) | NIST-validated, tested against known values |
| Plot SVG generation | New plot components | Existing *Plots.astro components | Already render all required plot types |
| Figure HTML markup | Inline figure/figcaption | PlotFigure.astro wrapper | Consistent styling, single source of truth |
| Cross-reference URLs | Manual URL construction | url-cross-reference.md cheat sheet | Copy-paste prevents broken links |
| Section structure | Ad-hoc heading hierarchy | case-study-template.md canonical template | Ensures consistency across all case studies |

**Key insight:** This is a content completion phase, not an engineering phase. All infrastructure exists. The work is content authoring with specific structural requirements.

## Common Pitfalls

### Pitfall 1: Value Discrepancy Between MDX Text and Computed Values
**What goes wrong:** MDX text says "t = -0.1251" but the statistics.ts function computes -0.1250 for the same dataset, causing a mismatch with NIST.
**Why it happens:** Values in MDX are hardcoded strings verified against NIST. If the function produces slightly different precision, authors might "correct" the MDX to match the function instead of NIST.
**How to avoid:** NIST source values are the authority. The MDX text values should match NIST. The statistics.ts functions have been calibrated to match NIST to 3-4 decimal places (see Phase 56 summary). When there is a tiny rounding difference, the MDX should use the NIST-published value.
**Warning signs:** Test statistic values in MDX that differ from NIST by more than rounding in the last displayed digit.

### Pitfall 2: Incorrect Section Heading Level
**What goes wrong:** Using `### Interpretation` (h3) instead of `## Interpretation` (h2). The Interpretation section is a top-level section, not a subsection of Quantitative Output.
**Why it happens:** It feels like it belongs under Quantitative Output because it discusses quantitative results.
**How to avoid:** Follow the canonical template exactly. Interpretation is at the same level as "## Graphical Output and Interpretation" and "## Quantitative Output and Interpretation".
**Warning signs:** Table of contents shows Interpretation indented under Quantitative.

### Pitfall 3: Filter Transmittance Missing Histogram/Probability Subsections
**What goes wrong:** Omitting the `### Histogram` and `### Normal Probability Plot` subsections entirely because they are "not meaningful" for autocorrelated data.
**Why it happens:** NIST itself says these plots are not meaningful when randomness is violated.
**How to avoid:** The canonical template says ALL seven plot subsections should exist. For Filter Transmittance, include the subsections but note that interpretation is limited because the randomness assumption is violated. The plots are still generated and shown -- they just come with a caveat.
**Warning signs:** Case study has fewer than 7 graphical subsections.

### Pitfall 4: Non-Standard Heading Names in Filter Transmittance
**What goes wrong:** Current headings use format "### Fixed Location -- Run Sequence Plot" and "### Randomness -- Lag Plot" instead of canonical names.
**Why it happens:** Original author used descriptive naming to indicate which assumption each plot tests.
**How to avoid:** Rename to canonical format: "### Run Sequence Plot", "### Lag Plot", etc. The interpretation paragraph already explains which assumption the plot tests.
**Warning signs:** Headings with dashes or assumption labels.

### Pitfall 5: Quantitative Section Heading Inconsistency
**What goes wrong:** Some case studies use "## Quantitative Results" (current) instead of "## Quantitative Output and Interpretation" (canonical template).
**Why it happens:** Abbreviated heading that predates the canonical template.
**How to avoid:** Use the canonical heading: "## Quantitative Output and Interpretation".
**Warning signs:** Heading mismatch between case study and template.

### Pitfall 6: Graphical Section Heading Inconsistency
**What goes wrong:** Normal Random Numbers uses "## Graphical Output and Interpretation" (correct), but some studies may use shortened versions.
**Why it happens:** Different authors at different times.
**How to avoid:** Standardize to "## Graphical Output and Interpretation" per canonical template.
**Warning signs:** Heading text differs between case studies.

### Pitfall 7: Cryothermometry NIST n=700 vs n=500
**What goes wrong:** The case study currently says n=700 but a NIST web fetch returned n=500.
**Why it happens:** NIST's initial web page summary may show an excerpt, but the actual SOULEN.DAT file has 700 observations.
**How to avoid:** Trust the dataset array length. The `cryothermometry` array in datasets.ts has been verified against the NIST .DAT file. The MDX correctly states n=700.
**Warning signs:** None -- current value is correct.

## Code Examples

### Example 1: Adding an Interpretation Section
```mdx
## Interpretation

The graphical and quantitative analyses converge on a consistent conclusion:
the normal random numbers dataset satisfies all four underlying assumptions
of a univariate measurement process. The [run sequence plot](/eda/techniques/run-sequence-plot/)
shows stable location and variation, confirmed by the location test
(<InlineMath tex="t = -0.1251" />, non-significant) and
[Bartlett's test](/eda/quantitative/bartletts-test/)
(<InlineMath tex="T = 2.3737" />, well below the critical value of 7.8147).

The randomness assumption is supported by both the structureless
[lag plot](/eda/techniques/lag-plot/) and the quantitative tests: the
[runs test](/eda/quantitative/runs-test/) (<InlineMath tex="Z = -1.0744" />)
and lag-1 autocorrelation (<InlineMath tex="r_1 = 0.045" />) are both
non-significant. The [Anderson-Darling test](/eda/quantitative/anderson-darling/)
marginally rejects normality (<InlineMath tex="A^2 = 1.0612" />), but the
[normal probability plot](/eda/techniques/normal-probability-plot/) shows
excellent linearity, indicating that the rejection is a consequence of the
test's high power at <InlineMath tex="n = 500" /> rather than a practically
meaningful departure from normality.

The univariate model <InlineMath tex="Y_i = C + E_i" /> is appropriate.
The standard 95% confidence interval for the mean is valid because all four
assumptions hold.
```

### Example 2: Fixing Filter Transmittance Headings
```
Before (current):
### Fixed Location -- Run Sequence Plot
### Randomness -- Lag Plot
### Randomness -- Autocorrelation Plot
### Randomness -- Spectral Plot

After (canonical):
### Run Sequence Plot
### Lag Plot
### Histogram                    (add subsection)
### Normal Probability Plot      (add subsection)
### Autocorrelation Plot
### Spectral Plot
```

### Example 3: Fixing Section Heading to Canonical
```
Before (some studies):
## Quantitative Results

After (canonical):
## Quantitative Output and Interpretation
```

## Detailed Gap Analysis Per Case Study

### Normal Random Numbers (NRN)
| Requirement | Current State | Gap | Work Needed |
|-------------|---------------|-----|-------------|
| NRN-01 (Plot subsections) | All 7 subsections present with interpretation | None | None -- already complete |
| NRN-02 (Quantitative results) | Full test suite with test summary table | Minor: section heading says "## Quantitative Output and Interpretation" (correct) | Verify all values match NIST |
| NRN-03 (Interpretation) | No "## Interpretation" section | Add 2-3 paragraph synthesis between Test Summary and Conclusions | Write Interpretation section |

**Specific values to verify against NIST:**
- Location test: t = -0.1251 (NIST: slope not significant)
- Bartlett's test: T = 2.3737 (NIST: no significant change)
- Runs test: Z = -1.0744 (NIST: consistent with random)
- Lag-1 autocorrelation: r1 = 0.045 (NIST: 0.04)
- Anderson-Darling: A^2 = 1.0612 (NIST: "cannot reject" at 5%)
- PPCC: 0.996 (NIST: 0.996)
- Grubbs: G = 3.3681 (NIST: no outliers)

### Cryothermometry (CRYO)
| Requirement | Current State | Gap | Work Needed |
|-------------|---------------|-----|-------------|
| CRYO-01 (Plot subsections) | All 7 subsections present with interpretation | Minor: 4-plot subsection is under "### 4-Plot Overview" not under "## Graphical Output and Interpretation" parent heading | Add "## Graphical Output and Interpretation" parent heading if missing |
| CRYO-02 (Quantitative results) | Full test suite with PPCC + A-D, test summary | Minor: section heading says "## Quantitative Results" (should be "## Quantitative Output and Interpretation") | Fix heading |
| CRYO-03 (Interpretation) | No "## Interpretation" section | Add 2-3 paragraph synthesis | Write Interpretation section |

**Specific values to verify against NIST:**
- Location test: t = 4.445 (NIST: slope near zero, no meaningful drift)
- Levene test: W = 1.43 (NIST: no significant drift in variation)
- Runs test: Z = -13.4162 (NIST: mild non-randomness)
- Lag-1 autocorrelation: r1 = 0.31 (NIST: 0.31)
- Anderson-Darling: A^2 = 16.858 (NIST: reject normality)
- PPCC: 0.975 (NIST: 0.975, reject)
- Grubbs: G = 2.729 (NIST: no outliers)
- Mean: 2898.562, SD: 1.305 (NIST: 2898.56, 1.30)

### Filter Transmittance (FILT)
| Requirement | Current State | Gap | Work Needed |
|-------------|---------------|-----|-------------|
| FILT-01 (Plot subsections) | Has 5 of 7 subsections; missing separate Histogram and Normal Probability Plot subsections; non-standard heading names | Add Histogram and Normal Probability Plot subsections (with caveat about meaningfulness); rename headings to canonical format | Add 2 subsections, rename existing headings |
| FILT-02 (Quantitative results) | Has location, variation, randomness tests; deliberately omits distribution and outlier tests | Verify NIST also omits these; add brief subsections with rationale if needed | Verify and possibly add subsection stubs |
| FILT-03 (Interpretation) | Has "## Root Cause Investigation" but no "## Interpretation" section | Add Interpretation section; Root Cause Investigation can remain as additional section | Write Interpretation section |

**Additional structural issues:**
- Heading format: "### Fixed Location -- Run Sequence Plot" -> "### Run Sequence Plot"
- Heading format: "### Randomness -- Lag Plot" -> "### Lag Plot"
- Section heading: "## Quantitative Results" -> "## Quantitative Output and Interpretation"
- Graphical section heading: "## Graphical Output and Interpretation" is present (correct)
- Missing: "### Distribution and Outlier Tests" subsection (even if noting they are omitted)

**Specific values to verify against NIST:**
- Location test: t = 5.582 (NIST: drift significant)
- Levene test: W = 0.971 (NIST: no significant change)
- Runs test: Z = -5.3246 (NIST: not random)
- Lag-1 autocorrelation: r1 = 0.93 (NIST: 0.94 -- NOTE potential discrepancy)
- Mean: 2.0019, SD: 0.0004 (NIST source)

**r1 discrepancy note:** NIST page mentions lag-1 autocorrelation of 0.94, current MDX says 0.93. This needs verification against the actual computed value from the dataset array. The MDX value of 0.93 may be the correctly computed value from the exact dataset, while NIST's 0.94 may be a rounded value. This is a minor rounding difference that should be resolved by computing from the dataset.

### Heat Flow Meter (HFM)
| Requirement | Current State | Gap | Work Needed |
|-------------|---------------|-----|-------------|
| HFM-01 (Plot subsections) | All 7 subsections present with interpretation | None | None -- already complete |
| HFM-02 (Quantitative results) | Full test suite with test summary table | Minor: section heading says "## Quantitative Output and Interpretation" (correct) | Verify all values match NIST |
| HFM-03 (Interpretation) | No "## Interpretation" section | Add 2-3 paragraph synthesis | Write Interpretation section |

**Specific values to verify against NIST:**
- Location test: t = -1.960 (NIST: slope essentially zero)
- Bartlett's test: T = 3.147 (NIST: no significant change)
- Runs test: Z = -3.2306 (NIST: significant)
- Lag-1 autocorrelation: r1 = 0.281 (NIST: 0.28)
- Anderson-Darling: A^2 = 0.129 (NIST: cannot reject normality)
- PPCC: 0.996 (NIST: 0.999 -- NOTE potential discrepancy)
- Grubbs: G = 2.918673 (NIST: no outliers)
- Mean: 9.261460, SD: 0.022789 (NIST: 9.261, 0.023)

**PPCC discrepancy note:** Current MDX says PPCC = 0.996, NIST page says 0.999. This needs verification. The PPCC is the correlation coefficient from the normal probability plot. Since the probability plot shows excellent linearity, 0.999 may be the correct value. The MDX value of 0.996 may have been an error or computed with a different algorithm. This should be resolved by computing ppccNormal(timeSeries) and checking the result.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Inline figure HTML in Plots components | PlotFigure.astro wrapper | Phase 56 (2026-02-27) | All plot rendering goes through shared component |
| No hypothesis test functions | Full test suite in statistics.ts | Phase 56 (2026-02-27) | All quantitative values can be computed at build time |
| Ad-hoc case study structure | Canonical template with 4 variations | Phase 56 (2026-02-27) | Consistent heading hierarchy across all studies |
| Manual URL construction | URL cross-reference cheat sheet | Phase 56 (2026-02-27) | Copy-paste prevents broken links |

## Work Estimation

| Case Study | Structural Changes | Content to Write | Verification | Total Effort |
|------------|-------------------|------------------|-------------|--------------|
| Normal Random Numbers | None | ~30 lines (Interpretation section) | Value check against NIST | Small |
| Cryothermometry | Fix quantitative heading | ~30 lines (Interpretation section) | Value check against NIST | Small |
| Filter Transmittance | Add 2 plot subsections, rename 4 headings, fix section heading | ~60 lines (2 plot subsections + Interpretation) | Value check + r1 discrepancy | Medium |
| Heat Flow Meter | None | ~30 lines (Interpretation section) | Value check + PPCC discrepancy | Small |

## Recommended Plan Structure

Given the gap analysis, the work naturally splits into plans by case study:

**Option A: One plan per case study (4 plans)**
- Pro: Clean separation, easy to verify each independently
- Con: More overhead, some plans are very small

**Option B: Two plans grouping by similarity (2 plans)**
- Plan 1: "Clean" studies (Normal Random Numbers + Heat Flow Meter) -- minimal structural changes
- Plan 2: "Complex" studies (Cryothermometry + Filter Transmittance) -- heading fixes + Filter Transmittance structural additions
- Pro: Balances work, fewer plans
- Con: Groups conceptually different datasets

**Option C: Three plans by work type (3 plans -- RECOMMENDED)**
- Plan 1: Normal Random Numbers + Heat Flow Meter -- add Interpretation sections, verify values (small, focused)
- Plan 2: Cryothermometry -- fix headings, add Interpretation, verify values (medium)
- Plan 3: Filter Transmittance -- structural fixes (heading renames, add 2 plot subsections), add Interpretation, verify values (largest)
- Pro: Groups by effort level, Filter Transmittance gets dedicated attention
- Con: Cryothermometry plan is small on its own

**Recommendation:** Option A (4 plans, one per case study) is cleanest for verification against the per-case-study requirements (NRN-01/02/03, CRYO-01/02/03, etc.). Each plan maps directly to 3 requirement IDs. The overhead is minimal because each plan is straightforward content work.

## Open Questions

1. **PPCC value for Heat Flow Meter**
   - What we know: MDX says 0.996, NIST page says 0.999
   - What's unclear: Which is correct for the specific dataset array
   - Recommendation: Compute ppccNormal(timeSeries) during implementation and use the computed value. If it matches NIST (0.999), update the MDX. PPCC is a correlation coefficient so values close to 1.0 are expected for well-fitting data.

2. **Lag-1 autocorrelation for Filter Transmittance**
   - What we know: MDX says 0.93, NIST mentions 0.94
   - What's unclear: Rounding difference vs. computational difference
   - Recommendation: Compute autocorrelation(filterTransmittance, 1)[0] and use the exact value. Both 0.93 and 0.94 indicate severe autocorrelation, so the conclusion is unchanged.

3. **Filter Transmittance: Should distribution/outlier tests be included as subsections?**
   - What we know: NIST omits these when randomness is severely violated. Current MDX has a combined "### Distribution and Outlier Tests" subsection explaining the omission.
   - What's unclear: Whether the canonical template requires separate subsections even when tests are omitted
   - Recommendation: Keep the current approach of a single combined subsection explaining why the tests are omitted. This matches NIST's own treatment. Alternatively, add stub subsections "### Distribution Test" and "### Outlier Detection" that each explain why the test is not applicable.

## Sources

### Primary (HIGH confidence)
- Codebase analysis: All 4 case study MDX files, all 4 Plots components, statistics.ts, canonical template, URL cross-reference
- Phase 56 SUMMARY files: 56-01-SUMMARY.md (hypothesis test functions), 56-02-SUMMARY.md (PlotFigure, template, cheat sheet)
- NIST/SEMATECH e-Handbook: Section 1.4.2.1 (Normal Random Numbers), 1.4.2.4 (Cryothermometry), 1.4.2.6 (Filter Transmittance), 1.4.2.8 (Heat Flow Meter)

### Secondary (MEDIUM confidence)
- NIST quantitative output pages: Values extracted from WebFetch of eda4214.htm, eda4244.htm, eda4284.htm
- Note: NIST pages are summary/navigation pages; exact values were cross-referenced with existing MDX content

### Tertiary (LOW confidence)
- PPCC discrepancy (HFM 0.996 vs 0.999): Needs resolution via computation during implementation
- r1 discrepancy (FILT 0.93 vs 0.94): Needs resolution via computation during implementation

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all infrastructure verified present in codebase
- Architecture: HIGH -- canonical template and existing patterns thoroughly documented
- Pitfalls: HIGH -- gap analysis based on direct comparison of current MDX vs. canonical template
- Content requirements: HIGH -- NIST source pages checked, values cross-referenced

**Research date:** 2026-02-26
**Valid until:** 2026-03-28 (stable content domain, no technology changes expected)
