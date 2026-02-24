import { useEffect, useRef } from 'react';
import { select } from 'd3-selection';
import { scaleLinear } from 'd3-scale';
import { line } from 'd3-shape';
import { axisBottom, axisLeft } from 'd3-axis';

export default function DistributionExplorerStub() {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current) return;
    const svg = select(svgRef.current);
    svg.selectAll('*').remove(); // Clear on re-mount (view transition safety)

    const width = 400, height = 200;
    const x = scaleLinear().domain([-3, 3]).range([40, width - 20]);
    const y = scaleLinear().domain([0, 0.5]).range([height - 30, 10]);

    // Draw simple normal curve
    const data = Array.from({ length: 61 }, (_, i) => {
      const xVal = -3 + i * 0.1;
      return { x: xVal, y: Math.exp(-0.5 * xVal * xVal) / Math.sqrt(2 * Math.PI) };
    });

    const pathGen = line<{ x: number; y: number }>()
      .x(d => x(d.x))
      .y(d => y(d.y));

    svg.append('path')
      .datum(data)
      .attr('d', pathGen)
      .attr('fill', 'none')
      .attr('stroke', 'var(--color-accent)')
      .attr('stroke-width', 2);

    svg.append('g')
      .attr('transform', `translate(0,${height - 30})`)
      .call(axisBottom(x).ticks(7));

    svg.append('g')
      .attr('transform', 'translate(40,0)')
      .call(axisLeft(y).ticks(5));

    // Cleanup on unmount
    return () => { svg.selectAll('*').remove(); };
  }, []);

  return (
    <div>
      <p style={{ marginBottom: '1rem', color: 'var(--color-text-secondary)' }}>
        D3 Distribution Explorer Stub (verifying bundle isolation)
      </p>
      <svg ref={svgRef} viewBox="0 0 400 200" width="100%" style={{ maxWidth: 600 }} />
    </div>
  );
}
