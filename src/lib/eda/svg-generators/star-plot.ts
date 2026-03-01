/**
 * Star (radar/spider) plot SVG generator for multivariate display.
 * Supports both single-star and multi-star grid layout per NIST convention
 * (each star = one observation, displayed in a grid).
 *
 * Reuses polarToCartesian from the existing radar-math utility.
 */
import {
  DEFAULT_CONFIG,
  PALETTE,
  titleText,
  type PlotConfig,
} from './plot-base';
import { polarToCartesian } from '../../beauty-index/radar-math';

export interface StarPlotOptions {
  axes: { label: string; value: number; maxValue?: number }[];
  config?: Partial<PlotConfig>;
  title?: string;
  fillColor?: string;
  fillOpacity?: number;
}

/** Multi-star grid: each observation gets its own small star in a grid layout. */
export interface StarGridOptions {
  /** Variable names (spokes). */
  variables: string[];
  /** One entry per observation: { label, values[] } where values align with variables. */
  observations: { label: string; values: number[] }[];
  config?: Partial<PlotConfig>;
  title?: string;
  fillColor?: string;
  fillOpacity?: number;
  /** Columns in the grid (auto-calculated if omitted). */
  columns?: number;
}

// ---------------------------------------------------------------------------
// Single star (legacy API, still used by other callers)
// ---------------------------------------------------------------------------

export function generateStarPlot(options: StarPlotOptions): string {
  const { axes, fillColor = PALETTE.dataPrimary, fillOpacity = 0.3 } = options;
  const config: PlotConfig = { ...DEFAULT_CONFIG, ...options.config };

  if (axes.length < 3) {
    return (
      `<svg viewBox="0 0 ${config.width} ${config.height}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Insufficient axes for star plot" style="width:100%;height:auto;max-width:${config.width}px">` +
      `<text x="${(config.width / 2).toFixed(2)}" y="${(config.height / 2).toFixed(2)}" text-anchor="middle" font-size="14" fill="${PALETTE.textSecondary}" font-family="${config.fontFamily}">Insufficient axes (need 3+)</text>` +
      '</svg>'
    );
  }

  const cx = config.width / 2;
  const cy = config.height / 2;
  const innerWidth = config.width - config.margin.left - config.margin.right;
  const innerHeight = config.height - config.margin.top - config.margin.bottom;
  const maxRadius = Math.min(innerWidth, innerHeight) * 0.4;

  return buildSingleStar(axes, cx, cy, maxRadius, fillColor, fillOpacity, config, options.title);
}

// ---------------------------------------------------------------------------
// Multi-star grid (NIST convention)
// ---------------------------------------------------------------------------

export function generateStarGrid(options: StarGridOptions): string {
  const {
    variables,
    observations,
    fillColor = PALETTE.dataPrimary,
    fillOpacity = 0.3,
  } = options;
  const config: PlotConfig = { ...DEFAULT_CONFIG, ...options.config };

  const numObs = observations.length;
  if (numObs === 0 || variables.length < 3) {
    return (
      `<svg viewBox="0 0 ${config.width} ${config.height}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Insufficient data for star grid" style="width:100%;height:auto;max-width:${config.width}px">` +
      `<text x="${(config.width / 2).toFixed(2)}" y="${(config.height / 2).toFixed(2)}" text-anchor="middle" font-size="14" fill="${PALETTE.textSecondary}" font-family="${config.fontFamily}">Insufficient data for star grid</text>` +
      '</svg>'
    );
  }

  const cols = options.columns ?? Math.ceil(Math.sqrt(numObs));
  const rows = Math.ceil(numObs / cols);

  // Compute per-variable max across all observations for consistent scaling
  const maxValues = variables.map((_, vi) =>
    Math.max(...observations.map((o) => o.values[vi] ?? 0), 1)
  );

  // Cell sizing
  const cellW = config.width / cols;
  const cellH = (config.height - 30) / rows; // reserve 30px for title
  const starRadius = Math.min(cellW, cellH) * 0.32;
  const labelFontSize = Math.max(7, Math.min(10, cellW / 12));

  const parts: string[] = [];

  for (let idx = 0; idx < numObs; idx++) {
    const col = idx % cols;
    const row = Math.floor(idx / cols);
    const cx = col * cellW + cellW / 2;
    const cy = row * cellH + cellH / 2 + 20; // offset for title space

    const obs = observations[idx];
    const numAxes = variables.length;
    const angleStep = (2 * Math.PI) / numAxes;

    // Grid ring (outermost only for small stars)
    const ringPoints = Array.from({ length: numAxes }, (_, i) => {
      const { x, y } = polarToCartesian(cx, cy, i * angleStep, starRadius);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(' ');
    parts.push(`<polygon points="${ringPoints}" fill="none" stroke="${PALETTE.grid}" stroke-width="0.4" />`);

    // Axis lines
    for (let i = 0; i < numAxes; i++) {
      const { x, y } = polarToCartesian(cx, cy, i * angleStep, starRadius);
      parts.push(`<line x1="${cx.toFixed(1)}" y1="${cy.toFixed(1)}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}" stroke="${PALETTE.grid}" stroke-width="0.3" />`);
    }

    // Data polygon
    const dataPoints = obs.values
      .map((val, i) => {
        const ratio = maxValues[i] > 0 ? (val / maxValues[i]) : 0;
        const r = Math.min(Math.max(ratio, 0), 1) * starRadius;
        const { x, y } = polarToCartesian(cx, cy, i * angleStep, r);
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');
    parts.push(`<polygon points="${dataPoints}" fill="${fillColor}" fill-opacity="${fillOpacity}" stroke="${fillColor}" stroke-width="1" />`);

    // Label below star
    parts.push(`<text x="${cx.toFixed(1)}" y="${(cy + starRadius + labelFontSize + 2).toFixed(1)}" text-anchor="middle" font-size="${labelFontSize}" fill="${PALETTE.text}" font-family="${config.fontFamily}">${obs.label}</text>`);
  }

  const svgTag = `<svg viewBox="0 0 ${config.width} ${config.height}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Star plot grid${options.title ? ': ' + options.title : ''}" style="width:100%;height:auto;max-width:${config.width}px">`;

  return (
    svgTag +
    (options.title ? titleText(config, options.title) : '') +
    parts.join('\n') +
    '</svg>'
  );
}


// ---------------------------------------------------------------------------
// Shared helper for a single star polygon
// ---------------------------------------------------------------------------

function buildSingleStar(
  axes: StarPlotOptions['axes'],
  cx: number,
  cy: number,
  maxRadius: number,
  fillColor: string,
  fillOpacity: number,
  config: PlotConfig,
  title?: string,
): string {
  const numAxes = axes.length;
  const angleStep = (2 * Math.PI) / numAxes;

  // Grid rings at 20%, 40%, 60%, 80%, 100%
  const ringLevels = [0.2, 0.4, 0.6, 0.8, 1.0];
  const gridRings = ringLevels
    .map((level) => {
      const ringRadius = maxRadius * level;
      const ringPoints = Array.from({ length: numAxes }, (_, i) => {
        const { x, y } = polarToCartesian(cx, cy, i * angleStep, ringRadius);
        return `${x.toFixed(2)},${y.toFixed(2)}`;
      }).join(' ');
      return `<polygon points="${ringPoints}" fill="none" stroke="${PALETTE.grid}" stroke-width="0.5" />`;
    })
    .join('\n');

  const axisLines = Array.from({ length: numAxes }, (_, i) => {
    const { x, y } = polarToCartesian(cx, cy, i * angleStep, maxRadius);
    return `<line x1="${cx.toFixed(2)}" y1="${cy.toFixed(2)}" x2="${x.toFixed(2)}" y2="${y.toFixed(2)}" stroke="${PALETTE.grid}" stroke-width="0.5" />`;
  }).join('\n');

  const dataPoints = axes
    .map((axis, i) => {
      const maxVal = axis.maxValue ?? 10;
      const ratio = maxVal > 0 ? axis.value / maxVal : 0;
      const radius = Math.min(Math.max(ratio, 0), 1) * maxRadius;
      const { x, y } = polarToCartesian(cx, cy, i * angleStep, radius);
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(' ');
  const dataPolygon = `<polygon points="${dataPoints}" fill="${fillColor}" fill-opacity="${fillOpacity}" stroke="${fillColor}" stroke-width="1.5" />`;

  const dataCircles = axes
    .map((axis, i) => {
      const maxVal = axis.maxValue ?? 10;
      const ratio = maxVal > 0 ? axis.value / maxVal : 0;
      const radius = Math.min(Math.max(ratio, 0), 1) * maxRadius;
      const { x, y } = polarToCartesian(cx, cy, i * angleStep, radius);
      return `<circle cx="${x.toFixed(2)}" cy="${y.toFixed(2)}" r="3" fill="${fillColor}" />`;
    })
    .join('\n');

  const labelOffset = maxRadius + 20;
  const axisLabels = axes
    .map((axis, i) => {
      const { x, y } = polarToCartesian(cx, cy, i * angleStep, labelOffset);
      const normalizedX = x - cx;
      let anchor = 'middle';
      if (normalizedX > 1) anchor = 'start';
      else if (normalizedX < -1) anchor = 'end';
      const normalizedY = y - cy;
      let dy = '0.35em';
      if (normalizedY < -1) dy = '0.8em';
      else if (normalizedY > 1) dy = '-0.2em';
      return `<text x="${x.toFixed(2)}" y="${y.toFixed(2)}" text-anchor="${anchor}" dy="${dy}" font-size="11" fill="${PALETTE.text}" font-family="${config.fontFamily}">${axis.label}</text>`;
    })
    .join('\n');

  const pad = 40;
  const vbX = -pad;
  const vbY = -pad;
  const vbW = config.width + 2 * pad;
  const vbH = config.height + 2 * pad;

  const svgOpenTag = `<svg viewBox="${vbX} ${vbY} ${vbW} ${vbH}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Star plot${title ? ': ' + title : ''}" style="width:100%;height:auto;max-width:${config.width}px">`;

  return (
    svgOpenTag +
    gridRings + '\n' +
    axisLines + '\n' +
    dataPolygon + '\n' +
    dataCircles + '\n' +
    axisLabels + '\n' +
    (title ? titleText(config, title) : '') +
    '</svg>'
  );
}
