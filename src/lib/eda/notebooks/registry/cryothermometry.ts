import type { CaseStudyConfig } from './types';

export const config: CaseStudyConfig = {
  slug: 'cryothermometry',
  title: 'Josephson Junction Cryothermometry',
  nistSection: '1.4.2.4',
  dataFile: 'SOULEN.DAT',
  skipRows: 25,
  expectedRows: 700,
  columns: ['Y'],
  responseVariable: 'Y',
  expectedStats: {
    mean: 2898.562,
    stdDev: 1.305,
    min: 2895.0,
    max: 2902.0,
    median: 2899.0,
  },
  nistUrl: 'https://www.itl.nist.gov/div898/handbook/eda/section4/eda424.htm',
  githubRawUrl: 'https://raw.githubusercontent.com/PatrykQuantumNomad/PatrykQuantumNomad/main/notebooks/eda/data/cryothermometry.csv',
  plotTitles: {
    fourPlot: '4-Plot of Cryothermometry Voltage Counts',
    runSequence: 'Run Sequence Plot of Cryothermometry Voltage Counts',
    lagPlot: 'Lag Plot of Cryothermometry Voltage Counts',
    histogram: 'Histogram of Cryothermometry Voltage Counts',
    probabilityPlot: 'Normal Probability Plot of Cryothermometry Voltage Counts',
  },
  valuesPerLine: 5,
  description: 'Bob Soulen, NIST, Josephson junction voltage counts (Oct 1971)',
  generation: 'This data set was collected by Bob Soulen of NIST in October 1971 as a sequence of observations from a volt meter to ascertain the process temperature in a Josephson junction cryothermometry experiment, with the response variable being voltage counts. The motivation is to illustrate the case where there is discreteness in the measurements, but the underlying assumptions hold.',
};
