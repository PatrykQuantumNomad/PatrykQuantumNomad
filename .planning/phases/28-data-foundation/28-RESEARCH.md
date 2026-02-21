# Phase 28: Data Foundation - Research

**Researched:** 2026-02-21
**Domain:** Astro content collections, Zod schema validation, JSON data modeling for database model categories
**Confidence:** HIGH

## Summary

Phase 28 establishes the complete data layer for the Database Compass feature: a Zod-validated JSON content collection containing 12 database model categories scored across 8 dimensions, plus a dedicated dimensions library file. This is a data-only phase -- no pages, no components, no visualization code. The deliverables are: a schema file, a dimensions definition file, a JSON data file with all 12 model entries, and a content collection registration in `content.config.ts`.

The project already has a battle-tested pattern for exactly this task. The Beauty Index (`src/data/beauty-index/languages.json` + `src/lib/beauty-index/schema.ts` + `src/lib/beauty-index/dimensions.ts` + `content.config.ts` registration) provides a direct, production-proven blueprint. The Database Compass data layer follows the same pattern with three key extensions: (1) a nested `scores` object instead of flat dimension fields (8 dimensions makes flat fields unwieldy), (2) a `crossCategory` field for multi-model databases, and (3) per-dimension `justification` strings explaining score rationale. The schema must also include CAP theorem profiling per requirement DATA-07.

The primary risk in this phase is not technical -- it is content quality. Database model scores without justification text look arbitrary to the database professional audience. Every score must be accompanied by a 1-2 sentence explanation. Multi-model databases (Redis, PostgreSQL, Cosmos DB, MongoDB, DynamoDB) must carry `crossCategory` metadata or face immediate credibility challenges. These requirements are schema-level decisions that must be designed in, not retrofitted.

**Primary recommendation:** Follow the Beauty Index data pattern exactly (`file()` loader, flat JSON array, Zod schema, dimensions library), extending it with nested scores, justifications, crossCategory, CAP theorem profiles, and topDatabases arrays. All 12 entries must be content-complete before the phase is considered done.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| DATA-01 | Database model categories defined in JSON with Zod schema validation for 12 models across 8 dimensions | Direct precedent: `languages.json` + `languageSchema` pattern. Schema uses nested `scores` object with 8 `dimensionScoreSchema` fields. Zod validates at build time via `file()` loader. |
| DATA-02 | Each model has crossCategory field linking to related model types for multi-model databases | Schema includes `crossCategory: z.array(z.string()).default([])`. Critical for Redis (KV + document + time-series + vector), PostgreSQL (relational + document), Cosmos DB (multi-model by design), etc. |
| DATA-03 | Each model has per-dimension justification text explaining why that score was assigned | Schema includes nested `justifications` object with 8 string fields matching dimension keys. Each justification is 1-2 sentences. Follows Beauty Index `JUSTIFICATIONS` pattern but embedded in JSON instead of separate TS file. |
| DATA-04 | Each model lists 3-6 top databases with name, description, license, and DB-Engines external link | Schema includes `topDatabases: z.array(topDatabaseSchema).min(3).max(6)` where each entry has `name`, `description`, `license`, and `url` fields. URLs point to DB-Engines pages. |
| DATA-05 | Content collection registered in content.config.ts with file() loader | Add `dbModels` collection to `content.config.ts` using `file('src/data/db-compass/models.json')` with `dbModelSchema`. Exact pattern of existing `languages` collection. |
| DATA-06 | Dimension definitions with key, symbol, name, and description in dedicated library file | Create `src/lib/db-compass/dimensions.ts` following `src/lib/beauty-index/dimensions.ts` pattern. Export `DIMENSIONS` array and `Dimension` interface with `key`, `symbol`, `name`, `shortName`, and `description` fields. |
| DATA-07 | CAP theorem profile (CP/AP/CA/Tunable) with notes per model | Schema includes `capTheorem: z.object({ classification: z.enum(['CP', 'AP', 'CA', 'Tunable']), notes: z.string() })`. Each model gets a classification and 1-2 sentence explanation. |
</phase_requirements>

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Astro | 5.17.1 (installed) | Content collections with `file()` loader, Zod integration | Already in use for `languages` collection; `file()` loader handles flat JSON arrays natively |
| TypeScript | ^5.9.3 (installed) | Schema definitions, type exports, dimension metadata | Already in use for all lib files |
| Zod | via `astro/zod` | Schema validation at build time | Already imported in `src/lib/beauty-index/schema.ts`; Astro bundles Zod |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| None | - | - | No supporting libraries needed for data-only phase |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Single JSON file with `file()` | Separate JSON per model with `glob()` | Loses at-a-glance score comparison; 12 tabs instead of 1 file; `file()` is the established pattern |
| Nested `scores` object | Flat dimension fields (like Beauty Index) | 8 flat fields clutters the top-level schema; nested object groups logically |
| Justifications in JSON | Separate `justifications.ts` file (like Beauty Index) | Beauty Index pattern works but separating data creates sync risk; embedding keeps each model self-contained |
| Embedded justifications | Separate TypeScript justifications file | Beauty Index uses a separate TS file (`src/data/beauty-index/justifications.ts`). For 12 models x 8 dimensions = 96 justifications, embedding in JSON keeps each model entry self-contained. However, the JSON file will be larger (~800-1000 lines). Either approach works; recommend embedding for authoring ergonomics. |

**Installation:**
```bash
# No installation needed. Zero new dependencies.
# All required capabilities exist in the current stack.
```

## Architecture Patterns

### Recommended Project Structure
```
src/
  data/
    db-compass/
      models.json              # 12 model entries (DATA-01 through DATA-04, DATA-07)
  lib/
    db-compass/
      schema.ts                # Zod schema + types + score helpers (DATA-01)
      dimensions.ts            # 8 dimension definitions (DATA-06)
```

### Modified Files
```
src/
  content.config.ts            # Add dbModels collection (DATA-05)
```

### Pattern 1: Content Collection with file() Loader
**What:** A single JSON file containing an array of objects, loaded by Astro's `file()` loader, validated by a Zod schema, and registered as a content collection.
**When to use:** Static data that changes at build time, not runtime. Fewer than ~100 entries. Each entry shares the same schema.
**Existing precedent:**

```typescript
// src/content.config.ts (existing)
import { languageSchema } from './lib/beauty-index/schema';

const languages = defineCollection({
  loader: file('src/data/beauty-index/languages.json'),
  schema: languageSchema,
});
```

**Database Compass equivalent:**

```typescript
// src/content.config.ts (addition)
import { dbModelSchema } from './lib/db-compass/schema';

const dbModels = defineCollection({
  loader: file('src/data/db-compass/models.json'),
  schema: dbModelSchema,
});

export const collections = { blog, languages, dbModels };
```

### Pattern 2: Zod Schema with Nested Score Objects
**What:** A Zod schema with a nested `scores` object grouping all dimension scores, plus parallel `justifications` object for score explanations.
**When to use:** When there are more than 6 scored dimensions, making flat top-level fields unwieldy.
**Why this differs from Beauty Index:** Beauty Index has 6 dimensions as flat fields (`phi`, `omega`, etc.). Database Compass has 8 dimensions -- nesting them in a `scores` object improves readability and schema organization.

```typescript
// src/lib/db-compass/schema.ts
import { z } from 'astro/zod';

const dimensionScoreSchema = z.number().int().min(1).max(10);

const scoresSchema = z.object({
  scalability: dimensionScoreSchema,
  performance: dimensionScoreSchema,
  reliability: dimensionScoreSchema,
  operationalSimplicity: dimensionScoreSchema,
  queryFlexibility: dimensionScoreSchema,
  schemaFlexibility: dimensionScoreSchema,
  ecosystemMaturity: dimensionScoreSchema,
  learningCurve: dimensionScoreSchema,
});

const justificationsSchema = z.object({
  scalability: z.string(),
  performance: z.string(),
  reliability: z.string(),
  operationalSimplicity: z.string(),
  queryFlexibility: z.string(),
  schemaFlexibility: z.string(),
  ecosystemMaturity: z.string(),
  learningCurve: z.string(),
});
```

### Pattern 3: Dimension Definitions Library
**What:** A dedicated TypeScript file exporting dimension metadata as a typed array, serving as the single source of truth for dimension names, symbols, descriptions, and colors.
**When to use:** Always. Hardcoding dimension names in components, schemas, or data files creates sync drift.
**Existing precedent:**

```typescript
// src/lib/beauty-index/dimensions.ts (existing pattern)
export interface Dimension {
  key: 'phi' | 'omega' | 'lambda' | 'psi' | 'gamma' | 'sigma';
  symbol: string;
  name: string;
  shortName: string;
  description: string;
}

export const DIMENSIONS: Dimension[] = [
  { key: 'phi', symbol: '\u03A6', name: 'Aesthetic Geometry', shortName: 'Geometry', description: '...' },
  // ...
];
```

### Anti-Patterns to Avoid

- **Hardcoding dimension names in the JSON data:** Dimension names belong in `dimensions.ts`, not in `models.json`. The JSON uses dimension keys (e.g., `scalability`). The human-readable name ("Scalability") comes from the dimensions library. This ensures renaming a dimension requires changing one file, not 12 entries.

- **Flat dimension fields at 8 dimensions:** At 6 dimensions (Beauty Index), flat fields work. At 8, the schema becomes hard to scan. Use a nested `scores` object to group them.

- **Separate JSON files per model:** With only 12 entries, a single file provides better authoring ergonomics (scroll to compare scores across models). Separate files force 12-tab editing and lose the ability to spot scoring inconsistencies at a glance.

- **Omitting justifications from the data layer:** If justifications are deferred to "later," they never get written. The schema must require them, and the data file must include them in this phase. Even 1-2 sentences per dimension per model prevents the "arbitrary scores" credibility attack.

- **Scoring "Operational Complexity" where high = worse:** The radar chart visual language means bigger polygon = better. If `operationalComplexity: 10` means "most complex to operate," the chart is visually misleading. Score it as "Operational Simplicity" where 10 = easiest to operate. This is documented in the architecture research.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Content collection loading | Custom JSON parser | Astro `file()` loader | Handles caching, validation integration, collection API |
| Schema validation | Manual type checks | Zod via `astro/zod` | Build-time validation with clear error messages; type inference |
| Dimension score constraints | Manual range checking | `z.number().int().min(1).max(10)` | Zod handles min/max/int validation declaratively |
| Array length constraints | Custom validators | `z.array().min(3).max(6)` | Zod handles array length constraints declaratively |
| Type exports | Manual interface definitions | `z.infer<typeof schema>` | Types always match the schema; single source of truth |

**Key insight:** Astro's content collection system with Zod validation is the complete solution for this phase. The `file()` loader + Zod schema pattern handles loading, parsing, validation, and type inference. No custom infrastructure is needed.

## Common Pitfalls

### Pitfall 1: Multi-Model Databases Without crossCategory Metadata
**What goes wrong:** Placing Redis under "Key-Value" without acknowledging it is also a document store, time-series database, pub/sub broker, and vector database. Database professionals will immediately challenge single-category placement for Redis, PostgreSQL, Cosmos DB, MongoDB, and DynamoDB.
**Why it happens:** A 12-category taxonomy implies mutual exclusivity, but the database industry has converged on multi-model architectures. Redis's own website calls it a "multi-model database."
**How to avoid:** Include `crossCategory: z.array(z.string()).default([])` in the schema. Populate it for every database that supports multiple models. Add methodology notes in the data explaining "primary data model" categorization.
**Warning signs:** JSON schema has no `crossCategory` field; detail page copy states "Redis is a key-value database" without qualification.

### Pitfall 2: Scores Without Justification Text
**What goes wrong:** An unexplained 4/10 on "Ecosystem Maturity" for a database model destroys tool credibility. Unlike the Beauty Index where aesthetic subjectivity is part of the concept, database scoring carries expectations of technical objectivity.
**Why it happens:** Justifications are tedious to write (12 models x 8 dimensions = 96 justification strings). The temptation is to defer them.
**How to avoid:** Make justifications required in the Zod schema (not optional). Write dimension rubrics (what does 1 mean? what does 10 mean?) before assigning any scores. Each justification is 1-2 sentences.
**Warning signs:** Scores assigned without justification text; two similar models differ by 1 point with no explanation.

### Pitfall 3: Inconsistent Score Calibration Across 12 Models
**What goes wrong:** Scoring the first model carefully, then progressively rushing through models 8-12, resulting in inconsistent calibration. A 7/10 for "Scalability" on Key-Value means something different than a 7/10 on Relational if they were scored days apart without cross-reference.
**Why it happens:** Content authoring fatigue. The single-file format helps (scroll to compare) but does not eliminate the problem.
**How to avoid:** Score all 12 models on one dimension at a time (all scalability scores first, then all performance scores), not one model at a time. This forces cross-model comparison within each dimension.
**Warning signs:** Model entries authored in temporal order (first entries have longer justifications than last entries); scores cluster around 5-7 with no entries using the full 1-10 range.

### Pitfall 4: Missing or Invalid DB-Engines URLs in topDatabases
**What goes wrong:** External links to DB-Engines pages break if the database name does not match DB-Engines' URL format. DB-Engines uses `system/Redis`, `system/PostgreSQL`, etc. Getting the URL slug wrong produces 404s.
**Why it happens:** DB-Engines URLs are not always intuitive (e.g., `system/Microsoft+SQL+Server`, not `system/sql-server`).
**How to avoid:** Use `z.string().url()` validation in the schema. Verify each URL manually during authoring. Consider linking to the database's official website instead of DB-Engines if URL stability is a concern.
**Warning signs:** URLs contain guessed slugs; `astro build` does not validate external URLs (only schema structure).

### Pitfall 5: Forgetting to Import Schema in content.config.ts
**What goes wrong:** The `dbModels` collection is defined in `content.config.ts` but the import path is wrong or the schema is not exported. The build either fails with a cryptic error or silently returns zero entries.
**Why it happens:** The import path `./lib/db-compass/schema` is relative to `src/content.config.ts`. A typo in the path or a missing `export` on the schema produces confusing build failures.
**How to avoid:** Verify the import path matches the actual file location. Run `astro build` immediately after adding the collection registration and confirm the entry count.
**Warning signs:** `getCollection('dbModels')` returns an empty array; build warnings about missing content.

### Pitfall 6: Dimension Key Mismatch Between Schema, Data, and Dimensions Library
**What goes wrong:** The schema defines `operationalSimplicity`, the JSON data uses `operationalComplexity`, and the dimensions library uses `opsComplexity`. Three files, three different key names for the same concept.
**Why it happens:** The project research documents used slightly different key names across STACK.md, FEATURES.md, and ARCHITECTURE.md. Without a single canonical source, each file author picks their own convention.
**How to avoid:** Define the canonical dimension keys in `dimensions.ts` FIRST. The schema's `scores` object keys MUST match the dimension `key` values exactly. The JSON data keys MUST match the schema. One source of truth: `dimensions.ts`.
**Warning signs:** TypeScript type errors when accessing `model.scores[dimension.key]`; Zod validation errors on build.

### Pitfall 7: CAP Theorem Oversimplification
**What goes wrong:** Assigning a single CAP classification (CP/AP/CA) to an entire model category ignores that different databases within the same model can have different CAP profiles. PostgreSQL is CA (single-node) but CockroachDB (also relational) is CP. Redis can be configured as CP or AP depending on cluster mode.
**Why it happens:** CAP theorem is applied to specific system configurations, not to abstract model categories.
**How to avoid:** Use `Tunable` as the classification when a model category spans multiple CAP positions. Use the `notes` field to explain the nuance: "Most relational databases default to CA in single-node deployments, but distributed SQL (NewSQL) systems like CockroachDB are CP."
**Warning signs:** Every model gets a clean CP or AP classification with no "Tunable" entries; notes field is empty or generic.

## Code Examples

Verified patterns from the existing codebase:

### Content Collection Registration (Existing Pattern)

```typescript
// Source: src/content.config.ts (lines 1-25)
import { defineCollection, z } from 'astro:content';
import { glob, file } from 'astro/loaders';
import { languageSchema } from './lib/beauty-index/schema';

const languages = defineCollection({
  loader: file('src/data/beauty-index/languages.json'),
  schema: languageSchema,
});

export const collections = { blog, languages };
```

### Zod Schema with Score Validation (Existing Pattern)

```typescript
// Source: src/lib/beauty-index/schema.ts (lines 1-23)
import { z } from 'astro/zod';

export const dimensionScoreSchema = z.number().int().min(1).max(10);

export const languageSchema = z.object({
  id: z.string(),
  name: z.string(),
  phi: dimensionScoreSchema,
  omega: dimensionScoreSchema,
  // ... 4 more dimensions
  tier: tierSchema,
  characterSketch: z.string(),
});

export type Language = z.infer<typeof languageSchema>;
```

### Dimension Definitions Library (Existing Pattern)

```typescript
// Source: src/lib/beauty-index/dimensions.ts (lines 1-68)
export interface Dimension {
  key: 'phi' | 'omega' | 'lambda' | 'psi' | 'gamma' | 'sigma';
  symbol: string;
  name: string;
  shortName: string;
  description: string;
}

export const DIMENSIONS: Dimension[] = [
  {
    key: 'phi',
    symbol: '\u03A6',
    name: 'Aesthetic Geometry',
    shortName: 'Geometry',
    description: 'Visual cleanliness, grid-based order, proportional structure.',
  },
  // ...
];
```

### JSON Data Entry (Existing Pattern)

```json
// Source: src/data/beauty-index/languages.json (first entry)
{
  "id": "python",
  "name": "Python",
  "phi": 9,
  "omega": 7,
  "lambda": 8,
  "psi": 10,
  "gamma": 9,
  "sigma": 9,
  "tier": "beautiful",
  "characterSketch": "Everyone's first love and nobody's last...",
  "year": 1991,
  "paradigm": "multi-paradigm, interpreted"
}
```

### Recommended Database Compass Schema (New)

```typescript
// src/lib/db-compass/schema.ts
import { z } from 'astro/zod';

export const dimensionScoreSchema = z.number().int().min(1).max(10);

export const topDatabaseSchema = z.object({
  name: z.string(),
  description: z.string(),
  license: z.string(),
  url: z.string().url(),
});

export const capTheoremSchema = z.object({
  classification: z.enum(['CP', 'AP', 'CA', 'Tunable']),
  notes: z.string(),
});

export const scoresSchema = z.object({
  scalability: dimensionScoreSchema,
  performance: dimensionScoreSchema,
  reliability: dimensionScoreSchema,
  operationalSimplicity: dimensionScoreSchema,
  queryFlexibility: dimensionScoreSchema,
  schemaFlexibility: dimensionScoreSchema,
  ecosystemMaturity: dimensionScoreSchema,
  learningCurve: dimensionScoreSchema,
});

export const justificationsSchema = z.object({
  scalability: z.string(),
  performance: z.string(),
  reliability: z.string(),
  operationalSimplicity: z.string(),
  queryFlexibility: z.string(),
  schemaFlexibility: z.string(),
  ecosystemMaturity: z.string(),
  learningCurve: z.string(),
});

export const dbModelSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  icon: z.string(),
  complexityPosition: z.number().min(0).max(1),
  summary: z.string(),
  characterSketch: z.string(),
  scores: scoresSchema,
  justifications: justificationsSchema,
  capTheorem: capTheoremSchema,
  crossCategory: z.array(z.string()).default([]),
  strengths: z.array(z.string()).min(2).max(5),
  weaknesses: z.array(z.string()).min(2).max(5),
  bestFor: z.array(z.string()).min(2).max(6),
  avoidWhen: z.array(z.string()).min(1).max(4),
  topDatabases: z.array(topDatabaseSchema).min(3).max(6),
  useCases: z.array(z.string()).min(2).max(6),
});

export type DbModel = z.infer<typeof dbModelSchema>;
export type Scores = z.infer<typeof scoresSchema>;

/** Returns the sum of all 8 dimension scores for a model (max 80) */
export function totalScore(model: DbModel): number {
  return Object.values(model.scores).reduce((sum, s) => sum + s, 0);
}

/** Returns dimension scores as an array in canonical order */
export function dimensionScores(model: DbModel): number[] {
  return [
    model.scores.scalability,
    model.scores.performance,
    model.scores.reliability,
    model.scores.operationalSimplicity,
    model.scores.queryFlexibility,
    model.scores.schemaFlexibility,
    model.scores.ecosystemMaturity,
    model.scores.learningCurve,
  ];
}
```

### Recommended Dimension Definitions (New)

```typescript
// src/lib/db-compass/dimensions.ts
export interface Dimension {
  key: keyof import('./schema').Scores;
  symbol: string;
  name: string;
  shortName: string;
  description: string;
}

export const DIMENSIONS: Dimension[] = [
  {
    key: 'scalability',
    symbol: '\u2191',  // upward arrow
    name: 'Scalability',
    shortName: 'Scale',
    description: 'Horizontal scaling ability, sharding support, and distributed architecture readiness.',
  },
  {
    key: 'performance',
    symbol: '\u26A1',  // lightning bolt
    name: 'Performance',
    shortName: 'Perf',
    description: 'Raw throughput, latency characteristics, and optimization ceiling.',
  },
  {
    key: 'reliability',
    symbol: '\u2693',  // anchor
    name: 'Reliability',
    shortName: 'Rely',
    description: 'ACID compliance, durability guarantees, fault tolerance, and replication quality.',
  },
  {
    key: 'operationalSimplicity',
    symbol: '\u2699',  // gear
    name: 'Operational Simplicity',
    shortName: 'Ops',
    description: 'Ease of deployment, backup/restore, monitoring, and managed service availability.',
  },
  {
    key: 'queryFlexibility',
    symbol: '\u2BD1',  // search/magnifying glass alternative
    name: 'Query Flexibility',
    shortName: 'Query',
    description: 'Power and expressiveness of the query language, join support, and aggregation capabilities.',
  },
  {
    key: 'schemaFlexibility',
    symbol: '\u29C9',  // joined squares
    name: 'Schema Flexibility',
    shortName: 'Schema',
    description: 'Schema-on-write vs schema-on-read, migration complexity, and evolution story.',
  },
  {
    key: 'ecosystemMaturity',
    symbol: '\u2605',  // star
    name: 'Ecosystem Maturity',
    shortName: 'Eco',
    description: 'Tooling, ORMs, drivers, community size, documentation quality, and hiring pool.',
  },
  {
    key: 'learningCurve',
    symbol: '\u2197',  // arrow up-right
    name: 'Learning Curve',
    shortName: 'Learn',
    description: 'Time to productivity, conceptual complexity, and paradigm familiarity. 10 = easiest to learn.',
  },
];
```

### Recommended JSON Data Entry (New)

```json
{
  "id": "key-value",
  "name": "Key-Value Store",
  "slug": "key-value",
  "icon": "key",
  "complexityPosition": 0.08,
  "summary": "The simplest database model: store and retrieve data by a unique key. Optimized for blazing-fast lookups at the cost of query flexibility.",
  "characterSketch": "The speed demon who memorized the phone book. Ask for a name, get a number -- instantly. Ask for everyone whose number starts with 555, and you get a blank stare.",
  "scores": {
    "scalability": 9,
    "performance": 10,
    "reliability": 7,
    "operationalSimplicity": 8,
    "queryFlexibility": 2,
    "schemaFlexibility": 3,
    "ecosystemMaturity": 8,
    "learningCurve": 9
  },
  "justifications": {
    "scalability": "Horizontal scaling is trivial -- consistent hashing distributes keys across nodes with near-linear throughput gains. No joins, no cross-partition queries, no coordination overhead.",
    "performance": "Sub-millisecond read/write latency by design. In-memory variants (Redis) achieve microsecond-level operations. The simplest access pattern produces the highest throughput.",
    "reliability": "Persistence varies widely: Redis offers RDB snapshots and AOF logs but can lose recent writes on crash. DynamoDB provides configurable strong consistency. The model itself does not mandate durability.",
    "operationalSimplicity": "Minimal moving parts. No query optimizer, no schema migrations, no index management. Managed options (DynamoDB, ElastiCache) reduce ops to near-zero.",
    "queryFlexibility": "Fundamental limitation: data is accessed only by key. No secondary indexes, no range queries, no aggregations in the base model. Some implementations (Redis) add data structure operations, but the core model is lookup-only.",
    "schemaFlexibility": "Values are opaque blobs -- you can store anything, but the database cannot inspect or query the contents. Schema flexibility for writes, zero flexibility for reads.",
    "ecosystemMaturity": "Redis alone has thousands of client libraries across every major language. DynamoDB, Memcached, and etcd are deeply integrated into cloud infrastructure. Mature, well-documented, widely adopted.",
    "learningCurve": "The conceptual model is trivially simple: SET key value, GET key. A developer can be productive in minutes. Advanced patterns (TTL, pub/sub, transactions) take longer but the foundation is immediate."
  },
  "capTheorem": {
    "classification": "Tunable",
    "notes": "Most key-value stores let you choose: Redis Cluster defaults to AP (allows stale reads during partition), DynamoDB offers both eventually consistent and strongly consistent reads. etcd is CP by design."
  },
  "crossCategory": [],
  "strengths": [
    "Sub-millisecond read/write latency",
    "Horizontal scaling is trivial",
    "Minimal operational overhead",
    "Conceptually simple -- minutes to learn"
  ],
  "weaknesses": [
    "No relationships between data",
    "Limited query patterns beyond key lookup",
    "No built-in aggregation or search",
    "Data modeling requires careful key design"
  ],
  "bestFor": [
    "Session storage",
    "Caching layers (CDN, application cache)",
    "Feature flags and configuration",
    "Rate limiting and counters",
    "Real-time leaderboards"
  ],
  "avoidWhen": [
    "Data has complex relationships",
    "Ad-hoc queries are a core requirement",
    "You need full-text search or aggregation"
  ],
  "useCases": [
    "Caching",
    "Session management",
    "Real-time counters",
    "Feature flags",
    "Distributed locks"
  ],
  "topDatabases": [
    {
      "name": "Redis",
      "description": "In-memory data structure store with optional persistence, pub/sub, and Lua scripting. The most popular key-value store and the Swiss Army knife of caching.",
      "license": "RSALv2 / SSPLv1 (source-available since 2024)",
      "url": "https://db-engines.com/en/system/Redis"
    },
    {
      "name": "Amazon DynamoDB",
      "description": "Fully managed NoSQL service with single-digit millisecond performance at any scale. Serverless pricing model eliminates capacity planning.",
      "license": "Proprietary (AWS)",
      "url": "https://db-engines.com/en/system/Amazon+DynamoDB"
    },
    {
      "name": "Memcached",
      "description": "High-performance, distributed memory object caching system. Simpler than Redis but purpose-built for caching with zero persistence overhead.",
      "license": "BSD-3-Clause",
      "url": "https://db-engines.com/en/system/Memcached"
    },
    {
      "name": "etcd",
      "description": "Distributed, reliable key-value store for the most critical data of a distributed system. The backbone of Kubernetes cluster state.",
      "license": "Apache-2.0",
      "url": "https://db-engines.com/en/system/etcd"
    }
  ]
}
```

## The 12 Database Model Categories

The following 12 categories are the canonical list for Database Compass. This is based on DB-Engines' 20 categories filtered to the 12 most relevant to modern developers. Inclusion/exclusion rationale is documented in the project research (`FEATURES.md`).

| # | ID | Name | Complexity Position | Primary Use Case | CAP Default |
|---|-----|------|---------------------|------------------|-------------|
| 1 | `key-value` | Key-Value Store | 0.08 | Caching, sessions, config | Tunable |
| 2 | `document` | Document Database | 0.22 | Content management, catalogs | AP/Tunable |
| 3 | `relational` | Relational (SQL) | 0.42 | OLTP, ERP, financial systems | CA (single-node) |
| 4 | `columnar` | Wide-Column Store | 0.58 | IoT telemetry, big data writes | AP |
| 5 | `time-series` | Time-Series Database | 0.35 | Metrics, monitoring, IoT | Tunable |
| 6 | `search` | Search Engine | 0.45 | Full-text search, log analytics | AP |
| 7 | `graph` | Graph Database | 0.78 | Social networks, knowledge graphs | CP/Tunable |
| 8 | `vector` | Vector Database | 0.65 | AI/ML embeddings, semantic search | AP |
| 9 | `in-memory` | In-Memory Database | 0.30 | Real-time analytics, caching | Tunable |
| 10 | `newsql` | NewSQL Database | 0.72 | Distributed OLTP with SQL | CP |
| 11 | `object` | Object-Oriented Database | 0.82 | Complex object persistence | CA |
| 12 | `multi-model` | Multi-Model Database | 0.88 | Polyglot persistence in one engine | Tunable |

**Categories excluded:** RDF Stores (semantic web niche), Spatial DBMS (PostGIS extension of relational), Native XML DBMS (legacy/declining), Multivalue DBMS (mainframe legacy), Navigational DBMS (historical), Event Stores (CQRS pattern, not distinct model), Content Stores (CMS-specific), Columnar/OLAP (overlaps with wide-column; analytics covered in scoring dimensions).

## The 8 Scoring Dimensions

Organized into 4 Operational + 4 Developer dimensions:

### Operational Dimensions (how it runs)
| Key | Name | 1/10 means | 10/10 means |
|-----|------|-----------|-------------|
| `scalability` | Scalability | Single-node only, vertical scaling | Elastic horizontal scaling with automatic sharding |
| `performance` | Performance | Seconds-level latency, low throughput | Sub-millisecond latency, millions of ops/sec |
| `reliability` | Reliability | Eventually consistent, may lose data | Full ACID, synchronous replication, zero data loss |
| `operationalSimplicity` | Operational Simplicity | Requires dedicated DBA team, complex tuning | Self-managing, one-click deploy, fully managed options |

### Developer Dimensions (how it feels)
| Key | Name | 1/10 means | 10/10 means |
|-----|------|-----------|-------------|
| `queryFlexibility` | Query Flexibility | Key lookup only, no filters | Full SQL with joins, subqueries, CTEs, window functions |
| `schemaFlexibility` | Schema Flexibility | Rigid schema, painful migrations | Schema-free, any structure, evolve at will |
| `ecosystemMaturity` | Ecosystem Maturity | Few drivers, sparse docs, small community | Rich tooling, ORMs, cloud integration, massive community |
| `learningCurve` | Learning Curve | Paradigm shift required, steep ramp | Intuitive model, productive in hours, familiar patterns |

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Astro Content Collections v1 (directory-based) | Astro Content Collections v2 with loaders (`file()`, `glob()`) | Astro 5.0 (Dec 2024) | `file()` loader replaces directory convention; explicit loader declaration |
| `z` from `zod` | `z` from `astro/zod` | Astro 5.0 | Use Astro's bundled Zod, not a separate install |
| `defineCollection` with `type: 'data'` | `defineCollection` with `loader: file()` | Astro 5.0 | Loader-based API replaces type-based API |

**Deprecated/outdated:**
- `type: 'data'` in `defineCollection` -- replaced by `loader: file()` in Astro 5
- Importing `z` from `zod` directly -- use `astro/zod` (or `astro:content` re-exports)

## Open Questions

1. **Dimension symbols -- Unicode characters or emoji-style icons?**
   - What we know: Beauty Index uses Greek letters (uppercase Unicode: phi, omega, etc.). Database Compass dimensions do not map naturally to Greek letters.
   - What's unclear: Whether to use Unicode symbols (arrows, gears, etc.) or a different icon approach (Lucide icons rendered in components, not in the data).
   - Recommendation: Use simple Unicode symbols in the dimensions library file. The symbols are used for compact display (table headers, chart labels). Lucide icons can be used in components separately -- the `symbol` field in dimensions.ts is for text contexts only.

2. **Exact DB-Engines URL format for all 36-72 databases**
   - What we know: DB-Engines URL format is `https://db-engines.com/en/system/{Name}` with spaces as `+`.
   - What's unclear: Whether all 36-72 databases have DB-Engines entries. Some newer databases (Chroma, QuestDB, SurrealDB) may not be listed.
   - Recommendation: Use DB-Engines URLs where they exist. Fall back to the database's official website URL. The schema uses `z.string().url()` which validates any valid URL, not specifically DB-Engines.

3. **Complexity position values -- how to calibrate?**
   - What we know: `complexityPosition` is a 0.0-1.0 float representing position on the simple-to-complex spectrum. Hand-authored, not computed.
   - What's unclear: Whether the positions should be evenly distributed or clustered by actual complexity groupings.
   - Recommendation: Use irregular spacing that reflects real complexity differences. Key-Value at 0.08 (very simple), Multi-Model at 0.88 (very complex). Allow clustering -- several moderate-complexity models can be close together (0.35-0.45 range). This produces a more honest visualization than forced equal spacing.

## Sources

### Primary (HIGH confidence)
- `src/content.config.ts` -- verified `file()` loader pattern with flat JSON arrays
- `src/lib/beauty-index/schema.ts` -- verified Zod schema pattern with `dimensionScoreSchema`, type inference, helper functions
- `src/lib/beauty-index/dimensions.ts` -- verified dimension metadata library pattern with interface and typed array export
- `src/data/beauty-index/languages.json` -- verified flat JSON array format for 25 entries (352 lines)
- `src/data/beauty-index/justifications.ts` -- verified per-dimension justification text pattern (HTML strings, ~2-3 sentences each)
- `.planning/research/ARCHITECTURE.md` -- verified recommended schema, data flow, and JSON structure
- `.planning/research/FEATURES.md` -- verified 12 category selection with inclusion/exclusion rationale
- `.planning/research/PITFALLS.md` -- verified multi-model categorization risk and score arbitrariness risk
- `.planning/research/STACK.md` -- verified zero new dependencies conclusion
- `.planning/REQUIREMENTS.md` -- verified DATA-01 through DATA-07 requirement definitions

### Secondary (MEDIUM confidence)
- [Astro Content Collections Guide](https://docs.astro.build/en/guides/content-collections/) -- `file()` loader API, verified against codebase usage
- [DB-Engines Ranking Categories](https://db-engines.com/en/ranking_categories) -- 20 database categories as reference taxonomy
- [Redis Multi-Model Documentation](https://redis.io/technology/multi-model/) -- multi-model classification confirmed

### Tertiary (LOW confidence)
- Specific DB-Engines URL format for all databases -- needs manual verification during authoring

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Direct codebase precedent in Beauty Index; zero new dependencies
- Architecture: HIGH - Single JSON file + Zod schema + `file()` loader is a proven, shipping pattern
- Pitfalls: HIGH - Multi-model and score justification risks documented in project research with citations
- Data content: MEDIUM - The 12 categories and 8 dimensions are well-researched but the actual scores and justifications require domain expertise during authoring

**Research date:** 2026-02-21
**Valid until:** 2026-03-21 (30 days - stable patterns, Astro 5 API unlikely to change)
