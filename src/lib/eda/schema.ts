import { z } from 'astro/zod';

/** Interactivity tier for EDA pages: A=static SVG, B=SVG swap, C=D3 explorer */
export const tierSchema = z.enum(['A', 'B', 'C']);

/** Zod schema for an EDA technique entry */
export const edaTechniqueSchema = z.object({
  id: z.string(),
  title: z.string(),
  slug: z.string(),
  category: z.enum(['graphical', 'quantitative']),
  section: z.string(),
  nistSection: z.string(),
  description: z.string(),
  tier: tierSchema,
  variantCount: z.number().int().min(0).default(0),
  relatedTechniques: z.array(z.string()).default([]),
  tags: z.array(z.string()).default([]),
});

/** Zod schema for an EDA distribution entry */
export const edaDistributionSchema = z.object({
  id: z.string(),
  title: z.string(),
  slug: z.string(),
  parameters: z.array(
    z.object({
      name: z.string(),
      symbol: z.string(),
      min: z.number(),
      max: z.number(),
      default: z.number(),
      step: z.number(),
    }),
  ),
  pdfFormula: z.string(),
  cdfFormula: z.string(),
  mean: z.string(),
  variance: z.string(),
  relatedDistributions: z.array(z.string()).default([]),
  nistSection: z.string(),
  description: z.string(),
});

/** TypeScript type inferred from the technique schema */
export type EdaTechnique = z.infer<typeof edaTechniqueSchema>;

/** TypeScript type inferred from the distribution schema */
export type EdaDistribution = z.infer<typeof edaDistributionSchema>;
