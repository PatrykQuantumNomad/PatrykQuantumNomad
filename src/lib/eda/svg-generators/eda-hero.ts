/**
 * EDA Visual Encyclopedia hero SVG — 4-plot diagnostic diagram.
 *
 * Produces a 2×2 grid at configurable size (default 1200×630, OG aspect).
 * The four panels are the signature EDA diagnostic suite:
 *   Top-left:     Run Sequence plot
 *   Top-right:    Lag plot (lag-1)
 *   Bottom-left:  Histogram with KDE overlay
 *   Bottom-right: Normal Probability plot
 *
 * Uses hardcoded brand colors (not CSS variables) so the SVG works both
 * inline on the page AND embedded as a data URI inside the Satori OG pipeline.
 */

import { line, area, curveLinear, curveBasis } from 'd3-shape';
import { scaleLinear } from 'd3-scale';

// ── Brand palette (hardcoded for OG compatibility) ─────────────────────
const ORANGE = '#c44b20';
const ORANGE_LIGHT = '#e8734a';
const TEAL = '#006d6d';
const BG = '#faf8f5';
const GRID = '#e5ddd5';
const AXIS = '#888';
const TEXT = '#333';
const TEXT_SEC = '#666';

// ── Representative sample data (approx. normal, slight trend) ──────────
// 40 points — enough for all four panels to look rich
const SAMPLE_DATA = [
  2.1, 3.4, 2.8, 4.1, 3.5, 2.9, 4.5, 3.7, 3.2, 4.8,
  3.9, 4.3, 3.6, 5.1, 4.0, 3.8, 4.6, 5.3, 4.2, 3.1,
  4.7, 5.0, 3.3, 4.4, 5.5, 4.9, 3.0, 4.1, 5.2, 4.6,
  3.5, 5.4, 4.8, 3.7, 5.0, 4.3, 5.6, 4.1, 3.9, 5.1,
];

export interface EdaHeroOptions {
  /** SVG canvas width in px. Default 1200 */
  width?: number;
  /** SVG canvas height in px. Default 630 */
  height?: number;
}

/**
 * Generate the 4-plot hero SVG string.
 * @returns Self-contained SVG markup with embedded gradient defs.
 */
export function generateEdaHeroSvg(options: EdaHeroOptions = {}): string {
  const W = options.width ?? 1200;
  const H = options.height ?? 630;

  const gap = 16;
  const panelW = (W - gap) / 2;
  const panelH = (H - gap) / 2;
  const margin = { top: 28, right: 14, bottom: 32, left: 44 };

  return [
    `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg"`,
    `  role="img" aria-label="EDA 4-Plot diagnostic diagram: run sequence, lag plot, histogram, and normal probability plot"`,
    `  style="width:100%;height:auto;max-width:${W}px">`,
    `<rect width="${W}" height="${H}" fill="${BG}" rx="6"/>`,
    buildDefs(),
    // Top-left: Run Sequence
    `<g transform="translate(0,0)">`,
    buildRunSequence(panelW, panelH, margin),
    `</g>`,
    // Top-right: Lag Plot
    `<g transform="translate(${panelW + gap},0)">`,
    buildLagPlot(panelW, panelH, margin),
    `</g>`,
    // Bottom-left: Histogram
    `<g transform="translate(0,${panelH + gap})">`,
    buildHistogram(panelW, panelH, margin),
    `</g>`,
    // Bottom-right: Normal Probability
    `<g transform="translate(${panelW + gap},${panelH + gap})">`,
    buildProbabilityPlot(panelW, panelH, margin),
    `</g>`,
    '</svg>',
  ].join('\n');
}

// ── Gradient definitions ───────────────────────────────────────────────

function buildDefs(): string {
  return `<defs>
  <linearGradient id="hero-bar-fill" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" stop-color="${ORANGE_LIGHT}" stop-opacity="0.90"/>
    <stop offset="100%" stop-color="${ORANGE}" stop-opacity="1.00"/>
  </linearGradient>
  <linearGradient id="hero-kde-fill" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" stop-color="${ORANGE}" stop-opacity="0.18"/>
    <stop offset="100%" stop-color="${ORANGE}" stop-opacity="0.00"/>
  </linearGradient>
</defs>`;
}

// ── Shared helpers ─────────────────────────────────────────────────────

interface Margin { top: number; right: number; bottom: number; left: number; }

function panelTitle(pw: number, m: Margin, title: string): string {
  return `<text x="${(pw / 2).toFixed(1)}" y="${(m.top - 8).toFixed(1)}" text-anchor="middle" font-size="13" font-weight="bold" fill="${TEXT}" font-family="'DM Sans',sans-serif">${title}</text>`;
}

function gridLines(
  pw: number, ph: number, m: Margin,
  xTicks: number[], yTicks: number[],
  xScale: (v: number) => number, yScale: (v: number) => number,
): string {
  const lines: string[] = [];
  for (const y of yTicks) {
    lines.push(`<line x1="${m.left}" y1="${yScale(y).toFixed(1)}" x2="${(pw - m.right)}" y2="${yScale(y).toFixed(1)}" stroke="${GRID}" stroke-width="0.5" stroke-dasharray="4,4"/>`);
  }
  for (const x of xTicks) {
    lines.push(`<line x1="${xScale(x).toFixed(1)}" y1="${m.top}" x2="${xScale(x).toFixed(1)}" y2="${(ph - m.bottom)}" stroke="${GRID}" stroke-width="0.5" stroke-dasharray="4,4"/>`);
  }
  return lines.join('\n');
}

function axes(
  pw: number, ph: number, m: Margin,
  xTicks: number[], yTicks: number[],
  xScale: (v: number) => number, yScale: (v: number) => number,
  xLabel: string, yLabel: string,
  xFmt?: (v: number) => string, yFmt?: (v: number) => string,
): string {
  const fmt = (v: number) => String(Math.round(v * 10) / 10);
  const xf = xFmt ?? fmt;
  const yf = yFmt ?? fmt;
  const iw = pw - m.left - m.right;
  const ih = ph - m.top - m.bottom;
  const parts: string[] = [];
  // X axis line
  parts.push(`<line x1="${m.left}" y1="${(m.top + ih)}" x2="${(m.left + iw)}" y2="${(m.top + ih)}" stroke="${AXIS}" stroke-width="1"/>`);
  // Y axis line
  parts.push(`<line x1="${m.left}" y1="${m.top}" x2="${m.left}" y2="${(m.top + ih)}" stroke="${AXIS}" stroke-width="1"/>`);
  // X tick labels
  for (const t of xTicks) {
    const x = xScale(t);
    parts.push(`<text x="${x.toFixed(1)}" y="${(m.top + ih + 16).toFixed(1)}" text-anchor="middle" font-size="10" fill="${TEXT_SEC}" font-family="'DM Sans',sans-serif">${xf(t)}</text>`);
  }
  // Y tick labels
  for (const t of yTicks) {
    const y = yScale(t);
    parts.push(`<text x="${(m.left - 6).toFixed(1)}" y="${y.toFixed(1)}" text-anchor="end" dy="0.35em" font-size="10" fill="${TEXT_SEC}" font-family="'DM Sans',sans-serif">${yf(t)}</text>`);
  }
  // Axis labels
  parts.push(`<text x="${(m.left + iw / 2).toFixed(1)}" y="${(ph - 4).toFixed(1)}" text-anchor="middle" font-size="11" fill="${TEXT}" font-family="'DM Sans',sans-serif">${xLabel}</text>`);
  parts.push(`<text x="${(m.left - 32).toFixed(1)}" y="${(m.top + ih / 2).toFixed(1)}" text-anchor="middle" font-size="11" fill="${TEXT}" font-family="'DM Sans',sans-serif" transform="rotate(-90,${(m.left - 32).toFixed(1)},${(m.top + ih / 2).toFixed(1)})">${yLabel}</text>`);
  return parts.join('\n');
}

// ── Run Sequence Plot (top-left) ───────────────────────────────────────

function buildRunSequence(pw: number, ph: number, m: Margin): string {
  const data = SAMPLE_DATA;
  const n = data.length;
  const iw = pw - m.left - m.right;
  const ih = ph - m.top - m.bottom;

  const xScale = scaleLinear().domain([1, n]).range([m.left, m.left + iw]);
  const yMin = Math.min(...data) - 0.3;
  const yMax = Math.max(...data) + 0.3;
  const yScale = scaleLinear().domain([yMin, yMax]).range([m.top + ih, m.top]);

  const xTicks = [1, 10, 20, 30, 40];
  const yTicks = scaleLinear().domain([yMin, yMax]).ticks(5);

  // Line path
  const lineGen = line<[number, number]>().x(d => d[0]).y(d => d[1]).curve(curveLinear);
  const pts: [number, number][] = data.map((v, i) => [xScale(i + 1), yScale(v)]);
  const d = lineGen(pts) ?? '';

  // Mean line
  const avg = data.reduce((s, v) => s + v, 0) / n;
  const my = yScale(avg).toFixed(1);

  return [
    panelTitle(pw, m, 'Run Sequence'),
    gridLines(pw, ph, m, xTicks, yTicks, xScale, yScale),
    axes(pw, ph, m, xTicks, yTicks, xScale, yScale, 'Observation', 'Value', v => String(Math.round(v))),
    `<line x1="${m.left}" y1="${my}" x2="${(m.left + iw)}" y2="${my}" stroke="${ORANGE_LIGHT}" stroke-width="1.5" stroke-dasharray="6,4"/>`,
    `<path d="${d}" fill="none" stroke="${ORANGE}" stroke-width="1.8"/>`,
  ].join('\n');
}

// ── Lag Plot (top-right) ───────────────────────────────────────────────

function buildLagPlot(pw: number, ph: number, m: Margin): string {
  const data = SAMPLE_DATA;
  const iw = pw - m.left - m.right;
  const ih = ph - m.top - m.bottom;

  const allVals = data;
  const vMin = Math.min(...allVals) - 0.3;
  const vMax = Math.max(...allVals) + 0.3;

  const xScale = scaleLinear().domain([vMin, vMax]).range([m.left, m.left + iw]);
  const yScale = scaleLinear().domain([vMin, vMax]).range([m.top + ih, m.top]);

  const xTicks = xScale.ticks(5);
  const yTicks = yScale.ticks(5);

  // Lag-1 pairs
  const dots: string[] = [];
  for (let i = 0; i < data.length - 1; i++) {
    const cx = xScale(data[i]).toFixed(1);
    const cy = yScale(data[i + 1]).toFixed(1);
    dots.push(`<circle cx="${cx}" cy="${cy}" r="4" fill="${TEAL}" fill-opacity="0.55"/>`);
  }

  // Identity line
  const idLine = `<line x1="${xScale(vMin).toFixed(1)}" y1="${yScale(vMin).toFixed(1)}" x2="${xScale(vMax).toFixed(1)}" y2="${yScale(vMax).toFixed(1)}" stroke="${TEAL}" stroke-width="1" stroke-dasharray="6,4" opacity="0.35"/>`;

  return [
    panelTitle(pw, m, 'Lag Plot'),
    gridLines(pw, ph, m, xTicks, yTicks, xScale, yScale),
    axes(pw, ph, m, xTicks, yTicks, xScale, yScale, 'Y(i)', 'Y(i+1)'),
    idLine,
    dots.join('\n'),
  ].join('\n');
}

// ── Histogram + KDE (bottom-left) ──────────────────────────────────────

function buildHistogram(pw: number, ph: number, m: Margin): string {
  const data = SAMPLE_DATA;
  const iw = pw - m.left - m.right;
  const ih = ph - m.top - m.bottom;

  // Manual binning — 8 equal-width bins
  const dMin = Math.min(...data);
  const dMax = Math.max(...data);
  const binCount = 8;
  const binW = (dMax - dMin) / binCount;
  const bins: number[] = new Array(binCount).fill(0);
  for (const v of data) {
    let idx = Math.floor((v - dMin) / binW);
    if (idx >= binCount) idx = binCount - 1;
    bins[idx]++;
  }
  const maxCount = Math.max(...bins);

  const xScale = scaleLinear().domain([dMin, dMax]).range([m.left, m.left + iw]);
  const yScale = scaleLinear().domain([0, maxCount + 1]).range([m.top + ih, m.top]);
  const xTicks = xScale.ticks(5);
  const yTicks = yScale.ticks(5);

  // Bars
  const bars: string[] = [];
  const barPx = iw / binCount;
  const barGap = 2;
  for (let i = 0; i < binCount; i++) {
    const x = m.left + i * barPx + barGap / 2;
    const barH = (bins[i] / (maxCount + 1)) * ih;
    const y = m.top + ih - barH;
    bars.push(`<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${(barPx - barGap).toFixed(1)}" height="${barH.toFixed(1)}" fill="url(#hero-bar-fill)" rx="2"/>`);
  }

  // KDE overlay (smooth curve through bin centres)
  const kdePts: [number, number][] = bins.map((count, i) => {
    const cx = m.left + (i + 0.5) * barPx;
    const cy = m.top + ih - (count / (maxCount + 1)) * ih;
    return [cx, cy];
  });
  const kdeArea = area<[number, number]>()
    .x(d => d[0])
    .y0(m.top + ih)
    .y1(d => d[1])
    .curve(curveBasis);
  const kdePath = kdeArea(kdePts) ?? '';

  return [
    panelTitle(pw, m, 'Histogram'),
    gridLines(pw, ph, m, xTicks, yTicks, xScale, yScale),
    axes(pw, ph, m, xTicks, yTicks, xScale, yScale, 'Value', 'Count', undefined, v => String(Math.round(v))),
    bars.join('\n'),
    `<path d="${kdePath}" fill="url(#hero-kde-fill)" opacity="0.8"/>`,
  ].join('\n');
}

// ── Normal Probability Plot (bottom-right) ─────────────────────────────

function normalQuantile(p: number): number {
  // Rational approximation (Abramowitz & Stegun 26.2.23)
  if (p <= 0 || p >= 1) return 0;
  const t = p < 0.5 ? Math.sqrt(-2 * Math.log(p)) : Math.sqrt(-2 * Math.log(1 - p));
  const c0 = 2.515517, c1 = 0.802853, c2 = 0.010328;
  const d1 = 1.432788, d2 = 0.189269, d3 = 0.001308;
  let z = t - (c0 + c1 * t + c2 * t * t) / (1 + d1 * t + d2 * t * t + d3 * t * t * t);
  if (p < 0.5) z = -z;
  return z;
}

function buildProbabilityPlot(pw: number, ph: number, m: Margin): string {
  const sorted = [...SAMPLE_DATA].sort((a, b) => a - b);
  const n = sorted.length;
  const iw = pw - m.left - m.right;
  const ih = ph - m.top - m.bottom;

  // Theoretical quantiles
  const theoretical = sorted.map((_, i) => normalQuantile((i + 0.5) / n));

  const tMin = Math.min(...theoretical);
  const tMax = Math.max(...theoretical);
  const dMin = Math.min(...sorted) - 0.2;
  const dMax = Math.max(...sorted) + 0.2;

  const xScale = scaleLinear().domain([tMin, tMax]).range([m.left, m.left + iw]);
  const yScale = scaleLinear().domain([dMin, dMax]).range([m.top + ih, m.top]);
  const xTicks = xScale.ticks(5);
  const yTicks = yScale.ticks(5);

  // Data points
  const dots: string[] = [];
  for (let i = 0; i < n; i++) {
    const cx = xScale(theoretical[i]).toFixed(1);
    const cy = yScale(sorted[i]).toFixed(1);
    dots.push(`<circle cx="${cx}" cy="${cy}" r="4" fill="${TEAL}" fill-opacity="0.55"/>`);
  }

  // Reference line (linear regression)
  const meanT = theoretical.reduce((s, v) => s + v, 0) / n;
  const meanD = sorted.reduce((s, v) => s + v, 0) / n;
  let num = 0, den = 0;
  for (let i = 0; i < n; i++) {
    num += (theoretical[i] - meanT) * (sorted[i] - meanD);
    den += (theoretical[i] - meanT) ** 2;
  }
  const slope = den !== 0 ? num / den : 1;
  const intercept = meanD - slope * meanT;
  const refLine = `<line x1="${xScale(tMin).toFixed(1)}" y1="${yScale(slope * tMin + intercept).toFixed(1)}" x2="${xScale(tMax).toFixed(1)}" y2="${yScale(slope * tMax + intercept).toFixed(1)}" stroke="${TEAL}" stroke-width="1.5" stroke-dasharray="6,4" opacity="0.4"/>`;

  return [
    panelTitle(pw, m, 'Normal Probability'),
    gridLines(pw, ph, m, xTicks, yTicks, xScale, yScale),
    axes(pw, ph, m, xTicks, yTicks, xScale, yScale, 'Theoretical Quantiles', 'Ordered Values'),
    refLine,
    dots.join('\n'),
  ].join('\n');
}
