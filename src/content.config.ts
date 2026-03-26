import { defineCollection, z } from 'astro:content';
import { glob, file } from 'astro/loaders';
import { languageSchema } from './lib/beauty-index/schema';
import { dbModelSchema } from './lib/db-compass/schema';
import { edaTechniqueSchema, edaDistributionSchema } from './lib/eda/schema';
import { guidePageSchema, guideMetaSchema } from './lib/guides/schema';
import { aiNodeSchema } from './lib/ai-landscape/schema';

const blog = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/data/blog' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    publishedDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
    coverImage: z.string().optional(),
    externalUrl: z.string().url().optional(),
    source: z.enum(['Kubert AI', 'Translucent Computing']).optional(),
  }),
});

const languages = defineCollection({
  loader: file('src/data/beauty-index/languages.json'),
  schema: languageSchema,
});

const dbModels = defineCollection({
  loader: file('src/data/db-compass/models.json'),
  schema: dbModelSchema,
});

const edaTechniques = defineCollection({
  loader: file('src/data/eda/techniques.json'),
  schema: edaTechniqueSchema,
});

const edaDistributions = defineCollection({
  loader: file('src/data/eda/distributions.json'),
  schema: edaDistributionSchema,
});

const edaPages = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/data/eda/pages' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    section: z.string(),
    category: z.enum(['foundations', 'case-studies', 'reference']),
    nistSection: z.string(),
  }),
});

const guidePages = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/data/guides/fastapi-production/pages' }),
  schema: guidePageSchema,
});

const guides = defineCollection({
  loader: file('src/data/guides/fastapi-production/guide.json'),
  schema: guideMetaSchema,
});

const claudeCodePages = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/data/guides/claude-code/pages' }),
  schema: guidePageSchema,
});

const claudeCodeGuide = defineCollection({
  loader: file('src/data/guides/claude-code/guide.json'),
  schema: guideMetaSchema,
});

const aiLandscape = defineCollection({
  loader: file('src/data/ai-landscape/nodes.json'),
  schema: aiNodeSchema,
});

export const collections = { blog, languages, dbModels, edaTechniques, edaDistributions, edaPages, guidePages, guides, claudeCodePages, claudeCodeGuide, aiLandscape };
