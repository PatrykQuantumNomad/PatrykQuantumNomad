/**
 * Star (radar/spider) plot SVG generator for multivariate display.
 * Reuses polarToCartesian from the existing radar-math utility.
 */
import {
  DEFAULT_CONFIG,
  PALETTE,
  svgOpen,
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

export function generateStarPlot(options: StarPlotOptions): string {
  const { axes, fillColor = PALETTE.dataPrimary, fillOpacity = 0.3 } = options;
  const config: PlotConfig = { ...DEFAULT_CONFIG, ...options.config };

  // Guard clause
  if (axes.length < 3) {
    return (
      svgOpen(config, 'Insufficient axes for star plot') +
      `<text x="${(config.width / 2).toFixed(2)}" y="${(config.height / 2).toFixed(2)}" text-anchor="middle" font-size="14" fill="${PALETTE.textSecondary}" font-family="${config.fontFamily}">Insufficient axes (need 3+)</text>` +
      '</svg>'
    );
  }

  const cx = config.width / 2;
  const cy = config.height / 2;
  const innerWidth = config.width - config.margin.left - config.margin.right;
  const innerHeight = config.height - config.margin.top - config.margin.bottom;
  const maxRadius = Math.min(innerWidth, innerHeight) * 0.4;
  const numAxes = axes.length;
  const angleStep = (2 * Math.PI) / numAxes;

  // Grid rings at 20%, 40%, 60%, 80%, 100%
  const ringLevels = [0.2, 0.4, 0.6, 0.8, 1.0];
  const gridRings = ringLevels
    .map((level) => {
      const ringRadius = maxRadius * level;
      const ringPoints = Array.from({ length: numAxes }, (_, i) => {
        const angle = i * angleStep;
        const { x, y } = polarToCartesian(cx, cy, angle, ringRadius);
        return `${x.toFixed(2)},${y.toFixed(2)}`;
      }).join(' ');
      return `<polygon points="${ringPoints}" fill="none" stroke="${PALETTE.grid}" stroke-width="0.5" />`;
    })
    .join('\n');

  // Axis lines from center to each vertex
  const axisLines = Array.from({ length: numAxes }, (_, i) => {
    const angle = i * angleStep;
    const { x, y } = polarToCartesian(cx, cy, angle, maxRadius);
    return `<line x1="${cx.toFixed(2)}" y1="${cy.toFixed(2)}" x2="${x.toFixed(2)}" y2="${y.toFixed(2)}" stroke="${PALETTE.grid}" stroke-width="0.5" />`;
  }).join('\n');

  // Data polygon
  const dataPoints = axes
    .map((axis, i) => {
      const maxVal = axis.maxValue ?? 10;
      const ratio = maxVal > 0 ? axis.value / maxVal : 0;
      const radius = Math.min(Math.max(ratio, 0), 1) * maxRadius;
      const angle = i * angleStep;
      const { x, y } = polarToCartesian(cx, cy, angle, radius);
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(' ');
  const dataPolygon = `<polygon points="${dataPoints}" fill="${fillColor}" fill-opacity="${fillOpacity}" stroke="${fillColor}" stroke-width="1.5" />`;

  // Data point circles at each vertex
  const dataCircles = axes
    .map((axis, i) => {
      const maxVal = axis.maxValue ?? 10;
      const ratio = maxVal > 0 ? axis.value / maxVal : 0;
      const radius = Math.min(Math.max(ratio, 0), 1) * maxRadius;
      const angle = i * angleStep;
      const { x, y } = polarToCartesian(cx, cy, angle, radius);
      return `<circle cx="${x.toFixed(2)}" cy="${y.toFixed(2)}" r="3" fill="${fillColor}" />`;
    })
    .join('\n');

  // Axis labels outside the outermost ring
  const labelOffset = maxRadius + 20;
  const axisLabels = axes
    .map((axis, i) => {
      const angle = i * angleStep;
      const { x, y } = polarToCartesian(cx, cy, angle, labelOffset);

      // Determine text-anchor based on angle position
      const normalizedX = x - cx;
      let anchor = 'middle';
      if (normalizedX > 1) anchor = 'start';
      else if (normalizedX < -1) anchor = 'end';

      // Vertical adjustment
      const normalizedY = y - cy;
      let dy = '0.35em';
      if (normalizedY < -1) dy = '0.8em';
      else if (normalizedY > 1) dy = '-0.2em';

      return `<text x="${x.toFixed(2)}" y="${y.toFixed(2)}" text-anchor="${anchor}" dy="${dy}" font-size="11" fill="${PALETTE.text}" font-family="${config.fontFamily}">${axis.label}</text>`;
    })
    .join('\n');

  // Use extended viewBox to accommodate labels (add padding)
  const pad = 40;
  const vbX = -pad;
  const vbY = -pad;
  const vbW = config.width + 2 * pad;
  const vbH = config.height + 2 * pad;

  const svgOpenTag = `<svg viewBox="${vbX} ${vbY} ${vbW} ${vbH}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Star plot${options.title ? ': ' + options.title : ''}" style="width:100%;height:auto;max-width:${config.width}px">`;

  return (
    svgOpenTag +
    gridRings + '\n' +
    axisLines + '\n' +
    dataPolygon + '\n' +
    dataCircles + '\n' +
    axisLabels + '\n' +
    (options.title ? titleText(config, options.title) : '') +
    '</svg>'
  );
}
