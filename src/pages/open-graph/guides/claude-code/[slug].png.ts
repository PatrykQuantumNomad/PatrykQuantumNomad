import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { generateGuideOgImage } from '../../../../lib/og-image';
import { getOrGenerateOgImage } from '../../../../lib/guides/og-cache';

export const getStaticPaths = async () => {
  const pages = await getCollection('claudeCodePages');
  return pages.map((page) => ({
    params: { slug: page.data.slug },
    props: { title: page.data.title, description: page.data.description },
  }));
};

interface OgProps {
  title: string;
  description: string;
}

export const GET: APIRoute = async ({ props }) => {
  const { title, description } = props as OgProps;

  const png = await getOrGenerateOgImage(title, description, () =>
    generateGuideOgImage(title, description, title),
  );

  return new Response(png, {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
};
