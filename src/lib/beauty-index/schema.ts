import { z } from 'astro/zod';

/** Score for a single dimension: integer 1-10 */
export const dimensionScoreSchema = z.number().int().min(1).max(10);

/** The four aesthetic tiers, ordered from lowest to highest */
export const tierSchema = z.enum(['workhorses', 'practical', 'handsome', 'beautiful']);

/** Zod schema for a single language entry in the Beauty Index */
export const languageSchema = z.object({
  id: z.string(),
  name: z.string(),
  phi: dimensionScoreSchema,
  omega: dimensionScoreSchema,
  lambda: dimensionScoreSchema,
  psi: dimensionScoreSchema,
  gamma: dimensionScoreSchema,
  sigma: dimensionScoreSchema,
  tier: tierSchema,
  characterSketch: z.string(),
  year: z.number().int().optional(),
  paradigm: z.string().optional(),
});

/** TypeScript type inferred from the language schema */
export type Language = z.infer<typeof languageSchema>;

/** Returns the sum of all 6 dimension scores for a language */
export function totalScore(lang: Language): number {
  return lang.phi + lang.omega + lang.lambda + lang.psi + lang.gamma + lang.sigma;
}

/** Returns dimension scores as an array in canonical order: [phi, omega, lambda, psi, gamma, sigma] */
export function dimensionScores(lang: Language): number[] {
  return [lang.phi, lang.omega, lang.lambda, lang.psi, lang.gamma, lang.sigma];
}
