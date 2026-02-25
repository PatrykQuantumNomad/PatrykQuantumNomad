/**
 * SVG Generator Library — barrel export.
 * Re-exports all 13 chart generators and shared types from a single entry point.
 */

// Chart generators
export { generateHistogram, type HistogramOptions } from './histogram';
export { generateBoxPlot, type BoxPlotOptions } from './box-plot';
export { generateBarPlot, type BarPlotOptions } from './bar-plot';
export { generateScatterPlot, type ScatterPlotOptions } from './scatter-plot';
export { generateLinePlot, type LinePlotOptions } from './line-plot';
export { generateLagPlot, type LagPlotOptions } from './lag-plot';
export { generateProbabilityPlot, type ProbabilityPlotOptions } from './probability-plot';
export { generateSpectralPlot, type SpectralPlotOptions } from './spectral-plot';
export { generateStarPlot, type StarPlotOptions } from './star-plot';
export { generateContourPlot, type ContourPlotOptions } from './contour-plot';
export { generateDistributionCurve, type DistributionCurveOptions } from './distribution-curve';
export { generate4Plot, generate6Plot } from './composite-plot';

// Shared types and utilities
export { PALETTE, DEFAULT_CONFIG, type PlotConfig } from './plot-base';
