import type { APIRoute, GetStaticPaths } from 'astro';
import { getCollection } from 'astro:content';
import { generateLanguageOgImage } from '../../../lib/og-image';

export const getStaticPaths: GetStaticPaths = async () => {
  const languages = await getCollection('languages');

  return languages.map((entry) => ({
    params: { slug: entry.data.id },
    props: { language: entry.data },
  }));
};

export const GET: APIRoute = async ({ props }) => {
  const { language } = props as { language: Parameters<typeof generateLanguageOgImage>[0] };
  const png = await generateLanguageOgImage(language);

  return new Response(png, {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
};
