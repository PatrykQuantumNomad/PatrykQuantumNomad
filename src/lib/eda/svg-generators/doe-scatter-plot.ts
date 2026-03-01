/**
 * DOE scatter plot generator — multi-panel layout showing raw response
 * values for each level of each factor, with a dashed grand mean reference line.
 * Produces valid SVG markup at build time with no client-side JS.
 *
 * Based on NIST/SEMATECH Section 1.3.3.11.
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

export interface DoeScatterPlotOptions {
  factors: {
    name: string;
    levels: { label: string; values: number[] }[];
  }[];
  grandMean: number;
  config?: Partial<PlotConfig>;
  title?: string;
  yLabel?: string;
}

export function generateDoeScatterPlot(options: DoeScatterPlotOptions): string {
  const { factors, grandMean } = options;
  const config: PlotConfig = { ...DEFAULT_CONFIG, ...options.config };
  const { innerWidth, innerHeight } = innerDimensions(config);
  const { margin } = config;

  if (!factors || factors.length === 0) {
    return (
      svgOpen(config, 'Insufficient data for DOE scatter plot') +
      `<text x="${(config.width / 2).toFixed(2)}" y="${(config.height / 2).toFixed(2)}" text-anchor="middle" font-size="14" fill="${PALETTE.textSecondary}" font-family="${config.fontFamily}">Insufficient data</text></svg>`
    );
  }

  // Y-axis domain: full range of all response values
  const allValues = factors.flatMap(f => f.levels.flatMap(l => l.values));
  allValues.push(grandMean);
  const [yMin, yMax] = extent(allValues) as [number, number];
  const yPad = (yMax - yMin) * 0.1 || 1;

  const yScale = scaleLinear()
    .domain([yMin - yPad, yMax + yPad])
    .range([margin.top + innerHeight, margin.top]);

  // Panel layout: divide innerWidth into equal panels
  const nPanels = factors.length;
  const panelW = innerWidth / nPanels;
  const panelPad = panelW * 0.12;

  // Grid lines across full width
  const yTicks = yScale.ticks(6);
  const grid = gridLinesH(yTicks, yScale, margin.left, margin.left + innerWidth);

  // Grand mean solid line across full width
  const grandMeanLine = `<line x1="${margin.left}" y1="${yScale(grandMean).toFixed(2)}" x2="${(margin.left + innerWidth)}" y2="${yScale(grandMean).toFixed(2)}" stroke="${PALETTE.dataSecondary}" stroke-width="1.5" />`;
  const grandMeanLabel = `<text x="${(margin.left + innerWidth + 4).toFixed(2)}" y="${yScale(grandMean).toFixed(2)}" dy="0.35em" font-size="9" fill="${PALETTE.dataSecondary}" font-family="${config.fontFamily}">Mean</text>`;

  // Render each panel
  const panels = factors.map((factor, fi) => {
    const panelX = margin.left + fi * panelW;
    const xStart = panelX + panelPad;
    const xEnd = panelX + panelW - panelPad;
    const nLevels = factor.levels.length;

    // For each level, compute x position then scatter points with small jitter
    const levelGroups = factor.levels.map((level, li) => {
      const cx = nLevels === 1 ? (xStart + xEnd) / 2 : xStart + (li / (nLevels - 1)) * (xEnd - xStart);
      // Scatter points vertically (y by value), horizontally with small spread
      const jitterSpread = Math.min(panelW * 0.06, 8);
      const dots = level.values.map((v, vi) => {
        // Deterministic horizontal jitter based on index
        const jitter = level.values.length <= 1 ? 0 :
          (vi / (level.values.length - 1) - 0.5) * 2 * jitterSpread;
        const x = cx + jitter;
        const y = yScale(v);
        return `<circle cx="${x.toFixed(2)}" cy="${y.toFixed(2)}" r="3.5" fill="${PALETTE.dataPrimary}" opacity="0.8" />`;
      });
      return dots.join('\n');
    });

    // Level labels along bottom
    const labels = factor.levels.map((level, li) => {
      const cx = nLevels === 1 ? (xStart + xEnd) / 2 : xStart + (li / (nLevels - 1)) * (xEnd - xStart);
      return `<text x="${cx.toFixed(2)}" y="${(margin.top + innerHeight + 14).toFixed(2)}" text-anchor="middle" dy="0.35em" font-size="9" fill="${PALETTE.textSecondary}" font-family="${config.fontFamily}">${level.label}</text>`;
    });

    // Factor name below level labels
    const factorLabel = `<text x="${((xStart + xEnd) / 2).toFixed(2)}" y="${(margin.top + innerHeight + 34).toFixed(2)}" text-anchor="middle" font-size="11" font-weight="bold" fill="${PALETTE.text}" font-family="${config.fontFamily}">${factor.name}</text>`;

    // Panel separator (except first)
    const sep = fi > 0
      ? `<line x1="${panelX.toFixed(2)}" y1="${margin.top}" x2="${panelX.toFixed(2)}" y2="${(margin.top + innerHeight)}" stroke="${PALETTE.grid}" stroke-width="0.5" stroke-dasharray="2,4" />`
      : '';

    return [sep, ...levelGroups, ...labels, factorLabel].join('\n');
  }).join('\n');

  // X axis line
  const xAxisLine = `<line x1="${margin.left}" y1="${(margin.top + innerHeight)}" x2="${(margin.left + innerWidth)}" y2="${(margin.top + innerHeight)}" stroke="${PALETTE.axis}" stroke-width="1" />`;

  return (
    svgOpen(config, `DOE Scatter Plot${options.title ? ': ' + options.title : ''}`) +
    grid + '\n' +
    grandMeanLine + '\n' + grandMeanLabel + '\n' +
    panels + '\n' +
    xAxisLine + '\n' +
    yAxis(yTicks, yScale, margin.left, options.yLabel ?? '', config) + '\n' +
    (options.title ? titleText(config, options.title) : '') +
    '</svg>'
  );
}
