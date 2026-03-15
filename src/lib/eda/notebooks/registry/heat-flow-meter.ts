import type { CaseStudyConfig } from './types';

export const config: CaseStudyConfig = {
  slug: 'heat-flow-meter',
  title: 'Heat Flow Meter 1',
  nistSection: '1.4.2.8',
  dataFile: 'ZARR13.DAT',
  skipRows: 25,
  expectedRows: 195,
  columns: ['Y'],
  responseVariable: 'Y',
  expectedStats: {
    mean: 9.261460,
    stdDev: 0.022789,
    min: 9.196848,
    max: 9.327973,
    median: 9.261952,
  },
  nistUrl: 'https://www.itl.nist.gov/div898/handbook/eda/section4/eda4281.htm',
  githubRawUrl: 'https://raw.githubusercontent.com/PatrykQuantumNomad/PatrykQuantumNomad/main/notebooks/eda/data/heat-flow-meter.csv',
  plotTitles: {
    fourPlot: '4-Plot of Heat Flow Meter Calibration Factor',
    runSequence: 'Run Sequence Plot of Heat Flow Meter Calibration Factor',
    lagPlot: 'Lag Plot of Heat Flow Meter Calibration Factor',
    histogram: 'Histogram of Heat Flow Meter Calibration Factor',
    probabilityPlot: 'Normal Probability Plot of Heat Flow Meter Calibration Factor',
  },
  description: 'Bob Zarr, NIST, heat flow meter calibration factor (Jan 1990)',
};
