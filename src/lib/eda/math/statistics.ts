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
  // Next power of 2
  let n = 1;
  while (n < data.length) n *= 2;
  const re = new Array(n).fill(0);
  const im = new Array(n).fill(0);
  for (let i = 0; i < data.length; i++) re[i] = data[i];

  fft(re, im);

  const half = n / 2 + 1;
  const psd: number[] = [];
  for (let i = 0; i < half; i++) {
    psd.push((re[i] ** 2 + im[i] ** 2) / n);
  }
  return psd;
}
