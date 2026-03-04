import type { APIRoute } from 'astro';
import { generateGhaValidatorOgImage } from '../../../lib/og-image';

export const GET: APIRoute = async () => {
  const png = await generateGhaValidatorOgImage();

  return new Response(png, {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
};
