/**
 * Autocorrelation plot SVG generator showing ACF values at each lag.
 * Renders vertical stems from zero, with 95% confidence bands at ±1.96/√N.
 * Produces valid SVG markup from sequential numeric data at build time.
 */
import { scaleLinear } from 'd3-scale';
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
import { autocorrelation } from '../math/statistics';

export interface AutocorrelationPlotOptions {
  data: number[];
  maxLag?: number;
  config?: Partial<PlotConfig>;
  title?: string;
  xLabel?: string;
  yLabel?: string;
}

export function generateAutocorrelationPlot(
  options: AutocorrelationPlotOptions,
): string {
  const { data } = options;
  const config: PlotConfig = { ...DEFAULT_CONFIG, ...options.config };
  const { innerWidth, innerHeight } = innerDimensions(config);
  const { margin } = config;

  // Guard clause
  if (data.length < 4) {
    return (
      svgOpen(config, 'Insufficient data for autocorrelation plot') +
      `<text x="${(config.width / 2).toFixed(2)}" y="${(config.height / 2).toFixed(2)}" text-anchor="middle" font-size="14" fill="${PALETTE.textSecondary}" font-family="${config.fontFamily}">Insufficient data</text>` +
      '</svg>'
    );
  }

  const maxLag = options.maxLag ?? Math.min(100, Math.floor(data.length / 4));
  const acf = autocorrelation(data, maxLag);

  // 95% confidence band: ±1.96/√N
  const confBand = 1.96 / Math.sqrt(data.length);

  // Scales
  const xScale = scaleLinear()
    .domain([0, maxLag])
    .range([margin.left, margin.left + innerWidth]);

  const yScale = scaleLinear()
    .domain([-1, 1])
    .range([margin.top + innerHeight, margin.top]);

  // Grid
  const xTicks = xScale.ticks(8);
  const yTicks = [-1, -0.5, 0, 0.5, 1];
  const grid =
    gridLinesH(yTicks, yScale, margin.left, margin.left + innerWidth) +
    '\n' +
    gridLinesV(xTicks, xScale, margin.top, margin.top + innerHeight);

  // Zero line
  const zeroY = yScale(0).toFixed(2);
  const zeroLine = `<line x1="${margin.left.toFixed(2)}" y1="${zeroY}" x2="${(margin.left + innerWidth).toFixed(2)}" y2="${zeroY}" stroke="${PALETTE.axis}" stroke-width="1" />`;

  // Confidence bands (shaded region)
  const confUpper = yScale(confBand).toFixed(2);
  const confLower = yScale(-confBand).toFixed(2);
  const confRect = `<rect x="${margin.left.toFixed(2)}" y="${confUpper}" width="${innerWidth.toFixed(2)}" height="${(parseFloat(confLower) - parseFloat(confUpper)).toFixed(2)}" fill="${PALETTE.dataSecondary}" fill-opacity="0.15" stroke="none" />`;
  const confLineUpper = `<line x1="${margin.left.toFixed(2)}" y1="${confUpper}" x2="${(margin.left + innerWidth).toFixed(2)}" y2="${confUpper}" stroke="${PALETTE.dataSecondary}" stroke-width="1" stroke-dasharray="6,3" />`;
  const confLineLower = `<line x1="${margin.left.toFixed(2)}" y1="${confLower}" x2="${(margin.left + innerWidth).toFixed(2)}" y2="${confLower}" stroke="${PALETTE.dataSecondary}" stroke-width="1" stroke-dasharray="6,3" />`;

  // Stem plot: vertical lines from y=0 to acf[k] with small circles at tips
  const stems = acf
    .map((r, k) => {
      if (k === 0) return ''; // Skip lag 0 (always 1.0)
      const cx = xScale(k).toFixed(2);
      const cy = yScale(r).toFixed(2);
      const stemLine = `<line x1="${cx}" y1="${zeroY}" x2="${cx}" y2="${cy}" stroke="${PALETTE.dataPrimary}" stroke-width="1.5" />`;
      const dot = `<circle cx="${cx}" cy="${cy}" r="2.5" fill="${PALETTE.dataPrimary}" />`;
      return stemLine + '\n' + dot;
    })
    .filter(Boolean)
    .join('\n');

  const xLabel = options.xLabel ?? 'Lag';
  const yLabel = options.yLabel ?? 'Autocorrelation';

  return (
    svgOpen(
      config,
      `Autocorrelation plot${options.title ? ': ' + options.title : ''}`,
    ) +
    grid +
    '\n' +
    confRect +
    '\n' +
    confLineUpper +
    '\n' +
    confLineLower +
    '\n' +
    zeroLine +
    '\n' +
    stems +
    '\n' +
    xAxis(xTicks, xScale, margin.top + innerHeight, xLabel, config) +
    '\n' +
    yAxis(yTicks, yScale, margin.left, yLabel, config) +
    '\n' +
    (options.title ? titleText(config, options.title) : '') +
    '</svg>'
  );
}
