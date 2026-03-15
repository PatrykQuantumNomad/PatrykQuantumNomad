import { describe, it, expect } from 'vitest';
import {
  getDownloadUrl,
  getColabUrl,
  hasNotebook,
  NOTEBOOK_SLUGS,
} from '../notebook-urls';
import { STANDARD_SLUGS } from '../templates/standard';

describe('getDownloadUrl', () => {
  it('returns correct download path for a standard slug', () => {
    expect(getDownloadUrl('normal-random-numbers')).toBe(
      '/downloads/notebooks/normal-random-numbers.zip'
    );
  });

  it('returns correct download path for all 7 standard slugs', () => {
    for (const slug of STANDARD_SLUGS) {
      const url = getDownloadUrl(slug);
      expect(url).toBe(`/downloads/notebooks/${slug}.zip`);
    }
  });
});

describe('getColabUrl', () => {
  it('returns correct Colab URL for heat-flow-meter', () => {
    expect(getColabUrl('heat-flow-meter')).toBe(
      'https://colab.research.google.com/github/PatrykQuantumNomad/PatrykQuantumNomad/blob/main/notebooks/eda/heat-flow-meter.ipynb'
    );
  });

  it('returns correct Colab URL for all 7 standard slugs', () => {
    for (const slug of STANDARD_SLUGS) {
      const url = getColabUrl(slug);
      expect(url).toBe(
        `https://colab.research.google.com/github/PatrykQuantumNomad/PatrykQuantumNomad/blob/main/notebooks/eda/${slug}.ipynb`
      );
    }
  });
});

describe('hasNotebook', () => {
  it('returns true for a standard slug', () => {
    expect(hasNotebook('normal-random-numbers')).toBe(true);
  });

  it('returns false for an advanced slug (beam-deflections)', () => {
    expect(hasNotebook('beam-deflections')).toBe(false);
  });

  it('returns false for a nonexistent slug', () => {
    expect(hasNotebook('nonexistent-slug')).toBe(false);
  });
});

describe('NOTEBOOK_SLUGS', () => {
  it('has exactly 7 entries matching STANDARD_SLUGS', () => {
    expect(NOTEBOOK_SLUGS).toHaveLength(7);
    expect(NOTEBOOK_SLUGS).toEqual(STANDARD_SLUGS);
  });
});
