/**
 * Distribution curve SVG generator for PDF and CDF visualization.
 * Supports 6 distributions: normal, exponential, chi-square, uniform, t, gamma.
 * Uses Abramowitz & Stegun erf approximation and Lanczos gamma approximation.
 */
import { scaleLinear } from 'd3-scale';
import { line, area, curveBasis } from 'd3-shape';
import {
  DEFAULT_CONFIG,
  PALETTE,
  svgOpen,
  xAxis,
  yAxis,
  gridLinesH,
  gridLinesV,
  innerDimensions,
  titleText,
  type PlotConfig,
} from './plot-base';

export interface DistributionCurveOptions {
  type: 'pdf' | 'cdf';
  distribution: 'normal' | 'exponential' | 'chi-square' | 'uniform' | 't' | 'gamma';
  params: Record<string, number>;
  config?: Partial<PlotConfig>;
  title?: string;
  xLabel?: string;
  yLabel?: string;
}

// ---------------------------------------------------------------------------
// Math helpers: erf (Abramowitz & Stegun 7.1.26) and Lanczos gamma (g=7)
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
 * Lanczos gamma function approximation with g=7.
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
  return Math.log(gammaFn(z));
}

// ---------------------------------------------------------------------------
// Distribution PDF/CDF implementations
// ---------------------------------------------------------------------------

function normalPDF(x: number, mu: number, sigma: number): number {
  const z = (x - mu) / sigma;
  return Math.exp(-0.5 * z * z) / (sigma * Math.sqrt(2 * Math.PI));
}

function normalCDF(x: number, mu: number, sigma: number): number {
  return 0.5 * (1 + erf((x - mu) / (sigma * Math.SQRT2)));
}

function exponentialPDF(x: number, lambda: number): number {
  return x < 0 ? 0 : lambda * Math.exp(-lambda * x);
}

function exponentialCDF(x: number, lambda: number): number {
  return x < 0 ? 0 : 1 - Math.exp(-lambda * x);
}

function chiSquarePDF(x: number, k: number): number {
  if (x <= 0) return 0;
  const halfK = k / 2;
  const coeff = 1 / (Math.pow(2, halfK) * gammaFn(halfK));
  return coeff * Math.pow(x, halfK - 1) * Math.exp(-x / 2);
}

function chiSquareCDF(x: number, k: number): number {
  if (x <= 0) return 0;
  // Numerical integration via regularized lower incomplete gamma
  // Use Simpson's rule for practical accuracy
  return lowerIncompleteGammaRatio(k / 2, x / 2);
}

/**
 * Regularized lower incomplete gamma: P(a, x) = gamma(a,x) / Gamma(a)
 * Computed via series expansion for small x or continued fraction for large x.
 */
function lowerIncompleteGammaRatio(a: number, x: number): number {
  if (x < 0) return 0;
  if (x === 0) return 0;

  // Series expansion: P(a, x) = e^(-x) * x^a * sum(x^n / Gamma(a+n+1))
  if (x < a + 1) {
    let sum = 1 / a;
    let term = 1 / a;
    for (let n = 1; n < 200; n++) {
      term *= x / (a + n);
      sum += term;
      if (Math.abs(term) < 1e-12 * Math.abs(sum)) break;
    }
    return sum * Math.exp(-x + a * Math.log(x) - lnGamma(a));
  }

  // Continued fraction (Legendre) for P = 1 - Q
  // Using Lentz's method for the upper incomplete gamma
  let f = 1e-30;
  let c = 1e-30;
  let d = 1 / (x + 1 - a);
  f = d;
  for (let n = 1; n < 200; n++) {
    const an = n * (a - n);
    const bn = x + 2 * n + 1 - a;
    d = 1 / (bn + an * d);
    c = bn + an / c;
    const delta = c * d;
    f *= delta;
    if (Math.abs(delta - 1) < 1e-12) break;
  }
  const Q = Math.exp(-x + a * Math.log(x) - lnGamma(a)) * f;
  return 1 - Q;
}

function uniformPDF(x: number, a: number, b: number): number {
  return x >= a && x <= b ? 1 / (b - a) : 0;
}

function uniformCDF(x: number, a: number, b: number): number {
  if (x < a) return 0;
  if (x > b) return 1;
  return (x - a) / (b - a);
}

function tPDF(x: number, nu: number): number {
  const coeff = gammaFn((nu + 1) / 2) / (Math.sqrt(nu * Math.PI) * gammaFn(nu / 2));
  return coeff * Math.pow(1 + (x * x) / nu, -(nu + 1) / 2);
}

function tCDF(x: number, nu: number): number {
  // Use regularized incomplete beta function: I_x(a, b)
  // t CDF = 0.5 + 0.5 * sign(x) * I(nu/(nu+x^2); nu/2, 0.5) ... or Simpson integration
  // Simpler: numerical integration via Simpson's rule
  const steps = 400;
  const lower = -40;
  const upper = x;
  if (upper <= lower) return 0;
  const h = (upper - lower) / steps;
  let sum = tPDF(lower, nu) + tPDF(upper, nu);
  for (let i = 1; i < steps; i++) {
    const xi = lower + i * h;
    sum += (i % 2 === 0 ? 2 : 4) * tPDF(xi, nu);
  }
  return Math.max(0, Math.min(1, (h / 3) * sum));
}

function gammaPDF(x: number, alpha: number, beta: number): number {
  if (x <= 0) return 0;
  return (
    (Math.pow(beta, alpha) / gammaFn(alpha)) *
    Math.pow(x, alpha - 1) *
    Math.exp(-beta * x)
  );
}

function gammaCDF(x: number, alpha: number, beta: number): number {
  if (x <= 0) return 0;
  return lowerIncompleteGammaRatio(alpha, beta * x);
}

// ---------------------------------------------------------------------------
// Distribution dispatch
// ---------------------------------------------------------------------------

type DistFn = (x: number) => number;

function getDistributionFn(
  distribution: DistributionCurveOptions['distribution'],
  type: 'pdf' | 'cdf',
  params: Record<string, number>,
): { fn: DistFn; xDomain: [number, number]; label: string } {
  switch (distribution) {
    case 'normal': {
      const mu = params.mu ?? 0;
      const sigma = params.sigma ?? 1;
      return {
        fn: type === 'pdf' ? (x) => normalPDF(x, mu, sigma) : (x) => normalCDF(x, mu, sigma),
        xDomain: [mu - 4 * sigma, mu + 4 * sigma],
        label: `Normal(${mu}, ${sigma})`,
      };
    }
    case 'exponential': {
      const lambda = params.lambda ?? 1;
      return {
        fn: type === 'pdf' ? (x) => exponentialPDF(x, lambda) : (x) => exponentialCDF(x, lambda),
        xDomain: [0, 5 / lambda],
        label: `Exp(${lambda})`,
      };
    }
    case 'chi-square': {
      const k = params.k ?? 2;
      return {
        fn: type === 'pdf' ? (x) => chiSquarePDF(x, k) : (x) => chiSquareCDF(x, k),
        xDomain: [0, Math.max(k + 4 * Math.sqrt(2 * k), 10)],
        label: `Chi2(k=${k})`,
      };
    }
    case 'uniform': {
      const a = params.a ?? 0;
      const b = params.b ?? 1;
      const pad = (b - a) * 0.2;
      return {
        fn: type === 'pdf' ? (x) => uniformPDF(x, a, b) : (x) => uniformCDF(x, a, b),
        xDomain: [a - pad, b + pad],
        label: `Uniform(${a}, ${b})`,
      };
    }
    case 't': {
      const nu = params.nu ?? 5;
      return {
        fn: type === 'pdf' ? (x) => tPDF(x, nu) : (x) => tCDF(x, nu),
        xDomain: [-5, 5],
        label: `t(df=${nu})`,
      };
    }
    case 'gamma': {
      const alpha = params.alpha ?? 2;
      const beta = params.beta ?? 1;
      const meanG = alpha / beta;
      const sdG = Math.sqrt(alpha) / beta;
      return {
        fn: type === 'pdf' ? (x) => gammaPDF(x, alpha, beta) : (x) => gammaCDF(x, alpha, beta),
        xDomain: [0, meanG + 5 * sdG],
        label: `Gamma(${alpha}, ${beta})`,
      };
    }
    default:
      return {
        fn: () => 0,
        xDomain: [0, 1],
        label: 'Unknown',
      };
  }
}

// ---------------------------------------------------------------------------
// Main generator
// ---------------------------------------------------------------------------

export function generateDistributionCurve(options: DistributionCurveOptions): string {
  const { type, distribution, params } = options;
  const config: PlotConfig = { ...DEFAULT_CONFIG, ...options.config };
  const { innerWidth, innerHeight } = innerDimensions(config);
  const { margin } = config;

  const { fn, xDomain, label } = getDistributionFn(distribution, type, params);

  // Generate 200 evaluation points
  const nPoints = 200;
  const step = (xDomain[1] - xDomain[0]) / (nPoints - 1);
  const points: { x: number; y: number }[] = [];
  for (let i = 0; i < nPoints; i++) {
    const x = xDomain[0] + i * step;
    const y = fn(x);
    points.push({ x, y: isFinite(y) ? y : 0 });
  }

  // Compute Y domain
  const yValues = points.map((p) => p.y);
  const yMax = Math.max(...yValues) * 1.1;
  const yMin = type === 'cdf' ? 0 : 0;
  const yDomMax = type === 'cdf' ? 1.05 : (yMax > 0 ? yMax : 1);

  // Scales
  const xScale = scaleLinear()
    .domain(xDomain)
    .range([margin.left, margin.left + innerWidth]);
  const yScale = scaleLinear()
    .domain([yMin, yDomMax])
    .range([margin.top + innerHeight, margin.top]);

  // Grid
  const xTicks = xScale.ticks(7);
  const yTicks = yScale.ticks(5);
  const gridLines =
    gridLinesH(yTicks, yScale, margin.left, margin.left + innerWidth) +
    '\n' +
    gridLinesV(xTicks, xScale, margin.top, margin.top + innerHeight);

  // Curve path
  const lineGen = line<{ x: number; y: number }>()
    .x((d) => xScale(d.x))
    .y((d) => yScale(d.y))
    .curve(curveBasis);
  const pathD = lineGen(points) ?? '';
  const curvePath = `<path d="${pathD}" fill="none" stroke="${PALETTE.dataPrimary}" stroke-width="2" />`;

  // Area fill under PDF curve (not for CDF)
  let areaFill = '';
  if (type === 'pdf') {
    const areaGen = area<{ x: number; y: number }>()
      .x((d) => xScale(d.x))
      .y0(yScale(0))
      .y1((d) => yScale(d.y))
      .curve(curveBasis);
    const areaD = areaGen(points) ?? '';
    if (areaD) {
      areaFill = `<path d="${areaD}" fill="${PALETTE.dataPrimary}" fill-opacity="0.1" stroke="none" />`;
    }
  }

  // Distribution label annotation
  const annotation = `<text x="${(margin.left + innerWidth - 10).toFixed(2)}" y="${(margin.top + 16).toFixed(2)}" text-anchor="end" font-size="11" fill="${PALETTE.textSecondary}" font-family="${config.fontFamily}">${label} ${type.toUpperCase()}</text>`;

  // Default axis labels
  const xLabel = options.xLabel ?? 'x';
  const yLabel = options.yLabel ?? (type === 'pdf' ? 'f(x)' : 'F(x)');

  return (
    svgOpen(
      config,
      `${label} ${type.toUpperCase()} curve${options.title ? ': ' + options.title : ''}`,
    ) +
    gridLines +
    '\n' +
    areaFill +
    '\n' +
    curvePath +
    '\n' +
    annotation +
    '\n' +
    xAxis(xTicks, xScale, margin.top + innerHeight, xLabel, config) +
    '\n' +
    yAxis(yTicks, yScale, margin.left, yLabel, config) +
    '\n' +
    (options.title ? titleText(config, options.title) : '') +
    '</svg>'
  );
}
