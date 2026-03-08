import { z } from 'astro/zod';

/** Zod schema for a guide page's MDX frontmatter */
export const guidePageSchema = z.object({
  title: z.string(),
});

/** Zod schema for guide-level metadata (guide.json) */
export const guideMetaSchema = z.object({
  id: z.string(),
});

/** TypeScript type inferred from the guide page schema */
export type GuidePage = z.infer<typeof guidePageSchema>;

/** TypeScript type inferred from the guide meta schema */
export type GuideMeta = z.infer<typeof guideMetaSchema>;
