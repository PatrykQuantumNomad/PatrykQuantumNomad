/**
 * Histogram SVG generator with configurable bins and optional KDE overlay.
 * Produces valid SVG markup from numeric data arrays at build time.
 */
import { scaleLinear } from 'd3-scale';
import { bin, extent, range } from 'd3-array';
import { area, curveBasis } from 'd3-shape';
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
import { kde, silvermanBandwidth } from '../math/statistics';

export interface HistogramOptions {
  data: number[];
  binCount?: number;
  showKDE?: boolean;
  showUniformPDF?: boolean;
  uniformRange?: [number, number];
  config?: Partial<PlotConfig>;
  title?: string;
  xLabel?: string;
  yLabel?: string;
}

export function generateHistogram(options: HistogramOptions): string {
  const { data, binCount, showKDE = false, showUniformPDF = false, uniformRange } = options;
  const config: PlotConfig = { ...DEFAULT_CONFIG, ...options.config };
  const { innerWidth, innerHeight } = innerDimensions(config);
  const { margin } = config;

  // Guard clause
  if (data.length < 2) {
    return (
      svgOpen(config, 'Insufficient data for histogram') +
      `<text x="${(config.width / 2).toFixed(2)}" y="${(config.height / 2).toFixed(2)}" text-anchor="middle" font-size="14" fill="${PALETTE.textSecondary}" font-family="${config.fontFamily}">Insufficient data</text>` +
      '</svg>'
    );
  }

  // Compute bins
  const [dataMin, dataMax] = extent(data) as [number, number];
  const domainMin = dataMin === dataMax ? dataMin - 1 : dataMin;
  const domainMax = dataMin === dataMax ? dataMax + 1 : dataMax;
  const thresholds = binCount ?? Math.ceil(Math.log2(data.length) + 1);
  const binGen = bin().domain([domainMin, domainMax]).thresholds(thresholds);
  const bins = binGen(data);

  // Scales
  const xScale = scaleLinear()
    .domain([domainMin, domainMax])
    .range([margin.left, margin.left + innerWidth]);
  const yMax = Math.max(...bins.map((b) => b.length));
  const yScale = scaleLinear()
    .domain([0, yMax * 1.1])
    .range([margin.top + innerHeight, margin.top]);

  // Bars
  const bars = bins
    .map((b) => {
      const x = xScale(b.x0!);
      const w = xScale(b.x1!) - xScale(b.x0!);
      const y = yScale(b.length);
      const h = yScale(0) - yScale(b.length);
      return `<rect x="${x.toFixed(2)}" y="${y.toFixed(2)}" width="${Math.max(0, w - 1).toFixed(2)}" height="${h.toFixed(2)}" fill="${PALETTE.dataPrimary}" fill-opacity="0.7" stroke="${PALETTE.dataPrimary}" stroke-width="1" />`;
    })
    .join('\n');

  // Optional KDE overlay
  let kdeOverlay = '';
  if (showKDE && data.length >= 3) {
    const bw = silvermanBandwidth(data);
    const step = (domainMax - domainMin) / 100;
    const kdePoints = range(domainMin, domainMax + step, step);
    const kdeValues = kde(data, bw, kdePoints);
    const kdeMaxVal = Math.max(...kdeValues);
    if (kdeMaxVal > 0) {
      const kdeYScale = scaleLinear()
        .domain([0, kdeMaxVal])
        .range([margin.top + innerHeight, margin.top]);
      const areaGen = area<[number, number]>()
        .x((d) => xScale(d[0]))
        .y0(yScale(0))
        .y1((d) => kdeYScale(d[1]))
        .curve(curveBasis);
      const paired: [number, number][] = kdePoints.map((x, i) => [
        x,
        kdeValues[i],
      ]);
      const kdePath = areaGen(paired);
      if (kdePath) {
        kdeOverlay = `<path d="${kdePath}" fill="${PALETTE.dataSecondary}" fill-opacity="0.2" stroke="${PALETTE.dataSecondary}" stroke-width="2" />`;
      }
    }
  }

  // Optional uniform PDF overlay
  let uniformOverlay = '';
  if (showUniformPDF) {
    const [rangeMin, rangeMax] = uniformRange ?? [domainMin, domainMax];
    const rangeWidth = rangeMax - rangeMin;
    // Expected frequency per bin: n * binWidth / range
    const binWidth =
      bins.length > 0
        ? bins[0].x1! - bins[0].x0!
        : (domainMax - domainMin) / thresholds;
    const expectedFreq = (data.length * binWidth) / rangeWidth;
    const y = yScale(expectedFreq);
    const x1 = xScale(rangeMin);
    const x2 = xScale(rangeMax);
    uniformOverlay = `<line x1="${x1.toFixed(2)}" y1="${y.toFixed(2)}" x2="${x2.toFixed(2)}" y2="${y.toFixed(2)}" stroke="${PALETTE.dataSecondary}" stroke-width="2" stroke-dasharray="6,4" />`;
  }

  // Assemble
  const xTicks = xScale.ticks(7);
  const yTicks = yScale.ticks(5);

  return (
    svgOpen(
      config,
      `Histogram${options.title ? ': ' + options.title : ''}`,
    ) +
    gridLinesH(yTicks, yScale, margin.left, margin.left + innerWidth) +
    '\n' +
    bars +
    '\n' +
    kdeOverlay +
    '\n' +
    uniformOverlay +
    '\n' +
    xAxis(
      xTicks,
      xScale,
      margin.top + innerHeight,
      options.xLabel ?? '',
      config,
    ) +
    '\n' +
    yAxis(yTicks, yScale, margin.left, options.yLabel ?? 'Frequency', config) +
    '\n' +
    (options.title ? titleText(config, options.title) : '') +
    '</svg>'
  );
}
