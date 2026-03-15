import type { APIRoute } from 'astro';
import { generateEdaSectionOgImage } from '../../../lib/og-image';
import { getOrGenerateOgImage } from '../../../lib/eda/og-cache';

export const GET: APIRoute = async () => {
  const png = await getOrGenerateOgImage(
    'Jupyter Notebooks',
    'Hands-on EDA with 10 NIST datasets in Python',
    () => generateEdaSectionOgImage(
      'Jupyter Notebooks',
      'Hands-on EDA with 10 NIST datasets in Python',
      '10 Notebooks',
    ),
  );

  return new Response(png, {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
};
