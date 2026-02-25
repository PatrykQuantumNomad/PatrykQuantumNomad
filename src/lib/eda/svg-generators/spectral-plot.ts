/**
 * Spectral plot SVG generator showing power spectral density from FFT.
 * Produces valid SVG markup from sequential numeric data at build time.
 */
import { scaleLinear, scaleLog } from 'd3-scale';
import { extent } from 'd3-array';
import { line, area, curveLinear } from 'd3-shape';
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
import { powerSpectrum } from '../math/statistics';

export interface SpectralPlotOptions {
  data: number[];
  config?: Partial<PlotConfig>;
  title?: string;
  xLabel?: string;
  yLabel?: string;
}

export function generateSpectralPlot(options: SpectralPlotOptions): string {
  const { data } = options;
  const config: PlotConfig = { ...DEFAULT_CONFIG, ...options.config };
  const { innerWidth, innerHeight } = innerDimensions(config);
  const { margin } = config;

  // Guard clause
  if (data.length < 4) {
    return (
      svgOpen(config, 'Insufficient data for spectral plot') +
      `<text x="${(config.width / 2).toFixed(2)}" y="${(config.height / 2).toFixed(2)}" text-anchor="middle" font-size="14" fill="${PALETTE.textSecondary}" font-family="${config.fontFamily}">Insufficient data</text>` +
      '</svg>'
    );
  }

  // Compute power spectrum
  const psd = powerSpectrum(data);
  const nFreq = psd.length; // N/2 + 1

  // Frequency normalized to [0, 0.5] (Nyquist)
  const frequencies: number[] = psd.map((_, i) => i / (2 * (nFreq - 1)));

  // Determine if log scale is needed
  const psdPositive = psd.filter((v) => v > 0);
  const psdMin = psdPositive.length > 0 ? Math.min(...psdPositive) : 1;
  const psdMax = Math.max(...psd);
  const useLog = psdMax / psdMin > 100 && psdMin > 0;

  // Scales
  const xScale = scaleLinear()
    .domain([0, 0.5])
    .range([margin.left, margin.left + innerWidth]);

  // For Y scale, use log or linear depending on dynamic range
  let yScaleFn: (v: number) => number;
  let yTicks: number[];
  let yFormatter: ((v: number) => string) | undefined;

  if (useLog) {
    const logScale = scaleLog()
      .domain([psdMin, psdMax * 1.1])
      .range([margin.top + innerHeight, margin.top])
      .nice();
    yScaleFn = (v: number) => logScale(Math.max(v, psdMin));
    yTicks = logScale.ticks(5);
    if (yTicks.length < 2) {
      // Fallback: generate manual ticks
      yTicks = [psdMin, psdMax];
    }
    yFormatter = (v: number) => v.toExponential(1);
  } else {
    const linScale = scaleLinear()
      .domain([0, psdMax * 1.1])
      .range([margin.top + innerHeight, margin.top])
      .nice();
    yScaleFn = linScale;
    yTicks = linScale.ticks(5);
  }

  // Grid
  const xTicks = xScale.ticks(7);
  const grid =
    gridLinesH(yTicks, yScaleFn, margin.left, margin.left + innerWidth) +
    '\n' +
    gridLinesV(xTicks, xScale, margin.top, margin.top + innerHeight);

  // Line path for PSD
  const lineGen = line<[number, number]>()
    .x((d) => d[0])
    .y((d) => d[1])
    .curve(curveLinear);

  const pairs: [number, number][] = frequencies.map((freq, i) => [
    xScale(freq),
    yScaleFn(psd[i]),
  ]);
  const pathD = lineGen(pairs) ?? '';
  const linePath = `<path d="${pathD}" fill="none" stroke="${PALETTE.dataPrimary}" stroke-width="1.5" />`;

  // Area under curve
  const areaGen = area<[number, number]>()
    .x((d) => d[0])
    .y0(yScaleFn(useLog ? psdMin : 0))
    .y1((d) => d[1])
    .curve(curveLinear);
  const areaD = areaGen(pairs) ?? '';
  const areaPath = areaD
    ? `<path d="${areaD}" fill="${PALETTE.dataPrimary}" fill-opacity="0.1" stroke="none" />`
    : '';

  const xLabel = options.xLabel ?? 'Frequency (cycles/sample)';
  const yLabel = options.yLabel ?? 'Power Spectral Density';

  return (
    svgOpen(config, `Spectral plot${options.title ? ': ' + options.title : ''}`) +
    grid + '\n' +
    areaPath + '\n' +
    linePath + '\n' +
    xAxis(xTicks, xScale, margin.top + innerHeight, xLabel, config) + '\n' +
    yAxis(yTicks, yScaleFn, margin.left, yLabel, config, yFormatter) + '\n' +
    (options.title ? titleText(config, options.title) : '') +
    '</svg>'
  );
}
