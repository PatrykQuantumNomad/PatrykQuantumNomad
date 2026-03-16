import type { CaseStudyConfig } from './types';

export const config: CaseStudyConfig = {
  slug: 'ceramic-strength',
  title: 'Ceramic Strength',
  nistSection: '1.4.2.10',
  dataFile: 'JAHANMI2.DAT',
  skipRows: 50,
  expectedRows: 480,
  columns: [
    'Run', 'Lab', 'Bar', 'Set', 'Y',
    'X1', 'X2', 'X3', 'X4', 'Trt',
    'SetOf15', 'Rep', 'CLabCode', 'Batch', 'Set2',
  ],
  responseVariable: 'Y',
  expectedStats: {
    mean: 650.0773,
    stdDev: 74.6383,
    min: 345.2940,
    max: 821.6540,
    median: 646.6275,
  },
  nistUrl: 'https://www.itl.nist.gov/div898/handbook/eda/section4/eda42a.htm',
  githubRawUrl: 'https://raw.githubusercontent.com/PatrykQuantumNomad/PatrykQuantumNomad/main/notebooks/eda/data/ceramic-strength.csv',
  plotTitles: {
    fourPlot: '4-Plot of Ceramic Strength',
    runSequence: 'Run Sequence Plot of Ceramic Strength',
    lagPlot: 'Lag Plot of Ceramic Strength',
    histogram: 'Histogram of Ceramic Strength',
    probabilityPlot: 'Normal Probability Plot of Ceramic Strength',
  },
  doeFactors: [
    { name: 'Table Speed', column: 'X1', levels: [-1, 1] },
    { name: 'Down Feed Rate', column: 'X2', levels: [-1, 1] },
    { name: 'Wheel Grit', column: 'X3', levels: [-1, 1] },
    { name: 'Direction', column: 'X4', levels: [-1, 1] },
  ],
  description: 'Said Jahanmir, NIST Ceramics Division, ceramic flexural strength (1996)',
  generation: 'The data were collected by Said Jahanmir of the NIST Ceramics Division in 1996 in connection with a NIST/industry ceramics consortium for strength optimization of ceramic strength. The motivation is to illustrate the analysis of multiple factors from a designed experiment.',
};
