import { describe, it, expect } from 'vitest';
import { generateAgentTeams } from '../agent-teams';

describe('generateAgentTeams', () => {
  const svg = generateAgentTeams();

  it('returns a valid SVG string', () => {
    expect(svg).toMatch(/^<svg\s/);
    expect(svg).toMatch(/<\/svg>$/);
  });

  it('includes accessibility attributes', () => {
    expect(svg).toContain('role="img"');
    expect(svg).toContain('aria-label');
  });

  it('contains Team Lead label', () => {
    expect(svg).toContain('Team Lead');
  });

  it('contains Teammate labels', () => {
    expect(svg).toContain('Teammate 1');
    expect(svg).toContain('Teammate 2');
    expect(svg).toContain('Teammate 3');
  });

  it('contains Shared Task List or Task List label', () => {
    const hasTaskList = svg.includes('Shared Task List') || svg.includes('Task List');
    expect(hasTaskList).toBe(true);
  });

  it('contains Mailbox label', () => {
    expect(svg).toContain('Mailbox');
  });

  it('contains task state labels', () => {
    const hasPending = svg.includes('pending') || svg.includes('Pending');
    const hasInProgress = svg.includes('in progress') || svg.includes('In Progress');
    const hasCompleted = svg.includes('completed') || svg.includes('Completed');
    expect(hasPending).toBe(true);
    expect(hasInProgress).toBe(true);
    expect(hasCompleted).toBe(true);
  });

  it('contains Research Preview or Experimental text', () => {
    const hasExperimental = svg.includes('Research Preview') || svg.includes('Experimental');
    expect(hasExperimental).toBe(true);
  });

  it('contains arrow marker definition with team- prefix', () => {
    expect(svg).toMatch(/id="team-/);
  });

  it('uses CSS custom properties instead of hardcoded colors', () => {
    expect(svg).toContain('var(--color-');
    expect(svg).not.toMatch(/#[0-9a-fA-F]{6}/);
  });
});
