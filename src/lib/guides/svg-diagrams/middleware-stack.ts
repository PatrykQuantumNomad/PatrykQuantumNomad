/**
 * DIAG-01: Middleware Request Flow Stack
 *
 * Generates a build-time SVG showing the 8-layer middleware stack
 * in the FastAPI production template, from outermost (Trusted Host)
 * to innermost (Auth), with Request entry and FastAPI App exit.
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

const MIDDLEWARE_LAYERS = [
  'Trusted Host',
  'CORS',
  'Security Headers',
  'Rate Limiting',
  'Request ID',
  'Logging',
  'Prometheus Metrics',
  'Auth',
] as const;

const MARKER_ID = 'middleware-arrow';

/** Generate the middleware stack SVG diagram */
export function generateMiddlewareStack(): string {
  const config: DiagramConfig = { width: 720, height: 650, fontFamily: "'DM Sans', sans-serif" };

  const boxWidth = 280;
  const boxHeight = 38;
  const gap = 22;
  const startY = 80;
  const centerX = config.width / 2;
  const boxX = centerX - boxWidth / 2;

  const parts: string[] = [];

  // SVG open
  parts.push(diagramSvgOpen(config, 'Middleware request flow showing 8 layers from Trusted Host to Auth'));

  // Arrow marker definition
  parts.push(arrowMarkerDef(MARKER_ID));

  // "Request" label at top
  parts.push(textLabel(centerX, 30, 'Request', {
    fontSize: 16,
    fontWeight: 'bold',
    fill: DIAGRAM_PALETTE.accent,
  }));

  // Arrow from Request label to first layer
  parts.push(arrowLine(centerX, 40, centerX, startY - 4, MARKER_ID));

  // Middleware layers
  for (let i = 0; i < MIDDLEWARE_LAYERS.length; i++) {
    const y = startY + i * (boxHeight + gap);

    // Layer box
    parts.push(roundedRect(boxX, y, boxWidth, boxHeight));

    // Layer label
    parts.push(textLabel(centerX, y + boxHeight / 2 + 5, MIDDLEWARE_LAYERS[i], {
      fontSize: 14,
      fontWeight: '500',
    }));

    // Arrow to next layer (if not last)
    if (i < MIDDLEWARE_LAYERS.length - 1) {
      parts.push(arrowLine(centerX, y + boxHeight, centerX, y + boxHeight + gap - 4, MARKER_ID));
    }
  }

  // Arrow from last layer to FastAPI App
  const lastLayerBottom = startY + (MIDDLEWARE_LAYERS.length - 1) * (boxHeight + gap) + boxHeight;
  const appY = lastLayerBottom + gap + 20;
  parts.push(arrowLine(centerX, lastLayerBottom, centerX, appY - 12, MARKER_ID));

  // "FastAPI App" label at bottom
  parts.push(textLabel(centerX, appY, 'FastAPI App', {
    fontSize: 16,
    fontWeight: 'bold',
    fill: DIAGRAM_PALETTE.accent,
  }));

  parts.push('</svg>');
  return parts.join('\n');
}
