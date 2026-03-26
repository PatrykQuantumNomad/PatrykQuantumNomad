import { describe, it, expect } from 'vitest';
import { conceptUrl, ogImageUrl, AI_LANDSCAPE_BASE } from '../routes';

describe('AI_LANDSCAPE_BASE', () => {
  it('is /ai-landscape/ with trailing slash', () => {
    expect(AI_LANDSCAPE_BASE).toBe('/ai-landscape/');
  });
});

describe('conceptUrl', () => {
  it('returns correct URL for machine-learning', () => {
    expect(conceptUrl('machine-learning')).toBe(
      '/ai-landscape/machine-learning/',
    );
  });

  it('returns correct URL for artificial-intelligence', () => {
    expect(conceptUrl('artificial-intelligence')).toBe(
      '/ai-landscape/artificial-intelligence/',
    );
  });

  it('always produces trailing-slash URLs matching Astro config', () => {
    const url = conceptUrl('deep-learning');
    expect(url.endsWith('/')).toBe(true);
  });

  it('does not double-slash when slug has no special characters', () => {
    const url = conceptUrl('transformers');
    expect(url).toBe('/ai-landscape/transformers/');
    expect(url).not.toContain('//');
  });
});

describe('ogImageUrl', () => {
  it('returns correct OG image path for machine-learning', () => {
    expect(ogImageUrl('machine-learning')).toBe(
      '/open-graph/ai-landscape/machine-learning.png',
    );
  });

  it('returns .png extension, not trailing slash', () => {
    const url = ogImageUrl('transformers');
    expect(url.endsWith('.png')).toBe(true);
    expect(url).not.toMatch(/\/$/);
  });
});
