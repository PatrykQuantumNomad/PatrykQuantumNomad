import { describe, it, expect } from 'vitest';
import { generateJwtAuthFlow } from '../jwt-auth-flow';

describe('generateJwtAuthFlow', () => {
  const svg = generateJwtAuthFlow();

  it('returns a valid SVG string', () => {
    expect(svg).toMatch(/^<svg\s/);
    expect(svg).toMatch(/<\/svg>$/);
  });

  it('includes accessibility attributes', () => {
    expect(svg).toContain('role="img"');
    expect(svg).toContain('aria-label');
  });

  it('contains all 3 validation mode labels', () => {
    expect(svg).toContain('Shared Secret');
    expect(svg).toContain('Static Key');
    expect(svg).toContain('JWKS');
  });

  it('contains JWT Token as entry point label', () => {
    expect(svg).toContain('JWT Token');
  });

  it('contains Validated or Claims as exit/result label', () => {
    const hasExit = svg.includes('Validated') || svg.includes('Claims');
    expect(hasExit).toBe(true);
  });

  it('contains arrow marker definition with jwt- prefix', () => {
    expect(svg).toMatch(/id="jwt-/);
  });

  it('uses CSS custom properties instead of hardcoded colors', () => {
    expect(svg).toContain('var(--color-');
    expect(svg).not.toMatch(/#[0-9a-fA-F]{6}/);
  });
});
