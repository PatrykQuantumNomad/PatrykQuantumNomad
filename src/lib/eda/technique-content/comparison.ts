/**
 * Technique content for comparison analysis techniques.
 *
 * Techniques: block-plot, mean-plot, std-deviation-plot, star-plot, youden-plot
 */

import type { TechniqueContent } from './types';

export const COMPARISON_CONTENT: Record<string, TechniqueContent> = {
  'block-plot': {
    definition:
      'A block plot displays the response values from a designed experiment organized by block positions on the horizontal axis. Each position is drawn as an outlined vertical rectangle spanning the min-to-max response range, with bold plot characters (numerals) placed inside at their Y-value positions to mark treatment levels. Scanning across all positions reveals how often one treatment outperforms the other.',
    purpose:
      'Check whether a factor of interest (the primary factor) has an effect that is robust over all other factors. The block plot displays the response for every combination of nuisance factor levels, letting you see whether one setting of the primary factor consistently outperforms the other regardless of the nuisance factor combination. It replaces the analysis of variance F-test with a less assumption-dependent binomial test.',
    interpretation:
      'Each block position on the horizontal axis represents one combination of nuisance factors (e.g., plant × speed × shift). An outlined rectangle spans the min-to-max response range within that position. Plot characters (e.g., "1" for Method 1, "2" for Method 2) are placed inside each rectangle at their observed response values on the vertical axis. The primary diagnostic is counting: scan across all positions and tally how often one treatment is above or below the other. If treatment 1 is consistently above treatment 2 across most positions, the treatment effect is robust regardless of the nuisance factor combination. In the canonical NIST example, Method 2 is lower (better) than Method 1 in 10 of 12 positions — a result with approximately 2% probability under the null hypothesis, replacing the F-test with a simple binomial test.',
    assumptions:
      'The block plot assumes a balanced or near-balanced design where each treatment appears in every combination of nuisance factor levels. It is most effective when the number of combinations and treatment levels is moderate, as very large designs produce cluttered displays. Block plots are not available in most general-purpose statistical software programs, but they can be generated with custom code in Python, R, or similar tools.',
    nistReference: 'NIST/SEMATECH e-Handbook of Statistical Methods, Section 1.3.3.3',
    questions: [
      'Is the factor of interest significant?',
      'Does the factor of interest have an effect?',
      'Does the location change between levels of the primary factor?',
      'Has the process improved?',
      'What is the best setting (level) of the primary factor?',
      'How much of an average improvement can we expect with this best setting of the primary factor?',
      'Is there an interaction between the primary factor and one or more nuisance factors?',
      'Does the effect of the primary factor change depending on the setting of some nuisance factor?',
      'Are there any outliers?',
    ],
    importance:
      'The block plot is a graphical technique that pointedly focuses on whether or not the primary factor conclusions are in fact robustly general. If one setting of the primary factor does better than the other for all or most of the nuisance factor combinations, then the conclusion is general and robust. It replaces a quantitative procedure (analysis of variance) with a graphical procedure and an F-test with a binomial test, requiring fewer statistical assumptions.',
    definitionExpanded:
      'Each block position corresponds to one combination of nuisance factors (e.g., plant × speed × shift). An outlined vertical rectangle spans the full response range within that position. Bold numerals (plot characters) mark the treatment levels at their response values inside the rectangle. The height of each rectangle reflects the total variability within that combination, while the relative placement of the characters inside shows which treatment level is higher or lower — enabling a simple counting diagnostic that replaces the ANOVA F-test with a binomial argument.',
    caseStudySlugs: ['ceramic-strength'],
    examples: [
      {
        label: 'Consistent Treatment Effect',
        description:
          'The same plot character (e.g., "2") is consistently lower across all or most block positions, indicating the treatment effect is robust over all nuisance factor combinations. The factor of interest has a main effect with no interaction.',
      },
      {
        label: 'Block-by-Treatment Interaction',
        description:
          'The relative ordering of plot characters reverses between some block positions — "1" is lower in some blocks but "2" is lower in others. The factor of interest behaves differently under different nuisance factor combinations, and the interaction must be investigated.',
      },
      {
        label: 'Robustly General Conclusion',
        description:
          'If one primary factor level is better in 10 of 12 blocks, the chance of this happening by chance is about 2% (like getting 10 heads in 12 coin flips). The binomial test confirms the treatment effect is statistically significant without requiring normality or equal-variance assumptions.',
      },
    ],
    pythonCode: `import numpy as np
import matplotlib.pyplot as plt
from matplotlib.patches import Rectangle

# NIST-style block plot: 12 blocks (2 plants x 2 speeds x 3 shifts)
# 2 weld methods as primary factor
rng = np.random.default_rng(42)
base_m1, base_m2 = 27, 20
plant_eff = [0, -4]
speed_eff = [0, 2]
shift_eff = [0, -2, 3]
labels, m1_vals, m2_vals = [], [], []
for p in range(2):
    for sp in range(2):
        for sh in range(3):
            eff = plant_eff[p] + speed_eff[sp] + shift_eff[sh]
            m1_vals.append(base_m1 + eff + rng.normal(0, 2))
            m2_vals.append(base_m2 + eff + rng.normal(0, 2))
            labels.append(f"P{p+1}/{'FS'[sp]}/Sh{sh+1}")
x = np.arange(len(labels))
bar_w = 0.5

fig, ax = plt.subplots(figsize=(10, 5))
for i, (v1, v2) in enumerate(zip(m1_vals, m2_vals)):
    lo, hi = min(v1, v2), max(v1, v2)
    pad = (hi - lo) * 0.15 + 0.5
    ax.add_patch(Rectangle((i - bar_w / 2, lo - pad), bar_w, hi - lo + 2 * pad,
                            fill=False, edgecolor="gray", lw=1))
    ax.text(i, v1, "1", ha="center", va="center",
            fontsize=11, fontweight="bold")
    ax.text(i, v2, "2", ha="center", va="center",
            fontsize=11, fontweight="bold")
all_vals = m1_vals + m2_vals
ax.set_ylim(min(all_vals) - 3, max(all_vals) + 3)
ax.set_xticks(x)
ax.set_xticklabels(labels, rotation=45, ha="right", fontsize=8)
ax.set_ylabel("Defects per Hour")
ax.set_xlabel("Plant (2) x Speed (2) x Shift (3)")
ax.set_title("Block Plot — Randomized Block Design")
ax.set_xlim(-0.6, len(labels) - 0.4)
ax.grid(True, axis="y", alpha=0.3)
plt.subplots_adjust(bottom=0.22)
plt.show()`,
  },

  'mean-plot': {
    definition:
      'A mean plot displays the group means versus group identifier, with a horizontal reference line drawn at the overall mean of all observations. The grouping is determined by the analyst: groups may be levels of a factor variable, time periods such as months, or arbitrary equal-sized segments of a data series.',
    purpose:
      'Use a mean plot to see if the mean varies between different groups of the data. Mean plots can detect shifts in location across factor levels, time periods, or any analyst-defined grouping. For ungrouped data, the series can be split into an arbitrary number of equal-sized groups to check whether the mean is changing over time. The mean plot is typically used in conjunction with the standard deviation plot: the mean plot checks for shifts in location while the standard deviation plot checks for shifts in scale.',
    interpretation:
      'The horizontal axis shows the group identifier and the vertical axis shows the corresponding group mean. A horizontal reference line at the overall mean provides a baseline for comparison. Groups whose means depart noticeably from the overall mean line indicate shifts in location. The magnitude of the departure indicates the size of the shift, and systematic patterns (e.g., an upward trend or a step change) reveal whether location is drifting or changing abruptly. Although the mean is the most common measure of location, the same concept applies to the median or trimmed mean when significant outliers are present.',
    assumptions:
      'The mean plot assumes that the sample means are reasonable estimators of the population means, which requires that within-group sample sizes are not too small. It does not account for variability within each group, so it should be interpreted in conjunction with the standard deviation plot or box plots. Equal sample sizes across groups are not required but simplify interpretation.',
    nistReference: 'NIST/SEMATECH e-Handbook of Statistical Methods, Section 1.3.3.20',
    questions: [
      'Are there any shifts in location?',
      'What is the magnitude of the shifts in location?',
      'Is there a distinct pattern in the shifts in location?',
    ],
    importance:
      'A common assumption in one-factor analyses is that of constant location across different levels of the factor variable. The mean plot provides a graphical check for that assumption. For univariate data, grouping the data into equal-sized intervals and plotting the group means provides a graphical test of whether the location is constant over time.',
    definitionExpanded:
      'The horizontal axis shows group identifiers (categorical labels such as factor levels, months, or sequential group numbers). The vertical axis shows the group mean for each group. A horizontal reference line at the overall mean of all observations provides a baseline for comparison. The deviation of each group mean from the overall mean line indicates where and by how much the location shifts.',
    formulas: [
      {
        label: 'Group Mean',
        tex: String.raw`\bar{x}_j = \frac{1}{n_j}\sum_{i=1}^{n_j} x_{ij}`,
        explanation:
          'The mean of all observations within the j-th group, where n_j is the number of observations in that group.',
      },
      {
        label: 'Overall Mean',
        tex: String.raw`\bar{x} = \frac{1}{N}\sum_{i=1}^{N} x_i`,
        explanation:
          'The mean of all N observations pooled across all groups, serving as the horizontal reference line on the mean plot.',
      },
    ],
    pythonCode: `import numpy as np
import matplotlib.pyplot as plt

# Monthly data — location shifts after month 6 (NIST 1.3.3.20 style)
rng = np.random.default_rng(42)
months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
          'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
# First 6 months: mean ~20; last 6 months: mean ~25
true_means = [20, 21, 19, 20, 22, 20, 25, 26, 24, 25, 27, 25]
n_per_group = 20
groups = [rng.normal(mu, 3, n_per_group) for mu in true_means]

# Compute group means and overall mean (mean of all observations)
means = [g.mean() for g in groups]
all_data = np.concatenate(groups)
overall_mean = all_data.mean()

fig, ax = plt.subplots(figsize=(10, 5))
ax.plot(range(len(months)), means, 'o-', color='steelblue',
        markersize=8, linewidth=2, label='Group Mean')
ax.axhline(overall_mean, color='red', linestyle='--',
           linewidth=1.5, label=f'Overall Mean = {overall_mean:.1f}')
ax.set_xticks(range(len(months)))
ax.set_xticklabels(months)
ax.set_xlabel("Month")
ax.set_ylabel("Mean Response")
ax.set_title("Mean Plot — Shift in Location After Month 6")
ax.legend()
ax.grid(True, alpha=0.3)
plt.tight_layout()
plt.show()`,
  },

  'std-deviation-plot': {
    definition:
      'A standard deviation plot displays the group standard deviations versus group identifier, with a horizontal reference line drawn at the overall standard deviation. It is the scale counterpart to the mean plot, used to determine whether the variability of a process or measurement is constant across groups or changing over time.',
    purpose:
      'Use a standard deviation plot to detect changes in scale between groups of data. The grouping is determined by the analyst — the groups may be levels of a factor variable, months of the year, or arbitrary equal-sized segments of a time series. Standard deviation plots are typically used in conjunction with mean plots: the mean plot checks for shifts in location while the standard deviation plot checks for shifts in scale. A common assumption in one-factor analyses is that of equal variances; this plot provides a graphical check of that assumption.',
    interpretation:
      'The horizontal axis shows the group identifier and the vertical axis shows the group standard deviations. The overall reference line provides a baseline for comparison. Groups with standard deviations well above the reference line indicate periods or conditions of increased variability, while groups below the line indicate reduced variability. A distinct upward or downward trend suggests that the process variability is systematically changing over time. Although the standard deviation is the most commonly used measure of scale, the same concept applies to other robust measures such as the median absolute deviation or average absolute deviation, which may be preferred when significant outliers are present.',
    assumptions:
      'The standard deviation plot requires multiple observations per group to compute meaningful within-group standard deviations. The sample standard deviation is sensitive to outliers within a group; for data with significant outliers, consider using the median absolute deviation instead. For arbitrary time-based grouping, the choice of group size affects the resolution: too few groups may miss short-term shifts, while too many groups produce noisy estimates.',
    nistReference: 'NIST/SEMATECH e-Handbook of Statistical Methods, Section 1.3.3.28',
    questions: [
      'Are there any shifts in variation?',
      'What is the magnitude of the shifts in variation?',
      'Is there a distinct pattern in the shifts in variation?',
    ],
    importance:
      'A common assumption in one-factor analyses is that of equal variances across factor levels. The standard deviation plot provides a graphical check for that assumption. For univariate data, grouping the data into equal-sized intervals and plotting the standard deviation of each group provides a graphical test of whether the variance is constant over time.',
    definitionExpanded:
      'The horizontal axis shows group identifiers (categorical or ordered, e.g., months, time windows, or factor levels). The vertical axis shows the within-group standard deviation. A horizontal reference line is drawn at the overall standard deviation of the full dataset. When the standard deviations cluster near the reference line, the variance is approximately constant across groups. Departures from the line reveal where and by how much the variability changes.',
    formulas: [
      {
        label: 'Group Standard Deviation',
        tex: String.raw`s_j = \sqrt{\frac{1}{n_j - 1}\sum_{i=1}^{n_j}\left(x_{ij} - \bar{x}_j\right)^2}`,
        explanation:
          'The sample standard deviation within the j-th group, measuring the spread of observations around the group mean.',
      },
      {
        label: 'Overall Standard Deviation',
        tex: String.raw`s = \sqrt{\frac{1}{N - 1}\sum_{i=1}^{N}\left(x_i - \bar{x}\right)^2}`,
        explanation:
          'The standard deviation of all N observations pooled together, serving as the horizontal reference line on the standard deviation plot.',
      },
    ],
    pythonCode: `import numpy as np
import matplotlib.pyplot as plt

# Monthly data — standard deviation by month (similar to NIST PBF11.DAT)
# Simulates a process where summer months have higher variability
rng = np.random.default_rng(42)
months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
          'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
# Higher spread in summer months (Jun-Aug)
spreads = [2.1, 1.9, 2.3, 2.8, 3.2, 4.5,
           5.1, 4.8, 3.5, 2.6, 2.0, 1.8]
groups = [rng.normal(50, s, 20) for s in spreads]

# Compute group standard deviations and overall SD
stds = [g.std(ddof=1) for g in groups]
all_data = np.concatenate(groups)
overall_sd = all_data.std(ddof=1)

fig, ax = plt.subplots(figsize=(10, 5))
ax.plot(range(len(months)), stds, 's-', color='darkorange',
        markersize=8, linewidth=2, label='Monthly Std Dev')
ax.axhline(overall_sd, color='red', linestyle='--', linewidth=1.5,
           label=f'Overall SD = {overall_sd:.2f}')
ax.set_xticks(range(len(months)))
ax.set_xticklabels(months)
ax.set_xlabel("Month")
ax.set_ylabel("Standard Deviation")
ax.set_title("Standard Deviation Plot — Monthly Variation")
ax.legend()
ax.grid(True, alpha=0.3)
plt.tight_layout()
plt.show()`,
  },

  'star-plot': {
    definition:
      'A star plot, also known as a radar chart or spider chart, displays multivariate data as a series of equi-angular spokes radiating from a central point, with each spoke representing a different variable. The data value for each variable determines the length of the corresponding spoke, and the tips of the spokes are connected to form a polygon whose shape provides a visual fingerprint of the observation.',
    purpose:
      'Use a star plot when comparing the multivariate profiles of individual observations or groups across many variables simultaneously. It is especially useful for comparing products, specimens, systems, or process conditions on multiple quality characteristics at once. The star plot enables rapid visual identification of which observations are similar, which are outliers, and which variables differentiate between groups. It is commonly used in quality control, benchmarking, and competitive analysis.',
    interpretation:
      'Each spoke of the star represents one variable, and the distance from the center indicates the magnitude of that variable, typically scaled to a common range. A large, regular polygon indicates an observation that scores highly on all variables. A small polygon indicates uniformly low values. An irregular or lopsided polygon highlights variables where the observation is unusually high or low. When multiple star plots are displayed side by side, similar polygon shapes indicate similar multivariate profiles, while contrasting shapes indicate differentiation. The area of the polygon provides a rough aggregate measure, but the shape is more informative than the area alone.',
    assumptions:
      'The star plot requires that all variables be measured on comparable scales or that the data be standardized before plotting. The visual impression depends on the ordering of variables around the perimeter, and different orderings can produce different visual patterns for the same data. The technique works best with 5 to 12 variables; fewer than 5 does not justify the radial layout, and more than 12 makes individual spokes difficult to distinguish. Star plots are helpful for small-to-moderate-sized multivariate data sets; their primary weakness is that their effectiveness is limited to data sets with less than a few hundred points, after which they tend to be overwhelming.',
    nistReference: 'NIST/SEMATECH e-Handbook of Statistical Methods, Section 1.3.3.29',
    questions: [
      'What variables are dominant for a given observation?',
      'Which observations are most similar (are there clusters)?',
      'Are there outliers?',
    ],
    importance:
      'The star plot enables the comparison of multivariate profiles across observations in a compact, visually intuitive format. It answers the question "which variables differentiate these observations?" at a glance, making it valuable for benchmarking, quality profiling, and competitive analysis where many attributes must be compared simultaneously.',
    definitionExpanded:
      'Each observation is represented as a separate star (polygon) with p spokes radiating from a center point at equal angles (360/p degrees apart). Each spoke represents one variable, and the spoke length is proportional to the variable\'s value (typically scaled to 0\u20131 range). The tips of the spokes are connected to form a polygon. Large, regular polygons indicate uniformly high values; small polygons indicate uniformly low values; irregular shapes highlight dominant variables.',
    pythonCode: `import numpy as np
import matplotlib.pyplot as plt

# 1979 Automobile Analysis — first 16 cars from AUTO79.DAT
# 9 variables per NIST Section 1.3.3.29 sample plot
categories = ['Price', 'MPG', 'Rep 78', 'Rep 77',
              'Headroom', 'Rear Seat', 'Trunk',
              'Weight', 'Length']
n_vars = len(categories)
angles = np.linspace(0, 2 * np.pi, n_vars, endpoint=False)

# Raw data from AUTO79.DAT (-1 = missing, clamped to 0)
cars = {
    'AMC Concord':    [4099, 22, 3, 2, 2.5, 27.5, 11, 2930, 186],
    'AMC Pacer':      [4749, 17, 3, 1, 3.0, 25.5, 11, 3350, 173],
    'AMC Spirit':     [3799, 22,-1,-1, 3.0, 18.5, 12, 2640, 168],
    'Audi 5000':      [9690, 17, 5, 2, 3.0, 27.0, 15, 2830, 189],
    'Audi Fox':       [6295, 23, 3, 3, 2.5, 28.0, 11, 2070, 174],
    'BMW 320i':       [9735, 25, 4, 4, 2.5, 26.0, 12, 2650, 177],
    'Buick Century':  [4816, 20, 3, 3, 4.5, 29.0, 16, 3250, 196],
    'Buick Electra':  [7827, 15, 4, 4, 4.0, 31.5, 20, 4080, 222],
    'Buick Le Sabre': [5788, 18, 3, 4, 4.0, 30.5, 21, 3670, 218],
    'Buick Opel':     [4453, 26,-1,-1, 3.0, 24.0, 10, 2230, 170],
    'Buick Regal':    [5189, 20, 3, 3, 2.0, 28.5, 16, 3280, 200],
    'Buick Riviera':  [10372,16, 3, 4, 3.5, 30.0, 17, 3880, 207],
    'Buick Skylark':  [4082, 19, 3, 3, 3.5, 27.0, 13, 3400, 200],
    'Cad. Deville':   [11385,14, 3, 3, 4.0, 31.5, 20, 4330, 221],
    'Cad. Eldorado':  [14500,14, 2, 2, 3.5, 30.0, 16, 3900, 204],
    'Cad. Seville':   [15906,21, 3, 3, 3.0, 30.0, 13, 4290, 204],
}

# Normalize each variable to [0, 1] by per-variable max (clamp negatives)
data = np.array(list(cars.values()))
data = np.clip(data, 0, None)
maxvals = data.max(axis=0)
normed = data / maxvals

cols, rows = 4, 4
fig, axes = plt.subplots(rows, cols, figsize=(12, 12),
                         subplot_kw=dict(polar=True))

for idx, (label, _) in enumerate(cars.items()):
    ax = axes[idx // cols, idx % cols]
    vals = np.concatenate([normed[idx], [normed[idx][0]]])
    angs = np.concatenate([angles, [angles[0]]])
    ax.plot(angs, vals, 'o-', linewidth=1.5, color='steelblue')
    ax.fill(angs, vals, alpha=0.2, color='steelblue')
    ax.set_thetagrids(np.degrees(angles), categories, fontsize=6)
    ax.set_ylim(0, 1.1)
    ax.set_title(label, fontsize=8, pad=10)

plt.suptitle("Star Plot — 1979 Automobile Analysis (NIST 1.3.3.29)",
             y=1.02, fontsize=13)
plt.tight_layout()
plt.show()`,
  },

  'youden-plot': {
    definition:
      'A Youden plot is a scatter plot used in interlaboratory studies that plots the result from one run or product against the result from a second run or product for each laboratory, with the lab identifier as the plot symbol. A 45-degree reference line is sometimes drawn to highlight departures from consistency between the two runs.',
    purpose:
      'Use a Youden plot when analyzing data from interlaboratory comparisons, proficiency testing, or paired-sample studies where each laboratory or instrument produces two measurements under different conditions. The plot reveals whether laboratories that score high on one measurement also score high on the other, which would indicate a systematic between-laboratory bias. It is a standard tool in metrology and quality assurance for identifying laboratories whose measurement systems are consistently biased.',
    interpretation:
      'The horizontal axis shows the result from one run or product and the vertical axis shows the result from the other. Each point is labeled with its lab identifier. When two runs of the same product are being compared, a 45-degree reference line indicates where labs that produce identical results on both runs would fall — departures from this line indicate within-lab inconsistency. If two different products are being tested, the 45-degree line may not be appropriate, but consistent labs should still cluster near some fitted straight line. A tight cluster of points along the diagonal indicates that between-laboratory variability dominates, while a diffuse cloud with no diagonal trend indicates that within-laboratory variability dominates.',
    assumptions:
      'The Youden plot requires paired measurements from each laboratory, typically two runs or two samples. It assumes that the two conditions are measured on comparable scales. The plot is most informative when the number of laboratories is moderate to large, typically 10 or more. When runs are on the same product, a 45-degree reference line is the natural baseline; when runs are on different products, a fitted straight line is more appropriate.',
    nistReference: 'NIST/SEMATECH e-Handbook of Statistical Methods, Section 1.3.3.31',
    questions: [
      'Are all labs equivalent?',
      'What labs have between-lab problems (reproducibility)?',
      'What labs have within-lab problems (repeatability)?',
      'What labs are outliers?',
    ],
    importance:
      'In interlaboratory studies or in comparing two runs from the same lab, it is useful to know if consistent results are generated. The Youden plot should be a routine plot for analyzing this type of data, as it separates between-lab systematic bias (points along the diagonal) from within-lab random variability (scatter perpendicular to the diagonal).',
    definitionExpanded:
      'Each laboratory is plotted as a single point with vertical coordinate = result from run/sample 1 and horizontal coordinate = result from run/sample 2. The plot symbol is the lab identifier (typically an integer from 1 to k). A 45-degree reference line is sometimes drawn: for two runs of the same product, labs producing consistent results should lie near this line. For two different products, the points should lie near some fitted straight line if the labs are consistent. Departures from the reference line indicate lab inconsistency.',
    pythonCode: `import numpy as np
import matplotlib.pyplot as plt

# Generate paired lab comparison data (15 labs, 2 runs on same product)
rng = np.random.default_rng(42)
n_labs = 15
lab_bias = rng.normal(0, 2, n_labs)  # between-lab systematic bias
run1 = 50 + lab_bias + rng.normal(0, 0.8, n_labs)
run2 = 50 + lab_bias + rng.normal(0, 0.8, n_labs)

fig, ax = plt.subplots(figsize=(7, 7))

# Plot each lab with its identifier as the marker
for i in range(n_labs):
    ax.text(run2[i], run1[i], str(i + 1), ha='center', va='center',
            fontsize=10, fontweight='bold', color='steelblue')

# 45-degree reference line (NIST convention for same-product comparisons)
lims = [min(run1.min(), run2.min()) - 1,
        max(run1.max(), run2.max()) + 1]
ax.plot(lims, lims, 'r-', alpha=0.5, label='45-degree line')
ax.set_xlim(lims)
ax.set_ylim(lims)
ax.set_xlabel("Run 2 Result")
ax.set_ylabel("Run 1 Result")
ax.set_title("Youden Plot — Interlaboratory Comparison")
ax.legend(fontsize=9)
ax.set_aspect('equal')
ax.grid(True, alpha=0.3)
plt.tight_layout()
plt.show()`,
  },
} as const;
