/**
 * Distribution curve SVG generator for PDF and CDF visualization.
 * Supports all 19 NIST distributions via the shared distribution-math module.
 * Continuous distributions render as smooth curves; discrete (binomial, poisson)
 * render as bar-stem PMF plots and step-function CDFs.
 */
import { scaleLinear } from 'd3-scale';
import { line, area, curveBasis, curveStepAfter } from 'd3-shape';
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
import { evalDistribution, getXDomain, isDiscrete } from '../math/distribution-math';

export interface DistributionCurveOptions {
  type: 'pdf' | 'cdf';
  distribution: string;
  params: Record<string, number>;
  config?: Partial<PlotConfig>;
  title?: string;
  xLabel?: string;
  yLabel?: string;
}

// ---------------------------------------------------------------------------
// Label generation
// ---------------------------------------------------------------------------

const DIST_LABELS: Record<string, (p: Record<string, number>) => string> = {
  'normal': (p) => `Normal(${p.mu ?? 0}, ${p.sigma ?? 1})`,
  'uniform': (p) => `Uniform(${p.a ?? -1}, ${p.b ?? 1})`,
  'cauchy': (p) => `Cauchy(${p.x0 ?? 0}, ${p.gamma ?? 1})`,
  't-distribution': (p) => `t(df=${p.nu ?? 5})`,
  'f-distribution': (p) => `F(${p.d1 ?? 5}, ${p.d2 ?? 10})`,
  'chi-square': (p) => `Chi2(k=${p.k ?? 5})`,
  'exponential': (p) => `Exp(${p.lambda ?? 1})`,
  'weibull': (p) => `Weibull(${p.alpha ?? 1}, ${p.beta ?? 1})`,
  'lognormal': (p) => `LogN(${p.mu ?? 0}, ${p.sigma ?? 1})`,
  'fatigue-life': (p) => `BS(${p.alpha ?? 1}, ${p.beta ?? 1})`,
  'gamma': (p) => `Gamma(${p.alpha ?? 2}, ${p.beta ?? 1})`,
  'double-exponential': (p) => `Laplace(${p.mu ?? 0}, ${p.beta ?? 1})`,
  'power-normal': (p) => `PowN(p=${p.p ?? 1})`,
  'power-lognormal': (p) => `PowLN(p=${p.p ?? 1}, s=${p.sigma ?? 1})`,
  'tukey-lambda': (p) => `TL(l=${p.lambda ?? 0.14})`,
  'extreme-value': (p) => `Gumbel(${p.mu ?? 0}, ${p.beta ?? 1})`,
  'beta': (p) => `Beta(${p.alpha ?? 2}, ${p.beta ?? 5})`,
  'binomial': (p) => `Bin(n=${p.n ?? 10}, p=${p.p ?? 0.5})`,
  'poisson': (p) => `Pois(l=${p.lambda ?? 5})`,
};

function getLabel(distribution: string, params: Record<string, number>): string {
  const fn = DIST_LABELS[distribution];
  return fn ? fn(params) : distribution;
}

// ---------------------------------------------------------------------------
// Discrete rendering helpers
// ---------------------------------------------------------------------------

function renderDiscretepmf(
  distribution: string,
  params: Record<string, number>,
  xDomain: [number, number],
  xScale: (v: number) => number,
  yScale: (v: number) => number,
): string {
  const kMin = Math.max(0, Math.floor(xDomain[0]));
  const kMax = Math.ceil(xDomain[1]);
  const elements: string[] = [];

  for (let k = kMin; k <= kMax; k++) {
    const pmf = evalDistribution(distribution, 'pdf', k, params);
    if (!isFinite(pmf) || pmf <= 0) continue;
    const cx = xScale(k).toFixed(2);
    const cy = yScale(pmf).toFixed(2);
    const y0 = yScale(0).toFixed(2);
    // Vertical bar-stem line
    elements.push(
      `<line x1="${cx}" y1="${y0}" x2="${cx}" y2="${cy}" stroke="${PALETTE.dataPrimary}" stroke-width="3" />`
    );
    // Circle at top
    elements.push(
      `<circle cx="${cx}" cy="${cy}" r="3" fill="${PALETTE.dataPrimary}" />`
    );
  }
  return elements.join('\n');
}

function renderDiscreteCdf(
  distribution: string,
  params: Record<string, number>,
  xDomain: [number, number],
  xScale: (v: number) => number,
  yScale: (v: number) => number,
): string {
  const kMin = Math.max(0, Math.floor(xDomain[0]));
  const kMax = Math.ceil(xDomain[1]);
  const points: { x: number; y: number }[] = [];

  // Add initial point at the left edge with CDF = 0 (before first integer)
  if (kMin > 0) {
    points.push({ x: xDomain[0], y: 0 });
  }
  for (let k = kMin; k <= kMax; k++) {
    const cdf = evalDistribution(distribution, 'cdf', k, params);
    points.push({ x: k, y: isFinite(cdf) ? cdf : 0 });
  }
  // Extend to right edge
  points.push({ x: xDomain[1], y: points[points.length - 1]?.y ?? 1 });

  const lineGen = line<{ x: number; y: number }>()
    .x((d) => xScale(d.x))
    .y((d) => yScale(d.y))
    .curve(curveStepAfter);
  const pathD = lineGen(points) ?? '';
  return `<path d="${pathD}" fill="none" stroke="${PALETTE.dataPrimary}" stroke-width="2" />`;
}

// ---------------------------------------------------------------------------
// Main generator
// ---------------------------------------------------------------------------

export function generateDistributionCurve(options: DistributionCurveOptions): string {
  const { type, distribution, params } = options;
  const config: PlotConfig = { ...DEFAULT_CONFIG, ...options.config };
  const { innerWidth, innerHeight } = innerDimensions(config);
  const { margin } = config;

  const xDomain = getXDomain(distribution, params);
  const label = getLabel(distribution, params);
  const discrete = isDiscrete(distribution);

  // Generate evaluation points (continuous: 200 points, discrete: per-integer)
  const points: { x: number; y: number }[] = [];
  if (discrete) {
    const kMin = Math.max(0, Math.floor(xDomain[0]));
    const kMax = Math.ceil(xDomain[1]);
    for (let k = kMin; k <= kMax; k++) {
      const y = evalDistribution(distribution, type, k, params);
      points.push({ x: k, y: isFinite(y) ? y : 0 });
    }
  } else {
    const nPoints = 200;
    const step = (xDomain[1] - xDomain[0]) / (nPoints - 1);
    for (let i = 0; i < nPoints; i++) {
      const x = xDomain[0] + i * step;
      const y = evalDistribution(distribution, type, x, params);
      points.push({ x, y: isFinite(y) ? y : 0 });
    }
  }

  // Compute Y domain
  const yValues = points.map((p) => p.y);
  const yMax = Math.max(...yValues) * 1.1;
  const yDomMax = type === 'cdf' ? 1.05 : (yMax > 0 ? yMax : 1);

  // Scales
  const xScale = scaleLinear()
    .domain(xDomain)
    .range([margin.left, margin.left + innerWidth]);
  const yScale = scaleLinear()
    .domain([0, yDomMax])
    .range([margin.top + innerHeight, margin.top]);

  // Grid
  const xTicks = xScale.ticks(7);
  const yTicks = yScale.ticks(5);
  const gridLines =
    gridLinesH(yTicks, yScale, margin.left, margin.left + innerWidth) +
    '\n' +
    gridLinesV(xTicks, xScale, margin.top, margin.top + innerHeight);

  // Render data content
  let dataContent = '';

  if (discrete) {
    if (type === 'pdf') {
      dataContent = renderDiscretepmf(distribution, params, xDomain, xScale, yScale);
    } else {
      dataContent = renderDiscreteCdf(distribution, params, xDomain, xScale, yScale);
    }
  } else {
    // Continuous: smooth curve + area fill for PDF
    const lineGen = line<{ x: number; y: number }>()
      .x((d) => xScale(d.x))
      .y((d) => yScale(d.y))
      .curve(curveBasis);
    const pathD = lineGen(points) ?? '';
    const curvePath = `<path d="${pathD}" fill="none" stroke="${PALETTE.dataPrimary}" stroke-width="2" />`;

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
    dataContent = areaFill + '\n' + curvePath;
  }

  // Distribution label annotation (above the plot area)
  const annotation = `<text x="${(margin.left + innerWidth - 10).toFixed(2)}" y="${(margin.top - 6).toFixed(2)}" text-anchor="end" font-size="11" fill="${PALETTE.textSecondary}" font-family="${config.fontFamily}">${label} ${type.toUpperCase()}</text>`;

  // Default axis labels
  const xLbl = options.xLabel ?? (discrete ? 'k' : 'x');
  const yLbl = options.yLabel ?? (type === 'pdf' ? (discrete ? 'P(X=k)' : 'f(x)') : 'F(x)');

  return (
    svgOpen(
      config,
      `${label} ${type.toUpperCase()} curve${options.title ? ': ' + options.title : ''}`,
    ) +
    gridLines +
    '\n' +
    dataContent +
    '\n' +
    annotation +
    '\n' +
    xAxis(xTicks, xScale, margin.top + innerHeight, xLbl, config) +
    '\n' +
    yAxis(yTicks, yScale, margin.left, yLbl, config) +
    '\n' +
    (options.title ? titleText(config, options.title) : '') +
    '</svg>'
  );
}
