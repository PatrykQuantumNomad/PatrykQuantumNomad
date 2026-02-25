import type { APIRoute } from 'astro';
import { generateEdaSectionOgImage } from '../../../lib/og-image';
import { getOrGenerateOgImage } from '../../../lib/eda/og-cache';

export const GET: APIRoute = async () => {
  const png = await getOrGenerateOgImage(
    'Probability Distributions',
    'Interactive probability distribution explorer with PDF/CDF charts and parameter sliders',
    () => generateEdaSectionOgImage(
      'Probability Distributions',
      'Interactive probability distribution explorer with PDF/CDF charts and parameter sliders',
      '19 Distributions',
    ),
  );

  return new Response(png, {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
};
