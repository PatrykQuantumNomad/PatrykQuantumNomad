/**
 * Line plot SVG generator for run-sequence, autocorrelation, and time-series modes.
 * Produces valid SVG markup from sequential numeric data at build time.
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
import { autocorrelation, mean } from '../math/statistics';

export interface LinePlotOptions {
  data: number[];
  mode?: 'run-sequence' | 'autocorrelation' | 'time-series';
  maxLag?: number;
  config?: Partial<PlotConfig>;
  title?: string;
  xLabel?: string;
  yLabel?: string;
  /** Custom reference line value (overrides the default mean for run-sequence mode). */
  refValue?: number;
}

export function generateLinePlot(options: LinePlotOptions): string {
  const { data, mode = 'run-sequence', maxLag = 20 } = options;
  const config: PlotConfig = { ...DEFAULT_CONFIG, ...options.config };
  const { innerWidth, innerHeight } = innerDimensions(config);
  const { margin } = config;

  // Guard clause
  if (data.length < 2) {
    return (
      svgOpen(config, 'Insufficient data for line plot') +
      `<text x="${(config.width / 2).toFixed(2)}" y="${(config.height / 2).toFixed(2)}" text-anchor="middle" font-size="14" fill="${PALETTE.textSecondary}" font-family="${config.fontFamily}">Insufficient data</text>` +
      '</svg>'
    );
  }

  if (mode === 'autocorrelation') {
    return renderAutocorrelation(data, maxLag, options, config);
  }

  // run-sequence and time-series share the same rendering
  return renderLineSeries(data, mode, options, config);
}

function renderLineSeries(
  data: number[],
  mode: 'run-sequence' | 'time-series',
  options: LinePlotOptions,
  config: PlotConfig,
): string {
  const { innerWidth, innerHeight } = innerDimensions(config);
  const { margin } = config;
  const n = data.length;

  // Scales
  const xScale = scaleLinear()
    .domain([1, n])
    .range([margin.left, margin.left + innerWidth]);

  let [yMin, yMax] = extent(data) as [number, number];
  if (yMin === yMax) { yMin -= 1; yMax += 1; }
  // Extend y domain to include custom reference value when provided
  const refVal = options.refValue ?? (mode === 'run-sequence' ? mean(data) : undefined);
  if (refVal !== undefined) {
    if (refVal < yMin) yMin = refVal;
    if (refVal > yMax) yMax = refVal;
  }
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
  const pairs: [number, number][] = data.map((v, i) => [
    xScale(i + 1),
    yScale(v),
  ]);
  const pathD = lineGen(pairs) ?? '';
  const linePath = `<path d="${pathD}" fill="none" stroke="${PALETTE.dataPrimary}" stroke-width="1.5" />`;

  // Reference line (only for run-sequence mode)
  let meanLine = '';
  if (mode === 'run-sequence' && refVal !== undefined) {
    const my = yScale(refVal).toFixed(2);
    meanLine = `<line x1="${margin.left.toFixed(2)}" y1="${my}" x2="${(margin.left + innerWidth).toFixed(2)}" y2="${my}" stroke="${PALETTE.dataSecondary}" stroke-width="1.5" stroke-dasharray="6,4" />`;
  }

  // Default labels
  const xLabel = options.xLabel ?? (mode === 'time-series' ? 'Time' : 'Observation');
  const yLabel = options.yLabel ?? 'Value';

  return (
    svgOpen(
      config,
      `Line plot${options.title ? ': ' + options.title : ''}`,
    ) +
    grid +
    '\n' +
    linePath +
    '\n' +
    meanLine +
    '\n' +
    xAxis(xTicks, xScale, margin.top + innerHeight, xLabel, config) +
    '\n' +
    yAxis(yTicks, yScale, margin.left, yLabel, config) +
    '\n' +
    (options.title ? titleText(config, options.title) : '') +
    '</svg>'
  );
}

function renderAutocorrelation(
  data: number[],
  maxLag: number,
  options: LinePlotOptions,
  config: PlotConfig,
): string {
  const { innerWidth, innerHeight } = innerDimensions(config);
  const { margin } = config;
  const n = data.length;
  const effectiveLag = Math.min(maxLag, n - 1);
  const acf = autocorrelation(data, effectiveLag);

  // Scales
  const xScale = scaleLinear()
    .domain([0, effectiveLag])
    .range([margin.left, margin.left + innerWidth]);
  const yScale = scaleLinear()
    .domain([-1, 1])
    .range([margin.top + innerHeight, margin.top]);

  // Grid
  const xTicks = xScale.ticks(Math.min(effectiveLag, 10));
  const yTicks = yScale.ticks(5);
  const grid =
    gridLinesH(yTicks, yScale, margin.left, margin.left + innerWidth) +
    '\n' +
    gridLinesV(xTicks, xScale, margin.top, margin.top + innerHeight);

  // Zero reference line
  const zeroY = yScale(0).toFixed(2);
  const zeroLine = `<line x1="${margin.left.toFixed(2)}" y1="${zeroY}" x2="${(margin.left + innerWidth).toFixed(2)}" y2="${zeroY}" stroke="${PALETTE.axis}" stroke-width="1" />`;

  // 95% significance bounds at ±1.96/√N
  const bound = 1.96 / Math.sqrt(n);
  const upperY = yScale(bound).toFixed(2);
  const lowerY = yScale(-bound).toFixed(2);
  const sigBounds =
    `<line x1="${margin.left.toFixed(2)}" y1="${upperY}" x2="${(margin.left + innerWidth).toFixed(2)}" y2="${upperY}" stroke="${PALETTE.dataSecondary}" stroke-width="1" stroke-dasharray="6,4" />` +
    '\n' +
    `<line x1="${margin.left.toFixed(2)}" y1="${lowerY}" x2="${(margin.left + innerWidth).toFixed(2)}" y2="${lowerY}" stroke="${PALETTE.dataSecondary}" stroke-width="1" stroke-dasharray="6,4" />`;

  // Lollipop bars (line from 0 to acf value + circle at tip)
  const lollipops = acf
    .map((val, lag) => {
      const cx = xScale(lag).toFixed(2);
      const cy = yScale(val).toFixed(2);
      return (
        `<line x1="${cx}" y1="${zeroY}" x2="${cx}" y2="${cy}" stroke="${PALETTE.dataPrimary}" stroke-width="2" />` +
        '\n' +
        `<circle cx="${cx}" cy="${cy}" r="3" fill="${PALETTE.dataPrimary}" />`
      );
    })
    .join('\n');

  const xLabel = options.xLabel ?? 'Lag';
  const yLabel = options.yLabel ?? 'ACF';

  return (
    svgOpen(
      config,
      `Autocorrelation plot${options.title ? ': ' + options.title : ''}`,
    ) +
    grid +
    '\n' +
    zeroLine +
    '\n' +
    sigBounds +
    '\n' +
    lollipops +
    '\n' +
    xAxis(
      xTicks,
      xScale,
      margin.top + innerHeight,
      xLabel,
      config,
      (v) => String(Math.round(v)),
    ) +
    '\n' +
    yAxis(yTicks, yScale, margin.left, yLabel, config) +
    '\n' +
    (options.title ? titleText(config, options.title) : '') +
    '</svg>'
  );
}
