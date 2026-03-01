/**
 * Pure-math module for 19 probability distributions.
 * NO D3 or DOM imports -- safe for both build-time SVG and client-side React islands.
 *
 * Parameter names match src/data/eda/distributions.json exactly.
 * Distribution IDs match the JSON `id` field (e.g. 't-distribution', not 't').
 *
 * Exports:
 *   evalDistribution(id, type, x, params) -- PDF/CDF at a point
 *   getXDomain(id, params) -- sensible [xMin, xMax] for plotting
 *   isDiscrete(id) -- true for binomial, poisson
 */

// ---------------------------------------------------------------------------
// Math helpers
// ---------------------------------------------------------------------------

/**
 * Error function approximation using Abramowitz & Stegun formula 7.1.26.
 * Max error: 1.5e-7.
 */
function erf(x: number): number {
  const sign = x >= 0 ? 1 : -1;
  const ax = Math.abs(x);
  const t = 1 / (1 + 0.3275911 * ax);
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const poly = ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t;
  return sign * (1 - poly * Math.exp(-ax * ax));
}

/**
 * Lanczos gamma function approximation with g=7, 9 coefficients.
 * Accurate for real positive arguments.
 */
const LANCZOS_COEFFICIENTS = [
  0.99999999999980993,
  676.5203681218851,
  -1259.1392167224028,
  771.32342877765313,
  -176.61502916214059,
  12.507343278686905,
  -0.13857109526572012,
  9.9843695780195716e-6,
  1.5056327351493116e-7,
];

function gammaFn(z: number): number {
  if (z < 0.5) {
    // Reflection formula: Gamma(z) = pi / (sin(pi*z) * Gamma(1-z))
    return Math.PI / (Math.sin(Math.PI * z) * gammaFn(1 - z));
  }
  z -= 1;
  let x = LANCZOS_COEFFICIENTS[0];
  for (let i = 1; i < LANCZOS_COEFFICIENTS.length; i++) {
    x += LANCZOS_COEFFICIENTS[i] / (z + i);
  }
  const t = z + 7.5; // g + 0.5
  return Math.sqrt(2 * Math.PI) * Math.pow(t, z + 0.5) * Math.exp(-t) * x;
}

function lnGamma(z: number): number {
  if (z <= 0) return Infinity;
  return Math.log(gammaFn(z));
}

/**
 * Regularized lower incomplete gamma: P(a, x) = gamma(a,x) / Gamma(a)
 * Series expansion for x < a+1, continued fraction (Lentz) otherwise.
 */
function lowerIncompleteGammaRatio(a: number, x: number): number {
  if (x < 0) return 0;
  if (x === 0) return 0;

  if (x < a + 1) {
    // Series expansion
    let sum = 1 / a;
    let term = 1 / a;
    for (let n = 1; n < 200; n++) {
      term *= x / (a + n);
      sum += term;
      if (Math.abs(term) < 1e-12 * Math.abs(sum)) break;
    }
    return sum * Math.exp(-x + a * Math.log(x) - lnGamma(a));
  }

  // Continued fraction (modified Lentz) for upper incomplete gamma Q(a,x),
  // then P = 1 - Q.
  const TINY = 1e-30;
  let b = x + 1 - a;
  let c2 = 1e30;
  let d2 = Math.abs(b) < TINY ? TINY : b;
  d2 = 1 / d2;
  let f2 = d2;
  for (let i = 1; i <= 200; i++) {
    const ai = -i * (i - a);
    b += 2;
    d2 = b + ai * d2;
    if (Math.abs(d2) < TINY) d2 = TINY;
    c2 = b + ai / c2;
    if (Math.abs(c2) < TINY) c2 = TINY;
    d2 = 1 / d2;
    const delta = d2 * c2;
    f2 *= delta;
    if (Math.abs(delta - 1) < 3e-12) break;
  }
  const Q = Math.exp(-x + a * Math.log(x) - lnGamma(a)) * f2;
  return 1 - Q;
}

/**
 * Inverse CDF of the gamma distribution via bisection on lowerIncompleteGammaRatio.
 * Returns x such that P(X <= x) = p for Gamma(shape, scale).
 * Uses scale parameterization: mean = shape * scale.
 */
export function gammaQuantile(p: number, shape: number, scale: number = 1): number {
  if (p <= 0) return 0;
  if (p >= 1) return Infinity;

  // Initial bracket: [0, generous_upper]
  let lo = 0;
  let hi = Math.max(shape * scale * 5, 100);

  // Ensure upper bracket is high enough
  while (lowerIncompleteGammaRatio(shape, hi / scale) < p) {
    hi *= 2;
  }

  // Bisection search
  for (let iter = 0; iter < 100; iter++) {
    const mid = (lo + hi) / 2;
    const cdf = lowerIncompleteGammaRatio(shape, mid / scale);
    if (cdf < p) lo = mid;
    else hi = mid;
    if ((hi - lo) / Math.max(1, lo) < 1e-10) break;
  }
  return (lo + hi) / 2;
}

/**
 * Regularized incomplete beta function I_x(a, b).
 * Series for x < (a+1)/(a+b+2), continued fraction (Lentz) otherwise.
 */
function regularizedBeta(x: number, a: number, b: number): number {
  if (x <= 0) return 0;
  if (x >= 1) return 1;

  // Use symmetry: I_x(a,b) = 1 - I_{1-x}(b,a) when x > (a+1)/(a+b+2)
  if (x > (a + 1) / (a + b + 2)) {
    return 1 - regularizedBeta(1 - x, b, a);
  }

  // Continued fraction (Lentz's method) for I_x(a,b)
  const lnPrefactor =
    a * Math.log(x) + b * Math.log(1 - x) - Math.log(a) -
    (lnGamma(a) + lnGamma(b) - lnGamma(a + b));

  const prefactor = Math.exp(lnPrefactor);

  // Lentz continued fraction
  const maxIter = 200;
  const eps = 1e-12;
  let qab = a + b;
  let qap = a + 1;
  let qam = a - 1;
  let c2 = 1;
  let d2 = 1 - (qab * x) / qap;
  if (Math.abs(d2) < 1e-30) d2 = 1e-30;
  d2 = 1 / d2;
  let h = d2;

  for (let m = 1; m <= maxIter; m++) {
    const m2 = 2 * m;
    // Even step
    let aa = (m * (b - m) * x) / ((qam + m2) * (a + m2));
    d2 = 1 + aa * d2;
    if (Math.abs(d2) < 1e-30) d2 = 1e-30;
    c2 = 1 + aa / c2;
    if (Math.abs(c2) < 1e-30) c2 = 1e-30;
    d2 = 1 / d2;
    h *= d2 * c2;

    // Odd step
    aa = -((a + m) * (qab + m) * x) / ((a + m2) * (qap + m2));
    d2 = 1 + aa * d2;
    if (Math.abs(d2) < 1e-30) d2 = 1e-30;
    c2 = 1 + aa / c2;
    if (Math.abs(c2) < 1e-30) c2 = 1e-30;
    d2 = 1 / d2;
    const del = d2 * c2;
    h *= del;

    if (Math.abs(del - 1) < eps) break;
  }

  return prefactor * h;
}

/** Log binomial coefficient: ln(C(n,k)) = lnGamma(n+1) - lnGamma(k+1) - lnGamma(n-k+1) */
function lnBinomialCoeff(n: number, k: number): number {
  if (k < 0 || k > n) return -Infinity;
  return lnGamma(n + 1) - lnGamma(k + 1) - lnGamma(n - k + 1);
}

// ---------------------------------------------------------------------------
// Normal helpers (reused by multiple distributions)
// ---------------------------------------------------------------------------

function normalPDF(x: number, mu: number, sigma: number): number {
  const z = (x - mu) / sigma;
  return Math.exp(-0.5 * z * z) / (sigma * Math.sqrt(2 * Math.PI));
}

function normalCDF(x: number, mu: number, sigma: number): number {
  return 0.5 * (1 + erf((x - mu) / (sigma * Math.SQRT2)));
}

/** Standard normal PDF: phi(x) */
function stdNormalPDF(x: number): number {
  return normalPDF(x, 0, 1);
}

/** Standard normal CDF: Phi(x) */
function stdNormalCDF(x: number): number {
  return normalCDF(x, 0, 1);
}

// ---------------------------------------------------------------------------
// Safe result helper
// ---------------------------------------------------------------------------

function safe(v: number): number {
  return isFinite(v) ? v : 0;
}

// ---------------------------------------------------------------------------
// Distribution implementations
// ---------------------------------------------------------------------------

// 1. Normal
function normalPdf(x: number, params: Record<string, number>): number {
  const mu = params.mu ?? 0;
  const sigma = params.sigma ?? 1;
  return normalPDF(x, mu, sigma);
}
function normalCdf(x: number, params: Record<string, number>): number {
  const mu = params.mu ?? 0;
  const sigma = params.sigma ?? 1;
  return normalCDF(x, mu, sigma);
}

// 2. Uniform
function uniformPdf(x: number, params: Record<string, number>): number {
  const a = params.a ?? -1;
  const b = params.b ?? 1;
  return x >= a && x <= b ? 1 / (b - a) : 0;
}
function uniformCdf(x: number, params: Record<string, number>): number {
  const a = params.a ?? -1;
  const b = params.b ?? 1;
  if (x < a) return 0;
  if (x > b) return 1;
  return (x - a) / (b - a);
}

// 3. Cauchy
function cauchyPdf(x: number, params: Record<string, number>): number {
  const x0 = params.x0 ?? 0;
  const gamma = params.gamma ?? 1;
  const z = (x - x0) / gamma;
  return 1 / (Math.PI * gamma * (1 + z * z));
}
function cauchyCdf(x: number, params: Record<string, number>): number {
  const x0 = params.x0 ?? 0;
  const gamma = params.gamma ?? 1;
  return Math.atan((x - x0) / gamma) / Math.PI + 0.5;
}

// 4. t-distribution
function tDistPdf(x: number, params: Record<string, number>): number {
  const nu = params.nu ?? 5;
  const coeff = gammaFn((nu + 1) / 2) / (Math.sqrt(nu * Math.PI) * gammaFn(nu / 2));
  return coeff * Math.pow(1 + (x * x) / nu, -(nu + 1) / 2);
}
function tDistCdf(x: number, params: Record<string, number>): number {
  const nu = params.nu ?? 5;
  // Simpson's rule with 400 steps
  const steps = 400;
  const lower = -40;
  const upper = x;
  if (upper <= lower) return 0;
  const h = (upper - lower) / steps;
  let sum = tDistPdf(lower, params) + tDistPdf(upper, params);
  for (let i = 1; i < steps; i++) {
    const xi = lower + i * h;
    sum += (i % 2 === 0 ? 2 : 4) * tDistPdf(xi, params);
  }
  return Math.max(0, Math.min(1, (h / 3) * sum));
}

// 5. F-distribution
function fDistPdf(x: number, params: Record<string, number>): number {
  const d1 = params.d1 ?? 5;
  const d2 = params.d2 ?? 10;
  if (x <= 0) return 0;
  const hd1 = d1 / 2;
  const hd2 = d2 / 2;
  // Use log-space for numerical stability
  const lnNum =
    hd1 * Math.log(d1) + hd2 * Math.log(d2) +
    (hd1 - 1) * Math.log(x) -
    (hd1 + hd2) * Math.log(d1 * x + d2);
  const lnDen = lnGamma(hd1) + lnGamma(hd2) - lnGamma(hd1 + hd2);
  return safe(Math.exp(lnNum - lnDen));
}
function fDistCdf(x: number, params: Record<string, number>): number {
  const d1 = params.d1 ?? 5;
  const d2 = params.d2 ?? 10;
  if (x <= 0) return 0;
  const t = (d1 * x) / (d1 * x + d2);
  return regularizedBeta(t, d1 / 2, d2 / 2);
}

// 6. Chi-square
function chiSquarePdf(x: number, params: Record<string, number>): number {
  const k = params.k ?? 5;
  if (x <= 0) return 0;
  const halfK = k / 2;
  const coeff = 1 / (Math.pow(2, halfK) * gammaFn(halfK));
  return coeff * Math.pow(x, halfK - 1) * Math.exp(-x / 2);
}
function chiSquareCdf(x: number, params: Record<string, number>): number {
  const k = params.k ?? 5;
  if (x <= 0) return 0;
  return lowerIncompleteGammaRatio(k / 2, x / 2);
}

// 7. Exponential
function exponentialPdf(x: number, params: Record<string, number>): number {
  const lambda = params.lambda ?? 1;
  return x < 0 ? 0 : lambda * Math.exp(-lambda * x);
}
function exponentialCdf(x: number, params: Record<string, number>): number {
  const lambda = params.lambda ?? 1;
  return x < 0 ? 0 : 1 - Math.exp(-lambda * x);
}

// 8. Weibull (NIST convention: alpha=shape, beta=scale)
function weibullPdf(x: number, params: Record<string, number>): number {
  const alpha = params.alpha ?? 1;
  const beta = params.beta ?? 1;
  if (x < 0) return 0;
  if (x === 0) return alpha === 1 ? alpha / beta : 0;
  return (alpha / beta) * Math.pow(x / beta, alpha - 1) * Math.exp(-Math.pow(x / beta, alpha));
}
function weibullCdf(x: number, params: Record<string, number>): number {
  const alpha = params.alpha ?? 1;
  const beta = params.beta ?? 1;
  if (x < 0) return 0;
  return 1 - Math.exp(-Math.pow(x / beta, alpha));
}

// 9. Lognormal
function lognormalPdf(x: number, params: Record<string, number>): number {
  const mu = params.mu ?? 0;
  const sigma = params.sigma ?? 1;
  if (x <= 0) return 0;
  const lnx = Math.log(x);
  const z = (lnx - mu) / sigma;
  return Math.exp(-0.5 * z * z) / (x * sigma * Math.sqrt(2 * Math.PI));
}
function lognormalCdf(x: number, params: Record<string, number>): number {
  const mu = params.mu ?? 0;
  const sigma = params.sigma ?? 1;
  if (x <= 0) return 0;
  return 0.5 * (1 + erf((Math.log(x) - mu) / (sigma * Math.SQRT2)));
}

// 10. Fatigue-life (Birnbaum-Saunders): alpha=shape, beta=scale
function fatigueLifePdf(x: number, params: Record<string, number>): number {
  const alpha = params.alpha ?? 1;
  const beta = params.beta ?? 1;
  if (x <= 0) return 0;
  const sqrtXB = Math.sqrt(x / beta);
  const sqrtBX = Math.sqrt(beta / x);
  const z = (sqrtXB - sqrtBX) / alpha;
  const dzdx = (sqrtXB + sqrtBX) / (2 * alpha * x);
  return stdNormalPDF(z) * dzdx;
}
function fatigueLifeCdf(x: number, params: Record<string, number>): number {
  const alpha = params.alpha ?? 1;
  const beta = params.beta ?? 1;
  if (x <= 0) return 0;
  const z = (Math.sqrt(x / beta) - Math.sqrt(beta / x)) / alpha;
  return stdNormalCDF(z);
}

// 11. Gamma (scale parameterization: alpha=shape, beta=scale)
// JSON formula: f(x) = x^{alpha-1} e^{-x/beta} / (beta^alpha * Gamma(alpha))
function gammaPdf(x: number, params: Record<string, number>): number {
  const alpha = params.alpha ?? 2;
  const beta = params.beta ?? 1;
  if (x <= 0) return 0;
  // Use log-space for stability
  const lnVal =
    (alpha - 1) * Math.log(x) - x / beta - alpha * Math.log(beta) - lnGamma(alpha);
  return safe(Math.exp(lnVal));
}
function gammaCdf(x: number, params: Record<string, number>): number {
  const alpha = params.alpha ?? 2;
  const beta = params.beta ?? 1;
  if (x <= 0) return 0;
  return lowerIncompleteGammaRatio(alpha, x / beta);
}

// 12. Double-exponential (Laplace)
function doubleExpPdf(x: number, params: Record<string, number>): number {
  const mu = params.mu ?? 0;
  const beta = params.beta ?? 1;
  return (1 / (2 * beta)) * Math.exp(-Math.abs(x - mu) / beta);
}
function doubleExpCdf(x: number, params: Record<string, number>): number {
  const mu = params.mu ?? 0;
  const beta = params.beta ?? 1;
  if (x < mu) {
    return 0.5 * Math.exp((x - mu) / beta);
  }
  return 1 - 0.5 * Math.exp(-(x - mu) / beta);
}

// 13. Power-normal: p = power parameter
// NIST definition: CDF = 1 - [Phi(-x)]^p  (minimum of p normal lifetimes)
function powerNormalPdf(x: number, params: Record<string, number>): number {
  const p = params.p ?? 1;
  const phi = stdNormalPDF(x);
  const PhiNeg = stdNormalCDF(-x);
  if (PhiNeg <= 0) return 0;
  return p * phi * Math.pow(PhiNeg, p - 1);
}
function powerNormalCdf(x: number, params: Record<string, number>): number {
  const p = params.p ?? 1;
  const PhiNeg = stdNormalCDF(-x);
  return 1 - Math.pow(PhiNeg, p);
}

// 14. Power-lognormal: p, sigma (no mu -- parameterized with ln(x)/sigma)
// NIST definition: CDF = 1 - [Phi(-z)]^p  where z = ln(x)/sigma
function powerLognormalPdf(x: number, params: Record<string, number>): number {
  const p = params.p ?? 1;
  const sigma = params.sigma ?? 1;
  if (x <= 0) return 0;
  const z = Math.log(x) / sigma;
  const phi = stdNormalPDF(z);
  const PhiNeg = stdNormalCDF(-z);
  if (PhiNeg <= 0) return 0;
  return (p / (x * sigma)) * phi * Math.pow(PhiNeg, p - 1);
}
function powerLognormalCdf(x: number, params: Record<string, number>): number {
  const p = params.p ?? 1;
  const sigma = params.sigma ?? 1;
  if (x <= 0) return 0;
  const z = Math.log(x) / sigma;
  return 1 - Math.pow(stdNormalCDF(-z), p);
}

// 15. Tukey-Lambda: defined via quantile function Q(F)
// Special-case |lambda| < 1e-10 as logistic: Q(F) = ln(F/(1-F))
function tukeyLambdaQuantile(F: number, lambda: number): number {
  if (F <= 0) return -Infinity;
  if (F >= 1) return Infinity;
  if (Math.abs(lambda) < 1e-10) {
    // Logistic quantile
    return Math.log(F / (1 - F));
  }
  return (Math.pow(F, lambda) - Math.pow(1 - F, lambda)) / lambda;
}
function tukeyLambdaQPrime(F: number, lambda: number): number {
  if (F <= 0 || F >= 1) return Infinity;
  if (Math.abs(lambda) < 1e-10) {
    // Logistic: Q'(F) = 1/F + 1/(1-F)
    return 1 / F + 1 / (1 - F);
  }
  return Math.pow(F, lambda - 1) + Math.pow(1 - F, lambda - 1);
}

// For Tukey-Lambda, we generate by sweeping F and inverting.
// evalDistribution handles this specially: for PDF, we need to find F for a given x,
// then compute 1/Q'(F). We use Newton's method to invert.
function tukeyLambdaInvertX(x: number, lambda: number): number {
  // Newton's method to find F such that Q(F) = x
  let F = 0.5; // start at median
  for (let i = 0; i < 50; i++) {
    const q = tukeyLambdaQuantile(F, lambda);
    const qp = tukeyLambdaQPrime(F, lambda);
    if (!isFinite(qp) || qp === 0) break;
    const dF = (q - x) / qp;
    F = F - dF;
    F = Math.max(1e-10, Math.min(1 - 1e-10, F));
    if (Math.abs(dF) < 1e-12) break;
  }
  return F;
}
function tukeyLambdaPdf(x: number, params: Record<string, number>): number {
  const lambda = params.lambda ?? 0.14;
  const F = tukeyLambdaInvertX(x, lambda);
  const qp = tukeyLambdaQPrime(F, lambda);
  if (!isFinite(qp) || qp <= 0) return 0;
  return safe(1 / qp);
}
function tukeyLambdaCdf(x: number, params: Record<string, number>): number {
  const lambda = params.lambda ?? 0.14;
  return Math.max(0, Math.min(1, tukeyLambdaInvertX(x, lambda)));
}

// 16. Extreme value (Gumbel)
function extremeValuePdf(x: number, params: Record<string, number>): number {
  const mu = params.mu ?? 0;
  const beta = params.beta ?? 1;
  const z = (x - mu) / beta;
  return (1 / beta) * Math.exp(-(z + Math.exp(-z)));
}
function extremeValueCdf(x: number, params: Record<string, number>): number {
  const mu = params.mu ?? 0;
  const beta = params.beta ?? 1;
  const z = (x - mu) / beta;
  return Math.exp(-Math.exp(-z));
}

// 17. Beta distribution
function betaPdf(x: number, params: Record<string, number>): number {
  const alpha = params.alpha ?? 2;
  const beta = params.beta ?? 5;
  if (x <= 0 || x >= 1) return 0;
  // Use log-space for stability
  const lnB = lnGamma(alpha) + lnGamma(beta) - lnGamma(alpha + beta);
  const lnVal = (alpha - 1) * Math.log(x) + (beta - 1) * Math.log(1 - x) - lnB;
  return safe(Math.exp(lnVal));
}
function betaCdf(x: number, params: Record<string, number>): number {
  const alpha = params.alpha ?? 2;
  const beta = params.beta ?? 5;
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  return regularizedBeta(x, alpha, beta);
}

// 18. Binomial (discrete)
function binomialPmf(k: number, params: Record<string, number>): number {
  const n = Math.round(params.n ?? 10);
  const p = params.p ?? 0.5;
  const ki = Math.round(k);
  if (ki < 0 || ki > n) return 0;
  const lnP = lnBinomialCoeff(n, ki) + ki * Math.log(p) + (n - ki) * Math.log(1 - p);
  return safe(Math.exp(lnP));
}
function binomialCdf(x: number, params: Record<string, number>): number {
  const n = Math.round(params.n ?? 10);
  const floorX = Math.floor(x);
  if (floorX < 0) return 0;
  if (floorX >= n) return 1;
  let sum = 0;
  for (let k = 0; k <= floorX; k++) {
    sum += binomialPmf(k, params);
  }
  return Math.min(1, sum);
}

// 19. Poisson (discrete)
function poissonPmf(k: number, params: Record<string, number>): number {
  const lambda = params.lambda ?? 5;
  const ki = Math.round(k);
  if (ki < 0) return 0;
  const lnP = ki * Math.log(lambda) - lambda - lnGamma(ki + 1);
  return safe(Math.exp(lnP));
}
function poissonCdf(x: number, params: Record<string, number>): number {
  const lambda = params.lambda ?? 5;
  const floorX = Math.floor(x);
  if (floorX < 0) return 0;
  let sum = 0;
  for (let k = 0; k <= floorX; k++) {
    sum += poissonPmf(k, params);
  }
  return Math.min(1, sum);
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

const DISCRETE_IDS = new Set(['binomial', 'poisson']);

/**
 * Returns true if the distribution is discrete (PMF instead of PDF).
 */
export function isDiscrete(id: string): boolean {
  return DISCRETE_IDS.has(id);
}

/**
 * Evaluate PDF/CDF (or PMF/CDF for discrete) at a point x.
 * Parameter names match src/data/eda/distributions.json exactly.
 */
export function evalDistribution(
  id: string,
  type: 'pdf' | 'cdf',
  x: number,
  params: Record<string, number>,
): number {
  switch (id) {
    case 'normal':
      return safe(type === 'pdf' ? normalPdf(x, params) : normalCdf(x, params));
    case 'uniform':
      return safe(type === 'pdf' ? uniformPdf(x, params) : uniformCdf(x, params));
    case 'cauchy':
      return safe(type === 'pdf' ? cauchyPdf(x, params) : cauchyCdf(x, params));
    case 't-distribution':
      return safe(type === 'pdf' ? tDistPdf(x, params) : tDistCdf(x, params));
    case 'f-distribution':
      return safe(type === 'pdf' ? fDistPdf(x, params) : fDistCdf(x, params));
    case 'chi-square':
      return safe(type === 'pdf' ? chiSquarePdf(x, params) : chiSquareCdf(x, params));
    case 'exponential':
      return safe(type === 'pdf' ? exponentialPdf(x, params) : exponentialCdf(x, params));
    case 'weibull':
      return safe(type === 'pdf' ? weibullPdf(x, params) : weibullCdf(x, params));
    case 'lognormal':
      return safe(type === 'pdf' ? lognormalPdf(x, params) : lognormalCdf(x, params));
    case 'fatigue-life':
      return safe(type === 'pdf' ? fatigueLifePdf(x, params) : fatigueLifeCdf(x, params));
    case 'gamma':
      return safe(type === 'pdf' ? gammaPdf(x, params) : gammaCdf(x, params));
    case 'double-exponential':
      return safe(type === 'pdf' ? doubleExpPdf(x, params) : doubleExpCdf(x, params));
    case 'power-normal':
      return safe(type === 'pdf' ? powerNormalPdf(x, params) : powerNormalCdf(x, params));
    case 'power-lognormal':
      return safe(type === 'pdf' ? powerLognormalPdf(x, params) : powerLognormalCdf(x, params));
    case 'tukey-lambda':
      return safe(type === 'pdf' ? tukeyLambdaPdf(x, params) : tukeyLambdaCdf(x, params));
    case 'extreme-value':
      return safe(type === 'pdf' ? extremeValuePdf(x, params) : extremeValueCdf(x, params));
    case 'beta':
      return safe(type === 'pdf' ? betaPdf(x, params) : betaCdf(x, params));
    case 'binomial':
      return safe(type === 'pdf' ? binomialPmf(x, params) : binomialCdf(x, params));
    case 'poisson':
      return safe(type === 'pdf' ? poissonPmf(x, params) : poissonCdf(x, params));
    default:
      return 0;
  }
}

/**
 * Sensible x-domain for plotting a distribution with given parameters.
 * Discrete distributions return integer-aligned domains.
 */
export function getXDomain(
  id: string,
  params: Record<string, number>,
): [number, number] {
  switch (id) {
    case 'normal': {
      const mu = params.mu ?? 0;
      const sigma = params.sigma ?? 1;
      return [mu - 4 * sigma, mu + 4 * sigma];
    }
    case 'uniform': {
      const a = params.a ?? -1;
      const b = params.b ?? 1;
      const pad = (b - a) * 0.2;
      return [a - pad, b + pad];
    }
    case 'cauchy': {
      const x0 = params.x0 ?? 0;
      const gamma = params.gamma ?? 1;
      return [x0 - 10 * gamma, x0 + 10 * gamma];
    }
    case 't-distribution':
      return [-5, 5];
    case 'f-distribution': {
      const d1 = params.d1 ?? 5;
      const d2 = params.d2 ?? 10;
      const mean = d2 > 2 ? d2 / (d2 - 2) : 1;
      const sd = d2 > 4
        ? Math.sqrt((2 * d2 * d2 * (d1 + d2 - 2)) / (d1 * (d2 - 2) * (d2 - 2) * (d2 - 4)))
        : 2;
      return [0, Math.max(mean + 5 * sd, 5)];
    }
    case 'chi-square': {
      const k = params.k ?? 5;
      return [0, Math.max(k + 4 * Math.sqrt(2 * k), 10)];
    }
    case 'exponential': {
      const lambda = params.lambda ?? 1;
      return [0, 5 / lambda];
    }
    case 'weibull': {
      const alpha = params.alpha ?? 1;
      const beta = params.beta ?? 1;
      // Weibull mean = beta * Gamma(1 + 1/alpha)
      const mean = beta * gammaFn(1 + 1 / alpha);
      const upper = Math.max(mean * 3, beta * 3);
      return [0, upper];
    }
    case 'lognormal': {
      const mu = params.mu ?? 0;
      const sigma = params.sigma ?? 1;
      const median = Math.exp(mu);
      const upper = Math.exp(mu + 3 * sigma);
      return [0, Math.min(upper, median * 20)];
    }
    case 'fatigue-life': {
      const alpha = params.alpha ?? 1;
      const beta = params.beta ?? 1;
      const mean = beta * (1 + alpha * alpha / 2);
      return [0, mean * 3];
    }
    case 'gamma': {
      const alpha = params.alpha ?? 2;
      const beta = params.beta ?? 1;
      // Scale parameterization: mean = alpha*beta, sd = sqrt(alpha)*beta
      const mean = alpha * beta;
      const sd = Math.sqrt(alpha) * beta;
      return [0, mean + 5 * sd];
    }
    case 'double-exponential': {
      const mu = params.mu ?? 0;
      const beta = params.beta ?? 1;
      return [mu - 6 * beta, mu + 6 * beta];
    }
    case 'power-normal':
      return [-4, 4];
    case 'power-lognormal': {
      const sigma = params.sigma ?? 1;
      return [0.01, Math.exp(3 * sigma)];
    }
    case 'tukey-lambda': {
      const lambda = params.lambda ?? 0.14;
      const lo = tukeyLambdaQuantile(0.001, lambda);
      const hi = tukeyLambdaQuantile(0.999, lambda);
      if (!isFinite(lo) || !isFinite(hi)) return [-5, 5];
      return [lo, hi];
    }
    case 'extreme-value': {
      const mu = params.mu ?? 0;
      const beta = params.beta ?? 1;
      return [mu - 4 * beta, mu + 8 * beta];
    }
    case 'beta':
      return [0, 1];
    case 'binomial': {
      const n = Math.round(params.n ?? 10);
      return [0, n];
    }
    case 'poisson': {
      const lambda = params.lambda ?? 5;
      return [0, Math.max(Math.ceil(lambda + 4 * Math.sqrt(lambda)), 10)];
    }
    default:
      return [0, 1];
  }
}
