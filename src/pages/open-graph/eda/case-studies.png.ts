import type { APIRoute } from 'astro';
import { generateEdaSectionOgImage } from '../../../lib/og-image';
import { getOrGenerateOgImage } from '../../../lib/eda/og-cache';

export const GET: APIRoute = async () => {
  const png = await getOrGenerateOgImage(
    'Case Studies',
    'Real-world NIST case studies demonstrating EDA methodology on engineering datasets',
    () => generateEdaSectionOgImage(
      'Case Studies',
      'Real-world NIST case studies demonstrating EDA methodology on engineering datasets',
      '9 Case Studies',
    ),
  );

  return new Response(png, {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
};
