import { describe, it, expect } from 'vitest';
import { generateAgenticLoop } from '../agentic-loop';

describe('generateAgenticLoop', () => {
  const svg = generateAgenticLoop();

  it('returns a valid SVG string', () => {
    expect(svg).toMatch(/^<svg\s/);
    expect(svg).toMatch(/<\/svg>$/);
  });

  it('includes accessibility attributes', () => {
    expect(svg).toContain('role="img"');
    expect(svg).toContain('aria-label');
  });

  it('contains all 3 phase labels', () => {
    expect(svg).toContain('Gather Context');
    expect(svg).toContain('Take Action');
    expect(svg).toContain('Verify Results');
  });

  it('contains arrow marker definition with agentic- prefix', () => {
    expect(svg).toMatch(/id="agentic-/);
  });

  it('uses CSS custom properties instead of hardcoded colors', () => {
    expect(svg).toContain('var(--color-');
    expect(svg).not.toMatch(/#[0-9a-fA-F]{6}/);
  });

  it('contains tool category labels', () => {
    expect(svg).toContain('File operations');
    expect(svg).toContain('Search');
    expect(svg).toContain('Execution');
  });
});
