import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { generateGuideOgImage } from '../../../lib/og-image';
import { getOrGenerateOgImage } from '../../../lib/guides/og-cache';

const [guideMeta] = await getCollection('guides');

export const GET: APIRoute = async () => {
  const png = await getOrGenerateOgImage(
    guideMeta.data.title,
    guideMeta.data.description,
    () =>
      generateGuideOgImage(
        guideMeta.data.title,
        guideMeta.data.description,
        'Production Guide',
      ),
  );

  return new Response(png, {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
};
