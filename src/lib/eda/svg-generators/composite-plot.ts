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
 * Generate a 3x2 regression diagnostic plot (NIST Section 1.3.3.33).
 * - Top-left: Response vs Predictor (scatter with regression line)
 * - Top-right: Residuals vs Predictor
 * - Mid-left: Residuals vs Predicted
 * - Mid-right: Lag plot of residuals
 * - Bottom-left: Histogram of residuals
 * - Bottom-right: Normal probability plot of residuals
 */
export function generate6Plot(
  data: { x: number; y: number }[],
  config?: Partial<PlotConfig>,
): string {
  const width = config?.width ?? 800;
  const height = config?.height ?? 900;
  const fullConfig: PlotConfig = {
    ...DEFAULT_CONFIG,
    ...config,
    width,
    height,
  };

  const halfW = (width - 20) / 2;
  const thirdH = (height - 30) / 3;
  const subConfig: Partial<PlotConfig> = {
    width: halfW,
    height: thirdH,
    margin: { top: 30, right: 15, bottom: 35, left: 50 },
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
    title: 'Y vs X',
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

  // 3x2 grid layout
  const panels = [
    { svg: yVsX, x: 0, y: 0 },
    { svg: residVsX, x: halfW + 10, y: 0 },
    { svg: residVsPred, x: 0, y: thirdH + 10 },
    { svg: residLag, x: halfW + 10, y: thirdH + 10 },
    { svg: residHist, x: 0, y: 2 * (thirdH + 10) },
    { svg: residProb, x: halfW + 10, y: 2 * (thirdH + 10) },
  ];

  const groups = panels
    .map(
      (p) =>
        `<g transform="translate(${p.x.toFixed(2)}, ${p.y.toFixed(2)})">${stripSvgWrapper(p.svg)}</g>`,
    )
    .join('\n');

  return svgOpen(fullConfig, '6-Plot regression diagnostic layout') + '\n' + groups + '\n</svg>';
}
