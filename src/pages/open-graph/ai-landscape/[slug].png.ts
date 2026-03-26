import type { APIRoute, GetStaticPaths } from 'astro';
import { getCollection } from 'astro:content';
import { generateAiLandscapeOgImage } from '../../../lib/og-image';
import graphData from '../../../data/ai-landscape/graph.json';

const clusterMap = new Map(graphData.clusters.map((c) => [c.id, c]));

export const getStaticPaths: GetStaticPaths = async () => {
  const concepts = await getCollection('aiLandscape');

  return concepts.map((entry) => {
    const cluster = clusterMap.get(entry.data.cluster);
    return {
      params: { slug: entry.data.slug },
      props: {
        concept: entry.data,
        clusterName: cluster?.name ?? entry.data.cluster,
        clusterDarkColor: cluster?.darkColor ?? '#424242',
      },
    };
  });
};

export const GET: APIRoute = async ({ props }) => {
  const { concept, clusterName, clusterDarkColor } = props as {
    concept: { name: string; cluster: string; simpleDescription: string };
    clusterName: string;
    clusterDarkColor: string;
  };
  const png = await generateAiLandscapeOgImage(concept, clusterName, clusterDarkColor);

  return new Response(png, {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
};
