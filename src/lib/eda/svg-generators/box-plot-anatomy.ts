/**
 * Annotated box plot anatomy diagram.
 * Produces a horizontal schematic with labeled components:
 * Q1, median, Q3, mean, whiskers, outliers, and IQR bracket.
 * Uses fixed illustrative positions — no data input needed.
 */

import { PALETTE } from './plot-base';

const W = 650;
const H = 260;
const FONT = "'DM Sans', sans-serif";

// ── Layout constants ────────────────────────────────────────
// Vertical centre of the box plot
const cy = 110;
const boxH = 56; // box half-height
const boxTop = cy - boxH;
const boxBot = cy + boxH;

// Horizontal positions (data axis)
const q1 = 195;
const median = 355;
const q3 = 455;
const mean = 260;
const whiskerL = 115; // left whisker end (minimum within fence)
const whiskerR = 545; // right whisker end (maximum within fence)
const outliers = [40, 70]; // left outliers
const outlierR = 610; // right outlier
const capH = 10; // whisker cap half-height

// Annotation positions
const labelY = 36; // label row above the box
const arrowTip = boxTop - 4; // arrow endpoints

export function generateBoxPlotAnatomy(): string {
  const arrow = (x: number, y1: number, y2: number) =>
    `<line x1="${x}" y1="${y1}" x2="${x}" y2="${y2}" stroke="${PALETTE.text}" stroke-width="1" marker-end="url(#arrowhead)" />`;

  return `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Annotated box plot anatomy diagram showing quartiles, whiskers, outliers, and interquartile range" style="width:100%;height:auto;max-width:${W}px">
  <defs>
    <marker id="arrowhead" markerWidth="8" markerHeight="6" refX="4" refY="3" orient="auto">
      <path d="M0,0 L8,3 L0,6 Z" fill="${PALETTE.text}" />
    </marker>
  </defs>

  <!-- Box (Q1 to Q3) -->
  <rect x="${q1}" y="${boxTop}" width="${q3 - q1}" height="${boxBot - boxTop}"
        fill="${PALETTE.dataPrimary}" fill-opacity="0.12"
        stroke="${PALETTE.dataPrimary}" stroke-width="2" rx="2" />

  <!-- Median line -->
  <line x1="${median}" y1="${boxTop}" x2="${median}" y2="${boxBot}"
        stroke="${PALETTE.dataPrimary}" stroke-width="2.5" />

  <!-- Mean marker (×) -->
  <text x="${mean}" y="${cy}" text-anchor="middle" dy="0.35em"
        font-size="16" font-weight="bold" fill="${PALETTE.dataPrimary}"
        font-family="${FONT}">×</text>

  <!-- Left whisker -->
  <line x1="${whiskerL}" y1="${cy}" x2="${q1}" y2="${cy}"
        stroke="${PALETTE.dataPrimary}" stroke-width="1.5" />
  <line x1="${whiskerL}" y1="${cy - capH}" x2="${whiskerL}" y2="${cy + capH}"
        stroke="${PALETTE.dataPrimary}" stroke-width="1.5" />

  <!-- Right whisker -->
  <line x1="${q3}" y1="${cy}" x2="${whiskerR}" y2="${cy}"
        stroke="${PALETTE.dataPrimary}" stroke-width="1.5" />
  <line x1="${whiskerR}" y1="${cy - capH}" x2="${whiskerR}" y2="${cy + capH}"
        stroke="${PALETTE.dataPrimary}" stroke-width="1.5" />

  <!-- Outliers (left) -->
  ${outliers.map((ox) => `<circle cx="${ox}" cy="${cy}" r="5" fill="none" stroke="${PALETTE.dataPrimary}" stroke-width="1.5" />`).join('\n  ')}

  <!-- Outlier (right) -->
  <circle cx="${outlierR}" cy="${cy}" r="5" fill="none"
          stroke="${PALETTE.dataPrimary}" stroke-width="1.5" />

  <!-- ── Annotation labels + arrows ─────────────────────── -->

  <!-- Outliers label -->
  <text x="${(outliers[0] + outliers[1]) / 2}" y="${labelY - 12}" text-anchor="middle"
        font-size="12" font-weight="600" fill="${PALETTE.text}" font-family="${FONT}">Outliers</text>
  ${arrow((outliers[0] + outliers[1]) / 2, labelY - 6, cy - 8)}

  <!-- Whisker label (left, on the line) -->
  <rect x="${(whiskerL + q1) / 2 - 28}" y="${cy - 9}" width="56" height="18" rx="2"
        fill="${PALETTE.surface}" />
  <text x="${(whiskerL + q1) / 2}" y="${cy}" text-anchor="middle" dy="0.35em"
        font-size="11" font-weight="600" fill="${PALETTE.text}" font-family="${FONT}">Whisker</text>

  <!-- Min label (below left cap) -->
  <text x="${whiskerL}" y="${cy + capH + 16}" text-anchor="middle"
        font-size="11" fill="${PALETTE.textSecondary}" font-family="${FONT}">Min</text>

  <!-- Q1 label -->
  <text x="${q1}" y="${labelY - 12}" text-anchor="middle"
        font-size="12" font-weight="600" fill="${PALETTE.text}" font-family="${FONT}">Lower Quartile</text>
  <text x="${q1}" y="${labelY + 2}" text-anchor="middle"
        font-size="11" fill="${PALETTE.textSecondary}" font-family="${FONT}">Q1</text>
  ${arrow(q1, labelY + 8, arrowTip)}

  <!-- Mean label -->
  <text x="${mean}" y="${labelY - 12}" text-anchor="middle"
        font-size="12" font-weight="600" fill="${PALETTE.text}" font-family="${FONT}">Mean</text>
  ${arrow(mean, labelY - 6, cy - 12)}

  <!-- Median label -->
  <text x="${median}" y="${labelY - 12}" text-anchor="middle"
        font-size="12" font-weight="600" fill="${PALETTE.text}" font-family="${FONT}">Median</text>
  <text x="${median}" y="${labelY + 2}" text-anchor="middle"
        font-size="11" fill="${PALETTE.textSecondary}" font-family="${FONT}">Q2</text>
  ${arrow(median, labelY + 8, arrowTip)}

  <!-- Q3 label -->
  <text x="${q3}" y="${labelY - 12}" text-anchor="middle"
        font-size="12" font-weight="600" fill="${PALETTE.text}" font-family="${FONT}">Upper Quartile</text>
  <text x="${q3}" y="${labelY + 2}" text-anchor="middle"
        font-size="11" fill="${PALETTE.textSecondary}" font-family="${FONT}">Q3</text>
  ${arrow(q3, labelY + 8, arrowTip)}

  <!-- Whisker label (right, on the line) -->
  <rect x="${(q3 + whiskerR) / 2 - 28}" y="${cy - 9}" width="56" height="18" rx="2"
        fill="${PALETTE.surface}" />
  <text x="${(q3 + whiskerR) / 2}" y="${cy}" text-anchor="middle" dy="0.35em"
        font-size="11" font-weight="600" fill="${PALETTE.text}" font-family="${FONT}">Whisker</text>

  <!-- Max label (below right cap) -->
  <text x="${whiskerR}" y="${cy + capH + 16}" text-anchor="middle"
        font-size="11" fill="${PALETTE.textSecondary}" font-family="${FONT}">Max</text>

  <!-- IQR bracket -->
  <path d="M${q1},${boxBot + 42} L${q1},${boxBot + 50} L${(q1 + q3) / 2 - 2},${boxBot + 50} L${(q1 + q3) / 2},${boxBot + 56}
           M${(q1 + q3) / 2},${boxBot + 56} L${(q1 + q3) / 2 + 2},${boxBot + 50} L${q3},${boxBot + 50} L${q3},${boxBot + 42}"
        fill="none" stroke="${PALETTE.text}" stroke-width="1.5" />
  <text x="${(q1 + q3) / 2}" y="${boxBot + 72}" text-anchor="middle"
        font-size="12" font-weight="600" fill="${PALETTE.text}" font-family="${FONT}">Interquartile Range (IQR)</text>

</svg>`;
}
