import { defineCollection, z } from 'astro:content';
import { glob, file } from 'astro/loaders';
import { languageSchema } from './lib/beauty-index/schema';
import { dbModelSchema } from './lib/db-compass/schema';

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

export const collections = { blog, languages, dbModels };
