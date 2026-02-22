import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { generateCompassOverviewOgImage } from '../../../lib/og-image';

export const GET: APIRoute = async () => {
  const dbModels = await getCollection('dbModels');
  const models = dbModels.map((entry) => ({
    id: entry.data.id,
    name: entry.data.name,
    slug: entry.data.slug,
    complexityPosition: entry.data.complexityPosition,
  }));

  const png = await generateCompassOverviewOgImage(models);

  return new Response(png, {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
};
