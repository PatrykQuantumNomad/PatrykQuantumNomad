import type { Scores } from './schema';

/** Metadata for a single Database Compass dimension */
export interface Dimension {
  /** Machine key matching the scores schema field name */
  key: keyof Scores;
  /** Unicode symbol (BMP-safe, not emoji-range) */
  symbol: string;
  /** Full dimension name */
  name: string;
  /** Short display name for compact contexts */
  shortName: string;
  /** One-sentence description of what this dimension measures */
  description: string;
}

/**
 * The 8 Database Compass dimensions in canonical order.
 * This ordering is used everywhere: radar charts, score arrays, data files.
 */
export const DIMENSIONS: Dimension[] = [
  {
    key: 'scalability',
    symbol: '\u2191',
    name: 'Scalability',
    shortName: 'Scale',
    description:
      'Ability to handle growing data and traffic; 1 = single-node only, 10 = near-linear horizontal scale across clusters.',
  },
  {
    key: 'performance',
    symbol: '\u26A1',
    name: 'Performance',
    shortName: 'Perf',
    description:
      'Raw speed for typical operations; 1 = high-latency even for simple reads, 10 = sub-millisecond reads and writes at scale.',
  },
  {
    key: 'reliability',
    symbol: '\u2693',
    name: 'Reliability',
    shortName: 'Rely',
    description:
      'Data durability and consistency guarantees; 1 = risk of data loss or corruption, 10 = ACID-grade durability with proven replication.',
  },
  {
    key: 'operationalSimplicity',
    symbol: '\u2699',
    name: 'Operational Simplicity',
    shortName: 'Ops',
    description:
      'Ease of deployment, monitoring, and maintenance; 1 = requires dedicated DBA team, 10 = fully managed or trivial to self-host.',
  },
  {
    key: 'queryFlexibility',
    symbol: '\u2BD1',
    name: 'Query Flexibility',
    shortName: 'Query',
    description:
      'Expressiveness of query capabilities; 1 = key lookup only, 10 = full SQL with joins, aggregations, and window functions.',
  },
  {
    key: 'schemaFlexibility',
    symbol: '\u29C9',
    name: 'Schema Flexibility',
    shortName: 'Schema',
    description:
      'Ability to evolve data structures over time; 1 = rigid predefined schema, 10 = fully schemaless with dynamic fields.',
  },
  {
    key: 'ecosystemMaturity',
    symbol: '\u2605',
    name: 'Ecosystem Maturity',
    shortName: 'Eco',
    description:
      'Tooling, community, and production track record; 1 = niche or experimental, 10 = decades of battle-tested usage with rich tooling.',
  },
  {
    key: 'learningCurve',
    symbol: '\u2197',
    name: 'Learning Curve',
    shortName: 'Learn',
    description:
      'Ease of getting started and becoming productive; 1 = steep learning cliff, 10 = intuitive API with excellent documentation.',
  },
];
