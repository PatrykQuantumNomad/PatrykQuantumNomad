/**
 * Lag plot SVG generator for autocorrelation pattern detection.
 * Plots Y(i) vs Y(i+k) to reveal serial dependence structure.
 */
import { scaleLinear } from 'd3-scale';
import { extent } from 'd3-array';
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

export interface LagPlotOptions {
  data: number[];
  lag?: number;
  config?: Partial<PlotConfig>;
  title?: string;
}

export function generateLagPlot(options: LagPlotOptions): string {
  const { data, lag = 1 } = options;
  const config: PlotConfig = { ...DEFAULT_CONFIG, ...options.config };
  const { innerWidth, innerHeight } = innerDimensions(config);
  const { margin } = config;

  // Guard clause
  if (data.length < lag + 2) {
    return (
      svgOpen(config, 'Insufficient data for lag plot') +
      `<text x="${(config.width / 2).toFixed(2)}" y="${(config.height / 2).toFixed(2)}" text-anchor="middle" font-size="14" fill="${PALETTE.textSecondary}" font-family="${config.fontFamily}">Insufficient data</text>` +
      '</svg>'
    );
  }

  // Create lag pairs: (data[i], data[i + lag])
  const pairs: { x: number; y: number }[] = [];
  for (let i = 0; i < data.length - lag; i++) {
    pairs.push({ x: data[i], y: data[i + lag] });
  }

  // Shared domain for square aspect (both axes use same range)
  const allValues = data;
  let [domMin, domMax] = extent(allValues) as [number, number];
  if (domMin === domMax) { domMin -= 1; domMax += 1; }

  // Scales
  const xScale = scaleLinear()
    .domain([domMin, domMax])
    .range([margin.left, margin.left + innerWidth])
    .nice();
  const yScale = scaleLinear()
    .domain([domMin, domMax])
    .range([margin.top + innerHeight, margin.top])
    .nice();

  // Grid lines
  const xTicks = xScale.ticks(7);
  const yTicks = yScale.ticks(5);
  const grid =
    gridLinesH(yTicks, yScale, margin.left, margin.left + innerWidth) +
    '\n' +
    gridLinesV(xTicks, xScale, margin.top, margin.top + innerHeight);

  // Diagonal reference line (y = x)
  const diagXMin = xScale.domain()[0];
  const diagXMax = xScale.domain()[1];
  const diagonal = `<line x1="${xScale(diagXMin).toFixed(2)}" y1="${yScale(diagXMin).toFixed(2)}" x2="${xScale(diagXMax).toFixed(2)}" y2="${yScale(diagXMax).toFixed(2)}" stroke="${PALETTE.grid}" stroke-width="1.5" stroke-dasharray="6,4" />`;

  // Data points
  const points = pairs
    .map(
      (p) =>
        `<circle cx="${xScale(p.x).toFixed(2)}" cy="${yScale(p.y).toFixed(2)}" r="3" fill="${PALETTE.dataPrimary}" fill-opacity="0.6" />`,
    )
    .join('\n');

  // Labels
  const xLabel = `Y(i)`;
  const yLabel = `Y(i+${lag})`;

  return (
    svgOpen(
      config,
      `Lag ${lag} plot${options.title ? ': ' + options.title : ''}`,
    ) +
    grid +
    '\n' +
    diagonal +
    '\n' +
    points +
    '\n' +
    xAxis(xTicks, xScale, margin.top + innerHeight, xLabel, config) +
    '\n' +
    yAxis(yTicks, yScale, margin.left, yLabel, config) +
    '\n' +
    (options.title ? titleText(config, options.title) : '') +
    '</svg>'
  );
}
