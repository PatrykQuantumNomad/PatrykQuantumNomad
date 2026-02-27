/**
 * Interaction plot SVG generator — shows factor interactions in DOE analysis.
 * One line per Factor B level, connecting means across Factor A levels.
 * Non-parallel lines indicate interaction between factors.
 * Produces valid SVG markup at build time with no client-side JS.
 */
import { scaleLinear, scalePoint } from 'd3-scale';
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

export interface InteractionPlotOptions {
  factorA: { label: string; levels: string[] };
  factorB: { label: string; levels: string[] };
  means: { aLevel: string; bLevel: string; mean: number }[];
  config?: Partial<PlotConfig>;
  title?: string;
  yLabel?: string;
}

export function generateInteractionPlot(options: InteractionPlotOptions): string {
  const { factorA, factorB, means } = options;
  const config: PlotConfig = { ...DEFAULT_CONFIG, ...options.config };
  const { innerWidth, innerHeight } = innerDimensions(config);
  const { margin } = config;

  if (!means || means.length === 0) {
    return (
      svgOpen(config, 'Insufficient data for interaction plot') +
      `<text x="${(config.width / 2).toFixed(2)}" y="${(config.height / 2).toFixed(2)}" text-anchor="middle" font-size="14" fill="${PALETTE.textSecondary}" font-family="${config.fontFamily}">Insufficient data</text></svg>`
    );
  }

  // Scales
  const xScale = scalePoint()
    .domain(factorA.levels)
    .range([margin.left + innerWidth * 0.1, margin.left + innerWidth * 0.9])
    .padding(0);

  const allMeans = means.map(m => m.mean);
  const [yMin, yMax] = extent(allMeans) as [number, number];
  const yPad = (yMax - yMin) * 0.15 || 1;

  const yScale = scaleLinear()
    .domain([yMin - yPad, yMax + yPad])
    .range([margin.top + innerHeight, margin.top]);

  const yTicks = yScale.ticks(6);
  const groupColors = [PALETTE.dataPrimary, PALETTE.dataSecondary, PALETTE.dataTertiary];

  // Lines per Factor B level
  const lines = factorB.levels.map((bLevel, bi) => {
    const color = groupColors[bi % groupColors.length];
    const pts = factorA.levels.map(aLevel => {
      const m = means.find(d => d.aLevel === aLevel && d.bLevel === bLevel);
      if (!m) return null;
      const x = xScale(aLevel) ?? 0;
      return { x, y: yScale(m.mean) };
    }).filter((p): p is { x: number; y: number } => p !== null);

    const circles = pts.map(p =>
      `<circle cx="${p.x.toFixed(2)}" cy="${p.y.toFixed(2)}" r="5" fill="${color}" />`,
    ).join('\n');

    const polyline = pts.length > 1
      ? `<polyline points="${pts.map(p => `${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(' ')}" fill="none" stroke="${color}" stroke-width="2" />`
      : '';

    return polyline + '\n' + circles;
  }).join('\n');

  // Legend in upper-right
  const legendX = margin.left + innerWidth - 120;
  const legendY = margin.top + 10;
  const legend = factorB.levels.map((level, i) => {
    const color = groupColors[i % groupColors.length];
    const y = legendY + i * 18;
    return `<circle cx="${legendX}" cy="${y}" r="4" fill="${color}" /><text x="${(legendX + 10).toFixed(2)}" y="${y.toFixed(2)}" dy="0.35em" font-size="11" fill="${PALETTE.text}" font-family="${config.fontFamily}">${factorB.label} = ${level}</text>`;
  }).join('\n');

  // X axis labels
  const xLabels = factorA.levels.map(level => {
    const x = xScale(level) ?? 0;
    return `<text x="${x.toFixed(2)}" y="${(margin.top + innerHeight + 18).toFixed(2)}" text-anchor="middle" dy="0.35em" font-size="11" fill="${PALETTE.textSecondary}" font-family="${config.fontFamily}">${level}</text>`;
  }).join('\n');

  const xAxisLine = `<line x1="${margin.left}" y1="${(margin.top + innerHeight)}" x2="${(margin.left + innerWidth)}" y2="${(margin.top + innerHeight)}" stroke="${PALETTE.axis}" stroke-width="1" />`;
  const xLabelEl = `<text x="${(config.width / 2).toFixed(2)}" y="${(margin.top + innerHeight + 40).toFixed(2)}" text-anchor="middle" font-size="12" fill="${PALETTE.text}" font-family="${config.fontFamily}">${factorA.label}</text>`;

  return (
    svgOpen(config, `Interaction Plot${options.title ? ': ' + options.title : ''}`) +
    gridLinesH(yTicks, yScale, margin.left, margin.left + innerWidth) + '\n' +
    lines + '\n' +
    legend + '\n' +
    xAxisLine + '\n' + xLabels + '\n' + xLabelEl + '\n' +
    yAxis(yTicks, yScale, margin.left, options.yLabel ?? '', config) + '\n' +
    (options.title ? titleText(config, options.title) : '') +
    '</svg>'
  );
}
