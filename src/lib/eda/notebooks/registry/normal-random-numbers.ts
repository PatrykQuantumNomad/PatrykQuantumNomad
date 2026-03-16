import type { CaseStudyConfig } from './types';

export const config: CaseStudyConfig = {
  slug: 'normal-random-numbers',
  title: 'Normal Random Numbers',
  nistSection: '1.4.2.1',
  dataFile: 'RANDN.DAT',
  skipRows: 25,
  expectedRows: 500,
  columns: ['Y'],
  responseVariable: 'Y',
  expectedStats: {
    mean: -0.0029,
    stdDev: 1.0210,
    min: -2.6470,
    max: 3.4360,
    median: -0.0930,
  },
  nistUrl: 'https://www.itl.nist.gov/div898/handbook/eda/section4/eda421.htm',
  githubRawUrl: 'https://raw.githubusercontent.com/PatrykQuantumNomad/PatrykQuantumNomad/main/notebooks/eda/data/normal-random-numbers.csv',
  plotTitles: {
    fourPlot: '4-Plot of Normal Random Numbers',
    runSequence: 'Run Sequence Plot of Normal Random Numbers',
    lagPlot: 'Lag Plot of Normal Random Numbers',
    histogram: 'Histogram of Normal Random Numbers',
    probabilityPlot: 'Normal Probability Plot of Normal Random Numbers',
  },
  testParams: {
    targetMean: 0,
    alpha: 0.05,
  },
  valuesPerLine: 10,
  description: 'Rand Corporation 500 standard normal N(0,1) random numbers',
  generation: 'The normal random numbers used in this case study are from a Rand Corporation publication. The motivation for studying a set of normal random numbers is to illustrate the ideal case where all four underlying assumptions hold.',
};
