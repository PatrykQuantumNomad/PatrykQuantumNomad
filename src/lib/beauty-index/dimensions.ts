/** Metadata for a single Beauty Index dimension */
export interface Dimension {
  /** Machine key matching the language schema field name */
  key: 'phi' | 'omega' | 'lambda' | 'psi' | 'gamma' | 'sigma';
  /** Greek letter symbol (Unicode) */
  symbol: string;
  /** Full dimension name */
  name: string;
  /** Short display name for compact contexts */
  shortName: string;
  /** One-sentence description of what this dimension measures */
  description: string;
}

/**
 * The 6 Beauty Index dimensions in canonical order.
 * This ordering is used everywhere: radar charts, score arrays, data files.
 */
export const DIMENSIONS: Dimension[] = [
  {
    key: 'phi',
    symbol: '\u03A6',
    name: 'Aesthetic Geometry',
    shortName: 'Geometry',
    description:
      'Visual cleanliness, grid-based order, proportional structure. How code looks on a screen.',
  },
  {
    key: 'omega',
    symbol: '\u03A9',
    name: 'Mathematical Elegance',
    shortName: 'Elegance',
    description:
      'Inevitability, unexpectedness, economy. Algorithms that feel straight from The Book.',
  },
  {
    key: 'lambda',
    symbol: '\u039B',
    name: 'Linguistic Clarity',
    shortName: 'Clarity',
    description:
      'Code that reads like well-written prose. Signal-to-noise ratio at the level of meaning.',
  },
  {
    key: 'psi',
    symbol: '\u03A8',
    name: 'Practitioner Happiness',
    shortName: 'Happiness',
    description:
      'The felt experience of writing and reading code. Flow states, community love, tooling pleasure.',
  },
  {
    key: 'gamma',
    symbol: '\u0393',
    name: 'Organic Habitability',
    shortName: 'Habitability',
    description:
      'Code as a place where programmers can live. Growth points, graceful aging, extensibility.',
  },
  {
    key: 'sigma',
    symbol: '\u03A3',
    name: 'Conceptual Integrity',
    shortName: 'Integrity',
    description:
      'Coherent design philosophy where features feel like natural consequences of a single idea.',
  },
];
