import type { APIRoute } from 'astro';
import { generateEdaSectionOgImage } from '../../../lib/og-image';
import { getOrGenerateOgImage } from '../../../lib/eda/og-cache';

export const GET: APIRoute = async () => {
  const png = await getOrGenerateOgImage(
    'Graphical Techniques',
    'Interactive visualizations of 29 graphical EDA techniques from the NIST handbook',
    () => generateEdaSectionOgImage(
      'Graphical Techniques',
      'Interactive visualizations of 29 graphical EDA techniques from the NIST handbook',
      '29 Techniques',
    ),
  );

  return new Response(png, {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
};
