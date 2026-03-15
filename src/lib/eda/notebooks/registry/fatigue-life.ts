import type { CaseStudyConfig } from './types';

export const config: CaseStudyConfig = {
  slug: 'fatigue-life',
  title: 'Fatigue Life of Aluminum Alloy Specimens',
  nistSection: '1.4.2.9',
  dataFile: 'BIRNSAUN.DAT',
  skipRows: 25,
  expectedRows: 101,
  columns: ['Y'],
  responseVariable: 'Y',
  expectedStats: {
    mean: 1401,
    stdDev: 389,
    min: 370,
    max: 2440,
    median: 1340,
  },
  nistUrl: 'https://www.itl.nist.gov/div898/handbook/eda/section4/eda4291.htm',
  githubRawUrl: 'https://raw.githubusercontent.com/PatrykQuantumNomad/PatrykQuantumNomad/main/notebooks/eda/data/fatigue-life.csv',
  plotTitles: {
    fourPlot: '4-Plot of Fatigue Life',
    runSequence: 'Run Sequence Plot of Fatigue Life',
    lagPlot: 'Lag Plot of Fatigue Life',
    histogram: 'Histogram of Fatigue Life',
    probabilityPlot: 'Normal Probability Plot of Fatigue Life',
  },
  description: 'Birnbaum & Saunders (1958), 6061-T6 aluminum fatigue life (kcycles)',
};
