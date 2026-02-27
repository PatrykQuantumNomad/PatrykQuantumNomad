/**
 * DOE mean/SD plot generator — multi-panel layout showing group means
 * for each factor level with a dashed grand mean reference line.
 * Produces valid SVG markup at build time with no client-side JS.
 */
import { scaleLinear } from 'd3-scale';
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

export interface DoeMeanPlotOptions {
  factors: {
    name: string;
    levels: { label: string; value: number }[];
  }[];
  grandMean: number;
  config?: Partial<PlotConfig>;
  title?: string;
  yLabel?: string;
}

export function generateDoeMeanPlot(options: DoeMeanPlotOptions): string {
  const { factors, grandMean } = options;
  const config: PlotConfig = { ...DEFAULT_CONFIG, ...options.config };
  const { innerWidth, innerHeight } = innerDimensions(config);
  const { margin } = config;

  if (!factors || factors.length === 0) {
    return (
      svgOpen(config, 'Insufficient data for DOE mean plot') +
      `<text x="${(config.width / 2).toFixed(2)}" y="${(config.height / 2).toFixed(2)}" text-anchor="middle" font-size="14" fill="${PALETTE.textSecondary}" font-family="${config.fontFamily}">Insufficient data</text></svg>`
    );
  }

  // Y-axis domain: focused on the range of means (NOT full data range)
  const allValues = factors.flatMap(f => f.levels.map(l => l.value));
  allValues.push(grandMean);
  const [yMin, yMax] = extent(allValues) as [number, number];
  const yPad = (yMax - yMin) * 0.15 || 1;

  const yScale = scaleLinear()
    .domain([yMin - yPad, yMax + yPad])
    .range([margin.top + innerHeight, margin.top]);

  // Panel layout: divide innerWidth into equal panels
  const nPanels = factors.length;
  const panelW = innerWidth / nPanels;
  const panelPad = panelW * 0.15;

  // Grid lines across full width
  const yTicks = yScale.ticks(6);
  const grid = gridLinesH(yTicks, yScale, margin.left, margin.left + innerWidth);

  // Grand mean dashed line across full width
  const grandMeanLine = `<line x1="${margin.left}" y1="${yScale(grandMean).toFixed(2)}" x2="${(margin.left + innerWidth)}" y2="${yScale(grandMean).toFixed(2)}" stroke="${PALETTE.dataSecondary}" stroke-width="1.5" stroke-dasharray="6,4" />`;
  const grandMeanLabel = `<text x="${(margin.left + innerWidth + 4).toFixed(2)}" y="${yScale(grandMean).toFixed(2)}" dy="0.35em" font-size="10" fill="${PALETTE.dataSecondary}" font-family="${config.fontFamily}">Grand Mean</text>`;

  // Render each panel
  const panels = factors.map((factor, fi) => {
    const panelX = margin.left + fi * panelW;
    const xStart = panelX + panelPad;
    const xEnd = panelX + panelW - panelPad;
    const nLevels = factor.levels.length;

    // Points and connecting line
    const points = factor.levels.map((level, li) => {
      const x = nLevels === 1 ? (xStart + xEnd) / 2 : xStart + (li / (nLevels - 1)) * (xEnd - xStart);
      const y = yScale(level.value);
      return { x, y, label: level.label };
    });

    const circles = points.map(p =>
      `<circle cx="${p.x.toFixed(2)}" cy="${p.y.toFixed(2)}" r="5" fill="${PALETTE.dataPrimary}" />`,
    ).join('\n');

    const line = points.length > 1
      ? `<polyline points="${points.map(p => `${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(' ')}" fill="none" stroke="${PALETTE.dataPrimary}" stroke-width="2" />`
      : '';

    // Level labels along bottom
    const labels = points.map(p =>
      `<text x="${p.x.toFixed(2)}" y="${(margin.top + innerHeight + 18).toFixed(2)}" text-anchor="middle" dy="0.35em" font-size="11" fill="${PALETTE.textSecondary}" font-family="${config.fontFamily}">${p.label}</text>`,
    ).join('\n');

    // Factor name below level labels
    const factorLabel = `<text x="${((xStart + xEnd) / 2).toFixed(2)}" y="${(margin.top + innerHeight + 38).toFixed(2)}" text-anchor="middle" font-size="12" font-weight="bold" fill="${PALETTE.text}" font-family="${config.fontFamily}">${factor.name}</text>`;

    // Panel separator (except first)
    const sep = fi > 0
      ? `<line x1="${panelX.toFixed(2)}" y1="${margin.top}" x2="${panelX.toFixed(2)}" y2="${(margin.top + innerHeight)}" stroke="${PALETTE.grid}" stroke-width="0.5" stroke-dasharray="2,4" />`
      : '';

    return [sep, circles, line, labels, factorLabel].join('\n');
  }).join('\n');

  // X axis line
  const xAxisLine = `<line x1="${margin.left}" y1="${(margin.top + innerHeight)}" x2="${(margin.left + innerWidth)}" y2="${(margin.top + innerHeight)}" stroke="${PALETTE.axis}" stroke-width="1" />`;

  return (
    svgOpen(config, `DOE Mean Plot${options.title ? ': ' + options.title : ''}`) +
    grid + '\n' +
    grandMeanLine + '\n' + grandMeanLabel + '\n' +
    panels + '\n' +
    xAxisLine + '\n' +
    yAxis(yTicks, yScale, margin.left, options.yLabel ?? '', config) + '\n' +
    (options.title ? titleText(config, options.title) : '') +
    '</svg>'
  );
}
