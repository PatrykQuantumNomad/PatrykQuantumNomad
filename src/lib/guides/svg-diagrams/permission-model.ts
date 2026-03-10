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

/** Generate the Permission Model flowchart SVG diagram */
export function generatePermissionModel(): string {
  const config: DiagramConfig = { width: 720, height: 600, fontFamily: "'DM Sans', sans-serif" };
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
  const diamondSize = 28;

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
    textLabel(flowX, entryY + entryH / 2 + 5, 'Tool Call Request', {
      fontSize: 14,
      fontWeight: 'bold',
      fill: DIAGRAM_PALETTE.accent,
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

  const diamondStartY = 110;
  const diamondSpacing = 130;
  const resultBoxW = 140;
  const resultBoxH = 48;
  const resultOffsetX = 175; // horizontal offset for Yes-branch result boxes

  let prevBottomY = entryY + entryH;

  for (let i = 0; i < decisions.length; i++) {
    const d = decisions[i];
    const cy = diamondStartY + i * diamondSpacing;

    // Arrow from previous element to this diamond
    parts.push(arrowLine(flowX, prevBottomY, flowX, cy - diamondSize - 2, MARKER_ID));

    // Diamond
    parts.push(diamondNode(flowX, cy, diamondSize));
    parts.push(
      textLabel(flowX, cy + 4, d.label, { fontSize: 11, fontWeight: 'bold' }),
    );

    // "No" label on the downward path
    if (i < decisions.length - 1) {
      parts.push(
        textLabel(flowX + 14, cy + diamondSize + 14, 'No', {
          fontSize: 10,
          fill: DIAGRAM_PALETTE.textSecondary,
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
      textLabel(resultCenterX, cy + 1, d.yesLabel, {
        fontSize: 13,
        fontWeight: 'bold',
        fill: d.yesAccent ? DIAGRAM_PALETTE.accentSecondary : DIAGRAM_PALETTE.text,
      }),
    );
    parts.push(
      textLabel(resultCenterX, cy + 16, d.yesSub, {
        fontSize: 9,
        fill: DIAGRAM_PALETTE.textSecondary,
      }),
    );

    prevBottomY = cy + diamondSize;
  }

  // After the last diamond (Allow), "No" path leads to "Default: Ask"
  const lastDiamondY = diamondStartY + 2 * diamondSpacing;
  const defaultBoxW = 140;
  const defaultBoxH = 36;
  const defaultY = lastDiamondY + diamondSize + 16;

  parts.push(
    textLabel(flowX + 14, lastDiamondY + diamondSize + 14, 'No', {
      fontSize: 10,
      fill: DIAGRAM_PALETTE.textSecondary,
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
    textLabel(flowX, defaultY + defaultBoxH / 2 + 5, 'Default: Ask', {
      fontSize: 13,
      fontWeight: 'bold',
    }),
  );

  // =========================================================
  // Side panel (right): Tool Tiers
  // =========================================================
  const tierX = 530;
  const tierW = 170;
  const tierBoxH = 38;
  const tierStartY = 90;
  const tierGap = 52;

  parts.push(
    textLabel(tierX + tierW / 2, tierStartY - 10, 'Tool Tiers', {
      fontSize: 13,
      fontWeight: 'bold',
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
      textLabel(tierX + tierW / 2, ty + 16, tiers[i].name, {
        fontSize: 12,
        fontWeight: 'bold',
      }),
    );
    parts.push(
      textLabel(tierX + tierW / 2, ty + 30, tiers[i].sub, {
        fontSize: 9,
        fill: DIAGRAM_PALETTE.textSecondary,
      }),
    );
  }

  // =========================================================
  // Settings precedence bar (bottom)
  // =========================================================
  const precY = 480;
  const precW = 560;
  const precH = 32;
  const precX = (config.width - precW) / 2;

  parts.push(
    textLabel(config.width / 2, precY - 8, 'Settings Precedence', {
      fontSize: 12,
      fontWeight: 'bold',
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
    textLabel(config.width / 2, precY + precH / 2 + 5, 'Managed  >  CLI  >  Local  >  Shared  >  User', {
      fontSize: 12,
      fill: DIAGRAM_PALETTE.textSecondary,
    }),
  );

  // =========================================================
  // Permission modes (bottom labels)
  // =========================================================
  const modeY = 540;
  const modes = ['default', 'acceptEdits', 'plan', 'dontAsk', 'bypassPermissions'];
  const modeStartX = 90;
  const modeSpacingX = 115;

  parts.push(
    textLabel(config.width / 2, modeY - 8, 'Permission Modes', {
      fontSize: 12,
      fontWeight: 'bold',
    }),
  );

  for (let i = 0; i < modes.length; i++) {
    const mx = modeStartX + i * modeSpacingX;
    const mw = 100;
    const mh = 22;
    parts.push(
      roundedRect(mx, modeY, mw, mh, {
        fill: DIAGRAM_PALETTE.surface,
        stroke: DIAGRAM_PALETTE.border,
        rx: 3,
        strokeWidth: 1,
      }),
    );
    parts.push(
      textLabel(mx + mw / 2, modeY + mh / 2 + 4, modes[i], {
        fontSize: 9,
        fill: DIAGRAM_PALETTE.textSecondary,
      }),
    );
  }

  // =========================================================
  // Close SVG
  // =========================================================
  parts.push('</svg>');
  return parts.join('\n');
}
