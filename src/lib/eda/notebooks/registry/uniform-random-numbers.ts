import type { CaseStudyConfig } from './types';

export const config: CaseStudyConfig = {
  slug: 'uniform-random-numbers',
  title: 'Uniform Random Numbers',
  nistSection: '1.4.2.2',
  dataFile: 'RANDU.DAT',
  skipRows: 25,
  expectedRows: 500,
  columns: ['Y'],
  responseVariable: 'Y',
  expectedStats: {
    mean: 0.5078,
    stdDev: 0.2943,
    min: 0.0025,
    max: 0.9971,
    median: 0.5184,
  },
  nistUrl: 'https://www.itl.nist.gov/div898/handbook/eda/section4/eda4212.htm',
  githubRawUrl: 'https://raw.githubusercontent.com/PatrykQuantumNomad/PatrykQuantumNomad/main/notebooks/eda/data/uniform-random-numbers.csv',
  plotTitles: {
    fourPlot: '4-Plot of Uniform Random Numbers',
    runSequence: 'Run Sequence Plot of Uniform Random Numbers',
    lagPlot: 'Lag Plot of Uniform Random Numbers',
    histogram: 'Histogram of Uniform Random Numbers',
    probabilityPlot: 'Normal Probability Plot of Uniform Random Numbers',
  },
  testParams: {
    targetMean: 0.5,
    alpha: 0.05,
  },
  valuesPerLine: 5,
  description: 'Rand Corporation 500 uniform U(0,1) random numbers',
};
