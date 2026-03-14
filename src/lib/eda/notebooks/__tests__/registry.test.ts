import { describe, it, expect } from 'vitest';
import { CASE_STUDY_REGISTRY, getCaseStudyConfig, ALL_CASE_STUDY_SLUGS } from '../registry/index';
import type { CaseStudyConfig } from '../registry/types';

const ALL_SLUGS = [
  'normal-random-numbers',
  'uniform-random-numbers',
  'heat-flow-meter',
  'filter-transmittance',
  'cryothermometry',
  'fatigue-life',
  'standard-resistor',
  'beam-deflections',
  'random-walk',
  'ceramic-strength',
] as const;

describe('CASE_STUDY_REGISTRY', () => {
  it('has exactly 10 entries', () => {
    expect(Object.keys(CASE_STUDY_REGISTRY)).toHaveLength(10);
  });

  it('contains all 10 expected slugs', () => {
    for (const slug of ALL_SLUGS) {
      expect(CASE_STUDY_REGISTRY).toHaveProperty(slug);
    }
  });

  it('ALL_CASE_STUDY_SLUGS contains all 10 slugs', () => {
    expect(ALL_CASE_STUDY_SLUGS).toHaveLength(10);
    for (const slug of ALL_SLUGS) {
      expect(ALL_CASE_STUDY_SLUGS).toContain(slug);
    }
  });
});

describe('getCaseStudyConfig', () => {
  it('returns a config for a valid slug', () => {
    const config = getCaseStudyConfig('normal-random-numbers');
    expect(config).toBeDefined();
    expect(config!.slug).toBe('normal-random-numbers');
  });

  it('returns undefined for a nonexistent slug', () => {
    const config = getCaseStudyConfig('nonexistent');
    expect(config).toBeUndefined();
  });
});

describe('every config has required fields', () => {
  for (const slug of ALL_SLUGS) {
    describe(slug, () => {
      it('has all required fields', () => {
        const config = CASE_STUDY_REGISTRY[slug];
        expect(config).toBeDefined();
        expect(config.slug).toBe(slug);
        expect(typeof config.title).toBe('string');
        expect(typeof config.nistSection).toBe('string');
        expect(typeof config.dataFile).toBe('string');
        expect(typeof config.skipRows).toBe('number');
        expect(typeof config.expectedRows).toBe('number');
        expect(Array.isArray(config.columns)).toBe(true);
        expect(config.columns.length).toBeGreaterThan(0);
        expect(typeof config.responseVariable).toBe('string');
        expect(config.expectedStats).toBeDefined();
        expect(typeof config.expectedStats.mean).toBe('number');
        expect(typeof config.expectedStats.stdDev).toBe('number');
        expect(typeof config.expectedStats.min).toBe('number');
        expect(typeof config.expectedStats.max).toBe('number');
        expect(typeof config.githubRawUrl).toBe('string');
        expect(config.plotTitles).toBeDefined();
        expect(typeof config.plotTitles.fourPlot).toBe('string');
        expect(typeof config.plotTitles.runSequence).toBe('string');
        expect(typeof config.plotTitles.lagPlot).toBe('string');
        expect(typeof config.plotTitles.histogram).toBe('string');
        expect(typeof config.plotTitles.probabilityPlot).toBe('string');
      });
    });
  }
});

describe('ceramic-strength config', () => {
  it('has skipRows === 50 (not 25)', () => {
    const config = CASE_STUDY_REGISTRY['ceramic-strength'];
    expect(config.skipRows).toBe(50);
  });

  it('has 15 columns', () => {
    const config = CASE_STUDY_REGISTRY['ceramic-strength'];
    expect(config.columns).toHaveLength(15);
  });

  it('has doeFactors defined', () => {
    const config = CASE_STUDY_REGISTRY['ceramic-strength'];
    expect(config.doeFactors).toBeDefined();
    expect(Array.isArray(config.doeFactors)).toBe(true);
    expect(config.doeFactors!.length).toBeGreaterThan(0);
  });
});

describe('standard-resistor config', () => {
  it('has 4 columns', () => {
    const config = CASE_STUDY_REGISTRY['standard-resistor'];
    expect(config.columns).toHaveLength(4);
  });
});

describe('skipRows values', () => {
  it('all configs except ceramic-strength have skipRows === 25', () => {
    for (const slug of ALL_SLUGS) {
      if (slug === 'ceramic-strength') continue;
      const config = CASE_STUDY_REGISTRY[slug];
      expect(config.skipRows, `${slug} should have skipRows === 25`).toBe(25);
    }
  });
});

describe('githubRawUrls', () => {
  it('all start with the correct GitHub raw prefix', () => {
    for (const slug of ALL_SLUGS) {
      const config = CASE_STUDY_REGISTRY[slug];
      expect(
        config.githubRawUrl,
        `${slug} githubRawUrl should start with correct prefix`
      ).toMatch(/^https:\/\/raw\.githubusercontent\.com\/PatrykQuantumNomad\//);
    }
  });
});

describe('slug consistency', () => {
  it('each config slug matches its key in the registry', () => {
    for (const [key, config] of Object.entries(CASE_STUDY_REGISTRY)) {
      expect(config.slug, `Registry key "${key}" should match config.slug`).toBe(key);
    }
  });
});

describe('modelParams', () => {
  it('beam-deflections has modelParams with type === sinusoidal', () => {
    const config = CASE_STUDY_REGISTRY['beam-deflections'];
    expect(config.modelParams).toBeDefined();
    expect(config.modelParams!.type).toBe('sinusoidal');
  });

  it('random-walk has modelParams with type === ar1', () => {
    const config = CASE_STUDY_REGISTRY['random-walk'];
    expect(config.modelParams).toBeDefined();
    expect(config.modelParams!.type).toBe('ar1');
  });
});
