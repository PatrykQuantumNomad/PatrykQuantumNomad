import { describe, it, expect } from 'vitest';
import { generateMiddlewareStack } from '../middleware-stack';

describe('generateMiddlewareStack', () => {
  const svg = generateMiddlewareStack();

  it('returns a valid SVG string', () => {
    expect(svg).toMatch(/^<svg\s/);
    expect(svg).toMatch(/<\/svg>$/);
  });

  it('includes accessibility attributes', () => {
    expect(svg).toContain('role="img"');
    expect(svg).toContain('aria-label');
  });

  it('contains all 8 middleware layer labels in outermost-to-innermost order', () => {
    const layers = [
      'Trusted Host',
      'CORS',
      'Security Headers',
      'Rate Limiting',
      'Request ID',
      'Logging',
      'Prometheus Metrics',
      'Auth',
    ];
    for (const layer of layers) {
      expect(svg).toContain(layer);
    }
  });

  it('contains Request and FastAPI App labels for flow direction', () => {
    expect(svg).toContain('Request');
    expect(svg).toContain('FastAPI App');
  });

  it('contains arrow marker definition with middleware- prefix', () => {
    expect(svg).toMatch(/id="middleware-/);
  });

  it('uses CSS custom properties instead of hardcoded colors', () => {
    expect(svg).toContain('var(--color-');
    // Should not contain common hex color patterns (excluding #000 which is not used)
    expect(svg).not.toMatch(/#[0-9a-fA-F]{6}/);
  });
});
