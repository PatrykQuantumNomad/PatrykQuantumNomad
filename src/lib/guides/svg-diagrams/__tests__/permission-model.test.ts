import { describe, it, expect } from 'vitest';
import { generatePermissionModel } from '../permission-model';

describe('generatePermissionModel', () => {
  const svg = generatePermissionModel();

  it('returns a valid SVG string', () => {
    expect(svg).toMatch(/^<svg\s/);
    expect(svg).toMatch(/<\/svg>$/);
  });

  it('includes accessibility attributes', () => {
    expect(svg).toContain('role="img"');
    expect(svg).toContain('aria-label');
  });

  it('contains evaluation order labels: deny, ask, allow', () => {
    const lower = svg.toLowerCase();
    expect(lower).toContain('deny');
    expect(lower).toContain('ask');
    expect(lower).toContain('allow');
  });

  it('contains tool tier labels', () => {
    expect(svg).toContain('Read-only');
    expect(svg).toContain('Bash');
    expect(svg).toContain('File modification');
  });

  it('contains at least one permission mode label', () => {
    const hasMode =
      svg.includes('default') ||
      svg.includes('dontAsk') ||
      svg.includes('acceptEdits') ||
      svg.includes('plan') ||
      svg.includes('bypassPermissions');
    expect(hasMode).toBe(true);
  });

  it('contains arrow marker definition with perm- prefix', () => {
    expect(svg).toMatch(/id="perm-/);
  });

  it('uses CSS custom properties instead of hardcoded colors', () => {
    expect(svg).toContain('var(--color-');
    expect(svg).not.toMatch(/#[0-9a-fA-F]{6}/);
  });
});
