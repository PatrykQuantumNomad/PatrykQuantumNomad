import { describe, it, expect } from 'vitest';
import { POPULAR_COMPARISONS, comparisonSlug } from '../comparisons';
import { vsPageUrl, vsOgImageUrl } from '../routes';
import nodesData from '../../../data/ai-landscape/nodes.json';

// Build a Set of valid node slugs from the dataset
const nodes = nodesData as Array<Record<string, unknown>>;
const validSlugs = new Set(nodes.map((n) => n.slug as string));

describe('POPULAR_COMPARISONS array', () => {
  it('has at least 10 entries', () => {
    expect(POPULAR_COMPARISONS.length).toBeGreaterThanOrEqual(10);
  });

  it('all concept1 and concept2 slugs exist in the dataset', () => {
    POPULAR_COMPARISONS.forEach((pair) => {
      expect(
        validSlugs.has(pair.concept1),
        `Comparison "${pair.slug}" references unknown concept1 "${pair.concept1}"`,
      ).toBe(true);
      expect(
        validSlugs.has(pair.concept2),
        `Comparison "${pair.slug}" references unknown concept2 "${pair.concept2}"`,
      ).toBe(true);
    });
  });

  it('concept1 < concept2 alphabetically in every pair', () => {
    POPULAR_COMPARISONS.forEach((pair) => {
      expect(
        pair.concept1 < pair.concept2,
        `Pair "${pair.slug}" is not canonically ordered: "${pair.concept1}" should be < "${pair.concept2}"`,
      ).toBe(true);
    });
  });

  it('no duplicate comparison slugs', () => {
    const slugs = POPULAR_COMPARISONS.map((p) => p.slug);
    const uniqueSlugs = new Set(slugs);
    expect(uniqueSlugs.size).toBe(slugs.length);
  });

  it('each pair has non-empty question and summary', () => {
    POPULAR_COMPARISONS.forEach((pair) => {
      expect(
        pair.question.length,
        `Pair "${pair.slug}" has empty question`,
      ).toBeGreaterThan(0);
      expect(
        pair.summary.length,
        `Pair "${pair.slug}" has empty summary`,
      ).toBeGreaterThan(0);
    });
  });
});

describe('comparisonSlug', () => {
  it('produces alphabetical ordering', () => {
    expect(comparisonSlug('machine-learning', 'deep-learning')).toBe(
      'deep-learning-vs-machine-learning',
    );
  });

  it('returns same result regardless of input order', () => {
    const a = comparisonSlug('deep-learning', 'machine-learning');
    const b = comparisonSlug('machine-learning', 'deep-learning');
    expect(a).toBe(b);
  });

  it('keeps already-sorted inputs in order', () => {
    expect(comparisonSlug('agentic-ai', 'large-language-models')).toBe(
      'agentic-ai-vs-large-language-models',
    );
  });
});

describe('vsPageUrl', () => {
  it('returns /ai-landscape/vs/{slug}/', () => {
    expect(vsPageUrl('deep-learning-vs-machine-learning')).toBe(
      '/ai-landscape/vs/deep-learning-vs-machine-learning/',
    );
  });
});

describe('vsOgImageUrl', () => {
  it('returns /open-graph/ai-landscape/vs/{slug}.png', () => {
    expect(vsOgImageUrl('deep-learning-vs-machine-learning')).toBe(
      '/open-graph/ai-landscape/vs/deep-learning-vs-machine-learning.png',
    );
  });
});
