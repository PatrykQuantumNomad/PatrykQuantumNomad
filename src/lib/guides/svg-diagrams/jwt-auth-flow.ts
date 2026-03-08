/**
 * DIAG-03: JWT Authentication Flow
 *
 * Generates a build-time SVG showing the JWT token validation flow
 * branching into 3 modes: Shared Secret (HMAC), Static Key (RSA/EC),
 * and JWKS (remote key set), converging at Validated Claims.
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

const MARKER_ID = 'jwt-arrow';

/** Generate the JWT auth flow SVG diagram */
export function generateJwtAuthFlow(): string {
  const config: DiagramConfig = { width: 720, height: 550, fontFamily: "'DM Sans', sans-serif" };

  const centerX = config.width / 2;
  const entryBoxW = 200;
  const entryBoxH = 50;
  const entryX = centerX - entryBoxW / 2;
  const entryY = 30;

  // Mode boxes
  const modeBoxW = 180;
  const modeBoxH = 100;
  const modeY = 220;
  const modeSpacing = 220;
  const modePositions = [
    centerX - modeSpacing - modeBoxW / 2, // left
    centerX - modeBoxW / 2,               // center
    centerX + modeSpacing - modeBoxW / 2, // right
  ];

  // Exit box
  const exitBoxW = 240;
  const exitBoxH = 50;
  const exitX = centerX - exitBoxW / 2;
  const exitY = 440;

  // Decision diamond
  const diamondCY = 150;
  const diamondSize = 30;

  const parts: string[] = [];

  // SVG open
  parts.push(diagramSvgOpen(config, 'JWT authentication flow showing 3 validation modes: Shared Secret, Static Key, and JWKS'));

  // Arrow marker
  parts.push(arrowMarkerDef(MARKER_ID));

  // Entry box: JWT Token
  parts.push(roundedRect(entryX, entryY, entryBoxW, entryBoxH, {
    fill: DIAGRAM_PALETTE.surface,
    stroke: DIAGRAM_PALETTE.accent,
    strokeWidth: 2,
    rx: 8,
  }));
  parts.push(textLabel(centerX, entryY + entryBoxH / 2 + 6, 'JWT Token', {
    fontSize: 16,
    fontWeight: 'bold',
    fill: DIAGRAM_PALETTE.accent,
  }));

  // Arrow from entry to diamond
  parts.push(arrowLine(centerX, entryY + entryBoxH, centerX, diamondCY - diamondSize - 2, MARKER_ID));

  // Decision diamond
  parts.push(`<polygon points="${centerX},${diamondCY - diamondSize} ${centerX + diamondSize},${diamondCY} ${centerX},${diamondCY + diamondSize} ${centerX - diamondSize},${diamondCY}" fill="${DIAGRAM_PALETTE.surfaceAlt}" stroke="${DIAGRAM_PALETTE.border}" stroke-width="1.5" />`);
  parts.push(textLabel(centerX, diamondCY + 5, 'mode?', {
    fontSize: 12,
    fontWeight: 'bold',
  }));

  // Mode data
  const modes = [
    { name: 'Shared Secret', sub: 'HMAC' },
    { name: 'Static Key', sub: 'RSA / EC public key' },
    { name: 'JWKS', sub: 'Remote key set + caching' },
  ];

  for (let i = 0; i < 3; i++) {
    const mx = modePositions[i];
    const modeCenterX = mx + modeBoxW / 2;

    // Arrow from diamond to mode box
    parts.push(arrowLine(
      i === 0 ? centerX - diamondSize : i === 2 ? centerX + diamondSize : centerX,
      i === 1 ? diamondCY + diamondSize : diamondCY,
      modeCenterX,
      modeY - 4,
      MARKER_ID,
    ));

    // Mode box
    parts.push(roundedRect(mx, modeY, modeBoxW, modeBoxH, {
      fill: DIAGRAM_PALETTE.surfaceAlt,
      stroke: DIAGRAM_PALETTE.border,
      rx: 6,
    }));

    // Mode name
    parts.push(textLabel(modeCenterX, modeY + 35, modes[i].name, {
      fontSize: 15,
      fontWeight: 'bold',
    }));

    // Mode sub-label
    parts.push(textLabel(modeCenterX, modeY + 60, modes[i].sub, {
      fontSize: 11,
      fill: DIAGRAM_PALETTE.textSecondary,
    }));

    // Arrow from mode box to exit
    parts.push(arrowLine(modeCenterX, modeY + modeBoxH, centerX, exitY - 4, MARKER_ID));
  }

  // Exit box: Validated Claims
  parts.push(roundedRect(exitX, exitY, exitBoxW, exitBoxH, {
    fill: DIAGRAM_PALETTE.surface,
    stroke: DIAGRAM_PALETTE.accent,
    strokeWidth: 2,
    rx: 8,
  }));
  parts.push(textLabel(centerX, exitY + exitBoxH / 2 + 6, 'Validated Claims', {
    fontSize: 16,
    fontWeight: 'bold',
    fill: DIAGRAM_PALETTE.accent,
  }));

  parts.push('</svg>');
  return parts.join('\n');
}
