import type { CaseStudyConfig } from './types';

export const config: CaseStudyConfig = {
  slug: 'random-walk',
  title: 'Random Walk',
  nistSection: '1.4.2.3',
  dataFile: 'RANDWALK.DAT',
  skipRows: 25,
  expectedRows: 500,
  columns: ['Y'],
  responseVariable: 'Y',
  expectedStats: {
    mean: 3.2167,
    stdDev: 2.0787,
    min: -1.6384,
    max: 7.4152,
  },
  nistUrl: 'https://www.itl.nist.gov/div898/handbook/eda/section4/eda423.htm',
  githubRawUrl: 'https://raw.githubusercontent.com/PatrykQuantumNomad/PatrykQuantumNomad/main/notebooks/eda/data/random-walk.csv',
  plotTitles: {
    fourPlot: '4-Plot of Random Walk',
    runSequence: 'Run Sequence Plot of Random Walk',
    lagPlot: 'Lag Plot of Random Walk',
    histogram: 'Histogram of Random Walk',
    probabilityPlot: 'Normal Probability Plot of Random Walk',
  },
  modelParams: {
    type: 'ar1',
  },
  description: 'Cumulative sum of uniform random numbers minus 0.5',
  generation: 'A random walk can be generated from a set of uniform random numbers by the formula R(i) = SUM[j=1 to i][(U(j) - 0.5)]. The motivation for studying random walk data is to illustrate the effects of a known underlying autocorrelation structure (i.e., non-randomness) in the data.',
};
