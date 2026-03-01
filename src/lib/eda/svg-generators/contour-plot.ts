/**
 * Contour plot SVG generator.
 * Uses d3-contour for marching-squares isoline computation.
 * Renders prominent contour LINES with inline level labels and
 * light colour fills between bands for depth context.
 * Lines remain the dominant visual; fills are kept subtle.
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
 * Light fill colour for a contour band.
 * Low values: cool (dataSecondary / teal).
 * High values: warm (dataPrimary / accent orange).
 * Opacity is kept low so the contour lines stay dominant.
 */
function contourFill(
  threshold: number,
  minVal: number,
  maxVal: number,
): { fill: string; opacity: string } {
  const range = maxVal - minVal;
  const t = range > 0 ? (threshold - minVal) / range : 0.5;
  // Opacities are intentionally very low because d3-contour produces
  // nested filled polygons — inner bands stack on top of all outer ones,
  // so per-band opacity accumulates visually.
  if (t <= 0.5) {
    const opacity = 0.03 + (1 - t * 2) * 0.05;
    return { fill: PALETTE.dataSecondary, opacity: opacity.toFixed(2) };
  }
  const opacity = 0.03 + (t - 0.5) * 2 * 0.05;
  return { fill: PALETTE.dataPrimary, opacity: opacity.toFixed(2) };
}

/**
 * Vary stroke width by level — inner (higher) contours slightly thicker
 * to draw the eye toward the peak/optimum.
 */
function contourStrokeWidth(
  threshold: number,
  minVal: number,
  maxVal: number,
): string {
  const range = maxVal - minVal;
  const t = range > 0 ? (threshold - minVal) / range : 0.5;
  // Range from 1.0 (outermost) to 1.8 (innermost)
  return (1.0 + t * 0.8).toFixed(1);
}

/**
 * Find a good label position on a contour ring.
 * Tries multiple candidate points along the longest ring to find one
 * that sits comfortably inside the plot area.
 */
function labelPosition(
  coordinates: number[][][][],
  gridWidth: number,
  gridHeight: number,
  marginLeft: number,
  marginTop: number,
  innerWidth: number,
  innerHeight: number,
  targetFraction: number,
): { x: number; y: number; angle: number } | null {
  // Find the longest ring across all polygons
  let longestRing: number[][] = [];
  for (const polygon of coordinates) {
    for (const ring of polygon) {
      if (ring.length > longestRing.length) longestRing = ring;
    }
  }
  if (longestRing.length < 6) return null;

  // Try several candidate positions along the ring
  const candidates = [targetFraction, 0.2, 0.6, 0.8, 0.35];
  const pad = 18;

  for (const frac of candidates) {
    const idx = Math.floor(longestRing.length * frac);
    const [geoX, geoY] = longestRing[idx];
    const x = marginLeft + (geoX / gridWidth) * innerWidth;
    const y = marginTop + (1 - geoY / gridHeight) * innerHeight;

    // Skip if too close to edges
    if (
      x < marginLeft + pad ||
      x > marginLeft + innerWidth - pad ||
      y < marginTop + pad ||
      y > marginTop + innerHeight - pad
    ) {
      continue;
    }

    // Compute angle from neighboring points
    const span = Math.min(3, Math.floor(longestRing.length * 0.02) + 1);
    const prev = longestRing[Math.max(0, idx - span)];
    const next = longestRing[Math.min(longestRing.length - 1, idx + span)];
    const dx = (next[0] - prev[0]) / gridWidth * innerWidth;
    const dy = -((next[1] - prev[1]) / gridHeight * innerHeight);
    let angle = Math.atan2(dy, dx) * (180 / Math.PI);
    if (angle > 90) angle -= 180;
    if (angle < -90) angle += 180;

    return { x, y, angle };
  }

  return null;
}

export function generateContourPlot(options: ContourPlotOptions): string {
  const { grid, thresholds = 10 } = options;
  const configDefaults: Partial<PlotConfig> = {
    margin: { top: 40, right: 72, bottom: 50, left: 60 },
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

  // Find min/max threshold values
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

  // ── Layer 1: Subtle colour fills for depth ──
  const filledBands = contourData
    .map((c) => {
      const coords = c.coordinates as unknown as number[][][][];
      const pathD = geoToSvgPath(
        coords, grid.width, grid.height,
        margin.left, margin.top, innerWidth, innerHeight,
      );
      if (!pathD) return '';
      const { fill, opacity } = contourFill(c.value, minVal, maxVal);
      return `<path d="${pathD}" fill="${fill}" fill-opacity="${opacity}" stroke="none" />`;
    })
    .filter(Boolean)
    .join('\n');

  // ── Layer 2: Contour lines (the primary visual element) ──
  const contourLines = contourData
    .map((c) => {
      const coords = c.coordinates as unknown as number[][][][];
      const pathD = geoToSvgPath(
        coords, grid.width, grid.height,
        margin.left, margin.top, innerWidth, innerHeight,
      );
      if (!pathD) return '';
      const sw = contourStrokeWidth(c.value, minVal, maxVal);
      return `<path d="${pathD}" fill="none" stroke="${PALETTE.text}" stroke-width="${sw}" stroke-opacity="0.75" />`;
    })
    .filter(Boolean)
    .join('\n');

  // ── Inline level labels ──
  // Label every other contour for legibility, staggering the position
  const usedPositions: Array<{ x: number; y: number }> = [];
  const minLabelDist = 30; // minimum px between labels

  const labels = contourData
    .filter((_, i) => i % 2 === 0)
    .map((c, labelIdx) => {
      const coords = c.coordinates as unknown as number[][][][];
      const targetFrac = 0.25 + (labelIdx % 3) * 0.2; // stagger positions
      const pos = labelPosition(
        coords, grid.width, grid.height,
        margin.left, margin.top, innerWidth, innerHeight,
        targetFrac,
      );
      if (!pos) return '';

      // Check distance from existing labels to avoid overlap
      const tooClose = usedPositions.some(
        (p) => Math.hypot(p.x - pos.x, p.y - pos.y) < minLabelDist,
      );
      if (tooClose) return '';
      usedPositions.push({ x: pos.x, y: pos.y });

      const valStr = c.value.toFixed(1);
      const halfW = valStr.length * 3.2 + 2;
      return (
        `<g transform="translate(${pos.x.toFixed(1)},${pos.y.toFixed(1)}) rotate(${pos.angle.toFixed(1)})">` +
        `<rect x="${(-halfW).toFixed(1)}" y="-6.5" width="${(halfW * 2).toFixed(1)}" height="11" rx="2" fill="${PALETTE.surface}" fill-opacity="0.9" />` +
        `<text text-anchor="middle" dy="0.35em" font-size="8.5" font-family="${config.fontFamily}" fill="${PALETTE.text}" font-weight="500">${valStr}</text>` +
        '</g>'
      );
    })
    .filter(Boolean)
    .join('\n');

  // ── Vertical colour-bar legend ──
  const legendX = margin.left + innerWidth + 10;
  const legendW = 12;
  const legendH = innerHeight;
  const legendSteps = 20; // smooth gradient steps
  const stepH = legendH / legendSteps;

  const legendRects = Array.from({ length: legendSteps }, (_, i) => {
    // i=0 is the top (high values), i=last is the bottom (low values)
    const t = 1 - i / (legendSteps - 1);
    const threshold = minVal + t * (maxVal - minVal);
    const { fill, opacity } = contourFill(threshold, minVal, maxVal);
    // Boost opacity for the legend — strong at both ends, lighter in the middle
    const distFromMid = Math.abs(t - 0.5) * 2; // 0 at midpoint, 1 at extremes
    const legendOpacity = (0.15 + distFromMid * 0.50).toFixed(2);
    const y = margin.top + i * stepH;
    return `<rect x="${legendX}" y="${y.toFixed(1)}" width="${legendW}" height="${(stepH + 0.5).toFixed(1)}" fill="${fill}" fill-opacity="${legendOpacity}" stroke="none" />`;
  }).join('\n');

  // Border around the legend bar
  const legendBorder = `<rect x="${legendX}" y="${margin.top}" width="${legendW}" height="${legendH}" fill="none" stroke="${PALETTE.textSecondary}" stroke-width="0.5" stroke-opacity="0.5" />`;

  // Tick labels: top (max), middle, bottom (min)
  const legendLabelX = legendX + legendW + 4;
  const legendTicks = [
    { y: margin.top + 4, val: maxVal },
    { y: margin.top + legendH / 2 + 3, val: (minVal + maxVal) / 2 },
    { y: margin.top + legendH, val: minVal },
  ].map(({ y, val }) =>
    `<text x="${legendLabelX}" y="${y.toFixed(1)}" font-size="8" fill="${PALETTE.textSecondary}" font-family="${config.fontFamily}">${val.toFixed(1)}</text>`
  ).join('\n');

  // Legend title (rotated "Z" label)
  const legendTitleY = margin.top + legendH / 2;
  const legendTitle = `<text x="${(legendX + legendW / 2).toFixed(1)}" y="${(margin.top - 8).toFixed(1)}" text-anchor="middle" font-size="9" fill="${PALETTE.textSecondary}" font-family="${config.fontFamily}">Z</text>`;

  const legend = legendRects + '\n' + legendBorder + '\n' + legendTicks + '\n' + legendTitle;

  return (
    svgOpen(
      config,
      `Contour plot${options.title ? ': ' + options.title : ''}`,
    ) +
    gridLines +
    '\n' +
    filledBands +
    '\n' +
    contourLines +
    '\n' +
    labels +
    '\n' +
    legend +
    '\n' +
    xAxis(xTicks, xScale, margin.top + innerHeight, options.xLabel ?? '', config) +
    '\n' +
    yAxis(yTicks, yScale, margin.left, options.yLabel ?? '', config) +
    '\n' +
    (options.title ? titleText(config, options.title) : '') +
    '</svg>'
  );
}
