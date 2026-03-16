import type { CaseStudyConfig } from './types';

export const config: CaseStudyConfig = {
  slug: 'filter-transmittance',
  title: 'Filter Transmittance',
  nistSection: '1.4.2.6',
  dataFile: 'MAVRO.DAT',
  skipRows: 25,
  expectedRows: 50,
  columns: ['Y'],
  responseVariable: 'Y',
  expectedStats: {
    mean: 2.0019,
    stdDev: 0.0004,
    min: 2.0013,
    max: 2.0027,
    median: 2.0018,
  },
  nistUrl: 'https://www.itl.nist.gov/div898/handbook/eda/section4/eda426.htm',
  githubRawUrl: 'https://raw.githubusercontent.com/PatrykQuantumNomad/PatrykQuantumNomad/main/notebooks/eda/data/filter-transmittance.csv',
  plotTitles: {
    fourPlot: '4-Plot of Filter Transmittance',
    runSequence: 'Run Sequence Plot of Filter Transmittance',
    lagPlot: 'Lag Plot of Filter Transmittance',
    histogram: 'Histogram of Filter Transmittance',
    probabilityPlot: 'Normal Probability Plot of Filter Transmittance',
  },
  description: 'Mavrodineanu, NIST, glass filter transmittance (1970s)',
  generation: 'This data set was collected by NIST chemist Radu Mavrodineanu in the 1970s from an automatic data acquisition system for a filter transmittance experiment. The motivation is to show how underlying autocorrelation in a relatively small data set helped the scientist detect problems with the automatic data acquisition system.',
};
