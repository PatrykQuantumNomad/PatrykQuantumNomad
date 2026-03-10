/**
 * DIAG-05: Agent Teams Architecture
 *
 * Generates a build-time SVG showing the multi-agent orchestration topology:
 * team lead, teammates, shared task list with state indicators, and mailbox
 * messaging. The entire diagram is wrapped in a dashed "Research Preview"
 * groupBox to convey the experimental status of the feature.
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
} from './diagram-base';

const MARKER_ID = 'team-arrow';

/** Generate the Agent Teams architecture SVG diagram */
export function generateAgentTeams(): string {
  const config: DiagramConfig = { width: 720, height: 500, fontFamily: "'DM Sans', sans-serif" };

  const parts: string[] = [];

  // SVG open
  parts.push(diagramSvgOpen(
    config,
    'Agent teams architecture (research preview): team lead, teammates, shared task list, and mailbox communication',
  ));

  // Arrow marker
  parts.push(arrowMarkerDef(MARKER_ID));

  // === Outer dashed groupBox: Research Preview ===
  parts.push(groupBox(15, 10, config.width - 30, config.height - 20, 'Research Preview', {
    dashed: true,
    titleFontSize: 12,
  }));

  // === Team Lead (top center) ===
  const leadW = 220;
  const leadH = 60;
  const leadX = config.width / 2 - leadW / 2;
  const leadY = 42;

  parts.push(roundedRect(leadX, leadY, leadW, leadH, {
    fill: DIAGRAM_PALETTE.surface,
    stroke: DIAGRAM_PALETTE.accent,
    strokeWidth: 2,
    rx: 8,
  }));
  parts.push(textLabel(leadX + leadW / 2, leadY + 25, 'Team Lead', {
    fontSize: 16,
    fontWeight: 'bold',
    fill: DIAGRAM_PALETTE.accent,
  }));
  parts.push(textLabel(leadX + leadW / 2, leadY + 45, 'Main session, coordinates work', {
    fontSize: 10,
    fill: DIAGRAM_PALETTE.textSecondary,
  }));

  // === Teammates (middle row) ===
  const tmW = 140;
  const tmH = 55;
  const tmY = 160;
  const tmSpacing = 170;
  const tmStartX = config.width / 2 - tmSpacing - tmW / 2;

  const teammates = [
    { label: 'Teammate 1', x: tmStartX },
    { label: 'Teammate 2', x: tmStartX + tmSpacing },
    { label: 'Teammate 3', x: tmStartX + 2 * tmSpacing },
  ];

  for (const tm of teammates) {
    parts.push(roundedRect(tm.x, tmY, tmW, tmH, {
      fill: DIAGRAM_PALETTE.surfaceAlt,
      stroke: DIAGRAM_PALETTE.border,
      rx: 6,
    }));
    parts.push(textLabel(tm.x + tmW / 2, tmY + 22, tm.label, {
      fontSize: 13,
      fontWeight: 'bold',
    }));
    parts.push(textLabel(tm.x + tmW / 2, tmY + 40, 'Separate context', {
      fontSize: 10,
      fill: DIAGRAM_PALETTE.textSecondary,
    }));

    // Bidirectional arrows: Team Lead <-> Teammate
    const tmCenterX = tm.x + tmW / 2;

    // Down arrow: Lead -> Teammate
    parts.push(arrowLine(
      tmCenterX - 8, leadY + leadH,
      tmCenterX - 8, tmY - 2,
      MARKER_ID,
    ));

    // Up arrow: Teammate -> Lead
    parts.push(arrowLine(
      tmCenterX + 8, tmY,
      tmCenterX + 8, leadY + leadH + 2,
      MARKER_ID,
    ));
  }

  // === Shared Task List (center panel below teammates) ===
  const taskBoxX = 60;
  const taskBoxY = 260;
  const taskBoxW = 380;
  const taskBoxH = 160;

  parts.push(groupBox(taskBoxX, taskBoxY, taskBoxW, taskBoxH, 'Shared Task List'));

  // Task items with state indicators
  const taskItemY = taskBoxY + 40;
  const taskItemX = taskBoxX + 20;
  const taskItemW = taskBoxW - 40;
  const taskItemH = 28;
  const taskGap = 8;

  // Task 1: pending
  parts.push(roundedRect(taskItemX, taskItemY, taskItemW, taskItemH, {
    fill: DIAGRAM_PALETTE.surfaceAlt,
    stroke: DIAGRAM_PALETTE.border,
    rx: 4,
    strokeWidth: 1,
  }));
  parts.push(textLabel(taskItemX + 14, taskItemY + 18, 'Implement auth module', {
    fontSize: 11,
    textAnchor: 'start',
  }));
  parts.push(textLabel(taskItemX + taskItemW - 14, taskItemY + 18, 'pending', {
    fontSize: 10,
    fill: DIAGRAM_PALETTE.textSecondary,
    textAnchor: 'end',
  }));

  // Task 2: in progress
  const task2Y = taskItemY + taskItemH + taskGap;
  parts.push(roundedRect(taskItemX, task2Y, taskItemW, taskItemH, {
    fill: DIAGRAM_PALETTE.surfaceAlt,
    stroke: DIAGRAM_PALETTE.accent,
    rx: 4,
    strokeWidth: 1.5,
  }));
  parts.push(textLabel(taskItemX + 14, task2Y + 18, 'Write test suite', {
    fontSize: 11,
    textAnchor: 'start',
  }));
  parts.push(textLabel(taskItemX + taskItemW - 14, task2Y + 18, 'in progress', {
    fontSize: 10,
    fill: DIAGRAM_PALETTE.accent,
    textAnchor: 'end',
  }));

  // Task 3: completed
  const task3Y = task2Y + taskItemH + taskGap;
  parts.push(roundedRect(taskItemX, task3Y, taskItemW, taskItemH, {
    fill: DIAGRAM_PALETTE.surfaceAlt,
    stroke: DIAGRAM_PALETTE.border,
    rx: 4,
    strokeWidth: 1,
  }));
  parts.push(textLabel(taskItemX + 14, task3Y + 18, 'Set up project scaffold', {
    fontSize: 11,
    textAnchor: 'start',
  }));
  parts.push(textLabel(taskItemX + taskItemW - 14, task3Y + 18, 'completed', {
    fontSize: 10,
    fill: DIAGRAM_PALETTE.textSecondary,
    textAnchor: 'end',
  }));

  // File-lock note
  parts.push(textLabel(taskBoxX + taskBoxW / 2, taskBoxY + taskBoxH - 10, 'File-lock-based claiming', {
    fontSize: 10,
    fill: DIAGRAM_PALETTE.textSecondary,
  }));

  // Arrows from teammates down to task list
  for (const tm of teammates) {
    const tmCenterX = tm.x + tmW / 2;
    if (tmCenterX < taskBoxX + taskBoxW) {
      parts.push(arrowLine(
        tmCenterX, tmY + tmH,
        tmCenterX, taskBoxY - 2,
        MARKER_ID,
      ));
    }
  }

  // === Mailbox (right side) ===
  const mailX = 480;
  const mailY = 270;
  const mailW = 190;
  const mailH = 120;

  parts.push(groupBox(mailX, mailY, mailW, mailH, 'Mailbox'));

  parts.push(textLabel(mailX + mailW / 2, mailY + 50, 'Message one', {
    fontSize: 12,
  }));
  parts.push(textLabel(mailX + mailW / 2, mailY + 72, 'Broadcast all', {
    fontSize: 12,
  }));

  // Arrow from rightmost teammate down to mailbox
  const rightTm = teammates[2];
  const rightTmCenterX = rightTm.x + tmW / 2;
  parts.push(arrowLine(
    rightTmCenterX + 20, tmY + tmH,
    mailX + mailW / 2, mailY - 2,
    MARKER_ID,
  ));

  // Arrow from mailbox back up toward middle teammate area
  parts.push(arrowLine(
    mailX, mailY + mailH / 2,
    taskBoxX + taskBoxW + 4, taskBoxY + taskBoxH / 2,
    MARKER_ID,
  ));

  // === Bottom note ===
  parts.push(textLabel(config.width / 2, config.height - 18, 'Teammates communicate directly (unlike subagents which only report back)', {
    fontSize: 10,
    fill: DIAGRAM_PALETTE.textSecondary,
  }));

  parts.push('</svg>');
  return parts.join('\n');
}
