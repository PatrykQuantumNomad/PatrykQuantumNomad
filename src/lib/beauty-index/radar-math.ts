/**
 * Pure TypeScript radar chart math utility.
 * ZERO framework dependencies — no Astro, no React, no DOM APIs.
 * Usable in both Astro components and Node/Satori contexts.
 */

/**
 * Converts polar coordinates to cartesian, with the first axis pointing
 * upward (12 o'clock position) by subtracting PI/2 from the angle.
 */
export function polarToCartesian(
  cx: number,
  cy: number,
  angle: number,
  radius: number
): { x: number; y: number } {
  const adjusted = angle - Math.PI / 2;
  return {
    x: cx + radius * Math.cos(adjusted),
    y: cy + radius * Math.sin(adjusted),
  };
}

/**
 * Generates an SVG polygon points string for a set of data values.
 * Each value maps to an axis evenly distributed around the circle.
 *
 * @param cx - Center X coordinate
 * @param cy - Center Y coordinate
 * @param maxRadius - Maximum radius (for value = maxValue)
 * @param values - Data values (one per axis)
 * @param maxValue - Maximum possible value (default 10)
 * @returns SVG-compatible points string like "x1,y1 x2,y2 ..."
 */
export function radarPolygonPoints(
  cx: number,
  cy: number,
  maxRadius: number,
  values: number[],
  maxValue: number = 10
): string {
  const numAxes = values.length;
  const angleStep = (2 * Math.PI) / numAxes;

  return values
    .map((value, i) => {
      const angle = i * angleStep;
      const radius = (value / maxValue) * maxRadius;
      const { x, y } = polarToCartesian(cx, cy, angle, radius);
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(' ');
}

/**
 * Generates an SVG polygon points string for a regular polygon ring
 * (used for concentric grid lines in the radar chart).
 *
 * @param cx - Center X coordinate
 * @param cy - Center Y coordinate
 * @param radius - Ring radius
 * @param numSides - Number of sides (matches number of axes)
 * @returns SVG-compatible points string
 */
export function hexagonRingPoints(
  cx: number,
  cy: number,
  radius: number,
  numSides: number
): string {
  const angleStep = (2 * Math.PI) / numSides;

  return Array.from({ length: numSides }, (_, i) => {
    const angle = i * angleStep;
    const { x, y } = polarToCartesian(cx, cy, angle, radius);
    return `${x.toFixed(2)},${y.toFixed(2)}`;
  }).join(' ');
}

/**
 * Generates a complete standalone SVG element as a string.
 * Designed for Satori embedding via base64 data URI.
 *
 * Features:
 * - Concentric grid rings at score intervals of 2 (2, 4, 6, 8, 10)
 * - Axis lines from center to each vertex
 * - Data polygon with configurable fill color and opacity
 * - Axis labels positioned outside the chart
 *
 * @param size - Width and height of the SVG (square)
 * @param values - Data values (one per axis, scale 1-10)
 * @param fillColor - Fill color for the data polygon (hex)
 * @param fillOpacity - Opacity of the data polygon fill (0-1)
 * @param labels - Labels for each axis (one per axis)
 * @param labelColors - Optional per-label fill colors (defaults to #666 for all)
 * @returns Complete SVG element as a string with xmlns attribute
 */
export function generateRadarSvgString(
  size: number,
  values: number[],
  fillColor: string,
  fillOpacity: number,
  labels: string[],
  labelColors?: string[]
): string {
  const cx = size / 2;
  const cy = size / 2;
  const maxRadius = size * 0.35;
  const numAxes = values.length;
  const angleStep = (2 * Math.PI) / numAxes;
  const maxValue = 10;
  const gridSteps = [2, 4, 6, 8, 10];
  const labelOffset = maxRadius + size * 0.08;

  // Grid rings
  const gridRings = gridSteps
    .map((step) => {
      const ringRadius = (step / maxValue) * maxRadius;
      const points = hexagonRingPoints(cx, cy, ringRadius, numAxes);
      return `<polygon points="${points}" fill="none" stroke="#ccc" stroke-width="0.5" opacity="0.6"/>`;
    })
    .join('\n    ');

  // Axis lines
  const axisLines = Array.from({ length: numAxes }, (_, i) => {
    const angle = i * angleStep;
    const { x, y } = polarToCartesian(cx, cy, angle, maxRadius);
    return `<line x1="${cx}" y1="${cy}" x2="${x.toFixed(2)}" y2="${y.toFixed(2)}" stroke="#ccc" stroke-width="0.5" opacity="0.6"/>`;
  }).join('\n    ');

  // Data polygon
  const dataPoints = radarPolygonPoints(cx, cy, maxRadius, values, maxValue);
  const dataPolygon = `<polygon points="${dataPoints}" fill="${fillColor}" fill-opacity="${fillOpacity}" stroke="${fillColor}" stroke-width="1.5"/>`;

  // Axis labels
  const axisLabels = labels
    .map((label, i) => {
      const angle = i * angleStep;
      const { x, y } = polarToCartesian(cx, cy, angle, labelOffset);

      // Determine text-anchor based on position
      let anchor = 'middle';
      const normalizedX = x - cx;
      if (normalizedX > 1) anchor = 'start';
      else if (normalizedX < -1) anchor = 'end';

      // Adjust vertical alignment
      let dy = '0.35em';
      const normalizedY = y - cy;
      if (normalizedY < -1) dy = '0.8em';
      else if (normalizedY > 1) dy = '-0.2em';

      const color = labelColors?.[i] ?? '#666';
      return `<text x="${x.toFixed(2)}" y="${y.toFixed(2)}" text-anchor="${anchor}" dy="${dy}" font-family="sans-serif" font-size="${(size * 0.035).toFixed(1)}" fill="${color}" font-weight="600">${label}</text>`;
    })
    .join('\n    ');

  // Add padding so axis labels outside the chart area are not clipped
  const pad = size * 0.18;
  const vbX = -pad;
  const vbY = -pad;
  const vbW = size + 2 * pad;
  const vbH = size + 2 * pad;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="${vbX.toFixed(1)} ${vbY.toFixed(1)} ${vbW.toFixed(1)} ${vbH.toFixed(1)}">
    ${gridRings}
    ${axisLines}
    ${dataPolygon}
    ${axisLabels}
  </svg>`;
}
