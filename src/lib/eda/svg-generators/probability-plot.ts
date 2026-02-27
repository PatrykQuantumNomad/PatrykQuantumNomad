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
import { normalQuantile, linearRegression, mean, standardDeviation } from '../math/statistics';
import { gammaQuantile } from '../math/distribution-math';

export interface ProbabilityPlotOptions {
  data: number[];
  type?: 'normal' | 'qq' | 'weibull' | 'ppcc' | 'uniform' | 'gamma';
  gammaShape?: number;  // required when type = 'gamma'
  gammaScale?: number;  // required when type = 'gamma'
  config?: Partial<PlotConfig>;
  title?: string;
  xLabel?: string;
  yLabel?: string;
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

  // Theoretical quantiles via Blom plotting position
  const theoretical: number[] = [];
  for (let i = 0; i < n; i++) {
    const p = (i + 1 - 0.375) / (n + 0.25);
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

  const xLabel = options.xLabel ?? 'Theoretical Quantiles';
  const yLabel = options.yLabel ?? 'Sample Quantiles';

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
  const sorted = [...data].sort((a, b) => a - b);
  const n = sorted.length;

  // Theoretical quantiles
  const theoretical: number[] = [];
  for (let i = 0; i < n; i++) {
    const p = (i + 1 - 0.375) / (n + 0.25);
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

  // Diagonal reference line (y = x transformed to data scale)
  // Map theoretical quantiles to expected data values: y = mean + sd * x
  const m = mean(data);
  const sd = standardDeviation(data);
  const refF = (x: number) => m + sd * x;
  const xDomMin = xScale.domain()[0];
  const xDomMax = xScale.domain()[1];
  const refLine = `<line x1="${xScale(xDomMin).toFixed(2)}" y1="${yScale(refF(xDomMin)).toFixed(2)}" x2="${xScale(xDomMax).toFixed(2)}" y2="${yScale(refF(xDomMax)).toFixed(2)}" stroke="${PALETTE.dataSecondary}" stroke-width="1.5" stroke-dasharray="6,4" />`;

  const xLabel = options.xLabel ?? 'Theoretical Quantiles';
  const yLabel = options.yLabel ?? 'Sample Quantiles';

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

  // Weibull plotting positions
  const weibullX: number[] = [];
  const weibullY: number[] = [];
  for (let i = 0; i < n; i++) {
    const p = (i + 1) / (n + 1);
    weibullX.push(Math.log(-Math.log(1 - p)));
    weibullY.push(Math.log(sorted[i]));
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

  // Best-fit line
  const reg = linearRegression(weibullX, weibullY);
  const f = (x: number) => reg.slope * x + reg.intercept;
  const xDomMin = xScale.domain()[0];
  const xDomMax = xScale.domain()[1];
  const fitLine = `<line x1="${xScale(xDomMin).toFixed(2)}" y1="${yScale(f(xDomMin)).toFixed(2)}" x2="${xScale(xDomMax).toFixed(2)}" y2="${yScale(f(xDomMax)).toFixed(2)}" stroke="${PALETTE.dataSecondary}" stroke-width="1.5" />`;

  const xLabel = options.xLabel ?? 'ln(-ln(1-p))';
  const yLabel = options.yLabel ?? 'ln(Data)';

  return (
    svgOpen(config, `Weibull probability plot${options.title ? ': ' + options.title : ''}`) +
    grid + '\n' +
    points + '\n' +
    fitLine + '\n' +
    xAxis(xTicks, xScale, margin.top + innerHeight, xLabel, config) + '\n' +
    yAxis(yTicks, yScale, margin.left, yLabel, config) + '\n' +
    (options.title ? titleText(config, options.title) : '') +
    '</svg>'
  );
}

function renderPPCC(
  data: number[],
  options: ProbabilityPlotOptions,
  config: PlotConfig,
): string {
  const { innerWidth, innerHeight } = innerDimensions(config);
  const { margin } = config;
  const sorted = [...data].sort((a, b) => a - b);
  const n = sorted.length;

  // Compute PPCC for shape parameters r in [0.5, 5.0] step 0.1
  // PPCC = correlation between ordered data and theoretical quantiles
  // For each shape parameter r, compute Tukey-Lambda quantiles
  const shapeParams: number[] = [];
  const ppccValues: number[] = [];

  for (let r = 0.5; r <= 5.0; r += 0.1) {
    shapeParams.push(parseFloat(r.toFixed(1)));

    // Compute theoretical quantiles for Tukey-Lambda with shape r
    const theoreticalQ: number[] = [];
    for (let i = 0; i < n; i++) {
      const p = (i + 1 - 0.375) / (n + 0.25);
      // Tukey-Lambda quantile: Q(p) = (p^r - (1-p)^r) / r
      const q = (Math.pow(p, r) - Math.pow(1 - p, r)) / r;
      theoreticalQ.push(q);
    }

    // Correlation coefficient between sorted data and theoretical quantiles
    const reg = linearRegression(theoreticalQ, sorted);
    const corr = Math.sqrt(Math.max(0, reg.r2));
    ppccValues.push(corr);
  }

  // Find maximum PPCC
  let maxIdx = 0;
  let maxVal = ppccValues[0];
  for (let i = 1; i < ppccValues.length; i++) {
    if (ppccValues[i] > maxVal) {
      maxVal = ppccValues[i];
      maxIdx = i;
    }
  }

  // Scales
  const xScale = scaleLinear()
    .domain([0.5, 5.0])
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
  const pairs: [number, number][] = shapeParams.map((r, i) => [
    xScale(r),
    yScale(ppccValues[i]),
  ]);
  const pathD = lineGen(pairs) ?? '';
  const linePath = `<path d="${pathD}" fill="none" stroke="${PALETTE.dataPrimary}" stroke-width="1.5" />`;

  // Highlight maximum
  const maxCircle = `<circle cx="${xScale(shapeParams[maxIdx]).toFixed(2)}" cy="${yScale(maxVal).toFixed(2)}" r="5" fill="${PALETTE.dataSecondary}" stroke="${PALETTE.dataSecondary}" stroke-width="2" fill-opacity="0.5" />`;
  const maxLabel = `<text x="${xScale(shapeParams[maxIdx]).toFixed(2)}" y="${(yScale(maxVal) - 10).toFixed(2)}" text-anchor="middle" font-size="10" fill="${PALETTE.textSecondary}" font-family="${config.fontFamily}">r=${shapeParams[maxIdx].toFixed(1)}</text>`;

  const xLabel = options.xLabel ?? 'Shape Parameter (r)';
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

  // Uniform theoretical quantiles using Blom plotting position
  // For U(a,b): Q(p) = a + p*(b-a); estimate a,b from sample range
  const dataMin = sorted[0];
  const dataMax = sorted[n - 1];
  const theoretical: number[] = [];
  for (let i = 0; i < n; i++) {
    const p = (i + 1 - 0.375) / (n + 0.25);
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

  // Theoretical quantiles via Blom plotting position
  const theoretical: number[] = [];
  for (let i = 0; i < n; i++) {
    const p = (i + 1 - 0.375) / (n + 0.25);
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
