/**
 * Shared SVG plot foundation for all EDA chart generators.
 * Provides consistent layout, axes, grid lines, viewBox, and
 * CSS-variable-based palette for dark/light theme support.
 *
 * Every SVG generator imports from this module.
 */

/** Semantic color palette using CSS custom properties */
export const PALETTE = {
  text: 'var(--color-text-primary)',
  textSecondary: 'var(--color-text-secondary)',
  axis: 'var(--color-text-secondary)',
  grid: 'var(--color-border)',
  dataPrimary: 'var(--color-accent)',
  dataSecondary: 'var(--color-accent-secondary)',
  dataTertiary: 'var(--color-gradient-end)',
  surface: 'var(--color-surface)',
  surfaceAlt: 'var(--color-surface-alt)',
} as const;

/** Standard plot dimensions and margins */
export interface PlotConfig {
  width: number;
  height: number;
  margin: { top: number; right: number; bottom: number; left: number };
  title?: string;
  xLabel?: string;
  yLabel?: string;
  fontFamily?: string;
}

/** Default configuration for all plots */
export const DEFAULT_CONFIG: PlotConfig = {
  width: 600,
  height: 400,
  margin: { top: 40, right: 20, bottom: 50, left: 60 },
  fontFamily: "'DM Sans', sans-serif",
};

/** Computed inner dimensions (the plotting area) */
export function innerDimensions(config: PlotConfig): {
  innerWidth: number;
  innerHeight: number;
} {
  return {
    innerWidth: config.width - config.margin.left - config.margin.right,
    innerHeight: config.height - config.margin.top - config.margin.bottom,
  };
}

/**
 * Generate the root <svg> opening tag with viewBox (NO width/height attributes).
 * Uses role="img" and aria-label for accessibility (SVG-12).
 */
export function svgOpen(config: PlotConfig, ariaLabel: string): string {
  return `<svg viewBox="0 0 ${config.width} ${config.height}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${ariaLabel}" style="width:100%;height:auto;max-width:${config.width}px">`;
}

/** Generate horizontal grid lines */
export function gridLinesH(
  yTicks: number[],
  yScale: (v: number) => number,
  xStart: number,
  xEnd: number,
): string {
  return yTicks
    .map(
      (t) =>
        `<line x1="${xStart.toFixed(2)}" y1="${yScale(t).toFixed(2)}" x2="${xEnd.toFixed(2)}" y2="${yScale(t).toFixed(2)}" stroke="${PALETTE.grid}" stroke-width="0.5" stroke-dasharray="4,4" />`,
    )
    .join('\n');
}

/** Generate vertical grid lines */
export function gridLinesV(
  xTicks: number[],
  xScale: (v: number) => number,
  yStart: number,
  yEnd: number,
): string {
  return xTicks
    .map(
      (t) =>
        `<line x1="${xScale(t).toFixed(2)}" y1="${yStart.toFixed(2)}" x2="${xScale(t).toFixed(2)}" y2="${yEnd.toFixed(2)}" stroke="${PALETTE.grid}" stroke-width="0.5" stroke-dasharray="4,4" />`,
    )
    .join('\n');
}

/** Generate X axis with ticks and label */
export function xAxis(
  ticks: number[],
  scale: (v: number) => number,
  y: number,
  label: string,
  config: PlotConfig,
  formatter?: (v: number) => string,
): string {
  const fmt = formatter ?? ((v: number) => String(v));
  const tickMarks = ticks
    .map(
      (t) =>
        `<line x1="${scale(t).toFixed(2)}" y1="${y.toFixed(2)}" x2="${scale(t).toFixed(2)}" y2="${(y + 6).toFixed(2)}" stroke="${PALETTE.axis}" stroke-width="1" />
    <text x="${scale(t).toFixed(2)}" y="${(y + 18).toFixed(2)}" text-anchor="middle" dy="0.35em" font-size="11" fill="${PALETTE.textSecondary}" font-family="${config.fontFamily}">${fmt(t)}</text>`,
    )
    .join('\n');
  const axisLine = `<line x1="${config.margin.left.toFixed(2)}" y1="${y.toFixed(2)}" x2="${(config.width - config.margin.right).toFixed(2)}" y2="${y.toFixed(2)}" stroke="${PALETTE.axis}" stroke-width="1" />`;
  const labelEl = label
    ? `<text x="${(config.width / 2).toFixed(2)}" y="${(y + 40).toFixed(2)}" text-anchor="middle" font-size="12" fill="${PALETTE.text}" font-family="${config.fontFamily}">${label}</text>`
    : '';
  return axisLine + '\n' + tickMarks + '\n' + labelEl;
}

/** Generate Y axis with ticks and label */
export function yAxis(
  ticks: number[],
  scale: (v: number) => number,
  x: number,
  label: string,
  config: PlotConfig,
  formatter?: (v: number) => string,
): string {
  const fmt = formatter ?? ((v: number) => String(v));
  const tickMarks = ticks
    .map(
      (t) =>
        `<line x1="${(x - 6).toFixed(2)}" y1="${scale(t).toFixed(2)}" x2="${x.toFixed(2)}" y2="${scale(t).toFixed(2)}" stroke="${PALETTE.axis}" stroke-width="1" />
    <text x="${(x - 10).toFixed(2)}" y="${scale(t).toFixed(2)}" text-anchor="end" dy="0.35em" font-size="11" fill="${PALETTE.textSecondary}" font-family="${config.fontFamily}">${fmt(t)}</text>`,
    )
    .join('\n');
  const axisLine = `<line x1="${x.toFixed(2)}" y1="${config.margin.top.toFixed(2)}" x2="${x.toFixed(2)}" y2="${(config.height - config.margin.bottom).toFixed(2)}" stroke="${PALETTE.axis}" stroke-width="1" />`;
  const labelEl = label
    ? `<text x="${(x - 45).toFixed(2)}" y="${(config.height / 2).toFixed(2)}" text-anchor="middle" font-size="12" fill="${PALETTE.text}" font-family="${config.fontFamily}" transform="rotate(-90,${(x - 45).toFixed(2)},${(config.height / 2).toFixed(2)})">${label}</text>`
    : '';
  return axisLine + '\n' + tickMarks + '\n' + labelEl;
}

/** Centered title above plot area */
export function titleText(config: PlotConfig, title: string): string {
  return `<text x="${(config.width / 2).toFixed(2)}" y="${(config.margin.top - 10).toFixed(2)}" text-anchor="middle" font-size="14" font-weight="bold" fill="${PALETTE.text}" font-family="${config.fontFamily}">${title}</text>`;
}
