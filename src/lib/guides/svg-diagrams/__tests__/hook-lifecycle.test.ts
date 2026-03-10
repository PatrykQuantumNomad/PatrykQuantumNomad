import { describe, it, expect } from 'vitest';
import { generateHookLifecycle } from '../hook-lifecycle';

describe('generateHookLifecycle', () => {
  const svg = generateHookLifecycle();

  it('returns a valid SVG string', () => {
    expect(svg).toMatch(/^<svg\s/);
    expect(svg).toMatch(/<\/svg>$/);
  });

  it('includes accessibility attributes', () => {
    expect(svg).toContain('role="img"');
    expect(svg).toContain('aria-label');
  });

  it('contains session events', () => {
    expect(svg).toContain('SessionStart');
    expect(svg).toContain('SessionEnd');
  });

  it('contains loop events', () => {
    expect(svg).toContain('UserPromptSubmit');
    expect(svg).toContain('PreToolUse');
    expect(svg).toContain('PostToolUse');
    expect(svg).toContain('Stop');
  });

  it('contains standalone async events', () => {
    expect(svg).toContain('InstructionsLoaded');
    expect(svg).toContain('ConfigChange');
  });

  it('contains arrow marker definition with hook- prefix', () => {
    expect(svg).toMatch(/id="hook-/);
  });

  it('uses CSS custom properties instead of hardcoded colors', () => {
    expect(svg).toContain('var(--color-');
    expect(svg).not.toMatch(/#[0-9a-fA-F]{6}/);
  });

  it('contains category group labels', () => {
    expect(svg).toContain('Session Events');
    expect(svg).toContain('Loop Events');
  });
});
