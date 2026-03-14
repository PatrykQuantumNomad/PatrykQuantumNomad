/**
 * Quantum Explorer dark theme for matplotlib/seaborn in EDA notebooks.
 *
 * Colors match the site's dark mode CSS custom properties:
 *   Background: #0f1117 (--color-surface)
 *   Surface:    #1a1d27 (--color-surface-alt)
 *   Accent:     #e06040 (--color-accent)
 *   Teal:       #00a3a3 (--color-accent-secondary)
 *   Text:       #e8e8f0 (--color-text-primary)
 *   Secondary:  #9ca3af (--color-text-secondary)
 *   Border:     #2a2d3a (--color-border)
 */

/** TypeScript color constants matching the Quantum Explorer dark theme */
export const QUANTUM_COLORS: Record<string, string> = {
  background: '#0f1117',
  surface: '#1a1d27',
  accent: '#e06040',
  teal: '#00a3a3',
  text: '#e8e8f0',
  textSecondary: '#9ca3af',
  border: '#2a2d3a',
  gradientStart: '#e06040',
  gradientEnd: '#00a3a3',
};

/** Color cycle for multiple data series in plots */
export const QUANTUM_PALETTE: string[] = [
  '#e06040', '#00a3a3', '#f0c040', '#a080e0', '#60c0a0', '#e080a0',
];

/**
 * Python source lines for matplotlib/seaborn Quantum Explorer dark theme.
 * Used by codeCell factory to create the theme setup cell in every notebook.
 */
export const THEME_SETUP_CODE: string[] = [
  '# Quantum Explorer dark theme for matplotlib/seaborn',
  '# Matches the site color scheme for visual consistency',
  '',
  'import matplotlib.pyplot as plt',
  'import seaborn as sns',
  '',
  'QUANTUM_COLORS = {',
  "    'background': '#0f1117',",
  "    'surface': '#1a1d27',",
  "    'accent': '#e06040',",
  "    'teal': '#00a3a3',",
  "    'text': '#e8e8f0',",
  "    'text_secondary': '#9ca3af',",
  "    'border': '#2a2d3a',",
  "    'gradient_start': '#e06040',",
  "    'gradient_end': '#00a3a3',",
  '}',
  '',
  '# Color cycle for multiple series',
  "QUANTUM_PALETTE = ['#e06040', '#00a3a3', '#f0c040', '#a080e0', '#60c0a0', '#e080a0']",
  '',
  'plt.rcParams.update({',
  "    'figure.facecolor': QUANTUM_COLORS['background'],",
  "    'axes.facecolor': QUANTUM_COLORS['surface'],",
  "    'axes.edgecolor': QUANTUM_COLORS['border'],",
  "    'axes.labelcolor': QUANTUM_COLORS['text'],",
  "    'axes.titlecolor': QUANTUM_COLORS['text'],",
  "    'xtick.color': QUANTUM_COLORS['text_secondary'],",
  "    'ytick.color': QUANTUM_COLORS['text_secondary'],",
  "    'text.color': QUANTUM_COLORS['text'],",
  "    'grid.color': QUANTUM_COLORS['border'],",
  "    'grid.alpha': 0.5,",
  "    'figure.figsize': [10, 6],",
  "    'font.size': 12,",
  "    'axes.titlesize': 14,",
  "    'axes.labelsize': 12,",
  "    'axes.prop_cycle': plt.cycler('color', QUANTUM_PALETTE),",
  '})',
  '',
  "sns.set_theme(style='darkgrid', rc={",
  "    'axes.facecolor': QUANTUM_COLORS['surface'],",
  "    'figure.facecolor': QUANTUM_COLORS['background'],",
  "    'grid.color': QUANTUM_COLORS['border'],",
  "    'text.color': QUANTUM_COLORS['text'],",
  "    'axes.labelcolor': QUANTUM_COLORS['text'],",
  "    'xtick.color': QUANTUM_COLORS['text_secondary'],",
  "    'ytick.color': QUANTUM_COLORS['text_secondary'],",
  '})',
  '',
  "print('Quantum Explorer theme configured.')",
];

/**
 * Python source lines for dependency check + install cell.
 * Uses try/except import checks with !pip install fallback.
 * This is the first cell in every notebook.
 */
export const DEPENDENCY_CHECK_CODE: string[] = [
  '# Check dependencies and install if missing',
  'try:',
  '    import numpy as np',
  '    import scipy',
  '    import pandas as pd',
  '    import matplotlib.pyplot as plt',
  '    import seaborn as sns',
  'except ImportError:',
  '    !pip install numpy scipy pandas matplotlib seaborn',
  '    import numpy as np',
  '    import scipy',
  '    import pandas as pd',
  '    import matplotlib.pyplot as plt',
  '    import seaborn as sns',
  '',
  "print(f'NumPy {np.__version__}, SciPy {scipy.__version__}, Pandas {pd.__version__}')",
  "print(f'Matplotlib {plt.matplotlib.__version__}, Seaborn {sns.__version__}')",
];
