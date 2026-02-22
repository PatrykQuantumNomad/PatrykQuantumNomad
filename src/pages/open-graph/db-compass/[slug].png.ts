import type { APIRoute, GetStaticPaths } from 'astro';
import { getCollection } from 'astro:content';
import { generateCompassModelOgImage } from '../../../lib/og-image';

export const getStaticPaths: GetStaticPaths = async () => {
  const dbModels = await getCollection('dbModels');

  return dbModels.map((entry) => ({
    params: { slug: entry.data.slug },
    props: { model: entry.data },
  }));
};

export const GET: APIRoute = async ({ props }) => {
  const { model } = props as { model: Parameters<typeof generateCompassModelOgImage>[0] };
  const png = await generateCompassModelOgImage(model);

  return new Response(png, {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
};
