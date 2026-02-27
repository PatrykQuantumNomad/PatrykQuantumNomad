/**
 * Pure math functions for EDA SVG generators.
 * No D3, no DOM -- just arithmetic.
 */

/** Arithmetic mean */
export function mean(data: number[]): number {
  if (data.length === 0) return 0;
  return data.reduce((s, v) => s + v, 0) / data.length;
}

/** Sample standard deviation (Bessel's correction, n-1) */
export function standardDeviation(data: number[]): number {
  if (data.length < 2) return 0;
  const m = mean(data);
  const ss = data.reduce((s, v) => s + (v - m) ** 2, 0);
  return Math.sqrt(ss / (data.length - 1));
}

/**
 * Gaussian kernel density estimation.
 * Returns density values at each evaluation point.
 */
export function kde(
  data: number[],
  bandwidth: number,
  points: number[],
): number[] {
  if (data.length === 0 || bandwidth <= 0) return points.map(() => 0);
  const n = data.length;
  const coeff = 1 / (n * bandwidth * Math.sqrt(2 * Math.PI));
  return points.map((x) => {
    const sum = data.reduce((acc, xi) => {
      const u = (x - xi) / bandwidth;
      return acc + Math.exp(-0.5 * u * u);
    }, 0);
    return sum * coeff;
  });
}

/** Silverman's rule-of-thumb bandwidth selection */
export function silvermanBandwidth(data: number[]): number {
  if (data.length < 2) return 1;
  const n = data.length;
  const std = standardDeviation(data);
  const sorted = [...data].sort((a, b) => a - b);
  const q1 = sorted[Math.floor(n * 0.25)];
  const q3 = sorted[Math.floor(n * 0.75)];
  const iqr = q3 - q1;
  const spread = Math.min(std, iqr / 1.34);
  if (spread <= 0) return 1;
  return 0.9 * spread * Math.pow(n, -0.2);
}

/**
 * Ordinary least squares linear regression.
 * Returns slope, intercept, and R-squared.
 */
export function linearRegression(
  x: number[],
  y: number[],
): { slope: number; intercept: number; r2: number } {
  const n = x.length;
  if (n < 2) return { slope: 0, intercept: 0, r2: 0 };
  const mx = mean(x);
  const my = mean(y);
  let ssxy = 0;
  let ssxx = 0;
  let ssyy = 0;
  for (let i = 0; i < n; i++) {
    const dx = x[i] - mx;
    const dy = y[i] - my;
    ssxy += dx * dy;
    ssxx += dx * dx;
    ssyy += dy * dy;
  }
  if (ssxx === 0) return { slope: 0, intercept: my, r2: 0 };
  const slope = ssxy / ssxx;
  const intercept = my - slope * mx;
  const r2 = ssyy === 0 ? 1 : (ssxy * ssxy) / (ssxx * ssyy);
  return { slope, intercept, r2 };
}

/**
 * Normal quantile function (inverse CDF / probit).
 * Beasley-Springer-Moro rational approximation.
 */
export function normalQuantile(p: number): number {
  if (p <= 0) return -Infinity;
  if (p >= 1) return Infinity;
  if (p === 0.5) return 0;

  // Rational approximation constants
  const a = [
    -3.969683028665376e1, 2.209460984245205e2, -2.759285104469687e2,
    1.383577518672690e2, -3.066479806614716e1, 2.506628277459239e0,
  ];
  const b = [
    -5.447609879822406e1, 1.615858368580409e2, -1.556989798598866e2,
    6.680131188771972e1, -1.328068155288572e1,
  ];
  const c = [
    -7.784894002430293e-3, -3.223964580411365e-1, -2.400758277161838e0,
    -2.549732539343734e0, 4.374664141464968e0, 2.938163982698783e0,
  ];
  const d = [
    7.784695709041462e-3, 3.224671290700398e-1, 2.445134137142996e0,
    3.754408661907416e0,
  ];

  const pLow = 0.02425;
  const pHigh = 1 - pLow;
  let q: number;
  let r: number;

  if (p < pLow) {
    q = Math.sqrt(-2 * Math.log(p));
    return (
      (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
      ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1)
    );
  } else if (p <= pHigh) {
    q = p - 0.5;
    r = q * q;
    return (
      ((((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) *
        q) /
      (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1)
    );
  } else {
    q = Math.sqrt(-2 * Math.log(1 - p));
    return (
      -(
        (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q +
          c[5]) /
        ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1)
      )
    );
  }
}

/**
 * Normalized autocorrelation function.
 * Returns ACF values for lags 0..maxLag.
 */
export function autocorrelation(data: number[], maxLag: number): number[] {
  if (data.length === 0) return [];
  const n = data.length;
  const m = mean(data);
  let c0 = 0;
  for (let i = 0; i < n; i++) c0 += (data[i] - m) ** 2;
  if (c0 === 0) return Array(maxLag + 1).fill(1);

  const result: number[] = [];
  for (let k = 0; k <= maxLag; k++) {
    let ck = 0;
    for (let i = 0; i < n - k; i++) {
      ck += (data[i] - m) * (data[i + k] - m);
    }
    result.push(ck / c0);
  }
  return result;
}

/**
 * In-place Cooley-Tukey radix-2 FFT.
 * Input arrays must be power-of-2 length. Modifies arrays in place.
 */
export function fft(re: number[], im: number[]): void {
  const n = re.length;
  if (n <= 1) return;

  // Bit-reversal permutation
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1;
    while (j & bit) {
      j ^= bit;
      bit >>= 1;
    }
    j ^= bit;
    if (i < j) {
      [re[i], re[j]] = [re[j], re[i]];
      [im[i], im[j]] = [im[j], im[i]];
    }
  }

  // Cooley-Tukey butterfly
  for (let len = 2; len <= n; len *= 2) {
    const halfLen = len / 2;
    const angle = (-2 * Math.PI) / len;
    const wRe = Math.cos(angle);
    const wIm = Math.sin(angle);
    for (let i = 0; i < n; i += len) {
      let curRe = 1;
      let curIm = 0;
      for (let j = 0; j < halfLen; j++) {
        const tRe = curRe * re[i + j + halfLen] - curIm * im[i + j + halfLen];
        const tIm = curRe * im[i + j + halfLen] + curIm * re[i + j + halfLen];
        re[i + j + halfLen] = re[i + j] - tRe;
        im[i + j + halfLen] = im[i + j] - tIm;
        re[i + j] += tRe;
        im[i + j] += tIm;
        const newCurRe = curRe * wRe - curIm * wIm;
        curIm = curRe * wIm + curIm * wRe;
        curRe = newCurRe;
      }
    }
  }
}

/**
 * One-sided power spectral density.
 * Zero-pads data to next power of 2, runs FFT, returns PSD array (length N/2+1).
 */
export function powerSpectrum(data: number[]): number[] {
  if (data.length === 0) return [];
  const N = data.length;
  const mu = data.reduce((a, b) => a + b, 0) / N;

  // Blackman-Tukey (correlogram) method — matches NIST/DATAPLOT algorithm.
  // Reference: Jenkins & Watts (1968), DATAPLOT SPECTRAL PLOT command.

  // Step 1: Autocovariance (biased estimator, 1/N)
  const L = Math.floor(N / 4); // truncation lag
  const gamma: number[] = [];
  for (let k = 0; k <= L; k++) {
    let ck = 0;
    for (let i = 0; i < N - k; i++) {
      ck += (data[i] - mu) * (data[i + k] - mu);
    }
    gamma.push(ck / N);
  }

  // Step 2: Tukey-Hanning lag window: w(k) = 0.5*(1 + cos(pi*k/L))
  // Step 3: One-sided spectral density via cosine transform
  const nFreqs = Math.max(Math.floor(N / 2), 120);
  const psd: number[] = [];
  for (let j = 0; j < nFreqs; j++) {
    const f = j / (2 * (nFreqs - 1)); // 0 to 0.5
    let S = gamma[0]; // w(0) = 1
    for (let k = 1; k <= L; k++) {
      const w = 0.5 * (1 + Math.cos((Math.PI * k) / L));
      S += 2 * w * gamma[k] * Math.cos(2 * Math.PI * f * k);
    }
    psd.push(S * 2); // factor of 2 for one-sided spectrum
  }
  return psd;
}

// ---------------------------------------------------------------------------
// Helper functions for hypothesis tests
// ---------------------------------------------------------------------------

/**
 * Standard normal CDF (cumulative distribution function).
 * Uses the error function relationship: Phi(z) = 0.5 * (1 + erf(z / sqrt(2))).
 * erf implemented via Abramowitz & Stegun rational approximation (max error 1.5e-7).
 */
export function normalCDF(z: number): number {
  if (z === 0) return 0.5;
  // erf approximation: Abramowitz & Stegun 7.1.26
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;

  const sign = z < 0 ? -1 : 1;
  const x = Math.abs(z) / Math.SQRT2;
  const t = 1.0 / (1.0 + p * x);
  const erf = 1 - ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

  return 0.5 * (1 + sign * erf);
}

/**
 * Median of a pre-sorted array.
 * For even n, returns average of two middle values.
 */
export function sortedMedian(data: number[]): number {
  const n = data.length;
  if (n === 0) return 0;
  const mid = Math.floor(n / 2);
  if (n % 2 === 1) return data[mid];
  return (data[mid - 1] + data[mid]) / 2;
}

/**
 * Pearson product-moment correlation coefficient.
 * r = sum((xi-mx)(yi-my)) / sqrt(sum((xi-mx)^2) * sum((yi-my)^2))
 */
export function pearsonCorrelation(x: number[], y: number[]): number {
  const n = x.length;
  if (n < 2) return 0;
  const mx = mean(x);
  const my = mean(y);
  let sxy = 0, sxx = 0, syy = 0;
  for (let i = 0; i < n; i++) {
    const dx = x[i] - mx;
    const dy = y[i] - my;
    sxy += dx * dy;
    sxx += dx * dx;
    syy += dy * dy;
  }
  if (sxx === 0 || syy === 0) return 0;
  return sxy / Math.sqrt(sxx * syy);
}

/**
 * Chi-square inverse CDF (quantile function).
 * Wilson-Hilferty approximation: accurate to ~3-4 decimals for df >= 3.
 */
export function chiSquareQuantile(p: number, df: number): number {
  if (df <= 0) return 0;
  const z = normalQuantile(p);
  // Wilson-Hilferty approximation
  const term = 1 - 2 / (9 * df) + z * Math.sqrt(2 / (9 * df));
  const result = df * Math.pow(term, 3);
  return Math.max(0, result);
}

/**
 * Student's t inverse CDF (quantile function).
 * Cornish-Fisher expansion: accurate across all df values.
 * For very large df, naturally converges to normalQuantile.
 */
export function tQuantile(p: number, df: number): number {
  if (df <= 0) return 0;

  const z = normalQuantile(p);
  // Cornish-Fisher expansion for t-distribution
  const z2 = z * z;
  const z3 = z2 * z;
  const z5 = z3 * z2;
  const z7 = z5 * z2;
  const z9 = z7 * z2;

  const g1 = (z3 + z) / 4;
  const g2 = (5 * z5 + 16 * z3 + 3 * z) / 96;
  const g3 = (3 * z7 + 19 * z5 + 17 * z3 - 15 * z) / 384;
  const g4 = (79 * z9 + 776 * z7 + 1482 * z5 - 1920 * z3 - 945 * z) / 92160;

  return z + g1 / df + g2 / (df * df) + g3 / (df * df * df) + g4 / (df * df * df * df);
}

/**
 * F-distribution inverse CDF (quantile function).
 * Uses the relationship between F and chi-square distributions
 * via the Wilson-Hilferty approximation for each chi-square.
 */
export function fQuantile(p: number, df1: number, df2: number): number {
  if (df1 <= 0 || df2 <= 0) return 0;

  // Abramowitz & Stegun approximation 26.6.16
  const z = normalQuantile(p);
  const h1 = 2 / (9 * df1);
  const h2 = 2 / (9 * df2);
  const term1 = (1 - h2) - z * Math.sqrt(h2);
  if (term1 <= 0) return Infinity;
  const num = Math.pow(1 - h1 + z * Math.sqrt(h1), 3);
  return num / term1;
}

// ---------------------------------------------------------------------------
// Hypothesis test functions
// ---------------------------------------------------------------------------

/**
 * Runs test for randomness (NIST Section 1.3.5.13).
 * Tests whether a data sequence is random by counting runs above/below median.
 * Z = (R - E[R]) / sd(R), two-sided test at alpha = 0.05.
 */
export function runsTest(data: number[]): { statistic: number; criticalValue: number; reject: boolean } {
  const n = data.length;
  const sorted = [...data].sort((a, b) => a - b);
  const med = sortedMedian(sorted);

  // Classify each observation: >= median is "above", < median is "below"
  // This convention matches NIST/DATAPLOT for datasets without ties at median.
  // For datasets with ties at median, values equal to median inherit the
  // classification of the previous non-tied observation (preserving run structure).
  let n1 = 0; // above (>= median)
  let n2 = 0; // below (< median)
  const signs: boolean[] = []; // true = above or equal to median
  let lastNonTieSign = true; // default for leading ties
  for (let i = 0; i < n; i++) {
    if (data[i] > med) {
      signs.push(true);
      lastNonTieSign = true;
      n1++;
    } else if (data[i] < med) {
      signs.push(false);
      lastNonTieSign = false;
      n2++;
    } else {
      // Tie with median: inherit previous classification
      signs.push(lastNonTieSign);
      if (lastNonTieSign) n1++; else n2++;
    }
  }

  // Count runs
  let R = 1;
  for (let i = 1; i < n; i++) {
    if (signs[i] !== signs[i - 1]) R++;
  }

  // Expected runs and standard deviation
  const ER = (2 * n1 * n2) / n + 1;
  const varR = (2 * n1 * n2 * (2 * n1 * n2 - n)) / (n * n * (n - 1));
  const sdR = Math.sqrt(varR);

  const Z = (R - ER) / sdR;
  const criticalValue = 1.96; // alpha = 0.05, two-sided

  return {
    statistic: Z,
    criticalValue,
    reject: Math.abs(Z) > criticalValue,
  };
}

/**
 * Bartlett's test for equality of variances (NIST Section 1.3.5.7).
 * Data is split into k equal-size groups; computes chi-square statistic.
 * Tests H0: all group variances are equal.
 */
export function bartlettTest(data: number[], k: number): { statistic: number; criticalValue: number; reject: boolean } {
  const n = data.length;
  const baseSize = Math.floor(n / k);
  const remainder = n % k;

  // Split into k groups, distributing remainder to the LAST groups
  // (first k-remainder groups get baseSize, last remainder groups get baseSize+1)
  const groups: number[][] = [];
  let offset = 0;
  for (let i = 0; i < k; i++) {
    const size = baseSize + (i >= k - remainder ? 1 : 0);
    groups.push(data.slice(offset, offset + size));
    offset += size;
  }

  const ni = groups.map(g => g.length);
  const N = ni.reduce((a, b) => a + b, 0);

  // Group variances (sample variance, n-1 denominator)
  const variances = groups.map((g, idx) => {
    const m = mean(g);
    const ss = g.reduce((s, v) => s + (v - m) ** 2, 0);
    return ss / (ni[idx] - 1);
  });

  // Pooled variance
  const numerator = ni.reduce((s, n_i, j) => s + (n_i - 1) * variances[j], 0);
  const denominator = ni.reduce((s, n_i) => s + (n_i - 1), 0);
  const Sp2 = numerator / denominator;

  // Bartlett T statistic
  const logSum = ni.reduce((s, n_i, j) => s + (n_i - 1) * Math.log(variances[j]), 0);
  const T_num = denominator * Math.log(Sp2) - logSum;

  // Correction factor C
  const invSum = ni.reduce((s, n_i) => s + 1 / (n_i - 1), 0);
  const C = 1 + (1 / (3 * (k - 1))) * (invSum - 1 / denominator);

  const T = T_num / C;
  const df = k - 1;
  const criticalValue = chiSquareQuantile(0.95, df);

  return {
    statistic: T,
    criticalValue,
    reject: T > criticalValue,
  };
}

/**
 * Levene's test for equality of variances (NIST Section 1.3.5.10).
 * Median-based (Brown-Forsythe variant): computes one-way ANOVA
 * on absolute deviations from group medians.
 */
export function leveneTest(data: number[], k: number): { statistic: number; criticalValue: number; reject: boolean } {
  const n = data.length;
  const baseSize = Math.floor(n / k);
  const remainder = n % k;

  // Split into k groups, distributing remainder to the LAST groups
  const groups: number[][] = [];
  let offset = 0;
  for (let i = 0; i < k; i++) {
    const size = baseSize + (i >= k - remainder ? 1 : 0);
    groups.push(data.slice(offset, offset + size));
    offset += size;
  }

  // Compute absolute deviations from group medians
  const deviations: number[][] = groups.map(g => {
    const sorted = [...g].sort((a, b) => a - b);
    const med = sortedMedian(sorted);
    return g.map(v => Math.abs(v - med));
  });

  // One-way ANOVA on deviations
  const allDevs = deviations.flat();
  const grandMean = mean(allDevs);
  const groupMeans = deviations.map(d => mean(d));

  // Between-group sum of squares
  let SSB = 0;
  for (let j = 0; j < k; j++) {
    SSB += deviations[j].length * (groupMeans[j] - grandMean) ** 2;
  }

  // Within-group sum of squares
  let SSW = 0;
  for (let j = 0; j < k; j++) {
    for (let i = 0; i < deviations[j].length; i++) {
      SSW += (deviations[j][i] - groupMeans[j]) ** 2;
    }
  }

  const N = allDevs.length;
  const df1 = k - 1;
  const df2 = N - k;
  const W = (SSB / df1) / (SSW / df2);
  const criticalValue = fQuantile(0.95, df1, df2);

  return {
    statistic: W,
    criticalValue,
    reject: W > criticalValue,
  };
}

/**
 * Anderson-Darling test for normality (NIST Section 1.3.5.14).
 * Tests H0: data is normally distributed.
 * Uses critical value 0.787 per NIST convention at alpha = 0.05.
 */
export function andersonDarlingNormal(data: number[]): { statistic: number; criticalValue: number; reject: boolean } {
  const n = data.length;
  const sorted = [...data].sort((a, b) => a - b);
  const m = mean(data);
  const s = standardDeviation(data);

  // Standardize and compute CDF values
  let S = 0;
  for (let i = 0; i < n; i++) {
    const z = (sorted[i] - m) / s;
    let Fi = normalCDF(z);
    // Clamp to avoid log(0) or log(negative)
    Fi = Math.max(1e-10, Math.min(1 - 1e-10, Fi));
    const logFi = Math.log(Fi);
    const log1mFi = Math.log(1 - Fi);
    S += (2 * (i + 1) - 1) * logFi + (2 * (n - i) - 1) * log1mFi;
  }

  const A2 = -n - S / n;
  const criticalValue = 0.787; // NIST convention

  return {
    statistic: A2,
    criticalValue,
    reject: A2 > criticalValue,
  };
}

/**
 * Grubbs' test for outliers (NIST Section 1.3.5.17.1).
 * G = max|Yi - Ybar| / s. Tests whether the most extreme value is an outlier.
 * Two-sided test at alpha = 0.05.
 */
export function grubbsTest(data: number[]): { statistic: number; criticalValue: number; reject: boolean } {
  const n = data.length;
  const m = mean(data);
  const s = standardDeviation(data);

  // Find maximum absolute deviation
  let maxDev = 0;
  for (let i = 0; i < n; i++) {
    const dev = Math.abs(data[i] - m);
    if (dev > maxDev) maxDev = dev;
  }
  const G = maxDev / s;

  // Critical value: G_crit = ((n-1)/sqrt(n)) * sqrt(t^2 / (n - 2 + t^2))
  // where t is the t-distribution critical value at alpha/(2n) with n-2 df
  const alpha = 0.05;
  const tCrit = tQuantile(1 - alpha / (2 * n), n - 2);
  const Gcrit = ((n - 1) / Math.sqrt(n)) * Math.sqrt((tCrit * tCrit) / (n - 2 + tCrit * tCrit));

  return {
    statistic: G,
    criticalValue: Gcrit,
    reject: G > Gcrit,
  };
}

/**
 * PPCC (Probability Plot Correlation Coefficient) test for normality.
 * Uses Filliben plotting positions and computes correlation with
 * theoretical normal order statistics.
 *
 * Reference: Filliben (1975), "The Probability Plot Correlation Coefficient
 * Test for Normality"
 */
export function ppccNormal(data: number[]): { statistic: number; criticalValue: number; reject: boolean } {
  const n = data.length;
  const sorted = [...data].sort((a, b) => a - b);

  // Filliben plotting positions
  const m: number[] = new Array(n);
  // m_n = 0.5^(1/n)
  m[n - 1] = Math.pow(0.5, 1 / n);
  // m_1 = 1 - m_n
  m[0] = 1 - m[n - 1];
  // m_i = (i - 0.3175) / (n + 0.365) for 2 <= i <= n-1
  for (let i = 1; i < n - 1; i++) {
    m[i] = (i + 1 - 0.3175) / (n + 0.365);
  }

  // Theoretical normal order statistics
  const orderStats = m.map(p => normalQuantile(p));

  // Pearson correlation between sorted data and order statistics
  const r = pearsonCorrelation(sorted, orderStats);

  // Critical values from Filliben (1975) lookup table (alpha = 0.05)
  // For large n, the critical value converges toward 1 but more slowly
  // than one might expect. Values derived from Filliben's published tables.
  const criticalTable: [number, number][] = [
    [50, 0.978],
    [100, 0.987],
    [195, 0.987],
    [200, 0.989],
    [500, 0.995],
    [700, 0.993],
    [1000, 0.996],
  ];

  // Find critical value by interpolation
  let criticalValue: number;
  if (n <= criticalTable[0][0]) {
    criticalValue = criticalTable[0][1];
  } else if (n >= criticalTable[criticalTable.length - 1][0]) {
    criticalValue = criticalTable[criticalTable.length - 1][1];
  } else {
    // Find bracketing entries
    let lo = 0, hi = criticalTable.length - 1;
    for (let i = 0; i < criticalTable.length - 1; i++) {
      if (n >= criticalTable[i][0] && n <= criticalTable[i + 1][0]) {
        lo = i;
        hi = i + 1;
        break;
      }
    }
    // Linear interpolation
    const [nLo, cLo] = criticalTable[lo];
    const [nHi, cHi] = criticalTable[hi];
    criticalValue = cLo + (cHi - cLo) * (n - nLo) / (nHi - nLo);
  }

  return {
    statistic: r,
    criticalValue,
    reject: r < criticalValue,
  };
}

/**
 * Location test: regression of data on run order.
 * Computes the t-statistic for the slope coefficient.
 * Tests H0: no trend in location (slope = 0).
 * Two-sided test at alpha = 0.05.
 */
export function locationTest(data: number[]): { tStatistic: number; criticalValue: number; reject: boolean } {
  const n = data.length;

  // Create run order sequence 1..N
  const x: number[] = [];
  for (let i = 0; i < n; i++) x.push(i + 1);

  // Linear regression
  const reg = linearRegression(x, data);

  // Compute residual standard error
  let sse = 0;
  for (let i = 0; i < n; i++) {
    const predicted = reg.intercept + reg.slope * x[i];
    const residual = data[i] - predicted;
    sse += residual * residual;
  }
  const mse = sse / (n - 2);

  // Standard error of slope: se(slope) = sqrt(MSE / sum((xi - xbar)^2))
  const mx = mean(x);
  let ssxx = 0;
  for (let i = 0; i < n; i++) {
    ssxx += (x[i] - mx) ** 2;
  }
  const seSlope = Math.sqrt(mse / ssxx);

  // t-statistic
  const t = reg.slope / seSlope;

  // Critical value: t at alpha/2 = 0.025 with n-2 df
  const critVal = tQuantile(0.975, n - 2);

  return {
    tStatistic: t,
    criticalValue: critVal,
    reject: Math.abs(t) > critVal,
  };
}
