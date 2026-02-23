import type { APIRoute } from 'astro';
import { generateK8sAnalyzerOgImage } from '../../../lib/og-image';

export const GET: APIRoute = async () => {
  const png = await generateK8sAnalyzerOgImage();

  return new Response(png, {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
};
