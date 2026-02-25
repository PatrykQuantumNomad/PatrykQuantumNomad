import type { APIRoute } from 'astro';
import { generateEdaOverviewOgImage } from '../../../lib/og-image';
import { getOrGenerateOgImage } from '../../../lib/eda/og-cache';

export const GET: APIRoute = async () => {
  const png = await getOrGenerateOgImage(
    'EDA Visual Encyclopedia',
    'Interactive visual reference for Exploratory Data Analysis',
    () => generateEdaOverviewOgImage(),
  );

  return new Response(png, {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
};
