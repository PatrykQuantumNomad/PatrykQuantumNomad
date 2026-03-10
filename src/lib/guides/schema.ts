import { z } from 'astro/zod';

/** Zod schema for a guide page's MDX frontmatter */
export const guidePageSchema = z.object({
  title: z.string(),
  description: z.string(),
  order: z.number().int().min(0),
  slug: z.string(),
});

/** Zod schema for guide-level metadata (guide.json) */
export const guideMetaSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  slug: z.string(),
  templateRepo: z.string().url(),
  versionTag: z.string(),
  publishedDate: z.coerce.date().optional(),
  requirements: z.record(z.string(), z.string()).optional(),
  chapters: z.array(
    z.object({
      slug: z.string(),
      title: z.string(),
    }),
  ),
});

/** TypeScript type inferred from the guide page schema */
export type GuidePage = z.infer<typeof guidePageSchema>;

/** TypeScript type inferred from the guide meta schema */
export type GuideMeta = z.infer<typeof guideMetaSchema>;
