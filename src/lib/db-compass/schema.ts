import { z } from 'astro/zod';

/** Score for a single dimension: integer 1-10 */
export const dimensionScoreSchema = z.number().int().min(1).max(10);

/** 8 dimension scores for a database model */
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

/** Required justification for each dimension score */
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

/** A representative database implementation */
export const topDatabaseSchema = z.object({
  name: z.string(),
  description: z.string(),
  license: z.string(),
  url: z.string().url(),
});

/** CAP theorem classification */
export const capTheoremSchema = z.object({
  classification: z.enum(['CP', 'AP', 'CA', 'Tunable']),
  notes: z.string(),
});

/** Zod schema for a single database model entry in the Database Compass */
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

/** TypeScript type inferred from the database model schema */
export type DbModel = z.infer<typeof dbModelSchema>;

/** TypeScript type for the 8 dimension scores */
export type Scores = z.infer<typeof scoresSchema>;

/** Returns the sum of all 8 dimension scores for a database model (max 80) */
export function totalScore(model: DbModel): number {
  const s = model.scores;
  return (
    s.scalability +
    s.performance +
    s.reliability +
    s.operationalSimplicity +
    s.queryFlexibility +
    s.schemaFlexibility +
    s.ecosystemMaturity +
    s.learningCurve
  );
}

/** Returns dimension scores as an array in canonical order (matching DIMENSIONS array in dimensions.ts) */
export function dimensionScores(model: DbModel): number[] {
  const s = model.scores;
  return [
    s.scalability,
    s.performance,
    s.reliability,
    s.operationalSimplicity,
    s.queryFlexibility,
    s.schemaFlexibility,
    s.ecosystemMaturity,
    s.learningCurve,
  ];
}
