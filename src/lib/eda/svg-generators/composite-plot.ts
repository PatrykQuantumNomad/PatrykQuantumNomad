/**
 * Composite plot SVG generators for multi-panel diagnostic layouts.
 * generate4Plot: 2x2 grid (run-sequence, lag, histogram, normal probability)
 * generate6Plot: 3x2 grid (adds ACF and spectral to the 4-plot)
 *
 * Sub-generators are imported from individual files (NOT from index.ts)
 * to avoid circular imports.
 */
import { generateLinePlot } from './line-plot';
import { generateLagPlot } from './lag-plot';
import { generateHistogram } from './histogram';
import { generateProbabilityPlot } from './probability-plot';
import { generateSpectralPlot } from './spectral-plot';
import {
  DEFAULT_CONFIG,
  svgOpen,
  type PlotConfig,
} from './plot-base';

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
 * Generate a 3x2 composite diagnostic plot.
 * - Row 1: Run sequence (left), Lag plot (right)
 * - Row 2: Histogram with KDE (left), Normal probability plot (right)
 * - Row 3: Autocorrelation (left), Spectral plot (right)
 */
export function generate6Plot(
  data: number[],
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
  const acf = generateLinePlot({
    data,
    mode: 'autocorrelation',
    config: subConfig,
    title: 'Autocorrelation',
  });
  const spectral = generateSpectralPlot({
    data,
    config: subConfig,
    title: 'Spectral',
  });

  // Strip wrappers and place in 3x2 grid
  const panels = [
    { svg: runSeq, x: 0, y: 0 },
    { svg: lag, x: halfW + 10, y: 0 },
    { svg: hist, x: 0, y: thirdH + 10 },
    { svg: prob, x: halfW + 10, y: thirdH + 10 },
    { svg: acf, x: 0, y: 2 * (thirdH + 10) },
    { svg: spectral, x: halfW + 10, y: 2 * (thirdH + 10) },
  ];

  const groups = panels
    .map(
      (p) =>
        `<g transform="translate(${p.x.toFixed(2)}, ${p.y.toFixed(2)})">${stripSvgWrapper(p.svg)}</g>`,
    )
    .join('\n');

  return svgOpen(fullConfig, '6-Plot diagnostic layout') + '\n' + groups + '\n</svg>';
}
