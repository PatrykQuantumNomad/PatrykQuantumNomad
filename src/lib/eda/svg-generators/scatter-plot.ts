/**
 * Scatter plot SVG generator with optional regression line and confidence band.
 * Produces valid SVG markup from bivariate data at build time.
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
import { linearRegression, mean, standardDeviation } from '../math/statistics';

export interface ScatterPlotOptions {
  data: { x: number; y: number }[];
  showRegression?: boolean;
  showConfidenceBand?: boolean;
  config?: Partial<PlotConfig>;
  title?: string;
  xLabel?: string;
  yLabel?: string;
}

export function generateScatterPlot(options: ScatterPlotOptions): string {
  const { data, showRegression = false, showConfidenceBand = false } = options;
  const config: PlotConfig = { ...DEFAULT_CONFIG, ...options.config };
  const { innerWidth, innerHeight } = innerDimensions(config);
  const { margin } = config;

  // Guard clause
  if (data.length < 2) {
    return (
      svgOpen(config, 'Insufficient data for scatter plot') +
      `<text x="${(config.width / 2).toFixed(2)}" y="${(config.height / 2).toFixed(2)}" text-anchor="middle" font-size="14" fill="${PALETTE.textSecondary}" font-family="${config.fontFamily}">Insufficient data</text>` +
      '</svg>'
    );
  }

  // Domains
  const xValues = data.map((d) => d.x);
  const yValues = data.map((d) => d.y);
  let [xMin, xMax] = extent(xValues) as [number, number];
  let [yMin, yMax] = extent(yValues) as [number, number];
  if (xMin === xMax) { xMin -= 1; xMax += 1; }
  if (yMin === yMax) { yMin -= 1; yMax += 1; }

  // Scales
  const xScale = scaleLinear()
    .domain([xMin, xMax])
    .range([margin.left, margin.left + innerWidth])
    .nice();
  const yScale = scaleLinear()
    .domain([yMin, yMax])
    .range([margin.top + innerHeight, margin.top])
    .nice();

  // Grid lines
  const xTicks = xScale.ticks(7);
  const yTicks = yScale.ticks(5);
  const grid =
    gridLinesH(yTicks, yScale, margin.left, margin.left + innerWidth) +
    '\n' +
    gridLinesV(xTicks, xScale, margin.top, margin.top + innerHeight);

  // Data points
  const points = data
    .map(
      (d) =>
        `<circle cx="${xScale(d.x).toFixed(2)}" cy="${yScale(d.y).toFixed(2)}" r="3.5" fill="${PALETTE.dataPrimary}" fill-opacity="0.6" />`,
    )
    .join('\n');

  // Clip path to constrain regression line / confidence band to plot area
  const clipId = `clip-scatter-${Math.random().toString(36).slice(2, 8)}`;
  const clipDef = `<defs><clipPath id="${clipId}"><rect x="${margin.left}" y="${margin.top}" width="${innerWidth}" height="${innerHeight}" /></clipPath></defs>`;

  // Optional regression line
  let regressionLine = '';
  let regressionAnnotation = '';
  let confidenceBand = '';

  if (showRegression || showConfidenceBand) {
    const reg = linearRegression(xValues, yValues);
    const f = (x: number) => reg.slope * x + reg.intercept;
    const xDomainMin = xScale.domain()[0];
    const xDomainMax = xScale.domain()[1];

    if (showRegression) {
      const x1 = xScale(xDomainMin).toFixed(2);
      const y1 = yScale(f(xDomainMin)).toFixed(2);
      const x2 = xScale(xDomainMax).toFixed(2);
      const y2 = yScale(f(xDomainMax)).toFixed(2);
      regressionLine = `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${PALETTE.dataSecondary}" stroke-width="2" />`;

      // R-squared annotation
      regressionAnnotation = `<text x="${(margin.left + innerWidth - 5).toFixed(2)}" y="${(margin.top + 15).toFixed(2)}" text-anchor="end" font-size="11" fill="${PALETTE.textSecondary}" font-family="${config.fontFamily}">R\u00B2 = ${reg.r2.toFixed(4)}</text>`;
    }

    if (showConfidenceBand) {
      // Standard error of estimate
      const n = data.length;
      const residuals = data.map((d) => d.y - f(d.x));
      const sse = residuals.reduce((s, r) => s + r * r, 0);
      const se = Math.sqrt(sse / (n - 2));
      const mx = mean(xValues);
      const ssx = xValues.reduce((s, x) => s + (x - mx) ** 2, 0);

      // Generate band path points (go forward along top, backward along bottom)
      const steps = 50;
      const stepSize = (xDomainMax - xDomainMin) / steps;
      const topPoints: string[] = [];
      const bottomPoints: string[] = [];

      for (let i = 0; i <= steps; i++) {
        const xi = xDomainMin + i * stepSize;
        const yHat = f(xi);
        const leverage = 1 / n + (xi - mx) ** 2 / ssx;
        const ci = 1.96 * se * Math.sqrt(leverage);
        topPoints.push(`${xScale(xi).toFixed(2)},${yScale(yHat + ci).toFixed(2)}`);
        bottomPoints.push(`${xScale(xi).toFixed(2)},${yScale(yHat - ci).toFixed(2)}`);
      }

      const pathData =
        'M' +
        topPoints.join(' L') +
        ' L' +
        bottomPoints.reverse().join(' L') +
        ' Z';
      confidenceBand = `<path d="${pathData}" fill="${PALETTE.dataSecondary}" fill-opacity="0.1" stroke="none" />`;
    }
  }

  // Assemble
  return (
    svgOpen(
      config,
      `Scatter plot${options.title ? ': ' + options.title : ''}`,
    ) +
    clipDef +
    '\n' +
    grid +
    '\n' +
    `<g clip-path="url(#${clipId})">` +
    confidenceBand +
    '\n' +
    regressionLine +
    '\n</g>\n' +
    points +
    '\n' +
    regressionAnnotation +
    '\n' +
    xAxis(
      xTicks,
      xScale,
      margin.top + innerHeight,
      options.xLabel ?? '',
      config,
    ) +
    '\n' +
    yAxis(yTicks, yScale, margin.left, options.yLabel ?? '', config) +
    '\n' +
    (options.title ? titleText(config, options.title) : '') +
    '</svg>'
  );
}
