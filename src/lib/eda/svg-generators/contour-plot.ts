/**
 * Contour plot SVG generator for response surface visualization.
 * Uses d3-contour for marching squares isoline computation and
 * PALETTE CSS variables with quantized opacity for theme-adaptive fills.
 */
import { contours } from 'd3-contour';
import { scaleLinear } from 'd3-scale';
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

export interface ContourPlotOptions {
  grid: { width: number; height: number; values: number[] };
  xDomain?: [number, number];
  yDomain?: [number, number];
  thresholds?: number;
  config?: Partial<PlotConfig>;
  title?: string;
  xLabel?: string;
  yLabel?: string;
}

/**
 * Convert GeoJSON MultiPolygon coordinates to SVG path data,
 * mapping grid coordinates to SVG pixel positions.
 */
function geoToSvgPath(
  coordinates: number[][][][],
  gridWidth: number,
  gridHeight: number,
  marginLeft: number,
  marginTop: number,
  innerWidth: number,
  innerHeight: number,
): string {
  const parts: string[] = [];
  for (const polygon of coordinates) {
    for (const ring of polygon) {
      if (ring.length === 0) continue;
      const segments: string[] = [];
      for (let i = 0; i < ring.length; i++) {
        const [geoX, geoY] = ring[i];
        const xSvg = marginLeft + (geoX / gridWidth) * innerWidth;
        const ySvg = marginTop + (1 - geoY / gridHeight) * innerHeight;
        segments.push(
          `${i === 0 ? 'M' : 'L'}${xSvg.toFixed(2)},${ySvg.toFixed(2)}`,
        );
      }
      segments.push('Z');
      parts.push(segments.join(''));
    }
  }
  return parts.join('');
}

/**
 * Compute fill color and opacity for a contour level using PALETTE CSS variables.
 * Low values: PALETTE.dataSecondary (teal) with higher opacity.
 * High values: PALETTE.dataPrimary (orange) with higher opacity.
 * Midpoint: both fade to near-transparent.
 */
function contourFill(
  threshold: number,
  minVal: number,
  maxVal: number,
): { fill: string; opacity: string } {
  const range = maxVal - minVal;
  const t = range > 0 ? (threshold - minVal) / range : 0.5;

  if (t <= 0.5) {
    // Low values: teal (dataSecondary), stronger at bottom, fading toward mid
    const opacity = 0.15 + (1 - t * 2) * 0.55;
    return { fill: PALETTE.dataSecondary, opacity: opacity.toFixed(2) };
  } else {
    // High values: orange (dataPrimary), fading from mid, stronger at top
    const opacity = 0.15 + (t - 0.5) * 2 * 0.55;
    return { fill: PALETTE.dataPrimary, opacity: opacity.toFixed(2) };
  }
}

export function generateContourPlot(options: ContourPlotOptions): string {
  const { grid, thresholds = 10 } = options;
  // Use wider right margin for legend
  const configDefaults: Partial<PlotConfig> = {
    margin: { top: 40, right: 60, bottom: 50, left: 60 },
  };
  const config: PlotConfig = { ...DEFAULT_CONFIG, ...configDefaults, ...options.config };
  const { innerWidth, innerHeight } = innerDimensions(config);
  const { margin } = config;

  // Guard clause
  if (grid.values.length !== grid.width * grid.height) {
    return (
      svgOpen(config, 'Invalid grid dimensions for contour plot') +
      `<text x="${(config.width / 2).toFixed(2)}" y="${(config.height / 2).toFixed(2)}" text-anchor="middle" font-size="14" fill="${PALETTE.textSecondary}" font-family="${config.fontFamily}">Invalid grid: ${grid.values.length} values for ${grid.width}x${grid.height} grid</text>` +
      '</svg>'
    );
  }

  // X/Y domains
  const xDomain = options.xDomain ?? [0, grid.width];
  const yDomain = options.yDomain ?? [0, grid.height];

  // Compute contours using d3-contour
  const contoursGen = contours().size([grid.width, grid.height]).thresholds(thresholds);
  const contourData = contoursGen(grid.values);

  // Find min/max threshold values for color mapping
  const allThresholds = contourData.map((c) => c.value);
  const minVal = Math.min(...allThresholds);
  const maxVal = Math.max(...allThresholds);

  // Scales for axis labels
  const xScale = scaleLinear()
    .domain(xDomain)
    .range([margin.left, margin.left + innerWidth]);
  const yScale = scaleLinear()
    .domain(yDomain)
    .range([margin.top + innerHeight, margin.top]);

  // Grid lines
  const xTicks = xScale.ticks(7);
  const yTicks = yScale.ticks(5);
  const gridLines =
    gridLinesH(yTicks, yScale, margin.left, margin.left + innerWidth) +
    '\n' +
    gridLinesV(xTicks, xScale, margin.top, margin.top + innerHeight);

  // Render filled contour bands
  const filledBands = contourData
    .map((c) => {
      const coords = c.coordinates as unknown as number[][][][];
      const pathD = geoToSvgPath(
        coords,
        grid.width,
        grid.height,
        margin.left,
        margin.top,
        innerWidth,
        innerHeight,
      );
      if (!pathD) return '';
      const { fill, opacity } = contourFill(c.value, minVal, maxVal);
      return `<path d="${pathD}" fill="${fill}" fill-opacity="${opacity}" stroke="${PALETTE.textSecondary}" stroke-width="0.5" stroke-opacity="0.4" />`;
    })
    .filter(Boolean)
    .join('\n');

  // Color legend (right side)
  const legendX = margin.left + innerWidth + 8;
  const legendWidth = 14;
  const legendHeight = innerHeight;
  const legendSteps = Math.min(contourData.length, 12);
  const stepHeight = legendHeight / legendSteps;

  const legendRects = Array.from({ length: legendSteps }, (_, i) => {
    const t = i / (legendSteps - 1);
    const threshold = minVal + t * (maxVal - minVal);
    const { fill, opacity } = contourFill(threshold, minVal, maxVal);
    const y = margin.top + legendHeight - (i + 1) * stepHeight;
    return `<rect x="${legendX.toFixed(2)}" y="${y.toFixed(2)}" width="${legendWidth}" height="${stepHeight.toFixed(2)}" fill="${fill}" fill-opacity="${opacity}" stroke="none" />`;
  }).join('\n');

  // Legend labels (top and bottom values)
  const legendLabels = [
    `<text x="${(legendX + legendWidth + 4).toFixed(2)}" y="${(margin.top + 4).toFixed(2)}" font-size="9" fill="${PALETTE.textSecondary}" font-family="${config.fontFamily}">${maxVal.toFixed(1)}</text>`,
    `<text x="${(legendX + legendWidth + 4).toFixed(2)}" y="${(margin.top + innerHeight).toFixed(2)}" font-size="9" fill="${PALETTE.textSecondary}" font-family="${config.fontFamily}">${minVal.toFixed(1)}</text>`,
    `<text x="${(legendX + legendWidth + 4).toFixed(2)}" y="${(margin.top + innerHeight / 2).toFixed(2)}" font-size="9" fill="${PALETTE.textSecondary}" font-family="${config.fontFamily}">${((minVal + maxVal) / 2).toFixed(1)}</text>`,
  ].join('\n');

  return (
    svgOpen(
      config,
      `Contour plot${options.title ? ': ' + options.title : ''}`,
    ) +
    gridLines +
    '\n' +
    filledBands +
    '\n' +
    legendRects +
    '\n' +
    legendLabels +
    '\n' +
    xAxis(xTicks, xScale, margin.top + innerHeight, options.xLabel ?? '', config) +
    '\n' +
    yAxis(yTicks, yScale, margin.left, options.yLabel ?? '', config) +
    '\n' +
    (options.title ? titleText(config, options.title) : '') +
    '</svg>'
  );
}
