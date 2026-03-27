import type { APIRoute, GetStaticPaths } from 'astro';
import { getCollection } from 'astro:content';
import { generateAiLandscapeVsOgImage } from '../../../../lib/og-image';
import { POPULAR_COMPARISONS } from '../../../../lib/ai-landscape/comparisons';
import graphData from '../../../../data/ai-landscape/graph.json';
import type { AiNode, Cluster } from '../../../../lib/ai-landscape/schema';

const clusterMap = new Map(graphData.clusters.map((c) => [c.id, c]));

export const getStaticPaths: GetStaticPaths = async () => {
  const entries = await getCollection('aiLandscape');
  const nodesMap = new Map<string, AiNode>(entries.map((e) => [e.data.slug, e.data as AiNode]));

  return POPULAR_COMPARISONS
    .filter((pair) => nodesMap.has(pair.concept1) && nodesMap.has(pair.concept2))
    .map((pair) => {
      const node1 = nodesMap.get(pair.concept1)!;
      const node2 = nodesMap.get(pair.concept2)!;
      const cluster1 = clusterMap.get(node1.cluster);
      const cluster2 = clusterMap.get(node2.cluster);

      return {
        params: { slug: pair.slug },
        props: {
          node1,
          node2,
          cluster1Name: cluster1?.name ?? node1.cluster,
          cluster2Name: cluster2?.name ?? node2.cluster,
          cluster1DarkColor: cluster1?.darkColor ?? '#424242',
          cluster2DarkColor: cluster2?.darkColor ?? '#424242',
        },
      };
    });
};

export const GET: APIRoute = async ({ props }) => {
  const { node1, node2, cluster1Name, cluster2Name, cluster1DarkColor, cluster2DarkColor } = props as {
    node1: { name: string; cluster: string };
    node2: { name: string; cluster: string };
    cluster1Name: string;
    cluster2Name: string;
    cluster1DarkColor: string;
    cluster2DarkColor: string;
  };

  const png = await generateAiLandscapeVsOgImage(
    node1,
    node2,
    cluster1Name,
    cluster2Name,
    cluster1DarkColor,
    cluster2DarkColor,
  );

  return new Response(png, {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
};
