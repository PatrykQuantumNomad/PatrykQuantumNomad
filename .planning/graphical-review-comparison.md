# Comparison Techniques Review: Handbook vs Site Content

Reviewer: comparison-reviewer
Date: 2026-03-01
Source: `src/lib/eda/technique-content/comparison.ts`
SVG generators: `src/lib/eda/svg-generators/block-plot.ts`, `bar-plot.ts`, `star-plot.ts`

---

## 1. Block Plot (NIST 1.3.3.3)

**Handbook source:** `handbook/eda/section3/blockplo.htm`

### Definition
- **Site:** "A block plot displays the response values from a designed experiment organized by block positions on the horizontal axis. Each position is drawn as an outlined vertical rectangle spanning the min-to-max response range, with bold plot characters (numerals) placed inside at their Y-value positions to mark treatment levels."
- **Handbook:** "Block Plots are formed as follows: Vertical axis: Response variable Y; Horizontal axis: All combinations of all levels of all nuisance (secondary) factors X1, X2, ...; Plot Character: Levels of the primary factor XP"
- **Verdict: ACCURATE.** The site's definition is a faithful expanded description of the handbook's terse axis definition. The site correctly identifies the horizontal axis as representing all combinations of nuisance factors, and the plot characters as representing primary factor levels.

### Purpose
- **Site:** "Check whether a factor of interest (the primary factor) has an effect that is robust over all other factors. ... It replaces the analysis of variance F-test with a less assumption-dependent binomial test."
- **Handbook:** "Check to determine if a factor of interest has an effect robust over all other factors" and "It replaces the analysis of variance test with a less assumption-dependent binomial test."
- **Verdict: ACCURATE.** Faithful paraphrase.

### Interpretation
- **Site:** Correctly describes the counting diagnostic, the canonical 10-of-12 example, and the ~2% binomial probability.
- **Handbook:** Matches exactly — "weld method 2 is lower (better) than weld method 1 in 10 of 12 cases" and "The chance of getting 10 (or more extreme: 11, 12) heads in 12 flips of a fair coin is about 2%."
- **Verdict: ACCURATE.**

### Questions
- **Site:** Lists 9 questions matching handbook exactly.
- **Handbook:** Lists same 9 questions.
- **Verdict: ACCURATE.** Perfect match.

### Importance
- **Site:** Accurately states it replaces ANOVA with graphical + binomial approach.
- **Handbook:** Same message about robustly general conclusions.
- **Verdict: ACCURATE.**

### Assumptions
- **Site:** "The block plot assumes a balanced or near-balanced design where each treatment appears in every combination of nuisance factor levels."
- **Handbook:** Does not explicitly list assumptions, but the structure of the technique inherently requires treatments to appear in each combination.
- **Verdict: ACCURATE.** The site's stated assumption is a reasonable inference.

### SVG Generator (block-plot.ts)
- Correctly renders outlined rectangles spanning min-to-max response range per block position.
- Uses bold numbered plot characters (1, 2, ...) placed at Y-value positions inside rectangles, matching NIST convention.
- Includes legend mapping plot characters to group names.
- **Verdict: ACCURATE implementation matching handbook convention.**

### Issues Found
- **None.** Block plot content is accurate.

---

## 2. Mean Plot (NIST 1.3.3.20)

**Handbook source:** `handbook/eda/section3/meanplot.htm`

### Definition
- **Site:** "A mean plot displays the group means versus group identifier, with a horizontal reference line drawn at the overall mean of all observations."
- **Handbook:** "Mean plots are formed by: Vertical axis: Group mean; Horizontal axis: Group identifier. A reference line is plotted at the overall mean."
- **Verdict: ACCURATE.** Direct match.

### Purpose
- **Site:** "Use a mean plot to see if the mean varies between different groups of the data. ... The mean plot is typically used in conjunction with the standard deviation plot."
- **Handbook:** "Mean plots are used to see if the mean varies between different groups of the data." and "Mean plots are typically used in conjunction with standard deviation plots."
- **Verdict: ACCURATE.**

### Interpretation
- **Site:** Correctly describes group means vs overall mean reference line, departure indicating shifts, and patterns indicating drift or step changes. Mentions median/trimmed mean as alternatives for data with outliers.
- **Handbook:** Same content about departures and patterns. Also mentions median and trimmed mean.
- **Verdict: ACCURATE.**

### Questions
- **Site:** Lists 3 questions: shifts in location, magnitude, distinct pattern.
- **Handbook:** Same 3 questions.
- **Verdict: ACCURATE.**

### Importance
- **Site:** "A common assumption in one-factor analyses is that of constant location across different levels of the factor variable."
- **Handbook:** "A common assumption in 1-factor analyses is that of constant location."
- **Verdict: ACCURATE.**

### Formulas
- **Site provides:**
  - Group Mean: x_bar_j = (1/n_j) * sum(x_ij) -- **CORRECT.**
  - Overall Mean: x_bar = (1/N) * sum(x_i) -- **CORRECT.**
- **Handbook:** Does not provide explicit formulas, but these are the standard definitions.
- **Verdict: CORRECT.** Formulas are standard and properly defined.

### SVG Generator (bar-plot.ts)
- The bar plot generator is used for mean plots. It renders bars at group positions with proper y-axis scaling.
- **Minor note:** The bar plot renders bars from 0 to the value, which is a reasonable choice for mean plots but differs slightly from the NIST sample which shows connected dots (line plot style). However, both are valid renderings of the concept.
- **Verdict: ACCEPTABLE.** The bar approach is a valid variant. The NIST sample shows dots connected by lines, but bars are an equally valid way to show group means.

### Issues Found
- **MINOR (cosmetic, not an error):** NIST's sample mean plot uses connected dots, not bars. The site uses a bar chart rendering. Both convey the same information. Not a factual error, but worth noting as a stylistic divergence from the handbook's sample illustration.

---

## 3. Standard Deviation Plot (NIST 1.3.3.28)

**Handbook source:** `handbook/eda/section3/sdplot.htm`

### Definition
- **Site:** "A standard deviation plot displays the group standard deviations versus group identifier, with a horizontal reference line drawn at the overall standard deviation."
- **Handbook:** "Standard deviation plots are formed by: Vertical axis: Group standard deviations; Horizontal axis: Group identifier. A reference line is plotted at the overall standard deviation."
- **Verdict: ACCURATE.** Direct match.

### Purpose
- **Site:** "Use a standard deviation plot to detect changes in scale between groups of data. ... Standard deviation plots are typically used in conjunction with mean plots."
- **Handbook:** "Standard deviation plots are used to see if the standard deviation varies between different groups of the data." and "Standard deviation plots are typically used in conjunction with mean plots."
- **Verdict: ACCURATE.**

### Interpretation
- **Site:** Correctly describes departure from reference line indicating shifts in variability, upward/downward trends, and mentions MAD/AAD as robust alternatives.
- **Handbook:** Same content about MAD and average absolute deviation as alternatives for data with outliers.
- **Verdict: ACCURATE.**

### Questions
- **Site:** 3 questions matching handbook exactly (shifts in variation, magnitude, distinct pattern).
- **Handbook:** Same 3 questions.
- **Verdict: ACCURATE.**

### Importance
- **Site:** "A common assumption in one-factor analyses is that of equal variances across factor levels."
- **Handbook:** "A common assumption in 1-factor analyses is that of equal variances."
- **Verdict: ACCURATE.**

### Formulas
- **Site provides:**
  - Group Std Dev: s_j = sqrt(1/(n_j-1) * sum((x_ij - x_bar_j)^2)) -- **CORRECT** (Bessel-corrected sample std dev).
  - Overall Std Dev: s = sqrt(1/(N-1) * sum((x_i - x_bar)^2)) -- **CORRECT.**
- **Handbook:** Does not provide explicit formulas, but these are the standard sample standard deviation definitions.
- **Verdict: CORRECT.**

### SVG Generator (bar-plot.ts)
- Same bar-plot generator is used. Same stylistic note as mean-plot (NIST uses dots, site uses bars).
- **Verdict: ACCEPTABLE.** Same cosmetic divergence as mean-plot.

### Issues Found
- **MINOR (cosmetic):** Same as mean-plot — NIST sample uses dots connected by lines, site uses bars. Not a factual error.

---

## 4. Star Plot (NIST 1.3.3.29)

**Handbook source:** `handbook/eda/section3/starplot.htm`

### Definition
- **Site:** "A star plot, also known as a radar chart or spider chart, displays multivariate data as a series of equi-angular spokes radiating from a central point, with each spoke representing a different variable."
- **Handbook:** "The star plot consists of a sequence of equi-angular spokes, called radii, with each spoke representing one of the variables. The data length of a spoke is proportional to the magnitude of the variable for the data point relative to the maximum magnitude of the variable across all data points."
- **Verdict: ACCURATE.** The site adds the common "radar chart / spider chart" alias, which is a helpful addition (not from NIST, but factually correct synonyms).

### Purpose
- **Site:** "Use a star plot when comparing the multivariate profiles of individual observations or groups across many variables simultaneously."
- **Handbook:** "Star plots are used to examine the relative values for a single data point ... and to locate similar points or dissimilar points."
- **Verdict: ACCURATE.** The site's description is a valid generalization of the handbook's purpose.

### Interpretation
- **Site:** Correctly describes spoke length proportional to magnitude, polygon shape as visual fingerprint, large/small/irregular polygons, and side-by-side comparison.
- **Handbook:** Same concepts — "A line is drawn connecting the data values for each spoke."
- **Verdict: ACCURATE.**

### Questions
- **Site:** 3 questions: dominant variables, similar observations/clusters, outliers.
- **Handbook:** Same 3 questions.
- **Verdict: ACCURATE.**

### Weakness / Assumptions
- **Site:** "Star plots are helpful for small-to-moderate-sized multivariate data sets; their primary weakness is that their effectiveness is limited to data sets with less than a few hundred points."
- **Handbook:** "Star plots are helpful for small-to-moderate-sized multivariate data sets. Their primary weakness is that their effectiveness is limited to data sets with less than a few hundred points."
- **Verdict: ACCURATE.** Nearly verbatim.

### Importance
- **Site:** "The star plot enables the comparison of multivariate profiles across observations in a compact, visually intuitive format."
- **Handbook:** The handbook's importance section discusses the weakness (limited scalability). The site frames importance positively.
- **Verdict: ACCEPTABLE.** The site's importance statement is factually correct and complementary rather than contradictory to the handbook.

### SVG Generator (star-plot.ts)
- **Single-star mode:** Renders equi-angular spokes with grid rings at 20/40/60/80/100%, data polygon, and axis labels. Correctly scales values to [0, maxValue] range.
- **Multi-star grid mode:** Renders multiple small stars in a grid layout, each observation as its own star — matching the NIST convention ("Typically, star plots are generated in a multi-plot format with many stars on each page and each star representing one observation").
- Uses `polarToCartesian` for coordinate calculation.
- **Verdict: ACCURATE.** Good implementation matching NIST multi-plot convention.

### Issues Found

- **MINOR ISSUE: Variable count in sample data.** The NIST handbook lists 10 variables for the automobile star plot (Price, Mileage, 1978 Repair, 1977 Repair, Headroom, Rear Seat Room, Trunk Space, Weight, [unnamed "9"], Length). The site's Python code example lists 9 variables (`categories` list has 9 entries). However, examining the NIST source more carefully, item 9 in the handbook list just says "9" with no label — this appears to be a formatting artifact or unnamed variable. The site's Python code with 9 named variables is arguably better, though it deviates from the NIST source which had 10. **This is very minor and affects only the example code, not the technique description.**

---

## 5. Youden Plot (NIST 1.3.3.31)

**Handbook source:** `handbook/eda/section3/youdplot.htm`

### Definition
- **Site:** "A Youden plot is a scatter plot used in interlaboratory studies that plots the result from one run or condition against the result from a second run or condition for each laboratory, with reference lines drawn at the medians of both runs."
- **Handbook:** "Youden plots are formed by: Vertical axis: Response variable 1 (i.e., run 1 or product 1 response value); Horizontal axis: Response variable 2 (i.e., run 2 or product 2 response value)" and "In addition, the plot symbol is the lab id."
- **Verdict: MOSTLY ACCURATE.** However, there is a subtle issue:
  - The site says "reference lines drawn at the medians of both runs."
  - The handbook does NOT specify medians for the reference lines. The handbook says "Sometimes a 45-degree reference line is drawn" but does not mention median reference lines at all.
  - **ISSUE:** The site adds median reference lines as a core part of the definition. While median reference lines are common in practice for Youden plots, the NIST handbook does not mention them. The handbook only mentions a 45-degree reference line. The site's `definitionExpanded` further states "Vertical and horizontal reference lines are drawn at the medians of each run, dividing the plot into four quadrants" — this is a common convention but not from the NIST source.

### Purpose
- **Site:** "Use a Youden plot when analyzing data from interlaboratory comparisons, proficiency testing, or paired-sample studies."
- **Handbook:** "Youden plots are a graphical technique for analyzing interlab data when each lab has made two runs on the same product or one run on two different products."
- **Verdict: ACCURATE.** The site correctly captures the purpose and adds "proficiency testing" which is a legitimate use case.

### Interpretation
- **Site:** Describes the four-quadrant interpretation based on median reference lines, diagonal pattern indicating between-lab bias, uniform scatter indicating within-lab variability.
- **Handbook:** Discusses "between-laboratory variability and within-laboratory variability" and the 45-degree line for consistency. The quadrant-based interpretation from median lines is **not in the handbook**.
- **Verdict: PARTIALLY ACCURATE.** The interpretation is sound statistical methodology but goes beyond what the handbook states. The handbook's interpretation focuses on departures from the 45-degree line (for same-product two-run case) or from a fitted line (for two-product case). The four-quadrant / median-based interpretation, while valid and commonly taught, is not from the NIST source.

### Questions
- **Site:** 4 questions matching handbook exactly.
- **Handbook:** Same 4 questions.
- **Verdict: ACCURATE.**

### Importance
- **Site:** "The Youden plot is the standard graphical tool for interlaboratory studies and proficiency testing."
- **Handbook:** "In interlaboratory studies or in comparing two runs from the same lab, it is useful to know if consistent results are generated."
- **Verdict: ACCURATE.**

### Assumptions
- **Site:** "The median reference lines are used instead of means because they are robust to outlying laboratories."
- **Handbook:** Does not mention median reference lines at all.
- **Verdict: **ISSUE** — The assumption about median reference lines is an addition not supported by the handbook. The handbook's Youden plot uses a 45-degree line as the reference, not median lines.

### SVG Generator
- No dedicated Youden plot SVG generator found. It would presumably use the scatter-plot generator. This is consistent with the handbook which says "The Youden plot is essentially a scatter plot."
- **Verdict: ACCEPTABLE.** No dedicated generator needed.

### Issues Found

1. **MODERATE ISSUE: Median reference lines not in handbook.** The site's definition, interpretation, assumptions, and `definitionExpanded` all describe "median reference lines" dividing the plot into four quadrants. The NIST handbook **does not mention median reference lines** — it only mentions "Sometimes a 45-degree reference line is drawn." While median reference lines are a legitimate and commonly used enhancement, presenting them as part of the core definition misrepresents the handbook source. The site should either:
   - Clarify that median reference lines are a common practical addition beyond the basic NIST description, OR
   - Align the definition with the handbook by emphasizing the 45-degree reference line as the primary reference

2. **MINOR ISSUE: Python code uses medians.** The Python example code draws `axhline(med_x)` and `axvline(med_y)` plus a 45-degree line. This is fine for a practical example but reinforces the median-line emphasis not found in the handbook.

---

## Summary of All Issues

| Technique | Severity | Issue |
|---|---|---|
| Block Plot | None | Content is accurate |
| Mean Plot | Minor (cosmetic) | NIST sample uses connected dots; site uses bars |
| Std Dev Plot | Minor (cosmetic) | NIST sample uses connected dots; site uses bars |
| Star Plot | Very Minor | Python example has 9 variables vs NIST's 10 (item "9" in NIST source is unlabeled) |
| Youden Plot | **Moderate** | Median reference lines presented as core feature; NIST handbook only mentions 45-degree reference line |

### Overall Assessment

The comparison techniques content is **largely accurate and well-written**. Four of the five techniques (block-plot, mean-plot, std-deviation-plot, star-plot) are faithful to the handbook with only cosmetic differences. The one substantive issue is the Youden plot's emphasis on median reference lines which, while common in practice, goes beyond what the NIST handbook describes.
