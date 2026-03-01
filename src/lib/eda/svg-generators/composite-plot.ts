/**
 * Composite plot SVG generators for multi-panel diagnostic layouts.
 * generate4Plot: 2x2 grid (run-sequence, lag, histogram, normal probability)
 * generate6Plot: 3x2 regression diagnostic grid (Y vs X, residuals vs X,
 *   residuals vs predicted, lag of residuals, residual histogram, residual normal prob)
 *
 * Sub-generators are imported from individual files (NOT from index.ts)
 * to avoid circular imports.
 */
import { generateLinePlot } from './line-plot';
import { generateLagPlot } from './lag-plot';
import { generateHistogram } from './histogram';
import { generateProbabilityPlot } from './probability-plot';
import { generateScatterPlot } from './scatter-plot';
import {
  DEFAULT_CONFIG,
  svgOpen,
  type PlotConfig,
} from './plot-base';
import { linearRegression } from '../math/statistics';

/**
 * Strip the outer <svg ...> wrapper and closing </svg> from generated SVG,
 * leaving only the inner content for composition into <g> groups.
 */
function stripSvgWrapper(svg: string): string {
  return svg
    .replace(/<svg[^>]*>/, '')
    .replace(/<\/svg>$/, '');
}

/**
 * Generate a 2x2 composite diagnostic plot.
 * - Top-left: Run sequence plot
 * - Top-right: Lag plot (lag=1)
 * - Bottom-left: Histogram with KDE
 * - Bottom-right: Normal probability plot
 */
export function generate4Plot(
  data: number[],
  config?: Partial<PlotConfig>,
): string {
  const width = config?.width ?? 800;
  const height = config?.height ?? 600;
  const fullConfig: PlotConfig = {
    ...DEFAULT_CONFIG,
    ...config,
    width,
    height,
  };

  const halfW = (width - 20) / 2;
  const halfH = (height - 20) / 2;
  const subConfig: Partial<PlotConfig> = {
    width: halfW,
    height: halfH,
    margin: { top: 30, right: 15, bottom: 35, left: 50 },
  };

  // Generate sub-plots
  const runSeq = generateLinePlot({
    data,
    mode: 'run-sequence',
    config: subConfig,
    title: 'Run Sequence',
  });
  const lag = generateLagPlot({
    data,
    lag: 1,
    config: subConfig,
    title: 'Lag Plot',
  });
  const hist = generateHistogram({
    data,
    showKDE: true,
    config: subConfig,
    title: 'Histogram',
  });
  const prob = generateProbabilityPlot({
    data,
    type: 'normal',
    config: subConfig,
    title: 'Normal Probability',
  });

  // Strip wrappers and place in 2x2 grid
  const panels = [
    { svg: runSeq, x: 0, y: 0 },
    { svg: lag, x: halfW + 10, y: 0 },
    { svg: hist, x: 0, y: halfH + 10 },
    { svg: prob, x: halfW + 10, y: halfH + 10 },
  ];

  const groups = panels
    .map(
      (p) =>
        `<g transform="translate(${p.x.toFixed(2)}, ${p.y.toFixed(2)})">${stripSvgWrapper(p.svg)}</g>`,
    )
    .join('\n');

  return svgOpen(fullConfig, '4-Plot diagnostic layout') + '\n' + groups + '\n</svg>';
}

/**
 * Generate a 2x3 regression diagnostic plot (NIST Section 1.3.3.33).
 * NIST layout: 2 rows × 3 columns
 * - Row 1: (1) Y & predicted vs X, (2) Residuals vs X, (3) Residuals vs predicted
 * - Row 2: (4) Lag plot of residuals, (5) Histogram of residuals, (6) Normal prob plot
 */
export function generate6Plot(
  data: { x: number; y: number }[],
  config?: Partial<PlotConfig>,
): string {
  const width = config?.width ?? 900;
  const height = config?.height ?? 600;
  const fullConfig: PlotConfig = {
    ...DEFAULT_CONFIG,
    ...config,
    width,
    height,
  };

  const thirdW = (width - 30) / 3;
  const halfH = (height - 20) / 2;
  const subConfig: Partial<PlotConfig> = {
    width: thirdW,
    height: halfH,
    margin: { top: 30, right: 15, bottom: 35, left: 55 },
  };

  // Compute regression
  const xs = data.map((d) => d.x);
  const ys = data.map((d) => d.y);
  const reg = linearRegression(xs, ys);
  const residuals = data.map((d) => d.y - (reg.slope * d.x + reg.intercept));
  const predicted = data.map((d) => reg.slope * d.x + reg.intercept);

  // Panel 1: Y vs X (scatter with regression line)
  const yVsX = generateScatterPlot({
    data,
    showRegression: true,
    config: subConfig,
    title: 'Y & Predicted vs X',
    xLabel: 'X',
    yLabel: 'Y',
  });

  // Panel 2: Residuals vs Predictor
  const residVsX = generateScatterPlot({
    data: data.map((d, i) => ({ x: d.x, y: residuals[i] })),
    config: subConfig,
    title: 'Residuals vs X',
    xLabel: 'X',
    yLabel: 'Residual',
  });

  // Panel 3: Residuals vs Predicted
  const residVsPred = generateScatterPlot({
    data: predicted.map((p, i) => ({ x: p, y: residuals[i] })),
    config: subConfig,
    title: 'Residuals vs Predicted',
    xLabel: 'Predicted',
    yLabel: 'Residual',
  });

  // Panel 4: Lag plot of residuals
  const residLag = generateLagPlot({
    data: residuals,
    lag: 1,
    config: subConfig,
    title: 'Lag of Residuals',
  });

  // Panel 5: Histogram of residuals
  const residHist = generateHistogram({
    data: residuals,
    showKDE: true,
    config: subConfig,
    title: 'Residual Histogram',
    xLabel: 'Residual',
    yLabel: 'Frequency',
  });

  // Panel 6: Normal probability plot of residuals
  const residProb = generateProbabilityPlot({
    data: residuals,
    type: 'normal',
    config: subConfig,
    title: 'Residual Normal Prob',
  });

  // 2x3 grid layout (NIST convention: 2 rows × 3 columns)
  const panels = [
    { svg: yVsX, x: 0, y: 0 },
    { svg: residVsX, x: thirdW + 10, y: 0 },
    { svg: residVsPred, x: 2 * (thirdW + 10), y: 0 },
    { svg: residLag, x: 0, y: halfH + 10 },
    { svg: residHist, x: thirdW + 10, y: halfH + 10 },
    { svg: residProb, x: 2 * (thirdW + 10), y: halfH + 10 },
  ];

  const groups = panels
    .map(
      (p) =>
        `<g transform="translate(${p.x.toFixed(2)}, ${p.y.toFixed(2)})">${stripSvgWrapper(p.svg)}</g>`,
    )
    .join('\n');

  return svgOpen(fullConfig, '6-Plot regression diagnostic layout') + '\n' + groups + '\n</svg>';
}
