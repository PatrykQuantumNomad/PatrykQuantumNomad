/**
 * NIST Validation Tests for Hypothesis Test Functions
 *
 * All expected values are from NIST/SEMATECH e-Handbook case studies.
 * Datasets are verbatim NIST .DAT files imported from datasets.ts.
 *
 * @see https://www.itl.nist.gov/div898/handbook/eda/section4/eda42.htm
 */
import { describe, it, expect } from 'vitest';
import {
  normalCDF,
  sortedMedian,
  pearsonCorrelation,
  chiSquareQuantile,
  tQuantile,
  fQuantile,
  runsTest,
  bartlettTest,
  leveneTest,
  andersonDarlingNormal,
  grubbsTest,
  ppccNormal,
  locationTest,
} from '../../src/lib/eda/math/statistics';
import {
  normalRandom,
  timeSeries as heatFlowMeter,
  cryothermometry,
  filterTransmittance,
} from '../../src/data/eda/datasets';

// ---------------------------------------------------------------------------
// Helper function tests
// ---------------------------------------------------------------------------
describe('normalCDF', () => {
  it('returns 0.5 for z=0', () => {
    expect(normalCDF(0)).toBeCloseTo(0.5, 10);
  });

  it('returns ~0.8413 for z=1', () => {
    expect(normalCDF(1)).toBeCloseTo(0.8413, 3);
  });

  it('returns ~0.0228 for z=-2', () => {
    expect(normalCDF(-2)).toBeCloseTo(0.0228, 3);
  });

  it('returns ~0.9772 for z=2', () => {
    expect(normalCDF(2)).toBeCloseTo(0.9772, 3);
  });
});

describe('sortedMedian', () => {
  it('returns middle value for odd-length sorted array', () => {
    expect(sortedMedian([1, 2, 3, 4, 5])).toBe(3);
  });

  it('returns average of two middle values for even-length sorted array', () => {
    expect(sortedMedian([1, 2, 3, 4])).toBe(2.5);
  });

  it('returns single value for length-1 array', () => {
    expect(sortedMedian([42])).toBe(42);
  });
});

describe('pearsonCorrelation', () => {
  it('returns 1 for perfectly correlated data', () => {
    expect(pearsonCorrelation([1, 2, 3, 4, 5], [2, 4, 6, 8, 10])).toBeCloseTo(1.0, 10);
  });

  it('returns -1 for perfectly anti-correlated data', () => {
    expect(pearsonCorrelation([1, 2, 3, 4, 5], [10, 8, 6, 4, 2])).toBeCloseTo(-1.0, 10);
  });

  it('returns ~0 for uncorrelated data', () => {
    const x = [1, 2, 3, 4, 5];
    const y = [2, 1, 4, 3, 5];
    const r = pearsonCorrelation(x, y);
    expect(Math.abs(r)).toBeLessThan(1.0);
  });
});

describe('chiSquareQuantile', () => {
  it('returns ~3.841 for p=0.95, df=1', () => {
    expect(chiSquareQuantile(0.95, 1)).toBeCloseTo(3.841, 1);
  });

  it('returns ~16.919 for p=0.95, df=9 (Bartlett critical value)', () => {
    expect(chiSquareQuantile(0.95, 9)).toBeCloseTo(16.919, 0);
  });
});

describe('tQuantile', () => {
  it('returns ~1.96 for p=0.975, df=large', () => {
    expect(tQuantile(0.975, 500)).toBeCloseTo(1.96, 1);
  });

  it('returns ~2.776 for p=0.975, df=4', () => {
    expect(tQuantile(0.975, 4)).toBeCloseTo(2.776, 1);
  });
});

describe('fQuantile', () => {
  it('returns reasonable F critical value for p=0.95, df1=9, df2=690', () => {
    const f = fQuantile(0.95, 9, 690);
    expect(f).toBeGreaterThan(1.5);
    expect(f).toBeLessThan(2.5);
  });
});

// ---------------------------------------------------------------------------
// Runs Test (NIST Section 1.3.5.13)
// ---------------------------------------------------------------------------
describe('runsTest', () => {
  it('normalRandom: Z = -1.0744, do not reject', () => {
    const result = runsTest(normalRandom);
    expect(result.statistic).toBeCloseTo(-1.0744, 1);
    expect(result.criticalValue).toBeCloseTo(1.96, 2);
    expect(result.reject).toBe(false);
  });

  it('cryothermometry: Z = -13.4162, reject', () => {
    const result = runsTest(cryothermometry);
    expect(result.statistic).toBeCloseTo(-13.4162, 0);
    expect(result.reject).toBe(true);
  });

  it('heatFlowMeter: Z = -3.2306, reject', () => {
    const result = runsTest(heatFlowMeter);
    expect(result.statistic).toBeCloseTo(-3.2306, 1);
    expect(result.reject).toBe(true);
  });

  it('filterTransmittance: Z = -5.3246, reject', () => {
    const result = runsTest(filterTransmittance);
    expect(result.statistic).toBeCloseTo(-5.3246, 0);
    expect(result.reject).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Bartlett Test (NIST Section 1.3.5.7)
// ---------------------------------------------------------------------------
describe('bartlettTest', () => {
  it('normalRandom (k=10): T = 2.3737, do not reject', () => {
    const result = bartlettTest(normalRandom, 10);
    expect(result.statistic).toBeCloseTo(2.3737, 0);
    expect(result.reject).toBe(false);
  });

  it('heatFlowMeter (k=10): T = 3.147, do not reject', () => {
    const result = bartlettTest(heatFlowMeter, 10);
    expect(result.statistic).toBeCloseTo(3.147, 0);
    expect(result.reject).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Levene Test (NIST Section 1.3.5.10)
// ---------------------------------------------------------------------------
describe('leveneTest', () => {
  it('cryothermometry (k=10): W = 1.43, do not reject', () => {
    const result = leveneTest(cryothermometry, 10);
    expect(result.statistic).toBeCloseTo(1.43, 0);
    expect(result.reject).toBe(false);
  });

  it('filterTransmittance (k=10): W = 0.971, do not reject', () => {
    const result = leveneTest(filterTransmittance, 10);
    expect(result.statistic).toBeCloseTo(0.971, 0);
    expect(result.reject).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Anderson-Darling Normality Test (NIST Section 1.3.5.14)
// ---------------------------------------------------------------------------
describe('andersonDarlingNormal', () => {
  it('normalRandom: A^2 = 1.0612, reject', () => {
    const result = andersonDarlingNormal(normalRandom);
    expect(result.statistic).toBeCloseTo(1.0612, 1);
    expect(result.reject).toBe(true);
  });

  it('cryothermometry: A^2 = 16.858, reject', () => {
    const result = andersonDarlingNormal(cryothermometry);
    expect(result.statistic).toBeCloseTo(16.858, 0);
    expect(result.reject).toBe(true);
  });

  it('heatFlowMeter: A^2 = 0.129, do not reject', () => {
    const result = andersonDarlingNormal(heatFlowMeter);
    expect(result.statistic).toBeCloseTo(0.129, 1);
    expect(result.reject).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Grubbs Test (NIST Section 1.3.5.17.1)
// ---------------------------------------------------------------------------
describe('grubbsTest', () => {
  it('normalRandom: G = 3.3681, do not reject', () => {
    const result = grubbsTest(normalRandom);
    expect(result.statistic).toBeCloseTo(3.3681, 1);
    expect(result.reject).toBe(false);
  });

  it('cryothermometry: G = 2.729, do not reject', () => {
    const result = grubbsTest(cryothermometry);
    expect(result.statistic).toBeCloseTo(2.729, 1);
    expect(result.reject).toBe(false);
  });

  it('heatFlowMeter: G = 2.918673, do not reject', () => {
    const result = grubbsTest(heatFlowMeter);
    expect(result.statistic).toBeCloseTo(2.918673, 1);
    expect(result.reject).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// PPCC Normal Test (Filliben 1975)
// ---------------------------------------------------------------------------
describe('ppccNormal', () => {
  it('normalRandom: r = 0.996, do not reject', () => {
    const result = ppccNormal(normalRandom);
    expect(result.statistic).toBeCloseTo(0.996, 2);
    expect(result.reject).toBe(false);
  });

  it('cryothermometry: r = 0.975, reject', () => {
    const result = ppccNormal(cryothermometry);
    expect(result.statistic).toBeCloseTo(0.975, 2);
    expect(result.reject).toBe(true);
  });

  it('heatFlowMeter: r = 0.996, do not reject', () => {
    const result = ppccNormal(heatFlowMeter);
    expect(result.statistic).toBeCloseTo(0.996, 2);
    expect(result.reject).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Location Test (slope regression t-statistic)
// ---------------------------------------------------------------------------
describe('locationTest', () => {
  it('normalRandom: t = -0.1251, do not reject', () => {
    const result = locationTest(normalRandom);
    expect(result.tStatistic).toBeCloseTo(-0.1251, 1);
    expect(result.reject).toBe(false);
  });

  it('cryothermometry: t = 4.445, reject', () => {
    const result = locationTest(cryothermometry);
    expect(result.tStatistic).toBeCloseTo(4.445, 0);
    expect(result.reject).toBe(true);
  });

  it('heatFlowMeter: t = -1.960, do not reject', () => {
    const result = locationTest(heatFlowMeter);
    expect(result.tStatistic).toBeCloseTo(-1.960, 0);
    expect(result.reject).toBe(false);
  });

  it('filterTransmittance: t = 5.582, reject', () => {
    const result = locationTest(filterTransmittance);
    expect(result.tStatistic).toBeCloseTo(5.582, 0);
    expect(result.reject).toBe(true);
  });
});
