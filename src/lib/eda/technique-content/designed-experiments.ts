/**
 * Technique content for designed-experiments analysis techniques.
 *
 * Techniques: doe-plots, std-deviation-plot
 */

import type { TechniqueContent } from './types';

export const DESIGNED_EXPERIMENTS_CONTENT: Record<string, TechniqueContent> = {
  'doe-plots': {
    definition:
      'DOE plots are a set of three diagnostic scatter plots used in designed experiments: the DOE scatter plot, the DOE mean plot, and the DOE standard deviation plot. Together, they show the raw data, group means, and group standard deviations for each factor level, providing a comprehensive graphical summary of factor effects on both location and spread.',
    purpose:
      'Use DOE plots when analyzing results from a factorial or screening experiment to quickly identify which factors have significant effects on the response. The DOE scatter plot reveals the raw data distribution by factor level, the mean plot highlights location shifts, and the standard deviation plot highlights dispersion effects. These plots are especially useful as a first step before formal ANOVA, as they provide immediate visual evidence of which factors matter and whether assumptions of equal variance hold.',
    interpretation:
      'In the DOE scatter plot, the horizontal axis represents factor levels and the vertical axis represents the response; the spread of points at each level shows within-group variability. In the mean plot, each factor level is represented by its sample mean, with a horizontal reference line at the grand mean; large deviations from the grand mean indicate significant effects. In the standard deviation plot, each factor level shows its sample standard deviation; if the standard deviations differ markedly across levels, the factor affects the process variability and not just the average. Factors whose mean plots show large separation and whose standard deviation plots show roughly equal values are strong candidates for location effects.',
    assumptions:
      'DOE plots assume that the experiment was conducted according to the planned design with proper randomization. They are most effective for two-level or low-level factorial designs. The visual assessment should be confirmed with formal ANOVA or effect significance tests, as visual impressions can be misleading when sample sizes are small.',
    nistReference: 'NIST/SEMATECH e-Handbook of Statistical Methods, Sections 1.3.3.11-13',
    questions: [
      'Which factors are important with respect to location and scale?',
      'Are there outliers?',
    ],
    importance:
      'In designed experiments, quickly identifying which factors affect the response (and whether they affect the mean, the variability, or both) is the first analytical step. DOE plots provide this visual screening before formal ANOVA, catching issues like non-constant variance and outliers that could invalidate the analysis.',
    definitionExpanded:
      'The display consists of three panels: (1) DOE scatter plot showing all raw data points by factor level, (2) DOE mean plot showing group means vs. factor level with a grand mean reference line, (3) DOE standard deviation plot showing group standard deviations vs. factor level with an overall standard deviation reference line. Each panel addresses a different aspect of factor effects.',
    caseStudySlugs: ['ceramic-strength'],
    pythonCode: `import numpy as np
import matplotlib.pyplot as plt

# Generate factorial experiment data: 3 factor levels, 10 reps each
rng = np.random.default_rng(42)
levels = ['Low', 'Medium', 'High']
data = {
    'Low': rng.normal(20, 2, 10),
    'Medium': rng.normal(25, 3, 10),
    'High': rng.normal(30, 2.5, 10),
}

fig, axes = plt.subplots(1, 3, figsize=(15, 4))

# Panel 1: DOE scatter plot (raw data by factor level)
for i, (lbl, vals) in enumerate(data.items()):
    axes[0].scatter([i] * len(vals), vals, alpha=0.7, s=40)
axes[0].set_xticks(range(len(levels)))
axes[0].set_xticklabels(levels)
axes[0].set_ylabel("Response")
axes[0].set_title("DOE Scatter Plot")
axes[0].grid(True, alpha=0.3)

# Panel 2: Mean plot
means = [v.mean() for v in data.values()]
grand_mean = np.mean(means)
axes[1].plot(range(len(levels)), means, 'o-', markersize=10,
             color='steelblue', linewidth=2)
axes[1].axhline(grand_mean, color='red', linestyle='--',
                label=f'Grand Mean = {grand_mean:.1f}')
axes[1].set_xticks(range(len(levels)))
axes[1].set_xticklabels(levels)
axes[1].set_ylabel("Mean")
axes[1].set_title("DOE Mean Plot")
axes[1].legend(fontsize=9)
axes[1].grid(True, alpha=0.3)

# Panel 3: Standard deviation plot
stds = [v.std(ddof=1) for v in data.values()]
pooled_std = np.sqrt(np.mean([s**2 for s in stds]))
axes[2].plot(range(len(levels)), stds, 's-', markersize=10,
             color='darkorange', linewidth=2)
axes[2].axhline(pooled_std, color='red', linestyle='--',
                label=f'Pooled SD = {pooled_std:.2f}')
axes[2].set_xticks(range(len(levels)))
axes[2].set_xticklabels(levels)
axes[2].set_ylabel("Std Deviation")
axes[2].set_title("DOE Std Deviation Plot")
axes[2].legend(fontsize=9)
axes[2].grid(True, alpha=0.3)

plt.suptitle("DOE Plots — Factorial Experiment Diagnostics", y=1.02)
plt.tight_layout()
plt.show()`,
  },

  'std-deviation-plot': {
    definition:
      'A standard deviation plot displays the sample standard deviations for each level of a factor variable, with a horizontal reference line drawn at the pooled or overall standard deviation. It is the spread counterpart to the mean plot, focusing on whether a factor affects process variability rather than process average.',
    purpose:
      'Use a standard deviation plot in designed experiments to determine whether a factor influences the variability of the response. Dispersion effects, where a factor setting changes the spread of the output, are as important as location effects in process optimization and quality improvement. The standard deviation plot helps identify factors that can be used to reduce variability, which is a primary objective of robust parameter design and Taguchi methods.',
    interpretation:
      'The horizontal axis shows the factor levels and the vertical axis shows the sample standard deviations. The overall reference line serves as a benchmark for comparison. Factor levels with standard deviations well above the reference line indicate conditions that increase variability, while levels below the line indicate conditions that reduce variability. When comparing the standard deviation plot to the corresponding mean plot, a factor may affect both location and spread, only location, or only spread. Factors that affect spread are particularly valuable because setting them to the low-variability level can improve process consistency.',
    assumptions:
      'The standard deviation plot requires multiple observations per factor level to compute meaningful within-group standard deviations. The sample standard deviation is a less robust measure of spread than the interquartile range, so it can be sensitive to outliers within a group. For very small within-group sample sizes, the standard deviation estimates have high uncertainty and visual differences between factor levels may not be statistically significant.',
    nistReference: 'NIST/SEMATECH e-Handbook of Statistical Methods, Section 1.3.3.28',
    questions: [
      'Are there any shifts in variation?',
      'What is the magnitude of the shifts in variation?',
      'Is there a distinct pattern in the shifts in variation?',
    ],
    importance:
      'Dispersion effects (factors that change process variability) are as important as location effects in quality engineering. A factor that reduces variability without shifting the mean is ideal for robust parameter design. The standard deviation plot is the primary graphical tool for detecting these dispersion effects.',
    definitionExpanded:
      'The horizontal axis shows factor levels (categorical), and the vertical axis shows within-group sample standard deviations. A horizontal reference line is drawn at the pooled (overall) standard deviation. Factor levels whose standard deviations differ markedly from the reference line indicate dispersion effects.',
    formulas: [
      {
        label: 'Group Standard Deviation',
        tex: String.raw`s_j = \sqrt{\frac{1}{n_j - 1}\sum_{i=1}^{n_j}\left(x_{ij} - \bar{x}_j\right)^2}`,
        explanation:
          'The sample standard deviation within the j-th group, measuring the spread of observations around the group mean.',
      },
      {
        label: 'Pooled Standard Deviation',
        tex: String.raw`s_p = \sqrt{\frac{1}{k}\sum_{j=1}^{k} s_j^2}`,
        explanation:
          'The root-mean-square of the k group standard deviations, serving as the overall reference line on the standard deviation plot. Assumes equal group sizes.',
      },
    ],
    pythonCode: `import numpy as np
import matplotlib.pyplot as plt

# Generate grouped data: 5 factor levels, 12 observations each
rng = np.random.default_rng(42)
levels = ['L1', 'L2', 'L3', 'L4', 'L5']
spreads = [2.0, 3.5, 1.8, 4.2, 2.5]
groups = [rng.normal(50, s, 12) for s in spreads]

# Compute group standard deviations and pooled SD
stds = [g.std(ddof=1) for g in groups]
pooled_sd = np.sqrt(np.mean([s**2 for s in stds]))

fig, ax = plt.subplots(figsize=(8, 5))
ax.plot(range(len(levels)), stds, 's-', color='darkorange',
        markersize=10, linewidth=2, label='Group Std Dev')
ax.axhline(pooled_sd, color='red', linestyle='--', linewidth=1.5,
           label=f'Pooled SD = {pooled_sd:.2f}')
ax.set_xticks(range(len(levels)))
ax.set_xticklabels(levels)
ax.set_xlabel("Factor Level")
ax.set_ylabel("Standard Deviation")
ax.set_title("Standard Deviation Plot — Dispersion Effects")
ax.legend()
ax.grid(True, alpha=0.3)
plt.tight_layout()
plt.show()`,
  },
} as const;
