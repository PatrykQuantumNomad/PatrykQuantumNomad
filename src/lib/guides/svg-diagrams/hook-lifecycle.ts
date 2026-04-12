/**
 * DIAG-02: Hook Lifecycle Event Flow
 *
 * Generates a build-time SVG showing all 24 hook lifecycle events
 * grouped into three categories: Session Events (2), Loop Events (15),
 * and Standalone Async Events (7). PreToolUse is highlighted with a
 * "CAN BLOCK" indicator.
 */

import {
  DIAGRAM_PALETTE,
  type DiagramConfig,
  diagramSvgOpen,
  roundedRect,
  arrowLine,
  arrowMarkerDef,
  textLabel,
  groupBox,
  curvedPath,
} from './diagram-base';

const MARKER_ID = 'hook-arrow';

/** Small event box dimensions */
const EVENT_W = 140;
const EVENT_H = 28;

/** Render a single event box at the given position */
function eventBox(
  parts: string[],
  x: number,
  y: number,
  label: string,
  opts: { highlight?: boolean } = {},
): void {
  const stroke = opts.highlight ? DIAGRAM_PALETTE.accent : DIAGRAM_PALETTE.border;
  const strokeWidth = opts.highlight ? 2 : 1.5;

  parts.push(roundedRect(x, y, EVENT_W, EVENT_H, {
    fill: DIAGRAM_PALETTE.surfaceAlt,
    stroke,
    strokeWidth,
    rx: 4,
  }));
  parts.push(textLabel(x + EVENT_W / 2, y + EVENT_H / 2 + 5, label, {
    fontSize: 11,
    fill: DIAGRAM_PALETTE.text,
  }));

  // "CAN BLOCK" indicator for PreToolUse
  if (opts.highlight) {
    parts.push(textLabel(x + EVENT_W + 8, y + EVENT_H / 2 + 4, 'CAN BLOCK', {
      fontSize: 9,
      fontWeight: 'bold',
      fill: DIAGRAM_PALETTE.accent,
      textAnchor: 'start',
    }));
  }
}

/** Generate the Hook Lifecycle event flow SVG diagram */
export function generateHookLifecycle(): string {
  const config: DiagramConfig = { width: 720, height: 1020, fontFamily: "'DM Sans', sans-serif" };

  const parts: string[] = [];

  // SVG open
  parts.push(diagramSvgOpen(config, 'Hook lifecycle: 24 event types across session, loop, and async categories'));

  // Arrow marker
  parts.push(arrowMarkerDef(MARKER_ID));

  // === Layout constants ===
  const mainCol = 80; // x offset for main flow column
  const asyncCol = 500; // x offset for async events column
  const eventSpacing = 36; // vertical spacing between events

  // ========================================
  // Category 1: Session Events (top)
  // ========================================
  const sessionY = 20;
  const sessionBoxH = 90;
  parts.push(groupBox(mainCol - 20, sessionY, 340, sessionBoxH, 'Session Events', { dashed: true }));

  // SessionStart
  const ssY = sessionY + 30;
  eventBox(parts, mainCol, ssY, 'SessionStart');

  // Arrow from SessionStart to loop section
  const sessionEndArrowY = sessionY + sessionBoxH;
  parts.push(arrowLine(mainCol + EVENT_W / 2, ssY + EVENT_H, mainCol + EVENT_W / 2, sessionEndArrowY + 16, MARKER_ID));

  // ========================================
  // Category 2: Loop Events (middle)
  // ========================================
  const loopY = sessionEndArrowY + 20;

  const loopEvents = [
    { name: 'UserPromptSubmit', highlight: false },
    { name: 'PreToolUse', highlight: true },
    { name: 'PermissionRequest', highlight: false },
    { name: 'PermissionDenied', highlight: false },
    { name: 'PostToolUse', highlight: false },
    { name: 'PostToolUseFailure', highlight: false },
    { name: 'Notification', highlight: false },
    { name: 'SubagentStart', highlight: false },
    { name: 'SubagentStop', highlight: false },
    { name: 'Stop', highlight: false },
    { name: 'TeammateIdle', highlight: false },
    { name: 'TaskCompleted', highlight: false },
    { name: 'PreCompact', highlight: false },
    { name: 'Elicitation', highlight: false },
    { name: 'ElicitationResult', highlight: false },
  ];

  const loopBoxH = loopEvents.length * eventSpacing + 40;
  parts.push(groupBox(mainCol - 20, loopY, 340, loopBoxH, 'Loop Events', { dashed: true }));

  // Render loop event boxes
  loopEvents.forEach((evt, i) => {
    const ey = loopY + 30 + i * eventSpacing;
    eventBox(parts, mainCol, ey, evt.name, { highlight: evt.highlight });

    // Arrow between consecutive events (except after last)
    if (i < loopEvents.length - 1) {
      parts.push(arrowLine(
        mainCol + EVENT_W / 2, ey + EVENT_H,
        mainCol + EVENT_W / 2, ey + eventSpacing,
        MARKER_ID,
      ));
    }
  });

  // Loop-back arrow: from last loop event back to first (UserPromptSubmit)
  const lastLoopEventY = loopY + 30 + (loopEvents.length - 1) * eventSpacing;
  const firstLoopEventY = loopY + 30;
  parts.push(curvedPath(
    mainCol, lastLoopEventY + EVENT_H / 2,        // left of last event
    mainCol - 50, (firstLoopEventY + lastLoopEventY) / 2, // control point (left arc)
    mainCol, firstLoopEventY + EVENT_H / 2,        // left of first event
    MARKER_ID,
  ));

  // "Repeats" label on loop-back arrow
  parts.push(textLabel(mainCol - 52, (firstLoopEventY + lastLoopEventY) / 2 + 4, 'Repeats', {
    fontSize: 9,
    fill: DIAGRAM_PALETTE.textSecondary,
    textAnchor: 'end',
  }));

  // Arrow from loop section to SessionEnd
  const loopEndY = loopY + loopBoxH;
  parts.push(arrowLine(mainCol + EVENT_W / 2, loopEndY, mainCol + EVENT_W / 2, loopEndY + 16, MARKER_ID));

  // SessionEnd (below loop section)
  const seY = loopEndY + 20;
  parts.push(groupBox(mainCol - 20, seY, 340, 55, '', { dashed: false }));
  eventBox(parts, mainCol, seY + 14, 'SessionEnd');

  // ========================================
  // Category 3: Standalone Async Events (right side)
  // ========================================
  const asyncY = loopY + 20;
  const asyncEvents = [
    'InstructionsLoaded',
    'ConfigChange',
    'WorktreeCreate',
    'WorktreeRemove',
    'CwdChanged',
    'FileChanged',
    'PermissionDenied',
  ];

  const asyncBoxH = asyncEvents.length * eventSpacing + 40;
  parts.push(groupBox(asyncCol - 20, asyncY, 220, asyncBoxH, 'Standalone Async Events', { dashed: true, titleFontSize: 10 }));

  asyncEvents.forEach((name, i) => {
    const ey = asyncY + 30 + i * eventSpacing;
    eventBox(parts, asyncCol, ey, name);
  });

  // "Fires independently" label below async box
  parts.push(textLabel(asyncCol + 90, asyncY + asyncBoxH + 18, 'Fire independently of main flow', {
    fontSize: 9,
    fill: DIAGRAM_PALETTE.textSecondary,
  }));

  // Dashed connection line from async section toward main flow
  parts.push(`<line x1="${asyncCol - 20}" y1="${asyncY + asyncBoxH / 2}" x2="${mainCol + 320}" y2="${asyncY + asyncBoxH / 2}" stroke="${DIAGRAM_PALETTE.border}" stroke-width="1" stroke-dasharray="4,4" />`);

  parts.push('</svg>');
  return parts.join('\n');
}
