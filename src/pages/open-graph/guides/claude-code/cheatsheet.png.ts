import type { APIRoute } from 'astro';
import { generateGuideOgImage } from '../../../../lib/og-image';
import { getOrGenerateOgImage } from '../../../../lib/guides/og-cache';

export const GET: APIRoute = async () => {
  const png = await getOrGenerateOgImage(
    'Claude Code Cheatsheet',
    'Every keyboard shortcut and slash command for Claude Code interactive mode',
    () =>
      generateGuideOgImage(
        'Claude Code Cheatsheet',
        'Every keyboard shortcut and slash command for Claude Code interactive mode',
        'Cheatsheet',
      ),
  );

  return new Response(png, {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
};
