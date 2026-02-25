/**
 * Bar plot SVG generator for mean plots, standard deviation plots, and DOE plots.
 * Produces valid SVG markup from categorical data arrays.
 */
import { scaleLinear, scaleBand } from 'd3-scale';
import {
  DEFAULT_CONFIG,
  PALETTE,
  svgOpen,
  yAxis,
  gridLinesH,
  innerDimensions,
  titleText,
  type PlotConfig,
} from './plot-base';

export interface BarPlotOptions {
  categories: { label: string; value: number; group?: string }[];
  config?: Partial<PlotConfig>;
  title?: string;
  xLabel?: string;
  yLabel?: string;
  showErrorBars?: boolean;
  errorValues?: number[];
}

export function generateBarPlot(options: BarPlotOptions): string {
  const { categories, showErrorBars = false, errorValues } = options;
  const config: PlotConfig = { ...DEFAULT_CONFIG, ...options.config };
  const { innerWidth, innerHeight } = innerDimensions(config);
  const { margin } = config;

  // Guard clause
  if (!categories || categories.length === 0) {
    return (
      svgOpen(config, 'Insufficient data for bar plot') +
      `<text x="${(config.width / 2).toFixed(2)}" y="${(config.height / 2).toFixed(2)}" text-anchor="middle" font-size="14" fill="${PALETTE.textSecondary}" font-family="${config.fontFamily}">Insufficient data</text>` +
      '</svg>'
    );
  }

  const maxVal = Math.max(...categories.map((c) => c.value));
  const yDomainMax = maxVal * 1.1 || 1;

  // Scales
  const xScale = scaleBand()
    .domain(categories.map((c) => c.label))
    .range([margin.left, margin.left + innerWidth])
    .padding(0.2);

  const yScale = scaleLinear()
    .domain([0, yDomainMax])
    .range([margin.top + innerHeight, margin.top]);

  const bandWidth = xScale.bandwidth();

  // Detect groups for coloring
  const uniqueGroups = [...new Set(categories.map((c) => c.group).filter(Boolean))];
  const groupColors = [PALETTE.dataPrimary, PALETTE.dataSecondary, PALETTE.dataTertiary];

  // Bars
  const bars = categories
    .map((c, i) => {
      const x = xScale(c.label) ?? 0;
      const y = yScale(c.value);
      const h = yScale(0) - yScale(c.value);
      const groupIdx = c.group ? uniqueGroups.indexOf(c.group) : 0;
      const color = groupColors[groupIdx % groupColors.length];

      let bar = `<rect x="${x.toFixed(2)}" y="${y.toFixed(2)}" width="${bandWidth.toFixed(2)}" height="${h.toFixed(2)}" fill="${color}" fill-opacity="0.8" stroke="${color}" stroke-width="1" />`;

      // Error bars
      if (showErrorBars && errorValues && errorValues[i] !== undefined) {
        const errVal = errorValues[i];
        const cx = x + bandWidth / 2;
        const capW = bandWidth * 0.3;
        const errTop = yScale(c.value + errVal);
        const errBot = yScale(c.value - errVal);
        bar += `\n<line x1="${cx.toFixed(2)}" y1="${errTop.toFixed(2)}" x2="${cx.toFixed(2)}" y2="${errBot.toFixed(2)}" stroke="${PALETTE.axis}" stroke-width="1" />`;
        bar += `\n<line x1="${(cx - capW / 2).toFixed(2)}" y1="${errTop.toFixed(2)}" x2="${(cx + capW / 2).toFixed(2)}" y2="${errTop.toFixed(2)}" stroke="${PALETTE.axis}" stroke-width="1" />`;
        bar += `\n<line x1="${(cx - capW / 2).toFixed(2)}" y1="${errBot.toFixed(2)}" x2="${(cx + capW / 2).toFixed(2)}" y2="${errBot.toFixed(2)}" stroke="${PALETTE.axis}" stroke-width="1" />`;
      }

      return bar;
    })
    .join('\n');

  // X axis labels
  const xLabels = categories
    .map((c) => {
      const cx = (xScale(c.label) ?? 0) + bandWidth / 2;
      return `<text x="${cx.toFixed(2)}" y="${(margin.top + innerHeight + 18).toFixed(2)}" text-anchor="middle" dy="0.35em" font-size="11" fill="${PALETTE.textSecondary}" font-family="${config.fontFamily}">${c.label}</text>`;
    })
    .join('\n');

  const xAxisLine = `<line x1="${margin.left.toFixed(2)}" y1="${(margin.top + innerHeight).toFixed(2)}" x2="${(margin.left + innerWidth).toFixed(2)}" y2="${(margin.top + innerHeight).toFixed(2)}" stroke="${PALETTE.axis}" stroke-width="1" />`;

  const xLabelEl = options.xLabel
    ? `<text x="${(config.width / 2).toFixed(2)}" y="${(margin.top + innerHeight + 40).toFixed(2)}" text-anchor="middle" font-size="12" fill="${PALETTE.text}" font-family="${config.fontFamily}">${options.xLabel}</text>`
    : '';

  // Y axis
  const yTicks = yScale.ticks(5);

  return (
    svgOpen(
      config,
      `Bar plot${options.title ? ': ' + options.title : ''}`,
    ) +
    gridLinesH(yTicks, yScale, margin.left, margin.left + innerWidth) +
    '\n' +
    bars +
    '\n' +
    xAxisLine +
    '\n' +
    xLabels +
    '\n' +
    xLabelEl +
    '\n' +
    yAxis(yTicks, yScale, margin.left, options.yLabel ?? '', config) +
    '\n' +
    (options.title ? titleText(config, options.title) : '') +
    '</svg>'
  );
}
