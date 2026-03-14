import type { CaseStudyConfig } from './types';

export const config: CaseStudyConfig = {
  slug: 'beam-deflections',
  title: 'Beam Deflections',
  nistSection: '1.4.2.5',
  dataFile: 'LEW.DAT',
  skipRows: 25,
  expectedRows: 200,
  columns: ['Y'],
  responseVariable: 'Y',
  expectedStats: {
    mean: -177.435,
    stdDev: 277.332,
    min: -579.0,
    max: 300.0,
    median: -162.0,
  },
  nistUrl: 'https://www.itl.nist.gov/div898/handbook/eda/section4/eda4251.htm',
  githubRawUrl: 'https://raw.githubusercontent.com/PatrykQuantumNomad/PatrykQuantumNomad/main/handbook/datasets/LEW.DAT',
  plotTitles: {
    fourPlot: '4-Plot of Beam Deflections',
    runSequence: 'Run Sequence Plot of Beam Deflections',
    lagPlot: 'Lag Plot of Beam Deflections',
    histogram: 'Histogram of Beam Deflections',
    probabilityPlot: 'Normal Probability Plot of Beam Deflections',
  },
  modelParams: {
    type: 'sinusoidal',
  },
  description: 'H. S. Lew, NBS, steel-concrete beam deflection (1969)',
};
