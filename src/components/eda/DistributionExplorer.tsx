import { useState, useEffect, useRef, useCallback } from 'react';
import { select } from 'd3-selection';
import { scaleLinear } from 'd3-scale';
import { line, area, curveBasis, curveStepAfter } from 'd3-shape';
import { axisBottom, axisLeft } from 'd3-axis';
import { evalDistribution, getXDomain, isDiscrete as isDiscreteCheck } from '../../lib/eda/math/distribution-math';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Parameter {
  name: string;
  symbol: string;
  min: number;
  max: number;
  default: number;
  step: number;
}

interface Props {
  distributionId: string;
  parameters: Parameter[];
  title: string;
  isDiscrete?: boolean;
}

// ---------------------------------------------------------------------------
// Chart rendering
// ---------------------------------------------------------------------------

const MARGIN = { top: 20, right: 20, bottom: 35, left: 45 };
const VB_WIDTH = 400;
const VB_HEIGHT = 250;

function renderChart(
  svgEl: SVGSVGElement,
  chartType: 'pdf' | 'cdf',
  distId: string,
  params: Record<string, number>,
  discrete: boolean,
): void {
  const svg = select(svgEl);
  svg.selectAll('*').remove();

  const innerWidth = VB_WIDTH - MARGIN.left - MARGIN.right;
  const innerHeight = VB_HEIGHT - MARGIN.top - MARGIN.bottom;

  const xDomain = getXDomain(distId, params);

  // Generate data points
  const points: { x: number; y: number }[] = [];
  if (discrete) {
    const kMin = Math.max(0, Math.floor(xDomain[0]));
    const kMax = Math.ceil(xDomain[1]);
    for (let k = kMin; k <= kMax; k++) {
      const y = evalDistribution(distId, chartType, k, params);
      points.push({ x: k, y: isFinite(y) ? y : 0 });
    }
  } else {
    const nPoints = 200;
    const step = (xDomain[1] - xDomain[0]) / (nPoints - 1);
    for (let i = 0; i < nPoints; i++) {
      const xVal = xDomain[0] + i * step;
      const yVal = evalDistribution(distId, chartType, xVal, params);
      points.push({ x: xVal, y: isFinite(yVal) ? yVal : 0 });
    }
  }

  // Y domain
  const yValues = points.map(p => p.y);
  const yMax = Math.max(...yValues) * 1.1;
  const yDomMax = chartType === 'cdf' ? 1.05 : (yMax > 0 ? yMax : 1);

  // Scales
  const xScale = scaleLinear()
    .domain(xDomain)
    .range([MARGIN.left, MARGIN.left + innerWidth]);
  const yScale = scaleLinear()
    .domain([0, yDomMax])
    .range([MARGIN.top + innerHeight, MARGIN.top]);

  // Axes
  svg.append('g')
    .attr('transform', `translate(0,${MARGIN.top + innerHeight})`)
    .call(axisBottom(xScale).ticks(7))
    .selectAll('text')
    .attr('fill', 'var(--color-text-secondary)')
    .style('font-size', '10px');

  svg.append('g')
    .attr('transform', `translate(${MARGIN.left},0)`)
    .call(axisLeft(yScale).ticks(5))
    .selectAll('text')
    .attr('fill', 'var(--color-text-secondary)')
    .style('font-size', '10px');

  // Style axis lines and ticks
  svg.selectAll('.domain, .tick line')
    .attr('stroke', 'var(--color-border)');

  // Grid lines
  svg.append('g')
    .selectAll('line')
    .data(yScale.ticks(5))
    .enter()
    .append('line')
    .attr('x1', MARGIN.left)
    .attr('x2', MARGIN.left + innerWidth)
    .attr('y1', d => yScale(d))
    .attr('y2', d => yScale(d))
    .attr('stroke', 'var(--color-border)')
    .attr('stroke-opacity', 0.3)
    .attr('stroke-dasharray', '3,3');

  // Data rendering
  if (discrete) {
    if (chartType === 'pdf') {
      // Lollipop (bar-stem) style for PMF
      const g = svg.append('g');
      points.forEach(p => {
        if (p.y <= 0) return;
        // Vertical stem
        g.append('line')
          .attr('x1', xScale(p.x))
          .attr('y1', yScale(0))
          .attr('x2', xScale(p.x))
          .attr('y2', yScale(p.y))
          .attr('stroke', 'var(--color-accent)')
          .attr('stroke-width', 2.5);
        // Circle at top
        g.append('circle')
          .attr('cx', xScale(p.x))
          .attr('cy', yScale(p.y))
          .attr('r', 3)
          .attr('fill', 'var(--color-accent)');
      });
    } else {
      // Step function CDF
      const cdfPoints: { x: number; y: number }[] = [];
      const kMin = Math.max(0, Math.floor(xDomain[0]));
      if (kMin > 0) {
        cdfPoints.push({ x: xDomain[0], y: 0 });
      }
      const kMax = Math.ceil(xDomain[1]);
      for (let k = kMin; k <= kMax; k++) {
        const cdf = evalDistribution(distId, 'cdf', k, params);
        cdfPoints.push({ x: k, y: isFinite(cdf) ? cdf : 0 });
      }
      cdfPoints.push({ x: xDomain[1], y: cdfPoints[cdfPoints.length - 1]?.y ?? 1 });

      const lineGen = line<{ x: number; y: number }>()
        .x(d => xScale(d.x))
        .y(d => yScale(d.y))
        .curve(curveStepAfter);

      svg.append('path')
        .datum(cdfPoints)
        .attr('d', lineGen)
        .attr('fill', 'none')
        .attr('stroke', 'var(--color-accent)')
        .attr('stroke-width', 2);
    }
  } else {
    // Continuous distribution
    const lineGen = line<{ x: number; y: number }>()
      .x(d => xScale(d.x))
      .y(d => yScale(d.y))
      .curve(curveBasis);

    // Area fill under PDF
    if (chartType === 'pdf') {
      const areaGen = area<{ x: number; y: number }>()
        .x(d => xScale(d.x))
        .y0(yScale(0))
        .y1(d => yScale(d.y))
        .curve(curveBasis);

      svg.append('path')
        .datum(points)
        .attr('d', areaGen)
        .attr('fill', 'var(--color-accent)')
        .attr('fill-opacity', 0.1)
        .attr('stroke', 'none');
    }

    // Curve line
    svg.append('path')
      .datum(points)
      .attr('d', lineGen)
      .attr('fill', 'none')
      .attr('stroke', 'var(--color-accent)')
      .attr('stroke-width', 2);
  }

  // Chart title text
  const titleLabel = chartType === 'pdf'
    ? (discrete ? 'PMF' : 'PDF')
    : 'CDF';
  svg.append('text')
    .attr('x', VB_WIDTH / 2)
    .attr('y', 14)
    .attr('text-anchor', 'middle')
    .attr('fill', 'var(--color-text-secondary)')
    .style('font-size', '12px')
    .style('font-weight', '600')
    .text(titleLabel);
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function DistributionExplorer({
  distributionId,
  parameters,
  title,
  isDiscrete: isDiscreteProp,
}: Props) {
  const [params, setParams] = useState<Record<string, number>>(
    () => Object.fromEntries(parameters.map(p => [p.name, p.default]))
  );

  const pdfRef = useRef<SVGSVGElement>(null);
  const cdfRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const discrete = isDiscreteProp ?? isDiscreteCheck(distributionId);

  const updateParam = useCallback((name: string, value: number) => {
    setParams(prev => ({ ...prev, [name]: value }));
  }, []);

  // Render charts when params change
  useEffect(() => {
    if (pdfRef.current) {
      renderChart(pdfRef.current, 'pdf', distributionId, params, discrete);
    }
    if (cdfRef.current) {
      renderChart(cdfRef.current, 'cdf', distributionId, params, discrete);
    }

    // Cleanup on unmount (view transition safety)
    return () => {
      if (pdfRef.current) {
        select(pdfRef.current).selectAll('*').remove();
      }
      if (cdfRef.current) {
        select(cdfRef.current).selectAll('*').remove();
      }
    };
  }, [params, distributionId, discrete]);

  // Mark explorer as active for fallback hiding
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.setAttribute('data-explorer-active', '');
    }
  }, []);

  const pdfLabel = discrete ? 'PMF' : 'PDF';

  return (
    <div ref={containerRef} className="distribution-explorer">
      {/* Parameter sliders */}
      <div className="flex flex-wrap gap-4 mb-6">
        {parameters.map(p => (
          <label
            key={p.name}
            className="min-w-[160px] flex flex-col gap-1"
          >
            <span className="text-sm text-[var(--color-text-secondary)]">
              {p.symbol}: <strong className="text-[var(--color-text-primary)]">{params[p.name]?.toFixed(p.step < 1 ? 2 : 0)}</strong>
            </span>
            <input
              type="range"
              min={p.min}
              max={p.max}
              step={p.step}
              value={params[p.name] ?? p.default}
              onChange={e => updateParam(p.name, parseFloat(e.target.value))}
              aria-label={`${p.name} parameter`}
              className="w-full min-h-[44px] accent-[var(--color-accent)] cursor-pointer"
            />
            <span className="flex justify-between text-xs text-[var(--color-text-secondary)]">
              <span>{p.min}</span>
              <span>{p.max}</span>
            </span>
          </label>
        ))}
      </div>

      {/* Dual charts grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h4 className="text-sm font-semibold text-[var(--color-text-secondary)] mb-2">{pdfLabel}</h4>
          <svg
            ref={pdfRef}
            viewBox={`0 0 ${VB_WIDTH} ${VB_HEIGHT}`}
            role="img"
            aria-label={`${title} ${pdfLabel} chart`}
            style={{ width: '100%' }}
          />
        </div>
        <div>
          <h4 className="text-sm font-semibold text-[var(--color-text-secondary)] mb-2">CDF</h4>
          <svg
            ref={cdfRef}
            viewBox={`0 0 ${VB_WIDTH} ${VB_HEIGHT}`}
            role="img"
            aria-label={`${title} CDF chart`}
            style={{ width: '100%' }}
          />
        </div>
      </div>
    </div>
  );
}
