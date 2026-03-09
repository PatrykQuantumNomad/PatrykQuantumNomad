/**
 * DIAG-04: ISO 25010 Product Quality Tree
 *
 * Generates a build-time SVG hierarchical tree diagram of the ISO 25010
 * software product quality model (current revision). Shows 9 top-level
 * characteristics with their sub-characteristics.
 */

import {
  DIAGRAM_PALETTE,
  type DiagramConfig,
  diagramSvgOpen,
} from './diagram-base';

/* ------------------------------------------------------------------ */
/*  Data model                                                         */
/* ------------------------------------------------------------------ */

interface QualityCharacteristic {
  name: string;
  subs: string[];
}

const CHARACTERISTICS: QualityCharacteristic[] = [
  {
    name: 'Functional\nSuitability',
    subs: ['Functional\ncompleteness', 'Functional\ncorrectness', 'Functional\nappropriateness'],
  },
  {
    name: 'Performance\nEfficiency',
    subs: ['Time\nbehaviour', 'Resource\nutilization', 'Capacity'],
  },
  {
    name: 'Compatibility',
    subs: ['Co-existence', 'Interoperability'],
  },
  {
    name: 'Interaction\nCapability',
    subs: [
      'Appropriateness\nrecognizability',
      'Learnability',
      'Operability',
      'User error\nprotection',
      'User\nengagement',
      'Inclusivity',
      'User\nassistance',
      'Self-\ndescriptiveness',
    ],
  },
  {
    name: 'Reliability',
    subs: ['Faultlessness', 'Availability', 'Fault\ntolerance', 'Recoverability'],
  },
  {
    name: 'Security',
    subs: ['Confidentiality', 'Integrity', 'Non-repudiation', 'Accountability', 'Authenticity', 'Resistance'],
  },
  {
    name: 'Maintain-\nability',
    subs: ['Modularity', 'Reusability', 'Analysability', 'Modifiability', 'Testability'],
  },
  {
    name: 'Flexibility',
    subs: ['Adaptability', 'Scalability', 'Installability', 'Replaceability'],
  },
  {
    name: 'Safety',
    subs: ['Operational\nconstraint', 'Risk\nidentification', 'Fail safe', 'Hazard\nwarning', 'Safe\nintegration'],
  },
];

/* ------------------------------------------------------------------ */
/*  Layout constants                                                   */
/* ------------------------------------------------------------------ */

const WIDTH = 900;

// Root box
const ROOT_W = 180;
const ROOT_H = 44;
const ROOT_X = (WIDTH - ROOT_W) / 2;
const ROOT_Y = 20;

// Characteristic boxes row
const CHAR_Y = 120;
const CHAR_H = 44;
const CHAR_GAP = 6;
const TOTAL_CHARS = CHARACTERISTICS.length;
const SIDE_PAD = 10;
const CHAR_W = (WIDTH - 2 * SIDE_PAD - (TOTAL_CHARS - 1) * CHAR_GAP) / TOTAL_CHARS;

// Sub-characteristics
const SUB_Y_START = 198;
const SUB_LINE_HEIGHT = 13;
const SUB_FONT_SIZE = 9;

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const P = DIAGRAM_PALETTE;
const FONT = "'DM Sans', sans-serif";

function escapeXml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/** Render multiline text centered in a box */
function multilineText(
  cx: number,
  cy: number,
  text: string,
  fontSize: number,
  fontWeight: string,
  fill: string,
): string {
  const lines = text.split('\n');
  const totalHeight = lines.length * fontSize * 1.2;
  const startY = cy - totalHeight / 2 + fontSize * 0.85;

  return lines
    .map(
      (line, i) =>
        `<text x="${cx}" y="${(startY + i * fontSize * 1.2).toFixed(1)}" text-anchor="middle" font-size="${fontSize}" font-weight="${fontWeight}" fill="${fill}" font-family="${FONT}">${escapeXml(line)}</text>`,
    )
    .join('\n');
}

/** Column x position (left edge) for characteristic index */
function charX(i: number): number {
  return SIDE_PAD + i * (CHAR_W + CHAR_GAP);
}

/* ------------------------------------------------------------------ */
/*  SVG generation                                                     */
/* ------------------------------------------------------------------ */

/** Compute sub-characteristic box height for a column */
function subBoxHeight(subs: string[]): number {
  const subBoxPad = 4;
  const interItemGap = 3;
  let totalLines = 0;
  for (const sub of subs) {
    totalLines += sub.split('\n').length;
  }
  return totalLines * SUB_LINE_HEIGHT + (subs.length - 1) * interItemGap + subBoxPad * 2 + 4;
}

export function generateNfrDiagram(): string {
  // Compute uniform sub-box height (use tallest column)
  const maxSubH = Math.max(...CHARACTERISTICS.map((c) => subBoxHeight(c.subs)));
  const HEIGHT = SUB_Y_START + maxSubH + 16; // 16px bottom padding

  const config: DiagramConfig = { width: WIDTH, height: HEIGHT };
  const parts: string[] = [];

  parts.push(
    diagramSvgOpen(
      config,
      'ISO 25010 Software Product Quality model: 9 characteristics with sub-characteristics',
    ),
  );

  // ---- Root box ----
  parts.push(
    `<rect x="${ROOT_X}" y="${ROOT_Y}" width="${ROOT_W}" height="${ROOT_H}" rx="4" fill="${P.text}" stroke="none" />`,
  );
  parts.push(
    `<text x="${(ROOT_X + ROOT_W / 2)}" y="${ROOT_Y + 18}" text-anchor="middle" font-size="12" font-weight="bold" fill="${P.surface}" font-family="${FONT}">Software Product</text>`,
  );
  parts.push(
    `<text x="${(ROOT_X + ROOT_W / 2)}" y="${ROOT_Y + 33}" text-anchor="middle" font-size="12" font-weight="bold" fill="${P.surface}" font-family="${FONT}">Quality</text>`,
  );

  // ---- Connecting lines from root to characteristic boxes ----
  const rootBottomY = ROOT_Y + ROOT_H;
  const rootCx = ROOT_X + ROOT_W / 2;
  const midY = (rootBottomY + CHAR_Y) / 2;

  // Vertical line from root center down to midpoint
  parts.push(
    `<line x1="${rootCx}" y1="${rootBottomY}" x2="${rootCx}" y2="${midY}" stroke="${P.border}" stroke-width="1.5" />`,
  );

  // Horizontal line spanning all columns at midpoint
  const leftCx = charX(0) + CHAR_W / 2;
  const rightCx = charX(TOTAL_CHARS - 1) + CHAR_W / 2;
  parts.push(
    `<line x1="${leftCx}" y1="${midY}" x2="${rightCx}" y2="${midY}" stroke="${P.border}" stroke-width="1.5" />`,
  );

  // Vertical drops from horizontal line to each characteristic box
  for (let i = 0; i < TOTAL_CHARS; i++) {
    const cx = charX(i) + CHAR_W / 2;
    parts.push(
      `<line x1="${cx}" y1="${midY}" x2="${cx}" y2="${CHAR_Y}" stroke="${P.border}" stroke-width="1.5" />`,
    );
  }

  // ---- Characteristic boxes ----
  for (let i = 0; i < TOTAL_CHARS; i++) {
    const x = charX(i);
    const cx = x + CHAR_W / 2;

    // Box
    parts.push(
      `<rect x="${x}" y="${CHAR_Y}" width="${CHAR_W}" height="${CHAR_H}" rx="4" fill="${P.accent}" stroke="none" />`,
    );

    // Label
    parts.push(multilineText(cx, CHAR_Y + CHAR_H / 2, CHARACTERISTICS[i].name, 10, 'bold', P.surface));

    // ---- Trapezoid connector to sub-characteristics ----
    const trapTopY = CHAR_Y + CHAR_H;
    const trapBotY = trapTopY + 14;
    const topLeft = x + 8;
    const topRight = x + CHAR_W - 8;
    const botLeft = x + 2;
    const botRight = x + CHAR_W - 2;

    parts.push(
      `<path d="M${topLeft},${trapTopY} L${topRight},${trapTopY} L${botRight},${trapBotY} L${botLeft},${trapBotY} Z" fill="${P.surfaceAlt}" stroke="${P.border}" stroke-width="1" />`,
    );

    // ---- Sub-characteristics list ----
    const subs = CHARACTERISTICS[i].subs;
    const subStartY = SUB_Y_START;
    const interItemGap = 3;

    // Uniform-height background box for subs
    parts.push(
      `<rect x="${x}" y="${subStartY}" width="${CHAR_W}" height="${maxSubH}" rx="4" fill="${P.surfaceAlt}" stroke="${P.border}" stroke-width="1" />`,
    );

    // Sub-characteristic labels
    const subBoxPad = 4;
    let curY = subStartY + subBoxPad + SUB_LINE_HEIGHT;
    for (const sub of subs) {
      const lines = sub.split('\n');
      for (const line of lines) {
        parts.push(
          `<text x="${cx}" y="${curY.toFixed(1)}" text-anchor="middle" font-size="${SUB_FONT_SIZE}" fill="${P.text}" font-family="${FONT}">${escapeXml(line)}</text>`,
        );
        curY += SUB_LINE_HEIGHT;
      }
      curY += interItemGap;
    }
  }

  parts.push('</svg>');
  return parts.join('\n');
}
