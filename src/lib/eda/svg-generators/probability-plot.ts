/**
 * Probability plot SVG generator for normal, Q-Q, Weibull, and PPCC plot types.
 * Produces valid SVG markup from numeric data arrays at build time.
 */
import { scaleLinear } from 'd3-scale';
import { extent } from 'd3-array';
import { line, curveLinear } from 'd3-shape';
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
import { normalQuantile, linearRegression } from '../math/statistics';
import { gammaQuantile } from '../math/distribution-math';

export interface ProbabilityPlotOptions {
  data: number[];
  data2?: number[];     // second dataset for two-sample Q-Q plot
  type?: 'normal' | 'qq' | 'weibull' | 'ppcc' | 'uniform' | 'gamma';
  gammaShape?: number;  // required when type = 'gamma'
  gammaScale?: number;  // required when type = 'gamma'
  config?: Partial<PlotConfig>;
  title?: string;
  xLabel?: string;
  yLabel?: string;
}

/**
 * Filliben uniform order statistic medians (NIST 1.3.3.21).
 * Returns the plotting position p_i for the i-th order statistic (0-indexed)
 * in a sample of size n.
 *
 *  - i = 0        (first):    p = 1 - 0.5^(1/n)
 *  - i = n-1      (last):     p = 0.5^(1/n)
 *  - 1 <= i <= n-2 (interior): p = (i + 1 - 0.3175) / (n + 0.365)
 */
function fillibenMedian(i: number, n: number): number {
  if (i === 0) return 1 - Math.pow(0.5, 1 / n);
  if (i === n - 1) return Math.pow(0.5, 1 / n);
  return (i + 1 - 0.3175) / (n + 0.365);
}

export function generateProbabilityPlot(options: ProbabilityPlotOptions): string {
  const { data, type = 'normal' } = options;
  const config: PlotConfig = { ...DEFAULT_CONFIG, ...options.config };

  // Guard clause
  if (data.length < 3) {
    return (
      svgOpen(config, 'Insufficient data for probability plot') +
      `<text x="${(config.width / 2).toFixed(2)}" y="${(config.height / 2).toFixed(2)}" text-anchor="middle" font-size="14" fill="${PALETTE.textSecondary}" font-family="${config.fontFamily}">Insufficient data</text>` +
      '</svg>'
    );
  }

  switch (type) {
    case 'normal':
      return renderNormalProbability(data, options, config);
    case 'qq':
      return renderQQ(data, options, config);
    case 'weibull':
      return renderWeibull(data, options, config);
    case 'ppcc':
      return renderPPCC(data, options, config);
    case 'uniform':
      return renderUniformProbability(data, options, config);
    case 'gamma':
      return renderGamma(data, options, config);
    default:
      return renderNormalProbability(data, options, config);
  }
}

function renderNormalProbability(
  data: number[],
  options: ProbabilityPlotOptions,
  config: PlotConfig,
): string {
  const { innerWidth, innerHeight } = innerDimensions(config);
  const { margin } = config;
  const sorted = [...data].sort((a, b) => a - b);
  const n = sorted.length;

  // Filliben uniform order statistic medians (NIST 1.3.3.21)
  const theoretical: number[] = [];
  for (let i = 0; i < n; i++) {
    const p = fillibenMedian(i, n);
    theoretical.push(normalQuantile(p));
  }

  // Scales
  let [xMin, xMax] = extent(theoretical) as [number, number];
  if (xMin === xMax) { xMin -= 1; xMax += 1; }
  let [yMin, yMax] = extent(sorted) as [number, number];
  if (yMin === yMax) { yMin -= 1; yMax += 1; }

  const xScale = scaleLinear()
    .domain([xMin, xMax])
    .range([margin.left, margin.left + innerWidth])
    .nice();
  const yScale = scaleLinear()
    .domain([yMin, yMax])
    .range([margin.top + innerHeight, margin.top])
    .nice();

  // Grid
  const xTicks = xScale.ticks(7);
  const yTicks = yScale.ticks(5);
  const grid =
    gridLinesH(yTicks, yScale, margin.left, margin.left + innerWidth) +
    '\n' +
    gridLinesV(xTicks, xScale, margin.top, margin.top + innerHeight);

  // Data points
  const points = sorted
    .map(
      (v, i) =>
        `<circle cx="${xScale(theoretical[i]).toFixed(2)}" cy="${yScale(v).toFixed(2)}" r="3" fill="${PALETTE.dataPrimary}" fill-opacity="0.6" />`,
    )
    .join('\n');

  // Best-fit line through Q1/Q3 reference points
  const reg = linearRegression(theoretical, sorted);
  const f = (x: number) => reg.slope * x + reg.intercept;
  const xDomMin = xScale.domain()[0];
  const xDomMax = xScale.domain()[1];
  const fitLine = `<line x1="${xScale(xDomMin).toFixed(2)}" y1="${yScale(f(xDomMin)).toFixed(2)}" x2="${xScale(xDomMax).toFixed(2)}" y2="${yScale(f(xDomMax)).toFixed(2)}" stroke="${PALETTE.dataSecondary}" stroke-width="1.5" />`;

  const xLabel = options.xLabel ?? 'Normal N(0,1) Order Statistic Medians';
  const yLabel = options.yLabel ?? 'Ordered Response';

  return (
    svgOpen(config, `Normal probability plot${options.title ? ': ' + options.title : ''}`) +
    grid + '\n' +
    points + '\n' +
    fitLine + '\n' +
    xAxis(xTicks, xScale, margin.top + innerHeight, xLabel, config) + '\n' +
    yAxis(yTicks, yScale, margin.left, yLabel, config) + '\n' +
    (options.title ? titleText(config, options.title) : '') +
    '</svg>'
  );
}

function renderQQ(
  data: number[],
  options: ProbabilityPlotOptions,
  config: PlotConfig,
): string {
  const { innerWidth, innerHeight } = innerDimensions(config);
  const { margin } = config;

  // Two-sample Q-Q plot: compare quantiles of data vs data2
  const sorted1 = [...data].sort((a, b) => a - b);
  const sorted2 = [...(options.data2 ?? data)].sort((a, b) => a - b);

  // Match quantiles: use the smaller sample size, interpolate the larger
  const n = Math.min(sorted1.length, sorted2.length);
  const q1: number[] = [];
  const q2: number[] = [];
  for (let i = 0; i < n; i++) {
    const p = (i + 0.5) / n;  // Hazen plotting position
    // Interpolate quantiles from each sorted dataset
    q1.push(interpolateQuantile(sorted1, p));
    q2.push(interpolateQuantile(sorted2, p));
  }

  // Scales
  let [xMin, xMax] = extent(q1) as [number, number];
  if (xMin === xMax) { xMin -= 1; xMax += 1; }
  let [yMin, yMax] = extent(q2) as [number, number];
  if (yMin === yMax) { yMin -= 1; yMax += 1; }

  const xScale = scaleLinear()
    .domain([xMin, xMax])
    .range([margin.left, margin.left + innerWidth])
    .nice();
  const yScale = scaleLinear()
    .domain([yMin, yMax])
    .range([margin.top + innerHeight, margin.top])
    .nice();

  // Grid
  const xTicks = xScale.ticks(7);
  const yTicks = yScale.ticks(5);
  const grid =
    gridLinesH(yTicks, yScale, margin.left, margin.left + innerWidth) +
    '\n' +
    gridLinesV(xTicks, xScale, margin.top, margin.top + innerHeight);

  // Data points
  const points = q1
    .map(
      (v, i) =>
        `<circle cx="${xScale(v).toFixed(2)}" cy="${yScale(q2[i]).toFixed(2)}" r="3" fill="${PALETTE.dataPrimary}" fill-opacity="0.6" />`,
    )
    .join('\n');

  // 45-degree identity reference line (y = x)
  const allVals = [...q1, ...q2];
  const lineMin = Math.min(...allVals);
  const lineMax = Math.max(...allVals);
  const refLine = `<line x1="${xScale(lineMin).toFixed(2)}" y1="${yScale(lineMin).toFixed(2)}" x2="${xScale(lineMax).toFixed(2)}" y2="${yScale(lineMax).toFixed(2)}" stroke="${PALETTE.dataSecondary}" stroke-width="1.5" stroke-dasharray="6,4" />`;

  const xLabel = options.xLabel ?? 'Dataset 1 Quantiles';
  const yLabel = options.yLabel ?? 'Dataset 2 Quantiles';

  return (
    svgOpen(config, `Q-Q plot${options.title ? ': ' + options.title : ''}`) +
    grid + '\n' +
    points + '\n' +
    refLine + '\n' +
    xAxis(xTicks, xScale, margin.top + innerHeight, xLabel, config) + '\n' +
    yAxis(yTicks, yScale, margin.left, yLabel, config) + '\n' +
    (options.title ? titleText(config, options.title) : '') +
    '</svg>'
  );
}

/** Linear interpolation of quantile at probability p from a sorted array. */
function interpolateQuantile(sorted: number[], p: number): number {
  const n = sorted.length;
  const index = p * (n - 1);
  const lo = Math.floor(index);
  const hi = Math.ceil(index);
  if (lo === hi) return sorted[lo];
  const frac = index - lo;
  return sorted[lo] * (1 - frac) + sorted[hi] * frac;
}

function renderWeibull(
  data: number[],
  options: ProbabilityPlotOptions,
  config: PlotConfig,
): string {
  const { innerWidth, innerHeight } = innerDimensions(config);
  const { margin } = config;

  // Filter positive values for log transform
  const positive = data.filter((v) => v > 0);
  if (positive.length < 3) {
    return (
      svgOpen(config, 'Insufficient positive data for Weibull plot') +
      `<text x="${(config.width / 2).toFixed(2)}" y="${(config.height / 2).toFixed(2)}" text-anchor="middle" font-size="14" fill="${PALETTE.textSecondary}" font-family="${config.fontFamily}">Insufficient positive data</text>` +
      '</svg>'
    );
  }

  const sorted = [...positive].sort((a, b) => a - b);
  const n = sorted.length;

  // Weibull plotting positions using Benard's median rank approximation
  // NIST 1.3.3.30: p = (i - 0.3) / (N + 0.4) where i is 1-based rank
  // NIST convention: X = log10(data), Y = ln(-ln(1-p))
  const weibullX: number[] = [];  // log10(data) — horizontal
  const weibullY: number[] = [];  // ln(-ln(1-p)) — vertical (Weibull probability scale)
  for (let i = 0; i < n; i++) {
    const p = (i + 1 - 0.3) / (n + 0.4);
    weibullX.push(Math.log10(sorted[i]));
    weibullY.push(Math.log(-Math.log(1 - p)));
  }

  // Scales
  let [xMin, xMax] = extent(weibullX) as [number, number];
  if (xMin === xMax) { xMin -= 1; xMax += 1; }
  let [yMin, yMax] = extent(weibullY) as [number, number];
  if (yMin === yMax) { yMin -= 1; yMax += 1; }

  const xScale = scaleLinear()
    .domain([xMin, xMax])
    .range([margin.left, margin.left + innerWidth])
    .nice();
  const yScale = scaleLinear()
    .domain([yMin, yMax])
    .range([margin.top + innerHeight, margin.top])
    .nice();

  // Grid
  const xTicks = xScale.ticks(7);
  const yTicks = yScale.ticks(5);
  const grid =
    gridLinesH(yTicks, yScale, margin.left, margin.left + innerWidth) +
    '\n' +
    gridLinesV(xTicks, xScale, margin.top, margin.top + innerHeight);

  // Data points
  const points = weibullX
    .map(
      (wx, i) =>
        `<circle cx="${xScale(wx).toFixed(2)}" cy="${yScale(weibullY[i]).toFixed(2)}" r="3" fill="${PALETTE.dataPrimary}" fill-opacity="0.6" />`,
    )
    .join('\n');

  // Best-fit line: regress Y (probability) on X (log10 data)
  const reg = linearRegression(weibullX, weibullY);
  const f = (x: number) => reg.slope * x + reg.intercept;
  const xDomMin = xScale.domain()[0];
  const xDomMax = xScale.domain()[1];
  const fitLine = `<line x1="${xScale(xDomMin).toFixed(2)}" y1="${yScale(f(xDomMin)).toFixed(2)}" x2="${xScale(xDomMax).toFixed(2)}" y2="${yScale(f(xDomMax)).toFixed(2)}" stroke="${PALETTE.dataSecondary}" stroke-width="1.5" />`;

  // 63.2% reference line: horizontal dashed line at y = ln(-ln(1 - 0.632)) ≈ 0
  const y632 = Math.log(-Math.log(1 - 0.632));
  const y632Px = yScale(y632);
  const refLineH = (y632Px >= margin.top && y632Px <= margin.top + innerHeight)
    ? `<line x1="${margin.left}" y1="${y632Px.toFixed(2)}" x2="${(margin.left + innerWidth)}" y2="${y632Px.toFixed(2)}" stroke="${PALETTE.textSecondary}" stroke-width="1" stroke-dasharray="6,4" opacity="0.6" />`
    : '';
  // Vertical line at intersection of 63.2% line with regression fit
  const x632 = (y632 - reg.intercept) / reg.slope; // solve f(x) = y632
  const x632Px = xScale(x632);
  const refLineV = (refLineH && x632Px >= margin.left && x632Px <= margin.left + innerWidth)
    ? `<line x1="${x632Px.toFixed(2)}" y1="${y632Px.toFixed(2)}" x2="${x632Px.toFixed(2)}" y2="${(margin.top + innerHeight)}" stroke="${PALETTE.textSecondary}" stroke-width="1" stroke-dasharray="6,4" opacity="0.6" />`
    : '';

  const xLabel = options.xLabel ?? 'log\u2081\u2080(Data)';
  const yLabel = options.yLabel ?? 'ln(-ln(1-p))';

  return (
    svgOpen(config, `Weibull probability plot${options.title ? ': ' + options.title : ''}`) +
    grid + '\n' +
    points + '\n' +
    fitLine + '\n' +
    refLineH + '\n' +
    refLineV + '\n' +
    xAxis(xTicks, xScale, margin.top + innerHeight, xLabel, config) + '\n' +
    yAxis(yTicks, yScale, margin.left, yLabel, config) + '\n' +
    (options.title ? titleText(config, options.title) : '') +
    '</svg>'
  );
}

/**
 * Pearson correlation coefficient between two arrays.
 * Returns ssxy / sqrt(ssxx * ssyy), preserving sign unlike sqrt(R²).
 */
function pearsonR(x: number[], y: number[]): number {
  const n = x.length;
  if (n < 2) return 0;
  let mx = 0, my = 0;
  for (let i = 0; i < n; i++) { mx += x[i]; my += y[i]; }
  mx /= n; my /= n;
  let ssxy = 0, ssxx = 0, ssyy = 0;
  for (let i = 0; i < n; i++) {
    const dx = x[i] - mx;
    const dy = y[i] - my;
    ssxy += dx * dy;
    ssxx += dx * dx;
    ssyy += dy * dy;
  }
  const denom = ssxx * ssyy;
  return denom === 0 ? 0 : ssxy / Math.sqrt(denom);
}

/**
 * Compute the Tukey-Lambda PPCC (Pearson r) for a given lambda value.
 * Uses Filliben uniform order statistic medians (NIST 1.3.3.21).
 */
function tukeyLambdaPPCC(sorted: number[], lam: number): number {
  const n = sorted.length;
  const theoreticalQ: number[] = [];
  for (let i = 0; i < n; i++) {
    const p = fillibenMedian(i, n);
    // Tukey-Lambda quantile function:
    //   Q(p) = (p^lambda - (1-p)^lambda) / lambda  when lambda != 0
    //   Q(p) = ln(p / (1-p))                        when lambda == 0
    let q: number;
    if (Math.abs(lam) < 1e-10) {
      q = Math.log(p / (1 - p));
    } else {
      q = (Math.pow(p, lam) - Math.pow(1 - p, lam)) / lam;
    }
    theoreticalQ.push(q);
  }
  return pearsonR(theoreticalQ, sorted);
}

function renderPPCC(
  data: number[],
  options: ProbabilityPlotOptions,
  config: PlotConfig,
): string {
  const { innerWidth, innerHeight } = innerDimensions(config);
  const { margin } = config;
  const sorted = [...data].sort((a, b) => a - b);

  // NIST 1.3.3.23: two-pass approach — coarse scan then refinement.
  // Pass 1: coarse scan over [-2.0, 2.0] at step 0.05
  // Range must include lambda = -1 (Cauchy), 0 (logistic),
  // 0.14 (normal), 0.5 (U-shaped), 1 (uniform)
  const coarseStep = 0.05;
  const shapeParams: number[] = [];
  const ppccValues: number[] = [];
  let coarseBestLam = -2.0;
  let coarseBestR = -Infinity;
  for (let lam = -2.0; lam <= 2.0; lam += coarseStep) {
    const lamRound = parseFloat(lam.toFixed(2));
    const r = tukeyLambdaPPCC(sorted, lamRound);
    shapeParams.push(lamRound);
    ppccValues.push(r);
    if (r > coarseBestR) { coarseBestR = r; coarseBestLam = lamRound; }
  }

  // Pass 2: refine around the coarse peak at step 0.005
  const fineStep = 0.005;
  const fineMin = Math.max(-2.0, coarseBestLam - coarseStep);
  const fineMax = Math.min(2.0, coarseBestLam + coarseStep);
  let refinedBestLam = coarseBestLam;
  let refinedBestR = coarseBestR;
  for (let lam = fineMin; lam <= fineMax; lam += fineStep) {
    const lamRound = parseFloat(lam.toFixed(3));
    const r = tukeyLambdaPPCC(sorted, lamRound);
    if (r > refinedBestR) { refinedBestR = r; refinedBestLam = lamRound; }
  }

  // Scales
  const xScale = scaleLinear()
    .domain([-2.0, 2.0])
    .range([margin.left, margin.left + innerWidth]);
  let [yMin, yMax] = extent(ppccValues) as [number, number];
  if (yMin === yMax) { yMin -= 0.01; yMax += 0.01; }
  const yScale = scaleLinear()
    .domain([yMin, yMax])
    .range([margin.top + innerHeight, margin.top])
    .nice();

  // Grid
  const xTicks = xScale.ticks(7);
  const yTicks = yScale.ticks(5);
  const grid =
    gridLinesH(yTicks, yScale, margin.left, margin.left + innerWidth) +
    '\n' +
    gridLinesV(xTicks, xScale, margin.top, margin.top + innerHeight);

  // Line path
  const lineGen = line<[number, number]>()
    .x((d) => d[0])
    .y((d) => d[1])
    .curve(curveLinear);
  const pairs: [number, number][] = shapeParams.map((lam, i) => [
    xScale(lam),
    yScale(ppccValues[i]),
  ]);
  const pathD = lineGen(pairs) ?? '';
  const linePath = `<path d="${pathD}" fill="none" stroke="${PALETTE.dataPrimary}" stroke-width="1.5" />`;

  // Highlight refined maximum (positioned on the curve via interpolation)
  const maxCircle = `<circle cx="${xScale(refinedBestLam).toFixed(2)}" cy="${yScale(refinedBestR).toFixed(2)}" r="5" fill="${PALETTE.dataSecondary}" stroke="${PALETTE.dataSecondary}" stroke-width="2" fill-opacity="0.5" />`;
  // Show 3 decimal places for the refined lambda estimate
  // Place label below the circle to avoid overlapping with the plot title
  const lamDisplay = Number.isInteger(refinedBestLam * 100) ? refinedBestLam.toFixed(2) : refinedBestLam.toFixed(3);
  const maxLabel = `<text x="${xScale(refinedBestLam).toFixed(2)}" y="${(yScale(refinedBestR) + 18).toFixed(2)}" text-anchor="middle" font-size="10" fill="${PALETTE.textSecondary}" font-family="${config.fontFamily}">\u03BB=${lamDisplay}</text>`;

  const xLabel = options.xLabel ?? 'Shape Parameter (\u03BB)';
  const yLabel = options.yLabel ?? 'PPCC';

  return (
    svgOpen(config, `PPCC plot${options.title ? ': ' + options.title : ''}`) +
    grid + '\n' +
    linePath + '\n' +
    maxCircle + '\n' +
    maxLabel + '\n' +
    xAxis(xTicks, xScale, margin.top + innerHeight, xLabel, config) + '\n' +
    yAxis(yTicks, yScale, margin.left, yLabel, config) + '\n' +
    (options.title ? titleText(config, options.title) : '') +
    '</svg>'
  );
}

function renderUniformProbability(
  data: number[],
  options: ProbabilityPlotOptions,
  config: PlotConfig,
): string {
  const { innerWidth, innerHeight } = innerDimensions(config);
  const { margin } = config;
  const sorted = [...data].sort((a, b) => a - b);
  const n = sorted.length;

  // Filliben uniform order statistic medians (NIST 1.3.3.21)
  // For U(a,b): Q(p) = a + p*(b-a); estimate a,b from sample range
  const dataMin = sorted[0];
  const dataMax = sorted[n - 1];
  const theoretical: number[] = [];
  for (let i = 0; i < n; i++) {
    const p = fillibenMedian(i, n);
    theoretical.push(dataMin + p * (dataMax - dataMin));
  }

  // Scales
  let [xMin, xMax] = extent(theoretical) as [number, number];
  if (xMin === xMax) { xMin -= 1; xMax += 1; }
  let [yMin, yMax] = extent(sorted) as [number, number];
  if (yMin === yMax) { yMin -= 1; yMax += 1; }

  const xScale = scaleLinear()
    .domain([xMin, xMax])
    .range([margin.left, margin.left + innerWidth])
    .nice();
  const yScale = scaleLinear()
    .domain([yMin, yMax])
    .range([margin.top + innerHeight, margin.top])
    .nice();

  // Grid
  const xTicks = xScale.ticks(7);
  const yTicks = yScale.ticks(5);
  const grid =
    gridLinesH(yTicks, yScale, margin.left, margin.left + innerWidth) +
    '\n' +
    gridLinesV(xTicks, xScale, margin.top, margin.top + innerHeight);

  // Data points
  const points = sorted
    .map(
      (v, i) =>
        `<circle cx="${xScale(theoretical[i]).toFixed(2)}" cy="${yScale(v).toFixed(2)}" r="3" fill="${PALETTE.dataPrimary}" fill-opacity="0.6" />`,
    )
    .join('\n');

  // Perfect-fit reference line (y = x)
  const xDomMin = xScale.domain()[0];
  const xDomMax = xScale.domain()[1];
  const fitLine = `<line x1="${xScale(xDomMin).toFixed(2)}" y1="${yScale(xDomMin).toFixed(2)}" x2="${xScale(xDomMax).toFixed(2)}" y2="${yScale(xDomMax).toFixed(2)}" stroke="${PALETTE.dataSecondary}" stroke-width="1.5" />`;

  const xLabel = options.xLabel ?? 'Uniform Theoretical Quantiles';
  const yLabel = options.yLabel ?? 'Sample Quantiles';

  return (
    svgOpen(config, `Uniform probability plot${options.title ? ': ' + options.title : ''}`) +
    grid + '\n' +
    points + '\n' +
    fitLine + '\n' +
    xAxis(xTicks, xScale, margin.top + innerHeight, xLabel, config) + '\n' +
    yAxis(yTicks, yScale, margin.left, yLabel, config) + '\n' +
    (options.title ? titleText(config, options.title) : '') +
    '</svg>'
  );
}

function renderGamma(
  data: number[],
  options: ProbabilityPlotOptions,
  config: PlotConfig,
): string {
  const { innerWidth, innerHeight } = innerDimensions(config);
  const { margin } = config;
  const shape = options.gammaShape ?? 2;
  const scale = options.gammaScale ?? 1;

  const sorted = [...data].sort((a, b) => a - b);
  const n = sorted.length;

  // Filliben uniform order statistic medians (NIST 1.3.3.21)
  const theoretical: number[] = [];
  for (let i = 0; i < n; i++) {
    const p = fillibenMedian(i, n);
    theoretical.push(gammaQuantile(p, shape, scale));
  }

  // Scales
  let [xMin, xMax] = extent(theoretical) as [number, number];
  if (xMin === xMax) { xMin -= 1; xMax += 1; }
  let [yMin, yMax] = extent(sorted) as [number, number];
  if (yMin === yMax) { yMin -= 1; yMax += 1; }

  const xScale = scaleLinear()
    .domain([xMin, xMax])
    .range([margin.left, margin.left + innerWidth])
    .nice();
  const yScale = scaleLinear()
    .domain([yMin, yMax])
    .range([margin.top + innerHeight, margin.top])
    .nice();

  // Grid
  const xTicks = xScale.ticks(7);
  const yTicks = yScale.ticks(5);
  const grid =
    gridLinesH(yTicks, yScale, margin.left, margin.left + innerWidth) +
    '\n' +
    gridLinesV(xTicks, xScale, margin.top, margin.top + innerHeight);

  // Data points
  const points = sorted
    .map(
      (v, i) =>
        `<circle cx="${xScale(theoretical[i]).toFixed(2)}" cy="${yScale(v).toFixed(2)}" r="3" fill="${PALETTE.dataPrimary}" fill-opacity="0.6" />`,
    )
    .join('\n');

  // Best-fit line
  const reg = linearRegression(theoretical, sorted);
  const f = (x: number) => reg.slope * x + reg.intercept;
  const xDomMin = xScale.domain()[0];
  const xDomMax = xScale.domain()[1];
  const fitLine = `<line x1="${xScale(xDomMin).toFixed(2)}" y1="${yScale(f(xDomMin)).toFixed(2)}" x2="${xScale(xDomMax).toFixed(2)}" y2="${yScale(f(xDomMax)).toFixed(2)}" stroke="${PALETTE.dataSecondary}" stroke-width="1.5" />`;

  const xLabel = options.xLabel ?? 'Gamma Theoretical Quantiles';
  const yLabel = options.yLabel ?? 'Sample Quantiles';

  return (
    svgOpen(config, `Gamma probability plot${options.title ? ': ' + options.title : ''}`) +
    grid + '\n' +
    points + '\n' +
    fitLine + '\n' +
    xAxis(xTicks, xScale, margin.top + innerHeight, xLabel, config) + '\n' +
    yAxis(yTicks, yScale, margin.left, yLabel, config) + '\n' +
    (options.title ? titleText(config, options.title) : '') +
    '</svg>'
  );
}
