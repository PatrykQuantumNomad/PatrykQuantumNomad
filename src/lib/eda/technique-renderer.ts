/**
 * Centralized technique-to-SVG-generator mapping for all 29 graphical techniques.
 * Exports renderTechniquePlot (slug -> default SVG) and renderVariants (slug -> labeled SVG array).
 *
 * 18 techniques use direct generator calls.
 * 11 techniques use composition from existing generators via stripSvgWrapper + <g transform>.
 * 6 Tier B techniques include variant dataset arrays with distinct statistical patterns.
 */
import {
  generateHistogram,
  generateBoxPlot,
  generateScatterPlot,
  generateLinePlot,
  generateLagPlot,
  generateProbabilityPlot,
  generateSpectralPlot,
  generateStarPlot,
  generateContourPlot,
  generate4Plot,
  generate6Plot,
  generateBihistogram,
  generateBlockPlot,
  generateDoeMeanPlot,
  PALETTE,
  type PlotConfig,
} from './svg-generators';
import { svgOpen } from './svg-generators/plot-base';
import {
  normalRandom,
  uniformRandom,
  scatterData,
  timeSeries,
  doeFactors,
  boxPlotData,
  responseSurface,
  boxCoxLinearityData,
  conditioningData,
} from '../../data/eda/datasets';
import { mean, linearRegression } from './math/statistics';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Strip the outer <svg ...> and </svg> tags, leaving inner content for <g> composition. */
function stripSvgWrapper(svg: string): string {
  return svg
    .replace(/<svg[^>]*>/, '')
    .replace(/<\/svg>$/, '');
}

/** Simple seeded pseudo-random for reproducible variant data. */
function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return s / 2147483647;
  };
}

// ---------------------------------------------------------------------------
// Composition helpers for the 11 non-dedicated techniques
// ---------------------------------------------------------------------------


function composeBootstrapPlot(): string {
  // Generate 200 bootstrap resampled means
  const rng = seededRandom(42);
  const n = normalRandom.length;
  const means: number[] = [];
  for (let b = 0; b < 200; b++) {
    let sum = 0;
    for (let i = 0; i < n; i++) {
      sum += normalRandom[Math.floor(rng() * n)];
    }
    means.push(sum / n);
  }

  return generateHistogram({
    data: means,
    showKDE: true,
    title: 'Bootstrap Distribution of the Mean',
    xLabel: 'Sample Mean',
    yLabel: 'Frequency',
  });
}

function composeBoxCoxLinearity(): string {
  // Sweep lambda values, compute correlation of Y with Box-Cox transformed X
  // Per NIST Section 1.3.3.5: transform X to maximize linearity with Y
  // Use 21 points (step 0.2) for a smooth connected line matching NIST convention
  const lambdas: number[] = [];
  for (let lam = -2; lam <= 2; lam += 0.2) {
    lambdas.push(parseFloat(lam.toFixed(1)));
  }
  const xVals = boxCoxLinearityData.map((d) => d.x);
  const yVals = boxCoxLinearityData.map((d) => d.y);
  const xPositive = xVals.map((v) => Math.max(v, 0.01));

  const correlations: { x: number; y: number }[] = lambdas.map((lam) => {
    const transformed = xPositive.map((x) => {
      if (Math.abs(lam) < 0.001) return Math.log(x);
      return (Math.pow(x, lam) - 1) / lam;
    });
    const reg = linearRegression(transformed, yVals);
    return { x: lam, y: Math.sqrt(Math.max(0, reg.r2)) };
  });

  const sorted = correlations.sort((a, b) => a.x - b.x);

  const baseSvg = generateScatterPlot({
    data: sorted,
    showRegression: false,
    title: 'Box-Cox Linearity Plot',
    xLabel: 'Lambda',
    yLabel: 'Correlation',
  });

  // Add connecting polyline through the sorted points (NIST shows connected line, not discrete dots)
  const config = { width: 600, height: 400, margin: { top: 40, right: 20, bottom: 50, left: 60 } };
  const innerW = config.width - config.margin.left - config.margin.right;
  const innerH = config.height - config.margin.top - config.margin.bottom;

  const xExtent = [Math.min(...sorted.map((d) => d.x)), Math.max(...sorted.map((d) => d.x))];
  const yExtent = [Math.min(...sorted.map((d) => d.y)), Math.max(...sorted.map((d) => d.y))];
  const xPad = (xExtent[1] - xExtent[0]) * 0.05;
  const yPad = (yExtent[1] - yExtent[0]) * 0.05;

  const xScale = (v: number) => config.margin.left + ((v - (xExtent[0] - xPad)) / ((xExtent[1] + xPad) - (xExtent[0] - xPad))) * innerW;
  const yScale = (v: number) => config.margin.top + innerH - ((v - (yExtent[0] - yPad)) / ((yExtent[1] + yPad) - (yExtent[0] - yPad))) * innerH;

  const polyPoints = sorted.map((d) => `${xScale(d.x).toFixed(2)},${yScale(d.y).toFixed(2)}`).join(' ');
  const polyline = `<polyline points="${polyPoints}" fill="none" stroke="${PALETTE.dataPrimary}" stroke-width="2" />`;

  return baseSvg.replace('</svg>', polyline + '</svg>');
}

function composeBoxCoxNormality(): string {
  // Sweep lambda values, compute normality correlation
  const lambdas: number[] = [];
  for (let lam = -2; lam <= 2; lam += 0.2) {
    lambdas.push(parseFloat(lam.toFixed(1)));
  }
  const dataPos = normalRandom.map((v) => Math.max(v + 3, 0.01));

  const pairs: { x: number; y: number }[] = lambdas.map((lam) => {
    const transformed = dataPos.map((y) => {
      if (Math.abs(lam) < 0.001) return Math.log(y);
      return (Math.pow(y, lam) - 1) / lam;
    });
    const sortedTrans = [...transformed].sort((a, b) => a - b);
    const n = sortedTrans.length;
    const theoretical: number[] = [];
    for (let i = 0; i < n; i++) {
      const p = (i + 1 - 0.375) / (n + 0.25);
      // Approximate normal quantile for PPCC
      const t = Math.sqrt(-2 * Math.log(p < 0.5 ? p : 1 - p));
      const q = t - (2.515517 + 0.802853 * t + 0.010328 * t * t) /
        (1 + 1.432788 * t + 0.189269 * t * t + 0.001308 * t * t * t);
      theoretical.push(p < 0.5 ? -q : q);
    }
    const reg = linearRegression(theoretical, sortedTrans);
    return { x: lam, y: Math.sqrt(Math.max(0, reg.r2)) };
  });

  const sorted = [...pairs].sort((a, b) => a.x - b.x);

  const baseSvg = generateScatterPlot({
    data: sorted,
    showRegression: false,
    title: 'Box-Cox Normality Plot',
    xLabel: 'Lambda',
    yLabel: 'Normality Correlation',
  });

  // Add connecting polyline through the sorted points (NIST shows connected line, not discrete dots)
  const config = { width: 600, height: 400, margin: { top: 40, right: 20, bottom: 50, left: 60 } };
  const innerW = config.width - config.margin.left - config.margin.right;
  const innerH = config.height - config.margin.top - config.margin.bottom;

  const xExtent = [Math.min(...sorted.map((d) => d.x)), Math.max(...sorted.map((d) => d.x))];
  const yExtent = [Math.min(...sorted.map((d) => d.y)), Math.max(...sorted.map((d) => d.y))];
  const xPad = (xExtent[1] - xExtent[0]) * 0.05;
  const yPad = (yExtent[1] - yExtent[0]) * 0.05;

  const xScale = (v: number) => config.margin.left + ((v - (xExtent[0] - xPad)) / ((xExtent[1] + xPad) - (xExtent[0] - xPad))) * innerW;
  const yScale = (v: number) => config.margin.top + innerH - ((v - (yExtent[0] - yPad)) / ((yExtent[1] + yPad) - (yExtent[0] - yPad))) * innerH;

  const polyPoints = sorted.map((d) => `${xScale(d.x).toFixed(2)},${yScale(d.y).toFixed(2)}`).join(' ');
  const polyline = `<polyline points="${polyPoints}" fill="none" stroke="${PALETTE.dataPrimary}" stroke-width="2" />`;

  return baseSvg.replace('</svg>', polyline + '</svg>');
}

function composeComplexDemodulation(): string {
  const width = 600;
  const height = 500;
  const halfH = 220;
  const subConfig: Partial<PlotConfig> = {
    width,
    height: halfH,
    margin: { top: 30, right: 20, bottom: 35, left: 60 },
  };

  // Amplitude envelope: running RMS of time series
  const windowSize = 10;
  const amplitudeData: number[] = [];
  for (let i = 0; i < timeSeries.length - windowSize + 1; i++) {
    const window = timeSeries.slice(i, i + windowSize);
    const m = mean(window);
    const rms = Math.sqrt(mean(window.map((v) => (v - m) ** 2)));
    amplitudeData.push(rms);
  }

  // Phase angle: approximate via atan2 of Hilbert-like transform
  const phaseData: number[] = timeSeries.map((v, i) => {
    const m = mean(timeSeries);
    return Math.atan2(v - m, i > 0 ? timeSeries[i - 1] - m : 0) * (180 / Math.PI);
  });

  const ampPlot = generateLinePlot({
    data: amplitudeData,
    mode: 'time-series',
    config: subConfig,
    title: 'Amplitude Envelope',
    yLabel: 'Amplitude',
  });

  const phasePlot = generateLinePlot({
    data: phaseData,
    mode: 'time-series',
    config: subConfig,
    title: 'Phase Angle',
    xLabel: 'Observation',
    yLabel: 'Phase (degrees)',
  });

  const cfg: PlotConfig = {
    width,
    height,
    margin: { top: 10, right: 20, bottom: 10, left: 60 },
    fontFamily: "'DM Sans', sans-serif",
  };

  return (
    svgOpen(cfg, 'Complex demodulation: amplitude and phase') +
    `<g transform="translate(0, 0)">${stripSvgWrapper(ampPlot)}</g>` +
    `<g transform="translate(0, ${halfH + 10})">${stripSvgWrapper(phasePlot)}</g>` +
    '</svg>'
  );
}

function composeYoudenPlot(): string {
  // Lab-to-lab paired measurements
  const rng = seededRandom(123);
  const labData: { x: number; y: number }[] = [];
  for (let i = 0; i < 20; i++) {
    const base = 50 + rng() * 30;
    const labBias = (rng() - 0.5) * 10;
    labData.push({
      x: base + (rng() - 0.5) * 5,
      y: base + labBias + (rng() - 0.5) * 5,
    });
  }

  const baseSvg = generateScatterPlot({
    data: labData,
    showRegression: false,
    title: 'Youden Plot',
    xLabel: 'Run 1 Measurement',
    yLabel: 'Run 2 Measurement',
  });

  // Add median reference lines
  const xValues = labData.map((d) => d.x).sort((a, b) => a - b);
  const yValues = labData.map((d) => d.y).sort((a, b) => a - b);
  const medianX = (xValues[9] + xValues[10]) / 2;
  const medianY = (yValues[9] + yValues[10]) / 2;

  // Insert reference lines using scale-based positioning (not hardcoded pixel math)
  const margin = { top: 40, right: 20, bottom: 50, left: 60 };
  const plotWidth = 600;
  const plotHeight = 400;
  const innerW = plotWidth - margin.left - margin.right;
  const innerH = plotHeight - margin.top - margin.bottom;

  const allX = labData.map((d) => d.x);
  const allY = labData.map((d) => d.y);
  const xMin = Math.min(...allX);
  const xMax = Math.max(...allX);
  const yMin = Math.min(...allY);
  const yMax = Math.max(...allY);

  const xPad = (xMax - xMin) * 0.08;
  const yPad = (yMax - yMin) * 0.08;
  const xDomain = [xMin - xPad, xMax + xPad];
  const yDomain = [yMin - yPad, yMax + yPad];

  const xScale = (v: number) => margin.left + ((v - xDomain[0]) / (xDomain[1] - xDomain[0])) * innerW;
  const yScaleFn = (v: number) => margin.top + innerH - ((v - yDomain[0]) / (yDomain[1] - yDomain[0])) * innerH;

  const refLines =
    `<line x1="${margin.left}" y1="${yScaleFn(medianY).toFixed(2)}" x2="${margin.left + innerW}" y2="${yScaleFn(medianY).toFixed(2)}" stroke="${PALETTE.dataSecondary}" stroke-width="1" stroke-dasharray="6,4" />` +
    `<line x1="${xScale(medianX).toFixed(2)}" y1="${margin.top}" x2="${xScale(medianX).toFixed(2)}" y2="${margin.top + innerH}" stroke="${PALETTE.dataSecondary}" stroke-width="1" stroke-dasharray="6,4" />`;

  return baseSvg.replace('</svg>', refLines + '</svg>');
}

function composeLinearPlots(): string {
  const width = 800;
  const height = 600;
  const halfW = (width - 20) / 2;
  const halfH = (height - 20) / 2;
  const subConfig: Partial<PlotConfig> = {
    width: halfW,
    height: halfH,
    margin: { top: 30, right: 15, bottom: 35, left: 50 },
  };

  // Correlation plot
  const corrPlot = generateScatterPlot({
    data: scatterData,
    showRegression: true,
    config: subConfig,
    title: 'Correlation',
    xLabel: 'X',
    yLabel: 'Y',
  });

  // Intercept plot: split data into subsets and compute intercepts
  const subsetSize = Math.floor(scatterData.length / 5);
  const interceptData: number[] = [];
  for (let i = 0; i < 5; i++) {
    const subset = scatterData.slice(i * subsetSize, (i + 1) * subsetSize);
    const reg = linearRegression(
      subset.map((d) => d.x),
      subset.map((d) => d.y),
    );
    interceptData.push(reg.intercept);
  }
  const interceptPlot = generateLinePlot({
    data: interceptData,
    mode: 'run-sequence',
    config: subConfig,
    title: 'Intercept',
    yLabel: 'Intercept',
  });

  // Slope plot
  const slopeData: number[] = [];
  for (let i = 0; i < 5; i++) {
    const subset = scatterData.slice(i * subsetSize, (i + 1) * subsetSize);
    const reg = linearRegression(
      subset.map((d) => d.x),
      subset.map((d) => d.y),
    );
    slopeData.push(reg.slope);
  }
  const slopePlot = generateLinePlot({
    data: slopeData,
    mode: 'run-sequence',
    config: subConfig,
    title: 'Slope',
    yLabel: 'Slope',
  });

  // Residual SD plot
  const residualData: number[] = [];
  for (let i = 0; i < 5; i++) {
    const subset = scatterData.slice(i * subsetSize, (i + 1) * subsetSize);
    const reg = linearRegression(
      subset.map((d) => d.x),
      subset.map((d) => d.y),
    );
    const residuals = subset.map((d) => d.y - (reg.slope * d.x + reg.intercept));
    const sd = Math.sqrt(mean(residuals.map((r) => r * r)));
    residualData.push(sd);
  }
  const residualPlot = generateLinePlot({
    data: residualData,
    mode: 'run-sequence',
    config: subConfig,
    title: 'Residual SD',
    yLabel: 'Residual SD',
  });

  const panels = [
    { svg: corrPlot, x: 0, y: 0 },
    { svg: interceptPlot, x: halfW + 10, y: 0 },
    { svg: slopePlot, x: 0, y: halfH + 10 },
    { svg: residualPlot, x: halfW + 10, y: halfH + 10 },
  ];

  const cfg: PlotConfig = {
    width,
    height,
    margin: { top: 10, right: 10, bottom: 10, left: 10 },
    fontFamily: "'DM Sans', sans-serif",
  };

  const groups = panels
    .map(
      (p) =>
        `<g transform="translate(${p.x.toFixed(2)}, ${p.y.toFixed(2)})">${stripSvgWrapper(p.svg)}</g>`,
    )
    .join('\n');

  return svgOpen(cfg, 'Linear plots: correlation, intercept, slope, residual SD') + '\n' + groups + '\n</svg>';
}

function composeDoePlots(): string {
  const width = 800;
  const height = 400;
  const thirdW = (width - 30) / 3;
  const subConfig: Partial<PlotConfig> = {
    width: thirdW,
    height: height - 20,
    margin: { top: 30, right: 15, bottom: 35, left: 50 },
  };

  // DOE scatter: response vs run
  const responses = [72.3, 84.7, 78.1, 91.5, 68.9, 80.2, 74.6, 87.3];
  const doeScatter = generateScatterPlot({
    data: responses.map((r, i) => ({ x: i + 1, y: r })),
    config: subConfig,
    title: 'Response vs Run',
    xLabel: 'Run',
    yLabel: 'Response',
  });

  // DOE mean plot (connected-dot style via dedicated generator)
  const doeMean = generateDoeMeanPlot({
    factors: [
      { name: 'Temperature', levels: [{ label: 'Low', value: 73.5 }, { label: 'High', value: 85.9 }] },
      { name: 'Pressure', levels: [{ label: 'Low', value: 76.5 }, { label: 'High', value: 82.9 }] },
    ],
    grandMean: (73.5 + 85.9 + 76.5 + 82.9) / 4,
    config: subConfig,
    title: 'Mean Plot',
    yLabel: 'Mean',
  });

  // DOE SD plot (connected-dot style via dedicated generator)
  const doeSd = generateDoeMeanPlot({
    factors: [
      { name: 'Temperature', levels: [{ label: 'Low', value: 3.9 }, { label: 'High', value: 4.7 }] },
      { name: 'Pressure', levels: [{ label: 'Low', value: 6.8 }, { label: 'High', value: 7.2 }] },
    ],
    grandMean: (3.9 + 4.7 + 6.8 + 7.2) / 4,
    config: subConfig,
    title: 'SD Plot',
    yLabel: 'Std Dev',
  });

  const panels = [
    { svg: doeScatter, x: 0, y: 0 },
    { svg: doeMean, x: thirdW + 10, y: 0 },
    { svg: doeSd, x: 2 * (thirdW + 10), y: 0 },
  ];

  const cfg: PlotConfig = {
    width,
    height,
    margin: { top: 10, right: 10, bottom: 10, left: 10 },
    fontFamily: "'DM Sans', sans-serif",
  };

  const groups = panels
    .map(
      (p) =>
        `<g transform="translate(${p.x.toFixed(2)}, ${p.y.toFixed(2)})">${stripSvgWrapper(p.svg)}</g>`,
    )
    .join('\n');

  return svgOpen(cfg, 'DOE plots: scatter, mean, standard deviation') + '\n' + groups + '\n</svg>';
}

function composeScatterplotMatrix(): string {
  // 4 derived variables for matrix
  const x1 = normalRandom;
  const x2 = normalRandom.map((v) => v + 1.5);
  const x3 = normalRandom.map((v) => v * 2);
  const x4 = normalRandom.map((v) => v * v);
  const vars = [
    { name: 'X1', data: x1 },
    { name: 'X2', data: x2 },
    { name: 'X3', data: x3 },
    { name: 'X4', data: x4 },
  ];
  const k = vars.length;
  const cellSize = 150;
  const gap = 5;
  const labelSpace = 30;
  const totalWidth = k * cellSize + (k - 1) * gap + labelSpace;
  const totalHeight = k * cellSize + (k - 1) * gap + labelSpace;

  const cellConfig: Partial<PlotConfig> = {
    width: cellSize,
    height: cellSize,
    margin: { top: 10, right: 5, bottom: 10, left: 15 },
  };

  let cells = '';
  for (let row = 0; row < k; row++) {
    for (let col = 0; col < k; col++) {
      const ox = labelSpace + col * (cellSize + gap);
      const oy = row * (cellSize + gap);

      if (row === col) {
        // Diagonal: histogram of this variable
        const hist = generateHistogram({
          data: vars[row].data,
          config: cellConfig,
        });
        cells += `<g transform="translate(${ox}, ${oy})">${stripSvgWrapper(hist)}</g>\n`;
      } else {
        // Off-diagonal: scatter plot
        const pairData = vars[col].data.map((x, i) => ({ x, y: vars[row].data[i] }));
        const scatter = generateScatterPlot({
          data: pairData,
          config: cellConfig,
        });
        cells += `<g transform="translate(${ox}, ${oy})">${stripSvgWrapper(scatter)}</g>\n`;
      }
    }
  }

  // Variable labels along left and bottom
  let labels = '';
  for (let i = 0; i < k; i++) {
    const cy = i * (cellSize + gap) + cellSize / 2;
    labels += `<text x="5" y="${cy.toFixed(2)}" text-anchor="start" dominant-baseline="middle" font-size="11" fill="${PALETTE.text}" font-family="'DM Sans', sans-serif">${vars[i].name}</text>\n`;

    const cx = labelSpace + i * (cellSize + gap) + cellSize / 2;
    labels += `<text x="${cx.toFixed(2)}" y="${totalHeight.toFixed(2)}" text-anchor="middle" font-size="11" fill="${PALETTE.text}" font-family="'DM Sans', sans-serif">${vars[i].name}</text>\n`;
  }

  const cfg: PlotConfig = {
    width: totalWidth,
    height: totalHeight,
    margin: { top: 10, right: 10, bottom: 10, left: 10 },
    fontFamily: "'DM Sans', sans-serif",
  };

  return svgOpen(cfg, 'Scatterplot matrix: 4x4 pairwise plots') + '\n' + cells + labels + '</svg>';
}

function composeConditioningPlot(): string {
  // NIST PR1.DAT: Torque vs Time conditioned on Temperature (6 levels)
  // Per NIST Section 1.3.3.26.12: each panel shows Y vs X for one level of Z
  const temps = [...new Set(conditioningData.map((d) => d.temp))].sort((a, b) => a - b);

  const width = 800;
  const height = 580;
  const cols = 3;
  const rows = 2;
  const cellW = (width - 30) / cols;
  const cellH = (height - 20) / rows;
  const subConfig: Partial<PlotConfig> = {
    width: cellW,
    height: cellH,
    margin: { top: 30, right: 15, bottom: 35, left: 50 },
  };

  const panels = temps.map((t, i) => {
    const subset = conditioningData
      .filter((d) => d.temp === t)
      .map((d) => ({ x: d.time, y: d.torque }));
    const col = i % cols;
    const row = Math.floor(i / cols);
    const scatter = generateScatterPlot({
      data: subset,
      showRegression: false,
      config: subConfig,
      title: `Temp = ${t}°C`,
      xLabel: 'Time',
      yLabel: 'Torque',
    });
    return { svg: scatter, x: col * (cellW + 10), y: row * (cellH + 10) };
  });

  const cfg: PlotConfig = {
    width,
    height,
    margin: { top: 10, right: 10, bottom: 10, left: 10 },
    fontFamily: "'DM Sans', sans-serif",
  };

  const groups = panels
    .map(
      (p) =>
        `<g transform="translate(${p.x.toFixed(2)}, ${p.y.toFixed(2)})">${stripSvgWrapper(p.svg)}</g>`,
    )
    .join('\n');

  return svgOpen(cfg, 'Conditioning plot: Torque vs Time by Temperature') + '\n' + groups + '\n</svg>';
}

// ---------------------------------------------------------------------------
// Primary renderer map — all 29 graphical techniques
// ---------------------------------------------------------------------------

const TECHNIQUE_RENDERERS: Record<string, () => string> = {
  // 18 direct generator calls
  'histogram': () => generateHistogram({
    data: normalRandom,
    showKDE: true,
    title: 'Histogram',
    xLabel: 'Value',
    yLabel: 'Frequency',
  }),
  'box-plot': () => generateBoxPlot({
    groups: boxPlotData.map((g) => ({ label: g.group, values: g.values })),
    title: 'Box Plot',
    yLabel: 'Transmittance',
  }),
  'scatter-plot': () => generateScatterPlot({
    data: scatterData,
    showRegression: true,
    showConfidenceBand: true,
    title: 'Scatter Plot',
    xLabel: 'Load (kN)',
    yLabel: 'Deflection (mm)',
  }),
  'run-sequence-plot': () => generateLinePlot({
    data: timeSeries,
    mode: 'run-sequence',
    title: 'Run Sequence Plot',
    yLabel: 'Response (mV)',
  }),
  'lag-plot': () => generateLagPlot({
    data: timeSeries,
    lag: 1,
    title: 'Lag 1 Plot',
  }),
  'autocorrelation-plot': () => generateLinePlot({
    data: timeSeries,
    mode: 'autocorrelation',
    title: 'Autocorrelation Plot',
  }),
  '4-plot': () => generate4Plot(timeSeries),
  '6-plot': () => generate6Plot(scatterData),
  'normal-probability-plot': () => generateProbabilityPlot({
    data: normalRandom,
    type: 'normal',
    title: 'Normal Probability Plot',
  }),
  'probability-plot': () => generateProbabilityPlot({
    data: uniformRandom,
    type: 'normal',
    title: 'Probability Plot (Uniform Data)',
  }),
  'qq-plot': () => generateProbabilityPlot({
    data: normalRandom,
    type: 'qq',
    title: 'Q-Q Plot',
  }),
  'spectral-plot': () => generateSpectralPlot({
    data: timeSeries,
    title: 'Spectral Plot',
  }),
  'contour-plot': () => generateContourPlot({
    grid: responseSurface,
    title: 'Contour Plot',
    xLabel: 'Temperature',
    yLabel: 'Pressure',
  }),
  'star-plot': () => generateStarPlot({
    axes: [
      { label: 'Location', value: 8 },
      { label: 'Scale', value: 6 },
      { label: 'Skewness', value: 3 },
      { label: 'Kurtosis', value: 5 },
      { label: 'Randomness', value: 9 },
    ],
    title: 'Star Plot',
  }),
  'weibull-plot': () => generateProbabilityPlot({
    data: normalRandom.map((v) => Math.exp(v)),
    type: 'weibull',
    title: 'Weibull Probability Plot',
  }),
  'ppcc-plot': () => generateProbabilityPlot({
    data: normalRandom,
    type: 'ppcc',
    title: 'PPCC Plot',
  }),
  'mean-plot': () => generateDoeMeanPlot({
    factors: [
      { name: 'Temperature', levels: [{ label: 'Low', value: 73.5 }, { label: 'High', value: 85.9 }] },
      { name: 'Pressure', levels: [{ label: 'Low', value: 76.5 }, { label: 'High', value: 82.9 }] },
    ],
    grandMean: (73.5 + 85.9 + 76.5 + 82.9) / 4,
    title: 'Mean Plot',
    yLabel: 'Mean Response',
  }),
  'std-deviation-plot': () => generateDoeMeanPlot({
    factors: [
      { name: 'Temperature', levels: [{ label: 'Low', value: 3.9 }, { label: 'High', value: 4.7 }] },
      { name: 'Pressure', levels: [{ label: 'Low', value: 7.2 }, { label: 'High', value: 7.9 }] },
    ],
    grandMean: (3.9 + 4.7 + 7.2 + 7.9) / 4,
    title: 'Standard Deviation Plot',
    yLabel: 'Std Dev',
  }),

  // 11 composition-based techniques (5 now use dedicated generators)
  'bihistogram': () => generateBihistogram({
    topData: normalRandom,
    bottomData: uniformRandom.map((v) => v * 4 - 2),
    topLabel: 'Group A (Normal)',
    bottomLabel: 'Group B (Uniform)',
    title: 'Bihistogram',
    xLabel: 'Value',
  }),
  'block-plot': () => {
    return generateBlockPlot({
      blocks: [
        { label: 'Block 1', values: [
          { group: 'Catalyst A', mean: mean(doeFactors.filter((f) => f.factor === 'Catalyst' && f.level === 'A').map((f) => f.response)) },
          { group: 'Catalyst B', mean: mean(doeFactors.filter((f) => f.factor === 'Catalyst' && f.level === 'B').map((f) => f.response)) },
        ]},
        { label: 'Block 2', values: [
          { group: 'Catalyst A', mean: mean(doeFactors.filter((f) => f.factor === 'Temperature' && f.level === 'Low').map((f) => f.response)) },
          { group: 'Catalyst B', mean: mean(doeFactors.filter((f) => f.factor === 'Temperature' && f.level === 'High').map((f) => f.response)) },
        ]},
      ],
      title: 'Block Plot',
      yLabel: 'Mean Response',
      xLabel: 'Block',
    });
  },
  'bootstrap-plot': composeBootstrapPlot,
  'box-cox-linearity': composeBoxCoxLinearity,
  'box-cox-normality': composeBoxCoxNormality,
  'complex-demodulation': composeComplexDemodulation,
  'youden-plot': composeYoudenPlot,
  'linear-plots': composeLinearPlots,
  'doe-plots': composeDoePlots,
  'scatterplot-matrix': composeScatterplotMatrix,
  'conditioning-plot': composeConditioningPlot,
};

// ---------------------------------------------------------------------------
// Tier B variant datasets — 6 techniques with distinct statistical patterns
// ---------------------------------------------------------------------------

const VARIANT_RENDERERS: Record<string, Array<{ label: string; render: () => string }>> = {
  // Histogram: 8 variants
  'histogram': [
    {
      label: 'Symmetric',
      render: () => generateHistogram({
        data: normalRandom,
        showKDE: true,
        title: 'Symmetric (Normal)',
        xLabel: 'Value',
        yLabel: 'Frequency',
      }),
    },
    {
      label: 'Right Skewed',
      render: () => generateHistogram({
        data: normalRandom.map((v) => Math.exp(v * 0.5)),
        showKDE: true,
        title: 'Right Skewed',
        xLabel: 'Value',
        yLabel: 'Frequency',
      }),
    },
    {
      label: 'Left Skewed',
      render: () => generateHistogram({
        data: normalRandom.map((v) => -Math.exp(-v * 0.5) + 5),
        showKDE: true,
        title: 'Left Skewed',
        xLabel: 'Value',
        yLabel: 'Frequency',
      }),
    },
    {
      label: 'Bimodal',
      render: () => generateHistogram({
        data: [
          ...normalRandom.slice(0, 50).map((v) => v - 2),
          ...normalRandom.slice(50).map((v) => v + 2),
        ],
        showKDE: true,
        title: 'Bimodal',
        xLabel: 'Value',
        yLabel: 'Frequency',
      }),
    },
    {
      label: 'Uniform',
      render: () => generateHistogram({
        data: uniformRandom,
        showKDE: true,
        title: 'Uniform',
        xLabel: 'Value',
        yLabel: 'Frequency',
      }),
    },
    {
      label: 'Heavy Tailed',
      render: () => generateHistogram({
        data: normalRandom.map((v) => v * (1 + Math.abs(v))),
        showKDE: true,
        title: 'Heavy Tailed',
        xLabel: 'Value',
        yLabel: 'Frequency',
      }),
    },
    {
      label: 'Peaked',
      render: () => generateHistogram({
        data: normalRandom.map((v) => v * 0.3),
        showKDE: true,
        title: 'Peaked (Leptokurtic)',
        xLabel: 'Value',
        yLabel: 'Frequency',
      }),
    },
    {
      label: 'With Outlier',
      render: () => generateHistogram({
        data: [...normalRandom.slice(0, 99), 8.5],
        showKDE: true,
        title: 'With Outlier',
        xLabel: 'Value',
        yLabel: 'Frequency',
      }),
    },
  ],

  // Scatter plot: 12 variants
  'scatter-plot': [
    {
      label: 'Strong Positive',
      render: () => generateScatterPlot({
        data: scatterData,
        showRegression: true,
        title: 'Strong Positive',
        xLabel: 'X',
        yLabel: 'Y',
      }),
    },
    {
      label: 'Strong Negative',
      render: () => generateScatterPlot({
        data: scatterData.map((d) => ({ x: d.x, y: -d.y + 7 })),
        showRegression: true,
        title: 'Strong Negative',
        xLabel: 'X',
        yLabel: 'Y',
      }),
    },
    {
      label: 'Weak Positive',
      render: () => {
        const rng = seededRandom(101);
        return generateScatterPlot({
          data: scatterData.map((d) => ({ x: d.x, y: d.y + (rng() - 0.5) * 4 })),
          showRegression: true,
          title: 'Weak Positive',
          xLabel: 'X',
          yLabel: 'Y',
        });
      },
    },
    {
      label: 'No Correlation',
      render: () => {
        const rng = seededRandom(202);
        const shuffledY = scatterData.map((d) => d.y).sort(() => rng() - 0.5);
        return generateScatterPlot({
          data: scatterData.map((d, i) => ({ x: d.x, y: shuffledY[i] })),
          showRegression: true,
          title: 'No Correlation',
          xLabel: 'X',
          yLabel: 'Y',
        });
      },
    },
    {
      label: 'Quadratic',
      render: () => {
        const rng = seededRandom(303);
        return generateScatterPlot({
          data: scatterData.map((d) => ({
            x: d.x,
            y: 0.02 * (d.x - 12) ** 2 + (rng() - 0.5) * 0.5,
          })),
          title: 'Quadratic',
          xLabel: 'X',
          yLabel: 'Y',
        });
      },
    },
    {
      label: 'Exponential',
      render: () => generateScatterPlot({
        data: scatterData.map((d) => ({ x: d.x, y: Math.exp(d.x * 0.1) })),
        title: 'Exponential',
        xLabel: 'X',
        yLabel: 'Y',
      }),
    },
    {
      label: 'Heteroscedastic',
      render: () => {
        const rng = seededRandom(404);
        return generateScatterPlot({
          data: scatterData.map((d) => ({
            x: d.x,
            y: d.y + (rng() - 0.5) * d.x * 0.3,
          })),
          showRegression: true,
          title: 'Heteroscedastic',
          xLabel: 'X',
          yLabel: 'Y',
        });
      },
    },
    {
      label: 'Clustered',
      render: () => {
        const rng = seededRandom(505);
        const clusters: { x: number; y: number }[] = [];
        const centers = [
          { cx: 5, cy: 2 },
          { cx: 15, cy: 5 },
          { cx: 22, cy: 3 },
        ];
        centers.forEach((c) => {
          for (let i = 0; i < 16; i++) {
            clusters.push({
              x: c.cx + (rng() - 0.5) * 4,
              y: c.cy + (rng() - 0.5) * 2,
            });
          }
        });
        return generateScatterPlot({
          data: clusters,
          title: 'Clustered',
          xLabel: 'X',
          yLabel: 'Y',
        });
      },
    },
    {
      label: 'With Outliers',
      render: () => generateScatterPlot({
        data: [
          ...scatterData,
          { x: 5, y: 6 },
          { x: 20, y: 0.5 },
        ],
        showRegression: true,
        title: 'With Outliers',
        xLabel: 'X',
        yLabel: 'Y',
      }),
    },
    {
      label: 'Fan-shaped',
      render: () => {
        const rng = seededRandom(606);
        return generateScatterPlot({
          data: scatterData.map((d) => ({
            x: d.x,
            y: d.y * 0.5 + (rng() - 0.5) * (d.x / 24) * 4,
          })),
          title: 'Fan-shaped',
          xLabel: 'X',
          yLabel: 'Y',
        });
      },
    },
    {
      label: 'Sinusoidal',
      render: () => generateScatterPlot({
        data: scatterData.map((d) => ({
          x: d.x,
          y: 3 + 2 * Math.sin(d.x * 0.4),
        })),
        title: 'Sinusoidal',
        xLabel: 'X',
        yLabel: 'Y',
      }),
    },
    {
      label: 'Step Function',
      render: () => {
        const rng = seededRandom(707);
        return generateScatterPlot({
          data: scatterData.map((d) => ({
            x: d.x,
            y: Math.floor(d.x / 5) * 1.5 + 1 + (rng() - 0.5) * 0.3,
          })),
          title: 'Step Function',
          xLabel: 'X',
          yLabel: 'Y',
        });
      },
    },
  ],

  // Normal probability plot: 4 variants
  'normal-probability-plot': [
    {
      label: 'Normal',
      render: () => generateProbabilityPlot({
        data: normalRandom,
        type: 'normal',
        title: 'Normal Data',
      }),
    },
    {
      label: 'Right Skewed',
      render: () => generateProbabilityPlot({
        data: normalRandom.map((v) => Math.exp(v * 0.5)),
        type: 'normal',
        title: 'Right Skewed Data',
      }),
    },
    {
      label: 'Heavy Tailed',
      render: () => generateProbabilityPlot({
        data: normalRandom.map((v) => v * (1 + Math.abs(v) * 0.3)),
        type: 'normal',
        title: 'Heavy Tailed Data',
      }),
    },
    {
      label: 'Bimodal',
      render: () => generateProbabilityPlot({
        data: [
          ...normalRandom.slice(0, 50).map((v) => v - 2),
          ...normalRandom.slice(50).map((v) => v + 2),
        ],
        type: 'normal',
        title: 'Bimodal Data',
      }),
    },
  ],

  // Lag plot: 4 variants
  'lag-plot': [
    {
      label: 'Random',
      render: () => generateLagPlot({
        data: normalRandom,
        lag: 1,
        title: 'Random (No Structure)',
      }),
    },
    {
      label: 'Autoregressive',
      render: () => {
        // AR(1) with phi=0.9
        const rng = seededRandom(888);
        const arData: number[] = [0];
        for (let i = 1; i < 100; i++) {
          arData.push(0.9 * arData[i - 1] + (rng() - 0.5) * 0.5);
        }
        return generateLagPlot({
          data: arData,
          lag: 1,
          title: 'Autoregressive AR(1)',
        });
      },
    },
    {
      label: 'Seasonal',
      render: () => {
        const rng = seededRandom(999);
        const seasonal = Array.from({ length: 100 }, (_, i) =>
          Math.sin(i * 2 * Math.PI / 12) + (rng() - 0.5) * 0.3,
        );
        return generateLagPlot({
          data: seasonal,
          lag: 1,
          title: 'Seasonal Pattern',
        });
      },
    },
    {
      label: 'Trend',
      render: () => {
        const rng = seededRandom(1111);
        const trend = Array.from({ length: 100 }, (_, i) =>
          i * 0.05 + (rng() - 0.5) * 0.5,
        );
        return generateLagPlot({
          data: trend,
          lag: 1,
          title: 'Linear Trend',
        });
      },
    },
  ],

  // Autocorrelation plot: 4 variants
  'autocorrelation-plot': [
    {
      label: 'White Noise',
      render: () => generateLinePlot({
        data: normalRandom,
        mode: 'autocorrelation',
        title: 'White Noise',
      }),
    },
    {
      label: 'AR(1)',
      render: () => {
        const rng = seededRandom(1234);
        const arData: number[] = [0];
        for (let i = 1; i < 100; i++) {
          arData.push(0.9 * arData[i - 1] + (rng() - 0.5) * 0.5);
        }
        return generateLinePlot({
          data: arData,
          mode: 'autocorrelation',
          title: 'AR(1) Process',
        });
      },
    },
    {
      label: 'MA(1)',
      render: () => {
        const rng = seededRandom(2345);
        const noise = Array.from({ length: 101 }, () => (rng() - 0.5) * 2);
        const maData = Array.from({ length: 100 }, (_, i) =>
          noise[i + 1] + 0.7 * noise[i],
        );
        return generateLinePlot({
          data: maData,
          mode: 'autocorrelation',
          title: 'MA(1) Process',
        });
      },
    },
    {
      label: 'Seasonal',
      render: () => {
        const rng = seededRandom(3456);
        const seasonal = Array.from({ length: 100 }, (_, i) =>
          Math.sin(i * 2 * Math.PI / 12) + (rng() - 0.5) * 0.3,
        );
        return generateLinePlot({
          data: seasonal,
          mode: 'autocorrelation',
          title: 'Seasonal Pattern',
        });
      },
    },
  ],

  // Spectral plot: 3 variants
  'spectral-plot': [
    {
      label: 'Single Frequency',
      render: () => {
        const rng = seededRandom(4567);
        const singleFreq = Array.from({ length: 128 }, (_, i) =>
          Math.sin(i * 2 * Math.PI / 10) + (rng() - 0.5) * 0.5,
        );
        return generateSpectralPlot({
          data: singleFreq,
          title: 'Single Frequency',
        });
      },
    },
    {
      label: 'Multiple Frequencies',
      render: () => {
        const rng = seededRandom(5678);
        const multiFreq = Array.from({ length: 128 }, (_, i) =>
          Math.sin(i * 2 * Math.PI / 10) +
          0.5 * Math.sin(i * 2 * Math.PI / 25) +
          0.3 * Math.sin(i * 2 * Math.PI / 5) +
          (rng() - 0.5) * 0.3,
        );
        return generateSpectralPlot({
          data: multiFreq,
          title: 'Multiple Frequencies',
        });
      },
    },
    {
      label: 'White Noise',
      render: () => generateSpectralPlot({
        data: normalRandom,
        title: 'White Noise',
      }),
    },
  ],
};

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Render the default SVG for a technique by slug.
 * Returns empty string if slug is not recognized.
 */
export function renderTechniquePlot(slug: string): string {
  const renderer = TECHNIQUE_RENDERERS[slug];
  return renderer ? renderer() : '';
}

/**
 * Render all variant SVGs for a Tier B technique.
 * Returns empty array if the technique has no variants.
 * The first entry is the default variant.
 */
export function renderVariants(slug: string): Array<{ label: string; svg: string }> {
  const variants = VARIANT_RENDERERS[slug];
  if (!variants) return [];
  return variants.map((v) => ({ label: v.label, svg: v.render() }));
}
