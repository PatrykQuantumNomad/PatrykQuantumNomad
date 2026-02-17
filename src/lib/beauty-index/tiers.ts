/** Configuration for a single Beauty Index tier */
export interface TierConfig {
  /** Machine name (matches tier enum values) */
  name: string;
  /** Human-readable display label */
  label: string;
  /** Minimum total score (inclusive) */
  minScore: number;
  /** Maximum total score (inclusive) */
  maxScore: number;
  /** Brand color as hex string (for decorative/graphical elements) */
  color: string;
  /** WCAG AA compliant text color (4.5:1 contrast against #fffaf7 background) */
  textColor: string;
}

/**
 * The 4 Beauty Index tiers, ordered from lowest to highest.
 * Score boundaries span 6-60 (6 dimensions x 1-10 each).
 */
export const TIERS: TierConfig[] = [
  { name: 'workhorses', label: 'Workhorses', minScore: 6, maxScore: 19, color: '#8B8FA3', textColor: '#686b7a' },
  { name: 'practical', label: 'Practical', minScore: 20, maxScore: 33, color: '#5B8A72', textColor: '#4a7360' },
  { name: 'handsome', label: 'Handsome', minScore: 34, maxScore: 46, color: '#C47F17', textColor: '#8a5a10' },
  { name: 'beautiful', label: 'Beautiful', minScore: 47, maxScore: 60, color: '#B84A1C', textColor: '#af461b' },
];

/** Color palette for each dimension, keyed by dimension key */
export const DIMENSION_COLORS: Record<string, string> = {
  phi: '#4A90D9',
  omega: '#7B68EE',
  lambda: '#2AAA8A',
  psi: '#E8734A',
  gamma: '#8FBC5A',
  sigma: '#D4A843',
};

/**
 * Finds the tier configuration for a given total score.
 * @throws {Error} If score is outside valid range (6-60)
 */
export function getTierByScore(totalScore: number): TierConfig {
  const tier = TIERS.find((t) => totalScore >= t.minScore && totalScore <= t.maxScore);
  if (!tier) {
    throw new Error(
      `Invalid total score: ${totalScore}. Must be between 6 and 60.`
    );
  }
  return tier;
}

/**
 * Looks up a tier's brand color by tier name.
 * @throws {Error} If tier name is not recognized
 */
export function getTierColor(tierName: string): string {
  const tier = TIERS.find((t) => t.name === tierName);
  if (!tier) {
    throw new Error(
      `Unknown tier: "${tierName}". Valid tiers: ${TIERS.map((t) => t.name).join(', ')}`
    );
  }
  return tier.color;
}
