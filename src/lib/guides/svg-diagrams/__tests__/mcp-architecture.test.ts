import { describe, it, expect } from 'vitest';
import { generateMcpArchitecture } from '../mcp-architecture';

describe('generateMcpArchitecture', () => {
  const svg = generateMcpArchitecture();

  it('returns a valid SVG string', () => {
    expect(svg).toMatch(/^<svg\s/);
    expect(svg).toMatch(/<\/svg>$/);
  });

  it('includes accessibility attributes', () => {
    expect(svg).toContain('role="img"');
    expect(svg).toContain('aria-label');
  });

  it('contains transport labels: stdio and HTTP', () => {
    expect(svg).toContain('stdio');
    const hasHttp = svg.includes('HTTP') || svg.includes('Streamable HTTP');
    expect(hasHttp).toBe(true);
  });

  it('contains SSE with deprecated indicator', () => {
    expect(svg).toContain('SSE');
    const lower = svg.toLowerCase();
    expect(lower).toContain('deprecated');
  });

  it('contains scope labels: Local, Project, User', () => {
    expect(svg).toContain('Local');
    expect(svg).toContain('Project');
    expect(svg).toContain('User');
  });

  it('contains server source labels', () => {
    expect(svg).toContain('user-configured');
    expect(svg).toContain('plugin-provided');
  });

  it('contains arrow marker definition with mcp- prefix', () => {
    expect(svg).toMatch(/id="mcp-/);
  });

  it('uses CSS custom properties instead of hardcoded colors', () => {
    expect(svg).toContain('var(--color-');
    expect(svg).not.toMatch(/#[0-9a-fA-F]{6}/);
  });
});
