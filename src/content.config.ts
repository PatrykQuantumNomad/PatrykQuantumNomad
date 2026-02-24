import { defineCollection, z } from 'astro:content';
import { glob, file } from 'astro/loaders';
import { languageSchema } from './lib/beauty-index/schema';
import { dbModelSchema } from './lib/db-compass/schema';
import { edaTechniqueSchema, edaDistributionSchema } from './lib/eda/schema';

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

export const collections = { blog, languages, dbModels, edaTechniques, edaDistributions, edaPages };
