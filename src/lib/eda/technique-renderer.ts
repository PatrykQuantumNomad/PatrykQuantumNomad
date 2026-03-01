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
  generateStarGrid,
  generateContourPlot,
  generate4Plot,
  generate6Plot,
  generateBihistogram,
  generateBlockPlot,
  generateDoeMeanPlot,
  generateDoeScatterPlot,
  PALETTE,
  type PlotConfig,
} from './svg-generators';
import { svgOpen, DEFAULT_CONFIG } from './svg-generators/plot-base';
import { scaleLinear } from 'd3-scale';
import { extent } from 'd3-array';
import {
  normalRandom,
  uniformRandom,
  scatterData,
  timeSeries,
  doeFactors,
  boxbike2,
  boxPlotData,
  responseSurface,
  boxCoxLinearityData,
  conditioningData,
  beamDeflections,
  randomWalk,
  flickerNoise,
  airplaneGlassFailure,
  ceramicStrength,
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
  // Per NIST 1.3.3.4: 6-panel layout (3x2)
  // Top row: line plots of mean, median, midrange vs. subsample number
  // Bottom row: corresponding histograms of each statistic
  const rng = seededRandom(42);
  const src = uniformRandom;
  const n = src.length;
  const B = 100;

  const means: number[] = [];
  const medians: number[] = [];
  const midranges: number[] = [];

  for (let b = 0; b < B; b++) {
    const sample: number[] = [];
    for (let i = 0; i < n; i++) {
      sample.push(src[Math.floor(rng() * n)]);
    }
    // Mean
    means.push(sample.reduce((s, v) => s + v, 0) / n);
    // Median
    const sorted = sample.slice().sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    medians.push(sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2);
    // Midrange
    midranges.push((sorted[0] + sorted[sorted.length - 1]) / 2);
  }

  // 3-column, 2-row layout
  const outerPad = 6;
  const width = 800;
  const height = 520;
  const gap = 10;
  const thirdW = (width - 2 * gap - outerPad) / 3;
  const halfH = (height - gap) / 2;
  const subConfig: Partial<PlotConfig> = {
    width: thirdW,
    height: halfH,
    margin: { top: 28, right: 12, bottom: 32, left: 52 },
  };

  const stats: { label: string; data: number[] }[] = [
    { label: 'Bootstrap Mean', data: means },
    { label: 'Bootstrap Median', data: medians },
    { label: 'Bootstrap Midrange', data: midranges },
  ];

  const panels: { svg: string; x: number; y: number }[] = [];
  for (let i = 0; i < 3; i++) {
    const x = outerPad + i * (thirdW + gap);
    // Top: line plot
    panels.push({
      svg: generateLinePlot({
        data: stats[i].data,
        mode: 'run-sequence',
        config: subConfig,
        title: stats[i].label,
      }),
      x,
      y: 0,
    });
    // Bottom: histogram
    panels.push({
      svg: generateHistogram({
        data: stats[i].data,
        config: subConfig,
        title: stats[i].label,
        xLabel: 'Value',
        yLabel: 'Frequency',
      }),
      x,
      y: halfH + gap,
    });
  }

  const fullConfig: PlotConfig = { width, height, margin: { top: 0, right: 0, bottom: 0, left: 0 }, fontFamily: 'system-ui, sans-serif' };
  const groups = panels
    .map((p) => `<g transform="translate(${p.x.toFixed(2)}, ${p.y.toFixed(2)})">${stripSvgWrapper(p.svg)}</g>`)
    .join('\n');

  return svgOpen(fullConfig, 'Bootstrap plot: mean, median, and midrange') + '\n' + groups + '\n</svg>';
}

function composeBoxCoxLinearity(): string {
  // Per NIST Section 1.3.3.5: 3-panel layout matching the NIST sample plot
  // Panel 1 (left):   Original data scatter (Y vs X) with linear fit
  // Panel 2 (center): Box-Cox linearity plot (correlation vs lambda)
  // Panel 3 (right):  Transformed data scatter (Y vs X^lambda_opt) with linear fit

  const xVals = boxCoxLinearityData.map((d) => d.x);
  const yVals = boxCoxLinearityData.map((d) => d.y);
  const xPositive = xVals.map((v) => Math.max(v, 0.01));

  // Sweep lambda values for the linearity plot
  const lambdas: number[] = [];
  for (let lam = -2; lam <= 2; lam += 0.2) {
    lambdas.push(parseFloat(lam.toFixed(1)));
  }

  const correlations: { x: number; y: number }[] = lambdas.map((lam) => {
    const transformed = xPositive.map((x) => {
      if (Math.abs(lam) < 0.001) return Math.log(x);
      return (Math.pow(x, lam) - 1) / lam;
    });
    const reg = linearRegression(transformed, yVals);
    const sign = reg.slope >= 0 ? 1 : -1;
    return { x: lam, y: sign * Math.sqrt(Math.max(0, reg.r2)) };
  });

  const sorted = correlations.sort((a, b) => a.x - b.x);

  // Find optimal lambda
  let optLam = 1;
  let maxCorr = 0;
  for (const pt of sorted) {
    if (Math.abs(pt.y) > maxCorr) { maxCorr = Math.abs(pt.y); optLam = pt.x; }
  }

  // Build transformed X using optimal lambda
  const xTransformed = xPositive.map((x) => {
    if (Math.abs(optLam) < 0.001) return Math.log(x);
    return (Math.pow(x, optLam) - 1) / optLam;
  });

  // 3-column, 1-row layout (following composeBootstrapPlot pattern)
  const width = 840;
  const height = 360;
  const gap = 14;
  const thirdW = (width - 2 * gap) / 3;
  const subConfig: Partial<PlotConfig> = {
    width: thirdW,
    height,
    margin: { top: 34, right: 16, bottom: 50, left: 58 },
  };

  // Panel 1: Original scatter Y vs X with regression line
  const originalData = xVals.map((x, i) => ({ x, y: yVals[i] }));
  const panel1 = generateScatterPlot({
    data: originalData,
    showRegression: true,
    config: subConfig,
    title: 'Original Data (Y vs X)',
    xLabel: 'X',
    yLabel: 'Y',
  });

  // Panel 2: Linearity plot (correlation vs lambda) with connecting line
  const panel2Base = generateScatterPlot({
    data: sorted,
    showRegression: false,
    config: subConfig,
    title: `Box-Cox Linearity (\u03BB = ${optLam.toFixed(1)})`,
    xLabel: 'Lambda',
    yLabel: 'Correlation',
  });
  // Add polyline through the correlation curve
  const innerW2 = thirdW - 58 - 16;
  const innerH2 = height - 34 - 50;
  const xExt = [Math.min(...sorted.map((d) => d.x)), Math.max(...sorted.map((d) => d.x))];
  const yExt = [Math.min(...sorted.map((d) => d.y)), Math.max(...sorted.map((d) => d.y))];
  const xPad = (xExt[1] - xExt[0]) * 0.05;
  const yPad = (yExt[1] - yExt[0]) * 0.05;
  const xSc = (v: number) => 58 + ((v - (xExt[0] - xPad)) / ((xExt[1] + xPad) - (xExt[0] - xPad))) * innerW2;
  const ySc = (v: number) => 34 + innerH2 - ((v - (yExt[0] - yPad)) / ((yExt[1] + yPad) - (yExt[0] - yPad))) * innerH2;
  const polyPoints = sorted.map((d) => `${xSc(d.x).toFixed(2)},${ySc(d.y).toFixed(2)}`).join(' ');
  const polyline = `<polyline points="${polyPoints}" fill="none" stroke="${PALETTE.dataPrimary}" stroke-width="2" />`;
  const panel2 = panel2Base.replace('</svg>', polyline + '</svg>');

  // Panel 3: Transformed scatter Y vs T(X) with regression line
  const transformedData = xTransformed.map((tx, i) => ({ x: tx, y: yVals[i] }));
  const lamLabel = optLam === 0 ? 'ln(X)' : optLam === 1 ? 'X' : optLam === 0.5 ? '\u221AX' : `X^${optLam.toFixed(1)}`;
  const panel3 = generateScatterPlot({
    data: transformedData,
    showRegression: true,
    config: subConfig,
    title: `Transformed (Y vs ${lamLabel})`,
    xLabel: `T(X), \u03BB=${optLam.toFixed(1)}`,
    yLabel: 'Y',
  });

  // Compose 3 panels into single SVG
  const panels = [
    { svg: panel1, x: 0 },
    { svg: panel2, x: thirdW + gap },
    { svg: panel3, x: 2 * (thirdW + gap) },
  ];

  const fullConfig: PlotConfig = { width, height, margin: { top: 0, right: 0, bottom: 0, left: 0 }, fontFamily: 'system-ui, sans-serif' };
  const groups = panels
    .map((p) => `<g transform="translate(${p.x.toFixed(2)}, 0)">${stripSvgWrapper(p.svg)}</g>`)
    .join('\n');

  return svgOpen(fullConfig, 'Box-Cox linearity plot: original data, correlation vs lambda, and transformed data') + '\n' + groups + '\n</svg>';
}

function composeBoxCoxNormality(): string {
  // Per NIST Section 1.3.3.6: 4-panel layout matching the NIST sample plot
  // Panel 1 (top-left):     Histogram of original (skewed) data
  // Panel 2 (top-right):    Box-Cox normality plot (PPCC vs lambda)
  // Panel 3 (bottom-left):  Histogram of transformed data
  // Panel 4 (bottom-right): Normal probability plot of transformed data

  // Lognormal data (right-skewed) — optimal λ ≈ 0 (log transform) per NIST example
  const dataPos = normalRandom.map((v) => Math.exp(v));

  // Sweep lambda values, compute normality correlation (PPCC)
  const lambdas: number[] = [];
  for (let lam = -2; lam <= 2; lam += 0.2) {
    lambdas.push(parseFloat(lam.toFixed(1)));
  }

  const pairs: { x: number; y: number }[] = lambdas.map((lam) => {
    const transformed = dataPos.map((y) => {
      if (Math.abs(lam) < 0.001) return Math.log(y);
      return (Math.pow(y, lam) - 1) / lam;
    });
    const sortedTrans = [...transformed].sort((a, b) => a - b);
    const n = sortedTrans.length;
    const theoretical: number[] = [];
    for (let i = 0; i < n; i++) {
      // Filliben plotting positions (matching NIST handbook)
      let p: number;
      if (i === 0) {
        p = 1 - Math.pow(0.5, 1 / n);
      } else if (i === n - 1) {
        p = Math.pow(0.5, 1 / n);
      } else {
        p = (i + 1 - 0.3175) / (n + 0.365);
      }
      const t = Math.sqrt(-2 * Math.log(p < 0.5 ? p : 1 - p));
      const q = t - (2.515517 + 0.802853 * t + 0.010328 * t * t) /
        (1 + 1.432788 * t + 0.189269 * t * t + 0.001308 * t * t * t);
      theoretical.push(p < 0.5 ? -q : q);
    }
    const reg = linearRegression(theoretical, sortedTrans);
    return { x: lam, y: Math.sqrt(Math.max(0, reg.r2)) };
  });

  const sorted = [...pairs].sort((a, b) => a.x - b.x);

  // Find optimal lambda
  let optLam = 0;
  let maxPPCC = 0;
  for (const pt of sorted) {
    if (pt.y > maxPPCC) { maxPPCC = pt.y; optLam = pt.x; }
  }

  // Build transformed data using optimal lambda
  const dataTransformed = dataPos.map((y) => {
    if (Math.abs(optLam) < 0.001) return Math.log(y);
    return (Math.pow(y, optLam) - 1) / optLam;
  });

  // 2x2 grid layout
  const width = 840;
  const height = 680;
  const gap = 14;
  const halfW = (width - gap) / 2;
  const halfH = (height - gap) / 2;
  const subConfig: Partial<PlotConfig> = {
    width: halfW,
    height: halfH,
    margin: { top: 34, right: 16, bottom: 50, left: 58 },
  };

  // Panel 1 (top-left): Histogram of original skewed data
  const panel1 = generateHistogram({
    data: dataPos,
    config: subConfig,
    title: 'Original Data (Right-Skewed)',
    xLabel: 'Value',
    yLabel: 'Frequency',
  });

  // Panel 2 (top-right): Box-Cox normality plot (PPCC vs lambda) with polyline
  const panel2Base = generateScatterPlot({
    data: sorted,
    showRegression: false,
    config: subConfig,
    title: `Box-Cox Normality (\u03BB = ${optLam.toFixed(1)})`,
    xLabel: 'Lambda',
    yLabel: 'PPCC',
  });
  const innerW2 = halfW - 58 - 16;
  const innerH2 = halfH - 34 - 50;
  const xExt = [Math.min(...sorted.map((d) => d.x)), Math.max(...sorted.map((d) => d.x))];
  const yExt = [Math.min(...sorted.map((d) => d.y)), Math.max(...sorted.map((d) => d.y))];
  const xPad = (xExt[1] - xExt[0]) * 0.05;
  const yPad = (yExt[1] - yExt[0]) * 0.05;
  const xSc = (v: number) => 58 + ((v - (xExt[0] - xPad)) / ((xExt[1] + xPad) - (xExt[0] - xPad))) * innerW2;
  const ySc = (v: number) => 34 + innerH2 - ((v - (yExt[0] - yPad)) / ((yExt[1] + yPad) - (yExt[0] - yPad))) * innerH2;
  const polyPoints = sorted.map((d) => `${xSc(d.x).toFixed(2)},${ySc(d.y).toFixed(2)}`).join(' ');
  const polyline = `<polyline points="${polyPoints}" fill="none" stroke="${PALETTE.dataPrimary}" stroke-width="2" />`;
  const panel2 = panel2Base.replace('</svg>', polyline + '</svg>');

  // Panel 3 (bottom-left): Histogram of transformed data
  const lamLabel = optLam === 0 ? 'ln(Y)' : optLam === 1 ? 'Y' : `T(Y), \u03BB=${optLam.toFixed(1)}`;
  const panel3 = generateHistogram({
    data: dataTransformed,
    config: subConfig,
    title: `Transformed Data (${lamLabel})`,
    xLabel: lamLabel,
    yLabel: 'Frequency',
  });

  // Panel 4 (bottom-right): Normal probability plot of transformed data
  const panel4 = generateProbabilityPlot({
    data: dataTransformed,
    type: 'normal',
    config: subConfig,
    title: 'Normal Prob. Plot (Transformed)',
    xLabel: 'Theoretical Quantiles',
    yLabel: lamLabel,
  });

  // Compose 4 panels into single SVG
  const panels = [
    { svg: panel1, x: 0, y: 0 },
    { svg: panel2, x: halfW + gap, y: 0 },
    { svg: panel3, x: 0, y: halfH + gap },
    { svg: panel4, x: halfW + gap, y: halfH + gap },
  ];

  const fullConfig: PlotConfig = { width, height, margin: { top: 0, right: 0, bottom: 0, left: 0 }, fontFamily: 'system-ui, sans-serif' };
  const groups = panels
    .map((p) => `<g transform="translate(${p.x.toFixed(2)}, ${p.y.toFixed(2)})">${stripSvgWrapper(p.svg)}</g>`)
    .join('\n');

  return svgOpen(fullConfig, 'Box-Cox normality plot: original histogram, PPCC vs lambda, transformed histogram, and normal probability plot') + '\n' + groups + '\n</svg>';
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

  // Use LEW.DAT (beam deflections) — the NIST sample dataset for this technique.
  // NIST uses separate frequencies: correct freq for amplitude, deliberately
  // wrong freq for phase (to show the sawtooth drift).
  const data = beamDeflections;
  const n = data.length;
  const filterHalfWidth = 30;

  // Low-pass filter: centred moving average
  function movingAvg(arr: number[], hw: number): number[] {
    const out: number[] = [];
    for (let i = 0; i < arr.length; i++) {
      const lo = Math.max(0, i - hw);
      const hi = Math.min(arr.length - 1, i + hw);
      let s = 0;
      for (let j = lo; j <= hi; j++) s += arr[j];
      out.push(s / (hi - lo + 1));
    }
    return out;
  }

  // Helper: demodulate at a given frequency
  function demodulate(freq: number) {
    const re: number[] = [];
    const im: number[] = [];
    for (let i = 0; i < n; i++) {
      re.push(data[i] * Math.cos(2 * Math.PI * freq * i));
      im.push(data[i] * Math.sin(2 * Math.PI * freq * i));
    }
    return { re: movingAvg(re, filterHalfWidth), im: movingAvg(im, filterHalfWidth) };
  }

  // Amplitude plot: use correct frequency (0.3025) for stable envelope (NIST 1.3.3.8)
  const ampDemod = demodulate(0.3025);
  const amplitudeData = ampDemod.re.map((r, i) =>
    2 * Math.sqrt(r * r + ampDemod.im[i] * ampDemod.im[i])
  );

  // Phase plot: use wrong frequency (0.28) to show sawtooth drift (NIST 1.3.3.9)
  const phaseDemod = demodulate(0.28);
  const phaseScatter: { x: number; y: number }[] = [];
  for (let i = filterHalfWidth; i < n - filterHalfWidth; i++) {
    phaseScatter.push({
      x: i,
      y: Math.atan2(phaseDemod.im[i], phaseDemod.re[i]),
    });
  }

  const ampPlot = generateLinePlot({
    data: amplitudeData,
    mode: 'time-series',
    config: subConfig,
    title: 'Complex Demodulation Amplitude Plot',
    yLabel: 'Estimated Amplitude',
  });

  const phasePlot = generateScatterPlot({
    data: phaseScatter,
    config: subConfig,
    title: 'Complex Demodulation Phase Plot',
    xLabel: 'Time',
    yLabel: 'Estimated Phase',
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
  // Lab-to-lab paired measurements: between-lab bias is shared across both runs
  // NIST convention: Y-axis = Run 1 (Response 1), X-axis = Run 2 (Response 2)
  const rng = seededRandom(123);
  const run1Values: number[] = [];
  const run2Values: number[] = [];
  for (let i = 0; i < 20; i++) {
    const labBias = (rng() - 0.5) * 12; // between-lab systematic bias (shared)
    run1Values.push(50 + labBias + (rng() - 0.5) * 3);
    run2Values.push(50 + labBias + (rng() - 0.5) * 3);
  }
  const labData = run1Values.map((r1, i) => ({ x: run2Values[i], y: r1 }));

  const baseSvg = generateScatterPlot({
    data: labData,
    showRegression: false,
    title: 'Youden Plot',
    xLabel: 'Run 2 Measurement',
    yLabel: 'Run 1 Measurement',
  });

  // Remove scatter circles — NIST uses lab-number text as the only plot symbol
  const svgNoCircles = baseSvg.replace(/<circle[^/]*\/>/g, '');

  // Compute medians for reference lines
  const xValues = labData.map((d) => d.x).sort((a, b) => a - b);
  const yValues = labData.map((d) => d.y).sort((a, b) => a - b);
  const medianX = (xValues[9] + xValues[10]) / 2;
  const medianY = (yValues[9] + yValues[10]) / 2;

  // Replicate the same d3 scales used by generateScatterPlot
  const { margin } = DEFAULT_CONFIG;
  const innerW = DEFAULT_CONFIG.width - margin.left - margin.right;
  const innerH = DEFAULT_CONFIG.height - margin.top - margin.bottom;

  const [xMin, xMax] = extent(labData.map((d) => d.x)) as [number, number];
  const [yMin, yMax] = extent(labData.map((d) => d.y)) as [number, number];

  const xScale = scaleLinear()
    .domain([xMin, xMax])
    .range([margin.left, margin.left + innerW])
    .nice();
  const yScaleFn = scaleLinear()
    .domain([yMin, yMax])
    .range([margin.top + innerH, margin.top])
    .nice();

  // Median reference lines (dashed)
  const refLines =
    `<line x1="${margin.left}" y1="${yScaleFn(medianY).toFixed(2)}" x2="${margin.left + innerW}" y2="${yScaleFn(medianY).toFixed(2)}" stroke="${PALETTE.dataSecondary}" stroke-width="1" stroke-dasharray="6,4" />` +
    `<line x1="${xScale(medianX).toFixed(2)}" y1="${margin.top}" x2="${xScale(medianX).toFixed(2)}" y2="${margin.top + innerH}" stroke="${PALETTE.dataSecondary}" stroke-width="1" stroke-dasharray="6,4" />`;

  // 45-degree reference line clipped to plot area (NIST: departures indicate lab inconsistency)
  const domainMin = Math.max(xScale.domain()[0], yScaleFn.domain()[0]);
  const domainMax = Math.min(xScale.domain()[1], yScaleFn.domain()[1]);
  const diagonalLine =
    `<line x1="${xScale(domainMin).toFixed(2)}" y1="${yScaleFn(domainMin).toFixed(2)}" x2="${xScale(domainMax).toFixed(2)}" y2="${yScaleFn(domainMax).toFixed(2)}" stroke="${PALETTE.dataSecondary}" stroke-width="1" stroke-dasharray="3,3" opacity="0.5" />`;

  const labLabels = labData.map((d, i) =>
    `<text x="${xScale(d.x).toFixed(2)}" y="${yScaleFn(d.y).toFixed(2)}" text-anchor="middle" dominant-baseline="central" font-size="10" font-weight="bold" fill="${PALETTE.dataPrimary}" font-family="system-ui, sans-serif">${i + 1}</text>`
  ).join('\n');

  return svgNoCircles.replace('</svg>', labLabels + refLines + diagonalLine + '</svg>');
}

function composeLinearPlots(): string {
  const width = 800;
  const height = 600;
  const halfW = (width - 20) / 2;
  const halfH = (height - 20) / 2;
  const subConfig: Partial<PlotConfig> = {
    width: halfW,
    height: halfH,
    margin: { top: 30, right: 15, bottom: 35, left: 65 },
  };

  // Pre-computed per-batch statistics from NIST HSU12.DAT (15 batches, 50 obs each)
  // Source: handbook/datasets/HSU12.DAT — acoustic microscopy calibration data
  const corrData = [0.999993, 0.999990, 0.999994, 0.999995, 0.999996, 0.999994, 0.999992, 0.999995, 0.999990, 0.999985, 0.999982, 0.999989, 0.999986, 0.999986, 0.999987];
  const interceptData = [-0.015611, -0.015662, -0.016228, 0.011694, -0.002510, 0.026726, 0.018452, 0.030344, 0.029250, 0.036789, 0.014267, 0.004374, -0.004534, 0.012219, 0.014720];
  const slopeData = [0.173089, 0.175509, 0.174891, 0.175159, 0.173252, 0.172444, 0.175062, 0.173407, 0.172638, 0.172097, 0.172676, 0.175602, 0.173494, 0.174195, 0.172065];
  const residualData = [0.001890, 0.002397, 0.001863, 0.001594, 0.001449, 0.001859, 0.002118, 0.001718, 0.002338, 0.002878, 0.002937, 0.002299, 0.002602, 0.002584, 0.002459];
  // Overall statistics (all 750 observations combined) for reference lines
  const overallCorr = 0.999525;
  const overallIntercept = 0.009759;
  const overallSlope = 0.173687;
  const overallRessd = 0.015521;

  // Correlation plot: per-batch correlations vs batch ID
  const corrPlot = generateLinePlot({
    data: corrData,
    mode: 'run-sequence',
    config: subConfig,
    title: 'Linear Correlation Plot',
    xLabel: 'Batch',
    yLabel: 'Correlation(Y,X)',
    refValue: overallCorr,
  });

  // Intercept plot: per-batch intercepts vs batch ID
  const interceptPlot = generateLinePlot({
    data: interceptData,
    mode: 'run-sequence',
    config: subConfig,
    title: 'Linear Intercept Plot',
    xLabel: 'Batch',
    yLabel: 'Intercept(Y,X)',
    refValue: overallIntercept,
  });

  // Slope plot: per-batch slopes vs batch ID
  const slopePlot = generateLinePlot({
    data: slopeData,
    mode: 'run-sequence',
    config: subConfig,
    title: 'Linear Slope Plot',
    xLabel: 'Batch',
    yLabel: 'Slope(Y,X)',
    refValue: overallSlope,
  });

  // Residual SD plot: per-batch residual standard deviations vs batch ID
  const residualPlot = generateLinePlot({
    data: residualData,
    mode: 'run-sequence',
    config: subConfig,
    title: 'Linear RESSD Plot',
    xLabel: 'Batch',
    yLabel: 'Residual SD',
    refValue: overallRessd,
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
  // Compute per-factor statistics from BOXBIKE2.DAT (7 factors, 2 levels each)
  const { response, factors, factorNames } = boxbike2;
  const nFactors = 7;
  const grandMean = response.reduce((a, b) => a + b, 0) / response.length;

  // Build factor-level groupings
  type FactorGroup = { name: string; levels: { label: string; values: number[] }[] };
  type MeanLevel = { label: string; value: number };

  const scatterFactors: FactorGroup[] = [];
  const meanFactors: { name: string; levels: MeanLevel[] }[] = [];
  const sdFactors: { name: string; levels: MeanLevel[] }[] = [];

  for (let fi = 0; fi < nFactors; fi++) {
    const lo: number[] = [];
    const hi: number[] = [];
    for (let ri = 0; ri < response.length; ri++) {
      if (factors[ri][fi] === -1) lo.push(response[ri]);
      else hi.push(response[ri]);
    }
    const name = factorNames[fi];
    scatterFactors.push({ name, levels: [{ label: '\u22121', values: lo }, { label: '+1', values: hi }] });

    const loMean = lo.reduce((a, b) => a + b, 0) / lo.length;
    const hiMean = hi.reduce((a, b) => a + b, 0) / hi.length;
    meanFactors.push({ name, levels: [{ label: '\u22121', value: loMean }, { label: '+1', value: hiMean }] });

    const loSd = Math.sqrt(lo.reduce((s, v) => s + (v - loMean) ** 2, 0) / (lo.length - 1));
    const hiSd = Math.sqrt(hi.reduce((s, v) => s + (v - hiMean) ** 2, 0) / (hi.length - 1));
    sdFactors.push({ name, levels: [{ label: '\u22121', value: loSd }, { label: '+1', value: hiSd }] });
  }

  // Overall SD for reference line on SD plot
  const overallSd = Math.sqrt(response.reduce((s, v) => s + (v - grandMean) ** 2, 0) / (response.length - 1));

  const width = 900;
  const height = 440;
  const thirdW = (width - 30) / 3;
  const subConfig: Partial<PlotConfig> = {
    width: thirdW,
    height: height - 20,
    margin: { top: 30, right: 20, bottom: 50, left: 42 },
  };

  // Panel 1: DOE scatter plot — raw response values by factor level
  const doeScatter = generateDoeScatterPlot({
    factors: scatterFactors,
    grandMean,
    config: subConfig,
    title: 'DOE Scatter Plot',
    yLabel: 'Response',
  });

  // Panel 2: DOE mean plot — group means by factor level
  const doeMean = generateDoeMeanPlot({
    factors: meanFactors,
    grandMean,
    config: subConfig,
    title: 'DOE Mean Plot',
    yLabel: 'Mean',
  });

  // Panel 3: DOE SD plot — group standard deviations by factor level
  const doeSd = generateDoeMeanPlot({
    factors: sdFactors,
    grandMean: overallSd,
    config: subConfig,
    title: 'DOE SD Plot',
    yLabel: 'Std Dev',
    refLineLabel: 'Overall SD',
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
    yLabel: 'Response',
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
  '4-plot': () => generate4Plot(beamDeflections),
  '6-plot': () => generate6Plot(scatterData),
  'normal-probability-plot': () => generateProbabilityPlot({
    data: normalRandom,
    type: 'normal',
    title: 'Normal Probability Plot',
  }),
  'probability-plot': () => generateProbabilityPlot({
    data: normalRandom.map((v) => Math.exp(v)),
    type: 'weibull',
    title: 'Probability Plot (Weibull)',
  }),
  'qq-plot': () => generateProbabilityPlot({
    data: ceramicStrength.filter((d) => d.batch === 1).map((d) => d.strength),
    data2: ceramicStrength.filter((d) => d.batch === 2).map((d) => d.strength),
    type: 'qq',
    title: 'Q-Q Plot (Batch 1 vs Batch 2)',
    xLabel: 'Batch 1 Quantiles',
    yLabel: 'Batch 2 Quantiles',
  }),
  'spectral-plot': () => generateSpectralPlot({
    data: beamDeflections,
    title: 'Spectral Plot',
    forceLinear: true,
  }),
  'contour-plot': () => generateContourPlot({
    grid: responseSurface,
    title: 'Contour Plot',
    xLabel: 'Temperature',
    yLabel: 'Pressure',
  }),
  // AUTO79.DAT first 16 cars, 9 variables matching NIST Section 1.3.3.29 sample plot.
  // Variables: Price, MPG, 1978 Repair (1-5), 1977 Repair (1-5), Headroom (in),
  //   Rear Seat Room (in), Trunk Space (ft³), Weight (lbs), Length (in).
  // Values of -1 denote missing data (clamped to 0 by the renderer).
  'star-plot': () => generateStarGrid({
    variables: ['Price', 'MPG', 'Rep 78', 'Rep 77', 'Head', 'Rear', 'Trunk', 'Weight', 'Length'],
    observations: [
      { label: 'AMC Concord',    values: [4099, 22, 3, 2, 2.5, 27.5, 11, 2930, 186] },
      { label: 'AMC Pacer',      values: [4749, 17, 3, 1, 3.0, 25.5, 11, 3350, 173] },
      { label: 'AMC Spirit',     values: [3799, 22, -1, -1, 3.0, 18.5, 12, 2640, 168] },
      { label: 'Audi 5000',      values: [9690, 17, 5, 2, 3.0, 27.0, 15, 2830, 189] },
      { label: 'Audi Fox',       values: [6295, 23, 3, 3, 2.5, 28.0, 11, 2070, 174] },
      { label: 'BMW 320i',       values: [9735, 25, 4, 4, 2.5, 26.0, 12, 2650, 177] },
      { label: 'Buick Century',  values: [4816, 20, 3, 3, 4.5, 29.0, 16, 3250, 196] },
      { label: 'Buick Electra',  values: [7827, 15, 4, 4, 4.0, 31.5, 20, 4080, 222] },
      { label: 'Buick Le Sabre', values: [5788, 18, 3, 4, 4.0, 30.5, 21, 3670, 218] },
      { label: 'Buick Opel',     values: [4453, 26, -1, -1, 3.0, 24.0, 10, 2230, 170] },
      { label: 'Buick Regal',    values: [5189, 20, 3, 3, 2.0, 28.5, 16, 3280, 200] },
      { label: 'Buick Riviera',  values: [10372, 16, 3, 4, 3.5, 30.0, 17, 3880, 207] },
      { label: 'Buick Skylark',  values: [4082, 19, 3, 3, 3.5, 27.0, 13, 3400, 200] },
      { label: 'Cad. Deville',   values: [11385, 14, 3, 3, 4.0, 31.5, 20, 4330, 221] },
      { label: 'Cad. Eldorado',  values: [14500, 14, 2, 2, 3.5, 30.0, 16, 3900, 204] },
      { label: 'Cad. Seville',   values: [15906, 21, 3, 3, 3.0, 30.0, 13, 4290, 204] },
    ],
    columns: 4,
    title: 'Star Plot — 1979 Automobile Analysis',
  }),
  // FULLER2.DAT — airplane glass failure times (n=31, shape≈5.28, scale≈33.32)
  'weibull-plot': () => generateProbabilityPlot({
    data: airplaneGlassFailure,
    type: 'weibull',
    title: 'Weibull Plot',
  }),
  'ppcc-plot': () => generateProbabilityPlot({
    data: normalRandom,
    type: 'ppcc',
    title: 'PPCC Plot',
  }),
  'mean-plot': () => generateDoeMeanPlot({
    // NIST 1.3.3.20: monthly groups with location shift after month 6
    factors: [{
      name: 'Month',
      levels: [
        { label: 'Jan', value: 20.1 }, { label: 'Feb', value: 21.3 },
        { label: 'Mar', value: 19.4 }, { label: 'Apr', value: 20.8 },
        { label: 'May', value: 21.5 }, { label: 'Jun', value: 20.2 },
        { label: 'Jul', value: 25.3 }, { label: 'Aug', value: 26.1 },
        { label: 'Sep', value: 24.5 }, { label: 'Oct', value: 25.7 },
        { label: 'Nov', value: 26.4 }, { label: 'Dec', value: 25.0 },
      ],
    }],
    grandMean: (20.1 + 21.3 + 19.4 + 20.8 + 21.5 + 20.2 + 25.3 + 26.1 + 24.5 + 25.7 + 26.4 + 25.0) / 12,
    title: 'Mean Plot',
    yLabel: 'Group Mean',
  }),
  'std-deviation-plot': () => {
    // Real monthly SDs of water vapor from NIST PBF11.DAT (flag=0 rows, n=703)
    // Source: handbook/datasets/PBF11.DAT — Point Barrow Freon-11 weekly readings 1977–1986
    const monthSds = [0.000550, 0.000575, 0.000553, 0.000868, 0.001226, 0.001872, 0.002793, 0.002628, 0.002159, 0.001211, 0.000755, 0.000376];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const overallSd = 0.002619; // computed from all 703 valid observations
    return generateDoeMeanPlot({
      factors: [{
        name: 'Month',
        levels: months.map((m, i) => ({ label: m, value: monthSds[i] })),
      }],
      grandMean: overallSd,
      title: 'Standard Deviation Plot',
      yLabel: 'Std Dev',
      refLineLabel: 'Ovr',
    });
  },

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
    // 12 blocks (2 plants × 2 speeds × 3 shifts) with 2 weld methods
    // Mirrors NIST SHEESLE2.DAT: Method 2 lower in ~10 of 12 cases
    const rng = seededRandom(77);
    const baseA = 27; const baseB = 20;
    const plantEffect = [0, -4];       // Plant 2 lower
    const speedEffect = [0, 2];        // Slow speed slightly higher
    const shiftEffect = [0, -2, 3];    // Shift variation
    const plants = [1, 2];
    const speeds = ['F', 'S'];         // Fast, Slow
    const shifts = [1, 2, 3];
    const blocks: { label: string; points: { group: string; value: number }[] }[] = [];
    for (const p of plants) {
      for (const sp of speeds) {
        for (const sh of shifts) {
          const pi = p - 1;
          const spi = sp === 'F' ? 0 : 1;
          const shi = sh - 1;
          const noise = () => (rng() - 0.5) * 5;
          blocks.push({
            label: `P${p}/${sp}/Sh${sh}`,
            points: [
              { group: 'Method 1', value: baseA + plantEffect[pi] + speedEffect[spi] + shiftEffect[shi] + noise() },
              { group: 'Method 2', value: baseB + plantEffect[pi] + speedEffect[spi] + shiftEffect[shi] + noise() },
            ],
          });
        }
      }
    }
    return generateBlockPlot({
      blocks,
      config: { width: 720, height: 450, margin: { top: 35, right: 20, bottom: 45, left: 55 } },
      title: 'Block Plot',
      yLabel: 'Defects per Hour',
      xLabel: 'Plant / Speed / Shift',
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
  // Histogram: 8 variants (aligned to NIST 1.3.3.14.1–8)
  'histogram': [
    {
      label: 'Normal',
      render: () => generateHistogram({
        data: normalRandom,
        showKDE: true,
        title: 'Normal',
        xLabel: 'Value',
        yLabel: 'Frequency',
      }),
    },
    {
      label: 'Short-Tailed',
      render: () => generateHistogram({
        data: uniformRandom,
        showKDE: true,
        title: 'Short-Tailed (Uniform)',
        xLabel: 'Value',
        yLabel: 'Frequency',
      }),
    },
    {
      label: 'Long-Tailed',
      render: () => generateHistogram({
        data: normalRandom.map((v) => v * (1 + Math.abs(v))),
        showKDE: true,
        title: 'Long-Tailed',
        xLabel: 'Value',
        yLabel: 'Frequency',
      }),
    },
    {
      label: 'Bimodal Sinusoidal',
      render: () => {
        // Sinusoidal data produces bimodal histogram (values cluster near peaks/troughs)
        const sinData = normalRandom.map((_, i) => Math.sin(2 * Math.PI * i / 25) * 3 + normalRandom[i] * 0.3);
        return generateHistogram({
          data: sinData,
          showKDE: true,
          title: 'Bimodal (Sinusoidal)',
          xLabel: 'Value',
          yLabel: 'Frequency',
        });
      },
    },
    {
      label: 'Bimodal Mixture',
      render: () => generateHistogram({
        data: [
          ...normalRandom.slice(0, 50).map((v) => v - 2),
          ...normalRandom.slice(50).map((v) => v + 2),
        ],
        showKDE: true,
        title: 'Bimodal (Mixture of 2 Normals)',
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
      label: 'With Outlier',
      render: () => generateHistogram({
        data: [...normalRandom.slice(0, 96), 8.5, 8.5, 8.5, 8.5],
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
      label: 'Exact Linear',
      render: () => generateScatterPlot({
        data: scatterData.map((d) => ({ x: d.x, y: 0.25 * d.x + 1.0 })),
        showRegression: true,
        title: 'Exact Linear (R = 1)',
        xLabel: 'X',
        yLabel: 'Y',
      }),
    },
    {
      label: 'Sinusoidal (Damped)',
      render: () => {
        const rng = seededRandom(808);
        return generateScatterPlot({
          data: scatterData.map((d) => {
            const damping = Math.exp(-d.x * 0.04);
            return {
              x: d.x,
              y: 3 + 2 * damping * Math.sin(d.x * 0.5) + (rng() - 0.5) * 0.3,
            };
          }),
          title: 'Sinusoidal (Damped)',
          xLabel: 'X',
          yLabel: 'Y',
        });
      },
    },
    {
      label: 'Homoscedastic',
      render: () => {
        const rng = seededRandom(707);
        return generateScatterPlot({
          data: scatterData.map((d) => ({
            x: d.x,
            y: 0.2 * d.x + 2 + (rng() - 0.5) * 1.5,
          })),
          showRegression: true,
          title: 'Homoscedastic',
          xLabel: 'X',
          yLabel: 'Y',
        });
      },
    },
  ],

  // Normal probability plot: 4 variants matching NIST 1.3.3.21.1–4
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
      label: 'Short Tails',
      render: () => {
        // Short-tailed data: Tukey-Lambda with lambda=1.1 (NIST 1.3.3.21.2)
        const rng = seededRandom(555);
        const shortTail = Array.from({ length: 200 }, () => {
          // Approximate Tukey-Lambda via uniform -> quantile function
          // Q(p) = (p^lam - (1-p)^lam) / lam
          const p = rng();
          const lam = 1.1;
          return (Math.pow(p, lam) - Math.pow(1 - p, lam)) / lam;
        });
        return generateProbabilityPlot({
          data: shortTail,
          type: 'normal',
          title: 'Short-Tailed Data',
        });
      },
    },
    {
      label: 'Long Tails',
      render: () => {
        // Long-tailed data: double exponential (Laplace) distribution (NIST 1.3.3.21.3)
        const rng = seededRandom(666);
        const longTail = Array.from({ length: 200 }, () => {
          const u = rng() - 0.5;
          return -Math.sign(u) * Math.log(1 - 2 * Math.abs(u));
        });
        return generateProbabilityPlot({
          data: longTail,
          type: 'normal',
          title: 'Long-Tailed Data',
        });
      },
    },
    {
      label: 'Right Skewed',
      render: () => generateProbabilityPlot({
        data: normalRandom.map((v) => Math.exp(v * 0.5)),
        type: 'normal',
        title: 'Right Skewed Data',
      }),
    },
  ],

  // Probability plot: 3 variants (general — any distribution family)
  'probability-plot': [
    {
      label: 'Good Fit',
      render: () => generateProbabilityPlot({
        data: normalRandom.map((v) => Math.exp(v)),
        type: 'weibull',
        title: 'Good Fit (Weibull)',
      }),
    },
    {
      label: 'S-Shaped Departure',
      render: () => generateProbabilityPlot({
        data: normalRandom,
        type: 'weibull',
        title: 'S-Shaped Departure',
      }),
    },
    {
      label: 'Concave Departure',
      render: () => generateProbabilityPlot({
        data: normalRandom.map((v) => Math.exp(v * 0.5)),
        type: 'weibull',
        title: 'Concave Departure',
      }),
    },
  ],

  // Lag plot: 4 variants (matches NIST 1.3.3.15.1–4 examples)
  'lag-plot': [
    {
      label: 'Random',
      render: () => generateLagPlot({
        // 200 normal random numbers — NIST lagplot1 (Section 1.3.3.15.1)
        data: normalRandom.slice(0, 200),
        lag: 1,
        title: 'Random Data',
      }),
    },
    {
      label: 'Moderate Autocorrelation',
      render: () => {
        // FLICKER.DAT — the NIST dataset for lagplot2 (Section 1.3.3.15.2)
        // Moderate positive autocorrelation: points cluster noisily along the diagonal.
        return generateLagPlot({
          data: flickerNoise,
          lag: 1,
          title: 'Moderate Autocorrelation',
        });
      },
    },
    {
      label: 'Strong Autocorrelation',
      render: () => {
        // RANDWALK.DAT — the NIST dataset for lagplot3 (Section 1.3.3.15.3)
        // Strong positive autocorrelation: tight linear band along the diagonal.
        return generateLagPlot({
          data: randomWalk,
          lag: 1,
          title: 'Strong Autocorrelation',
        });
      },
    },
    {
      label: 'Sinusoidal',
      render: () => {
        // LEW.DAT (beam deflections) — the NIST dataset for lagplot4 (Section 1.3.3.15.4)
        // Produces a tight elliptical loop characteristic of a single-cycle sinusoidal model,
        // with 3 outlier points visible off the ellipse.
        return generateLagPlot({
          data: beamDeflections,
          lag: 1,
          title: 'Sinusoidal Model',
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
      label: 'Strong Autocorrelation',
      render: () => {
        // Near-random-walk (phi=0.99): smooth linear decline from ~1.0, crosses zero (NIST 1.3.3.1.3)
        const rng = seededRandom(1234);
        const arData: number[] = [0];
        for (let i = 1; i < 500; i++) {
          arData.push(0.99 * arData[i - 1] + (rng() - 0.5) * 2);
        }
        return generateLinePlot({
          data: arData,
          mode: 'autocorrelation',
          title: 'Strong Autocorrelation',
        });
      },
    },
    {
      label: 'Moderate Autocorrelation',
      render: () => {
        // Moderate AR process (phi=0.75): lag-1 ~0.75, noisier gradual decay (NIST 1.3.3.1.2)
        const rng = seededRandom(2345);
        const arData: number[] = [0];
        for (let i = 1; i < 500; i++) {
          arData.push(0.75 * arData[i - 1] + (rng() - 0.5) * 2);
        }
        return generateLinePlot({
          data: arData,
          mode: 'autocorrelation',
          title: 'Moderate Autocorrelation',
        });
      },
    },
    {
      label: 'Sinusoidal Model',
      render: () => {
        const rng = seededRandom(3456);
        const seasonal = Array.from({ length: 100 }, (_, i) =>
          Math.sin(i * 2 * Math.PI / 12) + (rng() - 0.5) * 0.3,
        );
        return generateLinePlot({
          data: seasonal,
          mode: 'autocorrelation',
          title: 'Sinusoidal Model',
        });
      },
    },
  ],

  // Spectral plot: 3 variants (aligned to NIST 1.3.3.27.1–3)
  'spectral-plot': [
    {
      // NIST Example 1: Random (White Noise) — no dominant peaks
      label: 'White Noise',
      render: () => generateSpectralPlot({
        data: normalRandom,
        title: 'White Noise',
      }),
    },
    {
      // NIST Example 2: Strong autocorrelation / autoregressive — FLICKER.DAT
      // Reference: Section 1.3.3.27.2, y-axis 0–0.006 (linear)
      label: 'Autoregressive',
      render: () => generateSpectralPlot({
        data: flickerNoise,
        title: 'Autoregressive',
        forceLinear: true,
      }),
    },
    {
      // NIST Example 3: Sinusoidal model — LEW.DAT (beam deflections)
      // Reference: Section 1.3.3.27.3, y-axis 0–3,000,000 (linear)
      label: 'Single Frequency',
      render: () => generateSpectralPlot({
        data: beamDeflections,
        title: 'Single Frequency',
        forceLinear: true,
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
