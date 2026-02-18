import type { APIRoute, GetStaticPaths } from 'astro';
import { getCollection } from 'astro:content';
import { generateVsOgImage } from '../../../../lib/og-image';
import { type Language } from '../../../../lib/beauty-index/schema';

export const getStaticPaths: GetStaticPaths = async () => {
  const languages = await getCollection('languages');
  const langs = languages.map((e) => e.data);

  const pairs: { params: { slug: string }; props: { langA: Language; langB: Language } }[] = [];

  for (let i = 0; i < langs.length; i++) {
    for (let j = 0; j < langs.length; j++) {
      if (i === j) continue;
      pairs.push({
        params: { slug: `${langs[i].id}-vs-${langs[j].id}` },
        props: { langA: langs[i], langB: langs[j] },
      });
    }
  }

  return pairs;
};

export const GET: APIRoute = async ({ props }) => {
  const { langA, langB } = props as { langA: Language; langB: Language };
  const png = await generateVsOgImage(langA, langB);

  return new Response(png, {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
};
