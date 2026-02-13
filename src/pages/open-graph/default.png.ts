import type { APIRoute } from 'astro';
import { generateOgImage } from '../../lib/og-image';

export const GET: APIRoute = async () => {
  const png = await generateOgImage(
    'Patryk Golabek',
    'Cloud-Native Software Architect | Kubernetes, AI/ML, Platform Engineering',
    ['Cloud-Native', 'Kubernetes', 'AI/ML', 'Platform Engineering'],
  );

  return new Response(png, {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
};
