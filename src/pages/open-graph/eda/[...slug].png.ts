import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { generateEdaPillarOgImage } from '../../../lib/og-image';
import { getOrGenerateOgImage } from '../../../lib/eda/og-cache';

interface OgEntry {
  slug: string;
  title: string;
  description: string;
  category: string;
}

export const getStaticPaths = async () => {
  const techniques = await getCollection('edaTechniques');
  const distributions = await getCollection('edaDistributions');
  const pages = await getCollection('edaPages');

  const entries: OgEntry[] = [];

  // Graphical techniques → /open-graph/eda/techniques/{slug}.png
  techniques
    .filter((t) => t.data.category === 'graphical')
    .forEach((t) => {
      entries.push({
        slug: `techniques/${t.data.slug}`,
        title: t.data.title,
        description: t.data.description,
        category: 'Graphical Techniques',
      });
    });

  // Quantitative techniques → /open-graph/eda/quantitative/{slug}.png
  techniques
    .filter((t) => t.data.category === 'quantitative')
    .forEach((t) => {
      entries.push({
        slug: `quantitative/${t.data.slug}`,
        title: t.data.title,
        description: t.data.description,
        category: 'Quantitative Techniques',
      });
    });

  // Distributions → /open-graph/eda/distributions/{slug}.png
  distributions.forEach((d) => {
    entries.push({
      slug: `distributions/${d.data.slug}`,
      title: d.data.title,
      description: d.data.description,
      category: 'Distributions',
    });
  });

  // Foundations, case studies, reference
  const categoryLabelMap: Record<string, string> = {
    foundations: 'Foundations',
    'case-studies': 'Case Studies',
    reference: 'Reference',
  };

  pages.forEach((page) => {
    const cat = page.data.category;
    const slug = page.id.replace(`${cat}/`, '');
    entries.push({
      slug: `${cat}/${slug}`,
      title: page.data.title,
      description: page.data.description,
      category: categoryLabelMap[cat] ?? cat,
    });
  });

  return entries.map((entry) => ({
    params: { slug: entry.slug },
    props: entry,
  }));
};

export const GET: APIRoute = async ({ props }) => {
  const { title, description, category } = props as OgEntry;

  const png = await getOrGenerateOgImage(
    title,
    description,
    () => generateEdaPillarOgImage(title, description, category),
  );

  return new Response(png, {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
};
