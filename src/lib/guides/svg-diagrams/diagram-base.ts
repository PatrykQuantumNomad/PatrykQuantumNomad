/**
 * Shared SVG foundation for guide architecture diagram generators.
 * Mirrors the plot-base.ts pattern from EDA with CSS-variable-based
 * palette for dark/light theme support.
 *
 * Every diagram generator imports from this module.
 */

/** Semantic color palette using CSS custom properties */
export const DIAGRAM_PALETTE = {
  text: 'var(--color-text-primary)',
  textSecondary: 'var(--color-text-secondary)',
  accent: 'var(--color-accent)',
  accentSecondary: 'var(--color-accent-secondary)',
  border: 'var(--color-border)',
  surface: 'var(--color-surface)',
  surfaceAlt: 'var(--color-surface-alt)',
} as const;

/** Configuration for diagram dimensions and typography */
export interface DiagramConfig {
  width: number;
  height: number;
  fontFamily?: string;
}

/** Default configuration for all diagrams */
export const DEFAULT_DIAGRAM_CONFIG: DiagramConfig = {
  width: 720,
  height: 500,
  fontFamily: "'DM Sans', sans-serif",
};

/**
 * Generate the root <svg> opening tag with viewBox (no fixed width/height).
 * Uses role="img" and aria-label for accessibility.
 */
export function diagramSvgOpen(config: DiagramConfig, ariaLabel: string): string {
  return `<svg viewBox="0 0 ${config.width} ${config.height}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${ariaLabel}" style="width:100%;height:auto;max-width:${config.width}px">`;
}

/** Options for roundedRect */
interface RoundedRectOptions {
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  rx?: number;
}

/** Generate a rounded rectangle SVG element */
export function roundedRect(
  x: number,
  y: number,
  w: number,
  h: number,
  opts: RoundedRectOptions = {},
): string {
  const fill = opts.fill ?? DIAGRAM_PALETTE.surfaceAlt;
  const stroke = opts.stroke ?? DIAGRAM_PALETTE.border;
  const strokeWidth = opts.strokeWidth ?? 1.5;
  const rx = opts.rx ?? 6;
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}" />`;
}

/**
 * Generate a line with an arrow marker at the end.
 * @param markerId - The id of the marker definition to reference
 */
export function arrowLine(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  markerId: string,
): string {
  return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${DIAGRAM_PALETTE.textSecondary}" stroke-width="1.5" marker-end="url(#${markerId})" />`;
}

/**
 * Generate an SVG <defs> marker definition for directional arrows.
 * @param id - Unique marker ID (should be prefixed per diagram)
 */
export function arrowMarkerDef(id: string): string {
  return `<defs><marker id="${id}" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="${DIAGRAM_PALETTE.textSecondary}" /></marker></defs>`;
}

/** Options for textLabel */
interface TextLabelOptions {
  fontSize?: number;
  fill?: string;
  fontWeight?: string;
  fontFamily?: string;
  textAnchor?: string;
}

/** Generate a centered text label SVG element */
export function textLabel(
  x: number,
  y: number,
  text: string,
  opts: TextLabelOptions = {},
): string {
  const fontSize = opts.fontSize ?? 14;
  const fill = opts.fill ?? DIAGRAM_PALETTE.text;
  const fontWeight = opts.fontWeight ?? 'normal';
  const fontFamily = opts.fontFamily ?? DEFAULT_DIAGRAM_CONFIG.fontFamily;
  const textAnchor = opts.textAnchor ?? 'middle';
  return `<text x="${x}" y="${y}" text-anchor="${textAnchor}" font-size="${fontSize}" font-weight="${fontWeight}" fill="${fill}" font-family="${fontFamily}">${text}</text>`;
}
