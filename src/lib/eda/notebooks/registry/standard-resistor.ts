import type { CaseStudyConfig } from './types';

export const config: CaseStudyConfig = {
  slug: 'standard-resistor',
  title: 'Standard Resistor',
  nistSection: '1.4.2.7',
  dataFile: 'DZIUBA1.DAT',
  skipRows: 25,
  expectedRows: 1000,
  columns: ['Month', 'Day', 'Year', 'Resistance'],
  responseVariable: 'Resistance',
  expectedStats: {
    mean: 28.01634,
    stdDev: 0.06349,
    min: 27.82800,
    max: 28.11850,
    median: 28.02910,
  },
  nistUrl: 'https://www.itl.nist.gov/div898/handbook/eda/section4/eda427.htm',
  githubRawUrl: 'https://raw.githubusercontent.com/PatrykQuantumNomad/PatrykQuantumNomad/main/notebooks/eda/data/standard-resistor.csv',
  plotTitles: {
    fourPlot: '4-Plot of Standard Resistor Values',
    runSequence: 'Run Sequence Plot of Standard Resistor Values',
    lagPlot: 'Lag Plot of Standard Resistor Values',
    histogram: 'Histogram of Standard Resistor Values',
    probabilityPlot: 'Normal Probability Plot of Standard Resistor Values',
  },
  description: 'Ron Dziuba, NIST, standard resistor measurements (1980-1985)',
};
