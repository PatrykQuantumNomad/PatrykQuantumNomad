/**
 * Technique content for designed-experiments analysis techniques.
 *
 * Techniques: doe-plots
 */

import type { TechniqueContent } from './types';

export const DESIGNED_EXPERIMENTS_CONTENT: Record<string, TechniqueContent> = {
  'doe-plots': {
    definition:
      'DOE plots are a set of three diagnostic scatter plots used in designed experiments: the DOE scatter plot, the DOE mean plot, and the DOE standard deviation plot. Together, they show the raw data, group means $\\bar{x}_j$, and group standard deviations $s_j$ for each factor level, providing a comprehensive graphical summary of factor effects on both location and spread.',
    purpose:
      'Use DOE plots when analyzing results from a factorial or screening experiment to quickly identify which factors have significant effects on the response. The DOE scatter plot reveals the raw data distribution by factor level, the mean plot highlights location shifts by comparing each $\\bar{x}_j$ to the grand mean $\\bar{\\bar{x}}$, and the standard deviation plot highlights dispersion effects. These plots are especially useful as a first step before formal ANOVA, as they provide immediate visual evidence of which factors matter and whether assumptions of equal variance hold.',
    interpretation:
      'In the DOE scatter plot, the horizontal axis represents factor levels and the vertical axis represents the response; a solid horizontal line marks the grand mean, and the spread of points at each level shows within-group variability. In the mean plot, each factor level is represented by its sample mean $\\bar{x}_j$, with a horizontal reference line at the grand mean $\\bar{\\bar{x}}$; note that the mean plot does not provide a definitive answer about factor importance, but it helps categorize factors as "clearly important", "clearly not important", or of "borderline importance". In the standard deviation plot, each factor level shows its sample standard deviation $s_j$; if the standard deviations differ markedly across levels, the factor affects the process variability and not just the average. Factors whose mean plots show large separation and whose standard deviation plots show roughly equal values are strong candidates for pure location effects.',
    assumptions:
      'DOE plots assume that the experiment was conducted according to the planned design with proper randomization. They are most effective for two-level or low-level factorial designs. The visual assessment should be confirmed with formal ANOVA or effect significance tests, as visual impressions can be misleading when sample sizes are small.',
    nistReference: 'NIST/SEMATECH e-Handbook of Statistical Methods, Sections 1.3.3.11-13',
    questions: [
      'Which factors are important with respect to location and scale?',
      'Are there outliers?',
      'What is the ranked list of the important factors?',
      'How do the standard deviations vary across and within factors?',
      'Which are the most important factors with respect to scale?',
    ],
    importance:
      'In designed experiments, quickly identifying which factors affect the response (and whether they affect the mean, the variability, or both) is the first analytical step. DOE plots provide this visual screening before formal ANOVA, catching issues like non-constant variance and outliers that could invalidate the analysis. A ranked list of important factors guides subsequent modeling and optimization.',
    definitionExpanded:
      'The display consists of three panels: (1) DOE scatter plot showing all raw response values at each level of each factor, (2) DOE mean plot showing group means $\\bar{x}_j$ vs. factor level with a grand mean $\\bar{\\bar{x}}$ reference line, (3) DOE standard deviation plot showing group standard deviations $s_j$ vs. factor level with an overall $s$ reference line. Using the concept of the scatter plot matrix, DOE plots can be extended to show first-order interaction effects: for $k$ factors, a $k \\times k$ matrix is created where diagonal entries are the main-effect DOE plots and off-diagonal entry $(i, j)$ plots the interaction $X_i \\cdot X_j$.',
    formulas: [
      {
        label: 'Group Mean',
        tex: String.raw`\bar{x}_j = \frac{1}{n_j}\sum_{i=1}^{n_j} x_{ij}`,
        explanation:
          'The sample mean of all observations at the j-th factor level. Plotted on the DOE mean plot; large deviations from the grand mean indicate location effects.',
      },
      {
        label: 'Grand Mean',
        tex: String.raw`\bar{\bar{x}} = \frac{1}{N}\sum_{j=1}^{k}\sum_{i=1}^{n_j} x_{ij}`,
        explanation:
          'The overall mean of all N observations across all factor levels. Drawn as a horizontal reference line on the DOE mean plot.',
      },
      {
        label: 'Group Standard Deviation',
        tex: String.raw`s_j = \sqrt{\frac{1}{n_j - 1}\sum_{i=1}^{n_j}\left(x_{ij} - \bar{x}_j\right)^2}`,
        explanation:
          'The sample standard deviation within the j-th factor level. Plotted on the DOE standard deviation plot to reveal dispersion effects.',
      },
    ],
    examples: [
      {
        label: 'Interaction Effects Extension',
        description:
          'For $k$ factors, the DOE scatter or mean plot can be extended into a $k \\times k$ matrix. Diagonal entries show the main effect of each factor. Off-diagonal entry $(i, j)$ multiplies the coded factor levels $X_i \\cdot X_j$ to form an interaction variable, then plots the response (or mean) against this interaction variable. In a two-level design with coded levels $-1$ and $+1$, the interaction product is also $-1$ or $+1$. This extension quickly reveals which first-order interactions are significant.',
      },
    ],
    caseStudySlugs: ['ceramic-strength'],
    pythonCode: `import numpy as np
import matplotlib.pyplot as plt

# BOXBIKE2.DAT — Box, Hunter & Hunter (1978)
# 2^(7-4) fractional factorial: 7 factors, 2 levels, 8 runs
Y = np.array([69, 52, 60, 83, 71, 50, 59, 88])
X = np.array([
    [-1, -1, -1, +1, +1, +1, -1],
    [+1, -1, -1, -1, -1, +1, +1],
    [-1, +1, -1, -1, +1, -1, +1],
    [+1, +1, -1, +1, -1, -1, -1],
    [-1, -1, +1, +1, -1, -1, +1],
    [+1, -1, +1, -1, +1, -1, -1],
    [-1, +1, +1, -1, -1, +1, -1],
    [+1, +1, +1, +1, +1, +1, +1],
])
names = ['Seat', 'Dynamo', 'Bar', 'Gear', 'Coat', 'Meal', 'Tire']
grand_mean = Y.mean()

fig, axes = plt.subplots(1, 3, figsize=(18, 5))

# Panel 1: DOE scatter plot — raw data by factor level
for fi in range(7):
    lo = Y[X[:, fi] == -1]
    hi = Y[X[:, fi] == +1]
    jitter = np.random.default_rng(fi).uniform(-0.15, 0.15, len(lo))
    axes[0].scatter(fi - 0.2 + jitter, lo, c='steelblue', s=30, alpha=0.8)
    jitter = np.random.default_rng(fi + 7).uniform(-0.15, 0.15, len(hi))
    axes[0].scatter(fi + 0.2 + jitter, hi, c='steelblue', s=30, alpha=0.8)
axes[0].axhline(grand_mean, color='red', ls='-', lw=1, label=f'Grand Mean = {grand_mean:.1f}')
axes[0].set_xticks(range(7))
axes[0].set_xticklabels(names, fontsize=8, rotation=30)
axes[0].set_ylabel("Response (sec)")
axes[0].set_title("DOE Scatter Plot")
axes[0].legend(fontsize=8)
axes[0].grid(True, alpha=0.3)

# Panel 2: DOE mean plot
for fi in range(7):
    lo_mean = Y[X[:, fi] == -1].mean()
    hi_mean = Y[X[:, fi] == +1].mean()
    axes[1].plot([fi - 0.2, fi + 0.2], [lo_mean, hi_mean], 'o-',
                 color='steelblue', markersize=7, linewidth=1.5)
axes[1].axhline(grand_mean, color='red', ls='--', lw=1, label=f'Grand Mean = {grand_mean:.1f}')
axes[1].set_xticks(range(7))
axes[1].set_xticklabels(names, fontsize=8, rotation=30)
axes[1].set_ylabel("Mean")
axes[1].set_title("DOE Mean Plot")
axes[1].legend(fontsize=8)
axes[1].grid(True, alpha=0.3)

# Panel 3: DOE standard deviation plot
overall_sd = Y.std(ddof=1)
for fi in range(7):
    lo_sd = Y[X[:, fi] == -1].std(ddof=1)
    hi_sd = Y[X[:, fi] == +1].std(ddof=1)
    axes[2].plot([fi - 0.2, fi + 0.2], [lo_sd, hi_sd], 's-',
                 color='darkorange', markersize=7, linewidth=1.5)
axes[2].axhline(overall_sd, color='red', ls='--', lw=1, label=f'Overall SD = {overall_sd:.1f}')
axes[2].set_xticks(range(7))
axes[2].set_xticklabels(names, fontsize=8, rotation=30)
axes[2].set_ylabel("Std Deviation")
axes[2].set_title("DOE SD Plot")
axes[2].legend(fontsize=8)
axes[2].grid(True, alpha=0.3)

plt.suptitle("DOE Plots — BOXBIKE2.DAT (Box, Hunter & Hunter 1978)", y=1.02)
plt.tight_layout()
plt.show()`,
  },
} as const;
