import { z } from 'astro/zod';

/** Schema for a single node's pre-computed position in the force layout */
export const layoutPositionSchema = z.object({
  id: z.string(),
  x: z.number(),
  y: z.number(),
});

/** Schema for layout generation metadata */
export const layoutMetaSchema = z.object({
  width: z.number(),
  height: z.number(),
  ticks: z.number(),
  generated: z.string(),
});

/** Top-level schema for the pre-computed layout.json file */
export const layoutSchema = z.object({
  meta: layoutMetaSchema,
  positions: z.array(layoutPositionSchema).min(1),
});

/** TypeScript type for a single node position */
export type LayoutPosition = z.infer<typeof layoutPositionSchema>;

/** TypeScript type for layout metadata */
export type LayoutMeta = z.infer<typeof layoutMetaSchema>;

/** TypeScript type for the complete layout file */
export type Layout = z.infer<typeof layoutSchema>;
