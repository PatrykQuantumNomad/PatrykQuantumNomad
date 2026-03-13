/**
 * DIAG-03: Permission Model Flowchart
 *
 * Generates a build-time SVG showing the deny->ask->allow evaluation
 * order with diamond decision nodes, tool tier reference panel,
 * settings precedence bar, and permission mode labels.
 */

import {
  DIAGRAM_PALETTE,
  type DiagramConfig,
  diagramSvgOpen,
  roundedRect,
  arrowLine,
  arrowMarkerDef,
  textLabel,
  diamondNode,
} from './diagram-base';

const MARKER_ID = 'perm-arrow';

// Shorthand for central baseline used throughout this diagram
const central = 'central' as const;

/** Generate the Permission Model flowchart SVG diagram */
export function generatePermissionModel(): string {
  const config: DiagramConfig = { width: 720, height: 700, fontFamily: "'DM Sans', sans-serif" };
  const parts: string[] = [];

  // -- SVG open --
  parts.push(
    diagramSvgOpen(
      config,
      'Permission model: deny, ask, allow evaluation flowchart with tool tiers and permission modes',
    ),
  );

  // -- Arrow marker --
  parts.push(arrowMarkerDef(MARKER_ID));

  // =========================================================
  // Layout constants
  // =========================================================
  const flowX = 220; // center-x of the main flow column
  const diamondSize = 55;

  // -- Entry: Tool Call Request --
  const entryW = 190;
  const entryH = 42;
  const entryX = flowX - entryW / 2;
  const entryY = 24;

  parts.push(
    roundedRect(entryX, entryY, entryW, entryH, {
      fill: DIAGRAM_PALETTE.surface,
      stroke: DIAGRAM_PALETTE.accent,
      strokeWidth: 2,
      rx: 8,
    }),
  );
  parts.push(
    textLabel(flowX, entryY + entryH / 2, 'Tool Call Request', {
      fontSize: 14,
      fontWeight: 'bold',
      fill: DIAGRAM_PALETTE.accent,
      dominantBaseline: central,
    }),
  );

  // =========================================================
  // Decision chain: Deny -> Ask -> Allow
  // =========================================================
  const decisions = [
    {
      label: 'Deny rules match?',
      yesLabel: 'BLOCKED',
      yesSub: 'Tool call rejected',
      yesAccent: true, // uses accentSecondary
    },
    {
      label: 'Ask rules match?',
      yesLabel: 'Prompt User',
      yesSub: 'User approves/denies',
      yesAccent: false,
    },
    {
      label: 'Allow rules match?',
      yesLabel: 'ALLOWED',
      yesSub: 'Tool call proceeds',
      yesAccent: false,
    },
  ];

  const diamondStartY = 130;
  const diamondSpacing = 160;
  const resultBoxW = 150;
  const resultBoxH = 48;
  const resultOffsetX = 180; // horizontal offset for Yes-branch result boxes

  let prevBottomY = entryY + entryH;

  for (let i = 0; i < decisions.length; i++) {
    const d = decisions[i];
    const cy = diamondStartY + i * diamondSpacing;

    // Arrow from previous element to this diamond
    parts.push(arrowLine(flowX, prevBottomY, flowX, cy - diamondSize - 2, MARKER_ID));

    // Diamond
    parts.push(diamondNode(flowX, cy, diamondSize));
    parts.push(
      textLabel(flowX, cy, d.label, {
        fontSize: 10,
        fontWeight: 'bold',
        dominantBaseline: central,
      }),
    );

    // "No" label on the downward path
    if (i < decisions.length - 1) {
      parts.push(
        textLabel(flowX + 14, cy + diamondSize + 14, 'No', {
          fontSize: 10,
          fill: DIAGRAM_PALETTE.textSecondary,
          dominantBaseline: central,
        }),
      );
    }

    // "Yes" branch -- arrow right to result box
    const resultX = flowX + resultOffsetX - resultBoxW / 2;
    const resultCenterX = flowX + resultOffsetX;

    parts.push(arrowLine(flowX + diamondSize, cy, resultX - 4, cy, MARKER_ID));
    parts.push(
      textLabel(flowX + diamondSize + 12, cy - 6, 'Yes', {
        fontSize: 10,
        fill: DIAGRAM_PALETTE.textSecondary,
        dominantBaseline: central,
      }),
    );

    // Result box
    parts.push(
      roundedRect(resultX, cy - resultBoxH / 2, resultBoxW, resultBoxH, {
        fill: d.yesAccent ? DIAGRAM_PALETTE.surfaceAlt : DIAGRAM_PALETTE.surfaceAlt,
        stroke: d.yesAccent ? DIAGRAM_PALETTE.accentSecondary : DIAGRAM_PALETTE.border,
        strokeWidth: d.yesAccent ? 2 : 1.5,
        rx: 6,
      }),
    );
    parts.push(
      textLabel(resultCenterX, cy - 8, d.yesLabel, {
        fontSize: 13,
        fontWeight: 'bold',
        fill: d.yesAccent ? DIAGRAM_PALETTE.accentSecondary : DIAGRAM_PALETTE.text,
        dominantBaseline: central,
      }),
    );
    parts.push(
      textLabel(resultCenterX, cy + 10, d.yesSub, {
        fontSize: 9,
        fill: DIAGRAM_PALETTE.textSecondary,
        dominantBaseline: central,
      }),
    );

    prevBottomY = cy + diamondSize;
  }

  // After the last diamond (Allow), "No" path leads to "Default: Ask"
  const lastDiamondY = diamondStartY + 2 * diamondSpacing;
  const defaultBoxW = 140;
  const defaultBoxH = 36;
  const defaultY = lastDiamondY + diamondSize + 40;

  parts.push(
    textLabel(flowX + 14, lastDiamondY + diamondSize + 14, 'No', {
      fontSize: 10,
      fill: DIAGRAM_PALETTE.textSecondary,
      dominantBaseline: central,
    }),
  );
  parts.push(arrowLine(flowX, lastDiamondY + diamondSize, flowX, defaultY - 2, MARKER_ID));
  parts.push(
    roundedRect(flowX - defaultBoxW / 2, defaultY, defaultBoxW, defaultBoxH, {
      fill: DIAGRAM_PALETTE.surfaceAlt,
      stroke: DIAGRAM_PALETTE.border,
      rx: 6,
    }),
  );
  parts.push(
    textLabel(flowX, defaultY + defaultBoxH / 2, 'Default: Ask', {
      fontSize: 13,
      fontWeight: 'bold',
      dominantBaseline: central,
    }),
  );

  // =========================================================
  // Side panel (right): Tool Tiers
  // =========================================================
  const tierX = 530;
  const tierW = 170;
  const tierBoxH = 44;
  const tierStartY = 90;
  const tierGap = 58;

  parts.push(
    textLabel(tierX + tierW / 2, tierStartY - 10, 'Tool Tiers', {
      fontSize: 13,
      fontWeight: 'bold',
      dominantBaseline: central,
    }),
  );

  const tiers = [
    { name: 'Read-only', sub: 'No approval needed' },
    { name: 'Bash commands', sub: 'Permanent per project' },
    { name: 'File modification', sub: 'Until session end' },
  ];

  for (let i = 0; i < tiers.length; i++) {
    const ty = tierStartY + i * tierGap;
    parts.push(
      roundedRect(tierX, ty, tierW, tierBoxH, {
        fill: DIAGRAM_PALETTE.surfaceAlt,
        stroke: DIAGRAM_PALETTE.border,
        rx: 6,
      }),
    );
    parts.push(
      textLabel(tierX + tierW / 2, ty + tierBoxH / 2 - 8, tiers[i].name, {
        fontSize: 12,
        fontWeight: 'bold',
        dominantBaseline: central,
      }),
    );
    parts.push(
      textLabel(tierX + tierW / 2, ty + tierBoxH / 2 + 8, tiers[i].sub, {
        fontSize: 9,
        fill: DIAGRAM_PALETTE.textSecondary,
        dominantBaseline: central,
      }),
    );
  }

  // =========================================================
  // Settings precedence bar (bottom)
  // =========================================================
  const precY = 610;
  const precW = 560;
  const precH = 34;
  const precX = (config.width - precW) / 2;

  parts.push(
    textLabel(config.width / 2, precY - 10, 'Settings Precedence', {
      fontSize: 12,
      fontWeight: 'bold',
      dominantBaseline: central,
    }),
  );
  parts.push(
    roundedRect(precX, precY, precW, precH, {
      fill: DIAGRAM_PALETTE.surfaceAlt,
      stroke: DIAGRAM_PALETTE.border,
      rx: 4,
    }),
  );
  parts.push(
    textLabel(config.width / 2, precY + precH / 2, 'Managed  >  CLI  >  Local  >  Shared  >  User', {
      fontSize: 12,
      fill: DIAGRAM_PALETTE.textSecondary,
      dominantBaseline: central,
    }),
  );

  // =========================================================
  // Permission modes (bottom labels)
  // =========================================================
  const modeY = 670;
  const modes = ['default', 'acceptEdits', 'plan', 'dontAsk', 'bypassPermissions'];
  const modeBoxWidths = [80, 100, 60, 80, 130];
  const modeGap = 12;

  parts.push(
    textLabel(config.width / 2, modeY - 10, 'Permission Modes', {
      fontSize: 12,
      fontWeight: 'bold',
      dominantBaseline: central,
    }),
  );

  // Calculate total width and starting x for centering
  const totalModeW = modeBoxWidths.reduce((a, b) => a + b, 0) + modeGap * (modes.length - 1);
  let modeX = (config.width - totalModeW) / 2;

  for (let i = 0; i < modes.length; i++) {
    const mw = modeBoxWidths[i];
    const mh = 26;
    parts.push(
      roundedRect(modeX, modeY, mw, mh, {
        fill: DIAGRAM_PALETTE.surface,
        stroke: DIAGRAM_PALETTE.border,
        rx: 3,
        strokeWidth: 1,
      }),
    );
    parts.push(
      textLabel(modeX + mw / 2, modeY + mh / 2, modes[i], {
        fontSize: 9,
        fill: DIAGRAM_PALETTE.textSecondary,
        dominantBaseline: central,
      }),
    );
    modeX += mw + modeGap;
  }

  // =========================================================
  // Close SVG
  // =========================================================
  parts.push('</svg>');
  return parts.join('\n');
}
