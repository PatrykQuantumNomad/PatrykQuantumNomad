import { describe, it, expect } from 'vitest';
import {
  getDownloadUrl,
  getColabUrl,
  hasNotebook,
  NOTEBOOK_SLUGS,
} from '../notebook-urls';
import { STANDARD_SLUGS } from '../templates/standard';
import { ALL_CASE_STUDY_SLUGS } from '../registry/index';

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

  it('returns true for an advanced slug (beam-deflections)', () => {
    expect(hasNotebook('beam-deflections')).toBe(true);
  });

  it('returns true for all 10 case study slugs', () => {
    for (const slug of ALL_CASE_STUDY_SLUGS) {
      expect(hasNotebook(slug)).toBe(true);
    }
  });

  it('returns false for a nonexistent slug', () => {
    expect(hasNotebook('nonexistent-slug')).toBe(false);
  });
});

describe('NOTEBOOK_SLUGS', () => {
  it('has exactly 10 entries matching ALL_CASE_STUDY_SLUGS', () => {
    expect(NOTEBOOK_SLUGS).toHaveLength(10);
    expect(NOTEBOOK_SLUGS).toEqual(ALL_CASE_STUDY_SLUGS);
  });

  it('includes all 7 standard slugs', () => {
    for (const slug of STANDARD_SLUGS) {
      expect(NOTEBOOK_SLUGS).toContain(slug);
    }
  });

  it('includes all 3 advanced slugs', () => {
    expect(NOTEBOOK_SLUGS).toContain('beam-deflections');
    expect(NOTEBOOK_SLUGS).toContain('random-walk');
    expect(NOTEBOOK_SLUGS).toContain('ceramic-strength');
  });
});
