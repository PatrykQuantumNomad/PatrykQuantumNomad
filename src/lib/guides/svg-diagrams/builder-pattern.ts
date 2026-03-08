/**
 * DIAG-02: Builder Pattern Composition
 *
 * Generates a build-time SVG showing the FastAPIBuilder class with
 * its setup_*() methods and the create_app() factory function.
 */

import {
  DIAGRAM_PALETTE,
  type DiagramConfig,
  diagramSvgOpen,
  roundedRect,
  arrowLine,
  arrowMarkerDef,
  textLabel,
} from './diagram-base';

const SETUP_METHODS = [
  'setup_logging',
  'setup_database',
  'setup_middleware',
  'setup_routes',
  'setup_error_handlers',
  'setup_auth',
] as const;

const MARKER_ID = 'builder-arrow';

/** Generate the builder pattern SVG diagram */
export function generateBuilderPattern(): string {
  const config: DiagramConfig = { width: 780, height: 520, fontFamily: "'DM Sans', sans-serif" };

  // Builder box dimensions
  const builderX = 40;
  const builderY = 40;
  const builderW = 380;
  const methodHeight = 36;
  const methodGap = 10;
  const headerHeight = 50;
  const builderH = headerHeight + SETUP_METHODS.length * (methodHeight + methodGap) + 20;

  // Factory box dimensions
  const factoryX = 540;
  const factoryY = builderY + builderH / 2 - 40;
  const factoryW = 200;
  const factoryH = 80;

  const parts: string[] = [];

  // SVG open
  parts.push(diagramSvgOpen(config, 'Builder pattern showing FastAPIBuilder class with setup methods and create_app factory'));

  // Arrow marker definition
  parts.push(arrowMarkerDef(MARKER_ID));

  // Builder outer box
  parts.push(roundedRect(builderX, builderY, builderW, builderH, {
    fill: DIAGRAM_PALETTE.surface,
    stroke: DIAGRAM_PALETTE.accent,
    strokeWidth: 2,
    rx: 8,
  }));

  // Builder title
  parts.push(textLabel(builderX + builderW / 2, builderY + 30, 'FastAPIBuilder', {
    fontSize: 18,
    fontWeight: 'bold',
    fill: DIAGRAM_PALETTE.accent,
  }));

  // Divider line under title
  const dividerY = builderY + headerHeight;
  parts.push(`<line x1="${builderX + 20}" y1="${dividerY}" x2="${builderX + builderW - 20}" y2="${dividerY}" stroke="${DIAGRAM_PALETTE.border}" stroke-width="1" />`);

  // Setup methods as sub-items
  const methodX = builderX + 30;
  const methodW = builderW - 60;
  for (let i = 0; i < SETUP_METHODS.length; i++) {
    const y = dividerY + 15 + i * (methodHeight + methodGap);
    parts.push(roundedRect(methodX, y, methodW, methodHeight, {
      fill: DIAGRAM_PALETTE.surfaceAlt,
      rx: 4,
    }));
    parts.push(textLabel(methodX + methodW / 2, y + methodHeight / 2 + 5, SETUP_METHODS[i], {
      fontSize: 13,
      fontWeight: '500',
    }));
  }

  // Arrow from builder to factory
  const arrowStartX = builderX + builderW;
  const arrowY = builderY + builderH / 2;
  parts.push(arrowLine(arrowStartX, arrowY, factoryX - 4, arrowY, MARKER_ID));

  // "returns configured app" label above arrow
  parts.push(textLabel((arrowStartX + factoryX) / 2, arrowY - 12, 'returns configured app', {
    fontSize: 11,
    fill: DIAGRAM_PALETTE.textSecondary,
  }));

  // Factory box
  parts.push(roundedRect(factoryX, factoryY, factoryW, factoryH, {
    fill: DIAGRAM_PALETTE.surface,
    stroke: DIAGRAM_PALETTE.accent,
    strokeWidth: 2,
    rx: 8,
  }));

  // Factory label
  parts.push(textLabel(factoryX + factoryW / 2, factoryY + factoryH / 2 + 6, 'create_app()', {
    fontSize: 16,
    fontWeight: 'bold',
    fill: DIAGRAM_PALETTE.accent,
  }));

  parts.push('</svg>');
  return parts.join('\n');
}
