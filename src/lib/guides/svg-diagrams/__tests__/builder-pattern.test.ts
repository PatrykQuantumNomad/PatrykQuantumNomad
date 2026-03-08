import { describe, it, expect } from 'vitest';
import { generateBuilderPattern } from '../builder-pattern';

describe('generateBuilderPattern', () => {
  const svg = generateBuilderPattern();

  it('returns a valid SVG string', () => {
    expect(svg).toMatch(/^<svg\s/);
    expect(svg).toMatch(/<\/svg>$/);
  });

  it('includes accessibility attributes', () => {
    expect(svg).toContain('role="img"');
    expect(svg).toContain('aria-label');
  });

  it('contains all setup method names', () => {
    const methods = [
      'setup_logging',
      'setup_database',
      'setup_middleware',
      'setup_routes',
      'setup_error_handlers',
      'setup_auth',
    ];
    for (const method of methods) {
      expect(svg).toContain(method);
    }
  });

  it('contains create_app() factory function label', () => {
    expect(svg).toContain('create_app()');
  });

  it('contains FastAPIBuilder or Builder label', () => {
    const hasBuilder = svg.includes('FastAPIBuilder') || svg.includes('Builder');
    expect(hasBuilder).toBe(true);
  });

  it('contains arrow marker definition with builder- prefix', () => {
    expect(svg).toMatch(/id="builder-/);
  });

  it('uses CSS custom properties instead of hardcoded colors', () => {
    expect(svg).toContain('var(--color-');
    expect(svg).not.toMatch(/#[0-9a-fA-F]{6}/);
  });
});
