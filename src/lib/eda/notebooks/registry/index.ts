/**
 * Case study registry for EDA notebook generation.
 *
 * Maps all 10 case study slugs to their NIST .DAT file metadata
 * and analysis parameters for notebook generation.
 */

import type { CaseStudyConfig } from './types';
import { config as normalRandomNumbers } from './normal-random-numbers';
import { config as uniformRandomNumbers } from './uniform-random-numbers';
import { config as heatFlowMeter } from './heat-flow-meter';
import { config as filterTransmittance } from './filter-transmittance';
import { config as cryothermometry } from './cryothermometry';
import { config as fatigueLife } from './fatigue-life';
import { config as standardResistor } from './standard-resistor';
import { config as beamDeflections } from './beam-deflections';
import { config as randomWalk } from './random-walk';
import { config as ceramicStrength } from './ceramic-strength';

export type { CaseStudyConfig } from './types';

/**
 * Registry mapping case study slugs to their complete configuration.
 * Each config contains dataset metadata, expected statistics, and plot titles.
 */
export const CASE_STUDY_REGISTRY: Record<string, CaseStudyConfig> = {
  'normal-random-numbers': normalRandomNumbers,
  'uniform-random-numbers': uniformRandomNumbers,
  'heat-flow-meter': heatFlowMeter,
  'filter-transmittance': filterTransmittance,
  'cryothermometry': cryothermometry,
  'fatigue-life': fatigueLife,
  'standard-resistor': standardResistor,
  'beam-deflections': beamDeflections,
  'random-walk': randomWalk,
  'ceramic-strength': ceramicStrength,
};

/**
 * All case study slugs for iteration.
 */
export const ALL_CASE_STUDY_SLUGS: string[] = Object.keys(CASE_STUDY_REGISTRY);

/**
 * Lookup a case study config by slug.
 * Returns undefined if the slug is not in the registry.
 */
export function getCaseStudyConfig(slug: string): CaseStudyConfig | undefined {
  return CASE_STUDY_REGISTRY[slug];
}
