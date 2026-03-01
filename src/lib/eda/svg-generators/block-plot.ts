/**
 * Block plot SVG generator — NIST/SEMATECH convention.
 * Each X-position represents a combination of nuisance factors.
 * An outlined vertical rectangle spans the min-to-max response range
 * within each position.  Bold plot characters (numerals) mark
 * primary-factor levels at their Y-value inside the rectangle.
 * Reference: NIST/SEMATECH e-Handbook Section 1.3.3.3.
 * Produces valid SVG markup at build time with no client-side JS.
 */
import { scaleLinear, scaleBand } from 'd3-scale';
import { extent, min, max } from 'd3-array';
import {
  DEFAULT_CONFIG,
  PALETTE,
  svgOpen,
  yAxis,
  gridLinesH,
  innerDimensions,
  titleText,
  type PlotConfig,
} from './plot-base';

export interface BlockPlotOptions {
  blocks: {
    label: string;
    /** Individual observations per group within this block */
    points?: { group: string; value: number }[];
    /** Legacy: aggregated means per group (renders as single points) */
    values?: { group: string; mean: number }[];
  }[];
  config?: Partial<PlotConfig>;
  title?: string;
  xLabel?: string;
  yLabel?: string;
}

export function generateBlockPlot(options: BlockPlotOptions): string {
  const { blocks } = options;

  if (!blocks || blocks.length === 0) {
    const emptyConfig: PlotConfig = { ...DEFAULT_CONFIG, ...options.config };
    return (
      svgOpen(emptyConfig, 'Insufficient data for block plot') +
      `<text x="${(emptyConfig.width / 2).toFixed(2)}" y="${(emptyConfig.height / 2).toFixed(2)}" text-anchor="middle" font-size="14" fill="${PALETTE.textSecondary}" font-family="${emptyConfig.fontFamily}">Insufficient data</text></svg>`
    );
  }

  // Dynamic sizing: wider plot and taller bottom margin for many blocks
  const needsRotation = blocks.length > 8;
  const defaultBottom = needsRotation ? 70 : DEFAULT_CONFIG.margin.bottom;
  const config: PlotConfig = {
    ...DEFAULT_CONFIG,
    ...options.config,
    width: Math.max((options.config?.width ?? DEFAULT_CONFIG.width), needsRotation ? 700 : 600),
    margin: {
      ...(DEFAULT_CONFIG.margin),
      ...(options.config?.margin),
      bottom: options.config?.margin?.bottom ?? defaultBottom,
    },
  };
  // If labels will rotate and caller's bottom margin is too small, expand it
  if (needsRotation && config.margin.bottom < 70) {
    config.height += (70 - config.margin.bottom);
    config.margin.bottom = 70;
  }
  const { innerWidth, innerHeight } = innerDimensions(config);
  const { margin } = config;

  // Normalize: convert legacy { group, mean } to { group, value }
  const normalized = blocks.map(b => ({
    label: b.label,
    points: b.points ?? (b.values ?? []).map(v => ({ group: v.group, value: v.mean })),
  }));

  // Extract unique groups (preserving order)
  const groups: string[] = [];
  for (const b of normalized) {
    for (const p of b.points) {
      if (!groups.includes(p.group)) groups.push(p.group);
    }
  }

  // Scales
  const xScale = scaleBand()
    .domain(normalized.map(b => b.label))
    .range([margin.left, margin.left + innerWidth])
    .padding(0.25);

  const allValues = normalized.flatMap(b => b.points.map(p => p.value));
  const [yMin, yMax] = extent(allValues) as [number, number];
  const yPad = (yMax - yMin) * 0.12 || 1;

  const yScale = scaleLinear()
    .domain([yMin - yPad, yMax + yPad])
    .range([margin.top + innerHeight, margin.top]);

  const bandWidth = xScale.bandwidth();
  const yTicks = yScale.ticks(6);

  // --- Outlined rectangles with single accent fill + plot characters ---
  const blockElements = normalized.map(b => {
    const blockX = xScale(b.label) ?? 0;
    const vals = b.points.map(p => p.value);
    const blockMin = min(vals) as number;
    const blockMax = max(vals) as number;
    const yTop = yScale(blockMax);
    const yBot = yScale(blockMin);
    // Pad the rectangle so numbers sit inside, not on the edge
    const pad = 10;
    const rectHeight = Math.max(yBot - yTop + pad * 2, 2);
    const rx = blockX + 2;
    const rw = bandWidth - 4;

    // Filled + outlined rectangle
    const rect = `<rect x="${rx.toFixed(2)}" y="${(yTop - pad).toFixed(2)}" width="${rw.toFixed(2)}" height="${rectHeight.toFixed(2)}" fill="${PALETTE.dataPrimary}" opacity="0.18" stroke="${PALETTE.axis}" stroke-width="1" rx="1" />`;

    // Bold numbered plot characters at Y-value positions
    const cx = blockX + bandWidth / 2;
    const labels = b.points.map(p => {
      const gi = groups.indexOf(p.group);
      const cy = yScale(p.value);
      const label = `${gi + 1}`;
      return `<text x="${cx.toFixed(2)}" y="${cy.toFixed(2)}" text-anchor="middle" dy="0.35em" font-size="11" font-weight="bold" fill="${PALETTE.text}" font-family="${config.fontFamily}">${label}</text>`;
    }).join('\n');

    return rect + '\n' + labels;
  }).join('\n');

  // --- Legend: "Plot Character = Group Name" ---
  const legendX = margin.left + innerWidth - 100;
  const legendY = margin.top + 14;
  const legendTitle = `<text x="${legendX.toFixed(2)}" y="${(legendY - 2).toFixed(2)}" dy="0.35em" font-size="10" fill="${PALETTE.textSecondary}" font-family="${config.fontFamily}">Plot Character</text>`;
  const legendItems = groups.map((group, gi) => {
    const y = legendY + (gi + 1) * 16;
    return (
      `<text x="${legendX.toFixed(2)}" y="${y.toFixed(2)}" dy="0.35em" font-size="11" font-weight="bold" fill="${PALETTE.text}" font-family="${config.fontFamily}">${gi + 1}</text>` +
      `<text x="${(legendX + 12).toFixed(2)}" y="${y.toFixed(2)}" dy="0.35em" font-size="10" fill="${PALETTE.textSecondary}" font-family="${config.fontFamily}">= ${group}</text>`
    );
  }).join('\n');
  const legend = legendTitle + '\n' + legendItems;

  // --- X-axis labels (rotated for many blocks) ---
  const rotateLabels = normalized.length > 8;
  const xLabels = normalized.map(b => {
    const cx = (xScale(b.label) ?? 0) + bandWidth / 2;
    const ly = margin.top + innerHeight + 16;
    if (rotateLabels) {
      return `<text x="${cx.toFixed(2)}" y="${ly.toFixed(2)}" text-anchor="end" dy="0.35em" font-size="9" fill="${PALETTE.textSecondary}" font-family="${config.fontFamily}" transform="rotate(-45,${cx.toFixed(2)},${ly.toFixed(2)})">${b.label}</text>`;
    }
    return `<text x="${cx.toFixed(2)}" y="${ly.toFixed(2)}" text-anchor="middle" dy="0.35em" font-size="10" fill="${PALETTE.textSecondary}" font-family="${config.fontFamily}">${b.label}</text>`;
  }).join('\n');

  const xAxisLine = `<line x1="${margin.left}" y1="${(margin.top + innerHeight)}" x2="${(margin.left + innerWidth)}" y2="${(margin.top + innerHeight)}" stroke="${PALETTE.axis}" stroke-width="1" />`;
  const xLabelEl = options.xLabel
    ? `<text x="${(config.width / 2).toFixed(2)}" y="${(config.height - 6).toFixed(2)}" text-anchor="middle" font-size="12" fill="${PALETTE.text}" font-family="${config.fontFamily}">${options.xLabel}</text>`
    : '';

  return (
    svgOpen(config, `Block Plot${options.title ? ': ' + options.title : ''}`) +
    gridLinesH(yTicks, yScale, margin.left, margin.left + innerWidth) + '\n' +
    blockElements + '\n' +
    legend + '\n' +
    xAxisLine + '\n' + xLabels + '\n' + xLabelEl + '\n' +
    yAxis(yTicks, yScale, margin.left, options.yLabel ?? '', config) + '\n' +
    (options.title ? titleText(config, options.title) : '') +
    '</svg>'
  );
}
