/**
 * Box plot SVG generator with quartile markers, median, whiskers, and outlier dots.
 * Produces valid SVG markup from grouped numeric data arrays.
 */
import { scaleLinear, scaleBand } from 'd3-scale';
import { quantile, extent } from 'd3-array';
import {
  DEFAULT_CONFIG,
  PALETTE,
  svgOpen,
  xAxis,
  yAxis,
  gridLinesH,
  innerDimensions,
  titleText,
  type PlotConfig,
} from './plot-base';

export interface BoxPlotOptions {
  groups: { label: string; values: number[] }[];
  config?: Partial<PlotConfig>;
  title?: string;
  xLabel?: string;
  yLabel?: string;
  showOutliers?: boolean;
}

export function generateBoxPlot(options: BoxPlotOptions): string {
  const { groups, showOutliers = true } = options;
  const config: PlotConfig = { ...DEFAULT_CONFIG, ...options.config };
  const { innerWidth, innerHeight } = innerDimensions(config);
  const { margin } = config;

  // Guard clause
  if (!groups || groups.length === 0 || groups.every((g) => g.values.length === 0)) {
    return (
      svgOpen(config, 'Insufficient data for box plot') +
      `<text x="${(config.width / 2).toFixed(2)}" y="${(config.height / 2).toFixed(2)}" text-anchor="middle" font-size="14" fill="${PALETTE.textSecondary}" font-family="${config.fontFamily}">Insufficient data</text>` +
      '</svg>'
    );
  }

  // Compute stats for each group
  const stats = groups.map((g) => {
    const sorted = [...g.values].sort((a, b) => a - b);
    const q1 = quantile(sorted, 0.25)!;
    const q2 = quantile(sorted, 0.5)!;
    const q3 = quantile(sorted, 0.75)!;
    const iqr = q3 - q1;
    const lowerWhisker = Math.max(sorted[0], q1 - 1.5 * iqr);
    const upperWhisker = Math.min(sorted[sorted.length - 1], q3 + 1.5 * iqr);
    const outliers = sorted.filter((v) => v < lowerWhisker || v > upperWhisker);
    return { label: g.label, q1, q2, q3, iqr, lowerWhisker, upperWhisker, outliers };
  });

  // All values for Y domain
  const allValues = groups.flatMap((g) => g.values);
  const [yMin, yMax] = extent(allValues) as [number, number];
  const yPadding = (yMax - yMin) * 0.1 || 1;

  // Scales
  const xScale = scaleBand()
    .domain(groups.map((g) => g.label))
    .range([margin.left, margin.left + innerWidth])
    .padding(0.3);

  const yScale = scaleLinear()
    .domain([yMin - yPadding, yMax + yPadding])
    .range([margin.top + innerHeight, margin.top]);

  const bandWidth = xScale.bandwidth();

  // Render boxes
  const boxes = stats
    .map((s) => {
      const cx = (xScale(s.label) ?? 0) + bandWidth / 2;
      const boxX = (xScale(s.label) ?? 0);
      const boxY = yScale(s.q3);
      const boxH = yScale(s.q1) - yScale(s.q3);

      // Box
      const box = `<rect x="${boxX.toFixed(2)}" y="${boxY.toFixed(2)}" width="${bandWidth.toFixed(2)}" height="${boxH.toFixed(2)}" fill="${PALETTE.dataPrimary}" fill-opacity="0.3" stroke="${PALETTE.dataPrimary}" stroke-width="1" />`;

      // Median line
      const median = `<line x1="${boxX.toFixed(2)}" y1="${yScale(s.q2).toFixed(2)}" x2="${(boxX + bandWidth).toFixed(2)}" y2="${yScale(s.q2).toFixed(2)}" stroke="${PALETTE.dataPrimary}" stroke-width="2" />`;

      // Whiskers (vertical lines)
      const capW = bandWidth * 0.4;
      const lowerWhiskerLine = `<line x1="${cx.toFixed(2)}" y1="${yScale(s.q1).toFixed(2)}" x2="${cx.toFixed(2)}" y2="${yScale(s.lowerWhisker).toFixed(2)}" stroke="${PALETTE.axis}" stroke-width="1" />`;
      const upperWhiskerLine = `<line x1="${cx.toFixed(2)}" y1="${yScale(s.q3).toFixed(2)}" x2="${cx.toFixed(2)}" y2="${yScale(s.upperWhisker).toFixed(2)}" stroke="${PALETTE.axis}" stroke-width="1" />`;

      // Whisker caps
      const lowerCap = `<line x1="${(cx - capW / 2).toFixed(2)}" y1="${yScale(s.lowerWhisker).toFixed(2)}" x2="${(cx + capW / 2).toFixed(2)}" y2="${yScale(s.lowerWhisker).toFixed(2)}" stroke="${PALETTE.axis}" stroke-width="1" />`;
      const upperCap = `<line x1="${(cx - capW / 2).toFixed(2)}" y1="${yScale(s.upperWhisker).toFixed(2)}" x2="${(cx + capW / 2).toFixed(2)}" y2="${yScale(s.upperWhisker).toFixed(2)}" stroke="${PALETTE.axis}" stroke-width="1" />`;

      // Outliers
      let outlierDots = '';
      if (showOutliers && s.outliers.length > 0) {
        outlierDots = s.outliers
          .map(
            (v) =>
              `<circle cx="${cx.toFixed(2)}" cy="${yScale(v).toFixed(2)}" r="3" fill="${PALETTE.dataSecondary}" fill-opacity="0.8" />`,
          )
          .join('\n');
      }

      return [box, median, lowerWhiskerLine, upperWhiskerLine, lowerCap, upperCap, outlierDots].join('\n');
    })
    .join('\n');

  // X axis labels (manually since scaleBand doesn't have ticks())
  const xLabels = groups
    .map((g) => {
      const cx = (xScale(g.label) ?? 0) + bandWidth / 2;
      return `<text x="${cx.toFixed(2)}" y="${(margin.top + innerHeight + 18).toFixed(2)}" text-anchor="middle" dy="0.35em" font-size="11" fill="${PALETTE.textSecondary}" font-family="${config.fontFamily}">${g.label}</text>`;
    })
    .join('\n');

  const xAxisLine = `<line x1="${margin.left.toFixed(2)}" y1="${(margin.top + innerHeight).toFixed(2)}" x2="${(margin.left + innerWidth).toFixed(2)}" y2="${(margin.top + innerHeight).toFixed(2)}" stroke="${PALETTE.axis}" stroke-width="1" />`;

  const xLabelEl = options.xLabel
    ? `<text x="${(config.width / 2).toFixed(2)}" y="${(margin.top + innerHeight + 40).toFixed(2)}" text-anchor="middle" font-size="12" fill="${PALETTE.text}" font-family="${config.fontFamily}">${options.xLabel}</text>`
    : '';

  // Y axis ticks
  const yTicks = yScale.ticks(6);

  return (
    svgOpen(
      config,
      `Box plot${options.title ? ': ' + options.title : ''}`,
    ) +
    gridLinesH(yTicks, yScale, margin.left, margin.left + innerWidth) +
    '\n' +
    boxes +
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
