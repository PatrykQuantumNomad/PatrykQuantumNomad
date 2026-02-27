/**
 * Bihistogram SVG generator — back-to-back histogram for two groups.
 * Top bars extend upward from center, bottom bars extend downward.
 * Produces valid SVG markup at build time with no client-side JS.
 */
import { scaleLinear } from 'd3-scale';
import { bin, extent } from 'd3-array';
import {
  DEFAULT_CONFIG,
  PALETTE,
  svgOpen,
  xAxis,
  gridLinesH,
  innerDimensions,
  titleText,
  type PlotConfig,
} from './plot-base';

export interface BihistogramOptions {
  topData: number[];
  bottomData: number[];
  topLabel: string;
  bottomLabel: string;
  binCount?: number;
  config?: Partial<PlotConfig>;
  title?: string;
  xLabel?: string;
}

export function generateBihistogram(options: BihistogramOptions): string {
  const { topData, bottomData, binCount } = options;
  const config: PlotConfig = { ...DEFAULT_CONFIG, ...options.config };
  const { innerWidth, innerHeight } = innerDimensions(config);
  const { margin } = config;

  if (topData.length < 2 || bottomData.length < 2) {
    return (
      svgOpen(config, 'Insufficient data for bihistogram') +
      `<text x="${(config.width / 2).toFixed(2)}" y="${(config.height / 2).toFixed(2)}" text-anchor="middle" font-size="14" fill="${PALETTE.textSecondary}" font-family="${config.fontFamily}">Insufficient data</text></svg>`
    );
  }

  // Shared domain from both datasets
  const all = [...topData, ...bottomData];
  const [dMin, dMax] = extent(all) as [number, number];
  const thresholds = binCount ?? Math.ceil(Math.log2(all.length) + 1);

  const binGen = bin().domain([dMin, dMax]).thresholds(thresholds);
  const topBins = binGen(topData);
  const bottomBins = binGen(bottomData);

  // Shared y-scale: max frequency across both sets
  const maxFreq = Math.max(
    ...topBins.map(b => b.length),
    ...bottomBins.map(b => b.length),
  );
  const centerY = margin.top + innerHeight / 2;

  // x-scale: shared domain
  const xScale = scaleLinear()
    .domain([dMin, dMax])
    .range([margin.left, margin.left + innerWidth]);

  // y-scale: maps 0..maxFreq to 0..halfHeight pixels
  const halfHeight = innerHeight / 2;
  const yFreqScale = (freq: number): number => (freq / (maxFreq * 1.1)) * halfHeight;

  // Top bars (grow upward from center)
  const topBars = topBins.map(b => {
    const x = xScale(b.x0!);
    const w = xScale(b.x1!) - xScale(b.x0!);
    const h = yFreqScale(b.length);
    return `<rect x="${x.toFixed(2)}" y="${(centerY - h).toFixed(2)}" width="${Math.max(0, w - 1).toFixed(2)}" height="${h.toFixed(2)}" fill="${PALETTE.dataPrimary}" fill-opacity="0.7" stroke="${PALETTE.dataPrimary}" stroke-width="1" />`;
  }).join('\n');

  // Bottom bars (grow downward from center)
  const bottomBars = bottomBins.map(b => {
    const x = xScale(b.x0!);
    const w = xScale(b.x1!) - xScale(b.x0!);
    const h = yFreqScale(b.length);
    return `<rect x="${x.toFixed(2)}" y="${centerY.toFixed(2)}" width="${Math.max(0, w - 1).toFixed(2)}" height="${h.toFixed(2)}" fill="${PALETTE.dataSecondary}" fill-opacity="0.7" stroke="${PALETTE.dataSecondary}" stroke-width="1" />`;
  }).join('\n');

  // Center dividing line
  const centerLine = `<line x1="${margin.left}" y1="${centerY.toFixed(2)}" x2="${(margin.left + innerWidth)}" y2="${centerY.toFixed(2)}" stroke="${PALETTE.axis}" stroke-width="1" />`;

  // Y-axis frequency ticks for both halves
  const freqTicks = [0, Math.round(maxFreq * 0.25), Math.round(maxFreq * 0.5), Math.round(maxFreq * 0.75), maxFreq];
  const topGrid = freqTicks.filter(t => t > 0).map(t => {
    const py = centerY - yFreqScale(t);
    return `<line x1="${margin.left}" y1="${py.toFixed(2)}" x2="${(margin.left + innerWidth)}" y2="${py.toFixed(2)}" stroke="${PALETTE.grid}" stroke-width="0.5" stroke-dasharray="4,4" />
<text x="${(margin.left - 10).toFixed(2)}" y="${py.toFixed(2)}" text-anchor="end" dy="0.35em" font-size="11" fill="${PALETTE.textSecondary}" font-family="${config.fontFamily}">${t}</text>`;
  }).join('\n');

  const bottomGrid = freqTicks.filter(t => t > 0).map(t => {
    const py = centerY + yFreqScale(t);
    return `<line x1="${margin.left}" y1="${py.toFixed(2)}" x2="${(margin.left + innerWidth)}" y2="${py.toFixed(2)}" stroke="${PALETTE.grid}" stroke-width="0.5" stroke-dasharray="4,4" />
<text x="${(margin.left - 10).toFixed(2)}" y="${py.toFixed(2)}" text-anchor="end" dy="0.35em" font-size="11" fill="${PALETTE.textSecondary}" font-family="${config.fontFamily}">${t}</text>`;
  }).join('\n');

  // Group labels near center line
  const topLbl = `<text x="${(margin.left + 10).toFixed(2)}" y="${(centerY - 8).toFixed(2)}" font-size="12" font-weight="bold" fill="${PALETTE.dataPrimary}" font-family="${config.fontFamily}">${options.topLabel}</text>`;
  const bottomLbl = `<text x="${(margin.left + 10).toFixed(2)}" y="${(centerY + 18).toFixed(2)}" font-size="12" font-weight="bold" fill="${PALETTE.dataSecondary}" font-family="${config.fontFamily}">${options.bottomLabel}</text>`;

  // Y-axis line
  const yAxisLine = `<line x1="${margin.left}" y1="${margin.top}" x2="${margin.left}" y2="${(margin.top + innerHeight)}" stroke="${PALETTE.axis}" stroke-width="1" />`;

  // Y-axis label
  const yLabelEl = `<text x="${(margin.left - 45).toFixed(2)}" y="${(config.height / 2).toFixed(2)}" text-anchor="middle" font-size="12" fill="${PALETTE.text}" font-family="${config.fontFamily}" transform="rotate(-90,${(margin.left - 45).toFixed(2)},${(config.height / 2).toFixed(2)})">Frequency</text>`;

  // X-axis at bottom
  const xTicks = xScale.ticks(7);

  return (
    svgOpen(config, `Bihistogram${options.title ? ': ' + options.title : ''}`) +
    topGrid + '\n' + bottomGrid + '\n' +
    topBars + '\n' + bottomBars + '\n' +
    centerLine + '\n' +
    topLbl + '\n' + bottomLbl + '\n' +
    xAxis(xTicks, xScale, margin.top + innerHeight, options.xLabel ?? '', config) + '\n' +
    yAxisLine + '\n' + yLabelEl + '\n' +
    (options.title ? titleText(config, options.title) : '') +
    '</svg>'
  );
}
