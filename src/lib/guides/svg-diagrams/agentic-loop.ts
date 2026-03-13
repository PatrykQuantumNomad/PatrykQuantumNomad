/**
 * DIAG-01: Agentic Loop Cycle
 *
 * Generates a build-time SVG showing the three-phase agentic loop
 * (Gather Context -> Take Action -> Verify Results) with curved
 * directional arrows forming a continuous cycle, plus tool category labels.
 */

import {
  DIAGRAM_PALETTE,
  type DiagramConfig,
  diagramSvgOpen,
  roundedRect,
  arrowMarkerDef,
  textLabel,
  curvedPath,
} from './diagram-base';

const MARKER_ID = 'agentic-arrow';

/** Generate the Agentic Loop cycle SVG diagram */
export function generateAgenticLoop(): string {
  const config: DiagramConfig = { width: 720, height: 480, fontFamily: "'DM Sans', sans-serif" };

  const parts: string[] = [];

  // SVG open
  parts.push(diagramSvgOpen(config, 'Agentic loop cycle: gather context, take action, verify results'));

  // Arrow marker
  parts.push(arrowMarkerDef(MARKER_ID));

  // === Phase box dimensions ===
  const boxW = 240;
  const boxH = 75;

  // Triangular layout: top-center, bottom-left, bottom-right
  const gatherX = config.width / 2 - boxW / 2;
  const gatherY = 40;

  const actionX = config.width / 2 + 70;
  const actionY = 260;

  const verifyX = config.width / 2 - 70 - boxW;
  const verifyY = 260;

  // === Phase 1: Gather Context (top center) ===
  parts.push(roundedRect(gatherX, gatherY, boxW, boxH, {
    fill: DIAGRAM_PALETTE.surface,
    stroke: DIAGRAM_PALETTE.accent,
    strokeWidth: 2,
    rx: 8,
  }));
  parts.push(textLabel(gatherX + boxW / 2, gatherY + 28, 'Gather Context', {
    fontSize: 15,
    fontWeight: 'bold',
    fill: DIAGRAM_PALETTE.accent,
  }));
  parts.push(textLabel(gatherX + boxW / 2, gatherY + 50, 'Read files, search code, explore codebase', {
    fontSize: 11,
    fill: DIAGRAM_PALETTE.textSecondary,
  }));

  // === Phase 2: Take Action (bottom right) ===
  parts.push(roundedRect(actionX, actionY, boxW, boxH, {
    fill: DIAGRAM_PALETTE.surface,
    stroke: DIAGRAM_PALETTE.accent,
    strokeWidth: 2,
    rx: 8,
  }));
  parts.push(textLabel(actionX + boxW / 2, actionY + 28, 'Take Action', {
    fontSize: 15,
    fontWeight: 'bold',
    fill: DIAGRAM_PALETTE.accent,
  }));
  parts.push(textLabel(actionX + boxW / 2, actionY + 50, 'Edit files, run commands, create files', {
    fontSize: 11,
    fill: DIAGRAM_PALETTE.textSecondary,
  }));

  // === Phase 3: Verify Results (bottom left) ===
  parts.push(roundedRect(verifyX, verifyY, boxW, boxH, {
    fill: DIAGRAM_PALETTE.surface,
    stroke: DIAGRAM_PALETTE.accent,
    strokeWidth: 2,
    rx: 8,
  }));
  parts.push(textLabel(verifyX + boxW / 2, verifyY + 28, 'Verify Results', {
    fontSize: 15,
    fontWeight: 'bold',
    fill: DIAGRAM_PALETTE.accent,
  }));
  parts.push(textLabel(verifyX + boxW / 2, verifyY + 50, 'Run tests, check output, validate changes', {
    fontSize: 11,
    fill: DIAGRAM_PALETTE.textSecondary,
  }));

  // === Curved arrows connecting the cycle ===
  // Gather -> Action (top-center to bottom-right)
  parts.push(curvedPath(
    gatherX + boxW, gatherY + boxH / 2,   // right edge of Gather
    config.width / 2 + 160, 150,           // control point (right arc)
    actionX + boxW / 2, actionY,           // top edge of Action
    MARKER_ID,
  ));

  // Action -> Verify (bottom-right to bottom-left)
  parts.push(curvedPath(
    actionX, actionY + boxH / 2,           // left edge of Action
    config.width / 2, actionY + boxH + 50, // control point (bottom arc)
    verifyX + boxW, verifyY + boxH / 2,    // right edge of Verify
    MARKER_ID,
  ));

  // Verify -> Gather (bottom-left to top-center)
  parts.push(curvedPath(
    verifyX + boxW / 2, verifyY,           // top edge of Verify
    config.width / 2 - 160, 150,           // control point (left arc)
    gatherX, gatherY + boxH / 2,           // left edge of Gather
    MARKER_ID,
  ));

  // === Tool categories (center area) ===
  const toolCenterX = config.width / 2;
  const toolStartY = 170;
  const toolSpacing = 22;

  parts.push(textLabel(toolCenterX, toolStartY, 'Tool Categories', {
    fontSize: 12,
    fontWeight: 'bold',
    fill: DIAGRAM_PALETTE.text,
  }));

  const tools = ['File operations', 'Search', 'Execution', 'Web', 'Code intelligence'];
  tools.forEach((tool, i) => {
    parts.push(textLabel(toolCenterX, toolStartY + 22 + i * toolSpacing, tool, {
      fontSize: 11,
      fill: DIAGRAM_PALETTE.textSecondary,
    }));
  });

  parts.push('</svg>');
  return parts.join('\n');
}
