/**
 * Block plot SVG generator — shows mean response for each block
 * with separate symbols/colors for each group, connected by lines.
 * Produces valid SVG markup at build time with no client-side JS.
 */
import { scaleLinear, scaleBand } from 'd3-scale';
import { extent } from 'd3-array';
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

export interface BlockPlotOptions {
  blocks: {
    label: string;
    values: { group: string; mean: number }[];
  }[];
  config?: Partial<PlotConfig>;
  title?: string;
  xLabel?: string;
  yLabel?: string;
}

export function generateBlockPlot(options: BlockPlotOptions): string {
  const { blocks } = options;
  const config: PlotConfig = { ...DEFAULT_CONFIG, ...options.config };
  const { innerWidth, innerHeight } = innerDimensions(config);
  const { margin } = config;

  if (!blocks || blocks.length === 0) {
    return (
      svgOpen(config, 'Insufficient data for block plot') +
      `<text x="${(config.width / 2).toFixed(2)}" y="${(config.height / 2).toFixed(2)}" text-anchor="middle" font-size="14" fill="${PALETTE.textSecondary}" font-family="${config.fontFamily}">Insufficient data</text></svg>`
    );
  }

  // Extract unique groups
  const groups = [...new Set(blocks.flatMap(b => b.values.map(v => v.group)))];
  const groupColors = [PALETTE.dataPrimary, PALETTE.dataSecondary, PALETTE.dataTertiary];

  // Scales
  const xScale = scaleBand()
    .domain(blocks.map(b => b.label))
    .range([margin.left, margin.left + innerWidth])
    .padding(0.2);

  const allMeans = blocks.flatMap(b => b.values.map(v => v.mean));
  const [yMin, yMax] = extent(allMeans) as [number, number];
  const yPad = (yMax - yMin) * 0.1 || 1;

  const yScale = scaleLinear()
    .domain([yMin - yPad, yMax + yPad])
    .range([margin.top + innerHeight, margin.top]);

  const bandWidth = xScale.bandwidth();
  const yTicks = yScale.ticks(6);

  // Points and connecting lines per group
  const groupElements = groups.map((group, gi) => {
    const color = groupColors[gi % groupColors.length];
    const pts = blocks.map(b => {
      const v = b.values.find(val => val.group === group);
      if (!v) return null;
      const cx = (xScale(b.label) ?? 0) + bandWidth / 2;
      return { x: cx, y: yScale(v.mean) };
    }).filter((p): p is { x: number; y: number } => p !== null);

    const circles = pts.map(p =>
      `<circle cx="${p.x.toFixed(2)}" cy="${p.y.toFixed(2)}" r="4" fill="${color}" />`,
    ).join('\n');

    const line = pts.length > 1
      ? `<polyline points="${pts.map(p => `${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(' ')}" fill="none" stroke="${color}" stroke-width="2" />`
      : '';

    return line + '\n' + circles;
  }).join('\n');

  // Legend in upper-right
  const legendX = margin.left + innerWidth - 100;
  const legendY = margin.top + 10;
  const legend = groups.map((group, gi) => {
    const color = groupColors[gi % groupColors.length];
    const y = legendY + gi * 18;
    return `<circle cx="${legendX}" cy="${y}" r="4" fill="${color}" /><text x="${(legendX + 10).toFixed(2)}" y="${y.toFixed(2)}" dy="0.35em" font-size="11" fill="${PALETTE.text}" font-family="${config.fontFamily}">${group}</text>`;
  }).join('\n');

  // X axis labels
  const xLabels = blocks.map(b => {
    const cx = (xScale(b.label) ?? 0) + bandWidth / 2;
    return `<text x="${cx.toFixed(2)}" y="${(margin.top + innerHeight + 18).toFixed(2)}" text-anchor="middle" dy="0.35em" font-size="11" fill="${PALETTE.textSecondary}" font-family="${config.fontFamily}">${b.label}</text>`;
  }).join('\n');

  const xAxisLine = `<line x1="${margin.left}" y1="${(margin.top + innerHeight)}" x2="${(margin.left + innerWidth)}" y2="${(margin.top + innerHeight)}" stroke="${PALETTE.axis}" stroke-width="1" />`;
  const xLabelEl = options.xLabel
    ? `<text x="${(config.width / 2).toFixed(2)}" y="${(margin.top + innerHeight + 40).toFixed(2)}" text-anchor="middle" font-size="12" fill="${PALETTE.text}" font-family="${config.fontFamily}">${options.xLabel}</text>`
    : '';

  return (
    svgOpen(config, `Block Plot${options.title ? ': ' + options.title : ''}`) +
    gridLinesH(yTicks, yScale, margin.left, margin.left + innerWidth) + '\n' +
    groupElements + '\n' +
    legend + '\n' +
    xAxisLine + '\n' + xLabels + '\n' + xLabelEl + '\n' +
    yAxis(yTicks, yScale, margin.left, options.yLabel ?? '', config) + '\n' +
    (options.title ? titleText(config, options.title) : '') +
    '</svg>'
  );
}
